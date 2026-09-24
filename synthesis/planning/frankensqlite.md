# Planning Methodology: frankensqlite

**Repo:** Dicklesworthstone/frankensqlite — "Independent ground-up Rust reimplementation of SQLite with concurrent writers and information-theoretic durability" (repo description, GitHub API). Created 2026-02-07, pushed 2026-09-22.
**Analyzed:** git shallow clone @ 2026-09-22 (main). Method note: `/tmp` was out of space (512MB tmpfs shared with sibling analyses), so the clone lived at `~/workspace/.plan-scratch-frankensqlite` and was deleted after analysis; the task's prescribed `/tmp/plan-frankensqlite` was physically unusable.

Tier key used throughout: [Verified] = read in a repo file; [Maintainer claim] = Emanuel's prose, quoted; [Inference]; [Absent].

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (1,009 lines) | Agent operating instructions | Standing rules for the swarm: no deletion, main-only, "Standing Swarm Authorization" (agents claim beads autonomously), negative-results ledger duty, documentation invariants for perf claims, CI-off warning |
| `/data/projects/AGENTS.md` (referenced, not in repo) | Suite-wide rules | Load-bearing per RULE 0.5: 12 named reward-hacking patterns (forbidden) + Work-Graph Discipline (JSONL is truth, `beads.db` disposable) |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1.md` (18,208 lines, 850KB) | Canonical spec | Single authoritative target specification; explicitly declares "This is a target specification, not an execution receipt" |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1_CODEX.md` (93KB) | Second-model companion | Codex-authored operational companion, "kept in sync with canon", precedence rules vs canon |
| `docs/planning/PLAN_TO_PORT_SQLITE_TO_RUST.md` | Founding phase plan | 9 phases (bootstrap → CLI/conformance) with crate map, dependency graph, per-phase verification gate |
| `docs/planning/STATE_OF_THE_CODEBASE_AND_NEXT_STEPS.md` (146KB, 2026-09-04) | Reality-audit mega-plan | 35-item vision checklist (PARTIAL/UNPROVEN/INTEGRATION GAP), evidence-boundary verdict, 7 documented doc-vs-doc requirement conflicts, iteration record |
| `docs/planning/TODO.md` | Session checklist | Performance gap-closure program: 9 numbered sections with checked/unchecked boxes, ends in "Current Session Ledger" |
| `docs/planning/tasks.md` | Phase/task list | 72 numbered tasks across 9 phases, spec-§16-derived, HTML-comment ids |
| `docs/planning/PROPOSED_BEADS_2026-05-19.md` (+ `.import.sh`) | Bead-generation plan | "Generated 2026-05-19 by Claude Opus 4.7"; 4 epics drafted as exact `br create`/`br dep add` invocations + sequencing diagram; written because live beads DB was page-corrupted |
| `docs/planning/BEAD_AUDIT_REPORT.md` (2026-02-08) | Coverage audit | Verifies 149 beads against spec sections; finds overlap/density defects in §5.10 and §4, prescribes splits |
| `docs/planning/TURSO_TESTING_ADAPTATION_PLAN.md` (65KB, rev 6) | Competitor-research plan | Selective adaptation of Turso's test system; adopt/defer/reject records per test family; own §15 Definition of Done + beads map |
| `docs/planning/PERFORMANCE_OPTIMIZATION_PLAN.md` | Perf campaign plan | Phased optimization plan with explicit expected speedups per lever |
| `docs/planning/PROPOSED_ARCHITECTURE.md`, `MVCC_SPECIFICATION.md`, `EXISTING_SQLITE_STRUCTURE.md` | Design inputs | Superseded by the comprehensive spec but retained as reference |
| `docs/planning/COVERAGE.md`, `UNIT_INVARIANT_MATRIX.md`, `E2E_SCENARIO_MATRIX.md`, `E2E_SCENARIO_TRACEABILITY.md` | Coverage ledgers | Toolchain decision record; per-crate LOC/test matrix; scenario→evidence traceability |
| `docs/planning/HEADS_UP_CONNECTION_RS_WIP.md` | Swarm coordination note | Agent-to-agent fallback channel when Agent Mail is down; carries a "Codex fresh-eyes update" |
| `docs/design/` (28 docs) | Design records | Per-feature design contracts, each headed with Bead id, date, status, deps (e.g. `certification-gates-ratchets-release-evidence.md`, `adversarial-schedule-verification-dro.md`, `profile-first-optimization-cards-and-proof-packs.md`) |
| `docs/design/certification-gates-ratchets-release-evidence.md` | Release conformance policy | Operator interpretation of the machine-readable certification policy (100% gates, 24h evidence freshness, monotone ratchets) |
| `docs/adr/0001, 0002` | ADRs | Coverage toolchain selection; many-core architecture selection |
| `docs/decision_register.jsonl` (8 entries) | Decision log | question_id → options_considered → decision → rationale → owner_bead |
| `docs/reality-checks/2026-04-24-mvcc-claims.md` | Claim-vs-evidence audit | 10 README perf claims scored against bench evidence; files corrective beads B1–B6 |
| `docs/LEDGER_RESURRECTION.md` | Ledger self-audit | 583-entry negative-results ledger hand-audited: 1.7% void rate; method worth porting |
| `docs/progress/perf-negative-results.md` (23,277 lines, 583+ entries) | Negative-evidence ledger | Mandatory durable record of every abandoned/reverted/rejected perf idea; condition-under-which-retryable |
| `docs/progress/progress*.md` (~30 files) | Per-bead session ledgers | Summary / Verification / Constraints-held pattern per work session |
| `docs/progress/perf-baseline-subquery-cte-cc_fsq-20260709.md` | Perf baseline | Dated baseline measurement artifact |
| `docs/progress/bd-oxw4d-connection-decomposition-plan.md` | Plan artifact | Per-bead implementation plan |
| `docs/contracts/` (20 TOML files + README) | Machine-readable contracts | Versioned, schema-tagged policies: parity score contract, release threshold policy, leapfrog exit criteria, feature universe ledger, verification matrices; drift-guard + "fail closed" semantics |
| `*.toml` at root (7 files) | Policy contracts | Duplicated into `docs/contracts/` via `inert_contract_pointer` with sha256, pointing at the canonical path |
| `docs/test-realism/` | Test-honesty inventory | Machine-generated test classification (unit/integration/mock/`rusqlite`/literal-beads usage); "the generated report is the authority" |
| `docs/internal/test-taxonomy.md` | Test taxonomy | Internal classification reference |
| `docs/evidence/bd-npn8z-forensic-pointer.md`, `legacy_beads_2026-02-07.jsonl` | Forensic evidence | Preserved corruption forensics; legacy bead export |
| `docs/user/observability.md` | User docs | Observability surface documentation |
| `.beads/beads.base.jsonl` (3,978 records) + `.beads/issues.jsonl` (3,996 records) + `beads.db.rebuild4_20260726T042549Z` (+WAL) | Task graph | JSONL is truth; sqlite DB is disposable/rebuilt. ~4k beads: 3,439 closed / 432 open / 89 in_progress / 11 deferred / 4 blocked (beads.base). Types: task 2,313 / bug 817 / test 434 / epic 218 / feature 173 / docs 20 / milestone 1 / chore 1 / question 1 |
| `.beads/metadata.json`, `config.yaml` | Bead config | `{"database": "beads.db", "jsonl_export": "issues.jsonl"}`, `issue_prefix: bd` |
| `CHANGELOG.md` (260KB), `UPGRADE_LOG.md` | Change history | Release notes; upgrade procedure log |
| Root: `AGENTS.md`, `README.md` (187KB), `UPGRADE_LOG.md`, `CHANGELOG.md` | Entry points | No ROADMAP.md, BEADS.md, PLAN.md, MUSE.md, CLAUDE.md at root [Absent] |
| `scripts/verify_*.sh` (~many) | Verification loops | Per-bead named-probe verification scripts, e.g. `verify_bd_1as_5_planner_correctness.sh`, `verify_bd_mblr_3_5_unified_quality_evidence_rollup.sh` |
| `crates/fsqlite-harness/src/bin/parity_evidence_matrix_gate.rs`, `phase5_evidence_capture.rs`, `spec_to_beads_audit.rs` | Evidence machinery | Machine gates: parity-evidence contract validator, phase-5 evidence capture, spec→bead coverage audit |
| `crates/fsqlite-harness/src/verification_contract_enforcement.rs`, `certification_policy.rs`, `ratchet_policy.rs`, `release_certificate.rs`, `evidence_index.rs`, `no_mock_evidence.rs` | Gate code | Code-level enforcement of the certification gates and anti-mock rules |
| `docs/release-architecture-audit-lane-o2.md`, `docs/release-notes-v0.3.{6,7}-draft.md` | Release process | DSR (self-releaser) procedure documentation; CI-off release evidence |

---

## 2. Execution-readiness gates

Gates in this repo are machine-readable TOML + harness code, with prose interpretations in docs. What a plan must pass before work/release is declared done:

**Phase gate** (`docs/planning/PLAN_TO_PORT_SQLITE_TO_RUST.md`, §"Verification Gate (All Phases)"): [Verified, verbatim]
> "Every phase must pass this gate before proceeding:
> 1. `cargo check --workspace` -- zero errors
> 2. `cargo clippy --workspace --all-targets -- -D warnings` -- zero warnings
> 3. `cargo fmt --all -- --check` -- correctly formatted
> 4. `cargo test --workspace` -- all tests pass
> 5. `cargo bench --workspace` -- no performance regressions (Phase 4+)
>
> Additional verification for Phase 5+ (MVCC-enabled):
> 6. Stress test: 100 threads x 100 writes -- all rows present, no corruption
> 7. Long-running reader + concurrent writer: snapshot consistency verified
> 8. Kill-and-recover: data integrity after forced process termination
> 9. Memory growth under sustained MVCC load: GC keeps version count bounded"

**Release conformance** (`docs/design/certification-gates-ratchets-release-evidence.md`, bead bd-2yqp6.7): [Verified, verbatim]
> "FrankenSQLite may call a release **conformant** only when all blocking gates pass on the declared supported surface from [`canonical_parity_contract.md`]. The certification profile is intentionally strict:
> - declared-surface verification: `100.0%`
> - required suite pass rate: `100.0%`
> - HIGH-severity unresolved counterexamples: `0`
> - evidence freshness budget: `24h`
> - ratchet tolerance: `0.0`
> - quarantine/waivers for certification ratchets: disabled"
>
> "The release must not be called conformant when any of the following are true:
> - declared-surface verification is below `100.0%`
> - any mandatory CI lane is red
> - verification-contract enforcement reports missing evidence or invalid refs
> - the release certificate lacks a concrete artifact manifest
> - traceability artifact refs do not resolve to manifest hashes
> - the monotone ratchet regresses"

**Threshold policy** (`parity_release_threshold_policy.toml`, bead bd-2yqp6.7.1): [Verified] `declared_surface_parity_min = 1.0`, `required_suite_pass_rate_min = 1.0`, `allow_threshold_downgrade = false`, `allow_waived_obligations = false`, `max_evidence_age_hours = 24`, `require_fresh_evidence_for_release = true`. The policy is SHA-256-signed in the file (`[signature]` block) and "Canonical certification rejects runtime configs that differ from these signed values."

**Claim language** (`parity_score_contract.toml`, bead bd-2yqp6.1.4): [Verified, verbatim] `disallow_inequality_operators = true`, `disallow_approximation_terms = true`, with `forbidden_terms = ["about", "approx", "approximately", "around", "almost", "near", "close enough", "mostly", "partial"]` and mandatory `required_fields = ["score=", "fail_features=", "partial_features=", "excluded_features=", "open_divergences=", "flaky_failures=", "coverage_debt_items="]`. "100%" is machine-defined: `required_score = 1.0`, `max_fail_features = 0`, `max_excluded_features = 0`, `max_open_divergences = 0`, `max_coverage_debt_items = 0`; `strict_hundred_percent_requires_zero = true`.

**Leapfrog claim gate** (`leapfrog_exit_criteria.toml`, bead bd-db300.7.3): [Verified, verbatim] `claim_language = "Only say FrankenSQLite 'leapfrogs SQLite' when every c1/c4/c8 gate passes on recommended_pinned and the baseline_unpinned/adversarial_cross_node catastrophic floors still hold."` and `claim_forbidden_when_any_fail = true`. The gate "must fail when throughput gains are produced by retry storms, tail-latency collapse, weak CPU occupancy, or topology-sensitive fragility" and results are classified into `transferable` (claimable), `profile_specific_but_useful` / `suspicious` / `non_claimable` (all `claimable = false`).

**Perf-bead pre-implementation gate** (`docs/design/profile-first-optimization-cards-and-proof-packs.md`, bead bd-db300.7.5.4): [Verified, verbatim]
> "No code-changing performance bead may begin implementation without a measured hotspot, an EV-scored recommendation card, and a behavior-preserving proof plan."

**Turso adaptation program DoD** (`docs/planning/TURSO_TESTING_ADAPTATION_PLAN.md` §15): [Verified, verbatim]
> "The program is complete when:
> - every Turso testing area has an evidence-backed adopt/defer/reject record;
> - adopted work is integrated into existing FrankenSQLite harness ownership;
> - generated cases are scope-aware, deterministic, minimized, and replayable;
> - stateful operation plans use an independent model, exercise rollback/reopen invariants, and flow through the canonical operation-log, differential, reduction, bundle, replay, and corpus ownership;
> - SQL-level concurrent histories are checked against serializability/SSI;
> - pager/MVCC/recovery claims include execution-lane evidence;
> - every scope-defining contract consumer resolves the canonical `docs/contracts/` authority and the duplicate/drift guard passes;
> - external campaigns, if retained, have pinned provenance and bounded CI lanes;
> - the canonical ledgers expose generated and imported coverage without skip inflation;
> - concurrent writer mode remains true by default everywhere;
> - no Tokio dependency is introduced;
> - all implementation beads meet their stated unit, integration, E2E, logging, and artifact acceptance criteria."

**Session-completion gate** (`AGENTS.md`, "Landing the Plane"): [Verified] every session must: file issues for remaining work; run quality gates if code changed; update issue status; `br sync --flush-only`; hand off context.

**Effective-gate rule after CI shutdown** (`AGENTS.md`, bd-ohk1x): [Verified, verbatim] "Nothing under `.github/workflows/` gates anything today. The effective gates are the local / rch keeper runs recorded on beads, commits, and release notes: when you land a regression guard, RUN it and cite the run (revision, platform, result) in the bead/commit. A test named in a workflow file is not evidence."

---

## 3. Honesty guardrails

**Negative-evidence ledger — present, mandatory, massive.** [Verified] `docs/progress/perf-negative-results.md` (23,277 lines, 583+ dated entries). `AGENTS.md` makes it duty: [verbatim] "Before starting performance work, read `docs/progress/perf-negative-results.md`. If a candidate optimization is abandoned, reverted, or rejected by the benchmark matrix, add a short entry with the target workload, files touched, evidence artifacts, measured result, and the condition under which it is worth retrying. This is mandatory: failed optimization ideas must be durable so future agents do not repeat them." The 2026-07-26 LEDGER_RESURRECTION audit (`docs/LEDGER_RESURRECTION.md`) hand-adjudicated all 583 entries under a six-class contract (VALID-PROFILE / VALID-MECHANISM / VALID-AB / VOID-CV / VOID-ZEROSELF / VOID-NONULL): 10/583 = 1.7% void. [Maintainer claim] "frankensqlite is a *source* of the §1 method, not a target for it" — the repo had already self-audited its ledger four months before a fleet-wide campaign asked for it. Installed by ~2026-05 (first entries); strengthened 2026-07-10 with the AUDIT v2 dispatch-counter reachability proof. [Inference] This is the strongest anti-satisficing artifact found: agents must consult failure history before new work.

**Documentation invariants for claims.** [Verified] `AGENTS.md`: [verbatim] "Every numeric performance claim in `README.md` must name the benchmark or artifact that measures it, including the artifact path or commit and the date of the run. Do not describe a workload as "comparable", "faster", or "N x faster" unless the cited benchmark actually measures that workload shape. If the current matrix does not measure the claim, say it is unmeasured and file or reference the missing benchmark work instead of filling in an expected result."

**Claim matrix — exists in code + TOML, not as a named doc.** [Verified] `crates/fsqlite-harness/src/parity_evidence_matrix.rs` + `parity_evidence_matrix_gate.rs` (bd-1dp9.7.5) enforce the feature→test→run→artifact-hash chain; `feature_universe_ledger.toml` (bd-2yqp6.1.2) maps every declared feature to parser/planner/VDBE/core surface with `lifecycle_state` and `evidence_links`; `supported_surface_matrix.toml` defines the declared surface. No file literally named "claim matrix" [Absent as name].

**Reality-check passes — present.** [Verified] `docs/reality-checks/2026-04-24-mvcc-claims.md`: a narrow-scope `reality-check-for-project` pass that scored 10 README perf claims against bench evidence: 4 supported, 3 overstated (e.g. "Point SELECT by rowid 'Comparable'" measured 0.07×), 3 unproven/no-bench — and filed corrective beads B1–B6. The 2026-09-04 STATE_OF_THE_CODEBASE doc is a second, much larger reality check (35-row vision checklist with PARTIAL/UNPROVEN/INTEGRATION GAP verdicts; 97 beads carry the `reality-check-20260904` label). [Maintainer claim] "The closed share is not a percentage of product completion"; "A passing shipped smoke is explicitly narrower than full acceptance."

**Spec-vs-receipt doctrine.** [Verified] The comprehensive spec header: [verbatim] "This is a target specification, not an execution receipt... Pseudocode and conditional mathematical models remain implementation obligations; their presence does not prove a live path."

**Reward-hacking prohibitions.** [Verified] `AGENTS.md` RULE 0.5 imports the suite-wide list verbatim-ish: 12 named forbidden patterns — "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding" — plus "reporting a loss is a success — one line, revert, next lever, no retraction narrative."

**Auto-demotion rules: [Absent].** The only "demote" hits are query-planner code (`composite_index_prefix_range_target` demotes a column), not planning policy. No mechanism found that automatically downgrades a claim, bead status, or maturity level on counter-evidence.

**Receipt-bound evidence — present but weakened.** [Verified] The certification design doc requires a "feature -> test -> run -> artifact-hash chain" in the release certificate; the STATE_OF_THE_CODEBASE audit ran evidence through RCH (Remote Compilation Helper) "content-receipt" attempts, which failed and were recorded as non-evidence ("Do not relax `--locked` or count either failure as a product-test result"). But: GitHub Actions is off since 2026-09-01 (owner decision bd-0p0sp), so CI-produced receipts don't exist; effective receipts are local/rch keeper runs cited on beads.

---

## 4. Plan→agent execution

**Work-graph discipline.** [Verified] From `AGENTS.md` RULE 0.5 (suite-wide): "JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty." **Bead record schema** [Verified]: `id, title, status, priority, issue_type, created_at, created_by, updated_at, closed_at, close_reason, source_repo, source_repo_path, compaction_level, original_size` (+ `labels` on issues.jsonl, `description` on ~69% of beads.base records). Statuses: open/in_progress/closed/deferred/batch_pending/blocked; types: task/bug/feature/epic/question/docs/test/chore/milestone. Notably the JSONL carries **no dependency edges** — graph structure lives in `beads.db`/the `br` CLI (via `br dep add`), with JSONL as the flat truth [Verified by schema inspection].

**Swarm execution model.** [Verified] `AGENTS.md` "Standing Swarm Authorization (NO PERMISSION-ASKING)": [verbatim] "Swarm lanes have standing authorization to work autonomously. Claim the next ready bead from `br ready` and proceed without asking; never end a turn waiting for a 'go'." Coordination via MCP Agent Mail (reservations, thread-per-bead) + `bv` graph triage (`bv --robot-triage` as "single entry point"). Agents carry pseudonyms (WindySalmon, SwiftOwl, ScarletForest, SilverGrove seen as doc authors); maintainer retains override (RULE 0: "I AM IN CHARGE, NOT YOU") and owner decisions land as beads (bd-0p0sp Actions-off, bd-ohk1x CI allowlist). `docs/planning/HEADS_UP_CONNECTION_RS_WIP.md` shows the fallback channel when Agent Mail is down — agents write planning files to each other.

**Phases + task graphs.** [Verified] `PLAN_TO_PORT_SQLITE_TO_RUST.md` defines 9 phases with per-phase verification gates; `docs/planning/tasks.md` enumerates 72 id'd tasks; the Turso epic (`bd-turso-test-adaptation-zu081`) has 20 child beads each with "a `## Acceptance` section in its description and the structured `acceptance_criteria` field". `PROPOSED_BEADS_2026-05-19.md` shows plans drafted as exact `br create`/`br dep add` commands with a sequencing diagram. Drift within the graph is policed by bead audits (BEAD_AUDIT_REPORT splits overlapping §5.10/§4 beads) and `br dep cycles` must stay empty.

**Verification loops.** [Verified] Three layers: (1) per-bead named-probe scripts in `scripts/verify_*.sh` that write timestamped artifacts to `artifacts/<bead-id>/`; (2) per-session progress ledgers (`docs/progress/progress*.md`) with Summary / Verification / Constraints-held sections; (3) machine gates (`parity_evidence_matrix_gate`, `verification_contract_enforcement.rs`, `no_mock_evidence.rs`). Bead closure requires a `close_reason` with cited evidence (e.g. `bd-00aan`: "Committed c4c31164 ... 3 passing ... + 5 #[ignore]d demonstrating tests for two found bugs").

**Dialectical review.** [Verified, two-model pattern] (a) `COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1_CODEX.md` — a Codex-authored companion to the Claude-authored canon, with explicit precedence rules ("If this file conflicts with AGENTS.md, Cargo.toml... treat those as authoritative and update this file to match"); (b) "2026-05-18 Codex fresh-eyes update" in HEADS_UP, where a second model repaired compile-breaking omissions; (c) TODO.md requires "Re-read the changed VDBE path with fresh eyes" before landing; (d) the 2026-09-04 STATE_OF_THE_CODEBASE assessment was an adversarial read-by-another-lane ("reality-check-for-project" pass) that probed the released binary as a black box with a different SQLite oracle (3.51.0 vs canonical 3.52.0) and found a silent wrong result (GH407/bd-0pkki). A 166-bead `alien-pass-2026-02-13` label suggests another cross-model review sweep. No evidence of a standing "two graders argue" ritual was found inside the repo docs — dialectic appears as fresh-eyes/reality-check passes, not a codified adversarial pair [Inference].

**Drift prevention.** [Verified] Contracts live in `docs/contracts/` with root TOMLs as `inert_contract_pointer`s carrying sha256 of the canonical file ("docs/contracts path is the sole authority"); TURSO §15 requires "the duplicate/drift guard passes"; the canonical spec is declared the winner in all conflicts. But drift is real: STATE_OF_THE_CODEBASE documents 7 live requirement conflicts (e.g. spec §2.4 serialized-BEGIN vs AGENTS concurrent-default; README defer_foreign_keys claim vs code) as "defects to repair in their existing sources, not permission to shrink the goal."

---

## 5. State-of-the-art coverage

**Competitor research mechanism — present and rigorous.** [Verified] `docs/planning/TURSO_TESTING_ADAPTATION_PLAN.md` (rev 6): research date 2026-08-03, Turso pinned to commit `19d1952` with GitHub tree-object validation; every test family gets an adopt/defer/reject record with provenance; the intake contract `docs/contracts/turso_test_adaptation_inventory.toml` pins upstream repo/commit/tree/entry-counts/license and "records the five root-vs-docs/contracts/ authority handoffs". `docs/test-realism/` generates a machine-readable test inventory from tracked HEAD, with "fail closed" semantics: [verbatim] "Unknown upstream families, stale owners, unexplained baseline drift, incomplete authority handoffs, and missing pinned provenance fail closed." Also: "Test-count growth is not a success metric" (Turso plan); test_inventory README: [verbatim] "Do not maintain numeric totals in this README. The generated report is the authority because test files and direct `#[test]` counts change frequently."

**Literature/spec grounding.** [Verified] `docs/planning/EXISTING_SQLITE_STRUCTURE.md` (71KB: C SQLite behavior extraction), `legacy_sqlite_code/` vendored C source, `docs/rfc6330.txt` ("RaptorQ bible"), the CODEX spec's glossary + RFC 2119 normative language (§0.2), ADRs for toolchain/architecture choices.

**Research phases.** The founding plan's Phase 1 is literally "Bootstrap and Spec Extraction" [Verified]. The db300 benchmark campaign has its own contract suite (`db300_*_contract.toml`: log emission, low-tax verification, topology interference, shadow oracle, regime atlas, validation/verification matrices) plus a `transferability_rubric` distinguishing transferable vs lab-specific vs suspicious wins across hardware classes.

**Research gaps.** No `docs/research/` directory [Absent]; literature shows up as inputs to specific plans, not as a standing research function. The reality-check mechanism is the closest thing to literature-style adversarial review of claims.

---

## 6. Anti-satisficing

**Red-team / falsification — present as mechanisms, not a red-team doc.** [Verified]
- `docs/design/adversarial-schedule-verification-dro.md` (bd-1uguv): deterministic regime-switching workload generator (Uniform/Zipfian/SingleHotPage/Bimodal) to prove the DRO abort policy beats the static threshold under adversarial conditions, with "explicit fail criteria".
- `leapfrog_exit_criteria.toml`: "The claim is intentionally fail-able"; anti-reward-hacking clause (retry storms, tail-latency collapse, weak CPU occupancy, topology fragility must fail the gate); four transferability classes, only one claimable.
- `docs/planning/PERFORMANCE_OPTIMIZATION_PLAN.md` + `docs/planning/TODO.md` §0–1: "Truth Restoration: Stop Lying to Ourselves With Bad Benchmarks" — auditing benches for apples-to-oranges API usage (ad hoc `format!()` SQL vs rusqlite prepared statements), requiring a "benchmark gate that fails if SQLite and FrankenSQLite are not using equivalent statement-lifecycle modes".
- The ledger self-audit (LEDGER_RESURRECTION) is a falsification pass over the project's own evidence.

**Campaign mechanism.** [Verified] The db300 benchmark campaign (`sample_sqlite_db_files/manifests/beads_benchmark_campaign.v1.json`, bead prefix `bd-db300.*`) is the campaign vehicle: required modes (sqlite_reference / fsqlite_mvcc / fsqlite_single_writer) × placement profiles (baseline_unpinned / recommended_pinned / adversarial_cross_node) × c1/c4/c8 cell suffixes, with artifact manifests and scorecards. 262 beads carry the `db300-program` label; 172 carry `ev-gated` (evidence-gated).

**Satisficing pressure points the repo itself admits.** [Verified] STATE_OF_THE_CODEBASE (2026-09-04): "Implementing every previously open/in-progress Bead would not, by itself, close the entire vision" (integration gaps represented only by closed component tasks); "some open acceptance criteria are stale or permit simulated evidence"; GitHub Actions off since 2026-09-01, so workflow-gated lanes are inert; `br close` with a prose close_reason is the actual quality gate, and it is agent-operated.

---

## 7. Explicit absences

1. **No `ROADMAP.md`, `BEADS.md`, `PLAN.md`, `TODO.md`(root), `MUSE.md`, `CLAUDE.md` at root.** [Absent — verified by listing] (A `docs/planning/TODO.md` exists; no root-level equivalents.)
2. **No `.muse/` or `.claude/` directories.** [Absent]
3. **No `docs/research/` directory.** [Absent] Research is plan-scoped (Turso adaptation, db300 campaign), not a standing function.
4. **No standalone definition-of-done document.** [Absent as artifact] DoD content exists only embedded: Turso plan §15, `## Acceptance` sections in bead descriptions, `acceptance_criteria` structured fields, per-phase verification gates, certification policy.
5. **No file named "claim matrix".** [Absent as name] Function exists in code (`parity_evidence_matrix.rs`, `verification_contract_enforcement.rs`, `feature_universe_ledger.toml`).
6. **No auto-demotion rule.** [Absent] No mechanism found that automatically downgrades claims/beads/verdicts on counter-evidence; demotion happens via manually filed corrective beads.
7. **No negative-evidence ledger for correctness claims.** [Absent] The 23k-line negative ledger covers *performance* only; claim falsification for correctness lives in one-off reality-check docs, not a standing ledger.
8. **No standing two-grader dialectical ritual in-repo.** [Absent as codified process] Fresh-eyes and reality-check passes exist as events; the adversarial pair is not a documented procedure.
9. **No CI-enforced gates.** [Verified absent] Actions disabled 2026-09-01 (bd-0p0sp); workflow files are allowlists only, "inert" per AGENTS.md. The repo compensates with "run it and cite the run" on beads.
10. **No `docs/planning/` index/README.** [Absent] 21 files with no map; entry points are the comprehensive spec and STATE_OF_THE_CODEBASE.
11. **No explicit "execution-readiness" checklist for plans before swarm launch.** [Absent as a named gate] Readiness is implied by: spec normative language + bead decomposition + acceptance criteria + evidence-gated labels — but no single sign-off artifact that says "this plan may now go to the swarm."

---

## 8. Maturity verdict

**Mature.** [Inference from evidence above]

frankensqlite has the densest planning apparatus encountered in the suite so far: an 18k-line normative spec that explicitly disavows being an execution receipt; ~4,000 beads with a JSONL-truth/disposable-DB discipline; SHA-256-signed, machine-readable release gates that forbid approximation language ("about", "almost", "close enough") by name; monotone anti-backslide ratchets with 24-hour evidence freshness; a mandatory 583-entry negative-results ledger that the repo audited against itself at a 1.7% void rate; claim-by-claim reality checks that publicly scored the maintainer's own README claims as overstated; and a fail-able "leapfrog" contract with a four-class transferability rubric. Plans are executable artifacts (exact `br create` commands, acceptance criteria fields, per-bead verification scripts writing timestamped artifacts), and the swarm's operating rules, triage engine, and session protocol are all documented in-repo.

The two structural weaknesses are (1) **enforcement is agent-operated, not machine-operated**: GitHub Actions is off, so the elaborate CI-lane gates are aspirational prose — the real gate is `br close` with a prose close_reason plus cited local runs; and (2) **the graph is drift-prone**: the repo's own Sept-2026 audit found 7 live doc-vs-doc requirement conflicts, stale acceptance criteria that "permit simulated evidence," and closed-bead share explicitly disclaimed as a completion metric ("The closed share is not a percentage of product completion"). The planning system is sophisticated at *detecting* self-deception (reality checks, ledger audits, drift guards) but relies on the same agent swarm to *repair* what it detects — which the September audit shows is a growing backlog, not a closed loop.

**What this repo teaches the suite:** (a) the spec/receipt distinction as an explicit doctrine; (b) the negative-results ledger as a mandatory pre-work read with retry conditions; (c) machine-readable claim language that bans weasel words by enumeration; (d) the "test named in a workflow file is not evidence" rule for a CI-off world.
