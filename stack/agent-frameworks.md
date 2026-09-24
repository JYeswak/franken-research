---
type: agent-frameworks
title: Agent frameworks
group: Orchestration
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsOrchestration
---

## Bottom line
Inference, medium confidence: adopt an existing agent framework (LangGraph, the OpenAI Agents SDK, smolagents or DSPy) and do not write your own agent loop. Wrap it, because an agent run is nondeterministic and no surveyed framework ships a record-and-replay harness for model calls: script the model and the tools in your tests, make a test fail when the script and the run disagree, and declare any model-graded ("judge") test matrix before you run it.

## Adopt, do not rebuild
- **langchain-ai/langgraph**: graph-shaped agent workflows with checkpointing (saved agent state) and human-in-the-loop pauses, plus its own backend-agnostic checkpoint conformance suite; rebuilding the graph runtime and its checkpoint semantics would recreate both. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:8 "graph-based agent workflows, durable execution, checkpointing, human-in-the-loop"; ecosystem/pickup/_evidence/agent-frameworks.md:26 "Checkpoint conformance suite run against every state backend")
- **openai/openai-agents-python**: a first-party multi-agent workflow SDK whose deterministic test doubles are part of the public package, so downstream tests can be scripted without a network. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:14 "lightweight, powerful framework for multi-agent workflows"; ecosystem/pickup/_evidence/agent-frameworks.md:19 "Ship scripted/deterministic LLM doubles as a first-class, importable test API")
- **huggingface/smolagents**: a minimal code-writing and tool-calling agent loop, for builders who want the loop without a heavy framework. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:13 "library (code-agent + tool-calling loops); pushed same-day")
- **stanfordnlp/dspy**: compiled language-model programs with optimizers and an evaluation API that its own CI exercises. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:15 "Represents the compile/optimize/evaluate branch of agent orchestration"; ecosystem/pickup/_evidence/agent-frameworks.md:28 "if the framework ships an eval API, its own CI must exercise it")

## Copy these practices
- **Scripted doubles that fail on drift**: the fake model errors when the run asks for a step the script does not define and when a scripted step is never used; then prove the test can fail by deleting one script step and adding one extra step. Starter kit: A10. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:22 "Strict scripted-model contract: fail on unexpected or unconsumed steps"; ecosystem/pickup/pickup-agent-frameworks.md:176-177 "a mutation test suite MUST demonstrate that removing a script step")
- **Script the tools, not only the model**: tool side effects run against a scripted sandbox session with its own unexpected-call error. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:23 "deterministic doubles must cover tool execution, not just the LLM")
- **One fake per trajectory**: each scenario (tool call, code error, syntax error, import failure) gets its own canned fake instead of one generic fake. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:20 "one fake per trajectory scenario, not one generic fake")
- **One checkpoint suite for every backend**: every state store (SQLite, Postgres, others) must pass the same resumability suite before it ships. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:26 "needs a backend-agnostic conformance harness, not per-backend ad-hoc tests")
- **Declare the judge and the model matrix before the run**: judge-graded reliability tests live apart from unit tests, the model list sits in a config file, and dropping a model after seeing results counts as cherry-picking. Starter kit: A9. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:27 "declare the model matrix in config, not code"; ecosystem/pickup/pickup-agent-frameworks.md:187 "Dropping a model from the matrix post-hoc is a FAIL")
- **Versioned agent-definition fixtures**: keep saved agent definitions per release so a save/load schema change fails loudly. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-frameworks.md:29 "versioned fixtures catch schema drift in save/load of agent definitions")

## Build only if
- No hard constraint in the evidence rules out every incumbent. The one evidenced gap is a test tool, not a framework: none of the surveyed repositories had a record/replay harness for model calls, and the companion itself marks that absence as contested, so build that harness beside an adopted framework rather than a new framework around it. [Inference] (ecosystem/pickup/_evidence/agent-frameworks.md:40 "no project had an obvious record/replay (cassette) harness for LLM calls"; ecosystem/pickup/pickup-agent-frameworks.md:141 "No surveyed agent-framework repo exposed an LLM-call record/replay (cassette) harness")
- If you need crash-proof history and deterministic replay of a whole run, that is a workflow orchestrator's job, not a reason to write a framework: the companion assigns durability to orchestrators and bars frameworks from claiming it. [Inference] (ecosystem/pickup/pickup-agent-frameworks.md:24 "A framework MUST NOT claim")

## Where FrankenSuite touches this
- None of the 44 packets builds an agent-loop framework. The nearest is frankenterm, a terminal platform with a control plane for driving many coding agents in terminal panes (policy-gated sends, transactional multi-pane missions); its packet grades it TRL 7 and rings it Explore. [Verified] (packets/frankenterm-assessment.md:9 "plus an agent-swarm control plane"; packets/frankenterm-assessment.md:171 "Technology readiness (TRL 1–9) | 7 | Installable, 21 releases"; packets/frankenterm-assessment.md:178 "Ring: Explore. The ring rules are decisive")
- franken_agent_detection normalizes the session transcripts of 32 coding agents into one schema, which is a source of real agent trajectories rather than a framework; TRL 6, Pilot. [Verified] (packets/franken_agent_detection-assessment.md:21 "normalizes 32 agents' session transcripts into one stable schema"; packets/franken_agent_detection-assessment.md:177 "Technology readiness | TRL 6 | Published, versioned, downloadable"; packets/franken_agent_detection-assessment.md:80 "(NODUS: Pilot — see §4.9.)")
- The asupersync packet names long-lived agent services, where a leaked task is a cost or security bug, as the workload its cancel-correct runtime would suit; that is the packet's inference, not a demonstrated agent framework. [Inference] (packets/asupersync-assessment.md:255 "an agent harness or long-lived agent service where cancellation correctness is load-bearing")

## What we cannot say
- Only LangGraph has verified production adopters; adopter claims for the other frameworks were not checked (ecosystem/pickup/_evidence/agent-frameworks.md:35 "Adopter claims for other frameworks are not verified here").
- microsoft/autogen is not listed above because its last push was 2026-04-15 and its claimed continuation was unverified in the pack (ecosystem/pickup/_evidence/agent-frameworks.md:36 "AutoGen is stale-ish: last push 2026-04-15"). A fresh read on 2026-09-23 of `https://api.github.com/repos/microsoft/agent-framework` returned an active repository (pushed 2026-09-23) describing itself as a framework for "building, orchestrating and deploying AI agents and multi-agent workflows" [Verified]; whether it is AutoGen's successor was not established, and its CI and tests were not read.
- crewAI and agno were checked for test-directory layout only, so no practice is claimed from them and they are not listed as incumbents (ecosystem/pickup/_evidence/agent-frameworks.md:38 "Thin test evidence for crewAI and agno").
- File pointers were fetched one by one, but no test suite was run (ecosystem/pickup/_evidence/agent-frameworks.md:39 "all file pointers above were individually fetched and confirmed to exist").
- The record/replay gap is an absence finding over the surveyed test trees only; such a harness may exist elsewhere (ecosystem/pickup/_evidence/agent-frameworks.md:40 "That is a gap a clean-room project could fill rather than copy").
- Stars and same-day pushes show these projects are alive and used, not that they are good.

## Revisit when
- An incumbent ships a record/replay harness for model calls, or a surveyed repo turns out to have one: the wrap shrinks to configuration.
- The AutoGen continuation (AG2 or microsoft/agent-framework) is verified at repository level with its CI read.
- A third-party agent benchmark publishes its own run-to-run variance, which would decide whether such benchmarks can serve as trajectory oracles.
