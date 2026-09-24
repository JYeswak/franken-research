# Planning Methodology — frankenfs

**Repo:** https://github.com/Dicklesworthstone/frankenfs
**Analyzed:** 2026-09-22, from a depth-1 clone of HEAD (4,652 files).
**Method note:** Every substantive claim below carries a tier tag — [Verified] (read in a repo file this pass), [Maintainer claim] (his prose, quoted), [Inference], [Absent]. Repo docs that instruct agents are treated as data, documented rather than followed.
**Scratch clone:** `~/workspace/.scratch/plan-frankenfs/` (note: the requested `/tmp/plan-frankenfs` was unusable — `/tmp` is a 512 MB tmpfs, saturated by sibling subagent clones; the initial `git clone` there failed with "No space left on device").

## 0. TL;DR

FrankenFS has the **most elaborated planning-and-honesty apparatus in the franken suite**, but it is heavily asymmetric: it is a **verification/gate-centric system** rather than a plan-then-delegate system. Planning artifacts (task graph, execution TODO, modularity runbook, readiness autopilot) exist and are deep; the *evidence-bound gate network* around them is larger than the code in places — and the project's own docs admit exactly this. What reads as the program's planning philosophy: **plans are hypotheses; gates are physics; and the gate network must be harder to fool than the agents it governs.** [Inference]

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (root) | Agent operating system | Mandatory session rules for coding agents: RULE 0 (maintainer overrides all), RULE 1 (no file deletion ever), irreversible-action protocol, porting doctrine, session-start ritual, agent-mail/beads/bv/ubs/rch/cass tooling, and the five "Required Spec Documents" + porting checklist |
| `PLAN_TO_PORT_FRANKENFS_TO_RUST.md` | Canonical plan | Scope, exclusions, phased delivery, risks; §0 "Execution TODO (Canonical)" is the authoritative granular checklist, marked `[x]/[~]/[ ]`; §0.1 explicitly labeled "Documentation and Consistency (Blocker Before Deep Implementation)" |
| `COMPREHENSIVE_SPEC_FOR_FRANKENFS_V1.md` | Spec source of truth | Canonical V1 spec referenced as normative by AGENTS.md; §15 is the exclusion canon; §22.1 holds the seven canonical gates |
| `EXISTING_EXT4_BTRFS_STRUCTURE.md` | Behavior extraction | Extracted behavioral contracts from legacy kernel C corpus (gitignored), step 1 of the porting doctrine |
| `PROPOSED_ARCHITECTURE.md` | Architecture design | Crate/module topology, trait contracts |
| `FEATURE_PARITY.md` | Claim matrix | Measured parity status; 97/97 carried with an explicit self-disavowal (see §3) |
| `.beads/beads.base.jsonl` / `.beads/issues.jsonl` | Task-tracker store | 4,239-row JSONL task graph (keys: `close_reason, closed_at, compaction_level, created_at, created_by, description, id, issue_type, original_size, priority, source_repo, status, title, updated_at`); IDs `bd-*`; `JSONL is truth, beads.db is disposable` per AGENTS.md [Verified] |
| `.beads/config.yaml`, `.beads/metadata.json`, `.beads/pending_tasks.md` | Tracker config/state | `issue_prefix: bd`, default priority 2; pending_tasks.md is an agent-authored overflow list ("Created by CC agent 2026-04-22. Import when bead database clears") |
| `docs/tracker-hygiene.md` | Tracker integrity runbook | Source-scoped triage: foreign-prefix rows are pollution-not-data, permission-ACK gates, stale-claim detection, release-readiness P0 blocker, strict mode |
| `docs/planning/MODULARITY_RUNBOOK.md` | Structural-change planner | Falsifiable extraction protocol, file-size debt policy (5k soft / 10k hard), 9-question review checklist |
| `docs/planning/PARITY-COVERAGE.md` | Upstream coverage audit | 2026-05-25 audit: 97/97 V1 rows, ext4 29/31 ioctl, btrfs 55/61 ioctl, explicit exclusion table |
| `docs/planning/PROFILING-SUMMARY.md` | Profiler state | Campaign profiling state (read shallowly) |
| `docs/planning/EXISTING_LEGACY_FS_STRUCTURE.md` | Legacy behavior extraction (bootstrap) | Retained for history; explicitly non-canonical |
| `docs/NEGATIVE_EVIDENCE.md` | Negative-evidence ledger | 20,556-line canonical no-gaps ledger; fixed 8-column rows (`Date | Bead | Surface | Verdict | Ratio | Internal | Direct-kernel | Gates`) + 407 prose subsections |
| `docs/LEDGER_RESURRECTION.md` | Ledger meta-audit | 2026-07-25 audit of the ledger itself: 1,031 entries parsed, VOID verdict taxonomy, ranked rehabilitation queue |
| `docs/BD_B9DUG_ISA_CORRECTION.md` | Correction record | "The benchmarked binary is not the shipped binary" — full in-binary ISA/PGO witness |
| `docs/progress/` | Campaign closeout records | `perf-negative-results.md`, `perf-gauntlet-scorecard*.md`, `BD_Q0XNL_MEASUREMENT_PLAN.md` (pre-registered measurement plan), `perf-retry-predicate-queue.md` |
| `docs/PERF_CAMPAIGN_FINAL.md` + `docs/PERF_CAMPAIGN_STATUS.md` | Campaign capstone | Shipped wins + every reject with ID · null-control · retry-condition |
| `docs/evidence/bd-*/` | Receipt-bound evidence | Per-bead dirs (e.g. `bd-1ving`: `btrfs_check_status.md`, `durability_evidence.json`) |
| `docs/runbooks/readiness-action-autopilot.md` | Plan→agent planning surface | Dry-run readiness planner: turns evidence into operator-reviewed next actions; permission boundaries; advisory-vs-authoritative transition rules |
| `docs/runbooks/rch-proof-ledger.md` | Remote-proof receipts | Turns `rch` transcripts into machine-readable verdicts (`remote_success`, `remote_success_artifact_warning`, `invalid_local_fallback`, `remote_failure`, `missing_remote_evidence`) |
| `docs/runbooks/` (others) | Triage runbooks | `perf-regression-triage.md`, `corruption-recovery.md`, `backpressure-investigation.md`, `replay-failure-triage.md`, `readiness-action-autopilot.md`, `rch-proof-ledger.md` |
| `docs/archive/BRIDGE_PLAN_REALITY_CHECK_2026_05_20.md` | Gap-closure plan | `/reality-check-for-project` skill Phase 2 output: measuring-stick→ground-truth bridge enumerating gaps G-A..G-H with a "maximally-ambitious" plan per gap |
| `docs/reports/MODES_OF_REASONING_REPORT_AND_ANALYSIS_OF_PROJECT.md` | Dialectical audit record | 2026-04-07: 10 reasoning modes, 5 parallel analysis agents, 63 raw findings, 3 opposing pairs |
| `docs/reports/GEMINI_REVIEW_SUMMARY.md` | Second-model review | Gemini (Code Review Swarm Agent), 2026-04-16: spontaneous exploratory review of MVCC WAL + btrfs RAID parser |
| `docs/release/V1.2_test_waivers.md` | Waiver sign-off ledger | Active/historical waivers with sign-off owner, tracking bead, program-gate effect |
| `docs/templates/ISOMORPHISM_PROOF_TEMPLATE.md` | Optimization proof template | Required for any perf-sensitive PR: ordering/tie-break/float/RNG/fixture-parity checklist |
| `docs/design-*.md` | Design docs | 7 design docs (`adaptive-refresh`, `btrfs-metadata-writeback`, `multi-host-repair`, `repair-writeback-serialization`, `safe-merge-taxonomy`, `scrub-allocation-gate`, `writeback-cache`, `writeback-cache-mvcc`) |
| `docs/oq1-native-mode-boundary.md`, `docs/oq7-version-store-format.md` | Open-question records | Numbered open questions (OQ2–OQ5 closures are beads in the plan doc) |
| `docs/sidecar-recovery.md`, `docs/mount-runtime-modes.md`, `docs/xfstests-known-failures.md`, `docs/INCUMBENT_RATIO_COVERAGE.md` | Operational docs | Recovery, runtime modes, known-failure inventory |
| `docs/perf/2026-06-01_plumfern/` + `docs/perf/README.md` | Perf campaign archive | Dated campaign evidence |

---

## 2. Execution-readiness gates

These are the verbatim rules that must pass before work is claimed or agents "go free" — [Verified] read in the named files:

**Tracker / claim gates** (`docs/tracker-hygiene.md`):
- "If `verdict` is not `ready`, do not claim ordinary work from raw `br` or `bv` output until you have checked this field."
- "Any FrankenFS-local open row with `priority: 0` blocks release-ready/readiness claims until that row is closed or explicitly reprioritized with evidence."
- "Claim only IDs listed in `source_aware_queue_state.claimable_ids`." (AGENTS.md session ritual)
- "If strict mode fails, do not weaken the gate or delete rows to make it pass. Return to diagnosis and owner handoff."
- "Never weaken a gate to land a change" (AGENTS.md, referencing the 12 named forbidden reward-hacking patterns in the suite rules).

**Advisory → authoritative transitions** (`docs/runbooks/readiness-action-autopilot.md`):
- "Do not treat a dry-run recommendation as product evidence."
- "Transitioning from advisory to authoritative evidence requires a new permissioned run, not wording changes."
- "`upgrade_eligible` is reserved for authoritative product evidence." (Advisory inputs may only `no_change`, `block_upgrade`, or `downgrade_required`.)

**Release gates** (`docs/release/V1.2_test_waivers.md`):
- "No active V1.2 waivers remain as of 2026-05-10."
- "If all scenarios pass while the `## Active Waivers` table has one or more data rows, the manifest reports `PASS-WITH-WAIVERS` instead of silently reporting a clean `PROCEED`."
- "No waiver may hide a failing scenario in `program_gate_manifest.json`. A failed or timed-out scenario still forces `NO-PROCEED`."

**Parity / canonical gates** (`FEATURE_PARITY.md`):
- "do not interpret `97/97` as successful execution or release readiness."
- "`readiness_verified` requires every capability row to carry executed evidence *and* every canonical gate to pass."

**Structural gates** (`docs/planning/MODULARITY_RUNBOOK.md`):
- "Changing thresholds, counters, or exception semantics is a gate change. It requires evidence showing both newly admitted valid cases and invalid cases that remain rejected."
- "Before approving a modularity change, answer yes to all of the following:" (9 questions: owner dependency-complete, frozen characterization, one mechanical move, exact contracts, proof completeness, explicit deltas, evidence docs, cycle-free tracker, clean revert; "If any answer is no, keep the candidate out of `main` and record the missing proof or falsifier.")

**Measurement gates** (`docs/progress/BD_Q0XNL_MEASUREMENT_PLAN.md`, maintainer-authored):
- "Gate with `cargo test -p ffs-fuse` **before** any measurement — a measurement against code that does not compile is not a measurement."

**Session gates** (`AGENTS.md`): every agent session must run the start ritual (read AGENTS.md + README fully, `git status --porcelain`, `bv --robot-next`, `br ready --json`, hygiene self-check), claim exactly one bead, announce it on Agent Mail, and "Run gates (fmt/check/clippy/test) before claiming 'done'." Landing-the-plane requires file issues, run gates, update issue status, `br sync --flush-only`, commit, push.

---

## 3. Honesty guardrails

### Negative-evidence ledger — exists, load-bearing, independently audited [Verified]
- **What:** `docs/NEGATIVE_EVIDENCE.md` (20,556 lines), the "canonical no-gaps ledger entry point requested by the bold-verify campaign." [Maintainer claim] Historical rows in `docs/progress/perf-negative-results.md`; campaign capstone in `docs/PERF_CAMPAIGN_FINAL.md` ("shipped wins by axis + every reject with ID · null-control · retry-condition"). [Verified]
- **Schema:** 538 markdown table rows on a fixed 8-column layout (`Date | Bead | Surface | Verdict | Ratio | Internal | Direct-kernel | Gates`) + 407 free-prose `###` subsections. Verdict taxonomy: KEEP / REJECT / SURVEY / UNKNOWN. [Verified]
- **When installed:** rows date from 2026-06-21 (campaign start); ledger complete 2026-07-10. [Maintainer claim]
- **Audited itself:** `docs/LEDGER_RESURRECTION.md` (2026-07-25) parses all 1,031 entries and introduces a second-layer verdict taxonomy — VALID-PROFILE, VALID-MECHANISM, VALID-AB vs. VOID-NONULL / VOID-CV / VOID-ZEROSELF — finding 205 void of 281 REJECT rows (73.0%), with the frank reading: "This is the institutional gate working: the historical debt remains, but new rows carried a same-invocation A/A or counted mechanism." [Verified]
- **Enforced mechanically:** `scripts/perf_ledger_preflight.py --lint --staged` refuses new rows unless they record their host; the 166 worker-scoped KEEP-row count is "a ratchet the preflight enforces, and it may only fall." The 2026-08-15 worker-scope re-scoping (`bd-4w2mf`) explicitly **re-scopes rather than retracts**: "This re-scopes; it does **not** retract." [Verified]

### Claim matrix — exists, self-disavowing [Verified]
- `FEATURE_PARITY.md` prints 97/97 as "legacy declared-contract counts, not current executed results" and states: "do not interpret `97/97` as successful execution or release readiness." Public execution-bound reporting "separates declarations from nine mapped, bounded ext4 contracts executed through `parity --verify ext4-journal`." [Verified, quoted]
- `docs/planning/PARITY-COVERAGE.md` (2026-05-25) documents methodology and the explicit exclusion table ("Gaps are intentional exclusions documented in COMPREHENSIVE_SPEC_FOR_FRANKENFS_V1.md §15, not missing implementations"). [Maintainer claim]

### Auto-demotion rules — exist, multi-layer [Verified]
- The readiness autopilot's claim-effect lattice reserves `upgrade_eligible` for authoritative proof and permits advisory inputs to only `block_upgrade` or `downgrade_required` (runbook §4). [Verified]
- The open-P0 rule auto-blocks readiness claims (enforced by Rust unit test `release_readiness_blocked_by_open_p0` and an E2E scenario — gates as code). [Maintainer claim]
- The waiver ledger forces degraded labels: PASS-WITH-WAIVERS vs clean PROCEED; waivers cannot hide a failing scenario. [Verified]
- The modularity runbook demotes file-size growth above grandfathered ceilings; the gate is "monotone" — it may prevent new debt but must not force unproved splits. [Verified]

### Reward-hacking taxonomy — referenced, load-bearing, but hosted off-repo [Maintainer claim / partially [Absent]]
- AGENTS.md lists 12 **named forbidden patterns** in the suite-wide rules (`/data/projects/AGENTS.md`): "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." The referenced `/data/projects/AGENTS.md` is **not present** in this environment (checked) — it lives on the maintainer's machine. [Verified that the reference exists; [Absent] the file itself here]
- Receipt-bound evidence: `docs/runbooks/rch-proof-ledger.md` verdicts (`remote_success` … `missing_remote_evidence`); "A local shell exit code is not enough if the transcript does not prove remote execution." [Verified]

### Distinctive honesty moves worth flagging
- **Correcting to one's own earlier claim:** the measurement plan includes "Correction to my own earlier claim" (the btrfs fixture was not actually blocked by a missing formatter). [Verified]
- **Self-audited reality checks published as docs:** the 2026-09-21/22 reality-check writeup and the 2026-05-20 bridge plan publish finding G-A ("btrfs RW is a silent-data-loss facade (P0)") in-project. [Verified]
- **ISA correction doc:** every pre-2026-07-25 perf ratio is flagged as measured on the wrong binary ("the two differences are exactly the two things a Cargo profile cannot express"), with a rule that "A different ELF SHA is necessary, but it is not sufficient." [Verified]

---

## 4. Plan→agent execution

### Task graph: .beads [Verified]
- Single source of truth; "JSONL is truth and `beads.db` is disposable" (AGENTS.md). 4,239 rows, IDs `bd-*`, schema `id/title/description/status/priority/issue_type/source_repo/created_by/created_at/updated_at/closed_at/close_reason/compaction_level/original_size`. Dependencies via `br dep`, cycles must stay empty ("`br dep cycles` stays empty").
- **bv** (graph-aware triage): PageRank/betweenness/critical-path robot commands; `--robot-plan` emits parallel execution tracks with `unblocks` lists; `--robot-triage` is "THE MEGA-COMMAND". Scope boundary: "bv handles *what to work on* (triage, priority, planning). For agent-to-agent coordination (messaging, work claiming, file reservations), use MCP Agent Mail." [Verified]

### Phases: the canonical porting sequence [Verified]
The porting doctrine in AGENTS.md is a strict phase pipeline: (1) extract behavior from legacy C into `EXISTING_EXT4_BTRFS_STRUCTURE.md`; (2) design Rust architecture in `PROPOSED_ARCHITECTURE.md`; (3) implement from spec; (4) validate via conformance harness; (5) track parity numerically in `FEATURE_PARITY.md`. Root plan §0.1 put "Documentation and Consistency" as a **blocker before deep implementation**. The plan doc's §0 Execution TODO is explicitly "authoritative" and "MUST be updated whenever work is completed or new required sub-tasks are discovered." [Verified]

### Verification loops [Verified]
- **Per-session loop:** start ritual → claim one bead → reserve files → announce on Agent Mail → smallest correct change → gates (fmt/check/clippy/test) → close bead → `br sync --flush-only` → commit → push → landing-the-plane. [Verified]
- **Per-claim loop (readiness autopilot):** dry-run planner generates `report.json` (machine contract) + `report.md` (operator handoff); controlling bead anchors traceability; "Public readiness claims must remain tied to real proof bundles." [Verified]
- **Per-proof loop (RCH proof ledger):** transcript → verdict → claim; local fallback is `invalid_local_fallback` — not proof. Capacity preflight exists for degraded infrastructure. [Verified]
- **Per-optimization loop:** hyperfine baseline → one lever → behavior-proof via isomorphism template (ordering, tie-break, float-identical, RNG seeds, goldens) → re-measure. [Verified]
- **Per-move loop (modularity):** falsifiable hypothesis recorded before mutation → characterization tests first → one mechanical move → 12-item proof matrix → stop at first terminal falsifier. [Verified]

### Dialectical review [Verified]
- **10 reasoning modes, 5 parallel agents, 3 opposing pairs** (Modes of Reasoning report, 2026-04-07): "3 opposing pairs (F7 vs H2, A1 vs B3, I4 vs L2)" — explicitly dialectical design. [Verified]
- **Second-model review:** Gemini (Code Review Swarm Agent) spontaneous review of MVCC WAL + btrfs RAID parser (2026-04-16) — a different model auditing the primary's work. [Verified]
- **Reality-check skill:** `/reality-check-for-project` runs four code-investigation agents against README claims, then a Phase 2 bridge plan; its gaps become beads ("The beads generated from it embed enough context that this file need not be re-read"). [Verified]
- **Pre-registered falsification:** measurement plans record predictions before the run ("Every number quoted as 'expected' below is a prediction recorded **before** the run, so the run can falsify it rather than be interpreted to fit"). [Verified]
- **Alien-Artifact Mode:** elicitation prompt demanding esoteric math, with required outputs: "Explicit invariants… Evidence ledger… Loss matrix / expected-loss rule for any threshold-like decision." [Verified]

### Drift prevention [Verified]
- Never-compact is the AGENTS.md design against context drift: session start ritual re-reads AGENTS.md + README fully; "cass" cross-agent session search provides archaeology without compaction (with anti-broken-pipe rules).
- Tracker drift: source-aware hygiene classifier, foreign-row pollution treated as "triage pollution first, not as data to delete or close"; strict mode gates.
- Cross-agent drift: Agent Mail file reservations (exclusive leases), single-writer rule on graph structure, "you NEVER… disturb the work of other agents… treat those changes identically to changes that you yourself made."
- Gate drift: the gate-change rule (evidence for both admitted and still-rejected cases); never-weaken-gate rules; report-shape goldens with negative fixtures.

---

## 5. State-of-the-art coverage

- **Behavior extraction from the incumbent corpus:** the kernel C corpus (v6.19, ~205K lines, gitignored) is enumerated per-module in AGENTS.md's legacy-source navigation table; extracted behavioral contracts live in `EXISTING_EXT4_BTRFS_STRUCTURE.md`. "No line-by-line translation from C. Extract behavior, then re-implement idiomatically in Rust." [Verified]
- **Kernel-differential validation:** `crates/ffs-harness/tests/kernel_reference.rs` (ext4, 17/17) and `btrfs_kernel_reference.rs` (7/7) — real kernel tools (`debugfs`/`dumpe2fs`, `mkfs.btrfs`) as ground truth. [Verified]
- **Competitor/upstream audit:** `docs/planning/PARITY-COVERAGE.md` enumerates upstream ioctl surface from `fs/ext4/ioctl.c` and `fs/btrfs/ioctl.c` against dispatch implementations. [Verified]
- **xfstests lane:** `docs/xfstests-known-failures.md` + permission-ACK-gated real xfstests baseline bead (`bd-rchk3`), still open. [Verified]
- **Research/literature ingestion:** the Alien-Artifact Mode prompt explicitly demands literature mining ("Surely there is some math invented in the last 60 years that would be ultra accretive…"), with loss-matrix/expected-loss outputs; design docs reference Bayesian evidence updates, anytime-valid monitoring, RaptorQ/RFC-6330. No formal literature-review doc found (see §7). [Partially [Absent]]
- **Template reuse:** `COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1.md` copied from FrankenSQLite "as a strategy template, not as a direct filesystem specification" — cross-project methodology transfer is itself documented. [Verified]

---

## 6. Anti-satisficing

- **Reality-check skill (two phases):** Phase 1 audits docs against code via multiple investigation agents + real builds/CLI runs/kernel-differential tests; Phase 2 writes the bridge plan. Its own findings are brutal by design: "an evidence apparatus larger than its filesystem and overstates what has been proven"; "They are JSON validators checking project-authored JSON against project-authored policy JSON; zero `Command::new`, a closed loop." [Verified]
- **Ledger resurrection:** the negative-evidence ledger gets audited for void rows; "VOID" classes separate "measured and absent" from "couldn't have detected the lever." [Verified]
- **Bold-verify campaign:** the named driver of the negative-evidence ledger ("canonical no-gaps ledger entry point requested by the bold-verify campaign"). [Maintainer claim]
- **Retry predicates, not retractions:** e.g. perf rows carry "Retry predicate: repeat when /proc/loadavg sits below ~20… require the kernel arm's A/A null to contain 1.0 before quoting any ratio"; "reporting a loss is a success — one line, revert, next lever, no retraction narrative." [Verified]
- **Falsifiable hypothesis first** (modularity protocol), **stop at first terminal falsifier** (no spending remaining gate budget), **isomorphism proof template** mandatory for perf PRs. [Verified]
- **Known-failure inventory:** `docs/xfstests-known-failures.md`; `bd-bhh0i` default rule (older rows that conflict with the current default are superseded). [Verified]

---

## 7. Explicit absences

- [Absent] **`docs/research/`** — no research/briefs phase directory exists (design docs and OQ docs cover the ground, but not under the suite pattern's `docs/research/` path).
- [Absent] **`ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`** — none at root. Roadmap-equivalent function lives in `PLAN_TO_PORT_FRANKENFS_TO_RUST.md` §0 (Execution TODO) and `.beads/pending_tasks.md`.
- [Absent] **`CLAUDE.md`, `MUSE.md`, `.muse/`** — none exist; `AGENTS.md` is the sole agent instruction file (`.muse` is a stale path in `PLAN_TO_PORT_LEGACY_FS_TO_RUST.md`? no — referenced nowhere; only AGENTS.md).
- [Absent] **Standalone "definition-of-done" doc** — grep finds the phrase only in the archived bridge plan. Definition-of-done content is distributed across the session-ritual gates, readiness autopilot, modularity checklist, and the gate-change rule rather than in one doc.
- [Absent] **ADRs** — no `docs/adr/` or ADR-named files; design docs (`docs/design-*.md`) play the role informally.
- [Absent] **Suite-wide rules in-repo** — AGENTS.md RULE 0.5 binds agents to `/data/projects/AGENTS.md`, which lives on the maintainer's machine (confirmed not in this environment). The 12 named reward-hacking patterns are referenced but not readable here.
- [Absent] **`docs/planning/` in the full suite sense** — it exists but holds only 4 files (modularity runbook, parity coverage audit, profiling summary, legacy-structure bootstrap); there is no general planning/briefs directory tree.
- [Absent] **Formal literature-review doc** — research ingestion is procedural (Alien-Artifact elicitation, kernel source extraction) rather than a `docs/research/` phase artifact.
- [Absent] **Cross-model dialectic as standing cadence** — the modes-of-reasoning and Gemini reviews are dated one-offs (2026-04-07, 2026-04-16); nothing schedules recurring adversarial re-reviews. [Inference]

---

## 8. Maturity verdict

**MATURE (verification-gated, asymmetric).**

Why mature: FrankenFS has the most institutionally complete planning-and-honesty system in the suite — a 4,239-row dependency-tracked task graph with hygiene gates, a canonical phased plan with an explicitly-labeled "blocker before deep implementation" section, machine-enforced evidence gates (preflight linters, proof ledgers, release-gate E2E), a negative-evidence ledger that is itself audited, named anti-reward-hacking rules, and verbatim "never weaken a gate" norms with priced legitimate-gate-fix procedures. The planning method is plan-first (spec → architecture → implement → conformance → parity) with multi-model dialectical review and pre-registered falsification. This is a mature, self-correcting planning culture.

Why asymmetric, not perfect: the system is **verification-heavy and synthesis-light** — the project's own 2026-05-20 reality check names the failure mode: "an evidence apparatus larger than its filesystem," with proof bundles that "gate nothing executable." The gate network's own docs concede the btrfs RW durability facade, self-certified parity math, and that `readiness_verified` has never been satisfiable. In short: planning maturity is real, but the apparatus sometimes substitutes describing readiness for achieving it — and uniquely for this suite, the project *writes that sentence down itself*.

**The most distinctive planning finding:** FrankenFS's planning method treats *the evidence itself as the adversary*: the negative-evidence ledger is audited by a second-layer ledger-resurrection campaign that classifies REJECT rows as VOID vs. VALID, pre-registered measurement plans falsify their own authors' predictions, and gate changes require evidence of cases the gate still rejects — making it the only suite repo where the honesty infrastructure is recursively gated by its own honesty infrastructure.
