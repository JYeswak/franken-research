---
title: Geoffrey Huntley: the Ralph loop, the porting recipe, preflight and underclass
covers: 90
written: 2026-09-24
summary: What Geoffrey Huntley built (the Ralph loop, a four-step porting recipe, the preflight and underclass proxies), how it compares with Jeffrey's port method, and which of its practices carry general lessons.
---

## Sources

Blog posts by Geoffrey Huntley (read 2026-09-24, re-read 2026-09-25):

- https://ghuntley.com/ralph/ (published 2025-07-14, modified 2026-02-19)
- https://ghuntley.com/loop/ (2026-01-17)
- https://ghuntley.com/pressure/ (2026-01-17; the opening is public, the rest is marked for subscribers)
- https://ghuntley.com/porting/ (2026-03-15)
- https://ghuntley.com/slop/ (2026-07-23)
- https://ghuntley.com/specs/ (2025-03-03; marked for subscribers, only the opening read)
- Moss, "Don't waste your back pressure": https://banay.me/dont-waste-your-backpressure/ (read 2026-09-25)

Repositories, pinned to the commit we read:

- https://github.com/ghuntley/preflight at `eb13fc015686` (2026-09-20)
- https://github.com/ghuntley/underclass at `34df0895df96` (2026-09-23)
- https://github.com/ghuntley/sup at `f2711aee801f` (2025-05-02)
- https://github.com/ghuntley/cursed at `ecda33d496e1` (2025-09-09, default branch `zig`)
- https://github.com/iannuttall/ralph at `5bc402540c45` (2026-02-04)
- https://github.com/ghuntley/how-to-ralph-wiggum, a fork of https://github.com/ClaytonFarr/ralph-playbook (GitHub API, read 2026-09-25)
- https://github.com/ghuntley/loom, https://github.com/ghuntley/how-to-build-a-coding-agent and https://github.com/spolu/code-contracts (metadata only, read 2026-09-25)

Franken Research files on `main` (read 2026-09-25): https://github.com/JYeswak/franken-research, cited per file below.

Labels: [Verified] means we read the file line or page ourselves; [Reported] means a document says it and we did not check the underlying thing; [Inference] is our judgment. Every claim rests on static reads of source, pages and API metadata. We built and ran none of these projects. Written by an AI agent session.

## What he built

### The Ralph loop

All [Verified] from https://ghuntley.com/ralph/ unless marked otherwise.

- **Definition.** "Ralph is a technique. In its purest form, Ralph is a Bash loop": `while :; do cat PROMPT.md | claude-code ; done`. The loop has no stop condition, no iteration cap and no success check.
- **Topology.** "Ralph is monolithic. Ralph works autonomously in a single repository as a single process that performs one task per loop."
- **Per-loop contract.** The plan (`@fix_plan.md`) and specs (`specs/*`) load every iteration. "One item per loop": the agent is told to "choose the most important thing". The primary context "should operate as a scheduler"; subagents fan out for search and writes, but "only 1 subagent for build/tests".
- **Signs.** Each observed failure becomes a prompt line, such as "don't assume not implemented" or "DO NOT IMPLEMENT PLACEHOLDER OR SIMPLE IMPLEMENTATIONS".
- **Back pressure.** Tests, types and analysers reject bad generations: "the wheel has got to turn fast". Without a type checker in a dynamic language, "you will run into a bonfire of outcomes".
- **Planning.** A separate prompt uses "up to 500 subagents" to compare `src/` with the specs and rewrite `fix_plan.md`. He has "deleted the TODO list multiple times". Asked "how do you plan?", he answers "I don't."
- **Learning and commits.** The agent updates `AGENT.md` with how to build and run the project; every green iteration runs `git add -A`, commits and pushes.
- **Limits he states.** "There's no way in heck would I use Ralph in an existing code base." "Engineers are still needed." Ralph gets greenfield work about "90% done".
- **Later framing** (https://ghuntley.com/loop/) [Verified]. "Ralph is an orchestrator pattern where you allocate the array with the required backing specifications and then give it a goal then looping the goal." The operator should "watch the loop". A manual loop that waits for CTRL+C "is still ralphing". Ralph has a forward mode (building) and a reverse mode ("clean rooming").
- **Back pressure essay** (https://ghuntley.com/pressure/) [Verified, read 2026-09-25]. The opening is public and credits the essay on back pressure to Moss (https://banay.me/dont-waste-your-backpressure/). It adds: "If you aren't capturing your back-pressure then you are failing as a software engineer." The rest of the post is marked "for subscribers only".
- **Current direction** (https://ghuntley.com/slop/) [Verified]. The post announces that he is joining Antithesis and states the hypothesis that "formal verification and deterministic system testing are about to cross the chasm".

### The porting recipe

From https://ghuntley.com/porting/ [Verified]:

1. A Ralph loop compresses all tests into `/specs/*.md`, one subagent per test file, linking the implementation as citations.
2. A second Ralph loop does the same for product source: "study every file in src/* using seperate subagents per file and link the implementation as citations in the specification".
3. A Ralph loop creates a TODO file, then a classic Ralph does "just one thing and the most important thing per loop", reminded that it can "follow the citations to reference source code".
4. The target language is configured for strict compilation.

His theory: citations "tease the file_read tool to study the original implementation", and stages 1 and 2 turn a code base "into high level PRDs without coupling the implementation from the source language". The post links no example port and reports no measured outcome [Verified]. The only related field report he links is a Y Combinator hackathon write-up, "6 Repos Overnight" (repomirror, linked from /ralph/) [Reported].

### Repositories

**cursed** (MIT)
- Default branch `zig`, with `src-zig/` and `build.zig` [Verified: https://github.com/ghuntley/cursed/tree/zig]. The 2025 post describes a Rust and LLVM compiler, so the language moved after the post [Inference].
- About 110 Markdown files under `specs/`; the one we sampled has no citations to implementation files [Verified]. That is forward-mode Ralph, not the porting recipe.
- Its stdlib specs come from a prompt that enumerates Go's standard library and renames each package [Verified: https://github.com/ghuntley/cursed/blob/ecda33d496e1/specs/stdlib/PROMPT.md].

**sup** (no license)
- A Rust tmux supervisor, described as "the fist AI orchestrator for Geoff's ralph wiggum technique".
- The default script is a hard-coded absolute path. It restarts a pane on log lines such as "prompt is too long" or after 120 seconds idle, and `main` sleeps in an endless loop [Verified: https://github.com/ghuntley/sup/blob/f2711aee801f/sup/src/main.rs].

**how-to-ralph-wiggum** is a fork of Clayton Farr's https://github.com/ClaytonFarr/ralph-playbook [Verified: GitHub API `parent`]. The playbook is Clayton Farr's work.

**loom**: described as "if your name is not Geoffrey Huntley then do not use loom", no license [Verified: metadata]. Not read. **how-to-build-a-coding-agent**: a workshop repo with about 5,800 stars and no license file [Verified: GitHub license API, 2026-09-25, evidence/licenses.jsonl]. Link to it; do not copy.

### preflight

MIT ("Copyright (c) 2026 preflight contributors"), created 2026-09-20. All [Verified] at https://github.com/ghuntley/preflight/tree/eb13fc015686.

- **What it is.** A Rust proxy between an OpenAI-compatible coding harness and underclass ([README](https://github.com/ghuntley/preflight/blob/eb13fc015686/README.md)).
- **Routes.** Only `/v1/models`, `/v1/responses` and `/v1/chat/completions`, plus health, readiness and metrics ([src/main.rs](https://github.com/ghuntley/preflight/blob/eb13fc015686/src/main.rs#L306-L320)). There is no Anthropic `/v1/messages` route, and "Unknown routes are not pass-through routes."
- **Rules.** The Gitleaks v8.30.1 database (222 rules) is embedded at compile time ([src/scanner.rs](https://github.com/ghuntley/preflight/blob/eb13fc015686/src/scanner.rs#L70-L73); [upstream.json](https://github.com/ghuntley/preflight/blob/eb13fc015686/vendor/gitleaks/upstream.json)), and a profile enables 19 of them ([default-profile.toml](https://github.com/ghuntley/preflight/blob/eb13fc015686/rules/default-profile.toml)). Two custom rules cover OpenRouter keys and private-key fragments. Matching is keyword prefilter, regex, sha256 exemptions, stopwords and an optional entropy check; JWTs wrapped across lines are re-joined ([src/scanner.rs](https://github.com/ghuntley/preflight/blob/eb13fc015686/src/scanner.rs#L109-L217)). Runtime config cannot add rules, so a new rule means a rebuild.
- **Attachments.** A Rust worker drives Poppler, QPDF, Tesseract, ExifTool and ZBar, sandboxed with `bwrap --unshare-all` or run directly when unsandboxed ([src/attachments.rs](https://github.com/ghuntley/preflight/blob/eb13fc015686/src/attachments.rs#L222-L246)). The README says "OCR does not prove the absence of every visually readable secret."
- **Modes.** `redact` (default) rewrites findings and forwards; `no-go` returns 409; `advisory` reports and forwards the original. All modes reject failed extraction, and [CONTRACTS](https://github.com/ghuntley/preflight/blob/eb13fc015686/CONTRACTS) requires rejection on incomplete inspection.
- **Packaging and tests.** Linux only, and the Nix build sets `doCheck = false` because "Hegel's engine bootstrap needs network" ([flake.nix](https://github.com/ghuntley/preflight/blob/eb13fc015686/flake.nix)). The differential test against Gitleaks covers one rule (GitHub PATs) on five strings ([tests/differential.rs](https://github.com/ghuntley/preflight/blob/eb13fc015686/tests/differential.rs#L16-L26)). A weekly workflow commits rule updates "directly to `main`".
- **Agent rules.** [AGENTS.md](https://github.com/ghuntley/preflight/blob/eb13fc015686/AGENTS.md) requires the `code-contracts` skill, static types everywhere and Rust for all project-owned executables.

### underclass

MIT ("Copyright (c) 2026 Geoffrey Huntley"). Documented behaviour only, all [Verified] at https://github.com/ghuntley/underclass/tree/34df0895df96.

- **What it is.** "A local proxy that pools multiple ChatGPT/Codex and GitHub Copilot subscriptions behind one OpenAI-compatible endpoint" ([README](https://github.com/ghuntley/underclass/blob/34df0895df96/README.md)).
- **Routing** (README, "How routing works"): sessions stick to one account by `prompt_cache_key`, else a `session-id` header ([src/proxy.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/proxy.rs#L68-L75)); a quota response cools the account until the upstream deadline or a 30-minute default ([src/config.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/config.rs#L29)); when every eligible account is cooling it answers 429 with `Retry-After` at the earliest reset; failover happens only before the first byte.
- **Credentials.** Tokens are plain text columns ([src/store.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/store.rs#L81-L82)), recorded as an accepted risk: "Tokens rest in plaintext in the database file; the file's permissions and host security are the control" ([ADR 0005](https://github.com/ghuntley/underclass/blob/34df0895df96/docs/adr/0005-sqlite-account-store.md#L20)).
- **Monitor socket.** By contract it "MUST be a Unix socket with mode 0666 so local users can read its limited monitor endpoint" ([src/main.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/main.rs#L249-L274)); the snapshot is read-only and redacted but lists account labels ([src/monitor.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/monitor.rs#L68-L70)).
- **Client identity.** Codex requests carry `originator: opencode` and a User-Agent built from `opencode/`, the crate version and `(underclass-pool-proxy)` ([src/codex.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/src/codex.rs#L15)).
- **Cross-account context.** ADR 0003 says routing a session's turns to different accounts "leaks conversation context across subscriptions", and its decision still rebinds a session when its account cools, across backends if needed ([ADR 0003](https://github.com/ghuntley/underclass/blob/34df0895df96/docs/adr/0003-prompt-cache-key-stickiness.md)).
- **README drift.** The README says "43 unit tests + 8 Hegel property tests" ([README](https://github.com/ghuntley/underclass/blob/34df0895df96/README.md#L233)); [tests/properties.rs](https://github.com/ghuntley/underclass/blob/34df0895df96/tests/properties.rs) alone has 16 `hegel::test` attributes.
- **Vendored skill.** `code-contracts` comes from spolu/code-contracts ([skills-lock.json](https://github.com/ghuntley/underclass/blob/34df0895df96/skills-lock.json)), which GitHub reports as unlicensed.

## Design choices in the Ralph loop

Ian Nuttall's ralph templates (https://github.com/iannuttall/ralph) are one public implementation of the technique. Its `package.json` says MIT but the repo has no LICENSE file [Verified: https://github.com/iannuttall/ralph/blob/5bc402540c45/package.json].

- **Loop driver.** He loops forever, though his /loop post also counts a manual loop that waits for CTRL+C as ralphing. [Inference] An iteration cap or an operator-invoked tick bounds spend and blast radius when many loops run at once.
- **Next unit.** His agent picks "the most important thing". [Inference] That fits one writer on greenfield; several writers need a shared rule, such as taking the next ready item from a dependency graph.
- **Plan artifact.** His `fix_plan.md` is disposable. [Inference] Durable plans tend to accrete documents and bookkeeping, but durable tasks are still needed when several agents claim work.
- **Specs.** He reloads the full spec every loop. [Inference] Loading one story per tick is cheaper but carries less global context.
- **Completion.** His loop checks nothing; the agent runs the tests. [Inference] A loop that marks work done when a completion token shows up in the log can be fooled when the token also appears in the prompt and the runner echoes its prompt; gates run by the loop itself, or a classifier judging from the diff whether the product moved, are stronger checks.
- **Commits.** He uses `git add -A`. [Inference] That is safe only with one process per repo; where several agents share a tree, commits by pathspec avoid sweeping in other writers' files.
- **Parallelism.** His one-build-lane rule is cheap and right [Inference].
- **Brownfield.** He avoids existing code, and his porting recipe is his on-ramp to it. [Inference] His posts give no measurement of loops on existing code bases.
- **Secrets.** preflight redacts outbound requests before the provider receives them (OpenAI-style APIs only). [Inference] Redaction after emission cannot un-leak; only a layer in front of the provider stops a secret before the provider sees it.

### The porting recipe against Franken Research's account of Jeffrey's method

Franken Research's [RULEBOOK.md](https://github.com/JYeswak/franken-research/blob/main/RULEBOOK.md) is an assessment protocol, not a port method ("Maintainer-run CI is not independent"; "Never cite an un-gated number as a result"). Jeffrey Emanuel's method is reconstructed from assessment packets as "a taxonomy of observed mechanisms, not a sequence any single repo runs" ([planning-methodology.md](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/planning-methodology.md)). No Franken Research assessment mentions Ralph or Huntley [Verified, 2026-09-25].

**P1: tests become specs.** Huntley's recipe writes prose specs per test file and does not keep the tests as a gate. In Jeffrey's ports, upstream tests stay executable: frankenredis runs the incumbent's full upstream suite in CI ([brief](https://github.com/JYeswak/franken-research/blob/main/synthesis/briefs/frankenredis.md)), frankenjax fixtures are "captured from the legacy JAX oracle" ([frankenjax](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/frankenjax.md)), and toon_bend's goldens carry a 3,234-line sha256 manifest ([toon_bend](https://github.com/JYeswak/franken-research/blob/main/cohorts/2026-09/toon_bend-assessment.md)). [Inference] Jeffrey's is stronger for proof; Huntley's for intent capture and cost. Combine them: compress tests to specs and keep the tests as the gate. Caveat: CI was green at the pin in only 2 of 44 repos ([00-overview.md](https://github.com/JYeswak/franken-research/blob/main/synthesis/00-overview.md)).

**P2: source becomes specs with citations.** Jeffrey's ports use structure-extraction documents in a set order ([franken_whisper](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/franken_whisper.md)) and legacy anchor maps. toon_bend's clauses "cite the original's source lines and were checked by running it" (maintainer claim); for beads_bend, "The clauses' fidelity to br's source was not checked" ([beads_bend](https://github.com/JYeswak/franken-research/blob/main/cohorts/2026-09/beads_bend-assessment.md)); franken_lean's `anchor:` lines fail CI if the upstream token moves ([franken_lean](https://github.com/JYeswak/franken-research/blob/main/packets/franken_lean-assessment.md)). [Inference] Jeffrey's is stronger where anchors are machine-checked or run against an oracle; elsewhere they tie. Huntley's is more exhaustive (per file).

**P3: one item per loop, following citations into source.** Jeffrey's ports "Claim the next ready bead" ([frankensqlite](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/frankensqlite.md)), close only on cited evidence ([CHECKLIST.md](https://github.com/JYeswak/franken-research/blob/main/starter-kit/CHECKLIST.md)), and in networkx "Line-by-line translation is forbidden" ([franken_networkx](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/franken_networkx.md)). [Inference] Jeffrey's is stronger on paper for parallel claims, though Franken Research records false closes against it (739 debt tasks inside a "complete" graph, CHECKLIST B13). On reading legacy source the two are opposite: citations risk line-by-line translation, spec-only risks gaps. The numpy port's middle path reads source for behaviour only, with the differential oracle as proof: "the source is not the artifact" (maintainer claim, [franken_numpy](https://github.com/JYeswak/franken-research/blob/main/packets/franken_numpy-assessment.md)).

**P4: strict compilation.** Huntley's single back-pressure knob. Jeffrey's repos document toolchain gates in 21 of 44 repos, and several pins are red on them. [Inference] Jeffrey's stated bar is higher; neither proves the gate held at a given commit.

**Theory.** Both aim to decouple from the source language. [Inference] A citation shows where to look; Jeffrey's running oracle shows whether you are right.

**Only in Jeffrey's method:** parity ledgers where "partial never rounds up" ([uniqueness-catalog.md](https://github.com/JYeswak/franken-research/blob/main/synthesis/uniqueness-catalog.md)), an incumbent-win result class that needs a live incumbent arm ([frankenmermaid](https://github.com/JYeswak/franken-research/blob/main/synthesis/planning/frankenmermaid.md)), convergence rounds (toon_bend needs two clean non-author rounds; rounds 6 to 22 were not clean, and the reviewers are the maintainer's own subagents), and named forbidden patterns such as "spec-editing as progress". **Only in Huntley's:** four steps short enough for an afternoon, an explicit tests-to-spec pass, and no dependency-graph overhead.

**Evidence.** Huntley's post has no example port and no numbers. Franken Research found 0 of 44 of Jeffrey's repos independently validated and 1 of 44 behaviourally reproduced by an analyst (00-overview.md); a later analyst rerun of toon_bend on macOS arm64 passed 1068 of 1078 captured cases on each of three lanes, the 10 failures being Linux-only `/dev/full` cases. We found no assessment of Huntley's recipe by anyone.

In short: Huntley's recipe is the cheaper, more exhaustive way to extract intent; Jeffrey's method is the stronger way to prove a port, where its oracles run. [Inference] The strongest combination on this reading is his P1 and P2, an executable oracle, and franken_lean-style checked anchors.

## General lessons

1. **Let the loop decide completion.** Mark an item done only if HEAD advanced, the tree is clean, and every quality gate, run by the loop, exits 0; match a completion token only in the agent's final message [Inference]. Where the gates come from an agent-written plan, allowlist the commands.
2. **Citation-anchored port specs.** (a) One subagent per upstream test file writes clauses that cite the test, and the tests stay the oracle. (b) Each structure clause carries an anchor (legacy path, line, expected token), and a lint fails if the token is missing at the pinned commit. (c) Follow an anchor only to answer a behaviour question, then amend the clause before implementing. Risk: anchors rot when the pin moves. License: ideas only; Jeffrey's repos carry a rider Franken Research classes as non-OSI (RULEBOOK.md), so reimplement the lint from its description.
3. **Know preflight's limits.** No Anthropic route, a Linux-only sandbox (do not run it unsandboxed on macOS), compile-time rules, weekly auto-commits to `main` (pin a commit), OCR that is not proof of absence, and a project days old.

## Do not adopt

- **underclass, as software.** Its own documents record plaintext tokens as an accepted risk (ADR 0005), a mode-0666 monitor socket by design, several subscriptions pooled behind one key, and session rebinding that ADR 0003 says "leaks conversation context across subscriptions". Its code sends an `originator: opencode` header upstream (codex.rs). We make no claim about any provider's terms, which we did not assess; for any fleet that handles client data the design is a data-boundary problem either way [Inference]. Worth studying as ideas: cooling with an absolute reset time, a fail-fast 429 carrying the earliest reset, stickiness on `prompt_cache_key`, and failover only before the first byte.
- **The bare `while :` loop.** No cap, stop condition or loop-side check.
- **"I don't plan" in multi-agent trees.** Independent choosers duplicate work, as he warns: "If you wake up to find that Ralph is doing multiple implementations, then you need to tune this step."
- **`git add -A` and push on every green.** It assumes one process per repo.
- **Following citations into legacy source during implementation, unamended.** Follow a citation only to answer a behaviour question, then amend the clause first.
- **Tests compressed into prose without keeping the tests as the gate.** That invites "spec-editing as progress".
- **sup.** No license, a hard-coded script path, no stop condition.
- **Copying from these sources:** his CURSED prompts (blog content is his copyright), `how-to-build-a-coding-agent`, `sup` and spolu/code-contracts (no license), and loom.
- **`code-contracts` as enforcement.** preflight's AGENTS.md validates contracts with `cc-check format` and reviews semantics manually, so a passing format check does not show that a contract holds [Inference].

## Attribution we owe

For a loop that descends from Ralph:

> This loop descends from Geoffrey Huntley's Ralph loop: a fresh context each iteration, the same specs and plan loaded every loop, one item per loop, back pressure from tests and types, and "signs" added after observed failures (https://ghuntley.com/ralph/, 2025-07-14; https://ghuntley.com/loop/, 2026-01-17).

For work built on Ian Nuttall's templates:

> Templates from Ian Nuttall's ralph (https://github.com/iannuttall/ralph, commit 5bc4025, MIT per package.json), an implementation of Geoffrey Huntley's Ralph technique (https://ghuntley.com/ralph/), with local changes.

- For the tests-to-specs and source-to-specs passes, cite https://ghuntley.com/porting/; for checked anchors, cite Jeffrey Emanuel's franken_lean anchors as described in the Franken Research franken_lean assessment.
- For the back pressure essay, cite Moss (https://banay.me/dont-waste-your-backpressure/). Huntley credits Moss for it, and his own use of the term appears earlier, in the 2025 Ralph post.
- The how-to-ralph-wiggum playbook is Clayton Farr's (https://github.com/ClaytonFarr/ralph-playbook).

## What we could not verify

- Whether preflight and underclass work: we built and ran neither. preflight's tests need a networked bootstrap and it packages Linux only.
- Who first used the term "loop engineering".
- The parts of https://ghuntley.com/specs/ (where his spec method is described) and https://ghuntley.com/pressure/ that are marked for subscribers.
- Any outcome of the porting recipe; the post gives none and we found none.
- Jeffrey's repositories themselves: statements about them are Franken Research's findings, re-read from its files.
- Whether underclass's code matches all of its own code contracts.
- Any provider's terms of service with respect to underclass.
