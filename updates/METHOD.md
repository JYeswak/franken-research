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

Files here:

- [`movement-2026-09-24.tsv`](movement-2026-09-24.tsv): census of all 44, 2026-09-24 UTC.
- [`franken_code_browser-2026-09-24.md`](franken_code_browser-2026-09-24.md): re-check after the
  first release, v0.1.0.

Commit author email addresses are never recorded: this corpus redacts them (see CHANGELOG, commit bbc1bda). Record author names or handles only.
