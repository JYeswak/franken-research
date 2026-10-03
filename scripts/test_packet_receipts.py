#!/usr/bin/env python3
"""Tests for scripts/packet-receipts.py (bead fr-1pq).

Run: python3 scripts/test_packet_receipts.py
"""
import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "packet_receipts", pathlib.Path(__file__).with_name("packet-receipts.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

STYLE_A = """# demo — RULEBOOK v1.0 Assessment Packet

**Repository:** `Dicklesworthstone/demo_repo` · **Pinned commit:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (2026-09-22) · **Assessment date:** 2026-09-22

## 4.3 Claim inventory

| Claim | Status | Evidence |
|---|---|---|
| It compiles | demonstrated | CI |
| It is fast | aspirational | README |
"""

STYLE_B = """# DemoFS — Technical Due-Diligence Assessment

| Field | Value |
|---|---|
| Pinned revision | `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` — 2026-09-22 |
| Assessment date | 2026-09-22 |

## 4.3 Claim inventory: demonstrated vs aspirational

| Claim | Status |
|---|---|
| Mounts | demonstrated |
"""

STYLE_C = """# FrankenSim — Assessment (Rulebook v1.0)

**Repo:** [`Dicklesworthstone/frankensim`](https://github.com/Dicklesworthstone/frankensim)
**Pin:** `cccccccccccccccccccccccccccccccccccccccc` (2026-09-22)

## 4.3 Repo facts (claim inventory)

| Claim | Status |
|---|---|
| Simulates | partial |
"""


def make_root(tmp: pathlib.Path, packets: dict[str, str]) -> pathlib.Path:
    (tmp / "packets").mkdir(parents=True)
    (tmp / "RULEBOOK.md").write_text("**Version:** 1.1 — 2026-09-23\n")
    for name, text in packets.items():
        (tmp / "packets" / name).write_text(text)
    return tmp


class PacketReceipts(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.t.name)

    def tearDown(self):
        self.t.cleanup()

    def test_pin_extraction_all_header_styles(self):
        for text, pin in ((STYLE_A, "a" * 40), (STYLE_B, "b" * 40), (STYLE_C, "c" * 40)):
            lines = text.splitlines()
            self.assertEqual(m.extract_pin(lines), pin)

    def test_claim_set_counts_data_rows_only(self):
        self.assertEqual(m.extract_claim_set(STYLE_A.splitlines())["count"], 2)
        self.assertEqual(m.extract_claim_set(STYLE_B.splitlines())["count"], 1)

    def test_claim_set_ignores_cell_whitespace(self):
        spaced = STYLE_A.replace("| It compiles | demonstrated | CI |",
                                 "|   It   compiles   | demonstrated   | CI |")
        self.assertEqual(m.extract_claim_set(STYLE_A.splitlines())["sha256"],
                         m.extract_claim_set(spaced.splitlines())["sha256"])

    def test_render_is_deterministic_and_timestamp_free(self):
        make_root(self.root, {"demo_repo-assessment.md": STYLE_A})
        receipt = m.build_receipt(self.root, self.root / "packets" / "demo_repo-assessment.md")
        self.assertEqual(m.render(receipt), m.render(m.build_receipt(
            self.root, self.root / "packets" / "demo_repo-assessment.md")))
        self.assertNotIn(b"2026-10", m.render(receipt))
        self.assertEqual(receipt["pins"]["grader_protocol"]["version"], "1.1")
        self.assertEqual(receipt["packet_sha256"],
                         hashlib.sha256(STYLE_A.encode()).hexdigest())

    def test_emit_then_verify_identical_then_tamper_drifts(self):
        make_root(self.root, {"demo_repo-assessment.md": STYLE_A,
                              "demofs-assessment.md": STYLE_B})
        self.assertEqual(m.cmd_emit(self.root, None), 0)
        self.assertTrue((self.root / "packets" / "demo_repo-assessment.receipt.json").exists())
        self.assertEqual(m.cmd_verify(self.root, None, None), 0)
        # Regeneration from the same pins reproduces the receipt byte-for-byte.
        before = (self.root / "packets" / "demo_repo-assessment.receipt.json").read_bytes()
        m.cmd_emit(self.root, None)
        self.assertEqual(before, (self.root / "packets" / "demo_repo-assessment.receipt.json").read_bytes())
        # A one-character packet edit is caught and explained.
        packet = self.root / "packets" / "demo_repo-assessment.md"
        packet.write_text(STYLE_A.replace("It compiles", "It compilez"))
        self.assertEqual(m.cmd_verify(self.root, ["demo_repo"], None), 1)
        old = json.loads((self.root / "packets" / "demo_repo-assessment.receipt.json").read_text())
        fresh = m.build_receipt(self.root, packet)
        explanation = "\n".join(m.explain_drift(self.root, packet, old, fresh))
        self.assertIn("packet_sha256", explanation)

    def test_missing_receipt_fails_verify(self):
        make_root(self.root, {"demo_repo-assessment.md": STYLE_A})
        self.assertEqual(m.cmd_verify(self.root, None, None), 1)


if __name__ == "__main__":
    unittest.main()
