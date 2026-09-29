#!/usr/bin/env python3
"""Public CLI exercises; synthetic cases, not a research-quality benchmark."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "scripts/review-decisions.py"


class Review(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.record = self.root / "decisions.json"
        self.data = {"version": 1, "evidence": [], "claims": [], "decisions": []}
        for name in ("a", "b"):
            (self.root / name).write_text("input " + name)
            (self.root / (name + ".receipt")).write_text('{"exit_code": 0}')
            digest = lambda p: hashlib.sha256((self.root / p).read_bytes()).hexdigest()
            self.data["evidence"].append({"id": name, "kind": "execution", "artifact": name + ".receipt", "sha256": digest(name + ".receipt"), "inputs": {name: digest(name)}, "scope": "synthetic fixture", "visibility": "public"})
            self.data["claims"].append({"id": name, "text": name, "status": "supported", "evidence": [name]})
            self.data["decisions"].append({"id": name, "question": name + "?", "owner": "fixture", "priority": 1, "next_check": "inspect " + name, "alternatives": ["keep", "change"], "disposition": "combine", "claims": [name]})

    def run_cli(self, expected=0, *flags):
        self.record.write_text(json.dumps(self.data))
        before = self.record.read_bytes()
        result = subprocess.run([sys.executable, str(CLI), str(self.record), "--root", str(self.root), "--json", *flags], capture_output=True, text=True, cwd=self.root)
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        self.assertEqual(self.record.read_bytes(), before, "review must never mutate records")
        return json.loads(result.stdout) if result.returncode != 2 else result

    def test_current_omitted_and_all_includes(self):
        self.assertEqual(self.run_cli()["decisions"], [])
        self.assertEqual(len(self.run_cli(0, "--all")["decisions"]), 2)

    def test_changed_source_explained_unrelated_preserved(self):
        (self.root / "a").write_text("changed")
        result = self.run_cli(1)
        self.assertEqual([d["id"] for d in result["decisions"]], ["a"])
        self.assertEqual(result["decisions"][0]["causes"][0]["changes"], ["a"])
        self.assertEqual(result["unsupported_current_labels"], ["a"])

    def test_transitive_cause_reaches_decision(self):
        self.data["claims"][1]["depends_on"] = ["a"]
        self.data["decisions"] = [self.data["decisions"][1]]
        (self.root / "a").unlink()
        row = self.run_cli(1)["decisions"][0]
        self.assertEqual(row["affected_claims"], ["b"])
        self.assertEqual(row["causes"][0]["claim"], "a")

    def test_provisional_and_deferred_visible(self):
        self.data["claims"][0]["status"] = "provisional"
        self.data["decisions"][1]["disposition"] = "defer"
        rows = self.run_cli()["decisions"]
        self.assertEqual([r["state"] for r in rows], ["review", "deferred"])
        self.assertEqual(rows[0]["causes"], [{"claim": "a", "status": "provisional"}])

    def test_priority_order(self):
        self.data["decisions"][1]["priority"] = 0
        self.assertEqual([d["id"] for d in self.run_cli(0, "--all")["decisions"]], ["b", "a"])

    def test_private_transfer_unavailable_explained(self):
        self.data["evidence"][0].update(visibility="private", availability="reference_only")
        row = self.run_cli(1)["decisions"][0]
        self.assertEqual(row["causes"][0]["changes"], ["artifact unavailable in transfer"])

    def test_tampered_receipt_no_queue(self):
        (self.root / "a.receipt").write_text('{"exit_code": 1}')
        result = self.run_cli(2)
        self.assertEqual(result.stdout, "")
        self.assertIn("artifact absent/changed", result.stderr)

    def test_cycle_rejected(self):
        self.data["claims"][0]["depends_on"] = ["b"]
        self.data["claims"][1]["depends_on"] = ["a"]
        self.assertIn("cycle", self.run_cli(2).stderr)

    def test_retired_dependency_never_current(self):
        self.data["claims"][0]["status"] = "retired"
        self.data["claims"][1]["depends_on"] = ["a"]
        rows = self.run_cli(1)["decisions"]
        self.assertEqual(rows[1]["causes"], [{"claim": "a", "status": "retired"}])


if __name__ == "__main__":
    unittest.main()
