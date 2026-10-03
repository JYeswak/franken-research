# Verify-then-merge protocol

**Status:** Adopted 2026-10-03 (bead fr-i5f). **Scope:** every repository agents
touch on Josh's behalf — currently `franken-research` and
`skill-library-growth`, and any repo an agent mission is pointed at next.
**Origin:** franken-research ran this implicitly (RULEBOOK §8 QA checklist,
`docs/PIPELINE.md` independent-review step); the skill library adopted the same
gates after unverified rewrites destroyed original skill content (2026-09-30).
Written once here so both missions — and the next one — inherit it instead of
re-deriving it.

## The protocol

A change merges (lands on `main`, closes its bead, or is admitted to the
library — the mission's equivalent of merge) only when **all** of these hold:

1. **Full gate battery green on the exact change.** The repo's own verifier,
   run on the exact bytes being merged, exits clean:
   - franken-research: `TMPDIR=/Users/josh/.cache/fr-tmp/ bun run verify`
     plus the repo's claim-discipline / honesty hooks.
   - skill-library-growth: `jsm validate`, `ms lint`, SkillSpector /
     SkillEvaluator as applicable, `br dep cycles` empty, frozen goldens
     untouched unless human-reviewed.
   A gate that fails on unrelated pre-existing breakage is reported as such —
   never silently treated as green.
2. **Independent verification by a different agent.** The implementer never
   closes their own work. A second agent re-runs the checks (or the
   /beads-compliance-and-completion-verification grade) against the acceptance
   criteria and only then closes the bead / approves the merge. An
   implementer's "done" is a claim, not a fact.
3. **Commit subjects carry an honest verification-level token** (`[test]`,
   `[selftest]`, `[pending]`, …) stating what actually ran. A subject may
   never claim a level the run did not reach.
4. **Auto-merge only inside these gates.** Automation (nightly drivers,
   fleet runners, gh-aw candidates) may merge solely when 1–3 are already
   satisfied for that exact change. Anything else stays open for Josh.
5. **DECISION beads are never merge-gated around.** Work parked for Josh's
   decision is not implemented, merged, or closed by agents to make a queue
   look smaller.
6. **No gate is ever weakened to land a change.** A genuinely defective gate
   is fixed through the evidence standard, with the win/lose split published.
   `--no-verify` and equivalent bypasses are forbidden (see the 12 forbidden
   reward-hacking patterns in skill-library-growth `AGENTS.md` Rule 0.5).

## Receipts — the protocol in force

**franken-research, merge that followed it:** PR #20
"[research-candidate] Top-10 Rust repositories (2026-W40)" merged
2026-10-02T15:53:10Z only after sandbox-green execution, independent
evaluator green, `bun run verify` green, and CI green on the exact commit.
The seeded-candidate rehearsals PRs #22–#24 (2026-10-03) merged the same way.

**franken-research, gate-red that did not merge/close:** bead fr-fm5 received
independent compliance grades of PARTIAL 735/1000 and 795/1000; the bead was
bounced for repair (commits b07a351, e604d29) instead of closing. Separately,
PR #21 was closed unmerged when its merge preconditions failed, and only its
fixed-driver rerun (PR #22) merged.

**skill-library-growth, merges that followed it:** main carries the
implementer/verifier split as commit subjects — e.g. `87a4881` "close d12:
domain-currency sweep verified (independent verifier)" and `2748438`
"close m42: independent verification pass (42/44, zero false-passes)": the
closing commit is authored as a verification act, distinct from the
implementation commits it closes.

**skill-library-growth, gate-red that did not merge:** candidate
regex-engineering was held at needs-review in `9c1859f` ("gauntlet: gates 0-1
(registered; needs-review desc 604>500)") because its description exceeded
the 500-char gate; it was admitted (`b269600`) only after the gate passed
and Josh decided ADMIT as-is.

## Amendment

Changes to this protocol require Josh's approval and a note here with date
and reason. Mission AGENTS.md files reference this document; they do not
restate or fork it.
