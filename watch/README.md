# Daily watch

`watch/watch.mjs` checks Jeffrey Emanuel's public GitHub repositories (user `Dicklesworthstone`) once a day and records what moved since the pins. It reads the GitHub API only (GraphQL and REST), never a local mirror, and uses Node 22 built-ins with no dependencies. The scheduled run is [`.github/workflows/watch.yml`](../.github/workflows/watch.yml); the same code runs locally.

It reports. It does not judge: it never edits a pin, a packet, the synthesis, or a verdict. Whether a change moves an assessment cell is decided by an analyst in a dated re-check under [`updates/`](../updates/METHOD.md).

## What it watches

- **The 44 assessed repositories.** Names and pins are parsed from `packets/*-assessment.md` (the `**Pinned commit:**`, `**Pin:**`, or `| Pinned revision |` header line and the repository line). The run fails unless exactly 44 parse. For each one: default-branch HEAD and its date; commits ahead of the pin (REST compare `pin...HEAD`); GitHub releases and tags, with those dated after the pin; the detected license SPDX id and the blob hash of each license file at HEAD and at the pin; the sorted `.github/workflows` file names at HEAD and at the pin; archived; default branch; GitHub id.
- **Every public repository the user owns** (GraphQL `user.repositories`, paginated): name, id, archived, fork, primary language, created and pushed dates. Compared by id with the previous state, which is how a rename is told apart from a deletion plus a new repository.

## What counts as material

Material means the event could move a master-matrix cell in [`synthesis/00-overview.md`](../synthesis/00-overview.md). Each is computed twice: against the pin (the census and the report) and against the previous `watch/state.json` (issues are opened only for what is new since the last run).

| Event | Label | Cells it may affect |
|---|---|---|
| New GitHub release or tag (or an existing one moved or removed) | `release` | Release class R1 to R3, TRL, NODUS ring |
| License SPDX id changed, or a license file's text changed with the same SPDX id (the rider lives in the text) | `license` | License |
| `.github/workflows` file added or removed | `ci` | CI class C1 to C6 |
| Archived or unarchived | `archived` | NODUS ring, TRL, bus factor |
| Renamed (same id, new name) | `renamed` | none directly; links name the old repository |
| Deleted, made private, or transferred | `deleted` | every cell |
| Pin no longer an ancestor of HEAD (compare 404, diverged, or behind) | `pin-rewritten` | every cell |
| New public repository whose name starts with `franken` or whose primary language is Rust (and is not a fork) | `new-repo` | candidate for a new packet |

Informational, never material: commit volume, new repositories that are neither `franken*` nor Rust, and renames, deletions, or archiving of repositories outside the assessed 44.

## Files

`--apply` writes, and a second run on the same UTC day overwrites that day's files:

- `watch/state.json`: the full current snapshot, sorted, with `checked_at` and `previous_checked_at`. `checked_at` is the only field that changes when nothing upstream changed. The daily commit of this file also keeps the repository active, so GitHub does not disable the schedule after 60 idle days.
- `watch/census/YYYY-MM-DD.tsv`: one row per assessed repository: `repo, pin, head, head_date, commits_since_pin, releases_since_pin, license_spdx, license_changed_since_pin, workflows_count, workflows_changed_since_pin, archived, material_since_pin`.
- `watch/changes/YYYY-MM-DD.json`: material and informational changes new since the previous state, with before, after, and evidence URLs. The first run has no previous state and is recorded as a baseline with no changes.

No commit author name or email is ever requested or recorded.

## Running it

```bash
bun run watch                   # dry report on stdout; writes nothing
bun run watch -- --apply        # also write state, census, and changes
bun run watch -- --json         # the report as JSON
bun run watch -- --fail-on-change   # dry; exit 1 if anything material is new since the last state
node watch/watch.mjs --issues --backfill-since-pin   # file issues for material events since the pins (one-off)
node watch/watch.mjs --selftest # offline check on recorded fixtures (gate W)
```

The token comes from `GITHUB_TOKEN` or `GH_TOKEN`, else `gh auth token`; it is never printed. Exit codes: 0 ok; 1 a material change with `--fail-on-change`, or a failed selftest; 2 usage, packet parse, or token error; 3 GitHub API failure, in which case nothing is written. Two local runs on 2026-09-24 used 11 GraphQL and 32 REST calls each and took 15.9 and 16.9 seconds.

`--issues` (the scheduled run uses it; local runs normally do not) opens one issue per repository, change type, and identifying value in `JYeswak/franken-research`, titled `[watch] <repo>: <change>` (for example `[watch] franken_code_browser: release v0.1.1`) and labelled `watch` plus the label above. Labels are created if missing. Before creating, it looks for an open or closed issue with the exact title: same value, nothing happens; a changed value adds a comment; a closed issue is never reopened. At most 20 issue actions per run; the rest go into one `[watch] rollup YYYY-MM-DD` issue.

`--backfill-since-pin` (only with `--issues`) closes the gap before the first state. The baseline was taken after the pins, so events between a pin and the baseline (for example `franken_code_browser` v0.1.0) never appear in a daily diff. The backfill turns each material-since-pin event in the report into an issue. It uses the same titles as the daily path for the same event (`release <tag>`, `tag <tag>`, `workflows +A -R (N now)`, where the counts compare HEAD with the pin), and the same labels, body builder, dedupe, and cap. Running it again finds the filed titles and files nothing new, unless a count has moved since, which gives a new title. A since-pin license change is titled `license text changed since the pin (...)`, because the SPDX id at the pin is not available from the API. When a dated re-check in `updates/<repo>-YYYY-MM-DD.md` names the release or tag, the issue gets one comment linking it, marked so it is never posted twice. The issue stays open; the analyst closes it. The daily path adds the same pointer if such a re-check exists.

## From issue to re-check

Each issue carries what changed, before and after, API evidence, the pinned matrix values it may affect, and this checklist for the analyst:

1. Triage: could this move a matrix cell? If not, close it with a one-line reason.
2. If yes, write a dated re-check `updates/<repo>-YYYY-MM-DD.md` per [`updates/METHOD.md`](../updates/METHOD.md), pinned to the new commit.
3. Have a separate agent session review the re-check.
4. Harvest any new practice into [`stack/rigor-practices.tsv`](../stack/rigor-practices.tsv).
5. Close the issue with links to the re-check, the review, and any rigor row.

## Selftest and fixtures

`--selftest` runs the same collect, diff, and dedupe code on `watch/fixtures/` with no network and no token. `day1.json` holds GitHub API responses recorded on 2026-09-24 for six assessed repositories and part of the public listing (GraphQL nodes as returned; REST compare trimmed to `status`, `ahead_by`, `behind_by`). `day2.json` is a synthetic next day derived from it: a new release, a license text change with the same SPDX id, a removed workflow, commits only, a rename of an assessed and of an unassessed repository, a pin that returns 404, and two new repositories. Its `_note` lists every edit. The cases assert that each of those is classified correctly, that dedupe returns `exists` for a filed title, and that output does not depend on API ordering. Gate W in `bun run verify` fails if any case fails or none run ([site/BUILD-GATES.md](../site/BUILD-GATES.md)).

## What it does not do

- It does not decide whether anything is material to a verdict, and it never edits `packets/`, `synthesis/`, the pins, or the headline counts.
- It does not read CI run results, so a workflow that is red, disabled, or never runs is not seen; only the file set is.
- It does not see a lightweight tag created later on an old commit as "after the pin" (the tag has no date of its own), though it still reports the tag as new since the previous state.
- It does not record who committed; the bus-factor cell is not observed here.
