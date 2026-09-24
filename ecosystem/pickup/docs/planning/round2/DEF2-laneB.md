# DEF2 Lane B — companion consistency sweep 1 (round 2)

*Reviewer: Round 2 S4, Lane B. Scope: inference/quantization/structured-output/
embedding-serving/agent-frameworks/mcp/multi-agent-protocols. Read: playbook
claim/evidence governance + T0–T3 + ID format sections, shared-gates.md
GATE-001…018, all 7 companions. Reviewed files were NOT edited.*

**Counts: P0: 0 · P1: 11 · P2: 4 · Total: 15.**

---

## P1 findings

DEF2-B-1 [P1] pickup-inference-engines.md:Evidence tiers — **Inverted T0–T3
mapping.** The section defines "T0 — Vendor" (vendor-published perf numbers)
and "T1 — Independent / open-source in-repo" (unit-tested in-repo harnesses,
perf-regression CI — the load-bearing tier). This is exactly the inversion the
playbook calls non-conformant ("T0 vendor / T1 independent" → P1): under the
canonical mapping those in-repo, directly-inspected harnesses are T0
[Verified] and vendor-published numbers are T2 [Maintainer claim]. Worse, the
file contradicts itself: the claims-table header (line ~109) states the
canonical mapping verbatim, so T0 means two different things in one file. The
Oracle section inherits the inversion ("Integrity: T0 oracle" for
TensorRT-LLM; vLLM `benchmark_serving.py` "Treat as T1").
Fix: replace the Evidence tiers section with the canonical mapping (verbatim
per the playbook); relabel the oracle-section tier notes to the canonical
reading (TensorRT-LLM vendor reference = T2 unless reproduced; vLLM forked
benchmark harness inspected in-tree = T0).

DEF2-B-2 [P1] pickup-structured-output.md:Starter-kit deltas ("Load-bearing vs
advisory") — **Retired gate cited as an active requirement.** GATE-SO-2 was
retired into shared GATE-004 (S4 round 1), yet the bullet reads "GATE-SO-1
(mask-equivalence) and GATE-SO-2 (compilation worst-case) are load-bearing."
A retired ID is being cited as a load-bearing requirement. The companion's
"New gates" bullet compounds it: after naming the SO-2/SO-3 retirement it
trails "— mask-equivalence differential, compilation worst-case,
cache-invalidation, overhead-band," which reads as if all four are still new
gates.
Fix: rewrite the bullet to declare **shared GATE-004 load-bearing** with the
retained compilation-worst-case parameter (pathological-input ceiling before
the serving loop); end the "New gates" bullet after "retired into shared
GATE-004."

DEF2-B-3 [P1] pickup-structured-output.md:Gate profile + UNK-2 — **G1–G14 map
never rebuilt against the canonical definitions; UNK-2 falsely RESOLVED.** The
gate profile still opens "The starter kit's G1–G14 were not available to this
author in-context; the mapping below is by gate class" and was never rebuilt
against the playbook's canonical G1–G14 operational definitions (contrast
inference-engines and quantization, which were). UNK-2 was marked RESOLVED in
round 1, but its own rationale says "S4 review must confirm each G1–G14
mapping against the real gate definitions" — the resolution condition is
stated as future work, so the RESOLVED stamp is false (a new defect introduced
by the round-1 fix, not a re-litigation of the original UNK).
Fix: rebuild the G1–G14 applicability map against the playbook's canonical
definitions (G6/G10/G11 conditional on Rust/C++ presence; G7 advisory or named
analog per the analog rule); set UNK-2 to TARGETED until that rebuild is
verified, or keep RESOLVED only with the rebuilt map in place.

DEF2-B-4 [P1] pickup-embedding-serving.md:Gate profile — **G11 wrongly N/A'd.**
"G11 LAYOUT — N/A for this type (no Rust layout structs)" — but the charter
says serving engines run in "(Rust, Python, C++/GGUF)" and the flagship oracle
(huggingface/text-embeddings-inference) is a Rust engine. A type that includes
Rust engines cannot waive layout-safety assertions with "no Rust layout
structs." N-A requires a written reason; this reason is factually false for
the type.
Fix: make G11 conditional like the file's own G6 entry — load-bearing/advisory
for Rust components (layout assertions on wire-format/pooling structs), N/A
with evidence for pure-managed implementations.

DEF2-B-5 [P1] pickup-inference-engines.md:Gate profile — **No shared-gate
load-bearing vs advisory declaration.** The playbook requires: "Each companion
file declares which [shared gates] are load-bearing vs advisory for its type."
This file cites shared gates only in the retired-gate notes (GATE-001) and the
boilerplate REQ-CI-COST line (GATE-007); it never declares GATE-001/002/003/
014/015/016/018 load-bearing vs advisory for inference engines.
Fix: add the declaration table (e.g. GATE-001/002/016 load-bearing;
GATE-003 advisory; GATE-014/015/018 universal; GATE-004/005/etc. N/A with
reason).

DEF2-B-6 [P1] pickup-quantization.md:Gate profile — **No shared-gate
load-bearing vs advisory declaration.** Same defect as DEF2-B-5: no declaration
for GATE-003 (the type's own gate), GATE-002, GATE-014/015/016/018, or the
rest.
Fix: add the declaration table (e.g. GATE-003 load-bearing; GATE-002
load-bearing; GATE-016 load-bearing; GATE-014/015/018 universal).

DEF2-B-7 [P1] pickup-structured-output.md:Gate profile / Starter-kit deltas —
**No shared-gate load-bearing vs advisory declaration.** Same defect as
DEF2-B-5/6: the retired-gate notes reference GATE-004 but the companion never
declares GATE-004 load-bearing, nor GATE-014/015/016/018.
Fix: add the declaration table (e.g. GATE-004 load-bearing; GATE-017 advisory;
GATE-014/015/018 universal).

DEF2-B-8 [P1] pickup-embedding-serving.md:Gate profile / Starter-kit deltas —
**No shared-gate load-bearing vs advisory declaration.** "Gates to add" names
GATE-EMB-PARITY/REGISTRY/AA and shared GATE-014 as "all four load-bearing,"
but there is no table covering GATE-001/002/014/015/016/018 (GATE-002 in
particular: the type's claims rest on pinned oracle weights, so its
disposition must be declared).
Fix: add the declaration table (e.g. GATE-001/002/016 load-bearing;
GATE-014/015/018 universal).

DEF2-B-9 [P1] pickup-agent-frameworks.md:Shared-gate declarations —
**Systematically misnamed gates.** Four of nine rows misname the shared gate:
GATE-014 ("secrets quarantine" — actual: Deterministic test doubles / offline
CI), GATE-015 ("bench tiers" — actual: Tiered CI separation), GATE-016
("truth-pack integrity" — actual: Dependency / toolchain pinning; truth-pack
integrity is GATE-002), GATE-018 ("agent-task evals" — actual: Flake
quarantine). The dispositions (Universal / Load-bearing / Advisory) all match
the registry — only the names are wrong — but a declaration table that names
nonexistent gates cannot be executed or audited. (Same template defect in
DEF2-B-10/11; likely introduced when the tables were added in round 1.)
Fix: correct the parenthetical names to the shared-gates.md titles; while
there, consider whether GATE-002 belongs in the table as advisory — the
companion's trajectory-parity claims rest on a pinned incumbent oracle.

DEF2-B-10 [P1] pickup-mcp.md:Shared-gate declarations — **Systematically
misnamed gates.** Same defect as DEF2-B-9: GATE-014 "secrets quarantine,"
GATE-015 "bench tiers," GATE-016 "truth-pack integrity," GATE-018 "agent-task
evals" — none matches shared-gates.md. Dispositions are correct; names are
wrong. ("GATE-017 (tool-surface sync)" is an acceptable short paraphrase of
"Spec / schema surface drift" and may stay.)
Fix: correct the four parenthetical names to the registry titles.

DEF2-B-11 [P1] pickup-multi-agent-protocols.md:Shared-gate declarations —
**Systematically misnamed gates.** Same defect as DEF2-B-9/10: GATE-014,
GATE-015, GATE-016, GATE-018 all misnamed; dispositions correct.
Fix: correct the four parenthetical names to the registry titles.

---

## P2 findings

DEF2-B-12 [P2] pickup-structured-output.md:Evidence tiers — **Duplicate T2
bullets, missing T1 row.** The section lists "T2 [Maintainer claim]" twice
(vendor numbers; maintainer overhead/correctness statements not tied to a
pinned run) with overlapping content, and has no explicit T1 [CI-observed]
row. The stated mapping is canonical (not inverted), so this is sloppiness,
not non-conformance.
Fix: merge the two T2 bullets; add the T1 [CI-observed] row (e.g. nightly
overhead-benchmark artifacts executed on CI).

DEF2-B-13 [P2] pickup-embedding-serving.md:Evidence tiers — **Misleading T1
label.** A T2 [Maintainer claim] bullet is annotated "(T1 [CI-observed] flavor
at best)" for numbers from a repo the file itself says has "essentially no
test CI" (FlagEmbedding, docs-only workflows). T1 requires the suite to have
run on CI; there is no T1 flavor here.
Fix: drop the parenthetical; the row is T2, full stop.

DEF2-B-14 [P2] pickup-embedding-serving.md:Unknowns — **Duplicate UNK
definitions.** UNK-EMB-003 ("vLLM's MTEB parity test CI scheduling is
unverified") and UNK-EMB-O1 ("vLLM MTEB harness admissibility as a gate oracle
pending scheduling verification") are the same unknown under two IDs. Round-1
merged duplicate UNKs; this pair survived.
Fix: merge UNK-EMB-O1 into UNK-EMB-003 (keep one ID; the §3 oracle reference
already points at the Unknowns section — keep that pointer).

DEF2-B-15 [P2] pickup-agent-frameworks.md:Initial claims header — **Garbled
tier sentence.** "Tiers follow the Tiers (canonical, per
PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — … ; WITHDRAWN rows carry --. T3
[Inference]), mapped via G14 to evidential burden." — duplicated word, stray
closing paren, dangling fragment. The mapping itself is canonical and correct.
Fix: clean up to one sentence stating the canonical mapping and the G14
tier-burden mapping.

---

## Checks that passed (no findings)

- **(a) Retired gates:** All other retired IDs (GATE-IE-01/02, GATE-SO-2/3,
  GATE-MCP-01–04, GATE-MAP-1/2/4, GATE-AF1) appear only in "RETIRED into
  shared GATE-NNN" notes or retirement-record bullets. The only active-use
  violation is DEF2-B-2. (Kept L2 gates GATE-IE-03/04, GATE-Q1–Q4, GATE-SO-1/4,
  GATE-EMB-*, GATE-AF2–4, GATE-MAP-3 are not retired and are legitimately
  cited.)
- **(b) L2 distinctness:** Every remaining type-local gate carries a genuine
  type-specific delta over its L1 parent (IE-03 differential-correctness vs
  GATE-002 truth-pack; IE-04 ship-bar vs GATE-003(4); Q1–Q4 vs GATE-003;
  SO-1 bitmask-level seeded differential vs GATE-004(3); SO-4 overhead band —
  no L1 timing criterion exists; EMB-PARITY mutant-tested one-sided parity vs
  GATE-001; EMB-REGISTRY linter vs GATE-016; EMB-AA refuse-to-bank vs the
  playbook result-class doctrine; AF2–AF4 vs GATE-005/GATE-017; MAP-3
  per-binding parity — explicitly justified as a GATE-006 delta). No
  restatements found.
- **(d) T0–T3:** Canonical everywhere except DEF2-B-1 (and the P2 sloppiness
  in DEF2-B-12/13/15). No other inverted language found by grep ("T0 vendor" /
  "T1 independent" occur only in inference-engines).
- **(e) G1–G14:** Conditional G6/G10/G11 handling is correct in
  inference-engines, quantization, mcp, and multi-agent-protocols (advisory /
  N-A-by-language with Rust-component load-bearing; no as-is claims for a
  non-Rust type). G7 analogs in quantization and mcp follow the playbook's
  namespaced-analog rule ("recorded as a review parameter, not a claim that
  canonical G7 applies as-is"). agent-frameworks G6/G10/G11 are N/A-conditional
  or N/A-with-analog (GATE-AF4) — passes the check as scoped.
- **(f) UNK merge:** No other duplicate UNK definitions. (The oracle-section
  UNK-01/02 in agent-frameworks and UNK-MAP-1/2 in multi-agent-protocols reuse
  the same IDs with explicit "See § Unknowns" pointers — cross-references, not
  duplicates.) Every BLOCKS_PLAN UNK (Q UNK-1; SO UNK-1; EMB-002/004/005; AF
  UNK-01/02/03; MCP UNK-MCP-01; MAP UNK-MAP-1/2) names its resolution
  predicate in the row, satisfying the playbook; owner assignment is an S5
  bead-cut concern, so no owner finding is filed.
- **(g) MCP scope:** No self-contradiction — "conformance/registry/inspector
  tooling" in scope vs "proprietary registry content or hosted service
  behavior" out of scope are different things. Boundaries are clean in both
  directions: MCP excludes agent orchestration (→ agent-frameworks/workflow);
  multi-agent-protocols excludes agent-to-tool (MCP) and LLM-agent building
  (→ agent-frameworks) with a role-based assignment rule for reference SDKs;
  agent-frameworks bindingly disclaims "durable execution" (→
  workflow-orchestrators). No double-claimed durable execution; no orphaned
  agent-building scope.

## Out-of-lane observation (not a DEF; for another lane)

- pickup-mcp.md G6 entry: "Servers that execute tools/shell/filesystem
  operations route through the exorcist's classification operators regardless
  of language." "The exorcist" / "classification operators" is an unexplained,
  possibly invented mechanism — the same fabrication-risk class flagged in
  prior adversarial reviews. Flagged here only; not scored in this lane.
