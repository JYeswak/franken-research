---
type: agent-memory
title: Agent memory systems
group: Memory and retrieval
verdict: Adopt and wrap
confidence: Low
evidence_date: 2026-09-23
author: VerdictsServing
---

## Bottom line
Inference, low confidence: adopt and wrap a maintained memory layer (Mem0's open-source SDK, Graphiti for a temporal knowledge graph, or Letta through letta-code) behind a thin interface of your own, rather than designing a new one. Do not rely on any published memory benchmark score: the scores are self-reported, sometimes from a managed platform or an ensemble of runs, and graded by LLM judges. Re-run LoCoMo or LongMemEval yourself with the dataset pinned by hash and the judge model pinned by name and date before you trust a number. Confidence is low because the evidence pack itself flags adoption evidence as thin.

## Adopt, do not rebuild
- **mem0ai/mem0**: memory layer with Python and TypeScript SDKs, per-agent plugins, a server, and a test file per LLM, embedding and vector-store backend. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:7 "Ships Python + TS SDKs, per-agent-plugin SDKs"; ecosystem/pickup/_evidence/agent-memory.md:21 "tests/llms/ (17 files: test_openai, test_anthropic, test_ollama, ...)")
- **getzep/graphiti**: temporal knowledge-graph library for agent memory with separate server and MCP packages, gated by lint, typecheck and CodeQL workflows. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:11 "Temporal knowledge-graph library for agent memory (Zep's core)"; ecosystem/pickup/_evidence/agent-memory.md:11 "strict CI (lint, typecheck, codeql, Socket firewall, pinned action SHAs)")
- **letta-ai/letta-code**: where Letta (the MemGPT successor) is now developed; the older letta-ai/letta repo is a landing page. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:9 "active code moved to letta-ai/letta-code"; ecosystem/pickup/_evidence/agent-memory.md:10 "Where Letta is actually developed")
- **SuperMemoryAI/supermemory** and **getzep/zep**: a monorepo memory product with per-SDK packages, and Zep's product repo with in-repo LoCoMo and LongMemEval harnesses. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:8 "per-SDK Python packages (openai-sdk, pipecat, cartesia...)"; ecosystem/pickup/_evidence/agent-memory.md:12 "contains benchmarks/locomo/ and benchmarks/longmemeval/ harnesses")

## Copy these practices
- **Say which system and which run produced a score**: Mem0's README states its headline numbers come from its managed platform, not the open-source SDK; Supermemory's README discloses that its ~99% headline is an ensemble and 85.86% is the single-pass figure. Starter kit: B6. [Maintainer claim] (ecosystem/pickup/_evidence/agent-memory.md:37 "reflect Mem0's managed platform, which includes proprietary optimizations not available in the open-source SDK"; ecosystem/pickup/_evidence/agent-memory.md:36 "the single-pass 85.86% is the comparable number")
- **State four fields on every benchmark number**: single-pass or ensemble, judge model and date, managed or open-source, dataset hash (the companion's proposed GATE-MEM-1). Starter kit: B3. [Inference] (ecosystem/pickup/pickup-agent-memory.md:148 "every published benchmark number states four fields")
- **Re-run the public benchmarks, do not quote them**: LoCoMo ships its dataset file and per-provider judge scripts; LongMemEval splits generation, retrieval and evaluation into separate stages. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:13 "Ships data/locomo10.json, task_eval/"; ecosystem/pickup/_evidence/agent-memory.md:28 "Eval pipeline split into generation → retrieval → evaluation stages")
- **Integration tests off by default, database drivers switched off by environment variable**: Graphiti's `unit_tests.yml`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:22 "DISABLE_NEPTUNE=1 DISABLE_NEO4J=1 DISABLE_FALKORDB=1 DISABLE_KUZU=1")
- **A version bump fails CI without a changelog entry**: Mem0's `ci.yml` job `changelog_check`; a fresh read on 2026-09-23 of https://raw.githubusercontent.com/mem0ai/mem0/main/.github/workflows/ci.yml showed the job erroring when `pyproject.toml`'s version changes without an edit to `docs/changelog/sdk.mdx`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:24 "Changelog enforcement keyed to version bump")
- **Pin CI actions to SHAs and firewall dependencies**: Graphiti's workflows plus `socket-firewall-connectivity.yml`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/agent-memory.md:30 "Supply-chain hygiene in CI: pinned action SHAs, dependency firewall")

## Build only if
- Memory must stay on the machine and every remembered item must carry its origin; no incumbent in the pack is shown doing per-item provenance, and the FrankenSuite substrate for it is unproven. The companion's own starting point for such a build is small: one local SQLite store with a pinned embedding backend. [Inference] (packets/franken_agent_detection-assessment.md:190 "as a substrate for portable agent memory — unoccupied and unproven"; ecosystem/pickup/pickup-agent-memory.md:34 "A single local memory store (SQLite + a pinned embedding")

## Where FrankenSuite touches this
- None of the FrankenSuite packets implements a memory layer. The nearest is **franken_agent_detection**, which normalizes 32 coding agents' session transcripts into one schema with per-artifact origin fields and feeds the maintainer's CASS session-search tool; TRL 6, NODUS ring Pilot. [Verified] [Inference] (packets/franken_agent_detection-assessment.md:21 "normalizes 32 agents' session transcripts into one stable schema"; packets/franken_agent_detection-assessment.md:22 "discovers sessions from 26 agent harnesses through this crate"; packets/franken_agent_detection-assessment.md:24 "(TRL 6 — see §4.9). Release artifacts exist")
- Its provenance records paths, not proof: no content hash or signature yet. It is the one FrankenSuite repo under plain MIT with no rider. [Verified] (packets/franken_agent_detection-assessment.md:213 "What it does not record is attestation: no content hash, no producer signature"; packets/franken_agent_detection-assessment.md:236 "Quoted scope: none — 21-line plain MIT")

## What we cannot say
- Who uses these libraries in production: the pack deliberately cited no adopters (ecosystem/pickup/_evidence/agent-memory.md:35 "Adopter claims are thin in this pack.").
- Whether any published score holds: Supermemory's README is promotional and Mem0's headline numbers are from its managed platform (ecosystem/pickup/_evidence/agent-memory.md:36 "Supermemory's README is self-promotional."; ecosystem/pickup/_evidence/agent-memory.md:37 "Mem0's README is honest about the platform gap").
- Whether the benchmarks still work as oracles: LoCoMo is static, and its judge models may no longer resolve (ecosystem/pickup/_evidence/agent-memory.md:38 "LoCoMo repo is static (last push 2024-08-13)"; ecosystem/pickup/pickup-agent-memory.md:319 "Judge-model survivability"). A widely used LongMemEval mirror is not verified hash-identical to upstream (ecosystem/pickup/pickup-agent-memory.md:323-324 "Community mirror fidelity: is the widely-used HF mirror").
- Letta's star count belongs to a landing page, so it says nothing about letta-code (ecosystem/pickup/_evidence/agent-memory.md:40 "Star-count trap on Letta").
- Whether a memory layer beats a no-memory baseline for your agent at all; no such comparison is in the evidence.

## Revisit when
- A party other than the vendor reproduces LoCoMo or LongMemEval numbers for Mem0, Graphiti/Zep or Letta with pinned judge and dataset.
- A shared memory API or conformance suite appears across two or more vendors.
- franken_agent_detection ships signed, hash-carrying provenance envelopes and a second independent consumer.
