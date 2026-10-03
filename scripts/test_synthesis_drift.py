#!/usr/bin/env python3
"""Tests for scripts/synthesis-drift.py (bead fr-gsm).

Run: python3 scripts/test_synthesis_drift.py

The planted-edit tests are the acceptance contract: a one-field edit
to a packet (or to a synthesis tally) must make the monitor report
drift, and the unedited corpus must reproduce every checked claim.
Planted edits run against a temp copy, never the repo's own files.
"""
import importlib.util
import pathlib
import shutil
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve()
spec = importlib.util.spec_from_file_location(
    "synthesis_drift", HERE.with_name("synthesis-drift.py"))
sd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sd)

REPO = HERE.parents[1]


def make_root(tmp: pathlib.Path) -> pathlib.Path:
    """Temp repo holding copies of all packets + the two parsed docs."""
    (tmp / "packets").mkdir(parents=True)
    (tmp / "synthesis").mkdir(parents=True)
    for src in (REPO / "packets").glob("*-assessment.md"):
        (tmp / "packets" / src.name).write_bytes(src.read_bytes())
    for name in ("00-overview.md", "negative-patterns.md"):
        (tmp / "synthesis" / name).write_bytes(
            (REPO / "synthesis" / name).read_bytes())
    return tmp


def drift_ids(findings):
    return {f["id"] for f in findings if f["status"] != "ok"}


class Extraction(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.facts = sd.packet_facts(REPO)

    def test_all_44_packets_extract_everything(self):
        self.assertEqual(len(self.facts), 44)
        for stem, f in self.facts.items():
            for key in ("trl", "ring", "license", "bus"):
                self.assertIsNotNone(f[key], f"{stem}.{key} unextracted")

    def test_known_packets(self):
        a = self.facts["asupersync"]
        self.assertEqual((a["trl"], a["ring"], a["license"], a["bus"],
                          a["no_contrib"]), ("6", "Pilot", "rider", 1, True))
        d = self.facts["franken_agent_detection"]
        self.assertEqual((d["trl"], d["ring"], d["license"]),
                         ("6", "Pilot", "plain"))
        b = self.facts["beads-for-frankentui"]
        self.assertEqual((b["trl"], b["ring"], b["license"]),
                         ("8", "Monitor", "none"))
        s = self.facts["frankensim"]
        self.assertEqual((s["trl"], s["ring"], s["license"]),
                         ("4", "Explore", "rider"))
        w = self.facts["frankentui_website"]
        self.assertEqual((w["trl"], w["ring"]), ("9", "Monitor"))


class CorpusReproduces(unittest.TestCase):
    def test_current_corpus_has_no_drift(self):
        findings, inventory = sd.check(REPO)
        bad = [f for f in findings if f["status"] != "ok"]
        self.assertEqual(bad, [], f"drift in current corpus: {bad}")
        self.assertGreater(len(inventory), 40)


class PlantedDrift(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.root = make_root(pathlib.Path(self.t.name))

    def tearDown(self):
        self.t.cleanup()

    def test_packet_trl_edit_is_caught(self):
        pkt = self.root / "packets" / "asupersync-assessment.md"
        text = pkt.read_text(encoding="utf-8")
        self.assertIn("(TRL 6 \u2014 see", text)
        pkt.write_text(text.replace("(TRL 6 \u2014 see", "(TRL 7 \u2014 see"),
                       encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("matrix-vs-packets", drift_ids(findings))
        self.assertIn("trl-tally", drift_ids(findings))

    def test_synthesis_tally_edit_is_caught(self):
        ov = self.root / "synthesis" / "00-overview.md"
        text = ov.read_text(encoding="utf-8")
        self.assertIn("Explore **34/44**", text)
        ov.write_text(text.replace("Explore **34/44**", "Explore **33/44**"),
                      encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("nodus-tally", drift_ids(findings))

    def test_dropped_claim_row_is_caught(self):
        ov = self.root / "synthesis" / "00-overview.md"
        lines = ov.read_text(encoding="utf-8").splitlines()
        lines = [ln for ln in lines if not ln.startswith("| NODUS ring |")]
        ov.write_text("\n".join(lines) + "\n", encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("nodus-tally", drift_ids(findings))

    def test_matrix_cell_edit_is_caught(self):
        ov = self.root / "synthesis" / "00-overview.md"
        text = ov.read_text(encoding="utf-8")
        row = "| asupersync | 6 | Pilot |"
        self.assertIn(row, text)
        ov.write_text(text.replace(row, "| asupersync | 6 | Explore |"),
                      encoding="utf-8")
        findings, _ = sd.check(self.root)
        ids = drift_ids(findings)
        self.assertIn("matrix-vs-packets", ids)


if __name__ == "__main__":
    unittest.main(verbosity=2)
