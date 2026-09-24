# Agent stack verdicts: method

This is the protocol for the `stack/` layer: one verdict per agentic-technology type, answering a builder's question the 44 FrankenSuite packets cannot: **for this part of the agent stack, what should you adopt, what should you copy, and when is building from scratch justified?** It extends [RULEBOOK.md](../RULEBOOK.md) to repositories outside the FrankenSuite; where the two disagree, the Rulebook's evidence rules win.

## Scope and inputs

- **Types:** the 21 in [ecosystem/pickup/INTENT.md](../ecosystem/pickup/INTENT.md). One verdict file per type: `stack/<slug>.md`, where `<slug>` is the suffix of `ecosystem/pickup/pickup-<slug>.md`.
- **Evidence:** the type's companion `ecosystem/pickup/pickup-<slug>.md` and evidence pack `ecosystem/pickup/_evidence/<slug>.md` (repositories checked against the GitHub API on 2026-09-23), plus the FrankenSuite corpus (`packets/`, `synthesis/`) where a FrankenSuite project works in the same space.
- **Fresh checks are allowed, read-only:** a GitHub API response or live page read by the author is [Verified] per RULEBOOK.md:29, and the bullet must state its date and the exact URL or command. A workflow file that exists is [Verified] for "this file exists" and [Maintainer claim] for "this check passes"; [CI-observed] only when a live CI page shows the run (RULEBOOK.md:30). Never relabel an analyst's own read as [External]. No clones, no installs, no benchmarks run for this layer.

## The verdict vocabulary

Exactly one of:

| Verdict | Use it when | The bar |
|---|---|---|
| **Adopt** | A maintained incumbent covers the need and building would recreate it. | Named incumbent(s) with recent activity in the evidence, and no hard constraint it fails. |
| **Adopt and wrap** | Adopt the incumbent, but the evidence shows a verification gap the adopter must close (conformance, nondeterminism, safety, supply chain). | Name the gap, the evidence for it, and the wrapper gates. |
| **Build clean-room** | No incumbent meets a named hard constraint (license, determinism, safety boundary, runtime, footprint). | The strongest bar. The failed constraint is a fact stated in the cited line, not a label from this table: license means a quoted license clause; determinism means a quoted nondeterministic result or an admission of one. "We did not run it", "stars are low", and "the field is moving" are not failed constraints. The file must also name the less-building alternative it rejected (front-matter `rejected_alternative`) and cite the line that rules it out. |
| **Watch** | Evidence is too thin, or the field moves faster than a commitment would survive (spec churn, no conformance suite). | Name what would change the verdict and when to revisit. |

**Do not recreate by default.** Building from scratch is the most expensive verdict and the one this layer exists to prevent when it is not warranted. Enthusiasm for a rewrite is not evidence.

**Deciding between verdicts: apply this order and stop at the first that fits.**

1. **Watch** if the incumbent you would adopt was verified only for existence or activity (no process evidence: its CI, tests, or conformance were not read), or if the field's spec changes faster than a conformance suite tracks it and the pack says so.
2. **Adopt and wrap** if a cited line states a gap the adopter must close: a conformance harness that was not run, an expected-failures baseline, nondeterminism, unaudited CI, a supply-chain risk. Name the wrapper gates.
3. **Adopt** otherwise, when a maintained incumbent covers the need.
4. **Build clean-room** only when the bar in the table is met.

## File format (checked by Gate K)

```
---
type: <slug>
title: <plain-language name>
group: <Model serving | Orchestration | Tools and environment | Memory and retrieval | Eval and safety | Training and voice>
verdict: <Adopt | Adopt and wrap | Build clean-room | Watch>
confidence: <High | Medium | Low>
evidence_date: <date of the newest citation or fresh check in this file>
rejected_alternative: <required for Build clean-room only: the less-building verdict rejected, with (path:line "quote")>
author: <agent or person id>
reviewed_by: <a different agent or person id>
review_date: <YYYY-MM-DD>
---

## Bottom line
Two or three plain sentences a builder can act on. The first sentence names the verdict and says it is an inference, with its confidence, e.g. "Inference, medium confidence: adopt the official SDK and do not write your own." No jargon without a gloss.

## Adopt, do not rebuild
- **<owner/repo>**: what it covers and why rebuilding it would be waste. [Tier] (<path>:<line> "<verbatim quote from that line>")

## Copy these practices
- **<practice>**: what to copy, concretely. Starter kit: <A2 | B6 | none>. [Tier] (<path>:<line> "<verbatim quote>")

## Build only if
- <the hard constraint that would justify building, and the evidence it is real for some builders> [Tier] (<path>:<line> "<verbatim quote>")

## Where FrankenSuite touches this
- <FrankenSuite project and what it does here, or "None of the 44 packets work in this space."> [Tier] (<path>:<line> "<verbatim quote>")

## What we cannot say
- <limits of the evidence, citing the evidence pack's caveats lines (path:line "quote")>

## Revisit when
- <the concrete event that would change the verdict>
```

## Evidence rules

1. **Every factual bullet carries a tier and at least one quoted citation** `(<repo-relative path>:<line> "<quote>")`: the quote is at least 20 characters, copied from that line (Markdown `*` and backticks and runs of whitespace are ignored when matching), and it must contain the fact the bullet asserts. Several citations may share one pair of parentheses, separated by `;`. Gate K fails if the file or line is missing or the quote is not on the line; the reviewer fails a quote that is on the line but does not carry the claim. A line that merely exists is not support.
2. **Tiers** are exactly the Rulebook's five: [Verified], [CI-observed], [Maintainer claim], [External], [Inference]. Any other tier token (for example the companions' T0–T3) is rejected by Gate K. The verdict itself is always [Inference].
3. **Confidence:** Medium by default. High only when citations from at least two different sources agree (two lines of one evidence pack are one source; different owners or different documents count) and the pack's caveats contain nothing contrary. Low when the pack says the evidence is thin, not run, or not inspected.
4. **Stars and push dates measure activity and popularity, not quality.** Never cite them as evidence that something is good, only that it is alive and used.
5. **No rankings, no superlatives** beyond what a cited source states; no "best".
6. **"What we cannot say" is never empty and carries the pack's caveats.** When the evidence pack has a caveats or notes section, every caveat that concerns an incumbent or practice this verdict names must appear there, cited to its line. Dropping "not run" or "CI not inspected" is a review failure. Gate K requires at least one citation into the pack's caveats section when the pack has one.
7. **Withdrawn claims stay withdrawn.** A claim the companion marks WITHDRAWN cannot come back as a verdict bullet.
8. **Readers see words, not codes.** The site spells each starter-kit item by its title (from starter-kit/CHECKLIST.md), not its id.

## Independence

The author of a verdict never reviews it. A reviewer checks every citation against its line, checks the verdict against the table above, and files findings. The author fixes them. Only then does the reviewer write `reviewed_by` and `review_date`. Gate K fails if either is missing or if `reviewed_by` equals `author`.

## Rigor practices index

`stack/rigor-practices.tsv` collects the practices worth copying across the 21 evidence packs and the FrankenSuite corpus, one row each, and maps them onto the starter kit and onto this repository. Columns:

`id` (RP-NNN) · `practice` · `what_to_copy` · `areas` (slugs, or `frankensuite`, `;`-separated) · `evidenced_in` (owner/repo, `;`-separated) · `source` (`path:line`) · `source_quote` (at least 20 characters, verbatim from that line) · `checklist` (starter-kit ids like `A2;B6`, or `none`) · `our_status` (`adopted` | `candidate` | `not-applicable`) · `our_proof` (commit, file, or the reason it does not apply).

Gate K fails if a `source` line does not contain its `source_quote`, or if an `adopted` row has no proof that resolves in this repository.
