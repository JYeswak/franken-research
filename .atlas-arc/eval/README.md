# Relevance golden set (REQ-O1)

This directory holds the golden query set for the search's relevance outcome, REQ-O1 in `../PROJECT_CHARTER.md`: on at least 40 real queries, a correct item appears in the top 3 for at least 80%, judged by an agent session that did not build the index and confirmed by a human.

| File | What it is |
|---|---|
| `golden.jsonl` | 118 queries, one JSON object per line; 44 of them real (22 verbatim, 7 verbatim with private detail redacted, 15 paraphrased) |
| `validate.mjs` | Node standard-library checker for the file's shape, ids, id/source agreement, provenance, privacy, negative controls, leakage coverage and counts; `--selftest` runs the fixtures. It derives ids with `../../search/lib/ids.mjs` |
| `leakage.tsv` | The leakage audit: each query against all the text it cites, written by `validate.mjs --write-leakage`; its header is a fixed public form |
| `public-words.txt` | Words a reviewer accepted as public although the repository's published text lacks them (typos in real questions, a few ordinary words); the public-vocabulary check reads it |
| `fixtures/` | Planted known-bad golden files and `selftest.json`, which says how each must exit |
| `ref/crates.tsv` | Crate ids (1,289) minted from the intake crate table, for resolving `crate:` ids |
| `ref/fh-ids.tsv` | fh catalog ids (56) from franken-harvest's five committed catalogs at `77d515b` |
| `ref/ra-ids.tsv` | rigor-atlas ids (1,797) from `data/rigor.sqlite` (sha256 `881cce40…`, built 2026-09-02) |

The `ref/` files hold ids only, with no catalog text. Each one records its source hash in its header. When the vendored snapshots from DEC-003 exist, point the validator at them (`--crates`, `--fh-ids`, `--ra-ids`) and delete these copies.

## Record format

```json
{"qid": "G-104", "query": "asupersync is the engine that if we build all of this on, should guarantee that everything is accurate, right?",
 "user": "U3", "origin": "maintainer-session:2026-06-14#1", "origin_note": "verbatim question with private detail redacted; otherwise as typed",
 "provenance": {"source": "maintainer-session", "date": "2026-06-14", "verbatim": "asupersync is the engine that …", "redacted": ["private workflow clause removed"]},
 "expected": [{"id": "fr:verdict-asupersync", "why": "...", "where": "site/briefs/asupersync.html:477 (packet: packets/asupersync-assessment.md)"}],
 "must_not": [{"id": "crate:remote_compilation_helper/rabs-asupersync", "why": "...", "where": "https://github.com/Dicklesworthstone/remote_compilation_helper/blob/…/rabs-asupersync/Cargo.toml"}],
 "controls": ["family:pilot"], "difficulty": "intent", "honest_answer": "do not use"}
```

- `qid`: `G-001` onward, contiguous.
- `query`: the text a person would type. For the 29 new real queries it is the question as typed, trimmed to the question itself; in 7 of them a private span was replaced by a generic word or trimmed away (§ "Privacy").
- `user`: which charter user job the query serves: `U1` starting a project, `U2` hardening a process, `U3` evaluating a crate.
- `origin`: `charter`, `site`, or, for a real query, an opaque reference `maintainer-session:<YYYY-MM-DD>#<n>`: the date the question was asked and the n-th distinct session or prompt-history entry of that date. It names no file, machine or tool. `origin_note` says which charter line, site page, or session question it came from; a paraphrased real query's note starts with `paraphrase`.
- `provenance` (the 29 verbatim real queries only): `{source, date, verbatim, redacted?}`. `source` is `maintainer-session`; `date` equals the date in `origin`; `verbatim` equals `query`, at most 400 characters; `redacted` lists what kind of private detail was removed (for example `machine name replaced`), never the detail itself. Nothing else from the session is stored in this repository.
- `expected`: 1 to 5 ids in the shared id form (`../contracts/IF-ID.md`). A correct top 3 contains at least one of them. Each entry has a one-line `why` and a `where`: a repo `file:line`, a GitHub URL pinned to a commit, or a pointer into the fh or rigor-atlas snapshot. The `where` must point at that id's own source item (see "What the validator cannot see").
- `must_not` (optional): ids that would be wrong or harmful in the top 3.
- `controls` (optional): the negative-control families this query's `must_not` stands for (§ "Negative controls"). A query with `controls` must have a `must_not`.
- `difficulty`: `exact` (the query uses the item's own words), `synonym` (the query shares no word with any expected item's title; the validator checks this), `intent` (the query describes a goal, not the item), `typo`, or `negation` (the query says what the user does not want). This is the author's label; the leakage audit is the measured one.
- `honest_answer` (optional): set when the honest answer is a verdict against use, for example "do not use". For these queries `expected` holds the verdict, and a crate from the same repository is allowed next to it but does not count as the hit, unless that crate is in `must_not`.

## How the set was built

Expected answers come from reading the sources: this repository's layers, the crate table in the intake, fh's committed catalogs, and the rigor-atlas database. Nothing was ranked by software. The first 88 queries were written by an agent session (GoldenSet, 2026-09-24); queries G-089 to G-118, the negative-control fields and the leakage audit were added by a second session (SearchContracts, 2026-09-25) after review 5, and the provenance was made public-safe after review 5b. Neither session built, tuned or queried any index.

Queries come from three sources, in this order of preference.

1. **Real questions: 44 queries.** The charter needs at least 40, and review 5 refused the set with 15.
   - **29 from the maintainer's own typed messages (G-089 to G-117), added 2026-09-25**, dated 2026-02-25 to 2026-09-24, from the maintainer's agent-session transcripts and prompt histories. Method: a script kept human-typed user messages that mention Jeffrey, his repositories, crates or tools (by name) and ask a question; that left 485 sentences, read by hand. A question was kept when it is about Jeffrey's repos, practices, gates, crates or the franken ecosystem and a source in the corpus answers it. Dropped: questions about our own infrastructure, status checks, questions that need unstated context ("what would jeff do here?"), questions whose answer is outside the corpus (ntm and agent mail have no entry), and two questions that are the originals of existing paraphrases (G-022 and G-032 came from the same messages). The query is the question as typed, typos included (G-090 "frankenwhipser", G-094 "oslution", G-108 "franken-align"). **22 are unedited; 7 are redacted** (G-089, G-095 to G-098, G-104, G-107): a machine name, a hosting provider, a private mirror name, a private script name or a private workflow clause was replaced by a generic word or trimmed away (review 5b). A redacted query is still the question that was asked, with fewer words; if a reviewer counts only unedited questions, the real count is 37, below 40. Sources tried and found empty: `cass search` (no output within a 40 s timeout on 2026-09-25), the maintainer's Codex sessions (one matching message, not about Jeffrey's work), and this repository's GitHub issues (13, all opened by the daily watch, none by a person).
   - **15 paraphrased (G-005, G-006, G-022, G-029 to G-040), 2026-09-24.** From 11 sessions, written by GoldenSet as paraphrases of the question inside an instruction to an agent, with private names removed. Their `origin` was a session file name until review 5b; it is now the opaque reference.
2. **The charter's three user jobs: 50 queries.** G-001 and G-002 are REQ-U1 and REQ-U2 verbatim. G-003 is REQ-U3 with X = hybrid search. The rest instantiate the three jobs with a concrete build goal. G-118 was added as a negative control for the do-not-depend posture; it is not a real query.
3. **The site's own navigation: 24 queries:** the briefs' "Should you use it?" question, the stack pages' "Choosing parts of an agent stack?", the lessons topics, and the failure-modes page.

Charter and site queries are not counted as real traffic, and nothing in this file claims REQ-O1 without the independent review below.

### Provenance of real queries

The validator requires every session-origin query to carry an opaque `maintainer-session:<YYYY-MM-DD>#<n>` origin and either `provenance` with a non-empty verbatim question equal to the query, or an `origin_note` starting `paraphrase` (fixtures GF-07, GF-08), and it fails the file below 40 real queries (the REQ-O1 floor). The map from each reference to its session file or prompt-history entry, with the original unredacted text, is kept by the maintainer outside this repository; a reviewer who needs to check a query against its source asks the maintainer for that row.

## Privacy

This repository is public (reviews 5b and 5c). `validate.mjs` has four privacy layers, and reading is a fifth:

1. **Every field is scanned.** A golden record may contain only the fields the record schema names (`LEAVES` in `validate.mjs`); any other field, at any depth, fails with `field outside the public record schema` (GF-28). Every scalar of every record is scanned for: a local or home-directory path, a session-file name or session stamp, a machine or host (Mac model names and their spelling variants, Apple-silicon model strings, private-network host suffixes, IP addresses, phrases that point at the maintainer's own computer), an email address, an at-sign handle other than Jeffrey Emanuel's `@doodlestein`, a private-workflow phrase (terminal panes and sessions, forwarding instructions, notes about cloning), and a word on a hashed list of the maintainer's own host, volume, provider, private-repository and personal names (stored only as sha256, so the list discloses nothing). A hit fails with `privacy: <qid> <field>: <class>`.
2. **Structured fields are closed.** `honest_answer` and `provenance.redacted` are enums, `origin` and `provenance.date` have a fixed grammar, and `where` must match one of four public forms in full, so free text cannot ride in them (GF-22, GF-24).
3. **Prose uses public words.** The free-text fields (`query`, `origin_note`, `provenance.verbatim`, every `why`) may use only words that occur in the repository's own published text (assessments, syntheses, stack verdicts, the starter kit, cohort packets, briefs, lessons, the Rulebook, the charter, the id lists) or in `public-words.txt`, which a reviewer extends only after reading the sentence. An unknown server or project name fails even when no pattern matches it (GF-21). On 2026-09-25 the 118 records needed 29 allowlist words: 16 typos in real questions, 12 ordinary words and one public type name (PhaseGate).
4. **Committed files are scanned.** Every file under `.atlas-arc/eval` and `search/` that git tracks or would add is scanned line by line with the layer-1 patterns (GF-27). Two exemptions, both explicit: the pattern block of `validate.mjs` between its `privacy-patterns` markers, and the fixtures `selftest.json` marks `planted_private`, whose synthetic values exist to be rejected. `leakage.tsv` must carry a fixed header: the method, then `# written <date> by .atlas-arc/eval/validate.mjs --write-leakage (leakage format 2)`, then the columns, and nothing about where it was generated (GF-26).

Fixtures GF-14 to GF-28 plant each case, including the three evasion families of review 5c (machine-name variants, a workflow clause, private text in `why`, `honest_answer` and a redaction label); each must fail with its class. Run over the original text of the seven redacted real queries (2026-09-25, a scratch copy outside this repository), layers 1 to 3 flag five of them (G-095, G-096, G-097, G-098, G-107); they miss the clause trimmed from G-104, which is made of ordinary public words, and G-089 has nothing to flag (its query was already clean in c982b09; only its note mentioned the removed path). That is why reading stays a required gate for every new real query: no scan can tell a private workflow described in plain words from a public question.

G-116's `@doodlestein` is Jeffrey Emanuel's own handle (his repository `doodlestein_self_releaser` is in the rigor-atlas ids), so it stays. The `ref/` headers keep the sha256 of each source snapshot, as DEC-003's snapshot records require; a hash identifies a snapshot and discloses nothing about the machine that holds it.

Coverage when this set was last changed (from `validate.mjs`, 2026-09-25):

- Users: U1 38, U2 40, U3 40. Real queries: U1 9, U2 9, U3 11 among the 29 new ones.
- Difficulty (author's label): exact 34, synonym 10 (all 10 share no word with an expected title), intent 58, typo 10, negation 6.
- 17 queries whose honest answer is a verdict against use; 13 `must_not` ids on 13 queries.
- Every source kind appears in at least one expected list: rigor practices, readiness gates, starter-kit items, techniques, failure modes, lessons, the 44 verdicts, stack verdicts, cohort packets, crates, rigor-atlas prescriptions, kinds, profiles and techniques, and all five fh catalogs.

## Leakage audit

Review 5 found that some queries copy their expected item's own words, and that the validator's synonym check compares a query only with expected titles. `leakage.tsv` compares every query with all the text it cites, for expected and `must_not` ids alike: the id's title, the `why` line, and the cited source itself (repo file lines `where` to `where+6`; the crate manifest at its pinned commit, read from a local mirror; the fh catalog row, quote included, at the pinned revision; the full rigor-atlas row). A query is **leaky** when it shares a run of 3 or more consecutive words holding at least 2 content words with that text, or when half or more of its content words appear in it; otherwise it is **independent**. The thresholds are a judgment and are written into the file header; the file also records, per query, the longest shared run, the overlap, the sources read and any source that could not be read (none on 2026-09-25).

Result on 2026-09-25 after the review-5b redactions (N = 1 run; all 290 cited sources read, none missing):

| Subset | Leaky | Independent |
|---|---|---|
| All 118 | 87 | 31 |
| Real, verbatim (22) | 9 | 13 |
| Real, verbatim redacted (7) | 3 | 4 |
| Real, paraphrased (15) | 11 | 4 |
| All real (44) | 23 | 21 |
| Charter (50) | 46 | 4 |
| Site (24) | 18 | 6 |
| Author's `synonym` (10) | 4 | 6 |
| Author's `exact` (34) | 31 | 3 |

So the independently worded real subset is 21 queries (G-029, G-030, G-036, G-038, G-090, G-092, G-094, G-097 to G-099, G-103 to G-105, G-107, G-109 to G-112, G-115 to G-117), below the charter's 40. G-096 moved from independent to leaky when its hosting-provider name was replaced by "build server". REQ-O1 must report that subset's hit rate separately. `validate.mjs` fails when a query has no row or its row is stale (the query hash changed; fixture GF-11). Rerun `node .atlas-arc/eval/validate.mjs --write-leakage --mirror <dir> --fh-repo <dir> --ra-db <file>` after any query edit; it has no default paths, because the sources live on the maintainer's machine.

## Negative controls

A `must_not` id is a negative control: an item whose presence in the top 3 would answer the question with the wrong verdict. Almost all of them are lookalikes: a different repository whose name or subject resembles the one asked about and whose verdict differs (the website instead of the engine, the Bend port instead of the Rust tool, a neighbouring stack area with an adopt verdict). The families, and the queries that control them:

| Family | Meaning | Queries |
|---|---|---|
| `posture:patterns-only` | the verdict is "adopt the patterns, not the package" | G-003 |
| `posture:do-not-depend` | the verdict says do not use or depend on the software | G-004, G-090, G-118 |
| `posture:watch` | the stack verdict is Watch | G-012 |
| `posture:reference-only` | a Monitor-ring site: a demo or reference, not a fact source about the engine | G-107 |
| `posture:unassessed` | no verdict exists; a lookalike verdict must not stand in for one | G-015, G-116 |
| `family:pilot` | ring Pilot | G-089, G-090, G-104 |
| `family:explore` | ring Explore | G-093, G-103, G-107 |
| `family:monitor` | ring Monitor | G-103, G-107, G-116, G-118 |
| `family:stack` | the 21 stack verdicts | G-003, G-012, G-042 |
| `family:cohort` | cohort packets | G-015 |

The validator fails when a family has no query, when a query names an unknown family (GF-10), or when it names a family without a `must_not` id (GF-09). The `must_not` lists of G-003, G-004, G-012, G-015 and G-042 were added or tagged on 2026-09-25, before any scored run, to give each family a control; no `expected` list was changed.

## Independence rule

- The judge of REQ-O1 is an agent session that did not build or tune the index, and a human (the maintainer) confirms its result. The sessions that wrote this set did not build the index either. The engine's authors may run the score, but they may not edit `golden.jsonl`.
- Before scoring, the judge reviews every query and marks it keep or drop, with a reason. Drop a query when its expected ids are wrong, or when nobody building software would type it. REQ-O1 needs at least 40 kept real queries.
- Any change to `expected` or `must_not` after the first scored run needs a written reason and an independent reviewer. A change made to turn a miss into a hit is the golden regeneration reflex; do not make it.
- REQ-O2's golden-set identity rule uses this file: an optimisation may not change which items these queries rank in the top 3. Keep each scored run's top-3 lists so that two runs can be diffed.

## Scoring top-3 hit rate

1. Run each kept query through the search exactly as a visitor would type it, with no query rewriting that the product does not ship. Record one line per query: `{"qid": "G-001", "top": ["<id1>", "<id2>", "<id3>"]}`.
2. A query is a **hit** when at least one `expected` id is in `top`.
3. A query **violates honesty** when any `must_not` id is in `top`. Count it as a miss, and file it against REQ-O3 as well.
4. For a query with `honest_answer`, the hit must be the verdict. A crate from the same repository in the top 3 does not count toward the hit, and is a violation if it is in `must_not`.
5. Hit rate = hits / kept queries. REQ-O1 passes at 0.80 or more on the kept real queries.
6. Report the rate per `difficulty`, per `user`, per id family of the expected ids, and separately for: real queries, the leaky and the independent subsets, and the independent real subset. Report two honesty numbers apart from the hit rate: the **honesty-hit rate** (queries with `honest_answer` whose verdict is in the top 3) and the **must-not rejection rate** (queries with `must_not` whose top 3 holds none of them). A good overall rate that hides a 0% subset is a defect to report.
7. Look at every miss by hand. Where the engine returned a correct item the set did not list, the judge records it with a justification. A miss stays a miss in that run, and the item is added only under the change rule above.

## Validating the file

```sh
node .atlas-arc/eval/validate.mjs              # human report
node .atlas-arc/eval/validate.mjs --json       # machine report
node .atlas-arc/eval/validate.mjs --selftest   # every planted fixture must exit as fixtures/selftest.json says
node .atlas-arc/eval/validate.mjs --write-leakage --mirror <dir> --fh-repo <dir> --ra-db <file>   # rewrite leakage.tsv
```

It reads the id regexes from `../contracts/IF-ID.md` section 5 and keeps no copy of its own; if that file or its regex block is missing, it exits 1. It builds every `fr:` id with `mint()` from `../../search/lib/ids.mjs`, the one derivation function the generator and gate Q1 must also import, and re-mints every id of `ref/crates.tsv` from its row (an id that differs is an error). It resolves each id against its source:

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

It also checks that every `where` file:line exists and points at its own id's source item (the RP row, the heading, the lesson line, the verdict's brief or packet, the stack or cohort file, the crate's manifest at its head commit, the fh catalog file, the rigor-atlas key), that qids are unique and every query is distinct, that no id is both expected and `must_not`, provenance, privacy, negative-control families, leakage rows, and the coverage counts above (including at least 40 real queries). `--no-coverage` skips the whole-file counts and the leakage file, for fixtures.

Exit codes:

- `0`: everything is valid.
- `1`: a shape, grammar, agreement, provenance, privacy (record or committed file), control, leakage or coverage error.
- `2`: the only problem is ids that do not resolve. They are listed, never passed silently.

`--selftest` runs 28 fixtures (`fixtures/selftest.json`): an unresolved id (review 5's `fr:RP-999`, exit 2); a crate suffix on a unique pair and a repeated pair without its suffix (exit 2); a suffix hashed from the sibling manifest and review 5's valid-but-wrong `fr:RP-001` with RP-084's `where` (exit 1); the boundary below (exit 0); a real query without provenance, an empty verbatim, controls without `must_not`, an unknown control family, a stale leakage row (exit 1); fifteen privacy plants, GF-14 to GF-28 (§ "Privacy"; exit 1, each with its class); a clean record and the committed file (exit 0). On 2026-09-25 all 28 exited as specified. Planted values in the fixtures are synthetic.

### What the validator cannot see

`validate.mjs` checks shape and source: that an id is well-formed, exists, and is cited at its own source. It cannot check relevance. A valid id cited at its own source passes even when it does not answer the query (fixture GF-06: `fr:RP-001`, CI job timeouts, as the answer to "How do I stop my agents claiming tests passed when they did not?", exits 0). Review 5's second mutation, the same id left on RP-084's `where`, now fails (GF-05), but only because the `where` disagrees; a wrong id with a matching `where` still passes. Whether each expected id is a good answer is owned by the independent review above, and every change to an expected id needs a source-backed reason under the change rule.

## Known biases

- **Real queries are one person's.** All 44 come from the maintainer's sessions and lean toward process rigor, Rust builds, agent fleets and the maintainer's own tools (dcg, rch, beads). 17 of the 29 new ones survive only in a prompt history, which keeps the text but not the surrounding conversation, so some questions ("how does franken_whisper, franken_ocr, and franken_tts handle these at the crate level?") lost the referent of "these".
- **Selection by keyword.** The mining script kept messages that name Jeffrey or a known tool, so questions about his work that name nothing were missed, and the kept set leans to named repositories: 12 of the 29 new real queries are leaky, mostly because they name the repository they ask about.
- **Redaction edits the query.** 7 real queries lost a private span (§ "Privacy"). The edits replace or trim; none adds words from a cited source, but G-096 became leaky through its replacement word.
- **Leakage is measured, not removed.** 87 of 118 queries are leaky under the thresholds above; the charter queries are almost all leaky (46 of 50). A lexical engine will look better on this set than on real traffic. Score the independent subsets separately.
- **Synthetic typos.** Of the 10 typo queries, 3 are real (G-090, G-094, G-108) and 7 were typed on purpose.
- **FrankenSuite-heavy.** Jeffrey's repositories and crates dominate. The 21 third-party stack verdicts appear in 9 queries, and unpublished leaf crates (class B) in 3 (G-027, G-116, and the G-089 `must_not` control).
- **Lenient hits.** "At least one of up to five" rewards a result set that contains one weak correct item. Some queries have more correct answers than are listed, so a judge will see false misses; the rule for recording them is in step 7 above.
- **Controls are few.** 13 `must_not` ids cover the 10 families once or more, not every repository with a do-not-depend verdict.
- **Snapshot drift.** Line numbers point at this repository at the time of writing. fh ids come from `77d515b`, and rigor-atlas ids from a database built on 2026-09-02. rigor-atlas technique ids hash the technique text, so a rebuilt database with edited text mints new ids.
- **Id-level judging only.** The set checks which items come back. It does not judge the wording of results, the agent prompt, or whether the license and rider are shown correctly (REQ-O3 and S08 own those checks).

## Evidence level and what was not run

- The expected ids and their `why` lines are the authors' reading of the sources, checked by `validate.mjs`: every id resolves, every `where` line exists and belongs to its id. That is evidence the items exist and are cited correctly. It is not evidence that they are the best answers. Only the independent review above can supply that.
- The coverage and leakage numbers come from one `validate.mjs` run and one `--write-leakage` run on 2026-09-25 over this file after the review-5b redactions, exit 0, and one `--selftest` run with all 28 fixtures as specified.
- Not done yet: the independent relevance review. It needs a built engine, which does not exist; when it does, an agent session that did not build the index scores every kept query, publishes the top-3 lists, the honesty-hit and must-not rejection rates and the independent-subset rates, and the maintainer confirms the result (§ "Independence rule"). Until then this set has no measured hit rate, and nothing here claims REQ-O1: even the real-query floor rests on counting the 7 redacted questions, and only 21 real queries are independently worded.
- Not repaired: `cass search` (timed out after 40 s on 2026-09-25) and `ee search` (failed with `EE-E040 migration_drift` on 2026-09-24). Both were bypassed by reading the session files and prompt histories directly.
