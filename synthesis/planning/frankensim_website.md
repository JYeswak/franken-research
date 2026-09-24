# Planning Methodology: frankensim_website

**Repo:** `Dicklesworthstone/frankensim_website` (commit `e179baf`, cloned 2026-09-22; 227 files, ~56 MB) — the Next.js marketing/documentation site for FrankenSim, live at frankensim.org.
**Method note:** I attempted the prescribed `/tmp/plan-frankensim_website` location, but `/tmp` is a 512 MB tmpfs at 100% (filled with sibling analysts' clones, which I did not touch), so I cloned to `~/workspace/_tmp-plan/plan-frankensim_website` instead (same `--depth 1` shallow clone).

**One-line characterization:** This repo has almost none of the suite's planning machinery as repo-local artifacts — but it is the *showroom* where the suite's planning artifacts (sign-off packets, decision contracts, bead-graph exports, Gauntlet-gated roadmap) are published as website content. The planning method is *displayed*, not *operated*, here.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` | Agent operating instructions (website dev) | Ground rules ("never delete a file", Bun-only), content conventions, WASM-lab rules, perf gotchas, verify-before-shipping checklist; no plan gates. [Verified] |
| `README.md` | Repo README / design philosophy | "Show, do not claim"; "One source of truth" (`lib/content.ts`); "Numbers are computed, not typed" (anti-drift); no-contributions policy. [Verified] |
| `CHANGELOG.md` | Changelog | Curiously titled **"Asupersync Website"** and linking `github.com/Dicklesworthstone/asupersync_website` — a forked template, not authored for this repo; commit-story format, no process content. [Verified; the header mismatch is real, see §7] |
| `lib/content.ts` | Single source of truth for all site content | Decalogue principles P1–P10, Five Explicits, roadmap phases PV→P6 **with explicit exit criteria**, comparison table, e2e campaigns. [Verified] |
| `app/roadmap/page.tsx` | Roadmap page | Renders the Gauntlet-gated phase ladder ("Eight Gates"; gate = certificate state, never a calendar date). [Verified] |
| `app/epistemics/page.tsx` | Epistemics page | Product-marketing exposition of the honesty machinery: three epistemic colors, weakest-wins composition, **auto-demotion**, Gauntlet tiers G0–G5, structured refusals. [Verified] |
| `app/beads/` (+ served `/beads`) | Issue-graph viewer route | Route serves a vendored static export of the **FrankenSim** bead graph (not this repo's tracker); OG-image routes. [Verified] |
| `public/beads/` | Vendored beads-viewer export | Static snapshot of FrankenSim's issue graph generated **Jul 15, 2026 by `bv`** (beads_viewer): 1,741 issues, 5,754 deps, `README.md` exec summary, `data/*.json` (graph_layout, history, triage, health), chunked `beads.sqlite3`. Display artifact. [Verified] |
| `public/spec-docs/*.md` (26 files) | Mirrored engineering specs | FrankenSim/asupersync workspace planning artifacts published as docs: sign-off packets, decision contracts, test matrices, threat models, migration plans. The richest planning-methodology content in the repo lives *here as content*, not as this repo's own process. [Verified] |
| `scripts/compute-stats.mjs`, `scripts/generate-atlas.mjs` | Anti-drift automation | Recompute hero stats / crate atlas from the FrankenSim source so "the site cannot drift from reality" (`README.md`). [Verified] |
| `app/lab`, `app/e2e`, `app/architecture`, `app/glossary`, `app/flagships`, `app/kernel`, `app/getting-started` | Product pages | No planning-methodology content. [Verified] |

**Inventory verdict:** there is no `docs/`, `docs/planning/`, or `docs/research/` directory; no `.beads/`, `.muse/`, or `.claude/`; no root `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `CLAUDE.md`, or `MUSE.md`; no ADRs; no definition-of-done document for the website itself. [Verified]

---

## 2. Execution-readiness gates (what must a plan pass before agents are set free?)

This repo has no stated plan-review gate of its own. The gates that do exist belong to two other genres:

**A. The website's own ship gate — `AGENTS.md` ("Verify before shipping"):** [Verified]

> "bunx tsc --noEmit / bun run build / # deploy (prebuilt): vercel build --prod && vercel deploy --prebuilt --prod"

> "Check no horizontal overflow at 390px and no console errors on `/` and `/lab` after visual changes."

That is the entire pre-ship checklist: typecheck, build, deploy, two visual smoke checks. No plan-review step. [Verified]

**B. The suite's program-closure gate, exhibited here as published content — `public/spec-docs/raptorq_program_closure_signoff_packet.md` ("RaptorQ Program Closure Review and Sign-off Packet", bead `asupersync-2f71w`, packet state `draft_blocked`, go/no-go `no_go_pending_dependency_closure`):** [Verified] (quote, verbatim)

> "Sign-off claims are bounded by explicit evidence:
> 1. No broad RFC/interoperability claim is allowed without direct artifact links.
> 2. No radical runtime lever claim is allowed without conservative fallback comparator evidence.
> 3. Residual risks must be carried explicitly in the risk register and ownership map."

> "## Finalization Rule — H2 may only transition to final sign-off after:
> 1. All required beads in the artifact dependency matrix are closed.
> 2. Unit + deterministic E2E evidence and replay commands are validated.
> 3. Residual-risk ownership and follow-up assignments are explicit.
> 4. Track-H sign-off (`asupersync-p8o9m`) records final go/no-go decision."

Plus a mandatory evidence bundle (conformance + deterministic test matrix; correctness + replay; performance + governance), a Track D/E/F/G/H completion matrix with per-track `required_status` / `current_status` / `status_reason` / `closure_dependency_path` / evidence references, and a structured logging + replay contract requiring schema-aligned logs with `scenario_id`, `seed`, `replay_ref`, `artifact_path`, `status`. [Verified]

**C. The plan-artifact genre — `public/spec-docs/scheduler_arena_plan.md` ("Scheduler Hot-Path Allocation Audit + Arena Plan"):** every plan is bead-tagged, status-tagged, and authored, e.g.: [Verified]

> "**Bead:** bd-1p8g / **Status:** Completed / **Author:** TealCreek (claude-code/opus-4.5) / **Date:** 2026-02-03"

Plans are phased ("Phase 1 (Completed)", "Phase 2 (Planned)", "Phase 3 (Future)") with P0–P3 prioritization tables and a "Metrics" section naming exact repro commands (`cargo test`, DHAT) plus an expected reduction ("90%+ on per-poll allocations"). [Verified]

**D. Roadmap phase exits — `lib/content.ts` (`phases: Phase[]`) and `app/roadmap/page.tsx`:** [Verified] (quotes verbatim)

> "The plan runs in phases, PV → P6. Each gate is a Gauntlet state, not a date; nothing Moonshot is allowed to gate anything Solid."

> "Each phase exits only when its Gauntlet tier goes green. The gate is the state of the certificate, never a date on a calendar."

Example exit criterion (P0 Bedrock): "G0 + G4 green; GEMM / SpMV / FFT within 80% of targets on both ISAs; deterministic mode bit-stable." (P6 is `active`; P0–P5 `done`.) [Verified]

---

## 3. Honesty guardrails (negative-evidence / claim-matrix / demotion)

No negative-evidence ledger, claim matrix, or demotion policy exists *for this repo*. What exists is the product's honesty machinery, marketed on the site:

- **Auto-demotion** — `app/epistemics/page.tsx`: [Verified] (quote)
  > "**Auto-demotion.** A validated value silently reverts to estimated the instant it is evaluated outside the regime it was validated in. The badge is bound to its envelope; step past the boundary and the badge falls off by itself."
- **Weakest-wins composition** — `app/epistemics/page.tsx`: [Verified]
  > "There is no operator anywhere in the 100+ crates that returns a color stronger than its weakest input. That is how FrankenSim makes **laundering an estimate into a certificate** a type error rather than a temptation."
- **The three colors** (verified / validated / estimated): "The color is part of the type, not a comment. It is checked at every composition and impossible to upgrade by wishful thinking." (`app/epistemics/page.tsx`) [Verified]
- **Claim-boundary rule in sign-off packets**: "No broad RFC/interoperability claim is allowed without direct artifact links" (see §2B). [Verified]
- **"Certifying the certifiers"** — `app/epistemics/page.tsx`: "Every verifier and error estimator is itself tested against manufactured solutions with known bounds; a certificate is trusted only after the thing issuing it has passed its own Gauntlet. The Goodhart guard treats each optimizer endpoint as an adversarial example and re-checks it out of band." [Verified]
- **Refusal-that-teaches** — `app/epistemics/page.tsx`: "The system refuses to guess, and refuses to hide why." (a `BudgetInfeasible` is "a conversation, not a dead end"). [Verified]
- **Site-level drift prevention** — `README.md` + `AGENTS.md`: "Show, do not claim... The Lab compiles real kernels to WASM precisely so the demos cannot be faked"; "Numbers are computed, not typed"; "All content lives in `lib/content.ts` — the single source of truth"; prose uses floored forms ("100+ crates", "200K+ lines") "so it does not go stale between runs". [Verified]

Lifecycle timing: none of these were "installed" into this repo as planning phases — they are either the FrankenSim kernel's engineering culture (published here as marketing/docs) or this repo's own lightweight content-hygiene rules. There is no documented lifecycle at which honesty machinery gets attached to a new campaign in this repo. [Inference]

---

## 4. Plan→agent execution (task graphs, phases, verification loops, dialectical review; drift prevention)

- **Task graphs:** The `public/beads/` snapshot (1,741 issues, 5,754 dependencies, cycle-free, density 0.0019 "Healthy") plus the commit-linked `history.json` (bead IDs added per commit, e.g. `frankensim-epic-substrate-wf9.6`) show the suite runs bead-tracked, dependency-ordered execution at the FrankenSim level — but that graph is a *displayed export of the other repo*, not this repo's own task graph. This repo has no bead graph of its own. [Verified for the export's existence; Inference for the cross-repo attribution]
- **Phases / verification loops:** See §2C (audit → phased plan → repro-command metrics) and the Gauntlet tiers G0–G5 (`app/epistemics/page.tsx`), where G1 (manufactured solutions) is flagged "**Fails the build**" — a verification loop wired into CI rather than a human gate. [Verified]
- **Dialectical review:** [Absent] — no document in this repo describes two models reviewing each other, adversarial grading, or any plan-review ritual. The closest analog is the maintainer's "Goodhart guard" (re-checking optimizer endpoints out of band) and "certifying the certifiers", both product-level, not plan-review-level. [Verified by full-repo grep for `dialectic`, `adversar`, `red.team`, `self.critique`, `two.model` — no hits]
- **Drift prevention:** the website's own: single source of truth (`lib/content.ts`), computed-not-typed numbers (`scripts/compute-stats.mjs`, `scripts/generate-atlas.mjs`), WASM demos that "cannot be faked", de-slopified copy rules. [Verified]
- **Session hygiene / never-compact:** [Absent] — no instruction about session compaction, context handoffs, or session continuity anywhere in the repo (full-repo grep for `compact` returned no hits). [Verified]

---

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

- **No research process documented.** There is no `docs/research/`, no literature-scan procedure, no competitor-tracking mechanism in this repo. [Absent] [Verified]
- **What exists instead is a marketing comparison table** — `lib/content.ts` `comparisonData`: FrankenSim vs COMSOL vs OpenFOAM vs SciPy across 12 rows (language, evidence, provenance, determinism, cancellation, …). That is product positioning copy, not a research mechanism; there is no documented method behind it. [Verified]
- **Formal-semantics and decision-record docs are published here as specs** (e.g. `asupersync_v4_formal_semantics.md`, `spork_operational_semantics.md`, `raptorq_optimization_decision_records.md`, `raptorq_rfc6330_clause_matrix.md`) — they demonstrate the suite's depth of prior-art engagement (RFC 6330 clause matrices, CALM analysis, OTP comparisons), but they are evidence *exhibits* mirrored from the engineering repos, not a research workflow of this repo. [Verified]

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

- **Red-team / falsification as planning mechanisms:** [Absent] — no red-team protocol, no falsification-criteria template, no "campaign" runner docs for this repo. [Verified by grep]
- **Nearest analogues, all product-level:**
  - The Gauntlet's adversarial tiers — G4 "Chaos & cancellation storms: Inject cancellation mid-solve, starve budgets, race speculators. Correctness must survive the storm" and G5 "Determinism & cross-ISA: Any divergence is a diff, not a shrug" (`app/epistemics/page.tsx`). [Verified]
  - The Goodhart guard: "treats each optimizer endpoint as an adversarial example and re-checks it out of band, because a measure that becomes a target stops being a good measure." [Verified]
  - The sign-off packet's "no_go" state and dependency-blocked finalization (`draft_blocked`, `no_go_pending_dependency_closure`) is an anti-satisficing *gate*, but for FrankenSim/asupersync program closure, not website planning. [Verified]
- **The load-bearing thesis** of the whole epistemic apparatus, quoted on the site (`app/epistemics/page.tsx`): [Verified]
  > "A false certificate is worse than an ordinary wrong answer: a wrong answer wearing a badge."

---

## 7. Explicit absences

Everything below was searched for and **not found** in `Dicklesworthstone/frankensim_website` (full filename search + content grep; shallow clone, so only current-tree state is covered):

1. `docs/`, `docs/planning/**`, `docs/research/**` — no docs tree of any kind. [Absent]
2. `.beads/` task-tracker database at repo root (only the vendored, chunked `public/beads/beads.sqlite3` export *of the FrankenSim repo* for display). [Absent]
3. `AGENTS.md` contains no plan-first rule, no dialectical/two-model review, no never-compact instruction, no execution-readiness gate for plans. [Absent]
4. `CLAUDE.md`, `MUSE.md`, `.muse/`, `.claude/`. [Absent]
5. `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, any `*definition-of-done*` / `*definition_of_done*` file. [Absent]
6. ADRs; negative-evidence ledger; claim matrix; auto-demotion policy as repo process; receipt-bound evidence. [Absent]
7. Research/brief phase docs; competitor-scan or literature-review mechanism. [Absent]
8. Red-team / falsification / campaign mechanisms as planning artifacts. [Absent]
9. Session-continuity or context-handoff instructions ("never compact"). [Absent]
10. Anomaly worth noting: `CHANGELOG.md` is headed **"Asupersync Website"** and links `github.com/Dicklesworthstone/asupersync_website` — i.e., this repo's changelog was carried over from the asupersync_website template and never renamed, which itself evidences how little process infrastructure was built specifically for this repo. [Verified]

---

## 8. Maturity verdict

**Thin** — for the website repo itself. [Inference, grounded in §7]

The reasoning: frankensim_website is a content-and-demo repository, and its *own* planning apparatus is essentially `AGENTS.md` (conventions + a typecheck/build ship gate) plus content-anti-drift automation (computed stats, single-source `content.ts`, WASM demos that can't be faked). None of the suite's signature planning machinery — plan-first gates, dialectical review, bead-tracked task graphs with sign-off packets, never-compact session discipline, negative-evidence ledgers, research-brief phases — exists *in this repo as an operating process*. What exists is arguably more interesting for the program: **this repo is the publishing channel through which the suite's planning artifacts are exhibited to the world** — sign-off packets with claim boundaries and finalization rules (`raptorq_program_closure_signoff_packet.md`), bead-harmonization migration plans, a live-ish bead-graph export (1,741 issues), the Gauntlet-gated roadmap, and the epistemic philosophy pages. In other words: the suite plans in its engine repos and *performs its planning credibility* in this one. A grader should not read the richness of `public/spec-docs/` as evidence of this repo's planning maturity; it is evidence of the suite's, repurposed as marketing content.

Distinguishing note on honesty: this repo's own honesty story is entirely about *content integrity* (can't-fake demos, computed numbers, single source of truth) — it is a faithful mirror of the suite's epistemic values, but at the marketing layer, not the planning layer.
