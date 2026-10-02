"""
Test suite for the top‑10 Rust repository scripts.

The tests compare the output of `baseline.py` (unsorted, first‑ten) with
`candidate.py` (sorted by score, correct signal counts).  All assertions are
documented so that each oracle is transparent.
"""

import subprocess
import sys
import csv
import pathlib
import json

BASELINE = pathlib.Path("baseline.py")
CANDIDATE = pathlib.Path("candidate.py")
FIXTURE_INPUT = pathlib.Path("fixtures/input.json")
FIXTURE_TRANSFER = pathlib.Path("fixtures/transfer.json")

def run_script(script: pathlib.Path, json_path: pathlib.Path) -> list:
    """Execute a script and return the parsed CSV rows (including header)."""
    proc = subprocess.run(
        [sys.executable, str(script), str(json_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    reader = csv.reader(proc.stdout.splitlines())
    return list(reader)

def compute_signal_count(signals: dict) -> int:
    """Count only boolean True values – mirrors the script logic."""
    return sum(1 for v in signals.values() if v is True)

def test_candidate_on_input():
    rows = run_script(CANDIDATE, FIXTURE_INPUT)
    # Oracle 1: header is present and correctly ordered.
    assert rows[0] == ["repo", "stars", "score", "signal_count"], "Header mismatch"

    data = json.loads(FIXTURE_INPUT.read_text())
    candidates = data["candidates"]
    # Oracle 2: exactly ten data rows (input has >10 candidates).
    assert len(rows) - 1 == 10, "Candidate output should contain ten rows"

    # Oracle 3: rows are sorted by descending score.
    scores = [float(r[2]) for r in rows[1:]]
    assert scores == sorted(scores, reverse=True), "Scores not sorted descending"

    # Oracle 4: signal_count matches true‑value count.
    for row in rows[1:]:
        repo = row[0]
        # locate original entry
        orig = next(c for c in candidates if c["repo"] == repo)
        expected = compute_signal_count(orig.get("signals", {}))
        assert int(row[3]) == expected, f"Wrong signal_count for {repo}"

def test_baseline_on_input():
    rows = run_script(BASELINE, FIXTURE_INPUT)
    # Oracle 1: header present.
    assert rows[0] == ["repo", "stars", "score", "signal_count"], "Header mismatch"

    # Oracle 2: first data row equals the first candidate in the raw JSON.
    first_candidate = json.loads(FIXTURE_INPUT.read_text())["candidates"][0]["repo"]
    assert rows[1][0] == first_candidate, "Baseline did not preserve original order"

def test_candidate_on_transfer():
    rows = run_script(CANDIDATE, FIXTURE_TRANSFER)
    # Oracle 1: ten rows (transfer fixture also has >10 entries).
    assert len(rows) - 1 == 10, "Transfer output row count"

    data = json.loads(FIXTURE_TRANSFER.read_text())
    candidates = data["candidates"]
    scores = [float(r[2]) for r in rows[1:]]
    assert scores == sorted(scores, reverse=True), "Transfer scores not sorted"

    for row in rows[1:]:
        repo = row[0]
        orig = next(c for c in candidates if c["repo"] == repo)
        expected = compute_signal_count(orig.get("signals", {}))
        assert int(row[3]) == expected, f"Transfer signal_count wrong for {repo}"

if __name__ == "__main__":
    test_candidate_on_input()
    test_baseline_on_input()
    test_candidate_on_transfer()
    print("All tests passed.")
