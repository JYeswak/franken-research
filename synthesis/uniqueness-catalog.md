# Uniqueness Catalog (44 projects)

One substantive section per project. "Unique" = no other packet/brief in this corpus describes the mechanism — not that no sibling repository contains it. Each section ends with "Also does X" caveats: shared context that must not be mistaken for the distinctive mechanism. Tiers: [Verified], [CI-observed], [Maintainer claim], [External], [Inference] + High/Medium/Low.

## 1. asupersync

- **Committed statistical baseline gate.** The `methodology_baselines` signoff contract plus `artifacts/baseline.json` (105 rows at the pin, per-row environment tagging and layout-hyperparameter capture) make benchmark regression a signed, waiver-free gate [Verified, High]. The gate demonstrably fired: `tokio_parity_dashboard_drift.yml` failed 2026-09-07 at its drift-detection step — on drifted artifacts, which is the gate working as designed [CI-observed, High]. No other packet has a committed statistical baseline with a demonstrated firing.
- **Evidence machinery as published crates.** `franken_kernel` / `franken_evidence` / `franken_decision` are workspace members published to crates.io (`franken-kernel` 0.5.0, 339,863 downloads) — the only project whose evidence apparatus is itself a registry-distributed artifact [External, High].
- **README export contract.** README L642–644: "Historical files such as `src/runtime/reactor/uring.rs` … are not part of the live export graph" — a documented export boundary, not just a workspace layout [Verified, High].
- **Also does X:** registry-scale distribution (318,241 downloads, 78 reverse deps [External, High]) is a distribution fact, not a mechanism; the gates themselves run on private DSR with zero pin CI runs, so the baseline gate is demonstrated nearby, not at the pin [CI-observed, High].

## 2. beads-for-frankentui

- **Chunk-manifest with re-verified hashes.** An 11-entry manifest (`beads.sqlite3.config.json`) plus whole-db hash; the analyst re-fetched all 11 chunks and re-verified 11/11 hashes [Verified, High]. No other dashboard packet re-verified its own chunk assembly.
- **README-vs-database §4.5 table.** The packet pits README claims against `meta.json`, `project_health.json`, and the analyst's own SQLite row counts — catching the 3,696-vs-3,700 drift [Verified, High].
- **Deploy-record honesty as a feature.** 57 runs via API: 35 success / 22 cancelled / 0 failed; pin's run green — with the explicit distinction between what CI checks (nothing) and what it doesn't [CI-observed, High].
- **CHANGELOG admits decay.** Orphan-commit topology, removed `history.json` ("remains absent"), per-deployment metric regressions (99% → 92%) in dated entries [Verified, High].
- **Also does X:** CI tests nothing (deploy-only) [CI-observed, High]; the artifact is a museum piece serving a 197-day-old snapshot; no license [Verified, High].

## 3. beads_for_franken_engine

- **Snapshot-fidelity proof for a `bv --pages` export.** All 1,180 snapshot IDs reproduce exactly from the shipped sqlite; the 8 chunks reassemble byte-exact (sha256 match); the dependency graph is genuinely acyclic (independent DFS over all edges); FTS behavior verified [Verified, High]. This is data-fidelity verification of a static export pipeline, not a test suite.
- **The 2026-09-21 style batch** documents a dated, reviewable export run [Verified, High].
- **Also does X:** deploy-only CI (both pin deploy runs green) [CI-observed, High]; one commit; content frozen 197 days; no releases, no CHANGELOG [Verified, High]; the export *pattern* is the transferable part, not this instance.

## 4. franken_agent_detection

- **Registry-agreement gate.** `registry_tables_agree_exactly`: the connector registry, tilde-expansion table, canonical-slug map, and factory registry must agree *exactly*; the build fails on drift [Verified, High]. No other packet cross-checks four registries for exact agreement at build time.
- **Discover-before-parse.** `discover_source_files` inventories artifacts before any parser runs — a corrupt parser cannot hide missing data; the scan is capped at 100 MB with routing [Verified, High].
- **CHANGELOG honesty block.** "If you expect releases that do not exist, do not invent them" — a release-vs-tag honesty block, the canonical counterexample being frankentui's phantom v0.9.0 [Verified, High].
- **Two-tier CI reporting.** The packet reports the red main lane *and* the green exclusions lane rather than collapsing to one story [CI-observed, High].
- **Also does X:** plain MIT with no rider — the only such license in the corpus [Verified, High]; the only documented downstream integration (CASS, same maintainer [Maintainer claim, High]); main CI is red at the pin (dies at the fmt gate before 1,226 tests run) [CI-observed, High]; README says "15 connectors," tree has 34 slugs [Verified, High].

## 5. franken_alignment

- **Docs↔code mapping dispatch.** `xtask` dispatches `concordance-check`, `system-map-check`, `prose-check` (docs↔code mappings) and `inventory` (admission checks, source snapshots) [Verified, High].
- **Self-disqualification rule.** Not a one-off audit but a rule: any code landing after the last executed gate must open the status ledger with a self-disqualification until the gate runs [Verified, High]. Per-batch receipts bind source hashes, job id, and raw logs; failed attempts are retained (2026-09-08 batch) [Verified, High].
- **Disclaim-as-data SLOs.** `registry/slo.json`: `"all_values_are_unmeasured_proposals": true`, every target `"status": "unmeasured"` — the absence of measurement is machine-readable data, not prose [Verified, High].
- **Release structurally blocked.** `xtask release-check` returns `Err("Release blocked: no qualified production broker, …")` — release is a checked impossibility, not an aspiration [Verified, High].
- **Planted-mutation testing.** Deliberately introduced defects must fail after controls pass (documented per batch, e.g. "Two planted defects fail after controls") [Verified, High].
- **Zero-dependency workspace.** `Cargo.lock` contains zero external packages — 936 `.rs` files, 194,256 lines compiling against `core`/`alloc`/`std` only [Verified, High].
- **Also does X:** all production lanes `not_implemented` at the pin; executed evidence 14 days / 416 commits stale at the pin; gates run operator-local via RCH (unobservable); 40 registered invariants and 21 falsifiable hypotheses are research, not product [Verified, High].

## 6. franken_code_browser

- **Coordinated-failure defect taxonomy.** AGENTS.md names six defects — demo hardcoding, proof laundering, refusal farming, commit pumping, gate self-weakening, follow-up laundering — as named failure modes of evidence culture [Verified, High]. No other packet taxonomizes how honesty machinery fails.
- **Disavowal as drift-proofing.** The total README disavowal makes it, per the frankenredis brief, "the only assessed repo that cannot be caught in README drift *by construction*" — the inventory's function flips to documenting the code *outrunning* the disavowal (CLI exists, desks exist, paged navigation exists) [Verified, High].
- **Executable dependency audit.** `fcb-conformance` ships Python closure probes (`tests/test_closure_probe*.py`, `test_extension_ledger.py`) — a runnable dependency-audit tool [Verified, High].
- **Checksum-honesty rule.** `fcb-search`'s `SnapshotPostings` index carries the explicit rule: "a disk checksum proves internal consistency, *not* completeness" [Verified, High].
- **Embedding contract.** One library (`fcb`), one app; default construction inert (no thread, window, scan, or global handler); hosts own event loop/device; two embedded instances [Verified, High].
- **Also does X:** no CI workflows at all (`.github/` holds only issue templates); no product gate (G0) passed; nothing measured [Verified, High]; explicit no-contributions policy [Maintainer claim, High].

## 7. franken_drone_geometry_reconstruction

- **Five-label maturity vocabulary.** source-present → reference-implemented → publicly-invokable → locally-qualified → production-admitted, with the rule "no lower label implies a higher one" [Verified, High]. No other packet has a formal maturity vocabulary; this is the exportable concept.
- **Registry triple.** `registries/slos.toml` (20 SLOs), `registries/tests.toml` (44 test families), `registries/gates.toml` (25 gates) [Verified, High].
- **"Has not yet earned" receipt doctrine.** The README states the current head "has not yet earned a retained full local receipt"; `scripts/qualify.sh --mode full` is framed as the local qualification bar [Maintainer claim, High]. The non-claim is the mechanism.
- **IMPLEMENTATION_STATUS non-claims table + WP-018 open boundary** [Verified, High].
- **Also does X:** the geometry half does not exist (no feature extractor, no five-point solver, no triangulation, no bundle adjustment) — the thesis is untested [Verified, High]; sole CI workflow is self-hosted with all 324 observed runs queued/cancelled [CI-observed, High]; README says 28 members, tree has 30 [Verified, High].

## 8. franken_engine

- **README-wording gate.** The claim-to-proof matrix "refuses README wording whose `actual_wording_state` exceeds its `allowed_state`, emitting exact downgrade text" — marketing hygiene as CI [Verified, High].
- **Freshness decay.** Each claim carries `max_observed_freshness_days`; the matrix auto-downgrades OBSERVED rows as re-verification lags [Verified, High].
- **Fixture rejection.** The Performance Evidence section rule: fixture-only artifacts (`hot_paths_simulation`, `MockCertificate`) are rejected by the gate as backing evidence [Verified, High].
- **Martingale decision ledger.** `martingale_decision_ledger.rs` implements "a non-negative martingale tracked in fixed-point millionths of log-space… integer-only arithmetic" [Verified, High]. No other packet has a martingale-based decision ledger.
- **Per-claim `repro.lock`** [Verified, High].
- **Also does X:** core CI red at the pin and never green in 46 recorded runs [CI-observed, High]; the named quality/perf workflows had zero runs; v0.1.0 release targets an earlier commit [External, High]; signed evidence ledger with transparency log + MMR is an evidence ledger, not frankengit's authority model [Verified, High].

## 9. franken_lean

- **Upstream-anchored contracts.** Each `KERNEL_CONTRACT.md` rule carries an `anchor:` line naming the exact upstream file/line at the pin plus an `expect=` token; the check script fails CI on drift — binding the project's own surface to the *incumbent's* moving source lines [Verified, High]. Neighbors (franken_networkx's drift-failing ledgers, frankensim's doc lint) bind their own surfaces, not upstream's.
- **Bidirectional unsafe-note census.** CI-enforced Clippy census of unsafe notes; the census passed *inside* a red gate at the pin [Verified, High].
- **One lockfile for four pins.** A single lockfile pins the Reference (lean4 v4.32.0), the Corpus (mathlib4 v4.32.0), the toolchain (nightly-2026-08-31), and the suite commits [Verified, High].
- **No-hollow-green runner.** The pinned-Nat-council regression's runner script is written so it "cannot produce a hollow green" [Verified, High].
- **Also does X:** `SUITE.lock` user — shared with `franken_nlp` and `franken_manim`, not the only one [Verified, High]; CI red at pin (11/30 steps failing) [CI-observed, High]; zero release artifacts; explicit no-contributions policy [Verified, High].

## 10. franken_manim

- **Bit-locked merge blockers on own outputs.** Geometry snapshots and frame hashes are merge-blocking self-goldens [Verified, High] — stronger enforcement than frankensim's cross-ISA sentinels [Inference, Medium].
- **Mechanically falsifiable parity audit.** `fmn-python --audit-parity`: exit 0 only if every reviewed `same`/`improved` row resolves to a real comparison [Verified, High].
- **Closure content-hashing.** The closure hashes "sources, engine and suite commits, toolchain, config bytes, seeds, font hashes, backend identities, locale" [Verified, High].
- **Rejected artifacts published.** The v0.3.0 notes "incorrectly summarized a stale 0.2.0 Windows binary as successful. That artifact was rejected and is not attached" — with run identifiers [Verified, High].
- **Refusal inventory.** 103 sites counted (63 explicit `NotImplementedError`, 40 `_refuse_unrouted`) plus capability gates [Verified, High].
- **2,483-row Parity Ledger** with authored Python overlay (2,275 rows), tiered/improved/same/excluded taxonomy, and ledger-vs-code drift tracking [Verified, High].
- **Also does X:** `SUITE.lock` user (shared with lean, nlp); pin greenness unestablished despite 87 workflows [CI-observed, Medium]; README written in present tense as if the 1.0 design were realized; four prereleases checksum-published but unsigned [Verified, High].

## 11. franken_markdown

- **`claims.tsv` + `check-claim-discipline.sh`.** Every README claim wired to a `capabilities --json` key and a proof script — "marketing hygiene as CI" [Verified, High]. The honest caveat: the sole GitHub Actions workflow is explicitly DISABLED, so enforcement runs through DSR on the maintainer's host — the mechanism exists, its public execution does not.
- **Ratcheted conformance floor.** 578/652 CommonMark floor with a floor file that matches the README — consistent [Verified, High].
- **Perf-honesty commit convention.** p50/p95 over 100+ iterations, byte-identical golden checksums, `perf-compare.sh` variance-envelope delta classification, rejected-PR perf ledger [Verified, High].
- **Ships on three registries.** v0.4.5 verified via API: crates.io, npm, 5 platform targets + `.sha256` sidecars [External, High].
- **Also does X:** npm latest 0.4.4 vs engine 0.4.5 (distribution lag); line counts move thousands per day; the claim-discipline pattern is the export, not the renderer [Verified, High].

## 12. franken_markdown_website

- **Analyst-run production kill test.** `verify:live` is a 67-line script that regex-scrapes `href/src` assets from `index.html`, resolves paths, and hash-checks a transitive closure — and it *failed against production*: 8 stale assets, exit code nonzero, which the packet reports as the disproof, not a bug report [Verified, High]. This is the only packet where an analyst executed the project's own verification script against its own production deployment and published the failure.
- **Fragment-based privacy property.** Sharing-by-fragment keeps privacy "as a verifiable property of the page" even against a distrusted operator [Verified, High]. The README's "87 KB" self-hosted font claim was countered by the analyst's measured 88,660 bytes — honesty machinery catching its own marketing [Verified, High].
- **"Honest scar tissue" lab-notes strip.** The Lab Notes page records the maintainer's own stale-deploy incidents with the same framing the marketing uses [Verified, High].
- **Also does X:** no CI at all, manual deploys [Verified, High]; "Zero external requests, zero analytics" verified by fetch (no external URLs in index.html) [Verified, High].

## 13. franken_native_capsule

- **`/proc/self/maps` as the security instrument.** Tests inspect `/proc/self/maps` asserting RX-without-W on *every* mapped region — a runtime kernel-enforced memory contract. A repo-wide grep for `/proc/self/maps` hits only this project [Verified, High].
- **Frozen 39-byte machine code.** Worker output is rejected unless byte-identical to a frozen 39-byte machine-code constant [Verified, High].
- **Compiler identity chain.** Full Cranelift 0.134.2 graph pinned with exact `=` versions and rationale comments; the compiler identity string is SHA-256-hashed; canonical postcard encoding plan binds compiler identity → RCO → activation image → retirement [Verified, High].
- **13 NCC-SAFETY-* invariant IDs** for 13 counted unsafe blocks, each linked to a test [Verified, High].
- **Also does X:** no CI, no license file (plain text in README only), single squashed commit; every test read but none executed; no evidence that RCH ever ran the suite [Verified, High].

## 14. franken_networkx

- **Executable claim-coverage audit.** The claims registry is audited by execution, not by review [Verified, High].
- **Five auto-generated ledgers that fail CI on drift:** coverage matrix, raw-vs-public, delegation, upstream-divergence, API ergonomics [Verified, High].
- **Machine-checked surface-parity matrix:** 4,129/4,129/0 with the honest decomposition — "every member accounted for" [Verified, High].
- **Incumbent-native adoption path.** A 313-algorithm backend plugin under the incumbent's own dispatch protocol — live NetworkX workloads execute inside the incumbent's pipeline against the rewrite [Verified, High]. This is not parity testing; it is production-interface colonization.
- **37,116-line negative-evidence ledger** under the INCUMBENT-vs-SELF-SPEEDUP verdict contract — verdicts are typed, not adjectives [Verified, High].
- **Also does X:** latest green precedes the pin by 13 days (red/stale, not verified-at-pin) [CI-observed, High]; AGENTS.md declares GitHub Actions non-authoritative while Actions is live; v0.2.2 release targets an earlier commit [External, High]; explicit no-contributions policy [Verified, High]. Calibrated against frankenmermaid: networkx's program (audit + ledgers + gauntlet + plugin) is the larger, executed one [Inference, Medium].

## 15. franken_nlp

- **The claim checker that fails on its own tree.** `check_claims.py --check` executed by the analyst on the pin's own tree reports FAIL, exit 0 — the audited finding is the failure itself; the packet does not hide the red machine behind green prose [Verified, High].
- **Self-graded 324KB plan.** Sentences machine-checked as [OBSERVED@pin] / [REPORTED] / [EVIDENCED] / [PARTIAL] / [TARGETED] / [HYPOTHESIS] [Verified, High].
- **Byte-identical model-dossier replay.** Analyst-executed `gen_tensor_census.py --check-artifact`: PASS + live replay against the pinned HF revision (`hf://fnp-gpt2-1.5b`, 16,519-byte index + 1,019-byte config) [Verified, High].
- **Defined execution modes.** The plan defines `hf-bf16-eager` and diagnostic modes with ownership of what "matches HF" means [Verified, High].
- **Also does X:** `SUITE.lock` user — shared with franken_lean and franken_manim, not the only one [Verified, High]; nothing executes end to end; DSR build authority BLOCKED; in-tree CI disabled [Verified, High].

## 16. franken_node

- **Signed honesty manifest + independent verifier SDK.** The manifest is machine-checkable, Ed25519-signed, CI-drift-gated; `sdk/verifier` lets anyone verify independently of the producer [Verified, High].
- **Mutation floor in CI.** `mutants-gate.yml` enforces `MUTATION_SCORE_FLOOR_BP` — of the 14 packets that mention mutation per the brief's skim (not a direct packet count), only node enforces a floor in CI config [Inference, High].
- **Analyst-executed honesty check.** `check_claims_manifest.py --check-honesty`: 9 ok, 0 drift [Verified, High].
- **Hash-chained TrustCard lineage.** Every decision emits a signed receipt chained into the evidence ledger; `check_honesty.sh` [Verified, High].
- **146 fuzz targets** [Verified, High].
- **Also does X:** CI red at the pin (8/8 runs failing) [CI-observed, High]; close-condition oracle RED on the pin's own tree [Verified, High]; v0.1.0 release targets an earlier commit [External, High]; benchmark fixtures are synthetic sample data [Verified, High]; zero independent validation [External, High].

## 17. franken_numpy

- **Schema gate for evidence rows.** The 8-gate topology's G2 machine-checks the *schema* of evidence rows (host=/worker=/harness= fields) — evidence infrastructure checking its own metadata [Verified, High].
- **KEEP-claim incumbent-coverage audit.** `KEEP_CLAIM_INCUMBENT_COVERAGE.md`: 751 KEEP claims graded, 22 contract-grade (2.9%) [Verified, High].
- **Audited README disavowal.** "Evidence grade (audited 2026-09-02): of 28 headline ratios, only `isin` 134.5x is contract-grade" — the strongest README *placement* of a disavowal in the corpus (it is not the only disavowing README) [Verified, High].
- **Three-tier attribute model.** Native Rust fast-paths / native PyO3 classes / identity-equal re-exports [Verified, High].
- **Live `numpy.__all__` parity.** `fnp_python_covers_full_numpy_all` iterates the *live* `numpy.__all__` at runtime asserting `fnp.__all__ == np.__all__` [Verified, High].
- **Largest counted negative ledger:** 67,641 lines [Verified, High].
- **Also does X:** CI red at the pin (G1 clippy failure) while the badge says "G1 green" [CI-observed, High]; no PyPI release [Verified, High]; the wheel declares `numpy>=2.3` as a runtime dependency — NumPy must be installed for it to function, so this is a compatibility layer with fast paths, not a standalone reimplementation [Verified, High].

## 18. franken_ocr

- **Stage-isolated parity receipts.** Preprocess cosine 0.99891 → SAM 0.99992 → CLIP 0.99921 → projector/bridge 0.99964 → decoder hidden 0.99995 — each stage's fidelity is a separate receipt, not one aggregate score [Verified, High].
- **Three-pillar release certification gauntlet.** `scripts/gauntlet_cert.py` + `docs/gauntlet/` with conformal ratchet (Jeffreys-posterior/Hoeffding lower bounds) and a fail-closed finalizer that *refuses* to claim a three-party OpenPGP certificate (Villani) [Verified, High].
- **Exact tensor census.** A test asserting *exactly* 2,148 int8 tensors with full name accounting (`unlimited_ocr_validated_recipe_has_exactly_2148_int8_tensors`) [Verified, High].
- **Hash-stamped artifacts.** `focr convert` stamps the source safetensors SHA-256 into the `.focrq` header; `focr pull` verifies part hashes [Verified, High].
- **FEATURE_PARITY.md.** Every surface enumerated as present | partial | missing | n/a | excluded, with "partial never rounds up" [Verified, High].
- **Also does X:** CI workflows deleted from the tree at HEAD; last observed runs failed [CI-observed, High]; headline speedups measured on maintainer hardware; binary releases v0.5.0–v0.9.0 (latest v0.9.0, 2026-08-23) [Verified via API, High].

## 19. franken_overlap

- **Anti-extrapolation rule.** A baseline that exceeds the compute budget is recorded as `incomplete`, never extrapolated [Verified, High].
- **Immutable proof bundles.** Markdown/HTML bundles pinning corpus, query, commit, compiler, hardware, baseline, quality, span, latency, and uncertainty [Verified, High].
- **Preregistered claim verdicts.** `fo-claim-gate` adjudicates with preregistered paired-bootstrap claims: supported / inconclusive / unsupported [Verified, High].
- **Malformed-input battery.** Malformed magic, unknown versions/flags, unsorted dictionaries, invalid postings, inconsistent doc frequencies, impossible sizes, truncated inputs — all asserted to refuse [Verified, High].
- **Deliberately disabled CI.** With a verbatim rationale in the tree, rather than quietly absent CI [Verified, High].
- **Also does X:** the central thesis has no checked-in evidence run; no release; unlicensed; all runs measured on the maintainer's Apple Silicon [Verified, High].

## 20. franken_remote

- **Per-slice verification topology.** 36 workflows: per-slice verify + rust-verification + docs-integrity + native-integration-inputs + source-maintenance lanes [Verified, High].
- **Real QUIC/TLS integration tests against localhost.** Control-lease renewal, observation renewal — the network stack is tested, not mocked; real-QUIC software-HEVC X11 playback exists [Verified, High].
- **~96 root-level design docs** recording each slice's design and verification scope, 106 tracked design beads [Verified, High].
- **Externally-confirmable verification receipts.** Exact commands with worker and source-hash binding from RCH [Verified, High].
- **Also does X:** zero check-runs at the pin [CI-observed, High]; no product, no release; all execution authority on private RCH [Verified, High].

## 21. franken_snowflake

- **Machine-checked dependency diet.** `check-dependency-admissibility.py`: `cargo tree` across ~21 feature lanes; zero tokio/reqwest/hyper/axum/tower/sqlx in 589 lock packages; the Actions job passed 3/3 OSes [CI-observed, High].
- **Structured credential-less skip.** Runs without credentials emit a `franken_snowflake.live_gate.v1` skip event instead of silently passing — skip honesty as a schema [Verified, High].
- **Build-time credential-shape scan.** `build.rs` scans its own `src/` for credential markers and fails the build if a credential-shaped field derives `Debug` [Verified, High].
- **Content-addressed live receipts.** Every live execution writes a BLAKE3 content-addressed receipt + partition evidence + append-only audit event with per-envelope `data_source` [Verified, High].
- **Also does X:** the sustained policy-vs-tree CI contradiction is itself a documented finding (AGENTS.md "never uses GitHub Actions" vs 140 executed runs) [Verified, High]; latest run #140 was red 2026-09-13 but no run covered HEAD on 2026-09-22 [CI-observed, High]; the "read + write live-success" badge coexists with a live-proof bead still in_progress [Verified, High]; explicit no-contributions policy [Maintainer claim, High].

## 22. franken_surveillance_system

- **Machine-greppable honesty trailers.** 25 of the last 40 commits carry them; the pin commit records "Rust compilation, tests, rustfmt, Clippy and native…" — the pin's own trailer lists what was *run*, not what passed [Verified, High].
- **"Silence certificate" concept.** The machinery can prove no decision-relevant change across successor commits — a non-change proof, not a change log [Verified, High].
- **Comprehensive plan prose discipline.** Every statement labeled FACT / DESIGN / HYPOTHESIS / TARGET / OPEN [Verified, High].
- **FRANKENSTACK_DEEP_DIVE.md** (86,792 bytes) + 14 sibling audits + machine ledger `architecture/franken_imports.json` [Verified, High].
- **Also does X:** nothing shown running end-to-end on real hardware; DSR-first; 622 CI runs with 4 successes on retired workflows [CI-observed, High]; honesty machinery is the product's thesis, not a gate on one [Verified, High].

## 23. franken_threed

- **Exhaustive full-input-class differential gate.** The closed numeric body is compiled to import-free Wasm and executed across all 256 cube topologies × 8 flag combinations plus animated metaballs, 80 seeded fields, and NaN/empty edge cases against the live upstream oracle [Verified, High]. No other packet exhausts its input class differentially.
- **Oracle-integrity verification.** The oracle checkout is verified by blob SHA-1 (`29a405be…`) *before* the suite runs [Verified, High]. No other oracle-using packet verifies oracle integrity pre-run — the closest neighbor is franken_whisper's result-class doctrine, which requires the incumbent binary's SHA-256 recorded at invocation (catalog §25) [Verified, High].
- **Analyst behavioral rerun.** The analyst re-ran 61/61 locally, including the oracle-integrity step — the corpus's only analyst-executed behavioral reproduction [Verified, High].
- **DEPENDENCY_ADMISSION.md.** Dated RCH compile logs, exact pins, per-crate consumption against a 245k-line budget [Verified, High].
- **Acorn pinned to exactly 8.14.0** in `tools/package.json` + lockfile [Verified, High].
- **Also does X:** CI gates only the marching-cubes exemplar, not the compiler's full contract (76/79 own unit suites) [CI-observed, High]; no release [Verified, High]; Pin CI green in one workflow (2 runs, both success), latest at the pin — one of the corpus's two green-at-pin projects [CI-observed, High].

## 24. franken_tts

- **Standing refusal of inadmissible comparisons.** `[NO ADMISSIBLE RATIO]` / OQ-15: freezes the local CPU oracle environment, then declares the official CPU "not an admissible G2 performance incumbent" — the packet's headline performance section is a documented refusal to publish a number [Verified, High].
- **NE-006 retraction.** "This entry was wrong, and the way it was wrong is the useful part" — a 622 MB cold embedding loading hid behind a one-axis census [Verified, High].
- **Machine-implemented skip honesty.** `summarize_receipts.py` + XFAIL≠SKIP doctrine + `require_model!` + GREEN WITH SKIPS doctrine [Verified, High].
- **Pinned truth pack.** Oracle pins (HF weights `5d83992`, upstream `022e286`) + manifests + acceptance surface with break-even thresholds, a nondeterminism floor, and a fetch/verify script [Verified, High].
- **Listening-eval-shaped gap, instrumented.** DISC-003 records int8 RMS 0.019→0.221 and centroid 860→236 Hz — "audible LF drone risk" [Verified, High].
- **The flagship optimizer killed twice.** In-tree, in the negative-evidence ledger (NE-002/NE-003) [Verified, High].
- **Also does X:** no in-tree CI; DISC-003's open status keeps it out of Pilot; the honesty of refusal is the product, not the TTS engine [Verified, High].

## 25. franken_whisper

- **Result-class doctrine.** PERF_LEDGER: SELF-SPEEDUP is *maintenance* (never a campaign win); a CAMPAIGN WIN requires the actual incumbent binary side-by-side in the same invocation with A/A nulls inside [0.98, 1.02] [Verified, High].
- **Published failed A/A-null campaign** as "no admissible verdict" (Metal "NO ADMISSIBLE PERFORMANCE VERDICT") [Verified, High].
- **AGENTS.md names 12 forbidden reward-hacking patterns** [Verified, High].
- **Measured against the actual whisper.cpp binary side-by-side** [Verified, High].
- **Also does X:** no CI config in the tree — among the largest evidence gaps in the program [Verified, High]; v0.9.3 five weeks behind HEAD; v0.9.3 ships five platform installables + Homebrew tap + ~2.12 GB SHA-256 trust root [Verified, High]; it is *not* the largest codebase (a claim corrected in this synthesis) [Verified, High].

## 26. frankenfs

- **Dual-lane CI with honest lane reporting.** A second Artifact Gates CI lane passes at HEAD while the main lane is red — the project reports both, as two lanes, rather than one collapsed status [CI-observed, High].
- **Crash/replay artifact gates + epoch FSM** [Verified, High].
- **Transport-confound isolation analysis in mounted scorecards** [Verified, High].
- **Published red sanitizer scan** with 254 critical findings [Verified, High].
- **Worker-scope preflight ratchet + canonical-gate execution binding** [Verified, High].
- **Tagged v0.2.0** (one of the corpus's few tag-asserting projects) [Verified, High].
- **Also does X:** main lane red [CI-observed, High]; negative ledgers exist but NumPy's (67,641 lines) is larger — fs's honest comparison keeps it from claiming the record [Verified, High]; parity/manifest staleness at the pin [Verified, High]; ext4 read/inspect/FUSE-read at TRL 5–6 vs ext4 RW at 4 and btrfs RW at 3 is a filesystem-forensics fact shared with frankensqlite's lab work [Verified, High].

## 27. frankengit

- **Digest-bound auto-demotion.** The claims registry is SHA-256-bound per claim; "any mismatch is an automatic demotion, not a reviewer-overridable status transition"; `tools/registry-check` refuses a stale block [Verified, High]. franken_engine's matrix refuses wording, frankensim's checker scans prose — only frankengit demotes automatically on digest mismatch.
- **13-class negative-evidence schema.** 34-row registry with 13 required entry classes (overclaim_correction, non_reproducible_result) plus prose/TSV correspondence rules [Verified, High].
- **Fail-closed dormant lanes.** The full/release lanes *refuse* with exit 3 instead of false green; NEG-017 rejects "green CI = safe" [Verified, High].
- **Application-level Lean proof lane.** Lean 4.32.0, four theorems under three named boundary assumptions, registry-bound, explicitly "not-a-proof-that-the-rust-implementation-refines-the-model" [Verified, High].
- **Revision-bound real-client interop.** 178 acceptance IDs across five E2E suites against a real git client (2026-09-07 snapshot, honestly 15 days stale at pin) [Verified, High].
- **Machine-enforced license disclosure.** D14 decision + `license_gate.sh` + AGENTS.md "No document may claim open source" [Verified, High].
- **Immutable decision stream + tiny conditional authority head.** Exact-predecessor CAS as the only commit point [Verified, High].
- **Also does X:** zero tagged releases; pin CI greenness unestablished; the enforcement loop is maintainer-local (RCH), not publicly observable [Verified, High].

## 28. frankengraphdb

- **Registry quartet.** `registries/invariants.toml` (exactly 20 IDs, FG-INV-01–FG-INV-20), `laws.toml`, `claims_lint.toml`, `unsafe_boundary_ledger.toml` — the invariants registry is exact, not exemplary [Verified, High].
- **Verifier-found overclaim repairs.** The 2026-09-04 changelog documents two overclaims the verifier found and fixed, plus mutation controls [Verified, High]. The changelog is a repair log.
- **fgdb-sim.** Virtual time, fault-injecting virtual disk (torn writes, bit flips, ENOSPC) [Verified, High].
- **Benchmark doctrine.** No benchmark-only semantics; distributions not averages; never hide compaction; memory first-class; adaptive numbers disclose the policy epoch [Verified, High].
- **"One Version Universe."** Fountain-coded commit streams as the storage model [Verified, High].
- **Also does X:** zero releases; workflows dispatch-only after the 2026-09-03 ruling; "no document may claim open source" discipline shared with frankengit's license apparatus [Verified, High].

## 29. frankenjax

- **Composition proof artifacts.** For transform composition, the project produces auditable proof artifacts `{root_jaxpr, transform_stack, transform_evidence}` — "no competitor produces this" [Verified, High].
- **Ordering tests.** Dedicated property tests for `jit(grad(f))`, `grad(jit(f))`, `vmap(grad(f))`, `grad(vmap(f))`, `vmap(jit(f))` orderings [Verified, High].
- **Metamorphic transparency.** `metamorphic_jit_transparent`: `jit(f)(x) == f(x)` to 1e-14 across random inputs [Verified, High].
- **Exhaustive-by-construction AD dispatchers.** No wildcard fallbacks [Verified, High].
- **861 oracle fixture cases per family** [Verified, High].
- **Per-optimization entries** with agent attribution, same-worker/same-binary criterion rows with CIs, and explicit rejections [Verified, High].
- **Also does X:** zero GHA workflows — all green claims are maintainer-RCH-local [Verified, High]; explicit no-outside-contributions policy [Maintainer claim, High]; the proof artifacts exist, their CI execution does not [Verified, High].

## 30. frankenlibc

- **588 executable claim gates.** 588 `check_*.sh` scripts encode claim/evidence contracts in executable form — the only sibling that counts its gate scripts, and the count is the evidence [Verified, High].
- **Author-date history filter.** A filter over history catches replayed commits that `--since`/`--until` miss, ranking candidates by deletion [Verified, High].
- **41,205-line negative-evidence ledger** [Verified, High].
- **LD_PRELOAD interposition layer.** 4,119 exported entry points reimplementing the C library ABI; 66 fuzz targets [Verified, High].
- **Also does X:** main CI red at the pin (Core Gates failed at the first step) [CI-observed, High]; the shipping artifact is still an L1 interposition layer over the host glibc; no release [Verified, High].

## 31. frankenmermaid

- **Four gating invariants.** Head-to-head harness against pinned mermaid-js with four gating invariants: rendered-text token containment (one-directional), node-ID set equality, cross-engine edge consistency… [Verified, High].
- **RolloutPhase canary state machine.** Disabled → Canary → Partial → Full → RolledBack, in `fm-core/src/canary.rs` [Verified, High].
- **Evidence release-signoff binary.** 2,840-line `evidence.rs` implementing gate-aggregation with an override-authorization protocol [Verified, High].
- **Structural-equivalence oracle.** Comparison against pinned mermaid-js is structural, not pixel-diff [Verified, High].
- **726-row ledger with mandatory A/A nulls** [Verified, High].
- **Also does X:** calibrated against franken_networkx — networkx's program (executable audit, five drift-failing ledgers, gauntlet, 313-algorithm plugin) is the larger, executed one [Inference, Medium]; mermaid's 11 declared gates have no visible enforcement; Pages-deploys only; v0.2.0 is a source-only tag [Verified, High].

## 32. frankenpandas

- **Full-funnel verdict aggregation.** 359 measured lanes aggregated to FASTER 201 / SLOWER 20 / NULL_UNDECIDABLE 74 / DROPPED_HIGH_CV 62 / PARITY 2 — a decidable-subset statistic with its selection pressure stated in the ledger itself [Verified, High].
- **Same-row retractions.** Row 112 claims a 1.20x win then re-diagnoses it as build variance in the same row [Verified, High].
- **Quantified cross-worker build variance rule.** A measured 2.6x wall-time swing on identical-source rebuilds → standing rule: A/B comparisons across different workers are invalid; sub-1.5x ratios are UNRESOLVED [Verified, High].
- **STALE ELF marking.** Surviving losses whose ELF isn't the lane's newest are marked stale [Verified, High].
- **Fixture provenance.** All 1,387 conformance packets carry `fixture_provenance` with oracle `oracle_script_sha256` and generation command [Verified, High].
- **Certified lanes** with A/A controls, bootstrap CI, ELF pinning [Verified, High].
- **Also does X:** live-oracle + all-features lint red at the pin [CI-observed, High]; releases target an earlier tag [External, High]; explicit no-contributions policy [Maintainer claim, High].

## 33. frankenredis

- **Per-optimization PROOF.md bundles.** SHA-pinned golden RESP transcript + paired/reversed hyperfine runs + keep/reject score gate — the program's optimization-evidence template [Verified, High].
- **284 observed runs of `upstream-redis-7.2.4-full.yml`** (Tcl suite) — both lanes inspectable on GitHub Actions [CI-observed, High].
- **33 fuzz targets / 11,015 lines**; corpus 127,571 files / 499 MB [Verified, High].
- **Measurement protocol.** Same host, verified-idle cores, A/A nulls 0.979–0.999, core pinning, ELF SHA-256 pinning [Verified, High].
- **5,041 counted differential probes** against the vendored Redis 7.2.4 oracle [Verified, High].
- **Deliberate non-sharing.** The project evaluated and rejected adopting asupersync's machinery — the decision is documented [Verified, High].
- **Also does X:** CI red at the pin on both lanes (fmt gate; verdict step) [CI-observed, High]; v0.1.0's 24 signed assets target an earlier commit, not the pin [External, High]; exemplar of the program but green-at-pin is not its story [Inference, High].

## 34. frankenscipy

- **Live-oracle-presence control job.** The CI gate fails if the SciPy 1.17.1 oracle is *absent* — the control job proves differential tests actually exercise the oracle rather than silently skipping [Verified, High]. This is skip-honesty enforced as CI, and no other packet's control design is this explicit.
- **Tolerance ratchet.** CI enforces the tolerance policy with ratchet semantics — tolerances can only tighten [Verified, High].
- **18 FSCI-P2C parity packets as release artifacts.** `parity_report.json` + `.raptorq.json` + `.decode_proof.json` shipped per packet [Verified, High].
- **G7 artifact-schema + evidence-pack validation; G8 RaptorQ decode-proof verification** [Verified, High].
- **Full-workspace registry publication.** All 19 crates incl. conformance on crates.io 0.2.0 [External, High].
- **G1–G9 green at the pin** — one of the corpus's two green-at-pin projects [CI-observed, High].
- **Also does X:** downloads are trivial (11–45/crate [External, High]); zero independent validation [External, High]; CI is the story, not adoption [Inference, High].

## 35. frankensearch

- **Baseline Performance Envelope.** Every row carries an evidence basis label — ledger / receipt / product receipt / target — and rows that are *targets* are explicitly marked as targets, not results [Verified, High]. This is row-level epistemic labeling of a benchmark table.
- **Signed cutoff certificate.** `quill-gauntlet` cutoff certificate v1, SHA-256 domain-separated [Verified, High].
- **fsfs product shape.** An agent-search product with a progressive iterator + query daemon over a Unix socket + `--stream` JSONL/toon output + explain surfaces — a real product shape, not a benchmark harness [Verified, High].
- **13-member crates.io family + multi-platform release binaries** [External, High].
- **Also does X:** 7 of 8 workflows disabled_manually [CI-observed, High]; relevance quality unmeasured; the prior assessment reported the main crate failed to compile 2026-09-21; search-quality evidence is absent, envelope labeling notwithstanding [Verified, High].

## 36. frankensim

*Source note: `synthesis/briefs/frankensim.md` is truncated (111 lines, ends mid-§4); the material below is reconstructed from `frankensim-assessment.md`, read in full 2026-09-22.*

- **Evidence-color algebra with no-laundering composition.** `fs-evidence`: measurement colors compose so weak evidence cannot be laundered into strong claims [Maintainer claim, High] (mechanism visible in tree per the assessment).
- **Claim-integrity defect taxonomy with severity-weighted promotion gates.** 40 of 47 defect rows retired (maintainer-reported), document lint blocking README drift, contract-vs-layer cross-checks in `xtask` [Maintainer claim, High]. franken_engine's matrix refuses wording and frankengit demotes on digest mismatch; only frankensim has the defect *taxonomy* with severity weighting.
- **183/183 contracts with written no-claim boundaries** as a per-crate norm; the fs-conduction contract's no-claim section records a *retired* README/CONTRACT contradiction as a bead [Maintainer claim, High].
- **Format-9 evidence packages + solver-free `fs-checker`.** Content-addressed packages with Merkle roots, deny-all verification; the design admits structural integrity is not authenticity — the Phase-0A gate requires a caller-supplied verifier [Maintainer claim, High].
- **Leveled V&V corpus registry (`fs-vvreg`).** Level-A analytic (20), Level-B cross-code via scikit-fem (pinned env, byte-stable re-derivation, fail-closed self-checks), Level-C published experiments (4) [Maintainer claim, High].
- **L1–L5 capability-maturity registry.** 15 capabilities: L1=3, L2=11, L3=1, L4=0, L5=0 — the maturity distribution itself published [Maintainer claim, High]. (cf. franken_drone_geometry_reconstruction's vocabulary, frankensim's is a dated registry.)
- **Cross-ISA determinism sentinels.** `rand_nla_golden_hash` requalified cross-ISA and cross debug/release with machine-axis witnesses; retained receipts not independently re-executed [Maintainer claim, Medium].
- **Musical-acoustics CI smoke lanes** triggered by commit-message tags (`[piano-check]`, `[percussion-check]`) — the most unusual CI trigger design in the corpus [Maintainer claim, High].
- **Retained stale not-green suite receipt.** The suite receipt is kept and shown as not-green rather than regenerated into greenness [Verified, High].
- **`xtask` policy checks.** Layer lattice, Franken-only dependencies, contract presence, unsafe-capsule registration, constellation lock heads, SPDX consistency [Maintainer claim, High].
- **Also does X:** manim has stronger merge-blocking self-goldens [Inference, Medium]; claim matrices exist elsewhere (franken_engine, frankengit); negative ledgers are widespread [Verified, High]; no release, no crates.io, no accepted contributors [Verified, High]; development velocity provably exceeds audit velocity (202 test files outpaced the stats inventory in 11 hours) [Verified, High].

## 37. frankensim_website

- **Demo-component invocation audit.** All 43 demo components verified to actually invoke `call<…>(…)` — 45 of 48 wasm-bindgen exports exercised [Verified, High].
- **WASM hash kill test.** Recorded SHA-256 of `fs_wasm_bg.wasm` with an explicit kill test (rebuild from parent repo) [Verified, High].
- **Computed stats pipeline.** `compute-stats.mjs` + `generate-atlas.mjs` with a documented `FRANKENSIM_DIR` flow — "computed, not typed" [Verified, High].
- **Also does X:** no CI; "same bytes the native build runs" has no hash linkage; no operative license grant [Verified, High].

## 38. frankensqlite

- **Negative-results ledger with retry conditions.** `perf-negative-results.md`: ideas measured and rejected, each with the conditions under which it should be retried; old benchmark matrices kept in `baselines/` [Verified, High]. The retry condition turns rejection into a paused hypothesis rather than a dead one.
- **100% declared-surface release threshold.** `parity_release_threshold_policy.toml`: no release until 100% declared-surface parity; no threshold downgrades; no waived obligations [Verified, High]. This is the strictest release policy in the corpus by construction.
- **Deterministic concurrency lab.** Deterministic lab reactor (asupersync) for concurrency tests + DPOR schedule explorer (`dpor_enumerate_trace_classes`) [Verified, High].
- **v0.4.4 with all 28 crates at 0.4.4** in `Cargo.toml`; signed CLI [Verified, High].
- **Also does X:** the README badge links to a disabled_manually workflow [CI-observed, High]; verification-gates disabled; constellation coupling (storage I/O on asupersync) [Verified, High]; explicit no-contributions policy [Maintainer claim, High].

## 39. frankensqlite_website

- **Hash-bound spec-evolution database.** `meta` table with `dataset_hash`, `classification_hash`, `db_hash`, `base_commit`, and a 137-commit manifest [Verified, High]. Marketing content versioned as a database with integrity fields.
- **Centralized typed marketing-claim file.** `lib/content.tsx` (1,144 lines) — "every marketing claim lives here," with unit-tested constants [Verified, High].
- **158 counted `test()`/`it()` call sites** — the largest site test footprint in the corpus, but no gate [Verified, High].
- **Also does X:** no CI; "26-crate workspace" vs 28 counted — staleness baked into its own tests; no operative license grant [Verified, High].

## 40. frankensympy

- **Two-level conformance comparator.** Construction admission vs exact surface — admitting that something *constructs* is graded separately from it being *exact* [Verified, High].
- **Machine-readable claims registry with agent-binding and an explicit forbidden-claims list** [Verified, High].
- **Adversarial self-audit.** The project caught and remediated its *own* fails-open harness — a fails-open audit is the worst failure for a claims gate, and it self-reported [Verified, High].
- **cv≤5% eligibility.** Performance claims must clear a coefficient-of-variation gate [Verified, High].
- **`registries/dependencies.toml`** recording the asupersync pin [Verified, High].
- **Also does X:** 786 consecutive red runs; the pin fails at the fmt gate [CI-observed, High]; no release; a fresh clone doesn't build (path dependencies on sibling checkouts) [Verified, High]; claims auto-demotion is frankengit's stronger mechanism, not sympy's [Inference, Medium].

## 41. frankenterm

- **Signed attestation bundles.** Content-addressed, sigstore-signed release attestations with per-category producing-bead provenance, a machine-readable claim registry, a claim→signed-slot attestation graph, and negative-evidence slots *inside* the bundle [Verified, High].
- **`skipped_not_proven`.** Signed refusal-to-claim as a first-class release state [Verified, High].
- **Auto-stamping count script.** `stamp-readme-counts.sh --check` (advisory, CI-visible): "Counts are auto-stamped… and drift fast" — the stamper documents its own drift [Verified, High].
- **Build-enforced async discipline.** Sealed `RuntimeProof` trait + Lean-modeled soundness + four-layer tokio ban (dependency → type seal → test guards → custom lints) [Verified, High].
- **rustc-ICE forensics.** A 35-line toolchain-bug diagnosis embedded in `rust-toolchain.toml` [Verified, High].
- **21 GitHub releases**, with held-out failures published in the CHANGELOG (RC53) [Verified, High].
- **Also does X:** no public CI (RCH-only execution); bus factor 1 by explicit policy; release count is real but greenness-at-pin is unobservable [Verified, High].

## 42. frankentorch

- **Four-rule measurement-integrity gate.** Name the worker, name the harness, quote both estimators, replicate before quoting — the brief's verdict: the gate is "genuinely lacking everywhere else," its most exportable measurement-culture mechanism [Inference, High]. This is the measurement-culture gate most adoptable by other projects [Inference, Medium].
- **Strict/hardened mode split** [Verified, High].
- **DAC machinery** [Verified, High].
- **116 unsafe sites** documented under deny-gates [Verified, High].
- **42,708-line negative-evidence ledger** [Verified, High].
- **Also does X:** flagship CI failed in ~55 seconds at the pin [CI-observed, High]; no releases; the certifiable-lane claim is one quotable lane with no denominator; the negative ledger is shared corpus culture, not unique [Verified, High].

## 43. frankentui

- **Formal claim proof grammar.** The claims ledger uses a typed proof grammar — `test:` / `path:` / `ident:` / `cmd:` / `count:` / `manual:` — 152 rows: 56 proven, 56 retracted, 34 pending-doc, 6 pending-code. No other packet has a proof grammar [Verified, High].
- **Bead-close evidence-length gate.** `make close-audit` rejects bead closures without 80+ character evidence-bearing reasons (188 closures had lacked them) [Verified, High].
- **Cross-lane determinism shadow runs.** Three execution lanes (Legacy / Structured / Asupersync) with `shadow_run.rs` + rollout validation — shadow-run lane-migration proofs [Verified, High].
- **Machine-readable SLOs.** `slo.yaml` frame budgets enforced by gates [Verified, High].
- **`doctor_frankentui` verification harness** (194,840 lines): capture, determinism soaks, chaos drills, CEGIS, concolic differential testing [Verified, High].
- **Bayesian/adaptive layer.** BOCPD, e-processes, conformal prediction, VOI sampling wired into resize coalescing, diff strategy, budget alerts [Verified, High].
- **Also does X:** the phantom v0.9.0 is the corpus's largest release-vs-pin drift [External, High]; Actions disabled 2026-09-06 [CI-observed, High]; the ledger was seeded 2026-09-17 and "release" appears zero times in it; 1.1M lines, explicitly unstable API [Verified, High]; explicit no-contributions policy [Maintainer claim, High].

## 44. frankentui_website

- **Hash-linked version pinning.** `public/web/version.json` pins `frankentui_git_sha` + per-file sha256 over 20 files + a 209-line `evidence.jsonl` build receipt with `synced_at` — the hash-linked version pinning the other site briefs lack [Verified, High].
- **Byte-identical vendored viewer.** `fetch_assets.ts` vendors the beads viewer, verified byte-identical to Dicklesworthstone/beads-for-frankentui [Verified, High].
- **Caching split in config.** `next.config.ts`: WASM immutable-cached 1 year, manifest no-store, with rationale in the config comment [Verified, High].
- **Analyst-level live verification.** Both hostnames HTTP 200, all 8 routes 200, the disabled `/war-stories` route returns a designed 404 [Verified, High].
- **Also does X:** the hero stats are a drift inventory ("12 Workspace Crates" vs 20 counted); no CI; "V0.1.1 Alive on Crates.io" is February truth in September clothing [Verified, High].
