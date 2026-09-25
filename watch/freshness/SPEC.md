# Freshness contract (watch v2)

Status: v1, 2026-09-25. Clause ids are stable and are never renumbered. Every change to a clause's text is logged, with its evidence, in the amendment log at the end of this file. After the first release, a change to what a clause requires gets a new id, and the old clause is marked `RETIRED`.

## Why

Most of what Jeffrey's repositories change on a given day cannot move a verdict. Its first day, the daily watch opened 12 issues (#1–#12), and only #5 led to a correction. This contract replaces per-event issues with three things:

1. **Class triggers.** The CI, release and license classes are computed by machine, and a verdict is flagged only when a computed class moves.
2. **A live card on every brief.** It holds computed facts only, each marked "as of".
3. **One dashboard issue, plus a weekly feed digest.**

Everything is tested against this file by `watch/freshness/harness/run.mjs`, the conformance harness behind gate W3.

## Sources this contract derives from

- The class legend in `synthesis/00-overview.md` line 58 (C1–C6, R1–R3, license classes) and the master matrix at lines 60–105. The matrix is the **reference oracle**: classes the machine computes at a pin are compared with what the analysts wrote.
- `RULEBOOK.md` §1 (evidence tiers), §3 (pinning), and §4.11, whose revisit triggers are the analysts' own per-repository list of events that would change a verdict.
- `watch/README.md`, which defines which events are material today (the event rules).
- `updates/METHOD.md`, which defines dated re-checks. Only a re-check can close a flag.

Requirement levels follow RFC 2119. Every MUST clause needs at least one harness case that passes or is an XFAIL tied to a `DISCREPANCIES.md` entry. Otherwise gate W3 fails.

## FR-C: classifier

**FR-C.1** (MUST) `classify(facts, point)` is a pure function of recorded facts. `point` is `pin` or `now`. It returns `ci`, `rel` and `license`, each `{value, rule, tier, evidence}`, where `value` is a legend class or `unknown`. `rule` names the clause below that decided it. It makes no network call and reads no clock.

**FR-C.2** (MUST) CI class at a point, taking the first rule that holds. A workflow that the Actions API reports as `disabled_*` triggers on nothing. That state applies at an earlier point only if the workflow's `updated_at` is on or before that commit's date; otherwise the state at that point is unknown.
- C6: no public workflow runs the tests, and every run on the point's commit is on a self-hosted runner, or is queued or cancelled. Or the facts carry `private_ci: true`. That flag comes only from a packet statement, and the harness records its source.
- C5: test workflow files exist, but none of them triggers on `push` or `pull_request` to the default branch. Or workflow files that existed at the pin are gone at `now`.
- C4: no workflow file at the point runs tests. There are none, or only deploy/pages workflows.
- C2: at least one completed test-workflow run on the point's commit, triggered by `push` or `pull_request`, concluded `failure`, `timed_out` or `startup_failure`.
- C1: at least one such run concluded `success`, and none concluded `failure`, `timed_out` or `startup_failure`. A run that concluded `cancelled`, `skipped` or `neutral` gives no verdict.
- C3: test workflows trigger on push or pull request, but no completed run with a verdict exists on the point's commit.

**FR-C.3** (MUST) A run still in progress, or an API gap, never reads as C3. For `now`, the file rules (C6 by packet statement, C5, and C4) read HEAD's workflow files. The run rules (C6 by self-hosted runs, C2, C1, and C3) read the CI point. The CI point is found in one page of the default branch's runs from the Actions API, read newest run first. It is the first commit in that order that has at least one push-triggered test run, all of them completed. A commit with no such run does not qualify. If that first qualifying commit is dated before the baseline commit, CI is `unknown`; the search does not continue past it to a later-dated commit. HEAD is the CI point when it qualifies. When a run rule applies but no listed commit qualifies, CI is `unknown`. `live.json` records `dims.ci.now_commit`: HEAD when a file rule decided, the CI point when a run rule decided, and null when unknown. The card shows it.

**FR-C.4** (MUST) Release class at a point with commit date D. Consider only tags dated on or before D, using the tag's own date or, failing that, its target commit's date. A non-draft release counts only if its tag is considered. The release's publish date is not used, because a release can be published minutes after the commit it tags.
- R1: none.
- R3: a release targets the point's commit, or any considered release has at least one uploaded asset.
- R2: otherwise. Releases or tags exist but point at earlier commits, with no uploaded asset.

**FR-C.5** (MUST) License class at a point, from the license files at that commit:
- `Rider`: the text contains the OpenAI/Anthropic rider.
- `plain MIT`: MIT text without a rider.
- `none`: no license file, which the matrix records as "no operative grant".
- `other:<SPDX or first line>`: anything else.

**FR-C.6** (MUST) Every classification carries the evidence URLs it used and a RULEBOOK §1 tier: `[External, High]` for API facts, `[Code-verified, High]` for parsed workflow files.

**FR-C.7** (SHOULD) Whether a workflow runs tests, deploys, or does something else is decided from its YAML (jobs, steps and `uses:`), not from its file name. The decision rule lives in one exported function with its own cases.

## FR-T: triggers

**FR-T.1** (MUST) For each repository and each dimension in {ci, rel, license}, `at_pin = classify(facts, pin)` and `now = classify(facts, now)`. A class crossing is `now != at_pin` when both are known.

**FR-T.2** (MUST) If `at_pin` differs from the matrix value, the dimension is `untracked` for that repository, and the difference must have a `DISCREPANCIES.md` entry. An untracked dimension raises a crossing, labelled `source: event-fallback`, only when both of these hold: an event rule of `watch/README.md` fires for it, and its computed class at the baseline differs from its computed class now. FR-T.4 applies to untracked dimensions too, so an event that changes no computed class stays informational.

**FR-T.3** (MUST) These always raise a crossing with `source: existence`: archived or unarchived, deleted or made private, and a pin that is no longer an ancestor of HEAD.

**FR-T.4** (MUST) An event that changes no computed class raises no crossing and no issue. Examples are a new tag on a repository already at R3, and a workflow added without changing C. It is kept as informational in `watch/changes/` and counted in `live.json`.

**FR-T.5** (MUST) `unknown` on either side is never a crossing, and it is never reported as unchanged. The repository's state is `unknown` for that dimension.

**FR-T.6** (SHOULD) To stop flapping, a class crossing opens only when it holds on two consecutive daily observations. `existence` crossings open immediately.

**FR-T.7** (SHOULD) Every packet's §4.11 revisit triggers are parsed into `watch/freshness/revisit.tsv`: repo, trigger number, text, detector, parameters, reviewed_by. The detector comes from a closed vocabulary: `release.first`, `ci.class`, `license.text`, `archived`, `contributors.second_human`, `dependency.edge`, `human`. Machine detectors raise crossings with `source: revisit`. `human` triggers are listed, never alerted.

**FR-T.8** (MUST) A crossing is resolved only by a dated re-check `updates/<repo>-<date>.md` whose cells table records the class at its re-check pin. From then on, that re-check pin and those classes are the repository's baseline for FR-T.1.

**FR-T.9** (SHOULD) A verdict is `due` for a delta re-check when it has an open crossing, or when 90 days have passed since its baseline date.

**FR-T.10** (MUST) An open crossing with `source: class`, whose computed class returns to its baseline value and stays there for two consecutive daily observations, is closed as `withdrawn`: the class moved and then moved back, so nothing needs a re-check. A dated re-check is still the only way to *resolve* a crossing (FR-T.8). A crossing that is withdrawn and later moves again opens as a new crossing, with a new `since` date. Crossings from any other source (`existence`, `event-fallback`, `revisit`) are never withdrawn.

## FR-L: live data and live card

**FR-L.1** (MUST) `watch/live.json` (schema `fr.watch.live/v1`) is written with every `--apply`. For each repository it holds the pin, the baseline, head and dates, commits since the pin, the latest release, and per dimension `{matrix, at_pin, now, tracked}`. It also holds existence facts, open crossings with evidence and source, revisit counts, `state` (one of `current`, `changed`, `due`, `unknown`) and totals. Key order is fixed. Given the same facts and the same `checked_at`, the output is byte-identical.

**FR-L.2** (MUST) `live.json` stays under 96 KB and contains nothing but facts and computed classes. It carries no free text from upstream except tag names and file names, and it escapes those.

**FR-L.3** (MUST) Every `site/briefs/<repo>.html` carries a region `<!-- live:card -->…<!-- /live:card -->`. It is rendered at build time from the committed `watch/live.json`, and it works without JavaScript. It shows the pinned verdict date and the "live, as of" time. It shows the computed CI, release and license classes now, next to the pinned ones. It shows commits since the pin, the latest release, and a state badge whose meaning is in text, not only colour. It links to the evidence.

**FR-L.4** (MUST) The card never states or implies that a verdict changed. `changed` reads as "a computed class moved since the pin; the verdict has not been re-checked".

**FR-L.5** (MUST) The card region equals a fresh render from `watch/live.json`. A check mode fails otherwise, following the brief-strip `--check` pattern. Nothing outside the region is touched.

## FR-D: dashboard issue

**FR-D.1** (MUST) The scheduled run keeps exactly one trusted dashboard issue, titled `[watch] Freshness dashboard` and labelled `watch` and `dashboard`. It edits the body in place, and only when the rendered body changed. If more than one trusted dashboard exists, the oldest is canonical. Each newer trusted one is closed, with a comment linking the canonical issue, and the run reports it. An issue that is not trusted is never changed.

**FR-D.2** (MUST) Trust rules match `watch/README.md`. An issue counts only if the token's own identity authored it, it carries the labels, and it has the marker `<!-- watch-dashboard: v1 -->`. A same-title issue from anyone else is never edited. The lookup (FR-D.6) filters by creator, so such an issue is normally never read. When the API returns one anyway, it is reported as ignored. A closed trusted dashboard is reopened, because it is a living document, not a finding.

**FR-D.3** (MUST) The body has these sections, in this order:
- Changed: open crossings, one row each, with repo, dimension, from and to, since, evidence and a re-check link.
- Due for re-check.
- Unknown: repositories and dimensions the watch could not read.
- New repositories flagged as candidates.
- Revisit triggers a machine cannot observe: counts and a link.
- Informational: counts only.

Upstream text is Markdown-escaped with the existing `mdText`.

**FR-D.4** (MUST) The run opens no per-event issues for assessed repositories. The `--issues` path for them is retired. New-repository candidates are listed on the dashboard. Issue text stays under GitHub's 65,536-character limit and ends with a link to `live.json` if it has to be cut.

**FR-D.5** (MUST) The dashboard is synced only after the run's generated files have passed the gate chain and been pushed. It is rendered from the committed `watch/live.json`. A failed gate or push leaves the issue unchanged. A failed sync is reported and does not undo the pushed files. The sync command refuses to run unless the repository's HEAD equals the tip of the default branch on GitHub, read from the API at sync time, so a feature branch or a detached checkout can never publish to the canonical dashboard. On that refusal it makes no issue lookup at all, in `--dry-run` too.

**FR-D.6** (MUST) Finding the dashboard is bounded. The run lists issues by the `dashboard` label and the token's own identity as creator, with every state included, and reads at most 3 pages of 100. If the listing is incomplete or hits that bound, the sync fails closed: it creates nothing and edits nothing.

## FR-G: weekly digest

**FR-G.1** (MUST) `site/feed.xml` carries at most one watch digest entry per ISO week, dated the last day of that week that had data. It lists the crossings opened, resolved and withdrawn that week. A week with none of these gets no entry. Informational events never produce feed entries.

**FR-G.2** (MUST) The digest is built only from committed files: the append-only crossing ledger `watch/crossings.jsonl`, with one line per crossing opened, resolved or withdrawn, and `updates/`. The feed stays byte-identical on reruns, as gate M requires today.

**FR-G.3** (MUST) `watch/crossings.jsonl` is append-only. Each `--apply` that opens, resolves or withdraws a crossing appends one line per event, with fixed key order: `{date, event: opened|resolved|withdrawn, id, repo, dim, from, to, source, evidence, resolved_by}`. For `withdrawn`, `resolved_by` is null. A run whose output does not start with the previous committed file, byte for byte, fails.

## FR-O: scheduled jobs

The repository's scheduled jobs are the GitHub Actions workflows: `watch.yml` (daily), `discover.yml` (weekly), `verify.yml` (weekly), and `deploy.yml`, which runs after each of the others and on every push. Nothing in this repository relies on a local cron.

**FR-O.1** (MUST) `ops/schedule.tsv` has one row per generated artifact that this contract, or later work, adds. Columns: artifact (path or glob), generator command, workflow file, cadence, and the gate that fails when the committed artifact differs from a fresh run. Today that means `watch/live.json`, `watch/crossings.jsonl`, the live:card regions, and the feed's weekly digest entries; the search index joins later. Artifacts that existed before 2026-09-25 are out of scope and are not retrofitted.

**FR-O.2** (MUST) A check fails in each of these cases:
- A row's generator command does not appear in the named workflow file.
- A row's gate is not in `site/scripts/verify-site.sh`.
- A script under `watch/freshness/`, or `site/scripts/make-live.mjs`, writes committed files but has no row. A script that calls a file-write API must declare its committed outputs in a `// writes:` header, and a write call with no header also fails. Goldens and recorded fixtures are exempt: only a person rewrites them, goldens with `UPDATE_GOLDENS=1` and fixtures with a recorder named in `fixtures/PROVENANCE.md`, and the diff is reviewed before commit. A scheduled job never rewrites either.

So a new generated artifact that no scheduled job refreshes cannot land.

**FR-O.3** (MUST) The watch covers the 44 assessed repositories and every repository listed in a cohort matrix `cohorts/*/matrix.md`. A cohort matrix uses the master matrix's columns and legend. It is written only after the cohort packets pass their independent review, and its rows are the FR-T.2 reference for those repositories. `live.json` totals report pinned and cohort counts separately. With no cohort matrix, the cohort count is 0 and is reported as 0.

**FR-O.4** (SHOULD) The deploy job's smoke step warns when `watch/live.json` `checked_at` is more than 36 hours old, which means a missed daily run. The dashboard shows the time of the last run.

**FR-O.5** (SHOULD) Vendored snapshots listed in `ops/schedule.tsv` carry their build date. The dashboard shows each snapshot's age, and a snapshot more than 30 days old is due for a rebuild.

**FR-O.6** (MUST) The scheduled watch runs as two jobs, and both run only on `refs/heads/main`, whether triggered by the schedule or dispatched by hand. The first job installs dependencies, runs the watch, builds and runs the gate chain. Its token is read-only (`contents: read`, `issues: read`) and its checkout does not persist credentials. It hands the generated files to the second job as an artifact. The second job holds the write permissions. It installs nothing and runs no build or gate. It runs only dependency-free scripts from the repository: it applies the artifact, checks that only generated paths changed (the briefs guard), then commits, pushes, and syncs the dashboard, in that order. A static check (W3) enforces this split: no write permission in the first job, no install, build or gate step in the second, no `git push` after the sync, and the checkout in both jobs never persists credentials. The job boundary, not pattern-matching on step text, is what keeps the write token away from dependency code. The check also rejects the following: in the build job, any permission value other than `read` or `none`, whatever the scope name; in either job, an action reference that is not a full 40-hex commit SHA; in the publish job, any environment variable other than `GITHUB_TOKEN` on the push and sync steps, at step, job or workflow level (this excludes loader variables such as `NODE_OPTIONS`); a `node` invocation other than `node <allowlisted script> [args]`; and, in the artifact copier, a destination whose path contains a symlink or which exists and is not a regular file. Every `run` body in the publish job is pinned to reviewed text: the check compares each one byte for byte with the canonical text held in the checker. Changing any publish step, token-bearing or not, therefore requires changing the checker in the same reviewed commit.

## FR-H: harness and measurement

**FR-H.1** (MUST) Differential fidelity: over all 44 repositories and the three dimensions, `classify(pin facts)` is compared with the matrix. Each mismatch is XFAIL with a `DISC-NNN` entry, or it is a failure. The report gives agreement per dimension as matched / 44.

**FR-H.2** (MUST) Spec coverage: every MUST clause in this file has at least one case that passes or XFAILs, tagged with its id. The runner reads the clause list from this file, so coverage always matches the spec text.

**FR-H.3** (MUST) Goldens freeze these outputs: the dashboard body, `live.json`, the card for at least three repositories covering different states, and one digest entry. They are rendered with an injected `checked_at`, so no scrubbing is needed. `UPDATE_GOLDENS=1` rewrites them; a mismatch writes `<name>.actual` and fails with the first differing line.

**FR-H.4** (MUST) Labelled events: these must raise a crossing:
- frankengit CI C3→C5 at `dfa5bb8`.
- franken_code_browser release R1→R3 at `c7c5310`.

These must not raise one:
- frankenterm tags v0.15.8–v0.15.12.
- frankensearch tag `frankensearch-quill-v0.3.2`.
- Every workflow-addition event in issues #2, #3, #4, #6 and #7 whose class did not change.

The report gives precision and recall on this set, and names its size.

**FR-H.5** (SHOULD) Replay noise: recorded daily states are run through the old event rule and through FR-T, and the report compares flags per day under each.

**FR-H.6** (MUST) Mutation: each named mutant of the classifier and the trigger rule fails at least one named case. The mutants cover each FR-C.2 rule order, FR-C.3, FR-C.4, FR-T.2, FR-T.4 and FR-T.5.

**FR-H.7** (MUST) Fixtures record their provenance in `watch/freshness/fixtures/PROVENANCE.md`: the command, the UTC time, the API endpoints, and the git ref of this repository.

**FR-H.8** (MUST) `watch/freshness/REPORT.md` is generated by the harness and never edited by hand. It holds fidelity, coverage, labelled-event precision and recall, replay noise and the mutation score. Gate W3 fails if it differs from a fresh run.

## Harness interface (fixed)

- Case modules live in `watch/freshness/cases/*.cases.mjs`. Each has a default export: an array of `{ id, clauses: ['FR-…'], level: 'MUST'|'SHOULD'|'MAY', title, run(ctx) }`.
- `run` returns `true`, or `{ pass, detail?, xfail? }`, where `xfail` is a `DISC-NNN` id.
- `ctx` = `{ root, fixtures, golden(name, text), updating }`.
- `node watch/freshness/harness/run.mjs` prints one JSON line per case, then the coverage table. It exits 0 when every case passes or XFAILs and every MUST clause is covered, 1 otherwise, and 2 on a harness error.
- A result may also carry `metrics: { name: value }`. The runner collects these into `REPORT.md` (FR-H.8), and a metric that no case reports is shown as `not measured`, never as zero.

## Amendment log

| Date | Clause | Change | Evidence |
|---|---|---|---|
| 2026-09-25 | FR-C.2 | C1 no longer requires every run to succeed: a cancelled, skipped or neutral run gives no verdict. C5 now tests whether a test workflow triggers on push or pull request, instead of any workflow. A disabled workflow triggers on nothing, and its state applies at an earlier point only if it was updated on or before that commit. | FreshCore found two rule gaps: mixed success and cancelled runs matched no rule, and dispatch-only test workflows next to a push-triggered deploy workflow matched no rule. Both returned `FR-C.2/no-rule`. frankensearch and franken_networkx depend on the disabled-state reading. |
| 2026-09-25 | FR-C.4 | A release counts only if its tag's date (the tag's own, else its target commit's) is on or before the point; the publish date is not used. | franken_code_browser v0.1.0 was published 3 minutes after the commit it tags (c7c5310). Filtering by publish date would make FR-H.4's labelled R3 impossible. |
| 2026-09-25 | FR-O.2 | Goldens and recorded fixtures are exempt from the schedule check, and write calls need a `// writes:` header. | FreshHarness: a scheduled job must never rewrite a golden or a fixture, or the harness would test against whatever the API says today. |
| 2026-09-25 | FR-C.3 | `now` for CI is the newest default-branch commit whose push-triggered test runs have all completed, not HEAD. CI is unknown only when no listed commit qualifies, and `dims.ci.now_commit` records which commit was used. | First live run: 13 of 44 repositories had CI `unknown`, all at HEAD, because runs were in progress or HEAD was under 6 hours old. The most active repositories would never get a CI class under the old rule. |
| 2026-09-25 | FR-C.3 | Two guards. File rules read HEAD's workflow files; run rules read the CI point. A CI point dated before the baseline commit is never used. | FreshCore, fixture recorded 02:04 UTC: the newest settled commit was HEAD for 9 repositories, an older commit for 27, and none for 8. frankengit's was 870c1cc, from before its 2026-09-22 workflow removal. Without the guards it read C3 against a C5 baseline, and franken_markdown, franken_whisper and franken_snowflake took classes from old commits' files. |
| 2026-09-25 | FR-T.10 (new), FR-G.1, FR-G.3 | A crossing whose class returns to its baseline and stays there for two observations is withdrawn; the ledger and the digest gain a `withdrawn` event. | Live run 2026-09-25T02:10Z: all 5 pending crossings were CI flips on active repositories (franken_node C2 to C1, franken_threed and frankenscipy C1 to C2, franken_remote C3 to C2, franken_snowflake C3 to C5). Before this change, a flip that held two days opened a crossing that stayed on the dashboard until someone wrote a re-check, even after CI went green again. That is the kind of stale report this contract exists to remove. |
| 2026-09-25 | FR-T.2, FR-T.10, FR-C.3, FR-D.1, FR-D.5 (new), FR-D.6 (new), FR-G.2, FR-O.6 (new) | The event fallback needs a class change (FR-T.4 wins). Only class crossings are withdrawn. A commit with no push-triggered test run is never the CI point. There is exactly one trusted dashboard, and newer trusted duplicates are closed. The sync runs after the gates and the push, from committed data. Finding the dashboard is bounded and fails closed. The ledger description includes withdrawn. The write job is main-only and runs without persisted credentials. | Independent review 3 (GPT-6-Luna, 2026-09-25, NEEDS FIXES), findings P2 x5 and P3 x4. The review reproduced an R3-to-R3 fallback crossing, a withdraw-then-reopen cycle on an event-fallback crossing, a surviving mid-line truncation mutant, and a checkout that persists a write token during install and gates. |
| 2026-09-25 | FR-D.2 | Because the lookup filters by creator (FR-D.6), a same-title issue from someone else is normally never read; it is still never edited, and it is reported only when the API returns it. | FreshOutputs, while implementing FR-D.6: the creator-filtered listing makes the old reporting clause unreachable. |
| 2026-09-25 | FR-C.3 | The selection order is stated: the first qualifying commit in the newest-first run page. If it predates the baseline, CI is unknown rather than a search further down the page. | FreshCore: the two readings differ only when an old commit is re-pushed ahead of newer ones; this one errs toward unknown. GitHub's run listing sometimes serves a stale page on busy repositories (frankenlibc, 2026-09-25 04:00-04:07Z), which gives unknown, never a wrong class. |
| 2026-09-25 | FR-D.5, FR-O.6 | The sync refuses unless HEAD is the GitHub default-branch tip. The write-job check covers bracket notation, `uses` steps, `with:` inputs, and any push after the sync. | Independent review 3b (GPT-6-Luna): all nine review-3 findings FIXED. Two new residuals: three plants that ops/write-job.mjs missed (`secrets['GITHUB_TOKEN']`, a token on a `uses` step, a second push after the sync); and a detached clone could dry-run the sync against the canonical issue. |
| 2026-09-25 | FR-O.6, FR-D.5 | The watch is split into a read-only build-and-gate job and a write job that installs nothing and runs no build. A canonical-tip refusal makes no issue lookup. | Review 3c (GPT-6-Luna): the static check missed a token passed on through `$GITHUB_ENV` and `$GITHUB_OUTPUT`, and a refused dry-run still listed issues. Pattern-matching step text cannot close every path a token can take within one job; a job boundary can. |
| 2026-09-25 | FR-O.6 | The build job may hold only read or none permissions, for any scope. Actions must be pinned to a full commit SHA. The publish job accepts only `GITHUB_TOKEN` as an environment variable, and runs `node` only as `node <allowlisted script>`. The artifact copier refuses destinations that pass through a symlink. | Review 3d (GPT-6-Luna): the job-boundary design held, but the checker let through four mutations. `discussions: write` in build; `NODE_OPTIONS=--import=<file>` on the sync step, which ran a preloaded module that could read the token (the reviewer used a fake canary token); floating `@v4` action tags; and a destination symlink that redirected an allowed artifact path onto `ops/briefs-guard.mjs`. None of the four occurs in the current watch.yml; all four are checker gaps. |
| 2026-09-25 | FR-O.6 | Publish-job run bodies are pinned byte for byte to reviewed text held in the checker. | Review 3e (GPT-6-Luna) found the current watch.yml safe under the pinned-action trust model. It rated HIGH one uncaught mutation: a `curl` exfiltration line appended to the token-bearing push step, which the checker passed because it allowed the step by role, not by content. |
