#!/usr/bin/env python3
"""Tests for scripts/notification-audit.py (fr-i5u). Run: python3 scripts/test_notification_audit.py"""
import importlib.util
import pathlib
import shutil
import subprocess
import tempfile
import unittest
from datetime import date

spec = importlib.util.spec_from_file_location(
    "notification_audit", pathlib.Path(__file__).with_name("notification-audit.py")
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

START = date(2026, 10, 4)
END = date(2026, 10, 10)


class AuditTests(unittest.TestCase):
    def test_clean_complete_window_passes(self):
        r = mod.audit(["20"], ["fr-a", "fr-b"], [
            {"kind": "pr", "event_id": "20"},
            {"kind": "bead", "event_id": "fr-a"},
            {"kind": "bead", "event_id": "fr-b"},
            {"kind": "digest", "event_id": "2026-10-05"},
        ], window_complete=True)
        self.assertEqual(r["status"], "PASS")
        self.assertEqual(r["merges"] + r["closures"],
                         r["pushed_pr_summaries"] + r["pushed_bead_summaries"])

    def test_incomplete_window_never_passes(self):
        r = mod.audit([], [], [], window_complete=False)
        self.assertEqual(r["status"], "WINDOW_INCOMPLETE")

    def test_missing_summary_fails(self):
        r = mod.audit(["20"], [], [], window_complete=True)
        self.assertEqual(r["status"], "FAIL")
        self.assertEqual(r["missing"]["pr"], ["20"])

    def test_duplicate_summary_fails(self):
        r = mod.audit([], ["fr-a"], [
            {"kind": "bead", "event_id": "fr-a"},
            {"kind": "bead", "event_id": "fr-a"},
        ], window_complete=True)
        self.assertEqual(r["status"], "FAIL")
        self.assertEqual(r["duplicates"]["bead"], ["fr-a"])

    def test_broadcast_style_entry_fails(self):
        r = mod.audit([], [], [{"kind": "tip", "event_id": "x"}], window_complete=True)
        self.assertEqual(r["status"], "FAIL")
        self.assertEqual(len(r["broadcast_style"]), 1)

    def test_extra_summary_fails(self):
        r = mod.audit([], [], [{"kind": "pr", "event_id": "99"}], window_complete=True)
        self.assertEqual(r["status"], "FAIL")
        self.assertEqual(r["extra"]["pr"], ["99"])

    def test_too_many_digests_fails(self):
        entries = [{"kind": "digest", "event_id": f"2026-10-{d:02d}"} for d in range(1, 9)]
        r = mod.audit([], [], entries, window_complete=True)
        self.assertEqual(r["status"], "FAIL")

    def test_parse_log_counts_malformed(self):
        entries, bad = mod.parse_log('{"kind":"pr","event_id":"1"}\nnot json\n\n')
        self.assertEqual(len(entries), 1)
        self.assertEqual(bad, 1)

    def test_out_of_window_digest_ignored(self):
        # The 2026-10-03 opening digest predates the proof window and
        # must not count toward the 7-digest cap or otherwise pollute it.
        r = mod.audit([], [], [
            {"kind": "digest", "event_id": "2026-10-03"},
            {"kind": "digest", "event_id": "2026-10-05"},
        ], window_complete=True, start=START, end=END)
        self.assertEqual(r["digests"], 1)
        self.assertEqual(r["status"], "PASS")

    def test_out_of_window_bead_entry_ignored(self):
        r = mod.audit([], [], [
            {"kind": "bead", "event_id": "fr-old", "ts": "2026-10-01T09:00:00Z"},
        ], window_complete=True, start=START, end=END)
        self.assertEqual(r["extra"]["bead"], [])
        self.assertEqual(r["status"], "PASS")

    def test_entry_without_day_still_counted(self):
        # No ts and a non-date event_id: cannot prove it out-of-window,
        # so it is counted (and here surfaces as an extra, honestly).
        r = mod.audit([], [], [
            {"kind": "bead", "event_id": "fr-x"},
        ], window_complete=True, start=START, end=END)
        self.assertEqual(r["extra"]["bead"], ["fr-x"])
        self.assertEqual(r["status"], "FAIL")


@unittest.skipUnless(shutil.which("git"), "git not available")
class GitMergesTests(unittest.TestCase):
    def test_merge_commit_on_window_day_is_counted(self):
        # Regression (2026-10-04): bare --since=YYYY-MM-DD made git
        # approxidate drop a same-day merge (PR #25, 06:39 MDT), so the
        # audit reported merges=0 over a window that contained a merge.
        with tempfile.TemporaryDirectory() as td:
            repo = pathlib.Path(td)

            hooks = repo / ".test-hooks"
            hooks.mkdir()

            def git(*args):
                subprocess.run(
                    ["git", "-C", str(repo),
                     "-c", "user.email=t@localhost", "-c", "user.name=t",
                     "-c", f"core.hooksPath={hooks}",
                     *args],
                    check=True, capture_output=True, text=True, timeout=60)

            git("init", "-b", "main")
            (repo / "a.txt").write_text("a\n")
            git("add", ".")
            git("commit", "-m", "base")
            git("checkout", "-b", "feature")
            (repo / "b.txt").write_text("b\n")
            git("add", ".")
            git("commit", "-m", "feature work")
            git("checkout", "main")
            git("merge", "--no-ff", "feature",
                "-m", "Merge pull request #99 from example/feature")
            today = date.today()
            ids = mod.git_merges(repo, today, today)
            self.assertIn("99", ids)


if __name__ == "__main__":
    unittest.main()
