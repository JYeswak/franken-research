"""
Test suite for the seeded word-sort candidate (fr-656 rehearsal).

Oracles are independent of the two implementations: the expected lists
below are hardcoded literals worked out by hand from the two ordering
rules (candidate: ascending length, then ascending Python string
order; baseline: plain alphabetical), and both scripts must match
them. A property oracle additionally checks the candidate output
directly against the ordering spec.
"""

import json
import pathlib
import subprocess
import sys
import tempfile

BASELINE = pathlib.Path("baseline.py")
CANDIDATE = pathlib.Path("candidate.py")
FIXTURE_INPUT = pathlib.Path("fixtures/input.json")
FIXTURE_TRANSFER = pathlib.Path("fixtures/transfer.json")

# Candidate order, hand-computed from fixtures/input.json:
# len3: fig, fig | len4: date, kiwi, plum | len5: apple |
# len6: banana, cherry | len7: Apricot | len10: elderberry
EXPECTED_INPUT = [
    "fig", "fig", "date", "kiwi", "plum",
    "apple", "banana", "cherry", "Apricot", "elderberry",
]

# Candidate order, hand-computed from fixtures/transfer.json:
# len1: a, b | len2: aa, aa, ab, bb | len3: ccc | len4: dddd
EXPECTED_TRANSFER = ["a", "b", "aa", "aa", "ab", "bb", "ccc", "dddd"]

# Baseline (plain alphabetical) orders, likewise hand-computed.
EXPECTED_INPUT_ALPHA = [
    "Apricot", "apple", "banana", "cherry", "date",
    "elderberry", "fig", "fig", "kiwi", "plum",
]
EXPECTED_TRANSFER_ALPHA = ["a", "aa", "aa", "ab", "b", "bb", "ccc", "dddd"]


def run_script(script: pathlib.Path, json_path: pathlib.Path) -> list:
    """Execute a script and return the parsed 'sorted' list."""
    proc = subprocess.run(
        [sys.executable, str(script), str(json_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)["sorted"]


def test_candidate_matches_handcomputed_oracles():
    # Oracle 1: candidate output equals the hardcoded expected lists,
    # which were derived by hand from the specified ordering.
    assert run_script(CANDIDATE, FIXTURE_INPUT) == EXPECTED_INPUT, \
        "Candidate output on input fixture != hand-computed expected list"
    assert run_script(CANDIDATE, FIXTURE_TRANSFER) == EXPECTED_TRANSFER, \
        "Candidate output on transfer fixture != hand-computed expected list"


def test_baseline_is_plain_alphabetical():
    # Oracle 2: the baseline really is the off-the-shelf alphabetical
    # sort it claims to be, on both fixtures.
    assert run_script(BASELINE, FIXTURE_INPUT) == EXPECTED_INPUT_ALPHA, \
        "Baseline output on input fixture != hand-computed alphabetical list"
    assert run_script(BASELINE, FIXTURE_TRANSFER) == EXPECTED_TRANSFER_ALPHA, \
        "Baseline output on transfer fixture != hand-computed alphabetical list"


def test_candidate_output_satisfies_spec():
    # Oracle 3 (property): candidate output is a permutation of the
    # input and its (length, word) keys are non-decreasing -- checked
    # directly against the spec, not against either implementation.
    for fixture in (FIXTURE_INPUT, FIXTURE_TRANSFER):
        words = json.loads(fixture.read_text())["words"]
        out = run_script(CANDIDATE, fixture)
        assert sorted(out) == sorted(words), \
            "Candidate output is not a permutation of %s" % fixture
        keys = [(len(w), w) for w in out]
        assert keys == sorted(keys), \
            "Candidate output violates the (length, word) ordering on %s" % fixture


def test_edge_cases():
    # Oracle 4: empty list and malformed input behave per the recipe
    # contract ({"sorted": []} for empty; exit 2 for malformed).
    with tempfile.TemporaryDirectory() as td:
        empty = pathlib.Path(td) / "empty.json"
        empty.write_text(json.dumps({"words": []}))
        for script in (BASELINE, CANDIDATE):
            assert run_script(script, empty) == [], \
                "%s mishandles the empty list" % script
        bad = pathlib.Path(td) / "bad.json"
        bad.write_text(json.dumps({"words": [1, 2, 3]}))
        for script in (BASELINE, CANDIDATE):
            proc = subprocess.run(
                [sys.executable, str(script), str(bad)],
                capture_output=True,
                text=True,
            )
            assert proc.returncode == 2, \
                "%s should exit 2 on non-string entries" % script


if __name__ == "__main__":
    test_candidate_matches_handcomputed_oracles()
    test_baseline_is_plain_alphabetical()
    test_candidate_output_satisfies_spec()
    test_edge_cases()
    print("All tests passed.")
