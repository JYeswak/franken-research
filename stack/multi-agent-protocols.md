---
type: multi-agent-protocols
title: Agent-to-agent protocols (A2A class)
group: Orchestration
verdict: Adopt and wrap
confidence: Low
evidence_date: 2026-09-23
author: VerdictsOrchestration
---

## Bottom line
Inference, low confidence: if your agents must discover and delegate to agents from other teams, target A2A v1.x through one of its official SDKs, and do not design your own protocol. Wrap it: pin the shared compatibility test kit (the TCK) and run it against your build, test every transport the spec requires, and call any interop result "self-interop" until you have tested against an implementation from outside the A2A organization, because the evidence found none. Confidence is low because the evidence pack itself calls the category thin.

## Adopt, do not rebuild
- **a2aproject/A2A**: the spec, now under vendor-neutral stewardship with tagged v1.0.0 and v1.0.1 releases; IBM's competing ACP was archived after merging into it, so a new project should target A2A and treat ACP as history. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:8 "Tagged releases v1.0.0 (2026-03-12) and v1.0.1 (2026-05-28)"; ecosystem/pickup/_evidence/multi-agent-protocols.md:17 "Archived Aug 2025 after merging into A2A")
- **a2aproject/a2a-python, a2a-js, a2a-go**: official SDKs whose test trees were read (compat suites per spec version, a wire-format corpus diffed between two SDKs, per-transport tests, TCK wiring); writing a fourth implementation of the same wire would recreate them. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:9 "Official Python SDK for A2A — pushed today"; ecosystem/pickup/_evidence/multi-agent-protocols.md:22 "found by round-tripping a shared corpus through this SDK and a2a-python"; ecosystem/pickup/_evidence/multi-agent-protocols.md:21 "e2e/tck/run_tck.sh, e2e/tck/orchestrate_tck.py")
- **agent-network-protocol/anp**: the one non-A2A protocol with a spec community and a reference implementation, for builders who need decentralized identity (W3C DID) and end-to-end encryption between agents; it ships a large message-layer unit suite. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:13 "three-layer stack (W3C DID did:wba identity + encrypted comms"; ecosystem/pickup/_evidence/multi-agent-protocols.md:27 "agent-network-protocol/anp:anp/unittest/ (74 files)")

## Copy these practices
- **Run the standalone TCK against your implementation**: keep the conformance kit in its own repository, clone it at a pinned commit, and run it against a local system under test, so every implementation meets the same bar. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:21 "keep the conformance suite in its own repo so every implementation (and a clean-room rewrite) tests against the same bar")
- **Known-broken cases as tests that must flip**: record a known wire bug as a test expected to fail, so fixing the bug forces the marker to be updated in the same change. Starter kit: B4. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:22 "track known failures as tests that must flip, not as skipped TODOs")
- **Same behaviors on every binding**: when the spec requires JSON-RPC, gRPC and REST, one test plan runs on all of them; one green binding is not conformance. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:24 "if the protocol has multiple bindings, test the same behaviors on every binding, not just one")
- **Compat suites per old spec version**: keep a test directory per earlier spec version so new servers keep serving old clients. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:23 "keep per-spec-version compat test dirs so vN servers keep working with vN-1 clients")
- **Test signing and auth as their own specs**: signed agent cards and auth schemes get dedicated test files, and handshake, signing and discovery are unit-tested with no model in the loop. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/multi-agent-protocols.md:28 "security features (signing, auth schemes) get their own spec files"; ecosystem/pickup/_evidence/multi-agent-protocols.md:27 "unit-test the handshake/crypto/discovery primitives independently of any LLM")

## Build only if
- No evidenced constraint justifies a new protocol: the category consolidated from two specs to one, and the companion's own charter rules out new protocol design. Building a clean-room implementation of A2A is defensible only where no official SDK exists for your language, and even then the TCK is the bar. Whatever you build or adopt, count a result as full interop only against a peer implementation from outside the originating organization and call anything else self-interop; that is the companion's rule, and the interop tested in this category is inside the A2A organization's own SDKs. [Inference] (ecosystem/pickup/_evidence/multi-agent-protocols.md:33 "A new clean-room project should treat A2A v1.x as the target and ACP as historical"; ecosystem/pickup/pickup-multi-agent-protocols.md:21 "New protocol design (the charter is conformance, not invention)"; ecosystem/pickup/pickup-multi-agent-protocols.md:44 "full INTEROP requires ≥1 independent peer implementation"; ecosystem/pickup/_evidence/multi-agent-protocols.md:32 "There is no second fully independent A2A implementation outside the a2aproject org found in this sweep")

## Where FrankenSuite touches this
- None of the 44 packets implements an agent-to-agent protocol. The nearest is frankenterm's Robot Mode, a typed JSON envelope with golden test matrices for one agent driving others through terminal panes, which its packet proposes testing against a non-frankenterm backend before calling it a standard. [Verified] (packets/frankenterm-assessment.md:37 "is the closest thing in the wild to an agent-to-terminal control contract")
- franken_alignment models commit-reveal voting rounds among helper agents as an in-memory reference model only; its packet grades it TRL 3 and nothing production exists. [Verified] (packets/franken_alignment-assessment.md:19 "salted commit–reveal helper congresses"; packets/franken_alignment-assessment.md:196 "Technology readiness | TRL 3")
- The suite's own multi-agent development coordinates through MCP Agent Mail, a development tool the packets describe but did not assess as a product. [Maintainer claim] (packets/franken_nlp-assessment.md:67 "MCP Agent Mail coordination, bead-assignee locking")

## What we cannot say
- Whether A2A interop holds across organizations: the category is thin, and the interop tested is inside the A2A organization's own SDK matrix (ecosystem/pickup/_evidence/multi-agent-protocols.md:32 "Thin category, honest assessment."; ecosystem/pickup/_evidence/multi-agent-protocols.md:32 "There is no second fully independent A2A implementation outside the a2aproject org found in this sweep").
- Whether passing the TCK means full conformance: the kit is young and no evidence shows all four SDKs run it in CI (ecosystem/pickup/_evidence/multi-agent-protocols.md:34 "no evidence yet that all four SDKs run it in CI").
- ANP's cross-language interop: its named interop workflow covers Rust and Python only, not all five languages (ecosystem/pickup/_evidence/multi-agent-protocols.md:32 "covers only rust-python, not the full five-language matrix").
- The .NET SDK was checked for activity only, so it is not listed as an incumbent above (ecosystem/pickup/_evidence/multi-agent-protocols.md:12 "Official .NET SDK, pushed yesterday").
- Coral Protocol was excluded without an API check, and MCP is out of scope because it connects agents to tools, not agents to agents (ecosystem/pickup/_evidence/multi-agent-protocols.md:35 "not verified via API and not cited per the no-memory rule"; ecosystem/pickup/_evidence/multi-agent-protocols.md:36 "Model Context Protocol is agent-to-tool, not agent-to-agent").
- Stars and push dates show the SDKs are alive, not that they interoperate.

## Revisit when
- An A2A implementation from outside the a2aproject organization appears and passes the pinned TCK: interop claims can then move past self-interop, and confidence can rise.
- All four official SDKs are observed running the TCK in CI.
- A2A publishes a v2 or a breaking v1.x revision: re-pin the TCK and the compat suites before any claim.
