#!/usr/bin/env python3
"""Golden-packet regression suite: catches silent packet drift.

Bead fr-itk. A small set of golden packets carries known-good derivations
banked in scripts/golden-packets.json. The suite re-derives each golden
packet from its pinned inputs (via scripts/packet-receipts.py, bead
fr-1pq) on every corpus change and fails on any unexplained delta.

Why this is not just `packet-receipts.py verify`: receipts can be
re-emitted after a packet edit, which makes receipt-verify pass again.
The golden file is banked independently and is only re-banked by the
explicit `emit` ceremony in the same commit as the reviewed packet
change (the gate U kit-regression pattern). A one-character packet
edit therefore fails this suite even if receipts were regenerated,
until a human reviews the diff and re-banks the golden.

Commands (run from the repo root):
  python3 scripts/golden-packets.py verify   # CI gate: exit 1 on drift
  python3 scripts/golden-packets.py emit     # banking ceremony: re-bank

Exit status: verify 0 iff every golden packet re-derives identically.
Stdlib only. See docs/golden-packets.md.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

SCHEMA = "franken-research/golden-packets@1"
TOOL = "scripts/golden-packets.py@1"
GOLDEN_PATH = Path("scripts/golden-packets.json")

# The golden set: small, diverse (size, header style, name shape), and
# every member's receipt currently verifies IDENTICAL. Chosen 2026-10-03.
GOLDEN_STEMS = (
    "asupersync",          # substrate packet, largest claim inventory
    "beads-for-frankentui",  # hyphenated stem edge case
    "franken_lean",        # smallest packet (149 lines)
    "frankenfs",           # mid-size, table-style header
    "frankenredis",        # large packet, sibling-rejection narrative
    "frankensim",          # mid-size, Pin:-label header style
)


def load_receipts_module(root: Path):
    spec = importlib.util.spec_from_file_location(
        "packet_receipts", root / "scripts" / "packet-receipts.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build_golden(root: Path) -> dict:
    """Re-derive every golden packet's known-good derivation."""
    receipts = load_receipts_module(root)
    packets = []
    for stem in GOLDEN_STEMS:
        packet = root / "packets" / f"{stem}-assessment.md"
        if not packet.exists():
            raise SystemExit(f"golden packet missing: {packet}")
        packets.append(receipts.build_receipt(root, packet))
    return {"schema": SCHEMA, "tool": TOOL, "packets": packets}


def render(golden: dict) -> bytes:
    return (json.dumps(golden, sort_keys=True, indent=2) + "\n").encode()


def explain_delta(old: dict, new: dict) -> list[str]:
    """Field-level explanation of a golden drift, per packet."""
    out = []
    old_by = {p["packet"]: p for p in old.get("packets", [])}
    new_by = {p["packet"]: p for p in new.get("packets", [])}
    for name in sorted(set(old_by) | set(new_by)):
        if name not in old_by:
            out.append(f"  {name}: not in banked golden (new golden member?)")
            continue
        if name not in new_by:
            out.append(f"  {name}: golden packet missing on disk")
            continue
        o, n = old_by[name], new_by[name]
        for key in ("packet_sha256", "packet_bytes", "packet_lines"):
            if o.get(key) != n.get(key):
                out.append(f"  {name} {key}: {o.get(key)} -> {n.get(key)}")
        for key in ("repository", "pinned_commit", "assessment_date"):
            if o.get("pins", {}).get(key) != n.get("pins", {}).get(key):
                out.append(f"  {name} pins.{key}: "
                           f"{o.get('pins', {}).get(key)} -> {n.get('pins', {}).get(key)}")
        if o.get("claim_set") != n.get("claim_set"):
            out.append(f"  {name} claim_set: {o.get('claim_set')} -> {n.get('claim_set')}")
        if o.get("pins", {}).get("grader_protocol") != n.get("pins", {}).get("grader_protocol"):
            out.append(f"  {name} pins.grader_protocol (RULEBOOK.md) changed")
    return out


def cmd_emit(root: Path) -> int:
    golden = build_golden(root)
    (root / GOLDEN_PATH).write_bytes(render(golden))
    print(f"banked {GOLDEN_PATH} ({len(golden['packets'])} golden packets)")
    return 0


def cmd_verify(root: Path) -> int:
    golden_file = root / GOLDEN_PATH
    if not golden_file.exists():
        print(f"FAIL no banked golden file: {GOLDEN_PATH} (run emit to bank)")
        return 1
    banked = json.loads(golden_file.read_text())
    fresh = build_golden(root)
    if render(banked) == render(fresh):
        print(f"verify: {len(fresh['packets'])}/{len(fresh['packets'])} "
              "golden packets re-derive identically")
        for p in fresh["packets"]:
            print(f"IDENTICAL        {Path(p['packet']).name} "
                  f"pin={p['pins']['pinned_commit']} sha256={p['packet_sha256'][:16]}...")
        return 0
    print("DRIFT golden packet(s) no longer re-derive to the banked derivation:")
    for line in explain_delta(banked, fresh):
        print(line)
    print("If this packet change was reviewed and intended, re-bank with: "
          "python3 scripts/golden-packets.py emit")
    return 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path,
                    default=Path(__file__).resolve().parents[1])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("emit", help="banking ceremony: re-bank golden derivations")
    sub.add_parser("verify", help="re-derive goldens; exit 1 on any delta")
    args = ap.parse_args()
    root = args.root.resolve()
    return cmd_emit(root) if args.cmd == "emit" else cmd_verify(root)


if __name__ == "__main__":
    sys.exit(main())
