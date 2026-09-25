# GATES-PLAN: new gates for the search (S10)

Status: plan only. Nothing here is implemented; S04/S05/S07 beads implement the gates and wire them into `site/scripts/verify-site.sh`. Contracts they enforce: IF-ID.md, IF-ENTRY.md, IF-SHARD.md, IF-SOURCES.md, IF-HONESTY.md, IF-PROMPT.md, TIER-MAP.md.

## Conventions every new gate follows (copied from the existing chain)

- Letter **Q** (unused today: the chain runs A, A2, B–M, S, V, W, W2). Sub-gates Q1–Q7, reported through `pass`/`fail` like K1–K5.
- Dependency-free: `node` standard library or `python3` standard library, as the other gates are. No `ajv`, no `jsonschema` in CI; Q1 carries its own validator for the keywords the schema uses.
- **Empty scan sets fail** (site/BUILD-GATES.md:45-49): each gate prints a count line (`SEARCH_Q1_OK entries=… ids=…`) and fails on zero.
- **Proven to trip.** Each gate has a `--selftest` that runs the same check over planted known-bad fixtures (proposed `search/fixtures/`) and passes only if every fixture fails for its planted reason and the clean fixture passes, the gate W/W2 pattern. The gate runs its selftest before the real check and fails if the selftest does.
- Summary line format like gate S: `PASS  Q1 search index entries valid (N entries, M ids, K families)`.
- Placement: after gate S (the shards must be stamped first) and before gate V. Q1–Q3, Q6, Q7 are offline and fast and run on every push in `verify.yml`; Q4 and Q5 need headless Chrome and run in `deploy.yml` with gate I.

## Q1 Schema

- **Checks:** every entry in core and deep (after S05's unpack) validates against `IF-ENTRY.schema.json`; every id matches exactly one IF-ID.md §5 regex (the gate reads the regex block from the file, as GoldenSet's `validate.mjs` already does); every id resolves to its source (the RP row, the heading, the manifest row in the crate snapshot, the fh row, the rigor-atlas row); each id is in exactly one of core and deep; every `url` resolves on disk with its fragment (gate E's rule).
- **Validator:** a node module implementing the keywords used: `type`, `enum`, `const`, `pattern`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems`, `maxItems`, `required`, `properties`, `additionalProperties: false`, `items`, `$ref` (local), `oneOf`, `allOf`, `if`/`then`/`else`, `not`. Its selftest also runs the three examples in `IF-ENTRY.examples.json`, which must pass.
- **Known-bad fixtures:** the 17 mutations already proven against the schema with `jsonschema` 4.25.1 (IF-ENTRY.md §5: rider flag false, branch URL, kind/id mismatch, missing license, …), plus: an unresolvable id (`fr:RP-999`), an id in both shards, a `url` fragment that does not exist (`rigor/index.html#rp-999`). A cross-check fixture: the node validator and `jsonschema` must agree on all fixtures (run locally when the validator changes, not in CI).

## Q2 Freshness (index equals a fresh build from committed sources)

- **Checks:** rerun the generator into a temp dir and `diff` its three shards byte for byte with `site/assets/search-*.js` (the K4 pattern, `verify-site.sh:1124-1143`); every `SNAPSHOTS.tsv` row names an existing file whose sha256 matches `export_sha256`; every shard `sources[]` hash matches the file it names; the crate snapshot's `snapshot_date` is at most 8 days old; every `fr:` source file the generator reads is listed in core `sources[]`.
- **Known-bad fixtures:** (1) a committed core shard with one summary edited by hand; (2) a vendored fh snapshot with one byte changed after its `SNAPSHOTS.tsv` row was written; (3) a crate snapshot dated 9 days before the fixture's fixed "today" (the gate takes today's date as an argument so the fixture is deterministic); (4) an RP row added to `stack/rigor-practices.tsv` without regenerating.

## Q3 Honesty

- **Checks:** IF-HONESTY.md HON-01 to HON-17, each as its own sub-check with its own count, over the built shards, the snapshots (for license classes, recorded quote hashes and 12-word shingle hashes), `search/verdict-posture.tsv`, `search/crawler-policy` and `site/robots.txt`.
- **Known-bad fixtures:** one per rule, as listed under each rule in IF-HONESTY.md (e.g. the frankensearch crate with `cargo add frankensearch`, a rider quote without its flag, a GUESS technique shown as `[Verified]`, a D14 oracle entry, a quote in the core shard, policy `pending` with one quote shipped). Each fixture is a complete, schema-valid entry, so the gate proves the honesty rule and not the schema caught it.

## Q4 Relevance floor (REQ-O1)

- **Checks:** run the built engine (node, the same module the page uses) over every query in `.atlas-arc/eval/golden.jsonl` (88 queries, GoldenSet `ebac079`), score top-3 hits by the rules in `.atlas-arc/eval/README.md` (§ "Scoring top-3 hit rate"), and fail below 80% hit rate or on any `must_not` id in a top 3. Write each run's top-3 lists to an artifact so REQ-O2's golden-set identity rule can diff two runs; fail if an optimisation-labelled change alters any top 3 without a recorded relevance decision.
- **Scope note:** this gate is the regression floor. REQ-O1 itself is met only by the independent judging session plus human confirmation the charter requires; Q4 passing is not that judgment.
- **Known-bad fixtures:** (1) an engine stub that returns results in reverse order (must fall below 80%); (2) an index missing one namespace (e.g. no `crate:` entries), which must fail the queries that expect crates; (3) a ranking that puts a `must_not` id first for its query.

## Q5 Performance budget (REQ-O2)

- **Checks,** in headless Chrome on the two reference profiles (desktop, no throttle; phone, 4x CPU throttle and Fast 4G), from `file://` like gate I and also from a local static server, since `file://` skips the network profile: at least 1,000 queries after warm-up (queries drawn from the golden set plus every prefix of each), reporting p50, p95, p99, p99.9: keystroke-to-paint p95 ≤ 8 ms desktop, ≤ 16 ms phone, p99 ≤ 2 × p95; search usable from core within 300 ms / 1,000 ms of `DOMContentLoaded`; no long task over 50 ms while typing (Long Tasks API); core ≤ 150 KB and all shards ≤ 1.5 MB brotli (measured by compressing the built files with node's `zlib.brotliCompressSync` at quality 11). Also asserts the deep shard loads from `file://` (the IF-SHARD.md §1 rule 4 inference) and that each namespace's card prints its pin date (HON-14).
- **Budgets come from the charter, not from a baseline**, and the gate never loosens them. SearchPerfProbe's run under `.atlas-arc/artifacts/perf/` sets the harness and the first numbers.
- **Known-bad fixtures:** (1) an engine build with a 20 ms busy loop per keystroke (must fail both p95 budgets and the long-task check); (2) a core shard padded past 150 KB brotli; (3) a page that loads the deep shard synchronously before the box accepts input (must fail the usable-after-load budget).

## Q6 Id stability

- **Checks:** compare the ids in the committed shards at the merge base (or the previous release tag) with the new build: every id that disappeared has a row in `search/ids-retired.tsv`; no retired id reappears for a different item; no id appears twice; every `new_id` in the ledger exists.
- **Known-bad fixtures:** (1) a technique heading retitled without a retirement row (`fr:tech-…` vanishes); (2) a retirement row pointing at a nonexistent `new_id`; (3) a retired id reused.

## Q7 Shard integrity and cache-busting

- **Checks:** each shard file is exactly one `window.FR_SEARCH_<NAME> = {...};` statement that parses; `format` and `entry_schema` are the expected majors; all three shards carry the same `build`; `build` equals the recomputation in IF-SHARD.md §3; each `shards.<name>.v` in core equals the first 10 hex of that file's sha256; every page that loads `search-core.js` carries its current `?v=` (gate S already fails on this; Q7 adds the runtime-loaded files gate S cannot see).
- **Known-bad fixtures:** (1) a deep shard rebuilt without updating core's `v`; (2) deep and core with different `build`; (3) a shard written with `fetch`-style JSON instead of a script assignment.

## Order of work

Q1 and Q7 land with the first generator (S04); Q3 and Q6 with the first shipped index; Q2 when the first snapshot is vendored; Q4 once S05's engine runs in node; Q5 with the S07 page. Each gate's BUILD-GATES.md section is written with the gate, as the existing gates are.
