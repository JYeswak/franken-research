# Fixture provenance (watch/freshness/SPEC.md FR-H.7)

Each fixture here says how it was made: the command, the UTC time, the endpoints it read, and the git ref of this repository when it was made. No scheduled job writes these files. A person re-records them, reviews the diff, and commits.

## Core fixtures (watch/freshness/fixtures/core/)

### reference.json and blobs.json.gz

- **Command:** `node watch/freshness/facts.mjs --record` (token from `gh auth token`; never printed).
- **Recorded:** 2026-09-25T02:08:40Z (UTC), 54.8 s.
- **Git ref of this repository:** `b5c18d16f0a8a95e222dad1fba45089ed9363046`.
- **API use:** 99 GraphQL calls (cost 99) and 176 REST calls.
- **Endpoints:**
  - GraphQL `https://api.github.com/graphql`: the watch's own collection (`user.repositories`, and per repository `defaultBranchRef`, `licenseInfo`, `releases` with `releaseAssets { totalCount }`, `refs(refPrefix: "refs/tags/")`), the commit, root tree and `.github/workflows` tree (entries with blob ids) at every recorded point, and the text of each blob through `repository.object(oid:)`.
  - REST `GET /repos/Dicklesworthstone/{repo}/compare/{pin}...{head}?per_page=1&page=2` (status, ahead_by, behind_by only).
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/runs?head_sha={sha}&per_page=100` for every recorded point except HEAD, trimmed to each run's `path`, `name`, `event`, `status`, `conclusion`.
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/runs?branch={default}&event=push&per_page=100`, one page per repository (FR-C.3), trimmed to each run's `head_sha`, `path`, `name`, `event`, `status`, `conclusion`; only the runs of the chosen CI point are kept.
  - REST `GET /repos/Dicklesworthstone/{repo}/actions/workflows?per_page=100`, trimmed to `path`, `state` and `updated_at` (kept as `since`).
- **Points recorded:** the packet pin and HEAD of all 44 assessed repositories (88); the FR-C.3 CI point, the newest commit on the push-runs page whose push-triggered test runs had all completed (36 repositories: HEAD for 10, an older commit for 26; none on the page for 8, recorded as `ci: null`); the two re-check pins (frankengit `dfa5bb861e1f08802c72d33e96796a1aad9d5d06`, franken_code_browser `c7c531061e250d81afc58da7cb35ec0b4e7129cb`); and the commits named by watch issues #2, #3, #4, #6 and #7 (franken_lean `9d6d77b`, franken_manim `b2322be`, frankenfs `c8de05f`, frankenlibc `0d662e3`, frankensim `950ef5c`; the head of each issue's compare URL). 131 points in all.
- **Trimming:** `reference.json` keeps only the fields the classifier and triggers read (see `snapFields` and `rawPoint` in `facts.mjs`), plus each repository's push-page size (`ci_page`). `blobs.json.gz` holds the text of the 597 blobs those records name, keyed by blob id: every workflow file and license file at every point, and the HEAD `Cargo.lock` of the two repositories with a `dependency.edge` revisit trigger, reduced to its `name = "..."` lines. It is gzipped because the texts total about 4.7 MB.
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
| `live-states.json` | An IF-LIVE document (`fr.watch.live/v1`, `checked_at` 2026-09-24T06:12:45Z) with 7 pinned repositories and 1 cohort repository covering every state (changed: frankengit, franken_engine, frankengraphdb; current: franken_code_browser with a resolved crossing and a re-check baseline, frankenterm, beads_bend; due: frankensearch; unknown: franken_tts), an untracked dimension (franken_engine CI), an existence crossing (frankengraphdb archived), a pending crossing (frankensearch license), 2 candidates, 1 unknown, and upstream strings that need escaping (a tag with `\|`, `<script>`, backticks and `@here`; a candidate reason with `<b>`, `*`, `\|` and `@someone`). | Typed by hand; the cohort row and the per-dimension `reference`/`at_baseline` keys were added with a one-off Python edit of the same file (json load, insert keys in IF-LIVE order, dump with indent 2). |
| `live-quiet.json` | An IF-LIVE document (`checked_at` 2026-10-01T06:00:00Z) with 2 current repositories, no crossings, candidates or unknowns, and a cohort count of 0. | Derived from `live-states.json` by a one-off Python edit (keep frankenterm and franken_code_browser, clear crossings and pending, set state current). |
| `crossings.jsonl` | A crossing ledger in FR-G.3 key order: 3 events in 2026-W39 (two opened, one resolved by `updates/franken_code_browser-2026-09-24.md`, which is committed), none in 2026-W40, 2 opened in 2026-W41, one with a license first line holding `<`, `&`, `"`, `\|`, backticks and `@here`. | Written by a one-off `node -e` that JSON.stringify'd each event object in key order, one per line, with a trailing newline. |
