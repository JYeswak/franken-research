# Notification contract — how finished work reaches Josh

Bead: fr-i5u (Josh directive, 2026-10-03). One contract for every
mission (franken-research, franken-nightly/fleet, skill library). Work
that finishes silently reads as work that never happened; pull-based
reporting already failed three times when cron workers died. Finished
work is pushed, never left for Josh to discover.

## The events that push

Exactly three kinds of events produce a pushed summary:

1. **A merged PR** — one summary per merge, in the chat that owns the
   mission the PR belongs to.
2. **A closed bead** — one summary per closure, in the owning chat,
   citing the verifier's close reason and evidence.
3. **A morning digest** — one message per morning, in the owning chat,
   covering the overnight nightly result, the fleet/DAG reports, and
   any decisions waiting on Josh. One digest, not one push per report.

Nothing else pushes. No "started", "queued", or progress chatter; no
broadcast tips or promos; no cross-posting between mission chats.

## The rules

- **Exactly one summary per event.** The dedupe key is the event id:
  PR number, bead id, or digest date. A retry, re-run, or re-delivery
  of the same event does not push again. If a push fails, it is
  retried once; a second failure is itself named in the next digest.
- **Silence means a true no-op.** A pass that merged nothing, closed
  nothing, and changed no state pushes nothing. A nightly noop *with*
  a cause is not a true no-op: it gets one line inside the morning
  digest (outcome + cause class), never its own push.
- **Every summary carries its evidence.** PR number and merge commit;
  bead id and close reason; digest cites the artifact it read
  (`state/last-run.json`, the dated report, the run ledger). A summary
  without a citable artifact is not sent.
- **Blockers for Josh ride the digest, not a separate push.** DECISION
  beads and other Josh-queue items are listed in the morning digest
  with what decision is needed. They are never auto-notified
  individually and never executed by agents.
- **The owning chat only.** A summary goes to the chat that owns the
  mission. Mission A's results never appear in mission B's chat.

## What a summary looks like

Terse, in Josh's register: what finished, the evidence, what is next
or blocked. No preamble, no score presented as quality, no narration
of the agent's own process.

## Proof (fr-i5u acceptance)

One week of operations (2026-10-04 through 2026-10-10): sample the
mission chat logs against `git log --merges` on `main` and
`br list --status closed` for the same window.

- Every merged PR and every closed bead has exactly one matching
  pushed summary (counts cited: merges N, closures M, summaries
  N + M, digests 7 or fewer).
- Zero duplicate summaries for the same event id.
- Zero broadcast-style messages (tips, promos, status noise) in the
  sample.

## The pushed-summary log

Every push under this contract appends one line to
`state/notification-log.jsonl` in this repo:
`{"ts": ..., "kind": "pr"|"bead"|"digest", "event_id": ..., "chat": ...}`.
The log is append-only; the dedupe key above is the line's `event_id`.

`scripts/notify-push.py` is the only writer. The agent that pushes a
summary runs it in the main checkout at push time
(`--kind pr|bead|digest --event-id <id> --chat <owning chat>`); a
repeat call for the same event id appends nothing, so a retry or
re-delivery cannot create a duplicate, and kinds outside the three
contract events are rejected outright.
Without this log there is no citable sample to audit - chat scrollback
alone does not count as evidence.

## Running the proof

`python3 scripts/notification-audit.py` (defaults: window
2026-10-04..2026-10-10, log `state/notification-log.jsonl`) counts
merges from `git log --merges` and closures from the bead store, then
reports missing, duplicate, extra, and broadcast-style entries. Log entries
dated outside the window are ignored, so the 2026-10-03 opening entry
never pollutes the sample. Merges are counted with explicit day-bound
timestamps (a bare `--since=YYYY-MM-DD` silently drops same-day
merges). Until
the window has fully elapsed it reports `WINDOW_INCOMPLETE` and cannot
PASS - a partial week is never presented as proof. Unit tests:
`python3 scripts/test_notification_audit.py`.

The audit is run by the independent verifier, not the contract's
author, and its counts are commented on fr-i5u before closure.
