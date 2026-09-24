# S4 Round 2 — Lane A findings (DEF2-laneA): cross-file consistency, playbook ↔ shared-gates.md

**Date:** 2026-09-23
**Reviewer:** Round 2 S4 reviewer, Lane A
**Scope:** `PROJECT-PICKUP-PLAYBOOK.md` ↔ `shared-gates.md`, cross-checked against
`_s0/g1-g14-reference.md` and `docs/planning/round1/INTEGRATION.md`.
**Method:** fresh read of both files end-to-end; grep-verified exact phrasings;
spot-checked 5 table gates (G1, G4, G8, G9, G14) plus 3 extra (G10, G12, G13).
No reviewed file was edited.

**Checks with no finding:**
- (c) T0–T3: `shared-gates.md` does not define T0–T3 at all (full-file read confirms);
  the playbook's mapping is the single definition. No drift.
- (b, marking): the G1–G14 table's non-normative marking ("for orientation only —
  the authoritative definitions are `_s0/g1-g14-reference.md` … in any conflict
  the reference governs") is present at the table (playbook lines 373–374); the
  only other citation (line 396, "The table above is the index") is consistent
  with it. `shared-gates.md` never cites the table.

**Counts:** P0: 0 · P1: 4 · P2: 11 · Total: 15

---

DEF2-A-1 [P1] shared-gates.md:7 vs shared-gates.md:21 — Direct self-contradiction
introduced by the round-1 retirement addition. Line 7: "the set only grows by
constitution amendment"; line 21: "The set does not only grow: a superseded gate
is retired by amendment naming the superseding gate." Both cannot be true.
Fix: change line 7 to "the set changes only by constitution amendment" (keep the
two-evidence-file requirement for new gates).

DEF2-A-2 [P1] shared-gates.md:21–27 (Gate retirement) — The round-1-added rule
states "Gate acceptance criteria are versioned (`GATE-001 v1`, `v2`, …); the
registry version and each gate's criteria version both appear in the gate's
header line," but zero of the 18 gate headers carry a criteria version (all are
bare "### GATE-NNN — <name>"; verified by grep). The registry violates its own
procedure on every gate. Fix: add criteria versions to all 18 gate headers
(e.g. "### GATE-001 v1 — …"), or amend the procedure to record criteria
versions in ROUND_LOG.md instead of header lines.

DEF2-A-3 [P1] shared-gates.md:27 vs PROJECT-PICKUP-PLAYBOOK.md (header +
Roles) — shared-gates.md asserts "Amendment authority is the parent orchestrator
per the playbook's Roles + review process section," but the playbook's Roles
section defines the parent orchestrator only as "the assignment authority for
the whole S0–S5 flow" (naming plan author, integrator, reviewers); it never
names an amendment approver. The playbook's constitution-amendment paragraph
requires only "an explicit approval naming the changed section" — approver
unnamed. The citation attributes an authority the playbook never grants.
Fix: name the amendment authority explicitly in the playbook's
constitution-amendment paragraph (e.g. "approved by the parent orchestrator"),
then keep the shared-gates.md citation.

DEF2-A-4 [P2] PROJECT-PICKUP-PLAYBOOK.md:Glossary (ATLAS BUILD_READY, ~line 623)
— Leftover passage of exactly the class round-1 was asked to eliminate: "Gates
come from G1–G14 + ATLAS BUILD_READY + the shared pickup gates, never from the
vendor technique catalog alone." It omits the type-local-gate (L2) clause that
the authoritative passage (lines 434–436) includes. Fix: append "+ type-local
gates (`GATE-<SLUG>-<NN>`) defined in the companion" to the glossary sentence.

DEF2-A-5 [P2] PROJECT-PICKUP-PLAYBOOK.md:113 (S3 exit) — "wire the G1–G14 profile
and the applicable GATE-* shared gates." The Namespaces section defines GATE-*
as covering *both* shared gates (`GATE-NNN`) and type-local gates
(`GATE-<SLUG>-<NN>`), so "GATE-* shared gates" is self-contradictory wording and
the sentence silently drops type-local gates from S3 wiring (L2 gates are
registered in the companion's gate profile per the hierarchy section, so they
should be wired here too). Fix: "wire the G1–G14 profile and the applicable
shared (`GATE-001`…`GATE-018`) and type-local (`GATE-<SLUG>-<NN>`) gates."

DEF2-A-6 [P2] PROJECT-PICKUP-PLAYBOOK.md (Gate hierarchy L0/L1/L2 + Glossary) —
ATLAS BUILD_READY is a named gate source ("gates come only from G1–G14 + ATLAS
BUILD_READY + …", lines 434–436; glossary: "cited alongside G1–G14 as a source
of gate discipline") but is placed nowhere in the L0/L1/L2 hierarchy — L0 covers
only "starter-kit G1–G14." Fix: add one line to the hierarchy section stating
ATLAS BUILD_READY sits alongside L0 as a cited build-discipline source (not a
registry gate), matching the glossary.

DEF2-A-7 [P1] PROJECT-PICKUP-PLAYBOOK.md (Normative language) vs shared-gates.md
(whole file) — The RFC 2119 declaration scopes normativity to "this playbook
and all `pickup-*.md` companions." `shared-gates.md` is not a `pickup-*.md`
file, and it contains zero uppercase MUST/SHOULD/MAY (grep-verified); its
binding rules ("Companions may not amend shared gates locally" line 18,
"acceptance criteria must be writable as PASS/FAIL/N-A" line 16, "a new gate
needs two independent evidence files") are lowercase and therefore technically
non-normative under the playbook's own rule. The registry's amendment and
retirement procedures are unenforceable as written. Fix: extend the
normative-language paragraph to cover `shared-gates.md` and normalize its
modals to uppercase (MUST / MUST NOT).

DEF2-A-8 [P2] PROJECT-PICKUP-PLAYBOOK.md:44 (Purpose, template-root convention)
— The example root `templates/rl-env/…` uses slug `rl-env`, but the registered
slug is `rl-envs` (21-type table line 80; short-code list line 185). A companion
author following the example would create the wrong root. Fix: change the
example to `templates/rl-envs/…`.

DEF2-A-9 [P2] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary table vs
`_s0/g1-g14-reference.md` — Spot-check: G1, G4, G8, G9, G14 match the reference
in substance (shortened, same meaning). Three residual deviations remain after
the round-1 alignment: (i) G13 table "No stubs/placeholders left in the tree"
vs reference "Stub markers (`unimplemented!`, `todo!`, …) in added lines
block" — scope mismatch (tree-wide vs added-lines), and it contradicts the
"canonical" operational definitions too; (ii) G10 table "non-Rust projects may
set N/A with reason" vs reference "`rust: false` skips for non-Rust projects"
(the operational def agrees with the reference: "may set `rust: false`");
(iii) G12 table omits the exemptions path ("exemptions via `exemptions.tsv`")
present in both reference and operational def. The non-normative marking
contains the drift, but G13's wording actively contradicts the authoritative
definitions. Fix: align the G10, G12, G13 rows to the reference wording
(mechanism `rust: false`; exemptions path; "specified stub markers in added
lines block").

DEF2-A-10 [P2] PROJECT-PICKUP-PLAYBOOK.md:518 (S4 exit) vs :540–541 and :580–582
— Exit criterion (3) says "zero open P0/P1 DEF-* records (P2s may carry forward
as beads)," but the DEF-statuses rule states "`DEFERRED` does not close P0/P1:
a deferred P0/P1 blocks BEADS READY exactly like an OPEN one," and the BEADS
READY certificate attests "zero `OPEN` and zero `DEFERRED` P0/P1 records."
Criterion (3) understates the bar a reader checking only the exit list would
apply. Fix: change (3) to "zero `OPEN` and zero `DEFERRED` P0/P1 DEF-* records
(P2s may carry forward as beads)."

DEF2-A-11 [P2] PROJECT-PICKUP-PLAYBOOK.md:580 (BEADS READY certificate) — The
certificate claims its attestations are "each checkable from the log," but the
ROUND_LOG grammar defines only round/def/skip/reopen lines: it has no UNK-*
line type, so "no `UNK-*` with disposition `BLOCKS_PLAN`" is not checkable from
the log (UNK rows live in companions), and it has no evidence-audit line, so
"evidence audit passed" leaves no log trace (auditor findings become DEF lines
only when they fail — a clean audit is invisible). Fix: add `unk` and `audit`
line types to the grammar (e.g. `audit | round=<N> | scope=<p0-pointers|sample>
| result=<pass|fail> | seed=<n>`), or change the claim to "checkable from the
log and the cited companion artifacts."

DEF2-A-12 [P2] PROJECT-PICKUP-PLAYBOOK.md:487–491 vs :548 (ROUND_LOG grammar) —
Independence must be "attested … and logged in `ROUND_LOG.md` *before* the
review begins," but the only line format carrying an `independence` field is
the round line, which also carries the post-review `verdict`. There is no
pre-review line type, so the "before the review begins" requirement is
unimplementable as written. Fix: add a pre-review attestation line, e.g.
`attest | round=<N> | reviewer=<name> |
independence=<authored:no,prior-review:no>`, written before review starts.

DEF2-A-13 [P2] PROJECT-PICKUP-PLAYBOOK.md:548 (round line grammar) — The round
line carries a single `reviewer=<name>` field, but full S4 rounds require
"2 or more" reviewers. The grammar cannot record multiple reviewers and their
independence attestations for one round. Fix: allow one round line per
reviewer per round number (verdict authoritative on the post-review line), or
permit comma-separated `reviewer`/`independence` lists.

DEF2-A-14 [P2] PROJECT-PICKUP-PLAYBOOK.md:473–476 vs :497 (Roles) — The parent
orchestrator "Names the plan author, the integrator, and the reviewers per
round"; the evidence auditor — a defined role with blocking power (failed
pointer "blocks BEADS READY until resolved") — is not in the naming list, so
the auditor's assignment authority is unspecified. Fix: add the evidence
auditor to the parent orchestrator's naming list.

DEF2-A-15 [P2] PROJECT-PICKUP-PLAYBOOK.md:490–492 (Roles, dispute recourse) —
"A disputed P0/P1 goes to another independent reviewer; an unresolved P0 stays
OPEN and blocks BEADS READY." No terminal rule states whose verdict closes the
dispute (the second reviewer's opinion vs the integrator's formal
reject-with-rationale), so dispute recourse dead-ends at "another reviewer"
with no defined closer. Fix: state that the second independent reviewer's
verdict is binding on the DEF's status, applied/recorded by the integrator.

---

## Notes for the integrator

- Spot-check detail for DEF2-A-9: the five clean gates — G1 (declared in
  `kit-oracle.yml`), G4 (CI-only harness, `.git`-less staged-tree copy), G8
  (declared AND evidenced via `kit-rulebook.yml`), G9 (positive loop bound,
  no unresolved structured IOUs), G14 (rejection evidence in
  `kit-rejections.tsv`) — all match the reference in substance.
- The remaining round-1 DEFs recorded FIXED in INTEGRATION.md were not
  re-litigated; DEF2-A-9 is framed as a *residual* deviation in the current
  text (G13 scope wording vs the "canonical" operational definitions), not a
  reopen of DEF-A-1.
- `_s0/ecosystem-digest.md` exists (A-Z Playbook path `_s0/ecosystem-digest.md`
  step 22 verified on disk); R7, RFC 2119, and A-Z Playbook path are each
  defined once and used consistently.
