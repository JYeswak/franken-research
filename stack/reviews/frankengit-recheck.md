<!-- Review record, published as written. Review of updates/frankengit-2026-09-24.md (commit fbeccd9, author session RecheckFrankengit) by the agent session ReviewFrankengit. Line numbers refer to the addendum as committed in fbeccd9. Scratch paths refer to the reviewer's machine. -->

# Review of updates/frankengit-2026-09-24.md

Checker: ReviewFrankengit, an agent session. Author of the addendum: RecheckFrankengit, a separate
session; the addendum landed as `fbeccd9`. Not the same session.
Checked 2026-09-24, 18:58 to 19:12 UTC, from the GitHub API and a blobless clone of
`Dicklesworthstone/frankengit`. Nothing in frankengit was built, tested, or dispatched.

**Verdict: ACCEPT WITH CORRECTIONS.** Ten corrections are required: nine in the addendum and one in
the proposed RP-136 row. Correction 5 also applies to one sentence on the `/updates/` card. None
changes a matrix cell. The calls that matter hold. The move from C3 to C5 at `dfa5bb8` matches how
the pinned matrix classes frankengraphdb. TRL 4 unchanged is defensible. The re-pin arithmetic
(C3 6 to 5, C5 8 to 9) is right. The checker table reproduces exactly: my run of the maintainer's
checker at `dfa5bb8` printed output with SHA-256
`149cf1af5825a00859cb1fba1d6f6f8aed6ffb2f0a5022dc86f19769a191129b`, the digest the addendum quotes.

## Required corrections

1. **Line 11, re-check window.** "18:30 to 19:40 UTC" cannot be right. The addendum was committed
   at 18:54:06 UTC (`git log -1 --format=%cI fbeccd9` returns `2026-09-24T12:54:06-06:00`). Give an
   end time no later than 18:54 UTC.
2. **Lines 138-139, `native-tags-work.yml`.** The addendum says it "failed that way twice on
   2026-09-14". It failed that way once: run `34844430134` at 12:37:26 UTC is named by its file
   path and failed. Its only other run, `34844650213` at 12:39:50 UTC, is named "Native tag
   implementation" and succeeded. The 6,828 total is right, and it depends on this count being 1:
   8 files × 757 runs + 771 + 1 = 6,828.
3. **Line 152, week before the pin.** The addendum gives `native-bundle` as "2 failure". Any
   seven-day window ending at the pin (2026-09-22 14:52 UTC) holds 1 run: `35454271459`, a failure
   on 2026-09-19. A window starting at 2026-09-15 00:00 UTC holds 2 failures, but also 1 success and
   1 cancelled, so no window gives "2 failure" alone. The other five figures in that sentence match.
4. **Lines 154-156, registered workflows.** The addendum says four registered workflows have files
   "only on other branches". Those files are on no branch. The branches API lists two branches,
   `main` and `master`, and neither contains any of the four files (`git cat-file -e` on every
   remote ref). They last ran on `tooling/*` branches that no longer exist:
   `gpt56pro-asb8-diagnostic` (27 runs), `gpt56pro-asb8-hosted` (26), `import-cancellation-apply`
   (2), and `fetch-integration-work` (6). Suggested wording: "four whose files are on no current
   branch".
5. **Lines 41-42 and 223: the seven kept files do more than call `verify.sh`.** Line 42 says each
   file "does nothing but call `./scripts/verify.sh <lane>`", and claim 1 on line 223 says "each step
   calls" it. That is not true at `dfa5bb8`:
   - `index-maintenance`, `source-symbols`, and `symbol-index` install the pinned nightly first;
   - `review-protection-activation-verify` records `git rev-parse HEAD` and `rustc -Vv`, and ends
     with `git diff --exit-code` and `git status --porcelain`;
   - `source-snapshot` records the revision and compiler, builds a `git archive` with a
     `sha256sum`, and uploads it with `actions/upload-artifact`.

   The addendum's own table (lines 90 and 92) mentions two of these. Suggested wording: "whose
   check steps each call `./scripts/verify.sh <lane>`; the other steps install the pinned
   toolchain, record the revision and compiler, or archive the source". Claim 1 stays
   *demonstrated*: the maintainer's checker reports 0 workflow errors for these seven files at
   `53776f9b`, `da52b223`, and `dfa5bb8`. `site/updates/index.html:535` repeats the overstatement
   ("each of those now just calls the repository's own `scripts/verify.sh`"). Fix it there too.
6. **Line 64, no-contribution cell.** The addendum reports "two table rows" containing
   "contribut". The README has one occurrence at `dfa5bb8`, on line 684: "| [`AGENTS.md`](AGENTS.md)
   | Human and coding-agent contribution contract |". The pin also has one, on line 687. The cell
   value, "no", is unaffected.
7. **Line 303, toolchain age.** The addendum calls the checker's compiler "a nightly six days
   older" than the repository's pin. rustc prints 2026-08-22 (`rustc 1.100.0-nightly (c54751567
   2026-08-22)`), and `rust-toolchain.toml` pins `nightly-2026-08-31`. That is nine days by those
   dates.
8. **Line 95, how the patch job's guard works.** The addendum says the job "checks out `main` only
   if it still equals `735ad7a`". The job actually checks out `735ad7a` itself (`ref: ${{
   env.EXPECTED_MAIN }}`). It applies the diff, validates, and commits. It then runs
   `git fetch origin main` and pushes only if `origin/main` still equals `735ad7a`. The conclusion
   on lines 97-100 still holds: against today's `main`, the job would fail at that last test.
9. **Line 121, merge timestamp.** The block reads "sha, author, date", and the date shown,
   `2026-09-22T15:56:10-04:00`, is the committer date of `da52b223`. The author date is
   `2026-09-22T15:55:54-04:00` (commits API: author 19:55:54Z, committer 19:56:10Z). For
   `53776f9b` the two dates are equal. Either use the author date or label the date as the
   committer date.
10. **Lines 252-253, RP-136 would fail Gate K3.** K3 (`site/scripts/verify-site.sh:918-923`)
    requires `source` to be in `path:line` form and requires the quote to appear on that line of a
    file in this repository. The row as proposed fails on both counts. `source` is the bare
    `updates/frankengit-2026-09-24.md`, with no line number. The quote "workflow {display} must
    delegate to repository-owned ./scripts/verify.sh" is the upstream format string
    (`tools/registry-check/src/main.rs:1430` at `dfa5bb8`). It does not appear in this tree. I
    simulated K3's regex and `check_cite` on three variants of the row:
    - as proposed: "source ... is not path:line";
    - with `:205` added to the source but the quote unchanged: "quote not on the cited line";
    - with source `updates/frankengit-2026-09-24.md:205` and quote `must delegate to
      repository-owned ./scripts/verify.sh`: ok.

    Line 205 is the instantiated checker message. Set the line number after corrections 1 to 9
    land, because edits above line 205 will move it.

## Recounts, claimed against measured

Sources: `gh api` (compare, commits, `actions/runs` paginated to 7,204 records, `actions/workflows`,
`runs/<id>/jobs`, branches, releases, tags, license); a blobless clone for trees, blobs, and
`git diff -M`; PyYAML 6.0.3 for triggers.

| Item | Addendum | Measured | Match |
|---|---|---|---|
| Commits from the pin to the re-check pin | 137 | `compare` ahead_by 137 | yes |
| `3358315` past the pin | 109 | 109 | yes |
| `53776f9b` after the pin / `c94ca13e` before it | 31 / 11 | 31 / 11 | yes |
| Pin and re-check commit dates | 14:52:00 / 18:10:51 UTC | same (author = committer) | yes |
| Workflow files at the pin / re-check pin; tree ids | 78 / 8; `ec34737` / `092d6ab` | 78 / 8; same | yes |
| `53776f9b` workflow changes; lanes added | 71 removed, 7 modified; 10 lanes | 71 `removed`, 7 `modified` (81 files); 10 `exec` lanes | yes |
| `git diff -M` pin to re-check pin, workflows | +1 / -71, rename R065 | 70 D, 7 M, 1 R065 (`asb8-core` to `apply-format`) | yes |
| Triggers at the pin | 63 push to non-main, 6 push to main (3 also dispatch), 9 invalid, 0 other | 63; 3 + 3; 9 (8 "while scanning a simple key", 1 "expected a single document"); 0 | yes |
| Triggers at the re-check pin | 7 `workflow_dispatch` only, 1 push to a deleted branch | same; branch API `404 Branch not found` | yes |
| Runs, events, status, date range | 7,204; 7,203 push + 1 create; all completed; 08-20 01:50 to 09-22 18:11 UTC | 7,204 unique ids; same; `2026-08-20T01:50:27Z` to `2026-09-22T18:11:29Z` | yes |
| Zero-job file failures | 6,828 (94.8%) from 10 files, 2026-09-04 to 09-22 | 6,828 (94.78%), 10 files, `2026-09-04T12:58:22Z` to `2026-09-22T18:11:29Z` | yes |
| `native-tags-work.yml` zero-job failures | 2 | **1** | **no** (correction 2) |
| Sampled zero-job runs | 4 runs, `jobs.total_count` 0 | the same 4 give 0; 12 more (seed 20260924) also 0 | yes |
| Runs that executed jobs | 376: 155 success, 187 failure, 34 cancelled | same; 46 of them sampled (all 34 cancelled + 12), all had jobs | yes |
| Removed files: runs; runs with jobs; on `main`; last run per file | 6,982 / 87 / 2; 154 / 87 / 2; 11 of 243; 36 failure, 35 success | same, all four | yes |
| Runs on the pin `894585a` | 18, all zero-job, 9 files twice | 18, all zero-job, 9 distinct paths | yes |
| Runs on `dfa5bb8`; runs after the removal commit | 0; 0 | 0; 0 (no run created after 18:54:26 UTC) | yes |
| Last run with jobs | 2026-09-22 12:41 UTC on `c94ca13e`, source-snapshot failure, symbol-index success | `12:41:04Z`, same pair | yes |
| Week before the pin, path-filtered `main` workflows | symbol-index 15/3, source-symbols 5, index-maintenance 4, source-snapshot 4 failure, exact-patch 1/2, native-bundle 2 failure | same except **native-bundle 1 failure** | **no** (correction 3) |
| Registered workflows | 12, all active, 4 on other branches only | 12, all `active`; the 4 are on **no** branch (only `main`, `master` exist) | **no** (correction 4) |
| Checker at pin / removal / merge / re-check pin | exit 1, 239 (238 wf, 78 files); 0, 0; 1, 5 (3 wf, 1 file); 1, 5 (3 wf, 1 file) | identical on all four rows, including the one broken relative link at the pin | yes |
| Checker output hash at `dfa5bb8`; `main.rs` SHA-256 | `149cf1af…129b`; `447fa1ec…d806f7` | identical; identical | yes |
| `BANNED` automatic triggers | 13 | 13 (`main.rs`, `is_hosted_trigger_line`) | yes |
| `check_workflows` unchanged since 2026-08-20 | yes | body last changed `9a85caf9`, 2026-08-20 (compared across all 60 versions of `main.rs`) | yes (see note b) |
| Policy quotes | AGENTS.md §12; `NORMATIVE_PROTOCOL_CONTRACTS.md:720`; `LOCAL_VERIFICATION_AND_RELEASE_PIPELINE.md:55`; `NEGATIVE_EVIDENCE_LEDGER.md:51` | verbatim at `AGENTS.md:232` (§12 heading at 220), `:720`, `:55`, `:51`; all four blobs identical at both pins; text introduced by `f3fe619c` (2026-08-20, `git log -S`) | yes |
| License | byte-identical, first line with rider; API `NOASSERTION` | blob `490c02a` at both pins; `NOASSERTION` | yes |
| Releases / tags | 0 / 0 | 0 / 0 | yes |
| Authors from the pin to the re-check pin | Jeffrey Emanuel 67, Jeff Emanuel 59, Dicklesworthstone 11 | same | yes |
| `Co-Authored-By` | 16 commits; "Claude Opus 5.5 (1M context)" 11, "Claude" 5 | same | yes |
| README status line; snapshot date | byte-identical; 2026-09-07 to 2026-09-23 | line 5 identical (326 chars); `Reality snapshot: 2026-09-07` at pin line 124, `2026-09-23` at line 130 | yes |
| README claims 6 to 9 | quoted text at 144-146, 84-88, 157-166 | present at 144-151, 87-88, 153-158, 165 | yes |
| "contribut" hits | two table rows | **one** | **no** (correction 6) |
| `REALITY_CHECK_AND_BRIDGE_PLAN.md` last change | 2026-09-24 06:10 UTC | `6c762f42`, 06:10:53 UTC | yes |
| `evidence/` ignored; replay schema; `full`/`release` | gitignored; lines 7-20; exit 3 | `.gitignore:15`; lines 7-20; `refuse_dormant` exits 3. The feature lanes `exec` inside the wrapper's subshell (lines 440-448), so they still write the record | yes |
| Merge `da52b223` | second parent `d0cf478f` (2026-09-04) added the file; message does not mention it | `d0cf478f` adds only that file; 0 case-insensitive "workflow" in the message | yes |
| Merge timestamp | `15:56:10-04:00` beside the author | committer date; author date `15:55:54-04:00` | **no** (correction 9) |
| Nightly age | six days | nine days by the printed dates | **no** (correction 7) |
| Rigor table size | 135 rows | 135 `RP-` rows (RP-001 to RP-135) | yes |

## The cell calls

**CI C3 to C5: holds.** The matrix legend has C5 as "CI disabled or deleted", and
`synthesis/ci-requirements.md:59-70` shows how the pinned corpus applied it:

- frankengraphdb is C5 for "workflows `workflow_dispatch`-only (de-automated)" under an owner
  ruling, with verification on a local proof script. Its `check.yml` is still `active` in the
  workflows API today.
- frankensearch is C5 with 7 of 8 workflows `disabled_manually`, so a single remaining live
  workflow did not keep a repository out of C5.
- frankentui and franken_markdown are C5 with verification on the maintainer's private DSR.

frankengit at `dfa5bb8` has the frankengraphdb shape exactly. Seven workflows remain registered and
`active`, but they have no automatic trigger. An owner rule (AGENTS.md §12,
`NORMATIVE_PROTOCOL_CONTRACTS.md:720`) forbids relying on hosted Actions, and verification runs
through a local script. The eighth file listens on a branch that GitHub reports as deleted. C6
would fit only if the matrix classed by where the verdict lives. It does not: frankengraphdb and
frankentui also verify privately and are C5, because the de-automation is observable. The addendum
considers C6 and rejects it for that reason.

The addendum also keeps C3 at the pin. That is right, and correction 3's data does not bear on it.
GitHub does show the pinned commit red: 18 failed runs. All 18 are zero-job parse failures, so no
check ran on that commit, which is what C3 ("no pin verdict") records. Naming C2 as the rejected
alternative, in one sentence, would answer the question a reader will ask. That is optional.

**TRL 4 unchanged: defensible at Inference, Medium.** No release exists. The maintainer's own
snapshot says "Main is not currently verifiable" and that `46b922e7` does not compile. The
real-client results are revision-bound to `94a77dfb`, were not run, and are correctly labelled as
maintainer claims. TRL 5 needs integrated components validated in a relevant environment, and
nothing new shows that. I would not move it either way.

**Re-pin counts: arithmetically right.** I parsed the 44 matrix rows of `synthesis/00-overview.md`
and got C1 2, C2 11, C3 6, C4 11, C5 8, C6 6. The six C3 rows are asupersync, franken_manim,
franken_networkx, franken_remote, franken_snowflake, and frankengit. Moving frankengit gives C3 5
and C5 9, still 44 in total. The franken_code_browser re-check moves only release classes, so the
two re-checks do not interact.

The other cells hold. The ring stays Explore. License, bus factor, and release class are unchanged,
each with Tier 1 or API evidence that I reproduced (see the table).

## METHOD compliance (updates/METHOD.md rules 1-7)

| Rule | Finding |
|---|---|
| 1. Packets and synthesis stay as pinned | Holds. `git show fbeccd9 --stat` touches `site/briefs/frankengit.html` (an "Updated since the pin" note), `site/feed.xml`, `site/updates/index.html`, `updates/METHOD.md` (one index line), and the addendum. Nothing under `packets/` or `synthesis/` was edited. |
| 3. Own pin, full hash and commit date; the HEAD not read is named | Holds. `dfa5bb861e1f08802c72d33e96796a1aad9d5d06`, 2026-09-24 18:10:51 UTC, was HEAD when read at 18:31 UTC. The earlier commits seen are named. HEAD then moved inside the stated window (see "After the re-check"). |
| 3. §1 tiers and §4.3 statuses; what was not done | Holds. The tier legend maps each flavor, including the new [Executed], to a tier. Every status is a §4.3 value with a qualifier. "Not done" and "Limitations" are explicit. |
| 4. Every cell gets a line, "unchanged" said aloud | Holds for all six cells, plus no-contribution, validation, and reproduction; "What did not change" states the unchanged ones. |
| 5. Re-pin counts stated, published counts left alone | Holds (C3 6 to 5, C5 8 to 9). |
| 6. Maintainer claims labelled | Holds. The removal commit message, the policy documents, and README claims 7-9 are [Maintainer claim]. Claim 3 splits Executed from Maintainer claim correctly. |
| 7. Scratch out of the tree, hashes quoted | Holds. Four hashes are quoted, and the checker-output hash reproduces. |
| Emails | None in the addendum (no `@` in the file). |

## RP-136

**A real practice, not a duplicate, but the row as written would fail a gate (correction 10).**

The practice exists and can be copied. `check_workflows` (`main.rs:1412-1466` at `dfa5bb8`) fails
any workflow file that does any of the following:

- lacks `./scripts/verify.sh`;
- lacks `workflow_dispatch`;
- names one of 13 automatic triggers;
- uses an action not pinned to a 40-hex SHA.

The rule it enforces is written down in two places: AGENTS.md §12 and
`NORMATIVE_PROTOCOL_CONTRACTS.md:720`. The quoted format string is accurate: it is on
`main.rs:1430`.

It is not a duplicate. I searched all 135 rows for workflow, lint, policy, and delegation practices.
RP-003 (SHA pins) and RP-005 (token permissions) each cover one rule, and RP-073 covers contribution
checks. RP-021, which puts expensive jobs behind an explicit trigger, is the nearest in spirit, but
it gates jobs rather than linting files. No row lints the workflow set against a declared policy.
Name RP-021 in the dedupe note.

Three suggestions for the row, not required:

- (a) Carry this caveat with the row. The delegation test is a substring match
  (`text.contains("./scripts/verify.sh")`, `main.rs:1428`), so it proves the call is present, not
  that nothing else runs. `source-snapshot.yml` passes while also archiving and uploading the
  source. The policy clause "must not contain unique correctness or release logic" is not enforced
  by the checker.
- (b) In `our_proof`, "delegation to `bun run verify`" would fail our own `triage.yml`, which runs
  only `node .github/scripts/triage-ack.mjs`. `verify.yml`, `deploy.yml`, and `watch.yml` do run
  `bun run verify`. "Delegation to a repository script" fits all four tracked workflows. The rest
  of `our_proof` checks out: no gate in `verify-site.sh` reads `.github/workflows`, and our tracked
  workflows are SHA-pinned with `permissions` blocks.
- (c) The RP-099 and RP-097 evidence notes are accurate as far as I checked (`verify.sh:7-20`;
  README line 146).

## After the re-check (not a finding)

At 19:07:56 UTC, `main` was `d6764e73` (committed 18:59:31 UTC), two commits after `dfa5bb8`. The
other was `b8e5f8ad`, committed 18:40:54 UTC. Both are by Jeffrey Emanuel, and neither touches
`.github` or `LICENSE`. Total runs were still 7,204, the newest still `2026-09-22T18:11:29Z`, and
releases and tags were still 0. The checker built from `dfa5bb8` source returns exit 1 at
`d6764e73`, and its output is byte-identical to its output at `dfa5bb8` (same SHA-256), so the
card's "fails at today's HEAD" still holds. No cell moves.

## Notes, not corrections

- (a) The addendum's API-derived statements are tiered [External]. RULEBOOK §1 also allows
  [Verified] for "an API response". The addendum's choice is the corpus convention and is the
  conservative one, so it is not a defect.
- (b) `check_workflows` has been unchanged since 2026-08-20. Its helper `is_hosted_trigger_line`,
  which holds the 13-trigger list, last changed on 2026-08-22 (`82e7aeaa`). Both dates are before
  every tree the addendum ran the checker on, so the Limitations argument stands. Naming the
  helper's date would make that sentence exact.

## Not done by me

I did not recount claim 7 (the maintainer's "163 commits ... 115" count), because its matching rule
is not published. I did not re-read `Cargo.lock`, the unsafe or crate counts, or the Lean lane,
which the addendum also leaves unchecked. I ran no web search for independent validation. I did not
run `scripts/verify.sh`, any cargo command, or the `constitution` lane. I compiled the checker with
`rustc +nightly --edition 2024 -O` (nightly 2026-08-22, the same toolchain family as the author's).
The binary hash differs from the addendum's because the build flags and host differ. The checker
output hashes are the comparable figure, and they match.

## Scratch

Scratch location: `~/.local/state/zeststream/scratch/control-plane/franken-lead/v12/ReviewFrankengit/`.
The clone and all downloads were deleted after these hashes were taken (SHA-256):

- run history JSONL (7,204 records):
  `feac49648e5308452eb9cff9412366366736801163bb5cfb5429dc8cccee439d`
- trigger parse at the pin:
  `2ff69c5b6b28ccfe931e9a4d6c5cada6e7a7cf43deecfdae1d0375a5e0d968b5`
- `53776f9b` file list: `a1bdeaa0f608e2795bea1873278f41e124935b8899a93bbc53d8de4873394030`
- checker output at `dfa5bb8` and at `d6764e73`:
  `149cf1af5825a00859cb1fba1d6f6f8aed6ffb2f0a5022dc86f19769a191129b`
- checker binary: `36ee49a730136fe69156e009e13d9aa8a29d44a8b1a80b7c7d3e39747c6a14b9`
- checker source `main.rs`: `447fa1ec0625c1097a2a30973cc5071cac05f9b19024a77bcb52c73649d806f7`
