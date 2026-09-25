<!-- watch-dashboard: v1 -->
The daily watch keeps this one issue current and edits it in place (watch/freshness/SPEC.md FR-D). It lists computed facts only; only a dated re-check under `updates/` changes a verdict.

Last run: 2026-09-24 06:12 UTC. Watched: 9 repositories (8 pinned, 1 from cohort matrices). Data: [watch/live.json](https://github.com/JYeswak/franken-research/blob/main/watch/live.json).

## Changed

Open crossings: a computed class moved since the pin, or the repository itself changed. Each stays open until a dated re-check `updates/<repo>-<date>.md` records the class at its own pin.

| Repo | Dimension | From | To | Since | Source | Evidence | Re-check |
|---|---|---|---|---|---|---|---|
| [franken\_engine](https://github.com/Dicklesworthstone/franken_engine) | CI | C3 | C1 | 2026-09-23 | event-fallback | [1](https://github.com/Dicklesworthstone/franken_engine/commits/2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d/.github/workflows) | [packet](https://github.com/JYeswak/franken-research/blob/main/packets/franken_engine-assessment.md), [method](https://github.com/JYeswak/franken-research/blob/main/updates/METHOD.md) |
| [frankenfs](https://github.com/Dicklesworthstone/frankenfs) | CI | C2 | C1 | 2026-09-20 | class | [1](https://api.github.com/repos/Dicklesworthstone/frankenfs/actions/runs?head_sha=1e2d3c4b5a69788796a5b4c3d2e1f0a9b8c7d6e5&) | [packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankenfs-assessment.md), [method](https://github.com/JYeswak/franken-research/blob/main/updates/METHOD.md) |
| [frankengit](https://github.com/Dicklesworthstone/frankengit) | CI | C3 | C5 | 2026-09-24 | class | [1](https://github.com/Dicklesworthstone/frankengit/tree/dfa5bb8a1c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a/.github/workflows) | [packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankengit-assessment.md), [method](https://github.com/JYeswak/franken-research/blob/main/updates/METHOD.md) |
| [frankengraphdb](https://github.com/Dicklesworthstone/frankengraphdb) | Repository | active | archived | 2026-09-24 | existence | [1](https://github.com/Dicklesworthstone/frankengraphdb) | [packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankengraphdb-assessment.md), [method](https://github.com/JYeswak/franken-research/blob/main/updates/METHOD.md) |

## Due for re-check

| Repo | Reason | Baseline |
|---|---|---|
| [frankengit](https://github.com/Dicklesworthstone/frankengit) | open crossing | 2026-09-22 ([packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankengit-assessment.md)) |
| [frankenfs](https://github.com/Dicklesworthstone/frankenfs) | open crossing | 2026-09-22 ([packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankenfs-assessment.md)) |
| [franken\_engine](https://github.com/Dicklesworthstone/franken_engine) | open crossing | 2026-09-22 ([packet](https://github.com/JYeswak/franken-research/blob/main/packets/franken_engine-assessment.md)) |
| [frankengraphdb](https://github.com/Dicklesworthstone/frankengraphdb) | open crossing | 2026-09-22 ([packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankengraphdb-assessment.md)) |
| [frankensearch](https://github.com/Dicklesworthstone/frankensearch) | 90 days since baseline | 2026-06-20 ([packet](https://github.com/JYeswak/franken-research/blob/main/packets/frankensearch-assessment.md)) |

## Unknown

| Repo | Dimension | Why |
|---|---|---|
| [franken\_tts](https://github.com/Dicklesworthstone/franken_tts) | CI | a test run on HEAD is still in progress |

## New repositories flagged as candidates

Screening rule: [candidates/README.md](https://github.com/JYeswak/franken-research/blob/main/candidates/README.md).

| Repo | Created | Why flagged |
|---|---|---|
| [franken\_quill](https://github.com/Dicklesworthstone/franken_quill) | 2026-09-23 | name starts with franken; description: "a \*port of\* Quill \| \<b\>in Rust\</b\> \@someone" |
| [toon\_bend](https://github.com/Dicklesworthstone/toon_bend) | 2026-09-24 | name ends with \_bend |

## Revisit triggers a machine cannot observe

16 triggers across 8 repositories need a person to check them. They are listed, never alerted: [watch/freshness/revisit.tsv](https://github.com/JYeswak/franken-research/blob/main/watch/freshness/revisit.tsv).

## Informational

- Events that moved no computed class: 23 today, 311 since the pins.
- Crossings seen once, not yet open: 1.
- Open crossings whose class is back at its baseline, withdrawn if the next daily check agrees: 1.
- Repository states: 3 current, 4 changed, 1 due, 1 unknown.

## Vendored snapshots

| Snapshot | Built | Age | Status |
|---|---|---|---|
| search/index.json | 2026-08-01 | 54 days | due for rebuild (over 30 days) |
