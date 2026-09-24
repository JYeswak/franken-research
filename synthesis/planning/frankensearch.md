# Planning methodology: frankensearch (github.com/Dicklesworthstone/frankensearch)

Analysis of **how Emanuel plans** in this repo — not what he built. Repo cloned 2026-09-22 (depth 1, HEAD `e438f0d`). Note on method: the plan task's `/tmp/plan-frankensearch` location was unusable — `/tmp` is a 512 MB tmpfs exhausted by sibling planning-analysis clones — so the scratch clone lives at `~/workspace/.tmp-frankensearch-clone` (deleted after this report). All file paths below are repo-relative.

One-line thesis: frankensearch plans by writing a **legal system for agents' claims** — normative contracts, machine-enforced evidence rules, a ledger of precedent, recorded amendments ("owner rulings"), and a beads graph that is the *executable* form of the plan — with honesty gates that fail closed rather than trusting agents to behave.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (958 lines) | Agent operating constitution | Rules for AI agents: override prerogative, toolchain, quality gates, Beads workflow, Agent Mail coordination, reward-hacking prohibitions. [Verified] |
| `COMPREHENSIVE_PLAN_FOR_THE_QUILL_LEXICAL_ENGINE.md` (626 lines) | The canonical plan doc | Pre-implementation design plan for the Quill BM25 engine: thesis, constraints, SOTA distillation (§4), contracts, 15–16 KLOC build inventory, **G0–G3 convergence gates** (§18), beads map (§19), risks, rejected alternatives. [Verified] |
| `docs/planning/BRIDGE_PLAN_2026-09-02.md` (1885 lines) | Owner's periodic end-to-end reality check | Vision checklist V1–V24 re-scored against evidence, dependency-ordered completion plan (R/G/Q/N/P), phase execution with frozen instructions, historical assessments (Sep 2/4/8/21) superseded but preserved. [Verified] |
| `docs/planning/BUG_FIX_TODO.md` (240 lines) | Active repair checklist | Owner-requested 2026-09-12 bug campaign tracking; "Checked items mean only the specific stated step is complete… This is a working checklist, not a substitute for Beads or evidence of closure." [Verified] |
| `docs/planning/UPGRADE_LOG.md` (1509 lines) | Upgrade campaign log | Execution log of upgrade work (process, not shipped capability). [Verified — skimmed] |
| `.beads/issues.jsonl` (1302 records, 8.4 MB) | The executable plan | Dependency-aware issue graph; schema: `id, title, status, issue_type, priority, description, created_by, assignee, created_at, updated_at, closed_at, close_reason, comments[], compaction_level, original_size, source_repo, source_repo_path`. Types: 928 task, 280 bug, 71 feature, 17 epic, 3 docs, 2 question, 1 test. Statuses: 1153 closed, 92 open, 47 in_progress, 6 blocked, 4 deferred. [Verified] |
| `.beads/beads.db.bad*_2026082{9,30}` + `-wal-cert` files | Incident forensics | ~26 numbered SQLite snapshots (`beads.db.bad2…bad33`) with `-wal-cert` files — DB corruption/resurrection artifacts preserved in-tree; "JSONL is truth and `beads.db` is disposable" per AGENTS.md. [Verified] |
| `docs/bead-self-documentation-rubric.md` | Planning-quality standard | Normative rubric (bd-3qwe.1) requiring rationale + evidence comment anchors on beads, exception policy, reviewer checklist, machine rule IDs (SDOC-RUBRIC-000–005), CI gate `.github/workflows/selfdoc-lint.yml`. [Verified] |
| `docs/bead-self-documentation-debt-inventory-2026-02-14.{md,json}` | Planning hygiene ledger | Audit of beads missing self-documentation anchors (negative examples named: bd-2hz.10.11.4/.5/.6). [Verified — listed] |
| `docs/baseline-budget-policy.md` (bd-2l7y) | Pre-implementation audit fields | Required fields for risky beads: `BASELINE_COMPARATOR`, `BUDGETED_MODE_DEFAULTS`, `ON_EXHAUSTION`, `SUCCESS_THRESHOLDS_AND_STOP_CONDITIONS`; statistical regression gate policy (p50>5%/p95>8%/p99>12%/mem>10% fail; n≥5; `perf.gate.*` reason codes); checker `scripts/check_bead_baseline_budget.sh`. [Verified] |
| `docs/NEGATIVE_EVIDENCE.md` (19,201 lines) | Honest ledger of failed levers | Perf experiments that did NOT pay off and were reverted; ratio convention; SELF-SPEEDUP vs INCUMBENT comparison classes. [Verified — head + structure] |
| `docs/PERF_LEDGER.md` (8846 lines) | Honest ledger of kept wins | Comparison-class contract (SELF-SPEEDUP = maintenance; INCUMBENT = real legacy incumbent, same invocation, numeric ratio, A/A null, executing ELF SHA-256). [Verified — head + contract lines] |
| `docs/LEDGER_RESURRECTION.md` (447 lines) | Evidence-quality audit | July 2026 audit of all 398 negative-evidence rows against VOID criteria (74.1% void — measurement couldn't detect the lever); six-class taxonomy; standing rules; pre-commit gate. [Verified — full read] |
| `docs/evidence/` (~201 files incl. subdirs) | Receipt-bound evidence archive | Per-bead evidence: `-evidence-YYYYMMDD.md` + `-red-proofs` dirs, hypothesis ledger, claim-coverage audit, perf JSON (`docs/evidence/perf/*.json`), Gauntlet divergence fixtures. [Verified — listed] |
| `docs/evidence/claim-coverage-audit-20260730.md` | Claim-base audit | 147 KEEP claims audited for vs-incumbent ratios: 6.8% substantive, 0% formal coverage ("Nobody asked for it; it is run because the priority order says to."). [Verified — full read] |
| `docs/evidence/e8h-hypothesis-ledger.md` | Open-hypothesis ledger | E8-H campaign working ledger; row template: Hypothesis / Minimal repro / Expected signal / Falsified if / Invocation / Machine profiles / Results inline / Retry predicate. "Rejects require a retry-condition predicate — never 'later'." [Verified] |
| `docs/evidence-jsonl-contract.md` (bd-2yu.2.3) | Evidence log schema | JSONL envelope v1 with identity/trace/classification/replay/redaction fields, JSON schema + fixtures + negative fixtures, "CI fails if any positive fixture fails or any negative fixture passes." [Verified] |
| `docs/contracts/` (~14 files) | Machine-enforced normative contracts | `quill-language-contract`, `quill-perf-gates.toml` (+ generated `quill-perf-gates.run-plan.md` — "GENERATED FILE — do not edit… the gauntlet test fails closed on any drift"), `quill-divergence-register`, `quill-hyperopt-campaign`, `quill-q1-docid-discipline`, format registry, e2e-artifact, dependency-semantics-policy, crates-publishing-contract, etc. [Verified] |
| `docs/contracts/quill-divergence-register.md` | Claim-matrix analog | Living append-only ledger (DIV-001..DIV-010) of Quill-vs-oracle divergences; machine history; `accept` requires consumer-impact note + **second-agent (fresh-eyes) review**; unclassified divergence blocks G2. Typed via JSON schema. [Verified] |
| `docs/architecture/` (overview, quill-engine, native-mode-distributed-search) | Design reference | Architecture maps; Quill plan is the planning doc, these are descriptive. [Verified — listed] |
| `docs/perf-artifacts/`, `docs/quality_harness/`, `docs/tutorials/` | Measurement + operator docs | Flamegraphs, BEIR/bootstrap-CI harness scripts, CLI tutorials. [Verified — listed] |
| `docs/quill-e9-retrospective.md` | Planning learning artifact | Post-flip retrospective with gauntlet catch census (13+ categories), "Machine-witnessed ingestion beats prose records"; removal proposal `docs/quill-e9-removal-proposal.md`. [Verified] |
| `CHANGELOG_RESEARCH.md` (1179 lines) | Evidence-anchored changelog | Research-cycle changelog with commit hashes, receipts, negative controls retained, "Both failed attempts are retained." [Verified — head] |
| `.claude/settings.json` | Tool permissions | Pre-approved Bash commands for br/bv/agent-mail/cass/rch — the coordination tools agents may use. [Verified] |
| `.githooks/pre-commit` (+ `.cmd`, `.ps1`, `pre-push`, `hooks.d/`) | Enforcement | Tracked hooks: `scripts/check_ledger_null_control.sh` staged-row mode runs on commit; CI `.github/workflows/ledger-integrity-lint.yml` repeats it. [Verified] |
| `schemas/*.schema.json` (+ fixtures) | Typed contracts | Evidence JSONL, divergence register v1/v2, crate-placement registry, asupersync CX contract, etc., each with valid/invalid fixtures. [Verified] |
| `scripts/check_*.sh` (~30 files) | Machine gates | `check_ledger_null_control`, `check_bead_self_documentation`, `check_bead_baseline_budget`, `check_bead_test_matrix`, `check_crates_publish_contract`, `check_dependency_semantics`, `check_feature_matrix`, fsfs contract checks, etc. [Verified] |

---

## 2. Execution-readiness gates

What a plan must pass before agents are set free. Verbatim quotes, all [Verified] from repo files:

**G0 — "Contracts on paper (no engine code merges before this lands)"** — `COMPREHENSIVE_PLAN… §18`:
> "G0 — Contracts on paper (no engine code merges before this lands): Language Contract (§5) with fixture corpora committed; FSLX format registry v1 (§10.6); Q1 invariant + obligations doc; Divergence Register scaffold; gauntlet harness skeleton compiling with oracle wired (subject stubbed); perf-gate manifests drafted with pinned fixtures. *Exit: docs + fixtures + harness skeleton reviewed and committed.*"

**G1/G2/G3 convergence gates** (same file, §18):
> "G1 — 'The engine lives': single-shard end-to-end (ingest → seal → open → query) passing the ported behavioral suite + internal differentials on the fast corpus; crash matrix green on the §11.3 kill-points; delta search live; deterministic-ingest replay byte-identical. *Exit: `cargo test -p frankensearch-quill` + fast gauntlet green.*"
> "G2 — 'Conformant at scale': … full oracle differential + metamorphic suites green with all divergences registered; … *Exit: nightly gauntlet green two consecutive runs.*"
> "G3 — 'Leapfrog, published': §14 gates QG-1..10 green with keep-gate-clean evidence committed (bench manifests, ledger entries, flamegraph artifacts); default `lexical` flip commit lands with consumer ports; tantivy out of the default graph; README/AGENTS/docs updated; retrospective + negative-evidence sweep. *Exit: the flip commit + evidence bundle.*"

**Performance gates (QG-1..QG-10)** are provisional `EmpiricalGate`s, activated only when manifests pin — and activation is a separate manual event. From `docs/contracts/quill-hyperopt-campaign.md` [Verified]:
> "QG-1 (bulk indexing), provisional, gate inactive… all ten activation flags remain false. Correctness and self-speedups are not incumbent wins."
The five standing perf laws (§14): "(1) no benchmark-only semantics…; (2) distributions, not averages (p50/p95/p99 + cv_pct always); (3) never hide maintenance (merge/compaction time inside the bulk-index window); (4) memory is first-class…; (5) one lever per change with MT8-style ≥0.1% frame attribution, ledgered per `NEGATIVE_EVIDENCE.md` ratio conventions (revert in [0.97,1.03])."

**Code gate** — `AGENTS.md`:
> "The one command that runs every gate this repository relies on (there is no GitHub Actions lane; the gate runs on real hosts through `dsr quality --tool frankensearch`) is: `scripts/quality-gate.sh # fmt, check, clippy -D warnings, cross-target check, lib tests, fsfs tests, real-model e2e, quick-start gate`"

**Ledger preflight** — `docs/LEDGER_RESURRECTION.md` §7:
> "Commit-time enforcement lives in `scripts/check_ledger_null_control.sh`. Before proposing a lever, provide both its name and target surface… Exit 0 means no prior negative-evidence section matched. Exit 2 prints the matching section and its retry predicate, and blocks the candidate until the predicate is satisfied or the lane switches veins."
And the six-case fail-closed self-check (synthetic REJECT/KEEP rows): CV-only rejection is blocked even with an A/A null present; a KEEP without an executing ELF SHA-256 is blocked; a KEEP with a 64-hex ELF SHA is admitted.

---

## 3. Honesty guardrails

**Negative-evidence ledger: [Verified], installed early and still growing.** `docs/NEGATIVE_EVIDENCE.md` (19,201 lines) opens:
> "Honest ledger of perf experiments that **did NOT pay off** (≈0 gain or regression) and were therefore **reverted**. The point of this file is to stop future agents (and future me) from re-attempting dead ends. Every entry must cite the measured ratio vs. the pre-change baseline on the same workload."
Conventions: **Ratio** = new/old, `<1.0` speedup; **revert** if ratio ∈ [0.97, 1.03] (noise) or > 1.03. `PERF_LEDGER.md`'s Comparison-class contract: `SELF-SPEEDUP` = frankensearch before vs after (maintenance, not a win); `INCUMBENT` = "the candidate ran against the **actual legacy incumbent**, side-by-side in the same invocation… Only this class can support a campaign or competitive win… A generic proxy, stored baseline, separate invocation, previous commit, `HEAD`, `OLD`, or in-repo `ORIG` arm is not an incumbent win."

**Claim-matrix analogs: [Verified], three of them, no file literally named "claim matrix" [Absent].**
1. **Divergence Register** (`docs/contracts/quill-divergence-register.md`): every intentional/accepted Quill↔oracle divergence gets id, class, root cause, consumer impact, fixture, decision (accept/fix). Doctrine: "An empty register is not the goal; an *unclassified* divergence is the only failure."
2. **Claim-coverage audit** (`docs/evidence/claim-coverage-audit-20260730.md`): 147 KEEP claims → 10 with same-invocation vs-incumbent ratios (6.8% substantive, **0% formal**). [Maintainer claim, quoted verbatim from the doc]: "Nobody asked for it; it is run because the priority order says to."
3. **Hypothesis ledger** (`docs/evidence/e8h-hypothesis-ledger.md`): falsifiable rows — "Falsified if: <what observation kills it>", "Results (inline): <PENDING | numbers + artifact paths>", and the rule "Rejects require a retry-condition predicate — never 'later'."

**Auto-demotion rules: [Absent] as formal demotion rules.** Promotion/demotion is manual: the ten QG activation flags ("all ten activation flags remain false"), the `bd-3beo` standing gate, G2 blocked by unclassified divergences. No automated demote-on-evidence mechanism found.

**When installed:** the evidence machinery is early — negative-evidence convention predates Quill work (entries from 2026-07-14 onward), and it is *retroactively strengthened*: `docs/LEDGER_RESURRECTION.md` (2026-07-25/27, campaign §1, agent SageCardinal) hand-audited all 398 rows @ commit `da149fd9` against VOID criteria — "a row is **VOID** not because 'the lever didn't work' but because **the measurement could not have detected the lever**." Result: 216/341 (63.3%) VOID under the corrected six-class taxonomy (VOID-NONULL dominates: 205 rows). Standing rules the audit added [Verified, quoted]: "An `INVALID`/`UNTIMED` row is not negative evidence… Never gate on `cv`… Every timed row records the ELF sha256 of the binary that produced it… A/A null control in the same invocation, always."

---

## 4. Plan→agent execution

**Task graph: [Verified].** The plan document (§19) states: "*End of plan. The beads graph (§19) is the executable form; this document is the rationale of record.*" Epic family `quill`: quill-e0 (contracts & gauntlet skeleton) → e1 Scribe → e2 Grimoire & Quiver → e3 Keeper → e4 Argus → e5 Delta → e6 Gauntlet at scale → e7 Integration & Flip → e8 Perf doctrine → e9 Docs & retirement, each mapped to G0–G3 gates. Dependencies validated acyclic via `bv --robot-insights`; `br dep cycles` stays empty (checked in the Sep 22 assessment: "1,298 records: 1,153 closed, 89 open, 46 in progress, 6 blocked, 4 deferred. Zero active cycles"). `bv --robot-plan` computes parallel execution tracks; `bv --robot-triage` is "your single entry point" for what to work on.

**Plan-first mechanism: [Verified].** The bridge plan's Phase 3a frozen instruction (the owner's own words, quoted from `docs/planning/BRIDGE_PLAN_2026-09-02.md`):
> "take ALL of that and elaborate on it and use it to create a comprehensive and granular set of beads for all this with tasks, subtasks, and dependency structure overlaid, with detailed comments so that the whole thing is totally self-contained and self-documenting… The beads should be so detailed that we never need to consult back to the original markdown plan document. Remember to ONLY use the `br` tool to create and modify the beads and add the dependencies."
And the refinement instruction: "It's a lot easier and faster to operate in 'plan space' before we start implementing these things! DO NOT OVERSIMPLIFY THINGS! DO NOT LOSE ANY FEATURES OR FUNCTIONALITY!" Beads carry self-contained rationale/evidence anchors per the rubric ("Why are we doing this now? … Can CI detect drift automatically?").

**Verification loops: [Verified].** AGENTS.md "Beads Workflow Integration": `br ready` → claim → reserve files via Agent Mail → announce in-thread → work → close → `br sync --flush-only` → commit + push. Session protocol ("Landing the Plane"): file issues for remaining work, run gates, update statuses, sync beads, hand off. Mail threads use the bead ID as `thread_id` and `[br-###]` subject prefix; file reservations use the bead ID as reason. Drift prevention: no file deletion ever without written permission (RULE NUMBER 1); "Work-Graph Discipline" — JSONL is truth, beads.db is disposable, single-writer on graph structure; `br dep cycles` empty; run-plan files are generated from a pinned contract SHA ("the gauntlet test `perf_run_plan_document_matches_the_manifest` fails closed on any drift"); selfdoc/baseline-budget/test-matrix checkers run in CI with deterministic rule IDs.

**Dialectical review: [Absent] as a formal two-model debate protocol.** The closest verified mechanisms: (a) the Divergence Register's fresh-eyes rule — "`accept` decisions require a consumer-impact note and second-agent review"; (b) the Gauntlet's internal differentials (pruned ≡ exhaustive, SIMD ≡ scalar, delta ≡ sealed ≡ mixed) plus the oracle as an adversarial second engine — the E9 retrospective notes "Differential testing catches bugs in BOTH engines… The gauntlet falsifying its own register and appending a retraction (bd-iiidv)"; (c) the model-integrity re-audit (`docs/LEDGER_RESURRECTION.md` §8–9): when the provider silently substituted a lower-capability model during a window, all 21 commits were re-read fresh-eyes (12 SOUND, 9 CORRECTED, 0 RETRACTED), with every CORRECTED verdict mapped to a landed fix. [Verified]

**Plan amendments: [Verified].** "Owner rulings" formally supersede plan clauses, recorded on beads and mail threads — e.g. the Quill plan §1.4: "Owner ruling 2026-09-01 (supersedes the perf clause of this item, recorded on bd-3beo and bd-quill-e7-integration-flip-d0tx.6): Quill is the default lexical backend everywhere… The §14 performance targets remain the E8/E8-H optimization program and are no longer a precondition of the default." Format amendments follow "the format-registry discipline: change the plan, version the change, land the fixture."

---

## 5. State-of-the-art coverage

**[Verified], but in-plan rather than standalone research briefs.** The Quill plan's §4 "SOTA Distillation: The Field, and Where Quill Places Its Bets" gives adopt/adapt/reject verdicts per source — SPIMI, radix/hash-join, Lucene stacker, Seastar share-nothing, simdjson byte classification, FOR/PForDelta, Elias–Fano (rejected for 1.0), Roaring, FST, MPH, fieldnorm quantization, WAND/Block-Max WAND, AMAC (deferred), learned indexes (rejected), FoundationDB deterministic simulation (adopted via LabRuntime), crash-only design, metamorphic testing. Each entry names a **retry condition** (e.g. Elias–Fano: "retry condition: query-side profile shows block-skip dominating on >10⁶-doc corpora"). The plan cites an "alien-graveyard catalog" in parentheses — [Absent] as a standalone file in this repo; there is no `docs/research/**` directory, no literature-brief files. The closest are the per-bet verdicts themselves and `docs/fsfs-alien-recommendation-contracts.md` (adaptive controller cards — unrelated to the literature catalog). [Inference]: the "alien-graveyard" reads as a fleet-shared or in-head catalog, not a committed artifact here. The §21 "Rejected Alternatives (Recorded Reasons)" closes the loop: nine alternatives with one-paragraph reasons (fork tantivy, FTS5 as engine, reimplement tantivy format, etc.).

---

## 6. Anti-satisficing

**[Verified] — this is the repo's thickest layer.**

- **Claim invalidation is code.** `scripts/check_ledger_null_control.sh` + `.githooks/pre-commit` + `ledger-integrity-lint.yml` CI: a perf REJECT without a same-invocation A/A null (or a KEEP without an executing ELF SHA-256) **fails the commit**. Six-case executable self-check. [Verified, quoted §2 above]
- **Retroactive honesty audits.** The July 2026 Ledger Resurrection voided 74% of 398 rows; the claim-coverage audit (6.8% substantive / 0% formal incumbent coverage) was run "because the priority order says to." The live E9 retrospective re-falsified the register itself. [Verified]
- **Falsification is the planning unit.** Hypothesis-ledger rows die by pre-stated observation; the hyperopt campaign contract opens by stating its own premise "currently **falsified** by the admissible and diagnostic data produced so far" (QG-1: Quill at 0.1066–0.1725× Tantivy, "5.8–9.4x behind, a ~23x miss"). Rejected levers get *retry predicates*, not eulogies. [Verified]
- **Gate self-weakening is a named crime.** AGENTS.md's suite rules list 12 forbidden reward-hacking patterns (gate self-weakening, proof-class inflation, golden regeneration reflex, close-pump abuse, scope-splitting, conformance metastasis, …). The Ledger Resurrection §2b shows C4 in action: 9 rows were gated on an unreachable `cv < 5%` criterion — the audit named the gate defective and quarantined the rows. [Verified]
- **No retraction narratives.** "Per campaign §4, **no row is ever deleted** — this file annotates, it does not rewrite history." Losses are successes: "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative." [Verified]

---

## 7. Explicit absences

| Expected suite-pattern item | Status |
|---|---|
| `docs/planning/` dir | Present (3 files: BRIDGE_PLAN, BUG_FIX_TODO, UPGRADE_LOG) [Verified] |
| Root `ROADMAP.md` / `BEADS.md` / `TODO.md` / `PLAN.md` | **[Absent]** — root carries only AGENTS.md, README.md, CHANGELOG.md, CHANGELOG_RESEARCH.md, COMPREHENSIVE_PLAN_FOR_THE_QUILL_LEXICAL_ENGINE.md |
| `CLAUDE.md` / `MUSE.md` | **[Absent]** — only `.claude/settings.json` permissions and AGENTS.md |
| `docs/research/**` | **[Absent]** — no research-brief phase directory |
| ADR files | **[Absent]** — no `*-adr*` or `decisions/` docs (the divergence register + plan §21 serve the purpose) |
| Definition-of-done doc | **[Absent] by name** — closest: selfdoc rubric's evidence anchors + G0–G3 gate exit criteria |
| "Claim matrix" file | **[Absent] by name** — closest: divergence register, claim-coverage audit, hypothesis ledger |
| Auto-demotion rules | **[Absent]** — only manual activation flags and gate blocks |
| Formal dialectical/two-model planning protocol | **[Absent]** — closest: fresh-eyes second-agent rule, gauntlet-as-adversary, model-integrity re-audits |
| Session-compaction policy in docs | **[Absent]** — grep found nothing; issues.jsonl does carry `compaction_level`/`original_size` fields per record but their use is untracked-in-docs [Inference: metadata only] |
| `.beads/` as JSONL | Present; plus ~26 corrupted-DB snapshots preserved as forensics [Verified] |

---

## 8. Maturity verdict

**Mature.** [Verified → Inference]: frankensearch's planning apparatus is the most institutionalized observed in this repo so far — not because of document volume, but because honesty constraints are **executable**: a tracked pre-commit hook and CI fail closed on evidence rules (same-invocation A/A nulls, executing-ELF SHA-256, no-CV-gate), thirty-odd `check_*.sh` scripts lint plan quality (self-documentation, baseline budgets, test matrix), and the plan itself declares the beads graph — not the markdown — the "executable form," with 1302 records dependency-validated acyclic via `bv`. It is also self-correcting: two unprompted audits retroactively invalidated the majority of its own evidence claims (Ledger Resurrection: 63–74% void; claim-coverage: 0% formal incumbent coverage), and the model-integrity re-audit re-read 21 commits after a provider model substitution. Gaps are narrow and honest: no standalone research-brief dir, no literal claim-matrix or auto-demotion files, no formal two-model debate step — but each has a functioning analog (SOTA §4, divergence register, manual activation flags, fresh-eyes review).

---

## Verbatim-quote log (load-bearing, for synthesis)

1. "no engine code merges before this lands" — Quill plan §18, G0.
2. "The beads graph (§19) is the executable form; this document is the rationale of record." — Quill plan §21 tail.
3. "The beads should be so detailed that we never need to consult back to the original markdown plan document." — Bridge plan Phase 3a frozen instruction.
4. "It's a lot easier and faster to operate in 'plan space' before we start implementing these things!" — Bridge plan refinement instruction.
5. "a row is **VOID** not because 'the lever didn't work' but because **the measurement could not have detected the lever**" — LEDGER_RESURRECTION.md.
6. "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative." — AGENTS.md Rule 0.5.
7. "An empty register is not the goal; an *unclassified* divergence is the only failure." — Divergence Register doctrine.
8. "Nobody asked for it; it is run because the priority order says to." — Claim-coverage audit.
9. "Every entry must cite the measured ratio vs. the pre-change baseline on the same workload." — NEGATIVE_EVIDENCE.md.
10. "Owner ruling 2026-09-01 (supersedes the perf clause of this item…)" — Quill plan §1.4 (plan-amendment mechanism).
