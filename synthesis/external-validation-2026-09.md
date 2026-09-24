# External Validation — September 2026: Four Big-Vendor Rust Stories

Assessment date: 2026-09-22; ecosystem-context note appended 2026-09-23. Sources verified 2026-09-22/23 via primary-source reads (GitHub Blog, NVIDIA Technical Blog, Bun blog, Rust Foundation guest post, aws-sdk-rust release notes) and secondary reporting (The Register, DevClass).

**Reading guide.** Same conventions as `00-overview.md`: every substantive claim carries an evidence tier — `[Verified]`, `[CI-observed]`, `[Maintainer claim]`, `[External]`, or `[Inference]` — plus a confidence level (High/Medium/Low). These are third-party stories, so the dominant tier is `[External]`. Where a flagged claim could not be sourced, it is marked unsourced and excluded from the analysis — not paraphrased into existence.

**Why this document exists.** Four 2026 industry events independently corroborate load-bearing program findings. A short ecosystem-context note (AWS SDK for Rust's managed breaking migration, release-2026-09-22) was appended 2026-09-23; it is maturation evidence for the "bigger trend" narrative, not corroboration of the claim-governance thesis. This addendum records exactly what was verified, maps it to the corpus findings, and states the limits honestly.

---

## Story 1 — GitHub/Microsoft: Copilot runtime ported TypeScript → Rust by agents [External, High]

Primary source: Stephen Toub (Microsoft Distinguished Engineer), "Migrating the GitHub Copilot runtime to Rust, using Copilot," GitHub Blog, published ~2026-09-16. https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/

### Verification ledger

| Flagged sub-claim | Verdict | Source detail |
|---|---|---|
| Entire Copilot runtime ported TS → Rust using AI agents | **VERIFIED** | "we completely rewrote the runtime into more than 800,000 lines of production Rust. AI agents wrote most of the code, spanning 128 pull requests that landed in main and shipped incrementally" (Toub, GitHub Blog). In-place port, option "2a" (atomic replacement per component), ~14.5-week window, May 12 – Aug 21, 2026. |
| Cost ~$120,000 in tokens + ~3 weeks of one developer's time | **VERIFIED** | "My token spend for all of the porting work was ~136.3 billion total tokens... The monetary bill for all those tokens came to ~$120,000." Followed by: "the rough bill for the porting effort was about $120,000 in attributed token spend plus three weeks of a developer's time." Note "attributed" — this is token spend plus the lead's time, not fully-loaded project cost. |
| 15.9x benchmark speedup | **VERIFIED with author's own caveat** | Workload: 100 concurrent pipelines × 10 session lifecycles. Pre-port TypeScript: 7.55 lifecycles/sec; Rust in-process: 120.0/sec. Toub's own words: "That is a workload-specific result; the Rust runtime is not universally '15.9x faster.'" The figure is real; the universalization is not. |
| Dozens of regressions shipped despite clean compiles | **VERIFIED** | "By September 14, 2026, we'd traced dozens of known port regressions, all fixed. Most were correctness bugs, with a smaller set of performance regressions." And: "every regression in the corpus was merged to `main`, which means it successfully compiled. The compiler accepted the buggy versions because, as far as the compiler was concerned, every one of them was valid Rust." |
| Toub: "if it compiles, it's correct is useful only as a joke" | **VERIFIED (exact wording)** | "That's in no way an argument against Rust's compiler... But 'if it compiles, it's correct' is useful only as a joke." |
| Crossman: "Rust stops the agent writing memory unsafe code; it does not stop the agent writing the wrong program correctly" | **VERIFIED (reported speech)** | Not in Toub's post. Reported by The Register (2026-09-18) from RustConf, Montréal: "consultant Lisa Crossman warned about the practice of treating the compiler as an 'oracle'... 'Rust stops the agent writing memory unsafe code; it does not stop the agent writing the wrong program correctly,' she said." https://www.theregister.com/devops/2026/09/18/microsoft-agentically-ports-copilot-runtime-to-rust-for-120k/5297549 — DevClass carries the identical quote. No transcript of the RustConf talk itself was located; tier accordingly. |

### Corroborating detail worth keeping

- **Regression taxonomy.** Toub groups the known correctness regressions into five recurring failure modes: incomplete migration, state and lifetime, behavioral contract mismatches, host boundaries, and incorrect test oracles; "nearly all" land in three large families (different behavioral contract; state/ownership/lifetime change; omitted or partial migration). [External, High]
- **The E2E lesson.** "End-to-end tests are absolutely, unequivocally critical. With one exception, all of the regressions that involved missing features, and many of the others, were due to lack of sufficient end-to-end tests." [External, High]
- **Second independent data point, now primary-sourced.** The Register's earlier figure (~535,000 lines of Zig to Rust, "$165,000 in tokens," 99.8% tests passing) is superseded by Story 1b below, verified against Bun's own post. Note the reconciliation: 535,496 lines of Zig input (excluding comments) vs a +1,009,272-line landed diff (rewrites included) — "a million lines" is the diff, not the input. [External, High]

---

## Story 1b — Bun: Zig → Rust by agents, 11 days [External, High]

Primary source: Jarred Sumner, "Rewriting Bun in Rust," Bun blog, published 2026-07-08. https://bun.com/blog/bun-in-rust

### Verification ledger

| Flagged sub-claim | Verdict | Source detail |
|---|---|---|
| Triggering bugs were use-after-free crashes in `node:zlib` and heap corruption from JS callbacks during iteration | **VERIFIED** | The post opens with a bug-fix sample from Bun v1.3.14: "heap-use-after-free crash in `node:zlib` when calling `.reset()` on a zlib, Brotli, or Zstd stream while an async `.write()` is still in progress on the threadpool"; "use-after-free crash in `node:zlib` when an `onerror` callback issued a re-entrant `write()` followed by `close()` on native handles"; "heap out-of-bounds write in `UDPSocket.sendMany()` when the socket's connection state changed mid-iteration via user JS callbacks." |
| In safe Rust, these are compiler errors (per the project's own post) | **VERIFIED (exact wording)** | "A large percentage of bugs from that list are use-after-free, double-free, and 'forgot to free' in an error path. In safe Rust, these are compiler errors and RAII-like automatic cleanup with `Drop`." |
| Ported a million lines in 11 days for ~$165,000 in API credits | **PARTIAL as stated — see reconciliation** | 11 days VERIFIED: "11 days (May 3 → merged May 14) · 6,778 commits." $165,000 VERIFIED with wording note: "around $165,000 at API pricing" for 5.9B uncached input + 690M output + 72B cached input tokens, pre-merge ("API credits" is not the post's wording). "A million lines" is the merged diff, not the input: the post states "Excluding comments, Bun is 535,496 lines of Zig" as the input and "The diff that landed was +1,009,272," adding that "the line counter counts every rewrite along the way." Accurate statement: 535,496 lines of Zig ported in 11 days, producing a +1,009,272-line merged diff. Do not cite "a million lines of Zig ported." |
| Fixed all 128 bugs | **VERIFIED** | "So far, Bun v1.4.0 fixes 128 bugs that reproduce in v1.3.14." The post's own range: "These range from memory leaks to crashes to miscolored help text" — not all are memory-safety bugs. Separately, the rewrite itself introduced 19 known regressions, "each of which has been fixed." |
| Of the last 150 merged PRs, 108 involved memory-safety-adjacent bugs that would not compile in Rust | **UNSOURCED** | Appears only in a third-party commentary piece (byteiota.com) as "Bun developers found," with no citation. Absent from Bun's own post (read in full) and no Bun-authored source located. Excluded from analysis. |

### Corroborating detail worth keeping

- **The compiler as a work queue.** After the mechanical port, ~16,000 compiler errors became the task list: "cargo check wrote ≈16,000 errors to a file, grouped by crate; the workflow divvied them up among 64 Claudes." The borrow checker functioned as a machine-readable bug backlog — a concrete instance of "compiler as evidence, not verdict." [External, High]
- **Adversarial review caught a compile-clean use-after-free.** A second Claude in a separate context window ("told to assume the code is wrong") caught a use-after-free + double-free in async `uv_close` handling that compiled clean — the Crossman thesis demonstrated in a single diff. [External, High]
- **unsafe is counted, not hidden.** "At the time of writing, about 4% of Bun's Rust code sits inside an `unsafe` block (~13,000 `unsafe` keywords across ~27,000 lines / ~780,000 lines)" — disclosed in the post itself, with 78% single-line FFI boundaries. The honesty-about-unsafety norm the program's apparatus demands, practiced by the vendor. [External, High]

---

## Story 1c — Microsoft: rustc_codegen_utc, Rust Tier 1 on Windows [External, High]

Primary source: Victor Ciura (Microsoft), "Guest Post: Rust Is Tier-1 Language at Microsoft," Rust Foundation blog, published 2026-09-10 (announced onstage at RustConf 2026, Montréal; press coverage 2026-09-11). https://rustfoundation.org/media/guest-post-rust-is-tier-1-language-at-microsoft/ — read in full, 87 lines. (A secondary aggregator dated 2026-09-18 exists; the primary timeline is Sep 10 post / Sep 11 coverage.)

### Verification ledger

| Flagged sub-claim | Verdict | Source detail |
|---|---|---|
| New `rustc_codegen_utc` code generator wires rustc into the same MSVC backend that powers C++ on Windows | **VERIFIED** | "an alternative code generation backend for rustc, in the same architectural family as `rustc_codegen_llvm`, `rustc_codegen_gcc` and `rustc_codegen_cranelift`. It plugs into the same backend interface and connects rustc's shared compiler machinery to the MSVC backend (aka 'UTC')." The result: "a *unified* code generation platform for Rust and C++ on Windows." The motivation: "Connecting rustc to that backend lets Rust build on the same platform investment, with *perfect compatibility* out of the box, rather than requiring a parallel implementation of every Windows-specific capability." |
| Self-hosted since Rust 1.90 (backend compiling rustc itself from 1.90 onward) | **VERIFIED** | "It has been *self-hosted* since Rust 1.90 and is part of a broader internal Rust platform that includes secure supply-chain builds of rustc, standard library, associated tools, integration with local development, production pipelines and common quality & compliance workflows in our engineering systems." |
| Production-ready since early 2026 | **VERIFIED** | "has been **production-ready** since early 2026." Built by "a dedicated team in Microsoft DevDiv." |
| More than 100 internal Microsoft repositories build with it | **VERIFIED (as the post's own number)** | "More than 100 Microsoft project repositories build with it today. This rollout continues each week as more repositories adopt it." Note: The Register's Sep 11 coverage separately states Rust "is already present in over 100 Microsoft project repositories" — that is Rust usage generally, not the backend. The claim about `rustc_codegen_utc` specifically comes from the post itself. |
| Victor Ciura detailed the Tier 1 designation in the guest post | **VERIFIED** | The byline is Ciura's own post on rustfoundation.org. The Register (2026-09-11) identifies him as "Microsoft principal engineer for the Rust tooling team"; the Rust Foundation's announcement calls him "Technical Lead for Rust Program @ Microsoft." He stated onstage: "Rust now is a Tier One language at Microsoft, and that just means that it sits among C++, C# and TypeScript as the best supported languages for internal development in the company." |
| Rust stands alongside C++, C#, TypeScript with the same toolchain investment, tooling, QA, and SDL requirements — a standing commitment | **VERIFIED (post's description of current status)** | "Today, Rust sits among C++, C#, and TypeScript as one of the best-supported languages for internal development at Microsoft. This 'Tier-1 language' engineering status for Rust means giving internal teams a paved path from local development to production: secure toolchain builds, productive developer tooling, quality workflows, deep platform integration, and compliance with the SDL requirements Microsoft software must meet." And: "This is part of a sustained investment in the full engineering lifecycle for Rust at Microsoft: acquisition, tooling, quality, security, platform integration, production deployment, and long-term support." "Sustained investment" is the post's wording — a described commitment, not an independently audited one. |

### Corroborating detail worth keeping

- **What "Tier 1" is (and is not).** It is a Microsoft-internal language-support status — "one of the best-supported languages for internal development at Microsoft" — not a rustc target tier (x86_64-pc-windows-msvc etc.) and not a tier of the MSVC backend. Conflating it with compiler target tiers misstates the designation; it is about toolchain investment, tooling, QA, and SDL compliance for internal teams. [External, High]
- **The interop caution survives the announcement.** The Register (2026-09-11) notes: "While the Rust compiler can flag memory errors, it typically doesn't cover pointers into the C++ memory allocations" — the unsafe boundary at the Rust/C++ frontier, echoing the Crossman thesis inside a Tier-1 context. [External, High]
- **Hybrid systems are the explicit target.** The post expects "many systems will use both languages for years to come" and positions the shared backend as "the *foundation* for both sides of those systems to participate equally in all development workflows." [External, High]
- **Scope note.** This is Windows-native platform infrastructure (drivers, kernel, hypervisors, firmware, microservices, apps), not a language preference — the investment vehicle is the toolchain, and its purpose is that "those investments land on a common foundation for both C++ and Rust." [External, High]

---

## Story 2 — NVIDIA: CUDA Rust, two native kernel tracks [External, High]

Primary source: "Introducing CUDA Rust: Two Tracks for Writing GPU Kernels," NVIDIA Technical Blog, 2026-09-08. https://developer.nvidia.com/blog/introducing-cuda-rust-two-tracks-for-writing-gpu-kernels/

### Verification ledger

| Flagged sub-claim | Verdict | Source detail |
|---|---|---|
| Dual track: cuda-oxide (SIMT) and cutile-rs (tile-based) | **VERIFIED** | cuda-oxide: custom `rustc` codegen backend; routes `#[kernel]` functions through Rust MIR → Pliron IR → LLVM IR → PTX. cutile-rs: `#[cutile::module]` macro embeds kernel AST in host binary, JIT-compiles via CUDA Tile IR at first launch. |
| Compiled to PTX | **VERIFIED** | "GPU kernels can be written in Rust, compiled natively to PTX, rather than a wrapper around code from somewhere else." |
| Aliasing errors fail at compile time | **VERIFIED** | Two worked examples (E0502 on the SIMT side, E0382 on the Tile side): "Both examples catch the classic aliasing mistake at compile time." |
| Out-of-bounds errors fail at compile time | **PARTIAL** | The SIMT track's `get_mut` returns `Option`: "the out-of-bounds case is a branch you handle rather than a memory error you find later" — a runtime-checked branch, not a compile-time rejection. Launch contracts are validated ("checked rather than trusted"), which is stronger than the flagged claim's wording but not the same claim. Do not cite OOB-as-compile-error. |
| Plug into existing CUDA runtime; interop with CUDA libraries, Python bindings, container pipelines | **PARTIAL** | The blog says: "We plan to support inter-language interop, so the choice does not lock you out of the others." That is a plan, not a shipped property. PTX output plugs into NVIDIA's driver stack by construction, but library/Python/pipeline interop specifics are not in the primary source. Secondary coverage (glonce.com) likewise notes the interop "is not built yet." |
| AMD and Intel face pressure to announce equivalent Rust support | **UNSOURCED — write-up inference** | Appears in secondary commentary as the author's argument, not as a reported fact. No AMD or Intel announcement was located. Excluded from analysis. |
| Maturity | **VERIFIED (early)** | "Both projects are early-stage and neither is production-ready. cuda-oxide is early alpha. cutile-rs is further along, published on crates.io and already used outside NVIDIA in HuggingFace's Grout inference engine and in mistral.rs." NVIDIA frames it as a multi-year commitment "into 2027 and beyond." |

---

## Ecosystem context — AWS SDK for Rust: a managed breaking migration [External, High]

Primary source: awslabs/aws-sdk-rust, "Release September 22nd, 2026" (release-2026-09-22). https://github.com/awslabs/aws-sdk-rust/releases/tag/release-2026-09-22

This is not a port story and not correctness evidence. It is included because the industry's largest Rust SDK is managing a breaking HTTP-stack migration in public with exactly the explicitness the program's gates demand: `http` 0.2.x (which has unpatched advisories) moves behind a named opt-in feature across the Smithy runtime crates and generated SDK crates; nothing is removed yet, but the migration path is spelled out feature by feature. Note: the earlier guidance (GitHub discussion #1257) gave a vaguer recipe without `http-1x`; the September 22 release supersedes it as the authoritative path. [External, High]

### Verification ledger

| Flagged sub-claim | Verdict | Source detail |
|---|---|---|
| Migration path spelled out: disable default features, opt into `sigv4a`, `http-1x`, `default-https-client`, `rt-tokio` to drop `http` 0.2.x | **VERIFIED** | "Removing `http` 0.2.x from your dependency tree": "disable default features and re-enable the ones you need, omitting `rustls`... `aws-sdk-s3 = { version = "...", default-features = false, features = ["sigv4a", "http-1x", "default-https-client", "rt-tokio"] }`" |
| Breaking change: previously unconditional `pub` items in `aws-smithy-runtime-api` now require the `http-02x` feature | **VERIFIED** | "**Breaking change:** these previously unconditional `pub` conversions now require the `http-02x` feature:" followed by the list (`Request::try_into_http02x`, `Response::try_into_http02x`, `From<http_02x::Uri>`/`TryInto`/`TryFrom`/`From` impls, `AsHeaderComponent` impls). Breaking changes are labeled per crate section throughout the notes. |
| Builds on the `hyper` 0.14.x client log a once-per-process warning ahead of the 2.x default flip, expected November 2026 | **VERIFIED** | "**Advance notice of a coming default change.** A build that resolves to the legacy `hyper` 0.14.x client now logs a warning once per process saying that the default becomes the `hyper` 1.x client in the 2.x release, currently expected November 2026 — a different TLS implementation, with different connection-pooling and timeout behavior. Nothing changes yet; this release only tells you where you stand." |
| `legacy-https-client` is the pin for teams staying put | **VERIFIED** | "To keep the legacy client through that change, add `legacy-https-client` now — that spelling is stable across it, whereas `rustls` becomes a synonym for the `hyper` 1.x client." Also: the feature "names the `hyper` 0.14.x + `rustls` 0.21.x HTTP client... Spelling it `legacy-https-client` instead pins the stack you actually want, and that spelling will keep working." |

Why it is here, in one paragraph: the program demands fail-closed, explicitly-flagged migration mechanics from the franken repos; this release is a major vendor practicing that discipline at ecosystem scale — named opt-in features instead of silent Cargo feature unification, breaking changes labeled per crate, a once-per-process warning before a default flip, and a stable spelling for teams that pin the old stack. Maturation evidence for the "bigger trend" narrative: the Rust ecosystem's largest SDK is now governed with the kind of explicit migration machinery the program's methodology prescribes. [Inference, Medium]

---

## Why it matters to the program

**1. Compile ≠ correct, at industrial scale and in public.** The program's load-bearing finding #1 is that 42/44 repos cannot show public CI green at the assessed commit, and finding #2 is that mechanism existence runs ahead of execution — the honesty apparatus exists but often doesn't run where it matters. Toub's post is the same lesson from the other direction: a team with 128 PRs of in-place porting, E2E tests gating every merge, and 135 releases still shipped dozens of correctness regressions, every one of which compiled. "If it compiles, it's correct" being "useful only as a joke" independently states the program's central methodological bet: the compiler is evidence, not verdict. [Inference, High]

**2. The Crossman quote is independent corroboration of the methodology-as-asset thesis.** The synthesis headline is that the transferable asset is the claim/evidence governance machinery, not any single port. Crossman's oracle-vs-teacher distinction — "Rust stops the agent writing memory unsafe code; it does not stop the agent writing the wrong program correctly" — is the same thesis in one sentence: memory safety is necessary and insufficient, and the remaining work is behavioral verification. That is what negative-evidence ledgers, differential oracles, and fail-closed gates are for. An independent practitioner reached the program's conclusion from a different road. [Inference, Medium]

**3. The regression taxonomy rhymes with the packets' failure modes.** Toub's five families (incomplete migration, state/lifetime, behavioral contract mismatch, host boundaries, incorrect test oracles) map onto failure shapes the packets document repeatedly — README/status drift as behavioral-contract mismatch, unsafe-boundary bugs, ported-but-unexercised code paths. This is a hypothesis, not a count; see follow-up question 1. [Inference, Medium]

**4. NVIDIA's compile-time aliasing check is the kind of mechanism the program's honesty apparatus aspires to.** `DisjointSlice` and tile partitioning move a whole bug class from testing to compilation — the same direction as the program's fail-closed gates, but enforced by the type system rather than by process. It is also a calibration point: NVIDIA ships it as early alpha with "coverage incomplete and APIs will move" stated up front — the TRL honesty the program demands of the franken repos, practiced by a vendor. [Inference, Medium]

**5. Economics context for agent-assisted rewrites.** $120K in attributed token spend plus three weeks of lead time for an 832K-line production port reframes the program's own economics discussion: the franken suite's agent-assisted output is cheap to produce and expensive to verify, and the verification cost is where the program's methodology lives. Bun's primary-sourced numbers sharpen it further: ~$165K at API pricing (pre-merge) for 535,496 lines of Zig ported in 11 days by ~64 parallel agents — and even so, the port introduced 19 regressions that had to be fixed post-merge. Passing tests are not a shipping verdict. [Inference, Medium]

**6. Bun is the best-documented external case for the compiler-as-evidence argument — and it marks the argument's boundary.** Where Microsoft shows the compiler is *not sufficient* (dozens of regressions that compiled), Bun shows what the compiler *does* buy: the exact bug classes that motivated the rewrite — use-after-free, double-free, forgotten cleanup on error paths — become compile errors instead of production crashes, and ~16,000 such errors became a machine-readable work queue the agents could grind through. That is an independent statement of the program's central bet, made at industrial scale. (The "108 of the last 150 PRs" figure would have quantified how much agent/human output the compiler rejects, but it traces to a single uncited commentary piece — it is excluded from the analysis rather than repeated.) [Inference, Medium]

**7. The Microsoft toolchain story is a different kind of evidence: institutional commitment, not a correctness datapoint.** The other three stories are about ports — what the compiler does or doesn't buy at the code level. This one is organizational permanence: Rust inside Microsoft now carries the same SDL requirements, toolchain investment, tooling, QA, and long-term-support expectations as C++, and the engineering vehicle (`rustc_codegen_utc`) exists precisely so future Windows platform investments land on both languages at once. That is a standing-commitment datapoint, not a verification datapoint — it proves nothing about any single repo's honesty apparatus, but it says the direction of travel has institutional weight behind it, which is what the program's multi-year planning horizon has to assume. [Inference, Medium]

---

## Honest limits

- **Vendor as customer.** GitHub is both the tool vendor and the migration's customer (noted in secondary coverage). This is a feasibility datapoint, not a generalizability benchmark — the team had deep internal context no outside team would have. [Inference, High]
- **Internal vs public CI.** Toub's regression counts come from Microsoft/GitHub-internal rollout telemetry and issue trackers, not from independently reproducible public CI. The program's own standard (CI green at the pin, publicly observable) is not met by this story either. [Inference, High]
- **The $120K figure is attributed token spend**, explicitly "plus three weeks of a developer's time" — not fully-loaded cost, not review overhead, not the regression-fix tail. [External, High]
- **15.9x is workload-specific**, per the author himself. Citing it without the caveat repeats the exact error the program's de-slop passes were built to catch. [External, High]
- **NVIDIA's tracks are early alpha**, and the AMD/Intel pressure claim is unsourced commentary. The story validates Rust's direction of travel, not its arrival. [External, High]
- **Vendor blog as source (Bun).** The Bun story comes from Bun's own blog — the company describing its own rewrite, post-Anthropic-acquisition, with Sumner now an Anthropic employee. The bug list, token costs, and regression counts are self-reported with no independent audit; the technical specifics (commit hashes, CI build numbers, unsafe counts) are checkable, the framing is not. [External, High]
- **Foundation guest post as source (Microsoft toolchain).** The Tier-1 narrative comes from Microsoft's own Rust tooling lead on the Rust Foundation's blog — the adoption counts and production-readiness claims are self-reported, not independently audited, and the "sustained investment" framing is a statement of intent. Treat it as organizational-permanence evidence, not as a verification result. [External, High]
- **Release notes, not rewrite evidence (AWS SDK).** The AWS SDK item documents a vendor's migration-path governance, not an agent-assisted rewrite or its verification. It says nothing about the compiler-as-verdict thesis, regression rates, or any franken repo's honesty apparatus. Included only as ecosystem-maturation context for the "bigger trend" narrative. [Inference, High]
- **No packet-level contact.** None of the five items has been cross-checked against any individual `*-assessment.md` packet's failure-mode inventory. The mappings in §"Why it matters" are structural parallels, not verified correspondences. [Inference, High]

---

## Follow-up research questions

1. **Do Microsoft's five regression families cluster in the same failure modes the packets found?** Toub's taxonomy (incomplete migration, state/lifetime, behavioral contract mismatch, host boundaries, incorrect test oracles) is specific enough to code against. A packet-by-packet pass tagging each documented regression/failure instance with these five families would test whether agent-assisted Rust ports fail the same way at one-developer scale and at hundred-developer scale. If the distributions match, the program's negative-patterns catalog generalizes beyond the corpus; if they diverge, the divergence itself is a finding about scale.
2. **Can the program's claim-governance machinery be evaluated against Toub's E2E lesson?** "With one exception, all of the regressions that involved missing features... were due to lack of sufficient end-to-end tests" is a falsifiable claim about verification strategy. The starter kit's readiness gates could be scored against it: would the kit's gates have caught the classes of regressions Toub documents, or do they over-index on compile-time and unit-test evidence the same way the port's process did?
3. **Does NVIDIA's compile-time aliasing model suggest a differential-oracle pattern for GPU-adjacent franken repos?** `frankentorch` and `frankenjax` reimplement tensor/GPU-adjacent stacks where aliasing and shape errors are the dominant bug classes. The `DisjointSlice`/tile-partitioning pattern — making illegal states unrepresentable rather than tested-against — is a candidate transferable technique for those repos' honesty apparatus, worth a spike in the next planning round.
