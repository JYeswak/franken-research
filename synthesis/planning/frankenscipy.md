# Planning Methodology — frankenscipy

**Repo:** https://github.com/Dicklesworthstone/frankenscipy (clone of 2026-09-22, depth 1, 8324 files)
**Analyst:** planning-methodology subagent | **Date:** 2026-09-22

Scope note: this reverse-engineers HOW Emanuel plans, not what he built. All doc quotes below are repo DATA, documented not followed. One deviation: the repo (509 MB) could not fit in `/tmp/plan-frankenscipy` — `/tmp` is a 512 MB tmpfs at 97% full from sibling analyses — so the clone lived at `~/workspace/.scratch-plan-frankenscipy/`, deleted after extraction.

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` | Agent operating constitution | ~750-line rulebook: RULE 0/0.5/1, file/mail/bead coordination, anti-reward-hacking patterns, compiler gates, MCP Agent Mail + bv + ubs + rch + cass tooling; anchors "reporting a loss is a success" |
| `docs/planning/PLAN_TO_PORT_SCIPY_TO_RUST.md` | Porting method + phase plan | 6-line methodology: spec-first → implement from spec → differential conformance → gate optimizations behind behavior-isomorphism; 5 phases + 4 mandatory exit criteria |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENSCIPY_V1.md` | Product spec | Prime directive, V1 scope contract (in/out), strict/hardened compatibility model, CASP crown jewel, fail-closed policy |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` | Deep-extraction planning | Phase-2 legacy extraction contract; defines 12 sequential DOC-PASSes incl. **DOC-PASS-12 red-team contradiction review** with contradiction register |
| `docs/planning/EXISTING_SCIPY_STRUCTURE.md` | Legacy cartography | SciPy subsystem map + semantic hotspots that must be preserved |
| `docs/planning/PHASE2C_EXTRACTION_PACKET.md` | Plan→ticket conversion | Turns Phase-2 analysis into 8 implementation packets (FSCI-P2C-001..008) with legacy anchors, target crates, oracle tests, per-ticket extraction schema (14 mandatory fields; missing field → `NOT READY`), risk tiers, packet readiness rubric |
| `docs/planning/MASTER_EXECUTION_TODO.md` | Executable plan checklist | Granular checkbox execution plan for a full build pass; all boxes checked incl. §6 quality gates and §7 closeout |
| `docs/PHASE2C_SIGNOFF.md` | Gate sign-off record | Dated readiness sign-off by an agent identity: G1–G8 gate table, 8 packet evidence packs, foundation beads closed, known-issue log |
| `docs/OPTIMIZATION_PROTOCOL.md` | The honesty gate | Complete decision rule for perf changes: bootstrap-CI gate, 7 measurement requirements, result classes, enforced pre-commit ledger preflight |
| `docs/NEGATIVE_EVIDENCE.md` | Win/loss ledger (BOLD-VERIFY entry) | Every measured perf result — KEEP/REJECT/RESURRECTED/BLOCKER — with profile attribution, A/B + A/A null, ELF SHA-256, worker/harness identity, and a concrete retry predicate per row |
| `docs/progress/perf-negative-results.md` | Canonical detailed ledger | The detailed per-attempt record NEGATIVE_EVIDENCE.md points to; one source of truth |
| `docs/LEDGER_RESURRECTION.md` | Audit of REJECTs | Fleet-meta-lever audit hand-adjudicating 169 REJECT rows into VALID/VOID classes; resurrected 3 wins killed by a wrong `cv` gate |
| `docs/KEEP_CLAIM_GATE_AUDIT.md` | Claim-gate audit | Mechanical audit of all 481 KEEP claims: only 2.9% gated on same-invocation incumbent; honest partition into self-speedups vs unmeasured conversions |
| `docs/ORACLE_WORKFLOW.md` | Oracle capture protocol | Canonical SciPy-oracle regeneration workflow; defines the SciPy-present CI lane |
| `docs/GAUNTLET_RELEASE_SCORECARD.md` | Internal release routing | Performance head-to-head scorecard; carries its own "not a published claim" warning and worker/harness-identification notice |
| `docs/progress/perf-release-readiness-scorecard.md` | Dated closeout records | Per-date verification sweeps with supersession pointers to the ledger |
| `docs/ARTIFACT_TOPOLOGY.md` | Artifact governance | Topology-locked artifact dirs + schemas; changes need bead proposal + owner approval |
| `docs/DOC_PASS_00_GAP_MATRIX.md` .. `DOC_PASS_04_*.md` | Spec-writing campaign | Gap matrix with quantitative expansion targets per doc/section (e.g. "17x expansion, 6% complete, critical") — planning the planning docs themselves |
| `docs/planning/FEATURE_PARITY.md`, `PARITY-COVERAGE.md` | Coverage tracking | Parity state per packet; updated at milestone boundaries |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Architecture plan | Crate-level design and boundaries; updated as flows land |
| `docs/planning/SPEC_CROSSWALK_FRANKENSQLITE_TO_FRANKENSCIPY.md` | Methodology inheritance | "Inheritance-first, divergence-explicit": maps FrankenSQLite pattern families to frankenscipy adaptations with mandatory divergence notes |
| `docs/archive/GEMINI_*.md` | Dialectical review artifacts | Gemini's spontaneous review reports of Codex's implementation (dropped in-repo when MCP mail SQLite was corrupted) — critical/bug findings per crate |
| `.beads/issues.jsonl` | Work-graph DB (JSONL truth) | 4386 beads: 4383 closed, 3 open (all infra: rch worker-capability, SciPy pinning, clippy lottery); schema carries `compaction_level`, labels, priority |
| `scripts/ledger_preflight.py` | Enforced honesty gate | Pre-commit hook: blocks REJECT without A/A null or counted mechanism, cv-only REJECTs, KEEPs without ELF SHA or result class |
| `scripts/keep_claim_gate_audit.py`, `ledger_retry_remap.py`, `toggle_driver_census.py`, `check_frozen_elf_provenance.py` | Audit tooling | Read-only, re-runnable auditors that produce the gate audits above |
| `crates/fsci-conformance/tests/evidence_p2c*.rs` | Receipt-bound evidence | Per-packet executable evidence packs asserting every parity gate; the unit of sign-off |
| `docs/P2C-001`, `P2C-001_ivp_*.json` | Packet artifacts | Legacy anchor maps and behavior ledgers shipped per packet |
| `docs/schemas/*.schema.json` | Contract schemas | Behavior ledger, contract table, threat matrix schemas (topology-locked) |
| `quality_gates.toml` | SLO definitions | Coverage/branch floors per crate, flake budgets, runtime budgets, violation severities |

## 2. Execution-readiness gates

A plan must pass through a layered gate topology before agents are "set free," and every layer is machine-checked or sign-off-recorded.

**The porting method (verbatim, `docs/planning/PLAN_TO_PORT_SCIPY_TO_RUST.md`):**

> "This project follows the spec-first porting-to-rust method:
> 1. Extract legacy behavior into executable specs.
> 2. Implement from spec, not line-by-line translation.
> 3. Use differential conformance to prove parity.
> 4. Gate optimizations behind behavior-isomorphism checks."

**The six mandatory exit criteria for the whole plan (same file):**

> "1. Differential parity green for scoped APIs. 2. No critical unresolved semantic drift. 3. Performance gates pass without correctness regressions. 4. RaptorQ sidecar artifacts validated for conformance + benchmark evidence."

**The 8-gate CI topology for phase closeout (`docs/PHASE2C_SIGNOFF.md`, verified gates G1–G8):** G1 formatting+linting, G2 unit+property tests, G3 differential conformance, G4 adversarial regression, G5 E2E scenario orchestration, G6 performance regression, G7 schema validation, G8 RaptorQ proofs. Sign-off is dated and agent-attributed [Verified]: "Date: 2026-03-04 … Conducted by: CobaltBear (claude-code/opus-4.6)".

**Packet readiness rubric (`docs/planning/PHASE2C_EXTRACTION_PACKET.md`):** a packet is `READY_FOR_IMPL` only when "1. extraction schema complete, 2. fixture manifest includes happy/edge/adversarial paths, 3. strict/hardened gates are machine-checkable, 4. risk note includes compatibility + security mitigations, 5. parity report has RaptorQ sidecar + decode proof." [Verified]

**Compiler gates (`AGENTS.md`):** after any substantive change: `cargo check --workspace --all-targets`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --check` [Verified].

**The perf KEEP gate (`docs/OPTIMIZATION_PROTOCOL.md`):**

> "A speedup claim is DECIDED if and only if: the candidate's 95% percentile-bootstrap CI lower bound on the median of per-round ratios (10,000 deterministic resamples) exceeds `1 + 2 × (null_edge − 1)`, where `null_edge` is the worse side of the A/A null's own 95% CI. Everything else is IN-FLOOR / NOT DECIDED."

And the seven requirements, summarized verbatim-flavored: profile first and name the frame (≥0.1% self-time); prove behaviour first with raw bits (`to_bits()`), not tolerance; execution proof via hit counter or differing checksum; same binary, both arms, one invocation (toggle with `AtomicBool`); A/A null in the same invocation, interleaved, order alternating; self-reporting ELF SHA-256 on line 1; `min_of` inner replicates (lane default `min_sample = 2 ms`, `min_of = 3`).

**Machine-checked enforcement (`docs/OPTIMIZATION_PROTOCOL.md`, "Enforced ledger preflight"):** `scripts/ledger_preflight.py` runs as a pre-commit hook and exits 2/BLOCKED when: "a REJECT without either measured same-invocation A/A values or a counted mechanism"; "a cv-only REJECT"; "a KEEP without a 64-hex SHA-256 identified as the executed ELF/binary"; "a KEEP without `Result class: CAMPAIGN-WIN` or `Result class: SELF-SPEEDUP`"; "a `CAMPAIGN-WIN` without a named SciPy legacy-incumbent arm, an unambiguous incumbent ratio, and side-by-side same-invocation evidence"; "a `SELF-SPEEDUP` titled as a win." [Verified]

## 3. Honesty guardrails

This is the repo's most distinctive planning layer — the mechanism by which plans police their own truthfulness.

**Negative-evidence ledger** (`docs/NEGATIVE_EVIDENCE.md`, canonical detail at `docs/progress/perf-negative-results.md`). Every perf result — keep or reject — gets a row recording hypothesis, profile attribution, the ONE lever, behaviour proof, A/B *and* A/A null with worker id + harness id + binary sha, verdict, and "a concrete retry predicate." Rows include `REJECT: live SciPy GMRES wins at side 64 and 96 — Decision: REJECT LARGE-N COMPETITIVE GENERALIZATION`, i.e. losses are recorded as wins for the *ledger*, never deleted. [Verified]

**Claim gate audit** (`docs/KEEP_CLAIM_GATE_AUDIT.md`, run 2026-07-30 by "the cc pane (BlackThrush), unprompted by any specific defect") [Verified]. Headline:

> "We hold 481 KEEP claims. 14 (2.9%) carry a vs-incumbent ratio measured with the incumbent live in the same invocation. 467 (97.1%) do not. … We are worse than frankenfs on the metric it published, and far worse on the stricter same-invocation metric."

**Pre-registration** (falsification before measurement). Mechanisms and retry predicates are committed *before* any harness runs — e.g. `tests/artifacts/perf/2026-07-31-solve-ivp-many-exclusive-rerun/` PREREGISTERED mechanism. The 2026-07-31 exclusive rerun adjudicated a preregistered scaling mechanism as **FALSIFIED** (`frankenscipy-ldx0f` must not ship a thread cap) while the 464.4884× whole-job win stood — the ledger records both, separating mechanism from outcome [Verified].

**Ledger resurrection** (`docs/LEDGER_RESURRECTION.md`). A fleet meta-lever audit hand-adjudicated 169 REJECT rows into six classes (VALID-PROFILE / VALID-MECHANISM / VALID-AB / VOID-CV / VOID-ZEROSELF / VOID-NONULL + supplemental VOID-ISA). Finding [Verified]: "56.2% of standing REJECTs were VOID — the measurement could not have detected the lever, so the harness was rejected, not the lever." Three wins were literally resurrected: `.165` BDF exact-diagonal Newton at 97.68–109.37×, `.166` segmented cubic cursor 4.268×, `.167` trust-exact SPD Cholesky 1.49×. It also records honest non-resurrections: ".168 … is void as a cv-kill but explicitly not a win."

**Anti-reward-hacking** (`AGENTS.md` RULE 0.5, inheriting suite-wide rules): 12 named forbidden patterns — "gate self-weakening…, proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." [Verified]. Plus three live rules: "a self-speedup is MAINTENANCE, not a win — a win needs the incumbent live in the SAME invocation; never weaken a gate to land a change … reporting a loss is a success — one line, revert, next lever, no retraction narrative." [Verified]

**Lifecycle timing:** guardrails are installed at different stages: the 12 forbidden patterns and work-graph discipline are install-time (`AGENTS.md` RULE 0.5, read before any work); the perf gate + ledger preflight were added mid-campaign after measured damage (protocol "Rewritten 2026-07-25" because the old `cv` gate "rejected four frontier candidates whose measured effects were 1.20×, 1.47×, 3.82× and 17–19×"); the resurrection audit and claim-gate audit are retroactive self-corrections (2026-07-25/07-30). This is planning-as-learning: the plan amends itself after measured failure, and records the amendments.

**What the ledger requires of every row:** "Grep both ledgers before proposing a lever" — enforced by `scripts/ledger_preflight.py --propose` before touching source (exit 2 = BLOCKED if a sound prior rejection covers the proposal) [Verified].

## 4. Plan→agent execution

**Task graphs:** `.beads/issues.jsonl` (4386 beads; schema: id/title/status/priority/issue_type/labels/description/close_reason/created_at/closed_at/updated_at/created_by/compaction_level/original_size/source_repo/source_repo_path). AGENTS.md RULE 0.5 declares "JSONL is truth and `beads.db` is disposable" — and indeed `.beads/` ships only `issues.jsonl` (+ `.gitignore` + a stale `.db-shm`); the sqlite DB is rebuilt, never committed. [Verified] Discipline: `br sync --import-only` after every pull, single-writer on graph structure, `br dep cycles` stays empty. `bv --robot-triage` computes PageRank/betweenness/critical-path for ready-work selection; agents pull with `br ready --json`.

**Phases:** PLAN_TO_PORT's Phase 1→5 (bootstrap+planning → deep extraction → architecture → implementation → conformance/QA); the packet flow FSCI-P2C-001..008 with "Immediate Execution Order" listed in priority sequence; MASTER_EXECUTION_TODO's §§0–7 (control plane → linalg impl → conformance harness → oracle integration → dashboard → docs → quality gates → closeout). [Verified]

**Execution packet template** (PHASE2C_EXTRACTION_PACKET.md §2): each ticket ships 5 artifacts in one PR — `legacy_anchor_map.md`, `contract_table.md`, `fixture_manifest.json`, `parity_gate.yaml`, `risk_note.md` — with 14 mandatory extraction fields and a normative artifact directory topology. **Missing fields ⇒ packet state `NOT READY`.** [Verified]

**Verification loops:** the gate stack in §2; per-packet executable evidence packs (`evidence_p2c*.rs`) that assert every gate; golden journeys (14 e2e); fuzz/property tests; "Landing the Plane" session protocol: file issues for remaining work, run quality gates, update issue status, sync beads, hand off context. [Verified]

**Dialectical review:** two independent mechanisms [Verified]:
1. Cross-model review: `docs/archive/GEMINI_FINAL_REPORT.md` and `GEMINI_REVIEW_SUMMARY{,_2,_3}.md` are Gemini's "spontaneous" review reports of Codex's implementation — critical/important/nit bug findings per crate, routed in-repo when MCP Agent Mail's SQLite was corrupted ("I am dropping my review report into this tracking file as an alternative channel for the Codex implementer").
2. DOC-PASS-12 red-team pass: `EXHAUSTIVE_LEGACY_ANALYSIS.md` §24, "Independent Red-Team Contradiction and Completeness Review," with a contradiction register (RT-01..RT-03) and an unsupported-claim cleanup pass, tracked as bead `bd-3jh.23.13`.
Also named agent identities sign their work: lanes `cod` (Codex) vs `cc` (Claude Code), agent names (BlackThrush, CopperFalcon, SandyFern, MaroonWillow…), each ledger row attributed to an agent + date + bead.

**Drift prevention:** AGENTS.md compatibility doctrine (strict vs hardened modes with fail-closed default); artifact topology locked (governance proposal + owner approval required); "NEVER weaken a gate to land a change"; session protocol forces bead status sync; Agent Mail file reservations with a pre-commit guard that refuses commits touching another agent's reserved paths; quality gates run per change; `quality_gates.toml` SLOs (coverage ≥80/60 per crate, flake ≤0.1%, runtime budgets, violation severities warn/fail). [Verified]

## 5. State-of-the-art coverage

**Legacy as ground truth, not literature:** the repo's "research" is differential — a pinned SciPy 1.17.0/1.17.1 legacy oracle at `/dp/frankenscipy/legacy_scipy_code/scipy` with a canonical capture workflow (`docs/ORACLE_WORKFLOW.md`) and a SciPy-present CI lane (`g3-live-scipy-oracle`). [Verified] The EXHAUSTIVE_LEGACY_ANALYSIS method stack names `$porting-to-rust` Phase-2 Deep Extraction + `$alien-artifact-coding` + `$extreme-software-optimization` + frankenlibc/frankenfs doctrine.

**Competitor mechanism:** `docs/OPTIMIZATION_PROTOCOL.md` mandates a live incumbent arm: `Result class: CAMPAIGN-WIN` requires "FrankenSciPy and the actual SciPy legacy incumbent side by side in the same invocation" with an unambiguous `Incumbent ratio: SciPy / FrankenSciPy`. Self-speedups are explicitly relabeled as maintenance. The GAUNTLET scorecard converts "code-first performance work … into measured head-to-head evidence against the SciPy original." [Verified]

**Fleet-wide learning:** frankenscipy participates in fleet campaigns — Ledger Resurrection was "Fleet-Wide Meta-Lever #1"; findings are cited across frankenlibc/frankenfs/franken_networkx/franken_numpy/frankenpandas/frankensqlite/frankenredis, with cross-repo comparison tables (e.g. VOID-CV composition frankenfs vs frankenscipy). `docs/planning/SPEC_CROSSWALK_FRANKENSQLITE_TO_FRANKENSCIPY.md` formalizes inheritance: "The rule is inheritance-first, divergence-explicit" with mandatory divergence notes. [Verified]

**Profile-first adversarial probing:** scripts `scipy_*_probe.py` (edge cases, singular, signed zero, Laplacian, trim predicates), fuzz seeds per packet, adversarial fixtures mandated in every packet's fixture manifest. [Verified]

## 6. Anti-satisficing

The repo's anti-satisficing is unusually mechanized:

- **DOC-PASS-12 red-team contradiction review** with a register of found contradictions and resolutions [Verified — see §4].
- **Ledger preflight blocks satisficing outputs:** cv-only REJECTs (the cheap kill) and title-inflated SELF-SPEEDUPs are refused at commit time [Verified].
- **Retry predicates are testable conditions**, never "later": "> retry only if (1) `decode_bitmap_payload` exceeds 5% exact self-time in a symbolized profile, AND (2) the A/A null floor on the target worker is below 1.02×." [Verified]
- **Resurrection audits hunt false negatives:** VOID rows are re-run; supersessions must cite the row they supersede; audit indices must be content-addressed (rule 5 added after a positional index rotted: "Cite ledger rows by heading text, and pin the file SHA-256 next to it… never by line number").
- **Self-audit of public claims:** KEEP_CLAIM_GATE_AUDIT found its own classifier mis-bucketing ("70 claims in the wrong bucket") and fixed it in the audit body rather than hiding it; GAUNTLET carries a "this file is not linked from the README's Documentation Map … not one figure in it clears the fleet's current evidence gate" warning.
- **Pre-registration with falsification teeth:** the `solve_ivp_many` rerun published a 464.4884× win *and* falsified its own registered scaling mechanism in the same report. [Verified]

## 7. Explicit absences

[Absent] — checked by filename search across the repo:
- No root `ROADMAP.md`, `BEADS.md`, `TODO.md`, or `PLAN.md` (only `CHANGELOG.md`, `README.md`, `UPGRADE_LOG.md` at root).
- No `CLAUDE.md`, `MUSE.md`, `.muse/` dir, or `.cursor/` dir — `AGENTS.md` is the sole agent-instruction surface.
- No `docs/research/` directory — literature/competitor research as such doesn't exist; the "research" phase is legacy-code extraction + differential capture.
- No `docs/planning/` ADRs under docs (only per-crate ADRs-style quadrature files matched "adr" in filenames incidentally); decisions are recorded in beads + ledgers instead.
- No named **claim matrix** artifact (grep found none; AGENTS.md references `crates/fsci-runtime/src/booking_claim.rs` but that's a worker-booking claim, not a claim-verification matrix). The functional equivalent is the claim-gate audit + ledger preflight, not a matrix.
- No **auto-demotion rules** (no "demot*" in docs/ or scripts/) — demotion-by-rule doesn't exist; what exists is the inverse: audits that *promote* previously rejected claims back to measured status (resurrection).
- No explicit "never compact sessions" policy text — issues.jsonl has `compaction_level: 0` on all 4386 rows, and AGENTS.md's "Landing the Plane" forces handoff artifacts, but no file states a compaction ban. [Inference: compaction is avoided via bead/ledger persistence, not via a stated rule.]
- The `.beads/beads.db` itself is absent by design (JSONL truth, DB disposable) — only `issues.jsonl` ships. [Verified]
- `docs/GAUNTLET_RELEASE_SCORECARD.md`'s own notice flags that ~173 of its 216 ratio rows cannot name a worker and ~187 cannot name a harness — provenance gaps the repo openly marks rather than hides.

## 8. Maturity verdict

**Mature.** frankenscipy has the densest planning-methodology apparatus observed in the suite: spec-first porting with phase-gated exit criteria; packetized execution with machine-checkable readiness rubrics; an executable 8-gate release topology with agent-signed sign-offs; a 4386-bead work graph with graph-aware triage; cross-model dialectical review (Gemini reviewing Codex, dedicated red-team doc passes, named agent identities per lane); and — distinctively — a self-correcting honesty stack (negative-evidence ledger → enforced pre-commit preflight → claim-gate audits → resurrection audits → fleet-wide meta-lever campaigns) that has measurably recovered wins its own gates had wrongly rejected (109.37× BDF, 4.268× cursor, 1.49× Cholesky) and downgraded 97.1% of its own perf claims to ungated. The plan literally rewrites itself after measured failure ("Rewritten 2026-07-25"), records the corrections in-repo, and institutionalizes them as blocked-by-default hooks. Gaps are the classic suite gaps: no literature/research phase (the oracle is the competitor), no claim matrix or auto-demotion as named artifacts, and residual provenance gaps in older scorecard rows that the repo flags rather than hides.

**Provenance of the distinctive claim:** the 56.2% VOID figure and the three resurrected wins are from `docs/LEDGER_RESURRECTION.md` §§1–6 (hand-adjudicated by "CopperFalcon", 2026-07-25, campaign `perf-campaign-20260725`); the 481-claim/2.9%-gated figure from `docs/KEEP_CLAIM_GATE_AUDIT.md` (run 2026-07-30 by BlackThrush "unprompted by any specific defect"). All quotes above are verbatim from those files.
