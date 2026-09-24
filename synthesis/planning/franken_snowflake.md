# franken_snowflake — Planning Methodology Reverse-Engineering

**Repo:** `https://github.com/Dicklesworthstone/franken_snowflake` · cloned 2026-09-22, pinned at `b61e3df3bd92a143f5c7bed1ba9d9b63054cb7fd`
**Analyst tier key:** [Verified] = read in a repo file · [Maintainer claim] = his prose, quoted · [Inference] = derived · [Absent] = searched, not found

## TL;DR

franken_snowflake's planning is **proof-gate-first and honesty-engineered**: a 1,303-line design plan, an 8-lane proof-lanes doc, a Beads task DAG of 128 issues, and a release checklist all written *before* (Phase 0: "No connector code") and all enforced as build/CI gates. The distinctive mechanic is **receipt-bound, provenance-stamped evidence** — every query emits a BLAKE3 content-addressed receipt, every golden is byte-compared, live proof is opt-in with typed skips, and *uncertain knowledge is refused, not guessed*: when Snowflake's docs are ambiguous on timestamp units, the plan pins an empirically captured live golden and a negative-timestamp codec bug is deliberately left open until that golden lands. Anti-reward-hacking culture is explicit but **lives outside the repo** in suite-wide `/data/projects/AGENTS.md`, referenced by a "RULE 0.5" pointer.

---

## 1. Artifact inventory

| Path | Role | Summary |
|---|---|---|
| `docs/planning/COMPREHENSIVE_PLAN_FOR_FRANKEN_SNOWFLAKE.md` (1303 lines, dated 2026-06-24) | Master design plan | [Verified] Protocol facts, non-goals, crate map, Asupersync contract, 8 implementation phases, MVP definition; Phase 0 explicitly "No connector code" |
| `docs/planning/COMPREHENSIVE_BACKGROUND_RESEARCH_FOR_CREATING_THE_FSNOW_CC_SKILL.md` (206 lines, dated 2026-06-29) | Pre-build research for an agent skill | [Verified] CLI reference, config schema, usage patterns, anti-patterns; declares `.claude/skills/fsnow/*` artifacts as created — **absent from repo** (see §7) |
| `AGENTS.md` (312 lines) | Agent operating instructions + suite-rule pointer | [Verified] RULE 0.5 imports suite-wide anti-reward-hack rules by reference; project direction, dependency policy, Beads workflow, bv triage sidecar, session/commit protocol |
| `.beads/issues.jsonl` (128 issues; `.beads/metadata.json`, `config.yaml`, `.manifest.json`) | Task DAG source of truth | [Verified] 125 closed / 2 in_progress / 1 open; types task/bug/feature/chore/docs/epic; `dependencies` edges (`blocks`), manifest lists 18 root issue ids; export stamped 2026-06-24 |
| `docs/proof_lanes.md` (230 lines) | 9 proof lanes as CI gates | [Verified] No-account goldens, DPOR races, mock integration, secret-safety, surface goldens, dependency gates, cross-platform, live opt-in, scripted driver lanes |
| `docs/live_proof.md` (150 lines) | Live-proof lane mechanics | [Verified] Opt-in env contract, 6 covered lanes, typed skip semantics, spawned-CLI env sanitization rules |
| `docs/write_intent_ladder.md` (160 lines) | Deferred mutation ladder contract | [Verified] Read-only default, 8 rungs, status 2026-09-03: executor landed behind gates; "where it conflicts with the README, the README and the code govern" |
| `docs/RELEASE.md` | Release readiness checklist | [Verified] Required local proof commands, dsr cross-platform proof, six-target cross-compile table; admits a dead GitHub Actions workflow whose "CI proof" wording is unbacked |
| `docs/protocol/README.md` + `schema_draft.md` | Protocol golden storefront | [Verified] Placeholder scaffold; contents owned by specific bead ids (`fsnow-sqlapi-protocol-schemas-kx6`, `...-w0i.13`) |
| `docs/agent_cli_contract.md`, `docs/dataset_manifest_contract.md`, `docs/downstream_integration_contract.md`, `docs/cache_repository_design.md`, `docs/catalog_graph_design.md`, `docs/text_indexing_frankensearch_design.md`, `docs/transport_design.md`, `docs/dependency_admissibility.md`, `docs/security_model.md`, `docs/asupersync_leverage.md` | Per-domain design contracts | [Verified] Each pins one surface's contract; `dataset_manifest_contract.md` notes "implementation beads remain blocked deeper in the DAG" |
| `scripts/check-dependency-admissibility.py`, `check-asupersync-single-version.sh`, `check-feature-lanes.sh`, `check-golden-lf.py`, `live-proof.sh`, `live-proof-cli.sh`, `capture-jsonv2-golden.sh` | Gate scripts (executable policy) | [Verified] The gates are code, not prose; the admissibility script self-tests by injecting known-bad dep paths |

## 2. Execution-readiness gates (what a plan must pass before agents are set free)

The plan defines sequencing explicitly, and Phase 0 is scaffold-only: *"Create AGENTS.md, README.md, this plan, the Asupersync leverage doc, Beads graph, `rust-toolchain.toml`, the `[patch.crates-io]` unification block, `deny.toml`, and the single-asupersync-version CI gate. **No connector code.**"* [Maintainer claim, `COMPREHENSIVE_PLAN_FOR_FRANKEN_SNOWFLAKE.md`, "Phase 0"]

Verbatim gate quotes:

- **Provenance gate:** *"Do not silently fall back from live Snowflake to fixtures. Provenance is stamped and a fixture must never be mistakable for a live result."* [Maintainer claim, master plan "Non-Goals"]
- **Live-proof honesty:** *"Missing credentials are not a pass-by-omission: the test writes a structured `franken_snowflake.live_gate.v1` skip event with the missing env handle names."* [Maintainer claim, `docs/live_proof.md`]
- **Fixture≠live:** *"If a live command succeeds with fixture provenance, it is not live proof."* [Maintainer claim, `docs/planning/COMPREHENSIVE_BACKGROUND_RESEARCH...`, "Real-World Usage Patterns"]
- **No silent pass, ever:** *"A live test that is missing credentials should emit a typed skip/refusal, not silently pass."* [Maintainer claim, `AGENTS.md`, "Testing Expectations"]
- **Release evidence venue:** *"This repository never uses GitHub Actions. Do not add `.github/workflows`. Cross-platform builds, tests, and releases run through `dsr` (see `docs/RELEASE.md`); **cite `dsr` output, never an Actions run, as proof.**"* [Maintainer claim, `AGENTS.md`]
- **Admission of unbacked claims:** *"History: a GitHub Actions workflow existed until 2026-09-03 and never executed a single job… It was removed; **any 'CI proof' wording older than this note is unbacked.**"* [Maintainer claim, `docs/RELEASE.md`]
- **Admission of proof limits:** *"The Windows binary above was produced, not executed: no Windows machine or emulator was available in this session, so for that row 'builds' means the linker produced the executable, not that `capabilities` was run on it."* [Maintainer claim, `docs/RELEASE.md`]
- **Candidate-dependency rule:** *"Every non-`asupersync` dependency is a candidate until a per-crate `cargo tree` proof shows no forbidden crate in the production feature graph it contributes."* and *"Dependency admissibility is **proven, not assumed**."* [Maintainer claim, `AGENTS.md` / master plan]
- **Dependency forbidden list:** production crates must not pull *"Tokio, reqwest, hyper, axum, tower, sqlx, diesel, sea-orm, or third-party Rust Snowflake drivers"* — enforced per feature lane, each dev/test feature scanned in its own lane (`--edges all`). [Verified, `AGENTS.md` + `docs/proof_lanes.md` Lane 6]
- **Credential-leak compile gate:** *"a compile-time gate … fails the build if any `#[derive(Debug)]` struct has a credential-shaped field (`*_api_key`, `*_password`, `*_private_key`, `*_token`, …) without a hand-rolled redacting `Debug`"* [Maintainer claim, master plan "Security Model"]
- **Anti-drift redactor:** *"one composable redactor sourcing its needle list from a single shared constant so the redactor and the last-mile output scanner cannot drift"* [Maintainer claim, master plan "Security Model"]
- **Append-only audit:** *"The query audit log is append-only, enforced by a build-failing test that forbids any UPDATE/DELETE against it."* [Maintainer claim, master plan "Reliability Strategy"]
- **MVP definition** (a checklist, not a vibe): no-account testkit green incl. DPOR races, both dependency gates green, PAT + key-pair JWT crypto implemented and redaction-tested, submit/poll/cancel as cancel-correct bracket, gzip partition streaming, seven CLI surfaces with `--toon`, provenance stamped and `--require-live` honored, MCP read verbs served. [Verified, master plan "MVP Definition"]

## 3. Honesty guardrails (negative-evidence / claim-matrix / demotion)

- **No named negative-evidence ledger or claim matrix exists** [Absent — searched docs/, README, CHANGELOG for "negative evidence", "claim matrix", "ledger", "auto-demot", "demotion"; only "ledger" hits are the audit/error ledgers in `write_intent_ladder.md`, `proof_lanes.md`, plan, `dependency_admissibility.md`]. What exists instead is a cluster of receipt-bound, provenance-stamped mechanisms:
  - **Receipt-bound evidence:** every query ends with a content-addressed (BLAKE3) receipt — request fingerprint, normalized SQL hash, profile hash *without secrets*, statement handle, partition hashes, rows, bytes, cost vector, `OutcomeKind`, redaction markers; *"Receipts … never contain secret values."* [Maintainer claim, master plan]
  - **Uncertain knowledge refused, not patched:** Snowflake docs are internally inconsistent on timestamp units → the codec must be *"pinned with an empirically captured live golden"*; the open bead `fsnow-native-snowflake-connector-w0i.13` ("Capture empirical jsonv2 result-encoding live golden") is the blocker. A negative-timestamp decode bug (bead `…-aq2`, closed) was **deliberately left unfixed inline**: *"NOT fixed inline because the exact Snowflake negative encoding is uncertain and is pinned by the empirical live golden in …w0i.13; fix together with that golden so the test asserts real wire behavior, not an assumed convention."* [Verified, bead description]
  - **Typed-skip semantics:** live tests emit `franken_snowflake.live_gate.v1` skip events with missing env names; nothing silently passes. [Verified]
  - **Canary-secret guards:** *"plant fake-but-detectable secrets in fixtures, scan all stdout / stderr / receipts / logs / exports for secret shapes; any leak fails the build."* [Maintainer claim, `docs/proof_lanes.md`]
  - **Golden integrity:** goldens compared as raw bytes, `eol=lf` enforced, CI check that no golden contains `\r`, `FSNOW_UPDATE_GOLDENS=1` bless flow is explicit. [Verified]
  - **Evidence hierarchy note:** *"When Snowflake behavior is uncertain, check official Snowflake documentation first. Record the exact documentation URL and the date consulted in the relevant plan, test fixture, or Beads comment."* [Maintainer claim, `AGENTS.md` "External Documentation"]
  - **Lifecycle:** most installed at plan time (docs dated 2026-06-24/25); the empirical-golden loop, DPOR oracles-as-CI-gates (not just exploration), and per-feature-lane scanning were hardened later (Sep 2026 beads: `…-feature-lane-lint-gate-7kt`, `cancel-RAISES-the-exchange (2026-09-04)`). [Verified via bead titles/dates]

## 4. Plan→agent execution (task graphs, phases, verification loops, drift prevention)

- **Beads DAG:** 128 issues in `.beads/issues.jsonl`; statuses 125 closed / 2 in_progress / 1 open; 54 issues carry `dependencies` edges (`blocks` type); `.beads/.manifest.json` (export 2026-06-24) names 18 root issues (`fsnow-*` prefixed) with `"policy": "strict"`. Schema per issue: id, title, description, status, priority (0–4), issue_type, timestamps, close_reason, labels, dependencies. No standalone "definition of done" field per issue; acceptance lives in description prose (e.g., live-proof bead: *"Acceptance: scripts and docs make live proof repeatable once a Snowflake account exists"*). [Verified]
- **Phases:** Plan Phases 0–7 (scaffold → protocol → auth → transport/testkit → CLI/MCP → catalog → frame/export/cache/TUI → live trial hardening), mapped to bead DAG depth ("implementation beads remain blocked deeper in the DAG"). [Verified]
- **bv triage sidecar:** `AGENTS.md` instructs agents to use `bv --robot-triage` as the single entry point, `--robot-*` flags only ("bare `bv` launches an interactive TUI that blocks your session"), and `br` for mutations. [Verified]
- **Work-graph discipline** (via RULE 0.5 pointer to suite-wide `/data/projects/AGENTS.md`): *"JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty."* [Maintainer claim, quoted in repo `AGENTS.md`]
- **Session/commit protocol:** `git status → git add → br sync --flush-only → git commit → git push` at session end; all work on `main`, no feature branches/worktrees; *"Never delete files without explicit written user permission."* [Verified, `AGENTS.md`]
- **Drift prevention:** single shared redactor constant; CLI/MCP parity test (*"the same logical operation yields the same envelope, error code, receipt, and safety class through both surfaces"*); agent-handbook embedded in binary; `capabilities --json` as self-describing command registry. [Verified]
- **Verification loops:** DPOR cancel/retry race suite asserted by obligation-leak and quiescence oracles **as CI gates**; failed runs emit Asupersync crashpacks with replay commands stamped into receipts; deterministic injected clock + fixed seeds; per-step JSON-line test logs to per-run artifact dirs. [Verified, `docs/proof_lanes.md`]
- **Dialectical two-model review:** [Absent] — no mention of two models grading each other anywhere in repo docs. **Session-compaction policy:** [Absent] — no "never compact" statements found in-repo.

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

- **Mechanism:** primary-source-first, recorded inline. The master plan's "Snowflake Facts That Shape The Design" lists **official docs consulted on 2026-06-24** with 14 verbatim URLs (SQL API index/reference/auth/handling-responses, PATs, key-pair auth, drivers, information schema, trial accounts, COPY INTO, query tag, time travel, RESULT_SCAN). [Verified]
- **Standing instruction:** *"check official Snowflake documentation first. Record the exact documentation URL and the date consulted in the relevant plan, test fixture, or Beads comment."* [Maintainer claim, `AGENTS.md`]
- **Competitor handling:** *"Third-party Snowflake Rust crates may be studied as read-only inspiration, but they must not be vendored, copied, or added as production dependencies. The authoritative behavioral sources are Snowflake's official documentation, live protocol observations, and our own conformance fixtures."* [Maintainer claim, `AGENTS.md` "Dependency Policy"]
- **No formal research/ dir, literature-review artifact, competitor matrix, or ADRs.** [Absent — searched for `research/` dir, `ADR*`, competitor matrices; the planning dir holds only the two comprehensive docs above]

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

- **Named reward-hacking taxonomy:** RULE 0.5 points at 12 named forbidden patterns *"several already observed in this suite"*: *"gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding."* The three "most often decide whether a number here is real": *"a self-speedup is MAINTENANCE, not a win — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits; and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."* [Maintainer claim, repo `AGENTS.md`, content hosted in external `/data/projects/AGENTS.md`]
- **Planted negatives:** gate scripts ship self-tests that inject known-bad paths — the admissibility script *"injects the known-bad `fp-io → orc-rust → tokio` path, a third-party Snowflake package, and duplicate Franken runtime versions, then asserts the gate catches them"*; the feature-lane gate bead demanded *"an assert!(false) in a feature-gated test must fail the gate."* [Verified, `docs/proof_lanes.md` + bead `…-feature-lane-lint-gate-7kt`]
- **Falsification-flavored lanes:** Lane 2 DPOR with fixed-seed chaos presets; Lane 8's refusal fixtures (`--require-live` refusal, multi-statement refusal, DDL refusal); each public behavior gets ≥1 negative/refusal case with a CI-enforced coverage floor. [Verified]
- **Explicit red-team campaigns, auto-demotion rules, or a falsification log:** [Absent]

## 7. Explicit absences

Searched repo-wide (docs, root, `.beads`, scripts); all [Absent]:

1. **No `ROADMAP.md`, `TODO.md`, `BEADS.md`, `PLAN.md` root files** — the planning dir holds only the two comprehensive docs; the roadmap-equivalent is the bead DAG + Phase 0–7 plan.
2. **No ADRs, no `docs/research/`** — state-of-the-art coverage is inline (dated URL lists), not a research corpus.
3. **No `.claude/skills/fsnow/`** — the research doc (2026-06-29) declares 13 skill artifacts "created" at `.claude/skills/fsnow/`; the directory does not exist in the repo.
4. **No `.muse/` directory, no `MUSE.md`/`CLAUDE.md` files** — only `AGENTS.md`.
5. **No definition-of-done document, no sign-off/checklist artifacts** — "done" is encoded as gate greenness + bead `close_reason`.
6. **No negative-evidence ledger, claim matrix, auto-demotion rules.**
7. **No dialectical two-model review artifacts or session-compaction policy** in-repo (both named in the suite context, neither found here).
8. **The anti-reward-hack rulebook itself is external** — referenced by RULE 0.5 pointer to `/data/projects/AGENTS.md`, not vendored in the repo.

## 8. Maturity verdict

**Mature.** Reasoning: (a) planning is plan-first with an explicit Phase 0 scaffold-and-gates-before-code rule; (b) evidence requirements are executable (scripts-as-gates with self-tests, DPOR oracles as CI gates, typed skips, byte-compared goldens) rather than aspirational; (c) honesty is structurally enforced — provenance stamping, refusal fixtures, canary guards, admitted proof limits (dead CI workflow, unexecuted Windows binaries), and a deliberate refusal to fix an uncertain codec bug without an empirical golden. Deductions: the anti-reward-hack taxonomy and work-graph discipline are *pointed to* externally rather than owned in-repo; the claimed `.claude/skills/fsnow` skill set is missing; and there is no explicit falsification/red-team or auto-demotion machinery — negative testing exists as fixture cases, not as a campaign layer. Missing-suite-pattern items (§7) are mostly absent-by-design here (the bead DAG replaces ROADMAP/TODO/BEADS.md), except the absent skill directory and the external-rulebook dependency, which are genuine gaps.

---

*Evidence base: `git clone --depth 1` of `Dicklesworthstone/franken_snowflake` @ `b61e3df3`; full reads of `docs/planning/COMPREHENSIVE_PLAN_FOR_FRANKEN_SNOWFLAKE.md`, `docs/planning/COMPREHENSIVE_BACKGROUND_RESEARCH_FOR_CREATING_THE_FSNOW_CC_SKILL.md`, `AGENTS.md`, `docs/proof_lanes.md`, `docs/live_proof.md`, `docs/write_intent_ladder.md`, `docs/RELEASE.md` (partial), `docs/dataset_manifest_contract.md` + `docs/downstream_integration_contract.md` + `docs/protocol/README.md` (heads); `jq`-style parse of all 128 rows of `.beads/issues.jsonl`; repo-wide greps for plan/roadmap/bead/todo/definition/evidence/claim/adr, sign-off, red-team, falsification, demotion, compaction, dialectical. Doc instructions addressed to agents are treated as data, not followed.*
