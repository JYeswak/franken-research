#!/usr/bin/env python3
"""notification-audit.py - fr-i5u proof tool for docs/NOTIFICATION-CONTRACT.md.

Matches, for a date window, every merged PR and every closed bead against
the pushed-summary log (state/notification-log.jsonl) and reports:

  - merges N, closures M, pushed pr/bead summaries, digests
  - missing summaries (event with no pushed summary)
  - duplicate summaries (same event id pushed more than once)
  - broadcast-style entries (kind outside {pr, bead, digest})
  - extra summaries (pushed summary with no matching event)

Log entries whose day (ts, else a date-shaped digest event_id) falls
outside the window are ignored, so a pre-window opening entry can never
fail an otherwise clean week.

Honesty rule: if the window end is today or in the future the verdict is
WINDOW_INCOMPLETE - the counts are partial and cannot PASS. Only a fully
elapsed window can PASS or FAIL.

Usage:
  python3 scripts/notification-audit.py [--start 2026-10-04] [--end 2026-10-10]
      [--repo .] [--log state/notification-log.jsonl] [--today YYYY-MM-DD]

Exit code: 0 for PASS or WINDOW_INCOMPLETE, 1 for FAIL, 2 for usage errors.
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

ALLOWED_KINDS = {"pr", "bead", "digest"}
PR_RE = re.compile(r"#(\d+)")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def parse_log(text):
    """Parse JSONL log text -> (entries, malformed_count). Pure."""
    entries, bad = [], 0
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            bad += 1
    return entries, bad


def entry_day(entry):
    """Best-known day of a log entry as a date, else None.

    Prefers the ts field; falls back to a date-shaped event_id (digests
    are keyed by their date). Entries with no parseable day return None
    and are always counted (they cannot be proven out-of-window).
    """
    for raw in (entry.get("ts"), entry.get("event_id")):
        if isinstance(raw, str) and DATE_RE.match(raw):
            try:
                return date.fromisoformat(raw[:10])
            except ValueError:
                continue
    return None


def in_window(entry, start, end):
    """True when the entry belongs to [start, end] (unknown day = inside)."""
    if start is None or end is None:
        return True
    day = entry_day(entry)
    return day is None or start <= day <= end


def audit(merges, closures, entries, window_complete, start=None, end=None):
    """Pure audit core. merges/closures: lists of event-id strings.
    entries: list of dicts with kind/event_id. When start/end are given,
    out-of-window entries are ignored. Returns verdict dict."""
    entries = [e for e in entries if in_window(e, start, end)]
    want = {"pr": list(merges), "bead": list(closures)}
    got = {"pr": [], "bead": []}
    digests = 0
    broadcast = []
    for e in entries:
        kind = e.get("kind")
        if kind == "digest":
            digests += 1
        elif kind in got:
            got[kind].append(str(e.get("event_id", "")))
        else:
            broadcast.append(e)

    def dupes(ids):
        seen, out = set(), []
        for i in ids:
            if i in seen and i not in out:
                out.append(i)
            seen.add(i)
        return out

    missing = {k: [i for i in want[k] if i not in got[k]] for k in want}
    extra = {k: [i for i in got[k] if i not in want[k]] for k in want}
    duplicates = {k: dupes(got[k]) for k in want}

    clean = (
        not any(missing.values())
        and not any(extra.values())
        and not any(duplicates.values())
        and not broadcast
        and digests <= 7
    )
    if not window_complete:
        status = "WINDOW_INCOMPLETE"
    else:
        status = "PASS" if clean else "FAIL"
    return {
        "status": status,
        "merges": len(merges),
        "closures": len(closures),
        "pushed_pr_summaries": len(got["pr"]),
        "pushed_bead_summaries": len(got["bead"]),
        "digests": digests,
        "missing": missing,
        "extra": extra,
        "duplicates": duplicates,
        "broadcast_style": broadcast,
    }


def git_merges(repo, start, end):
    """Merged-PR event ids (PR numbers) from git log in [start, end].

    Bounds carry explicit times: bare --since=YYYY-MM-DD is parsed by
    git approxidate in a way that can exclude same-day merges (verified
    2026-10-04: PR #25 merged 06:39 MDT was invisible to a bare-date
    --since), so this always passes full timestamps.
    """
    since = f"{start.isoformat()}T00:00:00"
    until = f"{(end + timedelta(days=1)).isoformat()}T00:00:00"
    out = subprocess.run(
        ["git", "-C", str(repo), "log", "--merges",
         f"--since={since}", f"--until={until}",
         "--format=%s"],
        capture_output=True, text=True, timeout=60,
    )
    ids = []
    for line in out.stdout.splitlines():
        m = PR_RE.search(line)
        if m:
            ids.append(m.group(1))
    return ids


def closed_beads(repo, start, end):
    """Bead ids whose closed_at falls in [start, end], from .beads store."""
    store = Path(repo) / ".beads" / "issues.jsonl"
    ids = []
    if not store.exists():
        return ids
    for line in store.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            issue = json.loads(line)
        except json.JSONDecodeError:
            continue
        closed_at = issue.get("closed_at") or ""
        if issue.get("status") == "closed" and closed_at:
            day = closed_at[:10]
            if start.isoformat() <= day <= end.isoformat():
                ids.append(str(issue.get("id", "")))
    return ids


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--start", default="2026-10-04")
    ap.add_argument("--end", default="2026-10-10")
    ap.add_argument("--repo", default=".")
    ap.add_argument("--log", default=None, help="default: <repo>/state/notification-log.jsonl")
    ap.add_argument("--today", default=None, help="override today (YYYY-MM-DD), for tests")
    args = ap.parse_args(argv)

    start = date.fromisoformat(args.start)
    end = date.fromisoformat(args.end)
    today = date.fromisoformat(args.today) if args.today else date.today()
    repo = Path(args.repo)
    log_path = Path(args.log) if args.log else repo / "state" / "notification-log.jsonl"

    merges = git_merges(repo, start, end)
    closures = closed_beads(repo, start, end)
    entries, bad = ([], 0)
    if log_path.exists():
        entries, bad = parse_log(log_path.read_text(encoding="utf-8"))

    result = audit(merges, closures, entries, window_complete=end < today,
                   start=start, end=end)
    result["window"] = {"start": args.start, "end": args.end, "today": today.isoformat()}
    result["log_path"] = str(log_path)
    result["log_entries"] = len(entries)
    result["malformed_log_lines"] = bad
    if bad:
        result["status"] = "FAIL" if result["status"] != "WINDOW_INCOMPLETE" else result["status"]
        result["malformed_is_failure"] = True
    print(json.dumps(result, indent=2))
    return 1 if result["status"] == "FAIL" else 0


if __name__ == "__main__":
    sys.exit(main())
