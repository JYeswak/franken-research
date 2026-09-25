# Cohort 2026-09

This cohort is every public repository Jeffrey Emanuel (`Dicklesworthstone`) created after the pinned 44, as listed on 2026-09-24: six repositories, created between 2026-08-29 and 2026-09-20. Packets are dated 2026-09-24 and each is pinned to a commit.

The pinned 44 are unchanged. Their packets, pins, master matrix and every published count stay as they are. This cohort is reported beside them with its own date and counts, as [`candidates/README.md`](../../candidates/README.md) requires.

## Scope exception (DEC-002)

The [screening rule](../../candidates/README.md#screening-rule) requires all seven predicates. Joshua approved assessing all six repositories anyway (DEC-002 in [`.atlas-arc/registries/decisions.jsonl`](../../.atlas-arc/registries/decisions.jsonl)). That approval is the scope exception for the predicates that fail as written: predicate 7 (not Dicklesworthstone's) for every repository, and predicate 2 (Rust) where a project is not Rust-primary and is not itself a Rust port or Rust tool. A predicate that fails is recorded as a failure under the exception, never as a pass.

## Screening

Results as literally observed. "Not recorded" means the packet treats the predicate as superseded by the cohort approval and gives no evidence either way.

| Repository | 1 Public | 2 Rust | 3 Active | 4 Agent-built | 5 Not a fork | 6 Not covered | 7 Not Dicklesworthstone's | Evidence |
|---|---|---|---|---|---|---|---|---|
| readme_smoke_wt-pages | Pass | Fail | Pass | Fail | Pass | Pass | Fail | [screening note](readme_smoke_wt-pages-screening.md), table at lines 26-32. Fails screening on predicates 2 and 4; no packet written. |
| beads_bend | Pass | Fail | Pass | Pass | Pass | Not recorded | Fail | [packet](beads_bend-assessment.md), line 9 |
| annus-mirabilis.com | Pass | Fail | Pass | Pass | Pass | Pass | Fail | [packet](annus-mirabilis.com-assessment.md), table at lines 29-35 |
| toon_bend | Pass | Fail | Pass | Pass | Pass | Not recorded | Fail | [packet](toon_bend-assessment.md), line 9 |
| dwarf_fortress_mcp | Pass | Pass | Pass | Pass | Pass | Pass | Fail | [packet](dwarf_fortress_mcp-assessment.md), line 9 |
| skillranker | Not recorded | Not recorded | Not recorded | Not recorded | Not recorded | Not recorded | Fail | Packet in progress. |

## Review

Every packet so far was written by a Claude Opus 5.5 agent session. Each is reviewed by a session from a different model family before it counts as landed.

| Packet | Author model family | Reviewer | Review file | Verdict | Status |
|---|---|---|---|---|---|
| [readme_smoke_wt-pages](readme_smoke_wt-pages-screening.md) (screening note) | Claude | GPT-6-Luna | [reviews/luna-review-1.md](reviews/luna-review-1.md) | Accept with corrections | Corrections applied |
| [beads_bend](beads_bend-assessment.md) | Claude | GPT-6-Luna | [reviews/luna-review-1.md](reviews/luna-review-1.md) | Accept with corrections | Corrections applied |
| [annus-mirabilis.com](annus-mirabilis.com-assessment.md) | Claude | GPT-6-Luna | [reviews/luna-review-1.md](reviews/luna-review-1.md) | Accept with corrections | Corrections applied |
| [toon_bend](toon_bend-assessment.md) | Claude | none yet | none | none | Awaiting review |
| [dwarf_fortress_mcp](dwarf_fortress_mcp-assessment.md) | Claude | none yet | none | none | Awaiting review |
| skillranker | Claude | none yet | none | none | In progress |

toon_bend's predicate-2 line was changed from "PASS with a note" to a recorded failure, to match the reviewed beads_bend correction. Nothing else in that packet has been reviewed.
