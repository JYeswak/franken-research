# DEF2 Lane C — companion consistency sweep 2 (round 2)

Reviewer: Lane C (workflow-orchestrators / sandbox-exec / browser-use / computer-use /
web-search-apis / agent-memory / rag-frameworks). 2026-09-23.

Read: `PROJECT-PICKUP-PLAYBOOK.md` (claim/evidence governance + T0–T3 mapping),
`shared-gates.md`, and the 7 companions. Round-1 FIXED findings not re-litigated
unless the fix introduced a new defect (several did — see below).

**Severity counts:** P0: 0 | P1: 8 | P2: 5 | **Total: 13**

**Checks that passed outright:**
- (b) GATE-007 hardened criteria are carried by the sandbox companion's REQ/bench
  sections: cost accounting in REQ-CI-COST (per-run, bench slot 13); red-then-green
  in the GATE-SB-1 retired parameter + starter-kit delta 1; maintained,
  version-pinned vector list with per-vector provenance in UNK-1. Only the
  review-date / generation-change diff-review clause is dropped (DEF2-C-12).
- (c) Browser-use: REQ-BU-7 states the product trust boundary (hostile page
  content, mediation policy, prompt-injection fixtures, exfiltration failure,
  secrets-store credential handling); REQ-BU-4 bans secrets-bearing LLM-judged
  benchmarks from the PR lane; no REQ puts them back (starter-kit delta 4's
  eval-on-PR template stays within REQ-BU-4's non-secret isolated lane).
- (d) Durable-execution boundary is clean: workflow-orchestrators is the sole
  owner of workflow replay (GATE-DW-2/3 + GATE-005 type parameters); REQ-DW-6 is
  an interface-only contract for agent-frameworks, not an ownership grab; no
  other lane-C companion claims durable workflow replay or agent
  checkpoint/restart.
- (e) All 7 companions state the canonical T0–T3 mapping verbatim in their
  claim-registry sections with no inverted language. Memory and RAG re-tiering
  is sensible, not mechanical: honest T2/T3 rows, [Inference] labels on
  aspirational gates (GATE-MEM-2, GATE-RAG-1/4, REQ-SEARCH-06), aspirational
  GATE-MEM-2 acknowledged against UNK-2 (BLOCKS_PLAN).
- (f) [Inference] labels present in this round are honest and consistently
  applied (GATE-MEM-2, GATE-RAG-1, GATE-RAG-4, REQ-SEARCH-06, retired
  GATE-BU-4 note). One consistency lapse (DEF2-C-10).
- (g) Every sandbox UNK carries a disposition; both BLOCKS_PLAN rows (UNK-1,
  UNK-6) name resolution predicates — not vacuous.
- All retired gate IDs appear in retired notes correctly (GATE-DW-1/4,
  GATE-SB-1/4, GATE-BU-1/2/3, GATE-SEARCH-04, GATE-CUA-03/04) — except where
  flagged below.

---

DEF2-C-1 [P1] pickup-workflow-orchestrators.md:Starter-kit deltas — "New gates —
GATE-DW-1..4 registered in the gate registry with acceptance criteria" cites
retired GATE-DW-1 and GATE-DW-4 as active gates to register, directly
contradicting the round-1 retirement into shared GATE-005 stated in the same
file's Gate profile. Fix: "New gates — GATE-DW-2..3 registered in the gate
registry with acceptance criteria (GATE-DW-1/GATE-DW-4 retired into shared
GATE-005; see Gate profile)."

DEF2-C-2 [P1] pickup-workflow-orchestrators.md:Shared-gate declarations — the
table mislabels three shared gates: GATE-014 "(secrets quarantine)" (registry:
GATE-014 = Deterministic test doubles / offline CI), GATE-016 "(truth-pack
integrity)" (registry: GATE-016 = Dependency / toolchain pinning; truth-pack is
GATE-002), GATE-018 "(agent-task evals)" (registry: GATE-018 = Flake
quarantine). Worse, the GATE-018 row is marked Load-bearing with rationale
"Agent-workflow replay evals are the type's acceptance surface" — that rationale
belongs to GATE-008 (Browser/GUI task-state evaluator), so the companion is
wiring the wrong gate ID to a load-bearing disposition. Fix: relabel the rows
per shared-gates.md titles; replace the GATE-018 row with GATE-008 if
agent-task evals is the intended load-bearing gate (or keep GATE-018 with a
real flake-quarantine rationale).

DEF2-C-3 [P1] pickup-workflow-orchestrators.md:Gate profile (G14 REJECT type
params) — "a 'deterministic' claim sourced only from vendor docs (T0) with no
replay fixture is rejected down to T3" inverts the canonical mapping: vendor
docs are T2 [Maintainer claim], not T0 [Verified]. The mapping example would
teach authors to mis-tier. Fix: change "(T0)" to "(T2)".

DEF2-C-4 [P1] pickup-workflow-orchestrators.md:Initial claims (CLAIM-DW-12) —
the statement is explicitly "labeled inference" yet the tier column reads T0.
Per the canonical mapping every companion states, analyst inference is T3, not
T0; tiering an inference as Verified is exactly the mis-tiering the playbook
non-conformance rule targets. Fix: tier T0 → T3 (confidence Low stands).

DEF2-C-5 [P1] pickup-computer-use.md:Localbench bench shape / Golden schema —
conformance MUSTs cite retired GATE-CUA-03 and GATE-CUA-04 as active
requirements ("FAIL-protocol present (GATE-CUA-03)", "benchmark-commit pinned
(GATE-CUA-04)"), although both were retired into shared GATE-008 in round 1.
Retired IDs may appear only in retired notes. Fix: cite shared GATE-008 with
its retained type-specific parameters ("FAIL-protocol present (GATE-008
fail-protocol parameter)", "benchmark-commit pinned (GATE-008 benchmark-pin
parameter)").

DEF2-C-6 [P1] pickup-computer-use.md:Starter-kit deltas item 2 —
"`scripts/gates/check-benchmark-pin.sh` (+ `GATE-CUA-04` in `kit-gates.yml`)"
proposes registering a retired gate ID as an active gate in the kit. Fix:
register the script under GATE-008's benchmark-pin type-specific parameter in
`kit-gates.yml` (e.g. `GATE-008 benchmark-pin parameter`), not under the
retired ID.

DEF2-C-7 [P1] pickup-web-search-apis.md:Starter-kit deltas — "register
GATE-SEARCH-01..04 (FROZEN-FIXTURE, LATENCY-BUDGET, EVAL-PER-SHA, NO-KEY-GREEN)
in the gate registry" includes retired GATE-SEARCH-04 (retired into shared
GATE-014). Fix: register GATE-SEARCH-01..03 only.

DEF2-C-8 [P1] pickup-browser-use.md:UNK-BU-2 — disposition is RESOLVED, but the
UNK's own text still says the G1–G14 mapping "is provisional and must be
reconciled against the real gate list before S5", and the Gate profile still
says "this mapping is provisional (see UNK-BU-2)". A RESOLVED disposition on an
admittedly-provisional mapping hides an open S4 gap from the BEADS READY check
(a wrongly-closed UNK never trips "zero open P0/P1"). Fix: either show the
reconciled per-gate G1–G14 mapping and drop all "provisional" language, or
return the disposition to TARGETED with the reconciliation as the promotion
predicate.

DEF2-C-9 [P2] pickup-workflow-orchestrators.md:Counts line — "18 gates (G1–G14 +
GATE-DW-1..4)" counts two retired gates as active. Fix: "16 active gates
(G1–G14 + GATE-DW-2..3); GATE-DW-1/4 retired into shared GATE-005."

DEF2-C-10 [P2] pickup-browser-use.md:Evidence tiers — "[Inference] (T3): ...
and all UNK-* items" lumps unknowns under claim tiers. UNK-* items are
disposition-governed (TARGETED/BLOCKS_PLAN/ADVISORY/WATCH/RESOLVED), not T3
claims; tiering them as [Inference] conflates two namespaces (e.g. UNK-BU-1 is
BLOCKS_PLAN, not a T3 claim). Fix: delete "and all UNK-* items" from the
[Inference] tier bullet.

DEF2-C-11 [P2] pickup-rag-frameworks.md:Starter-kit deltas — "Load-bearing for
this type: G1, G7, R1–R4." The ID shape "R1–R4" is not registered (should be
GATE-RAG-1..4); separately, G7 is listed load-bearing here while the Gate
profile frames G7 as a Rust-centric gate recorded only via a type-specific
analog "as a review parameter, not a claim that canonical G7 applies as-is."
Fix: "GATE-RAG-1..4"; clarify whether the load-bearing G7 is the canonical
gate or the G7 analog.

DEF2-C-12 [P2] pickup-sandbox-exec.md:REQ-2 / Oracle integrity checks — the
hardened GATE-007 acceptance (2) requires the forbidden syscall set to be
"pinned as a truth-pack fixture with a review date, and diff-reviewed on any
substrate generation change." The companion pins the forbidden-syscall list in
MANIFEST.sha256 but carries neither the review date nor the
generation-change diff-review clause into REQ-2 or the integrity-check section.
Fix: add to REQ-2 or the integrity checks: the forbidden-syscall fixture
carries a review date and is diff-reviewed on any substrate generation change.

DEF2-C-13 [P2] pickup-web-search-apis.md:Initial claims (CLAIM-SEARCH-05) — an
unescaped `|` inside the evidence-pointer cell ("engine playwright\ | no-proxy
× search `searxng` …") splits the row into two table fragments, leaving the
tier ambiguous (fragments show both T0 and T1). Fix: remove or escape the
embedded pipe so the row has exactly one tier cell.
