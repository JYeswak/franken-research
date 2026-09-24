# Pickup companion: Vector databases

S2 author artifact, planning-arc for the FrankenSuite project-pickup ecosystem.
Type: ANN search / vector databases (HNSW/IVF indexes, quantization, hybrid
BM25+vector, filtered search). Star/push snapshots: GitHub API, 2026-09-23.
Repo and path citations come ONLY from `_evidence/vector-dbs.md`; inference is
labeled as such. INTENT.md mandates stable REQ-*/GATE-*/CLAIM-*/UNK-* IDs;
those are used throughout.

## Charter seed

A vector-database project is a system that stores high-dimensional vectors,
builds an approximate-nearest-neighbor index (HNSW, IVF, PQ/SQ/BQ
quantization), and answers top-k / range queries — increasingly with metadata
filtering and hybrid dense+sparse (BM25) ranking — under recall-vs-QPS
trade-offs that are only meaningful as Pareto curves.

**In scope:** ANN index algorithms and parameter grids; quantization and
re-scoring pipelines; filtered ANN (metadata predicates + vector); hybrid
dense/sparse ranking; client API conformance (OpenAPI/REST/gRPC); persistence
and snapshot/crash correctness; recall/QPS/throughput benchmarking with pinned
datasets and pinned oracles.

**Out of scope:** the embedding models that produce the vectors
(`embedding-serving` type); RAG orchestration layers above the store
(`rag-frameworks`, `agent-memory`); application-level search UX;
training GPU kernels.

**"A good starting point"** for this type = a `docs/truth-pack/` with a pinned
oracle binary (SHA-256 recorded at invocation), hash-pinned datasets and query
workloads (HDF5, precomputed ground truth), a parameter-sweep harness
(index params × query params × quantization), a nondeterminism floor from
repeated index builds (HNSW builds are seed-dependent), and an acceptance
surface expressed as a recall@k/QPS Pareto curve — never a single recall
number. ann-benchmarks' `algorithms/` module format is the best-documented
methodology to copy; VIBE is the successor harness to target for new
submissions.

### Requirements

- **REQ-VDB-01** — Oracle inventory: every measurement names a pinned oracle
  binary or Docker image with its SHA-256 recorded at invocation time; no
  un-recorded executable is admissible (whisper-rule, per model-guides §2).
- **REQ-VDB-02** — Acceptance surface: results are recall@k/QPS Pareto curves
  over explicit parameter grids (m, ef_construct, hnsw_ef, quantization,
  re-score), banked per config; a single recall number is not a result.
- **REQ-VDB-03** — Dataset immutability: benchmark datasets and query workloads
  are pinned by hash (HDF5); re-normalization or regeneration without
  re-banking the golden is a forbidden pattern.
- **REQ-VDB-04** — Filtered ANN is gated separately: filtered recall needs a
  dedicated filtered query set with precomputed ground truth; unfiltered recall
  cannot stand in for filtered correctness.
- **REQ-VDB-05** — Competitive claims ("faster than X") require a
  same-invocation duel against the actual incumbent binary with its SHA-256
  recorded and A/A nulls in [0.98, 1.02] (CAMPAIGN WIN result-class doctrine,
  model-guides §3).
- **REQ-VDB-06** — Nondeterminism floor: index builds (HNSW seed dependence)
  must be banked via repeated-build A/A before any recall/build-time claim;
  `NONDETERMINISM_FLOOR.md` is a committed file.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Truth-pack shape per S0 model-guides: `docs/truth-pack/` holding
`PIN_RECORD.md`, `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json`,
`NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh --verify`, plus
invocation-time SHA-256 recording of every oracle binary.

- **faiss (facebookresearch/faiss)** — reference implementation / ground-truth
  oracle. Use: exact-search ground truth generation; `faiss_hnsw` as the
  incumbent ANN arm in duels. Integrity: pin commit; record binary SHA-256 per
  invocation; fixtures (dataset HDF5) hashed in MANIFEST.sha256.
- **ann-benchmarks harness (erikbern/ann-benchmarks)** — methodology oracle
  (NOT a live benchmark anymore: README banner "no longer actively maintained").
  Use: copy the `algorithms/{qdrant,milvus,weaviate,vespa,vald}/(config.yml,
  module.py, Dockerfile)` module format and the HDF5 dataset convention as the
  project's benchmark contract. Integrity: pin harness commit; note the sunset
  banner in PIN_RECORD.md (date it was observed: 2026-09-23).
- **VIBE (vector-index-bench/vibe)** — successor harness oracle for any new
  submission. Integrity: same truth-pack treatment; treat its instability as a
  recorded risk (see UNK-VDB-01).
- **Deployment oracles: qdrant, milvus, weaviate, vespa, vald Docker images** —
  incumbent arms for CAMPAIGN WIN duels. Integrity: pin image digest (not tag),
  record SHA-256 at invocation; parameter sweep config (`config.yml` grid, as
  qdrant's) committed with each receipt.
- **pgvector (pgvector/pgvector)** — the "extend the existing DB" pole: oracle
  for hybrid-DB claims, not pure-ANN claims. Do not use pgvector numbers to
  support claims about standalone ANN index quality (domain mismatch).

Per-oracle integrity checks: `fetch-truth-pack.sh --verify` confirms pin +
manifest + fixture hashes; `ACCEPTANCE_SURFACE.json` carries the recall/QPS
Pareto break-even thresholds before the experiment; `NONDETERMINISM_FLOOR.md`
records the repeated-build spread; every receipt names the oracle binary
SHA-256. UNK-VDB-01 (VIBE maturity), UNK-VDB-05 (filtered ground-truth
provenance) are carried as UNK-*.

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, not any single repo's marketing.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
aspirational. Status: ADMISSIBLE / CONTESTED / WITHDRAWN.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-VDB-01 | The category's canonical measurement unit is the recall-vs-QPS Pareto frontier from explicit parameter sweeps (index params × query params × quantization), not a single recall number. | `erikbern/ann-benchmarks:ann_benchmarks/algorithms/qdrant/config.yml` (grid over m, ef_construct, hnsw_ef, quantization, re-score); README.md methodology ("pre-generated datasets (in HDF5 format)") | T0 | High | ADMISSIBLE |
| CLAIM-VDB-02 | Docker-per-algorithm isolation (each contender ships Dockerfile + config; harness drives identical datasets) is the comparability norm for public ANN numbers. | `erikbern/ann-benchmarks:ann_benchmarks/algorithms/{qdrant,milvus,weaviate,vespa,vald}/(config.yml, module.py, Dockerfile)` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-03 | Harness participants submit parameter-sweep configs rather than single tuned configs. | `erikbern/ann-benchmarks:ann_benchmarks/algorithms/qdrant/config.yml`; participant modules in `ann_benchmarks/algorithms/` (55 modules incl. faiss_hnsw, diskann, glass, vsag, redisearch, pgvecto_rs) | T0 | High | ADMISSIBLE |
| CLAIM-VDB-04 | Filter-relevant coverage exists (ann-benchmarks filter track in later datasets; qdrant filter-relevant tests); no dedicated filtered-recall suite verified at file level. | `erikbern/ann-benchmarks:README.md` (datasets section); `qdrant/qdrant:tests/basic_sparse_test.sh`, `tests/basic_query_grpc_test.sh` (filter-relevant coverage only) | T2 | Low | CONTESTED |
| CLAIM-VDB-05 | Property-based correctness testing (strategies + invariants) is an in-repo norm for at least one major vendor. | `chroma-core/chroma:chromadb/test/property/` (`invariants.py`, `strategies.py`, `test_add.py`, `test_add_gc.py`, `test_cross_version_persist.py`) | T0 | High | ADMISSIBLE |
| CLAIM-VDB-06 | In-repo benchmark drivers with dataset fixtures are shipped in multiple languages (Criterion-style). | `chroma-core/chroma:rust/benchmark/` (`Cargo.toml`, `src/`, `dataset_files/`); `weaviate/weaviate:test/benchmark/` (`benchmark.go`, `benchmark_sift.go`, `run_performance_tracker.sh`); `lancedb/lancedb:python/benchmarks/bench_streaming_dataloader.py` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-07 | Stress/soak suites live apart from unit tests, including resource-constrained scenarios (low RAM, low disk, many collections, continuous snapshots). | `chroma-core/chroma:chromadb/test/stress/`; `qdrant/qdrant:tests/e2e_tests/` (`test_continuous_snapshots.py`, `test_many_collections.py`, `test_low_ram.py`, `test_low_disk.py`) | T0 | High | ADMISSIBLE |
| CLAIM-VDB-08 | A perf-regression/benchmark CLI ships inside the main repo, not as an external bolt-on. | `vespa-engine/vespa:vbench/` (`README`, `src/`, `testrun/`), plus `fbench/` at root | T0 | High | ADMISSIBLE |
| CLAIM-VDB-09 | Multi-language client conformance suites run under one `tests/` tree with CI entry points. | `milvus-io/milvus:tests/` (`integration/`, `go_client/`, `java_client/`, `python_client/`, `restful_client/`, `restful_client_v2/`), `tests/scripts/ci_e2e*.sh` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-10 | Rust-side CI norm: lint + fmt + clippy + coverage + nightly/long E2E + codespell, with per-language workflow files. | `qdrant/qdrant:.github/workflows/` (`rust.yml`, `rust-lint.yml`, `rust-gpu.yml`, `coverage.yml`, `edge-test.yml`, `integration-tests.yml`, `long-e2e-tests.yml`, `nightly-model-testing.yml`); chroma `_rust-tests.yml`, `_python-tests.yml`, `_go-tests.yml`, `_javascript-client-tests.yml`, `nightly-tests.yml`; lancedb `{rust,python,java,nodejs}.yml` + `dev.yml` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-11 | Tiered acceptance tests (short vs long-running) are an established shape for server DBs. | `weaviate/weaviate:test/{acceptance,acceptance_lsmkv,acceptance_lsmkv_long_running,acceptance_with_go_client,acceptance_with_python}/`, entry `test/run.sh`; `test/benchmark_bm25/` shows hybrid search measured beside vector search | T0 | High | ADMISSIBLE |
| CLAIM-VDB-12 | API-contract regression (OpenAPI consistency checks) is an in-repo practice. | `qdrant/qdrant:tests/openapi/`, `tests/openapi_consistency_check.sh` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-13 | AGENTS.md/CLAUDE.md contributor-playbook docs are a category norm for agent onboarding. | `lancedb/lancedb:AGENTS.md`; `milvus-io/milvus:AGENTS.md`, `CLAUDE.md`; `weaviate/weaviate:CLAUDE.md`; `chroma-core/chroma:AGENTS.md` | T0 | High | ADMISSIBLE |
| CLAIM-VDB-14 | The community's measurement infrastructure is mid-migration: ann-benchmarks is sunset (README banner 2026-09-23) and its successor VIBE is small and early (73 stars). | `erikbern/ann-benchmarks:README.md` banner; `vector-index-bench/vibe` (73 stars, push 2026-09-23); thin: chroma and lancedb are absent from `ann_benchmarks/algorithms/` (55 modules, neither listed) so their public perf evidence is self-hosted and less comparable — comparability gap is inference, labeled | T0 | High | ADMISSIBLE |

## Gate profile

Starter-kit G1–G14 applicability (one-liners per
`_s0/ecosystem-digest.md` §3):

- **G1 ORACLE** — applies as-is; oracle inventory = pinned faiss binary /
  deployment-oracle Docker image digest + truth-pack PIN_RECORD.md.
- **G2 PAIR** — applies as-is; paired contract = same-invocation incumbent
  duel with A/A nulls in [0.98, 1.02] (REQ-VDB-05).
- **G3 OWN** — applies as-is.
- **G4 CONTRACT** — applies with type parameter: API-contract conformance =
  OpenAPI consistency checks (qdrant `tests/openapi/` pattern) per supported
  client language; wire-format/REST/gRPC fixtures hashed.
- **G5 HOST** — applies as-is; ANN perf numbers are host-bound — goldens bind
  per host, never compared across hosts.
- **G6 UNSAFE** — applies as-is for any Rust `unsafe`; advisory for pure
  managed-language builds.
- **G7 REVIEW** — advisory; the type-specific analog is split-context adversarial review on recall/sweep methodology changes, recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — applies as-is.
- **G9 IOU** — applies as-is.
- **G10 MIRI** — applies as-is for Rust index code.
- **G11 LAYOUT** — advisory for this type (no pinned layout-assertion norm in
  the evidence; adopt only if the build ships a `LIFETIMES.tsv` equivalent).
- **G12 AUDIT** — applies as-is.
- **G13 NOSTUB** — applies as-is.
- **G14 REJECT** — applies as-is; tier violations (e.g. T2 blog numbers cited
  as T1 harness results) fail the claim.

New type-specific gates:

- **GATE-VDB-01 RECALL-PARETO — RETIRED into shared GATE-009** (S4 round 1,
  dedup). GATE-009 acceptance (4) already requires the recall-vs-QPS Pareto
  characterized by explicit parameter sweeps. Retained as a type-specific
  parameter: recall@k and QPS banked for every config in the committed sweep
  grid; the receipt shows the Pareto frontier; a run reporting fewer than the
  full grid fails.
- **GATE-VDB-02 FILTER-TRACK** — filtered ANN claims require a dedicated
  filtered query set with precomputed ground truth pinned in MANIFEST.sha256.
  Acceptance: filtered recall@k banked separately; unfiltered recall failing
  this gate cannot be cited for filtered correctness.
- **GATE-VDB-03 DATASET-IMMUTABILITY** — datasets and query workloads are
  content-hashed; any re-normalization, re-shard, or regeneration requires
  re-banking the golden and recording the change in the truth pack.
  Acceptance: `fetch-truth-pack.sh --verify` PASS and receipt's dataset hash
  matches MANIFEST.sha256.
- **GATE-VDB-04 SEED-FLOOR** — repeated index builds (HNSW seed dependence)
  banked before any recall/build-time claim. Acceptance: A/A build spread
  recorded in NONDETERMINISM_FLOOR.md; tolerance rule tol =
  max(3 × A/A relative spread, floor) applied to recall@k and QPS goldens.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Competitive claims rest on pinned incumbent binary/dataset hashes; duels require both binaries' SHA-256 (REQ-VDB-01, REQ-VDB-05) |
| GATE-009 (Retrieval relevance/recall) | Load-bearing | Applies to this slug; recall@k/QPS Pareto over explicit parameter grids (REQ-VDB-02; GATE-VDB-01 retired into 009) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; loopback endpoints only |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; unit/property/recall/filter/hybrid/stress/e2e tiers |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; DB image digests, faiss commit, dataset HDF5 hashes |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; HNSW seed-dependence A/A floors (REQ-VDB-06) |

## Evidence tiers

Mapped to the localbench evidence-tier conventions (`_s0/localbench-pattern.md`
slots 3, 8–10, 12), with canonical pickup tiers:

- **T0 [Verified]** — code-verified in-vendor artifacts: repo file pointers
  (benchmark dirs, test suites, CI workflows, AGENTS.md), Dockerfiles and
  sweep configs shipped by the vendor.
- **T1 [CI-observed]** — vendor CI logs that actually executed (CI-observed
  attests the suite *runs*, not that it is green); never the tier for competitive
  claims.
- **T2 [Maintainer claim]** — vendor README claims, star counts, blog benchmarks,
  self-hosted perf numbers (e.g. chroma/lancedb in-repo benchmarks, which are
  not harness-participating — cite as T2, never as comparable to T1); third-party
  harness results (ann-benchmarks / `ann_benchmarks/algorithms/` participant modules
  and their receipts; VIBE results once stable; independent reproductions with pinned
  oracle + dataset hashes). Competitive "faster than X" claims are T2-with-gates
  only (shared GATE-009 (with the retired GATE-VDB-01 sweep-grid parameter) +
  GATE-VDB-02..04 met, as applicable) — never T1.
- **T3 [Inference]** — roadmaps, "massive-scale" positioning, planned filter
  tracks or quantization paths with no measured receipt; registered as
  TARGETED, never as OBSERVED.

Machine wiring: `registries/claims.tsv` — every public claim sentence
registered and checked against its receipt on every commit; evidence-state
vocabulary `[OBSERVED@pin]` / `[REPORTED]` / `[EVIDENCED]` / `[PARTIAL]` /
`[TARGETED]` / `[HYPOTHESIS]` per model-guides §5. Negative-evidence ledger
(`NEGATIVE_EVIDENCE.md`, `DISCREPANCIES.md`) with do-not-retry predicates;
failed A/A-null campaigns published as NO ADMISSIBLE VERDICT, not buried.

## Localbench bench shape

Instantiates `_s0/localbench-pattern.md` slots 1–13 for vector databases:

1. **Spec format** — `image:tag:dataset:oracle-rev`, e.g.
   `qdrant/qdrant@sha256:<digest>:sift1m:faiss-exact@<commit>`; the harness
   starts/stops the DB container itself and records the image digest at
   invocation.
2. **Tier list** — `unit`, `property`, `recall` (ANN recall/QPS sweep),
   `filter` (filtered ANN track), `hybrid` (dense+sparse), `stress` (soak,
   low-RAM/disk, snapshots), `e2e`. Goldens bind PER TIER; an index-param
   change invalidates only `recall`/`filter` tiers (re-bank those only).
3. **Golden schema** — `conformance` (named checks, `level: MUST|SHOULD`,
   `verdict: PASS|FAIL`: MUST = OpenAPI consistency, fixture-hash match,
   Oracle-SHA recorded, A/A nulls in [0.98,1.02]; SHOULD = Miri clean,
   stress-suite green) + `metrics` (recall@k, QPS, build-time, index bytes;
   each with `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt
   path, `better` direction).
4. **Banking ceremony** — goldens written ONLY by `aa <spec> --write-golden`
   (two A/A runs → banked receipt + golden; refuses unsound A/A pairs),
   followed by `git diff goldens/` review in the same commit. Tolerance:
   `tol = max(3 × A/A relative spread, floor)`; golden-regeneration-until-green
   is the named forbidden pattern (GATE-VDB-03 violation).
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across
   hosts or generations (DB version / harness update = new generation);
   CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden.
6. **Measurement law** — preflight refuses a busy machine (>25% GPU/CPU, names
   processes); runs marked CONTENDED if any non-backend process exceeds 25%
   GPU in a second; one DB container under test at a time; loopback endpoints
   only; park/unpark interfering residents.
7. **A/B discipline** — same-invocation A, B, A ordering (incumbent oracle vs
   clean-room build), banked under a name; both binaries' SHA-256 recorded.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, recall, filter, stress, run) + dated `.md` investigation
   notes; `runs/` gitignored scratch with `<ts>__<kind>__<spec>` dirs.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact image digests,
   faiss commit, harness commit (ann-benchmarks or VIBE), dataset HDF5 hashes,
   query workload hashes, OS/kernel.
10. **Claims wiring** — `registries/claims.tsv` checked on every commit.
11. **Negative-evidence ledger** — `NEGATIVE_EVIDENCE.md`, `DISCREPANCIES.md`,
    `break-tests.md`, `demotion-rules.md`; demotions always allowed; no
    self-grading without independent verification (T1 harness re-run).
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in
    AGENTS.md; vector-specific watchlist: bench-path hardcoding (memorizing
    the sift1m queries), easy-lever cherry-picking (reporting only the best
    grid cell), gate self-weakening (dropping the GATE-009 sweep-grid parameter when the Pareto
    looks bad), golden regeneration reflex.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

- `templates/bench/ann/` — Docker-per-algorithm harness template modeled on
  `ann_benchmarks/algorithms/` module format (`Dockerfile` + `config.yml`
  sweep grid + `module.py` driver contract).
- `templates/truth-pack/` — truth-pack skeleton pre-shaped for vector work:
  PIN_RECORD.md (oracle binary pin + dataset hashes), MANIFEST.sha256,
  ACCEPTANCE_SURFACE.json (Pareto thresholds, per-tier), NONDETERMINISM_FLOOR.md
  (seed-spread template), `fetch-truth-pack.sh --verify`.
- `templates/ci/` — per-language workflow set (`rust.yml`, `python.yml`,
  `go.yml`, `node.yml`, nightly/long-E2E) following the qdrant/chroma/lancedb
  naming; includes `tests/openapi_consistency_check.sh` analogue.
- `templates/tests/property/` — property-test strategy/invariant skeleton
  (chroma `strategies.py`/`invariants.py` shape) for add/delete/persist
  invariants.
- `templates/perf-cli/` — vbench-shaped perf-regression CLI scaffold
  (`bench/`, load/feed drivers, testrun/) to ship in-repo from day one.
- `templates/gates/GATE-VDB-0{1..4}.md` — the four new gates with acceptance
  criteria above.
- `templates/AGENTS.md` — contributor-playbook template (build/test/bench
  commands, oracle pinning policy, the 12 anti-reward-hacking patterns)
  mirroring the milvus/weaviate/chroma/lancedb norm (CLAIM-VDB-13).
- `templates/goldens/` — golden schema with recall@k/QPS/build-time metrics,
  A/A-spread tolerance rule, and per-tier invalidation rules wired in.
- **CI provisioning + cost ownership (bench slot 13):** runner class/host,
  provisioning owner, funding owner/account, schedule, and spend cap —
  TBD acceptable pre-S5 (any TBD blocks S5 per Bench slot 13); current:
  TBD (owner: parent orchestrator assigns at S3).

## Trend + process citations

Verified live via GitHub API 2026-09-23. Stars are a popularity snapshot, not
a quality ranking — do not rank by them.

- `milvus-io/milvus` | 46,239 | push 2026-09-23 — highest-star OSS vector DB;
  "cloud-native"; multi-language client conformance under `tests/`.
- `facebookresearch/faiss` | 40,964 | push 2026-09-22 — canonical ANN library;
  ground-truth / incumbent oracle role.
- `qdrant/qdrant` | 34,760 | push 2026-09-23 — Rust HNSW engine; submits
  parameter-sweep configs to ANN-Benchmarks; Rust CI breadth is the template.
- `chroma-core/chroma` | 29,359 | push 2026-09-23 — embedded-first;
  property-based correctness testing + stress suites in-repo.
- `pgvector/pgvector` | 23,134 | push 2026-09-22 — vectors inside Postgres;
  the hybrid-extend pole of the category.
- `weaviate/weaviate` | 16,839 | push 2026-09-23 — Go vector DB with hybrid
  BM25 modules; tiered acceptance tests.
- `lancedb/lancedb` | 11,508 | push 2026-09-23 — embedded multimodal,
  Rust core + multi-language bindings; AGENTS.md present.
- `vespa-engine/vespa` | 7,108 | push 2026-09-23 — ANN + lexical unified;
  ships perf harness in-repo (`vbench/`).
- `vdaas/vald` | 1,730 | push 2026-09-16 — distributed vector search;
  ANN-Benchmarks participant (owner is `vdaas/vald`; `Vald-Cluster/vald`
  404s — do not cite the 404'd name).
- `erikbern/ann-benchmarks` | 5,735 | push 2026-07-10 — canonical harness;
  SUNSET (README banner "no longer actively maintained", directs to VIBE).
  Methodology (HDF5 datasets, Docker isolation, parameter grids) remains the
  best-documented to copy.
- `vector-index-bench/vibe` | 73 | push 2026-09-23 — successor harness;
  small and early; community measurement is mid-migration.

Honest caveats (carried from evidence, unchanged):

- ann-benchmarks' methodology remains the best-documented to copy, but the harness is sunset; target VIBE for new
  submissions while studying ann-benchmarks' `algorithms/` format.
- `qdrant/bqann` does not exist (404); do not cite it.
- Filter-correctness file evidence is partial: only "filter-relevant
  coverage" verified in qdrant (`basic_sparse_test.sh`, query gRPC tests);
  no dedicated filtered-recall suite verified — don't claim more.
- Chroma and LanceDB are NOT in `ann_benchmarks/algorithms/` (55 modules);
  their perf evidence is self-hosted, less comparable (labeled inference).
- Adopter evidence: none verified — no named company adopters are claimed;
  "cloud-native"/"massive-scale" phrasing is repo metadata only.
- LanceDB `python/tests/` currently holds only `test_oauth.py` +
  `test_otel.py` (thin Python side); `rust/lancedb/tests/` not enumerated.
- `vespa-engine/vespa:vbench/README` 404'd on master — cite the directory,
  not the file.

## Unknowns (UNK-*)

- **UNK-VDB-01** — Is VIBE (73 stars, early) stable enough to be the pinned
  oracle harness for a clean-room project, or does its migration state make
  every VIBE-pinned golden a generation risk? Must resolve before S5 (blocks
  REQ-VDB-01 oracle selection).
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] VIBE oracle selection parked: pin-time stability check at S2 against a written criterion; fallback named; generation binding bounds migration risk. Promotion predicate: at S2 oracle pinning (truth-pack assembly; re-verified at S3 bench setup), assess VIBE at pin time against a written stability criterion (tagged release, or migration-complete + CI signal at the candidate commit); pin VIBE at a commit iff it passes, else pin the named fallback; record the decision and criterion outcome in PIN_RECORD.md. Owner: plan author. S3 step: oracle pinning / bench setup.
- **UNK-VDB-02** — Filtered-recall correctness: no dedicated filtered-recall
  suite verified at file level in any vendor repo. GATE-VDB-02's ground-truth
  generator must be built from scratch or sourced from ann-benchmarks' filter
  track — provenance unverified.
  **Disposition: TARGETED.**
- **UNK-VDB-03** — ann-benchmarks `algorithms/` module format is the
  methodology template, but the harness is sunset: which VIBE APIs replace
  `config.yml`/`module.py`/`Dockerfile` contract, and is the mapping
  one-to-one? Needs a VIBE read-through.
  **Disposition: TARGETED.**
- **UNK-VDB-04** — HNSW nondeterminism sources beyond build seeds (OS thread
  scheduling, SIMD variance across CPU generations): is the committed
  NONDETERMINISM_FLOOR.md seed-spread sufficient, or do cross-CPU-generation
  floors need separate goldens (G5 HOST already binds per host, but
  generation granularity is open)?
  **Disposition: TARGETED.**
- **UNK-VDB-05** — Ground-truth provenance for hybrid (dense+sparse) tracks:
  weaviate measures BM25 beside vector (`test/benchmark_bm25/`), but no
  independent hybrid ground-truth oracle was identified. The `hybrid` bench
  tier has no oracle candidate yet.
  **Disposition: TARGETED.**
- **UNK-VDB-06** — Client-conformance depth for embedded libraries
  (chroma, lancedb): multi-language CI exists, but the file evidence for
  cross-language conformance *suites* (vs. per-language unit tests) is
  milvus-shaped only. Applicability of G4's type parameters to embedded
  single-process APIs is unverified.
  **Disposition: TARGETED.**
