#!/usr/bin/env python3
"""Candidate implementation.

Same input/output contract as baseline.py: reads {"words": [...]}
JSON from argv[1] and prints {"sorted": [...]}. The difference is the
ordering: ascending length first, then ascending Python string order
(Unicode code points), implemented with an explicit key function over
the built-in Timsort. This is the deterministic ordering the recipe
specifies; the alphabetical baseline cannot provide it.
"""

import json
import sys


def load_words(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    words = data.get("words")
    if not isinstance(words, list) or not all(
        isinstance(w, str) for w in words
    ):
        raise ValueError("input must be an object with a 'words' list of strings")
    return words


def main() -> None:
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: candidate.py <words.json>\n")
        sys.exit(2)
    try:
        words = load_words(sys.argv[1])
    except (OSError, ValueError) as e:
        sys.stderr.write("candidate.py: invalid input: %s\n" % e)
        sys.exit(2)
    json.dump({"sorted": sorted(words, key=lambda w: (len(w), w))}, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
