# Planning Methodology: franken_threed

Repo: https://github.com/Dicklesworthstone/franken_threed — Three.js r186 clean-room Rust/Wasm/WebGPU "application specializer" (not a fork). Shallow-cloned 2026-09-22.

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKENTHREED.md` (219 KB, ~28k words, v2.0) | Technical constitution | 23-section design doc: executive decision, compatibility contract, compilation strategy, renderer, testing, performance methodology, work breakdown F3D-01…F3D-24, risks, first-session script, definition of done, source register |
| `AGENTS.md` (53 KB, ~7.5k words) | Agent operating contract | Rules 0/0.1/1/2, truth sources, four-promises honesty rule, no-cut rule, testing policy, performance program, early kill gates, implementation sequence, Agent Mail/Beads workflow |
| `DEPENDENCY_ADMISSION.md` (10 KB) | Dependency admission ledger | Per-crate admission table with pinned versions, native/wasm32 compile results, forbidden components list, and a charged 10,000-line budget for Asupersync browser-host work (1,409 lines consumed, 14.1%) |
| `upstream/PIN.md` + `upstream/pin.json` | Upstream oracle pin | Immutable Three.js r186 pin: source commit `148ef33ecb6d2502ff796d4554abd1549c95d519` vs tag object `819fadd6b663b74d828c6af72a543024f74d3877`, with explicit hash-distinction honesty rule and reproducible checkout script |
| `.beads/issues.jsonl` (1.06 MB, 219 records) | Task tracker export | Beads issue DB export: 29 epics (F3D-01…F3D-24) + 190 tasks; 202 open, 12 in_progress, 4 closed, 1 deferred |
| `.beads/config.yaml` | Beads project config | `issue_prefix: f3d`, `default_priority: 2`, `default_type: task` (all commented out) |
| `.beads/metadata.json` | Beads DB pointer | `{"database": "beads.db", "jsonl_export": "issues.jsonl"}` |
| `docs/test-evidence.md` (2.5 KB) | Evidence archive spec | `evidence/<bead-key>/<run-id>/{events.jsonl,summary.json}` layout, event schema with required `owner` (implementation-owner) field, KEEP/ retention rules |
| `docs/asupersync-browser-host-gap.md` (16 KB) | Foundation gap analysis | Bead `f3d-02-...58j.1` deliverable: 8-requirement gap table vs Asupersync browser host, each with exact `file:line` evidence citations, status MISSING/PARTIAL/PRESENT |
| `evidence/01.1/` | Cited run artifacts | `reconcile.json`, `reconcile_fresh.json`, `build_sha256.txt` — package-export reconciliation evidence backing F3D-01 |
| `README.md` (30 KB) | Public-facing plan summary | "Honest status" table (plan vs reality per question), TL;DR, falsifiability statement, reading paths into plan sections, FAQ |
| `scripts/oracle-checkout.sh`, `scripts/test-oracle-checkout.sh`, `scripts/line-count.sh` | Oracle/verification tooling | Reproducible upstream checkout+verify; oracle checkout self-test; line-count for the 245k-line size budget |

[Verified] via directory listing and full/partial reads of each file above.

## 2. Execution-readiness gates

No plan-vs-agent "sign-off ceremony" exists; instead, readiness is gated by **physical-execution gates and kill gates** embedded in the plan and AGENTS.md. Key verbatim quotes:

- Plan §1.3 "Non-negotiable launch gates" (verified, plan file lines ~93–106):
  > 1. "Automatically transform the preregistered demanding applications, with the same input source on both sides except for explicitly shared harness instrumentation."
  > 2. "Pass the full feature/behavior inventory, complete upstream tests, and additional integration gates. Every scored application also passes image/state/interaction checks before timing results count; a green test suite alone does not establish full functionality."
  > 3. "Achieve at least **2× completed-frame throughput on every baseline-valid headline workload/device cell**, and at least **3× geometric-mean throughput within each primary device/browser stratum**, with the confidence rules in Section 16. A candidate crash, unsupported path, fidelity failure, or timeout is a failed cell, not a reason to remove it from the denominator."
  > 4. "Compare against the strongest eligible reference selected by independent calibration under a frozen, bounded optimization recipe."
  > 5. "Publish the difficult control cases, regressions, startup costs, thermal behavior, and failures as well as the wins."
  > 6. "Do not launch the project as a performance replacement if these requirements fail. A foundation gate can stop development long before full compatibility is implemented."
- Plan §19 ("Execution-ready work breakdown"): "These IDs are proposed implementation units, not claims that beads/issues exist." [Verified] — beads were later derived from these, per README "run `br ready --json` to see what is unblocked." [Verified, README]
- Plan §21 "First implementation session": "The first session should produce an honest measurement and a tiny working application, not a forest of empty crates." [Verified]
- Plan §22 "Definition of done" (seven paragraphs; full text verified): release requires all of — full functionality real ("No permanent feature cuts, stubs, placeholder shaders, unimplemented codecs/exporters..."), product real ("H1's GL mode actually works, not an unsupported-mode dialog"), both compatibility and new-backend coverage real ("A compatibility-only wrapper cannot pass"), performance real ("failures never shrink the denominator"), foundation real ("Cancellation is not rollback of issued effects"), implementation focused ("eleven crates and the 245k planned Rust ceiling"), completeness maintainable. Closing line: "The plan specifies that complete scope. It does not claim implementation, full test execution or speedup has already been demonstrated." [Verified]
- AGENTS.md "Early Kill Gates" [Verified]:
  1. "Foundation gate — actual browser task execution and cleanup, plus a legal WebGPU bridge, on Safari and Chrome. No ledger-only 'execution,' no native thread dependency."
  2. "Bridge gate — measure direct JS WebGPU, simple Wasm→host calls, bulk command transfer, and generated host submission on matched workloads."
  3. "First product gate — automatically transform complete H1 and H2... Require ≥ 2× on phone and M5 strata. If H1 is not viable against its competent reference, **do not substitute an easier toy** — reopen the project decision."
  4. "Generalization gate — repeat on held-out applications and at least one discrete-GPU stratum..."
  5. "Final gate — exhaustive functional and accelerated-rendering closure, all upstream/integration tests, all performance conditions."
- AGENTS.md "Implementation Sequence": "**Build Phase 0 first.** Do not start with frontier or optional-research work." [Verified] Plan §18: Phase 0 = "Full source/feature inventory and executable foundation"; Phases 1–5 sequence to "Complete deployment and release validation."

## 3. Honesty guardrails

- **Four Promises rule** (AGENTS.md, "THE FOUR PROMISES - NEVER CONFLATE THEM") [Verified, signature honesty mechanism of this repo]:
  > "This is the signature honesty rule of the project. Section 5.1 defines four statuses that must be kept separate in code, tests, reports, commit messages, and anything you say to the user:"
  API compatibility / Application equivalence / Implementation ownership / Acceleration — with the gloss "Passing a test through retained JavaScript is legitimate compositional compatibility. It is **not** evidence that a Rust implementation of that feature exists. A fast renderer does **not** imply that every application callback was accelerated."
- **No-cut rule** (AGENTS.md) [Verified]: "'Not in our demos,' 'not tested upstream,' 'uncommon,' 'dynamic,' and 'not yet ported' are not release exemptions." Blocking manifest states: `unclassified`, `unimplemented`, `untested`, `known-regression`, `stub`, `no-op-substitute`, `candidate-refusal-on-valid-source`. "Never average import coverage, behavior coverage, new-backend rendering coverage, exact-component integration, and capable-host validation into a single flattering '100%' number. Report them separately."
- **Eight project-specific honesty rules** (AGENTS.md, "Honesty Rules Specific To This Project") [Verified], verbatim:
  1. "No speedup claim before a benchmark runs. The plan states no speedup has been measured."
  2. "A symbol census is not an implementation."
  3. "Never fabricate a native handle."
  4. "Never present the original renderer's logical draw count as the new backend's actual GPU work."
  5. "Never regenerate golden images from the candidate. A mismatch is a defect until proven otherwise."
  6. "A candidate failure is a failed cell, not an excluded cell."
  7. "Do not silently reduce quality to win."
  8. "Distinguish structural cost estimates from measured timings everywhere they appear."
- **Dependency admission ledger** (`DEPENDENCY_ADMISSION.md`) [Verified]: admission requires pinned versions + verified native and wasm32 compile results ("Compile results are recorded only after an actual verified build run"); forbidden core components: Tokio, Rayon, Bevy/generic ECS, native Metal/Vulkan/D3D FFI, BLAS, Python. Budget: Asupersync browser-host work charged 10,000 lines; consumed 1,409 (14.1%) per `git diff --stat` accounting.
- **Test evidence schema** (`docs/test-evidence.md`) [Verified]: every event must carry an `owner` (implementation-owner) tag; runs cited in gate decisions are preserved under `evidence/**/KEEP/`; event lanes include `e2e-forced-new-backend` specifically "to prevent a compatibility-only wrapper from masquerading as this project."
- **Installation point in lifecycle**: all installed at plan inception (plan v1.0 → fresh-eyes revision → v2.0, with the §23 source register noting inspections on 2026-09-09); Beads and evidence conventions predate implementation ("FrankenThreeD currently has **zero implementation**" per AGENTS.md RULE 0.1 — the guardrails are the skeleton the work grows into, not retrofits).
- **Negative-evidence ledger / claim matrix / auto-demotion**: [Absent] — no negative-evidence ledger, no claim matrix, no demotion rules exist. The closest equivalents are the failed-cells rule and the no-cut rule (both behavioral, not tracked artifacts).

## 4. Plan→agent execution

- **Task graphs**: Plan §19's F3D-01…F3D-24 table with explicit `Depends on` column and per-task "Acceptance evidence" [Verified]; realized as 29 Beads epics (F3D-01…F3D-24, some doubled, e.g. two F3D-01 epics) plus 190 subtasks in `.beads/issues.jsonl` [Verified]. Bead records carry status/priority/assignee/description/comments/close_reason — e.g. closed bead `f3d-01-upstream-pin-and-census-6uuv` with a detailed close_reason stating exactly what was verified and what was NOT claimed ("do not claim fresh Safari/Chrome results") [Verified]. 202 of 219 beads open; execution is in Phase 0.
- **Phases**: §18/AGENTS.md Phase 0→5 with hard ordering ("No task defers the safety or semantic precondition of an earlier claimed performance result") [Verified]. AGENTS.md ties F3D-15's vertical slice to F3D-07 to avoid circularity.
- **Verification loops**: Three production-route lanes run separately (full functional routing / forced new-backend execution / exact native-backend integration) [Verified]; upstream suite run with original assertions intact against a read-only oracle ("never edit the upstream oracle checkout") [Verified]; mandatory counterexample suite with 9 named regression tests tied to optimizer legality statements + ablation measurements [Verified]; performance program with R0/R1/R2 references, frozen protocols, log-space aggregation, paired bootstrap [Verified].
- **Dialectical review (two models against each other)**: [Absent] — no mention of two-model review, fresh-eyes-as-agents, grader loops, or swarm review anywhere in plan, AGENTS.md, or README. The plan mentions only its own human-revision history: "The initial source review and this fresh-eyes revision" (v1.1, v2.0) in §23 — maintainer prose, a one-shot revision, not an agent process.
- **Drift prevention**: AGENTS.md RULE 2 — "NO GIT BRANCHES. NO GIT WORKTREES. EVER." — agents coordinate via MCP Agent Mail file reservations ("Reservations are advisory, but in this project they are the isolation mechanism. They replace branches and worktrees.") [Verified]; RULE 1 no file deletion without express permission; "No script-based code changes" (no broad regex rewrites) [Verified]; RULE 0 "THE FUNDAMENTAL OVERRIDE PREROGATIVE" — the maintainer can override anything, and "When this file and the plan disagree on a technical rule, **the plan wins** and you should flag the discrepancy" [Verified].

## 5. State-of-the-art coverage

- **Plan §23 "Source register"** [Verified]: a tabular register of inspected sources (Three.js r186 release identity, tag object, WebGPURenderer docs, Khronos WebGL 2 spec, package manifest, etc.), all "inspected on September 9, 2026" — with the explicit caveat: "The initial source review and this fresh-eyes revision did **not** compile these libraries, run the Three.js suite, measure the target devices, or establish any FrankenThreeD performance result." [Maintainer claim, quoted verbatim]
- **SOTA-as-baseline mechanism**: R2 reference is "an equivalent current Three.js WebGPU implementation" that the candidate must beat; README FAQ: "Why not just use the Three.js WebGPU renderer? You should — it is one of the required baselines." [Maintainer claim, quoted]
- **Competitor/literature scan**: [Absent] — no research/ dir, no competitor comparison doc, no literature review phase. SOTA coverage is entirely "the upstream itself as oracle + baseline" rather than a literature survey. Plan §2.1 notes "Three.js is already more modern than the motivating critique suggests" — a design audit correcting the thesis against the upstream [Verified].

## 6. Anti-satisficing

- **Falsifiability by design**: README states "The plan is deliberately written to be falsifiable. It specifies kill gates that can stop this project early, and it says so explicitly." [Maintainer claim, quoted]; PLAN §20 is a 20-row risk table ("Earliest decisive test" + "Response if it fails"), e.g. "If H1 is not viable against its competent reference, **do not substitute an easier toy** — reopen the project decision" [Verified].
- **Mandatory counterexample suite**: 9 named counterexamples (red-A/blue-B queue-write snapshot, bundle-then-direct state reset, upload-range stale-byte gap fill, etc.) "part of the **measured optimized path**, never disabled in benchmark mode" [Verified].
- **Corpus anti-cherry-picking**: §15.6 "Selection cannot become cherry-picking"; §16 gates: "A candidate failure is a failed cell, not an excluded cell... failures never shrink the denominator"; "An unfavorable valid run is not an infrastructure failure" [Verified]. H7/H8 modern-compute cases "prevent the suite from consisting only of legacy object-submission bottlenecks... That difficulty is part of the go/no-go test."
- **Red-team / falsification campaigns / red-team docs**: [Absent]. The red-A/blue-B tests are regression counterexamples, not a red-team process; there is no named falsification campaign artifact.

## 7. Explicit absences

- No `docs/planning/` directory, no `ROADMAP.md`, `TODO.md`, `PLAN.md`, `BEADS.md`, `CLAUDE.md`, `MUSE.md`, `.muse/` directory, no ADRs, no `docs/research/` [Absent — verified by listing]
- No dialectical two-model review process, no grader loops, no cross-check layer [Absent]
- No negative-evidence ledger, claim matrix, auto-demotion rules, receipt-bound evidence artifacts [Absent]
- No session-compaction rules or anti-compaction doctrine [Absent] (Bead schema has a `compaction_level` field, suggesting the concept exists elsewhere in the Beads ecosystem, but no doctrine here)
- No "Agent Mail" artifacts in-repo (it is an MCP service, described but with no local records) [Absent]
- No test-only-evidence retention beyond the KEEP/ spec; no evidence dashboard or schema-validators yet — and building them early is explicitly forbidden as "process porn" (see §8)

## 8. Maturity verdict

**Mature — but deliberately anti-process.** This is the most developed *planning philosophy* document in the suite observed so far: a ~28k-word technical constitution with 23 sections, a 7.5k-word agent operating contract, quantified kill gates, a 20-row risk register with kill-responses, and an honesty architecture (four-promises rule, no-cut rule, mandatory counterexamples, dependency admission ledger with charged line-budget accounting) that is more adversarial toward the project's own success claims than anything found in sibling repos. Its distinctive move is *constraint as method*: AGENTS.md RULE 0.1 ("VALUE DELIVERY OVER PROCESS: NO PROCESS PORN") explicitly forbids agents from building the meta-infrastructure (validators-of-validators, dashboards, evidence pipelines) that the FrankenSuite's own research program treats as maturity markers — because for this repo, the only gate that matters is the Phase 0 foundation gate ("which is the only thing that can tell us whether this project should exist at all"). The plan is plan-first *instead of* process-heavy: Beads track 219 tasks (202 still open) and every gate is a physical-execution or measurement gate, never a paperwork gate. Thin only in the dialectical layer (no two-model review, no red-team, no claim-matrix/demotion machinery) — those honesty functions are served here by immutable rules and physical oracles rather than process layers.

---
*Report written 2026-09-22 from shallow clone of Dicklesworthstone/franken_threed. All quotes verbatim; tier tags inline.*
