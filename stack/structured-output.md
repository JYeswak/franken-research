---
type: structured-output
title: Structured output and constrained decoding
group: Model serving
verdict: Adopt and wrap
confidence: Medium
evidence_date: 2026-09-23
author: VerdictsServing
reviewed_by: ReviewServing
review_date: 2026-09-23
---

## Bottom line
Inference, medium confidence: adopt and wrap an existing constrained-decoding engine (a library that masks the model's next-token choices so output must match a JSON Schema, regex or grammar) instead of writing one or prompting for JSON and hoping. Use xgrammar or another engine through your serving stack (vLLM ships adapters for four), outlines as a front end, or llama.cpp grammars for local models. Wrap it with two tests of your own: feed the engine's accepted outputs through an independent validator such as Pydantic, and put a compile-time ceiling on pathological schemas, because no project in the evidence runs a fuzzer that checks the mask against the schema.

## Adopt, do not rebuild
- **mlc-ai/xgrammar**: purpose-built engine that compiles JSON Schema, regex or a grammar into per-token masks, consumed as a library by vLLM and outlines. [Verified] (ecosystem/pickup/_evidence/structured-output.md:6 "Purpose-built constrained-decoding engine (token-bitmask FSM from JSON Schema/regex/CFG)"; ecosystem/pickup/_evidence/structured-output.md:6 "ships as a library consumed by others")
- **dottxt-ai/outlines**: front end whose v1.x routes the same constraint API to pluggable engine backends. [Verified] (ecosystem/pickup/_evidence/structured-output.md:5 "v1.x rewrote around a backend-pluggable architecture")
- **vllm-project/vllm**: treats structured output as a serving feature with adapters for four engines and its own test suite. [Verified] (ecosystem/pickup/_evidence/structured-output.md:9 "all four verified in the repo tree")
- **ggml-org/llama.cpp**: C++ grammar-constrained sampler with a JSON-Schema-to-grammar converter and five grammar test binaries, for local models. [Verified] (ecosystem/pickup/_evidence/structured-output.md:8 "Reference C++ grammar-constrained sampler")
- **noamgat/lm-format-enforcer**: small token-level enforcer for JSON Schema and regex, vendored as a vLLM backend. [Verified] (ecosystem/pickup/_evidence/structured-output.md:10 "Small focused token-level enforcer (JSON Schema/regex)")

## Copy these practices
- **Give every engine backend the same test shape**: outlines keeps one test file per backend (`tests/backends/test_xgrammar.py`, `test_llguidance.py`, `test_outlines_core.py`). A fresh read on 2026-09-23 of those files under https://raw.githubusercontent.com/dottxt-ai/outlines/main/tests/backends/ showed each generating under its engine and asserting that output matches a regex and looks like JSON (first character `{`, a `name` key present), while `test_backends.py` only asserts that each backend name dispatches to its processor class. None validates output against the schema; that suite is yours to write. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/structured-output.md:16 "outlines (tests/backends/test_xgrammar.py, test_llguidance.py, test_outlines_core.py, test_backends.py)")
- **Byte-exact golden files for schema-to-grammar conversion, re-parsed**: llama.cpp `tests/test-json-schema-to-grammar.cpp`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/structured-output.md:17 "asserts byte-exact expected grammar text for given JSON schemas, plus verify_expectation_parseable() re-parses the expectation through the grammar parser")
- **Check the engine against an independent validator**: xgrammar `tests/python/test_grammar_matcher_json_schema.py` validates matcher output against a Pydantic model. Starter kit: A2. [Verified] (ecosystem/pickup/_evidence/structured-output.md:19 "Differential validation against an independent ground-truth validator.")
- **A pathological input must fail cleanly**: vLLM `tests/v1/structured_output/test_regex_compilation_timeout.py`. Starter kit: A10. [Verified] (ecosystem/pickup/_evidence/structured-output.md:27 "guards against pathological regexes DoS-ing the serving loop")
- **Mark known bugs as expected failures that link the upstream issue**: guidance `tests/unit/test_grammar.py`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/structured-output.md:20 "includes a pytest.mark.xfail for a known lexer-boundary bug linking the upstream issue")
- **Measure overhead on a schedule, off the correctness path**: xgrammar `.github/workflows/benchmark.yaml`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/structured-output.md:22 "nightly cron on self-hosted runner running examples/benchmark/cibench_grammar_compile_mask_gen.py")
- **Test the grammar cache and composition with speculative decoding**: outlines `tests/test_cache.py`; vLLM `tests/v1/spec_decode/test_mtp_structured_output.py`. Starter kit: none. [Verified] (ecosystem/pickup/_evidence/structured-output.md:28 "Cache invalidation across schema/tokenizer changes is tested explicitly."; ecosystem/pickup/_evidence/structured-output.md:29 "Verifies guided decoding composes with speculative/multi-token prediction rather than assuming it.")

## Build only if
- Build the test harness the ecosystem lacks, not a new engine: a generative differential fuzzer (random grammar, compare masks against a reference parser). The absence is verified within the pack's sample; building the harness is this verdict's advice. [Verified] [Inference] (ecosystem/pickup/_evidence/structured-output.md:35 "No repo in this set runs a documented differential fuzzer"; ecosystem/pickup/_evidence/structured-output.md:35 "A clean-room project should add one; the ecosystem doesn't demonstrate it.")
- Build an engine only if your runtime forbids C/C++/Python dependencies by policy, as franken_nlp's pure-Rust single-model runtime does by design; its own packet notes llama.cpp already ships grammar-constrained generation, and franken_nlp's guarantee has not been observed. All adopted engines here are Apache-2.0 or MIT (read 2026-09-23 with `gh api repos/<owner>/<repo> --jq .license.spdx_id`), so no license constraint justifies building. [Maintainer claim] [Verified] [Inference] (stack/licenses.tsv:61 "mlc-ai/xgrammar Apache-2.0 permissive"; stack/licenses.tsv:19 "dottxt-ai/outlines Apache-2.0 permissive"; stack/licenses.tsv:99 "vllm-project/vllm Apache-2.0 permissive"; stack/licenses.tsv:30 "ggml-org/llama.cpp MIT permissive"; stack/licenses.tsv:66 "noamgat/lm-format-enforcer MIT permissive"; packets/franken_nlp-assessment.md:59 "Why a rewrite, not a wrapper: the stated bet is specialization"; packets/franken_nlp-assessment.md:269 "llama.cpp already ships grammar-constrained generation (GBNF), so the grammar half of the appliance lane exists upstream"; packets/franken_nlp-assessment.md:91 "the construction guarantee is a design property, not an observed one")

## Where FrankenSuite touches this
- **franken_nlp**: a 5,989-line grammar-constrained task layer designed to compile JSON Schema into a bounded automaton over the tokenizer's vocabulary, with source-grounded verbatim fields; no decode path executes yet; TRL 2-3, NODUS ring Monitor. [Verified] [Maintainer claim] [Inference] (packets/franken_nlp-assessment.md:91 "Grammar-constrained task layer: schema-valid-by-construction JSON"; packets/franken_nlp-assessment.md:131 "JSON-Schema compiles to a bounded automaton over a vocab byte-trie"; packets/franken_nlp-assessment.md:18 "TRL: 2–3; NODUS ring: Monitor")
- No other FrankenSuite packet ships a constraint engine; franken_nlp's layer is part of one model's runtime, not a reusable library. [Inference] (packets/franken_nlp-assessment.md:17 "built around exactly one model")

## What we cannot say
- Whether any engine's mask matches its schema on inputs nobody wrote tests for (ecosystem/pickup/_evidence/structured-output.md:35 "No repo in this set runs a documented differential fuzzer").
- How much latency constraint decoding adds: overhead is tracked as CI artifacts, not published budgets (ecosystem/pickup/_evidence/structured-output.md:36 "neither repo publishes a committed per-token overhead budget in docs").
- guidance is cited only for a test pattern; its repo was about four months behind the others and its core has moved to shared engines (ecosystem/pickup/_evidence/structured-output.md:37 "guidance's last push (2026-05-21) is ~4 months stale").
- Whether validator-based differential checks extend past JSON Schema (ecosystem/pickup/pickup-structured-output.md:374 "evidence only demonstrates the JSON Schema case"), or whether byte-exact grammar goldens survive llama.cpp grammar-syntax changes (ecosystem/pickup/pickup-structured-output.md:364 "Whether byte-exact schema→grammar goldens transfer across").
- llguidance appears here only as an outlines test backend; its own repository is not in the pack. The pack's pointers are live tree listings, none cited from memory (ecosystem/pickup/_evidence/structured-output.md:39 "Nothing in this file was cited from memory.").

## Revisit when
- Any engine or front end publishes a generative mask-equivalence fuzzer, or a shared cross-engine conformance corpus appears.
- An engine commits a per-token overhead budget backed by its nightly benchmark.
- franken_nlp executes its grammar-constrained decode path.
