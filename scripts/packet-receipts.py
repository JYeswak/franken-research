#!/usr/bin/env python3
"""Deterministic packet receipts: pin, hash, regenerate, verify.

Every assessment packet in packets/ gets a receipt next to it
(packets/<name>-assessment.receipt.json) recording the pinned inputs the
packet was assessed from -- target-repo commit, claim set, and the grading
protocol (RULEBOOK.md) -- plus the packet's own sha256. Receipts are
rendered deterministically (sorted keys, fixed indent, no timestamps), so
regenerating a receipt from the same pinned inputs reproduces it
byte-for-byte. `verify` re-derives every receipt and, on drift, explains
the difference field by field and line by line against the git-committed
packet baseline.

Commands (run from the repo root):
  python3 scripts/packet-receipts.py emit [--only STEM ...]
  python3 scripts/packet-receipts.py verify [--only STEM ...] [--report PATH]

Exit status: emit always 0 on success; verify 0 iff every checked packet
regenerates identically, 1 on any drift or missing receipt.
Stdlib only. See docs/packet-receipts.md for the schema and field rules.
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
from pathlib import Path

SCHEMA = "franken-research/packet-receipt@1"
TOOL = "scripts/packet-receipts.py@1"
HEX40 = re.compile(r"[0-9a-f]{40}")
DATE = re.compile(r"\d{4}-\d{2}-\d{2}")
PIN_LABELS = ("Pinned commit", "Pinned revision", "Pinned HEAD commit", "**Pin:**")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run_git(root: Path, *args: str) -> str | None:
    """Short git call with timeout and whole-process-group kill on timeout."""
    try:
        proc = subprocess.Popen(
            ["git", *args], cwd=root, text=True,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            start_new_session=True)
        out, _ = proc.communicate(timeout=30)
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        proc.wait()
        return None
    except OSError:
        return None
    return out if proc.returncode == 0 else None


def extract_repo(lines: list[str], stem: str) -> str:
    for ln in lines[:40]:
        if re.match(r"\*\*(Repository|Repo):\*", ln.strip()):
            m = re.search(r"(Dicklesworthstone/[A-Za-z0-9_.\-]+)", ln)
            if m:
                return m.group(1)
    for ln in lines[:120]:
        m = re.search(r"github\.com/(Dicklesworthstone/[A-Za-z0-9_.\-]+)/commit/", ln)
        if m:
            return m.group(1)
    return "Dicklesworthstone/" + stem.replace("-assessment", "")


def extract_pin(lines: list[str]) -> str | None:
    for ln in lines[:120]:
        if any(label in ln for label in PIN_LABELS):
            m = HEX40.search(ln)
            if m:
                return m.group(0)
    for ln in lines[:120]:
        m = re.search(r"commit/([0-9a-f]{40})", ln)
        if m:
            return m.group(1)
    return None


def extract_date(lines: list[str], pin: str | None) -> str | None:
    for ln in lines:
        if "Assessment date" in ln:
            m = DATE.search(ln)
            if m:
                return m.group(0)
    for ln in lines[:40]:
        if "Packet version:" in ln:
            m = DATE.search(ln)
            if m:
                return m.group(0)
    if pin:
        for ln in lines[:120]:
            if pin in ln:
                m = DATE.search(ln)
                if m:
                    return m.group(0)
    return None


def extract_claim_set(lines: list[str]) -> dict | None:
    """Hash the claim-inventory table (Rulebook section 4.3 in both schemes).

    Rows are whitespace-normalized so reflowing a cell does not churn the
    hash; the header and separator rows are excluded.
    """
    start = level = None
    for i, ln in enumerate(lines):
        m = re.match(r"(#{1,4})\s+(.*)", ln)
        if m and "claim inventory" in m.group(2).lower():
            start, level = i, len(m.group(1))
            break
    if start is None:
        for i, ln in enumerate(lines):
            m = re.match(r"(#{1,4})\s+4\.3(\s|\b)", ln)
            if m:
                start, level = i, len(m.group(1))
                break
    if start is None:
        return None
    section = []
    for ln in lines[start + 1:]:
        m = re.match(r"(#{1,4})\s+", ln)
        if m and len(m.group(1)) <= level:
            break
        section.append(ln)
    rows = [r for r in section if r.lstrip().startswith("|")]
    rows = [r for r in rows if not re.match(r"\s*\|[\s:|-]+\|\s*$", r)]
    if not rows:
        return None
    data = [" ".join(r.split()) for r in rows[1:]]
    return {"count": len(data), "sha256": sha256(("\n".join(data) + "\n").encode())}


def rulebook_pin(root: Path) -> dict:
    text = (root / "RULEBOOK.md").read_bytes()
    m = re.search(rb"Version:\*\*\s*([0-9.]+)", text)
    return {"path": "RULEBOOK.md",
            "version": m.group(1).decode() if m else None,
            "sha256": sha256(text)}


def build_receipt(root: Path, packet: Path) -> dict:
    raw = packet.read_bytes()
    lines = raw.decode("utf-8", errors="replace").splitlines()
    pin = extract_pin(lines)
    return {
        "schema": SCHEMA,
        "tool": TOOL,
        "packet": packet.relative_to(root).as_posix(),
        "packet_sha256": sha256(raw),
        "packet_bytes": len(raw),
        "packet_lines": len(lines),
        "pins": {
            "repository": extract_repo(lines, packet.stem),
            "pinned_commit": pin,
            "assessment_date": extract_date(lines, pin),
            "grader_protocol": rulebook_pin(root),
        },
        "claim_set": extract_claim_set(lines),
    }


def render(receipt: dict) -> bytes:
    return (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()


def packet_files(root: Path, only: list[str] | None) -> list[Path]:
    files = sorted((root / "packets").glob("*-assessment.md"))
    if only:
        wanted = {s + "-assessment.md" for s in only}
        files = [f for f in files if f.name in wanted]
        missing = wanted - {f.name for f in files}
        if missing:
            raise SystemExit(f"unknown packet stem(s): {sorted(missing)}")
    return files


def receipt_path(packet: Path) -> Path:
    return packet.with_name(packet.name.replace("-assessment.md", "-assessment.receipt.json"))


def explain_drift(root: Path, packet: Path, old: dict, new: dict) -> list[str]:
    """Field-level then line-level explanation of a regeneration drift."""
    out = []
    for key in ("packet_sha256", "packet_bytes", "packet_lines"):
        if old.get(key) != new.get(key):
            out.append(f"  {key}: {old.get(key)} -> {new.get(key)}")
    for key in ("repository", "pinned_commit", "assessment_date"):
        if old.get("pins", {}).get(key) != new.get("pins", {}).get(key):
            out.append(f"  pins.{key}: {old.get('pins', {}).get(key)} -> {new.get('pins', {}).get(key)}")
    if old.get("claim_set") != new.get("claim_set"):
        out.append(f"  claim_set: {old.get('claim_set')} -> {new.get('claim_set')}")
    if old.get("pins", {}).get("grader_protocol") != new.get("pins", {}).get("grader_protocol"):
        out.append("  pins.grader_protocol (RULEBOOK.md) changed since the receipt was emitted")
    rel = packet.relative_to(root).as_posix()
    baseline = run_git(root, "show", f"HEAD:{rel}")
    if baseline is not None:
        old_lines = baseline.splitlines()
        new_lines = packet.read_text(encoding="utf-8", errors="replace").splitlines()
        diff = list(difflib.unified_diff(
            old_lines, new_lines, fromfile=f"a/{rel} (committed)", tofile=f"b/{rel} (current)",
            lineterm="", n=1))
        added = sum(1 for d in diff if d.startswith("+") and not d.startswith("+++"))
        removed = sum(1 for d in diff if d.startswith("-") and not d.startswith("---"))
        out.append(f"  packet text vs committed baseline: {added} line(s) added, {removed} line(s) removed")
        out.extend("  " + d for d in diff[:80])
        if len(diff) > 80:
            out.append(f"  ... diff truncated, {len(diff) - 80} more line(s)")
    else:
        out.append("  no git baseline available; re-emit the receipt to re-pin this packet")
    return out


def cmd_emit(root: Path, only: list[str] | None) -> int:
    for packet in packet_files(root, only):
        receipt_path(packet).write_bytes(render(build_receipt(root, packet)))
        print(f"emitted {receipt_path(packet).relative_to(root)}")
    return 0


def cmd_verify(root: Path, only: list[str] | None, report: Path | None) -> int:
    rows, sections, drifted = [], [], 0
    pending_explain: list[tuple[str, str]] = []
    for packet in packet_files(root, only):
        rp = receipt_path(packet)
        fresh = build_receipt(root, packet)
        if not rp.exists():
            verdict = "MISSING-RECEIPT"
            drifted += 1
            sections.append(f"### {packet.name}\n\nNo receipt committed. Run `emit`.\n")
        elif rp.read_bytes() == render(fresh):
            verdict = "IDENTICAL"
        else:
            verdict = "DRIFT"
            drifted += 1
            old = json.loads(rp.read_text())
            detail = "\n".join(explain_drift(root, packet, old, fresh))
            sections.append(f"### {packet.name}\n\n```\n{detail}\n```\n")
            pending_explain.append((packet.name, detail))
        pins = fresh["pins"]
        claims = fresh["claim_set"] or {}
        rows.append((packet.name, pins["pinned_commit"], fresh["packet_sha256"],
                     claims.get("count"), verdict))
        print(f"{verdict:16s} {packet.name} pin={pins['pinned_commit']} sha256={fresh['packet_sha256'][:16]}...")
    for name, detail in pending_explain:
        print(f"--- explained diff: {name}\n{detail}")
    print(f"verify: {len(rows) - drifted}/{len(rows)} identical, {drifted} drifted/missing")
    if report:
        table = ["| Packet | Pinned commit | Packet sha256 | Claims | Verdict |",
                 "|---|---|---|---|---|"]
        table += [f"| {n} | `{p}` | `{s}` | {c} | {v} |" for n, p, s, c, v in rows]
        body = "\n".join(table)
        if sections:
            body += "\n\n## Explained diffs\n\n" + "\n".join(sections)
        report.write_text(body + "\n")
        print(f"report written: {report}")
    return 1 if drifted else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("emit", "verify"):
        p = sub.add_parser(name)
        p.add_argument("--only", action="append", metavar="STEM",
                       help="packet stem without -assessment (repeatable)")
    sub.choices["verify"].add_argument("--report", type=Path)
    args = ap.parse_args()
    root = args.root.resolve()
    if args.cmd == "emit":
        return cmd_emit(root, args.only)
    return cmd_verify(root, args.only, args.report)


if __name__ == "__main__":
    sys.exit(main())
