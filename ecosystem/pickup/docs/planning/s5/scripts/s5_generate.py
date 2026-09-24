#!/usr/bin/env python3
"""Generate the four S5 markdown deliverables from _occ.json / _analysis.json."""
import json, os, re

ROOT = os.path.expanduser("~/workspace/franken-research/ecosystem/pickup")
S5 = os.path.join(ROOT, "docs/planning/s5")
d = json.load(open(S5 + "/_occ.json"))
a = json.load(open(S5 + "/_analysis.json"))
occ, ledger, defsev = d["occurrences"], d["ledger"], d["defsev"]

def src_line(f, n):
    return open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read().splitlines()[n - 1]

# ================= id-checks.md =================
L = []
L.append("# S5 ID checks — duplicate / dangling / orphan report")
L.append("")
L.append("*Generated 2026-09-23 by mechanical grep over the corpus. Corpus scope: "
         "`PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`, `INTENT.md`, the 21 "
         "`pickup-*.md` companions, `docs/planning/ROUND_LOG.md`, "
         "`docs/planning/round1/*`, `docs/planning/round2/*`. `_evidence/` and `_s0/` "
         "excluded (read-only reference). Full occurrence list: `id-index.tsv`.*")
L.append("")
L.append("## Method (mechanical rules)")
L.append("")
L.append("- **Definition** = the line that introduces the ID: `### GATE-NNN` headers; "
         "companion new-gate bullets whose first token is the ID "
         "(`- GATE-CUA-01 VM-CONTAINMENT:`, `- **GATE-DW-1 REPLAY-DETERMINISM — RETIRED…**`, "
         "slash-paired `- **GATE-MCP-01 / GATE-MCP-02 — RETIRED…**`); "
         "REQ/UNK bullets whose first token is the ID followed by a separator "
         "(`- **REQ-01.**`, `- REQ-BU-1:`, `- REQ-CI-COST —`, `- **UNK-1.**`); "
         "CLAIM table rows (`| CLAIM-01 | …`); DEF finding headers (`DEF-A-1 [P0]`, "
         "`DEF2-B-3 [P1]`). INTEGRATION.md / INTEGRATION2.md ledger lines are "
         "dispositions, counted as citations, not definitions.")
L.append("- **Duplicate** = same ID defined ≥2× in one file with different definition text "
         "(for GATE-*, which is a global namespace, also across files).")
L.append("- **Dangling** = cited but never defined in resolution scope "
         "(GATE/DEF: corpus-wide; REQ/CLAIM/UNK: same file, else corpus-wide for "
         "cross-file citations from DEF/INTEGRATION files). Namespace wildcards "
         "(`CLAIM-DW-*`), prefix collectives (`every CLAIM-EMB row`), placeholders "
         "(`GATE-DW-N`), adjectival forms (`CLAIM-04-style` → `CLAIM-04`), format "
         "examples in backticks, and wording labels (`UNK-OPEN vs TARGETED`) are "
         "classified as non-findings.")
L.append("- **Orphan** = defined but never cited outside definition lines. Informational only: "
         "claim-registry rows and retired-gate notes are self-contained by design.")
L.append("")
L.append("## 1. Duplicate-ID report — 10 findings (all UNK-*, all same defect class)")
L.append("")
L.append("Every finding below is one UNK ID defined twice in the same file with "
         "divergent wording: once inline in **Oracle candidates + integrity checks**, "
         "once in **Unknowns (UNK-*)**. This is the exact defect class round-1 "
         "flagged as DEF-A-2…DEF-A-5 (fixed for inference-engines, quantization, "
         "structured-output, embedding-serving); these five companions were outside "
         "the reviewed lanes and were never flagged or fixed.")
L.append("")
for scope, f, oid, lines in a["duplicates"]:
    L.append(f"### {oid} — `{f}`")
    for loc, txt in lines:
        L.append(f"- {loc}: {txt}")
    L.append("")
L.append("## 2. Dangling-reference report — 2 findings")
L.append("")
L.append("### FINDING D-1 — `pickup-guardrails.md:291` cites `UNK-GR` (malformed)")
L.append("")
L.append("- Line 291 (Starter-kit deltas): `- Corpus export tooling (TARGETED, not yet "
         "buildable — see UNK-GR corpus-export):`. No `UNK-GR-*` ID named "
         "`corpus-export` is defined anywhere in the file (defined: UNK-GR-01…UNK-GR-06); "
         "the citation cannot resolve to a row. Probable intended target is a missing "
         "corpus-export unknown (cf. DEF-E-13's TARGETED marking of the tooling).")
L.append("")
L.append("### D-2 — `UNK-EMB-O1`: dangling only against *current* definitions (historical, not live)")
L.append("")
L.append("- 6 occurrences, all inside frozen planning records: "
         "`docs/planning/round1/DEF-laneA.md:40`, "
         "`docs/planning/round1/INTEGRATION.md:36`, "
         "`docs/planning/round2/DEF2-laneB.md:152,155`, "
         "`docs/planning/round2/INTEGRATION2.md:71` (×2).")
L.append("- The ID was defined in the round-1 companion text and merged into "
         "`UNK-EMB-003` by the round-2 fix (DEF2-B-14, INTEGRATION2: "
         "\"no `UNK-EMB-O1` remains\"). No occurrence exists in any of the 21 "
         "current companions. Historical citations are expected in frozen artifacts; "
         "no live dangling reference.")
L.append("")
L.append("### Non-findings (16 classified, not dangling)")
L.append("")
for f, ln, oid, why in a["dangling_notes"]:
    L.append(f"- `{f}:{ln}` `{oid}` — {why}.")
L.append("")
L.append("## 3. Orphan-definition report — 192 (informational only)")
L.append("")
L.append("Breakdown: CLAIM 98 · REQ 39 · UNK 41 · GATE 14 · DEF 0. "
         "Every DEF finding is cited by its INTEGRATION ledger line, so no DEF is orphaned.")
L.append("")
L.append("- **CLAIM (98):** claim-registry table rows never cited in prose. Expected: "
         "the registry is self-contained by design; prose citation is not required.")
L.append("- **GATE (14):** all are *retired*-gate definition notes "
         "(e.g. `GATE-BU-2`, `GATE-CUA-02`, `GATE-DW-3`, `GATE-EMB-NETISOL`, "
         "`GATE-FT-02/04`, `GATE-GR-02/03`, `GATE-IE-02/04`, `GATE-SB-3`, "
         "`GATE-SEARCH-02/03`, `GATE-VDB-04`) — cited nowhere outside their own "
         "retirement note, which is the correct terminal state.")
L.append("- **REQ (39) / UNK (41):** defined in Requirements/Unknowns sections, never "
         "re-cited in prose. Includes the 10 duplicate UNK definitions above (defined "
         "twice, cited zero times outside the definitions).")
L.append("")
L.append("Full orphan list (`file:line  id`):")
L.append("")
for f, ln, oid, kind in a["orphans"]:
    L.append(f"- `{f}:{ln}` {oid} ({kind})")
L.append("")
open(S5 + "/id-checks.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("id-checks.md", len(L), "lines")

# ================= blocks-plan-ledger.md =================
def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

L = []
n_bp = len(a["blocks_plan"])
n_files = len({r["file"] for r in a["blocks_plan"]})
L.append(f"# BLOCKS_PLAN unknowns ledger — {n_bp} rows across {n_files} companions")
L.append("")
L.append("*Every `UNK-*` row in the 21 companions whose stated disposition is "
         "`BLOCKS_PLAN`. Source: the Unknowns (UNK-*) section of each companion, "
         "current text. BEADS READY check #4 requires this ledger to be empty "
         "(playbook: \"no UNK-* with disposition BLOCKS_PLAN\").*")
L.append("")
L.append("| ID | File:line | What blocks | Resolution predicate (as stated) | Owner |")
L.append("|---|---|---|---|---|")
owners_missing = 0
for r in a["blocks_plan"]:
    sents = sentences(r["full"])
    what = sents[0] if sents else ""
    what = re.sub(r"^[-*]\s*(\*\*)?" + re.escape(r["id"]) + r"(\.\*\*|\*\*)?\s*[:—–.-]?\s*", "", what)
    pred = " — ".join(s for s in sents[1:]
                      if re.search(r"(?i)resol|criterion|predicate|before S5|blocks|until|must be|required|needed", s)) or "not stated as a distinct predicate in the row"
    own = next((s for s in sents if re.search(r"(?i)\bowner\b", s)), None)
    if not own:
        owners_missing += 1
        own = "not stated in row"
    def esc(x): return x.replace("|", "\\|").replace("\n", " ")
    L.append(f"| {r['id']} | `{r['file']}:{r['line']}` | {esc(what[:220])} | {esc(pred[:260])} | {esc(own[:140])} |")
L.append("")
L.append(f"*Owner stated in {len(a['blocks_plan']) - owners_missing}/{n_bp} rows; "
         "the rest name no owner. Disposition source lines carry the literal "
         "`Disposition: BLOCKS_PLAN` marker (see `id-index.tsv`).*")
L.append("")
open(S5 + "/blocks-plan-ledger.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("blocks-plan-ledger.md", len(L), "lines")

# ================= open-p0p1.md =================
L = []
L.append("# Open P0/P1 ledger — the BEADS READY \"zero open P0/P1\" check input")
L.append("")
L.append("*Source: all 214 DEF findings (round 1: 4 P0 / 57 P1 / 31 P2; "
         "round 2: 0 P0 / 34 P1 / 47 P2; round 3: 9 P0 / 17 P1 / 15 P2) "
         "with dispositions from `docs/planning/round1/INTEGRATION.md`, "
         "`docs/planning/round2/INTEGRATION2.md`, and `docs/planning/round3/INTEGRATION3.md`.*")
L.append("")
L.append("## Status: zero OPEN and zero DEFERRED P0/P1")
L.append("")
L.append("- Round 1: P0 4/4 FIXED, P1 57/57 FIXED (INTEGRATION.md: "
         "\"Disposition totals: FIXED 90 · WONTFIX 1 (F-19) · DEFERRED 1 (A-8) · OPEN 0. "
         "No P0/P1 deferred or open.\")")
L.append("- Round 2: P1 34/34 FIXED, P2 47/47 FIXED (INTEGRATION2.md: "
         "\"Open count: 0. Every P1 (34) and every P2 (47) is FIXED.\")")
L.append("- Round 3: P0 9/9 FIXED (4 lane-A/C + 5 integrator-raised DEF3-INT), "
         "P1 17/17 FIXED, P2 15/15 FIXED (INTEGRATION3.md).")
L.append("- `docs/planning/ROUND_LOG.md` carries no OPEN lines; both ledgers record `open=0`.")
L.append("- Non-qualifying carry-forwards (P2 only): DEF-A-8 DEFERRED → S5 "
         "(ID-namespace normalization); DEF-F-19 WONTFIX (voice claim-table owner column, "
         "schema rationale recorded). Neither is P0/P1.")
L.append("")
L.append("## FIXED-but-flagged-as-new-defect — 5 entries (P1, all FIXED in INTEGRATION2)")
L.append("")
L.append("These are the findings whose own text flags them as defects *introduced by* "
         "a round-1 fix (or residue a round-1 fix left behind). They are FIXED, so the "
         "\"zero open P0/P1\" gate is not tripped by them — but they are the reason the "
         "round-2 diff cannot be POLISH (see `diff-class.md`), and any S4 re-run must "
         "re-verify the flagged fixes rather than assume round-1 FIXED lines stayed fixed.")
L.append("")
flags = [
    ("DEF2-A-1", "P1", "docs/planning/round2/DEF2-laneA.md:19",
     "Self-contradiction in shared-gates.md \"introduced by the round-1 retirement addition\": "
     "line 7 \"the set only grows by constitution amendment\" vs line 21 \"The set does not only grow: "
     "a superseded gate is retired…\". Round-1 fix for DEF-E-5 added the retirement rule without "
     "reconciling the original sentence. INTEGRATION2 fix: line 7 now reads \"the set changes only "
     "by constitution amendment\"."),
    ("DEF2-B-3", "P1", "docs/planning/round2/DEF2-laneB.md:43",
     "structured-output UNK-2 \"falsely RESOLVED\" — \"a new defect introduced by the round-1 fix, "
     "not a re-litigation of the original UNK\": the round-1 fix stamped RESOLVED while the row's own "
     "rationale deferred confirmation to future S4 review. INTEGRATION2 fix: G1–G14 map rebuilt; "
     "UNK-2 set to TARGETED \"pending S4 confirmation\"."),
    ("DEF2-C-1", "P1", "docs/planning/round2/DEF2-laneC.md:44",
     "workflow-orchestrators starter-kit delta still lists \"New gates — GATE-DW-1..4 registered\" "
     "as active, \"directly contradicting the round-1 retirement into shared GATE-005 stated in the "
     "same file's Gate profile\" — round-1 retirement fix left a stale delta line behind. "
     "INTEGRATION2 fix: deltas register only GATE-DW-2/3."),
    ("DEF2-C-5", "P1", "docs/planning/round2/DEF2-laneC.md:77",
     "computer-use bench shape / golden schema cite retired GATE-CUA-03 and GATE-CUA-04 as active "
     "requirements, \"although both were retired into shared GATE-008 in round 1\" — round-1 "
     "retirement fix left stale citations. INTEGRATION2 fix: schema cites shared GATE-008 parameters."),
    ("DEF2-C-6", "P1", "docs/planning/round2/DEF2-laneC.md:86",
     "computer-use starter-kit delta \"proposes registering a retired gate ID [GATE-CUA-04] as an "
     "active gate in the kit\" — same round-1 retirement residue as C-5. INTEGRATION2 fix: registers "
     "under GATE-008's benchmark-pin parameter."),
]
for oid, sev, loc, txt in flags:
    L.append(f"### {oid} [{sev}] — FIXED (flagged)")
    L.append(f"- {loc}: {txt}")
    L.append("")
L.append("## Check procedure for the gate")
L.append("")
L.append("1. Parse `id-index.tsv` rows with `kind=DEF`, `ledger_disposition` in "
         "(OPEN, DEFERRED), `severity` in (P0, P1) → must be zero rows.")
L.append("2. This file asserts that result for the current corpus state: **0 rows**.")
L.append("3. Re-run `/tmp/s5_extract.py` + `/tmp/s5_analyze.py` after any corpus edit; "
         "the scripts are deterministic and the TSV is the check input.")
L.append("")
open(S5 + "/open-p0p1.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("open-p0p1.md", len(L), "lines")

# ================= diff-class.md =================
L = []
L.append("# Last-diff classification — SUBSTANTIVE")
L.append("")
L.append("*Mechanical classification per PROJECT-PICKUP-PLAYBOOK.md, BEADS READY check #2 "
         "(lines 525–529): \"last diff **POLISH** — a complete final review round that produced "
         "no P0/P1 findings and changed only copy/format. POLISH is a review *round*, not a label: "
         "any change to a claim, gate, threshold, requirement, or acceptance criterion is "
         "substantive, re-opens S4, and voids a prior POLISH.\"*")
L.append("")
L.append("## Verdict: SUBSTANTIVE (not POLISH)")
L.append("")
L.append("Two independent mechanical reasons; either alone is sufficient:")
L.append("")
L.append("1. **Round 2 was not a no-P0/P1 round.** Round-2 S4 review produced 34 P1 findings "
         "(0 P0, 47 P2) — `docs/planning/round2/DEF2-lane{A..F}.md`, INTEGRATION2 scope line. "
         "A POLISH round by definition produces no P0/P1 findings.")
L.append("2. **The round-2 integration diff changed claims, gates, requirements, and "
         "acceptance criteria** — each of which the rule names as substantive. "
         "Evidence from `docs/planning/round2/INTEGRATION2.md` (all FIXED, i.e. all applied):")
L.append("")
L.append("### Claim changes (substantive per rule)")
L.append("")
L.append("- DEF2-C-4: `CLAIM-DW-12` re-tiered to T3/Low (claim tier is an acceptance-relevant attribute).")
L.append("- DEF2-C-13: `CLAIM-SEARCH-05` malformed claim-table row repaired (claim row content changed).")
L.append("- DEF2-D-5..D-9: tier re-mappings across eval-harnesses, observability, guardrails, "
         "vector-dbs, fine-tuning claim tables (T0/T1/T2 boundaries moved).")
L.append("- DEF2-B-14: `UNK-EMB-O1` merged into `UNK-EMB-003` (unknown inventory changed; "
         "references updated).")
L.append("- DEF2-C-8 / DEF2-B-3: `UNK-BU-2` and structured-output `UNK-2` dispositions set to "
         "TARGETED (disposition is load-bearing for the BEADS READY gate).")
L.append("")
L.append("### Gate changes (substantive per rule)")
L.append("")
L.append("- DEF2-D-1: voice-agents deltas now define only `GATE-VA-1`/`GATE-VA-4` as companion-local; "
         "`GATE-VA-2`/`GATE-VA-3` retired into shared `GATE-013`.")
L.append("- DEF2-C-7: `GATE-SEARCH-04` retired into shared `GATE-014`.")
L.append("- DEF2-D-11: `GATE-OBS-SEMCONV`/`GATE-OBS-COMPLETE` retired into shared `GATE-010`; "
         "`GATE-OBS-INGEST`/`GATE-OBS-PRICE` defined as the two new type-local gates.")
L.append("- DEF2-C-1: workflow-orchestrators deltas register only `GATE-DW-2`/`GATE-DW-3` "
         "(was `GATE-DW-1..4`).")
L.append("- DEF2-A-2: all 18 shared-gate headers versioned (`GATE-NNN v1.0`) — acceptance-criteria "
         "versioning applied to the registry itself (registry 1.1 → 1.2).")
L.append("- DEF2-B-5..B-8, F-1..F-4: seven shared-gate declaration tables added "
         "(inference-engines, quantization, structured-output, embedding-serving, observability, "
         "fine-tuning, voice-agents) plus the closer's 10 follow-up tables — gate applicability "
         "statements are new normative content.")
L.append("- Shared-gate names corrected to registry titles in four companions "
         "(DEF2-B-9..B-11, C-2).")
L.append("")
L.append("### Requirement / threshold changes (substantive per rule)")
L.append("")
L.append("- DEF2-D-3/D-4 + the 14-companion slot-13 sweep: starter-kit deltas gained CI "
         "provisioning + cost-ownership items (runner class, funding owner, spend cap) — "
         "requirement content added to 21 companions.")
L.append("- DEF2-C-12: sandbox-exec `REQ-2` gained GATE-007 review-date and "
         "substrate-generation diff-review requirements.")
L.append("- DEF2-C-5/C-6: computer-use golden schema and `kit-gates.yml` re-registered under "
         "shared `GATE-008` parameters.")
L.append("- Playbook 1.1 → 1.2 and shared-gates registry 1.1 → 1.2: both files' own amendment "
         "rules required the version bump, i.e. the changes were substantive by the files' "
         "own definitions.")
L.append("")
L.append("### What was genuinely polish (not sufficient for a POLISH verdict)")
L.append("")
L.append("- Typo/path corrections (DEF2-A-8 `templates/rl-env/` → `templates/rl-envs/`, DEF2-D-10, "
         "DEF2-F-8..F-10 stale \"12 localbench slots\" strings), wording moves (DEF2-F-12, F-17), "
         "pointer fixes (DEF2-E-2, D-2). These are copy/format — but they ride a diff that also "
         "contains the substantive changes above, so the diff as a whole is SUBSTANTIVE.")
L.append("")
L.append("## Consequence")
L.append("")
L.append("- BEADS READY check #2 (\"last diff POLISH\") **fails** on current state: the last "
         "integration diff is SUBSTANTIVE.")
L.append("- Per the playbook, a substantive change \"re-opens S4, and voids a prior POLISH\": "
         "a further complete S4 review round producing no P0/P1 findings and changing only "
         "copy/format is required before check #2 can pass. (Note: the round-2 corpus also still "
         "carries 25 BLOCKS_PLAN unknowns — check #4 — and the 10 duplicate UNK definitions in "
         "`id-checks.md`, so a re-review round has known findings to clear first.)")
L.append("- INTEGRATION2's own characterization (\"All fixes are mechanical text corrections…\") "
         "describes *inference load*, not diff class: the playbook's POLISH/SUBSTANTIVE rule is "
         "mechanical on *what changed* (claim/gate/threshold/requirement/acceptance-criterion), "
         "not on how hard the edit was to write.")
L.append("")
open(S5 + "/diff-class.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("diff-class.md", len(L), "lines")
