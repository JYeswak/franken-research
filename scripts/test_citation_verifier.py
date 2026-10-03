#!/usr/bin/env python3
"""Tests for scripts/citation-verifier.py (bead fr-brn).

Run: python3 scripts/test_citation_verifier.py
Acceptance: a planted false citation in a test packet is flagged; a
clean (sampled-real-shaped) packet passes with a derivation log.
"""
import importlib.util
import json
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "citation_verifier", pathlib.Path(__file__).with_name("citation-verifier.py"))
cv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cv)
pr = cv.PR

GOOD = """# demo — RULEBOOK v1.0 Assessment Packet

**Repository:** `Dicklesworthstone/demo_repo` · **Pinned commit:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (2026-09-22) · **Assessment date:** 2026-09-22

Pin-relative source: https://github.com/Dicklesworthstone/demo_repo/blob/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/README.md

## 4.3 Claim inventory

| # | Claim | Status | Evidence |
|---|---|---|---|
| 1 | It compiles | demonstrated | CI |
| 2 | It is fast | demonstrated | bench |
| 3 | It is popular | aspirational | README |

Claim inventory: 3 claims in total, 2 of 3 claims demonstrated.
"""


def make_root(tmp, text, receipt_mutate=None):
    (tmp / "packets").mkdir(parents=True)
    (tmp / "RULEBOOK.md").write_text("**Version:** 1.1 — 2026-09-23\n")
    packet = tmp / "packets" / "demo_repo-assessment.md"
    packet.write_text(text)
    receipt = pr.build_receipt(tmp, packet)
    if receipt_mutate:
        receipt_mutate(receipt)
    rp = packet.with_name("demo_repo-assessment.receipt.json")
    rp.write_text(json.dumps(receipt, sort_keys=True, indent=2) + "\n")
    return packet


class CitationVerifier(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.t.name)

    def tearDown(self):
        self.t.cleanup()

    def test_clean_packet_passes_with_derivation_log(self):
        packet = make_root(self.root, GOOD)
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertEqual(failed, 0, [r for r in rows if r["verdict"] == "FAIL"])
        self.assertEqual(cv.cmd_verify(self.root, None, None), 0)
        kinds = {r["kind"] for r in rows}
        for want in ("packet_sha256", "pinned_commit", "claim_set.count",
                     "claim_set.sha256", "claim_status_ratio",
                     "claim_ratio_citation"):
            self.assertIn(want, kinds)
        ratio = [r for r in rows if r["kind"] == "claim_status_ratio"]
        self.assertTrue(any("demonstrated: 2/3" in r["cited"] for r in ratio))

    def test_planted_false_pinned_commit_is_flagged(self):
        bad = GOOD.replace(
            "Pin-relative source:",
            "**Pinned commit:** `dddddddddddddddddddddddddddddddddddddddd`\n\nPin-relative source:")
        packet = make_root(self.root, bad)
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertGreaterEqual(failed, 1)
        self.assertTrue(any(r["kind"] == "pinned_commit_citation"
                            and r["verdict"] == "FAIL" for r in rows))
        self.assertEqual(cv.cmd_verify(self.root, None, None), 1)

    def test_planted_false_claim_count_is_flagged(self):
        bad = GOOD.replace("Claim inventory: 3 claims",
                           "Claim inventory: 999 claims")
        packet = make_root(self.root, bad)
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertGreaterEqual(failed, 1)
        self.assertTrue(any(r["kind"] == "claim_count_citation"
                            and r["verdict"] == "FAIL" for r in rows))

    def test_planted_false_ratio_is_flagged(self):
        bad = GOOD.replace("2 of 3 claims demonstrated",
                           "1 of 3 claims demonstrated")
        packet = make_root(self.root, bad)
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertTrue(any(r["kind"] == "claim_ratio_citation"
                            and r["verdict"] == "FAIL" for r in rows))

    def test_tampered_receipt_number_is_flagged(self):
        def mutate(receipt):
            receipt["claim_set"]["count"] = 42
            receipt["packet_sha256"] = "0" * 64
        packet = make_root(self.root, GOOD, receipt_mutate=mutate)
        rows, failed = cv.derive_packet(self.root, packet)
        kinds = {r["kind"] for r in rows if r["verdict"] == "FAIL"}
        self.assertIn("claim_set.count", kinds)
        self.assertIn("packet_sha256", kinds)
        self.assertEqual(cv.cmd_verify(self.root, None, None), 1)

    def test_missing_receipt_fails(self):
        packet = make_root(self.root, GOOD)
        packet.with_name("demo_repo-assessment.receipt.json").unlink()
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertEqual(failed, 1)

    def test_external_hash_is_unverifiable_not_passed(self):
        text = GOOD + "\nExternal digest: `" + "e" * 64 + "`\n"
        packet = make_root(self.root, text)
        rows, failed = cv.derive_packet(self.root, packet)
        self.assertEqual(failed, 0)
        self.assertTrue(any(r["verdict"] == "UNVERIFIABLE" for r in rows))


if __name__ == "__main__":
    unittest.main()
