# DEF4-laneB: Round 4 convergence check — eval-harnesses, mcp, sandbox-exec, workflow-orchestrators

Date: 2026-09-23. Cold read; no prior round context. Evidence spot-checked only
for suspect claims, against `_evidence/{eval-harnesses,mcp,sandbox-exec,workflow-orchestrators}.md`.

## P0 (fabricated mechanism / false claim)

**Zero P0 findings.** Every specific mechanism, file pointer, workflow name, and
process claim spot-checked exists verbatim in the corresponding evidence pack
(~40 pointers across the four files, incl. the oddly specific ones: harbor
`tests/golden/terminus_2/`, inspect_ai `pr-gate.yml`/`suppressions.yml`,
`mockllm.py` + `custom_outputs`, SWE-bench `test_grading_spoofed_output.py`
trio, gorilla `TEST_CATEGORIES.md`, terminal-bench 301 line, MCP
`expected-failures{,.2025-11-25,.2026-07-28}.yml`, `mcp-everything-server` boot,
inspector "roughly TWICE the slowest run observed" timeout comment,
`pkg/toolvalidation`, `detect-packages` matrix, Firecracker `test_sec_audit.py`
/ `test_custom_seccomp.py` / `test_seccomp_validate.py`,
Cloudflare `performance.yml` seven-scenario set, E2B `performance.py`
`E2B_TESTS_BENCHMARK_ITERATIONS_COUNT`, kata `tests/stability/`,
temporalio `_replayer.py` + both history fixtures,
`tests/contrib/{openai_agents,langgraph,google_adk_agents,deepagents}`,
sdk-go `clock.NewMock()`/`DeadlockDetectionTimeout`, restate
`journal_table_test/mod.rs`, trigger.dev `replayTaskRun.server.ts`,
cadence `simulation/history|matching|replication`). Inferences are explicitly
labeled in-place ("[Inference, labeled]", "thin:", "labeled inference",
GATE-EH-3's honest wiring caveat). WITHDRAWN rows (MCP CLAIM-12, sandbox
CLAIM-10) correctly carry `--` confidence and are retained as negative
evidence; CONTESTED rows (EH CLAIM-EH-13, SB CLAIM-9) are labeled and
downgraded, not promoted. No process/operator/classification is asserted
beyond what the pack supports or labels as inference.

## P1 (material inconsistency)

**Zero P1 findings.**

- Tier labels used consistently within each companion and match each
  companion's own legend (T0/T1/T2/T3; confidence mappings respected;
  MCP's flavor vocabulary [Verified]/[Maintainer claim]/[External]/[Inference]
  maps cleanly onto T0/T2/T3).
- Gate references resolve: GATE-EH-1..4, GATE-SB-1..4, GATE-DW-1..4, and the
  retired-into-shared bookkeeping (MCP→GATE-006/017, SB-1/4→GATE-007,
  DW-1/4→GATE-005) are all defined in-file and referenced consistently from
  the starter-kit deltas sections. Shared gates (GATE-002/004/005/006/007/
  010/011/014–018) each described in the local shared-gate table;
  dispositions are type-appropriate and cross-consistent
  (014/015/016/018 Universal in all four; 007 load-bearing for sandbox-exec,
  advisory for eval-harnesses — the intended per-type difference).
- All UNK rows carry dispositions (TARGETED/ADVISORY) plus round-3
  promotion predicates where triaged. CLAIM counts match the stated counts
  (workflow: 13 claims / 16 gates / 6 REQs / 5 UNKs / 15 repos — verified).

## P2 (polish)

1. **sandbox-exec — residual round-3 merge artifacts in UNK-1.** The
   Oracle-section UNK-1 disposition reads "...builds and pins the vector
   list). (per shared-gates.md GATE-007: maintained and version-pinned, with
   per-vector provenance), and (b) a red-then-green suite exists that FAILS..."
   — dangling "(b)" with no "(a)" and a parenthesized fragment after a full
   stop. The canonical UNK-1 row in Unknowns ends with a dangling restatement
   ("maintained escape-vector list (GATE-007) and a red-then-green suite
   exist; unattempted vectors are typed UNKs, never implied passes.") after
   the Promotion predicate. Cosmetic; the intended disposition is recoverable.
2. **eval-harnesses — mis-pointed REQ cross-reference.** Shared-gate table,
   GATE-007 row: rationale ends "(REQ-EH-5)". REQ-EH-5 is CI marker
   discipline; the row is about escape-claim/confinement discipline. The REQ
   pointer does not support the rationale sentence. Cosmetic (likely meant
   REQ-EH-2 or no pointer), not a false claim.

## Structure

All four files: exactly one H1 and nine H2 sections (Charter seed; Oracle
candidates + integrity checks; Initial claims; Gate profile; Evidence tiers;
Localbench bench shape; Starter-kit deltas; Trend + process citations;
Unknowns). Each Gate profile contains a shared-gate declaration table
(load-bearing vs advisory vs universal). REQ-CI-COST block is byte-identical
across all four. Verified by heading grep.

## Observations (not findings)

- MCP CLAIM-01's wire-delta parenthetical ("stateful handshake vs stateless
  per-request `_meta`") is T0-cited from the evidence pack's own assertion
  (mcp.md line 22), while the companion's caveats honestly admit the delta
  "was not re-read for this file" — the T0 rests on the pack, flagged openly.
  Not a fabrication; the honest-caveat machinery is doing its job.

## Verdict

**Converged.** Zero P0, zero P1, two P2 polish items (sandbox-exec UNK-1
merge residue; eval-harnesses REQ pointer). Recommend both be fixed as
copy-edits; neither blocks convergence.
