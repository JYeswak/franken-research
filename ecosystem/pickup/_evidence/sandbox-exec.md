# Sandboxed code execution - evidence

Technology: sandboxed code execution for agents (E2B-class: firecracker/microVM sandboxes, code-interpreter APIs, sandbox escape accounting). All repos verified 2026-09-23 via `api.github.com` and raw file fetches. No repo cited from memory.

## Trend (one line per repo: owner/repo | stars | last push | why it evidences the trend)

| owner/repo | stars | last push (UTC) | why it evidences the trend |
|---|---|---|---|
| e2b-dev/E2B | 13,934 | 2026-09-22 | The reference open-source agent sandbox: SDKs (js/python), code-interpreter + desktop sandboxes, Firecracker-based microVM fleet; CI has dedicated per-SDK test workflows (`js_sdk_tests.yml`, `python_sdk_tests.yml`, `code_interpreter_*_tests.yml`) |
| e2b-dev/code-interpreter | 2,415 | 2026-09-10 | Standalone SDK for running AI-generated code (Python & JS/TS); evidences the "code-interpreter API" sub-category as its own product surface |
| daytonaio/daytona | 71,725 | 2026-07-24 | Highest-starred sandbox-for-agents repo ("Secure and Elastic Infrastructure for Running AI-Generated Code"); see caveat below — core dev moved private June 2026, main branch now a tombstone README |
| cloudflare/sandbox-sdk | 1,138 | 2026-09-23 | Hyperscaler entry: runs sandboxed code environments on Cloudflare's edge; has a scheduled daily `performance.yml` with cold-start / burst-startup / backup-restore scenarios, plus `pr-privileged.yml` for privileged e2e |
| vercel/sandbox | 201 | 2026-09-23 | Ephemeral compute primitive for untrusted/user-generated code; ships hardened multi-distro images (`images/al-base`, `al-node`, `al-python`, `ubuntu`, `universal`, `docker-bake.hcl`) and a mock package (`vercel-sandbox-mock`) for local dev |
| firecracker-microvm/firecracker | 36,898 | 2026-09-23 | The microVM substrate under E2B/Daytona-class sandboxes; most complete isolation-test battery in the set (dedicated `tests/integration_tests/security/`, `performance/`, `functional/` suites, Buildkite CI) |
| google/gvisor | 19,403 | 2026-09-23 | Application-kernel sandbox (runsc) — the syscall-interposition alternative to microVMs; has `test/secbench` (seccomp-bpf filter benchmarking) and extensive `test/e2e`, `test/runtimes` suites |
| kata-containers/kata-containers | 8,879 | 2026-09-23 | Lightweight-VM container runtime (CNCF); multi-arch CI matrix (`basic-ci-amd64/s390x`, `build-checks-ppc64le/riscv64`); evidences VM-grade isolation as the enterprise default under agent sandboxes |

Adopters (from repo docs, not from memory): E2B's README positions it as infra for AI agents generally; Cloudflare Sandbox SDK ships examples for claude-code, codex, opencode (`examples/`); Vercel Sandbox examples include `workflow-code-runner`, `dev-server`, `filesystem-snapshots`. Firecracker is AWS's serverless substrate (per its own README history); Kata is CNCF.

## Process practices worth copying (practice | repos exhibiting it | file pointers)

**How isolation is verified — the adversarial tests (most exportable):**

| practice | repos | file pointers |
|---|---|---|
| Jailer / chroot confinement tests: assert uid/gid, exact file permission bits, device nodes inside the jail, and rlimits (`no-file=1024`, `fsize`) set by the jailer | firecracker | `firecracker-microvm/firecracker:tests/integration_tests/security/test_jail.py` (REG_PERMS/DIR_STATS assertions, `RESOURCE_LIMITS`) |
| Seccomp filter validation: verify the BPF filter actually blocks the forbidden syscall set, plus custom-seccomp tests for user-supplied filters | firecracker | `tests/integration_tests/security/test_seccomp.py`, `test_custom_seccomp.py`, `test_seccomp_validate.py` |
| Known-vulnerability regression: run third-party Spectre/Meltdown checker inside the guest and diff host-vs-guest mitigation state | firecracker | `tests/integration_tests/security/test_vulnerabilities.py` (fetches `spectre-meltdown-checker.sh`, compares `/sys/devices/system/cpu/vulnerabilities` host vs guest) |
| Audit tests: assert expected audit/seccomp violation events fire | firecracker | `tests/integration_tests/security/test_sec_audit.py` |
| Seccomp-bpf filter benchmarking (cost of the isolation mechanism itself) | gvisor | `google/gvisor:test/secbench/secbench.go`, `test/secbench/runner.go`, `test/secbench/secbenchdef` |
| Signed-access auth tests at sandbox layer: signed download URLs, reconnect auth, independent reimplementation of the signature (WebCrypto vs node:crypto) to catch implementation-coupled tests | e2b-dev/E2B | `packages/js-sdk/tests/sandbox/secure.test.ts` |

**Startup-latency / boot-time benchmarks:**

| practice | repos | file pointers |
|---|---|---|
| Boot-to-init time spec test: parse `Guest-boot-time` from guest logs, assert within spec | firecracker | `tests/integration_tests/performance/test_boottime.py` |
| Process startup time + memory overhead + snapshot restore performance | firecracker | `tests/integration_tests/performance/test_process_startup_time.py`, `test_memory_overhead.py`, `test_snapshot.py` |
| Buildkite A/B performance pipeline: perf tests run as A/B comparisons against baseline on PRs | firecracker | `.buildkite/pipeline_perf.py`, GH workflow `.github/workflows/trigger_ab_tests.yml`, `tools/ab_test.py` |
| Sandbox creation/health/first-run latency benchmark with matplotlib output, iteration count via env var | e2b-dev/E2B | `packages/code-interpreter-python/tests/performance.py` (`E2B_TESTS_BENCHMARK_ITERATIONS_COUNT`) |
| Scheduled daily performance workflow: cold-start, sustained-throughput, bursty-traffic, concurrent-creation, burst-startup, file-io, backup-restore scenarios | cloudflare/sandbox-sdk | `.github/workflows/performance.yml` (cron `0 0 * * *`, `workflow_dispatch` scenario picker) |

**Resource-limit enforcement tests:**

| practice | repos | file pointers |
|---|---|---|
| Rate limiter tests (block/net I/O throttling): drive rate limiter, network rate limiter | firecracker | `tests/integration_tests/performance/test_drive_rate_limiter.py`, `test_rate_limiter.py` |
| Execution timeout test at SDK layer | e2b-dev/E2B | `packages/code-interpreter-python/tests/test_execute_timeout.py` |
| Timeout + kill lifecycle tests | e2b-dev/E2B | `packages/js-sdk/tests/sandbox/timeout.test.ts`, `kill.test.ts` |

**CI structure worth copying:**

| practice | repos | file pointers |
|---|---|---|
| Per-package test workflows (one workflow per SDK/surface, not one mega-workflow) | e2b-dev/E2B | `.github/workflows/{js_sdk_tests,python_sdk_tests,code_interpreter_js_tests,code_interpreter_python_tests,desktop_js_tests,desktop_python_tests,cli_tests}.yml` |
| Sanitizer + coverage + cross-arch + docker-popular-container pipelines as separate Buildkite pipelines | firecracker | `.buildkite/pipeline_sanitizers.py`, `pipeline_coverage.py`, `pipeline_cross.py`, `pipeline_docker_popular.py`, `pipeline_release_qa.py` |
| Merge-queue + privileged-PR split (dangerous e2e tests only run with extra approval) | cloudflare/sandbox-sdk | `.github/workflows/merge-queue.yml`, `pr-privileged.yml`, `pr.yml`, `reusable-bridge-e2e.yml` |
| Mock package for local testing without cloud infra | vercel/sandbox | `packages/vercel-sandbox-mock` |
| Multi-arch build-check matrix (amd64/arm64/ppc64le/s390x/riscv64) | kata-containers | `.github/workflows/basic-ci-amd64.yaml`, `basic-ci-s390x.yaml`, `build-checks-ppc64le.yaml`, `build-checks-preview-riscv64.yaml` |
| Conformance-style syscall/runtime suites for isolation-layer correctness | gvisor | `test/e2e/` (`exec_test.go`, `integration_test.go`), `test/runtimes/` |
| Stress/soak/stability suite separate from functional tests | kata-containers | `tests/stability/` (`stressng.sh`, `soak_parallel_rm.sh`, `agent_stability_test.sh`) |

## Notes / caveats (be honest about thin evidence)

- **No true "sandbox escape" pentest was found in any repo's tree.** The closest adversarial practices are Firecracker's jailer/seccomp/vulnerability-regression tests and gVisor's secbench. None of the agent-facing SDK repos (E2B, Cloudflare, Vercel) publish escape-attempt tests; they delegate isolation to the substrate (Firecracker microVMs / Workers isolate / Docker) and test at the SDK/API layer. A clean-room project should treat "adversarial escape test suite" as a gap to fill, not a practice to copy.
- **E2B's `secure.test.ts` is about signed-URL auth, not isolation** — don't cite it as an escape test. Its genuinely exportable idea is the independent reimplementation of the signature scheme in the test to avoid implementation-coupled assertions.
- **Daytona is no longer open-source-maintained.** README on main (verified 2026-09-23): "As of June 2026, Daytona's core development has moved to a private codebase." The repo is a 3-file tombstone (README + 2 logos) with 71,725 legacy stars. It evidences historical demand, not a live project to copy CI from.
- **vercel/sandbox is young** (201 stars) but pushed today with real structure (images, mock, examples); treat as emerging, not proven.
- **modal-labs/modal does not exist** as a repo (API returns Not Found); dropped per the verifiability rule.
- Firecracker CI is primarily Buildkite (`.buildkite/`), not GitHub Actions — the `.github/workflows/` dir is mostly release/dirty-lock bookkeeping. Copy the pipeline-separation idea, not the vendor.
- gVisor's `test/secbench` benchmarks the *cost* of seccomp filtering, it does not adversarially test the filter's completeness; filter-correctness there rests on the syscall test matrix.
