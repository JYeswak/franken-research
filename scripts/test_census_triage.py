#!/usr/bin/env python3
"""test_census_triage.py - fr-census-triage tests (stdlib unittest).

Covers: material ranks above informational; kind bonuses (license >
release > workflows); census context (commits + material flag) breaks
ordering deterministically; ties break on repo name (byte-stable);
missing changes file is a clean exit-2, never a traceback.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import census_triage as ct  # noqa: E402

FR = "/Users/josh/Developer/franken-research"


def entry(repo, kind, title="t"):
    return {"repo": repo, "kind": kind, "label": kind, "title": title,
            "summary": "s", "affects": [], "evidence": ["https://x"]}


class TestRank(unittest.TestCase):
    def test_material_above_informational(self):
        changes = {"material": [entry("a-repo", "workflows")],
                   "informational": [entry("b-repo", "license")]}
        ranked = ct.rank_entries(changes, {})
        self.assertEqual(ranked[0]["repo"], "a-repo")
        self.assertEqual(ranked[0]["tier"], "material")

    def test_kind_bonus_order(self):
        changes = {"material": [entry("w-repo", "workflows"),
                                entry("r-repo", "release"),
                                entry("l-repo", "license")],
                   "informational": []}
        ranked = ct.rank_entries(changes, {})
        self.assertEqual([r["repo"] for r in ranked],
                         ["l-repo", "r-repo", "w-repo"])

    def test_census_context_boost(self):
        changes = {"material": [entry("plain", "release"),
                                entry("hot", "release")],
                   "informational": []}
        census = {"hot": {"commits_since_pin": "500",
                          "material_since_pin": "yes",
                          "releases_since_pin": "v2"}}
        ranked = ct.rank_entries(changes, census)
        self.assertEqual(ranked[0]["repo"], "hot")
        self.assertEqual(ranked[0]["commits_since_pin"], 500)
        self.assertGreater(ranked[0]["score"], ranked[1]["score"])

    def test_tie_breaks_on_repo_name(self):
        changes = {"material": [entry("zeta", "release"),
                                entry("alpha", "release")],
                   "informational": []}
        ranked = ct.rank_entries(changes, {})
        self.assertEqual([r["repo"] for r in ranked], ["alpha", "zeta"])
        self.assertEqual([r["rank"] for r in ranked], [1, 2])

    def test_deterministic_repeat(self):
        changes = {"material": [entry("b", "license"), entry("a", "tag")],
                   "informational": [entry("c", "workflows")]}
        self.assertEqual(ct.rank_entries(changes, {}),
                         ct.rank_entries(changes, {}))


class TestRealSnapshot(unittest.TestCase):
    def test_2026_10_21_snapshot(self):
        changes = os.path.join(FR, "watch", "changes", "2026-10-21.json")
        census = os.path.join(FR, "watch", "census", "2026-10-21.tsv")
        if not os.path.exists(changes):
            self.skipTest("snapshot not present")
        art = ct.build_artifact("2026-10-21", changes, census)
        doc = json.load(open(changes))
        self.assertEqual(art["counts"]["material"],
                         len(doc.get("material") or []))
        self.assertEqual(art["counts"]["ranked"],
                         len(doc.get("material") or [])
                         + len(doc.get("informational") or []))
        self.assertEqual(len(art["seed_queue"]), art["counts"]["ranked"])
        self.assertEqual(len(art["sources"]["changes_sha256"]), 64)


class TestCli(unittest.TestCase):
    def test_missing_changes_exit_2(self):
        with tempfile.TemporaryDirectory() as td:
            r = subprocess.run(
                [sys.executable,
                 os.path.join(FR, "scripts", "census_triage.py"),
                 "--date", "1999-01-01",
                 "--changes", os.path.join(td, "nope.json"),
                 "--out", os.path.join(td, "out.json"),
                 "--seed-out", os.path.join(td, "seed.json")],
                capture_output=True, text=True, timeout=30)
            self.assertEqual(r.returncode, 2)
            self.assertIn("NO_CHANGES", r.stdout)


if __name__ == "__main__":
    unittest.main()
