# Planning Methodology — franken_drone_geometry_reconstruction

**Repo:** `Dicklesworthstone/franken_drone_geometry_reconstruction` (`fdgr`)
**Analyzed:** 2026-09-22 (depth-1 clone, commit `90892e9`, "fix(plan): make VS-01 classical geometry closure model-free (FDGR-VS-00)")
**Analyst mode:** HOW Emanuel plans, not what he built. Doc prose below is treated as data, quoted verbatim where load-bearing.

## 0. Headline

[Inference, from the inventory below] This repo does not keep the suite's typical loose planning style. Emanuel fused planning method and product into one artifact: **the planning system for the agent swarm is itself the first product being specified**. The repo ships (a) a ~29,000-word normative comprehensive plan with embedded acceptance gates, (b) a machine registry layer (`registries/*.toml`, `schemas/*.json`) that is declared authoritative over prose, (c) a 347-issue `.beads` task graph with tracker-independent stable `WP-*` IDs, and (d) an 11-operation "narrow waist" agent control loop that *both* governs how future agents will run the build *and* is the thing being built. It is the most constitutionally written repo in the suite observed to date.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKEN_DRONE_GEOMETRY_RECONSTRUCTION.md` | Master planning document (~28,914 words, Draft 0.4, dated 2026-08-30) | Normative architecture, research, and execution plan; declares itself "unusually demanding"; delegates authority to registries/schemas |
| `COMPREHENSIVE_PLAN_IMPLEMENTATION_SUPPLEMENT.md` | Plan addendum (~998 words) | Implementation supplement to the master plan |
| `registries/work_packages.toml` | Machine work graph | 48 dependency-ordered work packages `WP-000`–`WP-047`, each with summary, dependencies, acceptance gate, status; declared "the machine source" of the work program |
| `registries/gates.toml` | Execution-readiness gates | 25 acceptance gates `GATE-000`–`GATE-024`, each a named `terminal_predicate` string |
| `registries/claims.toml` | Claim matrix | 10 claim families (`CLAIM-RAW-001`…`CLAIM-READY-001`) with required evidence lists and terminal predicates |
| `registries/doctrine.toml` | Design constitution | 14 leapfrog bets (`BET-001`…`BET-012`), 14 goals, 10 explicit non-goals as machine-readable statements |
| `registries/risks.toml` | Risk ledger | 23 risks (`RISK-001`…`RISK-023`), each with impact, mitigation, and explicit **kill criterion** |
| `registries/open_questions.toml` | Unasked/unresolved questions | 28 open questions (`OPEN-001`…`OPEN-028`) with decision requirements |
| `registries/tests.toml` | Verification families | ~30 `TEST-*` families mapping required evidence to test scope (incl. adversarial coverage) |
| `registries/slos.toml`, `models.toml`, `schemas.toml`, `invariants.toml`, `effects.toml`, `errors.toml`, `operation_costs.toml`, `capabilities.toml`, `graph_algorithms.toml`, `geometry_algorithms.toml` | Supporting machine registries | Typed, stable-ID registries for every planning dimension; `schemas/` holds 40+ versioned JSON schemas |
| `registries/agent_operations.toml`, `agent_profiles.toml` | Agent execution contract | The 11 `fdgr.*` narrow-waist operations with phase/authority; observation profiles |
| `docs/adr/ADR-0001..ADR-0011` + `registries/adrs.toml` | Architecture decision records | 11 accepted ADRs (three-plane authority → canonical machine vocabulary), machine-indexed |
| `docs/AGENT_OPERATING_MODEL.md` | Agent control-loop contract | ~22-section normative doc: the 12-phase operating loop, abstraction tower, four ledgers, Agent Turn Packet, epistemic model, question-first control, accretion; includes Agent Gates A0–A5 |
| `docs/AGENT_ACCEPTANCE_SCENARIOS.md` | Agent acceptance test matrix | 27 scenarios A-001…A-027 with required evidence each; "Schema validation alone is insufficient" |
| `docs/AGENT_QUICKSTART.md` | Onboarding doc for agents | First-try orientation material |
| `docs/BEADS_BOOTSTRAP.md` + `scripts/export_beads_bootstrap.py` | Tracker bootstrap procedure | Generates deterministic reviewable JSONL from `work_packages.toml`; "does not mutate a Beads database" |
| `.beads/issues.jsonl` (347 records), `.beads/bootstrap.jsonl` (48 records), `.beads/beads.base.jsonl` | Task-tracker database | 62 epics + 234 tasks + 48 features + 3 bugs; issue schema has `acceptance_criteria`, `dependencies`, `priority`, `compaction_level` |
| `architecture/` (~30 docs: `AGENT_ACCRETION.md`, `AGENT_ABSTRACTION_TOWER.md`, `AGENT_NARROW_WAIST.md`, `MULTI_AGENT_COORDINATION.md`, `HUMAN_AGENT_FLIGHT_PROTOCOL.md`, `CONTEXT_PACKS.md`, `DECISION_FRAME.md`, `QUESTION_OBJECTIVE_GRAPH.md`, `ATTENTION_AND_EPISTEMIC_DEBT.md`, `qualification_lanes.toml`, …) | Subsystem design references | One design reference per planning-critical subsystem, indexed by `DESIGN_INDEX.md` |
| `research/DEEP_DIVE_METHOD.md`, `research/TRANSFER_MATRIX.md`, `research/CROSS_PROJECT_COMPOSITION.md`, `research/deep-dives/01–11`, `research/source-inventory/` | Sibling-project research phase | 11 mechanism-level deep dives (one per Franken sibling), pinned to commit identities; transfer matrix maps each mechanism → FDGR owner → admission evidence |
| `RESEARCH_SOURCES.md`, `DJI_ADAPTER_RESEARCH.md`, `MODEL_REGISTRY.md` | Domain research | Three-layer design basis: frozen source manifest → deep dives → traceability JSON |
| `AGENTS.md` | Agent operating instructions | First obligation: read the plan + registries before substantive changes; 16-item development doctrine incl. honesty rules |
| `IMPLEMENTATION_STATUS.md` | Status honesty doc | Snapshot 2026-09-04 with a five-level maturity vocabulary, per-surface earned boundaries, and an "Important non-claims" table of ~24 explicitly disclaimed capabilities |
| `DESIGN_INDEX.md` | Reading-order index | Explicit "start from the agent's seat" ordering of normative documents |
| `schemas/plan_candidate.schema.json` | Plan-as-data contract | Versioned machine schema for candidate plans (assumptions, witnesses, predicted deltas, costs) |
| `LOCAL_QUALIFICATION_AND_RELEASE.md`, `QUALIFICATION.md` | Release authority | Doodlestein-native local receipt authority; `hosted_github_actions_authority = false` |

---

## 2. Execution-readiness gates

[Verified — all quotes read verbatim in repo files.]

### 2.1 Gate format

Gates live in `registries/gates.toml` as 25 terminal predicates. Representative verbatim:

- `GATE-000` "Constitution frozen": `"Registries parse, stable IDs are unique, dependency policy passes, and no implementation claim exceeds evidence."`
- `GATE-004` "Calibration and scale honest": `"Metric exports are impossible without scale witnesses; calibration and scale uncertainty calibrate on held-out fixtures."`
- `GATE-008` "Model lanes admitted": `"Exact model artifacts pass license, sandbox, schema, numeric, reproducibility, and domain benchmark gates."`
- `GATE-015` "Fault and benchmark evidence": `"Lab schedules and ground-truth campaigns cover named failure classes with reproducible receipts."`
- `GATE-016` "Performance claims earned": `"Same-binary experiments show semantic equivalence and statistically defensible latency, cost, and memory results."`
- `GATE-017` "Release qualified": `"All advertised platform, device, model, privacy, recovery, and performance dimensions have current positive evidence."`
- `GATE-022` "Accretion qualified": `"Episodes, surprises, cost calibration, feedback, lesson promotion, shadow/canary policy, monitoring, and rollback improve qualified workloads without weakening proof gates."`

### 2.2 Work-package definition of done

`COMPREHENSIVE_PLAN_FOR_FRANKEN_DRONE_GEOMETRY_RECONSTRUCTION.md` §121, verbatim:

> "A work package is complete only when:
> - contract/registry/schema changes are stable;
> - reference behavior exists where applicable;
> - success/failure/cancellation/recovery behavior is tested;
> - compatibility/migration is explicit;
> - positive and negative evidence is retained;
> - status/docs agree;
> - its acceptance gate predicate passes."

And the sequencing rule: [Maintainer claim] *"Work packages are dependency ordered. Agents MUST NOT start a later package by implementing around a missing prerequisite. A discovered prerequisite updates the work graph."* The same is restated in `AGENTS.md`: "Do not create implementation issues that bypass a blocking contract or gate."

### 2.3 Implementation threshold

[Maintainer claim] The plan sets the bar for what counts as implemented, verbatim:

> "A requirement is not implemented because a type, command, model wrapper, or code path exists. It is implemented only when its contract, success/failure behavior, migration, deterministic tests, positive evidence, negative evidence, and documentation agree."

### 2.4 Registry–prose conflict gate

[Maintainer claim] Normative conflict resolution, verbatim (Document control):

> "The machine registries are authoritative for published stable IDs. The prose explains intent and may contain more detail. If a registry and prose disagree, implementation MUST stop until the conflict is resolved by an ADR and synchronized change."

[Inference] This is a plan-freeze rule: drift between plan and machinery is a hard stop, not a judgment call.

### 2.5 Agent gates A0–A5

`docs/AGENT_OPERATING_MODEL.md` §23 defines five staged agent-semantics gates (contract lock → scaffold orientation → epistemic/context semantics → objective/candidate planning → obligation loop/active perception → accretion/multi-agent). They are gates on the agent control loop itself — the build's agents must pass them before the product's agents are trusted.

### 2.6 Gate-receipt sign-off

[Maintainer claim] `docs/BEADS_BOOTSTRAP.md`, verbatim:

> "Before marking a bead done, attach or reference the gate receipt. Source presence or a merged pull request is not sufficient when the terminal predicate includes crash, cancellation, compatibility, benchmark, restore, or positive-evidence requirements."

---

## 3. Honesty guardrails

[Verified — all mechanisms read in repo files.]

**a) Evidence labels (installed at plan inception, Draft 0.4, 2026-08-30).** Every normative statement must be classified FACT / DESIGN / HYPOTHESIS / TARGET / NEGATIVE EVIDENCE / UNKNOWN. Verbatim definition: `"**NEGATIVE EVIDENCE:** a tested absence, rejection, failure, incompatibility, or counterexample."` [Maintainer claim] `AGENTS.md`: "Classify statements as fact, design, hypothesis, or target in normative documents."

**b) Negative-evidence retention (lifecycle: permanent).** Plan §20.4 enumerates what negative evidence records (unsupported DJI profile, packet parser rejection, failed loop closure, metric scale conflict, model nondeterminism, cloud readback mismatch, privacy/license block…), then the rule, verbatim: *"Negative evidence remains visible after later success. It defines qualification scope and prevents future agents from repeating invalid assumptions."*

**c) No aggregate readiness percentages.** [Maintainer claim] `AGENTS.md`, verbatim: "Negative evidence must remain visible and cannot be summed into a misleading aggregate readiness percentage." The plan echoes: each claim family "has a distinct terminal predicate. They cannot be averaged into one readiness number." (plan §20.3)

**d) Claim matrix with terminal predicates (installed at plan inception).** `registries/claims.toml`: 10 claim families, each with `required_evidence` and a `terminal_predicate`, e.g. `CLAIM-ABS-001` (asset absent): `"The complete claimed domain was observed with sufficient detectability and yielded no qualifying observation."` [Inference] Absence is treated as a positive proof obligation, not a default.

**e) Anti-claim language (lifecycle: release gate).** Plan §120, verbatim: "Words such as 'real-time,' 'metric,' 'complete,' 'accurate,' 'production-ready,' 'supports DJI Flip,' 'secure,' and 'lossless' are prohibited without registered definitions and evidence." A claim must name "positive dimensions earned; negative evidence and exclusions; expiry/requalification trigger." Appendix E adds a public claim template (Claim ID, evidence receipt roots, positive dimensions, negative evidence, determinism class, corpus, expiry, reproduction command).

**f) Receipt-bound evidence.** "Local qualification receipts, not hosted badges, determine release readiness." (`AGENTS.md`); qualification lanes run under `authority = "local-doodlestein-receipts"` with `hosted_github_actions_authority = false` (`architecture/qualification_lanes.toml`). [Inference] Evidence is a signed local receipt; remote CI badges have zero authority.

**g) Future-tense ban.** [Maintainer claim] `AGENTS.md`: "Avoid future tense disguised as current functionality." `IMPLEMENTATION_STATUS.md` pairs this with a five-level maturity vocabulary (Source present ≠ Reference implemented ≠ Publicly invokable ≠ Locally qualified ≠ Production admitted): "No lower label implies a higher one."

**h) Explicit non-claims.** [Verified] `IMPLEMENTATION_STATUS.md` carries a ~24-row "Important non-claims" table (e.g. "DJI live-view or telemetry acquisition — Research only; no admitted adapter", "Metric camera pose — Not implemented; current camera centers use arbitrary component gauges"). [Maintainer claim] The "Qualification interpretation" section lists a dozen non-implications, e.g. "an estimated scale is not metric authority; a queued or hosted workflow is not a local Doodlestein receipt."

---

## 4. Plan→agent execution

**Task graph.** 48 work packages (`WP-000`–`WP-047`) with explicit `dependencies` arrays in `registries/work_packages.toml`; 347 `.beads` records (62 epic, 234 task, 48 feature, 3 bug; all 347 status `open` at clone time) carry `acceptance_criteria`, `dependencies`, `compaction_level` fields. [Maintainer claim] `.beads/README.md`: "The normative work graph lives in `registries/work_packages.toml`. The plan intentionally keeps stable `WP-*` identifiers independent of any one issue tracker database." — the IDs survive tracker migration by design.

**Phases.** Build order: constitution/reference substrate (WP-000–004) → capture/media (WP-005–013) → geometry (WP-014–021) → semantics (WP-022–023) → archive (WP-024) → surfaces (WP-025–027) → agent semantics stack (WP-033–047), each package bound to an acceptance gate.

**Agent execution contract.** The 11-operation "narrow waist" (`fdgr.open_session → orient → query → propose → compare → commit → watch → cancel → explain → handoff → doctor`) with per-operation phase and authority in `registries/agent_operations.toml` ("Models propose, authority-free planning"; only `commit` is effectful after validation). Plans are compiled as bounded candidate sets on one anchor vector with a Pareto frontier; merge of branches happens only through an explicit 6-step merge ladder (exact replay → structural composition → commutative composition → ordering with re-proof → reconcile and replan → reject); "Raw-byte merge and last-writer-wins are forbidden." (`architecture/MULTI_AGENT_COORDINATION.md`).

**Verification loops.** `commit → watch → verify/reconcile → learn → handoff/resume`: semantic progress streaming (no percent-complete without a known denominator), obligation reconciliation for indeterminate external effects (blind retry forbidden), surprise records on prediction divergence, immutable episode capsules, handoff capsules sufficient for a fresh agent to resume without transcript replay.

**Drift prevention.** [Maintainer claims] (1) Registry–prose disagreement = hard stop (quoted above). (2) "Published identifiers MUST NOT be renumbered. Superseded entries remain as tombstones with a replacement reference." (plan §"Stable identifiers"). (3) Determinism is a first-class product feature (`BET-008`): given same anchor/focus/policy/seed, "the agent surface is deterministic in: field and item order; context-pack composition and Pack DNA; attention and recommendation order; candidate and Pareto-frontier order…" (AGENT_OPERATING_MODEL §21). (4) "No single successful episode promotes a production policy." (AGENT_ACCRETION.md §4)

---

## 5. State-of-the-art coverage

[Verified] The plan front-loads research (§§1–6: research questions; DJI Flip/acquisition findings; geometry, semantic, cloud, Frankenstack findings; baseline comparison) and retains it in three layers (`RESEARCH_SOURCES.md`): (1) `research/source-inventory/source_manifest.json` freezing exact commit/tree identities inspected 2026-08-31; (2) 11 mechanism-level deep dives, one per Franken sibling, governed by `research/DEEP_DIVE_METHOD.md` — each study must answer "What exact mechanism is load-bearing rather than merely analogous?", "What superficial imitation would preserve vocabulary while losing semantics?", and "What admission evidence must exist before the integration can be claimed?"; (3) `architecture/deep_traceability.json` mapping transferred mechanisms into the abstraction tower. `research/TRANSFER_MATRIX.md` rows each have an "Admission evidence" column (e.g. Asupersync → "real/lab parity, cancellation matrix, authority tests"). README claims are explicitly demoted: "README claims are treated as orientation; implementation, tests, registries, qualification artifacts, and explicit status boundaries carry greater weight." (DEEP_DIVE_METHOD.md)

---

## 6. Anti-satisficing

**Falsification is engineered into the loop**, not a separate phase. [Maintainer claim] The driver's-seat contract requires the agent to answer: "What would falsify the current view or change the preferred plan?" (AGENT_OPERATING_MODEL §1, item 8). Competing hypotheses are retained: "Competing hypotheses are retained when evidence does not justify collapse." (§16); acceptance scenario A-006 "Model disagreement" requires "Separate proposals, counterevidence, resolution options, no forced merge."

**Fault campaigns.** `registries/tests.toml`: TEST-007 "publication kill-point crash matrix and orphan staging repair", TEST-008 cancellation/drain/reconcile at every boundary, TEST-015 "semantic presence, counterevidence, critical resolution, absence refusal". `AGENTS.md`: fault campaigns must include "cancellation, process crash, packet loss/reorder/duplication, timestamp reset/drift, malformed media, disk full, partial publication, cloud substitution, model NaNs/huge outputs, calibration mismatch, privacy scope violation, and stale compatibility profile." GATE-015 demands "reproducible receipts and visible negative evidence" for adversarial corpora.

**Policy promotion ladder (evidence-gated accretion).** [Maintainer claim] `architecture/AGENT_ACCRETION.md` §4, verbatim:

```text
episode evidence
→ lesson candidate
→ independent supporting episodes
→ contradiction and confound review
→ bounded applicability statement
→ deterministic offline replay
→ shadow recommendation evaluation
→ counterfactual/regret comparison
→ canary policy epoch
→ admitted and monitored policy
→ retain, revise, or roll back
```

with §5's safety envelope: "Adaptive policy may choose… [effort/scheduling] … It may not weaken scale, coverage, privacy, capability, freshness, publication, custody, or completion requirements." ADR-0009: "Learning SHALL begin from immutable episode and surprise capsules and reach production policy only through replay, shadow, canary, monitoring, and rollback."

**Stop conditions are first-class.** [Maintainer claim] AGENT_OPERATING_MODEL §10 lists six, ending: "Endless capture and endless refinement are failures of planning, not signs of thoroughness." Acceptance scenario A-026 requires the frontier to recommend doing nothing when evidence can't justify cost.

**No explicit red-team doc or named two-model dialectical review** — see §7.

---

## 7. Explicit absences

- `docs/planning/` — [Absent]
- `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` — [Absent] (the comprehensive plan lives under a 9-word descriptive filename instead)
- `CLAUDE.md`, `MUSE.md`, `.muse/`, `.cursor/`, `.cursorrules` — [Absent] (`AGENTS.md` is the sole agent-instructions file)
- **Auto-demotion rules** — [Absent as a named mechanism]. Demotion appears only as claim-lifecycle events ("held-out-camera demotion", TEST-006 "scale witness admission, conflict, demotion, and metric-output refusal", RISK-002 mitigation "contradiction/demotion"), not a codified auto-demotion registry. Closest formal machinery: the accretion rollback step and metric-output refusal gates.
- **Dialectical two-model review as a planning procedure** — [Absent]. No doc describes running two models against each other during planning. The closest analogues are in-product mechanisms: Pareto candidate frontiers, retained competing hypotheses, scenario A-006, and `BET-004` "Models propose, geometry adjudicates".
- **Definition-of-done doc** — [Absent as a standalone file]; the substance exists inline in plan §121 (quoted in §2.2 above) and `IMPLEMENTATION_STATUS.md`'s maturity vocabulary.
- **Explicit red-team / falsification-campaign doc** — [Absent]; falsification is distributed into the agent loop (falsifiability question, counterevidence requirements, adversarial corpora) rather than a named campaign.
- `.beads` has no `issue_type` distinction beyond task/epic/feature/bug and no recorded resolution — all 347 records `open` at clone time; the normative graph is the TOML, the DB is explicitly derivative.

---

## 8. Maturity verdict

**Mature.** This is the most fully specified planning regime observed in the suite. Distinctive evidence:

1. **Registry supremacy**: machine TOML registries are declared authoritative over prose, with a hard-stop ADR rule on conflict — planning as executable contract, not narrative.
2. **Receipt-bound completion**: gate receipts (not PRs, not source presence) close beads; local Doodlestein receipts (not hosted CI) close releases.
3. **Honesty codified as mechanics**: evidence labels, negative-evidence retention rules, a ban on readiness percentages and on future tense, a prohibited-words list for claims, and a 24-row non-claims table.
4. **Learning-before-authority**: the evidence-gated accretion ladder with shadow/canary/rollback and an explicit "no single episode promotes policy" rule.
5. **Self-hosting plan**: the agent operating loop in the plan is simultaneously the governance model for the build and the product under construction — Emanuel's "plan-first" habit taken to its limit.

Caveats: the 347 beads are all `open` and the comprehensive plan is Draft 0.4 — the planning machinery is mature but the build is early (snapshot 2026-09-04: deterministic reference chain through bundle admission only, "It is not yet a production DJI acquisition, joint bundle-adjustment, sparse/dense reconstruction, semantic-twin, archive-recovery, or agent-control system"). The maturity verdict is about the *planning method*, which is fully articulated; execution against it has just begun.
