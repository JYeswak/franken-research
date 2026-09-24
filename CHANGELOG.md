# Changelog

Corrections to published findings are recorded here with the date, the issue, and what changed. See [CONTRIBUTING.md](CONTRIBUTING.md).

## v1.0.0 (unreleased)

First public repository. The v1.0.0 tag is planned at publication; until it exists, this section describes `main`.

### Derived from franken-assessments-44 v11

The corpus was imported as shipped (commit `114d5f0`) from the v11 package built 2026-09-23 (see [v11-manifest.md](v11-manifest.md)):

- 44 assessment packets, one per repository, each pinned to a commit and assessed on 2026-09-22 under [RULEBOOK.md](RULEBOOK.md) v1.1.
- The suite synthesis (`synthesis/`): aggregate counts and master matrix, CI requirements, negative patterns, cross-pollination, uniqueness, external validation, vendor-port learnings, 44 per-repository cross-suite briefs, and one brief on the maintainer's public writing.
- The starter kit (`starter-kit/`) and the ecosystem design notes (`ecosystem/`).
- New in v11 relative to v10: the project-pickup planning system (`ecosystem/pickup/`): a planning playbook, a registry of 18 shared gates, 21 per-type companions, and evidence packs covering 192 repositories. Its review record reports six rounds, 233 defect records (231 fixed, 1 won't-fix, 1 deferred), and zero open P0/P1 at packaging. Those figures are the manifest's own claims, not re-verified here.
- v11 did not include the gated starter-kit expansion (G1 to G14), because its completion marker was absent at packaging time.

### Changed in this repository

- The site identifies this program as Franken Research, the assessor, distinct from the FrankenSuite, the assessed suite; section pages cite their sources (`6236855`).
- The gate chain runs in-repo against the root `packets/` and `RULEBOOK.md` (no external canon path needed), finds Chrome through `CHROME_PATH` or the usual install locations, and fails rather than skips when no browser is found (`07b681b`).
- Maintainer commit email addresses quoted from public git metadata were redacted from the packets, their site copies, and one synthesis brief; local home-directory paths were removed from two non-evidence notes. No other evidence text changed (`bbc1bda`).
- Added a self-assessment page, "Graded by our own method" (`site/self/`), scoring this repository on the master matrix columns, with a list of what we got wrong or cannot prove (`4f4f0e3`).
- Gate chain strengthened: the statistics and link gates now report their real counts (they printed blank counts on macOS because of a GNU-only `grep` flag) and fail on an empty scan set; the self-assessment page joins every structural gate and the headless render gate.
- Added CI (`.github/workflows/verify.yml`): the gate chain, a check that the committed map bundle equals what its source builds, and a gitleaks scan of the tree and history. Four known false positives (a quoted 40-hex commit SHA matching a token rule) are allowlisted by exact fingerprint in `.gitleaksignore`.
- Added README, MIT LICENSE (no rider), CONTRIBUTING, and this changelog.
- The front door explains itself to a first-time visitor: a plain-language hero, three finding cards, a one-line ring key, a note on the wireframe cages and domes, and three actions (explore the map, take the starter kit, jump to a random project). On phones the map takes the middle of the screen and the filters move into a bottom sheet. `#repo=<name>` links open a project's panel, and the panel copies a link to its brief. The map bundle is rebuilt from source with a pinned esbuild (`bun run build:map`), and CI checks it byte for byte (`feca53f`).
- Briefs and section pages name Franken Research as the author, not the FrankenSuite program. Every brief has working share cards (absolute `og:image`, one 1200x630 card per project generated from `data.js` by `site/scripts/make-og.mjs`) and a Share button. The section pages' source notes were rewritten for readers. Added a 404 page, an absolute-URL sitemap, and robots.txt (`7a8563e`).
- Fixed reader-visible defects that two independent audits of the briefs found: four dead or misdirected external links (two unbalanced Wikipedia URLs, a login-walled libraries.io page replaced with docs.rs, and a removed GitHub repository now cited without a link), a stray Markdown marker, a missing quotation mark, and a duplicated sentence (`7a8563e`).

### Corrections

None yet.
