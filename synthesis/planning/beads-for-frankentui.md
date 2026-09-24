# beads-for-frankentui — Planning Methodology Analysis

**Repo:** https://github.com/Dicklesworthstone/beads-for-frankentui
**Analyzed:** 2026-09-22 · clone depth 1, single orphan commit `e1a842f` (3rd deployment, 2026-03-08)

**Headline:** This is NOT a planning-methodology repo. It is a **machine-generated publication artifact** — the live plan itself, rendered as data. The plan lives inside the `beads.sqlite3` task-graph database (2,590 issues, 3,700 `blocks` dependencies, 1,056 agent comments). The suite-pattern guardrails (negative-evidence ledgers, claim matrices, auto-demotion rules, definition-of-done docs, ADRs as files) are entirely absent — the closest analogues exist only as bead *descriptions* inside the database.

**Claim tiers used below:** [Verified] read in a repo file · [Maintainer claim] his prose, quoted verbatim · [Inference] my reasoning · [Absent] searched and not found.

---

## 1. Artifact Inventory

| Path | Role | One-line summary |
|------|------|------------------|
| `beads.sqlite3` (10.1 MB) | **The plan** — live task-tracker DB | 2,590 issues, 3,700 `blocks` dependencies, 1,056 comments; schema: `issues` / `dependencies` / `comments` / `issue_metrics` / `triage_recommendations` / `issue_overview_mv` / `issues_fts` [Verified] |
| `data/triage.json` | **Robot-triage output** (execution scheduler) | Hybrid impact scores per open issue (pagerank, betweenness, blocker-ratio, staleness, priority, time-to-impact, urgency, risk), top picks, quick wins, blockers-to-clear, `br`-CLI commands for agents [Verified] |
| `data/project_health.json` | Project health snapshot | Velocity (~108–573 closures/week), avg days-to-close 1.59, blocked-vs-actionable warning [Verified] |
| `data/meta.json` | Export metadata | 2,590 issues / 3,700 deps, generated 2026-03-08T18:41:03Z [Verified] |
| `data/graph_layout.json` | Pre-computed force-graph layout | 43k-line node layout for the interactive dependency graph [Verified] |
| `README.md` | Auto-generated exec summary | Priorities, bottlenecks, quick wins, status-by-priority/type — regenerated per deploy by `bv` [Verified] |
| `CHANGELOG.md` | Deployment changelog | Three deployment entries (Feb 9 ×2, Mar 8); documents data growth (+998 issues, +156 blocked), new work streams (opentui-import, pane-a11y, pane-perf) [Verified] |
| `beads.sqlite3.config.json` | Chunk manifest | 11 × 1 MB content-addressed chunks so GitHub Pages can serve the 10 MB DB over WASM (hash per chunk) [Verified] |
| `chunks/00000–00010.bin` | DB chunks | Byte slices of the sqlite DB, reassembled in-browser [Verified] |
| `viewer.js` / `graph.js` / `charts.js` / `hybrid_scorer.js` | Interactive dashboard logic | SQL-driven search, triage scoring mirror, dependency-graph rendering, health charts [Verified] |
| `index.html` / `styles.css` / `graph-demo.html` | Presentation | Single-page app shell [Verified] |
| `vendor/*` | Pinned third-party libs | sql.js WASM, force-graph, d3, Chart.js, Mermaid, Alpine, Tailwind, DOMPurify, marked [Verified] |
| `.github/workflows/static.yml` | Pages deploy workflow | Push-to-`main` → GitHub Pages; no build, no tests [Verified] |
| `.gitignore` | One-liner | (26 bytes, contents not significant) [Verified] |

**What the bead records reveal about the *real* planning stack** (all inside `beads.sqlite3` issues-table descriptions) [Verified]:
- **The master plan document is named but NOT in this repo:** bead `bd-10i.12.7` states "The planning document (PLAN_TO_CREATE_FRANKENTUI__OPUS.md) is intentionally detailed" and that the plan has "Section 0.11" (Definition of Done), "Section 0.6" (locked decisions), "Section 0.7" (quality gates), and a "Master TODO Inventory (A–K)" mapped to bead IDs so "we never need to re-open the plan document to remember what we intended."
- **`bd-10i` — Master epic "FrankenTUI: Complete Implementation Epic"**: vision (minimal high-performance TUI kernel fusing opentui_rust + rich_rust + charmed_rust), "Non-Negotiables (Engineering Contract)", performance budgets (e.g. "Present (80x24, 5% changed): p50 < 1.0ms", "16 bytes per cell"), "Success Criteria (v1 = Done)" checklist [Maintainer claim, quoted from `bd-10i` description].
- **Phased plan inside the bead tree:** `bd-10i.1` "Phase -1: Decision Spikes" → `bd-10i.2` "Phase 0: Contracts + Workspace Skeleton" → implementation phases → `bd-10i.11` "Testing + QA: Verification Suite" → `bd-10i.12` "Docs" → `bd-10i.13` "Formal Specs + Invariants" [Verified].
- **The opentui-import migration program** (`bd-3bxhj` epic family, the dominant open workstream, +~785 task beads): contract foundation requiring "deterministic artifact/evidence manifest schema", "Bayesian + expected-loss confidence/risk model", "clause-level pass/fail matrix", "verdict policy exposes uncertainty bands and explicit approve/review/reject/rollback boundaries" [Maintainer claim, from `bd-3bxhj.1` and `bd-3bxhj.6.9` descriptions].

---

## 2. Execution-Readiness Gates (what a plan must pass before agents are set free)

There is no separate gate doc. Gates live in beads `bd-2gx` ("Quality Gates: v1 Stop-Ship Criteria") and `bd-tb84` ("v1 Definition of Done (Ship Checklist)"), each with explicit "Verified by" links to test beads. Verbatim [Maintainer claim]:

**Stop-ship gates (`bd-2gx`):**
> "Plan Section 0.7 defines four quality gates that are **STOP-SHIP if failing**. These must be tracked and verified before v1 release."

> "### Gate 1: Inline Mode Stability (CRITICAL) **Requirement:** Re-rendering UI region while streaming logs cannot corrupt scrollback or cursor placement."

**v1 Definition of Done (`bd-tb84`):**
> "Plan Section 0.11 defines when ftui "v1" is done. This is the comprehensive checklist that must be completed before tagging v1.0.0."

with subsections "1. Inline Mode Default is Stable", "2. Diff/Presenter Correctness Validated", "3. Unicode Width Correctness Proven", "4. Style System is Deterministic and Documented" — each with machine-checkable items and a **"Verified by:"** cross-reference to gate/test beads (e.g. "Verified by: bd-2gx Gate 1, bd-fbp, bd-10i.11.2") [Maintainer claim].

**Per-bead readiness contract** (task-bead template observed in `bd-10ck` and the `bd-3bxhj.*` certification family): every implementation bead carries **"## Acceptance Criteria"**, **"## Tests (REQUIRED)"**, **"## E2E (REQUIRED)"**, and demands an **evidence ledger** (e.g. "Explainable ranking with evidence ledger of p_i and c_i"; certification bead requires "Evidence ledger includes correlation IDs, hashes, timings, and failure lineage" and a replay helper that "can reconstruct any failed certification run from artifacts") [Maintainer claim].

**Pre-architecture gate — Phase -1 decision spikes (`bd-10i.1`)**, verbatim exit criteria:
> "## Exit Criteria One ADR (Architecture Decision Record) per spike capturing: Context: What problem are we solving? Decision: What did we choose? Alternatives considered Consequences: What are the tradeoffs? Test plan: How we'll know it worked"
>
> "## Relationship to Other Phases This phase BLOCKS Phase 0 (Contracts + Workspace Skeleton). We must not proceed with architecture until we've validated our assumptions through concrete experiments."

And the go/no-go verdict requirement: "We have a clear go/no-go decision for: inline mode strategy baseline; presenter emission baseline; backend selection" [Maintainer claim].

**Hard engineering-contract rules (master epic `bd-10i`, "Non-Negotiables")**, quoted verbatim: "1. One writer owns the terminal — serialized output; 2. Untrusted bytes never executed — sanitize by default; 3. Diffed + buffered UI only — no ad-hoc println; 4. Inline-first is real — preserve scrollback; 5. Safe by default, unsafe isolated (repo policy: unsafe forbidden); 6. Deterministic by design; 7. Correctness continuously verified" [Maintainer claim].

---

## 3. Honesty Guardrails

**What exists [Verified / Maintainer claim]:**
- **Evidence ledgers per bead, not a global negative-evidence ledger.** Task beads require structured evidence logs: "detailed run ledger", "deterministic replay logging", "stage-by-stage JSONL traces", "full structured evidence ledger", "full JSONL evidence ledger" (`bd-3bxhj.4.10`, `bd-3bxhj.2.10`, `bd-3bxhj.3.9`, `bd-3bxhj.10.11`). Ledger *format* is specified (correlation IDs, hashes, timings, failure lineage); ledger *honesty* (negative findings) is implied, not mandated.
- **Verdict policy engine (`bd-3bxhj.6.9`)**: "Verdict policy is deterministic and configurable by profile"; the contract foundation (`bd-3bxhj.1`) requires the verdict policy to expose "uncertainty bands and expected-loss rationale with explicit approve/review/reject/rollback boundaries" and "clause-level pass/fail matrix" — i.e. the guardrail is *uncertainty quantification*, not falsification.
- **Per-bead claim style**: acceptance criteria are written as falsifiable checks (timing budgets, corpus tests), and certification reports must contain "clause-level pass/fail matrix and confidence intervals."
- **"Claimed by X" protocol**: comments show agents publicly claiming beads ("Claimed by AmberGate. Adding tests for: ...", "Starting subtask: ... Reserved crates/ftui-core/src/terminal_capabilities.rs; will report progress here.") — a *work-reservation* ledger, not a truth-claim ledger [Verified].

**When installed:** the spike/ADR/evidence-ledger machinery is part of the plan from Phase -1 onward (Feb 2026, per bead timestamps); the opentui-import contract+verdict layer is a later retrofit (~Mar 2026, the third deployment's +998 issues) [Verified from comment/deploy timestamps].

**What's required:** each bead must ship unit tests + property tests + PTY E2E tests + evidence artifacts; the master epic is closed by a maintainer comment citing "2,145 workspace tests passing" [Verified].

**Explicit absences [Absent]:** no repo-level negative-evidence ledger (phrase absent, 0 hits), no claim matrix (0 hits), no auto-demotion rules (0 hits — only unrelated graphics "drift"), no receipt-bound evidence phrase (0 hits), no NODUS-ring / verdict-per-packet concept.

---

## 4. Plan → Agent Execution

- **Single source of truth doctrine** (`bd-10i.12.7`), verbatim [Maintainer claim]: "once execution starts we want Beads to be the single source of truth… The planning document (PLAN_TO_CREATE_FRANKENTUI__OPUS.md) is intentionally detailed, but once execution starts… we never need to re-open the plan document to remember what we intended."
- **Dependency graph as execution plan:** 3,700 `blocks`-type edges (only dependency type present [Verified]), cycle-free [Verified: `has_cycles: false`], topological execution with bottleneck-first scheduling.
- **Robot-triage scheduler (`bv --robot-triage` → `data/triage.json`)**: per-issue hybrid score = pagerank + betweenness (critical-path bottlenecks) + blocker_ratio + staleness + priority_boost + time_to_impact + urgency + risk (fan_variance, activity_churn, cross_repo_risk, status_risk). Emits "top_picks", "quick_wins", "blockers_to_clear", and agent-executable commands: `"claim_top": "CI=1 br update bd-3bxhj.4.10 --status in_progress --json"`, `"list_ready": "CI=1 br ready --json"`, `"list_blocked": "CI=1 br blocked --json"`, `"refresh_triage": "bv --robot-triage"` [Verified].
- **Swarm workforce:** 190+ distinct assignees in ColorAnimal codename form (TurquoiseBasin, AmberGate, codex, "Opus", "opus-claude", Codex…) plus supervisor sessions "ubuntu" and maintainer "Dicklesworthstone" [Verified from issues.assignee; agents claim work in comments].
- **Verification loops:** bead-level REQUIRED unit/property/PTY-E2E tests; certification pipeline with "verdict policy engine"; graph-level health telemetry (velocity, blocked-vs-actionable warning: "⚠️ Health Warning: More issues are blocked than actionable. Focus on clearing blockers.") [Maintainer claim from README/triage output].
- **Dialectical review:** [Absent] — no two-model adversarial review, no grader-loop artifacts, no red-team beads in this repo's data. Comments are single-author progress reports, not adversarial exchanges [Verified from 1,056 comments sample].
- **Drift prevention:** Phase -1's "we must not proceed" sequencing plus dependency blocking; no explicit drift-monitoring mechanism beyond the health warning in the robot triage [Inference].

---

## 5. State-of-the-Art Coverage

- **No `docs/research/` directory, no literature-review files, no competitor-comparison docs** [Absent].
- The closest analogue: the plan fuses three named predecessor codebases (opentui_rust, rich_rust, charmed_rust) and the opentui-import epic *is itself* a migration from the OpenTUI ecosystem — i.e. competitor-state-of-art is encoded as a migration workstream with conformance testing ("VT support-matrix fixture runner", "adversarial security/reliability E2E suite", "API compatibility harness"), not as research prose [Verified/Inference].
- **"Formal Specs + Invariants (Chapter 2/3)"** and an "Operational Playbook (Chapter 17)" exist as beads, but their contents are plan references, not literature [Verified].

---

## 6. Anti-Satisficing

- **Falsifiable acceptance criteria + required property tests per bead** (e.g. "Property tests with random buffers pass", corpus tests for ZWJ/emoji/combining) [Maintainer claim].
- **Stop-ship gates** with PTY stress tests and cross-terminal matrices [Maintainer claim].
- **Bayesian expected-loss confidence model** in the migration pipeline: "Bayesian + expected-loss confidence/risk model with calibration and fallback triggers", uncertainty bands on verdicts [Maintainer claim].
- **Explicit red-team / falsification / grader-loop / campaign mechanisms:** [Absent] — the one "red team"-adjacent hit is unrelated; the "grader" hit count was 1 and refers to test grading; no anti-satisficing campaign machinery beyond the gates [Verified via keyword search].
- **Notable maintainer intervention style:** "Reopening per user request; keep issues open until explicitly agreed to close." — a manual anti-premature-closure rule enforced by the human, not an automated guardrail [Maintainer claim, ubuntu comment].

---

## 7. Explicit Absences

All confirmed absent by file listing + full-text search of all 2,590 issue descriptions and comments:
- `docs/`, `docs/planning/**`, `docs/research/**`, ADRs as files [Absent]
- `.beads/` JSONL tracker — this repo uses a *sqlite export snapshot* instead (the `bv` viewer DB), which is arguably the beads DB published as an artifact [Absent as files; present as compiled data]
- `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `AGENTS.md`, `CLAUDE.md`, `MUSE.md`, `.muse/` [Absent]
- The master plan `PLAN_TO_CREATE_FRANKENTUI__OPUS.md` — referenced by name in bead `bd-10i.12.7` but not in this repo (lives in frankentui) [Absent]
- Negative-evidence ledger, claim matrix, auto-demotion rules, receipt-bound evidence (phrases) [Absent]
- Dialectical two-model review, grader loops, red-team/falsification machinery [Absent]
- Definition-of-done *file* — the DoD lives only as bead `bd-tb84` inside the DB [Absent as file]
- Git history — single orphan commit; "time-travel" in the viewer refers to DB-state navigation, and `data/history.json` was "removed in second deployment" per CHANGELOG [Verified]

---

## 8. Maturity Verdict: **DEVELOPING** (of the plan artifact), but the methodology it encodes is substantial

**Why not "mature":** the repo itself is a *deployment artifact*, not a methodology repo — it contains zero agent-operating instructions, zero prose about how to plan, and none of the suite's honesty guardrails (no negative-evidence ledger, no claim matrix, no auto-demotion, no dialectical review machinery). Everything methodological is second-hand: embedded in bead descriptions that reference a master plan document held elsewhere. Git history is a single orphan commit, so the planning *process* is not inspectable here — only its current state.

**Why not "thin":** the data encodes a genuinely rigorous planning grammar: Phase -1 decision spikes with per-spike ADR exit criteria ("we must not proceed with architecture until we've validated our assumptions through concrete experiments"), 4 stop-ship quality gates, a v1 Definition of Done with "Verified by" links to test beads, per-bead REQUIRED unit/property/PTY-E2E acceptance criteria, deterministic verdict policies with uncertainty bands, and a robot-triage scheduler that converts the dependency graph into prioritized, claimable agent commands (`CI=1 br update … --status in_progress`). 1,186 issue descriptions (46%) contain acceptance/definition-of-done language — this is the most acceptance-criteria-saturated artifact in the suite so far [Verified].

**Single most distinctive finding:** The plan's center of gravity is *structural, not adversarial*. Emanuel's method here is: (1) write an exhaustive plan (PLAN_TO_CREATE_FRANKENTUI__OPUS.md), (2) convert it wholesale into a 2,590-node dependency graph in the beads tracker, (3) declare beads "the single source of truth" so agents never re-read the plan, and (4) schedule agents with a graph-theoretic robot-triage (PageRank + betweenness + blocker-ratio scoring) instead of human planning reviews. Honesty is enforced by *evidence-ledgers and deterministic verdict policies with uncertainty bands* — not by dialectical opposition or falsification campaigns. The suite's signature anti-satisficing machinery is conspicuously absent from this repo; rigor is pushed *into the work items themselves* (acceptance criteria per bead) rather than into a review layer above them.
