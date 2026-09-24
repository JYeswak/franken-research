---
type: vector-dbs
title: Vector databases
group: Memory and retrieval
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsServing
---

## Bottom line
Inference, medium confidence: adopt and wrap an existing vector store rather than writing an index. Use pgvector if you already run Postgres, an embedded library (Chroma, LanceDB) for single-process apps, or a server (Qdrant, Milvus, Weaviate, Vespa) at scale, with faiss as the exact-search reference. Wrap it with your own recall check against exact search on your data, including your metadata filters, before trusting any number: the public benchmark harness everyone submitted to is no longer maintained, and a dedicated filtered-recall test suite was not found in any vendor repo.

## Adopt, do not rebuild
- **facebookresearch/faiss**: the ANN (approximate nearest neighbour) library other systems are measured against, and the exact-search reference for your own recall checks. A fresh read on 2026-09-23 of https://api.github.com/repos/facebookresearch/faiss/contents/.github/workflows listed `build-pull-request.yml`, `nightly.yml` and `index-io-backward-compatibility.yml`. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:9 "Canonical ANN library everything else is measured against")
- **pgvector/pgvector**: HNSW and IVF indexes inside Postgres, for teams that would rather extend their database than deploy a new one. A fresh read on 2026-09-23 of https://raw.githubusercontent.com/pgvector/pgvector/master/.github/workflows/build.yml showed a build matrix across Postgres 13 to 20. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:12 "Vector ANN inside Postgres (HNSW/IVF)")
- **qdrant/qdrant**: Rust HNSW server that submits parameter-sweep configs to the public ANN benchmark and runs lint, coverage and long end-to-end CI. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:10 "submits parameter-sweep configs to ANN-Benchmarks"; ecosystem/pickup/_evidence/vector-dbs.md:34 "Rust-specific CI: lint + fmt + clippy + coverage + nightly E2E")
- **milvus-io/milvus**: cloud-native vector database with client conformance suites for several languages under one test tree. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:8 "cloud-native vector database"; ecosystem/pickup/_evidence/vector-dbs.md:32 "Multi-language client conformance suites under one tests/ tree")
- **chroma-core/chroma**: embedded-first store with property-based correctness tests. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:11 "embedded-first alternative")
- **weaviate/weaviate**, **lancedb/lancedb** and **vespa-engine/vespa**: a Go server with hybrid BM25 search, an embedded multimodal library with a Rust core, and a search platform that unifies ANN with lexical ranking. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:13 "GO vector DB with modules (hybrid search/BM25)"; ecosystem/pickup/_evidence/vector-dbs.md:14 "Embedded multimodal retrieval library"; ecosystem/pickup/_evidence/vector-dbs.md:15 "AI search platform with ANN + lexical ranking unified")

## Copy these practices
- **Measure recall against exact search, on your data**: use faiss exact search to generate ground truth, then report recall at k for the configuration you run. Starter kit: A2. [Inference] (ecosystem/pickup/pickup-vector-dbs.md:77 "exact-search ground truth generation")
- **Report a recall-versus-speed curve from a parameter sweep, not one number**: the ann-benchmarks `algorithms/qdrant/config.yml` grid over graph degree, build and query effort, quantization and re-scoring. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:25 "Recall-vs-QPS Pareto via explicit parameter sweeps")
- **Test filtered queries separately**: filtered recall needs its own query set with precomputed answers (the companion's proposed GATE-VDB-02). Starter kit: none. [Inference] (ecosystem/pickup/pickup-vector-dbs.md:163 "filtered ANN claims require a dedicated")
- **Property-based tests with written invariants**: Chroma `chromadb/test/property/`; a fresh read on 2026-09-23 of https://raw.githubusercontent.com/chroma-core/chroma/main/chromadb/test/property/invariants.py showed invariants such as `count`, `ids_match`, `embeddings_match`, `no_duplicates` and an `_exact_distances` helper. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:27 "Property-based correctness testing (Hypothesis strategies + explicit invariants)")
- **Stress tests for low memory and low disk, apart from unit tests**: Qdrant `tests/e2e_tests/test_low_ram.py`, `test_low_disk.py`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:28 "Stress / soak suites separate from unit tests")
- **Fail CI when generated API specs drift from their sources**: Qdrant `tests/openapi_consistency_check.sh` (fresh read on 2026-09-23 of https://raw.githubusercontent.com/qdrant/qdrant/master/tests/openapi_consistency_check.sh: its header says it makes sure generated OpenAPI files are consistent with their sources). Starter kit: none. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:29 "API-contract regression (OpenAPI consistency checks)")
- **Ship the benchmark tool in the main repo**: Vespa's `vbench/`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:31 "Ships a perf-regression CLI inside the main repo")
- **Write contributor instructions for coding agents**: LanceDB, Milvus, Weaviate and Chroma keep AGENTS.md or CLAUDE.md files. Starter kit: A9. [Verified] (ecosystem/pickup/_evidence/vector-dbs.md:37 "AGENTS.md / CLAUDE.md contributor-playbook docs")

## Build only if
- Your index must record which embedding model produced its vectors and refuse to mix embedding spaces, in-process with no server. frankensearch's index does this; its packet judges it more provenance discipline than most vector databases ship, which is an analyst judgment, not a survey. [Inference] (packets/frankensearch-assessment.md:100 "Identity checks fail closed if vectors from the two spaces are combined"; packets/frankensearch-assessment.md:168 "more provenance discipline than most vector DBs ship")

## Where FrankenSuite touches this
- **frankensearch-index**: an f16 SIMD vector index with brute-force top-k, memory-mapped reads and frozen producer fingerprints, published separately on crates.io; part of frankensearch, TRL 5-6, NODUS ring Explore. [Verified] [Inference] (packets/frankensearch-assessment.md:92 "f16 SIMD vector index (FSVI format"; packets/frankensearch-assessment.md:289 "independently published on crates.io as 0.3.1 with 4,148 downloads"; packets/frankensearch-assessment.md:22 "TRL 5–6 — see §4.9). Substantive and partially validated")
- Approximate search there is held in reserve: HNSW through a pinned fork is feature-gated, and the latency receipts cover only brute force. Both vector generations carry RaptorQ error-correction sidecars, whose recovery was not executed by the assessor. [Verified] (packets/frankensearch-assessment.md:291 "the receipts only cover brute-force top-k"; packets/frankensearch-assessment.md:99 "RaptorQ FEC sidecars for both vector generations")
- The packet names Qdrant, Weaviate and Milvus as the incumbents it does not contest, and its license rider bars OpenAI, Anthropic and anyone acting for them. [Inference] [Verified] (packets/frankensearch-assessment.md:148 "with filtering, quantization, and distributed stories frankensearch doesn't contest"; packets/frankensearch-assessment.md:175 "The license bars OpenAI, Anthropic, affiliates, and anyone acting for them")

## What we cannot say
- Whether any vendor's filtered search returns the right results: only filter-relevant test files were found (ecosystem/pickup/_evidence/vector-dbs.md:43 "Filter-correctness file evidence is partial").
- How the systems compare now: the public harness is sunset and its successor is small (ecosystem/pickup/_evidence/vector-dbs.md:41 "and points to vector-index-bench/vibe (73 stars, early)"; ecosystem/pickup/pickup-vector-dbs.md:347 "Is VIBE (73 stars, early) stable enough"). Chroma and LanceDB never submitted to it, so their numbers are self-hosted (ecosystem/pickup/_evidence/vector-dbs.md:44 "Chroma and LanceDB are NOT in ann_benchmarks/algorithms/").
- Who runs these in production: descriptions come from repo metadata (ecosystem/pickup/_evidence/vector-dbs.md:45 "I did not verify named company adopters, so none are claimed").
- How deep LanceDB's Python tests go (ecosystem/pickup/_evidence/vector-dbs.md:46 "lancedb python/tests/ currently only holds test_oauth.py + test_otel.py"), or what Vespa's `vbench` covers, since its README path 404'd (ecosystem/pickup/_evidence/vector-dbs.md:47 "vespa vbench/README 404'd on master").
- How to verify hybrid dense-plus-keyword results: no independent ground truth was identified (ecosystem/pickup/pickup-vector-dbs.md:368 "Ground-truth provenance for hybrid (dense+sparse) tracks").

## Revisit when
- VIBE tags a release with participant modules from the major vendors.
- Any vendor publishes a dedicated filtered-recall test suite with precomputed ground truth.
- frankensearch receipts its HNSW path.
