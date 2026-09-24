# Planning Methodology — frankentui_website

**Repo:** https://github.com/Dicklesworthstone/frankentui_website (Next.js 16 marketing/showcase site for the FrankenTUI Rust TUI kernel, deployed on Vercel)
**Analyzed:** 2026-09-22, HEAD commit `01a86f5` ("docs(agents): synchronize suite-wide rules and canonical multi-agent conventions", 2026-09-22). History is squashed to a single commit; intra-repo git archaeology is impossible.

**Tier key:** [Verified] = read in a repo file. [Maintainer claim] = Emanuel's prose, quoted. [Inference] = my read. [Absent] = searched for, not found.

---

## 1. Artifact inventory

| Path | Role | Summary |
|---|---|---|
| `AGENTS.md` | Agent operating instructions | 542-line ops manual: suite-wide rule pointer (Rule 0.5), Rule 1 (no deletions), irreversible-action rules, br/beads workflow, `bv`/`ubs`/`cass` tooling, test/deploy gates. Header still says "Jeffrey Emanuel Personal Site" pointing at `jeffrey_emanuel_personal_site` — drifted copy from a template. |
| `.beads/issues.jsonl` | Work-graph truth store | 65 issues (7 epics, parent-child subtask trees; 61 closed, 4 open). Rich schema: `id,title,description,status,priority,issue_type,created_at/updated_at/closed_at,created_by,dependencies,close_reason,comments,notes,compaction_level`. 44/65 carry dependencies (all `parent-child` type); 48/65 closed carry `close_reason`. |
| `.beads/beads.base.jsonl` | Graph base snapshot | 61 records; the pre-merge baseline the JSONL export reconciles against. |
| `.beads/config.yaml` | Tracker config | `sync: history_enabled: false` — history snapshots disabled (comments note automatic pruning). |
| `.beads/metadata.json` | Tracker metadata | `{"database": "beads.db", "jsonl_export": "issues.jsonl"}` — declares JSONL as the tracked export, sqlite db as disposable. |
| `.beads/.br_history/` | Archived snapshots | Two JSONL snapshots (2026-07-13) + `.meta.json` pointers to `issues.jsonl`; `.gitignore`d recovery/vacuum scratch lives beside them. |
| `scripts/sync-showcase.sh` | Artifact sync pipeline | Mirrors WASM showcase from frankentui's `build-wasm.sh` into `public/web/`; `--dry-run` mode; **"This script never deletes files in public/web/."** |
| `scripts/update-web-demo.sh` | End-to-end update pipeline | build → sync → commit → deploy with `--skip-build`, `--no-push`, `--dry-run` flags. |
| `CHANGELOG.md` | Capability history | 356 lines of landed-capability entries with commit links; states "no formal release tags or GitHub Releases." |
| `UPGRADE_LOG.md` | Dependency upgrade receipt | One dated upgrade entry with per-package build/lint/type-check results, a skipped upgrade with upstream-issue link, and a rollback ("Rolled back to 9.39.2"). |
| `app/beads/page.tsx` | Planning-as-exhibit | Public page framing the method: "every unit of work was modeled as a bead — a node in a directed acyclic graph (DAG) with typed dependency edges, priority scores, and completion criteria" and "The graph served as the single source of truth for what to build next." |
| `app/how-it-was-built/page.tsx` + `lib/content.ts` | Forensic build narrative | 5-day sprint story: `buildLogLines` (first commits: "Initial commit: FrankenTUI plan documents" → "Upgrade plan to V6.1" → "Add 15 comprehensive feature beads with 46 subtasks" — plans committed *before* code, beads made next); `devProcessStats`: 286 Claude Code sessions + 516 Codex CLI sessions + 1001 commits in 2026-01-31→02-05. |
| `public/how-it-was-built/frankentui_spec_evolution_dataset.json` | Spec-doc evolution taxonomy | 31 commits touching `docs/spec` (in the *parent* frankentui repo) classified into an 11-bucket manual taxonomy of plan-doc edits (see §5). Powers the Spec Evolution Lab. |
| `public/beads-viewer/data/triage.json` | Graph triage export | Parent-repo graph triage: 1,168 issues, PageRank-based `top_picks` with reasons ("Unblocks 2 item(s)", "High centrality"). |
| `public/web/assets/evidence.jsonl` | Kernel telemetry (NOT planning evidence) | 209 rows of FrankenTUI capability-decision events (`capability_decision`, log-odds, probabilities, `evidence: [{source, log_odds}]`) — Bayesian diff/probe telemetry shipped as a forensic artifact, not planning receipts. |
| `tests/*.spec.ts` (20 files) | Verification layer | Playwright E2E + unit tests per epic (e.g. `spec-evolution-*-e2e.spec.ts`, `beads-viewer-tables.spec.ts`); beads exist for test tasks (bd-2eu.1, bd-ty6.11). |

**Explicitly absent [Absent]:** `docs/`, `docs/planning/`, `docs/research/`, `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `MUSE.md`, `CLAUDE.md`, `.claude/`, `.muse/`, `research/`, `ADRs/`, `DEFINITION_OF_DONE.md`, any file with `definition-of-done`, `claim`, or `roadmap` in its name (full 275-file tree searched). No plan documents for the website itself — plans live *as beads*.

---

## 2. Execution-readiness gates (verbatim)

There is no "plan approval" doc. The gates in this repo are **graph + tool gates**, enforced through AGENTS.md:

**Work-Graph Discipline** (AGENTS.md, Rule 0.5, quoting suite-wide rules — the suite file `/data/projects/AGENTS.md` is referenced by absolute local path and is **not in this repo**):

> "JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty."

The three load-bearing maxims quoted from the same referenced doc:

> "a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits; and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

**Agent interaction gate** — the only hard rule an agent must pass before touching the graph:

> "**NEVER FORGET THIS**: The ONLY allowed way to interact with beads is via the `br` command. DO NOT TRY TO DIRECTLY READ, CREATE, OR MODIFY BEADS BY MODIFYING JSON OR JSONL FILES. ONLY VIA `br`!"

**Pre-push gates** (AGENTS.md "Git Workflow" / "Deployment"):

1. `bun tsc --noEmit` and `bun lint` clean — "Fix issues at the root cause rather than just silencing rules."
2. `ubs` on changed files — "Exit 0 = safe. Exit >0 = fix & re-run."
3. `br close <id>` + `br sync --flush-only`, then commit code **and** `.beads/` together ("**MUST ALWAYS BE COMMITTED** … in the same commit").
4. `bun run build` succeeds locally before push → Vercel auto-deploys.

**Deletion gate** (RULE NUMBER 1, emphasized as agent-character correction):

> "**YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION FROM ME OR A DIRECT COMMAND FROM ME.** … You must **ALWAYS** ask and *receive* clear, written permission from me before ever even thinking of deleting a file or folder of any kind!"

[Inference] There is no phase-gate like "plan must pass review before agents are set free." Execution readiness = a well-formed bead graph (typed deps, no cycles, priorities) + tool gates. Readiness evidence for the *parent* build: the how-it-was-built build log shows plan documents committed first, plan upgraded to V6.1, then 15 feature beads with 46 subtasks created — i.e., plan-first → graph-second → code.

---

## 3. Honesty guardrails

**What exists in this repo [Verified]:**
- **Closure receipts:** 48 of 65 closed beads carry a `close_reason` field (e.g. bd-17l: "All sub-epics closed. bd-17l.1: Mobile tables (responsive cards, sr-only headers, data-labels, view toggle, TSV copy, …"). The reason string is the completion receipt — no separate evidence doc.
- **Upgrade receipts:** `UPGRADE_LOG.md` records per-package verification outcomes and a rollback with the upstream blocker link — honest failure accounting in prose.
- **Never-delete / never-weaken-gate rules** (AGENTS.md, quoted in §2) — the anti-reward-hacking spine, though defined in the off-repo suite file.
- **12 named reward-hacking patterns, ALL FORBIDDEN** (quoted from Rule 0.5): "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, **spec-editing as progress**, conformance metastasis, dependency smuggling, bench-path hardcoding." Note "spec-editing as progress" is the plan-integrity guardrail: editing the plan doc doesn't count as progress.
- **UBS pre-commit bug scanner** and **`cass` agent-history search** ("Before solving a problem from scratch, check if any agent already solved something similar") — cross-session memory as an anti-redundancy guardrail.
- **Changelog honesty:** CHANGELOG.md explicitly states "This project has no formal release tags or GitHub Releases."

**When installed / required [Inference from commit]:** The entire planning stack (AGENTS.md, .beads, scripts, changelog) landed in the single squashed HEAD commit (2026-09-22) — it was installed wholesale as "suite-wide rules … and canonical multi-agent conventions," i.e., inherited from the suite template rather than grown organically here.

**What's missing [Absent]:** No negative-evidence ledger, no claim matrix, no auto-demotion rules, no per-claim evidence receipts, no "discovered-from" chains used in this repo's graph (the dependency type exists in AGENTS.md docs but all 44 dependency edges here are `parent-child`). The `evidence.jsonl` in `public/web/assets/` is kernel telemetry, not planning evidence. The honest-reporting culture ("reporting a loss is a success") is asserted via the referenced suite doc, not demonstrated by an artifact here.

---

## 4. Plan → agent execution

**Task graph [Verified]:** `.beads/issues.jsonl` is the execution substrate: 7 epics decomposed into subtask trees (bd-ty6: 16 subtasks; bd-2eu: 8; bd-11i: 8; bd-2b4: 5; bd-17l: nested epics 2 levels deep). Epic descriptions carry an inline plan schema — verified in bd-11i and bd-ty6: `GOAL:` → `USE CASES:` → `TECHNICAL CHALLENGES:` → `DEPENDENCY:`. Example (bd-ty6): "GOAL: Serve the FrankenTUI interactive WASM showcase demo … KEY REQUIREMENT: Improvements to /dp/frankentui/ (new WASM bui[lds]…)". Subtasks follow a design→implement→test→demo pattern (bd-11i.1 "Design … API … This is a design-only task" → .2–.6 implement → .7–.8 unit/E2E tests).

**Execution loop:** `br ready` → claim (`br update <id> --status in_progress`) → implement/test/document → discovered work linked via `discovered-from` deps → `br close <id> --reason` → `br sync --flush-only` → commit code + `.beads/` together. The `bv` sidecar gives agents `--robot-plan` (JSON execution plan with parallel tracks), `--robot-insights` (PageRank, critical path, cycles), `--robot-priority`.

**Dialectical review [Absent]:** No two-model-against-each-other machinery in this repo. The closest relatives are: (a) the *parent* build's dual-model session counts (286 Claude Code + 516 Codex CLI sessions, `lib/content.ts`) — evidence of two models in the loop, surfaced as narrative not mechanism; (b) the Spec Evolution Lab's 11-bucket taxonomy of spec-doc corrections, which catalogs *mistake classes* found post-hoc, not an adversarial review process.

**Drift prevention [Verified]:** Two mechanisms, one broken. (1) Rule 0.5's anti-duplication rule: suite rules live in one place and "are NOT duplicated below, so they cannot drift out of sync" [Maintainer claim]. (2) In practice, the repo's own AGENTS.md header/body **drifted anyway** — it describes "Jeffrey Emanuel Personal Site" (`jeffrey_emanuel_personal_site`), Next.js pages (`app/about/`, `content/writing/`, `lib/constants.ts`) that don't exist here, and a `tailwind.config.ts`/`next.config.mjs` pair that isn't in the tree [Verified — file contents vs. tree]. So the drift rule covers the *suite-wide* section but the repo-specific section is a stale template copy. Notably, `.beads/.gitignore` + `config.yaml` (`history_enabled: false`) and the "single-writer on graph structure" rule prevent *graph* drift; nothing prevents *doc* drift.

---

## 5. State-of-the-art coverage

**No research/competitor/literature machinery in this repo [Absent]:** no `research/`, no literature briefs, no competitor matrices, no ADRs. The only comparison content is marketing copy on the site (e.g. bead bd-2b4.3 "Add FrankenTUI vs xterm.js comparison data and positioning content").

**What substitutes [Verified]:** forensic accountability instead of literature review. The Spec Evolution Lab (`app/how-it-was-built/spec-evolution-lab/`, dataset `public/how-it-was-built/frankentui_spec_evolution_dataset.json`) reconstructs every change to the parent repo's `docs/spec` corpus (31 commits) and manually categorizes each into 11 buckets:

> Buckets: 1 Logic/math/reasoning mistake fixes · 2 Inaccurate statements about FrankenTUI codebase · 3 Inaccurate statements about external terminal ecosystems · 4 Conceptual/architectural mistake fixes · 5 Ministerial/scrivening fixes · 6 Add background/context · 7 Standard engineering improvements · 8 Alien-artifact improvements · 9 Clarification/elaboration (non-substantive) · 10 Other · 0 Unreviewed.

[Inference] The taxonomy itself is a SOTA-correctness instrument: buckets 2 and 3 explicitly track *inaccurate claims* about the codebase and the external ecosystem — a plan-doc falsification ledger after the fact. Bucket 8 ("Alien-artifact improvements") is Emanuel's own term for the novel capabilities his method surfaces. The lab page describes it as "Forensic visualization of the FrankenTUI spec corpus evolving over time: reconstructed from git history and annotated with manual change-group categorization" [Maintainer claim, page.tsx].

**"Never lets sessions compact" [Inference → mostly Absent here]:** The parent-build narrative references "archived Claude Code + Codex CLI session logs" used to reconstruct the how-it-was-built page [Maintainer claim], and `cass` indexes agent history — but this repo contains no session logs, no compaction policy, and no anti-compaction rule.

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

[Verified] The anti-satisficing load is carried by **tool gates and graph analytics**, not red-team docs:
- `ubs <changed-files>` before every commit (exit 0 = safe), UBS fix workflow ("Verify real issue (not false positive) … Fix root cause (not symptom)").
- Playwright E2E suites with "structured logging", "deterministic fixture helpers" (bd-1av4o.13.2 in the parent graph), a11y + perf + mobile e2e specs in `tests/`.
- `bv --robot-insights/--robot-plan` — critical-path and PageRank-driven prioritization so agents work the highest-leverage bead; the triage export's `top_picks` carry reasons like "Unblocks 2 item(s)" and "High centrality in dependency graph (PageRank: 32%)".
- Type-check + lint + build as hard pre-push gates; `bun` exclusivity removes an entire class of environment drift.

[Absent] No red-team beads, no falsification campaigns, no adversarial-review issues in this repo's graph; the 4 open beads are ordinary bugs/tasks (Playwright cache corruption, test isolation `rm -rf` bug, pane-method coverage gap, WASM observability). The "spec-editing as progress" forbidden pattern is the closest anti-satisficing rule, but it lives in the referenced off-repo suite doc.

---

## 7. Explicit absences

- `docs/planning/`, `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `MUSE.md`, `CLAUDE.md`, `.claude/`, `.muse/`, `research/`, `ADRs/`, `DEFINITION_OF_DONE.md` — all [Absent] (full tree search).
- No definition-of-done document; completion criteria live per-bead ("completion criteria" is named on the /beads page but the criteria themselves are inline in bead descriptions + `close_reason`).
- No negative-evidence ledger, claim matrix, auto-demotion rules, or evidence receipts for planning claims.
- No `blocks`/`blocked-by` dependency edges in this repo's graph (only `parent-child`); "blocker beads gated on their named probe" is quoted from the suite doc, not instantiated here.
- No dialectical/two-model review machinery; no session logs or anti-compaction policy in-repo.
- The suite-wide rules file (`/data/projects/AGENTS.md`) is referenced but not vendored — the repo's doctrine has an off-repo dependency.
- Repo history is a single squashed commit, so no plan-evolution archaeology is possible inside this repo.

---

## 8. Maturity verdict

**Developing** (not thin, not mature).

The work-graph layer is genuinely mature [Verified]: a complete, typed, JSONL-backed DAG with epic→subtask decomposition, priorities, inline GOAL/CHALLENGES plan schemas, closure receipts, dependency analytics, and tool gates (ubs, tsc, lint, build, E2E) enforced by a detailed AGENTS.md. It demonstrates the suite's plan-first method faithfully — the embedded parent-build history even shows plans committed before code.

But the *planning doctrine itself* is inherited, not owned: no plan docs, no roadmap, no DoD, no honesty ledgers, no dialectical machinery in this repo — those live in the referenced off-repo suite file or in sibling repos. And the inheritance is visibly imperfect: AGENTS.md is a drifted template copy (wrong repo name, nonexistent pages) that directly contradicts its own anti-drift rule, and the one file literally named `evidence.jsonl` is kernel telemetry, not planning evidence. The repo is best read as a *showcase of the method's outputs* (the forensics pages) rather than a locus of the method itself — which, for a marketing site, is arguably the correct allocation.
