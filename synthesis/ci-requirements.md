# CI Requirements: Mechanism vs Execution at the Pin

Every row separates two questions: **does the evidence machinery exist in the tree?** and **did public CI demonstrably run it against the assessed commit?** A "yes" to the first is not a "yes" to the second. Categories: **C1** public CI green at pin · **C2** public CI red at pin · **C3** CI exists, no pin verdict (stale/absent-at-pin) · **C4** no test CI / deploy-only · **C5** CI disabled or deleted · **C6** private-only verification (DSR/RCH/self-hosted), unobservable. Unless noted, claims in this document carry [CI-observed, High].

## C1 — Public CI green at pin: 2/44

| Project | Pin verdict | Machinery that exists |
|---|---|---|
| frankenscipy | Gates G1–G9 success at the pinned commit [CI-observed, High] | G7 artifact-schema + evidence-pack validation, G8 RaptorQ decode-proof verification, full-workspace registry publication [Verified, High] |
| franken_threed | "Marching cubes integration" run 2026-09-22T15:10Z concluded success at the pin [CI-observed, High] | Differential harness (2,048-case sweep vs pinned three.js oracle, `sameEffect`/`sameArrays`) [Verified, High] |

franken_threed is additionally the only packet with analyst-executed behavioral reproduction (61/61 tests re-run by the analyst in ~21 s) [Verified, High].

## C2 — Public CI red at pin: 11/44

| Project | Pin verdict | What failed |
|---|---|---|
| franken_agent_detection | Main CI dies at `cargo fmt` before any of 1,226 tests run [CI-observed, High] | Registry-invariant tests that fail the build on slug drift — exist, never executed at pin [Verified, High] |
| franken_engine | `native-runtime.yml` run #35550128941 (head = pin): all 3 jobs failed; all 46 recorded runs of the workflow fail — never green [CI-observed, High] | 28-claim matrix with per-claim `repro.lock`, wording downgrade, freshness decay — exists; named quality/perf workflows had zero runs [Verified, High] |
| franken_lean | `ci` run `35746280136` (head = pin): failure, 11 of 30 steps failing [CI-observed, High] | `anchor:`/`expect=` contracts, bidirectional unsafe-note Clippy census — the census passed *inside* the red gate [Verified, High] |
| franken_node | 8/8 push runs against the pin's head SHA failed [CI-observed, High] | Signed honesty manifest, `check_claims_manifest.py --check-honesty` (analyst-executed: 9 ok, 0 drift), verifier SDK, mutation floor [Verified, High] |
| franken_numpy | Run 35730374809 (head = pin): G1 fails at `cargo clippy -- -D warnings`; G2–G9 skipped; README badge still reads "G1 green" [CI-observed, High] | 67,641-line negative-evidence ledger, differential conformance vs live NumPy oracle [Verified, High] |
| frankenredis | Conformance run #7679 failed at the G1 `cargo fmt` gate (all substantive gates skipped); Tcl-lane scheduled run #284 failed at verdict verification [CI-observed, High] | Redis Tcl lane (5,041 probes), proof bundles, 499 MB fuzz corpus, per-optimization PROOF.md [Verified, High] |
| frankenlibc | Pin's main CI run #8942: Core Gates failed on its first step (`scripts/ci.sh`); all substantive jobs skipped [CI-observed, High] | 41,205-line negative-evidence ledger [Verified, High] |
| frankensympy | Build-and-test gate failed 786 consecutive runs (last green 2026-08-23); pin fails at the fmt gate, unit tests never run [CI-observed, High] | 1,127 counted tests; "55/55 proof-kernel" claim rests on machinery that never executes [Verified, High] |
| frankentorch | Flagship `phase2c-reliability-gates` run #35731363456 failed in ~55 s at the pin [CI-observed, High] | Differential harness, 42,708-line negative-evidence ledger, DAC machinery [Verified, High] |
| frankenfs | Main workflow failing at HEAD (pin) [CI-observed, High] | Tagged v0.2.0 release; second "Artifact Gates" workflow green at HEAD — a narrow green lane inside a red project [Verified, High] |
| frankenpandas | Live-oracle conformance job and `--all-features` lint red at pin (latest run: conformance red, 15/19 jobs green); `fuzz-nightly` red on last 5 runs [CI-observed, High] | Certified lanes with A/A controls, bootstrap CI, ELF pinning, full-funnel verdict aggregation (FASTER 201 / SLOWER 20 / NULL_UNDECIDABLE 74 / DROPPED_HIGH_CV 62 / PARITY 2) [Verified, High] |

Recurring failure shape: lint/format gates (fmt, clippy) fail first and every substantive gate behind them is skipped — red CI here usually means "unexecuted," not "refuted." [Inference, High]

## C3 — CI exists, no pin verdict: 6/44

| Project | Evidence | Note |
|---|---|---|
| franken_networkx | 7,723 runs; latest green 2026-09-09 — 13 days before the pin [CI-observed, High] | Executable claim-coverage audit, five drift-failing ledgers, Gauntlet — all exist; AGENTS.md declares Actions "permanently non-authoritative… must stay disabled" while Actions is live [Verified, High] |
| asupersync | Zero workflow runs at the pin's head SHA; two latest runs (2026-09-07, older commits) fail at the tokio-parity drift gate [CI-observed, High] | Committed statistical baseline gate (`methodology_baselines` + 105-row `artifacts/baseline.json`) — the drift gate demonstrably fired, on drifted artifacts [Verified, High] |
| franken_manim | 87 workflows; main `ci.yml` at 1,500 runs; per-run pass/fail not fully legible from text scraping — pin greenness unestablished [CI-observed, Medium] | 2,483-row Parity Ledger, PG-5 bit-identical self-goldens, merge-blocking gates claimed [Verified, High] |
| franken_remote | Zero check-runs at the pin; recent `rust-verification.yml` failures [CI-observed, High] | 36 workflows (per-slice verify + docs-integrity + source-maintenance lanes) exist; receipts rest on RCH remote execution [Verified, High] |
| franken_snowflake | Latest run #140 (2026-09-13) red; no run on the HEAD commit; AGENTS.md: "This repository never uses GitHub Actions" — prohibition already enforced once (workflow deleted at v0.0.3 after 52 parse-failed runs), now contradicted by 140 runs [CI-observed, High] | Dependency-admissibility gate passed on all three OS jobs (a narrow green lane); `cli live,mcp` lane red [Verified, High]. The brief's pattern title says "red at the pin"; the evidence supports "red latest, no pin run" — filed here, tension stated. |
| frankengit | 78 CI workflows, 54 E2E suites; per-run pass/fail not legible from text scraping — pin greenness unestablished [CI-observed, Medium] | Auto-demoting claims registry, fail-closed dormant lanes (exit 3), Lean 4.32.0 proof lane — exist; the registry's enforcement loop "runs in the maintainer's process, not observed by the analyst" [Verified, High] |

## C4 — No test CI / deploy-only: 11/44

| Project | Evidence |
|---|---|
| franken_code_browser | `.github/` holds only issue templates; no workflows [Verified, High] |
| franken_whisper | No `.github/` directory; no CI config in the tree [Verified, High] |
| frankenjax | Zero GitHub Actions workflows; all "green" claims execute on the maintainer's RCH fleet, attested only by checked-in artifact JSON [Verified, High] |
| franken_native_capsule | No CI; no `.github/` directory; 10 test functions read, not executed [Verified, High] |
| franken_markdown_website | No CI; no `.github` directory; deploys are manual `wrangler pages deploy` [Verified, High] |
| frankensim_website | No CI at all [Verified, High] |
| frankensqlite_website | No CI workflows; 158 counted test call sites with no gate [Verified, High] |
| frankentui_website | Zero GitHub Actions; Playwright E2E + perf assertions run locally or not at all [Verified, High] |
| beads-for-frankentui | CI does nothing but deploy: 35 success / 22 cancelled / 0 failed across 57 runs; pin's run green — tests nothing [CI-observed, High] |
| beads_for_franken_engine | CI is only the stock Pages deploy; both deploy runs green at the pin; content frozen 197 days [CI-observed, High] |
| frankenmermaid | Pages deploy only; the 11 declared gates in `.ci/quality-gates.toml` have no visible enforcement point [Verified, High] |

## C5 — CI disabled or deleted: 8/44

| Project | Evidence |
|---|---|
| franken_nlp | Actions API returned `enabled=false`; workflow inert (`on: {}`); DSR build authority BLOCKED [Verified, High] |
| franken_overlap | Deliberately disabled: `ci/github-actions-disabled/ci.yml.disabled` — "validated on owner-controlled machines"; owner-local `scripts/ci-local.sh` [Verified, High] |
| franken_markdown | Sole GitHub Actions workflow explicitly DISABLED (`if: ${{ false }}`); README's "CI fails if it drops" language is stale; enforcement runs through DSR on the maintainer's host [Verified, High] |
| franken_ocr | Workflows deleted from the tree at HEAD; Actions API lists 1,006 historic runs, zero current workflows; latest runs (2026-09-03) failed [Verified, High] |
| frankentui | GitHub Actions disabled 2026-09-06; verification on maintainer-private DSR [Verified, High] |
| frankengraphdb | 2026-09-03 owner ruling: workflows `workflow_dispatch`-only (de-automated) [Verified, High] |
| frankensearch | 7 of 8 GitHub Actions workflows `disabled_manually` (Actions API, 2026-09-22) [CI-observed, High] |
| frankensqlite | README's CI badge links to `verification-gates.yml`, which GitHub reports as `disabled_manually` [CI-observed, High] |

## C6 — Private-only verification, unobservable: 6/44

| Project | Evidence |
|---|---|
| franken_alignment | No GitHub Actions by design; quality gates run operator-local via Cargo + DSR; source-hash receipts retained; failures retained (including a self-disqualification) [Verified, High] |
| frankensim | README declares GitHub Actions *non-authoritative*; the maintainer's private DSR runner is the real verification source; committed suite receipt is stale and not-green (7,621 pass / 95 fail / 38 ignore, dirty tree, 2026-08-01) [Verified, High] |
| frankenterm | `.github/` contains only `dependabot.yml`; verification on maintainer-controlled RCH hosts, not independently inspectable [Verified, High] |
| franken_surveillance_system | DSR-first qualification; GitHub CI demoted to "portable supplementary specification" [Verified, High] |
| franken_drone_geometry_reconstruction | Single self-hosted workflow; all 324 observed runs queued/cancelled including the pin run; no green demonstrated [CI-observed, High] |
| franken_tts | No `.github/` in tree; the CI that gates the 11 releases runs off-tree on owner infrastructure; per-run status unverifiable by any outside party; `docs/CI_AND_GATES.md` describes a workflow file that does not exist [Verified, High] |

## Cross-cutting notes

- **Mechanism-exists ≠ executed.** The five sharpest instances: `franken_lean`'s unsafe census passing inside a red gate; `franken_markdown`'s claim-discipline gate living on DSR while the in-tree workflow is disabled; `franken_engine`'s quality/perf workflows with zero runs; `franken_manim`'s merge-blocking self-goldens with pin greenness unestablished; `frankengit`'s auto-demoting registry whose enforcement loop is maintainer-local. [CI-observed, High]
- **Narrow green lanes do not make a project green.** frankenfs (Artifact Gates green at HEAD, main lane red), franken_snowflake (dependency-admissibility gate passed 3/3 OSes, `cli live,mcp` lane red), frankenpandas (15/19 jobs green, conformance job red), franken_node (honesty manifest re-verified by the analyst, pin CI red). [CI-observed, High]
- **The maintainer's own rule:** frankensim's AGENTS.md Rule 0.1 ("VALUE DELIVERY OVER PROCESS: NO PROCESS PORN") names the failure mode — "Process is never the product unless the user explicitly asks for process work" — while the tree keeps building machinery [Maintainer claim, High]. franken_lean's packet generalizes it: "gates scale where reviewers don't, but only the gates that actually run count" [Inference, High].
