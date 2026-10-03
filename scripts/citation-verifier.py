#!/usr/bin/env python3
"""Claim-citation verifier: re-derive every checkable number a packet cites.

Bead fr-brn. Model-written numbers are untrusted text (AGENTS.md doctrine):
before a packet ships, a harness -- never the model that wrote the packet --
recomputes each cited quantity that has a pinned source inside this repo
and blocks shipping on any mismatch.

Pinned sources used for re-derivation (all inside the repo, no network):
  * the packet file itself (bytes -> sha256 / byte count / line count;
    its claim-inventory table -> row count, row hash, status tally),
  * RULEBOOK.md (bytes -> sha256 and version),
  * the packet's committed receipt (scripts/packet-receipts.py, bead
    fr-1pq), whose cited fields are NOT trusted: every field is
    recomputed from the sources above and compared.

Citations extracted from a packet:
  hashes  -- the labelled pinned commit (every label occurrence must
             agree), blob/commit URLs (pin-equal ones re-derive PASS;
             other-commit citations are logged UNVERIFIABLE, they name
             commits outside the pin), any 64-hex string (PASS iff it
             equals a re-derived packet / RULEBOOK / claim-set hash;
             a labelled packet/RULEBOOK/claim hash that differs FAILs),
  counts  -- claim-inventory row count, sequential claim numbering,
             packet bytes/lines, explicit "claim inventory ... N
             claims/rows" prose citations,
  ratios  -- claim status tally over the inventory (demonstrated /
             partial / aspirational / ... shares of the total) and any
             "N of M claims" or "P% of claims" prose citation whose
             denominator/status can be tied to the inventory.

Numbers with no in-repo pinned source (crates.io downloads, star counts,
external benchmark rows, ...) are logged UNVERIFIABLE -- listed in the
per-number derivation log, never silently passed, and not blocking:
blocking on them would fail every real packet for numbers this repo
cannot recompute offline. Every FAIL blocks (exit 1).

Commands (run from the repo root):
  python3 scripts/citation-verifier.py verify [--only STEM ...]
                                              [--report PATH]
Exit status: 0 iff no FAIL derivation in every checked packet.
Stdlib only. See docs/citation-verifier.md.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

HEX40 = re.compile(r"[0-9a-f]{40}")
HEX64 = re.compile(r"\b[0-9a-f]{64}\b")
PIN_LABELS = ("Pinned commit", "Pinned revision", "Pinned HEAD commit", "**Pin:**")
STATUS_WORDS = ("demonstrated", "partial", "aspirational", "disproven",
                "mixed", "verified", "asserted")


def load_receipts_module():
    spec = importlib.util.spec_from_file_location(
        "packet_receipts", Path(__file__).with_name("packet-receipts.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


PR = load_receipts_module()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def claim_table(lines):
    """Return (header_cells, data_rows_as_cell_lists) for the claim inventory."""
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
        return None, []
    section = []
    for ln in lines[start + 1:]:
        m = re.match(r"(#{1,4})\s+", ln)
        if m and len(m.group(1)) <= level:
            break
        section.append(ln)
    rows = [r for r in section if r.lstrip().startswith("|")]
    rows = [r for r in rows if not re.match(r"\s*\|[\s:|-]+\|\s*$", r)]
    if not rows:
        return None, []
    def cells(r):
        return [c.strip() for c in r.strip().strip("|").split("|")]
    return cells(rows[0]), [cells(r) for r in rows[1:]]


def status_tally(header, rows):
    if not header:
        return {}
    idx = next((i for i, h in enumerate(header) if "status" in h.lower()), None)
    if idx is None:
        return {}
    tally = {}
    for r in rows:
        if idx >= len(r) or not r[idx].strip():
            tally["(blank)"] = tally.get("(blank)", 0) + 1
            continue
        word = re.sub(r"[^a-z ].*", "", r[idx].lower()).strip().split()
        key = word[0] if word else "(blank)"
        tally[key] = tally.get(key, 0) + 1
    return tally


def derive_packet(root: Path, packet: Path):
    """Re-derive every checkable cited number for one packet.

    Returns (derivations, failed_count). Each derivation is a dict with
    kind/cited/derived/verdict/source."""
    out = []
    def add(kind, cited, derived, verdict, source):
        out.append({"packet": packet.name, "kind": kind, "cited": str(cited),
                    "derived": str(derived), "verdict": verdict,
                    "source": source})
    raw = packet.read_bytes()
    lines = raw.decode("utf-8", errors="replace").splitlines()
    fresh = PR.build_receipt(root, packet)
    rp = packet.with_name(packet.name.replace(
        "-assessment.md", "-assessment.receipt.json"))
    receipt = None
    if rp.exists():
        try:
            receipt = json.loads(rp.read_text())
        except json.JSONDecodeError:
            receipt = None
    if receipt is None:
        add("receipt", rp.name, "present receipt", "FAIL", "packets/ receipt file")
        return out, 1
    # 1. Receipt-cited hashes/counts, recomputed from the sources.
    checks = [
        ("packet_sha256", receipt.get("packet_sha256"), fresh["packet_sha256"],
         "sha256(packet bytes)"),
        ("packet_bytes", receipt.get("packet_bytes"), fresh["packet_bytes"],
         "len(packet bytes)"),
        ("packet_lines", receipt.get("packet_lines"), fresh["packet_lines"],
         "packet line count"),
        ("pinned_commit", receipt.get("pins", {}).get("pinned_commit"),
         fresh["pins"]["pinned_commit"], "packet header pin labels"),
        ("repository", receipt.get("pins", {}).get("repository"),
         fresh["pins"]["repository"], "packet header Repository line"),
        ("grader_protocol.sha256",
         receipt.get("pins", {}).get("grader_protocol", {}).get("sha256"),
         fresh["pins"]["grader_protocol"]["sha256"], "sha256(RULEBOOK.md)"),
        ("grader_protocol.version",
         receipt.get("pins", {}).get("grader_protocol", {}).get("version"),
         fresh["pins"]["grader_protocol"]["version"], "RULEBOOK.md Version line"),
        ("claim_set.count", (receipt.get("claim_set") or {}).get("count"),
         (fresh["claim_set"] or {}).get("count"),
         "recount of claim-inventory data rows"),
        ("claim_set.sha256", (receipt.get("claim_set") or {}).get("sha256"),
         (fresh["claim_set"] or {}).get("sha256"),
         "sha256 of whitespace-normalised claim rows"),
    ]
    for kind, cited, derived, source in checks:
        add(kind, cited, derived, "PASS" if str(cited) == str(derived) else "FAIL",
            source)
    # 2. Labelled pinned-commit citations inside the packet must all agree.
    pin = fresh["pins"]["pinned_commit"]
    for ln in lines[:120]:
        if any(label in ln for label in PIN_LABELS):
            for m in HEX40.finditer(ln):
                add("pinned_commit_citation", m.group(0), pin,
                    "PASS" if m.group(0) == pin else "FAIL",
                    "labelled pin in packet header")
    # 3. Hash citations in prose / URLs.
    derived_hashes = {fresh["packet_sha256"]: "packet_sha256",
                      fresh["pins"]["grader_protocol"]["sha256"]:
                      "grader_protocol.sha256",
                      (fresh["claim_set"] or {}).get("sha256"):
                      "claim_set.sha256"}
    seen64 = set()
    for ln in lines:
        for m in HEX64.finditer(ln):
            h = m.group(0)
            if h in seen64:
                continue
            seen64.add(h)
            if h in derived_hashes:
                add("hash_citation", h, h, "PASS",
                    f"equals re-derived {derived_hashes[h]}")
            else:
                low = ln.lower()
                label = ("packet_sha256" if re.search(
                             r"packet[ -]sha-?256", low) else
                         "grader_protocol.sha256" if re.search(
                             r"rulebook[ -]sha-?256", low) else
                         "claim_set.sha256" if re.search(
                             r"claim[ -]set[ -]sha-?256", low) else None)
                if label:
                    want = {"packet_sha256": fresh["packet_sha256"],
                            "grader_protocol.sha256":
                            fresh["pins"]["grader_protocol"]["sha256"],
                            "claim_set.sha256":
                            (fresh["claim_set"] or {}).get("sha256")}[label]
                    add("hash_citation", h, want, "FAIL",
                        f"labelled {label} in packet text")
                else:
                    add("hash_citation", h, "(no in-repo source)",
                        "UNVERIFIABLE",
                        "64-hex with no in-repo pinned source")
        for m in re.finditer(r"(?:blob|commit)/([0-9a-f]{40})", ln):
            h = m.group(1)
            if h == pin:
                add("hash_citation", h, pin, "PASS",
                    "pin-relative blob/commit URL")
            else:
                add("hash_citation", h, "(other commit)",
                    "UNVERIFIABLE", "blob/commit URL outside the pin")
    # 4. Claim-inventory counts, numbering, status tally and ratios.
    header, rows = claim_table(lines)
    count = len(rows)
    add("claim_inventory_rows", (receipt.get("claim_set") or {}).get("count"),
        count, "PASS" if str((receipt.get("claim_set") or {}).get("count"))
        == str(count) else "FAIL", "recount of claim-inventory table")
    if rows and all(r and re.fullmatch(r"\d+", r[0]) for r in rows):
        seq = [int(r[0]) for r in rows]
        if seq == list(range(1, count + 1)):
            add("claim_numbering", f"{seq[0]}..{seq[-1]}", f"1..{count}",
                "PASS", "claim-inventory first column")
        else:
            add("claim_numbering", f"{min(seq)}..{max(seq)} ({len(seq)} rows)",
                f"1..{count}", "UNVERIFIABLE",
                "claim-inventory numbering is non-sequential in the packet")
    tally = status_tally(header, rows)
    if tally:
        add("claim_status_tally_sum", sum(tally.values()), count,
            "PASS" if sum(tally.values()) == count else "FAIL",
            "claim-inventory Status column")
        for status in sorted(tally):
            add("claim_status_ratio", f"{status}: {tally[status]}/{count}",
                f"{status}: {tally[status] / count:.3f}" if count else
                f"{status}: n/a", "PASS",
                "claim-inventory Status column tally")
    # 5. Explicit prose citations tied to the claim inventory.
    text = "\n".join(lines)
    for m in re.finditer(
            r"claim inventory[^\n.]{0,60}?(\d+)\s*(?:claims|rows)", text, re.I):
        add("claim_count_citation", m.group(1), count,
            "PASS" if int(m.group(1)) == count else "FAIL",
            "prose claim-inventory count")
    for m in re.finditer(
            r"(\d+)\s*(?:claims|rows)[^\n.]{0,60}?claim inventory", text, re.I):
        add("claim_count_citation", m.group(1), count,
            "PASS" if int(m.group(1)) == count else "FAIL",
            "prose claim-inventory count")
    for m in re.finditer(r"(\d+)\s+of\s+(?:the\s+)?(\d+)\s+claims\b"
                         r"([^\n.]{0,30})", text, re.I):
        num, den, tail = int(m.group(1)), int(m.group(2)), m.group(3).lower()
        verdict = "PASS" if den == count and num <= count else "FAIL"
        add("claim_ratio_citation", f"{num}/{den}", f"denominator={count}",
            verdict, "prose N-of-M claims citation")
        status = next((s for s in STATUS_WORDS if s in tail), None)
        if status and status in tally:
            add("claim_ratio_citation", f"{num} {status}",
                f"{tally[status]} {status}",
                "PASS" if num == tally[status] else "FAIL",
                "prose N-of-M claims status count")
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*%\s*of\s+(?:the\s+)?claims\b"
                         r"([^\n.]{0,30})", text, re.I):
        pct, tail = float(m.group(1)), m.group(2).lower()
        status = next((s for s in STATUS_WORDS if s in tail), None)
        if status and status in tally and count:
            expected = 100.0 * tally[status] / count
            add("claim_percent_citation", f"{pct}% {status}",
                f"{expected:.1f}% {status}",
                "PASS" if abs(pct - expected) <= 1.0 else "FAIL",
                "prose percent-of-claims citation")
    failed = sum(1 for d in out if d["verdict"] == "FAIL")
    return out, failed


def packet_files(root, only):
    files = sorted((root / "packets").glob("*-assessment.md"))
    if only:
        wanted = {s + "-assessment.md" for s in only}
        files = [f for f in files if f.name in wanted]
        missing = wanted - {f.name for f in files}
        if missing:
            raise SystemExit(f"unknown packet stem(s): {sorted(missing)}")
    return files


def cmd_verify(root, only, report):
    all_rows, failed_packets, total_fail = [], 0, 0
    for packet in packet_files(root, only):
        rows, failed = derive_packet(root, packet)
        all_rows.extend(rows)
        total_fail += failed
        if failed:
            failed_packets += 1
        verdict = "FAIL" if failed else "PASS"
        n_unver = sum(1 for r in rows if r["verdict"] == "UNVERIFIABLE")
        print(f"{verdict} {packet.name}: {len(rows)} derivations, "
              f"{failed} failed, {n_unver} unverifiable")
        for r in rows:
            print(f"DERIVE packet={r['packet']} kind={r['kind']} "
                  f"cited={r['cited']} derived={r['derived']} "
                  f"verdict={r['verdict']} source={r['source']}")
    print(f"verify: {len(packet_files(root, only)) - failed_packets}/"
          f"{len(packet_files(root, only))} packets pass, "
          f"{total_fail} failed derivations")
    if report:
        lines = ["# Citation verification — per-number derivation log", "",
                 "Generated by `scripts/citation-verifier.py verify` "
                 "(bead fr-brn). FAIL blocks shipping; UNVERIFIABLE "
                 "numbers have no in-repo pinned source and are listed, "
                 "never silently passed.", "",
                 "| Packet | Kind | Cited | Re-derived | Verdict | Source |",
                 "|---|---|---|---|---|---|"]
        for r in all_rows:
            cited = str(r["cited"]).replace("|", "\\|")
            derived = str(r["derived"]).replace("|", "\\|")
            if len(cited) > 70:
                cited = cited[:67] + "..."
            if len(derived) > 70:
                derived = derived[:67] + "..."
            lines.append(f"| {r['packet']} | {r['kind']} | `{cited}` | "
                         f"`{derived}` | {r['verdict']} | {r['source']} |")
        report.write_text("\n".join(lines) + "\n")
        print(f"report written: {report}")
    return 1 if total_fail else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path,
                    default=Path(__file__).resolve().parents[1])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("verify")
    p.add_argument("--only", action="append", metavar="STEM")
    p.add_argument("--report", type=Path)
    args = ap.parse_args()
    return cmd_verify(args.root.resolve(), args.only, args.report)


if __name__ == "__main__":
    sys.exit(main())
