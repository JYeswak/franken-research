# Pickup companion: Sandboxed code execution

Scope note: this file covers **sandboxed code execution for agentic workloads**
(E2B-class agent sandboxes, code-interpreter APIs, microVM / application-kernel
isolation substrates). Read the evidence file first for all verified repo data.

## Charter seed

**What this project type is.** Infrastructure that runs untrusted,
agent-generated code under an explicit isolation boundary — microVM substrates
(Firecracker-class), application-kernel/syscall-interposition runtimes (gVisor
`runsc`-class), lightweight-VM container runtimes (Kata-class), and the
agent-facing SDK/API layers that expose "run this code" to models (E2B-class,
Cloudflare/Vercel sandbox SDKs, standalone code-interpreter SDKs).

**In scope.** Isolation-boundary implementation or port; adversarial
verification of the boundary (jailer confinement, seccomp filters, known-vuln
regression, audit events); startup-latency and resource-limit behavior as
measured bench properties; SDK/API parity against an incumbent; CI structure
that treats privileged e2e as dangerous.

**Out of scope.** Orchestration over sandboxes (that's agent-frameworks /
workflow-orchestrators); sandbox *images* as a product (unless the project
type is the image builder); security auditing as a service — this type builds
the box, it does not sell the pentest.

**What "a good starting point" means for this type.** A pinned threat model
("who is untrusted, what 'contained' means") before any code; a truth pack
that pins the substrate binary and guest image by SHA-256; an adversarial test
suite that can fail (not a config checklist); boot-time and limit-enforcement
banked as bench properties with A/A-derived tolerances; CI that splits
privileged e2e behind approval. Isolation is the product — if the isolation
tests can't fail, nothing else matters.

### Requirements

- **REQ-1 (threat model first).** The charter names the threat model, the
  substrate class (microVM / app-kernel / lightweight-VM / process-container),
  and the guest/host split. No sandbox work ships without a written
  containment claim.
- **REQ-2 (adversarial isolation suite).** Every isolation claim has a check
  that can fail: at minimum jailer-confinement assertions (uid/gid, permission
  bits, device nodes, rlimits), seccomp filter validation against a forbidden
  syscall set, and known-vulnerability regression (host-vs-guest mitigation
  diff). The forbidden syscall set and escape-vector list are pinned as
  truth-pack fixtures with a review date (per shared GATE-007) and are
  diff-reviewed on any substrate generation change (kernel/driver/toolchain
  update = new generation). SDK layers that delegate isolation to a substrate
  must document the delegation and still test their own boundary (auth,
  signed URLs, timeouts).
- **REQ-3 (cold-start is a first-class metric).** Boot-to-init, sandbox
  creation, first-run latency, and snapshot-restore latency are banked per
  backend with A/A-derived goldens. Agent workflows are latency-driven; an
  unmeasured cold start is an unshipped feature.
- **REQ-4 (limits enforced, not configured).** Execution timeouts, kill
  lifecycle, and block/net I/O rate limits are tested behaviorally — actually
  throttled, actually killed — not merely present in config.
- **REQ-5 (risk-tiered CI).** Dangerous e2e runs behind an approval gate
  (privileged-PR split); one workflow per surface, not one mega-workflow; a
  mock or local-mode package so developers test without cloud infra.
- **REQ-6 (invocation-time identity).** Every binary and guest image that
  participates in a measurement has its SHA-256 recorded at invocation time.
  No unrecorded executable is admissible evidence (whisper's CAMPAIGN-WIN
  rule, applied to images).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

The oracle for a sandbox is not a single binary — it is a **pinned substrate
+ adversarial test suite + reference workload behavior**. Candidates named in
the evidence file:

1. **Firecracker integration test battery** (`firecracker-microvm/firecracker`):
   `tests/integration_tests/security/` (jailer, seccomp, custom-seccomp,
   seccomp-validate, vulnerabilities, sec-audit) and
   `tests/integration_tests/performance/` (boottime, process startup, memory
   overhead, snapshot, rate limiters). The most complete isolation battery in
   the evidence set.
2. **gVisor `test/e2e` + `test/runtimes` + `test/secbench`**
   (`google/gvisor`): conformance-style syscall/runtime suites for
   isolation-layer correctness; `secbench` measures the *cost* of the seccomp
   filter (not its completeness — see UNK-4 and CLAIM-10).
3. **Cloudflare `performance.yml` scenario set** (`cloudflare/sandbox-sdk`):
   cold-start, sustained-throughput, bursty-traffic, concurrent-creation,
   burst-startup, file-io, backup-restore as a *named, scheduled* bench the
   incumbent runs daily — an oracle for latency/throughput behavior.
4. **E2B SDK test layout** (`e2b-dev/E2B`): per-surface test workflows and
   timeout/kill lifecycle tests as the oracle for SDK-layer behavior parity.
5. **Reference workload behavior**: the same agent-generated workload run
   against the incumbent substrate and the port, with host state recorded —
   a differential oracle in the whisper sense (same-invocation A/B).

**Integrity checks (truth-pack shape, adapted).** `docs/truth-pack/` holds:
- `PIN_RECORD.md` — pinned substrate commit + release, guest image digests
  (per-distro), seccomp-profile hash, jailer flags; honest note on anything
  newer than the pin (tts pattern).
- `MANIFEST.sha256` — every fixture: forbidden-syscall list, jailer
  permission-bit expectations, vuln-checker script (pin the third-party
  `spectre-meltdown-checker.sh` version — Firecracker fetches it live; a
  port must not).
- `ACCEPTANCE_SURFACE.json` — break-even thresholds: max boot-time budget,
  max first-run latency, required escape-suite pass set (which adversarial
  checks are MUST vs SHOULD).
- `NONDETERMINISM_FLOOR.md` — microVM boot jitter is real; name the floor
  before banking (see UNK-3).
- `fetch-truth-pack.sh --verify` — pulls substrate source pin, guest images
  by digest, fixtures; verifies all hashes; refuses to proceed on mismatch.
- **Invocation-time recording**: binary + image SHA-256 logged per run into
  the receipt (REQ-6). The oracle binaries are pinned artifacts, not "latest".

**UNK-1** — No evidence repo publishes a true sandbox-escape pentest suite,
so there is no independently maintained escape-vector list to pin as oracle.
Until one exists, the adversarial oracle is the substrate's security suite,
and unattempted vectors are UNK-2, not "passing".
**Disposition: TARGETED** — forward reference to the canonical UNK-1 row in Unknowns; escape-vector oracle parked per round-3 triage: S3 truth-pack assembly builds and pins the vector list (per shared-gates.md GATE-007: maintained and version-pinned, with per-vector provenance), and a red-then-green suite must exist that FAILS on the unhardened substrate and PASSES after hardening. Unattempted vectors are typed UNKs, never implied passes.

## Initial claims (CLAIM-*)

Claims are about the **type's process norms**, not any repo's marketing.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-1 | Sandboxed code execution for agents is a live, active category: 7 of 8 evidence repos pushed within ~2 weeks of 2026-09-23, including 3 same-day pushes. | `e2b-dev/E2B`, `cloudflare/sandbox-sdk`, `vercel/sandbox`, `firecracker-microvm/firecracker`, `google/gvisor` (trend table, evidence file) | T0 | High | ADMISSIBLE |
| CLAIM-2 | The type's mature substrate projects verify isolation adversarially: jailer confinement assertions (uid/gid, permission bits, rlimits), seccomp filter validation incl. user-supplied filters, third-party vuln regression (host-vs-guest mitigation diff), and audit-event assertions. | `firecracker-microvm/firecracker` `tests/integration_tests/security/test_jail.py`, `test_seccomp.py`, `test_custom_seccomp.py`, `test_seccomp_validate.py`, `test_vulnerabilities.py`, `test_sec_audit.py` | T0 | High | ADMISSIBLE |
| CLAIM-3 | The type's architectural norm is an SDK/substrate test-boundary split: agent-facing SDK repos test the API layer (auth, timeouts, kill lifecycle) and delegate isolation to a substrate, without escape-attempt tests at their own boundary. | `e2b-dev/E2B` `.github/workflows/{js_sdk_tests,python_sdk_tests,…}.yml`, `packages/js-sdk/tests/sandbox/secure.test.ts`, `timeout.test.ts`, `kill.test.ts`; `cloudflare/sandbox-sdk` `.github/workflows/pr-privileged.yml` (thin: split is inferred from test-suite contents, not stated in docs) | T0 | High | ADMISSIBLE |
| CLAIM-4 | No true sandbox-escape pentest was found in any evidence repo's tree. "Adversarial escape test suite" is a gap the type has not filled, not a practice to copy. | evidence file caveats (verified across all 8 trees 2026-09-23) | T0 | High | ADMISSIBLE |
| CLAIM-5 | Boot/cold-start latency is a first-class bench metric for the type, measured as A/B comparisons against baseline, not single runs: Firecracker's Buildkite A/B perf pipeline (`pipeline_perf.py`, `tools/ab_test.py`), Cloudflare's scheduled daily `performance.yml` scenarios, E2B's `performance.py` with iteration counts via env var. | `firecracker-microvm/firecracker` `.buildkite/pipeline_perf.py`, `tools/ab_test.py`; `cloudflare/sandbox-sdk` `.github/workflows/performance.yml`; `e2b-dev/E2B` `packages/code-interpreter-python/tests/performance.py` | T0 | High | ADMISSIBLE |
| CLAIM-6 | The type's CI norm is risk-tiered: per-surface workflows (not one mega-workflow), merge-queue with a privileged-PR split for dangerous e2e, and a mock/local-mode package so developers test without cloud infra. | `e2b-dev/E2B` `.github/workflows/{js_sdk_tests,python_sdk_tests,code_interpreter_js_tests,code_interpreter_python_tests,desktop_js_tests,desktop_python_tests,cli_tests}.yml`; `cloudflare/sandbox-sdk` `merge-queue.yml`, `pr-privileged.yml`; `vercel/sandbox` `packages/vercel-sandbox-mock` | T0 | High | ADMISSIBLE |
| CLAIM-7 | Resource-limit enforcement is tested behaviorally (driven rate limiters, real timeouts, kill lifecycle), not asserted from config presence. | `firecracker-microvm/firecracker` `tests/integration_tests/performance/test_drive_rate_limiter.py`, `test_rate_limiter.py`; `e2b-dev/E2B` `packages/code-interpreter-python/tests/test_execute_timeout.py` | T0 | High | ADMISSIBLE |
| CLAIM-8 | Two isolation paradigms coexist as norms for the type: microVM isolation (Firecracker, Kata) and application-kernel / syscall-interposition (gVisor `runsc`). A port must name which paradigm its boundary belongs to (REQ-1). | `firecracker-microvm/firecracker` trend row; `google/gvisor` trend row; `kata-containers/kata-containers` trend row | T0 | High | ADMISSIBLE |
| CLAIM-9 | "Daytona evidences live trend leadership for this type." | `daytonaio/daytona` (71,725 stars, main-branch README 2026-09-23: "core development has moved to a private codebase" June 2026; repo is a 3-file tombstone) | T0 | Medium | CONTESTED |
| CLAIM-10 | "E2B's `secure.test.ts` is an isolation/escape test." | `e2b-dev/E2B` `packages/js-sdk/tests/sandbox/secure.test.ts` (tests signed-URL auth and reconnect auth; genuinely exportable idea is the independent WebCrypto-vs-node:crypto signature reimplementation, not isolation) | T0 | — | WITHDRAWN |
| CLAIM-11 | Filter-cost benchmarking and filter-completeness testing are separate concerns: gVisor's `secbench` measures the cost of seccomp filtering; correctness there rests on the syscall test matrix. Don't cite a cost bench as adversarial evidence. | `google/gvisor` `test/secbench/secbench.go`, `runner.go`; `test/e2e/` (thin: separation is inferred from suite structure) | T0 | High | ADMISSIBLE |
| CLAIM-12 | Mock/local-mode sandbox packages are an emerging developer-experience pattern for infra-dependent sandboxes. | `vercel/sandbox` `packages/vercel-sandbox-mock` (thin: single repo, 201 stars — emerging, not proven; do not cite as a type norm yet) | T3 | Low | CONTESTED |

CLAIM-9 is CONTESTED as stated (the admissible form is CLAIM-1 minus Daytona:
"Daytona's star count evidences historical demand, not a live project"). Any
competitive claim that depends on Daytona as a live incumbent is demoted to
T3 until an independent rerun exists.

## Gate profile

**G1–G14 applicability for this type** (definitions from the ecosystem digest;
gate names: ORACLE, PAIR, OWN, CONTRACT, HOST, UNSAFE, REVIEW, RULEBOOK, IOU,
MIRI, LAYOUT, AUDIT, NOSTUB, REJECT):

- **G1 ORACLE — load-bearing, type-parameterized.** Oracle inventory =
  pinned substrate binary + guest image digests + adversarial test suite +
  reference workload behavior. Post-pin changes need the two-party waiver.
  Extra shield rule for this type: the sandbox under test must not share a
  kernel/namespace with the measuring agent — the oracle is shielded from the
  implementer *and* from the workload.
- **G2 PAIR — applies with type parameters.** Paired contract = same-workload,
  same-invocation A/B across backends (incumbent vs port) for latency and
  isolation differential; A/A nulls banked first. (Mechanism per starter-kit /
  ATLAS registry; this profile only names the pairing.)
- **G3 OWN — applies as-is.** Binds to the ATLAS R7 `owner` field on every
  CLAIM row.
- **G4 CONTRACT — applies as-is.** Claim artifacts for this type include the
  threat-model document (REQ-1) — a claim without its threat model fails G4.
- **G5 HOST — load-bearing.** MicroVM boot jitter and cloud-tenancy noise are
  host confounds (Rulebook §4.5). Goldens bind strictly per
  `goldens/<host_id>/`; cross-host comparison is forbidden; sandbox benches
  never run on shared dev machines.
- **G6 UNSAFE — applies as-is.** Every new unsafe site (jailer/seccomp
  boundary code, any Rust `unsafe` in the substrate) carries `// SAFETY:`;
  the tree-wide unsafe inventory remains accounted for (canonical G6,
  playbook G1–G14 operational definitions).
- **G7 REVIEW — load-bearing.** Split-context adversarial review with
  default-refute is mandatory for escape-surface and threat-model changes
  (`[T-B5]`); an isolation claim reviewed only by its author is unreviewed.
- **G8 RULEBOOK — applies as-is** (`[T-B3]`, trial-before-scale).
- **G9 IOU — applies as-is.** Zero unresolved IOUs at close; escape-vector
  unknowns may not be closed as IOUs.
- **G10 MIRI — conditional.** Applies wherever the port contains Rust
  `unsafe`; advisory for pure SDK-layer projects (no substrate code).
- **G11 LAYOUT — conditional.** Applies for substrate ports (layout
  assertions on the isolation boundary's memory model); advisory for SDK
  layers.
- **G12 AUDIT — applies as-is** (`[T-B10]`): an escape-vector class-fix is
  followed by instance re-audit across every surface that class touches.
- **G13 NOSTUB — applies as-is**, sharpened: a placeholder isolation check
  (a test that cannot fail) is a stub.
- **G14 REJECT — applies as-is** (`[T-N1]`/`[T-N7]`): claims violating their
  tier's evidential burden are rejected — e.g. "escape-proof" without a
  published adversarial suite is T3 and fails G14.

**New type-specific gates (GATE-SB-*):**

- **GATE-SB-1 ISOLATION-BOUNDARY — RETIRED into shared GATE-007** (S4 round 1,
  dedup). GATE-007 acceptance (1)–(5) already cover confinement tests,
  seccomp/BPF, known-vulnerability regression, resource enforcement, and the
  red-then-green adversarial escape suite. Retained as a type-specific
  parameter: the threat model MUST name the untrusted party, the contained
  asset, and the paradigm (REQ-1).
  A port that cannot demonstrate a red-then-green cycle fails the gate.
- **GATE-SB-2 ESCAPE-LEDGER.** Acceptance: `docs/evidence/ESCAPE_LEDGER.md`
  lists attempted vectors with negative controls and outcomes; unattempted
  vectors are registered as UNK-*, not silently passing. Demotion rule:
  discovering an unattempted vector demotes dependent "isolated" claims to
  T3.
- **GATE-SB-3 COLD-START-GOLDEN.** Acceptance: boot-to-init, sandbox
  creation, first-run latency, and snapshot-restore are banked per backend in
  localbench goldens with A/A-derived tolerances; any public latency claim is
  backed by an A/B receipt against the pinned incumbent, same invocation,
  A-B-A ordering. Single-run latency numbers are inadmissible.
- **GATE-SB-4 LIMIT-ENFORCEMENT — RETIRED into shared GATE-007** (S4 round 1, dedup). GATE-007 acceptance (4) already requires resource-limit enforcement tests (CPU/mem/IO throttling, execution timeout, timeout+kill lifecycle). Retained as a type-specific parameter: tests run in CI (privileged tier where needed) and exercise real throttling/killing; a limit that is only configured is a limit that fails the gate.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Isolation claims rest on pinned substrate binaries + guest-image digests named in the oracle inventory |
| GATE-007 (Sandbox escape + resource accounting) | Load-bearing | Applies to this slug; adversarial isolation suite + resource-limit enforcement (REQ-2, REQ-4; GATE-SB-1/4 retired into 007) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; mock/local-mode package for dev without cloud infra (REQ-5) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; risk-tiered CI, approval-gated dangerous e2e (REQ-5) |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; substrate versions, kernel, guest image digests (incumbents.md) |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; soak/stability tiers, golden-regeneration forbidden |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), mapped to the
localbench/model-guide evidence vocabulary ([Verified] with
[Counted]/[Git-observed]/[Code-verified]/[CI-observed]; [Maintainer claim];
[External]; [Inference]):

- **T0 [Verified].** Admissible: [Verified] + [CI-observed] artifacts the
  vendor itself banks — e.g. a scheduled `performance.yml` run receipt with
  the scenario, host, and binary/image SHA-256 recorded; a signed
  guest-image digest. Burden: reproducible by hash, invocation-time
  identities recorded. A CI badge alone is not T0 (badges attest the suite
  ran, [CI-observed] — not that it is green).
- **T0 [Verified].** Admissible: the assessing agent re-ran the substrate's
  security/performance suite locally ([Code-verified] + own receipts), or
  independently reimplemented an assertion (E2B's signature
  reimplementation pattern). Burden: own machine-state receipts,
  `goldens/<host_id>/` binding, A/A nulls in range.
- **T2 [Maintainer claim].** Admissible only for non-competitive,
  non-isolation claims: README statements, example code, unverified
  workflow files. Isolation and competitive claims at T2 are demoted to T3
  by G14.
- **T3 aspirational.** [Inference], [TARGETED], roadmap statements, legacy
  signals (Daytona stars). Must be labeled TARGETED; may justify starting
  work, never a public claim.

Cross-tier rule: no isolation claim above the tier of its adversarial check.
A T2-described filter with a T1-rerun jailer suite yields a T2 claim, not a
T1 claim. Negative evidence (failed A/A nulls, red escape checks,
NO-ADMISSIBLE-VERDICT rows) is published in-tree in the negative-evidence
ledger, never buried.

## Localbench bench shape

1. **Spec format.** `backend:sandbox-image` — e.g.
   `firecracker:v1.11.0+guest-ubuntu22.04@sha256:<digest>`,
   `gvisor:runsc-<commit>+<guest>`, `e2b:sdk-py-<ver>+firecracker-<img>`.
   The spec names the hypervisor binary AND the guest image; the harness
   starts/stops the sandbox fleet itself. Guest image digest is part of the
   identity — change the image, change the spec.
2. **Named tiers.** `cold` (boot-to-init, sandbox creation), `warm` (reuse),
   `firstrun` (code-interpreter first execution latency), `throttle`
   (rate-limit behavior), `mem` (memory overhead), `escape` (adversarial
   suite runtime — measured, not asserted), `soak` (stability: kata
   `tests/stability/` pattern). Goldens bind PER TIER; a substrate update
   re-banks only the tiers it touches.
3. **Golden schema.** JSON per spec: `conformance` (named checks with
   `level: MUST|SHOULD`, `verdict: PASS|FAIL` — MUST includes jailer
   assertions, seccomp blocks, timeout/kill enforcement) +
   `metrics` (`value`, `spread` from A/A, `tol`, `tol_source` → banked
   receipt path, `better` direction).
4. **Tolerance rule.** `tol = max(3 × A/A relative spread, floor)`; floor is
   tier-aware: 5% for `cold`/`firstrun` (microVM boot jitter), 1% for `mem`.
   Only banking ceremony writes goldens (`aa <spec> --write-golden`, refuses
   unsound A/A pairs, `git diff goldens/` review in the same commit);
   golden-regeneration-until-green is a named forbidden pattern.
5. **Host/generation binding.** `goldens/<host_id>/`; never compared across
   hosts or generations. Status CURRENT / GENERATION-MISMATCH / UNAVAILABLE
   per golden.
6. **Measurement law.** Preflight refuses a busy machine (GPU/CPU > 25%,
   names the processes); runs marked CONTENDED on interference; one sandbox
   under test at a time; loopback/local-only endpoints — **no cloud fallback**
   (a failed local call is a finding). **Remote-lab variant:** escape
   accounting and any test that needs hostile tenancy cannot run under the
   local law; it runs in a remote lab with the same receipt discipline, and
   its receipts are marked `lab:` in the spec — never mixed with local
   goldens.
7. **A/B discipline.** Same-invocation A, B, A ordering (incumbent/port
   same-invocation duels for CAMPAIGN-class claims); banked under a name.
8. **Receipts.** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run, escape) + dated investigation notes;
   `runs/` gitignored scratch. Every receipt records hypervisor SHA-256,
   guest image digest, seccomp-profile hash, jailer flags, host state.
9. **Incumbent pins.** `docs/evidence/incumbents.md`: exact substrate
   version + hashes, harness version, OS/kernel, guest image digests.
10. **Claims registry wiring.** `registries/claims.tsv`: every public claim
    sentence registered and machine-checked against its receipt on every
    commit; isolation claims additionally reference their ESCAPE_LEDGER row.
11. **Negative-evidence ledger.** `docs/evidence/NEGATIVE_EVIDENCE.md`,
    `DISCREPANCIES.md`, `ESCAPE_LEDGER.md`, `demotion-rules.md` — demotions
    always allowed; no self-grading without independent verification.
12. **Anti-reward-hacking law.** The 12 forbidden patterns verbatim in
    AGENTS.md, with this type's sharp edges called out: gate self-weakening
    on isolation checks, golden regeneration on boot-time, tautological
    escape tests (checks that cannot fail), and bench-path hardcoding to a
    warm sandbox.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **`harness/adversarial/` template suite** — jailer-confinement assertions
   (uid/gid, permission bits, device nodes, rlimits), seccomp filter
   validation + custom-filter tests, known-vuln regression harness with a
   pinned checker script, audit-event assertions (Firecracker security-suite
   pattern). Ships with a red-then-green mutation demo for shared GATE-007.
2. **GATE-SB-2..3 registry entries** with the acceptance criteria above (GATE-SB-1/GATE-SB-4 retired into shared GATE-007),
   wired into the playbook's step-22 gate log (PASS/FAIL/N-A + evidence).
3. **Truth-pack template for image pins** — `PIN_RECORD.md` extended with
   guest-image digest slots and hypervisor SHA slots; `fetch-truth-pack.sh
   --verify` pulls prebuilt images by digest; `ACCEPTANCE_SURFACE.json`
   schema gains boot-time budgets and the MUST/SHOULD escape-check set.
4. **CI templates** — per-surface workflow split, merge-queue +
   privileged-PR split for dangerous e2e, scheduled daily performance
   workflow with scenario picker (Cloudflare `performance.yml` pattern).
5. **Mock/local-mode package convention** — `*-mock` package shape so SDK
   tests run without cloud infra (vercel-sandbox-mock pattern), marked as
   emerging, not proven.
6. **Remote-lab variant spec** — receipt schema and `lab:` spec marking for
   escape accounting that cannot run under the local measurement law.
7. **`ESCAPE_LEDGER.md` schema** — vector / negative control / outcome /
   UNK registration, wired to claims.tsv demotion rules.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Star snapshots verified via GitHub API 2026-09-23. Last pushes in UTC.

| owner/repo | stars | last push | process takeaway |
|---|---|---|---|
| e2b-dev/E2B | 13,934 | 2026-09-22 | Reference agent sandbox; copy the per-SDK test-workflow split and the independent signature reimplementation in tests. |
| e2b-dev/code-interpreter | 2,415 | 2026-09-10 | Evidences the code-interpreter API as its own product surface. |
| daytonaio/daytona | 71,725 | 2026-07-24 | Historical demand only — tombstone README since June 2026; do not copy CI from it. |
| cloudflare/sandbox-sdk | 1,138 | 2026-09-23 | Scheduled daily performance scenarios + merge-queue/privileged-PR split is the CI shape to copy. |
| vercel/sandbox | 201 | 2026-09-23 | Hardened multi-distro images + `vercel-sandbox-mock` for local dev; young — emerging, not proven. |
| firecracker-microvm/firecracker | 36,898 | 2026-09-23 | The isolation-test battery to copy (jailer, seccomp, vuln regression, audit) and the Buildkite A/B perf pipeline pattern; CI is Buildkite, not GHA — copy the separation, not the vendor. |
| google/gvisor | 19,403 | 2026-09-23 | `test/e2e` + `test/runtimes` for isolation-layer correctness; `secbench` is filter-*cost* benchmarking, not adversarial testing. |
| kata-containers/kata-containers | 8,879 | 2026-09-23 | Multi-arch CI matrix and a separate stress/soak suite (`tests/stability/`) as the stability norm. |

**Honest caveats (carried over from the evidence file).** No true sandbox-escape
pentest exists in any repo tree — treat adversarial escape testing as a gap to
fill. E2B's `secure.test.ts` is signed-URL auth, not isolation. Daytona is a
tombstone; its stars measure legacy. `vercel/sandbox` is young (201 stars).
`modal-labs/modal` does not exist (API Not Found) — dropped per the
verifiability rule. Firecracker's CI is Buildkite; copy the pipeline
separation, not the vendor. gVisor's `secbench` does not test filter
completeness.

## Unknowns (UNK-*)

- **UNK-1.** What does an admissible sandbox-escape pentest suite look like,
  and who maintains the vector list? No evidence repo publishes one; the
  oracle for shared GATE-007's "red-then-green" is currently substrate security
  suites, which are regression tests, not escape attempts.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Escape-vector oracle parked: S3 builds and pins the project's own vector list from substrate security suites with per-vector provenance; red-then-green demonstrated; unattempted vectors stay UNKs. Promotion predicate: at S3 truth-pack assembly, construct the escape-vector list from the pinned substrate security suite(s) (Firecracker tests/integration_tests/security/, gVisor secbench per the pack), version-pin it with per-vector provenance per GATE-007; the red-then-green suite must FAIL on the unhardened substrate and PASS after hardening; unattempted vectors are typed UNKs, never implied passes; the pickup project itself maintains its pinned list. Owner: plan author. S3 step: truth-pack assembly.
- **UNK-2.** Can sandbox-escape *accounting* (measuring escape attempts and
  rates) run under any local measurement law, or is it remote-lab-only by
  construction? The localbench note flags this type as a remote-lab variant
  candidate; the boundary is untested.
  **Disposition: TARGETED.**
- **UNK-3.** Does the A/A-derived tolerance rule hold for microVM boot-time
  under real tenancy jitter? The `NONDETERMINISM_FLOOR.md` for this type is
  unwritten — the 5% floor for `cold` is a guess, not a measurement.
  **Disposition: TARGETED.**
- **UNK-4.** Guest-image supply chain: no evidence repo showed signed image
  attestations or a verified image-build pipeline. What is the admissible
  provenance claim for a prebuilt sandbox image?
  **Disposition: TARGETED.**
- **UNK-5.** Can a clean-room project independently rerun the Firecracker
  security/performance battery (Buildkite-hosted, KVM-dependent) to T1
  standard, or is the substrate oracle effectively vendor-gated? If
  vendor-gated, G1 ORACLE needs a different incumbent for this type.
  **Disposition: TARGETED.**
- **UNK-6.** The S0 sources name G2 PAIR, G3 OWN, G4 CONTRACT, G5 HOST, G6
  UNSAFE mechanisms only; this profile's type-parameterized applications
  assume the starter kit / ATLAS gate registry supplies the mechanisms.
  Confirm the mechanisms exist before S5 gates on them.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] G2-G6 mechanism supply parked: S3 gate wiring confirms each mechanism; missing ones get labeled type-local analogs in the gate log. Promotion predicate: at S3 gate wiring, confirm each of G2-G6 resolves to a supplied starter-kit/ATLAS mechanism; any missing mechanism is replaced by a type-local GATE-SB-NN analog labeled as an analog per the playbook's analog rule, recorded in GATE_LOG.md with PASS/N-A/WAIVED verdicts per the S3 exit criterion. Owner: plan author. S3 step: gate wiring.
- **UNK-7.** Agent-facing SDKs (E2B, Cloudflare, Vercel) delegate isolation
  to a substrate — is there an admissible *SDK-layer* isolation claim at all,
  or is every SDK-layer isolation statement capped at T2/T3 by construction?
  **Disposition: ADVISORY.**
