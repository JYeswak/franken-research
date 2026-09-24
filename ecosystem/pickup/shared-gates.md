# Shared Gate Registry — Project Pickup

*Registry version: 1.2 (round-2 integration, 2026-09-23).*

Cross-cutting gates for the 21 pickup types. Each companion `pickup-<slug>.md`
declares which of these are **load-bearing** for its type and which are
**advisory**. Gate IDs are stable (`GATE-001`…); the set changes only by
constitution amendment, and a new gate MUST have two independent evidence
files behind it. The RFC 2119 normative-language rule (playbook, Normative
language) covers this file: MUST / MUST NOT / SHOULD / SHOULD NOT / MAY have
their RFC 2119 meanings here.

**Amendment procedure.** Changes to this registry follow one procedure:
(1) proposal names the gate (new or amended) and cites the playbook's L1
amendment rule; (2) a new gate MUST be grounded in two independent
`_evidence/*.md` files demonstrating the practice — or carry an honest
`[Inference]` label marking it a designed gap; (3) the amendment states
load-bearing vs advisory per affected type; (4) acceptance criteria MUST be
writable as PASS/FAIL/N-A with named evidence artifacts; (5) the registry
version above increments and the change is recorded in
`docs/planning/ROUND_LOG.md`. Companions MUST NOT amend shared gates locally;
a needed change is proposed here, not forked.

**Gate retirement.** The set does not only grow: a superseded gate is
retired by amendment naming the superseding gate. Retired gate IDs stay
stable and are marked `RETIRED` with a removal-of-force date (after which a
pickup MUST NOT cite them as load-bearing); retired gates keep their
acceptance text for audit history. Gate acceptance criteria are versioned:
every gate header carries a criteria version (`GATE-001 v1.0`, `v1.1`, …),
starting at v1.0; the version bumps whenever acceptance criteria or
evidence-required text changes substantively (editorial rewording does not
bump). The registry version and each gate's criteria version both appear in
the gate's header line. Amendment and retirement authority: the parent
orchestrator (per the playbook's Roles + review process section).

Every repo, path, and star-count-adjacent fact below comes from the
`_evidence/*.md` packs (verified live via the GitHub API on 2026-09-23).
`[Inference]` marks a requirement that exceeds demonstrated practice.

How to read a gate: **purpose** (what it guards), **applies to** (type slugs;
"universal" = all 21), **acceptance criteria** (what must be true for PASS),
**evidence required** (the concrete artifacts + the evidence-file practices
grounding them), **anti-patterns it blocks**.

---

### GATE-001 v1.0 — Inference-serving benchmark harness

- **Purpose:** every serving implementation ships its benchmark as part of the
  repo, and the benchmark itself is tested code — not an ad-hoc script run
  once for a README number.
- **Applies to:** `inference-engines`, `embedding-serving`;
  advisory for `quantization` (kernel-level benches).
- **Acceptance criteria:** (1) a `benchmarks/`-class directory with
  throughput/latency/serving scripts and a shared dataset or config registry;
  (2) the harness is unit-tested like library code; (3) a dedicated
  perf-regression CI track exists, separate from correctness CI;
  (4) benchmarks bind per host/generation (see playbook Bench spec §5) —
  cross-host comparisons are not banked.
- **Evidence required:** a harness modeled on `vllm-project/vllm`'s
  `benchmarks/benchmark_serving.py` + `benchmark_throughput.py` +
  `benchmark_latency.py`; benchmark unit tests like
  `vllm-project/vllm/tests/benchmarks/test_throughput_cli.py`;
  a perf-regression track like
  `vllm-project/vllm/.buildkite/performance-benchmarks/` and
  `sgl-project/sglang/.github/workflows/pr-benchmark-rust.yml`;
  in-library harness packaging like
  `ggml-org/llama.cpp/tools/llama-bench/`;
  hardware-pinned nightly integration like
  `huggingface/text-embeddings-inference/.github/workflows/integration-test.yaml`
  with `load_tests/`.
- **Anti-patterns it blocks:** benchmark-as-marketing (numbers with no
  re-runnable harness); perf assertions inside correctness CI; the disabled
  benchmark CI pattern (`llama.cpp`'s `bench.yml.disabled` — measuring
  in-repo without an automated gate).

### GATE-002 v1.0 — Model truth-pack / oracle integrity

- **Purpose:** "parity against what" is pinned, hashed, and re-verifiable —
  no unverified oracle ever backs a claim.
- **Applies to:** `inference-engines`, `quantization`,
  `embedding-serving`, `fine-tuning`, `rl-envs`
  (env/dataset pins); other types only where a specific claim rests on a
  pinned oracle — weights, datasets, or a reference implementation named in
  `PIN_RECORD.md`. The gate does not apply to unpinned references: a
  reference implementation that is not pinned as an oracle is documentation,
  not evidence.
- **Acceptance criteria:** (1) `docs/truth-pack/` ships the normative layout
  (PIN_RECORD.md, MANIFEST.sha256, ACCEPTANCE_SURFACE.json,
  NONDETERMINISM_FLOOR.md, fetch-truth-pack.sh — playbook Truth-pack spec);
  (2) every binary participating in a measurement has its SHA-256 recorded
  at invocation time — no un-recorded executable is admissible;
  (3) `fetch-truth-pack.sh --verify` passes in CI;
  (4) any skew between pins (e.g. code pin newer than weights pin) is stated
  in PIN_RECORD.md, not hidden.
- **Evidence required:** tts-pattern truth pack (PIN_RECORD.md with two
  upstream pins + paper, dated; MANIFEST.sha256; fetch/verify script —
  `franken_tts` packet docs/truth-pack/); whisper's invocation-time SHA-256
  recording of the incumbent binary per campaign arm (the 2026-08-11 Metal
  entry, which lacked it, is the standing example of a NO ADMISSIBLE
  PERFORMANCE VERDICT); ocr's per-source SHA-256s and pinned oracle stack
  (`torch==2.10.0`, `transformers==4.57.1`); nlp's `SUITE.lock`
  plan-audited-vs-selected revs with reason strings.
- **Anti-patterns it blocks:** floating weights under pinned claims
  (the embedding-serving evidence pack documents that *none* of the serving
  repos pin HF revisions in-repo — this gate requires the pickup to do
  better, not to copy); unpinned bootstrap steps (the `curl | bash`
  least-verified-step problem); oracle substitution without a waiver.

### GATE-003 v1.0 — Quantization quality-loss budget

- **Purpose:** a quantized artifact may not claim quality by vibes or by
  kernel speed alone; quality loss is measured against a frozen reference
  with pre-committed budgets.
- **Applies to:** `quantization`; advisory for
  `inference-engines`, `embedding-serving` (they consume quantized
  kernels).
- **Acceptance criteria:** (1) perplexity tooling ships in-repo and runs
  against a pinned corpus (WikiText2/PTB/C4-class); (2) per-kernel
  golden-output regression tests assert max-diff/mean-relative-diff against a
  reference tensor with a stated tolerance; (3) downstream zero-shot task
  evals (MMLU/ARC/HellaSwag-class) run via a pinned harness adapter;
  (4) precision baselines are recorded per backend so regressions are
  attributable.
- **Evidence required:** `ggml-org/llama.cpp/tools/perplexity/` (repo-local
  perplexity tool); `AutoGPTQ/AutoGPTQ/tests/test_q4.py`
  (`CUDA_OLD_REFERENCE` tensors, per-backend-kernel diff asserts);
  `EleutherAI/lm-evaluation-harness` `lm_eval/tasks/` as the downstream-task
  substrate; `sgl-project/sglang/python/sglang/test/precision_baseline_store.py`
  (recorded precision baselines).
- **Anti-patterns it blocks:** reporting kernel speedup without a quality
  delta; comparing numbers across different numerical programs
  ([Inference] — the nlp packet's numerics-profile doctrine: a bf16 program
  and a quantized program are different programs, so "matched" comparisons
  get preregistered budgets, never inherited exactness); golden tests that
  assert "runs without crashing".

### GATE-004 v1.0 — Structured-output grammar conformance + fuzz

- **Purpose:** constraint semantics are identical across every engine adapter,
  and pathological inputs cannot DoS the serving loop.
- **Applies to:** `structured-output`; advisory for
  `agent-frameworks` (tool-call schemas), `mcp` (tool schemas).
- **Acceptance criteria:** (1) one conformance suite runs the same constraint
  semantics against every engine adapter; (2) schema→grammar conversion has
  golden-file snapshot tests; (3) differential validation against an
  independent ground-truth validator (not the engine itself);
  (4) constraint-compilation has timeout / worst-case safety tests and cache
  correctness tests; (5) [Inference] a generative differential fuzzer
  (random grammar → compare masks against a reference parser) runs in the
  slow tier.
- **Evidence required:** `dottxt-ai/outlines/tests/backends/test_xgrammar.py`
  + `test_llguidance.py` + `test_outlines_core.py` (same surface, every
  backend); `ggml-org/llama.cpp/tests/test-json-schema-to-grammar.cpp`
  (byte-exact grammar goldens); `mlc-ai/xgrammar/tests/python/test_grammar_matcher_json_schema.py`
  (differential validation against Pydantic); `guidance-ai/guidance/tests/unit/test_grammar.py`
  (mock-model grammar tests decoupled from real inference);
  `vllm-project/vllm/tests/v1/structured_output/test_regex_compilation_timeout.py`
  (pathological-regex guard); outlines/vLLM cache-correctness tests
  (`tests/test_cache.py`, `test_outlines_cache.py`).
- **Anti-patterns it blocks:** conformance tested on one engine only; heavy
  conformance runs silently excluded from CI (the xgrammar
  `test_pressure.py` pattern is explicit `skipif` in CI — visible, not
  silent); [Inference] shipping without a differential fuzzer — the evidence
  pack states no surveyed repo runs one, so this gate *requires* a
  practice the ecosystem only aspires to.

### GATE-005 v1.0 — Agent deterministic replay / trajectory

- **Purpose:** agent behavior is testable without spending model calls, and
  trajectory drift fails loudly instead of passing silently.
- **Applies to:** `agent-frameworks`, `workflow-orchestrators`;
  advisory for `voice-agents`, `browser-use`,
  `computer-use` (recorded-session replay as debugging evidence).
- **Acceptance criteria:** (1) scripted/deterministic LLM doubles ship as a
  first-class, importable test API — one fake per trajectory scenario;
  (2) the scripted-model contract fails on unexpected calls AND on
  unconsumed steps; (3) recorded event histories replay deterministically
  (replay tests against stored histories, including a deliberately
  nondeterministic fixture); (4) agent-workflow replay covers the framework's
  own agent integrations where they exist.
- **Evidence required:** `openai/openai-agents-python`
  `src/agents/testing/__init__.py` (`ScriptedModel`, `UnconsumedModelSteps`,
  `UnexpectedModelCall`, `ScriptedSandboxSession`); `huggingface/smolagents`
  `tests/test_agents.py` (~15 scenario-specific `Fake*Model` subclasses);
  `langchain-ai/langgraph` `libs/langgraph/tests/fake_chat.py` (scripted
  sequence with pointer index and explicit wrap-around);
  `temporalio/sdk-python` `temporalio/worker/_replayer.py` with
  `tests/worker/test_replayer_complete_history.json` and the
  nondeterministic-history fixture; `temporalio/sdk-python`
  `tests/contrib/openai_agents/test_openai_replay.py` (agent-workflow replay).
- **Anti-patterns it blocks:** live-LLM unit tests; one generic fake model
  hiding trajectory changes; snapshot-free refactors of agent loops;
  nondeterminism handled by retry instead of by replay.

### GATE-006 v1.0 — Protocol conformance + interop matrix

- **Purpose:** protocol implementations are tested against a shared,
  versioned conformance bar — and "interop" means cross-implementation, not
  self-interop.
- **Applies to:** `mcp`, `multi-agent-protocols`.
- **Acceptance criteria:** (1) the official (or a dedicated, versioned)
  conformance harness runs in CI, separate from unit tests, pinned by
  version; (2) failing scenarios are named in expected-failures baselines
  per spec revision — never silent skips; (3) every shipped wire/spec
  revision is tested, not just latest; (4) cross-implementation interop
  exists as a named CI workflow (language-pair or implementation-pair
  matrix); (5) tool/schema surface diffs on PRs are reviewable artifacts.
- **Evidence required:** `modelcontextprotocol/typescript-sdk`
  `.github/workflows/conformance.yml` (official harness in CI);
  `modelcontextprotocol/python-sdk`
  `.github/actions/conformance/expected-failures.<rev>.yml` (named baselines
  per spec revision); `github/github-mcp-server`
  `.github/workflows/mcp-diff.yml` (tool-surface diff gate) with
  `pkg/toolvalidation`; `a2aproject/a2a-tck` standalone TCK wired via
  `a2aproject/a2a-go` `e2e/tck/run_tck.sh`; `a2aproject/a2a-js`
  `test/proto_json_conformance.spec.ts` (shared wire corpus, `it.fails`
  markers that must flip when fixed); `agent-network-protocol/anp`
  `.github/workflows/rust-python-interop.yml` (named interop matrix);
  `modelcontextprotocol/typescript-sdk`
  `.github/workflows/update-spec-types.yml` (spec-versioned type sync).
- **Anti-patterns it blocks:** self-interop claimed as interop (the A2A
  evidence pack is explicit: "the 'interop' tested is mostly self-interop"
  — this gate requires an independent second implementation or labels the
  claim self-interop); conformance harness newer than the spec it tests
  without a pin; drift between wire spec and generated types.

### GATE-007 v1.0 — Sandbox escape + resource accounting

- **Purpose:** isolation is tested adversarially and resource limits are
  enforced by test — the sandbox's security claims are not delegated
  entirely to the substrate's marketing.
- **Applies to:** `sandbox-exec`; advisory for
  `agent-frameworks` and `eval-harnesses` (sandboxed tool execution,
  e.g. inspect_ai's Docker/k8s tool sandbox).
- **Acceptance criteria:** (1) confinement tests assert uid/gid, exact
  permission bits, device nodes, and rlimits inside the jail;
  (2) seccomp/BPF filter tests verify the forbidden syscall set is actually
  blocked, including user-supplied filters; the forbidden set is derived
  from the charter threat model, pinned as a truth-pack fixture with a
  review date, and diff-reviewed on any substrate generation change; (3) known-vulnerability
  regression (Spectre/Meltdown-class checker run inside the guest, host vs
  guest mitigation state diffed); (4) resource-limit enforcement tests
  (CPU/mem/IO throttling, execution timeout, timeout+kill lifecycle);
  (5) [Inference] a dedicated adversarial escape-attempt suite exists —
  see below.
- **Escape-vector list (acceptance 5, elaborated):** the suite runs against a
  maintained, version-pinned escape-vector list (each vector: name, target
  boundary, expected containment behavior, provenance — the advisory, CVE,
  or paper it came from). The forbidden/vector set's provenance is
  documented per vector, not as a blanket claim. Red-then-green: each vector
  is first demonstrated to succeed against a deliberately weakened boundary
  (red) before it is asserted blocked (green) — an un-demonstrated vector
  is not a passing control. Escape vectors the suite does not attempt
  become typed `UNK-*` records (never silent gaps). Enforcement tests pin
  the list version in CI; a list-version bump re-runs the full suite.
- **Cost accounting:** the adversarial suite's GPU/runner hours and any lab
  cost are recorded per run (playbook Bench slot 13): estimated vs actual
  runner/GPU hours, budget, funding owner, and the budget-exceeded
  disposition (what stops, who decides). Heavy tiers declare a per-run
  resource budget recorded in the receipt; a run exceeding its budget is
  flagged like CONTENDED and cannot bank a golden. A suite with no budget
  owner does not run.
- **Evidence required:** `firecracker-microvm/firecracker`
  `tests/integration_tests/security/test_jail.py` (REG_PERMS/DIR_STATS,
  RESOURCE_LIMITS), `test_seccomp.py` / `test_custom_seccomp.py`,
  `test_vulnerabilities.py` (third-party checker, host-vs-guest diff),
  `tests/integration_tests/performance/test_drive_rate_limiter.py` and
  `test_rate_limiter.py`; `google/gvisor` `test/secbench/` (cost of the
  isolation mechanism itself, benchmarked); `e2b-dev/E2B`
  `packages/code-interpreter-python/tests/test_execute_timeout.py` and
  `packages/js-sdk/tests/sandbox/timeout.test.ts` / `kill.test.ts`.
- **Anti-patterns it blocks:** SDK/API-layer-only testing of isolation
  (the sandbox-exec pack documents that no agent-facing SDK repo publishes
  escape-attempt tests — this gate refuses to accept that as sufficient);
  [Inference] no true sandbox-escape pentest was found in any surveyed
  repo's tree, so the adversarial escape suite is a *designed requirement*
  the ecosystem has not demonstrated — label its absence as a gap, not as
  conformance.

### GATE-008 v1.0 — Browser/GUI task-state evaluator

- **Purpose:** agents are scored on the state of the world they changed, not
  on the chat they produced — and the harness itself is pinned like any
  other oracle.
- **Applies to:** `browser-use`, `computer-use`.
- **Acceptance criteria:** (1) evaluation is state-based: per-task configs
  declare instruction + setup + evaluator, with getters/metrics split;
  (2) infeasible tasks have an explicit FAIL action so refusal cannot be
  reward-hacked; (3) benchmark datasets are vendored with provenance
  (attribution files kept); (4) the benchmark commit/revision is recorded in
  every run manifest — harness drift is a measured variable;
  (5) task suites auto-discover from a tasks directory and runs are logged
  for diffing.
- **Evidence required:** `xlang-ai/OSWorld` `desktop_env/evaluators/`
  (getters + metrics split) and its infeasible-task FAIL-action rule;
  `xlang-ai/OSWorld` `evaluation_examples/test_all.json` (per-task JSON
  configs); `browserbase/stagehand` `packages/evals/` (auto-discovered
  suites, dataset-backed, Braintrust/local run logging, `--preview` flag);
  `web-arena-x/webarena` `evaluation_harness/evaluators.py`;
  `Skyvern-AI/skyvern` `evaluation/datasets/` with
  `ODYSSEYS_ATTRIBUTION.md` (vendored datasets + provenance);
  `browser-use/browser-use` `tests/agent_tasks/*.yaml` (declarative tasks
  with judge criteria) and `tests/ci/evaluate_tasks.py` (isolated browser
  session per task); `trycua/cua` `libs/cua-bench/` (bench as a
  first-class CI-tested package); the community practice of pinning the
  benchmark commit in run manifests (e.g. OSWorld-V2 `c261cb57…`).
- **Anti-patterns it blocks:** chat-scored agents (judging transcripts
  instead of world state); live-web unit tests (playwright-mcp's local
  deterministic test server is the pattern — `tests/testserver/`);
  silent harness drift (unpinned benchmark revisions moving under
  historical numbers); self-reported benchmark percentages quoted without
  discounting.

### GATE-009 v1.0 — Retrieval relevance/recall

- **Purpose:** retrieval quality is measured against frozen ground truth
  with pre-committed thresholds — not vibes, not "it felt relevant."
- **Applies to:** `rag-frameworks`, `agent-memory`,
  `vector-dbs`.
- **Acceptance criteria:** (1) an offline retrieval check runs against a
  frozen oracle + sample dataset with pinned acceptance thresholds;
  (2) eval metrics ship in-tree as importable modules (faithfulness,
  context precision/recall, answer relevancy at minimum);
  (3) a ground-truth eval suite gates merges in CI where feasible
  (checked-in ground truth + comparison regression test);
  (4) for index structures: recall-vs-QPS Pareto is characterized by
  explicit parameter sweeps, not a single cherry-picked config.
- **Evidence required:** `lightrag` `lightrag/evaluation/offline_retrieval_check.py`
  + `sample_retrieval_oracle.json` with thresholds > 0.80 per
  `README_EVALUASTION_RAGAS.md`; `run-llama/llama_index`
  `llama-index-core/llama_index/core/evaluation/` (faithfulness,
  context_relevancy, answer_relevancy, correctness) +
  `retrieval/metrics.py`; `deepset-ai/haystack`
  `haystack/components/evaluators/` (document_recall, document_mrr,
  document_ndcg, faithfulness); `vibrantlabsai/ragas` `src/ragas/metrics/`;
  `Azure-Samples/azure-search-openai-demo` `evals/evals-test.yaml` CI gate
  with `ground_truth.jsonl` and `tests/test_eval_compare.py`;
  `xiaowu0162/LongMemEval` `src/evaluation/evaluate_qa.py`
  (+ `print_retrieval_metrics.py`); `erikbern/ann-benchmarks`
  `ann_benchmarks/algorithms/qdrant/config.yml` (recall-vs-QPS parameter
  grid); `mem0ai/mem0` `evaluation/` submodule (vendor benchmark harness
  vendored with provider configs + results dir).
- **Anti-patterns it blocks:** ground-truth mutated silently (benchmark
  versions bump, never mutate — lm-eval's `metadata: version:` rule);
  single-config ANN numbers presented as Pareto claims; indie benchmark
  headlines quoted without the ensemble disclosure (the supermemory README
  pattern: the ~99% headline disclosed as an 8-variant ensemble, the
  single-pass 85.86% as the comparable number).

### GATE-010 v1.0 — Trace completeness / privacy

- **Purpose:** "we captured the trace" means the spans exist, are complete,
  render end-to-end, and carry no unmasked secrets — not that the ingest
  API returned 200.
- **Applies to:** `observability`; advisory for
  `agent-frameworks`, `eval-harnesses` (their own run logging).
- **Acceptance criteria:** (1) end-to-end trace-completeness tests verify
  ingested spans render as complete traces in the UI/query path;
  (2) span-masking/redaction has dedicated unit tests (prompt/response
  secrets masked before export); (3) OTel semantic-convention compliance is
  asserted per instrumented provider, with deterministic replay cassettes;
  (4) exporter/span-processor paths (batching, context propagation, hybrid
  models) are unit-tested as a first-class surface.
- **Secret classification and masking:** the project maintains a named
  classification for API keys, tokens, credentials, and PII carried in
  traces; masking is default-on for every classified field — any opt-out is
  recorded in an opt-out inventory with owner, reason, and expiry. CI scans
  cassettes and fixtures for unmasked classified values (a cassette
  containing a live-looking key fails the build); the scan's pattern set is
  versioned alongside the classification.
- **Evidence required:** `comet-ml/opik` `tests_end_to_end/{coverage,visual-tests}/`
  + `end2end_suites_v2.yml` (spans render as complete traces, not just
  API-200); `langfuse/langfuse-python` `tests/unit/test_mask_otel_spans.py`
  (masking), `test_otel.py`, `test_span_processor.py`;
  `traceloop/openllmetry`
  `packages/opentelemetry-instrumentation-openai/tests/traces/test_semconv_compliance.py`
  + `cassettes/` (semconv assertions per provider, deterministic replay);
  `openlit/openlit` `sdk/python/tests/test_openai_streaming_span_lifecycle.py`
  (streaming spans close correctly with token-usage attributes);
  `langchain-ai/langsmith-sdk` `python/tests/unit_tests/test_otel_exporter.py`.
- **Anti-patterns it blocks:** "OTel-compatible" asserted without a
  conformance test file (the observability pack: only OpenLLMetry has one —
  treat ingestion-interop claims as marketing until you see the test);
  PII/secrets in exported spans; completeness claimed from ingest-side
  success codes.

### GATE-011 v1.0 — Guardrail false-positive / false-negative

- **Purpose:** a guardrail is characterized on both sides — what it blocks
  AND what it lets through — with labeled corpora and a calibrated judge.
- **Applies to:** `guardrails`; advisory for `agent-frameworks`
  (tool-call gating), `eval-harnesses` (safety evals).
- **Acceptance criteria:** (1) every scanner/rail ships with a labeled
  example corpus (blocked + valid) and a timing harness;
  (2) FP/FN cases live in code as parametrized (input, expected) matrices;
  (3) attack generation and success detection are separate code paths with
  mirrored tests; (4) the judge that scores refusal has its own FP/FN
  calibration set — judge drift is measured, not assumed;
  (5) rail logic is tested against recorded fixtures, never live models in
  unit tests.
- **Evidence required:** `protectai/llm-guard` `benchmarks/run.py` +
  `benchmarks/input_examples.json` + `benchmarks/output_examples.json`
  (scanner accuracy + latency over JSON corpora);
  `protectai/llm-guard` `tests/input_scanners/`, `tests/output_scanners/`,
  `tests/test_evaluate.py` (parametrized pass/fail matrices);
  `NVIDIA/garak` `garak/garak/probes/*.py` vs `garak/garak/detectors/*.py`
  (attack generation split from success judging) with mirrored
  `garak/tests/probes/` + `garak/tests/detectors/`;
  `centerforaisafety/HarmBench` `data/behavior_datasets/` +
  `data/classifier_val_sets/` + `evaluate_completions.py` (judge
  calibration sets); `NVIDIA-NeMo/Guardrails` `tests/recorded/` +
  per-integration fixtures (record once, replay in CI),
  `tests/evaluate/` (rail eval as first-class tests),
  `qa/test_*_rail.py` behind `QA_MODE` (real-LLM rail QA tier separated
  from unit tier).
- **Anti-patterns it blocks:** one-sided characterization (only measuring
  blocks, never false refusals — or vice versa); attack and judge sharing
  code paths; live-model calls inside unit tests; uncalibrated LLM judges
  scoring refusal.

### GATE-012 v1.0 — Training reproducibility / eval-after-train

- **Purpose:** a training stack is reproducible (same seed, same loss
  curve) and no train run counts without a post-train eval.
- **Applies to:** `fine-tuning`, `rl-envs`.
- **Acceptance criteria:** (1) tiny-model smoke trains (single-digit steps)
  are the standard unit of correctness, run on CPU in PR CI;
  (2) numerics/determinism regression: exact loss golden values asserted
  against fixed seeds and dtypes; (3) GPU e2e trains are gated/scheduled,
  never in the PR critical path; (4) eval-after-train is mandatory —
  generate/evaluate smoke coverage exists for every trained artifact;
  (5) reward/objective math (KL estimators, reward shaping, loss
  aggregation) has gradient/shape-level tests, not just end-to-end trainer
  runs.
- **Evidence required:** `axolotl-ai-cloud/axolotl`
  `tests/e2e/test_lora_llama.py` (validate_config → load_datasets → train
  on `HuggingFaceTB/SmolLM2-135M` with `max_steps: 5`, then
  `check_model_output_exists`) and `tests/e2e/test_evaluate.py`;
  `meta-pytorch/torchtune`
  `tests/recipes/test_full_finetune_single_device.py::_fetch_expected_loss_values`
  (`loss_values_map` golden losses, `seed=9`, fp32, compile on/off) and
  `tests/recipes/test_eleuther_eval.py` (eval recipe in CI);
  `Lightning-AI/litgpt` `tests/test_lora.py` (synthetic micro-configs, no
  checkpoint download); `OpenRLHF/OpenRLHF` `tests/test_reward_shaping.py`,
  `tests/test_kl_estimator_gradient.py`, `tests/test_loss_aggregation.py`;
  `huggingface/trl` `tests/test_rewards.py`; `Farama-Foundation/Gymnasium`
  `gymnasium/utils/env_checker.py::check_reset_seed_determinism`
  (same seed → same trajectory); `huggingface/trl`
  `.github/workflows/tests.yml` vs `slow-tests.yml` (tiered: fast PR vs
  slow GPU).
- **Anti-patterns it blocks:** full-size trains in unit CI; loss asserted
  loosely or not at all; eval skipped after train ("the checkpoint exists"
  ≠ "the checkpoint works"); reward-hacking-shaped gaps (the rl-envs pack
  notes no repo ships explicit anti-reward-hacking regression tests — the
  closest is reward-shaping/KL gradient testing, which this gate requires).

### GATE-013 v1.0 — Voice latency / interruption

- **Purpose:** voice agents are measured on time-to-first-audio and
  interruption behavior with deterministic clocks — latency is a tested
  property, not a README claim.
- **Applies to:** `voice-agents`.
- **Acceptance criteria:** (1) latency metric classes (TTFA / time-to-first-
  audio-token / time-to-first-byte) ship with their own unit tests;
  (2) end-to-end latency handoff through the full pipeline is tested;
  (3) a dedicated interruption/turn-taking test surface exists (interruption,
  false-interruption resume, protected speech, hold windows);
  (4) timing assertions use virtual/fake clocks, never wall-clock;
  (5) [Inference] latency regression is gated in CI, not just measured.
- **Evidence required:** `pipecat-ai/pipecat` `tests/test_ttfa_metrics.py`
  (TTFA via RMS speech-onset detection on PCM buffers),
  `tests/test_ttfat_metrics.py`, `tests/test_ttfb_metrics.py`;
  `livekit/agents` `tests/test_e2e_latency_handoff.py`,
  `tests/test_interruption/` (whole directory),
  `tests/test_false_interruption_resume.py`,
  `tests/test_interrupt_protected_speech.py`,
  `tests/virtual_time.py` (fake clock for turn-taking/latency assertions),
  `tests/fake_stt.py` / `fake_llm.py` / `fake_tts.py` (deterministic
  sessions without API keys); `ServiceNow/eva` `src/eva/` (bot-to-bot
  caller simulation with perturbation suite: background noise, accents,
  connection degradation).
- **Anti-patterns it blocks:** wall-clock latency assertions in CI;
  interruption behavior tested only via live calls; the voice-agents pack's
  standing caveat — "latency is tested, not gated" — which this gate
  refuses to perpetuate: a latency budget that CI never enforces is a
  TARGETED claim, not an OBSERVED one.

### GATE-014 v1.0 — Deterministic test doubles / offline CI

- **Purpose:** no unit test needs a network call, an API key, or a live
  model; doubles are a shipped product surface, not test-only hacks.
- **Applies to:** universal (all 21 types).
- **Acceptance criteria:** (1) deterministic doubles ship as an importable
  test API of the project (scripted models, fake providers, mock sandbox
  sessions); (2) doubles cover side effects, not just the model
  (scripted tool execution, recorded fixtures); (3) CI runs the unit tier
  with zero credentials and zero network; (4) live-provider tests, where
  they exist, are secrets-gated, path-triggered, and excluded from the PR
  path; (5) any credential the project issues or consumes is scoped to least
  privilege for its use (read-only where writes are never needed;
  per-environment, never shared across prod/test), and a rotation
  requirement is documented (maximum credential age, rotation procedure,
  what breaks loudly on expiry rather than silently degrading).
- **Evidence required:** `openai/openai-agents-python`
  `src/agents/testing/__init__.py` ("Deterministic test doubles for Agents
  SDK workflows" as a shipped module); `UKGovernmentBEIS/inspect_ai`
  `src/inspect_ai/model/_providers/mockllm.py` (scripted outputs);
  `EleutherAI/lm-evaluation-harness` `lm_eval/models/dummy.py`
  (`DummyLM`, registered as `"dummy"`, zero-cost pipeline runs);
  `livekit/agents` `tests/fake_*.py` (per-stage doubles);
  `guardrails-ai/guardrails` `tests/integration_tests/mock_llm_outputs.py`
  + `mock_embeddings.py`; `NVIDIA-NeMo/Guardrails` `tests/recorded/`
  (record once, replay in CI).
- **Anti-patterns it blocks:** unit tests that hit live APIs; "works on my
  machine with my key"; recorded fixtures that are actually live calls in
  disguise; credential-gated tests in the PR critical path.

### GATE-015 v1.0 — Tiered CI separation

- **Purpose:** PR signal stays minutes-scale; expensive, flaky, or
  hardware-bound work never blocks a merge — and never silently disappears
  either.
- **Applies to:** universal.
- **Acceptance criteria:** (1) fast unit/lint/typecheck tier gates every
  PR; (2) slow, GPU, Docker, real-browser, live-provider, and benchmark
  tiers are separate workflows — scheduled, labeled, or path-triggered;
  (3) exclusions are explicit and reviewable (env flags, markers, labels),
  never silent; (4) heavy jobs carry measured, justified timeouts and
  least-privilege token scoping.
- **Evidence required:** `vllm-project/vllm`
  `.buildkite/performance-benchmarks/` (perf track separate from
  correctness CI); `axolotl-ai-cloud/axolotl` `.github/workflows/tests.yml`
  (CPU on PR) vs `docker-e2e.yml` (GPU e2e gated behind a PR label);
  `huggingface/trl` `tests.yml` vs `slow-tests.yml`;
  `NVIDIA-NeMo/Guardrails` `qa/` behind `skipif(not QA_MODE)`;
  `mlc-ai/xgrammar` `tests/python/test_pressure.py` with explicit
  `skipif(_running_in_ci())`; `comet-ml/opik`
  `python_sdk_unit_tests.yml` vs `end2end_suites_v2.yml`;
  `browserbase/stagehand` `ci.yml` (`dorny/paths-filter` change-aware jobs:
  `unit-ts` / `browser-ts` / `integration` / `regression-evals` with
  `skip-evals` labels); `modelcontextprotocol/inspector` per-job
  `timeout-minutes` sized from measured run history.
- **Anti-patterns it blocks:** one mega-workflow where a 90-minute browser
  job blocks a docs fix; expensive tiers silently dropped from CI instead
  of quarantined; "CI is green" meaning "CI ran the cheap half."

### GATE-016 v1.0 — Dependency / toolchain pinning

- **Purpose:** the thing numbers depend on is the thing pinned — toolchain,
  actions, vendored cores, and model sources are enumerated, not assumed.
- **Applies to:** universal; load-bearing for `inference-engines`,
  `embedding-serving`, `quantization`, `fine-tuning`.
- **Acceptance criteria:** (1) the full toolchain is pinned in-repo
  (rust-toolchain.toml / Cargo.lock / uv.lock / pinned CI action SHAs);
  (2) vendored inference cores carry version files, not "latest";
  (3) supply-chain hygiene gates exist (dependency firewall / audit);
  (4) model sources enumerate dim, license, size, and files — the registry
  is the supported-model contract.
- **Evidence required:** `huggingface/text-embeddings-inference`
  `rust-toolchain.toml` + `Cargo.lock` + `uv sync --locked`,
  action SHAs pinned in workflows; `getzep/graphiti`
  `.github/workflows/unit_tests.yml` (actions pinned to SHAs) +
  `socket-firewall-connectivity.yml`; `ollama/ollama` `LLAMA_CPP_VERSION`,
  `MLX_VERSION`, `MLX_C_VERSION` (vendored core versions as files);
  `qdrant/fastembed` `fastembed/common/model_description.py` (frozen
  dataclass model registry: source, dim, license, size_in_GB).
- **Anti-patterns it blocks:** "latest" as a pin; CI actions floating on
  major-version tags; weight/model sources enumerated in docs but not in
  code (the embedding-serving pack documents floating weights as the
  observed norm — this gate requires the registry-as-code pattern instead).

### GATE-017 v1.0 — Spec / schema surface drift

- **Purpose:** the machine-readable contract (tool surface, wire types,
  schema) cannot drift from the spec — or from its own previous release —
  without a reviewable diff.
- **Applies to:** `mcp`, `multi-agent-protocols`;
  advisory for `structured-output`, `workflow-orchestrators`.
- **Acceptance criteria:** (1) PRs diff the exposed tool/schema surface
  (base vs head) as a reviewable artifact; (2) protocol types are generated
  from (or diff-checked against) the spec source of truth;
  (3) backward-compat suites pin older spec revisions so vN servers keep
  working with vN-1 clients; (4) known-broken cases are marked with tests
  that must flip when fixed, not skipped TODOs.
- **Evidence required:** `github/github-mcp-server`
  `.github/workflows/mcp-diff.yml` (build base + head, diff the MCP tool
  surface); `modelcontextprotocol/typescript-sdk`
  `.github/workflows/update-spec-types.yml` (regenerate protocol types from
  the spec); `a2aproject/a2a-python` `tests/compat/v0_3/` (per-spec-version
  compat dirs); `a2aproject/a2a-js`
  `test/proto_json_conformance.spec.ts` (`it.fails` markers that start
  failing when fixed — the fix cannot land without flipping the marker).
- **Anti-patterns it blocks:** schema changes discovered by users in
  production; types hand-edited away from the wire spec; skipped TODOs for
  known protocol bugs (a skip is invisible; a must-flip marker is a
  scheduled confrontation).

### GATE-018 v1.0 — Flake quarantine

- **Purpose:** flaky tests are quarantined, retried with a budget, and
  tracked — never silently green, never silently deleted.
- **Applies to:** universal; load-bearing for `browser-use`,
  `computer-use`, `workflow-orchestrators`, `agent-frameworks`
  (nondeterministic or long-running suites).
- **Acceptance criteria:** (1) retries carry an explicit budget and are
  visible in CI config (not hidden in the runner); (2) known-flaky tests
  are quarantined with a label/tracking issue, not deleted and not left to
  poison the main suite; (3) a flaky-test report exists (sharding and
  failure history tracked); (4) [Inference] a flake-rate budget is declared
  per suite — the browser-use pack notes no surveyed repo documents one,
  so this is a designed requirement, not a copied practice.
- **Evidence required:** `temporalio/temporal`
  `.github/workflows/flaky-tests-report.yml` +
  `optimize-test-sharding.yml` (flaky tracking, sharded heavy suites);
  `browser-use/browser-use` `nick-fields/retry@v3` in test.yaml with
  `continue-on-error` scoping (explicit retry budget in config);
  `huggingface/trl` `Makefile` `--reruns 5` restricted to
  `OSError|Timeout|HTTP 502/504|out of memory` (retries only for
  transient-infra signatures, never for assertion failures).
- **Anti-patterns it blocks:** retry-everything CI that greens over real
  regressions (retries must exclude assertion failures); deleting flaky
  tests instead of quarantining them; flake-rate with no budget and no
  owner.

---

## Amendment rule

A new GATE-* requires: (1) two independent `_evidence/*.md` files
demonstrating the practice (or honestly labeling it as a designed
gap, `[Inference]`); (2) a companion-file field listing load-bearing vs
advisory types; (3) acceptance criteria writable as PASS/FAIL/N-A with
named evidence artifacts. Gates MUST NOT come from the vendor technique
catalog alone — the catalog informs, it does not gate.
