<!-- Review record, published as written. Audit of every 'adopted' self-claim in stack/rigor-practices.tsv (author BeyondRigor) by control-plane pane 2. Scratch paths refer to the reviewer's machine. -->

# Adopted-claim audit — stack/rigor-practices.tsv

Read-only. HEAD `9546e4d`. Author of the index: BeyondRigor, `add8d6a` (not this checker).
Last pushed commit: `b174e34` (origin/main). Last GitHub run: `35946353035` success, push, headSha `b174e34`, 2026-09-24T02:13:42Z.
`git rev-list --count origin/main..HEAD` = 11. `0f14145`, `16deb8c`, `add8d6a`, and Gate K (`68d9523`) are not on origin.

Rule used: CONFIRMED means the HEAD proof does the practice, and a gate practice is inside `bun run verify` (`package.json:8` → `site/scripts/verify-site.sh`). A CI practice that is only in the unpushed workflow is PARTIAL, because the workflow GitHub runs on push does not have it. Existing is not implementing.

## Summary

Adopted rows: 36. CONFIRMED 12. PARTIAL 24. NOT IMPLEMENTED 0. MISLABELED 0.

Spot-check (10 candidate, 10 not-applicable): 18 honest, 2 MISLABELED (`RP-006`, `RP-085`).

Gate K3 (`site/scripts/verify-site.sh:913-927`) only checks that an adopted proof token resolves to a file, a line, or a commit. It does not check that the proof does the practice. A green K3 would not have caught the 24 partials.

## Adopted

| id | practice | verdict | evidence | fix |
|---|---|---|---|---|
| RP-001 | Measured, justified CI job timeouts | PARTIAL | HEAD `.github/workflows/verify.yml:36` is `timeout-minutes: 4` with a comment citing runs of 49s/46s/54s. origin/main `.github/workflows/verify.yml:18` is `timeout-minutes: 20` with no measurement. `0f14145` is not an ancestor of origin/main. | Push `0f14145`, or stop calling the 20-minute job measured. |
| RP-002 | Concurrency cancel-in-progress for superseded PR runs | PARTIAL | HEAD `verify.yml:20-22` cancels only `pull_request` and gives push/schedule `github.run_id`. origin/main workflow has no `concurrency:` key. | Push it. Until then it is not running. |
| RP-003 | Pin CI actions to commit SHAs | PARTIAL | HEAD pins checkout `11d5960a…` (`verify.yml:41`), setup-node `49933ea5…` (`:61`), setup-bun `0c5077e5…` (`:65`). Run `35946353035` steps were `actions/checkout@v4`, `actions/setup-node@v4`, `oven-sh/setup-bun@v2`. | Push the SHA pins. The live run is tag-pinned. |
| RP-004 | Scheduled runs so gates execute without pushes | PARTIAL | HEAD `verify.yml:14-15` cron `17 6 * * 1`. origin/main `on:` is only `push` and `pull_request`. No scheduled run exists in `gh run list`. | Push the cron. A declared schedule that has never fired is not execution. |
| RP-005 | Least-privilege CI token by default | CONFIRMED | origin/main `verify.yml:12-13` and HEAD `verify.yml:24-25` are `permissions: contents: read`. No job widens it. That workflow is what run `35946353035` used. | None. |
| RP-007 | Pin the whole toolchain, not just dependencies | PARTIAL | `package.json:11` pins esbuild `0.28.2`. Last run did `bun install --frozen-lockfile`. HEAD `verify.yml:68` pins bun `1.4.2`; origin/main `setup-bun@v2` has no `bun-version`. Node is `22`, not a patch. `verify-site.sh` calls host `python3` with no pin. | Pin bun on the pushed workflow, pin node to a patch, and record the python3 version the gates need. |
| RP-008 | Supply-chain and secret gates as separate CI steps | PARTIAL | Secret scan is its own step and runs before install: HEAD `verify.yml:45-59`, and run `35946353035` step "Secret scan (gitleaks, pinned binary)" precedes install. No dependency audit and no dependency firewall. The row's own proof says so. | Add the audit as its own step, or change status to candidate. A disclosed half is not adopted. |
| RP-009 | Verify tool and oracle integrity by hash before the suite runs | PARTIAL | HEAD `verify.yml:48-53` sha256-checks the gitleaks tarball before running it. Same step is in the last run. Chrome is an existence check (`verify.yml:84`), not a hash. Packets and `data.js` are not hashed before the suite. | Hash the oracle the suite trusts, or narrow the practice name to the gitleaks binary. |
| RP-010 | Regenerate derived artifacts in CI and fail on diff | CONFIRMED | Last run step "Committed map bundle equals what its source builds" is origin/main `verify.yml:49-52` (`bun run build:map` then `git diff --exit-code site/assets/app.bundle.js`). HEAD adds Gate K4 (`verify-site.sh:959-973`), which was not in that run. | None for the bundle. K4 still needs a push before GitHub checks generated stack pages. |
| RP-012 | Docs-as-tests: documented commands and examples run in CI | PARTIAL | CI runs the Reproduce block: README.md:48-49 `bun install --frozen-lockfile` / `bun run verify`, and the workflow comment at `verify.yml:3-4` names that pair. README.md:52 says "eleven gates" and the table ends at J (`README.md:66`). HEAD script has Gate K. The workflow step is still named "Gate chain (A..J)" (`verify.yml:78`). | Teach the gate chain to fail when the README gate table disagrees with the script, and name K in both places. |
| RP-027 | Local deterministic test server or reference fixture instead of the live service | CONFIRMED | Gate I navigates `file://${SITE}${page}` (`verify-site.sh:660`) and the comment at `:601-604` says there is no server. Last run executed the A..J chain, which includes I. | None. It is a file fixture, not a test server; the practice allows either. |
| RP-028 | Snapshot and byte-exact tests of full outputs | CONFIRMED | Gate A uses `cmp -s` on every packet (`verify-site.sh:54`) and on `RULEBOOK.md` (`:64`). Commit `9a99982` (on origin) records a one-byte packet drift failing A. | None. |
| RP-038 | Deterministic, model-free checker kept apart from generation | CONFIRMED | `bun run verify` is `bash site/scripts/verify-site.sh`. PASS/FAIL is `pass`/`fail` in that script. No model call decides a gate. Generation is `make-stack.mjs`, which K4 re-runs and diffs. | None. There is no pinned container; the practice says "prefer", not "require". |
| RP-039 | Score the observable end state, not the agent's report | CONFIRMED | Gate I fails on `Runtime.consoleAPICalled` type `error`, exceptions, and `overflowX` (`verify-site.sh:662-676`). It does not read an agent transcript. Included in the last A..J run. | None. |
| RP-060 | Version and pin benchmark tasks and datasets; record the commit in every run | PARTIAL | RULEBOOK.md:68 requires a pinned commit in the packet header. All 44 `packets/*-assessment.md` files have a hex token in the first 25 lines. Sample: `packets/asupersync-assessment.md:3` pins `768595203e194573bb713158b5963f55861dfe2d`. There is no benchmark task config, dataset pin, or per-CI-run manifest. | This is assessment pinning, not benchmark versioning. Relabel, or add a run manifest if the benchmark reading is the claim. |
| RP-067 | Config validation as its own tested surface | PARTIAL | Gate K1 (`verify-site.sh:791-817`) rejects missing front-matter keys, bad verdict/confidence enums, and a missing section. It is inside `bun run verify` at HEAD. It is not a separate API, and Gate K is not in `b174e34`, so run `35946353035` did not execute it. | Push Gate K. Do not call K1 an API. |
| RP-073 | Automated checks a contribution must pass before merge | PARTIAL | `on: pull_request` is in both the pushed workflow and HEAD. `gh api repos/JYeswak/franken-research/branches/main/protection` returned HTTP 404 "Branch not protected". Ruleset count is 0. A PR check that is not required does not block a merge. | Add a required check, or say the workflow runs on PRs and merge is not gated. |
| RP-076 | Claim-to-proof registry with machine gates | PARTIAL | Gate A2 checks method-page quotes against claim-table rows (`verify-site.sh:93-109`) and was in the last A..J run. K2 checks verdict quotes (`:829-869`). K3 resolves proof tokens (`:913-927`) and does not compare wording to evidence grade or demote on a digest mismatch. | Add the grade ceiling, or stop claiming it. K3's token check is not that gate. |
| RP-079 | Anti-extrapolation: an unrun baseline is recorded as incomplete | PARTIAL | RULEBOOK.md:80 says never cite an ungated number as a result, and quote a disavowal. It does not say an unrun baseline is recorded as incomplete or that no ratio is admissible. | Write that sentence into the Rulebook, or drop the adopted status. |
| RP-084 | Structured skip honesty: an absent oracle or unrun gate fails | CONFIRMED | HEAD and origin `verify.yml` exit 1 when Chrome is missing (`verify.yml:84` at HEAD). Gate B fails on zero `data-stat` slots (`verify-site.sh:242-243`). Gate E fails on zero resolved links (`:424-425`). Commit `a298c99` records both empty-scan failures. | None. They fail closed instead of emitting a typed skip event. That matches "absence is a failure". |
| RP-086 | Evidence color and no-laundering composition | CONFIRMED | `stack/METHOD.md:72` says the verdict itself is always Inference. K1 fails a bottom line that does not start with "Inference" (`verify-site.sh:821`). RULEBOOK.md:19 alone does not say this; the enforcing text is METHOD.md, and K1 has not run on GitHub. | Push Gate K. The composition rule is a hard cap, not a computed minimum of the citations. |
| RP-089 | Adversarial self-audit: gates proven to trip on planted defects | PARTIAL | `9a99982` records one-byte packet drift failing A and a planted `console.error` failing I. `a298c99` records renamed `data-stat` failing B and renamed hrefs failing E. Both commits are on origin. The row says "no permanent in-CI self-test yet". The practice requires one. | Put a known-bad fixture in the workflow. Commit notes are not a standing self-test. |
| RP-090 | Registry-agreement gate: parallel registries must agree exactly | CONFIRMED | Gate D fails unless brief names, packet names, and `data.js` `"name"` values are the same set (`verify-site.sh:361-371`). In the last A..J run. | None. |
| RP-091 | Statistics computed from data, not typed | CONFIRMED | Gate B recomputes aggregates from `data.js` and fails when a `data-stat` fallback differs (`verify-site.sh:191-202`) or when the slot count is zero (`:242`). In the last A..J run. | None. |
| RP-094 | Upstream-anchored contracts | PARTIAL | K2 fails when a quote is not on the cited line in this repo (`verify-site.sh:746-762`). Nothing re-fetches an upstream pin and fails CI when that upstream moves. | Say "local citation integrity", or add an upstream-pin check. |
| RP-096 | Publish rejected and failed artifacts instead of regenerating them | PARTIAL | Repo visibility is public (`gh api repos/JYeswak/franken-research`). `verify.yml:5-6` is a comment. There is no artifact-upload step. The three listed runs are all success, so retention of a red run is unobserved. | Upload the failed log as an artifact, or call this a platform default. A comment is not the practice. |
| RP-097 | Machine-greppable honesty trailers on commits | CONFIRMED | CONTRIBUTING.md:49 defines `[test]`. `git log --format=%s` : 23 commits, 0 without a trailing bracket. No `githooks/` or `.githooks/` in the tree, and the workflow does not check subjects. The proof already says convention only, not CI. | None. A fresh clone is not forced to comply. |
| RP-098 | Evidence tier on every statement | PARTIAL | RULEBOOK.md:19 requires a tier and a confidence grade on every substantive claim. K2 enforces a Rulebook tier on verdict factual bullets (`verify-site.sh:855-859`). Packet prose is not machine-checked sentence by sentence. | Enforce it on packets, or say the machine check covers verdict bullets only. |
| RP-099 | Receipts carry provenance and generation binding | PARTIAL | RULEBOOK.md:68 requires repo, pinned commit, date, and analyst method. `packets/asupersync-assessment.md:3-5` has those. The practice also asks for tool versions, host, worker, oracle script hash, and generation command. The header template does not. | Add those fields, or narrow the adopted claim to pin, date, and method. |
| RP-104 | Typed proof grammar for claims | PARTIAL | K3 accepts `path:line`, a path containing `.` or `/`, and `commit <sha>` (`verify-site.sh:915-925`). It does not distinguish test, identifier, command, count, and manual. | Type those kinds, or say two forms resolve. |
| RP-111 | Split-context adversarial review, default-refute, with attribution | PARTIAL | METHOD.md:82 says the author never reviews the verdict. K1 fails when `reviewed_by` equals `author` (`verify-site.sh:805-806`). Nothing gives the reviewer only the diff, and nothing defaults a verdict to refuted in code. | Record the default-refute protocol, or stop claiming it. Author inequality is the part that is real. |
| RP-116 | A failure seen twice becomes standing machinery | PARTIAL | BUILD-GATES.md:64-66 names the adversarial regrade as why Gate A2 exists. BUILD-GATES.md:273 says the set was built after a 34-gap review. Not every gate section names a recurring failure. | Name the prior failure on each gate, or cite only A2. |
| RP-123 | Porting rulebook adversarially reviewed before bulk work | PARTIAL | `16deb8c` (local, `[pending]`) says it adopts a stress-test of v1 with 8 findings, and it is an ancestor of the verdict commits (`eef87ef` and later). The stress-test is the author's commit message, not a reviewer's receipt. | Attach the reviewer's findings file, and do not cite a `[pending]` commit as the review. |
| RP-130 | Methodology preservation: never squash the rigor away | PARTIAL | RULEBOOK.md:197 is the 1.1 amendment row. `v11-manifest.md` exists. Current history is 23 non-merge commits. Nothing in the repo refuses a squash merge. | Add a merge policy, or say the log exists and squash is not blocked. |
| RP-133 | Fail-closed verify barriers between pipeline stages | CONFIRMED | Each gate calls `pass` or `fail` with a reason. `verify-site.sh:981-983` exits 1 if `FAIL>0`. The last run executed this script (the A..J revision). | None. |
| RP-134 | Headline numbers carry their scope caveat | PARTIAL | Same line as RP-079. RULEBOOK.md:80 requires a disavowal quote and forbids citing an ungated number. It does not require every headline number to carry the author's workload or cost caveat. | Write that rule, or share one adopted row with RP-079 instead of two. |

## Spot-check

Candidate, 10. All honest.

| id | verdict | evidence |
|---|---|---|
| RP-016 | honest candidate | Both workflows set `runs-on: ubuntu-latest` only. No matrix. |
| RP-037 | honest candidate | K3 has no planted-bad fixture step. `RP-089` records one-time plants, not a TSV fixture in CI. |
| RP-070 | honest candidate | Evidence packs are dated files. The weekly cron, itself unpushed, runs `bun run verify`. It does not re-query GitHub. |
| RP-071 | honest candidate | `verify.yml` `on:` has no deploy job and no fetch of a served URL. |
| RP-074 | honest candidate | `CHANGELOG.md` exists. No workflow compares it to a tag. |
| RP-075 | honest candidate | `AGENTS.md` is absent. |
| RP-078 | honest candidate | `NEGATIVE_EVIDENCE.md` is absent. |
| RP-093 | honest candidate | No `release` or tag trigger. Branch protection is absent, so a tag is not blocked by verify. |
| RP-100 | honest candidate | `package.json` has one devDependency, esbuild `0.28.2`. No admission record. |
| RP-122 | honest candidate | Chrome is `test -x` (`verify.yml:84`). The image can move the binary without the pin changing. Bun `1.4.2` is HEAD-only. |

Not-applicable, 10. Eight honest. Two mislabeled.

| id | verdict | evidence | fix |
|---|---|---|---|
| RP-006 | MISLABELED | The row says one job means the status already is the single required check. `gh api .../branches/main/protection` is HTTP 404. A required check is branch protection, not job count. The practice applies and is not adopted. | Status should be candidate. |
| RP-011 | honest | Static site. No API surface in the workflow or package. | |
| RP-020 | honest status, false reason | No retry step in `verify.yml`. The reason "the gates make no network calls" is false: the secret-scan step curls the gitleaks release. | Keep N/A. Correct the reason. |
| RP-023 | honest | Gate script decides PASS/FAIL with no model call. | |
| RP-026 | honest status, false reason | No VCR cassette. Same false "no network calls" reason as RP-020. | Keep N/A. Correct the reason. |
| RP-032 | honest | No expected-failure allowlist in the gate script. Empty scans fail. | |
| RP-055 | honest | No auth or isolation code in this repo. | |
| RP-085 | MISLABELED | The row says this repo ships nothing of its own to label. Commit `a298c99` added `site/self/`, and README.md:39 says that page scores this repo's TRL, ring, and license. The vocabulary applies. A dated registry gate does not exist. | Status should be candidate. |
| RP-103 | honest | No `.beads/` directory. | |
| RP-119 | honest | No unsafe Rust or C in this repo. The site gates are bash and python. | |
| RP-135 | honest | `package.json` `"private": true`. No versioned public API. | |

The extra row is RP-135, checked because the first ten N/A reads left room; the required ten are RP-006, RP-011, RP-020, RP-023, RP-026, RP-032, RP-055, RP-085, RP-103, RP-119.
