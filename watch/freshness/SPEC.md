# Freshness contract (watch v2)

Status: v1, 2026-09-25. Clause ids are stable. Change a clause only by adding a new id and marking the old one `RETIRED`; never renumber.

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

**FR-C.2** (MUST) CI class at a point, taking the first rule that holds:
- C6: no public workflow runs the tests, and every run on the point's commit sits on a self-hosted runner or is queued or cancelled. Or the facts carry `private_ci: true`. That flag comes only from a packet statement, and the harness records its source.
- C5: workflow files exist, but none triggers on `push` or `pull_request` to the default branch, or every test workflow is disabled in the Actions API. Or workflow files that existed at the pin are gone at `now`.
- C4: no workflow file at the point runs tests. There are none, or only deploy/pages workflows.
- C2: at least one completed test-workflow run on the point's commit, triggered by `push` or `pull_request`, concluded `failure`, `timed_out` or `startup_failure`.
- C1: at least one such run exists, and all such runs concluded `success`.
- C3: test workflows trigger on push or pull request, but no completed run exists on the point's commit.

**FR-C.3** (MUST) Runs still in progress, and API gaps, give `unknown` for CI, never C3. For `now`, a HEAD younger than 6 hours with no completed test run is also `unknown`.

**FR-C.4** (MUST) Release class at a point with commit date D. Consider only non-draft releases, and tags whose date (the tag date, else the target commit's date) is on or before D.
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

**FR-T.2** (MUST) If `at_pin` differs from the matrix value, the dimension is `untracked` for that repository, and the difference must have a `DISCREPANCIES.md` entry. An untracked dimension raises no class crossings. Its changes are flagged by the event rules of `watch/README.md` instead, labelled `source: event-fallback`.

**FR-T.3** (MUST) These always raise a crossing with `source: existence`: archived or unarchived, deleted or made private, and a pin that is no longer an ancestor of HEAD.

**FR-T.4** (MUST) An event that changes no computed class raises no crossing and no issue. Examples are a new tag on a repository already at R3, and a workflow added without changing C. It is kept as informational in `watch/changes/` and counted in `live.json`.

**FR-T.5** (MUST) `unknown` on either side is never a crossing, and it is never reported as unchanged. The repository's state is `unknown` for that dimension.

**FR-T.6** (SHOULD) To stop flapping, a class crossing opens only when it holds on two consecutive daily observations. `existence` crossings open immediately.

**FR-T.7** (SHOULD) Every packet's §4.11 revisit triggers are parsed into `watch/freshness/revisit.tsv`: repo, trigger number, text, detector, parameters, reviewed_by. The detector comes from a closed vocabulary: `release.first`, `ci.class`, `license.text`, `archived`, `contributors.second_human`, `dependency.edge`, `human`. Machine detectors raise crossings with `source: revisit`. `human` triggers are listed, never alerted.

**FR-T.8** (MUST) A crossing is resolved only by a dated re-check `updates/<repo>-<date>.md` whose cells table records the class at its re-check pin. From then on, that re-check pin and those classes are the repository's baseline for FR-T.1.

**FR-T.9** (SHOULD) A verdict is `due` for a delta re-check when it has an open crossing, or when 90 days have passed since its baseline date.

## FR-L: live data and live card

**FR-L.1** (MUST) `watch/live.json` (schema `fr.watch.live/v1`) is written with every `--apply`. For each repository it holds the pin, the baseline, head and dates, commits since the pin, the latest release, and per dimension `{matrix, at_pin, now, tracked}`. It also holds existence facts, open crossings with evidence and source, revisit counts, `state` (one of `current`, `changed`, `due`, `unknown`) and totals. Key order is fixed. Given the same facts and the same `checked_at`, the output is byte-identical.

**FR-L.2** (MUST) `live.json` stays under 96 KB and contains nothing but facts and computed classes. It carries no free text from upstream except tag names and file names, and it escapes those.

**FR-L.3** (MUST) Every `site/briefs/<repo>.html` carries a region `<!-- live:card -->…<!-- /live:card -->`. It is rendered at build time from the committed `watch/live.json`, and it works without JavaScript. It shows the pinned verdict date and the "live, as of" time. It shows the computed CI, release and license classes now, next to the pinned ones. It shows commits since the pin, the latest release, and a state badge whose meaning is in text, not only colour. It links to the evidence.

**FR-L.4** (MUST) The card never states or implies that a verdict changed. `changed` reads as "a computed class moved since the pin; the verdict has not been re-checked".

**FR-L.5** (MUST) The card region equals a fresh render from `watch/live.json`. A check mode fails otherwise, following the brief-strip `--check` pattern. Nothing outside the region is touched.

## FR-D: dashboard issue

**FR-D.1** (MUST) The scheduled run keeps exactly one dashboard issue, titled `[watch] Freshness dashboard` and labelled `watch` and `dashboard`. It edits the body in place, and only when the rendered body changed.

**FR-D.2** (MUST) Trust rules match `watch/README.md`. The issue counts only if the token's own identity authored it, it carries the labels, and it has the marker `<!-- watch-dashboard: v1 -->`. A same-title issue from anyone else is never edited. It is reported as ignored, and a new trusted issue is created. A closed trusted dashboard is reopened, because it is a living document, not a finding.

**FR-D.3** (MUST) The body has these sections, in this order:
- Changed: open crossings, one row each, with repo, dimension, from and to, since, evidence and a re-check link.
- Due for re-check.
- Unknown: repositories and dimensions the watch could not read.
- New repositories flagged as candidates.
- Revisit triggers a machine cannot observe: counts and a link.
- Informational: counts only.

Upstream text is Markdown-escaped with the existing `mdText`.

**FR-D.4** (MUST) The run opens no per-event issues for assessed repositories. The `--issues` path for them is retired. New-repository candidates are listed on the dashboard. Issue text stays under GitHub's 65,536-character limit and ends with a link to `live.json` if it has to be cut.

## FR-G: weekly digest

**FR-G.1** (MUST) `site/feed.xml` carries at most one watch digest entry per ISO week, dated the last day of that week that had data. It lists the crossings opened and resolved that week. A week with neither gets no entry. Informational events never produce feed entries.

**FR-G.2** (MUST) The digest is built only from committed files: `watch/live.json` history and `updates/`. The feed stays byte-identical on reruns, as gate M requires today.

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
