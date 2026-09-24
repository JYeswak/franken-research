# S5 ID checks — duplicate / dangling / orphan report

*Generated 2026-09-23 by mechanical grep over the corpus. Corpus scope: `PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`, `INTENT.md`, the 21 `pickup-*.md` companions, `docs/planning/ROUND_LOG.md`, `docs/planning/round1/*`, `docs/planning/round2/*`. `_evidence/` and `_s0/` excluded (read-only reference). Full occurrence list: `id-index.tsv`.*

## Method (mechanical rules)

- **Definition** = the line that introduces the ID: `### GATE-NNN` headers; companion new-gate bullets whose first token is the ID (`- GATE-CUA-01 VM-CONTAINMENT:`, `- **GATE-DW-1 REPLAY-DETERMINISM — RETIRED…**`, slash-paired `- **GATE-MCP-01 / GATE-MCP-02 — RETIRED…**`); REQ/UNK bullets whose first token is the ID followed by a separator (`- **REQ-01.**`, `- REQ-BU-1:`, `- REQ-CI-COST —`, `- **UNK-1.**`); CLAIM table rows (`| CLAIM-01 | …`); DEF finding headers (`DEF-A-1 [P0]`, `DEF2-B-3 [P1]`). INTEGRATION.md / INTEGRATION2.md ledger lines are dispositions, counted as citations, not definitions.
- **Duplicate** = same ID defined ≥2× in one file with different definition text (for GATE-*, which is a global namespace, also across files).
- **Dangling** = cited but never defined in resolution scope (GATE/DEF: corpus-wide; REQ/CLAIM/UNK: same file, else corpus-wide for cross-file citations from DEF/INTEGRATION files). Namespace wildcards (`CLAIM-DW-*`), prefix collectives (`every CLAIM-EMB row`), placeholders (`GATE-DW-N`), adjectival forms (`CLAIM-04-style` → `CLAIM-04`), format examples in backticks, and wording labels (`UNK-OPEN vs TARGETED`) are classified as non-findings.
- **Orphan** = defined but never cited outside definition lines. Informational only: claim-registry rows and retired-gate notes are self-contained by design.

## 1. Duplicate-ID report — 10 findings (all UNK-*, all same defect class)

Every finding below is one UNK ID defined twice in the same file with divergent wording: once inline in **Oracle candidates + integrity checks**, once in **Unknowns (UNK-*)**. This is the exact defect class round-1 flagged as DEF-A-2…DEF-A-5 (fixed for inference-engines, quantization, structured-output, embedding-serving); these five companions were outside the reviewed lanes and were never flagged or fixed.

### CLAIM-10 — `docs/planning/round3/DEF3-laneD.md`
- 175: | CLAIM-10 | quantization | T0 | **T3** | mis-tiered (DEF3-D-3) |
- 205: | CLAIM-10 | guardrails | T0 | T0 | ok |

### CLAIM-11 — `docs/planning/round3/DEF3-laneD.md`
- 169: | CLAIM-11 | inference-engines | T0 | T0 | ok |
- 180: | CLAIM-11 | agent-memory | T0 | T0 | ok (verified-absence about the pack) |
- 185: | CLAIM-11 | rag-frameworks | T0 | T0 | ok |

### CLAIM-12 — `docs/planning/round3/DEF3-laneD.md`
- 170: | CLAIM-12 | inference-engines | T0 | T0 | ok |
- 176: | CLAIM-12 | quantization | T3 | T3 | ok |
- 206: | CLAIM-12 | guardrails | T0 (CONTESTED) | T0 | ok ("canonical spec" inference labeled) |

### CLAIM-14 — `docs/planning/round3/DEF3-laneD.md`
- 171: | CLAIM-14 | inference-engines | T2 (WITHDRAWN) | T2 | ok |
- 181: | CLAIM-14 | agent-memory | T3 | T3 | ok |

### CLAIM-4 — `docs/planning/round3/DEF3-laneD.md`
- 173: | CLAIM-4 | quantization | T0 | T0 | ok |
- 182: | CLAIM-4 | rag-frameworks | T2 (CONTESTED) | T2 | ok |

### CLAIM-8 — `docs/planning/round3/DEF3-laneD.md`
- 174: | CLAIM-8 | quantization | T0 | **T3** | mis-tiered (DEF3-D-2) |
- 184: | CLAIM-8 | rag-frameworks | T0 | T0 | ok |

### UNK-01 — `pickup-agent-frameworks.md`
- 118: - **UNK-01.** See UNK-01 in Unknowns below (not redefined here).
- 118: - **UNK-01.** See UNK-01 in Unknowns below (not redefined here).
- 367: - **UNK-01.** Cassette vs scripted-fake: which LLM-call capture apparatus (VCR-style

### UNK-02 — `pickup-agent-frameworks.md`
- 119: - **UNK-02.** See UNK-02 in Unknowns below (not redefined here).
- 119: - **UNK-02.** See UNK-02 in Unknowns below (not redefined here).
- 374: - **UNK-02.** Are third-party agent benchmarks (SWE-bench-agents variants, GAIA,

### UNK-MCP-01 — `pickup-mcp.md`
- 73: - UNK-MCP-01: See UNK-MCP-01 in Unknowns below (not redefined here).
- 73: - UNK-MCP-01: See UNK-MCP-01 in Unknowns below (not redefined here).
- 325: - UNK-MCP-01: Conformance-harness coverage depth — alpha (`0.2.0-alpha.11`), 127 stars,

### UNK-MCP-06 — `pickup-mcp.md`
- 74: - UNK-MCP-06: See UNK-MCP-06 in Unknowns below (not redefined here).
- 74: - UNK-MCP-06: See UNK-MCP-06 in Unknowns below (not redefined here).
- 343: - UNK-MCP-06: Rust SDK CI practices — unverified (only TypeScript and Python SDKs

### UNK-1 — `pickup-rag-frameworks.md`
- 118: - **UNK-1.** See UNK-1 in Unknowns below (not redefined here).
- 118: - **UNK-1.** See UNK-1 in Unknowns below (not redefined here).
- 356: - **UNK-1.** BEIR/HotpotQA dataset revision pinning — no evidence repo (at S2 scope)

### UNK-2 — `pickup-rag-frameworks.md`
- 119: - **UNK-2.** See UNK-2 in Unknowns below (not redefined here).
- 119: - **UNK-2.** See UNK-2 in Unknowns below (not redefined here).
- 361: - **UNK-2.** LLM-judge backend identity behind LightRAG's > 0.80 thresholds

### UNK-3 — `pickup-rag-frameworks.md`
- 120: - **UNK-3.** See UNK-3 in Unknowns below (not redefined here).
- 120: - **UNK-3.** See UNK-3 in Unknowns below (not redefined here).
- 366: - **UNK-3.** Provenance of azure-search-openai-demo's checked-in ground truth —

### UNK-1 — `pickup-rl-envs.md`
- 48: - UNK-1: See UNK-1 in Unknowns below (not redefined here).
- 48: - UNK-1: See UNK-1 in Unknowns below (not redefined here).
- 148: - UNK-1: Can trajectory-level golden fixtures be captured reproducibly against pinned TRL/verl trainer commits, given HF-hub fixture dependencies (`testing_cons

### UNK-2 — `pickup-rl-envs.md`
- 49: - UNK-2: See UNK-2 in Unknowns below (not redefined here).
- 49: - UNK-2: See UNK-2 in Unknowns below (not redefined here).
- 150: - UNK-2: Is there any verifiable oracle for anti-reward-hacking regression coverage (beyond reward-shaping/KL gradient tests)? None of the six repos ships one b

### UNK-DW-1 — `pickup-workflow-orchestrators.md`
- 99: - **UNK-DW-1** — See UNK-DW-1 in Unknowns below (not redefined here).
- 99: - **UNK-DW-1** — See UNK-DW-1 in Unknowns below (not redefined here).
- 373: - **UNK-DW-1** — Is compile-time (static) determinism checking ("workflowcheck"-style

## 2. Dangling-reference report — 2 findings

### FINDING D-1 — `pickup-guardrails.md:291` cites `UNK-GR` (malformed)

- Line 291 (Starter-kit deltas): `- Corpus export tooling (TARGETED, not yet buildable — see UNK-GR corpus-export):`. No `UNK-GR-*` ID named `corpus-export` is defined anywhere in the file (defined: UNK-GR-01…UNK-GR-06); the citation cannot resolve to a row. Probable intended target is a missing corpus-export unknown (cf. DEF-E-13's TARGETED marking of the tooling).

### D-2 — `UNK-EMB-O1`: dangling only against *current* definitions (historical, not live)

- 6 occurrences, all inside frozen planning records: `docs/planning/round1/DEF-laneA.md:40`, `docs/planning/round1/INTEGRATION.md:36`, `docs/planning/round2/DEF2-laneB.md:152,155`, `docs/planning/round2/INTEGRATION2.md:71` (×2).
- The ID was defined in the round-1 companion text and merged into `UNK-EMB-003` by the round-2 fix (DEF2-B-14, INTEGRATION2: "no `UNK-EMB-O1` remains"). No occurrence exists in any of the 21 current companions. Historical citations are expected in frozen artifacts; no live dangling reference.

### Non-findings (16 classified, not dangling)

- `pickup-fine-tuning.md:150` `CLAIM-04-style` — adjectival form of defined CLAIM-04.
- `pickup-workflow-orchestrators.md:138` `CLAIM-DW` — namespace wildcard (not an ID).
- `pickup-embedding-serving.md:130` `CLAIM-EMB` — namespace-prefix collective for 13 defined IDs.
- `pickup-multi-agent-protocols.md:112` `CLAIM-MAP` — namespace-prefix collective for 13 defined IDs.
- `pickup-observability.md:145` `CLAIM-OBS-004-class` — adjectival form of defined CLAIM-OBS-004.
- `pickup-voice-agents.md:156` `CLAIM-VA` — namespace wildcard (not an ID).
- `docs/planning/round1/DEF-laneB.md:143` `GATE-DW-N` — pattern placeholder (not an ID).
- `docs/planning/round3/DEF3-laneA.md:211` `GATE-EH-NN` — pattern placeholder (not an ID).
- `docs/planning/round1/DEF-laneB.md:182` `GATE-MAP-N` — pattern placeholder (not an ID).
- `docs/planning/round1/DEF-laneB.md:122` `GATE-MCP-N` — pattern placeholder (not an ID).
- `PROJECT-PICKUP-PLAYBOOK.md:227` `GATE-MEM-02` — namespace format example, not a citation.
- `pickup-sandbox-exec.md:405` `GATE-SB-NN` — pattern placeholder (not an ID).
- `docs/planning/round1/DEF-laneC.md:55` `REQ-1-style` — adjectival form of defined REQ-1.
- `pickup-workflow-orchestrators.md:396` `REQ-DW` — namespace wildcard (not an ID).
- `docs/planning/round3/DEF3-laneA.md:101` `REQ-EH-07` — fix-proposal suggestion, never minted (not a citation).
- `docs/planning/round3/DEF3-laneA.md:99` `REQ-EH-NN` — pattern placeholder (not an ID).
- `docs/planning/round1/DEF-laneF.md:149` `REQ-VA` — namespace wildcard (not an ID).
- `PROJECT-PICKUP-PLAYBOOK.md:226` `REQ-VA-07` — namespace format example, not a citation.
- `pickup-workflow-orchestrators.md:396` `UNK-DW` — namespace wildcard (not an ID).
- `docs/planning/round3/DEF3-laneA.md:123` `UNK-EH-NN` — pattern placeholder (not an ID).
- `docs/planning/round1/DEF-laneD.md:37` `UNK-EH-O1` — review-record citation of a since-renamed/merged ID (round DEF archaeology), absent from live corpus.
- `docs/planning/round1/DEF-laneD.md:37` `UNK-EH-O2` — review-record citation of a since-renamed/merged ID (round DEF archaeology), absent from live corpus.
- `docs/planning/round1/DEF-laneA.md:40` `UNK-EMB-O1` — review-record citation of a since-renamed/merged ID (round DEF archaeology), absent from live corpus.
- `docs/planning/round2/INTEGRATION2.md:106` `UNK-OPEN` — wording-decision label, not an ID citation.

## 3. Orphan-definition report — 192 (informational only)

Breakdown: CLAIM 98 · REQ 39 · UNK 41 · GATE 14 · DEF 0. Every DEF finding is cited by its INTEGRATION ledger line, so no DEF is orphaned.

- **CLAIM (98):** claim-registry table rows never cited in prose. Expected: the registry is self-contained by design; prose citation is not required.
- **GATE (14):** all are *retired*-gate definition notes (e.g. `GATE-BU-2`, `GATE-CUA-02`, `GATE-DW-3`, `GATE-EMB-NETISOL`, `GATE-FT-02/04`, `GATE-GR-02/03`, `GATE-IE-02/04`, `GATE-SB-3`, `GATE-SEARCH-02/03`, `GATE-VDB-04`) — cited nowhere outside their own retirement note, which is the correct terminal state.
- **REQ (39) / UNK (41):** defined in Requirements/Unknowns sections, never re-cited in prose. Includes the 10 duplicate UNK definitions above (defined twice, cited zero times outside the definitions).

Full orphan list (`file:line  id`):

- `pickup-agent-frameworks.md:130` CLAIM-03 (CLAIM)
- `pickup-agent-frameworks.md:132` CLAIM-05 (CLAIM)
- `pickup-agent-frameworks.md:135` CLAIM-08 (CLAIM)
- `pickup-agent-frameworks.md:142` CLAIM-15 (CLAIM)
- `pickup-agent-memory.md:110` CLAIM-7 (CLAIM)
- `pickup-browser-use.md:139` CLAIM-BU-12 (CLAIM)
- `pickup-browser-use.md:140` CLAIM-BU-13 (CLAIM)
- `pickup-browser-use.md:129` CLAIM-BU-2 (CLAIM)
- `pickup-browser-use.md:130` CLAIM-BU-3 (CLAIM)
- `pickup-browser-use.md:131` CLAIM-BU-4 (CLAIM)
- `pickup-browser-use.md:132` CLAIM-BU-5 (CLAIM)
- `pickup-browser-use.md:133` CLAIM-BU-6 (CLAIM)
- `pickup-browser-use.md:134` CLAIM-BU-7 (CLAIM)
- `pickup-browser-use.md:135` CLAIM-BU-8 (CLAIM)
- `pickup-browser-use.md:136` CLAIM-BU-9 (CLAIM)
- `pickup-workflow-orchestrators.md:119` CLAIM-DW-10 (CLAIM)
- `pickup-workflow-orchestrators.md:111` CLAIM-DW-2 (CLAIM)
- `pickup-workflow-orchestrators.md:112` CLAIM-DW-3 (CLAIM)
- `pickup-workflow-orchestrators.md:114` CLAIM-DW-5 (CLAIM)
- `pickup-workflow-orchestrators.md:115` CLAIM-DW-6 (CLAIM)
- `pickup-workflow-orchestrators.md:116` CLAIM-DW-7 (CLAIM)
- `pickup-workflow-orchestrators.md:117` CLAIM-DW-8 (CLAIM)
- `pickup-eval-harnesses.md:135` CLAIM-EH-02 (CLAIM)
- `pickup-eval-harnesses.md:136` CLAIM-EH-03 (CLAIM)
- `pickup-eval-harnesses.md:138` CLAIM-EH-05 (CLAIM)
- `pickup-eval-harnesses.md:139` CLAIM-EH-06 (CLAIM)
- `pickup-eval-harnesses.md:140` CLAIM-EH-07 (CLAIM)
- `pickup-eval-harnesses.md:141` CLAIM-EH-08 (CLAIM)
- `pickup-eval-harnesses.md:142` CLAIM-EH-09 (CLAIM)
- `pickup-eval-harnesses.md:143` CLAIM-EH-10 (CLAIM)
- `pickup-embedding-serving.md:107` CLAIM-EMB-002 (CLAIM)
- `pickup-embedding-serving.md:108` CLAIM-EMB-003 (CLAIM)
- `pickup-embedding-serving.md:109` CLAIM-EMB-004 (CLAIM)
- `pickup-embedding-serving.md:110` CLAIM-EMB-005 (CLAIM)
- `pickup-embedding-serving.md:111` CLAIM-EMB-006 (CLAIM)
- `pickup-embedding-serving.md:112` CLAIM-EMB-007 (CLAIM)
- `pickup-embedding-serving.md:113` CLAIM-EMB-008 (CLAIM)
- `pickup-embedding-serving.md:114` CLAIM-EMB-009 (CLAIM)
- `pickup-embedding-serving.md:115` CLAIM-EMB-010 (CLAIM)
- `pickup-embedding-serving.md:116` CLAIM-EMB-011 (CLAIM)
- `pickup-embedding-serving.md:117` CLAIM-EMB-012 (CLAIM)
- `pickup-embedding-serving.md:118` CLAIM-EMB-013 (CLAIM)
- `pickup-multi-agent-protocols.md:89` CLAIM-MAP-1 (CLAIM)
- `pickup-multi-agent-protocols.md:98` CLAIM-MAP-10 (CLAIM)
- `pickup-multi-agent-protocols.md:99` CLAIM-MAP-11 (CLAIM)
- `pickup-multi-agent-protocols.md:101` CLAIM-MAP-13 (CLAIM)
- `pickup-multi-agent-protocols.md:90` CLAIM-MAP-2 (CLAIM)
- `pickup-multi-agent-protocols.md:91` CLAIM-MAP-3 (CLAIM)
- `pickup-multi-agent-protocols.md:92` CLAIM-MAP-4 (CLAIM)
- `pickup-multi-agent-protocols.md:93` CLAIM-MAP-5 (CLAIM)
- `pickup-multi-agent-protocols.md:94` CLAIM-MAP-6 (CLAIM)
- `pickup-multi-agent-protocols.md:95` CLAIM-MAP-7 (CLAIM)
- `pickup-multi-agent-protocols.md:96` CLAIM-MAP-8 (CLAIM)
- `pickup-multi-agent-protocols.md:97` CLAIM-MAP-9 (CLAIM)
- `pickup-observability.md:110` CLAIM-OBS-002 (CLAIM)
- `pickup-observability.md:111` CLAIM-OBS-003 (CLAIM)
- `pickup-observability.md:114` CLAIM-OBS-006 (CLAIM)
- `pickup-observability.md:115` CLAIM-OBS-007 (CLAIM)
- `pickup-observability.md:116` CLAIM-OBS-008 (CLAIM)
- `pickup-observability.md:118` CLAIM-OBS-010 (CLAIM)
- `pickup-observability.md:119` CLAIM-OBS-011 (CLAIM)
- `pickup-observability.md:120` CLAIM-OBS-012 (CLAIM)
- `pickup-web-search-apis.md:118` CLAIM-SEARCH-01 (CLAIM)
- `pickup-web-search-apis.md:119` CLAIM-SEARCH-02 (CLAIM)
- `pickup-web-search-apis.md:120` CLAIM-SEARCH-03 (CLAIM)
- `pickup-web-search-apis.md:121` CLAIM-SEARCH-04 (CLAIM)
- `pickup-web-search-apis.md:123` CLAIM-SEARCH-06 (CLAIM)
- `pickup-web-search-apis.md:126` CLAIM-SEARCH-09 (CLAIM)
- `pickup-web-search-apis.md:127` CLAIM-SEARCH-10 (CLAIM)
- `pickup-web-search-apis.md:128` CLAIM-SEARCH-11 (CLAIM)
- `pickup-web-search-apis.md:129` CLAIM-SEARCH-12 (CLAIM)
- `pickup-web-search-apis.md:130` CLAIM-SEARCH-13 (CLAIM)
- `pickup-web-search-apis.md:131` CLAIM-SEARCH-14 (CLAIM)
- `pickup-voice-agents.md:124` CLAIM-VA-1 (CLAIM)
- `pickup-voice-agents.md:134` CLAIM-VA-11 (CLAIM)
- `pickup-voice-agents.md:135` CLAIM-VA-12 (CLAIM)
- `pickup-voice-agents.md:136` CLAIM-VA-13 (CLAIM)
- `pickup-voice-agents.md:125` CLAIM-VA-2 (CLAIM)
- `pickup-voice-agents.md:127` CLAIM-VA-4 (CLAIM)
- `pickup-voice-agents.md:128` CLAIM-VA-5 (CLAIM)
- `pickup-voice-agents.md:129` CLAIM-VA-6 (CLAIM)
- `pickup-voice-agents.md:130` CLAIM-VA-7 (CLAIM)
- `pickup-voice-agents.md:131` CLAIM-VA-8 (CLAIM)
- `pickup-voice-agents.md:132` CLAIM-VA-9 (CLAIM)
- `pickup-vector-dbs.md:112` CLAIM-VDB-01 (CLAIM)
- `pickup-vector-dbs.md:113` CLAIM-VDB-02 (CLAIM)
- `pickup-vector-dbs.md:114` CLAIM-VDB-03 (CLAIM)
- `pickup-vector-dbs.md:116` CLAIM-VDB-05 (CLAIM)
- `pickup-vector-dbs.md:117` CLAIM-VDB-06 (CLAIM)
- `pickup-vector-dbs.md:118` CLAIM-VDB-07 (CLAIM)
- `pickup-vector-dbs.md:119` CLAIM-VDB-08 (CLAIM)
- `pickup-vector-dbs.md:120` CLAIM-VDB-09 (CLAIM)
- `pickup-vector-dbs.md:121` CLAIM-VDB-10 (CLAIM)
- `pickup-vector-dbs.md:122` CLAIM-VDB-11 (CLAIM)
- `pickup-vector-dbs.md:123` CLAIM-VDB-12 (CLAIM)
- `pickup-vector-dbs.md:125` CLAIM-VDB-14 (CLAIM)
- `docs/planning/ROUND_LOG.md:275` DEF3-A-1 (DEF)
- `docs/planning/ROUND_LOG.md:281` DEF3-A-10 (DEF)
- `docs/planning/ROUND_LOG.md:282` DEF3-A-11 (DEF)
- `docs/planning/ROUND_LOG.md:284` DEF3-A-12 (DEF)
- `docs/planning/ROUND_LOG.md:285` DEF3-A-13 (DEF)
- `docs/planning/ROUND_LOG.md:286` DEF3-A-14 (DEF)
- `docs/planning/ROUND_LOG.md:291` DEF3-A-15 (DEF)
- `docs/planning/ROUND_LOG.md:287` DEF3-A-16 (DEF)
- `docs/planning/ROUND_LOG.md:278` DEF3-A-18 (DEF)
- `docs/planning/ROUND_LOG.md:273` DEF3-A-19 (DEF)
- `docs/planning/ROUND_LOG.md:270` DEF3-A-2 (DEF)
- `docs/planning/ROUND_LOG.md:289` DEF3-A-20 (DEF)
- `docs/planning/ROUND_LOG.md:283` DEF3-A-21 (DEF)
- `docs/planning/ROUND_LOG.md:288` DEF3-A-24 (DEF)
- `docs/planning/ROUND_LOG.md:274` DEF3-A-25 (DEF)
- `docs/planning/ROUND_LOG.md:276` DEF3-A-26 (DEF)
- `docs/planning/ROUND_LOG.md:290` DEF3-A-3 (DEF)
- `docs/planning/ROUND_LOG.md:271` DEF3-A-5 (DEF)
- `docs/planning/ROUND_LOG.md:272` DEF3-A-6 (DEF)
- `docs/planning/ROUND_LOG.md:277` DEF3-A-7 (DEF)
- `docs/planning/ROUND_LOG.md:279` DEF3-A-8 (DEF)
- `pickup-browser-use.md:168` GATE-BU-2 (GATE)
- `pickup-computer-use.md:92` GATE-CUA-02 (GATE)
- `pickup-workflow-orchestrators.md:174` GATE-DW-3 (GATE)
- `pickup-embedding-serving.md:171` GATE-EMB-NETISOL (GATE)
- `pickup-fine-tuning.md:160` GATE-FT-02 (GATE)
- `pickup-fine-tuning.md:170` GATE-FT-04 (GATE)
- `pickup-guardrails.md:160` GATE-GR-02 (GATE)
- `pickup-guardrails.md:167` GATE-GR-03 (GATE)
- `pickup-inference-engines.md:199` GATE-IE-02 (GATE)
- `pickup-inference-engines.md:204` GATE-IE-04 (GATE)
- `pickup-sandbox-exec.md:214` GATE-SB-3 (GATE)
- `pickup-web-search-apis.md:177` GATE-SEARCH-02 (GATE)
- `pickup-web-search-apis.md:181` GATE-SEARCH-03 (GATE)
- `pickup-vector-dbs.md:172` GATE-VDB-04 (GATE)
- `pickup-agent-frameworks.md:53` REQ-02 (REQ)
- `pickup-agent-frameworks.md:64` REQ-06 (REQ)
- `pickup-guardrails.md:52` REQ-07 (REQ)
- `pickup-browser-use.md:32` REQ-BU-1 (REQ)
- `pickup-workflow-orchestrators.md:38` REQ-DW-1 (REQ)
- `pickup-workflow-orchestrators.md:40` REQ-DW-2 (REQ)
- `pickup-workflow-orchestrators.md:42` REQ-DW-3 (REQ)
- `pickup-workflow-orchestrators.md:44` REQ-DW-4 (REQ)
- `pickup-eval-harnesses.md:57` REQ-EH-4 (REQ)
- `pickup-eval-harnesses.md:61` REQ-EH-6 (REQ)
- `pickup-embedding-serving.md:38` REQ-EMB-002 (REQ)
- `pickup-embedding-serving.md:48` REQ-EMB-004 (REQ)
- `pickup-embedding-serving.md:52` REQ-EMB-005 (REQ)
- `pickup-embedding-serving.md:55` REQ-EMB-006 (REQ)
- `pickup-multi-agent-protocols.md:41` REQ-MAP-1 (REQ)
- `pickup-multi-agent-protocols.md:42` REQ-MAP-2 (REQ)
- `pickup-multi-agent-protocols.md:43` REQ-MAP-3 (REQ)
- `pickup-multi-agent-protocols.md:45` REQ-MAP-5 (REQ)
- `pickup-mcp.md:37` REQ-MCP-01 (REQ)
- `pickup-mcp.md:39` REQ-MCP-02 (REQ)
- `pickup-mcp.md:41` REQ-MCP-03 (REQ)
- `pickup-mcp.md:43` REQ-MCP-04 (REQ)
- `pickup-mcp.md:45` REQ-MCP-05 (REQ)
- `pickup-mcp.md:47` REQ-MCP-06 (REQ)
- `pickup-observability.md:36` REQ-OBS-001 (REQ)
- `pickup-observability.md:39` REQ-OBS-002 (REQ)
- `pickup-observability.md:42` REQ-OBS-003 (REQ)
- `pickup-observability.md:45` REQ-OBS-004 (REQ)
- `pickup-observability.md:48` REQ-OBS-005 (REQ)
- `pickup-observability.md:51` REQ-OBS-006 (REQ)
- `pickup-web-search-apis.md:39` REQ-SEARCH-01 (REQ)
- `pickup-web-search-apis.md:54` REQ-SEARCH-05 (REQ)
- `pickup-voice-agents.md:43` REQ-VA-1 (REQ)
- `pickup-voice-agents.md:56` REQ-VA-5 (REQ)
- `pickup-voice-agents.md:59` REQ-VA-6 (REQ)
- `pickup-vector-dbs.md:47` REQ-VDB-03 (REQ)
- `pickup-vector-dbs.md:50` REQ-VDB-04 (REQ)
- `pickup-computer-use.md:196` UNK-07 (UNK)
- `pickup-sandbox-exec.md:406` UNK-7 (UNK)
- `pickup-browser-use.md:393` UNK-BU-3 (UNK)
- `pickup-browser-use.md:402` UNK-BU-5 (UNK)
- `pickup-browser-use.md:407` UNK-BU-6 (UNK)
- `pickup-browser-use.md:412` UNK-BU-7 (UNK)
- `pickup-workflow-orchestrators.md:384` UNK-DW-3 (UNK)
- `pickup-workflow-orchestrators.md:392` UNK-DW-5 (UNK)
- `pickup-eval-harnesses.md:349` UNK-EH-03 (UNK)
- `pickup-eval-harnesses.md:353` UNK-EH-04 (UNK)
- `pickup-eval-harnesses.md:358` UNK-EH-05 (UNK)
- `pickup-eval-harnesses.md:362` UNK-EH-06 (UNK)
- `pickup-eval-harnesses.md:120` UNK-EH-08 (UNK)
- `pickup-embedding-serving.md:367` UNK-EMB-006 (UNK)
- `pickup-guardrails.md:359` UNK-GR-05 (UNK)
- `pickup-guardrails.md:363` UNK-GR-06 (UNK)
- `pickup-multi-agent-protocols.md:222` UNK-MAP-3 (UNK)
- `pickup-multi-agent-protocols.md:224` UNK-MAP-4 (UNK)
- `pickup-multi-agent-protocols.md:226` UNK-MAP-5 (UNK)
- `pickup-multi-agent-protocols.md:228` UNK-MAP-6 (UNK)
- `pickup-mcp.md:330` UNK-MCP-02 (UNK)
- `pickup-mcp.md:333` UNK-MCP-03 (UNK)
- `pickup-mcp.md:337` UNK-MCP-04 (UNK)
- `pickup-mcp.md:340` UNK-MCP-05 (UNK)
- `pickup-mcp.md:347` UNK-MCP-07 (UNK)
- `pickup-observability.md:343` UNK-OBS-003 (UNK)
- `pickup-observability.md:348` UNK-OBS-004 (UNK)
- `pickup-web-search-apis.md:345` UNK-SEARCH-02 (UNK)
- `pickup-web-search-apis.md:349` UNK-SEARCH-03 (UNK)
- `pickup-web-search-apis.md:353` UNK-SEARCH-04 (UNK)
- `pickup-web-search-apis.md:357` UNK-SEARCH-05 (UNK)
- `pickup-web-search-apis.md:361` UNK-SEARCH-06 (UNK)
- `pickup-voice-agents.md:427` UNK-VA-4 (UNK)
- `pickup-vector-dbs.md:352` UNK-VDB-02 (UNK)
- `pickup-vector-dbs.md:357` UNK-VDB-03 (UNK)
- `pickup-vector-dbs.md:362` UNK-VDB-04 (UNK)
- `pickup-vector-dbs.md:373` UNK-VDB-06 (UNK)

