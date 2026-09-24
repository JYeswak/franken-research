---
type: workflow-orchestrators
title: Durable workflow orchestrators
group: Orchestration
verdict: Adopt and wrap
confidence: Low
evidence_date: 2026-09-23
author: VerdictsOrchestration
reviewed_by: control-plane-pane-2
review_date: 2026-09-23
---

## Bottom line
Inference, low confidence: run long or crash-prone agent work on an existing durable-execution engine (Temporal, Cadence or Conductor), and do not write your own event log and replay engine. Wrap it, because none of these engines checks your workflow code for determinism when you compile it: determinism is only caught when a recorded run is replayed, so your test suite must replay recorded histories, including one deliberately nondeterministic history that must fail, under a virtual clock. Confidence is low because the evidence pack calls itself thin and ran none of these suites.

## Adopt, do not rebuild
- **temporalio/temporal and its official SDKs**: the durable-execution server that records each workflow's event history and replays it after a crash, with five official SDKs; its SDKs ship in-process test environments and a replayer, so rebuilding it would recreate both the engine and its test tooling. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:7 "durable execution server (Go) with 5 official SDKs; defines workflow-as-code, event histories, replay"; ecosystem/pickup/_evidence/workflow-orchestrators.md:18 "Official Python SDK; contains temporalio/worker/_replayer.py")
- **cadence-workflow/cadence**: the sibling history-replay engine (the old uber/cadence path now 404s), with simulation suites for its history, matching and replication services. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:9 "Uber-originated durable execution engine (Temporal's sibling lineage)")
- **conductor-oss/conductor**: an orchestration engine that ships user-facing test-harness modules, so adopters get a test workflow and not only documentation. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:8 "Netflix-originated orchestration engine; highest-star repo in this set; ships test-harness/test-util modules for users")

## Copy these practices
- **Replay recorded histories, with a negative control**: replay canonical recorded histories on every change, and keep one deliberately nondeterministic history that must fail replay with a named error, so a determinism checker that stopped working is caught. Starter kit: A10. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:28 "Replay tests against recorded event histories (determinism checking; a deliberately nondeterministic fixture exists)")
- **Replay stored agent runs**: the Temporal Python SDK replays stored histories of OpenAI Agents, LangGraph, Google ADK and deepagents workflows; copy that shape for any agent that runs inside a workflow. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:29 "Agent-workflow replay tests (LLM-agent orchestration frameworks replayed from stored histories)")
- **Virtual clock in tests**: workflow tests run in-process under a mocked clock that skips ahead, never on real timers. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:27 "In-process workflow test environment with a mocked/virtual clock (time skipping; no real timers)")
- **Blocking workflow code is a test failure**: detect a workflow coroutine that never yields and fail the test, with the timeout plumbed through the suite. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:30 "Deadlock detection for workflow coroutines (workflow code must yield; blocks are failures)")
- **Test the journal on its own**: unit-test the event-history or journal tables as the durability primitive, before engine-level tests. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:33 "Journal/event-history tables unit-tested as the durability primitive")
- **Track flaky tests in the open**: shard the heavy suites and publish a flaky-test report instead of retrying until green. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/workflow-orchestrators.md:36 "Heavy, sharded CI with flaky-test tracking")

## Build only if
- No evidenced constraint rules out the incumbents for durable execution. The one evidenced gap is a checker, not an engine: no surveyed repository had a static (compile-time) determinism analyzer, so a builder who needs one would build it beside an adopted engine. [Inference] (ecosystem/pickup/_evidence/workflow-orchestrators.md:42 "the determinism story is runtime replay + deadlock detection, not compile-time checking")

## Where FrankenSuite touches this
- asupersync is an async runtime, not a durable-execution engine, but it ships a deterministic lab runtime with virtual time, deterministic scheduling and trace replay; its packet verified the code exists and did not execute replay; TRL 6, Pilot. [Verified] (packets/asupersync-assessment.md:81 "Deterministic lab runtime: virtual time, deterministic scheduling, trace replay | demonstrated (existence; replay not executed)"; packets/asupersync-assessment.md:202 "Technology readiness | TRL 6 | Ships as 0.5.0 on crates.io"; packets/asupersync-assessment.md:68 "(NODUS: Pilot — see §4.9.)")
- frankenterm runs transactional multi-pane missions for agent fleets with prepare, commit and compensate steps and an idempotency ledger, a saga-style pattern rather than a replayable event history; TRL 7, Explore. [Verified] (packets/frankenterm-assessment.md:143 "transactional missions (prepare/commit/compensate, idempotency ledger, kill switches, failure injection)"; packets/frankenterm-assessment.md:178 "Ring: Explore. The ring rules are decisive")
- franken_engine captures program, policy snapshot, evidence stream and randomness transcript so a security decision can be replayed; that is incident replay inside a JS runtime, not workflow orchestration; TRL 4 to 5, Explore. [Verified] (packets/franken_engine-assessment.md:120 "Replay captures IR3 program, policy snapshot, model snapshot, evidence stream, and randomness transcript"; packets/franken_engine-assessment.md:197 "Technology readiness | TRL 4–5 | Lab-validated components")

## What we cannot say
- Whether these suites pass: the pack calls its own evidence thin, and the practices were verified by file existence and spot-read contents, and no suite was run (ecosystem/pickup/_evidence/workflow-orchestrators.md:42 "Thin evidence, stated honestly"; ecosystem/pickup/_evidence/workflow-orchestrators.md:48 "verified by file existence and spot-checked contents, not by running the suites").
- Whether any repository has a static determinism analyzer; none was found, so none is cited as a practice (ecosystem/pickup/_evidence/workflow-orchestrators.md:42 "Do not cite a static analyzer as an existing practice").
- Whether restatedev/restate, a newer journal-based engine written in Rust, can be adopted with this wrap: only its journal-table tests and test utilities were checked, and no replay harness or time-skipping framework was found, so it is not listed as an incumbent (ecosystem/pickup/_evidence/workflow-orchestrators.md:10 "Newest-generation durable execution (journal-based, Rust); journal tables unit-tested in-tree"; ecosystem/pickup/_evidence/workflow-orchestrators.md:43 "only the journal-table unit tests and crates/test-util were verified"; ecosystem/pickup/_evidence/workflow-orchestrators.md:43 "no verified replay harness or time-skipping test framework found").
- hatchet is active but is not listed as an incumbent because no determinism, time-skipping or replay practice was found in its tree, and Airflow, Dagster and Prefect are task schedulers adjacent to this type (ecosystem/pickup/_evidence/workflow-orchestrators.md:44 "cited for trend only"; ecosystem/pickup/_evidence/workflow-orchestrators.md:45 "are task/DAG orchestrators, not Temporal-class durable execution").
- Links to uber/cadence and the small orkes-io/conductor repository point at the wrong projects (ecosystem/pickup/_evidence/workflow-orchestrators.md:46 "old links/attributions to uber/cadence will 404"; ecosystem/pickup/_evidence/workflow-orchestrators.md:47 "is a separate small repo — do not confuse them").
- Every surveyed repo pushed on the check date; that shows activity, not a ranking or quality (ecosystem/pickup/_evidence/workflow-orchestrators.md:3 "should not be read as a recency ranking").

## Revisit when
- An engine ships a static determinism checker for workflow code: the wrap shrinks from "replay everything" to "run the checker plus a smaller replay set".
- A replay or time-skipping test framework is found and read in restatedev/restate, which would let it join the adopt list.
- A replay suite is observed failing or passing on live CI for an agent-workflow history, which would move the practice claims past file existence.
