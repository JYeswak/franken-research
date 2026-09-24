# Planning-Methodology Analysis — franken_whisper

Repo: https://github.com/Dicklesworthstone/franken_whisper · analyzed 2026-09-22 from a fresh `--depth 1` clone.

This repo's planning system is the densest of the suite pattern I've reverse-engineered: it is not a few planning docs — it is a *machine-checked evidence bureaucracy*. The headline: Emanuel here plans in **execution packets gated by executable contracts**, tracks them in a **dependency-aware bead graph** (609 issues, 476 closed), and enforces honesty through a **pre-commit preflight that blocks invalid evidence rows with exit 2**. Below, every substantive claim carries provenance and a tier.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/planning/PLAN_TO_PORT_WHISPER_STACK_TO_RUST.md` | Master port plan | 5-phase port strategy; legacy repos declared "behavioral oracles," not copy sources |
| `docs/planning/TODO_IMPLEMENTATION_TRACKER.md` | Authoritative execution tracker | 1,352-line checkbox tracker; packets A–U plus S (Fresh-Eyes audit) and T (Randomized deep audit); "single authoritative tracker file in-repo" |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Spec document (Phase 1) | 541-line target architecture |
| `docs/planning/EXISTING_LEGACY_WHISPER_STRUCTURE.md` | Spec document (Phase 1) | Legacy codebase archaeology |
| `docs/planning/FEATURE_PARITY.md` | Spec document (Phase 1) | Parity matrix against legacy |
| `docs/planning/ALIEN_RECOMMENDATIONS.md` | Spec document (Phase 1) | High-EV "alien artifact" design recommendations |
| `docs/planning/DISCREPANCIES.md` | Conformance record | Accepted/intentional divergences from the compatibility spec |
| `docs/operational-playbook.md` | Execution method | Phase-gated (A–D) per-packet execution loop with entry/exit criteria and escalation rules |
| `docs/definition_of_done.md` | DoD contract | 7-section packet-closure contract with executable gate commands |
| `docs/master-todo-bead-map.md` | Plan→issue mapping | Maps tracker packets P1/P2/P3 to bead IDs with dependency highlights and graph rules |
| `docs/next_execution_packet_2026-02-25.md` | Current work queue | Rolling "execution source-of-truth" packet; Done/Blocked decision rules |
| `docs/closeout_residual_risks_2026-02-25.md` | Closeout evidence | Residual-risk snapshot with severity, evidence, mitigation, exit criteria |
| `docs/cross_repo_change_summary_2026-02-25.md` | Cross-repo packet | File-level + command-level reconciliation across franken_whisper/frankensqlite |
| `docs/risk-register.md` | Risk ledger | FW-R1..FW-R10 with impact/likelihood/mitigation/evidence/fallback trigger + review cadence |
| `.beads/issues.jsonl` | Executable task graph | 609 records (476 closed / 83 in_progress / 50 open); fields: id, title, description, notes, status, priority, issue_type, timestamps, created_by, close_reason, source_repo; JSONL is truth, `beads.db` disposable |
| `.beads/config.yaml` + `metadata.json` | Tracker config | Prefix `bd`, default priority 2; database `beads.db`, export `issues.jsonl` |
| `docs/NEGATIVE_EVIDENCE.md` | Honesty ledger | 730 `##` entries / ~26,846 lines: blocked, neutral, rejected, non-comparable evidence, each agent-signed |
| `docs/PERF_LEDGER.md` | Wins ledger | Measured wins with evidence links |
| `docs/PERF_FRONTIER.md` | Forward playbook | "Forward-looking playbook, not a log"; owned by swarm agent BlackThrush; lists live-incumbent results |
| `docs/CLAIM_COVERAGE_AUDIT.md` | Claim audit | 2026-07-30 audit: 45 perf KEEPs, 4 with live incumbent ratio, 41 without; reproducible via `scripts/claim_coverage_audit.py` |
| `docs/LEDGER_RESURRECTION.md` | Resurrection audit | Re-adjudicates 188 perf rejections under a six-class taxonomy; ships with enforcement |
| `docs/benchmark_regression_policy.md` + `docs/benchmark_guardrails.json` | Perf guardrails | >20% throughput regression = failure; automated checker `src/bin/benchmark_guardrails.rs` + CI hook `scripts/check_benchmark_guardrails.sh` |
| `docs/INCUMBENT_CONTRACT.json` | Incumbent pin | Pinned whisper.cpp 1.8.3 binary sha256; harness fails closed on drift |
| `docs/engine_compatibility_spec.md` | Conformance envelope | Compatibility spec + `CANONICAL_TIMESTAMP_TOLERANCE_SEC` |
| `docs/operations/SYNC_STRATEGY.md`, `docs/operations/RECOVERY_RUNBOOK.md` | Ops docs | Sync invariants and recovery procedures |
| `docs/acoustic_diarization_contract.md`, `docs/fw_ios_contract.md`, `docs/native_engine_contract.md` | Contract docs | Interface contracts for subsystems |
| `docs/SPEC_DECODE_PLAN.md` | Lever build plan | Single-lever actionable plan by GoldenOwl, "why this is the only lever left" in the negative ledger |
| `docs/FRANKENTUI_METHODOLOGY.md` | Feature methodology | 536-line planning method for the optional TUI, robot-first non-negotiable |
| `docs/IOS_MACOS_EXCELLENCE_PLAN.md` | Platform plan | iOS/macOS workstream plan |
| `docs/legacy_analysis.md` | Analysis doc | Legacy codebase analysis feeding the port plan |
| `docs/realtime-streaming.md` | Subsystem plan | Two-lane streaming architecture incl. confirm lane |
| `docs/tty-audio-protocol.md`, `docs/tty-replay-guarantees.md` | Protocol docs | TTY transport protocol + replay guarantees |
| `docs/FRANKENENGINE_YOUTUBE_CIPHER_JS_GAP_REPORT.md`, `docs/NATIVE_YOUTUBE_FEASIBILITY.md` | Feasibility docs | Adjacent-tech gap/feasibility analysis |
| `docs/SORTFORMER_RUST_PORT.md` | Port doc | Sortformer Rust port planning |
| `agent_ergonomics_audit/` | Audit dir | README.md + audit/ + tools/ — agent-ergonomics audit |
| `AGENTS.md` | Agent operating contract | 716-line rules: Rule 0/0.5, spec-first workflow, quality gates, agent mail, beads, UBS, cass, RCH |
| `.githooks/pre-commit` | Enforcement hook | Compiles the std-only Rust ledger preflight and runs `validate-staged` |
| `examples/ledger_preflight.rs`, `tests/ledger_integrity.rs` | Honesty enforcement | Self-contained gate binary + 7 contract tests (7 passed, 0 failed per audit) |

---

## 2. Execution-readiness gates — what a plan must pass before agents are set free

[Verified] The gate structure is a "Mission Gate" plus per-phase entry/exit criteria plus a 7-section Definition of Done, all in-repo.

**Mission Gate** — `docs/operational-playbook.md` [Maintainer claim, verbatim]:

> "Every packet must preserve these non-negotiable contracts:
> - Rust-only, memory-safe implementation (`#![forbid(unsafe_code)]`).
> - SQLite is canonical state via `frankensqlite` (`fsqlite` only).
> - JSONL is adjunct audit/recovery, never competing source of truth.
> - Robot mode remains stable, line-oriented NDJSON.
> - Adaptive logic ships only with deterministic conservative fallback."

**Phase A: Contract Foundation** entry/exit — `docs/operational-playbook.md` [Maintainer claim, verbatim]:

> "Entry criteria:
> - AGENTS + README + spec docs reread.
> - Tracker packet created with granular sub-tasks.
> Exit criteria:
> - Scope locked in `TODO_IMPLEMENTATION_TRACKER.md`.
> - No ambiguous ownership for code/docs/tests."

Phases B (Orchestration and Storage Integrity), C (Backend Parity Packeting), D (Interface and Operator UX) carry analogous entry/exit criteria; Phase D's exit includes "Operational docs updated for maintainers."

**Per-packet execution loop** — `docs/operational-playbook.md` [Maintainer claim, verbatim]:

> "1. Update tracker statuses before and after each material change.
> 2. Implement one leverage group at a time (storage, orchestration, backend, docs).
> 3. Add/adjust tests immediately after each behavior change.
> 4. Run mandatory gates…
> 6. Reconcile tracker and document residual risks explicitly."

**Definition of Done — Mandatory Quality Gates (§6)** — `docs/definition_of_done.md` [Maintainer claim, verbatim]:

> "All must pass before handoff:
> ```bash
> cargo fmt --check
> cargo check --all-targets
> cargo clippy --all-targets -- -D warnings
> cargo test
> cargo check --all-targets --features tui
> cargo test --features fj-oracle --test conformance_oracle_tests
> ```"

The full DoD adds scope integrity ("All changed files map to an explicit tracker item. No hidden/untracked behavior changes remain."), runtime/orchestration, robot-mode, storage+sync contracts, test minimums, and documentation/handoff sections.

**Escalation rules** — `docs/operational-playbook.md` [Maintainer claim, verbatim]:

> "Escalate before merge when any of the following occurs:
> - Sync invariants are violated or unverifiable.
> - Robot schema needs a breaking change.
> - Stage budget policy causes non-deterministic behavior.
> - Required external backend prerequisites are unclear to operators."

**Done/Blocked decision rules** — `docs/next_execution_packet_2026-02-25.md` [Maintainer claim, verbatim]:

> "- Mark `done` only with command evidence and updated documentation.
> - Mark `blocked` only with concrete artifact evidence (error text + command + path)."

**Graph rules** — `docs/master-todo-bead-map.md` [Maintainer claim, verbatim]: "No packet is closed until mandatory quality gates pass." and "`br dep cycles --json` must remain empty after dependency updates."

**Risk gate** — `docs/risk-register.md` [Maintainer claim, verbatim]: "New adaptive logic must add a risk row before merge." and "Re-evaluate risks at the end of each active execution packet."

**Porting workflow (spec-first)** — `AGENTS.md` [Maintainer claim, verbatim]: "Use this workflow order: 1. `docs/planning/PLAN_TO_PORT_WHISPER_STACK_TO_RUST.md` 2. `docs/planning/EXISTING_LEGACY_WHISPER_STRUCTURE.md` 3. `docs/planning/PROPOSED_ARCHITECTURE.md` 4. `docs/planning/FEATURE_PARITY.md`. Implementation should follow spec documents, not ad-hoc copying from legacy code." The master plan states the ethos: [Maintainer claim] "This is not a line-by-line translation. Legacy repositories are behavioral oracles."

---

## 3. Honesty guardrails — what exists, when installed, what is required

[Verified] This is the repo's most distinctive planning layer: honesty is not policy prose, it is **pre-commit machine enforcement**.

**The constitutional triple** — `AGENTS.md`, RULE 0.5 [Maintainer claim, verbatim]:

> "a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits; and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

AGENTS.md also cites the suite-wide file for "Named Reward-Hacking Patterns (ALL FORBIDDEN) — 12 named patterns, several already observed in this suite: gate self-weakening… proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." [Maintainer claim; the suite-wide file itself lives at `/data/projects/AGENTS.md`, not in this repo.]

**Negative-evidence ledger** — `docs/NEGATIVE_EVIDENCE.md` [Maintainer claim, verbatim]:

> "This ledger records blocked, neutral, rejected, or non-comparable performance evidence. It exists to prevent stale optimism from being reused as proof."

[Verified] 730 `##`-headed entries, each agent-signed (BlackThrush 351, IcyWren 55, WhiteCreek 46, plus a "cc" lane, Codex, AshHeron, DuskFinch, TealVireo, SlateHeron, OliveIsland, CyanGull, GoldenOwl per `docs/SPEC_DECODE_PLAN.md`…).

**Claim coverage audit** — `docs/CLAIM_COVERAGE_AUDIT.md`, 2026-07-30, auditor "MagentaMeadow (cc lane), re-run by BlackThrush," bead `bd-b4hp` [Maintainer claim, verbatim]:

> "Fleet policy under audit: **a perf KEEP requires a vs-incumbent ratio**, and a competitive result requires the legacy incumbent to run *side-by-side with franken in the same harness invocation* (README §'Campaign wins use the actual incumbent'). This audit was not requested by a reviewer; it follows the priority order, and it is published whether or not the number flatters us."

Result: **45 / 4 / 41** — "4 of 45. Roughly **91% of our perf-claim ground rests on self-speedups or non-interleaved comparisons**, not on the incumbent running beside us." The audit decomposes the 41 into 18 permanently-unconvertible (no incumbent arm can exist → "the correct remedy is labelling, not measurement") and 23 convertible only at engine level. Every number is reproducible: [Maintainer claim] "Reproduce with `python3 scripts/claim_coverage_audit.py [--detail]`."

**Ledger resurrection audit** — `docs/LEDGER_RESURRECTION.md`, campaign `perf-campaign-20260725`, "Fleet-Wide Meta-Lever #1," Lane L, 2026-07-27 [Maintainer claim]: a REJECT is VOID "when the measurement *could not have detected the lever* — as opposed to detecting it and finding it absent." A six-class taxonomy (`VALID-PROFILE`, `VALID-MECHANISM`, `VALID-AB`, `VOID-CV`, `VOID-ZEROSELF`, `VOID-NONULL`) was hand-applied to **188** actual performance rejections (277 mechanical candidates − 89 hand-excluded false positives), with line-number audit trails for every row. Result: 60/188 = 31.9% void; yield: 2 resurrected KEEPs, 1 corrected REJECT, 1 faithful rerun blocked before timing, 1 awaiting a measurement window. Institutional lesson [Maintainer claim, verbatim]: "Ledger integrity decays… every repo that audited once and stopped drifted to 25–91%. So this audit ships with enforcement."

**The pre-commit preflight (machine enforcement)** — `docs/LEDGER_RESURRECTION.md` §4b [Maintainer claim, paraphrase-verified against `examples/ledger_preflight.rs` existing in-tree]: `ledger_preflight -- validate-staged` rejects any new/modified REJECT-class row unless it records "a **same-invocation A/A null** with a numerical median/CI; or a **counted mechanism** showing instructions, cycles, syscalls, allocations, bytes, or faults unchanged." "There are no accuracy, large-regression, profile, or bare-CV exceptions in the write gate. A new KEEP/WIN is rejected unless it carries a 64-hex benchmark binary/ELF sha256." Perf KEEPs get mandatory result classes: `SELF-SPEEDUP / MAINTENANCE` ("may justify a code landing but never counts as campaign output") vs `INCUMBENT-WIN / CAMPAIGN WIN` (names the actual incumbent + binary SHA-256 + side-by-side same-invocation ratio). "Exit 0 means clear; **exit 2 means blocked**." Wired into `.githooks/pre-commit`, which "compiles the std-only Rust preflight directly and runs `validate-staged`" — and `tests/ledger_integrity.rs` (7 passed, 0 failed on the real ledger) adversarially tests that "accuracy/profile/CV/magnitude prose cannot bypass the REJECT contract" and "an unchanged output cannot launder changed allocation counts."

**Incumbent pinning** — `docs/INCUMBENT_CONTRACT.json` [Maintainer claim, verbatim]: "A competitive ratio is only bankable against a PINNED incumbent… `examples/incumbent_ab.rs` loads this file at preflight and FAILS CLOSED when the running incumbent process image, or the vendored source version, drifts from it." Pinned: whisper.cpp 1.8.3, `binary_sha256: 73cafc3ab406c8c917e402bf1cb8365eda72f147b3489aba33c4db7dff1a9f10`.

**When installed / required**: the evidence-ledgers and preflight were installed during the July 2026 perf-campaign era (audits dated 2026-07-24 through 2026-08-23; preflight enforcement shipped in the 2026-07-27 resurrection audit). They are required *before any perf claim lands*, not before any code change — the mission gate and DoD cover all packets; the ledger machinery covers perf claims specifically. [Inference] The February packets (A–U tracker, DoD, playbook) predate the ledger-enforcement layer; the honesty stack was built *after* the tracker found a soft spot (self-speedup inflation), which is consistent with "Ledger integrity decays."

**Auto-demotion rules**: [Absent] as a named mechanism. The function is served instead by (a) mandatory result-class relabeling (`SELF-SPEEDUP / MAINTENANCE` vs `INCUMBENT-WIN`) and (b) exit-2 preflight blocks. There is no rule that automatically downgrades a claim after a time interval.

---

## 4. Plan→agent execution — task graphs, phases, verification loops, dialectical review, drift prevention

**Task graph**: [Verified] The single tracker flows into executable beads. `docs/planning/TODO_IMPLEMENTATION_TRACKER.md` ran packets A–U (feature packets A–F, validation/finalization E–F, live autonomy packets G–O dated 2026-02-22, canonical backlog P, execution packets Q–R, cross-project hardening T, cross-repo completion U) plus deliberate anti-satisficing packets S (Fresh-Eyes Audit) and T (Randomized Deep Audit). `docs/master-todo-bead-map.md` maps packet scopes to bead IDs (e.g., `bd-1rj.7`, `bd-2xe.4`, `bd-3pf.19`) with dependency rules: "Every bead row must map to concrete code/doc/test artifacts." Bead statuses verified: 476 closed / 83 in_progress / 50 open out of 609 records. `next_execution_packet_2026-02-25.md` is the rolling source-of-truth; `closeout_residual_risks_2026-02-25.md` closes each cycle with exit criteria.

**Phases**: [Verified] the master plan runs Phase 1 (Spec + Contracts — the archaeology/oracle phase) → Phase 2 (Scaffold) → Phase 3 (Backend Packets, named `FW-P2C-001` through `FW-P2C-004`) → Phase 4 (UX + TUI) → Phase 5 (Native Engine Convergence + Conformance). The operational playbook overlays phases A–D per packet.

**Verification loops** — [Verified] multiple:
- The six-gate DoD command block runs per packet, plus the repo-specific oracle lane (`cargo test --features fj-oracle --test conformance_oracle_tests`).
- `docs/benchmark_regression_policy.md`: automated guardrail checker fails hard on >20% regression; "Fails hard when enforced benchmarks regress by more than `20%`."
- UBS ("Ultimate Bug Scanner"): AGENTS.md mandates "`ubs <changed-files>` before every commit. Exit 0 = safe."
- Robot-mode NDJSON event stream (`run_start` / `stage` / `run_complete` / `run_error`) gives agents machine-readable receipts of every run; schema version `1.1.0` self-describable via `franken_whisper robot schema`.

**Dialectical review** — [Partially verified, strong evidence]: The suite dialectic (two models run against each other) shows up here as (a) the claim audit's byline "Auditor: MagentaMeadow (cc lane), re-run by BlackThrush" — two lanes (cc lane + cod lane) auditing the same artifact; (b) the two-lane runtime design in `docs/realtime-streaming.md`, "the confirm lane never blocks the live lane," and the playbook's "the confirm lane keeps a second model resident beside the fast lane (tiny + large-v3-turbo)"; (c) `docs/LEDGER_RESURRECTION.md`'s "Model-integrity re-audit," where "the provider silently ran this pane on a lower-capacity fallback model between 2026-07-25 20:40 and 2026-07-26 00:35 EDT" and "the seven commits authored in that window were re-read under the restored model" — [Inference] direct evidence that Emanuel treats a silently swapped model as a defect requiring re-audit. No doc literally uses the words "dialectical" or "two models against each other"; no formal "grader" doc exists [Absent]. The closest named dialectical process is the two-lane (fast lane + confirm lane) architecture plus cross-lane audit.

**Drift prevention**: [Verified] (a) incumbent contract fails closed on binary drift; (b) ledger preflight `validate-staged` "compares the staged ledgers with HEAD"; (c) "The hook reads the Git index rather than the worktree, so an unstaged explanation cannot launder an invalid staged row"; (d) robot schema versioned and additive; (e) tracker rule "Update this file after every material sub-task completion"; (f) bead/session closeout protocol ("File issues for remaining work… Update issue status… Sync beads… Hand off").

**Multi-agent coordination**: [Verified] `AGENTS.md` documents MCP Agent Mail (identities, file reservations/leases with TTL, thread-per-bead-id), `br`/`bv` bead workflows ("`bv --robot-triage` is your single entry point"), cass cross-agent session search ("reuse solved problems"), and a session-completion checklist. The "Note for Codex/GPT-5.2" reveals the operational reality: dozens of concurrent agents mutate the tree simultaneously — "those are changes created by the potentially dozen of other agents working on the project at the same time."

---

## 5. State-of-the-art coverage — research/competitor/literature mechanisms

[Verified] No `docs/research/` directory [Absent]. State-of-the-art coverage is instead delivered through four mechanisms:

1. **Legacy-as-oracle archaeology** (Phase 1): `docs/planning/EXISTING_LEGACY_WHISPER_STRUCTURE.md`, `docs/legacy_analysis.md` (401 lines), `docs/planning/FEATURE_PARITY.md`, and the C1 packet of the tracker: [Maintainer claim] "Mandatory `$frankentui` skill first pass: Read `/data/projects/frankentui/AGENTS.md` fully… Run mandatory cass archaeology commands from skill." The master plan's doctrine: "This is not a line-by-line translation. Legacy repositories are behavioral oracles."
2. **Pinned incumbent harness**: `docs/INCUMBENT_CONTRACT.json` + `examples/incumbent_ab.rs` — the competitor is not studied, it is *run side-by-side in the same invocation* with sha256-pinned binaries. The PERF_FRONTIER doc reports only "live-incumbent matched-greedy CPU results" (1.52× / 1.51× tiny.en, 2.26× then 2.99× large-v3-turbo whole-job).
3. **Feasibility reports on adjacent tech**: `docs/FRANKENENGINE_YOUTUBE_CIPHER_JS_GAP_REPORT.md` and `docs/NATIVE_YOUTUBE_FEASIBILITY.md` — targeted gap analyses rather than literature surveys.
4. **Fleet-wide campaign intelligence**: `docs/LEDGER_RESURRECTION.md` cites method reuse across repos ("Method source: `/data/projects/frankenfs/docs/LEDGER_RESURRECTION.md`, read in full before this audit") and fleet statistics ("every repo that audited once and stopped drifted to 25–91%") — [Inference] the suite's cross-repo campaign layer doubles as literature: other repos' audits are prior art.

No academic-literature mechanism found [Absent].

---

## 6. Anti-satisficing — red-team/falsification/campaign mechanisms

[Verified] The repo ships *planned* anti-satisficing passes inside the tracker, not as afterthoughts:

- **S. Fresh-Eyes Audit Pass** (2026-02-22): contract-focused re-read of new code, robot-schema cross-audit; found real issues (schema mismatch, skipped cancellation checkpoint, zlib-bomb-adjacent brittleness) and fixed them with regression tests.
- **T. Randomized Deep Audit Pass** (2026-02-23): "Generate randomized source-file sample from `src/**/*.rs`… Map outbound/inbound dependencies… Fresh-Eyes Critical Review" — found u64→i64 deadline overflow, zlib bomb DOS (no decompression size limit), silent segment skip; "Confirm each issue with direct code-path reasoning (and repro where applicable)."
- **Ledger Resurrection** (2026-07-27): adversarial re-adjudication of *rejections* — asking whether each REJECT could even have detected its lever — with a ranked rehabilitation queue; outcome: 2 resurrected KEEPs, 1 corrected REJECT.
- **Fleet campaign discipline**: `perf-campaign-20260725`, "Fleet-Wide Meta-Lever #1," with Lane L allocation rules ("the standing rule is to request a window rather than take one"). Each audit doc carries a **retry predicate** — [Maintainer claim, LEDGER_RESURRECTION] "Retry predicate for this document: finish rank 5 when (1) a measurement window is granted and (2) the host is quiet (load < 2, no competing benchmark)." — i.e., falsifiability is scheduled, not wished for.
- **Adversarial contract tests**: `tests/ledger_integrity.rs` runs negative contracts proving that "a candidate statistic cannot launder a missing numerical null, an unchanged output cannot launder changed allocation counts, and an output-oracle digest cannot launder a missing binary/ELF digest."
- **Named reward-hacking patterns**: 12 forbidden patterns (referenced from suite-wide AGENTS.md), including "gate self-weakening," "golden regeneration reflex," "spec-editing as progress."

No formal "red team" doc or red-team bead label [Absent]; the function is carried by the audit packets and the adversarial ledger tests.

---

## 7. Explicit absences

[Absent] — verified by filesystem search of the depth-1 clone:
- `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `CLAUDE.md`, `MUSE.md`, `GEMINI.md` — none at root.
- `docs/research/` — no research directory.
- ADRs — no `*adr*` files.
- `.muse/` — no directory (MCP config lives at root as `codex.mcp.json`, `cursor.mcp.json`, `gemini.mcp.json` instead).
- `.github/workflows` — no CI workflow files present in the shallow clone.
- Auto-demotion rules as a named mechanism; "claim matrix" as a named artifact; "dialectical review" / "grader" terminology; an academic-literature survey mechanism; a formal red-team document.

[Verified] Present but notable-for-absence-of-scale: the tracker notes "Those high-level features were deliberately retired by `d294feed` and `b51b3fb3`" — retired work is annotated, not deleted.

---

## 8. Maturity verdict

**Mature.** franken_whisper is the most elaborated planning instance in the suite pattern: a 5-phase master plan with explicit-exclusion tables, a 1,352-line single authoritative tracker running ~20 named execution packets, a dependency-aware bead graph (609 issues) with cycle-emptiness rules, a 7-section Definition of Done with executable gate commands, an operational playbook with per-phase entry/exit criteria and escalation rules, a 10-risk risk register with review cadence, machine-readable agent receipts (versioned NDJSON robot mode), and — the differentiator — an honesty stack that escalates from policy ("self-speedup is maintenance") to audited confession ("91% of our perf-claim ground rests on self-speedups") to **pre-commit machine enforcement** (`ledger_preflight`, exit-2 blocks, adversarial ledger-integrity tests). Anti-satisficing is *planned work* (fresh-eyes and randomized audit packets inside the tracker), not reviewer luck. The one relative soft spot: the dialectical two-model review is architecturally present (fast lane + confirm lane, cc-lane/cod-lane cross-audit, model-integrity re-audit) but has no single document that names and governs it the way the ledger machinery is governed — [Inference] it is practiced, not codified.
