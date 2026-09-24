# Pickup companion: Agent frameworks

S2 companion for the FrankenSuite "project pickup" ecosystem (S0–S5 planning arc).
Covers: **agent-frameworks** — one of the 21 agentic-technology types the 44-repo corpus
does not cover. Read with `INTENT.md`.

Repo/star/path facts in this file come ONLY from
`_evidence/agent-frameworks.md` (verified via GitHub REST API on 2026-09-23;
star counts are a point-in-time snapshot ~10:35 MDT that day).

## Charter seed

**What this project type is.** Agent orchestration frameworks: libraries/SDKs that
structure how an LLM-powered agent (or multi-agent system) loops — tool-calling
loops, graph/state-machine workflows, role-playing agent teams, compiled/programmatic
agent programs (optimizers over prompts), and their runtime affordances:
checkpointing of agent state, resumability, human-in-the-loop, sandboxing of tool
calls, evals of agent behavior, and trajectory semantics (node execution order,
streaming, interrupt/resume).

**Type boundary (binding).** Durable history/journal/replay (event logs,
journaled state, deterministic replay of a recorded run) belongs to
**workflow-orchestrators**; agent-frameworks own checkpoint/restart of agent
state and trajectory semantics only. A framework MUST NOT claim "durable
execution" — it exposes checkpoint/restart; durability of the history is the
orchestrator's contract. Cross-type conformance is governed by REQ-DW-6
(workflow-orchestrators): a framework that embeds an orchestration path
satisfies the orchestrator's recorded-history replay interface, not its own.

**In scope.** The agent loop and orchestration machinery itself; deterministic test
doubles for the loop; checkpoint/resume state semantics and their backend-agnostic
conformance; the framework's own eval harness and reliability infrastructure; graph
trajectory semantics (node execution order, streaming, interrupt/resume).

**Out of scope.** Model weights and inference engines (covered by inference-engines,
quantization); retrieval/memory internals (agent-memory, rag-frameworks);
the LLM provider APIs themselves; application-level agents built *on* a framework
(the framework's SDK surface is the subject, not one downstream agent).

**What "a good starting point" means here.** A charter+truth-pack that pins at least one
reference implementation (the incumbent framework under assessment), ships scripted
deterministic LLM doubles as a first-class SDK API from day one, defines trajectory
equivalence (what counts as "same agent run") before any rewrite begins, and treats
nondeterminism as a first-class measurement surface: the floor is recorded, backend
variance is conformance-tested, and LLM-judge variance is budgeted, not wished away.

### Requirements

- **REQ-01.** A starting project must pin its oracle inventory in `docs/truth-pack/`
  before any code is written: the incumbent framework's exact source commit, the LLM
  adapter layer versions, and fixture hashes (MANIFEST.sha256). No unpinned oracle is
  admissible for any claim.
- **REQ-02.** Deterministic test doubles (scripted models + scripted sandbox sessions)
  are a first-class, importable SDK API from day zero — not a private test helper —
  so downstream users can test agent workflows deterministically too.
- **REQ-03.** The charter must define trajectory equivalence: the precise definition of
  "same agent run" for differential comparison (message sequence, tool-call order,
  checkpoint states, error paths), and the acceptance surface for trajectory parity.
- **REQ-04.** Checkpoint/resumability semantics must be conformance-tested across every
  state backend with a single backend-agnostic suite; no per-backend ad-hoc assertions.
- **REQ-05.** The project's own eval harness (if shipped as a product feature) must be
  exercised by its own CI; reliability tests across an LLM matrix must be declared in
  config (model matrix in YAML), not hardcoded, and run gated separately from unit tests.
- **REQ-06.** The 12 anti-reward-hacking patterns (verbatim in AGENTS.md) are in force,
  with two type-specific readings: (a) golden-regeneration-until-green is forbidden
  against scripted trajectories as well as metrics; (b) cherry-picking favorable LLM
  judges or model-matrix entries is forbidden (see GATE-AF3).

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Agent frameworks are mostly API surfaces with behavioral semantics, so oracles are
reference implementations + scripted fixture sets, not a single binary. Candidates
(named in `_evidence/agent-frameworks.md`):

1. **Pinned incumbent source tree** — the reference framework's exact commit
   (e.g. langchain-ai/langgraph @ pin, microsoft/autogen @ pin). The primary "does it
   behave like the incumbent" oracle for differential testing of agent loops.
2. **Scripted trajectory fixtures** — recorded/scripted message+tool-call sequences
   (analogous to openai-agents-python's `ScriptedModel` step specs) with versioned
   agent-definition dicts (analogous to smolagents' `AGENT_DICTS["v1.9"]`,
   `tests/fixtures/agents.py`). Versioned so schema drift fails loudly.
3. **Checkpoint-conformance suite** — a backend-agnostic suite in the shape of
   langgraph's `libs/checkpoint-conformance/tests/`, exercised over every state
   backend the project supports (sqlite/postgres/etc.).
4. **Snapshot corpus** — the shape of langgraph's `libs/langgraph/tests/__snapshots__/`
   and `libs/prebuilt/tests/__snapshots__/`: full agent-state/stream outputs whose
   drift is diffed, not eyeballed.

Per-oracle integrity checks (truth-pack shape, from `_s0/model-guides.md`):

- `PIN_RECORD.md`: the incumbent's pinned commit, date, and the honest drift note
  (which parts of the pin are newer/older than each other, in the tts style: "the
  GitHub code pin is ~N weeks newer than the weights pin" — here: "the langgraph
  libs pin is N weeks newer than the checkpoint-sqlite pin").
- `MANIFEST.sha256`: per-fixture SHA-256 for every scripted trajectory, versioned
  agent dict, and snapshot file.
- `ACCEPTANCE_SURFACE.json`: pre-committed break-even thresholds for differential
  claims (e.g. trajectory-parity pass criteria, checkpoint-round-trip success rate,
  judge-scored reliability floor) — computed *before* the experiment.
- `NONDETERMINISM_FLOOR.md`: the measured floor of the sources of variance the
  framework does NOT control (LLM provider sampling variance, judge-model variance,
  backend timing jitter). No behavioral claim may be stated below this floor.
- `fetch-truth-pack.sh --verify`: re-fetches the pinned incumbent source and
  re-hashes every fixture; fails loudly on any mismatch.
- **Invocation-time oracle binary SHA-256 recording**: for any same-invocation duel
  against the incumbent (whisper's CAMPAIGN WIN rule — "the incumbent binary's
  SHA-256 recorded" for each arm), the hash of the incumbent package (pinned
  installed distribution) is recorded in the receipt at invocation time. A run whose
  incumbent identity was not recorded is diagnostic only.
- **UNK-01.** See UNK-01 in Unknowns below (not redefined here).
- **UNK-02.** See UNK-02 in Unknowns below (not redefined here).

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, evidenced across repos.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-01 | Scripted/deterministic LLM doubles should ship as a first-class, importable SDK API (not test-private), including fail-on-unexpected-step semantics | openai-agents-python `src/agents/testing/__init__.py` (UnconsumedModelSteps, UnexpectedModelCall), `src/agents/testing/sandbox.py` | T0 | High | ADMISSIBLE |
| CLAIM-02 | One fake model per trajectory scenario (canned tool-call/code trajectory), not one generic fake, is the norm for agent-loop tests without network calls | huggingface/smolagents `tests/test_agents.py` (~15 Model subclasses, lines ~115–855) | T0 | High | ADMISSIBLE |
| CLAIM-03 | Canned message-sequence fakes use a scripted sequence with a pointer index and explicit wrap-around/reset semantics | langchain-ai/langgraph `libs/langgraph/tests/fake_chat.py` (FakeChatModel, bind_tools, streaming, reset) | T0 | High | ADMISSIBLE |
| CLAIM-04 | Scripted-model contracts fail hard on drift: unexpected model calls and unconsumed script steps are errors, not silent pass-throughs | openai-agents-python `src/agents/testing/__init__.py` | T0 | High | ADMISSIBLE |
| CLAIM-05 | Deterministic doubles must cover tool execution side effects (scripted sandbox), not only the LLM | openai-agents-python `src/agents/testing/sandbox.py` (ScriptedSandboxSession, InvalidSandboxStep, UnexpectedSandboxCall) | T0 | High | ADMISSIBLE |
| CLAIM-06 | Retry/backoff behavior is asserted by scripted failure-then-success sequences at the provider-adapter layer | huggingface/smolagents `tests/test_models.py` (MagicMock on InferenceClientModel.client.chat_completion; side_effect=[rate_limit_error, rate_limit_error, mock_success]) | T0 | High | ADMISSIBLE |
| CLAIM-07 | Snapshot tests capture full agent-state/stream output to catch unintended trajectory changes | langchain-ai/langgraph `libs/langgraph/tests/__snapshots__/`, `libs/prebuilt/tests/__snapshots__/` | T0 | High | ADMISSIBLE |
| CLAIM-08 | Checkpoint/resumability state gets a backend-agnostic conformance suite run against every state backend, not per-backend ad-hoc tests | langchain-ai/langgraph `libs/checkpoint-conformance/tests/`, `libs/checkpoint/tests`, `libs/checkpoint-sqlite/tests`, `libs/checkpoint-postgres/tests` | T0 | High | ADMISSIBLE |
| CLAIM-09 | Reliability (behavioral, judge-graded) tests are separated from unit tests; the LLM model matrix is declared in config, not code | stanfordnlp/dspy `tests/reliability/README.md`, `tests/reliability/reliability_conf.yaml`, `tests/evaluate/test_auto_evaluation.py` | T0 | High | ADMISSIBLE |
| CLAIM-10 | A framework that ships an eval API tests that API in its own CI | stanfordnlp/dspy `tests/evaluate/` (dspy.Evaluate, metrics, auto-evaluation) | T0 | High | ADMISSIBLE |
| CLAIM-11 | Serialization fixtures are versioned agent-definition dicts that catch schema drift in save/load | huggingface/smolagents `tests/fixtures/agents.py` (AGENT_DICTS["v1.9"], ["v1.10"]) | T0 | High | ADMISSIBLE |
| CLAIM-12 | CI is split: unit vs integration, per-package matrices, benchmarks as a gated workflow | langchain-ai/langgraph `.github/workflows/` (`_test_langgraph.yml`, `_integration_test.yml`, `bench.yml`); microsoft/autogen `.github/workflows/` (`integration.yml`, `pytest-redis-memory.yml`) | T0 | High | ADMISSIBLE |
| CLAIM-13 | Shared test scaffolding (tracing/telemetry assertions) is extracted into a dedicated test-utils package | microsoft/autogen `python/packages/autogen-test-utils/` (`telemetry_test_utils.py`) | T0 | High | ADMISSIBLE |
| CLAIM-14 | No surveyed agent-framework repo exposed an LLM-call record/replay (cassette) harness; the type's tests are scripted fakes, not cassettes — this is a gap a clean-room project could fill | thin: absence-of-evidence across all 8 surveyed repos' test trees (evidence file "What no repo showed clearly") | T0 | Medium | CONTESTED |
| CLAIM-15 | AutoGen's main repo (microsoft/autogen, last push 2026-04-15) should not be cited as "actively maintained" without the staleness caveat | thin: 5-month push gap; secondary article (dev.to comparison) says development continued as AG2 / Microsoft Agent Framework — unverified at repo level | T2 | Low | CONTESTED |

Inference (labeled): CLAIM-14's "gap a clean-room project could fill" is an inference from
surveyed test trees, not a verified fact — cassette harnesses may exist outside the
surveyed paths. It is CONTESTED until verified against the full trees.

## Gate profile

Starter-kit G1–G14 applicability for agent frameworks (gate names from
`_s0/ecosystem-digest.md` §3):

| Gate | Applicability |
|------|---------------|
| G1 ORACLE | **As-is, load-bearing.** Oracle inventory = pinned incumbent commit + scripted trajectory fixtures + snapshot corpus. Two-party waiver on post-pin changes; oracle shielded from the implementing agent. |
| G2 PAIR | **As-is, load-bearing.** Paired/differential validation contract: agent-loop parity is inherently differential (framework vs incumbent on the same scripted trajectory). Type-specific parameter: the pair contract must name the trajectory corpus (fixtures pinned in MANIFEST.sha256). |
| G3 OWN | **As-is.** Ownership contract on every claim row (ATLAS R7 `owner`); applies unchanged. |
| G4 CONTRACT | **As-is, with type-specific parameters.** Claim artifacts must conform to schema (CLAIMS.json + ledger schemas); the *agent-loop* artifacts get an additional contract: checkpoint round-trip schema + trajectory snapshot schema, asserted by conformance suite. |
| G5 HOST | **As-is, advisory for most.** Host parity matters mainly for timing/jitter claims (checkpoints, streaming latency); behavioral trajectory parity is host-independent. Applies as-is where timing is claimed, N/A otherwise. |
| G6 UNSAFE | **N/A unless the implementation uses unsafe code.** Routing contract stands; Rust-unsafe gating applies only if the project actually writes unsafe blocks. |
| G7 REVIEW | **As-is, load-bearing.** Split-context adversarial review, default-refute — this is exactly the gate that would have caught the shareable-site claim-invention failures; agent-framework copy (docstrings, agent "behavior" claims) is a fabrication-risk zone. |
| G8 RULEBOOK | **As-is, load-bearing.** Rulebook claim-discipline as a gate; bound to trial-before-scale. |
| G9 IOU | **As-is.** Structured IOUs only, zero unresolved at close. |
| G10 MIRI | **N/A unless unsafe code is written.** Same condition as G6. |
| G11 LAYOUT | **N/A as-is.** Layout assertions target compiled-model memory layout; agent frameworks have no such artifact. (A type-specific analog — state-schema layout assertions — is proposed as GATE-AF4.) |
| G12 AUDIT | **As-is.** Class-fix followed by instance re-audit applies to agent-loop bug classes (e.g. unconsumed script steps, silent trajectory drift) exactly as it does elsewhere. |
| G13 NOSTUB | **As-is, load-bearing with a type-specific reading.** No stubs/placeholders — and specifically no `NotImplemented` agent-loop paths or fake "deterministic" modes that fall back to the live LLM on mismatch. A fake that silently calls the network on unscripted input is a stub. |
| G14 REJECT | **As-is, load-bearing.** Tier-mapping gate; T3 [Inference] claims about agent capabilities (e.g. "matches incumbent on all trajectories") are rejected without the receipt. |

Proposed new type-specific gates (GATE-* IDs):

- **GATE-AF1 — RETIRED into shared GATE-005** (S4 round 1, dedup per the
  playbook's local-gate rule). GATE-005 acceptance (1)–(2) already cover
  scripted-model integrity (first-class deterministic doubles; fail on
  unexpected calls and unconsumed steps). The genuine delta is retained as a
  type-specific parameter of GATE-005: a mutation test suite MUST demonstrate
  that removing a script step or adding an extra trajectory step turns a
  green run red.
- **GATE-AF2 — checkpoint backend parity.** The backend-agnostic checkpoint
  conformance suite MUST run against every supported state backend in CI, and all
  backends MUST pass the same suite (langgraph `checkpoint-conformance` shape).
  Adding a backend without adding it to the conformance matrix is a FAIL.
- **GATE-AF3 — judge/matrix anti-cherry-picking.** Reliability claims (judge-graded,
  LLM-matrix) MUST declare the judge identity and the full model matrix in config
  before the run (dspy `reliability_conf.yaml` shape); results MUST be reported for
  the whole matrix, and the judge's own variance MUST be budgeted in
  NONDETERMINISM_FLOOR.md. Dropping a model from the matrix post-hoc is a FAIL
  (cherry-picking reading of the anti-reward-hacking law).
- **GATE-AF4 — state-schema drift detection.** Versioned serialization fixtures for
  agent definitions and checkpoint states (smolagents `AGENT_DICTS["v1.9"]` shape)
  MUST exist; any schema change that breaks a prior version's fixture without a
  migration is a FAIL.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-004 (Structured-output grammar conformance + fuzz) | Advisory | Tool-call schemas exist but are not the type's load-bearing surface |
| GATE-005 (Agent deterministic replay / trajectory) | Load-bearing | Applies to this slug; checkpoint/trajectory replay is core |
| GATE-007 (Sandbox escape + resource accounting) | Advisory | Sandboxed tool execution is peripheral for frameworks |
| GATE-010 (Trace completeness / privacy) | Advisory | Run logging is expected but not load-bearing |
| GATE-011 (Guardrail false-positive / false-negative) | Advisory | Tool-call gating is downstream of the framework |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types |
| GATE-002 (model truth-pack / oracle integrity) | Advisory | Trajectory-parity claims rest on a pinned incumbent oracle; declare pins where a claim depends on one |
| GATE-018 (flake quarantine) | Load-bearing | Nondeterministic trajectory suites: quarantined with label/tracking issue, explicit retry budget |

## Evidence tiers

Canonical mapping (per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct
inspection of a fresh clone, API, live page, or a measurement at a pinned
oracle; T1 [CI-observed] — executed and observed on CI / banked receipt;
T2 [Maintainer claim]/[External] — asserted by repo docs or an independent
source, not reproduced by us; T3 [Inference] — analyst judgment, always
labeled. Type-specific readings:

- **T0 [Verified].** Framework-author sources inspected directly: the pinned
  incumbent's own test trees (fake_chat.py, testing/__init__.py,
  checkpoint-conformance, __snapshots__ dirs) at the recorded pin; official
  CI workflows (bench.yml, integration.yml) as observed in-tree. Admissible
  for process-norm claims (CLAIM-01–13).
- **T1 [CI-observed].** Third-party conformance results against the pinned
  incumbent executed and observed (e.g. an independent agent-benchmark run
  with recorded binary SHA-256 and same-invocation A/B); the project's own
  banked trajectory-parity receipts and A/A golden runs — admissible for
  landing code, never for public competitive claims without T0 backing.
  Required for any competitive claim ("parity with langgraph on trajectory
  set X").
- **T2 [External] / [Maintainer claim].** Independent security/behavioral
  audits of agent loops not reproduced by us; vendor README adopter lists
  beyond the verified set.
- **T3 [Inference].** TARGETED gates, provisional thresholds in
  ACCEPTANCE_SURFACE.json before any run exists (nlp README policy: "no
  number exists yet, because no kernel exists yet" — here: no agent loop
  exists yet). Labeled TARGETED, never OBSERVED.
- **Rejected outright.** Star counts and push dates as evidence of *quality* or
  *maintenance* beyond what they state (they evidence demand and recency only —
  the AutoGen staleness caveat is the standing example); vendor README adopter
  lists beyond the verified langgraph set (Klarna, Replit, Elastic, Ally) without
  independent corroboration.

## Localbench bench shape

Instantiating the 13 localbench slots for agent frameworks:

1. **Spec format** — `framework@pin : llm-adapter : judge` naming exactly what is
   measured, e.g. `frankenagents@a1b2c3d : scripted-model-v2 : none` for unit-shape
   runs, or `langgraph@<pin> : openai-compatible-stub : gpt-4o-judge@2026-05` for
   reliability-shape runs. Backend = the agent loop under test; adapter/judge are
   named because they move the numbers.
2. **Tier list** — `loop` (scripted-trajectory unit parity), `checkpoint`
   (backend-agnostic conformance per backend), `snap` (snapshot corpus drift),
   `rel` (judge-graded reliability across the model matrix), `e2e` (full
   graph/streaming/interrupt-resume scenarios). Goldens bind PER TIER; touching the
   checkpoint backend re-banks only `checkpoint`; touching the loop re-banks
   `loop`+`snap`+`e2e` (snapshot drift implies loop change).
3. **Golden schema** — JSON per spec: `conformance` (named checks, MUST/SHOULD,
   PASS/FAIL) + `metrics` (value, spread from A/A, tol, tol_source → banked receipt,
   better direction). MUST: scripted-trajectory exact parity on the pinned corpus;
   checkpoint round-trip success per backend; no-live-network (a test that hits the
   network is a FAIL, not a skip). SHOULD: streaming chunk-order parity,
   interrupt/resume parity.
4. **Tolerance rule** — `tol = max(3 × A/A relative spread, floor)`. Floor for
   timing metrics (checkpoint write latency, streaming latency); behavioral
   trajectory metrics (exact parity) have floor 0 — any drift is a FAIL.
   Judge-graded reliability metrics: tolerance is set against the judge's own
   measured variance (budgeted in NONDETERMINISM_FLOOR.md), not A/A of the loop.
5. **Only banking ceremony** — goldens written ONLY by an A/A pair run
   (`aa <spec> --write-golden`) + `git diff goldens/` review in the same commit.
   Golden-regeneration-until-green is forbidden — including re-rolling a judge
   until the score passes.
6. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts.
   New judge-model version or adapter version = new generation (status CURRENT /
   GENERATION-MISMATCH / UNAVAILABLE).
7. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%, names the
   processes); runs marked CONTENDED if a non-backend process exceeds 25% GPU in a
   second; one agent loop under test at a time; **no cloud fallback**: a failed
   scripted-model call is a finding, never a live-LLM fallback (a fake that calls
   the network is a G13 NOSTUB violation); park/unpark interfering residents
   during test windows. Loopback/local-only endpoints.
8. **A/B discipline** — same-invocation A, B, A ordering for framework-vs-incumbent
   duels, with the incumbent package SHA-256 recorded at invocation; banked under
   a name.
9. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, traj, checkpoint, judge) + dated `.md` investigation notes;
   `runs/` gitignored scratch with `<ts>__<kind>__<spec>` dirs.
10. **Incumbent pins** — `docs/evidence/incumbents.md`: exact incumbent commits +
    hashes, adapter versions, judge identity+version, OS, every external thing
    numbers depend on.
11. **Claims registry wiring** — `registries/claims.tsv`: every public claim
    sentence registered and machine-checked against its receipt on every commit
    (nlp's four-file portable adoption: CLAIMS_ANNOTATIONS.md + CLAIMS.json +
    three ledger schemas + check_claims.py).
12. **Negative-evidence ledger** — `docs/evidence/NEGATIVE_EVIDENCE.md` (kills with
    resurrection predicates, e.g. "dropped cassette approach when …"), retractions
    kept in-tree (tts NE-006 style), DISCREPANCIES.md with actionables and review
    dates.

Remote-lab variant note: judge-graded reliability tiers that require paid/proprietary
judge models cannot run host-only; those tiers get a "remote-lab variant" with the
judge identity, version, and billing receipt pinned in `incumbents.md` — never a
weakened local law (no replacing the judge with a cheaper local model and calling
it the same tier).

## Starter-kit deltas

Concrete additions the franken starter kit needs for agent-framework projects:

1. **Files.** `docs/truth-pack/` with `PIN_RECORD.md`, `MANIFEST.sha256`,
   `ACCEPTANCE_SURFACE.json`, `NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh
   --verify` (model-guides shape, adapted: trajectory fixtures instead of weights).
2. **Gates.** GATE-AF2 through GATE-AF4 added to the gate registry with acceptance
   criteria as defined in § Gate profile (GATE-AF1 retired into shared GATE-005);
   G13's agent-framework reading (no silent network-fallback fakes) recorded as
   the type-specific interpretation.
3. **Harness shapes.** (a) A scripted-model + scripted-sandbox test-double template
   with UnexpectedModelCall/UnconsumedModelSteps semantics, shipped as an
   importable package, not a test helper. (b) A checkpoint-conformance-suite
   template: one suite, N backend adapters. (c) A judge-graded reliability harness
   template with YAML model-matrix config and pre-run matrix declaration.
   (d) Versioned agent-definition fixture template (`AGENT_DICTS["vX.Y"]` shape)
   with a schema-drift detector.
4. **Ledger schemas.** `perf-ledger/v1` extended with result classes for this type:
   TRAJECTORY-PARITY (differential vs incumbent, same-invocation, SHA recorded),
   SELF-LOOP (internal only — may justify landing code, never a public claim),
   JUDGE-GRADED (matrix-declared, variance-budgeted). Only TRAJECTORY-PARITY and
   JUDGE-GRADED rows may support public claims (whisper PERF_LEDGER doctrine,
   ported).
5. **Skip-honesty mechanics.** `require_scripted!`-style harness: any suite that
   needs the incumbent or a judge reports skips honestly (XFAIL≠SKIP); no green
   without the pinned oracle installed.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Verified 2026-09-23 via GitHub REST API; star counts point-in-time ~10:35 MDT.

| owner/repo | Stars | Last push | Process takeaway |
|------------|-------|-----------|------------------|
| langchain-ai/langgraph | 42,179 | 2026-09-23 | Reference graph-framework: canned-sequence fake chat model (`libs/langgraph/tests/fake_chat.py`); backend-agnostic checkpoint conformance (`libs/checkpoint-conformance/tests/`); snapshot corpora; benchmarks as a CI workflow (`bench.yml`) |
| langchain-ai/langchain | 146,931 | 2026-09-23 | Ecosystem anchor; same-day activity on both repos signals category health |
| microsoft/autogen | 61,123 | 2026-04-15 | Split CI (unit vs integration, per-package, service-backed `pytest-redis-memory.yml`); dedicated test-utils package — but last push ~5 months before check, so do not cite as "actively maintained" without the caveat |
| crewAIInc/crewAI | 58,949 | 2026-09-23 | Monorepo per-package `tests/` layout (`lib/crewai-core`, `lib/crewai-tools`, `lib/cli`) — verified only for layout, not techniques |
| agno-agi/agno | 42,319 | 2026-09-23 | Demand evidence for agent-runtime/orchestration layers beyond the top-3 names; test techniques not enumerated |
| huggingface/smolagents | 29,462 | 2026-09-23 | One fake model per trajectory scenario (`tests/test_agents.py` ~15 Model subclasses); LLM-client mocking with scripted retry sequences (`tests/test_models.py`); versioned serialization fixtures (`tests/fixtures/agents.py`) |
| openai/openai-agents-python | 29,656 | 2026-09-23 | First-class importable deterministic test doubles (`src/agents/testing/`: ScriptedModel, UnconsumedModelSteps, UnexpectedModelCall, ScriptedSandboxSession) — the single best practice to copy |
| stanfordnlp/dspy | 38,230 | 2026-09-23 | Judge-graded cross-LLM reliability suite with YAML model matrix (`tests/reliability/`); eval harness tested by its own CI (`tests/evaluate/`) |

**Honest caveats carried over.** Trend breadth vs depth: evidence is star-count +
same-day push activity; only LangGraph has verified production-adopter names
(Klarna, Replit, Elastic, Ally — langchain.com announcement; Klarna/Replit/Elastic
corroborated by langfuse docs). Adopter claims for the other frameworks are not
verified. MetaGPT/MetaGPT 404'd on the API and was dropped — no replacement name
verified, not cited. crewAI and agno: test-dir layout only, techniques not
enumerated, so no process claims from them. No surveyed repo showed an LLM-call
record/replay (cassette) harness or a WebArena-style e2e agent benchmark suite —
a gap, not a copy target. Method: unauthenticated GitHub API (60 req/hr); all file
pointers individually fetched and confirmed.

## Unknowns (UNK-*)

- **UNK-01.** Cassette vs scripted-fake: which LLM-call capture apparatus (VCR-style
  record/replay vs hand-rolled scripted doubles) is the right oracle for agent-loop
  differential testing? No surveyed repo exposed an LLM-call record/replay (cassette)
  harness, so neither apparatus is evidenced in-tree. Must be resolved before S5;
  resolution criterion: a trial on both against the same trajectory corpus, comparing
  drift-detection sensitivity.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Oracle-apparatus selection parked: scripted fakes default (pack-evidenced practice); cassette-vs-fake trial at S3 bench setup selects the pinned apparatus. Promotion predicate: at S3 bench setup, run both apparatuses against the same trajectory corpus and compare drift-detection sensitivity; default to scripted fakes per pack evidence unless the trial shows otherwise; bank the trial receipt, record the loser as negative evidence. Owner: plan author. S3 step: bench setup.
- **UNK-02.** Are third-party agent benchmarks (SWE-bench-agents variants, GAIA,
  WebArena-style) admissible as oracles for trajectory parity, given their own
  nondeterminism? No WebArena-style e2e agent benchmark suite was found in any
  surveyed repo's test tree, so no in-tree norm exists to copy. Must be resolved
  before S5; until then they are T3 at best and cannot support competitive claims.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Third-party benchmark admissibility parked: typed T3; promotion predicate = S3 A/A variance measurement of the benchmark oracle at its pinned version against the committed floor. Owner: plan author. S3 step: bench setup.
- **UNK-03.** What is the measured nondeterminism floor of LLM judges for
  agent-trajectory grading (inter-run score variance of a fixed judge on a fixed
  trajectory)? Required before any JUDGE-GRADED ledger row can set a tolerance.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Judge nondeterminism floor parked: measured at S3 by fixed-judge/fixed-trajectory repeats; no JUDGE-GRADED tolerance banked before the floor is committed. Promotion predicate: at S3 bench setup, fix the judge pin and run K inter-run repeats over a fixed trajectory corpus; commit the measured variance as the floor in NONDETERMINISM_FLOOR.md. Owner: plan author. S3 step: bench setup.
- **UNK-04.** Do agent frameworks need a tamper-evidence chain for checkpoint
  artifacts (hash-chained state provenance, analogous to ocr's header
  hash-chaining gap)? Open question: checkpoints are resumable state, and silent
  state corruption is a failure mode no surveyed repo's conformance suite was
  verified to test.
  **Disposition: TARGETED.**
- **UNK-05.** AG2 / Microsoft Agent Framework: is it the verified continuation of
  autogen development, and if so, what is the canonical repo? Unresolved — the
  secondary article's claim is unverified at repo level; the ecosystem must not
  cite it until pinned via the API.
  **Disposition: TARGETED.**
