# Last-diff classification — SUBSTANTIVE

*Mechanical classification per PROJECT-PICKUP-PLAYBOOK.md, BEADS READY check #2 (lines 525–529): "last diff **POLISH** — a complete final review round that produced no P0/P1 findings and changed only copy/format. POLISH is a review *round*, not a label: any change to a claim, gate, threshold, requirement, or acceptance criterion is substantive, re-opens S4, and voids a prior POLISH."*

## Verdict: SUBSTANTIVE (not POLISH)

Two independent mechanical reasons; either alone is sufficient:

1. **Round 2 was not a no-P0/P1 round.** Round-2 S4 review produced 34 P1 findings (0 P0, 47 P2) — `docs/planning/round2/DEF2-lane{A..F}.md`, INTEGRATION2 scope line. A POLISH round by definition produces no P0/P1 findings.
2. **The round-2 integration diff changed claims, gates, requirements, and acceptance criteria** — each of which the rule names as substantive. Evidence from `docs/planning/round2/INTEGRATION2.md` (all FIXED, i.e. all applied):

### Claim changes (substantive per rule)

- DEF2-C-4: `CLAIM-DW-12` re-tiered to T3/Low (claim tier is an acceptance-relevant attribute).
- DEF2-C-13: `CLAIM-SEARCH-05` malformed claim-table row repaired (claim row content changed).
- DEF2-D-5..D-9: tier re-mappings across eval-harnesses, observability, guardrails, vector-dbs, fine-tuning claim tables (T0/T1/T2 boundaries moved).
- DEF2-B-14: `UNK-EMB-O1` merged into `UNK-EMB-003` (unknown inventory changed; references updated).
- DEF2-C-8 / DEF2-B-3: `UNK-BU-2` and structured-output `UNK-2` dispositions set to TARGETED (disposition is load-bearing for the BEADS READY gate).

### Gate changes (substantive per rule)

- DEF2-D-1: voice-agents deltas now define only `GATE-VA-1`/`GATE-VA-4` as companion-local; `GATE-VA-2`/`GATE-VA-3` retired into shared `GATE-013`.
- DEF2-C-7: `GATE-SEARCH-04` retired into shared `GATE-014`.
- DEF2-D-11: `GATE-OBS-SEMCONV`/`GATE-OBS-COMPLETE` retired into shared `GATE-010`; `GATE-OBS-INGEST`/`GATE-OBS-PRICE` defined as the two new type-local gates.
- DEF2-C-1: workflow-orchestrators deltas register only `GATE-DW-2`/`GATE-DW-3` (was `GATE-DW-1..4`).
- DEF2-A-2: all 18 shared-gate headers versioned (`GATE-NNN v1.0`) — acceptance-criteria versioning applied to the registry itself (registry 1.1 → 1.2).
- DEF2-B-5..B-8, F-1..F-4: seven shared-gate declaration tables added (inference-engines, quantization, structured-output, embedding-serving, observability, fine-tuning, voice-agents) plus the closer's 10 follow-up tables — gate applicability statements are new normative content.
- Shared-gate names corrected to registry titles in four companions (DEF2-B-9..B-11, C-2).

### Requirement / threshold changes (substantive per rule)

- DEF2-D-3/D-4 + the 14-companion slot-13 sweep: starter-kit deltas gained CI provisioning + cost-ownership items (runner class, funding owner, spend cap) — requirement content added to 21 companions.
- DEF2-C-12: sandbox-exec `REQ-2` gained GATE-007 review-date and substrate-generation diff-review requirements.
- DEF2-C-5/C-6: computer-use golden schema and `kit-gates.yml` re-registered under shared `GATE-008` parameters.
- Playbook 1.1 → 1.2 and shared-gates registry 1.1 → 1.2: both files' own amendment rules required the version bump, i.e. the changes were substantive by the files' own definitions.

### What was genuinely polish (not sufficient for a POLISH verdict)

- Typo/path corrections (DEF2-A-8 `templates/rl-env/` → `templates/rl-envs/`, DEF2-D-10, DEF2-F-8..F-10 stale "12 localbench slots" strings), wording moves (DEF2-F-12, F-17), pointer fixes (DEF2-E-2, D-2). These are copy/format — but they ride a diff that also contains the substantive changes above, so the diff as a whole is SUBSTANTIVE.

## Consequence

- BEADS READY check #2 ("last diff POLISH") **fails** on current state: the last integration diff is SUBSTANTIVE.
- Per the playbook, a substantive change "re-opens S4, and voids a prior POLISH": a further complete S4 review round producing no P0/P1 findings and changing only copy/format is required before check #2 can pass. (Note: the round-2 corpus also still carries 25 BLOCKS_PLAN unknowns — check #4 — and the 10 duplicate UNK definitions in `id-checks.md`, so a re-review round has known findings to clear first.)
- INTEGRATION2's own characterization ("All fixes are mechanical text corrections…") describes *inference load*, not diff class: the playbook's POLISH/SUBSTANTIVE rule is mechanical on *what changed* (claim/gate/threshold/requirement/acceptance-criterion), not on how hard the edit was to write.

