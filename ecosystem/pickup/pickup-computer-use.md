# Pickup companion: Computer-use agents

S2 artifact, pickup planning-arc. Evidence base: `_evidence/computer-use.md` (GitHub API-verified 2026-09-23). Patterns: `_s0/localbench-pattern.md`, `_s0/model-guides.md`, INTENT.md. Stable IDs REQ-*/GATE-*/CLAIM-*/UNK-* per user requirement. All repos, paths, and star counts copied from the evidence file; nothing from memory.

## Charter seed

**What this type is.** Software agents that operate a real desktop OS (Ubuntu/Windows in practice) the way a human does: they observe the screen (screenshots), parse it into UI structure via a grounding layer, and act through keyboard/mouse/input automation to complete multi-step tasks in a VM or physical machine. The stack decomposes into three layers: (1) grounding (vision-language models or parsers that locate UI elements from pixels), (2) the agent loop (planner + action executor), (3) evaluation infra (VM harnesses that score machine state, not chat).

**In scope.** Screenshot-driven desktop agents; grounding VLMs and screen-parsing tools; state-based VM benchmark harnesses; agent infra (VM fleets, drivers, bench libraries). **Out of scope.** Browser-only automation stacks (covered by `browser-use`); pure macro-recorder RPA products with no ML component; model-weight training itself (covered by `fine-tuning`); mobile-only test harnesses (trycua/cua lists Android, but the verified category signal is desktop).

**Trust boundary.** The agent under test must never leave its sandbox: evaluation runs target a pinned VM/container image, and escape is a scored failure, not an infra hiccup. Anything the agent touches — screen pixels, input devices, filesystem, network — is an ambient read that must be declared (G5 load-bearing here).

**Release definition.** A started project releases when: a `docs/truth-pack/` pins the benchmark commit and fixture hashes; a localbench bench exists with A/A-banked goldens; every public claim sits in `registries/claims.tsv` with a receipt; and no competitive claim rests on a self-reported README score.

**What "a good starting point" means for this type.** Day one you can: spin up the pinned OSWorld harness in a local VM, run the pinned ScreenSpot-Pro grounding protocol against your grounding layer with a fixed seed, and bank A/A goldens for both before writing any agent code — so "did my agent get better?" is always answered against a frozen oracle, never against a README percentage.

### Requirements

- REQ-01: A started project ships `docs/truth-pack/` with the pinned benchmark commit, evaluator-file SHA-256s, and fixture hashes plus `fetch-truth-pack.sh --verify` before any comparative claim is admissible.
- REQ-02: Every scored run records the agent binary's SHA-256 AND the VM/container image's SHA-256 at invocation; a run with either unrecorded is diagnostic-only (whisper rule, model-guides §2).
- REQ-03: Evaluation is state-based (score VM state, not the agent's trace) with an explicit FAIL protocol: infeasible tasks score only when the agent's last action is FAIL (OSWorld norm).
- REQ-04: README-reported benchmark percentages are marked [self-reported] until an independent A/B/A localbench run reproduces them; no public competitive claim rests on a self-reported score alone (CLAIM-09).
- REQ-05: Any grounding-accuracy claim requires a ScreenSpot-protocol run (predicted point inside ground-truth box, fixed seed) against the pinned harness — never eyeballed screenshots.
- REQ-06: Releases report binary pass rates alongside step-count distributions and, where the harness supports it, partial-credit scores (OSWorld-V2 norm); a pass rate without its step distribution is a draft note.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Truth-pack shape per model-guides §1: `PIN_RECORD.md`, `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json` (break-even thresholds), `NONDETERMINISM_FLOOR.md`, `fetch-truth-pack.sh --verify`. Invocation-time oracle binary SHA-256 recording per whisper rule (model-guides §2).

1. **xlang-ai/OSWorld** (pinned commit) — the de-facto desktop-agent benchmark: 369 tasks, real Ubuntu/Windows VM, state-based eval (`desktop_env/desktop_env.py::_evaluate_with_evaluator`, `desktop_env/evaluators/` with `getters/` + `metrics/` split). Integrity: pin the commit in `PIN_RECORD.md`; `MANIFEST.sha256` covers `evaluation_examples/test_all.json`, `desktop_env/evaluators/**`, `run.py`, `lib_run_single.py`; run receipt records the VM image SHA-256 at invocation. UNK-01: OSWorld has no visible GitHub CI — its quality control is harness design plus community reproduction, so the truth pack must also pin the community-adopted reproduction path (simular-ai/Agent-S `osworld_setup/s3/`).
2. **xlang-ai/OSWorld-V2** (pinned commit) — 108 long-horizon workflows, fine-grained partial rewards, safety reports; `evaluation_examples/test_v2.json`. Integrity: same truth-pack shape; `ACCEPTANCE_SURFACE.json` pre-computes partial-credit thresholds before any experiment (tts break-even pattern, model-guides §6). UNK-02: safety-report schema stability not independently verified in the evidence pass.
3. **likaixin2000/ScreenSpot-Pro-GUI-Grounding** (pinned commit) — grounding-accuracy oracle: `eval_screenspot_pro.py` (filters by platform/language/instruction-style/gt-type, fixed seed), "predicted point inside ground-truth box" protocol. Integrity: pin script + fixture hashes; seed is part of `PIN_RECORD.md`; fixture screenshots bound by hash in `MANIFEST.sha256`. UNK-03: fixture redistributability/pinability in-tree not verified.
4. **trycua/cua `libs/cua-bench`** (pinned commit) — first-class bench library oracle for the infra layer: `cua_bench/`, `tasks/`, `example_tasks/`, `datasets/`, CI-tested by `ci-py-bench.yml` and `ci-cold-start-benchmark.yml`. Integrity: benchmark-regression-as-CI pattern means the oracle is *executed*, not just pinned; invocation records both the bench package SHA and the CI job that validated it. This is the only candidate oracle whose own CI is legible.
5. **microsoft/OmniParser** (pinned commit) — grounding-layer reference oracle: `eval/ss_pro_gpt4o_omniv2.py` with results logs `eval/logs_sspro_omniv2.json`. Integrity: pin parser weights revision + eval script; results logs serve as `NONDETERMINISM_FLOOR.md` input for parser-side variance.
6. **microsoft/WindowsAgentArena** (pinned commit) — the Windows-half counterpart: `scripts/build-container-image.sh`, `scripts/run.sh`, `scripts/run_azure.py`, `scripts/experiments.json`. Integrity: same truth-pack shape, but weaker: thin maintenance (last push 2026-04-13, 901 stars, no visible CI). UNK-04 (maintenance future), UNK-05 (`scripts/win-arena-container` 404'd during evidence verification — unverified pointer).

No new-claim oracle: any README percentage (Agent-S's reported OSWorld scores, etc.) is T2 [Maintainer claim] until reproduced locally — REQ-04.

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-01 | The category's market signal is benchmark score (OSWorld / WindowsAgentArena), not downloads or installs. | thin: no download-equivalent exists; scores are what READMEs report across simular-ai/Agent-S, bytedance/UI-TARS-desktop | T3 | Low | ADMISSIBLE |
| CLAIM-02 | State-based evaluation (score the VM's end state, not the agent's chat trace) is the type's standard protocol. | xlang-ai/OSWorld `desktop_env/desktop_env.py::_evaluate_with_evaluator`, `desktop_env/evaluators/` (`getters/` + `metrics/` split); reproduced by simular-ai/Agent-S and inclusionAI/AWorld `examples/osworld/` | T0 | High | ADMISSIBLE |
| CLAIM-03 | Per-task JSON configs (instruction + setup + evaluator) are the portable task format. | xlang-ai/OSWorld `evaluation_examples/test_all.json`, xlang-ai/OSWorld-V2 `evaluation_examples/test_v2.json`, simular-ai/Agent-S `evaluation_sets/test_all.json` | T0 | High | ADMISSIBLE |
| CLAIM-04 | Infeasible tasks require an explicit FAIL last-action to score — refusal-by-timeout scores 0, which blocks reward-hacking by refusal. | xlang-ai/OSWorld evaluator func `"infeasible"` | T0 | High | ADMISSIBLE |
| CLAIM-05 | Grounding (screen parse → structured UI elements) is the reusable building block that grounding models and agents alike depend on. | microsoft/OmniParser ("towards pure vision based GUI agent"); bytedance/UI-TARS grounding model + bytedance/UI-TARS-desktop product pair | T0 | High | ADMISSIBLE |
| CLAIM-06 | The trend is moving from binary pass/fail toward partial-credit, longer-horizon evaluation (108 workflows, ~1.6 hr human median, ~318 tool calls/task, safety reports). | xlang-ai/OSWorld-V2; thin on adoption breadth — only the benchmark's own repo evidences the trend so far | T0 | High | ADMISSIBLE |
| CLAIM-07 | The category is research-heavy: only trycua/cua and bytedance/UI-TARS-desktop are products; the rest are research artifacts (papers + code). | thin: analyst judgment across the 10 verified repos (verified live 2026-09-23); adoption of any single agent stack is unproven beyond benchmarks | T3 | Low | ADMISSIBLE |
| CLAIM-08 | The CI practice to copy is trycua/cua's, not the benchmarks': 100+ reusable workflows, per-package CI, bench-as-first-class-library CI, E2E driver CI on real OS runners; OSWorld has no visible GitHub CI and WindowsAgentArena's is thinner. | trycua/cua `.github/workflows/ci-py-bench.yml`, `ci-cold-start-benchmark.yml`, `e2e-rust-{linux,macos,windows,linux-wayland,standalone-browsers}.yml`, `ci-driver-mcp-candidate.yml` | T0 | High | ADMISSIBLE |
| CLAIM-09 | README-reported OSWorld/WindowsAgentArena percentages are self-reported and must be discounted absent independent reproduction. | thin: evidence-file caveat "the benchmark IS the market signal... self-reported and deserve discounting"; simular-ai/Agent-S reports scores in README | T2 | Medium | ADMISSIBLE |
| CLAIM-10 | Grounding-accuracy protocol: predicted point inside ground-truth box, fixed seed, filterable by platform/language/instruction-style/gt-type (ScreenSpot protocol). | microsoft/OmniParser `eval/ss_pro_gpt4o_omniv2.py` + `eval/logs_sspro_omniv2.json`; likaixin2000/ScreenSpot-Pro-GUI-Grounding `eval_screenspot_pro.py` | T0 | High | ADMISSIBLE |
| CLAIM-11 | Benchmark commits must be pinned in run manifests to prevent silent harness drift (practice visible in the wild, e.g. ouroboros `devtools/benchmarks/osworld/METHODOLOGY.md` pinning OSWorld-V2 commit `c261cb57…`). | thin: third-party observation, not independently re-verified this pass (UNK-06) | T2 | Medium | ADMISSIBLE |
| CLAIM-12 | The Windows half of the standard eval pair is the weaker leg: WindowsAgentArena lags OSWorld in maintenance cadence and has no visible CI beyond default. | microsoft/WindowsAgentArena: 901 stars, last pushed 2026-04-13, `.github/` listing shows no substantive workflows | T0 | Medium | CONTESTED (thin: one repo's snapshot; maintenance could move without notice) |
| CLAIM-13 | Multi-generation agent structure with versioned eval configs per generation keeps old configs reproducible as the agent iterates. | simular-ai/Agent-S `gui_agents/{s1,s2,s2_5,s3}/`, `osworld_setup/{s1,s2,s2_5,s3}/`, `evaluation_sets/test_small_new.json`; `gui_agents/s2/WAA_setup.md` documents WindowsAgentArena setup | T0 | High | ADMISSIBLE |
| CLAIM-14 | Computer-use agents have reached commercial parity with human desktop operators on long-horizon tasks. | thin: none — OSWorld-V2 exists precisely because long-horizon operation is unsolved; no independent adoption beyond benchmarks (CLAIM-07) | T3 | — | WITHDRAWN |

## Gate profile

G1–G14 are the starter-kit's Phase C port-rigor gates (see starter-kit `scripts/gates/`).

| Gate | Applicability for computer-use agents |
|---|---|
| G1 ORACLE | **Applies as-is, load-bearing.** Oracle files (benchmark pins, task configs, grounding fixtures) are two-party assets; extends naturally to the benchmark-commit pin in every run manifest. |
| G2 PAIR | **Applies with type parameters.** Paired ops = VM setup/teardown, fleet provision/destroy, driver install/uninstall; halves must change together so no orphaned sandbox is left running. |
| G3 OWN | Advisory. Rust-ownership classification; only applies if agent infra/driver code is Rust. |
| G4 CONTRACT | **Applies, load-bearing.** Contract harness over the evaluator interface: the `getters/` + `metrics/` split (OSWorld) is exactly a contract boundary — getter output schema is frozen, metrics are pure functions over it. |
| G5 HOST | **Applies as-is, load-bearing.** Agents capture ambient inputs (screen pixels, input devices, filesystem, network) by design; `docs/host-boundaries.md` must list every capture point and refresh policy. |
| G6 UNSAFE | Advisory, with analog: Rust-`unsafe` sites are rare here, but the *type-specific analog* is OS-level input injection (synthetic key/mouse APIs) — every such call site needs a SAFETY-style justification; enforced via GATE-CUA-01 instead. |
| G7 REVIEW | **Applies.** Sensitive changes = driver code, input-injection paths, VM escape surfaces; diff-only review artifact required. |
| G8 RULEBOOK | Applies if bulk porting is declared; otherwise advisory. |
| G9 IOU | **Applies with type parameters, load-bearing.** Agent loops declare a positive tool-call budget (OSWorld-V2's ~318 calls/task is the category's scale reference); `max_rounds` maps to step budget + FAIL-after-budget. No unresolved structured IOU at the phase gate. |
| G10 MIRI | Advisory; Rust-only. |
| G11 LAYOUT | Advisory; Rust FFI structs only. |
| G12 AUDIT | **Applies.** Fix-class audits eradicate reward-hacking eval shapes: e.g. audit out "score chat trace" patterns, tautological evaluators, easy-task cherry-picking. |
| G13 NOSTUB | **Applies as-is, load-bearing.** No stubbed evaluators, no placeholder FAIL handlers — a stubbed evaluator is exactly how a computer-use agent games its own bench. |
| G14 REJECT | **Applies, load-bearing.** Safety properties rejected via compile_fail/sealed/test: "agent cannot act outside the pinned VM image" must be a sealed property, not a convention. |

**New type-specific gates (GATE-* IDs).**

- GATE-CUA-01 VM-CONTAINMENT: the agent under test runs only against the pinned VM/container image; acceptance — run receipt records image SHA-256 at invocation; any action targeting outside the image's sandbox marks the run FAIL; escape attempts are reported as findings, never retried silently.
- GATE-CUA-02 GROUNDING-PINNED: any grounding-accuracy claim passes the pinned ScreenSpot-Pro run at the recorded fixed seed; acceptance — point-in-box accuracy reported on the pinned fixture set with `MANIFEST.sha256`-bound screenshots; no screenshot-eyeball claims admitted.
- GATE-CUA-03 FAIL-PROTOCOL — RETIRED into shared GATE-008 (S4 round 1, dedup). GATE-008 acceptance (2) already requires the explicit FAIL action for infeasible tasks. Retained as a type-specific parameter: an infeasible task scores 1.0 iff the agent's last action is FAIL; timeout-without-FAIL scores 0; sets with zero infeasible tasks are rejected as cherry-picked.
- GATE-CUA-04 BENCHMARK-PIN — RETIRED into shared GATE-008 (S4 round 1, dedup). GATE-008 acceptance (4) already records the benchmark commit/revision in every run manifest. Retained as a type-specific parameter: the benchmark commit must equal the truth-pack pin; mismatch marks the run GENERATION-MISMATCH and it cannot bank a golden or support a public claim.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | Benchmark score claims rest on pinned benchmark commits + fixture hashes (REQ-01); live APIs are never oracles |
| GATE-008 (Browser/GUI task-state evaluator) | Load-bearing | Applies to this slug; state-based eval, FAIL protocol, benchmark pin in every run manifest (REQ-03; GATE-CUA-03/04 retired into 008) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; grounding/micro/smoke/full/long tiers |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; VM image hashes, benchmark commits, driver versions (incumbents.md) |
| GATE-018 (Flake quarantine) | Load-bearing | Applies to this slug; noisy pass rates quarantined, golden-regeneration-until-green is forbidden |

## Evidence tiers

Claim tiers T0–T3 are the canonical pickup tiers (per
PROJECT-PICKUP-PLAYBOOK.md), mapped here onto the Rulebook vocabulary and
the localbench receipt conventions:

- **T2 [Maintainer claim]** — vendor assertions in a README/docs (e.g.
  OmniParser's "towards pure vision based GUI agent", Agent-S's reported
  scores). Rises to T0 [Verified] only through analyst inspection
  ([Git-observed], [Code-verified], [Counted]) — never by vendor assertion
  alone.
- **T0 [Verified]** — fresh-clone inspection or live API verification (how
  this evidence file was built). **T1 [CI-observed]** when the evidence is a
  legible CI run — CI-observed attests the suite *runs*, not that it is
  green (OSWorld's absent CI is itself a T0 observation).
- **T2 [Maintainer claim]**, permanently, until an independent A/B/A
  localbench run reproduces it (REQ-04). Promotion requires a banked
  receipt, not a second citation.
- **T3 [Inference]**, always labeled; never admissible for public
  competitive claims (whisper's CAMPAIGN WIN doctrine, model-guides §3 —
  paraphrase, do not restate as fact).
- **T2 [External]** (papers: arXiv:2501.12326 for UI-TARS, CVPR 2025 for
  ShowUI, NeurIPS 2024 for OSWorld) can lift a claim toward T0 only via
  independent reproduction of the paper's protocol, never by citation alone.
- **Localbench wiring:** a claim enters `registries/claims.tsv` only when its receipt exists (`docs/evidence/receipts/<kind>__<spec>__<ts>.json`); anything without a receipt stays in `NEGATIVE_EVIDENCE.md` / `DISCREPANCIES.md`. Demotions are always allowed (localbench slot 11).

## Localbench bench shape

- **Spec format:** `agent:driver@model` — e.g. `agent-s:s3@cua-driver:ubuntu2404`, where the backend identity is the agent framework + generation dir (Agent-S `gui_agents/s3/`) + the VM image SHA-256. The harness provisions the pinned image itself; a failed local image pull is a finding, never a cloud fallback (measurement law, slot 6).
- **Named tiers:** `grounding` (ScreenSpot-Pro point-in-box), `micro` (single-step tasks), `smoke` (Agent-S `test_small_new.json`-scale subset), `full` (OSWorld 369 tasks via `test_all.json`), `long` (OSWorld-V2 108 workflows). Goldens bind per tier; a driver update re-banks only the tiers it touches.
- **Golden layout:** `goldens/<host_id>/` per spec; VM image SHA is part of the generation binding — image update = new generation (CURRENT / GENERATION-MISMATCH / UNAVAILABLE per golden).
- **Golden schema:** `conformance` — MUST: FAIL-protocol present (shared GATE-008 fail-protocol type-specific parameter), VM-containment declared (GATE-CUA-01), benchmark-commit pinned (shared GATE-008 benchmark-pin type-specific parameter); SHOULD: partial-credit reporting, safety-report emission; `metrics` — task success rate, median + p95 steps/task, grounding point-in-box accuracy, each with `value`, A/A `spread`, `tol = max(3 × A/A relative spread, floor)`, `tol_source` → banked receipt path, `better` direction.
- **Tolerance rule:** `max(3×A/A spread, floor)`; nondeterminism floor comes from `NONDETERMINISM_FLOOR.md` in the truth pack (VM scheduling jitter, screenshot timing variance — real, measured, committed).
- **A/B/A ordering:** same-invocation A, B, A on the same pinned image; banked under a name (e.g. `s3-vs-s2-grounding`). The 2026-08-23-style null rule (model-guides §3): dual A/A nulls outside [0.98, 1.02] bank NO cross-arm comparison.
- **Machine-state/contention receipts:** preflight refuses a busy host (GPU/CPU > 25%, names the processes); runs marked CONTENDED if any non-backend process exceeds 25% GPU in a second; one agent at a time; the host's own screen must be idle — screenshot-based evals are sensitive to on-screen interference, so park/unpark residents during test windows; receipts record host + image SHA + interfering-process list.
- **Banking ceremony:** goldens written ONLY by `aa <spec> --write-golden` (A/A pair), followed by `git diff goldens/` review in the same commit. Golden-regeneration-until-green is the named forbidden pattern (localbench slot 4) — acute here because pass rates are noisy and regenerating until a lucky VM run lands is trivially easy.
- **Incumbent pins:** `docs/evidence/incumbents.md` — exact VM image hashes, benchmark commits (OSWorld/OSWorld-V2/ScreenSpot-Pro), driver versions, OS builds, grounding-model weight revisions.
- **Remote-lab variant:** the full OSWorld tier is heavy for a host-only box. A pinned remote fleet (trycua `infra/fleets-wif-smoke/` pattern, periodic live smokes) may serve as the `full`/`long` substrate, but receipts are marked REMOTE-LAB, governed by GATE-CUA-01, and never compared against local goldens — same law, labeled substrate, no mixing. The remote-lab variant names its credential scopes (least-privilege provisioning tokens, VM access tokens), secret-hygiene rules, and a lab-side attestation mechanism (signed contention report or operator-stamped preflight) before REMOTE-LAB receipts can bank goldens.

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. `scripts/gates/check-vm-containment.sh` (+ `GATE-CUA-01` in `kit-gates.yml`): fails a diff that adds input-injection or driver code without a corresponding containment declaration; requires the pinned image SHA in the run manifest template.
2. `scripts/gates/check-benchmark-pin.sh` (registered under shared GATE-008's benchmark-pin type-specific parameter in `kit-gates.yml`): run-manifest template must name the benchmark commit; CI compares it against `docs/truth-pack/PIN_RECORD.md` and fails closed on mismatch.
3. `kit-oracle.yml` extension: `benchmark_pins:` section (repo, commit, evaluator-dir SHA-256) alongside existing `oracle_dirs:` — G1 extended to benchmark oracles.
4. `kit-loops.yml` guidance + `check-iou.sh` type parameter: `max_rounds` for agent loops must name a tool-call budget justified against the category scale (OSWorld-V2 ~318 calls/task); G9 gains a `budget_rationale` field.
5. `docs/truth-pack/` template for benchmark-type pins (not model-weight pins): `PIN_RECORD.md` template, `ACCEPTANCE_SURFACE.json` template with partial-credit threshold fields, `NONDETERMINISM_FLOOR.md` template with VM-jitter slots, `fetch-truth-pack.sh --verify` skeleton that pins evaluator scripts + fixtures.
6. `docs/host-boundaries.md` worked example for an agent: screen-capture point, input-injection point, filesystem-mount point, each with refresh policy — G5 becomes copy-paste for this type.
7. Type-specific reward-hacking entries in AGENTS.md: score-VM-state-only (no chat-trace scoring), FAIL-protocol anti-refusal-hack, no golden regeneration on noisy pass rates, no benchmark-commit drift.
8. Golden schema extension: step-count distribution fields (median/p95 steps per task) as first-class metrics alongside pass rate — long-horizon evals need effort accounting, not just binary success.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Star snapshots and last-push dates verified live via `api.github.com` on 2026-09-23 (copied from `_evidence/computer-use.md`).

- bytedance/UI-TARS-desktop | 39,099 stars | pushed 2026-09-11 — big tech ships open-source computer-use products, not just papers (native GUI-agent desktop app + Agent TARS stack with own grounding VLMs).
- trycua/cua | 26,076 stars | pushed 2026-09-23 — the category's infrastructure layer is a starred, actively built product: cross-OS VM-based computer-use infra for training, evaluation, and data generation.
- microsoft/OmniParser | 25,444 stars | pushed 2026-07-20 — the dominant building block: parse a screenshot into structured UI elements, "towards pure vision based GUI agent".
- simular-ai/Agent-S | 12,360 stars | pushed 2026-09-05 — open agent framework driving computers via screenshot + pyautogui, multi-generation (S1→S3) with sustained multi-year maintenance.
- bytedance/UI-TARS | 11,518 stars | pushed 2026-01-27 — the grounding model itself (paper arXiv:2501.12326): VLMs trained to locate UI elements from screenshots.
- xlang-ai/OSWorld | 3,155 stars | pushed 2026-09-14 — the de-facto desktop-agent benchmark: NeurIPS 2024, 369 tasks in a real Ubuntu/Windows desktop VM.
- inclusionAI/AWorld | 1,236 stars | pushed 2026-09-23 — adopters integrate OSWorld as a standard harness outside the benchmark's own repo (`examples/osworld/`).
- showlab/ShowUI | 1,905 stars | pushed 2026-04-24 — CVPR 2025 end-to-end vision-language-action GUI model from a research lab.
- xlang-ai/OSWorld-V2 | 329 stars | pushed 2026-09-16 — the trend direction: 108 long-horizon workflows with fine-grained partial rewards + safety reports.
- microsoft/WindowsAgentArena | 901 stars | pushed 2026-04-13 — the Windows-side counterpart benchmark (Azure/VM-based), the thinner half of the standard eval pair.
- (grounding oracle only) likaixin2000/ScreenSpot-Pro-GUI-Grounding | 397 stars | pushed 2026-06-17 — the grounding-accuracy benchmark harness (`eval_screenspot_pro.py`, fixed seed).

**Honest caveats carried over.** Research-heavy category: only trycua/cua and bytedance/UI-TARS-desktop are products; the rest are research artifacts, and adoption of any single agent stack is unproven beyond benchmarks. The benchmark IS the market signal — and benchmark percentages on READMEs are self-reported, so they deserve discounting. OSWorld has no visible GitHub CI; its quality control is harness design + community reproduction, not repo-level CI — copy trycua/cua for CI, not the benchmarks. WindowsAgentArena is thinner (5 months since push, no visible CI) and one tree pointer (`scripts/win-arena-container`) 404'd during verification — treat it as unverified. OS-Copilot (1,794 stars, last pushed 2024-09-09) is dead and excluded. Unverifiable repo guesses were corrected or dropped, not cited.

## Unknowns (UNK-*)

- UNK-01: Neither xlang-ai/OSWorld nor microsoft/WindowsAgentArena shows visible GitHub CI — is harness quality governed anywhere inspectable, or only via community reproduction? Unverifiable from the repos alone; affects how much the benchmark oracle can be trusted beyond its design.
  **Disposition: TARGETED.**
- UNK-02: Is OSWorld-V2's safety-report schema stable and independently reproducible, or a one-off instrument? Not verified in the evidence pass; blocks making safety reporting a MUST conformance check.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Safety-report schema stability parked: S3 pin + two-run reproducibility check gates the MUST/SHOULD classification of the safety-reporting conformance check. Promotion predicate: at S3 truth-pack assembly, pin the safety-report schema file at a commit and run report generation twice independently; iff byte-identical schema, promote safety reporting to MUST in the gate profile; else it remains SHOULD/advisory with the instability recorded as a caveat. Owner: plan author. S3 step: truth-pack assembly.
- UNK-03: Are ScreenSpot-Pro's grounding fixtures (screenshots) redistributable and pinnable in-tree, or do they require external fetch with its own integrity risk? Not verified.
  **Disposition: TARGETED.**
- UNK-04: WindowsAgentArena's maintenance future (last push 2026-04-13, 901 stars): does the Windows half of the eval pair stay viable for cross-OS parity claims, or is it quietly dying? Revisit trigger: any push or archived notice.
  **Disposition: WATCH.**
- UNK-05: `scripts/win-arena-container` 404'd inside the WindowsAgentArena tree despite the parent listing showing it — does a Windows container path exist at all in that repo? Single unverified pointer; treat as absent until seen.
  **Disposition: TARGETED.**
- UNK-06: The benchmark-pin practice (ouroboros `devtools/benchmarks/osworld/METHODOLOGY.md` pinning OSWorld-V2 commit `c261cb57…`) is a third-party observation not independently re-verified this pass; the pin's exactness is unverified.
  **Disposition: TARGETED.**
- UNK-07: Overlap between simular-ai/Agent-S's `evaluation_sets/test_small_new.json` and `test_all.json` is unquantified — a small eval set drawn from the full set is a cherry-picking risk surface; resolve by diffing the task IDs before trusting any "small set" number.
  **Disposition: TARGETED.**
