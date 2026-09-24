# Beads for FrankenTUI — RULEBOOK v1.0 Assessment Packet v5

**Repository:** `Dicklesworthstone/beads-for-frankentui` · **Language:** JavaScript/HTML/CSS (static SPA; no Rust, no build step in-repo) [Code-verified, High] · **Pinned commit:** `e1a842f6a1e37f9c5f9648634652163219aa461e` (2026-09-21 10:04:11 −0400, [Git-observed, High]) · **Last push:** 2026-09-21 (the pin; pushed 14:07:17Z per GitHub API) [External, High] · **Scope:** the pinned commit only. No tags; GitHub Releases API returns 0 releases; 8 commits total, all by Jeff Emanuel (GitHub user `Dicklesworthstone` — profile name verified via API); 12 stars / 2 forks [Git-observed + External, High]. *Cold-reader note: this repo is a generated deployment artifact of the [`beads_viewer`](https://github.com/Dicklesworthstone/beads_viewer) tool (`bv`), not the tool itself. "v5" = fifth draft of this packet after four full grader rounds (A+B with cross-checks).*

**Method (analyst):** shallow clone checked out at the pin under `~/workspace/.scratch/beads-verify` (deepened blobless for the full 8-commit history); working tree stayed at the pin. Read: README, CHANGELOG, `.github/workflows/static.yml`, `data/meta.json`, `data/project_health.json`, `data/triage.json` (keys + `commands`), `beads.sqlite3.config.json`, `wasm_loader.js` and `hybrid_scorer.test.js` (full), and the `bv` README's `--pages` export section (public, for the documented generator interface). Executed: `hybrid_scorer.test.js` under a browser-shim in Node 24 (passed); SQLite row counts on `beads.sqlite3` (2,590 issues / 3,700 dependency rows); **SHA-256 of all 11 chunks vs the manifest (11/11 match; reassembled bytes identical to `beads.sqlite3`; manifest whole-db hash matches)**; line counts over first-party files (16,196 — all bv-emitted, not hand-written); vendor inventory; zero-external-URL check on `index.html`; GitHub REST API (**all 57 workflow runs: 35 success, 22 cancelled, 0 failed**; stars/forks/license/pushes; 0 releases); live dashboard HTTP check (200, 302,049 bytes); all 8 quick links below individually HTTP-checked (200); one web search for independent coverage. **Not done:** no live-browser run of the dashboard (no browser control in this environment) — chunk reassembly, FTS5 search, WASM PageRank execution, and the offline path are code-verified, not executed; the hybrid scorer test ran under a Node `window`-shim, not a real DOM; frankentui's current bead count was not pulled (its HEAD pushed 2026-09-22, after the pin — the snapshot predates it regardless); no performance measurement (no benchmarks exist to audit). Assessment date: 2026-09-22.

**Tier legend (Rulebook §1):** **[Verified]** direct inspection of the pinned clone or a live page read by the analyst — flavors **[Counted]** (I ran the count), **[Git-observed]** (git metadata), **[Code-verified]** (source read); **[CI-observed]** is Tier 2 (seen executing on live CI pages — attests the suite *runs*, not that it is green); **[Maintainer claim]** asserted in README/CHANGELOG/docs, not independently executed; **[External]** independent sources; **[Inference]** analyst judgment, always labeled. Confidence: **High** / **Medium** / **Low**.

---

## Hook

A fully offline-capable dashboard for frankentui's issue tracker that ships its entire 10 MB backend as eleven 1 MB binary chunks, reassembled in your browser with SHA-256 integrity checks — and whose data is a **197-day-old snapshot**, whose repository description once called it a CLI, and which has **no license file at all**. It is not a product; it is a deployment artifact with a URL. Its own CHANGELOG is what convicts it: orphan commits, removed features, and metric regressions, all written down and dated.

---

## TL;DR

- **What it is:** a `bv --pages` (beads_viewer) static-site deployment: an interactive dashboard over frankentui's beads issue database (2,590 issues / 3,700 dependencies at the snapshot), published to GitHub Pages. 16,196 lines of **bv-generated** JS/HTML/CSS (not hand-written in this repo) plus a vendored offline stack (sql.js, d3, force-graph, a Rust-compiled PageRank WASM module) and a chunked 10 MB SQLite database — zero external URLs at runtime [Counted/Code-verified/External, High].
- **Strongest evidence:** the deployment record is candid to a fault — orphan-commit topology documented, stale tables admitted, a real SHA-256 chunk manifest whose hashes the analyst re-verified 11/11 [Verified, High], the pin's deploy run green [CI-observed, High], the scorer self-test passing when executed by the analyst [Verified, Medium], and the live site returning HTTP 200 [External, High].
- **Strongest doubts:** the snapshot is frozen at **2026-03-08** — 197 days (~6.5 months) before the pin — so every number on the dashboard is a March fossil (frankentui itself kept shipping; its HEAD pushed 2026-09-22, after the pin) [Code-verified, High]; there is **no LICENSE file** and the GitHub API license field is null [Code-verified/External, High]; CI does nothing but deploy — 35 of 57 runs succeeded, 22 cancelled, 0 failed — and the only test file is a browser-embedded self-test no CI ever runs [CI-observed + Code-verified, High]; `wasm_loader.js` imports `./wasm/bv_hybrid_scorer.js`, a path that **does not exist** in the tree (dead code behind a 5,000-issue threshold the snapshot never reaches) [Code-verified, High]; bus factor 1 across all 8 commits [Git-observed, High].
- **NODUS ring: Monitor** [Inference, Medium] (TRL 8 — see §4.9). TRL rates the *deployed technology* (proven in operation); the ring rates the *artifact's current fitness* — a website serving a 197-day-old snapshot with no releases, no independent validation, and no development beyond formatting. The value that survives is the *pattern* — `bv --pages` as the FrankenSuite's evidence-dashboard template — and that lives in beads_viewer (1,691 stars), not here.

---

## Quick Links

Each verified HTTP 200 on 2026-09-22 [External, High]:

1. [Repository](https://github.com/Dicklesworthstone/beads-for-frankentui)
2. [Live dashboard](https://Dicklesworthstone.github.io/beads-for-frankentui/) — 302,049 bytes
3. [README (auto-generated snapshot summary)](https://github.com/Dicklesworthstone/beads-for-frankentui/blob/HEAD/README.md)
4. [CHANGELOG (deployment history, candid)](https://github.com/Dicklesworthstone/beads-for-frankentui/blob/HEAD/CHANGELOG.md)
5. [Pages deploy workflow](https://github.com/Dicklesworthstone/beads-for-frankentui/blob/HEAD/.github/workflows/static.yml) — deploy-only, no tests
6. [Snapshot metadata](https://github.com/Dicklesworthstone/beads-for-frankentui/blob/HEAD/data/meta.json) — `generated_at: 2026-03-08T18:41:03Z`
7. [Chunk manifest (SHA-256)](https://github.com/Dicklesworthstone/beads-for-frankentui/blob/HEAD/beads.sqlite3.config.json)
8. [Generator: beads_viewer (bv)](https://github.com/Dicklesworthstone/beads_viewer) — 1,691 stars; the actual product behind this artifact
9. [Actions history](https://github.com/Dicklesworthstone/beads-for-frankentui/actions) — 57 runs: 35 success, 22 cancelled, 0 failed; the pin's run green
10. [Pin commit](https://github.com/Dicklesworthstone/beads-for-frankentui/commit/e1a842f6a1e37f9c5f9648634652163219aa461e) — formatting pass, Co-authored-by: Grok

---

---

## Did You Know

The pin commit — the freshest change in the repository, dated 2026-09-21 — is a pure formatting pass ("Quote/arrow/wrapping pass on charts, graph, hybrid scorer, viewer, and wasm loader. JSON graph_layout/triage are pretty-printed") and it is **Co-authored-by: Grok** [Git-observed, High]. So the newest agent collaboration in this repo polished the dashboard's whitespace while its *data* sat untouched since March — the agent that formatted the JavaScript could have regenerated the snapshot, and didn't [the counterfactual is Inference, Medium]. That is the staleness mechanism in miniature.

---

## Franken-worthy next steps

Each is backed by an integrity discipline this repo *demonstrates* (not generic hygiene), and each is falsifiable:

1. **Extend the SHA-256 manifest discipline to data freshness: hash-pin the source revision in the snapshot manifest.** The chunk manifest already proves every byte of the database; what it doesn't record is *which frankentui commit* the snapshot came from. Adding the source HEAD hash next to `generated_at` in `meta.json` turns "stale" from an accusation into a measured quantity — the same integrity machinery, pointed at provenance. *Done when:* `meta.json` carries a source-revision hash verifiable against the frankentui repo. [Inference, High]
2. **Put the scorer self-test in CI — the author already wrote the test.** `hybrid_scorer.test.js` exists and passes under a 20-line Node `window`-shim (the analyst's exact harness); it runs nowhere today. Wiring it into `static.yml` converts a decorative test into the repo's first real gate, honoring the evident intent. *Done when:* a workflow run shows the test step green on a fresh push. [Inference, High]
3. **Resolve the dangling WASM import — the fallback discipline is proven, the artifact is missing.** Either vendor `./wasm/bv_hybrid_scorer.js` or delete the loader: the graceful-degradation design (JS fallback on import failure) is good engineering wrapped around a hole. *Done when:* no import in the deployed tree points at a missing path. [Inference, High]
4. **License the artifact or label it not-for-reuse — the CHANGELOG's honesty norm demands it.** A document that candidly admits orphan commits and removed features should not silently ship 16,196 unlicensed lines; MIT (or an explicit "generated artifact, do not reuse" notice) is a five-minute fix consistent with the repo's own candor. *Done when:* a LICENSE file or reuse notice exists at HEAD. [Inference, High]
5. **Export the pattern, not the repo: make `bv --pages` (which already supports `--watch-export`) the FrankenSuite's standard evidence-dashboard template.** This repo accidentally demonstrates the suite's cheapest auditability upgrade — every franken repo's beads DB rendered as a self-contained, offline, SHA-256-verified static site — and the generator already has watch-mode; only the scheduled regeneration is missing. *Done when:* one sibling repo ships a bv-generated dashboard from its own beads DB. [Inference, Medium]

---

## 4.1 Why it exists — the market problem

**The problem, as the maintainer frames it:** frankentui — a terminal-UI framework with 283 stars and a large agent-driven development program — tracks its work in `beads`, a SQLite-backed issue tracker whose database lives in the repo. A 2,590-issue dependency graph is not navigable from JSONL or SQL alone; the maintainer's stated bet is that a pre-computed, interactive, shareable dashboard (dependency graph with PageRank, triage recommendations, burndown charts, full-text search) makes a thousand-issue backlog legible to humans and agents alike [Maintainer claim, Medium — from the CHANGELOG's "Deployment mechanism" section and README footer].

**Who feels the pain:** anyone trying to answer "what should I work on next" or "what blocks the most downstream work" in a repo with thousands of tracked issues — in practice, the maintainer himself and the agents driving frankentui's development [Inference, Medium].

**Why now:** the frankentui program generates issues faster than a human can triage them (the CHANGELOG records 1,237 closures in a single week in February); an automatically regenerated dashboard is a triage surface that scales with agent-driven development [Inference, Medium — the "only surface that scales" phrasing would be stronger than the evidence; one surface among few].

**Why a static site, not a server:** the CHANGELOG states the design explicitly — "fully self-contained, offline-capable single-page application with no server-side component. All querying happens client-side via sql.js WASM against a chunked SQLite database." GitHub Pages hosting is free, the artifact is content-addressed by chunk hashes, and there is nothing to operate [Maintainer claim, High — corroborated by the tree: zero external URLs, vendored WASM, chunk manifest].

**The staleness mechanism (why March?):** the dashboard competes with its own generator for maintenance energy. `bv` (the TUI, 1,691 stars) is the maintainer's daily driver and the living product; this static export is a byproduct that only refreshes when someone runs the wizard. Three deployments in five weeks, then silence — the byproduct starved while the product ate [Inference, Medium].

**Demand-side check:** no independent coverage of this dashboard exists beyond its own GitHub pages [External, High within recall caveats — one web search, 2026-09-22]. The generator behind it, beads_viewer, has 1,691 stars [External, High] — the demand signal belongs to the tool, not this deployment. This repo's own star count is 12 [External, High] (the "~6 stars" figure in circulation is stale).

## 4.2 What it is — repo TL;DR

An 8-commit, single-author repository whose entire contents are one `bv --pages` deployment plus maintenance commits around it: a static SPA rendering frankentui's beads issue graph. **Every application line is bv-emitted, not hand-written here** — the repo is the generator's output, committed as orphans. The application layer is 16,196 generated lines — `viewer.js` (3,604: OPFS caching, chunk reassembly, FTS5 search, issue rendering), `graph.js` (3,937: force-directed graph with WASM PageRank), `index.html` (4,134: Alpine.js shell), `styles.css` (2,456), `charts.js` (763: Chart.js analytics), `graph-demo.html` (863: standalone graph demo page), plus `hybrid_scorer.js` (104: client-side graph-aware search ranking), `wasm_loader.js` (152), `coi-serviceworker.js` (136) — backed by a 10.1 MB SQLite database shipped as eleven 1 MB chunks with a SHA-256 manifest, and pre-computed `data/` JSON (graph layout, triage, project health) [all Counted, High]. The README footer says "Generated Mar 8, 2026 at 2:41 PM EDT by bv," and the CHANGELOG documents three `bv --pages` deployments (Feb 4, Feb 9, Mar 8) [Maintainer claim + Git-observed, High]. The tree at the pin differs from the Mar 8 deployment only by maintenance commits: two docs commits (Mar 21), a `.gitignore` addition (Apr 11), a branch-harmonization merge (Sep 3), and two Sep 21 formatting commits (both Co-authored-by: Grok) — **no data regeneration in 197 days** [Git-observed, High].

One-line verdict: **a working, candid, unlicensed deployment artifact whose generated code is maintained and whose data is a fossil — valuable as a pattern for the FrankenSuite, not as a product to adopt.** (NODUS: Monitor — see §4.9.)

## 4.3 Repo facts (claim inventory)

Every claim re-verified against the pinned commit on 2026-09-22.

| # | Claim | Status | Evidence | Tier, Confidence |
|---|-------|--------|----------|------------------|
| 1 | "A minimal task-tracking CLI" (circulating description) | **disproven** | The tree contains no CLI, no binary, no Rust, no build step. GitHub API `description` now reads "Issue tracker dashboard" [External, High]; the deployed artifact is a static SPA [Code-verified, High] |
| 2 | 16,196 application lines (HTML/JS/CSS, excl. vendor + data) | demonstrated | `wc -l` over the 10 first-party files at the pin — all bv-emitted generated code, not hand-authored in this repo | [Counted, High] |
| 3 | Snapshot: 2,590 issues, 3,700 dependencies, 92% complete | demonstrated (numbers) | Analyst's Python count on `beads.sqlite3` at pin: 2,590 issues, 204 open, 3,700 dependency rows; README matches on issues | [Counted, High] |
| 4 | README dependency figure "3696" vs DB "3700" | stale (minor drift) | README graph section says 3,696; `data/project_health.json` says `edge_count: 3696`; DB and `meta.json` say 3,700. Four-edge drift inside the same snapshot — see fidelity table in §4.5 | [Counted, High] |
| 5 | Snapshot generated 2026-03-08; data 197 days stale at pin | demonstrated | `data/meta.json` `generated_at: 2026-03-08T18:41:03Z` unchanged through the pin commit (verified via `git show` at pin and parent) | [Code-verified + Git-observed, High] |
| 6 | Fully self-contained / offline-capable | demonstrated | Zero external `src`/`href` URLs in `index.html`; all 15 vendor files local; a real CSP meta tag enforces `default-src 'self'` (index.html L28–30) | [Code-verified, High] |
| 7 | SQLite reassembled client-side with SHA-256 chunk integrity | demonstrated | Analyst verified: 11/11 chunk hashes match manifest; concatenated chunks byte-identical to `beads.sqlite3`; manifest whole-db hash matches. (The in-browser fetch cycle itself not executed — no browser control.) | [Verified, High] |
| 8 | WASM PageRank/centrality module (Rust-compiled `bv_graph`) | demonstrated | `vendor/bv_graph.js` + 216 KB `bv_graph_bg.wasm` present; `viewer.js:694` dynamic-imports it and instantiates `DiGraph` | [Code-verified, High] |
| 9 | WASM hybrid scorer with 5,000-issue threshold | **disproven as deployed** | `wasm_loader.js` imports `./wasm/bv_hybrid_scorer.js` — **no `wasm/` directory exists in the tree**. Threshold (5,000) exceeds the snapshot (2,590), so the import is never attempted; if reached, the import would fail and the catch would fall back to the JS scorer with a console warning | [Code-verified, High] |
| 10 | Client-side hybrid search ranking (5 presets) | demonstrated | `hybrid_scorer.js` (104 lines) implements it; the 47-line self-test **passed** under the analyst's Node `window`-shim harness | [Code-verified, High on existence; Verified, Medium on the passing run] |
| 11 | CI: deploy-only; 35 success / 22 cancelled / 0 failed across 57 runs; pin's run green | demonstrated | Single workflow `static.yml` (checkout → configure-pages → upload artifact → deploy); full 57-run pull via API; run 35610003445 at the pin succeeded. The 22 cancellations are unexplained by the workflow file (`cancel-in-progress: false`) — plausibly superseded pushes or manual cancels [Inference, Low] | [CI-observed, High] |
| 12 | `hybrid_scorer.test.js` = the repo's only test | demonstrated (existence); **not CI-executed** | 47-line browser-embedded IIFE self-test; no test step in `static.yml`; no package.json, no runner config | [Code-verified, High] |
| 13 | No LICENSE file; unlicensed | demonstrated | No LICENSE in tree; GitHub API `license: null`; no license headers in inspected sources. With no license grant, no party holds reuse rights — the inverse of the FrankenSuite's usual MIT+AI-lab-rider posture (the rider is N/A here because there is no license at all) | [Code-verified + External, High] |
| 14 | Orphan-commit deployment topology | demonstrated | `bv --pages` commits are orphans (CHANGELOG + `git log`: d1a4f98, aaa08c9 have no parents); CHANGELOG documents branch topology honestly | [Git-observed + Maintainer claim, High] |
| 15 | "AI-generated triage recommendations" | partially demonstrated | `data/triage.json` exists with `recommendations`/`quick_wins`/`blockers_to_clear`/`commands` (keys verified: claim_top, show_top, list_ready, list_blocked, refresh_triage); the "AI-generated" half is maintainer assertion, and the content is March-stale | [Code-verified, Medium] |
| 16 | CHANGELOG's initial-deployment file table (42,324 lines; viewer.js 3,510) | stale | Describes the Feb 4 tree; at the pin viewer.js is 3,604 lines, graph.js 3,847 → 3,937. The CHANGELOG also omits the Apr/Sep maintenance commits entirely | [Counted + Git-observed, High] |

**What the inventory says in aggregate:** claims about the *artifact's construction* (self-containment, chunk integrity — now analyst-verified 11/11, WASM graph module, deploy history) verify at High confidence; claims about the *dashboard's content* are frozen in March; and two claims fail outright — the "CLI" description and the WASM scorer import. The honesty gradient runs opposite to most repos assessed in this program: the code is truthful, the data is a fossil, and the docs say so.

## 4.4 Codebase tour

**Topology (no crates, no modules — a flat static tree) [Counted, High]:** the entire application is 10 bv-generated files at the repo root plus `data/` (4 JSON), `chunks/` (11 × 1 MB `.bin`), `vendor/` (15 vendored files), `.github/workflows/static.yml`. No `package.json`, no bundler — the build system is **external**: `bv --pages` on the maintainer's machine, whose output is committed as an orphan. Saying "no build system" would be wrong; the build system lives upstream.

**Data flow, end to end:**

- **Boot — `index.html` → `coi-serviceworker.js`:** the service worker sets Cross-Origin-Isolation headers so `SharedArrayBuffer` works on GitHub Pages (required by sql.js WASM threading); the HTML shell carries a CSP and zero external references [Code-verified, High].
- **Database — `chunks/` → `viewer.js` → sql.js WASM:** `viewer.js` fetches the 11 chunks, verifies SHA-256 against `beads.sqlite3.config.json`, reassembles the 10.1 MB database, caches it in OPFS, and queries it via `vendor/sql-wasm.js`/`.wasm` — including FTS5 full-text search and materialized views (`issue_overview_mv`) [Code-verified, High on the code path; the actual fetch+verify cycle not executed in a browser].
- **Graph — `graph.js` + `vendor/bv_graph_bg.wasm`:** dependency DAG rendered with force-graph (d3 under the hood); PageRank/centrality/shortest-path computed in the Rust-compiled WASM module, dynamically imported by viewer.js and shared to graph.js via `window.bvGraphWasm` [Code-verified, High]. `graph-demo.html` is a standalone demo of the same graph view with the JetBrains Mono font.
- **Search ranking — `hybrid_scorer.js` / `wasm_loader.js`:** text score × PageRank × status × impact × priority × recency with 5 presets (default, bug-hunting, sprint-planning, impact-first, text-only); the JS implementation is real and its self-test passes; the WASM fast path is dead code in this deployment (claim 9) [Code-verified, High].
- **Analytics — `charts.js`:** Chart.js burndown/burnup, label heatmap, priority/type distributions from `data/project_health.json` [Code-verified, Medium — file read, behavior not executed].
- **Triage — `data/triage.json` (720 lines):** pre-computed recommendations, quick wins, blockers-to-clear, and `commands` (claim_top, show_top, list_ready, list_blocked, refresh_triage) — the seed of a machine-readable agent API — rendered into the README and the dashboard [Code-verified, High].

**Dependency posture:** 15 vendored files, ~6.2 MB total — Alpine.js, Tailwind (676 KB JIT script), d3 v7, force-graph, Chart.js, Mermaid (3.2 MB — the single largest vendor file, and the clearest vendoring cost), Marked, DOMPurify, sql.js + 640 KB WASM, bv_graph + 216 KB WASM, two woff2 fonts. Vendoring is the offline story and it is complete [Counted, High]. No `asupersync`, no Rust toolchain, no npm — the asupersync question is not applicable to a static site [Code-verified, High].

**The formatting commits (pin):** `e1946a2` (vendor reformat) + `e1a842f` (first-party reformat — both Co-authored-by: Grok) touched 11 files, +14,400/−48,636 lines — quote/arrow/wrapping normalization and JSON pretty-printing, with scoring weights numerically unchanged (0.40 → 0.4) per the commit message [Git-observed, High]. Pure hygiene; zero functional or data change.

## 4.5 The maintainer's stated case

**The pitch, in the maintainer's own structure (CHANGELOG "Deployment mechanism" + README):**

1. **Legibility at scale:** a 2,590-issue dependency graph with PageRank impact scores, critical bottlenecks, and quick wins — "top priorities" and "critical bottlenecks" computed, not hand-curated [Maintainer claim, Medium].
2. **Zero-ops publishing:** `bv --pages` snapshots the beads SQLite DB, pre-computes layouts/triage, chunks the DB with SHA-256 hashes, bundles a self-contained SPA, and force-pushes an orphan commit; GitHub Actions deploys to Pages. "No server-side component" [Maintainer claim, High — corroborated by the tree].
3. **Offline-first:** every dependency vendored, fonts included, service worker for COI — the dashboard works without network after first load [Maintainer claim, Medium — zero external URLs verified; actual offline load not executed].
4. **Honest history:** the CHANGELOG documents the orphan topology, the removed `history.json`, per-deployment metric deltas, and the candid line "There are no semver tags or GitHub Releases in this repository" [Maintainer claim, High].

**Data-fidelity audit (the benchmark-table substitute):** no performance benchmarks or conformance suites exist — this is a dashboard, not an engine. The auditable numbers are the fidelity figures, counted vs. claimed side by side per the Rulebook:

| Metric | README claims | meta.json | project_health.json | Analyst's DB count |
|---|---|---|---|---|
| Total issues | 2,590 | 2,590 | 2,590 | **2,590** ✓ |
| Dependencies | 3,696 | 3,700 | 3,696 (edge_count) | **3,700** (rows) |
| Completion | 92% | — | 2,386 closed / 2,590 = 92.1% | **92.1%** ✓ |
| Actionable / blocked | 47 / 157 | — | 47 / 157 | 47 / 157 ✓ |
| Snapshot date | Mar 8, 2026 | 2026-03-08T18:41:03Z | (velocity weeks end Mar 2) | — |

The issue counts verify exactly; the dependency figure drifts by 4 edges between documents of the *same* snapshot (claim 4) [Verified, High]. The honest disavowal, stated in the CHANGELOG rather than hidden: `data/history.json` "remains absent (removed in second deployment)" — a time-travel feature silently dropped, documented [Maintainer claim, High].

**The generator's documented interface (from bv's public README, read 2026-09-22) [External, High]:** `bv --pages` launches an interactive wizard (export → preview at localhost:9000 → deploy to Pages with automatic repo creation); `bv --export-pages ./dir` exports directly with flags `--pages-title`, `--pages-include-closed` (default true), `--pages-include-history` (default true), `--watch-export` (re-export whenever the beads file changes), `--preview-pages`, and recipe filters. Notably, **watch-mode regeneration already exists in the tool** — the missing piece is only someone (or something) running it on a schedule.

**Reproduction cost:** of the *site*: `git clone` (GitHub reports repo size 13,061 KB ≈ 12.8 MB) + any static server; no toolchain [Verified, High]. Of the *data*: re-running `bv --pages`/`--export-pages` against frankentui's current beads DB — requires the `bv` binary and the source repo, neither of which ships here; the documented flags above are the complete public interface [External, High on the interface; Inference, Medium on sufficiency]. One interface detail with leverage: `--export-pages` applies recipe filters before export, so sibling repos adopting the pattern could ship *filtered* dashboards (open-issues-only, single-label) from the same pipeline — the pattern-export thesis (next step 5) is stronger than one-dashboard-per-repo.

## 4.6 Competitors

The lane is "issue-tracker dashboards / project visibility for code forges" — and the incumbent is not another dashboard, it is the forge itself.

- **GitHub Projects / Insights (the incumbent):** every repo in this program already lives on GitHub; Projects gives kanban, Insights gives burndown/pulse, and GitHub's own dependency graph tracks blockers — all live, all zero-maintenance, all current: the three properties this dashboard lacks (stale data, manual regeneration, separate URL). The incumbent wins on freshness and zero effort [Inference, High]. What GitHub *doesn't* give: PageRank impact scoring over a custom issue tracker, computed bottleneck/quick-win analysis, or an offline-capable static export [Inference, Medium].
- **The parent tool, `bv` itself (1,691 stars):** the sharpest competitive frame is internal — the dashboard competes with its own generator for maintenance energy. `bv`'s graph-aware TUI is the maintainer's daily driver; the static export is the shareable artifact. Three deployments in five weeks, then the generator kept shipping (1,691 stars and counting) while the export fossilized — the byproduct starved while the product ate. Any revival plan must reckon with this energy gradient [Inference, Medium].
- **Static site generators for project docs (MkDocs, Docusaurus):** own "publish project knowledge as a static site," but none renders a live-queryable SQLite issue graph in the browser — the sql.js + chunked-DB + WASM PageRank stack is genuinely unusual [Inference, Medium].
- **Unoccupied lane:** a *freshness-guaranteed*, auto-regenerating static dashboard for SQLite-backed issue trackers — exactly what this repo becomes with a scheduled `--watch-export`/cron regeneration plus a data-SLA badge (next step 1). Nobody occupies "stale-proof static project dashboards" because the freshness loop is the hard part, and this repo is the documented failure mode [Inference, Medium].

**Why the incumbent wins today, in one paragraph:** GitHub renders every frankentui issue live, with search, milestones, project boards, and its own dependency graph, at zero marginal cost and zero staleness — while this dashboard shows March data in September behind a separate URL. A visitor who wants frankentui's *current* blockers learns more from the forge than from the dashboard. The dashboard's only uncontested edge is its computed graph analysis (PageRank impact, bottleneck detection, offline queryability), which the forge doesn't do — but computed analysis of stale data is a diorama, not a triage tool [Inference, Medium].

## 4.7 Skeptic's take

Weaknesses (each substantive — capable of killing the repo's purpose on its own):

1. **[FATAL] The data is a fossil.** Snapshot `generated_at` 2026-03-08; pin 2026-09-21 — 197 days. Every "top priority," "critical bottleneck," and "quick win" on the live site describes a frankentui that existed before the opentui-import workstream it highlights had finished landing. A triage dashboard that cannot triage the present is decorative [Code-verified, High].
2. **[HIGH] Unlicensed.** No LICENSE file; GitHub API `license: null`. With no license grant, no party holds reuse rights — the most plausible reuse (forking the dashboard as a template for another beads tracker) is legally void. For a repo whose *pattern* is its value, this is a self-inflicted adoption ceiling of zero, fixable in five minutes [Code-verified + External, High].
3. **[HIGH] CI tests nothing.** The single workflow deploys (35 success / 22 cancelled / 0 failed across 57 runs — the cancellations unexplained by the workflow file); the single test file is a browser-embedded IIFE no automation executes. The analyst ran it by hand under a `window`-shim and it passed — proving the test is CI-runnable for ~20 lines of YAML that don't exist [CI-observed + Code-verified, High].
4. **[MEDIUM] Dead WASM import.** `wasm_loader.js` → `./wasm/bv_hybrid_scorer.js`; no `wasm/` directory. Graceful fallback exists, and the 5,000-issue threshold means the import is never attempted at this snapshot — but the next regeneration against a larger DB would hit a failed fetch at runtime, silently degrading search ranking to the JS path behind a console warning [Code-verified, High].
5. **[MEDIUM] Generated-code governance.** The tree is `bv` output; human commits are formatting and docs. There is no source of truth *in this repo* for the application code — a fix to `viewer.js` here would be overwritten by the next `bv --pages` run. The repo is write-only by design, which makes every checked-in line (including the dead import) unfixable here [Inference, High].
6. **[MEDIUM] Bus factor 1, no releases.** 8 commits, one verified author (Jeff Emanuel = Dicklesworthstone), 0 GitHub Releases, no changelog entries for the Apr/Sep maintenance commits. If the maintainer stops regenerating, the fossil just gets older — there is no community mechanism to refresh it [Git-observed + External, High].
7. **[MEDIUM] The drift ledger keeps growing.** README says 3,696 dependencies (DB: 3,700); CHANGELOG's file table describes the February tree; the CHANGELOG omits the last three maintenance commits. Each is small; together they say the docs are maintained by hand around a generated core, and the hand is slower than the generator [Counted, High].

**Strengths (all generator-inherited properties of the artifact — tagged as such):**

1. **Genuinely offline-capable architecture** *(bv's design, verified in this deployment).* Zero external URLs, vendored fonts/WASM/JS, OPFS caching, COI service worker — the self-containment claim survives inspection end to end [Code-verified, High].
2. **Integrity-conscious data shipping** *(bv's design, analyst-verified here).* 11/11 chunk SHA-256 hashes match; reassembled bytes identical to the database; the manifest's whole-db hash matches. Most static sites fetch a CSV; this one checksums its backend [Verified, High].
3. **Documentation honesty as a feature** *(the maintainer's own writing, in this repo).* The CHANGELOG admits orphan commits, removed features (`history.json`), metric regressions (99% → 92% completion), and the absence of releases — in writing, dated. This packet's staleness finding is only possible because the maintainer dated everything [Maintainer claim, High].
4. **Real graph analytics in the browser** *(bv's design, wired in this deployment).* A Rust-compiled PageRank/centrality WASM module actually imported and instantiated — not a mock — with graceful fallback when WASM is unavailable [Code-verified, High].
5. **A deployment record with no failures to hide** *(this repo's own CI — distinct from weakness 3: that one is about what CI *checks*, this one about deploy reliability).* 35 successes, 22 cancellations, 0 failures across 57 runs; the pin's run green. Cancellations unexplained, but nothing ever went red [CI-observed, High].

**Bear-case steelman (strongest counter-case):** this repository is not software; it is a build artifact that escaped into a repo with a marketing README. Nobody can fix it here (regeneration overwrites), nobody may reuse it (no license), its data describes a March frankentui, its one test runs nowhere, and its "live dashboard" is a diorama. The 12 stars are for the *idea* of the dashboard; the 1,691 stars on beads_viewer are where the actual demand went. The rational response is to treat this repo as a cache to be invalidated — regenerate or archive — and to evaluate `bv`, not this deployment. Its most likely end state is quiet abandonment at increasing staleness, with the URL lingering as a misleading snapshot of frankentui's past [Inference, Medium].

## 4.8 License and governance (material, not boilerplate)

**License: none.** No LICENSE file in the tree at the pin, no license headers in the inspected sources, no license mention in README or CHANGELOG, GitHub API `"license": null` [Code-verified + External, High]. With no license grant, no party holds reuse rights — the inverse of the FrankenSuite's usual MIT+AI-lab-rider posture, and worse for adoption than the rider: the rider at least grants *some* parties rights, while here *no* party has any. (The brief asked for the rider's exact scope: the rider does not appear in this repo because there is no license text at all — the exclusion here is total and accidental, not targeted and strategic.) Cost to fix: one file, five minutes (next step 4) [Inference, High].

**Governance:** bus factor 1 — all 8 commits by Jeff Emanuel, verified as GitHub user `Dicklesworthstone` via the user API [Git-observed + External, High]. No CONTRIBUTING, no code of conduct, GitHub `open_issues_count: 0` [External, High]. Commit velocity is not meaningful for a generated repo: 3 deployments in 5 weeks (Feb–Mar), then docs/gitignore/merge/formatting only. The generated-code governance problem (§4.7.5) means contributions *to the application* cannot land here by design — they belong in beads_viewer. What breaks first if velocity decays: nothing breaks; the fossil ages silently. The failure mode is staleness without alarm, not outage [Inference, High].

## 4.9 NODUS factsheet

Scales: TRL 1–9; others 1–5 (5 = highest). Each justified in one line. Note on the apparent tension: **TRL rates the deployed technology** (proven in operation); **the ring rates the artifact's current fitness** (a stale website). Both can be true at once.

| Criterion | Score | Justification |
|---|---|---|
| Technology readiness | **TRL 8** | The dashboard system is complete and proven in operation: live at the Pages URL (HTTP 200), 57 deploy runs with 0 failures including the pin's [CI-observed + External, High] |
| Strategic relevance | **2** | Relevant to the FrankenSuite only as a pattern (static evidence dashboards); the repo itself advances no suite capability [Inference, Medium] |
| Impact potential | **2** | Bounded to frankentui project visibility; 197-day-stale data caps real-world impact near zero until regeneration resumes [Inference, Medium] |
| Implementation feasibility | **5** | Already implemented and deployed; reproducing it costs a static file server [Verified, High] |
| Time to mainstream | **3** | Static dashboards are mainstream (the class is proven); this instance's freshness loop is one scheduled regeneration away from being one [Inference, Medium] |
| Collaboration potential | **2** | Bus factor 1, no license, generated code unfixable here; contributions belong upstream in beads_viewer [Inference, High] |

**Ring: Monitor** [Inference, Medium]. Rulebook ring rules: *Invest* requires independent validation plus governance (absent); *Pilot* requires a release artifact plus a bounded real workload fit (0 releases; the workload fit is real but the data is stale); *Explore* is the default for substantive-but-unproven — but the rules explicitly list *websites* under Monitor, and when in doubt, ring down. This is a website serving a 197-day-old snapshot with no development activity beyond formatting: Monitor, with revisit triggers below.

## 4.10 Wardley placement

- **Vendored JS/WASM/font stack (sql.js, d3, force-graph, Chart.js, Tailwind, 3.2 MB Mermaid)** — *commodity*: interchangeable, replaceable, zero custom code; Mermaid's 3.2 MB is the visible price of the offline dividend — 6.2 MB vendored buys zero CDN or runtime-external risk [Inference, High].
- **bv-generated SPA shell (viewer/graph/charts/scorer, 16,196 lines)** — *custom-built, product stage*: works, deployed, but unfixable in this repo and drifting from its generator; moves toward commodity if `bv`'s output stabilizes into a documented schema [Inference, Medium].
- **Frankentui beads snapshot (2,590 issues, March 2026)** — *custom-built, decaying*: the data component rots with time; it moves back to current only via regeneration [Inference, High].
- **Orphan-deploy + SHA-256-chunk + COI-serviceworker pipeline** — *custom-built trending toward product*: the genuinely novel component; it moves toward commodity if adopted as the suite's standard dashboard template (next step 5) [Inference, Medium].
- **Governance/licensing** — *genesis*: absent; a LICENSE file would move it straight to commodity-clear [Inference, High].

## 4.11 Trajectory (12 / 24 / 60 months)

**[Inference — all of this section.]** Base case: the URL keeps serving March 2026 data; staleness compounds; the repo accumulates formatting commits and eventually goes quiet — a stable, harmless fossil, occasionally misleading a visitor about frankentui's priorities. The bifurcation: **upside** — the maintainer (or an agent) wires `bv --pages`/`--watch-export` to a scheduled workflow, the freshness manifest lands, and this becomes the template every franken repo copies for its own beads/evidence dashboard (the methodology-export win); **decay** — frankentui's tracker outgrows the snapshot by an order of magnitude, the dashboard becomes actively misleading (recommending long-closed "top priorities"), and the honest move becomes archiving the repo with a dated banner pointing at a regenerated successor. Revisit triggers: (1) `data/meta.json` `generated_at` moves past 2026-03-08 (freshness loop closed — re-ring to Explore); (2) a LICENSE file appears (adoption ceiling lifts); (3) a sibling franken repo ships its own bv dashboard (pattern export confirmed); (4) the repo is archived or the Pages site goes dark (terminal — close the packet); (5) `bv` upstream changes the export schema silently obsoleting the checked-in tree (re-verify the fidelity table).

## 4.12 Limitations and open questions (mandatory)

**Not done:** the dashboard was never run in a live browser (no browser control in this environment) — chunk reassembly, FTS5 search, WASM PageRank execution, and the offline path are code-verified, not executed; the 302 KB `index.html` payload was fetched via HTTP (200) but not rendered; the hybrid scorer test was executed under a Node `window`-shim, not in a real DOM; frankentui's current bead count was not pulled for a direct staleness delta (its HEAD pushed after the pin regardless); no performance measurement of any kind (not applicable — no benchmarks exist to audit). **Open questions that would most change the verdict:** (1) Is there a private `bv --pages` cadence planned, or is the March snapshot the last? — a yes flips the freshness finding; (2) does the maintainer intend this repo as a reusable template (then the missing license is the #1 bug) or a personal snapshot (then archiving with a dated banner is the honest end state)?; (3) does `bv` upstream already emit the missing `wasm/bv_hybrid_scorer.js`, making claim 9 a regeneration artifact rather than a generator bug?

---

## The eight deepening questions

1. **Provenance.** Each deployment commit records its generator (`bv --pages`), timestamp, and (in the pin commit) a Grok co-authorship trailer — but the *data* provenance stops at `generated_at` in `meta.json`: there is no recorded frankentui commit hash the snapshot was taken against, so the dashboard's numbers cannot be tied to a source revision. Portable attestation would require the snapshot manifest to pin the source repo's HEAD hash alongside the timestamp — the same SHA-256 discipline the chunk manifest already demonstrates, pointed at provenance [Code-verified, High on the gap; the fix is Inference, Medium].
2. **The embeddable unit.** The smallest adoptable piece is `hybrid_scorer.js` plus its test (104 + 47 lines, zero dependencies beyond `window`): drop-in graph-aware search ranking for any issue list. Adoption cost: copy two files and the 20-line Node `window`-shim the analyst used to run the test — or a single script tag. Everything else (viewer, graph, chunks) is coupled to the beads schema and the bv pipeline [Code-verified, High].
3. **Unexercised option value.** The architecture holds three unused capabilities: OPFS caching already implemented for offline re-query; the WASM loader scaffolding ready for a scorer module that was never vendored; and the `triage.json`/`project_health.json` pre-compute pipeline that could feed any consumer, not just this page. What unlocks them: a regeneration (fresh data exercises OPFS meaningfully), vendoring the missing WASM artifact, and documenting the JSON schemas as a stable API [Code-verified, High on existence; Inference, Medium on the unlock].
4. **Benchmark honesty.** There are no benchmarks to audit — the load-bearing numbers are the *data-fidelity* figures (2,590 / 3,700 / 92%), which the analyst re-derived from the SQLite file and confirmed within a 4-edge drift (see the §4.5 table). The numbers that would not survive an independent rerun are the README's *triage* claims ("top priority," "47 ready to work") — true of March, unverifiable and almost surely false of September [Verified, High on the counts; Inference, High on the triage staleness].
5. **The governance path.** There is no credible route from one maintainer to an institution *for this repo*, because the repo is a generated artifact: governance belongs in beads_viewer upstream. What breaks first if velocity decays is not the code (static files don't rot) but the data's truthfulness — silent, monotonic staleness with no alarm [Inference, High].
6. **The license as strategy.** There is no license and therefore no strategy — only the absence of any grant. If the mission is "shareable project visibility," the missing license sabotages it completely: the most likely reuser (another beads user forking the dashboard as a template) holds no rights. If the mission is "personal snapshot," the missing license is harmless but the public repo plus README marketing still invites misreading [Inference, High].
7. **Agent-era fit.** The concrete agent workload that would pick this over the incumbent (GitHub Projects): an agent doing dependency-aware triage over a beads-tracked repo offline or in bulk — PageRank impact scores and blocker analysis computed, not clicked-through. What has to become true first: fresh data (an agent triaging on March priorities in September is worse than no dashboard) and a machine-readable contract for `triage.json` (it already ships `commands` — claim_top, show_top, list_ready, list_blocked, refresh_triage — the seed of an agent API) [Code-verified, Medium on the commands; Inference, Medium on the fit].
8. **The kill test.** Regenerate the snapshot from frankentui's current beads DB and diff the README's "Top Priorities / Critical Bottlenecks" against the March version: if the priority list is substantially identical, the dashboard's computed triage adds little over sorting by priority and the core thesis (graph-aware triage beats manual) is weakened; if it differs wildly, the thesis survives but the staleness indictment hardens — either outcome is informative, and the experiment costs one `bv --pages` run [Inference, High].
