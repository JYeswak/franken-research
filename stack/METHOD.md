# Agent stack verdicts: method

This is the protocol for the `stack/` layer: one verdict per agentic-technology type, answering a builder's question the 44 FrankenSuite packets cannot: **for this part of the agent stack, what should you adopt, what should you copy, and when is building from scratch justified?** It extends [RULEBOOK.md](../RULEBOOK.md) to repositories outside the FrankenSuite; where the two disagree, the Rulebook's evidence rules win.

## Scope and inputs

- **Types:** the 21 in [ecosystem/pickup/INTENT.md](../ecosystem/pickup/INTENT.md). One verdict file per type: `stack/<slug>.md`, where `<slug>` is the suffix of `ecosystem/pickup/pickup-<slug>.md`.
- **Evidence:** the type's companion `ecosystem/pickup/pickup-<slug>.md` and evidence pack `ecosystem/pickup/_evidence/<slug>.md` (repositories checked against the GitHub API on 2026-09-23), plus the FrankenSuite corpus (`packets/`, `synthesis/`) where a FrankenSuite project works in the same space.
- **Fresh checks are allowed, read-only:** a GitHub API or web read made while writing a verdict is tier [External] and must state its date and the exact URL or command in the bullet. No clones, no installs, no benchmarks run for this layer.

## The verdict vocabulary

Exactly one of:

| Verdict | Use it when | The bar |
|---|---|---|
| **Adopt** | A maintained incumbent covers the need and building would recreate it. | Named incumbent(s) with recent activity in the evidence, and no hard constraint it fails. |
| **Adopt and wrap** | Adopt the incumbent, but the evidence shows a verification gap the adopter must close (conformance, nondeterminism, safety, supply chain). | Name the gap, the evidence for it, and the wrapper gates. |
| **Build clean-room** | No incumbent meets a named hard constraint (license, determinism, safety boundary, runtime, footprint). | The strongest bar: the failed constraint must be evidenced, not assumed, and the companion's charter is the starting point. |
| **Watch** | Evidence is too thin, or the field moves faster than a commitment would survive (spec churn, no conformance suite). | Name what would change the verdict and when to revisit. |

**Do not recreate by default.** Building from scratch is the most expensive verdict and the one this layer exists to prevent when it is not warranted. When the evidence supports two verdicts, choose the one that builds less. Enthusiasm for a rewrite is not evidence.

## File format (checked by Gate K)

```
---
type: <slug>
title: <plain-language name>
group: <Model serving | Orchestration | Tools and environment | Memory and retrieval | Eval and safety | Training and voice>
verdict: <Adopt | Adopt and wrap | Build clean-room | Watch>
confidence: <High | Medium | Low>
evidence_date: 2026-09-23
author: <agent or person id>
reviewed_by: <a different agent or person id>
review_date: <YYYY-MM-DD>
---

## Bottom line
Two or three plain sentences a builder can act on. No jargon without a gloss.

## Adopt, do not rebuild
- **<owner/repo>**: what it covers and why rebuilding it would be waste. [Tier] (<path>:<line>)

## Copy these practices
- **<practice>**: what to copy, concretely. Starter kit: <A2 | B6 | none>. [Tier] (<path>:<line>)

## Build only if
- <the hard constraint that would justify building, and the evidence it is real for some builders> [Tier] (<path>:<line>)

## Where FrankenSuite touches this
- <FrankenSuite project and what it does here, or "None of the 44 packets work in this space."> [Tier] (<path>:<line>)

## What we cannot say
- <limits of the evidence: unverified repos, thin process evidence, stars measuring popularity not quality>

## Revisit when
- <the concrete event that would change the verdict>
```

## Evidence rules

1. **Every factual bullet carries a tier and at least one citation** `(<repo-relative path>:<line>)` whose line exists and supports the bullet. Gate K fails on a citation to a missing file or line.
2. **Tiers** are the Rulebook's: [Verified], [CI-observed], [Maintainer claim], [External], [Inference]. The verdict itself is always [Inference].
3. **Confidence:** Medium by default. High needs at least two independent evidence rows that agree and no contrary row. Low when the pack itself flags thin evidence.
4. **Stars and push dates measure activity and popularity, not quality.** Never cite them as evidence that something is good, only that it is alive and used.
5. **No rankings, no superlatives** beyond what a cited source states; no "best".
6. **"What we cannot say" is never empty.** If the evidence pack has a caveats section, it is the starting point.

## Independence

The author of a verdict never reviews it. A reviewer checks every citation against its line, checks the verdict against the table above, and files findings. The author fixes them. Only then does the reviewer write `reviewed_by` and `review_date`. Gate K fails if either is missing or if `reviewed_by` equals `author`.

## Rigor practices index

`stack/rigor-practices.tsv` collects the practices worth copying across the 21 evidence packs and the FrankenSuite corpus, one row each, and maps them onto the starter kit and onto this repository. Columns:

`id` (RP-NNN) · `practice` · `what_to_copy` · `areas` (slugs, or `frankensuite`, `;`-separated) · `evidenced_in` (owner/repo, `;`-separated) · `source` (`path:line`) · `source_quote` (at least 20 characters, verbatim from that line) · `checklist` (starter-kit ids like `A2;B6`, or `none`) · `our_status` (`adopted` | `candidate` | `not-applicable`) · `our_proof` (commit, file, or the reason it does not apply).

Gate K fails if a `source` line does not contain its `source_quote`, or if an `adopted` row has no proof that resolves in this repository.
