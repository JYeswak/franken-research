---
title: Mario Zechner and Pi, the upstream of OMP
covers: 85
written: 2026-09-24
summary: How Pi's small core, project-trust gate and enforced supply-chain rules compare with OMP, the fork built on Pi, and which of Pi's practices carry general lessons.
---

## Sources

- Pi, `earendil-works/pi` (formerly `badlogic/pi-mono`): https://github.com/earendil-works/pi/tree/v0.87.1 (tag `v0.87.1`, commit `f07218c4d4bbc12bef056a7058c3dd49dfe41abe`, 2026-09-22).
- oh-my-pi (OMP), `can1357/oh-my-pi`: https://github.com/can1357/oh-my-pi/tree/v18.3.0 (tag `v18.3.0`, commit `62bc57be1b03ef0802a33cf7f5f530e534527531`, 2026-09-24). We also ran the published 18.3.0 package; its line numbers match this tag.
- OMP's settings schema at that tag, cited below by line: https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/config/settings-schema.ts
- npm registry record for `@oh-my-pi/pi-coding-agent`: https://registry.npmjs.org/@oh-my-pi/pi-coding-agent (read 2026-09-25).
- The Pi post: https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ (read 2026-09-24).
- The MCP versus CLI post: https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/ (read 2026-09-24).
- https://github.com/badlogic/terminalcp, https://github.com/badlogic/cchistory and https://github.com/badlogic/agent-tools (read 2026-09-24).
- `pi_agent_rust`, a Rust port of Pi whose `Cargo.toml` lists Jeffrey Emanuel as author: https://github.com/Dicklesworthstone/pi_agent_rust/blob/8ce178e5d7fbf06f94cb808c9fde9fe46b83f28e/Cargo.toml#L7 (commit `8ce178e`, read 2026-09-25).

Licenses: Pi is MIT, `Copyright (c) 2025 Mario Zechner` [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/LICENSE#L3]; OMP is MIT [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/LICENSE]. terminalcp and cchistory have no LICENSE file [Verified: GitHub license API, 2026-09-25, evidence/licenses.jsonl: no license file], though terminalcp's `package.json` declares MIT [Verified: https://raw.githubusercontent.com/badlogic/terminalcp/HEAD/package.json]. agent-tools is archived with no LICENSE file [Verified: GitHub license API, 2026-09-25, evidence/licenses.jsonl].

## What he built

Authorship: Pi's LICENSE carries Mario Zechner's copyright line (cited above), and the Pi post on his own site describes Pi's design in the first person and links the `badlogic/pi-mono` repository; the MCP versus CLI post links `badlogic/terminalcp` the same way.

Pi is an npm workspace monorepo with packages `ai`, `agent`, `tui`, `coding-agent`, `durable`, `telemetry`, `protocol`, `client`, `server`, `session-backends`, `chord` and `evals` [Verified: https://github.com/earendil-works/pi/tree/v0.87.1/packages]. The CLI is `@earendil-works/pi-coding-agent`, binary `pi`. The core is deliberately small:

- **Four default tools: read, bash, edit, write** [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/packages/coding-agent/src/core/system-prompt.ts#L58]. grep, find, ls and powershell are optional.
- **A one-sentence base system prompt** plus the tool list, short rules and a docs pointer; context files, skills and the working directory are appended as tagged sections [Verified: same file, lines 146-178]. He reports prompt plus tool definitions at under 1,000 tokens [Reported: the Pi post, measured Nov 2025, not on v0.87.1].
- **No MCP in the core** [Verified: search of the package sources at the tag]. The Pi post: "pi does not and will not support MCP".
- **Subagents, todos, plan mode and a permission gate are example extensions, not core** [Verified: https://github.com/earendil-works/pi/tree/v0.87.1/packages/coding-agent/examples/extensions]. The subagent example spawns separate `pi` processes; the permission gate only regex-checks `rm -rf`, `sudo` and `chmod 777`.
- **No sandbox and no per-call approval, but a project-trust gate.** Pi "does not ask for approval before every tool call". Project trust decides whether `.pi/` settings, extensions, skills, prompts, themes and system-prompt files, and project-level agent skill directories, load. The default is `defaultProjectTrust: "ask"`, and print, JSON and RPC modes skip those resources unless trust was saved or `--approve` is passed. AGENTS.md and CLAUDE.md load regardless [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/packages/coding-agent/docs/security.md#L29-L80]. His SECURITY.md puts sandboxing, untrusted repositories and prompt injection out of scope [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/SECURITY.md#L48-L56].
- **Supply-chain rules, enforced in code:**
  - `.npmrc` sets `save-exact=true` and `min-release-age=2` [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/.npmrc].
  - `check-pinned-deps.mjs` fails `npm run check` if any direct external dependency is not an exact version [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/scripts/check-pinned-deps.mjs].
  - A pre-commit hook refuses a staged `package-lock.json` unless only workspace entries changed or an override is set, and prints the changed packages with a review checklist ("confirm npm age gates were active", "review any new lifecycle scripts") [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/scripts/check-lockfile-commit.mjs#L82-L120].
  - The CLI ships an `npm-shrinkwrap.json`; dependencies with install scripts need an allowlist entry with a written reason (three today) [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/scripts/generate-coding-agent-shrinkwrap.mjs#L14-L18].
  - Installs use `--ignore-scripts` in the README, CI and agent rules; a daily workflow runs `npm audit` and `npm audit signatures` [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/.github/workflows/npm-audit.yml#L24-L31].
  - All 39 third-party GitHub Action references are pinned by commit SHA [Verified: count over the workflows at the tag].
- **Git rules for many sessions in one checkout:** commit only your own files, stage explicit paths, never `git add -A`, `git stash`, `git reset --hard`, `git clean -fd` or `--no-verify` [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/AGENTS.md#L52-L72].
- **Contribution gate:** new contributors' issues and PRs are auto-closed and reviewed daily [Verified: https://github.com/earendil-works/pi/blob/v0.87.1/CONTRIBUTING.md#L22-L28].

The Pi post argues for a minimal prompt, four tools, no approval prompts, file-based todos and plans, no MCP (Playwright MCP at 21 tools and 13.7k tokens), no background bash (use tmux), and no subagents beyond spawning `pi --print` for review [Reported: the Pi post].

## Where OMP differs

OMP describes itself as a fork of Pi [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/README.md#L22]. Verdicts are [Inference].

| Area | Pi v0.87.1 | OMP 18.3.0 | Verdict |
|---|---|---|---|
| MCP | none in core | built in, lazy catalog | OMP mostly answers the cost point |
| Project trust | gate, default ask | no gating | Pi |
| Subagents | example only | built-in `task` | OMP, for multi-agent work |
| Approval | none | tiers, default yolo | same in practice |
| System prompt | about 1k tokens | 14.6 KB template | Pi, before any appended skills |
| Exact pins | enforced | caret ranges ship | Pi |
| Release age | 2 (npm) | 3 days, repo only | both set in the repo |
| Action pins | 39 of 39 by SHA | 32 SHA, 17 tag | Pi |

- **MCP.** Project-level MCP config loads by default (`mcp.enableProjectConfig: true`), and MCP tools are mounted as `xd://` devices with a one-line catalog by default [Verified: settings schema, lines 4755-4776 and 4802-4811]. Schemas load on demand, much like his CLI-plus-README approach, which answers most of his token objection [Inference].
- **Project trust.** OMP's own source states: "OMP performs no project-trust gating — project-level settings and extensions load unconditionally — so this always returns `true`" [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/extensibility/extensions/types.ts#L462-L469]. It also discovers project config in `.claude`, `.codex`, `.gemini`, `.opencode`, `.cursor` and `.windsurf` directories [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/discovery/helpers.ts#L39-L83]. Pi documents a trust decision before those kinds of resources load (see above). Pi's design is the safer one here [Inference].
- **Subagents and todos.** OMP has a built-in `task` tool (concurrency 32, recursion depth 2) and a built-in todo tool [Verified: settings schema, lines 5127, 5160 and 4165]. Mario's objection to subagents is observability; OMP exposes subagent transcripts through `history://` and `agent://` URLs. Keeping durable task state in external files, as beads does, is his recommendation.
- **Approval.** OMP has `always-ask`, `write` and `yolo` tiers but defaults to `yolo` [Verified: settings schema, lines 4132-4145]. Pi's model puts policy in extensions and leaves isolation to the operating system.
- **Background jobs.** OMP ships background bash, async jobs, and (new in 18.3.0) a `wait` tool with `proc://` URLs [Verified: settings schema, lines 3918 and 4734; https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/CHANGELOG.md#L18]. The Pi post recommends tmux instead; tmux session managers such as NTM (https://github.com/Dicklesworthstone/ntm) can run alongside OMP's async jobs.
- **Release drift.** 18.3.0 deprecated the `hub` tool and changed edit syntax to `*** Edit File:` / `*** Find` / `*** Replace` headers [Verified: same changelog, lines 9-11]. Agent processes started before an upgrade keep the old bundle, so a fleet of long-running sessions can run mixed versions for a while [Inference].
- **Eval.** OMP's Python and JavaScript eval kernels can install packages from inside a session (`eval.autoProvision`) [Verified: settings schema, lines 4014-4045].
- **System prompt size.** The base-prompt gap is real: OMP's system prompt template is 14,590 bytes [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/prompts/system/system-prompt.md]. A large skill index appended to that template can outweigh it [Inference].
- **Exact pins.** OMP's `bunfig.toml` sets `exact = true`, but the root workspace catalog uses caret ranges for external dependencies such as `@babel/parser` and `@opentelemetry/*`, so a consumer install resolves ranges at install time [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/package.json#L12-L35].
- **Release age.** OMP's repo sets `minimumReleaseAge = 259200` (3 days) [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/bunfig.toml#L4], but that governs OMP's own development, not users installing OMP. 18.3.0 was published at 2026-09-24T02:31:40Z [Verified: npm registry]; a user with no global age gate can install a release that new as soon as it appears [Inference]. OMP's updater also forces release age to zero on the mise path [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/cli/update-cli.ts#L1495-L1514].
- **Rules kept.** OMP's AGENTS.md keeps Pi's "no inline imports" and "never commit unless asked" but not its concurrent-session git rules [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/AGENTS.md#L46].
- **Upstream sync.** OMP's last documented full sync from Pi is commit `b21b42d` of 2026-03-22 [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/docs/porting-from-pi-mono.md#L6-L9], and Pi v0.87.1 is 3,162 commits past it [Verified: https://api.github.com/repos/earendil-works/pi/compare/b21b42d032919de2f2e6920a76fa9a37c3920c0a...v0.87.1]. Pi extensions run through OMP's legacy compatibility shim; newer ones may not load [Inference].

## General lessons

1. **A minimum release age on the installing side.** OMP's repo-level `minimumReleaseAge` governs its own development, not users installing OMP (see above), so a gate that protects users has to be set in their own install configuration [Inference]. Pi's `.npmrc` shows the pattern: `min-release-age=2` with `save-exact=true`. Risk: urgent fixes wait unless overridden.
2. **A release surface diff (cchistory's idea).** Pack the previous and new releases of a harness and diff prompt files, the tool registry and settings defaults. On OMP 18.2.11 to 18.3.0 it would show both behaviour changes above (`hub`, edit headers) [Inference]. cchistory has no LICENSE file, so reuse the method, not the code.
3. **Close the project-trust gap in configuration.** Where the harness does not gate project config, turning off project-level MCP loading (`mcp.enableProjectConfig`) and keeping agent sessions out of freshly cloned third-party repositories covers part of what Pi's trust gate does [Inference].
4. **Count the whole prompt, not just the base.** Mario's point about context spent before work begins applies to everything appended to the base prompt, such as a skill index; OMP's `skills.includeSkills` and `skills.ignoredSkills` settings trim that index per profile [Verified: settings schema, lines 5347-5349].
5. **Pi's dependency checks are reusable.** A copy of `check-pinned-deps.mjs` or `check-lockfile-commit.mjs` keeps the MIT notice and his copyright line.

His MCP versus CLI result over 120 runs was "a wash when the tool is well designed", with the MCP arm 23% faster and 2.5% cheaper than the matching CLI [Reported: the MCP versus CLI post]. OMP loads MCP schemas lazily, which his Claude Code runs did not, so the result may not carry over to OMP [Inference].

## Do not adopt

- **Pi's security scope as a policy for untrusted work.** Pi's SECURITY.md documents prompt injection and untrusted repositories as out of scope for the tool, so running it on untrusted repositories needs guards beyond it [Inference].
- **Copying terminalcp or cchistory code.** Neither has a LICENSE file. Reuse the method only.

## Attribution we owe

- OMP keeps `Copyright (c) 2025 Mario Zechner` in its LICENSE [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/LICENSE#L3] and in the `pi-agent-core`, `pi-ai`, `pi-tui` and `pi-coding-agent` package licenses (for example https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/agent/LICENSE#L3). The OMP-only packages (`pi-utils`, `pi-natives`, `pi-catalog`, `pi-wire`, `pi-mnemopi`, `omp-stats`, `omptype`, `snapcompact`) do not carry his line [Verified]; whether they contain code derived from Pi is not verified.
- OMP's README credits Pi [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/README.md#L22], and its third-party notices repeat his copyright line [Verified: https://github.com/can1357/oh-my-pi/blob/v18.3.0/THIRD-PARTY-NOTICES.txt#L227].
- Anyone who vendors or republishes OMP or Pi code carries the MIT notice with his line.
- Work built on the MCP versus CLI post should cite it for the design; release-age or lockfile rules taken from Pi should name Pi (and OMP's `bunfig.toml`) as the source.
- The `pi_agent_rust` README credits Mario Zechner as the author of the Pi it ports [Verified: https://github.com/Dicklesworthstone/pi_agent_rust/blob/8ce178e5d7fbf06f94cb808c9fde9fe46b83f28e/README.md#L45].

## What we could not verify

- Pi's current rendered prompt size in tokens. We read the source but did not run Pi; the under-1,000-tokens figure is his, from Nov 2025.
- Whether bun's `minimumReleaseAge` refuses or silently downgrades an explicit `package@version` install, and whether OMP's eval environment reads the global bun config.
- Whether turning off `mcp.enableProjectConfig` also stops project MCP discovery through OMP's separate Claude-config loader (https://github.com/can1357/oh-my-pi/blob/v18.3.0/packages/coding-agent/src/discovery/claude.ts#L79-L100). Not tested.
- Whether OMP's legacy Pi shim loads extensions written against Pi 0.87.x.
- Pi's Terminal-Bench 2.0 leaderboard placement (known only from his post).
- The unit of npm's `min-release-age` (days assumed) was not checked against npm documentation.
