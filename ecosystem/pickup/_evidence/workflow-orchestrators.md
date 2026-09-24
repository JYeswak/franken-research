# Durable workflow orchestration — evidence

Research date: 2026-09-23. Every repo below was verified live via `api.github.com/repos/<owner>/<repo>` (star counts and `pushed_at` from the API). All `pushed_at` values returned 2026-09-23 — the verification date — which confirms active maintenance but should not be read as a recency ranking.

## Trend (owner/repo | stars | last push | why it evidences the trend)

- `temporalio/temporal` | 23,260 | 2026-09-23 | The category reference implementation: durable execution server (Go) with 5 official SDKs; defines workflow-as-code, event histories, replay.
- `conductor-oss/conductor` | 32,225 | 2026-09-23 | Netflix-originated orchestration engine; highest-star repo in this set; ships `test-harness`/`test-util` modules for users.
- `cadence-workflow/cadence` | 9,448 | 2026-09-23 | Uber-originated durable execution engine (Temporal's sibling lineage); standalone org since leaving Uber; `simulation/` suite for history/matching/replication.
- `restatedev/restate` | 4,463 | 2026-09-23 | Newest-generation durable execution (journal-based, Rust); journal tables unit-tested in-tree.
- `triggerdotdev/trigger.dev` | 16,382 | 2026-09-23 | Background-job platform with run replay as a runtime feature (`apps/webapp/app/v3/services/replayTaskRun.server.ts`) — replay is category infrastructure, not just test tech.
- `hatchet-dev/hatchet` | 7,990 | 2026-09-23 | Durable task queue (Go); active, but no determinism-specific test practice was verified in-tree.
- `inngest/inngest` | 5,878 | 2026-09-23 | Event-driven durable functions (Go); `TESTING.md` documents dev-server + Go E2E harness.
- `apache/airflow` | 46,954 | 2026-09-23 | Task/DAG orchestrator (adjacent, not durable-execution); massive CI surface verified (`.github/workflows/ci-amd.yml`, `ci-arm.yml`, `airflow-e2e-tests.yml`).
- `dagster-io/dagster` | 16,197 | 2026-09-23 | Data-orchestration adjacent; active.
- `PrefectHQ/prefect` | 23,907 | 2026-09-23 | Workflow orchestration adjacent; active.
- `temporalio/sdk-go` | 974 | 2026-09-18 | Official Go SDK; contains the in-process workflow test environment with mocked clock.
- `temporalio/sdk-python` | 1,197 | 2026-09-22 | Official Python SDK; contains `temporalio/worker/_replayer.py` and the agent-framework replay tests (most exportable to agent workflows).
- `temporalio/sdk-java` | 433 | 2026-09-21 | Official Java SDK; contains `io.temporal.testing` package.
- `temporalio/sdk-typescript` | 922 | 2026-09-22 | Official TS SDK; contains `packages/testing` (time-skipping workflow env, ephemeral server).
- `cadence-workflow/cadence-go-client` | 382 | 2026-09-23 | Cadence Go SDK; contains `internal/workflow_replayer.go` and `testsuite/`.

## Process practices worth copying

| Practice | Repos exhibiting it | File pointers (verified via GitHub API / raw fetch) |
|---|---|---|
| In-process workflow test environment with a mocked/virtual clock (time skipping; no real timers) | temporalio/sdk-go; cadence-workflow/cadence-go-client; temporalio/sdk-java; temporalio/sdk-typescript; temporalio/sdk-python | `temporalio/sdk-go`: `internal/internal_workflow_testsuite.go` (uses `clock.NewMock()`, auto-forwards mock clock, `DeadlockDetectionTimeout`); `testsuite/testsuite.go` + `testsuite/devserver.go`. `cadence-workflow/cadence-go-client`: `internal/internal_workflow_testsuite.go`, `testsuite/`. `temporalio/sdk-java`: `temporal-testing/src/main/java/io/temporal/testing/TestWorkflowEnvironment.java`. `temporalio/sdk-typescript`: `packages/testing/src/testing-workflow-environment.ts`, `packages/testing/src/ephemeral-server.ts`. `temporalio/sdk-python`: `temporalio/testing/_workflow.py`, `temporalio/testing/_activity.py` |
| Replay tests against recorded event histories (determinism checking; a deliberately nondeterministic fixture exists) | temporalio/sdk-python; cadence-workflow/cadence-go-client; temporalio/temporal (server) | `temporalio/sdk-python`: `temporalio/worker/_replayer.py`; `tests/worker/test_replayer.py` with fixtures `tests/worker/test_replayer_complete_history.json`, `tests/worker/test_replayer_nondeterministic_history.json`. `cadence-workflow/cadence-go-client`: `internal/workflow_replayer.go`. `temporalio/temporal`: `tests/gethistory_test.go`, `tests/workflow_reset_test.go` (reset = replay from a history point) |
| Agent-workflow replay tests (LLM-agent orchestration frameworks replayed from stored histories) | temporalio/sdk-python | `tests/contrib/openai_agents/test_openai_replay.py` (replays `agents-as-tools-workflow-history.json`, `customer-service-workflow-history.json`, … via `temporalio.worker.Replayer`); also `tests/contrib/langgraph/test_replay.py`, `tests/contrib/google_adk_agents/test_replay.py`, `tests/contrib/deepagents/test_replay.py`. **Most exportable to agent workflows.** |
| Deadlock detection for workflow coroutines (workflow code must yield; blocks are failures) | temporalio/sdk-go | `temporalio/sdk-go`: `internal/workflow_deadlock_test.go`; deadlock timeout plumbed in `internal/internal_workflow_testsuite.go` |
| Time-skipping at the server functional-test level | temporalio/temporal | `temporalio/temporal`: `tests/timeskipping_test.go`, `tests/timeskipping_fast_forward_test.go`, `tests/timeskipping_propagation_test.go` |
| Fault-injection / cluster-poisoning / simulation harness for the engine itself | temporalio/temporal; cadence-workflow/cadence | `temporalio/temporal`: `tests/testcore/fault_injection.go`, `tests/testcore/cluster_poison_test.go`, `tests/testcore/history_task_recorder.go`, `tests/testcore/onebox.go`. `cadence-workflow/cadence`: `simulation/history/history_simulation_test.go` (+ `simulation/history/testdata/`, `simulation/history/workflow/`, `run.sh`), `simulation/matching/`, `simulation/replication/` |
| Journal/event-history tables unit-tested as the durability primitive | restatedev/restate | `restatedev/restate`: `crates/partition-store/src/tests/journal_table_test/mod.rs`, `crates/partition-store/src/tests/journal_events_table_test/mod.rs`, `crates/partition-store/src/tests/journal_table_v2_test/mod.rs`; shared fixtures in `crates/test-util/src/lib.rs` |
| Shipped user-facing test harness modules | conductor-oss/conductor | `conductor-oss/conductor`: `test-harness/`, `test-util/` (top-level Gradle modules) |
| Dev-server + containerized E2E testing documented as the test workflow | inngest/inngest | `inngest/inngest`: `TESTING.md` (`go run ./cmd dev --no-discovery`, then `go test ./tests`); state-layer tests use testcontainers (`pkg/execution/state/redis_state` tests; `vendor/github.com/testcontainers/testcontainers-go`) |
| Heavy, sharded CI with flaky-test tracking | temporalio/temporal; apache/airflow | `temporalio/temporal`: `.github/workflows/run-tests.yml`, `optimize-test-sharding.yml`, `flaky-tests-report.yml`. `apache/airflow`: `.github/workflows/ci-amd.yml`, `ci-arm.yml`, `airflow-e2e-tests.yml`, `ci-image-build.yml` |
| In-process integration tests spanning the full stack ("onebox") | cadence-workflow/cadence | `cadence-workflow/cadence`: `host/onebox.go`, `host/integrationbase.go`, `host/*_integration_test.go` |
| Replay as a runtime product feature (reset/re-run from history) | triggerdotdev/trigger.dev | `triggerdotdev/trigger.dev`: `apps/webapp/app/v3/services/replayTaskRun.server.ts`, `apps/webapp/app/v3/replayTask.ts`, `apps/webapp/app/routes/api.v1.runs.$runParam.replay.ts` |

## Notes / caveats

- **Thin evidence, stated honestly:** no static determinism analyzer ("workflowcheck"-style) was verified in-tree for any repo — the determinism story is runtime replay + deadlock detection, not compile-time checking. Do not cite a static analyzer as an existing practice.
- **Restate:** only the journal-table unit tests and `crates/test-util` were verified; no verified replay harness or time-skipping test framework found. Its process evidence is the thinnest among the durable-execution engines.
- **Hatchet:** active and on-trend, but no determinism/time-skipping/replay test practice was verified in-tree — cited for trend only.
- **Airflow / Dagster / Prefect** are task/DAG orchestrators, not Temporal-class durable execution; included as category-adjacent trend evidence. Only Airflow's CI layout was verified at the file level.
- **Cadence moved orgs** (`uber/cadence` no longer exists; now `cadence-workflow/cadence`, server 9,448★, go-client 382★) — old links/attributions to `uber/cadence` will 404.
- `conductor-oss/conductor` (32,225★) is the maintained fork lineage; `orkes-io/conductor` (58★) is a separate small repo — do not confuse them.
- The determinism/replay/testing practices above are verified by file existence and spot-checked contents, not by running the suites; replay-JSON fixtures and the `test_replayer_nondeterministic_history.json` fixture were confirmed present in the API tree.
