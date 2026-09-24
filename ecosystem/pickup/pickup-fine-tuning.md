# Pickup companion: Fine-tuning infrastructure

S2 artifact. Fine-tuning infrastructure = libraries and launchers that take a
pretrained LLM/VLM and train it further on user data: SFT/LoRA/QLoRA/full
finetune launchers, distributed post-training (DeepSpeed/FSDP/Ray), and
preference/RL post-training (DPO, PPO, GRPO, reward trainers), plus their
custom training kernels. This type is NOT an inference server, NOT a model
weights provider, and NOT a general ML training framework (PyTorch, JAX).

## Charter seed

**In scope.** A clean-room (or assessment) starter for a fine-tuning stack:
config-driven launchers, trainer loops, adapter implementations (LoRA/QLoRA/
adapters/full), distributed strategies (DeepSpeed/FSDP), and preference/RL
trainers (DPO/GRPO/PPO). The starter's job is to make "it trains correctly"
checkable: smoke trains, golden losses, and config contracts — not model
quality judgments.

**Out of scope.** Pretraining at scale; model-weight distribution; inference
serving benchmarks; dataset curation; safety alignment verdicts about the
fine-tuned outputs themselves.

**A good starting point for this type** means: on day one, a contributor can
run the CPU unit suite on a PR, run a ≤5-step smoke train on a pinned tiny
checkpoint, and see exact expected-loss goldens asserted in-tree — before any
GPU is ever rented. GPU e2e exists but is gated behind labels/schedules, never
blocking the default PR path.

### Requirements

- REQ-01 — Tiered CI pyramid: CPU unit suite runs on every PR; GPU e2e runs
  only on labeled PRs, main, merge queue, or a nightly schedule. Fast/slow
  split via pytest markers (`-m "not slow"`) or opt-in flags.
- REQ-02 — Every trainer/adapter code path ships a tiny-model smoke train:
  pinned checkpoint ≤135M-class (or synthetic micro-config), single-digit
  `max_steps`, runnable with GPUs hidden (`CUDA_VISIBLE_DEVICES=` /
  CPU torch index). Asserts checkpoint materializes and loss is finite.
- REQ-03 — Numerics discipline: pinned seed, dtype, and exact expected-loss
  values committed in-tree per recipe; loss deviations fail the suite (fp32
  exact-match at the pinned dtype, no "close enough" drift).
- REQ-04 — Config validation is a callable API (`validate_config` /
  `normalize_config` equivalent), exercised at the top of every e2e train
  test, with its own config-only test surface.
- REQ-05 — Truth-pack pinning: `docs/truth-pack/` holds PIN_RECORD.md (pinned
  reference-trainer commit + weight-revision hashes + eval harness pin),
  MANIFEST.sha256, NONDETERMINISM_FLOOR.md, and `fetch-truth-pack.sh --verify`.
- REQ-06 — Eval-after-train smoke: every smoke train is followed by a
  generate-or-evaluate round-trip whose receipt is banked next to the run.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

- **Reference trainer: huggingface/trl** (SFTTrainer, DPOTrainer, GRPO/reward
  trainers). Rationale: evidence shows it is the category reference that peers
  test against (unslothai/unsloth `.github/workflows/kaggle-t4-notebook-ci.yml`
  runs a canary SFT leg on TRL + transformers PyPI latest).
- **Eval harness: EleutherAI lm-eval** — pinned version (precedent:
  `lm-eval==0.4.8` pinned in meta-pytorch/torchtune `.github/workflows/gpu_test.yaml`,
  exercised by `tests/recipes/test_eleuther_eval.py`).
- **Fixture checkpoints:** HuggingFaceTB/SmolLM2-135M, `llama3_hf_138m`,
  `trl-internal-testing/tiny-*` fixtures, or synthetic micro-configs
  (precedent: Lightning-AI/litgpt `tests/test_lora.py` with `n_layer=2`,
  `n_head=4` — no download at all).
- **Golden losses** as differential oracle for numerics (precedent:
  meta-pytorch/torchtune `tests/recipes/test_full_finetune_single_device.py::_fetch_expected_loss_values`).

**Integrity checks** (truth-pack shape, per model-guides §1–2):

1. `docs/truth-pack/PIN_RECORD.md` — pinned upstream commit of the oracle
   trainer (TRL source commit, dated), tiny-checkpoint revision hashes,
   eval-harness pin, with the honest delta note where pins disagree in time
   (tts pattern).
2. `docs/truth-pack/MANIFEST.sha256` — every fixture and pinned file hashed.
3. `docs/truth-pack/ACCEPTANCE_SURFACE.json` — break-even/pre-committed
   thresholds for the measured paths (e.g. RL legs: target loss-delta bands,
   checkpoint-size bounds).
4. `docs/truth-pack/NONDETERMINISM_FLOOR.md` — committed nondeterminism floor
   for each path (smoke loss: exact at fp32/pinned seed; sampled/RL paths:
   UNK-06).
5. `fetch-truth-pack.sh --verify` — downloads and hash-verifies the oracle
   stack; refuses to proceed on hash mismatch.
6. Invocation-time oracle SHA-256: the trainer environment's identity (module
   file hash + pinned dependency list) is recorded in every bench receipt at
   invocation time, per whisper's CAMPAIGN-WIN rule — no un-recorded
   executable is an admissible oracle (model-guides §2).

**Unverifiable here:** whether free-Kaggle-T4 CI legs are available to a new
project (UNK-05); whether exact-loss goldens survive FSDP/DeepSpeed paths
(UNK-02); conformance oracles for DPO/GRPO correctness beyond smoke (UNK-03).

## Initial claims (CLAIM-*)

Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.
Status: ADMISSIBLE / CONTESTED / WITHDRAWN.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-01 | The category norm is a tiered test pyramid: CPU unit tests on every PR, GPU e2e gated behind labels or scheduled (never default-on-PR). | axolotl-ai-cloud/axolotl `.github/workflows/tests.yml` + `.github/workflows/docker-e2e.yml` (`gate-skip-e2e` job, `run-gpu-tests` label); huggingface/trl `.github/workflows/tests.yml` + `slow-tests.yml`; meta-pytorch/torchtune `.github/workflows/unit_test.yaml` + `.github/workflows/gpu_test.yaml` | T0 | High | ADMISSIBLE |
| CLAIM-02 | Fast/slow splitting via pytest markers or opt-in flags is the standard mechanism (`-m "not slow"`, `--with-integration`). | huggingface/trl `Makefile` (`-m "not slow and not low_priority"`); meta-pytorch/torchtune `tests/conftest.py` (`integration_test`, `slow_integration_test` markers); axolotl-ai-cloud/axolotl `.github/CONTRIBUTING.md` | T0 | High | ADMISSIBLE |
| CLAIM-03 | Tiny-model smoke trains (single-digit steps) are the standard unit of training correctness. | axolotl-ai-cloud/axolotl `tests/e2e/test_lora_llama.py` (HuggingFaceTB/SmolLM2-135M, `max_steps: 5`); meta-pytorch/torchtune `tests/recipes/test_full_finetune_single_device.py` (`llama3_hf_138m`, `max_steps_per_epoch=2`); Lightning-AI/litgpt `tests/test_lora.py` (synthetic micro-configs) | T0 | High | ADMISSIBLE |
| CLAIM-04 | Exact-loss golden regression with fixed seeds/dtype is the category's numerics discipline. | meta-pytorch/torchtune `tests/recipes/test_full_finetune_single_device.py::_fetch_expected_loss_values` (`loss_values_map` for `llama3_hf_138m`, `seed=9`, fp32). NOTE: evidence from a sunset repo — pattern verified in code, category-wide adoption unmeasured. | T0 | High | ADMISSIBLE |
| CLAIM-05 | Config validation is a testable API surface, exercised at the top of every smoke/e2e train test. | axolotl-ai-cloud/axolotl `tests/e2e/test_lora_llama.py` (`validate_config` + `normalize_config`); meta-pytorch/torchtune `tests/recipes/test_configs.py`; Lightning-AI/litgpt `tests/test_config.py`, `tests/test_args.py` | T0 | High | ADMISSIBLE |
| CLAIM-06 | GPU CI is made tractable via model-cache priming and CPU-run distributed tests. | axolotl-ai-cloud/axolotl `tests.yml` `prime-cdn-s3-cache` job (`hf-cache.tar.zst`), `nf4-cpu.yml` (`DS_ACCELERATOR: "cpu"`); hiyouga/LlamaFactory `tests.yml` (cpu torch index, `HF_HOME` cache) | T0 | High | ADMISSIBLE |
| CLAIM-07 | Free external GPU legs (Kaggle T4) with pinned-vs-latest canary legs are a proven cost-avoidance tactic. | unslothai/unsloth `.github/workflows/kaggle-t4-notebook-ci.yml` (canary SFT on pinned Qwen2.5-0.5B vs latest). NOTE: the "Kaggle gives us that card free" rationale is the file's own header claim — verified in the file, self-reported as motive. | T0 | High | ADMISSIBLE |
| CLAIM-08 | Eval-after-train / generate-after-train smoke coverage, with a checkpoint-materialization assertion, is the category norm. | axolotl-ai-cloud/axolotl `tests/e2e/test_evaluate.py`, `check_model_output_exists`; meta-pytorch/torchtune `tests/recipes/test_eleuther_eval.py`; hiyouga/LlamaFactory `tests/eval/` | T0 | High | ADMISSIBLE |
| CLAIM-09 | Transient infra noise (hub/GPU) is absorbed by narrow auto-retry filters, not broad flakiness tolerance. | huggingface/trl `Makefile` (`--reruns 5 --only-rerun '<OSError | T0 | Medium | HTTP 502/504 | out of memory>'`) | T1 | ADMISSIBLE |
| CLAIM-10 | HuggingFace TRL is the reference implementation the category's peers test against. | unslothai/unsloth `.github/workflows/kaggle-t4-notebook-ci.yml` canary SFT leg on TRL + transformers PyPI latest | T0 | High | ADMISSIBLE |
| CLAIM-11 | GPU e2e is deliberately NOT on the default PR path: labels (`run-gpu-tests`), main/merge-queue, or nightlies carry the heavy legs. | axolotl-ai-cloud/axolotl `.github/workflows/docker-e2e.yml` (`gate-skip-e2e`); meta-pytorch/torchtune `.github/workflows/gpu_test.yaml` (nightly torch excluded on PRs) | T0 | High | ADMISSIBLE |
| CLAIM-12 | Nightly GPU regression runs sit apart from PR CI. | thin: workflow inventory verified (axolotl-ai-cloud/axolotl `tests-nightly.yml`; meta-pytorch/torchtune `.github/workflows/regression_test.yaml` — cron midnight GPU, stable+nightly torch); run-order and cadence detail not read | T0 | High | ADMISSIBLE |
| CLAIM-13 | The category sustains multiple independent full-stack fine-tuning launchers at 10k+ stars. | unslothai/unsloth 76,631; hiyouga/LlamaFactory 74,993; huggingface/trl 19,369; Lightning-AI/litgpt 13,680; axolotl-ai-cloud/axolotl 12,494; OpenRLHF/OpenRLHF 10,040 (star snapshot 2026-09-23) | T0 | High | ADMISSIBLE |
| CLAIM-14 | Torchtune is an active reference the category should copy trajectory from. | meta-pytorch/torchtune README sunset banner ("Torchtune is no longer actively maintained — development wound down in 2025"). WITHDRAWN: process evidence remains excellent but the project is not an active reference. | T3 | — | WITHDRAWN |

## Gate profile

**G1–G14 applicability** (per `_s0/ecosystem-digest.md` gate definitions):

- G1 ORACLE — applies as-is; oracle inventory = pinned TRL commit, lm-eval
  pin, tiny-checkpoint revision hashes, golden-loss set.
- G2 PAIR — applies with type-specific parameter: paired validation = smoke
  train against the reference trainer (canary-vs-control, pinned-vs-latest,
  per unsloth's canary leg).
- G3 OWN — applies as-is (every CLAIM row names an owning bead).
- G4 CONTRACT — applies as-is (claim artifacts conform to the ATLAS R7 row
  schema: class, domain, oracle, mutant/negative control, artifact,
  do-not-claim boundary, owner, gate).
- G5 HOST — applies strongly: GPU host parity (runner class, CUDA/driver,
  torch build) is the dominant confound; CPU-distributed coverage
  (`DS_ACCELERATOR=cpu`) counts only for logic, never for numerics.
- G6 UNSAFE — conditional: applies to custom kernel extensions (CUDA/Triton
  kernels, e.g. unsloth's custom kernels); pure-Python paths N-A.
- G7 REVIEW — advisory; the type-specific analog is split-context adversarial review on smoke/loss harnesses (default-refute), recorded as a review parameter, not a claim that canonical G7 applies as-is.
- G8 RULEBOOK — applies as-is (Rulebook claim-discipline on all CLAIM rows).
- G9 IOU — applies as-is (zero unresolved IOUs at close; e.g. UNK-06 must be
  resolved or converted to a bounded do-not-claim).
- G10 MIRI — N-A for pure-Python stacks; conditional on Rust/native extension
  modules.
- G11 LAYOUT — N-A for pure-Python stacks; conditional on native extensions.
- G12 AUDIT — applies as-is (class-fix + instance re-audit on any fabrication
  or golden-drift incident).
- G13 NOSTUB — applies as-is (no placeholder trainer loops; smoke trains must
  actually execute).
- G14 REJECT — applies as-is; tier-mapping is load-bearing here (e.g. a
  CLAIM-04-style exact-loss claim may not ride on T2 evidence).

**New type-specific gates:**

- GATE-FT-01 SMOKE-TRAIN — RETIRED into shared GATE-012 (S4 round 1,
  dedup). GATE-012 acceptance (1) already requires tiny-model smoke trains
  on CPU in PR CI. Retained as a type-specific parameter: ≤135M-class or
  synthetic micro-config, single-digit `max_steps`, ≤15 min on a CPU-only
  runner (GPUs hidden), checkpoint materializes, loss finite, pinned
  checkpoint SHA verified before training.
- GATE-FT-02 LOSS-GOLDEN — RETIRED into shared GATE-012 (S4 round 1,
  dedup). GATE-012 acceptance (2) already requires exact loss goldens
  against fixed seeds and dtypes. Retained as a type-specific parameter:
  per-step loss equals committed values exactly at fp32; any deviation =
  FAIL, and re-banking requires a two-party waiver (not the implementing
  agent alone).
- GATE-FT-03 CONFIG-API — `validate_config`/`normalize_config` equivalent is
  called and asserted at the top of every e2e train test. Acceptance: 100% of
  e2e train tests exercise config validation first; a dedicated config-test
  surface exists per recipe.
- GATE-FT-04 EVAL-AFTER-TRAIN — RETIRED into shared GATE-012 (S4 round 1,
  dedup). GATE-012 acceptance (4) already makes eval-after-train mandatory.
  Retained as a type-specific parameter: every smoke train is followed by a
  generate-or-evaluate round-trip; the eval metric (or generation sanity
  output) is banked to the run receipt.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (model truth-pack / oracle integrity) | Load-bearing | Claims rest on pinned checkpoints/datasets; truth-pack required |
| GATE-007 (sandbox escape + resource accounting) | Advisory | GPU/runner-hour cost accounting per run (Bench slot 13) applies; escape suites do not |
| GATE-012 (training reproducibility / eval-after-train) | Load-bearing | Applies to this slug; smoke trains, loss goldens, eval-after-train are the type's core (GATE-FT-01/02/04 retired into it) |
| GATE-014 (deterministic test doubles / offline CI) | Universal | Applies to all types |
| GATE-015 (tiered CI separation) | Universal | Applies to all types |
| GATE-016 (dependency / toolchain pinning) | Load-bearing | torch/CUDA/checkpoint pins must be attributable (host/generation binding) |
| GATE-018 (flake quarantine) | Advisory | Deterministic smoke trains; quarantine with label, not blocking by default |
| GATE-FT-03 (config-API) | Load-bearing | Config validation gates every e2e train test |

## Evidence tiers

Mapped to the localbench/Rulebook tier vocabulary (model-guides §5):

| Tier | What counts as admissible evidence for fine-tuning |
|---|---|
| [Verified] | Direct inspection of a fresh clone: smoke-train test file read, golden-loss map read, workflow file read, star count via GitHub API. Each CLAIM-01..11 above rides on this. |
| [CI-observed] | The suite was observed executing on live CI (attests it *runs*, not that it is green) — e.g. GPU e2e workflow files existing in-tree. Tier 2, never a flavor of [Verified]. |
| [Maintainer claim] | README/docs claims unreproduced: LlamaFactory's "100+ LLMs & VLMs (ACL 2024)". |
| [External] | Independent sources; absence of coverage is a finding (e.g. OpenRLHF's CI is publish-on-release only — CLAIM-13 trend-only). |
| [Inference] | Analyst judgment, always labeled as such (e.g. which gates are "load-bearing" for this type; UNK-02/UNK-06). |

Cross-mapping to the CLAIM table (canonical, verbatim per the claim-registry
header): T0 [Verified] = direct inspection of a fresh clone, API, live page,
or a measurement at a pinned oracle with invocation-time SHA-256 recorded;
T1 [CI-observed] = executed and observed on CI / banked receipt; T2
[Maintainer claim]/[External] = asserted by repo docs or an independent
source, not reproduced by us; T3 [Inference] = analyst judgment, labeled
TARGETED (per nlp's aspirational policy, model-guides §4).

## Localbench bench shape

- **Spec format** — `launcher:adapter:checkpoint` naming exactly what is
  measured, e.g. `ft:lora:smollm2-135m`, `ft:qlora:qwen2.5-0.5b`,
  `ft:full:llama3-138m`. The harness starts/stops the trainer itself; spec
  pins the launcher commit, torch/transformers/trl versions, checkpoint
  revision hash, and runner class (cpu / cuda-<gpu>).
- **Named tiers** — `unit` (CPU pytest), `config` (validate/normalize API),
  `smoke-train-cpu` (tiny checkpoint, ≤5 steps, GPUs hidden),
  `smoke-train-gpu` (same on GPU runner), `loss-golden` (exact-loss regression,
  fp32/pinned seed), `eval-after-train` (generate/evaluate round-trip),
  `nightly` (GPU full regression). Goldens bind PER TIER; a launcher update
  invalidates only the tiers it touches.
- **Golden layout** — JSON per spec: `conformance` (named checks with
  `level: MUST|SHOULD`, `verdict: PASS|FAIL`; MUSTs: smoke completes,
  checkpoint materializes, loss finite, config validates) + `metrics` (per-step
  losses with `value`, `spread` from A/A, `tol`, `tol_source` → banked receipt,
  `better` direction).
- **Tolerance rule** — `tol = max(3 × A/A relative spread, floor)`. For
  `loss-golden`: floor = exact match at pinned dtype (fp32 exactness, per
  torchtune precedent — the committed golden values are the tolerance). For
  sampled/RL legs (GRPO/PPO): floor = UNK-06; no tolerance may be banked until
  the nondeterminism floor is committed.
- **A/B/A ordering** — same-invocation A, B, A for launcher comparisons
  (e.g. vs the TRL reference leg); banked under a name.
- **Machine-state / contention receipts** — preflight refuses a busy machine
  (GPU/CPU > 25%, names the processes); runs marked CONTENDED on any
  non-backend process exceeding 25% GPU in a second; one unit under test at a
  time; loopback/local-only for any hub access during measurement (a failed
  local call is a finding, never a cloud fallback).
- **Only banking ceremony** — goldens written ONLY by an A/A pair run
  (`aa <spec> --write-golden`: two runs → banked receipt + golden, refuses
  unsound A/A pairs), followed by `git diff goldens/` review in the same
  commit. Golden-regeneration-until-green is a named forbidden pattern.
- **Host/generation binding** — `goldens/<host_id>/`; never compared across
  hosts or across generations (torch/CUDA/checkpoint-revision update = new
  generation). CPU smoke goldens and GPU smoke goldens are separate
  generations, not comparable.
- **Incumbent pins** — exact versions + hashes of torch, transformers, trl,
  lm-eval, DeepSpeed/FSDP (when used), tiny-checkpoint revisions, OS, runner
  class.
- **Anti-reward-hacking law (slot 12)** — the 12 forbidden patterns verbatim
  in AGENTS.md; for this type the highest-risk patterns are the
  golden-regeneration reflex (re-bank until green) and proof-class inflation
  (presenting a smoke train as a full-eval claim) — both named explicitly as
  named forbidden patterns in the starter-kit deltas (item 8).
- **CI provisioning + cost ownership (slot 13)** — runner class/host,
  provisioning owner, funding owner/account, schedule, and spend cap
  *before BEADS READY*; `TBD` in any field blocks S5. The receipt schema
  carries a cost block: estimated vs actual GPU hours, lab cost, budget,
  funding owner, budget-exceeded disposition (what stops, who decides). GPU
  spend is material for this type; UNK-04 admits the nightly tier's cost
  profile is estimated, not measured.
- **Receipts / claims wiring** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
  (kinds: aa, ab, run, eval, cost) + dated investigation notes; `registries/claims.tsv`
  wired so every public claim sentence is machine-checked against its receipt
  on every commit; negative-evidence ledger seeded (NE-001 reserved:
  "golden regenerated without waiver").

## Starter-kit deltas

Concrete additions the franken starter kit needs for this type:

1. **Truth-pack template** (`docs/truth-pack/`): PIN_RECORD.md, MANIFEST.sha256,
   ACCEPTANCE_SURFACE.json, NONDETERMINISM_FLOOR.md, `fetch-truth-pack.sh --verify`
   — pre-filled for fine-tuning (reference-trainer pin, tiny-checkpoint hashes,
   lm-eval pin).
2. **Smoke-train harness shape**: a reference `tests/e2e/test_<adapter>_<family>.py`
   template (validate → load → train ≤5 steps → assert checkpoint exists →
   generate/evaluate), parameterized per adapter/model family (axolotl
   pattern).
3. **Golden-loss registry**: committed `loss_values_map`-style fixture with a
   two-party-waiver re-banking procedure (shared GATE-012 loss-golden parameter).
4. **Gates**: GATE-FT-03 registered as a type-specific gate; GATE-FT-01/02/04 retired into shared GATE-012, with acceptance
   criteria as written above.
5. **Config-API test scaffold**: `validate_config`/`normalize_config` template
   plus per-recipe config tests (GATE-FT-03).
6. **CI matrix template**: CPU unit job (every PR), labeled GPU e2e job
   (`run-gpu-tests` label analog), nightly GPU regression cron — with
   `prime-cdn-s3-cache`-style model-cache priming and narrow
   `--only-rerun` transient-retry filters.
7. **claims.tsv wiring** for loss-golden claims: every published loss number
   machine-checked against its banked receipt on every commit.
8. **Negative-evidence seed**: reserved NE-001 ("golden regenerated without
   waiver") and the 12-pattern anti-reward-hacking law carried verbatim into
   AGENTS.md (golden-regeneration reflex and proof-class inflation are the
   two highest-risk patterns for this type).
9. **CI provisioning + cost ownership**: runner class/host, provisioning
   owner, funding owner/account, schedule, and spend cap for the tiers above
   (item 6's CPU unit / labeled GPU e2e / nightly cron name tiers but no
   owners) — TBD acceptable pre-S5 (any TBD blocks S5 per Bench slot 13);
   current: TBD (owner: parent orchestrator assigns at S3).

## Trend + process citations

Verified 2026-09-23 via GitHub API; star counts are a snapshot (fine-tuning
repos re-rank frequently — Unsloth and LlamaFactory are neck-and-neck at ~75k+).

- **unslothai/unsloth** — 76,631 stars — fastest-growing fine-tuning stack
  (LoRA/QLoRA/GRPO kernels); ~50 workflow files show CI at industrial scale;
  process value is the free-Kaggle-T4 trick and pinned-vs-latest canary leg.
- **hiyouga/LlamaFactory** — 74,993 stars — "Unified Efficient Fine-Tuning of
  100+ LLMs & VLMs (ACL 2024)"; CLI/GUI/data-driven YAML launcher; 3 OS × 3
  Python × transformers-compat CPU matrix + self-hosted GPU runner.
- **huggingface/trl** — 19,369 stars — HF's canonical post-training library
  (SFTTrainer, DPOTrainer, GRPO, reward trainers); the reference the others
  test against; narrow `--only-rerun` transient-retry discipline.
- **Lightning-AI/litgpt** — 13,680 stars — hackable pretrain/finetune/eval;
  CPU-only CI with synthetic micro-configs (no checkpoint downloads).
- **axolotl-ai-cloud/axolotl** — 12,494 stars — YAML-config launcher with
  DeepSpeed/FSDP; CPU pytest every PR, GPU e2e gated behind `run-gpu-tests`
  label; model-cache priming (`hf-cache.tar.zst`); CPU-run DeepSpeed tests
  (`DS_ACCELERATOR: "cpu"`).
- **OpenRLHF/OpenRLHF** — 10,040 stars — distributed RLHF suite (PPO/GRPO,
  Ray); trend-only: CI is a single publish-on-release workflow, no process
  evidence.
- **microsoft/LMOps** — 4,475 stars — Microsoft's LLM-operations collection;
  trend-only: evidences enterprise interest, `tests/` not enumerated.
- **meta-pytorch/torchtune** — 5,811 stars — process goldmine (integration
  markers, golden-loss regression, nightly GPU cron) but TREND-CAVEAT: README
  carries a 2025 sunset banner — process only, not the active-trend claim.

**Honest caveats (carried over).** Torchtune is sunset — its process evidence
is excellent but a clean-room project should not copy its bus-factor
trajectory. Axolotl process depth is partially unverified: workflow inventory
and one full e2e test file were read, but not every e2e test or the
`cicd/cicd.sh` GPU run order. Unsloth evidence skews toward installer/compat
CI (~200 tiny unit files plus notebook/Kaggle legs); no full smoke-train test
file was verified beyond the documented CI legs. OpenRLHF and LMOps are
trend-only. Axolotl's org moved (`axolotl-ai-cloud/axolotl`); LlamaFactory is
now `hiyouga/LlamaFactory` (case-renamed).

## Unknowns (UNK-*)

- UNK-01 — For GPU-only trainer paths, is a pinned ≤135M checkpoint downloaded
  from the Hub (axolotl pattern) or a synthetic micro-config (litgpt pattern)
  the right smoke fixture? Download dependence vs zero-download determinism —
  unmeasured trade-off.
  **Disposition: TARGETED.**
- UNK-02 — Do exact-loss goldens survive distributed paths (FSDP/DeepSpeed)?
  Verified only for single-device fp32 (torchtune). Parallel-reduction
  nondeterminism is unmeasured.
  **Disposition: TARGETED.**
- UNK-03 — No verified conformance oracle for DPO/GRPO *correctness* beyond
  smoke (loss finite, checkpoint exists). What reference behavior should a
  differential harness assert for preference/RL trainers?
  **Disposition: TARGETED.**
- UNK-04 — Axolotl nightly cadence and `cicd/cicd.sh` GPU run order were not
  read in detail; the nightly tier's cost profile is estimated, not measured.
  **Disposition: ADVISORY.**
- UNK-05 — Whether Kaggle-free-T4 CI legs (unsloth's trick) are available to
  a new clean-room project (quotas, ToS) — transferability unverified.
  **Disposition: TARGETED.**
- UNK-06 — Nondeterminism floor for rollout-sampling RL legs (GRPO/PPO): no
  committed tolerance exists in evidence; `loss-golden` floor is exact only
  for deterministic smoke paths. Blocking for banking any RL-leg golden.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] RL-leg nondeterminism floor parked: S3 seeded-repeat measurement commits the floor; banking RL-leg goldens gated on it. Promotion predicate: at S3 bench setup, run the GRPO/PPO rollout leg K>=N times with pinned seeds on the target accelerator class, bank the loss/reward spread as the RL-leg floor in NONDETERMINISM_FLOOR.md; no RL-leg golden is banked until the floor is committed (tol = max(3 x spread, floor)). Owner: plan author. S3 step: bench setup.
- UNK-07 — Axolotl's CONTRIBUTING.md CPU-vs-GPU guidance was read via a
  6-day-old search-index crawl of the new org; paths in `tests/` and `cicd/`
  are consistent with it, but the file itself is one crawl behind.
  **Disposition: WATCH.**
