# FrankenSuite Cross-Suite Synthesis — Overview

Assessment date: 2026-09-22. Corpus: 44 pinned-commit repository assessment packets (43 "franken*"-named repos plus `asupersync`) and one maintainer-writing brief (Jeffrey Emanuel's public writing, 2024–2026).

**Reading guide.** Every substantive claim below carries an evidence tier — `[Verified]`, `[CI-observed]`, `[Maintainer claim]`, `[External]`, or `[Inference]` — plus a confidence level (High/Medium/Low). Prevalence figures are exact n/44, counted directly from the packets, not copied from analyst estimates. Where a claim could not be counted exactly, no n/44 figure is given. "Unique" means no other packet/brief in this corpus describes the mechanism — not that no sibling repository contains it. Code that *exists* is separated throughout from CI that *demonstrably runs*.

**Method.** Cross-suite briefs were written per packet from the full own-packet read plus skims of the other 43 (TL;DR, claim inventory, verdict/TRL/NODUS, benchmark, limitation, license/governance sections). High-level prevalence and uniqueness claims were spot-checked against the source `*-assessment.md` files. One source defect: the `frankensim` cross-suite brief is physically truncated (ends mid-§4); frankensim material here is reconstructed from `frankensim-assessment.md` directly.

## Aggregate counts

| Dimension | Result |
|---|---|
| NODUS ring | Explore **34/44**, Monitor **7/44**, Pilot **3/44** [Inference, Medium] |
| TRL | 2–3: 2 · 3: 3 · 3–4: 4 · 4: 10 · 4–5: 3 · 5: 3 · 5–6: 2 · 6: 8 · 7: 4 · 8: 4 · 9: 1 [Inference, Medium] |
| License | OpenAI/Anthropic rider **38/44**; plain MIT, no rider **1/44** (`franken_agent_detection`); no LICENSE / no operative grant **5/44** (`beads-for-frankentui`, `beads_for_franken_engine`, `franken_native_capsule`, `frankensim_website`, `frankensqlite_website`) [Verified, High] |
| Bus factor | 1 in **44/44** [Verified, High] |
| Explicit refusal of outside contributions | **19/44** (named below; README/policy verbatim) [Maintainer claim, High] |
| Documentation/status/evidence drift | **44/44**, framed broadly (README-vs-tree, badge-vs-CI, status-vs-pin — not README-only) [Verified, High] |
| CI at the pin | Green **2/44** · Red **11/44** · No pin verdict (CI exists) **6/44** · No test CI / deploy-only **11/44** · Disabled/deleted **8/44** · Private-only, unobservable **6/44** [CI-observed, High] |
| Release posture | No release or tag **23/44** · Release artifact exists but targets an earlier commit, or phantom **6/44** · Some release artifact exists **15/44** [External, High] |
| Independent third-party validation | **0/44** — no third-party benchmark, review, or production deployment found in any packet, within the recall limits of the packet surveys [External, High] |
| Analyst-executed behavioral reproduction | **1/44** — `franken_threed` only (61/61 tests re-run by the analyst in ~21 s) [Verified, High] |

**NODUS detail.** Pilot (3): `asupersync`, `franken_agent_detection`, `franken_ocr`. Monitor (7): the four website repos (`franken_markdown_website`, `frankensim_website`, `frankensqlite_website`, `frankentui_website`), the two beads dashboards (`beads-for-frankentui`, `beads_for_franken_engine`), and `franken_nlp` (plan-stage). Everything else: Explore. [Inference, Medium]

**TRL detail.** 2–3: `franken_code_browser`, `franken_nlp`. 3: `franken_alignment`, `franken_drone_geometry_reconstruction`, `franken_surveillance_system`. 3–4: `franken_native_capsule`, `franken_remote`, `franken_threed`, `frankensympy`. 4: `franken_lean`, `franken_node`, `franken_overlap`, `frankenfs`, `frankengit`, `frankengraphdb`, `frankenjax`, `frankenlibc`, `frankentorch`, `frankensim`. 4–5: `franken_engine`, `frankenpandas`, `frankenredis`. 5: `franken_manim`, `franken_numpy`, `frankenscipy`. 5–6: `franken_whisper`, `frankensearch`. 6: `asupersync`, `franken_agent_detection`, `franken_networkx`, `franken_ocr`, `franken_snowflake`, `frankenmermaid`, `frankensqlite`, `frankentui`. 7: `beads_for_franken_engine`, `franken_markdown`, `franken_tts`, `frankenterm`. 8: `beads-for-frankentui`, `franken_markdown_website`, `frankensim_website`, `frankensqlite_website`. 9: `frankentui_website` (TRL 9 is the packet's own rating of the deployed artifact, not a suite-wide norm). [Inference, Medium]

**Explicit no-contributions policy (19/44).** `asupersync`, `franken_agent_detection`, `franken_code_browser`, `franken_lean`, `franken_manim`, `franken_markdown_website`, `franken_nlp`, `franken_ocr`, `franken_snowflake`, `franken_tts`, `frankenfs`, `frankenjax`, `frankenpandas`, `frankensim`, `frankensim_website`, `frankensqlite`, `frankensqlite_website`, `frankenterm`, `frankentui_website`. [Maintainer claim, High]

## The three load-bearing findings

**1. The pin is usually unverifiable or red.** Only 2 of 44 projects have public CI green at the assessed pin (`frankenscipy`, `franken_threed`). 11 are red at the pin, 6 have CI with no pin verdict, 11 have no test CI (deploy-only at most), 8 had CI disabled or deleted, and 6 verify only on maintainer-private infrastructure. "Green suite" claims across the program therefore rest overwhelmingly on maintainer-local or historical evidence, not on CI at the assessed commit. [CI-observed, High]

**2. Mechanism existence is systematically ahead of execution.** The suite's real strength is an unusually developed honesty apparatus: negative-evidence ledgers, claim registries, conformance harnesses, differential oracles, fail-closed gates. But the same packets document the apparatus not running where it matters — `franken_lean`'s unsafe census passed inside a red gate; `frankenredis`'s proof bundles sit under a red conformance lane; `franken_markdown`'s claim-discipline gate lives on DSR while the in-tree workflow is disabled; `franken_engine`'s quality/perf workflows had zero runs. Every portability claim in this synthesis is conditioned on this gap. [CI-observed, High]

**3. The license rider is the structural ceiling, and it conflicts with the program's own thesis.** 38/44 repos carry a non-OSI MIT+OpenAI/Anthropic rider that withholds all rights — including benchmarking, testing, analyzing, and indexing — from OpenAI, Anthropic, their affiliates, and anyone acting for them. It simultaneously blocks the two labs best positioned to independently validate the work, contradicts the agent-first architecture of projects like `frankensim` and `franken_tts`, and sits in direct tension with the agent co-authorship the program relies on (Claude-family co-authors appear across the commit record, e.g. 162/449 recent commits in `frankenredis`, 398 in `frankenpandas`). [Verified, High]

## Corrections applied during synthesis

- `SUITE.lock` is used by `franken_nlp`, `franken_lean`, **and** `franken_manim` — not by `franken_nlp` alone. [Verified, High]
- `franken_whisper` is not the largest codebase; size superlatives were checked against the packets. [Verified, High]
- `franken_numpy` has the strongest README placement of its disavowal, but it is not the only README that disavows. [Verified, High]
- `frankenmermaid` superlatives are calibrated against `franken_networkx` (the larger, more developed diagram-equivalence program). [Inference, Medium]
- `frankenfs` has negative ledgers, but `franken_numpy`'s (67,641 lines) is the largest counted in the corpus. [Verified, High]
- Release categories were rebuilt from named membership (23/6/15), superseding the preliminary 23/5/16: `franken_node`'s v0.1.0 release targets an earlier commit, matching `franken_engine`'s shape [External, High].

## Unresolved and declined claims

- **Truncated source:** the `frankensim` cross-suite brief ends mid-§4 (111 lines, literal truncation marker) [Verified, High]; frankensim material is reconstructed from its assessment. The brief defect is reported, not repaired.
- **`franken_snowflake` CI classification:** the brief's pattern title says "red at the pin," but its own evidence is "latest run #140 red, no run on the HEAD commit" [Verified, High]. Filed under "CI exists, no pin verdict" with the tension stated, not smoothed.
- **Ledger prevalence:** two briefs estimate negative-evidence ledgers at 22 and 23 packets respectively [Verified, High]. Only 9 assessments assert a counted ledger size; the count was not reconcilable and is declined — the pattern is described as program-wide culture with named large instances.
- **`forbid(unsafe_code)` prevalence:** briefs give "~35" and "34 packets" [Verified, High]; declined as an exact figure for the same reason.
- **Agent co-authorship prevalence:** documented instances are named (frankenredis, frankenjax, frankentorch, franken_threed, frankenpandas, franken_numpy, franken_tts) [Verified, High]; a suite-wide exact count is declined — trailer conventions lapse and sampling windows differ.
- **No rankings** of "best" or "most rigorous" project are offered. Where comparisons appear, the criterion is stated.

## Master matrix (44 rows)

Legend — CI: **C1** public CI green at pin · **C2** public CI red at pin · **C3** CI exists, no pin verdict · **C4** no test CI / deploy-only · **C5** CI disabled/deleted · **C6** private-only (DSR/RCH/self-hosted), unobservable. Release: **R1** no release/tag · **R2** release targets earlier commit, or phantom · **R3** release artifact exists. License: **Rider** = MIT+OpenAI/Anthropic rider. Validation: **none** = no independent third-party benchmark/review/deployment found. All tiers for these cells are in the row notes of `ci-requirements.md` and the pattern sections of `negative-patterns.md`; cells below carry the corpus evidence, [Inference, Medium] for TRL/NODUS judgments.

| Project | TRL | NODUS | License | Bus | No-contrib | CI | Rel | 3rd-party validation | Analyst behavioral repro |
|---|---|---|---|---|---|---|---|---|---|
| asupersync | 6 | Pilot | Rider | 1 | yes | C3 | R3 | distribution signal only (318k downloads, 78 reverse deps; some suite-internal) | no |
| beads-for-frankentui | 8 | Monitor | none | 1 | no | C4 (deploy-only; pin run green) | R1 | none | no |
| beads_for_franken_engine | 7 | Monitor | none | 1 | no | C4 (deploy-only; pin runs green) | R1 | none | no |
| franken_agent_detection | 6 | Pilot | plain MIT | 1 | yes | C2 | R3 | downstream integration (CASS — same maintainer) | no |
| franken_alignment | 3 | Explore | Rider | 1 | no | C6 | R1 | none | no |
| franken_code_browser | 2–3 | Explore | Rider | 1 | yes | C4 | R1 | none | no |
| franken_drone_geometry_reconstruction | 3 | Explore | Rider | 1 | no | C6 (self-hosted; 324 runs queued/cancelled) | R1 | none | no |
| franken_engine | 4–5 | Explore | Rider | 1 | no | C2 | R2 | none | no |
| franken_lean | 4 | Explore | Rider | 1 | yes | C2 | R1 | none | no |
| franken_manim | 5 | Explore | Rider | 1 | yes | C3 | R3 | none | no |
| franken_markdown | 7 | Explore | Rider | 1 | no | C5 | R3 | none | no |
| franken_markdown_website | 8 | Monitor | Rider | 1 | yes | C4 | R1 | none | no (analyst ran `verify:live` vs prod: 8 stale assets — not behavioral repro) |
| franken_native_capsule | 3–4 | Explore | none | 1 | no | C4 | R1 | none | no |
| franken_networkx | 6 | Explore | Rider | 1 | no | C3 (green 2026-09-09, 13 days before pin) | R2 | none | no |
| franken_nlp | 2–3 | Monitor | Rider | 1 | yes | C5 | R1 | none | no (analyst artifact replay — not behavioral) |
| franken_node | 4 | Explore | Rider | 1 | no | C2 | R2 | none | no |
| franken_numpy | 5 | Explore | Rider | 1 | no | C2 | R3 | none | no |
| franken_ocr | 6 | Pilot | Rider | 1 | yes | C5 | R3 | none | no |
| franken_overlap | 4 | Explore | Rider | 1 | no | C5 | R1 | none | no |
| franken_remote | 3–4 | Explore | Rider | 1 | no | C3 | R1 | none | no |
| franken_snowflake | 6 | Explore | Rider | 1 | yes | C3 (latest #140 red; no HEAD run) | R3 | none | no |
| franken_surveillance_system | 3 | Explore | Rider | 1 | no | C6 | R1 | none | no |
| franken_threed | 3–4 | Explore | Rider | 1 | no | C1 | R1 | none | **yes** — 61/61 re-run by the analyst in ~21 s [Verified, High] |
| franken_tts | 7 | Explore | Rider | 1 | yes | C6 | R3 | none | no |
| franken_whisper | 5–6 | Explore | Rider | 1 | no | C4 | R3 | none | no |
| frankenfs | 4 | Explore | Rider | 1 | yes | C2 (main lane; Artifact Gates lane green at HEAD) | R3 | none | no |
| frankengit | 4 | Explore | Rider | 1 | no | C3 (78 workflows; pin verdict not legible) | R1 | none | no |
| frankengraphdb | 4 | Explore | Rider | 1 | no | C5 | R1 | none | no |
| frankenjax | 4 | Explore | Rider | 1 | yes | C4 | R1 | none | no |
| frankenlibc | 4 | Explore | Rider | 1 | no | C2 | R1 | none | no |
| frankenmermaid | 6 | Explore | Rider | 1 | no | C4 (Pages deploy only) | R3 | none | no |
| frankenpandas | 4–5 | Explore | Rider | 1 | yes | C2 | R2 | none | no |
| frankenredis | 4–5 | Explore | Rider | 1 | no | C2 | R2 | none | no |
| frankenscipy | 5 | Explore | Rider | 1 | no | C1 | R3 | none | no |
| frankensearch | 5–6 | Explore | Rider | 1 | no | C5 | R3 | none | no |
| frankensim | 4 | Explore | Rider | 1 | yes | C6 | R1 | none | no |
| frankensim_website | 8 | Monitor | none | 1 | yes | C4 | R1 | none | no |
| frankensqlite | 6 | Explore | Rider | 1 | yes | C5 | R3 | none | no |
| frankensqlite_website | 8 | Monitor | none | 1 | yes | C4 | R1 | none | no |
| frankensympy | 3–4 | Explore | Rider | 1 | no | C2 | R1 | none | no |
| frankenterm | 7 | Explore | Rider | 1 | yes | C6 | R3 | none | no |
| frankentorch | 4 | Explore | Rider | 1 | no | C2 | R1 | none | no |
| frankentui | 6 | Explore | Rider | 1 | no | C5 | R2 (phantom v0.9.0) | none | no |
| frankentui_website | 9 | Monitor | Rider | 1 | yes | C4 | R1 | none | no |

Count checks: C1 2 · C2 11 · C3 6 · C4 11 · C5 8 · C6 6 = 44. R1 23 · R2 6 · R3 15 = 44. Rider 38 · plain MIT 1 · no operative grant 5 = 44. Bus factor 1: 44. No-contrib refusal: 19 named. All verified against the briefs on 2026-09-22.
