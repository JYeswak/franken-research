# Pickup companion: LLM inference engines

Scope: projects that load LLM weights and produce tokens — serving engines
(batching, KV-cache, continuous prefill), local runners, vendor-tuned stacks,
and ML-compilation deployment engines. Verified evidence: 8 repos,
2026-09-23, via GitHub API.

## Charter seed

**What this project type is.** Software that turns model weights into
generated text under measurable constraints: throughput (tokens/s, req/s),
latency (TTFT, TPOT, p50/p99), memory (KV-cache budget), and numerical
correctness (parity with a reference numerics program). The ecosystem goal is
to bootstrap assessment of such engines from a sound starting point — never a
rewrite target on its own.

**In scope.** Batching/scheduling, KV-cache management, tensor-parallel
and pipeline-parallel serving, quantization-aware execution, hardware-specific
kernels (CUDA/ROCm/Metal/etc.), accuracy-vs-speed tradeoffs, benchmark harnesses,
vendored-core pinning, GPU-SKU-pinned CI.

**Out of scope.** Model training, RL/fine-tuning infra (separate type),
evaluation harness design beyond correctness parity (see eval-harnesses),
consumer distribution UX (Ollama-class packaging is evidence, not the engine),
multi-agent orchestration on top of served models.

**"A good starting point" means:** a truth pack pinning the exact upstream
engine commit, the exact weight revisions, and the harness version; benchmark
scripts that are themselves unit-tested; an A/A-banked golden baseline per
GPU SKU; invocation-time SHA-256 recording of every binary that participates
in a measurement; and a claim registry where every comparative sentence is
registered before it is published. (Pattern: model-guides.md §7.)

### Requirements

- REQ-01 — Truth pack names the exact upstream engine commit, weight HF
  revisions, fixture hashes, and oracle harness version; `fetch-truth-pack.sh
  --verify` reproduces them (tts/ocr pattern).
- REQ-02 — The bench harness starts/stops the backend itself and names the
  measured path as `backend:model`; goldens bind per host **and GPU SKU**
  (`goldens/<host_id>/<gpu_sku>/`); cross-SKU comparison is a finding, never
  a claim.
- REQ-03 — Every perf number carries: same-invocation A/B/A ordering, A/A
  nulls in [0.98, 1.02] or NO ADMISSIBLE VERDICT, invocation-time SHA-256 of
  every measured binary, and tolerance `max(3 × A/A relative spread, floor)`.
- REQ-04 — Correctness claims require differential evidence against the pinned
  reference oracle (llama.cpp tools or HF transformers) on a pinned model
  set; perplexity/parity deltas must sit inside a committed
  NONDETERMINISM_FLOOR.
- REQ-05 — Every public comparative claim is registered in CLAIMS.json with an
  evidence state (`[OBSERVED@pin]` / `[REPORTED]` / `[TARGETED]` / …); only
  CAMPAIGN-WIN-class rows (incumbent in the room, quality gate passed) may
  support public competitive claims.
- REQ-06 — Where hardware-pinned nightly CI cannot be provided locally, that
  absence is recorded as UNK — never silently downgraded to "works on my GPU."

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all named in `_evidence/inference-engines.md`):

1. **llama.cpp main HEAD** (`ggml-org/llama.cpp`) — `tools/llama-bench`,
   `tools/perplexity`, `tools/server`. The reference engine the serving
   engines measure against. Integrity: pin commit in PIN_RECORD.md; record
   built-binary SHA-256 at invocation; rerun `tools/perplexity` on the pinned
   weight revision as the parity oracle.
2. **HF transformers pinned release** (`torch==x.y.z`, `transformers==a.b.c`)
   — differential-correctness oracle for the served numerics program
   (vLLM `tests/basic_correctness/test_basic_correctness.py` pattern).
   Integrity: pinned stack in truth pack; pinned-thread hardware note;
   never inherit exactness across numerics profiles (nlp anti-lie rule).
3. **lm-eval-harness pinned commit** — accuracy oracle
   (`vllm-project/vllm/.buildkite/lm-eval-harness/`,
   `sgl-project/sglang/test/lm_eval_configs/*.yaml`). Integrity: configs
   committed in-tree; baseline script (e.g. `run-lm-eval-gsm-vllm-baseline.sh`)
   versioned; quality gate (task accuracy / WER-equivalent) mandatory on every
   perf row.
4. **vLLM `benchmarks/benchmark_serving.py`** — de-facto serving-throughput
   benchmark other projects clone. Integrity caveat: it is a *convention*,
   not an independent oracle — engine authors fork and tune it. Treat as T0
   for the harness text (inspected in-tree), never as ground truth for
   performance numbers; pin the fork commit in MANIFEST.sha256.
5. **TensorRT-LLM** (`nvidia/TensorRT-LLM`, `tensorrt_llm/bench/`,
   `tensorrt_llm/evaluate/`) — vendor-tuned reference implementation.
   Integrity: T2 vendor reference unless reproduced; record its
   container/binary SHA-256; note its CI
   lives mostly in `jenkins/` + `blossom-ci.yml` and is not GitHub-verifiable.

Per-oracle integrity checks, truth-pack shape (model-guides.md §1–2):
`docs/truth-pack/PIN_RECORD.md` (engine commit + weight revision + harness
commit, with honest date-skew notes), `MANIFEST.sha256`,
`ACCEPTANCE_SURFACE.json` (pre-computed break-even thresholds, e.g. min
throughput/token-budget ratios before a route is worth pursuing),
`NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh --verify`; invocation-time
oracle-binary SHA-256 recording on every campaign row (whisper CAMPAIGN WIN
pattern — a row without it is diagnostic only).

Unresolved oracle-layer questions are tracked once, in Unknowns (UNK-01–UNK-04)
below; they are not redefined here.

## Initial claims (CLAIM-*)

About the TYPE's process norms, not single-repo marketing. Tiers:
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-01 | Mature inference engines ship a standardized serving benchmark harness (throughput/latency scripts plus a shared dataset registry). | vllm-project/vllm/benchmarks/{benchmark_serving.py,benchmark_throughput.py,benchmark_latency.py,benchmark_utils.py,README.md}; sgl-project/sglang/python/sglang/bench_serving.py; InternLM/lmdeploy/benchmark/benchmark_serving.py | T0 | High | ADMISSIBLE |
| CLAIM-02 | Benchmark harnesses are unit-tested like production code (CLI parity, timing tests, startup tests). | vllm-project/vllm/tests/benchmarks/test_throughput_cli.py, test_latency_cli.py, test_serve_cli.py, test_bench_startup.py; sgl-project/sglang/python/sglang/test/nightly_bench_utils.py | T0 | High | ADMISSIBLE |
| CLAIM-03 | Mature engines run a dedicated perf-regression CI track, separate from correctness CI. | vllm-project/vllm/.buildkite/performance-benchmarks/ (README.md, descriptions, scripts/, tests/); sgl-project/sglang/.github/workflows/pr-benchmark-rust.yml, stress-test.yml, nightly-72-gpu-gb200.yml | T0 | High | ADMISSIBLE |
| CLAIM-04 | Nightly/daily CI is hardware-pinned by GPU SKU across vendors (NVIDIA/AMD/Intel/NPU). | vllm-project/vllm/.buildkite/ci_config.yaml, ci_config_rocm.yaml, .buildkite/hardware_tests/; sgl-project/sglang/.github/workflows/nightly-test-{nvidia,amd,intel,npu}.yml; InternLM/lmdeploy/.github/workflows/daily_ete_test{,_3090,_5080}.yml | T0 | High | ADMISSIBLE |
| CLAIM-05 | Correctness is established by differential tests against HF transformers (perplexity/parity), not by eyeballing outputs. | vllm-project/vllm/tests/basic_correctness/test_basic_correctness.py; ggml-org/llama.cpp/tools/perplexity/, tests/test-backend-ops.cpp | T0 | High | ADMISSIBLE |
| CLAIM-06 | First-party accuracy/eval harnesses are wired to lm-eval-harness with committed configs. | vllm-project/vllm/.buildkite/lm-eval-harness/test_lm_eval_correctness.py, configs/; sgl-project/sglang/test/lm_eval_configs/*.yaml, python/sglang/test/run_eval.py | T0 | High | ADMISSIBLE |
| CLAIM-07 | Engines that ship quantization keep recorded precision/quantization baselines (per-format reference values, determinism tests). | sgl-project/sglang/python/sglang/test/precision_baseline_store.py, quant_ref_utils.py, test_deterministic.py | T0 | High | ADMISSIBLE |
| CLAIM-08 | The benchmark harness is shipped inside the library/engine, not only as external scripts. | nvidia/TensorRT-LLM/tensorrt_llm/bench/, tensorrt_llm/evaluate/, tests/microbenchmarks/; ggml-org/llama.cpp/tools/llama-bench/ | T0 | High | ADMISSIBLE |
| CLAIM-09 | Projects that vendor an inference core pin the vendored version explicitly (version files, crate hashes, toolchain pins). | ollama/ollama/LLAMA_CPP_VERSION, MLX_VERSION, MLX_C_VERSION; huggingface/text-generation-inference/rust-toolchain.toml, crate-hashes.json, backends/ | T0 | High | ADMISSIBLE |
| CLAIM-10 | Cross-platform backend coverage is enforced by a build matrix (CPU/CUDA/ROCm/Vulkan/Metal/SYCL/WASM). | ggml-org/llama.cpp/.github/workflows/build-{cpu,cuda-ubuntu,cuda-windows,hip-quality-check,vulkan,sycl,opencl,metal,wasm,sanitize} (~30 files); sgl-project/sglang/.github/workflows/pr-test-{amd,npu,xpu,musa,mlx,xeon,arm64}.yml | T0 | High | ADMISSIBLE |
| CLAIM-11 | CI failure monitoring and auto-bisect are first-class workflows (not ad-hoc). | sgl-project/sglang/.github/workflows/ci-failure-monitor.yml, ci-auto-bisect.yml, ci-coverage-overview.yml, runner-utilization.yml | T0 | High | ADMISSIBLE |
| CLAIM-12 | The incumbent serving stack is converging on pluggable vLLM-class backends rather than a single core. | huggingface/text-generation-inference/backends/{v2,v3,trtllm,llamacpp,gaudi,neuron}/; repo tree verified 2026-09-23 | T0 | High | ADMISSIBLE |
| CLAIM-13 | A field reference engine can carry the category's perf baseline without any enabled automated perf gate. | ggml-org/llama.cpp/.github/workflows/bench.yml.disabled — the reference engine measures perf in-repo (tools/llama-bench, tools/perplexity) with no automated perf gate | T0 | Medium | CONTESTED |
| CLAIM-14 | WITHDRAWN — "Most engines publish consumer packaging alongside the engine." Evidence supports this for exactly one repo (ollama/ollama is a distribution layer, not a batching/serving engine). Withdrawn as a type norm; kept as a record of overreach. | thin: only ollama/ollama evidences packaging; others do not | T2 | — | WITHDRAWN |

13 rows (12 active + 1 withdrawn, kept in-tree per the retraction pattern).

## Gate profile

G1–G14 applicability mapped against the canonical definitions
(PROJECT-PICKUP-PLAYBOOK.md; `_s0/g1-g14-reference.md`). This replaces the
S2 provisional map (see UNK-01, now resolved — the canonical definitions
are in the playbook):

- **G1 ORACLE — load-bearing, as-is.** Oracle inventory = pinned engine
  commits (llama.cpp, vLLM, TGI, TensorRT-LLM) + weight revisions +
  benchmark-dataset pins in `kit-oracle.yml`; renaming an oracle file out
  of the oracle directory counts as weakening.
- **G2 PAIR — load-bearing, type-parameterized.** Paired validation =
  same-invocation A/B/A: candidate engine vs pinned oracle on the same
  model + dataset shard; the pair record names both SHAs.
- **G3 OWN — as-is.** New ownership/allocation sites (KV-cache allocators,
  custom alloc paths) classified in `ownership.tsv` with evidence.
- **G4 CONTRACT — load-bearing, as-is.** CI-only conformance harness from
  `kit-contracts.yml` runs in a `.git`-less staged-tree copy.
- **G5 HOST — load-bearing, as-is.** Ambient/host reads (GPU SKU, driver,
  thread pinning) and new unsafe code declared in the same diff.
- **G6 UNSAFE — load-bearing for Rust/C++ components** (TGI's Rust core,
  custom kernels); each new unsafe site carries `// SAFETY:` (or the
  C++-side equivalent comment); tree-wide unsafe inventory accounted for.
  Advisory for pure-Python orchestration.
- **G7 REVIEW — load-bearing, as-is.** Sensitive changes (kernel numerics,
  sampling logic) require a diff-only review artifact.
- **G8 RULEBOOK — load-bearing, as-is.** Bulk porting declared and
  evidenced through `kit-rulebook.yml`.
- **G9 IOU — as-is.** Positive loop bound in `kit-loops.yml`; zero
  unresolved structured IOUs at the phase gate.
- **G10 MIRI — as-is where Rust exists** (TGI); non-Rust components set
  `rust: false` with the reason recorded.
- **G11 LAYOUT — load-bearing for Rust/C++** (tensor layout structs carry
  `size_of`/`align_of` assertions or C++ static_asserts); N-A for
  pure-Python with reason.
- **G12 AUDIT — as-is.** Fix-class eradications in `kit-audits/*.audit`;
  exemptions in `exemptions.tsv`.
- **G13 NOSTUB — load-bearing, as-is.** Stub markers in added lines block
  (a stubbed kernel is a correctness hole).
- **G14 REJECT — load-bearing, as-is.** Each claimed safety/performance
  property has rejection evidence in `kit-rejections.tsv`; claims
  violating their tier burden are rejected.

Type-parameterized extensions (not new gates): result-class discipline
(CAMPAIGN WIN = incumbent in-the-room: pinned llama.cpp or HF-transformers
numerics oracle, same invocation, dual A/A nulls [0.98,1.02],
2x-null-margin, mandatory quality gate); perf-ledger admission (CV≤5% +
GPU-SKU binding + contention receipts); golden banking per host+GPU-SKU
(`aa <spec> --write-golden`; golden-regeneration-until-green is a named
forbidden pattern); conformance = differential perplexity parity + lm-eval
accuracy floor (MUST), p99 latency within tolerance (SHOULD).

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-001 (inference-serving benchmark harness) | Load-bearing | Applies to this slug; shipped + tested benchmark harness is the type's core (GATE-IE-01/02 retired into it) |
| GATE-002 (model truth-pack / oracle integrity) | Load-bearing | Claims rest on pinned oracle weights/engines; truth-pack required |
| GATE-003 (quantization quality-loss budget) | Advisory | Kernel-level quality benches are consumed, not produced, by engines |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Load-bearing | Vendored cores + toolchain pins are the supported-model contract (CLAIM-09) |
| GATE-018 (flake quarantine) | Advisory | Deterministic bench harnesses; quarantine with label, not blocking by default |

New type-specific gates (GATE-IE-*):

- GATE-IE-01 — **Hardware-pinned perf-regression track — RETIRED into shared GATE-001** (S4 round 1, dedup). GATE-001 acceptance (3)–(4) already require the dedicated perf-regression CI track with per-host/generation binding. Retained as a type-specific parameter: the track runs on the release commit against the pinned GPU SKU, publishes deltas against the A/A-banked golden, and blocks release on regression beyond tolerance.
- GATE-IE-02 — **Benchmark-harness self-tests — RETIRED into shared GATE-001** (S4 round 1, dedup). GATE-001 acceptance (2) already requires the harness to be unit-tested like library code. Retained as a type-specific parameter: CLI parity, timing, and startup tests run in CI; a benchmark change with no harness test is not landable.
- GATE-IE-03 — **Differential correctness.** Acceptance: on the pinned model
  set, served-logits/parity vs the pinned reference oracle stays inside the
  committed NONDETERMINISM_FLOOR; numerics-profile changes re-bank the floor
  explicitly (never inherit exactness).
- GATE-IE-04 — **Quantization baseline registry.** Acceptance: every shipped
  quant format has recorded precision baselines (per-format reference values +
  determinism tests); a format with no baseline is TARGETED, not shipped.

## Evidence tiers

Canonical pickup tiers (verbatim, per PROJECT-PICKUP-PLAYBOOK.md):

- **T0 [Verified]** — direct inspection of a fresh clone, API, live page, or
  a measurement taken at a pinned oracle with invocation-time SHA-256
  recorded.
- **T1 [CI-observed]** — executed and observed on CI / banked receipt;
  attests the suite *runs*, not that it is green, and not that numbers are
  admissible.
- **T2 [Maintainer claim] / [External]** — asserted by repo docs or an
  independent source, not reproduced by us.
- **T3 [Inference]** — analyst judgment — always labeled as such, never
  silently upgraded.

Type application: NVIDIA TensorRT-LLM shipped benches/docs
(`tensorrt_llm/bench/`) and vendor-published perf numbers with named
hardware are vendor references — T2 unless reproduced; admissible as vendor
reference, never as independent verification of a third-party engine.
In-repo benchmark harnesses inspected in-tree (vLLM/SGLang/LMDeploy/
llama.cpp artifacts), unit-tested bench CLIs, perf-regression CI tracks,
hardware-pinned nightly workflows, differential-correctness tests are the
load-bearing tier for copy-worthy process claims (T0 for what was inspected
in-tree; T1 for what CI executed). [CI-observed] attests the suite *runs*,
not that it is green. Roadmap numbers, TARGETED gates, "up to Nx" claims
with no banked receipt are T3; labeled `[TARGETED]`; may not support any
public claim (nlp README rule). Program vocabulary overlay:
[Verified]/[Git-observed]/[Code-verified] mark what was read in-tree;
[Maintainer claim]/[External] = T2; [Inference] is always labeled as such.
A row without a recorded oracle-binary SHA-256 is diagnostic only (whisper
Metal-entry rule).

## Localbench bench shape

- **Spec format** — `backend:model:profile`, e.g. `vllm:llama-3.1-8b:fp16`,
  `sglang:qwen3-32b:fp8`, `llama.cpp:qwen3-30b:q8_0-cpu`. The harness
  starts/stops the engine itself; profile names the numerics program
  (precision, quant recipe, attention backend) so the numerics anti-lie rule
  binds by construction.
- **Named tiers** — `prefill` (TTFT / prompt tokens/s), `decode`
  (tokens/s, TPOT), `serving` (req/s, p50/p99 end-to-end via a
  `benchmark_serving.py`-class driver), `correctness` (perplexity parity vs
  pinned oracle — MUST), `quant-parity` (per-format baseline deltas),
  `accuracy` (lm-eval subset — MUST for any quality-bounded perf claim),
  `mem` (KV-cache / peak RSS|VRAM). Goldens bind PER TIER per host+GPU SKU;
  an engine update invalidates only the tiers it touches.
- **Golden layout** — `goldens/<host_id>/<gpu_sku>/<spec>/<tier>.json`:
  `conformance` (named checks, `level: MUST|SHOULD`, `verdict: PASS|FAIL`) +
  `metrics` (`value`, A/A `spread`, `tol`, `tol_source` → banked receipt,
  `better` direction).
- **Tolerance rule** — `tol = max(3 × A/A relative spread, floor)`; floor is
  tier-specific and committed (e.g. decode floor ≥ run-to-run driver jitter
  observed on the SKU). A/B ordering: same-invocation A, B, A; banked under
  a name.
- **Measurement law** — preflight refuses a busy machine (GPU util > 25%,
  names the processes); a run is marked CONTENDED if any non-backend process
  exceeds 25% GPU in any second; one unit under test at a time; loopback
  endpoints only (a failed local engine call is a finding, never a cloud
  fallback); park/unpark interfering residents during windows.
- **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<sku>__<ts>.json`
  (kinds: aa, ab, mem, run, parity) + dated `.md` investigation notes;
  `runs/` gitignored scratch. Incumbent pins in
  `docs/evidence/incumbents.md`: engine commit, harness commit, weight
  revision + SHA-256, driver/CUDA versions, OS.
- **Claims wiring** — `registries/claims.tsv`: every public claim sentence
  machine-checked against its receipt on every commit; the check observes
  (exit 0) unless wired to gate — wiring to gate is REQUIRED before any
  competitive claim ships (nlp linter pattern, hardened).
- **Remote-lab variant** — where the GPU cannot be local: the law relocates,
  not weakens — same preflight/contended rules on the remote host, full
  host+SKU provenance in every receipt, no cross-host golden comparison.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **GPU-SKU golden binding** — `goldens/<host_id>/<gpu_sku>/` layout and the
   GENERATION-MISMATCH/SKU-MISMATCH status vocabulary (extends the host-only
   rule; new generations = engine/harness/driver updates).
2. **Benchmark-harness self-test template** — `tests/benchmarks/test_*_cli.py`
   skeleton (CLI parity, timing, startup) + CI job, after
   vLLM `tests/benchmarks/` and SGLang `nightly_bench_utils.py`.
3. **Differential-correctness fixture set** — pinned model list, perplexity
   driver, NONDETERMINISM_FLOOR.md template, numerics-profile naming
   convention (after vLLM `test_basic_correctness.py` + nlp profiles).
4. **Precision-baseline store template** — per-quant-format reference values +
   determinism tests, after SGLang `precision_baseline_store.py` /
   `test_deterministic.py`.
5. **Vendored-core pin file** — `VENDOR_VERSIONS` (after Ollama's
   `LLAMA_CPP_VERSION`/`MLX_VERSION` pattern) + `crate-hashes.json`-style
   integrity manifest, checked by `fetch-truth-pack.sh --verify`.
6. **Perf-regression track template** — Buildkite/GitHub workflow skeleton
   separating perf from correctness CI, with banked-golden comparison and
   regression blocking (after vLLM `.buildkite/performance-benchmarks/`).
7. **CI-failure-monitor template** — failure triage + auto-bisect workflow
   skeleton (after SGLang `ci-failure-monitor.yml`/`ci-auto-bisect.yml`).
8. **Result-class doctrine file** — `docs/PERF_LEDGER.md` template with
   SELF-SPEEDUP vs CAMPAIGN WIN definitions, A/A-null [0.98,1.02] rule,
   mandatory quality gate, and invocation-time SHA-256 recording requirement.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Stars and `pushed_at` are point-in-time GitHub API values from 2026-09-23,
not live guarantees.

- `vllm-project/vllm` | 92,527 | pushed 2026-09-23 — Category flagship; its
  `benchmarks/benchmark_serving.py` is the de-facto throughput benchmark
  others clone; benchmark CLIs are unit-tested; perf-regression CI is a
  separate Buildkite track.
- `sgl-project/sglang` | 36,377 | pushed 2026-09-23 — Fastest-growing
  vLLM-class challenger; ~130 workflow files with per-vendor nightly GPU
  fleets, CI-failure monitoring + auto-bisect, recorded precision baselines.
- `nvidia/TensorRT-LLM` | 14,703 | pushed 2026-09-23 — NVIDIA's official
  stack, the vendor-tuned reference implementation; bench harness shipped
  inside the library (`tensorrt_llm/bench/`).
- `huggingface/text-generation-inference` | 10,884 | pushed 2026-03-21 —
  Incumbent pivoting to pluggable vLLM-class backends
  (`backends/{v2,v3,trtllm,llamacpp,gaudi,neuron}`); six months stale, so
  evidence of the trend's direction, not of current maintenance.
- `InternLM/lmdeploy` | 8,094 | pushed 2026-09-23 — Daily E2E test matrix
  pinned to GPU SKUs (`daily_ete_test_3090.yml`, `daily_ete_test_5080.yml`);
  full benchmark suite (`benchmark_serving.py`, `benchmark_throughput.py`,
  `benchmark_decode.py`).
- `ggml-org/llama.cpp` | 129,316 | pushed 2026-09-23 — Reference engine;
  `tools/llama-bench`, `tools/perplexity`, `tools/server` define the
  correctness/perf baseline; ~30-file cross-platform build matrix.
- `ollama/ollama` | 181,524 | pushed 2026-09-23 — Consumer distribution
  layer vending llama.cpp with pinned versions (`LLAMA_CPP_VERSION`,
  `MLX_VERSION`); copy-worthy practice is dependency pinning, not serving.
- `mlc-ai/mlc-llm` | 23,183 | pushed 2026-08-17 — ML-compilation
  (TVM-lineage) cross-device branch (android/ios/web targets); thinnest
  benchmark evidence in the set — no root `benchmark/` dir.

**Honest caveats carried over.** Aphrodite Engine was dropped — neither
`aphrodite-engine/aphrodite-engine` nor `alpinelabs/aphrodite-engine`
resolved via the GitHub API, so it is not cited rather than cited from
memory. TGI is going stale (last push 2026-03-21 vs ~36h for the rest);
HF's effort is now the multi-backend v3. llama.cpp has no enabled benchmark
CI (`bench.yml.disabled`); the reference engine measures perf in-repo with no
automated perf gate. mlc-llm evidences the cross-device/compilation branch,
not benchmark practice (CI largely in `ci/jenkinsfile.groovy`, workflows
dir nearly empty). Ollama is a distribution layer, not a batching/serving
engine. Star counts are point-in-time, not live.

## Unknowns (UNK-*)

- UNK-01 — [RESOLVED 2026-09-23, S4 round 1] Starter-kit G1–G14 canonical
  definitions are now in PROJECT-PICKUP-PLAYBOOK.md (from
  `_s0/g1-g14-reference.md`); the gate profile above was rebuilt against them.
  **Disposition: RESOLVED.**
- UNK-02 — Oracle staleness policy for llama.cpp main HEAD: pin-and-verify
  exists, but how often the pin must advance (and who re-banks the parity
  floor) is unresolved.
  **Disposition: TARGETED.**
- UNK-03 — TensorRT-LLM CI greenness is not GitHub-verifiable (real CI in
  `jenkins/`); the vendor reference's "tuned and green" status is
  [REPORTED], not [OBSERVED].
  **Disposition: TARGETED.**
- UNK-04 — Is TGI (or specifically `backends/v3`) still a live oracle, or a
  historical one? Six-month staleness vs active backend pivot — unresolved.
  **Disposition: TARGETED.**
- UNK-05 — mlc-llm cross-device branch has no benchmark oracle in evidence;
  the compilation/cross-device sub-type may need its own bench shape.
  **Disposition: TARGETED.**
- UNK-06 — Break-even thresholds (ACCEPTANCE_SURFACE.json) for this type:
  what counts as "worth pursuing" for a new scheduling/quant route is not
  yet quantified from evidence (cf. tts's pre-computed p\*/alpha\* model).
  **Disposition: TARGETED.**
