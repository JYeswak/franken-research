# IF-ID: identifiers for indexed items (v1)

Owner: S03 (index entry contract). Consumers: S04 generator, S05 engine, S07 share links, S09 golden set, S10 gates.
Implements DEC-007 and the charter constraint "Every indexed item traces to a stable ID".
Status: CONTRACTED (proposed), 2026-09-24. Counts cited here are measured in IF-SOURCES.md.

## 1. Shape

An id is `<namespace>:<local>`. Three namespaces hold our own curated layers and the two vendored catalogs; one holds crates.

| Namespace | Holds | Owner of the source |
|---|---|---|
| `fr:` | Franken Research's own layers (this repo) | this repo |
| `fh:` | franken-harvest's public-citing catalog rows (dated snapshot, DEC-003) | franken-harvest @ `77d515b` |
| `ra:` | rigor-atlas curated tables (dated snapshot, DEC-003) | rigor-atlas DB sha256 `881cce40…` |
| `crate:` | Rust crates in Jeffrey's public repositories | public GitHub + crates.io |

Global rules:

1. ASCII only, case-sensitive, at most 160 characters, no whitespace. Allowed characters: `A-Z a-z 0-9 . _ - / : ~`.
2. An id is opaque once minted. The derivation rules below run one way (source to id); nothing parses an id back into fields. That is why `fr:lesson-ci-gates-frankengit` needs no separator rule: uniqueness of the whole string is what matters.
3. An id is derived only from a key the source itself carries: a written id (`RP-001`, `C31`), a written number (`Gate 7`), a heading, a file name, a repo name, a manifest name, a database primary key, or a hash of the item's own text. Never from row order, a database rowid, build time, or position in an output file.
4. An id is never reused for a different item, even after the item is removed.
5. Share links and the golden set use the id verbatim; URLs percent-encode it.

## 2. Grammar per family

| Family | Grammar | Derived from | Example | v1 count |
|---|---|---|---|---|
| Rigor practice | `fr:RP-NNN` | `id` column of `stack/rigor-practices.tsv` (already `RP-001`..`RP-136`, enforced by gate K3) | `fr:RP-009` | 136 |
| Readiness gate | `fr:gate-<n>` | `## Gate <n> —` heading in `synthesis/planning/execution-readiness.md` | `fr:gate-7` | 23 |
| Starter-kit item | `fr:kit-<A\|B><n>` | `### <id> —` heading in `starter-kit/CHECKLIST.md` (checked by K3) | `fr:kit-A2` | 28 |
| Technique | `fr:tech-<slug>` | title of `## <n>. <title>` in `synthesis/cross-pollination.md`, number dropped, slugged (§3) | `fr:tech-claim-to-proof-registry-with-machine-gates` | 14 |
| Failure mode | `fr:fm-p<n>` | `## P<n> —` heading in `synthesis/negative-patterns.md`, lowercased | `fr:fm-p2` | 11 |
| Lesson | `fr:lesson-<topic>-<repo>` | `div.topic` id plus the `span.r` repo name of the entry in `site/lessons/index.html` | `fr:lesson-claim-discipline-asupersync` | 55 |
| Repo verdict (the 44) | `fr:verdict-<repo>` | `packets/<repo>-assessment.md` | `fr:verdict-frankensearch` | 44 |
| Cohort verdict | `fr:cohort-<repo>` | `cohorts/<yyyy-mm>/<repo>-(assessment\|screening).md`, only after its independent review lands | `fr:cohort-toon_bend` | 0 landed |
| Stack verdict | `fr:stack-<slug>` | `stack/<slug>.md` (the 21 slugs K1 checks) | `fr:stack-vector-dbs` | 21 |
| fh rigor layer | `fh:rigor:L<n>` | `layer_id` of `rigor-stack.tsv`; one entry per layer, its exemplar rows nested | `fh:rigor:L3` | 7 |
| fh technique | `fh:techniques:T<n>` | `technique_id` of `techniques.tsv`; exemplar rows nested | `fh:techniques:T1` | 7 |
| fh oracle | `fh:oracles:D<n>` | `domain_id` of `oracles.tsv`, public rows only (D1..D13) | `fh:oracles:D6` | 13 |
| fh runbook step | `fh:runbooks:<step_id>` | `step_id` of `runbooks.tsv` | `fh:runbooks:CO4` | 26 |
| fh capability | `fh:capabilities:<capability_id>` | `capability_id` of `capability-adoptions.tsv` | `fh:capabilities:CAP-FS-BLAKE3` | 3 |
| ra prescription | `ra:prescription:<id>` | `prescriptions.id` (text primary key) | `ra:prescription:anytime-valid-e-process-gate` | 140 |
| ra kind | `ra:kind:<kind>` | `kinds.kind` (text primary key) | `ra:kind:storage-kernel` | 41 |
| ra repo profile | `ra:profile:<repo>` | `crate_profiles.repo` (primary key), forks excluded | `ra:profile:frankensqlite` | 137 |
| ra technique | `ra:technique:<repo>/<entity>/<h8>` | `techniques.repo`, `techniques.entity` with `:` mapped to `.`, and `h8` = first 8 hex of sha256 of the UTF-8 `techniques.technique` text with surrounding whitespace stripped; forks excluded | `ra:technique:frankensqlite/mvcc/1df51efc` | 1,479 |
| Crate | `crate:<repo>/<crate>` and, for a repeated pair only, `crate:<repo>/<crate>~<h6>` | repository name, `[package] name`, and for the suffix the first 6 hex of sha256 of the manifest path; a manifest with no `[package] name` is not a crate | `crate:asupersync/asupersync` | 1,289 |

Notes on the choices that differ from the obvious ones:

- **Lessons use topic and repo, not an ordinal.** An ordinal renumbers every later lesson when one is inserted. Topic plus repo is unique today (12+11+6+6+4+6+5+5 = 55, no repo twice in one topic) and survives reordering.
- **fh rows are grouped.** `rigor-stack.tsv` and `techniques.tsv` repeat `L3` and `T1` across exemplar rows (22 rows, 7 layers; 14 rows, 7 techniques). The searchable thing is the layer or technique; exemplars are its copy targets.
- **ra techniques do not use `techniques.id`.** That column is an integer assigned at build and is not stable across rebuilds. `(repo, entity)` alone repeats in 37 pairs. The text hash is stable while the technique text is unchanged, and a changed text is a changed claim, so it deserves a new id (with a retirement row, §4).
- **Crates carry the repo.** Crate names repeat across repos (4 names: `xtask`, `tabout`, `fcb-headless-consumer`, `srt-timestamp-perf`), and even `(repo, crate)` repeats in 3 pairs where a repo holds two manifests of the same name (all unpublished, classes C and D). Only those 6 crates carry the `~<h6>` suffix; every member of a repeated pair carries it, so no crate silently owns the plain id.
- **Not in v1:** `fh:ledger:*` (the doctrine ledger C1–C180 is not one of the five catalogs DEC-003 names), `ra:entity:*` (entities are not in DEC-003's list), fh oracles `D14` and `Z1`–`Z4` (private repositories), the ecosystem gate specs `GATE-001..018` and `GATE-<AREA>-NN`, vendor-port `A1–A11`/`G1–G14`/`T-*`, hurdles `H1–H6`, CI classes `C1–C6`. These prefixes are reserved and a generator must not mint them in v1.

## 3. Slug rule

`slug(s)` = lowercase `s`; replace every maximal run of characters outside `[a-z0-9]` with `-`; strip leading and trailing `-`. Example: `Evidence-color / no-laundering composition algebra` → `evidence-color-no-laundering-composition-algebra`. A slug is not truncated. If two items in one family produce the same slug, the generator fails the build (§4); it never appends a counter.

Repo names are used verbatim (case, `.`, `_`, `-` preserved): `fr:verdict-beads-for-frankentui`, `fr:cohort-annus-mirabilis.com`.

## 4. Collisions and stability

**Collision rule.** The generator collects every minted id and fails the build, naming both sources, when one id would be minted twice. The two suffix schemes above (`~<h6>` on repeated crate pairs, `/<h8>` on every ra technique) are the only disambiguation; nothing else is suffixed automatically. The source families that collide today (checklist `A1` vs vendor-port `A1`; `G1` as a proposed gate, verify gate, and reference file; execution-readiness Gate 7 vs `GATE-007`; failure mode `P1` vs audit gap `P1-1`; intake-IntakeFR2 §2) cannot collide here because each family has its own prefix and the ambiguous families are not minted in v1.

**What makes an id stable across rebuilds.**

1. Same source bytes produce the same ids (the generator is deterministic; gate Q2 in GATES-PLAN.md reruns it).
2. An id changes only when its derivation key changes: a retitled technique heading, a renamed repo, a lesson moved to another topic, an edited ra technique text, a new sibling manifest turning a crate pair into a repeated pair.
3. **Retirement ledger.** Every id present in the committed index and absent from the new build must have a row in `search/ids-retired.tsv` (proposed path; columns `old_id new_id retired_on reason`, `new_id` is `-` when the item was removed). Gate Q6 compares the two id sets and fails on an unexplained disappearance. The client resolves a shared link to a retired id through this table.
4. **Pins are not part of the id.** A crate or fh row moving to a new commit keeps its id; the commit lives in `source_url` and `provenance`.
5. A cohort repo re-assessed in a later cohort keeps `fr:cohort-<repo>`, which always points at the newest landed packet. A repo that moves from a cohort into the main set becomes `fr:verdict-<repo>` and its cohort id is retired to it. One repo never holds both ids at once (gate Q3 rule HON-16).

**One derivation function (added after review 5; built after review 5b).** A regex match and membership in an id list prove an id is well-formed and exists, not that it is this entry's id. So the §2 rules live in one module, `search/lib/ids.mjs`: `mint(source_row) -> id`, `mintCrates(rows)` for the suffix rule over a whole crate snapshot, `loadGrammar()` for the §5 block, and `check(claimed, source_row)` for the comparison below. It exists and runs today: `node search/lib/ids.mjs --selftest` runs IDF-00 to IDF-07 (8 of 8 as specified on 2026-09-25; removing the `trim()` in the ra rule or the `:` to `.` mapping each makes it fail), and `.atlas-arc/eval/validate.mjs` imports it for every `fr:` resolver and re-mints all 1,289 crate ids of its reference list (all equal). The S04 generator and gate Q1 do not exist yet; they must import this module and keep no copy. Q1 then checks, for every entry:

1. `mint(entry's source row) == entry.id`, where the source row is the one the entry's `evidence.source` / `provenance.source` names (`Q1.ID.SOURCE_MISMATCH`). This catches a valid id of a different item on this item's row (the review-5 `fr:RP-001` mutation), a crate suffix hashed from the sibling manifest, and an ra `h8` hashed from unstripped text.
2. Suffix canonicity over the whole minted set: a `~<h6>` suffix appears exactly on the members of repeated `(repo, crate)` pairs in the crate snapshot (`Q1.ID.NONCANONICAL_SUFFIX` for a suffix on a unique pair, `Q1.ID.MISSING_REQUIRED_SUFFIX` for a repeated pair without one).
3. The §5 grammar (`Q1.ID.GRAMMAR`).

Fixtures IDF-00 to IDF-07 in `fixtures/id-derivation.json` (IDF-06 and IDF-07 use synthetic technique text, not rigor-atlas prose). IDF-01 to IDF-05 also exist as golden-file fixtures that `node .atlas-arc/eval/validate.mjs --selftest` runs (GF-02 to GF-06): the golden validator resolves crate ids against the minted crate list and requires every `where` to point at its own id's source item, which catches IDF-01 to IDF-04. IDF-05 is the boundary both checks share: a valid id cited at its own source passes even when it does not answer the query. Relevance is not a property an id check can see; for the golden set it belongs to the independent review (eval/README.md, "Independence rule").

## 5. Validator regexes

One regex per family. An id is valid when it matches exactly one of these. GoldenSet's validator and gate Q1 read this list; keep it in this form (a fenced block, one `family<TAB>regex` per line).

```text
fr-practice	^fr:RP-[0-9]{3}$
fr-gate	^fr:gate-[1-9][0-9]?$
fr-kit	^fr:kit-[AB][1-9][0-9]?$
fr-tech	^fr:tech-[a-z0-9]+(?:-[a-z0-9]+)*$
fr-fm	^fr:fm-p[1-9][0-9]?$
fr-lesson	^fr:lesson-[a-z0-9]+(?:-[a-z0-9]+)*-[A-Za-z0-9._-]+$
fr-verdict	^fr:verdict-[A-Za-z0-9._-]+$
fr-cohort	^fr:cohort-[A-Za-z0-9._-]+$
fr-stack	^fr:stack-[a-z0-9]+(?:-[a-z0-9]+)*$
fh-rigor	^fh:rigor:L[1-9]$
fh-techniques	^fh:techniques:T[1-9][0-9]?$
fh-oracles	^fh:oracles:D(?:[1-9]|1[0-3])$
fh-runbooks	^fh:runbooks:[A-Z]{1,3}[1-9][0-9]?$
fh-capabilities	^fh:capabilities:CAP-[A-Z0-9]+(?:-[A-Z0-9]+)*$
ra-prescription	^ra:prescription:[a-z0-9]+(?:-[a-z0-9]+)*$
ra-kind	^ra:kind:[a-z0-9]+(?:-[a-z0-9]+)*$
ra-profile	^ra:profile:[A-Za-z0-9._-]+$
ra-technique	^ra:technique:[A-Za-z0-9._-]+/[A-Za-z0-9._-]+/[0-9a-f]{8}$
crate	^crate:[A-Za-z0-9._-]+/[A-Za-z0-9_-]+(?:~[0-9a-f]{6})?$
```

The `fh-oracles` regex admits D1..D13 only, so a private oracle row cannot validate even if a generator bug lets it through. `fr-lesson` and `fr-tech` overlap in character set only, not prefix; no id can match two families.

A regex match is necessary, not sufficient: gate Q1 also requires every id in the index to resolve to its source (the RP row exists, the heading exists, the manifest exists in the crate snapshot), to equal `mint` of that source (§4, "One derivation function"), and gate Q6 requires the retirement rule above.

## 6. Proof run (2026-09-24)

`python3 [LOCAL_SCRATCH]/atlas/contracts-work/mint_ids.py` mints every v1 id from the real sources with the rules above (fh at `77d515b`, the rigor-atlas DB copy with sha256 `881cce40…`, `atlas/eco2-crates.tsv`), reads the regex block from this file, and exits 1 on a duplicate or an id that matches zero or two families. Output: 3,474 ids, 3,474 unique, 0 invalid, exit 0; per family exactly the counts in §2. Seven planted known-bad ids are all rejected: `fr:A1`, `fh:oracles:Z2`, `fh:oracles:D14`, `ra:technique:frankensqlite/mvcc`, `crate:xtask`, `fr:rp-001`, `fh:ledger:C31`.

The first run failed on one id, `crate:ultrasearch/`: the intake's crate table counts `ultrasearch/Cargo.toml`, a `[package.metadata.wix]` file with no `[package] name`, as a crate. The intake's 1,290 is therefore 1,289 crates. The crate collector (IF-SOURCES.md) must skip manifests without a package name, and the correction goes to the lead as a defect against intake-IntakeEco2 §1a.

Not run: resolution of each id against its live source beyond the minting itself, and any check of ids that the S04 generator will mint (it does not exist yet).
