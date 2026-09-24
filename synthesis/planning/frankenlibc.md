# frankenlibc — Planning Methodology Reverse-Engineered

Repo: [Dicklesworthstone/frankenlibc](https://github.com/Dicklesworthstone/frankenlibc), shallow-cloned 2026-09-22 (HEAD `22bc4d3`, "feat(resolv): implement native hosts source ordering and NSS status actions"; 8,813 files). Examined in `~/workspace/.scratch-tmp/plan-frankenlibc` because `/tmp` (512MB tmpfs, 97% full from sibling planning-agent clones) could not hold the clone.

Claim tiers used below: **[Verified]** = I read it in a repo file; **[Maintainer claim]** = Emanuel's prose quoted verbatim; **[Inference]** = my synthesis; **[Absent]** = searched and not found.

**One-paragraph thesis.** frankenlibc plans as a *jurisdiction*, not a roadmap: the centerpiece is an 80KB AGENTS.md agent-operating code that makes task-tracker beads closeable only on observed, executed evidence, a 41K-line negative-evidence ledger that records wins, losses, and retractions with machine-readable result classes, a four-level Replacement Maturity Model (L0→L3) with numeric gate thresholds per symbol, and 690 machine-checked conformance contract JSONs in `tests/conformance/` — each with a paired gate script and harness test, including a "claim gate positive/negative matrix" that explicitly fails claims closed on prose. The master plan is deliberately aspirational and self-disclaiming; the *gates*, not the plan, are the planning. Its distinctive signature: anti-satisficing is codified as law (named reward-hacking patterns are forbidden, gate self-weakening has an evidence standard, an adversarial-verifier agent role exists to falsify closures), and a published ledger-retraction case (falsified perf claims retracted 2026-09-01) proves the law is enforced, not decorative.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `PLAN_TO_PORT_GLIBC_TO_RUST.md` [Verified] | Master planning document | 1,326-line "aspirational roadmap and design rationale, not a live claim document" organized as Reverse Rounds R7–R41 mapping legacy glibc topology (loader, allocator, stdio, locale, math…) then escalating to abstract math rounds (R33 algebraic normal forms → R40 Atiyah-Bott localization → R41 Clifford algebra kernels); opens with a North Star, six Non-Negotiable Contracts, and a self-disclaiming header pointing to README.md/FEATURE_PARITY.md for factual status. |
| `AGENTS.md` [Verified] | Agent operating code / execution law | 80KB; RULE 0 (maintainer override prerogative), bead-closure evidence rules, quality gates, beads/triage workflows, adversarial-verifier role, one-bead handoff checklist, session-completion protocol. This is the load-bearing planning artifact: it is what agents must satisfy before anything counts as planned-or-done. |
| `.beads/` [Verified] | Dependency-aware task tracker | `beads.base.jsonl` + `issues.jsonl`: **7,454 records** (per-bead id/title/description/status/priority/type/created_at/created_by/updated_at/closed_at/close_reason/labels/dependencies); `config.yaml` (prefix `bd`); `metadata.json` (sqlite db + jsonl export). JSONL is truth; the `.db` is disposable ("Work-Graph Discipline," AGENTS.md). |
| `docs/NEGATIVE_EVIDENCE.md` [Verified] | Negative-evidence ledger | 41,205 lines, 915 dated entries (2026-06-19 → 2026-09-19): "records every result — win, loss, or neutral — so dead ends are never retried"; machine-readable `result_class=campaign-win` vs `self-speedup`; REJECTED rows with full rerun commands and bootstrap CIs; CORRECTION blocks where banked wins were later falsified. |
| `tests/conformance/replacement_levels.json` [Verified] | Replacement Maturity Model L0→L3 | Per-level gate criteria (max_callthrough_pct, min_implemented_pct, perf budgets, test gates) with measured current_state per module; project currently "L1 Hardened Interpose." |
| `tests/conformance/*.v1.json` (690 files) [Verified] | Machine-checked conformance contracts | Named gates (`agent_handoff_checklist.v1.json`, `claim_gate_positive_negative_matrix.v1.json`, `closure_evidence_schema.json`, `canonical_evidence_schema_v2_*`, `architecture_ledger_live_evidence_*`…), each with owner bead, required log fields, evidence categories, negative kinds, and CI wiring. |
| `scripts/check_*.sh` (588 files) [Verified] | Gate executables | Paired checker scripts for the contract JSONs (e.g. `check_claim_gate_positive_negative_matrix.sh`, `check_agent_handoff_checklist.sh`, `check_support_matrix_maintenance.sh`). |
| `crates/frankenlibc-harness/tests/` (1,022 files) [Verified] | Planning-infrastructure test suite | Includes `agent_handoff_checklist_test.rs`, `claim_gate_positive_negative_matrix_test.rs`, `beads_sqlite_integrity_completion_contract_test.rs`, `architecture_ledger_live_evidence_completion_contract_test.rs` — tests that verify the *planning machinery itself* (log fields, negative coverage, tracker integrity). |
| `docs/planning/REALITY_CHECK_BRIDGE_PLAN.md` [Verified] | Honesty audit / execution bridge | 570-line external-style audit (2026-09-08) with vision-to-reality map, "high-confidence gaps" (tautological healing oracle, gates that pass without executing, matrix self-contradiction), and track-ordered execution bridge with Done-when criteria. Includes the census: "7,410 closed, 11 in progress, 3 blocked, 4 tombstones, zero open" of 7,428. |
| `docs/plans/stdio-native-replacement-plan.md` [Verified] | Single-file working plan (per-subsystem) | 638-line plan, "This file is the only document for this work; all revisions happen in place. Beads are generated from this file in Phase 3a." Four documented revision passes (v1 scope → v4 production-honesty layer: witness chains, rollback story, closure-contract updates, SMT-at-build synthesis). §9 "Done criteria" is a checkbox definition-of-done across code/verification/docs/math/rollback. |
| `docs/research/llvm-libc-analysis.md`, `llvm-libc-lessons.md` [Verified] | Competitor/peer research | 2026-03-03 study (bead `bd-2icq.1`) of LLVM libc overlay/malloc/errno/TLS/ABI strategy with primary sources cited and a "Lessons" doc translating findings into execution guidance (e.g. per-symbol replacement-level gating). |
| `docs/reviews/gemini-review-summary.md` [Verified] | External model review | 2026-04-16/18 Gemini deep-dive (11 findings: ABI re-entry via `std::fs`, `hsearch` POSIX regression, `twalk_r` callback mismatch, `sigaltstack` EFAULT bypass…). |
| `docs/archive/FRANKENLIBC_REVIEW_ARTICLE.md` [Verified] | Swarm-written technical review | 2026-05-21 "produced by the Phase-2 FrankenLibC review swarm: a writer agent drafting, with reviewer agents (SwiftFox, CloudyPuma, WindyBear, and the wider swarm) contributing findings cited inline"; notably pre-empts overclaim with a headline-numbers truth table. |
| `artifacts/planning/open_beads_alien_uplift.v1.md` [Verified] | Prioritized open-bead matrix | 260 open beads ranked by EV = (impact×confidence×reuse)/(effort×adoption_friction) across tiers S/A/B/C with top-40 table. |
| `docs/RELEASE_READINESS_SCORECARD.md` [Verified] | Release gate scorecard | 2026-06-21 area-by-area gate snapshot (perf backlog conversion, revert discipline, conformance guard, release posture "Not ready") with per-bead verdict tables. |
| `docs/LEDGER_RESURRECTION_METHOD.md` [Verified] | Ledger audit procedure | "Current 2026-07-27 procedure, using frankenfs's six-class taxonomy verbatim" — six evidence classes (VALID-PROFILE / VALID-MECHANISM / VALID-AB / VOID-CV / VOID-ZEROSELF / VOID-NONULL) with explicit rules against broadening definitions to force verdicts. |
| `configs/gentoo/release-gates.json` [Verified] | Release gate thresholds | Tier1/Top20/Top100 build-success/test-pass/regression/overhead thresholds with override policy: "requires_approvals: 2… must_document_justification: true, must_create_tracking_issues: true". |
| `docs/reality-check/python3_perf_root_cause.md` [Verified] | Root-cause analysis doc | Workload-specific perf diagnosis (reality-check lane). |
| `docs/proofs/*.md` (9 files) [Verified] | Formal proof obligation docs | e.g. `sheaf_global_consistency.md`, `sos_barrier_soundness.md`, `cpomdp_feasibility.md` — runtime-math proof artifacts tied to the "Mandatory Modern Math Stack." |
| `docs/planning/PARITY-COVERAGE.md`, `COMPATIBILITY.md`, `EXISTING_GLIBC_STRUCTURE.md` [Verified] | Planning support docs | Symbol-level glibc comparison (2026-05-25; lists out-of-scope subsystems with reasons), compatibility notes, legacy structure mapping. AGENTS.md names these four plus the plan as "Required Docs (Keep Updated)". |
| `docs/history/upgrade-log.md` [Verified] | Sole history doc | Upgrade log. |
| `FEATURE_PARITY.md`, `PROPOSED_ARCHITECTURE.md`, `DEPLOYMENT.md`, `SECURITY.md` [Verified] | Factual-state docs | The plan header explicitly defers factual status to README.md and FEATURE_PARITY.md — the plan is aspirational by design. |

---

## 2. Execution-readiness gates (verbatim quotes)

There is no "plan approval" gate before agents are set free — instead, **every unit of work is a bead, and beads are gated at claim, execution, and closure** [Inference]. The load-bearing gates, verbatim from `AGENTS.md` [Verified]:

**Quality Gates (Run After Every Substantive Change):**
> ```
> cargo fmt --check
> cargo check --workspace --all-targets
> cargo clippy --workspace --all-targets -- -D warnings
> cargo test --workspace --all-targets
> ```

**Rules (AGENTS.md §Conformance & Benchmark Discipline):**
> "1. No feature is 'DONE' without fixture-based conformance proof.
> 2. No optimization claims without baseline/profile/verify loop.
> 3. Keep `FEATURE_PARITY.md` synchronized with reality (no aspirational DONE entries)."

**Bead closure evidence standard (AGENTS.md §RULE 0.5, Work-Graph Discipline summary):**
> "JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, **closure on cited evidence** with blocker beads gated on their named probe, `br dep cycles` stays empty."

**The gate-compilation rule — the single rule "that would have caught all of the above" (AGENTS.md, after four silent-deletion incidents):**
> "### A bead may not close on a gate whose COMPILATION was not observed… An unlinkable target is **silent, not green**… Before closing, run the named gate and **observe it compile and execute**. Quote its `test result:` line in the closure, not a `cargo check` that never built it. A `test result: ok.` line is **not** sufficient on its own: libtest prints exactly that for a filter matching zero tests (`0 passed; …; 296 filtered out`). **Assert a non-zero passed count.**"

**Closing on a superseded-blocker comment (AGENTS.md):**
> "Before closing on such a comment: 1. **Read the source at HEAD.** 2. **Open the cited gate** and confirm it drives *this* behaviour, not a neighbouring one. 3. **If the source is right but nothing could fail on the original bug, the bead is not done** — write the gate, then close on it."

**One-bead execution entry (AGENTS.md "One-Bead Handoff Checklist," steps 1/5/10/11):**
> "1. **Onboard once**: Read `/dp/AGENTS.md`, this `AGENTS.md`, and `README.md`. Do not keep reading architecture docs unless the chosen bead points at a specific file."
> "5. **Claim one bead**… Work on that bead only until it is closed or a real blocker is surfaced."
> "10. **Close with evidence**: closure notes must include exact commands, artifact paths, source commit, target dir, known limitations, pre-existing failures, and a statement that unrelated user or agent changes were not reverted."
> "11. **Commit and push**: set `AGENT_NAME` before committing. Include the bead id in the commit message."

**Per-plan Done criteria (`docs/plans/stdio-native-replacement-plan.md` §9):**
> "The README headline number '100.0% native coverage' is **rendered** by `scripts/render_readme_counts.py` from `tests/conformance/reality_report.v1.json`, not hand-typed."
> "`tools/stdio_synth/` produces a printf table and a scanf table; `cargo build` invokes the synthesis and the SMT prover; **build fails on any unproven obligation**."
> "`tests/conformance/stdio_pre_option_b_baseline.v1.json` is captured before the merge commit." / "`git revert <merge-sha>` is the only documented rollback path."

**Replacement-level promotion gates (`tests/conformance/replacement_levels.json`):** L0→L1→L2→L3 transitions gated on numeric thresholds (max_callthrough_pct, min_implemented_pct, e2e smoke, perf budgets). **Release gates (`configs/gentoo/release-gates.json`):** Tier1 requires 100% build success, ≥95% test pass, **0 new regressions**; overrides need 2 approvals + justification + tracking issues [Verified].

---

## 3. Honesty guardrails

**Negative-evidence ledger** (`docs/NEGATIVE_EVIDENCE.md`) [Verified]: installed by ~June 2026 (entries begin 2026-06-19); the forward result convention hardened **2026-07-27** — "Code disposition and campaign output are separate." Machine-readable classes:
> "`result_class=campaign-win` means the actual host-glibc legacy incumbent ran side-by-side in the **same invocation**, with interposition-proof provenance, and FrankenLibC's incumbent-ratio bootstrap median CI is entirely below 1.0 and clears the A/A null margin."
> "`result_class=self-speedup` means FrankenLibC before versus FrankenLibC after. The row is **maintenance**, even when the code ships. Its heading must say `MAINTENANCE`, and its self-ratio must never be presented as a competitive claim or campaign output."

**Claim gates with negative coverage** (`tests/conformance/claim_gate_positive_negative_matrix.v1.json`, bead `bd-bp8fl.7.6`) [Verified]: "Verify that every release-facing claim gate has positive allow coverage and fail-closed negative coverage for stale, missing, contradictory, wrong-commit, replacement-level, runtime-mode, unsupported-workload, and **prose-only claim advancement** cases." Required negative kinds include `prose_only_advancement` — a claim advanced by prose alone is a named failure signature (`claim_gate_prose_only_advancement`) [Maintainer claim, machine-enforced via `claim_gate_positive_negative_matrix_test.rs`].

**Reward-hacking prohibitions** (AGENTS.md §RULE 0.5) [Verified]: "12 named patterns, several already observed in this suite" — verbatim list includes "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." Adjacent law: "**never weaken a gate to land a change**… **reporting a loss is a success** — one line, revert, next lever, no retraction narrative." The repo notes it *set the suite standard*: "the null-gate straddle defect was FOUND here, and the standard the suite now uses for a legitimate gate fix is the one this repo set."

**Proven enforcement, not decoration** [Verified]: the AGENTS.md "BLOCKER: superseded by `<sha>`" audit found 4 of the first 7 closures wrong, documented four silent-deletion commits (2026-06-26 authored, replayed 2026-08-03; worst: −6,914 lines taking the f128 math engine), and — critically — "Three banked wins in `docs/NEGATIVE_EVIDENCE.md` were falsified by that one day and stood unretracted for ten weeks… **Retracted 2026-09-01** in `c35a87323` and `dda9885f4`." Retraction happens via dated CORRECTION blocks in the ledger and restoration beads (e.g. `bd-sjvs5n`, `bd-muijos`) [Verified]. There is **no** formal "auto-demotion" rule by that name [Absent]; demotion is procedural (ledger correction + bead reopen) rather than automatic.

**Claim-field contract** [Maintainer claim, `docs/archive/FRANKENLIBC_REVIEW_ARTICLE.md`]: "the README ships a **Claim-Field Contract** that separates `symbol_status` (ownership) from `semantic_parity_status` (full / blocked / limited), `oracle_kind` (what counts as evidence), and `replacement_level` (L0–L3)."

---

## 4. Plan→agent execution

**Task graph** [Verified]: `.beads/` holds 7,454 issues with typed dependencies (`br dep add`), priorities P0–P4, types (task/bug/feature/epic/question/docs). Robots triage via `bv --robot-triage` (graph-aware triage engine with PageRank, cycle detection: "`br dep cycles` stays empty"). The open-bead EV matrix (`artifacts/planning/open_beads_alien_uplift.v1.md`) ranks 260 open beads for "one-lever execution waves."

**Phases** [Verified]: per-subsystem plans phase plan→beads explicitly: `docs/plans/stdio-native-replacement-plan.md` is "Single-file working plan… **Beads are generated from this file in Phase 3a**"; the Reality-Check Bridge Plan organizes execution into tracks (evidence repair blocks *promotion claims*, not unrelated implementation work). The master plan's R7–R41 "Reverse Rounds" are the suite-wide phase ladder (legacy topology rounds, then math rounds).

**Verification loops** [Verified]: one-bead handoff (claim → define work surface → scoped remote validation via `rch exec` with isolated target dirs, never bare `cargo` → close-with-evidence → commit+push); session-completion protocol ("Landing the Plane": file issues for remaining work, run gates, sync beads, hand off); `br sync --flush-only` exports JSONL before every commit.

**Dialectical review** [Verified, but single-model external + swarm-internal, not two-models-against-each-other]: (a) `docs/reviews/gemini-review-summary.md` — Gemini external deep-dive, 11 findings, two dates; (b) `docs/archive/FRANKENLIBC_REVIEW_ARTICLE.md` — "a writer agent drafting, with reviewer agents (SwiftFox, CloudyPuma, WindyBear, and the wider swarm) contributing findings cited inline"; (c) the standing **Adversarial-Verifier Agent Role** (AGENTS.md) — "objective is to **disprove closure claims** rather than produce them… Frequency: At least once per day… Verdict emission: `VERIFIED / DISPUTED / INCONCLUSIVE`… Reopen criteria" include "closed by the same agent that created it with no independent verification." No doc describes a standing two-model debate protocol [Absent].

**Drift prevention** [Verified]: (a) Reverse Core Map — "Do Not Drift": every math mechanism must tie to a named legacy anchor or it is "out of scope"; (b) Required Docs kept updated (plan, glibc structure, architecture, parity); (c) `scripts/check_readme_drift.sh` in CI; (d) RULE 1: no file deletion without written permission; (e) the per-commit deletion-size audit method ("Audit this class by **per-commit deletion size, never by reading commit messages**") after agents silently deleted shipped work.

---

## 5. State-of-the-art coverage

**Competitor research mechanism** [Verified]: `docs/research/llvm-libc-analysis.md` + `llvm-libc-lessons.md` (2026-03-03, bead `bd-2icq.1`) — a scoped study with primary sources (LLVM libc overlay docs, source tree, GPU allocator commit history) and a "7 Research Questions" structure; the lessons doc converts findings into execution actions (e.g. "enforce per-symbol packaging applicability in `support_matrix.json`"). Research is bead-scoped and dated — a mechanism, not a literature-survey program [Inference].

**Literature/formal-methods coverage** [Verified]: AGENTS.md "Mandatory Modern Math Stack" lists **44 named methods** (Galois maps, separation logic, SMT refinement, CHC+CEGAR, Iris-style proofs, sheaf cohomology, Serre spectral sequences, Atiyah-Singer index, …) with a branch-diversity rule ("Every major subsystem milestone must use at least 3 distinct math families… No single family should dominate more than 40%"). `docs/proofs/` holds 9 proof-feasibility docs. The plan's late reverse rounds (R33–R41) are named for these methods — the "state of the art" is a *required vocabulary*, enforced at plan level, with a Developer Transparency Contract shielding day-to-day code ("Regular contributors must not need to understand the alien-math internals") [Verified].

---

## 6. Anti-satisficing

[Verified] The repo's anti-satisficing machinery is unusually explicit and multi-layered:
- **12 named reward-hacking patterns forbidden** (AGENTS.md), several observed in-suite; gate self-weakening has "the exact price of a legitimate gate fix" (evidence standard + published win/lose split).
- **Adversarial-verifier standing role**: daily falsification of closures with reopen authority and `[DEFECT]` child-bead filing.
- **Ledger six-class taxonomy** (`docs/LEDGER_RESURRECTION_METHOD.md`): deliberate refusal to "broaden the definitions to force every regex hit into a class"; "triage unresolved" is a screen state, "not a seventh class."
- **Per-commit deletion-size auditing** (`git log --shortstat`, flag deletions≫insertions) after the 2026-06-26 silent-deletion episode; the AGENTS.md text itself is a living post-mortem with adjudicated verdicts per commit.
- **Perf campaigns**: "one-lever" rule ("PROFILE FIRST / ONE LEVER" in ledger rows), same-invocation incumbent comparison, A/A null controls; the EV-ranked uplift matrix schedules "one-lever execution waves."
- **Red-team content**: the Reality-Check Bridge Plan is an invited hostile audit that names concrete gate defects (tautological healing oracle, "Standalone E2E can report success without standalone execution," matrix self-contradiction) and states "Finishing the existing active queue alone would not close that gap."

---

## 7. Explicit absences

- **[Absent] `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`** at root. The master plan lives solely in `PLAN_TO_PORT_GLIBC_TO_RUST.md`; no roadmap/beads/todo doc by those names anywhere.
- **[Absent] `CLAUDE.md`, `MUSE.md`, `.muse/`**. Only `AGENTS.md` (plus a `.claude/` dir containing just a settings backup) and a pointer to suite-wide `/data/projects/AGENTS.md` — which the repo notes (2026-09-18 verification) does not contain the sections it cites, "treat the suite pointer as aspirational."
- **[Absent] A formal "definition of done" document by that name.** The function is served distributively: per-plan "Done criteria" checkboxes, closure-evidence schemas, claim gates, replacement-level thresholds.
- **[Absent] Auto-demotion rule.** Retraction of falsified claims is demonstrated (2026-09-01 ledger retractions) but procedural (CORRECTION blocks + reopen beads), not automatic.
- **[Absent] ADRs.** No architecture-decision-record file or directory; decisions live in `memory_model_decisions.md`, `docs/plans/`, and the ledger.
- **[Absent] Standing two-model dialectical protocol.** External review is single-model (Gemini) plus internal swarm writer/reviewer roles; no doc prescribes running two models against each other.
- **[Absent] Session-compaction prohibition.** The observed suite pattern ("never lets sessions compact") appears nowhere in frankenlibc docs; "compact" occurs only for math kernels and tombstone compaction.
- **[Absent] Rich `docs/research/` program.** Only the two LLVM-libc files; no literature survey beyond that plus the math-stack canon.
- **[Absent] `docs/plans/` beyond stdio.** One plan file only; other subsystems' planning lives in beads + the master plan's reverse rounds.

---

## 8. Maturity verdict

**MATURE** [Inference]. The planning apparatus is not a backlog but a *jurisdiction*: 7,454 tracked beads with dependency graph and robot triage; 690 machine-checked conformance contracts each pairing a JSON gate, a checker script, and a harness test that audits the planning machinery itself; an evidence ledger with enforced result-class taxonomy and demonstrated retractions; a four-level replacement model with numeric promotion gates; an adversarial-verifier role and a dozen named reward-hacking patterns as standing law; and living post-mortems (the silent-deletion audits) written into the agent operating code as doctrine. Weaknesses are real but acknowledged in-repo: the master plan is self-declared aspirational; the 2026-09-08 bridge audit concludes the evidence system "still permits important claims to pass without executing the claimed behavior" and that the existing queue alone cannot close the gap. What is mature is the *planning and honesty infrastructure*, not the delivery claim — which is exactly what the infrastructure itself says.
