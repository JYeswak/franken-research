# franken_remote — Planning-Methodology Analysis

**Repo:** `Dicklesworthstone/franken_remote` (remote-workstation suite; cloned depth-1, 2026-09-22; HEAD `bf9151d`, 2026-09-22)
**Subject:** HOW Jeffrey Emanuel PLANS — the planning method, not the product.
**Tier legend:** [Verified] = read in a repo file · [Maintainer claim] = his prose, quoted · [Inference] = analyst inference · [Absent] = explicitly not found.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKENREMOTE.md` | The constitution | 27-section, 1439-line normative master plan (v1.4): decisions, boundaries, protocol shape, budgets, 6 implementation phases with exit gates, verification matrix, 50-source provenance ledger with an integrated review record. |
| `AGENTS.md` | Normative agent contract | Binding operating instructions for humans and coding agents: constitutional hierarchy, construction rules, change workflow, quality gates, review checklist, stop conditions, Beads usage, session landing. |
| `IMPLEMENTATION_STATUS.md` | Revision-bound evidence log | Records what is actually implemented with exact source commits, gate results, and **explicitly retained negative evidence**; updated 2026-09-08. |
| `docs/verification-lanes.md` | Audit contract | Defines `scripts/verify.sh` lanes (fast/docs/per-crate/count/audit/test-fixtures/full/release) incl. planted-negative-fixture proofs and over-budget/audit refusals. |
| `docs/decisions/` (4 ADRs + README) | Architecture decision records | `0001` FFmpeg binding family, `0002` desktop windowing shell, `0003` mobile FFI mechanism, `0004` software-encoder profile — each with decision, evidence rows, rejected alternatives, revisit condition. |
| `.beads/` (`issues.jsonl`, 106 issues; `config.yaml`; `metadata.json`) | Dependency-aware task tracker | beads_rust (`br`) issue DB, issue prefix `fr`, tracked in git. 74/106 issues carry dependency edges; 22 carry acceptance criteria. |
| Root `*.md` (~100 CAPS_SNAKE files: `PROTOCOL_*.md`, `NATIVE_*.md`, `HOST_*.md`, …) | Per-subsystem spec sheets | One normative-ish spec per subsystem, each documenting the design, bounds, and verification of one slice; treated as contracts the implementation must satisfy. |
| `docs/native-discovery.md`, `native-display-inventory.md`, `native-display-picker.md`, `native-input-cleanup.md`, `native-viewer-window.md`, `native-client-cli.md` | Per-feature qualification briefs | Documents that record the design, bounds, and what verification was actually run (and what it does *not* prove). |
| `docs/linux-compositor-qualification.md`, `docs/windows-host-qualification.md`, `docs/software-encoder-evaluation.md` | Platform/component qualification docs | Phase 0–style qualification evidence, per target. |
| `spikes/` (8 spike dirs with `results/`) | Reproducible risk-retirement experiments | Phase 0 experiments with retained logs/artifacts: `quic-native`, `webtransport`, `browser-hevc`, `media-linux/-macos/-windows`, `tailnet-identity`, `os-lifecycle`, `virtual-mic-*`. |
| `results/latest/result.json` | Retained machine-readable evidence | WebTransport browser interop scenario results (2026-09-20): happy path + origin-rejection, with client ALPN, draft, origin verdicts. |
| `CHANGELOG.md` | Incremental slice log | Commit-level narrative of each landed slice and which spec doc records its evidence. |
| `scripts/verify.sh` + `scripts/count.py`, `audit.py` | Self-enforcing verification | Repository-owned commands that enforce AGENTS.md §§3/10 and plan §§20.3/22.2: budget counting, dependency/memory-safety audit, docs checks. |
| `README.md` | Descriptive overview | States explicitly it is descriptive, never normative (AGENTS.md §2: "the README, which is descriptive, never normative"). |
| `SECURITY.md` | Threat reporting policy | Security reporting policy; plan §19 carries the threat model. |
| `IMPLEMENTATION_STATUS.md` (as practice) | Negative-evidence practice | Failed/superseded runs are retained and labeled, not deleted or relabeled as passing. No separate ledger file exists. |

[Verified] All rows above confirmed by directory listing and file reads. `docs/` contains only `decisions/` plus 10 docs — there is **no `docs/planning/` directory** [Absent] (see §7).

---

## 2. Execution-readiness gates (what a plan must pass before agents are set free)

The gating mechanism is explicit, multi-layered, and document-centric rather than session-centric:

**A. Constitutional hierarchy (AGENTS.md §2, [Verified]):**
> "Before a material change, read the relevant portions of, in order of authority: 1. `COMPREHENSIVE_PLAN_FOR_THE_DESIGN_OF_FRANKENREMOTE.md` — version 1.4; the review corrections in §1 and §27.1 are binding requirements, not commentary; 2. `PROTOCOL.md` — normative v0-draft under plan §17; implementation and the independent-interoperability freeze gate remain outstanding; 3. `SECURITY.md` and the threat model in plan §19; 4. this file; 5. the README, which is descriptive, never normative."

**B. Phase-gated implementation sequence (plan §23, [Verified]).** Six phases, each with a named exit gate. Phase 0 ("Retire the architectural risks") gates the whole program: "Work in small real vertical experiments, not a large scaffold. Every experiment produces a reproducible command, exact hardware/software identity, result, and retained failure reason." Representative gate rows: the native-media gate requires "Actual capture -> hardware HEVC -> hardware decode -> presentation on Apple Silicon and a Windows/Linux GPU path" or "Revisit surface interop/backend choice before building the GUI around it"; the browser-transport gate warns "A queued adapter or self-loopback is not interoperability; label WSS as degraded and publish the tested H3 draft/profile." Phase 1 exit gate: "an actual interactive session survives worker restart, network interruption, client focus loss, stale-view/input-ticket expiry, and display resize without stale authority or a growing queue… A mock codec does not satisfy this gate." Phase 5 exit gate: "signed installation artifacts reproduce the tested behavior; unsupported states fail specifically; no performance claim outruns the retained evidence." An optional extension lane "opens only after the core is useful… Each has a bounded budget and an independent off switch. None is allowed to hold the baseline architecture hostage."

**C. Machine-enforced verification lanes (AGENTS.md §10 + `docs/verification-lanes.md`, [Verified]):**
> "`cargo test` is a hard gate: it must exit `0` before any change is handed off. If a check fails, fix root causes before handing off." — AGENTS.md §10

The release lane is a "Typed refusal until signed native artifacts and qualification matrix are complete" (`docs/verification-lanes.md` §1, [Verified]).

**D. Per-change workflow (AGENTS.md §9, [Verified]):** for every material change: identify owning plan section/invariant/crate boundary → read plan sections and cited sources → state final abstraction and rejected shortcuts → write golden fixtures first → smallest complete vertical slice → add success, refusal, cancellation, crash/retry, resource-bound, adversarial, and generation-fencing tests → update docs/capability tables, record negative evidence for disproven approaches → run verification gates → inspect complete diff.

**E. Evidence categories as a gate (AGENTS.md §7, [Verified]):** "Evidence categories are separate and non-fungible: source reviewed / builds passed / simulated properties passed / independent wire interoperability passed / hardware measurements passed. A capability row is `passed`, `failed`, `blocked`, or `not tested`; an untested row is never 'supported with caveats.'" Plan §27.1 adds the honest-scoping clause: "New tests are future implementation gates, not represented as performed; source review is not hardware or wire qualification."

[Inference] The execution-readiness model here is **document-gated + machine-gated**: phases gate on experiments, lanes gate on commands, and the plan text itself is the spec of proof required. It is not process-gated (no multi-model sign-off step exists anywhere in the repo).

---

## 3. Honesty guardrails (negative evidence / claim matrices / demotion)

**What exists:** a pervasive, prose-level honesty discipline, installed at the program's start and continuously exercised — not a bolt-on at some lifecycle milestone.

- **No-proposal-as-implemented rule (AGENTS.md §7, [Verified]):** "Do not describe a proposal as implemented. The entire plan is proposals; the README repeats this. As slices land, true documents up in place with revision-bound evidence."
- **Retained negative evidence (IMPLEMENTATION_STATUS.md, [Verified]):** failed runs are kept and labeled, never deleted. Verbatim: "An earlier mutable-checkout run returned four successful Cargo exits but changed source during execution; it is indeterminate as a combined revision-bound gate. It remains retained negative evidence, superseded by the detached run above." Also: "The `8f501c0` full native-workspace rerun… completed successfully… The earlier failed run remains negative evidence rather than being relabeled as passing."
- **Negative-fixture proofs in CI (`docs/verification-lanes.md` §4, [Verified]):** automated tests plant over-budget Rust/glue fixtures, `unsafe` usage in safe crates, missing `forbid(unsafe_code)`, desktop FFI in browser targets, and forbidden runtimes, and require the verification lanes to emit `OVER_BUDGET_REFUSAL`/`AUDIT_REFUSAL` (exit 1) — the guardrails are proven by *their own negative-detection tests*.
- **Claim matrices exist as capability rows, not a single matrix file:** plan §24 + README verification discipline define the `passed/failed/blocked/not tested` row semantics; each feature spec doc states what its evidence does *not* prove (e.g. `docs/native-discovery.md`: "These are adapter results, not installed-Tailscale version qualification or live tailnet/desktop availability evidence."). [Verified]
- **Anti-satisficing "forbidden" list (AGENTS.md §§7–8, [Verified]):** "Forbidden: faked tests, fixtures/mocks presented as live proof, weakened assertions, golden regeneration to force green, hard-coded success paths, `todo!()`/`unimplemented!()` in commits, editing a spec or gate instead of implementing it, narrowing scope while claiming full success, splitting work to harvest closures." AGENTS.md §8: "A mock codec explicitly does not satisfy the Phase 1 gate"; forbidden substitutes include "a loopback transport adapter presented as QUIC/WebTransport interoperability evidence" and "a manually-advanced handshake test presented as TLS/security qualification."
- **Required explicit limits:** "Truthful null results and explicit blocked reports naming the exact missing thing are successful outcomes. Unsupported claims are worse than silence. Never silence stderr in an evidence-bearing command." (AGENTS.md §7, [Verified])

**No auto-demotion rules exist:** [Absent] — nothing in the plan, AGENTS.md, beads DB, or verification docs describes an automatic demotion mechanism when evidence fails. Demotion is manual (typed refusals, blocked lane results). The closest equivalent is that gates *stay closed*: IMPLEMENTATION_STATUS.md opens with "No application or live-transport/hardware phase gate is declared complete by the tests below."

[Inference] Honesty here is enforced by *prose discipline plus machine refusals*, not by a formal ledger/demotion state machine.

---

## 4. Plan→agent execution (task graphs, phases, verification loops, drift prevention)

- **Task graphs:** the `.beads/` database is the executable task graph. [Verified] 106 issues (`fr-*` prefix), 74 carry explicit dependency edges (`blocks`/`depends_on`), 22 carry `acceptance_criteria` (checkbox lists, e.g. extension-lane features like `fr-ext-444-precision-sf0`). Types: 59 feature, 25 task, 9 bug, 6 epic, 4 docs, 3 chore. Statuses at HEAD: 82 closed, 23 open, 1 in_progress. Open beads cluster on the future: Phase 3 browser/mobile qualification and Phase 4/extension-lane work (e.g. `fr-p3-browser-qualification-hf1`, `fr-p4-controller-tuning-kyo`). The AGENTS.md §14 section mandates claiming discipline: "Claim only IDs present in `br ready --unassigned --no-db --json`; a graph score or recommendation is never authorization."
- **Phases:** the six-phase plan sequence (§23) plus per-feature spec docs; implementation moves through "small real vertical experiments" and "one real vertical slice of its final abstraction" (AGENTS.md §8), never scaffolds.
- **Verification loops:** two nested loops — per-change: docs-first (golden fixtures) → implement → test dimensions → update docs + capability tables → run lanes → diff inspection (AGENTS.md §9); per-session: "Landing the Plane" (AGENTS.md §15) requires filing beads for remaining work, running gates, updating issue status, `br sync --flush-only` + `git add .beads/`, and a handoff naming what changed, exact source commit, gates actually run and results, remaining risks/gaps, and next claimable item: "A handoff that skips these is not a handoff."
- **Drift prevention:** multiple layers. (1) Stop conditions (AGENTS.md §13) — 11 conditions where agents "stop and escalate instead of improvising," including "documents contradict one another," "required evidence cannot be produced, or a gate would be edited instead of satisfied," and "a required Phase 0 experiment is being assumed instead of run." (2) Review checklist (AGENTS.md §12) — 9 reviewer questions, including "Does any claim (support, latency, freshness, 'zero-copy') outrun the retained evidence category?" (3) The planted negative fixtures (§4 of `docs/verification-lanes.md`) prove the lane catches drift. (4) The AGENTS.md §13 closing line: "The correct outcome may be a typed refusal, a plan amendment proposal, or a negative-evidence record. It is never silent architectural drift."
- **Dialectical review:** [Absent] — the plan (§27) describes a full document reread-and-revision ("Version 1.1 resolves errors and under-specified boundaries… the entire 27-section document was reread and revised in place"), and AGENTS.md §14/§15 imply review discipline, but **no two-model dialectic, no model-vs-model process, and no second-model sign-off is documented anywhere in the repo.** The one review-by-model mention is in README.md's contributions policy: "I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them" — this is about incoming bug reports/PRs, [Maintainer claim] quoted, not a planning-method mechanism. The plan text itself is single-author (with "StormyRidge / FrankenRemote Team" listed as ADR author). No "never lets sessions compact" instruction appears. [Absent]

---

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

- **Research provenance ledger (plan §27 + §27.2, [Verified]):** 50 pinned references `[S1]–[S50]` (Asupersync source at commit `bf6b361deb3154c56d1450ea679e6d4a3cbf09b9`, W3C WebCodecs/WebTransport specs, RFC 9000/9221/9297, Tailscale LocalAPI docs, Apple ScreenCaptureKit, DXGI docs, x265/FFmpeg/OxideAV docs, Sunshine docs as "relevant existing hardware-streaming baseline" [S30], XDG portal docs). The ledger explicitly limits what the research certifies: "The review did not compile the repositories, execute native hardware benchmarks, test a live FrankenRemote session, or validate release artifacts. Performance objectives, line budgets, adapter choices, and protocol limits are proposals." And: "an implementation must pin its chosen dependency/specification versions and repeat capability checks rather than treating this reference list as permanent certification."
- **Suite-reuse findings (plan §4, [Verified]):** "Findings from the FrankenSuite source inspection" — Asupersync qualification boundaries, FrankenTerm reuse, FrankenGit "borrow rigor, not administrative mass" — with pinned commit hashes.
- **Competitor/literature coverage:** thin beyond the one baseline (Sunshine) and the FrankenSuite internals. [Inference] The research mechanism is *source-and-spec inspection pinned to commits*, not a literature scan.
- **Per-feature briefs as research closure:** each ADR's "Evidence Rows" section (ADR 0001 §3 cites FFmpeg 7.1.5 GPG-signature-verified source, deterministic SHA-256 builds, hardware decode probes under Xvfb) and each qualification doc (`linux-compositor-qualification.md`, `software-encoder-evaluation.md`, `windows-host-qualification.md`) close the loop between plan §25's "bounded open decisions" and empirical results.
- **ADRs as state-of-the-art-to-decision bridge:** the decisions README mandates each ADR document "the evidence rows it rests on (reproducible measurements, spike implementations, and test manifests)" plus "the revisit condition defining when and how the choice may be re-evaluated." ADR 0001 quotes and then overrides the plan's default: it rejects the plan's assumed `ffmpeg-sys-next` family in favor of "a project-owned, minimal C ABI shim" — evidence trumped the plan's first draft, which is the revisit mechanism working as designed. [Verified]

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

- **Falsification via typed refusals:** pervasive and concrete — "Missing or ambiguous membership evidence is a typed refusal (`tailnet_membership_unverifiable`), not permission to weaken policy" (AGENTS.md §3.4); "Where a host OS's endpoint cannot be qualified, microphone forwarding is a typed unsupported capability on that host, never a silent fake device" (plan §15.4). [Verified]
- **Adversarial test dimensions, not red-team campaigns:** AGENTS.md §9(6) mandates "adversarial" tests as a test dimension alongside cancellation/crash/retry; plan §24.3 enumerates security tests (forged sources, origin attacks, hostile HEVC parameter sets, replayed tickets). [Verified] But **no standalone red-team campaign, no falsification campaign docs, no anti-satisficing "campaign" mechanism exists in the repo.** [Absent]
- **Single-byte mutation sweep as bounded adversarial testing:** IMPLEMENTATION_STATUS.md notes "The single-byte mutation sweep is bounded adversarial testing, not a coverage-guided fuzz campaign or independent-peer interoperability." [Verified]
- **The honest-claims rules as the anti-satisficing floor:** the AGENTS.md §7/§8 "forbidden" lists plus the "editing a spec or gate instead of implementing it" prohibition are the anti-satisficing enforcement. [Verified]
- **Size discipline as an anti-bloat mechanism:** 194k target / 240k planned max / hard stop below 250k handwritten Rust lines, machine-enforced (`OVER_BUDGET_REFUSAL`, exit 1), with "The counting method is never redefined near the end" (AGENTS.md §3.7; plan §22.2; README). [Verified]

---

## 7. Explicit absences

All checked for and not found [Absent]:

- **`docs/planning/` directory** — planning lives at repo root + `docs/`, not in a dedicated planning dir.
- **`ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`** — none exist. The roadmap function is absorbed by the comprehensive plan §23 + `.beads/` + `IMPLEMENTATION_STATUS.md`.
- **`CLAUDE.md`, `MUSE.md`, `.muse/`** — none. `AGENTS.md` alone is the agent contract.
- **`research/` directory** — research artifacts are the §27 provenance ledger, `spikes/`, qualification docs, and ADRs; no separate research phase folder.
- **Negative-evidence ledger file** — negative evidence is embedded in `IMPLEMENTATION_STATUS.md` prose, not a standalone ledger.
- **Claim matrix file** — capability-row semantics exist (plan §24; per-feature docs), but no single consolidated claim-matrix document.
- **Auto-demotion rules** — no automatic evidence demotion mechanism.
- **Dialectical two-model review process** — no documented model-vs-model planning review; the "reread and revised" review (§27) is not attributed to a second model.
- **"Never compact sessions" instruction** — not present.
- **Red-team / falsification campaign mechanisms** — adversarial testing exists only as a test dimension, not as a campaign.
- **Definition-of-done file** — the definition of done is plan §26 plus phase exit gates; no separate `DEFINITION_OF_DONE.md`.

---

## 8. Maturity verdict

**Mature.** [Inference, grounded on all above]

franken_remote's planning method is the most elaborated of any planning system examined in this program: a 27-section normative master plan with its own integrated review record, a constitutionally-ranked agent contract with 11 stop conditions, 6 phase exit gates, 8 machine-enforced verification lanes (including planted negative fixtures that *prove the guardrails catch drift*), 4 ADRs with evidence rows and revisit conditions, a 106-issue dependency-aware bead graph, per-subsystem spec sheets (~100), and a revision-bound implementation status log that retains negative evidence. Honesty guardrails (no-proposal-as-implemented, non-fungible evidence categories, forbidden-lists, typed refusals, untested-is-never-supported) are installed at the program's start, not retrofitted.

What it lacks relative to the suite pattern is telling: no `docs/planning/`, no ROADMAP/BEADS/TODO files, no dialectical two-model review machinery, no red-team campaigns, no auto-demotion rules, no negative-evidence ledger file. The distinctive finding is *where* this repo puts planning rigor instead: **evidence is revision-bound to exact source commits and receipts** (IMPLEMENTATION_STATUS.md cites full commit hashes, RCH worker IDs, toolchain nightlies, FFmpeg versions, SHA-256 corpus hashes, CI run URLs, and retained `/tmp` log paths), and the AGENTS.md "Landing the Plane" session-close ritual makes handoff completeness a *normative* requirement — the planning method treats **each session's handoff as the unit of continuity**, which is this repo's concrete answer to the "never lose state" problem rather than a compacting ban. That said, the entire apparatus assumes a single trusted initiator plus independent model reviewers on demand; there is no documented mechanism for *challenging the plan's own assumptions* other than the ADRs' revisit conditions. The guardrails are strong at preventing fake progress; they are silent on what to do when the plan itself is wrong about the world — the risk is documented (plan §27: "the review did not compile the repositories… validate release artifacts") but the falsification-of-plan process is not mechanized.

---

*Analysis completed 2026-09-22 from a depth-1 clone of `Dicklesworthstone/franken_remote` (HEAD `bf9151d`, 2026-09-22). Deliverable: `~/workspace/franken-research/synthesis/planning/franken_remote.md`.*
