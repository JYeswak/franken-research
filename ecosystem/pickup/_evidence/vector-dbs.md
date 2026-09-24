# Vector databases - evidence

> Research-only evidence pack for the FrankenSuite project-pickup playbook (vector databases: ANN search, HNSW/IVF indexes, hybrid search, filtering).
> All star/push counts taken from the GitHub API on 2026-09-23. No repo cited from memory; repos that 404'd were dropped.

## Trend (owner/repo | stars | last push | why it evidences the trend)

- `milvus-io/milvus` | 46,239 | 2026-09-23 | Highest-star OSS vector DB in the set; "cloud-native vector database"; active same-day pushes.
- `facebookresearch/faiss` | 40,964 | 2026-09-22 | Canonical ANN library everything else is measured against; Facebook Research maintenance.
- `qdrant/qdrant` | 34,760 | 2026-09-23 | Rust HNSW engine, "massive-scale"; submits parameter-sweep configs to ANN-Benchmarks (`ann_benchmarks/algorithms/qdrant`); active same-day pushes.
- `chroma-core/chroma` | 29,359 | 2026-09-23 | "Search infrastructure for AI"; embedded-first alternative; 29K stars with active pushes.
- `pgvector/pgvector` | 23,134 | 2026-09-22 | Vector ANN inside Postgres (HNSW/IVF) — evidences the "hybrid: extend the existing DB instead of deploying a new one" pole of the category.
- `weaviate/weaviate` | 16,839 | 2026-09-23 | GO vector DB with modules (hybrid search/BM25); ANN-Benchmarks participant (`ann_benchmarks/algorithms/weaviate`).
- `lancedb/lancedb` | 11,508 | 2026-09-23 | Embedded multimodal retrieval library; multi-language (Rust core, Python/Node/Java bindings); in the ANN-Benchmarks README "evaluated" spirit but **not** present in `ann_benchmarks/algorithms/`.
- `vespa-engine/vespa` | 7,108 | 2026-09-23 | AI search platform with ANN + lexical ranking unified; ANN-Benchmarks participant (`ann_benchmarks/algorithms/vespa`); ships its own perf harness in-repo (`vbench/`).
- `vdaas/vald` | 1,730 | 2026-09-16 | Distributed vector search engine; ANN-Benchmarks participant (`ann_benchmarks/algorithms/vald`). Owner is `vdaas/vald` — `Vald-Cluster/vald` 404s.
- `erikbern/ann-benchmarks` | 5,735 | 2026-07-10 | The canonical ANN benchmark harness: 55 algorithm modules (`ann_benchmarks/algorithms/`) incl. qdrant, milvus, weaviate, vespa, vald, vearch, faiss_hnsw, diskann, glass, vsag, redisearch, pgvecto_rs. ⚠️ README banner: **"no longer actively maintained"** — directs new work to `vector-index-bench/vibe`.
- `vector-index-bench/vibe` | 73 | 2026-09-23 | Successor harness ("Vector Index Benchmark for Embeddings"); small and early — the community's measurement infrastructure is mid-migration.

## Process practices worth copying (practice | repos exhibiting it | file pointers)

| Practice | Repos exhibiting it | File pointers |
|---|---|---|
| Docker-per-algorithm reproducibility for benchmarks (each contender ships a `Dockerfile` + config; harness drives identical HDF5 datasets and query workloads) | ann-benchmarks (harness); qdrant, milvus, weaviate, vespa, vald, faiss_hnsw, diskann, glass, vsag, vearch, redisearch, pgvecto_rs as participants | `erikbern/ann-benchmarks:ann_benchmarks/algorithms/{qdrant,milvus,weaviate,vespa,vald}/(config.yml, module.py, Dockerfile)`; methodology in `erikbern/ann-benchmarks:README.md` ("pre-generated datasets (in HDF5 format)", "test suite … to verify function integrity") |
| Recall-vs-QPS Pareto via explicit parameter sweeps (index params × query params × quantization) | qdrant (in harness) | `erikbern/ann-benchmarks:ann_benchmarks/algorithms/qdrant/config.yml` — grid over `m` ∈ [8..72], `ef_construct` ∈ [64..512], `hnsw_ef` ∈ [null..768], quantization ∈ [none, scalar, binary], re-score ∈ [True, False] |
| Filtered/filtrable ANN as a benchmark track | ann-benchmarks design (filter track added in later datasets); qdrant tests sparse/filter paths exist in-repo | `erikbern/ann-benchmarks:README.md` (datasets section); `qdrant/qdrant:tests/basic_sparse_test.sh`, `tests/basic_query_grpc_test.sh` — filter-relevant coverage (partial; see caveats) |
| Property-based correctness testing (Hypothesis strategies + explicit invariants) | chroma | `chroma-core/chroma:chromadb/test/property/` — `invariants.py`, `strategies.py`, `test_add.py`, `test_add_gc.py`, `test_cross_version_persist.py` |
| Stress / soak suites separate from unit tests | chroma, qdrant | `chroma-core/chroma:chromadb/test/stress/`; `qdrant/qdrant:tests/e2e_tests/` (`test_continuous_snapshots.py`, `test_many_collections.py`, `test_low_ram.py`, `test_low_disk.py`) |
| API-contract regression (OpenAPI consistency checks) | qdrant | `qdrant/qdrant:tests/openapi/`, `tests/openapi_consistency_check.sh` |
| In-repo benchmark drivers + dataset fixtures (Criterion-style) | chroma (Rust), weaviate (Go), lancedb (Python) | `chroma-core/chroma:rust/benchmark/` (`Cargo.toml`, `src/`, `dataset_files/`); `weaviate/weaviate:test/benchmark/` (`benchmark.go`, `benchmark_sift.go`, `run_performance_tracker.sh`); `lancedb/lancedb:python/benchmarks/bench_streaming_dataloader.py` |
| Ships a perf-regression CLI inside the main repo | vespa | `vespa-engine/vespa:vbench/` (`README`, `src/`, `testrun/`), plus `fbench/` at root — load/feed benchmark tooling, not an external bolt-on |
| Multi-language client conformance suites under one `tests/` tree | milvus | `milvus-io/milvus:tests/` (`integration/`, `go_client/`, `java_client/`, `python_client/`, `restful_client/`, `restful_client_v2/`), plus `tests/scripts/ci_e2e*.sh` |
| Per-language CI workflows, clearly named | chroma, lancedb | `chroma-core/chroma:.github/workflows/_rust-tests.yml`, `_python-tests.yml`, `_go-tests.yml`, `_javascript-client-tests.yml`, `nightly-tests.yml`; `lancedb/lancedb:.github/workflows/{rust,python,java,nodejs}.yml` + `dev.yml` |
| Rust-specific CI: lint + fmt + clippy + coverage + nightly E2E | qdrant | `qdrant/qdrant:.github/workflows/rust.yml`, `rust-lint.yml`, `rust-gpu.yml`, `coverage.yml`, `edge-test.yml`, `integration-tests.yml`, `long-e2e-tests.yml`, `nightly-model-testing.yml`, `codespell.yml` |
| CI helper scripts checked in beside tests | milvus | `milvus-io/milvus:tests/scripts/ci-util.sh`, `ci_e2e.sh`, `ci_compaction_integrity.sh` (21 workflows total) |
| Tiered acceptance tests (short vs long-running) | weaviate | `weaviate/weaviate:test/{acceptance,acceptance_lsmkv,acceptance_lsmkv_long_running,acceptance_with_go_client,acceptance_with_python}/`, entry point `test/run.sh`; `test/benchmark_bm25/` shows hybrid-search measurement beside vector measurement |
| AGENTS.md / CLAUDE.md contributor-playbook docs | lancedb, milvus, weaviate, chroma | `lancedb/lancedb:AGENTS.md`; `milvus-io/milvus:AGENTS.md`, `CLAUDE.md`; `weaviate/weaviate:CLAUDE.md`; `chroma-core/chroma:AGENTS.md` — how these projects onboard agents; worth mirroring |

## Notes / caveats (be honest about thin evidence)

- **ann-benchmarks is the gold standard but sunset**: README (fetched 2026-09-23) says "no longer actively maintained" and points to `vector-index-bench/vibe` (73 stars, early). A clean-room project should target VIBE for new submissions while studying ann-benchmarks' `algorithms/` module format (still the best-documented recall/QPS methodology: HDF5 datasets, Docker isolation, parameter grids).
- **`qdrant/bqann` does not exist**: 404'd via API. Qdrant's blog-posted ANN benchmarks have no public repo of that name — do not cite it.
- **Filter-correctness file evidence is partial**: I verified filter-relevant test files exist in qdrant (`basic_sparse_test.sh`, query tests) but did not verify a dedicated filtered-recall correctness suite at file level; don't claim more than "filter-relevant coverage" without deeper reading.
- **Chroma and LanceDB are NOT in `ann_benchmarks/algorithms/`** (55 modules listed; neither appears). Their public performance evidence lives in their own benchmark dirs — weaker external comparability than harness participants.
- **Adopter evidence**: descriptions ("cloud-native", "massive-scale", Postgres integration) are from repo metadata; I did not verify named company adopters, so none are claimed.
- lancedb `python/tests/` currently only holds `test_oauth.py` + `test_otel.py` (Python-side suite is thin; Rust side at `rust/lancedb/tests/` was not enumerated).
- vespa `vbench/README` 404'd on master (dir exists with `README`, `src/`, `testrun/`; filename may differ in case or path — cite the directory).
