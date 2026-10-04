#!/usr/bin/env python3
"""artifact_events.py - fr-x5h downstream instrumentation.

Mechanical use events for merged franken-research candidates.

Every merged candidate carries a stable artifact ID stamped in its
commit metadata as git trailers:

    Artifact-ID: fr-art-<slug>
    Artifact-Family: <family>

The family is the slug with its leading YYYY-MM-DD- date prefix removed
(so re-runs of the same candidate share a family).

Events are append-only JSONL (state/artifact-events.jsonl). Event kinds:
merge, citation, re-run (recorded as "re-run"), import, revert.
`revert` is the negative signal. No self-reported usefulness: callers
record only mechanical facts (a commit landed, a CI re-run executed,
a file was imported/cited by path, a revert commit was observed).

Usage:
  artifact_events.py stamp --slug <slug> --message "<commit msg>"
  artifact_events.py record --slug <slug> --event revert [--ts ISO] [--source X] [--detail Y]
  artifact_events.py record --artifact-id fr-art-<slug> --event citation ...
  artifact_events.py backfill [--repo .]   # scan git log, register merges
  artifact_events.py panel [--now ISO]      # numbers-only SNR panel
  artifact_events.py list [--artifact-id ID] [--event KIND]

Panel semantics (numbers only):
  merged_7d / merged_30d     merges in window
  survival_7d_rate           of artifacts merged >=7d ago, fraction with
                             no revert event within 7d of merge (None if
                             no artifact is old enough)
  used_30d_rate              of artifacts merged >=1d ago in last 30d,
                             fraction with >=1 citation/re-run/import
                             event within 30d of merge (None if none)
  per-family rows carry the same counts.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone

EVENT_KINDS = ("merge", "citation", "re-run", "import", "revert")
USE_KINDS = ("citation", "re-run", "import")
DEFAULT_LOG = os.path.join("state", "artifact-events.jsonl")
_DATE_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}-")


def parse_ts(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def now_iso(now=None):
    return (now or datetime.now(timezone.utc)).isoformat(timespec="seconds")


def family_of(slug):
    return _DATE_PREFIX.sub("", str(slug or "").strip())


def artifact_id(slug):
    slug = str(slug or "").strip()
    return "fr-art-" + slug if slug else None


def stamp_commit_message(message, slug):
    """Append Artifact-ID / Artifact-Family trailers if absent."""
    aid = artifact_id(slug)
    if not aid:
        return message
    msg = str(message or "")
    if re.search(r"^Artifact-ID:\s*\S+", msg, re.M):
        return msg
    trailer = "Artifact-ID: %s\nArtifact-Family: %s" % (aid, family_of(slug))
    return msg.rstrip("\n") + "\n\n" + trailer + "\n"


def parse_trailers(message):
    out = {}
    for key in ("Artifact-ID", "Artifact-Family"):
        m = re.search(r"^%s:\s*(\S+)\s*$" % key, str(message or ""), re.M)
        if m:
            out[key] = m.group(1)
    return out


def slug_from_artifact_id(aid):
    return aid[len("fr-art-"):] if aid and aid.startswith("fr-art-") else None


def record_event(log_path, aid=None, slug=None, event=None, ts=None,
                 source="manual", detail=None):
    if event not in EVENT_KINDS:
        raise ValueError("event must be one of %s" % (EVENT_KINDS,))
    if not aid:
        aid = artifact_id(slug)
    if not aid:
        raise ValueError("artifact id or slug required")
    slug = slug or slug_from_artifact_id(aid)
    rec = {
        "artifact_id": aid,
        "family": family_of(slug) if slug else None,
        "slug": slug,
        "event": event,
        "ts": now_iso(parse_ts(ts)) if ts else now_iso(),
        "source": source,
        "detail": detail,
    }
    d = os.path.dirname(os.path.abspath(log_path))
    os.makedirs(d, exist_ok=True)
    with open(log_path, "a") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
    return rec


def load_events(log_path):
    events = []
    if not os.path.exists(log_path):
        return events
    with open(log_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            if isinstance(rec, dict) and rec.get("artifact_id"):
                events.append(rec)
    return events


def query_events(events, aid=None, kind=None):
    return [e for e in events
            if (aid is None or e.get("artifact_id") == aid)
            and (kind is None or e.get("event") == kind)]


def compute_panel(events, now=None):
    now = now or datetime.now(timezone.utc)
    merges = {}
    for e in events:
        if e.get("event") == "merge":
            ts = parse_ts(e.get("ts"))
            if ts and (e["artifact_id"] not in merges
                       or ts < merges[e["artifact_id"]]):
                merges[e["artifact_id"]] = ts
    by_family = {}
    for e in events:
        fam = e.get("family") or family_of(e.get("slug") or "")
        by_family.setdefault(fam, []).append(e)

    def window_count(days):
        return sum(1 for ts in merges.values()
                   if now - timedelta(days=days) <= ts <= now)

    old7 = [aid for aid, ts in merges.items() if now - ts >= timedelta(days=7)]
    surv = None
    if old7:
        ok = 0
        for aid in old7:
            mt = merges[aid]
            bad = any(e.get("event") == "revert"
                      and parse_ts(e.get("ts"))
                      and mt <= parse_ts(e["ts"]) <= mt + timedelta(days=7)
                      for e in events if e.get("artifact_id") == aid)
            ok += 0 if bad else 1
        surv = round(ok / len(old7), 4)
    recent = [aid for aid, ts in merges.items()
              if now - timedelta(days=30) <= ts <= now - timedelta(days=0)]
    used = None
    if recent:
        hit = 0
        for aid in recent:
            mt = merges[aid]
            yes = any(e.get("event") in USE_KINDS
                      and parse_ts(e.get("ts"))
                      and mt <= parse_ts(e["ts"]) <= mt + timedelta(days=30)
                      for e in events if e.get("artifact_id") == aid)
            hit += 1 if yes else 0
        used = round(hit / len(recent), 4)
    fams = {}
    for fam, evs in sorted(by_family.items()):
        fams[fam] = {
            "merged": len({e["artifact_id"] for e in evs
                           if e.get("event") == "merge"}),
            "citation": sum(1 for e in evs if e.get("event") == "citation"),
            "re-run": sum(1 for e in evs if e.get("event") == "re-run"),
            "import": sum(1 for e in evs if e.get("event") == "import"),
            "revert": sum(1 for e in evs if e.get("event") == "revert"),
        }
    return {
        "generated_at": now_iso(now),
        "merged_total": len(merges),
        "merged_7d": window_count(7),
        "merged_30d": window_count(30),
        "survival_7d_rate": surv,
        "survival_7d_n": len(old7),
        "used_30d_rate": used,
        "used_30d_n": len(recent),
        "events_total": len(events),
        "reverts_total": sum(1 for e in events if e.get("event") == "revert"),
        "families": fams,
    }


def render_panel(panel):
    def pct(v):
        return "n/a" if v is None else "%.1f%%" % (100.0 * v)
    lines = [
        "artifact_snr: merged_7d=%d merged_30d=%d merged_total=%d "
        "survival_7d=%s (n=%d) used_30d=%s (n=%d) reverts=%d events=%d"
        % (panel["merged_7d"], panel["merged_30d"], panel["merged_total"],
           pct(panel["survival_7d_rate"]), panel["survival_7d_n"],
           pct(panel["used_30d_rate"]), panel["used_30d_n"],
           panel["reverts_total"], panel["events_total"])]
    for fam, c in panel["families"].items():
        lines.append(
            "family %s: merged=%d citation=%d re-run=%d import=%d revert=%d"
            % (fam, c["merged"], c["citation"], c["re-run"], c["import"],
               c["revert"]))
    return "\n".join(lines) + "\n"


def scan_git_merges(repo="."):
    """Mechanical merge discovery from git history.

    A candidate is identified by (in priority order) an Artifact-ID
    trailer, or the probes/daily-candidates/<slug>/ path it touched.
    The earliest commit touching it is its merge-era timestamp.
    """
    fmt = "%x1e%H%x1f%cI%x1f%s%x1f%b"
    out = subprocess.run(
        ["git", "-C", repo, "log", "--format=" + fmt, "--name-only"],
        capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        raise RuntimeError("git log failed: " + out.stderr[:300])
    found = {}
    for chunk in out.stdout.split("\x1e"):
        chunk = chunk.strip("\n")
        if not chunk:
            continue
        head, _, paths_blob = chunk.partition("\n")
        parts = head.split("\x1f")
        if len(parts) < 4:
            continue
        sha, cdate, subject, body = parts[0], parts[1], parts[2], parts[3]
        trailers = parse_trailers(body)
        slug = None
        if trailers.get("Artifact-ID"):
            slug = slug_from_artifact_id(trailers["Artifact-ID"])
        if not slug:
            m = re.search(r"probes/daily-candidates/([^/\s]+)/",
                          paths_blob or "")
            if m:
                slug = m.group(1)
        if not slug:
            m = re.search(r"\[research-candidate\]\s+(\d{4}-\d{2}-\d{2}-\S+)",
                          subject)
            if m:
                slug = m.group(1).rstrip("]")
        if slug:
            aid = artifact_id(slug)
            ts = parse_ts(cdate)
            if aid not in found or (ts and ts < found[aid]["ts"]):
                found[aid] = {"artifact_id": aid, "slug": slug,
                              "family": family_of(slug), "ts": ts,
                              "sha": sha}
    return found


def backfill(log_path, repo="."):
    events = load_events(log_path)
    have = {(e["artifact_id"], e.get("ts"))
            for e in events if e.get("event") == "merge"}
    added = []
    for aid, info in sorted(scan_git_merges(repo).items()):
        key = (aid, now_iso(info["ts"]) if info["ts"] else None)
        if key in have or any(e["artifact_id"] == aid
                              and e.get("event") == "merge" for e in events):
            continue
        rec = record_event(log_path, aid=aid, slug=info["slug"],
                           event="merge", ts=key[1] or now_iso(),
                           source="git-log-backfill",
                           detail="commit %s" % (info["sha"][:12],))
        added.append(rec)
        events.append(rec)
    return added


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--log", default=DEFAULT_LOG)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("stamp")
    p.add_argument("--slug", required=True)
    p.add_argument("--message", required=True)
    p = sub.add_parser("record")
    p.add_argument("--slug")
    p.add_argument("--artifact-id")
    p.add_argument("--event", required=True, choices=EVENT_KINDS)
    p.add_argument("--ts")
    p.add_argument("--source", default="manual")
    p.add_argument("--detail")
    p = sub.add_parser("backfill")
    p.add_argument("--repo", default=".")
    p = sub.add_parser("panel")
    p.add_argument("--now")
    p = sub.add_parser("list")
    p.add_argument("--artifact-id")
    p.add_argument("--event", choices=EVENT_KINDS)
    args = ap.parse_args(argv)
    if args.cmd == "stamp":
        sys.stdout.write(stamp_commit_message(args.message, args.slug))
        return 0
    if args.cmd == "record":
        rec = record_event(args.log, aid=args.artifact_id, slug=args.slug,
                           event=args.event, ts=args.ts,
                           source=args.source, detail=args.detail)
        print(json.dumps(rec, sort_keys=True))
        return 0
    if args.cmd == "backfill":
        added = backfill(args.log, repo=args.repo)
        print(json.dumps({"added": len(added),
                          "artifact_ids": [a["artifact_id"] for a in added]},
                         indent=2))
        return 0
    if args.cmd == "panel":
        panel = compute_panel(load_events(args.log),
                              now=parse_ts(args.now))
        sys.stdout.write(render_panel(panel))
        return 0
    if args.cmd == "list":
        for e in query_events(load_events(args.log), aid=args.artifact_id,
                              kind=args.event):
            print(json.dumps(e, sort_keys=True))
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
