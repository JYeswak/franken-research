---
type: quantization
title: Model quantization toolkits
group: Model serving
verdict: Adopt and wrap
confidence: Low
evidence_date: 2026-09-23
author: VerdictsServing
---

## Bottom line
Inference, low confidence: adopt and wrap the quantizer your runtime already ships (llama.cpp's quantize tool for GGUF files, bitsandbytes through Hugging Face, torchao inside PyTorch, TensorRT-LLM or vLLM kernels for GPU serving) rather than writing a quantization toolkit. Wrap it with your own quality check: measure perplexity and at least one downstream task on your model before and after, against a like-for-like baseline, because the evidence confirms the ecosystem's measuring tools exist but did not verify any of their numbers or any threshold for negligible loss. Confidence is low because the evidence pack sampled rather than read most CI and eval results.

## Adopt, do not rebuild
- **ggml-org/llama.cpp**: GGUF quantized formats with a quantize tool and a perplexity tool in the same repo; the portable path for local and CPU inference. [Verified] (ecosystem/pickup/_evidence/quantization.md:8 "GGUF quant formats, tools/quantize/, tools/perplexity/")
- **bitsandbytes-foundation/bitsandbytes**: 8-bit and 4-bit quantization used through Hugging Face transformers, with a benchmarking directory and 4-bit/8-bit layer tests. A fresh read on 2026-09-23 of https://raw.githubusercontent.com/bitsandbytes-foundation/bitsandbytes/main/.github/workflows/tests-nightly.yml showed a nightly cron (`15 2 * * *`) over a CUDA matrix of T4, A10 and L40S GPUs. [Verified] (ecosystem/pickup/_evidence/quantization.md:9 "8-bit (LLM.int8()) and 4-bit (NF4) quantization widely adopted via Hugging Face")
- **pytorch/ao** (torchao): quantization inside PyTorch, including a GPTQ implementation and per-GPU regression workflows; a fresh read on 2026-09-23 of https://raw.githubusercontent.com/pytorch/ao/main/.github/workflows/1xH100_tests.yml showed it triggered on `pull_request` and run on an H100 runner. [Verified] (ecosystem/pickup/_evidence/quantization.md:11 "PyTorch-native quantization (torchao)")
- **NVIDIA/TensorRT-LLM** and **vllm-project/vllm**: the GPU serving stacks that consume GPTQ, AWQ and FP8 kernels; quantize with the recipes the serving engine you run already supports. [Verified] (ecosystem/pickup/_evidence/quantization.md:12 "quantization recipes (INT4/FP8 GPTQ/AWQ) feeding production inference kernels"; ecosystem/pickup/_evidence/quantization.md:10 "serving framework consuming quantized kernels (GPTQ/AWQ/FP8 Marlin etc. backends)")
- **microsoft/onnxruntime**: static and dynamic quantization tooling for ONNX models. [Verified] (ecosystem/pickup/_evidence/quantization.md:15 "static+dynamic quantization tooling")

## Copy these practices
- **Golden-output tests per kernel with a diff tolerance**: AutoGPTQ `tests/test_q4.py` asserts each backend kernel's output against pinned reference tensors instead of checking that it runs. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/quantization.md:22 "AutoGPTQ tests/test_q4.py hard-codes CUDA_OLD_REFERENCE tensors and asserts max-diff/mean-relative-diff per backend kernel")
- **Benchmark real layer shapes, not toy shapes**: AutoGPTQ `tests/bench_autoawq_autogptq.py` times GPTQ vs AWQ kernels on Yi-34B `down_proj` shapes. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/quantization.md:21 "benchmarks Yi-34B down_proj K=20480/N=7168 shapes")
- **Report perplexity and a downstream task together**: llama.cpp `tools/perplexity/` plus an lm-evaluation-harness task. A fresh read on 2026-09-23 of https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/perplexity/README.md showed the tool is meant to judge the quality loss of quantized models against FP16 and also computes KL divergence against the full-precision model's logits. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/quantization.md:23 "Copy: repo-local perplexity tool + lm-eval-harness adapter for downstream zero-shot tasks; report both.")
- **Build smoke on every PR, GPU numerics nightly**: bitsandbytes `tests-pr.yml` / `tests-nightly.yml`, torchao `1xH100_tests.yml`, llama.cpp per-backend workflows. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/quantization.md:24 "heavy numeric/correctness tests nightly on self-hosted GPUs")
- **One command per method: quantize, report quality delta, report speedup**: torchao `benchmarks/benchmark_gptq.py`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/quantization.md:25 "each method = script that (a) quantizes, (b) reports perplexity delta, (c) reports kernel speedup, all one command")
- **Stamp the source weights' hash into the quantized artifact**: franken_ocr's converter writes the source safetensors SHA-256 into the `.focrq` header and verifies part hashes on pull; the companion found no quantization repo doing this. Starter kit: B3. [Verified] (packets/franken_ocr-assessment.md:41 "already stamps the source safetensors SHA256 into the artifact header"; ecosystem/pickup/pickup-quantization.md:119 "not yet observed in a quantization repo")

## Build only if
- You need quantized artifacts that carry their own provenance (source weight hash, recipe, converter version) verifiable offline. No quantization repo in the pack shows this, so build that thin artifact layer, not a new quantizer; even franken_ocr's version is not yet tamper-evident end to end. [Inference] (ecosystem/pickup/pickup-quantization.md:119 "pattern imported from sibling packets, not yet observed in a quantization repo"; packets/franken_ocr-assessment.md:41 "the write-time origin binding exists but is not tamper-evident end to end")
- A new quantization method is research, not tooling; the category has converged on GPTQ/AWQ-class 4-bit weight formats, so a builder who needs a method should use one of those. [Inference] (ecosystem/pickup/pickup-quantization.md:116 "The category has converged on GPTQ/AWQ-class 4-bit weight formats as the reference methods")

## Where FrankenSuite touches this
- **franken_ocr**: a code-enforced int8 recipe (a test asserts exactly 2,148 FFN/expert tensors quantized, attention and `lm_head` kept high precision); TRL 6, NODUS ring Pilot. [Verified] [Inference] (packets/franken_ocr-assessment.md:77 "Conservative int8 recipe: exactly 2,148 FFN/expert tensors int8"; packets/franken_ocr-assessment.md:77 "48 attention projections + lm_head high precision"; packets/franken_ocr-assessment.md:11 "TRL 6. NODUS ring: Pilot.")
- **franken_ocr's measured dispatch**: hand-written SDOT/SMMLA int8 kernels ship but are not the default, because interleaved measurements showed the compiler-vectorized scalar loop faster; int4 remains gated and unvalidated. [Maintainer claim] (packets/franken_ocr-assessment.md:31 "deliberately doesn't use them by default"; packets/franken_ocr-assessment.md:31 "LLVM-autovectorized scalar loop beating forced SDOT"; packets/franken_ocr-assessment.md:40 "by the project's own admission, yet the doctrine names the int4 bandwidth win")
- **franken_tts and franken_nlp**: franken_tts has int8 tiers behind a default-route admission gate; franken_nlp plans staged, parity-gated quantization recipes in its `.fnlpq` format but has executed none (TRL 2-3). [Verified] [Maintainer claim] [Inference] (synthesis/briefs/franken_ocr.md:53 "franken_tts has int8 tiers and a default-route admission gate"; packets/franken_nlp-assessment.md:111 "staged immutable quantization recipes"; packets/franken_nlp-assessment.md:18 "TRL: 2–3; NODUS ring: Monitor")

## What we cannot say
- Whether any quality-loss number in these repos is right: the pack confirmed the tools exist but ran no eval and read no result tables (ecosystem/pickup/_evidence/quantization.md:32 "Perplexity/accuracy numbers were sampled, not exhaustively verified").
- Whether the named CI workflows test accuracy: most bodies were not read, and the one that was read turned out to be a format check (ecosystem/pickup/_evidence/quantization.md:35 "workflow file names are real, but I did not read full workflow bodies"; ecosystem/pickup/_evidence/quantization.md:35 "turned out to be a code-quality/format check, not accuracy tests"). The two fresh workflow reads above confirm schedule and hardware, not what the tests assert.
- AutoGPTQ is cited only for its test patterns; its standalone package looks unmaintained (ecosystem/pickup/_evidence/quantization.md:33 "suggests the standalone GPTQ packaging is in maintenance mode").
- AWQ's reference repo is not a process model (ecosystem/pickup/_evidence/quantization.md:31 "the canonical AWQ repo has no .github/workflows (API 404), no tests/ dir"), and which AWQ implementation to trust as an oracle is open (ecosystem/pickup/pickup-quantization.md:354 "Which exact AWQ commit (if any) is a trustworthy algorithm oracle").
- How active the category is: llama.cpp, vLLM and onnxruntime push daily, but quantization is one feature of those projects (ecosystem/pickup/_evidence/quantization.md:34 "they are broader projects where quantization is a feature, not the core").
- What loss counts as negligible (ecosystem/pickup/pickup-quantization.md:377-378 "no evidence-defined negligibility threshold was found").

## Revisit when
- Someone publishes a reproduced, per-format quality-loss table (eval set, hardware, tolerance named) for a GPTQ/AWQ implementation that has CI.
- torchao's GPTQ path leaves `prototype/`, or AutoGPTQ resumes or archives.
- franken_ocr certifies or kills its int4 route, or makes `.focrq` provenance tamper-evident.
