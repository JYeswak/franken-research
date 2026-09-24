# Planning Methodology: frankensim
**Repo:** github.com/Dicklesworthstone/frankensim (cloned 2026-09-22; HEAD `cd99505`, depth-1, planning paths only)
**Analyst note:** frankensim is a clean-room Rust reimplementation of CAD/FEM/CFD/optimization/rendering ("one typed algebra where geometry, fields, operators, derivatives, error bounds, budgets, provenance, and cancellation travel together"). Its planning layer is by far the heaviest in the suite observed so far: not a `docs/planning/` directory, but a flat `docs/` of ~39 doctrine/policy documents plus a 3,577-issue Beads tracker and a 119 KB master plan.

**Tier legend:** [Verified] = read in a repo file; [Maintainer claim] = Emanuel's prose, quoted; [Inference] = reasoned from evidence; [Absent] = not found in repo.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKENSIM.md` (root, 119 KB, 876 lines) | Technical constitution | Master plan: thesis, Decalogue, 12 bets, layer architecture, Gauntlet (§13), roofline targets (§14), P0–P6 phases w/ Gauntlet-state exit criteria (§16.1), team-of-agents methodology (§16.2), crate atlas, reading list |
| `AGENTS.md` (root, ~1,035 lines) | Agent operating contract | RULE 0 override, "no process porn" rule, no-deletion/no-branch laws, Gauntlet as definition of done, DSR CI, workflow (start/end session), Beads/bv/Agent-Mail coordination |
| `docs/CLAIM_INTEGRITY.md` | Honesty defect class (normative) | Claim-integrity defect class, evidence order, decision/severity/label rules, audit method, known-answer table, enforcement via xtask + shell gates |
| `docs/CLAIM_INTEGRITY_SWEEP_2026-07.md` | Falsification campaign record | July 2026 full-pass audit: 6 independent auditors, 39 new findings (29 P0), 35 repaired, per-surface verdicts, recall check vs known-answer set |
| `docs/CI_GATES.md` | Machine-checkable policy | Decalogue→gate mapping, DSR as CI source of truth, ~30 `xtask check-*` gates table, runner honesty, constellation governance, public V&V scorecard + program metrics |
| `docs/EVIDENCE_PORTFOLIO_DOCTRINE.md` | Evidence admission doctrine | 7 independent evidence axes ("portfolio, not a pyramid"), claim-admission table per claim class, anti-laundering rules, falsifier rule for doctrine changes |
| `docs/MATURITY_LEVELS.md` | Capability maturity registry rules | L1–L5 definitions; promotion as governed event; "Demotions are always allowed"; evidence-ref typing |
| `docs/CONVENTIONS.md` | Weekly operating recipe | EXTREAL critical-path triage (robot bv), weekly recipe w/ receipts, moonshot displacement rule, falsifier reviews, shared-tree rules |
| `docs/CONTRACT_TEMPLATE.md` | Per-crate contract skeleton | Mandatory sections incl. No-claim boundaries; crate must have complete contract before becoming a dependency target |
| `docs/REALITY_CHECK_2026-09-01.md` | Adversarial self-audit | Sept 2026 red-team assessment: headline numbers, per-goal status (WORKING/PARTIAL/STUB/NOT_STARTED), truth defects table, bridge plan |
| `docs/PROJECTED_CHECKPOINTS.md`, `PROJECTED_ELASTICITY.md`, `PROJECTED_MULTILOAD.md` | Run-state mechanics | Pause/resume checkpoint formats for studies (not planning gates) |
| `docs/SIBLING_REVIEW_ASUPERSYNC.md`, `docs/SIBLING_REVIEW_FRANKENSQLITE.md` | Cross-repo adversarial reviews | Independent sibling reviews (e.g. SREV-2026-07-A) with independence grading, contract-first drills |
| `docs/ACCELERATOR_DOCTRINE.md`, `docs/CERTIFICATE_REGIMES.md`, `docs/CONSOLIDATION_REVIEW.md`, `docs/CONSTELLATION_GOVERNANCE.md`, `docs/CONSTELLATION_TRUST_CONE.md`, `docs/CROSS_ISA_VERIFICATION.md`, `docs/DETERMINISM_CLASSES.md`, `docs/GOLDEN_POLICY.md`, `docs/SCHEMA_POLICY.md`, `docs/SAFETY_TEMPLATE.md`, … | Specialist doctrines | Policy per concern (certificates, goldens, schemas, determinism, consolidation) |
| `docs/MATERIAL_DATA_EXPANSION_PLAN.md`, `docs/MATERIAL_DATA_INVENTORY.md`, `docs/MATERIAL_PROPERTY_TAXONOMY.md`, `docs/MATERIAL_REALITY_IMPLEMENTATION_PLAN.md` | Domain expansion plans | Targeted execution deltas ("Status: implementation plan; no new physical capability is claimed by this document") |
| `docs/APPLE_APP_PLAN.md`, `docs/DECISION_MUSIC_MEAN_FLOW.md`, `docs/NEW_DOMAINS_AUDIT_SNAPSHOT_*.json` | Sub-program plans/audits | Vertical-specific plans with audits |
| `COMPREHENSIVE_BRIDGE_PLAN_FOR_FRANKENSIM.md`, `COMPREHENSIVE_ADDENDUM_TO_FRANKENSIM_PLAN.md`, `COMPREHENSIVE_PLAN_FOR_OPTIMAL_MUSIC_ORIENTED_BUILDING_BLOCKS.md`, `COMPREHENSIVE_PLAN_FOR_REAL_TIME_WRIGHT_FLYER_SIM_WITH_FRANKENSIM.md`, `COMPREHENSIVE_PLAN_TO_EXTEND_FRANKENSIM_TO_NEW_DOMAINS.md` | Satellite plans | Bridge plan (gap-closing), addendum, music/wright-flyer/new-domains expansions |
| `.beads/issues.jsonl` (3,577 issues) | Task tracker database | Schema: id, title, description, issue_type, status, priority, labels, dependencies, acceptance_criteria, assignee, close_reason, closed_at, comments, compaction_level, estimated_minutes, original_size, created_by, source_repo, source_repo_path, updated_at |
| `.beads/config.yaml`, `.beads/metadata.json`, `.beads/beads.db.fsqlite-migration-state` | Tracker config/state | `issue_prefix: frankensim`; schema-migration records |
| `vv-scorecard.md` / `vv-scorecard.json` (root) | Public V&V scorecard | Deterministic projection of seeded validation corpus + adversarial registry into per-(QoI, regime) cells; LOUD KNOWN GAPS; NO-DATA never laundered into zero |
| `capability-maturity.json`, `program-metrics.{md,json}`, `suite-receipt.json`, `suite-known-red.json`, `golden-couplings.json`, `trust-root-determinism-matrix.jsonl`, `candidate-portfolio-snapshot.json`, `moonshot-portfolio.json`, `tropical-critical-path.json`, `spine-*.json`, `vertical-capability-graph.json`, `doc-facts-inventory.json`, `instrument-claims.json`, `unsafe-capsules.json`, `constellation-trust-assessment.json`, `consolidation-review.json`, `schema-policy.json`, `runner-v2-acceptance-registry.json` (root) | Checked receipts/registries | Byte-checked generated artifacts; each has a `generate-*` / `check-*` xtask pair in the `check-all` gate set |
| `CHANGELOG_RESEARCH.md` | Research log | Dated research changelog (fetched, not deeply read) |

**Not found:** `docs/planning/` subdirectory [Absent]; root `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `CLAUDE.md`, `MUSE.md` [Absent]. The roadmap lives inside the master plan (§16.1) and in phase-tagged Beads epics.

---

## 2. Execution-readiness gates (verbatim)

**Gate 1 — The master plan is the constitution.** [Verified] `AGENTS.md`, "Project Truth Sources": *"This repository is currently plan-first. The authoritative design document is: `COMPREHENSIVE_PLAN_FOR_FRANKENSIM.md`… It defines the Decalogue, architecture, roadmap, crate atlas, Gauntlet verification program, performance targets, and flagship pipelines. This `AGENTS.md` is the operating contract for agents; the plan is the technical constitution."*

**Gate 2 — Done = Gauntlet state, not dates.** [Verified] Plan §13.3: *"Every crate ships `CONTRACT.md` (semantics, invariants, error models, determinism class) plus an executable conformance suite; 'done' is defined as conformance green on both ISAs, nothing else."* [Verified] Plan §16.1: *"each phase gate is a Gauntlet state, not a date. Nothing [M] gates anything [S]."* The Gauntlet tiers (§13.1/AGENTS.md): G0 property tests/algebraic laws · G1 manufactured solutions/convergence order · G2 canonical benchmarks · G3 metamorphic tests · G4 chaos/cancellation storms/leak-deadlock · G5 determinism audits. [Verified] `AGENTS.md`: *"When implementing a feature, name the relevant Gauntlet tier in the tests or docs. If a feature cannot yet satisfy the intended tier, document exactly what is proven and what is not."*

**Gate 3 — Contract before dependency.** [Verified] `docs/CONTRACT_TEMPLATE.md`: *"a crate must have a complete contract before it becomes a dependency target of other crates' real code (AGENTS.md)"* — and the skeleton's default is *"No-claim until stated"* / *"No-claim boundaries: Everything: this is a skeleton."*

**Gate 4 — Thirty-machine `check-all` + DSR.** [Verified] `docs/CI_GATES.md`: *"`cargo run -p xtask -- check-all` runs, and CI treats as one gate"* over ~30 checks (check-layers, check-deps, check-contracts, check-unsafe, check-goldens, check-claims, check-maturity, check-suite-receipt, check-vv-scorecard, check-program-metrics, check-constellation-drift, …). *"GitHub Actions is unavailable/throttled for this account, so FrankenSim uses DSR as the primary CI and release runner… The GitHub workflow files remain in the repo as manual executable specs… They are not automatic push/PR criteria."* [Verified] `AGENTS.md`: *"Do not wait on, poll, or cite GitHub Actions as required proof unless the user explicitly asks for that."*

**Gate 5 — Bead acceptance criteria.** [Verified] Bead bodies carry structured `MISSION` / `ACCEPTANCE` sections (35 MISSION, 215 ACCEPTANCE across 3,577 issues; e.g. `frankensim-0547u`: ACCEPTANCE requires the frame-only fixture to stop serializing exact `component_count=1` and requires exact counts to come only from a full global certificate). [Verified] `AGENTS.md` session protocol: start (read AGENTS.md → plan → README/CONTRACT/Beads issue → inspect tree → reserve files); end (run format/check/test lanes, report exactly what passed and what did not run, update Bead status, `br sync --flush-only`, release reservations, handoff notes).

**Gate 6 — Promotion as event + claim-integrity promotion gate.** [Verified] `docs/MATURITY_LEVELS.md`: *"Level increases are promotions and are treated as governed events… `check-maturity` compares the working registry against the last committed one and reports every promotion it finds. A promotion must be justified by evidence refs that resolve — the check refuses a promotion whose new level cites evidence that does not exist."* Bead `.2.3` (claim-integrity promotion gate) *"consumes exactly this promotion signal: an open `severity:default-path` claim-integrity defect whose crate scope overlaps a promoted capability blocks the promotion."*

**Gate 7 — Pre-commit front-run guards.** [Verified] `docs/CI_GATES.md`: `scripts/hooks/pre-commit` is *"pure shell — no cargo, no build — because a hook that builds the workspace is a hook that gets bypassed with `--no-verify` on its second use… It warns by default and lets the commit through; `FRANKENSIM_HOOK_STRICT=1` turns warnings into refusals."*

---

## 3. Honesty guardrails

**Claim-integrity defect class** [Verified] (`docs/CLAIM_INTEGRITY.md`, normative, owned by bead `frankensim-extreal-program-f85xj.2.1`): *"A claim-integrity defect exists when any public surface can assert a stronger epistemic state than its actual evidence establishes."* Evidence order (weaker→stronger): *"refusal/no-claim < Estimated < Validated (in its stated domain) < Verified."* [Maintainer claim] *"A false certificate is worse than an ordinary wrong answer."* Mechanics: five mechanical decision rules; nine recurring gap shapes drawn from confirmed instances (existence-read-as-exactness, truncation-read-as-agreement, real-arithmetic-theory-as-executable-bound, laundering, silent-pass/fail-open gates, forgeable certificates, domain escape, misused pinning authority, fail-open-on-unresolved); severity by **reachability** (`severity:default-path` P0 / `severity:gated` P1 / `severity:doc-only` P2; *"Severity escalates, never averages… fail closed"*); label taxonomy (`--type=bug` + `claim-integrity` + exactly one severity + `crate:<name>` scope; program beads exempt by type); enforcement by `check-claims` + `scripts/ci/claim_integrity_inventory.sh` which *"fails when an open `severity:default-path`/P0 defect has no owner, when a bead carries zero or multiple severity labels, or when the beads store cannot be read (fail closed — an inventory that cannot be read is not an empty inventory)."*

**No-promotion doctrine** [Verified]: *"no collection of numerical certificates may mint `Validated`… A derived `Validated` package claim needs an already-`Validated` parent and an independently admitted dataset anchor."*

**Auto-demotion rule** [Verified] (`docs/MATURITY_LEVELS.md`): *"**Demotions are always allowed** and are never blocked. Lowering a claim is how the registry stays honest… A system that makes it procedurally harder to weaken a claim than to strengthen one will accumulate false claims by construction."*

**Evidence-portfolio anti-laundering** [Verified] (`docs/EVIDENCE_PORTFOLIO_DOCTRINE.md`): 7 independent categorical axes, never averaged or max'd; claim-admission table exact in claim class/QoI/regime; 7 anti-laundering rules (e.g. *"Field monitoring alone cannot support `Validated`, regardless of dataset size"*). The falsifier for the doctrine itself: *"A proposed change is falsified if it allows any absent required coordinate to be satisfied by duplicating or composing other axes."*

**Receipt-bound evidence** [Verified]: `suite-receipt.json` has a *"negative control"* — `check-suite-receipt` fails on *"any `green`/`green-with-known-red` claim while unexpected red or build failures exist… a registered known-red test whose owner bead is CLOSED while the test still fails."* The V&V scorecard *"grants no authority: a cell with data reports outcome arithmetic; a cell without data reports NO-DATA, never zero… nothing it shows upgrades any corpus claim cap."* Program metrics: *"`NO-DATA` and a measured zero are different, and neither is laundered into the other."*

**Negative-evidence ledger as such** [Absent]: no file named or described as a "negative-evidence ledger" exists. Its functional equivalents are the claim-integrity inventory (`br list -l claim-integrity`), the scorecard's KNOWN GAPS list, and each moonshot declaration's registered falsifier observation.

**Claim matrix as such** [Partially present]: no single "claim matrix" file; the matrices are distributed — `docs/EVIDENCE_PORTFOLIO_DOCTRINE.md` (claim-class → required axes), `trust-root-determinism-matrix.jsonl`, `vv-scorecard` (QoI × regime cells).

---

## 4. Plan→agent execution

**Task graph:** [Verified] 3,577 Beads issues (statuses: 830 open · 1,186 deferred · 94 in_progress · 49 blocked · 1,416 closed · 2 tombstone; types: 1,847 task · 743 feature · 504 bug · 458 epic · 19 chore · 6 question); 3,211 of 3,577 carry `dependencies`. `bv --robot-plan` emits parallel execution tracks with unblocks lists; `check-tropical-path` refuses a CYCLE in the open-bead dependency graph. Issue bodies use MISSION/ACCEPTANCE structure; acceptance_criteria is a schema field.

**Phases & verification loops:** [Verified] Plan §16.1 phases P0–P6 each with a Gauntlet-state exit criterion (e.g. P0: *"G0+G4 green; GEMM/SpMV/FFT within 80% of §14.1 targets on both ISAs; deterministic mode bit-stable"*); phases deliberately overlap. Plan §16.2 ("Team-of-agents methodology [F]"): *"FrankenSim is sized for a swarm of AI coding agents with human architectural review… **one crate = one contract**… **IR as the integration language** — agents integrate against frozen IR semantics, never against each other's internals; **golden ledgers** — every merged feature lands with a replayable ledger of its acceptance run; **the Decalogue as tie-breaker** — disputes between agents resolve by principle number, not seniority… maximum context an agent needs is one crate + its contracts + the IR spec — deliberately smaller than a frontier context window."*

**Dialectical review:** [Absent] as two-models-against-each-other — no doc describes paired models arguing. The nearest equivalents: (a) [Verified] independent sibling reviews (`docs/SIBLING_REVIEW_ASUPERSYNC.md`, SREV-2026-07-A) with the standard *"review by an agent with no authorship history on the target, working against the target's own claimed contracts, with adversarial drills written from the contract alone before reading the implementation"* — and the honest caveat *"Genuinely external reviewer: Not met — I am another agent in the same fleet, under the same operator"*; (b) the Decalogue tie-breaker; (c) the July sweep's *"Six independent auditors worked disjoint surface groups"* instructed to write the strongest permitted inference from the CONTRACT *before* reading the implementation.

**Drift prevention:** [Verified] no branches/worktrees ever — `AGENTS.md` RULE 2: all work on `main`; *"Use Beads issue IDs and file reservations as the isolation mechanism, not git branches"*; Agent Mail reservations as advisory coordination; `check-constellation-drift` (dirty/retreated/diverged siblings refused; fast-forwards are `stale-lock`, visible not red); `check-goldens` (golden hash may not move without declared semantic reason); `check-source-manifest` (byte-bound source identity). [Verified] `docs/CONVENTIONS.md` "Working in the shared tree (learned the hard way, 2026-07-24/25)": commit-by-pathspec discipline.

**Scope control:** [Verified] the "process porn" rule is the most distinctive planning artifact: `AGENTS.md` RULE 0.1 — *"**Process is never the product unless the user explicitly asks for process work**… If incidental support work is becoming comparable to or larger than the requested implementation, stop before expanding it… Do not build a validator for a validator, a harness for a harness… Do not spawn an agent swarm for a narrow task."* Plus the `f85xj.16.3` **displacement rule**: off-critical-path work needs justification (*"either a named trust-risk reduction or capped research with a falsifier, budget, and no claim on critical-path capacity"*).

---

## 5. State-of-the-art coverage

[Partially present]: no `docs/research/` directory [Absent]; no standing literature-scan procedure found [Absent]. SOTA enters through: (a) [Verified] the plan's Appendix E "Reading list, keyed to the bets" (Arnold–Falk–Winther, Shewchuk, Griewank–Walther, etc.); (b) [Verified] per-subject plans recording source provenance, e.g. `MATERIAL_REALITY_IMPLEMENTATION_PLAN.md`: *"Source investigation began at `1be30297…` on shared `main`"* and disclaiming new capability claims; (c) [Verified] the adversarial registry + seeded validation corpus behind the V&V scorecard (34 datasets: A=23 B=7 C=4 D=0 E=0; adversarial challenges executed 0/8); (d) [Verified] `constellation.lock` cross-repo pinning with the trust-cone assessment and July 2026 incident tabletop as suite-level SOTA-risk practice; (e) the EXTREAL program's competitor-comparison mechanism: the EXTREAL audit and `NEW_DOMAINS_AUDIT_SNAPSHOT_*.json`. [Inference] Literature review is episodic (plan reading list + per-plan investigation notes), not a standing mechanism with cadence.

---

## 6. Anti-satisficing

[Verified — the densest anti-satisficing apparatus observed in the suite]:
- **Red-team audit of itself:** `docs/REALITY_CHECK_2026-09-01.md` — a 100 KB adversarial self-assessment ("The September 1 claim that no user-visible cooling answer exists is obsolete… The central thesis… has never executed once on a production PDE"), with a truth-defects table (false closes, fabricated evidence on disk, README-vs-code contradictions), a bridge plan (Move 0 = "Truth (days, not weeks)"), and dated-history preservation ("This refresh supersedes… it preserves that assessment as dated history, not as current evidence").
- **Falsifier culture:** moonshot lanes each name *"owner, falsifier observation and decision rule, effort cap, calendar deadline, next quarterly falsifier review, evidence required at that review"* (`docs/CONVENTIONS.md`); the v1 portfolio held 6 active of 508 tagged, with `completed` / `falsified` / `shelved-with-state` terminal dispositions and `check-moonshots` mechanically rejecting moonshot reachability into the product path. *"An absent or inconclusive test does not count as survival and does not widen the budget."*
- **Gate drills / seeded faults:** [Verified] `ci-self-test.yml` = *"meta-tests: injected failures demonstrably turn the gates red"*; claim-integrity `.2.4` *"proves that gate fails closed under seeded faults"*; the claim-integrity sweep ran *"a recall check against the known-answer set"* of 8 retro-tagged instances.
- **Independent auditors:** the July sweep's six disjoint auditors; the known-answer table; sweeps explicitly record *"the surfaces it left unaudited, and an honest recall check"* — unaudited ≠ clean.
- **Anti-laundering composition rules** (§3) and *"weakest-wins"* semantics block satisficing by aggregation.
- **Weekly triage recipe** with retained receipts: *"Record the command, UTC timestamp, data hash, result shape, and counts from the weekly run; do not silently replace prior receipts."*

---

## 7. Explicit absences

1. `docs/planning/` subdirectory — planning is a flat `docs/` of doctrine files; no dedicated planning tree. [Absent]
2. Root `ROADMAP.md` / `BEADS.md` / `TODO.md` / `PLAN.md` / `CLAUDE.md` / `MUSE.md` — all absent; roadmap = plan §16.1 + Beads epics. [Absent]
3. Two-model dialectical review — no paired-models-arguing mechanism documented. Nearest: independent-auditor sweeps + sibling adversarial drills with stated independence caveats. [Absent]
4. `docs/research/` standing literature-competitor scan — SOTA is episodic (reading list, per-plan investigation notes), no cadence. [Absent]
5. A file literally named "negative-evidence ledger" or "claim matrix" — functions distributed across claim-integrity inventory, scorecard KNOWN GAPS, falsifier registers. [Absent]
6. "Definition of done" document — the function lives in plan §13.3 + Gauntlet + maturity levels, not a standalone DoD file. [Absent]
7. Never-compact policy — bead schema carries `compaction_level` (observed 0) but no doc states a no-compaction rule for frankensim sessions. [Absent]

---

## 8. Maturity verdict

**Mature** — with one large caveat. frankensim has the most complete planning apparatus in the FrankenSuite: a 119 KB technical constitution with Gauntlet-state phase gates; a normative, mechanically enforced claim-integrity defect class (severity by reachability, fail-closed inventory, promotion gate); evidence-portfolio anti-laundering doctrine; auto-demotion-always-allowed maturity rules; ~30 machine-checked gates including seeded-fault meta-tests; falsifier-governed moonshot WIP with displacement rules; 3,577 dependency-linked Beads with MISSION/ACCEPTANCE structure; weekly triage recipes with retained receipts; and a standing red-team self-audit habit that publicly records its own false closes and fabricated evidence. The distinctive move is **honesty as mechanism design**: gates engineered to fail closed, inventories that refuse to be read as empty, demotions procedurally easier than promotions, and receipts that cannot launder NO-DATA into authority.

The caveat, from the maintainer's own September audit [Maintainer claim]: *"The open beads are mostly about the wrong layer… 1,009 leapfrog + 66 machine-flagship + 79 theorem-lane + 99 Euler-lab beads… The graph cannot dispense work. 83 % blocked, 2 ready, 303 open epics, 368 open P0… Truth decay. False closes and an unbacked L3 mean 'closed' and 'L3' are no longer trustworthy inputs to planning."* [Inference] The planning *doctrine* is mature; the planning *state* is debt-laden — the machinery for planning at scale is fully built, but the tracker it governs is overloaded, which is precisely why the "no process porn" rule (RULE 0.1) was written: the suite's own lesson, recorded in-repo, that elaborate assurance machinery can become a substitute for delivery.

---

*Scratch clone at `~/workspace/franken-research/synthesis/planning/_work-frankensim/` (sparse, planning paths); key fetched originals in `/tmp/plan-frankensim/` (`COMPREHENSIVE_PLAN_FOR_FRANKENSIM.md`, `vv-scorecard.md`).*
