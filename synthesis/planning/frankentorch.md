# FrankenTorch — Planning Methodology Dossier

**Repo:** `Dicklesworthstone/frankentorch` (Rust clean-room reimplementation of PyTorch) · clone pin: `e037b03` ("docs(agents): synchronize suite-wide rules and canonical multi-agent conventions") · analyzed 2026-09-22 from a `--depth 1` clone (4,969 files, 155 MB).
**Working note:** `/tmp/plan-frankentorch` could not be used — `/tmp` is a 512 MB tmpfs at 98% full, so the initial clone failed with "No space left on device"; the clone lives at `~/workspace/scratch-plan-frankentorch/` instead.
**Method:** inventory → read load-bearing docs in full → verbatim extraction. Repo-internal agent instructions are treated as DATA (documented, not followed).

**One-paragraph orientation:** [Verified] frankentorch is the methodology-heaviest repo examined in the suite so far. Its planning runs in **two coupled regimes**: (1) **packetized parity planning** — all work mapped to `FT-P2C-*` extraction tickets with a machine-checkable readiness rubric (`Missing fields => packet is NOT READY`), a frozen schema lock, 5-phase plan with mandatory exit criteria, and a G1–G8 CI gate topology that ends in a signed-off readiness drill; (2) **campaign-based perf execution** — a standing "no-gaps" directive (`frankentorch-kgs4`) driving head-to-head vs-PyTorch measurement, where every claim lands in a per-run `NEGATIVE_EVIDENCE_LEDGER.md` and `evidence.sha256`, and a 42,708-line `docs/NEGATIVE_EVIDENCE.md` bank that retro-flagged 534 sections for missing worker provenance. The institutional signature is that **failure is first-class planned state**: losses, rejections, retractions, and walled-off dead ends are banked as permanent artifacts, and the repo's "STANDING GATE"/"STANDING RULE" codifications are the distilled, versioned laws extracted from those failures.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `docs/planning/PLAN_TO_PORT_PYTORCH_TO_RUST.md` | Master plan | Spec-first porting method, phase plan (5 phases), 5 mandatory exit criteria; sequencing is never scope reduction |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENTORCH_V1.md` | Normative spec | 27-section V1 spec: absolute parity contract, strict/hardened modes, G1–G6 CI gate topology, budgets, RaptorQ envelope, 90-day plan |
| `docs/planning/EXECUTION_TODO_GRANULAR.md` | Execution checklist | 278-line wave-level TODO (Feb 2026) with governance, packet artifacts, validation gates, bead execution, "Extreme/Alien Uplift" passes |
| `docs/planning/PHASE2C_EXTRACTION_PACKET.md` | Ticket packets | 8 `FT-P2C-*` tickets with legacy anchors, target crates, oracle tests, per-ticket extraction schema (15 mandatory fields), risk tiering, readiness rubric |
| `docs/planning/FEATURE_PARITY.md` | Parity tracking | "tracks execution progress, not allowable scope reduction"; parity matrix + deferred subsystems with closure beads; required-evidence list |
| `docs/planning/PARITY-COVERAGE.md` | Coverage audit | CPU eager-mode 100% coverage claim vs PyTorch 2.x API, per-bead gap closures, explicit wontfix list (CUDA/distributed/JIT) |
| `docs/planning/EXISTING_PYTORCH_STRUCTURE.md` | Legacy analysis | 1,216-line behavior-anchored PyTorch structural survey with invariant IDs, risk tags, adversarial fixtures per subsystem |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` | Deep analysis | Phase-2 definition of done ("all section-3 rows have extraction artifacts…"); residual-gap assignment policy |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Architecture | Spec-first principles, 12-crate map, runtime flow, conformance contract |
| `docs/planning/FRANKENSQLITE_ADAPTATION_CROSSWALK.md` | Cross-project method transfer | Maps FrankenSQLite patterns (RaptorQ-everywhere, strict/hardened split, evidence ledgers) onto FrankenTorch; makes the FrankenSQLite comprehensive spec a *normative methodology exemplar* |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1_REFERENCE.md` | Methodology exemplar | 846 KB FrankenSQLite V1 spec vendored in-repo as the exemplar locked by §22 of the FrankenTorch spec |
| `docs/planning/PROFILING-RESULTS.md` | Baseline evidence | Single-threaded PyTorch 2.12.0+cpu vs FrankenTorch benchmark table with status legend (≤1.5x ok / >3x perf bug) |
| `docs/planning/UPGRADE_LOG.md` | Dependency log | Template-style upgrade log (empty tables) — mostly aspirational |
| `docs/NEGATIVE_EVIDENCE.md` | Honesty ledger | 42,708-line bank of dated WIN/NEGATIVE/REJECTED/RETRACTION entries + codified STANDING GATEs/RULEs distilled from measurement failures |
| `docs/RELEASE_READINESS_SCORECARD.md` | Release accounting | Per-bead gauntlet rows with result, before/after verdict, release action; measured-discipline score; current gates |
| `docs/UBS_POLICY.md` | Security-scan policy | UBS pre-commit policy, large-file handling, `UBS_SKIP` escape, CI integration |
| `AGENTS.md` | Agent operating instructions | 984-line agent lawbook: Rules 0/0.5/1, no-deletion, mandatory toolchain gates, beads workflow, RCH offloading, AST-search guidance; defers to off-repo suite-wide `/data/projects/AGENTS.md` (not present in clone) |
| `hooks/pre-commit` | Executable gate | UBS security gate with self-test (`--self-test`), positive-evidence parsing ("exit 0 is NOT evidence"), timeout-but-pass doctrine |
| `.beads/issues.jsonl` | Task tracker | 1,826 beads (JSONL, exported from beads.db): id, title, status, priority, issue_type, labels, description, comments, dependencies, created_by, source_repo |
| `artifacts/phase2c/` | Packet artifacts | Per-packet dirs `FT-P2C-00X/` (anchor maps, contract tables, fixture manifests, parity gates, risk notes, RaptorQ reports) + global policy docs |
| `artifacts/phase2c/READINESS_DRILL_SIGNOFF_V1.md` | Sign-off | G8 readiness sign-off with gate snapshot, evidence traceability, residual risk register, closure criteria |
| `artifacts/phase2c/RELIABILITY_GATE_WORKFLOW_V1.md` | Gate workflow | G1–G8 gate topology: contract, primary command(s), blocking evidence artifacts per gate; G8 enforcement mode |
| `artifacts/phase2c/SCHEMA_LOCK_V1.md` | Schema freeze | Required files + mandatory JSON fields per packet; missing file ⇒ `NOT_READY` |
| `artifacts/phase2c/TEST_LOG_CONTRACT_V1.md` | Logging contract | Structured forensic log schema (scenario_id, seed, mode, env_fingerprint, artifact_refs, replay_command, outcome, reason_code) |
| `artifacts/phase2c/ESSENCE_EXTRACTION_LEDGER_V1.md` | Extraction traceability | Row-level legacy anchors with uncertainty tags |
| `artifacts/phase2c/SECURITY_COMPATIBILITY_THREAT_MATRIX_V1.md` + `HARDENED_DEVIATION_ALLOWLIST_V1.json` | Compatibility policy | Threat matrix; explicit allowlist-only policy for hardened-mode deviations |
| `artifacts/perf/frankentorch-*/<run>/NEGATIVE_EVIDENCE_LEDGER.md` | Campaign evidence | 303 perf campaign dirs; per-run ledgers with agent, run id, commit head, target, lever, rationale, baseline/after commands, delta verdict table |
| `artifacts/optimization/` | Optimization records | Per-lever optimization evidence + isomorphism proof artifacts |
| `scripts/` + `benchmarks/` | Harnesses | h2h (head-to-head) gauntlet benches (`pytorch_gauntlet_bench`), measurement-window guards, loadavg spread guards |

**Not present (root-level equivalents):** no `ROADMAP.md`, no `BEADS.md`, no `TODO.md`, no `PLAN.md` [Absent]; `docs/research/` absent; `docs/` holds only `NEGATIVE_EVIDENCE.md`, `RELEASE_READINESS_SCORECARD.md`, `UBS_POLICY.md`, and `planning/` [Verified]. No `CLAUDE.md`/`MUSE.md`/`.muse/` [Absent]. `.github/workflows/` exists but carries only 2 files (`phase2c_reliability_gates.yml`, `dynamic_int8_exact.yml`) [Verified].

---

## 2. Execution-readiness gates

[Verified] frankentorch's gates are layered and quoted verbatim below. A plan must pass **six** distinct gate families before agents are "set free":

**A. Mandatory exit criteria (plan level)** — `docs/planning/PLAN_TO_PORT_PYTORCH_TO_RUST.md` §6, "Mandatory Exit Criteria":
> 1. Differential parity green for full drop-in target surface.
> 2. No unresolved critical semantic drift.
> 3. Performance gates pass without correctness regressions.
> 4. RaptorQ sidecar artifacts validated for conformance + benchmark evidence.
> 5. No intentional feature/functionality omissions remain.

**B. Absolute parity doctrine** — `README.md`, quoted as [Maintainer claim]:
> - no permanent scope cuts accepted as a release condition
> - no "minimal viable parity" acceptance standard
> - sequencing is allowed only as temporary execution order, never as feature removal
> - every temporary gap must map to explicit parity-closure beads plus conformance evidence

**C. Packet readiness rubric (machine-checkable)** — `docs/planning/PHASE2C_EXTRACTION_PACKET.md` §10, "Packet Readiness Rubric". Packet is `READY_FOR_IMPL` only when [Verified]:
> 1. extraction schema complete,
> 2. fixture manifest includes happy/edge/adversarial paths,
> 3. strict/hardened gates are machine-checkable,
> 4. risk note includes compatibility + security mitigations,
> 5. parity report has RaptorQ sidecar + decode proof.

And the enforcement: [Verified] "Machine-check command: `cargo run -p ft-conformance --bin validate_phase2c_artifacts`. Non-zero exit means at least one packet is `NOT_READY`." The 15-field per-ticket extraction schema is mandatory: [Verified] "`Missing fields => packet is NOT READY.`"

**D. Per-ticket artifact topology** — `artifacts/phase2c/SCHEMA_LOCK_V1.md` [Verified]: "Each packet directory `artifacts/phase2c/FT-P2C-00X/` MUST include: 1. `legacy_anchor_map.md` 2. `contract_table.md` 3. `fixture_manifest.json` 4. `parity_gate.yaml` 5. `risk_note.md` 6. `parity_report.json` 7. `parity_report.raptorq.json` 8. `parity_report.decode_proof.json`. Missing any file => packet status `NOT_READY`."

**E. G1–G8 release gates** — `artifacts/phase2c/RELIABILITY_GATE_WORKFLOW_V1.md` [Verified], each with contract, primary command, and blocking evidence artifacts:
| Gate | Contract |
|---|---|
| G1 | fmt/lint hygiene |
| G2 | unit/property + structured log contract |
| G3 | differential/metamorphic/adversarial parity |
| G4 | e2e replay + forensics completeness |
| G5 | perf tails + isomorphism |
| G6 | artifact schema + packet lock validation |
| G7 | RaptorQ decode/integrity durability |
| G8 | readiness sign-off + residual risk |

[Verified] G8 enforcement: "default CI runs keep `G8` declared but deferred. run `workflow_dispatch` with `enforce_g8=true` to make `G8` blocking once readiness drill artifacts exist." The sign-off itself is `artifacts/phase2c/READINESS_DRILL_SIGNOFF_V1.md` (bead `bd-3v0.11`, owner `WhiteGlacier`), whose "Closure Criteria for Final G8 Sign-off" requires bead closure, CI run success (`22078989645`), and sign-off document updated to READY.

**F. Validation gates (wave level)** — `docs/planning/EXECUTION_TODO_GRANULAR.md` §6, "Validation Gates (Mandatory)" [Verified]:
> - `cargo fmt --check`
> - `cargo check --all-targets`
> - `cargo clippy --all-targets -- -D warnings`
> - `cargo test --workspace`
> - `cargo test -p ft-conformance -- --nocapture`
> - `cargo bench`
> - verify checksum artifacts (`sha256sum -c ...`)

**G. Required evidence per feature family** — `docs/planning/FEATURE_PARITY.md` [Verified]:
> 1. Differential fixture report.
> 2. Edge-case/adversarial test results.
> 3. Benchmark delta (when performance-sensitive).
> 4. Documented compatibility exceptions (if any).
> 5. RaptorQ sidecar + decode-proof chain for durable parity bundles.

**H. Alien-artifact decision layer** — `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENTORCH_V1.md` §6 [Verified]: runtime controllers must document "1. state space 2. evidence signals 3. loss matrix with asymmetric costs 4. posterior or confidence update model 5. action rule minimizing expected loss 6. calibration fallback trigger", with "evidence ledger entries for consequential decisions" and "calibrated confidence metrics and drift alarms".

**I. Extreme optimization contract** — same spec §7 [Verified], "Optimization loop is mandatory": "1. baseline metrics 2. hotspot profile 3. single-lever optimization 4. behavior-isomorphism proof 5. re-profile and compare. No optimization is accepted without associated correctness evidence."

---

## 3. Honesty guardrails

[Verified] The negative-evidence system is installed at the **top** of the lifecycle, not as an afterthought — it's the repo's distinctive organ:

- **Ledger location:** `docs/NEGATIVE_EVIDENCE.md` (42,708 lines) plus per-campaign-run ledgers (`artifacts/perf/frankentorch-<bead>/<run>/NEGATIVE_EVIDENCE_LEDGER.md`) with agent name, run id, commit head, target, lever, rationale, baseline/after commands, and a delta verdict table. 303 campaign directories exist under `artifacts/perf/`.
- **Standing rule 1** (adopted 2026-08-15 via bead `frankentorch-banfj`) [Verified, verbatim]: "## STANDING GATE: A ROW NAMES ITS WORKER *AND* ITS HARNESS, OR IT IS NOT A ROW". Four rules follow: name the worker (same machine, same invocation); name the harness ("When two harnesses disagree, the disagreement is the finding. Do not pick between them."); name the estimator and quote under both median and min ("Where the two estimators disagree in direction, that is a red flag to record, not to resolve by preference."); replicate before quoting a standing (report conservative bound across runs).
- **Standing rule 2** [Verified, verbatim]: "## STANDING RULE FOR EVERY LEVER: SPLIT THE PHASE BEFORE YOU CHOOSE THE LEVER" — "Do not pick an optimization target by reading the source. Split the work into phases, measure each, and aim at the largest one." Codified after four paid-for failures, incl. one where a 4.24x isolated win became 1.13x SLOWER at the lane.
- **Retro-flagging** [Verified]: "Counted mechanically against commit `dcc6a1f5` on 2026-08-15, not estimated: 760 ledger sections, 684 banking ≥1 ratio, 150 naming a machine, **534 naming none**… **Those 534 sections are hereby flagged worker-scoped and not cross-machine comparable.** They are flagged wholesale… Flagging is not retraction. A flagged row may well be true; what is missing is evidence that it survives a change of machine." The 19k-line historical document was mechanically audited *against its own honesty standard*.
- **Reward-hacking taxonomy** [Verified, `AGENTS.md` Rule 0.5] points to the off-repo suite-wide `/data/projects/AGENTS.md` (not present in this clone — referenced but unverifiable here) carrying "12 named patterns, several already observed in this suite: gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." Three are called out as decisive in-repo: "a self-speedup is MAINTENANCE, not a win — a win needs the incumbent live in the SAME invocation; never weaken a gate to land a change… and reporting a loss is a success — one line, revert, next lever, no retraction narrative." The ledger itself demonstrates enforcement, e.g. [Maintainer claim]: "★CORRECTION/RETRACTION: block_diag + embedding_bag + tril/triu F64 'wins' were ~0-gain (measurement error), REVERTED" and "★★ WIN … 2.33-3.18x vs original, bit-exact".
- **Demotion:** [Absent] as a formal rule. The closest is measurement-scoped, `docs/NEGATIVE_EVIDENCE.md` line ~19781 [Verified]: a candidate "landed anyway" with explicit provisional status — "What is unproven is the SIZE of the benefit on this host… A future measurement on a quiet machine, or on a shape with a larger `spatial`, should either certify it or demote it."
- **Claim matrix as named artifact:** [Absent]. The functional equivalent is distributed: the conformance matrices in `EXISTING_PYTORCH_STRUCTURE.md` (behavior ID → unit/property + differential/adversarial + e2e/logging anchors per claim), the G1–G8 gate table, and the per-packet parity gates.
- **Receipt-bound evidence** [Verified]: every packet carries `parity_report.raptorq.json` + `parity_report.decode_proof.json`; campaigns carry `evidence.sha256`; the pre-commit hook demands "POSITIVE execution evidence over exit codes" ("absent" and "zero findings" are different claims — its `--self-test` encodes the negative-evidence epistemology into shell code).
- **When installed:** core honesty machinery (packet schema, G1–G8, parity gates, RaptorQ) dates to Feb 2026; the no-gaps perf campaign started 2026-06-02 (bead `frankentorch-kgs4` references "broadcast to all 27 agents"); the STANDING GATE/estimator rules are Aug 2026 refinements from cross-project incidents.

---

## 4. Plan→agent execution

[Verified] Execution is mediated through three mechanisms, all machine-readable:

1. **Beads task graph** — `.beads/issues.jsonl`: 1,826 beads, schema `{id, title, status, priority, issue_type, labels, description, created_at/updated_at/closed_at, close_reason, created_by, compaction_level, source_repo, dependencies[], acceptance_criteria (rare), comments[]}`. Status distribution: **1,782 closed / 38 in_progress / 4 open / 1 blocked / 1 wontfix**. Type mix: task 853, bug 433, feature 270, perf 254, docs 15, question 1. Labels (n=457 labeled): perf 377, `no-gaps` 228, optimization 189, crate-scoped labels (ft-api 174, ft-kernel-cpu 126), doctrine labels (`extreme-software-optimization`, `alien-artifact-coding`, `alien-graveyard` applied to open/in-progress beads). `issue_prefix: frankentorch` in config.yaml. Active work is ~entirely the perf campaign: `[perf][svd]`, `[perf][linalg]`, `[measure][board]`, h2h rows vs PyTorch 2.12.1+cpu with exact gaps (e.g. "[perf][conv2d] conv2d is 7.4-8.8x SLOWER on the training route").
2. **Directive broadcast pattern** — the root `frankentorch-kgs4` bead (label `directive`) [Verified, from beads]: "NO vs-upstream perf gap is acceptable or 'architectural'… Method: profile -> /alien-graveyard (canonical docs /data/projects/alien_cs_graveyard/*.md) + /alien-artifact-coding to harvest the technique -> /extreme-software-optimization to ship (one lever/commit, isomorphism proof + golden sha256, Score>=2.0, re-bench via rch crate-scoped)." The "alien-graveyard" score gate (Impact×Confidence/Effort ≥ 2.0) is enforced in ledger rows ("Below the Score>=2.0 bar", "fails Score>=2.0"). Note: the directive text lives at `/data/projects/.scratch/no_gaps_directive.txt` — off-repo, unverifiable in this clone [Inference].
3. **Agent mail + file reservations** — `AGENTS.md` prescribes MCP Agent Mail identities/threads and exclusive file reservations with bead-id-as-thread-id (`[br-123]` prefix convention); `EXECUTION_TODO_GRANULAR.md` §8–10 shows it in practice ("Reserve implementation files through Agent Mail", "Fetch/respond to Agent Mail inbox messages after MCP transport recovery", fallback to bead comments when transport down). `bv --robot-triage` is the single triage entry point (graph metrics: PageRank/betweenness/cycles; "CRITICAL: Use ONLY `--robot-*` flags. Bare `bv` launches an interactive TUI that blocks your session.").

**Verification loops:** dual execution modes (strict vs hardened, both required for green); A/A null gates on measurement ("both A/A nulls passing in 5 of 6" is quoted as *certification*); incumbent arm must be live in the same invocation; incumbent version is part of provenance (`PT_TORCH_VERSION` self-reported by harness, hard-fails if absent).

**Drift prevention:** [Verified] strict-mode telemetry split (`strict` fails on reentrant overflow, `hardened` bounded fallback), "no behavior-altering repairs" in strict; parity-drift CI gates (G3); schema lock frozen; "No intentional feature/functionality omissions remain" as exit criterion. Notably **no permanent exclusions are representable in the tracking system at all** — deferred items must remain beads with closure dependencies ([Verified], §4 of PLAN doc and Gap Policy).

**Dialectical model-vs-model review:** [Absent] in this repo's docs — nothing prescribes two models reviewing/grading each other, nor red-team review sessions. "Adversarial" here consistently means adversarial *test fixtures* (malformed payloads, unknown dispatch keys, fuzz corpus manifest), not adversarial *reviewers*. The PARITY-COVERAGE audit was performed by a single agent ("Audit agent: Opus") with no counter-reviewer recorded. Closest structural equivalent: the two-estimator rule and A/A null gates (disagreement treated as signal, not resolved by preference).

---

## 5. State-of-the-art coverage

[Verified] Three mechanisms:

1. **`EXISTING_PYTORCH_STRUCTURE.md`** (1,216 lines) — the canonical legacy-survey doc: per-symbol legacy anchors, invariant IDs with property-test candidates, risk tags, compatibility obligations, adversarial anchors, and e2e/replay expectations. Pairs with `EXHAUSTIVE_LEGACY_ANALYSIS.md` (definition of done: "all section-3 rows have extraction artifacts, all seven fixture families runnable, comprehensive-spec G1-G6 gates trace to concrete outputs").
2. **`artifacts/phase2c/FT-P2C-00X/legacy_anchor_map.md`** — per-packet path+line anchors with extracted behavior, the concrete unit of legacy coverage; validation is a machine gate (`validate_phase2c_artifacts`).
3. **`docs/planning/PARITY-COVERAGE.md`** — explicit audit methodology [Verified, verbatim]: "1. Enumerated PyTorch 2.x public API from official docs 2. Grepped ft-api/ft-nn/ft-optim for matching implementations 3. Verified implementations are functional (not stubs) via mock-code scan 4. Filed beads for every missing item with justification 5. Calculated coverage % per category." Claims 100% CPU eager-mode coverage with completed gap closures per bead (`frankentorch-t9pi` lazy modules, `frankentorch-ulg7` Muon optimizer, `frankentorch-ln6y` Bessel functions, etc.).
- **FrankenSQLite crosswalk** (`FRANKENSQLITE_ADAPTATION_CROSSWALK.md` + 846 KB vendored reference spec) is *the* explicit inter-project knowledge-transfer mechanism [Verified] — §22 of the FrankenTorch spec makes it "Normative": "Any major FrankenTorch spec evolution SHOULD include an explicit crosswalk entry."
- **Per-campaign peer learning** [Maintainer claim]: the STANDING GATE was "Adopted 2026-08-15 from three sibling projects that each paid for it separately" (frankenlibc, frankenfs, franken_numpy) — cross-suite measurement failures codified repo-locally.

---

## 6. Anti-satisficing

[Verified] The campaign machinery is explicitly designed to defeat "good enough":

- **The no-gaps directive** [Verified, bead `frankentorch-kgs4`]: "Close ALL vs-upstream perf gaps in pure safe Rust — no C BLAS/LAPACK/XLA linkage"; "NO vs-upstream perf gap is acceptable or 'architectural'." 228 `no-gaps`-labeled beads.
- **The score gate** [Verified]: alien-graveyard candidate must pass "Impact*Confidence/Effort >= 2.0" (crosswalk §3); ledger rows cite the bar explicitly.
- **The measurement board** [Verified]: `[measure][board]` beads ("audit every h2h lane for the sum()-loss blind spot", "refresh pre-absolute-floor standing rows under fixed guard") — measurement hygiene is itself tracked work with its own campaign prefix.
- **Measured-discipline score** [Verified, `RELEASE_READINESS_SCORECARD.md`]: "Measured-discipline score: `33/33` for the gauntlet lanes/features."
- **Falsification culture** [Maintainer claim]: the ledger bank's section titles are the mechanism — dated entries of the form "NEGATIVE: … REVERTED", "REJECTED: …", "★CORRECTION/RETRACTION: …", "WALLED (measured, don't pursue)". The top-of-file honest statement of campaign state: "Exactly one vs-PyTorch row is quotable — `prelu_noshortcut` — and the honest statement of it is the empirical one from item 14e… One of fourteen lanes became quotable. Everything else remains uncertified."
- **Red-teaming / falsification loops:** [Absent] as a named practice — there is no red-team phase or falsification ritual beyond the adversarial fixtures and the measurement gates. The FUNCTION of red-teaming is absorbed by the negative-evidence ledger and the reward-hacking taxonomy, but no doc says "run a red team".
- **Campaign mechanisms:** artifacts/optimization one-lever records; behavior-isomorphism proof required per lever ("dispatch ordering preserved; tensor metadata invariants preserved; gradient behavior preserved"); `tests/artifacts/perf/*/rejection_evidence.md` from early boldox-era runs; `rejection_evidence` logs in perf dirs.

---

## 7. Explicit absences

[Absent] items checked against the suite pattern, with exact scope:

1. **Root ROADMAP.md / BEADS.md / TODO.md / PLAN.md / CLAUDE.md / MUSE.md / `.muse/`** — none exist. Granular execution tracking lives in `docs/planning/EXECUTION_TODO_GRANULAR.md` (dated wave checklist, not a standing TODO).
2. **`docs/research/` or literature-review artifacts** — absent; research is legacy-survey (`EXISTING_PYTORCH_STRUCTURE.md`) and oracle-driven, not literature-driven.
3. **ADRs** — absent as named documents; design decisions are recorded inside risk notes, crosswalk docs, and ledger entries.
4. **Named claim matrix** — absent; equivalents distributed across conformance tables.
5. **Named auto-demotion rule** — absent; demotion language appears only in a single measurement-provisional context.
6. **Dialectical two-model review / red-team planning phase** — absent. Adversarial = fixtures, not reviewers.
7. **"Never compact sessions"** — absent from repo docs (all "compaction" hits are memory/allocator terms).
8. **The suite-wide `/data/projects/AGENTS.md`** (source of the 12 reward-hacking patterns and Work-Graph Discipline) — referenced by `AGENTS.md` Rule 0.5 but **not present in this clone** (local path on the maintainer's machine); unverifiable here.
9. **Off-repo planning dependencies** — `AGENTS.md` defers perf anti-reward-hacking rules to the missing suite file; the no-gaps directive references `/data/projects/.scratch/no_gaps_directive.txt`; tools reference `/data/projects/AGENTS.md`, `alien_cs_graveyard/*.md`, `legacy_pytorch_code/pytorch` mirror. The *planning doctrine* is therefore partially externalized beyond the repo boundary.

---

## 8. Maturity verdict

**MATURE** — and the most methodologically developed of the suite examined so far [Inference from comparison to suite pattern].

Why mature [Verified]:
- **Normative spec → machine gates:** the 27-section V1 spec binds to a frozen schema lock, a machine-checkable readiness rubric (`validate_phase2c_artifacts`), and a CI-enforced G1–G8 topology ending in a signed-off readiness drill with residual-risk register.
- **Planning is executable:** 1,826 beads with dependency edges, robot-triage entry points, file-reservation protocols, and an 11-section granular execution TODO that records *how waves were actually run* (Agent Mail recovery, uplift passes, cycle-safety verification).
- **Honesty is infrastructural:** the negative-evidence ledger isn't a log — it's the artifact that produced standing rules, retro-flagged 534 sections of its own history, and is backed by a reward-hacking taxonomy with named forbidden patterns.
- **Planning loop is closed:** failures change the rules (three cross-project incidents → one STANDING GATE; four paid-for measurement errors → one STANDING RULE; the hook's `--self-test` encodes epistemic discipline in executable form).

Why not merely "developing": there is **no observed gap between doctrine and artifact**. The plan says packets must carry RaptorQ decode proofs — packet dirs contain them. It says every gap needs a closure bead — PARITY-COVERAGE closes gaps bead-by-bead and names wontfix items explicitly. It says losses are successes — 303 campaign ledgers bank rejections. The one area where doctrine outruns in-repo evidence is the off-repo dependency (suite-wide AGENTS.md, no_gaps_directive.txt, alien_cs_graveyard docs) — noted in §7.9.

**Characteristic weaknesses of this planning style (in its own terms):** the machinery is expensive and slow — 42,708 lines of ledger, 1,826 beads, per-run ledgers — and the honesty standard is so strict that "exactly one vs-PyTorch row is quotable" out of fourteen lanes. This is a system that would rather understate than overclaim, at high operational cost [Inference].
