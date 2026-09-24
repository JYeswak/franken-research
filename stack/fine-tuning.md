---
type: fine-tuning
title: Fine-tuning infrastructure
group: Training and voice
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsTools
---

## Bottom line
Inference, medium confidence: adopt an existing fine-tuning stack (TRL as the reference trainer, or a launcher such as Unsloth, LlamaFactory, Axolotl or LitGPT) and wrap it with correctness checks for your own recipes. Several maintained launchers cover supervised, adapter and preference training, so writing a trainer would recreate them; but the evidence shows no conformance oracle for preference and RL trainers beyond "it ran and the loss is finite", and exact-loss regression goldens appear only in a project that has since been retired. Pin versions, run a tiny smoke train on every change, commit expected loss values for your recipe, and evaluate after training.

## Adopt, do not rebuild
- **huggingface/trl**: the post-training library (SFT, DPO, GRPO and reward trainers) that other stacks test against; building a trainer would recreate it. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:9 "HF's canonical post-training library (SFTTrainer, DPOTrainer, GRPO, reward trainers)"; ecosystem/pickup/_evidence/fine-tuning.md:9 "TRL is the reference the others test against")
- **unslothai/unsloth**: LoRA, QLoRA and GRPO kernels with CI at scale, including free-GPU notebook regression legs. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:7 "LoRA/QLoRA/GRPO kernels); ~50 workflow files show CI at industrial scale")
- **hiyouga/LlamaFactory**: a CLI, GUI and YAML launcher tested on a three-OS, three-Python CPU matrix plus a self-hosted GPU runner. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:8 "CLI/GUI/data-driven YAML launcher"; ecosystem/pickup/_evidence/fine-tuning.md:23 "3 OS × 3 Python × transformers-compat matrix on CPU")
- **axolotl-ai-cloud/axolotl**: a YAML-config launcher for SFT, DPO, LoRA and QLoRA with DeepSpeed and FSDP, CPU tests on every PR and GPU end-to-end tests behind a label. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:11 "YAML-config SFT/DPO/LoRA/QLoRA launcher with DeepSpeed/FSDP"; ecosystem/pickup/_evidence/fine-tuning.md:21 "GPU e2e in Docker, gated behind run-gpu-tests PR label")
- **Lightning-AI/litgpt**: hackable pretrain, finetune and eval code whose CPU tests use synthetic micro-configs and download no checkpoint. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:10 "Hackable pretrain/finetune/eval (LoRA, adapters, full)"; ecosystem/pickup/_evidence/fine-tuning.md:40 "synthetic micro-configs, no checkpoint download at all")

## Copy these practices
- **A tiny smoke train on every change**: validate the config, load data, train for five steps on a 135M-parameter checkpoint, and assert the checkpoint was written, per model family. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:37 "full validate_config → load_datasets → train round-trip on HuggingFaceTB/SmolLM2-135M with max_steps: 5")
- **Exact expected losses at a fixed seed and dtype**: commit per-step loss values for a tiny recipe and fail on any deviation; torchtune's version is the evidenced example, from a project no longer maintained. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:46 "seed=9, dtype=fp32 overrides; compile=True/False both run")
- **Pinned versus latest, side by side**: Unsloth runs a pinned small SFT leg next to one on the latest libraries, so an upstream break shows up as a divergence. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:60 "canary-vs-control legs (tiny Qwen2.5-0.5B SFT pinned vs latest libs)")
- **Retry only named transient failures**: TRL reruns tests only on network, timeout, gateway and out-of-memory errors, so genuine failures still block merges. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:61 "Transient-infra auto-retry")
- **Config validation as an API, exercised first**: every Axolotl smoke test calls the config validator before training. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:52 "config-validation is an API, exercised in every smoke test")
- **Evaluate or generate after training**: assert the checkpoint actually materializes, then run an eval or generation round-trip. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:67 "check_model_output_exists verifies checkpoints actually materialize")
- **Distributed logic tested without GPUs**: Axolotl runs its DeepSpeed distributed tests on CPU; this covers logic, not numerics. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/fine-tuning.md:58 "runs DeepSpeed distributed tests on CPU via")

## Build only if
- Your deployment cannot carry a Python runtime. The FrankenSuite's Rust ports target that audience but are framework layers at TRL 4, not fine-tuning launchers, so even this constraint points to building on a framework, not to a new launcher. [Inference] (packets/frankenjax-assessment.md:63 "Rust developers who need AD without a Python runtime"; synthesis/00-overview.md:103 "frankentorch | 4 | Explore | Rider")
- The preference and RL correctness gap is a reason to write a differential test harness around an incumbent, not to write a trainer. [Inference] (ecosystem/pickup/pickup-fine-tuning.md:352 "No verified conformance oracle for DPO/GRPO correctness beyond")

## Where FrankenSuite touches this
- **frankentorch** reimplements PyTorch's CPU eager semantics around a Deterministic Autograd Contract (replayable, seeded, provenance-logged gradients) and has an optimizer crate; the companion scopes general training frameworks out of this type, and the packet's reading of it as a reproducible-training base is inference. TRL 4, Explore; the license rider bars AI labs. [Verified] (packets/frankentorch-assessment.md:20 "organized around the Deterministic Autograd Contract: replayable, seeded, provenance-logged gradient computation"; packets/frankentorch-assessment.md:126 "optimizers (SGD/Adam/AdamW per README"; ecosystem/pickup/pickup-fine-tuning.md:8 "NOT a general ML training framework (PyTorch, JAX)"; synthesis/00-overview.md:103 "frankentorch | 4 | Explore | Rider")
- **frankenjax** reimplements JAX's transform semantics and automatic differentiation with a differential conformance harness against JAX fixtures, not the ML framework around them. TRL 4, Explore. [Verified] (packets/frankenjax-assessment.md:19 "not JAX the ML framework, but its mathematical core"; synthesis/00-overview.md:90 "frankenjax | 4 | Explore | Rider")
- **franken_whisper** contributes a rule that applies directly to launcher speed claims: a before/after comparison against yourself is maintenance, and a win needs the incumbent run side by side in the same invocation with its binary hash recorded. TRL 5–6, Explore. [Verified] (packets/franken_whisper-assessment.md:114 "requires the actual legacy incumbent running side-by-side in the same invocation, with the incumbent binary's SHA-256 recorded"; synthesis/00-overview.md:86 "franken_whisper | 5–6 | Explore | Rider")

## What we cannot say
- Whether exact-loss goldens are a category norm: the evidence comes from torchtune, which is sunset (ecosystem/pickup/_evidence/fine-tuning.md:74 "torchtune is sunset (2025) — its process evidence (integration markers, golden-loss regression tests)"), and whether they survive FSDP or DeepSpeed is untested (ecosystem/pickup/pickup-fine-tuning.md:348 "Do exact-loss goldens survive distributed paths (FSDP/DeepSpeed)?").
- How deep Axolotl's testing goes (ecosystem/pickup/_evidence/fine-tuning.md:75 "Axolotl process depth unverified in detail"); Unsloth's evidence is mostly installer and compatibility CI (ecosystem/pickup/_evidence/fine-tuning.md:76 "Unsloth evidence skews toward installer/compat CI").
- Whether the free-GPU notebook legs transfer to a new project (ecosystem/pickup/pickup-fine-tuning.md:359 "Whether Kaggle-free-T4 CI legs (unsloth's trick) are available to").
- What tolerance RL training legs need (ecosystem/pickup/pickup-fine-tuning.md:362 "Nondeterminism floor for rollout-sampling RL legs (GRPO/PPO)").
- OpenRLHF and LMOps were checked for activity only (ecosystem/pickup/_evidence/fine-tuning.md:77 "OpenRLHF / LMOps are trend-only"). Star counts are a snapshot (ecosystem/pickup/_evidence/fine-tuning.md:78 "Star counts are snapshot"). Workflow files were read, not observed running; licenses were not in the pack.

## Revisit when
- A published conformance suite for DPO, GRPO or PPO trainers appears, or TRL adopts exact-loss regression tests.
- An incumbent launcher loses maintenance the way torchtune did.
- frankentorch ships a release and gains an outside consumer that fine-tunes on it.
