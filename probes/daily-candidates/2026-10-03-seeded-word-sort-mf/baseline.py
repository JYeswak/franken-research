#!/usr/bin/env python3
"""Baseline implementation (current off-the-shelf behavior).

Reads {"words": [...]} JSON from the path in argv[1] and prints
{"sorted": [...]} in plain alphabetical order -- exactly what Python's
built-in sorted() (or `sort` on the command line) gives a user today.
It is the strongest practical existing approach for "sort these words",
but it does not provide the length-first grouping the consumers of
this list need.
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
        sys.stderr.write("Usage: baseline.py <words.json>\n")
        sys.exit(2)
    try:
        words = load_words(sys.argv[1])
    except (OSError, ValueError) as e:
        sys.stderr.write("baseline.py: invalid input: %s\n" % e)
        sys.exit(2)
    json.dump({"sorted": sorted(words)}, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
