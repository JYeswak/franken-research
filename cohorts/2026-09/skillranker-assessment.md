# skillranker: RULEBOOK v1.1 assessment packet (cohort 2026-09, pending review)

**Repository:** `Dicklesworthstone/skillranker` · **Language:** Rust, edition 2024, toolchain pinned to `nightly-2026-08-31` [Code-verified, High] · **Pinned commit:** `556f17af6f8abe9fd1a199af71820d56a05e6f12` (2026-09-24 19:20:44 -0400, 23:20:44 UTC; default branch `main`, and `master` points at the same commit) [Git-observed, High] · **Later HEAD not read:** `9ac6b1f6d6d87ebc8c984ec1a34778e40b2732f4` (committed 2026-09-25 01:03:09 UTC, one commit ahead of the pin, seen via `git ls-remote` and the compare API at 01:11 UTC; its content was not read) [API-observed, High] · **License:** MIT with the OpenAI/Anthropic rider, non-OSI (§4.8) [License-verified, High] · **Stars / forks:** 117 / 8 · **Issues:** 4 open, 3 closed, 0 pull requests · **Created:** 2026-09-17 06:58 UTC · **Last push:** 2026-09-24 23:20 UTC [API-observed, High, read 2026-09-25 00:00 UTC] · **Assessment date:** 2026-09-24 (US local; work ran 2026-09-25 00:00 to 01:15 UTC).

**Method (analyst).** Cloned the full history (848 commits) into `~/.local/state/zeststream/scratch/control-plane/franken-lead/cohort/skillranker/` and checked out the pin; the full history was used only for the authorship and velocity counts. Read: `LICENSE` (73 lines, verbatim), `Cargo.toml`, `Cargo.lock` (dependency sources only), `rust-toolchain.toml`, README (2,041 lines; sections Top, Quick Start, Command Reference, Agent Hooks, Inline TUI, Architecture, Privacy, Performance, Limitations, FAQ, Contributions, License in full; the rest by heading), `CHANGELOG.md` (216 lines, full), `AGENTS.md` (674 lines; mission, doctrine, verification, release and contribution sections), `THIRD_PARTY_NOTICES.md`, `src/lib.rs`, `src/capabilities.rs`, `src/limits.rs`, parts of `src/adapter.rs`, `src/evaluation/numerics.rs`, `src/roster/retrieval.rs`, `docs/self-host-shadow-deployment.md` (full), `docs/reality-check-bridge-plan.md` (current-assessment section and status rows), the checked-in Beads tracker `.beads/issues.jsonl` (321 records, statuses and open titles), all seven GitHub issues with comments, the TypeSafe launch post, the `sontakey/awesome-jev` list, and Anthropic's Claude Code skills page. Counted files, lines, `#[test]` attributes, ignore markers, `unsafe` tokens, lockfile sources and commit trailers. Ran: the repository's Python validators and `scripts/` unit tests locally; `cargo test` through RCH (did not produce a verdict, see §4.5); a macOS arm64 release build of `sr` through RCH (succeeded) and 22 invocations of that binary. Not done: a green or red verdict on the Rust test suite, any live Jev request, any real Claude Code hook session, clippy, or fmt.

**Tier legend (Rulebook §1, v1.1 flavors).** Tier 1 **[Verified]**, with flavors **[Counted]** (analyst ran the count), **[Git-observed]** (git metadata), **[Code-verified]** (source read), **[License-verified]** (license text read verbatim), **[API-observed]** (GitHub API response read by the analyst), **[Executed]** (analyst ran the program or script and read its output). Tier 2 **[CI-observed]** (not used: the repository has no CI). Tier 3 **[Maintainer claim]** (README, docs, changelog, Beads records, issue comments by the maintainer; not re-run). Tier 4 **[External]** (third parties: vendor pages, other people's issue reports and lists). Tier 5 **[Inference]** (analyst judgment). Confidence: **High**, **Medium**, **Low** as defined in Rulebook §1.

**Conflict note.** The organisation running this program (`JYeswak`) filed issues #4, #6 and #7 on this repository and commented on #3. They are cited below as [External]. They are not independent of this program, and the verdict does not rest on them: #7 was re-run by the analyst at the pin (§4.5), #4 was replayed at the pin, and #6's latency numbers are reported but not used to set the ring.

---

## Screening (candidates/README.md)

| # | Predicate | Result | Evidence |
|---|---|---|---|
| 1 | Public | Pass | Anonymous `git clone` over HTTPS succeeded; API `private: false` [API-observed, High] |
| 2 | Rust | Pass | API primary language `Rust`; `Cargo.toml` builds binary `sr` [API-observed, High] |
| 3 | Active | Pass | Last push 2026-09-24 23:20 UTC, within 30 days of the check [API-observed, High] |
| 4 | Agent-built signal | Pass | `AGENTS.md` at the root; 10 of the last 30 commits on `main` carry a `Co-Authored-By:` trailer naming a Claude model [Git-observed, High] |
| 5 | Not a fork | Pass | API `fork: false` [API-observed, High] |
| 6 | Not already covered | Pass | Not among the 44 in `packets/`; no earlier cohort; `gh issue list --search skillranker` on the program repository returned 0; `watch/discovery/` holds no weekly JSON; `watch/state.json` lists it only as part of the daily watch of the account [Verified, High] |
| 7 | Not Dicklesworthstone's | Fail, set aside for this cohort | The owner is Dicklesworthstone. The 2026-09 cohort was approved to cover repositories Dicklesworthstone created after the 44, so this predicate is set aside for the whole cohort [Verified, High] |

The repository is a working CLI with source, tests and documentation, not a smoke page. A packet follows.

---

## Hook

A 59,515-line Rust CLI [Counted, High] built in eight days by one maintainer and an agent swarm (848 commits between 2026-09-17 and 2026-09-24 [Git-observed, High]) around a model that launched two days before the first commit: TypeSafe's Jev [External, High]. Its local machinery is careful and checkable. Its own planning document says the thing it exists to do has not been shown: "The central claim is still unproven: nothing here shows a SkillRanker recommendation makes agent work better" [Maintainer claim, High; `docs/reality-check-bridge-plan.md:186-187`].

## TL;DR

- **What it is.** `sr` reads a live agent session (Claude Code transcript, a normalized context file, or a cass export), works out which skills the harness can actually load, and asks TypeSafe's Jev two typed questions (a wide Choice with a "none" option, then a rerank with per-candidate fit) to suggest at most one skill for the next step, or to abstain. Above 254 eligible skills, FrankenSearch's Quill prefilters lexically. It ships a Claude Code `UserPromptSubmit` hook that runs in shadow mode by default [Code-verified, High].
- **Strongest evidence.** The build is honest about itself at runtime: `sr capabilities --json` lists 16 implemented commands and 5 planned ones, and every planned command or flag I invoked was refused with its phase named [Executed, High]. A regression reported on 2026-09-20 (#4) replays fixed at the pin [Executed, High]. Zero `unsafe` blocks under `forbid(unsafe_code)` [Counted, High]; no tokio, reqwest, hyper or tantivy in the lockfile [Verified, High].
- **Strongest doubts.** Ranking cannot run without a paid, early-access, single-vendor API, by design [Code-verified, High]. The usefulness claim has no evidence yet (no relevance corpus; Beads `sr-uv2v` open) [Maintainer claim, High]. The README presents five planned commands and two planned flags as runnable, under a written policy to keep it in "the finished-product voice" [Code-verified, High]. The checked-in contract matrix fails its own validator at the pin [Executed, High]. There is no CI and no release.
- **Ring: Explore-with-a-ceiling. TRL 5. CI class C6. Release class R1. License: MIT + OpenAI/Anthropic rider (non-OSI). Bus factor 1** [Inference, Medium for ring and TRL; Verified, High for the rest].

## Quick links (pin-relative)

1. [Repository](https://github.com/Dicklesworthstone/skillranker)
2. [README at the pin](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/README.md)
3. [LICENSE (MIT + rider)](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/LICENSE)
4. [Capability registry source](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/src/capabilities.rs)
5. [Reality-check document (maintainer's own status audit)](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/docs/reality-check-bridge-plan.md)
6. [Self-hosted shadow deployment receipts](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/docs/self-host-shadow-deployment.md)
7. [CHANGELOG](https://github.com/Dicklesworthstone/skillranker/blob/556f17af6f8abe9fd1a199af71820d56a05e6f12/CHANGELOG.md)
8. [Issues](https://github.com/Dicklesworthstone/skillranker/issues?q=is%3Aissue) (7 total at the pin)
9. [TypeSafe launch post for Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (vendor, 2026-09-15)

No CI page exists: the Actions API reports 0 workflows and 0 runs [API-observed, High], and `AGENTS.md:640-641` forbids GitHub Actions ("Do not create, enable, dispatch, or rely on GitHub Actions workflows") [Maintainer claim, High].

## Did you know?

Asking a build of `sr` for a command it does not have yet gets a refusal that names the phase: `sr tui` returns exit 2 with "This build does not implement that command; it is planned for phase P9. Run sr capabilities for command status." The same happens for `snooze` and `budget` (P6), `calibrate` (P8), `gaps` (P9), `doctor --descriptions` (P9) and `eval --online` (P5) [Executed, High; binary built at the pin, 2026-09-25]. The refusal and the published inventory read the same table, so they cannot disagree (`src/capabilities.rs:67-85`) [Code-verified, High]. The README, meanwhile, lists all seven as ordinary commands.

## Franken-worthy next steps

1. **Pay for the missing input first: a labelled relevance set.** The evaluation stack (stratified and design-weighted loss, Wilson and Clopper-Pearson intervals, sampling manifests) is built; the labelled cases it reads do not exist (`sr-uv2v`). *Done when:* a frozen, independently adjudicated set of at least a few hundred session moments is committed with its labelling protocol and a first held-out report. *Falsified if:* Jev's reranked pick does not beat Quill-only top-1 on that set, which would mean the paid dependency is not earning its place.
2. **Put the capability registry in front of the README.** The runtime refusal is already exact. Generate the README command tables from `sr capabilities --json`, or mark planned rows from it. *Done when:* the README cannot list a command the registry calls planned. *Falsified if:* the next README edit adds another unmarked planned command.
3. **Wire `scripts/validate_contract_matrix.py` into `scripts/prepush_gates.sh`.** The matrix and its authority file disagree by 14 rows at the pin and nothing runs the check. *Done when:* the pre-push gate fails on the current drift, then passes after the rows are reviewed.
4. **Qualify an operational cohort that meets the project's own bar.** G59 asks for at most 5% fallback over at least 500 representative hook invocations. *Done when:* a maintainer cohort at a named revision reports all-invocation latency, fallback causes and per-stage timings. *Falsified if:* the default 3,000 ms deadline cannot meet 5% on rosters of several hundred skills.
5. **Add a second decision provider behind the same typed contract.** Issues #2 (OpenRouter-served Jev) and #5 (open-weight or local models) both ask for it. *Done when:* one alternative route passes the existing codec and admission tests. This is the only path that removes the single-vendor ceiling.

---

## 4.1 Header

Covered above. Pin `556f17af6f8abe9fd1a199af71820d56a05e6f12` (2026-09-24 23:20:44 UTC); Rust 2024 on `nightly-2026-08-31`; MIT + OpenAI/Anthropic rider (non-OSI); 117 stars, 8 forks (all 8 forks have 0 stars; one, `joyshmitz/skillranker`, is kept current by a pull bot) [API-observed, High]; created 2026-09-17; last push 2026-09-24; assessed 2026-09-24/25. `Cargo.toml` sets `publish = false`, so there is no crates.io package [Code-verified, High]. 0 releases, 0 tags [API-observed, High].

## 4.2 Executive verdict

skillranker is a single-binary Rust CLI that recommends one agent skill for the next turn of a live coding-agent session, or abstains, by combining local harness-visibility and privacy machinery with two typed calls to TypeSafe's Jev. **TRL 5** [Inference, Medium]: the full pipeline runs against the live provider on real sessions (maintainer smoke on a real 79 MB transcript, and a 247-invocation external cohort), but no quality or harm evaluation exists and the project's own P4 "useful core CLI" phase is still open. **NODUS ring: Explore-with-a-ceiling** [Inference, Medium]. The most important strength is that the program is honest about its own state where it counts at runtime: the build refuses planned work by phase, abstains instead of guessing, and records unknown usage as unknown [Executed, High]. The most important ceiling is structural: every fresh recommendation requires a paid API from one vendor that entered early access nine days before the pin, and the tool's stated purpose, better skill choice, is unmeasured by the maintainer's own account [Maintainer claim, High].

## 4.3 Claim inventory

| # | Claim (source) | Status | Evidence |
|---|---|---|---|
| 1 | "A TypeSafe API key is required to use SkillRanker's ranking system"; no local model or substitute provider (README:12-13, 78-81; FAQ) | **demonstrated** | No inference crate in `Cargo.toml` [Code-verified, High]; `sr doctor --json` with no key reports credential `absent` and names the TypeSafe console as the next step [Executed, High]; all 5 live-provider tests carry ignore reasons naming a paid request and an exported key (`tests/jev_smoke.rs`, `tests/jev_transport.rs`) [Counted, High] |
| 2 | Command reference: `rank`, `demo`, `roster`, `replay`, `hook`, `doctor`, `capabilities`, `tui`, `install-hook`, `uninstall-hook`, `stats`, `observe`, `feedback`, `snooze`, `budget`, `eval`, `calibrate`, `doctor --descriptions`, `gaps`, `ledger` (README:342-384) | **partially demonstrated** | The pin build reports 16 implemented commands (the 14 product commands plus `help` and `version`) and 5 planned: `budget` (P6), `snooze` (P6), `calibrate` (P8), `gaps` (P9), `tui` (P9); planned flags `doctor --descriptions` (P9), `eval --online` and `eval --max-requests` (P5) [Executed, High] |
| 3 | Inline TUI via FrankenTUI (README:1635-1658; README badge "JSON · hooks · TUI"; repository topic `frankentui`) | **aspirational** | `Cargo.toml:17-18`: "Reserved boundary; no TUI implementation or terminal dependency ships yet"; no `frankentui` in `Cargo.lock`; capabilities report `tui: {compiled: false, implemented: false}` [Executed, High] |
| 4 | Quill from FrankenSearch narrows rosters above 254 eligible skills; smaller rosters reach Jev in full (README:74-76) | **demonstrated** (mechanism) | `MAX_CANDIDATES = 254` (`src/roster/retrieval.rs:302`); in-memory `QuillIndex` from `frankensearch-quill` at git rev `39047c4` [Code-verified, High]; Jev's stated Choice cardinality limit is 255 [External, Medium]; an external cohort saw the wide pass at the 254 cap on 227 of 246 calls with a 552-skill roster (#6) [External, Medium] |
| 5 | Two Jev passes (wide Choice with "none", detailed rerank with fit questions); abstention is real (README:66-72) | **partially demonstrated** | Codec, admission and retry modules exist (`src/jev/`) [Code-verified, High]; maintainer smoke on a real session: 2 attempts, 21,275 tokens, 1,475 ms [Maintainer claim, Medium; reality-check doc, 2026-09-22]; external cohort: 2 provider requests on 242 of 247 calls (#6, 2026-09-24, Jev 1.13.0) [External, Medium]; the analyst made no live call |
| 6 | "Install on Linux or macOS" (README:182); "The supported local platform is Linux" (README:271); the installer "selects a release for your platform, verifies its SHA256 checksum" (README:188-190) | **stale / partially demonstrated** | The README states both platform scopes; there are 0 releases, so the release path cannot run and the installer can only build from source [API-observed, High]; `src/lib.rs:30-31` now compiles `storage` on Linux and macOS [Code-verified, High]; the analyst's macOS arm64 release build succeeded (§4.5) [Executed, High] |
| 7 | Performance targets: exact-cache p95 ≤ 100 ms; warm hook p50 ≤ 600 ms and p95 ≤ 1,500 ms (README:1852-1856) | **aspirational** (self-disavowed) | README:1858: "These targets are not remote-service guarantees or measured benchmark results." [Maintainer claim, High]; no maintainer latency cohort exists; the only cohort is external (§4.5) |
| 8 | "The hook never blocks the agent on a recommendation failure" (README:1606-1609) | **partially demonstrated** | `sr hook claude` with empty stdin: exit 0, 0 bytes on stdout, a one-line diagnostic on stderr [Executed, High]; shadow deployment recorded 11 of 11 credential-absent turns as quiet unavailability [Maintainer claim, Medium]; not run inside a real Claude Code session by the analyst |
| 9 | Privacy: redaction, disclosure receipts, network opt-in; `--offline` guarantees zero network requests (README:1750-1768) | **partially demonstrated** | Dry run on a request containing an `OPENAI_API_KEY=` value and a quoted `password=` value: both values absent from the 3,464-byte preview, `[REDACTED]` present, while the same grep finds both in the input [Executed, High]; the maintainer's own receipts record live redaction defects found and fixed on 2026-09-24 (`sr-wx8t`, underscore-prefixed secret names) [Maintainer claim, High]; README: "Redaction is fallible" |
| 10 | Evaluation numerics from FrankenSciPy, FrankenNumPy and FrankenPandas (README:1727-1739) | **partially demonstrated** | SciPy and NumPy adaptations exist with notices (`src/evaluation/numerics.rs`, `src/evaluation/sampling.rs`, `THIRD_PARTY_NOTICES.md`) [Code-verified, High]; FrankenPandas appears only as a revision string in `BACKEND_PROVENANCE` (`ab7bc5a4...`); the join and cardinality checks are native code with no "adapted from" marker, and `docs/dependencies.md:86` cites a different FrankenPandas revision (`7ca8c602...`) [Code-verified, Medium] |
| 11 | `sr eval` runs live batches with `--online` and `--max-requests` (README:392-416; FAQ) | **aspirational** | Both flags are refused at the pin as planned for P5 [Executed, High] |
| 12 | Unsafe code forbidden at crate roots (AGENTS.md:145-146) | **demonstrated** | `unsafe_code = "forbid"` in `[lints.rust]` and `#![forbid(unsafe_code)]` in `src/lib.rs` and `src/main.rs`; the 8 occurrences of the word `unsafe` in `.rs` files are all prose (permissions messages and comments) [Counted, High] |
| 13 | Asupersync owns task lifetimes, deadlines, HTTP/TLS "and deterministic lab replay"; no Tokio (README:1707-1708; AGENTS.md:121-122) | **partially demonstrated** | `asupersync =0.5.0`, patched to git rev `81fb7b5`, features `runtime-core`, `native-runtime`, `tls-native-roots`; referenced in `src/jev/client.rs`, `src/pipeline.rs`, `src/subprocess.rs`, `src/runtime.rs`; lockfile has no tokio, reqwest or hyper [Verified, High]; no source or test file references a lab runtime, so the replay part is not evidenced [Code-verified, Medium] |
| 14 | Explicit skill requests resolve locally before any provider call (README:76, 90) | **demonstrated** | `sr rank --offline --require-skill beta` on a 3-skill store: decision `explicit`, 0 requests, 0 HTTP attempts, 0 tokens, 39 ms [Executed, High] |
| 15 | One symlinked skill directory no longer empties the roster (fix for #4, maintainer comment 2026-09-23) | **demonstrated** | Replay of the #4 script at the pin: `eligible: 3` without the link, with it (and `symlinked-directory-skipped` disclosed), and after removal; exit 11 `cache-miss` each time, as expected offline [Executed, High]; regression tests `tests/rank_discovery_gaps.rs:176` and `:221` exist [Code-verified, High] |
| 16 | The contract matrix plus authority file is the coverage record the phase gates rely on (`scripts/validate_contract_matrix.py`) | **disproven at the pin** | Validator exits 1 `invalid contract matrix: boundary-coverage`; 93 matrix rows, 79 authority rows, 14 P4/P5 rows missing from authority [Executed, High]; first reported in #7 [External, High] |
| 17 | Recommendations fit the next step, i.e. the tool improves skill choice (README tagline and TL;DR) | **aspirational** (self-disavowed) | "The central claim is still unproven" (`docs/reality-check-bridge-plan.md:186-187`); G57-G60 relevance, harm, latency and rollout gates all `UNPROVEN` (`:588`); `sr-uv2v` (acquire the relevance corpus) open [Maintainer claim, High] |
| 18 | Exact response cache answers a repeated identical request with zero new usage for up to ten minutes (CHANGELOG, Added) | **partially demonstrated** | External cohort: 15 of 15 repeats hit the cache with zero provider requests, `elapsed_ms` p50 465 (#6) [External, Medium]; the analyst did not exercise the cache |

## 4.4 Architecture (reconstructed from the code)

**One package, one binary.** `skillranker` builds `sr` from `src/main.rs` over a library of 32 top-level modules declared in `src/lib.rs` [Code-verified, High]. Source: 91 `.rs` files, 59,515 lines, of which `src/transport.rs` (498 lines) is not declared in `lib.rs` and so is not compiled; the maintainer's tracker calls it "an orphaned, uncompilable duplicate of the endpoint parser" (`sr-x43d`, open) [Counted, High; Maintainer claim, High]. Largest files: `storage/ledger.rs` 6,423; `pipeline.rs` 5,324; `cli.rs` 4,665; `cache/coordination.rs` 1,900; `config.rs` 1,443 [Counted, High]. Subdirectories by file count: `context/` 18, `roster/` 13, `jev/` 8, `storage/` 8, `cache/` 5, `evaluation/` 5, `output/` 4, `privacy/` 4, `pipeline/` 2 [Counted, High].

**Tests outweigh source.** `tests/` holds 136 `.rs` files and 76,548 lines, 1.29 times the source [Counted, High]. `#[test]` attributes: 93 in `src/`, 1,301 in `tests/`, 1,394 total; 10 ignore markers, of which 5 are live paid Jev requests, 1 needs an installed cass 0.8.0, 2 are subprocess entry points invoked by other tests, and 2 are manual diagnostics [Counted, High]. Python tooling in `scripts/`: 6,125 lines (e2e runner, contract validators, their unit tests) [Counted, High]. Documentation: 65 files in `docs/`, 10,695 lines; 12,951 lines of Markdown in the tree [Counted, High].

**Data flow**, confirmed at the module level against the README diagram: exact session selection and context capture (`context/`) → roster discovery, visibility and per-name authority (`roster/`) → local explicit resolution or eligibility filtering (`eligibility.rs`) → Quill prefilter above 254 (`roster/retrieval.rs`) → exact cache check (`cache/`) → admission against network consent, deadline, attempt budget and cooldown (`jev/admission.rs`) → wide Choice then rerank (`jev/`) → scoring and abstention (`scoring.rs`) → JSON, table or hook envelope (`output/`) → bounded local ledger (`storage/`, rusqlite `=0.40.2` with bundled SQLite) [Code-verified, Medium: modules and entry points read, not every call edge traced].

**Dependency posture.** 286 packages in `Cargo.lock`: 277 from crates.io, 8 from git (5 in the asupersync family at `81fb7b5`, 3 from frankensearch at `39047c4`) [Counted, High]. TLS comes through asupersync's `tls-native-roots` (rustls and ring present; openssl absent) [Verified, High]. The `[patch.crates-io]` block exists so that "Quill's Cx and our Cx must come from exactly the same package source" (`Cargo.toml:35-37`) [Code-verified, High].

**Unsafe distribution:** zero blocks, zero `unsafe fn` [Counted, High].

**Asupersync:** a runtime dependency, not dev-only and not merely pinned: the Jev HTTPS client, pipeline deadlines, subprocess execution and the runtime wrapper all call it [Code-verified, High].

## 4.5 Benchmark and conformance audit

**Maintainer-produced numbers.**

| Number (source) | Methodology doc | Controls | Would it survive a rerun? |
|---|---|---|---|
| RCH full suite 1,374 passed / 0 failed / 10 ignored at `9c19470`; 1,367/0/10 at `54eecc7`; 1,365/0/10 at `b3e7387` (shadow deployment doc, 2026-09-24) | Named revision and gate list | Private fleet, no public log | Unknown. The analyst could not reproduce a suite verdict (below). The 1,394 `#[test]` attributes at the pin are consistent in scale [Counted, High] |
| Native macOS `cargo test`: 1,001 passed, 0 failed, 10 ignored (issue #3 comment, 2026-09-20) | Revision named (`c01d4ac` plus one file) | Maintainer host only | Not re-run |
| Live smoke: 2 attempts, 21,275 tokens, 1,475 ms at load about 130 (reality-check doc, 2026-09-22) | One run | None | Single observation; not a latency result |
| Hook smoke: 2.6 s against a 4 s hook timeout, 18,109 input and 2,504 output tokens (shadow doc, 2026-09-23) | One run | `env -i`, isolated ledger | Single observation |
| Performance targets (README:1852-1856) | None | None | Disavowed by the README itself: "not ... measured benchmark results" |

No quality number exists. The README does not cite TypeSafe's cookbook success rates, and `AGENTS.md:599` forbids borrowing them [Maintainer claim, High].

**Independent of the maintainer (not independent of this program).**

| Number (source) | Scope | Status |
|---|---|---|
| 35 of 247 cold `sr rank` invocations fell back on `timeout` (14.2%) at the 3,000 ms default; p50 2.17 s, p95 2.90 s process wall; 22 of the 35 timed out during pre-publication roster revalidation after both Jev calls had completed; 35 of 35 succeeded at `--timeout-ms 10000` (#6, filed 2026-09-24 by `JYeswak`) | `d7e0c94`, Apple M3 Ultra, macOS 26, 552-skill roster, Jev 1.13.0, 2026-09-24 04:05-04:17 UTC, one call at a time | [External, Medium]. Short of the G59 size (247 of 500). The maintainer had not answered at the pin |
| Mean 19,181 input and 2,838 output tokens per cold call; 5,438,776 tokens total (#6) | Same cohort | [External, Medium] |

At TypeSafe's published list price of $0.042 per million input tokens with free output [External, Medium, vendor claim], one cold call of that size costs about $0.0008 [Inference, Medium]. Reproduction of any live number needs a TypeSafe account and key.

**Analyst execution at the pin (2026-09-25 UTC, Mac Studio M3 Ultra, Darwin 25.5.0).**

| What | Result |
|---|---|
| `python3.14 scripts/validate_contract_matrix.py` | exit 1, `invalid contract matrix: boundary-coverage`; 93 matrix rows vs 79 authority rows; the 14 extra rows are all P4/P5 [Executed, High] |
| `python3.14 scripts/validate_public_contracts.py` | exit 0, `"scope": "documentation_consistency_only"`, `"examples_executed": false` [Executed, High] |
| `python3.14 -m unittest discover -s scripts -p 'test_*.py'` (resolved `TMPDIR`) | 113 tests, 3 failures: `test_checked_in_matrix_and_fail_closed_cli` and `test_future_phases_must_be_planned` (matrix drift), `test_receipt_gate_requires_real_matching_complete_reports` (macOS `/usr/bin/python3` is 3.9; the script needs 3.10, the environmental cause described in #7) [Executed, High] |
| `rch exec -- cargo test --locked -j 2 --no-fail-fast`, worker contabo-4 | Remote command finished: exit=101 after 518 s. Compile errors in `tests/transport_failures.rs`: `tests/fixtures/jev-tls/ca.pem`, `server.pem`, `server.key` missing on the worker. The files are tracked in git; this fleet's RCH sync configuration excludes `*.pem` and `*.key`. A fleet artifact, not a repository defect [Executed, High] |
| Same, restricted to the 128 test targets that do not embed those fixtures plus `--lib --bins` (7 targets excluded: `jev_retry`, `jev_transport`, `ledger_attempt_recording`, `rank_acceptance`, `real_rank_coordination`, `save_case_contract`, `transport_failures`) | Two attempts, on contabo-4 and contabo-2, each ended with `ld terminated with signal 7 [Bus error]` while linking test binaries; contabo-2 fell from 25.8 GB to 0.46 GB free during the run. No test verdict. **Not run** (fleet disk) [Executed, High for the failure; the suite verdict is unknown] |
| `rch exec -- cargo build --release --locked` for `aarch64-apple-darwin` (worker contabo-3, zig linker, `CC_aarch64_apple_darwin` set to the same wrapper) | Remote command finished: exit=0 in 1,380 s; artifact `Mach-O 64-bit executable arm64`, 18,047,328 bytes, SHA-256 `5f7cc2ee4147ae2703508d21ce3497d6d4335229347dde733d6b90112cb9e92d`. A first attempt without the `CC` setting failed in `ring`'s C build; that is a fleet recipe gap, not a repository defect [Executed, High] |
| 22 invocations of that binary in an isolated `HOME` under `env -i`, no key, no network consent | `--version` → `sr 0.1.0`; `capabilities --json` → 16 implemented, 5 planned, 3 planned flags; `demo --case useful/none/explicit/unavailable` → exit 0, `actionable: false`, `evidence_origin: synthetic`; the 5 planned commands and 2 planned flags → exit 2 naming the phase; `hook claude` with empty stdin → exit 0, 0 bytes stdout; `doctor --json` → credential `absent`, `verified: false`; issue #4 replay → `eligible: 3` in all three arms; explicit request → 0 requests; dry-run redaction probe → both planted secret values absent [Executed, High] |

The Rust suite verdict at the pin is therefore unknown to this packet. The macOS build claim in #3's closing comment is corroborated for a release build at a later revision [Executed, High].

## 4.6 Comparison: who owns the lane

**The incumbent is the harness itself.** In Claude Code, each skill's `description` "helps Claude decide when to load the skill automatically", and a skill's body "loads only when it's used" [External, High; Claude Code skills documentation, read 2026-09-25]. The agent model already performs skill selection inside the turn, at no extra service, and it sees symlinked skill folders, which Claude Code reads from their targets [External, High]. skillranker's discovery never descends symlinked directories and, since the #4 fix, withholds each name it cannot prove per name [Maintainer claim, High]; in #6's 599-directory store, 49 were reported `symlinked-directory-skipped` [External, Medium]. So `sr` can decline to suggest skills the harness would load [Inference, Medium]. The incumbent wins today because it is built in, needs no second vendor, and its selection quality is what users already accept; nobody has shown `sr` does better.

**Adjacent Jev-based work.** TypeSafe's own skill-suggestion cookbook ranks 182 skills with two Jev requests and may suggest none; skillranker's README says it "builds on" that recipe (README:105) [Maintainer claim, High; External, Medium]. Other Jev skill routers exist: `GodsBoy/jev-agent-skill-router` (Python, 17 stars, created 2026-09-16, one push) and `kitze/skillbox` (TypeScript, 237 stars, created 2026-09-17) [API-observed, High]. The maintainer's own `meta_skill` (197 stars) is prior art for redaction code, credited in `THIRD_PARTY_NOTICES.md` [Code-verified, High].

**Unoccupied lane (defended as inference).** A local, harness-aware pre-turn selector that respects the harness's actual visibility rules, resolves explicit user requests without any model call, abstains quietly, bounds cost per invocation, and keeps a local ledger separating adoption from judged usefulness. None of the Jev routers listed above describes visibility resolution or an outcome ledger in its summary line [Inference, Low: summaries read, code not read].

## 4.7 Technical merit and adversarial review

**Strengths.**
1. *Runtime honesty that can be tested.* Planned work is refused with its phase; demos are marked non-actionable and synthetic; missing usage is recorded as unknown rather than zero; a failed hook exits 0 with nothing on stdout [Executed, High]. The CHANGELOG names real defects plainly, for example "Before this fix every rank used the 3,000 ms default, whatever was configured" and a 1e-4 probability bound that "rejected every such answer, so live ranking of large rosters failed" [Maintainer claim, High].
2. *Local authority before any model call.* Explicit requests resolve with zero requests; exclusions reach every path (CHANGELOG, Fixed); roster visibility is resolved per name [Executed, High for explicit resolution; Maintainer claim, Medium for exclusions].
3. *Responsiveness to outside reports.* #1 (README examples), #3 (macOS build) and #4 (symlink blackout) were each answered with a fix, a named regression test or both within 1 to 3 days; #4's fix replays correctly at the pin [Executed, High; API-observed, High for dates].
4. *Clean dependency posture.* No unsafe; one runtime (asupersync) with no Tokio; bundled SQLite with an explicit engine-version qualification (`src/sqlite_engine.rs`) [Verified, High].

**Weaknesses.**
1. *Single paid vendor at the core.* Without `TYPESAFE_API_KEY` and network consent, `sr` can only resolve explicit requests or replay cached answers. Jev entered early access on 2026-09-15; the first commit here is 2026-09-17 [External, High; Git-observed, High]. Model aliases move (`jev-latest` returned 1.13.0 in #6), which the cache design acknowledges.
2. *Usefulness unmeasured.* No relevance corpus, no paired harm cohort, no representative operational cohort from the maintainer; the maintainer's own summary: "the self-hosted deployment has so far only proven that it can fail quietly" (`docs/reality-check-bridge-plan.md:174-176`) [Maintainer claim, High].
3. *README drift by policy.* `AGENTS.md:59-63`: "Keep README in the finished-product voice Jeffrey requested. Do not add a design-stage banner." The README lists 5 planned commands and 2 planned flags as runnable, claims both "Linux or macOS" and "Linux" as the supported platform, describes a release-selecting installer with no releases, names FrankenPandas for work its code does not contain, and credits asupersync with "deterministic lab replay" that no file references [Code-verified, High]. The capability registry is accurate; the README is not.
4. *Governance record drifting at the pin.* The contract matrix fails its own validator and the pre-push gate does not run it; an orphan source file sits in `src/`; one context test is flaky under load (`sr-bytg`, filed at the pin); there is no CI by policy [Executed, High; Maintainer claim, High].
5. *Latency margin is thin at the default deadline.* The only cohort (external, 247 calls, 552 skills) fell back 14.2% at 3,000 ms, mostly after both paid calls completed, so the fallback cost tokens as well [External, Medium].

**Bear-case steelman.** skillranker does not matter because the problem it solves is being absorbed by the harness. Claude Code already chooses skills from their descriptions inside the turn, sees symlinked skills `sr` refuses to see, costs nothing extra, and improves with every model release. skillranker adds a second paid vendor in early access, a second disclosure of session content, and a 3-second pre-turn delay that falls back one time in seven on a large roster, all to produce a suggestion whose value no one has measured. Its license bars Anthropic, the company that ships the only harness it supports, from even testing it. Eight days of 100-commit velocity produced careful plumbing around an unproven premise, and when the premise gets tested the likeliest result is that the agent's own choice was about as good.

## 4.8 License and governance

**License text, read verbatim** (73 lines). First line: `MIT License (with OpenAI/Anthropic Rider)` [License-verified, High]. It carries the rider. Exact scope, quoted: *"Restricted Parties" means OpenAI, L.L.C.; Anthropic, PBC; any of their respective Affiliates; and any person or entity acting directly or indirectly on behalf of, for the benefit of, or under the direction of any of the foregoing (including any officer, director, employee, contractor, agent, consultant, service provider, or representative).* *Notwithstanding any other provision of this License, no rights are granted to any Restricted Party.* *For purposes of this rider, "use" includes, without limitation: copying, modifying, merging, publishing, distributing, sublicensing, selling, transferring, making available, hosting, deploying, executing, benchmarking, testing, analyzing, indexing, or incorporating the Software or any Derivative Works into any dataset, training corpus, evaluation harness, or pipeline for machine learning or other automated systems.* The rider also forbids providing the software to a Restricted Party, terminates the license on breach, and must be distributed unmodified.

What it bars: OpenAI, Anthropic, their affiliates, and anyone acting for them; and it names ML training and evaluation use (datasets, training corpora, evaluation harnesses, ML pipelines) within its definition of use. What it does not bar: people who use those labs' models, including users of Claude Code. **OSI status: not OSI-approved**; the README says so ("this is not unmodified MIT", identifier `LicenseRef-MIT-OpenAI-Anthropic-Rider`) [License-verified, High].

**Bus factor: 1.** Authors on 848 commits: `Dicklesworthstone` 826, `Jeff Emanuel` 20, `CopperWren` 2 [Git-observed, High]. 234 commits carry a `Co-Authored-By:` trailer naming a Claude model (149 "Claude Opus 5 (1M context)", 76 "Claude Opus 5.5 (1M context)", 9 "Claude") [Git-observed, High]. Deployment receipts are signed by agent handles (AzureJaguar, FuchsiaCave, MagentaSquirrel) [Maintainer claim, High].

**Contribution policy:** outside contributions are refused ("I do not accept outside contributions for any of my projects ... I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them"; README:2022) [Maintainer claim, High]. 0 pull requests to date [API-observed, High].

**Velocity versus review depth.** 848 commits in 8 days: 151, 114, 206, 148, 103, 53, 25, 48 per day from 2026-09-17 to 2026-09-24 [Git-observed, High]. `scripts/prepush_gates.sh` opens by recording that in one day `main` was pushed red on compilation, twice on `cargo fmt --check` and once on clippy, and that "four of five gates plus a green claim looks exactly like five of five" [Maintainer claim, High]. Review happens through agents and private gates, not public CI.

## 4.9 NODUS factsheet

| Criterion | Score | Justification |
|---|---|---|
| Technology readiness | **TRL 5** | Full pipeline runs live on real sessions (maintainer smoke; 247-call external cohort); no quality, harm or operational qualification; P4 still open |
| Strategic relevance | **3/5** | Skill libraries of several hundred entries are real (552 eligible in #6), but the harness vendor already does in-turn selection |
| Impact potential | **2/5** | Advisory, one qualified harness, one vendor, and an unmeasured effect on outcomes |
| Implementation feasibility | **3/5** | The code exists and runs; what remains is data (relevance labels, cohorts) and a release, plus the single-vendor dependency |
| Time to mainstream | **2/5** | No release; provider in early access; P7 rollout gates open |
| Collaboration potential | **2/5** | Refuses merges and bars two labs, but acts on outside bug reports within days with regression tests |

**Ring: Explore-with-a-ceiling.** Pilot requires a release artifact plus a bounded real workload fit; there is no release (R1) and no quality evidence. The ring stands on technical merit as substantive but unproven; the rider caps mainstream adoption regardless, and the single-vendor inference dependency is a second ceiling [Inference, Medium].

**Cohort matrix row (same columns as synthesis/00-overview.md):** skillranker · TRL 5 · Explore · Rider · bus 1 · no-contrib yes · CI **C6** (no GitHub workflows by policy; gates run on the maintainer's RCH fleet; unobservable) · Release **R1** · third-party validation: none for quality; one operational cohort by the assessing organisation · analyst behavioral repro: **partial** (22 binary invocations and 113 Python tests; Rust suite not run).

## 4.10 Wardley placement

- **Commodity:** the Claude Code hook protocol (`UserPromptSubmit`), the `SKILL.md` format of the Agent Skills standard, SQLite, TLS. `sr` consumes these unchanged. Movement: only the harness vendor moves them.
- **Product, rented:** Jev inference, the decision engine at the centre, bought per token from one vendor. Movement: a second provider route (issues #2, #5) would turn this into a replaceable input.
- **Custom-built:** session identity and transcript overlay, per-name roster authority, redaction and disclosure receipts, exact cache and single-flight, admission and retry budgets, the local ledger. Movement: a release and a second harness adapter (Codex, omp/pi and Grok are deferred in Beads) would move these toward product.
- **Genesis:** the evaluation and promotion apparatus (design-weighted loss, one-sided harm bound, sampling manifests with recorded selection probabilities) and the phase-aware capability registry. Movement: the first labelled relevance report would move the evaluation apparatus to custom.

## 4.11 Trajectory (12 / 24 / 60 months) [Inference]

**Base case.** Development slows from its launch-week pace; the maintainer closes P4 and P5, cuts a DSR release, and runs the shadow hook on his own repositories. The tool becomes a well-built, lightly used adjunct for people who already pay for Jev and keep hundreds of skills. The README keeps describing the target state.

**Upside.** A labelled relevance set shows Jev-reranked picks beating both Quill-only and the agent's own choice on held-out session moments, and a G59 cohort meets 5% fallback. Then `sr` has the first measured evidence in the Jev skill-routing space, and a second provider route removes the vendor ceiling.

**Decay.** Jev's API or pricing changes during early access; Claude Code improves in-turn skill selection; the matrix drift and the orphan file accumulate; the evaluation apparatus never receives its labelled input. At 60 months the surviving artifact is the pattern (phase-aware capability registry, adoption kept apart from usefulness), not the tool.

**Revisit triggers:** (1) first tagged release or GitHub release artifact; (2) a committed relevance report on an independently labelled set; (3) a maintainer G59 cohort of at least 500 invocations; (4) a second decision provider (OpenRouter route or local model) behind the same contract; (5) the contract matrix passing its validator with the validator in the pre-push gate; (6) public CI or published gate logs; (7) a second maintainer or a change in contribution policy.

## 4.12 Limitations and open questions

**Not done.** (1) No Rust test verdict at the pin: the full `cargo test` did not compile on this fleet because RCH does not sync `*.pem`/`*.key`, and the 128-target run twice died at link time with a Bus error when worker disk ran out. (2) No live Jev request, so no ranking, latency or cost number of my own. (3) No real Claude Code session with the hook installed. (4) No clippy, fmt or `ubs`. (5) The cache, ledger, replay, stats, feedback and eval commands were not exercised. (6) Linux was not tested; the binary tested was a macOS arm64 cross-build. (7) The later HEAD `9ac6b1f` was not read. (8) Only parts of the 1,367-line plan and the 2,024-line reality-check document were read. (9) The FrankenPandas finding rests on searching `src/` for the name and for "adapted from" markers, not on reading every evaluation file. (10) An external write-up at `mortaf3.com/posts/skillranker-txg33` failed TLS name validation and was not read. (11) Search recall for independent coverage of a nine-day-old repository is thin; `awesome-jev` and `shipwithjev.com` list it without review.

**Open questions that would most change the verdict.** (1) Does `cargo test --locked` pass at the pin on a worker with the fixtures and enough disk? (2) On a labelled set, does the Jev rerank beat Quill-only and the agent's own choice? (3) What fallback rate does the maintainer's own hook traffic show at 3,000 ms? (4) Will the 14 unreviewed matrix rows be reviewed in or held out? (5) Is there any arrangement between the maintainer and TypeSafe? No evidence of one was found; the README's emphasis on the vendor is noted, not interpreted.

---

## The eight deepening questions

1. **Provenance.** Each decision records the requested and returned model identity, stage cache provenance, attempts, known tokens and unknown-usage attempts; dry runs and `--explain` carry a field-level disclosure receipt; deployment receipts in `docs/self-host-shadow-deployment.md` name the binary's SHA-256 and source revision [Code-verified, High; Maintainer claim, High]. None of it is signed or exported in a portable format; the ledger is a local SQLite file. Portability would need signed decision records binding source revision, policy fingerprint (already computed by `sr doctor`) and returned model version.

2. **The embeddable unit.** The Jev Choice and Noul codec (`src/jev/codec`, bounded JSON with duplicate-key rejection), the Claude transcript overlay and branch resolver in `context/`, and the redaction module adapted from `meta_skill` are each separable. Cost of adoption: no crates.io package (`publish = false`), a pinned nightly toolchain, git dependencies, and the rider.

3. **Unexercised option value.** The evaluation stack is built and waiting for labels; the normalized-context input could serve any harness today; the attempt allowance and circuit machinery (planned for P6) would generalise to any metered API; a TUI feature flag is reserved. The first labelled corpus unlocks the most.

4. **Benchmark honesty.** No maintainer number is presented as a benchmark; the README disavows its own targets. The numbers that are load-bearing for the thesis (relevance, harm) do not exist. The only operational number is external and shows 14.2% fallback at the default deadline on a 552-skill roster. Maintainer test counts (1,374 passed at `9c19470`) would need a fleet that syncs the TLS fixtures to rerun.

5. **The governance path.** One maintainer with an agent swarm, no outside merges, private gates, DSR-only release. If velocity decays, the first things to break are the vendor contract (alias and API changes during early access) and the checked-in governance records, which are already drifting (matrix, orphan file). A credible path runs through public gate logs, a release, and a second maintainer or provider.

6. **The license as strategy.** The rider excludes OpenAI, Anthropic, their affiliates and anyone acting for them, and names benchmarking, testing and evaluation-harness use. The only harness `sr` supports is Anthropic's Claude Code, so Anthropic cannot test the tool against its own product; Claude Code users are not barred. The same repository records 234 commits co-authored by Claude models. The exclusion does not touch TypeSafe, the vendor the tool depends on.

7. **Agent-era fit.** A developer on Claude Code with several hundred skills who already pays for Jev and wants a cheap, auditable pre-turn suggestion with a quiet failure mode. For that user to pick `sr` over the harness's own selection: a release, measured relevance above the agent's own choice, fallback under 5% at the default deadline, and visibility of symlinked skills matching the harness.

8. **The kill test.** A blinded paired comparison on the same session moments: the agent's own skill choice against `sr`'s advisory suggestion, judged by someone who is not the evaluated agent. If `sr` does not improve outcomes or reduce wrong-skill loads, the thesis fails. A cheaper version: on a labelled set, Jev-reranked picks against Quill-only top-1; a tie means the paid dependency adds nothing.

## Cross-cutting lenses

- **Decoupling.** Skill selection is moved out of the frontier model's context into a small typed decision model; authority (what the harness can load, what the user asked for) is kept apart from preference (what the model scores) [Code-verified, Medium].
- **Methodology export.** Three pieces survive the product: the capability registry that refuses planned work by phase from the same table it publishes; the shadow-deployment pre-registration with a declared population and receipts; and the rule that adoption (a load) is not usefulness (a judged label). The contract matrix is a fourth, but it fails its own validator at the pin.
- **Asupersync.** Verified runtime dependency: `=0.5.0` patched to git rev `81fb7b5` so Quill and `sr` share one `Cx`; used for the HTTPS client, deadlines, subprocesses and the runtime wrapper. The "deterministic lab replay" role is not evidenced in source or tests [Code-verified, High / Medium].
- **Rider.** Quoted in §4.8. It bars the maker of the only supported harness from testing the tool and leaves the inference vendor untouched.

## Packet changelog

- v1, 2026-09-25 UTC: first packet at pin `556f17af`, written for the 2026-09 cohort; pending review by a different model family.
