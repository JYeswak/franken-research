#!/usr/bin/env python3
"""
Candidate implementation:
* Same as baseline, but sorts releases by the ISO‑8601 "published" timestamp.
* After the table prints a summary line: "Total releases: N".
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)

def parse_timestamp(ts: str) -> datetime:
    # ISO‑8601 parsing using fromisoformat (Python 3.7+). Handles Z suffix.
    try:
        # Replace trailing Z with +00:00 for fromisoformat compatibility
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except Exception:
        # If parsing fails, use a far future date so it ends up last.
        return datetime.max

def format_table(releases):
    lines = ["| Repo | Tag | Commit | Published |",
             "|------|-----|--------|-----------|"]
    for rel in releases:
        repo = rel.get("repo", "")
        tag = rel.get("tag", "")
        commit = rel.get("commit", "")
        published = rel.get("published", "")
        lines.append(f"| {repo} | {tag} | {commit} | {published} |")
    return "\n".join(lines)

def main(argv):
    if len(argv) != 2:
        print("Usage: candidate.py <path-to-watch-json>", file=sys.stderr)
        sys.exit(1)

    data = load_json(Path(argv[1]))
    releases = [e for e in data.get("material", []) if e.get("kind") == "release"]
    # Sort by parsed timestamp (earliest first)
    releases.sort(key=lambda r: parse_timestamp(r.get("published", "")))
    table = format_table(releases)
    print(table)
    print(f"\nTotal releases: {len(releases)}")

if __name__ == "__main__":
    main(sys.argv)
