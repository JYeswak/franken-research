# Pickup companion: Structured-output / constrained decoding

Type: model-serving › structured-output. One of the 21 pickup types the
44-repo FrankenSuite corpus does not cover.

## Charter seed

**What this project type is.** A constrained-decoding engine (or front-end adapter
stack over such engines) that forces a language model's token stream to satisfy a
formal constraint — JSON Schema, regex, CFG/grammar, or a DSL that lowers to one
of those — with correctness argued at the token-bitmask level, not at the
prompt level. The category has consolidated into two layers: constraint engines
(e.g. xgrammar's token-bitmask FSM) and front-ends/adapters (e.g. outlines'
backend-pluggable v1.x architecture, vLLM's per-backend adapters).

**In scope.** Grammar/schema→mask compilation; schema→grammar conversion
correctness; token-bitmask FSM correctness (accept/reject); cache correctness
across schema/tokenizer changes; constraint-compilation safety (timeouts,
worst-case pathological schemas); overhead measurement (compile + mask-gen
timing) on a scheduled benchmark; per-backend conformance against one shared
constraint semantics; composition with serving features (speculative decoding,
chunked prefill); DSL/lowering unit tests.

**Out of scope.** Model-quality evaluation (WER-style or human-judgment eval —
not applicable; the output is machine-checkable); cloud API adapter behavior as
an oracle (adapters exist for test coverage, not as ground truth); prompt-level
"please output JSON" as a substitute for a constraint engine; serving-layer
throughput claims presented as library SLAs (no repo publishes those —
overhead is tracked as CI artifacts, per evidence caveats).

**What "a good starting point" means for this type.** A new project can (a)
quote a repo's schema→grammar conversion as a golden byte-exact artifact, (b)
run the same constraint suite against every backend adapter, (c) argue
mask-equivalence differentially against an independent validator (Pydantic
round-trip style), (d) gate pathological inputs at compile time before the
serving loop, and (e) bank overhead goldens from A/A runs, not from one-shot
measurements.

### Requirements

- **REQ-1** Split test suites into core-engine unit tests (native) and
  binding/integration tests (Python), per the xgrammar layout.
- **REQ-2** Maintain per-backend conformance suites that run identical
  constraint semantics against every engine adapter (outlines `tests/backends/`,
  vLLM `tests/v1/structured_output/` pattern).
- **REQ-3** Golden-file snapshot tests for schema→grammar conversion, with a
  re-parse check of the expectation through the grammar parser
  (llama.cpp `test-json-schema-to-grammar.cpp` pattern).
- **REQ-4** Differential validation of matcher output against an independent
  ground-truth validator, with the validator pinned as an oracle (xgrammar
  Pydantic round-trip pattern).
- **REQ-5** Compilation-timeout / worst-case safety tests for constraint
  compilation (vLLM `test_regex_compilation_timeout.py` pattern).
- **REQ-6** Scheduled (nightly) benchmark measuring constraint overhead
  (compile + mask generation, warmup iters) uploaded as artifacts, excluded from
  the correctness CI critical path (xgrammar `.github/workflows/benchmark.yaml`
  pattern; heavy `test_pressure.py`-style conformance also gated off the
  critical path via CI skip).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all named in the evidence file):

1. **llama.cpp reference grammar sampler** — `common/json-schema-to-grammar`,
   `llama-grammar`, and the five grammar test binaries
   (`tests/test-grammar-{parser,integration,llguidance,llama-grammar}.cpp`,
   `tests/test-json-schema-to-grammar.cpp`) in ggml-org/llama.cpp.
2. **Independent validator round-trip** — Pydantic-style
   (xgrammar `tests/python/test_grammar_matcher_json_schema.py` pattern:
   build model, serialize, validate matcher output against it), with
   `xgrammar.testing._is_grammar_accept_string` as the helper oracle.
3. **Per-backend conformance harness** — the shared-semantics suites in
   dottxt-ai/outlines `tests/backends/` and vLLM
   `tests/v1/structured_output/` as behavioral oracle surfaces.
4. **Guidance mock-model grammar tests** — guidance-ai/guidance
   `tests/unit/test_grammar.py` with `models.Mock()` byte-prefix assertions
   (constraint-logic oracle decoupled from real inference).

**Integrity checks (truth-pack shape, per model-guides.md):**

- `docs/truth-pack/PIN_RECORD.md` — pinned oracle source commits (e.g.
  llama.cpp commit + schema-to-grammar version; Pydantic/validator version),
  dated, with the honest pin-age note (cf. tts).
- `docs/truth-pack/MANIFEST.sha256` — SHA-256 of every oracle artifact the
  harness executes.
- `docs/truth-pack/ACCEPTANCE_SURFACE.json` — pre-committed thresholds:
  mask-equivalence pass criteria, compilation-timeout ceilings, overhead
  budget bands (measured, not asserted — caveat below).
- `docs/truth-pack/NONDETERMINISM_FLOOR.md` — which checks are byte-exact
  (schema→grammar goldens, mask generation on fixed seeds) vs.
  distribution-level (sampling with temperature).
- `fetch-truth-pack.sh --verify` — portable fetch/verify; invocation-time
  recording of the oracle binary's SHA-256 (whisper CAMPAIGN-WIN pattern —
  a benchmark run whose oracle SHA was not recorded is diagnostic-only).
- Differential-fuzzer oracle gap (UNK-1 in Unknowns): no repo in the evidence set
  runs a documented generative differential fuzzer (random grammar → compare
  masks against a reference parser); xgrammar's `test_pressure.py` is
  workload-based load testing, not mask-equivalence fuzzing. A clean-room
  project should add one, but there is no verified in-ecosystem oracle harness
  to pin — the integrity procedure for the fuzzer's own reference parser is an
  open design question.

## Initial claims (CLAIM-*)

About the type's process norms, not single-repo marketing. Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] / T1 [CI-observed] / T2 [Maintainer claim]/[External] / T3 [Inference].

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-1 | The category has split into constraint engines vs front-end adapter stacks. | dottxt-ai/outlines v1.x backend-pluggable architecture + `tests/backends/`; mlc-ai/xgrammar consumed by vLLM (`vllm/v1/structured_output/backend_xgrammar.py`) and outlines (`tests/backends/test_xgrammar.py`) | T0 | High | ADMISSIBLE |
| CLAIM-2 | Per-backend conformance testing (same constraint semantics, every adapter) is the type's norm for correctness. | outlines `tests/backends/test_xgrammar.py`, `test_llguidance.py`, `test_outlines_core.py`, `test_backends.py`; vLLM `tests/v1/structured_output/` | T0 | High | ADMISSIBLE |
| CLAIM-3 | Schema→grammar conversion is held to byte-exact golden snapshots, including a re-parse of the expectation. | ggml-org/llama.cpp `tests/test-json-schema-to-grammar.cpp` (+ `verify_expectation_parseable()`) | T0 | High | ADMISSIBLE |
| CLAIM-4 | Engine unit tests are split from binding/integration tests by language layer. | mlc-ai/xgrammar `tests/cpp/` (test_fsm.cc, test_parser.cc, test_regular_grammar_fsm.cc) vs `tests/python/` (33 files) | T0 | High | ADMISSIBLE |
| CLAIM-5 | Constraint logic is tested decoupled from real inference via mock models. | guidance-ai/guidance `tests/unit/test_grammar.py` (`models.Mock()`, byte-prefix assertions) | T0 | High | ADMISSIBLE |
| CLAIM-6 | Compilation-safety tests guard pathological constraints before the serving loop. | vllm-project/vllm `tests/v1/structured_output/test_regex_compilation_timeout.py` | T0 | High | ADMISSIBLE |
| CLAIM-7 | Grammar-compilation cache correctness is tested across schema/tokenizer changes. | outlines `tests/test_cache.py`; vLLM `tests/v1/structured_output/test_outlines_cache.py` | T0 | High | ADMISSIBLE |
| CLAIM-8 | Guided decoding is tested in composition with speculative/multi-token prediction, not in isolation. | vLLM `tests/v1/spec_decode/test_mtp_structured_output.py`; xgrammar `tests/python/test_speculative_decoding.py` | T0 | High | ADMISSIBLE |
| CLAIM-9 | Constraint overhead is measured on a scheduled benchmark (compile + mask-gen), tracked as CI artifacts. | mlc-ai/xgrammar `.github/workflows/benchmark.yaml` + `examples/benchmark/cibench_grammar_compile_mask_gen.py`; vLLM `benchmarks/benchmark_serving_structured_output.py` (`--structured-output-ratio`) | T0 | High | ADMISSIBLE |
| CLAIM-10 | Heavy conformance/pressure runs exist but are explicitly gated off the CI critical path. | xgrammar `tests/python/test_pressure.py` (`pytest.mark.skipif(_running_in_ci(), ...)`) | T0 | High | ADMISSIBLE |
| CLAIM-11 | Differential validation against an independent ground-truth validator is practiced for matcher output. | xgrammar `tests/python/test_grammar_matcher_json_schema.py` (Pydantic `MainModel` round-trip; `xgrammar.testing._is_grammar_accept_string`) | T0 | High | ADMISSIBLE |
| CLAIM-12 | Constraint-DSL lowering is unit-tested at the spec-language level, not only at the sampler. | outlines `tests/types/test_dsl.py`, `tests/types/test_to_regex.py`, `tests/types/test_json_schema_utils.py` | T0 | High | ADMISSIBLE |
| CLAIM-13 | No repo publishes a committed per-token decoding-overhead SLA; overhead is measured, not asserted. | evidence caveats: xgrammar nightly benchmark and vLLM serving benchmark are CI artifacts, not doc-committed budgets | T0 | High | ADMISSIBLE |
| CLAIM-14 | A documented generative differential fuzzer (random grammar → mask equivalence vs reference) is absent from the ecosystem. | evidence caveats: "Fuzzing: thin" — closest is workload-based `test_pressure.py` | T0 | High | ADMISSIBLE |
| CLAIM-15 | The earliest generation (jsonformer, "Bulletproof JSON") is dead upstream and is trend history, not a process model. | 1rgs/jsonformer, last push 2024-02-24 | T0 | High | ADMISSIBLE |

## Gate profile

Rebuilt 2026-09-23 (S4 round 2) against the playbook's canonical G1–G14
operational definitions (the round-1 by-gate-class mapping below is
superseded by this per-gate map):

- **G1 ORACLE — load-bearing:** the oracle inventory (conformance corpus,
  schema→grammar golden snapshots, independent-validator fixtures) is
  declared in `kit-oracle.yml`; renaming an oracle file out of the oracle
  directory counts as weakening.
- **G2 PAIR — load-bearing:** schema→grammar conversion and token-mask
  generation change together per `paired-ops.tsv` — a grammar change with
  no matching mask-generation change fails the pair check.
- **G3 OWN — load-bearing:** new mask-buffer/allocation sites classified in
  `ownership.tsv` with evidence.
- **G4 CONTRACT — load-bearing:** the CI-only conformance harness runs in a
  `.git`-less staged-tree copy.
- **G5 HOST — load-bearing:** ambient/host reads and new unsafe code
  declared in the same diff.
- **G6 UNSAFE — conditional:** load-bearing for Rust/C++ components
  (xgrammar, llama.cpp grammar): every new unsafe site carries
  `// SAFETY:`; pure-Python components record advisory/N-A with reason.
- **G7 REVIEW — load-bearing:** constraint-semantics and mask-logic changes
  require a diff-only review artifact; for non-Rust components the same
  artifact is recorded as a G7-analog parameter, not a redefinition.
- **G8 RULEBOOK — load-bearing:** bulk porting declared and evidenced via
  `kit-rulebook.yml`.
- **G9 IOU — load-bearing:** positive loop bound in `kit-loops.yml`; no
  unresolved structured IOUs at the phase gate.
- **G10 MIRI — conditional:** CI-only `cargo miri test` for Rust
  components; non-Rust components set `rust: false`.
- **G11 LAYOUT — conditional:** load-bearing for layout-sensitive Rust
  structs (mask/state representations) — `size_of`/`align_of` assertions;
  advisory for pure-managed implementations.
- **G12 AUDIT — load-bearing:** fix-class eradications declared in
  `kit-audits/*.audit`; exemptions live in `exemptions.tsv`.
- **G13 NOSTUB — load-bearing:** specified stub markers in added lines
  block; a fake double with no behavior is a stub and fails.
- **G14 REJECT — load-bearing:** each claimed safety property has rejection
  evidence in `kit-rejections.tsv`.

The type's type-specific parameters on the above: any performance/overhead gate must bind
*overhead as a measured artifact band* (per CLAIM-13: measured on nightly
benchmarks, CI artifacts, never asserted as an SLA in docs) — the gate
accepts "overhead tracked within banked A/A tolerance" and rejects
"committed per-token budget in user docs". Any composition gate
(speculative/multi-token prediction × guided decoding) must name the
composition matrix explicitly, since xgrammar and vLLM test it pairwise.

**Proposed new type-specific gates:**

- **GATE-SO-1 — Mask-equivalence differential gate.** Acceptance: for every
  schema/regex in the conformance corpus, the engine's token-bitmask admits
  exactly the strings an independent validator (pinned oracle, truth-pack)
  accepts, on a seeded fixed-tokenizer run. Failure class: silent divergence
  between constraint semantics and enforcement.
- **GATE-SO-2 — Constraint-compilation worst-case gate — RETIRED into shared GATE-004** (S4 round 1, dedup). GATE-004 acceptance (4) already requires constraint-compilation timeout/worst-case safety tests. Retained as a type-specific parameter: pathological inputs (nested regexes, adversarial JSON schemas) compile within a pre-committed ceiling or are rejected with a clean error before reaching the serving loop; vLLM's compilation-timeout pattern is the floor.
- **GATE-SO-3 — Cache-invalidation gate — RETIRED into shared GATE-004** (S4 round 1, dedup). GATE-004 acceptance (4) already requires cache correctness tests. Retained as a type-specific parameter: cache keys bind (schema hash, tokenizer identity, engine version); a change in any invalidates; tested across schema/tokenizer changes (outlines/vLLM cache test pattern).
- **GATE-SO-4 — Overhead-band gate.** Acceptance: compile + mask-gen timing
  measured on the scheduled benchmark stays within the A/A-banked tolerance
  band per tier; results uploaded as artifacts. Rejects doc-asserted SLA
  numbers without a banked receipt (per CLAIM-13).

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), mapped to the
localbench/packet vocabulary
([Verified]: [Counted]/[Git-observed]/[Code-verified]; [Maintainer claim];
[External]; [Inference]).

- **T0 [Verified]** — in-repo, verified-live evidence: per-backend
  conformance suites, byte-exact schema→grammar goldens, differential
  Pydantic round-trips, compilation-timeout tests, nightly overhead
  benchmark artifacts, all observed in the GitHub tree (api.github.com
  repo metadata + contents/tree listings, 2026-09-23). This is the type's
  working evidence base — [Code-verified]/[Git-observed].
- **T1 [CI-observed]** — suites that executed on CI / banked receipts:
  nightly overhead-benchmark artifacts, scheduled conformance runs. Attests
  the suite *runs*, not that it is green and not that numbers are
  admissible.
- **T2 [Maintainer claim]** — numbers or guarantees published by an engine
  vendor (docs, release notes) with no pinned reproducible run, and
  maintainer statements about overhead or correctness not tied to a pinned
  run (e.g. guidance-era docs). Admissible only as [Maintainer claim]; never
  gates a CAMPAIGN-class comparison; must be demoted if contradicted by T0.
- **T3 [Inference]** — "the fuzzer we will add", "SLA we intend to hold".
  nlp-style TARGETED labeling required: zero measured numbers by written
  policy until a kernel/bench exists. Never gates a release.

Tier mobility: demotions always allowed; T2/T3 numbers may not support
public competitive claims (whisper PERF_LEDGER rule).

## Localbench bench shape

- **Spec format** — `engine:<engine>@<pin>:tok=<tokenizer id>` (e.g.
  `engine:xgrammar@<sha>:tok=llama-3.1-8b`). The harness starts/stops the
  serving backend itself; loopback/local-only endpoints (localbench
  measurement law); a failed local call is a finding, never a cloud fallback.
- **Named tiers** — `dsl` (constraint-DSL lowering unit checks),
  `grammar` (schema/regex/CFG → grammar goldens, byte-exact),
  `mask` (mask-equivalence differential vs pinned validator, seeded),
  `overhead` (compile + mask-gen timing, A/A-banked),
  `composition` (guided decoding × speculative/multi-token prediction),
  `pressure` (large-grammar workloads; CI-skipped by default, nightly only).
  Goldens bind PER TIER; an engine update invalidates only the tiers it
  touches (re-bank those tiers only).
- **Golden layout** — JSON per spec: `conformance` (named checks, each
  `level: MUST|SHOULD`, `verdict: PASS|FAIL`) + `metrics` (each with
  `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt path,
  `better` direction). MUSTs: mask-equivalence on the conformance corpus,
  schema→grammar byte-exact goldens, compilation-timeout ceiling,
  cache-invalidation across schema/tokenizer changes.
- **Tolerance rule** — `tol = max(3 × A/A relative spread, floor)`, with a
  higher floor on `overhead` (mask-gen timing is noisier than grammar
  compilation) and an exact floor of zero allowed on `grammar` byte-exact
  checks.
- **A/B discipline** — same-invocation A, B, A ordering; banked under a
  name; dual A/A nulls required in [0.98, 1.02] for any CAMPAIGN-class
  comparative claim (whisper PERF_LEDGER rule). Engine binary + oracle
  binary SHA-256 recorded at invocation time; an un-recorded run is
  diagnostic-only (whisper 2026-08-11 precedent).
- **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%,
  names the processes); runs marked CONTENDED if any non-backend process
  exceeds 25% GPU in a second; one unit under test at a time; park/unpark
  interfering residents during test windows.
- **Machine-state / contention receipts** —
  `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json` (kinds: aa, ab,
  run, overhead) + dated `.md` investigation notes; `runs/` is gitignored
  scratch with `<ts>__<kind>__<spec>` dirs. Host/generation binding:
  `goldens/<host_id>/`; status reports CURRENT / GENERATION-MISMATCH /
  UNAVAILABLE per golden.
- **Banking ceremony** — goldens written ONLY by an A/A pair run
  (`aa <spec> --write-golden`), followed by `git diff goldens/` review in
  the same commit. Golden-regeneration-until-green is a named forbidden
  pattern. Incumbent pins in `docs/evidence/incumbents.md` (engine pin,
  tokenizer, harness, OS). Claims wired via `registries/claims.tsv`,
  machine-checked against receipts on every commit. Negative-evidence
  ledger: `docs/evidence/NEGATIVE_EVIDENCE.md` with kill + resurrection
  predicates and retractions kept in-tree.

## Starter-kit deltas

- **New files:** `docs/truth-pack/` for constraint projects (PIN_RECORD.md,
  MANIFEST.sha256, ACCEPTANCE_SURFACE.json with pre-committed
  mask-equivalence/timeout/overhead thresholds, NONDETERMINISM_FLOOR.md
  separating byte-exact from distribution-level checks, fetch-truth-pack.sh
  --verify); `tests/backends/` per-backend conformance layout; golden
  schema→grammar snapshot directory with re-parse verification helper.
- **New gates:** GATE-SO-1 and GATE-SO-4 kept (above); GATE-SO-2/GATE-SO-3
  retired into shared GATE-004.
- **Harness shapes:** a differential-validation harness template (validator
  round-trip in the xgrammar Pydantic pattern); a compilation-timeout
  harness for pathological inputs (vLLM pattern); a scheduled nightly
  overhead benchmark job (xgrammar `benchmark.yaml` pattern) decoupled from
  correctness CI; a mock-model test harness for constraint logic without
  real inference (guidance pattern); a `test_pressure.py`-style
  CI-skipped heavy-conformance slot.
- **Load-bearing vs advisory:** GATE-SO-1 (mask-equivalence) and shared
  GATE-004 (with the retained compilation-worst-case parameter: a
  pathological-input ceiling before the serving loop) are load-bearing —
  this type's correctness is binary and a silent mask divergence or a
  compile-time DoS is a ship blocker. GATE-SO-4 (overhead band) is
  advisory at S2, load-bearing at S5 once A/A goldens exist.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-004 (structured-output grammar conformance + fuzz) | Load-bearing | Applies to this slug; conformance + pathological-input ceiling are the type's core |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-017 (spec / schema surface drift) | Advisory | Schema→grammar surface changes get diff-reviewed but are not the load-bearing surface |
| GATE-018 (flake quarantine) | Advisory | Conformance suites are deterministic; quarantine with label, not blocking by default |

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Stars snapshot 2026-09-23, all verified via api.github.com repo metadata +
contents/tree listings that day; file pointers are paths observed live in
those trees.

- **dottxt-ai/outlines** — 15,877 stars. Category flagship; v1.x rewrote
  around a backend-pluggable architecture with per-backend conformance
  suites (`tests/backends/`) — the category is consolidating around shared
  engine backends.
- **mlc-ai/xgrammar** — 1,925 stars. Purpose-built constrained-decoding
  engine (token-bitmask FSM from JSON Schema/regex/CFG), shipped as a
  library consumed by vLLM and outlines — the engine-vs-front-end split.
- **guidance-ai/guidance** — 21,775 stars. Highest-starred; grammar/template
  guided generation with `tests/unit/test_grammar.py`; a vLLM structured
  output backend. Last push 2026-05-21 (~4 months stale); its grammar core
  has effectively moved to the shared-engine model.
- **ggml-org/llama.cpp** — 129,316 stars. Reference C++ grammar-constrained
  sampler (`common/json-schema-to-grammar`, `llama-grammar`) with five
  dedicated grammar test binaries — the byte-exact golden-file norm.
- **vllm-project/vllm** — 92,527 stars. Serving layer treats structured
  output as first-class: `vllm/v1/structured_output/` per-backend adapters
  (all four verified in the repo tree), full `tests/v1/structured_output/`
  suite, serving benchmarks with tunable constraint ratio.
- **noamgat/lm-format-enforcer** — 2,041 stars. Small focused token-level
  enforcer vendored as a vLLM backend — even tiny constraint engines get
  production adoption.
- **1rgs/jsonformer** — 4,939 stars. Early "Bulletproof JSON" generation;
  dead upstream since 2024-02-24 — trend history only, not a process model.

**Caveats carried over (honest):** fuzzing is thin — no documented
generative differential fuzzer for grammar→mask equivalence (UNK-1);
overhead is measured as CI artifacts, never published as library SLAs;
guidance is ~4 months stale and its core has migrated to shared engines;
jsonformer is dead; nothing here was cited from memory.

## Unknowns (UNK-*)

- **UNK-1** Integrity procedure for a generative differential fuzzer
  (random grammar → mask equivalence vs a reference parser): no verified
  in-ecosystem harness to pin; the fuzzer's own reference-parser oracle
  needs a truth-pack design before S5.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Differential-fuzzer integrity parked: S3 pins the reference-parser oracle and constructs the fuzzer against it; red-then-green on a mutant class before any equivalence claim. Promotion predicate: at S3 bench setup, pin the reference-parser oracle (xgrammar.testing._is_grammar_accept_string at a pinned xgrammar commit, hashed in MANIFEST.sha256) in the truth pack; construct the generative differential fuzzer against it; demonstrate red-then-green on a mutant grammar class; untested grammar classes typed UNKs. Owner: plan author. S3 step: bench setup.
- **UNK-2** The starter kit's exact G1–G14 gate texts were not available to
  this author at S2; the gate-profile map was rebuilt against the playbook's
  canonical operational definitions in S4 round 2, but that rebuilt map
  awaits S4 confirmation.
  **Disposition: TARGETED** — still open; must not be marked RESOLVED until
  the promotion predicate is met (promotion predicate: S4 round confirms the
  per-gate G1–G14 map against the playbook's canonical operational
  definitions).
- **UNK-3** Whether byte-exact schema→grammar goldens transfer across
  grammar-dialect versions (llama.cpp grammar syntax evolves) — the golden
  re-banking policy for upstream grammar-version bumps is unresolved.
  **Disposition: TARGETED.**
- **UNK-4** Admissible floor values for the overhead tier's tolerance rule:
  mask-gen timing spread vs grammar-compile spread need measured A/A data
  before the floor is more than a guess.
  **Disposition: TARGETED.**
- **UNK-5** Whether differential validation against a Pydantic-style
  validator scales to CFG/regex constraints beyond JSON Schema — the
  evidence only demonstrates the JSON Schema case.
  **Disposition: ADVISORY.**
