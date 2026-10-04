# Three-judge panel (fr-w29)

Stage C verdicts decide auto-merge. Calibration (fr-o8i,
`docs/judge-calibration.md`) says how much each fleet lane is trusted;
it does not protect a close call on the night it happens. Since
fr-w29, no auto-merge decision rests on a single judge: every Stage C
evaluation goes to a panel of three judges from diverse model
families, and disagreement escalates instead of merging silently.

Driver implementation: `franken-nightly/bin/judge_panel.py`, wired
into `run-nightly.py`'s Stage C (build, seeded, and review nights).
Operator procedure: `franken-nightly/RUNBOOK.md` §5.

## The panel

Three pinned lanes — the bulk-tier judge lanes, one per family:

| Provider | Model | Family |
|---|---|---|
| nvidia | `z-ai/glm-5.3-flash` | GLM |
| cerebras | `qwen-3.8-27b` | Qwen |
| groq | `openai/gpt-oss-20b` | GPT-OSS |

The lanes are pinned provider calls, never router fall-through: a
silent fall-through would swap in a different model family mid-panel
and defeat the diversity the panel exists for. A lane that is
unavailable, errors, or returns no parseable verdict is recorded as
unserved — it is never silently replaced by another model.

Every judge receives the exact Stage C prompt `evaluate.py` builds
(same bytes, same pinned sha256, same fr-ugw grader isolation), is
canonicalized the same way (`reproduced` re-derived as a harness
fact, green-with-blockers demoted), and passes through the fr-o8i
calibration gate on its own lane before voting: an uncalibrated or
below-bar lane's green is a revise before the panel ever counts it.

## Decision rules

- **Consensus green** — all three judges served, no flag flip, all
  three gated verdicts green. This is the only outcome that can
  reach Stage D and auto-merge.
- **Consensus non-green** — no judge says green (mixed revise/reject
  included: the candidate does not merge on any reading). Majority
  value wins, the dissent stays in the record, and the night
  proceeds as a normal red (writer revision rounds apply).
- **Split → escalate** — anything else:
  - a judge never served (lane dark, error, unparseable verdict);
  - any judge reversing a sibling's stated `reproduced` or
    `fair_baseline` flags (judged on the flags the judges themselves
    stated, before canonicalization overrules a claim);
  - green and non-green verdicts side by side, including a green
    majority with a dissenting judge.

A split returns a non-green verdict (`verdict: "escalate"`,
`panel_split:` blocking issues), so the existing merge gate
(`verdict_green`) cannot pass it and Stage D is unreachable. No
writer revision round is burned on a split: the night noops with
outcome `noop-panel-escalated` (cause class `evaluator-revise`).

## Escalation records

Each split writes one record under `franken-nightly/escalations/`:

```
<date>-<candidate-key>-panel-escalation.json
```

carrying the candidate fingerprint, the pinned prompt sha256, the
isolation-manifest sha256, the split reasons, and every judge's lane,
family, judge-version, raw verdict, and gated decision. The
afternoon verify pass works this directory:

```
python3 bin/judge_panel.py list --pending
python3 bin/judge_panel.py resolve <record.json> <decision> <resolver>
```

Resolution stamps the decision, resolver, and timestamp onto the
record in place. Because a split verdict is non-green by construction
and Stage D only runs on a panel green, no merged PR can contain an
unresolved split; the escalations directory plus the `C-panel`
receipts (which record all three judge-versions + lanes for winning
verdicts, and the judges line on the PR body) are the audit trail.

## Evidence pattern

- `bin/test_judge_panel.py` — injected-call tests: unanimous
  calibrated green merges; a forced 2–1 split escalates and the
  record resolves; a flag flip escalates even when all three judges
  say green; an unserved judge is a split, never a substitute;
  uncalibrated lanes cannot green the panel.
- Live smoke 2026-10-04 (historical candidate
  `2026-10-04-new-releases` replayed through the panel): all three
  lanes dark (nvidia 60s timeout, cerebras 402, groq 429) → panel
  incomplete → escalation record written and resolved as a smoke
  artifact. Receipt:
  `franken-nightly/receipts/2026-10-04-smoke-fr-w29-stage-C-panel.json`.

Cost discipline: the panel runs only where Stage C already ran — on
nights that reach an evaluation, three judge calls per eval round,
not per candidate draft.
