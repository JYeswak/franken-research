# Daily watch

`watch/watch.mjs` checks Jeffrey Emanuel's public GitHub repositories (user `Dicklesworthstone`) once a day and records what moved since the pins. It reads the GitHub API only (GraphQL and REST), never a local mirror, and uses Node 22 built-ins with no dependencies. The scheduled run is [`.github/workflows/watch.yml`](../.github/workflows/watch.yml); the same code runs locally.

It reports. It does not judge: it never edits a pin, a packet, the synthesis, or a verdict. Whether a change moves an assessment cell is decided by an analyst in a dated re-check under [`updates/`](../updates/METHOD.md).

## Since 2026-09-25: class triggers, live cards, one dashboard

On its first day, 2026-09-24, the watch opened twelve issues (#1 to #12), one per event, and only #5 led to a correction. From 2026-09-25 the watch follows the freshness contract in [`freshness/SPEC.md`](freshness/SPEC.md), and its runbook is [`freshness/README.md`](freshness/README.md):

- **Class triggers.** For each assessed repository the watch computes the CI class (C1 to C6), the release class (R1 to R3) and the license class, at the pin and now, from recorded API facts (workflow files, Actions runs for the commit, releases and tags, license text). A verdict is flagged only when a computed class moves: a *crossing*. Archiving, deletion, and a pin that is no longer an ancestor of HEAD always raise one. Where the machine's class at the pin disagrees with the master matrix, that dimension is *untracked*, the disagreement is a `DISC` entry in [`freshness/DISCREPANCIES.md`](freshness/DISCREPANCIES.md), and the event rules below still flag its changes.
- **Files.** `--apply` also writes `watch/live.json` (schema `fr.watch.live/v1`: per repository the pin, baseline, head, the three classes at the pin and now, open crossings with evidence, and a state of `current`, `changed`, `due` or `unknown`) and appends one line per crossing opened, resolved or withdrawn to `watch/crossings.jsonl`, which is append-only. A class crossing is withdrawn when its class returns to the baseline value for two consecutive daily observations (FR-T.10); only a dated re-check resolves one.
- **Live card.** `node site/scripts/make-live.mjs` renders a card from `watch/live.json` into every brief. It shows computed facts with their "as of" time and never says a verdict changed.
- **One dashboard issue.** `node watch/freshness/dashboard.mjs --sync watch/live.json` keeps a single issue, `[watch] Freshness dashboard`, edited in place, under the same trust rules as before. No per-event issues are opened for assessed repositories; new-repository candidates are listed on the dashboard.
- **Order of the scheduled run** (FR-D.5): in the `build` job, watch (`--apply`), build (cards, feed, harness report) and the gate chain, then an upload of the generated files; in the `publish` job, which runs only after `build` succeeds, apply those files, check the briefs, commit, push, and only then the dashboard sync, from the committed `watch/live.json`. A failed gate or push leaves the issue as it was; a failed sync fails the run but leaves the pushed files in place.
- **Two jobs, main only** (FR-O.6): both jobs run only on `main` (a manual dispatch from another branch is skipped), and neither checkout keeps a token in `.git/config`. `build` installs dependencies and runs the watch, the build and the gate chain with a read-only token (`contents: read`, `issues: read`), so no dependency can push or edit an issue whatever it does with that token. `publish` holds the write permissions and installs nothing: it downloads the artifact outside the checkout, copies in the generated paths and nothing else (`ops/take-build-output.mjs`), and runs only dependency-free scripts from the repository. Its token reaches only the push (which authenticates that one `git push` with `-c http…extraheader`) and the dashboard sync. Gate W3 checks the split with `ops/write-job.mjs`.
- **Weekly digest.** The feed gets at most one watch entry per ISO week, listing the crossings opened, resolved and withdrawn that week.
- **Tests.** Gate W3 runs the freshness harness against the contract; gate W still runs the selftest below.

## What it watches

- **The 44 assessed repositories.** Names and pins are parsed from `packets/*-assessment.md` (the `**Pinned commit:**`, `**Pin:**`, or `| Pinned revision |` header line and the repository line). The run fails unless exactly 44 parse. For each one: default-branch HEAD and its date; commits ahead of the pin (REST compare `pin...HEAD`); GitHub releases and tags, with those dated after the pin; the detected license SPDX id and the blob hash of each license file at HEAD and at the pin; the sorted `.github/workflows` file names at HEAD and at the pin; archived; default branch; GitHub id.
- **Every public repository the user owns** (GraphQL `user.repositories`, paginated): name, id, description, archived, fork, primary language, created and pushed dates. Compared by id with the previous state, which is how a rename is told apart from a deletion plus a new repository.

## What counts as material

Material means the event could move a master-matrix cell in [`synthesis/00-overview.md`](../synthesis/00-overview.md). Each is computed twice: against the pin (the census and the report) and against the previous `watch/state.json`. Until 2026-09-24 the scheduled run opened an issue for each material event new since the last run. Since 2026-09-25 these rules decide what an untracked dimension flags (`source: event-fallback` on the dashboard) and what is counted as informational in `live.json`; class triggers decide the rest.

| Event | Label | Cells it may affect |
|---|---|---|
| New GitHub release or tag (or an existing one moved or removed) | `release` | Release class R1 to R3, TRL, NODUS ring |
| License SPDX id changed, or a license file's text changed with the same SPDX id (the rider lives in the text) | `license` | License |
| `.github/workflows` file removed (any removal, including down to none), or workflow files appearing where there were none | `ci` | CI class C1 to C6 |
| Archived or unarchived | `archived` | NODUS ring, TRL, bus factor |
| Renamed (same id, new name) | `renamed` | none directly; links name the old repository |
| Deleted, made private, or transferred | `deleted` | every cell |
| Pin no longer an ancestor of HEAD (compare 404, diverged, or behind) | `pin-rewritten` | every cell |
| New public repository, not a fork and not archived, where any clause holds: the name starts with `franken`, the name ends with `_bend`, the primary language is Rust, or the description has port-like wording (`port of`, `rewrite of`, `law-proved`, `byte-for-byte`, `clean-room`, `in rust`, case-insensitive, whole words). The issue names every clause that matched. | `new-repo` | candidate for a new packet |

Informational, never material: commit volume; workflow files added to a set that already had files (they arrive almost daily and cannot move the CI cell on their own, which depends on whether checks run and pass); new repositories that match none of those clauses, and new forks or archived repositories; and renames, deletions, or archiving of repositories outside the assessed 44. Added workflow files still show in the census column `workflows_changed_since_pin` and in the report, and the daily ones are listed in the day's changes file; they get no issue. The same rule applies to `--backfill-since-pin`.

## Files

`--apply` writes, and a second run on the same UTC day overwrites that day's files:

- `watch/state.json`: the full current snapshot, sorted, with `checked_at` and `previous_checked_at`. `checked_at` is the only field that changes when nothing upstream changed. The daily commit of this file also keeps the repository active, so GitHub does not disable the schedule after 60 idle days.
- `watch/census/YYYY-MM-DD.tsv`: one row per assessed repository: `repo, pin, head, head_date, commits_since_pin, releases_since_pin, license_spdx, license_changed_since_pin, workflows_count, workflows_changed_since_pin, archived, material_since_pin`.
- `watch/changes/YYYY-MM-DD.json`: material and informational changes new since the previous state, with before, after, and evidence URLs. The first run has no previous state and is recorded as a baseline with no changes.
- `watch/latest.json`: a summary of the run for the website (421 bytes in a local run on 2026-09-24; gate W fails it at 2 KB), keys in a fixed order: `schema` (1), `checked_at`, `previous_checked_at`, `assessed`, `found`, `moved_since_pin`, `commits_since_pin_total`, `material_since_pin_count` (events, as in the census), `material_new_today_count` (material changes in the day's changes file), `public_repos`, `new_public_repos_today` (names), `census_path`, and `changes_path`. Every count is computed from the same snapshot as the census, and gate W re-derives each one from the rendered fixture census. The scheduled run writes and commits it; until it has, the site shows its static line.

No commit author name or email is ever requested or recorded.

### On the website

The site has no deploy step for the watch. [`site/assets/live-watch.js`](../site/assets/live-watch.js) reads `watch/latest.json` from `raw.githubusercontent.com`, and the open issues labelled `watch` from the GitHub API, when someone views the map or `/updates/`. It fills the `#live-watch` line with when the last check ran, how many repositories moved since the pin, and how many watch issues are open, linking the census file and the issue list. Both requests are unauthenticated, and the result is cached in the browser for ten minutes. If `latest.json` cannot be read (offline, blocked), the page keeps the static line written into the HTML, which links to the same two places; if only the issue count fails (the API allows 60 unauthenticated requests an hour per address), the line leaves the count out. Opened from `file://` (the downloaded ZIP, and the gate I render), the script makes no requests and the static line stays.

## Running it

```bash
bun run watch                   # dry report on stdout; writes nothing
bun run watch -- --apply        # also write state, census, changes, watch/live.json, and new lines of watch/crossings.jsonl
bun run watch -- --json         # the report as JSON
bun run watch -- --fail-on-change   # dry; exit 1 if anything material is new since the last state
node watch/freshness/dashboard.mjs --sync watch/live.json   # the scheduled run's last step, after the gates and the push
node watch/watch.mjs --selftest # offline check on recorded fixtures (gate W)
```

The token comes from `GITHUB_TOKEN` or `GH_TOKEN`, else `gh auth token`; it is never printed. Exit codes: 0 ok; 1 a material change with `--fail-on-change`, or a failed selftest; 2 usage, packet parse, or token error; 3 GitHub API failure, in which case nothing is written. Two local runs on 2026-09-24 used 11 GraphQL and 32 REST calls each and took 15.9 and 16.9 seconds.

### Retired on 2026-09-25: per-event issues

`--issues` and `--backfill-since-pin` were the scheduled path until 2026-09-24 and filed issues #1 to #12. Since 2026-09-25 (freshness contract FR-D.4) they are usage errors (exit 2) that name the dashboard sync; so is `--dashboard`, which synced the dashboard from inside the watch on 2026-09-25 until the sync moved after the push (FR-D.5). The dedupe and trust code they used stays in `watch.mjs`, because gate W tests it and the dashboard reuses it. What they did, as of v1.2.0:

`--issues` (the scheduled run uses it; local runs normally do not) opens one issue per repository, change type, and identifying value in `JYeswak/franken-research`, titled `[watch] <repo>: <change>` (for example `[watch] franken_code_browser: release v0.1.1`) and labelled `watch` plus the label above. Labels are created if missing. Before creating, it looks for an open or closed issue with the exact title that it can trust: authored by the identity the token acts as (`github-actions[bot]` in the scheduled run; locally, the login `GET /user` returns), labelled `watch`, and carrying this change's `watch-key` marker. Same value, nothing happens; a changed value adds a comment; a closed issue is never reopened. A same-title issue that fails any of those checks (for example one a stranger opened with a predictable title) is never commented on or edited; the watch files its own issue beside it and lists the other under `ignored` in the report. Value markers count only in the trusted issue's body and in comments by the same identity. Tag, release, and file names from upstream are Markdown-escaped in issue text (a legal tag such as `v1|cell` would otherwise split a table), and marker values are URI-encoded (a tag may contain `-->`). Issues filed from a local run are authored by that user, so the scheduled run does not treat them as its own. At most 20 issue actions per run; the rest go into one `[watch] rollup YYYY-MM-DD` issue.

`--backfill-since-pin` (only with `--issues`) closes the gap before the first state. The baseline was taken after the pins, so events between a pin and the baseline (for example `franken_code_browser` v0.1.0) never appear in a daily diff. The backfill turns each material-since-pin event in the report into an issue. It uses the same titles as the daily path for the same event (`release <tag>`, `tag <tag>`, `workflows +A -R (N now)`, where the counts compare HEAD with the pin), and the same labels, body builder, dedupe, and cap. Running it again finds the filed titles and files nothing new, unless a count has moved since, which gives a new title. A since-pin license change is titled `license text changed since the pin (...)`, because the SPDX id at the pin is not available from the API. When a dated re-check in `updates/<repo>-YYYY-MM-DD.md` names the release or tag, the issue gets one comment linking it, marked so it is never posted twice. The issue stays open; the analyst closes it. The daily path adds the same pointer if such a re-check exists.

## From crossing to re-check

The dashboard issue lists each open crossing with the repository, dimension, class at the baseline and now, since when, API evidence, and a link to the method. For the analyst:

1. Read the evidence. A crossing says a computed class moved, not that the verdict changed.
2. Write a dated re-check `updates/<repo>-YYYY-MM-DD.md` per [`updates/METHOD.md`](../updates/METHOD.md), pinned to the new commit, with the CI class, Release class and License rows in its cells table. Only a re-check resolves a crossing; one that finds the verdict unchanged still records the classes at its pin, which become the new baseline.
3. Have a separate agent session review the re-check.
4. Harvest any new practice into [`stack/rigor-practices.tsv`](../stack/rigor-practices.tsv).
5. On the next run the watch appends a `resolved` line to `watch/crossings.jsonl`, the crossing leaves the dashboard, and the week's digest lists it. [`freshness/README.md`](freshness/README.md) has the details.

Issues #1 to #12, opened under the old path, keep their original checklist: triage, a re-check if the event could move a cell, review, harvest, and close with links.

## Selftest and fixtures

`--selftest` runs the same collect and diff code on `watch/fixtures/` with no network and no token. `day1.json` holds GitHub API responses recorded on 2026-09-24 for six assessed repositories and part of the public listing (GraphQL nodes as returned; REST compare trimmed to `status`, `ahead_by`, `behind_by`). `day2.json` is a synthetic next day derived from it: a new release, a license text change with the same SPDX id, a removed workflow, commits only, a rename of an assessed and of an unassessed repository, a pin that returns 404, and two new repositories. Its `_note` lists every edit. The cases assert that each of those is classified correctly, that `beads_bend` (Shell) and `toon_bend` (Python) are flagged with their clauses named while a fork `franken_x`, an archived repository, and a plain Python repository are not, that tag names such as `v1|cell` and `v2-->x` reach the day's changes file intact, that output does not depend on API ordering, that workflow files added to an existing set stay informational while one removal or a first workflow file is material (daily and since the pin, on day-1 variants), and that every `latest.json` count matches the census rendered from the same state. Since 2026-09-25 there are 18 cases: the four that exercised the retired issue sync (dedupe, a same-title issue by another user, a bot issue missing its label or key, and the since-pin backfill) were removed with it, and the table-cell check now covers the changes file only. Gate W in `bun run verify` fails if any case fails or none run ([site/BUILD-GATES.md](../site/BUILD-GATES.md)).

## What it does not do

- It does not decide whether anything is material to a verdict, and it never edits `packets/`, `synthesis/`, the pins, or the headline counts.
- The event rules above do not read CI run results, only the workflow file set. Since 2026-09-25 the class triggers do: FR-C.2 of the freshness contract classifies CI from the Actions runs on the pin and on HEAD.
- It does not see a lightweight tag created later on an old commit as "after the pin" (the tag has no date of its own), though it still reports the tag as new since the previous state.
- It does not record who committed; the bus-factor cell is not observed here.
