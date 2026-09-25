# Relevance golden set (REQ-O1)

This directory holds the golden query set for the search's relevance outcome, REQ-O1 in `../PROJECT_CHARTER.md`: on at least 40 real queries, a correct item appears in the top 3 for at least 80%, judged by an agent session that did not build the index and confirmed by a human.

| File | What it is |
|---|---|
| `golden.jsonl` | 88 queries, one JSON object per line |
| `validate.mjs` | Node standard-library checker for the file's shape, ids and coverage |
| `ref/crates.tsv` | Crate ids (1,289) minted from the intake crate table, for resolving `crate:` ids |
| `ref/fh-ids.tsv` | fh catalog ids (56) from franken-harvest's five committed catalogs at `77d515b` |
| `ref/ra-ids.tsv` | rigor-atlas ids (1,797) from `data/rigor.sqlite` (sha256 `881cce40…`, built 2026-09-02) |

The `ref/` files hold ids only, with no catalog text. Each one records its source hash in its header. When the vendored snapshots from DEC-003 exist, point the validator at them (`--crates`, `--fh-ids`, `--ra-ids`) and delete these copies.

## Record format

```json
{"qid": "G-004", "query": "sqlite rewritten in rust, production ready drop-in replacement",
 "user": "U3", "origin": "charter", "origin_note": "REQ-U3 instantiated with X = SQLite",
 "expected": [{"id": "fr:verdict-frankensqlite", "why": "...", "where": "site/briefs/frankensqlite.html:463 (packet: ...)"}],
 "must_not": [{"id": "crate:frankensqlite/fsqlite-c-api", "why": "...", "where": "https://github.com/Dicklesworthstone/..."}],
 "difficulty": "intent", "honest_answer": "do not use"}
```

- `qid`: `G-001` onward, contiguous.
- `query`: the text a person would type.
- `user`: which charter user job the query serves: `U1` starting a project, `U2` hardening a process, `U3` evaluating a crate.
- `origin`: a session id (the transcript file name), `charter`, or `site`. `origin_note` says which charter line, site page, or paraphrase it came from.
- `expected`: 1 to 5 ids in the shared id form (`../contracts/IF-ID.md`). A correct top 3 contains at least one of them. Each entry has a one-line `why` and a `where`: a repo `file:line`, a GitHub URL pinned to a commit, or a pointer into the fh or rigor-atlas snapshot.
- `must_not` (optional): ids that would be wrong or harmful in the top 3.
- `difficulty`: `exact` (the query uses the item's own words), `synonym` (the query shares no word with any expected item's title; the validator checks this), `intent` (the query describes a goal, not the item), `typo`, or `negation` (the query says what the user does not want).
- `honest_answer` (optional): set when the honest answer is a verdict against use, for example "do not use". For these queries `expected` holds the verdict, and a crate from the same repository is allowed next to it but does not count as the hit.

## How the set was built

The author was an agent session (GoldenSet) that did not build, tune, or query any index. Expected answers come from reading the sources: this repository's layers, the crate table in the intake, fh's committed catalogs, and the rigor-atlas database. Nothing was ranked by software.

Queries came from three sources, in this order of preference.

1. **Joshua's own questions to agents** (15 queries from 11 sessions). The cass lexical index was missing (`cass status`: status `missing`, last indexed 2026-08-21), and `ee search` failed with `EE-E040 migration_drift`, so I did not rebuild either. Instead I read the transcripts cass indexes, the Claude Code sessions for control-plane and franken-harvest, the omp sessions for control-plane, and the 2026 Codex sessions, and kept user-typed messages that mention Jeffrey's tools or methods. Those messages are mostly instructions to agents, not search queries, so each query is a paraphrase of the question inside the message, with private names, projects and wording removed. `origin` is the session file name, so a reviewer can check the source.
2. **The charter's three user jobs** (49 queries). G-001 and G-002 are REQ-U1 and REQ-U2 verbatim. G-003 is REQ-U3 with X = hybrid search. The rest instantiate the three jobs with a concrete build goal.
3. **The site's own navigation** (24 queries): the briefs' "Should you use it?" question, the stack pages' "Choosing parts of an agent stack?", the lessons topics, and the failure-modes page.

Coverage when this set was written (from `validate.mjs`):

- Users: U1 29, U2 31, U3 28.
- Difficulty: exact 25, synonym 9 (all 9 share no word with an expected title), intent 41, typo 7, negation 6.
- 10 queries whose honest answer is a verdict against use.
- Every source kind appears in at least one expected list: rigor practices, readiness gates, starter-kit items, techniques, failure modes, lessons, the 44 verdicts, stack verdicts, cohort packets, crates, rigor-atlas prescriptions, kinds, profiles and techniques, and all five fh catalogs.

## Independence rule

- The judge of REQ-O1 is an agent session that did not build or tune the index, and a human (the maintainer) confirms its result. The session that wrote this set did not build the index either. The engine's authors may run the score, but they may not edit `golden.jsonl`.
- Before scoring, the judge reviews every query and marks it keep or drop, with a reason. Drop a query when its expected ids are wrong, or when nobody building software would type it. REQ-O1 needs at least 40 kept queries. The set ships 88 so that a strict review still leaves more than 40.
- Any change to `expected` or `must_not` after the first scored run needs a written reason and an independent reviewer. A change made to turn a miss into a hit is the golden regeneration reflex; do not make it.
- REQ-O2's golden-set identity rule uses this file: an optimisation may not change which items these queries rank in the top 3. Keep each scored run's top-3 lists so that two runs can be diffed.

## Scoring top-3 hit rate

1. Run each kept query through the search exactly as a visitor would type it, with no query rewriting that the product does not ship. Record one line per query: `{"qid": "G-001", "top": ["<id1>", "<id2>", "<id3>"]}`.
2. A query is a **hit** when at least one `expected` id is in `top`.
3. A query **violates honesty** when any `must_not` id is in `top`. Count it as a miss, and file it against REQ-O3 as well.
4. For a query with `honest_answer`, the hit must be the verdict. A crate from the same repository in the top 3 does not count toward the hit.
5. Hit rate = hits / kept queries. REQ-O1 passes at 0.80 or more.
6. Report the rate per `difficulty`, per `user`, and per id family of the expected ids. A good overall rate that hides a 0% family is a defect to report.
7. Look at every miss by hand. Where the engine returned a correct item the set did not list, the judge records it with a justification. A miss stays a miss in that run, and the item is added only under the change rule above.

## Validating the file

```sh
node .atlas-arc/eval/validate.mjs          # human report
node .atlas-arc/eval/validate.mjs --json   # machine report
```

It reads the id regexes from `../contracts/IF-ID.md` section 5 and keeps no copy of its own; if that file or its regex block is missing, it exits 1. It resolves each id against its source:

| Id family | Resolved against |
|---|---|
| `fr:RP-` | `stack/rigor-practices.tsv` |
| `fr:gate-` | `synthesis/planning/execution-readiness.md` |
| `fr:kit-` | `starter-kit/CHECKLIST.md` |
| `fr:tech-` | `synthesis/cross-pollination.md` |
| `fr:fm-` | `synthesis/negative-patterns.md` |
| `fr:lesson-` | `site/lessons/index.html` |
| `fr:verdict-` | `packets/` |
| `fr:stack-` | `stack/` |
| `fr:cohort-` | `cohorts/` |
| `crate:`, `fh:`, `ra:` | the `ref/` lists |

It also checks that every `where` file:line exists, that qids are unique and every query is distinct, that no id is both expected and `must_not`, and the coverage counts above.

Exit codes:

- `0`: everything is valid.
- `1`: a shape, grammar, `where` or coverage error.
- `2`: the only problem is ids that do not resolve. They are listed, never passed silently.

A run against planted bad copies (a missing RP id, a duplicate qid, a malformed id, a missing `where` file, an unknown crate, an id both expected and forbidden) reported every plant and exited 1. A copy whose only fault was an unknown fh runbook id exited 2.

## Known biases

- **One author, who had read the corpus.** Query wording leans on the corpus's own vocabulary: 25 queries are `exact`, and only 9 are strict synonyms. A lexical engine will look better on this set than on real traffic.
- **Few real queries, from one person.** 15 queries come from real sessions, all from one maintainer. They lean toward process rigor, Rust builds and agent fleets. The 73 charter and site queries are the author's guesses at how people phrase things.
- **Synthetic typos.** The 7 typo queries were typed on purpose, not observed in logs.
- **FrankenSuite-heavy.** Jeffrey's repositories and crates dominate. The 21 third-party stack verdicts appear in 8 queries, and unpublished leaf crates (class B) in none.
- **Lenient hits.** "At least one of up to five" rewards a result set that contains one weak correct item. Some queries have more correct answers than are listed, so a judge will see false misses; the rule for recording them is in step 7 above.
- **Only one `must_not`.** The set tests that do-not-use verdicts surface, but it barely tests that harmful items stay out of the top 3.
- **Snapshot drift.** Line numbers point at this repository at the time of writing. fh ids come from `77d515b`, and rigor-atlas ids from a database built on 2026-09-02. rigor-atlas technique ids hash the technique text, so a rebuilt database with edited text mints new ids.
- **Id-level judging only.** The set checks which items come back. It does not judge the wording of results, the agent prompt, or whether the license and rider are shown correctly (REQ-O3 and S08 own those checks).

## Evidence level and what was not run

- The expected ids and their `why` lines are the author's reading of the sources, checked by `validate.mjs`: every id resolves, and every `where` line exists. That is evidence the items exist. It is not evidence that they are the best answers. Only the independent review above can supply that.
- The coverage numbers come from one `validate.mjs` run on 2026-09-24 over this file, with exit 0.
- Not run: any search engine or index, any scoring run, and the independent review. The set has no measured hit rate yet.
- Not run: `cass` search and `ee search`. Both were unavailable, as described above, and neither was repaired.
