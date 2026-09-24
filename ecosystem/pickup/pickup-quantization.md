# Pickup companion: Quantization toolkits

Status: S2 draft, 2026-09-23. Evidence: `_evidence/quantization.md` (all repos verified
live via GitHub REST API; star counts are the 2026-09-23 snapshot). S0 sources:
`_s0/localbench-pattern.md`, `_s0/model-guides.md`, INTENT.md (REQ-*/GATE-*/CLAIM-*/UNK-*
namespaces mandated by explicit user requirement).

## Charter seed

**What this project type is.** A quantization toolkit takes full-precision model weights
(or a full-precision training pipeline) and produces quantized artifacts plus the
kernels/runtime paths to run them, with measured evidence of quality degradation and
speedup. Core objects: quantization recipes/methods (weight-only 4-bit, 8-bit,
mixed-precision, FP8, distillation-coupled), calibrated quantizers, inference kernels
per method×backend, and eval tooling that ties quality loss to latency gain.

**In scope.** Weight/activation quantization recipes with config-flag interfaces;
kernel-level benchmarks on real GEMM shapes; perplexity tooling (WikiText/PTB/C4 class)
plus downstream eval harness adapters (lm-evaluation-harness class); golden-path
quantize→artifact examples per supported format; multi-backend correctness matrices.

**Out of scope.** Quantization-aware training research (methods research, not tooling);
model serving frameworks as such (covered by inference-engines); new kernel
languages/runtimes themselves.

**A good starting point means:** one method script that (a) quantizes, (b) reports
perplexity delta, (c) reports kernel speedup, all one command, on at least one
pinned backend with a truth pack, an A/A-banked golden, and a claim registry whose
sentences are machine-checked — before any competitive claim is uttered.

### Requirements

- **REQ-1** Each supported method ships a single runnable script that quantizes a pinned
  model, reports perplexity delta, and reports kernel speedup in one command (copy the
  `pytorch/ao` `benchmarks/benchmark_gptq.py` fire-CLI pattern).
- **REQ-2** Every kernel family carries a benchmark on real model-layer GEMM shapes
  (copy AutoGPTQ `tests/bench_autoawq_autogptq.py` Yi-34B down_proj shapes), banked per
  localbench tier with A/A-derived tolerances; no toy-shape benchmarks may support a
  public claim.
- **REQ-3** Per-kernel golden-output regression tests against pinned reference tensors
  with per-backend diff tolerances (copy AutoGPTQ `tests/test_q4.py`
  `CUDA_OLD_REFERENCE` asserts), not "runs without crashing" smoke tests.
- **REQ-4** Repo-local perplexity tool (copy `ggml-org/llama.cpp` `tools/perplexity/`)
  plus a downstream zero-shot task adapter (copy `EleutherAI/lm-evaluation-harness`
  `lm_eval/tasks/`); quality reports must include both perplexity delta and downstream
  task delta.
- **REQ-5** Truth pack: `docs/truth-pack/` with pinned model source commit, weight
  revision, fixture hashes, `MANIFEST.sha256`, `NONDETERMINISM_FLOOR.md`,
  `ACCEPTANCE_SURFACE.json`, and `fetch-truth-pack.sh --verify`; oracle binaries are
  SHA-256-recorded at invocation time (model-guides §1–2).
- **REQ-6** Claim registry: every public sentence about quality loss, speedup, or
  coverage registered in `registries/claims.tsv` with evidence-state vocabulary
  (`[OBSERVED@pin]`, `[REPORTED]`, `[TARGETED]`, `[HYPOTHESIS]`) and a linter that
  observes (runs, reports) by default (model-guides §5).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all from the evidence file):

1. **`ggml-org/llama.cpp` (`tools/quantize/`, `tools/perplexity/`)** — reference
   quantized-inference behavior and perplexity measurement for GGUF-class formats.
   Integrity: pin branch `master` commit hash in `PIN_RECORD.md`; record tool binary
   SHA-256 at invocation; `tools/perplexity/` output compared against truth-pack
   golden for the pinned model.
2. **`EleutherAI/lm-evaluation-harness` (`lm_eval/tasks/`)** — quality-degradation
   oracle for downstream tasks (MMLU, HellaSwag, ARC, WikiText perplexity). Integrity:
   pin source commit; record harness version + task-YAML hashes in the manifest;
   same-invocation baseline (fp32/bf16) vs quantized runs with A/A nulls.
3. **`mit-han-lab/llm-awq` (`awq/`, `examples/convert_to_hf.py`)** and
   **`AutoGPTQ/AutoGPTQ` (`auto_gptq/nn_modules/qlinear/`)** — algorithm oracles for
   AWQ and GPTQ reference numerics respectively. Integrity: pin commits; per-kernel
   golden-output diff tests with tolerance; note the caveat: llm-awq has no CI and no
   `tests/` (stale push 2025-07-17) — its method is well-evidenced via the MLSys 2024
   paper's perplexity tables, its *engineering process* is not an oracle (see
   UNK-1 in Unknowns).
4. **`bitsandbytes-foundation/bitsandbytes`** — 8-bit/4-bit ops oracle via HF
   `transformers` adoption (`benchmarking/matmul_benchmark.py`,
   `tests/test_linear4bit.py`). Integrity: pin commit; `benchmarking/` baselines
   re-run under the localbench measurement law before any comparison.
5. **`pytorch/ao` (`torchao/prototype/gptq/`, `benchmarks/benchmark_gptq.py`,
   `benchmarks/benchmark_hqq.py`)** — framework-vendor oracle for "quantization as
   config" behavior. Integrity: pin commit; per-GPU regression workflow bodies read
   (not just named — evidence caveat: AutoGPTQ `test_quality.yml` turned out to be a
   format check, so every oracle workflow body must be read before citation).

Integrity machinery (modeled on the truth-pack shape): `docs/truth-pack/` holds
`PIN_RECORD.md` (oracle pin + paper/weights date asymmetry noted, cf. tts),
`MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json` (break-even perplexity-delta and
speedup thresholds, pre-computed), `NONDETERMINISM_FLOOR.md`, and
`fetch-truth-pack.sh --verify`. Invocation-time oracle binary SHA-256 recorded in
every receipt (model-guides §2: no un-recorded executable is admissible).

## Initial claims (CLAIM-*)

Type-process claims (about the category's engineering norms, not single-repo
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-1 | Serious quantization repos keep one benchmark per kernel family on real model-layer GEMM shapes, not toy shapes. | AutoGPTQ/AutoGPTQ `tests/bench_autoawq_autogptq.py`; bitsandbytes-foundation/bitsandbytes `benchmarking/matmul_benchmark.py`; ggml-org/llama.cpp `tools/llama-bench/`, `benches/` | T0 | High | ADMISSIBLE |
| CLAIM-2 | Perplexity on WikiText-class corpora is the canonical first-line quality-degradation metric, and downstream zero-shot tasks are reported alongside it, never alone. | ggml-org/llama.cpp `tools/perplexity/`; EleutherAI/lm-evaluation-harness `lm_eval/tasks/`; AWQ/GPTQ papers' WikiText2/PTB/C4 practice | T0 | High | ADMISSIBLE |
| CLAIM-3 | Kernel correctness is regression-tested against pinned reference tensors with per-backend diff tolerances. | AutoGPTQ/AutoGPTQ `tests/test_q4.py` (`CUDA_OLD_REFERENCE` asserts) | T0 | High | ADMISSIBLE |
| CLAIM-4 | Multi-backend CI separates build smoke (per PR) from GPU-correctness numerics (nightly, self-hosted). | ggml-org/llama.cpp 58 workflows in `.github/workflows/`; bitsandbytes `tests-pr.yml`/`tests-nightly.yml`; pytorch/ao `1xH100_tests.yml`, `regression_test_rocm.yml` | T0 | High | ADMISSIBLE |
| CLAIM-5 | Framework-embedded quantization is exposed as config flags, each method backed by a quantize→eval script. | pytorch/ao `benchmarks/benchmark_gptq.py`, `benchmarks/benchmark_hqq.py`; NVIDIA/TensorRT-LLM `examples/` quantization scripts; huggingface/optimum | T0 | High | ADMISSIBLE |
| CLAIM-6 | Each supported format ships a documented golden-path example (full-precision → quantized artifact) run as CI smoke. | mit-han-lab/llm-awq `examples/convert_to_hf.py`; AutoGPTQ/AutoGPTQ `examples/` + `docs/`; bitsandbytes-foundation/bitsandbytes `examples/` | T0 | High | ADMISSIBLE |
| CLAIM-7 | Lint/format gates are independent of GPU CI. | bitsandbytes `.github/workflows/lint.yml` + `.clang-format`; ggml-org/llama.cpp `.clang-format`, `.clang-tidy`, `.flake8`, pre-commit | T0 | High | ADMISSIBLE |
| CLAIM-8 | Competitive speedup claims require the incumbent backend running side-by-side in the same invocation, with both binary SHA-256s recorded and dual A/A nulls within [0.98, 1.02]. | model-guides §3 (whisper PERF_LEDGER result-class doctrine) applied to kernel benchmarks — adopted corpus doctrine, not observed in a quantization repo | T3 | Low | CONTESTED |
| CLAIM-9 | The category has converged on GPTQ/AWQ-class 4-bit weight formats as the reference methods, with momentum moving downstream into serving frameworks. | vllm-project/vllm, NVIDIA/TensorRT-LLM, pytorch/ao absorbing GPTQ/AWQ kernels; AutoGPTQ last push 2025-04-11 (maintenance mode) | T0 | High | ADMISSIBLE |
| CLAIM-10 | No cross-device class performance ratio (e.g., CPU vs GPU) may be reported; each ratio is pinned to its host backend. | model-guides §4 [NO ADMISSIBLE RATIO] (tts) generalized — adopted corpus doctrine, not observed in a quantization repo | T3 | Low | CONTESTED |
| CLAIM-11 | Perplexity/accuracy numbers quoted in evidence must name the eval set and hardware; structural guidance ("which eval pattern") is better evidenced than specific numeric guidance. | Evidence caveat: perplexity result tables were not read/exhaustively verified; tooling existence was confirmed | T0 | Medium | CONTESTED |
| CLAIM-12 | Quantized artifacts must carry write-time origin binding (source weights SHA-256 + recipe + converter version) verified at load. | model-guides §1 (ocr `.focrq` `source_sha256` header, nlp `.fnlpq` staged recipes) — pattern imported from sibling packets, not yet observed in a quantization repo | T3 | Low | CONTESTED |

**CLAIM-10/11 are CONTESTED** because the evidence file confirmed tooling existence
but did not read specific perplexity tables or workflow bodies; CLAIM-12 is
CONTESTED because no quantization repo in the evidence set demonstrates origin
binding — it is a portable pattern from the model-packet family that this type
should adopt, labeled as import. No claims withdrawn at S2.

## Gate profile

G1–G14 applicability mapped against the canonical definitions
(PROJECT-PICKUP-PLAYBOOK.md; `_s0/g1-g14-reference.md`). UNK-3 is resolved —
the S2 "mapped by function" note is superseded:

- **G1 ORACLE — load-bearing, as-is.** Oracle inventory = multiple pins
  (runtime oracle, eval oracle, algorithm oracle) each with SHA-256 in
  `kit-oracle.yml`; `fetch-truth-pack.sh --verify` fails the gate if any
  pin is unrecorded.
- **G2 PAIR — load-bearing, as-is.** Paired validation = like-for-like
  numeric peer (GATE-Q3, nlp's "forbidden matched quantization" rule:
  4-bit weight-only vs 4-bit weight-only, never vs fp16 as if it were
  the same program).
- **G3 OWN — load-bearing for CUDA/C++ kernel work.** New ownership/
  allocation sites in kernel code classified in `ownership.tsv`.
- **G4 CONTRACT — load-bearing, as-is.** CI-only conformance harness from
  `kit-contracts.yml` in a `.git`-less staged-tree copy.
- **G5 HOST — load-bearing, as-is.** Measurement law: preflight
  busy-machine refusal, CONTENDED marking, one unit under test;
  host/generation binding.
- **G6 UNSAFE — load-bearing for Rust components** (`// SAFETY:` per new
  site; tree-wide inventory); N-A with reason for pure-CUDA/Python trees.
- **G7 REVIEW — advisory; the type-specific analog is diff-only review on sensitive kernel/numerics changes**, recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK — load-bearing, as-is.** Bulk porting declared in
  `kit-rulebook.yml`.
- **G9 IOU — as-is.** Positive loop bound; no unresolved IOUs at the gate.
- **G10 MIRI — as-is where Rust exists**; otherwise `rust: false` with reason.
- **G11 LAYOUT — load-bearing for Rust/C++** (`size_of`/`align_of` or
  static_asserts on layout structs); N-A for Python-only with reason.
- **G12 AUDIT — as-is.** Fix-class eradications in `kit-audits/*.audit`;
  exemptions in `exemptions.tsv`.
- **G13 NOSTUB — load-bearing, as-is.** Stub markers in added lines block
  (a stubbed kernel is a correctness hole).
- **G14 REJECT — load-bearing, as-is.** Claims-registry linter + negative-
  evidence ledger: every comparative sentence registered before
  publication; kills carry resurrection predicates; retractions stay
  in-tree; claims cited above their tier's burden are rejected.

Type-parameterized extensions (not new gates): golden immutability
(banked only by A/A ceremony; golden regeneration is a named forbidden
pattern); invocation-time binary SHA-256 recording; result-class doctrine
(SELF-SPEEDUP vs CAMPAIGN WIN); A/A tolerance rule
`max(3×A/A relative spread, floor)` with per-metric floors (perplexity =
relative floor, latency = absolute floor, kernel numeric diffs = absolute
LSB-class floor); conformance MUST (quantize script completes on the
pinned model, produces a loadable artifact, golden-output diffs within
tolerance) / SHOULD (downstream task delta reported, speedup ≥ acceptance
surface); perf-ledger admission (CV≤5% on latency rows plus a minimum
token count for perplexity rows so small corpora cannot certify
degradation claims); skip honesty (XFAIL≠SKIP; no green without weights).

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (model truth-pack / oracle integrity) | Load-bearing | Perplexity/quality claims rest on pinned corpora + reference tensors; truth-pack required |
| GATE-003 (quantization quality-loss budget) | Load-bearing | Applies to this slug; pre-committed quality budgets are the type's core |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Load-bearing | Per-backend kernel baselines + toolchain pins must be attributable |
| GATE-018 (flake quarantine) | Advisory | Deterministic kernel benches; quarantine with label, not blocking by default |

New type-specific gates (GATE-Q*):

- **GATE-Q1 Method-script completeness.** Acceptance: for each supported method,
  one command quantizes the pinned model, emits perplexity delta + kernel speedup
  + artifact, exiting non-zero on any missing piece. Rejects "notebook-only"
  methods (llm-awq process-thin pattern).
- **GATE-Q2 Kernel-shape realism.** Acceptance: every benchmarked kernel lists the
  real model-layer shapes (K/N/M) and their source model; a benchmark whose shapes
  are all synthetic fails. Evidence: AutoGPTQ Yi-34B down_proj shapes as exemplar.
- **GATE-Q3 Matched-quantization comparison.** Acceptance: a quantized route may be
  compared only against its like-for-like numeric peer (nlp's "forbidden matched
  quantization" rule — e.g., a 4-bit weight-only kernel against another 4-bit
  weight-only kernel, never against fp16 as if it were the same program).
- **GATE-Q4 Golden-path example CI.** Acceptance: every supported format's
  golden-path example runs in CI (smoke tier) on every PR that touches the
  conversion path; a format with an untested example is listed as
  `[TARGETED]`, not shipped.

## Evidence tiers

Rulebook five-tier vocabulary (model-guides §5) instantiated for quantization:

- **[Verified]/[Git-observed]** — commit hashes, file paths, workflow names actually
  read; e.g., AutoGPTQ `tests/test_q4.py` asserts read, workflow bodies read (not
  just named — the `test_quality.yml` lesson).
- **[Verified]/[Counted]** — numbers the harness produced itself under the
  measurement law (perplexity deltas, GEMM times, diff values) with banked receipts.
- **[Verified]/[Code-verified]** — kernel numerics reproduced from the pinned source
  commit; bit-exact or within the committed diff tolerance.
- **[CI-observed] (Tier 2)** — the suite *ran* in a recorded workflow; attests
  execution, not green, not correctness.
- **[Maintainer claim]** — perplexity/speedup tables in papers/README without
  reproduction (e.g., llm-awq's MLSys paper tables); citable as T2, never as goldens.
- **[External]** — lm-evaluation-harness task scores computed by the harness itself;
  third-party replications of a method's numbers.
- **[Inference]** — anything derived, e.g., "momentum moved downstream" from push
  dates (must be labeled; push-date inference is weak evidence).

Pickup-tier mapping (canonical): T0 [Verified] = the [Verified] flavors
above (Git-observed, Counted, Code-verified); T1 [CI-observed] = the suite
*ran* in a recorded workflow; T2 [Maintainer claim]/[External] =
papers/README tables and third-party scores not reproduced by us;
T3 [Inference] = derived judgments, always labeled.

Vendor docs (NVIDIA/TensorRT-LLM recipes, PyTorch/ao docs) are admissible as
incumbent pins but count as T2 [Maintainer claim] unless reproduced in-tree.

## Localbench bench shape

1. **Spec format** — `backend:method:precision:model@pin`, e.g.
   `cuda:awq:int4-wonly:llama-8b@a1b2c3`, `cpu:gptq:int4-wonly:llama-8b@a1b2c3`,
   `mlx:q4_0:default:llama-8b@a1b2c3`. Backend names the exact kernel family and
   device class; the harness starts/stops the runtime itself.
2. **Tiers** — `conf` (artifact loads, header/verifies), `kernel` (GEMM/GEMV per real
   layer shape vs reference numerics), `perplexity` (WikiText-class delta vs
   fp32/bf16 golden), `eval` (lm-eval-harness downstream task deltas), `e2e`
   (quantize→serve→score on the pinned model). Goldens bind per tier; a kernel
   update re-banks only `kernel` + downstream tiers.
3. **Golden schema** — `conformance` (MUST: artifact loads, per-kernel diff ≤ tol,
   perplexity row exists; SHOULD: speedup ≥ acceptance surface, eval deltas within
   budget) + `metrics` (each with `value`, `spread` from A/A, `tol`, `tol_source` →
   banked receipt path, `better` direction).
4. **Banking ceremony** — `aa <spec> --write-golden` only; per-metric floors:
   perplexity relative floor, latency absolute floor, kernel diff absolute LSB
   floor; tolerance rule `max(3 × A/A relative spread, floor)`; golden-regeneration
   forbidden pattern named verbatim in AGENTS.md.
5. **Host/generation binding** — `goldens/<host_id>/`; never across hosts or
   generations (runtime/kernel version bump = new generation).
6. **Measurement law** — preflight refuses busy machines (>25% GPU/CPU, names
   processes); CONTENDED marking; one unit under test; GPU thermal soak before
   latency rows; loopback-only.
7. **A/B discipline** — same-invocation A, B, A ordering; incumbent method in the
   room for CAMPAIGN-class rows (e.g., GPTQ kernel vs AWQ kernel on the same shapes).
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, perplexity, kernel, eval, run) + dated `.md` notes;
   `runs/` gitignored with `<ts>__<kind>__<spec>` dirs.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact versions + hashes of
   runtime (llama.cpp commit / vLLM / TensorRT-LLM), oracle binaries, model weights
   revision, lm-eval-harness commit, OS, driver, CUDA.
10. **Claims wiring** — `registries/claims.tsv` machine-checked against receipts on
    every commit.
11. **Negative-evidence ledger** — failed methods recorded with resurrection
    predicates (copy tts FrankenMTP pattern: "a 4-bit route killed for regression,
    resurrection = measured acceptance above X").
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in AGENTS.md,
    plus a type-specific 13th: **benchmark-shape gaming** (replacing real layer
    shapes with favorable synthetic ones to clear GATE-Q2).

**Remote-lab variant:** kernel-benchmark tiers may run on self-hosted GPU runners
when the local host lacks the device class — the measurement law is unchanged;
a GPU tier banked on a remote host is `UNAVAILABLE` on local hosts, never compared.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **Files:** `docs/truth-pack/` template (PIN_RECORD.md with weights/oracle date
   asymmetry note, MANIFEST.sha256, ACCEPTANCE_SURFACE.json with perplexity-delta
   and speedup break-even thresholds, NONDETERMINISM_FLOOR.md,
   fetch-truth-pack.sh --verify); `benches/<kernel-family>/` directory convention
   with a `SHAPES.md` per bench naming real model-layer shapes and their source
   model; `tools/perplexity/` harness wrapper; one `scripts/quantize_<method>.py`
   (or `.sh`) per method with fire-CLI args; `docs/evidence/incumbents.md`;
   `registries/claims.tsv` + evidence-state vocabulary doc.
2. **Gates:** GATE-Q1–Q4 (method-script completeness, kernel-shape realism,
   matched-quantization comparison, golden-path example CI) added as type gates;
   the perf-ledger admission gate parameterized with CV≤5% + minimum perplexity
   token count.
3. **Harness shapes:** per-kernel golden-output diff test template (reference
   tensors + max-diff/mean-relative-diff asserts, per backend); same-invocation
   A/B/A duel template with binary SHA-256 capture; lm-eval-harness adapter
   (baseline + quantized, task list from ACCEPTANCE_SURFACE); artifact header
   with write-time `source_sha256` + recipe hash (moving toward hash-chained
   provenance).

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Verified repos (star snapshot 2026-09-23; all verified live via GitHub REST API):

1. `ggml-org/llama.cpp` — 129,316 — dominant portable quantized-inference runtime;
   58 CI workflows, per-backend build+test matrices (`tools/quantize/`,
   `tools/perplexity/`, `tools/llama-bench/`).
2. `vllm-project/vllm` — 92,527 — largest serving framework consuming quantized
   kernels; `benchmarks/` + 14 GH Actions workflows; where quantized models run in
   production.
3. `microsoft/onnxruntime` — 21,915 — quantization as table-stakes feature
   (`onnxruntime/python/tools/quantization/`, per-ep CI).
4. `EleutherAI/lm-evaluation-harness` — 14,062 — the category's quality-degradation
   measurement substrate (`lm_eval/tasks/`); not a quantizer, cited by every
   serious quant repo.
5. `NVIDIA/TensorRT-LLM` — 14,703 — vendor flagship standardizing INT4/FP8
   GPTQ/AWQ recipes into production kernels (`triton_kernels/`, `examples/`).
6. `bitsandbytes-foundation/bitsandbytes` — 8,499 — 8-bit/4-bit quantization via HF
   `transformers`; `benchmarking/` + `tests/test_linear4bit.py`,
   `test_linear8bitlt.py`.
7. `AutoGPTQ/AutoGPTQ` — 5,067 — canonical GPTQ packaging; pluggable 4-bit kernels
   under `auto_gptq/nn_modules/qlinear/`; per-kernel golden reference asserts in
   `tests/test_q4.py`.
8. `mit-han-lab/llm-awq` — 3,639 — canonical AWQ reference (MLSys 2024 Best Paper);
   `awq/`, `examples/convert_to_hf.py`; **process-thin**: no CI, no `tests/`,
   push 2025-07-17 — copy its method, not its engineering.
9. `huggingface/optimum` — 3,494 — quantization exposed as config flags in hub
   tooling (ONNX/OpenVINO configs), 15 workflows; ecosystem normalization.
10. `pytorch/ao` — 2,985 — framework-vendor absorption of the category
    (`torchao/prototype/gptq/`, `benchmarks/benchmark_gptq.py`, per-GPU regression
    workflow set).

**Honest caveats (carried over):** llm-awq is process-thin — method well-evidenced,
engineering not a model to copy; perplexity/accuracy numbers were sampled, not
exhaustively verified — "which eval set, which tolerance" is structural guidance,
not numerically grounded; AutoGPTQ (push 2025-04-11) is in maintenance mode —
kernel ideas live on inside vLLM/TensorRT-LLM/pytorch-ao; star counts for llama.cpp,
vllm, onnxruntime inflate the category trend — category-specific evidence rests on
awq/GPTQ/bitsandbytes/torchao, flagships show normalization; workflow names are
verified but bodies were not all read (AutoGPTQ `test_quality.yml` was a format
check — read before citing CI as "eval CI").

## Unknowns (UNK-*)

- **UNK-1** Which exact AWQ commit (if any) is a trustworthy algorithm oracle, given
  `mit-han-lab/llm-awq` has no CI/tests and is stale (push 2025-07-17)? Options:
  paper-tables-as-oracle, an AutoGPTQ-era AWQ kernel port, or a downstream
  (vLLM/TensorRT-LLM) AWQ implementation. Must resolve before banking any AWQ
  golden.
  **Disposition: TARGETED.** [Integrator triage, 2026-09-23 — lane B did not cover this row; verdict is the integrator's, flagged for parent re-triage] AWQ algorithm-oracle selection parked: S2 oracle pinning evaluates the three candidate classes (paper tables as oracle, AutoGPTQ-era AWQ kernel port, downstream vLLM/TensorRT-LLM AWQ implementation); the pinned oracle commit is recorded in PIN_RECORD.md; no AWQ golden is banked until the oracle is pinned. Owner: plan author. S3 step: oracle pinning.
- **UNK-2** What are the canonical perplexity floor values and minimum token counts
  for certifying a perplexity-delta claim? The evidence file confirmed tooling
  (`tools/perplexity/`, lm-eval task YAMLs) but did not read specific result tables;
  ACCEPTANCE_SURFACE.json needs numerically grounded break-even thresholds.
  **Disposition: TARGETED.**
- **UNK-3** [RESOLVED 2026-09-23, S4 round 1] Starter-kit G1–G14 canonical
  definitions are now in PROJECT-PICKUP-PLAYBOOK.md (from
  `_s0/g1-g14-reference.md`); the gate profile above is reconciled to the
  canonical definitions.
  **Disposition: RESOLVED.**
- **UNK-4** Which device classes a new project must physically possess vs. rent:
  the category's CI norm is self-hosted GPU runners (bitsandbytes, pytorch/ao,
  llama.cpp Metal/CI-self-hosted); a pickup that cannot run GPU correctness tiers
  locally has no credible kernel golden. Remote-lab variant boundaries are sketched
  but not costed.
  **Disposition: TARGETED.**
- **UNK-5** Do not-claim boundary for "quality degradation is negligible": the
  category reports perplexity + downstream deltas, but no evidence-defined
  negligibility threshold was found; declaring one without packet evidence would be
  T3 at best.
  **Disposition: ADVISORY.**
