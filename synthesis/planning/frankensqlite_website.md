# Planning Methodology: frankensqlite_website
**Repo:** `Dicklesworthstone/frankensqlite_website` — marketing/docs website for FrankenSQLite (Next.js 16, React 19, TypeScript, Vercel-deployed)
**Analyzed:** 2026-09-22 (HEAD `361cdb7`, "docs(agents): synchronize suite-wide rules and canonical multi-agent conventions", committed 2026-09-22 13:22 EDT)
**Scope:** 137 files, 17 commits, 2026-02-26 → 2026-09-22

**TL;DR:** This repo contains almost no in-repo *planning* artifacts. It has one big agent-operating document (AGENTS.md, 589 lines, added at HEAD), a drained 9-issue beads tracker (all closed), and a changelog-as-evidence index. There is no docs/planning/**, no ROADMAP/BEADS/TODO/PLAN, no .muse/, no research/, no ADRs, no definition-of-done doc, no claim matrix, no negative-evidence ledger. Emanuel's planning machinery is visible here only by reference: AGENTS.md Rule 0.5 defers the load-bearing rules to a suite-wide file at `/data/projects/AGENTS.md` which is not in this repo. What is present is execution discipline, not planning discipline.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (589 lines) | Agent operating instructions | Everything: no-delete rule, irreversible-git doctrine, br/beads workflow, bv sidecar, UBS, cass, bun-only, pre-push checks; Rule 0.5 defers the 12 reward-hacking patterns + Work-Graph Discipline to suite-wide `/data/projects/AGENTS.md` [Verified] |
| `.beads/issues.jsonl` | Task tracker export (JSONL = truth) | 9 beads, **all closed**, priorities 1–3, created 2026-02-26→2026-04-10 by `ubuntu`; content PRAGMA/docs updates + perf optimization passes; zero open work [Verified] |
| `.beads/config.yaml` | Tracker config | 4 lines: `issue_prefix: bd`, `default_priority: 2`, `default_type: task` [Verified] |
| `.beads/metadata.json` | Tracker metadata | `{"database": "beads.db", "jsonl_export": "issues.jsonl"}` [Verified] |
| `.beads/.gitignore` | Tracker hygiene | Ignores `*.db`, `*.db-shm`, `*.db-wal`, `*.lock`, `last-touched`, `*.tmp` — the sqlite DB itself is disposable [Verified] |
| `CHANGELOG.md` (202 lines) | Evidence-preserving history | Full 17-commit index with hashes, types, per-commit summaries; launch-day scaffold (4 commits, ~25k lines) + perf campaign documented commit-by-commit [Verified] |
| `README.md` | Product documentation | Build/run/test instructions, design philosophy; no planning methodology content [Verified] |

Notably absent from the working tree entirely: `docs/` (no such directory), `.muse/`, `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `CLAUDE.md`, `MUSE.md`, `research/`, ADRs, any file with plan/claim/evidence/definition-of-done in its name [Absent — verified by `find` + `grep -ril` sweep]. (A false positive: `components/viz/witness-plane.tsx` matched "plan" only as a substring of "plane".)

---

## 2. Execution-readiness gates

There is no formal "plan passes gate X before agents are released" document in this repo. What exists are **change-readiness gates** in AGENTS.md — conditions every change must satisfy. Verbatim:

**Pre-push checklist (AGENTS.md "Deployment (Vercel)"):**
> "**Before pushing:** 1. Ensure `bun run build` succeeds locally 2. Check for TypeScript errors with `bun tsc --noEmit` 3. Verify the dev server works: `bun dev`"

**Post-change static checks (AGENTS.md "Static Analysis & Type Safety"):**
> "**CRITICAL:** After any substantive changes to TypeScript/React code, verify no lint or type errors: … Fix issues at the root cause rather than just silencing rules."

**UBS pre-commit gate (AGENTS.md "UBS Quick Reference"):**
> "**Golden Rule:** `ubs <changed-files>` before every commit. Exit 0 = safe. Exit >0 = fix & re-run."

**Work-graph gates (AGENTS.md Rule 0.5, Work-Graph Discipline):**
> "`br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads **gated on their named probe**, `br dep cycles` stays empty."
> "JSONL is truth and `beads.db` is disposable"

**Gate-integrity doctrine (AGENTS.md Rule 0.5):**
> "**never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits"

**File-sprawl gate (AGENTS.md "Backwards Compatibility & File Sprawl"):**
> "The bar for adding a new file should be **incredibly high**." … "You may NEVER create files like `componentV2.tsx`, `componentImproved.tsx`, `componentNew.tsx`, etc."

**Deletion gate (AGENTS.md Rule Number 1):**
> "**YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION FROM ME OR A DIRECT COMMAND FROM ME.**"

[All Verified — read in `AGENTS.md` at HEAD.]

---

## 3. Honesty guardrails

**What exists in-repo:**

- **Named reward-hacking patterns (12):** AGENTS.md Rule 0.5 lists them verbatim, observed in the suite: "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding" — all **FORBIDDEN** [Verified, AGENTS.md ll. 7–13]. The *definitions* of these patterns live in the absent suite-wide file; only names arrive in-repo.
- **Self-speedup honesty rule (perf context):** "a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation" [Verified, AGENTS.md l. 16].
- **Loss-reporting as success:** "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative" [Verified, AGENTS.md ll. 19–20].
- **Beads close-reason evidence:** The tracker schema includes `close_reason`, and several beads show evidence-bound closures, e.g. bd-3f2: "All 99 tests pass, TypeScript clean, lint clean, build succeeds" and bd-1ih: "Added Configuration section to getting-started page with PRAGMA examples…" [Verified, `.beads/issues.jsonl`].
- **AGENTS.md AGENTS workflow:** "Check `br ready` before asking 'what should I work on?'" — discovered work must be created with `discovered-from` dependencies linking back to the parent bead [Verified, AGENTS.md "Workflow for AI Agents"].

**What's missing / timing:**

- No negative-evidence ledger file exists. Negative evidence is handled as a *behavioral doctrine* ("reporting a loss is a success") plus changelog narrative, not a ledger. [Absent]
- No claim-matrix document. Claims live in beads close_reasons and CHANGELOG entries. [Absent]
- No auto-demotion rules in-repo. [Absent]
- **Lifecycle note [Inference]:** Honesty guardrails appear to be installed *suite-wide* and inherited here, not invented for this repo. The AGENTS.md in this repo was written (or at least fully synchronized) at HEAD on 2026-09-22, months after the last functional commit (2026-03-16) and the last bead activity (2026-04-10) — this is a retroactive synchronization pass, not a lifecycle installment. The working evidence (bd close_reasons with test counts) dates from Feb–Apr 2026, showing the honesty conventions were *practiced* before they were *codified* in-repo.

---

## 4. Plan → agent execution

**Task graph:** `.beads/issues.jsonl` is the work graph; `br` (beads_rust) is the only legal interface. AGENTS.md states: "The ONLY allowed way to interact with beads is via the `br` command. DO NOT TRY TO DIRECTLY READ, CREATE, OR MODIFY BEADS BY MODIFYING JSON OR JSONL FILES." (Irony noted: this analyst read the JSONL directly, as a read-only observer, per task instructions — the prohibition binds agents executing work, and I flag the tension here rather than obey it over the task.) "Do NOT use markdown TODOs, task lists, or other tracking methods." [Verified, AGENTS.md]

**Phases:** The bead set shows a real two-phase shape: Phase 1 (2026-02-26) = content/feature beads (getting-started PRAGMAs, encryption features, ECS storage-mode info); Phase 2 (2026-02-27 → 04-10) = a perf-optimization *campaign* (bd-1p5 → bd-2xx → bd-k6u → bd-lgs → bd-35y, a chain of "round 2" / "second pass" isomorphic perf beads) [Verified, `.beads/issues.jsonl` timestamps + titles; CHANGELOG "Issue Tracker Housekeeping" table corroborates].

**Verification loops:** The canonical loop is: work bead → `bun tsc --noEmit` + `bun lint` → `ubs` on changed files (exit 0) → `br close` with evidence in close_reason → `br sync --flush-only` → commit code AND `.beads/` together ("**MUST ALWAYS BE COMMITTED** … in the same commit to keep issue state synchronized with code state") → push → Vercel [Verified, AGENTS.md "Git Workflow"].

**Dialectical / two-model review:** [Absent in-repo.] No grader, dialectic, or adversarial-review mechanism is documented anywhere in this repo's files. The closest in-repo machinery is `bv --robot-insights` ("JSON graph metrics (PageRank, critical path, cycles)") and `bv --robot-priority` ("JSON priority recommendations with reasoning") — graph-analytic sidecars for prioritization, not adversarial review [Verified, AGENTS.md "Using bv as an AI sidecar"].

**Drift prevention:**
- "JSONL is truth and `beads.db` is disposable" + `br sync --import-only` after every pull + "single-writer on graph structure" + "`br dep cycles` stays empty" [Verified, AGENTS.md Rule 0.5].
- "If you want to change something or add a feature, you MUST revise the **existing** code file in place" — anti-sprawl = anti-drift on the codebase itself [Verified, AGENTS.md].
- "NEVER run a script that processes/changes code files in this repo. No 'code mods' you just invented, no giant regex-based `sed` one-liners" — a direct scar-tissue rule against agent-driven drift [Maintainer claim, AGENTS.md "Code Editing Discipline"].
- "apply them **manually** and review diffs" for parallel-subagent edits — human (maintainer) review as the final drift check [Verified, AGENTS.md l. 121].

**Mechanical parallelization:** "If many changes are needed but they're **mechanical**, use several subagents in parallel to make the edits, but still apply them **manually** and review diffs" [Verified, AGENTS.md l. 121]. This is the only in-repo mention of parallel subagents, and it is *execution* parallelism with a manual merge step — not planning parallelism.

---

## 5. State-of-the-art coverage

[Absent as a planning artifact.] There is no `research/`, `docs/research/**`, competitor-scan, or literature-review mechanism in this repo. The closest:

- `cass` ("Search Agent History"): "indexes conversations from Claude Code, Codex, Cursor, and more… Before solving a problem from scratch, check if any agent already solved something similar." — an *institutional memory* mechanism (prior agent work), not a literature mechanism [Verified, AGENTS.md].
- The site's own comparison table (FrankenSQLite vs C SQLite vs sqlx vs diesel, `lib/content.ts`) is product positioning, not SOTA coverage of planning [Verified].
- The `/spec_evolution` viewer is evidence infrastructure for the *engine* repo's spec history, not for this website's planning [Verified, AGENTS.md "Spec Evolution Viewer"].

No evidence of competitor scans, arXiv/paper mechanisms, or "what does the state of the art say" steps in this repo's process.

---

## 6. Anti-satisficing

[Absent as a campaign mechanism; present as doctrine fragments.]

- **Falsification-adjacent:** "Fix issues at the root cause rather than just silencing rules" [Verified, AGENTS.md]; "never weaken a gate" doctrine [Verified]; the 12 named reward-hacking patterns, several of which are anti-satisficing names ("tautological tests", "easy-lever cherry-picking", "proof-class inflation") [Verified, AGENTS.md Rule 0.5].
- **Red-team campaigns:** none documented in-repo. [Absent]
- **Repeated-pass discipline as anti-satisficing evidence [Inference]:** the bead record shows four sequential perf passes (bd-1p5 → bd-2xx → bd-k6u → bd-lgs, ending bd-35y six weeks later), i.e., the maintainer does not accept "optimized" at the first pass. Combined with "reporting a loss is a success," this is the closest this repo gets to an anti-satisficing loop — but it is *practiced* (visible in bead titles/timestamps) rather than *proceduralized* (no doc says "do N passes").

---

## 7. Explicit absences

All verified by filename sweep (`find` + `grep -rilE 'roadmap|definition-of-done|definition of done|claim.?matrix|negative.?evidence|red.?team|adr|falsif|gate\b|sign.?off'` over all `.md`/`.yaml`/`.json`, excluding `.git`) and directory listing:

1. `docs/planning/**` — [Absent] (no `docs/` at all)
2. `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` — [Absent]
3. `CLAUDE.md` / `MUSE.md` — [Absent] (only `AGENTS.md`)
4. `.muse/` — [Absent]
5. `docs/research/**`, ADRs — [Absent]
6. Definition-of-done document — [Absent] (gates exist as scattered AGENTS.md rules, not a DoD doc)
7. Claim matrix — [Absent]
8. Negative-evidence ledger — [Absent]
9. Auto-demotion rules — [Absent]
10. Receipt-bound evidence (beyond beads `close_reason` text) — [Absent as a formal mechanism]
11. Dialectical / two-model / grader review procedures — [Absent]
12. Task-tracker with live work: the tracker is **drained** — 9/9 beads closed, 0 open, 0 `in_progress`; last bead activity 2026-04-10. No planning is currently in flight in this repo [Verified, `.beads/issues.jsonl`].
13. The suite-wide rulebook (`/data/projects/AGENTS.md`, referenced in AGENTS.md Rule 0.5 as binding) — [Absent from the repo]; the 12 pattern *names* arrive here but their definitions and the full Work-Graph Discipline live elsewhere.

---

## 8. Maturity verdict: **THIN** (in-repo planning), with suite-inherited discipline

**Why thin:** The classic Emanuel planning surface (planning docs, research briefs, roadmaps, DoD, dialectical review) is not in this repo. The repo stood up in **four launch-day commits on 2026-02-26** totaling ~25k lines (AGENTS.md absent until HEAD) — planning, if any, happened outside the repo. What the repo does have is *operating discipline*, not *planning machinery*:

- A 589-line AGENTS.md synchronized at HEAD (2026-09-22), retroactively canonizing suite conventions into a repo whose last functional work was March–April 2026 [Verified].
- A beads tracker with the full schema (dependencies, `discovered-from` links, named probes, priorities, `close_reason` evidence) but, in this repo, an unusually flat instantiation: 9 beads, no `deps` fields populated in any entry, no epics, no open work [Verified, `.beads/issues.jsonl`].
- Evidence discipline is real but lightweight: beads close with test/lint/build receipts; CHANGELOG indexes every commit; code and tracker state must commit together.
- The sharpest planning-relevant artifact is the perf campaign's *shape* (four sequential optimization passes over six weeks) — satisficing-resistance by practice, not by procedure [Inference].

**The distinctive caveat for the cross-suite synthesis:** frankensqlite_website is a *marketing website* repo, not an engine repo. Its planning footprint suggests Emanuel scales planning machinery to the stakes of the artifact: the website got a drained tracker and inherited operating rules, while the 5–8-round adversarial grading loops and planning phases belong (per suite pattern) to the engine repos. Do not read this repo's thinness as the suite's thinness — read it as evidence that the planning method is *not* uniformly applied; it's proportional to the artifact. [Inference]
