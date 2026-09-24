---
type: embedding-serving
title: Embedding model serving
group: Model serving
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsServing
---

## Bottom line
Inference, medium confidence: adopt and wrap an existing embedding server or library rather than writing one. Serve with Text Embeddings Inference (TEI) or vLLM's pooling endpoints (infinity too, but it was last pushed in March 2026, so confirm it is maintained first); run in-process with sentence-transformers, fastembed or llama-cpp-python. Wrap it in two ways the serving projects themselves do not: pin the model's Hugging Face revision and weight hashes (none of the surveyed serving repos pin revisions), and add a one-sided parity test that fails only when quality drops below a pinned score, as vLLM does with one MTEB task.

## Adopt, do not rebuild
- **huggingface/text-embeddings-inference**: Rust serving engine for embeddings and rerankers with per-accelerator Docker builds, load tests and integration tests. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:9 "HF's Rust embedding/reranker serving engine"; ecosystem/pickup/_evidence/embedding-serving.md:9 "separate CUDA/ARM64/Intel/ROCm Dockerfiles")
- **vllm-project/vllm**: serves embeddings, scoring and classification as pooling tasks with a test tree per task. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:10 "now treats embeddings as a first-class task")
- **huggingface/sentence-transformers**: the Python library for dense, cross-encoder, multi-vector and sparse encoders, with a pluggable backend layer. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:8 "ships SentenceTransformer, CrossEncoder, MultiVectorEncoder (late-interaction/ColBERT-class), SparseEncoder")
- **qdrant/fastembed**: CPU-first ONNX embedding library for local pipelines. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:12 "CPU-first ONNX embedding library from the Qdrant org")
- **michaelfeil/infinity** and **abetlen/llama-cpp-python**: an OpenAI-compatible embedding API server (last pushed 2026-03-24; confirm it is maintained before adopting), and local GGUF embedding behind `/v1/embeddings`. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:13 "High-throughput serving engine for text-embeddings, rerankers, CLIP, CLAP, ColPali"; ecosystem/pickup/_evidence/embedding-serving.md:14 "OpenAI-compatible local embedding serving via GGUF")

## Copy these practices
- **One-sided parity gate against a pinned score**: vLLM `tests/entrypoints/pooling/embed/test_correctness_mteb.py` runs MTEB STS12 against the server and fails only if the score is worse than a pinned reference by more than 5e-4. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:21 "One-sided assert: you only fail if worse than baseline."; ecosystem/pickup/_evidence/embedding-serving.md:21 "MAIN_SCORE=0.7422994752439667")
- **Pin weights by revision and content hash, which the serving repos do not do**: record the Hugging Face revision and SHA-256 of each weight file, as frankensearch's pinned model manifests do. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:42 "none of the serving repos pin HF revisions in-repo"; packets/frankensearch-assessment.md:141 "revision-pinned manifests with SHA-256 verification"; packets/frankensearch-assessment.md:141 "the 621 MB of pinned model artifacts")
- **A test directory per pooling task**: vLLM `tests/entrypoints/pooling/{embed,scoring,classify,reward,token_embed}/`, each with offline, online, long-text and dimension variants. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:22 "separate dirs per pooling task (embed / scoring / classify / reward / token_embed)")
- **Cheap unit tests on PRs, real accelerators nightly**: TEI `.github/workflows/test.yaml` vs `integration-test.yaml` (cron `0 0 * * *`). Starter kit: none. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:23 "Nightly hardware-matrix integration tests separate from PR unit tests")
- **The model registry is code**: fastembed `fastembed/common/model_description.py` records source, weight files, dimension, license and size for every supported model. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:24 "the registry is the supported-model contract and makes test matrices enumerable")
- **Hermetic unit tests and pinned toolchains**: sentence-transformers `tests/conftest.py` fakes Hub metadata; TEI commits `rust-toolchain.toml`, `Cargo.lock` and `integration_tests/uv.lock`; sentence-transformers pins CI actions to commit SHAs. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/embedding-serving.md:29 "Mock Hub metadata in tests to kill network flakiness"; ecosystem/pickup/_evidence/embedding-serving.md:28 "TEI: rust-toolchain.toml, Cargo.lock, integration_tests/uv.lock"; ecosystem/pickup/_evidence/embedding-serving.md:28 "ST workflows pin actions to SHAs")

## Build only if
- You need an in-process encoder whose index records which model produced each vector and refuses to mix embedding spaces; frankensearch builds this, but its quality tier still runs on ONNX by default and its demand evidence is the maintainer's own tooling. [Maintainer claim] [Inference] (packets/frankensearch-assessment.md:100 "Identity checks fail closed if vectors from the two spaces are combined"; packets/frankensearch-assessment.md:118 "ONNX by default or pure-Rust native F32 via semantic-native"; packets/frankensearch-assessment.md:75 "The demand signal that exists is the maintainer's own")
- License is not a reason to build: every adopted project here is Apache-2.0 or MIT. [Verified] (stack/licenses.tsv:38 "huggingface/text-embeddings-inference Apache-2.0 permissive"; stack/licenses.tsv:99 "vllm-project/vllm Apache-2.0 permissive"; stack/licenses.tsv:36 "huggingface/sentence-transformers Apache-2.0 permissive"; stack/licenses.tsv:79 "qdrant/fastembed Apache-2.0 permissive"; stack/licenses.tsv:54 "michaelfeil/infinity MIT permissive"; stack/licenses.tsv:4 "abetlen/llama-cpp-python MIT permissive")

## Where FrankenSuite touches this
- **frankensearch**: an embedding crate with hash, Model2Vec, FastEmbed and native backends; a static-embedding fast tier and a MiniLM quality tier; a cross-encoder reranker on FrankenTorch int8 kernels. TRL 5-6, NODUS ring Explore; relevance quality unproven by the maintainer's own statement. [Verified] [Maintainer claim] [Inference] (packets/frankensearch-assessment.md:109 "frankensearch-embed (hash/Model2Vec/FastEmbed/native embedders, 33,060)"; packets/frankensearch-assessment.md:119 "pure-Rust frankentorch int8 BERT by default; ONNX alternative"; packets/frankensearch-assessment.md:22 "TRL 5–6 — see §4.9). Substantive and partially validated"; packets/frankensearch-assessment.md:21 "Relevance quality is unproven")
- **frankensearch's public correction**: release v1.6.0 stopped presenting its hash embedder, a test double, as semantic search. [Maintainer claim] (packets/frankensearch-assessment.md:50 "Hash control no longer presented as semantic search")
- **frankenterm** uses fastembed inside its hybrid search over terminal output rather than its own encoder; the code exists and was not executed by its assessor. [Verified] (packets/frankenterm-assessment.md:79 "semantic fastembed + RRF hybrid"; packets/frankenterm-assessment.md:79 "Partially demonstrated (exists; not executed)")
- The frankensearch license rider bars OpenAI, Anthropic and anyone acting for them from using or benchmarking it. [Verified] (packets/frankensearch-assessment.md:175 "The license bars OpenAI, Anthropic, affiliates, and anyone acting for them")

## What we cannot say
- Whether any serving repo gates releases on retrieval quality: none runs MTEB or BEIR as a blocking PR check, and vLLM's single-task gate was not confirmed to run per PR or nightly (ecosystem/pickup/_evidence/embedding-serving.md:40 "Nobody found runs MTEB/BEIR as a blocking per-PR CI gate."; ecosystem/pickup/pickup-embedding-serving.md:353 "vLLM's MTEB parity test CI scheduling is unverified").
- How reproducible a deployment of any of these is, since they float on Hub revisions (ecosystem/pickup/_evidence/embedding-serving.md:42 "Weight-pinning practice is weak across the board").
- Whether rerankers and multi-vector models served by TEI or infinity meet any quality bar (ecosystem/pickup/_evidence/embedding-serving.md:43 "Reranker/late-interaction CI specifics are thin").
- Whether infinity is still maintained: its last push was 2026-03-24, six months before the check (ecosystem/pickup/_evidence/embedding-serving.md:13 "michaelfeil/infinity | 2,945 | 2026-03-24").
- Stars and push dates are a 2026-09-23 snapshot and measure activity, not quality (ecosystem/pickup/_evidence/embedding-serving.md:45 "Star counts and push dates are point-in-time (2026-09-23)").

## Revisit when
- A serving engine adds a reranker-specific or multi-task quality gate in CI, or pins model revisions in its test configs.
- vLLM's MTEB gate is shown to run on every PR, which would make it a precedent for a blocking gate rather than a reference harness.
- frankensearch commits a labeled-corpus relevance receipt.
