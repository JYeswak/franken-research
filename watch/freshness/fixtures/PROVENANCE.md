# Fixture provenance (watch/freshness/SPEC.md FR-H.7)

Each fixture here says how it was made: the command, the UTC time, the endpoints it read, and the git ref of this repository when it was made. No scheduled job writes these files. A person re-records them, reviews the diff, and commits.

## Core fixtures (watch/freshness/fixtures/core/)

### reference.json and blobs.json.gz

- **Command:** `node watch/freshness/facts.mjs --record` (token from `gh auth token`; never printed).
- **Recorded:** 2026-09-25T04:02:38Z (UTC), 71.3 s. A first attempt at 04:00:32Z was discarded: GitHub answered `actions/runs?head_sha=` for the frankenlibc pin with `total_count: 0`, although that commit has two runs (a `ci.yml` failure and a `native-resolver.yml` success, both on 2026-09-22) and a direct query a minute later listed them. The kept recording holds those two runs, and its pin, re-check and issue-commit runs are identical to the 02:08:40Z recording.
- **A stale page, kept:** in the kept recording, frankenlibc's push-runs page (`total_count` 8621) came back with 100 runs on 100 distinct commits (`ci_page` in `reference.json`); the first commit on it that qualified was `548e172`, dated 2026-09-19T07:14:42Z. My first direct query after the recording got a page of the same shape; I read its first 20 rows, each a `ci.yml` run on its own commit, `548e172` first. The next query got the newest runs first (`bb30176`, created 04:03:02Z, `total_count` 9068). The recorded CI point is therefore `548e172`, which is dated before the baseline commit (2026-09-22). FR-C.3 does not use it, so frankenlibc's CI now reads `unknown` (`FR-C.3/no-settled-commit`) instead of taking a class from a commit three days older than the baseline. The page is kept as a real answer that exercises that guard.
- **Git ref of this repository:** `5c7877fa4af3f5886ac265f41401b42838ec4d85` (the commit whose FR-C.3 selector requires at least one push-triggered test run).
- **API use:** 89 GraphQL calls (cost 89) and 176 REST calls.
- **Endpoints:**
  - GraphQL `https://api.github.com/graphql`: the watch's own collection (`user.repositories`, and per repository `defaultBranchRef`, `licenseInfo`, `releases` with `releaseAssets { totalCount }`, `refs(refPrefix: "refs/tags/")`), the commit, root tree and `.github/workflows` tree (entries with blob ids) at every recorded point, and the text of each blob through `repository.object(oid:)`.
  - REST `GET /repos/Dicklesworthstone/{repo}/compare/{pin}...{head}?per_page=1&page=2` (status, ahead_by, behind_by only).
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/runs?head_sha={sha}&per_page=100` for every recorded point except HEAD, trimmed to each run's `path`, `name`, `event`, `status`, `conclusion`.
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/runs?branch={default}&event=push&per_page=100`, one page per repository (FR-C.3), trimmed to each run's `head_sha`, `path`, `name`, `event`, `status`, `conclusion`; only the runs of the chosen CI point are kept.
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/workflows?per_page=100`, trimmed to `path`, `state` and `updated_at` (kept as `since`).
- **Points recorded:** the packet pin and HEAD of all 44 assessed repositories (88); the FR-C.3 CI point, the newest commit on the push-runs page that has at least one push-triggered test run and whose push-triggered test runs had all completed (24 repositories: HEAD for 9, an older commit for 15; none on the page for 20, recorded as `ci: null`); the two re-check pins (frankengit `dfa5bb861e1f08802c72d33e96796a1aad9d5d06`, franken_code_browser `c7c531061e250d81afc58da7cb35ec0b4e7129cb`); and the commits named by watch issues #2, #3, #4, #6 and #7 (franken_lean `9d6d77b`, franken_manim `b2322be`, frankenfs `c8de05f`, frankenlibc `0d662e3`, frankensim `950ef5c`; the head of each issue's compare URL). 119 points in all. The 02:08:40Z recording, made with the earlier selector, held 36 CI points; 12 of them had no push-triggered test run and would not qualify now.
- **Trimming:** `reference.json` keeps only the fields the classifier and triggers read (see `snapFields` and `rawPoint` in `facts.mjs`), plus each repository's push-page size (`ci_page`). `blobs.json.gz` holds the text of the 552 blobs those records name, keyed by blob id: every workflow file and license file at every point, and the HEAD `Cargo.lock` of the two repositories with a `dependency.edge` revisit trigger, reduced to its `name = "..."` lines. It is gzipped because the texts total about 4.4 MB.
- **What it does not hold:** commit authors, issue data, run logs, job lists.

### replay-states.json.gz

- **Command:** `node watch/freshness/facts.mjs --record-replay`.
- **Recorded:** 2026-09-25T01:36:09Z (UTC).
- **Git ref of this repository:** `e424f474aa95b415c94ddaf1e00ea62d3b8d9d55`.
- **Source:** `git log --reverse -- watch/state.json`, then `git show <commit>:watch/state.json` for each commit. No API call.
- **Contents:** the three committed states: `2aef0f1` (checked 2026-09-24T13:39:07Z), `e46c124` (2026-09-24T13:50:21Z), `e7004c8` (2026-09-24T21:25:36Z). All three fall on one UTC day, so the replay measures one day.

## Output fixtures (watch/freshness/fixtures/outputs/)

Hand-written by FreshOutputs on 2026-09-25 (UTC, first written 01:05Z, last edited 01:27Z), at repository ref 2075c71. No recorder, no API call: nothing in these files was fetched. Commit SHAs and counts are synthetic; URLs have the shape of real GitHub API and web URLs so link rendering is exercised, but none was requested. Only a person edits these files, and the diff is reviewed before commit.

| File | What it holds | How it was made |
|---|---|---|
| `live-states.json` | An IF-LIVE document (`fr.watch.live/v1`, `checked_at` 2026-09-24T06:12:45Z) with 7 pinned repositories and 1 cohort repository covering every state (changed: frankengit, franken_engine, frankengraphdb; current: franken_code_browser with a resolved crossing and a re-check baseline, frankenterm, beads_bend; due: frankensearch; unknown: franken_tts), an untracked dimension (franken_engine CI), an existence crossing (frankengraphdb archived), a pending crossing (frankensearch license), 2 candidates, 1 unknown, and upstream strings that need escaping (a tag with `\|`, `<script>`, backticks and `@here`; a candidate reason with `<b>`, `*`, `\|` and `@someone`). A frankenfs record is changed, with an open CI C2>C1 crossing and a pending entry in phase `withdrawing` (FR-T.10); every other pending entry has phase `opening`. | Typed by hand; the cohort row and the per-dimension `reference`/`at_baseline` keys were added with a one-off Python edit of the same file (json load, insert keys in IF-LIVE order, dump with indent 2). |
| `live-quiet.json` | An IF-LIVE document (`checked_at` 2026-10-01T06:00:00Z) with 2 current repositories, no crossings, candidates or unknowns, and a cohort count of 0. | Derived from `live-states.json` by a one-off Python edit (keep frankenterm and franken_code_browser, clear crossings and pending, set state current). |
| `crossings.jsonl` | A crossing ledger in FR-G.3 key order: 3 events in 2026-W39 (two opened, one resolved by `updates/franken_code_browser-2026-09-24.md`, which is committed), none in 2026-W40, 2 opened in 2026-W41, and one withdrawn event alone in 2026-W42; one event has a license first line holding `<`, `&`, `"`, `\|`, backticks and `@here`. | Written by a one-off `node -e` that JSON.stringify'd each event object in key order, one per line, with a trailing newline. |
