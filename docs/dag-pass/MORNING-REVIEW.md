# The DAG work pass — and its step zero, the morning skill-library review

Canonical instructions for the daily bead-DAG work pass. Bead: fr-m4x
(Josh directive, 2026-10-03 09:20 MDT). One operating discipline: the
library encodes hard-won standards, and the pass audits yesterday against
them before it implements anything.

## The pass

1. **Step zero — morning skill-library review (this document).**
2. Claim the top ready non-DECISION, non-epic bead (`bv --robot-next`,
   never bare `bv`; all `br` queries with `--json`).
3. Implement in an isolated worktree; the implementer never closes
   their own work.
4. Independent verification pass (a different agent) closes or bounces.
5. End clean: no scratch dirs, no staged leftovers, `.beads/` flushed
   and committed (`br sync --flush-only`, then manual `git add .beads/`
   and a commit carrying the repo verification token).

DECISION beads are Josh's queue and are never executed by agents. Epics
depend on their children; children never depend on epics.

## Step zero: the morning skill-library review

Before any implementation, audit yesterday's work against the jsm skill
library standards named in fr-m4x:

- **beads-workflow** — bead-first: every gap becomes a bead, slotted
  into the DAG with dependencies, claimed `in_progress` before work;
  descriptions follow BEAD-ANATOMY (Background / Technical Approach /
  Success Criteria / Test Plan / Considerations); `br dep cycles`
  empty.
- **verification-before-completion** — evidence before claims: no
  completion, closure, or satisfaction claim without a fresh
  verification command in the same message; close reasons cite
  evidence; an implementer's done is a claim, not a fact.
- **skill-authoring-discipline** — any skill surface touched yesterday
  passes the materialization test (a fresh agent can execute it on a
  new problem) and trigger/description standards; no silent content
  loss in rewrites (back up first, surgical diffs, rollback preserved).

Plus the standing franken rules: commit subjects carry an honest
verification-level token (`[test]`, `[live]`, `[pending]`);
`TMPDIR=/Users/josh/.cache/fr-tmp/` for repo tooling on the Mac;
process hygiene (timeout + process-group kill, no orphaned children);
Mac copies canonical for franken-nightly/fleet.

### Output: the DAG pass report

Each morning produces one report at
`docs/dag-pass/reports/YYYY-MM-DD.md` containing:

1. **Shortfall list** — every place yesterday's work fell short of the
   standards above, each with the evidence that shows it (command,
   output, count, commit). A shortfall with no evidence is not listed;
   a check that passes is recorded as checked-clean, with its
   evidence, so an empty shortfall list is still an evidenced list.
2. **Gap beads filed** — every non-empty shortfall has a bead filed
   the same morning, before implementation begins (dedupe first with
   `br search`; full BEAD-ANATOMY description; `related` link to
   fr-m4x). The report names each bead id.
3. **Streak line** — consecutive mornings with a report, day N of 7
   toward the fr-m4x acceptance streak.

### Rules

- The review happens even when the shortfall list is empty; the
  report is the receipt.
- Shortfalls are beaded before the day's implementation begins, never
  fixed inline first and beaded after.
- The review judges work, not people: cite the artifact, the standard,
  and the delta.
- If the review itself cannot run (tooling down), the report says so
  and files the blocker as a bead; silence is not a pass.

## Streak ledger

| Day | Date | Report | Shortfalls | Gap beads |
|-----|------|--------|-----------|-----------|
| 1 | 2026-10-03 | reports/2026-10-03.md | 3 | fr-6hs, fr-xuh, fr-lud |
