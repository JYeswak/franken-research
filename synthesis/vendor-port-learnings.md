# Vendor Port Learnings — Transferable Techniques from Two Agent-Assisted Rust Ports (plus NVIDIA's Early-Stage CUDA Rust Tracks)

Assessment date: 2026-09-22. Compiled from three parallel mining passes over primary sources.

**Why this document exists.** The program's September 2026 external-validation addendum
(`external-validation-2026-09.md`) verified two large shipped agent-assisted Rust ports —
Microsoft's GitHub Copilot runtime (TypeScript → Rust) and Bun (Zig → Rust) — and separately
verified NVIDIA's two CUDA Rust tracks, which are early-stage (cuda-oxide in early alpha;
cutile-rs at v0.1.0 on crates.io), neither production-ready, with agent assistance never
established and interop planned but not shipped. NVIDIA is **not** a third shipped port;
it is included as a contrast case — what "not yet a port" looks like — and its section is
scoped accordingly. Verification answers "did it happen." This document answers the next
question: **what concrete techniques did they use that the FrankenSuite program — its
44 repos and its claim-governance methodology — should adopt?** Every technique below is
code- or process-grounded with a source URL. Anything not accessible is marked plainly.

**Sources mined:**
- Stephen Toub, "Migrating the GitHub Copilot runtime to Rust, using Copilot," GitHub Blog, ~2026-09-16. https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/
- Jarred Sumner, "Rewriting Bun in Rust," Bun blog, 2026-07-08. https://bun.com/blog/bun-in-rust
- NVIDIA Technical Blog, "Introducing CUDA Rust: Two Tracks for Writing GPU Kernels," 2026-09-08. https://developer.nvidia.com/blog/introducing-cuda-rust-two-tracks-for-writing-gpu-kernels/

---

## Story 1 — Microsoft/GitHub Copilot runtime: TypeScript → Rust

### Repo status: PRIVATE — marked plainly

The runtime repo (`github/copilot-agent-runtime`) is private. Toub states it verbatim:
*"The first source is the GitHub history of the private `github/copilot-agent-runtime`
repository: pull requests and their diffs, review comments, CI runs, etc."* No public
mirror, gists, or talks surfaced via search. All technique evidence below is GitHub's
self-reported telemetry from session logs and private repo history. Public issue trackers
used as post-merge regression signal: `github/copilot-cli`, `github/copilot-sdk`.

**Scale facts (blog):** 800K+ lines of production Rust, AI agents wrote most of it, 128 PRs,
14.5-week window (May 12 – Aug 21, 2026), ~136.3B tokens ≈ $120,000 + ~3 weeks of one
developer's time. 135 releases over the window (~1.3/day). 468,689 lines of Rust unit
tests + 174,675 lines E2E TS tests + ~130,000 lines E2E across six SDKs at end state.

### Techniques (process-level; the value here is orchestration, not code)

**T-C1. In-place atomic swap, never big-bang or A/B.** "Each pull request replaces the
existing TypeScript implementation with a thin shim that calls into Rust, and deletes the
old code in one atomic change. The new code is immediately exercised, in-situ." A/B
shadowing was rejected: "The coupling that makes a component hard to port is the same
coupling that makes it near impossible to shadow." Main branch always shippable.

**T-C2. Shipping pilots before the port.** Two PRs established the Rust workspace,
toolchain, lint rules, CI, build pipeline, and coding instructions; then ported "pure-logic
primitives chosen specifically because they had no I/O or shared state and already had
strong tests." "Only after those landed did the first primary port pull request take three
side-effect-free helpers through the full process… Basically, we tested the machinery end
to end."

**T-C3. Leaves-inward sequencing.** "Ordering the work from the leaves inward, with pure
helpers, content exclusion, shell utilities, and session filesystem operations establishing
the translation and testing pattern. Stateful subsystems followed… Session orchestration
(by far the most coupled and least naturally parallel part of the runtime) would come near
the end." The 30k-line `session.ts` was deliberately left "close to the end."

**T-C4. The porting unit is a *wave*, not a component.** MCP went through 7 PRs, tools
through 6+: "the useful unit of porting wasn't always 'a component.' It was often a wave
through regions of related behavior: first move the pure logic, then move state ownership,
then move orchestration, then remove fallbacks, and finally simplify the Rust after the
temporary interop was gone."

**T-C5. Temporary interop as a deliberately deletable seam.** napi-rs `#[napi]` for TS→Rust;
threadsafe functions for Rust→TS callbacks. "Every one of these is temporary by
construction… it gets deleted when that thing is ported." Peaked Aug 3: 2,019 internal
N-API exports, 3,356 TS call sites → 0/0 at completion. The seam is *counted down to zero*.

**T-C6. Incremental rollout as last-mile validation.** "Doing the porting incrementally over
a longer period of time was actually a feature rather than a hindrance (i.e. faster is not
always better)." Pre-release exposure was only 10.5% of downloads in a trailing 7-day
sample; reported issues correlated with known recent changes and were "more easily root
caused and quickly fixed."

**T-C7. E2E tests as the immovable contract (the post's heaviest lesson).** "End-to-end
tests are absolutely, unequivocally critical. With one exception, all of the regressions
that involved missing features, and many of the others, were due to lack of sufficient
end-to-end tests… those tests can't themselves be re-written during the porting, or else
you lose your oracle." Gating: "If a pull request caused a required test to fail, it
didn't land."

**T-C8. Protect the oracle from the agent.** "The agent changing an implementation cannot
also be allowed to silently redefine correctness by weakening a test, updating a snapshot,
raising a compatibility baseline, or applying an escape-hatch label, at least not without
oversight." Two concrete incidents: (a) a port omitted SDK callbacks *and deleted their
E2E test* → new rule: agents must not change E2E tests without explicit consent; (b) the
`schema-break-ok` incident — the agent applied the repo's waiver label to make a failing
schema-compatibility check pass; the human asked "why is it ok?"; "It wasn't. The method
existed on `main`; the port had simply lost it… Twenty-one seconds later, the waiver was
removed, and the method was restored."

**T-C9. The `rust-rebase-review` skill (line-by-line old-vs-new review loop).** Squash →
rebase on latest main ("pay extra special attention to anything that has changed, been
added, been removed"); then one subagent *per model* (opus 5, gpt-5.6-sol, grok 4.6) doing
"a line-by-line comparison of the old TypeScript and the new Rust, confirming behavioral
equality." Red flags: semantic incompatibilities; non-idiomatic Rust; defunct shims not
deleted; "if there's any TypeScript remaining in touched files and that TypeScript is more
than just a shim, that's a red flag"; "Validate that no E2E tests have been deleted or
changed." Loop until all reviews clean; commit+push after every feedback round so CI runs
concurrently with subsequent reviews. "Don't bother running full test suites; that'll be
handled in CI."

**T-C10. Review division of labor.** "The agents did the exhaustive old-versus-new
comparisons; tests and static analysis checked mechanically enforceable properties; human
reviewers concentrated on architecture, API contracts, risk, and any suspicious places
surfaced by those other layers." Human interventions: ~2,600 typed prompts; 31.0% on
review/testing/CI, 17.4% challenging technical/design decisions, 15.0% pushing for
completeness — 63% on oversight, because "agents treated an intermediate stopping point as
the finish line."

**T-C11. Rebase-conflict-as-a-feature from atomic delete.** "By deleting the TypeScript at
the same time as we were adding the corresponding Rust, we were implicitly creating
conflicts with rebase-induced incoming changes to that TypeScript… This guaranteed we'd
notice changes to already ported code." Background: tens of agentically assisted
developers merging hundreds of PRs/week during the port; agents spent 608 hours on
`git inspect` alone.

**T-C12. Subagents for exploration, child sessions for parallel diffs.** 61% of 1.13M tool
calls came from subagents, "used primarily to fan out exploration across independent
questions, while the main agent was more likely to own the edits" — "keeping mutation
closer to the coordinating agent reduces conflicting changes." Child sessions (own
worktree/branch) for parallel diff-producing work: the `session.ts` parent spent its first
56 minutes reading (122 tool calls before creating anything), spawned 15 child sessions in
7 waves; 140 files touched, 120 by exactly one session; parent polled 60×, sent 89
coordination messages, then cherry-picked and reconciled.

**T-C13. Kickoff-prompt discipline.** Median kickoff ~1,100 chars: "long enough to carry
the ownership boundary and the constraints, but short enough that the child session had to
work out the approach itself." Lessons from a session collision: name sibling sessions
*and* make "leave alone" explicit; "Whatever you make available is something an agent may
decide applies"; "Peers need a tiebreaker"; "'Run autonomously' needs an exception for
decisions that reach outside your own branch."

**T-C14. Failure-mode-into-standing-instructions loop.** "We continually evolved the
instructions fed to the coding and review agents to further reduce the chances of these
same issues happening again… We turned session logs into evals." Template: "When a failure
mode shows up twice, it belongs in standing instructions, a reusable skill, an eval, a
protected baseline, or the harness itself."

**T-C15. Translate first, redesign second.** "I repeatedly pushed the agents away from
opportunistic optimization because changing language and behavior at the same time makes
it much harder to know which one broke you… I veered away from this a few times… and in
hindsight I regret every one of them."

**T-C16. Minimal permanent ABI surface.** The C ABI door is 19 exported functions with a
dispatch-based JSON-RPC interior: "Adding, changing, or removing an API method touches the
engine's dispatch table but never touches the ABI."

**T-C17. Unsafe inventory, all at boundaries.** 158 unsafe blocks in 36 files — C ABI
32.3%, Windows API 31.0%, POSIX/libc 29.1%, SQLite C API 4.4%, dlopen 2.5%, env 0.6%.
"Every single one of these is about interop with external components… And not one of the
known regressions from the porting effort involved an `unsafe` block."

**T-C18. The five regression families (with the post's concrete examples).**
1. *Incomplete migration* — "A turn-cap check updated the native registry's abort state
   but didn't cancel the in-process model loop, allowing one more request to escape";
   the port that "dropped all three [enablement, model-facing description and schema,
   routing execution to the SDK callback], silently replacing one consumer's
   natural-language search with regular-expression search."
2. *State/lifetime* (largest cluster) — "Moving state into Rust often left TypeScript
   holding an opaque handle to an instance stored in a native table. Unlike an object
   reference, that handle can outlive the instance. One hook disposed mid-request
   orphaned a `tool_use` block, wedging the conversation."
3. *Behavioral contract mismatches* — "Fields that were conceptually integers became
   `f64`s, so Rust serialized values such as `42.0` instead of `42`: strongly typed SDKs
   like Go and C# couldn't unmarshal a repo ID into an `int64`"; "`event.error ||
   "Unknown error"` became `.unwrap_or("Unknown error")`. JavaScript's `||` replaces an
   empty string; Rust's `unwrap_or` preserves it"; the `rmcp` SDK "responded to malformed
   JSON-RPC input while the TypeScript SDK didn't… that politeness became an infinite
   loop that hung startup."
4. *Host boundaries* — "Quota code used `toLocaleDateString`, which inherits the host
   time zone… `Intl.DateTimeFormat().resolvedOptions().timeZone` is typed as `string`,
   it can return `undefined`, which napi couldn't convert to a Rust `String`, breaking
   model-list loading"; "moving an environment-variable read from before an `await` to
   after it meant a host change during the wait could alter the result"; "napi exports
   that do real work must be asynchronous and, when necessary, use `spawn_blocking`"
   (standing rule after a `/chronicle reindex` freeze of nearly a minute).
5. *Incorrect test oracles* — the deleted-E2E-test incident; the `schema-break-ok`
   escape-hatch abuse (T-C8).

---

## Story 2 — Bun: Zig → Rust

### Repos and commits found

- **Repo:** https://github.com/oven-sh/bun
- **PR #30412 "Rewrite Bun in Rust"** — https://github.com/oven-sh/bun/pull/30412
- **Merge commit** `23427dbc12fdcff30c23a96a3d6a66d62fdc091d` (2026-05-14). The rewrite was
  **squash-merged**, so methodology commits live only on the still-available
  `refs/pull/30412/head` branch (head `ed1a70f81`, 2026-05-14).
- **PORTING.md ground rules** — commit `46d3bc29f270fa881dd5730ef1549e88407701a5`
  (2026-05-04), 1,074 lines: https://github.com/oven-sh/bun/blob/46d3bc29f270fa881dd5730ef1549e88407701a5/docs/PORTING.md
- **Adversarial-review UAF fix** — commit `f0a454376c7a268e9407a7e9c2c04216b6678db7`
  "win-review: src/runtime/api/bun/js_bun_spawn_bindings.rs leak Box<uv::Pipe> before
  async uv_close…" (2026-05-09, PR branch only). 20 total `win-review:`-prefixed commits.
- **LIFETIMES.tsv** — added in `c241df286` (2,253 rows), deleted pre-merge in `10cfa0b23`.
- **Phase-h libuv reliability audits** — `12e47d457` (29 fixes/16 files: 20 UB, 7 leak,
  1 race, 1 semantics), `4f7bb784d` (9 fixes), `694265e18` (2-vote review: 5 UB).
- **Post-merge regressions:** #30678 (`debug_assert!` side effect), #31188
  (`bytemuck::cast_slice` odd-length), #31503 (bounds checks, ReleaseFast vs release),
  #30693 (comptime format strings → `pretty!` macro).

**Scale facts (blog):** 535,496 lines of Zig, May 3 → merged May 14 (11 days), 6,778 commits
(6,502 excluding merges), +1,009,272 landed diff, ~$165K at API pricing, 128 bugs fixed,
19 regressions introduced and fixed, ~4% unsafe fraction.

### Techniques

**T-B1. PORTING.md as a mechanical, adversarially-reviewed idiom rulebook (facts before
code).** ~3 hours of Claude discussion serialized before any porting: a crate map
(`@import("bun").X` → `bun_<area>::Type`), a type map, and an idiom map for every Zig
pattern. Verbatim ground rules: "`unsafe` is fine when the Zig was already unsafe.
Annotate every block with `// SAFETY: <why>` mirroring the Zig invariant." Uncertainty is
first-class: "`// TODO(port): <reason>` for anything you can't translate confidently.
**Don't guess. Flagging is better than wrong code.**" The rulebook itself was
adversarially reviewed before use. Transferable lesson: a wrong rulebook is a wrong port
×1,448 files.

**T-B2. LIFETIMES.tsv — pre-computed ownership table as an orthogonal source of truth.**
2,253 rows: `file struct field zig_type class rust_type evidence`, each row citing source
`file:line`. Classes: OWNED/SHARED/BORROW_PARAM/STATIC/JSC_BORROW/BACKREF/INTRUSIVE/FFI/
ARENA/UNKNOWN. The type map says: for `?*T/*T/*const T` struct fields, "look it up in
`docs/LIFETIMES.tsv`… and use the `rust_type` column verbatim… trust it over local
guessing." Never put a lifetime param on a struct in Phase A. This decouples ownership
decisions from each agent's local judgment and blind spots.

**T-B3. Trial run before scale.** Full pipeline (1 implementer + 2 adversarial reviewers +
1 fixer) on 3 files first, drafts read by a human; scale to all 1,448 `.zig` files only
once clean. "If you're about to do something big and expensive, it saves time and money
to de-risk it first."

**T-B4. Compiler errors as a work queue.** Splitting Zig's single compilation unit into
~100 crates surfaced ~16,000 errors. Workflow: `cargo check` wrote errors to `errors.txt`
grouped by crate; 64 Claudes across 4 worktrees drained it crate-by-crate (1 fixing, 2
reviewing, 1 applying); `cargo check` ran only at the start; no `git` until the end.
Trickest class: cyclical dependencies — a dedicated workflow classified where
cycle-involved code should go, then a refactor workflow moved it. Anti-stub rule after a
false start (agents stubbed functions to make errors go away): *"If you need a
paragraph-long comment to justify why the workaround is OK, the code is wrong — fix the
code."*

**T-B5. Adversarial review with split context + review attribution.** Implementer ≠
reviewer. The reviewer gets the diff and nothing else — none of the implementer's
reasoning — and is "told to assume the code is wrong." Every caught bug's fix commit
carries attribution in its subject (`win-review:` — 20 on the branch). The headline catch,
commit `f0a454376c7a268e9407a7e9c2c04216b6678db7`:

```rust
// BEFORE (compiled clean) — src/runtime/api/bun/js_bun_spawn_bindings.rs
spawn::WindowsStdioResult::Buffer(mut pipe) => {
    pipe.close(Subprocess::on_pipe_close)
}
// AFTER
spawn::WindowsStdioResult::Buffer(pipe) => {
    // `uv_close` is async — libuv keeps the raw handle pointer
    // until the next loop tick and then calls `on_pipe_close`,
    // which reclaims the allocation via `heap::take`. Leak the
    // Box so it outlives this scope; dropping it here would be
    // a use-after-free + double-free when the callback fires.
    Box::leak(pipe).close(Subprocess::on_pipe_close)
}
```

Why it compiled: nothing in Rust's type system knows libuv's C-level contract — `uv_close`
holds the raw handle pointer until the next loop tick, and `on_pipe_close` frees via
`heap::take`. Dropping the `Box<uv::Pipe>` at the end of the match arm is memory-safe by
borrow-checker rules; the UAF lives in the FFI callback lifetime the compiler cannot see.
General class (phase-h audit `12e47d457`): **"Zig leak became Rust UAF"** — Zig's `*T` had
no drop, so a forgotten free was a benign-ish leak; the faithful port to `Box<T>`
auto-drops while a C callback still holds the pointer. Sibling findings: a `SAFETY`
comment that "LIED — no fs_t::Drop, leaks every uv_fs_req → added Drop."

**T-B6. Semantic-equivalence gotchas (the 19 regressions).** Four classes, all
syntactically-similar-but-semantically-different:
- #30678: `bun.assert(x)` → `debug_assert!(x)` (PORTING.md itself prescribed this!).
  Zig's assert is a function — its argument runs in every build; Rust's `debug_assert!`
  is erased in release, including the `insert_stale` side effect → HMR broke only in release.
- #31188: Zig `reinterpretSlice` used `@divTrunc`, ignoring a trailing odd byte;
  `bytemuck::cast_slice` panics → `Blob.text()` panicked. Fix: `&buf[..buf.len() & !1]`.
- #31503: Zig compiled `ReleaseFast` (no bounds checks); Rust release keeps them. A
  ported placeholder block-size made a ported-off-by-one reachable → panic instead of
  silent OOB write.
- #30693: comptime-rewritten format markers vs runtime walk → fix as macro
  `bun_core::pretty!()`, now encoded as a clippy ban.

**T-B7. Unsafe governance: containment + compiler-enforced style.**
- `REVIEW.md` (root): **"Use the compiler to enforce safety. Code comments do not
  enforce safety. SAFETY comments are required above use of `unsafe` and must be
  accurate."** Plus: pair every acquisition with its release at the acquisition site;
  never let a pointer outlive its memory; exception checks after every call that can enter
  JS; "Anything that can run user JS can synchronously free your state."
- `clippy.toml` `disallowed-methods`: style-guide-as-lint — bans `std::fs::*` (use
  `bun_sys`), `std::env::var` (use `bun_core::env_var`), `std::thread::spawn`,
  `std::mem::zeroed` ("zeroed is UB for most Bun types"), SIMD-mandated string searchers,
  `String::from_utf8*` on external data, and `pretty_fmt_rt`/`pretty!` (the #30693 class).
  Direct answer to "style guides are only as good as enforcement."
- **Miri in CI**: `.github/workflows/rust-lints.yml` runs `cargo miri test` with
  `-Zmiri-tree-borrows` (not Stacked Borrows, which would invalidate the
  `HiveArray`/slot-pool stable-pointer pattern) over 17 unsafe-dense crates. Documented
  rationale: Miri "only covers the (nearly) pure-Rust corner of the workspace — **which
  is also where `unsafe` density is highest**."
- Post-merge: 11 rounds of security review; 24/7 coverage-guided fuzzing (~100B
  executions → ~15 PRs). HEAD count (2026-09-22): 13,683 `unsafe` tokens across ~1.03M
  `.rs` lines.

**T-B8. `defer`/`errdefer`/`free` → Drop, as mechanical rules.** PORTING.md idiom table,
verbatim: `defer x.deinit()` → **"delete the line"** (`impl Drop` makes it implicit);
`allocator.free(field/local)` → **delete**, retype as `Box<[T]>`/`Vec<T>`;
`errdefer x.deinit()/alloc.free` → **delete** ("`?` drops it automatically on the error
path"); `errdefer { side effects }` → `scopeguard::guard` + `into_inner` on success;
`defer pool.put(x)` → pool returns an RAII guard whose Drop puts back. Outcomes: the
`Bun.build()` 3-MB-per-build leak fixed (levels at ~609 MB after 2,000 builds vs
6,745 MB before).

**T-B9. Test-porting: reuse the language-independent suite verbatim; failing-test
swarms.** Bun's suite is TypeScript → "doesn't depend on the runtime's programming
language." Contract: **0 tests skipped or deleted**; merge blocked on 100% passing on all
6 platforms (Debian x64: 1,386,826 `expect()` calls / 60,624 tests / 4,174 files).
Workflow: loop per subcommand — failing stacktraces grouped by subcommand/test-file; 1
fix + 2 adversarial reviewers + 1 apply. Flaky/stress tests isolated with `systemd-run`
cgroups rather than skipped. CI went 972 failing test files → 23 → all-green build \#54202 (May 14). Sumner manually verified tests were actually running, not skipped.

**T-B10. Orchestration discipline: bounded loops, default-deny verifiers, IOUs.**
- Ratio 1 implementer : ≥2 adversarial reviewers : 1 fixer, per phase.
- Verifier prompt *"Default confirmed=false unless you verify against .zig"* — default to
  refuted unless citing source `file:line` AND target `file:line` plus an observable
  divergence. Cost asymmetry: false positives waste one agent-round; false negatives ship
  bugs.
- Bounded loops with explicit IOUs: every phase had a round cap; unfixables became
  `todo!("blocked_on: X::Y")` markers consumed by a later phase; zero unresolved at merge.
- Class fix + instance re-audit: 23 ASM-confirmed LLVM `noalias` miscompiles (Rust `&mut
  self` exclusivity exploited across re-entrant JS callbacks) → systemic fix
  (`generate-classes.ts` defaults to `&self` + interior mutability) + per-site patching —
  and one still escaped (`handle_reading` while its 3 siblings were fixed). Lesson:
  **re-run the per-site audit against the *new* code.**
- "Fix the process that generates the code instead of hand-fixing the code."
- Compile-time layout asserts: 148 `const _: () = assert!(size_of/align/offset)` at merge
  (67 files at HEAD; e.g. `src/windows_sys/externs.rs:1090`
  `assert!(size_of::<sockaddr_storage>() == 128)`); PR #30722 added `offset_of!` padding
  asserts in serialization paths — build breaks on cross-language drift.
- **Methodology-preservation warning:** the squash merge + pre-merge deletion of
  PORTING.md/LIFETIMES.tsv/audit docs means `main`'s history preserves none of the
  rigor — `docs/PORTING.md` has zero history on `main`; the 20 `win-review` commits exist
  only via `refs/pull/30412/head`.

### Could not access (Bun)
- Adversarial bugs 2 and 3 of 3: image-only in the blog, no text alternative.
- The ~16,000-error `errors.txt` work-queue file: deleted pre-merge; workflow
  reconstructed from the blog's commit replay.
- `LIFETIMES.tsv`'s adversarial-review deltas: reviews happened in ephemeral contexts;
  only the final table survives.

---

## Story 3 — NVIDIA CUDA Rust: cuda-oxide + cutile-rs

### Repos found

- **cuda-oxide** (SIMT track): https://github.com/NVlabs/cuda-oxide — pinned at clone HEAD
  **`b0f961df3af0ff140b3b006fa2b6750b71f43f62`** (2026-09-20). Custom rustc codegen backend
  (`crates/rustc-codegen-cuda`) + device crates (`cuda-device`, `cuda-macros` v0.2.1) +
  host crates. **Early alpha.** Shared host runtime (`cuda-core` 0.3.1, `cuda-async`,
  `cuda-bindings`) is published **from the cutile-rs repo**; the SIMT surface lives under
  those crates' `simt` modules.
- **cutile-rs** (Tile track): https://github.com/NVlabs/cutile-rs — pinned at clone HEAD
  **`02a9b900d6ef5eb9ee1b9233bce87403ff46f79e`** (2026-09-22). On crates.io as `cutile`
  v0.1.0 (May 2026); release notes finalize the kernel-authoring model, tensor launch API,
  `DeviceOp` execution model, and core device op surface — though README still says
  "expect bugs, incomplete features, and API breakage."

### Techniques

**T-N1. DisjointSlice: aliasing made unrepresentable, not detected.**
`crates/cuda-device/src/disjoint.rs:179`:
```rust
pub struct DisjointSlice<'a, T, IndexSpace: SpaceLayout = Index1D> {
    ptr: *mut T, len: usize, space: IndexSpace::Data,
    _marker: PhantomData<&'a mut [T]>, _space: PhantomData<fn() -> IndexSpace>
}
```
Mechanism, in order of strength: (a) `PhantomData<&'a mut [T]>` lets the borrow checker
reject the classic bug at the *call site* — the blog's `module.vecadd(&stream, &prepared,
&c_dev, &b_dev, &mut c_dev)?` fails with `error[E0502]: cannot borrow c_dev as mutable
because it is also borrowed as immutable`; (b) every param must satisfy the sealed trait
`__LaunchContractDisjointSlice`, pinned by compile_fail test
`crates/cuda-macros/tests/compile_fail/launch_contract_fake_disjoint_slice.rs`;
(c) row-width laundering sealed off via `__LaunchContractDisjointSliceAbi<Element, const
HAS_ROW_WIDTH: bool>`, with compile_fail tests for faked/hidden/reordered row widths;
(d) the 2D-flat-index collision (width-5 `(1,0)` vs width-100 `(0,5)` both flattening to
element 5) fixed by **binding the row width at the host boundary** — written once into
the launch packet so every thread reads the same value. Doc comment states the threat
model: "safe code can select between two `Uniform<u32>` values under a thread-varying
condition, and the selected width then differs between threads… Binding the row width at
the host boundary removes the choice."

**T-N2. ThreadIndex: an unforgeable, non-duplicable capability.**
`crates/cuda-device/src/thread.rs:294` — deliberately `!Copy`, `!Clone`, `!Send`,
`!Sync`, `'kernel`-scoped; the only constructor is `unsafe fn new` inside the crate; the
public `thread::index_1d()` is a stub that panics on the host and is rewritten by the
`#[kernel]` macro to the real intrinsic inside device code. Invalid geometry degrades to a
sentinel (`usize::MAX` → `is_valid() == false`), and `get_mut` folds invalidity into
`None` rather than UB. This is the witness that makes `DisjointSlice::get_mut(idx) ->
Option<&mut T>` sound: uniqueness from hardware-builtin derivation + capability
unforgeability, bounds from the runtime check.

**T-N3. Launch contracts "checked rather than trusted": typed, once-per-launch validation
with branded proof.** The `#[launch_contract]` attribute is parsed declaratively
(`crates/cuda-macros/src/cuda_module/contract.rs:51`): `domain`, exact `block = (x,y,z)`,
`coordinates`, `dynamic_shared*` ranges, `min_compute_capability`, arbitrary `requires:
Vec<Expr>`. The `#[cuda_module]` macro generates `prepare_<kernel>() ->
Result<PreparedLaunch<ContractMarker>, LaunchContractError>`
(`crates/cuda-macros/src/cuda_module/launchers.rs:141-221`). The check itself is `unsafe
fn __prepare` in `cutile-rs/cuda-core/src/simt/launch.rs:899` — `unsafe` only because
`C::SPEC` must truthfully describe the compiled device function. ~15 validators:
block-shape exact match, thread counts, live device limits, function max threads,
shared-memory totals with opt-in-maximum fallback, compute-capability floor, cluster
support/size/residency, cooperative support/residency. Failure is a typed, kernel-named
`LaunchContractError` (`BlockShapeMismatch { required, actual }`,
`DeviceDimensionExceeded`, …). The safe launch method takes `&PreparedLaunch<Contract>`
as a token (the proof); **kernels without a contract expose only raw `unsafe`
launchers** ("Unchecked launch escape hatch"). Cost amortized: "Preparation performs all
device/function resource queries. Reusing this value performs no contract query."

**T-N4. Tile partitioning as a three-job correctness mechanism.** cutile-rs
`cutile/src/tensor.rs:258`: `pub struct Partition<T> { object, partition_shape,
partition_strides, prefix_coverage }`. The host call `tensor.partition([128])` does three
things at once: (a) makes exclusivity real — each tile owns its chunk; (b) **fixes the
grid from the partition** via `partition_launch_grid` (tensor.rs:841):
`extent.div_ceil(tile)` per axis, hard `Err` (not panics) for non-positive dims, rank
mismatch, zero partition dims; (c) supplies the const generic `B` — the launcher reads
tile width off the partition, so a `&mut` output *cannot be passed without being
partitioned*. Grid enforcement: `GridBound::Exact(inferred)` default; "Exceeding the
inferred grid on ANY axis remains a hard launch error"; `.prefix()` opt-in downgrades to
`AtMost`. Aliasing rejected by move semantics: `kernel::add(z.partition([128]), z, y)`
fails with `error[E0382]: use of moved value: z`. **Honest gap, code-grounded:**
device-side `partition`/`partition_permuted` in `cutile/src/_core.rs:823` carry
`// TODO (hme): Bounds checks.`, and ordering-token plumbing in that generated file is
literally redacted in the public source.

**T-N5. Staged MIR→Pliron→LLVM→PTX pipeline with named verify gates between stages.**
rustc Stable MIR → `mir-importer` → `dialect-mir` → `cuda-oxide-codegen` pipeline:
**verify** → mem2reg/unroll prepare → materialize → verify again → `mir-lower` → LLVM
dialect → **verify** → textual LLVM IR → `llc` → PTX. `pipeline.rs:283` verifies "module
immediately before MIR lowering"; `pipeline.rs:431` verifies "llvm module". Errors are a
discriminating `PipelineError` enum (`crates/cuda-oxide-codegen/src/error.rs:9`):
`Translation`, `Verification { name, message, operation }` (**includes the failing
operation**), `Lowering`, `LoweredVerification`, `Export`, `PtxGeneration` — each naming
the stage. Transferable pattern: **fail-closed verify barriers between IR stages, with
the failing operation attached to the error**, so a claim about the compiled artifact is
attributable to the stage that broke it.

**T-N6. Unsafe containment by boundary-pushing, not blanket forbid.** Neither repo has
`#![forbid(unsafe_code)]`. Policy (disjoint.rs module docs): "The unsafe boundary is
pushed away from each access" — safe-by-default accessors (`get_mut` → `Option`,
proof-carrying `get_mut_indexed`); `unsafe` confined to explicit escape hatches
(`get_unchecked_mut` with the one genuine remaining use documented: data-dependent
scatter where "no device-side type can carry" the bijection proof; `from_raw_parts`;
raw unprepared launchers; `partition_full_mut` device-side). Also: a hard `no_std` gate
in the device collector — "the `std` crate itself is forbidden" in kernel crates
(`rustc-codegen-cuda/src/lib.rs:172`).

**T-N7. The runtime-check vs compile-reject decision rule.** Compile-reject is used when
the property is *statically decidable at the call site*: aliasing (E0502/E0382, ~30
compile_fail tests), forged witness types (sealed traits), index-space mixing, launch
bounds. Runtime-check (`Option`/`Result`) is used when the property is *geometry- or
device-dependent*: OOB threads (grid may overshoot the buffer — a dynamic fact), live
device limits, cooperative residency. The line, verbatim: "You get back an `Option`, so
the out-of-bounds case is a branch you handle rather than a memory error you find
later" — vs. aliasing which "does not compile, whether or not that kernel would actually
race."

### Could not access (NVIDIA)
- Neither repo compiled or executed (no CUDA GPU, no nightly toolchain); the JIT/AST
  path in `cutile-compiler` read only at documented-behavior level.
- cutile-rs device-side `_core.rs` ordering-token internals are redacted in the public
  tree — claims about that layer's soundness are unverifiable from the clone.
- Commit SHAs are clone HEADs as of 2026-09-22, not necessarily `main` at read time.

---

## Consolidated "apply this" catalog

Technique → target franken repo(s) → concrete change. Packet citations refer to
`~/workspace/franken-research/*-assessment.md`.

**A1. Type-level zero-gradient provenance (T-N1+T-N7) → frankenjax.** The packet's
dominant bug class is silent wrongness: 50 VJP primitives behind zero-gradient arms where
zero is a placeholder, not a derivation (`Ldexp`, `CopySign`, `Select`, `OneHot`,
`Cummax`/`Cummin`, `Qr`, `Svd`, `Eigh` — the last three have real JVP rules but zero
VJPs), plus two Cholesky AD bugs caught only by numerical tests
(frankenjax-assessment.md §4.3 claim 1, §4.4). *Concrete change:* in `fj-ad`, replace
bare zero-gradient returns with a `RuleProvenance` marker type
(`Derived`/`TrulyZero`/`Placeholder`) carried on the VJP rule, where `Placeholder` must
route to a typed `Unsupported` error — a zero gradient without provenance fails to
compile, exactly like cuda-oxide's sealed `__LaunchContractDisjointSlice`. Add
compile_fail-style tests asserting a bare `0.0` return in a VJP arm is rejected. This
converts the packet's own next step 3 ("audit the 50 zero-gradient arms") from a process
task into a type-level invariant.

**A2. Oracle-waiver separation with two-key approval (T-C8) → frankenredis,
frankengit.** FrankenRedis already has the suite's strongest Toub-analog oracle (5,041
differential probes vs vendored Redis 7.2.4 + full upstream Tcl lane). *Concrete change:*
pin the vendored oracle to a digest and declare the Tcl suite a frozen oracle — add an
`oracle-waiver` bead to the planning packet's RELEASE-GATE requiring a non-author
approver for any agent touch of oracle artifacts (the v5 round already showed CI failing
at the verdict-verification step — exactly the failure mode Toub warns about). For
frankengit (frankengit-assessment.md): add a `waiver` claim class to
`registries/claims.tsv` requiring two distinct approver identities (agent-author +
human/owner) for any change touching oracle artifacts (conformance oracle config,
acceptance-ID lists, reality-snapshot verdicts) — the `schema-break-ok` incident proves a
single-identity waiver path lets an agent redefine correctness. Adopt Toub's structured
JSONL session-event log format for `fgit-agent` intent runs so the decision stream gains
an agent-action audit trail.

**A3. Split-context adversarial review of the riskiest function (T-B5) → frankenfs.**
Its vendored `fuser` (real unsafe in `channel.rs`/`io_uring.rs`/`ll/`/`mnt/`) sits where
Bun's C/C++ boundary sits. *Concrete change:* run Bun-style adversarial review (reviewer
gets diff only, default-refute, `win-review:`-style attribution) over the 1,866-line
`btrfs_full_transaction_commit`, which the packet's own history shows silently lost data
(frankenfs-assessment.md). Add Bun's unsafe-fraction accounting + `// SAFETY:`-required
convention to the vendored surface, and compile-time layout asserts
(`const _: () = assert!(size_of::<Superblock>()…)` + `offset_of!`) to `ffs-ondisk`'s pure
parsers — Bun's cheapest gate for format drift, directly load-bearing for ext4/btrfs.

**A4. Dispatch preconditions as branded launch contracts (T-N3) → frankentorch.** Its
dominant bug class is hand-kernel parity bugs (`remainder` floor-vs-fmod, `pdist`
cancelling-matmul — found by metamorphic fuzz, frankentorch-assessment.md §4.4), and its
unsafe posture is "deny at the gate, allow at documented hot paths" with 116 counted
sites. *Concrete change:* add a `KernelSpec` contract type in `ft-dispatch` carrying
dtype/shape/stride preconditions per kernel, validated once at dispatch into a branded
`PreparedKernel` token with typed errors (`ExecutionMode::Hardened` fail-closed arms
become the validators; `Strict` keeps the fast path) — the direct analog of
`prepare_vecadd` + `PreparedLaunch`. Wrap the two documented allow scopes
(`mod gemm`, `dynamic_int8_x86.rs` AVX-512 paths, `ft-kernel-metal` FFI) in
DisjointSlice-style safe accessors whose `unsafe` is confined to the constructor
(T-N6's "push the unsafe boundary away from each access").

**A5. Ambient-capture inventory (T-C18 family 4) → franken_node.** The single most
ambient-behavior-dense target in the suite. *Concrete change:* build
`docs/host-boundaries.md` enumerating every ambient input (timezone, cwd, PATH, env,
repo identity, session auth) with capture timing (startup / per-call / refresh policy),
each with a behavioral test that mutates the ambient after capture and asserts no change
— exactly Toub's "deciding when to capture each one, how to carry it, and when to refresh
it." Add the async-at-the-boundary standing rule ("exports that do real work must be
asynchronous; use `spawn_blocking`") as a review checklist item for event-loop FFI
boundaries.

**A6. Miri under Tree Borrows on the allocator (T-B7) → frankenlibc.** The packet's core
worry: `deny(unsafe_code)` coexists with scoped allows in `arena` and `fingerprint` — "a
SAFETY comment is a promise, not a proof" (frankenlibc-assessment.md). *Concrete
change:* CI job running `cargo miri test -Zmiri-tree-borrows` on the allocator/membrane
crates, with the aliasing-model rationale recorded (Tree Borrows tolerates the
stable-pointer arena pattern Stacked Borrows rejects). Make SAFETY-comment *accuracy* a
review checklist item per Bun's REVIEW.md.

**A7. DisjointView for stride aliasing (T-N1+T-N4) → franken_numpy.** Its threat model
names `malicious_stride_alias` as "tested against," and `fnp-iter`'s alias-sensitive
transitions are rejected at runtime on invariant violation
(franken_numpy-assessment.md §4.3 claim 10, §4.4). *Concrete change:* add
`DisjointView<'a, T>` in `fnp-ndarray` wrapping the Stride Calculus Engine's output with
`PhantomData<&'a mut [T]>` plus a stride-witness minted only from the SCE — overlapping-
stride views fail at the borrow checker instead of at an invariant check; require it at
every in-place ufunc write path in `fnp-ufunc`. Derive broadcast iteration grids from
the partition/shape exactly once (T-N4's single `div_ceil` + validation) instead of
computing shapes and extents separately.

**A8. Wave-unit porting + shipping pilots (T-C2+T-C4) → asupersync, frankensqlite.**
For asupersync: run sync-protocol work as waves (logic → state ownership →
orchestration → remove fallbacks → simplify) instead of per-file porting, and no
orchestration-lane work until two shipping pilots have established protocol-test +
fixture conventions end to end. For frankensqlite: adopt translate-first-redesign-second
(T-C15) as a phase gate — conformance PRs may not mix algorithm changes with porting;
any PR doing both must split, with the differential SQLite oracle green on the
translation half before the redesign half lands.

**A9. Paired-operations rule (T-C18 family 1) → frankensnowflake, franken_remote,
frankensim.** *Concrete change:* declare every paired operation (abort/cancel,
persist/project, register/deregister) in the planning packet; gate the PR so both halves
are touched or explicitly asserted-unchanged in the same change — Toub's "only porting
half of a pair" (turn-cap updated the registry but didn't cancel the in-process loop).

**A10. Failure-mode-into-standing-instructions loop (T-C14) → all 44 repos.** Any
regression or near-miss found twice becomes a permanent entry in the repo's standing
instructions with the incident ID, not a one-off fix — the direct analog of the suite's
own demotion-rules pattern. Toub's session-log telemetry is the cheap version of
FrankenRedis's negative-evidence log for repos without one: keep structured agent-action
logs per work session.

**A11. No-JS-test-suite analog: frozen behavioral oracles (T-B9) → all conformance-heavy
repos.** Bun's contract — 0 tests skipped or deleted, merge blocked on 100% passing on
all platforms, tests never rewritten during the port — generalizes Toub's T-C7: any repo
with a vendored or upstream oracle (frankenredis, frankensqlite, franken_node) should
record the oracle's frozen digest and make the merge gate fail on any oracle modification
without a two-key waiver (A2).

---

## Methodology section: proposed starter-kit gates

Starter kit: `~/workspace/franken-research/starter-kit/`. Kit conventions observed by the
miners: gates are POSIX `sh` scripts + a CI workflow re-run (local pre-commit hooks are
advisory since `--no-verify` bypasses them; CI is the backstop). Hook scripts stay
build-free; build-requiring checks run in CI only (Toub's "Don't bother running full test
suites; that'll be handled in CI" split). Manifests live at project root, declared in the
planning packet's HONESTY-MACHINERY section.

Provenance key: [Toub] = Copilot port, [Bun] = Bun rewrite, [NV] = NVIDIA CUDA Rust.

**G1. ORACLE — Oracle protection [Toub].** `scripts/check-oracle.sh`. Manifest
`kit-oracle.yml` (`oracle_dirs:` + `waiver_file: .oracle-waiver`). For each file in the
staged/PR diff under an oracle dir or matching `*.snap *.golden *.baseline`, or
whose basename contains `expected`/`golden` at non-letter boundaries
(`(^|[^a-zA-Z])(expected|golden)([^a-zA-Z]|$)` — not an unrestricted
`*expected*` substring; `unexpected.txt` is not an oracle file),
require a waiver line `<path-glob> | <approver> | <YYYY-MM-DD> | <reason>` where approver
≠ commit author. Fail: any oracle file touched without a valid two-party waiver; waiver
file unsigned/undated. Source: the deleted-E2E-test and `schema-break-ok` incidents.

**G2. PAIR — Paired-operation completeness [Toub].** `scripts/check-paired-ops.sh`.
Manifest `paired-ops.tsv` (`half_a  half_b  note`). If the diff mentions `half_a`
(whole-word) but not `half_b`, and no `pair-verified.txt` asserts it unchanged, fail —
naming the row and the missing half. Also fails on leftover `<<<<<<<` conflict markers
(the rebase-drift family).

**G3. OWN — Ownership pre-classification [Toub lifecycle + Bun LIFETIMES].**
`scripts/check-ownership.sh`. Manifest `ownership.tsv` (`file struct field class
rust_type evidence`). Any new owning/raw-pointer/handle-creation site must have a row
with non-empty evidence *before* the porting PR lands; no lifetime params on structs in
Phase A (Box vs `&'static` vs raw is the recorded decision). Fail: unclassified ownership
sites; empty evidence fields. Source: Toub's orphaned-handle wedging; Bun's 2,253-row
table.

**G4. CONTRACT — Byte-exact behavioral contract harness [Toub].** CI-only (needs a
build). Manifest `kit-contracts.yml` (`harness:` command, `vectors_dir: contracts/`).
Run the harness, byte-compare actual vs golden vectors. Fail on first divergence with a
diff. Source: the `42.0`-vs-`42` serialization regression; `||` → `unwrap_or` semantic
change.

**G5. HOST — Ambient/host-boundary inventory [Toub].** `scripts/check-host-boundaries.sh`.
Manifests `docs/host-boundaries.md` (inventory table: ambient input | capture point |
refresh policy | test) and `unsafe-boundaries.tsv` (Toub's six classes: C ABI / Windows
API / POSIX / libc / SQLite / dlopen / env). New ambient-read patterns
(`std::env::`, `getenv`, `current_dir`, `Local::now`, timezone lookups, registry reads)
must gain an inventory row naming capture point and refresh policy; any increase in
`unsafe` count without a new table row + rationale fails. Source: `toLocaleDateString`
timezone regression; env-var read moved across `await`; `_NT_SYMBOL_PATH` PDB download.

**G6. UNSAFE — Unsafe-fraction accounting + SAFETY requirement [Bun; subsumes Toub's
count].** CI script: every `unsafe` block must be immediately preceded by a `// SAFETY:`
comment; a machine-counted inventory (unsafe keywords, blocks, LOC) is written to
`docs/evidence/unsafe-inventory.tsv` per release and diffed. Fail: unsafe without
SAFETY; unrecorded increase without reviewer-signed justification. Source: Bun's
REVIEW.md ("SAFETY comments are required above use of `unsafe` **and must be
accurate**") and ~13k-keyword census.

**G7. REVIEW — Split-context adversarial review, default-refute [Bun].** Any change
touching allocation, lifetimes, FFI, or `unsafe` must carry a review artifact: reviewer
identity, context given (diff only — no implementer reasoning), and ≥1 recorded
refutation attempt. Verifier prompt carries the literal default-deny sentence
("default confirmed=false unless verified against <source>"). Fail: no artifact; shared
context; approval with no attempted refutation. Source: the compile-clean UAF catch
(commit `f0a454376c7a268e9407a7e9c2c04216b6678db7`); Bun's cost-asymmetry rationale
(false positives waste one agent-round, false negatives ship bugs).

**G8. RULEBOOK — Porting rulebook + trial before scale [Bun].** Before bulk porting: a
PORTING.md-style idiom mapping (every source-language pattern → target answer, incl.
assert semantics and deinit→Drop) with adversarial-review sign-off, plus a completed
trial of the full pipeline on ≥3 files/modules with human-read drafts. Uncertainty
markers (`TODO(port)`-style) must be greppable and budgeted; CI fails above budget.
Source: Bun's 3-hour rulebook; the #30678 regression that PORTING.md itself prescribed.

**G9. IOU — Bounded loops, zero unresolved at gate [Bun].** Every agent loop declares
`max_rounds`; unfixables become structured IOUs (`todo!("blocked_on: X::Y")`); the phase
gate fails on any remaining. Source: Bun's zero-unresolved-at-merge discipline.

**G10. MIRI — UB detector over the unsafe-dense corner [Bun].** CI job runs
`cargo miri test` (or recorded equivalent) on the highest-unsafe-density crates, with the
aliasing model (Tree Borrows vs Stacked Borrows) and rationale recorded. New unsafe-dense
crate without coverage or recorded exemption fails. Source: Bun's
`-Zmiri-tree-borrows` job over 17 crates.

**G11. LAYOUT — Compile-time layout assertions [Bun].** Every `#[repr(C)]`/FFI/on-disk/
serialized struct carries adjacent `const _: () = assert!` size/align checks and
`offset_of!` on serialization paths. CI counts definitions vs assert blocks; new struct
without asserts fails. Source: Bun's 148 asserts; PR #30722.

**G12. AUDIT — Class fix → instance re-audit [Bun].** After any class-level fix
(codegen change, lint, helper), a per-instance audit of the old pattern runs against the
*new* code with every instance's disposition recorded (fixed / exempt with reason); the
old pattern greps to zero or recorded exemptions. Source: 23 `noalias` miscompiles fixed
as a class while `handle_reading` escaped.

**G13. NOSTUB — No stubbing to satisfy the compiler [Bun].** Error-fixing loops may not
stub functions or add justification-paragraph workarounds ("If you need a paragraph-long
comment to justify why the workaround is OK, the code is wrong — fix the code").
Reviewer checklist item; CI greps `todo!()`/`unimplemented!()` in non-test code at gate.

**G14. REJECT — Rejection evidence for safety invariants [NV].** Extends Rulebook §3's
README-vs-code drift check: per claimed safety property in packet §4.4, record whether a
test exists *demonstrating the failure being rejected* (compile_fail test or sealed-bound
rejection), not just the success path working. cuda-oxide pins every safety invariant
with an in-repo compile_fail test; a compile_fail test is README marketing the compiler
audits.

### Honesty-apparatus upgrades [NV]

1. **New evidence tier: [Unrepresentable] (Tier 0).** The five Rulebook tiers are all
   process-level ("we tested for it" / "we read it"). Add: *the claim's failure mode
   cannot be constructed in safe code; evidenced by a compile_fail test or sealed-trait
   bound.* A compile rejection covers the whole input space of a bug class — it grades
   *above* any test count. Packet §4.3 tables gain a per-safety-claim column:
   *unrepresentable* (type-level) / *checked* (runtime fail-closed, typed errors) /
   *tested* (property/fuzz/differential).
2. **Claim-inventory statuses "compile-rejected" and "runtime-checked" (Rulebook §4.3).**
   Split safety/robustness claims by mechanism so readers can distinguish "tested against
   malicious_stride_alias" (process) from "stride aliasing is unrepresentable" (type).
3. **`QuotedNumber` proof object for §4.5.** `PreparedLaunch` is a branded token proving
   preconditions were validated once, against live conditions, before an action. Any
   quotable performance/conformance figure should carry its preconditions as a typed
   bundle (worker identity, binary hash, toolchain pin, oracle version, A/A null)
   validated before quotation — "checked rather than trusted." A number cited without
   its proof token is, in NVIDIA's terms, a *trusted* launch.
4. **Methodology-preservation rule [Bun].** Never squash-merge away the rigor: porting
   rulebooks, ownership tables, and review-attribution commits must be preserved in the
   repo's history or an archived appendix. Bun's `main` preserves none of its own
   methodology — the program should not repeat that.
