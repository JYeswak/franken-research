# FrankenSim — Assessment (Rulebook v1.0)

**Repo:** [`Dicklesworthstone/frankensim`](https://github.com/Dicklesworthstone/frankensim)
**Pin:** `4b004dcd3efa502ef5de84cf2ed118ccdeafde02` (2026-09-22 11:46:14 −0400 — "fix(percussion): compare analytic tangents through the shared storage owner [percussion-check]")
**Packet version:** v5 · 2026-09-22 · round 4 → 2 misattribution fixes (README "source workspace" line now verbatim; Philox determinism scoped to thread arrival order per README)

**Hook — the defensible one-liner:** FrankenSim is a 2.1-million-line monument to *how scientific software should be built*: every capability carries a contract with explicit no-claim boundaries, every measurement carries evidence colors, and the README volunteers its own failures — while the software itself has no release, no crates.io publication, no accepted contributors, no L4 experimental validation, and a license rider that bars the AI labs its "agent-first" architecture is built for.

> **Identity correction up front.** The assignment brief described FrankenSim as "an event-driven network simulator" aiming to replace ns-3. That framing is stale. Zero mentions of ns-3 appear in the README, the comprehensive plan, or the docs tree at the pin. The repo's own description is *"Plan-first Rust continuum for certified geometry, physics simulation, optimization, and rendering"* — a multi-physics CAE/scientific-computing continuum (FEM conduction, airflow, CutFEM, BEM/FMM, topology optimization, rendering), not a network simulator. This packet assesses the project as it exists: a geometry/physics/optimization/rendering workspace. **[Code-verified, High]**

---

**Tier legend (Rulebook §1):** **[Verified]** direct inspection of the pinned clone or a live page read by the analyst — flavors **[Counted]** (I ran the count), **[Git-observed]** (git metadata), **[Code-verified]** (source read). **[CI-observed]** is Tier 2 (seen executing on live CI pages — attests the suite *runs*, not that it is green). **[Maintainer claim]** asserted in README/docs, not independently executed. **[External]** independent sources. **[Inference]** analyst judgment, always labeled. Confidence: **High** / **Medium** / **Low**.

## TL;DR

| Field | Verdict |
|---|---|
| **NODUS ring** | **Explore** — substantive, unusual, unproven; the evidence machinery deserves study, the software does not yet deserve a pilot workload |
| **TRL** | **4 (reach toward 5)** — components validated in lab (Level-A analytic, Level-B cross-code); one L3 integrated workflow whose own QoI verdict is Indeterminate with eight NO-DATA terms, which argues the honest single number is 4, not 5 |
| **Strongest strength** | The self-auditing evidence culture: 183/183 contracts with written no-claim boundaries, a fail-closed V&V corpus (20 Level-A analytic, 4+1 Level-B cross-code via scikit-fem, 4 Level-C published experiments), evidence-color algebra, claim-integrity CI gating (40/47 defect rows retired, maintainer-reported), and docs that volunteer failure |
| **Strongest ceiling** | Bus factor 1 + contributions-not-accepted policy + no crates.io + no release + non-OSI rider excluding the AI labs + every quality-of-interest self-rated Estimated/indeterminate — a structural adoption ceiling that no amount of correct engineering can climb without a governance change |
| **One-line net** | The methodology is the export; the software is a source-workspace substrate. Study the governance, don't bet on the artifact — yet |

---

## Quick Links

- [README.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/README.md) — 2,883-line self-auditing project front page
- [LICENSE](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/LICENSE) — "MIT License (with OpenAI/Anthropic Rider)" — read §7 before touching the code
- [AGENTS.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/AGENTS.md) — contains the maintainer's anti-"process porn" rule (Rule 0.1), quoted in §6
- [COMPREHENSIVE_PLAN_FOR_FRANKENSIM.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/COMPREHENSIVE_PLAN_FOR_FRANKENSIM.md) — the plan the tree is executed against
- [capability-maturity.json](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/capability-maturity.json) — 15 registered capabilities: L1=3, L2=11, L3=1, L4=0, L5=0
- [vv-scorecard.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/vv-scorecard.md) — 34 datasets; independent reproduction: **0**
- [suite-receipt.json](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/suite-receipt.json) — retained stale receipt: not-green, 7,621 passed / 95 failed / 38 ignored, dirty tree, 2026-08-01
- [frankensim-source-manifest.json](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/frankensim-source-manifest.json) — content-addressed source provenance + SPDX 2.3
- [unsafe-capsules.json](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/unsafe-capsules.json) — 27 registered unsafe modules
- [percussion-physics.yml](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/.github/workflows/percussion-physics.yml) — one of exactly three CI workflows; see "Did you know?"
- [docs/ACCELERATOR_DOCTRINE.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/docs/ACCELERATOR_DOCTRINE.md) — the policy-first GPU doctrine (no backend exists)
- [CHANGELOG.md](https://github.com/Dicklesworthstone/frankensim/blob/4b004dcd3efa502ef5de84cf2ed118ccdeafde02/CHANGELOG.md)

---

## Did you know?

The repository's **entire** GitHub Actions CI consists of exactly three workflows — *piano physics smoke*, *percussion physics*, and *topology optimization* — and two of them simulate **musical instruments**: the piano lane runs a source-piano playback through the coupled structural/acoustic solver (`cargo test --release -p fs-couple --example piano_board_import`), and the percussion lane exercises plate/acoustic physics (`fs-plate` does orthotropic thin-plate bending for instrument bodies, pinned against a hand-computed spruce D-matrix). They are triggered not by a test-suite gate but by commit-message tags like `[piano-check]` and `[percussion-check]` — the pin commit itself carries `[percussion-check]`. Meanwhile the README explicitly declares GitHub Actions *non-authoritative*: the maintainer's private "DSR" runner is the real verification source, and the committed receipts say the suite is not-green. **[Code-verified + External, High]**

---

## Franken-worthy next steps (novel, falsifiable, rigor-backed)

1. **Extract the claim-integrity machinery as a standalone, license-clean lint crate.** The `xtask` claim-integrity gate (defect taxonomy with severity-weighted promotion gates, document lint that blocks README drift, contract-vs-layer cross-checks) is repo-agnostic and is the most transferable idea in the tree. *Falsifiable:* point it at one sibling repo (e.g., FrankenTorch) within 60 days; it either blocks a real claim promotion (demonstrated value) or proves too coupled to generalize (falsified portability).
2. **Commission an unrestricted-party re-run of the Level-B cross-code decks.** The four Level-B thermal references are generated by a pinned, byte-stable `uv`-locked Python script (`tools/vvref/solve_skfem.py`, scikit-fem 11.0.0 / numpy 2.3.1 / scipy SuperLU) against committed case decks, and the deck runner refuses to freeze references unless its known-answer self-checks pass. Anyone can re-derive every row. *Falsifiable:* a non-maintainer re-runs the four cases on a different platform; agreement within the committed tolerances confirms the independent-implementation check — any row disagreement falsifies it. This is the cheapest real independent validation on the table.
3. **Port the evidence-package format (v9) checker to a second language.** `fs-checker` is solver-free by design; format-9 packages carry Merkle roots and deny-all verification, and the design already admits that structural integrity is not authenticity (Phase-0A needs caller-supplied verifiers + an independent trust channel). *Falsifiable:* an independent Python implementation of `fs-checker` verifies a committed format-9 package's Merkle root byte-for-byte — or it doesn't, which would expose format ambiguity the Rust implementation papers over.
4. **Make the stats-drift sensor itself a CI metric.** The inventory regenerated 2026-09-22 00:32, yet 202 test files on disk are untracked by it 11 hours later; the README's own honesty machinery undercounts the tree. *Falsifiable:* add "untracked-test-file count" as a first-class `xtask check-docs` gauge; if the count does not converge toward zero within the maintainer's audit cadence, the claim-integrity system provably lags development velocity — a measured bound on its own governance.
5. **Run the musical-acoustics slice as the first bounded L4 candidate.** The piano/percussion physics stack already has CI smoke lanes, modal analysis with inertia-certified mode counts, and a bounded campaign harness; it is the most self-contained real-physics workload in the tree. *Falsifiable:* compare a committed percussion-strike simulation against a measured instrument recording with a declared scalar envelope — agreement within the envelope promotes a genuine L4; disagreement falsifies the acoustic stack's readiness for validation claims, full stop.

---

## §1 — Project and repository facts

- **Repo:** `Dicklesworthstone/frankensim` — "Plan-first Rust continuum for certified geometry, physics simulation, optimization, and rendering." [External, High]
- **Pin assessed:** `4b004dcd3efa502ef5de84cf2ed118ccdeafde02`, committed 2026-09-22 11:46:14 −0400, pushed 2026-09-22T15:46:15Z (pin == tip at assessment). [Code-verified + External, High]
- **Stars/forks:** 53 / 10; one listed contributor (`Dicklesworthstone`, 6,545 contributions); no tags; no GitHub Releases. [External, High]
- **License:** MIT with OpenAI/Anthropic rider; GitHub classifier: `other`. Non-OSI — see §7. [Code-verified, High]
- **Maintainer:** Jeffrey Emanuel (copyright holder, rider grantor). Contribution policy: contributions are *not* accepted directly; issues/illustrative PRs may be reviewed and independently reimplemented. [Code-verified + Maintainer claim, High]
- **Bus factor: 1.** Single listed contributor; all 6,545 contributions. [External, High]
- **Velocity:** maintainer-authored changelog research records 999 commits in the first five days of the project (2026-07-05 → 2026-07-10). Commit 150-window sampling showed zero agent co-authorship trailers. [Code-verified, Medium]
- **What it is not:** there is no crates.io release (verified 404 for `fs-conduction`, `fs-evidence` on the crates.io API), no stable public API promised — the README's verbatim line: "It is still a source workspace: no general CAD/CAE application or crates.io release is claimed." [Code-verified + External, High]
- **Attention signal:** the brief recorded ~15 stars; the repo now shows 53 stars / 10 forks — roughly 3.5× attention growth, still tiny in absolute terms. Interest is compounding from a near-zero base; it is not validation. [External, Medium]

### Why it exists — the maintainer's stated reasons

The README's TL;DR states the problem in the maintainer's own words: simulation systems "often split physical units, numerical error, runtime behavior, geometry validity, evidence, and reproducibility across separate tools," which "makes it too easy for an optimization run to produce an answer without a durable explanation of which assumptions, approximations, kernels, and machine conditions made the answer valid." The proposed solution: "builds those concerns into the workspace architecture" — units represented explicitly, kernels with deterministic contracts, geometry conversions carrying evidence, runtime behavior structured around cancellable work contexts, and a ledger recording artifacts, operations, events, roofline measurements, and time-travelable design state. The deeper doctrine is *plan-first*: comprehensive plan documents precede implementation, design ledgers record intent, and evidence colors prevent laundering weak results into strong claims. Note what is absent: the maintainer never states an intent to replace ns-3 or any network simulator — the "why" is entirely about evidence, reproducibility, and certified numerics for multi-physics simulation and design optimization. [Code-verified, High]

## §2 — Reconstructed architecture

FrankenSim is a **layered Cargo workspace** (163 native `fs-*` crates + `xtask`, plus 20 standalone workspaces) organized by a declared dependency-layer lattice (UTIL, L0–L6, TOOL), enforced by `xtask` policy checks. Layers and representative contents:

- **Substrate / execution (L0–L1):** `fs-exec` — a *two-lane executor*: latency lane on **asupersync** (runtime path dependency, v0.5.0 locked via `[patch.crates-io]` with `xtask check-constellation` verifying the sibling's exact git head), plus a work-stealing tile lane; cancellation contexts; SIMD facades; aligned arenas. [Code-verified, High]
- **Deterministic numerics (L1–L2):** `fs-math`, `fs-la` (dense/sparse), `fs-sparse`, `fs-fft`, `fs-ivl` (interval/affine/Taylor certified arithmetic), `fs-cheb` (Chebyshev collocation), `fs-rand` (Philox counter-based streams keyed by logical identity — replay independent of thread arrival order per README), AD/adjoint infrastructure (`fs-ad`, with optional FrankenTorch scalar-tape behind `[F]` feature gates). [Code-verified, High]
- **Geometry (L2–L3):** `fs-geom` (region/chart abstraction), SDF/mesh/F-rep/NURBS/voxel charts, tet meshing, topology certificates (`fs-topo`: exact-predicate self-intersection/manifoldness on triangle soups; degenerate faces are REFUSED, not analyzed). [Code-verified, High]
- **Physics (L3–L4):** steady P1 FEM conduction (`fs-conduction` — the only L3-integrated workflow), airflow/convection (`fs-airflow`, `fs-convection` with 12 validity-gated Nusselt cards), solids, LBM, BEM/FMM, CutFEM, modal analysis, the musical-acoustics stack (`fs-plate`/`fs-phs`/`fs-couple`). Nonlinear solid/fluid solvers are fixture-scale/2-D per README; only steady conduction is production-grade 3-D. [Code-verified, High]
- **Optimization/UQ:** adjoints, gradient and derivative-free optimizers, topology optimization, robust optimization. [Maintainer claim, Medium]
- **Evidence & governance (L2–L6):** evidence colors + no-laundering composition algebra (`fs-evidence`), content-addressed evidence packages v9 + solver-free checker (`fs-package`, `fs-checker`, `fs-crosswalk`), V&V corpus registry (`fs-vvreg`), claim-integrity gates and capability-maturity registry (`xtask`), source manifest + SPDX 2.3 (`fs-vmanifest`), FrankenSQLite-backed design ledger (`fs-ledger`, currently L1 with known suite failures). [Code-verified, High]
- **Product surfaces:** strict CLI pipeline (`fs-cli`), WASM/browser kernels (`fs-wasm` + 19 domain WASM workspaces; L1 browser flagships: two campaign tests recorded red), native SwiftUI app (`ios/`), bounded E2E campaigns (`fs-euler-disc-e2e` — at 140,040 lines the largest crate — and others). [Code-verified, High]
- **Franken constellation deps:** asupersync (runtime), FrankenSQLite (ledger storage), FrankenTorch (optional AD tape), FrankenNumpy/FrankenScipy (uv-pinned V&V oracle tooling; FrankenScipy's `skfem` generates the Level-B references). Policy enforces Franken-only runtime deps. [Code-verified, High]

The governing concept is the **evidence-carrying architecture**: units are typed (`fs-qty`), kernels carry deterministic contracts, geometry conversions carry recorded error authority, the ledger records artifacts/operations/events/roofline measurements with time-travel, and every QoI is color-tagged Estimated until proven otherwise. The "certified" in the repo's self-description cashes out in two concrete mechanisms: exact-predicate topology certificates (`fs-topo` refuses degenerate input rather than analyzing it) and certified interval/affine/Taylor arithmetic (`fs-ivl`) that carries error bounds through computation. It is the most fully realized "no laundering" simulation stack this assessment program has seen.
## §3 — Claim inventory (tiered, confidence-graded)

Evidence tiers: **Demonstrated** = ran/rebuilt/observed independently · **Code-verified** = source/docs read at pin · **Maintainer claim** = asserted by maintainer, not independently executed · **External** = third-party source · **Rebutted** = contradicted by evidence.

| # | Claim | Tier | Confidence | Status at pin |
|---|---|---|---|---|
| 1 | 183 `fs-*` dirs = 163 native workspace members + 20 standalone; 183/183 CONTRACT.md | Demonstrated (counted) | High | **Demonstrated** — exact match with README badges |
| 2 | 880 tracked integration-test files in committed inventory | Demonstrated (counted) | High | **Demonstrated but stale** — 1,082 `tests/*.rs` exist on disk; 202 untracked by an inventory regenerated 11h earlier. The README honestly documents the tracked-input methodology, but the stats lag the tree |
| 3 | Every QoI is Estimated/indeterminate; "only steady conduction is production-grade 3-D"; no accelerator backend | Maintainer claim (explicitly self-disclaimed) | High | **Demonstrated as self-reported** — the strongest claim-integrity signal in the tree is the README's refusal to claim more |
| 4 | unsafe policy: default `deny(unsafe_code)`; 27 registered capsules, all with SAFETY.md; actual non-WASM unsafe in 33 files | Code-verified | High | **Demonstrated with a gap** — 6 unsafe-containing files are tests/diagnostic (`fs-couple`, `fs-exec`, `fs-qty`, `fs-rand`, `fs-tilelang` tests + evidence-runner diagnostic) and are not in the capsule registry; only 18 crates carry the stronger `forbid(unsafe_code)` |
| 5 | Exactly one L3 capability (`thermal.conduction-solve`), zero L4/L5, among 15 registered | Code-verified | High | **Demonstrated** — `capability-maturity.json` matches the README table |
| 6 | Level-B cross-code validation: 4 external thermal references generated by scikit-fem 11.0.0 (pinned uv.lock), fail-closed, byte-stable re-derivation — plus 1 synthetic CHT fixture = the README's "five Level-B cases" | Code-verified | High | **Demonstrated** — decks + manifest + README instructions verified; but **maintainer-executed**, not independent third-party |
| 7 | Level-C: 4 retained published-experiment records (Martin–Moyce + 3 digitized curves) | Code-verified | Medium | **Partially demonstrated** — retained as derived-only; no raw data, no metrology, no replayable digitization lineage, no defensible scalar envelope (README says so itself) |
| 8 | Golden determinism sentinels: `rand_nla_golden_hash` requalified cross-ISA/release, ascent goldens refreshed | Maintainer claim (receipts retained) | Medium | **Claimed with retained receipts** — the mechanism (promotion gate with machine-axis witnesses) is visible; the receipts were not independently re-executed |
| 9 | asupersync 0.5.0 is the latency-lane runtime; Franken-only deps enforced by xtask | Code-verified | High | **Demonstrated** — `Cargo.lock`, fs-exec manifest, `[patch.crates-io]` constellation comment |
| 10 | DSR is the authoritative verifier; GitHub Actions is non-authoritative | Maintainer claim | Medium | **Claimed; CI-observed** — 3 workflows exist (piano/percussion/topology); percussion run #96 FAILED at an earlier head; runs at the pin were queued/skipped. DSR is maintainer-private and cannot be independently observed |
| 11 | GPU: no accelerator backend or runtime dependency exists; policy-first doctrine only | Code-verified | High | **Demonstrated** — zero wgpu/cuda/metal refs in any manifest; ACCELERATOR_DOCTRINE.md explicitly "does not admit a runtime" |
| 12 | No crates.io release; no stable API | Demonstrated | High | **Demonstrated** — API 404s + README "no general CAD/CAE application or crates.io release is claimed" |
| 13 | Suite health: committed receipt is stale (2026-08-01), dirty tree, not-green (7,621/95/38) | Demonstrated | High | **Demonstrated negative** — candidly retained; nothing at the pin establishes a green suite |
| 14 | fs-ledger at L1 with 4 red GC tests from upstream FrankenSQLite cascade ordering | Maintainer claim | Medium | **Claimed with open beads** — the provenance promise currently depends on upstream fixing cascade ordering |
| 15 | v1 scope: 2026-09-01 bead retired turbulence, compressible, IGA shells, FMM-VPM to [M] epics | Maintainer claim | High | **Claimed (bead-referenced)** — the physics-breadth pitch narrowed; assess the shipped scope, not the roadmap |
| 16 | "Event-driven network simulator; replaces ns-3" (brief framing) | — | High | **Rebutted** — zero ns-3 mentions in README/plan/docs; the repo is a multi-physics geometry/simulation continuum |

## §4 — Benchmarks and reproduction cost

### Maintainer benchmark table

| Benchmark | Result claimed | Tier | Audit |
|---|---|---|---|
| Comparative performance (speedup, throughput, ns/op) | **None claimed** | n/a | **Verified absent** — the README's only perf row says "measure machine axes and STREAM-like baselines before interpreting kernel throughput." No comparative numbers exist to audit; performance posture is methodology-only (fs-roofline, report-only baseline candidates, refuse-by-default prose) |
| Deterministic goldens (rand NLA hash, ascent) | Bit-stable across ISA/build | Maintainer claim | Receipt-retained; not independently re-executed |
| Level-B cross-code (scikit-fem vs fs-conduction) | Agreement within committed tolerances | Code-verified | Decks + pinned env present; maintainer-executed |
| Percussion/piano physics smoke | CI lane green (conditional) | External (Actions) | Run #96 FAILED at earlier head; pin-commit run was queued/skipped at observation |
| Suite (2026-08-01 receipt) | 7,621 pass / 95 fail / 38 ignore, dirty tree | Demonstrated (stale) | Retained as not-green; cannot establish current health |

### Reproduction cost (independent rerun)

- **Checkout:** 163-crate workspace, 2,711 `.rs` files, 2,101,489 lines (1,442,238 src / 630,136 tests / 29,115 wasm); plus sibling checkouts: **asupersync**, **frankensqlite**, and (for optional/tool lanes) **frankentorch**, **frankennumpy**. [Demonstrated]
- **Toolchain:** pinned Rust 2024 nightly; the constellation lock (`xtask check-constellation`) fails resolution if siblings are missing or at wrong heads. [Code-verified]
- **Compute:** no cost numbers published; the DSR recipe is maintainer-private. The only observed execution environment in the retained artifacts is the stale suite receipt's host: Darwin arm64, 14 CPUs. Full-suite execution is not independently reproducible from public artifacts alone. [Maintainer claim / gap]
- **Cost asymmetry — the honest version:** re-deriving the four Level-B cross-code references is *cheap* (a `uv` venv, the committed case decks, and `solve_skfem.py` — minutes on a laptop), which is why next-step #2 is the recommended first independent check. Re-running the full suite is *impossible* for a third party (DSR is private; the retained receipt is stale and dirty-tree). Contrast the incumbent bar: deal.II's own paper reports "some 1,000 regression test programs run every night on a number of different machines" (Bangerth et al., ACM TOMS 2007), and the project has been public since 2000 with 60+ publications listed by 2007. FrankenSim's suite may be comparable in size (880 tracked test files) — but its greenness is unverifiable, which is the difference between a test suite and a testing *claim*. [Code-verified + External, Medium]
- **Independent benchmark table:** no independent benchmark, review, deployment, or research publication found in public search (frozen July fork `shabbirhas1/frankensim`, 0 stars, preserves the old plan-stage state; official website repo is support context). Absence reported with search-recall caveats. [External, Low-Medium]

## §5 — Competitor and lane analysis

FrankenSim does not compete with ns-3 (a network simulator) — the correct comparison set is **multi-physics CAE and evidence-oriented scientific computing**:

- **OpenFOAM** — the open-source CFD incumbent: millions of production hours, vast validation corpus, but no built-in evidence/provenance algebra and C++ template-heavy numerics. Owns the *production simulation* lane outright. FrankenSim's only defensible angle is certified numerics + evidence packaging, which OpenFOAM does not attempt.
- **FEniCS/dolfinx, deal.II, MFEM** — the FEM incumbents: deal.II runs ~1,000 regression test programs nightly across multiple machines, has been public since 2000, and listed 60+ downstream publications by 2007 (Bangerth et al., ACM TOMS) — a validation *culture*, not just a validation vocabulary. They own the *research FEM* lane. FrankenSim's scikit-fem cross-code checks are, ironically, performed against a code in this tier — the validator is more production-proven than the validated. [External, Medium]
- **SimScale/Ansys Discovery (cloud CAE)** — own the *usability* lane (browser CAD→mesh→solve). FrankenSim's WASM kernels and strict CLI gesture at this lane but with zero product surface and no release.
- **ASME V&V 10/20/40 standards ecosystem** — owns the *validation vocabulary* lane FrankenSim borrows from; the repo's Gauntlet G0–G5 and evidence colors are a private dialect of this public language, which is both its strength (familiar shape) and its adoption risk (translation cost).

**Why incumbents keep their lanes:** every one of them ships artifacts (releases, packages, benchmarks) and accepts external contributions. FrankenSim ships neither. Its only credible near-term wedge is not a solver but a *methodology export*: contracts-with-no-claims, evidence colors, claim-integrity gating, and content-addressed evidence packages — ideas that could be adopted by any of the above without adopting the 2.1M-line tree.

## §6 — Strengths, weaknesses, bear-case steelman

### Strengths

1. **The self-auditing evidence culture is the best in this assessment program.** 183/183 contracts each carrying a written no-claim boundary; the fs-conduction contract's no-claim section even records a *retired* README/CONTRACT contradiction as a bead. The claim-integrity defect taxonomy is burn-down tracked (40 of 47 rows closed per the README's capability table — maintainer-reported, not independently audited), with severity-weighted promotion gates. Fail-closed refusal design is pervasive ("a corrupted manifest panics here rather than seeding a smaller registry"). **[Code-verified, High]**
2. **Real cross-code validation with external software.** The four Level-B thermal references are generated by scikit-fem — no shared code with the workspace — against committed decks, pinned interpreter/platform, with known-answer self-checks gating reference freezing. This is the correct shape of V&V Level-B, executed honestly. **[Code-verified, High]**
3. **Determinism as engineering, not aspiration.** Philox keyed streams, sorted assembly, golden sentinels requalified across ISA and debug/release with retained receipts, byte-stable deck re-derivation. Deterministic replay is load-bearing in the design, not a README adjective. **[Code-verified, Medium-High]**
4. **Policy-as-code governance at scale.** `xtask` checks layer direction, Franken-only runtime deps, contract presence, unsafe-capsule registration, constellation lock heads, schema conformance, and source-manifest/SPDX consistency — applied uniformly across 163 crates. The governance is executable, not aspirational. **[Code-verified, High]**
5. **Provenance infrastructure.** Content-addressed source manifest, SPDX 2.3, tamper-evident artifact identity, evidence packages v9 with Merkle roots and a solver-free checker — and the maintainer self-flags the weak spots (FNV-64 legacy fingerprint is "NOT a cryptographic root"; format-9 structural integrity "is NOT authenticity"). **[Code-verified, High]**

### Weaknesses

1. **[HIGH] The evidence machinery may be the product.** AGENTS.md's own Rule 0.1 — "VALUE DELIVERY OVER PROCESS: NO PROCESS PORN" — opens with "FrankenSim is missing large amounts of real product functionality" and states flatly: "Process is never the product unless the user explicitly asks for process work." The tree keeps building the machinery anyway. After ~11 weeks and 2.1M lines: 15 registered capabilities, one L3, zero L4/L5, no release. The methodology is exportable; the software is not yet usable. The maintainer's rule names the failure mode precisely; the tree has not yet obeyed it.
2. **[HIGH] Structural adoption ceiling.** Bus factor 1, contributions not accepted (issues "may be reviewed and independently reimplemented"), no crates.io, no stable API, no written support policy — and the license rider bars OpenAI/Anthropic *and their agents/contractors* from even benchmarking the code, i.e., from the exact "agent-first" users the architecture targets. No engineering achievement inside the tree can fix a governance perimeter this tight.
3. **[MEDIUM] Suite greenness is unestablished and unverifiable.** The retained suite receipt (2026-08-01) is stale, dirty-tree, and not-green (95 failures). GitHub Actions is declared non-authoritative by policy; the authoritative DSR is maintainer-private. A third party cannot determine whether the suite is green at the pin — the most basic health question has no public answer.
4. **[MEDIUM] The stats pipeline already lags development.** The doc-facts inventory regenerated 11 hours before the pin, yet 202 test files on disk are untracked by it. Self-reported counts (880) undercount the tree (1,082). The honesty machinery is real but slower than the codebase it audits — a measured bound on claim-integrity governance under high velocity.
5. **[MEDIUM] Scope retired faster than capabilities shipped.** The 2026-09-01 bead retired turbulence, compressible flow, IGA shells, and FMM-VPM from v1 to deferred `[M]` epics; the bead tracker carries 1,186 deferred issues against 1,416 closed. The physics-breadth narrative now rests on smoke-tier campaigns (piano/percussion) and one L3 conduction workflow.
6. **[LOW-MEDIUM] The provenance promise depends on upstream.** fs-ledger sits at L1 with 4 red GC tests attributed to FrankenSQLite cascade ordering; the design-ledger/time-travel story is blocked on a sibling repo's bug. Constellation risk is real when your storage layer is a sibling's pre-release.

### Bear-case steelman

FrankenSim is a single-maintainer monument to how scientific software *should* be built, not software anyone can use yet — and the gap is structural, not technical. No release, no crates.io, no accepted contributors, no L4 validation, and every QoI self-rated Estimated after eleven weeks of superhuman velocity. The rider excludes the AI labs — the precise agents the "agentic simulation" thesis needs as users — which reads less like strategy than like a training-data moat around a personal research program. The most likely end state is not a simulator but a methodology mine: the contracts, evidence colors, claim-integrity gates, and package format get extracted by the broader program while the 2.1M-line tree freezes the week the maintainer's attention moves on. The honest docs will make the freeze legible. They will not prevent it.

## §7 — License

**"MIT License (with OpenAI/Anthropic Rider)"** — GitHub classifies it as `other`. **Not OSI-compliant** (violates OSD §5/§6: discrimination against persons/fields of endeavor).

Exact rider scope, quoted verbatim from the pin:

- **Restricted Parties:** "OpenAI, L.L.C.; Anthropic, PBC; any of their respective Affiliates; and any person or entity acting directly or indirectly on behalf of, for the benefit of, or under the direction of any of the foregoing (including any officer, director, employee, contractor, agent, consultant, service provider, or representative)."
- **No rights granted** to any Restricted Party: "Any purported license, sublicense, assignment, transfer, or other permission to any Restricted Party is null and void absent the express prior written permission of Jeffrey Emanuel."
- **Distribution ban:** "You may not provide, disclose, distribute, sublicense, sell, lease, lend, host, make available, or otherwise permit access to the Software or any derivative work… to or for any Restricted Party."
- **"Use" is defined to include:** "copying, modifying, merging, publishing, distributing, sublicensing, selling, transferring, making available, hosting, deploying, executing, **benchmarking, testing, analyzing, indexing**, or incorporating the Software or any Derivative Works into any dataset, training corpus, evaluation harness, or pipeline for machine learning or other automated systems." (emphasis added)
- **Breach = automatic immediate termination** of all permissions, with a duty to "immediately cease all use and distribution… and destroy all copies under your control"; injunctive relief + prevailing-party attorneys' fees are stipulated.
- The rider **controls over the MIT text** in any conflict and must be included **unmodified** in all distributions of the Software and Derivative Works.

**Assessment impact:** the rider makes independent benchmark/analysis by (or for) the two leading AI labs a license breach. For this program — which evaluates repos partly as agent-era infrastructure — the rider is a hard ceiling: the "agent-first" architecture cannot be touched by the agents of the labs building the frontier models. The `frankensim_website` repo carries the same rider class (verified in the sibling assessment).

## §8 — NODUS

**Ring: Explore.**

- *Why not Monitor:* this is not a website, a frozen fork, or a retired demo. It is an active, unusually rigorous research program with 2.1M lines of executable source, real cross-code validation, and a methodology (contracts, evidence colors, claim-integrity gates) that deserves study and potential extraction.
- *Why not Pilot:* a pilot needs a bounded workload fit against a shippable artifact. There is no release, no crates.io publication, no stable API, no L4 validation, no verifiable green suite, and no accepted-contribution path. Nothing here can be piloted yet.
- *Why Explore and not a higher-confidence bet:* the evidence machinery is the strongest reason to engage; the structural ceiling (bus factor 1, no-contributions policy, AI-lab rider, unverifiable CI) is the strongest reason to keep engagement cheap. Explore = study the governance, attempt the falsifiable next steps (§"Franken-worthy"), revisit on triggers (§10).

## §9 — Wardley map

- **Commodity:** Rust nightly toolchain, Cargo, SPDX 2.3, BLAKE3, scikit-fem/numpy/scipy as V&V oracles, GitHub Actions (deliberately non-authoritative here).
- **Product / approaching product:** the fs-* crate continuum (deterministic numerics, geometry, meshing); the conduction solve pipeline (the lone L3); the strict CLI; the WASM kernel surface. These are *custom-built* but pre-product: no release, no packaging.
- **Custom-built:** the two-lane asupersync executor, the FrankenSQLite-backed design ledger, content-addressed evidence packages v9 + solver-free checker, the musical-acoustics stack, the bounded E2E campaign harnesses.
- **Genesis:** the evidence-color algebra with no-laundering composition; the claim-integrity defect taxonomy with severity-weighted CI promotion gates; contracts carrying explicit no-claim boundaries as a *per-crate* norm; the DSR "private authoritative runner" verification model. Nothing in the incumbent lane (OpenFOAM/FEniCS/deal.II) does per-crate no-claim contracts or evidence-color composition — this is the genuinely novel territory, and also the least proven.

**Movement:** SBOM/SPDX provenance is already commodity — FrankenSim's source manifest rides a commodity wave. The WASM demo surface is custom-built drifting toward product but blocked by the no-release policy; it cannot cross into product without a release artifact. Per-crate no-claim contracts and evidence-color composition show *no visible movement* toward adoption anywhere in the incumbent lane — they are genesis ideas with no second implementation, which is both their value (unclaimed territory) and their risk (unvalidated territory). The DSR private-runner model is moving *away* from commodity (public CI) — a deliberate but isolating choice.

## §10 — Trajectory and revisit triggers

**Trajectory:** velocity is extreme (999 commits in the first 5 days per the maintainer's changelog research; 6,545 contributions over ~11 weeks) but breadth is being *retired* faster than capabilities mature (turbulence/compressible/IGA/FMM-VPM moved to [M] epics 2026-09-01; 1,186 deferred beads vs 1,416 closed; the capability registry's 15 entries are dated 2026-07-23 — two months of velocity with no new capability registration). The quantified tension: development velocity exceeds both audit velocity (202 test files outpaced the stats inventory in 11 hours) and maturation velocity (one L3 in 11 weeks). Two futures are visible: (a) convergence — the tree prunes to a narrower, deeper conduction/airflow/evidence core and the deferred epics are formally abandoned; (b) methodology mine — the contracts, evidence colors, claim-integrity gates, and package format get extracted by the broader program while the tree freezes. The current arc points at (a) in prose and (b) in incentives.

**Revisit triggers (any one re-opens the packet):**
1. First L4 registration (experimentally validated capability) in `capability-maturity.json`.
2. A crates.io release or tagged version of any `fs-*` crate.
3. Contribution policy change (external PRs accepted/merged).
4. An independent third-party reproduction (Level-B deck re-run, evidence-package verification, or published review/benchmark).
5. Suite-greenness evidence: a retained, clean-tree, green suite receipt at a recent pin.
6. Rider modification or carve-out (especially any agent/benchmark allowance).
7. Maintainer silence > 60 days (abandonment tripwire — bus factor 1).

## §11 — Limitations of this assessment

- **No code was executed.** Line/file/test/unsafe counts were computed from a fresh shallow clone at the pin; claims about suite greenness, determinism receipts, and campaign outputs rest on retained artifacts and maintainer prose, not on independent runs. DSR — the authoritative verifier — is maintainer-private and was not observable.
- **Public search has recall limits.** The "no independent coverage" finding reflects web search on 2026-09-22; non-indexed deployments, private evaluations, or non-English coverage could exist.
- **The shallow clone limited history analysis.** Commit-velocity claims beyond the 150-commit window rely on the maintainer's own changelog research file. Agent co-authorship sampling covered only that window.
- **The 880-vs-1,082 test-file drift** is a same-day observation; whether the inventory converges or diverges further is unknown.
- Cross-repo context: the companion `frankensim_website-assessment.md` (support repo with live WASM demos) recorded stale count drift between the deployed site and the tree; it is context, not evidence for this packet, and its claims were not re-verified here.
- **TRL is called as 4 with a reach toward 5:** TRL 4 (lab validation of components) is firmly evidenced via Level-A analytic and Level-B cross-code checks. TRL 5 (validation in a relevant environment) would rest on the single L3 conduction workflow — but that workflow's own QoI verdict is Indeterminate with eight NO-DATA terms, so the honest single number is 4. The packet states the lean explicitly rather than hiding behind the range.
- The packet was produced under a multi-round grading loop; residual grader-blind spots are possible (the FrankenRedis exemplar taught this program that a dating error can survive two graders — the cross-check layer was applied here).
## §12 — Eight deepening questions

**1. Provenance — how far does "evidence-carrying" actually reach?** The source manifest plus SPDX 2.3 gives content-addressed provenance for the tree itself, and evidence packages v9 carry Merkle roots with a solver-free checker — but the maintainer self-flags the boundaries: the legacy FNV-64 artifact fingerprint is explicitly "NOT a cryptographic root," format-9 structural integrity "is NOT authenticity," and the Phase-0A release gate requires a caller-supplied verifier plus an independent trust channel. The honest reading is that FrankenSim has built the *envelope* for provenance (hashes, manifests, ledgers, time-travel) without yet solving the *authority* problem (who vouches, through what independent channel). The next falsifiable step is the one the design already names: an independent verifier implementation in a second language checking a committed package. Until that exists, provenance is a well-engineered claim, not a demonstrated property.

**2. Embeddable unit — what is the smallest shippable piece?** The dependency chains say: `fs-qty` needs only `fs-blake3` (a sibling), and `fs-ivl` needs `fs-evidence` + `fs-math` — small, typed, deterministic numerics that could plausibly be vendored. But `fs-sparse` already drags in FrankenNumpy bindings (`fnx-classes`, `fnx-runtime`, `fnp-ufunc`, `fnp-dtype`), and anything touching execution pulls asupersync. There is no crates.io release of anything, so "embeddable" currently means vendoring sibling source into your own tree — feasible for the qty/interval kernels, impractical for the physics. The honest embeddable surface is the certified-arithmetic and units layer, not the simulators.

**3. Unexercised option value — what is being kept alive but unused?** Three live options stand out: (a) the WASM/browser kernel surface — `fs-wasm` plus 19 domain WASM workspaces with 40 live demo kernels on the companion site — is the only part of the project a non-developer can touch, yet it carries L1 "two campaign tests red" boundaries; (b) the accelerator doctrine is fully written policy (memory-bandwidth-first, GPU-friendly data layouts, exploratory SME2 gated) with zero backend — a complete strategy awaiting a strategy-shaped problem; (c) the design ledger's time-travel and the deferred `[M]` epics (turbulence, compressible, IGA shells, FMM-VPM) are architectural options the maintainer is paying carrying costs on (1,186 deferred beads). The question for each is whether the option premium is worth it, or whether the tree should be pruned to the conduction/airflow/evidence core it can actually mature.

**4. Benchmark honesty — what survives an adversarial rerun?** The admirable fact: no comparative performance numbers are published at all, so there is nothing to debunk — the perf posture is refuse-by-default prose plus `fs-roofline` measurement infrastructure with explicitly report-only baselines. What *would* survive an adversarial rerun: the Level-B scikit-fem decks (pinned env, byte-stable, fail-closed self-checks) and the golden determinism sentinels (cross-ISA requalification with machine-axis witnesses) — both are designed to be re-derived by a skeptic. What would *not* survive: any claim about suite greenness (stale not-green receipt), any claim about the WASM demos matching the tree (the companion assessment found stale count drift), and any claim that the three GitHub Actions workflows constitute CI (the maintainer disclaims them).

**5. Governance path — what breaks first under the current model?** The already-visible break is the stats pipeline: 202 test files outpaced the honesty inventory in 11 hours, meaning development velocity exceeds audit velocity. Next in line: the bead tracker (1,186 deferred vs 1,416 closed — deferral is becoming the default disposition), and the DSR single-machine bottleneck (the authoritative verifier is one person's runner; its failure modes are invisible to everyone else). The governance is brilliantly designed for a single operator and has no path to a second one — contributions are not accepted, and the bus factor is 1. The system that audits everything cannot audit its own succession.

**6. The license as strategy — what is the rider actually for?** The rider bars OpenAI/Anthropic, their affiliates, and anyone acting for them from even *benchmarking or analyzing* the code — a scope far beyond training-data protection. For a project whose architecture is explicitly "agent-first" (agentic simulation, agent-run V&V campaigns, bead/bv workflows built for agent operators), excluding the labs building the frontier agents is a strategic contradiction: the intended users are legally barred from touching it. The plausible readings are (a) a defensive moat around a personal research program, or (b) leverage for a future commercial license. Either way, the rider converts the project's best distribution channel — the AI-lab ecosystem — into its largest legal risk, and it should be priced into every adoption decision as a hard ceiling, not a footnote.

**7. Agent-era fit — where do agents actually help or hurt here?** The fit is paradoxically strong on the inside and blocked on the outside. Inside: the bead/bv workflow, claim-integrity gates, and evidence packages are *agent-native* infrastructure — an agent can run a bounded campaign, retain receipts, and refuse to launder evidence better than a human can. The musical-acoustics CI lanes and the deterministic campaign harnesses are exactly the shape of agent-executable V&V. Outside: the rider bars the frontier labs' agents from the code entirely, and DSR being single-machine means no agent fleet can share the authoritative verification path. What is needed for agent-era leverage: a rider carve-out for benchmarking/analysis by AI systems (without which the "agent-first" thesis is self-refuting), and a documented path to a second DSR operator. Without those, the agent-native design serves exactly one agent: the maintainer's.

**8. Kill test — what evidence would end the Explore thesis?** Three clean kills: (a) an independent re-run of the four Level-B scikit-fem decks *disagrees* with `fs-conduction` beyond committed tolerances — the cross-code check is the load-bearing validation claim, and its failure would impeach the evidence culture itself; (b) the 60-day abandonment tripwire fires (no commits, no bead movement) — bus factor 1 makes this the base rate, not the tail; (c) a competitor ships the methodology export first — e.g., a deal.II or FEniCS plugin adopting per-crate no-claim contracts and evidence-color composition — which would strand FrankenSim's genesis ideas in a 2.1M-line tree nobody needs to adopt. Conversely, the Explore thesis *graduates* on: a first L4 registration, a crates.io release, or an independent reproduction — the revisit triggers in §10.

---

## §13 — Proposed Rulebook amendments (PROPOSED — not ratified)

1. **Stale-brief framing check (new required step).** This packet's brief described FrankenSim as an ns-3-replacing network simulator; the repo contains zero ns-3 mentions and is a multi-physics continuum. *Amendment:* the writer must verify the brief's one-line project description against the repo's own README/description in Round 1 and headline any identity drift before assessing — the brief is evidence about the *program's* staleness, not the project's.
2. **Stats-drift measurement (claim-inventory requirement).** Self-reported counts (880 tracked tests) undercounted the tree (1,082) 11 hours after regeneration. *Amendment:* when a repo self-publishes generated counts, the writer must recompute at least one of them from the filesystem and report the delta as a first-class finding — the drift *is* the governance signal.
3. **License-rider scope quotation (already required) plus agent-fit analysis.** Quoting the rider is necessary but insufficient; the FrankenSim rider's exclusion of AI-lab agents directly contradicts the project's agent-first architecture. *Amendment:* the license section must include a one-paragraph "rider vs. thesis" consistency check — does the license permit the project's own stated users?
4. **Private-authoritative-CI handling.** The maintainer declares GitHub Actions non-authoritative and DSR (private) authoritative — a structure that makes suite health unverifiable. *Amendment:* when the authoritative CI is not publicly observable, the packet must say so explicitly and treat suite-greenness as *unknown*, not as neutral — absence of evidence is not green.
5. **No-change confirmation.** The FrankenRedis exemplar concluded "Rulebook stands as written." For FrankenSim, the five amendments above are proposed; everything else in v1.0 worked as specified. The core packet structure, claim-tiering, two-grader loop, and stop conditions needed no modification.

---

*End of packet v5. Pin `4b004dcd3efa502ef5de84cf2ed118ccdeafde02`. All counts computed from a fresh shallow clone at the pin on 2026-09-22; web facts observed same-day and labeled [External].*
