#!/usr/bin/env python3
"""
Candidate implementation.

* Loads the discovery JSON.
* Sorts all candidates by the numeric ``score`` field (descending).
* Picks the top ten entries.
* Emits a RFC‑4180 CSV with columns: repo, stars, score, signal_count.
  ``signal_count`` is the number of true values inside the ``signals`` map.
"""

import sys
import json
import csv

def main() -> None:
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: candidate.py <discovery.json>\n")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("candidates", [])
    # Sort by score descending; missing scores are treated as 0.
    sorted_candidates = sorted(
        candidates,
        key=lambda c: c.get("score", 0),
        reverse=True,
    )
    top_ten = sorted_candidates[:10]

    writer = csv.writer(sys.stdout)
    writer.writerow(["repo", "stars", "score", "signal_count"])

    for cand in top_ten:
        repo = cand.get("repo", "")
        stars = cand.get("stars", 0)
        score = cand.get("score", 0)
        signals = cand.get("signals", {})
        signal_count = sum(1 for v in signals.values() if v is True)
        writer.writerow([repo, stars, score, signal_count])

if __name__ == "__main__":
    main()
