#!/usr/bin/env python3
"""Tests for scripts/candidate-shape.py (bead fr-tww).

Run: python3 scripts/test_candidate_shape.py

Planted-defect tests are the acceptance contract: a synthetic candidate
that conforms passes; each planted contract violation (missing file,
byte-identical fixtures, tampered execution.json, code edited after
the harness ran) fails; reverting restores green. Defects are planted
in temp copies, never in the committed corpus. The final test checks
every committed candidate under probes/daily-candidates/.
"""
import hashlib
import importlib.util
import json
import pathlib
import shutil
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve()
spec = importlib.util.spec_from_file_location(
    "candidate_shape", HERE.with_name("candidate-shape.py"))
cs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cs)

REPO = HERE.parents[1]
SOURCE = REPO / "probes" / "daily-candidates" / "2026-10-03-seeded-word-sort"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class CandidateShape(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.candidate = pathlib.Path(self.t.name) / SOURCE.name
        shutil.copytree(SOURCE, self.candidate)

    def tearDown(self):
        self.t.cleanup()

    def test_committed_fixture_conforms(self):
        self.assertEqual(cs.check_candidate(self.candidate), [])

    def test_missing_required_file_fails(self):
        (self.candidate / "test.py").unlink()
        problems = cs.check_candidate(self.candidate)
        self.assertTrue(any("test.py" in p for p in problems), problems)

    def test_identical_fixtures_fail(self):
        (self.candidate / "fixtures" / "transfer.json").write_bytes(
            (self.candidate / "fixtures" / "input.json").read_bytes())
        problems = cs.check_candidate(self.candidate)
        self.assertTrue(any("byte-identical" in p for p in problems), problems)

    def test_tampered_execution_hash_fails_then_revert_restores(self):
        path = self.candidate / "execution.json"
        original = path.read_bytes()
        record = json.loads(original)
        record["runs"][0]["output_sha256"] = "0" * 64
        path.write_text(json.dumps(record))
        problems = cs.check_candidate(self.candidate)
        self.assertTrue(any("sha256" in p for p in problems), problems)
        path.write_bytes(original)
        self.assertEqual(cs.check_candidate(self.candidate), [])

    def test_code_edited_after_harness_run_fails(self):
        path = self.candidate / "candidate.py"
        path.write_bytes(path.read_bytes() + b"\ndef planted_drift(:\n")
        problems = cs.check_candidate(self.candidate)
        self.assertTrue(any("candidate" in p for p in problems), problems)

    def test_every_committed_candidate_conforms(self):
        candidates = cs.find_candidates(REPO)
        self.assertGreaterEqual(len(candidates), 1)
        for candidate in candidates:
            self.assertEqual(cs.check_candidate(candidate), [],
                             candidate.name)


if __name__ == "__main__":
    unittest.main()
