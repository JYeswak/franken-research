#!/usr/bin/env python3
"""Tests for scripts/golden-packets.py (bead fr-itk).

Run: python3 scripts/test_golden_packets.py

The planted-edit tests are the acceptance contract: a one-character
packet change must fail the suite, and reverting it must restore green.
They run against a temp copy of a real golden packet, never the repo's.
"""
import importlib.util
import json
import pathlib
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve()
spec = importlib.util.spec_from_file_location(
    "golden_packets", HERE.with_name("golden-packets.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

REPO = HERE.parents[1]


def make_root(tmp: pathlib.Path) -> pathlib.Path:
    """Temp repo holding copies of every golden packet + RULEBOOK."""
    (tmp / "packets").mkdir(parents=True)
    (tmp / "scripts").mkdir(parents=True)
    (tmp / "RULEBOOK.md").write_bytes((REPO / "RULEBOOK.md").read_bytes())
    (tmp / "scripts" / "packet-receipts.py").write_bytes(
        (REPO / "scripts" / "packet-receipts.py").read_bytes())
    for stem in g.GOLDEN_STEMS:
        src = REPO / "packets" / f"{stem}-assessment.md"
        (tmp / "packets" / src.name).write_bytes(src.read_bytes())
    return tmp


class GoldenPackets(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.root = make_root(pathlib.Path(self.t.name))

    def tearDown(self):
        self.t.cleanup()

    def test_golden_set_is_small_and_covers_every_member(self):
        self.assertGreaterEqual(len(g.GOLDEN_STEMS), 3)
        self.assertLessEqual(len(g.GOLDEN_STEMS), 10)
        golden = g.build_golden(self.root)
        self.assertEqual(len(golden["packets"]), len(g.GOLDEN_STEMS))

    def test_emit_then_verify_identical_and_deterministic(self):
        self.assertEqual(g.cmd_emit(self.root), 0)
        self.assertEqual(g.cmd_verify(self.root), 0)
        banked = (self.root / g.GOLDEN_PATH).read_bytes()
        g.cmd_emit(self.root)
        self.assertEqual(banked, (self.root / g.GOLDEN_PATH).read_bytes())
        self.assertEqual(json.loads(banked)["schema"], g.SCHEMA)

    def test_planted_one_character_change_fails_then_revert_restores(self):
        self.assertEqual(g.cmd_emit(self.root), 0)
        packet = self.root / "packets" / f"{g.GOLDEN_STEMS[0]}-assessment.md"
        original = packet.read_bytes()
        # One-character edit in the body (not the header): still drift.
        text = original.decode("utf-8")
        idx = text.index("## ")
        packet.write_bytes((text[:idx] + text[idx:].replace("e", "x", 1)).encode())
        self.assertEqual(g.cmd_verify(self.root), 1)
        banked = json.loads((self.root / g.GOLDEN_PATH).read_text())
        delta = "\n".join(g.explain_delta(banked, g.build_golden(self.root)))
        self.assertIn("packet_sha256", delta)
        packet.write_bytes(original)
        self.assertEqual(g.cmd_verify(self.root), 0)

    def test_missing_golden_file_fails(self):
        self.assertEqual(g.cmd_verify(self.root), 1)

    def test_repo_golden_matches_banked_file(self):
        """The committed golden must re-derive green on the real corpus."""
        self.assertEqual(g.cmd_verify(REPO), 0)


if __name__ == "__main__":
    unittest.main()
