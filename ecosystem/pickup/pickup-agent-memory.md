# Pickup companion: Agent memory systems

Type: persistent memory layers for LLM agents (Mem0/Letta/Zep-class) — ingestion,
extraction, storage (vector/graph), scored retrieval, and memory lifecycle
(update/forget), exposed as SDKs, per-agent plugins, MCP servers, or hosted services.

## Charter seed

**What it is.** A memory layer sits between the agent and its stores: it decides what
to remember (extraction), how to organize it (episodic/semantic/procedural; temporal
knowledge graphs), how to recall it (retrieval scored against conversation state), and
how to retire it (updates, dedup, forget). A starting point implements a local
store + scored recall loop + lifecycle, wrapped in one SDK surface, with a pinned
LoCoMo/LongMemEval harness as the oracle.

**In scope.** Memory APIs and lifecycles; temporal knowledge graphs for agent memory;
extraction pipelines; memory benchmarks and eval harnesses; per-agent-provider SDK
adapters and MCP exposure of a memory store.

**Out of scope.** Raw vector databases (own pickup type); general RAG frameworks (own
type); the agent frameworks that *consume* memory layers (LangChain, AutoGen — adjacent,
not memory systems); model serving and embedding-model serving.

For intake dependency-screening, "agent memory system" is a stipulative scoping
criterion, not an empirical claim: a repo whose primary artifact is a persistent
per-agent memory layer (write/read/update/forget APIs over agent interaction
history), evidenced by memory-benchmark reporting (LoCoMo/LongMemEval-class) or
explicit memory-layer positioning; general RAG frameworks (document-retrieval
pipelines) and vector databases (index substrates) are out of scope here and are
screened under their own pickup types. [RESOLVED 2026-09-23, S4 round 3 — UNK-4
triaged RESOLVED: the pack's trend table is entirely Mem0/Letta-class memory
layers and explicitly excludes langchain/autogen as memory systems.]

**A good starting point.** A single local memory store (SQLite + a pinned embedding
backend), a scored recall loop with per-provider LLM/embedding adapters, an honest
integration-test split (external DB drivers off by default), and a pinned,
verify-by-hash eval harness reproducing the vendor-published LoCoMo/LongMemEval numbers
— before any claim about recall quality is made.

### Requirements

- REQ-1: The charter's memory model is written down (what is stored, what is recalled,
  what is forgotten) and every shipped API is mapped to that model; no feature lands
  unmapped.
- REQ-2: Every benchmark number is pinned to a dataset blob hash, a harness commit, a
  judge-model identity, and a platform statement (managed vs OSS artifact).
- REQ-3: Single-pass scores and ensemble scores are never commingled; the published
  number names which it is.
- REQ-4: The test tree has a per-provider adapter matrix (one test file per
  LLM/embedding/vector-store/reranker backend) and integration tests default off,
  re-enabled only with explicit env-var opt-in.
- REQ-5: A localbench bench instantiates the bench-shape below before the first
  competitive claim; numbers without banked goldens are diagnostic only.
- REQ-6: No adopter, ecosystem, or "production-proven" claim ships on README logos or
  integration lists; adoption evidence requires a verified primary source.

- REQ-CI-COST — CI provisioning + cost ownership (bench slot 13, per
  PROJECT-PICKUP-PLAYBOOK.md). The S3 plan names: runner class/host (self-hosted
  GPU runner vs cloud vs CPU-only), provisioning owner (who stands up the
  runners), funding owner/account (who pays), schedule (PR / nightly / weekly /
  scheduled), and a spend cap before BEADS READY. Any field left `TBD` blocks S5.
  GPU-hour/lab spend is metered and recorded against the cap (see shared-gates.md
  GATE-007).

## Oracle candidates + integrity checks

Candidates named in `_evidence/agent-memory.md` (verified 2026-09-23):

| Oracle | What it pins | Repo |
|---|---|---|
| LoCoMo | `data/locomo10.json` (canonical dataset), `task_eval/` (evaluate_qa.py, evaluation_stats.py, per-provider LLM utils) | snap-research/locomo |
| LongMemEval | `src/{generation,retrieval,index_expansion,evaluation}/` (evaluate_qa.py, print_qa_metrics.py, print_retrieval_metrics.py) | xiaowu0162/LongMemEval |
| Vendor harness | `benchmarks/{locomo,longmemeval,beam,common}/`, `configs/{azure-openai,ollama,openai}.yaml`, `results/`, `docker-compose.yml` | mem0ai/memory-benchmarks (also vendored as the `evaluation/` submodule of mem0ai/mem0) |
| In-product harnesses | `benchmarks/locomo/` (benchmark.py, benchmark_config.yaml, evaluation.py, ingestion.py, ontology.py, persistence.py, prompts.py, Makefile, tests/), `benchmarks/longmemeval/`, `zep-eval-harness/` (zep_evaluate.py, checkpoint.py, retry.py, config/, runs/, data/) | getzep/zep |

**Per-oracle integrity checks** (truth-pack shape, cf. model-guides §1–2):

- `PIN_RECORD.md` — the exact upstream commit of each oracle repo plus the blob
  SHA-256 of each dataset file (`data/locomo10.json`; the LongMemEval data shards);
  dataset content is pinned by hash, never by "latest".
- `MANIFEST.sha256` — every fixture, prompt file, and config YAML under `docs/truth-pack/`.
- `ACCEPTANCE_SURFACE.json` — break-even thresholds computed *before* the experiment:
  minimum recall-quality delta versus a no-memory baseline per benchmark (whisper's
  [NO ADMISSIBLE RATIO] rule applies: an unnamed hardware/model invalidates the ratio).
- `NONDETERMINISM_FLOOR.md` — LLM-judge A/A spread (LoCoMo's `task_eval/` judges are
  gpt/claude/gemini-class models; scores vary run to run). Improvement claims inside
  the floor are not claims.
- `fetch-truth-pack.sh --verify` — clones the pinned oracle commits, verifies every
  dataset/config hash, refuses to proceed on mismatch; the only legal oracle bootstrap.
- Invocation-time SHA-256 recording of the benchmark-runner binary/script (model-guides
  §2: an un-recorded executable is inadmissible; the 2026-08-11 whisper Metal entry is
  the precedent).

**Unknowns at the oracle layer** (see UNK-1–UNK-3, UNK-6).

## Initial claims (CLAIM-*)

Claims are about the *type's* process norms, not any single repo's marketing.
Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md): T0 [Verified] — direct inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with invocation-time SHA-256 recorded; T1 [CI-observed] — executed and observed on CI / banked receipt; T2 [Maintainer claim]/[External] — asserted by repo docs or an independent source, not reproduced by us; T3 [Inference] — analyst judgment, always labeled as such. Confidence: High (T0 ADMISSIBLE) / Medium (T0 CONTESTED, T1, T2 ADMISSIBLE) / Low (T2 CONTESTED, T3); WITHDRAWN rows carry --.

| ID | Statement | Evidence pointer | Tier | Confidence | Status |
|---|---|---|---|---|---|
| CLAIM-1 | LoCoMo (`snap-research/locomo`) and LongMemEval (`xiaowu0162/LongMemEval`) exist as public memory-eval repos with the pinned files named in the oracle section. | snap-research/locomo, xiaowu0162/LongMemEval (repo/file existence verified) | T0 | High | ADMISSIBLE |
| CLAIM-1b | Independent vendors publish against both LoCoMo and LongMemEval as shared cross-vendor evals. | mem0ai/mem0, getzep/zep, SuperMemoryAI/supermemory README self-reports ([README]-marked, not independently verified) | T2 | Medium | ADMISSIBLE |
| CLAIM-2 | Vendors self-publish benchmark scores after algorithm rewrites, including the eval framework they used. | mem0ai/mem0 README (Apr 2026: LoCoMo 92.5 / LongMemEval 94.4 / BEAM); framework open-sourced as mem0ai/memory-benchmarks | T2 | Medium | ADMISSIBLE |
| CLAIM-3 | A platform-gap disclosure (managed platform numbers ≠ OSS SDK numbers) is practiced by at least one major vendor, and must be treated as the exception: most vendors do not disclose it. | mem0ai/mem0 README disclosure; absence across others [Inference] | T0 | Medium | CONTESTED |
| CLAIM-4 | Single-pass and ensemble benchmark numbers must be stated separately; a headline can be an undisclosed-at-first-glance ensemble. | SuperMemoryAI/supermemory README: ~99% headline is an 8-variant ensemble; comparable single-pass is 85.86% | T0 | High | ADMISSIBLE |
| CLAIM-5 | Per-provider adapter matrix testing is the process norm: one test file per LLM, embedding, vector-store, and reranker backend. | mem0ai/mem0: `tests/llms/` (17), `tests/vector_stores/` (28), `tests/embeddings/` (11), `tests/rerankers/` (9) | T0 | High | ADMISSIBLE |
| CLAIM-6 | Integration tests are default-off and gated by env-var opt-out/opt-in; the unit suite never requires an external DB. | getzep/graphiti `.github/workflows/unit_tests.yml` (`-m "not integration"`, `DISABLE_NEPTUNE=1 DISABLE_NEO4J=1 DISABLE_FALKORDB=1 DISABLE_KUZU=1`); `docker-compose.test.yml` carries the infra | T0 | High | ADMISSIBLE |
| CLAIM-7 | Vendors ship their eval harness as a vendored submodule or in-repo directory with benchmark plugins, provider configs, and checked-in results. | mem0ai/mem0 `evaluation/` submodule → mem0ai/memory-benchmarks; getzep/zep `benchmarks/` dirs + `zep-eval-harness/` | T0 | High | ADMISSIBLE |
| CLAIM-8 | Eval pipelines split into generation → retrieval → evaluation stages with separate scripts per stage. | xiaowu0162/LongMemEval `src/{generation,retrieval,index_expansion,evaluation}` | T0 | High | ADMISSIBLE |
| CLAIM-9 | Supply-chain hygiene in CI (pinned action SHAs, dependency firewall, lint/typecheck/codeql as separate gates) is demonstrated by at least one major memory vendor, but it is not yet the type norm. | getzep/graphiti `.github/workflows/` (pinned SHAs, socket-firewall-connectivity.yml) | T0 | High | ADMISSIBLE |
| CLAIM-10 | Monorepo per-package CI and per-SDK publish workflows are the norm for multi-surface memory projects. | SuperMemoryAI/supermemory `.github/workflows/{ci.yml,ci-python.yml,publish-*.yml}`; mem0ai/mem0 `*-checks.yml`/`*-cd.yml` per agent plugin/SDK | T0 | High | ADMISSIBLE |
| CLAIM-11 | Adopter claims for memory libraries are thin in this evidence pack: they live in README logos and integration lists that were deliberately not individually verified and are not cited. | _evidence/agent-memory.md caveats | T0 | High | ADMISSIBLE |
| CLAIM-12 | Star counts can mislocate active development: a landing page can hold 24.8k stars while development happens in a 3.4k-star repo. | letta-ai/letta (landing page + `archive` branch) vs letta-ai/letta-code (agent harness, terminal UI, App Server; smoke-test CI) | T0 | High | ADMISSIBLE |
| CLAIM-13 | The canonical LoCoMo dataset is static (last push 2024-08-13) and still canonical; innovation moved into downstream harnesses. | snap-research/locomo `data/locomo10.json` vs mem0ai/memory-benchmarks, getzep/zep harnesses | T0 | High | ADMISSIBLE |
| CLAIM-14 | Indie/third-party benchmark variants (e.g. total-agent-memory self-reported 95–96%) are directionally useful but not ground truth; methodology is thinly vetted. | _evidence/agent-memory.md caveats [Inference] | T3 | Low | CONTESTED |

## Gate profile

Applicability of the starter-kit G1–G14 (load-bearing vs advisory, per _s0/ecosystem-digest.md §3):

- **G1 ORACLE** — load-bearing, as-is. Oracle inventory = pinned benchmark-dataset commits
  + harness repo commits + judge-model identity; oracle shielded from the implementing agent.
- **G2 PAIR** — load-bearing, type-parameterized: paired validation = same-invocation A/B/A
  against the pinned vendor harness over the same dataset shards; the harness commit's
  SHA is part of the pair record.
- **G3 OWN** — as-is.
- **G4 CONTRACT** — as-is, type-parameterized: conformance = dataset fixture hash binding,
  recall-format schema, per-benchmark metric definitions (see GATE-MEM-1).
- **G5 HOST** — as-is, load-bearing for judge variance: provider-side LLM-judge
  nondeterminism is a named host confound (see GATE-MEM-2).
- **G6 UNSAFE** — advisory; typically N-A (memory layers are rarely unsafe-heavy). Becomes
  load-bearing only in a Rust clean-room port.
- **G7 REVIEW** — advisory; the type-specific analog is split-context adversarial review on judge/scoring-logic changes (adversarial review is the instrument that caught benchmark-honesty classes elsewhere in the program), recorded as a review parameter, not a claim that canonical G7 applies as-is.
- **G8 RULEBOOK** — as-is, load-bearing.
- **G9 IOU** — as-is (zero unresolved at close).
- **G10 MIRI** — N-A unless unsafe Rust exists in the tree.
- **G11 LAYOUT** — advisory.
- **G12 AUDIT** — as-is (class-fix → instance re-audit; applies to benchmark-dishonesty
  classes such as unmarked ensembles).
- **G13 NOSTUB** — as-is.
- **G14 REJECT** — as-is, load-bearing: score claims that omit single-pass/ensemble,
  judge pin, or platform statement violate their evidential burden and are rejected.

**Proposed new type-specific gates:**

- **GATE-MEM-1 BENCH_HONESTY** — every published benchmark number states four fields:
  single-pass vs ensemble, judge-model pin (name + date), platform (managed vs OSS
  artifact), dataset blob hash. *Acceptance:* all four present and the dataset hash
  resolves against `PIN_RECORD.md`; missing any one = automatic REJECT under G14.
- **GATE-MEM-2 JUDGE_FLOOR** — the LLM-judge A/A spread is measured (same dataset, same
  pipeline, judge re-run) and committed in `NONDETERMINISM_FLOOR.md`. *Acceptance:* floor
  committed before any comparative claim; deltas inside the floor may not be claimed as
  improvements (analogue of whisper's dual-A/A null band).
  [Inference, labeled]: the floor measures judge *variability*, not judge *validity* —
  a stable judge can be stably wrong; the gate bounds noise, it does not certify that
  the judge's scores track real memory quality.
- **GATE-MEM-3 DATASET_PIN** — benchmark datasets are pinned by blob SHA-256 in
  `MANIFEST.sha256`; `fetch-truth-pack.sh --verify` is green at the assessed commit.
  *Acceptance:* verify passes; a re-downloaded dataset whose hash drifted fails the gate.
- **GATE-MEM-4 ADAPTER_PARITY** — the per-provider adapter matrix covers ≥2 embedding
  backends and ≥2 vector-store backends with identical conformance checks. *Acceptance:*
  matrix CI green with all backends on the same conformance set; a new backend ships
  only with its adapter test file.

### Shared-gate declarations (load-bearing vs advisory)

| Shared gate | Disposition | Rationale |
|---|---|---|
| GATE-002 (Model truth-pack / oracle integrity) | Load-bearing | Score claims rest on pinned oracle datasets + harness commits (REQ-2; GATE-MEM-3 dataset pin) |
| GATE-009 (Retrieval relevance/recall) | Load-bearing | Applies to this slug; scored recall vs frozen oracle + pinned thresholds is the plan's core (REQ-2, GATE-MEM-1) |
| GATE-014 (Deterministic test doubles / offline CI) | Universal | Applies to all types; integration tests default-off via env vars (REQ-4) |
| GATE-015 (Tiered CI separation) | Universal | Applies to all types; unit/integ/bench/judgevar/mem tiers separated |
| GATE-016 (Dependency / toolchain pinning) | Universal | Applies to all types; judge-model pin lockfile + harness pins (PIN_RECORD.md) |
| GATE-018 (Flake quarantine) | Universal | Applies to all types; judge variance bounded by the GATE-MEM-2 floor |

## Evidence tiers

Rulebook five tiers mapped to this type's admissible evidence (Rulebook §1;
model-guides §5), with canonical pickup tiers:

- **T0 [Verified].** The benchmark repos themselves (snap-research/locomo,
  xiaowu0162/LongMemEval) as oracles; file contents verified directly via the GitHub
  contents API (this pack's method = [Code-verified]/[Git-observed]/[Counted]); file-level
  pointers (e.g. `tests/llms/` counts, workflow YAML contents). A score reproduced by
  someone other than the vendor on the pinned dataset.
- **T1 [CI-observed].** Vendor CI observed running (attests the suite *runs*,
  not that it is green — e.g. graphiti's `unit_tests.yml`, mem0's `ci-gate.yml`);
  in-repo checked-in benchmark `results/` dirs; the vendored `evaluation/` submodule link.
- **T2 [Maintainer claim].** README benchmark scores (mem0's 92.5/94.4; supermemory's
  85.86% single-pass / ~99% ensemble) — admissible only with GATE-MEM-1's four fields
  disclosed; without them the number is diagnostic.
- **T3 [Inference].** Targeted-but-unmeasured scores, planned adapters, "memory will
  improve recall by X%" statements — must carry TARGETED labels (nlp's aspirational
  labeling rule); a T3 number in a public claim is a G14 violation.
- **[External].** The benchmark dataset repos when used as selection signals or
  third-party context rather than local oracles; absence of coverage is a finding.
- **[Inference].** All analyst judgments (e.g. CLAIM-3's "most vendors do not disclose",
  CLAIM-14) — always labeled, never upgraded by repetition.

Grade the claim, not the analyst's feelings: every row carries tier + confidence
(High/Medium/Low).

## Localbench bench shape

- **Spec format.** `memlib:<benchmark>:<judge>` — e.g. `my-memory:locomo:gpt-4o-2026-03`,
  `my-memory:longmemeval-S:claude-sonnet-2026-02`. Names exactly what is measured:
  the memory lib under test, the benchmark suite, and the pinned judge model. The
  harness starts/stops the memory server itself (cf. getzep/zep `server/`,
  mem0's server layout).
- **Named tiers.** `unit` (adapter matrix), `integ` (integration, default-off, env-var
  gated per graphiti's pattern), `bench` (LoCoMo / LongMemEval scores), `judgevar`
  (LLM-judge A/A spread), `mem` (lifecycle conformance: store/recall/update/forget),
  `e2e` (agent + memory store loop). Goldens bind PER TIER; a component update
  re-banks only the tiers it touches.
- **Golden schema.** JSON per spec: `conformance` (fixture-hash match = MUST; recall
  response schema = MUST; judge-response shape = SHOULD) + `metrics` (each with `value`,
  `spread` from A/A, `tol`, `tol_source` → banked receipt path, `better` direction).
  Tolerance rule: `tol = max(3 × A/A relative spread, floor)`, where the floor is the
  committed judge floor from `NONDETERMINISM_FLOOR.md`.
- **Banking ceremony.** Goldens written ONLY by an A/A pair run (`aa <spec>
  --write-golden`: two runs → banked receipt + golden, refuses unsound A/A pairs),
  followed by `git diff goldens/` review in the same commit.
  Golden-regeneration-until-green is a named forbidden pattern.
- **Host binding.** `goldens/<host_id>/`; never compared across hosts or generations.
  Generation change = any of: benchmark-dataset re-pin, harness update, judge-model
  re-pin, embedding-model re-pin.
- **Measurement law.** Preflight refuses a busy machine; CONTENDED marking; one unit
  under test at a time; loopback/local-only endpoints — a failed local call is a
  finding, never a cloud fallback. **Remote-lab variant note:** LLM-judge calls are
  provider-side and inherently remote; provider-side variance is quarantined via
  GATE-MEM-2 (JUDGE_FLOOR), not by weakening the law.
- **A/B discipline.** Same-invocation A, B, A ordering: memory-lib-under-test vs the
  pinned incumbent harness (the vendor's own benchmark runner from mem0ai/memory-benchmarks
  or getzep/zep's `zep-eval-harness`), both executables' SHA-256 recorded at invocation
  (whisper rule).
- **Receipts.** `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
  (kinds: aa, ab, mem, run) + dated `.md` notes; `runs/` gitignored scratch;
  `registries/claims.tsv` machine-checks every public score sentence against its receipt.
- **Incumbent pins.** `docs/evidence/incumbents.md`: benchmark repo commits, dataset blob
  hashes, harness commit, judge-model identity, embedding-model revision, OS.
- **Negative-evidence ledger.** `NEGATIVE_EVIDENCE.md`, `DISCREPANCIES.md` (kills carry
  resurrection predicates; retractions stay in-tree), `break-tests.md`, `demotion-rules.md`.
- **Anti-reward-hacking law.** The 12 forbidden patterns verbatim in AGENTS.md, with
  this type's special emphasis on proof-class inflation via ensembles and
  cherry-picked judge runs.

## Starter-kit deltas

- `docs/truth-pack/` memory instantiation: `PIN_RECORD.md` (LoCoMo + LongMemEval +
  vendor-harness commit pins), `MANIFEST.sha256` over dataset blobs and provider
  configs, `ACCEPTANCE_SURFACE.json` (break-even thresholds vs no-memory baseline per
  benchmark), `NONDETERMINISM_FLOOR.md` (judge A/A), `fetch-truth-pack.sh --verify`.
- Gate registry additions: GATE-MEM-1 through GATE-MEM-4 (above) with machine-checkable
  acceptance predicates.
- Adapter-matrix CI template: `tests/<backend>/` one-file-per-provider layout;
  integration mark default-off with env-var disable (graphiti pattern).
- Judge-model pin lockfile: judge identity (name + date) pinned; unpinned judge =
  refusal to bank (whisper's `operationally_verified: false` analogue for eval).
- `registries/claims.tsv` score-claim preset: every score sentence registers
  single-pass/ensemble, judge pin, platform, dataset hash.
- `mem-bench` harness skeleton: generation → retrieval → evaluation stage separation
  (LongMemEval shape) with checkpoint/retry (zep-eval-harness shape).

- **CI provisioning + cost ownership (bench slot 13):** runner class/host, provisioning
  owner, funding owner/account, schedule, and spend cap — TBD acceptable pre-S5
  (any TBD blocks S5 per Bench slot 13); current: TBD (owner: parent orchestrator
  assigns at S3).

## Trend + process citations

Stars snapshot 2026-09-23 (all from `_evidence/agent-memory.md`, verified via
`api.github.com` that day). Process takeaway per repo:

- **mem0ai/mem0** — 65,890 stars. Largest memory-layer repo; publishes its own
  LoCoMo/LongMemEval/BEAM scores after an algorithm rewrite and open-sources the eval
  framework it used (vendored as a submodule). Copy the disclosure; verify the numbers.
- **SuperMemoryAI/supermemory** — 30,841 stars. Second-largest; monorepo with per-SDK
  publish CI; discloses the ensemble behind its ~99% headline (85.86% single-pass is
  the comparable figure).
- **getzep/graphiti** — 31,102 stars. Temporal knowledge-graph memory; strictest CI in
  the pack: pinned action SHAs, Socket firewall, lint/typecheck/codeql gates,
  integration tests default-off via env vars.
- **getzep/zep** — 4,929 stars. Production memory product; keeps benchmark harnesses
  in-repo (`benchmarks/locomo/`, `benchmarks/longmemeval/`) plus a checkpointed,
  retried eval harness (`zep-eval-harness/`).
- **letta-ai/letta** — 24,858 stars. **Star-count trap:** now a landing page +
  `archive` branch; always cite with letta-code.
- **letta-ai/letta-code** — 3,412 stars. Where Letta is actually developed; smoke-test
  CI (nightly-update-smoke, telegram-live-smoke).
- **snap-research/locomo** — 1,185 stars. The LoCoMo benchmark itself; static since
  2024 but the canonical `data/locomo10.json` everyone downloads.
- **xiaowu0162/LongMemEval** — 1,104 stars. The LongMemEval benchmark itself; clean
  generation→retrieval→evaluation pipeline; community HF mirror
  `xiaowu0162/longmemeval-cleaned` widely used by third-party harnesses.
- **mem0ai/memory-benchmarks** — 113 stars. Vendor's open-sourced eval framework:
  benchmark plugins + provider configs + checked-in results + docker-compose.

Adjacent, not memory systems: **LangChain-AI/langchain** (146,931 stars, pushed
2026-09-23) and **microsoft/autogen** (61,123 stars, pushed 2026-04-15) are the
agentic frameworks that *consume* memory layers. AutoGen's push is 5 months old —
check its current status before citing it as active.

**Honest caveats carried over:** adopter claims are thin (README logos/integration
lists not individually verified, deliberately uncited); Supermemory's README is
self-promotional (use the 85.86% single-pass, not the ~99% ensemble headline);
Mem0's README is honest about the platform gap (managed-platform numbers not
available in the OSS SDK — copy the disclosure practice, not just the scores);
third-party `total-agent-memory` variants self-report 95–96% with thinly-vetted
methodology (directional, not ground truth); LoCoMo is static but canonical.

## Unknowns (UNK-*)

- **UNK-1** — BEAM provenance: `mem0ai/memory-benchmarks` ships a `benchmarks/beam/`
  directory, but no upstream BEAM repo appears in this evidence pack. What is BEAM's
  canonical pin, and is it independently reproducible?
  **Disposition: TARGETED.**
- **UNK-2** — Judge-model survivability: LoCoMo's `task_eval/` pins per-provider LLM
  utils (gpt/claude/gemini). Do those judge model names still resolve in 2026? If the
  judges are deprecated, the oracle is half-dead and GATE-MEM-2 has no subject.
  **Disposition: TARGETED.** [Round 3 triage, 2026-09-23] Judge-model survivability parked: S3 truth-pack assembly resolves each pinned judge name; deprecated judges demote dependents and re-scope GATE-MEM-2. Promotion predicate: at S3 truth-pack assembly, resolve each pinned judge model name against provider model-list endpoints using the pickup CI's credentials; record resolvability in PIN_RECORD.md; any deprecated judge demotes dependent claims one tier per demotion rules and GATE-MEM-2 is re-scoped to resolving judges. Owner: evidence auditor (oracle-pointer verification). S3 step: truth-pack assembly.
- **UNK-3** — Community mirror fidelity: is the widely-used HF mirror
  `xiaowu0162/longmemeval-cleaned` hash-identical to the upstream LongMemEval data?
  Third-party harnesses' numbers rest on this.
  **Disposition: TARGETED.**
- **UNK-4** — Type boundary: where does "agent memory system" end and "RAG framework"
  or "vector database" begin for intake dependency-screening? The line is fuzzy and
  a pickup project needs it crisp before S5.
  **Disposition: RESOLVED.** [RESOLVED 2026-09-23, S4 round 3] Type-boundary criterion resolved (stipulative, not empirical): for intake dependency-screening, an 'agent memory system' is a repo whose primary artifact is a persistent per-agent memory layer (write/read/update/forget APIs over agent interaction history), evidenced by memory-benchmark reporting (LoCoMo/LongMemEval-class) or explicit memory-layer positioning; general RAG frameworks (document-retrieval pipelines) and vector databases (index substrates) are out of scope here and screened under their own pickup types. Grounded in the pack's trend table (entirely Mem0/Letta-class memory layers) and its explicit exclusions of langchain and autogen as memory systems.
- **UNK-5** — Adoption evidence: do per-agent-plugin SDKs (Strands, OpenClaw, n8n,
  Zapier, …) count as adoption evidence or as marketing surface area? The evidence pack
  deliberately did not resolve this.
  **Disposition: ADVISORY.**
- **UNK-6** — Local-first judging: is there any admissible no-API judge (deterministic
  scorer, exact-match, or pinned local model) for LoCoMo/LongMemEval, or does every
  localbench bench for this type inherit the remote-lab variant note?
  **Disposition: TARGETED.**
