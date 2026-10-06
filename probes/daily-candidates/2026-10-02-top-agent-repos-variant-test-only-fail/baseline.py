#!/usr/bin/env python3
"""
Baseline implementation (manual‑style).

Keeps the original order of the discovery JSON and simply extracts the first
ten candidate entries.  This mirrors what a user would obtain by opening the
file in a viewer and copying the top rows without any automatic sorting.
"""

import sys
import json
import csv

def main() -> None:
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: baseline.py <discovery.json>\n")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("candidates", [])
    top_ten = candidates[:10]  # preserve original order

    writer = csv.writer(sys.stdout)
    writer.writerow(["repo", "stars", "score", "signal_count"])

    for cand in top_ten:
        repo = cand.get("repo", "")
        stars = cand.get("stars", 0)
        score = cand.get("score", 0)
        signals = cand.get("signals", {})
        # Count only boolean True values
        signal_count = sum(1 for v in signals.values() if v is True)
        writer.writerow([repo, stars, score, signal_count])

if __name__ == "__main__":
    main()
