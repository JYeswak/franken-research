# Planning Methodology: franken_networkx

**Repo:** https://github.com/Dicklesworthstone/franken_networkx · **Analyzed:** 2026-09-22 · **HEAD:** `841a71163` (2026-09-22)
**Clone size:** 71,758 files, ~650 MB (depth-1) — includes vendored legacy NetworkX at `legacy_networkx_code/`
**Claim tiering:** `[Verified]` = read in a repo file; `[Maintainer claim]` = his prose, quoted; `[Inference]` = reasoned from evidence; `[Absent]` = looked for, not found.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (937 lines) | Agent operating constitution | RULE 0 override prerogative, irreversible-action bans, reward-hacking patterns, work-graph discipline, per-tool runbooks (beads, bv, UBS, RCH, agent mail), session-completion protocol |
| `docs/planning/PLAN_TO_PORT_NETWORKX_TO_RUST.md` | Master porting plan | Spec-first workflow: legacy → executable spec → Rust from spec → differential conformance → perf only after behavior-isomorphism; 5-phase entry/exit criteria; "Line-by-line translation is forbidden" |
| `docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENNETWORKX_V1.md` | V1 contract spec (391 lines) | Prime Directive, scope contract, alien-artifact decision layer, acceptance Gates A–D, milestones M0–M4, CI gate topology G1–G8, 90-day execution plan |
| `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` | Research-phase report (995 lines) | Measured inventory of legacy NetworkX (1,247 files); Phase-2 definition of done; Phase-2C per-ticket payload contract |
| `docs/planning/EXISTING_NETWORKX_STRUCTURE.md` | Behavioral extraction | Behavior/invariant/edge-zone contracts extracted from legacy (feeds the spec-first pipeline) |
| `docs/planning/PROPOSED_ARCHITECTURE.md` | Architecture synthesis | Crate/module boundary map with strict/hardened policy boundaries |
| `docs/planning/FEATURE_PARITY.md` | Parity tracker | `parity_green` promotion rule; declared scope boundaries (e.g., node-key equivalence out of scope for V1) |
| `.beads/issues.jsonl` (3,677 issues, 6.8 MB) | Task graph / work graph | Dependency-aware issue DB: 3,632 closed / 31 in_progress / 8 open / 6 blocked; types task/bug/perf/test/feature/epic/docs/chore; evidence-carrying `close_reason` strings |
| `docs/NEGATIVE_EVIDENCE.md` | Perf honesty ledger (main) | Campaign `br-r37-c1-04z53` verdicts with machine-enforced verdict contract; every row records A/A nulls, ELF provenance, controls |
| `docs/NEGATIVE_EVIDENCE_cc.md` | Perf honesty ledger (cc lane) | Same ledger for the Claude-Code lane; includes falsification and demotion records |
| `docs/LEDGER_RESURRECTION.md` | Ledger re-audit | Six-class rejection taxonomy re-adjudicating 159 rejected levers; cross-model re-audit (cc auditor → cod re-auditor) |
| `docs/CLAIM_COVERAGE_AUDIT.md` | Claim attestation audit | Audited 591 KEEP claims against incumbent-comparison evidence; found 2.0% attested; corrected its own prior flattering revision |
| `docs/progress/perf-negative-results.md` | Negative-result ledger | Rule: "record every attempted optimization lever before the next batch"; across-run reproducibility rule (2026-08-06) |
| `docs/GAUNTLET_RELEASE_SCORECARD.md` | Scorecard | Head-to-head vs unpatched NetworkX 3.6.1 baseline with A/A null CIs per row |
| `docs/RELEASE_SCORECARD_cc.md` | Scorecard (cc lane) | Lane-parallel scorecard variant |
| `docs/history/REALITY_CHECK_2026-09-02.md` | Vision-vs-reality audit | 17-item vision checklist vs tree/gh/PyPI/this-host verification; headline: "The library is real and fast. The product is not shipped" |
| `docs/history/PHASE2C_EXTRACTION_PACKET.md` | Execution packets | 9 implementation tickets (FNX-P2C-001…009) with legacy anchors, target crates, oracle tests, machine-checkable artifact template |
| `docs/delegation_ledger.md` + `.json` | Claim matrix (generated) | Auto-generated per-function routing classification (rust-native vs nx-fallback vs py-wrapper), static AST + runtime probes |
| `docs/upstream_divergence_ledger.md` + `.json` | Claim matrix (generated) | Per-function divergence table: native-parity / wrapper-patched / intentionally-delegated / raw-known-gap / owner-acknowledged-limitation |
| `docs/raw_vs_public_audit.md` + `.json` | Claim matrix (generated) | Raw binding output vs public wrapper output audit |
| `docs/api_ergonomics_audit.md` + `.json` | Claim matrix (generated) | API ergonomics audit |
| `docs/coverage.md` | Machine-checked surface | Generated from `franken_networkx.__all__`; README claims checked against it |
| `docs/CLAIM_COVERAGE_AUDIT.md` | (see above) | — |
| `docs/ZERO_COPY_VIEW_PRIMITIVE.md`, `docs/integer_adjacency_epoch.md` | Design records | Deep design notes on specific subsystems |
| `artifacts/phase2c/` | Packet evidence | Versioned schemas + `packet_topology_v1.json` + `essence_extraction_ledger_v1.json` + machine-check scripts |
| `artifacts/conformance/v1/` | Gate contracts | Machine-checkable `ci_gate_topology_v1.json` + schema; `phase2c_packet_readiness_gate.rs` in `crates/fnx-conformance/tests/` |
| `scripts/perf_ledger_preflight.py` | Enforcement tooling | Pre-commit gate enforcing verdict-contract fields on ledger rows; `--audit` mode reproduces claim-coverage counts |
| `scripts/perf_harness.py` | Enforcement tooling | Benchmark harness with A/A null gates, host-exclusivity admission (fails closed), ELF provenance capture |
| `tests/artifacts/perf/*/replicate_*.sh` | Reproducibility | Per-verdict reproduction scripts committed alongside rows |

**Missing from the suite pattern** (see §7): no `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`; no `CLAUDE.md`/`MUSE.md`/`.claude/`; no `docs/research/**`; no ADRs; no standalone auto-demotion rule doc.

---

## 2. Execution-readiness gates

The V1 spec (`docs/planning/COMPREHENSIVE_SPEC_FOR_FRANKENNETWORKX_V1.md` §11) defines four release acceptance gates [Verified]:

> Gate A: compatibility parity report passes for V1 scope.
> Gate B: security/fuzz/adversarial suite passes for high-risk paths.
> Gate C: performance budgets pass with no semantic regressions.
> Gate D: RaptorQ durability artifacts validated and scrub-clean.
> All four gates must pass for V1 release readiness.

The same spec §18 defines the CI gate topology G1–G8 (format/lint → unit/integration → differential conformance → adversarial → e2e → perf/isomorphism → reliability budgets → durability scrub), all blocking, with [Verified]:

> 1. Gate order is strictly `G1 -> G2 -> G3 -> G4 -> G5 -> G6 -> G7 -> G8`.
> 2. Every gate is fail-closed and release-blocking.
> 3. First failing gate short-circuits downstream gates and must emit a budget/policy-linked failure envelope with deterministic replay command(s).

The master porting plan (`docs/planning/PLAN_TO_PORT_NETWORKX_TO_RUST.md` §6) makes each phase's entry/exit explicit, e.g. [Verified]:

> ### Phase 2: Deep Structure Extraction
> - entry: unresolved legacy behavior contracts
> - exit: `EXISTING_NETWORKX_STRUCTURE.md` contains behavior, invariants, edge zones, and verification crosswalk
>
> ### Phase 5: Conformance and QA
> - exit: differential parity, adversarial coverage, structured replay metadata, and durability evidence gates are green

And the parity-promotion gate (`docs/planning/FEATURE_PARITY.md`) [Verified]:

> Rule: parity status can move to `parity_green` only after the canonical pytest parity suite covers the public behavior and the curated fixture/evidence layer is refreshed where applicable. Implementation completion alone does not count.

The perf-ledger verdict contract (`docs/NEGATIVE_EVIDENCE.md`, "Ledger verdict contract (2026-07-27)") — the most elaborated gate in the repo [Verified]:

> Every new performance verdict is classified against the comparison actually measured:
> - A campaign result uses `comparison_class=INCUMBENT`, names `incumbent=networkx`, records `incumbent_same_invocation=true` and a numeric `incumbent_ratio` greater than `1.0x`, and sets `campaign_output=true`.
> - A before/after result within FrankenNetworkX uses `comparison_class=SELF-SPEEDUP` and `campaign_output=false`. It is maintenance, even when the source change ships; it must not use a `WIN` heading or support a competitive claim.

AGENTS.md's RULE 0.5 (suite-wide rules, referencing the unavailable `/data/projects/AGENTS.md`) adds the agent-level gates [Verified as quoted in AGENTS.md; the suite file itself is Absent from this repo]:

> a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence standard and publish the win/lose split of what the fix admits; and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative.

Per-commit gate in AGENTS.md [Verified]:

> `ubs <changed-files>` before every commit. Exit 0 = safe.

And the hard-learned refinement of that same gate, from a real misread incident [Verified]:

> **`ubs` exits 0 when its scanner module TIMES OUT, having scanned nothing.** … Always read the `Files:` count, not just the exit code and the zero lines.

---

## 3. Honesty guardrails

This repo's planning is dominated by honesty machinery — how to *prove* claims, not just how to build. Installed in layers over the project's life:

**Negative-evidence ledgers (lifecycle: running since at least 2026-06; contract formalized 2026-07-27)** [Verified]. Three ledgers — `docs/NEGATIVE_EVIDENCE.md`, `docs/NEGATIVE_EVIDENCE_cc.md` (Claude-Code lane), `docs/progress/perf-negative-results.md` — record losses, neutral results, rejected levers, and self-corrections in the same format as wins. The standing rule (`docs/progress/perf-negative-results.md`) [Verified]:

> Rule: record every attempted optimization lever before the next batch so slow, neutral, and correctness-risky routes do not get retried without new evidence. Entries marked `pending` are not performance keeps.

**Claim matrices (lifecycle: auto-generated; delegation ledger bead `br-r37-c1-256q5`)** [Verified]. Four machine-generated matrices bind public claims to implementation reality: `delegation_ledger` (what actually executes per function: rust-native vs nx-fallback), `upstream_divergence_ledger` (460 native-parity, 24 wrapper-patched, 181 intentionally-delegated, 1 raw-known-gap, 1 owner-acknowledged-limitation), `raw_vs_public_audit`, `api_ergonomics_audit`. The REALITY_CHECK verifies README against them (2026-09-02: README said 82.3% coverage, ledger said 84.0%, live generator said 92.6% strict-present [Verified]).

**Auto-demotion (no standalone rule doc [Absent]; mechanism exists in ledger practice)** [Verified as practice]. The `_cc` ledger records an agent demoting its own finding: "frequency is demoted from 'mechanism found' to 'a covariate that explains some within-window variation'. The bead goes back to open on its central question." (`docs/NEGATIVE_EVIDENCE_cc.md:15476`). Beads also carry pre-registered falsification: "padm6 predicted that 91% of the published `0.59x` loss was ebunch-endpoint membership testing… 'if it does NOT move, the 91% attribution was wrong and that is the finding.'" (`docs/NEGATIVE_EVIDENCE.md:3074`) [Verified].

**Receipt-bound evidence (lifecycle: continuous via beads + pre-commit tooling)** [Verified]. `.beads/issues.jsonl` schema: `close_reason, closed_at, compaction_level, created_at, description, id, issue_type, original_size, priority, source_repo, status, title, updated_at`. Close reasons carry evidence inline, e.g. "batch-verified-green (2850 cases across 21 test files, 0 failures)". The suite work-graph discipline quoted in AGENTS.md RULE 0.5 demands "closure on cited evidence with blocker beads gated on their named probe" and "`br dep cycles` stays empty" [Verified]. `scripts/perf_ledger_preflight.py` (45,756 bytes [Verified]) enforces verdict-contract fields on ledger rows as a pre-commit gate and reproduces audit counts via `--audit`.

**Cross-model audit of the auditors (lifecycle: 2026-07-25 → 2026-07-27)** [Verified]. `docs/LEDGER_RESURRECTION.md`: "Auditor: BlackThrush (cc / Lane M), 2026-07-25" re-adjudicated 159 rejected levers under a six-class taxonomy adopted fleet-wide from frankenfs; "Model-integrity re-auditor: CloudyTurtle (cod / Lane M), 2026-07-27" re-read the audit and found its headline claim unsound — the first pass's "25 rescued VALID-MECHANISM rows" were re-classified (15 were VALID-AB, 8 VOID-NONULL, 1 void on CV, 1 VOID-ZEROSELF), correcting the headline from 74.8% to **81.8% VOID (130/159)**. The mechanism is named agents on two model lanes (cc = Claude Code, cod = Codex) checking each other's reasoning, not just outputs [Verified].

---

## 4. Plan→agent execution

**Task graph:** Beads is the work graph [Verified]. Agents pick work via `br ready --json` / `bv --robot-*` (graph-aware triage: PageRank, critical path, cycles — "bv handles *what to work on* (triage, priority, planning)" per AGENTS.md). Dependencies are explicit (`br dep add`); 3,677 issues with types task/bug/perf/test/feature/epic/docs/chore and priorities P0–P4 (2,073 at P2). Issue IDs encode run+lane (`br-r37-c1-*`, `cod-a`/`cod-b` actors). 31 in_progress / 8 open / 6 blocked at HEAD.

**Coordination (multi-agent swarm):** MCP Agent Mail for identities, inboxes, searchable threads, and advisory file reservations [Verified, AGENTS.md]. The flow: reserve files (`file_reservation_paths`) → announce start in a thread keyed to the bead ID (`thread_id="br-123"`) → work → reply in-thread → close bead → release reservations. **Drift prevention:** "You NEVER, under ANY CIRCUMSTANCE, stash, revert, overwrite, or otherwise disturb in ANY way the work of other agents" — a hard rule born from ~dozens of concurrent agents colliding several times per minute [Verified, AGENTS.md].

**Packet execution:** `docs/history/PHASE2C_EXTRACTION_PACKET.md` (2026-02-13) converts analysis into 9 tickets (FNX-P2C-001…009), each with legacy anchors, target crates, and oracle tests; every ticket "MUST produce" a fixed artifact set (`legacy_anchor_map.md`, `contract_table.md`, `fixture_manifest.json`, `parity_gate.yaml`, `risk_note.md`) in the same PR, with versioned schemas and machine-check commands [Verified]. A `phase2c_packet_readiness_gate.rs` test exists in `crates/fnx-conformance/tests/` [Verified].

**Verification loops:** spec-first protocol — "Implement only from those docs and packet artifacts… Do not consult legacy code for implementation mechanics once spec section is complete" (`PLAN_TO_PORT_NETWORKX_TO_RUST.md` §2, §7) [Verified]. Quality loop after any substantive change: `cargo check` → `clippy -D warnings` → `cargo fmt --check` → offloaded (`rch`) conformance/pytest gates [Verified]. Machine-protection rules guard test runs (RSS guards, timeouts) after a 148 GB incident [Verified].

**Session discipline ("Landing the Plane"):** mandatory end-of-session checklist — file issues for remaining work, run quality gates, update issue status, `br sync --flush-only`, hand off context [Verified]. The suite pattern of "never let sessions compact" is **not stated in this repo** [Absent]; the beads schema carries `compaction_level`/`original_size` fields but all 3,677 issues are level 0 [Verified]. Handoffs are via Agent Mail threads and bead state, not compaction policy.

---

## 5. State-of-the-art coverage

**The "research" here is legacy-extraction, not competitor/literature research** [Verified]. There is **no `docs/research/**` directory, no competitor survey, no literature-review mechanism** [Absent]. State-of-the-art coverage is handled three ways:

1. **Legacy oracle as ground truth:** vendored `legacy_networkx_code/` (1,247 files) + `docs/planning/EXHAUSTIVE_LEGACY_ANALYSIS.md` (measured hotspot inventory: top file `weighted.py` 2,542 lines) + `EXISTING_NETWORKX_STRUCTURE.md` [Verified]. The incumbent is NetworkX itself; competitors like graph-tool/igraph are not surveyed [Absent].
2. **Alien-artifact uplifts (external):** method stack "`$alien-artifact-coding` + `$extreme-software-optimization`" (`EXHAUSTIVE_LEGACY_ANALYSIS.md:4`); agents harvest techniques from `/data/projects/alien_cs_graveyard/*.md` — **that path does not exist on this machine or in this repo** [Verified as referenced; content Absent]. A bead description confirms: "profile -> /alien-graveyard … + /alien-artifact-coding to harvest the technique -> /extreme-software-optimization to ship" (`br` in_progress bead, 2026-06-02 directive) [Verified].
3. **Exemplar reference:** the V1 spec copies `reference_specs/COMPREHENSIVE_SPEC_FOR_FRANKENSQLITE_V1.md` "for direct consultation" [Verified] — cross-repo planning reuse, not external literature.

---

## 6. Anti-satisficing

**Reality checks (lifecycle: 2026-04-23, 2026-05-03, 2026-04-08 bridge plan, 2026-09-02)** [Verified]. The 2026-09-02 check verified every claim against "the tree, `gh`, PyPI, or a run on this host" using a 17-row vision checklist. Headline verdict [Maintainer claim, quoted]:

> The library is real and fast. The product is not shipped, and the evidence pipeline that the README calls "load-bearing" has never run.
> CI on `main` has **0 successful runs out of 6,947**. … The bead that tracked shipping (`franken_networkx-ciq6`) is CLOSED.

It also documents follow-through fixes in the same session (beads re-opened, stale docs corrected) — the audit is wired back into the task graph, not just published [Verified].

**Claim-coverage audit (2026-07-31)** [Verified]. Trigger: "fleet policy — a perf KEEP requires a vs-incumbent ratio. frankenfs audited itself and found 67 of 186 KEEP claims carried none. This is the same audit run here." Finding: **12 of 591 KEEP rows** carried a same-invocation incumbent ratio (2.0% attested; 11 genuinely unconvertible, 568 simply unmeasured). Re-measured 22 claims: **16 of 21 decidable excluded their published figure** (both directions — "The table is *stale*, not systematically inflated in our favour"). It also **corrected its own previous revision's flattering split** ("That split was wrong, and it flattered us") and identified a misdiagnosed root cause ("That diagnosis was wrong") [Verified].

**Ledger resurrection (2026-07-25/27):** 81.8% of 159 historically rejected levers were VOID (could not prove their rejection) [Verified, §3]. The campaign then re-ran the rehabilitation queue: "Yield: 7 re-run, 2 re-won, 3 recovered to near parity, 2 confirmed still open" [Verified].

**Red-team as a named function:** [Absent]. No red-team doc, exercise, or role exists by that name. The closest analogues are the pre-registered falsifications, planted negatives (e.g. "17 new tests including a planted negative", REALITY_CHECK_2026-09-02 [Verified]), the "adversarial coverage" required by Phase 5 exit, and the cross-lane model-integrity re-audit.

---

## 7. Explicit absences

| Expected from suite pattern | Status in franken_networkx |
|---|---|
| `ROADMAP.md` / `BEADS.md` / `TODO.md` / `PLAN.md` | [Absent] — root has only AGENTS/CHANGELOG/CONTRIBUTING/README/SECURITY/UPGRADE_LOG |
| `CLAUDE.md` / `MUSE.md` / `.claude/` agent instructions | [Absent] — only AGENTS.md; note AGENTS.md defers to suite-wide `/data/projects/AGENTS.md`, which is **not in the repo and not on this machine** |
| `docs/research/**` | [Absent] |
| ADRs (architecture decision records) | [Absent] — decisions live in ledger rows and FEATURE_PARITY scope boundaries instead |
| Definition-of-done doc | [Partial] — only phase-level DoDs inside `EXHAUSTIVE_LEGACY_ANALYSIS.md` ("Definition of done for Phase-2") |
| Auto-demotion rules | [Absent as rules; present as practice] — demotions happen in ledger rows; no policy doc |
| Named red-team / falsification campaign | [Absent as named function; present as technique] — pre-registered falsifications, planted negatives |
| Competitor / literature / state-of-art mechanism | [Absent] — incumbent-only (NetworkX); external alien-graveyard referenced but not in repo |
| "Never compact sessions" policy | [Absent] — not stated; beads schema supports compaction (`compaction_level`) but all 3,677 rows are level 0 |
| Receipt-bound evidence | [Present] — close_reason evidence strings + pre-commit preflight enforcement |

---

## 8. Maturity verdict

**Mature** — with an unusual center of gravity. The *build* planning (phases, packets, milestones, gates A–D, CI topology G1–G8, 90-day plan) is thorough and machine-checkable. But what distinguishes this repo is that its most elaborated, most enforced planning layer is the **honesty apparatus**: verdict contracts with pre-commit enforcement, A/A-null and host-exclusivity gates that fail closed, negative-evidence ledgers as first-class artifacts, claim matrices generated from the tree, claim-coverage audits that correct their own prior flattery, a resurrection audit of rejected levers, periodic reality checks that check vision against PyPI/CI/this-host — and a second model lane re-auditing the first model's audit. The planning answers "how will we know we're not fooling ourselves" at least as carefully as "what will we build." Gaps are narrow and explicit: no research/competitor coverage, no named red-team, no auto-demotion policy doc, no in-repo suite-wide rules — and the 2026-09-02 reality check's own headline is that the evidence pipeline the planning calls load-bearing has never run green end-to-end, which the planning system itself surfaced.

---

## Appendix: verbatim gate/checklist/sign-off quotes (consolidated)

- "Line-by-line translation is forbidden." — `docs/planning/PLAN_TO_PORT_NETWORKX_TO_RUST.md` §1
- "Implement only from those docs and packet artifacts." — same, §2
- "no docs -> phase 1 … implementation active with parity verification -> phase 5" (phase detection decision tree) — same, §5
- "All four gates must pass for V1 release readiness." — `COMPREHENSIVE_SPEC_FOR_FRANKENNETWORKX_V1.md` §11
- "Every gate is fail-closed and release-blocking." — same, §18
- "reporting a loss is a success — one line, revert, next lever, no retraction narrative." — `AGENTS.md` RULE 0.5
- "never weaken a gate to land a change" — `AGENTS.md` RULE 0.5
- "YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION." — `AGENTS.md` RULE 1
- "Rule: record every attempted optimization lever before the next batch so slow, neutral, and correctness-risky routes do not get retried without new evidence." — `docs/progress/perf-negative-results.md`
- "The table is *stale*, not systematically inflated in our favour." — `docs/CLAIM_COVERAGE_AUDIT.md`
- "The library is real and fast. The product is not shipped, and the evidence pipeline that the README calls 'load-bearing' has never run." — `docs/history/REALITY_CHECK_2026-09-02.md`
