#!/usr/bin/env python3
"""S5 machine-checkable registry extraction for FrankenSuite project-pickup.

Scope (corpus): pickup/ root *.md except _evidence/ and _s0/ (read-only
reference), plus docs/planning/ROUND_LOG.md, docs/planning/round1/*,
docs/planning/round2/*. Never edits corpus files; outputs to docs/planning/s5/.
"""
import os, re, csv, json
from collections import defaultdict

ROOT = os.path.expanduser("~/workspace/franken-research/ecosystem/pickup")
OUT  = os.path.join(ROOT, "docs/planning/s5")

def corpus_files():
    files = []
    for name in sorted(os.listdir(ROOT)):
        p = os.path.join(ROOT, name)
        if os.path.isfile(p) and name.endswith(".md"):
            files.append(p)
    for sub in ("docs/planning", "docs/planning/round1", "docs/planning/round2", "docs/planning/round3"):
        d = os.path.join(ROOT, sub)
        if os.path.isdir(d):
            for name in sorted(os.listdir(d)):
                if name.endswith(".md"):
                    files.append(os.path.join(d, name))
    return files

# ID token patterns (ordered longest-first to avoid partial alternation hits)
ID_RE = re.compile(r"""
    (?P<DEF>DEF3-(?:[A-F]-|INT-)\d+|DEF2?-[A-F]-\d+)
  | (?P<GATE>GATE-\d{3}|GATE-[A-Z][A-Z0-9]*-[A-Z0-9][0-9A-Za-z-]*)
  | (?P<REQ>REQ-[A-Z0-9][0-9A-Za-z-]*)
  | (?P<CLAIM>CLAIM-[A-Z0-9][0-9A-Za-z-]*)
  | (?P<UNK>UNK-[A-Z0-9][0-9A-Za-z-]*)
""", re.X)

DISP_RE   = re.compile(r"Disposition:\s*(BLOCKS_PLAN|TARGETED|ADVISORY|WATCH|RESOLVED)")
SEV_RE    = re.compile(r"\[(P0|P1|P2)\]")
STAT_RE   = re.compile(r"\b(ADMISSIBLE|CONTESTED)\b")
FIX_RE    = re.compile(r"\b(FIXED|OPEN|WONTFIX|DEFERRED)\b")
RET_RE    = re.compile(r"\bRETIRED\b")
TIER_RE   = re.compile(r"\bT[0-3]\b")
CONF_RE   = re.compile(r"\b(High|Medium|Low)\b")
DECL_RE   = re.compile(r"\b(load-bearing|advisory|universal)\b", re.I)
RANGE_RE  = re.compile(r"(GATE-[A-Z][A-Z0-9]*-)(\d+)\.\.(\d+)")

def norm(tok):
    return tok.rstrip("-.")

def expand_range(tok):
    m = RANGE_RE.fullmatch(tok)
    if not m:
        return [tok]
    pre, a, b = m.group(1), int(m.group(2)), int(m.group(3))
    w = len(m.group(2))
    return [f"{pre}{str(i).zfill(w)}" for i in range(a, b + 1)]

def is_def_line(kind, tok, line):
    s = line.lstrip()
    if kind == "DEF":
        t = re.escape(tok)
        # Only the DEF-file finding header is a definition. INTEGRATION.md /
        # INTEGRATION2.md ledger lines ("- DEF-A-1 [P0] — FIXED —", table rows)
        # are dispositions of that finding: citations, not definitions.
        if re.match(r"^" + t + r"\s*\[(P[012])\]", s):
            return True
        # ROUND_LOG.md machine-readable DEF ledger: "def=<ID> | severity=..."
        if re.match(r"^def=" + t + r"\s*\|", s):
            return True
        return False
    if kind in ("REQ", "UNK"):
        # bullet definitions in several surface forms:
        #   - **REQ-01.** ...   - REQ-BU-1: ...   - REQ-CI-COST — ...
        #   - **REQ-DW-1** — ...   - **REQ-EMB-001 (truth pack...).**
        # The ID must be the bullet's first token and be followed by a
        # definition separator (not prose).
        if re.match(r"^[-*]\s*(\*\*)?" + re.escape(tok) +
                    r"\s*(?=\.\*\*|\*\*|[:.\-—–(])", s):
            return True
        return False
    if kind == "CLAIM":
        return s.startswith("|") and tok in s.split("|")[1] if "|" in s else False
    if kind == "GATE":
        if re.match(r"^#{2,4}\s*GATE-", s):
            return True
        # type-local gates only (GATE-<SLUG>-*): companion new-gate bullets where
        # the ID is the first token, e.g. "- GATE-CUA-01 VM-CONTAINMENT: ...",
        # "- **GATE-DW-1 REPLAY-DETERMINISM — RETIRED ...**", '- GATE-VA-1 "..." :'
        # Shared GATE-NNN are defined only by shared-gates.md headers.
        if re.match(r"GATE-[A-Z]", tok) and re.match(r"^[-*]\s*(\*\*)?" + re.escape(tok) + r"(?![0-9A-Za-z-])", s):
            return True
        return False
    return False

def stated_on(line):
    hits = []
    m = DISP_RE.search(line)
    if m: hits.append("Disposition:" + m.group(1))
    for m in SEV_RE.finditer(line): hits.append(m.group(1))
    for m in STAT_RE.finditer(line): hits.append(m.group(1))
    for m in FIX_RE.finditer(line): hits.append(m.group(1))
    if RET_RE.search(line): hits.append("RETIRED")
    for m in TIER_RE.finditer(line): hits.append("Tier:" + m.group(0))
    for m in CONF_RE.finditer(line): hits.append("Conf:" + m.group(1))
    for m in DECL_RE.finditer(line): hits.append("Decl:" + m.group(1).lower())
    seen, out = set(), []
    for h in hits:
        if h not in seen:
            seen.add(h); out.append(h)
    return ";".join(out)

occurrences = []   # dicts: id, file, line, kind, ctx, stated
files = corpus_files()
lines_by_file = {}
for path in files:
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().splitlines()
    lines_by_file[path] = lines
    rel = os.path.relpath(path, ROOT)
    for i, line in enumerate(lines, start=1):
        for m in ID_RE.finditer(line):
            tok = norm(m.group(0))
            kind = next(k for k in ("DEF","GATE","REQ","CLAIM","UNK") if m.group(k))
            # re-normalize kind in case DEF matched inside longer token (already handled)
            occurrences.append({
                "id": tok, "file": rel, "line": i, "kind": kind,
                "ctx": "def" if is_def_line(kind, tok, line) else "ref",
                "stated": stated_on(line),
            })

# UNK dispositions often sit 1-3 lines below the def bullet: propagate
for o in occurrences:
    if o["kind"] == "UNK" and o["ctx"] == "def" and "Disposition:" not in o["stated"]:
        lines = lines_by_file[os.path.join(ROOT, o["file"])]
        for j in range(o["line"], min(o["line"] + 4, len(lines))):
            m = DISP_RE.search(lines[j])
            if m:
                o["stated"] = (o["stated"] + ";" if o["stated"] else "") + "Disposition:" + m.group(1)
                break

# Post-pass 1: drop brace-template pseudo-IDs (e.g. templates/gates/GATE-VDB-0{1..4}.md)
occurrences = [o for o in occurrences
               if not (lines_by_file[os.path.join(ROOT, o["file"])][o["line"] - 1]
                       .split(o["id"], 1)[-1].startswith("{"))]

# Post-pass 2: slash-pair combined def bullets (e.g.
# "- **GATE-MCP-01 / GATE-MCP-02 — RETIRED into shared GATE-006**"):
# when a bullet line is a def for its leading GATE ID, any other GATE ID
# joined to it by "/" on the same line is also a definition. Other GATE
# tokens on the line (e.g. "retired into shared GATE-006") stay refs.
PAIR_RE = re.compile(r"(GATE-[A-Z][A-Z0-9]*-[A-Z0-9][0-9A-Za-z-]*)\s*/\s*"
                     r"(GATE-[A-Z][A-Z0-9]*-[A-Z0-9][0-9A-Za-z-]*)")
for o in occurrences:
    if o["kind"] == "GATE" and o["ctx"] == "def":
        line = lines_by_file[os.path.join(ROOT, o["file"])][o["line"] - 1]
        if not re.match(r"^[-*]\s*(\*\*)?GATE-", line.lstrip()):
            continue
        for m in PAIR_RE.finditer(line):
            pair = {m.group(1).rstrip("-"), m.group(2).rstrip("-")}
            if o["id"] in pair:
                for o2 in occurrences:
                    if (o2["file"] == o["file"] and o2["line"] == o["line"]
                            and o2["kind"] == "GATE" and o2["id"] in pair):
                        o2["ctx"] = "def"

# DEF ledger dispositions from INTEGRATION.md / INTEGRATION2.md
ledger = {}
for path in files:
    rel = os.path.relpath(path, ROOT)
    if not rel.endswith(("round1/INTEGRATION.md", "round2/INTEGRATION2.md", "round3/INTEGRATION3.md", "planning/ROUND_LOG.md")):
        continue
    for line in lines_by_file[path]:
        s = line.strip()
        m = re.match(r"^[-*]\s*(DEF3-(?:[A-F]-|INT-)\d+|DEF2?-[A-F]-\d+)\s*(\[P[012]\])?\s*[—–-]\s*(FIXED|OPEN|WONTFIX|DEFERRED)", s)
        if m:
            ledger[m.group(1)] = {"status": m.group(3), "sev": (m.group(2) or "").strip("[]"), "src": rel}
            continue
        m = re.match(r"^\|\s*([^|]*(?:DEF3-(?:[A-F]-|INT-)\d+|DEF2?-[A-F]-\d+)[^|]*)\|\s*(FIXED|OPEN|WONTFIX|DEFERRED)\s*\|", s)
        if m:
            for mid in re.findall(r"DEF3-(?:[A-F]-|INT-)\d+|DEF2?-[A-F]-\d+", m.group(1)):
                ledger[mid] = {"status": m.group(2), "sev": "", "src": rel}
            continue
        # ROUND_LOG.md DEF ledger lines: def=<ID> | severity=<P0|P1|P2> | status=...
        m = re.match(r"^def=(DEF3-(?:[A-F]-|INT-)\d+|DEF2?-[A-F]-\d+)\s*\|\s*severity=(P[012])\s*\|\s*status=(FIXED|OPEN|WONTFIX|DEFERRED)", s)
        if m:
            ledger[m.group(1)] = {"status": m.group(3), "sev": m.group(2), "src": rel}
            continue

# DEF severity from definition lines (first def occurrence)
# NOTE: `stated` stores the bare token without brackets (e.g. "P0"), so match
# the bare token here rather than the bracketed SEV_RE form.
defsev = {}
for o in occurrences:
    if o["kind"] == "DEF" and o["ctx"] == "def":
        m = re.search(r"\b(P0|P1|P2)\b", o["stated"])
        if m and o["id"] not in defsev:
            defsev[o["id"]] = m.group(1)

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "id-index.tsv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["id", "file", "line", "kind", "context", "stated_status",
                "severity", "ledger_disposition", "ledger_source"])
    for o in occurrences:
        lg = ledger.get(o["id"], {})
        sev = defsev.get(o["id"], "") or lg.get("sev", "")
        # severity for DEF rows stated on ledger lines themselves
        if o["kind"] == "DEF" and not sev:
            m = SEV_RE.search(o["stated"]); sev = m.group(1) if m else ""
        w.writerow([o["id"], o["file"], o["line"], o["kind"], o["ctx"], o["stated"],
                    sev if o["kind"] == "DEF" else "",
                    lg.get("status", ""), lg.get("src", "")])

# Save intermediate JSON for the analysis scripts
with open(os.path.join(OUT, "_occ.json"), "w", encoding="utf-8") as f:
    json.dump({"occurrences": occurrences, "ledger": ledger, "defsev": defsev}, f)

print(f"files={len(files)} occurrences={len(occurrences)} ledger_ids={len(ledger)}")
from collections import Counter
print(Counter(o["kind"] for o in occurrences))
