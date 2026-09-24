# Planning Methodology: franken_numpy

**Repo:** `https://github.com/Dicklesworthstone/franken_numpy` · HEAD `f367644` (2026-09-22, "feat(fnp-sort): add fast small int32, uint32, and uint64 flat sort paths matching NumPy") · cloned 2026-09-22 depth-1 into `~/workspace/plan-franken_numpy` (note: `/tmp/plan-franken_numpy` was infeasible — `/tmp` tmpfs was at 100% usage from sibling planning subagents' clones; location adapted per safety, no repo content affected).

This document reverse-engineers HOW Jeffrey Emanuel plans in this repo (not what was built). All claims tiered: **[Verified]** (read in a repo file), **[Maintainer claim]** (his prose, quoted verbatim), **[Inference]**, **[Absent]** (searched, not found).

---

## 1. Artifact Inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (1,237 lines) | Agent operating constitution | [Verified] Root-level agent instructions: RULE 0 (human override), no-deletion rule, toolchain, test discipline, Beads workflow, RCH build fleet rules, and the Performance Ledger contract. Explicitly binds agents to suite-wide rules at `/data/projects/AGENTS.md` (12 named reward-hacking patterns + work-graph discipline). |
| `.beads/issues.jsonl` (2,846 beads) | Dependency-aware task tracker DB export | [Verified] The live task graph. Schema: 30 fields (`id, title, description, status, priority, issue_type, assignee, created_at/closed_at, close_reason, labels, acceptance_criteria, design, estimated_minutes, owner, notes, comments, dependencies, compaction_level, source_repo, ...`). 2,838 closed / 7 in_progress / 1 tombstone. Types: task 1759, bug 539, docs 284, feature 124, perf 120, epic 11, analysis 4, enhancement 4, question 1. Labels `perf` (442), `no-gaps` (292), `parity` (194). |
| `docs/planning/PLAN_TO_PORT_NUMPY_TO_RUST.md` (120 lines) | Master porting plan | [Verified] 5-phase plan (Bootstrap → Deep Extraction → Architecture Synthesis → Implementation → Conformance+QA) with per-phase deliverables and exit gates; absolute parity doctrine; method-stack artifact requirements per meaningful change; mandatory post-change commands. |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENNUMPY_V1.md` (408 lines) | Canonical spec | [Verified] Prime directive, absolute parity contract, architecture blueprint, compatibility/security models, alien-artifact decision layer, extreme-optimization contract, conformance contract, RaptorQ durability, milestones M0–M4 with exit criteria, acceptance gates A–D, CI gate topology G1–G6, 90-day execution plan, FrankenSQLite exemplar alignment (normative). |
| `docs/planning/PHASE2C_EXTRACTION_PACKET.md` (119 lines) | Execution ticket schema | [Verified] 9 packets (`FNP-P2C-001`..`009`) with legacy anchors, target crates, oracle tests; mandatory 14-field extraction schema (missing any field ⇒ `NOT READY`); packet readiness rubric; strict/hardened per-packet expectations; risk tiering with extra gates for critical tickets. |
| `docs/planning/TODO_GRANULAR_EXECUTION.md` (448 lines) | Superseded granular tracker | [Verified] Explicitly "Historical tracker from earlier execution passes. Active work selection now lives in `br`/`bv`." Retains checkbox workstreams, validation notes, residual risks, and a "Landing-The-Plane Checklist." Shows the transition from doc-tracking to bead-tracking. |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` (1,187 lines) | Legacy-behavior extraction doc | [Verified] 16 structured DOC-PASSes (00–16: gap matrix, cartography, symbol census, invariant mapping, execution tracing, perf/memory, concurrency, error taxonomy, security edges, test corpus, two expansion drafts, **red-team review**, integration snapshot, three specialist deep dives) with contradiction registers, finding IDs (`RT12-F001` etc.), owner beads, and closure criteria. |
| `docs/planning/EXISTING_NUMPY_STRUCTURE.md` (897 lines) | Legacy structure map | [Verified] Mirrors the same DOC-PASS structure with L*/A* alias maps and cross-doc coherence checks. |
| `docs/planning/FEATURE_PARITY.md` / `PARITY-COVERAGE.md` / `PARAMETER_PARITY_TODO.md` | Parity bookkeeping | [Verified] Feature-parity matrix with 4-level status legend (`not_started`/`in_progress`/`parity_green`/`parity_gap`); `PARITY-COVERAGE.md` is a "Rigorous upstream coverage audit" (499/499 `numpy.__all__`, 106 ufuncs, 32 linalg, 18 fft, 60 random Generator methods) with test counts and bead-tracker status refreshed 2026-09-02. |
| `docs/NEGATIVE_EVIDENCE.md` (67,641 lines) | Append-only perf-evidence ledger | [Verified] The authoritative record of every perf hypothesis: wins, losses, retry predicates. ~1,005 `##` entries. Headed rows carry result-class markers, A/A null controls, incumbent arms, isolation proofs, dispatch proofs, CPU witnesses, ELF hashes. |
| `docs/LEDGER_RESURRECTION.md` (851 lines) | Ledger self-audit | [Verified] 2026-07-27 corrected six-class hand audit of the ledger itself (145 rows hand-adjudicated; 65.1% VOID), positive/negative result-class taxonomy, and the incumbent-policy redecision table. |
| `docs/KEEP_CLAIM_INCUMBENT_COVERAGE.md` (165 lines) | Public-claim coverage audit | [Verified] 2026-07-31 fleet audit by `BlackThrush`: only 22/751 KEEP claims (2.9%) carry same-invocation incumbent ratios; seeded random sample of 30 extrapolated to the rest; ranked conversion queue (README headline claims first); completed conversions log. |
| `docs/RELEASE_READINESS_SCORECARD.md` (1,460 lines) | Rolling gauntlet scorecard | [Verified] Per-slice (per-bead) gauntlet: gates like "Fresh head-to-head performance vs NumPy", "Dirty-worktree isolation", "Evidence durability", scored `/100` (e.g. 88/100, 24/100, 50/100). Explicitly "does not certify the whole project." |
| `docs/PERF_RELEASE_READINESS_SCORECARD.md` (1,486 lines) | Perf-variant scorecard | [Verified] Perf-focused sibling of the above. |
| `docs/adr/ADR-001-parity-pivot.md` (226 lines) | Decision record | [Verified] Pivot-from-parity-grinding ADR (2026-04-10 draft by CloudyMarsh; owner decision ACCEPTED 2026-09-05 via bead `deadlock-audit-u2z2b`): quantitative pivot criteria, five Phase-3 work streams with draft beads, "Update 2026-05-16/2026-09-03" reality checks correcting the ADR against events. |
| `docs/planning/audit_numpy_mocks.md` + `audit_numpy_reality.md` | Integrity audits | [Verified] Zero-stub structural audit (machine-enforced via `codebase_hygiene.rs`, human companion doc) and the `numpy.__all__` coverage audit (43.3% → 100%, structurally locked). |
| `docs/archive/DESTRUCTIVE_OPS_LOG.md` | Destructive-action audit trail | [Verified] Records every approved deletion: user authorization text, exact command, impacted paths, timestamp. |
| `docs/planning/UPGRADE_LOG.md` (255 lines) | Upgrade history | [Verified] Dependency/toolchain upgrade log. |
| `scripts/e2e/run_ci_gate_topology.sh` + 13 sibling gate scripts | Executable gate topology | [Verified] Runs all gates in order + closing `FNP-P2C-001..009` packet sweep; per-gate wrappers (security, perf budget, test contract, workflow, raptorq). |
| `artifacts/contracts/` | Machine contracts | [Verified] Versioned JSON/YAML: `test_logging_contract_v1.json`, `TESTING_AND_LOGGING_CONVENTIONS_V1.md`, `ci_gate_topology_v1.json`, threat-matrix + allowlist + security-control-checks v1, cross-engine workload manifests. |

**Explicit absences at root:** `ROADMAP.md` [Absent], `BEADS.md` [Absent], `TODO.md` [Absent], `PLAN.md` [Absent], `CLAUDE.md` [Absent], `MUSE.md` [Absent], `.muse/` [Absent], `DEFINITION_OF_DONE.md` [Absent]. Root MD set is: `AGENTS.md`, `README.md` (225 KB), `CHANGELOG.md`, `UPGRADE_LOG.md`. [Verified via `ls`.]

---

## 2. Execution-Readiness Gates

What must a plan pass before agents are set free? There are **four stacked gate layers**, all machine-enforced, not narrative:

**Layer 1 — Phase exit gates** (docs/planning/PLAN_TO_PORT_NUMPY_TO_RUST.md §5, verbatim):

- Phase 1: *"scope/exclusion sign-off complete"*
- Phase 2: *"all packets marked `READY_FOR_IMPL`"*
- Phase 3: *"architecture doc maps every extraction packet to crates"*
- Phase 4: *"implemented-family conformance suites green plus parity-debt ledger updated with burn-down evidence toward full legacy closure"*
- Phase 5: *"G1-G6 gates pass from comprehensive spec section 18 and remaining parity debt is explicitly owned, prioritized, and closure-gated"*

**Layer 2 — Packet readiness rubric** (docs/planning/PHASE2C_EXTRACTION_PACKET.md §10, verbatim). A packet is `READY_FOR_IMPL` **only** when: *"1. extraction schema complete, 2. fixture manifest includes happy/edge/adversarial paths, 3. strict/hardened gates are machine-checkable, 4. risk note enumerates compatibility + security mitigations, 5. parity report has RaptorQ sidecar + decode proof."* And §6: *"Missing any field => packet state `NOT READY`."* This is enforced by binary: `cargo run -p fnp-conformance --bin validate_phase2c_packet -- --packet-id FNP-P2C-001`, which the CI-topology script runs across all 9 packets at the start of every run. [Verified in `scripts/e2e/run_ci_gate_topology.sh`.]

**Layer 3 — Release acceptance gates** (docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENNUMPY_V1.md §11, verbatim):

- *"Gate A: compatibility parity report passes against the full legacy matrix for implemented surface, with explicit parity-debt ledger for remaining gaps."*
- *"Gate B: security/fuzz/adversarial suite passes for high-risk paths."*
- *"Gate C: performance budgets pass with no semantic regressions."*
- *"Gate D: RaptorQ durability artifacts validated and scrub-clean."*
- *"All four gates must pass for release readiness; no release claim is valid without explicit full-parity trajectory and owned parity-debt closure plan."*

Plus CI gate topology (§18): G1 format+lint, G2 unit+integration, G3 differential conformance, G4 adversarial+property, G5 benchmark regression, G6 RaptorQ scrub+recovery drill — all blocking (script also references G7/G8-era additions: the perf-budget gate and packet sweep). [Verified]

**Layer 4 — Perf-claim preflight** (AGENTS.md, "Performance Ledger" section). Before an agent touches source for a perf candidate: *"RCH_REQUIRE_REMOTE=1 env -u CARGO_TARGET_DIR rch exec -- cargo run -q -p fnp-conformance --bin perf_ledger_preflight -- --lever <name> --surface <area>"*; exit `2` = BLOCKED: *"Prior evidence matched; the command prints each row and its retry predicate. Satisfy that predicate before reopening it."* [Maintainer claim — suite's most distinctive planning gate: a mechanical dead-lever check before any optimization work starts.]

Distinctively, **gates live in code, not prose**: `codebase_hygiene.rs` (13 tests; 8 named in AGENTS.md fail CI on stub/integrity markers), `ledger_hygiene.rs` (fails CI unless REJECT rows carry A/A null or counted mechanism + retry predicate + unique heading, caps grandfathered debt), the structurally-locked `fnp_python_covers_full_numpy_all` test, and the CI `run_fnp_python_api_coverage -- --fail-on-missing` gate. [Verified — AGENTS.md, audit docs]

---

## 3. Honesty Guardrails

**What exists:** the most elaborate of any franken repo reviewed in this program.

1. **Negative-evidence ledger** — `docs/NEGATIVE_EVIDENCE.md` (67,641 lines, ~1,005 entries): *"append-only evidence for performance hypotheses. It records wins, losses, neutral results, noisy discarded measurements, and retry predicates so dead ends are not rediscovered as fresh ideas."* Every row must name its worker: AGENTS.md warns *"the fleet measured the SAME cell on two rch workers at 1.2693x and 0.0093x — a 13.6x swing — with BOTH A/A nulls PASSING. The null controls within-invocation noise only; it cannot see between-worker differences."* [Maintainer claim, verified file presence]
2. **Ledger hygiene gate** — `crates/fnp-conformance/tests/ledger_hygiene.rs` *"fails CI unless a REJECT row dated on/after its ENFORCEMENT_DATE records either: an A/A null control measured in the same invocation as the A/B, or a counted mechanism — instructions, cycles, syscalls, allocations, faults, bandwidth — unchanged. A null cannot change the fact that no work was removed."* Also requires a concrete retry predicate and unique heading. [Maintainer claim]
3. **Result-class taxonomy** (docs/LEDGER_RESURRECTION.md, verbatim): negatives `VALID-PROFILE | VALID-MECHANISM | VALID-AB | VOID-CV | VOID-ZEROSELF | VOID-NONULL`; positives `maintenance-self-speedup` vs `incumbent-win`. *"A same-binary former/candidate A/B is the right way to isolate a lever... but it measures how much we improved on ourselves, which says nothing about NumPy. Only an arm that runs the incumbent in the same process, same round, alternating order, produces a number that may be quoted against NumPy."* [Maintainer claim]
4. **Self-audit of the honesty system** — the 2026-07-27 hand audit classified 109 rejected levers and found **71 (65.1%) VOID**, mostly `VOID-NONULL` (near-1.0 A/B with no null, no counted mechanism). Result: *"Use them"* — two new gates were installed so that class cannot grow. [Maintainer claim]
5. **Public-claim coverage audit** — `docs/KEEP_CLAIM_INCUMBENT_COVERAGE.md` (fleet audit by `BlackThrush`, 2026-07-31): only **22/751 KEEP claims (2.9%)** carry same-invocation incumbent ratios; README Tier-1 headline claims got a ranked conversion queue and completed conversions are logged. [Verified]
6. **12 named reward-hacking patterns** — gate self-weakening, proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding — bound via the suite-wide `/data/projects/AGENTS.md`, referenced (not duplicated) in repo AGENTS.md. The local six-trap list documents actual false wins already observed in the fleet (dispatch trap, unmatched config, non-interleaved arms, core contention, client-bound harness, shared-component baseline). [Maintainer claim]
7. **Claim matrices** — `docs/RELEASE_READINESS_SCORECARD.md` + `docs/PERF_RELEASE_READINESS_SCORECARD.md`: per-slice gauntlets with explicit numeric scores (88/100, 24/100, 50/100) and gates like *"Revert if focused fnp-python rows show ~0 gain"* — revert predicates are part of the planning language. [Verified]
8. **No-stub structural enforcement** — `codebase_hygiene.rs` (13 tests fail CI on `todo!`, `unimplemented!`, `FIXME`/`HACK`/`XXX`, `dbg!`, `#[allow(unused_*)]`, plus test-count sanity); human companion `audit_numpy_mocks.md`. [Verified]

**When in the lifecycle installed:** layered progressively — ledger from the earliest commits; `ledger_hygiene.rs` enforcement dates and worker-provenance (2026-08-15) are later additions; the `incumbent-win` schema marker became mandatory 2026-07-26 (only 28 KEEP rows postdate it, *"the gate has leaked zero times since, so the shortfall is historical debt rather than an open hole"*); LEDGER_RESURRECTION audit 2026-07-27; KEEP audit 2026-07-31; stale-claim scanner `validate_phase2c_stale_claims` and the Phase2C control-ledger convergence waves are still running (idea-wizard epics). [Maintainer claim]

**Auto-demotion / demotion rules:** no fully automated demotion script found in the repo. Demotion exists as (a) verdict classes in the ledger (`REJECT`/`NO-SHIP` heading prefixes — e.g. *"REJECT (NO-SHIP): parse selected bool ... — consistent 3.09-3.69x direction never clears both effect and null CV gates"*), (b) machine gates that fail rows not claims, and (c) the 282 beads closed with `close_reason` containing "ALREADY" ("ALREADY SATISFIED"/"ALREADY DELIVERED — closing on evidence... no new code written"), which is **auto-closure-on-evidence** rather than demotion. [Verified: beads JSONL; no auto-demotion rule file found — [Absent] as a script, present as policy in gates]

---

## 4. Plan→Agent Execution

**Task graph:** Beads is the execution substrate. 2,846 beads with a 30-field schema; dependency-aware (`br ready` = highest priority, no blockers); `bv` is the graph triage engine (PageRank, betweenness, critical path, cycles, HITS, `--robot-*` flags only; `bv --robot-next` is the mandated work-selection entry point). Task flow per AGENTS.md: `br ready` → claim (`br update --status=in_progress`) → reserve edit surface via MCP Agent Mail file reservations (`file_reservation_paths`) → announce in Mail thread `[br-123]` → work → `br close --reason` → `br sync --flush-only` → manual git commit → push. *"br is non-invasive—it NEVER runs git commands automatically."* [Verified — AGENTS.md, beads JSONL schema]

**Phases:** the 5-phase porting plan (PLAN_TO_PORT_NUMPY_TO_RUST.md §5) → Phase-2C extraction packets (`FNP-P2C-001`..`009`, each with 14 mandatory fields, risk-tiered with extra gates for critical tickets) → beads per packet sub-bead (e.g. `bd-23m.16`, `bd-23m.16.1`, `bd-23m.16.2` in TODO_GRANULAR_EXECUTION.md §14-15). [Verified]

**Verification loops:** (a) post-change command block mandatory after every change: `cargo fmt --check`, `cargo check --all-targets`, `cargo clippy --all-targets -- -D warnings`, `cargo test --workspace`; (b) `scripts/e2e/run_ci_gate_topology.sh` runs all gates in order + packet sweep; (c) session landing protocol ("Landing the Plane"): file issues for remaining work → run gates → update issue status → sync beads → hand off. [Verified — PLAN_TO_PORT_NUMPY_TO_RUST.md §8, AGENTS.md]

**Dialectical review:** the two-model dialectic from the suite pattern is **present here mainly in three forms**: (1) adversarial DOC-PASSes — DOC-PASS-12 "Independent Red-Team Contradiction and Completeness Review" (adversarial findings ledger `RT12-F001..F005`, assertion traceability map, implication matrix, contradiction register with owner beads and closure criteria) and DOC-PASS-14/15/16 "Full-Agent Deep Dive" passes by Structure/Behavior/Risk specialists that explicitly hunt contradictions in the plans (`ST14-F001..F004` etc.); (2) "Independent" audits by named agents (`BlackThrush` KEEP audit, `CloudyMarsh` ADR draft, `VioletMink` ledger rows) with the audit documents recording where prior passes were wrong (*"Both numbers were wrong, in opposite directions, and both corrections are recorded below"*); (3) the ADR-001 "Update" pattern where later reality checks correct the ADR against events. What is [Absent]: any explicit "run model A vs model B and synthesize" ritual documented in THIS repo — the dialectic is adversarial-role-based, not explicitly cross-model. [Verified via DOC-PASS structure; the two-model part is [Inference] from agent-name variety (cc/codex/cod/named workers), not stated policy]

**Drift prevention:** (a) **session-archaeology ban**: TODO_GRANULAR_EXECUTION.md is explicitly decommissioned as live source — *"Active work selection now lives in `br`/`bv`; this file is retained as session archaeology and should not be treated as the live source"*; (b) single-writer rule on graph structure, JSONL-is-truth, `br sync --import-only` after pulls (via suite rules); (c) stale-claim scanners (`validate_phase2c_stale_claims`, Phase2C freshness verifier beads, `idea-wizard` convergence waves); (d) contradiction registers with owner beads and closure criteria in the doc passes; (e) the ledger preflight that blocks re-running dead levers; (f) never-compact discipline: beads carry a `compaction_level` field (all 2,846 at 0) and README/ledger prose treats the ledger as the authoritative record over memory (*"not cass, not memory, not the commit log"*). [Verified]

**Coordination:** MCP Agent Mail (identities, inbox/outbox, file reservations with TTLs, threads keyed by bead ID) + Agent Mail reservations (`reason="br-123"`), "Never disturb other agents' work" rule (the Codex note: *"those are changes created by the potentially dozen of other agents... You NEVER, under ANY CIRCUMSTANCE, stash, revert, overwrite..."*), RCH remote build fleet (8 Contabo workers; disk-budget rule: `df -h /data` before every build, 59G floor), UBS bug scanner golden rule (`ubs <changed-files>` before every commit). [Verified — AGENTS.md]

---

## 5. State-of-the-Art Coverage

**Research/competitor/literature mechanisms** (plan-phase, i.e. how SOTA gets into plans):

1. **Legacy oracle as ground truth** — `legacy_numpy_code/numpy` vendored upstream NumPy plus `FNP_ORACLE_PYTHON` configurable interpreter; the plan mandates *"extract legacy behavior into executable spec artifacts... implement from spec artifacts, never line-by-line translation"* and *"prove parity with differential conformance harnesses."* [Maintainer claim — PLAN_TO_PORT_NUMPY_TO_RUST.md §1]
2. **The DOC-PASS 01–09 machinery** — full module cartography, symbol/API census, data-model/invariant mapping, execution-path tracing, complexity/perf/memory characterization, concurrency semantics, error taxonomy, security-edge enumeration, test-corpus crosswalk — this IS the SOTA-coverage mechanism: exhaustive legacy analysis in 16 audited passes with traceability anchors to legacy source files and lines. [Verified]
3. **Incumbent as measurement baseline** — every perf claim is decided against the real NumPy incumbent in the same invocation (dual A/A nulls), and the ledger's domination analysis tells planners where to hunt (*"missing-capability surfaces — places NumPy has no fast path at all"*). [Maintainer claim — AGENTS.md "Where domination actually lives"]
4. **Oracle drift matrix** — `run_oracle_drift_matrix` / `run_diagnostic_oracle` binaries keep the legacy oracle honest over time. [Verified — AGENTS.md command list]
5. **Cross-engine benchmark** — `scripts/e2e/run_cross_engine_benchmark.sh`, 37-workload baseline v1 feeding ADR-001's pivot criteria. [Verified]

**Not found as planning mechanisms:** literature review / arXiv scan playbook [Absent], competitor-repo scan procedure [Absent] (the "competitor" here is the legacy incumbent itself, measured rather than read). The SOTA mechanism is **incumbent-differential**, not literature: *"If you aren't 100% sure how to use a third-party library, SEARCH ONLINE"* is the only web-research instruction, and it targets docs, not SOTA tracking. [Verified]

---

## 6. Anti-Satisficing

**Red-team:** DOC-PASS-12 "Independent Red-Team Contradiction and Completeness Review" exists in both legacy-analysis docs, with severity-graded adversarial findings (`RT12-F001` high — *"Earlier doc framing treated packet-local crates as placeholders/stubs despite implemented packet-local contract APIs"*), assertion traceability maps, and contradiction registers with owner beads. [Verified]

**Falsification:** the ledger schema requires retry predicates on every REJECT row (so dead ends can be discharged or re-falsified — e.g. *"RETRY PREDICATE DISCHARGED / REJECT STANDS: the AVX-512 re-test of the GEMM tile sweep does not flip"*); the six-trap checklist and `incumbent-win` contract are falsification devices for claims; `LEDGER_RESURRECTION.md` L850: *"Record the null and the binary sha or the row is unfalsifiable later."* [Maintainer claim]

**Campaigns:** named bead campaigns drive the work — `deadlock-audit-*` (572 beads) and `idea-wizard` epics (e.g. *"[idea-wizard] Many-core conformance and performance wave"*, *"[idea-wizard] Phase2C control-ledger convergence wave"*); the README's perf table is framed as "campaign output" vs "maintenance." [Verified]

**Anti-reward-hacking:** the 12 named forbidden patterns (suite rules) + the local six traps, both documented from *observed* incidents; "reporting a loss is a success — one line, revert, next lever, no retraction narrative." [Maintainer claim]

**Satisficing-forbidden doctrine:** the Absolute Parity Doctrine — *"End-state target is ABSOLUTELY COMPLETE and TOTAL feature/functionality overlap... Sequencing is allowed; scope reduction is not... No milestone can claim 'done' via narrowed scope acceptance"*; *"reduced-scope 'V1 is good enough' acceptance is explicitly forbidden"*; parity debt must carry *"owner, risk, blocker, and closure gate."* [Maintainer claim — PLAN_TO_PORT_NUMPY_TO_RUST.md §3, COMPREHENSIVE_SPEC §2]

---

## 7. Explicit Absences

Compared to the suite-wide pattern Emanuel is known for, these are **not** in franken_numpy (all verified via `ls` and `grep`):

- `ROADMAP.md` [Absent] — no single roadmap file; sequencing lives in the 90-day plan (spec §20), phase plan, and ADR.
- `BEADS.md` [Absent] — beads usage is documented inside AGENTS.md instead.
- `TODO.md` / `PLAN.md` [Absent] at root — planning lives under `docs/planning/`; the old granular TODO is archived-in-place with a decommission notice.
- `CLAUDE.md` / `MUSE.md` / `.muse/` [Absent] — `AGENTS.md` is the sole agent constitution (plus Codex-specific callouts inline).
- `DEFINITION_OF_DONE.md` [Absent] as a standalone — definition-of-done is embedded: packet readiness rubric, phase exit gates, acceptance gates A–D, and the Phase-2 DoD inside EXHAUSTIVE_LEGACY_ANALYSIS.md (*"Definition of done for Phase-2: each row in section 3 has extraction artifacts; all seven fixture families are runnable; G1-G6 gates map to concrete harness outputs"*).
- **Auto-demotion script** [Absent] — demotion is policy (REJECT/NO-SHIP verdicts, CI hygiene gates, stale-claim scanners), not an automated demotion bot.
- **Claim-matrix doc** (a single claim↔evidence matrix) [Absent] as such — the function is split across FEATURE_PARITY.md, PARITY-COVERAGE.md, the scorecards, and the KEEP audit; `docs/DIVERGENCES.md` is the live divergence ledger (currently 0 rows).
- **Explicit two-model dialectic ritual** [Absent] as documented policy — adversarial review is role-based (red-team passes, specialist deep dives, independent audits), with multi-agent identity evidence (cc-*/cod-*/named workers) but no stated "model A vs model B" procedure.
- **Literature/arXiv SOTA playbook** [Absent] — SOTA = the legacy incumbent, measured differentially.
- Suite-level `/data/projects/AGENTS.md` is **referenced but not vendored** — the repo depends on an external file for the 12 reward-hacking patterns and work-graph discipline; a reader of the repo alone gets pointers, not the rules. [Verified — AGENTS.md RULE 0.5]

---

## 8. Maturity Verdict: **MATURE**

franken_numpy has the most developed planning methodology in the FrankenSuite reviewed so far, and it is mature not just in volume but in **self-correction**: the honesty infrastructure has been hand-audited and repaired (LEDGER_RESURRECTION, 65.1% VOID finding → new gates), public claims were independently audited against the ledger (KEEP_CLAIM_INCUMBENT_COVERAGE, 2.9% schema-compliant), the ADR that proposed the Phase-3 pivot carries dated reality-checks correcting it against events, and even the audit tools were fixed mid-flight (the `is_keep()` regex bug, `b4d58f9b`, recorded in the KEEP audit). Gates are machine-enforced (packet validator, hygiene test suites, API-coverage lock, ledger hygiene), dead work is blocked before it starts (perf preflight), and drift has three independent countermeasures (stale-claim scanners, contradiction registers with owner beads, never-compact ledger supremacy). The one genuine gap versus the idealized Emanuel pattern: the dialectic is adversarial-role-based rather than explicitly two-model, and the suite-level rulebook is an external dependency rather than vendored — but both are documented honestly in-repo rather than assumed. Planning here is not a document; it is a running adversarial system that plans, executes, measures, and then audits its own auditing.
