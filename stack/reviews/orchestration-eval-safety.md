<!-- Review record, published as written. Review of 7 verdicts (author VerdictsOrchestration) by control-plane pane 2, with re-checks until signing. Scratch paths refer to the reviewer's machine. -->

# Review of 7 stack verdicts

Commit `eef87ef`. Author VerdictsOrchestration. Rules: `stack/METHOD.md` at that commit (v2). Citations checked with `git show eef87ef:<path>` against the quoted line. 213 citations: 212 quotes sit on the named line. One quote wraps across `pickup-agent-frameworks.md:176-177` and the joined lines do carry the mutation-test fact; not filed.

`reviewed_by` is empty on all 7. That is expected in this pass. Do not treat it as a finding.

None of the 7 is a clean pass. The starter-kit id problem is shared. The rest are per file.

## Shared

Every file prints `Starter kit: A2` (or A9, A10, B4, B8, B9, B14) with no title. METHOD.md:78: the site spells the checklist item, it does not print the id. A builder cannot tell what A10 requires. Fix: replace each id with the heading from `starter-kit/CHECKLIST.md` (A2 is "Incumbent oracle pinned before implementation", A10 is "Acceptance shape: positive observable + planted negative + no-claim line", B9 is "Waivers are public, time-bounded, and recorded", B14 is "Gate self-test: deliberately break a gate").

## agent-frameworks.md

Verdict order is right. The gap is real: `_evidence/agent-frameworks.md:40` says no surveyed repo had a record/replay harness. That is a wrap, not a default. Watch would be wrong: the named incumbents had process files read, not activity-only. Medium confidence is acceptable for those incumbents.

1. `agent-frameworks.md:41` asserts "no test suite was run" and quotes `_evidence/agent-frameworks.md:39`. That line says file pointers were fetched and exist. It does not say a suite was not run. Fix: delete the "not run" clause, or cite a line that says it. Do not invent the limit.
2. `agent-frameworks.md:43` ("stars show alive, not good") has no citation. METHOD.md:76 requires a cited caveat. Fix: cite `_evidence/agent-frameworks.md:35` ("trend evidence is star-count + same-day push activity").

FrankenSuite section is fair: frankenterm is a control plane, not a framework; the packet's TRL 7 / Explore quotes are on the cited lines. asupersync is labeled inference.

## mcp.md

Verdict order is right. METHOD.md:27 names an unrun conformance harness as a wrap. `_evidence/mcp.md:33` is that line. Adopt would hide it. Watch would ignore process files that were read. Medium is acceptable: the SDK workflows were read; the unrun harness is the wrap, not a reason to call the whole pack thin.

1. `mcp.md:15` says the Python SDK's pack entry includes a pinned conformance package, per-revision expected-failure files, and one leg per wire revision. The quotes are "official Python SDK (server+client); pushes same-day" (`_evidence/mcp.md:8`) and "Official protocol conformance harness run in CI, separate from unit tests" (`_evidence/mcp.md:20`). Neither quote contains "expected-failures" or "every shipped wire". Those facts are later on line 20 and on line 21, outside the quotes. Fix: quote the pin sentence and the "test every shipped wire" sentence, or drop the parenthetical.
2. `mcp.md:36` says a grep of `packets/` found no `modelcontextprotocol`, tagged [Verified], and cites `packets/franken_snowflake-assessment.md:83`. That line is a claim row: the project's own MCP server has a handshake test. It does not say the string is absent from the packets. The citation contradicts the bullet. Fix: cite the command output, or delete the grep sentence. Do not hang an absence claim on a line that asserts a test exists.
3. `mcp.md:33` says the franken_markdown packet did not run the server. The quotes are the claim title, the TRL cell, and the ring sentence. "not executed here" is on `packets/franken_markdown-assessment.md:78` and is not in any quote. Fix: quote "not executed here".

The Copilot JSON-RPC hang (`synthesis/vendor-port-learnings.md:172`) is fairly used as a reason to run conformance, not to write a new SDK. The snowflake red-lane quote is on the cited line and is fair.

## multi-agent-protocols.md

Order and confidence are right. The pack says "Thin category" (`_evidence/multi-agent-protocols.md:32`), so Low is required and present. The SDKs' test trees were read, so Watch is not required. The wrap (pin the TCK, say self-interop) is cited.

1. `multi-agent-protocols.md:25` sits under "Copy these practices" and tells the builder to label interop scope. The tier is [Inference] and the quote is the companion's charter rule (`pickup-multi-agent-protocols.md:44`), not a line from a repository that does this. A builder will read the section as an incumbent practice. Fix: move it to "Build only if" or "What we cannot say", and say no surveyed repo was shown applying the label.

Caveats that name A2A, the TCK, ANP, the .NET SDK, Coral, and MCP are present. FrankenSuite lines match the packets (terminal contract, not an A2A implementation; alignment is an in-memory model).

## workflow-orchestrators.md

The category verdict is the right kind: replay is the evidenced determinism check, and the pack says no compile-time analyzer was found (`_evidence/workflow-orchestrators.md:42`). That is a wrap, not a reason to build an engine.

1. Confidence is Medium. The pack says "Thin evidence, stated honestly" (`_evidence/workflow-orchestrators.md:42`) and "not by running the suites" (`:48`). METHOD.md:73: Low when the pack says thin or not run. Fix: `confidence: Low`, and say Low in the first sentence.
2. `workflow-orchestrators.md:18` lists Restate under "Adopt, do not rebuild" while `_evidence/workflow-orchestrators.md:43` says no replay harness was found and its process evidence is the thinnest. The bottom line tells every adopter to replay recorded histories. A builder who picks Restate because it is in the adopt list does not have that wrap. Fix: move Restate out of the adopt list into "What we cannot say", or say adopt only the journal-table tests, not the engine, until a replay suite is read.

The asupersync quote includes "replay not executed". That is fair. Cadence's old path 404 is in the caveats section.

## eval-harnesses.md

Order is right. Incumbents have process files. The judge-honesty gap is an unknown in the companion (`pickup-eval-harnesses.md:349`), labeled [Inference]. Medium is acceptable: the pack does not call the named harnesses thin or unread.

1. The bottom line (`eval-harnesses.md:12`) says only SWE-bench attacks its own scoring. `pickup-eval-harnesses.md:343-344` says SWE-bench has the battery and "equivalent anti-cheat coverage is unverified" for Inspect, lm-eval, and harbor. Unverified is not absent. Fix: "SWE-bench is the only one whose adversarial grader tests were read; the others were not checked."

Caveats for tau-bench, Terminal-Bench, human-eval, BIG-bench, mockllm, and the seed API are in "What we cannot say". franken_overlap "no trial" is on the cited line. Fair.

## observability.md

Order is right. `_evidence/observability.md:39` says OpenTelemetry compatibility is asserted more than proven. That is a real wrap. Medium is acceptable: the named platforms' workflow files were read, and the unread test bodies are disclosed.

1. `observability.md:25` says a cost claim whose price-table audit is more than seven days old drops to inference, tagged only [Verified]. The seven-day rule is `pickup-observability.md:167`, a companion proposal ("demoted to T3"), not an observed practice. The evidence line (`_evidence/observability.md:33`) supports a scheduled price job, not the seven-day demotion. Fix: split the bullet. Keep [Verified] on the daily job. Mark the seven-day rule [Inference], or delete it.

LangSmith-closed, Langtrace-stale, and "only Opik has a load suite" are in the caveats section. asupersync is described as runtime telemetry, not an agent-trace product. Fair.

## guardrails.md

Order is right. `pickup-guardrails.md:360` says no evidence repo publishes an FP/FN norm. That is a wrap, not a default, and not a reason to build a new rail toolkit. The alignment "not a security boundary" quotes are on the packet lines. Fair to the maintainer: the motive is recorded, the missing implementation is recorded, the verdict does not tell the builder to adopt franken_alignment.

1. Confidence is Medium. `_evidence/guardrails.md:42` says tests were not executed, CI pass/fail was not checked, and file contents were spot-read, not audited. METHOD.md:73 requires Low. Fix: `confidence: Low`, and say Low in the first sentence. The adopt list can stay if each bullet is read as a file-tree description, not as a tested safety result.

Pack caveats for HarmBench, strongreject, langkit, rebuff, and stars are cited in "What we cannot say".

## Re-check at c6c4e56

Not signed. `reviewed_by` was not added. The starter-kit id finding was not a gate.

RESOLVED:

- agent-frameworks.md:41. The world-fact "no test suite was run" is gone. The bullet now says the pack records that file pointers were fetched, and quotes `_evidence/agent-frameworks.md:39` for that sentence.
- agent-frameworks.md:43. Stars caveat now cites `_evidence/agent-frameworks.md:35`. The quote is on that line.
- mcp.md:33. Quote `Medium]; not executed here` is on `packets/franken_markdown-assessment.md:78`.
- mcp.md:36. The snowflake line is no longer cited. The replacement (`mcp.md:38`) states the grep command and date. `git grep -c modelcontextprotocol c6c4e56 -- packets` returned no matches, so the absence claim is true.
- multi-agent-protocols.md:25. The interop-label rule is no longer under Copy these practices. It is in Build only if, tagged [Inference], citing the companion charter.
- workflow-orchestrators.md confidence. Front matter and the first sentence are Low. Quotes for "Thin evidence, stated honestly" and "not by running the suites" are on lines 42 and 48.
- workflow-orchestrators.md Restate. Removed from the adopt list. The bottom line names Temporal, Cadence, and Conductor only.
- eval-harnesses.md:12. Now says SWE-bench is the only harness whose adversarial grader tests were read, and the others were not checked. That matches the cited unverified coverage.
- observability.md:25-26. The daily price job is its own [Verified] bullet. The seven-day demotion is a separate [Inference] bullet citing `pickup-observability.md:167`.
- guardrails.md confidence. Front matter and the first sentence are Low, and the sentence says no test was run and no CI result was checked.

STILL OPEN:

1. `mcp.md:15` still says the SDK "names failing scenarios in expected-failure files per spec revision." The new quotes are "python-sdk pins harness version in workflow env" (`_evidence/mcp.md:20`) and "Expected-failures baseline files instead of skipping hard scenarios" (`_evidence/mcp.md:21`). Neither quote contains "per spec revision" or "every shipped wire." Line 21's body does ("scores conformance per spec revision"; the dated expected-failures filenames). The quote does not. Fix: quote "scores conformance per spec revision", or delete "per spec revision" from this bullet.

New problems on changed bullets:

2. `workflow-orchestrators.md:38` says no replay harness or time-skipping framework was found. The quotes are "journal tables unit-tested in-tree" (`_evidence/workflow-orchestrators.md:10`) and "Its process evidence is the thinnest among the durable-execution engines" (`:43`). Line 43's body says "no verified replay harness or time-skipping test framework found." That phrase is not in the quote. Fix: quote that phrase.
3. `multi-agent-protocols.md:27` says no surveyed repository was shown applying the interop label. The citations support the charter rule and the A2A-as-target sentence. They do not say a search found no repo applying the label. Fix: delete that clause, or cite the pack line that says the tested interop is self-interop (`_evidence/multi-agent-protocols.md:32`).
4. `observability.md:26` says no surveyed repository was shown doing the seven-day demotion. The quote is only the companion's proposed rule. Fix: delete that clause. The [Inference] tag already says it is a proposal.

## Re-check at 1209043

All 11 findings RESOLVED. Signed. Starter-kit ids were not a gate.

- agent-frameworks.md:41 RESOLVED. The bullet states what the pack records, and the quote is on `_evidence/agent-frameworks.md:39`.
- agent-frameworks.md:43 RESOLVED. Stars caveat cites line 35. Quote is on the line.
- mcp.md:15 RESOLVED. Quotes now include the dated expected-failures filenames (`_evidence/mcp.md:21`) and "conformance.yml runs three legs: 2025-11-25 wire, 2026-07-28 wire, default wire" (`:22`). Those carry "per spec revision" and "one conformance leg per wire revision."
- mcp.md:33 RESOLVED. "not executed here" is quoted from `packets/franken_markdown-assessment.md:78`.
- mcp.md:38 RESOLVED. The contradictory snowflake citation is gone. The grep command and date are in the bullet. `git grep` at `c6c4e56` found no `modelcontextprotocol` under `packets/`.
- multi-agent-protocols.md:27 RESOLVED. The interop-label rule is under Build only if, tagged [Inference]. The new clause "interop tested in this category is inside the A2A organization's own SDKs" is quoted from `_evidence/multi-agent-protocols.md:32`.
- workflow-orchestrators.md confidence RESOLVED. Low in the front matter and the first sentence, with the thin and not-run quotes.
- workflow-orchestrators.md Restate RESOLVED. Not on the adopt list. The cannot-say bullet quotes "no verified replay harness or time-skipping test framework found" from `_evidence/workflow-orchestrators.md:43`.
- eval-harnesses.md:12 RESOLVED. Says the others were not checked, not that they lack the tests.
- observability.md:26 RESOLVED. The seven-day rule is [Inference] only. The "no surveyed repository" clause is deleted.
- guardrails.md confidence RESOLVED. Low in the front matter and the first sentence.

No new unsupported clause on the four changed bullets. Signed in `9546e4d`. `git show --stat HEAD` is those 7 files, 14 insertions, nothing else.
