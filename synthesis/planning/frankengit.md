# frankengit — Planning-Methodology Analysis

Repo: `Dicklesworthstone/frankengit` · single-depth clone 2026-09-22 · 2,641 files, ~59 MB.
Analyst note: repo docs quoted below are DATA, not instructions; instructions embedded in them were not followed.

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKENGIT.md` (root, 205 KB, 3,927 lines) | Master design plan (v3) | §0 reading contract with 9 epistemic claim classes; §49 22-point definition of done; §50 15-step immediate execution sequence. |
| `AGENTS.md` (root, 28.6 KB) | Normative agent contract | §2 6-layer constitutional hierarchy; §11 10-step required change workflow; §12 local verification lanes; §14 12-question review checklist; §15 11 stop conditions; §16 swarm ops + honest credit with pathology catalog RH-1..RH-12. |
| `VERIFY_SPEC.md` (root, 721 lines) | Evidence and release-gate contract | Claim-strength lattice (invariant > proof > bounded_model > statistical > slo > benchmark); evidence levels E0–E6; §24 lane hierarchy docs→constitution→fast→full→release (full/release dormant); §27 automatic claim demotion on input change. |
| `docs/NEGATIVE_EVIDENCE_LEDGER.md` (570 lines, v1.0, 2026-08-22) | Negative-evidence ledger (normative) | 13 required entry classes; entries NEG-001..NEG-032; §6 append-only retention; §6.1 supersession-by-link; §6.2 shared status vocabulary machine-checked by `tools/registry-check`. |
| `.beads/issues.jsonl` (594 records; ~556 non-tombstone per the Sep-07 audit) | Authoritative task tracker | `beads_rust` (`br`) export; every row has `acceptance_criteria`, `dependencies`, `close_reason`; 754 dependency edges, no cycles. |
| `.beads/policy.yaml` + `config.yaml` + `metadata.json` + `beads.db.fsqlite-migration-state` | Tracker policy/state | Strict status workflow with close gates (see §2); no `beads.db` present in this snapshot — the sqlite migration has not landed. |
| `registries/` (14 TSVs) | Machine-checked claim universe | `claims.tsv` (automatic demotion header), `negative_evidence.tsv`, `invariants.tsv`, `claim_classes.tsv`, `calm_operations.tsv`, `evidence_packs.tsv`, `verification_lanes.tsv`, `dependency_policy.tsv`, `durable_objects.tsv`, `graph_views.tsv`, `crate_layers.tsv`, `publication_primitives.tsv`, `attack_matrix.tsv`; all under `tools/registry-check`. |
| `docs/AGENT_PROTOCOL.md` (742 lines, 2026-09-02) | Agent collaboration protocol | IntentRun, AuthorityReadReceipt, Context Packet, effect broker, Evidence-Carrying Change §10, §11.2 independent agent review, §17 typed refusal taxonomy, §18 16 conformance tests. |
| `docs/AGENT_CONTROL_PLANE_*.md` (7 docs) | Agent control-plane contracts | Architecture, effect authorization, handoff ancestry, lifecycle continuity, task recovery, task coordination (typed end-to-end task tower), implementation status. |
| `docs/BEADS_RECONCILIATION_QUEUE_2026-0*.md` (5 docs) | Wave handoff queues | Non-authoritative operator handoffs carrying exact evidence from environments without tracker/toolchain access; must be applied through `br` later. |
| `docs/RESEARCH_PROVENANCE.md` (380 lines, 2026-08-20) | Research lineage ledger | 14 source lineages (Cursor "Git at Any Scale", Git corpus/oracles, Asupersync, FrankenSQLite, FrankenFS, FrankenSearch/Quill, franken_markdown, FrankenGraphDB, FrankenNetworkX, Doodlestein Self-Releaser, RaptorQ/RFC 6330, anytime-valid inference literature, forge precedents); §15 ten provenance rules for future contributions, including mandatory falsifier. |
| `docs/DEPENDENCY_AND_MEMORY_SAFETY_CONSTITUTION.md` (195 lines) | Dependency constitution | Closed dependency universe; pure-Rust, one-runtime rules. |
| `docs/CALM_AND_OBLIGATIONS.md` (299 lines, v1.1) | Coordination + obligation model | 7-class CALM registry; obligation lifecycle Reserved→Committed→Acknowledged; core obligation types. |
| `SECURITY_THREAT_MODEL.md` + `docs/SECURITY_THREAT_MODEL_AGENT_EFFECT_AUTHORIZATION.md` | Threat model | §22 adversarial program (23 classes); line 719 requires claim demotion for unbounded findings. |
| `docs/NORMATIVE_PROTOCOL_CONTRACTS.md` (783 lines) | Normative protocol contract | Wins on conflict per AGENTS.md §2; AGENT_PROTOCOL refines it. |
| `docs/ARCHITECTURE.md`, `docs/GIT_COMPATIBILITY_MATRIX.md`, `docs/GIT_TREE_FS.md` + 150 other flat `docs/*.md` | Subsystem specifications | Flat (no `docs/planning/` subdir); per-surface specs, HTTP/API profiles, workflow docs. |
| 17 ADRs (`docs/ADR-0001`..`ADR-0017`) | Architecture decisions | e.g. ADR-0008 refuses blanket "GitHub-compatible" claims in favor of per-endpoint registry; D3_SHA256 decision lines each name what would falsify them. |
| `docs/REALITY_CHECK_AND_BRIDGE_PLAN.md` (2026-09-07, revision-bound to `b74b666dc644c6ed18697f3950690bf289c33114`) | Audit snapshot + bridge plan | Executable evidence table, vision-to-product map, 7 findings, 6 bridge milestones A–F with exit criteria; 8 new audit beads; "a historical test result is not a current gate result". |
| `docs/FRESH_EYES_AUDIT_2026-08-19.md`, `docs/FRANKENSUITE_DEEP_AUDIT_2026-08-19.md`, `docs/FRANKEN_SUITE_DEEP_DIVE_SYNTHESIS.md` | Audit lineage | Historical audits preserved; deep-dive synthesis provides subsystem placement matrix. |
| `.visibility-payload/` (6 files) | Test-hardening payload | Adversarial test-strengthening scripts for upload-pack visibility (anti-vacuity assertions, permitted-twin tests) — hardening artifact, not a planning doc. |
| `proofs/fg041/` (Lean lane) | Formal proof lane | Pinned `leanprover/lean4:v4.32.0` toolchain, offline refusal, planted false-theorem control (see NEG-028). |
| `scripts/bv_compat.sh`, `scripts/verify.sh` | Tooling | `bv` robot-mode compatibility wrapper (read-only advisory); canonical verification lanes. |

## 2. Execution-readiness gates — what must a plan pass before agents are set free

The gates are layered; a bead (task) cannot close without passing each relevant one.

**Tracker policy gates** (.beads/policy.yaml, [Verified]):
> "FrankenGit swarm tracker policy — code-first / batch-verify pump. Only the batch-verify orchestrator closes work, citing revision-bound evidence."
- `allow_bypass: false`; `forbid_self_close_after_in_progress: true`; `require_close_reason: {enabled: true, min_length: 20}`.
- Every close path (`open/in_progress/rework/blocked -> closed`) requires `must_transition_through_batch_pending`.
- Status workflow is `strict: true` with the statuses `open, in_progress, batch_pending, rework, blocked, deferred, closed, tombstone`; `batch_pending -> closed` requires a `transition_comment`.

**Wave execution gates** (AGENTS.md §16.2, [Maintainer claim] quoted verbatim):
- "Phase 1 (all agents, parallel): claim the assigned bead ... move the bead to `batch_pending` with `--transition-comment` only when substantively complete (code + tests + bead-linked commit + every acceptance line mapped to a concrete test + no known defect)."
- "The orchestrator runs the union verification per wave, returns failures to the same assignee as `rework`, and alone records the `batch_verify` gate and closes beads with revision-bound evidence."
- "Any 'pass'/'green'/'verified' written in a comment, mail, or commit message MUST name the commit SHA it was observed at; unbound claims are unsupported. `.beads/policy.yaml` refuses every other close path, self-closes, and stale gate results."
- "Agents do NOT run `cargo test`, `cargo clippy`, `cargo build`, or `./scripts/verify.sh` during development" (centralized verification; two sanctioned exceptions).

**Required change workflow** (AGENTS.md §11, [Verified]) — every material change must: identify owning subsystem, invariant, registry row, authority/derived class; state the final abstraction and rejected shortcuts; write reference behavior/goldens first; implement the smallest complete vertical slice; add success/refusal/cancellation/crash/retry/resource/adversarial/determinism tests; add differential/fault/security/performance evidence per claim class; update docs, registries, issue/dependency graph, threat model, negative evidence; run local lanes; stage only intended files.

**Document-precedence gate** (AGENTS.md §2, [Maintainer claim]):
> "If these disagree, stop and surface the contradiction. Do not implement the most convenient interpretation."
Constitutional hierarchy: normative protocol contracts → dependency/memory-safety constitution → comprehensive plan → subsystem specs → VERIFY_SPEC + threat model → machine-validated registries.

**Verification lanes** (AGENTS.md §12 / VERIFY_SPEC §24, [Verified]): `docs` → `constitution` → `fast` → `full` → `release`; "full and release must fail or report an explicit dormant/spec-only status rather than pretending absent engine lanes passed." VERIFY_SPEC §24.2: a green receipt requires exact equality of required and passed IDs; "Zero-run, missing, duplicate, unregistered, unsupported, skipped, filtered, ignored, timed-out, early-exit-without-terminal-assertion, malformed-log, stale-revision, and wrong-profile cases are non-pass for required rows."

**Evidence-class gate** (AGENT_PROTOCOL §10, [Verified]): every Evidence-Carrying Change carries `requirement_dispositions[]` where "Each acceptance requirement is exactly one of: satisfied with evidence; partially satisfied with explicit boundary; not applicable with reason; blocked by typed refusal; unsatisfied." — "Missing requirements cannot disappear from a generated summary."

**Process-artifact gate** (AGENTS.md §16.3, [Maintainer claim]): "A process artifact (certificate, ledger, dashboard, matrix, meta-report, speculative check) may be created only if it names a concrete consumer, the named feature it gates, the observed defect class justifying it, and its deletion condition. Boundary test: if running code branches on it, it is product; if only humans and status reports read it, it is process."

## 3. Honesty guardrails

**Negative evidence** ([Verified]): `docs/NEGATIVE_EVIDENCE_LEDGER.md` v1.0 (2026-08-22) records 32 entries (NEG-001..NEG-032), each with hypothesis, evidence, disposition, revisit conditions, and registry row. 13 required entry classes (`correctness_counterexample`, `model_counterexample`, ..., `overclaim_correction`). Append-only per §6; §6.1 mandates supersession-by-link (worked NEG-025 example — the superseded row keeps `active` status deliberately); §6.2 status vocabulary is machine-read: "tools/registry-check parses it and asserts it equals the checker's own is_known_status set exactly, in both directions, so the document and the code cannot drift apart." Agent integration (§5, [Maintainer claim]): "Context Packets for architecture/performance work include relevant negative-evidence rows. An agent proposing a known-rejected dependency or mechanism must cite and rebut the row."

**Claim matrix with automatic demotion** ([Verified]): `registries/claims.tsv` header is explicit —
> "A verified row is presented as verified only while every required artifact still matches its exact SHA-256 commitment. Any mismatch is an automatic demotion, not a reviewer-overridable status transition."
Rows bind `claim_class`, `scope`, `owner_invariant`, `required_artifacts` (SHA-256-pinned), `evidence_class`, `status`, `source_revision`, `toolchain`, `target_profile`, `assumptions`, `non_claims`, `revalidation`, `fallback_wording`. Complementing this, VERIFY_SPEC §27 ([Maintainer claim]): "There is no final global 'verified' bit. A new dependency, toolchain, format epoch, backend, target, optimization, policy, or threat can invalidate evidence and demote claims automatically." Claim lattice ([Verified]): `invariant > proof > bounded_model > statistical > slo > benchmark` — "Evidence routing that attempts a weaker-to-stronger edge fails closed." VERIFY_SPEC doctrine item 10: "No public claim exceeds the strongest admissible evidence in its registry row."

**Claim demotion installed** ([Verified]): SECURITY_THREAT_MODEL.md line 719 requires "no unbounded critical/high finding without explicit time-bounded owner exception and claim demotion". The Reality Check (2026-09-07) actively demotes stale claims (durable-merge claim, README historical-E2E claims, sqlmodel blocker) and pins evidence to `b74b666dc644c6ed18697f3950690bf289c33114`.

**When installed**: negative-evidence ledger v1.0 dated 2026-08-22; claims.tsv automatic-demotion clause undated but normative in the current tree; the revision-bound reality check 2026-09-07. NEG-024 shows the ledger mechanism is honest about limits: coverage is "NOT ENFORCED, recorded as a named open weakness rather than dropped... An unenforced obligation that is *named* stays visible."

**Credit honesty** ([Maintainer claim], AGENTS.md §16.3): forbids "faked tests, fixtures/mocks presented as live proof, weakened assertions, golden regeneration to force green, hard-coded success paths, `todo!()`/`unimplemented!()` in commits, editing the spec or a gate instead of implementing it, narrowing scope while claiming full success, splitting one unit of work to harvest closures, moving an in-scope acceptance condition into a 'follow-up' to close the original." Names pathologies RH-1..RH-12 (gate self-weakening, proof-class inflation, golden regeneration, commit pumping, tautological tests, easy-bead cherry-picking, close-pump, scope-splitting, follow-up laundering, spec-editing, dependency smuggling, demo-path hardcoding). NEG-026 is a live worked example: two agents verifying with the same method inherited the same blind spot ("a second agent verifying with the same method as the first inherits the blind spot rather than removing it").

## 4. Plan→agent execution

**Task graphs** ([Verified]): 594-record bead graph with 754 dependency edges and no cycles; `br ready --unassigned --no-db --json` is authoritative readiness; `scripts/bv_compat.sh --robot-triage` provides advisory graph-aware ranking (PageRank, betweenness, critical path) but "graph rankings and generated commands do not authorize claims". Bead schema includes `acceptance_criteria` (e.g. `frankengit-0zjt` has 5 numbered criteria with test/e2e bindings), `dependencies`, `close_reason`, `comments`. Observed close_reason pattern: "Verified independently by BatchOrchestrator at HEAD 95694da" — revision-bound closure.

**Phases** ([Verified], AGENTS.md §16.1–16.2): code-first waves. Phase 1 all agents parallel (claim via `br update <id> --claim`, code + tests in the same bead, syntax gate only, commit immediately, hand to `batch_pending`); orchestrator runs union verification per wave, returns failures as `rework`; only the orchestrator closes. Shared-checkout rules: "Swarm agents share ONE checkout on main. Reserve shared files through Agent Mail before editing them"; "Contracts are frozen per wave; no agent redefines a shared interface to make its own code pass (SM-5)." New crates are created all-at-once (manifest + lib.rs + registry rows in the same commit) because the `crates/*` glob breaks every cargo command — a learned rule ("six wave-wide outages in a single wave came from exactly that window").

**Verification loops** ([Verified]): centralized batch verification; implementers hand work to `batch_pending`, the orchestrator's `batch_verify` gate closes with revision-bound evidence. Wave-local: sanctioned per-crate `cargo test` once before handoff; orchestrator lane per wave. Drift control between waves: the 5 `BEADS_RECONCILIATION_QUEUE_2026-0*.md` handoffs carry "exact evidence and suggested operator actions" from environments lacking tracker/toolchain access back to an authorized environment, explicitly marked "non-authoritative operator handoff".

**Dialectical review**: [Absent] as a planning method. There is no documented two-models-against-each-other planning or grading loop anywhere in the repo. Closest verified analogs: AGENT_PROTOCOL §11.2 independent agent review with 7-dimension verifier-independence classification (workspace, credentials/effect authority, model/harness, context, oracle/toolchain, operator, human); fresh-eyes audits (2026-08-19); the revision-bound reality check (2026-09-07). The verifier is always downstream of an Evidence-Carrying Change, never a planning-phase dialectic.

**Drift prevention** ([Verified]): constitutional precedence with stop-and-surface contradictions (AGENTS §2, §15); status vocabulary machine-checked in both directions (NEG ledger §6.2); claims.tsv artifact-SHA automatic demotion; comprehensive-plan §50 step 15: "Advance README claims only from registry status, never from implementation enthusiasm"; plan §0.3: "A disagreement is a release-blocking defect"; Agent Mail reservations; tombstone states in the tracker.

## 5. State-of-the-art coverage

**Research mechanisms** ([Verified]): `docs/RESEARCH_PROVENANCE.md` (2026-08-20) is a retrospective lineage ledger, not a phase gate: 14 lineages, each with mechanisms observed → adopted → non-imported (e.g. Cursor "Git at Any Scale" mechanisms; Asupersync ATP/CALM; FrankenSQLite per-core lanes; FrankenFS negative results; FrankenGraphDB claim lattice). §15 "Provenance rules for future contributions" (10 rules, [Maintainer claim]): cite primary source and exact revision/file/section; state whether source behavior is implemented/proposed/measured/inferred; name the exact mechanism; distinguish adoption/adaptation/divergence/rejected; "provide a simpler baseline and falsifier"; update threat, claim, dependency, verification, and negative-evidence registries. This is frankengit's strongest research-rigor artifact and it is retrospective-by-design.

**Competitor/oracle coverage** ([Verified]): pinned external oracles — Git 2.54.0 sandboxed differential lane (VERIFY_SPEC §11), pinned `leanprover/lean4:v4.32.0` toolchain that "refuses to run when that toolchain is absent rather than fetching it" and "is required to reject a planted false theorem before any real claim is trusted" (NEG-028). Forge precedents surveyed (GitLab/Gitaly, Forgejo/Gitea, SourceHut, Radicle, OCI/SLSA/in-toto).

**Research→plan phase gate**: [Absent]. No standing "research phase then brief phase then planning phase" cadence documented; §15 rules apply at contribution time; the audits (2026-08-19) and reality check (2026-09-07) are scheduled assessments, not gates on new planning.

## 6. Anti-satisficing

**Falsification** ([Verified]): D3_SHA256_REPOSITORY_DECISION.md: "Per `AGENTS.md` §16.3, each line below names what would falsify it." AGENTS.md §7 (performance rules): "Every optimization must state: ... baseline/candidate/A-A control; raw samples and tails; ... rollback and negative result." — "A microbenchmark does not establish end-to-end improvement." ADR-0008: blanket "GitHub-compatible" is "unfalsifiable marketing; a measured per-endpoint registry is a fact"; ADR-0017 structural-absence cells are "falsifiable". NEG ledger §4 revisit protocol: "A new benchmark on different hardware without addressing the old correctness counterexample is not a revisit." AGENT_PROTOCOL §10.2 requirement dispositions; §10.3 rewards agents for disclosing uncertainty, flaky evidence, and performance noise.

**Red-team** ([Verified]): AGENT_PROTOCOL §18.2 conformance tests include "repository-content prompt-injection red-team corpus", "secret-exfiltration attempts across tool, process, log, context, evidence, and output surfaces", "producer/verifier trust-domain classification tests". SECURITY_THREAT_MODEL §22: 23-class security/adversarial program. VERIFY_SPEC §5.4: "Planted-negative fixtures must introduce a second Asupersync, Tokio, an absolute sibling path, ... each fixture must fail for the intended reason."

**Mutation campaigns** ([Verified]): FG-002c mutation campaign found NEG-018 (canonical decoder accepted second encodings); FG-041 planted false theorem control (NEG-028); native-linkage lane has "real-build positive and planted forbidden-emission cell". NEG-029/030 document honest rejection of capacity models on a noisy host ("The harness is not the problem... it is correctly reporting that it cannot support the claim").

**Campaign mechanism** ([Verified]): mutation/negative campaigns are named FG-numbered beads with acceptance lines (e.g. FG-002c, FG-041, FG-069 derive guard, FG-084 differential); NEG-018: "found by the FG-002c mutation campaign rather than by review."

**Stop conditions** ([Maintainer claim], AGENTS.md §15, 11 items): stop and escalate when documents contradict, a second authority source seems needed, required evidence cannot be produced, implementation needs an empty scaffold; "The correct outcome may be a typed unsupported/refusal, a constitutional amendment proposal, or a negative-evidence record. It is never silent architectural drift."

## 7. Explicit absences

- [Absent] `docs/planning/` directory — planning docs live flat at root and in flat `docs/` (158 files); there is no planning-specific subdirectory.
- [Absent] `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` at root — the roadmap role is carried by the comprehensive plan §49/§50 + the bead graph + `registries/`.
- [Absent] `CLAUDE.md`, `MUSE.md`, `.claude/` — agent instructions live only in `AGENTS.md` (+ bv workflow block inside it).
- [Absent] **Dialectical / two-model planning review** — no documented two-models-against-each-other, grader loop, or adversarial planning review. Independent agent review exists only as a product protocol (§11.2, verifier-independence classification), plus historical fresh-eyes audits.
- [Absent] **Research/brief phases as planning gates** — RESEARCH_PROVENANCE is retrospective lineage + contribution-time rules, not a phased gate before planning.
- [Absent] **Task-tracker auto-demotion** — automatic demotion exists for *claims* (claims.tsv artifact-SHA binding; VERIFY_SPEC §27), never for *beads*; no rule auto-demotes bead status.
- [Absent] **Session-compaction policy** — the suite's "never let sessions compact" practice appears nowhere in frankengit's docs (searches for compaction-context rules found nothing).
- [Absent] **Skill references in planning docs** — the "just-say-no-to-process-porn-and-ceremony" skill is cited only inside AGENTS.md §16.3 for the RH catalog; no other skill-bound workflows found.
- [Verified observation] `.beads/` has a `beads.db.fsqlite-migration-state` marker but **no `beads.db`** — the sqlite migration had not landed in this snapshot; `issues.jsonl` remains the authoritative tracked export and `br` is invoked with `--no-db`.

## 8. Maturity verdict

**Mature.** frankengit is the most planning-disciplined repo in the FrankenSuite: a 3,927-line constitutional plan with a 22-point definition of done, a 10-step required change workflow, a 12-question review checklist, 11 stop conditions, a 12-pathology anti-satisficing catalog, a 594-record dependency-tracked bead graph with machine-enforced close gates, and the suite's only found *automatic, non-overridable* claim-demotion mechanism (claims.tsv artifact-SHA binding + VERIFY_SPEC §27). Planning doctrine is explicitly falsification-first: every claim carries epistemic class, non-claims, and falsifiers; negative evidence is append-only, machine-checked, and wired into agent Context Packets; revision-bound evidence and dated audits (Aug-19 audits, Sep-07 reality check) create a living assessment rhythm. Gaps are the suite-typical ones: no documented dialectical/two-model planning review, no phased research→brief→plan gate, no `docs/planning/` organization — but frankengit substitutes its own equivalents (independent agent review protocol, contribution-time provenance rules, batch-orchestrator verification, fresh-eyes audits) rather than simply lacking rigor.

---
*Report prepared from single-depth clone 2026-09-22. Scratch clone retained at ~/workspace/plan-frankengit-scratch/frankengit for follow-up; removed from /tmp (tmpfs full). All quotes verbatim from repo files listed above.*
