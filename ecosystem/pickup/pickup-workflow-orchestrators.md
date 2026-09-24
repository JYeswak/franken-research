# Pickup companion: Durable workflow orchestrators

Type: durable workflow orchestrators (durable execution engines + adjacent orchestrators).
Evidence source: `~/workspace/franken-research/ecosystem/pickup/_evidence/workflow-orchestrators.md`
(researched 2026-09-23, all repos verified live via GitHub API).
Gate semantics: `_s0/ecosystem-digest.md` §3 (G1–G14 as "port-rigor contracts").
Truth-pack / oracle-integrity conventions: `_s0/model-guides.md` (tts/ocr/whisper/nlp).
Bench conventions: `_s0/localbench-pattern.md`.

## Charter seed

**What this project type is.** Engines that execute code durably: workflow-as-code whose
progress is recorded as an event history (or journal) so execution can pause, resume,
migrate, and — critically — *replay deterministically* after crashes. Core lineage:
Temporal / Cadence (history-based replay); newest generation: Restate (journal-based).
Adjacent, not core: event-driven durable functions and background-job platforms
(trigger.dev, hatchet, inngest) and task/DAG orchestrators (airflow, dagster, prefect).

**In scope.** Durable-execution semantics: deterministic replay, event-history/journal
durability, in-process workflow test environments with mocked clocks, time-skipping,
deadlock detection for workflow coroutines, fault-injection/simulation at the engine level,
agent-workflow replay tests. SDK test environments and shipped test-harness modules.

**Out of scope.** Feature parity with DAG schedulers (cron, DAG authoring, data-pipeline
operators); business logic of the tasks being orchestrated; the 12 reward-hacking
patterns already verbatim in the starter kit's AGENTS.md (carried over, not reinvented).

**What "a good starting point" means.** An empty engine repo that can *enforce
determinism from day one*: a truth pack pinning an incumbent engine + recorded history
fixtures, an in-process test environment with a virtual clock, a replay harness with
canonical fixtures plus one deliberately nondeterministic fixture that must fail,
journal-table unit tests, a claim registry wired to receipts, and the gate profile
below. A fresh agent should be able to add a workflow feature and have the determinism
contract tested automatically.

### Requirements

- **REQ-DW-1** — The starter must ship an in-process workflow test environment with a
  mocked/virtual clock and time-skipping; workflow tests may not depend on real timers.
- **REQ-DW-2** — Replay tests against recorded event histories are mandatory, including
  a deliberately nondeterministic fixture that MUST fail replay (negative control).
- **REQ-DW-3** — Deadlock detection for workflow coroutines: blocking workflow code is a
  test failure; the deadlock timeout is plumbed through the test suite.
- **REQ-DW-4** — The durability primitive (journal / event-history tables) is unit-tested
  and crash-recovery tested independently of the engine.
- **REQ-DW-5** — A `docs/truth-pack/` pins the incumbent engine commit, SDK versions, and
  history fixtures (`PIN_RECORD.md`, `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json`,
  `NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh --verify`); the oracle binary's
  SHA-256 is recorded at invocation time.
- **REQ-DW-6** — Cross-type interface: durable history/journal/replay is the
  orchestrator's contract. Any agent-framework (or other type) that embeds an
  LLM-agent orchestration path MUST satisfy this type's recorded-history replay
  interface: recorded histories captured from real runs replay deterministically
  (the exportable temporalio/sdk-python agent-replay pattern), and the framework
  does not re-define replay semantics locally. The interface — not the
  implementation — is what the framework conforms to.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (all from the evidence file):

1. **temporalio/temporal** (pinned commit) — the category reference implementation; server
   functional suite (`tests/timeskipping_*.go`, `tests/gethistory_test.go`,
   `tests/workflow_reset_test.go`, `tests/testcore/` fault injection) is the differential
   benchmark for replay/reset/time-skip behavior.
2. **temporalio/sdk-python** (pinned commit) — the replay-oracle kit: `temporalio/worker/_replayer.py`,
   `tests/worker/test_replayer.py`, fixtures `tests/worker/test_replayer_complete_history.json`
   (must replay) and `tests/worker/test_replayer_nondeterministic_history.json` (must fail);
   agent-replay tests under `tests/contrib/{openai_agents,langgraph,google_adk_agents,deepagents}/`.
3. **cadence-workflow/cadence** + **cadence-workflow/cadence-go-client** (pinned commits) —
   sibling lineage; `internal/workflow_replayer.go`, `testsuite/`, `simulation/history|matching|replication/`.
4. **restatedev/restate** (pinned commit) — journal-based newest generation; oracle value is
   limited (see UNK-DW-2): only `crates/partition-store/src/tests/journal_table*_test/mod.rs`
   and `crates/test-util` were verified.

Integrity checks (truth-pack shape per `_s0/model-guides.md`):

- `docs/truth-pack/PIN_RECORD.md` — upstream engine commit(s) + SDK pins + dates; honest
  note when pins are of different vintages (tts pattern).
- `docs/truth-pack/MANIFEST.sha256` — hashes of every history-JSON fixture and oracle binary.
- `docs/truth-pack/ACCEPTANCE_SURFACE.json` — break-even-style thresholds: canonical
  histories → replay PASS; nondeterministic fixture → replay FAIL with named failure mode;
  journal crash-recovery scenarios → PASS.
- `docs/truth-pack/NONDETERMINISM_FLOOR.md` — committed: virtual-clock suites have zero
  wall-clock dependence; names what remains nondeterministic (real network, DB latency,
  wall-clock timers in non-workflow code) and how each is quarantined.
- `fetch-truth-pack.sh --verify` — fetch by pin, verify every hash, refuse on mismatch.
- **Invocation-time oracle binary SHA-256 recording** (whisper pattern): every measurement
  row records the incumbent engine binary's SHA-256; an un-recorded executable is not an
  admissible oracle.
- **UNK-DW-1** — See UNK-DW-1 in Unknowns below (not redefined here).

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
are owner/repo + path from the evidence file. All file-existence claims below rest on the
evidence file's GitHub-API verification (file existence + spot-checked contents, suites
not run).

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-DW-1 | Every Temporal-lineage SDK ships an in-process workflow test environment with a mocked/virtual clock (time skipping; no real timers). | temporalio/sdk-go `internal/internal_workflow_testsuite.go` (`clock.NewMock()`); cadence-workflow/cadence-go-client `testsuite/`; temporalio/sdk-java `io.temporal.testing.TestWorkflowEnvironment`; temporalio/sdk-typescript `packages/testing/src/testing-workflow-environment.ts`; temporalio/sdk-python `temporalio/testing/_workflow.py` | T0 | High | ADMISSIBLE |
| CLAIM-DW-2 | Replay against recorded event histories is the standard determinism check, and suites ship a deliberately nondeterministic history fixture as a negative control. | temporalio/sdk-python `tests/worker/test_replayer.py` + fixtures `tests/worker/test_replayer_complete_history.json`, `tests/worker/test_replayer_nondeterministic_history.json`; cadence-workflow/cadence-go-client `internal/workflow_replayer.go` | T0 | High | ADMISSIBLE |
| CLAIM-DW-3 | Agent-workflow replay tests (LLM-agent frameworks replayed from stored histories) are the most exportable test pattern for agent orchestration. | temporalio/sdk-python `tests/contrib/openai_agents/test_openai_replay.py`, `tests/contrib/langgraph/test_replay.py`, `tests/contrib/google_adk_agents/test_replay.py`, `tests/contrib/deepagents/test_replay.py` | T0 | High | ADMISSIBLE |
| CLAIM-DW-4 | Workflow-coroutine deadlock detection (workflow code must yield; blocks are failures) is an established SDK-level practice — thin: verified in one SDK. | temporalio/sdk-go `internal/workflow_deadlock_test.go`, `internal/internal_workflow_testsuite.go` (`DeadlockDetectionTimeout`) — thin: single-repo evidence, do not generalize to the whole type | T0 | High | ADMISSIBLE |
| CLAIM-DW-5 | Time-skipping is practiced at the server functional-test level as well as in SDK test environments. | temporalio/temporal `tests/timeskipping_test.go`, `tests/timeskipping_fast_forward_test.go`, `tests/timeskipping_propagation_test.go` | T0 | High | ADMISSIBLE |
| CLAIM-DW-6 | Fault-injection / cluster-poisoning / simulation harnesses are the engine-level testing norm. | temporalio/temporal `tests/testcore/fault_injection.go`, `tests/testcore/cluster_poison_test.go`, `tests/testcore/onebox.go`; cadence-workflow/cadence `simulation/history/`, `simulation/matching/`, `simulation/replication/` | T0 | High | ADMISSIBLE |
| CLAIM-DW-7 | The durability primitive (journal / event-history tables) is unit-tested independently of the engine. | restatedev/restate `crates/partition-store/src/tests/journal_table_test/mod.rs` (+ `journal_events_table_test`, `journal_table_v2_test`), `crates/test-util/src/lib.rs`; temporalio/temporal `tests/gethistory_test.go`, `tests/workflow_reset_test.go` | T0 | High | ADMISSIBLE |
| CLAIM-DW-8 | Replay is also a runtime product feature (workflow reset, run replay), not only test technology. | temporalio/temporal `tests/workflow_reset_test.go`; triggerdotdev/trigger.dev `apps/webapp/app/v3/services/replayTaskRun.server.ts`, `apps/webapp/app/v3/replayTask.ts` | T0 | High | ADMISSIBLE |
| CLAIM-DW-9 | Heavy, sharded CI with flaky-test tracking is the engine-scale norm. | temporalio/temporal `.github/workflows/run-tests.yml`, `optimize-test-sharding.yml`, `flaky-tests-report.yml`; apache/airflow `.github/workflows/ci-amd.yml`, `ci-arm.yml`, `airflow-e2e-tests.yml` — note: airflow is adjacent, not durable-execution | T0 | High | ADMISSIBLE |
| CLAIM-DW-10 | Shipping user-facing test-harness modules is an established product practice. | conductor-oss/conductor `test-harness/`, `test-util/` (top-level Gradle modules); inngest/inngest `TESTING.md` documents dev-server + Go E2E harness | T0 | High | ADMISSIBLE |
| CLAIM-DW-11 | No static/compile-time determinism analyzer exists in-tree for any repo; the type's determinism story is runtime replay + deadlock detection, not static analysis. | thin: absence claim — the evidence file explicitly records that no such analyzer was verified in any of the 15 repos | T0 | High | ADMISSIBLE |
| CLAIM-DW-12 | Task/DAG orchestrators (airflow, dagster, prefect) are adjacent, not Temporal-class durable execution; the replay/determinism machinery does not transfer wholesale to DAG scheduling. | inference from the evidence file's adjacency classification (apache/airflow 46,954★, dagster-io/dagster 16,197★, PrefectHQ/prefect 23,907★ cited for trend, not for replay practice) — labeled inference | T3 | Low | ADMISSIBLE |
| CLAIM-DW-13 | Restate's process evidence is the thinnest among the durable-execution engines: only journal-table unit tests and `crates/test-util` were verified; no replay harness or time-skipping framework was found. | restatedev/restate `crates/partition-store/src/tests/journal_table*_test/mod.rs` — thin: limited verification scope, see UNK-DW-2 | T0 | High | ADMISSIBLE |

Count: 13 claims. No CONTESTED or WITHDRAWN rows at S2; contestation is expected in S4.

## Gate profile

Starter-kit G1–G14 (semantics from `_s0/ecosystem-digest.md` §3). All 14 apply; type-specific
parameters below.

- **G1 ORACLE** — applies as-is. Type params: oracle inventory = pinned incumbent engine
  commit + pinned SDK commits + recorded history fixtures; post-pin changes need the
  two-party waiver; oracle shielded from the implementing agent. Oracle binary SHA-256
  recorded at invocation (REQ-DW-5).
- **G2 PAIR** — applies as-is. Type params: paired contract = same-history dual replay —
  incumbent engine and implementation replay the identical recorded histories; the
  nondeterministic fixture must fail identically (same named failure mode) on both arms.
- **G3 OWN** — applies as-is; binds the ATLAS R7 `owner` field on every CLAIM-DW-* row.
- **G4 CONTRACT** — applies as-is. Type params: claim artifacts = replay-suite results,
  journal-table unit-test results, time-skipping suite results, mock-clock blocklist
  scan results.
- **G5 HOST** — applies as-is, load-bearing in the negative direction: mocked-clock
  suites must show *zero* host-timer dependence; any wall-clock dependence in workflow
  code is a G5 failure (host confound).
- **G6 UNSAFE** — applies as-is for Rust targets (journal storage, replay executors):
  every new unsafe site carries `// SAFETY:` and the tree-wide unsafe inventory
  remains accounted for; advisory for Go/TypeScript/Python targets (declare
  ambient-capability reads in the same diff).
- **G7 REVIEW** — advisory; the type-specific analog is split-context adversarial review that must include the
  program's known weak spot — invented replay/determinism semantics (cf. the v8 Opus
  regrade: method pages inventing mechanisms). Reviewers verify every dramatization
  maps to a real mechanism and every claim to a packet-quoted source. Recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — applies as-is (claim-discipline as a gate, trial-before-scale).
- **G9 IOU** — applies as-is. Type params: known fixture gaps (e.g. restate's missing
  verified replay harness, UNK-DW-2) enter as bounded, dated IOUs; zero unresolved at close.
- **G10 MIRI** — applies for Rust implementations (unsafe journal/replay code); advisory
  otherwise. Mechanism per starter kit / ATLAS.
- **G11 LAYOUT** — N/A for this type (no Rust layout structs); the type-specific analog is on-disk/in-memory format-stability assertions for the journal / event-history if storage is in scope (`LIFETIMES.tsv`, T-B2), recorded as a review parameter, not a claim that canonical G11 applies as-is.
- **G12 AUDIT** — applies as-is (class-fix followed by instance re-audit).
- **G13 NOSTUB** — applies as-is. Type params: no stubbed timer subsystems, no fake
  journal tables, no placeholder replay fixtures; every fixture is a real recorded history.
- **G14 REJECT** — applies as-is. Type params: tier-mapping examples — a "deterministic"
  claim sourced only from vendor docs (T2) with no replay fixture is rejected down to T3;
  a replay claim without the invocation-time oracle SHA-256 is rejected outright
  (whisper's NO-ADMISSIBLE-VERDICT pattern).

Proposed new type-specific gates (GATE-DW-*):

- **GATE-DW-1 REPLAY-DETERMINISM — RETIRED into shared GATE-005** (S4 round 1, dedup). GATE-005 acceptance (3) already requires replay tests against stored histories including a deliberately nondeterministic fixture. Retained as a type-specific parameter: 100% PASS on canonical fixtures; the deliberately nondeterministic fixture MUST fail replay with the documented failure mode (a green run on the nondeterministic fixture fails the gate — negative control).
- **GATE-DW-2 MOCK-CLOCK** — All workflow tests run under the virtual clock; a static
  blocklist scan (wall-clock sleep, `time.Now` in workflow code, real timers) runs in CI.
  Acceptance: zero blocklist hits in workflow code; deadlock-detection timeout enforced
  and at least one must-yield violation fixture demonstrated failing.
- **GATE-DW-3 JOURNAL-UNIT** — Journal/event-history tables are unit-tested as the
  durability primitive before engine-level tests gate. Acceptance: journal unit tests
  green; write→kill→replay crash-recovery scenarios green against the pinned fixture set.
- **GATE-DW-4 AGENT-REPLAY — RETIRED into shared GATE-005** (S4 round 1, dedup).
  GATE-005 acceptance (3)–(4) already cover recorded-history replay and
  agent-workflow replay. Retained as a type-specific parameter of GATE-005:
  ≥3 recorded agent-run histories MUST replay deterministically through the
  determinism checker (honest minimum; raise as the corpus grows).

Gate count: 14 starter-kit (G1–G14) + 2 new type-specific (GATE-DW-2..3; GATE-DW-1/GATE-DW-4 retired into shared GATE-005).

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-005 (Agent deterministic replay / trajectory) | Load-bearing | Applies to this slug; history/journal replay is the type's core |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-017 (Spec / schema surface drift) | Advisory | Protocol-type sync is peripheral for orchestrators |
| GATE-018 (flake quarantine) | Load-bearing | Applies to this slug; long-running sharded engine suites quarantine flaky tests with explicit retry budgets (CLAIM-DW-9) |

## Evidence tiers

Mapped to the localbench evidence-tier conventions (program-wide vocabulary from
`_s0/model-guides.md` §5: [Verified] flavors, [Maintainer claim], [External], [Inference]),
with canonical pickup tiers:

- **T2 [Maintainer claim]** — upstream docs asserting replay determinism, SDK testing guides
  (e.g. Temporal's workflow-testing docs). Admissible only for *what the vendor ships*;
  never for "our reimplementation matches" claims (G14).
- **T0 [Verified]** — the evidence file's own verification method (GitHub API file
  existence + spot-checked contents); third-party differential replay results against a
  pinned oracle; banked A/A and A/B/A receipts. This is the tier CLAIM-DW-1..13 sit at.
  Thin T0 rows (CLAIM-DW-4 single-SDK, CLAIM-DW-11 absence, CLAIM-DW-13 limited scope)
  must carry their thinness label into the registry — the label is part of the evidence.
- **T2 [Maintainer claim]** — maintainer READMEs/blog posts claiming durability, replay, or
  "exactly-once" semantics without verified replay fixtures or suites (e.g. hatchet's
  durability story, restate's broader claims beyond the journal unit tests). Admissible
  as *intent*, never as *mechanism*.
- **T3 [Inference]** — compile-time/static determinism checking (UNK-DW-1); any claim
  that a from-scratch engine "inherits" Temporal's determinism guarantees; cross-host
  timer parity under real clocks. T3 rows may exist in the registry only with
  `targeted` evidence state and a named promotion predicate — never cited as results.

Rulebook mapping rides via G14 (REJECT): a claim cited above its tier's evidential
burden is demoted or rejected, and the demotion is recorded.

## Localbench bench shape

Instantiates the 13 localbench slots (`_s0/localbench-pattern.md`) for this type.

1. **Spec format** — `engine:<impl>@<commit>` naming exactly what is measured, e.g.
   `engine:temporal@<sha>`, `engine:frankenwf@<pin>`; the harness starts/stops the engine
   under test itself. Oracle arm spec pins the incumbent the same way, plus the oracle
   binary SHA-256 recorded at invocation (REQ-DW-5).
2. **Tier list** — `replay` (history-replay conformance), `journal` (journal-table unit +
   crash-recovery), `timeskip` (time-skipping functional tests), `agentreplay` (agent
   history replay), `fault` (fault-injection/simulation — slow tier), `mem` (state-store
   growth over long histories). Goldens bind PER TIER; an engine change invalidates only
   the tiers it touches.
3. **Golden schema** — JSON per spec: `conformance` (named checks, `level: MUST|SHOULD`,
   `verdict: PASS|FAIL`) — MUSTs include: canonical histories replay PASS,
   nondeterministic fixture replay FAIL-with-named-mode, journal crash-recovery PASS,
   mock-clock blocklist scan clean. `metrics` each with `value`, A/A `spread`, `tol`,
   `tol_source` → banked receipt path, `better` direction: replay throughput
   (histories/sec), journal write latency p50/p99, state-store bytes per recorded event.
   **Type-specific tolerance rule:** `tol = max(3 × A/A relative spread, floor)`, but
   wall-clock timing metrics inside virtual-clock suites are INVALID measurands — gate on
   event counts and virtual-time deltas instead (see UNK-DW-4).
   **Per-tier clock-mode table:**

   | Tier | Clock mode | Permitted measurands | Tolerance floor source |
   |---|---|---|---|
   | `replay` | Virtual clock | Event counts, virtual-time deltas | ACCEPTANCE_SURFACE.json `virtual_floor` |
   | `journal` | Virtual clock | Event counts, journal bytes, recovery outcome | ACCEPTANCE_SURFACE.json `virtual_floor` |
   | `timeskip` | Virtual clock | Virtual-time deltas (skipped durations), event counts | ACCEPTANCE_SURFACE.json `virtual_floor` |
   | `agentreplay` | Virtual clock | Event counts, virtual-time deltas | ACCEPTANCE_SURFACE.json `virtual_floor` |
   | `fault` | Virtual clock | Injected-fault outcomes, event counts | ACCEPTANCE_SURFACE.json `virtual_floor` |
   | `mem` | Wall clock allowed | State-store bytes/event (ratio, not absolute timing) | A/A spread only; absolute timings not banked |

   Virtual-clock suites assert zero wall-clock dependence (G5); any wall-clock
   timing metric inside a virtual-clock tier is an invalid measurand, not a
   tolerance problem. UNK-DW-4 (the virtual-time measurand doctrine) remains
   TARGETED for S3.
4. **Banking ceremony** — `aa <spec> --write-golden` only; two runs → banked receipt +
   golden; `git diff goldens/` review in the same commit. Golden-regeneration-until-green
   is forbidden; for this type the named variant is *fixture regeneration until replay
   passes* (re-recording histories to dodge a determinism failure).
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts or
   generations (engine/harness updates = new generation; CURRENT / GENERATION-MISMATCH /
   UNAVAILABLE per golden).
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%, names the
   processes); CONTENDED marking if any non-backend process exceeds 25% GPU in a second;
   one engine under test at a time; loopback/local-only endpoints (a failed local call is
   a finding, never a cloud fallback); park/unpark interfering residents. Virtual-clock
   suites additionally assert zero wall-clock dependence (G5).
7. **A/B discipline** — same-invocation A, B, A ordering, banked under a name; for this
   type the B arm is typically the incumbent oracle replaying the same histories (G2).
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run) + dated `.md` investigation notes; `runs/` gitignored scratch.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact engine commit + binary
   SHA-256, SDK versions, state-store/DB version, OS. The DB version matters here
   (journal durability depends on it).
10. **Claims wiring** — `registries/claims.tsv`: every public claim sentence registered
    and machine-checked against its receipt on every commit.
11. **Negative-evidence ledger** — `docs/evidence/NEGATIVE_EVIDENCE.md`,
    `DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`; seeded with: no static
    determinism analyzer exists (CLAIM-DW-11); demotions always allowed; no self-grading
    without independent verification.
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in AGENTS.md, plus
    three type-specific named variants: *replay-fixture cherry-picking* (committing only
    passing histories), *history-regeneration reflex* (re-recording fixtures until green),
    *timer-realism smuggling* (wall-clock sleeps in workflow code to "make tests pass").

**Remote-lab variant note.** Multi-node engine tests (temporal cluster-poisoning,
cadence replication simulation, cross-node replay) cannot run meaningfully on one host
under the local law. They run in a remote lab with the same receipt/golden discipline;
results are labeled by lab identity and never compared against local-host goldens.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

- **Truth-pack files** — `docs/truth-pack/HISTORIES.sha256` (history-fixture manifest),
  `docs/truth-pack/REPLAY_CONTRACT.md` (the determinism contract: what workflow code may
  and may not do — nondeterministic API blocklist), extended `ACCEPTANCE_SURFACE.json`
  with replay PASS/FAIL thresholds and the nondeterministic-fixture negative control.
- **New gates** — GATE-DW-2..3 registered in the gate registry with acceptance criteria
  (GATE-DW-1/GATE-DW-4 retired into shared GATE-005; see Gate profile);
  gate log records PASS/FAIL/N-A with evidence per gate.
- **Harness shape** — an in-process workflow test environment with mock clock (the
  `internal_workflow_testsuite.go` / `testsuite/` / `packages/testing` pattern), a
  `workflow_replayer` CLI/library, deadlock detection with a plumbed timeout, and
  `fetch-truth-pack.sh --verify` extended to verify history fixtures and the oracle
  binary SHA-256.
- **Shipped test-harness modules** — the starter kit's own `test-harness/` + `test-util/`
  Gradle/module layout (conductor pattern) so downstream users get the test workflow,
  not just docs.
- **Negative-evidence seeds** — NE-001: no static determinism analyzer exists; NE-002:
  fixture-regeneration-until-green is a forbidden variant of golden regeneration.
- **AGENTS.md additions** — the three type-specific reward-hacking variants verbatim;
  the workflow-code blocklist (wall-clock APIs) as a standing rule.
- **bench tiers** — `replay`, `journal`, `timeskip`, `agentreplay`, `fault`, `mem`
  registered as the type's localbench tier list with per-tier goldens.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Verified 2026-09-23 via GitHub API (all `pushed_at` = 2026-09-23, confirming active
maintenance; not a recency ranking). One-line process takeaway each.

- temporalio/temporal — 23,260★ — Category reference implementation; copy its
  time-skipping functional tests, fault-injection `testcore`, and sharded CI with
  flaky-test tracking.
- conductor-oss/conductor — 32,225★ — Highest-star in set; copy shipping user-facing
  `test-harness/` + `test-util/` modules as a product expectation.
- cadence-workflow/cadence — 9,448★ — Copy the `simulation/` suites (history/matching/
  replication) and the `host/onebox.go` full-stack integration pattern.
- restatedev/restate — 4,463★ — Newest generation (journal-based, Rust); copy
  journal-table unit tests as the durability-primitive pattern — but its process
  evidence is the thinnest here (CLAIM-DW-13).
- triggerdotdev/trigger.dev — 16,382★ — Replay as a *runtime product feature*
  (`replayTaskRun.server.ts`): replay is category infrastructure, not just test tech.
- hatchet-dev/hatchet — 7,990★ — Trend only: active durable task queue, but no
  determinism/time-skipping/replay practice verified in-tree.
- inngest/inngest — 5,878★ — Copy the documented dev-server + containerized E2E test
  workflow (`TESTING.md`, testcontainers for the state layer).
- apache/airflow — 46,954★ — Adjacent (task/DAG, not durable-execution); copy the
  massive sharded CI surface (`ci-amd.yml`, `ci-arm.yml`, `airflow-e2e-tests.yml`).
- dagster-io/dagster — 16,197★ — Adjacent data orchestration; trend evidence only.
- PrefectHQ/prefect — 23,907★ — Adjacent workflow orchestration; trend evidence only.
- temporalio/sdk-go — 974★ — Copy the in-process test suite with mock clock
  (`internal_workflow_testsuite.go`) and deadlock detection.
- temporalio/sdk-python — 1,197★ — Copy the replayer + recorded-history fixtures
  (including the nondeterministic negative-control fixture) and the agent-workflow
  replay tests — most exportable to agent workflows.
- temporalio/sdk-java — 433★ — Copy the `io.temporal.testing` test-environment package.
- temporalio/sdk-typescript — 922★ — Copy `packages/testing` (time-skipping env,
  ephemeral server).
- cadence-workflow/cadence-go-client — 382★ — Copy `internal/workflow_replayer.go` and
  `testsuite/` as the sibling-lineage replay pattern.

**Honest caveats (carried over from the evidence file).** No static determinism analyzer
was verified in-tree for any repo — do not cite one as an existing practice. Restate's
verification covered only journal-table unit tests and `crates/test-util`; no replay
harness or time-skipping framework was found. Hatchet is trend-only. Airflow/Dagster/
Prefect are adjacent, not durable-execution; only Airflow's CI layout was verified at
file level. Cadence moved orgs — `uber/cadence` links 404; use `cadence-workflow/`.
`conductor-oss/conductor` (32,225★) is the maintained lineage; `orkes-io/conductor`
(58★) is a separate small repo — do not confuse them. Replay/determinism practices were
verified by file existence and spot-checked contents, not by running the suites.

## Unknowns (UNK-*)

- **UNK-DW-1** — Is compile-time (static) determinism checking ("workflowcheck"-style
  analyzer) a real future practice for this type, or does the ecosystem consider runtime
  replay + deadlock detection sufficient? No such analyzer was verified in-tree for any
  repo (evidence-file caveat), so a claim of compile-time determinism checking is T3
  aspirational and unverifiable against current oracles — do not present it as an
  existing practice. Resolve before S5 or keep all static-analysis claims at T3.
  **Disposition: TARGETED.**
- **UNK-DW-2** — Restate: is a replay harness / time-skipping test framework present in
  its repo but unverified by our file-level check, or genuinely absent? Needs a deeper
  in-tree read before its thin-evidence label can be lifted.
  **Disposition: TARGETED.**
- **UNK-DW-3** — Where does durable-execution testing end and DAG-scheduler testing
  begin for hybrid platforms (trigger.dev, hatchet, inngest)? The charter excludes
  scheduler features, but the boundary is unverified for repos that blend both.
  **Disposition: TARGETED.**
- **UNK-DW-4** — How do A/A-derived goldens and the `max(3×A/A spread, floor)` tolerance
  rule apply when timers are virtual? Wall-clock metrics are invalid measurands under
  mocked clocks; the bench needs an explicit virtual-time measurand doctrine in S3.
  **Disposition: TARGETED.**
- **UNK-DW-5** — Hatchet: durable-execution or durable-task-queue — in or out of scope?
  No determinism/replay practice was verified in-tree; the scope decision needs a
  maintainer-source read, not a guess.

Counts: 13 CLAIM-DW-*, 16 active gates (G1–G14 + GATE-DW-2..3; GATE-DW-1/4 retired into shared GATE-005), 6 REQ-DW-*, 5 UNK-DW-*, 15 repos cited.
  **Disposition: TARGETED.**
