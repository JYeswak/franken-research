# Cross-suite synthesis: franken_agent_detection

**Date:** 2026-09-22. **Scope:** own packet (`franken_agent_detection-assessment.md`, fully read) against all 43 sibling assessments (skimmed across TL;DR, claim inventory, verdict/TRL/NODUS ring, benchmark sections, limitations, license/governance, and CI evidence). **Rule:** every claim below is grounded in packet evidence; quotes carry their packet tier labels. No facts invented.

---

## 1. Own-packet distillation

**What it is.** `Dicklesworthstone/franken_agent_detection` is a Rust detection/transcript-normalization library: 34 detection slugs, 32 scan connectors, 32 transcript fixtures, and a normalized-conversation layer (`NormalizedConversation`, `Origin`, `SourceKind`, `PathMapping`) that discovers installed AI agents, mirrors their session stores, decrypts ChatGPT Desktop's AES-256-GCM conversation store, and normalizes transcripts across vendors. Created 2026-02-16 [External, High]; pinned commit `026f60b28784ca77c5b8e47e3dba9b22d154b4d9` (2026-09-22) [Git-observed, High].

**One-line verdict (packet):** "a published and downstream-consumed Rust detection/transcript-normalization library whose drift/evidence machinery is unusually concrete, but whose README describes only the detection layer and contradicts the connector implementation [Code-verified, High]." **TRL 6; NODUS Pilot** [Inference, Medium].

**License:** "MIT, 21 lines, **no rider** — read verbatim [Code-verified, High]" — "The only FrankenSuite repo assessed to date without the OpenAI/Anthropic rider."

**Three most important evidence items (with tiers):**

1. **Genuine distribution:** crates.io release (v0.3.0) with **21,189 downloads**; GitHub Release v0.3.0 (2026-09-16) [External, High]. Caveat from the packet: 17,753 of those downloads are old 0.1.x versions — "the signature of CI systems pinning versions rather than a user base upgrading [External, High on the numbers; the churn reading is Inference, Medium]."
2. **Documented downstream consumer:** CASS (1,127 stars [External, High]) "discovers sessions from 26 agent harnesses through this crate [Maintainer claim, Medium]" — "the only FrankenSuite repo with a documented downstream integration (CASS) [Inference, Medium]."
3. **Unusually concrete evidence machinery:** 1,226 tests including `registry_tables_agree_exactly` [Counted, High]; 16 transcript fixtures wired to schema-conformance validators; zero `unsafe` under `#![forbid(unsafe_code)]` [Counted, High]; a scan-budget discipline (100 MB cap, root scoping, bounded workspace caches) [Code-verified, High]; historical parser diffs retained in `.github/patches/` as review artifacts [Code-verified, High]; and a CHANGELOG honesty block: "If you expect releases that do not exist, do not invent them."

**Strongest strength.** The evidence discipline plus real distribution: "the FrankenSuite's only genuinely distributed library — a published, downloaded, downstream-consumed crate whose evidence discipline (tests, fixtures, ledgers, honest changelogs) is the best in the program [Code-verified, High]."

**Strongest ceiling.** The README/product mismatch plus single-point-of-everything: "README/mod.rs say '15 connectors'; the tree has 34 registry slugs and 32 scan connectors [Code-verified, High]" and the README's "Limitations: Installation detection only; no session parsing or indexing" is contradicted by `Connector::scan`, normalized transcripts, and SQLite bridging [Code-verified, High]. Compounding: "the main CI job at the pin dies at `cargo fmt` before a single one of the 1,226 tests executes [CI-observed, High]"; "explicit no-outside-contributions policy — every fix is written by the maintainer, so the review depth equals one person's judgment [Maintainer claim, High]"; and the treadmill — "the connector zoo is a treadmill with no finish line [Inference, Medium]."

**Open questions carried forward.** (a) What share of the 1,226 tests exercise *current* vendor store formats versus legacy fixtures — a connector-currency audit is missing. (b) A head-to-head with `car-external-agents` (the fresher rival, 22k+ crates.io downloads [External, High]) "would be valuable" but was not run. (c) The analyst did not compile or execute tests, fixtures, or the decryption path.

---

## 2. Shared negative patterns

These are failure modes FAD shares with other packets — each with the sibling evidence that grounds the comparison.

**P1 — CI red at the pin, dying at a lint gate before any substantive test executes.** FAD's main CI dies at `cargo fmt` before the 1,226 tests run [CI-observed, High]. The same shape is found in:

- **frankenredis:** "the latest push-triggered conformance run (#7679, Sep 20) failed at the `cargo fmt` gate with 30 files needing rustfmt; all substantive gates (deny, unit, conformance, stress, stress-injection, docs) were skipped" [CI-observed, High].
- **frankensympy:** "pin fails at the `fmt` gate — the only 'gate' that ever runs. Unit tests, doc tests, conformance tests, and coverage all skipped... 786 consecutive build-and-test runs failed" [CI-observed, High].
- **franken_node:** "All 8 push-triggered runs are red... CI runs tests, tests fail" [CI-observed, High].
- **franken_engine:** "All 46 of its CI runs fail... Zero green runs on the pin's commit" [CI-observed, High].
- **franken_numpy:** "G1 clippy gate red (6 errors)... 'CI badge claims green'" [CI-observed + Code-verified, High].

The suite-wide signal: a lint gate is where most pins die, and badges/READMEs frequently describe a CI state that does not exist at the pin. FAD's distinction is *honesty about the split* — its packet reports the red lane rather than hiding it, and a narrow 7-test exclusions workflow was observed green on Ubuntu and Windows [CI-observed, High].

**P2 — README-vs-code drift: status text contradicted by the tree.** FAD's is the most structural case ("detection only" disproven by the connector layer), but the pattern is suite-wide:

- **franken_jax:** "README overclaims by ~37% (118 vs 162 primitives)" [Counted, High].
- **franken_threed:** "The status table says 'no compiler, no renderer, no CLI, two crates' — a working (if shallow) compiler slice, one rendered frame, no CLI, and four crates are in the tree" [Code-verified, High].
- **franken_networkx:** "README drift source (13-variant tie-break → 12 counted)" [Counted, High].
- **frankensqlite_website:** "README asserts the site is the source of truth and names a '26-crate' workspace — but the snapshot contains 28 workspace crates (its own `scripts/` enforce the 26-crate count, meaning the repo fails its own CI at HEAD)" [Code-verified, High].
- **frankensympy:** "'green workspace tests' and 'all builds passing' claims are stale by a month — the pin fails at the fmt gate" [CI-observed, High].

**P3 — No independent validation; the only evidenced consumer is the maintainer's own project.** FAD: "the only evidenced consumer is the maintainer's sibling project [Maintainer claim, High]" and "crates.io reverse-dependencies show no external dependents [External, High]." Shared with **franken_ocr** ("zero independent validation of any kind" [External, Medium within recall caveats]), **franken_tts** (same finding), and **franken_whisper** ("no independent benchmark, review, or production deployment found [External, High within recall caveats]").

**P4 — Downloads are distribution, not adoption.** FAD: 21,189 downloads but 17,753 on old 0.1.x — "the signature of CI systems pinning versions rather than a user base upgrading" [External, High on numbers; Inference, Medium on the reading]. Siblings with the same thin traction: **franken_ocr** ("2–81 downloads per binary" [External, High]), **frankenscipy** ("downloads are thin — 11–45 per crate" [External, High]), **frankensnowflake** (0.0.4, "36 downloads" [External, High]). The exception that proves the rule is **asupersync** (318k downloads, "78 reverse deps" — genuine registry traction, though its dependents are also suite-internal).

**P5 — The treadmill: upstream-format drift as permanent maintenance workload.** FAD: "the connector zoo is a treadmill with no finish line [Inference, Medium]" — every new agent is a new store format to reverse-engineer; every vendor dot-release is a silent breakage. Shared shape in **frankensearch** ("'model-revision treadmill': every adapter/embedder change is a user-facing reindex; no migration path, only fail-closed refusal" [Maintainer claim, High]) and **franken_tts** ("single-model expiry is structural — if this model becomes unavailable, the whole product dies" [Inference, High]).

**P6 — The "Claude/Codex may review, but nothing merges" contribution policy.** FAD: "PRs may be *reviewed by Claude or Codex* via `gh` and then independently reimplemented — an irony the packet returns to in §4.8 [Maintainer claim, High]." Identical wording in **franken_nlp** ("I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them. It's my name on the thing." [Maintainer claim, High]) and **frankentui_website** ("About Contributions: PRs are not merged directly — author reviews via `gh` with Claude/Codex and decides independently" [Maintainer claim, High]). **franken_ocr** "explicitly accepts no outside contributions." The shared consequence is bus factor 1 with agent assistance but no agent integration — see §4.

**Not shared:** FAD's README *under*-claiming its own product (describing a tenth of the crate and contradicting the rest) is the inverse of the suite's usual over-claim drift. It is honesty by understatement, but it is still drift.

---

## 3. CI/evidence bar — what FAD demonstrates that most of the suite lacks

These are practices FAD's packet verifies in code, paired with the siblings that demonstrably lack them. Where a sibling *has* the practice, that is stated explicitly — the bar is relative, not universal.

**E1 — Distributed artifact.** crates.io published (0.3.0), 21k downloads, docs.rs docs, GitHub release — all [External, High]. Lacked by: franken_engine (no release artifact at pin), franken_node (no release artifact at pin), franken_overlap (zero releases), frankenjax (zero GitHub releases, no CI at all), frankentorch (no releases, no tags), frankengraphdb (no release), franken_nlp (no tags, no releases), franken_remote (no release artifact), franken_surveillance_system (zero GitHub releases), frankenlibc (no release), franken_alignment (no releases, no tags), franken_code_browser (no tagged release at pin), franken_drone_geometry (no release, no tag). *Shared with:* asupersync, frankensqlite, frankensearch, franken_snowflake, franken_ocr, franken_tts, franken_whisper, frankenterm, franken_markdown — roughly a third of the suite publishes; two thirds do not.

**E2 — Multi-table exact-agreement invariant test.** `registry_tables_agree_exactly`: the connector registry, tilde-expansion table, canonical-slug map, and factory registry must agree *exactly*; the build fails on drift [Code-verified, High]. No other packet documents a direct twin. The nearest cousin is **frankengraphdb**'s `claims_enforcement_ledger_control` ("asserts the exact key set of enforced clauses so demoting a live clause fails loudly" [Maintainer claim + Code-verified, Medium]) — a claim-registry key-set assertion, not a multi-table agreement check. **frankensympy** binds claims.toml to an xtask gate but has no key-set agreement assertion.

**E3 — Discover-before-parse plus bounded scan budgets.** `discover_source_files` inventories artifacts before any parser runs (a corrupt parser cannot hide missing data); the scan is capped at 100 MB with root scoping and bounded workspace caches [Code-verified, High]. No other packet documents a scan-budget discipline. Relevant contrast: **franken_surveillance_system** is evidence-native (video events, plate reads, intrusion markers) yet "nothing signs, nothing hashes, nothing is content-addressed."

**E4 — CHANGELOG release-vs-tag honesty block.** "'If you expect releases that do not exist, do not invent them' — the CHANGELOG's honesty block on release vs. tag." The canonical counterexample is **frankentui** ("CHANGELOG's v0.9.0 release notes (2026-09-08, '9/9 test files, All 9 passing') are a phantom: no v0.9.0 tag, no GitHub release — likely moved from the beads DB, unverified" [Code-verified, High]); **franken_whisper**'s CHANGELOG "is 4 weeks stale." No other packet documents this explicit block.

**E5 — No performance thesis, so nothing stale to disavow.** FAD makes no benchmark claims, and its packet treats this as honest abstention. *Shared with* **frankensqlite** ("No numeric performance result is claimed for current main" [Maintainer claim, High]). Notable because siblings keep stale tables: **frankenredis** disavowed its own benchmark table; **franken_numpy**'s "benchmarks are 97% non-contract by its own audit."

**E6 — Honest split signal at the pin.** FAD's packet reports the red main-CI lane *and* the green exclusions lane rather than collapsing to one story. The closest two-tier cousin is **frankengit** (its packet matches the two-tier-CI honesty pattern). Compare **frankensympy**, where nothing at the pin runs at all.

---

## 4. Shared hurdles

These are constraints FAD faces together with the suite — the conditions under which any advancement must happen.

**H1 — Bus factor 1, by explicit policy.** FAD: "explicit no-outside-contributions policy — every fix is written by the maintainer, so the review depth equals one person's judgment [Maintainer claim, High]." The same policy wording appears in franken_nlp, frankenpandas, and frankentui_website (see P6); franken_ocr "explicitly accepts no outside contributions." Across all 44 packets, no repo shows a second committer at the pin. The hurdle is not personnel — it is structural: every connector-format breakage queues behind one person's judgment, and FAD's treadmill (P5) makes the queue permanent.

**H2 — No second independent consumer.** FAD's only evidenced consumer is the maintainer's sibling project (CASS) [Maintainer claim, High]; crates.io shows no external reverse dependencies [External, High]. Suite-wide, frankensearch has "no independent user... documented," and asupersync — the suite's most-downloaded crate — has dependents that are also suite-internal. Advancement to Invest requires an arm's-length adopter; the suite has no documented mechanism for earning one.

**H3 — Main CI red at the pin (see P1).** Before any of the 1,226 tests can attest to correctness, the `cargo fmt` gate must pass. FAD shares this with frankenredis, frankensympy, franken_node, franken_engine, franken_numpy, and frankensnowflake. The hurdle: the suite's evidence machinery is documented to exist but frequently not observed to run.

**H4 — Documentation drift (see P2).** FAD's README misdescribes the product; siblings misdescribe status tables, primitive counts, crate counts, and CI health. Any cross-suite index (NODUS, a claims registry, a capability catalog) built on README text inherits this drift — which is why the mechanical fixes in §6-IN matter more than editorial ones.

**H5 — Upstream-format treadmill (see P5).** FAD's connector zoo, frankensearch's model-revision treadmill, franken_tts's single-model expiry: the suite repeatedly builds products whose correctness surface is owned by someone else's release cycle, with no migration path — only fail-closed refusal or silent breakage.

**H6 — The license rider is an *inverted* hurdle here.** FAD is the one repo whose license bars *nobody* — yet it still has zero external adopters. That finding constrains the suite-wide thesis that the OpenAI/Anthropic rider is the binding adoption ceiling: for FAD, distribution channels (crates.io + docs.rs) and README honesty are the tighter constraints. Meanwhile, three repos achieve rider-free status by having *no grant at all* — frankensim_website ("the *assertion* of MIT without the *grant* of MIT"), frankensqlite_website ("no license grant at all — default all-rights-reserved, which is *more* restrictive than the engine's MIT+AI-lab rider"), and the beads trackers — the worst of both postures.

---

## 5. Genuine uniqueness

Only claims verified against all 44 packets survive here. Each carries its caveats inline.

**U1 — The only verbatim, rider-free license grant in the suite.** "MIT, 21 lines, no rider — read verbatim [Code-verified, High]"; "The only plain-MIT (rider-free) license in the FrankenSuite [Code-verified]." Caveats: **franken_native_capsule**'s posture is `license = "MIT"` as one word of Cargo.toml metadata — "declared-MIT, text-absent" [Code-verified, High], which its own packet calls un-clearable by any license intake; **frankensim_website**, **frankensqlite_website**, and the two beads trackers have no license text at all. FAD is the sole repo with a complete, restriction-free grant.

**U2 — The only component that normalizes transcripts across 32 agent connectors while detecting 34 installed-agent slugs.** Both counts [Counted/Code-verified, High]. No other packet spans multiple agent products; the rest of the suite implements single-product surfaces.

**U3 — The only repo that decrypts ChatGPT Desktop's AES-256-GCM conversation store as part of its normalization layer** [Code-verified, High]. A suite-wide grep for AES-256-GCM/ChatGPT-decryption evidence finds no second instance in any of the other 43 packets.

**U4 — The only per-artifact transcript-provenance substrate.** `Origin`, `SourceKind`, and `PathMapping` types give every artifact a typed origin, source kind, and path mapping [Code-verified, High]. Siblings use "provenance" to mean claim ledgers (frankengraphdb, franken_alignment, frankensearch's receipts); none has an artifact-provenance *type schema*. (franken_snowflake's `data_source` envelope field and frankensearch's per-result `source_path`/`data_source` are untyped metadata, not a substrate.)

**U5 — The only documented end-user-application downstream integration.** "CASS (1,127 stars [External, High]) discovers sessions from 26 agent harnesses through this crate [Maintainer claim, Medium]" — "the only FrankenSuite repo with a documented downstream integration (CASS) [Inference, Medium]." Caveats: the claim's own tier is Medium; CASS is the maintainer's sibling project; and **asupersync** has suite-internal crate dependents with 318k downloads. The CASS mentions in franken_code_browser, franken_numpy, and frankensearch refer to CASS as the maintainer's *internal tooling* (session search), not as a consumer of their code — none of them documents a Cargo edge. FAD's integration is the sole documented consuming application.

**U6 — The exact multi-table registry-invariant pattern** (`registry_tables_agree_exactly`). No direct twin found in 43 packets; the nearest cousin is frankengraphdb's `claims_enforcement_ledger_control` (a claim-clause key-set assertion, not multi-table agreement).

**U7 — The token-extraction primitive.** "per-agent token accounting is infrastructure the agent era currently lacks [Inference, High]" [Code-verified on the mechanism, High]. No other packet has a token-usage extraction mechanism.

**U8 — The discover-before-parse / scan-budget discipline.** No other packet documents a scan-budget discipline or a discover-source-files-first inventory step.

**Explicitly NOT unique (to prevent over-claiming):** zero `unsafe` under `#![forbid(unsafe_code)]` is shared with ~35 sibling repos; fixture discipline has strong cousins in frankensympy (230-fixture admission corpus), franken_ocr (truth packs), and franken_networkx (drift-failing ledgers); crates.io publication is shared with roughly a third of the suite (§3-E1); and the bus-factor-1 policy is universal.

---

## 6. Cross-pollination IN — what FAD should adopt, from whom

Format: `concept → origin project(s) → why it fits → expected payoff`.

1. **Machine-wired README claim discipline** (`claims.tsv` mapping every README claim to machine-checkable keys + `check-claim-discipline.sh` that fails the build on drift) → **franken_markdown** → FAD's #1 weakness is README-vs-code drift ("15 connectors" vs 34 slugs; "detection only" disproven by code [Code-verified, High]) — the exact failure mode this machinery prevents; franken_markdown's packet calls it the fix for claims that drift while the tree moves → the build fails when connector counts or scope statements drift from the registry; closes FAD's top skeptic finding mechanically instead of editorially. [Markdown mechanism Code-verified, High]

2. **cargo-tree dependency-admissibility gate** (`scripts/check-dependency-admissibility.py` runs `cargo tree` across ~21 feature lanes and fails the build if a forbidden crate appears) → **franken_snowflake** → FAD has 14 optional connector features and a runtime-neutral posture ("no Tokio") that is currently a documented policy, not a machine-checked gate; franken_snowflake's packet shows the same class of claim *proven* by the lock file rather than promised in a README [Verified, High] → a forbidden dep (e.g. Tokio) landing in any connector feature lane fails the build; the dependency diet becomes evidence, not aspiration. [Snowflake gate Verified, High]

3. **Hash-pinned truth packs** (real artifacts + known-good ground truth as the corpus contract; discrepancy ledgers fail CI on drift — "the most disciplined dataset-construction discipline seen in the program to date" [Code-verified, High]) → **franken_ocr** → FAD's 16 transcript fixtures are the truth-pack seed, and its treadmill problem ("each vendor dot-release is a silent breakage [Inference, Medium]") is exactly what truth packs convert into a mechanical canary → vendor format drift is detected at fixture-update time, not via user reports; directly answers FAD's open question (a) on connector currency. [OCR mechanism Code-verified, High]

4. **Claim-coverage audit** (self-report of which KEEP claims have live proof — e.g. "self-reports 66.7% KEEP-claim coverage (12/18 claims) without a live incumbent ratio" [Code-verified, High]) → **franken_mermaid** → FAD's 1,226 tests are impressive but unmapped to *current* vendor formats; a coverage audit showing which connector paths are exercised against fresh vs legacy fixtures produces the honest currency map open question (a) asks for → same payoff as #3 through a cheaper, audit-style mechanism. [Mermaid mechanism Code-verified, High]

5. **AGENTS.md bound to a claims registry** ("agents operate under the same discipline (AGENTS.md binds agents to the claims registry, and past convention required that `code-review` agent use it)" [Code-verified, High]) → **frankensympy** → FAD's contribution policy already routes reviews through Claude/Codex via `gh` [Maintainer claim, High]; binding those agents to the claims registry keeps treadmill work (new connectors, slug-registry edits) governed by the same rules the maintainer enforces → agent-assisted connector additions can't drift the registry silently; the ironies in §4.8 of the FAD packet become a managed channel. [Sympy mechanism Code-verified, High]

6. *(Conditional)* **Same-invocation benchmark doctrine** ("all A/B runs happen in the same process invocation — the most honest benchmark methodology seen in the program") → **franken_whisper** → only applies *if* FAD ever runs the car-external-agents head-to-head its open question (b) asks for; FAD currently makes no performance thesis, so this is a standing doctrine to adopt at benchmark time, not before. [Whisper doctrine Code-verified, High]

---

## 7. Cross-pollination OUT — what the suite should take from FAD

Format: `concept → target project(s) → why it fits → expected payoff`.

1. **Exact multi-table registry-invariant test** (`registry_tables_agree_exactly`: every table governing one domain must agree exactly; the build fails on drift) → **franken_networkx** (its 5 auto-generated ledgers already fail CI on drift — the multi-table agreement test is a drop-in upgrade from drift *detection* to drift *prevention*) and **frankensympy** (claims.toml bound to an xtask gate with no key-set agreement assertion) → both have multi-registry governance surfaces with documented drift findings; FAD's pattern closes the exact gap their ledgers expose → omissions and cross-table inconsistency fail the build instead of surviving until a human reads a ledger. [FAD mechanism Code-verified, High; targets' ledger surfaces Code-verified, High]

2. **CHANGELOG release-vs-tag honesty block** ("If you expect releases that do not exist, do not invent them") → **frankentui** (its CHANGELOG's v0.9.0 notes are "a phantom: no v0.9.0 tag, no GitHub release" [Code-verified, High]) and **franken_whisper** (CHANGELOG "4 weeks stale" [Code-verified, High]) → both packets show exactly the failure FAD's one-paragraph block prevents → phantom releases stop entering the public record; staleness becomes a visible, ownable gap rather than silent rot. [FAD mechanism Code-verified, High]

3. **Discover-before-parse plus scan budgets** (inventory artifacts before any parser runs; 100 MB scan cap, root scoping, bounded workspace caches) → **franken_surveillance_system** (evidence-native — video events, plate reads, intrusion markers — with the largest unscoped ingestion surface in the suite, yet "nothing signs, nothing hashes, nothing is content-addressed") → FAD's discipline ports directly to sensor corpora: inventories survive parser failures, and root scoping + caps bound time and memory on unscoped data → artifact inventories are preserved even when a parser fails, and ingestion can't silently consume unbounded resources. [FAD mechanism Code-verified, High; surveillance ingestion surface Code-verified, High]

4. **Per-artifact provenance types** (`Origin`/`SourceKind`/`PathMapping` as a typed substrate, not metadata strings) → **franken_ocr** (its truth-pack corpus artifacts could standardize per-artifact origin typing) and **frankensearch** (per-result provenance exists as untyped `source_path`/`data_source` metadata) → both produce evidence-bearing artifacts from heterogeneous sources and would gain a shared, typed answer to "where did this artifact come from" → a cross-suite standard semantics for artifact origin, portable across every corpus-ingesting tool. [FAD mechanism Code-verified, High; fit Inference, Medium]

5. **Per-agent token-extraction metering substrate** → **frankenterm** (an "agent-fleet control plane (missions, policy, Robot Mode)" that commands agent CLIs) → per-agent token accounting is the exact cost-metering primitive a fleet control plane needs for missions; FAD already built it ("per-agent token accounting is infrastructure the agent era currently lacks [Inference, High]") → Robot Mode missions gain per-agent cost accounting without frankenterm building the substrate from scratch. [FAD mechanism Code-verified, High; fit Inference, Medium]
