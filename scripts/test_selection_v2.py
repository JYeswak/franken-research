#!/usr/bin/env python3
"""Tests for selection_v2 (fr-jga). Run: python3 scripts/test_selection_v2.py"""
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import selection_v2 as sv

CENSUS = (
    "repo\tpin\thead\thead_date\tcommits_since_pin\treleases_since_pin\t"
    "license_spdx\tlicense_changed_since_pin\tworkflows_count\t"
    "workflows_changed_since_pin\tarchived\tmaterial_since_pin\n"
    "repo_a\tp\th\t2026-10-01T00:00:00Z\t10\tnone\tMIT\tno\t1\tno\tno\tno\n"
    "repo_b\tp\th\t2026-10-01T00:00:00Z\t20\tv1.0\tMIT\tno\t1\tno\tno\t"
    "yes: release v1.0 (2026-10-01, abc)\n"
)


class TestVoI(unittest.TestCase):
    def test_material_outranks_quiet(self):
        with tempfile.NamedTemporaryFile("w", suffix=".tsv",
                                         delete=False) as f:
            f.write(CENSUS)
            path = f.name
        try:
            res = sv.select(sv.census_candidates(path))
        finally:
            os.unlink(path)
        self.assertEqual(res["pick"]["repo"], "repo_b")
        self.assertGreater(res["pick"]["voi"], 0)
        self.assertTrue(all("voi" in r for r in res["scored"]))

    def test_feasibility_rejected_with_reason(self):
        bad = {"repo": "x", "requires_packages": True, "patch_kib": 9999}
        res = sv.select([bad])
        self.assertIsNone(res["pick"])
        self.assertEqual(len(res["rejected"]), 1)
        reasons = " ".join(res["rejected"][0]["rejected"])
        self.assertIn("stdlib", reasons)
        self.assertIn("patch", reasons)

    def test_exploration_every_seventh(self):
        self.assertFalse(sv.is_exploration_night(0))
        self.assertTrue(sv.is_exploration_night(6))
        self.assertTrue(sv.is_exploration_night(13))
        cands = [{"repo": "known", "family": "known",
                  "baseline_approach": "b", "falsification": "f",
                  "decision_value": 5},
                 {"repo": "new", "family": "new",
                  "baseline_approach": "b", "falsification": "f",
                  "decision_value": 1}]
        bandit = {"families": {"known": {"reward": 1.0, "merged": 9}}}
        res = sv.select(cands, bandit, night_index=6)
        self.assertEqual(res["mode"], "explore")
        self.assertEqual(res["pick"]["repo"], "new")

    def test_bandit_from_events(self):
        now = datetime(2026, 10, 4, tzinfo=timezone.utc)
        events = [
            {"family": "fam", "event": "merge", "ts": "2026-10-01T00:00:00Z"},
            {"family": "fam", "event": "citation",
             "ts": "2026-10-02T00:00:00Z"},
            {"family": "fam", "event": "revert",
             "ts": "2026-10-03T00:00:00Z"},
            {"family": "old", "event": "citation",
             "ts": "2026-01-01T00:00:00Z"},
        ]
        table = sv.compute_bandit(events, now)
        self.assertEqual(table["families"]["fam"]["reward"], -1.0)
        self.assertNotIn("old", table["families"])


if __name__ == "__main__":
    unittest.main()
