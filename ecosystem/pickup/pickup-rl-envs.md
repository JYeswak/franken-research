# Pickup companion: RL environments / RLHF infrastructure

Type: Gymnasium-class RL environment APIs + RLHF/RLVR training stacks (PPO, DPO, GRPO, RLOO, DAPO, REINFORCE++).
Evidence basis: `_evidence/rl-envs.md` (six repos, all verified via GitHub API 2026-09-23). No repo cited from memory.

## Charter seed

This project type builds or reimplements RL environment interfaces (obs/action spaces, reset/step/seeding contracts, multi-agent variants) and/or RL post-training trainers for LLMs (policy-gradient loops, reward models, KL estimators, advantage aggregation).

In scope: env API conformance (reset/step/seed/space containment), vectorized envs, seeding-determinism harnesses, per-algorithm trainer fidelity (loss/KL/advantage math vs a pinned oracle), reward-shaping regression tests, distributed-training smoke coverage, tiered CI (fast PR vs nightly multi-GPU e2e).

Out of scope: inventing new RL algorithms (this is a port/parity discipline, not a research program); reward-model training data curation; production serving infra (that's the model-serving pickup type's territory); GPU kernel work.

A good starting point for this type = a pinned upstream reference (Gymnasium envs or a trainer's math), a conformance checker shipped as a library API (per `env_checker.py` / `api_test.py` practice), gradient/shape-level regression tests for the objective math before any full trainer run, and honest determinism accounting (seeding floor documented, nondeterministic fixtures labeled NONDETERMINISM_FLOOR.md, never asserted as exact).

### Requirements

- REQ-1: The project ships an env/API conformance checker as importable code and runs it over every bundled env in CI (Gymnasium `env_checker.py` / PettingZoo `api_test.py` pattern).
- REQ-2: Reward/objective math (KL estimators, advantage aggregation, reward shaping) has gradient/shape-level regression tests against a pinned oracle implementation, independent of end-to-end trainer runs.
- REQ-3: Same-seed → same-trajectory determinism is asserted at unit, checker, and (if present) vectorized levels; the nondeterminism floor for stochastic components is a committed file.
- REQ-4: CI is tiered: fast PR tests (minutes) vs slow/nightly e2e suites (trainer loops, distributed smoke); goldens regenerate only via the A/A banking ceremony.
- REQ-5: Per-algorithm test files mirror the source layout (one file per trainer/env family) with a shared fixtures module; lint/quality checks are a separate required gate from tests.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all from `_evidence/rl-envs.md`):

1. **Gymnasium reference envs** (Farama-Foundation/Gymnasium) — env-API oracle for a clean-room env implementation: `gymnasium/utils/env_checker.py` (incl. `check_reset_seed_determinism`, space containment) and `passive_env_checker.py`; CI pattern `tests/envs/test_env_implementation.py` runs the checker over every registered env.
2. **PettingZoo conformance suite** (Farama-Foundation/PettingZoo) — multi-agent oracle: `pettingzoo/test/api_test.py` as the third-party conformance entrypoint; `test/seed_test_test.py` for seed determinism.
3. **TRL trainers** (huggingface/trl) — trainer-math oracle: per-algorithm trainer implementations pinned for KL/loss/reward math comparison (`tests/test_rewards.py` shows the test shape to mirror).
4. **OpenRLHF tests** (OpenRLHF/OpenRLHF) — objective-math oracle: `tests/test_reward_shaping.py`, `tests/test_kl_estimator_gradient.py`, `tests/test_loss_aggregation.py` as the gradient/shape-level regression pattern to copy.

Integrity checks (truth-pack shape, per `_s0/model-guides.md`):

- `docs/truth-pack/PIN_RECORD.md` — upstream commit pin for each oracle (e.g. Gymnasium release tag or commit), dated, with the honest note of any pin-age skew (tts pattern: code pin newer than weights pin).
- `docs/truth-pack/MANIFEST.sha256` — fixture hashes (trajectory traces, dummy reward-model outputs, space snapshots) captured via `fetch-truth-pack.sh --verify`.
- `docs/truth-pack/ACCEPTANCE_SURFACE.json` — pre-computed break-even thresholds before any trainer experiment (e.g. max acceptable KL-estimator deviation, per-seed trajectory divergence budget) — tts `ACCEPTANCE_SURFACE.json` pattern.
- `docs/truth-pack/NONDETERMINISM_FLOOR.md` — which components are stochastic by construction (env RNG, sampler temperature, distributed all-reduce ordering) and what is asserted about them (distribution-level, never trajectory-exact).
- Invocation-time oracle SHA-256 recording: any benchmark/duel against the pinned oracle trainer or env records the oracle blob's SHA-256 at invocation (whisper CAMPAIGN-WIN rule) — no un-recorded executable is admissible.
- UNK-1: See UNK-1 in Unknowns below (not redefined here).
- UNK-2: See UNK-2 in Unknowns below (not redefined here).

## Initial claims (CLAIM-*)

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-1 | RL env projects ship their conformance checker as a library API and run it on all bundled envs in CI. | thin: Gymnasium `gymnasium/utils/env_checker.py` + `tests/envs/test_env_implementation.py`; PettingZoo `pettingzoo/test/api_test.py` — 2 of 6 repos; no evidence this is universal | T0 | High | ADMISSIBLE |
| CLAIM-2 | Same-seed determinism is tested at unit, checker, and vectorized levels. | thin: Gymnasium `tests/vector/`, `check_reset_seed_determinism`; PettingZoo `test/seed_test_test.py` — 2 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-3 | Reward/objective math (KL estimators, reward shaping, loss aggregation) gets gradient/shape-level regression tests, not only e2e trainer runs. | OpenRLHF `tests/test_reward_shaping.py`, `tests/test_kl_estimator_gradient.py`, `tests/test_loss_aggregation.py`; huggingface/trl `tests/test_rewards.py` — 2 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-4 | RLHF stacks split CI into fast PR tests vs slow/nightly multi-GPU e2e suites. | huggingface/trl `.github/workflows/tests.yml` vs `slow-tests.yml`; verl-project/verl `cpu_unit_tests.yml` vs `gpu_unit_tests.yml` vs `e2e_ppo_trainer.yml`; Gymnasium full-docker vs smoke; deepspeedai/DeepSpeed `TEST_SELECTION.md` — 4 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-5 | Per-algorithm trainer tests mirror the source layout, one file per component, with a shared fixtures module. | huggingface/trl `tests/test_dpo_trainer.py`, `test_grpo_trainer.py`, `test_rloo_trainer.py`, `test_sft_trainer.py`, `tests/testing_utils.py`, `tests/testing_constants.py`; verl-project/verl — 2 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-6 | Distributed-training smoke tests live in dedicated in-repo dirs, separate from unit tests. | huggingface/trl `tests/distributed/test_distributed.py`; verl-project/verl `tests/single_controller/`, `tests/special_distributed/`, `tests/special_sanity/` — 2 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-7 | Lint/quality gates (ruff/black/pre-commit) are separate required checks from test gates. | huggingface/trl `quality.yml`; Farama-Foundation/Gymnasium `run-pre-commit.yml`; OpenRLHF `.pre-commit-config.yaml`; deepspeedai/DeepSpeed `formatting.yml` — 4 of 6 repos | T0 | High | ADMISSIBLE |
| CLAIM-8 | No examined repo ships explicit "reward-hacking regression tests" by that name; the category is a gap a new project could own. | thin: exhaustive-negative claim from six-repo tree scan; closest are reward-shaping/KL-estimator gradient tests (OpenRLHF) and `tests/test_rewards.py` (TRL) | T0 | Medium | CONTESTED |
| CLAIM-9 | Multi-GPU e2e CI scale (verl's ascend/megatron/vllm/sglang/nightly matrix) is resource-gated and not copyable by a clean-room project; the tiering is the portable part. | verl-project/verl workflow matrix vs stated clean-room constraint — inference, not observed fact | T3 | Low | ADMISSIBLE |
| CLAIM-10 | OpenRLHF's CI story is weaker than its test design: unit tests exist but the sole workflow builds/publishes wheels on release without visibly running tests on PRs. | OpenRLHF/OpenRLHF `.github/workflows/python-package.yml` vs `tests/` dir — single-repo observation, CI visibility limits | T0 | Medium | CONTESTED |
| CLAIM-11 | DeepSpeed-Chat is a blog + recipes, not a tested component; its evidence value for this type is distributed-training smoke-test practice, not RLHF test design. | deepspeedai/DeepSpeed tree: rlhf-named paths only under `blogs/deepspeed-chat/...` — single-repo observation | T0 | High | ADMISSIBLE |
| CLAIM-12 | Gymnasium is the still-maintained canonical RL env API standard that new env implementations are built against. | Farama-Foundation/Gymnasium 12,572 stars, pushed 2026-09-21 — maintainer-successor status is self-described by the project (Farama), independently evidenced by activity | T0 | High | ADMISSIBLE |

## Gate profile

Starter-kit G1–G14 (ORACLE, PAIR, OWN, CONTRACT, HOST, UNSAFE, REVIEW, RULEBOOK, IOU, MIRI, LAYOUT, AUDIT, NOSTUB, REJECT):

- Apply as-is: G1 oracle (truth-pack + invocation SHA-256 recording is the load-bearing gate for this type — an unverified trainer/env oracle admits nothing); G4 contract (env reset/step/seed contract assertions); G5 host (bench runs host-bound; GPU contention accounting is critical since trainer smoke tests are GPU-bound); G7 review (split-context adversarial review default-refute, given the claim-invention risk in RL copy); G8 rulebook; G11 layout — canonical Rust meaning (layout-sensitive structs carry `size_of`/`align_of` assertions); advisory/N-A for pure-Python components; G12 audit; G13 nostub (no stubbed reward models / fake env dynamics); G14 reject (refusal-to-claim machinery). Test-directory mirroring of the source layout is a local requirement (REQ-5), not G11.
- Need type-specific parameters: G2 pair (A/B arms must share the pinned oracle commit + seed set; "same-invocation A, B, A" extended to seed-swept triplets); G3 own (per-algorithm ownership: each trainer's math owns its gradient/shape regression file); G9 IOU (IOUs allowed for multi-GPU e2e results on hardware the project lacks, with the exact missing-machine record).
- Advisory / weak fit: G6 unsafe (Rust-unsafe classification; this type is Python/RL-library code — route through only if the project drops to native extensions); G10 miri (Rust-only; N/A unless native components exist).

Proposed new type-specific gates:

- GATE-RL-01 — CONFORMANCE-CHECKER-SHIPPED: the env/API checker is importable library code (not test-only), runs over every bundled env in CI, and any env failing the checker fails the build. Acceptance: CI log shows checker invocation per env with zero failures; checker importable from an installed wheel.
- GATE-RL-02 — OBJECTIVE-MATH-REGRESSION — RETIRED into shared GATE-012 (S4 round 1, dedup). GATE-012 acceptance (5) already requires gradient/shape-level tests for reward/objective math. Retained as a type-specific parameter: a per-algorithm test file exists (finite-diff or fixed-fixture against the pinned oracle), pins recorded in PIN_RECORD.md, all PASS on the fast tier.
- GATE-RL-03 — SEED-DETERMINISM-TRIPLET: same-seed trajectories bit-match (or match within the documented nondeterminism floor) at unit, checker, and vectorized levels across a fixed seed set ≥ 8 seeds. Acceptance: checker-level seed test green; vectorized determinism test green where vector envs exist; floor file lists every stochastic exception with justification.
- GATE-RL-04 — NO-REWARD-HACK-BY-CONSTRUCTION ([Inference]): reward-shaping changes require a negative-control test showing a degenerate policy (constant action / max-entropy) cannot inflate the shaped reward. Acceptance: at least one such test exists per shipped shaping function; honest label if the category is still thin (see CLAIM-8, UNK-2).

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Load-bearing | Applies to this slug (env/dataset pins); G1 names truth-pack + invocation SHA-256 as the type's load-bearing gate; reward math tested vs pinned oracle (REQ-2) |
| GATE-012 (Training reproducibility / eval-after-train) | Load-bearing | Applies to this slug; objective-math gradient/shape regressions + seed-determinism triplets (GATE-RL-02 retired into 012; GATE-RL-03); GPU e2e off the PR path (REQ-4) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; CPU smoke trains in PR CI |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; fast PR vs slow/nightly e2e (REQ-4) |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; torch/transformers versions, HF fixture revisions |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; seed-swept triplets + A/A |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), mapped to the
localbench/program vocabulary ([Verified] flavors; [CI-observed] — attests
the suite runs, not that it is green; [Maintainer claim]; [External];
[Inference]):

- T0 [Verified]: upstream pins with SHA (commit + tree hash) for Gymnasium/TRL/verl/OpenRLHF/PettingZoo/DeepSpeed; invocation-time oracle binary SHA-256 receipts; fetched-trajectory fixtures under MANIFEST.sha256. Admissible: anything with a hash and a verify script.
- T1 [CI-observed]: CI-observed green runs of the conformance checker on the project's own envs; A/A-banked goldens with receipts; third-party reruns of the seed-determinism triplet.
- T2 [Maintainer claim]: trainer e2e loss curves, wall-clock numbers from the project's own harness (admissible for SELF-SPEEDUP/MAINTENANCE class only — SELF-SPEEDUP = beating your own prior implementation, which maintainer numbers can support; CAMPAIGN WIN = beating an independent incumbent, which requires independent verification; per the whisper packet's result-class doctrine, cited here not defined there); maintainer claims about env coverage.
- T3 [Inference]: GATE-RL-04 reward-hacking coverage, TARGETED break-even thresholds in ACCEPTANCE_SURFACE.json before measurement, any "matches TRL" claim without a pinned oracle run. Zero T3 numbers in the README by written policy (nlp TARGETED-vs-OBSERVED pattern).

## Localbench bench shape

- Spec format: `oracle:<env-or-trainer>@<pin-short-sha>:<harness>` — e.g. `gymnasium:cartpole-v1@<sha>:envcheck`, `trl:grpo@<sha>:mathreg`. The spec names the oracle pin, not just the component; a pin change = new generation.
- Named tiers: `conformance` (checker over all bundled envs, MUST PASS), `seed` (determinism triplet), `reward-math` (gradient/shape regressions), `dist-smoke` (single-controller / multi-proc smoke, SHOULD on CPU-only hosts), `e2e-trainer` (nightly-only, multi-GPU), `quality` (lint/format gate). Goldens bind per tier; a reward-shaping change re-banks only `reward-math` + `e2e-trainer`.
- Golden schema: `conformance` (named checks with `level: MUST|SHOULD`, `verdict: PASS|FAIL`) + `metrics` (loss/KL/advantage values, trajectory hashes) each with `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt, `better` direction. Tolerance: `tol = max(3 × A/A relative spread, floor)`; trajectory-hash metrics are exact-match (floor = 0) unless listed in NONDETERMINISM_FLOOR.md.
- Banking ceremony: goldens written ONLY by `aa <spec> --write-golden` (two runs → receipt + golden, refuses unsound A/A pairs); `git diff goldens/` reviewed in the same commit; golden-regeneration-until-green is forbidden (localbench anti-reward-hacking law, verbatim in AGENTS.md).
- Host/generation binding: `goldens/<host_id>/`; GPU e2e goldens additionally bind accelerator model + driver (IOU recorded where the machine is missing).
- Measurement law: preflight refuses a busy machine (GPU/CPU > 25%, names processes); CONTENDED marking; one unit under test at a time; loopback/local-only; park/unpark interfering residents. Remote-lab variant: multi-GPU `e2e-trainer`/`dist-smoke` tiers run in a pinned remote lab with the same receipt format — never weakened into the local law.
- A/B discipline: same-invocation A, B, A ordering; for trainer math, arms additionally sweep the fixed seed set (G2 parameter).
- Receipts: `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json` (kinds: aa, ab, run, cost) + dated `.md` notes; `runs/` gitignored scratch. The `cost` receipt kind carries the cost block per Bench slot 13 for the GPU and remote-lab tiers: estimated vs actual GPU/lab hours, budget, funding owner, budget-exceeded disposition (what stops, who decides). UNK-4 admits the remote-lab cost is estimated, not measured.
- Incumbent pins: `docs/evidence/incumbents.md` — exact oracle commit SHAs, HF fixture revisions, torch/transformers versions, OS, accelerator.
- CI provisioning + cost ownership: runner class/host, provisioning owner, funding owner/account, schedule, and spend cap for the GPU and remote-lab tiers — TBD acceptable pre-S5 (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator assigns at S3).
- Claims wiring: `registries/claims.tsv` — every public parity sentence machine-checked against its receipt each commit; demotions always allowed.

## Starter-kit deltas

Files:
- `templates/rl-envs/env_checker_stub.py` — conformance-checker skeleton with the Gymnasium check categories (seeding determinism, space containment, reset/step contract) parameterized per env family.
- `templates/rl-envs/truth-pack/` — pre-filled PIN_RECORD.md / MANIFEST.sha256 / ACCEPTANCE_SURFACE.json / NONDETERMINISM_FLOOR.md / `fetch-truth-pack.sh --verify` for the two canonical oracle roles (env API via Gymnasium pin; trainer math via TRL pin).
- `templates/rl-envs/seed_triplet.py` — seed-set determinism harness emitting the triplet receipt format.
- `templates/rl-envs/reward_math_test.py` — gradient/shape regression template (finite-diff KL, advantage aggregation, shaping sanity) with negative-control (degenerate-policy) test slots for GATE-RL-04.
- `registries/claims.tsv` — RL preset with the CLAIM-* rows from this file as seed entries.

Gates: GATE-RL-01..GATE-RL-04 are type-local gates defined in this companion (`GATE-<SLUG>-<NN>` form); they are NOT adopted into the shared gate registry — registry adoption requires the shared-gates.md amendment procedure (two independent evidence files). G2's "same-invocation A, B, A" parameterized for seed-swept trainer arms.

Harness shapes: per-algorithm test dir layout (`tests/test_<algo>_trainer.py` + `tests/testing_utils.py` + `tests/testing_constants.py` mirroring TRL); CI workflow trio template (`tests.yml` / `slow-tests.yml` / `tests-experimental.yml` split) with a documented TEST_SELECTION.md; distributed smoke dir (`tests/distributed/`, `tests/special_distributed/`) wired to nightly only.

## Trend + process citations

Stars snapshot 2026-09-23; all six verified via GitHub API (stars + pushed_at) same day.

- Farama-Foundation/Gymnasium | 12,572 | pushed 2026-09-21 | still-maintained canonical env API standard; ships the check_env conformance pattern to copy.
- huggingface/trl | 19,369 | pushed 2026-09-23 | dominant LLM RLHF stack (PPO/DPO/GRPO/RLOO); per-algorithm test files + tiered CI to copy.
- verl-project/verl | 23,583 | pushed 2026-09-23 | highest-starred pure-RLHF training framework; heaviest e2e/nightly CI matrix — copy the tiering, not the scale.
- OpenRLHF/OpenRLHF | 10,040 | pushed 2026-09-17 | Ray-based RLHF alternative; gradient/shape-level reward/KL/loss tests are copy-worthy, CI story is thin.
- deepspeedai/DeepSpeed | 43,156 | pushed 2026-09-23 | distributed-training substrate; DeepSpeed-Chat is blog+recipes only — evidence value is dist smoke-test practice, not RLHF test design.
- Farama-Foundation/PettingZoo | 3,523 | pushed 2026-09-19 | multi-agent env API standard; ships `api_test.py` conformance entrypoint third-party envs are expected to pass.

Caveats (carried over): DeepSpeed-Chat is not a tested component; OpenRLHF's unit tests are not visibly run on PRs (weaker CI than the test design suggests); verl's CI scale is resource-gated; no repo ships "reward-hacking regression tests" by that name — the category is thin and a new project could own it (see CLAIM-8, GATE-RL-04, UNK-2).

## Unknowns (UNK-*)

- UNK-1: Can trajectory-level golden fixtures be captured reproducibly against pinned TRL/verl trainer commits, given HF-hub fixture dependencies (`testing_constants.py` dummy hub user) and accelerator-specific paths? Needs a fetch-verify dry run before S5.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Trajectory-fixture reproducibility parked: S3 fetch-verify dry run against pinned trainer commits; non-hermetic fixtures vendored by digest. Promotion predicate: at S3 truth-pack assembly, run the fetch-verify dry run capturing trajectory-level fixtures against the pinned TRL/verl trainer commits on the target accelerator class; record the reproducibility verdict in PIN_RECORD.md; if HF-hub dependencies break hermeticity, vendor the fixtures in-tree by digest in MANIFEST.sha256. Owner: plan author. S3 step: truth-pack assembly.
- UNK-2: Is there any verifiable oracle for anti-reward-hacking regression coverage (beyond reward-shaping/KL gradient tests)? None of the six repos ships one by that name (evidence caveat); a candidate oracle is unverifiable today. Category may need to be defined by the new project.
  **Disposition: TARGETED.**
- UNK-3: Which seed set size and which RNG layers (env, sampler, dataloader, distributed all-reduce) must the determinism triplet cover for RLHF trainers, where stochasticity is load-bearing? Unresolved.
  **Disposition: TARGETED.**
- UNK-4: What is the minimal admissible remote-lab receipt for multi-GPU e2e tiers a clean-room project cannot run locally — who attests the machine, and does IOU suffice or is independent rerun required?
  **Disposition: TARGETED.**
- UNK-5: G6/G10 applicability boundary: at what point does a Python RLHF stack's native-extension or custom-kernel work trigger the unsafe/miri gates? Needs a written threshold before S5.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Threshold resolved (formalizing the gate profile's existing :74 sentence): G6/G10 are N-A (advisory) for the pure-Python RLHF stack; they activate as load-bearing iff the tree gains native extensions (G6) or Rust components (G10); custom CUDA/C++ kernels are not G6-subject but get a namespaced type-local analog gate if the pickup introduces them.
