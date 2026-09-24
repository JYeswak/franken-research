# Round 1 — Lane B (architecture / boundaries) findings

Reviewer: fresh-context S4, Lane B. Reviewed cold; no prior context on these files.
Date: 2026-09-23.

Files reviewed:
- `PROJECT-PICKUP-PLAYBOOK.md` (constitution)
- `shared-gates.md` (18 shared gates)
- `_s0/g1-g14-reference.md` (G1–G14 definitions)
- `pickup-agent-frameworks.md`, `pickup-mcp.md`, `pickup-multi-agent-protocols.md`,
  `pickup-workflow-orchestrators.md`

Severity tally: P0 × 1 · P1 × 18 · P2 × 6 · total 25.

Summary judgment: the four companions are individually well-evidenced, but the
plan's architecture has three structural breaks. (1) The playbook contradicts
itself on where gates live: "gates come only from G1–G14 + ATLAS BUILD_READY +
the shared pickup gates" (Gate registry summary) cannot coexist with all four
companions minting type-local GATE-<slug>-N gates — and half of those
type-local gates restate shared gates (GATE-005/006/017) under new names.
(2) The charter seeds of adjacent types double-claim territory: agent-frameworks
claims "durable execution" and checkpoint conformance while workflow-orchestrators
claims agent-workflow replay (REQ-DW-6); MCP's "in scope" (client-side adapters)
contradicts its own "out of scope" (orchestration logic that consumes MCP); and
the protocol companion delegates agent-building to agent-frameworks, whose
charter excludes exactly that. (3) Gate-profile discipline against the G1–G14
reference card is uneven: the MCP companion claims the Rust-centric G6 and G11
"as-is" for an any-language type, and the workflow companion claims G11 "as-is"
for a Go/TS/Python-heavy type — the exact force-fit the reference card forbids.
Separately, all four companions omit the shared GATE-001…018 load-bearing vs
advisory declarations the playbook requires, and all four redefine the T0–T3
tier vocabulary with meanings that contradict the playbook's mapping.

---

DEF-B-1 [P0] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary — "The vendor
technique catalog is a catalog, not gates: gates come only from G1–G14 + ATLAS
BUILD_READY + the shared pickup gates." This is an architectural contradiction:
all four companions propose type-local gates (GATE-AF1..4, GATE-MCP-01..04,
GATE-MAP-1..4, GATE-DW-1..4), and the Namespaces section of this same playbook
authorizes them ("GATE-* — shared gates (registry: shared-gates.md) and
type-local gates"). As written, every type-local gate in the plan is
illegitimate. Fix: amend the sentence to read "gates come only from G1–G14 +
ATLAS BUILD_READY + the shared pickup gates (GATE-001… in shared-gates.md) +
type-local gates defined in the companion file (GATE-<slug>-N)", and state the
type-local naming convention normatively.

DEF-B-2 [P1] PROJECT-PICKUP-PLAYBOOK.md:Purpose + non-goals — The gate-profile
bullet says "proposed new shared gates (GATE-*, defined in `shared-gates.md`)",
but no companion defines its new gates in shared-gates.md; all four define
type-local gates in-companion (GATE-AF1, GATE-MCP-01, GATE-MAP-1, GATE-DW-1),
consistent with the Namespaces section and inconsistent with this bullet. Fix:
rewrite the bullet to distinguish the two paths: shared gates (proposed to
shared-gates.md, needs constitution amendment + two evidence files) vs
type-local gates (defined in the companion, GATE-<slug>-N).

DEF-B-3 [P1] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — The section claims
"Each stage has entry criteria, exit criteria, and a named artifact", but S0
through S5 list activities and exits only; no stage states entry criteria
(e.g. S4 has no "companion complete through S3" entry; S2 has no "charter
stable" entry). A stage's entry is exactly what prevents work from starting
on an unready input. Fix: add an explicit "Entry:" line per stage (S0: type
chosen by Phase-0 machinery + evidence file present; S1: S0 exit met; S2: S1
exit met; S3: truth pack verifies; S4: companion complete through S3; S5: zero
open P0/P1).

DEF-B-4 [P1] PROJECT-PICKUP-PLAYBOOK.md:The 21 covered types — The table
mandates one companion file `pickup-<slug>.md` per type and lists the MCP row
as slug `mcp-servers-clients` → `pickup-mcp-servers-clients.md`, but the file
on disk is `pickup-mcp.md`. The constitution's own naming rule is violated by
one of the four reviewed companions. Fix: rename the file to
`pickup-mcp-servers-clients.md`, or amend the table/slug (amendment must then
reconcile every GATE applies-to slug referencing `mcp-servers-clients`).

DEF-B-5 [P1] pickup-agent-frameworks.md:Charter seed + pickup-workflow-orchestrators.md:Charter seed —
Double-claimed territory. The agent-frameworks charter lists "durable
execution, checkpointing, resumability" as the type's runtime affordances and
puts "checkpoint/resumability state semantics and their backend-agnostic
conformance" in scope; the workflow-orchestrators charter puts
"agent-workflow replay tests" in scope and REQ-DW-6 requires every LLM-agent
orchestration path to ship recorded-history replay tests. A clean-room agent
framework with checkpoint/replay and a durable engine with agent-workflow
replay would each claim the same project under these charters, and shared
GATE-005 already applies to both slugs — which is fine for a shared gate but
does not resolve the charter-level ownership. Fix: carve explicitly —
agent-frameworks owns trajectory/doubles/checkpoint-conformance of the loop;
workflow-orchestrators owns the history/journal/replay machinery; rewrite
REQ-DW-6 as a cross-type interface requirement ("agent paths replay through
the framework's recorded-history contract") instead of an in-scope build
requirement, and drop "durable execution" from the agent-frameworks type
description.

DEF-B-6 [P1] pickup-mcp.md:Charter seed — Internal boundary contradiction.
"In scope" claims "client-side adapters", while "Out of scope" says "Agent
orchestration logic that merely *consumes* MCP (that's agent-frameworks /
workflow territory)". A client-side adapter (e.g. langchain-mcp-adapters,
cited as CLAIM-11 evidence in this same file) is precisely orchestration-side
code that consumes MCP — the charter both claims and disclaims it. Fix: adopt
a one-line ownership rule, e.g. "adapters that expose the MCP wire surface
are in scope; adapters whose logic is orchestration policy (tool selection,
planning) belong to agent-frameworks", and move langchain-mcp-adapters-class
evidence to whichever side the rule assigns.

DEF-B-7 [P1] pickup-multi-agent-protocols.md:Charter seed + pickup-agent-frameworks.md:Charter seed —
Orphaned scope between adjacent types. The protocols charter excludes
"building an LLM-driven agent to *use* the protocol (that is
agent-frameworks work)", but the agent-frameworks charter excludes
"application-level agents built *on* a framework (the framework's SDK surface
is the subject, not one downstream agent)". An LLM agent built on a framework
to speak A2A is therefore delegated by the protocols charter to a type whose
charter excludes it — no charter owns it. Fix: assign it explicitly (either
extend agent-frameworks in-scope with "reference agent implementations used
as protocol test harnesses", or add it to multi-agent-protocols as "reference
agent SUT"); do not leave the delegation dangling.

DEF-B-8 [P1] pickup-mcp.md:Gate profile — G6 UNSAFE is claimed "as-is,
MCP-flavored" for a type whose charter covers "SDK implementations in any
language" (the evidence spans TypeScript, Python, Go; UNK-MCP-06 notes Rust
SDK CI is unverified). The G1–G14 reference card is explicit: "G6/G7/G11 are
Rust-centric; for Python/TypeScript-heavy types, record the analog … as a
type-specific proposed gate rather than claiming G6 applies as-is." This is
the exact force-fit the card forbids. Fix: demote to a GATE-MCP-N analog
(e.g. "every new privileged/tool-execution-adjacent site needs a
SAFETY-equivalent comment + classification review"), with G6 proper marked
N/A unless the SUT is Rust.

DEF-B-9 [P1] pickup-mcp.md:Gate profile — G11 LAYOUT is claimed "as-is" with
no parameters or conditions, for the same any-language type. Per the
reference card, check-layout.sh asserts `size_of`/`align_of` on Rust structs;
an "as-is" claim for TypeScript/Python/Go SDK work is meaningless, and the
companion offers no analog. Fix: mark G11 N/A unless the SUT is Rust (the
multi-agent-protocols companion's "Advisory/N-A unless the SUT is Rust"
wording is the correct pattern), or define a wire-layout analog gate.

DEF-B-10 [P1] pickup-workflow-orchestrators.md:Gate profile — G11 LAYOUT is
claimed "applies as-is" with type params about "journal / event-history
on-disk or in-memory format". The type's evidence is Go/Java/TypeScript/Python
dominant (temporal lineage) with one Rust engine (restate); G11's mechanism
is Rust `size_of`/`align_of` asserts. Claiming it as-is for the whole type is
the force-fit the reference card warns against. Fix: scope G11 as-is to Rust
targets only (matching this file's own G6/G10 per-language scoping), advisory
otherwise, or propose a language-agnostic journal-format assertion as a
GATE-DW-N analog.

DEF-B-11 [P1] pickup-agent-frameworks.md:Gate profile — Proposed GATE-AF1
(scripted-model integrity: fail on unscripted model calls and unconsumed
script steps) duplicates shared GATE-005 acceptance criterion (2) ("the
scripted-model contract fails on unexpected calls AND on unconsumed steps"),
which already applies to `agent-frameworks`. Minting a type-local gate that
restates a shared gate's criterion verbatim is the duplication the lane was
asked to catch. Fix: declare GATE-005 load-bearing for agent-frameworks and
either drop GATE-AF1 or reframe it strictly as type-specific parameters to
GATE-005 (the mutation-test acceptance is a legitimate parameter, not a new
gate).

DEF-B-12 [P1] pickup-mcp.md:Gate profile — Proposed GATE-MCP-01
(CONFORMANCE-PINNED) and GATE-MCP-02 (NO-SILENT-SKIP) duplicate shared
GATE-006, which already applies to `mcp-servers-clients`: GATE-006 criterion
(1) is the pinned official conformance harness in CI per spec revision, and
criterion (2) is named expected-failures baselines with never-silent skips.
Fix: declare GATE-006 load-bearing for this type and fold GATE-MCP-01/02
into type-specific parameters of GATE-006 (or keep them only for the delta
GATE-006 does not cover, stated explicitly).

DEF-B-13 [P1] pickup-mcp.md:Gate profile — Proposed GATE-MCP-03
(TOOL-SURFACE-DIFF) and GATE-MCP-04 (SPEC-TYPE-SYNC) duplicate shared
GATE-017 criteria (1) ("PRs diff the exposed tool/schema surface (base vs
head) as a reviewable artifact") and (2) ("protocol types are generated from
(or diff-checked against) the spec source of truth"), and GATE-017 already
lists `mcp-servers-clients` in applies-to. Fix: declare GATE-017
load-bearing and drop GATE-MCP-03/04, or retain them only as the acceptance
wording of GATE-017 for this type.

DEF-B-14 [P1] pickup-multi-agent-protocols.md:Gate profile — Proposed
GATE-MAP-1 (TCK-PIN), GATE-MAP-2 (WIRE-FLIP), GATE-MAP-3 (TRANSPORT-PARITY),
and GATE-MAP-4 (INDEPENDENT-PEER) substantially duplicate shared GATE-006,
which applies to `multi-agent-protocols`: pinned conformance harness (1),
expected-failures baselines / never-silent skips (2), every wire revision
tested (3), cross-implementation interop matrix (4), and the anti-pattern
"self-interop claimed as interop" (GATE-MAP-4's core). The companion never
declares GATE-006 at all — it both omits the shared gate and reinvents it.
Fix: declare GATE-006 load-bearing; keep GATE-MAP-N only for genuine delta
(e.g. the must-flip marker mechanics), each annotated with which GATE-006
criterion it extends.

DEF-B-15 [P1] pickup-agent-frameworks.md:Gate profile — The companion never
declares any shared GATE-001…018 as load-bearing vs advisory, although the
playbook requires it ("Each companion file declares which are load-bearing
vs advisory for its type"). Shared gates needing declaration here: GATE-004
(advisory, tool-call schemas), GATE-005 (deterministic replay — applies to
this slug), GATE-007 (advisory, sandboxed tool execution), GATE-010
(advisory, run logging), GATE-011 (advisory, tool-call gating), GATE-014/015/
016 (universal), GATE-018 (load-bearing for this slug). Fix: add a shared-gate
declaration table to the Gate profile section.

DEF-B-16 [P1] pickup-mcp.md:Gate profile — Same omission as DEF-B-15. Shared
gates needing declaration: GATE-004 (advisory, tool schemas), GATE-006
(applies to this slug), GATE-014/015/016 (universal), GATE-017 (applies to
this slug), GATE-018 (universal). Fix: add the declaration table; this also
forces resolution of DEF-B-12/13 (the table cannot be completed honestly while
GATE-MCP-01..04 duplicate GATE-006/017).

DEF-B-17 [P1] pickup-multi-agent-protocols.md:Gate profile — Same omission as
DEF-B-15. Shared gates needing declaration: GATE-006 and GATE-017 (both apply
to this slug), GATE-014/015/016/018 (universal). Fix: add the declaration
table; forces resolution of DEF-B-14.

DEF-B-18 [P1] pickup-workflow-orchestrators.md:Gate profile — Same omission
as DEF-B-15. Shared gates needing declaration: GATE-005 (applies to this
slug), GATE-014/015/016 (universal), GATE-017 (advisory), GATE-018
(load-bearing for this slug). Fix: add the declaration table.

DEF-B-19 [P1] pickup-agent-frameworks.md:Initial claims + pickup-mcp.md:Initial claims +
pickup-multi-agent-protocols.md:Initial claims + pickup-workflow-orchestrators.md:Initial claims —
All four companions redefine the T0–T3 tier vocabulary as "T0 vendor / T1
independent / T2 self-reported / T3 aspirational", contradicting the
playbook's normative mapping (T0=[Verified], T1=[CI-observed],
T2=[Maintainer claim]/[External], T3=[Inference]) — e.g. agent-frameworks
CLAIM-01 is labeled "T0 vendor (framework authors)" where playbook-T0 means
direct inspection or pinned-oracle measurement. The playbook requires its
mapping to be "stated in every companion file"; instead every companion
states a different one under the same IDs, so a T1 claim means opposite
things in the constitution and in the companions. Fix: align all companion
claim tables to the playbook's T0–T3 meanings (re-tiering rows as needed), or
rename the companion-local scale so the IDs do not collide.

DEF-B-20 [P2] shared-gates.md:GATE-002 — The applies-to ends with an
open-ended clause: "any type whose claims rest on weights, datasets, or a
reference implementation." Since the playbook's truth-pack spec requires every
pickup to pin a reference implementation, this clause makes GATE-002 apply to
nearly all 21 types — contradicting its listed slugs and its
weights/datasets-shaped acceptance criteria (invocation-time binary SHA-256,
fetch-truth-pack --verify). Fix: narrow the clause (e.g. "or a reference
*executable/dataset* the type's *measurements* rest on") or define what
"rests on" means so the gate does not silently become universal.

DEF-B-21 [P2] PROJECT-PICKUP-PLAYBOOK.md:Namespaces — Type-local gates share
the `GATE-*` namespace with shared gates with no normative naming rule, so
GATE-MCP-01 is visually confusable with shared GATE-001, and nothing stops
two companions from minting colliding suffixes. Fix: state the convention
normatively (shared gates are `GATE-` + zero-padded number only; type-local
gates must be `GATE-<type-slug>-N`), as part of the DEF-B-1 amendment.

DEF-B-22 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — S3 exit says
"gate log open with no FAILs", which is ambiguous between "no gate has failed
yet" and "all wired gates currently pass". Fix: reword to "gate log shows
zero FAIL verdicts on wired gates" (or define the intended bar explicitly).

DEF-B-23 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — "A stage skipped
records its reason in `docs/planning/ROUND_LOG.md`" has no verification hook:
S4's exit criteria (zero open P0/P1, no BLOCKS_PLAN unknowns) do not require
confirming that every stage was either completed or has a recorded skip
reason, so a stage can still be skipped silently in practice. Fix: add to S4
entry/exit a check that each S0–S3 stage has either its exit artifact or a
ROUND_LOG.md skip record.

DEF-B-24 [P2] pickup-mcp.md:Gate profile — G5 HOST is claimed "as-is" but the
text that follows is a reinterpretation ("Transport-latency numbers are
host-bound; conformance pass/fail is not exempt"), not the reference card's
contract (ambient/host reads + new unsafe declared in the same diff). Claiming
"as-is" while redefining the gate weakens the shared vocabulary. Fix: label
it "as-is, with type-specific parameters" and state which part is parameter
vs reinterpretation, or move the reinterpretation into a GATE-MCP-N analog.

DEF-B-25 [P2] pickup-workflow-orchestrators.md:Gate profile — Proposed
GATE-DW-4 (AGENT-REPLAY: record real agent-run histories, replay through the
determinism checker) overlaps shared GATE-005 acceptance criterion (4)
("agent-workflow replay covers the framework's own agent integrations where
they exist"), which applies to the `workflow-orchestrators` slug. Partial
duplication, and it is the gate-level symptom of the DEF-B-5 charter overlap.
Fix: resolve DEF-B-5 first; then keep GATE-DW-4 only for the engine-side
delta (history-format determinism checking) with GATE-005 declared
load-bearing.

---

## Checks with no finding

- G4/G10 CI-only gates treated as pre-commit: none of the four companions
  does this. G10 is correctly conditioned on Rust/unsafe in all four (AF:
  "N/A unless unsafe code is written"; MCP: "fires only for Rust
  implementations"; MAP: "applies only if the SUT is Rust"; WO: "applies for
  Rust implementations; advisory otherwise").
- Agent-frameworks G6/G11 handling is correct per the reference card
  (conditional N/A + GATE-AF4 as the recorded analog); multi-agent-protocols
  G6/G10/G11 advisory scoping is correct.
- GATE-AF2 (checkpoint backend parity), GATE-AF3 (judge/matrix
  anti-cherry-picking), GATE-AF4 (state-schema drift), GATE-DW-1/2/3 have no
  shared-gate duplicates.
- Playbook non-goals vs companions (lane f): no companion assumes
  implementation work beyond the playbook's authorized "starter-kit deltas"
  and the S5 "implementation may begin" handoff; no rewrite guidance for a
  specific type was found. The AF remote-lab note on paid judge models is
  consistent with the non-goal "each pickup's own CI defines its secrets".
- No orphan shared gates were verifiable within the four-type review set;
  GATE-008/009/011/012/013 apply to types outside this lane's assignment.
