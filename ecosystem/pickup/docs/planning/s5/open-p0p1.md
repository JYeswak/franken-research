# Open P0/P1 ledger — the BEADS READY "zero open P0/P1" check input

*Source: all 214 DEF findings (round 1: 4 P0 / 57 P1 / 31 P2; round 2: 0 P0 / 34 P1 / 47 P2; round 3: 9 P0 / 17 P1 / 15 P2) with dispositions from `docs/planning/round1/INTEGRATION.md`, `docs/planning/round2/INTEGRATION2.md`, and `docs/planning/round3/INTEGRATION3.md`.*

## Status: zero OPEN and zero DEFERRED P0/P1

- Round 1: P0 4/4 FIXED, P1 57/57 FIXED (INTEGRATION.md: "Disposition totals: FIXED 90 · WONTFIX 1 (F-19) · DEFERRED 1 (A-8) · OPEN 0. No P0/P1 deferred or open.")
- Round 2: P1 34/34 FIXED, P2 47/47 FIXED (INTEGRATION2.md: "Open count: 0. Every P1 (34) and every P2 (47) is FIXED.")
- Round 3: P0 9/9 FIXED (4 lane-A/C + 5 integrator-raised DEF3-INT), P1 17/17 FIXED, P2 15/15 FIXED (INTEGRATION3.md).
- `docs/planning/ROUND_LOG.md` carries no OPEN lines; both ledgers record `open=0`.
- Non-qualifying carry-forwards (P2 only): DEF-A-8 DEFERRED → S5 (ID-namespace normalization); DEF-F-19 WONTFIX (voice claim-table owner column, schema rationale recorded). Neither is P0/P1.

## FIXED-but-flagged-as-new-defect — 5 entries (P1, all FIXED in INTEGRATION2)

These are the findings whose own text flags them as defects *introduced by* a round-1 fix (or residue a round-1 fix left behind). They are FIXED, so the "zero open P0/P1" gate is not tripped by them — but they are the reason the round-2 diff cannot be POLISH (see `diff-class.md`), and any S4 re-run must re-verify the flagged fixes rather than assume round-1 FIXED lines stayed fixed.

### DEF2-A-1 [P1] — FIXED (flagged)
- docs/planning/round2/DEF2-laneA.md:19: Self-contradiction in shared-gates.md "introduced by the round-1 retirement addition": line 7 "the set only grows by constitution amendment" vs line 21 "The set does not only grow: a superseded gate is retired…". Round-1 fix for DEF-E-5 added the retirement rule without reconciling the original sentence. INTEGRATION2 fix: line 7 now reads "the set changes only by constitution amendment".

### DEF2-B-3 [P1] — FIXED (flagged)
- docs/planning/round2/DEF2-laneB.md:43: structured-output UNK-2 "falsely RESOLVED" — "a new defect introduced by the round-1 fix, not a re-litigation of the original UNK": the round-1 fix stamped RESOLVED while the row's own rationale deferred confirmation to future S4 review. INTEGRATION2 fix: G1–G14 map rebuilt; UNK-2 set to TARGETED "pending S4 confirmation".

### DEF2-C-1 [P1] — FIXED (flagged)
- docs/planning/round2/DEF2-laneC.md:44: workflow-orchestrators starter-kit delta still lists "New gates — GATE-DW-1..4 registered" as active, "directly contradicting the round-1 retirement into shared GATE-005 stated in the same file's Gate profile" — round-1 retirement fix left a stale delta line behind. INTEGRATION2 fix: deltas register only GATE-DW-2/3.

### DEF2-C-5 [P1] — FIXED (flagged)
- docs/planning/round2/DEF2-laneC.md:77: computer-use bench shape / golden schema cite retired GATE-CUA-03 and GATE-CUA-04 as active requirements, "although both were retired into shared GATE-008 in round 1" — round-1 retirement fix left stale citations. INTEGRATION2 fix: schema cites shared GATE-008 parameters.

### DEF2-C-6 [P1] — FIXED (flagged)
- docs/planning/round2/DEF2-laneC.md:86: computer-use starter-kit delta "proposes registering a retired gate ID [GATE-CUA-04] as an active gate in the kit" — same round-1 retirement residue as C-5. INTEGRATION2 fix: registers under GATE-008's benchmark-pin parameter.

## Check procedure for the gate

1. Parse `id-index.tsv` rows with `kind=DEF`, `ledger_disposition` in (OPEN, DEFERRED), `severity` in (P0, P1) → must be zero rows.
2. This file asserts that result for the current corpus state: **0 rows**.
3. Re-run `/tmp/s5_extract.py` + `/tmp/s5_analyze.py` after any corpus edit; the scripts are deterministic and the TSV is the check input.

