# Planning Methodology: franken_overlap

Repo: [https://github.com/Dicklesworthstone/franken_overlap](https://github.com/Dicklesworthstone/franken_overlap) (cloned depth-1, commit `063182c` "style(bench,cli): restore the fmt and clippy gate on the folded agent CLIs", 2026-09-04). Rust clean-room text-overlap search engine: sparse positional overlap, spectral correlation, exact alignment verification.

Short version: franken_overlap plans **evidence-first, not agent-first**. The suite pattern of `.beads/` trackers, ROADMAP.md, CLAUDE.md, and no-compact doctrine is almost entirely absent here. What exists instead is a preregistration-style **claim-gatekeeping regime**: frozen claim manifests before held-out runs, paired bootstrap statistics, SHA-256 receipt chains, and immutable evidence bundles. The plan for *building* is a 15KB design monolith; the machinery for *believing* is a toolchain of ~15 evaluation binaries.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKEN_OVERLAP.md` | Master design document [Verified] | 15KB mission statement: math model, data model, runtime portfolio, 6 sparse phases, 4 spectral phases, verifier roadmap V1–V4, execution Waves 0–7, benchmark gates, definition of success |
| `docs/IMPLEMENTATION_BEADS.md` | Task breakdown [Verified] | 60 stable work IDs (FO-001…FO-605), static list only — **not** a live tracker; explicitly says IDs "are stable labels, not claims that a specific issue tracker has already been populated" |
| `AGENTS.md` | Agent operating instructions [Verified] | 3KB: 10 core invariants, repo map, required checks, change discipline, performance workflow, doc expectations |
| `VALIDATION.md` | Validation contract [Verified] | Required dev gate (`ci-local.sh quick`) and pre-merge/release gate (`ci-local.sh full`); local owner-controlled machines, no GitHub Actions |
| `docs/BENCHMARK_PLAN.md` | Benchmark contract [Verified] | Rule zero ("Latency without retrieval quality is not a useful result"), synthetic/natural/adversarial corpora, baselines, acceptance gates |
| `docs/PAIRED_CLAIM_GATES.md` | Statistical honesty gate [Verified] | `fo-claim-gate`: supported/inconclusive/unsupported verdicts on public quality/perf claims via paired query bootstrap, preregistered manifests |
| `docs/EVIDENCE_SUITE.md` | End-to-end evidence orchestrator [Verified] | `fo-evidence-suite`: scenario benchmark → pair-level receipts → optional preregistered claim gate → immutable Markdown/HTML bundle; with `--require-supported` release gating |
| `docs/EVIDENCE_BUNDLES.md` | Evidence bundle format [Verified] | `fo-proof-report`: immutable output dirs, prohibited interpretations list |
| `docs/EMPIRICAL_EVIDENCE.md` | Evidence generator [Verified] | `fo-evidence`: validates benchmark/score streams, refuses to proceed on inconsistencies; pair-level bootstrap intervals |
| `docs/EMPIRICAL_STATUS.md` | Honest status ledger [Verified] | Maintainer-authored self-audit: implementation real, fair-comparison machinery real, comparative advantage "not yet empirically established"; prohibited claims enumerated |
| `docs/EXPERIMENT_LEDGER.md` | Accretive experiment history [Verified] | `fo-experiment`: append-only JSONL ledger of runs, best-eligible-run selection, profile promotion gates, atomic registry replacement |
| `docs/GOLD_ADJUDICATION.md` | Natural-label adjudication [Verified] | `fo-adjudicate`: human review queue for ambiguous natural gold labels (multiple editions/years sharing passages) |
| `docs/REVIEW_WORKBENCH.md` | Human review UI contract [Verified] | `fo-review-report`: dependency-free HTML review page + SHA-256 receipts |
| `docs/REVIEW_DECISION_LOOP.md` | Review→training loop [Verified] | `fo-review-apply`: human decisions become feedback/calibration/lineage records with idempotent, content-addressed receipts |
| `docs/LOCAL_CI.md` + `scripts/ci-local.sh` | Local validation runner [Verified] | fmt/check/test/clippy; `FO_USE_RCH=1` remote compile workers |
| `scripts/recover-agent-wave-local.sh` | Stranded agent-wave recovery [Verified] | Recovers a base64+SHA-256-verified `.agent/wave.patch.gz.b64` payload into a local commit when an agent wave dies mid-flight |
| `ci/github-actions-disabled/` | CI disabled marker [Verified] | `ci.yml.disabled` — GitHub Actions deliberately not used |
| `CHANGELOG.md` | Feature ledger [Verified] | "All notable changes" list; evidence-related tooling (fo-bench, claim gates, calibration gates) recorded |

---

## 2. Execution-readiness gates (what a plan must pass before agents are set free?)

franken_overlap does not have a documented **plan→agent readiness gate** in the suite sense (no readiness checklist, no wave-signoff ceremony) — [Absent]. What it does have are **change-readiness gates** (what a code change must pass before merge), from `VALIDATION.md` [Verified]:

> "A change is mergeable only when the exact commit under review passes the required local gate. Benchmark-sensitive changes must additionally retain their raw benchmark output and corpus/configuration digest as described in `docs/BENCHMARK_PLAN.md`."

And from `AGENTS.md` [Verified]:

> "Performance work requires a baseline, profile, correctness evidence, and after-measurement."

> "When a check cannot run, report the exact missing tool or dependency. Never state that validation passed based only on inspection."

The benchmark land-gate from `docs/BENCHMARK_PLAN.md` [Verified]:

> "A candidate optimization lands only if: deterministic conformance passes; exact-match recall remains 100% for the supported normalization profile; edited-passage top-k recall does not regress beyond a declared tolerance; corruption tests remain fail-closed; p95 and peak RSS stay within budget; benchmark methodology and raw output are committed."

> "Microbenchmark wins that worsen end-to-end query latency are rejected."

Profile-promotion gate from `docs/EXPERIMENT_LEDGER.md` [Verified]:

```text
macro AUPRC improvement >= minimum
micro AUPRC regression <= maximum
Recall@1 regression <= maximum
p95 latency regression fraction <= maximum
```

And the claim-gate execution contract from `docs/PAIRED_CLAIM_GATES.md` [Verified]:

> "The gate manifest should be committed or otherwise frozen **before** examining the final held-out result."

> "An inconclusive result must not be presented as evidence of superiority."

There is no gate that a *plan itself* must clear before agents launch — no plan review, no estimation, no wave authorization — [Absent]. The gating all happens at the code/claim end, not the plan start.

## 3. Honesty guardrails

This is the repo's strongest layer — a fully mechanized claim-honesty regime, unusual in its completeness:

- **Preregistered claim manifests** (`docs/PAIRED_CLAIM_GATES.md`) [Verified]: the manifest "should be committed or otherwise frozen before examining the final held-out result." Manifests carry bootstrap samples, confidence level, seeded RNG, minimum query counts, absolute floors and delta floors separately ("A challenger can therefore be rejected for being absolutely poor even if an even poorer baseline makes its delta positive"), worst-profile regression caps, and latency gates. [Maintainer claim, verbatim]
- **Claim verdicts**: `supported` / `inconclusive` / `unsupported`, computed by `fo-claim-gate` with `--require-supported` failing automation when any comparison is inconclusive or unsupported [Verified].
- **Receipt-bound evidence**: "The output hashes: proof report; pair-level score file; gate manifest. A generated results page can therefore cite the exact inputs behind every verdict." [Verified, verbatim from `PAIRED_CLAIM_GATES.md`]
- **Complete paired-query rule**: "A partially completed exhaustive query is not converted into zero-scored negatives and cannot contribute to paired AUPRC… When `require_complete_baseline` is true, an incomplete exhaustive run fails the claim even when a small complete subset looks favorable." [Verified, verbatim]
- **Family-wise confidence adjustment**: Bonferroni-style division of the error budget across declared comparisons ("At nominal 95% confidence with five comparisons, each lower bound uses 99% confidence"), and "The exact comparison set must be declared in the manifest before final evaluation." [Verified, verbatim]
- **Worst-profile protection**: independent per-profile gates so "aggregate gains on exact or easy queries" can't hide failures on OCR, insertion/deletion, fragmented, reordered, or natural-relation profiles; "A comparison is inconclusive when no profile has enough queries to evaluate this protection." [Verified, verbatim]
- **Immutable evidence bundles**: output directory "must not already exist"; `suite-status.json` lifecycle (running→failed/complete) "prevents a partially populated directory from being mistaken for finished evidence." [Verified, `EVIDENCE_SUITE.md`]
- **Append-only experiment ledger** (`docs/EXPERIMENT_LEDGER.md`) [Verified]: "Historical evidence is never silently rewritten when a new profile is promoted"; duplicate run IDs fail closed.
- **Prohibited interpretations** (`docs/EVIDENCE_BUNDLES.md`) [Verified]:
  > "Do not claim: full-corpus exhaustive latency when exhaustive coverage is partial; semantic paraphrase retrieval from lexical-overlap evidence; unique source attribution when several gold positives are acceptable; span accuracy from methods that return only document scores; general superiority from one machine, one corpus, or an inconclusive confidence interval."
- **Self-auditing status doc** (`docs/EMPIRICAL_STATUS.md`) [Maintainer claim]: distinguishes "real implementation" (yes), "machinery to compare fairly" (yes), "already established better than alternatives" ("Not yet"), and concludes "FrankenOverlap is a substantial and testable specialized search system whose comparative advantage is plausible, but not yet empirically established in the repository."

Notable absence: no **negative-evidence ledger** in the sense of a record of disproven claims; the mechanism is prospective (gates prevent unsupported claims) rather than retrospective (logging dead hypotheses). No **auto-demotion rule** was found — promotion gates exist, demotion triggers do not. No **claim matrix** as a planning artifact — the manifest schema is a per-claim JSON structure, not a matrix. [Absent — all three]

Lifecycle timing: the honesty machinery was installed as part of the repo's core tooling (all present at HEAD, extensively developed in CHANGELOG) — [Verified] it's the dominant investment, not a later bolt-on. [Inference] The maintainer built the falsification infrastructure before having anything to prove with it, consistent with `EMPIRICAL_STATUS.md`'s stance.

## 4. Plan→agent execution

Task graph: static. `docs/IMPLEMENTATION_BEADS.md` lists 60 bead IDs grouped by area (Foundation, Sparse index, Query and chaining, Verification, FrankenSciPy, FrankenTorch/Metal, Interoperability). Beads have stable labels and no dependency edges, statuses, owners, or wave assignments — it is a **work inventory, not a task graph** [Verified]. The doc is explicit that this is a "ready-to-import work breakdown" and the IDs are not live tracker entries.

Phases: the Comprehensive Plan defines two orthogonal phase structures — technical phases (S1–S4 sparse, F1–F4 spectral, V1–V4 verifier) and execution Waves 0–7 (foundation → performance baseline → sparse productionization → prepared spectral CPU → Metal → alignment portfolio → incremental corpus/Python → semantic anchors) [Verified]. There is no mapping of beads to waves in-repo [Absent]; the sequencing relationship is implied by numbering, not stated.

Verification loops: entirely machine-checkable — fmt, clippy `-D warnings`, tests, conformance (`crates/fo-conformance`: "public end-to-end and corruption contracts"), fuzz targets, differential Python oracles, deterministic result equivalence across thread counts [Verified]. No human-in-the-loop review of agent waves is documented; the "review" machinery (GOLD_ADJUDICATION, REVIEW_WORKBENCH, REVIEW_DECISION_LOOP) reviews *search results*, not agent work [Verified distinction].

Dialectical review: **not present as an agent process** [Absent]. The closest in-repo analogs are: (a) model disagreement as an active-learning signal ("disagreement among raw score, calibrated probability, and pairwise ranking score" selects review queues, `docs/ACTIVE_LEARNING.md` [Verified]); (b) gold adjudication resolving cases where "different retrieval lanes disagree about the most likely source" [Verified]; (c) natural controls in the claim set — "The final item is deliberately expected to favor exact substring. Including natural controls makes the evaluation more trustworthy than a benchmark designed so one system wins every row." [Verified, verbatim]. These are retrieval-level dialectics, not two-model agent cross-examination.

Drift prevention: the most direct agent-orchestration artifact is `scripts/recover-agent-wave-local.sh` [Verified] — agents produce a `.agent/wave.patch.gz.b64` payload with `.agent/wave.sha256` checksum and `.agent/message.txt`; recovery verifies SHA-256, applies via `git apply --check`, and commits. This implies a patch-based wave execution model (agents return patches, not direct pushes), which is itself a drift containment design: uncommitted intermediate state is packaged, checksummed, and recoverable. No never-compact doctrine, no session-handoff protocol, no drift detector was found in-repo [Absent]. AGENTS.md's invariants ("Do not weaken parser bounds", "Do not silently change normalization or persistent-format semantics", "Keep commits focused and explain the algorithmic invariant affected") are the closest thing to drift prevention — invariants agents must not mutate [Verified].

## 5. State-of-the-art coverage

No `docs/research/**` directory and no literature-review artifacts exist [Absent]. The coverage mechanism is **benchmark-based, not literature-based**: `docs/BENCHMARK_PLAN.md` lists baselines the implementation must be measured against — exact substring search/ripgrep, naïve per-window Levenshtein, Myers/bit-parallel implementations, conventional fuzzy-match libraries, MinHash/SimHash, suffix-array/FM-index, dense FFT, WFA verifier — with `crates/fo-bench` implementing ~15 binaries (`fo-real-bench`, `fo-proof-bench`, `fo-exhaustive-bench`, `fo-naive-proof`, `fo-pan`, `fo-group-eval`, `fo-hybrid-tune`, etc.) [Verified]. The repo compares against *methods*, not *papers*.

The one stated literature-adjacent mechanism: "differential tests against reference Python/third-party algorithms" (`COMPREHENSIVE_PLAN_FOR_FRANKEN_OVERLAP.md` §12) and "Add differential Python oracle for normalization and edit distance" (bead FO-004) [Verified as planned, not verified as implemented].

No competitor scan doc, no arXiv survey, no "why X is wrong" literature analysis was found [Absent]. The claim manifests must be preregistered before held-out results — which structurally replaces literature positioning with empirical positioning [Inference].

## 6. Anti-satisficing

The anti-satisficing apparatus is the claim-gate toolchain itself [Verified]:

- **Inconclusive is a first-class verdict**: "No hard gate fails, but evidence is insufficient… An inconclusive result must not be presented as evidence of superiority." This directly outlaws the most common satisficing move (declare victory on thin evidence) [Verified, verbatim].
- **Worst-profile protection** rejects claims whose aggregate gains hide worst-slice regressions [Verified].
- **Natural controls**: the recommended claim set deliberately includes a comparison expected to favor the *baseline* (exact substring on exact-query latency) [Verified].
- **Exhaustive-bench accounting**: "exhaustive-Levenshtein completion and DP-cell accounting" is a required RESULTS.md item; `fo-exhaustive-bench` bounds the work so the strong-control comparison is real [Verified].
- **Adversarial corpora** in the benchmark plan: cross-document boundary traps, deliberately colliding reduced hashes, repeated single characters, boilerplate templates [Verified].
- **Red-team / falsification** as named practices: [Absent]. The closest language is "adversarial corpora", "corruption tests remain fail-closed", and the experiment-ledger's regression gates. There is no red-team campaign doc, no falsification backlog, no premortem artifact.

## 7. Explicit absences

| Expected from suite pattern | Status in franken_overlap |
|---|---|
| `docs/planning/**` directory | [Absent] — planning content lives at root (`COMPREHENSIVE_PLAN_FOR_FRANKEN_OVERLAP.md`) and flat in `docs/` |
| `.beads/` task-tracker database | [Absent] — only a static `IMPLEMENTATION_BEADS.md` list; no JSONL, no statuses |
| `ROADMAP.md` / `BEADS.md` / `TODO.md` / `PLAN.md` | [Absent] — all four |
| `CLAUDE.md` / `MUSE.md` / `.muse/` | [Absent] — only `AGENTS.md` (3KB) exists |
| Readiness/plan gates before agent launch | [Absent] — gates exist for merges and claims, not for plans |
| Definition of done for plan phases | [Absent] — Waves have deliverables but no done-criteria; "Definition of success" exists but is aspirational, not checkable |
| Two-model dialectical agent review | [Absent] — dialectic exists only at retrieval level (model disagreement as a signal, natural controls) |
| Never-compact / session continuity doctrine | [Absent] |
| Claim matrix artifact | [Absent] — per-claim JSON manifests instead |
| Negative-evidence ledger / auto-demotion rules | [Absent] — prospective gates instead of retrospective demotion |
| `docs/research/**` literature/competitor scans | [Absent] — method baselines instead |
| ADRs | [Absent] — no ADR files; design decisions live in the 52 flat docs |
| GitHub Actions CI | [Absent by design] — `ci/github-actions-disabled/`; owner-controlled local machines |

(Repo has 52 flat docs in `docs/`, all UPPERCASE topical design/eval contracts — [Verified].)

## 8. Maturity verdict

**Developing — bordering on mature for the *evaluation* side, thin for the *orchestration* side.**

The planning stack is lopsided in a distinctive way. The *empirical* planning machinery (preregistered claim manifests, paired bootstrap gates, immutable receipt-chained evidence bundles, append-only experiment ledger, gold adjudication, human review loop) is mature by any standard — it's a more complete claim-honesty infrastructure than any other franken repo in the suite pattern would suggest. The maintainer's method here is: **don't plan the work harder, constrain the believing harder**.

The *agent-orchestration* planning side is thin: a static 60-bead work list with no live tracking, no plan-readiness gates, no dialectical cross-examination of agent output, no session-continuity doctrine, and no live `.beads/` DB — the entire agent-running layer is one SHA-256-verified patch-recovery script. `AGENTS.md` (3KB) is invariant-heavy and procedure-light: it tells agents what they may never do, not how to plan.

Inference: this looks like the repo of a maintainer who trusts his agents to do the *building* once invariants are set, and spends his rigor budget on making *claims* machine-auditable. The planning method is "constrain, then trust; verify the evidence, not the process."

**Distinctive finding (single most important):** franken_overlap's planning innovation is a **preregistration-style claim-honesty toolchain** — frozen claim manifests before held-out runs, paired-query bootstrap with Bonferroni adjustment, worst-profile regression gates, SHA-256 receipt chains, immutable evidence bundles with an explicit `inconclusive` verdict that "must not be presented as evidence of superiority," and a self-audit doc (`EMPIRICAL_STATUS.md`) where the maintainer preemptively declares his own comparative advantage "plausible, but not yet empirically established." The suite-pattern artifacts (.beads DB, ROADMAP.md, CLAUDE.md, two-model dialectics, no-compact doctrine) are essentially absent; this repo plans by constraining *belief*, not by choreographing *agents*.

---

*Method note: all file contents read directly from depth-1 clone at `/tmp/plan-franken_overlap`. No quotes fabricated; absence marks reflect `grep -rilE` and directory scans across `docs/`, root, `ci/`, `scripts/`. Note for synthesis: this repo inverts the expected pattern — treat its "planning" as claim-gatekeeping rather than work orchestration.*
