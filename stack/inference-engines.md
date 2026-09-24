---
type: inference-engines
title: LLM inference engines
group: Model serving
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsServing
---

## Bottom line
Inference, medium confidence: adopt and wrap an existing engine (vLLM or SGLang for GPU serving, llama.cpp for local and CPU use) and do not write your own. They are maintained and already cover batching, KV-cache management (the per-request attention memory) and multi-vendor hardware. Wrap the one you pick: pin its commit and the model weight revision, check its outputs against a reference (llama.cpp perplexity or Hugging Face transformers), and measure speed on your own GPU, because the shared serving benchmark is a script the engine authors fork and tune, not a neutral referee.

## Adopt, do not rebuild
- **vllm-project/vllm**: the serving engine whose benchmark script other projects clone; rebuilding its scheduler and KV-cache manager recreates the category's reference point. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:7 "A high-throughput and memory-efficient inference and serving engine for LLMs"; ecosystem/pickup/_evidence/inference-engines.md:7 "is the de-facto throughput benchmark other projects clone")
- **sgl-project/sglang**: vLLM-class serving framework with nightly GPU CI per vendor. A fresh read on 2026-09-23 of https://raw.githubusercontent.com/sgl-project/sglang/main/.github/workflows/nightly-test-nvidia.yml showed a `cron: '0 14 */2 * *'` schedule on a `4-gpu-h100` runner. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:8 "per-vendor nightly GPU fleets"; ecosystem/pickup/_evidence/inference-engines.md:21 "sgl-project/sglang/.github/workflows/nightly-test-nvidia.yml")
- **ggml-org/llama.cpp**: C/C++ engine for local, CPU, Metal and Vulkan inference; its perplexity and bench tools are the baseline the serving engines measure against. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:12 "define the correctness/perf baseline the serving engines measure against"; ecosystem/pickup/_evidence/inference-engines.md:27 "Cross-platform backend build matrix.")
- **nvidia/TensorRT-LLM**: NVIDIA's vendor-tuned stack with its benchmark harness inside the library; use its numbers as a vendor reference, never as independent verification. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:9 "the vendor-tuned reference implementation for this category"; ecosystem/pickup/pickup-inference-engines.md:226 "reference, never as independent verification of a third-party engine")
- **InternLM/lmdeploy**: compress-deploy-serve toolkit with daily end-to-end tests pinned to named GPUs. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:11 "active daily E2E test matrix pinned to GPU SKUs")

## Copy these practices
- **Unit-test the benchmark harness**: vLLM tests its own benchmark CLIs (`tests/benchmarks/test_throughput_cli.py`, `test_latency_cli.py`, `test_serve_cli.py`), so a broken benchmark fails CI instead of emitting numbers. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:19 "Benchmarks are unit-tested like code."; ecosystem/pickup/_evidence/inference-engines.md:19 "vllm-project/vllm/tests/benchmarks/test_throughput_cli.py")
- **Keep performance CI separate from correctness CI**: vLLM's `.buildkite/performance-benchmarks/` track; SGLang's `pr-benchmark-rust.yml` and `stress-test.yml`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:20 "Dedicated perf-regression CI track, separate from correctness CI.")
- **Differential correctness against a pinned reference**: vLLM `tests/basic_correctness/test_basic_correctness.py`; a fresh read on 2026-09-23 of https://raw.githubusercontent.com/vllm-project/vllm/main/tests/basic_correctness/test_basic_correctness.py showed it running the same prompts through `hf_runner` and vLLM and comparing them with `check_outputs_equal`. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:22 "Correctness via differential tests against HF transformers")
- **Accuracy gate with committed configs**: vLLM `.buildkite/lm-eval-harness/configs/` with a versioned baseline script; SGLang `test/lm_eval_configs/*.yaml`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:23 "First-party accuracy/eval harness wired to lm-eval-harness.")
- **Pin the vendored core in a file**: Ollama's `LLAMA_CPP_VERSION` and `MLX_VERSION`; TGI's `rust-toolchain.toml` and `crate-hashes.json`. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:29 "Dependency pinning for vendored inference cores.")
- **Record precision baselines per quantized format**: SGLang `python/sglang/test/precision_baseline_store.py` and `test_deterministic.py`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/inference-engines.md:25 "sgl-project/sglang/python/sglang/test/precision_baseline_store.py")

## Build only if
- You need a memory-safe runtime for one fixed model with no ML-framework dependency and no GPU, and you accept a six-figure line count to get it: franken_ocr shipped that shape. [Verified] (packets/franken_ocr-assessment.md:72 "Pure-Rust, CPU-only OCR engine for Baidu Unlimited-OCR, no ML framework"; packets/franken_ocr-assessment.md:72 "105,330 Rust lines; no build.rs")
- Price in a moving target even then: franken_nlp's honest baseline is upstream llama.cpp, which improves while the rewrite has not executed a model. [Inference] (synthesis/briefs/franken_nlp.md:131 "upstream llama.cpp improves monthly"; packets/franken_nlp-assessment.md:20 "nothing executes end to end")

## Where FrankenSuite touches this
- **franken_ocr**: pure-Rust CPU inference for a 3B OCR vision-language model plus a five-model zoo, with int8 kernels checked against bit-identical scalar oracles; TRL 6, NODUS ring Pilot; its CI workflows were deleted from the tree at HEAD. [Verified] [Inference] (packets/franken_ocr-assessment.md:9 "model-specific int8 kernels with bit-identical scalar oracles"; packets/franken_ocr-assessment.md:9 "tagged binary releases for six platforms"; packets/franken_ocr-assessment.md:11 "TRL 6. NODUS ring: Pilot."; packets/franken_ocr-assessment.md:11 "the CI workflows were deleted from the tre")
- **franken_tts**: shipped pure-Rust CPU runtime for one text-to-speech model with 11 releases; TRL 7. [Verified] [Inference] (packets/franken_tts-assessment.md:9 "pure-Rust CPU-only runtime for one model"; packets/franken_tts-assessment.md:9 "11 GitHub releases (v0.1.0–v0.1.10)"; packets/franken_tts-assessment.md:181 "Technology readiness (TRL 1–9) | 7 | Real releases")
- **franken_whisper**: replaced the speech backends it once wrapped with an in-process Rust engine on FrankenTorch CPU kernels; TRL 5-6. [Verified] [Inference] (packets/franken_whisper-assessment.md:9 "replaced the backends it wraps"; packets/franken_whisper-assessment.md:9 "encoder/decoder transformer on FrankenTorch CPU kernels"; packets/franken_whisper-assessment.md:187 "Technology readiness (TRL 1–9) | 5–6 | Real engine, real releases")
- **franken_nlp**: plan-stage single-model engine that names upstream llama.cpp as its honest baseline; TRL 2-3, NODUS ring Monitor. [Verified] [Inference] (packets/franken_nlp-assessment.md:86 "Official upstream llama.cpp supports Nanbeige4.2 (the honest baseline)"; packets/franken_nlp-assessment.md:18 "TRL: 2–3; NODUS ring: Monitor")
- All four are single-model runtimes, not multi-tenant serving engines; franken_ocr's own packet bounds its market to no-GPU OCR, so none contests the vLLM/SGLang batching lane. [Inference] (packets/franken_ocr-assessment.md:192 "The engine's market is bounded (no-GPU OCR)")

## What we cannot say
- No engine was run and no throughput or latency number was reproduced for this verdict; the pack's star counts and push dates are point-in-time API values (ecosystem/pickup/_evidence/inference-engines.md:38 "are point-in-time values from the GitHub API on 2026-09-23, not live guarantees"). They measure activity, not quality.
- The shared serving benchmark is a convention engine authors tune, not an oracle (ecosystem/pickup/pickup-inference-engines.md:86-87 "it is a convention, not an independent oracle — engine authors fork and tune it").
- llama.cpp has no enabled perf gate (ecosystem/pickup/_evidence/inference-engines.md:35 "llama.cpp has no enabled benchmark CI."), so its speed is measured in-repo without automated regression blocking.
- Whether TensorRT-LLM's CI is green: it runs mostly in Jenkins (ecosystem/pickup/pickup-inference-engines.md:367 "TensorRT-LLM CI greenness is not GitHub-verifiable").
- Whether TGI is still a live option, since the TGI pinning files cited above sit in a repo pushed last on 2026-03-21 (ecosystem/pickup/_evidence/inference-engines.md:34 "TGI is going stale.** Last push `2026-03-21`").
- Ollama is cited only for its pin files; it is not a serving engine (ecosystem/pickup/_evidence/inference-engines.md:37 "Ollama is a distribution layer, not a batching/serving engine.").
- Phones, browsers and ML-compilation deployment are not covered: mlc-llm, the pack's cross-device entry, has the thinnest evidence (ecosystem/pickup/_evidence/inference-engines.md:36 "mlc-llm has the thinnest benchmark evidence.").

## Revisit when
- A maintained serving benchmark not owned by any engine appears with pinned configs and datasets; the wrap could then stop owning its own speed measurement.
- llama.cpp re-enables its disabled `bench.yml`, or TGI either resumes pushes or is archived.
- A FrankenSuite single-model runtime gains independent validation or a second maintainer, which would change the build-only-if case.
