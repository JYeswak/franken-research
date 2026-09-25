# Plan index: Franken Research search (v1)

Maturity: 0 MAPPED, 1 GROUNDED, 2 CONTRACTED, 3 FALSIFIABLE, 4 COMPILABLE, 5 FROZEN.
Rule: no section more than one level above the median.

| ID | Section | Purpose | Inputs | Outputs | Depends on | Maturity |
|---|---|---|---|---|---|---|
| S01 | Charter and product | What v1 is and is not | Maintainer intent | PROJECT_CHARTER.md (locked 2026-09-25, hash in manifest.json) | none | 2 |
| S02 | Corpus | What v1 indexes: rigor practices, techniques, failure modes, gates catalog, the 44 verdicts and briefs, stack verdicts, starter kit, crate directory (metadata and links), fh public catalogs and rigor-atlas tables as dated snapshots (DEC-003, charter constraint) | Repo files, GitHub API, intake reports | Source list with counts and IDs | S01 | 1 |
| S03 | Index entry contract | One schema for every result: namespaced id (DEC-007), kind, title, summary, what to copy, agent prompt, evidence tier or verdict, license from the repo root LICENSE (DEC-006), source URL at a commit, provenance, optional short quote | S02 | `IF-ENTRY` schema, versioned | S02 | 1 |
| S04 | Build pipeline | Generators that turn sources into the index on every deploy; core and lazy shards | S02, S03 | `site/assets/search-index.*`, generator, freshness gate | S03 | 1 |
| S05 | Search engine | Client-side matching and ranking (DEC-005, in-house): tokenizing, prefix and typo tolerance, intent terms, verdict-aware ranking, hard speed budgets (REQ-O2); engine shape decided by the SearchPerfProbe evidence | S03 | Engine module, ranking contract, perf harness | S03 | 1 |
| S06 | Answer composition | Paste-ready agent prompts and commands from our own content; short cited quotes with license notice and rider flag (DEC-009) | S03, S08 | Prompt templates, quote policy | S03, S08 | 1 |
| S07 | Experience | Search box on every page, results view, keyboard, phone, shareable query links, empty and no-result states | S05, S06 | /search/ page and shell integration | S05, S06 | 1 |
| S08 | Honesty and license | Verdict-aware wording, never recommend use against a verdict, license and rider shown correctly, credit, crawler policy for the quote shard (UNK-008) | S01, S03 | Honesty rules as gates | S01 | 1 |
| S09 | Evaluation | Golden query set, relevance metric, latency budgets and perf gate, fresh-visitor tasks | S01 | Golden set, eval harness, thresholds | S01 | 1 |
| S10 | Gates and operations | New gates (index schema, freshness, no-overclaim, relevance floor, perf budget), deploy integration | S04, S08, S09 | Gate definitions in verify-site.sh | S04, S08, S09 | 1 |
| S11 | Growth path | v2 sources (full docs, ADRs, proofs via fh and rigor-atlas; crates.io), new-repo cohorts feeding the index | S02 | Gated v2 plan, not built in v1 | S02 | 1 |

Parallel workstream feeding S02: **WS-COHORT**, assessing the six repositories Jeffrey created after the 44 (approved: all six), each a packet under the same Rulebook with a different-lineage review, landing as a dated cohort.
