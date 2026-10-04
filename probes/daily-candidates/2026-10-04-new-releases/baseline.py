#!/usr/bin/env python3
"""
Baseline implementation:
* Load the JSON file.
* Filter for entries where "kind" == "release".
* Emit a markdown table (Repo | Tag | Commit | Published) in the original order.
"""

import json
import sys
from pathlib import Path

def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)

def format_table(releases):
    # Header
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
        print("Usage: baseline.py <path-to-watch-json>", file=sys.stderr)
        sys.exit(1)

    data = load_json(Path(argv[1]))
    releases = [e for e in data.get("material", []) if e.get("kind") == "release"]
    table = format_table(releases)
    print(table)

if __name__ == "__main__":
    main(sys.argv)
