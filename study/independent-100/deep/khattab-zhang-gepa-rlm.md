---
title: Omar Khattab and alex zhang, GEPA for skills and Recursive Language Models for long context
covers: 11, 20
written: 2026-09-25
summary: What GEPA's outcome-scored optimizer, gskill, Recursive Language Models and spec-ptc do, how they are licensed and documented, and which parts carry risks to know before reuse.
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
- Personal pages https://omarkhattab.com/ and https://alexzhang13.github.io/ (read 2026-09-25).

Ranks 11 (Omar Khattab, `@lateinteraction`) and 20 (listed as "alex zhang", `@a1zhang`) in dan's Independent 100, section "The Frontier Outside". Written 2026-09-25 by an AI agent session. This page is about public work and artifacts; it is one reviewer's reading, not a ranking of people.

Labels: **[Verified]** we read it at the pin or ran it; **[Reported]** the authors say so and we did not reproduce it; **[Inference]** our reasoning. File references like "engine.py L373" are at the pinned commits above.

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

### DSPy, only as far as GEPA needs it

DSPy pins `gepa[dspy]==0.1.4` [Verified: DSPy pyproject.toml L37]. `dspy.GEPA` needs exactly one of `auto`, `max_full_evals` or `max_metric_calls`, and its metric may return a score with textual feedback [Verified: [gepa.py L34-L59](https://github.com/stanfordnlp/dspy/blob/2413b67a4d08a476e4bc6f40b9f8f42f87711ee7/dspy/teleprompt/gepa/gepa.py#L34-L59), L451-L453]. For SKILL.md files DSPy is not needed: optimize_anything takes a plain string and evaluator. `dspy.RLM`'s REPL defaults to a Deno/Pyodide WebAssembly interpreter [Verified: DSPy predict/rlm.py L117-L127].

### Recursive Language Models (paper, rlm, rlm-minimal)

An RLM keeps the long prompt out of the model's context. The prompt is a variable in a Python REPL; the root model writes code that peeks at it, greps it, partitions it and calls sub-models (`llm_query`) or child RLMs (`rlm_query`) on slices [Verified: RLM blog; rlm utils/prompts.py].

- **Reported results.** Inputs "two orders of magnitude beyond model context windows"; on GPT-5, median gains of 26% over compaction, 130% over CodeAct with sub-calls and 13% over Claude Code across four long-context tasks "while having comparable cost"; a post-trained RLM-Qwen3-8B [Reported: RLM paper]. RLM(GPT-5-mini) more than doubles GPT-5's correct answers on an OOLONG split, and quality holds at 10M+ tokens on BrowseComp-Plus [Reported: RLM blog].
- **Stated limits.** Sub-calls are blocking with no prefix caching, and "we do not currently have strong guarantees about controlling either the total API cost or the total runtime" [Verified: RLM blog, "Limitations"].
- **Library.** `RLM(...)` defaults to `environment="local"`, `max_depth=1`, `max_iterations=30`, with optional `max_budget` (needs a cost-tracking backend), `max_timeout`, `max_tokens` and `max_errors` [Verified: [core/rlm.py L53-L61](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/core/rlm.py#L53-L61), L86-L94]. Environments: `local`, `ipython`, `modal`, `docker`, `daytona`, `prime`, `e2b`.
- **Compaction keeps the full history.** With `compaction=True` the root context is summarized at 85% of the model's limit while the full trajectory stays in a REPL variable, `history` [Verified: [core/rlm.py L319-L323](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/core/rlm.py#L319-L323), L460-L461].
- **rlm-minimal** is a roughly 1,200-line, OpenAI-only reference with depth-1 recursion [Verified: rlm-minimal README].

Execution environments, as the project documents them:

- "The default RLM client uses a REPL environment that runs on the host process through Python `exec` calls. It uses the same virtual environment as the host process" [Verified: [README L51](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/README.md#L51)]. Non-isolated environments are "pretty reasonable for some local low-risk tasks, like simple benchmarking, but can be problematic if the prompts or tool calls can interact with malicious users" (README L87). `LocalREPL` has namespaces "for minimal security" and "should not be used for production settings" [Verified: [README L97](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/README.md#L97)]. rlm-minimal also executes in-process.
- `DockerREPL` defaults to `python:3.11-slim`; the README says the container "runs fully isolated from the host" with a host-side proxy for LM access (README L103). At start-up the code adds a `host.docker.internal:host-gateway` route and runs `pip install -q dill requests` in the container [Verified: [docker_repl.py L524-L552](https://github.com/alexzhang13/rlm/blob/d04208afbad29ca675ab13478c40ee8bebc84bfe/rlm/environments/docker_repl.py#L524-L552)].
- Both packages create the REPL directory with `tempfile.mkdtemp`, so `TMPDIR` controls its location [Verified: rlm local_repl.py L177; rlm-minimal repl.py L83].

### spec-ptc (speculative programmatic tool calling)

- **Idea.** While the model streams a REPL cell, spec-ptc parses finished statements and starts expensive tool calls early from a deep-copied "shadow" REPL; the real `exec` then takes the stored result [Verified: [README L3-L9](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/README.md#L3-L9)].
- **Safety contract.** A tool is speculated only if marked `speculatable=True`, which requires `pure=True`; default `False` [Verified: [tools.py L25-L31](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/src/contracts/tools.py#L25-L31)]. The shadow restricts builtins and imports and gives each statement 2 seconds [Verified: [shadow.py](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/src/engine/shadow.py#L79-L125)]. The purity contract is the property to rely on [Inference]; we did not test the shadow.
- **Benefit.** On RLM runs over OOLONG and OOLONG-Pairs from 8xH100 with vLLM, speedups "are generally on the order of 1-1.2x" [Reported: spec-ptc blog].
- **Integration.** A daemon on a Unix socket defaulting to `/tmp/spec-ptc.sock`; the Claude Code plugin is a PreToolUse hook returning `{"decision": "block", "reason": "spec-ptc claimed result: ..."}`, so the model gets the result as a block reason [Verified: [claude_code.py L9-L20](https://github.com/alexzhang13/spec-ptc/blob/9b78b7d6ceeaf8afd1557c4e3a999ce653fc0e17/plugins/claude_code.py#L9-L20); client.py L10].
- The blog credits Khattab with proofreading and names Conveyor, Speculative Interaction Agents and AsyncFC as related work.

## A comparison study (proposed, not run)

A comparative study of these methods against our own tooling is proposed and has not been run.

## Do not adopt

- **rlm's default `local` environment, or rlm-minimal, near real files or secrets.** The project documents it as in-process `exec` with "minimal security", not for production.
- **spec-ptc near other users' processes.** 1-1.2x reported speedups on RLM runs, and its daemon socket defaults to a shared temp directory, `/tmp/spec-ptc.sock` [Verified: client.py L10].
- **gskill as-is.** It needs Docker and SWE-smith, targets bug-fix skills, freezes a boilerplate description, scores setup errors as skill failures, and its example config sets an OpenAI regional base URL (train_optimize_anything.py L655-L657) [Verified]. Reuse the pattern, not the pipeline.
- **DSPy for optimizing a plain-text file**, and **`gepa[full]` on macOS** (it pulls LiteLLM, MLflow and W&B; core is enough).
- **The headline numbers as a forecast for other tasks.** They come from SWE-smith bug-fix tasks, and the posts disagree internally.

## Attribution we owe

- The survey list, ranks and section names are dan's (@irl_danB): https://independent.prose.md/ and https://x.com/irl_danB/status/2103083310339735588. This study is ours and is not endorsed by dan or anyone listed.
- **GEPA:** Agrawal, Tan, Soylu, Ziems, Khare, Opsahl-Ong, Singhvi, Shandilya, Ryan, Jiang, Potts, Sen, Dimakis, Stoica, Klein, Zaharia, Khattab, arXiv:2507.19457. Code MIT, © 2025 Lakshya A Agrawal.
- **optimize_anything:** Agrawal and Lee (equal contribution), Ma, Elmaaroufi, Tan, Seshia, Sen, Klein, Stoica, Gonzalez, Khattab, Dimakis, Zaharia; UC Berkeley technical report, 2026-02-18.
- **gskill:** Tan and Agrawal (equal contribution), Sandadi, Klein, Sen, Dimakis, Zaharia; UC Berkeley; builds on SWE-smith and mini-SWE-agent.
- **DSPy:** MIT, © 2023 Stanford Future Data Systems; Khattab's page lists DSPy among the open-source systems his work is consolidated into.
- **Recursive Language Models:** Zhang, Kraska, Khattab, arXiv:2512.24601; rlm and rlm-minimal MIT.
- **spec-ptc:** Zhang (2026), MIT; its post credits Conveyor (Xu et al., 2024), Speculative Interaction Agents (Hooper et al., 2026) and AsyncFC (Feng et al., 2026) as related work.
- **WARP:** Scheerer, Zaharia, Potts, Alonso, Khattab, arXiv:2501.17788; `xtr-warp` MIT. ColBERT MIT.
- Copied code keeps its MIT notice.

## What we could not verify

- No GEPA or RLM run with a model; every benchmark number is [Reported].
- Only the GEPA, RLM and WARP abstracts were read. Meta-Harness (arXiv:2603.28052, also a GEPA engine) was not read.
- ColBERT checkpoint licences were not checked.
- The GEPA repository showed a push on 2026-09-24, but the default-branch head we read is dated 2026-09-22; other branches were not read.
- `dspy.RLM`'s WebAssembly interpreter, spec-ptc's shadow REPL and `DockerREPL`'s defaults were not tested.
- Corrections: open an issue or pull request on https://github.com/JYeswak/franken-research.
