#!/usr/bin/env python3
"""Tests for scripts/fixtures.py (bead fr-tww).

Run: python3 scripts/test_fixtures.py

The runner machinery is tested with synthetic suites (a passing and a
failing script) so this test itself stays in seconds; the real-surface
test only checks that all three contracted surfaces are wired in.
"""
import importlib.util
import pathlib
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve()
spec = importlib.util.spec_from_file_location(
    "fixtures", HERE.with_name("fixtures.py"))
fx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fx)


def suite_for(body: str):
    handle = tempfile.NamedTemporaryFile(
        "w", suffix=".py", delete=False)
    handle.write(body)
    handle.close()
    return (("synthetic", (("case", (handle.name,)),)),), pathlib.Path(handle.name)


class FixturesRunner(unittest.TestCase):
    def test_three_contracted_surfaces_are_wired(self):
        names = [name for name, _ in fx.SUITES]
        self.assertEqual(names, ["packet-verifier", "kit-install-paths",
                                 "nightly-candidate-shape"])

    def test_passing_suite_reports_ok(self):
        suites, script = suite_for("print('synthetic ok')\n")
        try:
            rc, summary = fx.run_suites(suites=suites, budget=60)
        finally:
            script.unlink()
        self.assertEqual(rc, 0)
        self.assertTrue(summary["surfaces"][0]["ok"])
        self.assertFalse(summary["over_budget"])

    def test_failing_command_fails_the_run(self):
        suites, script = suite_for("raise SystemExit(3)\n")
        try:
            rc, summary = fx.run_suites(suites=suites, budget=60)
        finally:
            script.unlink()
        self.assertEqual(rc, 1)
        self.assertFalse(summary["surfaces"][0]["ok"])

    def test_budget_is_enforced_in_summary(self):
        suites, script = suite_for("print('ok')\n")
        try:
            _, summary = fx.run_suites(suites=suites, budget=-1)
        finally:
            script.unlink()
        self.assertTrue(summary["over_budget"])


if __name__ == "__main__":
    unittest.main()
