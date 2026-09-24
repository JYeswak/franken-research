# INTENT — Project Pickup Playbook

Grade: B (constitution-grade: a system others build on).
Rides: v11. Does not touch the v10 ZIP, Drive file, or Mac sync.

## Goal

For each of the 21 agentic-technology types the 44-repo FrankenSuite corpus does
not cover, the ecosystem can produce a **ready starting point** for a new
assessment or clean-room project:

- charter seed (mission, non-goals, trust boundaries, release definition)
- oracle candidates with an integrity-verification method (blob SHA / invocation-time
  SHA-256 recording / fetch-verify script — never an unverified oracle)
- first claim registry (8–15 claims, ATLAS R7 fields: class, validity domain,
  oracle, negative control/mutant, evidence artifact, do-not-claim boundary,
  owning bead, gate)
- gate profile (starter-kit G1–G14 as applicable + proposed new shared gates)
- evidence tiers (Rulebook five-tier hierarchy; model types use the truth-pack
  pattern: PIN_RECORD.md, MANIFEST.sha256, ACCEPTANCE_SURFACE.json,
  NONDETERMINISM_FLOOR.md, fetch-truth-pack.sh --verify)
- localbench bench shape (spec format, tiers, golden schema with A/A-derived
  tolerances, banking ceremony, measurement law, receipt naming, claims.tsv wiring)
- starter-kit profile deltas (which gates are load-bearing for this type,
  which are advisory)

## The 21 types (grouped)

- Model serving: llm-inference-engines, quantization-toolkits,
  structured-output-decoding, embedding-model-serving
- Orchestration: agent-frameworks, mcp-servers-clients, multi-agent-protocols,
  workflow-orchestrators
- Tools/environment: sandboxed-code-execution, browser-use-stacks,
  computer-use-agents, web-search-api-layers
- Memory/retrieval: agent-memory-systems, rag-frameworks, vector-databases
- Eval/safety: llm-eval-harnesses, agent-observability-tracing, guardrails
- Training/voice: fine-tuning-infra, rl-envs-rlhf-infra, realtime-voice-agents

## Non-goals

- Implementing any rewrite. Changing existing packets, briefs, or the v10 line.
- Covering technologies outside the 21 without a new S1 amendment.

## Evidence bar

Every trend claim ("this category is real/active") and every process claim
("copy this bench/CI practice") cites 5–10 GitHub repos verified live
(browser or GitHub API — never from memory). A category with thin evidence
says so instead of inflating.

## Process

planning-arc S0–S5; S4 review rounds (fresh-context reviewers, typed DEF-*
records, integrator applies) to steady state: verdict BEADS READY (or
equivalent), last diff POLISH, no BLOCKS_PLAN unknowns, zero open P0/P1.
Gate lines in docs/planning/ROUND_LOG.md. ATLAS-ARC is normative; where the
five S0 sources lack an ID convention (no REQ-*/GATE-*/CLAIM-*/UNK-* exists),
use the conventions that do (DEF-*, bd-*, claim namespaces, bead IDs), and —
per the user's explicit requirement that every claim, gate, and unknown carry
a stable ID — additionally use REQ-*, GATE-*, CLAIM-*, and UNK-* namespaces
consistently across all S2+ artifacts. The user's requirement governs where it
conflicts with the S0 sources' silence.
