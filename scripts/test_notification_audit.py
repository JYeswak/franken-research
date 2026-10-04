#!/usr/bin/env python3
"""Tests for scripts/notification-audit.py (fr-i5u). Run: python3 scripts/test_notification_audit.py"""
import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location(
    "notification_audit", pathlib.Path(__file__).with_name("notification-audit.py")
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


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


if __name__ == "__main__":
    unittest.main()
