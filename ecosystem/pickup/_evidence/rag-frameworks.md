# RAG frameworks - evidence

All repos below verified 2026-09-23 via `https://api.github.com/repos/<owner>/<repo>` plus tree listings from the GitHub contents API. Star counts and last-push dates are per-repo API metadata, not memory.

## Trend (one line per repo: owner/repo | stars | last push | why it evidences the trend)

- `run-llama/llama_index` | 52,299 | 2026-09-23 | the flagship document-processing/RAG framework; a `llama-index-core/llama_index/core/evaluation/` module ships retrieval and generation evaluators in-tree
- `langchain-ai/langchain` | 146,931 | 2026-09-23 | the agent-engineering platform whose retrieval/RAG primitives are the de-facto ecosystem standard; CI separates unit/integration and records LLM calls via VCR cassettes (`.github/workflows/_test_vcr.yml`)
- `HKUDS/LightRAG` | 39,833 | 2026-09-23 | graph-RAG framework actively maintained; ships `lightrag/evaluation/` with a RAGAS-based eval harness and an offline retrieval check
- `microsoft/graphrag` | 36,082 | 2026-09-22 | Microsoft's modular graph-based RAG system; monorepo split into `graphrag-*` packages with tiered CI (unit / integration / notebook / smoke)
- `deepset-ai/haystack` | 26,584 | 2026-09-23 | production-oriented pipeline framework; evaluators (`haystack/components/evaluators/`) ship as first-class pipeline components
- `confident-ai/deepeval` | 18,417 | 2026-09-23 | the LLM evaluation framework; `deepeval/metrics/` includes RAG-specific metrics (`contextual_recall`, `contextual_precision`, `contextual_relevancy`, `faithfulness`, `answer_relevancy`) plus a `ragas.py` bridge
- `vibrantlabsai/ragas` | 15,831 | 2026-02-24 | the canonical RAG-specific eval framework (renamed from `explodinggradients/ragas`; verified via API redirect `637924634`); metric implementations in `src/ragas/metrics/`
- `Azure-Samples/azure-search-openai-demo` | 7,763 | 2026-09-19 | Microsoft's reference RAG sample; a dedicated `evals-test.yaml` workflow runs a full ground-truth eval suite in CI

## Process practices worth copying (practice | repos exhibiting it | file pointers)

- **Ship eval metrics in-tree as importable modules** — llamaindex: `llama-index-core/llama_index/core/evaluation/{faithfulness.py,context_relevancy.py,answer_relevancy.py,correctness.py}` + `retrieval/{metrics.py,evaluator.py}`; haystack: `haystack/components/evaluators/{document_recall.py,document_mrr.py,document_ndcg.py,faithfulness.py,llm_evaluator.py}`; ragas: `src/ragas/metrics/{_faithfulness.py,_context_precision.py,_context_recall.py,_answer_relevance.py,_factual_correctness.py}`; deepeval: `deepeval/metrics/{faithfulness,contextual_recall,contextual_precision,contextual_relevancy,answer_relevancy}/`
- **Standard benchmark harnesses, not ad-hoc scripts** — llamaindex: `llama-index-core/llama_index/core/evaluation/benchmarks/{beir.py,hotpotqa.py}` (BEIR retrieval benchmark, HotpotQA QA benchmark)
- **Offline retrieval check with a frozen oracle + sample dataset** — LightRAG: `lightrag/evaluation/{offline_retrieval_check.py,eval_rag_quality.py,sample_dataset.json,sample_retrieval_oracle.json}`; the same dir's `README_EVALUASTION_RAGAS.md` pins acceptance thresholds (faithfulness/answer-relevance/context-recall/context-precision each > 0.80) — verified via contents-API read of that README
- **Pluggable chunkers behind a registry (makes chunking ablations trivial)** — LightRAG: `lightrag/chunker/{paragraph_semantic.py,semantic_vector.py,recursive_character.py,token_size.py,registry.py,plugins.py}`
- **Nightly/CI-gated evals with checked-in ground truth** — azure-search-openai-demo: workflow `evals-test.yaml`; harness `evals/{run_evaluate.py,generate_ground_truth.py,ground_truth.jsonl,evaluate_config.json,safety_evaluation.py,results_comparisons/}`; comparison regression test `tests/test_eval_compare.py`
- **Tiered CI: unit vs integration vs e2e vs slow** — graphrag: `.github/workflows/python-{unit,integration,notebook,smoke}-tests.yml`; haystack: `.github/workflows/{tests,e2e,slow}.yml`; llamaindex: `.github/workflows/{unit_test,llama_dev_tests,coverage_check}.yml`; deepeval: `test_{core,integrations,metrics,templates}.yml`
- **Record/replay LLM calls (VCR cassettes) so tests don't hit live models** — langchain: `.github/workflows/_test_vcr.yml` (companion `_test.yml`); keeps CI hermetic and cost-bounded
- **Docs-code coherence tests** — haystack: `.github/workflows/docs-website-test-docs-snippets.yml` (executes doc code snippets); ragas: `tests/docs/` layout
- **Fuzz corpus for parsers** — haystack: `test/fuzz/`
- **Release-note-per-change convention** — haystack: `releasenotes/notes/` (reno-style fragments); graphrag: `python-checks.yml` + `semver.yml` + `.semversioner`
- **Monorepo packaging so evals/chunking ship independently** — microsoft/graphrag: `packages/{graphrag,graphrag-chunking,graphrag-llm,graphrag-input,graphrag-vectors,graphrag-storage,graphrag-cache,graphrag-common}/`
- **Test tree mirrors source tree** — llamaindex: `llama-index-core/tests/{evaluation,retrievers,node_parser,query_engine,...}`; haystack: `test/{components,core,document_stores,evaluation,...}`; ragas: `tests/{unit,e2e,benchmarks}/`
- **Chunker/text-splitter unit tests with snapshots** — azure-search-openai-demo: `tests/{test_prepdocslib_textsplitter.py,test_sentencetextsplitter.py}` + `tests/snapshots/`

## Notes / caveats (be honest about thin evidence)

- **ragas activity is soft.** Last push 2026-02-24 per API metadata; stars are high (15,831) but it reads maintenance-mode. It remains the canonical RAG eval vocabulary (LightRAG and deepeval both reference it), but don't cite it as an "active trend" driver.
- **Chunking ablations specifically.** I verified that LightRAG ships a chunker registry with multiple strategies and an offline retrieval harness — the *machinery* for ablations — but did not verify an actual published chunk-size ablation experiment. azure-search-openai-demo's `test_eval_compare.py` is the closest verified retrieval-strategy comparison test.
- **Evidence granularity.** Claims rest on verified GitHub API metadata (stars, pushed_at) and verified directory listings via the contents API; I inspected the LightRAG eval README's content directly, but other file-level claims are by path/name, not source-code review (raw.githubusercontent.com reads failed intermittently).
- **Stars ≠ usage.** Star counts establish category visibility, not adoption. Adoption signal: Microsoft's reference app gating merges on evals (`evals-test.yaml`) and GraphRAG/LlamaIndex/LangChain all pushed code the same day as this check.
- **Dropped.** `cohere-ai/cohere-ai` returned `Not Found` on the API — dropped, not cited. The eval frameworks RAGAS and DeepEval are listed above as repos themselves (per the task), not merged into framework rows.
