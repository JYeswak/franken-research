#!/usr/bin/env python3
"""Tests for scripts/notify-push.py (fr-i5u). Run: python3 scripts/test_notify_push.py"""
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).with_name("notify-push.py")


def run_push(log, *args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--log", str(log), *args],
        capture_output=True, text=True, timeout=60)


class NotifyPushTests(unittest.TestCase):
    def test_first_push_appends_one_line(self):
        with tempfile.TemporaryDirectory() as td:
            log = pathlib.Path(td) / "notification-log.jsonl"
            r = run_push(log, "--kind", "bead", "--event-id", "fr-a",
                         "--chat", "franken-research", "--ts", "2026-10-04T08:00:00+00:00")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(json.loads(r.stdout)["status"], "logged")
            lines = log.read_text().splitlines()
            self.assertEqual(len(lines), 1)
            entry = json.loads(lines[0])
            self.assertEqual(entry["kind"], "bead")
            self.assertEqual(entry["event_id"], "fr-a")
            self.assertEqual(entry["chat"], "franken-research")

    def test_duplicate_push_is_a_noop(self):
        with tempfile.TemporaryDirectory() as td:
            log = pathlib.Path(td) / "notification-log.jsonl"
            args = ("--kind", "pr", "--event-id", "25", "--chat", "franken-research")
            self.assertEqual(run_push(log, *args).returncode, 0)
            r = run_push(log, *args)
            self.assertEqual(r.returncode, 0)
            self.assertEqual(json.loads(r.stdout)["status"], "already-logged")
            self.assertEqual(len(log.read_text().splitlines()), 1)

    def test_same_event_id_under_another_kind_is_distinct(self):
        with tempfile.TemporaryDirectory() as td:
            log = pathlib.Path(td) / "notification-log.jsonl"
            run_push(log, "--kind", "pr", "--event-id", "2026-10-04", "--chat", "c")
            r = run_push(log, "--kind", "digest", "--event-id", "2026-10-04", "--chat", "c")
            self.assertEqual(json.loads(r.stdout)["status"], "logged")
            self.assertEqual(len(log.read_text().splitlines()), 2)

    def test_broadcast_kind_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            log = pathlib.Path(td) / "notification-log.jsonl"
            r = run_push(log, "--kind", "tip", "--event-id", "x", "--chat", "c")
            self.assertEqual(r.returncode, 2)
            self.assertFalse(log.exists())


if __name__ == "__main__":
    unittest.main()
