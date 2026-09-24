# Re-checks after the pin

Every packet in `packets/` is frozen at one commit, its pin, read on 2026-09-22. The suite moves
faster than any reading of it, so this directory records what happened after the pins without
changing them. Rules, in [RULEBOOK.md](../RULEBOOK.md) terms:

1. **The packets and the synthesis stay as pinned.** Nothing here edits `packets/`, `synthesis/`,
   or the headline counts in `synthesis/00-overview.md` (rings, TRL spread, license, CI classes
   C1..C6, release classes R1..R3, bus factor). Those counts describe 2026-09-22. A later reading
   is a new dated file beside them, never a rewrite.
2. **A movement census comes first.** `movement-YYYY-MM-DD.tsv` lists all 44 repositories: the
   packet's pin, the default-branch HEAD, commits ahead, releases and tags since the pin, workflow
   files now, and the first line of the license now. It is read-only, uses only the GitHub API,
   and records its exact commands in its header. Missing, renamed, or archived repositories are
   recorded as such, not dropped. Its `material_change` column says whether the census evidence
   could move a master-matrix cell, and which one. Commits alone never do.
3. **An addendum is a re-check with its own pin.** `<repo>-YYYY-MM-DD.md` pins the commit it read
   (full hash and commit date) and names the HEAD it did not. It uses the Rulebook §1 tiers and
   confidence grades, the §4.3 claim statuses, and states what was not done.
4. **Every matrix cell gets a line.** For TRL, NODUS ring, license, bus factor, CI class, and
   release class, the addendum gives the value at the pin, the value at the re-check, and the tier
   and evidence for the difference or for "unchanged". Unchanged is a finding and is said out loud.
5. **Suite totals are not silently rewritten.** If a re-check would move a repo to another class,
   the addendum says what the pinned count would become under a re-pin (for example, R1 23 to 22,
   R3 15 to 16) and leaves the published count alone. A new suite-wide count needs a new dated
   synthesis, not an edit.
6. **Maintainer claims stay maintainer claims.** Release notes, distribution docs, and store
   submission states are [Maintainer claim] unless the analyst re-derived them from a primary source
   (release API, a downloaded artifact, a signature check). Anything the analyst did not run is
   labeled as not run.
7. **Scratch stays out of the tree.** Downloads used for verification are deleted after the check;
   hashes and command output are quoted instead.

## The daily loop

The census in rule 2 is now also taken every day by [`watch/watch.mjs`](../watch/README.md), run by
[`.github/workflows/watch.yml`](../.github/workflows/watch.yml) at 11:23 UTC. Each step has an
owner, and only the first one is automatic:

1. **Watch.** The run writes `watch/state.json`, `watch/census/YYYY-MM-DD.tsv` (the rule 2 columns
   for all 44), and `watch/changes/YYYY-MM-DD.json`, and commits them only if the whole gate chain
   passes. It flags events that could move a cell (a release or tag, a license SPDX or text change,
   a workflow file added or removed, archived, renamed, deleted, a pin no longer an ancestor of
   HEAD, a new `franken*` or Rust repository). It does not judge them.
2. **Issue.** For each flagged event that is new since the previous run it opens one issue,
   `[watch] <repo>: <change>`, labelled `watch` plus the event type, with before and after, API
   evidence, and the pinned matrix values the event may affect. It never reopens a closed issue; a
   changed value becomes a comment. At most 20 per run, the rest in one rollup issue.
3. **Triage.** An analyst decides whether the event could move a cell. If not, the issue is closed
   with a one-line reason. The 2026-09-24 movement census is a worked example: eight repositories
   had an event of these kinds (six workflow-file sets, one set of new tags, one first release), and
   two were judged able to move a cell (the release, and a workflow set cut from 78 files to 8).
4. **Dated re-check.** If it could, the analyst writes `<repo>-YYYY-MM-DD.md` here under rules 3 to
   6, pinned to the new commit. The packet and the published counts stay as they are.
5. **Independent review.** A separate agent session, not the author, reviews the re-check before it
   lands, as the stack verdicts are reviewed.
6. **Rigor harvest.** Any practice the re-check finds that is not yet in
   [`stack/rigor-practices.tsv`](../stack/rigor-practices.tsv) is added there with its quote.
7. **Close.** The issue is closed with links to the re-check, the review, and any rigor row.

Files here:

- [`movement-2026-09-24.tsv`](movement-2026-09-24.tsv): census of all 44, 2026-09-24 UTC.
- [`franken_code_browser-2026-09-24.md`](franken_code_browser-2026-09-24.md): re-check after the
  first release, v0.1.0.
- [`frankengit-2026-09-24.md`](frankengit-2026-09-24.md): re-check after 71 of 78 workflow files
  were removed; CI class C3 to C5 at the re-check pin.

Commit author email addresses are never recorded: this corpus redacts them (see CHANGELOG, commit 10ec830). Record author names or handles only.
