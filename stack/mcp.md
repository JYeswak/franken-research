---
type: mcp
title: MCP servers and clients
group: Orchestration
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsOrchestration
reviewed_by: control-plane-pane-2
review_date: 2026-09-23
---

## Bottom line
Inference, medium confidence: build MCP (Model Context Protocol) servers and clients on an official SDK, and do not hand-write the protocol. Wrap the SDK in the official conformance suite, pinned to a version and run once per spec revision you ship, with every known failure listed in a named file instead of skipped; the suite is still an alpha release that nobody in this program has run, so its pass is a floor, not a certificate.

## Adopt, do not rebuild
- **modelcontextprotocol/python-sdk**: the official Python server and client SDK; its CI runs the official conformance suite at a pinned version and names failing scenarios in an expected-failures file per spec revision, with one conformance leg per wire revision. [Verified] (ecosystem/pickup/_evidence/mcp.md:8 "official Python SDK (server+client); pushes same-day"; ecosystem/pickup/_evidence/mcp.md:20 "python-sdk pins harness version in workflow env"; ecosystem/pickup/_evidence/mcp.md:21 "expected-failures.2025-11-25.yml, expected-failures.2026-07-28.yml — failing conformance scenarios are named in YAML"; ecosystem/pickup/_evidence/mcp.md:22 "conformance.yml runs three legs: 2025-11-25 wire, 2026-07-28 wire, default wire")
- **modelcontextprotocol/typescript-sdk**: the official TypeScript SDK for Node, Bun and Deno, with separate server and client packages and framework middleware; it also runs the conformance suite in CI. [Verified] (ecosystem/pickup/_evidence/mcp.md:9 "official TypeScript SDK (Node/Bun/Deno; split @modelcontextprotocol/server|client packages"; ecosystem/pickup/_evidence/mcp.md:20 "conformance.yml in both repos")
- **modelcontextprotocol/conformance and modelcontextprotocol/inspector**: the official conformance suite and the official debugging tool for any MCP server; writing your own protocol checker would duplicate the first, and the second is a ready client to test against. [Verified] (ecosystem/pickup/_evidence/mcp.md:13 "official protocol conformance suite (ships as @modelcontextprotocol/conformance npm pkg"; ecosystem/pickup/_evidence/mcp.md:11 "official visual debugging/testing tool for any MCP server")
- **github/github-mcp-server**: a first-party production server in Go; read it as a worked example of a production server and its CI, not as a library. [Verified] (ecosystem/pickup/_evidence/mcp.md:14 "first-party production MCP server from GitHub (Go)")

## Copy these practices
- **Pin the conformance suite and run it per spec revision**: pin the suite's package version in the workflow and run one leg for every wire revision you ship (the spec is versioned by date and the revisions differ on the wire), not only the latest. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/mcp.md:20 "python-sdk pins harness version in workflow env"; ecosystem/pickup/_evidence/mcp.md:22 "when the protocol versions its wire, test every shipped wire, not just latest")
- **Name failures, never skip them**: each failing conformance scenario goes into an expected-failures file per spec revision, so admitting a failure is a reviewable diff. Starter kit: B9. [Verified] (ecosystem/pickup/_evidence/mcp.md:21 "Expected-failures baseline files instead of skipping hard scenarios")
- **Diff the tool surface on every pull request**: build the server at base and head and diff the exposed tool names and schemas, so an interface change is reviewed rather than discovered by clients. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/mcp.md:27 "builds the server from base and head and diffs the exposed MCP tool surface")
- **Generate or diff protocol types against the spec**: a workflow regenerates types from the spec so the SDK cannot drift from the wire. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/mcp.md:28 "generate (or diff-check) types against the spec source of truth")
- **One kitchen-sink fixture server**: a reference server that exercises tools, resources and prompts serves as the server under test for conformance. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/mcp.md:25 "build one kitchen-sink server as the protocol-exercise fixture")
- **Justify CI settings in the file**: size each job's timeout from measured run history and default the token to read-only, with the reason written next to the setting. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/mcp.md:26 "fixture servers + measured, justified timeouts + least-privilege token comments")

## Build only if
- You cannot take any third-party dependency or async runtime into the process: that constraint is real for some builders (FrankenMarkdown's library compiles with no third-party dependencies and carries a hand-written MCP server), but it justifies writing the transport, not skipping the official conformance suite. [Verified] (packets/franken_markdown-assessment.md:9 "whose library compiles with zero third-party dependencies"; packets/franken_markdown-assessment.md:78 "zero-dep JSON-RPC 2.0 per v1")
- Independent SDKs do behave differently on the same wire: GitHub's Copilot runtime port found the Rust SDK answering malformed JSON-RPC input that the TypeScript SDK ignored, which hung startup. That is a reason to run conformance against whichever SDK you adopt, not a reason to write another. [External] (synthesis/vendor-port-learnings.md:172 "JSON-RPC input while the TypeScript SDK didn")

## Where FrankenSuite touches this
- franken_markdown ships an MCP stdio server written as a dependency-free JSON-RPC 2.0 layer; the packet verified it exists and did not run it; TRL 7, Explore. [Verified] (packets/franken_markdown-assessment.md:78 "MCP stdio server exposing render/verify/capabilities"; packets/franken_markdown-assessment.md:78 "Medium]; not executed here"; packets/franken_markdown-assessment.md:169 "Technology readiness (TRL 1–9) | 7 | Released 0.4.5"; packets/franken_markdown-assessment.md:176 "Ring: Explore. The ring rules are decisive")
- franken_snowflake exposes its read verbs as MCP tools that share the CLI's handlers, but its own CI lane that combines live and MCP features was red at the assessed run; TRL 6, Explore. [Verified] (packets/franken_snowflake-assessment.md:83 "MCP server exposes read verbs as tools over stdio/HTTP, sharing CLI handlers"; packets/franken_snowflake-assessment.md:156 "The flagship live,mcp feature lane is red in the project's own CI"; packets/franken_snowflake-assessment.md:189 "Ring: Explore — and it is a genuine near-miss on Pilot")
- frankenterm has an MCP control surface that its packet calls thin next to its "machine API for agents" framing, and franken_lean lists its MCP server as a 1.0 target that has not shipped. [Verified] (packets/frankenterm-assessment.md:74 "depth is modest relative to"; packets/franken_lean-assessment.md:69 "proof-state snapshots, fln goals) | aspirational")

## What we cannot say
- Whether any FrankenSuite MCP server passes the official conformance suite: a search of `packets/` for the string `modelcontextprotocol` on 2026-09-23 (`grep -c modelcontextprotocol packets/*.md`) matched no packet, so no packet records such a run [Verified].
- How much of the protocol the conformance suite covers: it is an alpha release with a small repository, and the pack's author did not run it (ecosystem/pickup/_evidence/mcp.md:33 "Conformance harness is alpha (0.2.0-alpha.11) and its repo has only 127 stars"; ecosystem/pickup/_evidence/mcp.md:33 "I did not run the harness").
- The reference server collection is educational; its stars measure the organization, not per-server quality, and it is not listed as an incumbent here (ecosystem/pickup/_evidence/mcp.md:34 "its CI (per-server matrix) is the durable process lesson, not its code quality").
- upstash/context7 and langchain-mcp-adapters show the ecosystem is active but support no process claim (ecosystem/pickup/_evidence/mcp.md:35 "verified for existence/activity only").
- The Python SDK's unit-test matrix dimensions were not read (ecosystem/pickup/_evidence/mcp.md:36 "verify before citing specifics").
- SDKs in other languages were not checked in the pack (ecosystem/pickup/_evidence/mcp.md:38 "only TypeScript and Python SDKs were API-checked"). A fresh read on 2026-09-23 of `https://api.github.com/repos/modelcontextprotocol/rust-sdk/contents/.github/workflows` listed a `conformance.yml` file [Verified]; that the file exists says nothing about whether its runs pass.
- jlowin/fastmcp was dropped because it returned 404 at that owner (ecosystem/pickup/_evidence/mcp.md:37 "jlowin/fastmcp 404s at the remembered owner").

## Revisit when
- The conformance suite leaves alpha, or someone publishes a coverage map of which spec requirements it exercises.
- A new spec revision ships: add its conformance leg and expected-failures file before claiming support.
- The Rust SDK's conformance workflow is read and observed passing, which would give Rust builders a checked incumbent.
