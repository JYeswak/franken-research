---
title: dex, Kyle Mistele and HumanLayer (12-Factor Agents, ACE-FCA, skills, shannon, fold)
covers: 87, 97
written: 2026-09-25
summary: How HumanLayer's 12-Factor Agents, ACE-FCA context compaction, control-loop skills, shannon and fold handle context, compaction and agent loops, and what they suggest for agent harnesses.
---

## Sources

- 12-Factor Agents (12FA): https://github.com/humanlayer/12-factor-agents/tree/d20c728368bf9c189d6d7aab704744decb6ec0cc (pin: commit `d20c728`, 2025-09-21). Code Apache-2.0; content and images CC BY-SA 4.0 ([README.md lines 254-258](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/README.md#L254-L258)).
- Advanced Context Engineering for Coding Agents (ACE): https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/tree/f2bc7aec4575418d2d2e83fec078266cc56d3e6a (pin: commit `f2bc7ae`, 2026-08-04). No license file, so all rights are reserved by default; we study it and link to it only.
- HumanLayer's original research-plan-implement (RPI) prompts (HLC): https://github.com/humanlayer/humanlayer/tree/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands (pin: commit `99abe67`, 2026-06-18). Apache-2.0. The README says the code is "pretty much all deprecated" ([README.md line 3](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/README.md#L3)).
- humanlayer/skills (SK): https://github.com/humanlayer/skills/tree/ca7c8088db69e315a8b2deea43820270457f8f3c (pin: commit `ca7c808`, 2026-09-17). MIT.
- shannon (SH): https://github.com/dexhorthy/shannon/tree/c38691fbd1a40f198cc79b63383a7912df6f13e9 (pin: commit `c38691f`, 2026-05-13). MIT.
- fold: https://github.com/humanlayer/fold/tree/f8a2ce4362dc60784a3efda3bd78e08604029dfa (pin: commit `f8a2ce4`, 2026-09-23). MIT.
- "Skill Issue: Harness Engineering for Coding Agents", HumanLayer blog, 2026-03-12, byline "Kyle": https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents (read 2026-09-25).
- "Everything We Got Wrong About RPI" talk: https://www.youtube.com/watch?v=YwZR6tc7qYg (not watched). Third-party summary used instead: https://alexlavaee.me/blog/from-rpi-to-qrspi/ (read 2026-09-25).
- oh-my-pi (OMP), an agent harness: https://github.com/can1357/oh-my-pi/tree/v18.3.0 (pin: tag `v18.3.0`). MIT.
- SlopCodeBench: https://github.com/SprocketLab/slop-code-bench (MIT), problems at https://github.com/gabeorlanski/scb-problems (Apache-2.0), paper https://arxiv.org/abs/2603.24755 (licenses checked via the GitHub API, 2026-09-25).
- CC BY-SA 4.0 legal code: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en (read 2026-09-25).
- The Independent 100 list, curated by dan: https://independent.prose.md/ (dex is rank 87, Kyle Mistele rank 97). This study is ours and is not endorsed by dan or by anyone listed.

## How to read this

Written 2026-09-25 by an AI agent session. [Verified] means we read the file at the pin or ran the check. [Reported] means the author or a third party says so and we did not check it. [Inference] is our reasoning.

## What they built

### 12-Factor Agents (dex, 2025)

A doctrine repository of twelve factor files plus an appendix ("factor 13, pre-fetch context"); two generations of the files (`factor-3-…` and `factor-03-…`) coexist and differ. The code is a scaffolder and a set of workshops; the last commit was 2025-09-21. [Verified] The factors that bear on agent harnesses [Verified]:

- **Factor 3.** "Everything is context engineering": a custom event format in place of the chat-message list, and resolved errors hidden ([factor-03](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-03-own-your-context-window.md)).
- **Factor 5.** Infer execution state from the event log ([factor-05](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-05-unify-execution-state.md)).
- **Factor 9.** Put the error into context and retry, but "limit to ~3 attempts of a single tool", then escalate ([factor-09 line 31](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-09-compact-errors.md#L31)).
- **Factor 10.** Keep agents to "3-10, maybe 20 steps max" ([factor-10 line 9](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-10-small-focused-agents.md#L9)).

### ACE-FCA and the essays (dex, 2025-2026)

The ACE repository holds four essays and no code. From `ace-fca.md` [Verified]:

- The rule is "frequent intentional compaction", keeping utilization "in the 40%-60% range (depends on complexity of the problem)" ([line 60](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L60), [line 218](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L218)).
- The window it assumed comes from a Geoffrey Huntley quote: "approximately **170k of context window**" ([line 171](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L171)).
- The workflow is research, plan, implement; subagents are about context control, not role-play ([line 191](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L191)).
- Humans review research and plans, because a bad line of research can produce thousands of bad lines of code ([lines 318-333](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L318-L333)); "I *can* read 200 lines of a well-written implementation plan" ([line 357](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/ace-fca.md#L357)).
- Outcome claims we did not check [Reported]: "35k LOC … in about 7 hours" on BAML, "$12k on opus per month" for a team of three, and a failed parquet-java attempt.

`wsff.md`, "Why Software Factories Fail", argues "the lights off factory does not work" ([line 205](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L205)) [Verified]. The essay says "In July 2025 we went full lights-off" and that by November a full rewrite looked easier ([line 226](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L226)) [Reported]. Its explanation: training puts "no penalty for eroding codebase maintainability" ([lines 347-349](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L347-L349)). Its proposed fix is four human steps before code: product review, system architecture, program design (call-stack trees, file-tree diffs, signatures) and vertical slices ([lines 411-587](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L411-L587)). It closes with "Read the dang code" ([line 618](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L618)).

Two SlopCodeBench write-ups benchmark models over evolving checkpoints, each with a fresh context. On the write-up's 17-checkpoint subset Opus 5 reached a 24% strict pass ([line 33](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/benchmarking-opus-5-on-slop-code-bench.md#L33)). [Reported]

### The RPI prompts that ACE links to (Apache-2.0)

27 commands and 6 agents in the repository's Claude Code directory. [Verified]

- `create_handoff.md` is a handoff template (tasks and status, critical references, recent changes as file:line, learnings, artifacts, action items) that prefers `path:line` references over code blocks ([lines 45-64](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands/create_handoff.md#L45-L64)).
- `resume_handoff.md` marks each recent change "Verified present/Missing/Modified" ([lines 94-96](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands/resume_handoff.md#L94-L96)) under the rule "Never assume handoff state matches current state … Verify all file references still exist" ([lines 166-170](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands/resume_handoff.md#L166-L170)), and names four scenarios: clean, diverged, incomplete, stale.
- `implement_plan.md` pauses after each phase for manual verification ([lines 50-63](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands/implement_plan.md#L50-L63)); `create_plan.md` splits success criteria into automated and manual ([lines 345-371](https://github.com/humanlayer/humanlayer/blob/99abe673498cf8bdcd5f989aebe9406a27185b3b/.claude/commands/create_plan.md#L345-L371)).

### humanlayer/skills (MIT)

`design-control-loop` ([SKILL.md](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/SKILL.md)) interviews the user, then builds a scheduled loop [Verified]:

- set point, sensor, controller, actuator and disturbances, with a memory file loaded on every run;
- "Make each component runnable locally and standalone before wiring it into CI" ([line 28](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/SKILL.md#L28));
- flow control: "Recommended default: one open PR per loop" ([line 140](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/SKILL.md#L140)), implemented with `gh pr list --label` ([workflow-template.yml lines 55-63](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/references/workflow-template.yml#L55-L63));
- a **dampener**: a check that compares the sensor's output against a baseline and surfaces, or eventually blocks, newly introduced deviations while the loop chips away at the problem ([line 75](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/SKILL.md#L75)); advisory by default in the worked example ([example-control-loop.md line 39](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/design-control-loop/skills/design-control-loop/references/example-control-loop.md#L39)).

[`improve-claude-md`](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/improve-claude-md/skills/improve-claude-md/SKILL.md) wraps CLAUDE.md sections in `<important if="…">` blocks, on the premise that a Claude Code system-reminder calls the context "may or may not be relevant". [Verified: text read; the premise is not verified]

### shannon (dex, MIT)

A Bun CLI and SDK that makes interactive Claude Code look like `claude -p`. [Verified]

- It starts `claude` in tmux, waits for a prompt glyph in `capture-pane` output, and pastes the prompt with `set-buffer`, `paste-buffer` and `send-keys C-m` ([index.ts lines 1028-1045](https://github.com/dexhorthy/shannon/blob/c38691fbd1a40f198cc79b63383a7912df6f13e9/index.ts#L1028-L1045)).
- A turn is done when an assistant row is followed by a `system`/`turn_duration` row ([lines 694-718](https://github.com/dexhorthy/shannon/blob/c38691fbd1a40f198cc79b63383a7912df6f13e9/index.ts#L694-L718)). Timeouts are 20 s to start and 180 s per turn ([lines 78-80](https://github.com/dexhorthy/shannon/blob/c38691fbd1a40f198cc79b63383a7912df6f13e9/index.ts#L78-L80)).
- Parity with `claude -p` is marked "Partial" ([GOAL_PROGRESS.md lines 70-71](https://github.com/dexhorthy/shannon/blob/c38691fbd1a40f198cc79b63383a7912df6f13e9/GOAL_PROGRESS.md#L70-L71)). The repository does not say why it avoids `claude -p`.

### fold (Kyle Mistele, MIT)

A Bun monorepo on an Effect v4 release candidate: 409 TypeScript files across 13 packages [Verified]. On 2026-09-25 the GitHub API listed one contributor, the account K-Mistele (profile name Kyle Mistele, company HumanLayer: https://github.com/K-Mistele), with 212 commits, and 75 stars (https://github.com/humanlayer/fold) [Verified, 2026-09-25].

- **State** is an append-only log of tagged entries ([Schemas.ts lines 246-628](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/EventLog/Schemas.ts#L246-L628)), with read models as projections: 12FA factors 5 and 12 in code. [Verified]
- **Auto-compaction** fires at window − min(32k, window/4) − min(16k, window/8) and keeps a 20k-token tail ([CompactionEngine.ts lines 60-68](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/Compaction/CompactionEngine.ts#L60-L68)). A stale-usage guard allows no second compaction until a fresh response reports usage ([lines 83-103](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/Compaction/CompactionEngine.ts#L83-L103)), and a context-overflow error triggers one compact-and-retry ([lines 318-344](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/Compaction/CompactionEngine.ts#L318-L344)). Agents may override the threshold. The summary prompts are "ported verbatim from pi" ([CompactionPrompts.ts](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/Compaction/CompactionPrompts.ts#L1-L10)). [Verified]
- **After compaction** the model gets the path of the full pre-compaction log, told to "Treat it as last-resort archival memory", with a narrow search recipe scoped to its own agent id ([CompactionArchiveAccess.ts lines 36-58](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-agent/src/Mode/CompactionArchiveAccess.ts#L36-L58)). [Verified]
- **Doom-loop stop:** a run ends gracefully after N identical consecutive tool-call batches ([StopConditions.ts](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-core/src/StopConditions/StopConditions.ts#L1-L5)); the default is 3 ([Launch.ts lines 202-203](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-agent/src/Mode/Launch.ts#L202-L203)). [Verified]
- Claude models get `write`/`edit` tools and GPT/Codex gets `apply_patch`; an `--rpi` flag adds six specialist subagents ported from "riptide-rpi" prompts ([Rpi.ts](https://github.com/humanlayer/fold/blob/f8a2ce4362dc60784a3efda3bd78e08604029dfa/packages/fold-agent/src/Mode/Rpi.ts#L1-L25)). [Verified]

### Where the 40-60% figure went later

The March 2026 HumanLayer blog post (byline "Kyle"; we take it to be Kyle Mistele [Inference]) calls the low band the "smart zone" and the high band the "dumb zone", arguing an extended-context model is "the same model with some clever math", so a bigger window "just makes the haystack bigger". [Reported] The third-party QRSPI summary reports "keep context under 40%, start fresh at 60%" as practitioner consensus, and says QRSPI hides the ticket from research so research records facts, not opinions. [Reported, secondhand]

## Lessons for agent harnesses

Comparisons below are [Inference] unless labelled.

**Context target.** They keep utilization at 40-60%, stated for windows of about 170k-200k, and the "Skill Issue" post argues bigger windows do not help. By default OMP auto-compacts at window minus max(15%, 16,384 tokens) ([compaction.ts lines 333-335](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/agent/src/compaction/compaction.ts#L333-L335), [lines 388-411](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/agent/src/compaction/compaction.ts#L388-L411)) [Verified]. Their number is argued, not measured, for 1M windows.

**Context sensor.** fold reads context size from API-reported usage rather than estimating it from terminal scrollback. A harness that records the true number every turn gives a better sensor than any scrollback estimate.

**When compaction happens.** They compact intentionally at phase boundaries, though fold's automatic threshold still sits near the limit (about 95% of 1M, 76% of 200k). Automatic compaction near the limit is a safety net in both; the difference is workflow.

**After compaction.** fold tells the model where the raw log is. OMP offers a raw-transcript address (`history://current/full`) only in an experimental mode that is off by default ([experimental-context-rollover.md](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/prompts/system/experimental-context-rollover.md); [settings-schema.ts line 2528](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L2528-L2530)) [Verified]. Telling the model where the raw log is, as fold does, is cheap, bounded and better than guessing [Inference].

**Post-compaction recovery.** They have explicit `/create_handoff` and `/resume_handoff` commands. OMP exposes compaction events to extensions ([types.ts lines 1252-1257](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/extensibility/extensions/types.ts#L1252-L1257)) [Verified], so a harness can run the same kind of recovery step when compaction happens.

**Verify before resuming.** They mark every change a handoff names as present, missing or modified. That check keeps a resumed session from trusting a stale handoff.

**Human review.** They put human review at research and plan; their essay reports that lights-off failed [Reported]. Their evidence is one team's reported experience. Whether agent review can stand in for human review at the plan stage is open, and it is a policy choice for a human, not an agent.

**Plan size.** Theirs is about 200 lines, short enough for a human; QRSPI reportedly says 1,000-line plans hide surprises [Reported]. The right size depends on the reader: a plan a human reviews differs from one only agents read.

**Loop design.** They have a dampener, one open PR per loop, a memory file and local-first components. The dampener guards against regressions while a loop works and the one-PR bound limits work in progress; stall detection alone covers neither.

**Doom loops.** fold stops after 3 identical batches; OMP steers after 5 identical calls ([settings-schema.ts lines 1383-1415](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L1383-L1415)) [Verified]. Where identical calls can be legitimate polling, steering suits better than stopping.

**Repeated errors.** Factor 9 says about 3 attempts, then escalate. A consecutive-error count is a useful signal even where no cap interrupts the agent.

**Detecting turn end.** shannon reads the transcript's `turn_duration` row; comparing pane captures and handling spinners is the text-heuristic alternative. A typed signal on disk beats text heuristics.

**Agent size.** 12FA says 3-10, maybe 20 steps. The unit matters: a small focused agent can be one task inside a long-lived session, so step caps and session lengths are not directly comparable.

## Reuse terms

1. **12-Factor Agents prose, images and snippets.** CC BY-SA 4.0 §3(b) requires adaptations to carry BY-SA, and §2(a)(5)(B) forbids added downstream restrictions ([legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)). [Inference: our reading, not legal advice] Paraphrasing and linking the factor avoids this; code under `packages/` is Apache-2.0 and fine with a notice.
2. **ACE and wsff prose or images.** No license file, so link only.

## Attribution we owe

- **dex** (https://github.com/dexhorthy; the ACE essays were committed from that account, per the [commit history](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/commits/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/)): "frequent intentional compaction", the 40-60% utilization target, research-plan-implement with human review at research and plan, and "subagents are about context control" (ACE). Cite the essays wherever these ideas are used.
- **Geoffrey Huntley** (named in ACE as the source): the "approximately 170k of context window" quote and the Ralph loop that ACE cites. Covered in our separate Huntley deep dive.
- **HumanLayer's RPI commands** (Apache-2.0): the handoff and resume structure and the verify-before-acting rule. If text is adapted, keep the Apache notice and state the changes (Apache-2.0 §4(b)-(c)).
- **Kyle Mistele, fold** (MIT; sole contributor per the GitHub API): the post-compaction archive pointer, the stale-usage guard and the doom-loop stop. fold's compaction prompts are "ported verbatim from pi", so the chain runs back to Pi (MIT, copyright Mario Zechner), which OMP also descends from. Also the "smart zone / dumb zone" framing from the "Skill Issue" post.
- **humanlayer/skills** (MIT): the control-loop vocabulary applied to agent loops (dampener as a baseline regression gate, one open PR per loop as flow control).
- **shannon** (MIT, dex): detecting turn end from the transcript's `turn_duration` row.
- **12-Factor Agents** (CC BY-SA 4.0 content): link-level citation of factors 3, 9 and 10.
- **SlopCodeBench**, Gabriel Orlanski and co-authors per the arXiv author list (https://arxiv.org/abs/2603.24755; repository MIT, problems Apache-2.0).
- **Chroma's context-rot report** (Kelly Hong, Anton Troynikov and Jeff Huber, https://research.trychroma.com/context-rot), which the "Skill Issue" post cites as the empirical basis for the dumb zone.

## What we could not verify

- **Outcome claims in ACE and wsff:** BAML "35k LOC in 7 hours" and its merged PRs, "$12k on opus per month", the lights-off failure and rewrite, and the Faros AI figures. We did not check the PRs or the report.
- **The QRSPI content** (eight stages, hiding the ticket during research, "under 40%, fresh at 60%"). We read only a third-party summary, not the talk.
- **Whether 40-60% fill harms quality on 1M-token windows.** A comparative study is proposed and not yet run.
- **Running the subject code.** We did not run shannon, fold, design-control-loop or any 12FA code, or their tests.
- **Provider terms** for driving an interactive Claude Code session from tmux, as shannon and ntm both do.
- **The `improve-claude-md` premise** that Claude Code under-weights CLAUDE.md sections because of a system-reminder.
