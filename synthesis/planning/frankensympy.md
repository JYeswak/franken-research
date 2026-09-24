# Planning-methodology profile: frankensympy

**Repo:** https://github.com/Dicklesworthstone/frankensympy
**Commit pinned for analysis:** `97ad801` ("chore(beads): TrigOnly + stale site-packages record on surface-nvv", HEAD)
**Claim tiering used below:** [Verified] = read directly in a repo file; [Maintainer claim] = his prose, quoted; [Inference] = my read across artifacts; [Absent] = not found after inventory.

**TL;DR:** frankensympy has the most machine-enforced planning discipline found in the suite so far: a claims linter wired into CI that rejects prose that outruns evidence, a 27-clause normative Constitution, machine-readable workstream/claim/evidence registries with fail-closed policies, an adversarial "independent gate" review track recorded in Beads, and mutation-battery testing of the gate machinery itself. Planning is treated as executable law, not documentation.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/CONSTITUTION.md` | Normative law | 27-article constitution; "non-negotiable rules," definition-of-success, amendment procedure, forbidden-shortcut schedule |
| `COMPREHENSIVE_PLAN_FOR_FRANKENSYMPY.md` | Master plan (1527 lines) | Architecture + implementation plan; §0 "Current reality" honestly separates target from implementation |
| `AGENTS.md` | Agent operating bible (565 lines) | Binding instructions for coding/research agents: work-graph + Beads discipline, 22 discipline sections |
| `docs/WORKSTREAM_GRAPH.md` | Execution graph (1002 lines) | 24 workstreams (WS00–WS23), milestone map M0–M8, Beads conversion template, graph-change protocol |
| `docs/FIRST_IMPLEMENTATION_CAMPAIGN.md` | First campaign (659 lines) | "Certified Jacobian Pipeline": staged C0–C11 execution plan with per-stage gates, hero workload, rollback policy |
| `docs/CLAIM_AND_EVIDENCE_LATTICE.md` | Honesty contract | Claim classes, evidence classes, non-transitivity, typed authority, contradiction/downgrade/wording rules |
| `docs/CROSS_CUTTING_OBLIGATIONS.md` | Composition law | Cross-cutting obligation DAG; gate ownership separation; artifact closure; change-impact cones |
| `docs/AGENT_NATIVE_PROTOCOL.md` | Agent execution contract (491 lines) | Work packets, Beads conversion gate (§14), branch/review/merge, counterexample bundles, deterministic replay |
| `docs/RISK_REGISTER_AND_RESEARCH_AGENDA.md` | Risk register (1140 lines) | Severity/likelihood framework, ~10+ named risks with triggers/mitigations/closure evidence, research agenda A–L, review cadence |
| `docs/SOURCE_PROJECT_AUDIT.md` | Source-of-truth audit | Pinned revisions (commit SHAs) of asupersync, FrankenSQLite, FrankenGraphDB, FrankenNumPy, FrankenSciPy, SymPy 1.14.0; adopt/adapt/reject per mechanism |
| `docs/DONOR_DEEP_DIVE_*.md` (5) | Donor research | Per-donor deep dives: asupersync, FrankenLean, FrankenSQLite, graph stack, numeric stack |
| `registries/claims.toml` | Machine-readable claims | 27 claims; `status_semantics`; fail-closed policies (unknown claims, placeholder bans) |
| `registries/workstreams.toml` | Machine-readable DAG | 24 workstreams; milestones; topological constraints; policy booleans (`closure_requires_gate_bundle = true`, prose closure forbidden) |
| `registries/*.toml` (18 more) | Machine-readable joins | compatibility, evidence classes, verifier, monitor, release gates, algorithm portfolios, donors, etc. |
| `tools/validate_planning.py` | Planning linter (849 lines) | CI-enforced: required artifacts, acyclic DAG, claim/evidence/workstream policy checks, **negative-fixture self-test** (`--self-test`) |
| `tools/gate_review_battery.py` | Adversarial battery (308 lines) | Mutation-tests the gate-receipt validator itself: 18+ attacker cases (M1–M18), re-seals BLAKE3 commitments |
| `quality_gates.toml` | Honesty budget registry | Future quality thresholds **explicitly labeled non-enforced planning targets**; linter forces `enforced = false` while `registry_status = "planning"` |
| `.beads/issues.jsonl` | Task tracker (116 issues) | Executable work graph; statuses: 81 closed / 26 open / 8 in_progress / 1 blocked; labels `reality-check`, `independent-gate`, `WSnn`, `gate-integrity` |
| `artifacts/audit/` | Evidence vault | `*_independent_review.md` gate reviews, conformity/corpus/corpus inventories, registry audit JSONs |
| `ARCHITECTURE_INDEX.md` | Doc map | Index of architecture documents |
| `tests/cli_protocol_gate.rs` | Gate test | CLI protocol gate test |
| `xtask/` | Task runner | Interface contracts for `cargo xtask gate ...` (many not yet implemented — stated as "target interfaces," AGENTS.md §20) |

[Verified] all of the above from direct file reads and directory listings at commit 97ad801.

---

## 2. Execution-readiness gates (what must a plan pass before agents are set free?)

The Beads conversion gate — the boundary between "plan" and "executable work" — is defined twice, in `docs/AGENT_NATIVE_PROTOCOL.md` §14 and `docs/WORKSTREAM_GRAPH.md` §32, with near-identical checklists:

**§14 conversion gate (verbatim):**
> "An architectural workstream can become executable Beads work only when it has: 1. one bounded deliverable; 2. explicit dependencies and no hidden cyclic prerequisite; 3. exact files/crates or discovery task; 4. objective acceptance command(s); 5. unit, differential, metamorphic, adversarial, and benchmark obligations as applicable; 6. expected discrepancy and claim-registry updates; 7. forbidden shortcuts; 8. rollback/failure semantics; 9. evidence artifacts required for closure; 10. a named owner for the verifier/gate, not only the generator."

**§32 conversion template (verbatim):** each workstream is decomposed into Beads "only after every task record includes: Task ID and workstream / Objective / non-goals / Exact dependency IDs / Owned files/crates/registries / Inputs and immutable universe / Implementation deliverable / Independent verifier/gate owner / Acceptance commands / Required unit/property/differential/metamorphic/adversarial tests / Benchmark obligations and live incumbent / Discrepancy/claim-registry effects / Cancellation/resource/failure behavior / Forbidden shortcuts / Artifacts proving closure." Plus: "A broad task such as 'implement integration' is invalid."

**AGENTS.md §12** repeats the gate and adds the hard rule:
> "Beads tasks may be created only after the conversion gate in [`docs/WORKSTREAM_GRAPH.md`](docs/WORKSTREAM_GRAPH.md)."
> "Do not close a task because code was committed; close it when the named gate artifacts pass."

**Campaign gates (execution-readiness for the first implementation):** the C0 stage of `docs/FIRST_IMPLEMENTATION_CAMPAIGN.md` freezes planning inputs behind an explicit gate:
> "all registries parse and the work graph is acyclic; every campaign claim is `planned`; source pins resolve; no implementation status inferred from this document; architecture review finds no shell/kernel identity collapse."

Each of stages C1–C11 has its own gate (e.g., C1: "deliberately broken candidate shell produces expected discrepancies"; C4: "side-condition and branch mutants rejected"; C11: 10 closure conditions that "must hold on one commit"). [Verified]

**Machine enforcement:** `tools/validate_planning.py` is run in CI (`.github/workflows/ci.yml`: `run: python tools/validate_planning.py` and `run: python tools/validate_planning.py --self-test`). It errors on missing required artifacts, broken internal links, duplicate/unknown IDs, cyclic dependencies, placeholder values in certified records, and policy weakenings — e.g.:
> "workstream policy `closure_by_prose_assertion_allowed` must remain False" (error: `"workstream policy must forbid closure by prose assertion"`); claims policy requires `"unknown_claim_fails_closed"`, `"retired_claim_ids_must_remain"`, etc., all `= true`. [Verified]

---

## 3. Honesty guardrails (negative evidence / claim matrix / demotion)

**Claim matrix: present, machine-readable.** `registries/claims.toml` defines `status_semantics`: `planned` ("Target architecture or capability with no implementation claim"), `documented`, `implemented_uncertified` ("Reachable implementation exists, but required claim gates are incomplete"), `validated`, `certified` ("All immutable claim/profile release gates pass on the same commit"), `blocked`, `retired`. 27 claims: 1 documented / 15 implemented_uncertified / 11 planned / 0 validated / 0 certified. `Cargo.toml`'s package description must explicitly say "pre-certification," and `validate_package_status()` errors if `src/lib.rs`'s machine-readable status is not `implemented_uncertified`. [Verified]

**Negative-evidence / contradiction machinery: present.** `docs/CLAIM_AND_EVIDENCE_LATTICE.md` §7: "New contradictory evidence does not overwrite old artifacts. It creates a contradiction event and may: quarantine a route; revoke a release/profile claim; invalidate a projection or benchmark; require re-verification." §8: "A requested evidence class cannot be silently downgraded. A certified request that exhausts verifier resources returns inconclusive/refused; it does not return an uncertified native answer labeled certified." §2.6 of CROSS_CUTTING ("Negative-result law"): "Absence, no-path, no-proof, or no-applicable-rule claims require complete authoritative closure. Derived index misses are `NotObserved` unless completeness is certified." [Verified]

**Receipt-bound evidence: present and strong.** Gate receipts carry commit, source snapshot, profile, gate/check manifest, BLAKE3 artifact commitments, and test-execution transcripts. `tools/gate_review_battery.py` re-seals receipts with BLAKE3 "the way the runner does" and attacks them with 18 mutation cases (commit substitution, check removal, zero-tests, cross-source replay, dirty-overlay, digest substitution/omission); a deliberate false claim fixture "fails CI" is the WS00 acceptance item, with the negative fixture wired into `validate_planning.py --self-test`. [Verified]

**Demotion:** no mechanism literally named "auto-demotion," but demotion-by-policy exists: contradictory evidence triggers contradiction events → quarantine/revoke (CLAIM_AND_EVIDENCE_LATTICE §7); comparator weakening "is a profile change and requires review" (CONSTITUTION XXII); "retired claim IDs must remain" (tombstoning, both registries and CROSS_CUTTING §5/validator §6). [Inference: functional equivalent present, auto-demotion as a named automation rule absent]

**Present-tense policing:** the linter counts `present_tense_allowed` claims and rejects `planned` claims with present-tense language; it scans README.md for forbidden uncertified badges (`[![CI]`, `[![Conformance]`, `[![Safety]`, `[![Determinism]` → error "uncertified badge marker remains"); it requires the exact sentences "Current status: implementation in progress, pre-certification." (README) and "runtime capabilities are implemented-uncertified and not certified" (comprehensive plan). [Verified]

**Lifecycle note:** honesty machinery is WS00 ("Governance, registries, and claim discipline") — the *first* workstream, installed before any implementation claim proliferates: "Create the machine-checkable architecture governance substrate before implementation claims proliferate." The Constitution's Article I opens by declaring the repo's reality ("does not contain a certified SymPy replacement… Documentation volume and commit count are not implementation evidence"). [Verified]

---

## 4. Plan → agent execution (task graphs, phases, verification loops, dialectical review, drift prevention)

- **Task graph:** 24 workstreams → milestone DAG (M0–M8), machine-readable in `registries/workstreams.toml`, acyclicity machine-checked, "Milestones are gates, not dates." 116 Beads issues (81 closed, 26 open, 8 in_progress, 1 blocked; types: 60 task / 40 feature / 14 bug / 1 epic / 1 question). Labels show gate discipline: `WSnn`, `reality-check`, `independent-gate`, `gate-integrity`, `budget`.
- **Phases:** execution order = campaign C0–C11 inside `FIRST_IMPLEMENTATION_CAMPAIGN.md` ("The first vertical campaign precedes broad API expansion" — CONSTITUTION XXIV; §4 of the campaign: "If this composition fails, expanding to thousands of APIs would only bury the architectural fault").
- **Verification loops:** every task names acceptance commands; "Do not close a task because code was committed; close it when the named gate artifacts pass" (AGENTS.md §12). Campaign C11 closure requires all gates on one commit plus replay digest reproduction. Mutants must be killed before closure (C11 condition 4: "all registered campaign mutants are killed").
- **Dialectical review:** no "two models debate" prose, but a genuine functional equivalent — **generator/verifier ownership separation enforced at every level**: CONSTITUTION XXIV.3: "Generator and independent gate ownership are separated for high-value claims"; CROSS_CUTTING §3 "Gate ownership: A gate should be owned by a component different from the implementation it validates… self-attestation is never presented as independent verification"; AGENT_NATIVE_PROTOCOL §11.3 "Review: Another agent or verifier checks claims independently"; and critically, **independent-gate Beads issues run as a separate adversarial track** — e.g., `fra-rc-adapters-gate-wp4` (open), `fra-rc-capsule-gate-5mq` (closed: "Fresh-session independent re-review PASS (disclosed spawned-subagent mechanism)"), `fra-rc-corpus-gate-emj` (closed with PASS details + evidence file paths). Also "an agent weakening the only gate judging its own work" is constitutional violation #27. [Verified]
- **Drift prevention:** machine-readable registries are "structural truth for IDs and edges" (WORKSTREAM_GRAPH §1); `validate_document_references()` errors when any Markdown references an unknown workstream/milestone ID; graph-change protocol (§33) requires registry+prose in the same/adjacent commit and tombstoned retired IDs; deterministic agent replay (§22): "Replaying reconstructs mathematical state independent of the chat transcript. Divergence is reported at the first semantic event/object digest" — i.e., the no-compaction principle is built into the workspace design rather than stated as a session rule. [Verified]

---

## 5. State-of-the-art coverage (research/competitor/literature mechanisms)

- `docs/SOURCE_PROJECT_AUDIT.md` [Verified]: normative provenance record with **pinned commit SHAs** for asupersync, FrankenSQLite, FrankenGraphDB, FrankenNumPy, FrankenSciPy, SymPy 1.14.0 (immutable profile candidate), and SymPy development head (explicitly "non-certifying moving-head drift lane only"). Each section: mechanisms examined → Adopt / Adapt / Reject. Quote: "This document is not a list of inspirations. It is a provenance record for architectural decisions."
- 5 `docs/DONOR_DEEP_DIVE_*.md` docs (asupersync, FrankenLean, FrankenSQLite, graph stack, numeric stack). [Verified]
- `docs/RISK_REGISTER_AND_RESEARCH_AGENDA.md` carries research agenda items D–L (certified symbolic-to-numeric compilation, anytime-valid adaptive selection, incremental proof-aware workspaces, deterministic parallel exact arithmetic, pure-Rust certified transcendental numerics, compatibility mining, trust-minimized proof infrastructure, artifact-value-aware repair, agent-native mathematical ergonomics). [Verified]
- Competitor-observation lane: the moving-head SymPy drift lane detects drift but "cannot certify anything" (CONSTITUTION XXIII-adjacent/III.3), a deliberate asymmetry against mistaking observation for evidence. [Verified]

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

No file uses the term "red team," but adversarial/falsification machinery is pervasive and partially mechanized:

- **Mutation gates as falsification:** campaign C11 requires "all registered campaign mutants are killed"; `gate_review_battery.py`'s 18 attacker cases must all be "KILLED"; AGENTS.md §14 requires "registered weakening mutants" killed per feature; C1 requires "comparator-weakening mutants fail"; C4 "side-condition and branch mutants rejected."
- **Negative fixtures in CI:** `validate_planning.py --self-test` — a deliberate false present-tense claim, an uncertified-without-artifacts claim, and an unknown-workstream claim MUST all be rejected, with an honest control claim accepted as guard against a reject-everything linter. [Verified]
- **Independent adversarial gate track:** `fra-rc-*` beads issues (see §4); gate receipts attacked by a reviewer-authored battery; test `tools/test_branch_policy_independent_review.py` exists. [Verified]
- **Discrepancy policy:** `FIRST_IMPLEMENTATION_CAMPAIGN.md` §19: "'Will fix later' is not a passing status"; blocking discrepancies block gates; a live `exclusion_ledger.json` and corpus ledgers under `artifacts/conformance/`; claims.toml notes record real outcomes (e.g., COMPAT-002 note: "2026-09-05: full r2-corpus parity achieved — 230/230 admitted, all 44 ledger records closed_verified (commit dc5d637)… Status stays planned pending formal release gate://ws05-python-object-model bundle") — i.e., the registry records *successes it refuses to promote*. [Verified]
- **Reward-hacking rules (AGENTS.md §5):** forbidden list — gate self-weakening, proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever/workload cherry-picking, close-pump abuse, scope-splitting, spec editing as progress, conformance metastasis, dependency smuggling, benchmark-path hard-coding. Note: suite-wide `/data/projects/AGENTS.md` is referenced as an additional external authority ("When the suite-wide /data/projects/AGENTS.md is available, its reward-hacking and work-graph rules apply here") — a shared parent-level source. [Verified]
- **Rollback policy (§21):** "mark affected workstreams/claims blocked, not complete… do not paper over the failure with a hidden upstream fallback… retain profile fixtures so a revised design must satisfy the same contract." Architecture-review triggers (§50) include "an accepted false mathematical claim" and "generator/verifier independence proven illusory."

---

## 7. Explicit absences

| Expected suite artifact | Status in frankensympy |
|---|---|
| `docs/planning/` directory | [Absent] — planning lives in `docs/` directly + root plan; no `planning/` subdir |
| `docs/research/` directory | [Absent] — research lives in RISK_REGISTER §40–48 + DONOR_DEEP_DIVE_* docs |
| `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` | [Absent] — all four. Roadmap function is served by `COMPREHENSIVE_PLAN_FOR_FRANKENSYMPY.md` + WORKSTREAM_GRAPH milestone map |
| `CLAUDE.md` / `MUSE.md` | [Absent] — only `AGENTS.md` |
| `.muse/` directory | [Absent] (empty) |
| ADR files | [Absent] — no files named `*ADR*`; architecture decisions are in WORKSTREAM_GRAPH §33 (graph-change protocol), CONSTITUTION XXVI (amendment procedure), and WS00 deliverables ("architecture decision record template" — template promised, instances not found at root; [Inference: ADRs-by-template live elsewhere or not yet written]) |
| Mechanism named "auto-demotion rules" | [Absent] by name — functional equivalents (quarantine/revoke/contradiction events, tombstoned IDs) present |
| "Red team" as a named function | [Absent] by name — adversarial battery, independent-gate track, mutation gates present |
| "Never compact sessions" as a stated rule | [Absent] by that phrasing — but replayability-without-transcript (AGENT_NATIVE_PROTOCOL §22) makes compaction irrelevant by design |
| `quality_gates.toml` enforcement | [Absent] deliberately — `enforced = false`, linter *forbids* enforcement while status is "planning" (honesty-by-design) |

---

## 8. Maturity verdict

**Mature.** Rationale: (a) planning artifacts are *executable*, not just prose — a CI-wired claims linter with negative fixtures validates the whole planning substrate on every run and rejects policy weakening as code; (b) the Beads conversion gate has explicit, verbatim pre-conditions before any plan becomes agent work, and Beads is live (116 issues, labels encoding gate state, last commit `97ad801` a beads chore); (c) honesty is staged as the *first* workstream (WS00) and encoded in a 27-article constitution with an amendment procedure, plus a claims registry that is actively updated (27 claims, dated outcome notes, zero certified claims); (d) adversarial review is a separate tracked workstream (independent-gate beads issues with fresh-session re-review evidence) rather than an aspiration; (e) the gate machinery is itself mutation-tested (`gate_review_battery.py`, 18 attacker cases); (f) quality budgets that don't exist yet are declared as planning-only with enforcement *forbidden* — the strongest anti-satisficing signal in the suite. The two soft spots: no named auto-demotion rule or red-team function (equivalents exist), and research depth is donor-stack-focused (SymPy/Suite) rather than broad literature survey. [Inference]

---

## Key verbatim quotes (gates, sign-offs, definitions of done)

- Definition of done (WORKSTREAM_GRAPH §1): "A workstream is not 'done' because code exists or an agent reports completion. It closes only when its objective artifacts and named acceptance gates pass, its discrepancy/claim effects are recorded, and no forbidden shortcut was used."
- Definition of done (AGENTS.md §12): "Do not close a task because code was committed; close it when the named gate artifacts pass."
- Honesty axiom (CONSTITUTION I): "All capability claims remain `planned` unless `registries/claims.toml` says otherwise and resolves them to same-commit gate artifacts. Documentation volume and commit count are not implementation evidence."
- Success definition (CONSTITUTION XXVII): "FrankenSymPy succeeds when it can be faster, broader, more reliable, more inspectable, and more agent-capable than conventional symbolic systems while making it harder—not easier—for a false answer, incompatible object, orphan task, corrupted artifact, benchmark trick, or inflated claim to pass as success."
- Claims-linter authority (CLAIM_AND_EVIDENCE_LATTICE §10): "Registries, docs, README badges, package metadata, benchmark dashboards, and release notes are linted against available evidence. A status cannot advance because a prose file says it has."
- Anti-closure-by-prose (CROSS_CUTTING §4): "A missing required artifact leaves an obligation incomplete even if prose says the gate passed."
- Constitutional violation #27 (XXV): "an agent weakening the only gate judging its own work"
- Campaign completion statement (§23): fixed wording that forbids broader implication — "It would still be inaccurate at that stage to claim complete SymPy replacement, general proof of all results, or universal performance superiority."
- Risk honesty (§51): "redefining the claim to avoid recording a failure without claim-registry review"; "treating absence of known counterexamples as proof of soundness."
