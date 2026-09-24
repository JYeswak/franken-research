# Weekly Rust discovery sweep

`watch/discover.mjs` looks once a week for recently active public Rust repositories that show signs of being built by AI coding agents, and lists them as candidates for an assessment. It lists; it never assesses. The screening rule it applies, and what happens to a listed repository, are in [`candidates/README.md`](../../candidates/README.md). It reads the GitHub REST API only and uses Node 22 built-ins with no dependencies. The scheduled run is [`.github/workflows/discover.yml`](../../.github/workflows/discover.yml), Mondays 12:17 UTC; the same code runs locally.

## What it does

1. **Search.** `GET /search/repositories` with `language:Rust pushed:>=<run date - 30 days> created:>=<run date - 180 days> stars:>=25 fork:false`, sorted by stars, 100 per page, at most 3 pages. Search calls are spaced 2.5 s apart (the search API allows 30 a minute).
2. **Exclude.** Repositories owned by `Dicklesworthstone` (the [daily watch](../README.md) covers them), forks, archived repositories, repositories on a packet's repository line under `cohorts/`, and known candidates: any repository named by a `candidate`-labelled issue other than this week's rollup, or listed in an earlier week's file here. Each exclusion is counted in the output.
3. **Check signals** for the 40 most-starred that remain (ties by name), three REST calls each:
   - `GET /repos/<o>/<r>/contents/`: is there an `AGENTS.md` or `CLAUDE.md` file at the root;
   - `GET /repos/<o>/<r>/commits?per_page=30`: how many of the last 30 commits carry a `Co-Authored-By:` trailer naming a coding agent (Claude, Codex, Gemini, Copilot, Cursor, Devin, Jules, Aider, OpenHands, Amp, or the words agent, Anthropic, OpenAI). Only the count is kept; no name, email, or message text;
   - `GET /repos/<o>/<r>/readme`: does the README say agents built it ("built with Claude Code", "written by AI agents", "vibe-coded"). "Generated via" does not count: READMEs use it for what a tool calls at run time.
4. **Score** = number of signals present (0 to 4) + log10(stars)/10. The star term only orders repositories with the same signal count; it stays below 1. A repository with no signal is left out (counted as `no_signal`).
5. **Order** by score, then stars, then name. The output does not depend on the order the API returned results in.

## Modes

```
node watch/discover.mjs              dry report on stdout; writes nothing
node watch/discover.mjs --apply      also write watch/discovery/<ISO-week>.json
node watch/discover.mjs --issues     also create or update the week's one rollup issue
node watch/discover.mjs --selftest   offline check on watch/fixtures/discover-*.json
```

The dry run still reads the issue list (one call) so that known candidates are skipped the same way the scheduled run skips them.

Exit codes: 0 ok; 1 selftest failure; 2 usage or token error; 3 GitHub API failure. Any 403 or 429 (a rate limit, or a forbidden repository) stops the run at once with exit 3. Everything is fetched before anything is written, so a stopped run leaves no file and no issue edit. Token: `GITHUB_TOKEN` or `GH_TOKEN`, else `gh auth token`; it is never printed.

## Output: `watch/discovery/<YYYY-Www>.json`

One file per ISO week (the week of the run date, e.g. `2026-W39`). A rerun in the same week overwrites it.

| Field | Meaning |
|---|---|
| `week`, `checked_on` | ISO week and UTC date of the run |
| `query`, `rule` | the search string used; the rule file (`candidates/README.md`) |
| `search` | `total_count` matched, `fetched` (at most 300), `incomplete_results` as GitHub reported it |
| `excluded` | counts: `owner`, `fork`, `archived`, `assessed`, `already_candidate` |
| `checked`, `no_signal` | repositories whose signals were read; how many had none |
| `candidates[]` | `repo`, `url`, `stars`, `pushed_at`, `created_at`, `signals` (`agents_md`, `claude_md`, `agent_trailers`, `readme_statement`), `signal_count`, `score`; sorted |
| `listed` | the top 15 repository names, the rows of the rollup issue; later weeks skip them |

## The rollup issue

`--issues` keeps exactly one issue per ISO week, titled `[discovery] Rust candidates, week <YYYY-Www>` and labelled `candidate` and `discovery` (both labels are created if missing). Its body is a table of the top 15 with their signals and a triage checklist that links the screening rule. The issue is found by exact title, open or closed. A hidden marker records a digest of the listed repositories and their signals (not their star counts): a rerun with the same listing does nothing, a changed listing edits the body of the same issue, and a closed rollup is never reopened or edited.

## Selftest (Gate W2)

`--selftest` runs the real transport and code on recorded responses: [`../fixtures/discover-2026-W39.json`](../fixtures/discover-2026-W39.json), recorded from a live dry run on 2026-09-24 and cut to 12 repositories (its `_note` lists what was trimmed and the one synthetic fork), and [`../fixtures/discover-prior-2026-W38.json`](../fixtures/discover-prior-2026-W38.json), an earlier week's listing. The gate chain runs it as Gate W2 ([`site/BUILD-GATES.md`](../../site/BUILD-GATES.md)).

## Limits

- GitHub search caps results at 1000 and the sweep reads 300; a Rust repository below the top 300 by stars in the window is not seen that week.
- The signals are heuristics. A trailer can come from an editor plugin on a mostly human commit; a root `CLAUDE.md` can be a stub; a README can mention Claude Code for another reason. They make a repository worth a look, nothing more.
- Primary language is GitHub's linguist count. A Rust tool that ships more TypeScript than Rust is not found here; suggest it with the form instead.
