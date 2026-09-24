# Planning Methodology: franken_agent_detection

Repo: `github.com/Dicklesworthstone/franken_agent_detection` (cloned 2026-09-22, depth 1).
Purpose of this note: HOW Emanuel plans in this repo — the planning machinery, not the product.

## 0. One-paragraph orientation

[Verified] franken_agent_detection has **no prose planning layer at all** — no roadmap, no plan docs, no AGENTS.md/CLAUDE.md, no ADRs. What it has instead is the densest bead work-order system seen in the suite so far: 16 `.beads/issues.jsonl` issues that function as **executable contracts**, each carrying bounded scope, explicit non-claims, required-evidence lists, and a closure ritual that forbids the worker from closing its own work. The rules governing the system (a "binding independent-closure rule", "binding credit rules", a UBS pre-commit scan gate, a no-local-build admission rule) are **referenced but not stored in this repo** — they live in the parent program's external `/data/projects/AGENTS.md`, which is quoted at line 375 in one bead. In short: in this repo, the plan *is* the bead description; verification *is* the dialectic; and the rulebook is imported from outside.

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `.beads/issues.jsonl` | **The planning system** (the only plan artifacts in the repo) | 16 issues; each is a bounded work order: scope, acceptance criteria, explicit non-claims, required gates, receipt log, independent-verifier sign-off |
| `.beads/config.yaml` | Tracker config | Nearly empty stub: only commented-out `issue_prefix`, `default_priority`, `default_type` |
| `.beads/metadata.json` | Tracker pointer | `{"database": "beads.db", "jsonl_export": "issues.jsonl"}` — the actual beads.db is gitignored, jsonl is the committed export |
| `docs/planning/UPGRADE_LOG.md` | Dependency ledger | Single entry: 2026-06-17 chrono/serde_json/serial_test bumps; fsqlite 0.1.3→0.1.10 "deferred — coordinated franken release (handled by parent)" |
| `CHANGELOG.md` | Honesty-scoped release record | Keep-a-Changelog with a "do not invent" release inventory and explicitly bounded scopes |
| `src/connectors/conformance_tests.rs` | In-code behavioral contracts | 5 conformance contracts (timestamp parsing, connector factory, schema, detection determinism, path-mapping equivalence) |
| `tests/codex_prompt_integrity.rs`, `tests/codex_read_integrity.rs`, `tests/codex_exclusions.rs`, `tests/pi_path_exclusions.rs` | Integrity regression tests | Prompt-injection/dedup-safety guards and read-failure semantics for upstream-format parsers |
| `.github/workflows/ci.yml` | CI gate | fmt --check, clippy `--all-targets --all-features -D warnings`, full test suite, `cargo package` |
| `.github/workflows/codex-read-integrity.yml` | Cross-repo contract gate | Runs FAD unit/integration tests then tests a **pinned** CASS consumer checkout (ref `a897707f287799191798fe4cb1f569d191493870`) against this FAD source so "FAD changes cannot pass by accidentally testing different CASS code" |
| `.github/patches/codex_prompt_integrity*.patch`, `validate-codex-prompt-patch.yml` | Patch-integrity fixtures | Guard the prompt-integrity tests themselves |
| `fixtures/{antigravity,codex,openhands}/` | Checked-in fixture stores | Real upstream session-store fixtures the conformance validators run against (bead `wlb` wired `validate_conversation/validate_message` to all three) |

Bead population [Verified, `.beads/issues.jsonl`]: 16 issues — 10 closed, 5 in_progress, 1 open. `issue_type`: 1 feature, 3 task-type "task", 6 bug, 1 test, rest task. All 16 have `compaction_level: 0` (never compacted). 9 created by `jemanuel`, 7 by `ubuntu`. Created 2026-08-24 → 2026-09-14. Assignees in flight: `BoldLynx` (2), `OrangeDove` (1), `CopperOak` (2), rest unassigned/parent-owned.

---

## 2. Execution-readiness gates (what a plan must pass before agents are set free)

There is no "planning phase" document in this repo. The gate lives inside each bead's description as required evidence, plus external standing rules referenced verbatim. Verbatim quotes (all from `.beads/issues.jsonl`):

**Per-bead required evidence, written into the work order:**
- [Maintainer claim, bead `franken_agent_detection-oh7` description]: "Real focused remote check/Clippy/fmt/tests and independent review required; no source-content or native-archive claims beyond fixtures."
- [Maintainer claim, bead `franken_agent_detection-mvg` description]: "Implement root admission and real scan/discovery tests in the existing Prime connector... No claim of whole-provider archive parity; independent remote verification and release integration remain required."
- [Maintainer claim, bead `franken_agent_detection-13w` description]: "Real parser/root/source-byte/FIFO rewrite tests and one remote omarchy check/Clippy/fmt/test gate."

**The observed stage sequence** (verbatim from bead `13w` verifier comment, OrangeDove): "RCH job 30012625538515184 on omarchy: STAGE=format EXIT=0; STAGE=fmt_check EXIT=0; STAGE=check EXIT=0; STAGE=clippy EXIT=0; STAGE=grok_bot_tests EXIT=0 (6 passed); registry_grok_bot, registry_base_connectors and default_roots each EXIT=0 (1 passed each). Total 9 passed, 0 failed, 0 ignored; remote terminal exit=0 at 2026-09-08T23:13:23Z."

**Standing external rules referenced from the beads** (the rules are NOT in this repo):
- UBS pre-commit gate — [Verified reference in bead `r96` comment]: "Parent independently verified all 77 final inputs... then held the conditional local commit because /data/projects/AGENTS.md:375 requires UBS exit 0 before committing." The same comment records the gate biting: "Required static-only UBS scan of the two exact validated connector files exited 1... No scanner suppression, unrelated shell rewrite, commit or publication performed... Bead remains open pending original CASS acceptance and scanner requirement." This is an execution-readiness gate with teeth: validated, green-tested work was **refused a commit** because the static scanner exited 1.
- Test-before-commit — [Verified reference in bead `t4l` comment]: "parent /AGENTS.md requires tests before committing."
- No-local-build admission — [Verified in bead `r96` comment]: "no Rust formatter/compiler/test was run by this agent under the no-separate-admission instruction"; and [bead `t4l` comment]: "No local build or commit fallback" with the remote gate invoked as `RCH_REQUIRE_REMOTE=1 rch exec -- ...` (exact command preserved in-bead).
- Independent closure — [Verified in bead `oh7` comment]: "Independent parent review owns acceptance/closure; this agent does not close the bead." [Verified in bead `13w` notes]: "Leaving in_progress for independent acceptance/closure under binding credit rules."
- Delegated verifier authority — [Verified in bead `13w` verifier comment, OrangeDove]: "Independent verifier OrangeDove (/root/gh413_new_evidence), explicitly delegated by parent under the binding independent-closure rule."

**What "done" requires, synthesized:** bounded work lands as a commit; a remote RCH gate (format/fmt/check/clippy/tests, remote-only) goes terminal-green with receipts (exact command JSON, terminal log, per-stage logs, source/fixture SHA256 manifests, often in `.gate-results/<bead>/`); a *different* agent (independent verifier) or the parent inspects exact executed source, hashes, and terminal receipt; only then is the bead closed, with a `close_reason` that narrows what the closure certifies. [Inference] There is no evidence of a written Definition of Done file; the DoD is the conjunction of bead-local acceptance criteria + the external AGENTS.md gates.

---

## 3. Honesty guardrails (negative-evidence / claim-matrix / demotion)

No dedicated ledger files exist [Absent: no negative-evidence ledger file, no claim-matrix file, no auto-demotion rule text in-repo]. Instead, honesty machinery is embedded per-bead and in-code:

**Per-bead explicit non-claims** (verbatim):
- [bead `13w` description]: "no native app or complete-history claim." [bead `13w` notes]: "No native-app, cloud, full-history or CASS rolling-ingestion certification." [bead `13w` close_reason]: "This closes only original upstream parser/root scope, not CASS rolling merge/adoption, native-app interoperability, full-history recovery or release integration."
- [bead `13w` verifier comment]: "Positive: actual reporter structure yields seven ordered chat messages, native IDs survive 200-entry FIFO rewrite, explicit file/config/directory paths and provenance work, source bytes/mtime conserved. Negative: non-chat fields and foreign filenames excluded; malformed/idless-only input and failed host callbacks never certify completion. HOME/environment precedence is source-reviewed only; explicit roots are runtime-covered."
- [bead `oh7` comment]: "This is Linux fixture execution, not native Windows or reporter-archive proof. No publication, CASS dependency adoption, downstream canonical repair completion or self-closure."
- [bead `mvg` description]: "No claim of whole-provider archive parity."

**Honesty state machine** — agents must declare evidentiary state, not just pass/fail (verbatim):
- [bead `oh7` comment]: "Runtime tests were UNEXECUTED; this is not a parser acceptance pass."
- [bead `rqa` comment]: "Native regression is PREPARED_UNRUN, not RED/GREEN proof."
- [bead `rqa` comment]: "The commit adds the test; it does not supply native execution evidence."
- [bead `t4l` comment]: "No compiler/native test/Clippy execution, RED/GREEN or broad acceptance claimed."
- [bead `r96` comment]: "malformed/idless-only input... never certify completion" (13w) — failed inputs are enumerated as permanently non-certifying.

**In-code guardrails:** the 5-contract conformance harness (`src/connectors/conformance_tests.rs`); schema validators enforced against all three checked-in fixture stores (bead `wlb` close_reason [Verified]: "validate_conversation/validate_message now enforced against all three checked-in fixture stores (antigravity, codex, openhands) in a conformance test"); the Codex read-integrity tests asserting the public connector "must not deliver or complete failed reads" (tests/codex_read_integrity.rs docstring, [Verified]); prompt-integrity tests asserting dedup "must not erase independent prompts" (tests/codex_prompt_integrity.rs, [Verified]).

**Demotion:** no auto-demotion rule found in-repo [Absent]. The functional equivalent is the *deferred-findings* pattern: items that fail to meet the bar are re-beaded rather than demoted — bead `8jf` (close_reason [Verified]): "Still open by design: copilot H2 CLI dual-ingestion clean cutover, copilot_vscode M9/M10/M12, cline C2, factory F1/F2, aider A2-A4, qwen Q3, clawdbot CB2/CB3, vibe V2 — schema-visible or routing changes needing separate review." And bead `a1l` exists purely as "Deferred review findings." [Inference] Demotion here is structural (work is refused closure and re-queued), not a verdict downgrade.

**When installed in lifecycle:** guardrails are contemporaneous with work, not a phase. The bead description carries the non-claims at creation; the verifier comment adds Positive/Negative at closure. [Inference] There is no evidence of a later-retrofit honesty pass; the machinery is the day-to-day operating loop.

---

## 4. Plan→agent execution (task graphs, phases, verification loops, dialectical review, drift prevention)

**No task graph or phase structure.** [Verified] There are no phase docs, no multi-step plan files, no milestone structure. Each bead is a self-contained work order; cross-bead structure exists only as (a) named campaigns and (b) explicit dependency/scope boundaries.

**Dialectical review (the two-or-more-minds loop)** [Verified, `.beads/issues.jsonl`]: the operating pattern is worker → independent verifier → parent, with named agents:
- Worker implements: e.g. `BoldLynx` assigned `oh7` (Cursor workspace attribution) and `r96` (Copilot workspacePath fallback); `CopperOak` assigned `rqa`, `t4l` (SQLite transaction repair).
- Independent verifier reviews and closes: `OrangeDove` authored the `13w` closure comment under explicit delegation ("explicitly delegated by parent under the binding independent-closure rule"); `OrangeDove` is also assignee on the still-open `mvg`.
- Parent (`ubuntu` authorship on 13 of 14 comments; `jemanuel` created 9 of 16 beads) does source-level acceptance review, owns commits, and owns closure: "Independent parent review owns acceptance/closure; this agent does not close the bead" (oh7); "Parent independently reviewed complete production diff without a concrete defect" (oh7); "parent independently reviewed actual .blob grammar" (13w notes).
- [Inference] This is the dialectical mechanism in this repo: not two models debating a plan, but a worker whose deliverable must survive an independent verifier and a parent who re-verifies before closing. The "binding credit rules" make it incentive-compatible: credit binds to independent closure, so self-closure gains the worker nothing.

**Verification loop mechanics** [Verified]:
- Remote-only execution via RCH on a host called "omarchy" (`RCH job <id> on omarchy`), with exact command JSON and terminal log retained per run (e.g. `/tmp/fad-gh459-final-omarchy-20260909-command.json`, terminal log with SHA256 `7829f00f13071466a5ca8385d6bdadb9db69191a7a6cdbb13`).
- A failed stage is *retained as evidence*, not retried silently: oh7's first gate "exceeded the 1800-second SSH cap... Runtime tests were UNEXECUTED"; a Clippy failure on "two unreadable numeric test literals" was fixed with "only numeric separators... preserving exact timestamp values" and the failure retained at its log path.
- Cross-repo acceptance: r96's fix required "Parent will also rerun unchanged CASS connector_copilot acceptance, all 12 cases"; the downstream CASS analytics gate result is pasted back into the FAD bead ("all12 tests in tests/connector_copilot.rs passing... including scan_parses_cli_history_json_with_human_role_and_file_stem_id").

**Drift prevention** [Verified]: the sharpest mechanism in the repo —
- Frozen source overlays with full manifests: "complete 76-file manifest /tmp/fad-gh459-frozen-manifest-20260909.json SHA256 f43e50c26d00a801510feaea64dc141c5e3d724cec3ea32472724be2237553ac" (oh7); "All 77 input files unchanged; before/after manifest SHA256 6b825377c4b29a46ff6057eb80c9083073c2fd59957a47656731114b7b0860c6" (r96).
- Executed-vs-canonical byte identity: "Executed Cursor SHA256 ... matches frozen"; "Final canonical Copilot SHA256 ccc2d748... matches executed input"; "production bytes match the executed snapshot."
- Immutability declarations: "Frozen F9 overlay remains immutable"; "Retained resolved worker lock SHA256 ... matches Cargo.lock.resolved" (lockfile pinning as drift guard).
- Receipts name exact byte counts of change: "the two-line correction", "added exactly one final fallback", "Accepted implementation 37799618eae1338234eb0034b40aebf47ff67949 plus formatter 8042378a277f4145a8d57cb156e4743abd69a68d."

**Task graph substitute:** cross-repo campaign linkage — beads `rqa` and `t4l` both carry "Root migration campaign asupersync-nmg80j"; `13w`/`oh7`/`r96` link to upstream CASS GH issues (GH447, GH459) and CASS beads (coding_agent_session_search-sxhgy, -91njy). [Inference] Coordination happens by ID-linking beads across repos, not by a master plan.

---

## 5. State-of-the-art coverage (research / competitor / literature mechanisms)

No `docs/research/` directory, no literature survey, no competitor matrix [Absent]. The SoTA mechanism here is **upstream-fidelity work driven by real reporter samples**:
- [Verified, bead `13w` description]: "Implement separate grok_bot provider from Grok Bot 0.44.0 reporter sample (CASS GH447 comment5592555144): actual13entry excerpt yields7chat messages; observed200entry FIFO cache." The fixture `tests/fixtures/grok_bot_reporter_0440.json` is the pinned upstream evidence.
- [Verified, bead `8jf` title]: "recorded scout findings needing schema-visible decisions" — scouting is a named activity whose findings become beads; bead `a1l` is "Deferred review findings" from audits.
- [Verified, bead `8np` (open)]: "Decide canonical claude slug alignment: registry says claude, connector emits claude_code" — an upstream-naming decision held open as a bead rather than decided ad hoc.
- The cross-repo CASS consumer contract workflow (`.github/workflows/codex-read-integrity.yml`) keeps FAD honest against the actual downstream consumer at a pinned ref — a form of integration-level SoTA check rather than literature review.
- CHANGELOG honesty about releases: "do **not** have GitHub Release pages — do not invent them" [Verified, CHANGELOG.md:22].

[Inference] Emanuel's "research" for this repo is empirical: parse real upstream session stores, pin them as fixtures, and let the conformance suite enforce fidelity. There is no mechanism for surveying literature or competitors.

---

## 6. Anti-satisficing (red-team / falsification / campaign mechanisms)

No red-team campaign or falsification program exists as such [Absent]. What exists is a set of satisficing-blockers:

1. **The UBS gate actually fired.** [Verified, bead `r96`]: fully green, parent-verified work was refused a commit because the static scanner exited 1 — and the refusal was logged with the exact finding ("two duplicate shell-command rule matches at unchanged cursor.rs:163-164 ... and 641 broad warnings"). Anti-satisficing by an external scanner the worker cannot suppress ("No scanner suppression... performed").
2. **Negative tests as first-class acceptance.** [Verified] Bead descriptions require them: r96 requires "missing/null/number/array/object/nested-only values leaving workspace unresolved without losing messages or identity"; the verifier's Negative section enumerates permanently non-certifying inputs.
3. **No-rerun verification.** [Verified, 13w verifier comment]: "Exact command ... and terminal receipt ... independently inspected; no rerun." The verifier re-inspects rather than re-running, preventing the worker from gaming a fresh run.
4. **Failed-stage retention.** [Verified] oh7's timed-out first gate and the obsolete Clippy-failing job are retained with logs and explicitly marked UNEXECUTED/obsolete — failure is part of the record, not erased.
5. **Precision-of-change discipline.** [Verified] "After terminal, only numeric separators were added, preserving exact timestamp values" (r96); "two-line correction"; "formatter-only commit ... authorized" (13w) — every post-gate change is minimized and re-gated.
6. **The open decision bead** (`8np`) and the "still open by design" list (`8jf` close_reason) are anti-satisficing at the planning level: hard items are explicitly deferred to separate review rather than quietly dropped.

---

## 7. Explicit absences

[Absent — verified by full file-tree scan and case-insensitive filename hunt; only `src/connectors/claude_code.rs` matched a "claude" pattern, which is product code]:
- `docs/planning/` contains **only** `UPGRADE_LOG.md` (a dependency-bump log). No plan docs, no phase docs, no milestone docs.
- No `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md`, `MUSE.md` at any level.
- No `AGENTS.md` / `CLAUDE.md` / `.muse/` — agent operating instructions live **outside** the repo (referenced as `/data/projects/AGENTS.md:375`); this repo imports its rulebook.
- No `docs/research/`, no ADRs, no competitor/literature mechanism.
- No Definition of Done document; no claim-matrix file; no negative-evidence ledger file.
- No auto-demotion rule text; no red-team/falsification campaign; no "two models debate the plan" dialectic artifact — the dialectic is worker/verifier/parent, enacted in bead comments, not a planning ritual.
- No prose plan for the suite or the repo's future; the 1 open + 5 in_progress beads are the entire forward plan.

---

## 8. Maturity verdict

**Developing** (strong execution/honesty machinery; thin planning layer).

Why not "mature": a mature planning methodology would include forward plans, phase structure, a roadmap, and research coverage — this repo has none of those. There is no document anywhere that says what franken_agent_detection will do next quarter, what its milestones are, or what literature it tracks. The closest thing to a plan is 6 open beads.

Why not "thin": the bead system is a genuinely load-bearing planning artifact, not a todo list. Each bead is a contract with bounded scope, named non-claims, required remote gates, receipt-bound evidence (RCH job IDs, SHA256 manifests, terminal logs, frozen overlays), a delegated independent verifier, and parent-owned closure under binding credit rules — and the record shows the gates biting (a commit refused over a UBS exit 1; a bead kept open for an independent acceptance that hadn't happened). Drift prevention via frozen manifests and executed-vs-canonical byte identity is the most rigorous seen in the program. The dialectic is real and adversarial, just enacted at execution time rather than planning time.

[Inference] The distinctive Emanuel pattern visible here: **plan less, verify more**. Planning is compressed into the work order; all the methodological weight is pushed into acceptance — independent verification, receipt-bound evidence, explicit non-claims, and rules that live one level up in the parent program rather than in each repo. It works because the rulebook (`/data/projects/AGENTS.md`) is shared infrastructure; this repo's thinness is a feature of a suite-level design, not an oversight — but it does mean this repo cannot be understood, or its planning reconstructed, from the repo alone.
