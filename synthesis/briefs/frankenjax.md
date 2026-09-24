# frankenjax — Cross-Suite Analytical Brief

*Analyst: packet 2db6145e (frankenjax). Assessment read fully (v5 final, 2026-09-22); other 43 packets skimmed (TL;DR, claim inventory, verdict/TRL/NODUS, benchmarks, limitations, license/governance). All tier labels below are the packets' own Rulebook §1 tiers: [Verified] flavors [Counted]/[Git-observed]/[Code-verified]/[CI-observed]; [Maintainer claim]; [External]; [Inference]. Cross-suite comparisons carry the same caveat every packet states: "most/strongest/tightest" judgments are comparative over the packets completed so far, not measured rankings.*

---

## 1. OWN-PACKET DISTILLATION

- **Verdict / NODUS ring:** **Explore** — "substantive-but-unproven is the textbook Explore case" [Inference, Medium]. Specifically **Explore-with-a-ceiling**: "the ring's advancement blocker is the license rider alone: while it stands, the program cannot benchmark, analyze, or evaluate the software, so no amount of technical progress advances the ring" [Inference, Medium].
- **TRL:** **4** (a point, not a range) — "validated in a laboratory setting (the lab being the maintainer's own RCH fleet)… TRL 5 would require the independent observer" [Inference, Medium]. The packet is explicit that the author's-environment boundary is the bright line.
- **Strongest strength:** the evidence discipline, not the software — "unusually evidence-serious solo reimplementation: 861 counted JAX-oracle fixtures, a real differential conformance harness, the tightest unsafe census seen to date, a novel auditable proof artifact for transform composition (the TTL), and a published ledger of its own optimization failures" (one-paragraph case, §4.12) [mixed tiers, all sourced in §4.3/4.7].
- **Strongest ceiling:** the license rider — "it names OpenAI and Anthropic, their affiliates, and anyone acting for them — and defines 'Use' to include benchmarking, testing, analyzing, indexing, datasets, training corpora, evaluation harnesses, and ML pipelines, with automatic termination, a destruction requirement, equitable relief, and fee-shifting" [License-verbatim, High]. Compounded by zero observable CI ("every 'green' claim executes on the maintainer's local RCH fleet and is attested only by checked-in artifact JSON" [External + Inference, High]).

**Three most important pieces of evidence** (with the packet's tiers):

1. **861 differential fixture cases, counted exactly per family** (613 transforms + 25 RNG + 46 linalg/FFT + 15 composition + 162 dtype-promotion) [Counted, High]. Tier note the packet insists on: "The *discipline* is verified; the *results* (all-green) are maintainer-asserted on the local RCH fleet" [Counted/Verified, High on discipline; Medium on greenness].
2. **The VJP/JVP dispatch tables read in source — exhaustive by construction, no wildcard fallback.** "`vjp()` (lib.rs:3481) has 136 match arms over the `Primitive` enum directly with no `_` arm, and `jvp_rule()` (lib.rs:10265) has 123 arms plus 6 multi-output rules… all 162 variants are mentioned in each function body, so coverage is exhaustive by construction (Rust requires it)" [Code-verified, High]. Real gap preserved honestly: "50 VJP primitives sit behind zero-gradient rules… a visible subset are differentiable primitives where zero reads as placeholder rather than derivation — `Ldexp`, `CopySign`, `Select`, `SelectN`, `OneHot`, `Cummax`, `Cummin`, `Nextafter`, `Real`, `Imag`, `Betainc`, `Polygamma`, `Qr`, `Svd`, `Eigh`" [Code-verified, High].
3. **The Trace Transform Ledger (TTL) as mechanism, with a checked-in 12-case semantic proof matrix (6 accepted / 6 correctly rejected).** "`TraceTransformLedger` contains root Jaxpr, transform stack, and transform evidence with `composition_signature()`" [Code-verified, High — structure read; 12/12 is a checked-in artifact, not a CI-observed run]. The packet's Genesis-idea claim: "no competitor produces auditable proof objects for transform composition" [Code-verified + Inference, Medium].

---

## 2. SHARED NEGATIVE PATTERNS

### Pattern A — Zero public CI; all execution evidence maintainer-hosted (self-attestation)

FrankenJAX: "zero GitHub Actions workflows exist, so every 'green' claim executes on the maintainer's local RCH fleet and is attested only by checked-in artifact JSON" [External + Inference, High]; "the Rulebook's **[CI-observed]** tier… attests the suite *runs*" — unusable here.

Shared with, with packet quotes:
- **franken_term**: ".github/ contains only `dependabot.yml`; there are no GitHub Actions workflows to observe. All execution evidence is maintainer-hosted (RCH proof workers)" — the packet notes "the Rulebook's **[CI-observed]** tier is unused in this packet."
- **franken_code_browser**: "Zero GitHub Actions workflows: `.github/` holds only issue templates; no CI executes anywhere" [Verified, High]; "every 'green suite' number (61+ tests here, 33 there) is a maintainer assertion about remote runs."
- **franken_overlap**: "No GitHub Actions; validation is owner-local via `scripts/ci-local.sh`" [demonstrated]; "GitHub Actions is deliberately disabled… no CI anyone can observe."
- **franken_whisper**: "there is no `.github/` directory and no other CI config in the clone"; "No CI pages to observe (no CI config in tree)."
- **franken_native_capsule**: "No CI workflows" [Verified, High]; "one squashed commit, no CI, no releases."
- All four website packets (franken_markdown_website, frankensim_website, frankensqlite_website, frankentui_website): no CI — e.g. frankentui_website: "There is no CI at all (no `.github/workflows` directory), the Playwright suites are run locally or not at all."
- **Partial sharers** (CI exists but is red/untrusted): **frankenredis** — "conformance run #7679 failed at the G1 `cargo fmt` gate (all substantive gates skipped) and the Tcl lane's scheduled run #284 failed at the verdict-verification step" [CI-observed, High]; **frankenfs** — "main CI workflow **completed/failure** at HEAD" [CI-observed, High]; **franken_numpy** — "CI red at the pin." These three differ from frankenjax in *having* observable CI; frankenjax's packet explicitly contrasts this: frankenredis's CI greenness is "ESTABLISHED… as red, not unknown," while frankenjax's is unobservable by construction.

### Pattern B — The AI-lab rider license (non-OSI, bars OpenAI/Anthropic from even *analyzing*)

Universal across the suite (rider mentioned in all 44 packets). FrankenJAX's rider is the broadest: "broader than frankenredis's rider, which did not name affiliates or acting-for parties… discriminates against persons/groups (OSD §5), restricts fields of endeavor (OSD §6)" [License-verbatim + Inference, High]; 52 of 100 recent commits co-authored by Anthropic models + 1 by Grok [External, High] — the irony is the packet's own headline finding.

Shared with (sampling):
- **frankenredis**: "the license rider bars OpenAI/Anthropic and anyone acting for them from using, benchmarking, or even analyzing the code" [Inference, Medium]; 36% of 449 recent commits carry agent Co-Authored-By trailers, 158 Claude-family [Git-observed, High].
- **franken_whisper**: "the MIT+OpenAI/Anthropic-rider license withholds even benchmarking and analysis rights."
- **frankenterm**: "a custom MIT+OpenAI/Anthropic-rider license that denies all rights to the two leading AI labs — the precise demographic an agent-orchestration tool needs."
- **asupersync**: "a non-OSI rider that bars the AI labs from even benchmarking it."
- Only **franken_native_capsule** breaks the pattern in the other direction: "no license text" at all (metadata string only) — the absence is its own governance finding.

### Pattern C — Bus factor 1 with a no-outside-contributions policy

FrankenJAX: "One human maintainer with an explicit no-outside-contributions policy" [Maintainer claim, High]; "the 2,035 closed beads were all closed by the same human; the 'independent second pair of eyes' never exists even in principle."

Shared with, with packet quotes:
- **franken_whisper**: "bus factor 1."
- **franken_ocr**: "all from a single maintainer who explicitly accepts no outside contributions."
- **franken_code_browser**: "Single human maintainer (Jeffrey Emanuel)."
- **frankenfs**: "bus factor 1 with an explicit no-contributions policy" (listed in its governance compound).
- **asupersync**: "bus factor 1 with outside contributions explicitly refused (README L2620)" [Maintainer claim, High].
- **franken_torch**: "Single human maintainer (Jeffrey Emanuel) plus agent personas."
- The exceptions that prove the rule: **asupersync** (Pilot, 318k crates.io downloads, 78 reverse deps — distribution despite bus factor 1) and **franken_tts** / **franken_ocr** (shipped releases + Homebrew taps). FrankenJAX shares the pattern but has no release artifact to partially offset it.

### Pattern D — README/docs drift (documentation contradicts the tree)

FrankenJAX: "The README contradicts itself and the code on the most basic facts (118 vs 162 primitives, 15 vs 17 crates, 162,733 vs 459,703 lines)" [Counted, High]; "`rust-toolchain.toml` is 0 bytes at the pin while the README tells readers to consult it" [Git-observed, High]; CHANGELOG "HEAD" pointer predates the pin.

Shared with:
- **frankenredis**: "the Sept 2 audit found the README counting 13 crates (16 at pin), claiming 'every component is `#![forbid(unsafe_code)]`' (false — 2 deny, 2 ungated)" — the same *class* of drift (crate counts, safety posture).
- **franken_ocr**: "badges + 'Current Release' say v0.8.0 (v0.9.0 is the release)… `#![forbid(unsafe_code)]` claimed, `#![deny]` shipped."
- **franken_whisper**: "CHANGELOG scope window ends 2026-08-24 while HEAD is 2026-09-22."
- **frankentorch**: "AGENTS.md says 'Forbidden (`#![forbid(unsafe_code)]`)' and the CHANGELOG says 'enforces `unsafe_code = "forbid"` globally' while the workspace lint table says `deny`. Both doc claims are stale."
- **Counter-example (honest note):** **franken_code_browser** is "the only assessed repo that cannot be caught in README drift *by construction*, because it claims no[nothing]" — total self-disavowal as the exception that bounds the pattern.

### Pattern E — High agent co-authorship (the "murkied clean-room" / review-depth problem)

FrankenJAX: "53 of the 100 most recent commits carry agent Co-Authored-By trailers: 52 Claude-family… and 1 Grok" [External, High]; "line-level agent share is unknown."

Shared with:
- **frankenredis**: "36% of the 449 most recent commits carry agent Co-Authored-By trailers… which murkies the 'clean-room' label" [Git-observed, High].
- **frankentorch**: "45% of the last 500 commits carry agent Co-Authored-By trailers (207 Claude Opus 5, 18 Claude, 1 Grok)" [Git-observed, High] — "45% agent co-authorship murkies the 'clean-room' label."
- **franken_code_browser**: "206 commits across 2026-09-17→22, peaking at 101 commits on 2026-09-17" [Git-observed, High] — extreme velocity without a review surface.
- **franken_engine**: "~20 commits/day Sep 1–20, 96 on Sep 15 alone" [Git-observed, High].

### Pattern F — RaptorQ-branded durability/evidence sidecars (constellation infrastructure idiom)

FrankenJAX: the durability pipeline is "RaptorQ-*branded*": "`fuzz_targets/raptorq_decoder.rs`" and "`fj-conformance/src/durability.rs` imports `asupersync::encode::` and `decode::`, and encodes the full 861-fixture bundle at ~3.5x the raw size" [Code-verified, High]; "whether the codec internals are RaptorQ specifically… was not verified below the API boundary" [Inference, Low].

Shared with:
- **frankenscipy**: "The RaptorQ sidecar + decode-proof triples + G8 integrity scrub are already CI-enforced" — the most mature instance; the packet proposes generalizing it into "a signed, hash-chained artifact format."
- **frankenredis**: a "434-line RaptorQ implementation with a real dependency" (found while the README called fr-fec "planned (not implemented)").
- RaptorQ mentions also in **franken_numpy** (13), **frankengit** (6), **franken_networkx** (5), **frankenfs** (4), **frankensqlite** (16), **frankensearch** (9), **frankentorch** (9), **franken_graphdb** (1), **asupersync** (3) — it is a constellation-wide idiom, and frankenjax's instance rides on asupersync's encode/decode pipeline, which is itself the next step-5 audit target.

---

## 3. CI/EVIDENCE BAR: what frankenjax demonstrates that other packets lack

Honest framing first: frankenjax's *weakness* is CI — it has none, and §2 Pattern A shows the cohort that shares it. What follows are evidence *practices* (mechanisms) the frankenjax packet documents that no other packet describes. Where another packet does it too, that is stated.

1. **The Trace Transform Ledger — auditable proof artifacts for transform composition.** "An auditable proof artifact for transform composition — no competitor produces this"; "`{root_jaxpr, transform_stack, transform_evidence}` plus `composition_signature()`"; "the semantic matrix (6 accepted / 6 correctly rejected) shows the ledger can *reject*, which is what makes a proof artifact trustworthy rather than decorative" [Code-verified, High]. No other packet in the 44 describes a proof-artifact class for *composition* semantics. Nearest neighbors are frankentorch's Deterministic Autograd Contract ("replayable gradient graphs with provenance-complete evidence… that PyTorch itself does not offer" [Code-verified, High]) — but that is *replayability + provenance logging*, not a composition-proof artifact with a reject-capable verifier. **Genuinely unmatched in-suite.**

2. **Five-ordering transform-composition property tests.** Dedicated property tests for `jit(grad(f))`, `grad(jit(f))`, `vmap(grad(f))`, `grad(vmap(f))`, `vmap(jit(f))` etc. — "the five ordering property tests are the artifact that makes 'correct order' a checkable claim rather than an assertion" [Code-verified, High]. No other packet describes order-sensitivity testing of composed transforms. frankentorch (the other AD packet) has no transform-composition semantics layer at all (eager mode); its conformance is 33 fixture files + 11 forensic binaries against a PyTorch oracle [Counted, High].

3. **The verified-no-op transparency test.** `metamorphic_jit_transparent` "asserts `jit(f)(x) == f(x)` to 1e-14 across random inputs — i.e., the test suite proves the flagship transform does nothing" [Code-verified, High]. No other packet describes a test that *proves a limitation* rather than a capability. Related-but-different: frankenterm's `skipped_not_proven` refusal-to-claim gates and frankensim's "183/183 contracts with written no-claim boundaries" are *declarations* of non-claims; frankenjax's is a *property test executing the boundary*.

4. **Per-optimization agent attribution inside the negative-evidence ledger.** "per-optimization entries with agent attribution, same-worker/same-binary criterion rows with CIs, and explicit rejections" [Code-verified, High]. The negative-evidence *ledger* concept is shared (see §2) — but no other packet's ledger is described as attributing entries to the agent that produced them. Counterpoint to keep honest: other ledgers set a higher *metrology* bar — frankenmermaid's ledger has "mandatory A/A nulls and ELF-SHA-256 provenance" and frankenpandas' certification gate uses "per-arm A/A nulls, bootstrap median-CI, ELF SHA pinning" — so frankenjax's contribution is the *attribution convention*, not the strictest measurement.

5. **The exhaustive-dispatch arm-parser audit (correcting a wildcard-fallback claim).** This round's packet documents a re-examination that "corrected v2: there are no wildcard fallbacks — both AD dispatchers are exhaustive by construction" and names the real gap (50 zero-gradient arms) with the differentiable subset enumerated [Code-verified, High]. Rust's match exhaustiveness is commodity; the *documented adversarial audit of one's own dispatch coverage, published with the correction*, is not described in any other packet. Partial sharer: franken_graphdb's "machine-readable registries (`invariants.toml`, `laws.toml`, `claims_lint.toml`, `unsafe_boundary_ledger.toml`) enforced by a std-only `tools/registry-check`" [Code-verified, High] is the same *spirit* (machine-checked coverage claims), different mechanism.

6. **blake3-over-canonical-JSON cache keys as the reproducibility mechanism.** "`CacheKey::from_jaxpr` over blake3, JSON canonical form" [Code-verified, High]; "the September pin is itself a JSON-canonicalization commit." Others have content-addressing (frankenterm's content-addressed attestation bundles; franken_engine's sealed IR4 witnesses) — so this is "also does X, with a crisply documented mechanism," not unique.

**Explicitly NOT unique (the packet's superlatives need in-suite calibration):**
- The unsafe posture: frankenjax claims "the tightest assessed in the program to date" — but **frankenmermaid**'s packet claims "the zero-`unsafe` claim is the strongest in this program — all 9 crate roots carry `#![forbid(unsafe_code)]` and a code-level census finds zero actual `unsafe` tokens… No other packet in this program verified a cleaner unsafe census" [Verified, High], and **franken_lean** has "a `forbid(unsafe)` kernel with zero project-authored unsafe blocks" plus "a CI-enforced unsafe-site ledger." FrankenJAX *has* one real production unsafe block (the FFI call in `fj-ffi/src/call.rs`) — with a written SAFETY argument, which is admirable, but the "tightest" superlative does not survive contact with frankenmermaid's zero-token census. The frankenjax packet's own calibration note ("covers the packets completed so far") anticipated this.
- The differential-oracle fixture discipline: **frankenredis** has 5,041 differential probes vs a vendored Redis 7.2.4 oracle [Counted, High]; **franken_networkx** has "the 4,129/4,129 machine-checked surface result" [Counted, High]; **franken_numpy** runs "differential conformance against a live NumPy oracle"; **frankenscipy** has 795 conformance integration-test files + 16 live-oracle scripts; **frankensympy** has a "pinned SymPy 1.14.0 oracle." FrankenJAX's 861 is the AD-specific instance; the *discipline* is constellation-standard, and franken_numpy's *live* oracle is the stricter variant (see §6).
- The negative-evidence ledger itself: §2 Pattern F shows the cohort (frankenredis 26,485 lines, franken_networkx 37,116, frankenscipy 44,078, frankentorch 42,708, frankenpandas 44,086, franken_numpy 67,641, frankenmermaid 726 rows, frankenfs 20,556, frankenterm). FrankenJAX's is 6,109 lines — mid-pack by size, distinguished by the agent-attribution convention (§3.4).

---

## 4. SHARED HURDLES (structural, with evidence)

1. **Bus factor 1 + no-contributions policy = zero independent validation by design.** FrankenJAX: "bus factor one, by policy — the repo explicitly does not accept outside contributions… the 'independent second pair of eyes' never exists even in principle" [Maintainer claim + External, High]. Shared with franken_ocr ("explicitly accepts no outside contributions"), frankenfs, asupersync ("outside contributions explicitly refused (README L2620)" [Maintainer claim, High]), frankentui_website ("contributions are explicitly not merged"). The program-level consequence is stated in frankenjax §4.8: "the project's impressive self-review machinery (gates, ledgers, forensic logs) is review *by* the author *of* the author's work."

2. **The rider as a universal advancement blocker.** FrankenJAX's packet wires the rider as "the advancement blocker" in the NODUS ring rules [Inference, Medium]. The same wiring appears in frankenredis ("Explore — substantive, unproven, and currently un-advanceable past Explore while the rider stands"), frankenpandas ("the rider a *durable* one… the software is un-advanceable while the rider stands"), franken_ocr ("a license rider that is an advancement blocker"). FrankenJAX's rider is distinguished only by breadth ("broader than frankenredis's rider, which did not name affiliates or acting-for parties").

3. **Velocity without review depth.** FrankenJAX: 4,200 non-merge commits March–August 2026 [Maintainer claim, Medium], then a September consolidation phase of evidence-regeneration commits; 53% agent co-authorship. Shared with franken_code_browser (206 commits in 6 days, peak 101/day), franken_engine (~20 commits/day, 96 on Sep 15), franken_node (~20 commits/day), frankentorch (6,305 commits since 2026-02-13, 45% agent trailers). No packet in the suite shows a second human reviewer on any commit.

4. **The RCH-dependency evidence model.** FrankenJAX's execution evidence lives on "the maintainer's local RCH fleet." Shared: frankenterm — "verification runs on maintainer-controlled RCH hosts that are not independently inspectable"; franken_remote — "remote-executed RCH gates at an earlier revision ran 236 tests with zero failures." The hurdle is structural: the constellation's test evidence is bound to maintainer-controlled remote workers rather than public CI, so "green" is always one trust hop away from verifiable. FrankenJAX is the purest case because it lacks even the public (if red) workflows that frankenredis/frankenfs/frankenscipy/frankengit expose.

5. **Constellation supply-chain concentration on asupersync.** FrankenJAX: "the first repo found *depending* on asupersync (0.5.0, non-optional in `fj-conformance`… optional feature-gated async bridge in `fj-runtime`)" [Code-verified, High]; next step 5 calls for a cross-suite audit. Shared dependents: **franken_snowflake** (transport built on asupersync `=0.3.5`, exact-pinned, with "a cargo-tree admissibility gate that fails the build if a forbidden crate appears"), **frankensqlite** ("runs storage I/O on 0.5.0" [asupersync packet]), **frankensearch**, **franken_node** (feature-gated asupersync transport that "no CI job has ever compiled"), **franken_manim** (peripheral), **franken_markdown** (optional). The hurdle: a Pilot-ring, TRL-6, single-maintainer runtime with a non-OSI rider is load-bearing for siblings — and **frankenredis** "evaluated and rejected it as an architectural rewrite (2026-04-21/22)," so the constellation holds contradictory verdicts on the same dependency (the frankenjax packet's next step 5 and the asupersync packet's next step 6 both flag this).

6. **Documentation drift as a governance signal.** §2 Pattern D. The structural point, stated by the frankenjax packet: "the README cannot be trusted as a summary of the repo, and every number in this packet had to be re-counted from source" [Counted, High]. When the pitch document (frankenjax README, frankenredis README, frankentorch AGENTS.md, franken_ocr badges) drifts on crate counts, safety posture, or release state, the *auditability pitch* — the constellation's shared value proposition — is what erodes.

---

## 5. GENUINE UNIQUENESS (standalone vs the other 43; no filler)

1. **The TTL as an artifact class.** Auditable proof objects for *transform composition* (`{root_jaxpr, transform_stack, transform_evidence}` + `composition_signature()`, with a reject-capable 12-case semantic matrix). Nothing in the other 43 packets describes a proof artifact for composed-transform semantics. (frankentorch's Deterministic Autograd Contract is replayability+provenance, not composition proofs; frankensympy's `verify_derivation` proof kernel verifies *derivations*, not transform stacks.) **Genuinely standalone.**

2. **A clean-room reimplementation of JAX's *transform semantics* (not an ML framework).** No other packet occupies the "standalone, verifiable transform-semantics" lane. frankentorch reimplements PyTorch *eager-mode semantics*; franken_sympy, franken_numpy, franken_scipy reimplement *library surfaces*; nobody else reimplements *composition-of-transforms* as the subject. The packet is honest that the lane "is unoccupied because nobody has shown up, not because competitors were beaten" [Inference, Medium].

3. **The five-ordering transform-composition property-test suite** (order-sensitive `jit`/`grad`/`vmap` composition checked as named properties). No other packet describes order-sensitivity testing of composed operators.

4. **A property test proving the flagship transform is a no-op** (`metamorphic_jit_transparent`, identity to 1e-14). As a *mechanism* (executable proof of a limitation), unmatched in-suite.

5. **Per-optimization agent attribution in the negative-evidence ledger.** The ledger concept is shared (§2); the attribution convention is not described anywhere else.

**Merely "also does X" (do not cite as unique):** differential-oracle fixtures (frankenredis, franken_networkx, franken_numpy, frankenscipy, frankensympy, frankentorch, frankenmermaid); negative-evidence ledger (9+ packets); forbid(unsafe)+unsafe census (dozens; frankenmermaid strictly tighter); RaptorQ evidence sidecars (frankenscipy, frankenredis, franken_numpy, frankengit, frankenfs, franken_networkx, frankensqlite…); asupersync adoption (franken_snowflake, frankensqlite, frankensearch, franken_node, franken_manim, franken_markdown); agent co-authorship (frankenredis 36%, frankentorch 45%, frankenjax 53%); extreme commit velocity (franken_code_browser, franken_engine, franken_node); bus factor 1 + rider license (near-universal).

---

## 6. CROSS-POLLINATION IN (other packets → frankenjax)

1. **frankenpandas' certified-lane benchmark gate → frankenjax's benchmark story.** Concept: a documented certification gate requiring *live incumbent, same-invocation* runs with *per-arm A/A nulls, bootstrap median-CI, ELF SHA pinning* [Code-verified, High]. Why it fits: frankenjax's packet admits its §4.5 numbers have "no A/A null calibration published and no independent rerun" and its headline 22x row "measures FrankenJAX's lower dispatch floor, not faster computation" [Inference, High]. Expected payoff: the honest-but-uninteresting benchmark audit becomes a *certified* honest audit — the existing negative-evidence ledger gains the null-calibration the packet's own methodology audit names as missing, and any quotable row earns its quotation.

2. **frankenmermaid's mandatory A/A nulls + ELF-SHA-256 provenance in the perf ledger → frankenjax's negative-evidence ledger.** Concept: every ledger row carries an A/A null measurement and an ELF-SHA-256 provenance pin ("726-row negative-evidence perf ledger with mandatory A/A nulls and ELF-SHA-256 provenance"); plus its **claim-coverage audit** that self-reports "225 KEEP claims, 8 with a live incumbent ratio — 96.4% without." Why it fits: frankenjax's ledger has per-optimization agent attribution and criterion CIs but lacks null calibration and any coverage accounting of its own claims. Expected payoff: rows become individually falsifiable-by-construction, and a claim-coverage audit would force the packet's open question 4 ("how many AD rules are really hand-derived?") into a measured answer.

3. **frankenterm's attestation machinery → frankenjax's self-attested JSON evidence.** Concept: "content-addressed, sigstore-signed release attestation bundles; `docs/attestations/claim-registry.json`; per-category producing-bead pointers… a claim → signed-slot attestation graph" plus `skipped_not_proven` refusal-to-claim gates — "the most honest release-trust system found in the 44-repo program." Why it fits: frankenjax's evidence (TTL matrices, gate JSON, ledger refreshes) is "attested only by checked-in JSON produced on the maintainer's local RCH fleet" — unsigned, content-addressed nowhere. Expected payoff: the single highest-leverage hardening of the packet's core weakness (self-attestation): signed, content-addressed evidence bundles make "maintainer-asserted" tamper-evident even without public CI, and `skipped_not_proven` gates give the 50 placeholder zero-gradient VJP arms a machine-enforced home instead of prose.

4. **franken_lean's CI-enforced unsafe-site ledger + machine-checked claim matrix → frankenjax's census and claim inventory.** Concept: "a CI-enforced unsafe-site ledger" and "machine-checked claim matrix, anchor-bound kernel contracts" — "a methodology export… arguably more valuable than the prover itself." Why it fits: frankenjax's unsafe census and 18-claim inventory are *analyst*-verified static artifacts; the two Cholesky AD bugs "caught by numerical tests" show the hand-derived rules are fallible, and the 50 placeholder zero-gradient arms are exactly the kind of coverage claim a machine-checked matrix would police. Expected payoff: the claim inventory becomes a living, machine-checked registry (a natural upgrade of the Rulebook's ≥10-entry inventory requirement), and the unsafe census stops being a one-round analyst count.

5. **franken_overlap's `fo-evidence-suite` / `fo-claim-gate` → frankenjax's gate scripts.** Concept: "one-command proof transaction" (`fo-evidence-suite`) and "preregistered paired-bootstrap claim verdicts of `supported`/`inconclusive`/`unsupported`" (`fo-claim-gate`), producing "immutable Markdown/HTML evidence bundles." Why it fits: frankenjax's `check_conformance_gates.py` "reports local/CI exit codes in prose" but "with zero GitHub Actions workflows there is no observable CI run" — the gate exists but its verdicts are not preregistered or packaged. Expected payoff: conformance verdicts become preregistered (verdict vocabulary fixed before the run), one-command, and immutable — closing the gap between frankenjax's elaborate evidence machinery and the packet's finding that "the evidence machinery is elaborate… but it is all self-attested."

---

## 7. CROSS-POLLINATION OUT (frankenjax → named projects)

1. **The TTL (Trace Transform Ledger) → frankensympy.** Concept: auditable proof artifacts for transform composition (`{root_jaxpr, transform_stack, transform_evidence}` + `composition_signature()`, reject-capable verifier). Why it fits frankensympy: it is "pursuing a dual-lane architecture" with "an independent proof kernel with `verify_derivation`" [Code-verified, High] — a proof-*carrying* kernel that currently verifies derivations but has no artifact class for *compositions* of symbolic operations (simplify∘factor∘expand chains). Expected payoff: sympy-style rewrite pipelines gain the same compositional auditability frankenjax built for AD transforms; a TTL-shaped "derivation ledger" would make `verify_derivation` compositional rather than per-step.

2. **The TTL → frankentorch.** Why it fits: frankentorch is organized around the "Deterministic Autograd Contract: replayable, seeded, provenance-logged gradient computation" [Code-verified, High] — provenance logging exists, but no *proof object* attests that a composed autograd graph (backward∘checkpoint∘vmap-equivalent batching) is what it claims. Expected payoff: TTL-shaped composition signatures attached to gradient graphs would upgrade frankentorch's provenance logs into reject-capable proof artifacts, directly serving its "Deterministic" contract.

3. **The negative-evidence ledger with per-optimization agent attribution → franken_node, franken_engine, franken_nlp.** Concept: a `negative_evidence_ledger.md` pattern with per-optimization entries carrying *agent attribution*, same-worker/same-binary criterion rows with CIs, and explicit rejections. Why it fits: franken_node has zero negative-evidence mentions and an honesty-manifest checker (`scripts/check_claims_manifest.py --check-honesty`) with nothing to check losses against; franken_engine has zero mentions despite ~3.53M lines and extreme velocity; franken_nlp (design stage, TRL 2–3) has only 2 mentions. Expected payoff: these projects get the loss-recording discipline *before* their benchmark claims calcify — frankenjax's packet explicitly proposes this as "the program's optimization-evidence template" (next step 6), and the agent-attribution convention is the one ledger feature no other packet has.

4. **The exhaustive-dispatch audit discipline → frankentorch, frankensympy.** Concept: the arm-parser re-examination that replaced a "wildcard fallback" story with verified-exhaustive dispatch plus an *enumerated placeholder audit* (the 50 zero-gradient arms with the differentiable subset named). Why it fits: frankentorch's AD rules and frankensympy's CAS/rewrite rule coverage face the identical failure mode — a dispatcher that *looks* complete (exhaustive match) while individual arms are placeholders. Expected payoff: both projects get a forcing function (the frankenjax packet's next step 3 pattern: "for each placeholder, either derive the real rule or return a typed `Unsupported` error") that converts silent placeholder coverage into typed, auditable incompleteness.

5. **The canonical-JSON + blake3 cache-key discipline → frankenterm, franken_engine.** Concept: `CacheKey::from_jaxpr` — deterministic identity via blake3 over canonical JSON; "the September pin is itself a JSON-canonicalization commit" [Code-verified, High]. Why it fits: frankenterm's attestation bundles ("content-addressed, sigstore-signed") and franken_engine's "sealed IR4 witnesses" and "signed evidence ledger with transparency log + MMR inclusion/consistency proofs" all depend on canonical serialization, and neither packet describes the canonicalization mechanism explicitly. Expected payoff: a shared, documented canonical-form discipline makes cross-project evidence (witnesses, attestations, TTLs) mutually verifiable instead of each repo inventing its own bytes.

---

*Method note: all cross-packet claims above are grounded in the cited packets' own words and tier labels; where a packet's superlative ("tightest," "strongest," "most") was calibrated to "packets completed so far," that calibration is preserved. Absence of a described practice in a skimmed packet is not proof of absence in the repo — treated here as "not described," not "does not exist."*
