#!/usr/bin/env python3
"""notify-push.py - record one pushed summary under the fr-i5u contract.

The only supported writer for state/notification-log.jsonl
(docs/NOTIFICATION-CONTRACT.md). The pushing agent runs this in the main
checkout at the moment a summary is pushed:

  python3 scripts/notify-push.py --kind bead --event-id fr-xxx --chat franken-research
  python3 scripts/notify-push.py --kind pr --event-id 25 --chat franken-research
  python3 scripts/notify-push.py --kind digest --event-id 2026-10-04 --chat franken-research

Exactly-once is enforced at the source: a second call with the same
(kind, event_id) appends nothing and reports already-logged, so a retry
or re-delivery can never create the duplicate the contract forbids.
Kinds outside {pr, bead, digest} are rejected - broadcast-style entries
cannot be written through this tool.

Prints one JSON line. Exit 0 on logged/already-logged, 2 on bad input.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ALLOWED_KINDS = {"pr", "bead", "digest"}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kind", required=True, help="pr | bead | digest")
    ap.add_argument("--event-id", required=True,
                    help="PR number, bead id, or digest date (YYYY-MM-DD)")
    ap.add_argument("--chat", required=True, help="owning chat the summary was pushed to")
    ap.add_argument("--repo", default=".", help="repo root (default: .)")
    ap.add_argument("--log", default=None,
                    help="default: <repo>/state/notification-log.jsonl")
    ap.add_argument("--ts", default=None,
                    help="ISO timestamp override (tests); default: now, UTC")
    args = ap.parse_args(argv)

    if args.kind not in ALLOWED_KINDS:
        print(json.dumps({"status": "rejected",
                          "reason": f"kind must be one of {sorted(ALLOWED_KINDS)}"}))
        return 2
    if not args.event_id.strip():
        print(json.dumps({"status": "rejected", "reason": "event-id must be non-empty"}))
        return 2

    log_path = (Path(args.log) if args.log
                else Path(args.repo) / "state" / "notification-log.jsonl")

    existing = []
    if log_path.exists():
        for line in log_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                existing.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    for e in existing:
        if e.get("kind") == args.kind and str(e.get("event_id")) == args.event_id:
            print(json.dumps({"status": "already-logged", "kind": args.kind,
                              "event_id": args.event_id, "log": str(log_path)}))
            return 0

    ts = args.ts or datetime.now(timezone.utc).isoformat()
    entry = {"ts": ts, "kind": args.kind, "event_id": args.event_id, "chat": args.chat}
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")
    print(json.dumps({"status": "logged", **entry, "log": str(log_path)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
