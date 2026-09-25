---
title: Hermes Agent, with Teknium, Shannon Sands and mephisto
covers: 26, 63, 78
written: 2026-09-25
summary: How Nous Research's Hermes Agent handles skills, memory, MCP and reliability, how that compares with our agent stack, and what we would adopt.
---

## Sources

- Hermes Agent, `NousResearch/hermes-agent`: https://github.com/NousResearch/hermes-agent/tree/59004a62356f3a4697ab0fe8ad5086d2b405e2a6 (`main` at commit `59004a62356f`, read 2026-09-25). File and line citations below point into this commit.
- hermes-starter-profile, `teknium1/hermes-starter-profile`: https://github.com/teknium1/hermes-starter-profile/tree/24dc015efa46936c8370ae7582796437b9735822 (commit `24dc015efa46`, 2026-08-08).
- Nous Research, Hermes 4 Technical Report: https://nousresearch.com/wp-content/uploads/2025/08/Hermes_4_Technical_Report.pdf (PDF, sha256 `3294402e20a3f506d033f24157e8f007a34eaadf045292282de5d39bc011d130`, read 2026-09-25).
- GitHub REST API for commits, contributors and user records, for example https://api.github.com/repos/NousResearch/hermes-agent/contributors (queried 2026-09-25).
- mephisto's own site, linked from the @karan4d account: https://www.karan4d.com (read 2026-09-25).
- oh-my-pi (OMP): https://github.com/can1357/oh-my-pi/tree/v18.3.1 (tag `v18.3.1`, read 2026-09-25).
- OpenHermes-2.5 dataset card: https://huggingface.co/datasets/teknium/OpenHermes-2.5/blob/b82037821055c377bed0d495e72e46de3bc72e84/README.md (revision `b820378`, read 2026-09-25).

Licences: hermes-agent is MIT, `Copyright (c) 2025 Nous Research` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/LICENSE#L1-L3]. hermes-starter-profile is MIT, `Copyright (c) 2026 Teknium` [Verified: https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/LICENSE#L1-L3]. The Hermes 4 report states no licence on its first page; we cite it and copy nothing from it.

This page is about public code and documents. It does not describe anyone's character and does not link a handle to an offline identity. mephisto is referred to only by the handle.

## What they built

### Who did what, from primary sources

- **Teknium.** The GitHub account `teknium1` names the X handle `Teknium` on its own profile [Verified: https://api.github.com/users/teknium1]. `teknium1` is the largest contributor to hermes-agent, with 18,642 contributions [Verified: GitHub contributors API, 2026-09-25], and publishes hermes-starter-profile ([distribution.yaml line 5](https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/distribution.yaml#L5): `author: Teknium`).
- **Shannon Sands (@max_paperclips).** Nous Research's Hermes 4 Technical Report lists "Shannon Sands" as an author with "X: @max_paperclips" [Verified: report page 1, author block]. The GitHub login `shannonsands` authors commits as "Shannon Sands" and has 80 contributions to hermes-agent [Verified: GitHub commits and contributors API]. Neither account links the other; the attribution check is below.
- **mephisto (@karan4d).** The site linked from the account says its author does "model behavior and agents stuff at nous", and lists co-founding Nous Research and creating WorldSim [Verified: https://www.karan4d.com, read 2026-09-25]. We found no GitHub account for the handle and no hermes-agent commits we could attribute to it, so this page credits mephisto only with that context and claims no authorship of Hermes code.

### The skill lifecycle and the Curator

A skill is a directory with a `SKILL.md`. It lives in a profile's `skills/` directory, in read-only `skills.external_dirs`, or, for a trusted project, in `<repo>/.hermes/skills` or `<repo>/.agents/skills` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1423-L1433]. Hermes tracks three provenances: bundled, hub-installed and local [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/skill_usage.py#L146-L181].

- **Creation.** After a turn, a background fork replays the conversation and decides whether to save or update a skill or memory, without touching the main prompt cache [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/background_review.py#L1-L6]. A skill-creation nudge fires every 10 turns by default [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/agent_init.py#L1371]. Mutations can be staged for approval (`skills.write_approval`, default off) and are logged with before and after hashes, which supports `hermes curator rollback`. Scanning agent-written skills is off by default, on the stated ground that the agent could run the same code through the terminal anyway [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1447-L1465].
- **Index.** The prompt carries a compact `<available_skills>` index of name and description per skill, grouped by category; "nothing is ever hidden" [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/prompt_builder.py#L1277-L1283].

The **Curator** is background maintenance [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L1-L7]:

- Trigger. No cron job. It runs when the agent has been idle at least 2 hours and the last run is older than 168 hours. On first sight of a library it only records the time, "so a fresh install/update never mutates the library on its first tick" [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L159-L178; https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1473-L1475].
- Scope. Only curator-managed skills: records marked `created_by: agent`, plus bundled skills if `curator.prune_builtins` is on. Hub, external-dir and protected skills are never included. A user-authored skill enters only via `hermes curator adopt`, because "provenance is declared, never inferred from activity" [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/skill_usage.py#L275-L343].
- Deterministic pass. Stale after 14 days without use, archived after 30. Archiving moves the skill to `skills/.archive/`; nothing is deleted. Pinned and cron-referenced skills are skipped [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L208-L265]. Values below 1 fall back to the default, so a typo cannot archive the whole library [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L121-L134].
- LLM pass (`consolidate`, default off). A fork may pin, archive, merge or patch skills, but never delete, and never touch bundled, hub, external or pinned skills [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L314-L330]. It snapshots `skills/` to a tarball first and keeps 2 [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1491-L1495].
- Recent default change. Commit [1b8e4c5](https://github.com/NousResearch/hermes-agent/commit/1b8e4c513d6a55c6a6bdf8779b43544456cb89ef) (2026-09-19, "prune_builtins defaults to off") explains: "Bundled skills unused for 30 days were archived on a startup tick with no prompt (57 in one launch …)" [Verified]. Built-in pruning had arrived in [70e1571](https://github.com/NousResearch/hermes-agent/commit/70e1571d890fc0552c398d6f443315b2f7a06ca4) (2026-06-01).
- Small drift. Prompt rule 3b says the protected built-ins are "currently: plan", but `PROTECTED_BUILTIN_SKILLS` is an empty set [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/curator.py#L323-L326 against https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/skill_usage.py#L39].

**Supply-side scanning.** Hub installs pass through `skills_guard`, a regex scanner whose install policy depends on trust level; community sources are blocked on any "caution" finding [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/skills_guard.py#L1-L33]. Project-local skills are rescanned whenever their content changes and quarantined on a "dangerous" verdict (fail-closed), because trusting a repo once "could inject a malicious skill into an already-trusted repo" on the next pull [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/skill_utils.py#L533-L560].

### Memory, session search and profiles

- **Built-in memory** is two bounded files, `MEMORY.md` (2,200 characters) and `USER.md` (1,375), injected as a frozen snapshot at session start. Writes during a session reach disk but not the prompt, which keeps the prefix cache stable [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/memory_tool_store.py#L88-L105; https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1287-L1296].
- **Every memory write is threat-scanned** against the strict scope of `tools/threat_patterns.py` (prompt injection, exfiltration, persistence, invisible Unicode), because "a poisoned entry persists across sessions" [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/memory_tool_store.py#L26-L29; https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/threat_patterns.py#L1-L24]. We ran the scanner, stdlib only, on an injection-shaped test string: it returned `prompt_injection` and `send_to_url`; a benign preference returned nothing; a zero-width space returned `invisible_unicode_U+200B` [Verified: our own run at the pinned commit].
- **Write safety.** A write is refused if the file on disk would not round-trip (the drifted file is backed up first) or if an existing file cannot be read, so an unreadable file is never overwritten as empty [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/memory_tool_store.py#L36-L57].
- **Session search** uses SQLite FTS5 with no LLM calls. Subagent, kanban and tool sessions are hidden and cron sessions ranked lower, so their vocabulary does not crowd out the user's own sessions [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/session_search_tool.py#L1-L25].
- **Profiles** are separate Hermes home directories with alias wrapper commands [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/profiles.py#L32-L39]. They can be installed from git as distributions: the installer refuses symlinks, shows a plan, and imports shipped cron jobs paused [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/profile_distribution.py#L232-L337]. It records the source URL, not a commit, so an update installs whatever the default branch holds at that moment [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/profile_distribution.py#L247-L257].

### The MCP client and what Hermes loads from a project

- Servers come only from `mcp_servers` in the profile's config, plus servers supplied by enabled plugins. There is no project `.mcp.json` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool_config.py#L362-L385]. Transports: stdio, Streamable HTTP and SSE [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool.py#L2-L4].
- Before any spawn, entries shaped like exfiltration are dropped [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool_config.py#L331-L344]. Stdio children get a small environment allowlist plus their own `env` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool_config.py#L73-L125]. Before launching an `npx` or `uvx` package, Hermes queries OSV for malware advisories; the check fails open on network errors and credits Block's goose [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/osv_check.py#L1-L7].
- Tools are named `mcp__<server>__<tool>`, the convention Claude Code, Codex and OpenCode share, clamped to 64 characters [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool_schema.py#L153-L175]. Per-server `tools.include` and `tools.exclude` take globs, and include wins [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/mcp_tool_registration.py#L211-L222].
- Project plugins load only when `HERMES_ENABLE_PROJECT_PLUGINS` is set [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/plugins.py#L4-L5]; project skills only from roots in `skills.trusted_project_dirs` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/skill_utils.py#L474-L512].
- Command approval defaults to `smart`, an LLM guardian; cron, single-query and unattended sessions default to `deny` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1639-L1660]. Tirith pre-exec scanning is on with `tirith_fail_open: True` [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/config_defaults.py#L1757-L1769].

### The least-privilege starter profile (Teknium)

hermes-starter-profile is a profile distribution, not code:

- `config.yaml` sets `platform_toolsets` to exactly `[clarify, image_gen, search, tts, vision]` on all 22 surfaces and denies 25 toolsets, including `terminal`, `file`, `code_execution`, `delegation`, `memory` and `skills` [Verified: https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/config.yaml#L5-L58]. Memory, curator and lazy installs are off, MCP servers and hooks are empty, redaction is on, and `tirith_fail_open: false` [Verified: https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/config.yaml#L65-L113].
- DESIGN.md explains the two layers: the platform list sets the baseline, and the deny list "blocks dangerous component toolsets even if another resolution path attempts to recover them". It calls itself "a constrained starting configuration, not a sandbox against the machine owner" [Verified: https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/DESIGN.md#L27-L39].
- `scripts/audit_profile.py` is the part worth copying. It imports Hermes's own resolver and asserts that the resolved tool names on every platform equal the five intended tools, and fails if the resolver cannot be exercised [Verified: https://github.com/teknium1/hermes-starter-profile/blob/24dc015efa46936c8370ae7582796437b9735822/scripts/audit_profile.py#L11-L107].

### Shannon Sands's reliability commits

All commits below are authored by the GitHub login `shannonsands` [Verified: GitHub commit API].

**Memory-aware dispatch cap**, [4beca7a](https://github.com/NousResearch/hermes-agent/commit/4beca7a943bbef9039e70a5ced391a15b9d8fe6a) (2026-08-17). The message cites two incidents where an uncapped kanban board "fanned out 26-31 concurrent workers" on a 1 GiB VM and the host went into swap-thrash or OOM; it builds on a fix credited to @Dusk1e (PR #28695) [Verified].

- With `kanban.max_in_progress` unset, the cap is `clamp(MemTotal / 512 MiB, 2, 8)`; explicit config wins [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/kanban_db_dispatch.py#L1779-L1823]. Running tasks on other boards count against the budget [Verified: same file, lines 1860-1897].
- Each tick samples memory: `critical` spawns nothing, `elevated` at most one new worker, `unknown` is unrestricted; deferred tasks stay queued [Verified: same file, lines 1900-1916; https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/gateway/memory_status.py#L20-L60].
- The sample reads `/proc/meminfo`, so **on macOS both guards are no-ops by design** [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/gateway/lifecycle_ledger.py#L64-L74].
- An autouse test fixture pins the memory sample so tests do not depend on the CI runner's memory [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tests/conftest.py#L429-L431].

**Startup-liveness watchdog**, [8a3b6f3](https://github.com/NousResearch/hermes-agent/commit/8a3b6f374d708c5c110f688af47e91475bd5220f) (2026-08-19), with follow-ups [f5bb1e1](https://github.com/NousResearch/hermes-agent/commit/f5bb1e144de336cec53f274b24355057228697f0) and [852db61](https://github.com/NousResearch/hermes-agent/commit/852db61abe4638242026905ad424a8a11bcce9fc). The incident: a gateway deadlocked before its asyncio loop existed, "zero log lines, /health unreachable", while the supervisor saw a live process and never restarted it [Verified: commit message]. The design, stdlib only:

- A daemon thread is armed at process entry, before the heavy imports, for `gateway run`, and disarmed once the event loop is live [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_cli/main.py#L52-L70].
- Default deadline 300 s, floor 30 s, set only by environment variable because config parsing is itself inside the window [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_startup_watchdog.py#L43-L55].
- Slow but live startups get renewable "progress leases" (capped at 900 s), and CPU time can extend the deadline at most 3 times, because "an unrelated thread burning CPU must not hide a parked deadlock" [Verified: same file, lines 64-74].
- On firing it starts an exit-escort thread first, so a logging lock or hung disk cannot block the exit, then dumps all-thread stacks, writes a record and calls `os._exit(75)` for supervisor restart [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/hermes_startup_watchdog.py#L264-L345]. There are 39 tests at HEAD [Verified: count in `tests/gateway/test_startup_watchdog.py`].

**Not re-billing empty replies**, [ac06c2f](https://github.com/NousResearch/hermes-agent/commit/ac06c2ff8b4318a2e8e63aa787ea6d69b9238a2b) (2026-07-31), then [d10f872](https://github.com/NousResearch/hermes-agent/commit/d10f87245e51972db8f094f6c4f7ea6e0edf60c5), which moved the settings into `agent.empty_response_guard` in config. The reported cost was "~$2.33 for one empty answer on a ~26K-token session" [Reported: ac06c2f message]. Both guards fail open to the old behaviour [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/agent/empty_response_guard.py#L1-L43]:

- **Deterministic empty.** Two consecutive empty attempts with the same model, provider and finish reason, each with usage proving zero output, skip the remaining retries and go to the fallback chain [Verified: same file, lines 157-226].
- **Cost-aware budget.** If one empty attempt's estimated input cost is at least 0.25 USD, the retry budget drops from 3 to 1; unknown pricing leaves it at 3 [Verified: same file, lines 229-237].
- A later commit by fangliquanflq, [3755dca](https://github.com/NousResearch/hermes-agent/commit/3755dca7d6aa8b4da01cb3aec69fac8ede9c6c3c), extended detection to responses with no usage at all [Verified].

**Collective Wisdom Agent V1**, [a6ee31f](https://github.com/NousResearch/hermes-agent/commit/a6ee31f55aad08cc51ba348db2febacd541eec01) (2026-09-11, co-authored with hbizi), shares skills organisation-wide via Nous Portal; not reviewed for adoption.

**GitHub-to-X attribution.** The GitHub profile `shannonsands` has no name and no X handle [Verified: https://api.github.com/users/shannonsands]. The link rests on one document: Nous Research's Hermes 4 report pairs the name "Shannon Sands" with @max_paperclips [Verified: https://nousresearch.com/wp-content/uploads/2025/08/Hermes_4_Technical_Report.pdf, page 1], and the GitHub commits carry the same author name. So "GitHub `shannonsands` is @max_paperclips" stays **[Inference, High]**. Code credit on this page names the GitHub login and commit-author name, which is what the commits show.

## Where our stack differs

We run OMP with NTM for agent panes, jsm for skills, cass for session search, dcg and slb as command guards, and a separate typed memory store [Verified, our own setup].

- **Skills on a shared tree.** In our own setup Hermes shared one skills directory with other harnesses, and its Curator's usage counters only see Hermes's own use, so skills the other harnesses read looked unused to it [Verified, our own setup]. Hermes's "declared, never inferred" provenance rule is right; usage-based ageing is only safe when every reader updates the counters [Inference].
- **Curator backups inside the tree.** The Curator's pre-run tarballs of the whole skills directory were being written inside that same shared directory [Verified, our own setup].
- **Memory writes are not threat-scanned in our stack.** A memory tool we use accepted an injection-shaped test memory with no warning, where Hermes's write-time scanner flags the same string [Verified, our own setup, one probe]. Our memory reaches new sessions at session start; whether anything filters it on the way out is not verified.
- **Empty-stop retries.** OMP retries an empty stop up to `EMPTY_STOP_MAX_RETRIES = 3`, each time resending the context with a one-line reminder, with no signature or cost check [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.1/packages/coding-agent/src/session/turn-recovery.ts#L90]. We have no frequency figure for our fleet.
- **Dispatch admission** in our setup is static per-agent caps and reads no host memory signal [Verified, our own setup]. macOS exposes `kern.memorystatus_vm_pressure_level` and `memory_pressure -Q`, which a macOS port could read.
- **Skill index cost** has the same shape as Hermes's: one name and description per skill on every request. OMP's `skills.includeSkills` and `skills.ignoredSkills` settings exist to cut it [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.1/packages/coding-agent/src/extensibility/settings.ts#L71-L81].
- **Memory scale.** Our memory and session-search tools scale further than two frozen files; the write-time threat scan is the gap. Session search is comparable; Hermes's demotion of cron sessions is worth checking in cass [Inference].
- **Project MCP config.** OMP loads a project `.mcp.json` by default (`mcp.enableProjectConfig` default `true`) [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.1/packages/coding-agent/src/mcp/settings.ts#L9-L12], and we are turning that off. Hermes already has that posture, and adds a trust allowlist for project skills, which our change does not cover.
- **Least privilege.** OMP has a `--tools=<list>` flag and per-tool enable settings, but we have no audit of the resolved tool set.
- **Pre-ready hangs.** Our pane liveness check compares two captures over time; nothing puts a deadline on a pane that never became ready.
- **Command approval.** We keep deterministic guards (dcg, slb and our own danger gates) rather than an LLM guardian.

## Proposals

None has been applied; this pass was read-only. "Known-bad" means a planted input the check must reject.

1. **Keep Hermes's Curator off a shared skills tree.** Where Hermes shares a skills directory with other harnesses, set `curator.prune_builtins: false` (upstream's default since 1b8e4c5), give Hermes its own skills directory and mount the shared tree via `skills.external_dirs`, which the Curator and `skill_manage` treat as read-only [Verified: https://github.com/NousResearch/hermes-agent/blob/59004a62356f3a4697ab0fe8ad5086d2b405e2a6/tools/skill_usage.py#L271-L285]. Keep Curator backups outside the shared tree. Risk: skills Hermes creates no longer land in the shared tree. Test: a throwaway Hermes home with one bundled record backdated 100 days must appear in `hermes curator run --dry-run` before the change and not after. Licence: none (config).
2. **Port `threat_patterns.py`** (162 lines, stdlib) as a filter on memory read at session start and a pre-write check on agent memory writes. Risk: false positives on notes that quote attacks, so it needs an allow tag. Test: the injection-shaped probe and a zero-width-space entry must be flagged; run over the current memory export and report false positives before blocking. Licence: MIT, keep the Nous Research notice in the ported file.
3. **Measure, then maybe propose, empty-stop guards for OMP.** Count empty-stop retries across all profiles; if material, draft an upstream issue proposing Hermes's two guards. Risk: OMP's retry reminder changes the prompt, so the benefit may be smaller. Test: two zero-output responses with the same signature give 1 retry, different signatures keep 3. Licence: idea only unless code is copied.
4. **Memory-pressure admission for agent spawns on macOS**: critical spawns none this tick, warning at most one, unreadable no restriction, deferred work stays queued, read behind a seam tests can pin as Hermes's conftest does. Risk: wrong mapping of sysctl levels; must fail open. Test: pinned samples at levels 1, 2, 4 and unreadable must give allow-all, allow-1, allow-0 and allow-all. Licence: idea only (Hermes code is Linux-specific).
5. **A "never became ready" deadline** for spawned panes and hook processes: arm at spawn, disarm at the first ready output, and on expiry capture scrollback, record `STARTUP_WEDGED` and recycle. Borrow progress leases, a cap on CPU-based extensions and a bounded exit. Risk: killing slow cold starts, which leases address. Test: a pane running `sleep 600` before any banner must be classed wedged; one printing progress every 10 s for 5 minutes must not.
6. **Resolved-toolset audit** for read-only roles and client deployments: launch OMP with `--tools=<list>` and assert the tool set OMP reports at runtime, not the config, following `audit_profile.py`. Test: a scout launch that adds `bash` must fail. Licence: idea only; MIT if the script is copied.
7. **Trust allowlist for project skills**: load project skill directories only for allowlisted roots and rescan on content change with fail-closed quarantine, as Hermes does. Risk: whether OMP offers a hook before skill discovery is not verified. Test: a planted `SKILL.md` outside the allowlist must be absent from the skill index.
8. **Carry the MIT notice with copied Hermes skills.** Bundled Hermes skills say `license: MIT` in frontmatter, but no notice file travels with them when copied into another skills tree; add a third-party notice entry.

## Do not adopt

- **The Curator's LLM consolidation pass on a shared tree.** It rewrites and merges skills that other harnesses read. Upstream ships it off.
- **Usage-based archiving of skills other harnesses read.** The inputs are incomplete; proposal 1 removes it rather than tuning it.
- **An LLM approval guardian in place of deterministic guards.** Ours give the same answer every time; a model-judged gate does not.
- **Profile distributions from a moving branch.** If we ship profiles this way, pin a commit and review the diff.
- **Hermes's memory sampler as-is.** It reads `/proc`, so on macOS it silently imposes no limit. Proposal 4 ports the policy, not the sampler.
- **Collective Wisdom.** An organisation-wide skill-sharing service; our skills include private client material.
- **Replacing our memory store with MEMORY.md and USER.md.** The frozen-snapshot idea matches what we already do at session start; 3.6k characters is too small for fleet memory.
- **OpenHermes-2.5 for training.** Its dataset card has no licence field and describes the data as "primarily synthetically generated", tagged GPT-4 [Verified: dataset card at revision `b820378`].

## Attribution we owe

- **Hermes Agent code**, if copied: the MIT notice `Copyright (c) 2025 Nous Research` and permission text in each copied file.
- **Commit credit** for ideas we reimplement:
  - memory-aware dispatch: Shannon Sands, `4beca7a`, building on @Dusk1e's PR #28695;
  - startup watchdog: Shannon Sands, `8a3b6f3`, `f5bb1e1`, `852db61`;
  - empty-response guard: Shannon Sands, `ac06c2f`, `d10f872`; the usage-less extension by fangliquanflq, `3755dca`;
  - Curator provenance and prune rules: Teknium, `70e1571`, [72de75c](https://github.com/NousResearch/hermes-agent/commit/72de75c0ab367e231c207075ee972f7d2fcc0744), `1b8e4c5`.
- Credit uses the commit-author name and GitHub login; an X handle is added only with the [Inference] label above.
- **Starter profile**, if `audit_profile.py` is copied: `Copyright (c) 2026 Teknium` and the MIT permission notice.
- **OSV preflight idea**: Hermes credits Block's goose; carry that credit if copied.
- **mephisto**: credited for WorldSim and Nous Research context only, as stated on the linked site; not for any code here.

## What we could not verify

- A declared link between GitHub `shannonsands` and X @max_paperclips. It remains [Inference, High].
- Any hermes-agent commit by mephisto. No GitHub account was found for the handle.
- The file list for commit `8a3b6f3`: the GitHub API returns no files for it, so its code is attributed through the two follow-ups.
- That a shared-tree Curator would actually archive bundled skills; this is derived from Hermes code and usage records, not observed.
- Whether our session-start memory path filters injection-shaped memories on read. Only the write path was probed, once.
- How often OMP's empty-stop retries fire in our fleet.
- The meaning of macOS `kern.memorystatus_vm_pressure_level` values 1, 2 and 4 (normal, warning, critical), which is from general knowledge; proposal 4's test must confirm it.
- Whether OMP offers a hook before project skill discovery.
- The licence terms of the Hermes 4 report.
- Everything in "What they built" comes from reading source at the pinned commit; hermes-agent was not installed from that commit or run.
