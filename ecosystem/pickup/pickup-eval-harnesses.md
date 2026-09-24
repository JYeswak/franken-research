# Pickup companion: LLM eval harnesses

S2 author note (2026-09-23): per-type companion for the FrankenSuite project-pickup ecosystem.
All repo facts, paths, and star counts come from `_evidence/eval-harnesses.md` (GitHub API,
2026-09-23). Anything not in that file is labeled inference. Stable IDs: REQ-*, GATE-*, CLAIM-*,
UNK-* (per INTENT.md, user's explicit requirement).

## Charter seed

**What this project type is.** A harness that runs language models (or LLM-powered agents) against
task suites, applies deterministic or model-judged scoring, and reports aggregate metrics —
the infrastructure between a benchmark dataset and a leaderboard. Covers: task/solver/scorer DSLs
(UKGovernmentBEIS/inspect_ai), academic eval pipelines (EleutherAI/lm-evaluation-harness),
registry-of-benchmarks frameworks (openai/evals), agentic-coding grading harnesses
(SWE-bench/SWE-bench), function-calling leaderboards (ShishirPatil/gorilla BFCL),
tool-agent sandboxes (sierra-research/tau-bench), terminal-agent benchmarks
(harbor-framework/terminal-bench-1), and the dataset-side counterparts
(UKGovernmentBEIS/inspect_evals, openai/human-eval, google/BIG-bench).

**Out of scope.** The models under test (that's the inference-engines type). Human-labeling
pipelines and RLHF data infra (rl-envs). The eval harness may *host* an LLM judge, but
judge-model selection/training is not the project's business. No "eval for eval's sake" —
every supported benchmark must have a declared consumer (research paper, leaderboard, deployment gate).

**A good starting point** for an eval harness is: (1) a dummy/mock model provider so the whole
pipeline runs offline with zero API cost; (2) scorers unit-tested like library code against golden
fixtures; (3) per-eval versioned configs, benchmark data kept out of the harness repo; (4) a
deterministic checker module importable without any model; (5) CI that validates only changed evals,
with tiered cheap/expensive test markers.

**Trust boundaries.** The harness executes three untrusted inputs: model-under-test code
(anything the benchmarked agent runs — treated as hostile, never instruction), benchmark
task/eval code (community-submitted evals run in the grading sandbox, not on the host), and
judge-model outputs (verdicts are data, never commands). The sandbox line sits at the
grading containers (Docker/k8s grading legs, SWE-bench pattern) and the network-blocked
checker container (GATE-EH-2): no scored path may require a live API key (REQ-EH-1); the
PASS/FAIL decider imports and runs with no model, no key, and no network (REQ-EH-2);
the harness starts/stops sandboxes itself and no live model key lives on the bench host
(bench spec). Secrets (API keys for live-model legs) are confined to secrets-gated,
path-triggered workflow tiers — never in scored paths, never in DOM or committed YAML.

**Release definition.** A release is a pinned harness commit whose pin is recorded in
`docs/truth-pack/PIN_RECORD.md` together with the pinned oracle commits and dataset
revisions (terminal-bench `--dataset-version`, lm-eval `metadata.version` pattern,
REQ-EH-3), whose `MANIFEST.sha256` verifies, and whose dummy-path, checker, and
anti-cheat tiers are green. Changing any benchmark config without a version bump is a
release violation (GATE-EH-4); a release is never cut off an unversioned task mutation.

### Requirements

- **REQ-EH-1** — Ship a mock/dummy model provider (`mockllm`-style) usable for all offline harness
  and scorer tests; no scored path may require a live API key.
- **REQ-EH-2** — Scoring logic lives in a deterministic checker module separable from model
  generation code; the checker must be importable and unit-testable with no model present.
- **REQ-EH-3** — Every benchmark/eval carries an explicit version in its config (never silently
  mutated); harness repo and dataset artifacts live in separate, separately-versioned homes.
- **REQ-EH-4** — Graders get their own tests: parser/golden-log tests for correctness plus
  adversarial anti-cheat tests (spoofed PASS lines, truncated IDs, skipped-test masking).
- **REQ-EH-5** — CI marker discipline: lint/typecheck/fast unit tests gate every merge; slow,
  Docker/sandbox, or model-backed tests run explicitly; changed-eval-only validation for large suites.
- **REQ-EH-6** — A documented contribution policy (automated checks + best practices) gates new
  benchmark submissions before merge.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

"Oracle" for an eval harness is mostly about *what ground truth the harness's own machinery is
checked against*: reference implementations, conformance suites, and self-contained replays.
Candidate oracles named in the evidence file:

1. **inspect_ai reference model set** — UKGovernmentBEIS/inspect_ai, 40+ model providers,
   sandboxed tool execution. Integrity: the harness's own mock provider
   (`src/inspect_ai/model/_providers/mockllm.py`, scripted `custom_outputs`) must produce a
   pinned scripted-eval transcript byte-identically under a fixed harness commit.
2. **lm-evaluation-harness canonical tasks** — EleutherAI/lm-evaluation-harness; oracle surface
   is `lm_eval/tasks/*/task.yaml` versioned configs (e.g. `lm_eval/tasks/hellaswag/hellaswag.yaml`,
   `metadata: version: 1.0`) plus `tests/test_metrics.py` / `tests/test_aggregation_pipeline.py`
   golden assertions and the `DummyLM` (`lm_eval/models/dummy.py`) pipeline smoke path.
3. **SWE-bench containerized grading** — SWE-bench/SWE-bench: `swebench/harness/run_evaluation.py`,
   `grading.py`, `log_parsers/` per-language regex parsers, `constants/`. Oracle integrity: re-run
   `tests/test_log_parsers_*.py` and the anti-cheat trio (`test_grading_spoofed_output.py`,
   `test_grading_truncated_ids.py`, `test_grading_skipped.py`, `test_infra_failure.py`) — a
   harness fork is only as honest as its parser suite.
4. **BFCL deterministic eval_checker** — ShishirPatil/gorilla:
   `berkeley-function-call-leaderboard/bfcl_eval/eval_checker/` (vs `model_handler/`,
   `constants/`), `TEST_CATEGORIES.md` as the checker taxonomy oracle.
5. **Terminal-Bench pinned datasets** — harbor-framework/terminal-bench-1:
   `tb run --dataset-version 0.1.1` against the separate `terminal-bench-datasets` repo; the
   dataset repo itself is the versioned oracle (inference: the task file notes a newer
   `harbor-framework/terminal-bench` repo exists; oracle claims rest on the renamed line).

Per-oracle integrity checks (modeled on the truth-pack shape from `_s0/model-guides.md`):

- `docs/truth-pack/PIN_RECORD.md` — pinned harness commit, pinned oracle repo commit, pinned
  dataset revision (e.g. terminal-bench-datasets 0.1.1), dated; carries the honest asymmetry note
  when pins are not contemporaneous (cf. tts truth pack).
- `MANIFEST.sha256` — every fixture, golden log, dataset snapshot, and container image digest.
- `ACCEPTANCE_SURFACE.json` — the score/agreement thresholds the harness's own CI must hold
  (e.g. dummy-provider pipeline PASS, parser golden suite green, anti-cheat suite green).
- `NONDETERMINISM_FLOOR.md` — the irreducible noise of the measured path: sampler/seed behavior
  (thin evidence from lm-eval: `tests/test_samplers.py` seeded-sampling tests only — do not claim
  a seed API beyond that), judge-model variance if LLM judges are used.
- `fetch-truth-pack.sh --verify` — refetches pins and verifies all hashes; invocation-time oracle
  binary SHA-256 recording for every executable in a measurement (whisper CAMPAIGN-WIN pattern:
  no un-recorded executable is admissible).
- **UNK-EH-07** — No evidence was found of a harness repo publishing a full truth-pack of its own
  (pinned oracle + fixtures + verify script); the pattern is inferred from the model-project packets,
  not observed in eval harnesses. Whether upstream harness projects will accept pin/verify
  contributions is unknown.
  **Disposition: TARGETED.** Promotion predicate: an in-type harness truth-pack
  precedent is observed, or the S3 truth-pack assembly explicitly adopts the inferred
  model-packet pattern with the inference labeled.
- **UNK-EH-08** — lm-eval's actual sampling/seed API was not verified this pass (grep on
  `lm_eval/api/sampler.py` returned nothing; only `tests/test_samplers.py` confirms seeded
  behavior). Any nondeterminism-floor claim for the dummy path needs a follow-up file check.
  **Disposition: TARGETED.** Promotion predicate: the file check of `lm_eval/api/sampler.py`
  completes and the nondeterminism floor for the dummy path is committed in
  NONDETERMINISM_FLOOR.md.

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
Status: ADMISSIBLE (evidence supports) / CONTESTED (evidence partial/conflicting) / WITHDRAWN.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-EH-01 | Active eval harnesses ship a mock/dummy model provider for offline testing. | UKGovernmentBEIS/inspect_ai `src/inspect_ai/model/_providers/mockllm.py` ("for testing purposes", scripted `custom_outputs`); EleutherAI/lm-evaluation-harness `lm_eval/models/dummy.py` (`DummyLM`, registered `"dummy"`) | T0 | High | ADMISSIBLE |
| CLAIM-EH-02 | Scorers and metrics are unit-tested like library code against fixtures/golden data. | inspect_ai `tests/scorer/` (~30 files incl. `test_match.py`, `test_math.py`, `test_metric.py`, `test_krippendorff.py`, `tests/scorer/logs/` golden logs); lm-eval `tests/test_metrics.py`, `tests/test_aggregation_pipeline.py` | T0 | High | ADMISSIBLE |
| CLAIM-EH-03 | Mature harnesses version task/dataset configs explicitly rather than mutating benchmarks in place. | lm-eval task YAMLs (`lm_eval/tasks/hellaswag/hellaswag.yaml`, `metadata: version: 1.0`, `metric_list` with aggregation + `higher_is_better`); harbor-framework/terminal-bench-1 dataset pinning (`tb run --dataset-version 0.1.1`, separate `terminal-bench-datasets` repo) | T0 | High | ADMISSIBLE |
| CLAIM-EH-04 | The affordable-CI pattern for large benchmark suites is validating only changed evals. | lm-eval `.github/workflows/new_tasks.yml` + `tests/utils.py` (changed-task parser), fixtures in `tests/testdata/`, `tests/testyamls/`, `tests/test_configs/` | T0 | High | ADMISSIBLE |
| CLAIM-EH-05 | Harness CI is tiered: cheap lint/typecheck/fast tests gate merges; slow/Docker tests run behind explicit markers. | inspect_ai `.github/workflows/build.yml` (ruff, mypy matrix, `pytest --runslow -m slow`, separate `docker.yml`); lm-eval `.github/workflows/unit_tests.yml` (pre-commit + CPU matrix) | T0 | High | ADMISSIBLE |
| CLAIM-EH-06 | Containerized, deterministic test execution with log parsing is the standard grading shape for code-agent evals — scoring by pinned tests in pinned containers, not by LLM judgment where avoidable. | SWE-bench/SWE-bench `swebench/harness/run_evaluation.py`, `grading.py`, `log_parsers/`, `constants/` | T0 | High | ADMISSIBLE |
| CLAIM-EH-07 | The most copy-worthy single practice in the type is adversarial testing of the harness's own graders (anti-cheat). | SWE-bench `tests/test_grading_spoofed_output.py`, `test_grading_truncated_ids.py`, `test_grading_skipped.py`, `test_infra_failure.py` plus parser golden tests | T0 | High | ADMISSIBLE |
| CLAIM-EH-08 | Harness code and benchmark data live in separate, separately-versioned homes. | inspect_ai vs UKGovernmentBEIS/inspect_evals; terminal-bench-1 harness vs `terminal-bench-datasets`; lm-eval task YAMLs referencing external HF `dataset_path` rather than vendoring data | T0 | High | ADMISSIBLE |
| CLAIM-EH-09 | Registry-of-benchmarks with per-eval packages and colocated tests is the established extensibility shape. | openai/evals `evals/registry.py`, `evals/elsuite/`, per-eval modules, `evals/data_test.py`, `evals/record_test.py`, `tests/unit/evals/` | T0 | High | ADMISSIBLE |
| CLAIM-EH-10 | The PASS/FAIL decider must be importable and testable without any model: response generation and checking are separate modules. | ShishirPatil/gorilla `bfcl_eval/`: `eval_checker/` vs `model_handler/` vs `constants/`; `TEST_CATEGORIES.md` checker taxonomy | T0 | High | ADMISSIBLE |
| CLAIM-EH-11 | Runner-level golden/regression suites pin end-to-end verdicts against drift. | harbor-framework/harbor `tests/golden/terminus_2/`, `tests/unit/`, `tests/integration/`, `tests/runtime/`, `tests/conftest.py` | T0 | High | ADMISSIBLE |
| CLAIM-EH-12 | New benchmark submissions are gated by documented automated checks and contribution policy before merge. | inspect_ai `.github/workflows/pr-gate.yml` (contribution-policy gate), `suppressions.yml`; inspect_evals `AUTOMATED_CHECKS.md`, `BEST_PRACTICES.md`, `APPROVED_CONTRIBUTORS.md` | T0 | High | ADMISSIBLE |
| CLAIM-EH-13 | A harness starting point can be validated end-to-end with zero live-model dependency. | thin: CLAIM-EH-01's dummy providers plus lm-eval changed-eval CI running tasks with the dummy model. Inference — no evidence file records a repo's full offline CI path being exercised, only the components. | T3 | Low | CONTESTED |
| CLAIM-EH-14 | Eval-harness repos are less CI-visible than harness practice implies: at least one active benchmark lineage ships no visible CI. | sierra-research/tau-bench: no `.github` found via API; process evidence limited to `tau_bench/envs`, `tau_bench/agents`, `run.py` layout; last push 2026-03-18 (oldest among active harnesses here) | T0 | High | ADMISSIBLE |

## Gate profile

Starter-kit gates G1–G14 (canonical definitions in PROJECT-PICKUP-PLAYBOOK.md, from `_s0/g1-g14-reference.md`): G1 ORACLE, G2 PAIR,
G3 OWN, G4 CONTRACT, G5 HOST, G6 UNSAFE, G7 REVIEW, G8 RULEBOOK, G9 IOU, G10 MIRI,
G11 LAYOUT, G12 AUDIT, G13 NOSTUB, G14 REJECT.

**Apply as-is:** G1 ORACLE (pin harness + oracle + dataset revisions; oracle shielded from the
implementing agent — critical here because a harness author can silently weaken its own graders),
G3 OWN (every claim row carries owner), G4 CONTRACT (claim artifacts conform), G7 REVIEW
(split-context adversarial review of graders — the anti-cheat tests are review made executable),
G8 RULEBOOK (claim discipline; judge-model verdicts are the highest-risk claim surface),
G9 IOU (zero unresolved at close), G12 AUDIT (class-fix + instance re-audit across all graders),
G13 NOSTUB (no stubbed scorers/checkers — a `TODO` in a checker is a verdict hole),
G14 REJECT (claims violating tier burden rejected; dummy-provider-only numbers may not support
live-model claims).

**Need type-specific parameters:** G2 PAIR — for eval harnesses, the "paired" contract is
harness-vs-oracle-agreement (dummy/scripted runs must match the oracle's known verdicts on the
acceptance surface) plus judge-vs-deterministic-checker agreement bounds where LLM judges are used;
G5 HOST — host-parity must cover sandbox/Docker runtime (the grading containers are part of the
measurement path, cf. SWE-bench), plus API-provider identity for any live-model legs; G6 UNSAFE —
advisory for this type (canonical G6 governs new unsafe code sites in the project under
assessment): sandbox-escape-relevant ambient reads from the grading sandboxes
(inspect_ai Docker/k8s, terminal-bench containers) are declared in the same diff
as a labeled G6-analog for the grading sandbox; G10 MIRI, G11 LAYOUT — mechanism is Rust-specific; for this type they are N/A
unless the harness under assessment is itself Rust (record as N-A with the reason, not silent).

Proposed new type-specific gates:

- **GATE-EH-1 (ANTI-CHEAT)** — Every scorer/checker ships parser golden tests AND adversarial
  tests (spoofed PASS lines, truncated IDs, skipped-test masking, infra-failure handling);
  acceptance: the full anti-cheat suite passes against the shipped checker commit, modeled on
  SWE-bench `tests/test_grading_spoofed_output.py` / `test_grading_truncated_ids.py` /
  `test_grading_skipped.py` / `test_infra_failure.py`.
- **GATE-EH-2 (CHECKER-INDEPENDENCE)** — The PASS/FAIL decider imports and runs with no model,
  no API key, and no network; acceptance: `python -c "import eval_checker"`-style import plus the
  full checker unit suite green in a network-blocked container (BFCL `eval_checker/` separation).
- **GATE-EH-3 (DUMMY-PATH)** — The complete eval pipeline runs end-to-end on the mock/dummy
  provider with scripted outputs; acceptance: CI executes at least one full benchmark tier on the
  dummy provider on every merge (inspect_ai `mockllm`, lm-eval `DummyLM` pattern).
  [Inference, labeled]: a green dummy-path run proves pipeline wiring, not grading
  correctness — the mock's scripted outputs cannot validate the grader's judgment;
  claiming "the harness grades correctly" from GATE-EH-3 alone is a G14 violation
  (the honest evidence is the anti-cheat suite + parser goldens).
- **GATE-EH-4 (DATASET-PIN)** — No benchmark config may change without a version bump; acceptance:
  CI rejects un-versioned task mutations and the dataset pin (commit/digest/version) is recorded
  in the truth pack (terminal-bench `--dataset-version`, lm-eval `metadata: version` pattern).

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Harness-correctness claims rest on pinned harness/oracle/dataset revisions (GATE-EH-4; incumbent pins) |
| GATE-007 (Sandbox escape + resource accounting) | Advisory | Docker/k8s grading legs route through GATE-007's confinement checks; no adversarial escape claim |
| GATE-010 (Trace completeness / privacy) | Advisory | Run receipts and judge-call logging follow the completeness discipline; no user-data traces in the plan |
| GATE-011 (Guardrail false-positive / false-negative) | Advisory | Safety-eval harnesses reuse the attack/judge separation discipline; the anti-cheat suite is the local instrument (GATE-EH-1) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; mockllm dummy provider + checker green in a network-blocked container (REQ-EH-1/2, GATE-EH-2/3) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; lint/typecheck/fast unit gate merges, slow/Docker/model-backed tiers separate (REQ-EH-5) |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; harness commit, oracle commit, dataset digest, container digests (incumbent pins) |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; judge-leg nondeterminism bounded by the floor, not by quarantine labeling |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md); the program-wide
vocabulary from `_s0/model-guides.md`
([Verified] flavors, [Maintainer claim], [External], [Inference]) stays normative:

- **T0 [Verified] (verified in-tree)** — `MANIFEST.sha256`-pinned fixtures, golden logs, and the repo's
  own test suites observed green at the pinned commit (parser goldens, anti-cheat tests,
  dummy-path CI runs). This is the only tier that may support "the harness grades correctly" claims.
- **T1 [CI-observed]** — observed CI runs / banked receipts for the harness's own
  suites (attests the suite *runs*, not that it is green or honest). Workflow-file
  existence (`.github/workflows/build.yml`, `new_tasks.yml`, `docker.yml`) is
  inspection, not execution evidence: it supports T0 "practice exists / configured"
  claims only, never T1.
- **T2 [Maintainer claim]** — README adoption claims (e.g. lm-eval's Open LLM
  Leaderboard backend and the NVIDIA/Cohere/BigScience/BigCode/Nous/Mosaic
  list): T0 for the canonical README line's existence (observed firsthand at
  README line 57), T2 for the substance of the adoption claims themselves;
  star counts; contribution-policy docs.
- **T3 [Inference]** — layout-based claims ("simulated user + tool sandbox" pattern in
  tau-bench from `tau_bench/envs`/`tau_bench/agents`/`run.py` alone, given no CI evidence).
- **Excluded** — scores produced by a harness against itself without the anti-cheat suite;
  judge-model verdicts without judge identity + nondeterminism floor; any "benchmark improved"
  claim whose dataset config changed without a version bump (REQ-EH-3 violation).

## Localbench bench shape

- **Spec format** — `harness@pin:oracle:model`, e.g. `inspect_ai@<commit>:dummy:mockllm-scripted-v1`,
  `lm-eval@<commit>:dummy:DummyLM`, `swebench@<commit>:oracle:parser-suite`. The harness starts/stops
  sandboxes itself; no live model key on the host.
- **Named tiers** — `dummy` (full pipeline on mock provider, scripted transcripts), `checker`
  (checker unit + anti-cheat suite), `golden` (runner-level golden regressions, harbor
  `tests/golden/`-style), `changed-eval` (only evals touched by the diff, lm-eval `new_tasks.yml`
  pattern), `sandbox` (Docker/k8s grading legs), `judge` (only when an LLM judge is in the loop;
  carries a nondeterminism floor instead of exact goldens).
- **Golden layout** — JSON per spec per tier: `conformance` (named checks, `level: MUST|SHOULD`,
  `verdict: PASS|FAIL`) + `metrics` (value, spread from A/A, tol, tol_source → receipt, better).
  MUSTs: dummy-path green, all anti-cheat tests green, checker suite green in network-blocked
  container, dataset pins recorded. SHOULDs: sandbox leg green, judge-leg agreement within floor.
- **Tolerance rule** — `tol = max(3 × A/A relative spread, floor)`; for pass/fail verdict tiers the
  floor is exact-match (verdicts are bits, not floats); for judge/scored metrics the floor is the
  committed `NONDETERMINISM_FLOOR.md` value.
- **A/B/A ordering** — same-invocation A, B, A: two identical harness commits (A/A null) before any
  harness-change arm (B) is admitted; banked under a name.
- **Machine-state/contention receipts** — preflight refuses a busy machine (CPU > 25% by non-backend
  processes names the processes); runs marked CONTENDED on interference; one harness under test at a
  time; sandbox/Docker daemons are part of the recorded machine state; receipts at
  `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json` (kinds: aa, ab, run, golden) with
  `<ts>__<kind>__<spec>` scratch dirs gitignored.
- **Banking ceremony** — goldens written ONLY by A/A pair runs (`aa <spec> --write-golden`, refuses
  unsound pairs), followed by `git diff goldens/` review in the same commit; regenerating goldens
  until green is a named forbidden pattern (reward-hacking law, verbatim in AGENTS.md).
- **Host binding** — `goldens/<host_id>/`; never compared across hosts or generations; harness or
  oracle update = new generation; status CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden.
- **Claims wiring** — `registries/claims.tsv`: every public claim sentence registered and
  machine-checked against its receipt on every commit; negative-evidence ledger
  (`NEGATIVE_EVIDENCE.md`, `DISCREPANCIES.md`) seeded with grader-cheat attempts and parser bugs.
- **Incumbent pins** — `docs/evidence/incumbents.md`: exact versions + hashes of every external
  thing numbers depend on (harness commit, oracle repo commit, dataset digest, container digests,
  judge model identity if any, OS).

## Starter-kit deltas

Concrete additions the franken starter kit needs to assess or build eval harnesses:

1. **Anti-cheat test template** — `templates/checker-anti-cheat/` with spoofed-output, truncated-ID,
   skipped-test, and infra-failure test scaffolds (SWE-bench trio + `test_infra_failure.py` as the
   reference shape), wired as a shared gate (GATE-EH-1).
2. **Dummy-provider contract** — starter-kit interface spec for a `dummy` model backend
   (scripted outputs, iterable/generator/callable, zero credentials), with the CI requirement that
   at least one full tier runs on it every merge (inspect_ai `mockllm.py`, lm-eval `DummyLM`).
3. **Checker-independence gate** — a shared gate asserting the scorer/checker imports and passes
   its suite in a network-blocked container (GATE-EH-2); admission checklist item in the playbook.
4. **Eval registry + version-bump enforcement** — per-eval directory shape (`registry.py`-style
   entry, colocated tests) and a CI check rejecting un-versioned benchmark mutations
   (GATE-EH-4; openai/evals registry and lm-eval `metadata: version` as reference).
5. **Contribution-policy template** — `AUTOMATED_CHECKS.md` / `BEST_PRACTICES.md` starter docs for
   benchmark submissions, modeled on inspect_evals, gated by a pr-gate-style workflow.
6. **Judge-leg honesty annex** — when an LLM judge is in the loop: judge identity recording,
   committed nondeterminism floor, and agreement bounds vs the deterministic checker; judge verdicts
   may never overrule a deterministic checker's FAIL without a recorded waiver.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Star counts are the 2026-09-23 GitHub API snapshot; trend evidence, not rankings.

- **UKGovernmentBEIS/inspect_ai** | 2,850 stars | The incumbent agentic-eval framework
  (Task/solver/scorer DSL, 40+ model providers, Docker/k8s sandboxed tool execution); METR built
  its cloud eval platform (METR/hawk) on top of it.
- **EleutherAI/lm-evaluation-harness** | 14,062 | The canonical academic-eval harness; README
  (line 57) states it backs HF's Open LLM Leaderboard and is used internally by NVIDIA, Cohere,
  BigScience, BigCode, Nous Research, Mosaic ML.
- **openai/evals** | 19,495 | OpenAI's original eval framework + community registry — the
  registry-of-benchmarks pattern most harnesses copied; last push 2026-04-14.
- **harbor-framework/harbor** | 5,538 | Active Terminal-Bench-line successor; tests split
  unit/integration/golden/runtime with per-environment golden suites.
- **SWE-bench/SWE-bench** | 5,897 | The reference agentic-coding benchmark + containerized grading
  harness; defines the issue→Docker→test-suite pattern and the anti-cheat test discipline.
- **ShishirPatil/gorilla** | 13,039 | Hosts the Berkeley Function-Calling Leaderboard;
  deterministic `eval_checker/` cleanly separated from model-handling code, checker taxonomy
  documented in `TEST_CATEGORIES.md`; last push 2026-04-13.
- **sierra-research/tau-bench** | 1,445 | Tool-calling agent benchmark (simulated retail/airline
  envs); evidences the simulated-user + tool-sandbox pattern as a live third-party lineage.
- **harbor-framework/terminal-bench-1** | 2,593 | Terminal-Bench benchmark (renamed from
  `laude-institute/terminal-bench` via HTTP 301); pinned/versioned datasets via a separate
  `terminal-bench-datasets` repo.
- **UKGovernmentBEIS/inspect_evals** | 680 | 200+ community eval implementations; contribution
  gating via `AUTOMATED_CHECKS.md`, `BEST_PRACTICES.md`, `APPROVED_CONTRIBUTORS.md`.
- **openai/human-eval** | 3,386 | Canonical code-generation benchmark dataset; stale
  (2025-01-17) — reference set, not a maintained harness.
- **google/BIG-bench** | 3,245 | Canonical broad-capability LLM benchmark dataset; stale
  (2024-07-19) — archetypal dataset repo.

**Honest caveats (carried over):** tau-bench shows no visible CI (API 404 on `.github`) —
process claims from it rest on layout only; its 2026-03-18 push is the oldest among active
harnesses. Terminal-bench naming is confusing: the 301 line is `laude-institute/terminal-bench` →
`harbor-framework/terminal-bench-1`; a separate `harbor-framework/terminal-bench` (760 stars)
exists — lineage claims rest on the observed 301 only. human-eval and BIG-bench are stale and
cited as canonical datasets, not harnesses. The `mockllm.py`-for-testing claim rests on the
provider's documented purpose; no specific test file invoking it was verified (conftest grep
surfaced only an unrelated S3 mock). lm-eval's sampling/seed API was not verified this pass —
determinism claims rest on `tests/test_samplers.py` and task-YAML `metadata.version` only.
Star counts and push dates are point-in-time (2026-09-23).

## Unknowns (UNK-*)

- **UNK-EH-01** — Which oracle, if any, do existing harness repos use to check *their own* graders
  beyond the SWE-bench parser/anti-cheat suite? The evidence shows graders being tested, but only
  SWE-bench shows a systematic adversarial battery; whether inspect_ai, lm-eval, or harbor have
  equivalent anti-cheat coverage is unverified.
  **Disposition: TARGETED.**
- **UNK-EH-02** — lm-eval seed/sampling API: `lm_eval/api/sampler.py` grep found no "seed" in this
  pass. The nondeterminism floor for the dummy path cannot be committed until this is checked.
  **Disposition: TARGETED.**
- **UNK-EH-03** — Judge-model verdicts: none of the evidence repos provided a verified judge-honesty
  pattern (judge identity recording, judge-vs-checker agreement bounds). The starter-kit judge annex
  is inferred from model-guide oracle discipline, not from an eval-harness precedent.
  **Disposition: TARGETED.**
- **UNK-EH-04** — How do harness maintainers version *task content* (not just configs) when
  datasets live externally (HF hub paths like `Rowan/hellaswag`)? The evidence shows YAML
  `metadata.version` but no dataset-content pinning discipline — the terminal-bench-datasets
  separate-repo pattern is the only observed answer, and its exact mechanics were not verified.
  **Disposition: TARGETED.**
- **UNK-EH-05** — tau-bench's absent CI: is there CI in a nonstandard location, or is there truly
  none? If none, the "simulated user + tool sandbox" lineage lacks the process evidence the
  pickup playbook assumes — resolve before citing tau-bench in any S5 readiness claim.
  **Disposition: TARGETED.**
- **UNK-EH-06** — The relationship between `harbor-framework/terminal-bench` (760 stars, active)
  and `harbor-framework/terminal-bench-1` (the renamed original): which line carries the
  pinned-dataset mechanism forward? Unresolved by the evidence pass; affects which repo is the
  terminal-bench oracle.
  **Disposition: TARGETED.**
