# Apply research; measure the resulting work

29 September 2026. Plan and scope recorded before execution; results are in `validation.json` and the separate review files.

The unit of success is an **accepted improvement used on a real job**: a
correct adoption decision that changes an implementation or avoids a documented
unnecessary implementation, or a working change that improves its declared
outcome on fresh tasks. A report, green test, queued lead, or recovered workflow
is not that outcome. Do not count both a decision and its resulting patch as two
independent wins.

## The 1000x hypothesis

Research must end in an applied change, followed by evaluation and reuse. The
primary productivity measure is accepted outcomes per total human hour, compared
with the existing agent + FR workflow on comparable fresh jobs. Record setup,
review, corrections, failed attempts and maintenance, including human work done
outside FR. Report model/compute cost, machine elapsed time and throughput
separately. Prepaid inference is not zero effort. Agent wall time is not human
active time; missing measurements remain missing.

A 1000x claim requires this rate to improve by 1000 at the same predefined
quality, coverage, rights and portability requirements. Use blinded independent
review where feasible. Freeze the task distribution, acceptance criteria,
measurement window and cost rules before comparing alternatives. Failed and
blocked tasks stay in the denominator. Do not multiply component speedups or
extrapolate a single successful case to the ecosystem.

For unchanged output volume, a residual human-work fraction of 0.1% already caps
improvement at 1000x before new overhead. That makes fewer prompts or faster
report writing insufficient. The plausible route is eliminating repeated work:

1. **Reuse verified evidence and executable results.** Fetch/inspect a source
   once, retain its identity and scope, reuse only while its dependencies hold,
   and invalidate affected conclusions when they change. First application:
   source-backed CI review from FR's existing recorded source corpus.
2. **Execute proposed improvements.** For a named consuming project, turn a
   research finding into a patch or configured incumbent, run the actual job
   against the baseline, and keep it only if its predefined benefit survives
   independent review. Research can correctly end in adopting or rejecting an
   incumbent; unsupported installation is not progress.
3. **Transfer an accepted improvement.** Apply it to a second project or fresh
   task without its author's intervention. Include adaptation and repair time.
   Only measured reuse can amortize research and setup costs. A reusable skill
   is earned by this transfer, not by writing SKILL.md first.

The first end-to-end trial should use naturally arriving upstream changes that
need an adoption/recheck action. Allocate comparable fresh cases between the
current workflow and evidence-assisted workflow before inspecting outcomes;
keep models and reviewer criteria comparable. Log each final accept/reject,
incorrect recommendation, material omission, human active minutes, elapsed time,
source requests, compute usage, and applied artifact. An independent reviewer
must verify the finding against pinned sources. Human time needs actual operator
records; transcripts cannot reconstruct it. If the sample is too small or the
baseline is absent, publish case studies and raw observations without a ratio.
The comparison stops being useful if this job is not a meaningful user bottleneck;
then choose a real consuming project's executable workload before more tooling.

## Applied work in this change

- Restore watch's persisted-ledger input and discovery's artifact directory.
  Reverted fixes fail their new regressions. This repairs acquisition, not a
  scheduled analytical service. Hosted operation remains unproven until it runs.
- Recover the actual W40 discovery JSON, unchanged, from the scheduled run's
  artifact. It contains leads, not assessed candidates. Original ZIP SHA-256:
  `5d2705bc2a00dff5debd944d422fb140e8f82144e7c8442135942cf9f888e44b`;
  run https://github.com/JYeswak/franken-research/actions/runs/36423641984.
- Make existing source classification usable as a pinned, source-backed review
  packet. Exercise a real historical frankengit change; a replay is not fresh
  comparative evidence. Keep CI-only scope and do not auto-resolve rechecks.
- Independently inspect the current franken_snowflake CI crossing using both
  immutable trees. This is a new source finding, not a full maturity assessment.
- Screen OpenResearch at a full commit and execute its snapshot shell primitive.
  Defer installation for the recurring analyst: no demonstrated incremental
  outcome and no full product execution. Preserve its useful archive-identity
  lesson for executable comparisons.

## What is not established

No measured human baseline, net productivity ratio, transfer benefit, production
research scheduler, or 10x/100x/1000x result exists from this change. The current
work applies research to one useful evidence handoff and one installation
decision. The next spend is a fresh applied comparison, not another landscape
survey, memory platform, or separate wr crate.

## Run the applied evidence handoff

```sh
node scripts/ci-evidence-packet.mjs --repo frankengit --point recheck --format markdown
node scripts/ci-evidence-packet.mjs --repo frankengit --point recheck > /tmp/frankengit-ci.json
node --test scripts/test-ci-evidence-packet.mjs
```

JSON includes the source bytes for offline review; Markdown is a compact review
index. The checked-in `frankengit-ci.md` and `packet-timing.json` are one actual
execution. The corpus is historical, and cannot support current crossing claims.
The `openresearch/` directory retains the separate candidate screen and runnable
snapshot probe; its shell-template reproduction is not a compiled-product test.
