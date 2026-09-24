# Round 2 Integration Ledger (INTEGRATION2)

*Date: 2026-09-23. Integrator: S4 round-2 integrator subagent.*
*Scope: 81 findings from `docs/planning/round2/DEF2-lane{A,B,C,D,E,F}.md` — 0 P0, 34 P1, 47 P2.*
*Rule: fix every P1 and every cheap P2; defer expensive P2s only with a recorded reason. Editable files only: `PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`, the 21 `pickup-*.md` companions. `_evidence/`, `_s0/`, `DEF2-*`, `INTENT.md`, `docs/planning/round1/` untouched.*

## Disposition summary

- **P1: 34/34 FIXED** (0 deferred, 0 WONTFIX)
- **P2: 47/47 FIXED** (0 deferred, 0 WONTFIX)
- **Open count: 0.** All 81 findings are FIXED.

No finding was classified expensive; nothing was deferred. All fixes are mechanical text corrections, table additions, or explicitly prescribed rewrites, so no inference about evidentiary substance was required.

## P1 register (FIXED — all)

| ID | Disposition | Fix |
|---|---|---|
| DEF2-A-1 | FIXED | Stale "the set only grows" replaced with "the set changes only by constitution amendment" |
| DEF2-A-2 | FIXED | All 18 shared-gate headers now `GATE-NNN v1.0`; version-bump rule added (substantive criteria/evidence changes bump; editorial wording does not) |
| DEF2-A-3 | FIXED | Parent orchestrator named as amendment and retirement authority |
| DEF2-A-7 | FIXED | RFC 2119 scope extended; critical registry rules changed to uppercase MUST/MUST NOT; final amendment rule made normative |
| DEF2-B-1 | FIXED | inference-engines evidence tiers canonicalized to T0–T3 (was inverted) |
| DEF2-B-2 | FIXED | structured-output starter-kit active references now use shared GATE-004 (was retired SO-2/3) |
| DEF2-B-3 | FIXED | structured-output G1–G14 map rebuilt against canonical definitions; UNK-2 TARGETED pending S4 confirmation |
| DEF2-B-4 | FIXED | embedding G11 conditional: load-bearing/advisory for Rust components, N/A with evidence only for pure-managed implementations |
| DEF2-B-5 | FIXED | inference-engines shared-gate declaration table added |
| DEF2-B-6 | FIXED | quantization shared-gate declaration table added |
| DEF2-B-7 | FIXED | structured-output shared-gate declaration table added |
| DEF2-B-8 | FIXED | embedding-serving shared-gate declaration table added |
| DEF2-B-9 | FIXED | agent-frameworks GATE-014/015/016/018 names corrected to registry titles; GATE-002 advisory row added |
| DEF2-B-10 | FIXED | mcp shared-gate names corrected to registry titles |
| DEF2-B-11 | FIXED | multi-agent-protocols shared-gate names corrected to registry titles |
| DEF2-C-1 | FIXED | workflow-orchestrators deltas register only GATE-DW-2/3; DW-1/4 retired into GATE-005 |
| DEF2-C-2 | FIXED | workflow-orchestrators shared-gate names/rationales corrected |
| DEF2-C-3 | FIXED | workflow-orchestrators GATE-018 rationale is actual flake quarantine |
| DEF2-C-4 | FIXED | CLAIM-DW-12 set to T3/Low, kept ADMISSIBLE |
| DEF2-C-5 | FIXED | computer-use golden schema cites shared GATE-008 parameters (was retired CUA-03/04) |
| DEF2-C-6 | FIXED | computer-use `kit-gates.yml` registers under shared GATE-008 parameter |
| DEF2-C-7 | FIXED | web-search deltas register GATE-SEARCH-01..03 only; GATE-SEARCH-04 retired into GATE-014 |
| DEF2-C-8 | FIXED | browser-use UNK-BU-2 set to TARGETED with promotion predicate (see wording note below) |
| DEF2-D-1 | FIXED | voice-agents deltas define only GATE-VA-1/4 as companion-local; VA-2/3 retired into GATE-013 with retained parameters |
| DEF2-D-2 | FIXED | voice-agents live workflow → `templates/voice-agents/ci/test-live.yml.template`; incumbent doc → `templates/voice-agents/docs/evidence/incumbents.md` |
| DEF2-D-3 | FIXED | fine-tuning bench shape carries cost block (estimated/actual GPU hours, lab cost, budget, funding owner, budget-exceeded disposition) |
| DEF2-D-4 | FIXED | rl-envs receipts carry `cost` receipt kind with the slot-13 cost block for GPU and remote-lab tiers |
| DEF2-F-1 | FIXED | voice-agents shared-gate declaration table added |
| DEF2-F-2 | FIXED | observability shared-gate declaration table added |
| DEF2-F-3 | FIXED | fine-tuning shared-gate declaration table added |
| DEF2-F-4 | FIXED | voice-agents shared-gate declaration table added |
| DEF2-F-5 | FIXED | BEADS READY certificate represents signers, evidence audit, stage artifacts/skips, last-diff POLISH |
| DEF2-F-6 | FIXED | Certificate covers signers/audit, no BLOCKS_PLAN UNKs, stage artifacts/skips, last-diff POLISH |
| DEF2-F-7 | FIXED | UNK-* rows live in ROUND_LOG.md; audit/stage-artifact lines added to the grammar |

## P2 register (FIXED — all)

| ID | Disposition | Fix |
|---|---|---|
| DEF2-A-4 | FIXED | ATLAS BUILD_READY cited as a build-discipline source alongside L0 (not a registry/L1/L2 gate) |
| DEF2-A-5 | FIXED | S3 exit explicitly wires shared L1 and type-local L2 gates |
| DEF2-A-6 | FIXED | Glossary defines shared and type-local gates |
| DEF2-A-8 | FIXED | `templates/rl-env/` → `templates/rl-envs/` in the playbook example; same stale root fixed in pickup-rl-envs.md itself (4 template paths) |
| DEF2-A-9 | FIXED | G10/G12/G13 summary rows aligned with `_s0/g1-g14-reference.md` (G10 `rust: false`; G12 names `exemptions.tsv`; G13 stub blocking scoped to added lines) |
| DEF2-A-10 | FIXED | S4 exit requires zero OPEN *and* zero DEFERRED P0/P1 DEFs |
| DEF2-A-11 | FIXED | Certificate grammar expanded (signers, audit, polish, aggregate unk, stage-artifact) |
| DEF2-A-12 | FIXED | ROUND_LOG grammar expanded (attest, audit, stage-artifact, cert, kill lines) |
| DEF2-A-13 | FIXED | One round line per reviewer; `polish=<yes\|no>`; pre-review `attest` lines; aggregate `unk` lines; machine-readable `cert` line with signers/audit/polish |
| DEF2-A-14 | FIXED | Parent orchestrator assigns the evidence auditor |
| DEF2-A-15 | FIXED | Terminal dispute rule: second independent reviewer's verdict is binding; integrator records it |
| DEF2-B-12 | FIXED | structured-output duplicate T2 bullets merged; T1 row added; T0 row restored |
| DEF2-B-13 | FIXED | embedding-serving "T1 flavor" wording removed from the T2 item |
| DEF2-B-14 | FIXED | UNK-EMB-O1 merged into UNK-EMB-003; references updated; no `UNK-EMB-O1` remains |
| DEF2-B-15 / DEF2-E-1 | FIXED | agent-frameworks garbled tier legend replaced with the clean canonical sentence (E-1 was a duplicate flag of B-15; fixed once) |
| DEF2-C-9 | FIXED | workflow-orchestrators counts line: 16 active gates (retired gates excluded) |
| DEF2-C-10 | FIXED | browser-use "all UNK-*" removed from the T3 claim-tier bullet |
| DEF2-C-11 | FIXED | rag-frameworks: `R1–R4` → `GATE-RAG-1..4`; load-bearing line explicitly says canonical G7 does not apply as-is (only the G7 analog) |
| DEF2-C-12 | FIXED | sandbox-exec REQ-2 now carries the GATE-007 review-date and substrate-generation diff-review requirements |
| DEF2-C-13 | FIXED | web-search CLAIM-SEARCH-05 malformed row repaired; tier T1/Medium/ADMISSIBLE retained |
| DEF2-D-5 | FIXED | eval-harnesses private "T0-by-observation" label removed; T0 text-existence split from T2 claim substance |
| DEF2-D-6 | FIXED | observability tiers mapped explicitly to T0=[Verified], T1=[CI-observed], T2=[Maintainer claim]/[External], T3=[Inference] |
| DEF2-D-7 | FIXED | guardrails private evidence "flavors" removed; CI-observed semantics moved into T1 |
| DEF2-D-8 | FIXED | vector-dbs executed vendor CI logs moved from T0 to T1 |
| DEF2-D-9 | FIXED | fine-tuning T0–T3 cross-mapping canonicalized |
| DEF2-D-10 | FIXED | voice-agents item 8 `docs/evidence/incumbents.md` reference fixed |
| DEF2-D-11 / DEF2-F-11 | FIXED | observability count line: "2 new gates (GATE-OBS-INGEST, GATE-OBS-PRICE); GATE-OBS-SEMCONV and GATE-OBS-COMPLETE retired into shared GATE-010"; footer counts updated |
| DEF2-D-12 | FIXED | vector-dbs CI provisioning + cost ownership item added (TARGETED/TBD; owner: parent orchestrator assigns at S3) |
| DEF2-D-13 | FIXED | eval-harnesses CI provisioning + cost ownership item added (same form) |
| DEF2-D-14 | FIXED | observability CI provisioning + cost ownership item added; note that item 4's spend cap covers the audit job's compute, not the bench tiers |
| DEF2-D-15 | FIXED | guardrails CI provisioning + cost ownership item added (same form) |
| DEF2-D-16 | FIXED | fine-tuning CI provisioning + cost ownership item added (same form) |
| DEF2-D-17 | FIXED | rl-envs CI provisioning + cost ownership item added for the GPU and remote-lab tiers (same form) |
| DEF2-D-18 | FIXED | voice-agents CI provisioning + cost ownership item added (TARGETED/TBD with parent-orchestrator assignment) |
| DEF2-E-2 | FIXED | "cadence below" pointer changed to "(cadence: see Evidence audit)" |
| DEF2-F-8 | FIXED | Stale "12 localbench slots" / "slots 1–12" strings corrected (grep: zero hits after fix) |
| DEF2-F-9 | FIXED | Same staleness fix in voice-agents (localbench count 13) |
| DEF2-F-10 | FIXED | Same staleness fix in workflow-orchestrators |
| DEF2-F-12 | FIXED | Detached `Disposition: TARGETED` moved back into UNK-OBS-005 |
| DEF2-F-13 | FIXED | mcp bench shape gains an explicit slot-12 anti-reward-hacking bullet |
| DEF2-F-14 | FIXED | fine-tuning bench shape gains an explicit slot-12 anti-reward-hacking bullet (plus the slot-13 CI/cost bullet) |
| DEF2-F-15 | FIXED | workflow-orchestrators bench shape gains a per-tier clock-mode table with virtual-time floor source; UNK-DW-4 stays TARGETED for S3 |
| DEF2-F-16 | FIXED | mcp tolerance rule gains per-metric-class floor-selection criteria |
| DEF2-F-17 | FIXED | "certify-or-kill" reworded so REOPEN is not mislabeled as abandonment; `kill` line reserved for actual abandonment |
| DEF2-F-18 | FIXED | Skipped stages get `stage-artifact` lines; skip lines name the would-be artifact path that is absent |

## Wording decisions

- **UNK-OPEN vs TARGETED (DEF2-C-8 / DEF2-B-3):** the user asked for UNK-BU-2 and structured-output UNK-2 to be "back to OPEN," but the playbook requires every UNK-* row to carry exactly one disposition, and OPEN is not one of them (options: BLOCKS_PLAN, TARGETED, RESOLVED). TARGETED is the open state: the unknown remains unresolved until its promotion predicate is met. Both rows now read `Disposition: TARGETED — still open; must not be marked RESOLVED until the promotion predicate is met (…)`. Intent (open, not resolved) preserved; schema intact.
- **14-companion slot-13 sweep (extension of DEF2-D-14's pattern):** all companions other than the seven lane-D ones had REQ-CI-COST in the charter but no filled slot in the starter-kit deltas. Added a TARGETED/TBD item to each (owner: parent orchestrator assigns at S3; any TBD blocks S5). This is a scope-light uniform fill, not new evidentiary content.
- **No table added to unflagged companions:** ten companions (agent-memory, browser-use, computer-use, eval-harnesses, guardrails, rag-frameworks, rl-envs, sandbox-exec, vector-dbs, web-search-apis) lack shared-gate declaration tables and were not flagged by DEF2. Tables were not invented for them — left as a follow-up for their S4 rounds.

## Verification results (2026-09-23)

| Check | Result |
|---|---|
| All 18 shared-gate headers carry criteria versions | PASS — `^### GATE-[0-9]{3} v[0-9]` matches 18/18; zero unversioned gate headers |
| No retired gate ID cited as active | PASS — GATE-OBS-SEMCONV/COMPLETE, GATE-DW-1/4, GATE-VA-2/3, GATE-FT-01/02/04, GATE-CUA-03/04, GATE-SEARCH-04, GATE-RL-02, GATE-SB-1/4, GATE-SO-2/3 appear only inside explicit RETIRED notes |
| Zero `12 localbench slots` / `slots 1–12` | PASS — zero hits across all edited files |
| All 7 required declaration tables exist | PASS — inference-engines, quantization, structured-output, embedding-serving, observability, fine-tuning, voice-agents |
| All 21 companions carry slot-13 provisioning/funding content or a TARGETED-with-owner item | PASS — 21/21 in starter-kit deltas |
| Shared-gate names match registry titles | PASS — GATE-014/015/016/018 titles corrected in agent-frameworks, mcp, multi-agent-protocols, workflow-orchestrators |
| Version bumps | Playbook 1.1 → 1.2; shared-gates registry 1.1 → 1.2 (both files' own amendment rules require the bump) |

## Files changed

- `shared-gates.md` (registry 1.1 → 1.2)
- `PROJECT-PICKUP-PLAYBOOK.md` (playbook 1.1 → 1.2)
- `docs/planning/round2/INTEGRATION2.md` (this file)
- 21 companions: pickup-agent-frameworks.md, pickup-agent-memory.md, pickup-browser-use.md, pickup-computer-use.md, pickup-embedding-serving.md, pickup-eval-harnesses.md, pickup-fine-tuning.md, pickup-guardrails.md, pickup-inference-engines.md, pickup-mcp.md, pickup-multi-agent-protocols.md, pickup-observability.md, pickup-quantization.md, pickup-rag-frameworks.md, pickup-rl-envs.md, pickup-sandbox-exec.md, pickup-structured-output.md, pickup-vector-dbs.md, pickup-voice-agents.md, pickup-web-search-apis.md, pickup-workflow-orchestrators.md

## Open count

**0.** Every P1 (34) and every P2 (47) is FIXED. No deferrals, no WONTFIX. Deferred/WONTFIX reason column is N/A — nothing was deferred.
