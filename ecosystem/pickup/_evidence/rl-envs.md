# RL envs / RLHF infra - evidence

Scope: Gymnasium-class environments + RLHF/RLVR training stacks (TRL, verl, OpenRLHF, DeepSpeed-Chat). Every repo verified 2026-09-23 via the GitHub API (stars + pushed_at) and API tree/contents listings. No repo cited from memory.

## Trend (owner/repo | stars | last push | why it evidences the trend)

- Farama-Foundation/Gymnasium | 12,572 | 2026-09-21 | the canonical RL env API standard (successor to OpenAI Gym); actively maintained, still the reference implementation envs are built against.
- huggingface/trl | 19,369 | 2026-09-23 | HF's RL post-training stack (PPO, DPO, GRPO, RLOO trainers); pushed same day as verification - the dominant library for LLM RLHF.
- verl-project/verl | 23,583 | 2026-09-23 | ByteDance Seed's HybridFlow-based RLHF/RLVR framework (PPO, GRPO, DAPO); highest-starred pure-RLHF training framework found; extensive e2e + nightly CI matrix evidences production use.
- OpenRLHF/OpenRLHF | 10,040 | 2026-09-17 | Ray-based PPO/DAPO/REINFORCE++ RLHF framework; 10k stars with focused tests/ dir evidences a real, maintained alternative to TRL.
- deepspeedai/DeepSpeed | 43,156 | 2026-09-23 | distributed training substrate (DeepSpeed-Chat is the RLHF recipe living in this repo); 43k stars, daily pushes, huge GPU CI matrix evidences the infra layer RLHF runs on.
- Farama-Foundation/PettingZoo | 3,523 | 2026-09-19 | multi-agent env API standard; ships a dedicated conformance suite (pettingzoo/test/api_test.py) that third-party envs are expected to pass.

## Process practices worth copying (practice | repos exhibiting it | file pointers)

1. **Env conformance suite as a shipped library API** | Gymnasium, PettingZoo | `Farama-Foundation/Gymnasium:gymnasium/utils/env_checker.py` (check_env: seeding determinism via check_reset_seed_determinism, obs/action space containment, passive variant `passive_env_checker.py`), `Farama-Foundation/Gymnasium:tests/envs/test_env_implementation.py` (runs checker over every registered env), `Farama-Foundation/PettingZoo:pettingzoo/test/api_test.py` (multi-agent conformance entrypoint). Most exportable practice in this category: a clean-room env API should ship its checker and run it on all bundled envs in CI.
2. **Determinism / seeding tests** | Gymnasium, PettingZoo | `Gymnasium:tests/vector/` (vectorized-env determinism), `PettingZoo:test/seed_test_test.py`, `Gymnasium:gymnasium/utils/env_checker.py::check_reset_seed_determinism`. Copy: same seed -> same trajectory assertions at unit, checker, and vector levels.
3. **Reward / objective math regression tests** | OpenRLHF, TRL | `OpenRLHF/OpenRLHF:tests/test_reward_shaping.py`, `tests/test_kl_estimator_gradient.py`, `tests/test_loss_aggregation.py`, `huggingface/trl:tests/test_rewards.py`. Copy: gradient/shape-level tests for KL estimators, reward shaping, and loss aggregation rather than only end-to-end trainer runs.
4. **Tests mirror source layout, one file per component/trainer** | TRL, verl | `huggingface/trl:tests/test_dpo_trainer.py`, `test_grpo_trainer.py`, `test_rloo_trainer.py`, `test_sft_trainer.py`, plus shared `tests/testing_utils.py` and `tests/testing_constants.py` (dummy CI hub user/fixtures). Copy: per-algorithm test files + a shared fixtures module.
5. **CI split into fast PR tests vs slow/nightly/e2e suites** | TRL, verl, Gymnasium, DeepSpeed | `huggingface/trl:.github/workflows/tests.yml` vs `slow-tests.yml` vs `tests-experimental.yml`; `verl-project/verl:.github/workflows/cpu_unit_tests.yml` vs `gpu_unit_tests.yml` vs `e2e_ppo_trainer.yml` (plus nightly_ascend, megatron/vllm variants); `Gymnasium:.github/workflows/run-pytest.yml` (full docker matrix build-all vs build-necessary smoke); `deepspeedai/DeepSpeed:.github/workflows/TEST_SELECTION.md` documenting test selection. Copy: tiered CI so a PR gets minutes-scale signal and heavy multi-GPU e2e runs nightly.
6. **Distributed-training smoke tests in-repo** | TRL, verl | `huggingface/trl:tests/distributed/test_distributed.py`, `verl-project/verl:tests/single_controller/`, `tests/special_distributed/`, `tests/special_sanity/`. Copy: dedicated distributed test dirs separate from unit tests.
7. **Lint/quality gates separate from test gates** | all six | e.g. `huggingface/trl:.github/workflows/quality.yml`, `Gymnasium:.github/workflows/run-pre-commit.yml`, `OpenRLHF/.pre-commit-config.yaml`, `deepspeedai/DeepSpeed:.github/workflows/formatting.yml`. Copy: formatting (ruff/black) as its own required check.

## Notes / caveats

- DeepSpeed-Chat RLHF is a **blog + recipes**, not a tested component: the only rlhf-named paths in the deepspeedai/DeepSpeed tree are `blogs/deepspeed-chat/...` and docs posts. Its value as evidence is for distributed-training smoke-test practice (tests/unit, per-accelerator workflow matrix), not for RLHF-specific test design.
- OpenRLHF CI is thin: the sole workflow `python-package.yml` builds and publishes a wheel on release; unit tests in `tests/` are not visibly run on PRs. The tests themselves (KL estimator gradient, reward shaping) are still copy-worthy patterns, but the CI story is weaker than TRL/verl.
- verl's CI matrix is the heaviest observed (ascend/NPU, megatron, vllm, sglang, nightly, multinode) - impressive but resource-gated; a clean-room project should copy the tiering, not the scale.
- No repo examined ships explicit "reward-hacking regression tests" by that name; the closest is reward-shaping/KL-estimator gradient testing (OpenRLHF) and reward unit tests (TRL tests/test_rewards.py). Evidence for a dedicated anti-reward-hacking test category is thin - flagged as a gap the new project could own.
