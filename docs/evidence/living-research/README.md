# Living research delivery check

This round connects research observations to runnable user tools and bounded cloud
experiments. It does not establish a 100x improvement in research value.

## What actually ran locally

`kit-revalidation.json` captures seven real commands: 21 installed-kit, 13 decision,
9 review, 3 lifecycle and 7 download tests, the deterministic build check, and the
shipped-copy comparison. The tests extract the generated ZIP, run it in a fresh
project, change an input, observe stale support fail, demote it, move the public
handoff, delete its source project and kit, and run the transferred checkers.
The result remains explicitly subject to review; zero exit is not acceptance.

Changing the verification script invalidated this repository's own old `kit-tests`
evidence. The FR checker demoted its support label. Only after the actual rerun
was that narrow regression claim rebound to the new receipt and input hashes in
`../fr-evolution/decisions.json`. The research `net-benefit` claim stays provisional.
A separate delivery reviewer inspected the actual archive, fresh installation,
moved transfer, receipt binding and publisher rejection boundary. No scoped
blocker remained. Desktop and phone Apply renders were also inspected.

## What becomes automatic after merge

- The daily watch rebuilds Apply, its recipe catalog, the explicit public kit ZIP,
  and hashes. Pipeline/kit merges trigger a collection attempt immediately.
- Accepted code updates change the bundle and code revision. Source observations
  change the unresolved queue without reapproving code or changing research verdicts.
- A scheduled coding worker can propose one runnable baseline/candidate comparison
  as a draft PR; a separate exact-commit evaluator reruns it without network or
  credentials. See [the executable workflow runbook](../../../ops/research-agent.md).
- Reviewed promotion into the canonical kit and public-file list reaches the next
  successful generated download. Unaccepted agent code is never silently included.

The daily ledger and weekly download-path defects were already repaired in the
merged baseline; this round does not claim those earlier fixes. The last committed
watch observation at implementation time is **2026-09-26T11:27:15Z**. Generating a
new page does not make that observation fresh. A post-merge successful collection
and deployment are still required to demonstrate runtime recovery.

## Evidence still required

The hosted sandbox-control workflow passed both positive and deliberately failing
synthetic candidate controls without inference credentials in [run 36609092406](https://github.com/JYeswak/franken-research/actions/runs/36609092406).
Downloaded actual results and logs are preserved verbatim in `hosted-controls/`;
its provenance file identifies the tested commit and original artifact. Its Actions result, and a
separate authenticated coding-worker run, are different receipts. Local compilation
and unit checks prove neither hosted outcome. The coding worker requires a configured
engine credential; this environment could not inspect that repository setting.

No comparative learning/application trial has run. Measure fresh consumer tasks
at matched correctness, coverage and rights, including setup, review, transfer
and maintenance effort. Three entry points, more files or faster internal tests
must not be multiplied into a claim about user VALUE.

A parallel verify run on the same first PR commit exposed a render-timing defect:
[run 36609034471](https://github.com/JYeswak/franken-research/actions/runs/36609034471)
sampled a partially parsed Apply page (77 body characters and an unloaded stylesheet).
A five-second stylesheet interception reproduced the exact failure locally. The
gate now awaits document/style readiness before keeping its original three-second
observation and every existing assertion. `scripts/test-render-loading.py` tests
that delayed CSS passes and permanently failed CSS still fails; verify CI runs it.
The passing parallel run was not used to dismiss the failing observation.
