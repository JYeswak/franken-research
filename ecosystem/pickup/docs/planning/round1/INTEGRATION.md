# S4 Round 1 — Integration Ledger (INTEGRATION.md)

**Date:** 2026-09-23
**Integrator:** S4 Round 1 integrator (subagent)
**Scope:** All 92 DEF findings across DEF-laneA through DEF-laneF
**User instruction:** Fix every P0 and P1. Fix cheap P2s. Explicitly list deferred P2s with rationale. Terse register, no hype, label any inference added.

**Editable files (only):** `PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`, all 21 `pickup-*.md`, this file.
**Not modified:** `_evidence/`, `_s0/`, `docs/planning/round1/DEF-*`, `INTENT.md`.

## Tally

| Lane | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| A | 1 | 5 | 3 | 9 |
| B | 1 | 18 | 6 | 25 |
| C | 0 | 7 | 5 | 12 |
| D | 0 | 8 | 3 | 11 |
| E | 1 | 9 | 5 | 15 |
| F | 1 | 10 | 9 | 20 |
| **Total** | **4** | **57** | **31** | **92** |

**Disposition totals:** FIXED 90 · WONTFIX 1 (F-19, rationale below) · DEFERRED 1 (A-8, rationale below) · OPEN 0.
No P0/P1 deferred or open.

## Disposition ledger

Format: `DEF-ID [Sev] — Status — what changed (file:section)`.

### Lane A — Completeness / Traceability

- DEF-A-1 [P0] — FIXED — `pickup-embedding-serving.md` Gate profile rebuilt against `_s0/g1-g14-reference.md` (G2/G3/G4/G5/G8/G14 descriptions corrected; G11 moved to analog). `PROJECT-PICKUP-PLAYBOOK.md` Gate registry summary table Contract column rewritten to the reference's one-line definitions verbatim and marked non-normative ("for orientation only; the reference governs").
- DEF-A-2 [P1] — FIXED — `pickup-inference-engines.md`: UNK-01..04 canonical definitions kept in Unknowns only; Oracle section uses reference-only mentions.
- DEF-A-3 [P1] — FIXED — `pickup-quantization.md`: UNK-1 consolidated to Unknowns; Oracle mention is a reference.
- DEF-A-4 [P1] — FIXED — `pickup-structured-output.md`: UNK-1 consolidated to Unknowns; Oracle mention is a reference.
- DEF-A-5 [P1] — FIXED — `pickup-embedding-serving.md`: UNK-EMB-O1 consolidated to Unknowns; Oracle section references it.
- DEF-A-6 [P1] — FIXED — `PROJECT-PICKUP-PLAYBOOK.md` 21-type table Companion-file column now matches on-disk filenames (all 21 verified by `ls`).
- DEF-A-7 [P2] — FIXED — `### Requirements` heading normalized across all 21 companions.
- DEF-A-8 [P2] — DEFERRED — ID numbering style variance (REQ-01 vs REQ-1 vs REQ-EMB-001; CLAIM-01 vs CLAIM-EMB-001) persists. Rationale: no collisions or orphans exist today; renumbering would break in-file cross-references and the claim registries; the canonical format (`REQ-<SLUG>-<NN>`, `GATE-<SLUG>-<NN>`, `CLAIM-<SLUG>-<NN>`, `UNK-<SLUG>-<NN>`, zero-padded) is now declared normatively in the playbook Namespaces section for all new IDs. Owned by S5 normalization. Partially fixed in round 1: `GATE-R1..4` → `GATE-RAG-1..4`; voice `GATE-G*` eliminated; RL `GATE-1..4` → `GATE-RL-01..04`.
- DEF-A-9 [P2] — FIXED — `pickup-inference-engines.md`, `pickup-quantization.md`, `pickup-structured-output.md` now carry ID-level G1–G14 applicability maps.

### Lane B — Architecture / Boundaries

- DEF-B-1 [P0] — FIXED — `PROJECT-PICKUP-PLAYBOOK.md` Gate registry summary now reads "gates come only from G1–G14 + ATLAS BUILD_READY + the shared pickup gates (GATE-001…GATE-018 in `shared-gates.md`) + type-local gates defined in the companion file (`GATE-<SLUG>-<NN>` per the Namespaces section)".
- DEF-B-2 [P1] — FIXED — Purpose bullet now distinguishes the two gate paths: (a) shared gates proposed to `shared-gates.md` (amendment + two evidence files); (b) type-local gates defined in-companion.
- DEF-B-3 [P1] — FIXED — Explicit `Entry:` lines added for S0–S5 in the Pickup lifecycle.
- DEF-B-4 [P1] — FIXED — Playbook table lists `pickup-mcp.md` (actual filename).
- DEF-B-5 [P1] — FIXED — Charters carved: agent-frameworks owns trajectory/checkpoint conformance; workflow-orchestrators owns history/journal/replay; REQ-DW-6 rewritten as cross-type interface requirement; "durable execution" dropped from the agent-frameworks description.
- DEF-B-6 [P1] — FIXED — `pickup-mcp.md` charter: wire-surface adapters in scope; orchestration policy assigned to agent-frameworks/workflows.
- DEF-B-7 [P1] — FIXED — Protocol harness assignment: reference agent/SDK as conformance peer → multi-agent-protocols; as LLM-driven agent under test → agent-frameworks; assignment follows the role in the claim.
- DEF-B-8 [P1] — FIXED — `pickup-mcp.md` G6 now "advisory / N-A by language" with a named analog.
- DEF-B-9 [P1] — FIXED — `pickup-mcp.md` G11 now "advisory / N-A by language".
- DEF-B-10 [P1] — FIXED — `pickup-workflow-orchestrators.md` G11 now N/A for the type with a journal-format-stability analog (not a claim that canonical G11 applies as-is).
- DEF-B-11 [P1] — FIXED — GATE-AF1 retired into shared GATE-005; mutation-test acceptance kept as a type-specific parameter.
- DEF-B-12 [P1] — FIXED — GATE-MCP-01/02 retired into shared GATE-006.
- DEF-B-13 [P1] — FIXED — GATE-MCP-03/04 retired into shared GATE-017.
- DEF-B-14 [P1] — FIXED — GATE-MAP-1/2/4 retired into shared GATE-006; GATE-MAP-3 retained as genuine transport-parity delta.
- DEF-B-15 [P1] — FIXED — `pickup-agent-frameworks.md` gained a shared-gate declaration table (GATE-004/007/010/011 advisory; GATE-005/018 load-bearing; GATE-014/015/016 universal).
- DEF-B-16 [P1] — FIXED — `pickup-mcp.md` gained a shared-gate declaration table (GATE-004 advisory; GATE-006/017 load-bearing; GATE-014/015/016/018 universal).
- DEF-B-17 [P1] — FIXED — `pickup-multi-agent-protocols.md` gained a shared-gate declaration table (GATE-006/017 load-bearing; GATE-014/015/016/018 universal).
- DEF-B-18 [P1] — FIXED — `pickup-workflow-orchestrators.md` gained a shared-gate declaration table (GATE-005/018 load-bearing; GATE-017 advisory; GATE-014/015/016 universal).
- DEF-B-19 [P1] — FIXED — All 21 companions migrated to the playbook T0–T3 mapping (283 claim rows; provisional pending the manual semantic audit noted below).
- DEF-B-20 [P2] — FIXED — `shared-gates.md` GATE-002 applies-to clause narrowed.
- DEF-B-21 [P2] — FIXED — Normative naming rule in playbook Namespaces: shared gates are `GATE-NNN` only; type-local gates MUST be `GATE-<SLUG>-<NN>`; G1–G14 never `GATE-G1`.
- DEF-B-22 [P2] — FIXED — S3 exit now reads "gate log (`docs/planning/GATE_LOG.md`) shows zero FAIL verdicts on wired gates".
- DEF-B-23 [P2] — FIXED — BEADS READY certificate requires every stage S0–S3 to have its artifact or a `skip` record in ROUND_LOG.md.
- DEF-B-24 [P2] — FIXED — `pickup-mcp.md` G5 now "as-is, with type-specific parameters" (canonical contract stated; parameters labeled as parameters).
- DEF-B-25 [P2] — FIXED — GATE-DW-4 retired into shared GATE-005.

### Lane C — Failure / Security / Privacy / Resources

- DEF-C-1 [P1] — FIXED — `shared-gates.md` GATE-007: heavy tiers declare a per-run resource budget recorded in the receipt; budget-exceeded runs are flagged like CONTENDED and cannot bank a golden.
- DEF-C-2 [P1] — FIXED — `shared-gates.md` GATE-007 escape suite: version-pinned, maintained escape-vector list with per-vector provenance; red-then-green demonstration per vector; unattempted vectors become typed UNK-*.
- DEF-C-3 [P2] — FIXED — `shared-gates.md` GATE-007(2): the forbidden syscall set is derived from the charter threat model, pinned as a truth-pack fixture with a review date, and diff-reviewed on substrate generation change.
- DEF-C-4 [P1] — FIXED — `shared-gates.md` GATE-010: named secret/PII classification; masking on by default for prompt/response; cassettes/fixtures scanned for unmasked secrets in CI.
- DEF-C-5 [P1] — FIXED — `pickup-browser-use.md` trust-boundary subsection: hostile page content is untrusted input (never instruction); policy-mediation layer; committed prompt-injection fixtures; credentials out of DOM/committed YAML.
- DEF-C-6 [P1] — FIXED — `pickup-browser-use.md`: secret-bearing evals never on every PR; scheduled/merge-queue/labeled only with maintainer opt-in; spend receipt per run.
- DEF-C-7 [P1] — FIXED — `pickup-sandbox-exec.md` UNK-1 marked BLOCKS_PLAN (maintained vector list + red-then-green suite required).
- DEF-C-8 [P1] — FIXED — `REQ-CI-COST` added to all 21 companions (runner class/host, provisioning owner, funding owner, schedule, spend cap, GPU-hour/lab-spend accounting; any TBD blocks S5). Count verified: 21.
- DEF-C-9 [P2] — FIXED — `pickup-web-search-apis.md` REQ-SEARCH-03: corpus captures pass a secrets/PII scrub per the GATE-010-style classification before commit; scrub step + classification version recorded in capture metadata.
- DEF-C-10 [P2] — FIXED — `pickup-computer-use.md` remote-lab variant: names credential scopes (least-privilege provisioning/VM tokens), secret-hygiene rules, and lab-side attestation before REMOTE-LAB receipts can bank goldens.
- DEF-C-11 [P2] — FIXED — Every UNK-* row in all 21 companions carries a disposition (BLOCKS_PLAN / TARGETED / ADVISORY / WATCH / RESOLVED). Validation script reports zero untyped Unknowns-section rows.
- DEF-C-12 [P2] — FIXED — `shared-gates.md` GATE-014: named key scopes (read-only where possible), secret masking in receipt/CI logs, rotation/expiry note alongside the secret inventory.

### Lane D — Tests / Oracles / Negative-evidence / Claims

- DEF-D-1 [P1] — FIXED — `pickup-agent-memory.md` tier legend replaced with the playbook mapping verbatim; all 14 rows re-tiered.
- DEF-D-2 [P1] — FIXED — `pickup-rag-frameworks.md` tier legend replaced; rows re-tiered.
- DEF-D-3 [P1] — FIXED — `pickup-vector-dbs.md` tier legend replaced; competitive-claims tier is T2-with-GATE-VDB-01–04, not T1.
- DEF-D-4 [P1] — FIXED — `pickup-eval-harnesses.md`: single playbook scheme; rows re-tiered consistently.
- DEF-D-5 [P1] — FIXED — Playbook Claim/evidence governance is now normative: "Every companion states this mapping verbatim in its claim-registry section, or cites this playbook section by name; a companion that states no mapping, or an inverted one, is non-conformant and gets a P1."
- DEF-D-6 [P2] — FIXED — `[External]` folded under T2 in `pickup-agent-memory.md`.
- DEF-D-7 [P2] — FIXED — `pickup-agent-memory.md` CLAIM-1 split: CLAIM-1 (T0, repo/file existence verified) + CLAIM-1b (T2, vendor adoption self-reports, [README]-marked).
- DEF-D-8 [P2] — FIXED — `pickup-vector-dbs.md` CLAIM-VDB-04: statement narrowed to verified filter-relevant coverage; tier T2; status CONTESTED.
- DEF-D-9 [P1] — FIXED — `pickup-rag-frameworks.md` GATE-RAG-1/2/4 labeled `[Inference]` with honest-gap sentences (judge-freeze, citation coverage, threshold provenance).
- DEF-D-10 [P1] — FIXED — `pickup-eval-harnesses.md` GATE-EH-3 labeled `[Inference]` (dummy path proves wiring, not grading correctness).
- DEF-D-11 [P1] — FIXED — `pickup-agent-memory.md` GATE-MEM-2 labeled `[Inference]` (judge floor measures variability, not validity).

### Lane E — Operations / Release

- DEF-E-1 [P0] — FIXED — `PROJECT-PICKUP-PLAYBOOK.md` Roles: parent orchestrator is the assignment authority; reviewer eligibility (ineligible if authored/drafted or previously reviewed) and independence attestation logged in ROUND_LOG.md before review begins.
- DEF-E-2 [P1] — FIXED — DEF statuses (OPEN / FIXED / WONTFIX / DEFERRED) + machine-readable ROUND_LOG.md line grammar; `DEFERRED` does not close P0/P1.
- DEF-E-3 [P1] — FIXED — ROUND_LOG.md schema published; BEADS READY certificate template with checkable attestations; missing/schema-invalid certificate blocks S5.
- DEF-E-4 [P1] — FIXED — Substance defined operationally (edits to claims, gates, thresholds, requirements, or acceptance criteria = substantive; POLISH is a review round, not a label; any substantive change re-opens S4 and voids a prior POLISH).
- DEF-E-5 [P1] — FIXED — `shared-gates.md` amendment procedure: gate retirement rule (superseding gate named; IDs stable; RETIRED mark with removal-of-force date); acceptance criteria versioned (`GATE-001 v1`, `v2`, …); amendment authority is the parent orchestrator.
- DEF-E-6 [P1] — FIXED — Evidence auditor: scope (all P0-cited + oracle pointers + reproducible random/risk sample), live-GitHub-API check, failure disposition (becomes a DEF, demotes dependent claims, reopens the stage, blocks BEADS READY).
- DEF-E-7 [P1] — FIXED — See DEF-C-8 (REQ-CI-COST in all 21).
- DEF-E-8 [P1] — FIXED — See DEF-B-19 / DEF-D-1..D-4 (tier migration).
- DEF-E-9 [P1] — FIXED — Separation of duties: plan author is not the integrator and may not review their own artifact; disputed P0/P1 goes to another independent reviewer; unresolved P0 stays OPEN.
- DEF-E-10 [P1] — FIXED — See DEF-A-1 (playbook G1–G14 table aligned to the reference, marked non-normative).
- DEF-E-11 [P2] — FIXED — Reopen procedure: parent orchestrator records a REOPEN line naming artifact, round, trigger; artifact returns to the named stage; S4 re-runs; no stage skipped on re-entry.
- DEF-E-12 [P2] — FIXED — `pickup-observability.md` starter-kit delta now cites CLAIM-OBS-009 (was dangling "O9").
- DEF-E-13 [P2] — FIXED — `pickup-guardrails.md` corpus-export tooling marked TARGETED (not a starter-kit delta) with the missing contract stated explicitly.
- DEF-E-14 [P2] — FIXED — Auditor findings become DEF-* records in ROUND_LOG.md (routed to the integrator).
- DEF-E-15 [P2] — FIXED — S4 capped at 3 rounds; thereafter the integrator must certify-or-kill with written reasons.

### Lane F — Fresh-agent usability

- DEF-F-1 [P0] — FIXED — See DEF-A-6 (playbook table filenames match disk).
- DEF-F-2 [P1] — FIXED — `pickup-voice-agents.md` gate profile rewritten against `_s0/g1-g14-reference.md` verbatim with bare G1…G14 IDs.
- DEF-F-3 [P1] — FIXED — Voice `GATE-G1…G14` eliminated; RL `GATE-1..4` → `GATE-RL-01..04`; RL companion states type-local gates are NOT registry-adopted (registry adoption requires the shared-gates.md amendment procedure).
- DEF-F-4 [P1] — FIXED — Voice Evidence tiers: the 1–5 scheme deleted; playbook T0–T3 table stated with Rulebook tier names.
- DEF-F-5 [P1] — FIXED — RL Evidence tiers: playbook table with Rulebook tier names; RL-specific examples as a second column.
- DEF-F-6 [P1] — FIXED — See DEF-A-1 / DEF-E-10.
- DEF-F-7 [P1] — FIXED — `pickup-rl-envs.md` G11: canonical Rust meaning; advisory/N-A for pure-Python; test-directory mirroring moved to REQ-5 (not G11).
- DEF-F-8 [P1] — FIXED — Playbook glossary defines ATLAS BUILD_READY (what: ATLAS build-pipeline build-ready verdict; where: ATLAS build log; form: PASS/FAIL record; discipline: no build-readiness claim without it).
- DEF-F-9 [P1] — FIXED — Playbook glossary: NODUS, L1 (evidence layer), L5 (publication layer), Phase-0, 53-edge dependency screen.
- DEF-F-10 [P1] — FIXED — A-Z Playbook cited as `_s0/ecosystem-digest.md` step 22; gate-log row format restated in S3 exit.
- DEF-F-11 [P1] — FIXED — Reviewers "work from the companion as the primary artifact, and may inspect only files the companion explicitly cites".
- DEF-F-12 [P2] — FIXED — RFC 2119 declared normative for the playbook and all companions; voice SHALL uses read as MUST.
- DEF-F-13 [P2] — FIXED — Gate log defined: `docs/planning/GATE_LOG.md`, zero FAIL verdicts on wired gates (PASS / N-A with reason / WAIVED with waiver).
- DEF-F-14 [P2] — FIXED — "ATLAS R7" glossed at first use (R7 = ATLAS revision 7 of the claim schema; eight fields).
- DEF-F-15 [P2] — FIXED — `ACCEPTANCE_SURFACE.json` minimal schema present in the truth-pack spec (version, written_before, …).
- DEF-F-16 [P2] — FIXED — Playbook prescribes `templates/<slug>/…`; voice templates consolidated under `templates/voice-agents/`.
- DEF-F-17 [P2] — FIXED — Packet shorthand given in-place definitions (e.g. SELF-SPEEDUP vs CAMPAIGN WIN in `pickup-rl-envs.md`); packets cited, not defined-by.
- DEF-F-18 [P2] — FIXED — S0 states the evidence path pattern (`_evidence/<slug>.md`).
- DEF-F-19 [P2] — WONTFIX — Voice claim table has no owner column. Rationale: the 21-file claim-schema migration fixed columns to `ID | Statement | Evidence pointer | Tier | Confidence | Status`; a per-file extra column breaks the schema the playbook mandates. The ATLAS R7 `owner` field is tracked in the section prose as `TBD (S3)` (`bead-claim-owners`), which satisfies G3 at S2 draft status without breaking the schema.
- DEF-F-20 [P2] — FIXED — Voice normative content (truth-pack shape, TARGETED-vs-OBSERVED, CAMPAIGN WIN doctrine) is inlined; `_s0/model-guides.md` section pointers are citations only.

## Deferred P2s (explicit list)

1. **DEF-A-8** — ID numbering-style normalization (`REQ-01` vs `REQ-1` vs `REQ-EMB-001`). No collisions or orphans today; the canonical zero-padded `REQ-<SLUG>-<NN>` / `GATE-<SLUG>-<NN>` / `CLAIM-<SLUG>-<NN>` / `UNK-<SLUG>-<NN>` format is declared for all new IDs. Full renumbering deferred to S5 (it would churn every claim registry and in-file cross-reference for no traceability gain today).

## WONTFIX (explicit list)

1. **DEF-F-19** — Voice claim-table owner column. Rationale above: would break the playbook-mandated 21-file claim schema; ownership tracked as `TBD (S3)` in prose.

## Standing caveats (not DEFs, carried forward)

- **Claim-tier audit:** the 283-row T0–T3 migration is provisional pending a manual semantic audit (T1 currently has zero rows; CI-workflow existence vs observed runs; README/vendor claims; contested verified-absence claims). S4 must not treat the migration as final until this is complete.
- **BLOCKS_PLAN unknowns:** numerous UNK-* rows are conservatively typed BLOCKS_PLAN (notably sandbox UNK-1); no S5 readiness may be claimed while any remain.
- **Inference labels added this round** (labeled inline, not silently): RAG judge-freeze/citation-coverage/threshold-provenance gaps; eval GATE-EH-3 dummy-path limitation; agent-memory GATE-MEM-2 judge-floor limitation; GATE-007(5) escape suite; GATE-RL-04 reward-hack negative control; GATE-004 differential fuzzer (pre-existing).

## Files changed (exact list)

- `PROJECT-PICKUP-PLAYBOOK.md`
- `shared-gates.md`
- All 21 `pickup-*.md` companions
- `docs/planning/round1/INTEGRATION.md` (this file, new)

No changes to `_evidence/`, `_s0/`, `docs/planning/round1/DEF-*`, or `INTENT.md`.
