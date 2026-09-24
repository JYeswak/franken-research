<!-- Review record, published as written. Adversarial review of stack/METHOD.md v1 by control-plane pane 2; all 8 findings adopted in METHOD v2 (6d03cc1). Scratch paths refer to the reviewer's machine. -->

# Adversarial review of stack/METHOD.md

Read at commit `d34f5ce` (working tree byte-identical to `git show d34f5ce:stack/METHOD.md`). Compared with `RULEBOOK.md` §1, `ecosystem/pickup/INTENT.md`, `pickup-mcp.md`, `_evidence/mcp.md`, and `starter-kit/CHECKLIST.md` headings. No files edited.

Ranked by how easily a wrong verdict ships. Eight findings. The rest of the file is usable.

## 1. Gate K does not check that the cited line supports the bullet

**METHOD.md:63.** "Every factual bullet carries a tier and at least one citation whose line exists and supports the bullet. Gate K fails on a citation to a missing file or line."

The support half is prose. The gate half is existence. Line 80 already knows the difference: a rigor-practices row fails unless `source_quote` (20 characters, verbatim) is on that line. Verdict bullets have no quote.

**Failure.** An author writes "The official conformance harness is mature enough to be the sole protocol gate" and cites `_evidence/mcp.md:13`. That line exists. It says the conformance repo has 127 stars and "authority comes from being wired into both official SDKs' CI." It does not say the harness is mature. `pickup-mcp.md:98` already withdrew that claim (`CLAIM-12`, "the evidence author never executed it"). Gate K still passes the bullet. The verdict can be Adopt on a citation that does not carry it.

**Replace line 63 with:**

Every factual bullet carries a Rulebook tier and a citation `(path:line)` plus a verbatim quote of at least 20 characters from that line. Gate K fails if the file or line is missing, if the quote is not on that line, or if the quote does not contain the fact the bullet asserts. A line that merely exists is not support. Withdrawn claims in the companion (status WITHDRAWN) cannot be reintroduced as verdict bullets.

## 2. A hard constraint can be named without the cited line stating it

**METHOD.md:19 and :22.** Build clean-room requires a "named hard constraint (license, determinism, safety boundary, runtime, footprint)" that "must be evidenced, not assumed." Line 22 says when two verdicts are supported, build less. Nothing makes the author write the less-building alternative, and nothing checks that the cited line states the constraint.

**Failure.** `_evidence/mcp.md` has no license text. An author still writes "Build clean-room: the incumbent license forbids benchmarking" and cites `_evidence/mcp.md:7` (a star count for `modelcontextprotocol/servers`). The line exists. It does not mention a license. Same shape for determinism: cite `_evidence/mcp.md:33` ("I did not run the harness, so how good its coverage is is unverified") as if an unrun check were evidence the incumbent fails determinism. That is absence of a check, not a failed constraint. Build clean-room ships.

**Replace the bar cell of line 19, and add a sentence after line 22:**

The failed constraint is a fact in the cited line, not a label in this table. License means a quoted license clause. Determinism means a quoted nondeterministic result or a quoted admission of one. "We did not run it," "stars are low," and "the field is moving" are not failed constraints.

The verdict file must name the less-building alternative that was rejected and the line that rules it out. Gate K fails a Build clean-room whose citation does not state the constraint, and fails any verdict that does not record the rejected alternative.

## 3. Adopt, Adopt and wrap, and Watch have no settler

**METHOD.md:17-22.** Adopt: incumbent covers the need and fails no hard constraint. Adopt and wrap: a verification gap the adopter must close. Watch: evidence too thin, or the field moves faster than a commitment (spec churn, no conformance suite). Line 22 settles only "builds less," which does not order these three. Adopt builds less code than a wrap. Watch builds less commitment than Adopt. Both readings are available.

**Failure.** Same pack, three honest verdicts:

- Adopt: `_evidence/mcp.md:8` and `:20` — official Python SDK pushed 2026-09-23, conformance harness pinned in CI. Incumbent exists. Build less.
- Adopt and wrap: `_evidence/mcp.md:33` — harness is `0.2.0-alpha.11`, author did not run it, coverage unverified. That is a verification gap.
- Watch: `_evidence/mcp.md:10` — spec revisions 2025-11-25 and 2026-07-28 differ (stateful handshake vs stateless per-request). Spec churn, the Watch example on line 20.

Line 22 does not pick one.

**Replace line 22 with:**

Order, and do not skip a step: Watch if the pack's caveats say the incumbent was not inspected or the conformance artifact was not run. Else Adopt and wrap if a cited line states a gap the adopter must close (unrun harness, expected-failures baseline, unaudited CI). Else Adopt. Build clean-room only under finding 2. "Builds less" is this order, not a separate vote.

## 4. Caveats can be dropped and the verdict still passes

**METHOD.md:68.** "What we cannot say" must be non-empty. If the pack has a caveats section, it is "the starting point." Non-empty is the only check.

**Failure.** `_evidence/mcp.md:33-36` says the harness was not run, context7 and langchain-mcp-adapters were activity-only, and the Python test matrix was not read. An author writes "What we cannot say: stars are not quality." That is non-empty and true (`METHOD.md:66`). The alpha-harness caveat is gone. Adopt ships as if the harness had been executed. `pickup-mcp.md:98` had to withdraw the maturity claim; the method does not force that withdrawal into the verdict.

**Add after line 68:**

Gate K fails unless every bullet under the pack's caveats heading is quoted in "What we cannot say," or the verdict is Watch. A paraphrase that drops "not run" or "CI not inspected" fails.

## 5. Fresh reads are forced to [External], which the Rulebook calls [Verified]

**METHOD.md:9 and :3 and :64.** Line 9: a GitHub API or web read made while writing the verdict is [External]. Line 3: where METHOD and the Rulebook disagree, the Rulebook wins. Line 64: tiers are the Rulebook's.

`RULEBOOK.md:29`: [Verified] includes "an API response, or a live page read by the analyst." `RULEBOOK.md:32`: [External] is papers, press, third-party benchmarks, not the analyst's own API read.

**Failure.** `_evidence/mcp.md:3` records `curl https://api.github.com/repos/<owner>/<repo>` on 2026-09-23. Under the Rulebook that is [Verified]. Under line 9 it is [External]. One author tags the push date [External] and issues Watch ("only external, thin"). Another tags it [Verified] and issues Adopt. Both can cite line 3 of METHOD as authority for opposite tiers. Line 9 also forbids clones, so the Rulebook's other [Verified] path (fresh clone) is closed. The layer can be argued to have no [Verified] facts at all.

**Replace line 9 with:**

A GitHub API response or live page read by the author, with the date and the exact URL or command in the bullet, is [Verified], per RULEBOOK.md:29. A workflow file that exists is [Verified] for "this file exists," and [Maintainer claim] for "this check passes." [CI-observed] only if a live CI page shows the run, per RULEBOOK.md:30. Do not relabel an analyst read as [External].

## 6. Two lines in one pack are treated as independent evidence

**METHOD.md:65.** High confidence needs "at least two independent evidence rows that agree and no contrary row." "Independent" is undefined. `RULEBOOK.md:44` High is "multiple converging sources or direct inspection."

**Failure.** Cite `_evidence/mcp.md:8` and `_evidence/mcp.md:9` (python-sdk and typescript-sdk star lines, same curl, same day, same author) as two independent rows. No contrary row is cited because the contrary row is `:33` (harness not run) and the author does not include it. Confidence High. The verdict looks settled. Both rows are one pack, one method, one date.

**Replace line 65 with:**

Medium by default. High only if two citations have different owners and the pack's caveats section contains no contrary sentence. Two lines of one evidence pack are one source. Low if the pack says thin, not run, or not inspected.

## 7. The bottom line is an instruction, and the verdict is defined as inference

**METHOD.md:40 and :64.** The bottom line is "two or three plain sentences a builder can act on." Line 64: "The verdict itself is always [Inference]." `RULEBOOK.md:33`: inference is "never presented as fact." `RULEBOOK.md:19`: a claim without a tier and a confidence grade is a draft note.

**Failure.** A site reader of "Adopt modelcontextprotocol/python-sdk; do not write an MCP SDK" cannot see that the sentence is inference. The front matter has `verdict` and `confidence`, but line 40 does not require those words in the sentences the builder reads. A wrong Adopt is then read as a finding.

**Replace line 40 with:**

Two or three sentences. The first names the verdict and says it is an inference. Example: "Inference, medium confidence: adopt the official SDK and do not write one. The harness was not run (see What we cannot say)."

## 8. A site reader cannot decode the file the method requires

**METHOD.md:46, :24, :33.** Copy-these-practices bullets must say `Starter kit: <A2 | B6 | none>`. Gate K is unnamed for a reader. The template hard-codes `evidence_date: 2026-09-23`.

`starter-kit/CHECKLIST.md:27` A2 is "Incumbent oracle pinned before implementation." `:175` B6 is "Claim discipline enforced." A reader of the site does not have that legend. INTENT.md's 21 types and the companion's T0/T2/T3 codes (`pickup-mcp.md:77-83`) are a second numbering: T0 means Verified there, while Rulebook tier 1 is Verified and tier 5 is Inference. METHOD.md:64 does not ban T0.

**Failure.** A bullet "Copy the conformance workflow. Starter kit: A2. [T0] (`_evidence/mcp.md:20`)" passes a human skim and means three different things to the author, the reviewer, and the site reader. The frozen date also lets a fresh check on a later day still say 2026-09-23.

**Add under line 46:**

On the site, spell the checklist item ("pin the incumbent before you write code"), do not print A2 or B6. Gate K rejects a tier token that is not one of the five Rulebook labels. `evidence_date` is the date of the newest citation in the file, not a fixed day.

## What this review does not say

It does not pick the MCP verdict. It does not say the four names are the wrong set. It does not re-grade the 44 packets. Gate K was not run; the findings are about what the written rule lets through.
