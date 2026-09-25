# Freshness: runbook

The daily watch used to open one GitHub issue per material event. On its first day, 2026-09-24, it opened twelve (#1 to #12), and only #5 led to a correction. From 2026-09-25 the watch works to a written contract instead, [`SPEC.md`](SPEC.md):

- it computes the CI, release and license classes of each repository at its pin and now, and flags a verdict only when a computed class moves (FR-C, FR-T);
- every brief carries a live card with those computed facts, each marked "as of" (FR-L);
- one dashboard issue and one weekly feed entry replace the per-event issues (FR-D, FR-G);
- every generated file it adds is refreshed by a scheduled job and checked by a gate (FR-O);
- all of it is tested against the contract by the harness in this directory, which gate W3 runs (FR-H).

This file is the process: what is measured and why, how to run it, and how to change it without weakening it.

## What is measured, and why

| Measure | Clause | Why it exists |
|---|---|---|
| Spec coverage: every MUST clause has a case that passes, or XFAILs on a written discrepancy | FR-H.2 | A clause nobody tests is a promise, not a property. The runner reads the clause list from `SPEC.md` itself, so a new clause is uncovered until someone writes its case. |
| Fidelity: the machine's class at each pin against the analysts' master matrix, per dimension, as matched/44 | FR-H.1 | The matrix (`synthesis/00-overview.md`) is the reference oracle. A classifier that disagrees with the analysts where both read the same facts would flag noise or miss real moves. Every disagreement is a `DISC` entry; the matrix is never edited to match the machine. |
| Labelled events: precision and recall on a named set, with its size | FR-H.4 | Two real events must raise a crossing and a list of real non-events must not. Small, but every item is a real day of the watch. |
| Replay noise: flags per day under the old event rule and under class triggers | FR-H.5 | The reason for this work was noise. This measures whether it went down on recorded days. |
| Mutation score: planted bugs in the classifier and trigger rule, each caught by a named case | FR-H.6 | A green case that cannot fail proves nothing. Each mutant is a plausible bug; a survivor means a case is missing. |
| Schedule check | FR-O.2 | A generated file that no scheduled job refreshes goes stale silently. |

All of these land in [`REPORT.md`](REPORT.md), which the harness writes and gate W3 checks. A metric no case reports is printed as `not measured`, never as zero.

## Running it

```bash
node watch/freshness/harness/run.mjs                  # every case, JSON lines, coverage table (bun run freshness)
node watch/freshness/harness/run.mjs --only HAR       # cases whose id starts with HAR; coverage not enforced
node watch/freshness/harness/run.mjs --ids A,B        # exactly these cases (what the mutation runner uses)
node watch/freshness/harness/run.mjs --clauses        # the clause list parsed from SPEC.md
node watch/freshness/harness/run.mjs --report         # full run, then write REPORT.md
node watch/freshness/harness/run.mjs --check-report   # full run; exit 1 if REPORT.md differs from a fresh render
node watch/freshness/harness/mutate.mjs               # every mutant in harness/mutants.json
node ops/schedule.mjs                                 # the schedule check (FR-O.1, FR-O.2)
```

The runner prints one JSON line per case (`id`, `clauses`, `level`, `verdict`, `detail`, `title`, and `metrics` when a case reports any), then the coverage table, then `CASES`, `PASS`, `XFAIL`, `FAILED`, `UNCOVERED_MUST` and `SECONDS` lines. Exit codes: 0 when every case passes or XFAILs and every MUST clause is covered; 1 on a failed case, an uncovered MUST clause (full runs only), an empty case set, or a stale `REPORT.md` with `--check-report`; 2 on a harness error, which includes an unknown clause id in a case, a duplicate case id, a clause line in `SPEC.md` the parser cannot read, and bad arguments.

Gate W3 in `site/scripts/verify-site.sh` runs `--check-report` (whose case HAR-H6-mutants runs `mutate.mjs` on every mutant; the gate reads that case's counts rather than running the mutants twice), `ops/schedule.mjs`, `ops/write-job.mjs` and `node site/scripts/make-live.mjs --check`, and passes only when all four do. The scheduled watch (`.github/workflows/watch.yml`) runs `--report` after the watch, so the report it commits matches what W3 checks.

## The scheduled run

`.github/workflows/watch.yml` runs two jobs (FR-O.6), both only on `refs/heads/main` (a hand dispatch from another branch is skipped), and neither checkout persists credentials.

`build`, with a read-only token (`contents: read`, `issues: read`):

1. install dependencies;
2. `node watch/watch.mjs --apply` (GitHub API reads);
3. build: `make-live.mjs`, `make-feed.mjs`, `run.mjs --report`;
4. the gate chain, `bun run verify`;
5. upload the generated files, exactly the list in `ops/take-build-output.mjs` `PATHS`, as the artifact `watch-output`.

`publish`, which needs `build` and holds `contents: write` and `issues: write`:

1. check out the same commit, and download the artifact to `$RUNNER_TEMP`, outside the checkout;
2. `node ops/take-build-output.mjs`, which copies in the generated paths and fails the run, copying nothing, if the artifact holds any other path;
3. `node ops/briefs-guard.mjs`, then commit `watch/`, `site/feed.xml` and `site/briefs/`;
4. push, with the token passed to that one `git push` as `-c http…extraheader`, never written to `.git/config`;
5. `node watch/freshness/dashboard.mjs --sync watch/live.json`, with the token, from the committed `watch/live.json` (FR-D.5).

A failed gate stops `build`, so `publish` never runs; a failed push skips the sync, so the issue never describes files that did not land. The job boundary is the control: the build job's token cannot write, whatever a dependency does with it, and the publish job runs no dependency code. Pattern matching on step text cannot close every way a token moves inside one job (a step can copy it into `$GITHUB_ENV` or `$GITHUB_OUTPUT`), which is why the split exists. The artifact is downloaded outside the checkout and applied path by path because it comes from the job that runs dependency code: applied over the checkout, it could replace `watch/freshness/dashboard.mjs` or `ops/briefs-guard.mjs`, which `publish` then runs with the write token.

`ops/write-job.mjs` fails W3 when a job lacks the main-only guard; when a checkout persists credentials; when the workflow, or any job but `publish`, grants a write scope, or `build` names no permissions of its own; when `build` references a secret other than `GITHUB_TOKEN`, runs no gate chain, uploads before it, or uploads a list that differs from `PATHS`; when `publish` does not need `build`, uses an action other than checkout, setup-node and download-artifact, downloads inside the checkout, runs an install, build or gate command or an interpreter other than node, or runs a node script other than `ops/take-build-output.mjs`, `ops/briefs-guard.mjs` and `watch/freshness/dashboard.mjs`; when a `publish` step other than the push and the sync receives the token (in env, `with:` or run text, as `github.token`, `secrets.GITHUB_TOKEN` or a bracket form, in any case), or a run line writes a credential into the Git config; when `publish` does not apply, guard, push and sync in that order, or pushes after the sync; and when any of those three scripts, or anything they import, imports a package or uses a non-literal `import()` or `require()`.

## Layout

| Path | What |
|---|---|
| `SPEC.md` | The contract: clauses with stable ids, RFC 2119 levels. |
| `DISCREPANCIES.md` | Every known disagreement between the machine and the matrix, or between the code and the spec. |
| `REPORT.md` | Generated by `--report`. Never edit it by hand. |
| `cases/*.cases.mjs` | The cases. `core*` for the classifier, triggers and live data; `outputs*` for the card, dashboard and digest; `harness*` for the harness and the schedule. |
| `fixtures/` | Recorded inputs, with `fixtures/PROVENANCE.md`. |
| `goldens/` | Frozen outputs. `*.actual` files are mismatch output and are gitignored. |
| `harness/run.mjs` | The runner. |
| `harness/mutate.mjs`, `harness/mutants.json` | The mutation runner and the mutants. |
| `../../ops/schedule.tsv`, `../../ops/schedule.mjs` | The generated-artifact schedule and its check. |
| `../../ops/stale-run.mjs` | The missed-run warning in the deploy smoke step (FR-O.4). |
| `../../ops/briefs-guard.mjs` | Refuses a scheduled commit that changes a brief outside its live card. |
| `../../ops/write-job.mjs` | Checks the two-job split: main only, no persisted credential, write permission in `publish` only, nothing but listed dependency-free scripts in `publish`, the dashboard sync last (FR-O.6, FR-D.5). |
| `../../ops/take-build-output.mjs` | In `publish`: copies the generated paths from the build artifact into the checkout, and refuses an artifact that holds anything else. |

## Adding or changing a clause

1. Add a new clause with the next free id in its section: `**FR-X.N** (MUST|SHOULD|MAY) text`, at the start of a line. Never renumber and never reuse an id.
2. To change what a clause requires, add a new id with the new text and mark the old one retired: `**FR-X.N** (RETIRED YYYY-MM-DD: replaced by FR-X.M) old text`. A retired clause needs no case.
3. The runner refuses a line that starts with a bold clause id but does not match the grammar (for example `(must)`), because a clause it skipped would silently need no case.
4. A new MUST clause makes the full run exit 1 until a case covers it. That is the point.

## Adding a case

A case is `{ id, clauses: ['FR-…'], level, title, run(ctx) }` in a `cases/*.cases.mjs` default-export array. `run` returns `true` or `{ pass, detail?, xfail?, metrics? }`; `ctx` is `{ root, fixtures, golden(name, text), updating }`. Read repository files through `ctx.root`, never through an absolute path, so the mutation runner's copy tests itself.

Before committing a case, prove it can fail: plant the bug it guards against (in a scratch copy, or as a mutant), watch the case FAIL, remove the plant, watch it PASS. A case that has never failed has not been tested. Say in the commit which plant you used.

A case file under `watch/freshness/` that writes any file, even a temporary one, carries a header line `// writes: temporary files only` (FR-O.2; see below).

## Adding a discrepancy

When the machine and the matrix disagree, or the code departs from `SPEC.md` on purpose, add an entry to `DISCREPANCIES.md` with the next free `DISC-NNN`:

```
## DISC-NNN: short title
- **Clause:** FR-...
- **Repositories:** ...
- **Machine:** what the classifier computed, with evidence
- **Matrix:** what the analysts recorded, with the line number
- **Why they differ:** facts first, then any inference, labelled
- **Resolution:** ACCEPTED | INVESTIGATING | WILL-FIX (and what that means here)
- **Cases affected:** case ids
- **Review date:** YYYY-MM-DD
```

The affected case returns `{ pass: false, xfail: 'DISC-NNN' }`. The harness counts it as XFAIL only when the entry exists with a Resolution and a Review date; otherwise it is a FAIL. A case that starts passing while still claiming XFAIL is also a FAIL: drop the `xfail`. The matrix is never edited to match the machine; where the matrix disagrees with its own legend, the finding goes to a dated note under `updates/`.

## Goldens

A golden freezes an output that is too large to assert field by field: the dashboard body, `live.json`, the card for repositories in different states, and a digest entry (FR-H.3). Each is rendered with an injected `checked_at`, so it is byte-deterministic and needs no scrubbing.

1. A mismatch fails the case with the first differing line and writes `goldens/<name>.actual` next to the golden. Read `diff goldens/<name> goldens/<name>.actual`.
2. If the change is a bug, fix the code. Never regenerate a golden to make a failure go away.
3. If the change is intended: `UPDATE_GOLDENS=1 node watch/freshness/harness/run.mjs`, then read `git diff watch/freshness/goldens/` line by line, and commit the goldens with the code change that caused them, saying why in the message.
4. `--report` refuses to run while `UPDATE_GOLDENS=1` is set, and no scheduled job ever sets it (FR-O.2).

### Golden confidence matrix

| Golden | Rendered from | Deterministic | Platform-dependent | Volatility (1 to 5) | Strategy |
|---|---|:-:|:-:|:-:|---|
| `goldens/core/live.json` | `computeFreshness` and `renderLiveJson` on `fixtures/core/reference.json` and `fixtures/core/blobs.json.gz` (44 repositories at pin, HEAD and the labelled points), no previous `live.json`, empty ledger; `checked_at` is the fixture's `recorded_at` | Y | N | 3 | exact |
| `goldens/outputs/card-frankengit-changed.html` | `renderCard` on `fixtures/outputs/live-states.json`, `checked_at` 2026-09-24T06:12:45Z | Y | N | 2 | exact |
| `goldens/outputs/card-franken_code_browser-current-resolved.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/card-frankensearch-due.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/card-franken_tts-unknown.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/card-frankenterm-escaping.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/card-franken_engine-untracked-ci-not-head.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/card-frankenfs-withdrawing.html` | the same fixture and `checked_at` | Y | N | 2 | exact |
| `goldens/outputs/core-card-frankengit-rechecked.html` | `renderCard` on `goldens/core/live.json`, `checked_at` 2026-09-25T04:02:38Z | Y | N | 3 | exact |
| `goldens/outputs/core-card-franken_node-pending.html` | the same input and `checked_at` | Y | N | 3 | exact |
| `goldens/outputs/core-card-asupersync-unknown.html` | the same input and `checked_at` | Y | N | 3 | exact |
| `goldens/outputs/core-card-franken_lean-ci-earlier-commit.html` | the same input and `checked_at` | Y | N | 3 | exact |
| `goldens/outputs/dashboard-states.md` | `renderDashboard` on `fixtures/outputs/live-states.json` with one snapshot row built 2026-08-01, `checked_at` 2026-09-24T06:12:45Z | Y | N | 3 | exact |
| `goldens/outputs/dashboard-quiet.md` | `renderDashboard` on `fixtures/outputs/live-quiet.json`, no snapshots, `checked_at` 2026-10-01T06:00:00Z | Y | N | 3 | exact |
| `goldens/outputs/core-dashboard.md` | `renderDashboard` on `goldens/core/live.json`, `checked_at` 2026-09-25T04:02:38Z | Y | N | 3 | exact |
| `goldens/outputs/digest-entries.xml` | the digest `<entry>` blocks of `make-feed.mjs --crossings fixtures/outputs/crossings.jsonl`, dated from ledger days 2026-09-24 and 2026-10-08; no clock read | Y | N | 2 | exact |

Volatility is how often an intended code change is expected to touch the golden, not how often upstream data changes: the inputs are fixtures, so upstream never changes a golden. The `core-*` goldens render from `goldens/core/live.json`, so a change to the classifier that moves that golden moves them too; that is why they are rated 3.

## Fixtures

Recorded inputs live under `fixtures/`. Each records its command, UTC time, API endpoints and the git ref of this repository in `fixtures/PROVENANCE.md` (FR-H.7). A script that records fixtures declares `// writes: fixtures (manual record, see PROVENANCE.md)` and must be named in `PROVENANCE.md`; only a person runs it, never a scheduled job.

## Adding a mutant

A mutant is one entry in `harness/mutants.json`:

```json
{ "id": "M-C2-order-c5-c4", "file": "watch/freshness/classify.mjs",
  "find": "<an exact substring that occurs once in the file>", "replace": "<the planted bug>",
  "clauses": ["FR-C.2"], "must_fail": ["<case id>", "..."] }
```

`mutate.mjs` copies the parts of the repository the cases read into one temporary directory, runs every `must_fail` case there unmutated (each must PASS, or nothing can be judged), then for each mutant replaces `find` with `replace`, runs `run.mjs --ids <must_fail>` in the copy, and restores the file. A mutant is killed when every `must_fail` case FAILs. A `find` that is missing or occurs twice, and a mutant that makes the harness itself crash (exit 2), are errors, not kills. FR-H.6 requires at least five `FR-C.2` mutants (one per adjacent pair in the rule order C6, C5, C4, C2, C1, C3) and at least one each for FR-C.3, FR-C.4, FR-T.2, FR-T.4 and FR-T.5; case `HAR-H6-mutants` fails otherwise. If a mutant survives, the fix is a case that fails on it, not a weaker mutant.

## Adding a generated artifact

Every file a scheduled job generates for this contract (and later work) has a row in `ops/schedule.tsv`: artifact, generator command, workflow file, cadence, gate, and `snapshot_built` (a date for a vendored snapshot, else `-`). The schedule check fails when a row's command is not on a non-comment line of its workflow, when its gate has no `echo "== <gate> "` banner in `verify-site.sh`, and when a script under `watch/freshness/` (or `site/scripts/make-live.mjs`) calls a file-writing API without a `// writes:` header or names an artifact that has no row. A header lists committed outputs separated by `, `; the only other values are `temporary files only`, `goldens (UPDATE_GOLDENS=1)` and `fixtures (manual record, see PROVENANCE.md)`.

## How a crossing is resolved

A crossing means a computed class moved since the baseline, or the repository itself changed. It does not mean the verdict changed, and nothing on the card or the dashboard says it did. Only an analyst resolves it:

1. Write a dated re-check `updates/<repo>-YYYY-MM-DD.md` under [`updates/METHOD.md`](../../updates/METHOD.md) rules 3 to 6. Its header carries `**Re-check pin:** \`<40-hex sha>\` (<date>)`, and its matrix-cells table has rows `CI class`, `Release class` and `License` with the value at the pin and at the re-check. "unchanged" keeps the pinned value.
2. Have a separate session review it.
3. From the next watch run on, that re-check pin and its classes are the repository's baseline (FR-T.8). The crossing gets a `resolved` line in `watch/crossings.jsonl` naming the re-check, and leaves the dashboard; the weekly digest lists it as resolved.

A class crossing (`source: class`) can also close without a re-check: when its class returns to the baseline value and stays there for two consecutive daily observations, the watch appends a `withdrawn` line, with `resolved_by` null, and the digest lists it as withdrawn (FR-T.10). Crossings from any other source are never withdrawn.

A verdict is also due for a re-check 90 days after its baseline date, with or without a crossing (FR-T.9).
