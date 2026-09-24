# franken_ocr — Planning-Methodology Analysis

**Repo:** https://github.com/Dicklesworthstone/franken_ocr (shallow clone, main, pushed 2026-09-22) | **Analysis date:** 2026-09-22 | **Analyst note:** `/tmp` was a full 512MB tmpfs (510M used by other work), so the clone went to a scratch dir under this working directory and will be removed after analysis — no /tmp files were deleted.

**Claim tiers used:** [Verified] = read directly in a repo file; [Maintainer claim] = his prose, quoted; [Inference]; [Absent] = looked for, not found.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/planning/COMPREHENSIVE_PLAN_FOR_FRANKEN_OCR.md` | Master plan (935 lines, v2) | "The single source of truth for what we are building and why" [Maintainer claim — AGENTS.md]. Architecture + kernel strategy + verification methodology + phased roadmap (Phase −1..6) + OQ register + named-skill→beads mapping. |
| `AGENTS.md` (312 lines) | Agent operating instructions | RULE 0 (human override), RULE 0.5 (suite-wide rules live at `/data/projects/AGENTS.md`, NOT duplicated), Rule 1 (no file deletion without written permission), 9-point Engineering Doctrine, gates, beads/`bv`/`ubs`/MCP-mail usage, "Landing the Plane" session checklist. |
| `.beads/issues.jsonl` + `.beads/beads.base.jsonl` | Task-tracker DB (git-committed JSONL) | 605 beads: 424 closed / 172 open / 9 in_progress; 423 carry dependency edges; types: 408 task, 94 bug, 68 feature, 24 epic, 11 chore. Schema: `id, title, status, issue_type, priority, dependencies, description, acceptance_criteria (37 set), design (9), notes (37), comments (61), labels, created_by, compaction_level, close_reason`. |
| `docs/truth-pack/` (CENSUS.md, PINNED_SOURCES.md, SOURCE_HASHES.md, OQ_INDEX.md, EXISTING_UNLIMITED_OCR_STRUCTURE.md, `oq/*.md`) | Phase −1 research anchor | Pinned-source truth pack: exact HF/GitHub commits, SHA-256s of load-bearing sources, a line-backed token/shape/buffer census, and 6 research Q&A docs answering the open questions. |
| `docs/gauntlet/METHODOLOGY.md` (664 lines) | Release-certification design-of-record | The "three-pillar release gauntlet" (perf / conformance / surface): oracle wiring, per-op ULP tolerance table, Beta+conformal lower-bound ratchet, keep-gate, Ville e-process invariants, ≥10-round convergence rule, anti-pattern table. |
| `docs/gauntlet/PARITY_RUNBOOK.md` | Verification reproducibility | Step-by-step re-verification of every parity claim from a fresh checkout; pins the exact truth-pack 12-file model set and the acceptable candidate recipe. |
| `docs/gauntlet/GAUNTLET_EXPERIMENT_DESIGNS.md` | Experiment designs | 11 experiments, each: hypothesis / motivation / minimal reproducer / expected signal / **falsifiability criteria** / one-line invocation / results inline / closure predicate / retry predicate. |
| `docs/gauntlet/{CONFORMANCE,PERF,SURFACE_PARITY}_HYPOTHESIS_LEDGER.md` | Per-pillar hypothesis ledgers | Falsifiable hypotheses with inline results; the gauntlet cannot converge until these are empty (each closed with theory-kill or remediation bead). |
| `docs/gauntlet/ROUNDS.jsonl` | Round log | 11 rounds recorded (round 1: 2026-07-06 → round 11: 2026-07-08); each: date, new_findings, per-pillar summaries. |
| `docs/gauntlet/RELEASE_CERTIFICATION_TEMPLATE.md` | Strict-release gate | Required-pass constants + evidence-bundle classes + gate/ratchet spec + certification flow. |
| `docs/gauntlet/EPROCESS_STATE.json`, `RELEASE_READINESS.json`, `RELEASE_SCORECARD.json` | Machine-readable state | Persisted e-process values (4 invariants, none rejected), cell-based release readiness (`blocking_cells`, `ship` flag), scorecard. |
| `docs/gauntlet/bundle/` | Evidence bundle snapshot | `FINAL_GAUNTLET_REPORT.md`, `release_certificate.json`, `scorecards.json`, `benchmark_summary.json`, `certification_bundle.json`, `claim_sources/`, `source_evidence/` (hash-bound source files). |
| `docs/conformance/{PARITY_LADDER,GOLDEN,LADDER_HARNESS,METAMORPHIC,RATCHET}.md` | Conformance machinery | L0–L5 parity ladder; golden artifacts; metamorphic properties; **RATCHET.md** (104 lines): the Jeffreys×Hoeffding conformal lower-bound release ratchet. |
| `docs/NEGATIVE_EVIDENCE.md` (1343 lines) | Negative-evidence ledger | 5 inherited sibling failures (NE-INH-1..5) + 38 measured franken_ocr entries, each with claim_id/evidence_id, truth-pack provenance, CPU feature string, exact command+env, kill-switch state, measured before→after, bit-exact proof, disposition, do-not-retry predicate. |
| `docs/DISCREPANCIES.md` (10 DISC entries) | Accepted-divergence ledger | Every accepted numeric divergence: reference behavior, impl, measured impact, kill-switch env var, review date. |
| `docs/PERF_LEDGER.md`, `docs/FEATURE_PARITY.md` | Ledgers/scoreboards | Artifact-graph perf rows (43 `|` rows) w/ fairness controls; FeatureUniverse+SurfaceMatrix (present/partial/missing/n/a/excluded). |
| `docs/VISION_PARITY_RESULTS.md`, `docs/DECODER_E2E_PARITY_RESULTS.md` | Result snapshots | Recorded parity outcomes. |
| `docs/alien/AF-1..AF-5` | Alien-artifact design docs | Rate-distortion bit-allocation, tail-risk CVaR/EVT, conformal early-exit, submodular selection, USL pool-sizing — each with beads refs, proof obligations, deterministic fallbacks, transparency cards. |
| `.claude/skills/focr/` (SKILL.md 1996 lines + 9 references + validate.py) | Operator skill | Agent interface for the repo: "One Rule: Do not invent capability" [Maintainer claim], a 5-level **Truth Stack** (source > binary --help > br/bv > AGENTS/README/plan/docs > cass history), BEADS-REALITY.md tracker-evidence reference. |
| `scripts/{check_ledgers.py,gauntlet_cert.py,gauntlet_row.py,gauntlet_reference.py}` | Machine-enforced checks | Ledger schema lint (CI), Beta+conformal certification math (self-tested), evidence-row producer, reference binding. |
| `docs/zoo/`, `docs/ergonomics/AUDIT.md`, `docs/testing/LOGGING_AND_E2E.md`, `docs/focrq-format.md`, `docs/IOS_MACOS_EXCELLENCE_PLAN.md`, `docs/PRIVACY.md`, `docs/TEST_LOGGING.md`, `docs/forward_wiring_intel.md` | Supporting plans | Model-zoo specs (got-ocr2, smolvlm2, onechart, tromr), ergonomics audit, format spec, platform plans. |
| `artifacts/perf/<bead>/claim/` | Per-claim evidence dirs | Raw timing records, stdout/stderr, meta JSON, SHA-256 manifests — the receipt material the ledgers cite. |

---

## 2. Execution-readiness gates (verbatim quotes)

Emanuel's gates are layered: pre-work knowledge gates, per-change gates, per-lever gates, and release gates.

**Knowledge gates — nothing ships against an unresolved unknown:**
- "Hard rule: **no kernel ships against an unresolved `[OPEN]`.** A phase exit gate cannot pass while it depends on an unresolved OQ. Promote an `[OPEN]` to a design assumption only after reading the source and recording the answer in the register." [Verified — AGENTS.md, "Porting Workflow (Spec-First)"]
- "Every model-specific claim is tagged **[VERIFIED]** (confirmed from a primary source…) **[REPORTED]** (…) or **[OPEN]** (an explicit open research question that MUST be resolved by reading the actual `modeling_*.py` before the relevant kernel is built). Do not promote an **[OPEN]** to a hard design assumption." [Verified — plan, "How to read this document"]
- "**No kernel work begins until this phase is green.**" [Verified — plan §10 Phase −1 exit gates: every OQ answered with a pinned-source citation; all source hashes recorded; census generated + CI-guarded against source drift; oracle strategy decided + smoke fixture captured]

**Per-change gates:**
- "`cargo test --locked` is a **hard gate**: it MUST exit `0` before any change is handed off or a bead is closed. `scripts/check.sh` is the one-command gate." [Verified — AGENTS.md, "Mandatory Checks After Substantive Changes"]
- Session-close discipline ("Landing the Plane"): "1. File beads issues for remaining work… 2. Run quality gates (if code changed)… 3. Update issue status… 4. `br sync --flush-only` to export beads to JSONL, then `git add .beads/`. 5. Hand off — summarize what changed, gates run + results, remaining risks/gaps, concrete next steps." [Verified — AGENTS.md]

**Per-perf-lever keep-gate (METHODOLOGY §5 — each row "non-negotiable"):**
- Profile-first: "Evidence the touched code is ≥ **0.1% self-time** *before* the source touch (a profile frame, quoted). Below 0.1% is the **micro-lever trap**."
- "Both gates, same run window (`🔁`)": "The focused microbench *and* the broad end-to-end bench moved in the **same git state, same `target/`, same machine, same minute**."
- "`cv_pct` reported — **`cv_pct > 5` is noise** and ineligible for keep — it does not enter the ratchet."
- "Pass-over-pass ratchet — `.bench-history` thresholds: primary regression ≥ −3%, geomean ≥ −5%, per-category geomean ≥ −10%, p90 ≥ −15%, throughput ≥ −5%."
- "Correctness (L0–L5 parity) re-proven on every perf commit." [Verified — plan §9.2]

**Release gates:**
- "A release cannot ship with a red parity cell or an unledgered divergence." [Verified — plan §8.4]
- Strict certificate constants (RELEASE_CERTIFICATION_TEMPLATE.md): "100.0 — every readiness cell green — no partial credit"; "the full gate (`scripts/check.sh`) exits 0"; "no open high-severity finding anywhere in the ledgers"; "every core evidence artifact regenerated within a day of the bundle."
- Convergence (METHODOLOGY §7): "Minimum 10 full rounds of the perf / conformance / surface loop"; "Two consecutive clean rounds — each producing **< 3 new genuine findings**"; "Every open hypothesis resolved — the per-pillar hypothesis ledgers are empty." [11 rounds recorded in ROUNDS.jsonl, 2026-07-06→07-08 — [Verified]]

**Demotion discipline (the closest to auto-demotion):** the ratchet state machine (Allow | Block | Quarantine | Waiver): "A category that **lowers** its bound: **rejected**, even if the aggregate improves — the no-cross-regression principle, encoded at the statistics layer"; Quarantine = "Exit non-zero; block until the dip is resolved or a waiver recorded (7-day deadline)"; "A waiver never permanently lowers `ratchet_state.json`… On expiry the ratchet reverts to demanding the old bound." [Verified — RATCHET.md / METHODOLOGY §3.5]

---

## 3. Honesty guardrails

**Negative-evidence ledger — [Verified], installed from Phase 0 and live.** Plan §10 Phase 0 seeds `docs/{DISCREPANCIES,NEGATIVE_EVIDENCE,PERF_LEDGER}.md` before any kernel exists. Every entry carries the FrankenSuite artifact-graph fields: `date | WIN / PROVISIONAL_LOCAL_WIN / NEGATIVE(reverted) | lever`, plus `claim_id`/`evidence_id`, model source commit + fixture hash, dispatched CPU feature string, exact command + env, kill-switch state, measured before→after ratio, bit-exact correctness proof, disposition (KEEP/REVERT), and a "do not retry X unless Y" predicate. 38 measured franken_ocr entries exist (e.g. "row-tiled SAM global-attention score matrix… UNTILED WINS ALL 4 PAIRS… disposition: REVERT"). The header rule: "A `WIN` only counts with a head-to-head MEASURED ratio against a real reference and a correctness proof… Do not retry a rejected lever unless its explicit retry condition is satisfied."

**Claim matrix — [Absent] as a named artifact.** Functional equivalents exist: the per-entry `claim_id → evidence_id` fields in all three ledgers; `docs/gauntlet/bundle/claim_sources/`; the FeatureUniverse+SurfaceMatrix enumeration in FEATURE_PARITY.md (present/partial/missing/n/a/excluded with loader-enforced invariants: "partial never rounds up to present", "excluded still counts as coverage debt", category weights sum to exactly 1.0, deterministic iteration order — HashMap iteration is forbidden).

**Auto-demotion rules — [Absent] as named rules.** The demotion function is carried by the ratchet (Block/Quarantine above) and by validated-recipe locks: "the router gate, all norms, and the vision tower are never demoted" / "never demotion candidates, regardless of marginal gain" [Verified — AF-4 §4].

**Receipt-bound evidence — [Verified].** `gauntlet_row.py`/`gauntlet_cert.py` enforce evidence contracts: `focr-gauntlet-raw-timing/v1` (recompute aggregates from hash-bound observations), `focr-ocr-comparison/v1` (bundle both physical texts, replay the CER), `focr-source-input-manifest/v1`/`focr-build-receipt/v1` (reject dirty build inputs, source drift during compilation), pinned 12-file reference-model manifest + inference binding, and row v3 producer/source roots with commit-by-commit, one-subtree evidence lineage. "A summary number is never the evidence." `scripts/check_ledgers.py` lints the ledger schema in CI without needing model weights. METHODOLOGY §5.3 is explicit about residual limits: "These limitations must not be described as solved supply-chain attestation."

**Truth-pack anchoring — [Verified].** "If `SOURCE_HASHES.md` ever fails to verify, the upstream model moved: STOP, re-pin (`PINNED_SOURCES.md`), and re-confirm every entry whose provenance points at the old commit. A franken_ocr entry without a resolvable truth-pack provenance is **incomplete and may not be cited as evidence**." The census itself self-corrected the plan: the plan's ~2229-linear-module census was recomputed against the pinned `model.safetensors.index.json` weight_map to **2244**, with the correction ("the two shared experts are **fused into a single `DeepseekV2MLP`**… so shared contributes **33**, not 66") recorded in CENSUS.md [Verified — docs/truth-pack/CENSUS.md].

---

## 4. Plan→agent execution

**Beads work graph — [Verified].** Plan §14.3 prescribes the conversion: "Run **`/beads-br`** then **`/beads-workflow`** to convert this document into the work graph. The mapping: **Epics = the §10 phases**… **Every `[OPEN]` / `OQ-N` (§13) becomes a P0 research bead** that *blocks* the kernel bead depending on it… **Every kernel (§4.3, §6) becomes a task** with a unit-test bead + a parity-gate bead + (where perf-relevant) a bench bead as dependencies." Graph discipline (quoted from the suite-wide AGENTS.md, referenced not duplicated): "JSONL is truth and `beads.db` is disposable… single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty." `bv --robot-*` for triage/planning/insights ("Use ONLY `--robot-*` flags — bare `bv` launches a blocking TUI" [Verified — AGENTS.md]).

**Phases and verification loops — [Verified].** Phases −1 (truth pack), 0 (scaffold), 1 (f32 parity), 2 (int8, staged 2a/2b/2c — one quant lever at a time, "each its own parity gate + ledger entry", "A regression in any stage reverts just that stage"), 3 (SIMD kernels), 4 (int4), 5 (release + gauntlet to convergence), 6 (CUDA stretch). The §9.2 optimization loop is a 5-pass loop: claim+baseline → one lever + bit-exact proof → rebench + Score → revert if below threshold ("NO source landed, ledger the failure") → next hotspot.

**Dialectical (two-model) review — [Absent].** No document describes running two models against each other. What exists instead: the plan is "v2 (**critique-applied** + optimization-expanded)" [Maintainer claim — plan header]; the truth pack was ordered "Per the `/idea-wizard` review"; RATCHET.md carries a "review-r1 addendum"; hypothesis ledgers encode falsifiability criteria per experiment (a formalized adversarial stance per-hypothesis, not a two-model debate).

**Compaction-survival — [Verified].** METHODOLOGY §7: "Compaction-survival: these markdown files are the source of truth, so the agent can drop back in mid-run." `cass` ("Cross-Agent Session Search") lets agents mine prior solved sessions ("Never run bare `cass` (TUI) — always `--robot` or `--json"); PARITY_RUNBOOK is written for "a future agent/maintainer" to re-verify from a fresh checkout.

**Drift prevention — [Verified].** Three mechanisms: (1) spec-first porting — "extract spec → implement from spec → never translate line-by-line" and "kernels are implemented **from the spec, not from the Python**"; (2) the suite-wide AGENTS.md is referenced from the repo AGENTS.md with the load-bearing sections "NOT duplicated below, so they cannot drift out of sync"; (3) machine-checked docs: `check_ledgers.py` lints ledgers, and the gauntlet bundle carries hash-bound `source_evidence/` snapshots of the exact scripts/workflows/docs used.

**Multi-agent coordination — [Verified].** "MCP Agent Mail" (register identity, reserve files before editing, communicate with threads, prefer macros), bead-ID-threaded messages ("use the bead ID as the Agent-Mail `thread_id`"), file reservations with TTL, and a Codex/GPT coexistence note ("If `git status` shows edits you did not make… those are from the **other agents working on this project concurrently**").

---

## 5. State-of-the-art coverage

**Research/competitor/literature mechanisms — [Verified], housed in the truth pack, not a `docs/research/` dir.** `docs/truth-pack/oq/` holds 6 Q&A research docs (`preprocess-infer.md`, `rope-and-config.md`, `rswa-attention.md`, `secondary.md`, `tokenizer.md`, `vision.md`) plus `OQ_INDEX.md`, `PINNED_SOURCES.md`, `SOURCE_HASHES.md` — the answer to "what questions is the plan not asking" is pre-committed as §13's 18 OQ items, each "MUST be resolved (by reading the actual model source / config / processor) before the dependent kernel ships." Prior-art competitor analysis is embedded in the plan (§2.6): two community quantizations (GGUF K-quant ladder via llama.cpp PR #17400; NVFP4 quantizing only ~2196 decoder linears) are the evidence base for the quant recipe, with OQ-14 explicitly tasked to "dump NVFP4's scale keys to enumerate its exact set" before leaning on it. The `.claude/skills/focr/references/RESEARCH.md` (952 lines) and `cass search` ("mine prior reranker/kernel sessions before each perf bead — the negative-ledger mandate") extend coverage during execution. [docs/research/ dir: Absent — truth-pack + oq/ serves the role.]

---

## 6. Anti-satisficing

**Falsification machinery — [Verified], per-hypothesis rather than a named red team.** Every experiment design carries **"Falsifiability Criteria"** and a **closure predicate** plus a **retry_condition_predicate** (e.g. EXP-1403's: "Any accepted-output byte drift, synthetic success, false positive outside the calibrated bound… rejects the controller policy"). Metamorphic properties are specified in METAMORPHIC.md with an explicit anti-assertion: "⚠️ Do NOT assert 'multi-page concat = sum of single-page parses.'" The worked example in METHODOLOGY §3.6 shows the conformal band **blocking** a change whose point estimate improved (0.951→0.958) but whose lower bound dropped (0.903→0.887) — the ratchet refusing a "better on average" change. METHODOLOGY §10 tabulates 16 named anti-patterns with guards (oracle-compared-against-itself via `EngineIdentity::{Subject,Oracle}` asserted-distinct; "Loosening the ULP table to pass"; "Resetting the e-value"; "`partial` rounded up to `present`"; "Inheriting frankensearch's `0.055` int8 budget" — "The int8 budget is **measured for this model**, derived from the oracle's own bf16 floor").

**Adversarial statistics — [Verified].** The release decision uses the conformal LOWER bound, justified as: "A reviewer hostile to the claim asks 'is the *lower* bound above the ratchet?' — if yes, the claim survives a hostile read." Load-bearing invariants (KV-cap, i32-overflow, determinism, SIMD==scalar bit-identity) are monitored as anytime-valid Ville e-processes over an unbounded test stream, with hardware/software calibration split and operational rules ("Never reset `E_t`"; "Emit on every operation, both `0` and `1`").

**Explicit red-team doc — [Absent].** No file named red-team; the falsification function is distributed across the items above. The word "redteam"/"red-team"/"dialectic" appears nowhere in docs/ or .claude/.

---

## 7. Explicit absences

1. **ROADMAP.md, BEADS.md, TODO.md, PLAN.md, CLAUDE.md, MUSE.md** at repo root — all absent. Planning is `docs/planning/COMPREHENSIVE_PLAN_FOR_FRANKEN_OCR.md`; task state is `.beads/` + `.claude/skills/focr/references/BEADS-REALITY.md`; agent instructions are `AGENTS.md`.
2. **Named "claim matrix"** — absent (equivalents exist: claim_id/evidence_id fields, `bundle/claim_sources/`, FeatureUniverse/SurfaceMatrix).
3. **Named auto-demotion rules** — absent (ratchet Block/Quarantine + validated-recipe locks serve the function).
4. **Dialectical two-model-against-each-other review** — absent (critique-applied v2, `/idea-wizard` review, per-hypothesis falsifiability instead).
5. **Definition-of-done document** — absent as a named doc (DoD is distributed: bead `acceptance_criteria` fields, the strict-certification constants, per-phase exit gates).
6. **`docs/research/` directory** — absent (`docs/truth-pack/` + `docs/truth-pack/oq/` serve the role).
7. **ADRs** — absent (decision records live in per-AF design docs with transparency cards, not ADR files).
8. **`docs/contracts/ulp_tolerance_v1.toml` / `focr_score_contract.toml`** — referenced by METHODOLOGY.md but the directory does not exist in the tree; RATCHET.md notes the machinery "stands ready" while "the floor ledger is wired with the three-pillar cert… where the per-category corpus counts live" — i.e., parts of the cert apparatus are designed-and-tested but not yet live.
9. **The suite-wide `/data/projects/AGENTS.md`** (12 named reward-hacking patterns, work-graph discipline) is referenced but external to the repo — its content is not verifiable in-repo.

---

## 8. Maturity verdict

**Mature.** [Inference, grounded in the above] This is the most methodologically instrumented repo in the FrankenSuite sample: a 935-line master plan with evidence-tier tagging ([VERIFIED]/[REPORTED]/[OPEN]) and an 18-item open-questions register that legally blocks kernel work; a 605-bead dependency-aware work graph with 423 dependency edges; a Phase −1 truth pack that already self-corrected one of the plan's own numbers (2229→2244 linears); three artifact-graph ledgers with 38+ measured negative-evidence entries and 10 measured discrepancies; a full release-certification apparatus (three-pillar gauntlet, conformal lower-bound ratchet, Ville e-processes, evidence contracts with receipts, 11 recorded convergence rounds). The main gaps are all explicit in-repo: the contract TOMLs and some ratchet wiring are designed-but-not-live, strict release is honestly declared "distribution-pending, not certified," and the plan's perf claims are scoped to what's measured. The distinctive shape is that Emanuel treats *planning itself as the load-bearing artifact* — "the agent can drop back in mid-run" because the markdown, not session state, is the source of truth.
