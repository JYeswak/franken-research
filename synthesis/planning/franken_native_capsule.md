# Planning methodology: franken_native_capsule

Repo: https://github.com/Dicklesworthstone/franken_native_capsule (org mirror `franken-suite/franken_native_capsule` in Cargo.toml metadata).
Assessed: 2026-09-22 from a fresh `git clone --depth 1`. Single-commit repo; the only commit is
`7af57e2 docs(capsule): bound nonce replay domain precisely`. The entire tree is 15 files, 324K.

**TL;DR:** This repo has no internal planning system at all. It is a single-commit,
externally-governed satellite: the planning happened elsewhere (FrankenEngine ADR-0010) and was
*imported* here as a frozen boundary. The two root documents (`AGENTS.md`, `README.md`) are
compliance artifacts, not planning artifacts.

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` | Agent operating instructions / compliance boundary | Safety boundary, architecture invariants, and work discipline for agents editing the repo. |
| `README.md` | Capability scoping + negative-claim ledger | Declares the repo's frozen scope, dependency direction, current executable slice, and — crucially — what is *not* claimed. |
| `Cargo.toml` (root) | Pinned dependency graph | Every Cranelift crate pinned to `=0.134.2` so "dependency composition cannot silently mix patch releases and invalidate the audited compiler/machine-code identity" [Maintainer claim]. |
| `rust-toolchain.toml` | Toolchain pin | Rust 1.94 / edition 2024. |
| `crates/frankenengine-native-capsule/src/{arch,platform}/…` | Unsafe allowlist modules | The only locations where unsafe is permitted; every unsafe block carries a stable `NCC-SAFETY-*` invariant ID + adjacent `SAFETY:` argument + linked test/probe. |
| `crates/frankenengine-native-capsule-api/src/lib.rs` | Wire types | Versioned lifecycle types, fixed-probe NRP/RCO v0; doc comments explicitly bound what each type is *not*. |
| `crates/franken-native-capsule-worker/src/lib.rs` | Compiler worker | Authority-free Cranelift worker; emits sealed, address-free RCOs. |

Notable: there is **no** `docs/` tree, no `docs/planning/`, no `docs/research/`, no ADRs directory in
this repo. Planning references point *outward*: AGENTS.md states "This repository implements the
boundary frozen by FrankenEngine ADR-0010", and README.md states "The implementation follows
`/dp/franken_engine/docs/adr/ADR-0010-native-code-capsule-trust-boundary.md`" [Verified — file
contents; the referenced ADR lives in the sibling `franken_engine` repo, not here].

## 2. Execution-readiness gates

There are no plan-review gates in the sense of "what must a plan pass before agents are set free."
The closest analogues are the **compliance gates in AGENTS.md** — preconditions every agent edit
must satisfy [Verified — AGENTS.md, quoted verbatim]:

- "Every unsafe block requires a stable `NCC-SAFETY-*` invariant ID, an adjacent `SAFETY:` argument, and a linked focused test or platform probe."
- "No build script, proc macro, generated source, example, test, or benchmark may contain unsafe code."
- "A native fault is process-fatal. Never catch a fatal native fault and resume execution or relabel it as a portable-tier fallback."
- "Unknown schema, helper, relocation, target, epoch, or resource state fails closed."
- Work discipline: "Work only on `main`." / "Never delete a file or directory without explicit written user permission." / "Use Cargo only. After substantive changes run `cargo fmt --check`, `cargo check --all-targets`, `cargo clippy --all-targets -- -D warnings`, and `cargo test`."
- Claim bound: "Keep claims bounded: a fixed native probe is not JavaScript semantics, containment, conformance, or parity evidence." [Verified — all verbatim from AGENTS.md]

An in-code example of the invariant-ID mechanism [Verified — `crates/frankenengine-native-capsule/src/arch/x86_64/raw_invoke.rs`, quoted verbatim]:

> `// NCC-SAFETY-X86-RAW-INVOKE-001`
> `// SAFETY: the only caller holds a FixedProbeCapsule created from the`
> `// opaque output of the pinned Cranelift worker after exact plan, target,`
> `// receipt, seal, metadata, entrypoint-offset, signature, feature, and W^X`
> `// validation. … A native fault is process-fatal by contract and is never`
> `// caught or converted into portable fallback.`
> `// Probe: crate::tests::fixed_probe_is_correct_rx_only_bounded_and_retired.`

So the "gate" is: boundary compliance + per-unsafe-block proof obligation + test suite + clippy.
There is no sign-off ritual, no reviewer requirement, no definition-of-done doc.

## 3. Honesty guardrails

The strongest planning signal in this repo is its **negative-claim ledger in README.md** —
an unusually explicit, itemized list of what the code does *not* do and what is *not* claimed
[Verified — README.md, verbatim excerpts]:

- "The broader production NRP/RCO v1 required by ADR-0010 is intentionally not claimed."
- "The currently implemented fixed-probe path is bring-up evidence only: it is not JavaScript execution, is not enabled by FrankenEngine, and establishes no production containment or performance claim."
- "It is not an IPC worker, issuer signature verifier, durable nonce store, process sandbox/supervisor, unwind or CFI registrar, JavaScript NRP lowering, deoptimizer, OSR path, or production router."
- "In particular, elapsed/output limits are post-operation admission checks and the transient-memory field is not enforced without the missing external worker supervisor. Those remain separate prerequisites before any untrusted extension or performance-parity claim."

AGENTS.md reinforces: "Keep claims bounded: a fixed native probe is not JavaScript semantics, containment, conformance, or parity evidence."

Type-level honesty appears in source doc comments, e.g. [Verified —
`crates/frankenengine-native-capsule-api/src/lib.rs`] "Worker receipt proposal. It is not an
externally signed authorization." and "This is not represented as process CPU time."

**Lifecycle/timing:** Because the repo was created in a single commit, these guardrails arrived
with the initial code, not as a later correction layer. [Inference] They read as defensive
responses to a specific failure mode: an agent (or downstream reader) over-claiming that a working
sum-to-`u64` fixed probe constitutes JS execution or sandboxing. The guardrails are aimed at
*claim discipline*, not at task-tracking discipline. There is no claim matrix, no negative-evidence
ledger file, no demotion/auto-demotion rule, no receipt-bound evidence machinery in this repo
[Absent].

## 4. Plan→agent execution

[Absent] — there is no task graph, no phases, no `.beads/`, no verification loop beyond
`cargo test`, and no dialectical two-model review visible anywhere in this repo. The entire
repository is 4 source modules (~2,700 lines total across `lib.rs` files) implementing one frozen
boundary from an external ADR. [Inference] The planning artifact here is the *decision to keep
this repo tiny*: separate ownership of the native-code mechanism from FrankenEngine so the
unsafety boundary is small enough to audit by reading. Drift prevention is architectural, not
procedural — `#![forbid(unsafe_code)]` in two of three crates, an explicit unsafe-module
allowlist, fail-closed validation, and "Work only on `main`" so nothing drifts in a branch.

## 5. State-of-the-art coverage

[Absent] — no `docs/research/`, no literature survey, no competitor scan, no research brief phase
exists in this repo. Technology choice (Cranelift 0.134.2, pinned) is justified only by
machine-code identity auditability [Maintainer claim — root Cargo.toml comment]. Any research
process behind choosing Cranelift would live in the FrankenEngine repo, not here [Inference].

## 6. Anti-satisficing

Partial mechanisms exist, but they are **verification-of-property mechanisms**, not
red-team/falsification process machinery:

- **Fail-closed validation:** "Unknown schema, helper, relocation, target, epoch, or resource state fails closed" [Verified — AGENTS.md]; validator refuses "fixed probe metadata is not leaf-only" [Verified — `validator.rs`].
- **Independent oracle:** "tests compare multiple native results with an independent wrapping oracle, inspect `/proc/self/maps` for RX-without-W, exercise refusal and nonce replay, and prove the retired address is no longer mapped" [Verified — README.md].
- **No resumption on faults:** fatal native faults are never caught or relabeled as portable-tier fallback — an explicit anti-convenience rule [Verified — AGENTS.md].

[Absent]: red-team procedures, falsification campaigns, auto-demotion rules, adversarial grader
loops, cross-check protocols. The anti-satisficing is encoded as *code invariants*, not as an
ongoing process.

## 7. Explicit absences

Checked for and not found anywhere in the tree (`find` over all files + grep for plan/roadmap/
bead/claim-matrix/negative-evidence/red-team/falsify/demotion/research/ADR keywords):

1. `docs/planning/**` — absent (no `docs/` at all)
2. `.beads/` task-tracker database — absent
3. `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` — absent
4. `CLAUDE.md` / `MUSE.md` / `.muse/` — absent (only `AGENTS.md`)
5. Definition-of-done document — absent
6. Claim matrix / negative-evidence ledger file — absent (README carries negative *claims* inline, but there is no ledger/evidence structure)
7. Auto-demotion rules / receipt-bound evidence machinery — absent
8. Research/brief phases, literature or competitor coverage — absent
9. ADRs — absent *in this repo* (the governing ADR-0010 lives in the sibling `franken_engine` repo)
10. Any git history — the repo is a single commit (`7af57e2`), so there is no visible plan→review→revise trail; no PRs, no issue references, no task-graph artifacts

## 8. Maturity verdict: **thin** (as internal planning), deliberately

This repo's planning maturity is **thin** in the strict sense: no task tracker, no roadmap, no
research phase, no review gates, no dialectical machinery, no absences from a suite pattern —
because the pattern was never needed here. The repo is a single-commit, ~2,700-line compliance
artifact whose entire "plan" is one external ADR. [Inference] Emanuel's planning method here
appears to be *decomposition itself*: instead of spinning up the full planning apparatus
(beads, roadmaps, grading loops), he extracted the high-risk unsafe surface into a satellite
small enough to govern with two short documents and `#![forbid(unsafe_code)]`. The two
documents that do exist are high quality — AGENTS.md's NCC-SAFETY invariant-ID system (stable
ID + SAFETY argument + linked probe per unsafe block) is a genuine, repo-specific traceability
mechanism, and README.md's negative-claim ledger is the most explicit anti-overclaim text found
so far. So: **thin on process, dense on constraint** — planning-by-architecture rather than
planning-by-documentation.
