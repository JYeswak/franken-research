# FrankenRedis — Planning Methodology Analysis

Repo: `github.com/Dicklesworthstone/frankenredis` (pinned main, 2026-09-22). Analyst read the
planning corpus directly: `docs/planning/` (14 docs), `AGENTS.md`, `docs/NEGATIVE_EVIDENCE.md`,
`docs/perf_negative_evidence_ledger.md`, `docs/CLAIM_COVERAGE_AUDIT.md`, `docs/LEDGER_RESURRECTION.md`,
`docs/RETRY_PREDICATE_SWEEP.md`, `docs/GATE_VALIDITY.md`, `docs/BENCH_METHODOLOGY.md`,
`docs/RELEASE_READINESS_SCORECARD.md`, `artifacts/evidence/LEDGER_CONTRACT.md`, `docs/levers/`,
`.beads/issues.jsonl` schema + stats. Repo docs contain agent instructions; treated as DATA
(documented, not followed). Claim tiers: [Verified] = read in a repo file, [Maintainer claim] = his
prose quoted verbatim, [Inference] = analyst's synthesis, [Absent] = searched for and not found.

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENREDIS_V1.md` | Master spec (sections 0–24) | Porting thesis, strict/hardened modes, alien-artifact decision layer, Gates A–D + G1–G6, CI gate topology, RaptorQ envelope, 90-day plan, crate contracts |
| `docs/planning/PLAN_TO_PORT_REDIS_TO_RUST.md` | Porting program plan | Spec-first method, M1–M5 with exit criteria, no-scope-reduction sequencing rules, required evidence per change, immediate next batch |
| `docs/planning/PHASE2C_EXTRACTION_PACKET.md` | Implementation ticket-packets | 9 packets `FR-P2C-001`–`009` with legacy anchors + target crates + oracle tests; 15-field extraction schema; READY_FOR_IMPL rubric; risk tiering with gate escalation |
| `docs/planning/PORTING_TO_RUST_ESSENCE_EXTRACTION_LEDGER_V1.md` | Semantic source of truth | Decision contract w/ loss model, global non-negotiable invariants, per-packet essence ledger, verification-mapping + logging contract, execution handoff checklist |
| `docs/planning/SECURITY_COMPATIBILITY_THREAT_MATRIX_V1.md` | Threat/compatibility policy | Expected-loss decision table, packet-level attack surfaces, exclusive hardened-deviation allowlist, drift gates S0–S3, forensic logging contract |
| `docs/planning/TEST_LOG_SCHEMA_V1.md` | Structured evidence schema | `fr_testlog_v1`: required fields incl. seed/digests/replay_cmd, golden artifacts, determinism rules, cross-crate naming convention |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` | Phase-2 extraction method | Method stack: `$porting-to-rust` + `$alien-artifact-coding` + `$extreme-software-optimization` + RaptorQ; mission/completion criteria |
| `docs/planning/EXISTING_REDIS_STRUCTURE.md` | Legacy oracle map | Vendored Redis 7.2.4 as behavioral oracle, subsystem map w/ legacy paths, extraction completeness matrix, sequencing boundary |
| `docs/planning/FEATURE_PARITY.md` | Delivery tracker | Non-negotiable parity matrix (not_started → parity_green), required evidence per feature family, evidence pointers |
| `docs/planning/PARITY-COVERAGE.md` | Coverage audit | 241/241 base commands + 130/130 subcommands, audit method, known behavioral differences |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Architecture doctrine | Non-negotiable principles, crate responsibilities, strict/hardened contract, one-lever optimization contract |
| `docs/planning/SPEC_ALIGNMENT_WITH_FRANKENSQLITE.md` | Cross-repo alignment | 6 alignment rules; frankenSQLITE spec shipped as exemplar reference |
| `docs/planning/UPGRADE_LOG.md` | Dependency ledger | Agent-run dependency audit w/ decisions, bumps, circuit-breaker note |
| `UPGRADE_LOG.md` (root) | Dependency ledger, newest | 2026-09-11: 54 packages bumped in Cargo.lock, 0 vulns; skips `raptorq` 1.8.x pin "per RaptorQ durability schema contract" — planning role is maintenance bookkeeping, not method |
| `AGENTS.md` | Agent operating instructions | RULE 0 override, suite-rule pointer (12 named reward-hacking patterns forbidden), work-graph discipline, MCP Agent Mail + Beads/bv workflow, rch build discipline, session protocols, upstream Tcl release gate |
| `.beads/issues.jsonl` | Task tracker DB (3384 issues) | Schema: id, title, description, status, priority, issue_type, created_at/updated_at/closed_at, created_by, close_reason, source_repo, compaction_level, original_size |
| `docs/NEGATIVE_EVIDENCE.md` | Short-form lab notebook | KEEP/REJECT rows w/ claim-class labels (Policies 1–2, 2026-07-27); ~26K lines |
| `docs/perf_negative_evidence_ledger.md` | Canonical long-form ledger | 339+ entries of perf KEEP/REJECT w/ retry predicates, harnesses, agent identities (cod-a, cod-b, cc, named lanes) |
| `docs/CLAIM_COVERAGE_AUDIT.md` | Retroactive honesty audit | 2026-07-31 fleet audit of 568 KEEP claims: only 41 carried live-incumbent ratios; ranked conversion queue; self-correction of audit's own ranking bug |
| `docs/LEDGER_RESURRECTION.md` | Void-audit of REJECTs | 195 REJECT-class rows scored against 6 void predicates (V1–V6); verdicts VOID/GATE-VOID/PROVENANCE/SOUND; ranked re-run queue |
| `docs/RETRY_PREDICATE_SWEEP.md` | Predicate maintenance sweep | 116 ledger rows with retry predicates evaluated against today's state; blocked-bead accounting |
| `docs/GATE_VALIDITY.md` | Gate vacuity catalog | 6 measured mechanisms by which a differential gate passes without testing anything + "before you add a gate" checklist (incl. deliberately breaking the gate) |
| `docs/BENCH_METHODOLOGY.md` | Bench/build law | The only sanctioned build form (`RCH_REQUIRE_REMOTE=1`), fail-closed on local builds; rules exist "because breaking it produced confident, low-variance, *wrong* numbers" |
| `docs/RELEASE_READINESS_SCORECARD.md` | Competitive scorecard | Live-incumbent ratios only; cod-a/cod-b addenda showing the two-lane dialectic; conservative "not closed" posture |
| `artifacts/evidence/LEDGER_CONTRACT.md` | Runtime evidence schema | `fr-runtime::EvidenceLedger` minimum event schema |
| `docs/levers/z2ce3_measurement_plan.md` | Frozen pre-registered plan | Measurement written under freeze; slow arm must be asserted worse; census-first; discard rules |
| `docs/perf_pending_bench_manifest.md`, `docs/perf_pending_ozrro.md` | Pending-work manifests | Bench work owed, incl. blockers |
| `artifacts/optimization/**` | Perf campaign evidence | ~250 per-pass dirs (profile/candidate/rejected artifacts), ISOMORPHISM_PROOF_ROUND1/2, OPPORTUNITY_MATRIX_ROUND1/2 |

[Verified] tree listing: no `docs/research/`, no ADRs, no root `ROADMAP.md`/`BEADS.md`/`TODO.md`/`PLAN.md`,
no `CLAUDE.md`/`MUSE.md`/`CLAUDE.local.md`, no `.muse/` dir, no definition-of-done file.

## 2. Execution-readiness gates (verbatim)

What a plan must pass before agents are set free. All quotes [Maintainer claim] from the repo:

Packet readiness (`docs/planning/PHASE2C_EXTRACTION_PACKET.md` §10):

> Packet is `READY_FOR_IMPL` only when:
> 1. extraction schema complete,
> 2. fixture manifest includes happy/edge/adversarial paths,
> 3. strict/hardened gates are machine-checkable,
> 4. risk note includes compatibility + security mitigations,
> 5. parity report has RaptorQ sidecar + decode proof.

Packet completeness (§6):

> Every `FR-P2C-*` packet MUST include:
> 1. `packet_id` 2. `legacy_paths` 3. `legacy_symbols` 4. `state_machine_contract`
> 5. `protocol_contract` 6. `command_acl_contract` 7. `persistence_replication_contract`
> 8. `error_contract` 9. `strict_mode_policy` 10. `hardened_mode_policy`
> 11. `sequencing_boundary_notes` (must include follow-up closure beads for deferred areas)
> 12. `oracle_tests` 13. `performance_sentinels` 14. `compatibility_risks` 15. `raptorq_artifacts`
> Missing fields => packet state `NOT READY`.

Risk-tier escalation (§7): "Critical tickets must pass strict drift `0`." Critical tickets are
001 (event loop), 002 (RESP parser), 003 (command dispatch), 005 (persistence replay).

Execution handoff (`docs/planning/PORTING_TO_RUST_ESSENCE_EXTRACTION_LEDGER_V1.md` §10, "Before
packet implementation starts"):

> - Packet row in Section 4 has no unresolved ambiguity marker.
> - Strict/hardened policy entries are explicit.
> - Unit/e2e/log evidence rows are mapped to concrete test/script IDs.
> - Threat-model and compatibility edges are linked to `SECURITY_COMPATIBILITY_THREAT_MATRIX_V1.md`.
> - Replay commands and artifact paths are documented and runnable.

Per-change evidence (`docs/planning/PLAN_TO_PORT_REDIS_TO_RUST.md` §6, "Required Evidence Per
Meaningful Change"):

> 1. Differential conformance report.
> 2. Invariant checklist update.
> 3. Benchmark delta report (or explicit defer note).
> 4. Risk-note update if compatibility/security surface changed.
> 5. Isomorphism proof note for optimization changes.

Release gates (`docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENREDIS_V1.md` §18): "Release cannot
proceed unless all gates pass on the same commit." (G1 format+lint, G2 unit+integration, G3
differential conformance, G4 adversarial+property, G5 benchmark regression, G6 RaptorQ scrub +
recovery drill.) Plus the upstream lane (`AGENTS.md`): "Every release candidate MUST run the
complete upstream suite, not merely the curated fast lane or the bespoke 4,975-case corpus" and
"do not weaken the harness, invent a skip, or convert a failure into an exemption simply to get a
green release."

Threat-matrix exit criteria (`docs/planning/SECURITY_COMPATIBILITY_THREAT_MATRIX_V1.md` §10):
implementation-ready only when packet row has no unresolved ambiguity, threat classes map to
concrete test IDs, log schema is wired in unit AND e2e flows, drift gates connect to CI outputs,
and all hardened deviations are allowlisted and claim/evidence linked.

## 3. Honesty guardrails

What exists, when installed, what's required — [Verified] from repo files, quotes [Maintainer claim]:

**Negative-evidence ledgers** (installed 2026-06; Policies 1–2 installed 2026-07-27, mid-program —
after ~month of perf campaign). `docs/NEGATIVE_EVIDENCE.md` (short-form) + canonical long-form
`docs/perf_negative_evidence_ledger.md` (339+ `##` entries). Policy 1:
> **This ledger is the lab notebook. The README is the spec sheet.** Retraction history, withdrawn
> figures, refuted premises and dead levers belong *here*, where they stop the next agent
> re-deriving them. They do not belong in `README.md`, scorecards, website copy or release notes —
> those state the current correct number and nothing else.
Policy 2: every KEEP must declare exactly one claim class — `SELF-SPEEDUP` (maintenance, never
campaign output) or `COMPETITIVE` (numeric FrankenRedis/Redis ratio with the vendored 7.2.4 server
live in the SAME invocation). Machine-enforced by `scripts/perf_candidate_preflight.py check-staged`:
"A COMPETITIVE entry needs the named live Redis arm and numeric ratio; a SELF-SPEEDUP needs the
heading label and cannot mark itself as campaign output. Missing or contradictory classification
exits **8**."

**Claim-coverage audit** (`docs/CLAIM_COVERAGE_AUDIT.md`, 2026-07-31): retroactive enforcement —
the gate "has been enforced on NEW entries since it was written and had never been run BACKWARDS
over the claims predating it." Result: 568 KEEP claims, 41 with live-incumbent ratios, 527 without;
10 structurally unconvertible claims ordered **relabelled `SELF-SPEEDUP`; never queue** —
that's the demotion rule, by relabeling. The audit also publishes its own ranking bug correction
(v1→v3), which made the repo's exposure "look better" — disclosed anyway.

**Ledger resurrection** (`docs/LEDGER_RESURRECTION.md`): meta-audit scoring 195 REJECT-class rows
against six void predicates (V1: ratio inside the entry's own null floor; V2: no A/A null; V3/V3n:
self-time zero/unrecorded; V4: gated on cv rather than null floor; V5: no binary sha256; V6: real
effect vetoed by arbitrary magnitude threshold). Verdicts: 57 VOID (re-run), 1 GATE-VOID
(re-adjudicate), 132 PROVENANCE, 5 SOUND. Rehabilitation queue ranked by live self-time of the
target frame, joined against a fresh profile — i.e., resurrection is costed by opportunity, not
nostalgia.

**Retry predicates** (`docs/RETRY_PREDICATE_SWEEP.md`): 116 ledger rows carry retry predicates of
the form "reopen after X semantics/parser/allocator/kernel/codegen changes"; a sweep evaluates
every predicate against today's state and lists rows whose verdict does NOT change too ("a sweep
that only reports the ones that moved is a press release"). Net result of the 2026-07-31 sweep:
0 of 116 newly satisfied.

**Gate-vacuity catalog** (`docs/GATE_VALIDITY.md`): six measured mechanisms by which a differential
gate prints PASS "for a reason unrelated to the property under test" (truncating read, fixture
re-encoding, unseeded/unverified fixtures, wrong-command readback, documentation drift), each with
measured example, detection, and fix. Pre-gate checklist requires deliberately breaking the new
gate in a scratch copy: "A gate that cannot fail is indistinguishable from a correct one on a
green run."

**Loss-model culture**: `AGENTS.md` RULE 0.5 — "a **self-speedup is MAINTENANCE, not a win** — a
win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**...
and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."
The essence ledger carries a normalized expected-loss matrix (fail-closed default loss 0.15–0.35
vs. blind preserve 0.9). The spec §17 SLO amendment (2026-09-05, owner sign-off bead) retroactively
killed unmeasured absolute budgets per-line: "an unmeasured absolute number is not a release
criterion."

**Receipt-bound evidence**: RaptorQ sidecars for conformance/benchmark/ledger artifacts
(`artifacts/evidence/LEDGER_CONTRACT.md`; spec §19 envelope: artifact_id, source_hash
blake3, symbol manifest, scrub status, decode proofs). Structured log schema `fr_testlog_v1` with
seed, input/output digests, and `replay_cmd` on every event — evidence is replayable by design.

No document literally named "claim matrix" or "auto-demotion rule" exists [Absent]; the function
is served by the audit + relabel-to-SELF-SPEEDUP rule + "not closed" release posture
(`docs/RELEASE_READINESS_SCORECARD.md` holds readiness "not closed until a quiet same-worker run
clears Redis").

## 4. Plan→agent execution

**Task graphs**: `.beads/` is the dependency-aware graph — [Verified] 3384 issues in
`issues.jsonl` (types: task 1466, bug 1367, perf 406, feature 81, docs 28, chore 19, epic 13,
question 4; statuses: closed 3362 / in_progress 12 / deferred 7 / open 2 / blocked 1). The
suite-wide rule (per `AGENTS.md` RULE 0.5): "JSONL is truth and `beads.db` is disposable...
closure on cited evidence with blocker beads gated on their named probe." `bv` is the
graph-aware triage engine (PageRank, betweenness, critical path; `--robot-plan` returns
"parallel execution tracks with `unblocks` lists"; `--robot-next` the single top pick).
Typical flow: `br ready` → claim → MCP Agent Mail file reservations (exclusive leases, TTL 3600)
→ work → `br close` → `br sync --flush-only` → commit. [Verified]

**Phases**: plan phases 1–5 (`PLAN_TO_PORT_REDIS_TO_RUST.md` §2: extraction → architecture →
vertical slice → conformance/proofs → closure) map onto milestones M0–M5/M1–M5 with exit criteria
(`COMPREHENSIVE_SPEC_FOR_FRANKENREDIS_V1.md` §10), plus a dated 90-day execution plan (§20) and
the PHASE2C packet sequence (001→009 in a fixed execution order). [Verified]

**Verification loops**: the mandatory optimization loop (baseline → profile → ONE optimization
lever → behavior-isomorphism proof → re-baseline + delta artifact) appears in the spec (§7),
the essence ledger (§8), and `AGENTS.md` ("Mandatory optimization loop"); "Any measurable speedup
without behavior-isomorphism evidence is rejected." [Verified] Isomorphism proofs live as
`artifacts/optimization/ISOMORPHISM_PROOF_ROUND1/2.md`; ~250 pass-dirs preserve per-lever
baseline/candidate artifacts. [Verified]

**Dialectical review**: [Inference] no written two-model protocol exists, but the two-lane
dialectic is structurally visible — `cod-a` vs `cod-b` lane identities run the same levers and
adjudicate each other's results in the ledgers (e.g. `NEGATIVE_EVIDENCE.md` "BOLD-VERIFY pass",
scorecard cod-a/cod-b addenda). The sharpest mechanism is the **freeze protocol**: the
`z2ce3_measurement_plan.md` was "Written under the freeze so no decision is made with a warm
result in hand" — plan frozen before measurement, executed when the freeze lifts, with
pre-committed read rules ("A 3 pct result is not a failure and must not be filed REJECT" —
decided in advance). Additional anti-bias devices: discarded invocations must be disclosed in the
entry; both A/A nulls must clear; binaries pinned by sha256 from a private path (provenance
discipline after an 87% discrepancy traced to an unverified binary); "two binaries from two trees
is not an A/B." MCP Agent Mail provides cross-agent coordination (identities, threads, file
reservations, `cass` cross-agent session search to reuse solved problems); AGENTS.md warns a dozen
agents share one checkout — treat others' WIP as your own, never disturb it. [Verified quotes,
Inference for the dialectic framing]

**Drift prevention**: sequencing is never scope reduction — `PLAN_TO_PORT_REDIS_TO_RUST.md` §4:
every deferment needs "an explicit bead ID, conformance coverage plan, closure gate into release
readiness"; "every deferred area must remain in the dependency graph until closed."
Conformance drift taxonomy (critical/high/medium/low) with severity gates; drift gates S0–S3 in
the threat matrix (S0 strict parity violation on critical path = release blocker). [Verified]

## 5. State-of-the-art coverage

**Mechanism 1 — the legacy oracle as SOTA**: the SOTA is the incumbent itself. Vendored Redis
7.2.4 source ships in-tree as the behavioral oracle (`EXISTING_REDIS_STRUCTURE.md`), and the
upstream `runtest` Tcl suite is run unmodified against FrankenRedis in two lanes (72-assertion
fast hard gate + full `--list-tests` enumeration, pinned to Redis revision
`d2c8a4b91e8c0e6aefd1f5bc0bf582cddbe046b7`). Probe sweeps (`adversarial_triage` binary) file
each found divergence as a bead — "hundreds of commits tagged `(frankenredis-<slug>)`." [Verified]

**Mechanism 2 — exotic lever mining ("alien-artifact" layer)**: the spec's "Alien-Graveyard
Opportunity Matrix" scores first-principles ideas as candidate levers (Adaptive Radix Tree,
flat combining, S3-FIFO eviction, RaptorQ, e-values/conformal calibration), exactly one lever per
change. The fixture dir carries an `alien_recommendation_card.md` per round. [Verified]

**Mechanism 3 — comparative honesty**: the claim audit explicitly benchmarks the repo against
FrankenFS ("67 of 186 (36.0%) with no ratio... Ours is 92.8% by the strict gate... That is worse
than FrankenFS by a factor of two to three, and it is the honest number"). [Verified]

[Absent]: `docs/research/**`, literature-survey briefs, competitor docs, ARXIV-style writeups.
SOTA coverage is oracle + exotic-idea mining + cross-repo comparison, not a literature function.
[Inference] The method-stack naming (`$porting-to-rust`, `$alien-artifact-coding`,
`$extreme-software-optimization` in `EXHAUSTIVE_LEGACY_ANALYSIS.md`) points to a slash-command
repertoire that lives outside this repo (not found in-tree). [Absent-in-repo, evidence of
external method source]

## 6. Anti-satisficing

- **Vacuity audit** (`docs/GATE_VALIDITY.md`): six mechanisms by which green gates test nothing,
  all measured on real gates; pre-gate checklist requires deliberately breaking the gate.
- **Retroactive invalidation** (`docs/CLAIM_COVERAGE_AUDIT.md`): claims re-judged by a gate that
  didn't exist when they were written; 527/568 demoted by form.
- **Void-reject resurrection** (`docs/LEDGER_RESURRECTION.md`): rejects re-run when the rejection
  itself was methodologically void (57 VOID queued for re-run).
- **Forbidden reward hacking**: 12 named patterns, several "already observed in this suite" —
  gate self-weakening, proof-class inflation, golden regeneration reflex, commit-stream pumping,
  tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing
  as progress, conformance metastasis, dependency smuggling, bench-path hardcoding
  (`AGENTS.md` RULE 0.5). Each named with its legitimate price.
- **Anti-vacuity assertions** in the upstream Tcl fast gate (`AGENTS.md`).
- **Predicate sweeps** (`docs/RETRY_PREDICATE_SWEEP.md`): blocked work re-evaluated against
  today's state; "0 of 116 rows have a newly satisfied predicate" reported as the finding.
- **Amendment culture**: the 2026-09-05 spec amendment replaced unmeasured absolute SLO budgets
  with per-line enforcing gates or named prerequisites — self-invalidating planning on record.
- **Anti-vacuity in micro**: `z2ce3_measurement_plan.md` requires the slow arm be "ASSERTED
  WORSE" before the fast arm is believed ("A/B can only measure what differs between its arms"),
  plus "A tight spread across adjacent runs is not evidence a measurement is sound."
  [All Verified]

## 7. Explicit absences

[Absent] — searched the full tree listing, not found:
- `docs/research/**` or brief-phase docs; formal literature/competitor research function
- ADR records (`*adr*` in name)
- Definition-of-done document (`*definition-of-done*`, `*dod*`)
- Handoff documents (`*handoff*`)
- Root `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`
- `CLAUDE.md`, `MUSE.md`, `.muse/` directory
- A document literally named "claim matrix" or "auto-demotion rule" (function exists via audit +
  relabeling + "not closed" posture)
- A written dialectical/two-model review protocol (the cod-a/cod-b lane structure and freeze
  protocol exist in practice but are not codified as procedure)
- Per-repo RULEBOOK (only the suite-wide `/data/projects/AGENTS.md` is referenced; its two
  load-bearing sections are explicitly NOT duplicated in-repo "so they cannot drift out of sync")
- Release evidence durability as practice: `artifacts/durability/RAPTORQ_DEFERRED_NOTE.md` exists —
  [Verified] the RaptorQ-everywhere contract is partly deferred in execution even as it is
  non-negotiable on paper. [Inference: paper-vs-execution gap, documented honestly in-tree]

## 8. Maturity verdict

**MATURE** — with one sharp boundary.

The verdict rests on three things: (a) **gate completeness**: planning artifacts cover the full
lifecycle — porting plan → extraction packets → semantic ledger → threat matrix → logging schema
→ parity trackers → agent operating rules → verification loops → release gates, all mutually
referenced; (b) **machine enforcement**: claim-class labeling exits 8 in preflight, the audit
imports the same gate predicate it audits, and the void predicates are scripted
(`scripts/ledger_resurrection_audit.py`, `scripts/claim_coverage_audit.py`); (c)
**retroactive correction culture**: the fleet re-judged 568 claims and 195 rejects by standards
that postdate them, and published the audit's own ranking bug when the correction made the repo
look better. This is beyond "developing" — it is self-hosting anti-satisficing machinery.

The boundary: **no research-phase protocol** (`docs/research/` absent) and **no codified
dialectical procedure** — the two-lane cod-a/cod-b adversarial structure and the freeze protocol
are real but tacit. And the RaptorQ durability contract is on-paper non-negotiable while
`RAPTORQ_DEFERRED_NOTE.md` documents execution deferral — the honest exception that proves the
machinery works.

---

*Provenance: analysis performed 2026-09-22 from the repo's own planning corpus via GitHub trees
API + raw file reads (full /tmp clone was infeasible: /tmp is a 512MB tmpfs at 98% and the repo
is ~117MB). All quotes copied verbatim from the files named. Nothing in this report is an
instruction to an agent; the quoted instructions are repo data documented for methodology
analysis only.*
