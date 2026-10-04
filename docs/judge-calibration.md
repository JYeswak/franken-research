# Judge calibration harness (fr-o8i)

Stage C verdicts decide auto-merge, but judge trust is lane-dependent:
the same rubric served by a different fleet lane can disagree, and
without a frozen reference set there is no way to detect drift. This
harness makes a lane an *instrument with a calibration record*.

## The frozen labelled set

`scripts/judge-calibration-set.json` — 32 items drawn from real past
Stage C verdicts (franken-nightly receipts + ledger), frozen at commit
time. Composition: 12 receipt verdicts, 7 replay verdicts, 5 replay
expectations (fr-beu), 6 ledger verdicts, 4 pinned edge cases. Labels
are human-verified against the deterministic rules 1–4 in
`prompts/evaluate.md` (green iff reproduced AND fair_baseline AND no
blocking issues; else revise — reject is folded into revise because no
rejects exist in the historical record).

Edge cases pin the traps that already bit us once:

- Raw judge verdicts that contradict their own fields (green with
  `fair_baseline=false` + blocking issues — the 2026-10-03 eval
  receipts), which `canonicalize_verdict` now re-derives.
- The 2026-10-02 py-reachability misgrade (baseline strawman claim;
  rule 2 judges the baseline as defined in recipe.md).
- Judge inflating a stronger-comparator note into a blocking issue.

## Per-lane agreement

`scripts/judge-calibration.py stats --predictions P.json` scores a
lane against the set: Cohen's kappa, per-class precision/recall, raw
agreement. Predictions come from replaying the frozen items through
the lane (see `bin/replay-eval.py` pattern); the harness itself is
offline and deterministic — identical inputs reproduce identical
numbers, and running it twice is the stability check.

Starting bar: **kappa >= 0.6**. Tightening is a later decision bead.

## Judge version pinning

`judge_version()` hashes the judge prompt + decoding parameters
(temperature 0, max_tokens 16000): any prompt, rubric, or decoding
change bumps the version and invalidates prior calibration by
construction. Every Stage C verdict is stamped with
`judge_version` + `serving_lane` (both on the verdict dict and on the
evaluation receipt) by `franken-nightly/bin/evaluate.py`, which carries
the identical version derivation so stamps agree.

## Enforcement

The driver gate (`franken-nightly/bin/judge_calibration.py`, consulted
by evaluate.py) reads `franken-nightly/judge-calibration.json`:

- Lane with **no calibration file** (or an entry pinning a different
  judge version, or kappa below the bar) **cannot auto-merge**: its
  green verdicts are downgraded to `revise` with a
  `calibration_block` note (default revise/escalate).
- A **lane switch** — the first verdict served by a new lane, or a
  judge-version bump — lands in a `needs_recalibration` list that is
  surfaced on the receipt and appended to the nightly ledger; the lane
  stays blocked until calibration re-runs on the frozen set for that
  lane and its kappa is granted into `judge-calibration.json`.
- The switch also **executes** a re-calibration run
  (`judge_calibration.trigger_recalibration`): the lane's embedded
  frozen-set verdicts are scored immediately, the measurement is
  written into the driver registry (below-bar / partial-coverage
  measurements block; they never grant), and the run record —
  including kappa and the next step — is stamped onto the pending
  state entry and the Stage C receipt (`recalibration_trigger`). A
  lane with no embedded verdicts gets `awaiting_predictions` with the
  exact manual replay command; full-coverage replay under the pinned
  judge version remains the only path to a grant.

## Re-calibrate a lane

1. Replay the frozen set items through the lane (replay-eval pattern,
   temperature 0, pinned prompt).
2. Write the predictions map `{item_id: verdict}`.
3. Record: `scripts/judge-calibration.py report --predictions P.json
   --lane <provider/model> --judge-version <v>` — updates the repo
   registry `scripts/judge-calibration-registry.json` and, with
   `--grant`, the driver file.
4. Independent verification (a different agent) re-runs the report and
   checks kappa before the lane auto-merges again.

## Measured per-lane results (2026-10-04, fr-o8i repair)

`scripts/judge-calibration.py lanes` scores the raw verdicts embedded
in the frozen set per serving lane and records them in
`scripts/judge-calibration-registry.json`:

| lane | n | coverage | kappa | green P/R | revise P/R | bar |
|---|---|---|---|---|---|---|
| groq/openai/gpt-oss-20b | 19 | 19/32 | **0.4062** | 0.765 / 1.0 | 1.0 / 0.333 | FAIL |
| nvidia/z-ai/glm-5.3-flash | 1 | 1/32 | 1.0 (degenerate) | 1.0 / 1.0 | 0.0 / 0.0 | insufficient coverage |

- The groq lane — the lane that actually serves most Stage C verdicts —
  measures **below the 0.6 bar**: it almost never says revise
  (revise recall 0.333), so its greens cannot be trusted to auto-merge.
  Sensitivity check: excluding the 5 `replayexp-*` items (expected
  decisions duplicating replay receipts) gives n=14, kappa 0.4615 —
  still below bar, so the conclusion does not rest on them.
- The nvidia lane's kappa 1.0 rests on a single item; with partial
  coverage it is recorded as `insufficient_coverage` and can never
  grant auto-merge. A lane passes only with kappa >= 0.6 on complete
  32/32 coverage (a full frozen-set replay under the pinned judge
  version).
- `fleet/bulk-tier` (8 pooled ledger verdicts, serving model unknown)
  is reported under `non_lane_groups`, never as a lane.
- Historical verdicts predate judge-version pinning, so lane entries
  carry `judge_version: null`: they are drift measurements, not grants
  under the current judge version. The deterministic-rules reference
  (kappa 1.0 by construction) remains the label-rubric baseline only.

## Result at filing (2026-10-04)

The driver ships with **no lane granted**: every green verdict is
currently calibration-blocked pending each lane's first calibration
run. The repo registry records the deterministic-rules reference
against itself (kappa 1.0 by construction) as the label-rubric
baseline, not as a lane grant.
