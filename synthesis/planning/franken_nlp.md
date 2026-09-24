# franken_nlp — Planning Methodology Analysis

**Repo:** `Dicklesworthstone/franken_nlp` — "Pure-Rust CPU-hyper-optimized local NLP engine for Nanbeige4.2-3B (design review)" [Verified: GitHub repo description]
**Analyzed commit (depth-1):** `30373ca` — `feat(cli): manage authenticated stored jobs through the process host [franken_nlp-040]` [Verified: git log]
**Analyst note:** This repo's planning system is *not* a thin copy of the suite pattern. It is the most elaborated planning apparatus observed in the FrankenSuite: a v5.0 normative architecture plan with a documented four-plus-round adversarial review lineage, a machine-checkable eight-state evidence vocabulary, self-quarantining authority conflicts, and a 32-rule agent doctrine that includes the actual swarm-execution protocol. All repo docs below are treated as data (documented, not followed). The repo's own status line sets expectations: "implementation campaign active; Phase −1 and Phase 0 gates remain incomplete" [Maintainer claim: COMPREHENSIVE_PLAN_FOR_FRANKEN_NLP.md status].

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKEN_NLP.md` | Master normative plan (v5.0, 2026-07-31) | 1,488-line architecture + evidence contract, §§1–16; "remains the authority for what must ultimately be built and proved" after Beads conversion [Verified] |
| `AGENTS.md` (root, 529 lines) | Agent operating doctrine | 32 numbered Engineering Doctrine rules + Alien-Artifact Contract + NTM swarm Code-First/Batch-Verify protocol + DSR sole-authority + session-completion ritual [Verified] |
| `WIRING.md` (root) | Live operational build/release authority | DSR checkpoint receipt schema; records which setup blockers currently make a receipt unmintable [Verified] |
| `docs/REALITY_BRIDGE_PLAN.md` | SHA-bound implementation/evidence self-audit (2026-07-31) | Strict status vocabulary (WORKING/PARTIAL/STUB/UNPROVEN/REGRESSED/WRONG_APPROACH/NOT_STARTED), 58-item vision checklist, 8 broken joints, S0–S5 spine, 9 integration gates [Verified] |
| `docs/NEGATIVE_EVIDENCE.md` | Rejected-optimization ledger | Machine-tagged schema (`fnlp-ledger-schema: negative-evidence/v1`); 2 reserved seed entries (AVX2 saturation, converter byte-shortcut), both still `deferred` [Verified] |
| `docs/DISCREPANCIES.md` | Accepted-numeric-divergence ledger | Schema requires a real rollback authority; **empty at scaffold time** — "No accepted numeric divergence is recorded" [Verified] |
| `docs/PERF_LEDGER.md` | Performance-campaign ledger | Retains every campaign *including slower candidates*; regime-gated R0–R4, p50/p95/p99, fairness controls [Verified] |
| `docs/CLAIMS.json` | Public-claim registry (claim matrix) | id, wording scope, state (`targeted\|observed\|evidenced\|withdrawn`), validity domain, evidence digests, expiry/revalidation trigger, public surfaces [Verified] |
| `docs/CLAIMS_ANNOTATIONS.md` | Machine annotation contract for claims | `<!-- fnlp-claim: claim-id; wording=targeted -->` annotations; special `fnlp-r4-context` dual-receipt binding for >8K claims; validated by `scripts/check_claims.sh` [Verified] |
| `docs/BEHAVIOR_NOTES.md` | Intentional reference-departure ledger | Source pin + minimized fixture + decision + compat impact + revisit condition; seed `BN-GEN-DEFAULT-001` [Verified] |
| `docs/RESEARCH_DECISION_REGISTER.md` | Frozen/quarantined scope contracts | OQ-31 as AUTHORITY CONFLICT/REOPENED; P7-METAL/SERVE/TRANSLATION as DEFERRED [Verified] |
| `docs/adr/ADR_SCHEMA.md` + `TEMPLATE.md` + `g0_registry.json` | G0 executable-probe ADR system | Machine-readable metadata schema; every ADR must name `killed_alternatives`; `BLOCKED` must name blocked surfaces [Verified] |
| `docs/adr/ADR-G0-01..11.md`, `ADR-OQ35-*.md`, `OQ-31-fnlpq-envelope-review.md`, `drafts/` | Decision records | 11 executable architectural probes + OQ-35 leverage census + quarantined format-authority candidates [Verified] |
| `docs/CODE_REVIEW_LOG.md` | First-principle review records | Symptom → analysis → fix → verification plan → close status per finding (e.g. staging-file leak cr-001, closed 2026-08-28) [Verified] |
| `docs/misc/DUELING_WIZARDS_REPORT.md` + `WIZARD_IDEAS_{CC,COD}.md`, `WIZARD_SCORES_{CC_ON_COD,COD_ON_CC}.md`, `WIZARD_REACTIONS_{CC,COD}.md` | Dialectical duel artifacts | Cross-model idea duel with 0–1000 cross-scores, forced concessions, blind-spot probe; historical synthesis, not specification [Verified] |
| `docs/truth-pack/` | Source-bound evidence vault | `promotions.json`, oracle floor/fixture receipts, `nanbeige4.2-3b.source.json` vs `.research.json`, `research/` (report PDF, modeling source, model card, eval results) [Verified] |
| `docs/eval/DATASETS.md` | Task-eval dataset registry | Immutable source, license, preprocessing digest, contamination risks per dataset [Verified] |
| `docs/release-package-runbook.md`, `docs/job-management-cli.md`, `docs/owned-jobs.md`, native_engine/*, formats/*, specs/* | Task-surface specs | Component-level normative specs (envelope v1, receipts v1, job runner, task docs) [Verified] |
| `.beads/` | Dependency-aware issue tracker | `issues.jsonl` (1.1 MB) is the committed export; **live `beads.db` is not in the checkout** — only `beads.db.corrupt_*` backups, WAL certs, migration state, `config.yaml`, `metadata.json` [Verified] |
| `docs/FEATURE_PARITY.md`, `docs/COMPATIBILITY.md`, `docs/PLATFORM_SURFACES.md`, `docs/SUPPLY_CHAIN_MANIFEST.json`, `docs/TOOLCHAIN.md` | Surface/feature registries | FeatureUniverse presence matrix (`present\|partial\|missing\|n/a`; "partial never rounds up") [Verified] |

---

## 2. Execution-readiness gates

What a plan must pass before agents are set free — verbatim:

**A. The ≥4 independent review rounds gate (plan → Beads conversion).**
- "The planning workflow required **≥ 4 external review rounds** before conversion." [Maintainer claim: plan §15.2]
- "During pre-Beads planning, **do not initialize Beads early**; record review gaps in the plan/handoff." [Maintainer claim: AGENTS.md, "Session Completion"]
- The review lineage is itemized in the plan: round 1 corrected ~15 defects; a second pass applied the `idea-wizard`, `alien-artifact-coding`, `alien-graveyard`, `extreme-software-optimization` disciplines; "The **adversarial cross-scores/reactions** then caught forced-byte/token conflation, control-token trust-boundary omission, same-model-verification overclaim risk, audit-authority gaps, tuning-profile overreach, 44-deep trie-fork amplification, corpus-cache scope, and multi-client duplication; those are now bounded by OQ-19–24, AA-A1, and AA-R1." Then: "Independent review round 2," an owner challenge, "External review round 3 (GPT Pro deep reasoning, 44 proposals)," "Independent fresh-eyes round 4," an owner-directed asupersync leverage pass (v4.3), and a v4.4 confirmation pass. [Maintainer claim: plan lineage record]
- Crucially, the confirmation round can *reset* rather than satisfy: "Because the confirmation found material defects, **it resets rather than satisfies the clean-pass requirement**." [Maintainer claim: plan §4 lineage]

**B. The evidence-vocabulary gate (per-claim, transitive).**
- "No phase gate may claim a result whose **transitive dependency closure** contains an unresolved `[OPEN]`, `[BLOCKED]`, or relevant unresolved portion of `[PARTIAL]`; an unrelated open research item does not globally block an otherwise independent phase gate." [Maintainer claim: plan, evidence vocabulary]
- "Hard rule: **no surface ships against an unresolved dependency.** Promote source observations only with immutable hash + line span + replay fixture." [Maintainer claim: AGENTS.md, Porting Workflow]

**C. The phase-gate system (§11 roadmap).**
- Each phase lists "goals · key tasks · exit gates. **Correctness before speed throughout; a gate cannot pass while it depends on an unresolved §14 item.** Empirical questions are resolved in the phase that can actually measure them—Phase −1 must not fabricate answers to Phase 5 experiments." [Maintainer claim: plan §11]
- Phase −1 exit: "OQ-1…9, OQ-16, OQ-25, and the template-rendering portion of OQ-10 are evidenced to the extent Phase 1 requires"; oracle nondeterminism floor measured; "census green; fixtures committed; license/notice bundle archived; claim→source-line index replay passes." [Maintainer claim: plan §11]
- Phase 0's distinctive gate: "**G0 executable architectural ratification before API/format freeze:** build minimal bounded spike probes—not production-looking mocks… Each probe emits an ADR, exact command, source/host pin, raw evidence digest, decision, and killed alternatives. **A failed probe revises the architecture before downstream APIs crystallize.**" [Maintainer claim: plan §11]

**D. The build-authority gate (DSR checkpoint).**
- "The required retained DSR terminal receipt schema is: `DSR_CHECKPOINT source_sha=<40-lower-hex> source_tree=clean production_graph=production entrypoint=scripts/check.sh dsr_run_id=<stable-id> result=PASS|FAIL`." [Maintainer claim: WIRING.md]
- "`PASS` is invalid if the source SHA is not the clean commit selected by the controller, the production aggregate is absent or not selected, the release graph contains Rayon, or a required policy leg was skipped. A failed or incomplete setup is `BLOCKED`/`FAIL`, **never `PASS-WITH-NOTE`**." [Maintainer claim: WIRING.md]
- "An unarmed DSR code checkpoint reports an explicit `SKIPPED_NO_MODEL` result rather than a counterfeit pass." [Maintainer claim: plan §9.3]

**E. The campaign north-star gate (spinal-cord test).**
- "One end-to-end gate… `fnlp generate --greedy -n 64 <fixture prompt>` through the shipping CLI and a qualified canonical artifact must emit exactly the freshly source-bound oracle's stable prefix for the same numerics profile. **Until then the top-line state is `NOT WORKING`;** fixture presence, synthetic weights, scalar substitution, or `SKIPPED_NO_MODEL` cannot turn it green." [Maintainer claim: REALITY_BRIDGE_PLAN.md §5]

**F. Release certification (the three-pillar gauntlet).**
- "Release requires **every hard gate green and ≥2 consecutive clean full runs after the last load-bearing change**; the **implementation gauntlet** targets **≥10 adversarial convergence rounds**, distinct from the ≥4 independent plan-review rounds required before Beads conversion." [Maintainer claim: plan §9.5]
- The plan header clarifies: "The ≥10 adversarial gauntlet runs in §9.5 are an implementation-certification target, **not additional architecture-review rounds**." [Maintainer claim: plan status]

---

## 3. Honesty guardrails

**Evidence vocabulary (installed at plan v5.0, top-of-document normative block).**
Eight explicit states replace "verified": `[OBSERVED@pin]` (inspected in a named immutable source revision, not yet archived), `[PARTIAL]`, `[REPORTED]` (model card/paper/secondary), `[TARGET]`, `[HYPOTHESIS]`, `[OPEN]`, `[BLOCKED]`, and `[EVIDENCED]` — which Phase −1 confers only "by committing the source hash, exact source span, extraction command, and replayable fixture under `docs/truth-pack/`" [Verified: plan §1 header]. Claims are clause-scoped: "never let one promoted clause lift its unresolved neighbors" [Verified: plan §2.1].

**Negative-evidence ledger (exists, pre-seeded, not yet earned).**
`docs/NEGATIVE_EVIDENCE.md` carries the entry schema (Claim ID, Evidence, Fixture hashes, CPU feature string, Command + environment, Disposition, Hypothesis, Five-pass loop, Loss basis, Revert proof, Re-evaluation conditions) [Verified]. Its two reserved seeds — `NE-AVX2-RAW-VPMADDUBSW-001` (raw `vpmaddubsw` "banned by construction") and `NE-CONVERTER-BYTE-SHORTCUT-001` — are both still `deferred`: "Both entries above are `deferred` (no measurement yet)… They become `rejected` only after the respective fixture is wired and the no-source-landed revert proof is replaced with the matching conversion evidence" [Verified]. The reverted-code discipline: "Every rejected optimization → `docs/NEGATIVE_EVIDENCE.md` (the 5-pass loop; losers reverted with **NO source landed**)" [Maintainer claim: AGENTS.md doctrine #11].

**Claim matrix (exists, wired to CI, currently all-targeted).**
`docs/CLAIMS.json` registers every benchmark/quality/portability/security/determinism/artifact claim with wording scope, state, validity domain, digests, and expiry/revalidation trigger; sample entries (`hf-bf16-eager-fidelity`, `portable-quant-v1-identity-or-fallback`) are all `"state": "targeted"` with empty `evidence_artifact_digests` [Verified]. The annotation contract states the tiers plainly: "An annotation labeled `targeted` marks a target-state specification; **it does not manufacture evidence**" [Verified: CLAIMS_ANNOTATIONS.md]. The checker "rejects every numeric or superlative public line without an active annotation and compares the explicit wording tier against the registered state" [Maintainer claim: CLAIMS_ANNOTATIONS.md]. A lexical false positive in this very checker (`bf16` inside a Rust identifier) is tracked as open Bead `k3i`, with the explicit rule: "weakening the numeric/superlative policy is not an acceptable workaround" [Verified: REALITY_BRIDGE_PLAN.md].

**Authority-conflict quarantine (the guardrail being exercised right now).**
OQ-31: three incompatible `.fnlpq` v1 families "simultaneously claimed frozen or ratified." All are "now visibly quarantined as **AUTHORITY CONFLICT / REOPENED**; none may authorize writer, reader, converter, receipt, package, pull, or release acceptance until the owner ratifies one candidate" [Verified: REALITY_BRIDGE_PLAN.md §0]. "The current document bytes are identified by the Git commit that contains them. Later source, graph, or publisher changes require an explicit delta review; **none silently updates this snapshot**" [Verified: REALITY_BRIDGE_PLAN.md].

**False-closure repair.**
The audit "reopened `6gi`, `6wt`, `72s`, `g6f`, `ilz`, `mzr`, `n27`, `o2y`, `sdb`, `snp`, and `vsx` with issue-specific reasons and preserved every old receipt/comment" after finding eleven Beads closed despite live blockers [Verified: REALITY_BRIDGE_PLAN.md §0].

**Receipt-graded evidence.**
`.fnlpr` receipts declare one of four completeness grades — `Replayable`, `StructuralReplay`, `VerifiableIfArtifactsSupplied`, `AuditOnly` — and "**'verified receipt' without a grade is forbidden**" [Maintainer claim: plan §9.7]. "Every implemented card gets a recommendation record with hotspot evidence, EV factors… `env.json`, `manifest.json`, and `repro.lock`" [Maintainer claim: plan §10.5].

**When in the lifecycle these were installed:** the vocabulary, ledger schemas, and claims registry were installed at plan-writing time (schema-first, evidence-later — DISCREPANCIES.md is empty; both negative-evidence seeds deferred). The quarantine and reopen mechanics were installed by the v5.0 "implementation reality-check and authority repair" revision (2026-07-31), i.e. *after* implementation began — the plan explicitly repairs its own authority mid-campaign [Inference from plan version history].

---

## 4. Plan→agent execution

**Beads conversion rules (§15.2).** "Epics = §11 phases + a spec-extraction epic + a gauntlet epic. Every unresolved/partial §14 item becomes a research bead blocking only its dependent surface; observed rows become truth-pack evidence beads. Every kernel/subsystem gets test + bench + doc dependencies; every AA card starts as a spike carrying hotspot evidence, EV, proof obligation, interaction check, and fallback." [Maintainer claim: plan §15.2]. Conversion happened; "current implementation work follows Bead bodies and dependencies, while this plan remains the normative architecture/evidence contract" [Maintainer claim: plan §15.2].

**Task graph & execution model (NTM swarm, Code-First / Batch-Verify).**
Implementation runs "as an NTM tmux swarm of **12 codex panes on `gpt-5.6-terra` at `xhigh` reasoning effort**… Ordinary panes run **no Cargo, RCH, DSR, or GitHub Actions commands**." Phase 1: 12 agents claim ready beads, write code + tests, commit immediately ("…— code-first, batch-test pending"), leave beads `in_progress`. Phase 2: after quiescence, the controller selects one clean immutable SHA; one DSR job runs `scripts/check.sh` on the `production` graph; close only beads whose own gates + combined proof passed [Verified: AGENTS.md]. The "pump" insight: "`br` unblocks a dependent bead only when its blocker is **closed**, not when it is committed-but-in_progress… the unblock wave fires only at the Phase-2 close step" [Maintainer claim: AGENTS.md]. KPI: "success during Phase 1 is measured by the commit stream, not per-bead closures" [Maintainer claim: AGENTS.md].

**Verification loops.**
- `bv --robot-*` graph analytics are explicitly "structural planning evidence, **never proof that a Bead or phase gate passed**" [Maintainer claim: plan §15.2].
- Build enforcement: controller detects unauthorized pane-owned Cargo/RCH/DSR/GH-Actions processes; "Terminate or cancel only an exact validated process group… never a broad `pkill`" [Maintainer claim: AGENTS.md].
- "a failing interleaving must replay from its seed, **never survive as a one-off batch-verification ghost**" [Maintainer claim: plan §9.3].

**Dialectical review (the duel is real and archived).**
`docs/misc/DUELING_WIZARDS_REPORT.md`: `cc` = Claude Code (Fable 5, xhigh) vs `cod` = Codex (gpt-5.6-sol, max reasoning). "Each model generated 30 ideas, winnowed to 8, cross-scored the other's 8 on a 0–1000 scale, reacted to the other's scores (with forced concessions), and answered the blind-spot probe" [Verified]. "The adversarial pressure demonstrably worked: **eight material concessions, two ideas redesigned, one killed**" — cross-loop wavefront coalescing scored 580 and survived only as a research card [Verified]. The blind-spot round produced the audit-authority ideas (B1 second reader, B3 acceptance-sampling, BS1 Sentinel) [Verified]. The plan's lineage names what the duel caught and where each correction was bounded (OQ-19–24, AA-A1, AA-R1) [Verified: plan §15 notes the report is "historical synthesis, not specification"].

**Named skills (§15.1).** `/porting-to-rust` (spec-first), `/running-the-gauntlet-on-your-rust-port`, testing quartet (conformance/golden/metamorphic/fuzzing), profiling + extreme-optimization, alien-graveyard + alien-artifact-coding, agent-ergonomics, `/cross-project-pattern-extraction`, `/installer-workmanship`, `/release-preparations`, `/dsr`, `/beads-br` + `/beads-workflow` + `bv --robot-*`, `/cass` — each mapped to governing plan sections in a table [Verified: plan §15.1].

**Drift prevention.**
- "Exact-path commits in the shared tree… stage only explicit owned paths (`git add -- path...`, **never `git add -A`)**… refuse a commit containing a peer's file or unrelated hunk" [Maintainer claim: AGENTS.md].
- "Never turn a temporary ready-pool dip into twelve independent builds" [Maintainer claim: AGENTS.md].
- `WIRING.md` is "the live operational receipt surface"; the retained workflow is an "inert" zero-event record, repository Actions disabled — "neither change creates build evidence" [Verified: REALITY_BRIDGE_PLAN.md §0].
- Session completion ritual ("Landing the Plane"): file issues, record gates run + results, truthful handoff, `br sync --flush-only`, only the controller closes "after the retained DSR receipt and every bead-specific gate exist" [Maintainer claim: AGENTS.md].

---

## 5. State-of-the-art coverage

**Research archive (`docs/truth-pack/research/`).** Pinned primary sources: `Nanbeige42_report.pdf`, `configuration_nanbeige.py`, `modeling_nanbeige.py`, `model_card.md`, `hf_api_metadata.json`, `eval_results/` [Verified]. The truth pack distinguishes `nanbeige4.2-3b.source.json` (pinned sources) from `nanbeige4.2-3b.research.json` (research observations), plus `benchmark_conflicts.json`, `gguf_prior_lineage.md`, `gguf_quant_tiers.json`, `llamacpp_baseline.json`, `promotions.json` [Verified].

**Competitor/baseline machinery.** The plan names official `llama.cpp` (post-support commit `b77d646…`, selected baseline candidate `000547513f…` — "selection evidenced, smoke `SKIPPED_NO_MODEL`") as the secondary differential and G2 performance baseline; the authors' `nanbeige42` fork is "historical lineage, not an independent vote"; GPL-3.0 MIT-RLX `rlx-models` is "out-of-tree GPL black box only" — "never a dependency/copy source" [Verified: plan §9.1, AGENTS.md §3]. Prior-art section §2.8 records `[OBSERVED@pin existence; contents to pin in truth pack]` [Verified].

**Sibling-plan mining.** Three extraction agents read the franken_lean, frankengraphdb, and franken_manim plans and returned "36 ranked transferable mechanisms"; Tier 1 adoptions (claims matrix + documentation CI, in-repo oracle-as-program, run certificates/receipts, operation-cost registry, G0 executable spikes, certified reproducibility tier, complexity-witness locks, dependency displacement map) are itemized [Verified: DUELING_WIZARDS_REPORT.md §6]. The plan lineage records cross-reading franken_ocr (closest sibling), franken_markdown, franken_lean, franken_manim, frankengraphdb [Verified: plan header].

**Research-question machinery.** The §14 research-decision register holds 35 open questions (OQ-1…OQ-35) with states (`OBSERVED@pin`, `PARTIAL`, `OPEN`, `AUTHORITY CONFLICT/REOPENED`) and explicit blocking surfaces [Verified]. "Empirical rows are not source-reading chores" and "Empirical questions must be measured in their named phase, not 'answered' from prose" [Maintainer claim: plan §14/§11].

**Literature currency.** §16 primary-source index pins ISA/platform references (Apple CPU Optimization Guide, Arm FEAT_I8MM tables, AMD Zen 4/5 whitepapers) and distribution rules (GitHub asset limits, Cargo patch semantics) [Verified: plan §16].

---

## 6. Anti-satisficing

- **Layered adversarial rounds.** Plan-review: ≥4 independent rounds (round 1, idea-wizard/alien passes within round 1, adversarial cross-scores, round 2, owner challenge, GPT Pro round 3, fresh-eyes round 4, v4.3 leverage pass, v4.4 confirmation). Implementation: ≥10 adversarial convergence gauntlet rounds. They are explicitly distinct [Verified: plan §9.5].
- **Evidence-downgrade language is normative.** v4.4 "pin-accurate qualification": phrases like "DPOR exploration," "futurelock detection," "TLA+ export" were found to describe "candidate facility adoption… not stronger proof or durability semantics"; current contract is "bounded DPOR-style guided coverage; a futurelock witness scoped to the configured idle/schedule bounds; a concrete export that becomes evidence only through a separately retained TLC run" [Maintainer claim: plan header].
- **No exhausted-search fiction.** "receipts publish run/class/budget/saturation coverage rather than 'exhaustive' by adjective"; "The pinned DPOR-style explorer likewise does not prove every reachable equivalence class was explored" [Maintainer claim: plan §9.5].
- **The graveyard rule.** "a clever idea is valuable even when the correct disposition is 'rewrite,' 'defer,' or 'measure and kill'" — the §10.6 disposition table rejects ("margin is free", "token healing as parity fix", "raw floating-logit hashes as portable selftest") with named reasons [Verified: plan §10.6].
- **EV rule for exotic machinery.** "A card may enter implementation only when a measured hotspot maps to it and `EV = (Impact × Confidence × Reuse) / (Effort × AdoptionFriction) ≥ 2`" with integer 1–5 scores and one-sentence evidence each; "If the hotspot disappears, the card returns to the queue"; "a profile/search budget is fixed before execution; exhaustion means 'no promotion' and immediate deterministic fallback, **never an unbounded hunt or a best-so-far default**" [Maintainer claim: plan §10.4/§10.5].
- **Statistical honesty.** "Statistical task metrics use preregistered point estimates and confidence intervals on locked data. There is **no dimensionally meaningless 'Beta-posterior × conformal' aggregate** and no statistical process standing in for a proof" [Maintainer claim: plan §9.5]. "Never derive a tolerance distribution from two observations" [Maintainer claim: plan §9.1].
- **Code review as falsification.** CODE_REVIEW_LOG entries follow symptom → first-principle analysis → fix → verification plan → close status, with an explicit Risk section [Verified].
- **Mutation/self-test of the checkers.** "The claims checker is itself not yet a clean static gate. Its mutation/fixture self-test passes, but the full public-surface scan rejects…" — checkers get tested too [Verified: REALITY_BRIDGE_PLAN.md §0].

---

## 7. Explicit absences

- [Absent] `docs/planning/` directory; `docs/research/` (research evidence lives under `docs/truth-pack/research/` instead).
- [Absent] Root `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` — the plan's functions are served by the single root plan doc + §11 roadmap + §15.2.
- [Absent] `CLAUDE.md`, `MUSE.md`, `.muse/` — only `AGENTS.md` exists as agent instructions.
- [Absent] A "definition of done" document by that name; its function is served by §11 phase exit gates + the DSR receipt schema + per-bead contract/test/eval evidence at close time ("CLOSE only green, with evidence").
- [Absent] Auto-demotion rules: the string "demot" appears nowhere in plan, AGENTS.md, or ledger docs [Verified: grep]. Analog mechanisms exist but are manual/owner-gated: claims carry `expiry_revalidation_trigger`; receipts declare completeness grades; AA cards return to the queue when hotspots disappear; `stale-digest substitution` is tested; qualification has a "longitudinal invalidation rule" (AA-A1). No automatic demotion engine.
- [Absent] The live `.beads/beads.db` from the checkout (only `beads.db.corrupt_*` backups, WAL certs); `issues.jsonl` is the working export.
- [Absent] `docs/truth-pack/LICENSE_PROVENANCE.md` — flagged as a genuine missing artifact and a close gate on `r32` [Verified: REALITY_BRIDGE_PLAN.md §0].
- [Absent] Per the plan's own status: "Phase −1 and Phase 0 gates remain incomplete… franken_nlp today is a substantial code-first reference/artifact scaffold, **not yet a usable or proved product**" [Maintainer claim: plan + REALITY_BRIDGE_PLAN.md].
- [Absent] AGENTS.md's `docs/CLAIMS_ANNOTATIONS.md` acknowledges a checker boundary: "the checker does not claim it can infer natural-language equivalence" — design honesty, not a gap [Verified].

---

## 8. Maturity verdict

**Mature** — as a *planning* system, not as an implementation (the plan itself is explicit that implementation is scaffold-stage with zero phase gates landed).

Why mature, on this repo's own evidence:

1. **The review burden is institutionalized and audited.** ≥4 independent plan-review rounds before Beads conversion (with a lineage record naming what each round caught), ≥10 adversarial convergence rounds for implementation certification, and a confirmation pass that can *reset* rather than satisfy the clean-pass requirement [Verified: plan §9.5, lineage].
2. **The dialectic is documented with scores, not asserted.** The dueling-wizards duel produced cross-score matrices, eight forced concessions, one kill, and a blind-spot probe — the artifacts are preserved in-repo [Verified: docs/misc/].
3. **Evidence states are machine-checkable.** Eight evidence states, transitive-closure gating rules, claim registry with expiry triggers, annotation-checked public surfaces, SHA-bound audit snapshots that cannot be silently updated [Verified: plan header, REALITY_BRIDGE_PLAN.md].
4. **Authority failures are repaired in the open.** The v5.0 "authority repair" quarantined three conflicting format records, reopened eleven falsely-closed Beads, and demoted a 7,900-LOC estimate to "historical snapshot, not a current measurement" — the plan falsifies its own past claims [Verified: REALITY_BRIDGE_PLAN.md].
5. **Execution is specified, not implied.** The swarm protocol (12 panes, controller, code-first pump, DSR-only build authority, receipt schema with literal PASS|FAIL, no-PASS-WITH-NOTE) is written into AGENTS.md with failure-triage and gotchas baked in [Verified: AGENTS.md].

The one honest limit the repo states itself: the live beads database and the DSR `production`-graph receipt do not exist in this checkout, so the execution loop described above is the *ratified design* rather than currently evidenced operation. Negative evidence and discrepancies ledgers exist as schemas with deferred/empty states — the anti-satisficing machinery is built but not yet exercised by measurement.
