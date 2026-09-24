# DEF5-laneB — Round 5 Lane B: mechanical re-verification (Round 4 outputs)

Date: 2026-09-23. Scope: `~/workspace/franken-research/ecosystem/pickup/`. Fresh context; all checks re-derived with own commands. No corpus file edited.

## Check 1 — Playbook ROUND_LOG grammar: code blocks vs prose — PASS

- Grammar section: `PROJECT-PICKUP-PLAYBOOK.md` lines 658–764 (heading "ROUND_LOG.md line grammar" to "**BEADS READY certificate.**").
- 11 code blocks found. Lead tokens: `round=<N>`, `attest`, `unk`, `audit`, `stage-artifact`, `intake`, `cert`, `def=<DEF-id>`, `skip`, `reopen`, `kill`.
- Prose lead-tag sentence (lines 660–663): bare tags (`attest`, `unk`, `audit`, `stage-artifact`, `intake`, `cert`, `skip`, `reopen`, `kill`); keyed only `round` and `def` (`round=<N>`, `def=<DEF-id>`).
- Every code-block lead token matches the sentence: 9 bare blocks ⊂ the 9 bare tags; 2 keyed blocks = `round`, `def`. No block shown that the sentence omits; no type in the sentence lacking a block.
- Every block has a prose intro line: "Round lines …:", "Pre-review attestation lines …:", "UNK lines …:", "Evidence-audit lines …:", "Stage-artifact registration lines …:", "Intake lines …:", "Certificate lines …:", "DEF lines:", "Skip lines …:", "Reopen lines:", "Kill lines …:". (Note: the stage-artifact intro wraps two lines, 703–704 — matcher artifact only; text verified by direct read.)

## Check 2 — s5_extract.py + s5_analyze.py re-run, as-is — PASS

- `s5_extract.py`: exit 0. files=44, occurrences=2811, ledger_ids=214 (GATE 963, DEF 697, CLAIM 482, UNK 403, REQ 266).
- `s5_analyze.py`: exit 0. **open P0/P1: 0** (`[]`); **BLOCKS_PLAN defs: 0**. Corroborating outputs: `s5/open-p0p1.md` asserts "Status: zero OPEN and zero DEFERRED P0/P1"; `s5/blocks-plan-ledger.md` renders "0 rows across 0 companions".
- Out-of-scope informational output (not failures): 16 SAME-FILE duplicate-definition-text notes, 205 orphan refs. Dangling: 0.

## Check 3 — ROUND_LOG.md parses against grammar — PASS

- 336 total lines; `<!-- … -->` comment occupies lines 1–32. **304 non-blank data lines** after the comment.
- Strict parse per type (lead tag; lowercase keys; allowed key sets; all required keys present):
  - counts: attest 20, audit 1, cert 1, def 229, round 20, skip 1, stage-artifact 3, unk 29 (sum 304).
  - **Failures: 0.** Failure verbatim output: none.

## Check 4 — 15 def=DEF4-* lines, all status=FIXED — PASS

- Lines 318–332 of `docs/planning/ROUND_LOG.md`: DEF4-A-1 … DEF4-A-12, DEF4-B-1, DEF4-B-2, DEF4-C-1.
- Count = 15/15. Status distribution: `status=FIXED` × 15; no other status present.

## Check 5 — Companion fixes read cleanly — PASS

- `pickup-sandbox-exec.md` UNK-1 (lines 118–122): row text is complete sentences ("…no independently maintained escape-vector list to pin as oracle. Until one exists, the adversarial oracle is the substrate's security suite, and unattempted vectors are UNK-2, not \"passing\"."). Disposition line complete. **No "(b)" token anywhere in the file** (grep exit 1); no fragment.
- `pickup-eval-harnesses.md` line 202 GATE-007 row: `| GATE-007 (Sandbox escape + resource accounting) | Advisory | Docker/k8s grading legs route through GATE-007's confinement checks; no adversarial escape claim |` — carries **no REQ reference at all**, so no mis-pointed one. Other GATE-007 mention (line 70) points at `shared-gates.md GATE-007`, the correct target. No "(b)" in the file either.

## Check 6 — Corpus greps — PASS

- `grep -ri "exorcist" PROJECT-PICKUP-PLAYBOOK.md shared-gates.md pickup-*.md` → **0 hits**.
- BLOCKS_PLAN disposition rows in companions (`Disposition: BLOCKS_PLAN`, case-insensitive) → **0 hits**. The 8 `BLOCKS_PLAN` hits in the corpus are all in the playbook's normative text (disposition definition, grammar block, BEADS READY check conditions) — none in shared-gates.md or any pickup-*.md.

## Verdict

**All 6 checks PASS. Zero findings.** No P0, P1, or P2 scored. No corpus file was modified.
