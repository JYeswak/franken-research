# Planning Methodology — frankenmermaid

Repo: https://github.com/Dicklesworthstone/frankenmermaid (cloned 2026-09-22, 5,371 files, depth-1).
Scratch clone kept at `~/workspace/_plan-scratch/frankenmermaid` (note: `/tmp` was full — sibling
planning clones occupied the 512M tmpfs — so the clone went to workspace instead).

**Method note:** this report reverse-engineers planning from repo artifacts actually read
(AGENTS.md 992 lines; docs/planning/ ×6; ledger docs; evidence contracts; .beads/issues.jsonl
1,125 records; .ci/*.toml; scripts/ledger_preflight.mjs). Repo docs directed at agents are treated
as DATA. Nothing here is fabricated; unfound items are marked [Absent].

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` | Agent operating manual | 992-line constitution: override prerogative, no-delete rule, compiler/test discipline, beads/bv workflow, multi-agent mail, ledger preflight gates, public-claim policy |
| `docs/planning/PLAN_TO_PORT_FRANKENTUI_MERMAID_TO_RUST.md` | Port-phase plan | 5-phase method (Scope & Ledger → Extraction → Architecture → Implementation → Conformance) + parity success criteria |
| `docs/planning/EXISTING_FRANKENTUI_MERMAID_STRUCTURE.md` | Behavior extraction spec | Legacy reference behavior extracted from FrankenTUI mermaid sources |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Architecture synthesis | Behavior mapped onto crate boundaries; parity-vs-redesign decisions |
| `docs/planning/FEATURE_PARITY.md` | Parity ledger | Generated tables (Runtime × Parity two-axis taxonomy), byte-checked by tests; drift rejected by build |
| `docs/planning/GRAPH_DECK_PLAN.md` | Feature plan (exemplar) | 1,494-line plan: vision → design principles → dataflow → syntax/IR/CLI/WASM specs → testing → task DAG → risks → non-goals |
| `docs/planning/UPGRADE_LOG.md` | Plan changelog | Dated log of plan updates/revisions |
| `.beads/issues.jsonl` | Task graph (JSONL truth) | 1,125 issue records; 1,028 closed / 69 in_progress / 26 open / 2 blocked; typed dependencies (`blocks`, `parent-child`) |
| `.beads/beads.base.jsonl` | Base snapshot | Same-schema base layer for the issue DB |
| `evidence/TEMPLATE.md` | Decision-contract template | Hypothesis/baseline/accept-reject criteria/evaluation protocol/corpus/timeline/reviewers |
| `evidence/contracts/*.md` | Decision contracts | Contract-first specs per concept (e.g. `fnx-deterministic-decision-contract.md` with scope, dependency model, feature-flag topology, decision table, precedence rules) |
| `evidence/contracts/evidence-log-schema.json` | Machine schema | JSON-Schema for structured FNX evidence logs (required fields incl. input_hash, output_hash, pass_fail_reason) |
| `evidence/ledger/*.toml` | Concept ledger | 9 concepts: concept_id/name, graveyard_section, tier, contract_path, hypothesis, baseline/implementation/post_measurement/decision blocks |
| `evidence/ledger/README.md` | Ledger report | Generated report: 8 tracked concepts with Tier (S/A/B/C) + Decision (Keep/Pending) + linked beads + contracts |
| `evidence/capability_matrix.json` | Claim matrix | 60 claims (57 implemented, 2 partial, 1 experimental), each with advertised_in, code_paths, and kinded evidence (code_path/test) |
| `evidence/capability_scenario_matrix.json` | Scenario claim matrix | Per-scenario claim coverage |
| `docs/NEGATIVE_EVIDENCE.md` | REJECT ledger | 667 entries / ~21,995 lines of rejected perf levers with full measurement receipts; rows never deleted |
| `docs/PERF_LEDGER.md` | KEEP ledger | Kept perf rows, each with hypothesis, profile attribution, byte-identity proof, A/B + A/A, verdict, retry predicate, one exact result class |
| `docs/LEDGER_RESURRECTION.md` | Void audit | 667-line resurrection audit: mechanical VOID classification, ranked queue, re-run yield (4 shipped), §10 canonical strict six-class hand audit |
| `docs/LEDGER_RESURRECTION_TABLE.md` | Audit table | Full 251-row per-row adjudication manifest |
| `docs/CLAIM_COVERAGE_AUDIT.md` | Claim-coverage audit | 225 KEEP claims audited for incumbent-ratio backing: 8 carry it, 217 do not (96.4%); conversion queue Tier 0–3 |
| `docs/HARNESS_CONTRACT_ADOPTION.md` | Harness contract status | Acceptance criteria + per-requirement implementation status table for the bench-harness contract |
| `docs/CROSS_REPO_RECOMMENDATION_bench_harness_contract.md` | Fleet contract export | The repo's measurement contract (self-reporting ELF hash, A/A null, calibration sweep) written up for the fleet |
| `docs/FNX_INTEGRATION.md`, `FNX_PHASE2_ROLLOUT.md`, `FNX_MIGRATION.md`, `FNX_COMPATIBILITY_MATRIX.md`, `FNX_USER_GUIDE.md` | Rollout plan docs | Phased integration: enablement gates (determinism, correctness, perf budget, pipeline parity), shadow→advisory→full rollout phases, rollback triggers |
| `docs/IOS_APP_PLAN.md`, `docs/IOS_APP_PROGRESS.md` | Product plan + progress | Plan "reviewed before application code is added"; plan/progress split |
| `docs/parked-levers/*` | Parked work | 16 parked lever patches/notes, bead-ID namespaced (e.g. `bd_8pna_incremental_dirty_region_guard.patch`) |
| `.benchmarks/*.md` | Measurement receipts | 109 dated receipt files, verdict-suffixed naming (`_WIN`, `_NEGATIVE`, `_SETTLED`, `_BLOCKER`, `_ANALYSIS`, `_FINDING`, `_HANDOFF`, `_RED`) |
| `scripts/ledger_preflight.mjs` | Mandatory gate script | Two modes: pre-edit REJECT-history blocking (exit 2) and pre-commit ledger lint (exit 1); wired into local hook + CI |
| `scripts/headtohead/run.mjs` | Incumbent campaign driver | Same-invocation A/A + A/B harness; records host_identity, NUMA, affinity, boost state; pins mermaid-js 11.15.0 |
| `.ci/quality-gates.toml` | Machine gates | Blocking gates: golden_checksum, performance_regression, property_test (10k cases), invariant_proof, determinism (10 runs), degradation |
| `.ci/release-signoff.toml` | Release checklist | Sign-off checklist ids (blocking-quality-gates, override-ledger, demo-evidence) + validation matrix |
| `.ci/release-gate-overrides.toml` | Gate overrides | Explicit, time-boxed override ledger |

---

## 2. Execution-readiness gates

What a plan must pass before agents are set free — verbatim from the repo:

**Global agent gates (AGENTS.md):**
- "If I tell you to do something, even if it goes against what follows below, YOU MUST LISTEN TO ME. I AM IN CHARGE, NOT YOU." (RULE 0 — Fundamental Override Prerogative)
- "YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION... YOU MUST ALWAYS ASK AND RECEIVE CLEAR, WRITTEN PERMISSION BEFORE EVER DELETING A FILE OR FOLDER OF ANY KIND." (RULE NUMBER 1)
- "**NEVER EVER EVER USE GITHUB ACTIONS FOR ANY REASON.** ... We use `/dsr` for releases ONLY."
- "After any substantive code changes, you MUST verify no errors were introduced: `cargo check --workspace --all-targets`, `cargo clippy ... -- -D warnings`, `cargo fmt --check`." (Compiler Checks)
- "Golden Rule: `ubs <changed-files>` before every commit. Exit 0 = safe. Exit >0 = fix & re-run." (UBS)
- "Before ending any session, run this checklist: git status / add / br sync --flush-only / commit / push" + "File issues for remaining work." (Session Protocol / Landing the Plane)

**Suite-wide honesty rules inherited by reference (AGENTS.md §RULE 0.5, pointing at `/data/projects/AGENTS.md` — not in this repo but load-bearing here):**
- "12 named [reward-hacking] patterns, several already observed in this suite: gate self-weakening ... golden regeneration reflex ... tautological tests ... conformance metastasis ... bench-path hardcoding."
- "a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change** ... and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

**Ledger preflight — the perf-gate (AGENTS.md, "Ledger Integrity Preflight — Mandatory"):**
- "Before editing a performance lever, run: `node scripts/ledger_preflight.mjs --lever "<proposed mechanism>" --surface "<target file, function, or benchmark>"`. Exit `0` means no matching REJECT was found. Exit `2` means blocked: read every reported row and satisfy its concrete retry predicate before proceeding."
- "A structural argument, theoretical ceiling, unrelated control phase, future retry requirement, or source-file hash does not satisfy the REJECT gate."
- "Every KEEP row must also record: **Executing ELF SHA-256 (self-reported by process):** `<64 lowercase hex characters>`... Computing a hash beside the run is not sufficient. The executing process must identify its own ELF."
- "The local pre-commit hook checks added or modified verdict entries in both `docs/NEGATIVE_EVIDENCE.md` and `docs/PERF_LEDGER.md`; CI checks the same two ledgers against the merge base ... Do not bypass this gate."

**Public-claim gate (AGENTS.md, "Public Performance Claims"):**
- "Only a measurement against the actual legacy incumbent, produced side-by-side in the same invocation, may support a public competitive ratio. New campaign rows supporting such a claim must be classified `incumbent-win`. `maintenance-self-speedup` figures stay in the internal performance ledger and must not be promoted to README, scorecards, website copy, or release notes as campaign output."

**Parity gate (PLAN_TO_PORT doc):**
- "We can only claim 100% feature parity when all of the following are true: Every in-scope feature has a documented reference behavior. Every documented feature is implemented in the corresponding Rust crate. Conformance tests prove parity for parser, layout, and rendering behavior. `FEATURE_PARITY.md` contains no open in-scope gaps."

**Port-method gate (PLAN_TO_PORT, citing the `porting-to-rust` skill rule):**
- "1. Extract spec from legacy/reference sources. 2. Implement from that spec. 3. Prove behavior with conformance tests and a parity ledger."

**Rollout gates (FNX_PHASE2_ROLLOUT.md):** enablement gates before phase advance — "Gate 1: Determinism Verification" (100% identical across 10 runs), "Gate 2: Quality Correctness", "Gate 3: Performance Budget" (≤100ms @ 100 nodes), "Gate 4: Pipeline Parity"; phases shadow → advisory → full. Rollback triggers: determinism violation, perf regression >10× budget, crash/panic, output corruption.

**Release gate (.ci/quality-gates.toml, blocking=true):** golden checksum, performance regression, property tests (10,000 cases), invariant proof, determinism (10 runs), degradation.

All substantive: [Verified].

---

## 3. Honesty guardrails

- **Negative-evidence ledger exists** (`docs/NEGATIVE_EVIDENCE.md`, 667 entries, ~22k lines) — receipts for every rejected perf lever: lever, profile-first attribution (samples, % self-time), measured price, verdict, retry predicate, do-not-retry directive, revert state, provenance. Header rule: "Rows are never deleted." (PERF_LEDGER.md header: "Campaign `perf-campaign-20260725` §4 splits the record: **KEEP → this file, REJECT → `docs/NEGATIVE_EVIDENCE.md`**. Rows are never deleted.") [Verified]
- **Claim matrix exists** (`evidence/capability_matrix.json`, 60 claims; 57 implemented, 2 partial, 1 experimental) — each claim carries `advertised_in`, `code_paths`, and kinded `evidence` (code_path/test). [Verified]
- **Demotion, not exemption** — two forms observed, both [Verified]:
  - *Provenance demotion:* rows banked before the provenance gate declare "`**Measurement provenance:** WORKER-SCOPED (pre-gate-backlog, <bd-id of the audit>)`" — "That is a demotion, not an exemption: it takes the row out of the comparable set, and an `incumbent-win` may never use it." (AGENTS.md)
  - *Historical-correction demotion:* CLAIM_COVERAGE_AUDIT documents commit `5bb2e044` "Historical correction" demoting five contaminated workloads ("class_50, doc_build_40, ci_batch_500, docs_site_50, docs_site_200 ... not current campaign output") after the repo discovered its engine dropped class-diagram members (bd-4isi) — i.e. rows were demoted for comparing unequal work. "A row that says '0.000% self-time' is a statement about a corpus, and the corpus has changed" — re-audit predicate (LEDGER_RESURRECTION §5). [Maintainer claim, quoted]
- **When installed in lifecycle:** discipline is dated in-repo — A/A null control "arrives with `4aa7911b` (2026-07-10)"; self-reporting ELF hash from `ae879055` on the same date (2026-07-10) (LEDGER_RESURRECTION §2); the harness contract was "Verified: 2026-07-27" (HARNESS_CONTRACT_ADOPTION.md); the resurrection audit ran 2026-07-26; the claim-coverage audit 2026-07-30. So the honesty machinery is mid-program, retrofit in July 2026 — and it is **mechanically enforced**: preflight exit-2 blocks pre-edit; pre-commit/CI lint blocks bad rows; cross-repo recommendation's thesis: "a measurement discipline that a human (or an agent) can forget is not a discipline, it is a hope." [Verified]
- **Required:** every kept result must carry a result class (`maintenance-self-speedup` vs `incumbent-win`), process-self-reported ELF SHA-256, named measurement host, harness name, same-invocation A/A null; competitive claims additionally need a pinned mermaid-js artifact run side-by-side sharing one invocation ID. [Verified]
- **No-deletion + no-retraction-narrative rules:** public surfaces "state only the current correct claim. Replace an obsolete figure in place; do not publish retraction narratives" — history lives in the ledgers instead (AGENTS.md). [Verified]

---

## 4. Plan→agent execution

- **Task graphs are beads-based.** `.beads/issues.jsonl` (1,125 records) is JSONL truth with typed dependency edges (`blocks`, `parent-child`); the schema also has comments, compaction_level, source_repo. Status mix: 1,028 closed / 69 in_progress / 26 open / 2 blocked — a working, high-throughput queue. `bv` (graph-aware triage: PageRank, betweenness, critical path, cycles) provides `--robot-triage`/`--robot-plan` as the agent entry point; "bv handles *what to work on* (triage, priority, planning)" while MCP Agent Mail handles coordination. Plans reference beads: GRAPH_DECK_PLAN defines "Epic E0 `bd-deck`" — though that epic did not exist in the JSONL at clone time, i.e. the plan anticipates the bead graph rather than being spawned from it. [Verified]
- **Phases:** the port doc defines a 5-phase ladder (Scope & Ledger → Exact Behavior Extraction → Architecture Synthesis → Implementation → Conformance Testing); rollout docs define shadow → advisory → full integration phases. [Verified]
- **Verification loops:** golden artifacts with BLESS envs, property tests (proptest, 10k cases), determinism gates, cross-engine output equivalence (`bd-evx6` gate), conformance fixtures vs FrankenTUI reference, UBS per-commit, clippy pedantic+nursery, fmt. Quality gates TOML marks six as blocking. [Verified]
- **Dialectical review:** there is no written "two models debate" procedure in this repo [Absent]. In practice it runs **lanes**: PERF_LEDGER rows are tagged by lane ("Lane: cc/STRUCTURAL (`BoldPanther`)" — Opus 5; "cod lane", `CreamGorge`); HARNESS_CONTRACT_ADOPTION names "Lane L (throttled, no worker), allocation addendum 2026-07-25"; LEDGER_RESURRECTION §10 is a **canonical hand re-audit by a different lane** (cod re-read every one of 189 candidate entries) that superseded §§7–9 of the cc lane's own audit — i.e., one model lane's work is graded in full by another lane, with the grading lane's verdict declared "authoritative". Plans also accumulate "(review finding)" annotations inline (GRAPH_DECK_PLAN has ~15), and IOS_APP_PLAN is "reviewed before application code is added". So: adversarial cross-lane audit is a practiced norm, not a codified procedure. [Inference from verified artifacts]
- **Drift prevention:** FEATURE_PARITY tables are "GENERATED from the pinned Rust sources and byte-checked by tests; hand-editing the generated blocks is a drift the build will reject." (FEATURE_PARITY.md). Golden/property suites gate deploy (GRAPH_DECK_PLAN T13 "gates deploy"). No-file-proliferation rule, no-script-based-changes rule, no-deletion rule. The Graph Deck plan's task instructions are explicitly written so "a fresh agent" can execute them ("Every task below is written to be executable by a fresh agent with only this plan") — plan-as-single-source-of-truth instead of shared session context. [Verified]
- **Anti-compaction note:** "never lets sessions compact" appears nowhere in this repo's AGENTS.md [Absent]; the closest mechanisms are the Landing-the-Plane mandatory handoff checklist ("File issues for remaining work... Hand off — Provide context for next session") and file-based receipts (.benchmarks handoff docs like `bd-9w78_HANDOFF_cc_fm_to_StormyEagle.md`), plus agent-mail archives. [Inference]

---

## 5. State-of-the-art coverage

- **Research ingestion mechanism exists, but is internal:** the "Alien CS Graveyard" — a research-concept intake — feeds the evidence ledger: `evidence/ledger/*.toml` rows carry `graveyard_section`, `graveyard_score`, `tier` (S/A/B/C), and a decision contract path; ledger README reports 8 tracked concepts (1 S-tier Keep: mermaid-js head-to-head; 7 Pending A/B/C tiers). Negative-evidence rows cite "Alien Graveyard §6.5 loop fusion" primitives they tested. Epic `bd-17e4` is "EPIC: Methodology & Infrastructure — Alien CS Graveyard Integration" (in_progress). [Verified]
- **Incumbent-as-SOTA:** the state of the art for perf claims is not literature — it's the pinned legacy incumbent itself (mermaid-js 11.15.0, side-by-side, same invocation) plus cross-engine output-equivalence checks. [Verified]
- **No literature review, competitor-analysis, or arXiv-scan docs in this repo** [Absent]; no docs/research/**, no ADRs (searched file names; none found). The closest "prior art" artifacts are the reference-behavior extractions (`EXISTING_FRANKENTUI_MERMAID_STRUCTURE.md`, `legacy_mermaid_code/` corpus note) and the cross-repo recommendations the repo exported to the fleet. [Verified as present-for-what-they-are]

---

## 6. Anti-satisficing

- **Resurrection audit:** a full campaign re-examined 251 reject-class rows under a six-class taxonomy and found 24.7% VOID — measurements that *could not* have detected the lever. Yield: "Four shipped levers, one of them a 2.57–7.85× layout win, came out of rows that had been sitting in this ledger marked REJECT." The audit also contributed a new void class: "the benchmark did not exercise the code under test" at **workload scale** — "the resurrection queue for frankenmermaid is not a list of levers. It is a list of workloads," with a re-audit predicate requiring every "dead frame" row to be re-checked once the corpus extends. [Verified, maintainer prose quoted]
- **Claim-coverage audit:** 225 KEEP claims counted against contract markers; headline: "225 KEEP claims total. 8 carry a vs-incumbent ratio measured with mermaid-js live in the same invocation. 217 do not — 96.4%." Produces a ranked conversion queue (Tier 0–3) and an explicit "what cannot be converted, and why" section ("The convertible unit here is the workload, not the lever"). Method caveat stated inline (keyword-based classification, approximate). [Verified]
- **Anti-cherry-picking:** the Graph Deck plan's XIII.5 gates say "No perf ledger claims — this feature makes no performance assertions (any 'faster than X' statement would trigger the incumbent-win evidence machinery and none is planned)" — a feature must opt *into* making claims. Negative-evidence rows carry explicit "Retry only against one of those [preconditions]" predicates; parked levers are filed rather than deleted. [Verified]
- **Red-team / falsification / adversarial mechanisms as named docs:** none — no red-team doc, no falsification plan, no dialectic protocol file [Absent]. The functions are served by lane-graded audits and the honesty machinery rather than by a dedicated red-team artifact. [Inference]

---

## 7. Explicit absences

- No root `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` [Absent — verified by direct check].
- No `CLAUDE.md` / `MUSE.md` / `.muse/` [Absent].
- No `docs/research/**` [Absent]; no ADRs [Absent].
- No standalone definition-of-done doc — the concept is distributed across contract acceptance criteria (evidence/TEMPLATE.md), per-plan success criteria, and the `.ci/release-signoff.toml` checklist [Absent as a doc].
- `docs/progress/` referenced in AGENTS.md ("Public Performance Claims" retraction machinery lists `docs/progress/perf-negative-results.md`) but the directory does not exist [Absent — stale reference].
- No installed git hooks (only `.sample` stubs) — the ledger preflight is described as a "local pre-commit hook" in AGENTS.md but no active hook file was found; enforcement is via the script + CI + documented workflow [Absent/drift — verify before relying].
- No written two-model dialectical-review procedure; no anti-compaction instruction [Absent].
- No `beads_rust` dependency-field on *epic* scheduling semantics visible in JSONL alone (dependencies exist: `blocks`, `parent-child`) [Verified partial].

---

## 8. Maturity verdict

**Mature** — the most developed planning-and-honesty apparatus in the suite's evidence seen so far. What elevates it: the planning artifacts are not just plans, they are *self-correcting instruments* — plans accumulate reviewer findings inline, ledgers are mechanically gated (a human or agent *cannot* bank a null-free REJECT or an unclassified KEEP — the preflight exits non-zero), generated docs are byte-checked against source, and two adversarial audits (resurrection + claim-coverage) re-graded the whole evidence base by hand and published their own error rates (24.7% void, 96.4% claims without incumbent backing). The port-plan ladder (extract → synthesize → implement → conformance-prove) and contract-first design docs (TEMPLATE.md with accept/reject criteria, evaluation protocol, review ratification) show plan-before-build discipline; the task graph is a 1,125-bead dependency graph with triage automation, and execution plans are written so a fresh agent can run them cold. Weak spots: honesty discipline is a July 2026 retrofit (so pre-2026-07-10 ledger rows are largely null-free — 8.8% with nulls), one AGENTS.md reference points to a docs/progress/ dir that doesn't exist, and the adversarial lanes are a practiced norm without a codified dialectic procedure. [Inference on verdict; everything cited above Verified]

---

### Tier key
- [Verified] — read directly in a repo file (paths quoted).
- [Maintainer claim] — Emanuel's own prose, quoted verbatim.
- [Inference] — my reading between verified artifacts.
- [Absent] — searched for and not found; searched path stated.
