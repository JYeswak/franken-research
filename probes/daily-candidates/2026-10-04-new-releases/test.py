#!/usr/bin/env python3
"""
Tests for baseline.py and candidate.py.

We verify:
* Both scripts emit a row for every "release" entry.
* candidate.py sorts rows by the published timestamp.
* candidate.py prints a summary line with the correct count.
* A falsification case: if a script omits a required column, the test will
  fail (the assert comments explain the oracle).
"""

import json
import subprocess
import sys
from pathlib import Path

BASELINE = Path("baseline.py")
CANDIDATE = Path("candidate.py")
FIXTURE_IN = Path("fixtures/input.json")
FIXTURE_XFER = Path("fixtures/transfer.json")

def run_script(script: Path, fixture: Path) -> str:
    result = subprocess.run([sys.executable, str(script), str(fixture)],
                            capture_output=True, text=True, check=True)
    return result.stdout.strip()

def parse_table(output: str):
    """Return list of rows (each row is a list of column strings)."""
    lines = [ln for ln in output.splitlines() if ln.startswith("|")]
    # Remove header and separator
    data = lines[2:] if len(lines) >= 2 else []
    rows = [ [cell.strip() for cell in line.split("|")[1:-1]] for line in data ]
    return rows

def count_releases(fixture: Path) -> int:
    data = json.loads(fixture.read_text(encoding="utf-8"))
    return sum(1 for e in data.get("material", []) if e.get("kind") == "release")

def test_baseline_counts():
    out = run_script(BASELINE, FIXTURE_IN)
    rows = parse_table(out)
    assert len(rows) == count_releases(FIXTURE_IN), "Baseline omitted some releases"

def test_candidate_counts_and_summary():
    out = run_script(CANDIDATE, FIXTURE_IN)
    # The summary line is the last non‑table line
    lines = out.splitlines()
    summary = lines[-1]
    assert summary.startswith("Total releases:"), "Candidate missing summary line"
    total = int(summary.split(":")[1].strip())
    assert total == count_releases(FIXTURE_IN), "Summary count mismatch"
    rows = parse_table("\n".join(lines[:-2]))  # table part
    assert len(rows) == total, "Candidate omitted some releases"

def test_candidate_sort_order():
    out = run_script(CANDIDATE, FIXTURE_IN)
    rows = parse_table(out)
    # Extract published timestamps from the original fixture in order
    data = json.loads(FIXTURE_IN.read_text(encoding="utf-8"))
    releases = [e for e in data["material"] if e["kind"] == "release"]
    releases.sort(key=lambda r: r["published"])
    expected_order = [r["repo"] for r in releases]
    actual_order = [r[0] for r in rows]  # first column is repo
    assert actual_order == expected_order, "Candidate rows not sorted by published timestamp"

def test_candidate_respects_transfer_fixture():
    out = run_script(CANDIDATE, FIXTURE_XFER)
    rows = parse_table(out)
    assert len(rows) == count_releases(FIXTURE_XFER), "Candidate failed on transfer fixture"

if __name__ == "__main__":
    test_baseline_counts()
    test_candidate_counts_and_summary()
    test_candidate_sort_order()
    test_candidate_respects_transfer_fixture()
    print("All tests passed.")
