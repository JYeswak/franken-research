# Candidates

A candidate is a public project that might get an assessment written with the same [Rulebook](../RULEBOOK.md) and [starter kit](../starter-kit/) as the pinned 44. Candidates come from two places:

- the weekly Rust discovery sweep ([`watch/discover.mjs`](../watch/discover.mjs), described in [`watch/discovery/README.md`](../watch/discovery/README.md)), which opens one rollup issue a week titled `[discovery] Rust candidates, week <YYYY-Www>`;
- the [suggest-a-project form](../.github/ISSUE_TEMPLATE/suggest-project.yml), which opens an issue titled `[candidate] owner/repo`.

Both carry the `candidate` label. Being listed is not a finding about the project. Nothing on a candidate list has been assessed.

## Screening rule

A repository passes screening when every predicate below is true. Each is checkable from the GitHub API or a clone. The sweep checks all seven from the API, and the analyst confirms each by hand before accepting. The sweep sees only GitHub's primary language, so a Rust port or tool whose largest language is something else reaches the list only as a suggestion.

1. **Public.** The repository is public, and anyone can clone it without an account or agreement.
2. **Rust.** GitHub's primary language for the repository is Rust, or the project is a Rust port or a Rust tool (for a suggestion, say which in the issue).
3. **Active.** Its last push is within the 30 days before the check.
4. **Agent-built signal.** At least one of:
   - an `AGENTS.md` or `CLAUDE.md` file at the repository root;
   - a `Co-Authored-By:` trailer naming Claude, Codex, Gemini, Copilot, Cursor, Devin, or another coding agent in at least one of the last 30 commits on the default branch;
   - an explicit statement in the README that coding agents built it ("built with Claude Code", "written by AI agents").
5. **Not a fork.** GitHub reports `fork: false`.
6. **Not already covered.** It is not one of the pinned 44, not in a cohort under `cohorts/`, not named by an earlier `candidate` issue, and not listed in an earlier week's `watch/discovery/<week>.json`.
7. **Not Dicklesworthstone's.** The owner is not `Dicklesworthstone`. The [daily watch](../watch/README.md) already covers every public repository that account owns. It flags a new one as a candidate when it is not a fork or archived and its name starts with `franken` or ends with `_bend`, its primary language is Rust, or its description reads like a port (`port of`, `rewrite of`, `law-proved`, `byte-for-byte`, `clean-room`, `in rust`). That flag only opens a watch issue for triage; it is not a screening result, and it does not change the rule on this page.

The sweep also narrows its search to repositories created within the last 180 days with at least 25 stars, and checks only the 40 most-starred that survive predicates 5 to 7. Those are limits on what the sweep looks at, not part of the rule: a suggestion outside them can still pass.

The signals in predicate 4 are cheap heuristics. A trailer can be added by an editor plugin to a mostly human-written commit, and a root `CLAUDE.md` can be a one-line stub. They make a project worth a look; the packet decides what it is.

## What happens to a candidate

1. **Triage.** The analyst checks each row of the weekly rollup, or the suggestion, against the seven predicates and replies on the issue. A rejection names the predicate that failed. A rollup row that is accepted gets its own `[candidate] owner/repo` issue so it can be tracked and closed on its own. The rollup is closed when every row is accepted or rejected.
2. **Packet.** An accepted candidate gets a packet written by one agent session with the same Rulebook and starter kit as the pinned 44, pinned to a commit and dated.
3. **Review.** A separate agent session reviews the packet before it lands, the same split used for dated re-checks in [`updates/`](../updates/METHOD.md).
4. **Landing.** Reviewed packets land together as a dated cohort, for example `cohorts/2026-10/`, and appear on the [Beyond page](https://fr.zeststream.ai/beyond/). The candidate issue is closed with links to the packet and the review.

A cohort never changes the pinned 44. The 44 packets, their pins, the master matrix, and every count published for them stay as they are; a cohort is reported beside them with its own date and its own counts.
