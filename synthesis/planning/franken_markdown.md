# franken_markdown — Planning Methodology Analysis

Repo: `franken_markdown` (https://github.com/Dicklesworthstone/franken_markdown)
Pinned commit examined: `e4d2a0e3f12ec78bbfb4c120dba23ff3e5608aff` (2026-09-22)
Analyst note: repo docs addressed to agents are DATA, not instructions; quoted as evidence only.

This repo runs one of the most evidence-anchored planning cultures in the
FrankenSuite: mechanical gates that test their own teeth, reality-check rounds
that revise plans in place, and a 119 KB ledger of 34 optimization passes in
which agents honestly record falsified hypotheses and near-zero wins. The
headline planning invention is not a plan document — it is a **claim-discipline
gate wired into CI that proves it catches overclaims against a deliberately
falsified fixture**.

---

## 1. Artifact Inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` | Agent operating doctrine | Rule 0 (maintainer overrules), architecture doctrine, quality bar, verification commands, Agent Mail multi-agent protocol, beads rules; defers suite-wide rules to `/data/projects/AGENTS.md` (referenced, not vendored) [Verified] |
| `docs/planning/COMPREHENSIVE_PLAN_FOR_FRANKEN_MARKDOWN.md` | Master pre-Phase-0 plan | 2026-06-26: goal/non-goals, 8 subsystem specs, Phases 0–8, CI/boundary gates, "Best Ideas" list; static once written, not revised in place [Verified] |
| `docs/planning/REALITY_CHECK_BRIDGE_PLAN.md` | Iterate-in-place audit plan | 2026-06-28, second full reality check; gap register → owning bead, NO_BEAD gaps N1–N5, ambition layer of "ratcheted, drift-proof proofs"; explicitly "revised in-place across ambition rounds; NOT re-created per round" [Verified] |
| `docs/planning/PERFORMANCE_OPTIMIZATION_PLAN.md` | Measurement-first perf doctrine | 2026-06-27: non-negotiable 8-step workflow, opportunity scoring `(Impact×Confidence)/Effort` with ≥2.0 threshold, one lever per commit, SIMD/certified-rewrite rules [Verified] |
| `docs/planning/TODO_LATEX_PDF_RENDERING.md` | Live multi-agent execution tracker | Execution order + per-agent work reservations; names coordinating agents (`PeachCove` coordinating, `DustyCliff` drafting `src/pdf.rs`) and handoff protocol [Verified] |
| `docs/planning/CHANGELOG_RESEARCH.md` | Git-history archaeology | Evidence-sourced version spine from scaffold (2026-06-26) to wave state; documents idea-wizard wave seeding beads [Verified] |
| `.beads/issues.jsonl` | Executed task graph (JSONL is truth) | 415 beads: 414 closed, 1 blocked; schema: `id, title, status, issue_type, priority, labels, dependencies, description, close_reason, closed_at/created_at/updated_at, created_by, compaction_level, source_repo`; creators 262 `ubuntu` (agents) vs 152 `jemanuel` (maintainer) [Verified] |
| `.beads/beads.base.jsonl` | Base snapshot of the graph | Same size (1.08 MB); recovery backups in `.br_recovery/` show vacuum/migration history [Verified] |
| `scripts/claims.tsv` | Claim registry (bead mwm.9) | 20 rows: one per marketed capability; columns `label, readme_pattern, capability_key, expected_substr, proof_path`; "A row is enforced only when its readme_pattern is present in the README, so the registry never forces a claim the README does not actually make" [Verified] |
| `scripts/check-claim-discipline.sh` | README↔capabilities honesty gate | Cross-checks every marketed README claim against `capabilities --json` flags + proof artifacts; includes test-rigor cross-check (coverage/mutation/e2e marketing) and a self-test that asserts a deliberately-overclaimed fixture FAILS [Verified] |
| `scripts/check-policy.sh`, `check-determinism.sh`, `check-wasm-core.sh`, `check-wasm-package.sh`, `commonmark-conformance.sh`, `parser-diff.sh`, `check-optimization-proof.sh` + ~35 more `scripts/*` | Mechanical gate suite | Each gate script is a named, reusable proof obligation referenced from bead acceptance criteria [Verified] |
| `.skill-loop-progress.md` | 34-pass optimization ledger | 119 KB: Round 2 (30 missions) + 4 reserve passes of the `extreme-software-optimization` skill loop; per pass: files changed, paired before/after measurements, equality proof, proof artifact path, verdict (PRODUCTIVE / LANDED-DE-RISK / LAND) [Verified] |
| `docs/OPTIMIZATION_PROOF_CHECKLIST.md` | Definition of done for perf work | Behavior-isomorphism checklist template + the exact closeout citation string; "Do not leave `TODO`, `TBD`, or angle-bracket placeholders in a proof file that will be used to close a bead" [Verified] |
| `docs/PERFORMANCE_ARTIFACT_SCHEMA.md` | v1 contract for optimization beads | Minimum artifact bundle + JSONL shapes so "every performance claim answerable from artifacts alone"; goal "not benchmark theater" [Verified] |
| `docs/RELEASE_READINESS.md` | Release honesty audit (bead mwm.5) | 2026-06-29 vision→evidence matrix; full verification gauntlet; verdict: "release-ready pending a maintainer tag push; it does not over-claim production status" [Verified] |
| `docs/VERIFY_RECIPE.md` | Deliberately-broken-fixture gate recipe | `fmd verify` with `verify-fixtures/broken.md` + `clean.md`; CI asserts the broken one fails (exit 1) and clean passes [Verified] |
| `docs/IDEA_BACKLOG.md` | Idea triage holding pen (bead nikq) | Preserves rejected-but-interesting wave-1 idea-wizard candidates with caveats; promotion rule: "every item below needs a separate discovery pass (design sketch + acceptance criteria as a proper epic in the bead tracker) before any work begins" [Verified] |
| `tests/artifacts/perf/qw1.7-reprofile/DECISION.md` | Deferral-on-evidence decision matrix | Re-profiling gate that DEFERs four layout/hyphenation children with per-child rationale ("DEFER (lean reject)") because they're not first-order [Verified] |
| `.github/workflows/release-wasm.yml` | Deliberately-disabled CI | Named "DISABLED — releases use DSR exclusively", gated `if: ${{ false }}`, with the maintainer's rule in the file — a compliance ritual, not a live pipeline [Verified] |
| `docs/IOS_APP_PLAN.md` | Adjacent product plan | Includes a "fresh-eyes review all new code" step before App Store record creation [Verified] |
| `docs/NATIVE_BOOK_CHECKS.md`, `docs/WATCH_DEPENDENCIES.md`, `docs/PDF_A.md`, etc. | Domain gate/design docs | 39 files under `docs/`; each records check semantics, contracts, and intentional limitations [Verified] |

---

## 2. Execution-Readiness Gates

What a plan must pass before agents are set free — verbatim.

**Rust verification gauntlet** (`AGENTS.md`, "Testing And Verification") [Verified]:
> "After substantive Rust changes, run: `cargo fmt --check` · `cargo check --all-targets` · `cargo clippy --all-targets -- -D warnings` · `cargo test`"

**Quality-surface gate for PDF claims** (`AGENTS.md`) [Verified]:
> "Before claiming PDF quality, add golden visual/output fixtures, PDF structural validation, file-size benchmarks, determinism checks, and browser/WASM tests."

**Optimization admission rule** (`docs/planning/PERFORMANCE_OPTIMIZATION_PLAN.md`) [Verified]:
> "The project rule is strict: no optimization lands without a baseline, a ranked hotspot table, golden-output proof, and one-lever-at-a-time verification."
>
> "Score opportunities as `(Impact * Confidence) / Effort`; implement only score >= 2.0."
>
> "No 'it should be faster' commits."

The same plan's **"Non-Negotiable Workflow"** (8 steps, step 1→8) [Verified]:
1. "Define scenario, metric, budget, golden output, and scope boundary."
2. "Capture `tests/artifacts/perf/<run-id>/fingerprint.json`."
3. "Capture baseline: p50/p95/p99, throughput, peak RSS, and golden checksums."
4. "Profile CPU, allocation, and cache behavior."
5. "Produce `hotspot_table.md`, `hypothesis.md`, and `scaling_law.md`."
6. "Score opportunities… implement only score >= 2.0."
7. "Apply exactly one lever per commit."
8. "Re-run golden outputs, determinism, WASM, policy, and performance comparison."

**Bead closeout proof obligations** (`docs/planning/REALITY_CHECK_BRIDGE_PLAN.md`, §5) [Verified]:
> "`cargo fmt --check` · `cargo check --all-targets` · `cargo clippy --all-targets -- -D warnings` · `cargo test` · `scripts/check-policy.sh` · `scripts/check-wasm-core.sh` · `scripts/check-determinism.sh` · `scripts/parser-diff.sh`, plus the bead-specific gate (raster golden, headless WASM smoke, conformance ledger, etc.). No claim in README/capabilities without a runnable proof command."

**Clean-room boundary gates** (`COMPREHENSIVE_PLAN`, §11) [Verified]: the repo "should fail fast when a change weakens the clean-room or WASM boundary" via `check-policy.sh` (zero third-party normal deps in the no-default core, banned renderer/browser forests stay out, `unsafe-code` lint active), `check-wasm-core.sh`, `check-determinism.sh`.

**Idea promotion gate** (`docs/IDEA_BACKLOG.md`) [Verified]:
> "Promotion rule: every item below needs a separate discovery pass (design sketch + acceptance criteria as a proper epic in the bead tracker) before any work begins. The caveats in the per-item notes are the unverified assumptions to challenge during discovery."

**Phased master plan**: Phase 0 is explicitly "Governance And Contract — AGENTS, README, CHANGELOG, plan, beads… Core build and test gates" — governance artifacts are the *first* deliverable, before any parser work (`COMPREHENSIVE_PLAN`, §9) [Verified].

---

## 3. Honesty Guardrails

**Claim-discipline gate (installed 2026-06-28, bead `...-mwm.9`, closed 2026-06-29)** [Verified]. Motivation in the bead description [Maintainer claim]:
> "The one place marketing outran reality this cycle was 'first-class WASM' (skeleton package). Make overclaiming mechanically impossible to ship, so the NEXT reality check finds nothing to flag here. This is the structural antidote to the doc-overclaim / bead-completion illusion."

The gate script's own docstring [Verified]:
> "This is the structural antidote to overclaiming (e.g. 'first-class WASM' before the browser package ships): the WASM-package row is enforced the moment the README markets a shipped package (an `npm install` snippet), and fails until capabilities reports `wasm_browser_package: available`."

The gate proves its own teeth — a self-test that fabricates an overclaiming README and asserts the gate fails it [Verified]:
> "if REGISTRY="$FAKE_REGISTRY" run_gate "$FAKE" "${ART}/self-fake.txt"; then echo '  overclaimed README: UNEXPECTEDLY PASSED — gate has no teeth'; exit 1 … else echo '  overclaimed README: correctly FAILED (gate has teeth)'"

**Reality-check rounds** (installed 2026-06-27 and 2026-06-28; first produced beads `mwm.1`–`mwm.5`) [Verified]. The bridge plan's operating rule [Verified]:
> "This document is the iterate-in-place plan for the 2026-06-28 reality check. It is revised in-place across ambition rounds; it is NOT re-created per round. Beads remain the source of truth — every gap below maps to an existing bead or a new bead created from this plan."

Its gap register used an explicit `NO_BEAD` notation for holes with no owning bead (e.g. G6: "One theme model" violated in PDF colors) and generated N1–N5 beads for them [Verified]. Standing doctrine [Maintainer claim, `docs/RELEASE_READINESS.md`]:
> "The point is to prevent the bead-completion illusion: a closed bead only counts if the capability is real and proven."

**Ratchets, not demotions**: no auto-demotion rule exists [Absent]. The closest mechanisms are monotonic floors [Verified]:
- "Commit `conformance_target = N%` and a measured `conformance_actual`. CI **fails if actual drops below the committed floor** (a ratchet), so conformance can only go up." (`REALITY_CHECK_BRIDGE_PLAN.md`, §3b) — live at floor 379/652 spec examples (`docs/RELEASE_READINESS.md`).
- "**Size budget with teeth:** measure raw + gzip + brotli of the emitted `.wasm`; CI ratchets (a size increase beyond a committed delta fails until the budget is consciously bumped)." (same doc)

**Negative-evidence ledger**: [Absent as a file]. It exists only as aspiration #6 in the comprehensive plan's "Best Ideas To Make This Exceptional" [Verified]:
> "6. **Negative evidence file:** record rejected dependencies and optimizations so future agents do not relitigate them."

The anti-relitigation need is instead met two ways: (a) beads are deliberately self-contained — the fresh-eyes epic comment: "If a future agent wonders why a test exists, this graph should answer that question without requiring the original conversation"; (b) the idea backlog preserves *caveats* alongside rejected candidates as "the unverified assumptions to challenge during discovery" [Verified].

**Reward-hacking defenses** (`AGENTS.md`, Rule 0.5) [Verified, referenced-not-vendored]: the suite-wide rules in `/data/projects/AGENTS.md` are said to name 12 forbidden patterns — "gate self-weakening… proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding" — plus a "Work-Graph Discipline" section ("JSONL is truth and `beads.db` is disposable… closure on cited evidence with blocker beads gated on their named probe"). The referenced file is **not present** in this checkout (`/data/projects/AGENTS.md` absent locally), so the 12-pattern list is quoted-on-faith here, not independently verified [Inference].

The local behavioral line [Verified, `AGENTS.md`]:
> "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

**Claim matrix**: partially present — `scripts/claims.tsv` is effectively the claim matrix (20 labeled claims → README pattern → capability key → proof path), but there is no separate "claim matrix" document by that name [Inference].

---

## 4. Plan → Agent Execution

**Task graph is the beads JSONL.** 415 beads: 237 `task`, 74 `feature`, 66 `bug`, 35 `epic`, 2 `docs`, 1 `chore` [Verified]. Status is terminal at 414 closed / 1 blocked (the blocked bead: "Implement typed font subsets, CFF outlines and bounded multilingual shaping (#10-12)", description null) [Verified]. Work-graph discipline requires `br dep cycles` to stay empty; every epic's definition-of-done repeats that invariant [Verified].

**Who plans vs who executes**: bead creators are 262 `ubuntu` vs 152 `jemanuel` — agents create the majority of beads, but the maintainer creates the governance anchors (mwm.9 was `jemanuel`-authored? not verified — mwm.9's created_by was not isolated; do not over-claim). The 2026-06-28 reality-check beads (N1–N5, mwm.9) were created 2026-06-28 by the planning round and closed within hours [Verified from mwm.9 timestamps].

**Multi-agent coordination is explicit, not emergent** [Verified]:
- `AGENTS.md`: "In multi-agent sessions, register with Agent Mail, reserve files before editing, and coordinate through threads. Treat unrecognized working-tree changes as peer work. Do not revert or overwrite them."
- `docs/planning/TODO_LATEX_PDF_RENDERING.md` names coordinators and live reservations: "Owner: multi-agent (`PeachCove` coordinating layout/TODO/beads; `DustyCliff` currently drafting `src/pdf.rs` embedded-font writer)" and order item 1: "Do not overwrite `src/pdf.rs` peer work… `PeachCove` must not edit `src/pdf.rs` until that draft is pushed or handed off through Agent Mail."
- The skill-loop ledger repeatedly documents peer-commit hygiene, e.g. Pass 3: "Commit: content at HEAD via peer batch-sweeps c18fda4… — disclosed"; Reserve R3: "The staged tree itself was exported (git checkout-index) and re-verified" [Verified].

**Skill-loop campaigns are the recurring execution unit.** The `.skill-loop-progress.md` ledger shows a complete 30-mission optimization campaign (Round 2) plus 4 reserve passes [Verified]:
- "Missions (one lever per pass; score = Impact×Confidence/Effort)" — missions are scored and sequenced before execution.
- Each pass records files changed, paired before/after p50/p95 on frozen before/after worktrees (e.g. R3: "`git worktree add /tmp/fmd-r3-para-before 9987a7b`"), equality proof, proof artifact path under `tests/artifacts/perf/<run-id>/`, and a verdict.
- "## Status: COMPLETE — 30 of 30 passes (2026-08-29). Loop finished; final gate + push by orchestrator." — the orchestrator owns the final gate and push, not the agents [Verified].

**Drift prevention** [Verified]:
- Theme as single source of truth: "Add a **theme-token coverage ledger**… CI fails if a token exists with only one consumer (catches future divergence at the source, not in review)" plus a "Cross-surface invariant test" asserting the same RGB across HTML CSS, PDF operators, and `capabilities --json` (`REALITY_CHECK_BRIDGE_PLAN.md`, §3b).
- The ambition layer's stated purpose: "make the gaps *unable to reopen*. Each upgrade turns a one-time fix into a standing invariant enforced in CI."
- Beads must be flushed to git: "`.beads/issues.jsonl` is flushed for git" (`AGENTS.md`; every epic DoD).
- Bead ids are prefixed `br-best-in-class-markdown-renderer-fmd-agent-ergonomics-commonma-*` — 415 beads in one long-lived namespace, signaling one continuous program rather than per-sprint re-planning [Inference].

**Verification loops**: perf beads close only against `scripts/check-optimization-proof.sh` + the Behavior Isomorphism Checklist; optimization beads also need `check-determinism.sh` and `check-wasm-core.sh` in the closeout; release claims need the full gauntlet in `docs/RELEASE_READINESS.md` ("Full verification gauntlet (all green, 2026-06-29)") [Verified].

---

## 5. State-of-the-Art Coverage

No formal competitor/literature/SOTA research mechanism exists [Absent]. Typst, Pandoc, comrak, pulldown-cmark, syntect, cosmic-text, krilla, Blitz appear only as **non-goals** ("Do not depend on… or similar dependency forests") — the plan's external reference point is *avoidance*, not comparative analysis (`COMPREHENSIVE_PLAN`, §2; `AGENTS.md`) [Verified].

Substitutes for SOTA grounding [Verified]:
- **Official spec suite as external truth**: `commonmark-conformance.sh` measures against the real CommonMark spec (379/652 examples, ratcheted floor 379), plus differential, metamorphic, and property/fuzz layers — "so coverage is adversarial, not anecdotal."
- **Idea-wizard discovery**: roadmap waves are seeded by "idea-wizard" sessions whose non-promoted candidates land in `docs/IDEA_BACKLOG.md` with caveats; `docs/planning/CHANGELOG_RESEARCH.md` records "Seeded idea-wizard epics into beads… and prioritized user-selected wave… to P1" — i.e., discovery is generative-ideation plus user selection, not literature review [Verified].
- **Git-history archaeology**: `docs/planning/CHANGELOG_RESEARCH.md` is research over the repo's own history (git log, tags, crates.io, npm), with evidence columns per version — methodological but inward-looking [Verified].
- Domain standards are absorbed as conformance targets (PDF/A-2b per `docs/PDF_A.md`, PDF/UA per `docs/PDF_ACCESSIBILITY.md`) without a documented literature-search step [Inference].

---

## 6. Anti-Satisficing

Multiple independent mechanisms punish "good enough" [all Verified]:

- **Deferral on evidence**: `tests/artifacts/perf/qw1.7-reprofile/DECISION.md` — after the PDF/parser optimization waves, the re-profile gate deferred four layout/hyphenation children: e.g. qw1.7.2 "**DEFER (lean reject)** | The existing trie already cut hyphenation cost; further trie compaction is a memory micro-optimization, not a p95 win. No EV at current ranking." The gate's rule: "optimize only when a target is top-5 and EV is high."
- **Corrected overstated wins**: Reserve Pass R4's proof was "**corrected on fresh-eyes review 2026-08-30**" — "the earlier 'stage p95 −31%' attribution was ambient-load noise… the corrected proof replaces the earlier overstated version." The verdict was downgraded to **LAND** (kept for correctness, "no measured speedup"). A second model reviewing and rewriting the proof is the closest this repo gets to dialectic — and it fired [Verified].
- **Falsification recorded in the ledger**: e.g. Pass 17: "mission's binary-search hypothesis honestly falsified and superseded by a stronger mechanism"; Pass 5: "compress-corpus FLAT (+0.8% p50, metrics disagree in sign — expectation not confirmed, reported with data)"; Pass 8: "reported honestly"; pathological cases disclosed ("one honestly-reported pathological micro shape… that real-document mixes do not hit").
- **Norm**: "reporting a loss is a success — one line, revert, next lever, no retraction narrative" (`AGENTS.md`).
- **Design for non-reopening**: the ambition layer upgrades each one-time fix into a CI-enforced standing invariant, explicitly framed against the "pull in comrak + a PDF crate" crowd as "exactly the moat" (`REALITY_CHECK_BRIDGE_PLAN.md`).
- **Deliberately-broken fixtures**: `fmd verify` ships a broken fixture and CI asserts it *fails* — the gate is exercised against its failure mode, same pattern as the claim-discipline self-test (`docs/VERIFY_RECIPE.md`).

---

## 7. Explicit Absences

- **No `ROADMAP.md`, `BEADS.md`, `TODO.md`/`PLAN.md` at root** [Absent] — roadmap lives in beads + `docs/planning/`.
- **No `CLAUDE.md`, `MUSE.md`, `.muse/`** [Absent]; agent doctrine is consolidated in `AGENTS.md`.
- **No `docs/research/` or research phase docs** [Absent] (no research dir anywhere).
- **No ADRs** [Absent].
- **No negative-evidence file** [Absent] — only the aspirational bullet in the comprehensive plan.
- **No auto-demotion rule** [Absent] — downgrade motion exists only as verdict changes in ledger entries and DECISION deferrals.
- **No two-model dialectical review mechanism** [Absent] — no "second model", "devil's advocate", or adversarial cross-model protocol found; the observed analog is *fresh-eyes* (single-model re-review: the fresh-eyes epic `0c8l`, skill-loop R4 correction, `IOS_APP_PLAN.md` "fresh-eyes review all new code").
- **No session-compaction prohibition** [Absent] — no "never let sessions compact" instruction; "compaction" in repo files refers to PDF streams/data structures. Beads' `compaction_level` field is uniformly 0.
- **No definition-of-done document** [Absent as a standalone doc] — definitions of done appear per-epic ("Definition of done for this epic" in the fresh-eyes epic bead) and per-domain (`OPTIMIZATION_PROOF_CHECKLIST.md`, reality-check §5 proof obligations).
- **No test-rigor % claims as marketing**: the claim-discipline test-rigor cross-check enforces that any coverage % in the README is backed by a committed floor — the README currently avoids such claims ("README does not claim 'production-ready', 'best-in-class', or 'fastest'") [Verified].
- **Suite-wide `/data/projects/AGENTS.md`** referenced by `AGENTS.md` Rule 0.5 is not present in this checkout [Absent locally] — the 12 named reward-hacking patterns are quoted from a reference I could not read.
- **GitHub Actions**: present but intentionally disabled — `.github/workflows/release-wasm.yml` is headed "DISABLED — releases use DSR exclusively" with `if: ${{ false }}`; `docs/VERIFY_RECIPE.md` still documents a `verify-docs.yml` workflow that no longer exists in the directory — a stale reference, not an active pipeline [Verified/Inference on staleness].

---

## 8. Maturity Verdict

**MATURE** — with two developing edges.

The verdict rests on evidence, not aspiration. Planning here is a closed loop: goals are decomposed into a 415-node bead graph (99.8% closed), every bead closes against mechanical gates rather than narrative, marketing claims are checked against machine-readable capability flags by a gate that self-tests its own teeth, and two full reality-check rounds revised the plan in place while upgrading one-time fixes into CI-enforced invariants. The 30-pass skill-loop ledger is a functioning anti-satisficing engine: falsified hypotheses, near-zero wins, and a corrected overstated proof are all recorded in the permanent record. Multi-agent execution is coordinated through named reservations, Agent Mail, and file-reservation protocol — documented in the plan, not just the transcript.

Developing edges: (1) **SOTA coverage is absent** — competitors appear only as non-goals; there is no literature or competitor-teardown mechanism, so "best-in-class" rests on internal rigor rather than external benchmarking. (2) The honesty apparatus is **procedural rather than dialectical** — fresh-eyes review is the only cross-check, and the two-model adversarial pattern observed elsewhere in the suite is not formalized here. (3) The suite-wide reward-hacking rules are referenced but not vendored, leaving a dangling dependency on an out-of-repo file.

Net: this is the suite's exemplar of *evidence-bound* planning — plan less, prove more, and make every fix unable to reopen. Its planning artifacts are overwhelmingly executable (scripts, registries, JSONL) rather than prose-only.
