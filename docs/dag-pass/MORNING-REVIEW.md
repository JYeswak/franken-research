# The DAG work pass — and its step zero, the morning skill-library review

Canonical instructions for the daily bead-DAG work pass. Bead: fr-m4x
(Josh directive, 2026-10-03 09:20 MDT). One operating discipline: the
library encodes hard-won standards, and the pass audits yesterday against
them before it implements anything.

## Canonical day rhythm (single source of truth - bead fr-xuh)

Every pass time in this section was diffed against the live schedules on
2026-10-03 (VM cron.list + Mac launchctl/plist read). This document is
the canonical record: when any other record disagrees with this section,
this section wins and the other record gets fixed. All times
America/Denver unless noted.

| Pass | Time | Trigger | Step order |
|------|------|---------|------------|
| Nightly candidate cycle (Mac launchd) | 06:20 daily | launchd com.jyeswak.franken-nightly (Mac, ~/Library/LaunchAgents/com.jyeswak.franken-nightly.plist) | Runs locally on the Mac: candidate selection, sandbox, evaluator, PR/merge under Josh's auto-merge authorization. Writes franken-nightly/state/last-run.json + report. |
| Nightly report (VM cron, read-only) | 07:20 daily | VM cron franken-nightly | Reads franken-nightly/state/last-run.json + matching report; posts one tight summary. Never runs the driver, never mutates the repo. Flags a stale/missing last-run (>26h) as a failure. |
| **DAG work pass (VM cron) - this document** | **08:20 daily** | VM cron franken-dag-work | Step zero: morning skill-library review (below) -> read the frontier -> auto-bead new gaps -> work ONE top ready non-DECISION, non-epic bead in an isolated worktree -> evidence comment + needs-verification label; the implementer never closes their own work. |
| DAG verify pass (VM cron, independent closer) | **16:20 daily** | VM cron franken-dag-verify | Independently reproduces evidence on needs-verification beads (max 3/pass), closes or bounces; checks br dep cycles + bv --robot-insights Cycles empty. Never implements fixes. |
| Weekly DAG retro (VM cron) | Sun 17:20 | VM cron franken-dag-retro | Graph health census, staleness sweep, proof-week progress; files beads for drift found before reporting. DECISION beads are listed for Josh, never executed. |

Historical note: fr-m4x originally cited an 08:10 work pass and the work-pass
cron body once named a 16:40 verify pass; both were stale text. The live
schedules (08:20 work / 16:20 verify) were kept as canonical - no cron times
moved - and the stale references were corrected on 2026-10-03 under fr-xuh.

## The pass

0. **Pre-pass bead-state check (sync owner, see Bead-state sync below).**
   In the main checkout, run `git status --short -- .beads/` and record
   the exact output in the pass report. If `.beads/` is dirty at pass
   start, the sync owner flushes and commits it (or records why the
   dirty state is intentional) before any other step runs — no pass
   starts on bead state git does not have.
   Then the ff-only main sync (fr-6i1): `git fetch origin`; record
   ahead/behind counts (`git rev-list --left-right --count
   main...origin/main`) in the pass report's Bead-state sync block.
   When the tree is clean and local main is strictly behind
   origin/main, `git merge --ff-only origin/main` so every worktree
   branches from current main (the 06:20 nightly merges from its
   Stage D worktree and never advances this checkout). When diverged
   or dirty: STOP the pass and report the state — never a merge
   commit, never a silent stash.
1. **Step zero — morning skill-library review (this document).**
2. Claim the top ready non-DECISION, non-epic bead (`bv --robot-next`,
   never bare `bv`; all `br` queries with `--json`). Immediately after
   the claim batch, the sync owner flushes and commits `.beads/` so the
   claim is in git before worktree work begins.
3. Implement in an isolated worktree; the implementer never closes
   their own work.
4. Independent verification pass (a different agent) closes or bounces.
   After any close/bounce batch, the sync owner flushes and commits
   `.beads/` again.
5. End clean: no scratch dirs, no staged leftovers, `.beads/` flushed
   and committed (`br sync --flush-only`, then manual `git add .beads/`
   and a commit carrying the repo verification token). The sync owner
   re-runs `git status --short -- .beads/` at pass end and records the
   output in the pass report; the pass is not done while that output is
   non-empty and unexplained.

## Bead-state sync (fr-lud)

**Sync owner: the agent running the pass.** For the 08:20 work pass the
owner is the `franken-dag-work` session; for the 16:20 verify pass, the
`franken-dag-verify` session; for any ad-hoc burn-down wave, the wave
coordinator. The owner is named in every pass report. Only the sync
owner commits `.beads/` (always in the main checkout — bead commands
never run inside a worktree), which serializes bead-state commits when
agents work in parallel. Workers and sub-agents mutate bead state only
through `br` and hand the flush/commit to the owner; whoever makes the
last bead mutation before a handoff tells the owner, and the owner is
accountable for the commit landing in the same pass regardless.

**Cadence — the owner flushes and commits `.beads/` three times in
every pass:** (1) after the claim batch, before worktree work starts;
(2) after any evidence-comment / close / bounce batch; (3) at pass end.
Each flush is the operator ritual: `br sync --flush-only`, then
`git add .beads/`, then a commit whose subject carries the repo
verification token. `br` never runs git and `issues.jsonl` is never
hand-edited.

**Checks.** `git status --short -- .beads/` runs at pass start (step 0)
and at pass end (step 5); both outputs are recorded verbatim in the
pass report's Bead-state sync block (see Output below), with the
resulting beads commit hash when a commit was needed. A dirty pass end
is explained and committed within the same pass, or the pass reports
itself incomplete — a later pass never inherits silent bead debt.

### Sync ledger

Consecutive passes with `.beads/` clean at pass end. Rows before the
fr-lud rule are git-evidenced only (pass end = the pass's beads
commit; start status was not recorded then).

| # | Pass (America/Denver) | Sync owner | Start `.beads/` | End `.beads/` | Beads commit |
|---|------------------------|------------|------------------|----------------|--------------|
| 1 | 2026-10-03 fr-landscape-rigor close wave | wave coordinator | not recorded (pre-rule) | clean | `66890e7` |
| 2 | 2026-10-03 fr-6hs implement + verify waves | wave coordinator | not recorded (pre-rule) | clean | `e1989cf`, `17a458b` |
| 3 | 2026-10-03 fr-xuh verify/close wave | wave coordinator | not recorded (pre-rule) | clean | `a34bb28` |
| 4 | 2026-10-03 fr-lud implementation pass (first under this rule) | implementing agent (this pass) | ` M .beads/issues.jsonl` (fr-lud claim, 2026-10-03 18:15 MDT) | clean — transcribed in reports/2026-10-03.md (fr-lud repair pass, 2026-10-03; previously only in bead comment 84, bounced by verifier comment 87) | `e47f3a5` |
| 5 | 2026-10-03 fr-lud repair pass (second under this rule) | fr-lud repair agent (ad-hoc wave) | ` M .beads/issues.jsonl` (verifier grade comment 87 + fr-miv close, flushed at pass start) | clean — recorded in reports/2026-10-03.md (repair-pass section) | `5cb4aca` (start flush), `e24f8d0` (evidence/pass-end flush) |
| 6 | 2026-10-03 fr-lud pass-3 (third under this rule, ad-hoc burn-down wave) | fr-lud pass-3 agent (ad-hoc wave coordinator) | ` M .beads/issues.jsonl` (parallel fr-bh3/fr-m5m claims + fr-lud re-claim, 2026-10-03 19:03 MDT, flushed at pass start) | clean — recorded in reports/2026-10-03.md (pass-3 section) | `cbbb936` (start flush), `2c10d90` (evidence flush, carried in parallel fr-bh3 commit), `e2d1b30` (pass-end flush) |
| 7 | 2026-10-04 franken-dag-work (08:20 DAG work pass) | franken-dag-work session | (no output — clean) | clean — recorded in reports/2026-10-04.md | `6980d74` (claim batch), `a6269a3` (evidence batch) |

Rows 1–3 are pre-rule and do NOT count toward the three-pass recorded
streak (verifier, fr-lud comment 87). The under-rule streak stands at
3 of 3 after row 6 (fr-lud pass-3, 2026-10-03 evening ad-hoc burn-down
wave, recorded in reports/2026-10-03.md pass-3 section): three
consecutive under-rule passes (rows 4, 5, 6) now each record verbatim
start and end `git status --short -- .beads/` in the pass report with
`.beads/` clean at pass end. fr-lud itself stays open until an
independent verifier confirms row 6 and closes it.

DECISION beads are Josh's queue and are never executed by agents. Epics
depend on their children; children never depend on epics.

Finished work reaches Josh by push under the one notification contract
([docs/NOTIFICATION-CONTRACT.md](../NOTIFICATION-CONTRACT.md), bead
fr-i5u): one summary per merged PR and per closed bead, one morning
digest, silence only for true no-ops.

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
4. **Bead-state sync block (fr-lud)** — sync owner (session/role),
   the verbatim `git status --short -- .beads/` output at pass start
   and at pass end, and the beads commit hash for any flush commit
   made during the pass. The pass end output must be empty, or the
   dirty state is explained and its commit named in the same block.

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
| 2 | 2026-10-04 | reports/2026-10-04.md | 1 | fr-6i1 |

## Noop cause check (fr-fm5)

Every morning, before implementation, the pass also audits last
night's noop classification (taxonomy: franken-nightly `RUNBOOK.md`
"Noop cause taxonomy", `bin/noop_causes.py`):

1. Run `python3 /Users/josh/Developer/franken-nightly/bin/check-noop-causes.py`.
   The checker is STRICT (fr-fm5 repair): it reads the STORED
   `cause_class` field and never computes one on the fly, so exit 0
   means every noop in `ledger.jsonl` and `state/last-run.json`
   actually carries the field. It reports any noops missing the
   field, any noops stored as `unclassified`, and any first-seen
   classes still pending a bead. (Historical records predating the
   driver change were stamped once with
   `check-noop-causes.py --backfill`, tagged
   `cause_class_source: "backfill-fr-fm5"`; a missing field on any
   newer record is a driver bug, not a backfill case.)
2. Any pending first-seen class gets its own bead this cycle — dedupe
   with `br search "<class>"` first, then `br create` with a
   BEAD-ANATOMY description naming the class, first-seen date/outcome,
   and the last-run receipt; slot it under epic fr-y48. Clear it with
   `check-noop-causes.py --mark-bead-filed <class> <bead-id>`.
3. An `unclassified` noop is a shortfall in this report (with the
   last-run/ledger evidence), beaded the same morning, and the
   taxonomy in `noop_causes.py` is extended so the class never
   recurs unnamed. Proof-week bar: 7 nights, every noop classified,
   zero unclassified.
