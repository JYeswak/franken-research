# IF-SHARD: index shards, versions and cache-busting (v1)

Owner: S03/S04. Consumers: S05 engine, S07 page, S10 gates. Entry format: IF-ENTRY.md. Engine encoding inside a shard: S05 (not contracted here; waits for SearchPerfProbe).

## 1. Three shards

| Shard | File (under `site/assets/`) | Global | Contents | Loaded |
|---|---|---|---|---|
| core | `search-core.js` | `window.FR_SEARCH_CORE` | every `fr:` entry, every `fh:` entry, `ra:prescription:*`, `ra:kind:*`, and published crates (class A) | by a `<script src>` on every page that has the search box |
| deep | `search-deep.js` | `window.FR_SEARCH_DEEP` | `ra:profile:*`, `ra:technique:*`, and unpublished crates (classes B, C, D) | lazily, after the first keystroke or on idle, never blocking typing (REQ-O2) |
| quotes | `search-quotes.js` | `window.FR_SEARCH_QUOTES` | the `quote` object of every entry that has one, keyed by id | lazily, only when a result card that has a quote is opened |

Rules:

1. **Quotes are never in core or deep.** An entry in core or deep has no `quote` field; the card joins it from the quotes shard by id. Gate Q3 fails if `quote` appears in core or deep (HON-09).
2. **Every entry lives in exactly one of core and deep.** Gate Q1 fails on an id in both or in neither.
3. **Placement follows the charter's payload budget** (REQ-O2: core, "curated layers and published crates", at most 150 KB brotli; everything at most 1.5 MB brotli). Neither size is measured yet; SearchPerfProbe owns that. If core goes over budget the generator fails the build and prints the brotli size per family. The only allowed remedy without a charter amendment is a recorded decision moving whole snapshot families to deep in this order: `ra:kind`, then `ra:prescription`, then `fh:runbooks`. A family is never split between shards, and `fr:` entries and published crates never leave core.
4. **Script globals, not JSON.** Gate I loads pages from `file://` (site/BUILD-GATES.md:182-199) and the site runs from the ZIP; `site/assets/data.js` already ships data as a script that assigns a global. A lazily loaded shard is a `<script>` element inserted at runtime. That this works from `file://` while `fetch()` of JSON does not is [Inference] carried from intake-IntakeFR2 §4.3.6, not tested; gate Q5's render run must load the deep shard from `file://` and fail if it does not. No shard is fetched with `fetch()`.
5. A page loads `search-core.js` only through a normal `<script src>`, so gate S stamps it. A new `/search/` page also joins `PAGES` in `site/scripts/shell.mjs`, `sitemap.xml`, `SITE_PAGES` in `verify-site.sh` and gate I's page list (intake-IntakeFR2 §4.3); that is S07's work, not this contract's.

## 2. Shard file shape

Each file is one statement, `window.FR_SEARCH_<NAME> = <JSON>;`, with the JSON object:

```json
{
  "format": "fr.search.shard/v1",
  "entry_schema": "fr.search.entry/v1",
  "shard": "core",
  "build": "3f9c01ab7e",
  "generator": "site/scripts/make-search.mjs@1.0.0",
  "sources": [
    { "name": "fr-repo", "path": "stack/rigor-practices.tsv", "sha256": "ba08ad27…", "snapshot_date": "2026-09-24" }
  ],
  "count": 700,
  "shards": {
    "deep":   { "file": "search-deep.js",   "v": "a1b2c3d4e5", "count": 2694 },
    "quotes": { "file": "search-quotes.js", "v": "0f1e2d3c4b", "count": 0 }
  },
  "entries": []
}
```

(The numbers above are placeholders for the shape, not measurements.) `shards` appears in core only. Deep carries `entries`; quotes carries `"quotes": { "<id>": { …quote… } }` instead of `entries`. `sources` lists every source file the shard was built from with its sha256. The generator writes keys in a fixed order, sorts entries by id, writes no timestamps other than the source snapshot dates, and ends the file with one newline, so two runs on the same sources are byte-identical (the make-stack.mjs discipline; gate Q2 reruns it).

S05 may pack `entries` (column arrays, a string table, a prebuilt inverted index) as long as a documented unpack step returns objects that validate against `IF-ENTRY.schema.json`; gate Q1 validates the unpacked form.

## 3. Build id and file versions

Computed in this order so nothing depends on itself:

1. Serialize deep and quotes without their `build` field: `body_d`, `body_q`.
2. Serialize core without `build` and without the `shards.*.v` values: `body_c`.
3. `build` = first 10 hex of sha256(`body_c` + `"\n"` + `body_d` + `"\n"` + `body_q`). Any change to any entry in any shard changes `build`.
4. Write `build` into all three objects; write the deep and quotes files.
5. `v` of each lazy shard = first 10 hex of the sha256 of its written file, the same rule as `assetVersion()` in `site/scripts/shell.mjs:111-119`. Write those into core's `shards`, then write the core file.
6. Run `node site/scripts/shell.mjs` (`bun run build:shell`): it stamps `search-core.js?v=<first 10 hex of its sha256>` on every page that loads it, exactly as it does for `data.js` today. Gate S then fails until the stamp is current.

The loader requests `assets/search-deep.js?v=<shards.deep.v>` and `assets/search-quotes.js?v=<shards.quotes.v>`. Gate S cannot see these runtime URLs, so gate Q7 checks that each `v` in core equals the first 10 hex of the file's sha256.

Why the stamps are needed: `/assets/*` is served `max-age=0, must-revalidate` (`site/_headers`), but the fr.zeststream.ai zone raises browser caching to four hours whatever the header says (`site/_headers`, and shell.mjs:23-27). A changed file must get a new URL.

## 4. Versioning

- `format` (`fr.search.shard/v1`) versions the file layout; `entry_schema` (`fr.search.entry/v1`) versions entries. Both use `name/v<major>`.
- A backward-compatible addition (a new optional field, a new facet key, a new kind the client can render generically) keeps the major version and is recorded in IF-ENTRY.md. Removing or renaming a field, changing a field's meaning, adding a required field, or changing the id grammar in a way that renames existing ids bumps the major version.
- A major bump ships a new client and new shards in the same deploy (they are stamped together), so a skew can only come from caching (§5).

## 5. How a client detects version skew

The static host serves the current file whatever the `?v=` value says, so an old cached page (or an old cached core) can receive a new deep or quotes file. Every lazy load is therefore checked:

1. On page load the client reads `FR_SEARCH_CORE.format` and `entry_schema`. An unknown major version means the page's client is older or newer than the data: the box shows a visible notice "Search is updating. Reload the page." and does not index anything. It writes nothing to the console (gate I fails on console errors).
2. After a lazy shard loads, the client compares its `build` with `FR_SEARCH_CORE.build`. On a mismatch it discards the shard, keeps core results, and retries once with `?v=<v>&b=<core build>` (a URL no cache has seen). If the retry still mismatches, results stay core-only with the note "Showing the main results; deeper results are updating." It never mixes entries from two builds.
3. A quote whose shard fails the check is not shown; the card shows its links and license without the quote. A quote is never shown without its license notice and rider flag.
4. A shared link to an id the index does not contain is looked up in the retirement ledger (IF-ID.md §4) before the "not found" state.

## 6. Crawlers and the quotes shard

UNK-008 (HUMAN_DECISION) decides whether AI-lab crawlers are asked to skip the quotes shard; DEC-008 proposes a `robots.txt` group disallowing `/assets/search-quotes.js` for GPTBot, ClaudeBot, anthropic-ai, Google-Extended and CCBot while the rest of the site stays open. Until the maintainer decides, this contract proposes (DEC-P06) that the generator ships the quotes shard with zero quotes, so no rider-covered text is published under an undecided crawler policy. Gate Q3 enforces this through HON-15.
