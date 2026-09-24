# frankengit: re-check after 71 of 78 workflow files were removed (addendum, 2026-09-24)

**Repository:** `Dicklesworthstone/frankengit` ·
**Packet pin (unchanged):** `894585a35e23d31bb462de24c6691124054d9c9e` (2026-09-22 14:52:00 UTC),
assessed in [`packets/frankengit-assessment.md`](../packets/frankengit-assessment.md) ·
**Re-check pin:** `dfa5bb861e1f08802c72d33e96796a1aad9d5d06` (2026-09-24 18:10:51 UTC), the
default-branch HEAD when read at 18:31 UTC, 137 commits after the packet pin ·
**Commits seen earlier, not assessed as pins:** `3358315` (the 2026-09-24 movement census, 109
commits past the pin) and `408df52` (watch issue
[#5](https://github.com/JYeswak/franken-research/issues/5)); both already had the 8-file workflow set
read here · **Re-check date:** 2026-09-24, 18:30 to 18:54 UTC; corrected after independent review
([`stack/reviews/frankengit-recheck.md`](../stack/reviews/frankengit-recheck.md)) · **Rules:**
[RULEBOOK.md](../RULEBOOK.md) v1.1 and [updates/METHOD.md](METHOD.md). The packet is not edited;
this file sits beside it.

**Tier legend (Rulebook §1).** [Verified] Tier 1: the analyst inspected it directly. Flavors:
[Git-observed] git metadata, [Code-verified] source read, [Counted] a count the analyst ran,
[Verified absence] a search of the tree that found nothing, [Executed] the analyst ran the
maintainer's own checker and quotes its output. All five map to Tier 1. [CI-observed] Tier 2:
run records and conclusions read from the GitHub Actions API. [Maintainer claim] Tier 3: asserted
in the repository or commit messages, not re-derived. [External] Tier 4: other GitHub API reads
(branches, releases, tags, license). [Inference] Tier 5: analyst judgment.

**Method.** Blobless clone of the public repository into a scratch directory outside this tree,
checked out at the re-check pin. Read all eight workflow files at the re-check pin; parsed all 78 at
the packet pin with PyYAML 6.0.3 and classified their triggers; read the three commits in the range
that touch `.github/workflows`, `scripts/verify.sh`, `AGENTS.md` §12, the local-verification and
normative-contract documents, and the README status banner and reality snapshot. Pulled the full
Actions run history (`gh api --paginate repos/Dicklesworthstone/frankengit/actions/runs`, 7,204
runs, `total_count` 7,204) and the registered-workflow list. Compiled the maintainer's
`tools/registry-check` (no dependencies; `rustc +nightly --edition 2024`, rustc 1.100.0-nightly
2026-08-22, not the repository's pinned `nightly-2026-08-31`) from the re-check pin's source and ran
its `docs` check set against four trees. **Not done:** nothing in the workspace was built; no test,
E2E suite, or benchmark was run; `scripts/verify.sh` itself was not run, so its
`check_toolchain_bootstrap_links.sh` step and the `constitution` lane were not exercised; no
workflow was dispatched; the packet's other findings (unsafe count, crate count, claims registry
rows) were not re-counted; no new web search for independent validation.

## What changed, in one paragraph

Four hours after the pin, commit `53776f9b` deleted 71 of the 78 workflow files and rewrote the 7
it kept so that each runs only when started by hand (`workflow_dispatch`); their check steps each
call `./scripts/verify.sh <lane>`, and their other steps install the pinned toolchain, record the
revision and compiler, or archive the source [Git-observed + Code-verified, High]. An hour later a merge,
`da52b223`, brought back one file from a 2026-09-04 branch, a one-shot job that applies a patch to
`main`; that makes 8. Since the removal commit, GitHub has recorded no workflow run of any kind
(latest run 2026-09-22 18:11:29 UTC) [CI-observed, High]. The removal did not move checking to a
new place. It enforced a rule the repository has stated since 2026-08-20 (commit `f3fe619c`):
workflow files are "dispatch-only portable adapters", verification is local, and "FrankenGit
MUST NOT rely on GitHub-hosted Actions" [Maintainer claim, High; the documents are unchanged
between the pin and the re-check]. At the pin that rule was broken by every one of the 78 files,
and 94.8% of the repository's Actions runs were zero-job failures from files GitHub could not parse.
At the re-check it is broken by one file, the re-added one, and the maintainer's own docs checker
fails on it. The CI cell moves from C3 to C5.

## Matrix cells: pin versus re-check

| Cell | At the pin (2026-09-22, `894585a`) | At the re-check (`dfa5bb8`) | Tier and evidence |
|---|---|---|---|
| TRL | 4 | **4, unchanged** | [Inference, Medium]. No release, no production transport, and the README status line is byte-identical to the pin ("not yet a general-purpose Git server, a production-ready forge, or a GitHub replacement"). The README's reality snapshot is now dated 2026-09-23 (it was 2026-09-07 at the pin) and reports real-`git`-client suites passing at `94a77dfb` and smart-HTTP fetch and push working with a nonstandard header [Maintainer claim, Medium; not run]. The same snapshot says "Main is not currently verifiable" and that `46b922e7` does not compile. Lab validation of components is what TRL 4 already credits; nothing is integrated or validated in a relevant environment. |
| NODUS ring | Explore | **Explore, unchanged** | [Inference, High]. Pilot needs a release artifact and a bounded real-workload fit; Invest needs independent validation and governance. None of the three appeared. |
| License | MIT + OpenAI/Anthropic rider | **Same, unchanged** | [Git-observed, High]: `git diff --quiet 894585a dfa5bb8 -- LICENSE` exit 0; first line "MIT License (with OpenAI/Anthropic Rider)". GitHub's license API reports `NOASSERTION` [External, High]. |
| Bus factor | 1 | **1, unchanged** | [Git-observed, High]: the 137 commits from the pin to the re-check pin carry three author names, Jeffrey Emanuel (67), Jeff Emanuel (59) and Dicklesworthstone (11), all the maintainer. Sixteen commit bodies carry `Co-Authored-By` trailers; all name a model ("Claude", 5; "Claude Opus 5.5 (1M context)", 11), not a person. |
| CI class | C3 (78 workflows; pin verdict not legible) | **C5 at the re-check pin** (CI de-automated and mostly deleted) | [Code-verified + CI-observed, High]. 7 of 8 files trigger only on `workflow_dispatch`; the eighth triggers on pushes to `tooling/gpt56pro-apply-format-20260904`, a branch that no longer exists on GitHub (branches API: 404) [External, High]. No file runs on a push or pull request to `main`. Zero runs for the re-check pin and zero runs of any workflow after 2026-09-22 18:11:29 UTC. This matches the pinned C5 precedents: frankengraphdb (`workflow_dispatch`-only by owner ruling, local proof script) and frankentui (Actions disabled, private DSR). C6 was considered: the verifier is local and its replay receipts go to `evidence/`, which `.gitignore` excludes, so they are not published [Verified absence, High]. C5 is chosen because the event is the de-automation, as in those precedents. The C3 reading of the pin stands, now with detail: the only 18 runs on `894585a` were zero-job failures from 9 unparseable files (below), so no test ran on the pinned commit. |
| Release class | R1 (no release or tag) | **R1, unchanged** | [External + Git-observed, High]: releases API returns 0, tags API returns 0, `git tag` in the clone is empty. |
| No-contribution policy | no | **no, unchanged** | [Verified absence, Medium]: no refusal sentence in the README at the re-check pin; the only "contribut" hit is one table row (line 684) pointing to `AGENTS.md` as the "Human and coding-agent contribution contract". The pin has the same single row, at line 687. |
| Independent validation | none | **none, not re-searched** | No new search was run. |
| Analyst behavioral reproduction | no | **no, unchanged** | The analyst ran the maintainer's documentation and registry checker, which lints files; it does not exercise the product. |

**What the pinned suite counts would become under a re-pin at `dfa5bb8`** (not applied; the
published counts stay as of 2026-09-22): CI classes C3 6 to 5 and C5 8 to 9; C1, C2, C4 and C6
unchanged. TRL spread, rings, license, release and bus-factor counts unchanged.

## The workflow files, at each pin

At the packet pin, 78 files, by trigger (PyYAML parse of each file at `894585a`) [Counted, High]:

| Trigger | Files | Examples |
|---|---|---|
| `push` to a branch other than `main` (one-shot agent or campaign branches) | 63 | `core-integration-session.yml`, `event-feed-verify.yml`, `gpt56pro-apply-asb8-core-20260904.yml` |
| `push` to `main`, path-filtered (3 also `workflow_dispatch`) | 6 | `exact-patch.yml`, `native-bundle.yml`, `source-snapshot.yml`, `index-maintenance.yml`, `source-symbols.yml`, `symbol-index.yml` |
| Not valid YAML (PyYAML: "while scanning a simple key", or "expected a single document") | 9 | `gpt56pro-agent-context-hardening.yml`, `gpt56pro-nodeconfig-doc-fix.yml`, `gpt56pro-publish-bv-agent-contract.yml` |
| `pull_request`, `schedule`, or any other trigger | 0 | |

At the re-check pin, 8 files (`.github/workflows` tree `092d6ab`, was `ec34737` at the pin)
[Code-verified, High]:

| File | Trigger | What it runs |
|---|---|---|
| `docs-integrity.yml` | `workflow_dispatch` | `./scripts/verify.sh docs` (documentation and registry checks). At the pin this path held a different job, "scratch-agent-task-snapshot", on an agent branch. |
| `exact-patch.yml` | `workflow_dispatch` | `./scripts/verify.sh exact-patch` (patch regression tests) |
| `index-maintenance.yml` | `workflow_dispatch` | pinned nightly install, `./scripts/verify.sh index-maintenance` |
| `review-protection-activation-verify.yml` | `workflow_dispatch` | `./scripts/verify.sh review-protection`, then `admission-tests` (`cargo test -p fgit-admission`) |
| `source-snapshot.yml` | `workflow_dispatch` | source archive plus `native-rebase-check` and `native-rebase-test` |
| `source-symbols.yml` | `workflow_dispatch` | `./scripts/verify.sh source-symbols` |
| `symbol-index.yml` | `workflow_dispatch` | three jobs: `symbol-index`, `symbol-index-native`, `symbol-index-maintenance` |
| `gpt56pro-apply-format-20260904.yml` | `push` to `tooling/gpt56pro-apply-format-20260904` | checks out commit `735ad7a` (`ref: ${{ env.EXPECTED_MAIN }}`), applies a stored diff, runs a stored `validate.sh`, commits as the agent name CobaltKite, then fetches `origin/main` and pushes to `main` only if `origin/main` still equals `735ad7a`. A one-shot patch applier, not a test. |

Seven of the eight still run tests or checks if started by hand; none starts on its own. The
eighth cannot fire unless its branch is recreated, and if it did its `EXPECTED_MAIN` guard would
fail against today's `main` [Code-verified + External, High on the trigger and branch;
Inference, High that it is inert].

The removal commit, quoted in full (author and committer dates are equal) [Maintainer claim;
Git-observed for author, date, and diff]:

```
53776f9b0e10aee32325f77cd404fc6434b10935  Jeffrey Emanuel  2026-09-22T14:54:26-04:00
fix(constitution): un-red docs and constitution gates at HEAD (frankengit-8zzx)

- Converted durable workflow lanes to dispatch-only delegating manifests via verify.sh.
- Retired one-shot session manifests from .github/workflows.
- Updated constellation.lock and registries/dependency_policy.tsv for fsqlite 0.4.0 transitives.
- Updated psm ffi_policy to host_assembled_stack_stub_no_foreign_engine.
- Verified ./scripts/verify.sh docs and ./scripts/verify.sh constitution both pass cleanly.
```

It deletes 71 files, modifies 7, and adds ten feature lanes to `scripts/verify.sh`, commented
"thin dispatch to repository-owned verification scripts so workflow manifests delegate to
./scripts/verify.sh instead of embedding unique correctness invocations (AGENTS.md section 12)".
It is 31 commits after the pin. The merge that re-added the eighth file:

```
da52b223b37b599f20e024b7fb25f790a4a48f5e  Dicklesworthstone  author 2026-09-22T15:55:54-04:00 (committed 15:56:10)
Merge remote-tracking branch 'origin/tooling/gpt56pro-apply-format-20260904'
```

Its second parent is `d0cf478f` (2026-09-04, "chore(control): launch guarded rustfmt repair"),
which added that file on its own branch. The merge message discusses repairing Rust compile errors
from the fold and does not mention the workflow file. Git's rename detection pairs the re-added file
with the deleted `gpt56pro-apply-asb8-core-20260904.yml` (R065), which is why the census counts
the net change as +1 / -71.

## The run history

From the 7,204 runs GitHub reports for the repository (2026-08-20 01:50 to 2026-09-22 18:11 UTC;
7,203 `push` events and 1 `create`; all `completed`) [CI-observed, High]:

- **6,828 runs (94.8%) were zero-job failures** whose run name is the file path, which is how
  GitHub records a workflow file it cannot parse. They came from 10 files between 2026-09-04 and
  2026-09-22: the 9 unparseable files at the pin, and `native-tags-work.yml`, which failed that
  way once, run `34844430134` at 2026-09-14 12:37 UTC (its next run, `34844650213` two minutes
  later, executed and succeeded), and parses at the pin. Four sampled runs (`35226383715`,
  `35467601905`, `35145705722`, `34913374690`) each returned `jobs.total_count` 0. A push
  produced one such red run per broken file; the pinned commit got two sets of nine.
- **376 runs executed jobs:** 155 success, 187 failure, 34 cancelled.
- **The 71 removed files all ran at least once.** Their runs: 6,982 failure, 87 success, 2
  cancelled; of runs that executed jobs, 154 failure, 87 success, 2 cancelled, and only 11 of
  those 243 on `main`. Last run of each removed file: 36 failure, 35 success.
- **On the pinned commit** `894585a`: 18 runs, all zero-job file failures (the 9 broken files,
  twice). No job ran against the pin. GitHub shows the commit red, but no check ran on it, so the
  pin is C3 (no pin verdict) and not C2 (CI red at the pin).
- **The last run that executed a job** was 2026-09-22 12:41 UTC on `c94ca13e`, 11 commits before
  the pin: `source-snapshot.yml` failure and `symbol-index.yml` success on the same commit. In the
  seven days before the pin (2026-09-15 14:52 to 2026-09-22 14:52 UTC), the path-filtered `main`
  workflows ran 15 success and 3 failure (`symbol-index`), 5 success (`source-symbols`), 4 success
  (`index-maintenance`), 4 failure (`source-snapshot`), 1 success and 2 failure (`exact-patch`),
  1 failure (`native-bundle`, run `35454271459`).
- **On the re-check pin:** 0 runs. **After the removal commit:** 0 runs.
- GitHub still lists 12 registered workflows, all `active`, including four whose files are on no
  current branch (`gpt56pro-asb8-diagnostic.yml`, `gpt56pro-asb8-hosted.yml`,
  `import-cancellation-apply.yml`, `fetch-integration-work.yml`); the branches API lists only
  `main` and `master`, and those four last ran on `tooling/*` branches that no longer exist
  [External, High].

## Where the checks went

Nowhere new. The policy the removal enforces is older than the pin and unchanged since it
[Git-observed, High: each file below is identical at `894585a` and `dfa5bb8`]:

- `AGENTS.md` §12 (this text since `f3fe619c`, 2026-08-20): "Workflow YAML may call these commands for Doodlestein
  Self-Releaser/`act`; it must not contain unique correctness or release logic. Do not rely on
  GitHub-hosted Actions availability or status."
- `docs/NORMATIVE_PROTOCOL_CONTRACTS.md:720`: "FrankenGit MUST NOT rely on GitHub-hosted Actions.
  `.github/workflows` are dispatch-only portable adapters that delegate to repository-owned commands
  and are intended for Doodlestein Self-Releaser/`act`."
- `docs/LOCAL_VERIFICATION_AND_RELEASE_PIPELINE.md:55`: "Workflow manifests are dispatch-only by
  default and are intended for local DSR/`act` execution. If an operator deliberately enables remote
  execution, its result has no stronger status than the equivalent repository-owned local lane
  receipt."
- `docs/NEGATIVE_EVIDENCE_LEDGER.md:51` (NEG-005): "GitHub Actions status is release evidence ...
  rejected; local DSR lane receipts and signed root-last manifest are authoritative."

The checks themselves live in `scripts/verify.sh` (lanes `docs`, `constitution`, `fast`, and the
ten feature lanes; `full` and `release` still refuse with exit 3). Its header says every cargo
invocation runs "on THIS machine" with the `rch` build offload bypassed
(`RCH_CARGO_WRAPPER_BYPASS=1`), and each lane writes a `frankengit.verify-replay.v1` JSON record
(head, dirty-diff hash, rustc and cargo versions, exit code, output hashes) under
`evidence/verify`, which is gitignored [Code-verified, High]. So the lanes are documented and
runnable by anyone with the pinned nightly, and their results are not published.

**The rule has a checker, and it was red at the pin.** `tools/registry-check`'s `check_workflows`
(unchanged since 2026-08-20; its helper `is_hosted_trigger_line`, which holds the trigger list,
since 2026-08-22, `82e7aeaa`) fails any workflow that does not call `./scripts/verify.sh`, lacks
`workflow_dispatch`, uses an action not pinned to a full SHA, or names any of 13 automatic
triggers (`push`, `pull_request`, `schedule`, and ten more) [Code-verified, High]. Compiled from
the re-check pin's source (its `main.rs` SHA-256 `447fa1ec…d806f7`, the same digest the checker
itself reports as "observed" below) and run as `registry-check docs` against four trees
[Executed, High]:

| Tree | Exit | Errors | Workflow errors (files) |
|---|---|---|---|
| packet pin `894585a` | 1 | 239 | 238 (all 78 files), plus one broken relative link |
| removal `53776f9b` | 0 | 0 | 0 |
| merge `da52b223` | 1 | 5 | 3 (1 file) |
| re-check pin `dfa5bb8` | 1 | 5 | 3 (1 file) |

At the re-check pin the five errors are:

```
FrankenGit constitutional verification FAILED:
  - README claim-status block is stale; regenerate it with `fgit-registry-check claims-status`
  - claim `CLM-001` demoted: artifact `tools/registry-check/src/main.rs` digest changed: expected b8a704e6a843edb6ac643403b286008af2e5baff9c94c870afc414846d50993d, observed 447fa1ec0625c1097a2a30973cc5071cac05f9b19024a77bcb52c73649d806f7; generated status must not present it as verified
  - workflow .github/workflows/gpt56pro-apply-format-20260904.yml must delegate to repository-owned ./scripts/verify.sh
  - workflow .github/workflows/gpt56pro-apply-format-20260904.yml must expose workflow_dispatch for local DSR/act execution
  - workflow .github/workflows/gpt56pro-apply-format-20260904.yml:4 enables hosted automatic execution; FrankenGit workflows are local/dispatch manifests
```

Two readings follow. The removal commit's "Verified ./scripts/verify.sh docs ... pass cleanly" is
consistent with the checker at that commit (exit 0), and the merge an hour later made it red again
[Executed, High]. And the auto-demotion the packet credited is observable working: the registry's
own claim `CLM-001` is demoted because the checker's source changed after the claim was bound
[Executed, High]. Nothing in the repository runs this checker on every commit; it runs when
someone runs `verify.sh docs` [Inference, High].

## New claims since the pin

Status uses the Rulebook §4.3 vocabulary.

| # | Claim | Status | Evidence | Tier, Confidence |
|---|---|---|---|---|
| 1 | "Converted durable workflow lanes to dispatch-only delegating manifests via verify.sh" (`53776f9b`) | demonstrated | the 7 kept files each have only `workflow_dispatch`, and their check steps each call `./scripts/verify.sh <lane>` (other steps install the pinned toolchain, record the revision and compiler, or archive the source); the maintainer's checker reports 0 workflow errors for these seven at `53776f9b`, `da52b223` and `dfa5bb8` | [Code-verified + Executed, High] |
| 2 | "Retired one-shot session manifests from .github/workflows" (`53776f9b`) | partially demonstrated | 71 deleted at `53776f9b`; one one-shot manifest re-added by merge `da52b223` and present at the re-check pin | [Git-observed, High] |
| 3 | "Verified ./scripts/verify.sh docs and ./scripts/verify.sh constitution both pass cleanly" (`53776f9b`) | partially demonstrated | the docs checker exits 0 on that tree when run by the analyst; the bootstrap-links step and the `constitution` lane were not run | [Executed, High for the checker; Maintainer claim for the rest] |
| 4 | "FrankenGit MUST NOT rely on GitHub-hosted Actions. `.github/workflows` are dispatch-only portable adapters" (normative contract, this text since 2026-08-20) | disproven at the pin; partially demonstrated at the re-check pin | pin: 69 of 78 files had `push` triggers, 9 did not parse, checker 238 workflow errors; re-check: 7 of 8 comply, 1 does not | [Counted + Executed, High] |
| 5 | Local lane receipts are the authoritative verification record (NEG-005; `LOCAL_VERIFICATION_AND_RELEASE_PIPELINE.md`) | aspirational as public evidence | receipts are written to `evidence/verify`, which is gitignored; no receipt is published in the tree | [Code-verified + Verified absence, High] |
| 6 | "Main is not currently verifiable": `46b922e7` does not compile; "The docs lane and Clippy fail" at `94a77dfb` (README reality snapshot, 2026-09-23) | partially demonstrated | the analyst saw the docs checker fail at the re-check pin (a later commit); compilation and Clippy not run | [Executed, High for the docs check; Maintainer claim, Medium for the rest] |
| 7 | "163 commits since 2026-09-07 state that compilation or tests were not run; 115 of them say Cargo/rustc was unavailable" (same snapshot) | partially demonstrated: the maintainer's own count, not recounted | README at `dfa5bb8`, lines 144 to 146 | [Maintainer claim, Medium] |
| 8 | Real-`git`-client suites pass through the `fg` binary at `94a77dfb` (`first_clone` 19/19, `first_push` 21/21, `time_travel` 15/15, `sha256_repo_roundtrip` 26/26); "6,779 passed, 45 failed and 31 ignored" | partially demonstrated: revision-bound maintainer evidence, not run | README reality snapshot | [Maintainer claim, Medium] |
| 9 | Smart-HTTP fetch and push work over protocols v0, v1, v2, but a stock `git push` needs a nonstandard `Idempotency-Key` header; SSH sessions are not confidential | partially demonstrated as stated, with the maintainer's own defects attached; not run | README lines 84 to 88 and 157 to 166 | [Maintainer claim, Medium] |

Claim 6 and claim 7 are the maintainer grading his own tree more harshly than the packet did; the
packet's governance finding ("the project's own most legible status document lags its tree by two
weeks") is answered by a snapshot one day old at the re-check.

## Rigor harvest

One new row, added to [`stack/rigor-practices.tsv`](../stack/rigor-practices.tsv) as RP-136
after the independent review. It was checked against the table's 135 rows: RP-003 (actions pinned
to SHAs) and RP-005 (least-privilege token) cover single rules the checker also enforces, RP-021
(expensive jobs behind an explicit trigger) gates jobs rather than linting files, and RP-084
already credits frankengit's exit-3 dormant lanes; none lints the workflow files as a whole
against a declared policy.

| Field | Value |
|---|---|
| id | RP-136 |
| practice | Workflow files linted against a declared execution policy |
| what_to_copy | State in the repository which events may start CI and that every workflow must call the repository's own verify entry point; enforce both, and full-SHA action pins, with a checker that fails on any workflow file that breaks them. |
| areas | frankensuite |
| evidenced_in | Dicklesworthstone/frankengit |
| source | `updates/frankengit-2026-09-24.md:214` (the checker's message in the error block above) |
| source_quote | must delegate to repository-owned ./scripts/verify.sh |
| checklist | none |
| our_status | candidate |
| our_proof | Our workflows run on push, pull_request and schedule by design; the transferable part is a gate that lints `.github/workflows/*.yml` for SHA pins, least-privilege permissions and delegation to a repository script, which no gate does today. |

Two caveats go with the row. At frankengit's pin the checker reported 238 violations across all
78 files, and at the re-check 3 in one file: a checker nobody runs per commit does not keep the
tree compliant. And its delegation test is a substring match (`text.contains("./scripts/verify.sh")`,
`main.rs:1428`), so it proves the call is present, not that nothing else runs; `source-snapshot.yml`
passes while also archiving and uploading the source, and the policy's "must not contain unique
correctness or release logic" is not enforced by the checker.

RP-099 (receipts carry provenance and generation binding) gains frankengit as evidence, via
`frankengit.verify-replay.v1` (head, dirty-diff hash, toolchain, exit code, output hashes;
`scripts/verify.sh` lines 7 to 20). RP-097 (greppable honesty trailers) does not: the README
counts commits whose messages say tests were not run, but its matching rule is not published and
this re-check did not see a fixed trailer form in those messages.

## What did not change

- Still no release or tag.
- Still the rider: `LICENSE` is byte-identical to the pin.
- Still one human: 137 of 137 commits under the maintainer's names; the co-author trailers name a
  model.
- Still the README status line, word for word.
- Still no public verification verdict for any commit: the pin had none, and the re-check pin has
  no runs at all.
- The claims registry (`registries/claims.tsv`) is unchanged; its CLM-001 row now demotes itself
  when checked, as designed.
- Not re-checked here: the packet's crate and line counts, unsafe classification, dependency
  posture, and Lean lane.

## The packet's revisit triggers

1. First tagged GitHub release: **not fired.**
2. Smart-HTTP or production SSH landing as a verified lane: **not fired.** Both exist and the
   maintainer lists their defects (header requirement; non-confidential SSH).
3. A second human maintainer with merge rights: **not fired.**
4. Any independent benchmark, security audit, or production deployment: **not searched; none
   seen.**
5. Asupersync 0.4.x constellation convergence: **not re-checked.**
6. Any change to the license rider: **not fired.**
7. A refreshed dated reality snapshot: **fired.** The README snapshot is dated 2026-09-23 and
   `docs/REALITY_CHECK_AND_BRIDGE_PLAN.md` was last changed 2026-09-24 06:10 UTC.

Next triggers for this addendum: a workflow that runs on its own again (any automatic trigger on
`main`); a published lane receipt or DSR manifest for a named commit; the re-added
`gpt56pro-apply-format-20260904.yml` removed or the docs checker green at HEAD; a dispatched run
of any of the seven lanes.

## Limitations

The analyst did not build the workspace, run any test or suite, run `scripts/verify.sh`, or
dispatch any workflow. The docs checker was compiled with a nightly nine days older than the
repository's pin and outside cargo; it has no dependencies and its reported source digest matches
the file, but a toolchain difference could in principle change behaviour. The checker compiled from
the re-check pin was run against older trees; its workflow function is unchanged since 2026-08-20
and its trigger helper since 2026-08-22 (`git log -L`), both before every tree checked, and other
checks it runs may differ from what those commits shipped, so the 239 and
5 error totals are this checker's view of those trees. YAML validity was judged by PyYAML, not by
GitHub's parser; the zero-job runs on the same 9 files agree with it. Run classification treats a
run named by its file path as a file-parse failure, confirmed on four sampled runs. The run
history, trigger parse, checker binary and checker outputs were deleted after the check; their
SHA-256: run history TSV
`ab163ec422c02de67113a035509b79983651f99b8b00176b57d46a5a2eab0b4b`, trigger parse
`27096c3b150ec9c0c511e59ff4aedcfd78327ea87bd679a2ddb0c93b72e064a4`, checker binary
`0dc0b49b92fa52c8b3ea25f1a2194b320da695a99af58a7d7480036ca47b4ef1`, checker output at the
re-check pin `149cf1af5825a00859cb1fba1d6f6f8aed6ffb2f0a5022dc86f19769a191129b`.
