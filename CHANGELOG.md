# Changelog

Corrections to published findings are recorded here with the date, the issue, and what changed. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Unreleased

### Added

- **Daily watch** (`watch/`, `.github/workflows/watch.yml`): a scheduled job at 11:23 UTC reads the GitHub API for the 44 assessed repositories (pins parsed from `packets/`) and every public repository their maintainer owns. It writes `watch/state.json`, a dated census (`watch/census/`), and the changes new since the previous run (`watch/changes/`), and commits them only when the full gate chain passes. Material events (a release or tag, a license SPDX or LICENSE-text change, a workflow file added or removed, archived, renamed, deleted, a pin no longer an ancestor of HEAD, a new `franken*` or Rust repository) open one deduplicated GitHub issue each, capped at 20 per run, with the pinned matrix cells they may affect and the re-check checklist. Commit volume is informational only. The watch never edits pins, packets, or counts; the loop from issue to dated, independently reviewed re-check is in `updates/METHOD.md`. The first local run on 2026-09-24 is the baseline: 44 repositories checked, 215 public repositories discovered, 11 material events since the pins in 8 repositories, none since a previous state because there was none. Issue creation has not run yet.
- **Gate W**: `node watch/watch.mjs --selftest` replays recorded GitHub API responses (`watch/fixtures/`) through the watch's own collect, diff, and dedupe code, offline, and fails if any of its 13 cases fails or none run. Shown to trip on a planted wrong expectation in a scratch copy.

## v1.1.0 (2026-09-23)

Extends the assessment from the 44 FrankenSuite repositories to the wider agent stack, and turns every assessed project into a source of practices this repository also applies to itself.

### Added

- **Agent-stack verdicts** (`stack/`): one Adopt / Adopt and wrap / Build clean-room / Watch verdict for each of 21 kinds of agent infrastructure, from evidence packs covering 192 repositories. Result: 20 Adopt and wrap, 1 Watch, 0 Build clean-room; 13 Medium and 8 Low confidence. Every factual bullet carries an evidence tier and a quoted citation that must appear on the cited line (`stack/METHOD.md`, commits `9cd29ec`, `16deb8c`).
- **Independent review of every verdict** before release, with the author never reviewing their own work. Authors and reviewers were separate AI agent sessions coordinated by a human maintainer; no outside party has reviewed the layer yet. Reviewers refused to sign until findings were fixed: 12 then 4 on the orchestration group, 36 then 4 on tools, 36 then 9 on serving. The records are in `stack/reviews/`.
- **License census** (`stack/licenses.tsv`): all 101 recommended projects checked; 13 non-permissive (AGPL-3.0, SSPL, Elastic License 2.0, open-core enterprise directories, field-of-use conditions) and named in the verdicts that recommend them. One archived project (llm-guard) was removed from the adopt list (`9c92cf9`, `ce4186e`).
- **Rigor practices index** (`stack/rigor-practices.tsv`): 135 practices, each quoted from the project that evidences it and mapped onto the starter kit; this repository adopts 15, partly does 21, and has 22 more as candidates.
- **Pages** generated from those files: `/stack/`, 21 `/stack/<area>` pages with license chips and quoted citations, `/rigor/`, plus `/beyond/` (vendor-port and outside-validation lessons) and `/updates/` (`68d9523`, `b9003f4`, `add8d6a`, `d24c92d`).
- **Since-the-pin census and re-check** (`updates/`): 32 of 44 repositories moved after their pins; `franken_code_browser` shipped v0.1.0 as a notarized developer preview, re-checked cell by cell with signature and notarization verified (the app is signed and notarized; the DMG container is not signed). Pins and suite counts are not edited.
- **Gates K and L**: K1 to K5 enforce the verdict format and review signatures, quoted citations, rigor-index proofs, generated pages matching their sources, and the license rule; L fails on any personal email address in a tracked file. Each was proven to trip on planted known-bad copies.

### Changed

- CI adopts four practices from the index: a timeout sized from measured runs, cancelling superseded pull-request runs, actions pinned by commit SHA, and a weekly scheduled run so the gates execute without pushes (`0f14145`).

### Corrected before release

- The method was stress-tested before use; all 8 findings were adopted (quoted citations instead of line existence, a fixed verdict order, a stated failed constraint for any rebuild, Rulebook-correct tiers).
- We first claimed 36 of the index's practices as adopted. An independent audit confirmed 12 and found 24 partial and 2 mislabeled; the index now has a `partial` status and claims 15 adopted.
- Verdicts had recommended projects without checking their licenses; the license rule and census above are the fix.
- Independent QA of the new pages found that citation links pointed at `main` rather than the release, so a later commit could move a cited line; every generated GitHub link now points at the `v1.1.0` tag. It also found the page never stated the 20 / 1 / 0 / 0 verdict split and an empty filter was unexplained; both are fixed, and reviewer lines now say reviewers were separate AI agent sessions.
- One CI run failed when Chrome took more than 15 seconds to start; the render gate now waits 45 seconds and relaunches once. The assertions did not change.
- Three recommended "practices to copy" did not do what their file names suggested (a benchmark with no quality output, a retrieval check that never starts the retriever, a conformance test that only checks dispatch). A reviewer re-fetched the files and the verdicts were corrected.
- Commit-author email addresses were still present in history: in the first import commit (published with v1.0.0, then redacted in a later commit rather than before publication) and in the movement census. The whole history was rewritten and force-pushed on 2026-09-23 so no published commit contains them, the v1.0.0 tag was moved to its rewritten commit, and commit hashes cited in this repository were updated ([old-to-new map](stack/reviews/history-rewrite-2026-09-23.tsv)). Gate L now fails the build on any personal address.

## v1.0.0 (2026-09-23)

First public repository, tagged `v1.0.0`.

### Derived from franken-assessments-44 v11

The corpus was imported as shipped (commit `1ef0f8e`) from the v11 package built 2026-09-23 (see [v11-manifest.md](v11-manifest.md)):

- 44 assessment packets, one per repository, each pinned to a commit and assessed on 2026-09-22 under [RULEBOOK.md](RULEBOOK.md) v1.1.
- The suite synthesis (`synthesis/`): aggregate counts and master matrix, CI requirements, negative patterns, cross-pollination, uniqueness, external validation, vendor-port learnings, 44 per-repository cross-suite briefs, and one brief on the maintainer's public writing.
- The starter kit (`starter-kit/`) and the ecosystem design notes (`ecosystem/`).
- New in v11 relative to v10: the project-pickup planning system (`ecosystem/pickup/`): a planning playbook, a registry of 18 shared gates, 21 per-type companions, and evidence packs covering 192 repositories. Its review record reports six rounds, 233 defect records (231 fixed, 1 won't-fix, 1 deferred), and zero open P0/P1 at packaging. Those figures are the manifest's own claims, not re-verified here.
- v11 did not include the gated starter-kit expansion (G1 to G14), because its completion marker was absent at packaging time.

### Changed in this repository

- The site identifies this program as Franken Research, the assessor, distinct from the FrankenSuite, the assessed suite; section pages cite their sources (`d6a367f`).
- The gate chain runs in-repo against the root `packets/` and `RULEBOOK.md` (no external canon path needed), finds Chrome through `CHROME_PATH` or the usual install locations, and fails rather than skips when no browser is found (`9a99982`).
- Maintainer commit email addresses quoted from public git metadata were redacted from the packets, their site copies, and one synthesis brief; local home-directory paths were removed from two non-evidence notes. No other evidence text changed (`10ec830`).
- Added a self-assessment page, "Graded by our own method" (`site/self/`), scoring this repository on the master matrix columns, with a list of what we got wrong or cannot prove (`a298c99`).
- Gate chain strengthened: the statistics and link gates now report their real counts (they printed blank counts on macOS because of a GNU-only `grep` flag) and fail on an empty scan set; the self-assessment page joins every structural gate and the headless render gate.
- Added CI (`.github/workflows/verify.yml`): the gate chain, a check that the committed map bundle equals what its source builds, and a gitleaks scan of the tree and history. Four known false positives (a quoted 40-hex commit SHA matching a token rule) are allowlisted by exact fingerprint in `.gitleaksignore`.
- Added README, MIT LICENSE (no rider), CONTRIBUTING, and this changelog.
- The front door explains itself to a first-time visitor: a plain-language hero, three finding cards, a one-line ring key, a note on the wireframe cages and domes, and three actions (explore the map, take the starter kit, jump to a random project). On phones the map takes the middle of the screen and the filters move into a bottom sheet. `#repo=<name>` links open a project's panel, and the panel copies a link to its brief. The map bundle is rebuilt from source with a pinned esbuild (`bun run build:map`), and CI checks it byte for byte (`69d1954`).
- Briefs and section pages name Franken Research as the author, not the FrankenSuite program. Every brief has working share cards (absolute `og:image`, one 1200x630 card per project generated from `data.js` by `site/scripts/make-og.mjs`) and a Share button. The section pages' source notes were rewritten for readers. Added a 404 page, an absolute-URL sitemap, and robots.txt (`53323f8`).
- Fixed reader-visible defects that two independent audits of the briefs found: four dead or misdirected external links (two unbalanced Wikipedia URLs, a login-walled libraries.io page replaced with docs.rs, and a removed GitHub repository now cited without a link), a stray Markdown marker, a missing quotation mark, and a duplicated sentence (`53323f8`).
- Independent QA of the preview (desktop, then phone, keyboard, and reduced motion), by reviewers who did not build the site, found 0 critical, 3 high, 3 medium, and 3 low issues. All were fixed: the front door no longer implies all 42 builds without a passing pin are red (11 are); a phone filter now visibly applies after the sheet closes, and the sheet closes on Escape and traps focus as a dialog; the repo panel no longer covers the search box; Copy link and Share show a visible result on every path, including a selectable URL when the clipboard is blocked; phone buttons are 46px tall; the starter kit drops internal release names; brief back links say where they go (`9f1dcfb`, `f49aaa9`).
- The self-assessment page records the first CI run (green on every step at `527c227`), the v1.0.0 release, and the same honest CI split as the front door.

### Corrections

None yet.
