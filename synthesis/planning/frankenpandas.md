# FrankenPandas — How Emanuel Plans

**Repo:** `frankenpandas` (https://github.com/Dicklesworthstone/frankenpandas), analyzed 2026-09-22. *Clone note:* a full `git clone --depth 1` to `/tmp/plan-frankenpandas` failed with "No space left on device" (the 512 MB tmpfs was ~90% full with sibling analyses); recovery was `--filter=blob:none --sparse` sparse checkout of `AGENTS.md docs scripts .github githooks .beads/config.yaml .beads/metadata.json`, plus a GitHub tree-API inventory of all 11,583 entries. Every planning doc was read in full. Supplemented and independently verified on 2026-09-22: `.beads/issues.jsonl` record counts (4,051; 4,049 closed / 1 in_progress / 1 tombstone), beads JSONL schema, `references/` and `skill-loop` artifacts, and the `audit_doc_pandas_claims.py` / `feature_universe_gate.py` quotes — all checked out.

**One-sentence summary:** Emanuel's planning here is a *phase-gated extraction-and-proof machine*: legacy pandas behavior is extracted into machine-gated "packets" (each with a 15-field mandatory schema and its own parity gate), plans pass through **red-team contradiction ledgers with bead-signed sign-offs**, execution runs through a **4,051-bead dependency graph with a hygiene validator**, and an ever-growing (44,086-line) **negative-evidence ledger** records every optimization win, loss, and rejected dead end with same-invocation controls — but the honesty layer is perf-claim-heavy rather than plan-structure-heavy, and the suite-stereotype dialectical protocol shows up as *rival agent lanes in shared checkouts*, not as a formal two-model opposition.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (871 lines) | Agent operating instructions | Fundamental-override rules, suite-wide anti-reward-hacking rules (12 named patterns, referenced from `/data/projects/AGENTS.md`), work-graph discipline, feature-parity mandate, commit provenance, tooling contracts (RCH, Agent Mail, Beads, bv triage) |
| `docs/planning/PLAN_TO_PORT_PANDAS_TO_RUST.md` | Normative porting methodology | 5-phase spec-first method (extract → implement from spec → differential conformance → isomorphism-gated optimization) with 4 mandatory exit criteria |
| `docs/planning/PHASE2C_EXTRACTION_PACKET.md` | Packet contract law | 8 FP-P2C tickets with legacy anchors + target crates + oracle tests; 15-field mandatory extraction schema ("missing field ⇒ NOT READY"); risk-tiered gate escalation; READY_FOR_IMPL rubric |
| `docs/planning/TODO_EXECUTION_TRACKER.md` | Living execution tracker | A–P work sections with checkbox state; per-session evidence ledger (validation commands, gate results, regenerated artifacts) |
| `docs/planning/REVIEW_SESSION_HANDOFF.md` | Dialectical audit artifact | 19 review-mode audit passes by agent cc-pandas on 2026-04-22: 58 beads filed, 14 shipped by parallel swarm, severity calibration table (a HIGH demoted to MEDIUM on evidence), 8 work-cluster backlog |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENPANDAS_V1.md` | Master V1 spec | Prime directive, milestone/exit criteria, acceptance gates A–D, CI gate topology G1–G6, RaptorQ artifact envelope schema, 90-day execution plan |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` (713 lines) | Legacy behavior extraction | Red-team contradiction ledger (§26, RTL-01–03 with findings and resolutions) and Doc-Pass-13 final integrated sign-off (§29, bead-signed `bd-2gi.23.14`, 2026-02-15) |
| `docs/planning/EXISTING_PANDAS_STRUCTURE.md` | Red-team-reviewed structural map | Red-team contradiction findings (RTS-01–04) + bounded uncertainty ledger |
| `docs/planning/RELEASE_RUNBOOK.md` | Release operating procedure | Gated release sequence with maintainer-only signing steps; explicit "[MAINTAINER]" markers |
| `docs/NEGATIVE_EVIDENCE.md` (44,086 lines) | Master negative-evidence ledger | Every perf lever's head-to-head vs pinned pandas 2.2.3 recorded win/loss/neutral; positive-row convention (2026-07-27) with machine-readable evidence markers; pre-registered predictions + calibration self-audit |
| `docs/LEDGER_RESURRECTION.md` | Independent ledger audit | 2026-07-25 audit of 256 REJECT-bearing entries by classifier + hand-confirmation; notes the method was "independently invented and executed" by this repo before the campaign named it |
| `docs/RELEASE_SCORECARD.md` | Release-readiness scorecard | Chronological measured-win log (SlateOtter fp-index sweeps, 2026-06-24) with before/after/pandas ratios and artifact pointers |
| `artifacts/optimization/negative-evidence-ledger-cod-a.md`, `-cod-b.md` | Per-lane negative-evidence ledgers | cod-a/cod-b (2026-06-18/19) lever-by-lever records with guard tests, retry predicates ("never retry a recorded dead end" without a concrete predicate), benchmark verdicts |
| `artifacts/optimization/skill-loop-progress-*.md` | Campaign loop ledgers | Extreme-software-optimization skill loop state (6 passes, missions, per-pass evidence) per agent identity |
| `artifacts/bead-hygiene-report-2026-05-08.md` (+ `.json`) | Tracker hygiene report | Machine-generated: cycles, duplicate cross-listed epics, stale in-progress, umbrella progress contradictions |
| `.beads/issues.jsonl` (4,051 issues) + `.beads/beads.base.jsonl` | Task-tracker database | Full work graph; statuses 4,049 closed / 1 in_progress / 1 tombstone; types: task 2621, bug 637, feature 199, perf 110, test 433, docs 31, epic 15, refactor 3, question 2 |
| `.beads/config.yaml`, `.beads/metadata.json` | Tracker config | Issue prefix `br-frankenpandas`; JSONL export wiring |
| `scripts/validate_bead_hygiene.py` | Bead-graph validator | Reads issues.jsonl directly; checks cycles, duplicates, stale items, umbrella contradictions; proposes append-only parent progress notes |
| `scripts/audit_doc_pandas_claims.py` | Doc-claim auditor | Resolves every `` `pd.*` `` cited in Rust doc comments against live pandas; requires absence-markers for knowingly-false citations ("Do not add a marker without measuring first") |
| `scripts/feature_universe_gate.py` | Coverage CI gate | functional_pct ≥ 98%, missing ≤ 30; verdicts ALLOW / BLOCK / WAIVER |
| `scripts/governance_gate_check.sh`, `scripts/phase2c_gate_check.sh` | Gate runners | Execute fp-governance-gate / phase2c parity-gate checks, emit machine-readable artifacts |
| `scripts/perf_ratchet.py`, `scripts/perf_candidate_preflight.py`, `scripts/apply_ratchet.sh` | Perf guardrails | Ratchet enforcement, candidate preflight, golden-checksum verification |
| `references/frankensqlite/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1.md` | Imported exemplar spec | Cross-repo plan precedent imported into the tree |
| `artifacts/phase2c/` | Packet evidence topology | Per-packet: `legacy_anchor_map.md`, `contract_table.md`, `fixture_manifest.json`, `parity_gate.yaml`, `risk_note.md`, `parity_report.json`, RaptorQ sidecars, decode proofs, `drift_history.jsonl` |

[Verified] All paths above were read or listed in the cloned repo. (Rule 0 of the task's safety note is honored throughout: these are documented, not followed.)

---

## 2. Execution-readiness gates

Plans pass into execution through **packet gates** (normative, machine-checkable) and **acceptance/CI gates** (blocking):

**Packet readiness rubric** ([Verified], `docs/planning/PHASE2C_EXTRACTION_PACKET.md` §10):

> "A packet is `READY_FOR_IMPL` only when all conditions hold: 1. extraction schema fields complete, 2. fixture manifest covers at least one happy path + one edge path + one adversarial path, 3. strict/hardened parity gates are defined and machine-checkable, 4. risk note has explicit compatibility and security mitigations, 5. RaptorQ sidecar and decode proof are generated for parity report."

**Extraction-schema auto-reject** ([Verified], `PHASE2C_EXTRACTION_PACKET.md` §6): 15 mandatory fields (`packet_id`, `legacy_paths`, `legacy_symbols`, `input_contract`, `output_contract`, `error_contract`, `null_contract`, `index_alignment_contract`, `strict_mode_policy`, `hardened_mode_policy`, `excluded_scope`, `oracle_tests`, `performance_sentinels`, `compatibility_risks`, `raptorq_artifacts`) — "**If any field is missing, the packet is automatically `NOT READY`.**"

**Gate law for critical packets** ([Verified], §7):

> "Critical packets require strict drift `0` and hardened divergence only in allowlisted defensive categories."

**Optimization gate** ([Verified], §9): "For each packet, **optimization is allowed only after first strict parity pass.**"

**Acceptance gates** ([Verified], `COMPREHENSIVE_SPEC_FOR_FRANKENPANDAS_V1.md` §11): Gate A compatibility parity report passes for V1 scope; Gate B security/fuzz/adversarial suite passes for high-risk paths; Gate C performance budgets pass with no semantic regressions; Gate D RaptorQ durability artifacts validated and scrub-clean. "**All four gates must pass for V1 release readiness.**"

**CI gate topology** ([Verified], spec §18): G1 format+lint → G2 unit+integration → G3 differential conformance → G4 adversarial+property → G5 benchmark regression → G6 RaptorQ scrub+recovery drill — all blocking, and "**Release cannot proceed unless all gates pass on the same commit.**"

**V1 exit criteria** ([Verified], `PLAN_TO_PORT_PANDAS_TO_RUST.md` §6): (1) Differential parity green for scoped APIs. (2) No critical unresolved semantic drift. (3) Performance gates pass without correctness regressions. (4) RaptorQ sidecar artifacts validated for conformance + benchmark evidence.

**Release gating** ([Verified], `RELEASE_RUNBOOK.md` §0): five gates with named evidence (CI green batch, honest live-oracle report, packaging landmine closed, packet corpus green, `cargo package --list` clean), with **"[MAINTAINER]"** steps explicitly reserved for the release manager's signing key / crates.io token.

---

## 3. Honesty guardrails

### The negative-evidence ledger (the suite's richest anti-claim artifact)

[Verified] `docs/NEGATIVE_EVIDENCE.md` is 44,086 lines of head-to-head measurement. Its governing rules:

> "Method: `examples/bench_*.rs` self-time `best=<ns>` over N iters; pandas scripts (`perf/pandas_baseline/`) time the equivalent op best-of-N on a matched workload. `ratio = pandas_ns / fp_ns` (>1 ⇒ fp faster). Same machine, single-thread unless noted."

> "Rule: record EVERY result (win/loss/neutral). Revert any lever that regressed or showed ~0 gain. **Never retry a recorded dead end.**"

**Positive-row convention** ([Verified], effective 2026-07-27):

- "**`maintenance-self-speedup`** means FrankenPandas before versus FrankenPandas after. It may land, but it is not campaign output and must not be presented as a competitive claim."
- "**`incumbent-win`** requires the actual pandas incumbent arm to run side-by-side with FrankenPandas in the same invocation. The row must pin the pandas name, version, and artifact SHA-256; record the shared invocation ID and measured ratio; and include the executing-ELF identity, A/A null, and median-CI decision. CV has no vote."
- "A `maintenance-self-speedup` label **cannot rescue a pandas-facing or `incumbent-win` claim that lacks the live incumbent arm.**"

This is the repo's **claim-downgrade rule** — a self-speedup may never be upgraded into a competitive win; unverified rows are REJECT rows with required null controls or counted mechanisms. [Inference] The ledger also practices **pre-registration**: agents record prediction bands before implementing ("I recorded 1.03x–1.12x before implementing… My stated refutation floor (below 1.02x means the churn is immaterial and I do not land it) was not triggered"), then score themselves ("PREDICTION SCORED: TOO CONSERVATIVE… the misses are not biased in one direction, so they are noise in my estimates rather than a correctable systematic offset").

**Per-lane ledgers** ([Verified], `artifacts/optimization/negative-evidence-ledger-cod-a.md`, `-cod-b.md`): cod-a (2026-06-18) and cod-b (2026-06-18/19) record every optimization attempt with guard tests, UBS runs, validation commands, and retry predicates — cod-b reverted its `.206` affine-take laziness "because it regressed the generic affine workload versus the pre-optimization FP baseline and pandas," while keeping `.205` with the honest verdict "SLOWER" (0.749x–0.833x vs pandas). Losses are kept in the ledger as accepted rows, not hidden.

**Ledger resurrection audit** ([Verified], `docs/LEDGER_RESURRECTION.md`, 2026-07-25): an independent campaign pass classified all 256 REJECT-bearing ledger entries: 31 auto-flagged VOID, 16 hand-confirmed genuine void lever-rejects, 177 WEAK (provenance gaps), 48 STANDS. Notable line: "frankenpandas **independently invented and executed the §1 method on 2026-07-10**, two weeks before the campaign named it — and it produced this repo's largest win lane."

**When installed:** before and during execution, continuously. The packet contracts date to 2026-02-13, the red-team sign-off to 2026-02-15, per-lane ledgers to 2026-06-18/19, the positive-row convention to 2026-07-27, and ledger entries run through at least 2026-08-18. [Verified/Inference]

### Claim auditing tooling

[Verified] `scripts/audit_doc_pandas_claims.py`:

> "A doc that says 'Matches ``pd.Series.dt.week``' is a testable claim, and the cheapest half of it is testable without running FP at all: does that attribute EXIST in the pandas we target? Removed surfaces (``.append``, ``MultiIndex.is_lexsorted``, ``Series.dt.week``) and invented ones (``Series.str.isascii``, assumed from Python's ``str``) both show up here."

> "A doc that CORRECTS a false claim has to keep citing the missing surface, so a bare existence check would stay red forever and quickly be ignored… **Do not add a marker without measuring first — that turns the gate off, which is the whole value.**"

[Verified] `scripts/validate_bead_hygiene.py` + `artifacts/bead-hygiene-report-2026-05-08.md`: machine-checks the tracker for dependency cycles, stale in-progress items, duplicate cross-listed epics, and "umbrella progress contradictions" (e.g., umbrella beads claiming methods missing while child beads are closed) — and proposes append-only corrections a human or agent must review before applying.

### Anti-reward-hacking rules

[Verified] `AGENTS.md` Rule 0.5 incorporates the suite-wide 12 named forbidden patterns: "gate self-weakening (and the exact price of a legitimate gate fix), proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." And: "**reporting a loss is a success** — one line, revert, next lever, no retraction narrative." — plus "**never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits." [Maintainer claim] (the 12-pattern list itself lives in `/data/projects/AGENTS.md`, which is **not in this repo** — absent on this machine; see §7.)

---

## 4. Plan→agent execution

**Work-graph discipline** ([Verified], `AGENTS.md` Rule 0.5, quoting the suite rule): "JSONL is truth and `beads.db` is disposable, `br sync --import-only` after every pull, single-writer on graph structure, closure on cited evidence with blocker beads gated on their named probe, `br dep cycles` stays empty."

**The tracker:** 4,051 beads (`br-frankenpandas-*`), essentially drained: 4,049 closed, 1 in_progress, 1 tombstone; type mix task/bug/feature/perf/test/docs/epic/question/refactor. Bead schema (JSONL): `id, title, description, status, priority, issue_type, created_at, created_by, updated_at, closed_at, close_reason, source_repo, compaction_level, original_size`. Close reasons carry cited evidence (e.g., exact `file.rs:line` anchors). [Verified]

**Swarm coordination** ([Verified], `AGENTS.md`): MCP Agent Mail with explicit file reservations (leases) before editing, bead ID as mail thread ID and file-reservation reason, commit messages carrying bead IDs, `br sync --flush-only` + manual git add/commit, and a mandatory session-completion protocol ("Landing the Plane": file follow-up issues, run gates, update statuses, sync beads, hand off). A "Note on Built-in TODO Functionality" forbids agents from whining about beads when the maintainer explicitly orders TODO use — "Always comply with such orders."

**Session protocol for review work** ([Verified], `REVIEW_SESSION_HANDOFF.md`): the 2026-04-22 cc-pandas session ran **19 review-mode audit passes** — "Every bead was grep/ls-verified before filing; one initial HIGH (`s5vn` at pass 10) was calibrated down to MEDIUM after actual count verification showed 3 proptests, not 80. Remaining passes held that calibration discipline strictly." — and **passes 20+ were refused with explicit rationale; continuing would have violated calibration.** During the session 14 beads were "shipped" by a parallel swarm, and the handoff hands the next agent 8 batched work-clusters with "Recommended Close Order" and per-cluster PR batching guidance ("batch-close 4–7 beads per PR rather than grinding one-by-one").

**Execution cadence in perf campaigns** ([Verified], TODO_EXECUTION_TRACKER.md §P): rounds (Round-4/Round-5 optimization cycles) with captured before/after baselines, single-lever implementation, conformance re-verification, emitted ROUND*_ artifacts; "method-stack saturation" sessions bulk-append missing `Differential/Adversarial Validation Contract v2` / `Optimization/Isomorphism Contract v2` / `Final Evidence/RaptorQ Contract v2` sections to open beads and re-check marker coverage (`missing_diff=0`, `missing_opt=0`, `missing_final=0`) and graph health (`br dep cycles --json` ⇒ `count=0`).

**Drift prevention** ([Verified]): packet drift history is append-only (`artifacts/phase2c/drift_history.jsonl`), feature-universe gate fails CI on coverage regression with a waiver file as the only escape hatch, phase2c gate checks emit machine-readable results per packet, golden checksums are re-verified (`sha256sum -c golden_checksums.txt`), and fixture freshness is checked with provenance pinned (`check_fixture_freshness.sh`, `fixture_provenance`).

**Dialectical review:** No explicit two-model-opposition protocol is named in this repo [Absent]. What exists instead is (a) **rival named agent lanes in shared checkouts**: cod-a vs cod-b perf campaigns, "both panes share the git identity `cod-pandas`" with `Co-Authored-By: Grok <noreply@x.ai>` trailers distinguishing agents — one ledger entry warns "There is a THIRD agent in this checkout, not just the two Claude panes — so an unexplained change must not be attributed to 'the other pane' by elimination" ([Verified], `docs/NEGATIVE_EVIDENCE.md` ~line 38940); (b) **red-team contradiction ledgers with bead-signed resolution** (see §6); (c) the **ledger resurrection audit**, which independently re-classified the ledger's own rejects; and (d) the skill-loop campaign structure (extreme-software-optimization) where lanes compete for measured wins. [Inference] The functional analog of two-model dialectics is *lanes competing on measured evidence with a referee ledger*.

**Sign-off as a primitive:** [Verified] The legacy analysis closed with "## 29. Final Integrated Sign-Off (Doc-Pass-13)": "Sign-off date: 2026-02-15 / Sign-off bead: `bd-2gi.23.14`" — with consistency checks completed and "Remaining open items are only bounded gaps with explicit next actions (section 28.4), not unresolved contradictions."

---

## 5. State-of-the-art coverage

SOTA coverage is **packet-scoped and oracle-anchored**, not a standing research directory:

- **Extraction packets anchor to exact legacy symbols**: each FP-P2C ticket names exact pandas classes/functions (`DataFrame`, `_from_nested_dict`, `_reindex_for_setitem` in `pandas/core/frame.py`; `Index`, `ensure_index`, `_validate_join_method` in `pandas/core/indexes/base.py`; …) plus exact pandas test files (`pandas/tests/frame/test_constructors.py`, `pandas/tests/indexes/test_base.py`, …) ([Verified], `PHASE2C_EXTRACTION_PACKET.md` §1).
- **Legacy oracle is pinned live pandas 2.2.3** in a repo-managed venv (`.venv-oracle/`): "Without the venv the live-oracle tests skip and report PASS, so **no venv means no parity evidence**" ([Verified], `AGENTS.md`). The 2026-04-22 review filed a CRITICAL bead (`d6xa`) precisely because live-oracle tests were silently skipping in CI — then shipped the fix (`9c11894 fix(conformance): require live oracle in CI`).
- **Canonical graveyard sources**: the perf skill-loop mechanism ("extreme-software-optimization", "alien-artifact-coding", "alien-graveyard") routes hotspot work to "canonical graveyard docs" — e.g., "Alien primitive harvest: match the top current hotspot to the canonical graveyard docs and choose one EV>=2.0 structural primitive" ([Verified], `artifacts/optimization/skill-loop-progress-blackthrush-sad5y.md`). Ledger entries carry "Graveyard mapping" fields (vectorized execution / typed data-plane specialization). [Maintainer claim; the graveyard sources themselves are not in-repo — referenced via skill loop, [Absent] as files]
- **Imported exemplar**: `references/frankensqlite/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1.md` — "Reference exemplar imported into this repository" ([Verified], spec §0). This is the suite cross-pollination mechanism as an artifact.
- **Competitor machinery**: `benches/vs_pandas_harness.py` head-to-head runs (`--category indexing --workloads … --sizes 100k,1M --dtypes float64`, taskset-pinned) with gauntlet verification (cod-b ledger: "Gauntlet verification - br-frankenpandas-uza04.205/.206 affine take cluster") — every competitor comparison is a *measurement*, not a literature claim. [Verified]
- **SOTA honesty bound** ([Verified], `docs/NEGATIVE_EVIDENCE.md`): the A/A null control + median-CI harness contract was adopted from the 2026-07-25 ledger resurrection audit ("Harness contract adopted: ELF SHA-256 + same-invocation A/A + median-CI gate").

[Absent]: any `docs/research/` directory, literature-review doc, or named-competitor strategy memo (competitors are pandas-the-oracle only).

---

## 6. Anti-satisficing

- **Red-team contradiction ledgers with named findings and bead-signed resolutions**: EXHAUSTIVE §26 (`RTL-01`–`RTL-03`) — most consequentially, `RTL-01` caught "V1 exclusion language contradicts total-parity doctrine": `EXISTING_PANDAS_STRUCTURE.md` had carried explicit "Exclude for V1" scope language, which was "replaced with no-exclusion phased sequencing doctrine; deferment allowed only with explicit closure bead." The red team *changed the project's scope doctrine*. [Verified] EXISTING_PANDAS_STRUCTURE.md carries its own pass's `RTS-01`–`RTS-04` contradiction findings plus a "Bounded Uncertainty Ledger" of explicitly retained open risks ([Verified]).
- **Review-session anti-padding**: passes refused once the filable pool was exhausted ("continuing would have violated calibration"); padding-rejected candidates logged per pass; one severity calibrated down on evidence. [Verified]
- **Pre-registered predictions + refutation floors** in the negative-evidence ledger (prediction bands recorded before implementing; a stated floor below which the work is not landed). [Verified]
- **12 named reward-hacking patterns forbidden** suite-wide (proof-class inflation, golden regeneration reflex, tautological tests, spec-editing as progress, conformance metastasis…), with "the exact price of a legitimate gate fix" defined. [Verified, via reference to out-of-repo file]
- **Doc-claim auditing with marker discipline**: `audit_doc_pandas_claims.py` — "Do not add a marker without measuring first — that turns the gate off, which is the whole value." [Verified]
- **Feature-universe gate with WAIVER as the only bypass**: functional_pct ≥ 98%, missing ≤ 30; regressions BLOCK CI unless a waiver file exists. [Verified]
- **Bead hygiene validator** catching umbrella-progress contradictions (claiming completeness while children disagree). [Verified]
- **Mandatory optimization contract**: "No optimization is accepted without associated correctness evidence" (spec §7); optimization allowed only after first strict parity pass (packet §9); every packet's `risk_note.md` must carry the isomorphism proof block (ordering / tie-breaking / null-behavior preserved + fixture checksum). [Verified]
- **Identity-bound provenance**: every swarm agent publishes an SSH signing-key fingerprint in `AUTHORS.md`; mismatched `AGENT_NAME` commits are spoofable and rejected at review; release tags are signed. [Verified]

---

## 7. Explicit absences

All checked in the cloned repo and confirmed missing:

- [Absent] `docs/research/` (or any research directory); no literature-review or named-competitor memo
- [Absent] `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` at root (planning lives in `docs/planning/` + `TODO_EXECUTION_TRACKER.md` + `.beads/`)
- [Absent] `CLAUDE.md`, `MUSE.md`, `.muse/` directory, in-repo `skills/` directory (skill-loop skills are referenced by name in ledger entries, not defined in-repo)
- [Absent] The suite-wide `/data/projects/AGENTS.md` referenced by Rule 0.5 — not in this repo (and not on this analysis machine); the 12 named reward-hacking patterns and Work-Graph Discipline rules are incorporated only by reference
- [Absent] ADRs or a decision-log directory (decisions live inline in packet §30-equivalent sections, red-team ledgers, and risk notes)
- [Absent] A standalone definition-of-done document (DoD is distributed: packet READY_FOR_IMPL rubric §10, Done Criteria §5, per-gate evidence tables in RELEASE_RUNBOOK §0)
- [Absent] "Dialectical" / two-model-opposition terminology (analogs: rival named lanes in shared checkouts, pre-registered predictions, red-team contradiction ledgers, ledger resurrection audit)
- [Absent] A never-compact-sessions rule in text (no "compact*" hits relating to agent session compaction; `.beads` schema carries a `compaction_level` field, but that refers to bead content compaction, not session memory)
- [Absent] An auto-demotion rule *by that name* (the functional analog — the claim-class rule forbidding `maintenance-self-speedup` from rescuing a pandas-facing claim, plus REJECT-row demotion via null controls — exists and is ledger-enforced)
- [Absent] A separate claim-matrix document (the 15-field extraction schema + audit_doc_pandas_claims.py + contract tables serve the function)

---

## 8. Maturity verdict

**Mature — the most planning-artifact-dense of the suite repos analyzed so far.** Distinctive features:

1. **Plan-before-build is literally the methodology**: the 5-phase spec-first port method with mandatory exit criteria is the project's opening contract, and the 8 extraction packets of 2026-02-13 predate the bulk of implementation — with red-team contradiction review and a bead-signed sign-off *before* the build phase.
2. **Planning artifacts are executable, not decorative**: packet readiness auto-rejects on missing schema fields; feature-universe and phase2c gate scripts fail CI; the bead hygiene validator machine-checks the 4,051-bead graph; doc claims are audited against live pandas.
3. **Honesty machinery is the repo's center of gravity**: a 44K-line negative-evidence ledger with a 2026-07-27 machine-readable claim-class convention (self-speedup vs incumbent-win), pre-registered predictions with refutation floors, an independent ledger-resurrection audit that voided weak rejects, and per-lane dead-end ledgers with explicit retry predicates.
4. **Red-team review changed doctrine, not just wording**: RTL-01 replaced the project's V1 scope-exclusion language with the no-permanent-exclusion doctrine, enforced by deferment beads.
5. **Termination discipline**: the review session refused passes 20+ on calibration grounds; dead ends are recorded and never retried without a predicate.

Deductions from "fully mature": the dialectical two-model protocol appears only as rival agent lanes + referee ledgers (effective, but emergent rather than specified); the 12 named anti-reward-hacking patterns and work-graph discipline rules live in an out-of-repo file incorporated by reference; and the `.beads` tracker is essentially drained (4,049/4,051 closed), so the planning corpus now reads as *archaeology of a completed campaign* rather than a living roadmap — the forward-looking sections (tracker §M/O: packets FP-P2C-006+, full-port completion) are still checkbox plans without evident execution. The single `in_progress` bead and the 2026-09-22 WAL-certificate commit suggest the repo is in maintenance tail, not active planning.
