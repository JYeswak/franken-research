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
`beyond/index.html`), the hand-written "Since the pin" page `updates/index.html`, the hand-written "Follow the suite" page `follow/index.html`, plus every generated `stack/<slug>.html` and every
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
fetched (offline gate). Resolving zero links is a failure. A fragment
`repo=<name>` on `index.html` is a map route, not an element id: the map
opens the repository of that name, and gate D makes the `data.js` names
equal the brief names, so the route passes only when `briefs/<name>.html`
exists. The only query a local link may carry is the asset stamp
`assets/<file>?v=<10 hex>` (gate S checks its value); the link resolves
without it, and any other query on a local link fails.
**Why:** "zero dead links, zero dead anchors, all 311 relative links resolve
on disk (fully offline-capable)" — do not regress.
**Accepted:** external URLs are not fetched; `href="#"` placeholders owned by
JS are tolerated.

## Gate F — method-animation artifacts exist

**What:** every `../starter-kit/…` link on the method page resolves to a
shipped file, and every local asset (`assets/…`, `favicon.svg`) referenced by
any scanned page exists. A trailing `?v=<10 hex>` stamp is removed before
the file is looked up; any other suffix is kept, so it fails as a missing file.
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
existing is a FAIL), `rigor/index.html`, `beyond/index.html`, `updates/index.html`, and `follow/index.html` via `file://` — the site is designed to run straight from
the ZIP, so the gate tests exactly that — at 1440×900 and 390×844. Collects
`Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, and `Log.entryAdded`;
fails on any console error, any exception, any page rendering blank (<200
chars of text), or any horizontal overflow (`scrollWidth > clientWidth`).
It also fails when a page loads no stamped asset, when a stylesheet from
`assets/` did not load (its rules cannot be read: a stylesheet that failed to
load from `file://` still has a sheet object, but reading its rules throws),
or when a page loads `assets/data.js` and `window.FRANKEN_DATA` is undefined:
the `?v=` stamps must not stop assets loading from `file://`.
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
same collect and diff functions the scheduled watch runs against the
live API. No network and no token. The cases assert: the packets parse to
exactly 44 repositories with 40-hex pins; a first run is a baseline with
nothing material; a new release is material and its tag is not reported
twice; a LICENSE blob change with the same SPDX id is material; a workflow
removal is material; a commits-only change is not; a rename is followed by
the recorded GitHub id and reported as a rename, not a deletion plus a new
repository (for an assessed and for an unassessed repository), and is also
followed by the REST redirect when no id is recorded yet; a compare 404 is
`pin_unreachable`; a new `franken*` or Rust repository is a candidate and
anything else informational; nothing else is material; and the state and census are byte-equal
when the API returns nodes in another order. The cases that exercised the
per-event issue sync (dedupe, issue trust, the since-pin backfill) were removed
on 2026-09-25 with that path (freshness contract FR-D.4); 18 cases run since.
**Fails** on a nonzero exit, any
failed case, or a `CASES` count of zero or missing.
**Why:** the watch opens public issues and commits a census every day with
nobody reading its code first. Its classification logic (material or not,
rename or delete, new or already filed) is what a silent regression would
break, and the live API never replays the same change twice, so the check
has to run on recorded inputs.
**Accepted:** the fixtures cover the shapes the watch reads, not every shape
the API can return; the transport itself (HTTP, pagination, rate limits) is
exercised only by live runs.

## Gate W2 — discovery selftest

**What:** runs `node watch/discover.mjs --selftest`, which serves the recorded
GitHub responses in `watch/fixtures/discover-2026-W39.json` (one search page
and the contents, commits, and readme responses of 12 repositories, recorded
by a live dry run on 2026-09-24 and trimmed as its `_note` says; one fork is
synthetic) and `discover-prior-2026-W38.json` (an earlier week's listing)
through the same transport, exclusion, scoring, and rollup-issue code the
weekly sweep (`.github/workflows/discover.yml`) runs against GitHub. Issues
are an in-memory store behind the same transport. No network and no token.
The 12 cases assert: the ISO week and the search window come from the run
date (including the week-53 and week-1 year boundaries); the candidates come
out in the hand-derived order with the expected signals and scores (signal
count first, stars only within a count); the Dicklesworthstone repository
and the fork are excluded before checking; a repository with no signal is
left out; a repository named by a `[candidate]` issue and one listed in an
earlier week are excluded, while one named by a non-candidate issue stays;
the rollup is one issue per week (created once, `exists` on a rerun and when
only star counts moved, the same issue edited when the listing changed, a
closed rollup left alone); a same-title issue opened by anyone but the bot
identity is ignored and never edited, even when it copies our labels and
markers, and the bot opens its own issue instead; a bot issue missing either
label or this week's markers is not trusted either; a repository name
carrying `|`, a backslash, a newline, or formatting characters renders as
exactly one table cell with an intact link; the output and the issue body hold no email
address and no author, committer, name, login, or message field; the output
is byte-identical when the API returns results in reverse order, also with
the check cap below the pool size; and a 403 ends the run with exit 3 and
writes nothing. **Fails** on a nonzero exit, any failed case, or a `CASES`
count of zero or missing.
**Why:** the sweep opens and edits a public issue every week with nobody
reading its code first, issue titles are public and predictable, and search
results never replay, so exclusions, ordering, dedupe, and which issue the
bot may edit can only be checked on recorded inputs.
**Accepted:** the fixture covers the shapes the sweep reads from 12
repositories, not every shape the API returns; rate-limit timing and
pagination past one page run only live.

## Gate W3 — freshness conformance harness

**What:** four offline commands, all of which must pass.
`node watch/freshness/harness/run.mjs --check-report` runs every case in
`watch/freshness/cases/*.cases.mjs` against the clauses it parses from
`watch/freshness/SPEC.md` (the freshness contract: class triggers, the live
card, the dashboard issue, the weekly digest, scheduled jobs, and the harness
itself), then compares `watch/freshness/REPORT.md` with a fresh render. One
of those cases, HAR-H6-mutants, runs the mutation runner
(`watch/freshness/harness/mutate.mjs`): it plants every mutant in
`watch/freshness/harness/mutants.json` in temporary copies of the repository
and checks that each one makes its named cases fail; the gate reads that
case's verdict and counts instead of running the mutants twice.
`node ops/schedule.mjs` checks `ops/schedule.tsv`: each generated artifact's
command runs in its workflow, its gate exists in this script, and every script
under `watch/freshness/` (and `site/scripts/make-live.mjs`) that writes files
declares them. `node ops/write-job.mjs` parses `.github/workflows/watch.yml`
and checks the two-job split (FR-O.6, FR-D.5): both jobs run only on
`refs/heads/main`, neither checkout persists credentials, and every action is
pinned to a full 40-hex commit SHA; the workflow sets no `env` or `defaults`;
`build` holds no permission value but `read` or `none` (or `read-all`),
whatever the scope, names no secret but `GITHUB_TOKEN`, runs the gate chain
before it uploads, and uploads exactly the generated paths
`ops/take-build-output.mjs` accepts; `publish` alone may write, needs `build`,
sets no job `env`, `defaults`, `container`, `services` or step `shell`, uses
only checkout, setup-node and download-artifact, downloads outside the
checkout, installs, builds and gates nothing, calls node only as
`node <script> [args]` for `ops/take-build-output.mjs`,
`ops/briefs-guard.mjs` or `watch/freshness/dashboard.mjs`, names no loader
variable (`NODE_OPTIONS`, `NODE_PATH`, `LD_*`, `DYLD_*`, `BUN_*`),
`$GITHUB_ENV`, `$GITHUB_PATH` or `${{ }}` expression in run text, sets no env
variable but `GITHUB_TOKEN` and that only on the push and the sync, and
applies, guards, pushes and syncs in that order with no push after the sync;
every `publish` run body equals, byte for byte after trailing newlines, the
reviewed text for its step name in `PUBLISH_RUNS` in `ops/write-job.mjs`, and
no publish step runs text under any other name;
and those three scripts, with everything they import, use only Node built-ins
and repository files. `ops/take-build-output.mjs` also refuses, before
writing anything, a destination whose path in the checkout holds a symlink or
which exists and is not a regular file.
`node site/scripts/make-live.mjs --check` re-renders the
live:card region on every brief from `watch/live.json`. No network and no
token. **Fails** on a nonzero exit of any of the four, any failed case, an
uncovered MUST clause, a `CASES` count of zero or missing, a stale
`REPORT.md`, a missing HAR-H6-mutants result, zero mutants or one that
survives, a schedule problem, a write-job problem, and a missing `make-live.mjs`. The runbook,
including how to add a clause, a discrepancy, a golden or a mutant, is
`watch/freshness/README.md`.
**Limits:** `ops/write-job.mjs` enforces a closed list of structural rules,
each added after a review found a way around the one before (reviews 3 to
3d). It proves the workflow has the shape FR-O.6 describes; it does not prove
that no other way for a token to move exists. The control is the job
boundary: the job that runs dependency code holds a read-only token, and the
job that holds the write token runs only three dependency-free scripts. A new
kind of workflow change, such as a new action, a new step in `publish` or a
new way to pass data between jobs, needs a new rule and a planted case that
shows the rule fails without it. The `publish` run bodies are pinned exactly
(review 3e), so any change to a `publish` step, even an extra `echo`, fails W3
until `PUBLISH_RUNS` in `ops/write-job.mjs` is changed in the same commit;
that commit is where the change gets its review.
**Why:** the freshness work replaces per-event issues with computed classes,
a card on every brief, and one dashboard issue, all written by a scheduled
job nobody reads first. The contract says what must hold; this gate proves
each MUST clause has a case that passes or a documented discrepancy, that the
cases can fail (the mutants), and that every new generated file is refreshed
by a scheduled job.
**Accepted:** `watch/live.json` and `watch/crossings.jsonl` come from API
facts that are not committed, so W3 checks their committed shape and ledger
order and proves the byte-equal render on a recorded fixture, not by re-running
the watch. Timing on 2026-09-25: on an Apple M3 Ultra under load, with 8 mutation
workers, the harness took 40.1 s (268 cases, 65 of 65 mutants killed). On a GitHub
`ubuntu-latest` runner (verify run 36087416333, branch `ci-probe/freshness-w3`) it
took 13.8 s (269 cases, 66 of 66 mutants). The whole gate chain took 99 s there,
against 76 s for the last `main` run without W3. That leaves the 4-minute verify
and 8-minute deploy timeouts unchanged. The watch, split into two jobs after
review 3c, has 6 minutes for `build` (the gate chain plus about 30 s of watch)
and 3 for `publish` (a checkout, a download, a commit, a push and a sync).

## Gate M — feed and OPML fresh and well-formed

**What:** `site/feed.xml` (Atom 1.0) and `site/follow/franken-suite.opml`
are generated by `site/scripts/make-feed.mjs` and committed. The gate runs
the generator into a temp directory and fails if either committed file is
missing or differs byte for byte from the fresh run. **The fix for a stale
file is `bun run build:feed`** (same as `node site/scripts/make-feed.mjs`),
then commit `site/feed.xml` and `site/follow/franken-suite.opml` with the
change that made them stale. It then runs `make-feed.mjs --check` on the
committed files: a strict XML 1.0 well-formedness parse written for this
script (Node has no XML parser; it rejects mismatched or unclosed tags, bare
`&`, undefined entities, unquoted or duplicate attributes, DTDs, illegal
characters, and a second root), then the Atom structure (root `<feed>` in the
Atom namespace, feed id `tag:fr.zeststream.ai,2026:feed`, a `rel="self"` link
to `https://fr.zeststream.ai/feed.xml`, an author, RFC 3339 dates, 1 to 50
entries, each with one unique id, a title, an `updated` date, and an alternate
link, newest first, and a feed `updated` equal to the newest entry's) and the
OPML structure (version 2.0, a title, our own feed listed, at least one
`xmlUrl`). Every `href`, `uri`, `icon`, `xmlUrl`, and `htmlUrl` must be an
absolute `https://` URL. When `xmllint` is installed (it ships with macOS;
on Ubuntu it is `libxml2-utils`), `xmllint --noout` must also accept both
files; the PASS line names which parsers ran. Zero entries or zero OPML feeds
fail.
**Sources:** the feed has one entry per `## vX.Y.Z (YYYY-MM-DD)` section of
`CHANGELOG.md`, one per dated re-check `updates/<repo>-YYYY-MM-DD.md`, and at
most one census entry per day from `watch/census/YYYY-MM-DD.tsv` or
`updates/movement-YYYY-MM-DD.tsv` (the watch census wins when both exist),
counted with the watch report's "moved since the pin" definition. The OPML
lists each repository parsed from `packets/*-assessment.md` by the watch's
`parsePackets`, twice (`releases.atom` and `tags.atom`), plus our feed.
Dates are the source dates, never the build time, so a rerun on unchanged
sources is byte-identical. Anything that adds one of these sources (the
daily watch's census commit included) must rebuild the feed in the same
commit.
**Why:** a feed that lags the repository tells subscribers nothing changed
when something did, and a malformed one is silently dropped by readers.
**Accepted:** the parser checks well-formedness, not the full Atom RFC; no
feed validator service is called (offline gate).

## Gate S — shared shell (head links, site nav, footer)

**What:** `site/scripts/shell.mjs` owns four marked regions on pages in
`site/` except `404.html` and the evidence copies (`packets/`, `synthesis/`):
`<!-- shell:head -->` (the `assets/shell.css` link and the Atom feed link) on
every page, `<!-- shell:nav -->` and `<!-- shell:footer -->` on every
page except the home page, and `<!-- shell:dir -->` (the page directory inside
the "More pages" disclosure) on the home page only. The gate runs `shell.mjs --check`, which fails,
naming the page and region, when a region is missing, repeated, present where
it does not belong, or different from a fresh render. It also fails when the
canonical page list in `shell.mjs` and the section URLs in `sitemap.xml`
(those ending in `/`) disagree, when a page file is missing from
`sitemap.xml` or a sitemap URL has no page file, when a field id the footer
prefills (`repository`, `page`) is missing from its form in
`.github/ISSUE_TEMPLATE/`, and when a brief is not an option of the
correction form's repository dropdown. Zero pages found is a failure.
**Asset stamps.** Every `<script src>` and `<link rel="stylesheet" href>` on
these pages that loads a file from `assets/` must end in `?v=` and the first
10 hex digits of that file's sha256, for example
`../assets/shell.css?v=0323daf6e7`. The gate fails, naming the page and the
reference, when a stamp is missing or stale, when a loaded asset does not
exist, and when no page loads anything from `assets/`. Links that cite an
asset without loading it (`<a href="../assets/data.js">` on the rigor page)
are left alone. **Anyone who edits a file in `site/assets/` must run
`bun run build:shell`** and commit the restamped pages; `bun run build:map`
does it after rebuilding the bundle.
**The fix for drift is `bun run build:shell`** (same as
`node site/scripts/shell.mjs`), which rewrites every region and stamp and then
runs the check. `make-stack.mjs` fills the same regions in the pages it
generates, so gate K4 and gate S agree. The home page is a full-screen map
with its own layout: it carries only the head and dir regions.
**Why:** the v1.2 audits found three nav systems, six labels for the home
page, no directory in any footer, no way to suggest a fix from a page, and no
statement of who made the project. One renderer and a gate keep one label per
page everywhere. The stamps exist because `_headers` sets `max-age=0` on
`/assets/*` and the deployment's `pages.dev` URL honours it, but the
`zeststream.ai` zone's browser cache TTL raised it to `max-age=14400` on
fr.zeststream.ai (observed 2026-09-24), so a returning visitor could get new
HTML with a stylesheet or script up to four hours old. A changed file now has
a new URL.
**Accepted:** the gate compares markup, not rendering; gate I and a
screenshot pass cover what the shell looks like. `404.html` has no shell: the
host serves it at any depth, so relative links would point at the wrong
folder.

## Gate V — verdict strip on every brief

**What:** `site/scripts/brief-strip.mjs` owns two marked regions on every
`briefs/*.html`: `<!-- brief:style -->` in `<head>` (the strip's CSS, the
page's ring colour, the ring widget's colours, 44px touch targets on coarse
pointers) and `<!-- brief:strip -->` in the hero, directly under the title.
The strip shows the ring, TRL, CI class and license class from
`assets/data.js`, the brief's own bottom line ("Use it? ... Learn from it?
...", cut to its first clause from the two verdict cards) with a Why link to
the section that holds those cards, a "Spot an error? Correct this brief" link
to the same prefilled correction form the footer links (the URL is taken from
`shell.mjs` `renderFooter`, so the two cannot drift), and one sentence saying what FrankenSuite
is, with links to the repo on the map and to the verdict table. Ring colours,
the CI-green colour and the CI class words are read from `assets/app.src.js`,
so a colour means the same ring on the map, on a brief, and on its share card
(`make-og.mjs` imports the same palette). The gate runs
`brief-strip.mjs --check`, which fails, naming the brief, when a region is
missing, repeated, or different from a fresh render; when the strip's correction
link is not `issues/new?template=correction.yml` or its `repository` or `page`
parameter names a different brief; when the strip's ring or
TRL, the ring widget's active pill, or the TRL gauge caption disagrees with
`data.js`; when the ring widget's pills are not in the order its colours are
keyed to; when a "What would change the verdict" list has fewer than two items
or carries an "Until then" sentence as an item; and when a `data.js` row has
no brief. Zero briefs found is a failure.
**The fix for drift is `node site/scripts/brief-strip.mjs`**, which rewrites
both regions and then runs the check. On a brief with no regions yet it puts
the style after the template's `</style>` and the strip in place of
`p.hero__dek`.
**Why:** the v1.2 audits found every brief first stated its verdict about
5,700px down, never said what FrankenSuite is to a visitor from a shared
link, highlighted the Explore ring in the orange the map uses for Pilot, and
rendered the "what would change the verdict" list of 27 briefs as one comma
list with the "Until then" sentence as a second item.
**Accepted:** the gate compares markup, not rendering; gate I and a screenshot
pass cover what the strip looks like. The share cards are not gated: a
Chromium PNG is not byte-stable across versions, so `make-og.mjs` is rerun by
hand when the data or the palette changes.

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

Feed pass: Gate M added with `site/feed.xml`, `site/follow/`, and
`bun run build:feed`; `follow/index.html` joined `SITE_PAGES` and the gate I
render set. The gate M block, copied verbatim out of `verify-site.sh`, was
run against scratch copies of the tree (never the real tree): the unchanged
copy passed with 4 entries and 89 OPML feeds, with and without `xmllint` on
`PATH`. It failed with "differs from a fresh run" after adding a census day
and after adding a dated re-check without rebuilding; on `</entry>` changed
to `</entri>` (the Node parser and `xmllint` each named line 18); and, with
`xmllint` hidden, on a bare `&` in the feed title (Node parser, line 3).
`--check` alone failed on an `http://` entry link, on a feed with every entry
removed (which `xmllint` accepts as well-formed), and on an OPML `xmlUrl`
without a scheme.

Discovery pass: Gate W2 added with `watch/discover.mjs`. Twelve of thirteen
scratch-copy mutants of `discover.mjs` (never the real tree) failed the
selftest with the case named: dropping the owner exclusion, the fork
exclusion, the zero-signal filter, the known-candidate check, or the
`candidate` label filter; ignoring the issue's value marker; putting star
counts in that value; editing a closed rollup; letting stars outweigh a
signal; not sorting the pool before the check cap; storing trailer text in
the output; and writing a file before the API calls finish. The thirteenth
(allowing 403 on the readme call) is equivalent: the transport stops on 403
before the allow list is read. In a clean clone, a planted wrong expectation
(the first two expected ranks swapped in the fixture) made W2 fail with the
ordering case named and `bun run verify` exit 1 (19 passed, 1 failed); the
real fixture passed all 20 gates.

Issue-trust pass (after the cross-lineage security review): the rollup is
matched by exact title only when the token's own identity opened it
(`github-actions[bot]` under Actions, else `GET /user`), it carries both
labels, and its body has this week's markers; any other same-title issue is
ignored and left untouched. Table cells from the API are escaped and repo
links are percent-encoded. Three cases were added (12 in all), and nine
more scratch-copy mutants each failed with the case named: not checking the
author, the labels, or the week marker; matching on title alone; taking
`github-actions[bot]` as the identity outside Actions; not escaping `|`;
not escaping the repository name at all; keeping newlines; and leaving
parentheses unencoded in the link URL.

Shell pass (v1.2): Gate S added with `site/scripts/shell.mjs`,
`site/assets/shell.css`, and `bun run build:shell`. The first run replaced the
site nav on 77 pages (hand-written pages and briefs by `shell.mjs`, generated
stack pages by `make-stack.mjs`) and added the footer and head regions. Gate E
learned the `index.html#repo=<name>` map route that the briefs' back link
uses. The gate S block, copied verbatim out of `verify-site.sh`, was run
against scratch copies of the tree (never the real tree): the unchanged copy
passed with 78 pages and 232 regions. It failed, naming the page and region,
on a one-word edit to the method page's footer, on the head region deleted
from `lessons/index.html`, on the correction link of `briefs/frankenredis.html`
pointed at another repository, and on a duplicated nav region in
`updates/index.html`; it failed on `/follow/` removed from `sitemap.xml` (both
directions reported) and on `frankenredis` removed from the correction form's
dropdown. The gate E block failed on a brief whose back link named a
repository with no brief. A second run of `bun run build:shell` rewrote
nothing.

Verdict-strip pass (v1.2): Gate V added with `site/scripts/brief-strip.mjs`.
The first run placed the style region in all 44 briefs and replaced each
`p.hero__dek` with the strip; a second run rewrote nothing. The 27 collapsed
"What would change the verdict" lists were re-marked by a one-time script that
refused to write unless each list kept its words (punctuation aside) and inline
tags: one item per condition, the closing sentence as a paragraph after the
list, and `franken_markdown_website`'s lead-in as a paragraph before it.
`make-og.mjs` now colours each card with the map's ring palette, adds the
brief's bottom line, and renders three page cards (`og-image.png`,
`og/starter-kit.png`, `og/self.png`). The gate V block, copied verbatim out of
`verify-site.sh`, was run against scratch copies of the tree (never the real
tree) on 2026-09-24: the unchanged copy passed with 44 briefs. It failed,
naming the brief, on frankenredis's ring set to Pilot in `data.js` (both
regions differ; the strip and the ring widget disagree with `data.js`), on a
hand-edited `data-ring` in frankensqlite's strip, on frankensqlite's TRL set to
7 in `data.js` (the strip and the TRL gauge), on the strip region deleted from
frankenfs, on frankenscipy's list collapsed back to one item, on frankenredis's
"Until then" sentence moved back into its list, on the Explore colour changed
in `app.src.js` (every brief's style region differs, since each carries all
four pill colours), on frankensqlite's ring widget marking Pilot, on its TRL
gauge saying 7, and on an empty briefs directory. In a clean clone of `eadcf57`
with this pass applied, all 22 gates passed, V among them with 44 briefs.

Correction link (v1.2 re-audit item 9): the strip gained "Spot an error?
Correct this brief", whose URL `brief-strip.mjs` takes from `shell.mjs`
`renderFooter`, so it is byte-identical to the footer's correction link. Gate V
now parses that link. On scratch copies it failed with the repository named
when frankenredis's link said `repository=frankensqlite`, with the page named
when its `page` pointed at frankenfs, and with "no correction link" when the
link was deleted from frankenfs. The ten earlier planted faults still failed,
and the unchanged copy passed.

Asset stamps (v1.2 re-audit): fr.zeststream.ai served `/assets/*` with
`max-age=14400` although `_headers` says `max-age=0`, and the re-audit saw the
new phone menu rendered with the old `shell.css`. `shell.mjs` now stamps every
script and stylesheet a shell page loads from `assets/` with `?v=` and the
first 10 hex digits of the file's sha256 (92 references on 78 pages at the
time); gate S checks the stamps, gates E and F resolve the file without the
stamp, gate E rejects any other query on a local link, and gate I asserts
stamped stylesheets and `data.js` load from `file://`. `bun run build:map` runs
`build:shell` after the bundle. The gate blocks, copied verbatim out of
`verify-site.sh`, were run against scratch copies of the tree (never the real
tree): the unchanged copy passed E, F, S and I. S failed with the new stamp
named after one comment line was appended to `shell.css` and, separately,
to `data.js` without a rebuild, and with "has no ?v= stamp" after the stamp
was removed from the method page's `fill-stats.js` tag. E failed on
`../updates/index.html?x=1`. A stamped stylesheet link to a missing file
failed F and S; in I it failed with "stylesheet did not load from file://"
(a probe showed a failed `file://` stylesheet still has a sheet object whose
rules throw on read, so the check reads the rules). An emptied `data.js`
failed I with "window.FRANKEN_DATA undefined". The live host answered
`/assets/shell.css?v=0323daf6e7` with 200 `text/css` and `cf-cache-status:
MISS`, a separate cache entry from the unstamped URL.
