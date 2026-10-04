#!/usr/bin/env python3
"""test_artifact_events.py - fr-x5h tests (stdlib unittest)."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import artifact_events as ae  # noqa: E402

NOW = datetime(2026, 10, 4, 12, 0, 0, tzinfo=timezone.utc)


class TestIdsAndTrailers(unittest.TestCase):
    def test_family_strips_date(self):
        self.assertEqual(ae.family_of("2026-10-04-new-releases"), "new-releases")
        self.assertEqual(ae.family_of("seeded-word-sort"), "seeded-word-sort")

    def test_stamp_appends_trailers_once(self):
        msg = ae.stamp_commit_message("[research-candidate] X [test]",
                                      "2026-10-04-new-releases")
        self.assertIn("Artifact-ID: fr-art-2026-10-04-new-releases", msg)
        self.assertIn("Artifact-Family: new-releases", msg)
        self.assertEqual(ae.stamp_commit_message(msg, "2026-10-04-new-releases"), msg)

    def test_parse_trailers(self):
        t = ae.parse_trailers("subj\n\nArtifact-ID: fr-art-a-b\nArtifact-Family: a-b\n")
        self.assertEqual(t["Artifact-ID"], "fr-art-a-b")


class TestEventsAndPanel(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.log = os.path.join(self.tmp, "events.jsonl")

    def _rec(self, slug, event, ts, source="test"):
        return ae.record_event(self.log, slug=slug, event=event, ts=ts,
                               source=source)

    def test_append_only_and_queryable(self):
        self._rec("2026-09-01-alpha", "merge", "2026-09-01T00:00:00+00:00")
        self._rec("2026-09-01-alpha", "citation", "2026-09-05T00:00:00+00:00")
        self._rec("2026-09-01-alpha", "revert", "2026-09-03T00:00:00+00:00")
        evs = ae.load_events(self.log)
        self.assertEqual(len(evs), 3)
        self.assertEqual(len(ae.query_events(evs, kind="revert")), 1)
        self.assertEqual(
            ae.query_events(evs, aid="fr-art-2026-09-01-alpha")[0]["family"],
            "alpha")
        with self.assertRaises(ValueError):
            ae.record_event(self.log, slug="x", event="usefulness-vibes")

    def test_panel_survival_and_use(self):
        # old artifact: merged 20d ago, used, not reverted -> survives+used
        self._rec("2026-09-14-alpha", "merge", "2026-09-14T00:00:00+00:00")
        self._rec("2026-09-14-alpha", "re-run", "2026-09-20T00:00:00+00:00")
        # old artifact: reverted within 7d -> not survived
        self._rec("2026-09-14-beta", "merge", "2026-09-14T00:00:00+00:00")
        self._rec("2026-09-14-beta", "revert", "2026-09-16T00:00:00+00:00")
        # fresh artifact: counts in 7d merges, excluded from survival n
        self._rec("2026-10-04-gamma", "merge", "2026-10-04T00:00:00+00:00")
        panel = ae.compute_panel(ae.load_events(self.log), now=NOW)
        self.assertEqual(panel["merged_total"], 3)
        self.assertEqual(panel["merged_7d"], 1)
        self.assertEqual(panel["survival_7d_rate"], 0.5)
        self.assertEqual(panel["survival_7d_n"], 2)
        self.assertEqual(panel["reverts_total"], 1)
        self.assertEqual(panel["families"]["alpha"]["re-run"], 1)
        text = ae.render_panel(panel)
        self.assertIn("survival_7d=50.0%", text)
        self.assertIn("family beta:", text)

    def test_empty_panel_is_numbers_not_crash(self):
        panel = ae.compute_panel([], now=NOW)
        self.assertEqual(panel["merged_total"], 0)
        self.assertIsNone(panel["survival_7d_rate"])
        self.assertIn("n/a", ae.render_panel(panel))


class TestGitBackfill(unittest.TestCase):
    def test_scan_and_backfill_temp_repo(self):
        tmp = tempfile.mkdtemp()
        repo = os.path.join(tmp, "r")
        os.makedirs(os.path.join(repo, "probes", "daily-candidates",
                                 "2026-10-01-demo"))
        env = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t",
                   GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
        subprocess.run(["git", "init", "-q", repo], check=True, env=env)
        with open(os.path.join(repo, "probes", "daily-candidates",
                               "2026-10-01-demo", "recipe.md"), "w") as f:
            f.write("# demo\n")
        msg = ae.stamp_commit_message("[research-candidate] demo [test]",
                                      "2026-10-01-demo")
        subprocess.run(["git", "-C", repo, "add", "."], check=True, env=env)
        subprocess.run(["git", "-C", repo, "commit", "-q", "-m", msg],
                       check=True, env=env)
        found = ae.scan_git_merges(repo)
        self.assertIn("fr-art-2026-10-01-demo", found)
        log = os.path.join(tmp, "events.jsonl")
        added = ae.backfill(log, repo=repo)
        self.assertEqual(len(added), 1)
        self.assertEqual(ae.backfill(log, repo=repo), [])  # idempotent


if __name__ == "__main__":
    unittest.main()
