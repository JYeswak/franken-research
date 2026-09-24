# INTEGRATION3 — S4 Round 3 integration record (2026-09-23)

*Integrator: S4 round-3 subagent. Scope: apply all round-3 lane findings
(DEF3-laneA/C/D), apply the BLOCKS_PLAN triage
(`docs/planning/round3/TRIAGE-blocks-plan.md`), rebuild the unknowns ledger,
rewrite `ROUND_LOG.md` as grammar-conformant records. Terse register; every
repo/path/star fact below was read from the corpus on 2026-09-23; inferences
are labeled inline.*

## Fixed counts

**Scored round-3 findings (DEF3): 37 — all FIXED.**

| Lane | P0 | P1 | P2 | Total | Status |
|---|---|---|---|---|---|
| A (cold execution) | 4 | 13 | 9 | 26 | all FIXED — playbook amendments |
| C (failure/security) | 1 | 1 | 1 | 3 | all FIXED |
| D (tests/oracles/claims) | 0 | 3 | 5 | 8 | all FIXED — companion tier/wording fixes |
| **Total** | **5** | **17** | **15** | **37** | **37 FIXED** |

**Integrator final sweep: 4 additional P0 — all FIXED.** The closing
`grep exorcist` sweep found the same invented-mechanism class as DEF3-C-1
in four companions lane C did not score (DEF3-INT-1..4, logged in
`ROUND_LOG.md`): `pickup-sandbox-exec.md` G6, `pickup-web-search-apis.md` G6,
`pickup-observability.md` G6, `pickup-workflow-orchestrators.md` G6. All four
reworded to the canonical G6 (new unsafe sites carry `// SAFETY:`, tree-wide
inventory accounted) or a labeled G6-analog per the playbook's
Rust-centric-gates rule. `_evidence/` contains zero `exorcist` hits; the
`[T-C17]`/`[T-N6]` pointers resolve nowhere in the evidence packs.

**BLOCKS_PLAN triage applied: 29 rows — 7 RESOLVED, 22 TARGETED, 0 STAYS.**

- 25 rows from `TRIAGE-blocks-plan.md`: 6 RESOLVED, 19 TARGETED.
- 2 voice rows the triage missed from the ledger's source set: UNK-VA-1
  RESOLVED, UNK-VA-3 TARGETED.
- 2 rows that carried the literal `Disposition: BLOCKS_PLAN` marker but were
  never in the triage's 25-row set (found by the integrator's raw grep:
  30 literal occurrences vs 25 triaged rows, incl. a duplicate inline
  sandbox-exec UNK-1 mention): `pickup-browser-use.md` UNK-BU-1 and
  `pickup-quantization.md` UNK-1. **Integrator-triaged TARGETED with round-3
  triage notes, flagged for parent re-triage** (lane B did not cover them;
  the verdict is the integrator's, not the triage's). The sandbox-exec
  duplicate inline mention was updated to agree with the canonical row.
- Every re-typed row carries its disposition + triage resolution/predicate/
  owner/S3 step in the companion; `docs/planning/ROUND_LOG.md` carries 29
  `unk` lines (7 RESOLVED, 22 TARGETED, 0 BLOCKS_PLAN).

## Files changed (exact list)

1. `PROJECT-PICKUP-PLAYBOOK.md` — v1.2 → v1.3 (constitution amendment,
   ordered by the parent orchestrator 2026-09-23). Sections added/amended:
   working root; S1 contradiction rule; S1 drafts prose / S2 mints IDs;
   review-lane taxonomy A–F (+ `lanes=` on `round` lines); ATLAS R7 owning-bead
   `TBD (cut at S5)` + class/validity-domain/gate vocabularies; A/A runner
   defined as the pickup's declared executable (glossary entry; `aa <spec>`
   is shorthand for its invocation); `REQ-CI-COST` declared a universal
   cross-type requirement ID; universal gate disposition added to the
   vocabulary (GATE-014/015/016/018); S5 certification-scope limitation
   (authoring-process `open_p0p1` ≠ type certification); S0 intake note path/
   format + `intake` record grammar; evidence bar (≥5 live-verified primary
   type repos, dataset/reference repos counted separately); Phase-0 record
   named (`INTENT.md`); forward-reference vs failed-pointer rule; claim↔REQ
   bidirectional binding; provisioning/funding authority on the parent
   orchestrator; UNK ledger scans the entire companion text; anti-reward-
   hacking law no longer depends on an absent root `AGENTS.md`; S0 rider
   screen procedure; S2 pin-acquisition procedure + `MANIFEST.sha256`
   semantics; `registries/claims.tsv` schema; `cert` grammar gains
   `result=<BEADS READY|NOT READY>`; `round` grammar `pin=<sha|UNCOMMITTED>`.
2. `pickup-agent-frameworks.md` — 3 UNK dispositions → TARGETED; 5 gate-profile
   rows normalized to full `shared-gates.md` titles.
3. `pickup-agent-memory.md` — UNK-2 → TARGETED, UNK-4 → RESOLVED (+ stipulative
   type-boundary criterion written into the charter).
4. `pickup-browser-use.md` — UNK-BU-1 → TARGETED (integrator triage, flagged).
5. `pickup-computer-use.md` — UNK-02 → TARGETED.
6. `pickup-embedding-serving.md` — UNK-EMB-002/005 → RESOLVED (+ canonical
   weight-revision pin format in the integrity section; multi-vector tier
   OPTIONAL recorded in the bench tiers), UNK-EMB-004 → TARGETED.
7. `pickup-eval-harnesses.md` — charter gains Trust boundaries + Release
   definition subsections; UNK-EH-O1/O2 renumbered to UNK-EH-07/08 with
   TARGETED dispositions (canonical definitions in Unknowns); G6 restated as
   advisory + labeled G6-analog; T1 bullet narrowed to observed runs/banked
   receipts (workflow-file existence = T0 "configured practice" only);
   G1–G14 wired/N-A roster already present and complete (14/14 covered).
8. `pickup-fine-tuning.md` — UNK-06 → TARGETED.
9. `pickup-guardrails.md` — Evidence tiers section replaced with the canonical
   T0–T3 mapping verbatim + type-application guidance (no redefinitions).
10. `pickup-mcp.md` — DEF3-C-1 P0: exorcist clause deleted from the G6 entry;
    3 gate-profile rows normalized to full titles; UNK-MCP-01 → TARGETED.
11. `pickup-multi-agent-protocols.md` — 2 gate-profile rows normalized;
    UNK-MAP-1/2 → TARGETED.
12. `pickup-observability.md` — CLAIM-OBS-004 → T0 / Medium / CONTESTED with
    narrowed statement; UNK-OBS-001/002 → TARGETED; G6 exorcist clause
    (DEF3-INT-3) replaced with labeled G6-analog.
13. `pickup-quantization.md` — CLAIM-8 and CLAIM-10 → T3 / Low / CONTESTED
    (adopted corpus doctrine); UNK-1 → TARGETED (integrator triage, flagged).
14. `pickup-rag-frameworks.md` — UNK-1/UNK-2 → RESOLVED (+ dataset hash-pin
    convention in the truth-pack section); UNK-3 wording → "above T2
    [Maintainer claim]".
15. `pickup-rl-envs.md` — UNK-1 → TARGETED; UNK-5 → RESOLVED.
16. `pickup-sandbox-exec.md` — UNK-1/UNK-6 → TARGETED; duplicate inline
    BLOCKS_PLAN mention → TARGETED forward reference; G6 exorcist clause
    (DEF3-INT-1) replaced with canonical G6.
17. `pickup-structured-output.md` — UNK-1 → TARGETED.
18. `pickup-vector-dbs.md` — T1 bullet narrowed to observed runs; third-party
    harness results and competitive claims moved to T2-with-gates (never T1);
    ann-benchmarks wording neutralized; UNK-VDB-01 → TARGETED.
19. `pickup-voice-agents.md` — UNK-VA-1 → RESOLVED (+ self-measured T1 latency
    truth written into the bench tiers); UNK-VA-3/VA-5 → TARGETED.
20. `pickup-web-search-apis.md` — UNK-SEARCH-01 → TARGETED; G6 exorcist clause
    (DEF3-INT-2) replaced with labeled G6-analog.
21. `pickup-workflow-orchestrators.md` — 2 gate-profile rows normalized;
    G6 exorcist clause (DEF3-INT-4) replaced with canonical G6/advisory.
22. `docs/planning/ROUND_LOG.md` — rewritten: 2026-09-23 backfill; 279
    grammar-conformant data lines (15 attest, 15 round, 1 audit, 3
    stage-artifact, 1 skip, 29 unk, 214 def, 1 cert) under a human-readable
    `<!-- -->` header documenting backfill conventions. Stage coverage:
    S0=_evidence/, S1=INTENT.md, S2=PROJECT-PICKUP-PLAYBOOK.md registered;
    S3 = skip (honest: the 21 type pickups were designed, not executed —
    recorded as absence, not completion). The cert line is
    `result=NOT READY` (see below).
23. `docs/planning/s5/blocks-plan-ledger.md` — rebuilt: 0 BLOCKS_PLAN rows
    across all 21 companions (header corrected from "14 companions"); scan
    covers entire companion text incl. duplicate/inline mentions; disposition
    log records the 29 re-typed rows (7 RESOLVED / 22 TARGETED) incl. both
    voice rows and the two integrator-triaged rows.
24. `docs/planning/round3/INTEGRATION3.md` — this file (new).

`shared-gates.md` required no change (all titles already canonical; the
"universal" vocabulary addition went to the playbook glossary per the
amendment order). DEF3-*, INTENT.md, `_evidence/`, `_s0/`, `docs/planning/round1/`,
`docs/planning/round2/`, `s5/scripts/` untouched per constraints.

## Verification results (2026-09-23, mechanical)

- `grep -ri "exorcist" pickup-*.md PROJECT-PICKUP-PLAYBOOK.md shared-gates.md`
  → **0 hits**. (Remaining corpus hits are historical DEF-record text in
  `docs/planning/round1/`, `round2/`, `round3/` and the off-limits `_s0/`
  digest — records of the finding, not claims; def lines in ROUND_LOG.md
  document the deletions.)
- `grep -c "Disposition: BLOCKS_PLAN" pickup-*.md` → **0 for all 21 files**;
  no companion contains a BLOCKS_PLAN UNK of any form (canonical rows,
  inline mentions, and duplicates all re-typed).
- `ROUND_LOG.md` parses: 279 data lines, 0 field errors against the v1.3
  grammar (key sets, severity/status/disposition/result/verdict vocabularies
  checked); five records spot-checked (attest/round/audit/def/cert) — all
  conform and match their sources.
- `def` line census: 92 (round 1) + 81 (round 2) + 37 (round 3) + 4
  (integrator sweep) = 214; statuses: 212 FIXED, 1 DEFERRED (DEF-A-8, owned
  by S5 normalization), 1 WONTFIX (DEF-F-19, with rationale). Zero OPEN P0/P1.
- Blocks-plan ledger: 0 BLOCKS_PLAN rows; 29 `unk` lines in ROUND_LOG.md
  with 0 BLOCKS_PLAN dispositions.

## BEADS READY status

**Not asserted.** The `cert` line in `ROUND_LOG.md` carries
`result=NOT READY`: S3 was never executed per type (honest skip), round-3
integration was applied 2026-09-23, and the playbook (v1.3, S5 limitation)
requires at least one type-specific S4 round with a type-specific DEF
namespace before any type's certification. No grammar/cert requirement is
claimed to pass beyond what the log mechanically shows: the log parses, zero
OPEN/DEFERRED P0/P1 def records exist, no `unk` line has disposition
BLOCKS_PLAN, the latest audit line is `result=pass`, and S0–S2 have
stage-artifact records with S3 as a `skip`.

## Open questions / recommended follow-ups for the parent

1. Re-triage the two integrator-triaged rows (`pickup-browser-use.md`
   UNK-BU-1, `pickup-quantization.md` UNK-1): lane B never scored them; the
   TARGETED verdicts and owners are the integrator's and are flagged as such
   in the companions.
2. Confirm the round-3 lane-B lane was intentionally not run (no DEF3-laneB
   file exists); the triage's 25-row set was built on lanes A/C/D output.
3. Decide whether the four DEF3-INT exorcist deletions warrant a lane-C
   re-review or stand as integrator-applied P0 fixes.
4. The `attest`/`round` reviewer names are backfilled lane identifiers
   (`round1-laneA`, …); real reviewer names were never recorded — a future
   process should log them at review time.
5. The round-2 lane-E audit's random seed was not recorded (`seed=unrecorded`
   in the log); future audits must record it per the playbook.
