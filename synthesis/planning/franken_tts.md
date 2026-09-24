# Planning Methodology — franken_tts

**Repo:** franken_tts (`https://github.com/Dicklesworthstone/franken_tts`) · **Snapshot:** depth-1 clone, 2026-09-22 · 716 files
**Analyst role:** planning-methodology analyst (plan-first agent-swarm methodology, NOT the product)

---

## 1. Artifact inventory

| Path | Role | One-line summary |
|---|---|---|
| `COMPREHENSIVE_PLAN_FOR_FRANKEN_TTS.md` | Master plan (the single source of truth) | 833-line v2.1 engineering thesis + roadmap; §16.4 carries the evidence gates to beads |
| `AGENTS.md` | Agent operating instructions | 324 lines: doctrine (10 laws), Doctrine #0 anti-ceremony, spec-first porting workflow, gate commands, multi-agent coordination |
| `.beads/issues.jsonl` | Dependency-aware task graph (beads_rust) | 262 beads: 19 epics, 207 tasks, 23 bugs, 13 features; 206 closed / 45 open / 9 in_progress / 2 blocked |
| `docs/CI_AND_GATES.md` | CI/gate definition | One-command gate (`scripts/check.sh`), 9 stages cheapest-first, skip-honest banner, receipt convention, sibling pinning |
| `docs/NEGATIVE_EVIDENCE.md` | Negative-evidence ledger | `NE-NNN` entry schema; measured rejections with `kill_switch`, `do_not_retry`, `tally_local_w_l_n` |
| `docs/PERF_LEDGER.md` | Perf ledger | Only current-tree, pinned-reference, parity-qualified measurements; KEEP/REVERT/DEFER dispositions |
| `docs/DISCREPANCIES.md` | Accepted-divergence ledger | Every accepted divergence: reference behavior, our impl, measured impact, kill-switch, review date |
| `docs/truth-pack/PIN_RECORD.md` | Pin record | Exact upstream revisions (HF weights + GitHub source + arXiv PDF) that every `[SOURCE]` fact is asserted against |
| `docs/truth-pack/FACT_DISPOSITIONS.md` | Receipt-bound evidence adjudication | Every §2 plan fact dispositioned VERIFIED/CORRECTED/EXTENDED/STILL-OPEN against pinned bytes with `file:line` citations |
| `docs/truth-pack/` (rest: 27 files) | Evidence bundle | Tensor inventory JSON, cost model, nondeterminism floor, conformance fixtures w/ provenance, OQ-N research docs, MANIFEST.sha256 |
| `docs/conformance/` | Oracle fixtures | Fixture manifest + provenance for the reference oracle |
| `docs/designs/` (9 docs) | Design decision receipts | Engineering specs + waterfall verdicts (e.g. `WATERFALL_Q4_MTP.md` — "Decision Receipt") |
| `docs/transparency/` | Alien-artifact transparency cards | `AF3_SPECULATION_MONITOR.md`, `CAPACITY_CERTIFICATE.md` — runtime-reliability math |
| `docs/IOS_APP_PLAN.md`, `docs/IOS_MACOS_EXCELLENCE_PLAN.md` | Platform extension plans | iOS app + macOS excellence plans (later-phase surfaces) |
| `docs/BAKEOFF_CORPUS.md`, `docs/QWEN3_TTS_*` specs | Companion deliverables (§16.2) | Executable spec, conformance/listening protocol, voice-compiler design, codec spec, streaming contract, sampler contract |

**External-but-governing (referenced, not in repo):** the methodology skill `/ai-model-into-rust-mega-fused-hyper-kernel` ("the plan is the *what*, the skill is the *how*"; §16.1, `AGENTS.md`).

## 2. Execution-readiness gates

Gates live in three layers: plan-level evidence gates, bead-level DONE WHEN criteria, and the repo gate script.

**The master gate rule** (`AGENTS.md`, Porting Workflow): [Verified]
> "Hard rule: no kernel ships against an unresolved `[OPEN]`. A phase exit gate cannot pass while it depends on an unresolved OQ. Promote an `[OPEN]` to a design assumption only after reading the source and recording the answer in the register."

**The §16.4 evidence gates** (gate kernel-bead pickup, not plan approval): [Verified]
> "a kernel bead may be *picked up* only when its component's gates are green (the graph encodes this as dependencies on the −1A/−1B beads):
> - model graph reconciled with pinned source (−1A green for the component);
> - cost model generated (−1B);
> - no unresolved contradiction in the component being implemented;
> - oracle fixture exists for it;
> - acceptance criteria are executable."

**Per-component truth gating** (v2 change — gates are local, not global): [Verified]
> "Truth gating is per-component (v2 change): a kernel is blocked only by the unresolved [OPEN]s *it* depends on — a watermark question does not block a verified talker GEMV." (`COMPREHENSIVE_PLAN_FOR_FRANKEN_TTS.md`, §2 preamble)

**The conformance regime — two contracts instead of one** (the fix for "tiny legitimate logit perturbations flip tokens"): [Verified]
> "one ladder cannot serve two masters" — `ConformanceExact` (teacher-forced, canonical greedy, kernel-development ladder) vs `ProductionQuality` (shipping sampler + quant, distributional metrics + blind-listening equivalence). (§9)

**The repo gate** (`docs/CI_AND_GATES.md`): [Verified]
> `cargo test --locked` remains a **hard gate**: it MUST exit `0` before any change is handed off or a bead is closed... `GREEN WITH SKIPS` is **not** a green bar... "There is deliberately **no knob to skip a stage**. If a stage is in your way, fix it."

**The anti-satisficing release rule** (`AGENTS.md`, Doctrine #0.4): [Verified]
> "A skipped test is NEVER presented as passing (skip-honest receipts; XFAIL never SKIP). No silent epsilon bumps to make a golden pass — tolerance widening is a ledgered, gated operator with a DISC entry. A bead closed without its exit criteria actually met is reopened with an incident comment, not quietly left closed."

**Session landing** (`AGENTS.md`): [Verified] agents must file beads for remaining work, run gates, `br sync --flush-only`, and count "capabilities landed (rungs green, levers kept, audio provably better/faster), not documents produced."

## 3. Honesty guardrails

**Claim tagging** — every plan claim carries a four-tier tag, with an adjudication lifecycle: [Verified]
> "Claims are tagged **[VERIFIED]** (confirmed from a source we have pinned and hashed), **[SOURCE]** (confirmed from the official *live* repo/config/generation-config during the v2 review — links in §17 — accurate but pending hash-pinning in Phase −1A, where each is re-asserted and promoted to [VERIFIED]), **[REPORTED]** (from the model-selection dossier/paper; not yet line-verified), or **[OPEN]** (must be resolved from the pinned source before the dependent kernel ships)."

**Receipt-bound evidence** — the truth pack adjudicates every §2 fact against pinned bytes: [Verified] `docs/truth-pack/FACT_DISPOSITIONS.md` dispositions each fact as `VERIFIED` / `CORRECTED` (plan must change) / `EXTENDED` / `STILL OPEN`, with `file:line` citations into `snapshots/` and an enforced invariant: "Changing a pin invalidates `FACT_DISPOSITIONS.md` and requires re-adjudication." Six corrections (C-1…C-6) actually changed the plan — C-1 was load-bearing (it rewrote the per-frame execution graph: the plan had omitted the talker→code-embedding feedback path).

**Negative-evidence ledger** — [Verified] `docs/NEGATIVE_EVIDENCE.md` opens with a gate contract ("consumer=Phase-4 perf ritual; gate=sweep before spending a performance lever; defect_class=repeated dead optimization; deletion_condition=never"), a schema (`claim_id`, `evidence_id`, `kill_switch`, `before_after`, `do_not_retry: unless <specific changed condition>`, `tally_local_w_l_n`), and the standing rule: [Maintainer claim] "`status: inherited (pre-truth-pack)` means a sibling result is a hypothesis to re-confirm on Qwen3-TTS shapes and target silicon. It is never local evidence and cannot support a performance claim."

**Demotion mechanics** — no single "claim matrix" doc, but three demotion channels exist: [Verified]
1. **Fact demotion by adjudication**: [SOURCE]→[VERIFIED] promotion, or CORRECTED dispositions that force plan edits (FACT_DISPOSITIONS.md).
2. **Runtime one-way demotion**: `docs/CONFORMANCE_AND_LISTENING.md` — "Kernel demotion is one-way. A tier that failed its selftest has produced a wrong answer on..." and `docs/transparency/AF3_SPECULATION_MONITOR.md` — the AF-3 e-process triggers "an automatic, irrevocable demotion to the authoritative sequential microdecoder."
3. **Bead demotion by process**: [Maintainer claim, Doctrine #0.4] "A bead closed without its exit criteria actually met is reopened with an incident comment"; [Maintainer claim, plan §10.5] removed levers are "ledgered as invalid, not merely deprioritized."

**When installed in the lifecycle**: [Inference] the guardrails are front-loaded — plan §2 is written claim-tagged *before* any kernel bead can be picked up (§16.4 gates), the truth pack (Phase −1A deliverable) is the first artifact, and NE-005/NEGATIVE_EVIDENCE entries are seeded with inherited priors from sibling repos (`status: inherited (pre-truth-pack)`) before local measurement exists.

## 4. Plan→agent execution

**Task graph**: [Verified] the plan converts to beads by owner decision (2026-08-05): "the full graph now lives in `.beads/` (15 epics + 106 tasks, slug-embedded IDs prefixed `frankentts-`, multiple polish rounds applied; start with `br ready`)." Every §14 OQ is a research bead blocking only its dependents; `bv --robot-insights | jq '.Cycles'` must be empty (dependency-cycle check) before implementation. 125 of 262 beads carry `DONE WHEN` exit criteria in their descriptions (e.g., the OQ-2 bead: "DONE WHEN: inventory generated from pinned weights (not config alone); hot-working-set bytes published as ONE number...").

**Phases**: [Verified] a phased roadmap with named exit criteria per phase: −1A (exact model truth), −1B (cost model, v2 centerpiece — the executable costed execution graph), 0 (skeleton), 1 (exact safe forward), 2 (Q8 artifact), 3A–3D (engines), 4 (voice compiler), 5 (lab/struct compression), 6 (Metal, conditional), 7 (certify + ship). Phases 3A–3D have independent entry gates.

**Dialectical review — two models against each other**: [Verified] the plan's own header records it: "Master engineering plan — v2.1 (round 1: GPT-Pro — microdecoder correction, promoted facts, re-ranked program · round 2: Grok hardness patch — traffic-model honesty, FrankenMTP exactness tiers + ragged batching, residency operationalization, AF gate-binding)" plus "three fresh-eyes audit passes." So the dialectic here is *sequential adversarial review across model families on the plan itself*, not parallel agents voting on code. The maintainer's own stated reason for the split: v1 contained load-bearing falsehoods (the microdecoder understatement), and the two-model pass exists to catch exactly that class.

**Verification loops**: [Verified] the skill's Phase-4 "optimization ritual" — "graveyard sweep → re-profile → one lever behind `FTTS_*` → bit-identical proof before speed → interleaved thermal-paired A/B, cv%≤5 → keep/revert + ledger → evidence bundle → equivalence class in the commit subject; PROVISIONAL_LOCAL_WIN discipline." Kill switches are per-lever `FTTS_*` env vars.

**Drift prevention**: [Verified] (a) the claim-tagging lifecycle prevents spec drift — per-component truth gates mean an agent can only work what its component's [OPEN]s permit; (b) per-bead DONE WHEN criteria; (c) bead dependency graph with cycle checks (`bv`); (d) multi-agent coordination via MCP Agent Mail with file reservations ("Reserve files before editing") and thread-scoped discussion; (e) the repo validators (`scripts/validate_repo.py` — eight structural rules, selftested so a rule that silently stops firing is caught); (f) session-landing protocol ("Landing the Plane").

**Never-compact**: [Verified] every one of the 262 bead records carries `compaction_level: 0`, i.e. the tracker schema has a compaction field and it is uniformly zero — consistent with the suite-wide no-compaction practice.

## 5. State-of-the-art coverage

**Competitor coverage is a three-gate bakeoff, not a literature survey**: [Verified] §11 replaces v1's circular kill rule with Gate A (upstream quality), Gate B (architectural systems potential via a stage-isomorphism map between Qwen and the Kyutai Pocket challenger), Gate C (optimized confirmation; displacement requires BOTH ≥~95% human-preference retention AND ≥2× systems advantage). The reference set is instrumented directly: the −1B phase mandates "instrument the official implementation and the best MLX/GGML ports per stage" (open bead `frankentts-b-instrument-refs-wy5`), and sibling repos are pinned by full commit SHA in CI ("the same reasoning that produced the truth pack").

**Literature/paper mechanism**: [Verified] the paper (`arxiv.org/html/2601.15621v1`) is hash-pinned in the truth pack and its long-form result is load-bearing for planning (§2.8's dual-rate 25Hz trigger — "The trigger is predefined so the decision is evidence-driven, not re-litigated"). [Absent] No standing "research brief" doc type, no literature-review cadence doc, no research/ directory.

**External knowledge sources**: [Verified] prior-art reuse is explicit and receipted — the doctrine is "distilled from the plan and from the franken_ocr / franken_whisper / frankensearch prior art," sibling negative results enter as `inherited (pre-truth-pack)` priors (never local evidence), and `cass` (cross-agent session search) plus the shared model-selection dossier let agents reuse solved problems.

## 6. Anti-satisficing

The repo's distinctive anti-satisficing mechanism is **Doctrine #0 — The Anti-Ceremony Counterweight**: [Maintainer claim] "This methodology is receipt-heavy by design... That is exactly why it must police itself." [Verified] Its load-bearing rules:
1. "A process artifact may exist only as a hard gate for a named capability. At creation it names its consumer, the gate it enforces, the OBSERVED defect class justifying it, and its deletion condition. The usable test: *does running code or a release gate branch on this artifact?*"
2. "Process work earns ZERO capability credit." / "count capabilities landed, not documents produced"
3. "The meta-trap is this project's #1 occupational hazard" — "the exemplar's low-water mark: 16 of 1,520 deliverables were product while governance tranches multiplied."
4. Counterfeit-green rules quoted in §2.

**Falsification mechanics**: [Verified] negative-evidence entries carry measured `before_after` ratios, `killing_metric`s (including adversarial-vector testing — NE-005 documents a Chromium counterexample at saturating Q8 values that "falsifies it permanently"), and `do_not_retry` re-entry conditions; `artifacts/perf/` holds "falsifiable ledger" analyses (H3/H5 hypotheses with explicit falsifiers).

**Equivalence-tier honesty**: [Verified] "never a bare 'it's lossless / it's done / it's faster'" — claims must state their tier (e.g. "codec-token stream bit-exact under greedy; waveform within measured tolerance; int8 clean on the easy corpus, sibilance canary pending"); the listening protocol uses TOST-style equivalence bounds, not failure-to-reject; the shipping claim hierarchy is strict > fast > provisional, with `NO ADMISSIBLE RATIO` as a legal output ("Refusing to emit a number you can't back is a *correct* output, not a failure").

## 7. Explicit absences

| Expected artifact (suite pattern) | Status in franken_tts |
|---|---|
| `docs/planning/` directory | **[Absent]** — no such dir; the plan lives at repo root |
| `ROADMAP.md`, `BEADS.md`, `TODO.md`, `PLAN.md` | **[Absent]** (all; the master doc is `COMPREHENSIVE_PLAN_FOR_FRANKEN_TTS.md`) |
| `CLAUDE.md` / `MUSE.md` / `.muse/` | **[Absent]** — `AGENTS.md` only |
| `research/` directory / research-brief docs | **[Absent]** |
| ADRs | **[Absent]** — decision records live as `docs/designs/*.md` "Decision Receipts" instead |
| Named "claim matrix" document | **[Absent]** — claim-tiering exists (OQ-5's Tier 1 vs Tier 2; the four claim tags) but no matrix artifact |
| The governing skill in-repo | **[Absent]** — `/ai-model-into-rust-mega-fused-hyper-kernel` is referenced as an external skill path |
| Definition-of-done doc | **[Absent as a named doc]** — approximated by bead `DONE WHEN` clauses (125/262 beads) + phase exit criteria in §12 |
| Auto-demotion rules for plan claims | **[Absent]** — demotion exists for kernels (one-way), speculation (AF-3 e-process), and levers (ledgered invalid), but claims are *promoted* [SOURCE]→[VERIFIED] or *corrected*; no automatic claim demotion |
| Sibling-repo pins *locally* | **[Absent locally]** — siblings pinned only in CI (`ASUPERSYNC_REF`/`FRANKENTORCH_REF`); local dev uses whatever is on disk (documented as a known failure class) |
| Pocket bakeoff Gate A evidence | **[Blocked]** — weights inaccessible (HF gate, no credential); bead open, OQ-16 closed with resolution documenting the blocker |

## 8. Maturity verdict

**Mature — bordering on receipt-maximalist, but self-policing.** [Inference from verified evidence] franken_tts has the densest planning machinery of any repo the suite pattern predicts: a versioned master plan that *survived* two cross-model adversarial review rounds, a truth pack that adjudicates every plan fact against hashed pins with six recorded corrections (one load-bearing), 262 tracked beads with DONE-WHEN criteria and dependency encoding, three append-only ledgers with kill-switch and re-entry conditions, a 9-stage CI gate with skip-honesty, per-component evidence gates, and — uniquely — Doctrine #0, an explicit counterweight that deletes process artifacts failing a utility test. The telltale of maturity: the system has already *consumed* its own corrections (v1→v2.1) without breaking, and negative verdicts are engineered first-class outputs (the OQ-5 bead pre-committed both FrankenMTP claim tiers so a sour answer re-scopes rather than kills; AF families name their deletion conditions). The main soft spots: the governing skill lives outside the repo (portability of method), local sibling pins are unpinned (a documented known hazard), and Gate A of the challenger bakeoff is blocked on weights access.

**Provenance note:** method was adapted during work — `/tmp` was full (sibling planning analyses consuming the 512M tmpfs), so the repo was cloned to `~/workspace/scratch/plan-franken_tts/` instead of `/tmp/plan-franken_tts/`. All paths in this report refer to that clone. Output file: [franken_tts.md](sandbox:///workspace/franken-research/synthesis/planning/franken_tts.md).
