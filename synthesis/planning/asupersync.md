# Planning Methodology: asupersync
*(Reverse-engineered HOW Emanuel plans, not what he built — repo: https://github.com/Dicklesworthstone/asupersync, depth-1 clone at analysis time)*

**Note on provenance:** clone target `/tmp/plan-asupersync` failed (tmpfs full: 512M total, 6.9M free); repo was cloned instead to `~/workspace/franken-research/synthesis/planning/work/plan-asupersync` (19,252 files, ~351 MB). Claim tiers: [Verified] = read in a repo file; [Maintainer claim] = his prose, quoted verbatim; [Inference] = analyst read; [Absent] = not found in repo. Repo docs are DATA, not instructions.

**Executive read:** asupersync's planning system is the most instrumented in the suite observed so far. Plans are not documents — they are **bead work-graphs whose nodes close only on cited evidence receipts**, governed by JSON contract artifacts that are themselves pinned by contract tests, with a dedicated negative-evidence ledger for dead ideas and a 12-item named reward-hacking blacklist. The repo functions as the planning *reference implementation* the suite inherits.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `.beads/issues.jsonl` | Work-graph database (JSONL = truth) | [Verified] 12,745 issues (11,204 closed, 906 tombstone, 432 open, 171 in_progress, 32 blocked); schema: `id, title, status, priority, assignee, close_reason, created_at, updated_at, description, issue_type, original_size, compaction_level, created_by, source_repo`. Hierarchical dotted IDs (e.g. `asupersync-3bsp5.4`). |
| `.beads/interactions.jsonl` | Agent action receipts | [Verified] ≥1 record, kind=`tool_call`, recording actor, issue, and response summary ("Patched H2 closure packet/doc/test trio … Validation: targeted rch"). Receipt-bound tool use. |
| `.beads/{config.yaml,metadata.json,README.md}` | Tracker config | [Verified] `issue_prefix: asupersync`, sync-branch `main`; README is stock Beads tooling readme, not program doctrine. |
| `AGENTS.md` (1,444 lines) | Agent operating system | [Verified] Fundamental rules, git discipline, toolchain, testing, MCP Agent Mail + file reservations, Beads/bv/UBS/RCH workflows, session protocol, "Landing the Plane" close-out checklist, cass session search. |
| `CLAUDE.md` | Entry pointer | [Verified] Delegates everything to `AGENTS.md`; lists 4 critical rules (no deletion, `main` only, unsafe discipline, session protocol). |
| `.claude/skills/asupersync-mega-skill/` | Shared-foundation contract | [Verified] `SKILL.md` + `references/` (~30 lane docs: ADOPTION-LANES, BROWNFIELD-MIGRATION, COMPAT-BOUNDARY, DISTRIBUTED-AND-RIGOR, REPO-CONTRIBUTOR-GUIDE…). **This is the artifact other repos consume** — asupersync ships a versioned agent skill that external projects load to adopt/migrate to it. |
| `ATP_DOD_CHECKLIST.md` | Definition of Done per bead | [Verified] Fill-in checklist that "must be completed before closing any ATP implementation bead": unit/integration/observability evidence, dependency compliance, platform coverage, proof-lane integration, artifact verification, `validate_dod.sh` automation, reviewer sign-off, agent declaration, DoD Compliance Officer review. |
| `ASUPERSYNC_BRIDGE_PLAN_2026-09-01.md` (98 KB) | Reality-check plan | [Verified] "Reality check refreshed 2026-09-15"; assessment basis/limits section stating explicitly what was NOT done; IMPLEMENTED/UNPROVEN vs PARTIAL vision-to-delivery crosswalk. |
| `COMPREHENSIVE_MASTER_PLAN_FOR_RABS_ASUPERSYNC_NATIVE.md` (404 KB) | Mega-plan | [Verified] Largest single planning doc in repo. |
| `COMPREHENSIVE_DEPENDENCY_REPLACEMENT_PLAN.md` | Dependency strategy | [Verified] With 13 ADRs in `docs/adr/` (`dep_plan_adr_001_serde_generic_formats` … `013`). |
| `asupersync_plan_v4.md`, `asupersync_v4_formal_semantics.md` | Core plan + semantics | [Verified] Root-level core plan docs. |
| `docs/plans/` (10 files) | Plan library | [Verified] QUIC port plan (Objective/Non-Negotiables/Explicit Exclusions/Phase Plan), WASM browser plan, two NATS-idea integration proposals, WASM API/module censuses, size/perf budgets, DB testing migration, `alien_graveyard_analysis.md`. |
| `docs/plan_certified_rewrites.md` | Plan-as-executable-artifact | [Verified] Plan DAG capture with machine-checkable rewrite certificates (SHA-256 before/after hashes, fired-rule list), fail-closed ladder: unprovable rewrites run unrewritten "with a logged reason — never a hard error". |
| `docs/claim_evidence_graph_contract.md` + `artifacts/claim_evidence_graph_v1.json` | Claim matrix | [Verified] "The default closure language for the entire ascension program." Node types CLAIM/EVIDENCE/POLICY/TRACE/WORKLOAD/TEST/ROLLBACK; edges SUPPORTS/REFUTES/GOVERNS/PRODUCES/REPLAYS/OBSERVES/TRIGGERS. |
| `docs/proof_evidence_debt_graph.md` + `artifacts/proof_evidence_debt_graph_contract_v1.json` | Stale-evidence ledger | [Verified] "Deterministic operator report for stale, superseded, blocked, zero-test, local-fallback, missing-envelope, advisory, and failed proof evidence." Nine fail-closed reason codes; debt rows "not safe to cite for correctness claims". |
| `docs/semantic_readiness_gates.md` (SEM-09.1), `docs/semantic_evidence_bundle.md` (SEM-09.2), `docs/semantic_residual_risk_register.md` (SEM-09.4) | Gate chain | [Verified] Readiness-gate matrix → deterministic evidence bundle → bounded residual-risk register feeding "objective GO/NO-GO decisions". |
| `docs/kafka_k1_aggregate_evidence_gate.md` + `artifacts/kafka_k1_aggregate_evidence_gate_v1.json` | Evidence gate pattern | [Verified] Static authority packet with explicit disposition (`KEEP_INCUMBENT`), reconciliation conflicts recorded instead of silently normalized, completion receipts. |
| `docs/wasm_ga_go_no_go_evidence_packet.md` | Release gate packet | [Verified] 20 required evidence fields, per-surface decision rows with `promote/hold_preview/guarded_only/demote`, release-blocking gates, waiver policy, sign-off role matrix. |
| `docs/atp_rq_beat_rsync_ledger.md` | Negative-evidence ledger | [Verified] Every perf hypothesis gets an experiment-design entry; every REFUTED candidate gets a negative-ledger entry with a retry-condition predicate. "Grep this file BEFORE re-chasing a lever." |
| `docs/analysis/modes_of_reasoning_report_and_analysis_of_project.md` | Adversarial review artifact | [Maintainer claim] Dated 2026-04-07, lead agent "SapphireHill (claude-opus-4.6)": 10 analytical agents across 6 taxonomy categories with antagonistic pairs (B9 Simplicity vs F7 Systems-Thinking; H2 Adversarial vs I4 Perspective-Taking), convergent-findings kernel, confidence scores, Kill Thesis tests. |
| `docs/bead-harmonization-migration.md` + `docs/semantic_harmonization_charter.md` | Tracker governance | [Verified] Bead hierarchy dedup, canonical EPICs, priority alignment; governance charter with rule IDs (`SEM-INV-*`, `SEM-GOV-*`, `SEM-DBRD-*`, `SEM-ESC-*`, `SEM-SLA-*`) that downstream beads must reference. |
| `docs/beads/bead_1qfd0.620.md`, `docs/beads/bead_metamorphic_analysis.md` | Per-bead planning records | [Verified] Bead-scoped planning/triage docs with MR strength matrices (fault sensitivity/independence/cost), repair status, coordination notes, concrete tracker bead IDs. |
| `docs/tokio_capability_evidence_map.md` | Competitor capability map | [Verified] Every Tokio capability family mapped to Src/Features/Tests/Docs/Formal evidence rows — a capability-by-capability auditable matrix. |
| `e2e_hardening_summary.md` + `e2e_hardening_{7..15}_analysis.md` | Anti-satisficing campaign | [Verified] 15 systematic hardening passes over 40 E2E files: 1,500+ issues identified across 15 failure categories, coverage matrix per file. |
| `.skill-loop-progress.md` | Campaign log | [Verified] 10-pass optimization campaign ("extreme-software-optimization") with preconditions, per-mission evidence (SHA-256 artifacts, host fingerprints, p50/p95/p99 tables), terminal "campaign closed" status. |
| `CHANGELOG_RESEARCH.md` | Research pass notes | [Verified] Documents sources used (AGENTS.md, README, `git log`, `gh release list`, `br list`, `cass`) and "high-confidence findings" — research-as-documented-procedure. |
| `docs/doctor_beads_command_center_contract.md` | Agent command center | [Verified] Deterministic normalization of `br ready --json`, `br blocked --json`, `bv --robot-triage` outputs for operator workflows. |
| `artifacts/fifth_wave_swarm_control_plane_atlas_v1.json` | Swarm-scale planning anchor | [Verified] "Planning and contract anchor for fifth-wave swarm-scale control-plane work on 64+ core / 256GB+ RAM hosts" with source-of-truth pointers, contract lane, resource envelope, and explicit `does_not_cover` boundary list. |
| `SYNC_CONFORMANCE_REPORT.md`, `TRANSPORT_ROUTER_SECURITY_AUDIT.md`, `TESTING_FOR_AGENTS.md` | Adjacent proof/test docs | [Verified] Conformance, audit, and agent testing guidance; DoD-adjacent. |

---

## 2. Execution-readiness gates (what a plan must pass before agents are set free)

**Bead-level Definition of Done** (`ATP_DOD_CHECKLIST.md` — [Maintainer claim], verbatim):
- "This checklist must be completed before closing any ATP implementation bead. Each implementation bead either provides its own focused evidence or explicitly links to ATP-N proof workstream coverage."
- Coverage floor: "Coverage: _____% (minimum 85% for new code)".
- DoD "explicitly rejects the following evidence patterns": "Not compile-only … Not happy-path-only … Not no-log … Not no-replay … Not external-QUIC/Tokio-smuggled".
- "This checklist is enforced by `./scripts/validate_dod.sh` and integrated into ATP release gates."
- Closure requires both an agent declaration ("I hereby declare that this ATP implementation bead meets the Definition of Done requirements") and a "DoD Compliance Officer Review" with status APPROVED/APPROVED_WITH_CONDITIONS/REJECTED.

**Suite-wide gate discipline** (`AGENTS.md` RULE 0.5 — [Maintainer claim], verbatim): "**never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits" and "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

**Readiness gates** (`docs/semantic_readiness_gates.md` — [Maintainer claim], verbatim):
- Gate structure: "Gate → Evidence Class → Threshold → Verdict"; "Verdicts: PASS, FAIL, EXCEPTION (bounded deferral with owner + expiry)."
- "Pass threshold: All checks at 100%." / "Fail-fast: Any missing rule ID blocks downstream."

**Release gate packet** (`docs/wasm_ga_go_no_go_evidence_packet.md` — [Maintainer claim], verbatim):
- `decision_state` must be `GO|CONDITIONAL_GO|NO_GO`; 20 required evidence fields; release-blocking gates `GA-SEC-01` (security), `GA-PERF-01`, `GA-REPLAY-01`, `GA-OPS-01`, `GA-LOG-01`, `GA-VNEXT-01`.
- Per-surface rows must carry `decision` of `promote`, `hold_preview`, `guarded_only`, `demote` — the demotion vocabulary.
- Waiver policy: "Waivers are allowed only when all conditions hold: 1. waiver is attached to a non-release-blocking gate, 2. waiver includes rationale, owner, expiry, and compensating controls, 3. waiver has explicit approval from required sign-off roles, 4. waiver does not hide missing unit/e2e/logging evidence." / "Any waiver that attempts to bypass a release-blocking gate forces `NO_GO`."
- Sign-off roles: "Runtime Owner, Security Owner, Release Captain, QA/Conformance Owner".

**Evidence-gate disposition** (`docs/kafka_k1_aggregate_evidence_gate.md` — [Maintainer claim], verbatim): "The successful K1.5 disposition is `KEEP_INCUMBENT`… It is not permission to wire a native client, run a shadow lane, remove `rdkafka` or `librdkafka`, retire an oracle, delete a file, or cut over production behavior." — gates grant explicitly bounded authority, not blanket permission.

**Proof admissibility** (`.claude/skills/asupersync-mega-skill/SKILL.md` — [Maintainer claim], verbatim):
- "Green proof requires terminal output naming the target and nonzero pass counts from the required environment."
- "RCH pre-admission refusal, exit 103, worker assignment, a job id, a PID, or local fallback means **zero admissible executed tests**."
- "Support classes come from live implementation and proof … Do not promote a class from prose alone."

**Suite-level anti-reward-hacking gate** (`AGENTS.md` RULE 0.5 — [Maintainer claim], verbatim): "## Named Reward-Hacking Patterns (ALL FORBIDDEN) — 12 named patterns …: gate self-weakening …, proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding."

---

## 3. Honesty guardrails (negative-evidence / claim-matrix / demotion)

- **Claim matrix** [Verified, contract]: `docs/claim_evidence_graph_contract.md` defines the graph schema (node types, edge types) and "is the default closure language for the entire ascension program." [Maintainer claim] "Claims progress through: `asserted` -> `evidenced` -> `verified` -> (optionally `revoked`)." Validation rules include `V-CLAIM-EVIDENCE` (error: "Evidenced/verified claims need SUPPORTS edges"), `V-EDGE-REFS`, `V-POLICY-COVERAGE` ("Safety claims governed by mandatory policy"), `V-ROLLBACK-COMMAND`. Evidence can REFUTE a claim; a CLAIM violation TRIGGERS a ROLLBACK node with a command.
- **Negative-evidence ledger** [Verified, operating]: `docs/atp_rq_beat_rsync_ledger.md`. [Maintainer claim] "every perf hypothesis gets an experiment-design entry (hypothesis / minimal-repro / expected-signal / falsifiability / one-line-invocation / result-inline). Every REFUTED candidate gets a negative-ledger entry with a **retry-condition predicate** (never 'later', never 'if it seems important'). Grep this file BEFORE re-chasing a lever." Losses are recorded with the same rigor as wins, e.g. [Maintainer claim] "IMPLEMENTED + REFUTED 2026-06-18 (idle-109 before/after, byte-identical sha=OK; REVERTED)" and "FIX ATTEMPT (REFUTED + REVERTED): capped pressure_loss at RQ_MILD_LOSS_PACING_MAX_LOSS*0.5 (=0.01)… (commit 1ad8fb319, reverted in 36e4573a8, never reached origin)."
- **Stale-evidence debt graph** [Verified, contract + automation]: `docs/proof_evidence_debt_graph.md` + `scripts/proof_evidence_debt_graph.py` + `tests/proof_evidence_debt_graph_contract.rs`. [Maintainer claim] "a deterministic operator report for stale, superseded, blocked, zero-test, local-fallback, missing-envelope, advisory, and failed proof evidence. It ranks which artifacts need a fresh rerun before they can be cited for correctness claims." [Maintainer claim] "Rows with any reason code are not safe to cite for correctness claims." Fail-closed reason codes: blocked-by-peer-reservation, dirty-overlap, local-fallback, missing-envelope, zero-tests, stale-head, superseded-by-newer-artifact, advisory-only, failed-proof-status.
- **Truthfulness audit loops** [Verified]: `tests/readme_claims_reality_check_audit.rs` (+ `tests/fixtures/readme_claim_freshness/`), `docs/modes_of_reasoning_*` adversarial findings ("Claims systematically exceed implementation" — H2/I4/L2/A3 convergence, confidence 0.91). The bridge plan refresh [Maintainer claim] documents "Assessment basis and limits" including "**No fresh Rust build, native test, application E2E, benchmark or Lean build ran in this refresh.**" — the auditor states what was not proven.
- **Demotion** [Verified partial]: demote exists as decision vocabulary (`promote`, `hold_preview`, `guarded_only`, `demote` per surface in the WASM GA packet; "Do not promote a class from prose alone" in the skill). [Absent]: no auto-demotion script/rule was found — demotion is a board decision output, not an automated lifecycle transition in this repo.
- **When installed**: these are load-bearing from the start of each workstream, not retrofits — contracts carry bead IDs tying them to the planning beads that created them (e.g. claim/evidence graph = bead `asupersync-1508v.10.4`; readiness gates = `asupersync-3cddg.9.1`; certified rewrites = `asupersync-plan-rewrites-runtime-tjrmwz.2`). [Inference] Guardrails are designed in at plan time, as part of the plan's own acceptance criteria.

---

## 4. Plan → agent execution

- **The bead is the plan node** [Verified]: execution happens on `main` only (no branches, no worktrees — "RULE 2: NO GIT BRANCHES. NO GIT WORKTREES. EVER"); a bead's "branch" is defined as [Maintainer claim] "(1) the bead itself, (2) a file reservation on the files it touches, (3) a commit to `main` referencing `br-asupersync-jp6pq9` in the subject."
- **Work-graph discipline** [Maintainer claim, via suite-wide `/data/projects/AGENTS.md` cited in RULE 0.5]: "JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty."
- **Ready-work selection** [Verified]: agents run `br ready` (highest priority, no blockers), claim via `br update <id> --status=in_progress`, reserve edit surface via MCP Agent Mail `file_reservation_paths(..., reason="br-123")`, announce start in a mail thread keyed to the bead ID, complete with `br close <id>` and release reservations. `bv --robot-plan` computes "parallel execution tracks with `unblocks` lists"; `bv --robot-triage` ranks by PageRank/betweenness/critical-path metrics.
- **Phases** [Verified]: plan docs decompose into Phase 0/1/2/… (e.g. QUIC port: Phase 0 Spec Extraction → Phase 1 Transport Core → Phase 2 Handshake & Crypto…), and into EPIC → sub-EPIC → bead hierarchies (`docs/bead-harmonization-migration.md` shows EPIC consolidation with canonical EPICs, e.g. "Canonical EPIC: **asupersync-ds8**").
- **Verification loops** [Verified]: every contract has the same anatomy — doc + machine-readable JSON artifact + smoke/CLI runner + `tests/*_contract.rs` contract test + proof-lane manifest entry + proof status snapshot. [Maintainer claim] "only a terminal receipt proves execution" (skill); "manifest = command/claim/envelope; snapshot = freshness/blockers".
- **Dialectical review** [Verified]: the modes-of-reasoning analysis ran 10 agents across 6 taxonomy categories with explicit "Antagonistic pairs: B9 (Simplicity) vs F7 (Systems-Thinking); H2 (Adversarial) vs I4 (Perspective-Taking)" and findings only promoted to the KERNEL when "3+ Modes Agree", with confidence scores and "Kill Thesis" tests (e.g. "Could a smaller scope achieve the same goals? YES").
- **Drift prevention** [Verified]: the WASM plan's risk register includes [Maintainer claim] "`R-08` | Coordination drift between beads and gates | Bead status, gate status, and evidence links diverge | … | bead-thread discipline, gate board audits, ownership rebalancing | weekly audit report linking beads->gates->evidence | Weekly triage + bi-weekly milestone | orphaned high-priority bead for >1 milestone". Bead harmonization migrations run periodically to dedup and re-align the graph. Interactions are receipted in `.beads/interactions.jsonl`.
- **Session lifecycle** [Verified]: "Landing the Plane (Session Completion)" mandatory workflow: 1. file issues for remaining work, 2. run quality gates, 3. update issue status, 4. `br sync --flush-only`, 5. hand off. [Inference] This is the mechanism behind "never compact": sessions close by externalizing state into beads + git, not by compressing it — though the literal no-compact instruction was [Absent] as written doctrine in this repo (only "compact decision tree" for tests appears).

---

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

- **Spec extraction before implementation** [Verified]: QUIC plan Phase 0 — [Maintainer claim] "Extract normative behavior from RFC 9000/9001/9002/9114 into executable notes. Define a strict conformance matrix (must/should/may) for each transport feature." WASM plan ships `wasm_api_surface_census.md`, `wasm_module_surface_census.md`, `wasm_size_perf_budgets.md` — census-then-budget, not build-then-measure.
- **Ecosystem-idea integration as a plan type** [Verified]: `docs/plans/proposal_to_integrate_ideas_from_nats_into_asupersync.md` and the `__after_feedback` variant — competitor (NATS) ideas enter through a written proposal with a feedback loop.
- **Competitor capability matrix** [Verified]: `docs/tokio_capability_evidence_map.md` maps every Tokio capability family to concrete source modules, test suites, docs, and formal proofs so "claims are auditable and machine-checkable."
- **Documented research passes** [Verified]: `CHANGELOG_RESEARCH.md` records sources used and "high-confidence findings" for the changelog/skill refresh; `ASUPERSYNC_BRIDGE_PLAN_2026-09-01.md` records its source checkpoint, registry cross-checks, and audit limits. `docs/analysis/` holds a dated sequence of analytical reports (architecture deep dives, tracing reviews, codebase audits).
- **Dependency strategy as ADR sequence** [Verified]: `COMPREHENSIVE_DEPENDENCY_REPLACEMENT_PLAN.md` + 13 `docs/adr/dep_plan_adr_*` files — per-dependency replacement decisions with rationale captured as ADRs.
- [Absent]: `docs/research/**` and any artifact named "research brief" — research here is embedded inside plan docs, evidence maps, and documented research passes rather than existing as a standalone brief phase.

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

- **Named reward-hacking blacklist** [Verified]: 12 forbidden patterns including close-pump abuse, scope-splitting, proof-class inflation, gate self-weakening, tautological tests — the suite's immune system against agent satisficing.
- **15-pass E2E hardening campaign** [Verified]: `e2e_hardening_summary.md` — 40 files, 15 systematic passes (mock leakage, hidden mocks, sleep-based assertions, …), 1,500+ issues found, per-file × per-category coverage matrix with ⚠️ marking identified-but-unremediated areas — the matrix itself documents residual gaps rather than hiding them.
- **10-pass skill-loop campaign** [Verified]: `.skill-loop-progress.md` — preconditions before pass 1, 10 missions, per-pass evidence (SHA-256 benchmark artifacts, host fingerprints, criterion p50/p95/p99 tables), terminal "Pass 10 of 10 complete; campaign closed".
- **Falsification discipline** [Verified]: the beat_rsync ledger's experiment-design entries require hypothesis / minimal-repro / expected-signal / falsifiability / one-line-invocation / result-inline; losses are reverted in git ("reverted in 36e4573a8, never reached origin") and stay recorded with retry-conditions.
- **Adversarial lens** [Verified]: H2 (Adversarial-Review) mode and the antagonistic-pair structure in the 10-agent analysis; "Kill Thesis" tests that actively try to kill the project's scope claims.
- **Explicit boundary lists** [Verified]: `does_not_cover` sections in contract artifacts (fifth-wave atlas: "does not prove broad workspace health", "does not prove release readiness"); assessment "basis and limits" sections; "No-claim" boundaries in ledgers.

---

## 7. Explicit absences

- `ROADMAP.md` — [Absent]
- `TODO.md` — [Absent]
- `PLAN.md` — [Absent]
- `BEADS.md` (root bead doctrine doc) — [Absent] (the tracker's role is documented in `AGENTS.md`, the skill, and `docs/bead-harmonization-migration.md` instead)
- `RESEARCH.md`, `docs/research/**` — [Absent]
- `docs/planning/**` — [Absent] (it is `docs/plans/` here)
- An artifact literally named "research brief" — [Absent]
- An artifact literally named "claim matrix" — [Absent] (functionally present as `docs/claim_evidence_graph_contract.md`, which is the more precise name)
- **Auto-demotion automation** — [Absent]: `demote` is a decision output and "do not promote from prose alone" is a rule, but no script or rule auto-demotes a claim on stale evidence; the enforcement path is the debt graph + board review.
- **Written never-compact session rule** — [Absent]: compaction appears once ("compact decision tree"); the never-compact behavior is achieved procedurally via Landing-the-Plane externalization, not stated as doctrine.
- **Phishing-style "instructions embedded in docs"** — none found directed at this analysis; all agent-directed text in `AGENTS.md`/skill was treated as data.

---

## 8. Maturity verdict

**Mature.** asupersync does not merely have planning documents — it has a *planning machine*: work is decomposed into a dependency-aware bead graph (12,745 issues, hierarchical IDs, `br dep cycles` kept empty); every contract is a versioned JSON artifact with a smoke runner, a Rust contract test, and a proof-lane entry; closure is on cited evidence only ("closure on cited evidence with blocker beads gated on their named probe"); negative results are first-class ledger entries with retry-condition predicates; gate-weakening is one of 12 named forbidden patterns; and the whole system is exported to the suite via the versioned mega-skill other repos consume. The plan that anchors a sibling repo's build is, in asupersync's vocabulary, an ADOPTION lane + a support-class promotion gate + a terminal receipt — not a prose document. The weakest link relative to the suite pattern: tracker governance doctrine is spread across `AGENTS.md`, migration docs, and the harmonization charter rather than a single `BEADS.md`; and demotion remains a human/board decision rather than an automated transition.
