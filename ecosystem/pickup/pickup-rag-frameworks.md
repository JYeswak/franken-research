# Pickup companion: RAG frameworks

Type: retrieval-augmented generation frameworks — document ingestion pipelines,
chunking, retrieval, re-ranking, and grounded generation with in-tree evaluation.

## Charter seed

**What this project type is.** A RAG framework project produces a
document-processing pipeline plus retrieval primitives (chunkers, indexers,
retrievers, re-rankers, query engines) and the evaluation machinery that keeps
the pipeline honest (faithfulness, context precision/recall, answer relevance
metrics shipped as importable modules, not demos). The exemplar is a new
framework or a clean-room reimplementation of one, not a wrapper over a
single vendor API.

**In scope.**
- Ingestion: loaders, parsers, node/chunk parsers with pluggable strategies
  behind a registry (copy LightRAG's `lightrag/chunker/registry.py` shape).
- Retrieval: vector/document stores, retrievers, re-rankers, hybrid (dense+sparse)
  and graph-RAG query paths.
- Evaluation: in-tree eval metrics + benchmark harnesses (BEIR/HotpotQA-style),
  nightly eval CI gated on checked-in ground truth.
- Record/replay of LLM calls (VCR cassettes) so tests are hermetic.
- Docs-code coherence (snippets executed in CI), chunker snapshot tests,
  release-note fragments per change.

**Out of scope.** Building a new embedding model (see embedding-serving
companion); building a vector database engine (see vector-dbs companion);
single-app RAG demos; hosting/provider billing infrastructure.

**What "a good starting point" means.** A repo where you can (1) point the
harness at a frozen corpus + frozen oracle and get a faithfulness number,
(2) swap chunking strategies through a registry and see the retrieval numbers
move, (3) run the full test suite without a network key, and (4) trace any
published metric back to a receipt. If any of these four fails, the project is
not started yet.

### Requirements

- **REQ-1.** Every shipped eval metric must be importable as a module with a
  stable API and its own unit tests (llamaindex `core/evaluation/`,
  haystack `components/evaluators/`, ragas `src/ragas/metrics/`).
- **REQ-2.** The harness must record/replay all LLM calls (VCR cassettes or
  equivalent) so CI runs hermetic and cost-bounded, per langchain
  `.github/workflows/_test_vcr.yml`.
- **REQ-3.** CI must be tiered: fast unit tier on every commit; integration/e2e/
  slow/notebook tiers gated or scheduled, per graphrag/haystack/llamaindex
  workflow splits.
- **REQ-4.** A frozen offline retrieval check (corpus + oracle JSON, pinned
  acceptance thresholds) must exist in-tree, per LightRAG
  `lightrag/evaluation/{sample_dataset.json,sample_retrieval_oracle.json}`
  with thresholds faithfulness/answer-relevance/context-recall/context-precision
  each > 0.80.
- **REQ-5.** Chunkers/splitters must sit behind a registry and carry snapshot
  unit tests, per LightRAG `lightrag/chunker/` and azure-search-openai-demo
  `tests/snapshots/`.
- **REQ-6.** Every public quality claim must name its corpus, metric, model
  backend, and threshold, and be registered in the claims registry with a
  do-not-claim boundary (no corpus named = not admissible).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all named in the evidence file; no others are available for
this type at S2):

1. **BEIR retrieval benchmark** — per llamaindex
   `llama-index-core/llama_index/core/evaluation/benchmarks/beir.py`.
2. **HotpotQA QA benchmark** — per llamaindex `.../benchmarks/hotpotqa.py`.
3. **RAGAS metric implementations** — `src/ragas/metrics/` in
   `vibrantlabsai/ragas` (canonical RAG eval vocabulary; soft activity —
   last push 2026-02-24 — but referenced by LightRAG and deepeval).
4. **DeepEval RAG metrics** — `deepeval/metrics/` in `confident-ai/deepeval`
   (`contextual_recall`, `contextual_precision`, `contextual_relevancy`,
   `faithfulness`, `answer_relevancy`) plus its `ragas.py` bridge.
5. **Azure ground-truth eval suite** — `evals/ground_truth.jsonl` +
   `evals/evaluate_config.json` in `Azure-Samples/azure-search-openai-demo`,
   with comparison regression test `tests/test_eval_compare.py`.
6. **LightRAG offline retrieval oracle** — `lightrag/evaluation/
   sample_retrieval_oracle.json` + pinned thresholds in `README_EVALUASTION_RAGAS.md`.

Per-oracle integrity checks (truth-pack shape, model-guides §1–2):

- `docs/truth-pack/PIN_RECORD.md` pins each oracle's upstream commit (or dataset
  revision), the eval-framework package version, and the LLM backend identity
  used to generate any judgments; judgment-backend substitution is the
  listening-eval-shaped hole here (an LLM judge swapped silently changes all
  numbers), so the backend pin is a MUST row.
- `MANIFEST.sha256` binds every fixture: corpus files, ground-truth JSONL,
  oracle JSON, cassette files.
- **Dataset hash-pin convention** [RESOLVED 2026-09-23, S4 round 3 — UNK-1
  triaged RESOLVED, normative per the playbook truth-pack spec]: dataset
  revisions are pinned by content hash in `MANIFEST.sha256` (sha256sum format);
  the dataset version is recorded in `PIN_RECORD.md` and in every run manifest;
  third-party attribution files are vendored in-tree. The dataset revision is a
  declared oracle file under G1 ORACLE (this settles the row's "affects G1 scope"
  note).
- `ACCEPTANCE_SURFACE.json` records break-even thresholds (e.g. faithfulness >
  0.80 per LightRAG's README) and which metric is the gate metric for CI.
- `NONDETERMINISM_FLOOR.md` records the measured A/A spread of every LLM-judged
  metric at the pinned backend, per-metric, before any claim is banked
  (LLM-judged metrics have no meaningful zero-spread assumption).
- `fetch-truth-pack.sh --verify` re-fetches and re-hashes; fails closed on
  mismatch.
- Invocation-time oracle binary SHA-256 recording for every binary that
  participates in a measurement, per whisper PERF_LEDGER (no un-recorded
  executable is admissible).

UNK-* for the unverifiable (see also §10):

- **UNK-1.** See UNK-1 in Unknowns below (not redefined here).
- **UNK-2.** See UNK-2 in Unknowns below (not redefined here).
- **UNK-3.** See UNK-3 in Unknowns below (not redefined here).

## Initial claims (CLAIM-*)

All claims below are about the *type's* process norms, drawn from the 8
verified evidence repos. Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md):
T0 [Verified]; T1 [CI-observed]; T2 [Maintainer claim]/[External];
T3 [Inference].

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-1 | Mature RAG frameworks ship eval metrics as importable in-tree modules (faithfulness, context precision/recall, answer relevance), not as demo scripts | run-llama/llama_index `llama-index-core/llama_index/core/evaluation/`; deepset-ai/haystack `haystack/components/evaluators/`; vibrantlabsai/ragas `src/ragas/metrics/`; confident-ai/deepeval `deepeval/metrics/` | T0 | High | ADMISSIBLE |
| CLAIM-2 | Category-standard retrieval/QA benchmarks are BEIR and HotpotQA; a new framework's starting point names which it runs | run-llama/llama_index `.../core/evaluation/benchmarks/{beir.py,hotpotqa.py}` | T0 | High | ADMISSIBLE |
| CLAIM-3 | An offline retrieval check against a frozen oracle + sample dataset is the cheapest load-bearing eval fixture in the type | HKUDS/LightRAG `lightrag/evaluation/{offline_retrieval_check.py,sample_dataset.json,sample_retrieval_oracle.json}` | T0 | High | ADMISSIBLE |
| CLAIM-4 | Faithfulness/answer-relevance/context-recall/context-precision each > 0.80 is a published in-tree acceptance bar (one framework's bar, not a category standard) | HKUDS/LightRAG `lightrag/evaluation/README_EVALUASTION_RAGAS.md` (content read directly) | T2 | Low | CONTESTED |
| CLAIM-5 | Chunkers sit behind a registry with multiple strategies so chunking ablations are trivial to wire | HKUDS/LightRAG `lightrag/chunker/{paragraph_semantic.py,semantic_vector.py,recursive_character.py,token_size.py,registry.py,plugins.py}` | T0 | High | ADMISSIBLE |
| CLAIM-6 | Production RAG CI gates merges on a ground-truth eval suite with checked-in ground truth and a comparison regression test | Azure-Samples/azure-search-openai-demo `.github/workflows/evals-test.yaml` + `evals/` + `tests/test_eval_compare.py` | T0 | High | ADMISSIBLE |
| CLAIM-7 | CI is tiered (unit / integration / e2e / slow / notebook) across the type's major frameworks | microsoft/graphrag `.github/workflows/python-{unit,integration,notebook,smoke}-tests.yml`; deepset-ai/haystack `{tests,e2e,slow}.yml`; run-llama/llama_index `{unit_test,llama_dev_tests,coverage_check}.yml` | T0 | High | ADMISSIBLE |
| CLAIM-8 | LLM calls in tests are recorded/replayed (VCR cassettes) so CI is hermetic and cost-bounded | langchain-ai/langchain `.github/workflows/_test_vcr.yml` + `_test.yml` | T0 | High | ADMISSIBLE |
| CLAIM-9 | Doc code snippets are executed in CI (docs-code coherence tests) | deepset-ai/haystack `.github/workflows/docs-website-test-docs-snippets.yml`; vibrantlabsai/ragas `tests/docs/` | T0 | High | ADMISSIBLE |
| CLAIM-10 | Chunker/splitter unit tests use committed snapshots | Azure-Samples/azure-search-openai-demo `tests/{test_prepdocslib_textsplitter.py,test_sentencetextsplitter.py}` + `tests/snapshots/` | T0 | High | ADMISSIBLE |
| CLAIM-11 | The RAGAS metric vocabulary is the category's shared eval language even as the canonical repo's activity softens | HKUDS/LightRAG `lightrag/evaluation/eval_rag_quality.py` (RAGAS-based); confident-ai/deepeval `ragas.py` bridge | T0 | High | ADMISSIBLE |
| CLAIM-12 | Test trees mirror source trees (evaluation, retrievers, node_parser, query_engine all have test counterparts) | run-llama/llama_index `llama-index-core/tests/`; deepset-ai/haystack `test/`; vibrantlabsai/ragas `tests/{unit,e2e,benchmarks}/` | T0 | High | ADMISSIBLE |
| CLAIM-13 | Chunk-size ablation *experiments* (published results) are unverified in the evidence; only the machinery for them is confirmed | thin: LightRAG's registry + offline harness verified; no published ablation experiment found; `test_eval_compare.py` is the closest verified comparison test | T3 | — | WITHDRAWN |
| CLAIM-14 | Monorepo packaging lets evals/chunking ship and version independently of the framework core | microsoft/graphrag `packages/{graphrag,graphrag-chunking,graphrag-llm,...}` | T0 | High | ADMISSIBLE |

Notes: CLAIM-4 is CONTESTED because the 0.80 bar is one framework's pinned
README value, not a category standard, and the judging backend behind it is
unnamed (UNK-2). CLAIM-13 is WITHDRAWN at S2 — it overreaches the evidence.

## Gate profile

Starter-kit G1–G14 (port-rigor gates: G1 ORACLE, G2 PAIR, G3 OWN, G4 CONTRACT,
G5 HOST, G6 UNSAFE, G7 CI/REVIEW, G8 RULEBOOK, G9 IOU, G10 MIRI, G11 LAYOUT,
G12 AUDIT, G13 NOSTUB, G14 REJECT):

- **Applies as-is:** G1 (oracle protection: corpus/oracle/cassette pins +
  invocation-time SHA-256 recording), G8 (rulebook: add a
  RAG-specific porting rulebook only if reimplementing), G9 (agent-loop
  IOU declarations with max_rounds — agentic RAG loops are the retry-storm
  risk), G12 (class-fix audits — e.g. chunker off-by-one, citation-drop
  classes), G13 (no-stub: every claimed retriever/metric must be wired to
  real execution), G14 (rejection evidence: failed chunking/retrieval
  strategies recorded with resurrection predicates).
- **G7 analog:** G7 REVIEW is Rust-centric; the type-specific analog is
  split-context adversarial review on judge/threshold changes (tiered eval
  CI is the type's load-bearing gate), recorded as a review parameter, not
  a claim that canonical G7 applies as-is.
- **Needs type-specific parameters:** G2 (paired ops → paired
  *retrieval paths*: when adding a new chunker/retriever, registry pair list
  names the unchanged baselines); G3 (ownership pre-classification →
  chunkers, evaluators, and cassettes each get ownership rows); G4
  (contract harness → chunker in/out contracts: byte-identical snapshots +
  metric API stability); G5 (host boundaries → LLM-judge backend
  inventory: which backends may be called, judge-model pin per metric).
- **Not applicable as written (advisory/none):** G6 (unsafe counting —
  Rust-specific; Python/TS analog is "unpinned-network-call counting" at best,
  advisory), G10 (Miri — Rust-only, no equivalent for this type),
  G11 (layout — Rust project layout asserts; adapt to
  `tests/`-mirrors-`src/` check instead).

**Proposed new type-specific gates:**

- **GATE-RAG-1 — Judge-freeze.** Every LLM-judged metric names its judge
  (backend:model + revision pin) in the truth pack; swapping the judge without
  re-banking the nondeterminism floor fails the gate. Acceptance: metric rows in
  the ledger all resolve to a pinned judge id. [Inference, labeled]: the "judge
  pin ⇒ score reproducibility" link is an analyst inference from fixture
  design, not a measured result — no study in evidence varies the judge and
  re-banks; G14 rejects any "judge-freeze guarantees reproducibility" claim
  until a two-judge A/B receipt exists.
- **GATE-RAG-2 — Citation coverage.** Every generated-answer eval fixture asserts
  that cited chunks exist in the retrieved set; a faithfulness score may not
  improve while citation coverage regresses. Acceptance: `evals/` harness
  reports both numbers and the comparison test fails on coverage regression.
  Honest gap: citation coverage is necessary for faithfulness claims, not
  sufficient — a system can cite the right chunks and still hallucinate; the
  gate bounds the check, not the property.
- **GATE-RAG-3 — Cassette hermeticity.** The unit + integration CI tiers make zero
  live LLM calls (egress allowlist: loopback only); a cassette miss is a test
  failure, never a live call. Acceptance: CI network audit log shows no
  non-loopback calls in gated tiers.
- **GATE-RAG-4 — Threshold provenance.** Any in-tree acceptance threshold (e.g.
  > 0.80) must carry corpus id + metric version + judge pin + measured A/A
  spread at the threshold commit; a bare number in a README fails the gate.
  Acceptance: thresholds resolve to `ACCEPTANCE_SURFACE.json` rows.
  [Inference, labeled]: a threshold with full provenance is still a design
  choice, not a discovered optimum — the provenance records *what was chosen*,
  not *what is best*.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Quality claims rest on the frozen corpus + pinned oracle JSON; every claim names corpus/metric/backend/threshold (REQ-4, REQ-6) |
| GATE-009 (Retrieval relevance/recall) | Load-bearing | Applies to this slug; frozen offline retrieval check with pinned thresholds + importable eval metrics (REQ-1, REQ-4) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; VCR cassettes, zero live LLM calls in gated tiers (REQ-2, GATE-RAG-3) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; unit/replay/offline/bench/e2e tiers (REQ-3) |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; judge backend, corpus revisions, retrieval stack pinned by commit |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; judge A/A floors committed in NONDETERMINISM_FLOOR.md |

## Evidence tiers

Mapped to localbench evidence-tier conventions (receipts + banked goldens) and
the model-guides vocabulary ([Verified]/[Maintainer claim]/[External]/
[Inference]), with canonical pickup tiers:

- **T0 [Verified]:** Microsoft's CI-gated eval suite
  (`Azure-Samples/azure-search-openai-demo` `evals-test.yaml` + ground truth)
  and GraphRAG's tiered CI — admissible as process evidence without further
  verification; metric numbers from them still need receipts to be quoted.
- **T0 [Verified]:** in-tree metric implementations with unit tests and
  benchmark harnesses (llamaindex `core/evaluation/`, haystack evaluators,
  ragas metric modules) — admissible for process claims; quality numbers are
  [Verified] only with banked A/A receipts at the pinned backend.
- **T2 [Maintainer claim]:** README-stated thresholds (LightRAG's > 0.80) and
  maintainer metric descriptions — admissible as "the project claims X",
  never as "X is true"; GATE-RAG-4 applies.
- **T3 [Inference]:** published ablation results, "SOTA on BEIR" claims —
  TARGETED until a receipted run exists; CLAIM-13's withdrawal is the standing
  example.
- LLM-judged numbers are never [Verified] without a pinned judge backend +
  measured nondeterminism floor (UNK-2 makes most current ones T2 at best).

## Localbench bench shape

- **Spec format:** `backend:model` where backend is the LLM serving path
  (e.g. `ollama:qwen3.6:35b-mlx`) AND the retrieval stack is named as a
  compound: `rag:<chunker>+<index>+<judge>` (e.g.
  `rag:recursive_char+faiss+judge:ollama:qwen3.6:35b-mlx`). The harness
  starts/stops backends itself; the retrieval stack is pinned by git commit.
- **Tiers:** `unit` (metric modules, chunker snapshots — no LLM), `replay`
  (cassette-backed retrieval+judge runs), `offline` (frozen corpus + oracle,
  the LightRAG-shaped check), `bench` (BEIR/HotpotQA subsets, local only),
  `e2e` (full pipeline on the sample dataset). Goldens bind PER TIER; swapping
  the judge re-banks only `replay`/`offline`/`bench`/`e2e`, not `unit`.
- **Golden layout:** `goldens/<host_id>/<rag-stack>/<tier>.json` with
  `conformance` (MUST: citation coverage non-regression, cassette
  hermeticity, judge pin match; SHOULD: latency p50) + `metrics` (faithfulness,
  context precision/recall, answer relevance — each with `value`, `spread`
  from A/A, `tol`, `tol_source`, `better` direction).
- **Tolerance rule:** `tol = max(3 × A/A relative spread, floor)`; floor for
  LLM-judged metrics is the measured judge A/A spread, never zero (an LLM
  judge with 0.02 A/A spread cannot certify a 0.01 improvement).
- **A/B/A ordering:** same-invocation A, B, A for chunker/retriever swaps on
  the frozen corpus; banked under the stack name. A/B across different judges
  is forbidden (numerics-profile rule: comparing numbers across different
  judge programs is the benchmark lie by construction).
- **Machine-state/contention receipts:** per localbench measurement law —
  preflight refuses a busy machine (> 25% GPU/CPU, naming processes);
  CONTENDED marking; one unit under test at a time; loopback-only endpoints
  (GATE-RAG-3); park/unpark interfering residents.
- **Banking ceremony:** goldens written ONLY by `aa <spec> --write-golden`
  (two runs → receipt + golden, refuses unsound A/A pairs) + `git diff
  goldens/` review in the same commit. Golden-regeneration-until-green is the
  named forbidden pattern (this is where a team would launder a weak chunker).
- **Receipts:** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
  (kinds: aa, ab, eval, cassette-audit) + dated `.md` notes;
  `docs/evidence/incumbents.md` pins judge backend, eval package versions,
  corpus revisions, OS.
- **Claims wiring:** `registries/claims.tsv` — every public quality sentence
  machine-checked against its receipt on every commit; `check_claims.py`
  observes (fails open at S2, gates by S4).

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. `scripts/gates/check-judge-freeze.sh` (GATE-RAG-1) + `check-citation-coverage.sh`
   (GATE-RAG-2) + `check-cassette-hermeticity.sh` (GATE-RAG-3) + `check-threshold-provenance.sh`
   (GATE-RAG-4) — the four new gates as runnable scripts.
2. `templates/truth-pack/` extended: `eval/` subdirectory shape with
   `ground_truth.jsonl`, `evaluate_config.json`, `sample_retrieval_oracle.json`,
   and an `ACCEPTANCE_SURFACE.json` schema that includes judge-backend pins.
3. `kit-evals.yml` — eval-tier manifest declaring which CI tiers may call live
   LLMs vs cassettes (GATE-RAG-3's machine-readable policy).
4. `templates/chunker-registry/` — registry + plugin scaffold with snapshot-test
   harness (copies the LightRAG `lightrag/chunker/` shape as the reference
   layout, docs note it as the copied pattern).
5. Adapted G11 → `check-test-mirror.sh`: asserts `tests/` mirrors
   `src/` for evaluation/retriever/chunker modules (the type's layout gate).
6. `docs/evidence/NONDETERMINISM_FLOOR.md` template with a per-metric judge-spread
   table (LLM-judged metrics cannot use the default numeric floor).
7. `paired-ops.tsv` seed rows for retrieval-path pairing (G2's
   type-specific parameters): chunker swaps, retriever swaps, judge swaps —
   each naming unchanged baselines.

Load-bearing for this type: G1, G7 (as the G7 analog below — canonical G7
REVIEW does not apply as-is to this Python-centric type), GATE-RAG-1..4.
Advisory: G6, G10.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Star snapshots 2026-09-23 (all repos verified via GitHub API + contents API;
per-repo metadata, not memory):

- `run-llama/llama_index` — 52,299 stars — flagship document-processing/RAG
  framework; ships retrieval and generation evaluators in-tree
  (`llama-index-core/llama_index/core/evaluation/`).
- `langchain-ai/langchain` — 146,931 stars — retrieval/RAG primitives are the
  de-facto ecosystem standard; CI separates unit/integration and records LLM
  calls via VCR cassettes (`.github/workflows/_test_vcr.yml`).
- `HKUDS/LightRAG` — 39,833 stars — graph-RAG; ships `lightrag/evaluation/`
  with a RAGAS-based harness and an offline retrieval check with pinned > 0.80
  thresholds.
- `microsoft/graphrag` — 36,082 stars — modular graph RAG monorepo
  (`graphrag-*` packages) with tiered CI (unit/integration/notebook/smoke).
- `deepset-ai/haystack` — 26,584 stars — evaluators as first-class pipeline
  components (`haystack/components/evaluators/`); docs snippets executed in CI;
  fuzz corpus at `test/fuzz/`.
- `confident-ai/deepeval` — 18,417 stars — LLM eval framework with RAG metrics
  (`contextual_recall`, `contextual_precision`, `contextual_relevancy`,
  `faithfulness`, `answer_relevancy`) plus a `ragas.py` bridge.
- `vibrantlabsai/ragas` — 15,831 stars — canonical RAG eval vocabulary
  (`src/ragas/metrics/`); renamed from `explodinggradients/ragas`.
- `Azure-Samples/azure-search-openai-demo` — 7,763 stars — reference RAG app
  gating merges on a ground-truth eval suite (`evals-test.yaml`,
  `tests/test_eval_compare.py`).

**Honest caveats (carried over verbatim in substance):** ragas reads
maintenance-mode (last push 2026-02-24) — canonical vocabulary, not an active
trend driver. No published chunk-size ablation experiment was verified; only the
ablation *machinery* (registry + offline harness) is confirmed.
File-level claims are by path/name, not source review (raw file reads failed
intermittently). Stars establish visibility, not adoption; the adoption signal
is Microsoft's reference app gating merges on evals plus same-day pushes from
GraphRAG/LlamaIndex/LangChain. `cohere-ai/cohere-ai` returned Not Found and
was dropped.

## Unknowns (UNK-*)

- **UNK-1.** BEIR/HotpotQA dataset revision pinning — no evidence repo (at S2 scope)
  pins the dataset revision its harness scores against, so a "BEIR score" without a
  dataset-revision pin is unverifiable across time; resolve a hash-pin convention
  before S5 (affects G1 scope).
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Hash-pin convention resolved (normative, from the playbook truth-pack spec): dataset revisions pinned by content hash in MANIFEST.sha256 (sha256sum format), dataset version recorded in PIN_RECORD.md and in every run manifest, third-party attribution files vendored in-tree. This also settles the 'affects G1 scope' note: the dataset revision is a declared oracle file under G1 ORACLE.
- **UNK-2.** LLM-judge backend identity behind LightRAG's > 0.80 thresholds
  (and any other in-tree threshold) — unknown; no evidence repo was found to freeze
  its LLM-judge backend (model id + weights revision) for its published thresholds.
  GATE-RAG-1/R4 cannot be fully specified until a judge-pin convention exists.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Judge-pin convention resolved: adopt GATE-RAG-1's existing 'backend:model + revision pin' convention (companion :176) as the answer; GATE-RAG-1/R4 are specifiable now. LightRAG's actual judge identity remains unknown and is handled by the plan's existing machinery — its >0.80 thresholds stay T2 [Maintainer claim] per GATE-RAG-4 (a bare README number fails the gate until corpus id + metric version + judge pin + A/A spread exist). No companion text change needed beyond this disposition.
- **UNK-3.** Provenance of azure-search-openai-demo's checked-in ground truth —
  generation model and prompt for `generate_ground_truth.py` are unverified (path
  claim only), so provenance beyond "checked in" is unknown; needed to rate the
  suite above T2 [Maintainer claim].
  **Disposition: TARGETED.**
- **UNK-4.** Whether cassette-based CI covers the *judge* calls or only the
  pipeline calls in langchain's `_test_vcr.yml` — determines whether
  GATE-RAG-3's unit/integration split is satisfiable from the copied pattern.
  **Disposition: TARGETED.**
- **UNK-5.** Ragas's maintenance trajectory — if the canonical vocabulary repo
  stays soft, the type needs a named successor oracle or a vendored pin; do not
  build the truth pack on an unmaintained metric implementation without a fork
  plan.
  **Disposition: TARGETED.**
