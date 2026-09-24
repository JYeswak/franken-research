# Negative Patterns (cross-suite)

Patterns that recur across the 44 packets, with exact counts where directly tallied. Tiers: [Verified], [CI-observed], [Maintainer claim], [External], [Inference] + High/Medium/Low. Where a count could not be reconciled, none is given.

## P1 — Bus factor 1: 44/44 [Verified, High]

Every packet reports a single human maintainer (Jeffrey Emanuel / Dicklesworthstone) with no second committer, no foundation, no succession plan. This is the one truly universal structural fact in the corpus. It is distinct from P3: bus factor is observed from commit authorship; P3 is a stated policy.

## P2 — The OpenAI/Anthropic license rider: 38/44 [Verified, High]

38 packets carry the non-OSI MIT+OpenAI/Anthropic rider, which withholds all rights — including benchmarking, testing, analyzing, and indexing — from OpenAI, Anthropic, their affiliates, and anyone acting for them; breach typically means automatic termination plus a duty to destroy all copies (e.g. frankensim, frankenpandas). Exceptions: `franken_agent_detection` is plain MIT with no rider (1/44), and five repos have no LICENSE / no operative grant (5/44): `beads-for-frankentui`, `beads_for_franken_engine`, `franken_native_capsule`, `frankensim_website`, `frankensqlite_website`. [Verified, High]

The rider was added after plain MIT (no license → plain MIT 2026-01-21 → rider 2026-02-21, then suite-wide enforcement) [Maintainer claim, High]. No direct maintainer rationale or legal-enforceability argument was found in the writing; anti-training intent is [Inference, Medium], not a maintainer statement.

## P3 — Explicit refusal of outside contributions: 19/44 [Maintainer claim, High]

Named: `asupersync`, `franken_agent_detection`, `franken_code_browser`, `franken_lean`, `franken_manim`, `franken_markdown_website`, `franken_nlp`, `franken_ocr`, `franken_snowflake`, `franken_tts`, `frankenfs`, `frankenjax`, `frankenpandas`, `frankensim`, `frankensim_website`, `frankensqlite`, `frankensqlite_website`, `frankenterm`, `frankentui_website`. Canonical wording (frankenpandas README): "I do not accept outside contributions for any of my projects… I'll have Claude or Codex review submissions via `gh`" [Verified, High]. Not inferred from bus factor or contribution files.

## P4 — Documentation/status/evidence drift: 44/44 [Verified, High]

Framed broadly: README-vs-tree, badge-vs-CI, status-page-vs-pin, count staleness, release-note-vs-artifact. Named instance per project:

- asupersync — own drift audit found two hits (ecosystem tagline disproven; baseline.json drift) [Verified, High]
- beads-for-frankentui — drift ledger: 3,696 vs 3,700 counts; stale CHANGELOG file table [Verified, High]
- beads_for_franken_engine — "Live Dashboard" headline vs 197-day-stale data [Verified, High]
- franken_agent_detection — README/mod.rs say "15 connectors"; tree has 34 slugs, 32 connectors [Verified, High]
- franken_alignment — README present-tense/spec marketing vs pinned reality [Verified, High]
- franken_code_browser — IMPLEMENTATION_STATUS.md eight days stale at a ten-day-old tree [Verified, High]
- franken_drone_geometry_reconstruction — README/IMPLEMENTATION_STATUS say "28 members"; tree has 30 [Verified, High]
- franken_engine — "Code Surface At A Glance" table stale on every count one month after verification [Verified, High]
- franken_lean — README "note on tense" confesses present-tense target sold as present state [Verified, High]
- franken_manim — README written in present tense as if the 1.0 design were realized; stale release summary [Verified, High]
- franken_markdown — 146,322 src lines at HEAD vs ~138,500 at the v1 draft's HEAD days apart [Verified, High]
- franken_markdown_website — Lab Notes strip "0.3.5" vs 0.4.2 wired vs 0.4.1 live [Verified, High]
- franken_native_capsule — nonexistent `repository` URL; stale repository URL [Verified, High]
- franken_networkx — README a drift source: tie-break 13→12, fuzz targets 33→34, delegation table, coverage matrix [Verified, High]
- franken_nlp — README/status-surface drift; present-tense problem [Verified, High]
- franken_node — benchmark fixtures reference franken_node "0.9.0" (no such release); v0.1.0 targets earlier commit [Verified, High]
- franken_numpy — README badge "G1 green" while CI fails at the G1 clippy gate at the pin [CI-observed, High]
- franken_ocr — v0.8.0 badges vs v0.9.0 reality; "13–17 MB" binaries are 20.6–28.5 MB [Verified, High]
- franken_overlap — README present-tense spec; unmeasured superlatives [Verified, High]
- franken_remote — README "Develop and verify" stale on structure [Verified, High]
- franken_snowflake — badge "read + write live-success" vs `in_progress` proof bead [Verified, High]
- franken_surveillance_system — README "does not yet acquire camera feeds" contradicted by shipped code [Verified, High]
- franken_threed — README claims "no implementation" on a 217k-line tree [Verified, High]
- franken_tts — README still lists killed speculative-drafting in payoff; badge 0.1.9 vs Cargo.toml 0.1.10 [Verified, High]
- franken_whisper — repo description "107K lines, 2000+ tests, zero unsafe" vs 365,978 lines and 33 unsafe blocks; CHANGELOG scope ends 2026-08-24 [Verified, High]
- frankenfs — CHANGELOG scope window ends 2026-08-19, HEAD 2026-09-22; parity/manifest staleness [Verified, High]
- frankengit — crate count 47→49 and LOC drift between packet drafts days apart; lockfile newer than profile doc [Verified, High]
- frankengraphdb — README-vs-code drift class [Verified, High]
- frankenjax — README contradicts tree: 118 vs 162 primitives, 15 vs 17 crates [Verified, High]
- frankenlibc — (drift instances documented in packet §4; badge/status vs pin) [Verified, High]
- frankenmermaid — README internally inconsistent [Verified, High]
- frankenpandas — four README spots stale; two DISCREPANCIES.md entries stale [Verified, High]
- frankenredis — README counts 13 crates vs 16 at pin; "every component forbids unsafe" false [Verified, High]
- frankenscipy — README says 10,056 tests (10,174 counted); "not yet published" vs published [Verified, High]
- frankensearch — AGENTS.md still says "Tantivy BM25", stale since the 2026-09-01 Quill ruling [Verified, High]
- frankensim — 880 tracked test files vs 1,082 on disk 11 hours after inventory regeneration [Verified, High]
- frankensim_website — copy lags the code [Verified, High]
- frankensqlite — project-structure tree lists `fsqlite-types` at "2,800+ LOC, 64 tests" vs actual [Verified, High]
- frankensqlite_website — "26-crate workspace" vs 28 counted; staleness enforced by its own tests [Verified, High]
- frankensympy — README "green workspace tests" vs 786 consecutive red runs [CI-observed, High]
- frankenterm — count stamps lag core LOC by ~50% (measured by the project's own stamper) [Verified, High]
- frankentorch — drift a structural liability at 6,305 commits [Verified, High]
- frankentui — phantom v0.9.0: CHANGELOG claims release + crates.io 0.9.0; reality v0.8.0 / crates.io 0.7.0 [External, High]
- frankentui_website — "12 Workspace Crates" vs kernel's 20 at HEAD; "V0.1.1 Alive on Crates.io" is February truth [Verified, High]

The program's own counter-machinery (franken_markdown's `claims.tsv` gate, franken_engine's claim matrix, frankengit's auto-demotion, franken_node's honesty manifest) has not stopped the pattern anywhere — including in the projects that built the machinery.

## P5 — CI that cannot certify the pin: 42/44 [CI-observed, High]

Only `frankenscipy` (G1–G9 green at pin) and `franken_threed` (green at pin + analyst rerun) have public CI green at the assessed commit: **2/44**. The other 42 split: red at pin **11/44** (`franken_agent_detection`, `franken_engine`, `franken_lean`, `franken_node`, `franken_numpy`, `frankenredis`, `frankenlibc`, `frankensympy`, `frankentorch`, `frankenfs`, `frankenpandas`); CI exists but no pin verdict **6/44** (`franken_networkx`, `asupersync`, `franken_manim`, `franken_remote`, `franken_snowflake`, `frankengit`); no test CI or deploy-only **11/44**; CI disabled or deleted **8/44** (`franken_nlp`, `franken_overlap`, `franken_markdown`, `franken_ocr`, `frankentui`, `frankengraphdb`, `frankensearch`, `frankensqlite`); private DSR/RCH/self-hosted-only, unobservable **6/44** (`franken_alignment`, `frankensim`, `frankenterm`, `franken_surveillance_system`, `franken_drone_geometry_reconstruction`, `franken_tts`). Narrow green lanes inside red projects (frankenfs's Artifact Gates, franken_snowflake's dependency-admissibility gate, frankenpandas's 15/19 green jobs) do not change the project verdicts. Full matrix in `ci-requirements.md`.

## P6 — Release artifact missing or not covering the pin: 29/44 [External, High]

No release or tag **23/44**: `beads-for-frankentui`, `beads_for_franken_engine`, `franken_alignment`, `franken_code_browser`, `franken_drone_geometry_reconstruction`, `franken_lean`, `franken_nlp`, `franken_native_capsule`, `franken_overlap`, `franken_remote`, `franken_surveillance_system`, `franken_threed`, `frankengit`, `frankengraphdb`, `frankenjax`, `frankenlibc`, `frankensympy`, `frankentorch`, `frankensim`, `franken_markdown_website`, `frankensim_website`, `frankensqlite_website`, `frankentui_website`. Release targets an earlier commit **5/44**: `frankenredis` (v0.1.0, 24 signed assets → `c577c0ae`), `franken_networkx` (v0.2.2, 23 signed assets → earlier commit; PyPI serves 0.2.1), `franken_engine` (v0.1.0, 6 assets → `0a4e9db4`), `frankenpandas` (v0.3.0 releases → earlier tag), `franken_node` (v0.1.0, 6 assets → `08e1edf11`). Phantom release **1/44**: `frankentui` (CHANGELOG's v0.9.0 has no tag, no GitHub Release, no crates.io package).

## P7 — Zero independent validation: 44/44 [External, High]

No packet found a third-party benchmark, code review, or production deployment of the assessed project — within the recall limits of the packet surveys. Partial external signals that are *not* validation: `asupersync` has registry-scale distribution (318,241 crates.io downloads, 78 reverse-dep crate versions — some suite-internal); `franken_agent_detection` has 21,189 downloads and a downstream integration (CASS, same maintainer); several projects show trace downloads/stars (e.g. franken_markdown 104 stars/151 downloads, franken_ocr 2–81/binary, frankenscipy 11–45/crate). Distribution is not validation, and a downstream integration by the same maintainer is not independent.

The maintainer's own writing argues internal guardrails should not be trusted and demands external hard evidence (the 2024 alignment essays) [Maintainer claim, High] — while the suite's negative evidence is almost entirely self-published. Credit the candor; do not treat it as independent validation [Inference, High].

## P8 — Negative-evidence ledger culture (program-wide; exact count declined)

Publishing killed findings is the suite's signature honesty move — largest counted: `franken_numpy` (67,641 lines), `frankenpandas` (44,086), `frankenscipy` (44,078), `frankentorch` (42,708), `frankenlibc` (41,205), `franken_networkx` (37,116), `franken_whisper` (26,846), `frankenredis` (26,485); typed variants: `frankengit` (34 rows, 13 required classes), `frankenmermaid` (726 rows, mandatory A/A nulls); thin end: `franken_surveillance_system` (48 lines). Two briefs estimated 22 and 23 packets; only 9 assessments assert a counted ledger size, so no exact n/44 is published. The ledger is shared culture; the *schema discipline* (required entry classes, prose/TSV correspondence, fail-closed finalizers) is not [Verified, High] — the exact n/44 is declined as unreconciled.

## P9 — Velocity structurally exceeding review depth (named instances)

`franken_engine`: 96 commits in one day, bead journal (3,911 closed) as the only institutional memory. `franken_code_browser`: 206 commits across 2026-09-17→22, peaking at 101 in one day. `frankensim`: 999 commits in its first five days; 6,545 contributions in ~11 weeks. `frankentorch`: 6,305 commits, 6,104 by the maintainer. `frankenpandas`: 8,621 commits with agent co-authorship trailers. `frankenterm`: 21 releases; count stamps lag LOC by ~50% [External, High]. The frankensim packet quantifies the consequence: 202 test files outpaced the honesty inventory in 11 hours — development velocity exceeds audit velocity [Inference, Medium].

## P10 — The agent co-authorship irony (named instances)

The rider bars OpenAI/Anthropic (and anyone acting for them) from the code, while the commit record shows Claude-family co-authorship at scale: `frankenredis` 162/449 recent commits (158 Claude-family); `frankenpandas` 398 `Co-Authored-By` hits (394 Claude-family); `frankenjax` 52/100; `frankentorch` ~45%; `franken_threed` agent-authored at scale with named personas; `franken_numpy` "single human maintainer plus an agent swarm"; `franken_tts` release notes carry "Generated with Claude Code" markers. Exact suite-wide prevalence is declined (trailer conventions lapse; windows differ). The maintainer's writing frames agents as the implementation workforce under human orchestration [Maintainer claim, High]; the rider makes the two leading agent-builders Restricted Parties. Both facts are stated; the tension is not resolved here. [External, High]

## P11 — Sibling-constellation coupling (named instances)

`asupersync` is the suite's runtime substrate: `frankensqlite` runs storage I/O on asupersync 0.5.0; `frankensearch` builds its core on it; `frankensim` locks it via `[patch.crates-io]` with `xtask check-constellation` verifying the sibling's git head; `frankengit`'s lockfile resolves asupersync 0.5.0 while its integration profile plans against 0.4.x; `franken_node` adopts an asupersync transport; `frankensympy` cannot cold-build partly because path deps point at sibling checkouts (`../asupersync`, `../franken_numpy-pin`); `frankenfs`'s ledger failure cascades from a FrankenSQLite bug. `frankenredis` is the deliberate counter-case: it evaluated and *rejected* asupersync [Verified, High]. Single-node cut-set: one maintainer's context switch freezes the substrate under the whole constellation [Inference, Medium].
