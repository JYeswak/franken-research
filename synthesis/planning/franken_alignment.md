# Planning methodology: franken_alignment

**Repo:** https://github.com/Dicklesworthstone/franken_alignment (depth-1 clone analyzed 2026-09-22)
**Question answered:** HOW does Jeffrey Emanuel PLAN in this repo — not what the code does.
**Method:** cloned to `/tmp/plan-franken_alignment`; read in full: `AGENTS.md`, `registry/README.md`, `docs/FOUNDING_IDEAS.md` (head), `docs/ARCHITECTURE_DECISIONS.md` (head), `docs/EVALUATION_PLAN.md` (head), `docs/RELATED_WORK.md` (head), `docs/REALITY_CHECK_AND_BRIDGE_PLAN.md` (head), `docs/REVISION_0_2.md`/`REVISION_0_3.md` (heads), `docs/AGENT_GUIDE.md` (head), `IMPLEMENTATION_STATUS.md` (head), and plan §§2, 19, 20, 21 of the 1,761-line comprehensive plan; inspected `.beads/issues.jsonl` schema + stats with jq, plus `registry/` JSON heads.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKENALIGNMENT.md` | **The Plan** — the normative design document (root, ~252 KB, 25 sections) | Thesis → constitution/claim discipline (§2) → 8 bets → architecture → verification/adversarial evaluation (§19) → research program + falsification criteria (§20) → delivery sequence + convergence gates G0–G6 (§21) → operations → rejected alternatives (§23) → what success would establish (§24). |
| `AGENTS.md` | **Agent operating instructions** for anyone (or any agent) touching the repo | Mandatory pre-read list, constitution (Rust 2024, `#![forbid(unsafe)]`, closed dependency universe), work-packet rules, local verification, claim/benchmark discipline, legibility, and the swarm-execution + honest-credit protocol. |
| `docs/AGENT_GUIDE.md` | **Operator playbook** for the prospective system | `fa doctor` first-ten-minutes runbook and P1–P6 playbooks as registered verbs; explicitly labeled as describing a prospective surface, not existing code. |
| `docs/FOUNDING_IDEAS.md` | **Normative traceability spine** | Concordance of the two founding essays (2024 alignment, 2025 introspection) to every mechanism, invariant, hypothesis, and packet; 38 ideas + 9 syntheses + 67 engineering additions (per `registry/README.md`). Machine form: `registry/founding_concordance.json`. |
| `docs/ARCHITECTURE_DECISIONS.md` | **ADRs (24)** | ADR-001 through ADR-024, each with decision, alternatives considered, and a *reopening condition* ("open to improvement through explicit counterexamples… not silent implementation drift"). Includes an amendment protocol. |
| `docs/EVALUATION_PLAN.md` | **Evaluation-layer contract** | Four evaluation layers A–D (distinct from the nine architectural layers), mandatory negative campaigns, a baseline ladder, and a reporting contract. |
| `docs/RESEARCH_AGENDA.md` | **Experiment cards** for H1–H21 | Described in plan §20 as "scientific workstreams, not guaranteed milestones." |
| `docs/RELATED_WORK.md` | **Primary-source comparison** | Chronology-first literature placement with an explicit "verified-source cutoff: September 6, 2026"; states it is a selective comparison, not an exhaustive survey, and that full-paper experiments were not reproduced. |
| `docs/REALITY_CHECK_AND_BRIDGE_PLAN.md` | **Checkpoint reality report** | Dated 2026-09-08 checkpoint: what is PARTIAL / NOT_STARTED / UNPROVEN vs. a 19-row vision checklist; diagnoses an incomplete task graph and defines the bridge execution order. Revised in place. |
| `docs/REVISION_0_2.md`, `docs/REVISION_0_3.md` | **Plan revision history as documents** | Each revision names "what was wrong with" the prior one (0.2: wrong center of gravity; 0.3: restores founding essays as spine), deliberate rejections, and new packets/invariants. |
| `IMPLEMENTATION_STATUS.md` | **Execution-evidence log** | Chronological entries binding work to RCH gate runs with exact test counts, source hashes, and deliberately-declared limitations ("Historical qualification evidence below does not validate this addition"). |
| `registry/roadmap.json` | **Machine-readable packet authority** | 143 work packets; schema: `acceptance, depends_on, estimated_scope, gate, id, invariants, owner_role, result_artifacts, status, title`. AGENTS.md: "the roadmap remains the packet-level authority." |
| `registry/invariants.json` | **Invariant spine** | 40 invariants (FA-INV-001…040) each with activation domain, threat assumptions, dependencies, enforcement owner, negative tests, and a *nonwaivable* status. |
| `registry/founding_concordance.json` | **Machine-checked traceability** | Normative map essay→mechanism/invariant/hypothesis/packet; coverage is *fail-closed* (unmatched plan headings, invariants, hypotheses, or packets fail the check). Packet FA-103 keeps the concordance complete. |
| `registry/experiments.json` | **Preregistration ledger** | Per hypothesis: frozen-protocol digest, freeze date, bound identities, result digest. Currently every row is `status: "not_preregistered"` (unpopulated mechanism, enforced rule). |
| `registry/claims.json` | **Claim registry** | Typed claims (invariant/proof/bounded_model/statistical/benchmark/slo/hypothesis) with scope, assumptions, invalidation conditions, and `promotion_requires`. |
| `registry/release_readiness.json` | **Release gate state** | `"production_release_enabled": false` with stated reason; records the single 2026-09-06 local quality-gate execution. |
| `registry/{slo,operation_costs,dependency_policy,sources,foundation_audit,system_map,vocabulary}.json` | **Satellite registries** | Cost SLO, dependency admission policy, source provenance pins, foundation audit, nine-layer system map, verb vocabulary. |
| `registry/README.md` | **Registry operating manual** | Defines the registries as "versioned planning inputs, not machine-certified production authority"; documents the consistency contracts (prose-check, system-map check) and the fail-closed concordance rules. |
| `.beads/issues.jsonl` | **Granular task graph** | 337 beads (41 open epics + 263 open tasks + 28 closed + 3 in progress + 1 blocked + 1 tombstone). Schema: id, title, description, status, priority, issue_type, labels, dependencies, blocked_by, created/updated/closed fields, close_reason, comments, notes. Bead bodies carry "Founding root" + "Plan §" trace links (232 of 337 carry a founding root; 264 reference "Plan §"). Managed *only* with the `br` CLI; `br` never runs git — the human commits `.beads/` themselves. |
| `artifacts/execution/` | **Receipt-bound evidence** | Dated gate receipts (e.g. `2026-09-08-range-witness-receipt.json`), logs, source-hash files; `SHA256SUMS`, `VALIDATION_REPORT.md`. Receipts bind source hashes, toolchain, and job IDs — evidence is revision-bound, not prose-bound. |
| `docs/SYSTEM_MAP.md`, `docs/INTEGRATION_CONTRACTS.md`, `docs/DEPENDENCY_CONSTITUTION.md`, `docs/OPERATIONS_AND_PRIVACY.md` | **Support contracts** | Layer tower map; cross-layer integration contracts; the concrete dependency blockers; operations/privacy contract. |
| 240+ remaining `docs/*.md` | **Per-mechanism reference docs** | Bounded reference docs (one per subsystem/verb), machine-scanned by the system-map checker. |

---

## 2. Execution-readiness gates — what a plan must pass before agents are set free

Gates are convergence gates G0–G6 in plan §21, plus the constitutional pre-read. Verbatim:

- **Constitutional pre-read (AGENTS.md):** "Read the complete main plan, README, implementation status, the founding-ideas concordance (docs/FOUNDING_IDEAS.md), the system map (docs/SYSTEM_MAP.md) and relevant source audit before changing semantics… This is a design-first project, not a license to replace hard contracts with easier demos."
- **G0. Contract convergence (plan §21):** "Freeze the threat model, effect vocabulary, forty-invariant spine, claim classes, wire-format versioning rules, action/permit lifecycle, replay grades, and the initial single-authority storage profile… The reference model and registry checks must run. **This draft starts G0; it does not claim the whole gate is complete.**" [Verified]
- **G1–G6** stage increasingly risky capability: one real brokered effect (G1), end-to-end evidence + helper congress (G2), white-box capture/replay baselines (G3), learned compression/causal experiments (G4), fleet composition/operations (G5), qualified deployment + research exchange (G6). Ordering law: "Contracts precede production gate code; durable gate semantics precede live helper-controlled admission; real capture and lossless replay precede learned restart claims; strong baselines precede expensive research mechanisms; exact delegation precedes fleet authority claims." [Verified]
- **Packet completion rule (plan §21):** "A packet is not complete because files or stubs exist. **It is complete when the specified behavior and negative cases are demonstrated and the status ledger links their artifacts.**" [Verified]
- **Execution gate (AGENTS.md):** "A source stub or document update does not satisfy an execution gate." / "Use `cargo run --locked -p xtask -- check`. The driver checks formatting, compiles, runs Clippy and runs tests." [Verified]
- **No hosted CI as authority:** "No required check is delegated to GitHub-hosted Actions. Cargo gates run on the operator's own machines… GitHub is an optional source/distribution surface, not the authority for whether a gate ran." [Verified]
- **Historical honesty preserved in prose (registry/README.md):** "No missing checker is a passed checker. The reference tests were unexecuted in the revision 0.2 preparation history… never erase that historical fact by changing prose alone." [Verified]
- **Concordance gate (docs/FOUNDING_IDEAS.md normative rule, quoted in AGENTS.md):** "A change to plan semantics that leaves the concordance stale is incomplete." [Verified]

---

## 3. Honesty guardrails — negative evidence, claim typing, demotion

- **Typed claims (plan §2.4):** "Every public claim is one of `invariant`, `proof`, `bounded_model`, `statistical`, `benchmark`, `slo`, or `hypothesis`. It names scope, assumptions, proof/checker or measurement, and invalidation conditions. An algorithm's instrumentation counter is not a complexity proof. A simulation campaign is not exhaustive beyond its stated model… No new production feature activates without its exact boundary/negative tests and source/format/epoch compatibility." [Verified]
- **Claim strengthening is forbidden (invariant FA-INV-019):** "Claim class and dataset lineage cannot be silently strengthened." [Verified]
- **Preregistration ledger (plan §20):** "Every hypothesis above has a row in `registry/experiments.json` holding the digest of its frozen protocol, the date the protocol was frozen, the identities it binds, and the digest of the result artifact when one exists. **A result whose protocol digest was recorded after data collection began is labeled exploratory, and the claim registry (§2.4) refuses to promote it.** The ledger is what makes 'we preregistered' a checkable statement rather than a sentence in a paper." [Verified] — [Inference] The ledger is currently fully `not_preregistered` (all 21 rows), so the guardrail is *installed and enforced as a rule* but the preregistration itself has not yet happened.
- **Negative evidence is structural:** invariant FA-INV-007 "Every advertised decision closure resolves or reports its exact gap"; plan §7.2 "An observation says what it did not observe"; §5.3 "Reuse requires negative evidence too"; EVALUATION_PLAN lists ten mandatory negative campaigns (envelope/canonicalization, authority ordering, accounting, capture/codec, helper congress, replay, persistence, privacy, resource pressure, fleet); beads include dedicated negative campaigns (e.g. "Negative campaign: floor skipping, budget storms, authority escalation", address/resolver test campaigns "with logging"). [Verified]
- **Automatic demotion exists for the *governed product* (plan §9.8/9.9):** "**Demotion is automatic and cheap**: any consequence at or above `NarrowAuthority` (§9.8), any confirmed violation, any identity incident… or any evidence-coverage loss lowers the grade for the affected family immediately… **Promotion is governed and expensive**: it requires a signed evaluator report…, a registered minimum dwell time at the current grade, and an authorized governance transition." [Verified] — [Inference] This is an in-product actor/helper governance mechanism, not a plan-claim lifecycle; the closest planning-process analogs are the prereg ledger's forced "exploratory" label and FA-INV-019's anti-strengthening rule. No auto-demotion *of claims* as a planning mechanism was found — the claim registry refuses promotion rather than demoting. [Absent: claim demotion protocol]
- **Anti-credit rules (AGENTS.md):** "Working capability is the objective… Process output receives no capability credit." / "A false close is reopened with an incident comment." / "Never self-certify or close to unblock peers." / Named failure modes to call out: "gate self-weakening, proof-class inflation, dependency smuggling, refusal farming, follow-up laundering and commit pumping." [Verified]
- **Revision discipline:** "The design can change radically while its honesty remains stable: **no evidence becomes stronger merely because a document was edited**." (docs/ARCHITECTURE_DECISIONS.md) [Verified]

---

## 4. Plan → agent execution

- **Two-tier task graph:** roadmap packets are the authority (143 packets with `depends_on`, `acceptance`, `result_artifacts`, `gate` fields); the *granular* task graph lives in `.beads/` (337 beads), each bead linking its roadmap packet, plan sections, and founding ideas. "The granular task graph lives in `.beads/` and is managed only with the `br` CLI (`br ready --json`, `br update <id> --status in_progress`, `br close <id> --reason ...`, `br dep add <child> <parent>`) and triaged with `bv --robot-*` flags; never run bare `bv`." [Verified]
- **Swarm protocol (AGENTS.md §"Swarm execution and honest credit"):** parallel code-first waves + **one central batch verifier**. Workers atomically claim one bead (`br update <id> --claim --actor <name>`), reserve narrow paths via Agent Mail, and may do at most a syntax check — "Workers do not run test suites or full builds during a code wave. All compilation uses `RCH_REQUIRE_REMOTE=1 rch exec -- ...`; no local fallback." The verifier runs the gate "through RCH against frozen source, retains every attempt outside the frozen root, examines test/gate changes independently, and **alone closes fully satisfied beads with exact revision-bound evidence**." [Verified]
- **Drift prevention:** "Preserve peer and pre-existing staged/unstaged bytes; never reset, stash, unstage, or commit another owner's changes. Shared manifests, registries and status documents have one designated integration owner." / "Commit only owned paths, report the exact revision and acceptance-to-test mapping, and leave work open pending verification." / Each dispatch must name "a positive observable, a causal negative test and what green does not prove." / "Every claimed metric fixes its denominator and countermetric in advance; failures and retries remain recorded, and same-origin evidence counts once." [Verified]
- **Verification triggers:** "Verification triggers on a critical prerequisite becoming ready, bounded pending debt, scope growth or elapsed risk, not commit count alone." [Verified]
- **Reality loop:** `docs/REALITY_CHECK_AND_BRIDGE_PLAN.md` is a self-audit dated 2026-09-08 that (a) scored the build against a 19-row vision checklist with PARTIAL/NOT_STARTED/UNPROVEN statuses, (b) diagnosed the original task graph as incomplete ("Completing the original existing beads alone would not supply the missing foundational implementations or their dependency edges"), and (c) defined a bridge execution order. It documents an actual observed swarm (started 2026-09-07 ~19:56 UTC) including an observer-timing failure ("long Claude turns/stop hooks delayed ticks… Root manually tended the swarm. This is not evidence of a hard four-minute scheduling guarantee."). [Verified]
- **Receipt-bound evidence:** receipts bind source/build inputs, toolchain identity, job IDs, and test counts; IMPLEMENTATION_STATUS entries routinely declare what the evidence does *not* cover (e.g. "No adapter authentication, database integration, physical planner, runtime admission, production cache/dispatch or release is qualified by this batch"; "They are not a distribution [of durations]"; "the revision 0.2 preparation environment did not compile this Rust workspace; never erase that historical fact by changing prose alone"). [Verified]
- **Dialectical review (two models against each other):** [Absent]. No two-model grading, grader-vs-grader, or cross-model dialectic appears in the repo docs. The closest are: adaptive red teams (§19.5), the "independent evaluation owner" and "final unseen campaign," and the single central batch verifier in the swarm protocol. [Inference] Emanuel does the dialectic *inside the plan itself* — the revision docs stage the old plan against its own corrections ("what was wrong with revision 0.2"), and §23 records deliberately rejected alternatives.

---

## 5. State-of-the-art coverage

- **Foundation audit + reuse contracts (plan §5):** "Reuse is a contract, not a dependency list"; foundation reuse requires its own unsafe/build-script audit and *negative evidence* (§5.3); `registry/foundation_audit.json` pins the code review; `registry/sources.json` pins founding/earlier-research provenance with head-commit pins. [Verified]
- **Literature as chronology (docs/RELATED_WORK.md):** "This is a selective primary-source comparison, not an exhaustive survey. Unless otherwise noted, the retrieved arXiv abstracts and metadata were reviewed; full-paper experiments were not reproduced." Founding-essay precedence is enforced as a norm: "Do not describe an essay idea as borrowed from later literature; docs/RELATED_WORK.md records the chronology." [Verified]
- **Research program as falsifiable science (plan §20, docs/RESEARCH_AGENDA.md):** 21 hypotheses H1–H21, each with an explicit named failure condition ("The hypothesis fails if…"). The plan's rule: "Publish failures as first-class results… The repository should publish the failed mechanism, its evaluation domain, and a clean reproducer where disclosure is safe. **Scientific usefulness is not measured by how many original guesses survive unchanged.**" [Verified]
- **Alternatives deliberately rejected (plan §23):** the plan names what it chose *against* rather than merely listing competitors. [Verified]

---

## 6. Anti-satisficing

- **No substitute architectures (plan §2.6):** "Work is sequenced by dependency, not by weakening final semantics… No random embeddings called semantic search, approximate summaries called exact replay, or majority votes called independent truth. No line-count or test-count target substitutes for a real end-to-end evidence path." [Verified]
- **Ablation requirement (§19.6):** "A claimed improvement must survive ablation… No 'quantum leap' claim is released without the data that distinguishes the composition from its parts." [Verified]
- **Red teams (§19.5):** "Do not restrict evaluation to prompts the monitor designer thought to write. Hold out attack mechanisms, not just strings. Reserve an independent evaluation owner and a final unseen campaign. Record attacker compute and query budgets, selected attempts, seed families, and stopping rules." [Verified]
- **Causal (planted-defect) testing:** implementation entries record planted defects that must fail after controls — e.g. "Two planted defects fail after controls: ignoring an interior empty-range insertion and ignoring same-version member bytes" and "Three separately executed mutations fail after valid controls" (IMPLEMENTATION_STATUS.md). [Verified]
- **Reporting contract (EVALUATION_PLAN):** "Report median and tail latency, uncertainty appropriate to the design, and all unresolved/missing cases. **Never silently remove timeouts or held actions from the denominator.**" [Verified]
- **Denominator discipline (AGENTS.md):** "Each dispatch names a positive observable, a causal negative test and **what green does not prove**." [Verified]
- **Baseline ladder (EVALUATION_PLAN):** begin with exact allowlist broker, add a strong text/tool monitor, then ensembles, then activation features — one at a time, "All comparisons use the same actor capability, effects, attacker information, task set, and budget accounting." [Verified]

---

## 7. Explicit absences (suite-pattern items NOT found in this repo)

| Suite-pattern item | Status in franken_alignment |
|---|---|
| `docs/planning/**` directory | **[Absent]** — planning lives at root (`COMPREHENSIVE_PLAN_*.md`) and in `registry/`; the flat `docs/` holds ~258 technical reference docs, not a planning subtree. |
| Root `ROADMAP.md` / `BEADS.md` / `TODO.md` / `PLAN.md` | **[Absent]** — roadmap is `registry/roadmap.json`; beads have no BEADS.md. |
| `CLAUDE.md` / `MUSE.md` / `.muse/` | **[Absent]** — only `AGENTS.md` (agent ops) + `docs/AGENT_GUIDE.md` (operator playbooks). |
| `docs/research/**` | **[Absent]** — research is `docs/RESEARCH_AGENDA.md` + `registry/experiments.json` + plan §20. |
| Definition-of-done doc by that name | **[Absent]** — function distributed across G0–G6, packet `acceptance` fields, "A packet is not complete because files or stubs exist…", and AGENTS.md execution-gate rules. |
| Standalone claim matrix / negative-evidence ledger | **[Absent as files]** — function distributed across `registry/claims.json`, invariant negative tests, EVALUATION_PLAN's negative campaigns, and the prereg ledger. |
| Auto-demotion of *claims* | **[Absent]** — the claim registry *refuses promotion* of post-hoc preregistration instead; automatic demotion exists only for in-product actor/helper grades (§9.9). |
| Two-model dialectical grading loop | **[Absent]** — verification is a single central batch verifier; no grader-vs-grader mechanism anywhere in the docs. |
| "Never let sessions compact" rule | **[Absent]** — no session/compaction policy found in repo docs. |
| Populated preregistration | **[Absent in effect]** — `registry/experiments.json` exists with all 21 hypotheses as rows, but every row is `"status": "not_preregistered"` with null digests: the mechanism is defined and enforced, the preregistration itself hasn't happened. |

---

## 8. Maturity verdict: **Mature**

franken_alignment's planning apparatus is the most mature encountered in the FrankenSuite pattern: a single 1,761-line comprehensive plan with typed claim discipline; 143 dependency-ordered packets as machine-readable JSON; a 40-invariant registry with nonwaivable statuses and negative tests; a *fail-closed machine-checked founding-ideas concordance* that forces every plan heading, invariant, hypothesis, and packet to trace to the two founding essays or be labeled an engineering addition (checked by `xtask prose-check`); 24 ADRs with explicit reopening conditions; a 10-campaign negative-evaluation contract; 21 hypotheses with named failure conditions plus an (unpopulated but enforced) preregistration ledger; 337 trace-linked beads; receipt-bound, revision-stamped execution evidence; and a self-audit bridge plan that publicly diagnoses the prior task graph as incomplete and repairs it. The only thin spot is the preregistration ledger (installed, all rows empty). Absences are principled substitutions, not gaps: the dialectic happens *in the plan's revision documents* rather than in a two-model grader loop, and demotion is replaced by forced exploratory labeling.
