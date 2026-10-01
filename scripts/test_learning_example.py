#!/usr/bin/env python3
"""Exercise the portable worked lifecycle, not research learning performance."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = Path("examples/decision-cycle")


class LearningExample(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.kit = self.root / "unpacked kit"
        shutil.copytree(ROOT / "starter-kit", self.kit)
        self.project = self.root / "worked example"

    def invoke(self, destination):
        return subprocess.run([sys.executable, str(self.kit / EXAMPLE / "run.py"),
                               str(destination)], cwd=self.root,
                              capture_output=True, text=True)

    def test_real_lifecycle_and_transfer_without_source(self):
        result = self.invoke(self.project)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        receipt = json.loads((self.project / "probe-receipt.json").read_text())
        self.assertEqual(receipt["command"], ["python3", "probe.py"])
        self.assertEqual(receipt["exit_code"], 0)
        self.assertIn("format_version 1", receipt["stdout"])
        results = {r["stage"]: r for r in json.loads((self.project / "cycle-results.json").read_text())}
        self.assertEqual(results["current"]["exit_code"], 0)
        self.assertEqual(results["changed-probe-fails"]["exit_code"], 1)
        self.assertEqual(results["stale-label"]["exit_code"], 1)
        self.assertEqual(results["stale-review"]["exit_code"], 1)
        self.assertEqual(results["demote"]["exit_code"], 0)
        transfer = self.root / "moved public transfer"
        shutil.move(str(self.project / "public-transfer"), transfer)
        shutil.rmtree(self.project)
        shutil.rmtree(self.kit)
        for script in ("check-decisions.py", "review-decisions.py"):
            checked = subprocess.run([sys.executable, str(transfer / "scripts" / script),
                                      str(transfer / "decisions.json"), "--root", str(transfer)],
                                     cwd=self.root, capture_output=True, text=True)
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            self.assertIn("review", checked.stdout.lower())
        data = json.loads((transfer / "decisions.json").read_text())
        self.assertEqual(data["claims"][0]["status"], "review_required")
        self.assertEqual(json.loads((transfer / "probe-receipt.json").read_text()), receipt)
        rerun = subprocess.run([sys.executable, "probe.py"], cwd=transfer,
                               capture_output=True, text=True)
        self.assertEqual(rerun.returncode, 1)
        self.assertIn("Unsupported format_version", rerun.stderr)

    def test_existing_destinations_never_overwritten(self):
        self.project.mkdir()
        sentinel = self.project / "keep.txt"
        sentinel.write_text("user bytes")
        before = set(self.project.iterdir())
        self.assertNotEqual(self.invoke(self.project).returncode, 0)
        self.assertEqual(sentinel.read_text(), "user bytes")
        self.assertEqual(set(self.project.iterdir()), before)
        empty = self.root / "empty"
        empty.mkdir()
        self.assertNotEqual(self.invoke(empty).returncode, 0)
        self.assertEqual(list(empty.iterdir()), [])
        link = self.root / "link"
        link.symlink_to(self.project, target_is_directory=True)
        self.assertNotEqual(self.invoke(link).returncode, 0)
        self.assertEqual(sentinel.read_text(), "user bytes")

    def test_site_example_mirror(self):
        source = ROOT / "starter-kit" / EXAMPLE
        mirror = ROOT / "site/starter-kit" / EXAMPLE
        self.assertEqual(sorted(p.name for p in source.iterdir()), sorted(p.name for p in mirror.iterdir()))
        for path in source.iterdir():
            self.assertEqual(path.read_bytes(), (mirror / path.name).read_bytes())


if __name__ == "__main__":
    unittest.main()
