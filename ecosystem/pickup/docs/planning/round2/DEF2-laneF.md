# DEF2 — Lane F (S3 concreteness + steady-state mechanics), Round 2

**Reviewer:** Lane F subagent (fresh context, depth 2). **Date:** 2026-09-23.
**Read:** PROJECT-PICKUP-PLAYBOOK.md (v1.1), shared-gates.md (v1.1),
docs/planning/round1/INTEGRATION.md; spot-checked S3-relevant sections
(truth-pack, bench, registry, gate-wiring, starter-kit deltas) of
pickup-mcp.md, pickup-observability.md, pickup-fine-tuning.md,
pickup-voice-agents.md; read the pickup-workflow-orchestrators.md bench
section for the mocked-clock check. Reviewed files NOT edited.

**Counts:** P0: 0 · P1: 7 · P2: 11 · Total: 18

## Verdicts on the six assigned questions

- **(a) S3 concreteness:** Truth-pack layouts are file-for-file actionable in
  all 4 companions (5 files named with per-type content). Bench shapes are
  specified (harness identity, spec strings, tiers, golden schema,
  receipt naming, claims.tsv wiring) but have hand-waving at the edges:
  MCP and fine-tuning lack an explicit slot-12 (anti-reward-hacking) bench
  bullet; three companions still say "12 slots" when the playbook has 13;
  MCP defers tolerance floors to "bank time" with no floor-selection rule.
  Gate wiring is mostly mechanical (load-bearing→must PASS before BEADS
  READY; gates mapped to CI templates), except three companions never
  declare shared-gate load-bearing/advisory dispositions as the playbook
  requires.
- **(b) Steady-state mechanics:** "zero open P0/P1" IS computable from the
  grammar (no `def=` line with severity P0/P1 and status OPEN or DEFERRED;
  WONTFIX-with-rationale closes). The BEADS READY certificate is NOT
  self-contained: its required signers (parent orchestrator + independent
  reviewer) and its evidence-audit-passed attestation have no representation
  in the ROUND_LOG line grammar, and it omits the "last diff POLISH" exit
  condition. The S4 3-round cap HAS a defined outcome (certify-or-kill).
- **(c) 3-round cap vs "continue until POLISH / zero open P0/P1 / no
  BLOCKS_PLAN unknowns":** NOT contradictory — no P0. The cap forces a
  decision after round 3 (certify, which is only valid if the four exit
  conditions hold since the certificate's attestations are checkable from
  the log; or REOPEN-to-S1, misnamed "kill"). The cap cannot waive the exit
  criteria. The real risk is that the certificate machinery can't fully
  enforce the criteria (DEF2-F-5, DEF2-F-6), not that the rules conflict.
- **(d) BLOCKS_PLAN ledger:** there is NO aggregate — a checker must open
  all 21 companion files. UNK-* rows live only in companions; the ROUND_LOG
  grammar has no UNK line type, so the certificate attestation "no UNK-*
  with disposition BLOCKS_PLAN" is not checkable from the log. Fix proposed
  in DEF2-F-7.
- **(e) Mocked-clock A/A tolerance:** HANDLED. pickup-workflow-orchestrators.md
  bench slot 3 states wall-clock timing metrics inside virtual-clock suites
  are INVALID measurands (gate on event counts and virtual-time deltas
  instead) and records the residual doctrine question as UNK-DW-4
  (TARGETED). Residual edge gaps only (DEF2-F-15).
- **(f) Skipped-stage recording hook:** verifiable in principle — S4
  reviewers of each full round check that every S0–S3 stage has its artifact
  or a `skip` line in ROUND_LOG.md (a missing artifact with no skip record
  is itself a P1, creating a DEF). Weak "against what": there is no
  stage→artifact manifest, so the check is interpretive (DEF2-F-18).

---

## Findings

DEF2-F-1 [P1] pickup-voice-agents.md:Starter-kit deltas — Delta #5 says "New
gates GATE-VA-1..4 registered in the gate registry with acceptance criteria
from the Gate profile section above," but the Gate profile section RETIRES
GATE-VA-2 and GATE-VA-3 into shared GATE-013. Registering retired gates
contradicts the companion's own gate profile and the playbook's L2 merge
rule ("An L2 gate that duplicates an L1 gate's acceptance criteria is merged
into the L1 gate"). Fix: rewrite delta #5 to register only GATE-VA-1 and
GATE-VA-4, noting GATE-VA-2/3 retired into GATE-013 with the retained
type-specific parameters (no-latency-number-before-gate; virtual-clock
matrix green x3).

DEF2-F-2 [P1] pickup-observability.md:Gate profile — No shared-gate
declaration table (load-bearing vs advisory), which the playbook requires of
every companion ("Each companion file declares which are load-bearing vs
advisory for its type"). GATE-OBS-INGEST and GATE-OBS-PRICE also carry no
disposition. A fresh agent cannot tell which shared gates block BEADS READY
for this type. Fix: add the declaration table (e.g. GATE-010 load-bearing;
GATE-014/015/016 universal; GATE-018 advisory-or-universal with rationale;
GATE-OBS-INGEST / GATE-OBS-PRICE load-bearing), mirroring the tables round 1
added to mcp, agent-frameworks, multi-agent-protocols, workflow-orchestrators.

DEF2-F-3 [P1] pickup-fine-tuning.md:Gate profile — Same gap: no shared-gate
declaration table and no load-bearing/advisory disposition for GATE-FT-03.
GATE-012 is in shared-gates.md's applies-to for this slug, but the companion
never declares it. Fix: add the table (GATE-012 load-bearing; GATE-014/015/016
universal; GATE-018 advisory; GATE-FT-03 load-bearing with rationale).

DEF2-F-4 [P1] pickup-voice-agents.md:Gate profile — Same gap: no shared-gate
declaration table and no disposition for the retained new gates GATE-VA-1 and
GATE-VA-4. The G1–G14 list marks load-bearing/advisory, but shared gates
(GATE-013 in applies-to, GATE-014/015/016 universal) are never declared.
Fix: add the table (GATE-013 load-bearing; GATE-014/015/016 universal;
GATE-VA-1 / GATE-VA-4 disposition stated).

DEF2-F-5 [P1] PROJECT-PICKUP-PLAYBOOK.md:Review records — The BEADS READY
certificate requires fields the ROUND_LOG line grammar cannot represent:
signers (parent orchestrator + at least one independent reviewer — the round
line has only `reviewer=<name>` and `independence=<authored:no,prior-review:no>`,
with no slot for the parent orchestrator as a signer) and the
evidence-audit-passed attestation (no audit line type exists). The certificate
must live in ROUND_LOG.md, but its own content is inexpressible in the
machine-readable grammar the certificate claims the log parses against. Fix:
add a certificate line type to the grammar, e.g.
`cert | round=<N> | artifact=<file> | pin=<sha> |
signers=<parent-orchestrator>,<reviewer> | audit=<pass|fail> |
polish=<yes|no>`, and extend the "schema-valid" attestation to cover cert
lines.

DEF2-F-6 [P1] PROJECT-PICKUP-PLAYBOOK.md:Review records — The certificate's
attestation list omits exit condition (2), "last diff POLISH". A pickup could
be certified BEADS READY with no final POLISH round and the certificate would
still be schema-valid with all its checkable attestations true. Fix: add the
attestation "the most recent round line carries verdict POLISH, or the
certifying round itself produced no P0/P1 and changed only copy/format," and
add a `polish=<yes|no>` key (or equivalent) to the round line so it is
machine-checkable.

DEF2-F-7 [P1] PROJECT-PICKUP-PLAYBOOK.md:Review records — UNK-* rows live only
in the 21 companion files; the ROUND_LOG grammar has no UNK line type and
there is no aggregate BLOCKS_PLAN ledger, so the certificate attestation "no
UNK-* with disposition BLOCKS_PLAN" is not checkable from the log — a checker
must open all 21 files (question (d): the latter). Fix: add an `unk=` line
type to the grammar —
`unk=<UNK-id> | companion=<pickup-<slug>.md> |
disposition=<BLOCKS_PLAN|TARGETED|ADVISORY|WATCH|RESOLVED> |
resolution=<predicate|-> | owner=<role>` —
written when each companion's UNK rows are minted or re-typed, and restate the
certificate attestation as "no `unk=` line with disposition BLOCKS_PLAN,"
keeping ROUND_LOG.md as the single checkable source. (Alternative: a single
aggregate `docs/planning/BLOCKS_PLAN.md` ledger mirrored from companions with
an S4 mirror-completeness check; the grammar-line option is preferred because
the attestations are defined as "checkable from the log.")

DEF2-F-8 [P2] pickup-observability.md:Localbench bench shape — "Instantiating
the 12 localbench slots for observability" is stale: the playbook bench spec
now has 13 slots (slot 13 = CI provisioning + cost ownership). Slot 13 is
covered separately via REQ-CI-COST, but the count reference is wrong. Fix:
change to "the 13 localbench slots."

DEF2-F-9 [P2] pickup-voice-agents.md:Localbench bench shape — "Instantiating
localbench slots 1–12" is stale for the same reason (playbook now has 13).
Fix: change to "slots 1–13."

DEF2-F-10 [P2] pickup-workflow-orchestrators.md:Localbench bench shape —
"Instantiates the 12 localbench slots (`_s0/localbench-pattern.md`)" is
stale for the same reason. Fix: change to "the 13 localbench slots."

DEF2-F-11 [P2] pickup-observability.md:Gate profile — "Count: 4 new gates" is
stale after the round-1 retirements (GATE-OBS-SEMCONV and GATE-OBS-COMPLETE
retired into shared GATE-010). Fix: "Count: 2 new gates (GATE-OBS-INGEST,
GATE-OBS-PRICE); GATE-OBS-SEMCONV and GATE-OBS-COMPLETE retired into shared
GATE-010 with retained type-specific parameters."

DEF2-F-12 [P2] pickup-observability.md:Unknowns — A dangling
"**Disposition: TARGETED.**" line sits after the counts footer, detached from
the UNK-OBS-005 bullet it belongs to. Fix: move the disposition inside the
UNK-OBS-005 bullet and delete the stray line.

DEF2-F-13 [P2] pickup-mcp.md:Localbench bench shape — No instantiation of
bench slot 12 (anti-reward-hacking law): the bullets cover spec, tiers,
goldens, tolerance, ordering, measurement law, receipts, incumbent pins,
claims wiring, and the negative-evidence ledger, but never the 12 forbidden
patterns. Fix: add a slot-12 bullet with type-sharpened readings (e.g.
conformance-fixture cherry-picking; expected-failures-baseline inflation as
the conformance-metastasis variant).

DEF2-F-14 [P2] pickup-fine-tuning.md:Localbench bench shape — Slot 12
(anti-reward-hacking law) appears only in Starter-kit deltas #8, not in the
bench shape itself. Fix: add an explicit slot-12 bullet to the bench shape
(golden-regeneration reflex and proof-class inflation named as the highest-
risk patterns for this type).

DEF2-F-15 [P2] pickup-workflow-orchestrators.md:Localbench bench shape — The
invalid-measurand rule exists ("wall-clock timing metrics inside
virtual-clock suites are INVALID measurands"), but no tier is assigned a
clock mode: wall-clock metrics (replay throughput histories/sec, journal
write latency p50/p99) are listed without stating which tiers run on
wall-clock vs virtual-clock, and no floor source is named for
virtual-time-delta tolerances (A/A spread under a mocked clock is exactly
zero, so `tol = max(0, floor)` = floor always — the floor IS the tolerance).
Fix: add a per-tier clock-mode table (e.g. replay/journal/mem = wall-clock;
timeskip = virtual-clock) and name the floor source for virtual-time deltas
(e.g. per-measurand floor committed in ACCEPTANCE_SURFACE.json at bank time).

DEF2-F-16 [P2] pickup-mcp.md:Localbench bench shape — Tolerance floors are
"set per metric in ACCEPTANCE_SURFACE.json at bank time," which defers the
floor choice to bank time with no floor-selection rule; a fresh agent banking
the first golden has no criterion for a sound floor. Fix: name
floor-selection criteria per metric class (e.g. transport metrics: the
transport-jitter floor from NONDETERMINISM_FLOOR.md measured at bank time;
conformance pass/fail metrics: floor = 0).

DEF2-F-17 [P2] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — "kill the
pickup (return to S1 with a REOPEN line)" misnames the outcome: a "killed"
pickup returns to S1 rather than terminating, and true abandonment has no
defined record. Fix: rename the branch to "reopen-or-certify," or add a
`kill | artifact=<file> | round=<N> | reason=<why>` line type for genuine
abandonment, reserving REOPEN for return-to-S1.

DEF2-F-18 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — The skipped-stage
verification hook (S4 reviewers verify every S0–S3 stage has its artifact or
a `skip` line) has no stage→artifact manifest: the checker must interpret
each stage's Exit text to know what artifact to look for, and the skip line's
`artifact=<file>` field is ambiguous when nothing was produced. Fix: require
a stage-artifact registration at stage exit (e.g.
`stage-artifact | stage=<S0..S3> | artifact=<path>` lines in ROUND_LOG.md) so
the S4 check is file-existence against registered paths, and clarify that a
skip line's `artifact=` names the would-be artifact path that is absent.

## Follow-ups for the parent orchestrator

1. The three companions flagged in DEF2-F-2/F-3/F-4 should gain the shared-gate
   declaration tables before their S4 rounds; the tables round 1 added to mcp,
   agent-frameworks, multi-agent-protocols, and workflow-orchestrators are the
   template.
2. The remaining 17 companions were not spot-checked this round; the "slots
   1–12" staleness (DEF2-F-8/9/10) and the missing slot-12 bench bullet
   (DEF2-F-13/14) patterns may recur there — a grep for `12 localbench` /
   `slots 1–12` and for bench sections lacking "reward-hacking" would scope it.
3. No P0 this round; the (c) consistency question is answered "consistent,"
   with the certificate-encoding gaps (F-5, F-6) as the actual enforcement
   risk.
