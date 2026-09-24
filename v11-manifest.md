# v11 Manifest — franken-assessments-44

Built 2026-09-23. Single versioned lineage: this ZIP replaces v10 in place
(same Drive file ID). v10 deleted locally and superseded on Drive.

## What v11 contains vs v10

**New**
- `ecosystem/pickup/` — the project-pickup planning system (BEADS READY,
  certified 2026-09-23): `PROJECT-PICKUP-PLAYBOOK.md` v1.3 (planning
  constitution: S0–S5 arc, 18 shared gates, 13 bench slots, 14 starter-kit
  gates, ROUND_LOG grammar, BEADS READY exit conditions), `shared-gates.md`
  registry v1.2 (18 shared gates with criteria versions + retirement rule),
  21 `pickup-*.md` type companions (one H1 + nine H2 each, shared-gate
  declaration tables, claim registries, bench shapes, starter-kit deltas),
  `_evidence/` (21 packs, 192 repos, 5–10+ per type with 404/staleness
  disclosure), `INTENT.md`, and `docs/planning/` (6 S4 review rounds,
  integrations, S5 registries, machine-readable ROUND_LOG.md with the
  BEADS READY certificate).
- `v11-manifest.md` (this file, at ZIP root).

**Unchanged from v10**: `packets/`, `synthesis/`, `site/`, `starter-kit/`,
`RULEBOOK.md`, `ecosystem/ECOSYSTEM.md`, `ecosystem/A-Z-PLAYBOOK.md`.

## Project-pickup certification summary

Six S4 review rounds, 233 DEF records (231 FIXED; 1 WONTFIX P2 with
rationale — DEF-F-19; 1 DEFERRED P2 → S5 — DEF-A-8, ID-namespace
normalization). Round history: R1 92 findings (4 P0) / R2 81 (0 P0) /
R3 37 + 4 integrator-raised P0 (9 P0 total: 5 scored + 4 same-class
fabrication variants) / R4 15 (5 P1 constitution-meta) / R5 4 residuals
(1 P1) / R6 0 findings. Last diff POLISH. Zero open P0/P1. Zero
BLOCKS_PLAN (29 unknowns triaged: 22 TARGETED with falsifiable predicates
and named owners, 7 RESOLVED). Fabricated-mechanism class eliminated
("exorcist" phrase + 4 same-class variants; corpus-wide grep = 0).
BEADS READY certificate: `docs/planning/ROUND_LOG.md`
(`cert | round=6 | result=BEADS READY | polish=yes`,
pin `8e6c35952c20db82`). Completion marker:
`ecosystem/pickup/docs/planning/.pickup-v11-complete`.

New shared gates/templates vs v10: shared-gates.md registry v1.0→v1.2
(18 gates, per-gate criteria versions, retirement rule, L0/L1/L2 hierarchy);
per-type truth-pack layouts, bench shapes (13 slots), gate-wiring tables,
and starter-kit deltas in each companion; deterministic S5 registry scripts
(`docs/planning/s5/scripts/`).

## Evidence backing (repos per type)

Inference engines 8 · quantization 10 · structured output 7 · embedding
serving 8 · agent frameworks 8 · MCP 10 · multi-agent protocols 10 ·
workflow orchestrators 15 · sandboxed execution 8 · browser use 9 ·
computer use 10 · web-search APIs 10 · agent memory 9 · RAG frameworks 8 ·
vector DBs 11 · eval harnesses 11 · observability 13 · guardrails 8 ·
fine-tuning 8 · RL/RLHF 6 · voice agents 8. Total 192. Every type meets
the 5–10 repo bar.

## Gates status — Phase C still held

`.gates-v1-complete` was still absent at v11 packaging time. Per the
standing rule — gated work does not ship before its explicit completion
marker — v11 does not include the G1–G14/Phase-C starter-kit expansion.
The v10 manifest's expectation ("gates ride v11") is superseded by the
marker rule: the gated kit ships in the version after the marker lands.

## Verification summary (packaging time)

- `ecosystem/pickup/` (89 files) added to the untouched v10 tree; all other
  folders byte-identical to v10.
- ZIP integrity verified (unzip -t); file listing spot-checked.
- Drive: same file updated in place
  (franken-assessments-44-v10.zip → franken-assessments-44-v11.zip,
  renamed); upload verified; local v10 deleted. Only v11 kept.
