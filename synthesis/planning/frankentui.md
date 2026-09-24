# Planning-Methodology Analysis: frankentui

Repo: https://github.com/Dicklesworthstone/frankentui — analyzed at depth-1 clone, HEAD commit `b37eff5` (2026-09-22, "chore(beads): record a third variable-height bug and the test gap on bd-wleec").
Scratch location used: `~/workspace/franken-research/synthesis/planning/work/plan-frankentui` (`/tmp/plan-frankentui` was unusable — /tmp tmpfs 92% full, initial clone died with "No space left on device").

Note on tier labels: [Verified] = I read the artifact in the repo file. [Maintainer claim] = Emanuel's own prose, quoted verbatim. [Inference] = my reasoning from multiple artifacts. [Absent] = searched and not found.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `AGENTS.md` (root, 51 KB) | Agent operating instructions | Plan-first execution contract: rules, DSR-only verification, Beads/Agent Mail/bv workflow, "Landing the Plane" session closeout |
| `docs/planning/plan-to-create-frankentui-opus.md` (4,799 lines) | Origin plan A | The detailed genesis plan — executive blueprint, quality gates, phases, invariants; the Main TODO Inventory A–K is still live work |
| `docs/planning/plan-to-create-frankentui-codex.md` (501 lines) | Origin plan B | Second model's independent plan ("the second model"), condensed counterpart to the opus plan |
| `docs/planning/plan-to-port-tui-inspector-to-rust.md` | Feature plan | Migration plan for porting a TUI inspector |
| `docs/planning/doctor-frankentui-proposed-architecture.md` | Subsystem plan | Design for the doctor_frankentui verification harness |
| `docs/planning/doctor-frankentui-feature-parity.md` | Subsystem plan | Parity checklist for doctor_frankentui |
| `docs/planning/existing-tui-inspector-structure.md` | Recon brief | Inventory of the structure being ported |
| `docs/planning/reality-check-2026-09-01.md` (3,721 lines) | Truth audit + bridge plan | Periodic reality assessment: five questions answered against retained evidence, retained-failure ledger, bridge revision, G43–G47 workstreams |
| `docs/planning/UPGRADE_LOG.md` | Run log | Upgrade/maintenance run record |
| `docs/definition_of_done.md` | Definition of done | "Alien Artifact" checklist + stop-ship criteria |
| `docs/claims-ledger.md` | Claim matrix | 152 rows (C/V/S/N) tracking every README/AGENTS claim with proof grammar, statuses (proven/pending-code/pending-doc/retracted/allowlisted), owner beads |
| `.beads/issues.jsonl` + `.beads/beads.base.jsonl` | Task tracker | 3,111 issues (2,918 closed, 156 open, 35 in progress, 2 blocked); JSONL is source of truth, `beads.db` disposable |
| `.beads/policy.yaml` | Close-time gates | Enforces 80-char close reasons + typed `kind:value` evidence references; recorded bypasses |
| `.beads/config.yaml`, `metadata.json` | Tracker config | Prefix `bd`, JSONL export config |
| `docs/main-todo-bead-map.md` | Plan→bead map | Maps the opus plan's Main TODO Inventory (A–K) to concrete bead IDs — the execution tracker |
| `docs/operational-playbook.md` | Execution process | Merge-gate rules, ADR discipline, phased deliverable order, agent-ergonomic checklist |
| `docs/risk-register.md` | Failure-mode planning | 7 risks (R1–R7) with mitigations tied to code/tests/beads + quarterly review triggers |
| `docs/pane-release-gate-policy.md` | Release gate | Objective GO/NO-GO policy: clauses, advisory/strict/ga modes, override process, staged rollout |
| `docs/pane-operational-runbook.md` | Incident response | Rollback/conservative-policy playbook (referenced; read not required for this pass) |
| `docs/adr/` (ADR-001…ADR-011 + README) | Decision records | Locked decisions with alternatives, consequences, test plans |
| `docs/one-writer-rule.md` | Architecture law | User guidance for the one-writer rule (ADR-005) |
| `docs/spec/` (~35 docs) | Contracts | Kernel/pane/webgpu/evidence manifests, correctness, conformance contracts |
| `docs/spec/pane-release-evidence-manifest.md` | Evidence schema | Bundle schema consumed by the release gate |
| `docs/testing/no-mock-policy.md` | Test-honesty rule | Allowed vs disallowed test doubles — anti-satisficing for tests |
| `docs/profiling/extreme-optimization-loop.md` | Perf-honesty loop | Mandatory 7-step loop per perf change (baseline→isomorphism proof→checksum gates) |
| `docs/mermaid-coverage-gap-ledger.md` | Coverage gap ledger | Per-diagram-family support audit with owning bead per gap |
| `docs/frankenterm-js-release-readiness.md` | Release readiness | Subsystem readiness assessment |
| `CHANGELOG_RESEARCH.md` | Research report | Changelog audit methodology, sources, validation (commit-link ancestry, live link checks) |
| `slo.yaml` | Perf goals | SLO objectives/budgets (311 lines) |
| `scripts/pane_release_gate.py`, `check_readme_claims.py`, `check_close_evidence.py`, `pane_release_evidence.py`, `check_module_reachability.py` | Enforcer scripts | Machine-checkable gates run via `make gates`, `make claims`, `make close-audit` |
| `Makefile` | Gate runner | `make gates` (4 stdlib checks, ~6s), `make claims`, `make reachability`, `make close-audit` |
| `docs/migration-map.md`, `compat-matrix.md` | Migration planning | Terminal compatibility and migration maps |

---

## 2. Execution-readiness gates (what a plan must pass before agents are set free)

The "plan first" gate is the opus plan's Executive Blueprint itself [Verified] (`docs/planning/plan-to-create-frankentui-opus.md`): Part 0 locks the engineering contract before any implementation. Verbatim core gates from that plan's §0.7:

> - **Gate 1: Inline mode stability** — "Re-rendering UI region while streaming logs cannot corrupt scrollback or cursor placement." [Verified]
> - **Gate 2: Diff/presenter correctness** — "Property tests: applying presenter output to a terminal-model yields the expected grid for supported ops." [Verified]
> - **Gate 3: Unicode width correctness** — "Test suite includes emoji/ZWJ/combining marks; no off-by-one wrapping errors allowed." [Verified]
> - **Gate 4: Terminal cleanup** — "PTY tests verify raw mode + cursor visibility + alt screen restoration after normal exit and panic." [Verified]

The operational-playbook's merge-gate checklist [Verified] (`docs/operational-playbook.md`, §1):
> - [ ] Unit tests cover the changed behavior
> - [ ] Property tests cover edge cases where applicable
> - [ ] PTY tests verify terminal state for lifecycle changes
> - [ ] The PR description cites which invariants are preserved
> - [ ] `cargo clippy --all-targets -- -D warnings` passes
> - [ ] `cargo fmt --check` passes
> - [ ] Coverage thresholds maintained

The strongest enforcement layer is the "Landing the Plane" session-closeout protocol [Verified] (`AGENTS.md`), verbatim rationale:

> "**Why this section names commands instead of categories.** It used to say 'Run quality gates (if code changed) — Tests, linters, builds', which names no gate, and 'Close finished work', which names no evidence. The 2026-09-01 reality check found the result: 99.9% bead closure alongside a front-page README example that neither compiled nor ran, 188 closes with no reason at all and 859 more under 20 characters. A step you can satisfy by believing you did it is not a step." [Maintainer claim, quoted verbatim]

Close-time gates [Verified] (`.beads/policy.yaml`): a bead close is rejected unless the reason is ≥80 characters AND carries a `kind:value` token from `commit, pr, reviewer, investigation, agent-mail, dashboard, bead, test, path, run`. Bypass requires `--bypass-reason` (recorded, not silent), and `make close-audit` catches closes written directly into the JSONL.

Release gating [Verified] (`docs/pane-release-gate-policy.md`): "The pane workspace ships only on an **objective, automated** verdict — never on subjective confidence." Three modes — `advisory` (structural completeness), `strict` (+checksums, provenance, differential certificate), `ga` (every declared suite *observed* green; "`declared` is itself blocking"). "A release is **blocked whenever any mandatory clause fails.**" Override requires: investigate first, record clause/reason/owner/expiry in release notes, and "`perf_certified` is **not** waivable".

---

## 3. Honesty guardrails (negative-evidence / claim matrix / demotion)

**Claim matrix — exists and is the centerpiece.** `docs/claims-ledger.md` [Verified] tracks 152 rows: 37 mismatch claims (C01–C37), 71 vision goals (V01–V71), 39 artifact-status claims (S01–S39), plus N rows. Each row has ID, exact claim text, location anchor, kind, decision (CODE/DOC/DOC+quarantine/regenerate/n/a), status (proven/pending-code/pending-doc/retracted/allowlisted), owner bead, proof, and `last_verified`. Key rule:

> "A README/AGENTS change that adds or changes a tracked claim must add or update its row in the same commit." [Verified]
> "A row becomes `proven` only when a named test pins the specific thing the README says, not something adjacent." [Verified]

Proof grammar is machine-checked: `test:` (named test), `path:`, `ident:`, `cmd:`, `count:`, `manual:` (dated, **expires after 90 days** — a built-in time-based demotion), `bead:` (unresolved obligation, "not a passing proof"). `scripts/check_readme_claims.py --proof-refs` validates that every `test:`/`path:` citation actually exists — installed because "on 2026-09-19 three rows cited tests that did not exist… each a near-miss for a real test, written from memory rather than looked up. A fabricated proof is worse than the `bead:` placeholder it replaces." [Maintainer claim, quoted verbatim]. As of 2026-09-19: 6 pending-code, 41 pending-doc, **56 retracted**, 49 proven.

**Demotion — exists as retraction + quarantine.** Retraction is the demotion mechanism: claims proven false are retracted in the ledger (e.g., C36/V19 retracted because "the SOS barrier coefficients were claimed to be SDP-solved by a script that does not exist; the source header says they were hand-chosen"). The `DOC+quarantine` decision is the demotion tier: code exists but is not on the production path, so README must carry a **Where it runs** line or say "runs nowhere". `make claims` enforces this: "On 2026-09-19 all eleven README sections carrying **Status: experimental** described their module in working present tense… while no crate imported any of them. Each such section must now carry a **Where it runs** line." [Verified] (`AGENTS.md`).

**Negative evidence — no ledger by that name [Absent]; the function is served by the reality-check's retained-failure discipline** [Verified] (`docs/planning/reality-check-2026-09-01.md`): "Failures are part of this result… The first browser attempt also invoked Playwright's recursive temporary artifact cleanup on disconnect… This incident is not erased by later passing checks." [Maintainer claim, quoted verbatim]. Each evidence row pairs an accepted observation with its remaining limit ("A passing isolated test is not a passing workspace aggregate"; "Node is not browser/GPU/Safari proof"). The doc's §"Anti-ceremony and honesty inventory" (lines 1788+) is a recurring audit artifact, and AGENTS.md mandates a **monthly drift check** via the `frankentui-truth-gates` DSR tool: "File a bead per drift row it reports."

**Reward-hacking taxonomy — exists as suite law.** The suite-wide `/data/projects/AGENTS.md` (referenced as binding, Rule 0.5) names 12 forbidden patterns [Maintainer claim, quoted verbatim]: "gate self-weakening… proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests, easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress, conformance metastasis, dependency smuggling, bench-path hardcoding." Plus three load-bearing rules: "a **self-speedup is MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never weaken a gate to land a change**… and **reporting a loss is a success** — one line, revert, next lever, no retraction narrative."

---

## 4. Plan→agent execution (task graphs, phases, verification loops, dialectical review; drift prevention)

**Task graph.** Work lives in `.beads/` — 3,111 issues [Verified], schema: id, title, description, status, issue_type (task/bug/feature/epic/docs/subtask/question), priority, labels, created/updated/closed timestamps, close_reason, creator, compaction_level. Named hierarchical IDs (`bd-g00-root-epic-ewths.5`, `.5.1`, children) encode the plan structure; `docs/main-todo-bead-map.md` maps the opus plan's Main TODO Inventory A–K to concrete bead IDs and is "the execution tracker so we do not need to reopen the plan to see intent." Drift prevention: single-writer on graph structure; JSONL is truth, `beads.db` disposable; `br sync --import-only` after every pull; `br dep cycles` stays empty [Verified] (AGENTS.md Rule 0.5).

**Phases.** The operational playbook mandates a 5-phase deliverable order (kernel → runtime → harness → widgets → extras) with per-phase exit criteria [Verified] (`docs/operational-playbook.md` §3), explicitly to prevent "the 'widget trap' (endless refinement of nice-to-haves before core is stable)". Also §6: explicit Out of Scope table ("Do not work on these until core is stable").

**Agent execution protocol** [Verified] (`AGENTS.md`): session flow is `bv --robot-triage` → claim bead → MCP Agent Mail file reservation → in-thread progress → close with 80+ char evidence reason → sync → commit → push → handoff. AGENTS.md embeds hard constraints: no file deletion ever, no script-based code edits, no file proliferation, no GitHub Actions (DSR only), Rule 0 override prerogative. Per-crate compiler gates are named commands, not categories (`cargo check --workspace --all-targets`, clippy `-D warnings`, fmt, rustdoc, nextest, `make gates`).

**Dialectical review.** There is **no "two models against each other" mechanism in this repo [Absent]** — but there is a functionally similar *named-agent separation-of-powers* pattern, exercised per-workstream in the reality check [Verified] (`docs/planning/reality-check-2026-09-01.md`): one agent implements (e.g., DustySalmon on stdin, IcyBarn-assisted), a *different* agent (IcyBarn) independently reviews source and test assertions *before* execution, and a third (GreenLynx) owns execution of the DSR/browser checks. Example verbatim: "IcyBarn independently reviewed source and test assertions; GreenLynx executed the browser checks. Review caught the initially invisible stopped rejection… all were corrected before this final run." [Maintainer claim, quoted verbatim]. Reviews are explicitly "independent source inspection" — not re-execution, and not second independent proof; the doc is careful to say "These are independent source reviews and one coordinated execution, not independent duplicate proof." The `doctor_frankentui` crate adds a verification-harness + intent-inference layer [Verified], but that is automated checking, not dialectics.

**Drift prevention.** Mechanisms: ADRs "never silently change accepted ADRs" [Verified] (`docs/operational-playbook.md`); the `Where it runs` machine check; `make reachability` (module must be referenced or have an open wiring bead — "Do not add a line to silence the gate"); `env-docs` scope honesty (documents its own blind spot: 91 env vars elsewhere it cannot see); all-features test sweep (2,300 tests the ordinary gate never builds); monthly `frankentui-truth-gates` drift audit with one bead per drift row [Verified] (AGENTS.md).

---

## 5. State-of-the-art coverage (research/competitor/literature mechanisms)

**No docs/research/ directory [Absent]**; no competitor-comparison or literature-scan document as such [Absent]. What exists instead:

- **Literature grounding for mathematical claims** [Verified] (`docs/planning/reality-check-2026-09-01.md`, G45): the claim/assumption ledger for conformal/e-process/alpha-investing/rough-paths/CMS/SOS names primary references — conformal prediction (arXiv:2107.07511), alpha-investing (Wharton working paper), signature uniqueness (arXiv:math/0507536) — with "The mathematical distinctions use those sources; implementation conclusions come from code." G45 explicitly falsifies misapplied math (e.g., "Alpha-investing's E[V]/E[R] claim omits the stabilizing convention in the literature").
- **Performance comparative measurement** [Verified] (`docs/profiling/extreme-optimization-loop.md`): mandatory 7-step loop per perf change — baseline (p50/p95/p99 + memory keyed by run_id + git SHA), profile, opportunity matrix (score ≥ 2.0 to proceed), one lever, **isomorphism proof**, verify (goldens + checksum gates), repeat. A "self-speedup is MAINTENANCE, not a win" rule requires the incumbent live in the same invocation. CHANGELOG_RESEARCH.md even retracts borrowed timing ratios: "The SAT report compares the tiled path plus prefilter against a flat diff; it does not isolate the prefilter's speedup. The changelog therefore describes work elimination and counters without borrowing its timing ratios."
- **Terminal-compatibility coverage** [Verified]: `docs/compat-matrix.md`, `docs/ansi-reference.md`, Windows compatibility docs, CPR9;1 declared protocol emulation — coverage of *host* variety, not competitor libraries. No ratatui/cursive/blessed comparison was found in the plans [Absent].

[Inference]: the program's stance on "state of the art" is *self-auditing against its own math and measurements* rather than surveying competitors; SOTA coverage is honest only where the repo can pin it to a named test or primary source.

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

- **No formal red-team exercise [Absent]**, but **adversarial testing is a standing requirement** [Verified]: `docs/testing/no-mock-policy.md` forbids "Mocking Terminal I/O to Avoid PTY Tests" — "Terminal lifecycle correctness **must** be tested via PTY"; real CSI/escape sequences through the real parser; "Do NOT create fake buffers, fake diffs, or fake presenters." The risk register (R2) mandates adversarial escape-injection PTY tests and fuzzing for untrusted output (ADR-006, sanitize-by-default).
- **Falsification is built into the gates** [Verified]: the pane gate's `suites_observed_green` blocks on `declared` suites in GA mode ("Missing, stale, skipped, duplicate, zero-case and substituted evidence cannot become GA success"); the gate selftest pairs validator tests with "CLI E2E that mutates one obligation of a real passing bundle at a time" (reality-check G44); the claims-checker exists because proofs were once fabricated from memory.
- **Planted-fault testing** [Verified]: browser smoke tests "planted package failures reject: missing JS, changed valid JS with unchanged integrity, wrong renderer source revision, API-version-only incompatibility" — negative controls are part of the recorded evidence.
- **The reality-check ritual is the campaign mechanism** [Verified]: dated assessment (2026-09-01, updated 2026-09-10) answering "The five questions" (what works / doesn't / blocks / would beads finish the vision / what lacks ownership) against current evidence, each with retained failures and explicit limits, feeding the bridge plan's ordered remaining work (G43–G47). "Skipped checks" are named as a failure mode: "a skipped check never becomes a pass by being omitted" (AGENTS.md).
- **Perf-honesty campaign** [Verified]: the extreme-optimization loop; V70's wall-clock budget was *fixed rather than waived* — "A gate that fails under the project's normal multi-agent load is not a gate", and the replacement test measures a machine-independent property (hash-probe-vs-scan ratio bound 8.0).

---

## 7. Explicit absences

1. **No ROADMAP.md, BEADS.md, TODO.md, PLAN.md at root** [Absent] — confirmed via filesystem check. Planning lives in `docs/planning/`, `docs/*.md`, and `.beads/`.
2. **No `docs/research/` directory** [Absent] — no research-brief phase, no competitor survey, no literature-scan doc.
3. **No negative-evidence ledger by that name** [Absent] — function covered by claims-ledger retractions, reality-check retained failures, and gap ledgers.
4. **No auto-demotion rule document** [Absent] — demotion is implemented as ledger retraction + quarantine + 90-day expiry on `manual:` proofs, not a separate auto-demotion policy. Only other demotion mention is a passing reference in reality-check ("demoted per G22").
5. **No two-models-run-against-each-other dialectic** [Absent] — two origin plans exist (opus + codex) which may be the two-model artifact at the *genesis*, but the live mechanism is named-agent review/execute separation (IcyBarn reviews, GreenLynx executes).
6. **No session-compaction ban or fresh-start ritual** — compaction is not mentioned; the anti-forgetting mechanism is receipts retained under `/data/retained/` + `cass` (cross-agent session search index) [Verified] (AGENTS.md).
7. **No GitHub Actions** — deliberately disabled 2026-09-06; DSR only [Verified].
8. **No CLAUDE.md/MUSE.md or .muse/** [Absent] — agent instructions live only in AGENTS.md (+ `/data/projects/AGENTS.md` suite-wide, which I did not read as it's off-repo).

---

## 8. Maturity verdict

**Mature.** frankentui has the densest planning methodology observed in the suite: a plan-first genesis (two independent plans), a 3,111-issue dependency-aware tracker whose close-time policy is *machine-enforced* (`br` rejects short/unevidenced closes; `make close-audit` catches direct JSONL edits), a 152-row claim matrix with a formal proof grammar and citation-existence checking, executable release gates with a non-waivable certification clause, a recurring truth-audit ritual with retained failures, a named reward-hacking taxonomy, and review/execute separation of powers across named agents. The distinctive signature is that **every honesty norm was installed *after* a measured failure** (the 188 empty close reasons, the three fabricated test citations, the 99.9%-closure vs. non-compiling README) — the methodology is a fossil record of discovered failure modes, each with its own gate. [Inference]

---

## Provenance appendix (files read in full for this report)

- `.beads/policy.yaml`, `.beads/config.yaml`, `.beads/metadata.json` (+ sampled `issues.jsonl` via jq-equivalent Python; statuses counted: 3111 issues)
- `AGENTS.md` (all 1116 lines)
- `docs/planning/reality-check-2026-09-01.md` (3,721 lines; substantial portions read verbatim; G43–G47, evidence tables, review passages quoted)
- `docs/planning/plan-to-create-frankentui-opus.md` (§0.x headings + §§0.7, 0.8, 0.14 read verbatim; 4,799 lines total)
- `docs/planning/plan-to-create-frankentui-codex.md` (headings + sampled sections)
- `docs/definition_of_done.md`, `docs/main-todo-bead-map.md`, `docs/risk-register.md`, `docs/operational-playbook.md`, `docs/pane-release-gate-policy.md` (full)
- `docs/claims-ledger.md` (all 152 rows' C/V sections read verbatim + update rules)
- `docs/testing/no-mock-policy.md`, `docs/mermaid-coverage-gap-ledger.md`, `CHANGELOG_RESEARCH.md`, `docs/profiling/extreme-optimization-loop.md` (head/intro sections)
