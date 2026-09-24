# DEF4 — Lane C (mechanical conformance), S4 Round 4

Date: 2026-09-23. Method: fresh scripts written for this run; nothing from prior reports trusted. No corpus file edited.

## Check 1 — H1/H2 structure — PASS
All 21 `pickup-*.md` companions have exactly one `# ` H1 and exactly nine `## ` H2s. Violators: none (0/21).

## Check 2 — shared-gate declaration table — PASS
All 21 companions carry a "Shared-gate declarations" heading followed by a markdown table headed `| Shared gate |`. Missing: none (0/21).

## Check 3 — ROUND_LOG.md grammar — PASS
Playbook grammar section: "machine-readable: one record per line" (PROJECT-PICKUP-PLAYBOOK.md § "machine-readable", types round|attest|unk|audit|stage-artifact|skip|intake|cert|def|reopen|kill).
- Data lines outside the `<!-- -->` header comment: **285**. Blank lines among them: 0.
- Non-conforming lines: **0**. Verbatim list: (none).

## Check 4 — BLOCKS_PLAN in companions — PASS
Literal `BLOCKS_PLAN` occurrences across all 21 companions: **0**. (ROUND_LOG.md also has 0, checked incidentally.)

## Check 5 — S5 registries self-consistent — PASS
Ran `s5_extract.py` + `s5_analyze.py` on copies with ROOT redirected to a /tmp corpus copy (originals untouched; only deviation: /tmp copy excluded `_evidence/`, which the scripts' scope excludes anyway — the sole regenerated diff vs committed state was the manifest `evidence_file` column, y→n, explained by that exclusion).
- Regenerated + committed `_analysis.json` agree: `open_p0p1 = []`, `blocks_plan = []`; manifest `BLOCKS_PLAN_UNKs` = 0 for all 21 rows in both.
- `blocks-plan-ledger.md` table body: 0 rows. `open-p0p1.md` asserts 0 open/0 deferred P0/P1.
- Finding (P2, doc-cosmetic, does not break the exit condition): `blocks-plan-ledger.md`'s header says "25 rows across 14 companions" and its footer says "Owner stated in 0/25 rows", while the table body is empty — stale header/footer contradicting the (correct) empty body. Recommend updating the header/footer to state 0 rows.

## Check 6 — evidence-tier spot check — PASS
3 companions × 5 random claims (seed 20260923), tier labels checked against the cited `_evidence/` pack:
- pickup-eval-harnesses.md: CLAIM-EH-06, -04, -05, -14 (all T0 — pack shows direct API/file inspection, including the tau-bench `.github` 404); CLAIM-EH-13 (T3 — self-declared inference, "no evidence file records a repo's full offline CI path being exercised").
- pickup-quantization.md: CLAIM-7, -4, -1, -9 (all T0 — pack's process-practices rows confirm every cited file path/API observation); CLAIM-8 (T3 — evidence column itself states "adopted corpus doctrine, not observed in a quantization repo").
- pickup-vector-dbs.md: CLAIM-VDB-09, -13, -14, -10 (all T0 — pack practice rows confirm exact file trees/API data); CLAIM-VDB-04 (T2 — pack caveat: "Filter-correctness file evidence is partial... did not verify a dedicated filtered-recall correctness suite at file level"; the conservative T2 is the honest tier).
- Mismatches: **0**.

## Overall
All six checks pass. One P2 doc-cosmetic finding (stale ledger header/footer text); no P0/P1. BEADS READY exit-condition inputs verified mechanically: 0 open P0/P1, 0 BLOCKS_PLAN rows.
