# IF-SOURCES: what v1 indexes (S02)

Owner: S02. Scope set by DEC-003 and the charter's Constraints. Ids: IF-ID.md. Entry fields: IF-ENTRY.md.
Measured 2026-09-24 on the M3 Ultra, franken-research at `cad7779` and again at `ebac079` (no source file read here changed between them), franken-harvest at `77d515b`, the rigor-atlas DB with sha256 `881cce40…`, and the intake crate table `atlas/eco2-crates.tsv` (sha256 `98d6715c…`). Each count below is the output of the command next to it; each command was run twice (N = 2), the second time by the extractor below, with identical results except the cohort file count, which grew by one packet a cohort author added in between.

## 1. How to reproduce every count

Run from the franken-research root with these variables set:

```sh
A=~/.local/state/zeststream/scratch/control-plane/franken-lead/atlas
FH=/Users/josh/Developer/franken-harvest
FHREV=77d515bf0e7c5f399f3aca82c63423d257799223
RA=/Users/josh/Developer/rigor-atlas/data/rigor.sqlite
RACOPY="$A/contracts-work/rigor.sqlite"   # cp "$RA" "$RACOPY" first; the DB is only ever opened ?immutable=1
```

All of them in one run: `bash "$A/contracts-work/counts.sh"`. The fh public-row filter: `python3 "$A/contracts-work/fh_public.py"`. License classes: `python3 "$A/contracts-work/license_classes.py"`. Ids per family: `python3 "$A/contracts-work/mint_ids.py"`.

Every inline command in this file, extracted and rerun: `python3 "$A/contracts-work/rerun_sources.py"` (36 commands, every one exits 0). The extractor turns table-escaped `\|` into `|`, which is right inside tables and wrong for the §6 `grep`, whose `\|` is grep alternation; run that one as written (it prints 13).

## 2. v1 sources

Refresh column: **Actions** = rebuilt from public GitHub in GitHub Actions on every deploy; **Actions snapshot** = a network collector in Actions commits a dated snapshot that the offline generator reads; **Vendored** = a dated, hashed snapshot committed by hand under the written procedure in §4 (charter Constraints; DEC-003; UNK-010).

### 2.1 Franken Research's own layers (`fr:`)

License class of all of them: `MIT` (this repo's `LICENSE` line 1 is `MIT License`; README.md:163 "MIT, no rider"). Refresh: Actions (read from the working tree by the generator on every build).

| Source | Path | Count | Command | Id family | Evidence scheme |
|---|---|---|---|---|---|
| Rigor practices | `stack/rigor-practices.tsv` | 136 rows, 136 unique ids | `tail -n +2 stack/rigor-practices.tsv \| wc -l`; `tail -n +2 stack/rigor-practices.tsv \| cut -f1 \| sort -u \| wc -l` | `fr:RP-NNN` | tier of the cited source line when tagged (32), else ungraded (104); see below |
| Readiness gates | `synthesis/planning/execution-readiness.md` | 23 | `grep -cE '^## Gate [0-9]+ ' synthesis/planning/execution-readiness.md` | `fr:gate-<n>` | weakest tier tag in the gate's section (all 23 sections carry one) |
| Starter-kit checklist | `starter-kit/CHECKLIST.md` | 28 | `grep -cE '^### [AB][0-9]+ ' starter-kit/CHECKLIST.md` | `fr:kit-<A\|B><n>` | ungraded (our method, not a finding); `[PROVISIONAL]` items say so |
| Techniques | `synthesis/cross-pollination.md` | 14 | `grep -cE '^## [0-9]+\. ' synthesis/cross-pollination.md` | `fr:tech-<slug>` | weakest tier tag in the section (all 14 carry one) |
| Failure modes | `synthesis/negative-patterns.md` | 11 | `grep -cE '^## P[0-9]+ ' synthesis/negative-patterns.md` | `fr:fm-p<n>` | the heading's tag for P1–P7; P8–P11 headings carry none and are ungraded |
| Lessons | `site/lessons/index.html` | 55 entries in 8 topics | `grep -c '<span class="r">' site/lessons/index.html`; `grep -c '<div class="topic" id=' site/lessons/index.html` | `fr:lesson-<topic>-<repo>` | ungraded, linked to the brief the lesson comes from |
| Repo verdicts | `packets/*-assessment.md` (briefs in `site/briefs/`) | 44 | `ls packets/*-assessment.md \| wc -l` | `fr:verdict-<repo>` | verdict (ring, TRL, posture from `search/verdict-posture.tsv`, §3) |
| Stack verdicts | `stack/<slug>.md` | 21 | `ls stack/*.md \| grep -v '/METHOD.md' \| wc -l` | `fr:stack-<slug>` | verdict (front-matter `verdict` and `confidence`) |
| Cohort verdicts | `cohorts/<yyyy-mm>/` | 5 files at the last run (4 assessments, 1 screening; the count grows as the cohort authors land packets), 0 indexable | `ls cohorts/*/*-assessment.md cohorts/*/*-screening.md` | `fr:cohort-<repo>` | verdict, only after the packet's independent review lands (open question 4) |

Tier tags on the rigor practices' cited source lines (the 32/104 split):

```sh
python3 - <<'EOF'
import csv,re,collections
rows=list(csv.DictReader(open('stack/rigor-practices.tsv'),delimiter='\t'))
tag=re.compile(r'\[(Verified|CI-observed|Maintainer claim|External|Inference|Code-verified|Counted|Git-observed|Verified absence|License-verified)[^\]]*\]')
c=collections.Counter()
for r in rows:
    m=re.match(r'(.+?):(\d+)',r['source'].split(';')[0].strip())
    line=open(m.group(1)).read().split('\n')[int(m.group(2))-1]
    c['tagged' if tag.search(line) else 'untagged']+=1
print(c)
EOF
# Counter({'untagged': 104, 'tagged': 32})
```

Auxiliary (not indexed as entries): `stack/licenses.tsv`, 101 rows (`tail -n +2 stack/licenses.tsv | wc -l`), the license table for the third-party incumbents the stack verdicts name; stack cards link it.

### 2.2 franken-harvest catalogs (`fh:`), vendored snapshot

Source: the private repo `JYeswak/franken-harvest` at `77d515bf0e7c5f399f3aca82c63423d257799223` (2026-09-18). The five catalog files are unmodified in its working tree (`git -C "$FH" status --short -- rigor-stack.tsv techniques.tsv oracles.tsv runbooks.tsv capability-adoptions.tsv | wc -l` → 0), so the committed revision is the source of record (intake-IntakeFH2 U9). Filter (DEC-003): rows citing public Dicklesworthstone code.

| Catalog | Rows | Public rows | v1 entries | sha256 of the file at `FHREV` | Id family |
|---|---|---|---|---|---|
| `rigor-stack.tsv` | 22 | 22 | 7 layers | `d69bca5c14ed796f50cf557f09e79f9d3cc0d7a44a720ab562a2a2aea351ca0a` | `fh:rigor:L<n>` |
| `techniques.tsv` | 14 | 14 | 7 techniques | `e062f428af50104b22ec49bc854f3c91f77bf7f2b3592d006bb6d0f08dcb6b09` | `fh:techniques:T<n>` |
| `oracles.tsv` | 18 | 13 (D1–D13) | 13 | `57a637b53724bccb754e57fb51d9fcb4ac80a3f19d8169ad91afd893b4865090` | `fh:oracles:D<n>` |
| `runbooks.tsv` | 26 | 26 (each step's exemplar path matches a public layer exemplar) | 26 steps | `cc538736186c912226adb94d21c44f57ad05646c61c7f98aaf1b481b9c56f5f9` | `fh:runbooks:<step_id>` |
| `capability-adoptions.tsv` | 3 | 3 | 3 | `9e967f5ef6c4a8a8d65b942c5a5bb2584c7809ead121474d81b8e373dfaff9f7` | `fh:capabilities:<id>` |
| **Total** | 83 | 78 | **56** | | |

Commands: rows `for f in rigor-stack techniques oracles runbooks capability-adoptions; do printf "%s rows=%s\n" $f "$(git -C "$FH" show $FHREV:$f.tsv | grep -vc "^#")"; done`; distinct layer ids `git -C "$FH" show $FHREV:rigor-stack.tsv | grep -v "^#" | cut -f1 | sort -u` (L1–L7); distinct technique ids `git -C "$FH" show $FHREV:techniques.tsv | grep -v "^#" | cut -f1 | sort -u` (T1–T7); oracle repositories `git -C "$FH" show $FHREV:oracles.tsv | grep -v "^#" | cut -f1,6` (Z1 clutterfreespaces.ios, Z2 zeststream-cast, Z3 control-plane, Z4 zesttube, D14 franken-harvest are private); runbook step ids `git -C "$FH" show $FHREV:runbooks.tsv | grep -v "^#" | cut -f3 | sort -u | wc -l` → 26; public filter `python3 "$A/contracts-work/fh_public.py"`; hashes `for f in rigor-stack techniques oracles runbooks capability-adoptions; do printf "%s %s\n" "$(git -C "$FH" show $FHREV:$f.tsv | shasum -a 256 | cut -c1-64)" $f.tsv; done`.

License classes: the catalog text is our own (franken-harvest has no LICENSE file; intake-IntakeFH2 §0), so vendoring it under this repo's MIT needs the maintainer's word (open question 1). The 19 public repositories the rows cite are, by root LICENSE at mirror HEAD, 18 `MIT+rider` and 1 `MIT` (`python3 "$A/contracts-work/license_classes.py"`, first line). The snapshot procedure re-reads each LICENSE at the row's own revision (DEC-006).

Dropped at export: the `quote` columns become `quote_sha256` (see §4.2), and the `replaces` column of `capability-adoptions.tsv` is dropped because it names private code (`franken-harvest build.rs sha2::`). The doctrine ledger (222 rows, 82 with private provenance) is not a v1 source (DEC-003).

Refresh: Vendored. franken-harvest is private and cannot be read in Actions.

### 2.3 rigor-atlas curated tables (`ra:`), vendored snapshot

Source: `rigor-atlas/data/rigor.sqlite`, sha256 `881cce40223af3079311f3390bfa851ff6b36aa792fcc225d45fd12ab91d366f` (`shasum -a 256 "$RA" "$RACOPY"`, both equal), `meta.built_at = 2026-09-02T10:48:49Z`. The bundle is not a git repository (intake-IntakeRigor2 §1), so the DB hash is the source identity.

| Table | Rows | v1 entries | Command | Id family |
|---|---|---|---|---|
| prescriptions | 140 | 140 | `sqlite3 "file:$RACOPY?immutable=1" "select (select count(*) from prescriptions),(select count(*) from kinds),(select count(*) from crate_profiles),(select count(*) from techniques),(select value from meta where key=\"built_at\")"` → `140\|41\|139\|1497\|2026-09-02T10:48:49Z` | `ra:prescription:<id>` |
| kinds | 41 | 41 | the prescriptions command (second value) | `ra:kind:<kind>` |
| crate_profiles | 139 | 137 (forks hnswlib-rs and rust-block dropped) | `sqlite3 "file:$RACOPY?immutable=1" "select count(*) from crate_profiles where repo not in ('hnswlib-rs','rust-block')"` | `ra:profile:<repo>` |
| techniques | 1,497 (KNOW 1,463, INFER 20, GUESS 14) | 1,479 (18 fork rows dropped) | `sqlite3 "file:$RACOPY?immutable=1" "select epistemic,count(*) from techniques group by 1"`; `sqlite3 "file:$RACOPY?immutable=1" "select count(*) from techniques where repo not in ('hnswlib-rs','rust-block')"` | `ra:technique:<repo>/<entity>/<h8>` |

`(repo, entity)` repeats in 37 technique pairs (`sqlite3 "file:$RACOPY?immutable=1" "select count(*) from (select repo,entity from techniques group by 1,2 having count(*)>1)"`), which is why the id carries a text hash (IF-ID.md).

License classes of the 137 profiled repos by root LICENSE at mirror HEAD: 110 `MIT+rider`, 18 `none`, 8 `MIT`, 1 not in the mirror (`frankentui-website`, renamed `frankentui_website`) (`license_classes.py`, second line). At the pinned SHAs the intake counted rider 109, MIT 9, Apache-2.0 1 (a fork), none 19 (intake-IntakeRigor2 §7); the snapshot records the class at each pin.

Not exported (DEC-003 and intake-IntakeRigor2 §7): `hits_sample` and the full-DB lexical layer, `hypotheses` (206 internal guesses), `entities`, `essays`, the `notes` and `author` columns, and every verbatim evidence quote (kept as `quote_sha256`; techniques stay pointer-only per DEC-003). Prose fields that embed code expressions are screened at export (open question 3).

Refresh: Vendored. The DB was built in a remote sandbox and needs an LLM ledger pass to refresh (intake-IntakeRigor2 §3), so it cannot be rebuilt in Actions.

### 2.4 Crate directory (`crate:`), Actions snapshot

Seed measured today from the intake table (the v1 collector replaces it with `search/snapshots/crates.tsv` built in Actions):

| Measure | Value | Command |
|---|---|---|
| Rows | 1,290 | `tail -n +2 "$A/eco2-crates.tsv" \| wc -l` |
| Real crates (a `[package] name`) | 1,289 | `python3 "$A/contracts-work/mint_ids.py"` (crate line); the extra row is `ultrasearch/Cargo.toml`, a `[package.metadata.wix]` file |
| Repos | 86 | `tail -n +2 "$A/eco2-crates.tsv" \| cut -f1 \| sort -u \| wc -l` |
| By class | A_published 211, B_leaf_candidate_unpublished 112, C_family_member_unpublished 476, D_internal_bin_only 30 (29 real), D_internal_publish_false 408, D_internal_tooling_name 53 | `tail -n +2 "$A/eco2-crates.tsv" \| cut -f5 \| sort \| uniq -c` |
| Crate names repeated across repos | 4 | `tail -n +2 "$A/eco2-crates.tsv" \| cut -f3 \| sort \| uniq -d \| wc -l` |
| `(repo, name)` pairs repeated | 3 | `tail -n +2 "$A/eco2-crates.tsv" \| cut -f1,3 \| sort \| uniq -d \| wc -l` |
| crates.io crates owned by Jeffrey's account | 216 | `python3 -c "import json;d=json.load(open('$A/eco2-cratesio-owner.json'));print(d['total'],len(d['crates']))"` → `216 216` |
| License class by repo root LICENSE (1,289 crates) | MIT+rider 1,264, MIT 8, other 12, none 5 | `license_classes.py`, third line |
| Crates whose manifest says `MIT…` inside a rider repo | 569 | `license_classes.py`, fourth line |
| Published crates by repo LICENSE | MIT+rider 210, MIT 1 | `license_classes.py`, fifth line |

Core shard gets class A (211); deep gets B, C and D (1,078). Id family `crate:<repo>/<crate>`.

Refresh: Actions snapshot (§4.1), daily with the watch and on every deploy.

## 3. Derived tables the build needs (proposed paths, S04 creates them)

| File | Purpose |
|---|---|
| `search/snapshots/SNAPSHOTS.tsv` | one row per vendored or collected snapshot file (§5) |
| `search/snapshots/fh/*.tsv`, `search/snapshots/ra-curated.json`, `search/snapshots/crates.tsv` | the snapshots themselves |
| `search/verdict-posture.tsv` | `repo  posture  path  lines` for the 44 verdicts, 21 stack verdicts and landed cohorts: the posture (IF-ENTRY.md) and the packet line that states it. A K2-style check proves the cited line exists. This re-encodes existing judgments with a citation; it is not a new verdict (charter non-goal). |
| `search/ids-retired.tsv` | retired ids (IF-ID.md §4) |

## 4. Refresh mechanisms and rebuild procedures

### 4.1 Crate collector (Actions snapshot)

A node script with no dependencies, in the style of `watch/discover.mjs` (proposed `search/tools/collect-crates.mjs`), run by the watch workflow and by deploy:

1. List the account's repos (`GET /users/Dicklesworthstone/repos`, paginated) and drop forks and archived repos.
2. For each repo whose default-branch head differs from the last snapshot, read the tree at that head (`GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`), fetch every tracked `Cargo.toml` at that sha, keep manifests with a `[package] name`, resolve `workspace = true` fields from the workspace root, and apply the class rules of intake-IntakeEco2 §1d (the raw columns stay in the file so classes can be recomputed).
3. Read the root `LICENSE` at the same sha and classify it (`MIT+rider` when the first line is `MIT License (with OpenAI/Anthropic Rider)`, `MIT`, `Apache-2.0`, `none` when absent, `proprietary` for an all-rights-reserved text, else `other`).
4. `GET /api/v1/crates?user_id=382477` (paginated, descriptive User-Agent, at most one request per second) for owner-verified names, versions and downloads.
5. Write `search/snapshots/crates.tsv` sorted by repo then manifest path, add the `SNAPSHOTS.tsv` row, and commit only when the content changed. The manifest `description` is Jeffrey's text: `crates.tsv` keeps `description_sha256` and the 12-word shingle hashes HON-12 needs, and the text itself goes to `search/snapshots/quotes.tsv`, which the collector writes only when `search/crawler-policy` is not `pending` (DEC-P06, DEC-P12). Keywords (single terms) stay in `crates.tsv` as facets.

A `--selftest` over recorded responses (the gate W2 pattern) must cover a forked repo, a nameless manifest, a repeated `(repo, name)` pair, a metadata-MIT crate in a rider repo, and a crates.io name owned by someone else.

### 4.2 fh snapshot (vendored)

On the maintainer's machine:

1. `git -C <franken-harvest> show <rev>:<file>.tsv` for the five catalogs at a clean, committed revision; record each sha256.
2. Drop private rows (oracles `Z*` and `D14`) and the `replaces` column; replace each `quote` with `quote_sha256` = sha256 of the quote text, plus the hashes of its normalized 12-word shingles for HON-12.
3. Write `search/snapshots/fh/<file>.tsv`, record the export sha256, and add `SNAPSHOTS.tsv` rows.
4. In Actions, a check fetches each cited line from `raw.githubusercontent.com/Dicklesworthstone/<repo>/<revision>/<path>` and compares its hash with `quote_sha256`, giving each row fh's own state vocabulary (`CURRENT`, `STALE`, ...) for TIER-MAP.md. Only this step touches the network, and it only reads public files.

### 4.3 rigor-atlas snapshot (vendored)

1. `cp rigor-atlas/data/rigor.sqlite <scratch>/rigor.sqlite`, then open the copy `?immutable=1` only (the CLI's `mode=ro` fails without a `-shm` file; intake-IntakeRigor2 §4).
2. Export (proposed `search/tools/export-ra.py`, standard library only) the four tables with the columns IF-ENTRY needs, fork rows dropped, evidence as `{path, line, quote_sha256}` plus 12-word shingle hashes for HON-12, rows sorted by primary key or by `(repo, entity, h8)`, keys sorted, UTF-8, one trailing newline.
3. Record the DB sha256, `meta.built_at`, the export sha256 and the row counts in `SNAPSHOTS.tsv`.

## 5. Snapshot record format

`search/snapshots/SNAPSHOTS.tsv`, one row per snapshot file, tab-separated, header:

```text
snapshot_id	file	source_kind	source_locator	source_revision	source_sha256	export_sha256	source_built_at	snapshot_date	rows	exporter	procedure
```

- `snapshot_id`: `<source_kind>-<snapshot_date>` plus `-<file stem>` when one source yields several files.
- `source_kind`: `fh`, `ra` or `crates`.
- `source_locator`: where the source lives (`JYeswak/franken-harvest:rigor-stack.tsv`, `rigor-atlas data/rigor.sqlite`, `GitHub API + crates.io API`).
- `source_revision`: a 40-hex commit, or `-` when the source has none (rigor-atlas).
- `source_sha256`, `export_sha256`: of the source bytes and of the committed file.
- `source_built_at`: the source's own build time (`meta.built_at` for rigor-atlas, the commit date for fh, the collection time for crates).
- `rows`: rows in the committed file. `exporter`: `<script>@<version>`. `procedure`: `IF-SOURCES.md#4.1`, `#4.2` or `#4.3` (moves to a README next to the snapshots when S04 lands).

Example rows with today's values (export hashes are computed when the files are vendored):

```text
fh-2026-09-18-rigor-stack	fh/rigor-stack.tsv	fh	JYeswak/franken-harvest:rigor-stack.tsv	77d515bf0e7c5f399f3aca82c63423d257799223	d69bca5c14ed796f50cf557f09e79f9d3cc0d7a44a720ab562a2a2aea351ca0a	<at vendoring>	2026-09-18	<at vendoring>	22	export-fh@1.0.0	IF-SOURCES.md#4.2
ra-2026-09-02	ra-curated.json	ra	rigor-atlas data/rigor.sqlite	-	881cce40223af3079311f3390bfa851ff6b36aa792fcc225d45fd12ab91d366f	<at vendoring>	2026-09-02T10:48:49Z	<at vendoring>	1797	export-ra@1.0.0	IF-SOURCES.md#4.3
```

(1,797 = 140 + 41 + 137 + 1,479.) Gate Q2 fails when a snapshot file's sha256 differs from its row, when a row names a missing file, or when the crates snapshot is more than 8 days old. fh and ra snapshots have no age limit (their date shows on every card); refreshing them is a v2 bead (UNK-009).

## 6. Not measured

Payload sizes of the shards (SearchPerfProbe), the crates.io license strings beyond the intake's 12-crate sample, LICENSE classes at every pinned SHA (the counts above are at mirror HEAD), and the number of verdict postures the packets state explicitly (13 of 44 packets carry a "do not depend" or "adopt the patterns, not the package" sentence: `grep -il 'do not depend\|don.t depend\|do not adopt\|do not use\|not for production\|adopt the patterns' packets/*.md | wc -l`; a phrase count, not a posture table).

## 7. Open questions for the maintainer

The contracts refer to these by number.

1. **Our catalog text under MIT.** franken-harvest and rigor-atlas have no LICENSE file; their catalog prose was written by our own agents. Vendoring it into this repository publishes it under this repository's MIT license. Approve?
2. **The rider sentence.** Cards and prompts use one constant built from the charter's wording (IF-PROMPT.md §3). The charter makes any change to how the rider is described a maintainer decision; approve the constant as written.
3. **Code inside rigor-atlas prose.** Some APPLY, RIGOR and KERNEL SHAPE fields embed short code expressions (intake-IntakeRigor2 §7). Drop those fields, or keep short expressions as our own notation?
4. **When a cohort packet is indexable.** Cohort packets land `[pending]` until an independent review. Which file records that the review passed (for example a `cohorts/<yyyy-mm>/REVIEWED.tsv` row), so the generator indexes only reviewed packets?
5. **UNK-008**, the crawler policy for the quotes shard. Until decided, quotes ship empty (DEC-P06).
6. **Ungraded items** (DEC-P08): accept an explicit "ungraded" badge for the 104 practices and other untiered items, or schedule a grading bead?
7. **Crate descriptions** (DEC-P11): quotes (lazy shard, our paraphrase in core) or metadata that may sit in core?
8. **rigor-atlas techniques stay pointer-only** under DEC-003 even though DEC-009 now allows short quotes. Keep that?
9. **Credit.** The charter says "every result names the maintainer's repository and links it". The contracts read "maintainer" as the upstream repository's maintainer (Jeffrey's repository), as RULEBOOK.md uses the word. Confirm.
