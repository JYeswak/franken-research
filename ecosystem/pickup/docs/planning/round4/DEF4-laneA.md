# DEF4 — Lane A (constitution convergence), Round 4

Reviewer: S4 Round 4 Lane A. Fresh context; playbook v1.3 read end to end.
Scope: internal consistency only — no design re-litigation.

## Verdict: 0 × P0, 5 × P1, 7 × P2

No P0 found: no false normative claims, no fully unexecutable requirements,
no contradictions that block BEADS READY outright. Counts all verified
correct: 21 types / 21 companions / 21 `_evidence/<slug>.md` files; 18 shared
gates (registry holds 18 unique GATE-0NN IDs); 14 starter-kit gates;
13 bench slots; 12 forbidden patterns; ATLAS R7 = 8 fields; 5-tier Rulebook
collapse; max 3 S4 rounds. Referenced files all exist: `shared-gates.md`,
`_s0/g1-g14-reference.md`, `_s0/ecosystem-digest.md`,
`docs/planning/round3/INTEGRATION3.md`; the 21-type table matches
`ls pickup-*.md`.

## P1 — material gaps / inconsistencies

**P1-1. `reopen` grammar has no legal trigger for the mandated S4-exhaustion
return-to-S1.** Certify-or-abandon requires the integrator to "return to S1
with a `reopen` line" after the third S4 round without BEADS READY. But the
`reopen` line grammar restricts `trigger` to
`new-evidence|failed-audit|disputed-finding` — none describes S4 round
exhaustion. The required record cannot be written truthfully under the grammar.

**P1-2. Certify-or-abandon conflicts with the unconditional BEADS READY
attestations.** The escape hatch lets the integrator "record BEADS READY with
written reasons" after 3 failed rounds, but the certificate section says S5
may start only when a `cert` line carries "all of" the attestations, including
`polish=yes` and zero OPEN/DEFERRED P0/P1. The text never states which
steady-state conditions (polish? zero P0/P1?) written reasons may substitute
for — the two provisions disagree on whether BEADS READY without polish is
legal. (Companion gap: P1-1 — if the integrator instead returns to S1, there
is no valid trigger either.)

**P1-3. ROUND_LOG grammar prose does not define the bare lead-tag convention.**
The grammar section states records are "fields separated by ` | `, keys in
lowercase," but 9 of 11 record types lead with a bare untagged token
(`attest |`, `unk |`, `audit |`, `cert |`, `skip |`, `reopen |`, `kill |`,
`stage-artifact |`, `intake |`) while only `round=` and `def=` lines lead
with keyed fields. BEADS READY requires "the log parses against the grammar
above (schema-valid)" — schema-validity is underdetermined from the prose
alone. One sentence defining the lead record-type tag is missing.

**P1-4. BEADS READY cert checklist omits the bench-slot-13 precondition.**
Slot 13 requires a spend cap "*before BEADS READY*" and S5 exit blocks on
"`TBD` in any cost/provisioning requirement." But the certificate's
attestation list (log parses; zero OPEN/DEFERRED P0/P1; no BLOCKS_PLAN UNKs;
latest audit pass; S0–S3 artifact/skip records; polish=yes) contains no check
that slot-13 cost/provisioning fields are non-TBD. A cert can pass while the
spend cap is still TBD, contradicting the slot-13 requirement.

**P1-5. `skip` grammar range (S0..S5) exceeds defined skip semantics.**
`skip | stage=<S0..S5>` permits skipping S4 (all fresh-context review) or S5
(terminal steady state), while `stage-artifact` lines are capped at S0..S3 and
no section defines what a skipped S4/S5 means. A skipped S4 would contradict
S5 entry ("Entry: S4 exit") and the cert's round-line/polish attestations.
Either the skip range should be S0..S3 or skipping S4/S5 needs defined
semantics.

## P2 — wording / polish

**P2-1.** Header scope "Normative for all S2+ pickup artifacts" conflicts with
the file's own normative S0/S1 content (intake check, rider auto-fail,
evidence bar, S1 contradiction rule with S1-exit blocking). Scope is S0+ or
the S0/S1 sections are guidance — currently both.

**P2-2.** The UNK ledger scan ("every occurrence's disposition must agree")
names no performing role (auditor? lane A? integrator?) and no cert
attestation covers it.

**P2-3.** Reviewer remit says "a pointer to evidence that does not resolve is
a failed pointer," but reviewers "may inspect only files the companion
explicitly cites (not the live web at large)" — live-pointer resolvability is
only assigned to the evidence auditor (live GitHub API). Should state that
live-pointer checks are the auditor's remit, not the reviewers'.

**P2-4.** The cert claims attestations are "each checkable from the log," but
the `polish=yes` meaning includes the disjunct "the certifying round itself
produced no P0/P1 and changed only copy/format" — a diff judgment not
checkable from the log alone.

**P2-5.** Intake-line parenthetical is a fragment: "(written at S0 exit, one
per type; the S0 intake note path)" — presumably `evidence=` points at the
intake note path; unstated.

**P2-6.** "counted separately" in the S0 evidence bar is vacuous ("dataset,
reference, or adjacent repos are counted separately and do not satisfy the
bar") — no separate count exists anywhere.

**P2-7.** "authoring-process registries" (S5 certification-scope paragraph,
"`open_p0p1` count in the existing authoring-process registries") is undefined
— no such registry is defined in the playbook.

## What was checked

Full end-to-end read for: definition-vs-usage drift (namespaces, dispositions,
DEF statuses, gate vocabularies, tier mapping, short codes); gate-reference
consistency (G1–G14, GATE-001…018, universal-gate list, round-1 merges,
`GATE-007` security-gate pointer); stage entry/exit chains S0–S5; BEADS READY
exit conditions vs. the `cert` grammar vs. the attestation list; ROUND_LOG
grammar (all 11 record types) vs. described record types; count claims
(21/18/14/13/12/8/5/3); file-name references against the live tree; stale
provisions. Did not re-litigate design decisions (closed namespaces, rider
auto-fail, 3-round cap, universal-gate dispositions).
