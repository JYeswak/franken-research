# Planning methodology: franken_manim (Dicklesworthstone/franken_manim)

**Repo:** https://github.com/Dicklesworthstone/franken_manim — assessed at HEAD `76ea8c6d` (2026-09-22; `git clone --depth 1`). [Verified]
**Working copy note:** `/tmp` was a 100%-full 512 MB tmpfs (disk-exhaustion wrote zero-byte files), so the clone lived at `~/workspace/scratch-plan/repo`; removed after extraction. [Verified]

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/planning/COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKEN_MANIM.md` | Master plan (Rev 4) | 679-line greenfield architecture + execution program: reference anatomy, 10 subsystems, doctrine D-01…D-25, 11 workstreams W1–W11, gates G0–G5, risk register R1–R22, decision log, OQ-1…OQ-12; "intentionally not an MVP specification" |
| `AGENTS.md` (370 lines) | Agent operating constitution | RULE 0 override, spec-first workflow, engineering doctrine (8 rules), determinism contract, testing/Gauntlet policy, claim workflow, UBS/fuzz guidance |
| `docs/GOVERNANCE.md` (231 lines) | Program governance machinery (R9) | Workstream activation cap, claimability rules, autonomous claim-kind labels, gate ownership ("the packet is the pass"), review rules, stop conditions, upstream-ledger ritual |
| `docs/AGENT_CONTROL_PLANE.md` (248 lines) | Claim-machine architecture | Authority hierarchy (JSONL → brief → next → guard → claim), governed scope vocabulary, claim token format, canonical graph boundary, shared lock contract |
| `docs/AGENT_CLAIM_GUARD.md` (182 lines) | Claim guard contract | Deterministic token binding recommendation to complete task semantics; versioned schema contract |
| `docs/AGENT_CLAIM_EXECUTOR.md` (235 lines) | Claim executor contract | Atomic `br update --claim` compare-and-set, lock, post-export delta verification, failure semantics |
| `.beads/issues.jsonl` (642 records) | Task graph (authority) | 622 closed / 15 open / 5 in_progress; fields include `acceptance_criteria`, `dependencies` (blocks), `labels`, `notes`, `owner`, `design`, `close_reason`; config: `issue_prefix: fm` |
| `docs/gates/G1-core-2d-evidence.md` | Gate pass packet (G1) | Acceptance matrix, dependency closure (21 beads), per-criterion evidence; **PASS** recorded 2026-08-20 |
| `docs/gates/G2-native-word-evidence.md` | Gate evidence packet (G2, still OPEN) | 8-criterion acceptance matrix with honest Partial/Not-yet rows; marshals evidence without passing |
| `docs/g0/G0-*-ratification.md` (8 notes) | G0 spike ratifications | One ratification note per G0 spike; OQ resolutions recorded with digests, raw data dirs |
| `docs/adr/0001…0023` + `TEMPLATE.md` | Architecture Decision Records | 23 ADRs, monotonically numbered, status `Proposed → Accepted → Superseded`; required for any D-01…D-25 amendment, OQ resolution, policy ruling |
| `docs/IMPLEMENTATION_STATUS.md` | Reality-check / anti-hype report | Dated honest assessments (2026-09-04/07/09), fresh-execution evidence tables, "Truthfulness rules for future updates" |
| `UPSTREAM_LEDGER.md` | Cross-repo contribution ledger | 13 rows: primitive → foundation repo, owner, status vocabulary (proposed/spiked/in-flight/landed-upstream/pinned/tiered-out), coordination dependency |
| `docs/ratchet/dashboard.md` + `baseline.tsv` + `trend.tsv` | Coverage ratchet (no-LaTeX headline metric) | Frozen G0-4 denominator (9269 strings / 17711 occurrences), monotone-rising trend, CI-enforced pin/ratchet lockstep, escalation path |
| `docs/performance/PERF_GATES.tsv`, `PERFORMANCE_GATES.md`, `PG8_BASELINE.md` | Performance gates | PG-1…PG-8 + PG-A rows with policy; "blocking" rows must be green for gates |
| `docs/research/differentiable-animation-charter.md` | Exploratory research charter | G5 exploratory-tier charter with constitutional constraints, milestones |
| `docs/research/sme-amx-investigation.md` | Hardware investigation note | Completed assessment concluding SME/AMX are inappropriate — negative finding recorded |
| `docs/behavior_notes/BN-*.md` | Deliberate-divergence register | Every intentional semantic difference from the Reference documented with migration guidance (D-05) |
| `scripts/agent_next.py`, `agent_claim_guard.py`, `agent_claim.py`, `agent_brief.py`, `generate_agent_brief.py`, `agent_claim_policy.py`, `agent_task_semantics.py` | Claim-machine executables | Deterministic planner, digest-bound guard, atomic executor, bounded brief projections |
| `API_OVERLAY.tsv`, `API_SCHEMA.tsv`, `SUITE.lock`, `VIDEO_CORPUS.lock`, `SUITE_ALLOWLIST.tsv` | Claim ledgers | Symbol-level parity claims, pinned suite commits, allowlisted dependency closure |
| `CHANGELOG.md` | Evidence-bounded changelog | Repair checkpoints with exact commit hashes; "None of these entries implies a clean-wheel parity pass that was not executed" |
| `docs/planning/UPGRADE_LOG.md` | Dependency upgrade log | Governed pin migrations (PyO3, wasm-bindgen) with security-migration receipts |

## 2. Execution-readiness gates (verbatim quotes)

Before agents are "set free", the plan itself is the first gate. The load-bearing readiness quotes:

- **G0 is a hard prerequisite on all construction.** Plan §20.1: *"Gate G0 precedes all construction"* and *"Compile-tested spikes and executed decisions; **no W2–W11 interface freezes until green**"*. (franken_manim, `docs/planning/COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKEN_MANIM.md` §20.1) [Verified]
- **"Contracts before construction."** Plan §0 commitment 6: *"Gate G0 (§20.1) retires the load-bearing unknowns — object-model lifetime, renderer look-calibration, math-engine architecture, Python extensibility, cross-platform float behavior, dependency closure, accelerator viability — as **compile-tested spikes before W2–W11 freeze interfaces**."* [Verified]
- **No scope reduction allowed.** AGENTS.md "Spec-First Workflow": *"Hard rule: gates are integration checkpoints, not scope reductions. There is no MVP. … A workstream may implement a **subset** of a final abstraction — **never a substitute** for it."* [Verified]
- **The packet is the pass.** `docs/GOVERNANCE.md` §2: *"A gate passes only when the owner records a verdict against the committed packet. **The packet is the pass**."* and *"A chat summary is never a pass."* [Verified]
- **Never work from a failed plan.** AGENTS.md: *"Never activate work from a failed or empty plan."* GOVERNANCE.md §1: *"Every nonzero planner, guard, or executor result emits no usable success payload."* [Verified]
- **Stop condition for governance breach.** Plan §21 R9: *"governance: max simultaneously-active workstreams… breaching governance halts new activation"*. [Verified]
- **The claim gate (what an individual agent must pass before touching work).** GOVERNANCE.md §1 mandatory pre-claim sequence: `agent_brief.py --format json --check` → `agent_next.py --format json --check` → `agent_claim_guard.py --require` token → `br show` + mail/reservation/peer checks → dry-run → atomic claim; exit identities: `1`=unsafe graph/activation, `2`=malformed, `3`=no claimable leaf, `4`=stale token, `5`=no verified executor receipt. [Verified]

## 3. Honesty guardrails

| Mechanism | What exists | When installed | What it requires |
|---|---|---|---|
| Gate evidence packets | G1 passed packet, G2 marshaled-but-open packet (`docs/gates/`) | G1 2026-07-29/08-20; G2 2026-08-21 | Acceptance matrix with per-criterion evidence, exact source commit, host/toolchain, human verdict for Gallery rows |
| Verdict delegation (ADR-0018) | Delegates may pass gates; identity/model/date/evidence recorded | 2026-08-20 (G1, marshal `LilacTern`, delegate `GreenPeak` grok-4.6) | Mechanical rows stay mechanical; Look Gallery vocabulary `at-least-as-good / different-but-fine (Behavior-Noted) / regression`; *"Forbidden: closing a gate from a status meeting, a bead count, or a README tense note"* |
| Reality-check reports | `docs/IMPLEMENTATION_STATUS.md` — periodic self-adversarial audits with fresh execution | 2026-09-04/07/09 | Exact commits/commands; never upgrade "compiled/reviewed/inventoried" into "implemented/compatible/green"; runtime-audit "found **93 contradictions: 93 placeholders, zero missing symbols**" (2026-09-09), reported as contradiction, not pass |
| Truthfulness rules | 7 codified rules in IMPLEMENTATION_STATUS.md ("Truthfulness rules for future updates") | 2026-09-09 | e.g. *"Do not infer hardware or artifact evidence from another platform"*; *"Do not close a parent merely because one child or one census reaches 100%"* |
| Negative-evidence style | G2 packet admits: *"code-first with batch-test pending; per the swarm's code-first doctrine **no fresh `cargo test` run backs this packet**, and no pass below claims one"* | G2 packet, 2026-08-21 | Disclaimers inside the packet itself, not in a separate ledger |
| Claim matrix / symbol parity | `API_OVERLAY.tsv` reviewed rows are *"an authored compatibility claim, not runtime proof"* (GOVERNANCE.md §2); GOVERNANCE §2 demands `check_portal_runtime.sh` clean-wheel receipt for W10/G4 handoffs: *"A source-only `scripts/check.sh` result … cannot substitute for this clean-wheel receipt"* | Governance §2 | Runtime audit fails rows whose symbol resolves to `_fmn_schema_placeholder`; *"A nonzero runtime audit is a finding to resolve by real implementation or an evidence-backed overlay correction"* |
| Demotion rules | Stop conditions: core PG-1–PG-3 regression pauses all annex work; purity misclassification demotes the effect class to stateful engine-wide until root-caused; unadjudicated self-golden drift reverts the introducing change; *"Self-golden drift is adjudicated, never reflexively re-blessed"* | AGENTS.md; GOVERNANCE.md §5 | Automatic by policy, not by grader |
| Coverage ratchet | `docs/ratchet/` — frozen denominator; CI fails on decrease or on pin-bump without re-run; unsupported constructs must fail with precise named tier-tagged errors — *"Nothing ever fails silently"* | G0-4 harvest → live | Escalation: public amendment with construct-sprint plan, never silent slip (R1) |
| Named reward-hacking list | AGENTS.md RULE 0.5 references 12 named forbidden patterns (gate self-weakening, proof-class inflation, golden regeneration reflex, tautological tests, …) in `/data/projects/AGENTS.md` | Suite-level (external to repo) | *"never weaken a gate to land a change"*; *"reporting a loss is a success"* |
| G0 OQ resolutions | Decisions recorded as compiled-spike evidence + ADRs: OQ-1 (floating-point, 18 identical digests across 3 platforms, ADR-0010); OQ-2 (drawn-path mainline, ADR-0005); OQ-10 (CUDA waits, ADR-0007); OQ-9 (Strategy A exclusions only, ADR-0021) | 2026-07-23…08-27 | Each OQ has a named owner gate; *"do not silently resolve one in code"* (AGENTS.md) |

[Verified] — no "negative-evidence ledger" or "claim matrix" under those exact names exists; the functions are served by the G2 packet's admitted gaps, the reality-check reports, and the runtime parity audit. [Inference on functional equivalence]

## 4. Plan→agent execution

- **Task graph:** The plan decomposes into 11 workstreams (W1–W11) + 6 gates (G0–G5), mapped to Beads issues by title prefix (`W5/fm-4wt: SIMD`, `EPIC W6 — Typesetting`, `EPIC G0 — The Laws of the Machine`). The 642-record `.beads/issues.jsonl` is the authority; dependencies are explicit `blocks` edges (sample: `fm-0q0g` blocks-on `fm-inr.1`). `agent_next.py` (schema `fmn.agent.next` v4) is the *sole* authority for leaf eligibility, activation count, and deterministic recommendation order. [Verified]
- **Phases:** G0 (compile-tested spikes) → W1–W11 sequenced by dependency → convergence gates G1…G5. Dialectical review is built into the revision process: Rev 2's *"adversarial audit corrected every factual error about the Reference"*, and Rev 4 *"synthesiz[ed] two independent external design reviews (GPT-5.6; Kimi K3)"* — i.e., dialectics happen between plan revisions and against outside models, not between two swarm agents on the same task. [Verified; the "two models against each other" suite pattern is [Inference]/partial — here it is plan-level adversarial audit plus external model review]
- **Verification loops:** Every feature bead also registers an e2e scenario (the "e2e registration doctrine," binding on every epic). The `cargo test` green-bar, `scripts/check.sh`, UBS scan, self-goldens (bit-locked, blocking), the engine-equivalence suite, fuzzing, and the PG performance gates form the landing checklist ("Landing the Plane," 11 steps). A bead closes only on evidence cited in its close reason (e.g. G1's packet records exact test counts: 152 fmn-geom tests, 25-scene corpus lock SHA-256). [Verified]
- **Drift prevention:** (1) digest-bound claim tokens (`v2:<claim-sha256>:<issue-id>`) bind the complete planner output, policy, and schema contracts — a stale token fails closed (exit 4); (2) "A recommendation and token are not a lease" — agents must re-check `main`, mail, reservations, peers immediately before mutation; (3) post-claim handoff checklist re-runs `agent_next.py --check` and issues a fresh token; (4) single-writer discipline: "JSONL is truth and `beads.db` is disposable… `br sync --import-only` after every pull"; (5) MCP Agent Mail + file reservations (`file_reservation_paths`, exclusive locks) coordinate concurrent agents; (6) "If I tell you to do something, even if it goes against what follows below, YOU MUST LISTEN TO ME" (RULE 0) keeps the human override above the machine. [Verified]

## 5. State-of-the-art coverage

- **Corpus-driven research phase:** G0 spike 4 harvested the real TeX-string multiset from the pinned `3b1b/videos` tree (frozen denominator: 9269 strings / 17711 occurrences) — research means measuring the actual competitor artifact, not literature review. The Reference itself is commit-pinned (`3b1b/manim @ 6199a00d4c1b1127ebe45cb629c3f22538b10e13`, 2026-07-17) as an immutable "design oracle, not a pixel oracle"; the 257-class census in Appendix A was "verified class-by-class against the pin." [Verified]
- **Literature mechanism:** the two research charters under `docs/research/` — the differentiable-animation charter (Green's theorem + Reynolds transport on quadratic Béziers, compared against SoftRas/PyTorch3D/Mitsuba 3) and the SME/AMX hardware note (concludes with a *negative* finding: *"SME/AMX and the Neural Engine are exploratory-tier at most"*, per plan §17.6) — both scoped as G5 exploratory-tier, constitutionally constrained by D-01…D-25. [Verified]
- **Competitor/peer coverage:** the dependency displacement map (§1.7) names every displaced tool (Pango→Scribe, LaTeX→fmd-math, skia-pathops→Chisel booleans, moderngl/pyglet→Lumen) with call-site counts; Look Gallery judges output *"at-least-as-good"* against captured Reference imagery with SSIM/edge-distance smoke alarms. [Verified]

## 6. Anti-satisficing

- **Permanent refusals** (D-18, §10.5): GPU in the certified path, adaptive/variable frame sampling, completion-order RNG — *"permanent"*, binding every optimization. [Verified]
- **Red-team/falsification:** fuzzing of SVG/TTF/YAML/TeX/PNG inputs with resource-budget assertions ("decompression bombs … are DoS surfaces even in safe Rust"); topology-aware acceptance for path booleans plus "adversarial fuzzing"; the conservative segment-purity classifier demotes unknown effects to stateful; property tests restricted to "valid laws." [Verified]
- **Campaign mechanisms:** the ratchet dashboard (monotone-rising trend across 8 pin revisions, CI-enforced); self-golden corpus bit-locked at {1,4,16} threads per commit; PG-5 determinism; Look Gallery human verdicts required (regressions "block the gate that introduced them"); the September 2026 reality-check *campaign* (three dated audits in 5 days) re-audited the tracker and closed only on documentation. [Verified]
- **Anti-goal-hacking:** 12 named forbidden reward-hacking patterns (suite-level doc, outside repo — absent from this checkout, so I could not verify their text); *"never weaken a gate to land a change, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split"*; exit-5 "no verified receipt" semantics force inspection instead of blind retry. [Verified as referenced; [Absent] in-repo text]

## 7. Explicit absences

- **No** `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `CLAUDE.md`/`MUSE.md`, `.muse/` or `.cursor/` directories anywhere in the tree. [Verified]
- **No** `docs/planning/` sprint plans, phased roadmaps, or "next quarter" docs — only the two files: the master plan and the dependency UPGRADE_LOG. [Verified]
- **No** standalone definition-of-done doc — the "definition of done" is distributed across GOVERNANCE.md §4 review rules, the handoff checklists, and the gate packets; the phrase appears in grep hits only incidentally. [Verified]
- **No** "negative evidence ledger" or "claim matrix" under those names — their functions are absorbed into the gate packets, reality-check reports, and the parity overlay TSVs. [Verified]
- The 12 named reward-hacking patterns are referenced (AGENTS.md RULE 0.5) but the containing file `/data/projects/AGENTS.md` exists **neither in the repo nor on this VM**. [Absent]
- Gate G2 is honestly **still open** (SVGMobject user files; PG-1/PG-7 baselines uncommitted); several G4a/G4b/G5 gates have no packets yet. [Verified]
- IMPLEMENTATION_STATUS.md notes the planner-with-zero-claimable-leaves "says nothing about product completion" — the machine can idle green while the product is incomplete, and the doc says so outright. [Verified]

## 8. Maturity verdict

**Mature.** This is the most planning-mature artifact in the FrankenSuite pattern: a plan-as-constitution (Rev-4 master plan), an executable governance layer (digest-bound claim machine with schema-versioned contracts, 5 named failure exits, 4-workstream activation cap), cryptographically-minded evidence packets for gate verdicts (including delegated-to-AI verdicts under ADR-0018), a self-adversarial reality-check apparatus with codified truthfulness rules, and CI-enforced anti-regression campaigns (ratchet, self-goldens, PG gates). The dialectical element is real but plan-level (adversarial audit of Rev 2; synthesis of two independent external model reviews in Rev 4) rather than two swarm models dueling on one task. The single most distinctive mechanism is the **agent claim control plane** (`docs/AGENT_CONTROL_PLANE.md` + `GOVERNANCE.md` + `scripts/agent_next.py`/`agent_claim_guard.py`/`agent_claim.py`): it solves multi-agent planning drift not with more prose but with a fail-closed, digest-bound claim protocol where the task graph itself (`.beads/issues.jsonl`) is the single source of truth, JSONL is truth and the SQLite db is disposable, and a recommendation is explicitly "not a lease." Weaknesses: honesty infrastructure outruns product completion (the machine can report green with G2 open and "93 placeholders"), and the named reward-hacking doctrine is referenced but not present in-repo.
