# Pickup companion: Realtime voice-agent stacks

Status: S2 author draft. Repo/path/star facts from `_evidence/voice-agents.md`
(verified via GitHub API 2026-09-23); gate names G1–G14 from
`_s0/ecosystem-digest.md` (starter-kit A-Z playbook). Inferences are labeled
[INFERENCE].

## Charter seed

**What this project type is.** A realtime voice-agent stack is an orchestration
layer that turns a realtime media transport (WebRTC/SFU, telephony) into a
conversational agent: it wires STT → LLM → TTS (or a speech-to-speech realtime
model), handles turn-taking, interruptions (barge-in), and end-of-turn
detection, and exposes latency/quality observability (TTFA, TTFB, interruption
metrics) plus provider plugins. The clean-room question this type answers: can
a from-scratch implementation reproduce the pipeline semantics — session
lifecycle, stage handoffs, turn-taking under interruption — of an incumbent
framework, with latency characterized, not just claimed.

**In scope.** Agent orchestration (session/pipeline/participant lifecycle),
stage interfaces (STT/LLM/TTS/VAD/turn-detector), fake/mock doubles for every
stage, latency instrumentation (TTFA/TTFAT/TTFB, e2e handoff), interruption
and turn-taking behavior, live-provider integration tests gated on secrets,
bot-to-bot scenario evaluation architecture.

**Out of scope.** The models themselves (no clean-room STT/TTS/LLM retraining);
the media transport/SFU internals (use a pinned incumbent as the transport,
per `livekit/livekit`'s role in the stack); vendor Realtime-API debugging UIs
(`openai/openai-realtime-console` is trend evidence, not an oracle).

**"A good starting point" for this type means:** `docs/truth-pack/` pins the
incumbent framework commit (e.g. `livekit/agents` or `pipecat-ai/pipecat` —
pinned per PIN_RECORD.md, not "latest"); fake doubles for every pipeline
stage exist before any live-provider test runs; latency metric classes
(TTFA/TTFAT/TTFB) are defined with their own unit tests before any
performance claim is banked; interruption/turn-taking matrices run on virtual
time; secrets-gated live-provider tests are a separate CI workflow that never
gates unit CI; and every public claim sits in a machine-checked claim registry
with its receipt.

### Requirements

- REQ-VA-1: The project SHALL pin its incumbent oracle(s) (framework commit +
  provider SDK/plugin revisions) in `docs/truth-pack/PIN_RECORD.md` with dated
  pins; changing the pin after G1 requires a two-party waiver.
- REQ-VA-2: The project SHALL ship deterministic fake doubles for every
  pipeline stage (STT, LLM, TTS, VAD, turn-detector, realtime model, session)
  so the full test surface runs with no API keys and no network.
- REQ-VA-3: The project SHALL define latency metric classes (at minimum
  TTFA/TTFAT/TTFB equivalents) with dedicated unit tests before banking any
  latency number; no benchmark dashboard may be advertised as a regression
  gate unless an actual gate exists (evidence caveat: the incumbents test
  latency but do not gate it — copying that gap is a failure, not parity).
- REQ-VA-4: The project SHALL run interruption/turn-taking tests on a virtual
  clock so timing assertions do not flake on real-time scheduling.
- REQ-VA-5: The project SHALL keep live-provider integration tests in a
  secrets-gated workflow, path-triggered, never required for unit-CI green,
  and skipped on forks.
- REQ-VA-6: The project SHALL bind every measured number to an invocation-time
  record of the oracle/test binary SHA-256 and a machine-state receipt
  (GPU/CPU contention per the measurement law); un-recorded executables are
  inadmissible.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles (only repos/paths named in the evidence file):

1. **livekit/agents (LiveKit)** — oracle for session/pipeline lifecycle,
   interruption semantics, fake-doubles harness shape. Pins: exact commit in
   PIN_RECORD.md; plugin SDK revisions in MANIFEST.sha256. Integrity:
   `fetch-truth-pack.sh --verify` checks SHA-256 of the pinned tree; every
   measurement receipt records the incumbent binary SHA-256 at invocation
   time (whisper-pattern, model-guides §2). NONDETERMINISM_FLOOR.md records
   which stages are timing-perturbed (virtual-time vs wall-clock).
2. **pipecat-ai/pipecat (Daily)** — oracle for latency metric classes
   (TTFA via RMS speech-onset detection, TTFAT, TTFB) and metrics observers.
   Integrity: pin commit; verify pinned checkout hash; metric-class fixture
   PCM buffers hashed in MANIFEST.sha256; acceptance surface records the
   speech-onset detector's calibration bounds.
3. **ServiceNow/eva** — oracle for bot-to-bot scenario-evaluation
   architecture (`src/eva/{assistant,backend,user_simulator,orchestrator,
   metrics,models,role}/`, `src/eva/run_benchmark.py`). Integrity: pin the
   commit + the scenario/perturbation dataset hashes (incl. HF dataset
   revision); note research-grade status in the truth pack.
4. **saharmor/voice-lab** — oracle for interruption/pause metric *ideas*
   (`speech_testing/metrics/{interruptions.py,interruptions_utils.py,
   pauses.py}`, `web_test_scenarios.json`). Integrity: pin commit
   (last push 2025-06-04, stale — do not depend on it as a live fixture
   source); copy metric definitions, not test outcomes.
5. **TEN-framework/ten-framework** — oracle for multi-OS integration-matrix
   shape (per-OS test workflows) only; not a latency or pipeline oracle.
6. **openai/openai-agents-js** — oracle for multi-runtime conformance
   (`integration-tests/` per-target suites) when the stack targets more
   than one runtime.

Per-oracle truth-pack shape (model-guides §1–2): `PIN_RECORD.md`,
`MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json` (break-even thresholds —
e.g. max TTFA for a tier, interruption-resume correctness bounds),
`NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh --verify`. UNK-VA-1: no
incumbent publishes a time-to-first-audio benchmark dashboard or regression
gate — there is no ground-truth latency oracle to verify against; latency
truth is at best T1 ([CI-observed], measured by us) or a CONTESTED T2
[Maintainer claim] number. UNK-VA-2: eva's HF dataset revision has not been hash-verified by
us; treat its published scenarios as T2 until re-fetched and hashed.

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, evidenced from the verified repos.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
Statuses: ADMISSIBLE / CONTESTED / WITHDRAWN. The ATLAS R7 `owner` field for
each claim is the owning bead (per G3); owners named here are provisional
[INFERENCE]: `bead-claim-owners` to be assigned in S3.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|----|-----------|------------------|------|--------|---|
| CLAIM-VA-1 | Category is real and active: multiple independently-maintained open-source voice-agent frameworks, each with same-day or recent pushes and 4-digit+ stars. | pipecat-ai/pipecat (15,807, pushed 2026-09-23); livekit/agents (14,328, pushed 2026-09-23); TEN-framework/ten-framework (11,141, pushed 2026-09-22) | T0 | High | ADMISSIBLE |
| CLAIM-VA-2 | The stack decomposes as realtime media transport + agent orchestration; frameworks ride on a separately-maintained SFU. | livekit/livekit (21,065, SFU, pushed 2026-09-23) underpinning livekit/agents | T0 | High | ADMISSIBLE |
| CLAIM-VA-3 | A first-party vendor ships voice-agent orchestration, not just an API: this is framework territory, not SDK-demo territory. | openai/openai-agents-js (3,852, "framework for multi-agent workflows and voice agents", pushed 2026-09-23) | T0 | High | ADMISSIBLE |
| CLAIM-VA-4 | Type norm: deterministic fake doubles for every pipeline stage, so tests run without API keys or network. | livekit/agents `tests/fake_stt.py`, `fake_llm.py`, `fake_tts.py`, `fake_realtime.py`, `fake_session.py`, `fake_io.py`, `fake_vad.py`, `fake_turn_detector_ws.py` | T0 | High | ADMISSIBLE |
| CLAIM-VA-5 | Type norm: latency metric classes with their own unit tests (TTFA via RMS speech-onset detection on PCM, TTFAT, TTFB) plus runtime observers. | pipecat-ai/pipecat `tests/test_ttfa_metrics.py`, `test_ttfat_metrics.py`, `test_ttfb_metrics.py`, `test_user_bot_latency_observer.py`, `test_speaking_observer.py` | T0 | High | ADMISSIBLE |
| CLAIM-VA-6 | Type norm: a dedicated interruption / turn-taking test surface, including false-interruption resume and interruption hold windows. | livekit/agents `tests/test_interruption/` dir, `test_false_interruption_resume.py`, `test_interruption_hold_window.py`; `tests/test_realtime/` variants | T0 | High | ADMISSIBLE |
| CLAIM-VA-7 | Type norm: virtual (fake) time for deterministic timing tests. | livekit/agents `tests/virtual_time.py` | T0 | High | ADMISSIBLE |
| CLAIM-VA-8 | Type norm: live-provider integration tests are secrets-gated, path-triggered, and skipped on forks — separate from unit CI. | livekit/agents `.github/workflows/test-realtime.yml` (`pytest --realtime` against OpenAI/Azure realtime APIs via repo secrets) | T0 | High | ADMISSIBLE |
| CLAIM-VA-9 | Type norm: LLM-judge eval harness runs in CI over example apps, alongside judge unit tests. | livekit/agents `.github/workflows/evals.yml` + `tests/test_evals.py`, `tests/test_judge.py`; pipecat `tests/test_evals_*.py` family | T0 | High | ADMISSIBLE |
| CLAIM-VA-10 | Type norm for e2e evaluation: bot-to-bot caller simulation (assistant + user_simulator + orchestrator), including perturbation suites (noise, accents, connection degradation) — simulate the caller, not just the pipeline. | ServiceNow/eva `src/eva/{assistant,backend,user_simulator,orchestrator,metrics,models,role}/`, 213 enterprise scenarios | T0 | High | ADMISSIBLE |
| CLAIM-VA-11 | Interruption and pause metrics are first-class eval dimensions, defined over JSON test scenarios. | saharmor/voice-lab `speech_testing/metrics/{interruptions.py,pauses.py}`, `web_test_scenarios.json` | T0 | High | ADMISSIBLE |
| CLAIM-VA-12 | Fault injection / network degradation belongs in the test tree (toxiproxy), not in ad-hoc manual testing. | livekit/agents `tests/toxic_proxy.py` + `tests/Dockerfile.toxiproxy`; ServiceNow/eva perturbation suite | T0 | High | ADMISSIBLE |
| CLAIM-VA-13 | The incumbents test latency but do not gate it: no published time-to-first-audio benchmark dashboard or latency regression gate was found in either framework. | thin: searched pipecat and livekit test trees per evidence notes; TTFA/TTFAT/TTFB are metric tests, `test_e2e_latency_handoff.py` is a test — none is a gate | T0 | High | ADMISSIBLE |
| CLAIM-VA-14 | [INFERENCE] Multi-runtime conformance per target is the expected integration-test shape when the stack is multi-runtime (node/deno/bun/cloudflare/react-native/vite-react). | openai/openai-agents-js `integration-tests/` per-target suites + `vitest.integration.config.ts` | T3 | Low | CONTESTED |
| CLAIM-VA-15 | [INFERENCE] Provider-SDK drift watching is load-bearing for a plugin-heavy stack (~40 providers), not optional hygiene. | livekit/agents plugin tree (~40 STT/LLM/TTS providers: deepgram, cartesia, elevenlabs, assemblyai, soniox, telnyx…); pipecat `provider-watch.yml` | T3 | Low | CONTESTED |

CLAIM-VA-14 is CONTESTED because the per-runtime matrix shape is evidenced
in only one repo (openai/openai-agents-js) and may be JS-runtime-specific
rather than type-normative. CLAIM-VA-15 is CONTESTED because
`provider-watch.yml`'s enforcement effect (does it gate or merely notify?)
was not verified.

## Gate profile

Starter-kit gates G1–G14 (canonical definitions in PROJECT-PICKUP-PLAYBOOK.md,
from `_s0/g1-g14-reference.md`). Applicability below is [INFERENCE] from the
type's evidence, marked where uncertain.

**Apply as-is (load-bearing):**
- G1 (ORACLE): pin the oracle inventory — incumbent framework commit,
  provider SDK revisions, scenario/perturbation datasets — in truth-pack
  shape; oracle shielded from the implementing agent.
- G3 (OWN): every CLAIM-VA-* row carries an owning bead; unowned claims
  fail.
- G4 (CONTRACT): claim artifacts conform to the registry contract
  (ATLAS R7 fields: class, validity domain, oracle, negative control/mutant,
  evidence artifact, do-not-claim boundary, owning bead, gate).
- G5 (HOST): host-parity — latency numbers bind to the host/generation;
  never compare TTFA across hosts or generations (measurement law).
- G7 (REVIEW): split-context adversarial review on pipeline-semantics
  claims; default-refute for any "matches incumbent behavior" claim.
- G8 (RULEBOOK): Rulebook claim discipline; trial-before-scale on
  caller-simulation scenarios.
- G9 (IOU): zero unresolved structured IOUs at close — especially
  secrets-gated live-test gaps ("could not run live Azure path").
- G12 (AUDIT): class-fix then instance re-audit for each
  interruption/turn-taking bug class (false interruption, resume, hold
  window).
- G13 (NOSTUB): no stub stages left in the tree — a fake double with
  no behavior is a stub and fails.
- G14 (REJECT): claims violating their Rulebook-tier evidential burden
  rejected — e.g. a T0-style "beats vendor latency" claim with only
  self-measured numbers.

**Advisory or N/A for this type:**
- G2 (PAIR): paired/differential contract — meaningful for
  model-kernel parity; for orchestration semantics the differential arm is
  the pinned incumbent running side-by-side where license/weight terms
  allow; advisory until UNK-VA-3 resolved.
- G6 (UNSAFE): load-bearing only if the stack has unsafe/FFI code
  (native audio, WebRTC bindings); pure-managed stacks record N/A with
  evidence.
- G10 (MIRI): same scoping as G6.
- G11 (LAYOUT): advisory; layout assertions matter for binary/wire
  formats, not pipeline semantics.

**Proposed new type-specific gates (GATE-VA-*):**

- GATE-VA-1 "fake-doubles completeness": every pipeline stage interface has
  a deterministic fake double; CI fails if a stage is reachable only via a
  live provider. Acceptance: `tests/` fake-double inventory lists all stage
  interfaces; a conformance check asserts each interface has a fake and each
  fake runs with network disabled.
- GATE-VA-2 "latency metric-class coverage — RETIRED into shared GATE-013"
  (S4 round 1, dedup). GATE-013 acceptance (1) already requires TTFA-class
  metric unit tests; (5) requires the latency regression gate in CI.
  Retained as a type-specific parameter: no latency number may enter the
  claim registry before the gate passes, and NONDETERMINISM_FLOOR records
  timing-perturbed stages.
- GATE-VA-3 "interruption matrix on virtual time — RETIRED into shared
  GATE-013" (S4 round 1, dedup). GATE-013 acceptance (3)–(4) already require
  the interruption surface and virtual clocks. Retained as a type-specific
  parameter: the full matrix runs green ×3 consecutive runs with zero
  real-time sleeps in assertions; wall-clock independence asserted by
  rerunning with perturbed virtual-clock granularity.
- GATE-VA-4 "secrets-gated live tests stay separate": the live-provider
  workflow is path-triggered, skipped on forks, and is never a merge
  requirement for unit CI. Acceptance: workflow file exhibits `if`/
  secrets gating + fork skip; unit CI green on a fork-shaped run with no
  secrets.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-013 (voice latency / interruption) | Load-bearing | Applies to this slug; latency + interruption are the type's acceptance surface |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Universal | Applies to all types; provider SDK revision table |
| GATE-018 (flake quarantine) | Advisory | Virtual-clock suites are deterministic, so flake is low-probability; quarantine with label, not blocking by default |
| GATE-VA-1 (fake-doubles completeness) | Load-bearing | Fakes are the type's test surface; a stage with no fake is a stub (G13) |
| GATE-VA-4 (secrets-gated live tests) | Load-bearing | Guards the PR path from secret-bearing live-provider tests |

## Evidence tiers

Canonical pickup tiers (per PROJECT-PICKUP-PLAYBOOK.md), via the
localbench/model-guide vocabulary
([Verified]/[Maintainer claim]/[External]/[Inference]):

- **T0 [Verified] (code/count/Git-observed):** claims about the type's
  process norms evidenced by named files in verified repos — fake doubles
  (`livekit/agents tests/fake_*`), TTFA metric tests
  (`pipecat tests/test_ttfa_metrics.py`), interruption suites
  (`livekit/agents tests/test_interruption/`), virtual time
  (`tests/virtual_time.py`), toxiproxy fault injection, per-OS CI matrices
  (`TEN-framework tman_full_*`). Star counts and push dates as cited
  (2026-09-23 API snapshot). Localbench analog: [CI-observed] attests the
  suite *runs*, not that it is green — a latency metric test passing is
  T0 for "metric exists", not for "latency is X".
- **T2 [Maintainer claim]:** README/tagline claims ("Open Source
  framework for voice agents", "~40 provider plugins", "213 enterprise
  scenarios"), arXiv paper + leaderboard + HF dataset claims from
  ServiceNow/eva. Admissible as trend evidence, never as performance
  evidence.
- **T2 [External]:** third-party evaluations, the eva leaderboard as
  an evaluation-methodology reference (research-grade, 216 stars — not a
  framework oracle), saharmor/voice-lab's interruption/pause metric
  *definitions* (stale since 2025-06-04 — ideas only).
- **T1 [CI-observed]:** any number the new project measures about
  itself (TTFA on its own harness, "supports N providers") — admissible in
  the claim registry only with A/A goldens, receipts, and recorded binary
  SHA-256; self-measured numbers never support comparative claims without
  T0 backing.
- **T3 [Inference]/TARGETED:** gate thresholds not yet met
  ("TTFA p95 ≤ X ms"), multi-runtime conformance targets — labeled
  TARGETED, never OBSERVED (nlp-pattern, model-guides §4).

Comparative claims ("faster than incumbent X at TTFA") require a same-
invocation side-by-side with the pinned incumbent in the room and the
incumbent binary SHA-256 recorded — the CAMPAIGN WIN result-class doctrine
(model-guides §3). Latency numbers without a published incumbent gate are
diagnostic until shared GATE-013 passes.

## Localbench bench shape

Instantiating localbench slots 1–13 for realtime voice-agent stacks:

1. **Spec format** — `framework:model-path` naming exactly what is measured,
   e.g. `frankenvoice:pipecat@<commit-sha>:pipeline/default`
   (framework under test : pinned incumbent commit : harness path). The
   harness starts/stops the agent session and the fake-provider backends
   itself.
2. **Tiers** — named workload tiers: `stage` (per-stage fake-double
   conformance), `latency` (TTFA/TTFAT/TTFB metric suites on fixture PCM),
   `interruption` (turn-taking matrix on virtual time), `e2e` (full
   pipeline with fake providers, bot-to-bot caller simulation),
   `live` (secrets-gated provider integration — banked separately, never
   compared against local tiers), `fault` (toxiproxy degradation scenarios).
   Goldens bind PER TIER; a stage change invalidates only the tiers it
   touches. **Latency truth** [RESOLVED 2026-09-23, S4 round 3 — UNK-VA-1
   triaged RESOLVED]: the project's latency truth is self-measured T1 via
   pipecat-style TTFA metric classes with A/A-banked goldens (the `latency`
   tier above); vendor latency marketing numbers are inadmissible.
3. **Golden schema** — JSON per spec: `conformance` (named checks, each
   `level: MUST|SHOULD`, `verdict: PASS|FAIL`) + `metrics` (each with
   `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt path,
   `better` direction). Tolerance rule: `tol = max(3 × A/A relative
   spread, floor)`; the floor for latency tiers MUST account for the audio
   frame quantum (e.g. 20 ms frames ⇒ floor ≥ frame quantum), recorded in
   NONDETERMINISM_FLOOR.md.
4. **Only banking ceremony** — `aa <spec> --write-golden` A/A pair run,
   then `git diff goldens/` review in the same commit. Latency tiers: the
   A/A pair runs on the virtual clock for determinism, then once on
   wall-clock as a sanity receipt; golden-regeneration-until-green is a
   named forbidden pattern.
5. **Host/generation binding** — `goldens/<host_id>/`; never across hosts
   or generations (provider SDK or transport updates = new generation;
   status CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden).
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%,
   names processes); runs marked CONTENDED if any non-backend process
   exceeds 25% GPU in a second; one session under test at a time;
   loopback/local-only endpoints for all non-`live` tiers (a failed local
   call is a finding, never a cloud fallback); park/unpark interfering
   residents during test windows.
7. **A/B discipline** — same-invocation A, B, A ordering; banked under a
   name. For incumbent comparisons: the pinned incumbent runs in the same
   invocation, its binary SHA-256 recorded.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run) + dated `.md` notes; `runs/` gitignored with
   `<ts>__<kind>__<spec>` dirs. Latency receipts MUST include the metric-
   class fixture PCM hash and the virtual-clock seed.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact framework
   commit SHAs, provider SDK versions + hashes, transport (SFU/server)
   versions, OS/audio stack versions.
10. **Claims registry wiring** — `registries/claims.tsv`: every public
    claim sentence registered and machine-checked against its receipt on
    every commit (`check_claims.py`-style linter; observes-and-reports at
    minimum, gates when wired).
11. **Negative-evidence ledger** — `NEGATIVE_EVIDENCE.md`,
    `DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`; latency
    regressions and interruption-behavior kills carry resurrection
    predicates; demotions always allowed; no self-grading without
    independent verification.
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim in
    AGENTS.md, with voice-agent readings: "golden regeneration reflex"
    fires on latency tiers; "bench-path hardcoding" fires if the TTFA
    metric only passes on the fixture PCM; "tautological tests" fires if a
    fake double asserts its own scripted output.

**Remote-lab variant:** the `live` tier cannot run locally by definition
(it needs vendor API keys and WAN). It runs in a secrets-gated CI workflow
(path-triggered, fork-skipped), banked as its own receipt kind with the
provider endpoint + SDK SHA recorded — it never dilutes the local tiers.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **Truth-pack template for pipeline frameworks:** extend the
   `docs/truth-pack/` template with voice-agent slots — incumbent
   framework commit, provider-plugin SDK revision table, fixture-PCM
   manifest, virtual-clock seed policy. Files:
   `templates/voice-agents/truth-pack/PIN_RECORD.md`,
   `templates/voice-agents/truth-pack/ACCEPTANCE_SURFACE.json` (latency
   break-even fields), `templates/voice-agents/truth-pack/NONDETERMINISM_FLOOR.md`
   (timing-perturbation register).
2. **Fake-double harness scaffold:** `templates/voice-agents/harness/fake_stage.py`
   (stage-interface fake with network-disabled self-check) +
   `templates/voice-agents/harness/virtual_time.py` — starter-kit copies of the
   livekit-agents pattern (REQ-VA-2, REQ-VA-4).
3. **Latency metric-class scaffold:** `templates/voice-agents/metrics/ttfa.py`
   (RMS speech-onset detection on PCM + TTFA/TTFAT/TTFB metric classes
   with fixture-based unit tests) — starter-kit copy of the pipecat
   pattern (REQ-VA-3, shared GATE-013).
4. **Caller-simulation eval scaffold:** `templates/voice-agents/evals/` —
   bot-to-bot harness skeleton (`assistant/`, `user_simulator/`,
   `orchestrator/`, `metrics/`) + perturbation-scenario JSON schema,
   after the ServiceNow/eva architecture (CLAIM-VA-10).
5. **New gates GATE-VA-1 and GATE-VA-4** defined as type-local gates in this
   companion's gate profile (per the amendment procedure — type-local gates
   live in the companion, not the shared registry) with acceptance criteria
   from the Gate profile section above. GATE-VA-2/3 retired into shared
   GATE-013; retained type-specific parameters: no latency number may enter
   the claim registry before the gate passes (GATE-VA-2), and the
   interruption matrix runs green ×3 consecutive runs with zero real-time
   sleeps in assertions (GATE-VA-3).
6. **Interruption test-matrix template:** `templates/voice-agents/tests/test_interruption/`
   covering interrupt, false-interruption resume, protected speech,
   disallow-interruptions pause, hold window, overlapping speech —
   modeled on livekit/agents `tests/test_interruption/` and
   `tests/test_realtime/`.
7. **Secrets-gated live-test workflow template:**
   `templates/voice-agents/ci/test-live.yml.template` — path-triggered,
   secrets-gated, fork-skipped, never a merge requirement for unit CI
   (GATE-VA-4; livekit `test-realtime.yml` pattern).
8. **Incumbent pin ledger:** `templates/voice-agents/docs/evidence/incumbents.md`
   template with rows for framework commit SHA, provider SDK + hash,
   transport version, OS/audio stack.
9. **CI provisioning + cost ownership:** runner class/host, provisioning
   owner, funding owner/account, schedule, and spend cap for the bench
   tiers named above — TBD acceptable pre-S5 (any TBD blocks S5 per Bench
   slot 13); current: TBD (owner: parent orchestrator assigns at S3).

## Trend + process citations

Verified 2026-09-23 via GitHub API (stars snapshot that day):

- `pipecat-ai/pipecat` | 15,807 | pushed 2026-09-23 — Flagship open-source voice-agent pipeline framework; process takeaway: TTFA/TTFAT/TTFB metric classes with dedicated unit tests and runtime observers are the best in-repo latency practice found.
- `livekit/agents` | 14,328 | pushed 2026-09-23 — Realtime voice-agent framework with ~40-provider plugin tree; process takeaway: fake doubles for every pipeline stage + virtual time + toxiproxy fault injection + secrets-gated live-provider workflow is the harness pattern to copy whole.
- `TEN-framework/ten-framework` | 11,141 | pushed 2026-09-22 — Conversational voice-AI framework; process takeaway: heavy multi-OS CI matrix plus AI-agent-review workflows show the integration-matrix shape for cross-platform stacks.
- `livekit/livekit` | 21,065 | pushed 2026-09-23 — Realtime media SFU transport underpinning the agent frameworks; process takeaway: the stack is transport + orchestration, and the transport is a separately-pinned incumbent.
- `openai/openai-agents-js` | 3,852 | pushed 2026-09-23 — First-party vendor voice-agent orchestration framework; process takeaway: per-runtime integration-test suites (node/deno/bun/cloudflare/react-native/vite-react) are the conformance shape when multi-runtime.
- `openai/openai-realtime-console` | 3,614 | pushed 2025-08-28 — Vendor debugging UI for the Realtime API; trend-only, not a pipeline framework; less actively pushed.
- `ServiceNow/eva` | 216 | pushed 2026-09-23 — End-to-end voice-agent evaluation framework (arXiv paper, public leaderboard, HF dataset); process takeaway: bot-to-bot caller simulation with 213 enterprise scenarios and a perturbation suite is the e2e-eval architecture to copy; research-grade, not a framework oracle.
- `saharmor/voice-lab` | 176 | pushed 2025-06-04 — Independent LLM-as-a-judge voice-agent testing framework; process takeaway: interruption/pause metrics as first-class eval dimensions over JSON scenarios — ideas only, stale as a dependency.

**Honest caveats (carried over):** vocode-ai/vocode 404s and was dropped —
do not cite it. Latency is tested, not gated, in the incumbents: no
published time-to-first-audio benchmark dashboard or regression gate was
found. eva is evaluation-methodology reference (216 stars, narrow domain),
not a framework. voice-lab's last push is 2025-06-04. openai-realtime-
console is vendor debugging UI, not a pipeline. Nothing above was cited
from memory.

## Unknowns (UNK-*)

- UNK-VA-1: No incumbent publishes a time-to-first-audio benchmark
  dashboard or regression gate — there is no ground-truth latency oracle
  to verify against. Must resolve before S5: decide whether the project's
  latency truth is (a) self-measured T1 with A/A goldens, or (b) a newly
  constructed independent benchmark; either way, vendor latency marketing
  numbers are inadmissible.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Latency-oracle decision resolved: adopt (a) — the project's latency truth is self-measured T1 via pipecat-style TTFA metric classes with A/A-banked goldens; vendor latency marketing numbers are inadmissible (the row's own rule). Grounded in the pack: pipecat's TTFA/TTFAT/TTFB metric classes with dedicated unit tests are the best in-repo latency practice found; livekit measures e2e latency in test_e2e_latency_handoff.py.
- UNK-VA-2: ServiceNow/eva's HuggingFace dataset revision has not been
  hash-verified by us; scenario/perturbation fixtures are T2 until
  re-fetched, hashed, and pinned in MANIFEST.sha256.
  **Disposition: TARGETED.**
- UNK-VA-3: Whether the pinned incumbent (livekit/agents or pipecat) can
  legally and practically run side-by-side in the same invocation for
  CAMPAIGN WIN comparisons (license terms for benchmark use, provider
  API costs, API-key provisioning for the oracle arm). Must resolve
  before any comparative claim is banked.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Side-by-side incumbent feasibility parked: S3 records license verdict + cost sign-off + key provisioning in incumbents.md; CAMPAIGN WIN gated on all three. Promotion predicate: at S3 incumbent pinning, record in incumbents.md (i) license terms permitting benchmark use of the pinned incumbent, (ii) API-cost budget sign-off by the funding owner, (iii) oracle-arm key provisioning; CAMPAIGN WIN side-by-side comparisons are gated on all three — otherwise comparative claims stay capped below CAMPAIGN WIN. Owner: parent orchestrator (funding/legal authority). S3 step: incumbent pinning.
- UNK-VA-4: Acceptance thresholds for interruption behavior
  (false-interruption rate, resume latency bounds) have no incumbent-published
  ground truth — the project's ACCEPTANCE_SURFACE.json break-even values
  for turn-taking are currently engineering judgment, not oracle-derived.
  **Disposition: TARGETED.**
- UNK-VA-5: The `live` tier's secrets-gated workflow needs a key-
  provisioning and rotation policy (who holds vendor API keys, spend
  caps, fork-PR secret isolation) before S5; without it, live tests are
  either unrunnable or a supply-chain/credential risk.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Live-tier key policy parked: parent orchestrator commits key holder, spend cap, rotation cadence before BEADS READY; fork-PR isolation already in the template; TBD blocks the cert. Promotion predicate: before BEADS READY, the parent orchestrator names the key-holding role, spend cap, and rotation cadence for the live tier; fork-PR secret isolation is already specified in the workflow template (item 7); any remaining TBD blocks the BEADS READY cert per bench slot 13. Owner: parent orchestrator (funding/provisioning authority). S3 step: pre-BEADS READY.
