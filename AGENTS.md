# AGENTS.md — franken-research

> Operating instructions for AI agents working in this repo. Project law
> lives in [RULEBOOK.md](RULEBOOK.md) (assessment protocol) and
> [docs/PIPELINE.md](docs/PIPELINE.md) (how changes reach the site); this
> file only adds the cross-mission operating discipline.

## Merge discipline

Every change in this repo follows the verify-then-merge protocol in
[docs/MERGE-PROTOCOL.md](docs/MERGE-PROTOCOL.md): full gate battery green
(`TMPDIR=/Users/josh/.cache/fr-tmp/ bun run verify`), independent
verification by a different agent before any bead closes, honest
verification-level tokens in commit subjects, auto-merge only inside those
gates, and DECISION beads never merge-gated around.

## Beads

- Task graph is native br/bv: `br ... --json` always; `bv --robot-*` for
  triage, never bare `bv`. Bead commands run only in this main checkout.
- A bead's status field is a claim, not a fact: the implementer hands off
  with evidence and the `needs-verification` label; an independent verifier
  closes it.
- No building cruft: every run ends as a commit on main, an open PR, or a
  clean tree.
