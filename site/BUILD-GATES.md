# Franken Research site — build gates

Permanent pre-ship gates for `site/`. Run before every ship, from the repo root:

```bash
bun run verify                      # same as: bash site/scripts/verify-site.sh
```

The script prints `PASS`/`FAIL` per gate and exits nonzero if any gate fails.
CI (`.github/workflows/verify.yml`) runs the same command on every push and
pull request. The only external dependencies are `bash`, `python3`, `node`,
and a Chromium-family browser for gate I (see "Browser discovery" below). No
network access is used or needed: the whole site is designed to run from the
ZIP.

**Pages scanned.** The structural gates (B, C, E, F, G1, H) scan one shared
list, `SITE_PAGES` at the top of the script: the front door, the six section
pages (`method/`, `failure-modes/`, `lessons/`, `techniques/`, `reproduce/`,
`starter-kit/`), the self-assessment page `self/index.html`, the agent-stack
pages (`stack/index.html`, `rigor/index.html`, the hand-written
`beyond/index.html`), the hand-written "Since the pin" page `updates/index.html`, plus every generated `stack/<slug>.html` and every
`briefs/*.html`. A listed page that does not exist fails every gate that opens
it.

**Canon path.** Gate A compares `site/` against the canonical copies in the
same repository: `packets/*-assessment.md` and `RULEBOOK.md` at the repo root
(one level above `site/`). Set `CANON=/path` to check a detached tree; if that
directory has no `packets/` subdirectory, packets are read from its top level.

**Browser discovery.** Gate I uses `CHROME_PATH` if set, otherwise the first
of these that exists: `/opt/meta-chromium/chrome`,
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
`/Applications/Chromium.app/Contents/MacOS/Chromium`, `/usr/bin/google-chrome`,
`/usr/bin/google-chrome-stable`, `/usr/bin/chromium`,
`/usr/bin/chromium-browser`. CI sets `CHROME_PATH=/usr/bin/google-chrome`,
where the ubuntu-latest runner image installs Google Chrome. No browser found
is a FAIL, never a skip: an unrun render gate is not a pass.
Gate I waits up to 45 seconds for Chrome's DevTools port and, if Chrome
exits or never opens the port, kills it and relaunches once with a fresh
profile before failing ("chrome launch failed twice"). This is harness
robustness, not a change to what the gate asserts: a CI run once failed with
"no devtools port" because Chrome took longer than the old 15-second wait
to start on a loaded runner, and the rerun passed.

**Empty scan sets fail.** A gate that checked nothing has not passed. Gate B
fails if it finds zero `[data-stat]` slots and gate E fails if it resolves zero
relative links; both summary lines report the real count. Gate K fails on no
verdict types, no citations, no TSV rows, or a fresh generator run that
produces no pages.

## Gate A — packet/Rulebook byte integrity

**What:** every `*-assessment.md` in the canonical `packets/` directory (repo
root, see "Canon path") must exist under `site/packets/` byte-identical
(`cmp`), no extra packets may exist in `site/packets/`, and `site/RULEBOOK.md`
must be byte-identical to the canonical root `RULEBOOK.md`.
**Why:** the briefs' "every claim traceable to a source" promise and the
method page's file-and-line citations are only as good as the shipped packets.
A drifted or missing packet silently breaks the citation chain.
**Gaps:** P0-1 (citations must point at shipped packets), "every brief links
its own correct packet" (do-not-regress list).

## Gate A2 — method-page claim citations resolve

**What:** every `.claim-row` on `method/index.html` must carry a
`<span class="cr-src">packet-file.md:LINE</span>` whose line exists in
`site/packets/`, is a claim-table row (`| N | ...`), and contains the quoted
claim text from the sibling `.cr-text` (after normalizing Markdown
markers, backticks, and HTML entities).
**Why:** the adversarial regrade (Sep 2026) caught the method page inventing
claims about named repos and misattributing quotes. Citations are
machine-checked so the failure mode cannot return.
**Gaps:** P0-1.

## Gate B — statistics computed at render time

**What:** the script re-computes every aggregate from `site/assets/data.js`
(ring counts, license/rider counts, CI C1–C6 counts, TRL range excluding the
`techNA` support asset, green-repo names) and checks that:

1. every `[data-stat]` slot's no-JS fallback text equals the computed value
   (stale-fallback detector — if the data changes, the static text must too);
   zero slots found across the scanned pages is a failure;
2. `#framesentence`'s fallback equals `FRANKEN_DATA.framing` after slot
   substitution;
3. no bare hardcoded suite stat remains in visible copy: `N of 44`, `N/44`,
   ring word/numeral counts ("three pilots"), and "all 44 briefs" nav labels.

Pages that don't load the 3D bundle (`method/`, `failure-modes/`, `self/`)
include the shared filler `assets/fill-stats.js` (same semantics as the
`STATS` block in `assets/app.src.js`) after `assets/data.js`.
**Why:** hardcoded UI numbers rot. The P1-1 falsehood ("the suite's only repo
without the rider (1)" when `data.js` says 6) is exactly what happens when
prose and data diverge.
**Gaps:** P1-1; P2-lessons (CI arithmetic disclosed and reconciling).
**Accepted:** counts that come from the synthesis documents rather than
`data.js` (release-status tallies, contributor-policy counts, the CI-matrix
classification) are *not* convertible to slots. They stay as literals but must
carry an adjacent `<!-- STAT: <source> -->` annotation naming where the number
comes from, which this gate honors. The raw `.md` packets and Rulebook have no
navigation by design — byte-identical citation integrity outranks nav niceties.

## Gate C — key terms defined on first use

**What:** on every HTML page, each of NODUS, TRL, CI, rider, the pin, and bus
factor must be defined at or before its first visible use — either by a
`.vocab` definitions block positioned before first use and containing a
recognizable definitional phrase, or by an inline gloss within ~120 characters
of first use (e.g. "CI (continuous integration)", "the pin (the single
assessed commit)"). Style/script/comments are stripped before checking so
class names can't false-positive.
**Why:** P1-2 (rider never defined on the front door), P1-3 (CI never expanded),
P1-4 (brief verdict vocabulary doesn't survive sharing — briefs are the most
shareable unit), P2-navigation ("the pin" never glossed; "bus factor 1,
everywhere" undefined).
**Accepted:** the front door defines terms with inline glosses plus the open
"How to read it" legend rather than a vocab block; the gate accepts both
patterns explicitly.

## Gate D — brief↔packet pairing

**What:** each `briefs/<name>.html` links `../packets/<name>-assessment.md`
exactly once and names its packet file in the body; every packet has exactly
one brief; `data.js` repo names match the brief set 1:1.
**Why:** the 1:1 brief↔packet mapping is the site's core integrity invariant
(do-not-regress list).

## Gate E — internal link graph

**What:** every relative `href`/`src` on every scanned page resolves on disk
(directories resolve to `index.html`); every `#fragment` has a matching `id`
on the target page; no link escapes the site root. External URLs are not
fetched (offline gate). Resolving zero links is a failure.
**Why:** "zero dead links, zero dead anchors, all 311 relative links resolve
on disk (fully offline-capable)" — do not regress.
**Accepted:** external URLs are not fetched; `href="#"` placeholders owned by
JS are tolerated.

## Gate F — method-animation artifacts exist

**What:** every `../starter-kit/…` link on the method page resolves to a
shipped file, and every local asset (`assets/…`, `favicon.svg`) referenced by
any scanned page exists.
**Why:** P0-1 (stations cited files that weren't shipped), P0-2 (the runnable
kit must actually ship). The animation may reenact, but everything it points
at must be inspectable.

## Gate G — keyboard operability and fallbacks

**What:** no clickable non-focusable elements; `prefers-reduced-motion` is
handled on the JS-heavy pages; the front door keeps its `framesentence`,
stats, table-view, and `<noscript>` fallbacks; the method page's 12 claim rows
are static HTML (animation is enhancement).
**Why:** P0-3 (keyboard-inaccessible 3D selection), P1-5 (JS-only evidence
panels), P2-render (no-WebGL fallback, noscript, and reduced-motion paths
verified working — do not regress).

## Gate H — copy-quality slop scan

**What:** visible copy (no style/script/comments) is scanned per page.
**Fails** on: more than 30 non-separator em-dashes per page (list separators
like instance rows excluded), any `delve`/`tapestry`, any
`unprecedented`/`revolutionary`/`game-changing`. **Reports as non-failing
review notes** with context: `honestly`/`genuinely`/`landscape` and soft
superlatives (`best`, `most widely used`, `world-class`, …), which have
legitimate uses in this corpus (gate names like "honestly labeled",
"best-effort", "the most widely used async runtime" as domain fact).
**Why:** the program's bar is earned specificity; generated filler and
unsupported superlatives are the signature failure. The "~2 em dashes" rule
is an editorial review heuristic, not a machine threshold — briefs
legitimately use 5–9 in evidence prose, so the gate fails an order of
magnitude above that (30) to catch runaway generation without false-positiving
valid copy.

## Gate I — headless render

**What:** dependency-free Node CDP script drives the discovered browser
(`--headless=new`, unique temp profile) loading `index.html`,
`method/index.html`, `briefs/asupersync.html`, `lessons/index.html`,
`self/index.html`, `stack/index.html`, the first generated
`stack/<slug>.html` by name (all verdict pages share one template; none
existing is a FAIL), `rigor/index.html`, `beyond/index.html`, and `updates/index.html` via `file://` — the site is designed to run straight from
the ZIP, so the gate tests exactly that — at 1440×900 and 390×844. Collects
`Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, and `Log.entryAdded`;
fails on any console error, any exception, any page rendering blank (<200
chars of text), or any horizontal overflow (`scrollWidth > clientWidth`).
Only known-harmless headless software-WebGL deprecation noise is filtered,
and the filter pattern is documented in the script.
**Why:** "0 console errors, 0 blank pages, 0 overflows" (do-not-regress render
QA). Structural gates cover all pages; the render gate samples five
representative page types (3D front door, animated method page, brief,
index-style lesson page, and the self-assessment page with its matrix table).
**Accepted:** semantic truth beyond these checks still needs human review.
The self-assessment page's live CI badge is a network image, so it loads only
when the page is served over http(s); from `file://` the page shows a text
link instead and makes no network request.

## Gate J — no deleted-path references

**What:** no page or script references removed scaffolding
(`reader-template/`, `/old/`, `/drafts/`, `packets-transfer/`, `*.bak`,
lorem-ipsum filler).
**Why:** P2-navigation (internal scaffolding shipped publicly).

## Gate K — agent stack evidence

The `stack/` layer (rules in [`../stack/METHOD.md`](../stack/METHOD.md)) turns
evidence packs into adopt/wrap/build/watch verdicts. Its pages are generated:
`node site/scripts/make-stack.mjs` reads `stack/<slug>.md` (every file except
`METHOD.md`), `stack/rigor-practices.tsv`, and the verdict legend in
`METHOD.md`, and writes `site/stack/index.html`, `site/stack/<slug>.html`, and
`site/rigor/index.html`. Output is deterministic (sorted inputs, no
timestamps). A verdict file that does not exist is not rendered, and a page
whose source is gone is deleted. The generator also reads `stack/licenses.tsv`
to put a license chip after each adopted `owner/repo` and a "License checked on
<date>" line under "Adopt, do not rebuild". Gate K has five sub-gates, each reported on
its own line; the checker for K1 to K3 is independent Python, not the
generator's parser.

- **K1 verdict files complete and independently reviewed.** One
  `stack/<slug>.md` per `ecosystem/pickup/pickup-<slug>.md` (a missing file
  fails; a verdict file with no matching type fails). Front matter has every
  key: `type` (equal to the slug), `title`, `group` (one of the six),
  `verdict` (Adopt, Adopt and wrap, Build clean-room, Watch), `confidence`
  (High, Medium, Low), `evidence_date`, `author`, `reviewed_by` (different
  from `author`), `review_date` (dates as YYYY-MM-DD). All seven `##` sections
  are present, "What we cannot say" is not empty, and the Bottom line starts
  with `Inference`. A Build clean-room verdict needs `rejected_alternative`
  with a citation.
- **K2 quoted citations resolve.** Any token `<path with extension>:<N>` or
  `:<N>-<M>`, optionally followed by `"<quote>"`, is a citation. The file
  must exist in the repo, the lines must exist, and the first and last cited
  lines must be non-empty. A quote must be at least 20 characters and appear
  on the cited line (a range is joined with spaces); `*`, backticks, and runs
  of whitespace are ignored on both sides. Every citation in the Adopt, Copy,
  Build, FrankenSuite, and What-we-cannot-say sections and in
  `rejected_alternative` must carry a quote. Every bullet in the first four of
  those sections needs at least one citation and one of the Rulebook's five
  tier tags; a bracket token that looks like a tier but is not one of the five
  (for example `[T1]`, `[Code-verified]`) fails. Each file must cite at least
  one line inside its evidence pack's `## Notes / caveats` section when the
  pack has one.
- **K3 rigor practices sources and proofs.** `stack/rigor-practices.tsv` has
  the exact header from `METHOD.md`, ten columns per row, ids `RP-001`
  onward in order, a `source` of one `path:line` whose line contains
  `source_quote` (same matching as K2), `areas` drawn from the 21 slugs plus
  `frankensuite`, `checklist` ids that exist as `### <id> ` headings in
  `starter-kit/CHECKLIST.md` (or `none`), and `our_status` in adopted,
  partial, candidate, not-applicable. An `adopted` or `partial` row's
  `our_proof` is split on `;`. A token may start with a label such as
  `done:`; tokens labelled `missing:`, `todo:`, `gap:` or `not yet:` name what
  is absent and are skipped. In every other token, each path reference (it
  has a `/` or a known file extension, with an optional `:line`) must exist
  in the repo (a directory counts), and each `commit <sha>`, or a token that
  is only a sha, must pass `git cat-file -e`. URLs are not path references.
  At least one reference must resolve and none may fail.
- **K4 generated pages match their sources.** The generator runs into a temp
  directory and `diff -rq` compares it with `site/stack/` and `site/rigor/`.
  Any difference, extra file, or missing file fails, so a hand edit to a
  generated page or a source edit without a rebuild cannot ship. Fix: rerun
  `node site/scripts/make-stack.mjs`.
- **K5 adopted incumbents have a checked license, named when not
  permissive** (METHOD rule 9). `stack/licenses.tsv` has the exact header
  `repo spdx license_class checked command note` (tab-separated), six
  columns per row, `repo` shaped `owner/repo` and not duplicated
  (case-insensitive), `license_class` one of the eight classes, `checked` a
  YYYY-MM-DD date. Every `owner/repo` inside `**bold**` in an "Adopt, do not
  rebuild" bullet needs a row. When the class is not `permissive`, that
  bullet's own prose must name the license. Quoted citations and the adopted
  repo names are removed first, so neither an evidence quote nor the repo's
  own name counts. Matching ignores case and needs whole words. Accepted names:
  each component of the SPDX expression (split on AND, OR, WITH) except
  permissive ids such as MIT, Apache-2.0 and BSD-3-Clause, because "MIT" says
  nothing about an AGPL-3.0 part; that component's family (`AGPL` for
  `AGPL-3.0`, `Elastic` for `Elastic-2.0`) and fixed aliases (BUSL: BSL,
  Business Source; SSPL: Server Side Public License; AGPL: Affero; LGPL: Lesser
  General Public; MPL: Mozilla Public); for a `LicenseRef-<Name>-...`
  component, `<Name>` followed within a few words by "license" (for example
  "Llama 3.2 Community License", "Weaviate license"); a class phrase
  (source-available: "source-available"; permissive-with-conditions:
  "condition(s)"; none: "no license", "unlicensed", "without a license";
  unknown: "license unknown", "unknown license", "license unclear"); and any
  license name from a fixed list that the row's `note` uses (SSPL, ELv2, AGPL,
  GPL, Community License, Enterprise License, commercial license, proprietary,
  LTX-2, and others listed in the script). A missing TSV, no rows, or no
  adopted `owner/repo` anywhere fails.

**Why:** a verdict layer that recommends software to strangers is only worth
the evidence under it. K5 keeps "adopt X" from hiding a license that
blocks the builder's product. K1 enforces the independence rule (author never
reviews), K2 makes every quoted fact checkable against the line it cites, K3
holds the practices index to the same standard, and K4 stops the site from
drifting away from the files the gates check.
**Accepted:** K2 proves a quote sits on the cited line, not that it supports
the bullet; that is the reviewer's job under METHOD.md's independence rule.
Quotes are delimited by ASCII double quotes, so a quote cannot itself contain
one.
**Proven to trip:** each sub-check was run once against a planted known-bad
copy of the tree (see History).

## Gate L — no personal email addresses

**What:** every git-tracked text file in the repository (`git ls-files`,
binary files skipped by a NUL byte in the first 8 KB) is scanned for
`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`. Allowed: `noreply@*`,
`*@users.noreply.github.com`, and `you@example.com`, the starter kit's
documented placeholder in its `git config --global user.email` instructions
(`starter-kit/README.md:36`, `starter-kit/scripts/init.sh:53`, and their
`site/starter-kit/` copies). Any other address fails with `file:line`. A
failed `git ls-files` or zero scanned files fails.
**Why:** commit-author email addresses leaked into published files twice:
first in the original assessment packets, then in a movement census of the
44 repos, which printed a maintainer's address nine times, a third-party
contributor's personal address, and an agent persona's address before it was
redacted. Git history makes these easy to copy by accident, so the check has
to be mechanical.
**Accepted:** only tracked files are scanned, so a leak in an untracked
working-copy file is caught when it is added, not before.

## Gate W — daily-watch selftest

**What:** runs `node watch/watch.mjs --selftest`, which loads the recorded
GitHub API responses in `watch/fixtures/` (`day1.json`, recorded 2026-09-24
for six assessed repositories and part of the public listing; `day2.json`, a
synthetic next day whose `_note` lists each edit) and passes them through the
same collect, diff, and dedupe functions the scheduled watch runs against the
live API. No network and no token. The 14 cases assert: the packets parse to
exactly 44 repositories with 40-hex pins; a first run is a baseline with
nothing material; a new release is material and its tag is not reported
twice; a LICENSE blob change with the same SPDX id is material; a workflow
removal is material; a commits-only change is not; a rename is followed by
the recorded GitHub id and reported as a rename, not a deletion plus a new
repository (for an assessed and for an unassessed repository), and is also
followed by the REST redirect when no id is recorded yet; a compare 404 is
`pin_unreachable`; a new `franken*` or Rust repository is a candidate and
anything else informational; nothing else is material; dedupe returns
`exists` for a filed title with the same value, `comment` for a changed
value, and `create` for a new title; the since-pin backfill on `day1.json`
files exactly the expected titles (in the same title format as the daily
diff) through the real issue-sync code against an in-memory issue store,
adds one pointer comment to the issue whose release a dated re-check in
`updates/` already names, and a second backfill finds only existing issues
(no new issue, comment, or pointer); and the state and census are byte-equal
when the API returns nodes in another order. **Fails** on a nonzero exit, any
failed case, or a `CASES` count of zero or missing.
**Why:** the watch opens public issues and commits a census every day with
nobody reading its code first. Its classification logic (material or not,
rename or delete, new or already filed) is what a silent regression would
break, and the live API never replays the same change twice, so the check
has to run on recorded inputs.
**Accepted:** the fixtures cover the shapes the watch reads, not every shape
the API can return; the transport itself (HTTP, pagination, rate limits) is
exercised only by live runs.

## Accepted limitations (all gates)

- Raw packet/Rulebook `.md` files have no navigation by design.
- External URLs are not fetched by the offline link gate.
- The slop/superlative scan is heuristic and conservative by design.
- Rendering samples representative pages; structural gates cover the full tree.
- Numbers sourced from the synthesis documents (not `data.js`) stay literal
  with `<!-- STAT: -->` provenance annotations.

## History

Built 2026-09-23 after the 34-gap cold review. Site fixes applied to reach the
first full PASS: hardcoded suite counts on `method/` and `failure-modes/`
converted to `[data-stat]` slots filled at render time by the new shared
`assets/fill-stats.js`; first-use definition glosses added (44 briefs gained a
glossary strip; `lessons/`, `techniques/`, `failure-modes/` gained pin/bus-factor
definitions; the front door gained inline pin/bus-factor glosses;
`starter-kit/` gained a CI definition); hardcoded "all 44 briefs" labels
reworded; synthesis-sourced counts annotated with provenance.

2026-09-23, commit `9a99982`: the gates moved in-repo. Gate A reads the
canonical packets and Rulebook from the repo root instead of an external
workspace path (`CANON` still overrides), and gate I discovers the browser via
`CHROME_PATH` or a fixed list of install locations, failing when none exists,
so neither A nor I can be silently unrun.

Public-repo pass (v1.0.0): the page list became one shared `SITE_PAGES`
variable and gained `self/index.html` (the self-assessment page), which also
joined the gate I render set; gate F's asset check widened from the front
door, method page, and briefs to every scanned page. The B and E summary lines
had printed blank counts on macOS (`grep -P` is GNU-only); counts are now
extracted portably, and an empty scan set fails both gates. Each new fail path
was shown to trip on a planted known-bad copy of the tree before landing.

Agent-stack pass (v1.1): Gate K added with the `stack/` layer, and
`SITE_PAGES` gained `stack/index.html`, `rigor/index.html`,
`beyond/index.html`, and every generated `stack/<slug>.html`, so B, C, E, F,
G1, and H cover them; gate I renders the stack index, one verdict page, the
rigor index, and the beyond page. Every K sub-check was shown to trip on a
planted known-bad copy of the tree (rsync to a scratch directory, never the
real tree). K1: `reviewed_by` set equal to `author`, a Bottom line starting
"We think", a Build clean-room verdict with no `rejected_alternative`, and a
deleted verdict file each produced their own K1 line. K2: a quote prefixed
with extra words ("quote not on the cited line"), a line number of 99999
("line out of range"), a bullet with no citation, a `[T1]` tier ("non-Rulebook
tier token" and "bullet without a Rulebook tier"), and an evidence pack whose
caveats section was moved to a new heading at its end ("no citation into ...
caveats section"). K3: a `source_quote` not on its line, checklist id `Z99`,
an adopted row whose proof names a missing file and an unknown commit, an
out-of-sequence id with an unknown area, and `our_status` `maybe`. K4: a
one-word hand edit to `site/stack/index.html` ("Files ... differ").

Method v3 pass: Gate K5 (licenses of adopted incumbents), `partial` status in
K3, Gate L (no personal email addresses), and the Updates page
(`updates/index.html`) joined `SITE_PAGES` and the gate I render set. Planted
runs on scratch copies: K5 failed on a deleted licenses row, an SSPL-1.0 row
whose bullet did not name it, a conditions row not named, a class outside the
eight, a `checked` value of "yesterday", a duplicate row, and a
`MIT AND AGPL-3.0` row whose bullet named only MIT. A control row
(`BSD-3-Clause AND LicenseRef-Acme`, bullet saying "Acme license") passed, as
did an AGPL-3.0 row whose bullet named AGPL-3.0. K3 failed on a partial row
with only a `missing:` token, a partial row whose `done:` path does not exist,
an adopted row whose only reference was an unknown commit (its URL is skipped,
not resolved), and status `partly`; a partial row with a resolving `done:`
path and a `missing:` note passed. L failed on a personal address appended to
a tracked synthesis file, reporting `file:line`.

v1.1.0 QA pass: generated pages link GitHub at the release tag
(`v<package.json version>`, now `v1.1.0`) instead of `main`, so a citation
keeps landing on the quoted line after later pushes; the generator refuses to
run without a semver `version`. K4 regenerates with the same ref. The
`/stack/` page gained a computed verdict split and headline and an
empty-filter message, and verdict pages link their batch's review record.
Gate I's launch retry was shown both ways on scratch copies: with
`CHROME_PATH=/usr/bin/false` it failed with "chrome launch failed twice", and
with a wrapper that exits on its first call and starts Chrome on its second it
passed.

Daily-watch pass: Gate W added with `watch/`. Each classification the gate
asserts was shown to be load-bearing by mutating a scratch copy of
`watch.mjs` (never the real tree): comparing licenses by SPDX id only failed
the LICENSE case, ignoring workflow removals failed the workflow case,
treating a compare 404 as reachable failed the pin case, counting commits as
material failed the commits-only case, resolving names without the recorded
id failed the rename case, and ignoring the issue-body value marker failed
the dedupe case. A planted wrong expectation (a new release expected under
tag `v0.1.2`) made gate W fail with its case named, and `bun run verify` exit 1
(17 passed, 1 failed). A stub selftest that printed `CASES 0` and exited 0
also failed W.
The scheduled workflow checks out full history rather than depth 1 because a
depth-1 clone fails K3: the rigor index cites commits that `git cat-file`
cannot resolve without history (16 rows failed on a scratch depth-1 clone).

Since-pin backfill (`--backfill-since-pin`): the 14th case was shown to fail
on three scratch-copy mutants: ignoring the re-check marker (the second
backfill posted a second pointer), giving the backfill release a title that
differs from the daily one, and treating a filed issue as new (the second
backfill commented on both issues instead of finding them).
