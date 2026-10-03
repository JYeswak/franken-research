#!/usr/bin/env python3
"""Tests for scripts/synthesis-drift.py (bead fr-gsm).

Run: python3 scripts/test_synthesis_drift.py

The planted-edit tests are the acceptance contract: a one-field edit
to a packet (or to a synthesis tally) must make the monitor report
drift, and the unedited corpus must reproduce every checked claim.
Planted edits run against a temp copy, never the repo's own files.
"""
import importlib.util
import json
import os
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
    """Temp repo holding copies of all packets + the parsed docs."""
    (tmp / "packets").mkdir(parents=True)
    (tmp / "synthesis").mkdir(parents=True)
    for src in (REPO / "packets").glob("*-assessment.md"):
        (tmp / "packets" / src.name).write_bytes(src.read_bytes())
    for name in ("00-overview.md", "negative-patterns.md",
                 "ci-requirements.md", "hurdles-issues.md",
                 "external-validation-2026-09.md"):
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

    def test_ci_requirements_header_edit_is_caught(self):
        doc = self.root / "synthesis" / "ci-requirements.md"
        text = doc.read_text(encoding="utf-8")
        self.assertIn("## C1 \u2014 Public CI green at pin: 2/44", text)
        doc.write_text(text.replace(
            "## C1 \u2014 Public CI green at pin: 2/44",
            "## C1 \u2014 Public CI green at pin: 3/44"), encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("ci-req-c1", drift_ids(findings))

    def test_ci_membership_row_drop_is_caught(self):
        doc = self.root / "synthesis" / "ci-requirements.md"
        lines = doc.read_text(encoding="utf-8").splitlines()
        lines = [ln for ln in lines if not ln.startswith("| franken_engine |")]
        doc.write_text("\n".join(lines) + "\n", encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("ci-req-c2", drift_ids(findings))

    def test_negpat_p5_header_edit_is_caught(self):
        doc = self.root / "synthesis" / "negative-patterns.md"
        text = doc.read_text(encoding="utf-8")
        self.assertIn("## P5 \u2014 CI that cannot certify the pin: 42/44", text)
        doc.write_text(text.replace(
            "## P5 \u2014 CI that cannot certify the pin: 42/44",
            "## P5 \u2014 CI that cannot certify the pin: 41/44"),
            encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("negpat-p5-total", drift_ids(findings))

    def test_hurdles_rider_edit_is_caught(self):
        doc = self.root / "synthesis" / "hurdles-issues.md"
        text = doc.read_text(encoding="utf-8")
        self.assertIn("38/44 repos carry a non-OSI", text)
        doc.write_text(text.replace("38/44 repos carry a non-OSI",
                                    "37/44 repos carry a non-OSI"),
                       encoding="utf-8")
        findings, _ = sd.check(self.root)
        self.assertIn("hurdles-h1-rider", drift_ids(findings))


BR_STUB = """#!/usr/bin/env python3
import json, os, sys

log = os.environ.get("BR_STUB_LOG", "")
with open(log, "a", encoding="utf-8") as fh:
    fh.write(json.dumps(sys.argv[1:]) + "\\n")
if sys.argv[1:2] == ["search"]:
    if os.environ.get("BR_STUB_MODE") == "existing":
        print(json.dumps([{"title": "synthesis drift: nodus-tally"}]))
    else:
        print("[]")
elif sys.argv[1:2] == ["create"]:
    print(json.dumps({"id": "fr-stub-1"}))
"""


class FileBeads(unittest.TestCase):
    """The --file-beads path, end to end with a stubbed `br` on PATH."""

    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.root = make_root(pathlib.Path(self.t.name))
        (self.root / ".beads").mkdir()
        bindir = self.root / "bin"
        bindir.mkdir()
        stub = bindir / "br"
        stub.write_text(BR_STUB, encoding="utf-8")
        stub.chmod(0o755)
        self.log = self.root / "br-calls.jsonl"
        self._env = dict(os.environ)
        os.environ["PATH"] = str(bindir) + os.pathsep + os.environ["PATH"]
        os.environ["BR_STUB_LOG"] = str(self.log)
        os.environ.pop("BR_STUB_MODE", None)
        # Plant one drifted claim: overview NODUS Explore 34 -> 33.
        ov = self.root / "synthesis" / "00-overview.md"
        text = ov.read_text(encoding="utf-8")
        self.assertIn("Explore **34/44**", text)
        ov.write_text(text.replace("Explore **34/44**", "Explore **33/44**"),
                      encoding="utf-8")

    def tearDown(self):
        os.environ.clear()
        os.environ.update(self._env)
        self.t.cleanup()

    def test_files_one_bead_per_drifted_claim_then_dedupes(self):
        findings, _ = sd.check(self.root)
        drifted = [f for f in findings if f["status"] != "ok"]
        self.assertEqual([f["id"] for f in drifted], ["nodus-tally"])
        filed = sd.file_beads(self.root, findings)
        self.assertEqual(filed, ["FILED: synthesis drift: nodus-tally"])
        calls = [json.loads(ln) for ln in
                 self.log.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(calls[0][:2], ["search", "synthesis drift"])
        create = [c for c in calls if c[:1] == ["create"]]
        self.assertEqual(len(create), 1)
        self.assertIn("synthesis drift: nodus-tally", create[0])
        body = create[0][create[0].index("--description") + 1]
        self.assertIn("Claim as written", body)
        self.assertIn("'Explore': 33", body)
        self.assertIn("Re-derived from packets", body)
        self.assertIn("'Explore': 34", body)
        # Second run: the stub now reports the bead as already filed.
        os.environ["BR_STUB_MODE"] = "existing"
        filed = sd.file_beads(self.root, findings)
        self.assertEqual(filed,
                         ["SKIP (already filed): synthesis drift: nodus-tally"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
