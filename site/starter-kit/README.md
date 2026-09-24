# FrankenSuite Starter Kit

The universal starting point for a new agent-built project, distilled from a
research program that assessed 44 repositories of the FrankenSuite
(Rust clean-room reimplementations, each with its own planning and honesty
machinery). The kit keeps what survived contact with reality across the
suite and drops what only worked once.

Plain Markdown and POSIX shell. Zero dependencies on the FrankenSuite or on
any of its repositories. Everything traces to observed evidence —
see `REFERENCES.md` for the mechanism-by-mechanism map.

## The two-phase model

**Phase A — Planning: is the plan execution-ready?** Before agents are set
free, the plan must be complete, reviewed, and machine-checked. Items A1–A14
of `CHECKLIST.md`. The planning packet (`templates/planning-packet.md`) is the
contract; `scripts/check-readiness.sh` is the machine that checks it. Missing
any field means NOT READY.

**Phase B — Beads/execution: is execution staying honest?** Once work starts,
the beads graph is the executable form of the plan and the honesty machinery
runs continuously: claim discipline, the negative-evidence ledger, demotion
rules, and a pre-commit hook that proves its own teeth. Items B1–B14.

The phase boundary is the execution sign-off (A14/checklist item, packet
section 12). No agent executes an unsigned packet.

## 5-minute quickstart

```sh
# 1. Install the kit into a NEW project directory (a repo that already has
#    AGENTS.md or a pre-commit hook: see "Adopting in an existing repo" below;
#    init.sh replaces .git/hooks/pre-commit):
sh /path/to/starter-kit/scripts/init.sh /path/to/my-project
#    (runs `git init` for you unless KIT_NO_GIT=1 — the honesty hook needs a
#    repo to live in. Set your git identity first or the first commit fails:
#    git config --global user.name "Your Name"; git config --global user.email "you@example.com")

# 2. Go there. The installer printed your next steps; the short version:
cd /path/to/my-project

# 3. Fill the planning packet — the WORKING copy, not the template:
$EDITOR docs/planning/packet.md
#    (templates/ holds read-only reference copies. Each section's guidance
#    names the machine-checkable vocabulary check-readiness.sh requires.)

# 4. Machine-check it (NOT READY until every section is real prose):
./scripts/check-readiness.sh

# 5. Build your first proofs, THEN register claims:
$EDITOR registries/claims.tsv   # set enforce=yes once the proof exists
#    readme_pattern must match README prose EXACTLY (case, line breaks).

# 6. Write the README LAST: the claim gate blocks any non-empty README
#    until at least one claim is enforced with a real proof (B6).

# 7. Make your first commit — the pre-commit hook self-tests with a canary
#    false claim before it checks anything real:
git add -A && git commit -m "chore: initialize with starter kit"

# 8. Work Phase A of docs/CHECKLIST.md, closing the seeded beads with
#    cited evidence. JSONL fallback: set "status":"closed",
#    "closed_at":"<UTC timestamp>", "close_reason":"<evidence citation>"
#    on the bead's line in .beads/issues.jsonl. When Phase A is green,
#    sign the packet (§12) and start Phase B.
```

What `init.sh` created for you: `docs/planning/`, `docs/evidence/`
(negative-evidence ledger + demotion rules), `docs/definition-of-done.md`,
`AGENTS.md` (the 12 forbidden patterns, vendored), `registries/claims.tsv`,
`.beads/` (28 checklist beads seeded as JSONL — no beads CLI required),
`scripts/` (the two checkers), `templates/` (read-only reference copies of
every working file — edit the installed copies, never these),
`.github/workflows/kit-gates.yml` (the CI backstop that re-runs every gate
where `git commit --no-verify` cannot reach), and the pre-commit honesty
gate: tracked source of truth at `.githooks/pre-commit`, live installed copy
at `.git/hooks/pre-commit` (the one git actually executes). It self-tests
with a canary false claim before it checks anything real. It deliberately
does NOT create a `README.md` — write yours last (step 6).

## Adopting in an existing repo

Do not run `init.sh` here. Copy the parts by hand, from the repo's root
(`KIT` is the path to this `starter-kit/` folder):

```sh
# 1. Copy the checkers and templates (cp -n never overwrites your files):
mkdir -p docs/planning registries scripts
cp -n "$KIT/CHECKLIST.md" docs/CHECKLIST.md
cp -n "$KIT/templates/planning-packet.md" docs/planning/packet.md
cp -n "$KIT/templates/claims.tsv" registries/claims.tsv
cp -n "$KIT/scripts/check-readiness.sh" "$KIT/scripts/check-claim-discipline.sh" scripts/

# 2. Add one tab-separated row to registries/claims.tsv for a sentence your
#    README already makes and a file that proves it (enforce=yes), then:
sh scripts/check-claim-discipline.sh registries/claims.tsv README.md   # must PASS before step 3
sh scripts/check-readiness.sh docs/planning/packet.md                  # NOT READY until you fill it

# 3. Install the hook only if nothing else owns your hooks (both print nothing):
git config --get core.hooksPath; ls .git/hooks/pre-commit
cp "$KIT/scripts/hooks/pre-commit" .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#    Already have a hook? Keep it and append the claim check instead:
#    echo 'sh scripts/check-claim-discipline.sh registries/claims.tsv README.md || exit 1' >> .git/hooks/pre-commit
```

Add `templates/kit-gates.yml` to `.github/workflows/` only once the packet
reports READY: its readiness step fails CI until then.

## What's inside

| Path | What it is |
|---|---|
| `README.md` | this file |
| `CHECKLIST.md` | the 28-item two-phase checklist; every item has an id, what/why, observable done criteria, verification method, origin, and class |
| `REFERENCES.md` | every mechanism mapped to originating repo + exact file path; what was borrowed, what was changed |
| `scripts/init.sh` | the single starting command |
| `scripts/check-readiness.sh` | machine-checks the planning packet; missing field ⇒ NOT READY |
| `scripts/check-claim-discipline.sh` | cross-checks README claims against proof artifacts |
| `.githooks/pre-commit` | the honesty gate, tracked source of truth — edit this copy (init.sh reinstalls the live copy) |
| `.git/hooks/pre-commit` | the live installed copy — this is what git actually executes |
| `scripts/checklist2beads.awk` | converts the checklist into the beads JSONL seed |
| `AGENTS.md` | agent instructions with the 12 forbidden patterns (installed from `templates/agents.md`) |
| `docs/definition-of-done.md` | the Definition of Done (installed from `templates/definition-of-done.md`) |
| `templates/planning-packet.md` | REFERENCE COPY of the 12-section packet with machine-checkable markers — edit `docs/planning/packet.md` |
| `templates/claims.tsv` | REFERENCE COPY of the claim registry — edit `registries/claims.tsv` |
| `templates/agents.md` | REFERENCE COPY of the agent instructions — edit `AGENTS.md` |
| `templates/definition-of-done.md` | REFERENCE COPY of the DoD — edit `docs/definition-of-done.md` |
| `templates/kit-gates.yml` | CI workflow template: re-runs the readiness and claim-discipline gates on every push — the backstop `--no-verify` cannot reach; commented toolchain (fmt/lint/test) steps to fill per language |
| `templates/negative-evidence-entry.md` | ledger row schema with one filled real-suite example |
| `templates/bead-schema.md` | bead field schema with one example bead |
| `templates/demotion-rules.md` | starter demotion rules, mechanical vs procedural marked |

## Design principles

- **Executable beats prose.** The beads graph is the plan; documents are the rationale of record.
- **Mechanical where cheap, doctrine where judgment lives.** Four checklist items are enforced by scripts — B5/B6 on every commit, A3 at the phase gate (blocking in CI, advisory in the hook), A5 at init plus per-commit row linting; the rest are conventions with named verifiers. The kit never pretends a script exists where the suite only had a habit.
- **Local gates are advisory; CI is the backstop.** `git commit --no-verify` bypasses the pre-commit hook by git's design. The kit names the hatch instead of hiding it (CHECKLIST.md B5), and the CI workflow re-runs every gate where the hatch cannot reach.
- **Nothing invented.** Every checklist item and template field traces to observed suite evidence. Where the evidence is thin, the item is marked PROVISIONAL, not hidden.
- **Gates must have teeth.** The pre-commit hook fails a canary false claim before it checks anything real — and fails closed if its checker is missing; a gate that cannot fail is decoration.

## The one rule

"A step you can satisfy by believing you did it is not a step."
— frankentui AGENTS.md

## Changes since the 2026-09-22 import

- 2026-09-24: `scripts/check-claim-discipline.sh` splits rows with `awk -F'\t'`. The imported version split on `\001`, which macOS `/bin/sh` (bash 3.2) cannot do, so it read zero rows there and the hook blocked every commit in a repo with a README. Checked by test on a clone of dtolnay/itoa under bash 3.2, dash, zsh 5.9 and bash 5.3: after the change all four pass a real enforced claim and fail a violated one; before it, bash 3.2 read no rows. Not checked: Windows shells and busybox sh.
- 2026-09-24: the claim checker now fails, and names the row, when an `enforce=yes` row's `readme_pattern` is not in the README, and fails when a claims file passed as an argument does not exist. This tightens the franken_markdown behaviour for enforced rows, which only warned and left the row unchecked: the gate stayed green while an enforced claim went unverified, and a hook pointing at a wrong path passed silently. Rows with `enforce=no` are still skipped, and with no argument and no `registries/claims.tsv` there is still nothing to check. Checked by test on the same itoa clone, same four shells: a matching row passes, and an unmatched row, a violated row and a missing file each fail naming the plant; before the change the unmatched row and the missing file exited 0. Not checked: Windows shells and busybox sh.
