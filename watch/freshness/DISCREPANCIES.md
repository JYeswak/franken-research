# Known conformance divergences

Each entry records where this repository's machine classifier (SPEC.md FR-C) and the analysts' master matrix (`synthesis/00-overview.md`) disagree at the pin, or where the implementation departs from SPEC.md on purpose. A case that fails for one of these reasons returns `xfail: 'DISC-NNN'`, and the harness reports it as XFAIL, not as a pass.

Format, one block per entry (the harness parses the Resolution and Review date lines):

```
## DISC-NNN: short title
- **Clause:** FR-...
- **Repositories:** ...
- **Machine:** what the classifier computed, with evidence
- **Matrix:** what the analysts recorded, with the line number
- **Why they differ:** facts first, then any inference, labelled
- **Resolution:** ACCEPTED | INVESTIGATING | WILL-FIX (and what that means here)
- **Cases affected:** case ids
- **Review date:** YYYY-MM-DD
```

The matrix is never edited to match the machine. Where the matrix disagrees with its own legend, the entry says so, and the finding goes to a dated note under `updates/`.

All facts below are from the reference fixture `watch/freshness/fixtures/core/` (recorded 2026-09-25 04:02 UTC, see `fixtures/PROVENANCE.md`) unless a packet line is cited.

## DISC-001: franken_manim CI: a path-filtered test workflow failed on the pin
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** franken_manim
- **Machine:** C2 (`FR-C.2/C2`). Three push runs on the pin `d3a8090`: `ci.yml` concluded `cancelled` (no verdict), `canonical-branches.yml` `success` (a branch-reconciling job the classifier reads as kind `other`), and `project-autorebuild.yml` `failure`. `project-autorebuild.yml` triggers on push to `main` with a `paths` filter and runs checks, so it is a test workflow, and one red push run is C2.
- **Matrix:** C3 (`synthesis/00-overview.md:71`).
- **Why they differ:** the facts show a failed test-workflow run on the pinned commit. [Inference] The analysts read the main `CI` workflow, whose run on the pin was cancelled, and did not count the path-filtered workflow.
- **Resolution:** ACCEPTED. The machine applies FR-C.2 to every test workflow; the dimension stays untracked (FR-T.2) and its events fall back to the watch/README.md rules.
- **Cases affected:** CORE-H1-ci-franken_manim
- **Review date:** 2026-09-25

## DISC-002: franken_networkx CI: every workflow was disabled 13 days before the pin
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** franken_networkx
- **Machine:** C5 (`FR-C.2/C5-disabled`). The Actions API lists all four workflows (`ci.yml`, `e2e-cross-packet-golden.yml`, `nightly.yml`, `release.yml`) as `disabled_manually`, each with `updated_at` 2026-09-09 21:23 UTC; the pin `841a711` is dated 2026-09-22 15:25 UTC, so the state applies at the pin (FR-C.2 preamble). No run exists on the pin commit; the repository's last run of any workflow was 2026-09-09 21:19 UTC.
- **Matrix:** C3, "green 2026-09-09, 13 days before pin" (`synthesis/00-overview.md:75`). The packet records AGENTS.md saying Actions "must stay disabled" beside a live-looking run history (`packets/franken_networkx-assessment.md:110`).
- **Why they differ:** the workflows were disabled four minutes after the repository's last run (`release.yml`, 2026-09-09 21:19 UTC, `failure`). [Inference] The matrix's C3 looks inconsistent with its own legend, where C5 is "CI disabled/deleted" (`synthesis/00-overview.md:58`); the analysts read the run history, not the workflow states. The matrix is not edited; this finding belongs in a dated note under `updates/`.
- **Resolution:** ACCEPTED. The machine's C5 stands on API facts; the dimension stays untracked until a re-check records the class.
- **Cases affected:** CORE-H1-ci-franken_networkx
- **Review date:** 2026-09-25

## DISC-003: franken_ocr CI: workflows deleted before the pin
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** franken_ocr
- **Machine:** C4 (`FR-C.2/C4`): the pinned tree has no `.github/workflows` file.
- **Matrix:** C5 (`synthesis/00-overview.md:79`); the packet's revisit trigger reads "CI workflows restored to the tree with green runs" (`packets/franken_ocr-assessment.md:215`), so the files were deleted before the pin.
- **Why they differ:** FR-C.2's "deleted" branch of C5 compares the pin with now; a deletion that happened before the pin leaves nothing at the pin for the machine to see. The legend's C5 covers "deleted" in general.
- **Resolution:** ACCEPTED. Seeing deletions before the pin would need the workflow history before the pin, which the watch does not read.
- **Cases affected:** CORE-H1-ci-franken_ocr
- **Review date:** 2026-09-25

## DISC-004: franken_overlap CI: private-CI statement and disabled file, C6 comes first
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** franken_overlap
- **Machine:** C6 (`FR-C.2/C6-private`): `private-ci.tsv` cites `packets/franken_overlap-assessment.md:89`, "No GitHub Actions; validation is owner-local via `scripts/ci-local.sh`", [Code-verified, High]. The pinned tree has no `.github/workflows`; the old workflow sits at `ci/github-actions-disabled/ci.yml.disabled`.
- **Matrix:** C5 (`synthesis/00-overview.md:80`).
- **Why they differ:** both legend classes fit the facts ("CI disabled/deleted" and "private-only"). FR-C.2 checks C6 first, and the private-ci row follows one rule for all 44 packets (no workflow file in the pinned tree, and the packet states tests run on private or owner machines). The analysts chose C5.
- **Resolution:** ACCEPTED. Changing the row rule to match this one repository would be tuning the classifier to the matrix.
- **Cases affected:** CORE-H1-ci-franken_overlap
- **Review date:** 2026-09-25

## DISC-005: frankenpandas CI: no test run on the pin commit
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** frankenpandas
- **Machine:** C3 (`FR-C.2/C3`). The test workflows (`ci.yml`, `fast-gate.yml`) trigger on `pull_request`, schedule and dispatch, not on push; the only run on the pin `ebe79a3` is `release-plz.yml` (push, `success`), which is not a test workflow.
- **Matrix:** C2 (`synthesis/00-overview.md:93`).
- **Why they differ:** [Inference] the analysts read a red test run on another commit (a pull request or a scheduled run). FR-C.2 counts only push or pull_request runs on the pinned commit.
- **Resolution:** ACCEPTED.
- **Cases affected:** CORE-H1-ci-frankenpandas
- **Review date:** 2026-09-25

## DISC-006: frankensim CI: the pin's queued run later failed on a hosted runner
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** frankensim
- **Machine:** C2 (`FR-C.2/C2`). On the pin `4b004dc`: `percussion-physics.yml` push run `failure`; `piano-physics.yml` and `topology-optimization.yml` `skipped`. All three workflows run on GitHub-hosted runners (no `self-hosted` label), so FR-C.2's self-hosted C6 test does not hold, and no packet line states that the pinned tree has no workflow file.
- **Matrix:** C6 (`synthesis/00-overview.md:97`); the packet read "runs at the pin were queued/skipped" on 2026-09-22 and records the maintainer's claim that DSR, which is private, is the authoritative verifier (`packets/frankensim-assessment.md:105`).
- **Why they differ:** the queued run completed as a failure after the assessment; the matrix's C6 rests on the maintainer's statement that Actions is non-authoritative, which the machine does not use when public workflows exist and run.
- **Resolution:** ACCEPTED.
- **Cases affected:** CORE-H1-ci-frankensim
- **Review date:** 2026-09-25

## DISC-007: frankensqlite and frankentui CI: Actions off at the repository level, which the workflows API does not show
- **Clause:** FR-H.1, FR-C.2
- **Repositories:** frankensqlite, frankentui
- **Machine:** C3 (`FR-C.2/C3`) for both. frankensqlite: `lint.yml`, `perf-regression-analyzer-contract.yml`, `windows-vfs-interop.yml` and `concurrent-platform-matrix.yml` are `active` test workflows that trigger on push or pull_request to `main`; no run exists on the pin. frankentui: `ci.yml`, `doctor_frankentui_extended.yml` and `emulator_compat_matrix.yml` are `active` and trigger on push to `main`; no run exists on the pin; the repository's most recent run is a Dependabot update (2026-09-21).
- **Matrix:** C5 for both (`synthesis/00-overview.md:99`, `:104`). frankentui's packet: "Actions disabled in repo settings 2026-09-06 per AGENTS.md" (`packets/frankentui-assessment.md:91`, [Maintainer claim, Medium]). frankensqlite's packet: the badge workflow `verification-gates.yml` is `disabled_manually` and the other workflows have one cancelled run each (`packets/frankensqlite-assessment.md:155`).
- **Why they differ:** a repository-level Actions switch is readable only with admin rights, and the workflows API still reports each workflow `active`. [Inference] For frankensqlite the analysts judged the surface by its badge workflow, which is disabled, while other push-triggered test workflows stay registered as active.
- **Resolution:** ACCEPTED. The machine reports what the public API shows; the absence of any run on a push-triggered, active workflow is C3 by FR-C.2.
- **Cases affected:** CORE-H1-ci-frankensqlite, CORE-H1-ci-frankentui
- **Review date:** 2026-09-25

## DISC-008: release class R3 by uploaded assets where the matrix says R2
- **Clause:** FR-H.1, FR-C.4
- **Repositories:** franken_engine, franken_networkx, franken_node, frankenredis, frankentui
- **Machine:** R3 (`FR-C.4/R3-asset`) for each: a non-draft release whose tag is dated before the pin carries uploaded assets, and none targets the pin. franken_engine v0.1.0 (6 assets, `0a4e9db`); franken_networkx v0.2.2 (23 assets, `25378b3`); franken_node v0.1.0 (6 assets, `08e1edf`); frankenredis v0.1.0 (24 assets, `c577c0a`); frankentui v0.4.1 to v0.7.0 (10 to 16 assets each).
- **Matrix:** R2, "release targets earlier commit, or phantom" (`synthesis/00-overview.md:69`, `:75`, `:77`, `:94`, `:104`).
- **Why they differ:** FR-C.4 gives R3 when any considered release has an uploaded asset. The matrix applies R2 to these five, but R3 to frankenterm, franken_ocr and franken_whisper, whose releases also sit on earlier commits with uploaded assets (frankenterm v0.10.0 onward, 18 releases with assets; franken_ocr 19; franken_whisper 14). [Inference] The matrix is not consistent with itself on this pattern, so no single rule can match all eight rows. frankentui's "phantom v0.9.0" is a changelog version with no tag, which the machine does not read.
- **Resolution:** ACCEPTED.
- **Cases affected:** CORE-H1-rel-franken_engine, CORE-H1-rel-franken_networkx, CORE-H1-rel-franken_node, CORE-H1-rel-frankenredis, CORE-H1-rel-frankentui
- **Review date:** 2026-09-25

## DISC-009: release class R2 where the matrix counts an artifact the watch does not read
- **Clause:** FR-H.1, FR-C.4
- **Repositories:** franken_numpy, frankenfs, frankenmermaid, frankenscipy
- **Machine:** R2 (`FR-C.4/R2`): GitHub releases dated before the pin with no uploaded asset, none targeting the pin (franken_numpy v0.2.0, v0.3.0; frankenfs v0.2.0; frankenmermaid v0.2.0; frankenscipy v0.1.0, v0.2.0).
- **Matrix:** R3, "release artifact exists" (`synthesis/00-overview.md:78`, `:87`, `:92`, `:95`).
- **Why they differ:** franken_numpy's packet records crates.io publication (`packets/franken_numpy-assessment.md:22`). [Inference] The analysts counted registry artifacts (crates.io, PyPI, npm) as release artifacts for these four; the watch reads GitHub release assets only.
- **Resolution:** ACCEPTED. Reading registries is out of scope for FR-C.4 as written.
- **Cases affected:** CORE-H1-rel-franken_numpy, CORE-H1-rel-frankenfs, CORE-H1-rel-frankenmermaid, CORE-H1-rel-frankenscipy
- **Review date:** 2026-09-25
