---
type: rl-envs
title: RL environments and RLHF training
group: Training and voice
verdict: Adopt and wrap
confidence: Low
evidence_date: 2026-09-23
author: VerdictsTools
---

## Bottom line
Inference, low confidence: adopt the standard environment interfaces (Gymnasium, PettingZoo) and an existing RLHF trainer (TRL or verl), and wrap them with reward-hacking and determinism checks of your own. The environment standards ship conformance checkers and the trainers ship per-algorithm tests, so rebuilding either would recreate that work; but no repository in the evidence ships tests named as reward-hacking checks (where a policy scores well by gaming the reward instead of doing the task), the closest being reward-shaping and reward unit tests, and the companion itself marks that finding contested. Run the conformance checker on every environment you ship, assert same-seed determinism, test the reward math directly, and add a negative control showing a degenerate policy cannot inflate your reward.

## Adopt, do not rebuild
- **Farama-Foundation/Gymnasium**: the maintained RL environment API standard, successor to OpenAI Gym, which ships its conformance checker as library code. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:7 "the canonical RL env API standard (successor to OpenAI Gym)"; ecosystem/pickup/_evidence/rl-envs.md:16 "Env conformance suite as a shipped library API")
- **Farama-Foundation/PettingZoo**: the multi-agent environment standard, with a conformance suite third-party environments are expected to pass. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:12 "multi-agent env API standard; ships a dedicated conformance suite")
- **huggingface/trl**: PPO, DPO, GRPO and RLOO trainers with per-trainer test files (DPO, GRPO, RLOO, SFT) and a fast/slow CI split. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:8 "HF's RL post-training stack (PPO, DPO, GRPO, RLOO trainers)"; ecosystem/pickup/_evidence/rl-envs.md:19 "huggingface/trl:tests/test_dpo_trainer.py, test_grpo_trainer.py, test_rloo_trainer.py, test_sft_trainer.py")
- **verl-project/verl**: an RLHF and RLVR framework (PPO, GRPO, DAPO) with CPU, GPU and end-to-end CI tiers. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:9 "ByteDance Seed's HybridFlow-based RLHF/RLVR framework (PPO, GRPO, DAPO)"; ecosystem/pickup/_evidence/rl-envs.md:20 "cpu_unit_tests.yml vs gpu_unit_tests.yml vs e2e_ppo_trainer.yml")

## Copy these practices
- **Ship the conformance checker and run it on every bundled environment**: Gymnasium's checker covers seeding determinism and observation and action space containment, and its test suite runs it over every registered environment. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:16 "a clean-room env API should ship its checker and run it on all bundled envs in CI"; ecosystem/pickup/_evidence/rl-envs.md:16 "tests/envs/test_env_implementation.py (runs checker over every registered env)")
- **Same seed, same trajectory, at three levels**: assert it in unit tests, in the checker and for vectorized environments. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:17 "same seed -> same trajectory assertions at unit, checker, and vector levels")
- **Test the objective math directly**: OpenRLHF tests KL estimator gradients, reward shaping and loss aggregation at the gradient and shape level, not only through end-to-end trainer runs. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:18 "gradient/shape-level tests for KL estimators, reward shaping, and loss aggregation rather than only end-to-end trainer runs")
- **Minutes on the PR, multi-GPU at night**: tier CI so a pull request gets fast signal and heavy end-to-end runs happen on a schedule. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:20 "tiered CI so a PR gets minutes-scale signal and heavy multi-GPU e2e runs nightly")
- **Distributed smoke tests in their own directories**: keep them apart from unit tests. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/rl-envs.md:21 "Copy: dedicated distributed test dirs separate from unit tests")
- **A degenerate-policy negative control for every reward-shaping function**: show that a constant-action or maximum-entropy policy cannot raise the shaped reward. This is the companion's design to fill the gap, not a practice copied from a repository. Starter kit: A10. [Inference] (ecosystem/pickup/pickup-rl-envs.md:81 "reward-shaping changes require a negative-control test showing a degenerate policy")

## Build only if
- No hard constraint is evidenced. The reward-hacking and RLHF determinism gaps are test suites to write around an incumbent, and the companion rules out inventing new algorithms for this type. [Inference] (ecosystem/pickup/pickup-rl-envs.md:150 "None of the six repos ships one by that name"; ecosystem/pickup/pickup-rl-envs.md:152 "for RLHF trainers, where stochasticity is load-bearing"; ecosystem/pickup/pickup-rl-envs.md:12 "Out of scope: inventing new RL algorithms")
- verl-scale multi-GPU CI is resource-gated; copy its tiering, not its scale, and do not build to avoid it. [Inference] (ecosystem/pickup/_evidence/rl-envs.md:28 "a clean-room project should copy the tiering, not the scale")
- License gives no reason to build: a fresh read on 2026-09-23 (`gh api repos/<owner>/<repo> --jq .license.spdx_id`) returned MIT for Gymnasium and PettingZoo and Apache-2.0 for TRL and verl. [Verified] (stack/METHOD.md:79 "Check the license of everything you tell a builder to adopt")

## Where FrankenSuite touches this
- No FrankenSuite packet builds RL environments or RLHF trainers. franken_alignment's name suggests RLHF, but it models the logic of a control plane for agent authority, and the description it was assessed under had gone stale. TRL 3, Explore; license: MIT with the OpenAI/Anthropic rider. [Verified] (packets/franken_alignment-assessment.md:19 "modeling the logical semantics of an agent-control plane"; packets/franken_alignment-assessment.md:107 "Evidence-carrying control system for powerful AI agents"; synthesis/00-overview.md:66 "franken_alignment | 3 | Explore | Rider")
- frankensim is a geometry, physics and optimization workspace, not an RL environment API. TRL 4, Explore; license: MIT with the OpenAI/Anthropic rider. [Verified] (packets/frankensim-assessment.md:9 "a multi-physics CAE/scientific-computing continuum"; synthesis/00-overview.md:97 "frankensim | 4 | Explore | Rider")
- frankentorch supplies a seeded, replayable autograd substrate that an RL trainer could sit on, but it ships no RL trainer. TRL 4, Explore; license: MIT with a rider barring OpenAI, Anthropic, their affiliates and anyone acting for them. [Verified] (packets/frankentorch-assessment.md:20 "organized around the Deterministic Autograd Contract: replayable, seeded, provenance-logged gradient computation"; packets/frankentorch-assessment.md:102 "License rider bars OpenAI, Anthropic, affiliates, and anyone acting for them"; synthesis/00-overview.md:103 "frankentorch | 4 | Explore | Rider")

## What we cannot say
- Whether reward-hacking tests exist under another name: the pack found none by that name and calls the evidence thin, naming reward-shaping, KL-gradient and reward unit tests as the closest; the companion marks the finding contested (ecosystem/pickup/_evidence/rl-envs.md:29 "Evidence for a dedicated anti-reward-hacking test category is thin"; ecosystem/pickup/_evidence/rl-envs.md:29 "the closest is reward-shaping/KL-estimator gradient testing (OpenRLHF) and reward unit tests (TRL tests/test_rewards.py)"; ecosystem/pickup/pickup-rl-envs.md:62 "thin: exhaustive-negative claim from six-repo tree scan").
- Whether OpenRLHF's tests run: its only workflow publishes a wheel on release (ecosystem/pickup/_evidence/rl-envs.md:27 "OpenRLHF CI is thin: the sole workflow python-package.yml builds and publishes a wheel on release").
- verl's CI scale is resource-gated (ecosystem/pickup/_evidence/rl-envs.md:28 "impressive but resource-gated"). DeepSpeed-Chat is not a tested RLHF component (ecosystem/pickup/_evidence/rl-envs.md:26 "DeepSpeed-Chat RLHF is a blog + recipes, not a tested component").
- Which seed sets and random-number layers a determinism check must cover for RLHF trainers (ecosystem/pickup/pickup-rl-envs.md:152 "Which seed set size and which RNG layers").
- Several of the practices above rest on two of the six repositories, not a category-wide norm (ecosystem/pickup/pickup-rl-envs.md:55 "2 of 6 repos; no evidence this is universal"). Workflow files were read, not observed running; licenses come from the author's fresh read, not the pack; stars measure popularity.

## Revisit when
- A trainer or environment library publishes reward-hacking regression tests, or a benchmark for them appears.
- OpenRLHF runs its tests on pull requests, or verl publishes a CPU-only tier a small team can run.
- A FrankenSuite project ships an RL trainer or environment API.
