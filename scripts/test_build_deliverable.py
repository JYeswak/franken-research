#!/usr/bin/env python3
"""Tests for scripts/build-deliverable.py (bead fr-3tw).

Run: python3 scripts/test_build_deliverable.py
"""
import importlib.util
import json
import pathlib
import sys
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location(
    "build_deliverable", pathlib.Path(__file__).with_name("build-deliverable.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def make_repo(root: pathlib.Path):
    repo = root / "repo"
    (repo / "packets").mkdir(parents=True)
    (repo / "synthesis").mkdir()
    (repo / "RULEBOOK.md").write_text("# rules\n", encoding="utf-8")
    (repo / "packets" / "a-assessment.md").write_text("packet A\n",
                                                      encoding="utf-8")
    (repo / "synthesis" / "00-overview.md").write_text("overview\n",
                                                       encoding="utf-8")
    return repo


class BuildDeliverableTest(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        root = pathlib.Path(self.td.name)
        self.repo = make_repo(root)
        self.out = root / "out"
        self.mirror = root / "mirror"

    def tearDown(self):
        self.td.cleanup()

    def run_build(self):
        argv = ["--repo", str(self.repo), "--out-dir", str(self.out),
                "--mirror", "dir", "--mirror-dir", str(self.mirror)]
        ns = m.argparse.Namespace(
            repo=str(self.repo), out_dir=str(self.out), mirror="dir",
            mirror_dir=str(self.mirror), mirror_only=None)
        return m.cmd_build(ns)

    def zips_in(self, d):
        return sorted(p.name for p in pathlib.Path(d).iterdir()
                      if m.ZIP_NAME_RE.match(p.name))

    def test_run_twice_one_new_version_identical_hashes(self):
        first = self.run_build()
        self.assertEqual(first["action"], "created")
        self.assertEqual(first["version"], 1)
        second = self.run_build()
        self.assertEqual(second["action"], "unchanged")
        self.assertEqual(second["version"], 1)
        self.assertEqual(first["sha256"], second["sha256"])
        self.assertEqual(self.zips_in(self.out),
                         ["franken-assessments-44-v1.zip"])
        self.assertEqual(self.zips_in(self.mirror),
                         ["franken-assessments-44-v1.zip"])

    def test_deterministic_despite_mtime_changes(self):
        first = self.run_build()
        for p in self.repo.rglob("*"):
            if p.is_file():
                p.touch()
        second = self.run_build()
        self.assertEqual(second["action"], "unchanged")
        self.assertEqual(first["sha256"], second["sha256"])

    def test_changed_sources_bump_and_prune(self):
        first = self.run_build()
        (self.repo / "packets" / "b-assessment.md").write_text(
            "packet B\n", encoding="utf-8")
        second = self.run_build()
        self.assertEqual(second["action"], "created")
        self.assertEqual(second["version"], 2)
        self.assertNotEqual(first["sha256"], second["sha256"])
        self.assertEqual(self.zips_in(self.out),
                         ["franken-assessments-44-v2.zip"])
        self.assertEqual(self.zips_in(self.mirror),
                         ["franken-assessments-44-v2.zip"])
        self.assertEqual(second["mirror"]["removed"],
                         ["franken-assessments-44-v1.zip"])

    def test_zip_layout(self):
        result = self.run_build()
        with zipfile.ZipFile(result["zip"]) as zf:
            names = zf.namelist()
        self.assertIn("RULEBOOK.md", names)
        self.assertIn("packets/a-assessment.md", names)
        self.assertIn("synthesis/00-overview.md", names)
        self.assertIn("v1-manifest.md", names)

    def test_seeded_lineage_continues_version(self):
        # Simulate the existing v11 lineage: an older ZIP already present.
        self.out.mkdir(parents=True)
        (self.out / "franken-assessments-44-v11.zip").write_bytes(b"old")
        result = self.run_build()
        self.assertEqual(result["version"], 12)
        self.assertEqual(self.zips_in(self.out),
                         ["franken-assessments-44-v12.zip"])


if __name__ == "__main__":
    unittest.main()
