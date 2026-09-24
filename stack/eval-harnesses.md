---
type: eval-harnesses
title: LLM eval harnesses
group: Eval and safety
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsOrchestration
reviewed_by: control-plane-pane-2
review_date: 2026-09-23
---

## Bottom line
Inference, medium confidence: run your evals on an existing harness (Inspect AI for agent and tool-use evals, lm-evaluation-harness for academic benchmarks, the SWE-bench harness for coding agents), and do not write your own runner. Wrap it with tests of your own graders: SWE-bench is the only harness whose adversarial grader tests (spoofed passes, truncated output) were read, the others were not checked for them, and no harness showed a checked pattern for model-graded ("judge") verdicts, so a score is only as honest as the grader tests you add.

## Adopt, do not rebuild
- **UKGovernmentBEIS/inspect_ai**: a task, solver and scorer framework with 40+ model providers and sandboxed tool execution in Docker or Kubernetes; it also ships a mock model provider for offline tests. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:7 "Task/solver/scorer DSL, 40+ model providers, sandboxed tool execution (Docker/k8s)"; ecosystem/pickup/_evidence/eval-harnesses.md:23 "A mock implementation of the ModelAPI class for testing purposes")
- **EleutherAI/lm-evaluation-harness**: the academic benchmark harness, with versioned task configs, a dummy model for zero-cost pipeline runs, and CI that validates only changed tasks; its README says it backs Hugging Face's Open LLM Leaderboard. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:23 "lm_eval/models/dummy.py (DummyLM, registered as"; ecosystem/pickup/_evidence/eval-harnesses.md:26 "CI validates only the benchmarks that changed") and [Maintainer claim] (ecosystem/pickup/_evidence/eval-harnesses.md:8 "its README states it is the backend for HF's Open LLM Leaderboard")
- **SWE-bench/SWE-bench**: the containerized grading harness for coding agents, which scores by running pinned tests in pinned containers and parsing their logs with deterministic parsers. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:11 "The reference agentic-coding benchmark + containerized grading harness"; ecosystem/pickup/_evidence/eval-harnesses.md:28 "scoring = run pinned tests in pinned containers, then parse logs with deterministic regexes")
- **ShishirPatil/gorilla (Berkeley Function-Calling Leaderboard)**: function-calling evals with the deterministic checker kept apart from the code that calls models. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:12 "deterministic eval_checker/ separated from model-handling code")

## Copy these practices
- **Attack your own graders**: test the scorer against model output that prints fake PASS lines, truncated test IDs, skipped tests and infrastructure failures, alongside golden-log tests for every log parser. Starter kit: B14. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:29 "grader must not be fooled by model-printed fake PASS lines")
- **A model-free PASS/FAIL decider**: the module that decides pass or fail imports and runs with no model, no API key and no network, and is tested like library code. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:32 "the part that decides PASS/FAIL should be importable and testable without any model"; ecosystem/pickup/_evidence/eval-harnesses.md:24 "Unit-test scorers and metrics like library code, with fixture/golden data")
- **Version every benchmark; keep data out of the harness**: a changed task config gets a version bump, and datasets live in their own versioned home. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:25 "never silently mutate a benchmark; bump a version"; ecosystem/pickup/_evidence/eval-harnesses.md:30 "harness repo stays code; datasets live in their own versioned home")
- **A dummy model for the whole pipeline, with its limit stated**: run a full benchmark tier on a mock provider in every merge, and say in writing that a green dummy run proves wiring, not grading. Starter kit: A10. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:23 "Ship a mock/dummy model provider for offline harness testing"; ecosystem/pickup/pickup-eval-harnesses.md:189 "a green dummy-path run proves pipeline wiring, not grading")
- **Cheap tests gate merges, expensive tests run on purpose**: lint, type checks and fast unit tests on every pull request; slow, Docker and model-backed tests behind explicit markers; for a large suite, validate only the benchmarks a change touched. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:27 "cheap tests gate merges, expensive tests run explicitly")
- **Gate benchmark contributions**: a new benchmark passes documented automated checks before it merges. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/eval-harnesses.md:34 "a new benchmark must pass documented automated checks before merge")

## Build only if
- No evidenced constraint rules out the incumbents. The evidenced gaps are grader tests and a judge-honesty discipline (recording the judge's identity and bounding its disagreement with a deterministic checker), which are wrappers you add around an adopted harness, not reasons to write a new one. [Inference] (ecosystem/pickup/pickup-eval-harnesses.md:343 "SWE-bench shows a systematic adversarial battery"; ecosystem/pickup/pickup-eval-harnesses.md:349 "none of the evidence repos provided a verified judge-honesty")

## Where FrankenSuite touches this
- None of the 44 packets builds an LLM eval harness. The nearest is franken_overlap's benchmark "courtroom": preregistered claims judged by paired bootstrap as supported, inconclusive or unsupported, with immutable evidence bundles, but no evidence run has been checked in; TRL 4, Explore. [Verified] (packets/franken_overlap-assessment.md:20 "preregistered paired-bootstrap claim verdicts of supported/inconclusive/unsupported"; packets/franken_overlap-assessment.md:160 "The courtroom has held no trial."; packets/franken_overlap-assessment.md:182 "Technology readiness | TRL 4"; packets/franken_overlap-assessment.md:77 "(NODUS: Explore — see §4.9.)")
- frankenjax runs a differential conformance harness against fixtures recorded from real JAX, the suite's common pattern of grading a reimplementation against its incumbent, not a model eval; TRL 4, Explore. [Verified] (packets/frankenjax-assessment.md:20 "861 JAX-oracle fixture cases counted exactly per family"; packets/frankenjax-assessment.md:22 "(TRL 4 — see §4.9). Substantive-but-unproven is the textbook Explore case")

## What we cannot say
- Whether Inspect AI's mock provider is exercised by its own tests: the provider's stated purpose was read, no test file invoking it was found (ecosystem/pickup/_evidence/eval-harnesses.md:41 "I did not verify a specific test file invoking mockllm").
- lm-evaluation-harness's seed API: determinism rests on seeded sampling tests and versioned task configs only (ecosystem/pickup/_evidence/eval-harnesses.md:43 "I would not claim a specific seed API without a follow-up check"). Its adopter list was read in its own README, which makes it a maintainer claim (ecosystem/pickup/_evidence/eval-harnesses.md:42 "were verified firsthand in the canonical repo's README (line 57)").
- Whether Inspect AI, lm-evaluation-harness or harbor test their graders adversarially the way SWE-bench does (ecosystem/pickup/pickup-eval-harnesses.md:344 "equivalent anti-cheat coverage is unverified").
- tau-bench, Terminal-Bench, human-eval and BIG-bench are not listed as incumbents: tau-bench showed no CI, the Terminal-Bench repositories have a confusing rename, and the two datasets are stale (ecosystem/pickup/_evidence/eval-harnesses.md:37 "no visible CI; process evidence from it is limited to layout"; ecosystem/pickup/_evidence/eval-harnesses.md:39 "Terminal-bench naming is confusing"; ecosystem/pickup/_evidence/eval-harnesses.md:40 "human-eval and BIG-bench are stale").
- Stars and push dates are a point-in-time activity signal, not a ranking (ecosystem/pickup/_evidence/eval-harnesses.md:44 "treat as trend evidence, not exact rankings").

## Revisit when
- Inspect AI, lm-evaluation-harness or harbor ship an adversarial grader suite: the wrap shrinks to reusing it.
- A harness publishes a judge-honesty pattern (judge identity pinned, measured run-to-run variance, agreement bounds with a deterministic checker).
- franken_overlap checks in its first evidence run, which would show whether its claim gate works as a reusable benchmark-claim template.
