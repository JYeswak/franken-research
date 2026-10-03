#!/usr/bin/env python3
"""Synthesis drift monitor: re-check synthesis tallies against the packets.

The synthesis documents (synthesis/*.md) make cross-packet claims --
counts, tallies, named membership lists -- that were counted from the 44
assessment packets on 2026-09-22. The moment any packet changes, those
claims can silently go stale (the v2 ZIP already needed one full
rebuild). This monitor re-derives every machine-checkable claim from the
current packets and compares it against the claim as written:

  * per-packet TRL, NODUS ring, license class, bus factor and
    no-contributions policy, extracted from each packet's own verdict /
    factsheet / license sections;
  * the master matrix in synthesis/00-overview.md, cell by cell, against
    the packet-derived values;
  * the aggregate tallies (NODUS, TRL, license, CI, release, bus factor,
    no-contrib) re-counted both from the packets and from the matrix,
    compared against the numbers the overview asserts, including its
    own "Count checks:" line;
  * the named membership lists (Pilot/Monitor sets, per-TRL sets, the
    19-name no-contributions list, the license exception lists) compared
    against the derived sets;
  * restatements of the same claims in synthesis/negative-patterns.md
    (P1, P2, P3 headers and exception lists; the P4 named-instance list
    must cover exactly the corpus);
  * the CI-requirements classes in synthesis/ci-requirements.md: each
    C1-C6 header count and membership table against the per-packet CI
    codes in the master matrix;
  * the negative-patterns P5 CI breakdown, P6 release breakdown and
    P7 zero-validation header, re-derived from the matrix CI/release
    codes and the packet-derived NODUS rings;
  * the cross-packet tallies restated in synthesis/hurdles-issues.md
    (rider, bus factor, no-contrib, CI and release breakdowns) and in
    synthesis/external-validation-2026-09.md.

Claims that are semantic pattern counts rather than structured tallies
(the uniqueness catalog, the prose instances inside the patterns)
cannot be re-derived mechanically; the monitor inventories every n/44
claim across the synthesis docs in its report and marks which checks
cover it, so the unchecked residue is explicit, never silent.

Commands (run from the repo root):
  python3 scripts/synthesis-drift.py check [--report PATH] [--json]
  python3 scripts/synthesis-drift.py check --file-beads   # also file
        one bead per drifted claim (dedupe via `br search`; run only
        from the main checkout, where .beads/ lives)

Exit status: 0 iff every checked claim reproduces; 1 on any drift,
extraction failure, or unparseable claim. Stdlib only.
See docs/synthesis-drift.md for the runbook and cadence.
"""
import argparse
import json
import os
import re
import signal
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
ROOT = HERE.parents[1]
PACKETS = ROOT / "packets"
SYNTHESIS = ROOT / "synthesis"
OVERVIEW = SYNTHESIS / "00-overview.md"
NEGPAT = SYNTHESIS / "negative-patterns.md"

RINGS = ("Explore", "Monitor", "Pilot", "Invest")
BACKTICK = re.compile(r"`([a-z0-9_\-]+)`")
N44 = re.compile(r"(\d+)\s*/\s*44")


def norm_trl(s: str) -> str:
    return s.replace("\u2013", "-").replace("\u2014", "-").strip()


# ---------------------------------------------------------------- packets

def extract_ring(text: str):
    m = re.search(r"NODUS ring:?\s*\**(Explore|Monitor|Pilot|Invest)", text)
    if m:
        return m.group(1), "NODUS ring verdict line"
    m = re.search(r"\*\*NODUS ring\*\*\s*\|\s*\**(Explore|Monitor|Pilot|Invest)", text)
    if m:
        return m.group(1), "NODUS ring factsheet row"
    return None, None


def extract_trl(text: str):
    m = re.search(r"\(TRL\s+([0-9][0-9\u2013\-]*)\s*[\u2014\-]", text)
    if m:
        return norm_trl(m.group(1)), "ring line (TRL ...)"
    m = re.search(r"Technology readiness \(TRL 1\u20139\)\s*\|\s*\**([0-9][0-9\u2013\-]*)", text)
    if m:
        return norm_trl(m.group(1)), "factsheet Technology readiness (TRL 1-9)"
    m = re.search(r"Technology readiness\s*\|\s*TRL 1\u20139\s*\|\s*\**([0-9][0-9\u2013\-]*)", text)
    if m:
        return norm_trl(m.group(1)), "factsheet readiness | TRL 1-9 scale | value"
    m = re.search(r"Technology readiness\s*\|\s*\**TRL\s+([0-9][0-9\u2013\-]*)", text)
    if m:
        return norm_trl(m.group(1)), "factsheet Technology readiness | TRL n"
    m = re.search(r"Verdict: TRL\s+([0-9][0-9\u2013\-]*)", text)
    if m:
        return norm_trl(m.group(1)), "Verdict: TRL n"
    m = re.search(r"TRL is called as\s+([0-9][0-9\u2013\-]*)", text)
    if m:
        return norm_trl(m.group(1)), "TRL is called as n"
    m = re.search(r"\*\*TRL\s+([0-9][0-9\u2013\-]*)\.\s+NODUS", text)
    if m:
        return norm_trl(m.group(1)), "prose TRL n. NODUS"
    return None, None


LICENSE_NONE = [
    # Capital-N sentence-initial forms: a lowercase mid-sentence mention
    # (e.g. franken_nlp's HuggingFace tree) is about some other tree.
    re.compile(r"No LICENSE file"),
    re.compile(r"contains no LICENSE file"),
    re.compile(r"rider applies here\s*\|\s*\*\*disproven\*\*", re.I),
]
LICENSE_PLAIN = [
    re.compile(r"plain[-\s]MIT[^\n]*no[-\s]rider", re.I),
    re.compile(r"no AI-lab rider", re.I),
    re.compile(r"rider-free license", re.I),
    re.compile(r"plain MIT, no rider", re.I),
]
LICENSE_RIDER = [
    re.compile(r"\[License \([^\]]*rider[^\]]*\)\]", re.I),
    re.compile(r"MIT\s*\+\s*OpenAI/Anthropic rider", re.I),
    re.compile(r"MIT with OpenAI/Anthropic rider", re.I),
    re.compile(r"with AI-lab rider", re.I),
    re.compile(r"MIT License \(with OpenAI/Anthropic Rider\)", re.I),
    re.compile(r"\*\*License:\*\*[^\n]*rider", re.I),
]


def extract_license(text: str):
    """Classify from the packet's own license statements.

    Priority none > plain > rider: a packet that says 'no LICENSE file'
    while quoting the suite rider for contrast is unlicensed, not
    rider-carrying. Conflicting positive signals are reported, not
    silently resolved."""
    hits = {}
    for cls, pats in (("none", LICENSE_NONE), ("plain", LICENSE_PLAIN),
                      ("rider", LICENSE_RIDER)):
        for p in pats:
            if p.search(text):
                hits[cls] = p.pattern
                break
    if not hits:
        return None, None
    for cls in ("none", "plain", "rider"):
        if cls in hits:
            if len(hits) > 1 and cls != "rider":
                return cls, f"{cls} signal wins over {sorted(hits)}"
            return cls, hits[cls]
    return None, None


NC_PHRASES = (
    "do not accept outside contributions",
    "not accept outside contributions",
    "does not accept outside contributions",
    "no outside contributions accepted",
    "contributions explicitly refused",
    "contributions not accepted",
    "outside contributions refused",
    "refuses outside contributions",
    "explicitly does not accept outside contributions",
)


def extract_no_contrib(text: str):
    low = text.lower()
    for ph in NC_PHRASES:
        if ph in low:
            return True, ph
    return False, None


BUS = re.compile(r"bus factor:?\s*\*?\*?\s*(1|one)\b", re.I)


def extract_bus(text: str):
    m = BUS.search(text)
    if m:
        return 1, m.group(0)
    return None, None


def packet_facts(root: Path):
    """stem -> derived facts from the packet's own text."""
    facts = {}
    for path in sorted((root / "packets").glob("*-assessment.md")):
        stem = path.name[: -len("-assessment.md")]
        text = path.read_text(encoding="utf-8")
        ring, ring_how = extract_ring(text)
        trl, trl_how = extract_trl(text)
        lic, lic_how = extract_license(text)
        bus, bus_how = extract_bus(text)
        nc, nc_how = extract_no_contrib(text)
        facts[stem] = {
            "trl": trl, "trl_how": trl_how, "ring": ring, "ring_how": ring_how,
            "license": lic, "license_how": lic_how, "bus": bus, "bus_how": bus_how,
            "no_contrib": nc, "no_contrib_how": nc_how,
            # The packet's own statement that the assessor executed its
            # test suite (franken_threed's marching-cubes trio); the
            # hurdles/negative-patterns analyst-reproduction claims rest
            # on exactly this marker.
            "analyst_repro": "Executed by the assessor" in text,
        }
    return facts


# -------------------------------------------------------------- synthesis

def agg_row(lines, label):
    for ln in lines:
        if ln.startswith(f"| {label} |"):
            return ln
    return None


def parse_overview(text: str):
    """Pull every checkable claim out of synthesis/00-overview.md."""
    lines = text.splitlines()
    out = {"matrix": {}, "claims": {}}
    # aggregate rows
    row = agg_row(lines, "NODUS ring")
    if row:
        out["claims"]["nodus_tally"] = {
            m.group(1): int(m.group(2))
            for m in re.finditer(r"(Explore|Monitor|Pilot|Invest)\s*\*\*(\d+)/44\*\*", row)
        }
    row = agg_row(lines, "TRL")
    if row:
        cell = row.split("|")[2]
        out["claims"]["trl_tally"] = {
            norm_trl(k): int(v)
            for k, v in re.findall(r"([0-9][0-9\u2013\-]*):\s*(\d+)", cell)
        }
    row = agg_row(lines, "License")
    if row:
        lic = {}
        m = re.search(r"rider\s*\*\*(\d+)/44\*\*", row)
        if m:
            lic["rider"] = int(m.group(1))
        m = re.search(r"plain MIT, no rider\s*\*\*(\d+)/44\*\*\s*\(([^)]*)\)", row)
        if m:
            lic["plain"] = int(m.group(1))
            out["claims"]["license_plain_named"] = BACKTICK.findall(m.group(2))
        m = re.search(r"no LICENSE / no operative grant\s*\*\*(\d+)/44\*\*\s*\(([^)]*)\)", row)
        if m:
            lic["none"] = int(m.group(1))
            out["claims"]["license_none_named"] = BACKTICK.findall(m.group(2))
        out["claims"]["license_tally"] = lic
    row = agg_row(lines, "Bus factor")
    if row:
        m = re.search(r"\*\*(\d+)/44\*\*", row)
        if m:
            out["claims"]["bus_tally"] = int(m.group(1))
    row = agg_row(lines, "Explicit refusal of outside contributions")
    if row:
        m = re.search(r"\*\*(\d+)/44\*\*", row)
        if m:
            out["claims"]["nocontrib_tally"] = int(m.group(1))
    row = agg_row(lines, "CI at the pin")
    if row:
        cmap = {"Green": "C1", "Red": "C2", "No pin verdict (CI exists)": "C3",
                "No test CI / deploy-only": "C4", "Disabled/deleted": "C5",
                "Private-only, unobservable": "C6"}
        ci = {}
        for label, code in cmap.items():
            m = re.search(re.escape(label) + r"\s*\*\*(\d+)/44\*\*", row)
            if m:
                ci[code] = int(m.group(1))
        out["claims"]["ci_tally"] = ci
    row = agg_row(lines, "Release posture")
    if row:
        rmap = {"No release or tag": "R1",
                "Release artifact exists but targets an earlier commit, or phantom": "R2",
                "Some release artifact exists": "R3"}
        rel = {}
        for label, code in rmap.items():
            m = re.search(re.escape(label) + r"\s*\*\*(\d+)/44\*\*", row)
            if m:
                rel[code] = int(m.group(1))
        out["claims"]["rel_tally"] = rel
    # detail paragraphs
    m = re.search(r"\*\*NODUS detail\.\*\*(.*?)\n\n", text, re.S)
    if m:
        para = m.group(1)
        pm = re.search(r"Pilot \(\d+\):(.*?)\. Monitor \(\d+\):(.*?)\. Everything else", para, re.S)
        if pm:
            out["claims"]["pilot_named"] = BACKTICK.findall(pm.group(1))
            out["claims"]["monitor_named"] = BACKTICK.findall(pm.group(2))
    m = re.search(r"\*\*TRL detail\.\*\*(.*?)\[Inference", text, re.S)
    if m:
        detail = {}
        for seg in re.split(r"\.\s+", m.group(1)):
            sm = re.match(r"\s*([0-9][0-9\u2013\-]*):\s*(.*)", seg, re.S)
            if sm:
                detail[norm_trl(sm.group(1))] = BACKTICK.findall(sm.group(2))
        out["claims"]["trl_detail"] = detail
    m = re.search(r"\*\*Explicit no-contributions policy \(\d+/44\)\.\*\*(.*?)\[Maintainer", text, re.S)
    if m:
        out["claims"]["nocontrib_named"] = BACKTICK.findall(m.group(1))
    m = re.search(r"Only 2 of 44 projects have public CI green at the assessed pin \(([^)]*)\)", text)
    if m:
        out["claims"]["ci_green_named"] = BACKTICK.findall(m.group(1))
    # master matrix
    in_matrix = False
    for ln in lines:
        if ln.startswith("## Master matrix"):
            in_matrix = True
            continue
        if in_matrix:
            if ln.startswith("Count checks:"):
                cc = ln
                out["claims"]["count_checks"] = {
                    "CI": {k: int(v) for k, v in re.findall(r"(C[1-6])\s+(\d+)", cc)},
                    "Rel": {k: int(v) for k, v in re.findall(r"(R[1-3])\s+(\d+)", cc)},
                }
                m = re.search(r"Rider\s+(\d+)", cc)
                if m:
                    out["claims"]["count_checks"]["rider"] = int(m.group(1))
                m = re.search(r"plain MIT\s+(\d+)", cc)
                if m:
                    out["claims"]["count_checks"]["plain"] = int(m.group(1))
                m = re.search(r"no operative grant\s+(\d+)", cc)
                if m:
                    out["claims"]["count_checks"]["none"] = int(m.group(1))
                m = re.search(r"Bus factor 1:\s*(\d+)", cc)
                if m:
                    out["claims"]["count_checks"]["bus"] = int(m.group(1))
                m = re.search(r"No-contrib refusal:\s*(\d+)", cc)
                if m:
                    out["claims"]["count_checks"]["nocontrib"] = int(m.group(1))
                break
            if not ln.startswith("|") or ln.startswith("| Project") or ln.startswith("|---"):
                continue
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(cells) < 9:
                continue
            ci = re.match(r"(C[1-6])\b", cells[6])
            rel = re.match(r"(R[1-3])\b", cells[7])
            out["matrix"][cells[0]] = {
                "trl": norm_trl(cells[1]), "ring": cells[2],
                "license": {"Rider": "rider", "plain MIT": "plain",
                            "none": "none"}.get(cells[3], cells[3]),
                "bus": cells[4], "no_contrib": cells[5] == "yes",
                "ci": ci.group(1) if ci else None,
                "rel": rel.group(1) if rel else None,
            }
    return out


def _section(text: str, start_pat: str, end_pat: str):
    m = re.search(start_pat + r"(.*?)" + end_pat, text, re.S)
    return m.group(1) if m else ""


def _item_names(segment: str):
    """Project names at list-item starts: '`name`' at the segment start
    or right after a ', ' separator. Backticked tokens inside an item's
    parenthetical (commit hashes like `c577c0ae`) are not item starts
    and are excluded."""
    return re.findall(r"(?:^|,\s+)`([a-z0-9_\-]+)`", segment)


def parse_negative_patterns(text: str):
    out = {}
    m = re.search(r"## P1 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p1_bus"] = int(m.group(1))
    m = re.search(r"## P2 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p2_rider"] = int(m.group(1))
    m = re.search(r"`([a-z0-9_\-]+)` is plain MIT with no rider \((\d+)/44\)", text)
    if m:
        out["p2_plain_named"] = [m.group(1)]
        out["p2_plain"] = int(m.group(2))
    m = re.search(r"five repos have no LICENSE / no operative grant \((\d+)/44\):\s*([^.]*)\.", text, re.S)
    if m:
        out["p2_none"] = int(m.group(1))
        out["p2_none_named"] = BACKTICK.findall(m.group(2))
    m = re.search(r"## P3 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p3_nocontrib"] = int(m.group(1))
    m = re.search(r"## P3 .*?\n\nNamed:\s*([^.]*)\.", text, re.S)
    if m:
        out["p3_named"] = BACKTICK.findall(m.group(1))
    m = re.search(r"## P4 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p4_count"] = int(m.group(1))
    sec = re.search(r"## P4 .*?\n(.*?)\n## ", text, re.S)
    if sec:
        out["p4_named"] = re.findall(r"^- ([a-z0-9_\-]+) \u2014", sec.group(1), re.M)

    # -- P5: CI that cannot certify the pin (restates the CI classes)
    m = re.search(r"## P5 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p5_total"] = int(m.group(1))
    sec5 = _section(text, r"## P5 ", r"\n## P6 ")
    m = re.search(r"Only (.*?) have public CI green at the assessed commit:"
                  r"\s*\*\*(\d+)/44\*\*", sec5, re.S)
    if m:
        out["p5_green_named"] = BACKTICK.findall(m.group(1))
        out["p5_green"] = int(m.group(2))
    for key, pat in (
        ("p5_c2", r"red at pin \*\*(\d+)/44\*\*(?:\s*\(([^)]*)\))?"),
        ("p5_c3", r"no pin verdict \*\*(\d+)/44\*\*(?:\s*\(([^)]*)\))?"),
        ("p5_c4", r"no test CI or deploy-only \*\*(\d+)/44\*\*"),
        ("p5_c5", r"CI disabled or deleted \*\*(\d+)/44\*\*(?:\s*\(([^)]*)\))?"),
        ("p5_c6", r"private DSR/RCH/self-hosted-only, unobservable "
                  r"\*\*(\d+)/44\*\*(?:\s*\(([^)]*)\))?"),
    ):
        m = re.search(pat, sec5)
        if m:
            out[key] = int(m.group(1))
            if m.re.groups >= 2 and m.group(2):
                out[key + "_named"] = BACKTICK.findall(m.group(2))

    # -- P6: release artifact missing or not covering the pin (R classes)
    m = re.search(r"## P6 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p6_total"] = int(m.group(1))
    sec6 = _section(text, r"## P6 ", r"\n## P7 ")
    m = re.search(r"No release or tag \*\*(\d+)/44\*\*:\s*(.*?)\.\s+Release targets",
                  sec6, re.S)
    if m:
        out["p6_r1"] = int(m.group(1))
        out["p6_r1_named"] = _item_names(m.group(2))
    m = re.search(r"Release targets an earlier commit \*\*(\d+)/44\*\*:\s*"
                  r"(.*?)\.\s+Phantom release", sec6, re.S)
    if m:
        out["p6_earlier"] = int(m.group(1))
        out["p6_earlier_named"] = _item_names(m.group(2))
    m = re.search(r"Phantom release \*\*(\d+)/44\*\*:\s*(.*?)\.\s*(?:\n|$)",
                  sec6, re.S)
    if m:
        out["p6_phantom"] = int(m.group(1))
        out["p6_phantom_named"] = _item_names(m.group(2))

    # -- P7: zero independent validation across the corpus
    m = re.search(r"## P7 [^\n]*:\s*(\d+)/44", text)
    if m:
        out["p7_total"] = int(m.group(1))
    return out


def parse_ci_requirements(text: str):
    """## C1..C6 sections: header count + membership table per class."""
    out = {"sections": {}}
    parts = re.split(r"^## (C[1-6])\b", text, flags=re.M)
    for i in range(1, len(parts) - 1, 2):
        code, body = parts[i], parts[i + 1]
        first = body.splitlines()[0] if body.splitlines() else ""
        m = re.search(r"(\d+)\s*/\s*44", first)
        members = []
        for ln in body.splitlines():
            if not ln.startswith("|") or ln.startswith("| Project") \
                    or ln.startswith("|-"):
                continue
            cell = ln.strip().strip("|").split("|")[0].strip().strip("`")
            if cell:
                members.append(cell)
        out["sections"][code] = {
            "count": int(m.group(1)) if m else None,
            "members": members,
        }
    m = re.search(r"(\S+) is additionally the only packet with "
                  r"analyst-executed behavioral reproduction", text)
    if m:
        out["analyst_only"] = m.group(1)
    return out


def parse_hurdles(text: str):
    out = {}
    m = re.search(r"(\d+)/44 repos carry a non-OSI MIT\+OpenAI/Anthropic rider", text)
    if m:
        out["rider"] = int(m.group(1))
    m = re.search(r"Bus factor 1 in (\d+)/44", text)
    if m:
        out["bus"] = int(m.group(1))
    m = re.search(r"Explicit refusal of outside contributions in (\d+)/44", text)
    if m:
        out["nocontrib"] = int(m.group(1))
    m = re.search(r"in (\d+)/44 cases it is not even executing in public CI", text)
    if m:
        out["ci_not_executing"] = int(m.group(1))
    m = re.search(r"Independent third-party validation is (\d+)/44", text)
    if m:
        out["validation_zero"] = int(m.group(1))
    m = re.search(r"analyst-executed behavioral reproduction is (\d+)/44 "
                  r"\(`([a-z0-9_\-]+)`", text)
    if m:
        out["analyst_repro"] = int(m.group(1))
        out["analyst_repro_named"] = [m.group(2)]
    m = re.search(r"unobservable in (\d+)/44 cases", text)
    if m:
        out["private_ci"] = int(m.group(1))
    m = re.search(r"(\d+)/44 projects cannot demonstrate public CI green at "
                  r"the assessed commit \((\d+) red, (\d+) no pin verdict, "
                  r"(\d+) no test CI, (\d+) disabled/deleted, "
                  r"(\d+) private-only\)", text)
    if m:
        out["ci_breakdown"] = {
            "total": int(m.group(1)), "C2": int(m.group(2)),
            "C3": int(m.group(3)), "C4": int(m.group(4)),
            "C5": int(m.group(5)), "C6": int(m.group(6)),
        }
    m = re.search(r"(\d+)/44 projects have no release at the pin: (\d+) with "
                  r"no release or tag at all, (\d+) whose release artifacts "
                  r"target an earlier commit \(([^)]*)\), and (\d+) phantom "
                  r"\(`([a-z0-9_\-]+)`", text)
    if m:
        out["release_breakdown"] = {
            "total": int(m.group(1)), "r1": int(m.group(2)),
            "earlier": int(m.group(3)),
            "earlier_named": BACKTICK.findall(m.group(4)),
            "phantom": int(m.group(5)), "phantom_named": [m.group(6)],
        }
    return out


def parse_external_validation(text: str):
    out = {}
    m = re.search(r"(\d+)/44 repos cannot show public CI green at the "
                  r"assessed commit", text)
    if m:
        out["ci_not_green"] = int(m.group(1))
    return out


# ----------------------------------------------------------------- checks

def tally(values):
    out = {}
    for v in values:
        out[v] = out.get(v, 0) + 1
    return out


def check(root: Path):
    """Returns (findings, inventory). A finding is a dict with keys:
    id, doc, claim, derived, status ('ok' | 'DRIFT' | 'UNPARSEABLE')."""
    findings = []

    def add(fid, doc, claim, derived, ok, note=""):
        findings.append({
            "id": fid, "doc": doc, "claim": claim, "derived": derived,
            "status": "ok" if ok else "DRIFT", "note": note,
        })

    facts = packet_facts(root)
    corpus = set(facts)
    ov = parse_overview((root / "synthesis" / "00-overview.md").read_text(encoding="utf-8"))
    claims, matrix = ov["claims"], ov["matrix"]
    neg = parse_negative_patterns(
        (root / "synthesis" / "negative-patterns.md").read_text(encoding="utf-8"))

    # -- corpus membership: matrix covers exactly the packets
    add("corpus-set", "synthesis/00-overview.md",
        f"master matrix rows = {len(matrix)} projects",
        f"{len(corpus)} packets; matrix-only={sorted(set(matrix) - corpus)}; "
        f"packets-only={sorted(corpus - set(matrix))}",
        set(matrix) == corpus and len(corpus) == 44)

    # -- extraction coverage: every packet must yield every field
    missing = {s: [k for k in ("trl", "ring", "license", "bus") if f[k] is None]
               for s, f in facts.items()}
    missing = {s: v for s, v in missing.items() if v}
    add("extract-coverage", "packets/",
        "every packet yields TRL, NODUS ring, license class, bus factor",
        f"unextracted: {missing}" if missing else "44/44 extracted",
        not missing)

    # -- per-project: matrix cells vs packet-derived values
    bad = []
    for stem, row in sorted(matrix.items()):
        f = facts.get(stem)
        if not f:
            continue
        for key, mkey in (("trl", "trl"), ("ring", "ring"), ("license", "license")):
            if f[key] is not None and row[mkey] != f[key]:
                bad.append(f"{stem}.{key}: matrix={row[mkey]} packet={f[key]}")
        if f["bus"] is not None and row["bus"] != str(f["bus"]):
            bad.append(f"{stem}.bus: matrix={row['bus']} packet={f['bus']}")
        if row["no_contrib"] != f["no_contrib"]:
            bad.append(f"{stem}.no_contrib: matrix={row['no_contrib']} packet={f['no_contrib']}")
    add("matrix-vs-packets", "synthesis/00-overview.md",
        "master matrix TRL/NODUS/license/bus/no-contrib cells match each packet",
        "; ".join(bad) if bad else "44/44 rows match", not bad)

    # -- tallies re-derived from packets vs aggregate claims
    derived_nodus = tally(f["ring"] for f in facts.values() if f["ring"])
    add("nodus-tally", "synthesis/00-overview.md",
        f"NODUS tally claimed {claims.get('nodus_tally')}",
        f"re-derived from packets {derived_nodus}",
        claims.get("nodus_tally") == derived_nodus)
    derived_trl = tally(f["trl"] for f in facts.values() if f["trl"])
    add("trl-tally", "synthesis/00-overview.md",
        f"TRL tally claimed {claims.get('trl_tally')}",
        f"re-derived from packets {derived_trl}",
        claims.get("trl_tally") == derived_trl)
    derived_lic = tally(f["license"] for f in facts.values() if f["license"])
    add("license-tally", "synthesis/00-overview.md",
        f"license tally claimed {claims.get('license_tally')}",
        f"re-derived from packets {derived_lic}",
        claims.get("license_tally") == derived_lic)
    derived_nc = sorted(s for s, f in facts.items() if f["no_contrib"])
    add("nocontrib-tally", "synthesis/00-overview.md",
        f"no-contrib count claimed {claims.get('nocontrib_tally')}",
        f"re-derived {len(derived_nc)} packets with refusal policy",
        claims.get("nocontrib_tally") == len(derived_nc))
    derived_bus = sum(1 for f in facts.values() if f["bus"] == 1)
    add("bus-tally", "synthesis/00-overview.md",
        f"bus factor 1 claimed in {claims.get('bus_tally')}/44",
        f"re-derived {derived_bus}/44", claims.get("bus_tally") == derived_bus)

    # -- named membership lists vs derived sets
    def setcheck(fid, doc, claim, claimed_names, derived_set):
        claimed_set = set(claimed_names or [])
        add(fid, doc, claim,
            f"claimed={sorted(claimed_set)} derived={sorted(derived_set)}; "
            f"claimed-only={sorted(claimed_set - derived_set)}; "
            f"derived-only={sorted(derived_set - claimed_set)}",
            claimed_set == derived_set)

    setcheck("pilot-named", "synthesis/00-overview.md",
             "NODUS detail Pilot list", claims.get("pilot_named"),
             {s for s, f in facts.items() if f["ring"] == "Pilot"})
    setcheck("monitor-named", "synthesis/00-overview.md",
             "NODUS detail Monitor list", claims.get("monitor_named"),
             {s for s, f in facts.items() if f["ring"] == "Monitor"})
    td = claims.get("trl_detail") or {}
    bad = []
    for trlval, names in sorted(td.items()):
        want = {s for s, f in facts.items() if f["trl"] == trlval}
        if set(names) != want:
            bad.append(f"TRL {trlval}: claimed={sorted(names)} derived={sorted(want)}")
    add("trl-detail", "synthesis/00-overview.md",
        "TRL detail per-TRL named lists",
        "; ".join(bad) if bad else "all TRL groups match", not bad)
    setcheck("license-plain-named", "synthesis/00-overview.md",
             "plain MIT named exception", claims.get("license_plain_named"),
             {s for s, f in facts.items() if f["license"] == "plain"})
    setcheck("license-none-named", "synthesis/00-overview.md",
             "no LICENSE named exceptions", claims.get("license_none_named"),
             {s for s, f in facts.items() if f["license"] == "none"})
    setcheck("nocontrib-named", "synthesis/00-overview.md",
             "explicit no-contributions policy named list (19)",
             claims.get("nocontrib_named"), set(derived_nc))

    # -- matrix-internal tallies vs aggregate + Count checks line
    m_ci = tally(r["ci"] for r in matrix.values() if r["ci"])
    add("ci-tally", "synthesis/00-overview.md",
        f"CI tally claimed {claims.get('ci_tally')}",
        f"counted from matrix {m_ci}", claims.get("ci_tally") == m_ci)
    m_rel = tally(r["rel"] for r in matrix.values() if r["rel"])
    add("rel-tally", "synthesis/00-overview.md",
        f"release tally claimed {claims.get('rel_tally')}",
        f"counted from matrix {m_rel}", claims.get("rel_tally") == m_rel)
    cc = claims.get("count_checks") or {}
    cc_bad = []
    if cc.get("CI") != m_ci:
        cc_bad.append(f"CI count-checks {cc.get('CI')} vs matrix {m_ci}")
    if cc.get("Rel") != m_rel:
        cc_bad.append(f"Rel count-checks {cc.get('Rel')} vs matrix {m_rel}")
    m_lic = tally(r["license"] for r in matrix.values())
    if cc.get("rider") != m_lic.get("rider"):
        cc_bad.append(f"rider {cc.get('rider')} vs matrix {m_lic.get('rider')}")
    if cc.get("plain") != m_lic.get("plain"):
        cc_bad.append(f"plain {cc.get('plain')} vs matrix {m_lic.get('plain')}")
    if cc.get("none") != m_lic.get("none"):
        cc_bad.append(f"none {cc.get('none')} vs matrix {m_lic.get('none')}")
    if cc.get("bus") != sum(1 for r in matrix.values() if r["bus"] == "1"):
        cc_bad.append("bus count-check vs matrix")
    if cc.get("nocontrib") != sum(1 for r in matrix.values() if r["no_contrib"]):
        cc_bad.append("no-contrib count-check vs matrix")
    add("count-checks-line", "synthesis/00-overview.md",
        "'Count checks:' line reproduces the matrix tallies",
        "; ".join(cc_bad) if cc_bad else "count checks reproduce", not cc_bad)
    setcheck("ci-green-named", "synthesis/00-overview.md",
             "finding 1: only 2 of 44 green at pin, named",
             claims.get("ci_green_named"),
             {s for s, r in matrix.items() if r["ci"] == "C1"})

    # -- negative-patterns restatements
    add("negpat-p1-bus", "synthesis/negative-patterns.md",
        f"P1 bus factor 1: {neg.get('p1_bus')}/44",
        f"re-derived {derived_bus}/44", neg.get("p1_bus") == derived_bus)
    add("negpat-p2-rider", "synthesis/negative-patterns.md",
        f"P2 rider {neg.get('p2_rider')}/44, plain {neg.get('p2_plain')} "
        f"({neg.get('p2_plain_named')}), none {neg.get('p2_none')} "
        f"({neg.get('p2_none_named')})",
        f"overview license tally {claims.get('license_tally')} with "
        f"plain={claims.get('license_plain_named')} none={claims.get('license_none_named')}",
        neg.get("p2_rider") == (claims.get("license_tally") or {}).get("rider")
        and neg.get("p2_plain_named") == claims.get("license_plain_named")
        and neg.get("p2_none_named") == claims.get("license_none_named"))
    add("negpat-p3-nocontrib", "synthesis/negative-patterns.md",
        f"P3 no-contrib {neg.get('p3_nocontrib')}/44, named list",
        f"overview named list ({len(claims.get('nocontrib_named') or [])})",
        neg.get("p3_nocontrib") == claims.get("nocontrib_tally")
        and (neg.get("p3_named") or []) == (claims.get("nocontrib_named") or []))
    setcheck("negpat-p4-corpus", "synthesis/negative-patterns.md",
             f"P4 drift instances named per project ({neg.get('p4_count')}/44)",
             neg.get("p4_named"), corpus)

    # -- ci-requirements classes vs the per-packet matrix codes
    cire = parse_ci_requirements(
        (root / "synthesis" / "ci-requirements.md").read_text(encoding="utf-8"))

    def ci_set(code):
        return {s for s, r in matrix.items() if r["ci"] == code}

    def rel_set(code):
        return {s for s, r in matrix.items() if r["rel"] == code}

    for code in ("C1", "C2", "C3", "C4", "C5", "C6"):
        sec = cire["sections"].get(code) or {}
        want = ci_set(code)
        got = sec.get("members") or []
        add(f"ci-req-{code.lower()}", "synthesis/ci-requirements.md",
            f"{code} header {sec.get('count')}/44; membership table "
            f"({len(got)} rows)",
            f"per-packet matrix {code} set ({len(want)}): {sorted(want)}; "
            f"table-only={sorted(set(got) - want)}; "
            f"matrix-only={sorted(want - set(got))}",
            sec.get("count") == len(want) and set(got) == want
            and len(got) == len(want))

    # -- negative-patterns P5/P6/P7 re-derived from the matrix codes
    add("negpat-p5-total", "synthesis/negative-patterns.md",
        f"P5 cannot-certify {neg.get('p5_total')}/44; green "
        f"{neg.get('p5_green')}/44 named {neg.get('p5_green_named')}",
        f"44 - C1 = {44 - len(ci_set('C1'))}; C1 set {sorted(ci_set('C1'))}",
        neg.get("p5_total") == 44 - len(ci_set("C1"))
        and neg.get("p5_green") == len(ci_set("C1"))
        and set(neg.get("p5_green_named") or []) == ci_set("C1"))
    for code, key in (("C2", "p5_c2"), ("C3", "p5_c3"), ("C4", "p5_c4"),
                      ("C5", "p5_c5"), ("C6", "p5_c6")):
        named = neg.get(key + "_named")
        if named is not None:
            setcheck(f"negpat-p5-{code.lower()}", "synthesis/negative-patterns.md",
                     f"P5 {code} {neg.get(key)}/44 named list", named, ci_set(code))
        else:
            add(f"negpat-p5-{code.lower()}", "synthesis/negative-patterns.md",
                f"P5 {code} {neg.get(key)}/44",
                f"matrix {code} count {len(ci_set(code))}",
                neg.get(key) == len(ci_set(code)))
    add("negpat-p6-total", "synthesis/negative-patterns.md",
        f"P6 missing/stale release {neg.get('p6_total')}/44",
        f"R1 + R2 from matrix = {len(rel_set('R1')) + len(rel_set('R2'))}",
        neg.get("p6_total") == len(rel_set("R1")) + len(rel_set("R2")))
    setcheck("negpat-p6-r1", "synthesis/negative-patterns.md",
             f"P6 no release or tag {neg.get('p6_r1')}/44 named list",
             neg.get("p6_r1_named"), rel_set("R1"))
    r2_claimed = set(neg.get("p6_earlier_named") or []) | set(neg.get("p6_phantom_named") or [])
    add("negpat-p6-r2", "synthesis/negative-patterns.md",
        f"P6 earlier-commit {neg.get('p6_earlier')}/44 "
        f"({neg.get('p6_earlier_named')}) + phantom {neg.get('p6_phantom')}/44 "
        f"({neg.get('p6_phantom_named')})",
        f"matrix R2 set {sorted(rel_set('R2'))}",
        r2_claimed == rel_set("R2")
        and neg.get("p6_earlier") == len(neg.get("p6_earlier_named") or [])
        and neg.get("p6_phantom") == len(neg.get("p6_phantom_named") or []))
    invest = {s for s, f in facts.items() if f["ring"] == "Invest"}
    add("negpat-p7-no-validation", "synthesis/negative-patterns.md",
        f"P7 zero independent validation: {neg.get('p7_total')}/44",
        f"{len(corpus) - len(invest)}/44 with no validation; packets coded "
        f"Invest (the ring that requires independent validation): "
        f"{sorted(invest)}",
        neg.get("p7_total") == len(corpus) - len(invest))

    # -- hurdles-issues restatements
    hur = parse_hurdles(
        (root / "synthesis" / "hurdles-issues.md").read_text(encoding="utf-8"))
    add("hurdles-h1-rider", "synthesis/hurdles-issues.md",
        f"H1 rider {hur.get('rider')}/44",
        f"re-derived from packets {derived_lic.get('rider')}/44",
        hur.get("rider") == derived_lic.get("rider"))
    add("hurdles-h2-bus-nocontrib", "synthesis/hurdles-issues.md",
        f"H2 bus factor 1 in {hur.get('bus')}/44; no-contrib refusal "
        f"{hur.get('nocontrib')}/44",
        f"re-derived bus {derived_bus}/44, no-contrib {len(derived_nc)}/44",
        hur.get("bus") == derived_bus
        and hur.get("nocontrib") == len(derived_nc))
    add("hurdles-h2-ci-not-executing", "synthesis/hurdles-issues.md",
        f"H2 not executing in public CI in {hur.get('ci_not_executing')}/44 cases",
        f"44 - C1 from matrix = {44 - len(ci_set('C1'))}",
        hur.get("ci_not_executing") == 44 - len(ci_set("C1")))
    add("hurdles-h3-validation-zero", "synthesis/hurdles-issues.md",
        f"H3 independent third-party validation is {hur.get('validation_zero')}/44",
        f"packets coded Invest (requires independent validation): {len(invest)}",
        hur.get("validation_zero") == len(invest))
    analyst = {s for s, f in facts.items() if f["analyst_repro"]}
    add("hurdles-h3-analyst-repro", "synthesis/hurdles-issues.md",
        f"H3 analyst-executed behavioral reproduction "
        f"{hur.get('analyst_repro')}/44 ({hur.get('analyst_repro_named')}); "
        f"ci-requirements names {cire.get('analyst_only')} as the only packet",
        f"packets asserting assessor-executed tests: {sorted(analyst)}",
        hur.get("analyst_repro") == len(analyst)
        and set(hur.get("analyst_repro_named") or []) == analyst
        and cire.get("analyst_only") in analyst)
    add("hurdles-h3-private-ci", "synthesis/hurdles-issues.md",
        f"H3 private CI unobservable in {hur.get('private_ci')}/44 cases",
        f"matrix C6 count {len(ci_set('C6'))}",
        hur.get("private_ci") == len(ci_set("C6")))
    h4 = hur.get("ci_breakdown") or {}
    h4_want = {"total": 44 - len(ci_set("C1"))}
    h4_want.update({c: len(ci_set(c)) for c in ("C2", "C3", "C4", "C5", "C6")})
    add("hurdles-h4-ci-breakdown", "synthesis/hurdles-issues.md",
        f"H4 cannot demonstrate green {h4}",
        f"matrix CI classes {h4_want}", h4 == h4_want)
    h5 = hur.get("release_breakdown") or {}
    add("hurdles-h5-release", "synthesis/hurdles-issues.md",
        f"H5 no release at pin {h5}",
        f"matrix R1 {len(rel_set('R1'))}, R2 {len(rel_set('R2'))}; "
        f"negative-patterns P6 earlier={neg.get('p6_earlier_named')} "
        f"phantom={neg.get('p6_phantom_named')}",
        h5.get("total") == len(rel_set("R1")) + len(rel_set("R2"))
        and h5.get("r1") == len(rel_set("R1"))
        and h5.get("earlier") == len(neg.get("p6_earlier_named") or [])
        and set(h5.get("earlier_named") or []) == set(neg.get("p6_earlier_named") or [])
        and h5.get("phantom") == len(neg.get("p6_phantom_named") or [])
        and (h5.get("phantom_named") or []) == (neg.get("p6_phantom_named") or []))

    # -- external-validation restatement
    ext = parse_external_validation(
        (root / "synthesis" / "external-validation-2026-09.md").read_text(encoding="utf-8"))
    add("extval-ci-not-green", "synthesis/external-validation-2026-09.md",
        f"{ext.get('ci_not_green')}/44 repos cannot show public CI green",
        f"44 - C1 from matrix = {44 - len(ci_set('C1'))}",
        ext.get("ci_not_green") == 44 - len(ci_set("C1")))

    # -- inventory of every n/44 claim across the synthesis docs
    inventory = []
    for path in sorted((root / "synthesis").glob("*.md")):
        for i, ln in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for m in N44.finditer(ln):
                inventory.append({
                    "doc": f"synthesis/{path.name}", "line": i,
                    "claim": f"{m.group(1)}/44",
                    "text": ln.strip()[:160],
                })
    return findings, inventory


# ------------------------------------------------------------------ beads

def run_cmd(argv, cwd, timeout=60):
    """Subprocess with timeout and whole-process-group kill (repo doctrine)."""
    try:
        proc = subprocess.Popen(argv, cwd=cwd, text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                start_new_session=True)
        out, err = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        proc.wait()
        return None, "timeout"
    except OSError as e:
        return None, str(e)
    return (out if proc.returncode == 0 else None), err


def file_beads(root: Path, findings):
    """One bead per DRIFT finding; dedupe by claim id in the title."""
    if not (root / ".beads").exists():
        return ["--file-beads refused: no .beads/ here; run from the main checkout"]
    out, err = run_cmd(["br", "search", "synthesis drift", "--json"], root)
    existing = set()
    if out:
        try:
            for bead in json.loads(out):
                existing.add(bead.get("title", ""))
        except json.JSONDecodeError:
            pass
    filed = []
    for f in findings:
        if f["status"] != "DRIFT":
            continue
        title = f"synthesis drift: {f['id']}"
        if any(title in t for t in existing):
            filed.append(f"SKIP (already filed): {title}")
            continue
        desc = (
            f"Background: the synthesis drift monitor (scripts/synthesis-drift.py, "
            f"docs/synthesis-drift.md) re-derived the cross-packet claims in "
            f"{f['doc']} from the current packets and this claim no longer reproduces.\n"
            f"Claim as written: {f['claim']}\n"
            f"Re-derived from packets: {f['derived']}\n"
            f"Technical Approach: decide which side is wrong -- the synthesis text "
            f"or the packet(s) -- and correct that side; never edit the monitor to "
            f"match. Re-run `python3 scripts/synthesis-drift.py check` to confirm.\n"
            f"Success Criteria: monitor check '{f['id']}' passes; the corrected "
            f"claim cites its packet sources.\n"
            f"Test Plan: python3 scripts/synthesis-drift.py check (exit 0) and "
            f"python3 scripts/test_synthesis_drift.py.\n"
            f"Considerations: filed automatically by the drift monitor; dedupe key "
            f"is the claim id in the title."
        )
        out, err = run_cmd(["br", "create", title, "--description", desc,
                            "--type", "task", "--priority", "2", "--json"], root)
        filed.append(f"FILED: {title}" if out else f"FAILED: {title} ({err})")
    return filed


# ------------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    ck = sub.add_parser("check")
    ck.add_argument("--report", default=None, help="write JSON report here")
    ck.add_argument("--json", action="store_true", help="print JSON to stdout")
    ck.add_argument("--file-beads", action="store_true",
                    help="file one bead per drifted claim (main checkout only)")
    args = ap.parse_args(argv)

    findings, inventory = check(ROOT)
    drift = [f for f in findings if f["status"] != "ok"]
    report = {"tool": "scripts/synthesis-drift.py@1",
              "checked": len(findings), "drift": len(drift),
              "findings": findings, "claim_inventory": inventory}
    filed = file_beads(ROOT, findings) if args.file_beads else []
    if filed:
        report["beads"] = filed
    if args.report:
        Path(args.report).write_text(
            json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        for f in findings:
            mark = "ok   " if f["status"] == "ok" else "DRIFT"
            print(f"[{mark}] {f['id']} ({f['doc']}): {f['claim']} -> {f['derived']}")
        print(f"\n{len(findings) - len(drift)}/{len(findings)} checked claims reproduce; "
              f"{len(drift)} drifted; {len(inventory)} n/44 claims inventoried "
              f"across the synthesis docs (see report).")
        for line in filed:
            print(line)
        print("SYNTHESIS_OK" if not drift else "SYNTHESIS_DRIFT")
    return 0 if not drift else 1


if __name__ == "__main__":
    sys.exit(main())
