# Pickup companion: Guardrails

S2 author file for the guardrails pickup type. Evidence: `_evidence/guardrails.md` (all repos
verified live via GitHub API 2026-09-23). Slots instantiated from `_s0/localbench-pattern.md`
and `_s0/model-guides.md`. All REQ-*/GATE-*/CLAIM-*/UNK-* IDs are stable per INTENT.md.

## Charter seed

**What this type is.** Guardrails = the policy layer between an LLM/app and its users:
input rails (prompt screening: jailbreak heuristics, PII, topic/code bans), output rails
(refusal checks, hallucination grounding, sensitive-content scans), dialog/topical rails
(multi-turn guard logic, e.g. Colang), execution/tool-call rails (agent tool input/output
gating, e.g. LlamaFirewall), and the adversarial evaluation harnesses that test all of the
above (red-team frameworks, safety benchmarks). It covers both the guard mechanisms and the
attack suites used to evaluate them — the evidence shows mature repos treat these as
separate code paths inside the same project.

**In scope.** Rail frameworks and spec languages (Colang, `.rail`, Guard+Validator patterns);
scanner libraries with labeled example corpora; validator hubs; refusal/moderation classifiers
(PromptGuard/LlamaGuard lineage); agent tool-call gating rails; red-team attack taxonomies
and evasion strategies as enumerated modules; safety benchmarks with judge-validation sets
(HarmBench, CyberSecEval); recorded/mock-LLM fixtures for rail testing.

**Out of scope.** Model training and alignment itself (that is the fine-tuning /
rl-envs types); general LLM eval harnesses without a safety adversary
(that is the eval-harnesses type); sandboxing of arbitrary code execution
(that is the sandbox-exec type); prompt engineering guidance; compliance
policy writing. A guardrail project evaluates enforcement, it does not set the policy.

**A good starting point** for this type is: one pinned scanner/rail implementation, a
committed labeled corpus of pass (FP-risk) and fail (FN-risk) examples, a calibrated
refusal/judge scorer with its own validation set, and CI split so rail logic is tested
with mock LLMs while real-LLM QA runs in a separately-gated tier.

### Requirements

- REQ-01: Rails are organized into input/output/dialog/tool-call families; each family
  has its own test surface and acceptance criteria.
- REQ-02: Attack generation and success detection live in separate code paths
  (`attacks/` vs `verdicts/`); no shared helper code between them, enforced by CI.
- REQ-03: Every scanner/validator ships with a committed labeled example corpus
  covering both valid and blocked inputs; FP/FN cases are parametrized in test code,
  not in spreadsheets or docs.
- REQ-04: The LLM judge used for scoring refusal/safety has its own FP/FN
  calibration set, kept as a separate versioned artifact from the attack corpus;
  judge drift is measured, never assumed.
- REQ-05: Rail logic tests run against mock-LLM outputs and recorded (VCR-style)
  fixtures; unit-tier tests make zero network calls.
- REQ-06: Static attack corpora, seed-prompt datasets, and scorer-eval sets are
  versioned in-repo under distinct paths with hashes; corpus updates are explicit
  commits, never silent edits.
- REQ-07: Pre-committed acceptance thresholds for FP/FN rates live in
  `ACCEPTANCE_SURFACE.json` before any experiment runs; golden regeneration to
  reach green is a named forbidden pattern.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidate oracles are named in the evidence file. Integrity checks follow the
truth-pack shape: `docs/truth-pack/` holds `PIN_RECORD.md`, `MANIFEST.sha256`,
`ACCEPTANCE_SURFACE.json`, `NONDETERMINISM_FLOOR.md`, and
`fetch-truth-pack.sh --verify`; every oracle binary/model weight has its SHA-256
recorded at invocation time (no un-recorded executable is admissible; per
model-guides §2, a measurement without the incumbent binary's SHA-256 is
diagnostic only). For this type the truth pack gains a `JUDGE_CALIBRATION/`
subdirectory (calibration sets versioned separately from attack corpora, per
evidence practice 7–8) and a `mock_llm/` fixture tree (per practice 9–10).

- **Oracle A — `centerforaisafety/HarmBench`** (`data/behavior_datasets/`,
  `data/classifier_val_sets/`, `evaluate_completions.py`, `eval_utils.py`,
  `generate_test_cases.py`). Treat as the canonical *spec* of automated-red-team
  + robust-refusal benchmarking, not a maintained codebase (no pushes since
  2024-08-16; relevance carried by promptfoo's live `harmbench.ts` plugin).
  Integrity: pin the commit; SHA-256 every dataset file in `MANIFEST.sha256`;
  record the classifier weights' SHA-256 at scoring invocation; ship
  `NONDETERMINISM_FLOOR.md` for LLM-judge score variance.
- **Oracle B — `NVIDIA/garak` probes as the attack reference**
  (`garak/garak/probes/*.py`, `garak/garak/detectors/*.py`, tests under
  `garak/tests/probes/`, `garak/tests/detectors/`). Integrity: pin commit; use
  its probe/detector split as the project's own `attacks/` vs `verdicts/`
  reference; detectors double as independent second judges for cross-check.
- **Oracle C — `microsoft/PyRIT` datasets** (`pyrit/datasets/jailbreak/`,
  `pyrit/datasets/seed_datasets/`, `pyrit/datasets/scorer_evals/`,
  `pyrit/score/`). Integrity: hash-pin each dataset directory separately; keep
  `scorer_evals/` (judge calibration) as the `JUDGE_CALIBRATION/` truth-pack
  seed; never merge calibration and attack corpora.
- **Oracle D — `protectai/llm-guard` benchmark corpora**
  (`benchmarks/run.py`, `benchmarks/input_examples.json`,
  `benchmarks/output_examples.json`). Integrity: pin commit; corpora are the
  starting labeled example set for scanner FP/FN budgets; `benchmarks/run.py`
  (timeit-based) is the template for the localbench corpus tier timing harness.
- **Oracle E — `meta-llama/PurpleLlama` moderation evals**
  (`Llama-Guard3/`, `Prompt-Guard/`, `LlamaFirewall/`, `CybersecurityBenchmarks/`).
  Integrity: pin commit; classifier *weights* admitted only after compiled
  SHA-256 trust roots pass (whisper-pattern); record weight SHA-256 at every
  scoring invocation. UNK-GR-03 covers redistribution rights.

Unverifiable items (marked UNK-*): judge reproducibility without original
classifiers (UNK-GR-02), classifier weight redistribution (UNK-GR-03),
llm-guard corpus labeling provenance (UNK-GR-04).

## Initial claims (CLAIM-*)

Claims are about the TYPE's process norms, evidenced across repos.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-01 | Guardrail codebases separate attack generation from success detection into distinct code paths and test trees | `NVIDIA/garak`: `garak/garak/probes/*.py` vs `garak/garak/detectors/*.py`; `garak/tests/probes/` vs `garak/tests/detectors/` | T0 | High | ADMISSIBLE |
| CLAIM-02 | Rail-level QA tests run against real example configs and are gated behind an environment flag, separate from the unit tier | `NVIDIA-NeMo/Guardrails`: `qa/test_jailbreak_check.py`, `qa/test_topical_rail.py`, `qa/test_execution_rails.py`, each subclassing `ExampleConfigChatterTestCase` with `skipif(not QA_MODE)` | T0 | High | ADMISSIBLE |
| CLAIM-03 | Every scanner ships with a labeled example corpus and a timing harness over JSON corpora | `protectai/llm-guard`: `benchmarks/run.py` + `benchmarks/input_examples.json` + `benchmarks/output_examples.json` | T0 | High | ADMISSIBLE |
| CLAIM-04 | Pass/fail rail behavior is encoded as parametrized `(prompt, expected_results)` matrices in test code, covering valid and blocked prompts | `protectai/llm-guard`: `tests/input_scanners/`, `tests/output_scanners/`, `tests/test_evaluate.py` | T0 | High | ADMISSIBLE |
| CLAIM-05 | Attack families and evasion strategies are enumerated as named modules; a new jailbreak class is a new file with per-module metadata | `promptfoo/promptfoo`: `src/redteam/plugins/*.ts` (~50 plugins incl. `harmbench.ts`, `hallucination.ts`, `pii.ts`, `policy/`) + `src/redteam/strategies/*.ts` (crescendo, bestOfN, gcg, encodings) | T0 | High | ADMISSIBLE |
| CLAIM-06 | Static attack corpora, seed datasets, and scorer-eval (judge calibration) sets are versioned in-repo as separate artifacts | `microsoft/PyRIT`: `pyrit/datasets/jailbreak/`, `pyrit/datasets/seed_datasets/`, `pyrit/datasets/scorer_evals/`, `pyrit/score/` | T0 | High | ADMISSIBLE |
| CLAIM-07 | The LLM judge that scores refusal gets its own classifier validation set; judge FP/FN drift is measured, not assumed | `centerforaisafety/HarmBench`: `data/behavior_datasets/`, `data/classifier_val_sets/`, `evaluate_completions.py`, `eval_utils.py` | T0 | High | ADMISSIBLE |
| CLAIM-08 | Rail logic tests use mock-LLM-output fixtures and machine-readable rail-spec tests so they run without live models | `guardrails-ai/guardrails`: `tests/integration_tests/` with `mock_llm_outputs.py`, `mock_embeddings.py`, `mock_presidio.py`; `test_spec.rail`; `server_ci/` | T0 | High | ADMISSIBLE |
| CLAIM-09 | Integration tests replay recorded LLM fixtures (VCR-style); rail LLM calls never hit the network in unit tests | `NVIDIA-NeMo/Guardrails`: `tests/recorded/` + `llama_guard_fixtures.py`, `policyai_fixtures.py` | T0 | High | ADMISSIBLE |
| CLAIM-10 | CI is split by tier and concern into separate workflows: PR-fast, full, latest-deps, examples-check, dependency audit — not one matrix | `NVIDIA-NeMo/Guardrails`: `.github/workflows/{pr-tests.yml,full-tests.yml,_coverage.yml,latest-deps-tests.yml,test-docker.yml,lint.yml,codeql.yml}`; `guardrails-ai/guardrails`: `.github/workflows/{ci.yml,premerge.yml,examples_check.yml,dependency-audit.yml,cli-compatibility.yml,server_ci.yml}` | T0 | High | ADMISSIBLE |
| CLAIM-11 | Agent tool-call gating is a distinct rail family from prompt-text rails, with its own source tree and examples | `meta-llama/PurpleLlama`: `LlamaFirewall/` (src, tests, examples); NeMo `qa/test_execution_rails.py` | T0 | High | ADMISSIBLE |
| CLAIM-12 | Safety benchmarks are published as versioned behavior datasets plus judge-validation sets, independent of any single vendor's moderation stack | `centerforaisafety/HarmBench`: `data/behavior_datasets/`, `data/classifier_val_sets/` (stale repo; relevance carried by downstream adoption) | T0 | Medium | CONTESTED (repo unmaintained since 2024-08-16; "canonical spec" reading is inference, labeled) |

## Gate profile

G1–G14 applicability mapped against the canonical definitions
(PROJECT-PICKUP-PLAYBOOK.md; `_s0/g1-g14-reference.md`). UNK-GR-01 is resolved —
the S2 "inferred function" caveat is superseded.

| Canonical gate | Applicability for guardrails |
|---|---|
| G1 ORACLE | Load-bearing, as-is; oracle inventory adds `JUDGE_CALIBRATION/` and `mock_llm/` subtrees; classifier weights need compiled trust roots |
| G2 PAIR | Load-bearing, as-is; paired A/B/A = scanner/rail vs held-out attack corpus + calibrated judge in the same invocation |
| G3 OWN | As-is; new ownership/allocation sites in rail/scanner code classified in `ownership.tsv` |
| G4 CONTRACT | Load-bearing, as-is; CI-only conformance harness from `kit-contracts.yml` in a `.git`-less staged-tree copy |
| G5 HOST | As-is; machine state recorded with every judge-scoring run |
| G6 UNSAFE | Load-bearing for Rust components (`// SAFETY:` per site; inventory); N-A with reason for Python/TS-only trees |
| G7 REVIEW | Advisory; the type-specific analog is diff-only review on rail/detector logic changes (recorded as a review parameter, not a claim that canonical G7 applies as-is) |
| G8 RULEBOOK | Load-bearing, as-is; bulk porting declared in `kit-rulebook.yml` |
| G9 IOU | As-is; positive loop bound, no unresolved IOUs at the gate |
| G10 MIRI | As-is where Rust exists; otherwise `rust: false` with reason |
| G11 LAYOUT | As-is for Rust components; N-A with reason for Python/TS-only |
| G12 AUDIT | As-is; fix-class eradications in `kit-audits/*.audit`; exemptions in `exemptions.tsv` |
| G13 NOSTUB | Load-bearing, as-is; stub markers in added lines block |
| G14 REJECT | Load-bearing, as-is; every refusal/FP/FN claim wired to a corpus receipt in `registries/claims.tsv`; guardrail efficacy claims are T3 by default until corpus + judge receipts exist; the finalizer refuses to certify what the process cannot produce |

Type-parameterized extensions: A/A goldens — judge scores get their own A/A null (an A/A pair whose judge-F1 spread exceeds floor invalidates the tier); result-class doctrine reframed — "self-attack win" (beating your own attack corpus) is SELF-SPEEDUP class; CAMPAIGN WIN requires a held-out, independently-seeded attack set plus a calibrated independent judge in the same invocation; incumbent pins include judge model weight revisions and classifier trust roots, not just code versions; MUST checks include attack-detector separation and mock-LLM determinism (shared GATE-011 with type-specific parameters); anti-reward-hacking addendum names "attack-corpus cherry-picking" and "judge shopping"; corpus exports stamp `source_sha256` + judge weight rev + converter version (hash-chained provenance is the stated open gap).

**New type-specific gates.**

- GATE-GR-01 **Attack/detector separation — RETIRED into shared GATE-011** (S4
  round 1, dedup). GATE-011 acceptance (3) already requires separate attack
  and success-detection code paths with mirrored tests; the import-graph CI
  check and any-cross-import = FAIL are the type-specific enforcement.
- GATE-GR-02 **Judge calibration — RETIRED into shared GATE-011** (S4 round 1,
  dedup). GATE-011 acceptance (4) already requires the judge's own FP/FN
  calibration set with measured drift. Retained as a type-specific parameter:
  the calibration set is `data/classifier_val_sets/`-shaped, and a judge
  whose F1 drifts more than the pre-committed bound in
  `ACCEPTANCE_SURFACE.json` from the pinned baseline is inadmissible for
  scoring that run.
- GATE-GR-03 **Rail FP/FN budgets — RETIRED into shared GATE-011** (S4 round 1,
  dedup). GATE-011 acceptance (1)–(2) already require labeled corpora and
  parametrized pass/fail matrices. Retained as a type-specific parameter:
  every rail publishes measured FP/FN against committed corpora with
  pre-committed thresholds in `ACCEPTANCE_SURFACE.json`; a rail that regresses
  either rate past threshold fails the tier — no threshold edits to reach green.
- GATE-GR-04 **Mock-LLM determinism — RETIRED into shared GATE-011** (S4 round 1,
  dedup). GATE-011 acceptance (5) already requires rail logic tested against
  recorded fixtures, never live models in unit tests. Retained as a
  type-specific parameter: the unit test tier executes with network egress
  disabled; any real LLM API call in the unit tier = FAIL; real-LLM tests live
  only in the QA_MODE tier.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Advisory | FP/FN claims rest on pinned corpora + judge weight revisions (G1 adds JUDGE_CALIBRATION/; incumbents.md pins weight revs) |
| GATE-011 (Guardrail false-positive / false-negative) | Load-bearing | Applies to this slug; attack/detector separation, judge calibration, FP/FN budgets, mock-LLM determinism (GATE-GR-01..04 retired into 011) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; unit tier on mock-LLM + recorded fixtures, egress disabled (REQ-05) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; unit/corpus/redteam/qa/latest-deps tiers, qa behind QA_MODE |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; scanner release, judge weight rev, attack-reference commit (incumbents.md) |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; judge-F1 A/A floors bound variance |

## Evidence tiers

Mapped to the localbench evidence-tier conventions (model-guides §5 vocabulary) and the
program's `[Verified]` / `[Maintainer claim]` / `[External]` / `[Inference]` flavors.
Canonical pickup tiers (verbatim per PROJECT-PICKUP-PLAYBOOK.md):

- **T0 [Verified]** — Direct inspection of a fresh clone, API, live page, or a measurement
taken at a pinned oracle with invocation-time SHA-256 recorded
- **T1 [CI-observed]** — Executed and observed on CI / banked receipt; attests the suite *runs*,
not that it is green, and not that numbers are admissible
- **T2 [Maintainer claim] / [External]** — Asserted by repo docs or an independent source, not reproduced by us
- **T3 [Inference]** — Analyst judgment — always labeled as such, never silently upgraded

Type-application guidance (not redefinitions):

- Corpus pinning — a scanner/rail FP/FN number is T0 only if: the corpus is hash-pinned
  in `MANIFEST.sha256`, the judge is calibrated per shared GATE-011 (judge-calibration
  parameter), A/A goldens are banked with tol = max(3×A/A spread, floor), and machine
  state was recorded with the run. Recorded presence: attack-detector separation
  verified by import-graph CI, corpus version pins, enumerated attack plugins/modules
  with per-module receipts.
- Independent replication — a second harness (e.g. garak detectors scoring a
  PyRIT-seeded attack run, or promptfoo's vendored harmbench.ts reproducing a HarmBench
  behavior set) reproducing FP/FN numbers within golden tolerance is T2 [External]
  (or T0 only if reproduced by us).
- Judge calibration — cross-judge agreement (two calibrated judges on the same
  corpus) is T2 [External] unless reproduced by us. Mock-LLM tiering — a run that
  only attests execution is T1 [CI-observed], not T2; [CI-observed] attests the suite
  runs, not that it is green and not that numbers are admissible.
- Vendor numbers — repo README or paper numbers (e.g. "used in 100+ red-team
  operations" for PyRIT, self-reported by Microsoft) without committed receipts are T2;
  admissible as context, never as a gate input.
- Guardrail efficacy — any claim of the form "blocks all jailbreaks / is safe"
  without a bounded validity domain, a named judge, and a calibration receipt is T3 by
  default until it carries corpus + judge receipts; the release finalizer refuses to
  certify them (per G-review-finalizer).

`[Inference]` (label it): star counts are trend signal, not quality; a stale-but-adopted
benchmark (HarmBench) is "canonical spec" only by downstream-adoption inference.

## Localbench bench shape

1. **Spec format** — `<scanner|rail>@<commit-sha>+judge:<model>@<weight-rev>`, e.g.
   `llm-guard@9f3c…+judge:llama-guard-3@sha256:ab12…`. The spec names exactly what is
   measured: the rail/scanner code pin, the judge classifier weight revision, and the
   harness commit. Oracle binaries/weights get invocation-time SHA-256 recording.
2. **Named tiers** — `unit` (parametrized pass/fail matrices, mock-LLM only),
   `corpus` (labeled example corpora + timing harness, `benchmarks/run.py`-shaped),
   `redteam` (held-out attack sets: garak probes / PyRIT seed datasets),
   `qa` (real-LLM rail QA tier, `QA_MODE=1`, full conversation traces),
   `latest-deps` (dependency drift). Goldens bind PER TIER; a judge weight update
   invalidates only `redteam` and `qa` (re-bank those tiers only); a corpus update
   invalidates `corpus` and `redteam`.
3. **Golden schema** — JSON per spec: `conformance` (MUST: shared GATE-011 separation + mock determinism, corpus hash match; SHOULD: per-rail FP/FN within
   budget, judge F1 within calibration bound) + `metrics` (each with `value`,
   `spread` from A/A, `tol = max(3 × A/A relative spread, floor)`, `tol_source`
   → banked receipt path, `better` direction). Judge scores get their own A/A null:
   an A/A pair whose judge-F1 relative spread exceeds floor invalidates the tier.
4. **Banking ceremony** — `aa <spec> --write-golden` only; golden-regeneration-until-green
   is a named forbidden pattern. Attack-corpus cherry-picking (dropping hard attacks to
   improve FN) and judge shopping (re-scoring with a friendlier judge) are named forbidden
   patterns in this type's AGENTS.md addendum.
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across hosts.
   New generation = judge weight rev change, harness change, or corpus re-pin.
   Status: CURRENT / GENERATION-MISMATCH / UNAVAILABLE.
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%, names the
   processes); runs marked CONTENDED if any non-backend process exceeds 25% GPU in a
   second; one unit under test at a time; loopback/local-only endpoints for unit and
   corpus tiers; the `qa` tier may call real LLM APIs but every call is receipted with
   model identity + weight rev; park/unpark interfering residents during windows.
7. **A/B discipline** — same-invocation A, B, A ordering, banked under a name; for
   rail comparisons, A/B/A is scanner-vs-scanner on the SAME corpus + SAME judge in
   one invocation (prevents judge drift from masquerading as a scanner win).
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run, judge — `judge` receipts carry the judge weight SHA-256
   and calibration-set hash) + dated `.md` investigation notes; `runs/` is gitignored
   scratch with `<ts>__<kind>__<spec>` dirs.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact versions + hashes of the
   reference scanner (e.g. llm-guard release), reference judge (LlamaGuard weight rev),
   attack reference (garak/PyRIT commit), model weights, server, harness, OS.
10. **Claims registry** — `registries/claims.tsv`: every public FP/FN/refusal claim is
    registered and machine-checked against its corpus + judge receipt on every commit.
11. **Negative-evidence ledger** — `docs/evidence/NEGATIVE_EVIDENCE.md`,
    `DISCREPANCIES.md`, `break-tests.md`, `demotion-rules.md`; bypassed attacks and
    retired rails stay in-tree with resurrection predicates; demotions always allowed.
12. **Anti-reward-hacking law** — the 12 forbidden patterns verbatim, plus the
    type-specific addendum (attack-corpus cherry-picking, judge shopping,
    threshold edits to reach green).

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

- `docs/truth-pack/JUDGE_CALIBRATION/` — template dir for the judge's FP/FN
  calibration set, pinned and hashed separately from `ATTACK_CORPUS/`; seed with
  the HarmBench `classifier_val_sets` shape.
- `docs/truth-pack/mock_llm/` — `mock_llm_outputs.py` fixture template plus a
  rail-spec conformance test template (`test_spec.rail`-shaped) so rail logic tests
  run with zero network calls.
- `scripts/benchmarks/run.py`-shaped timing harness template — timeit-based scanner
  benchmark over committed JSON corpora (`input_examples.json` /
  `output_examples.json` shape), with per-scanner latency + accuracy columns.
- New gates: none local — GATE-GR-01…GATE-GR-04 retired into shared GATE-011 (see Gate profile), including the import-graph
  CI check for attack/detector separation and the network-egress-disabled unit tier.
- AGENTS.md addendum: named forbidden patterns for this type — attack-corpus
  cherry-picking, judge shopping, threshold edits to reach green — alongside the
  existing 12.
- `qa/` test-scaffold template: one test file per rail family subclassing a
  QA_MODE-gated base (the `ExampleConfigChatterTestCase` pattern), with full
  conversation-trace fixtures.
- `registries/claims.tsv` schema note: claim rows for this type must reference both
  a corpus receipt AND a judge-calibration receipt (dual-receipt rule).
- Corpus export tooling (TARGETED, not yet buildable — see UNK-GR-07):
  stamps `source_sha256` + judge weight rev + converter version into exported
  artifacts (origin binding, moving toward hash-chained). No tool name,
  input/output contract, or acceptance test is specified yet; it stays a
  TARGETED follow-on, not a starter-kit delta, until the contract is written.

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Verified 2026-09-23 via GitHub API (stars + pushed_at read live). Stars are trend
signal, not quality scores. One-line process takeaway each.

- `NVIDIA-NeMo/Guardrails` | 7,185 stars | pushed 2026-09-21 | Vendor reference rail toolkit (Colang): rail QA gated behind `QA_MODE` with real example configs; recorded VCR fixtures; CI split by tier and concern.
- `guardrails-ai/guardrails` | 7,443 stars | pushed 2026-09-22 | Guard+Validator architecture with a validators Hub; mock-LLM fixtures decouple rail logic from live models; machine-readable `.rail` spec tests.
- `protectai/llm-guard` | 3,207 stars | pushed 2026-07-08 | Scanner library where every scanner ships with a labeled example corpus and a timeit timing harness; FP/FN cases parametrized in test code.
- `meta-llama/PurpleLlama` | 4,403 stars | pushed 2026-08-18 | Corporate umbrella proving moderation evals, prompt-guard classifiers, and agent tool-call gating (LlamaFirewall) coexist as distinct in-repo families.
- `microsoft/PyRIT` | 4,533 stars | pushed 2026-09-23 | Red-team framework showing attack corpora, seed datasets, and scorer-eval (judge calibration) sets as separate versioned artifacts.
- `NVIDIA/garak` | 9,339 stars | pushed 2026-09-16 | The probe/detector split made canonical: attack generation and success judging are separate code paths with mirrored test trees.
- `promptfoo/promptfoo` | 25,400 stars | pushed 2026-09-23 | Red-teaming as a first-class eval surface: ~50 enumerated attack plugins and evasion strategies as named modules with per-module metadata.
- `centerforaisafety/HarmBench` | 1,053 stars | pushed 2024-08-16 | The standardized jailbreak benchmark spec: behavior datasets + classifier validation sets + LLM-as-judge scoring — judge calibration as a first-class artifact.

**Honest caveats (carried over from the evidence file).**

- `centerforaisafety/HarmBench` has no pushes since 2024-08-16: treat as canonical
  *spec*, not maintained codebase; its relevance is evidenced by promptfoo's live
  `harmbench.ts` plugin, not its own activity.
- `whylabs/langkit` (997 stars, last push 2024-11-22) was verified but dropped:
  ~10 months without commits — a clean-room should not model a stalled project.
- `rebuff-ai/rebuff` returns "Not Found" via API: do not cite it. (An awesome-list
  claims LLM-Guard "replaced rebuff" — unverified secondary claim, not used.)
- `alexandrasouly/strongreject` (160 stars) verified but too thin to carry a trend line.
- Evidence is repo-metadata + tree structure only: tests were not executed and CI
  pass/fail state was not verified. File pointers are to files confirmed present via
  the GitHub contents API; contents were only spot-read (heads), not audited.

## Unknowns (UNK-*)

- UNK-GR-01: [RESOLVED 2026-09-23, S4 round 1] The G1–G14 applicability table above
  was inferred; the canonical definitions are now in PROJECT-PICKUP-PLAYBOOK.md
  (from `_s0/g1-g14-reference.md`) and the table is reconciled to them.
  **Disposition: RESOLVED.**
- UNK-GR-02: HarmBench scoring reproducibility — can its published judge numbers be
  reproduced without the original classifier weights? Unverified; affects whether
  HarmBench is a runnable oracle or spec-only.
  **Disposition: TARGETED.**
- UNK-GR-03: Redistribution rights for vendor classifier weights (LlamaGuard /
  PromptGuard lineage) inside a clean-room truth pack. Affects Oracle E and the
  compiled-trust-root admission path.
  **Disposition: TARGETED.**
- UNK-GR-04: `protectai/llm-guard` benchmark corpus labeling methodology and provenance
  were not audited (evidence is tree-structure only). Corpus bias is unknown.
  **Disposition: TARGETED.**
- UNK-GR-05: What pre-committed FP/FN acceptance thresholds are defensible
  (`ACCEPTANCE_SURFACE.json` values) — no evidence repo publishes a norm; the
  starting point must set project-local values, not inherit any.
  **Disposition: TARGETED.**
- UNK-GR-06: Real-LLM QA tier coverage norm — how many rails must have QA_MODE tests
  before the tier gates a release; no repo publishes a coverage bar.
  **Disposition: TARGETED.**
- UNK-GR-07: Corpus export tooling — stamps `source_sha256` + judge weight rev +
  converter version into exported artifacts (origin binding, moving toward
  hash-chained). No tool name, input/output contract, or acceptance test is
  specified yet; it stays a TARGETED follow-on, not a starter-kit delta, until
  the contract is written.
  **Disposition: TARGETED.**
