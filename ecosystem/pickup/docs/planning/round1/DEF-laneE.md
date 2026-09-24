# Round 1 — Lane E: Operations/Release findings (fresh-context S4 reviewer)

Reviewer: Lane E (operations/release). Reviewed cold; these files were not seen before this round.
Date: 2026-09-23.

## Files reviewed

- `PROJECT-PICKUP-PLAYBOOK.md` (constitution)
- `shared-gates.md` (GATE-001…GATE-018 registry)
- `_s0/g1-g14-reference.md` (authoritative G1–G14 definitions)
- `pickup-observability.md`, `pickup-guardrails.md`, `pickup-fine-tuning.md` (companions)

## Summary verdict

The starter-kit deltas are largely concrete (named files, template shapes, gate IDs) —
not aspirations. The failures are operational: (1) the playbook names four roles
but gives no mechanism for staffing them, so S4 review rounds cannot be executed
as written; (2) the S5 steady-state criteria are not mechanically checkable
(no DEF-* status field, no ROUND_LOG/BEADS READY certificate schema, and
"last diff POLISH" is pure judgment); (3) the companions mandate scheduled/GPU
CI tiers without a required provisioning/funding slot; (4) the evidence-auditor
role is named but its cadence, scope sampling rule, and failure disposition are
unspecified; (5) the gate registry has an addition rule but no retirement path;
(6) the companions redefine the playbook's T0–T3 tier mapping despite the
playbook saying the mapping is "stated in every companion file"; (7) the
playbook's G1–G14 summary table contradicts the `_s0/g1-g14-reference.md` it
coexists with.

## Findings

DEF-E-1 [P0] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — Roles are named
with duties (plan author, ≥2 fresh-context reviewers, integrator, evidence
auditor) but there is no staffing mechanism: no assignment authority, no rule
for sourcing "independent, no prior context" reviewers, and no way to verify
independence. A plan author cannot comply with "run S4 rounds to steady state"
without knowing how reviewers are obtained; the core quality mechanism
(adversarial review) is therefore unexecutable as written. Fix: add a staffing
rule — e.g. the parent orchestrator assigns author/integrator/auditor; a
reviewer is ineligible if they authored or previously drafted this companion
file; reviewer identities and independence attestations are logged in
`docs/planning/ROUND_LOG.md` before the first round begins.

DEF-E-2 [P1] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — DEF-* records
specify severity, location, challenged claim, and required fix (or rejection
reason), but there is no status field (OPEN / APPLIED / FORMALLY-REJECTED)
and no ID-minting scheme (DEF-<slug>-<n> vs bare DEF-E-<n>). The S4/S5 exit
criterion "zero open P0/P1" therefore cannot be mechanically computed — there
is no defined notion of "open". Fix: add a mandatory status field to every
DEF-* record, a per-type ID minting rule, and require the DEF log to be a
status-bearing table in `docs/planning/ROUND_LOG.md`.

DEF-E-3 [P1] PROJECT-PICKUP-PLAYBOOK.md:S4 rounds run to steady state —
The BEADS READY verdict, the DEF log, and the stage-skip log all live in
`docs/planning/ROUND_LOG.md`, and S5 exits on a "BEADS READY certificate",
but no schema or certificate format is specified anywhere. The steady state
is not mechanically checkable without a normative log format. Fix: publish
the ROUND_LOG.md schema (stage verdicts, DEF-* status table, UNK-*
dispositions, reopen entries) and a BEADS READY certificate template; make a
missing or schema-invalid certificate a P0 gate failure at S5.

DEF-E-4 [P1] PROJECT-PICKUP-PLAYBOOK.md:S4 rounds run to steady state —
"last diff POLISH — the final review round changed wording, not substance" is
pure judgment: "substance" is undefined and no arbiter is named. Two
reasonable actors can disagree forever, and there is no mechanical way to
verify the claim. Fix: define substance operationally (edits to claims,
gates, acceptance criteria, or thresholds = substantive; copy/edits
elsewhere = polish) and name the arbiter (the integrator, attested in the
ROUND_LOG), or replace with a mechanical rule (e.g. final round diff touches
no gated artifact listed in the certificate template).

DEF-E-5 [P1] shared-gates.md:Amendment rule — The registry specifies how a
gate is added (two independent evidence files, companion-field listing,
PASS/FAIL/N-A criteria) but has no retirement/deprecation path and no
criteria versioning: "the set only grows" means superseded gates accumulate
forever. It also says "the set only grows by constitution amendment," which
conflicts with the standalone three-item amendment recipe immediately below
(which recipe governs is unstated), and the constitution-amendment procedure
itself is not defined in the playbook. Fix: add a gate-retirement rule
(supersede via amendment with the superseding gate named; IDs stay stable,
deprecated gates marked RETIRED with a removal-of-force date), version gate
acceptance criteria (GATE-001 v1, v2), and define the amendment authority and
procedure in the playbook.

DEF-E-6 [P1] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — The evidence
auditor "spot-checks 2–3 file pointers per type against the live GitHub API"
but cadence (which stage? every S4 round? once before S5?), the sampling
rule (which 2–3 pointers, random or risk-based?), and the failure disposition
(what happens on a 404 beyond "dropped, never guessed" — DEF? gate FAIL?
re-open S2?) are all unspecified. Fix: require an auditor pass as an S4
exit criterion with a defined scope (e.g. all oracle file pointers plus a
random sample of claim pointers), a per-round or per-stage cadence, and a
mismatch disposition (each dropped pointer logged with a DEF-* and its
dependent claims demoted).

DEF-E-7 [P1] pickup-observability.md:Gate profile / pickup-fine-tuning.md:Gate profile —
The companions mandate expensive CI tiers — GATE-OBS-INGEST (scheduled
ingestion-load on a live local stack: 100k traces × 1 span, 250k spans, 1 GB
payloads), GATE-FT-01..04 gated GPU e2e, nightly GPU regression — without any
required companion slot for CI provisioning or funding. The playbook's slot
list (charter, oracles, claim registry, gate profile, bench shape,
starter-kit deltas) has no CI-provisioning slot, and the playbook punts with
"any gate needing credentials or a live browser is the pickup's own CI's
problem to define and fund" — but no S2/S3/S5 artifact requires the funding
to actually be defined. A pickup can reach BEADS READY with mandated GPU
tiers and no owner, runner class, or budget. The companions do respect the
per-PR vs nightly split (fine-tuning REQ-01/CLAIM-01/11, GATE-012; GATE-015
evidence), but none names who provisions the GPU. Fix: add a required
companion slot "CI provisioning + cost ownership" (runner class and host,
schedule, monthly budget or spend cap, owning account) and make its
completion an S3 exit input; where a cost-avoidance tactic is cited
(e.g. fine-tuning CLAIM-07 Kaggle T4, already flagged UNK-05) it must be
resolved, not left unknown, before S5.

DEF-E-8 [P1] pickup-guardrails.md:Initial claims / Evidence tiers and
pickup-observability.md:Initial claims — The playbook mandates the pickup
tier mapping (T0=[Verified], T1=[CI-observed], T2=[Maintainer claim]/
[External], T3=[Inference]) and says "the mapping below is stated in every
companion file." Neither companion states it: guardrails redefines the CLAIM
table key as T0 vendor-shipped / T1 independent / T2 self-reported / T3
aspirational, observability redefines T0 vendor / T1 independent / T2
self-reported / T3 aspirational, and guardrails' own Evidence tiers section
then redefines T0 again as "measured against pinned truth pack
(vendor-grade)" — internally inconsistent with its own claim table. Tier is
the load-bearing field for G8/G14 gating, so this breaks claim-discipline
machinery. Fix: enforce the playbook mapping in all companions (or amend the
playbook), and add a cross-check item to the S4 review: every CLAIM row's
tier must parse against the playbook table.

DEF-E-9 [P1] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — No
separation-of-duties rule: nothing bars the plan author from also serving as
integrator (applying or rejecting DEF-* findings against their own plan) or
as a "fresh-context" reviewer, collapsing the adversarial structure the
process depends on. There is also no recourse when the integrator formally
rejects a P0. Fix: bar the plan author from integrator and reviewer roles on
their own companion; require that a formally rejected P0/P1 be re-offered to
a second independent reviewer, with the disagreement recorded in
ROUND_LOG.md before it can stand as rejected.

DEF-E-10 [P1] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary vs
_s0/g1-g14-reference.md — The playbook's G1–G14 table (normative for S2+
artifacts) contradicts the reference file the S0 wave was told to cite
exactly. Examples: playbook G6 "Unsafe work routes through the exorcist's
classification operators" vs reference G6 "// SAFETY: comment per new unsafe
site + tree-wide unsafe inventory"; playbook G9 "Structured IOUs only,
bounded, zero unresolved at close" vs reference G9 "positive round bound in
kit-loops.yml"; playbook G12 "Audit loop: class-fix followed by instance
re-audit" vs reference G12 "fix-class eradications declared in
kit-audits/*.audit"; playbook G14 "claims violating their Rulebook-tier
evidential burden are rejected" vs reference G14 "rejection evidence in
kit-rejections.tsv". Companions already diverge on which source they cite
(observability cites the playbook's one-liners; fine-tuning cites
`_s0/ecosystem-digest.md`; guardrails had to infer — UNK-GR-01). Fix: state
precedence explicitly, align the two documents, and require companions in
flight to re-verify their G1–G14 profiles against the single canonical text.

DEF-E-11 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — "Reopen is a
first-class transition, not a failure — re-entry re-verifies pin + date."
No procedure: who may reopen, which artifacts are invalidated, whether DEF-*
re-log is required, and how the BEADS READY certificate is revoked are all
unstated. Fix: define the reopen procedure (who may trigger, which stages
re-run, certificate revocation recorded in ROUND_LOG.md).

DEF-E-12 [P2] pickup-observability.md:Starter-kit deltas — Delta 5
("Spec-diff CI check") cites "(O9 shape)" but this companion's oracle
inventory is O1–O6; O9 does not exist here (the intended pointer is
CLAIM-OBS-009, the langfuse sdk-api-spec CI). Dangling pointer in a file
that is supposed to model the process. Fix: correct to CLAIM-OBS-009.

DEF-E-13 [P2] pickup-guardrails.md:Starter-kit deltas — The corpus-export
tooling delta ("stamps source_sha256 + judge weight rev + converter version
into exported artifacts (origin binding, moving toward hash-chained)") is
aspirational, not a buildable addition: no tool name, input/output contract,
or acceptance test is given. The other seven deltas in this file are concrete
(file paths, gate IDs, test scaffolds). Fix: either specify the export tool
(script path, inputs, stamped fields, verification step) or move this item
out of starter-kit deltas into UNK-*.

DEF-E-14 [P2] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — The
evidence auditor's reporting line is unspecified: findings go to the
integrator? the plan author? where are they recorded? A 404 found by the
auditor and a 404 found by a reviewer should land in the same place.
Fix: state that auditor results are logged as DEF-* records in
docs/planning/ROUND_LOG.md and routed to the integrator.

DEF-E-15 [P2] PROJECT-PICKUP-PLAYBOOK.md:S4 rounds run to steady state —
S4 rounds have no bound, SLA, or deadlock rule beyond integrator fiat: rounds
"run to steady state" with no maximum rounds or calendar cap, so a
pathological type can stall indefinitely. Fix: cap S4 (e.g. max 3 rounds;
thereafter the integrator must certify-or-kill with written reasons in
ROUND_LOG.md).
