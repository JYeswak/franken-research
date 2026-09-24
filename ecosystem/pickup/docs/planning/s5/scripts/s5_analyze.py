#!/usr/bin/env python3
"""S5 analysis: duplicates, dangling refs, orphans, manifest, open P0/P1, BLOCKS_PLAN ledger."""
import os, re, json, csv
from collections import defaultdict

ROOT = os.path.expanduser("~/workspace/franken-research/ecosystem/pickup")
S5   = os.path.join(ROOT, "docs/planning/s5")
d = json.load(open(S5 + "/_occ.json"))
occ, ledger, defsev = d["occurrences"], d["ledger"], d["defsev"]
lines_by_file = {}
for o in occ:
    p = os.path.join(ROOT, o["file"])
    if p not in lines_by_file:
        lines_by_file[p] = open(p, encoding="utf-8", errors="replace").read().splitlines()

def defline(o):
    return lines_by_file[os.path.join(ROOT, o["file"])][o["line"] - 1]

# ---------- definitions ----------
defs = defaultdict(list)   # (kind-normalized) id -> [occ,...]
refs = defaultdict(list)
for o in occ:
    if o["ctx"] == "def":
        defs[o["id"]].append(o)
    else:
        refs[o["id"]].append(o)

# Range tokens: re-scan raw text for X..Y expansions so members resolve
RANGE_RE = re.compile(r"(GATE-[A-Z][A-Z0-9]*-|UNK-[A-Z]*-?|REQ-[A-Z]*-?)(\d+)\.\.(\d+)")
range_members = defaultdict(list)  # file -> [(expanded ids, line)]
for o in occ:
    p = os.path.join(ROOT, o["file"])
    line = lines_by_file[p][o["line"] - 1]
    for m in RANGE_RE.finditer(line):
        pre, a, b = m.group(1), int(m.group(2)), int(m.group(3))
        w = len(m.group(2))
        members = [f"{pre}{str(i).zfill(w)}" for i in range(a, b + 1)]
        range_members[o["file"]].append((o["line"], members))

def normtxt(s):
    return re.sub(r"\s+", " ", s).strip().lower()

# ---------- duplicates ----------
dup_report = []
# same (file, id): >=2 defs with different definition text
by_file_id = defaultdict(list)
for oid, lst in defs.items():
    for o in lst:
        by_file_id[(o["file"], oid)].append(o)
for (f, oid), lst in sorted(by_file_id.items()):
    if len(lst) < 2:
        continue
    texts = {normtxt(defline(o)) for o in lst}
    if len(texts) > 1:
        dup_report.append(("SAME-FILE", f, oid,
            [(o["line"], defline(o).strip()[:160]) for o in lst]))
# GATE namespace is global: same GATE id defined in >1 file with different text
gate_defs = defaultdict(list)
for oid, lst in defs.items():
    if oid.startswith("GATE-"):
        for o in lst:
            gate_defs[oid].append(o)
for oid, lst in sorted(gate_defs.items()):
    files = {o["file"] for o in lst}
    if len(files) > 1:
        texts = {normtxt(defline(o)) for o in lst}
        if len(texts) > 1:
            dup_report.append(("GLOBAL-GATE", ",".join(sorted(files)), oid,
                [(f"{o['file']}:{o['line']}", defline(o).strip()[:160]) for o in lst]))

# ---------- dangling ----------
GLOBAL = {"GATE", "DEF"}  # resolution scope corpus-wide
dangling = []      # genuine: cited, never defined in scope
dangling_notes = []  # classified non-findings (wildcard/placeholder/example/adjective)

def base_of_adjective(oid):
    for suf in ("-style", "-class"):
        if oid.endswith(suf):
            return oid[:-len(suf)]
    return None

def defined_in_scope(oid, kind, fil):
    if kind in GLOBAL:
        return oid in defs
    if any(x["file"] == fil for x in defs.get(oid, [])):
        return True
    return oid in defs  # cross-file citations (DEF files etc.) resolve corpus-wide

def line_of(o):
    return lines_by_file[os.path.join(ROOT, o["file"])][o["line"] - 1]

for oid, lst in sorted(refs.items()):
    o0 = lst[0]
    kind = o0["kind"]
    if defined_in_scope(oid, kind, o0["file"]):
        continue
    line = line_of(o0)
    # namespace wildcard prefix, e.g. "13 CLAIM-DW-* rows"
    if re.search(re.escape(oid) + r"-\*", line):
        dangling_notes.append((o0["file"], o0["line"], oid, "namespace wildcard (not an ID)"))
        continue
    # namespace-prefix collective, e.g. "every CLAIM-EMB row" where
    # CLAIM-EMB-001 etc. are defined in the same file. NOT applied when the
    # token is followed by a specific descriptor ("UNK-GR corpus-export"):
    # that is a malformed citation of one unknown, not a collective.
    prefixed = [x for x in defs if x.startswith(oid + "-")
                and any(y["file"] == o0["file"] for y in defs[x])]
    if prefixed and re.search(r"\b" + re.escape(oid) + r"\b(?!-)", line):
        after = line.split(oid, 1)[1][:40]
        if re.match(r"\s+(rows?|unknowns?)\b", after, re.I) or "-*" in line:
            dangling_notes.append((o0["file"], o0["line"], oid,
                                   f"namespace-prefix collective for {len(prefixed)} defined IDs"))
            continue
    # placeholder token, e.g. GATE-DW-N / GATE-EH-NN (round-3 reviewers used -NN)
    if re.match(r"(GATE|REQ|CLAIM|UNK)-[A-Z]+-NN?$", oid):
        dangling_notes.append((o0["file"], o0["line"], oid, "pattern placeholder (not an ID)"))
        continue
    # hyphen-adjective built on a real ID, e.g. CLAIM-04-style
    base = base_of_adjective(oid)
    if base and defined_in_scope(base, kind, o0["file"]):
        dangling_notes.append((o0["file"], o0["line"], oid,
                               f"adjectival form of defined {base}"))
        continue
    # format-example token in backticks, e.g. playbook "`GATE-MEM-02`"
    if "e.g." in line and f"`{oid}`" in line:
        dangling_notes.append((o0["file"], o0["line"], oid,
                               "namespace format example, not a citation"))
        continue
    # dichotomy label, e.g. "UNK-OPEN vs TARGETED" in a wording decision
    if re.search(re.escape(oid) + r"\s+vs\.?\s", line, re.I):
        dangling_notes.append((o0["file"], o0["line"], oid,
                               "wording-decision label, not an ID citation"))
        continue
    # suggested-but-never-minted ID inside a fix proposal, e.g. "mint it as REQ-EH-07"
    if re.search(r"\bmint\b|\brenumber as\b|\bfold into\b", line, re.I):
        dangling_notes.append((o0["file"], o0["line"], oid,
                               "fix-proposal suggestion, never minted (not a citation)"))
        continue
    # review-record citation: ID occurs only in round DEF files (review
    # archaeology of IDs renamed/merged by earlier-round fixes), never in the
    # live corpus (playbook / shared-gates / pickup-*.md)
    corpus_hits = [x for x in lst if not x["file"].startswith("docs/planning/round")]
    if not corpus_hits and re.search(r"docs/planning/round\d+/DEF", o0["file"]):
        dangling_notes.append((o0["file"], o0["line"], oid,
                               "review-record citation of a since-renamed/merged ID "
                               "(round DEF archaeology), absent from live corpus"))
        continue
    dangling.append((o0["file"], o0["line"], oid, kind,
                     f"{len(lst)} occurrence(s)"))

# ---------- orphans ----------
orphans = []
for oid, lst in sorted(defs.items()):
    if oid not in refs:
        o0 = lst[0]
        orphans.append((o0["file"], o0["line"], oid, o0["kind"]))

# ---------- manifest ----------
slugs = ["agent-frameworks","agent-memory","browser-use","computer-use","embedding-serving",
         "eval-harnesses","fine-tuning","guardrails","inference-engines","mcp","multi-agent-protocols",
         "observability","quantization","rag-frameworks","rl-envs","sandbox-exec","structured-output",
         "vector-dbs","voice-agents","web-search-apis","workflow-orchestrators"]
manifest = []
for slug in slugs:
    fn = f"pickup-{slug}.md"
    p = os.path.join(ROOT, fn)
    lines = open(p, encoding="utf-8", errors="replace").read().splitlines()
    title = next((l[2:].strip() for l in lines if l.startswith("# ")), "")
    ev = "y" if os.path.exists(os.path.join(ROOT, "_evidence", f"{slug}.md")) else "n"
    decl = "y" if any("### Shared-gate declarations" in l for l in lines) else "n"
    focc = [o for o in occ if o["file"] == fn]
    defs_f = [o for o in focc if o["ctx"] == "def"]
    cnt = lambda k: len({o["id"] for o in defs_f if o["kind"] == k})
    bp = len({o["id"] for o in focc
              if o["kind"] == "UNK" and o["ctx"] == "def" and "Disposition:BLOCKS_PLAN" in o["stated"]})
    manifest.append((slug, fn, title, ev, decl, cnt("REQ"), cnt("GATE"), cnt("CLAIM"), cnt("UNK"), bp,
                     len(focc)))

with open(S5 + "/companion-manifest.tsv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["slug","filename","companion_title","evidence_file","shared_gate_declaration_table",
                "REQ_defs","GATE_defs","CLAIM_defs","UNK_defs","BLOCKS_PLAN_UNKs","total_id_occurrences"])
    w.writerows(manifest)

# ---------- open P0/P1 ----------
open_items = []
for oid, info in sorted(ledger.items()):
    sev = info["sev"] or defsev.get(oid, "")
    if sev in ("P0","P1") and info["status"] in ("OPEN","DEFERRED"):
        open_items.append((oid, sev, info["status"], info["src"]))

# ---------- BLOCKS_PLAN ledger detail ----------
bp_rows = []
seen = set()
for o in occ:
    if o["kind"] == "UNK" and o["ctx"] == "def" and "Disposition:BLOCKS_PLAN" in o["stated"] \
       and (o["id"], o["file"]) not in seen:
        seen.add((o["id"], o["file"]))
        p = os.path.join(ROOT, o["file"])
        lines = lines_by_file[p]
        block = [lines[o["line"]-1]]
        for j in range(o["line"], len(lines)):
            nxt = lines[j]
            if (re.match(r"^\s*[-*]\s*(\*\*)?(REQ|UNK)-", nxt) or nxt.startswith("## ")):
                break
            block.append(nxt)
            if len(block) > 14:
                break
        text = " ".join(x.strip() for x in block if x.strip())
        text = re.sub(r"\s+", " ", text)
        m_pred = re.search(r"([^.]*?(?:resolution criterion|promotion predicate|resolved when|must be resolved[^.]*|criterion:)[^.]*\.)", text, re.I)
        m_own = re.search(r"([^.]*owner[^.]*\.)", text, re.I)
        first = text.split(". ")[0] + ("." if "." in text else "")
        bp_rows.append({
            "id": o["id"], "file": o["file"], "line": o["line"],
            "what_blocks": first[:300],
            "resolution_predicate": (m_pred.group(1).strip()[:300] if m_pred else "not stated as a sentence in the row"),
            "owner": (m_own.group(1).strip()[:160] if m_own else "not stated"),
            "full": text,
        })

json.dump({"duplicates": dup_report, "dangling": dangling,
           "dangling_notes": dangling_notes, "orphans": orphans,
           "open_p0p1": open_items, "blocks_plan": bp_rows, "manifest": manifest},
          open(S5 + "/_analysis.json", "w", encoding="utf-8"), indent=1)

print("duplicates:", len(dup_report))
for d_ in dup_report: print("  ", d_[0], d_[1], d_[2])
print("dangling:", len(dangling))
for x in dangling[:40]: print("  ", x)
print("orphans:", len(orphans))
print("open P0/P1:", len(open_items), open_items)
print("BLOCKS_PLAN defs:", len(bp_rows))
