# Pickup companion: Agent observability/tracing

S2 companion for the planning-arc project-pickup playbook. Scope: OSS agent observability —
trace capture, span hierarchies, OTel ingestion, prompt/response logging, cost attribution,
run-transcript debugging, evals-on-traces. All repos, paths, and star counts below are from
`_evidence/observability.md` (verified live via the GitHub API 2026-09-23). No other source
was consulted for identifiers.

## Charter seed

**What this type is.** The substrate that records what an agent did, step by step: spans for
every model call / tool call / sub-agent turn, linked into run trees, with tokens, cost,
latency, prompts, outputs, and evals attached — viewable and queryable after the fact.
The industry's shared substrate is OpenTelemetry span conventions, not any single platform's
proprietary format (traceloop/openllmetry: 35+ per-provider instrumentation packages).

**In scope:** SDK instrumentation for LLM/agent frameworks; OTel span export paths (batching,
masking, context propagation); proxy-based capture; trace ingestion APIs + load behavior;
span↔run-tree hybrid models; streaming span lifecycle (open → tokens → close with usage
attributes); cost tracking with model-price tables; trace completeness rendering in the UI;
per-provider semantic-convention compliance; ingestion-loss and drop behavior.

**Out of scope:** the agent frameworks themselves (covered by agent-frameworks companion);
LLM eval methodology beyond evals-on-traces; generic APM/tracing (Jaeger/Tempo-class);
closed hosted backends with no OSS capture surface to copy (LangSmith core is closed —
only its client SDKs are in evidence).

**A good starting point** = a clean-room observability layer that (a) captures spans for a
small set of instrumented providers with zero data loss under the Opik load shapes,
(b) proves semantic-convention compliance per provider against VCR-cassette replay
(the OpenLLMetry pattern), (c) renders complete run trees end-to-end in its own UI,
and (d) cannot report a cost number whose price-table provenance is unverified.

### Requirements

- **REQ-OBS-001** — Capture path must be OTel-native: spans emitted per OpenTelemetry
  conventions, exported through a batch processor, with context propagation across
  framework boundaries (the OpenLLMetry / phoenix-otel / logfire pattern).
- **REQ-OBS-002** — Zero silent span loss: every span accepted by the SDK must be
  accounted for at the collector (delivered, batched, or explicitly dropped-and-counted);
  undelivered-without-record is a defect, not a metric.
- **REQ-OBS-003** — Streaming spans must close correctly with token-usage attributes
  (the openlit `test_openai_streaming_span_lifecycle.py` shape); a stream that never
  terminates must not hold a span open forever.
- **REQ-OBS-004** — Every public claim about cost carries a price-table pin and audit
  date; cost numbers computed against an unaudited table are inadmissible
  (the langfuse `model-price-audit.yml` shape).
- **REQ-OBS-005** — Trace completeness is a UI-verified property: ingested spans must
  render as complete run trees in the product UI, not merely return HTTP 200
  (the Opik `tests_end_to_end/{coverage,visual-tests}` shape).
- **REQ-OBS-006** — Recency filter on copied practices: only repos with commit activity
  in the trailing 90 days count as process models (the langtrace staleness warning).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Oracles here are conformance suites and replay fixtures from the evidence repos, not
reference model weights — the type has no "reference implementation"; interoperability
*is* the conformance surface.

| # | Oracle candidate | Pointer | What it proves |
|---|---|---|---|
| O1 | OpenLLMetry per-provider semconv compliance tests + VCR cassettes | `traceloop/openllmetry`, `packages/opentelemetry-instrumentation-openai/tests/traces/` (`test_semconv_compliance.py`, `test_span_context_propagation.py`, `cassettes/`; 35+ sibling packages repeat the pattern) | A capture implementation emits provider-correct spans, deterministic via replay |
| O2 | OpenLit streaming span-lifecycle tests | `openlit/openlit`, `sdk/python/tests/` (`test_openai_streaming_span_lifecycle.py`, `test_anthropic_stream_span_lifecycle.py`, `test_groq_stream_span_lifecycle.py`, `test_provider_version_hash_coverage.py`) | Streaming spans close and carry usage attributes |
| O3 | LangSmith SDK OTel exporter unit tests | `langchain-ai/langsmith-sdk`, `python/tests/unit_tests/test_otel_exporter.py`, `test_hybrid_tracing.py`, `test_span_utils.py`, `test_run_trees.py` | Export path: masking, batching, propagation, hybrid run-tree/span model |
| O4 | Opik ingestion-load suite | `comet-ml/opik`, `tests_load/suite/python_sdk/` (`test_ingestion_rate.py`, `test_bursts.py`, `test_heavy_payload.py`, `test_attachments.py`), methodology in `tests_load/README.md` (100k traces × 1 span, 250k spans, 1 GB heavy payloads, burst + concurrency) | Ingestion survives named load shapes on a real stack |
| O5 | Opik e2e coverage + visual tests | `comet-ml/opik`, `tests_end_to_end/{coverage,visual-tests}/`, `end2end_suites_v2.yml`; Arize-ai/phoenix `playwright.yaml` | Ingested spans render as complete traces in the UI |
| O6 | Langfuse model-price audit workflow | `langfuse/langfuse`, `.github/workflows/model-price-audit.yml` (daily cron) | Cost attribution stays correct as prices change |

**Integrity checks (truth-pack shape, per `docs/truth-pack/` convention).**

- `PIN_RECORD.md` — oracle repo pins: commit SHA + pin date 2026-09-23 for each of
  O1–O6; honest note that O1's cassette-based determinism depends on provider SDK
  versions at pin time (mirrors the tts 7-week pin-skew honesty note).
- `MANIFEST.sha256` — SHA-256 of every oracle fixture file (cassettes, load-shape
  payloads, price-table snapshots) committed in-tree.
- `ACCEPTANCE_SURFACE.json` — pre-committed break-even thresholds: max span-loss rate
  per load shape (O4), max acceptable ingestion latency p99 per shape, semconv
  assertion pass set (O1), streaming-span close completeness (O2).
- `NONDETERMINISM_FLOOR.md` — committed floor: live-provider runs are *never* oracle
  runs (cassettes only); streaming-token arrival jitter and collector batching make
  exact per-span timestamps non-reproducible — equality is asserted on span
  *structure and attributes*, not timestamps.
- `fetch-truth-pack.sh --verify` — re-fetches oracle pins, verifies MANIFEST hashes,
  refuses to proceed on mismatch (no silent re-pin).
- **Invocation-time oracle binary SHA-256 recording** — every bench arm records the
  SHA-256 of the capture SDK build and the collector build at invocation time; a
  measurement row without both recorded is diagnostic-only (the whisper
  NO-ADMISSIBLE-VERDICT rule applied to observability).

**UNK-OBS-001** — No neutral, cross-vendor LLM-agent OTel semconv conformance suite was
found in the evidence repos; O1 is the closest single-vendor suite. Interop claims
against "OTel" therefore have no independent oracle — only per-vendor suites.

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
Status: ADMISSIBLE / CONTESTED / WITHDRAWN. Claims are about the type's process norms.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-OBS-001 | Vendor-neutral OTel span conventions are the category's shared capture substrate, not per-platform proprietary formats | traceloop/openllmetry: 35+ packages under `packages/`; Arize-ai/phoenix `phoenix-otel`; pydantic/logfire OTel-based agent instrumentation | T0 | High | ADMISSIBLE |
| CLAIM-OBS-002 | Proxy-based capture (base-URL swap) is a second viable capture architecture alongside SDK instrumentation | Helicone/helicone (6,175 stars): proxy → request logs, cost, caching, evals | T0 | High | ADMISSIBLE |
| CLAIM-OBS-003 | The category's commercial core is closed by design: LangSmith's hosted backend is closed-source; only its client SDKs are open | langchain-ai/langsmith-sdk (1,063 stars, pushed 2026-09-23; `test_otel_exporter.py` shows the closed platform accepts OTel ingestion) | T0 | High | ADMISSIBLE |
| CLAIM-OBS-004 | "OTel-compatible" ingestion is asserted more than proven across the category: only OpenLLMetry was found (via file-list search) to ship explicit semconv-compliance tests | traceloop/openllmetry `packages/opentelemetry-instrumentation-openai/tests/traces/test_semconv_compliance.py`; absence elsewhere is file-list-level evidence only (unauthenticated code search unavailable — caveat from evidence file) | T0 | Medium | CONTESTED |
| CLAIM-OBS-005 | Ingestion-load benchmarking is the exception, not the norm: Opik's scheduled `tests_load/` suite is the only one found in the category | comet-ml/opik `.github/workflows/load_tests.yml` (weekly cron), `tests_load/suite/python_sdk/`, `tests_load/README.md` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-006 | Cost tracking needs its own scheduled correctness job because provider prices change under you | langfuse/langfuse `.github/workflows/model-price-audit.yml` (daily cron); comet-ml/opik `.github/workflows/span_cost_upload_daily.yml` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-007 | Trace completeness must be verified end-to-end in the UI, not inferred from API 200s | comet-ml/opik `tests_end_to_end/{coverage,visual-tests}/`, `end2end_suites_v2.yml`; Arize-ai/phoenix `playwright.yaml` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-008 | Per-integration CI matrices (~25 `lib-*-tests.yml` workflows at Opik) give cheap parallelism and clear ownership per supported framework | comet-ml/opik `lib-openai-tests.yml`, `lib-langchain-tests.yml`, `lib-crewai-v1-tests.yml`, `lib-adk-tests.yml`, … plus `installation_tests.yml` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-009 | Generating the OpenAPI/SDK spec from the server and diffing it in CI prevents client/server ingestion drift | langfuse/langfuse `.github/workflows/sdk-api-spec.yml`, `openapi-export-check.yml` (workflow listing verified) | T0 | High | ADMISSIBLE |
| CLAIM-OBS-010 | A recency filter is required before copying practices: stale repos (langtrace, last push 2025-11-17) look like models but are not | Scale3-Labs/langtrace: 1,232 stars, last push 2025-11-17 | T0 | High | ADMISSIBLE |
| CLAIM-OBS-011 | Streaming instrumentation needs explicit span-lifecycle tests: spans must close and carry token-usage attributes for streamed responses | openlit/openlit `sdk/python/tests/test_openai_streaming_span_lifecycle.py`, `test_anthropic_stream_span_lifecycle.py`, `test_groq_stream_span_lifecycle.py` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-012 | Splitting unit / e2e / live-provider tests into separate CI workflows keeps PR checks fast while heavy suites run scheduled/post-merge | langfuse/langfuse-python `tests/unit/`, `tests/e2e/`, `tests/live_provider/`; comet-ml/opik `python_sdk_unit_tests.yml`, `python_sdk_e2e_tests.yml`, `end2end_suites_v2.yml`, `tests_end_to_end/` with `TESTING-TAGS.md` | T0 | High | ADMISSIBLE |
| CLAIM-OBS-013 | The "closed backend with open capture SDK" pattern is the commercial norm across vendors, not just LangSmith | thin: Braintrust named in evidence as same-pattern but not re-verified; wandb/weave noted as not re-verified | T3 | Low | CONTESTED |

Count: 13 claims. CLAIM-OBS-013 is CONTESTED (not WITHDRAWN) — the pattern is plausible
but its cross-vendor generality rests on unverified names; it closes only when a second
vendor's open SDK surface is Git-verified.

## Gate profile

G1–G14 applicability to an observability clean-room start:

- **G1 ORACLE (as-is, load-bearing)** — pin the O1–O6 oracle inventory; post-pin changes
  need the two-party waiver; oracles shielded from the implementing agent.
- **G2 PAIR (as-is, load-bearing)** — differential validation: our spans vs oracle
  cassettes' spans (O1), our ingestion vs Opik load shapes (O4), same-invocation.
- **G3 OWN (as-is)** — every claim row names an owner via the R7 field.
- **G4 CONTRACT (as-is)** — claim artifacts conform to the registry schema; spec
  diffs (GATE-OBS-…) checked in CI.
- **G5 HOST (as-is, load-bearing)** — host-parity for bench numbers; one unit under
  test at a time (bench shape §7).
- **G6 UNSAFE (advisory)** — little unsafe-surface in this type; new unsafe
  sites are declared in the same diff as a labeled G6-analog per the playbook's
  Rust-centric-gates rule, only if native collector code appears.
- **G7 REVIEW (advisory)** — the type-specific analog is split-context adversarial review (default-refute), mandatory before any "OTel-compatible" claim is banked; recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK (as-is, load-bearing)** — claim discipline as a gate; the
  tier→burden mapping decides CLAIM-OBS-004-class statements.
- **G9 IOU (as-is)** — zero unresolved at close.
- **G10 MIRI (N/A)** — no Rust unsafe-memory contract in a pure capture-layer start;
  activates if a Rust collector component is added.
- **G11 LAYOUT (advisory)** — layout assertions only if binary artifacts ship.
- **G12 AUDIT (as-is)** — class-fix then instance re-audit (e.g. fix one provider's
  semconv gap, then re-audit all providers).
- **G13 NOSTUB (as-is)** — no stubbed providers or placeholder spans.
- **G14 REJECT (as-is, load-bearing)** — claims violating their Rulebook-tier burden
  are rejected; this is what keeps "OTel-compatible" marketing out of the registry.

**New type-specific gates (GATE-OBS-*):**

- **GATE-OBS-SEMCONV — RETIRED into shared GATE-010** (S4 round 1, dedup). GATE-010 acceptance (3) already asserts OTel semconv compliance per instrumented provider with deterministic replay cassettes. Retained as a type-specific parameter: every span attribute/key asserted against the pinned conventions; any provider addition without its compliance file fails the gate. Zero "spans exist" tautological tests.
- **GATE-OBS-INGEST** — Scheduled ingestion-load benchmark on a live local stack
  (O4 shape: 100k traces × 1 span, 250k spans, 1 GB heavy payload, burst +
  concurrency). Acceptance: span-loss rate and p99 ingest latency within the
  pre-committed ACCEPTANCE_SURFACE.json thresholds; loss without a drop-count
  record is a gate failure, not a metric.
- **GATE-OBS-COMPLETE — RETIRED into shared GATE-010** (S4 round 1, dedup). GATE-010 acceptance (1) already requires end-to-end trace-completeness tests verifying ingested spans render as complete traces. Retained as a type-specific parameter: seeded runs render as complete run trees in the product UI; every seeded span appears with parent linkage intact; visual/coverage suite green.
- **GATE-OBS-PRICE** — Scheduled model-price audit (O6 shape). Acceptance: daily job
  verifies the pinned price table against current provider pricing; any cost claim
  whose price-table audit is older than 7 days is demoted to T3.

Count: 2 new gates (GATE-OBS-INGEST, GATE-OBS-PRICE); GATE-OBS-SEMCONV and
GATE-OBS-COMPLETE retired into shared GATE-010 with retained type-specific
parameters.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-010 (trace completeness / privacy) | Load-bearing | Applies to this slug; trace completeness + span masking are the type's core (GATE-OBS-SEMCONV/COMPLETE retired into it) |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-018 (flake quarantine) | Advisory | Deterministic cassettes keep suites stable; quarantine with label, not blocking by default |
| GATE-OBS-INGEST (ingestion-load benchmark) | Load-bearing | Ingest loss/latency is the type's performance surface |
| GATE-OBS-PRICE (model-price audit) | Load-bearing | Cost claims depend on a fresh price table (stale audit = demote to T3) |

## Evidence tiers

Mapped to the canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md) with an
explicit cross-mapping to the localbench/Rulebook vocabulary: T0=[Verified],
T1=[CI-observed], T2=[Maintainer claim]/[External], T3=[Inference]
(`[CI-observed]` attests the suite *runs*, not that it is green).

- **T0 [Verified]** — Direct inspection of a fresh clone / GitHub API
  response / live page. Admissible: star counts and push timestamps from
  `api.github.com` (as in the evidence file); file presence verified via the
  contents endpoint; workflow cron schedules read from workflow YAML. This is
  the tier backing CLAIM-OBS-001–012.
- **T1 [CI-observed]** — A CI workflow (e.g. Opik's `load_tests.yml`,
  Langfuse's `model-price-audit.yml`) observed in the workflow listing and
  configured to run. Attests the suite is scheduled, not that it passes.
  Admissible for "practice exists" claims; never for "practice is green"
  claims.
- **T2 [Maintainer claim] / [External]** — README/docs assertions:
  "OTel-compatible", "one-line integration", feature lists (admissible only
  as *claims about what the vendor says*; interop claims stay here until a
  semconv test file (shared GATE-010 shape) moves them to T0); independent
  sources: third-party benchmarks of ingestion throughput, teardown analyses,
  HN/engineering-blog writeups. Absence of independent load benchmarks for
  this category is itself a finding (cf. CLAIM-OBS-005).
- **T3 [Inference]** — Analyst judgment, always labeled: e.g. "proxy vs SDK
  capture have different loss characteristics" (no cross-architecture loss
  benchmark found — inference, not evidence). Never supports a public claim.

Type-specific admissibility notes: per-symbol assertions inside test files
("this test asserts attribute X") require authenticated code search or a fetched
file body — file-name-level evidence caps at [Verified]-of-presence, not
[Verified]-of-behavior (evidence-file caveat carried over). Span screenshots and
marketing "trace waterfall" images are [Maintainer claim], never completeness proof;
only the O5-shaped e2e suite counts.

## Localbench bench shape

Instantiating the 13 localbench slots for observability:

1. **Spec format** — `capture:collector` naming exactly what is measured, e.g.
   `py-sdk@<git-sha>:otel-collector@0.129:local-stack` (SDK build, collector build,
   local stack compose pin). The harness starts/stops the collector and the SDK
   under test itself. Incumbent pins (§receipts) record Langfuse/Opik/OpenLLMetry
   commit SHAs for differential arms.
2. **Tier list** — `ingest` (O4 load shapes), `stream` (streaming lifecycle, O2),
   `semconv` (per-provider compliance, O1), `query` (trace retrieval latency over
   banked span volumes), `ui` (completeness render, O5), `cost` (price-table audit
   correctness, O6). Goldens bind PER TIER; an SDK-only change re-banks only
   `ingest`/`stream`/`semconv`.
3. **Golden schema** — `conformance` (named checks, MUST|SHOULD, PASS|FAIL:
   e.g. `semconv.openai.span_attrs` MUST, `ingest.burst.loss_rate` MUST,
   `ui.tree_completeness` MUST, `cost.price_audit_fresh` SHOULD) +
   `metrics` (`value`, `spread` from A/A, `tol`, `tol_source` → banked receipt,
   `better` direction). **Tolerance rule: `tol = max(3 × A/A relative spread, floor)`**,
   floor per tier (e.g. ingest latency floor 5%, span-loss floor 0.1 pp).
4. **Banking ceremony** — goldens written ONLY by `aa <spec> --write-golden`
   (A/A pair → banked receipt + golden, refuses unsound pairs), `git diff goldens/`
   reviewed in the same commit. Golden-regeneration-until-green is forbidden.
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts;
   backend/harness/collector updates = new generation (CURRENT / GENERATION-MISMATCH /
   UNAVAILABLE).
6. **Measurement law** — preflight refuses a busy machine (CPU/GPU > 25%, names
   processes); runs marked CONTENDED if any non-backend process exceeds 25% in a
   second; one unit under test at a time; loopback/local-only collector endpoints
   (a failed local call is a finding, never a cloud fallback); park/unpark
   interfering residents. For `ingest` tier: the runner's OOM history is a control —
   the evidence shows Opik documents needing larger runners (comment in
   `load_tests.yml`), so the bench records runner class as machine state.
7. **A/B discipline** — same-invocation A, B, A ordering for differential arms
   (ours vs oracle SDK build); banked under a name.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run; add `ingest` and `audit` kinds for this type) + dated
   `.md` notes; `runs/` gitignored scratch. Every row records SDK + collector
   SHA-256 at invocation (see §3).
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact commit SHAs of oracle
   repos (O1–O6), collector version, OTel SDK version, OS.
10. **Claims wiring** — `registries/claims.tsv`: every public claim sentence
    registered and machine-checked against its receipt on every commit.
11. **Negative-evidence ledger** — `NEGATIVE_EVIDENCE.md`, `DISCREPANCIES.md`,
    `break-tests.md`, `demotion-rules.md`; e.g. a span-loss shape that fails the
    surface is a kill with a resurrection predicate, kept in-tree.
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in AGENTS.md;
    type-sharpened: "bench-path hardcoding" includes seeding spans that bypass the
    real SDK export path, and "tautological tests" includes asserting only that
    spans exist without semconv attribute assertions.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **Semconv compliance harness** — cassette-replay test scaffold per provider
   (`test_semconv_compliance.py` shape from O1): cassette fixtures + attribute
   assertion helpers + context-propagation checks. Ships as a template with one
   worked provider.
2. **Ingestion-load fixture generator** — synthetic trace/span/payload generator
   producing the Opik named shapes (100k traces × 1 span, 250k spans, 1 GB heavy
   payload, burst + concurrency) against a local collector, plus the weekly-cron
   workflow template (`load_tests.yml` shape) with the OOM-history runner comment
   convention.
3. **Trace-completeness e2e checklist** — seeded-run → UI-render verification
   template (O5 shape): seed scripts, parent-linkage assertions, visual-test hooks.
4. **Price-table audit job template** — daily-cron workflow skeleton
   (O6 shape) with a spend cap, price-table pin file format, and the 7-day
   freshness rule wired to GATE-OBS-PRICE.
5. **Spec-diff CI check** — server-generated OpenAPI/SDK spec diff step
   (CLAIM-OBS-009 shape) as a reusable workflow fragment; client/server drift fails the build.
6. **Redaction test template** — span-attribute masking tests
   (the `test_mask_otel_spans.py` shape from langfuse-python) as a required file
   in the kit: PII/secret scrubbing on the export path is a default-on expectation.
7. **Per-integration workflow matrix template** — `lib-<name>-tests.yml` generator
   (O8 shape) so each new framework integration gets its own workflow file by
   convention, not by later cleanup.
8. **CI provisioning + cost ownership** — runner class/host, provisioning
   owner, funding owner/account, schedule, and spend cap for the ingestion-load
   benchmark tier (item 2's weekly cron) — TBD acceptable pre-S5 (any TBD
   blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
   assigns at S3). Note: item 4's "spend cap" covers the daily price-table
   audit job's compute, not the bench tiers — this item is the bench's own
   compute bill.

## Trend + process citations

Repos verified live 2026-09-23 (stars snapshot that date; process takeaway one line each):

- **langfuse/langfuse** | 34,971 | The category's dominant self-hostable reference (traces, spans, prompt logging, cost, datasets+evals; MIT) — copy its SDK spec-diff CI and daily price audit.
- **mlflow/mlflow** | 28,116 | Observability is being absorbed into the ML platform layer (GenAI tracing next to runs/registries) — a clean-room build must assume platform competition.
- **comet-ml/opik** | 22,207 | The process goldmine: scheduled ingestion-load suite, ~25 per-integration workflows, tiered unit/e2e/live CI, e2e coverage + visual trace tests.
- **Arize-ai/phoenix** | 11,586 | OTel-first exemplar (`phoenix-otel`, `phoenix-evals`) — the standards-aligned design to copy.
- **traceloop/openllmetry** | 7,443 | The instrumentation layer: 35+ per-provider OTel packages with semconv compliance tests + VCR cassettes — the oracle for O1.
- **Helicone/helicone** | 6,175 | Proxy-based capture proves a second viable architecture — one-line base-URL change vs SDK instrumentation.
- **langwatch/langwatch** | 4,864 | Production monitoring paired with pre-deploy agent simulation — the type's frontier is run-level debugging.
- **pydantic/logfire** | 4,487 | Framework vendors now own their observability story (Logfire for Pydantic AI) — expect instrumentation to ship with frameworks, not after.
- **truera/trulens** | 3,571 | Eval-first observability, strong in RAG — evals-on-traces is a first-class surface.
- **lmnr-ai/lmnr** (Laminar) | 3,277 | Rust-backed, agent-debugging-first — cutting edge is agent-run transcripts and rollout debugging, not generic APM.
- **openlit/openlit** | 2,790 | OTel-native multi-language auto-instrumentation (Python/TS/Go) with streaming span-lifecycle tests — the oracle for O2.
- **Scale3-Labs/langtrace** | 1,232 | Stale (last push 2025-11-17) — included as the recency-filter warning, not a model.
- **langchain-ai/langsmith-sdk** | 1,063 | Keystone: closed LangSmith's open client SDKs (with `test_otel_exporter.py`) prove commercial players need open capture code.

**Caveats carried over (honest):** the commercial core is thin on open evidence by
design (only OSS-alternative tier yields copyable process — which is exactly the tier
a clean-room project can use); "OTel-compatible" is asserted more than proven (only
OpenLLMetry shows explicit semconv tests); Opik's load suite is the *only* ingestion
benchmark found — copying it means copying the single best example, not a consensus;
per-symbol claims inside test files were not verified (unauthenticated code search was
unavailable — file names and workflow contents were verified, symbol-level assertions
were not).

## Unknowns (UNK-*)

- **UNK-OBS-001** — No neutral cross-vendor LLM-agent OTel semconv conformance suite
  exists in evidence. Resolution: build the semconv suite against O1 (shared GATE-010) and treat any
  "OTel-compatible" claim as [Maintainer claim] until it passes. Blocks S5 interop claims.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Neutral semconv suite parked: S3 bench construction from the pinned spec; OTel-compatible claims stay [Maintainer claim]/T2 until the suite passes. Promotion predicate: at S3 bench setup, construct the neutral semconv conformance suite from the pinned OTel semconv spec (pin recorded in the truth pack) and wire it to shared GATE-010. Owner: plan author. S3 step: bench setup.
- **UNK-OBS-002** — Per-symbol behavior inside test files (what `test_semconv_compliance.py`
  actually asserts) is unverified — only file presence and names were confirmed.
  Resolution: fetch the file bodies via authenticated code search or raw fetch and
  record attribute-level assertions before S5.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Per-symbol semconv assertions parked: S3/pre-S5 file-body fetch at pinned commits; attribute-level assertions recorded before any above-T2 claim. Promotion predicate: at S3 truth-pack assembly (or pre-S5 evidence audit), fetch the pinned bodies of the semconv test files via raw fetch at the pinned commit — authenticated code search via the pickup's own credentials only if raw fetch fails; record attribute-level assertions; semconv-coverage claims stay T2 until then. Owner: evidence auditor. S3 step: truth-pack assembly / pre-S5 evidence audit.
- **UNK-OBS-003** — No cross-architecture (proxy vs SDK) ingestion-loss benchmark
  found; whether the two architectures differ in loss characteristics is inference.
  Resolution: run the O4 load shapes against both architectures in the bench before
  any architecture recommendation.
  **Disposition: TARGETED.**
- **UNK-OBS-004** — Cost-attribution data models differ across platforms with no
  standard; the price-table format for GATE-OBS-PRICE is undefined.
  Resolution: survey the O6 audit inputs (langfuse price table format) and the Opik
  span-cost schema, then fix one canonical format in ACCEPTANCE_SURFACE.json.
  **Disposition: TARGETED.**
- **UNK-OBS-005** — W&B `weave` and Braintrust surfaces were named in evidence but
  not re-verified; the "closed with open SDK" generality (CLAIM-OBS-013) rests on
  them. Resolution: Git-verify one more vendor SDK surface or withdraw the
  generalization to LangSmith-only.
  **Disposition: TARGETED.**

---
*Counts: REQ 6 · CLAIM 13 · GATE 2 new + 2 retired into shared GATE-010 (G1–G14 profiled) · UNK 5 · repos cited 13.*
