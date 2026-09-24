---
type: observability
title: Agent observability and tracing
group: Eval and safety
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsOrchestration
---

## Bottom line
Inference, medium confidence: record agent runs with an existing open-source tracing stack (Langfuse, Arize Phoenix or Comet Opik, instrumented through OpenTelemetry packages such as OpenLLMetry or OpenLIT), and do not build your own trace store. Wrap it, because "OpenTelemetry-compatible" is mostly asserted rather than tested in this category: before you trust an integration, check that the spans it emits carry the attributes you depend on, that streamed calls close their spans, and that your cost numbers use an audited price table.

## Adopt, do not rebuild
- **langfuse/langfuse**: a self-hostable platform for traces, nested spans, prompt and response logging, cost tracking, datasets and evals, under the MIT license; its CI diffs the server-generated API spec against the SDK and audits model prices daily. [Verified] (ecosystem/pickup/_evidence/observability.md:7 "trace capture, span hierarchies, prompt/response logging, cost tracking, datasets + evals in one OSS platform (MIT)"; ecosystem/pickup/_evidence/observability.md:32 "sdk-api-spec.yml, openapi-export-check.yml")
- **Arize-ai/phoenix**: open-source observability and evaluation built on OpenTelemetry, with its trace view checked by browser tests. [Verified] (ecosystem/pickup/_evidence/observability.md:9 "packages include phoenix-otel (OTel-native) and phoenix-evals"; ecosystem/pickup/_evidence/observability.md:34 "Phoenix runs playwright.yaml for UI trace-view verification")
- **comet-ml/opik**: open-source tracing and eval for LLM and agent workflows, with the only scheduled ingestion-load suite found in the category and a separate CI workflow per framework integration. [Verified] (ecosystem/pickup/_evidence/observability.md:8 "Comet's OSS tracing/eval platform for LLM and agent workflows"; ecosystem/pickup/_evidence/observability.md:25 "Scheduled ingestion-load benchmarks against a live local stack"; ecosystem/pickup/_evidence/observability.md:40 "is the only ingestion-load benchmark found among these repos")
- **traceloop/openllmetry and openlit/openlit**: the instrumentation layer, per-provider OpenTelemetry packages that emit spans for model and tool calls; OpenLLMetry tests span attributes against recorded provider responses, and OpenLIT tests that streamed spans close. [Verified] (ecosystem/pickup/_evidence/observability.md:10 "per-provider OpenTelemetry instrumentation packages"; ecosystem/pickup/_evidence/observability.md:16 "OTel-native auto-instrumentation SDK (Python/TS/Go)")

## Copy these practices
- **Assert span attributes per provider, against recordings**: for each instrumented provider, test the semantic-convention attributes of its spans against recorded (cassette) responses, not only that spans exist. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/observability.md:26 "Per-provider OTel semantic-convention compliance tests with VCR cassettes")
- **Streamed calls must close their spans**: test that a streamed response ends its span and records token usage. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/observability.md:27 "explicit tests that streaming spans close correctly and carry token-usage attributes")
- **Test the export path, including masking**: unit-test batching, context propagation and secret or personal-data masking on the OpenTelemetry export path. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/observability.md:28 "test the OTel export path as a first-class unit surface (masking, batching, context propagation")
- **Named ingestion load shapes on a schedule**: a weekly job pushes fixed shapes (100k traces of one span, 250k spans, 1 GB payloads, bursts) through a local stack. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/observability.md:25 "100k traces × 1 span, 250k spans, 1 GB heavy payloads, burst + concurrency shapes")
- **Audit the price table on a schedule and demote stale cost claims**: a daily job checks model prices, and a cost claim whose table audit is more than seven days old drops to inference. Starter kit: B8. [Verified] (ecosystem/pickup/_evidence/observability.md:33 "cost tracking needs its own scheduled correctness job — prices change under you"; ecosystem/pickup/pickup-observability.md:167 "whose price-table audit is older than 7 days is demoted to T3")
- **Check traces in the UI, not only the API**: end-to-end tests confirm ingested spans render as complete trees in the product, not merely that ingestion returned 200. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/observability.md:34 "verify end-to-end that ingested spans actually render as complete traces in the UI")

## Build only if
- No evidenced constraint rules out the open-source incumbents. The evidenced gap is a neutral, cross-vendor conformance suite for agent span conventions, which the companion proposes building against the pinned OpenTelemetry conventions as a test beside an adopted stack, not as a new tracing platform. [Inference] (ecosystem/pickup/pickup-observability.md:98 "No neutral, cross-vendor LLM-agent OTel semconv conformance suite was")

## Where FrankenSuite touches this
- asupersync ships a metrics layer with optional OTLP (OpenTelemetry protocol) export inside the runtime, and has extracted its evidence/tracing kernel as small published crates; this is runtime telemetry, not an agent-trace product; TRL 6, Pilot. [Verified] (packets/asupersync-assessment.md:121 "src/observability/ (metrics + optional OTLP)"; packets/asupersync-assessment.md:245 "the evidence/tracing kernel already extracted as workspace members"; packets/asupersync-assessment.md:202 "Technology readiness | TRL 6")
- frankenterm keeps a flight recorder and replay crates for its agent-fleet control plane, which its packet reads as a forensic record of what each agent did; TRL 7, Explore. [Verified] (packets/frankenterm-assessment.md:94 "flight-recorder, core-replay, core-fleet"; packets/frankenterm-assessment.md:220 "a forensic record of what every agent did")
- franken_agent_detection extracts per-agent token usage from 32 agents' session files, which its packet names as an unused metering option; TRL 6, Pilot. [Verified] (packets/franken_agent_detection-assessment.md:124 "per-agent token usage extraction"; packets/franken_agent_detection-assessment.md:217 "is a metering/billing substrate no consumer currently uses")

## What we cannot say
- Whether any platform's OpenTelemetry ingestion interoperates: only OpenLLMetry was seen with explicit convention-compliance tests, and the pack treats the rest as marketing until a test file is seen (ecosystem/pickup/_evidence/observability.md:39 "is asserted more than proven. Only OpenLLMetry has explicit semconv-compliance tests").
- What the compliance and lifecycle tests assert inside: file names and workflow contents were read, individual test assertions were not (ecosystem/pickup/_evidence/observability.md:42 "per-symbol claims inside test files were not verified").
- Whether load testing is a norm: Opik's suite is the only one found, so copying it copies one example (ecosystem/pickup/_evidence/observability.md:40 "is the only ingestion-load benchmark found among these repos").
- The hosted commercial core (LangSmith and similar) could not be studied; only client SDKs are open (ecosystem/pickup/_evidence/observability.md:38 "is closed-source hosted; only its client SDKs (langchain-ai/langsmith-sdk) are open").
- Langtrace is stale and is not a model to copy (ecosystem/pickup/_evidence/observability.md:41 "Langtrace is stale (last push 2025-11-17)").
- Stars show which projects are used, not which capture spans correctly.

## Revisit when
- A neutral OpenTelemetry conformance suite for agent spans appears, or a platform publishes one: "OTel-compatible" claims can then be checked instead of trusted.
- A second project publishes a scheduled ingestion-load benchmark, or a proxy-versus-SDK loss comparison.
- The test bodies behind the compliance and lifecycle files are read at a pinned commit, which would move those practices from file existence to checked behavior.
