---
title: dex, Kyle Mistele and HumanLayer (12-Factor Agents, ACE-FCA, skills, shannon, fold)
covers: 87, 97
written: 2026-09-25
summary: How HumanLayer's 12-Factor Agents, ACE-FCA context compaction, control-loop skills, shannon and fold compare with our agent harness, with measurements of our own context fill and twelve proposals.
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
- Our harness, oh-my-pi (OMP): https://github.com/can1357/oh-my-pi/tree/v18.3.0 (pin: tag `v18.3.0`, the version we measured). MIT.
- SlopCodeBench: https://github.com/SprocketLab/slop-code-bench (MIT), problems at https://github.com/gabeorlanski/scb-problems (Apache-2.0), paper https://arxiv.org/abs/2603.24755 (licenses checked via the GitHub API, 2026-09-25).
- CC BY-SA 4.0 legal code: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en (read 2026-09-25).
- The Independent 100 list, curated by dan: https://independent.prose.md/ (dex is rank 87, Kyle Mistele rank 97). This study is ours and is not endorsed by dan or by anyone listed.
- Our own measurements of our harness's session files, run 2026-09-25 about 04:30Z. [Verified, our own setup]

## How to read this

Written 2026-09-25 by an AI agent session. [Verified] means we read the file at the pin or ran the check. [Reported] means the author or a third party says so and we did not check it. [Inference] is our reasoning. [Verified, our own setup] marks a measurement of our own machine that a reader cannot reproduce.

## What they built

### 12-Factor Agents (dex, 2025)

A doctrine repository of twelve factor files plus an appendix ("factor 13, pre-fetch context"); two generations of the files (`factor-3-…` and `factor-03-…`) coexist and differ. The code is a scaffolder and a set of workshops; the last commit was 2025-09-21. [Verified] The factors that bear on our stack [Verified]:

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

## How our setup compares

### What we measured first

We measured all 364 session files our harness wrote between 2026-08-23 and 2026-09-25 (12 GB). A turn's fill is the prompt size the harness records for that turn divided by the model's context window from the harness's model cache; one turn checked by hand matched input + cache read + cache write (83,837 = 4 + 7,555 + 76,278). 329,064 turns in 302 sessions were measurable; we excluded 17,550 turns with no usage and 13,322 on two models with no window in the cache. All rows below are [Verified, our own setup].

| Measure | Value |
|---|---|
| Median turn fill | 48% (p90 78%, p99 85%) |
| Turns above 40% / 60% / 80% | 61% / 34% / 7% |
| Median prompt size | 453,626 tokens; 87% of turns above 200k |
| Turns above 40%, by model | gpt-5.6-luna 56%, claude-opus-5 70%, opus-5-5 67%, grok-4.6 81% |
| Session length | Median 9 turns, p75 827, p90 3,561, max 14,333 |
| Compactions | 791 in 95 sessions; median trigger 85.1% of a 1M window; methods: remote 552, snapcompact 219, soft 12, handoff 8 |
| Early compactions | 147 at 23-26% of the listed window; 138 are gpt-5.6-luna, remote method |
| Tool error rate, fill 0-20% up to 80-100% | 5.5%, 3.8%, 3.4%, 3.2%, 3.3% (341,099 results) |
| Same, within 102 sessions | 0.7 points lower at high fill on average; higher in only 33 |
| Runs of 3+ identical tool-call batches | 490, of which 459 are `hub` waits |
| Streaks of 3+ / 5+ consecutive tool errors | 223 / 30 |

**Live sensor check.** Within one minute we compared the context reading from ntm (a tmux orchestration tool by Jeffrey Emanuel, per its [LICENSE](https://github.com/Dicklesworthstone/ntm/blob/84b0a4fe106791580dfdb4b2812a6378c5c0e059/LICENSE); https://github.com/Dicklesworthstone/ntm) with the session file for three panes. [Verified, our own setup]

| Pane | ntm reading | Session file |
|---|---|---|
| A | 31% of an assumed 128k | 50% of 272k |
| B | 68% of 128k | 9% of 1M |
| C | 68% of 128k | 41% of 1M |

ntm labelled every row a low-confidence scrollback estimate with a 128,000 limit. OMP's per-terminal session pointers can also outlive their process and are kept per profile, so a sensor must confirm a live process owns the pointer. [Verified, our own setup]

### Comparison

Verdicts are [Inference].

**Context target.** They keep utilization at 40-60%, stated for windows of about 170k-200k, and the "Skill Issue" post argues bigger windows do not help. We have no configured target: OMP auto-compacts at window minus max(15%, 16,384 tokens) ([compaction.ts lines 333-335](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/agent/src/compaction/compaction.ts#L333-L335), [lines 388-411](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/agent/src/compaction/compaction.ts#L388-L411)) [Verified], which fired at a median 85.1% here, and at least eight places in our own skills and scripts state different thresholds (50/70/85, 60/85/92, 90/97, 60/70/80/90 and others). **Unresolved.** Their number is argued, not measured, for 1M windows; our proxy shows no harm but measures the wrong thing (early exploration fails more often). In absolute tokens their rule would put 87% of our turns over the line. Test it (P3).

**Context sensor.** fold reads context size from API-reported usage; we estimate from scrollback (ntm, assumed 128k) or scrape the status bar. **Theirs.** The harness writes the true number to disk every turn; our estimate was 3-12x off in tokens.

**When compaction happens.** They compact intentionally at phase boundaries, though fold's automatic threshold still sits near the limit (about 95% of 1M, 76% of 200k). Ours is automatic near the limit; only 8 of 791 compactions used the handoff method. **Both are safety nets.** The difference is workflow: our long panes run thousands of turns across repeated compactions (one session: 10,621 turns, 30 compactions).

**After compaction.** fold tells the model where the raw log is. OMP offers a raw-transcript address (`history://current/full`) only in an experimental mode that is off by default ([experimental-context-rollover.md](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/prompts/system/experimental-context-rollover.md); [settings-schema.ts line 2528](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L2528-L2530)) [Verified]. **fold.** Cheap, bounded, better than guessing.

**Post-compaction recovery.** They have explicit `/create_handoff` and `/resume_handoff` commands. In our Claude Code configuration the recovery scripts exist but are not registered as hooks, and the reminder names a command that is not installed; none of our OMP extensions subscribe to OMP's compaction events ([types.ts lines 1252-1257](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/extensibility/extensions/types.ts#L1252-L1257)) [Verified, our own setup]. **Theirs.** Our recovery path is documented but does not run.

**Verify before resuming.** They mark every change a handoff names as present, missing or modified. One of our skills says to check artifacts exist; our keepalive re-prime tells the agent its work is on disk but checks nothing. **Theirs.**

**Human review.** They put human review at research and plan; their essay reports that lights-off failed [Reported]. Our agent lanes review, a human is required only for irreversible choices, and our planning procedure reaches "ready" on the reviewer model's verdict. **Open**, the largest philosophical gap. Their evidence is one team's reported experience; ours is unmeasured, since we have no reopen or rework oracle. A decision for the human operator, not an agent (P9).

**Plan size.** Theirs is about 200 lines, short enough for a human; QRSPI reportedly says 1,000-line plans hide surprises [Reported]. Our planning skills ask for 3,000-6,000+ lines, and implementers read self-contained task beads, not the plan. **Neither**: the readers differ.

**Loop design.** They have a dampener, one open PR per loop, a memory file and local-first components. We have richer stall handling (zero-value-tick ladders, a "3 identical consecutive blockers" rule, a negative-evidence ledger), but no dampener wired into any loop (our ratchet rule has one live consumer, a pre-push hook) and no work-in-progress bound: we have seen 25 tasks in progress with 1 dispatchable. **Theirs** on dampener and flow control, **ours** on stall detection.

**Doom loops.** fold stops after 3 identical batches; OMP steers after 5 identical calls ([settings-schema.ts lines 1383-1415](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L1383-L1415)) [Verified]. **Ours, for our workload**, since 459 of our 490 such runs are `hub` waits.

**Repeated errors.** Factor 9 says about 3 attempts, then escalate. OMP has no per-tool error cap; we have only tick-level caps. **Theirs, as a signal**; the rate is low, so measure first (P10).

**Detecting turn end.** shannon reads the transcript's `turn_duration` row; we compare two pane captures and handle spinners. Claude Code 2.1.282 writes `turn_duration` rows (9 of our 40 newest transcripts) and OMP writes a `stopReason` on every assistant entry [Verified, our own setup]. **Theirs.** A typed signal on disk beats text heuristics.

**Agent size.** 12FA says 3-10, maybe 20 steps. Ours are bounded by task scope with no step cap; our p75 session is 827 turns. **Different units**: a task bead is our "small agent", and whether the long-lived pane costs quality is unmeasured (P3).

## What we would adopt

All twelve are drafts for review; nothing in our setup was changed during this study. Effort: S small, M medium.

### P1. Read context fill from session files

- **Change.** A sensor that reads each OMP pane's fill from its session file, used by our keepalive and fleet-monitoring rules; document that ntm's context output is a scrollback estimate and consider reporting it upstream.
- **Why.** Every threshold we already have would run on true numbers, not a reading 3-12x off.
- **Cost.** S; ours. Risks: stale pointers, per-profile storage, schema drift across OMP versions.
- **Test.** Run sensor and ntm in the same minute; each live pane reads OK or a typed reason, a pane with no process says so, a fixture reads back exactly. First run, 2026-09-25, 11 panes: 5 OK, 3 no assistant turn yet, 3 no process. [Verified, our own setup]

### P2. One context-budget table

- **Change.** One table of every threshold with its owner and action, each as a percentage and in tokens for 272k, 500k and 1M windows; other places link to it. No values change.
- **Why.** Agents stop choosing among 60, 70, 80 and 85.
- **Cost.** S; ours; low risk.
- **Test.** A search of our skills finds threshold numbers only in the table and its links.

### P3. Test the 40-60% claim before adopting it

- **Change.** An A/B arm with OMP's `compaction.thresholdTokens` at 400,000 ([settings-schema.ts lines 2590-2597](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L2590-L2597), "overrides percentage if set") against the default (about 850k), tasks assigned at random. Outcomes: 14-day reopen, failed verification at close, reviewer findings and cost per closed task. Pre-registered.
- **Why.** Tests the context-rot claim under ACE-FCA and the smart zone on our own work.
- **Cost.** M; configuration only. More compactions lose detail and cost money.
- **Test.** Confirm the arm's median trigger is near 400k, then compare reopen rates at a sample size set in advance. A negative result is a result.

### P4. OMP post-compaction recovery extension

- **Change.** An extension on OMP's `session.compacting` event, whose handler may return extra context lines ([shared-events.ts lines 78-82](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/extensibility/shared-events.ts#L78-L82), [lines 386-392](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/extensibility/shared-events.ts#L386-L392)). It injects our reading list, the session log location with a narrow search recipe (after fold), and a verify-before-act rule (after `resume_handoff`). It goes through our hook review first and must fail open.
- **Why.** The 791 compactions we measured got no project-specific recovery.
- **Cost.** S-M. fold is MIT and HLC Apache-2.0: write our own wording; if text is copied, keep the notice and mark changes.
- **Test.** In a test profile with a low threshold, the summary contains the block and the next turn reads the named files; with the extension off, the block is absent.

### P5. Fix or retire our Claude Code post-compaction wiring

- **Change.** Register the existing recovery scripts as hooks through our hook review, or remove the claim that they run; either way fix the uninstalled command the reminder names. Most of our panes run OMP, so retiring may be right.
- **Cost.** S; ours. **Test.** A test compaction shows the reminder, and every command it names exits 0.

### P6. Turn-end signal from session files (after shannon)

- **Change.** An OMP pane is idle when its last assistant entry has `stopReason` `stop`, `aborted` or `error` with nothing newer; a Claude Code pane when a `turn_duration` row follows the last user row. Two-capture stays as the fallback.
- **Cost.** S; shannon MIT, idea only. Risks: write lag, and subagents still running while the parent says `stop`.
- **Test.** Both detectors on all panes for 24 hours; hand-adjudicate 30 disagreements; the new one must be wrong no more often.

### P7. A dampener field in our loop rules

- **Change.** Every loop that drives a metric declares a baseline and a new-violations-only check on the path where others change code; advisory first, blocking once trusted, under our existing no-silent-re-baseline rule.
- **Cost.** M; humanlayer/skills MIT, cite the vocabulary. Risks: false blocks, baseline gaming.
- **Test.** A fixture with 10 old violations and 1 new reports exactly 1 (advisory) and fails (blocking); removing old violations never fails.

### P8. A work-in-progress bound

- **Change.** No new task for an agent already holding one in progress; a loop no-ops at its bound (default 1), as in design-control-loop's flow control; release on timeout.
- **Cost.** S-M; idea only. Risk: a stuck task blocks its pane without the timeout.
- **Test.** Daily count of agents holding more than one in-progress task, before and after; target 0.

### P9. Optional human plan-review packet

- **Change.** The human operator's decision. For plans touching more than N files or a public contract, a review packet of at most 200 lines (design, call-stack tree, file-tree diff, signatures, per [wsff.md](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/wsff.md#L481-L536)) before the plan is marked ready.
- **Cost.** S to write; the real cost is the operator's time. ACE has no license: idea only.
- **Test.** Compare 14-day reopen and rework rates for tasks from reviewed and unreviewed plans.

### P10. Consecutive-error streak signal

- **Change.** Add the streak counter to our fleet report, with no interrupting hook. Cite factor 9 by link.
- **Test.** Daily counts against the baseline (223 streaks of 3+, 30 of 5+, 2026-08-23 to 09-25), correlated with stuck and handoff events.

### P11. Correct one of our own skills

We would also correct one of our own skills about how OMP maps terminal panes to session files.

### P12. SlopCodeBench as an outside oracle

- **Change.** Reproduce dex's `circuit_eval` numbers on one model as calibration, then run our harness profiles.
- **Why.** The only unsaturated benchmark we found that scores maintainability across evolving requirements.
- **Cost.** M. Bench MIT, problems Apache-2.0; keep the notices.
- **Test.** Calibration within the write-up's reported variance, then strict pass and slop metrics per checkpoint per profile.

## What we would not adopt

1. **A 40-60% compaction threshold as fleet configuration now.** It was set for windows of about 200k, is untested on our mostly 1M windows, our one proxy points the other way, and it would compact far more often (61% of our turns are above 40%). [Inference] Run P3 first.
2. **fold's doom-loop stop at 3 identical batches.** 459 of our 490 runs of that length are `hub` waits, which are legitimate polling. OMP's guard steers rather than stops, at 5; its default exempt list in v18.3.0 is `["wait"]` ([settings-schema.ts line 231](https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts#L231)), which names a different tool from `hub` [Verified]. Whether `hub` waits trip the guard in practice we did not test.
3. **shannon as a dependency.** ntm already drives interactive CLIs in tmux, and shannon supports Claude Code only with a hard-coded 180 s turn timeout, unfit for our long turns. Take only the transcript-tail idea (P6).
4. **fold as a harness replacement.** One contributor, an Effect v4 release candidate, 75 stars. fold and OMP both descend from Pi (https://github.com/earendil-works/pi; copyright Mario Zechner per its [LICENSE](https://github.com/earendil-works/pi/blob/e473b5cd8b6f2e82f1295aeee81cb697ffde2ed5/LICENSE)); the clearest thing fold has that our default OMP setup lacks is the archive pointer, which P4 takes as an idea.
5. **Copying 12-Factor prose, images or snippets into our skills.** CC BY-SA 4.0 §3(b) requires adaptations to carry BY-SA, and §2(a)(5)(B) forbids added downstream restrictions ([legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)). Our skills are distributed under terms that could not carry a ShareAlike passage. [Inference: our reading, not legal advice] Paraphrase and link the factor; code under `packages/` is Apache-2.0 and fine with a notice.
6. **Copying ACE or wsff prose or images.** No license file, so link only.
7. **A fleet-wide rule that a human reads all the code or reviews every PR.** That is wsff's thesis and a policy choice beyond an agent's authority; P9 is the small, testable version.
8. **Shrinking our agent-facing plans to 200 lines.** Different reader.
9. **`improve-claude-md`'s `<important if>` rewrite of our agent instructions.** Its rationale is a Claude Code system-reminder, our main harness is OMP, and we did not verify the effect carries over. Test on one repository first.

## Attribution we owe

- **dex** (https://github.com/dexhorthy; the ACE essays were committed from that account, per the [commit history](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/commits/f2bc7aec4575418d2d2e83fec078266cc56d3e6a/)): "frequent intentional compaction", the 40-60% utilization target, research-plan-implement with human review at research and plan, and "subagents are about context control" (ACE). Cite the essays wherever these ideas are adopted (P2, P4).
- **Geoffrey Huntley** (named in ACE as the source): the "approximately 170k of context window" quote and the Ralph loop that ACE cites. Covered in our separate Huntley deep dive.
- **HumanLayer's RPI commands** (Apache-2.0): the handoff and resume structure and the verify-before-acting rule. If text is adapted, keep the Apache notice and state the changes (Apache-2.0 §4(b)-(c)).
- **Kyle Mistele, fold** (MIT; sole contributor per the GitHub API): the post-compaction archive pointer, the stale-usage guard and the doom-loop stop. fold's compaction prompts are "ported verbatim from pi", so the chain runs back to Pi (MIT, copyright Mario Zechner), which OMP also descends from. Also the "smart zone / dumb zone" framing from the "Skill Issue" post.
- **humanlayer/skills** (MIT): the control-loop vocabulary applied to agent loops (dampener as a baseline regression gate, one open PR per loop as flow control).
- **shannon** (MIT, dex): detecting turn end from the transcript's `turn_duration` row.
- **12-Factor Agents** (CC BY-SA 4.0 content): link-level citation of factors 3, 9 and 10.
- **SlopCodeBench**, Gabriel Orlanski and co-authors per the arXiv author list (https://arxiv.org/abs/2603.24755; repository MIT, problems Apache-2.0), if P12 runs.
- **Chroma's context-rot report** (Kelly Hong, Anton Troynikov and Jeff Huber, https://research.trychroma.com/context-rot), which the "Skill Issue" post cites as the empirical basis for the dumb zone.

## What we could not verify

- **Outcome claims in ACE and wsff:** BAML "35k LOC in 7 hours" and its merged PRs, "$12k on opus per month", the lights-off failure and rewrite, and the Faros AI figures. We did not check the PRs or the report.
- **The QRSPI content** (eight stages, hiding the ticket during research, "under 40%, fresh at 60%"). We read only a third-party summary, not the talk.
- **Whether 40-60% fill harms quality in our fleet.** Tool errors fall with fill, but that is confounded by session phase and is not a quality oracle. P3 is the test.
- **Why 138 remote compactions on gpt-5.6-luna fired at about 237k-261k tokens** when the cache lists a 1M window. A provider-side threshold is our guess.
- **Excluded turns:** 13,322 on models with no window in the cache and 17,550 with no usage.
- **How our status-bar scraper behaves on OMP panes.** We compared session files only against ntm's estimate.
- **Why the sensor found no assistant turn for three live panes.** A new session, or a last assistant line outside the part of the file we read, are guesses.
- **Running the subject code.** We did not run shannon, fold, design-control-loop or any 12FA code, or their tests.
- **Provider terms** for driving an interactive Claude Code session from tmux, as shannon and ntm both do.
- **Whether `hub` waits trip OMP's loop guard** in practice.
- **The `improve-claude-md` premise** that Claude Code under-weights CLAUDE.md sections because of a system-reminder.
