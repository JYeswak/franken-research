# Pickup companion: Embedding-model serving

## Charter seed

**What this project type is.** Clean-room or assessment work on software that
turns text (and multimodal inputs: CLIP, CLAP, ColPali-class) into vectors and
serves them over an API: dense encoders, sparse encoders, cross-encoder
rerankers, and late-interaction/multi-vector models, running in a serving engine
(Rust, Python, C++/GGUF) with an OpenAI-compatible or task-specific endpoint.

**In scope.** Embedding inference path: tokenize → encode → pool → normalize →
serve; pooling-task correctness (embed, scoring, classify, reward, token_embed);
parity against a reference implementation; latency/throughput measurement on
pinned hardware; the supported-model registry as code; OpenAI-compatible API
surface conformance.

**Out of scope.** Training or fine-tuning models; vector-database indexing/ANN
search internals (that is the vector-database pickup type); the *quality* of
third-party model weights (admitted or not, not improved); multimodal
generation beyond embedding outputs.

**A good starting point means:** a `docs/truth-pack/` that binds a pinned
reference implementation, a pinned weight revision (this is where the project
does *better* than the industry, which does not pin revisions), and fixture
inputs with fixture expected vectors; a per-task test tree (embed / scoring /
classify / token_embed) with one-sided parity gates; a registry-as-code model
contract; PR-unit vs nightly-hardware CI split; a localbench bench shape whose
quality goldens are banked separately from speed goldens.

### Requirements

- **REQ-EMB-001 (truth pack with pinned weights).** The truth pack binds:
  reference-implementation source commit pin, model weight HF revision pin
  (revision hash, not floating `main`), tokenizer config, fixture inputs with
  expected output vectors hashed in MANIFEST.sha256, and fetch-truth-pack.sh
  --verify. Improvement over observed industry practice: every serving repo
  surveyed floats on Hub revisions.
- **REQ-EMB-002 (one-sided parity gates per pooling task).** Each pooling task
  (embed, scoring, classify, token_embed, plus rerank) has a pinned-baseline
  parity gate modeled on vLLM's STS12 gate: assert against a pinned reference
  score with fixed tolerance (5e-4 on score, ≤1e-3 on cosine sim), failing ONLY
  when worse than baseline — never for being better.
- **REQ-EMB-003 (registry-as-code).** Every supported model is a frozen registry
  entry: HF source, weight filename(s), pinned revision, dim, license,
  size_in_GB, pooling/normalization config. The registry is the supported-model
  contract; CI test matrices enumerate the registry; no unregistered model
  appears in tests.
- **REQ-EMB-004 (PR/network discipline).** PR CI runs with no Hub network access:
  Hub metadata is mocked (fake SHAs in conftest) like sentence-transformers.
  Full integration (real weights, real accelerators, load tests) runs on a
  nightly cron with pinned revisions. A PR job that hits the network fails.
- **REQ-EMB-005 (toolchain pinning).** Commit the lockfiles and pin the
  toolchain: rust-toolchain.toml + Cargo.lock, or uv.lock with `uv sync
  --locked`; CI actions pinned to commit SHAs.
- **REQ-EMB-006 (bench shape).** Instantiate the localbench shape (§7) with
  spec naming `backend:model@rev:task:hw`; quality goldens banked from A/A
  pairs, never regenerated until green; incumbent oracle binary SHA-256
  recorded at invocation time.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

| Oracle candidate | Role | Evidence pointer |
|---|---|---|
| huggingface/sentence-transformers | Reference toolkit: dense, sparse, cross-encoder, multi-vector encoders + backend abstraction | `_evidence/embedding-serving.md` trend (19,112★); `tests/backend/`, `tests/{sentence_transformer,cross_encoder,multi_vector_encoder,sparse_encoder}/` |
| huggingface/text-embeddings-inference | Production serving engine oracle: router/, backends/, proto/ | `_evidence/embedding-serving.md` trend (5,058★); `.github/workflows/integration-test.yaml`, `integration_tests/`, `load_tests/` |
| vllm-project/vllm | Pooling-correctness harness oracle: per-task test trees + MTEB parity harness | `_evidence/embedding-serving.md` trend (92,527★); `tests/entrypoints/pooling/`, `tests/models/language/pooling_mteb_test/mteb_embed_utils.py` |
| michaelfeil/infinity | OpenAI-compatible API-server oracle: drop-in server behavior | `_evidence/embedding-serving.md` trend (2,945★); engine `libs/infinity_emb/`, nightly `.github/workflows/ci.yaml` |

**Integrity checks (truth-pack shape, per model-guides).** For each oracle:
`docs/truth-pack/PIN_RECORD.md` (oracle commit pin + weight HF revision pin +
the honest delta note if pins differ in age); `MANIFEST.sha256` covering oracle
source tarball, weight files, and fixture vectors; `ACCEPTANCE_SURFACE.json`
(pinned baseline scores + one-sided tolerances per pooling task);
`NONDETERMINISM_FLOOR.md` (dtype jitter band, batching-order nondeterminism);
`fetch-truth-pack.sh --verify` that fetches at the pinned revisions and verifies
every hash, failing closed on mismatch. **Invocation-time SHA-256 recording:**
every measurement receipt records the oracle binary's SHA-256 (whisper's CAMPAIGN
WIN rule: no recorded executable identity → no admissible performance verdict).
Oracle-scheduling gap (UNK-EMB-003 in Unknowns): whether vLLM's MTEB parity
test is admissible as an oracle harness is unverified for CI scheduling — its
"in the suite" status is not pinned to per-PR or nightly, so treat its score
as reference, not gate evidence, until scheduling is verified.

**Canonical weight-revision pin format** [RESOLVED 2026-09-23, S4 round 3 —
UNK-EMB-002 triaged RESOLVED, normative per REQ-EMB-001 and the playbook
truth-pack spec]: (a) the HF revision hash is recorded in `PIN_RECORD.md`;
(b) weight blobs are content-addressed by SHA-256 in `MANIFEST.sha256`;
(c) the frozen registry entry (REQ-EMB-003) carries the revision hash as its
pin field.

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, evidenced only from the evidence file.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-EMB-001 | The strongest automated quality gate observed is a single-task, one-sided MTEB parity check (STS12, pinned score 0.7422994752439667, tol 5e-4), not a blocking multi-dataset benchmark gate. No per-PR MTEB/BEIR blocking gate was found anywhere. | vllm-project/vllm: `tests/entrypoints/pooling/embed/test_correctness_mteb.py`, `tests/models/language/pooling_mteb_test/mteb_embed_utils.py` (MTEB_EMBED_TASKS=["STS12"], MTEB_EMBED_TOL=5e-4) | T0 | High | ADMISSIBLE |
| CLAIM-EMB-002 | One-sided assertions are the norm: parity gates fail only when worse than the pinned baseline, never for being better. | Same pointers as CLAIM-EMB-001; one-sided assert described in evidence caveats | T0 | High | ADMISSIBLE |
| CLAIM-EMB-003 | Embeddings are a first-class inference-server workload with per-task test trees: separate dirs per pooling task (embed/scoring/classify/reward/token_embed), each with offline + online + long-text + dimension variants plus shared factories. | vllm-project/vllm: `tests/entrypoints/pooling/` tree | T0 | High | ADMISSIBLE |
| CLAIM-EMB-004 | PR-unit vs nightly-hardware-matrix split: cheap paths-scoped unit tests on push/PR; full Docker-build + pytest integration on nightly cron against real accelerators, with a separate `load_tests/` suite. | huggingface/text-embeddings-inference: `.github/workflows/test.yaml`, `.github/workflows/integration-test.yaml` (cron `0 0 * * *`), `load_tests/`, `integration_tests/gaudi/test_embed.py` | T0 | High | ADMISSIBLE |
| CLAIM-EMB-005 | Model-registry-as-code is the supported-model contract: frozen dataclasses recording HF source, weight filenames, dim, license, size_in_GB; the registry makes test matrices enumerable. | qdrant/fastembed: `fastembed/common/model_description.py` | T0 | High | ADMISSIBLE |
| CLAIM-EMB-006 | Benchmark-your-own-bench discipline: a fixed multi-dataset suite maintained in-repo (31 datasets) with per-release numbers reported in the README changelog; model iteration is gated on the suite, not vibes. | FlagOpen/FlagEmbedding: `research/C_MTEB`, README changelog citing MTEB / C-MTEB / BEIR / MIRACL | T0 | High | ADMISSIBLE |
| CLAIM-EMB-007 | Toolchain pinning is standard: rust-toolchain.toml + Cargo.lock committed, uv.lock with `uv sync --locked`, CI actions pinned to commit SHAs. | huggingface/text-embeddings-inference, huggingface/sentence-transformers (see process table) | T0 | High | ADMISSIBLE |
| CLAIM-EMB-008 | Unit tests must not touch the network: Hub metadata is mocked (fake fixed SHAs in conftest) so PR CI is hermetic. | huggingface/sentence-transformers: `tests/conftest.py` (`_fake_model_info`) | T0 | High | ADMISSIBLE |
| CLAIM-EMB-009 | Weight-revision pinning is WEAK industry-wide: none of the serving repos pin HF revisions in test configs; reproducibility rests on pinned toolchains/scores, not pinned weights. A clean-room project treats this as a gap to exceed, not copy. | huggingface/text-embeddings-inference: `integration_tests/gaudi/test_embed.py` (`"model_id": "BAAI/bge-large-en-v1.5"`, no `revision`); qdrant/fastembed: `ModelSource(hf=…, url=…)` no revision | T0 | High | ADMISSIBLE |
| CLAIM-EMB-010 | Test layout is organized by encoder class: one package per model family (dense, cross-encoder, multi-vector, sparse) with shared conftest fixtures, plus a dedicated backend test package for the compute abstraction. | huggingface/sentence-transformers: `tests/{sentence_transformer,cross_encoder,multi_vector_encoder,sparse_encoder,backend,util}/` | T0 | High | ADMISSIBLE |
| CLAIM-EMB-011 | The drop-in OpenAI-compatible embedding API server is an established pattern: server + nightly CI + client libraries, and local GGUF serving behind `/v1/embeddings`. | michaelfeil/infinity (`libs/client_infinity`, `libs/embed_package`); abetlen/llama-cpp-python (`create_embedding`/`embed`, `/v1/embeddings`) | T0 | High | ADMISSIBLE |
| CLAIM-EMB-012 | Serving-benchmark configs are checked into the repo per hardware/task (serving, throughput, latency suites). | vllm-project/vllm: `.buildkite/performance-benchmarks/tests/` (`serving-tests-cpu-embed.json`, `throughput-tests-*.json`, `latency-tests-*.json`) | T0 | High | ADMISSIBLE |
| CLAIM-EMB-013 | Reranker and late-interaction quality gates are thin: rerankers/ColPali-class models are served, but public CI shows generic unit/e2e stages, not reranker-specific quality gates. | thin: evidence file notes reranker/late-interaction CI specifics are thin across michaelfeil/infinity and huggingface/text-embeddings-inference; best pointers are sentence-transformers `tests/multi_vector_encoder/` and vllm `tests/entrypoints/pooling/token_embed/` | T0 | High | ADMISSIBLE |

## Gate profile

**G1–G14 applicability.** All 14 gates apply; type-specific notes below.

- **G1 ORACLE** — applies as-is. Oracle inventory = the four candidates above;
  post-pin changes need the two-party waiver; the oracle is shielded from the
  implementing agent (parity harness lives outside the implementation tree).
- **G2 PAIR** — applies as-is and is load-bearing: every quality claim is a
  same-invocation differential against the pinned oracle (A/B/A), with the
  oracle binary SHA-256 recorded.
- **G3 OWN** — applies as-is; every CLAIM-EMB row gets an owning bead.
- **G4 CONTRACT** — applies as-is; claim artifacts are the receipt JSONs with
  the R7 fields.
- **G5 HOST** — applies as-is and is load-bearing: goldens bind per
  `<host_id>`; GPU/driver/CPU-governor provenance on every absolute number;
  cross-host comparison is a named violation.
- **G6 UNSAFE** — advisory for this type (little unsafe code in a typical
  embedding server beyond FFI bindings); fires if the project writes kernels.
- **G7 REVIEW** — advisory; the type-specific analog is adversarial review of parity-tolerance choices (tolerances are the easiest thing to game), recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — applies as-is; bound to the claim registry.
- **G9 IOU** — applies as-is; zero unresolved at close.
- **G10 MIRI** — advisory; fires only for Rust unsafe blocks (e.g. custom
  kernels in a TEI-class engine).
- **G11 LAYOUT** — load-bearing for Rust components (the flagship oracle
  `huggingface/text-embeddings-inference` is a Rust engine: layout assertions
  on wire-format/pooling structs via `size_of`/`align_of`); N/A with evidence
  for pure-managed implementations. The type-specific analog is
  format-stability assertions on the registry-as-code file and truth-pack
  paths (schema drift fails the gate), recorded as a review parameter, not a
  claim that canonical G11 applies as-is.
- **G12 AUDIT** — applies as-is; class-fix = fix the tolerance/registry
  machinery, then re-audit instances.
- **G13 NOSTUB** — applies as-is; no stubbed pooling tasks (a pooling task
  directory with only `pass` is a fail).
- **G14 REJECT** — applies as-is and is load-bearing: T2 self-reported
  benchmark numbers (e.g. README changelog scores) can never support a
  competitive claim; only T1 parity receipts can.

**Proposed new type-specific gates.**

- **GATE-EMB-PARITY (one-sided parity gate).** Every pooling task with a pinned
  baseline MUST have an automated one-sided parity check (fail only when worse
  than baseline beyond the committed tolerance). Acceptance: gate runs in CI
  against the pinned oracle weights; a green gate with the baseline deliberately
  degraded (mutant: swapped weight file) must turn red — the gate is
  mutant-tested.
- **GATE-EMB-REGISTRY (registry completeness).** No model is referenced in
  code, tests, CI configs, or docs without a frozen registry entry carrying
  source + pinned revision + dim + license + size. Acceptance: a linter
  enumerates all model-ID strings in the tree and every one resolves to a
  registry entry; CI fails otherwise.
- **GATE-EMB-NETISOL (PR network isolation) — RETIRED into shared GATE-014** (S4 round 1, dedup). GATE-014 acceptance (3) already requires the unit tier to run with zero credentials and zero network. Retained as a type-specific parameter: PR/push CI jobs run with no route to the Hub (egress blocked or mocked); any socket attempt to a Hub host fails the job; a canary test asserting Hub unreachability passes in the PR job and would fail if the mock layer were removed.
- **GATE-EMB-AA (A/A null admission).** A/B comparisons are admitted only if
  the same-invocation A/A null lands in [0.98, 1.02] on the primary metric
  (whisper's dual-null rule, ported). Acceptance: the harness refuses to bank
  a comparison row on a null violation and logs NO ADMISSIBLE VERDICT.

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] with
[Counted]/[Git-observed]/[Code-verified] flavors; T1 [CI-observed] — attests
the suite *runs*, not that it is green; T2 [Maintainer claim]/[External];
T3 [Inference].

- **T2 [Maintainer claim].** Model cards, repo READMEs, changelog score lines
  (FlagEmbedding's per-release MTEB numbers). Admissible only as provenance of
  *what the vendor claims*, never as evidence the number holds. [Maintainer
  claim].
- **T0 [Verified].** Git-observed CI files and Code-verified test code from
  third-party repos (vLLM's parity harness, TEI's workflow split, fastembed's
  registry, sentence-transformers' conftest mocks); locally produced parity
  receipts against a pinned oracle with recorded binary SHA-256; Counted items
  (31 datasets in `research/C_MTEB`, per-task test dirs). This is the only tier
  that can support competitive or correctness claims.
- **T2 [Maintainer claim]** — numbers reported by a project's own README/CI
  without an independently runnable harness — e.g. FlagEmbedding's changelog
  scores (repo has essentially no test CI: `.github/workflows/` is
  `documentation.yml` only), TEI's nightly results as reported rather than
  reproduced.
- **T3 [Inference].** TARGETED gates with no harness yet (e.g. a
  reranker-specific quality gate — none was found), unverified scheduling
  claims ("in the suite" for vLLM's MTEB test). May appear in the registry only
  with status TARGETED, never green.

Numerics rule (from nlp's anti-lie construction): dtype/batch-size profiles are
named fixtures — a bf16-server vs fp32-oracle vector diff is a *named profile
mismatch*, not a build failure; "matches oracle" claims are owned by one named
numerics profile (e.g. `oracle-fp32-eager`) with explicit cast points.

## Localbench bench shape

1. **Spec format.** `backend:model@rev:task:hw` — e.g.
   `tei:BAAI/bge-large-en-v1.5@a5b8f2c:embed:gaudi2`,
   `vllm:intfloat/e5-small@9c3a1d0:token_embed:h100`.
   The harness starts/stops the server itself; `rev` is mandatory (industry
   floats; we do not).
2. **Tier list.** `conf` (config/API conformance: OpenAI `/v1/embeddings`
   shape, error paths), `micro` (single-request encode, one pooling task),
   `replay` (fixture batch vs banked expected vectors), `e2e` (full server
   boot → client library round-trip, infinity-style), `rel` (nightly hardware
   matrix, full pooling-task tree + load test), `mem` (peak RSS/VRAM per
   model@rev). Goldens bind PER TIER; a server update re-banks only tiers it
   touches. The multi-vector (late-interaction) tier is OPTIONAL at plan time
   [RESOLVED 2026-09-23, S4 round 3 — UNK-EMB-005 triaged RESOLVED]; it is still
   fully specified here (named tier, spec format, per-tier goldens) and
   promotes to mandatory iff a future trend review shows dedicated
   late-interaction quality gating in CI at ≥2 serving engines.
3. **Golden schema.** Per spec: `conformance` (named checks, `level:
   MUST|SHOULD`, `verdict: PASS|FAIL` — MUSTs include: vector dim matches
   registry, one-sided parity within tolerance, API shape conformance) +
   `metrics` (`value`, `spread` from A/A, `tol`, `tol_source` → banked receipt,
   `better` direction). **Tolerance rule:** `tol = max(3 × A/A relative
   spread, floor)`; quality floors: 5e-4 on benchmark score (vLLM's precedent),
   1e-3 cosine on vectors. Quality and speed bank in SEPARATE goldens — a
   speedup that moves quality is two claims, not one.
4. **Banking ceremony.** Goldens written ONLY by `aa <spec> --write-golden`
   (A/A pair → banked receipt + golden; refuses unsound A/A pairs), followed by
   `git diff goldens/` review in the same commit. Golden-regeneration-until-green
   is the named forbidden pattern.
5. **Host binding.** `goldens/<host_id>/`; never compared across hosts or
   generations; CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden.
6. **Measurement law.** Preflight refuses a busy machine (>25% GPU/CPU, names
   processes); runs marked CONTENDED on interference; one server under test at
   a time; loopback/local-only endpoints; park/unpark residents. For this type:
   preflight also refuses if the weight `rev` is unpinned (floating Hub ref)
   or if the oracle binary SHA-256 was not recorded.
7. **A/B discipline.** Same-invocation A, B, A ordering against the pinned
   oracle; A/A null must land in [0.98, 1.02] (GATE-EMB-AA) or the comparison
   is not banked.
8. **Receipts.** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run, parity) + dated `.md` notes; `runs/` gitignored
   scratch.
9. **Incumbent pins.** `docs/evidence/incumbents.md`: oracle binary SHA-256,
   oracle source commit, weight HF revision, server/harness versions, tokenizer
   version, CUDA/driver, OS, host_id.
10. **Claims wiring.** `registries/claims.tsv`: every public claim sentence
    registered and machine-checked against its receipt each commit.
11. **Negative evidence.** `NEGATIVE_EVIDENCE.md` (kills carry resurrection
    predicates), `DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`;
    demotions always allowed; no self-grading without independent verification.
12. **Anti-reward-hacking.** The 12 forbidden patterns verbatim in AGENTS.md;
    type-specific watch items: tolerance widening (G7 review surface), floating
    weight revisions passed off as pinned, easy pooling tasks cherry-picked as
    the whole gate.

## Starter-kit deltas

**Files to add (templates, not implementations).**

- `docs/truth-pack/` skeleton with an embedding-specific `PIN_RECORD.md`
  template (oracle commit pin + weight HF revision pin + age-delta honesty
  note), `ACCEPTANCE_SURFACE.json` template (per-pooling-task baseline scores +
  one-sided tolerances), `NONDETERMINISM_FLOOR.md` template (dtype jitter,
  batching-order), `MANIFEST.sha256` template, `fetch-truth-pack.sh --verify`
  template.
- Pooling-task test-tree scaffold `tests/entrypoints/pooling/` with
  `embed/`, `scoring/`, `classify/`, `token_embed/` stubs that FAIL (G13) until
  implemented, plus shared `test_factories.py` / `test_utils.py` and an
  OpenAI-client MTEB encoder wrapper modeled on vLLM's
  `mteb_embed_utils.py`.
- Registry-as-code template `src/model_registry.py` (frozen dataclasses:
  source, revision, weight files, dim, license, size_in_GB, pooling config)
  plus the GATE-EMB-REGISTRY linter.
- CI workflow pair template: PR workflow (paths-scoped, network-isolated,
  mocked Hub) + nightly workflow (cron, builds server image, runs
  `integration_tests/` + `load_tests/` on real accelerators), modeled on TEI's
  `test.yaml` / `integration-test.yaml` split.
- `tests/conftest.py` mock-Hub template (fake fixed SHAs, after
  sentence-transformers) for the GATE-014 network-isolation canary.
- localbench spec templates for the six tiers (§7) with the quality/speed
  golden split.

**Gates to add.** GATE-EMB-PARITY, GATE-EMB-REGISTRY, shared GATE-014 (NETISOL parameter),
GATE-EMB-AA (§5) — all four are load-bearing for this type; G6 UNSAFE and
G10 MIRI drop to advisory.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-001 (inference-serving benchmark harness) | Load-bearing | Serving engines ship re-runnable benchmark harnesses; the flagship oracle is a Rust engine with integration tests |
| GATE-002 (model truth-pack / oracle integrity) | Load-bearing | Claims rest on pinned oracle weights; registry + pins required (see GATE-EMB-REGISTRY) |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Load-bearing | Toolchain + vendored-core pins for Rust serving components |
| GATE-018 (flake quarantine) | Advisory | Deterministic parity suites; quarantine with label, not blocking by default |

**Harness shapes.** Same-invocation A/B/A duel runner that records both
binaries' SHA-256; one-sided parity assertion helper (`assert_not_worse_than`);
A/A null checker ([0.98, 1.02]); claims.tsv checker wired to receipts.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Verified live 2026-09-23 (star counts point-in-time; re-verify if quoted later).

| owner/repo | ★ | Process takeaway |
|---|---|---|
| vllm-project/vllm | 92,527 | Embeddings are a first-class serving workload: per-task pooling test trees + a single-task MTEB parity gate with one-sided 5e-4 tolerance — the strongest automated quality practice found. |
| huggingface/sentence-transformers | 19,112 | The reference toolkit: encoder-class test layout, backend abstraction tests, mocked Hub metadata for hermetic unit CI, action-SHA-pinned workflows. |
| FlagOpen/FlagEmbedding | 12,188 | Benchmark-your-own-bench discipline (31-dataset `research/C_MTEB`, per-release README scores) — but essentially no test CI; process value is the reporting discipline, not automation. |
| abetlen/llama-cpp-python | 10,631 | The edge/local half: GGUF embedding serving behind an OpenAI-compatible `/v1/embeddings` API. |
| huggingface/text-embeddings-inference | 5,058 | Production serving layer with the cleanest CI split: cheap PR unit tests vs nightly hardware-matrix integration + load tests; committed lockfiles. |
| stanford-futuredata/ColBERT | 3,942 | Reference late-interaction implementation anchoring the multi-vector side; slower cadence than the serving repos around it. |
| qdrant/fastembed | 3,213 | Registry-as-code done right: frozen dataclass model descriptions (dim, license, size_in_GB) that make test matrices enumerable; the "fast local embedding" sub-trend. |
| michaelfeil/infinity | 2,945 | The drop-in embedding API server pattern: engine + OpenAI-compatible API + client libs on reusable nightly CI. |

**Honest caveats (carried over).** Nobody runs MTEB/BEIR as a blocking per-PR
CI gate — the real pattern is parity/consistency tests in CI plus benchmark
numbers reported per release; claiming "benchmark gates in CI" would overstate.
FlagEmbedding's value is reporting discipline, not CI structure (workflows are
docs-only). Weight-revision pinning is weak everywhere — treat as a gap to
exceed, not a practice to copy. Reranker/late-interaction quality gates are
thin; the multi-vector test packages are the best pointers, not full gates.
Late-interaction trend strength comes more from infinity/TEI/fastembed
supporting multi-vector models than from ColBERT itself (last push
2025-10-14). Star counts and push dates are point-in-time 2026-09-23.

## Unknowns (UNK-*)

- **UNK-EMB-001.** Which MTEB tasks beyond STS12 justify blocking-gate cost?
  Only STS12 was found automated; multi-task gating is T3 until a second task
  is cost-justified and mutant-tested.
  **Disposition: TARGETED.**
- **UNK-EMB-002.** What is the canonical weight-revision pin format? No repo
  pins revisions in-repo; undecided between `revision:` fields, lockfile-style
  weight manifests, or content-addressed caches. Must be decided before S5 —
  REQ-EMB-001 depends on it.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Canonical weight-revision pin format resolved (normative, from REQ-EMB-001 and the playbook truth-pack spec): (a) HF revision hash recorded in PIN_RECORD.md, (b) weight blobs content-addressed by SHA-256 in MANIFEST.sha256, (c) the frozen registry entry (REQ-EMB-003) carries the revision hash as its pin field. The three candidate serializations collapse onto the normative layout: revision: fields map to PIN_RECORD.md/registry entries; lockfile-style manifest maps to MANIFEST.sha256; content-addressed cache is the blob store the manifest addresses.
- **UNK-EMB-003.** vLLM's MTEB parity test CI scheduling is unverified ("in the
  suite" only). Unknown whether it runs per-PR or nightly; affects whether it
  can be cited as a gate precedent vs a reference harness — and whether the
  vLLM MTEB harness is admissible as a gate oracle.
  **Disposition: TARGETED.**
- **UNK-EMB-004.** What is the admissible reranker/late-interaction quality
  metric and threshold? No reranker-specific automated quality gate was found;
  metric + tolerance are open and block GATE-EMB-PARITY for the scoring/rerank
  tasks.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Reranker metric/threshold parked: provisional TARGETED threshold from S3 A/A-banked candidate metrics on a pinned rerank corpus; mutant-tested before promotion. Promotion predicate: at S3 bench setup, pin a rerank evaluation corpus in the truth pack, bank A/A goldens for candidate metrics (nDCG@k, MRR), commit a provisional one-sided threshold in ACCEPTANCE_SURFACE.json as TARGETED (fail-only-if-worse, vLLM STS12 pattern); promotion to OBSERVED after mutant-testing per the bench tolerance rule. Owner: plan author. S3 step: bench setup.
- **UNK-EMB-005.** Is late-interaction serving strong enough to require a
  mandatory multi-vector tier? Trend evidence is thinner than for dense
  serving; S5 must decide mandatory vs optional tier.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Multi-vector tier resolved as OPTIONAL at plan time (scoping decision, not an empirical unknown): the bench shape still fully specifies it (named tier, spec format, per-tier goldens per bench slot 2), so nothing is lost. Promotion to mandatory iff a future trend review shows dedicated late-interaction quality gating in CI at >=2 serving engines. Grounded in the pack's thinner-trend read.
- **UNK-EMB-006.** Does the type need a tokenization/truncation parity check?
  vLLM has long-text tests but no observed truncation-behavior oracle; whether
  long-input handling differences are a correctness or a documented-behavior
  question is unresolved. *(inference — flagged, not evidenced)*
  **Disposition: ADVISORY.**
