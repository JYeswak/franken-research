---
title: Omar Khattab and alex zhang, GEPA for skills and Recursive Language Models for long context
covers: 11, 20
written: 2026-09-25
summary: How GEPA's outcome-scored optimizer and Recursive Language Models compare with how we grade skills, recover after compaction and plan search, with two costed experiments.
---

## Sources

- GEPA: https://github.com/gepa-ai/gepa/tree/d771eb21b5dd3228bc3f567293d2ccfc423fc900 (commit `d771eb2`, package 0.1.4, read 2026-09-25).
- DSPy: https://github.com/stanfordnlp/dspy/tree/2413b67a4d08a476e4bc6f40b9f8f42f87711ee7 (tag 3.4.0).
- rlm (PyPI `rlms`): https://github.com/alexzhang13/rlm/tree/d04208afbad29ca675ab13478c40ee8bebc84bfe (commit `d04208a`, version 0.1.3).
- rlm-minimal: https://github.com/alexzhang13/rlm-minimal/tree/973f8d4acf3af2c86dc170af91607bf8b0c4d0ea (commit `973f8d4`).
- spec-ptc: https://github.com/alexzhang13/spec-ptc/tree/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17 (tag v0.1.1).
- Papers, abstracts only (read 2026-09-25): GEPA https://arxiv.org/abs/2507.19457, RLM https://arxiv.org/abs/2512.24601, WARP https://arxiv.org/abs/2501.17788.
- gskill post, "Automatically Learning Skills for Coding Agents": https://gepa-ai.github.io/gepa/blog/automatically-learning-skills-for-coding-agents/ (source file `docs/docs/blog/posts/2026-02-18-automatically-learning-skills-for-coding-agents/index.md` at the GEPA commit).
- optimize_anything post: https://gepa-ai.github.io/gepa/blog/introducing-optimize-anything/ (source file `.../2026-02-18-introducing-optimize-anything/index.md` at the GEPA commit).
- RLM blog post https://alexzhang13.github.io/blog/2025/rlm/ and spec-ptc blog post https://alexzhang13.github.io/blog/2026/spec-ptc/ (read 2026-09-25).
- OMP (oh-my-pi), the harness we run: https://github.com/can1357/oh-my-pi/tree/v18.3.1 (tag `v18.3.1`).
- franken-research search plan: https://github.com/JYeswak/franken-research/tree/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc (commit `385c026`).
- Personal pages https://omarkhattab.com/ and https://alexzhang13.github.io/ (read 2026-09-25).

Ranks 11 (Omar Khattab, `@lateinteraction`) and 20 (listed as "alex zhang", `@a1zhang`) in dan's Independent 100, section "The Frontier Outside". Written 2026-09-25 by an AI agent session. This page is about public work and artifacts; it is one reviewer's reading, not a ranking of people.

Labels: **[Verified]** we read it at the pin or ran it; **[Reported]** the authors say so and we did not reproduce it; **[Inference]** our reasoning; **[Verified, our own setup]** a fact about our own tools. File references like "engine.py L373" are at the pinned commits above.

## Roles and licences

- Khattab: "I'm an Assistant Professor at MIT EECS and a member of CSAIL, where I lead the MIT OASYS lab"; the lab's "current members include: Alex L. Zhang (with Tim Kraska)" [Verified: https://omarkhattab.com/, "Research Group"]. Zhang: "PhD student at MIT CSAIL advised by Omar Khattab and Tim Kraska" [Verified: https://alexzhang13.github.io/]. The rlm README says it "is maintained by the authors of the paper from the MIT OASYS lab" [Verified: [README L40](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/README.md#L40)]. The RLM paper's authors are Zhang, Kraska and Khattab [Verified: arXiv:2512.24601].
- All five repositories are MIT [Verified: LICENSE files at the pins and the GitHub licence API]: GEPA "© 2025 Lakshya A Agrawal", DSPy "(c) 2023 Stanford Future Data Systems", rlm and spec-ptc "(c) 2026 Alex Zhang", rlm-minimal "(c) 2025 az". ColBERT (https://github.com/stanford-futuredata/ColBERT), WARP (https://github.com/jlscheerer/xtr-warp) and PyLate (https://github.com/lightonai/pylate) are MIT. ColBERT checkpoints on Hugging Face were not licence-checked.

## What they built

### GEPA core

GEPA ("Genetic-Pareto") optimizes the text inside an AI system: it samples runs, reflects on them in natural language, proposes new text and keeps candidates on a Pareto frontier [Verified: GEPA abstract]. Across six tasks the paper reports beating GRPO by 6% on average and by up to 20% with up to 35x fewer rollouts, and MIPROv2 by over 10% [Reported]. Khattab is the last of 17 authors; the first is Lakshya A Agrawal [Verified: GEPA CITATION.cff].

- **Reflection.** The default proposer shows the current instruction and examples with outputs and feedback, and asks for "niche and domain specific factual information" and any "generalizable strategy" [Verified: [instruction_proposal.py L129-L145](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/strategies/instruction_proposal.py#L129-L145)].
- **Acceptance.** A child is kept only if its summed minibatch score strictly beats the parent's (`new_sum > old_sum`), then it is scored on the validation set [Verified: [acceptance.py L50-L53](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/strategies/acceptance.py#L50-L53); engine.py L373-L382].
- **Pareto selection.** Parents are sampled in proportion to how many validation instances they lead on, after dominated candidates are removed, so a candidate that wins only a few cases survives [Verified: [gepa_utils.py L107-L125](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/gepa_utils.py#L107-L125)].
- **Dependencies.** Core declares `dependencies = []`; the `[full]` extra pulls LiteLLM, capped below 1.92 because 1.92 ships Linux-only wheels [Verified: [pyproject.toml L20-L32](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/pyproject.toml#L20-L32)].

### optimize_anything

`optimize_anything(seed_candidate, evaluator, dataset, valset, objective, background, test_set, config)` optimizes any text against a function returning `(score, info)` [Verified: [optimize_anything.py L94-L126](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/optimize_anything.py#L94-L126)].

- **Actionable Side Information (ASI).** `info` is a free-form dict shown to the proposer, so the evaluator can explain why a candidate failed.
- **Modes.** No dataset is single-task search, a dataset is multi-task, and a dataset plus validation set is "generalization", the mode for skills [Verified: optimize_anything post].
- **Sealed test set.** `test_set` "never enters the eval server, so engines and agents cannot see it"; seed and result are scored on it outside the budget [Verified: optimize_anything.py L147-L152].
- **Budgets.** `max_evals` (default 100) or `max_token_cost`, which caps only the proposer's spend, not the evaluator's [Verified: [oa/config.py L36-L44](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/oa/config.py#L36-L44)].
- **Engines.** `GepaEngine`, `AutoResearchEngine`, `MetaHarnessEngine` and `BestOfNEngine` share the API (optimize_anything.py L65). The autoresearch engine runs one `claude --print` session against an eval server that enforces the budget (HTTP 429) and seals the test set [Verified: [autoresearch.py L1-L15](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/oa/engines/autoresearch.py#L1-L15)]; the project runs those sessions under bubblewrap on Linux and Claude Code's Seatbelt settings on macOS [Verified: oa/sandbox.py].

### gskill: learning skills for coding agents

The gskill post and code come from a UC Berkeley group: Shangyin Tan and Lakshya A Agrawal (equal contribution), Rohit Sandadi, Dan Klein, Koushik Sen, Alexandros G. Dimakis and Matei Zaharia [Verified: post front matter; GEPA docs/docs/blog/.authors.yml L17-L20]. **Neither Khattab nor Zhang is a gskill author**; Khattab co-authored the optimize_anything post.

- SWE-smith generates about 300 verifiable bug-fix tasks per repository (about 200 train, 50 validation, 60 test). The seed skill is empty; each rollout runs mini-SWE-agent in Docker and scores 1 only if fail-to-pass tests pass with no regression [Verified: gskill post; [swe_fitness_fn.py L74-L108](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/gskill/gskill/swe_fitness_fn.py#L74-L108)].
- Config: Pareto selection, `reflection_minibatch_size=3`, `skip_perfect_score=True`; the full run uses `--max-metric-calls 600`, `gpt-5-mini` as agent and `gpt-5.2-pro` for reflection [Verified: [train_optimize_anything.py L665-L681](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/gskill/gskill/train_optimize_anything.py#L665-L681); gskill README L52-L58].

With gpt-5-mini the resolve rate goes from 55% to 82% on Jinja and 24% to 93% on Bleve, and the skills transfer to Claude Code [Reported: gskill post]. We did not reproduce this, and the posts disagree with themselves:

- Bleve, Haiku 4.5 with skills: 98.3% in the figure alt-text, 100% in the text and in the optimize_anything caption [Verified: [gskill post L86](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/docs/docs/blog/posts/2026-02-18-automatically-learning-skills-for-coding-agents/index.md#L86) versus L35; [optimize_anything post L283](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/docs/docs/blog/posts/2026-02-18-introducing-optimize-anything/index.md#L283)].
- Jinja, Sonnet 4.5 drops from 100.0% to 98.5% with skills [Verified: gskill post L91].
- "47% faster" does not follow from the plotted Bleve durations: Sonnet 285 s to 169 s (-41%), Haiku 173 s to 142 s (-18%) [Inference: arithmetic on L86].

The authors say SWE-smith tasks are "on the simpler side" and that some skills fit SWE-smith-style fixes more than general coding [Reported: gskill post L119, L141]. Three design facts shape reuse:

- **Only the body is optimized**; the installed `description` is fixed boilerplate, so triggering is never optimized [Verified: [claude_code_skills.py L56-L83](https://github.com/gepa-ai/gepa/blob/d771eb21b5dd3228bc3f567293d2ccfc423fc900/src/gepa/gskill/gskill/evaluate/claude_code_skills.py#L56-L83)].
- **Setup failures score 0.0**: Docker and git errors count as the skill failing [Verified: swe_fitness_fn.py L156-L187].
- **Costs are logged, not published**: the runner writes an agent/reflection cost split; the post gives no dollar figure [Verified: gskill README L119].

### How GEPA could score our SKILL.md files

- **Metric.** A per-task score from an external oracle on the outcome, not the skill's form, with a deterministic check (validator exit code, tests, required facts) and the checker's messages returned as ASI [Inference]. gskill has this shape: tests are the oracle, truncated test output the ASI (swe_fitness_fn.py L118-L137).
- **Gold set.** 40-60 tasks per skill from real work, split into train, validation and a sealed `test_set`, with held-out families. This matches the certification rule one of our skill-authoring skills already sets: a fresh agent given only the skill completes held-out work sealed by a different model lineage, with at least three out-of-distribution families [Verified, our own setup].
- **Scope.** Optimize the body only and freeze the `description`, as gskill does [Inference].
- **Cost.** (rollouts x tokens x agent price) + (reflection calls x tokens x reflection price) + test passes outside `max_evals`; about $35 for one skill at assumed prices, capped at $50 (first experiment below) [Inference].

### DSPy, only as far as GEPA needs it

DSPy pins `gepa[dspy]==0.1.4` [Verified: DSPy pyproject.toml L37]. `dspy.GEPA` needs exactly one of `auto`, `max_full_evals` or `max_metric_calls`, and its metric may return a score with textual feedback [Verified: [gepa.py L34-L59](https://github.com/stanfordnlp/dspy/blob/2413b67a4d08a476e4bc6f40b9f8f42f87711ee7/dspy/teleprompt/gepa/gepa.py#L34-L59), L451-L453]. For SKILL.md files DSPy is not needed: optimize_anything takes a plain string and evaluator. `dspy.RLM`'s REPL defaults to a Deno/Pyodide WebAssembly interpreter [Verified: DSPy predict/rlm.py L117-L127].

### Recursive Language Models (paper, rlm, rlm-minimal)

An RLM keeps the long prompt out of the model's context. The prompt is a variable in a Python REPL; the root model writes code that peeks at it, greps it, partitions it and calls sub-models (`llm_query`) or child RLMs (`rlm_query`) on slices [Verified: RLM blog; rlm utils/prompts.py].

- **Reported results.** Inputs "two orders of magnitude beyond model context windows"; on GPT-5, median gains of 26% over compaction, 130% over CodeAct with sub-calls and 13% over Claude Code across four long-context tasks "while having comparable cost"; a post-trained RLM-Qwen3-8B [Reported: RLM paper]. RLM(GPT-5-mini) more than doubles GPT-5's correct answers on an OOLONG split, and quality holds at 10M+ tokens on BrowseComp-Plus [Reported: RLM blog].
- **Stated limits.** Sub-calls are blocking with no prefix caching, and "we do not currently have strong guarantees about controlling either the total API cost or the total runtime" [Verified: RLM blog, "Limitations"].
- **Library.** `RLM(...)` defaults to `environment="local"`, `max_depth=1`, `max_iterations=30`, with optional `max_budget` (needs a cost-tracking backend), `max_timeout`, `max_tokens` and `max_errors` [Verified: [core/rlm.py L53-L61](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/core/rlm.py#L53-L61), L86-L94]. Environments: `local`, `ipython`, `modal`, `docker`, `daytona`, `prime`, `e2b`.
- **Compaction keeps the full history.** With `compaction=True` the root context is summarized at 85% of the model's limit while the full trajectory stays in a REPL variable, `history` [Verified: [core/rlm.py L319-L323](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/core/rlm.py#L319-L323), L460-L461]. This is the sharpest contrast with our compaction.
- **rlm-minimal** is a roughly 1,200-line, OpenAI-only reference with depth-1 recursion [Verified: rlm-minimal README].

Execution environments, as the project documents them:

- "The default RLM client uses a REPL environment that runs on the host process through Python `exec` calls. It uses the same virtual environment as the host process" [Verified: [README L51](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/README.md#L51)]. Non-isolated environments are "pretty reasonable for some local low-risk tasks, like simple benchmarking, but can be problematic if the prompts or tool calls can interact with malicious users" (README L87). `LocalREPL` has namespaces "for minimal security" and "should not be used for production settings" [Verified: [README L97](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/README.md#L97)]. rlm-minimal also executes in-process.
- `DockerREPL` defaults to `python:3.11-slim`; the README says the container "runs fully isolated from the host" with a host-side proxy for LM access (README L103). At start-up the code adds a `host.docker.internal:host-gateway` route and runs `pip install -q dill requests` in the container [Verified: [docker_repl.py L524-L552](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/environments/docker_repl.py#L524-L552)]. For our use we would want a prebuilt pinned image instead of a per-run install [Inference].
- Both packages create the REPL directory with `tempfile.mkdtemp`, so `TMPDIR` controls its location [Verified: rlm local_repl.py L177; rlm-minimal repl.py L83].

### spec-ptc (speculative programmatic tool calling)

- **Idea.** While the model streams a REPL cell, spec-ptc parses finished statements and starts expensive tool calls early from a deep-copied "shadow" REPL; the real `exec` then takes the stored result [Verified: [README L3-L9](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/README.md#L3-L9)].
- **Safety contract.** A tool is speculated only if marked `speculatable=True`, which requires `pure=True`; default `False` [Verified: [tools.py L25-L31](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/src/contracts/tools.py#L25-L31)]. The shadow restricts builtins and imports and gives each statement 2 seconds [Verified: [shadow.py](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/src/engine/shadow.py#L79-L125)]. We treat the purity contract as the property to rely on; we did not test the shadow [Inference].
- **Benefit.** On RLM runs over OOLONG and OOLONG-Pairs from 8xH100 with vLLM, speedups "are generally on the order of 1-1.2x" [Reported: spec-ptc blog].
- **Integration.** A daemon on a Unix socket defaulting to `/tmp/spec-ptc.sock`; the Claude Code plugin is a PreToolUse hook returning `{"decision": "block", "reason": "spec-ptc claimed result: ..."}`, so the model gets the result as a block reason [Verified: [claude_code.py L9-L20](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/plugins/claude_code.py#L9-L20); client.py L10].
- The blog credits Khattab with proofreading and names Conveyor, Speculative Interaction Agents and AsyncFC as related work.

## Where our setup differs

### Compaction and post-compact recovery

- OMP has five automatic context-maintenance methods: `remote` (provider-native server compaction), `snapcompact` (history archived onto images the vision model reads back), `handoff`, `soft` (in-place summary by a compaction model) and `shake` (drop recoverable heavy content, no LLM call); `/compact` takes `soft`, `remote` or `snapcompact` as one-off modes [Verified: [compaction-methods.ts L11-L37](https://github.com/can1357/oh-my-pi/blob/v18.3.1/packages/coding-agent/src/session/compaction-methods.ts#L11-L37); [compact-modes.ts L16](https://github.com/can1357/oh-my-pi/blob/v18.3.1/packages/coding-agent/src/session/compact-modes.ts#L16)]. OMP also exposes read-only session transcripts and spilled tool output through internal URLs [Verified, our own setup].
- Our post-compact-reminder skill uses three hooks (a pre-compaction marker, a recovery prompt after compaction, a one-time check on the next prompt). The prompt tells the agent to re-read the project's agent rule files, not to re-fetch specific facts from the pre-compaction transcript [Verified, our own setup].
- **The gap.** rlm keeps the full history as a programmable variable beside the summary. Our recovery restores rules, but pre-compaction facts survive only through the summary unless the agent opens the transcript [Inference]. The paper's +26% median over compaction is the effect size to test on our sessions [Reported].

### Session memory tools

We use ee (Eidetic Engine: working, episodic, semantic and procedural memory, budgeted context packs that report omissions), cass (search over past agent sessions, lexical by default, semantic and hybrid optional) and cm (cass-memory: a playbook of rules with helpful/harmful marks and decay) [Verified, our own setup]. All three are retrieve-then-read. None lets the model run code over the whole history or recursively sub-query slices for aggregation questions such as "how many times did X fail, and what changed each time" [Inference]. RLM targets aggregation and multi-hop questions where top-k retrieval loses the long tail; for needle questions lexical search should suffice [Inference]. The RLM blog compares against "ReAct + BM25", not a curated memory like cm [Reported]. The second experiment tests which questions each approach wins.

### skill-autoresearch versus GEPA

Our skill-autoresearch skill hill-climbs on a static 7-gate rubric (structure, trigger quality, progressive disclosure, actionability, anti-patterns, operational tooling, sources): each round rewrites the weakest gate and keeps the change only if that gate rises and no other drops by more than 0.5. Its grader is a 1,398-line static analyser with form-count thresholds (at least 15 trigger phrases, a 400-line script, 15 references, a soft 150-line minimum) that calls no model and runs no task [Verified, our own setup].

| | skill-autoresearch | GEPA optimize_anything |
|---|---|---|
| Scored | the skill's form | task outcome, external oracle |
| Feedback | gate remediation strings | evaluator diagnostics (ASI) |
| Acceptance | one gate up, 0.5 regression guard | minibatch up, then validation |
| Search | one lineage, revert on failure | pool with Pareto selection |
| Held-out data | none | optional sealed `test_set` |

A skill can score 9.0 on every gate and still fail its task, and our loop cannot see that: Goodhart's law applied to skill quality [Inference]. Our skill-forge and skill-authoring-discipline skills already define "done" as a fresh agent succeeding on held-out work against an external oracle [Verified, our own setup], which is the oracle GEPA consumes [Inference]. No skill of ours has a task-outcome gold set yet; existing golden files are CLI-surface and shape fixtures. readme-update has a deterministic, dependency-free validator (exit 0 pass, 1 fail, 2 error; an empty scan set never passes) with good and bad fixtures, so it is the cheapest first target [Verified, our own setup].

### The franken-research search plan, and ColBERT/WARP

- **Plan** [Verified at `385c026`]: v1 search is "a small in-house client-side index (no service)"; frankensearch was rejected for lacking a WASM or browser path and for 621 MB of models ([decisions.jsonl L5](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/registries/decisions.jsonl#L5), DEC-005). 3,855 entries with summaries of at most 280 characters; candidates are BM25+ variants, a MiniSearch control and naive scans ([DEFINE.md](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/artifacts/perf/20260925T005518Z-ebac079/DEFINE.md#L4-L13)). Budgets: keystroke p95 at most 8 ms desktop and 16 ms phone; core shard 150 KB and full index 1.5 MB after brotli ([budgets.md](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/artifacts/perf/20260925T005518Z-ebac079/budgets.md)).
- **Relevance.** REQ-O1: on at least 40 real queries, a correct item in the top 3 for at least 80%, judged by a session that did not build the index and confirmed by a human; an optimization "may not change which items the golden-set queries rank in the top 3" ([PROJECT_CHARTER.md L17-L25](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/PROJECT_CHARTER.md#L17-L25)). The golden set has 88 queries: 41 intent, 25 exact, 9 synonym, 7 typo, 6 negation ([golden.jsonl](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/eval/golden.jsonl), counted). REQ-O1 "was not evaluated" yet, and 17 typo queries return nothing in candidate A ([perf README L64](https://github.com/JYeswak/franken-research/blob/385c026cbafd60544c61c42b17b788e4498dde40/.atlas-arc/artifacts/perf/20260925T005518Z-ebac079/README.md#L64)).
- **ColBERT/WARP in the shipped engine: no.** They need a transformer encoder at query time and per-token vectors per document [Verified: WARP abstract]. WARP reports 41x lower latency than XTR's reference implementation and 3x faster than ColBERTv2/PLAID on server-class kernels [Reported]. Neither fits a 1.5 MB brotli budget and a 16 ms phone keystroke [Inference].
- **Offline only.** As a relevance oracle, score the 88 golden queries with a late-interaction model and compare hit@3 by difficulty with the BM25 candidates; a wide margin on the 50 intent and synonym queries would suggest lexical v1 will struggle to reach 80% without intent terms or synonyms. As a build-time neighbour list, ship precomputed related-item ids [Inference]. Both must respect golden-set identity and the independent-judge rule.

## Two experiments (designed, not run)

### GEPA on one skill: readme-update

- **Question.** Does GEPA-optimizing a skill body raise held-out outcomes over the hand-written skill, and does our structural grader predict the outcome?
- **Gold set.** 48 README-update tasks from git histories of our own and permissively licensed public repositories: README at commit N-1, change notes (subjects plus diffstat), 2-5 required facts from the human-written README at N, and forbidden worklog phrases. Split 24/8/16; the test set is sealed by a session that does not run the optimizer, spans at least 3 repository families, and goes in `test_set`.
- **Rollout.** One call to a fixed small model (skill + README + notes to new README), no tools, temperature 0; `description` frozen.
- **Metric.** `s = gate_pass x fact_recall x (1 - forbidden_hit)`. Validator exit 2 or an API error is infrastructure: retried once, then excluded, never scored 0 (unlike gskill). ASI: the validator's per-rule counts and line numbers, missing facts, forbidden hits.
- **Config.** `GepaEngine`, Pareto selection, `reflection_minibatch_size=3`, `max_evals=240`, `max_token_cost=20`.
- **Baselines.** B0 no skill; B1 current SKILL.md; B2 skill-autoresearch output (structural 9.0+). Each on the 16 sealed tasks x 3 seeds, structural grade recorded.
- **Win rule (preregistered).** The top GEPA candidate beats B1 by at least +0.10 mean `s` on the sealed test, the paired-bootstrap 90% CI excludes 0, and no family drops more than 0.05.
- **Falsified if** (a) the gain is under 0.10 or the CI includes 0; (b) validation improves but test drops; (c) `gate_pass` rises while `fact_recall` falls (a validator blind spot); or, separately, (d) B2 matches or beats B1 on structural grade but not on `s`, which falsifies skill-autoresearch's premise.

Cost bound [Inference], at assumed prices of $1/$5 per M tokens (agent) and $5/$25 (reflection), with a median README of about 6.5k tokens:

| Part | Tokens | Assumed cost |
|---|---|---|
| 240 optimization rollouts | 2.6 M in, 1.7 M out | about $11 |
| 144 test rollouts | 1.6 M in, 1.0 M out | about $7 |
| Up to 40 reflection calls | 2.4 M in, 0.2 M out | about $17 |
| Total | | about $35 |

Hard cap $50: `max_token_cost=20` for reflection plus an evaluator wallet that refuses calls after $30 of agent spend. Under an hour at 8 concurrent rollouts.

### RLM over our own long sessions

- **Question.** After compaction, does an RLM recover facts from a long agent session better than the summary or lexical retrieval, at bounded cost?
- **Corpus.** 6 real session transcripts, each over 300k tokens and through at least one compaction, secrets redacted, mounted read-only.
- **Gold set.** 60 questions with gold answers, written by a session that runs no arm: 20 needle (path, commit, command), 20 aggregation (counts or lists), 20 decision (what was decided or rejected before event X, and why).
- **Arms, same small model.** A0 compaction summary; A1 BM25 top-20 chunks of 2k tokens; A2 the RLM with the transcript as `context`, depth 1.
- **Isolation.** Never the in-process `local` environment. Use a prebuilt pinned container image, outbound traffic limited to the LM proxy and no API keys in the REPL environment, or `dspy.RLM`'s WebAssembly interpreter. A canary file outside the mount fails the run if any arm reads it.
- **Budgets.** `max_iterations=15`, `max_tokens=250_000`, `max_timeout=240` s, `max_errors=3` per question: worst case 15 M tokens, about $7 at an assumed $0.25/$2 per M; baselines about $1; hard cap $15 [Inference].
- **Metric.** Accuracy by type (exact match for needles; a judge for the rest, first validated on 30 human labels to true-positive and true-negative rates of at least 0.9), cost per question, p50 and p95 latency.
- **Win rule.** A2 beats max(A0, A1) by at least 15 points on aggregation plus decision at no more than 5x A1's cost. **Falsified if** it leads by less, A1 is within 5 points of A2 overall, or A2 costs more than 5x A1.
- **Prediction.** A1 roughly equals A2 on needles [Inference]; if A2 loses there, the root model is not using grep and the prompt is at fault.

## Proposals

1. **Make task outcome the acceptance metric of skill-autoresearch**, keeping the 7 gates as a lint that cannot accept a change alone. Risk: needs a gold set per skill and costs model calls. Effort M. Test: falsifier (d), and a planted skill that scores 9.0+ but fails every task must be rejected.
2. **Pilot GEPA `optimize_anything` on readme-update** as designed, in an isolated virtualenv with core `gepa` only. Risk: spend (capped at $50), overfitting on 24 train tasks. Effort M. Test: the win rule and falsifiers.
3. **Make skill-forge's held-out runner emit one `(score, info)` row per task** with a sealed split, so one runner serves certification and optimization (contract shape only, no import). Effort S. Test: a planted skill failing one task yields `score=0` with `info` naming the failure, and test rows never reach the optimizer.
4. **Add "retrieve, don't trust the summary" to post-compact recovery**: re-read any concrete fact (path, commit, command, decision) from the transcript or an artifact before acting on it. Effort S. Test: a seeded session changes a fact late, then compacts; the agent must report the late value.
5. **Run the RLM pilot on our own sessions, isolated**, and wrap it as a read-only history-question tool only if it passes. Effort M. Test: the win rule plus the canary check.
6. **Score the 88 golden queries offline with a late-interaction model** as a headroom oracle before REQ-O1 is judged; ship nothing. Risk: checkpoint licence unchecked; builder must not judge. Effort S-M. Test: hit@3 by difficulty, BM25 candidate A versus late interaction, scored by a session that built neither.
7. **Optional: build-time related-item ids** from a late-interaction model. Risk: payload growth; must not move golden top-3. Effort M. Test: payload within the full-index budget and `top3_changed = 0`.
8. **Add spec-ptc's rule to our concurrency guidance**: only tools explicitly marked pure may run speculatively, citing spec-ptc's tools.py L25-L31. Effort S.

## Do not adopt

- **rlm's default `local` environment, or rlm-minimal, near real files or secrets.** The project documents it as in-process `exec` with "minimal security", not for production.
- **spec-ptc, for now.** 1-1.2x reported speedups on RLM runs, and our harnesses mostly use JSON tool calls, not a code REPL [Inference]. Its daemon socket defaults to a shared temp directory, which conflicts with our own rule against shared temp paths.
- **gskill as-is.** It needs Docker and SWE-smith, targets bug-fix skills, freezes a boilerplate description, scores setup errors as skill failures, and its example config sets an OpenAI regional base URL (train_optimize_anything.py L655-L657) [Verified]. Reuse the pattern, not the pipeline.
- **DSPy for SKILL.md optimization**, and **`gepa[full]` on macOS** (it pulls LiteLLM, MLflow and W&B; core is enough).
- **Any optimizer tuning franken-research ranking against its 88 golden queries.** It breaks golden-set identity and the independent-judge rule, and 88 queries would be overfitted [Inference on overfitting].
- **ColBERT, WARP or PLAID as the v1 browser engine.** DEC-005 and the budgets rule them out.
- **The headline numbers as a forecast for our skills.** They come from SWE-smith bug-fix tasks, and the posts disagree internally.

## Attribution we owe

- The survey list, ranks and section names are dan's (@irl_danB): https://independent.prose.md/ and https://x.com/irl_danB/status/2103083310339735588. This study is ours and is not endorsed by dan or anyone listed.
- **GEPA:** Agrawal, Tan, Soylu, Ziems, Khare, Opsahl-Ong, Singhvi, Shandilya, Ryan, Jiang, Potts, Sen, Dimakis, Stoica, Klein, Zaharia, Khattab, arXiv:2507.19457. Code MIT, © 2025 Lakshya A Agrawal.
- **optimize_anything:** Agrawal and Lee (equal contribution), Ma, Elmaaroufi, Tan, Seshia, Sen, Klein, Stoica, Gonzalez, Khattab, Dimakis, Zaharia; UC Berkeley technical report, 2026-02-18.
- **gskill:** Tan and Agrawal (equal contribution), Sandadi, Klein, Sen, Dimakis, Zaharia; UC Berkeley; builds on SWE-smith and mini-SWE-agent.
- **DSPy:** MIT, © 2023 Stanford Future Data Systems; Khattab's page lists DSPy among the open-source systems his work is consolidated into.
- **Recursive Language Models:** Zhang, Kraska, Khattab, arXiv:2512.24601; rlm and rlm-minimal MIT.
- **spec-ptc:** Zhang (2026), MIT; its post credits Conveyor (Xu et al., 2024), Speculative Interaction Agents (Hooper et al., 2026) and AsyncFC (Feng et al., 2026) as related work.
- **WARP:** Scheerer, Zaharia, Potts, Alonso, Khattab, arXiv:2501.17788; `xtr-warp` MIT. ColBERT MIT.
- Copied code keeps its MIT notice. Proposal 8 cites the idea, not the code.

## What we could not verify

- No GEPA or RLM run with a model; every benchmark number is [Reported].
- Only the GEPA, RLM and WARP abstracts were read. Meta-Harness (arXiv:2603.28052, also a GEPA engine) was not read.
- All prices are assumptions, not quotes. ColBERT checkpoint licences were not checked.
- The GEPA repository showed a push on 2026-09-24, but the default-branch head we read is dated 2026-09-22; other branches were not read.
- `dspy.RLM`'s WebAssembly interpreter, spec-ptc's shadow REPL and `DockerREPL`'s defaults were not tested.
- Corrections: open an issue or pull request on https://github.com/JYeswak/franken-research.
