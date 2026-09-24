# FrankenCodeBrowser — How Emanuel Plans

**Repo:** `franken_code_browser` (https://github.com/Dicklesworthstone/franken_code_browser), cloned 2026-09-22 (shallow, depth 1). Analyzed as planning artifacts only.

**One-sentence summary:** Emanuel's planning here is a *normative, machine-checkable contract stack*: one 309KB plan document owns the complete technical spec, a Python script mechanically validates the plan's dependency graph and citations, probes auto-downgrade qualification claims against a receipt-bound upstream ledger, and agents execute via Beads with code-first waves closed only by an independent verifier — but the dialectical two-model loop, session-compaction rule, and separate planning/research dirs found in the suite stereotype are all absent from this repo.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKEN_CODE_BROWSER.md` | Normative master plan (309KB, 32 sections, 97 work packages) | Owns product thesis, architecture, per-subsystem specs, G0–G7 gates (§28), work graph with per-package completion evidence (§29), risks/rejections/reviews (§30), traceability/checklist (§31), research ledger (§32) |
| `AGENTS.md` | Agent operating instructions | Workflow, non-negotiable engineering contracts, verification discipline, and the "Active swarm: code-first work and independent verification" execution protocol |
| `ROADMAP.md` | Gate sequencing summary | G0–G7 product gates table with required evidence per gate, start-here package order, completion rules |
| `IMPLEMENTATION_STATUS.md` | Dated ground-truth inventory (snapshot Sep 14, 2026) | What actually exists vs. plan; states "no product gates passed" |
| `DEPENDENCY_CONSTITUTION.md` | Dependency admission policy | First-party closure rule, platform allowances, unsafe boundary, upstream admission map, integration record requirements |
| `LOCAL_QUALIFICATION_AND_RELEASE.md` | Verification contract | Evidence-by-lane table (Establishes / Does not establish), runner policy, adversarial coverage, release sequence |
| `ARCHITECTURE.md` | Supporting spec summary | Library/app separation, ownership, source/frame invariants |
| `SECURITY.md` / `PRIVACY.md` | Supporting spec summaries | Untrusted inputs, root grants, source handling, exports |
| `scripts/check_plan_graph.py` | Plan-graph mechanical validator | Checks package contiguity, acyclicity, release reachability from FCB-064, headless/native isolation, citation defined+used, anchors, numbering, links, package-count consistency across sibling docs |
| `scripts/closure_probe.py` + `scripts/platform_probe.py` | Dependency-closure qualification probes | Inspect Cargo closure without compiling; verdicts qualified/noncompliant/incomplete; auto-downgrades qualification against the extension ledger |
| `scripts/extension_ledger.py` + `scripts/upstream_extension_ledger.json` | Upstream landing-receipt ledger | Machine-readable receipts for cross-repo landings (owner, public API, exact commit, closure delta, upstream tests, FCB consumer route); validator verdicts accepted/rejected/incomplete |
| `tests/test_closure_probe.py`, `tests/test_closure_probe_adversarial.py`, `tests/test_extension_ledger.py`, `tests/test_platform_probe.py` | Adversarial self-tests of the tooling | The honesty machinery is itself tested adversarially |
| `ledger-receipts/unittest.log` | Retained test receipt | 17/17 extension-ledger validator tests passing |
| `.beads/issues.jsonl` | Task-tracker database (438 issues) | 97 epics (one per FCB package) + 334 tasks + 6 features + 1 bug; child pattern FCB-NNN.A/.B/.V (implementation / implementation / production-verification); labels phase-g0…g7, wp-NNN, owner-*, r4, batch-pending; statuses 231 closed / 11 in_progress / 196 open |
| `.beads/config.yaml`, `.beads/metadata.json` | Tracker config | Issue prefix `fcb`, JSONL export wiring |
| `.github/ISSUE_TEMPLATE/` | Issue templates | bug_report, design_issue |
| `probes/headless_consumer/` | Consumer verification probe | Independent headless library consumer (tests feature closure/ownership) |
| `diag/cargo-diag.txt` | Diagnostic dump | Cargo diagnostics |

[Verified] All paths above were read or listed in the cloned repo.

---

## 2. Execution-readiness gates

Gates in this repo are **evidence gates**: a plan passes into execution only via specified, retained evidence — never via artifacts, prose, or badges.

**Global completion rule** ([Verified], `ROADMAP.md`):

> "A work package is complete only when its production behavior and specified evidence exist. Cross-repository work needs the owning upstream commit, its tests and a public FCB consumer. A trait, success-shaped JSON, mock renderer or screenshot is not sufficient."

**Per-package gate** ([Verified], plan §29 intro): "Each completion requires its production-path test or retained evidence." Every one of the 97 work packages in §29 carries a **Completion evidence** column (e.g., FCB-008: "Integrated native app uses a single qualified runtime and clean closure"). There is no separate "definition of done" document — the DoD *is* this column plus the global rules. [Inference]

**Plan-edit gate** ([Verified], `ROADMAP.md`): "Run `python3 scripts/check_plan_graph.py` after any plan edit, and never silently alter dependencies to make a queue appear ready."

**G0 foundation gate** ([Verified], plan §28.2): "**G0 passes when:** there is a committed, reproducible dependency/safety design; the required narrow runtime profile is implemented and passes focused host/owned-lifecycle tests; early byte/completion/retirement admission is enforced; the inert library and owner-qualified instances work; native window/text/Metal lifetimes and initial accessibility range contracts work; the key upstream-owned Markdown contracts are validated; and a strict-compliant foundation build is demonstrated. … Missing runtime or native-boundary proof blocks G0 itself. No release can pass while any shipping closure violation remains."

**Gate independence** ([Verified], plan §28.10):

> "Functional completeness, memory safety, dependency compliance, visual quality, and performance qualification are independent gates. A fast prototype cannot waive dependency policy. A clean dependency tree cannot waive broken selection. A pretty screenshot cannot waive actual native integration."

**Truth-over-artifact rules** ([Verified], `AGENTS.md`):

> "Code, tests, and retained execution evidence establish implementation status. A requirement does not become implemented because it appears in a plan or registry. When artifacts disagree, identify the owning requirement and repair the drift; never silently lower a gate."

> "At bootstrap this is a documentation-only repository. … Do not invent build/test successes."

> "Do not claim a gate passed from a trait, stub, fabricated response, or an unexecuted test."

**Dependency admission** ([Verified], `DEPENDENCY_CONSTITUTION.md`): "G0 admits the exact foundation slice and tracks unintegrated components separately. Missing runtime or native-boundary proof blocks G0. Every new shipping edge must pass admission; no full release passes with an unresolved shipping closure violation."

**Release gate** ([Verified], `LOCAL_QUALIFICATION_AND_RELEASE.md`): the 7-step release sequence (snapshot selection → closure verification → lane execution → binary build → launch exercises → sign/notarize → published-asset verification), with "A dry run, queue admission, remote compile start, timeout or fallback is not a completed qualified run."

---

## 3. Honesty guardrails

No file is named "negative-evidence ledger" or "claim matrix" [Absent] — but the functions those would serve are implemented three ways: as **plan-embedded ledgers**, as **executable claim-downgrade tooling**, and as **anti-cheating enforcement**.

### Receipt-bound evidence ledger (plan §32)

[Verified] Plan §32 ("Research provenance and source ledger") records every sibling-repo source review as: repository, file, line range, **GitHub blob SHA**, and "Key supported findings" — with explicit scope limits:

> "The blob hashes identify the reviewed file content returned by GitHub; **they are not repository commit hashes**."

> "Accordingly, this plan bases its concrete graph implementation observations on the inspected graph-class source and algorithm manifest, not on a claimed reading of that oversized algorithm file." (§32.1)

The R2/R3/R4 revision statements each end with an explicit non-claim ([Maintainer claim], quoted verbatim):

> "No running browser, compiled public API, upstream implementation commit, repository mutation, strict-compliant build closure, Mac GPU result, or native performance qualification is claimed. Structural document checks validate references, naming and work dependencies; they do not prove the future implementation's correctness." (§32.6)

> "The boxes are deliberately unchecked. They express future acceptance, not work completed while writing this plan." (§31.2, release checklist)

§32.4 "What has and has not been delivered" enumerates non-deliverables: "a running FrankenCodeBrowser binary, a new native bridge, committed upstream refactors, a compliant resolved application dependency graph, … or completed release qualification."

### Executable claim demotion (the auto-demotion analog)

[Verified] `scripts/closure_probe.py` carries qualification states `qualified` / `noncompliant` / `incomplete` and auto-downgrades them against the extension ledger:

> "A rejected ledger means a landing receipt violates the closure and landing discipline, so a ``qualified`` result is downgraded to ``noncompliant``. An unverifiable ledger degrades ``qualified`` to ``incomplete``; it never upgrades a failing result."

The extension-ledger validator rejects receipts that use a **research blob hash as a commit** (`BLOB_ID_AS_COMMIT`), moving branch pins (`MOVING_BRANCH_PIN`), path-patch receipts (`PATH_PATCH_RECEIPT`), and disallowed origins (`DISALLOWED_ORIGIN`). These are machine-enforced honesty rules, covered by 17 passing tests retained in `ledger-receipts/unittest.log` (e.g., `test_research_blob_id_as_commit_is_rejected`, `test_probe_downgrades_on_incomplete_ledger`, `test_probe_without_ledger_keeps_contract`).

### Anti-cheating enforcement

[Verified] `AGENTS.md` names satisficing behaviors as defects:

> "Gate self-weakening, proof laundering, refusal farming, commit pumping, follow-up laundering, dependency smuggling and demo hardcoding are defects. The coordinator inspects for them every few ticks and reopens unsupported closes with an incident comment. Commit count is not a KPI."

[Verified] `LOCAL_QUALIFICATION_AND_RELEASE.md`:

> "Missing required capabilities must appear explicitly, rather than disappearing from a registry to make it green."

> "A regression fix cannot improve the test result by lowering resolution, reducing the corpus, disabling syntax/Markdown, or excluding slow frames without an explicit new test lane." (plan §25.8)

**When installed:** the honesty apparatus is installed *before* execution, not after — the ledger, probes, and anti-cheat rules are all in the plan/bootstrap commit (only one commit visible in this shallow clone; `IMPLEMENTATION_STATUS.md` is dated Sep 14, 2026 and describes the plan as "R4", i.e., the plan itself went through four reviewed revisions before implementation began). [Verified/Inference] The revisions are documented inside the plan (§32.6–32.8), not as versioned files.

---

## 4. Plan→agent execution

**Task graph.** [Verified] The 97 work packages of plan §29 are translated into Beads as 97 epics with `.A` / `.B` / `.V` children: two implementation tasks plus one **production-verification** task (e.g., `FCB-068.A` "Implement owner-qualified arena and device handles", `FCB-068.B` "Implement exhaustion retirement and wire-handle validation", `FCB-068.V` "Production verification: …"). Labels encode phase (`phase-g0`…`phase-g7`), work package (`wp-068`), crate owner (`owner-fcb-core`), and revision (`r4`).

**Working method** ([Verified], `AGENTS.md`): (1) read governing docs, status, task contract, implementation/tests; (2) inspect git status and file ownership, reserve narrow paths via Agent Mail; (3) implement a coherent slice with success/failure/cancellation tests; (4) run proportionate checks, update status/docs only to scope proven; (5) commit authorized work with explicit paths, verify the remote commit.

**Code-first waves + independent verifier.** [Verified] `AGENTS.md`, "Active swarm" (coordinated by BlackCedar; "user-authorized NTM implementation campaign"):

> "During code-first waves, workers do not run builds or test compilations. … Commit coherent owned changes with the bead ID and 'code-first, batch verification pending'; this is not completion evidence."

> "Only the independent batch verifier closes work after reviewing production and test diffs and executing the relevant tests through strict RCH at an exact source revision. Preserve every failed attempt. … Never close merely to unblock dependents."

> "Workers may change their assignee/status/comments, never acceptance criteria or dependencies."

> "Batch verification runs centrally when a prerequisite can unlock work, the ready pool dries, verification debt reaches 24 items, or a wave reaches 30 minutes."

Beads reflect this: 40 issues carry the `batch-pending` label, and `IMPLEMENTATION_STATUS.md` records which beads closed on "independent receipt" (e.g., `fcb-y2jq.1`, `fcb-z2go.1`/`fcb-z2go.2`). Closed beads carry close_reasons like "implemented and independently verified" and the verifier's evidence summary (exact revisions, remote run commands, test counts). [Verified]

**Drift prevention.** [Verified] Structural: `check_plan_graph.py` after every plan edit; `ROADMAP.md`: "never silently alter dependencies to make a queue appear ready"; `AGENTS.md`: "never silently lower a gate"; coordinator "reopens unsupported closes with an incident comment."

**Dialectical review.** No two-models-run-against-each-other protocol appears in this repo's text [Absent]. The functional analog is the **worker/verifier split** (producers cannot close their own work; an independent lane reviews diffs and executes tests at pinned revisions) plus "independent review lanes" (`IMPLEMENTATION_STATUS.md`) and the coordinator's anti-cheating inspections. [Inference]

---

## 5. State-of-the-art coverage

No `docs/research/` directory [Absent]. Research is a **phase of plan authorship**, not a directory: plan §4 ("Repository-by-repository findings and reuse decisions") covers nine named sibling repositories, and plan §32 is the standing, receipt-bound record:

- **R-ledger** (§32.2): 10 primary refs (FrankenMarkdown plan precedent [R1] — "Reviewed the whole document. … Used for product/subsystem/performance/phase structure"; FrankenTerm, FrankenNetworkX, CASS, Asupersync, FrankenSQLite, FrankenTUI, FrankenManim, FrankenThreeD), each with file ranges and blob SHAs. [Verified]
- **A-ledger** (§32.3–32.4): Apple platform refs (Metal, resource storage, display timing, FFI rules) with honest limits, e.g. "[A2] … some full page bodies required JavaScript … Exact availability and operational details must therefore be verified against the pinned SDK in G0."
- **B-ledger** (§32.5): fresh-review sources with per-source findings ("blob SHA and finding" column), including caveats like "document version prose is not package-version proof."
- **Revision statements** (§32.6–32.8): R2/R3/R4 reviews re-read the whole plan, re-ran the structural checks, and corrected scheduling defects (e.g., R4 found that "FCB-010, FCB-023 and FCB-028 depended on FCB-008, the standalone composition … contradicting §6.4 and §28.11"). [Verified]
- **Rejected defaults** (§30.2): WebView/Electron, whole-FrankenTerm GUI, "waiting for all of FrankenThreeD", "GPU everything", full-frame draw lists, mutable-source mmap, 120 Hz busy loop, "universal compiler semantics from a highlighter", neural search as startup requirement. [Verified]
- **Review findings table** (§30.4): 30+ findings each mapped to corrected contracts (this is the "red-team findings ledger" analog, embedded in the plan). [Verified]
- Ongoing SOTA machinery: `closure_probe.py`, `platform_probe.py`, `extension_ledger.py` and the `probes/headless_consumer/` probe continuously re-qualify the work against upstream reality; `scripts/e2e/` (referenced in ledger entries) executes end-to-end verification routes.

---

## 6. Anti-satisficing

- **Adversarial self-tests of the honesty tooling**: `tests/test_closure_probe_adversarial.py` exists alongside the probe; unittest.log retains 17/17 passing extension-ledger tests. [Verified]
- **Review-driven regression matrix** (plan §25.9): 15 defect classes (owner collision, pixel/model mismatch, lost completion, discovery omission, feature leakage, upstream ownership…) each with a required adversarial case and passing result. [Verified]
- **Anti-cheating taxonomy** in `AGENTS.md` (gate self-weakening, proof laundering, refusal farming, commit pumping, follow-up laundering, dependency smuggling, demo hardcoding) with coordinator inspections and incident-comment reopens. [Verified]
- **Downgrade rule** (plan §30.3): "When a claimed semantic fact lacks evidence, downgrade the claim rather than manufacture certainty." And: "When a feature passes in simulation but not on the native host, report only the simulated result." [Verified]
- **No registry-gaming**: "Missing required capabilities must appear explicitly, rather than disappearing from a registry to make it green." [Verified]
- **Checklist terminal item** (§31.2): "No planned subsystem, simulated backend, or target number is presented as an implemented result." [Verified]
- **Test tooling discipline** (§25.8): performance thresholds paired with correctness assertions; fixes may not improve results by shrinking the test. [Verified]
- Explicit non-goals (§1.4) and "deliberately bounded enhancements" (§30.5) fence scope against fashionable accretion. [Verified]

---

## 7. Explicit absences

All checked in the cloned repo and confirmed missing:

- [Absent] `docs/planning/` and `docs/research/` directories (no `docs/` at all at top level)
- [Absent] `BEADS.md`, `TODO.md`, `PLAN.md` (planning lives in the single `COMPREHENSIVE_PLAN_…md` + `ROADMAP.md` + `.beads/`)
- [Absent] `CLAUDE.md`, `MUSE.md`, `.muse/` directory
- [Absent] ADRs or any `docs/decisions` record (decisions live in plan §30, "rejected approaches" style, inline with rationale)
- [Absent] A standalone definition-of-done document (DoD = §29 "Completion evidence" column + global gate rules)
- [Absent] "Sign-off" terminology or a sign-off artifact (closure = independent-verifier close with retained receipt)
- [Absent] A separate negative-evidence ledger or claim-matrix document (functions embedded in §30.2/§30.4/§32 and the probe verdicts)
- [Absent] "Red team" / "dialectical" / two-model-opposition terminology (analogs: adversarial probe tests, §25.9 regression matrix, §30.4 review-findings table, worker/verifier split)
- [Absent] An auto-demotion rule *by that name* (the executable analog — closure-probe qualification downgrade — exists and is tested)
- [Absent] A never-compact-sessions rule in the text ("compact*" hits in the plan are memory-compaction; nothing on agent session compaction)
- [Absent] Separate research/brief phase artifacts (research is §32 of the plan; the R1→R4 revision history is documented *inside* the plan rather than as versioned files)
- [Absent] Campaign documentation (a "glyph visibility campaign" is referenced only in a git commit message; "NTM implementation campaign" named in `AGENTS.md` with coordinator BlackCedar, but no campaign plan doc in-repo)

---

## 8. Maturity verdict

**Mature.** This is the most contract-dense planning stack observed in the program: a single normative 309KB plan whose structure is *mechanically validated* (acyclicity, contiguity, citation hygiene, cross-doc count consistency), per-work-package completion evidence, seven product gates with required evidence, a receipt-bound research ledger that explicitly bounds its own claims, machine-enforced claim demotion with adversarial self-tests, and an agent execution protocol (code-first waves → independent batch verifier → retained receipts) with named anti-cheating enforcement and drift-prevention rules. The honesty machinery is not aspirational prose — it is Python that runs, with tests and retained logs.

Deductions from "fully mature": the dialectical two-model protocol and session-compaction discipline from the suite stereotype do not appear in this repo's text (the worker/verifier split is the working analog); planning revisions are narrated inside the plan rather than preserved as versioned artifacts; and research lives in the plan rather than a browsable `docs/research/` tree. None of these are functional gaps in what the artifacts *do* — they are gaps only against the assumed suite template, which this repo deliberately does not follow.
