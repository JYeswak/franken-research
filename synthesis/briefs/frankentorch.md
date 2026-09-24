# Cross-Suite Brief: frankentorch

**Analyst:** cross-suite analyst (depth 2/2) · **Date:** 2026-09-22 · **Pin read:** `91cda6541a4402caff217f014e0535429dade9ac` (frankentorch-assessment.md, packet v2, RULEBOOK v1.0).
**Method:** own packet read fully; the other 43 packets skimmed via TL;DR + targeted extraction of claim-inventory, verdict/TRL/NODUS, benchmark sections, limitations, and license/governance. Evidence-tier labels are quoted or carried over from each packet as written.

---

## 1. OWN-PACKET DISTILLATION

**Verdict / TRL / NODUS ring:** **NODUS ring: Explore** [Inference, Medium]. **TRL 4** — "Lab-validated components (differential harness, 42,708-line negative-evidence ledger, DAC machinery verified in code) with zero production exposure, one quotable perf lane, no release artifact, and the flagship CI red at the pin" [Inference, Medium]. The ring is qualified in-packet as **"Explore-with-a-ceiling, currently un-advanceable past Explore while the rider stands"** — the license rider is instrumented as the advancement blocker, priced into feasibility (2/5) and collaboration (1/5), wired to revisit trigger 3.

**Strongest strength:** The measurement-integrity apparatus, not the software. A 42,708-line negative-evidence ledger [Counted, High]; a standing four-rule measurement gate (name the worker, name the harness, quote both estimators, replicate before quoting — adopted 2026-08-15) whose own verdict is that exactly one of fourteen vs-PyTorch lanes is quotable [Counted on the file and sentence; numbers are the maintainer's — Maintainer claim, High]; the public SDPA-layout retraction of a 2x "win" as a 3-D-vs-4-D layout artifact [Maintainer claim, High]; and the allocator-gap diagnosis (40–73% of alloc-bound lane time is the system allocator) [Maintainer claim, Medium]. The packet's own summary: "the apparatus is the product; the tensor library is its demo" [Inference, High].

**Strongest ceiling:** The license rider as supply-chain poison. It names "OpenAI, L.L.C.; Anthropic, PBC; any of their respective Affiliates; and any person or entity acting directly or indirectly on behalf of, for the benefit of, or under the direction of any of the foregoing," bars "use" defined expansively to include "copying, modifying, … executing, benchmarking, testing, **analyzing, indexing**, or incorporating the Software … into any dataset, training corpus, evaluation harness, or pipeline," with breach "automatically and immediately terminates" the permissions [Code-verified (license text), High]. For an ML framework, the named Restricted Parties *are* the likeliest evaluators, adopters, and contributors — "a project whose moat is *evidence* forbidding evidence-gathering is self-negating" [Inference, High]. The software ceiling: one quotable lane, CI red at the pin in ~55s [CI-observed, High], bus factor 1, no releases/tags.

**The 3 most important pieces of evidence (with tiers):**

1. **The ledger's self-limiting verdict** — "One of fourteen lanes became quotable. Everything else remains uncertified." [Maintainer claim, High — Counted on the file's existence and the sentence; the one quotable lane is `prelu_noshortcut`, median 1.048–1.180, lowest confidence bound 1.006]. The packet treats this as the single strongest honesty exhibit: the thesis does not rest on beating PyTorch — "a project that forbids itself from quoting thirteen lanes is not hiding weakness, it is demonstrating the gate" [Inference, Medium].
2. **The SDPA layout retraction** — the maintainer published that PyTorch runs 22.96 ms at 3-D vs 4.53 ms at 4-D while FrankenTorch runs 9.78 ms vs 6.20 ms (1.58x *slower*), declaring "the earlier 'PyTorch CPU has no f64 flash' premise was wrong" and correcting the gauntlet lane to 4-D [Maintainer claim, High — from the release-readiness scorecard].
3. **The unsafe-code census vs the docs** — 116 counted unsafe sites in the two kernel crates under `#![deny(unsafe_code)]` gates with documented allow scopes [Counted, High], while AGENTS.md says "Forbidden" and the CHANGELOG says "forbid globally" [Counted, High — stale]. This is "the sharpest README-vs-code tension" and the in-packet proof of the doc-drift pattern (§4.7.5) [Counted, High].

---

## 2. SHARED NEGATIVE PATTERNS

### P1. The named-party AI-lab rider — shared with ~40 of 43 packets (the entire FrankenSuite)

Frankentorch's rider is not unique; it is the suite's constitutional license. Every sibling packet reports the same MIT+OpenAI/Anthropic-rider construct:

- **frankenredis:** "the license rider bars OpenAI/Anthropic and anyone acting for them from using, benchmarking, or even analyzing the code — killing any AI-company use case and possibly discouraging contributors" [Inference, Medium]; its rider wording differs slightly (frankentorch's packet notes its own variant "omits 'contractor' and 'agent' from the parenthetical, unlike the frankenredis variant").
- **frankenjax:** "the license rider bars OpenAI/Anthropic and their agents from even *analyzing* the code — the same labs whose models co-authored 53% of recent commits" [External, High].
- **frankennumpy:** the rider "kills independent validation and the agent-era evaluation story" [Code-verified (license text), High].
- **frankenpandas:** the rider "bars OpenAI/Anthropic (and anyone acting for them) from use/benchmarking/analysis and demands destroyed copies on breach" [Code-verified, High]; frankentorch shares even the "durable" quality — frankenpandas's rider "adopted at inception, survived review in bead `frankenpandas-dio8`."
- **frankenterm / frankenwhisper / frankentts:** the rider "withholds all rights — including benchmarking and analysis — from the two leading AI labs."

The pattern is so uniform that the frankentorch packet's recommendation ("treat the rider as a supply-chain screen" program-wide) reads as a suite diagnosis, not a frankentorch diagnosis. Frankentorch's special bitterness is only circumstantial: it is the one project whose *core market* (AI labs training models) is exactly the Restricted Parties list [Inference, High].

### P2. CI red at the pin — shared with 9 other packets explicitly

Frankentorch's flagship `phase2c-reliability-gates` run #35731363456 failed in ~55s [CI-observed, High]. Same signature elsewhere:

- **frankenredis:** "CI is red at the pin — conformance run #7679 failed at the `cargo fmt` gate (all substantive gates skipped) and the Tcl lane's scheduled run #284 failed at the verdict-verification step" [CI-observed, High] — note the same *fmt-gate-first* failure shape as frankentorch's inferred G1 fmt/clippy failure.
- **frankennumpy:** "CI is **red at the pin** — the latest run (head = pin) fails at the G1 `cargo clippy -- -D warnings` gate with G2–G9 all skipped … while the README badge still reads 'G1 green'" [CI-observed, High] — the same G1-shape failure plus the same stale-badge drift as frankentorch (§4.7.5).
- **frankenlibC:** "main CI is red at the pin" [High]; **frankenfs:** "CI red on the main workflow at HEAD"; **frankensympy:** 786 consecutive CI failures ("pin fails at the fmt gate, unit tests never run") [CI-observed, High]; **franken_node:** "all 8 push-triggered runs observed against the pin's head SHA concluded failure" [CI-observed, High]; **franken_engine:** "The core CI lane is red at the pin … it has never gone green"; **franken_lean:** "CI at the pin is red on the main gate — 11 of 30 steps failing"; **franken_agent_detection:** "The main CI job is red at the pin — the `Format` step fails, so clippy/tests/packaging never executed."

### P3. Bus factor 1 (single human maintainer, no succession) — shared with effectively all 43

Explicit "bus factor 1" appears in 41 of 43 other packets; the remaining two (frankenjax, franken_lean) each name a single human maintainer with no second committer. Representative quotes:

- **frankenredis:** "one human maintainer and no bus factor" (in the packet's own phrasing).
- **franken_node:** "bus factor 1" [External, High]; **frankenscipy:** "bus factor 1 (6,395 commits by a `claude` contributor, 158 by the human owner)"; **frankenmermaid:** "**bus factor 1 at extreme velocity** — one human, ~3,282 commits in ~7 months, on a pinned nightly; everything else (license, benchmarks, roadmap) becomes moot if the maintainer stops."
- Explicit no-contributions policies compound it: franken_lean, franken_node, frankenscipy, frankensqlite, frankenwhisper, frankentts, frankenterm, franken_ocr, frankensim ("contributions-not-accepted policy").

Frankentorch's packet documents this the same way (6,305 commits: 6,104 by the maintainer; "no succession plan, no second committer, no foundation, no release artifact to fork from cleanly") [Git-observed + External, High].

### P4. Doc drift (README-vs-code, stale status surfaces) — shared suite-wide

Frankentorch: README says 12 crates (13 at pin), "zero-dependency" ft-core (manifest declares `half 2.7`, `num-complex 0.4.6`), "unsafe forbidden" (deny + 116 sites), scorecard dated three months before the pin [all Counted, High].

- **frankenjax:** "The README contradicts itself and the code on the most basic facts (118 vs 162 primitives, 15 vs 17 crates, 162,733 vs 459,703 lines)" [Counted, High] — a strictly larger drift instance than frankentorch's 12-vs-13.
- **franken_networkx:** "the README is a drift source (13-variant tie-break → 12 counted; 33 fuzz targets → 34 counted…)" [Counted, High].
- **frankensqlite_website:** four claims contradicted by the engine it markets, including "'26-crate workspace' vs 28 counted crates — stale, and the staleness is **enforced by the site's own tests**" [Verified, High].
- **franken_threed:** "the public status surface is stale (README honest-status table still says 'Is there a compiler, renderer, or CLI? **No**')"; **franken_whisper:** "CHANGELOG scope window 4 weeks stale at HEAD"; **frankensympy:** "the README's 'green workspace tests' line is stale-by-a-month"; **franken_code_browser** is the one deliberate exception — its README "disclaims its own tense" so it "cannot be caught in README drift *by construction*, because it claims nothing is built" [Code-verified, High].

### P5. The asupersync aspiration gap (mandated-but-unexercised dependency) — shared with 4+ packets

Frankentorch: "AGENTS.md 'Async Runtime: asupersync (MANDATORY)'; the tree shows no exercised structured-concurrency runtime — zero `use asupersync::sync|task|runtime` or `Cx` sites" (observed usage is `raptorq::*`, `types::*`, `util::*` only) [Counted, High] — a docs-vs-code drift the packet explicitly calls "smaller than the unsafe one."

- **franken_drone_geometry_reconstruction:** "the maintainer's asupersync doctrine is aspirational (zero references in code or lockfile)" [Code-verified, High]; its packet's next-steps say "**Close the asupersync gap one way or the other**."
- **franken_code_browser:** "asupersync has **zero** Cargo edges anywhere in the tree" [Counted, High] while the constitution mandates it.
- **franken_surveillance_system:** "the declared sole async runtime (asupersync) is absent from `Cargo.lock` and the tree contains zero `async fn`" [Code-verified, High].
- **franken_alignment:** "asupersync — badged as 'the runtime' — is not admitted (FA-053 blocked: unadmitted dependencies… 'No foundation has been admitted')" [Maintainer claim, High].
- **franken_node:** "the asupersync transport integration is real feature-gated code but no CI workflow has ever compiled the `asupersync-transport` feature" [Code-verified, High].

### P6. Verification on maintainer-private infrastructure, unobservable by outsiders — shared

Frankentorch's packet documents an RCH fleet (8 Contabo VPS workers [Maintainer claim, Medium]) and notes the "differential against oracle" arm depends on a local-venv setup "the packet never observed executing" [Code-verified + Maintainer claim, High].

- **frankenjax:** "zero GitHub Actions workflows exist, so every 'green' claim executes on the maintainer's local RCH fleet and is attested only by checked-in artifact JSON" [External + Inference, High].
- **franken_node:** "verification runs on maintainer-controlled RCH hosts that are not independently inspectable."
- **franken_tui:** "GitHub Actions was disabled 2026-09-06 so all verification runs on maintainer-private DSR … infrastructure invisible to outsiders."
- **franken_alignment:** "the gates require the maintainer's private RCH fleet so no independent party can reproduce them" [Inference, Medium]; its pin commit's own message documents newest tests as unexecuted ("rch not found (exit 127)") [Git-observed, High].
- **franken_lean:** "CI shows a 103-pass elaborator run on a neighboring commit, not the pin."
- **franken_remote:** "greenness at the pin is unestablished (the pin has zero registered check-runs)."

### P7. Agent co-authorship at scale murkying the "clean-room" label — shared

Frankentorch: 226 of the last 500 commits (45%) carry agent Co-Authored-By trailers, 225 of them Anthropic models — a named Restricted Party [Git-observed, High]; the packet notes the rider "cannot bind its own author" but flags the irony and the epistemic point that "a clean-room implementation whose author bars benchmarkers is making an assertion no independent party may test" [Inference, Medium].

- **frankenjax:** "the same labs whose models co-authored 53% of recent commits" [External, High] — a larger share than frankentorch.
- **frankenscipy:** "bus factor 1 (6,395 commits by a `claude` contributor, 158 by the human owner)" — an agent persona is the *plurality* author.
- **franken_threed:** "AI-agent-authored at scale with opaque provenance" [Git-observed, High].
- **frankennumpy:** "Single human maintainer plus an agent swarm (per the repo's own 'Multi-Agent Development Process' docs)."

### P8. Headline-benchmark disavowal / certified-lanes thinness — shared as a *virtue*, shared as a *problem*

Frankentorch's "one of fourteen lanes quotable" sits inside a suite where self-limiting benchmark verdicts are the norm:

- **frankenpandas:** "The 3.97x geomean covers *certified* lanes only — 143 of 359 (216 uncertified: 74 undecidable, 62 high-CV, 78 read-but-uncertified)" [Code-verified, High]; "the maintainer's own ledger declares sub-1.5x ratios UNRESOLVED after measuring 2.6x same-source build variance" [Code-verified, High].
- **frankennumpy:** "729 of 751 kept performance claims predate the evidence contract and lack same-invocation incumbent ratios" [Maintainer claim, High]; a self-disavowing KEEP-claim audit (22/751 contract-grade).
- **frankenmermaid:** "a claim-coverage audit that self-reports '225 KEEP claims, 8 with a live incumbent ratio — 96.4% without'."
- **franken_networkx:** "579 of 591 KEEP rows carry no vs-incumbent ratio — the headline speedups are overwhelmingly self-speedups, which the project's own ledger contract says 'must not support a competitive claim'" [Code-verified, High].
- **frankenscipy:** "behavioral parity that is name-census rather than assertion coverage (the maintainer admits 'referenced is weaker than compared')."

The honest-negative-verdict *culture* is suite-wide; frankentorch's distinction is only the formalism of the standing four-rule gate.

---

## 3. CI/EVIDENCE BAR: WHAT FRANKENTORCH DEMONSTRATES THAT OTHERS LACK

### E1. The standing four-rule measurement-integrity gate — LACKED BY ALL 43

Zero other packets mention a standing named rule-set for quoting benchmarks. Frankentorch's: **name the worker, name the harness, quote both estimators, replicate before quoting** (adopted 2026-08-15, enforced against the project's own headline claims) [Maintainer claim, High — Counted on the file's existence and the sentence]. Siblings have adjacent pieces but never the named standing gate:

- **frankensearch** has "committed, machine-readable latency receipts (`docs/evidence/perf/*.json` — git revision, hostname, load average, model identities, percentiles) that corroborate the README's numbers to the decimal" [Verified, High] — the closest analog, but a receipt format, not a standing quotation rule with an enforcement date.
- **frankenpandas** has "a generated vs-pandas scorecard with a documented certification gate (live incumbent same-invocation, per-arm A/A nulls, bootstrap median-CI, ELF SHA pinning)" [Code-verified, High] — a certification gate, but applied per-campaign, not a standing publication rule that retracted the project's own win.
- **frankenwhisper** has "a formal result-class doctrine (self-speedups are *maintenance*, not wins; a campaign win requires the actual incumbent binary running side-by-side in the same invocation with A/A nulls in [0.98, 1.02])" — strong doctrine, but no dated standing gate and no same-worker discipline.

Frankentorch's packet explicitly recommends this as the program-wide exemplar (franken-worthy next step 1), and no sibling packet reports having it. **Verdict: genuinely lacking everywhere else — the strongest export candidate.**

### E2. The allocator-gap diagnosis with a named confound and a control feature — LACKED BY ALL 43

Frankentorch measured that 40–73% of alloc-bound lane time is the system allocator (scorecard "RADICAL FINDING," 2026-06-21), showed near-parity-to-winning compute with a caching allocator (measurement-only mimalloc), and ships a default-off `fair-alloc` feature [Maintainer claim, Medium–High]. No other packet reports an allocator-normalized benchmark confound:

- **frankenscipy** has the closest analog: "a documented fleet-wide finding that harness disagreement is as large as worker disagreement" — a *harness* confound, not an allocator confound.
- **frankenpandas** measured "2.6x same-source build variance" and declared sub-1.5x ratios UNRESOLVED [Code-verified, High] — a *build-variance* confound, orthogonal to allocator choice.
- Mentions of `mimalloc` elsewhere (frankenmermaid: "`#[global_allocator]` for mimalloc is safe-Rust by language rule"; frankenredis lists `tikv-jemallocator` as a dependency) are *usage* mentions, not benchmark-confounds with a control row.

### E3. The forensic differential-conformance pipeline (11 forensic binaries) — DISTINCTIVE IN FORM

Frankentorch's `ft-conformance` runs an 11-binary pipeline: `run_differential_report`, `run_e2e_matrix`, `triage_forensics_failures`, `build_failure_forensics_index`, `check_reliability_budgets`, `run_raptorq_durability_pipeline`, `validate_phase2c_artifacts`, `emit_packet_sidecar`, `check_benchmark_regression`, `check_perf_slos`, `run_perf_slos` [Counted, High]. Siblings have differential machinery of comparable scale but none reports a *forensic-triage* stage:

- **frankenredis:** "5,041 counted differential probes against a vendored Redis 7.2.4 oracle" [Counted/CI-observed, High] — probes, no triage pipeline.
- **frankenpandas:** "1,387 conformance packets counted in-tree" [Counted, High] — packets, no failure-forensics index.
- **frankenscipy:** "795 conformance integration-test files" — files, no reliability budgets.
- **franken_ocr** has an L0–L5 parity ladder with skip-honest no-weights mode, but no failure-triage binaries.

The `triage_forensics_failures` / `build_failure_forensics_index` / `check_reliability_budgets` trio is the distinctive shape: conformance *failure forensics*, not just conformance.

### E4. Retraction *in the release-readiness scorecard*, dated and mechanistic — STRONGER IN FORM THAN MOST

Public retractions exist elsewhere (frankenfs's May-2026 self-falsification of its own btrfs read-write as "a *silent-data-loss facade*"; franken_networkx "refutes its own 77,795× headline"; frankenwhisper's "no admissible verdict" campaigns; frankensearch's "v1.6.0: 'Hash control no longer presented as semantic search'"; frankentts's "flagship optimizer's two death certificates"; frankenlibC's "published self-retractions"). Frankentorch's packet claims its instance is the most quotable because the retraction is *mechanistic*: it publishes the falsifying numbers (PyTorch 22.96 ms at 3-D vs 4.53 ms at 4-D; FT 9.78 ms vs 6.20 ms = 1.58x slower), names the false premise ("the earlier 'PyTorch CPU has no f64 flash' premise was wrong"), and corrects the gauntlet lane to 4-D [Maintainer claim, High]. Most sibling retractions are recorded; frankentorch's is a published *causal correction* of the measurement pipeline. (This is a difference of degree, and the packet's own "most measurement-honest codebase" claim [Inference, Medium] should be read against frankenlibC's packet claim of "the strongest measurement discipline observed in the program so far" [Inference, High] — the two packets genuinely disagree about the suite crown.)

### What frankentorch does NOT uniquely demonstrate (merely "also does X")

- **Negative-evidence ledger:** 24 of 43 other packets mention one (frankennumpy 67,641 lines; frankenpandas 44,086; frankenscipy 44,078; frankenlibC 41,205; franken_networkx 37,116; frankenwhisper 26,846; frankenredis 26,485; frankenfs 20,556; frankensearch 19,201). Frankentorch's 42,708 lines are large but not the largest (frankennumpy's 67,641 lines exceed it [Counted, High]).
- **Signed/provenance evidence structures:** franken_engine's signed evidence ledger with transparency log + MMR inclusion/consistency proofs is *stronger* than frankentorch's unsigned, unchained EvidenceLedger (frankentorch's own deepening question #1 admits entries are "unsigned, unchained, and a hostile operator with process access could rewrite history undetectably" [Inference, Medium]).
- **RaptorQ erasure-coding durability:** shared with frankenfs (hand-rolled RFC 6330 fountain-code subsystem, 31,572 lines), frankensqlite (RaptorQ erasure-coded durability as a signature bet), frankensearch (RaptorQ sidecars in code).
- **Strict/hardened mode split:** shared with frankenlibC ("a policy membrane with strict/hardened runtime modes") and frankenscipy ("a **strict/hardened mode split** with fail-closed semantics").
- **Fuzzing at scale:** frankentorch's 56 fuzz targets are exceeded or matched by frankenredis (499 MB / 127,571-file fuzz corpus), franken_node (146/146 fuzz targets), frankenlibC (66 fuzz targets), frankenscipy (96 fuzz targets).

---

## 4. SHARED HURDLES

### H1. The rider as a structural advancement blocker (see P1)

The hurdle is not just legal but program-internal: frankentorch's packet flags "whether the rider bars this very assessment" as open question #2, noting "the license's 'analyzing' prohibition arguably covers the FrankenSuite's evaluation activity — and Anthropic models co-authored 225 of the last 500 commits" [Inference, Medium — legal conclusion, not legal advice]. No sibling packet reports this recursion — frankentorch is the one where the assessment program itself is plausibly in the Restricted-Parties' blast radius, because its own tree is 45% co-authored by a Restricted Party's models.

### H2. Velocity vs review depth

Frankentorch: 6,305 commits in ~7 months (~29/day) [Git-observed, High]; "Review depth is unassessed: PRs-vs-direct-to-main and who reviews bead closures were not examined" [Not verified]. Shared:

- **franken_engine:** "~20 commits/day Sep 1–20, 96 on Sep 15 alone" [Git-observed, High].
- **franken_node:** "~20 commits/day in the sampled window."
- **frankenmermaid:** "~3,282 commits in ~7 months" with bus factor 1 — the packet's ceiling section names this pair explicitly.
- **frankenpandas:** "8,621 commits" [External, High]; franken_lean, frankenscipy similar orders.

The hurdle: velocity is the maintainer's evidentiary engine (beads, ledgers, gates all advance through it), but no second pair of eyes means the whole corpus is single-reviewer. Frankentorch's 1,826-bead tracker is "the closest thing to institutional knowledge transfer, and it lives in-repo" [Inference, Medium] — a hurdle shared with every beads-using sibling (franken_node's `check_claims_manifest.py`, franken_engine's 4,537-record bead journal, frankenpandas's 4,051 beads).

### H3. No release artifact / no independent validation

Frankentorch: "No GitHub Releases; no tags on the default branch" [External, High]; "no independent coverage of FrankenTorch beyond the repository and the maintainer's profile README" [External, High within recall caveats]; 16 stars / 7 forks. Shared with: franken_engine, frankenjax, franken_node, franken_lean, franken_overlap, franken_remote, franken_drone, frankenpandas (crates.io "unverifiable"), frankenlibC, franken_whisper (no independent benchmark despite releases), franken_tts ("zero independent validation of any kind"), franken_manim ("no stable release and no package-index distribution"), franken_surveillance_system, franken_alignment. The exceptions that prove the pattern: frankenscipy ("a real tagged release (v0.2.0) … and CI Gates G1–G9 green at the pinned commit"), frankensqlite (v0.4.4, 31 release assets), franken_ocr (tagged binaries for six platforms), franken_markdown (v0.4.5 with crates.io + npm), asupersync (20 GitHub releases, 318,241 crates.io downloads) — these are the ones that clear frankentorch's H3, and they are the minority.

### H4. The pin's flagship CI failed in under a minute — and the badge/table didn't notice

Frankentorch: run #35731363456 failed in ~55s, "consistent with a G1 fmt/clippy failure" [CI-observed on failure; Inference, Medium on the gate], exact gate unestablished because "job logs are admin-restricted." Shared: frankenredis (conformance run failed at the `cargo fmt` gate, "all substantive gates skipped"), frankennumpy (G1 clippy failure while "the README badge still reads 'G1 green'"), frankensympy (786 consecutive failures, "pin fails at the fmt gate, unit tests never run"), franken_agent_detection ("the `Format` step fails, so clippy/tests/packaging never executed"). The hurdle is two-fold: fmt/clippy-first gate topology means a formatting slip silently skips the substantive gates, and admin-restricted logs make the failing gate unestablishable from outside.

### H5. The single-file reviewability cliff

Frankentorch's `ft-api/src/lib.rs` at 173,166 lines [Counted, High] — "the UBS scanner skips it (files over 50,000 lines)" [Maintainer claim, Medium], with one out-of-band historical scan. The packet itself frames this against frankenredis's 58k-line main.rs ("cubed"). No sibling reports a larger single file; franken_tui's `doctor_frankentui` harness (194,840 lines) is bigger but is a verification harness, not the product surface. The hurdle is shared in kind (frankenredis's 58k-line main.rs is cited in-packet) but frankentorch holds the program record.

---

## 5. GENUINE UNIQUENESS

No-filler list — things no other packet does or has:

1. **The Deterministic Autograd Contract.** Replayable, seeded, provenance-logged gradient computation with a bounded 32,768-entry `EvidenceLedger` (keep-first-anchor / retain-recent-half eviction) — verified to exist in code [Code-verified, High]. The nearest analog, frankenjax's "tape-based reverse-mode and forward-mode AD for 157 primitives," has no determinism contract, no seeded replay, no provenance ledger (its determinism mentions: 1). Franken_drone has deterministic *evidence timelines* but no autograd. The DAC-as-contract (determinism as "a core identity constraint, not a best-effort nice-to-have") is frankentorch's alone.
2. **The four-rule measurement-integrity gate as a standing, dated, self-enforcing publication rule** (see §3-E1). Other packets have ledgers, doctrines, and receipt formats; none has the named standing gate that retracted the project's own headline win.
3. **The allocator-gap diagnosis as a named benchmark confound with a control feature** (see §3-E2): 40–73% of alloc-bound lane time attributed to the system allocator, with a default-off `fair-alloc` feature in-tree. No other packet measures or names allocator choice as a benchmark confound.
4. **A 173,166-line single source file as the entire public op surface** — the program's largest single product file (frankenredis's 58k-line main.rs is the cited runner-up). Negative uniqueness, but uniqueness.
5. **The GH_TOKEN literal in a CI workflow** (`dynamic_int8_exact.yml` sets a `GH_TOKEN` env var as a literal value with `permissions: contents: write` to POST git blobs via the API) [Code-verified, Medium on presence] — an unresolved credential-hygiene finding reported by no other packet.
6. **The intra-suite downstream dependency:** frankenwhisper's in-process pure-Rust Whisper engine runs its "encoder/decoder transformer on FrankenTorch CPU kernels" — frankentorch is the only packet in the suite that is a *computational dependency of another packet's shipped default path* (`Sole` rollout stage, verified in code in the frankenwhisper packet). asupersync is depended upon more broadly (frankensqlite runs storage I/O on it), but among the *reimplementation* targets, frankentorch alone has a sibling that consumes its kernels in production configuration.
7. **The Strict/Hardened split applied to a tensor API** — the split itself is shared (frankenlibC, frankenscipy), but frankentorch is the only packet where it threads through an operator-dispatch layer (`ExecutionMode::{Strict, Hardened}` in `ft-core`, threaded through dispatch decisions in `ft-dispatch`) [Code-verified, High] rather than a policy membrane or solver fallback. (Mild uniqueness — the shape, not the idea.)

**Explicitly NOT unique (merely "also does X"):** the AI-lab rider (suite-wide, §2-P1); the negative-evidence ledger (24/43 others, §3); bus factor 1 (43/43, §2-P3); CI red at pin (9 others, §2-P2); README drift (widespread, §2-P4); extreme velocity (P-siblings, §4-H2); RaptorQ durability sidecars (frankenfs, frankensqlite, frankensearch); strict/hardened modes (frankenlibC, frankenscipy); differential-against-oracle conformance (frankenredis, frankenpandas, frankenscipy, frankennumpy, franken_networkx, franken_ocr); public retractions (frankenfs, franken_networkx, frankenwhisper, frankensearch, frankentts, frankenlibC — §3-E4); agent co-authorship at scale (frankenjax 53%, frankenscipy, franken_threed, frankennumpy, §2-P7).

---

## 6. CROSS-POLLINATION IN (into frankentorch)

1. **Machine-checked claim governance wired to CI → origin: franken_markdown.** Concept: `claims.tsv` + `check-claim-discipline.sh` "wire each README claim to a `capabilities --json` key and a proof script — marketing hygiene as CI, a discipline no incumbent practices" (franken_markdown packet). A sibling variant: franken_node's `scripts/check_claims_manifest.py --check-honesty`, which the analyst executed against the pinned tree — "9 checks ok, 0 drifted" [Verified, High]. Why it fits frankentorch: its §4.7.5 documents five live drift instances (12-vs-13 crates, zero-dep ft-core, forbid-vs-deny, stale lib.rs census, stale scorecard) [Counted, High]; "in a project whose pitch is *auditability*, doc drift is a structural liability." Expected payoff: converts the drift pattern from a recurring packet weakness into a merge-blocking gate — the same census the packet already runs by hand becomes a CI check.
2. **CI-enforced unsafe-site ledger with bidirectional census → origin: franken_lean.** Concept: a machine-checked claim matrix plus "a CI-enforced unsafe-site ledger" where "kernel rules anchored to upstream source lines with `expect=` tokens … fail CI on drift," and "the bidirectional unsafe-ledger census passed CI at the pin" [CI-observed, High]. Why it fits frankentorch: it already has the census (116 sites, comment-stripping parser, SAFETY comments sampled) [Counted, High] and a UBS policy — but the packet reports no CI enforcement binding the count, and the docs-vs-code "forbidden" claim is stale. Expected payoff: the deny-gate posture ("deny at the gate, allow at documented hot paths") becomes CI-auditable, and the forbid-vs-deny doc tension gets a mechanical arbiter.
3. **Hash-chained, signed evidence entries (upgrade the DAC ledger) → origin: franken_engine.** Concept: "a signed evidence ledger with transparency log + Merkle Mountain Range (MMR) inclusion/consistency proofs" (franken_engine packet, TL;DR strongest evidence). Why it fits frankentorch: its own deepening question #1 concedes the `EvidenceLedger` is "an audit artifact for humans and replay tooling, not a tamper-evident attestation — entries are unsigned, unchained, and a hostile operator with process access could rewrite history undetectably" [Inference, Medium], and states "portable attestation would require hash-chained, signed, write-time-bound entries." Expected payoff: the DAC's provenance story graduates from log to attestation — the direction the packet itself says "the agent-era auditability demand points."
4. **Vendored incumbent oracle + Phase −1 truth pack → origin: frankensqlite + franken_ocr.** Concept: frankensqlite runs "a differential oracle against bundled rusqlite" (engine-verified); franken_ocr's "Phase −1 'truth pack' pinning the exact model source commit and fixture hashes." Why it fits frankentorch: §4.7 weakness 9 — "the legacy PyTorch oracle mirror is absent from this checkout, and the project's own scorecard documents that remote RCH workers lack a PyTorch install — so the 'differential against oracle' arm of CI depends on a local-venv setup the packet never observed executing" [Code-verified + Maintainer claim, High]. Expected payoff: the conformance arm becomes reproducible by third parties instead of environment-sensitive, directly addressing the packet's "oracle runs not executed here" limitation.
5. **Both-arms A/A-null pass requirement → origin: frankenmermaid / frankenscipy / frankenwhisper.** Concept: frankenmermaid's "mandatory A/A nulls and ELF-SHA-256 provenance" in its negative-evidence ledger; frankenscipy's fleet finding that "a passing null" is required on *both* arms ("harness disagreement is as large as worker disagreement"); frankenwhisper's campaign-win doctrine ("A/A nulls in [0.98, 1.02]"). Why it fits frankentorch: the four-rule gate already demands "name the worker, name the harness, quote both estimators" — the A/A-null requirement is the natural fifth rule: it converts frankentorch's *worker-dependence* discipline (learned the hard way via the SDPA layout correction) into a *harness-dependence* discipline. Expected payoff: closes the loop the SDPA retraction opened — a layout artifact is exactly the kind of confound a paired A/A null would have caught, and the packet's own allocator-gap finding is a harness-arm confound of the same family.

---

## 7. CROSS-POLLINATION OUT (from frankentorch to named others)

1. **The four-rule measurement-integrity gate → targets: frankenfs, franken_networkx, frankenpandas, frankensearch.** Why they fit: frankenfs's own worker-scope audit "admitted 166 published benchmark rows cannot prove which machine they ran on" [Verified, High] — rule 1 ("name the worker") is the verbatim prescription for their admitted gap; franken_networkx reports "579 of 591 KEEP rows carry no vs-incumbent ratio" [Code-verified, High] — the gate's estimator rule would quarantine exactly those rows; frankenpandas has 216 uncertified lanes and a published-but-uncertified headline geomean (3.97x over certified lanes only) — the standing rule converts their ad-hoc certification into a publication contract; frankensearch's latency receipts already corroborate numbers "to the decimal" [Verified, High] but have no quotation rule binding future campaigns. Expected payoff: the exact failure frankentorch lived through (an uncertified number escaping as a headline, then a public retraction) is preempted program-wide; frankentorch's next-step #1 already proposes this.
2. **The allocator-normalized benchmark discipline → targets: frankenpandas, frankenscipy, frankennumpy, frankenlibC.** Why they fit: all four benchmark Rust compute against Python/C incumbents on lanes where allocator choice is a first-order confound; frankenpandas's own finding — "sub-1.5x ratios UNRESOLVED after measuring 2.6x same-source build variance" [Code-verified, High] — is a build-variance confound that an allocator-normalized control row would disambiguate from (build variance vs allocator choice are different confounds needing different controls); frankenscipy's CASP ("runtime algorithm selection by Bayesian expected-loss minimization") could ingest allocator as a *condition* in its condition-aware portfolio — the confound becomes a feature. Expected payoff: "any future Rust-vs-PyTorch benchmark that does not allocator-normalize is measuring allocator choice, not compute" — frankentorch's next-step #2; the same sentence holds for Rust-vs-pandas, Rust-vs-NumPy, Rust-vs-SciPy.
3. **The DAC EvidenceLedger schema as a bounded per-op provenance pattern → targets: franken_alignment, franken_engine, franken_tui.** Why they fit: franken_alignment already does "receipt-bound execution evidence (source-hash-bound JSON receipts per qualification batch)" [Code-verified/Counted, High] but has no bounded-ledger eviction design — frankentorch's keep-first-anchor/retain-recent-half 32,768-entry cap is the memory-bounded complement; franken_engine's signed ledger + MMR is stronger on integrity but is a *declassification/audit* ledger, not a per-dispatched-op provenance schema — the DAC's per-op entry shape is the finer-grained export; franken_tui's `doctor_frankentui` verification harness (194,840 lines: capture, determinism soaks, chaos drills) generates evidence runs with no reported provenance schema — the ledger gives its runs a replayable, seeded evidence format. Expected payoff: the packet's own next-step #5 — "the ledger schema is extracted as a standalone design doc the program can reference for agent-era auditability."
4. **Conformance-failure forensics (triage binaries + reliability budgets) → targets: frankenpandas, frankenscipy, frankenredis.** Why they fit: frankenpandas has 1,387 conformance packets [Counted, High] and its "live-oracle conformance job … [is] red" [CI-observed, High] — triage forensics is what a red conformance gate needs to become actionable; frankenscipy has 795 conformance files and a discrepancy catalog with IDs but no reported failure-triage pipeline; frankenredis has 5,041 differential probes against a vendored oracle [Counted/CI-observed, High] with the Tcl lane failing at verdict-verification — `triage_forensics_failures` / `build_failure_forensics_index` / `check_reliability_budgets` is the missing layer between "probes ran" and "verdict failed." Expected payoff: mass differential campaigns get failure forensics instead of raw red gates — the difference between frankentorch's "forensic triage pipeline" and everyone else's pass/fail oracle runs.
5. **The published-mechanistic-retraction norm → targets: frankensympy, frankensqlite_website, franken_manim.** Why they fit: frankensympy's PERF-001 "'materially outperforms' status sits above a paired report whose geometric mean favors the oracle 0.616" [Code-verified, High] — a headline living above contradicting numbers, the exact pre-retraction state frankentorch's SDPA lane was in; the frankensqlite_website markets "up to 8x throughput improvement" from "a benchmark family the engine's own methodology doc says 'Do not cite… for concurrent-writer speed claims'" [Maintainer claim, High] — the retraction norm would move that claim from the site to the ledger; franken_manim has "zero qualified performance evidence" while its README is "written in present tense as if the 1.0 design were fully realized" — the frankentorch discipline would strike or ledger those claims. Expected payoff: headlines that contradict their own evidence get retracted or re-scoped in-tree instead of lingering on marketing surfaces — frankentorch's next-step framing: "any downstream citation of FrankenTorch performance numbers that does not pass through this gate is misrepresenting the source."

---

## Caveats on this brief

- Cross-packet quotes carry the originating packet's evidence tiers verbatim; I did not re-verify sibling claims against their repos. Where two packets disagree (frankentorch's "most measurement-honest codebase assessed in this program to date" [Inference, Medium] vs frankenlibC's "strongest measurement discipline observed in the program so far" [Inference, High]), both are flagged rather than adjudicated.
- "All 43" skim coverage is TL;DR-deep plus targeted section extraction; the brief's negative patterns (rider, bus factor, CI-red, drift, asupersync gap, agent co-authorship) were additionally verified by full-corpus greps; uniqueness claims (four-rule gate, allocator confound, forensic pipeline, 173k-line file, GH_TOKEN literal) were verified by absence across the other 43 packets via grep.
- frankenwhisper's dependence on FrankenTorch CPU kernels ("encoder/decoder transformer on FrankenTorch CPU kernels," default `Sole` rollout stage, verified in code) is reported in the *frankenwhisper* packet, not the frankentorch packet — frankentorch's own packet does not mention this downstream consumer. It is the one frankentorch fact this cross-read surfaced that the own-packet analyst missed.
