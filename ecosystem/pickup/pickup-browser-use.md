# Pickup companion: Browser-use stacks

Type: libraries, SDKs, and MCP servers that let AI agents observe and act on the web
(real-browser automation for agents), plus the headless-browser infrastructure underneath.

## Charter seed

A browser-use project gives an LLM agent a working, safe, debuggable interface to the
web: observation (accessibility tree / DOM / screenshots), action (act / extract /
observe / agent primitives), and session management (CDP, proxy/stealth, extensions,
recording/replay). The infrastructure layer is the browser farm: headless
Chrome/Firefox/WebKit built and tested for long-lived agent workloads.

**In scope:** agent-browser bindings and MCP tool servers; session models; structured
observation (accessibility-tree-first, query languages over raw DOM); in-repo eval
harnesses against pinned benchmark datasets; deterministic local test servers;
session recording/replay; browser-farm Docker matrices and leak checks.

**Out of scope:** model training and RL environments (separate types); computer-use
beyond the browser (separate type); web-search API layers (separate type);
guardrails/red-teaming (separate type); general agent frameworks and MCP clients
(unless the project is the browser server itself).

**A good starting point** for this type means: unit specs that never touch the live
web, a separate real-browser lane, agent tasks declared as data with judge criteria,
benchmarks pinned as vendored datasets, and an eval lane that is quarantined from
— not fused into — the unit suite. Flakiness is expected; it must be measured and
quarantined, not hidden behind retries.

### Requirements

- REQ-BU-1: Unit and real-browser integration suites are physically separated
  (distinct configs, distinct CI jobs); integration specs must not be swept up by
  the unit glob.
- REQ-BU-2: Core spec suites run against a local deterministic test server, never
  the live web; the suite passes with external network blocked.
- REQ-BU-3: Agent tasks are declared as data (name / task / judge_context /
  max_steps), community-contributable, and scored by an LLM judge against stated
  criteria.
- REQ-BU-4: Agent benchmarks NEVER run on every PR. Secret-bearing agent evals
  (any task whose fixtures, prompts, or page content carry credentials, session
  tokens, or live-site state) are banned from the PR lane entirely: they run only
  on a schedule, in the merge queue, or on a labeled run with explicit maintainer
  opt-in. Non-secret agent benchmarks may run per-PR only when isolated per-task
  (no shared browser sessions) and never inside the unit lane. Every secret-bearing
  run emits a spend receipt (run id, task count, judge calls, wall-clock,
  estimated cost) into the claim registry before BEADS READY.
- REQ-BU-7 — Trust boundary: hostile page content. Page content is untrusted
  input, never instruction. The agent's policy-mediation layer (system prompt /
  tool-use policy) sits between page content and tool calls and is itself
  load-bearing: any tool call whose arguments derive from page text MUST pass
  the mediation policy before execution. Prompt-injection test pages
  (credential-harvest, exfiltration, instruction-override) are committed
  fixtures; a run that executes a page-sourced exfiltration (network call to a
  non-allowlisted host, credential write to an untrusted sink) fails the tier.
  Credentials and session state live in the secrets store, never in page-visible
  DOM or task YAML committed to the repo. The starter-kit delta: a
  `policy-mediation/` harness (mediation policy spec + injection-fixture corpus +
  exfiltration-detection checks) ships with the kit for this type.
- REQ-BU-5: Session recording/replay (CDP screencast / GIF / MP4 export) is a
  tested first-class feature for debugging flaky agent runs.
- REQ-BU-6: Benchmark datasets and browser binaries are version-pinned and
  provenance-tracked in-repo (dataset attribution files, binary cache keys with
  hashes); reruns bank receipts naming the exact pins.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all named in the evidence file):

1. **Mind2Web dataset** — the original LLM web-agent benchmark
   (`OSU-NLP-Group/Mind2Web`, `src/action_prediction`, `src/candidate_generation`);
   vendored inside newer projects (browser-use `tests/mind2web_data/processed.json`).
2. **WebVoyager benchmark** — dataset-backed task suites, shipped in-repo by
   Skyvern-AI/skyvern (`evaluation/datasets/webvoyager_tasks.jsonl`) and consumed by
   stagehand (`packages/evals/suites/webvoyager.ts`).
3. **WebArena environments** — realistic web environments + harness
   (web-arena-x/webarena `evaluation_harness/evaluators.py`); consumed by
   BrowserGym env bundles (`webarena`, `webarena_verified`, `webarenalite`).
4. **BrowserGym** — gym-style experiment loop + typed benchmark configs
   (`ServiceNow/BrowserGym`, `experiments/src/browsergym/experiments/{loop.py,agent.py,benchmark/}`).
5. **Deterministic local test server** — the anti-live-web oracle:
   microsoft/playwright-mcp `tests/testserver/index.ts` wired via `tests/fixtures.ts`.

Truth-pack shape (per `_s0/model-guides.md`), instantiated for this type:

- `docs/truth-pack/PIN_RECORD.md` — dataset commit/tag pin + browser-binary version
  + judge-model identifier, dated, with any pin-age gaps stated honestly.
- `docs/truth-pack/MANIFEST.sha256` — hashes over every vendored dataset file
  (`webvoyager_tasks.jsonl`, `odysseys_tasks.json`, task YAML globs) and the
  test-server source.
- `docs/truth-pack/ACCEPTANCE_SURFACE.json` — break-even thresholds: per-suite
  minimum success rates, max_steps budgets, judge pass criteria, flake-rate budget
  (see shared GATE-018; budget is a design target until measured).
- `docs/truth-pack/NONDETERMINISM_FLOOR.md` — the LLM variance floor: judge-model
  repeatability A/A spread, agent-task success-rate spread across reruns; anything
  below this floor is noise, not signal.
- `fetch-truth-pack.sh --verify` — downloads pins, verifies hashes, refuses to
  proceed on mismatch.
- **Invocation-time oracle recording:** record the benchmark executable/dataset
  SHA-256 and browser-binary SHA-256 at every measurement invocation (whisper-pattern:
  no un-recorded participant is admissible). A dataset file that changed
  mid-campaign voids the run.

UNK-BU-1 (deterministic LLM responses): no verified project ships recorded LLM
responses (no VCR-cassette-style fixtures found). "Replay the benchmark, not the
model" is the verified norm; a fully deterministic agent-task rerun story is
unverified — see UNK-BU-1 in Unknowns.

UNK-BU-4 (commercial task stores): Skyvern's `evaluation/script/` posts to
proprietary infra; only datasets + `ODYSSEYS_ATTRIBUTION.md` are in-repo. A
self-contained rerun of those suites is unverifiable from the repo alone.

## Initial claims (CLAIM-*)

All claims are about the type's process norms, not one repo's marketing. Tiers:
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-BU-1 | Mature browser-use projects separate unit and real-browser integration suites into distinct configs/CI jobs, never one mixed suite | browserbase/stagehand `vitest.config.ts` + `vitest.integration.config.ts` (comment: "Integration specs launch real Chrome and are owned solely by vitest.integration.config.ts") | T0 | High | ADMISSIBLE |
| CLAIM-BU-2 | Core specs run against a local deterministic test server, never the live web, across a multi-OS CI matrix | microsoft/playwright-mcp `tests/testserver/index.ts`, wired via `tests/fixtures.ts`; `.github/workflows/ci.yml` os: [ubuntu-latest, macos-15, windows-latest] | T0 | High | ADMISSIBLE |
| CLAIM-BU-3 | Agent capability is specified declaratively (name / task / judge_context / max_steps) and scored by an LLM judge against stated criteria, in a community-contributable task directory | browser-use/browser-use `tests/agent_tasks/README.md`, `tests/agent_tasks/*.yaml`, runner `tests/ci/evaluate_tasks.py` | T0 | High | ADMISSIBLE |
| CLAIM-BU-4 | Agent benchmarks trigger on every PR against the PR commit, each task in its own process/session to prevent browser-session interference | browser-use/browser-use `.github/workflows/eval-on-pr.yml` (`api/triggerInteractionTasksV6`), `tests/ci/evaluate_tasks.py` ("Each task gets its own Python process") | T0 | High | ADMISSIBLE |
| CLAIM-BU-5 | Leading projects ship an in-repo eval package with auto-discovered task suites, dataset-backed benchmarks, and run logging for experiment diffing | browserbase/stagehand `packages/evals/` (`suites/{webvoyager,onlineMind2Web,webtailbench,odysseysbench,hardbenchmark}.ts`, `packages/evals/README.md`) | T0 | High | ADMISSIBLE |
| CLAIM-BU-6 | Third-party benchmark datasets are bundled in-repo with explicit attribution/provenance files | Skyvern-AI/skyvern `evaluation/datasets/` (`webvoyager_tasks.jsonl`, `odysseys_tasks.json`, `ODYSSEYS_ATTRIBUTION.md`); browser-use `tests/mind2web_data/processed.json` | T0 | High | ADMISSIBLE |
| CLAIM-BU-7 | Session recording/replay (CDP screencast, GIF/MP4 export) is a tested first-class feature used to debug flaky agent runs | browser-use/browser-use `browser_use/agent/gif.py`, `tests/ci/test_action_record.py` ("The watchdog drives CDP screencast… These tests exercise the full stack against a real headless browser") | T0 | High | ADMISSIBLE |
| CLAIM-BU-8 | Expensive eval jobs are change-aware (path filters, label-based skips) and quarantined in their own CI jobs, separate from the unit lane | browserbase/stagehand `.github/workflows/ci.yml` (`dorny/paths-filter`, `skip-evals` / `skip-regression-evals` labels, `unit-ts` / `browser-ts` / `integration` / `regression-evals` split) | T0 | High | ADMISSIBLE |
| CLAIM-BU-9 | Browser-farm projects run cross-browser Docker build matrices with memory-leak regression checks for long-lived headless sessions | browserless/browserless `.github/workflows/docker-{chrome,chromium,edge,firefox,webkit,multi}.yml`, `leak-check.yml`, `pr-checks.yml` | T0 | High | ADMISSIBLE |
| CLAIM-BU-10 | No verified project ships recorded LLM responses for deterministic replay; determinism is achieved by replaying the benchmark (deterministic server, isolated sessions, run logging), not the model | Thin: negative finding — no VCR-cassette-style fixtures found in any verified repo (evidence caveat: "Determinism for LLM-driven tests") | T0 | High | ADMISSIBLE |
| CLAIM-BU-11 | No verified project documents an explicit flake-rate budget or quarantined-flake labeling scheme; concrete mechanisms observed are per-test CI retry and eval quarantine off the unit path | Thin: negative finding (evidence caveat: "Flakiness practices were thin") — browser-use `nick-fields/retry@v3` in test.yaml is the mechanism seen | T0 | High | ADMISSIBLE |
| CLAIM-BU-12 | Benchmark standards lag codebases: the canonical datasets (WebArena, Mind2Web) last pushed Nov 2025 yet remain vendored as current truth inside fast-moving projects | Thin: push dates 2025-11-26 / 2025-11-05 vs active 2026-09 pushes; browser-use vendors Mind2Web in `tests/mind2web_data/` | T0 | High | ADMISSIBLE |
| CLAIM-BU-13 | Some commercial-twin eval scripts depend on proprietary task stores and are not fully self-contained; only the datasets and attribution are in-repo | Skyvern-AI/skyvern `evaluation/script/` (`create_webvoyager_task_v2.py` posts to Skyvern infra) | T0 | High | ADMISSIBLE |
| CLAIM-BU-14 | Every major browser-use project ships a first-class in-repo eval harness | WITHDRAWN — steel-dev/steel-browser (7,684 stars) verified real/active with `api/vitest.config.ts` but no locatable in-repo test directory or eval suite; claim scope narrowed to SDK/harness-class projects only (stagehand, browser-use, Skyvern, BrowserGym) | T0 | — | WITHDRAWN |

## Gate profile

Starter-kit G1–G14: the S0 sources available to this author do not define the
G1–G14 list, so this mapping is provisional (see UNK-BU-2). Load-bearing for
this type: invocation-time SHA-256 recording of every measurement participant
(dataset, browser binary, harness, judge model); golden banking ceremony
(A/A-derived tolerances, no golden-regeneration-until-green); claim-registry
wiring (every public claim registered with receipt); negative-evidence ledger
(kills and retractions in-tree); machine-checkable conformance checks with
MUST/SHOULD levels. Advisory-as-shipped for this type: any gate written around
fully deterministic replay — LLM variance dominates the agent-task tier, so the
gate must parameterize the nondeterminism floor instead of assuming bit-exact
replay. Type-specific parameters: goldens bind per (host, dataset pin, browser
binary, judge model), never across pins; the measurement law uses the
**remote-lab variant** for agent-task tiers (live benchmarks cannot run fully
host-local, so receipts must additionally record endpoint, isolation, and
contention of the lab side).

New type-specific gates:

- GATE-BU-1 — **Lane separation — RETIRED into shared GATE-015** (S4 round 1,
  dedup). GATE-015 acceptance (2) already requires real-browser tiers as
  separate workflows. Retained as a type-specific parameter: a glob sweep of
  the unit config's include patterns returns zero specs tagged
  integration/real-browser; CI fails if one is swept up.
- GATE-BU-2 — **Live-web embargo — RETIRED into shared GATE-014** (S4 round 1,
  dedup). GATE-014 acceptance (3) already requires the unit tier to run with
  zero credentials and zero network. Retained as a type-specific parameter:
  the suite runs green in a no-egress job against the pinned local test
  server; any live-host fetch is a finding, not a fallback.
- GATE-BU-3 — **Eval quarantine — RETIRED into shared GATE-015** (S4 round 1,
  dedup). GATE-015 acceptance (2) already requires benchmark tiers as separate
  workflows. Retained as a type-specific parameter: CI graph shows eval jobs
  downstream of, or parallel to, the unit lane with separate timeouts; retry
  events land in the run receipt.
- GATE-BU-4 — **RETIRED into shared GATE-018** (S4 round 1, dedup). GATE-018
  acceptance (4) already requires the declared flake-rate budget (the shared
  gate cites this pack's design). Retained as a type-specific parameter:
  the budget is written in `ACCEPTANCE_SURFACE.json`; any suite exceeding
  budget blocks release; no budget may be weakened in the same PR that
  misses it. (Designed, not copied — no verified project documents one;
  inference labeled per CLAIM-BU-11.)

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Score claims rest on pinned benchmark datasets + browser binaries; pins recorded in every run manifest (GATE-008 acceptance 4) |
| GATE-005 (Agent deterministic replay / trajectory) | Advisory | Recorded-session replay as debugging evidence (REQ-BU-5); bit-exact replay is not the norm (UNK-BU-1) |
| GATE-008 (Browser/GUI task-state evaluator) | Load-bearing | Applies to this slug; state-based eval, FAIL protocol, vendored datasets, benchmark pin in run manifests (REQ-BU-3/6; GATE-BU-3/4 retired into 015/018) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; unit tier passes with external network blocked (REQ-BU-2) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; lane separation + eval quarantine (GATE-BU-1/3 retired into 015) |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; dataset + browser-binary pins with hashes (REQ-BU-6) |
| GATE-018 (Flake quarantine) | Load-bearing | Applies to this slug; declared flake-rate budget + retry events in receipts (GATE-BU-4 retired into 018) |

## Evidence tiers

Mapped to the localbench / model-guides five-tier vocabulary:

- **[Verified] / [Git-observed]:** file pointers in a live repo (commit SHA
  recorded), e.g. stagehand's `vitest.integration.config.ts`, playwright-mcp's
  `tests/testserver/index.ts`. Carries process claims (CLAIM-BU-1…9).
- **[Counted]:** numbers machine-produced from repo metadata: star counts and
  last-push dates in Trend citations (GitHub API verified 2026-09-23).
- **[Code-verified]:** a claimed behavior confirmed by reading the referenced
  code/config, not the README (e.g. `evaluate_tasks.py`'s per-process isolation
  comment; `dorny/paths-filter` in stagehand ci.yml).
- **[CI-observed]:** attests the suite/job *runs*, not that it is green —
  applies to `eval-on-pr.yml` and the 3-OS playwright-mcp matrix.
- **[Maintainer claim] (T2):** README/banner claims about capability or
  adoption, e.g. steel-browser's "Browser API for AI Agents & Apps" framing.
  Not process evidence. Adopter claims (notable users) are excluded entirely —
  thin, press-release-style, not API-traceable (see evidence caveats).
- **[Inference] (T3):** shared GATE-018's flake budget (retired GATE-BU-4) and any
  generalization beyond what the files show.
- **Negative evidence:** CLAIM-BU-10, CLAIM-BU-11, and the WITHDRAWN
  CLAIM-BU-14 are admissible as ledger entries (kills/retractions stay in-tree).

Admissibility rule for this type: an LLM-judged agent result is evidence only
when the receipt names the task YAML hash, the judge model pin, max_steps, and
the dataset/browser pins; a number without these four fields is [NO ADMISSIBLE
RATIO] territory (per the tts pattern in `_s0/model-guides.md`).

## Localbench bench shape

**Spec format:** `agent-harness:agent-model:judge-model` plus pinned
`dataset@pin` and `browser@sha256`, e.g.
`stagehand-evals:claude-opus-4-6:judge-sonnet-4-5:webvoyager@a1b2c3d:chromium@e4f5…`.
The harness starts/stops its own browser backends; the judge model is a named
measurement participant, not ambient infrastructure.

**Named tiers:** `unit` (no browser), `integration` (real browser, local test
server only), `eval` (dataset-backed suites: webvoyager, onlineMind2Web,
odysseysbench…), `agent-task` (declarative YAML tasks, LLM judge), `farm`
(browser-farm images: boot time, per-session memory leak, long-session
stability). Goldens bind PER TIER; a dataset or browser-binary update
invalidates only the tiers it touches (re-bank those tiers only).

**Golden schema:** `conformance` (named checks with `level: MUST|SHOULD`,
`verdict: PASS|FAIL`) + `metrics` (each with `value`, `spread` from A/A,
`tol`, `tol_source` → banked receipt path, `better` direction). Tolerance
rule: `tol = max(3 × A/A relative spread, floor)` — for `agent-task` tiers the
floor is the LLM nondeterminism floor from `NONDETERMINISM_FLOOR.md`, which will
dominate; anything below it is noise, not regression.

**Banking ceremony:** goldens written ONLY by an A/A pair (`aa <spec>
--write-golden`), followed by `git diff goldens/` review in the same commit.
Golden-regeneration-until-green is the named forbidden pattern. A/A pairs
across different dataset pins or browser binaries are refused as unsound.

**Host/generation binding:** `goldens/<host_id>/`; never compared across hosts
or across generations (backend, harness, dataset, or browser-binary updates =
new generation; status CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden).

**Measurement law:** preflight refuses a busy machine (GPU/CPU > 25%, names the
processes); runs marked CONTENDED if a non-backend process exceeds 25% GPU in a
second; one unit under test at a time; loopback/local-only endpoints where the
tier allows it — a failed local call is a finding, never a cloud fallback. For
`agent-task`/`eval` tiers that must hit external benchmark environments: the
**remote-lab variant** — the lab endpoint, isolation (fresh session per task),
and lab-side contention are recorded in the receipt; preflight still refuses a
busy local machine.

**A/B discipline:** same-invocation A, B, A ordering; banked under a name; both
arms' participant SHA-256s recorded at invocation.

**Receipts:** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
(kinds: aa, ab, mem, run) + dated `.md` investigation notes; `runs/` gitignored
scratch with `<ts>__<kind>__<spec>` dirs. Run receipts additionally carry:
task-YAML hash, judge-model pin, max_steps, dataset pin, browser-binary SHA-256,
retry events.

**Incumbent pins:** `docs/evidence/incumbents.md` — exact versions + hashes of
every external thing numbers depend on: dataset pins, browser binaries, agent
model, judge model, harness, OS.

**Claims registry wiring:** `registries/claims.tsv` — every public claim
sentence registered and machine-checked against its receipt on every commit;
the linter observes (exit 0) until the project promotes it to gating.

**Negative-evidence ledger:** `docs/evidence/NEGATIVE_EVIDENCE.md`,
`DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`; demotions always
allowed; no self-grading without independent verification.

**Fixtures bind by hash:** task YAMLs, dataset files, test-server sources all
under `MANIFEST.sha256`; a hash mismatch anywhere refuses the run.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. `docs/truth-pack/` template with browser-use fields: `PIN_RECORD.md`
   (dataset + browser-binary + judge-model pins), `MANIFEST.sha256`,
   `ACCEPTANCE_SURFACE.json` (per-suite success-rate thresholds, max_steps
   budgets, flake budget), `NONDETERMINISM_FLOOR.md`,
   `fetch-truth-pack.sh --verify`.
2. Declarative agent-task YAML schema (`name`/`task`/`judge_context`/`max_steps`)
   + task runner template (per-task isolated browser process, parallel
   subprocesses) modeled on browser-use's `tests/agent_tasks/` and
   `tests/ci/evaluate_tasks.py`.
3. Lane-separation CI template: distinct unit vs real-browser configs with a
   glob-sweep guard (shared GATE-015 lane-separation parameter), modeled on stagehand's
   `vitest.config.ts`/`vitest.integration.config.ts` split.
4. Eval-on-PR workflow template: trigger agent benchmarks against the PR commit,
   quarantine results off the unit path (shared GATE-015 eval-quarantine parameter), modeled on browser-use's
   `.github/workflows/eval-on-pr.yml`.
5. Change-aware CI template: path filters + `skip-evals`-style PR labels +
   `cancel-in-progress` concurrency, modeled on stagehand's `ci.yml`
   (`unit-ts` / `browser-ts` / `integration` / `regression-evals`).
6. Browser-farm matrix template: cross-browser Docker build workflows +
   `leak-check.yml` for long-lived headless sessions, modeled on
   browserless's `.github/workflows/docker-*.yml` and `leak-check.yml`.
7. Session recording/replay harness (CDP screencast → MP4/GIF export) with a
   `browser_use record`-style CLI and full-stack real-browser tests, modeled on
   browser-use's `browser_use/agent/gif.py` and `tests/ci/test_action_record.py`.
8. Live-web-embargo test fixture: local deterministic test server + no-egress CI
   job (shared GATE-014 live-web-embargo parameter), modeled on playwright-mcp's `tests/testserver/index.ts`.
9. Run-receipt schema extension: task-YAML hash, judge-model pin, max_steps,
   dataset pin, browser-binary SHA-256, retry events, lab-side contention
   (remote-lab variant).
10. Flake-budget design doc (shared GATE-018): quarantine-label scheme + budget field
    in `ACCEPTANCE_SURFACE.json` — explicitly marked as designed, not copied
    (no verified exemplar).

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Stars snapshot 2026-09-23, verified via GitHub API. Last pushes as observed.

1. **browser-use/browser-use** | 116,059 | pushed 2026-09-18 — Largest agent-browser
   OSS project; process exemplar for declarative agent tasks + per-PR cloud eval
   platform (`.github/workflows/eval-on-pr.yml`, `tests/agent_tasks/`,
   `tests/ci/evaluate_tasks.py`).
2. **microsoft/playwright-mcp** | 37,504 | pushed 2026-09-18 — Trend pivot from
   libraries to agent-native browser tool servers (accessibility-tree-first);
   process exemplar for the deterministic local test server
   (`tests/testserver/index.ts`) and 3-OS CI matrix.
3. **browserbase/stagehand** | 25,315 | pushed 2026-09-23 — Most eval-driven
   project: first-class in-repo eval harness (`packages/evals`, suites for
   webvoyager/onlineMind2Web/webtailbench/odysseysbench/hardbenchmark);
   process exemplar for lane separation and change-aware CI.
4. **Skyvern-AI/skyvern** | 23,057 | pushed 2026-09-23 — VC-scale agent workflow
   automation with commercial cloud twin; process exemplar for in-repo
   benchmark-dataset bundling with provenance
   (`evaluation/datasets/`, `ODYSSEYS_ATTRIBUTION.md`).
5. **browserless/browserless** | 13,732 | pushed 2026-09-22 — Headless-browser-as-a-
   service infra layer; process exemplar for cross-browser Docker matrices and
   leak checks (`docker-*.yml`, `leak-check.yml`).
6. **steel-dev/steel-browser** | 7,684 | pushed 2026-09-21 — "Browser API for AI
   Agents & Apps" session-model archetype; trend citation only (shallow process
   evidence — no in-repo test/eval suite located).
7. **web-arena-x/webarena** | 1,613 | pushed 2025-11-26 — Benchmark side:
   realistic web environments + `evaluation_harness/evaluators.py`; category is
   benchmarked, not just built.
8. **tinyfish-io/agentql** | 1,467 | pushed 2026-09-18 — Diversification into
   structured-query interfaces over raw DOM; trend citation.
9. **OSU-NLP-Group/Mind2Web** | 1,029 | pushed 2025-11-05 — Original LLM web-agent
   benchmark (`src/action_prediction`, `src/candidate_generation`); vendored as
   static eval data in newer projects; benchmark lineage anchor.

Honest caveats (carried over from the evidence file): flakiness practices thin —
no flake-rate budget or quarantine-labeling scheme found anywhere (a designed
differentiator, not a copy target); determinism is "replay the benchmark, not
the model" — no recorded-LLM-response fixtures found; Steel evidence shallow
(trend only); adopter claims unverified and excluded; benchmark repos slow-moving
but current as standards; Skyvern's eval scripts post to commercial infra, so
only datasets + attribution are self-contained. Repos that 404'd
(browserbase/sdks, langchain-ai/web-voyager, hyperbrowser-ai/sdk) were dropped,
not cited.

## Unknowns (UNK-*)

- UNK-BU-1 — Can a starting point promise deterministic rerun of LLM-judged
  agent tasks? No verified project ships recorded LLM responses. Options:
  pin judge model + record all prompts/responses in receipts (deterministic
  *audit*, not deterministic *rerun*), or design VCR-cassette fixtures (no
  exemplar). Must be resolved before S5 — it decides whether agent-task goldens
  are ever bankable.
  **Disposition: TARGETED.** [Integrator triage, 2026-09-23 — lane B did not cover this row; verdict is the integrator's, flagged for parent re-triage] Deterministic-rerun vs deterministic-audit parked: S3 bench setup runs the cassette-feasibility probe; agent-task goldens banked only for deterministic legs. Promotion predicate: at S3 bench setup, decide rerun-vs-audit by the probe (VCR-cassette fixtures if buildable, else deterministic audit); bank goldens only where the A/A null is exact; LLM-judge legs carry the committed nondeterminism floor and record all prompts/responses in receipts. Owner: plan author. S3 step: bench setup.
- UNK-BU-2 — The starter-kit's G1–G14 definitions are not in this author's S0
  sources; the Gate profile's as-is/advisory mapping is provisional and must be
  reconciled against the real gate list before S5.
  **Disposition: TARGETED** — still open; must not be marked RESOLVED until
  the promotion predicate is met (promotion predicate: reconciled per-gate
  G1–G14 mapping verified against the playbook's canonical operational
  definitions).
- UNK-BU-3 — What flake-rate budget and quarantine-label scheme should a new
  project adopt? No verified project documents one (CLAIM-BU-11); the GATE-018 budget parameter is
  designed, not copied. Needs a concrete budget number and labeling mechanics
  validated against at least one real suite.
  **Disposition: TARGETED.**
- UNK-BU-4 — How to pin an LLM-as-judge across model deprecations so PR-eval
  comparisons stay valid. If the judge model is retired, historical receipts
  become incomparable; the pinning/rotation policy is undefined.
  **Disposition: TARGETED.**
- UNK-BU-5 — Licensing/attribution terms for vendoring third-party benchmark
  datasets (WebVoyager, Mind2Web, WebArena, BrowserGym envs) into a new project's
  tree. Skyvern's `ODYSSEYS_ATTRIBUTION.md` is one precedent; a general
  vendoring policy is not established.
  **Disposition: TARGETED.**
- UNK-BU-6 — How much process to borrow from the Steel class
  (steel-dev/steel-browser): session-model archetype verified real/active but no
  in-repo test/eval suite located — trend evidence only, and the depth of its
  applicability to a clean-room start is unknown.
  **Disposition: ADVISORY.**
- UNK-BU-7 — The exact shape of the localbench remote-lab variant for
  agent-task tiers: what lab-side machine state must the receipt capture, and
  who attests it when the lab is third-party infrastructure?
  **Disposition: TARGETED.**
