# Planning-Methodology Analysis: beads_for_franken_engine

**Repo:** https://github.com/Dicklesworthstone/beads_for_franken_engine
**Analyzed:** 2026-09-22 (depth-1 clone; single commit `50e2709` "Deploy static site via bv --pages")
**Critical context first:** this repo is NOT a Rust reimplementation and NOT a planning workspace. It is a static publish mirror of the beads task database for a different, much larger project (a JS/TS runtime called **FrankenEngine**, shipped under file/crate names `frankenengine-engine` / `franken_node`). The README states the dashboard was "Generated Mar 8, 2026 at 7:19 PM CDT by [bv](https://github.com/Dicklesworthstone/beads_viewer)". There are no planning-process documents in this repo at all; the planning methodology must be reverse-engineered from the exported task database (`beads.sqlite3`, 1180 issues, 1916 dependencies) and its schema. Everything below is tier-labeled: **[Verified]** = read in a repo file, **[Maintainer claim]** = his prose quoted verbatim from the DB, **[Inference]**, **[Absent]** = looked for, not found.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `README.md` | Auto-generated dashboard summary | bv-generated exec summary: 1180 issues, 72% complete, top priorities, bottlenecks, health (Mar 8, 2026) |
| `beads.sqlite3` | **The planning artifact** | Full bead database: `issues` (1180), `dependencies` (1916), `comments` (900), `issue_metrics` (pagerank/betweenness/critical-path), `triage_recommendations`, FTS index |
| `beads.sqlite3.config.json` | Viewer plumbing | Declares the DB is chunked into 8 × 1MB `chunks/0000N.bin` files with per-chunk hashes |
| `data/triage.json`, `data/project_health.json`, `data/history.json`, `data/graph_layout.json` | Viewer data feeds | Precomputed velocity (853 closed in 30 days), health, time-travel history, graph layout for the dashboard |
| `graph.js`, `viewer.js`, `index.html`, `graph-demo.html`, `styles.css`, `charts.js`, `hybrid_scorer.js`, `wasm_loader.js`, `coi-serviceworker.js` | Static dashboard app | bv viewer frontend |
| `vendor/` | Vendored libs | d3, mermaid, chart.js, sql-wasm, tailwind, alpine, force-graph — dashboard dependencies only |
| `.github/workflows/static.yml` | Deploy pipeline | Standard GitHub Pages deploy on push to `main`; no CI, no gates, no planning checks |

**What's structurally absent from the repo** (verified by full file listing — only `README.md` is a doc):
- [Absent] `docs/`, `docs/planning/**`, `docs/research/**`, ADRs — no docs directory at all
- [Absent] `.beads/` directory — the DB is exported as `beads.sqlite3`, not the live `.beads/` JSONL store; there is no raw JSONL to read
- [Absent] `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` at root or anywhere
- [Absent] `AGENTS.md`, `CLAUDE.md`, `MUSE.md`, `.muse/` — no agent operating instructions
- [Absent] The referenced plan itself: ~445 beads carry a `## Plan Reference` pointing at `PLAN_TO_CREATE_FRANKEN_ENGINE.md` (and section numbers like 9, 9I.3, 10.x, 11–16), but that markdown file is NOT in this repo

**DB schema** [Verified] (`PRAGMA table_info` on `beads.sqlite3`): `issues(id, title, description, status, priority, issue_type, assignee, labels, created_at, updated_at, closed_at)`; `dependencies(issue_id, depends_on_id, type)` with default `'blocks'`; `comments(id, issue_id, author, text, created_at)`; plus `issue_metrics(issue_id, pagerank, betweenness, critical_path_depth, triage_score, blocks_count, blocked_by_count)` and `triage_recommendations(issue_id, score, action, reasons, unblocks_ids, blocked_by_ids)`. The graph is explicitly computed over: pagerank-driven "Impact Score" triage, cycle detection (README: "Cycles: None detected ✓"), dependency density 0.001.

---

## 2. Execution-readiness gates (verbatim)

Gates are the single most developed planning surface. They are written as exit-gate beads quoting the plan verbatim:

- **Phase A exit gate** (`bd-1csl`, open, labels: `phase-a`, `gate`, `planning`): "This is the Phase A exit gate — the first major program milestone... **Exit Criteria (verbatim from plan):** 1. ES2020 conformance gate: applicable test262 ES2020 normative profile passes with explicit zero-surprise waiver policy (waivers allowed only for documented non-normative harness/host gaps, never silent semantic failures)." [Maintainer claim]
- **Phase B exit gate** (`bd-24wx`, open): "1. Attack simulation harness demonstrates containment without host compromise. 2. Red-team campaign demonstrates >= 10x compromise-rate reduction versus baseline Node/Bun default posture. 3. Median detection-to-containment time meets <= 250ms." [Maintainer claim]
- **The "no contract, no merge" gate** (`bd-c1co`, open): "Governance epic ensuring all high-impact subsystem work is packaged as explicit decision contracts with required evidence fields and reproducibility hooks. This section operationalizes the rule: no contract, no merge." [Maintainer claim] Hardened in `bd-13a5` (closed): "**Enforcement Rule:** 'No contract, no merge.' This is a hard gate, not a guideline." [Maintainer claim]
- **Contract template contents** (`bd-13a5`): every proposal must include change summary, hotspot/threat evidence, EV score and tier, expected-loss model, fallback trigger, rollout wedge, rollback command, benchmark/correctness artifacts. Enforcement is CI-level: "Integration test: CI gate that rejects PRs touching runtime code without a linked contract artifact." [Maintainer claim]
- **Zero silent failures** (`bd-11p`, closed): "Any test262 test that is not explicitly (a) passing or (b) waived causes a hard CI gate failure. No 'expected failure' lists, no 'known flaky' suppression outside the waiver file." [Maintainer claim] Waiver entries require `test_id, reason_code, es2020_clause, tracking_bead, expiry_date, reviewer`; "expired waivers cause CI failure" and the plan phrases the Phase A exit as "never silent semantic failures." [Maintainer claim]
- **Portfolio governor stage gates** (`bd-1fu7`, closed): "Enforce `research -> shadow -> canary -> production` transitions only when all artifact obligations for the current stage are met and metric thresholds are passed. Automatic promotion on gate pass with signed `stage_transition` artifact. Automatic hold when metrics are ambiguous (insufficient signal) with explicit 'need more evidence' status." [Maintainer claim]
- **Readiness-gate philosophy** (`bd-2mds.1.8`, in progress, [PSRP-08] Supremacy Readiness Gate): "Intent: Fail closed unless correctness, performance, reproducibility, testing rigor, and user-facing quality all meet contract... define and enforce the final evidence bar before any world-leading parser claim is accepted." [Maintainer claim]
- **Anti-ambition-collapse orchestration** (`bd-1tsf`, open): "Without a single orchestration owner for the entire 10.x surface, execution drifts into local optimization (teams close local work while cross-track gates remain broken). This bead prevents communication-only progress and enforces end-to-end delivery discipline." [Maintainer claim] And `bd-3t2d` (open): "Execution can appear locally healthy while program outcomes fail globally... This bead exists to keep the full-system objective intact and prevent ambition collapse." [Maintainer claim]

---

## 3. Honesty guardrails

- **Evidence-and-decision contracts (mandatory)** — exists, the program's honesty backbone. Installed as Section 11 of the plan and operationalized as `bd-c1co` epic (open) + `bd-13a5` template (closed, so the template itself is done). Required from proposal time: contract completeness checks are "deterministic and CI-enforceable" and "Missing-contract work is prevented from reaching completion states." [Maintainer claim, Verified in `bd-c1co`, `bd-13a5`]
- **Receipt + replay linkage** — fail-closed completeness: `bd-17v2` (closed) requires signed receipts with `replay_seed` + `trace_ref` for every escrow/deny/grant decision: "No escrow/deny/grant action can execute without producing a receipt (fail-closed if receipt emission fails)." [Maintainer claim, Verified]
- **Governance audit ledger** — `bd-15g2` (closed): append-only, chain-hashed log of all promote/hold/kill decisions "with signed rationale"; "Human override remains available but must emit signed justification artifacts so governance drift is auditable." [Maintainer claim, Verified]
- **Automatic demotion/rollback** — `bd-27i1` (closed): on post-promotion semantic divergence, performance breach, risk-threshold breach, or capability violation → atomic rollback via `rollback_token`, signed `demotion_receipt`, and "Block re-promotion of the same candidate until root cause is addressed and a new promotion gate pass is achieved." [Maintainer claim, Verified]
- **Entitlement verdicts / impossibility certificates** — `bd-1lsy.1.7.2` (in_progress): "Compute entitlement verdicts, minimal missing-evidence cut sets, and impossibility certificates so blocked claims come with exact reasons instead of vague status labels." [Maintainer claim, Verified] — this is the negative-evidence function, expressed as cut sets and impossibility certificates rather than a "negative-evidence ledger" (that exact phrase is [Absent]).
- **Claim matrix / definition of done** — as named artifacts: [Absent]. The functional equivalents are (a) the two-tier claim ladder (`bd-1lsy.1.6.3`, in_progress: "pursue absolute greatness without confusing frontier ambition with already-proven shipped fact"), and (b) a per-bead **Acceptance Criteria** template present in 339 beads [Verified by count], typically requiring: unit tests (normal/boundary/adversarial), deterministic e2e/integration scripts, structured logs with stable fields (`trace_id`, `decision_id`, `policy_id`, `component`, `event`, `outcome`, `error_code`), reproducibility artifacts (run manifest, replay/evidence pointers), and `rch`-wrapped Rust build/test commands. `bd-3uiy` (closed) gives the canonical "Done definition": "Objective implemented with tests and observability. Dependencies and operational runbooks updated." [Maintainer claim]
- **Red-team / falsification** — exists as execution content (Phase B exit criterion: >=10x compromise-rate reduction; adversarial test requirements on individual beads; chaos tests in `bd-27i1`; "Adversarial tests: attempt to bypass receipt emission, inject forged receipts" in `bd-17v2`), but no standalone "red-team campaign" planning doc: [Absent] as a named planning artifact.
- **When installed in the lifecycle:** honesty machinery is installed UP FRONT as plan sections 11–13 (evidence contracts, risk register, success criteria) before/during implementation tracks, and then tightened retroactively: the March 2026 "reality-gap corrective wave" (see §4) was explicitly a plan-space honesty repair after a code audit found areas "closed in plan-space before they were actually complete in shipped behavior." [Maintainer claim, Codex comment 2026-03-06]

---

## 4. Plan→agent execution (task graphs, phases, verification loops, drift prevention)

- **The bead graph IS the execution plan.** 1180 beads / 1916 `blocks` dependencies, hierarchical IDs (`bd-1lsy.2.6.1`), one `initiative` → 58 `epic` → 20 `feature` → 1089 `task` → 11 `bug` → 1 `test`. Two MASTER orchestration epics (`bd-1tsf`: "Execute PLAN 10.x end-to-end with full dependency graph"; `bd-3t2d`: "Execute PLAN 1-16 as self-contained bead graph") own dependency integrity and gate readiness. 445 beads carry `## Plan Reference` sections tying them to plan sections; 15 beads carry the `planning` label. [Verified]
- **Phases:** Section 9 phase gates (Phase A native VM substrate → Phase B security-first extension runtime → Phase D pilot rollout); moonshot lifecycle `research → shadow → canary → production` automated by the governor; rollout wedges `shadow → canary → ramp → default` required per contract. [Maintainer claim]
- **Dialectical / multi-pass review — the strongest direct evidence in this repo.** Comments show a second model, **Codex**, performing explicit plan-space review passes on 2026-03-06 (25 Codex comments total [Verified]):
  - *Corrective-wave creation:* "the repository has real parser/lowering/execution infrastructure, but several areas were closed in plan-space before they were actually complete in shipped behavior" → new bead tree "captures the concrete missing work required before FrankenEngine can honestly claim all of the following at the same time" [Maintainer claim]
  - *Second pass:* "I reviewed the corrective-wave beads for user-facing quality, not just technical completeness... The intent is to make the backlog harder to game and easier for future operators to trust." [Maintainer claim]
  - *Third pass / framing correction:* "absolute greatness remains the explicit north-star. I replaced the earlier one-layer claim-envelope framing with a two-tier ladder... so adversarial search and coverage saturation now serve a monotone board-expansion ratchet rather than sounding like a permanent cap on ambition." [Maintainer claim] — a model critiquing and replacing its own earlier framing: dialectical in function.
  - Note: this is sequential multi-pass review by a second model, NOT two models run simultaneously against each other; explicit "model A vs model B" dialectic documentation is [Absent].
- **Work-log evidence trail:** 900 comments from the maintainer (454) plus ~20 codenamed agents (BlueBear, SwiftEagle, PurpleBarn, …) logging unblock sweeps, validation commands, and reservations (e.g., "Claimed exclusive file reservations for those 3 paths... patched test-scope drift"), with exit-code-level validation records. [Verified]
- **Drift prevention mechanisms:** (a) MASTER beads whose stated purpose is preventing "communication-only progress" and "ambition collapse"; (b) dependency-ordered execution enforced by the acyclic graph (README: cycles none, density 0.001, "can be parallelized"); (c) zero-placeholder gate (`bd-1lsy.9.5`) scanning for placeholder/fallback behavior to "prevent quiet reintroduction"; (d) test262 pass-count high-water mark monotonicity (`bd-11p`); (e) differential lockstep execution kept active during burn-in (continuous, not point-in-time, divergence detection). [Maintainer claim]
- **Work selection is computational:** `triage_recommendations` rows pair pagerank Impact Scores with action strings like "Work on bd-2mds first to unblock this" — the DB itself computes what agents should do next. [Verified]

---

## 5. State-of-the-art coverage (research/competitor/literature mechanisms)

[Inference-heavy; mechanisms are embedded as plan sections and beads, not as a `research/` directory — that directory is **Absent**.] What exists:
- **Differential baselines as oracles:** V8 as the semantic oracle (`bd-11p` meta-test: "Run a curated subset of test262 tests (>= 200...) against a known-good reference engine (e.g., V8 via d8) and confirm identical pass/fail classification"); Node/Bun as the security/perf baselines ("10x compromise-rate reduction versus baseline Node/Bun default posture"; ">= 3x weighted-geometric-mean throughput vs Node AND Bun" in `bd-25sh`). [Maintainer claim, Verified in `bd-11p`, `bd-24wx`, `bd-25sh`]
- **Peer parsers / drift intelligence:** `bd-2mds.1.2` [PSRP-02] "Differential Parser Lab (Boa + Peer Parsers) and Drift Intelligence" with nightly differential drift ops (`bd-2mds.1.2.4`). [Verified]
- **External reproducibility as a gate:** `bd-2mds.1.7` [PSRP-07] "Cross-Architecture Reproducibility and Third-Party Verification"; success criteria require "At least 2 independent third parties reproduce core benchmark claims" and "Category benchmark standard adopted by external participants" (`bd-25sh`, `bd-21ds` [14] Public Benchmark + Standardization Strategy). [Maintainer claim]
- **Doctrine inputs:** beads cite external methodologies by name — "alien-graveyard methodology (Section 5.3)", "alien-artifact-coding discipline (Section 5.2)", "extreme-software-optimization methodology (Section 5.1): baseline/profile/prove/implement/verify" (`bd-13a5`), and the FrankenSuite sibling repos (`frankensqlite`, `frankentui`, `asupersync`, `fastapi_rust`) as integration/comparison surfaces (`bd-zvn` [10.14]). [Maintainer claim, Verified]
- **Scientific output obligations:** `bd-esst` [16] Scientific Contribution Targets exists as an epic. [Verified]

---

## 6. Anti-satisficing (red-team/falsification/campaign mechanisms)

- **Zero-placeholder doctrine:** `bd-1lsy.9.5` gate scans shipped paths for placeholder/fallback behavior; 26 beads reference placeholders; the RGC corrective wave was triggered by exactly this failure ("closed in plan-space before they were actually complete in shipped behavior"). [Maintainer claim, Verified]
- **No-silent-failures / no-silent-reduction rules:** "no silent semantic failures" (test262 waivers), "no silent feature/functionality reduction" (MASTER success criteria, `bd-1tsf`, `bd-3t2d`, `bd-2mf` — repeated across epics as criterion 4/1). [Maintainer claim, Verified]
- **Two-tier claim ladder** (`bd-1lsy.1.6.3`, in_progress): separates "frontier universal-dominance objective" from "publishable evidence envelope" so ambition can't be confused with proven fact — installed precisely to stop claims from capping ambition OR outrunning evidence. [Maintainer claim, Verified]
- **Kill-switch economics:** moonshots "that consume budget without signal, violate risk constraints, or fail reproducibility gates are automatically demoted or terminated" (`bd-15g2` rationale); governor scoring on EV, confidence bounds, risk-of-harm, implementation friction, operational burden; ledger records every promote/hold/kill with signed rationale; scorecards published to operators (`bd-12n5`). [Maintainer claim, Verified in `bd-1fu7`, `bd-15g2`, `bd-12n5`]
- **"Harder to game" as an explicit design goal** (Codex second-pass comment). [Maintainer claim]
- Standalone anti-satisficing campaign docs, a formal red-team *planning* doc, or a negative-evidence ledger file: [Absent].

---

## 7. Explicit absences

Verified absent from the repo (full listing; only file besides code/data is the auto-generated README):
1. The plan itself: `PLAN_TO_CREATE_FRANKEN_ENGINE.md` — referenced by 445 beads, not present. **The beads are the plan's executable shadow; the source plan lives elsewhere.**
2. `.beads/` live store (only the exported `beads.sqlite3`).
3. Any definition-of-done document, claim matrix, negative-evidence ledger, red-team campaign plan, ADR set, ROADMAP/BEADS/TODO/PLAN.md, `docs/` of any kind.
4. Any agent operating instructions (`AGENTS.md`/`CLAUDE.md`/etc.) — how agents are told to work is not documented here.
5. Any "plan-first / research-then-build / two-model dialectic / never compact sessions" methodology notes — none of the suite-pattern phrases found (`research phase`: 0, `planning phase`: 0, `two model`: 0, `dialectic`: 0, `claim matrix`: 0, `negative evidence`: 0 hits in titles/descriptions).
6. This repo's own workflow is a single GitHub Pages deploy (`static.yml`) — no CI, no gates, no planning automation of its own. It is a publish artifact, not a working repo.

---

## 8. Maturity verdict

**Developing (repo) / Mature (planning system it mirrors).** The repo itself has no planning process — it is a dashboard publish target, so judged alone it is **thin/absent**. But the planning system serialized inside `beads.sqlite3` is **mature**: a 1180-node dependency-ordered execution graph with computational triage (pagerank), machine-checkable exit gates, mandatory evidence contracts enforced as "a hard gate, not a guideline," fail-closed receipt/replay linkage, an append-only governance audit ledger, automatic demotion with signed receipts, a monotone claim ladder, and documented second-model review passes that repaired plan-space dishonesty after a code audit. What's missing relative to the suite pattern is the *meta-layer in writing*: no plan-authoring doctrine, no named dialectical protocol, no agent operating instructions, no research-phase artifacts — the methodology is visible only through its enforcement machinery and a handful of review comments, not through planning-process documentation.

---

*All bead citations from `beads.sqlite3` (tables `issues`, `comments`, `issue_metrics`, `triage_recommendations`), repo `beads_for_franken_engine`, analyzed 2026-09-22.*
