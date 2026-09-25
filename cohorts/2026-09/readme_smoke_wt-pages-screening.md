# Screening: Dicklesworthstone/readme_smoke_wt-pages

**Result: fails screening. No packet written.**

| Field | Value |
|---|---|
| Repository | https://github.com/Dicklesworthstone/readme_smoke_wt-pages |
| Pinned commit | `b45e54bafdcd7db48ad081ab14d25cb4dfc75743` |
| Commit date | 2026-09-03T04:32:23Z (2026-09-03 00:32:23 -04:00) |
| Created | 2026-09-03T04:32:20Z; last push 2026-09-03T04:32:25Z |
| GitHub description | "Issue tracker dashboard" |
| GitHub language | HTML (languages API: HTML 302,931 bytes, JavaScript 271,755, CSS 53,274; no Rust) |
| Stars / forks / open issues | 0 / 0 / 0 |
| License | none: no LICENSE file in the tree, and the GitHub API reports `license: null` |
| Screening date | 2026-09-24 |
| Rule applied | [`candidates/README.md`](../../candidates/README.md), "Screening rule", predicates 1 to 7 |

**Method.** Read the repository metadata, commit list, tree, language breakdown and Actions runs from the GitHub API. Cloned the default branch read-only into scratch storage, read `README.md`, `data/meta.json`, `data/project_health.json`, `beads.sqlite3.config.json`, `.github/workflows/static.yml` and `vendor/MANIFEST.json`, and queried `beads.sqlite3` read-only with `sqlite3 -readonly`. Fetched the live Pages URL. Read the `bv --pages` wizard source (`pkg/export/wizard.go`) and the README in `Dicklesworthstone/beads_viewer` at that repository's HEAD `61bbc9a4f1d3ea81c11f8f156511237002cc652b` (2026-09-24T22:09:41Z). That is three weeks after this repository was created; the beads_viewer version that produced this commit was not read. Searched GitHub code for `readme_smoke` and `readme_smoke_wt`, searched the franken-research candidate issues and `watch/discovery/`. Nothing was built or run beyond the SQLite queries. The clone was deleted after the hashes above were recorded.

Tier labels follow RULEBOOK section 1. `[Verified]` here means read directly from the clone, the GitHub API, or the live page.

## Predicates

| # | Predicate | Result | Evidence |
|---|---|---|---|
| 1 | Public | Pass | `private: false`; cloned over HTTPS with no credentials. The Pages site at https://dicklesworthstone.github.io/readme_smoke_wt-pages/ returned HTTP 200 on 2026-09-24. **[Verified, High]** |
| 2 | Rust (primary language, or a Rust port or tool) | **Fail** | GitHub reports HTML; the languages API lists no Rust. The tree holds no Rust source and no `Cargo.toml`. The only Rust-derived file is a vendored build artifact, `vendor/bv_graph_bg.wasm` with its wasm-bindgen glue `vendor/bv_graph.js`, which `vendor/MANIFEST.json` attributes to "bv-graph-wasm (this repository)", meaning beads_viewer, and says is "not yet reproducibly tied to source". A compiled dependency copied into a static site does not make the site a Rust project. **[Verified, High]** |
| 3 | Active (last push within 30 days) | Pass, literally | Last push 2026-09-03T04:32:25Z, 21 days before the check. That push is also the only push: one commit, created three seconds after the repository. Nothing has changed since. **[Verified, High]** |
| 4 | Agent-built signal | **Fail** | No `AGENTS.md` or `CLAUDE.md` at the root. The single commit ("Deploy static site via bv --pages", author Dicklesworthstone) has no trailers at all. The README says nothing about coding agents; its only authorship line is "Generated ... by [bv]". The issue data inside `beads.sqlite3` does mention AGENTS.md (for example `bv-fx5t.1`), but that is beads_viewer's issue text, not a statement about this repository. **[Verified, High]** |
| 5 | Not a fork | Pass | `fork: false`. **[Verified, High]** |
| 6 | Not already covered | Pass | Not among the 44 in `packets/` (the only beads-related packets are `beads-for-frankentui` and `beads_for_franken_engine`). `cohorts/` did not exist before this file. No `candidate` issue in JYeswak/franken-research names it, and `watch/discovery/` holds no week file that lists it. The daily watch does list it in `watch/state.json` as an HTML repository, which is the watch's normal coverage, not a prior assessment. **[Verified, High]** |
| 7 | Not Dicklesworthstone's | Fail, set aside for this cohort | The owner is Dicklesworthstone. The 2026-09 cohort was approved specifically to cover repositories Dicklesworthstone created after the 44, so this predicate is set aside for the whole cohort and is not the reason for this result. **[Verified, High]** |

The result rests on predicates 2 and 4. Either one alone fails the repository.

## What the repository is

It is the output of one `bv --pages` run, not a project.

- **One commit, no history.** `git rev-list --count HEAD` is 1. The commit message is "Deploy static site via bv --pages". Two Actions runs exist, both on that commit and both successful: "pages build and deployment" and "Deploy static content to Pages". **[Verified, High]**
- **Name and description come from the bv wizard's defaults.** In beads_viewer `pkg/export/wizard.go` (read at `61bbc9a`), the wizard sets `suggestedName := base + "-pages"`, where `base` is `filepath.Base` of the current working directory, and sets `description := "Issue tracker dashboard"`. Both match this repository exactly. So the wizard was run from a directory named `readme_smoke_wt` and the defaults were accepted. **[Verified, High]** for the code at `61bbc9a`; **[Inference, Medium]** that the September 3 version behaved the same way. An earlier repository from the same wizard, `Dicklesworthstone/beads_viewer-pages` (created 2025-12-17, same description), fits the pattern. **[Verified, High]**
- **The data is beads_viewer's own issue tracker.** All 613 issues in `beads.sqlite3` carry the `bv-` prefix. They were created between 2025-11-26T23:35:42Z and 2026-09-03T01:21:05Z, the latest update is 2026-09-03T02:42:32Z, and `export_meta.generated_at` is 2026-09-03T04:32:19Z. `data/project_health.json` reports 608 closed, 3 open, 2 in progress, and 746 dependencies. **[Verified, High]**
- **The files are the standard bv static viewer.** `index.html`, `viewer.js`, `graph.js`, `charts.js`, `styles.css`, the `data/*.json` exports, the SQLite file, a GitHub Pages workflow with SHA-pinned actions, and 18 vendored assets (Alpine, D3, Mermaid, sql.js, Tailwind, fonts, and the bv graph WASM) listed with sha256 hashes in `vendor/MANIFEST.json`. **[Verified, High]**
- **Probable purpose.** The name reads as "README smoke test, worktree". The day before, beads_viewer closed `bv-fx5t.2` ("Doc parity tests: ... executable README examples", closed 2026-09-02T14:22:51Z) and `bv-fx5t.3` ("README and AGENTS.md prose truth pass", closed 2026-09-02T07:34:35Z). beads_viewer's README documents `bv --pages` (line 2794 at `61bbc9a`) and says it "Pushes the bundle to `main` with a `.github/workflows/static.yml` Pages workflow", which is what this repository contains. The most likely story is that someone exercised the README's `bv --pages` example from a scratch worktree named `readme_smoke_wt` and the wizard published the result for real. **[Inference, Medium]** No commit, issue or document found says so directly.
- **Nothing references it.** A GitHub code search for `readme_smoke_wt` found no hits, and a search for `readme_smoke` within the Dicklesworthstone account found none either. The global `readme_smoke` hits are unrelated projects' files. Code search indexes default branches only and misses some files, so this is not proof of absence. **[External, Medium]**
- **Licensing gap.** `vendor/MANIFEST.json` marks the bv graph files "MIT (repository license)", but this repository has no license file, so that line points at beads_viewer's license, which is not present here. The file does not carry the MIT + OpenAI/Anthropic rider either, because it has no license text at all. **[Verified, High]**

## Where the substance lives

Everything assessable here (the viewer code, the graph WASM, the issue data) belongs to `Dicklesworthstone/beads_viewer`, a Go repository that is not among the 44. If the program wants that work covered, the packet should be on beads_viewer (or `beads_viewer_rust`, which the daily watch lists as Rust), not on this generated snapshot. **[Inference, High]**

## Revisit triggers

Reconsider only if the repository gains commits that are not generated `bv --pages` output, gains Rust source, or is referenced by another project as a dependency or a documented example.

## Not done

- Did not open the dashboard in a browser or exercise its search, graph or time-travel views; only the HTTP status of the Pages URL was checked.
- Did not rebuild `bv_graph_bg.wasm` or check it against beads_viewer source. Its sha256, computed from the clone, is `fb2c84eeab8711efbf282b1c0db33c968cf829c14ceccca1ead9ad765e2e0449` and matches the manifest entry; that is all the hash shows.
- Did not read the beads_viewer version that generated the commit on 2026-09-03; the wizard and README were read at `61bbc9a` (2026-09-24).
- Did not search outside GitHub for references to the repository or its Pages URL.
