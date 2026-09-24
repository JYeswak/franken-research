# Project Pickup Playbook

*Playbook version: 1.3 (round-3 integration, 2026-09-23). Normative for all S0+
pickup artifacts. Changes to this file are constitution amendments: they need
an explicit approval from the parent orchestrator naming the changed section,
and the version above increments. Amendment and retirement authority: the
parent orchestrator. The 1.3 changes were ordered by the parent orchestrator
2026-09-23 (S4 round-3 integration); the section list is in
`docs/planning/round3/INTEGRATION3.md`.*

Constitution (S2) for the FrankenSuite "project pickup" ecosystem. Its goal:
for each of the 21 agentic-technology types the 44-repo corpus does not cover,
the ecosystem can bootstrap a new assessment or clean-room project from a good
starting point — charter seed, pinned oracles with integrity verification, a
first claim registry, a gate profile, a bench shape, and starter-kit deltas.
This file is normative for all S0+ pickup artifacts. It rides the planning arc
and does not touch the v10 ZIP, the Drive file, or the Mac sync.

**Normative language.** The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and
MAY in this playbook, in `shared-gates.md`, and in all `pickup-*.md` companions
are to be interpreted as described in RFC 2119. Companions use MUST/SHOULD/MAY;
bare imperatives and SHALL are not normative verbs (existing SHALL uses are
read as MUST).

## Purpose + non-goals

**Purpose.** Give every pickup a reproducible starting point:

- charter seed: mission, non-goals, trust boundaries, release definition;
- oracle candidates with an integrity-verification method — blob SHA-256,
  invocation-time SHA-256 recording, or a fetch-verify script. Never an
  unverified oracle;
- first claim registry: 8–15 claims with ATLAS R7 fields (R7 = ATLAS revision 7
  of the claim schema; it carries eight fields: class, validity
  domain, oracle, negative control/mutant, evidence artifact, do-not-claim
  boundary, owning bead, gate). Field vocabularies: class ∈ {measurement,
  conformance, interop, performance, competitive, practice} (pick the nearest;
  a claim may carry a second label after a slash); validity domain names the
  bounded scope the claim may support (type, host class, pin); gate names the
  gate whose PASS the claim feeds (bare `G1`…`G14`, `GATE-NNN`, or
  `GATE-<SLUG>-<NN>`); `owning bead` MAY read `TBD (cut at S5)` before beads
  exist — beads are cut at S5, so an earlier value would be a fabrication;
- gate profile: starter-kit G1–G14 as applicable + new gates via two paths:
  (a) shared gates proposed to `shared-gates.md` (constitution amendment +
  two evidence files); (b) type-local gates defined in the companion
  (`GATE-<SLUG>-<NN>`, no registry write);
- evidence tiers (Rulebook hierarchy, pickup numbering T0–T3 — see
  Claim/evidence governance);
- localbench bench shape: spec format, tiers, golden schema with A/A-derived
  tolerances, banking ceremony, measurement law, receipt naming, claims.tsv
  wiring;
- starter-kit profile deltas: which gates are load-bearing for this type,
  which are advisory. Starter-kit template additions nest under one root per
  type: `templates/<slug>/…` (e.g. `templates/rl-envs/…`); companions MUST NOT
  spread a type's templates across sibling roots.

**Non-goals.** Implementing any rewrite. Changing existing packets, briefs, or
the v10 line. Covering technologies outside the 21 without a new S1 amendment.
Requiring live-browser or secret-bearing verification the constitution cannot
perform — each pickup's own CI defines its secrets. Shipping releases, sites,
or ZIPs (that's L5 machinery, not this playbook).

## The 21 covered types

Each type gets one companion file, `pickup-<slug>.md`, instantiating this
playbook's slots (charter, oracles, claim registry, gate profile, bench shape,
starter-kit deltas). Closed set: adding a type is an S1 amendment.

| Type name | Slug | Companion file |
|---|---|---|
| LLM inference engines | `inference-engines` | `pickup-inference-engines.md` |
| Quantization toolkits | `quantization` | `pickup-quantization.md` |
| Structured output / constrained decoding | `structured-output` | `pickup-structured-output.md` |
| Embedding model serving | `embedding-serving` | `pickup-embedding-serving.md` |
| Agent orchestration frameworks | `agent-frameworks` | `pickup-agent-frameworks.md` |
| MCP servers/clients | `mcp` | `pickup-mcp.md` |
| Multi-agent protocols | `multi-agent-protocols` | `pickup-multi-agent-protocols.md` |
| Durable workflow orchestration | `workflow-orchestrators` | `pickup-workflow-orchestrators.md` |
| Sandboxed code execution | `sandbox-exec` | `pickup-sandbox-exec.md` |
| Browser-use stacks | `browser-use` | `pickup-browser-use.md` |
| Computer-use agents | `computer-use` | `pickup-computer-use.md` |
| Web search API layers | `web-search-apis` | `pickup-web-search-apis.md` |
| Agent memory systems | `agent-memory` | `pickup-agent-memory.md` |
| RAG frameworks | `rag-frameworks` | `pickup-rag-frameworks.md` |
| Vector databases | `vector-dbs` | `pickup-vector-dbs.md` |
| LLM eval harnesses | `eval-harnesses` | `pickup-eval-harnesses.md` |
| Agent observability/tracing | `observability` | `pickup-observability.md` |
| Guardrails | `guardrails` | `pickup-guardrails.md` |
| Fine-tuning infrastructure | `fine-tuning` | `pickup-fine-tuning.md` |
| RL envs / RLHF infra | `rl-envs` | `pickup-rl-envs.md` |
| Realtime voice-agent stacks | `voice-agents` | `pickup-voice-agents.md` |

Filenames and slugs are verified against `ls pickup-*.md` (2026-09-23); the
table above matches that listing. Cross-references anywhere in the pickup tree
use these slugs.

## Pickup lifecycle

The planning-arc S0–S5, adapted for bootstrapping one uncovered type. Each
stage has entry criteria, exit criteria, and a named artifact; a stage
skipped records its reason in `docs/planning/ROUND_LOG.md` (a `skip` line —
silence is not a record). Every stage after S0 requires the preceding
stage's exit; re-entry after reopen re-verifies pin + date.

**Working root.** A pickup executes in its own repository/tree root (the repo
where the pickup lives). Every relative path in this playbook —
`docs/truth-pack/`, `docs/planning/ROUND_LOG.md`, `docs/planning/GATE_LOG.md`,
`registries/`, `templates/` — resolves beneath that root, never beneath the
user's home repo or a sibling checkout. (If the pickup tree *is* nested in a
larger repo, the root is still the pickup's own subtree root.)

- **S0 — Intake.** Entry: the type is selected through Phase-0 (the
  pre-playbook selection machinery; Phase-0's standing record is `INTENT.md`'s
  Goal + 21-type sections) and `_evidence/<slug>.md` exists.
  Work: pull the type's evidence file; run the supply-chain intake check —
  list the type's top-level dependency set from the evidence file, inspect
  license files for the MIT+OpenAI/Anthropic rider (the frankensuite rider);
  a rider-bearing dependency is an auto-fail, recorded in the intake note with
  the dependency and license pointer; confirm the evidence bar (trend
  claims cite at least 5 live-verified *primary* type repos — dataset,
  reference, or adjacent repos do not satisfy the bar and are not counted
  toward the 5 — or the type says "thin evidence" explicitly). Exit: dated intake
  note at `docs/planning/s0-intake/<slug>.md` (format: `type=<slug> |
  date=<YYYY-MM-DD> | evidence=<pointer> | verdict=<INTAKE→CHARTERED|FAIL> |
  rider=<none|present: <dependency>>`), verdict INTAKE→CHARTERED.
- **S1 — Charter.** Entry: S0 exit. Work: draft the charter seed: mission,
  non-goals, trust boundaries, release definition (what artifact, at what
  pin, counts as a release). S1 drafts charter/INTENT prose; stable IDs are
  minted in S2 (see Namespaces), not here. Exit: charter section of `pickup-<slug>.md`
  stable.
- **S2 — Oracle pinning + claim registry.** Entry: S1 exit. Work: pin every
  oracle the type's claims will rest on (reference implementation commits,
  weight revisions, benchmark datasets, fixtures) inside a truth pack;
  register the first 8–15 CLAIM-* rows (ATLAS R7 fields) with REQ-*
  requirements and UNK-* typed unknowns. Every CLAIM-* row names the REQ-*
  it evidences, and every REQ-* row names the CLAIM-* rows that evidence it
  (bidirectional claim↔REQ binding). Exit: truth pack verifies
  (`fetch-truth-pack.sh --verify`), every claim carries tier + confidence.
- **S3 — Bench setup + gate wiring.** Entry: S2 exit. Work: instantiate the
  localbench bench shape (spec format, tiers, goldens, measurement law,
  receipts); wire the G1–G14 profile and the applicable shared (`GATE-001`…
  `GATE-018`) and type-local (`GATE-<SLUG>-<NN>`) gates; bank the first A/A
  goldens. The banking command is the pickup's local A/A runner: its
  executable and path are declared by the pickup (e.g. a local script), never
  assumed to be an undeclared binary. Exit: the declared A/A runner has
  produced a reviewed golden, and the gate log
  (`docs/planning/GATE_LOG.md`) shows zero FAIL verdicts on wired gates —
  i.e. every gate wired at this stage has a PASS, N-A (with reason), or
  WAIVED (with waiver record) verdict; a gate with no verdict is not wired.
  Row format: `gate=<id> | verdict=<PASS|FAIL|N-A|WAIVED> | evidence=<pointer>
  | date=<YYYY-MM-DD> | reason=<for N-A/WAIVED>`.
- **S4 — Fresh-context review rounds.** Entry: S3 exit. Work: independent
  reviewers work from the companion as the primary artifact (only explicitly
  cited files may be inspected); every finding becomes a typed DEF-*
  record; the integrator applies or formally rejects each. The round also
  verifies that every S0–S3 stage has its artifact or a `skip` record in
  `ROUND_LOG.md` — a missing artifact with no skip record is itself a P1.
  Exit: zero open P0/P1, no UNK-* with disposition BLOCKS_PLAN.
- **S5 — Steady state / beads.** Entry: S4 exit *and* a BEADS READY
  certificate in `ROUND_LOG.md` (see Review records). Work: convert to bd-*
  work beads; polish to the steady-state criteria. Exit: the type's pickup
  package is DONE and implementation may begin. `TBD` in any cost/provisioning
  requirement blocks S5 (see Bench slot 13). Certification scope: the
  `open_p0p1` count in the S5 registries (`docs/planning/s5/`) measures
  authoring-process DEFs, not a type's own pickup execution; certification of
  a type requires at least one type-specific S4 round with a type-specific DEF
  namespace — authoring-process counts never certify a type.

### S1 contradiction rule

`INTENT.md` is normative. A contradiction is an incompatible requirement
between source documents (not silence, not incompleteness). Executable
procedure: (1) quote both source sentences; (2) check whether either document
scopes its requirement to a different phase or namespace — scoping resolves
apparent conflict; (3) where the source documents are silent on a question
(e.g. the S0 sources contain no stable-ID namespaces), the user's explicit
requirement — represented in `INTENT.md` — governs (see Namespaces). Record
the contradiction and its resolution in the charter; an unresolved P0-level
contradiction blocks S1 exit.

### Evidence audit

Runs at least once in S0, during each full S4 round, and as a final pass
before S5. Each audit: check all P0-cited pointers and oracle pointers,
plus a reproducible random/risk sample of claim pointers (seed recorded in
the log; risk-weighted toward contested claims and oracle-adjacent rows).
A failed pointer creates a DEF, demotes every dependent claim one tier
(toward T3), reopens the stage that produced it, and blocks BEADS READY
until resolved.

## Claim/evidence governance

### Namespaces

Closed ID sets, used consistently across all S2+ artifacts (user requirement;
the S0 sources are silent on REQ-*/GATE-*/CLAIM-*/UNK-*, and the explicit
requirement governs — see the S1 contradiction rule):

- `REQ-*` — requirements the pickup must satisfy;
- `GATE-*` — shared gates (registry: `shared-gates.md`) and type-local gates;
- `CLAIM-*` — registered claims, one row per claim sentence, ATLAS R7 fields;
- `UNK-*` — typed unknowns with dispositions (see below; BLOCKS_PLAN blocks S5);

Unknown dispositions (every UNK-* row carries exactly one):- `BLOCKS_PLAN` — the S3 plan may not proceed to S5 until this is resolved or
  re-scoped; the resolution predicate is named in the UNK row.
- `TARGETED` — acknowledged gap, parked with a named promotion predicate
  (what evidence would close it); never cited as a result.
- `ADVISORY` — recorded for awareness; does not block any phase gate.
- `WATCH` — monitor at the phase gate; re-type if it materializes.
- `RESOLVED` — closed, with date and round recorded.
- `DEF-*` — S4 review deltas (severity P0/P1/P2), applied or formally rejected;
- `bd-*` — work beads cut at S5.

`REQ-CI-COST` (CI provisioning + cost ownership, bench slot 13) is a universal
cross-type requirement ID: every companion may use it bare (no type
namespace) rather than re-declaring a type-local twin — this is the
grandfathered canonical form.

The UNK ledger scan covers the entire companion text for `UNK-*` tokens —
canonical Unknowns rows *and* inline/duplicate mentions elsewhere in the
file; every occurrence's disposition must agree. The scan is owned by the S5
certification step: the certifying integrator runs it, and the `no
BLOCKS_PLAN` attestation on the cert line covers its result (in S4 rounds the
lane-A reviewer performs the scan as part of the completeness remit).

**Canonical ID formats.** New IDs follow these shapes, where `<SLUG>` is the
type's registered short code and `<NN>` is zero-padded:

- `REQ-<SLUG>-<NN>` — e.g. `REQ-VA-07`
- `GATE-<SLUG>-<NN>` — e.g. `GATE-MEM-02` (type-local gates only)
- `CLAIM-<SLUG>-<NN>` — e.g. `CLAIM-OBS-009`
- `UNK-<SLUG>-<NN>` — e.g. `UNK-VDB-01`
- `DEF-<slug>-<NNN>` — e.g. `DEF-rag-frameworks-014` (lowercase file slug,
  per-round sequence)

Shared gates keep the bare `GATE-NNN` form (`GATE-001`…`GATE-018`); the
starter-kit's G1–G14 keep their bare `G1`…`G14` form — never `GATE-G1`.
Registered short codes: IE `inference-engines`, Q `quantization`,
SO `structured-output`, EMB `embedding-serving`, AF `agent-frameworks`,
MCP `mcp`, MAP `multi-agent-protocols`, DW `workflow-orchestrators`,
SB `sandbox-exec`, BU `browser-use`, CU `computer-use`, WS `web-search-apis`,
MEM `agent-memory`, R `rag-frameworks`, VDB `vector-dbs`, EH `eval-harnesses`,
OBS `observability`, GR `guardrails`, FT `fine-tuning`, RL `rl-envs`,
VA `voice-agents`.

IDs minted at S2 are stable (INTENT.md): existing companions keep their
minted IDs even where they predate this format. New IDs follow the canonical
shapes, and any ID that collides with the shared `GATE-NNN` or bare `G1–G14`
namespaces is renamed (round-1 renames: `GATE-1..4` → `GATE-RL-01..04`;
`GATE-G1…GATE-G14` → bare `G1…G14`).

### Evidence tiers T0–T3

Pickup-local numbering of the Rulebook five-tier hierarchy — a documented
collapse, not a forked taxonomy (T2 merges the two "asserted but
unreproduced" classes). Every companion states this mapping verbatim in its
claim-registry section, or cites this playbook section by name; a companion
that states no mapping, or an inverted one (e.g. "T0 vendor / T1 independent"),
is non-conformant and gets a P1:

| Pickup tier | Rulebook tier | Meaning |
|---|---|---|
| T0 | [Verified] | Direct inspection of a fresh clone, API, live page, or a measurement
taken at a pinned oracle with invocation-time SHA-256 recorded |
| T1 | [CI-observed] | Executed and observed on CI / banked receipt; attests the suite *runs*,
not that it is green, and not that numbers are admissible |
| T2 | [Maintainer claim] / [External] | Asserted by repo docs or an independent source, not reproduced by us |
| T3 | [Inference] | Analyst judgment — always labeled as such, never silently upgraded |

Every substantive claim carries tier + confidence (High/Medium/Low); without
both it is a draft note, not a finding. Evidence-state vocabulary on claim
rows: `[OBSERVED@pin]`, `[REPORTED]`, `[EVIDENCED]`, `[PARTIAL]`,
`[TARGETED]`, `[HYPOTHESIS]` (nlp pattern). TARGETED ≠ OBSERVED: a number that
exists only as a provisional gate is labeled TARGETED by written policy.

### Result classes (what a number may support)

- **SELF-SPEEDUP / MAINTENANCE** — franken-before/franken-after comparison.
  May justify landing code; does not count as a campaign win.
- **CAMPAIGN WIN / INCUMBENT-WIN** — requires the actual legacy incumbent
  running side-by-side in the same invocation, the incumbent binary's SHA-256
  recorded, same-invocation dual A/A controls, and a 2x-null-margin
  statistical gate. Only CAMPAIGN WIN rows may support public competitive
  claims. Dual A/A nulls must land in [0.98, 1.02] or no cross-arm comparison
  is banked. (whisper PERF_LEDGER doctrine.)

### Negative-evidence ledger and retraction policy

- `docs/evidence/NEGATIVE_EVIDENCE.md`: every killed approach gets an NE-###
  entry with the evidence ID, what was attempted, what was measured, and a
  do-not-retry predicate **or** a resurrection condition
  (e.g. "a drafter with measured mean per-depth acceptance above ~0.6").
  Demotions are always allowed; `demotion-rules.md` says how.
- `docs/evidence/DISCREPANCIES.md`: DISC-### entries carry claim/evidence IDs,
  measured impacts, kill switches, and review dates. Non-verdicts are
  published, not buried (e.g. `[NO ADMISSIBLE RATIO]`, NO ADMISSIBLE
  PERFORMANCE VERDICT).
- **Retraction policy:** retracted entries stay in-tree with the lesson. The
  entry states it was wrong and *how* it was wrong — the way it was wrong is
  the useful part. Deleting a wrong entry is rewriting history.
- **Skip honesty:** XFAIL ≠ SKIP. Model-gated suites report skips honestly;
  no green without weights (`require_model!`-style harness gates); a suite
  that cannot run its weights-dependent tier says so instead of passing.
- The claim registry is machine-checkable: `docs/CLAIMS.json` + ledger schemas
  + `scripts/check_claims.py` linter, wired to observe (and ideally gate) on
  every commit; `registries/claims.tsv` binds each public claim sentence to
  its receipt. (nlp four-file adoption pattern; localbench claims.tsv wiring.)

## Truth-pack spec

Normative layout. Every pickup ships `docs/truth-pack/`:

```
docs/truth-pack/
  PIN_RECORD.md            # upstream pins (source commits, weight HF revisions,
                           # papers) with dates; honest skew notes — e.g. a code
                           # pin newer than the weights pin is stated, not hidden
  MANIFEST.sha256          # SHA-256 of every fixture blob the claims rest on
  ACCEPTANCE_SURFACE.json  # pre-committed break-even thresholds / quality budgets,
                           # written before the experiment, not after
  NONDETERMINISM_FLOOR.md  # the committed floor no bench may claim below
  fetch-truth-pack.sh      # fetches and --verify re-fetches + re-hashes against
                           # MANIFEST; refuses to proceed on mismatch
```

**Verify ceremony.** `fetch-truth-pack.sh --verify` is the only admission
path: re-fetch, re-hash, compare to MANIFEST, record the SHA-256 of every
binary that participates in a measurement **at invocation time** — no
un-recorded executable is admissible (whisper CAMPAIGN WIN rule; the
2026-08-11 Metal entry is the standing example of what happens when the
executable's hash is missing: measurements stay diagnostic only). The oracle
environment is frozen including what it can't do (exact dependency versions,
pinned-thread hardware notes). The bootstrap step itself gets supply-chain
honesty: if the installer arrives via an unpinned channel, that is labeled
the least-verified step of the chain.

**Pin acquisition procedure.** Pins are acquired at S2 by the plan author and
re-verified by the evidence auditor pre-S5: source commits via the hosting API
or a fresh clone (SHA-256 of the clone tarball recorded); weight revisions via
the registry's revision-hash API; dataset revisions via content hash of the
downloaded blob. Every acquisition is recorded in `PIN_RECORD.md` with the
fetch command, the date, and the pointer; a pin acquired from memory or by
guessing is rejected by the verify ceremony. `MANIFEST.sha256` semantics: the
file is the complete binding list — every blob named by any claim, pin record,
or fixture reference appears in it exactly once, and `--verify` fails on any
line mismatch, any missing blob, or any unlisted blob participating in a
measurement.

**Minimal schemas.** `MANIFEST.sha256` is a standard sha256sum-format file:
one line per blob, `<sha256>  <relative-path>`; every blob named by any
claim, pin record, or fixture reference appears in it, and `--verify`
fails on any line mismatch. `ACCEPTANCE_SURFACE.json` is a JSON object with
at minimum:

```json
{
  "version": 1,
  "written_before": "YYYY-MM-DD",
  "thresholds": [
    {"id": "THR-001", "metric": "...", "bound": "...", "direction": "lower|upper",
     "status": "TARGETED|OBSERVED", "basis": "gate criterion or measured floor"}
  ]
}
```

Every threshold carries `written_before` ≤ the experiment date; TARGETED
thresholds are provisional gates, never findings (see tier governance).

**Write-time origin binding.** Artifacts stamp their provenance at creation
(source SHA-256 written into the artifact header); the bar to move toward is
hash-chained, recipe-bound provenance verifiable offline by `doctor`.

**Non-model types.** The layout is the same; the content changes: pin the
reference implementation commit, the fixture corpus hash, and the harness
version (e.g. benchmark commit in every run manifest; dataset-version pins;
attribution files vendored with third-party datasets). [Inference: extending
the truth-pack pattern beyond model weights to reference-impl and
dataset pins is an inference from the tts/ocr/whisper pattern, not a
demonstrated cross-type practice.]

## Bench spec

Every pickup instantiates these thirteen localbench-derived slots in its
companion file's bench section:

1. **Spec format** — a `backend:model` string naming exactly what is measured
   (e.g. `vllm:qwen3-32b-awq`, `faiss:ivf4096-pq64`). The harness starts and
   stops backends itself.
2. **Named tiers** — workload tiers (localbench: conf, micro, replay, e2e, rel,
   relcold, relfresh, mem). Goldens bind PER TIER; a component update
   invalidates only the tiers it touches (re-bank those tiers only).
3. **Golden schema** — JSON per spec: `conformance` (named checks, each
   `level: MUST|SHOULD`, `verdict: PASS|FAIL`) + `metrics` (each with `value`,
   `spread` from A/A, `tol`, `tol_source` → banked receipt path, `better`
   direction). **Tolerance rule: `tol = max(3 × A/A relative spread, floor)`.**
4. **Banking ceremony** — goldens are written ONLY by an A/A pair run
   (the pickup's declared A/A runner, invoked with `<runner> <spec>
   --write-golden`: two runs → banked receipt + golden; refuses
   unsound A/A pairs), followed by `git diff goldens/` review in the same
   commit. Golden-regeneration-until-green is a named forbidden pattern.
5. **Host/generation binding** — `goldens/<host_id>/`; never compared across
   hosts or across generations (backend/harness updates = new generation).
   Status per golden: CURRENT / GENERATION-MISMATCH / UNAVAILABLE.
6. **Measurement law** — preflight refuses a busy machine (GPU/CPU > 25%,
   naming the processes); a run is marked CONTENDED if any non-backend process
   exceeds 25% GPU in a second; one unit under test at a time; loopback/local
   endpoints only — **a failed local call is a finding, never a cloud
   fallback**; park/unpark interfering residents during test windows.
7. **A/B discipline** — same-invocation A, B, A ordering; banked under a name.
8. **Receipts** — `docs/evidence/receipts/<kind>__<spec>__<timestamp>.json`
   (kinds: aa, ab, mem, run) + dated `.md` investigation notes; `runs/` is
   gitignored scratch.
9. **Incumbent pins** — `docs/evidence/incumbents.md`: exact versions + hashes
   of every external thing numbers depend on (server, harness, weights, OS).
10. **Claims wiring** — `registries/claims.tsv`: every public claim sentence is
    registered and machine-checked against its receipt on every commit.
    Schema (header + one row per claim sentence):
    `claim_id | sentence | tier | confidence | evidence | reqs | gate | status`.
    `reqs` lists the REQ-* the claim evidences (semicolon-separated);
    `evidence` is the receipt/pointer; `status` ∈
    `CURRENT|CONTESTED|RETRACTED|SUPERSEDED`.
11. **Negative-evidence ledger** — NEGATIVE_EVIDENCE.md, DISCREPANCIES.md,
    break-tests.md, demotion-rules.md (demotions always allowed; no
    self-grading without independent verification).
12. **Anti-reward-hacking law** — the 12 forbidden patterns, named here and
    mirrored verbatim in the pickup's own root `AGENTS.md` (the pickup tree
    root, not any other AGENTS.md; the names below make the law executable
    without the file): gate self-weakening, proof-class inflation, golden
    regeneration reflex, commit-stream pumping, tautological tests, easy-lever
    cherry-picking, close-pump abuse, scope-splitting, spec-editing as
    progress, conformance metastasis, dependency smuggling, bench-path
    hardcoding.
13. **CI provisioning + cost ownership** — the bench's compute bill is
    planned, not discovered: runner class/host, provisioning owner,
    funding owner/account, schedule, and a spend cap *before BEADS READY*.
    `TBD` in any of these fields blocks S5. The bench section records
    estimated and actual runner/GPU hours, lab cost, budget, funding owner,
    and the budget-exceeded disposition (what stops, who decides, what
    degrades gracefully). GPU-hour accounting also applies to the
    security gates it funds (see GATE-007).

**Remote-lab variant.** Types that cannot run locally (e.g. sandbox-escape
accounting, browser-use at scale) get a documented remote-lab variant — the
same ceremony against a pinned remote environment — rather than a weakened
local law.

## Gate registry summary

The starter-kit's G1–G14 are the port-rigor contracts, enforced at their
stage; every gate logs PASS/FAIL/N-A with evidence (A-Z Playbook step 22).
The table below is for orientation only — the authoritative definitions are
`_s0/g1-g14-reference.md` and the canonical operational definitions that
follow; in any conflict the reference governs:

| Gate | Contract | One line |
|---|---|---|
| G1 | ORACLE | Changed oracle files declared in `kit-oracle.yml` |
| G2 | PAIR | Paired operations change together per `paired-ops.tsv` |
| G3 | OWN | New ownership/allocation sites classified in `ownership.tsv` |
| G4 | CONTRACT | CI-only harness from `kit-contracts.yml` runs in a `.git`-less staged-tree copy |
| G5 | HOST | Ambient/host reads and new unsafe code declared in the same diff |
| G6 | UNSAFE | Every new unsafe site carries `// SAFETY:`; tree-wide unsafe inventory accounted |
| G7 | REVIEW | Sensitive changes require a diff-only review artifact |
| G8 | RULEBOOK | Bulk porting declared and evidenced via `kit-rulebook.yml` |
| G9 | IOU | Positive loop bound in `kit-loops.yml`; no unresolved structured IOUs at the phase gate |
| G10 | MIRI | CI-only `cargo miri test`; non-Rust projects set `rust: false` to skip |
| G11 | LAYOUT | Layout-sensitive Rust structs carry `size_of`/`align_of` assertions |
| G12 | AUDIT | Fix-class eradications declared in `kit-audits/*.audit`; exemptions via `exemptions.tsv` |
| G13 | NOSTUB | Stub markers (`unimplemented!`, `todo!`, …) in added lines block |
| G14 | REJECT | Every claimed safety property needs rejection evidence in `kit-rejections.tsv` |

### G1–G14 operational definitions (canonical)

Authoritative source: `_s0/g1-g14-reference.md`. The table above is the
index; these are the contracts a companion's gate profile maps against.

- **G1 ORACLE** — changed oracle files are declared in `kit-oracle.yml`;
  renaming an oracle file out of the oracle directory counts as weakening.
- **G2 PAIR** — paired operations change together per `paired-ops.tsv`.
- **G3 OWN** — new ownership/allocation sites are classified in
  `ownership.tsv` with evidence.
- **G4 CONTRACT** — the CI-only harness from `kit-contracts.yml` runs in a
  `.git`-less staged-tree copy.
- **G5 HOST** — ambient/host reads and new unsafe code are declared in the
  same diff.
- **G6 UNSAFE** — every new unsafe site carries `// SAFETY:`; the tree-wide
  unsafe inventory remains accounted for.
- **G7 REVIEW** — sensitive changes require a diff-only review artifact.
- **G8 RULEBOOK** — bulk porting is declared and evidenced through
  `kit-rulebook.yml`.
- **G9 IOU** — positive loop bound is declared in `kit-loops.yml`; no
  unresolved structured IOUs at the phase gate.
- **G10 MIRI** — CI-only `cargo miri test`; non-Rust projects may set
  `rust: false`.
- **G11 LAYOUT** — layout-sensitive Rust structs carry `size_of`/`align_of`
  assertions.
- **G12 AUDIT** — fix-class eradications are declared in
  `kit-audits/*.audit`; exemptions live in `exemptions.tsv`.
- **G13 NOSTUB** — specified stub markers in added lines block.
- **G14 REJECT** — each claimed safety property has rejection evidence in
  `kit-rejections.tsv`.

**Rust-centric gates (G6, G7, G11).** Companions for non-Rust projects MUST
use advisory/N-A language for these, or a clearly namespaced analog that is
labeled as an analog — never a redefinition of the canonical gate.
Examples: G6 advisory for a Python harness = "declare ambient-capability
reads in the same diff"; a namespaced analog = `GATE-<SLUG>-NN` with
"G6-analog" in its rationale, not "G6 (redefined)". A companion that could
not show the canonical definitions at authoring time says so explicitly and
maps them at S4 against this section, not against guessed functions.

The vendor technique catalog is a catalog, not gates: gates come only from
G1–G14 + ATLAS BUILD_READY + the shared pickup gates (GATE-001…GATE-018 in
`shared-gates.md`) + type-local gates defined in the companion file
(`GATE-<SLUG>-<NN>` per the Namespaces section). **Cross-cutting,
type-agnostic gates live in `shared-gates.md`** (GATE-001…GATE-018): benchmark
harnesses, truth-pack/oracle integrity, quantization quality loss, grammar
conformance + fuzz, deterministic replay, protocol conformance + interop,
sandbox escape + resource accounting, task-state evaluation, retrieval
recall, trace completeness/privacy, guardrail FP/FN, training reproducibility
+ eval-after-train, voice latency/interruption, deterministic doubles,
tiered CI, dependency pinning, spec-drift, flake quarantine. Each companion
file declares which are load-bearing vs advisory for its type.

### Gate hierarchy (L0 / L1 / L2)

Three levels, strict precedence L0 > L1 > L2. A lower level never restates a
higher level's criteria; it only adds type-specific parameters or extensions.

- **L0 — starter-kit G1–G14.** Mechanical port-rigor contracts from
  `run-all.sh` (operational definitions below). Load-bearing or advisory per
  the companion's gate profile; N-A only with a written reason.
- **L1 — shared pickup gates `GATE-001`…`GATE-018`** (registry:
  `shared-gates.md`). Governed by a single amendment procedure: a new L1 gate
  needs two independent `_evidence/*.md` files demonstrating the practice (or
  honestly labeling it a designed gap, `[Inference]`), a load-bearing vs
  advisory declaration per affected type, and acceptance criteria writable as
  PASS/FAIL/N-A with named evidence artifacts. Gates never come from the
  vendor technique catalog alone.
- **L2 — companion-local gates, namespaced `GATE-<SLUG>-<NN>`.** Registered
  in the companion's gate profile with acceptance criteria. An L2 gate that
  duplicates an L1 gate's acceptance criteria is merged into the L1 gate:
  the companion declares the L1 gate load-bearing and keeps only the genuine
  type-specific delta as its L2 extension. Round-1 merges: `GATE-AF1` →
  `GATE-005`; `GATE-MCP-01`/`GATE-MCP-02` → `GATE-006`;
  `GATE-MCP-03`/`GATE-MCP-04` → `GATE-017`; `GATE-MAP-1..4` → principally
  `GATE-006` with only genuine deltas retained; `GATE-DW-4` checked against
  `GATE-005` for overlap before retention.

ATLAS BUILD_READY sits alongside L0 as a cited build-discipline source (not a
registry gate and not an L1/L2 gate): a pickup may not claim build-readiness
its ATLAS build has not granted, but BUILD_READY never replaces a G1–G14,
shared-gate, or type-local-gate acceptance verdict.

## Roles + review process

- **Parent orchestrator** — the assignment authority for the whole S0–S5
  flow. Names the plan author, the integrator, the evidence auditor, and the
  reviewers per round; records role assignments in
  `docs/planning/ROUND_LOG.md`. No other role assigns work. Amendment and
  retirement authority: the parent orchestrator. Holds the
  provisioning/funding authority by default: approves the CI spend cap and
  the key-holding role for any secrets-gated tier (bench slot 13); may
  delegate either to a named role with a written record in ROUND_LOG.md.
- **Plan author** — drafts the companion `pickup-<slug>.md` against this
  playbook. Owns the first claim registry and the gate profile. The plan
  author is not the integrator, and may not review their own artifact.
- **Reviewers (2 or more per full S4 round)** — independent, no prior context
  on the type; work from the companion as the primary artifact, and may
  inspect only files the companion explicitly cites (not the live web at
  large). Live-pointer resolvability (does a cited URL/repo resolve on the
  live web) is the evidence auditor's remit, not the lane reviewers'. Every finding becomes a typed `DEF-*` record: severity P0/P1/P2,
  location, the claim it challenges, and the required fix (or the reason for
  formal rejection). A citation to a future/planned artifact (a forward
  reference) is permitted when labeled as such; a pointer to evidence that
  does not resolve is a failed pointer — a DEF, with the demotion rules of
  the Evidence audit applied.
- **Review lanes** — full S4 rounds are scored per lane, remits:
  - **A** completeness / traceability (every claim has evidence, every
    artifact is accounted for);
  - **B** architecture / boundaries (type scope, trust boundaries, gate
    profiles);
  - **C** failure / security / privacy / resources (adversarial and
    resource exhaustion reads);
  - **D** tests / oracles / claims (bench shape, oracle integrity, tier
    discipline);
  - **E** operations / release (CI, provisioning, release definition,
    provenance);
  - **F** fresh-agent usability / cold execution (a new agent can execute
    the companion cold).
  Per-round lane assignments may specialize within these remits and are
  logged on the round's `round` lines (field `lanes=<A,B,...>`).
- **Reviewer eligibility and independence** — a reviewer is ineligible if
  they authored or drafted the artifact under review, or previously reviewed
  it in an earlier round. Independence is attested (authored: yes/no;
  prior-review: yes/no) and logged in `ROUND_LOG.md` *before* the review
  begins (see the `attest` line type under Review records). A disputed P0/P1
  goes to another independent reviewer; the second independent reviewer's
  verdict is binding on the DEF's status, applied and recorded by the
  integrator. An unresolved P0 stays OPEN and blocks BEADS READY.
- **Integrator** — applies or formally rejects each DEF-* delta with a written
  reason; nothing is applied silently, nothing rejected without a record.
  The DEF log lives in `docs/planning/ROUND_LOG.md`. The integrator may not
  be the sole reviewer of the round.
- **Evidence auditor** — checks all P0-cited pointers and oracle pointers,
  plus a reproducible random/risk sample of claim pointers, against the live
  GitHub API (owner/repo/path must resolve; 404s are dropped, never
  guessed). Guards the no-memory-citation rule. A failed pointer becomes a
  DEF, demotes dependent claims, reopens the relevant stage, and blocks
  BEADS READY until resolved.

**S4 rounds run to steady state (max 3 rounds):**

After the third S4 round without a BEADS READY verdict, the integrator must
certify-or-abandon: either record BEADS READY with written reasons, or kill
the pickup (a `kill` line for genuine abandonment, or return to S1 with a
`reopen` line) with written reasons in `ROUND_LOG.md`. A type may not stall
in S4 indefinitely on integrator fiat. Written reasons may waive condition 2
(last diff POLISH) only, and only by enumerating the residual non-polish
changes and showing none touches a claim, gate, threshold, requirement, or
acceptance criterion. Conditions 3 (zero `OPEN`/`DEFERRED` P0/P1) and 4 (no
`BLOCKS_PLAN`) are never waivable: if they are unmet, the honest record is
`kill`, not BEADS READY.

1. Verdict **BEADS READY** recorded as a certificate (see Review records:
   DEF, ROUND_LOG, BEADS READY);
2. last diff **POLISH** — a complete final review round that produced no
   P0/P1 findings and changed only copy/format. POLISH is a review *round*,
   not a label: any change to a claim, gate, threshold, requirement, or
   acceptance criterion is substantive, re-opens S4, and voids a prior
   POLISH;
3. **zero `OPEN` and zero `DEFERRED` P0/P1** DEF-* records (P2s may carry
   forward as beads);
4. **no UNK-* with disposition BLOCKS_PLAN**.

At steady state the type's pickup package is DONE; implementation beads
(`bd-*`) may be cut. Reopen is a first-class transition, not a failure —
re-entry re-verifies pin + date. Reopen procedure: the parent orchestrator
records a `REOPEN` line in `ROUND_LOG.md` naming the artifact, the round,
and the trigger (new evidence, failed audit, disputed finding,
s4-exhaustion); the artifact
returns to the stage named in the trigger, and S4 re-runs from there — no
stage may be skipped on re-entry.

## Review records: DEF, ROUND_LOG, BEADS READY

**DEF statuses.** Every `DEF-*` record carries exactly one status:

- `OPEN` — raised, not yet fixed or rejected;
- `FIXED` — fix applied; the record cites the fixing diff/location;
- `WONTFIX` — formally rejected with a written rationale (the rationale is
  the record; a bare WONTFIX is invalid);
- `DEFERRED` — consciously postponed with a written rationale naming the
  stage that will own it.

`FIXED` and `WONTFIX`-with-rationale both close a DEF. `DEFERRED` does not
close P0/P1: a deferred P0/P1 blocks BEADS READY exactly like an OPEN one.

**ROUND_LOG.md line grammar.** `docs/planning/ROUND_LOG.md` is
machine-readable: one record per line, fields separated by ` | `, keys in
lowercase. Each record opens with a bare lead tag naming the record type
(`attest`, `unk`, `audit`, `stage-artifact`, `intake`, `cert`, `skip`,
`reopen`, `kill`); only `round` and `def` records lead with a keyed field
(`round=<N>`, `def=<DEF-id>`). Round lines (one per reviewer per round; the verdict is
authoritative on the final round line of the round):

```
round=<N> | artifact=<file> | pin=<sha|UNCOMMITTED> | reviewer=<name> |
  independence=authored:no,prior-review:no | verdict=<BEADS READY|POLISH|OPEN|REOPEN> |
  polish=<yes|no> | lanes=<A,B,C,D,E,F>
```

`pin=UNCOMMITTED` is permitted only for a backfilled round line whose reviewed
tree was never committed; it never appears on a `cert` line. On a `cert`
line, `pin=` carries the sha256 (first 16 hex chars) of the certified
artifact file at certification time.

Pre-review attestation lines (written before the review begins, one per
reviewer — the round line alone cannot carry a pre-review attestation):

```
attest | round=<N> | reviewer=<name> | independence=authored:no,prior-review:no
```

UNK lines (written when a companion's UNK row is minted or re-typed; this is
the aggregate UNK ledger the certificate checks):

```
unk | id=<UNK-id> | companion=<pickup-<slug>.md> |
  disposition=<BLOCKS_PLAN|TARGETED|ADVISORY|WATCH|RESOLVED> |
  resolution=<predicate|-> | owner=<role|->
```

Evidence-audit lines (one per audit run):

```
audit | round=<N|s0|pre-s5> | scope=<p0-pointers|oracle-pointers|sample> |
  result=<pass|fail> | seed=<n|unrecorded> | checked=<count> | failed=<count>
```

`seed=unrecorded` is permitted only on a backfilled audit line whose run
predates this grammar and whose seed was never recorded; all new audits
record a numeric seed.

Stage-artifact registration lines (written at each stage exit; the S4
skip-check verifies against these, not against interpreted exit text):

```
stage-artifact | stage=<S0..S3> | artifact=<path>
```

Intake lines (written at S0 exit, one per type; `evidence=` points at the S0
intake note path):

```
intake | type=<slug> | date=<YYYY-MM-DD> | evidence=<pointer> |
  verdict=<INTAKE→CHARTERED|FAIL> | rider=<none|present: <dependency>>
```

Certificate lines (the BEADS READY record itself, machine-readable; a
`result=NOT READY` line is a status record, not a certificate — it documents
that no BEADS READY certificate exists, with the blocker in `note`):

```
cert | round=<N> | artifact=<file> | pin=<sha> |
  result=<BEADS READY|NOT READY> |
  signers=<parent-orchestrator>,<reviewer>,... | audit=<pass|fail> | polish=<yes|no> |
  note=<text|->
```

`pin=UNCOMMITTED` never appears on a cert line. A `result=NOT READY` line
does not satisfy the BEADS READY checks below.

DEF lines:

```
def=<DEF-id> | severity=<P0|P1|P2> | status=<OPEN|FIXED|WONTFIX|DEFERRED> |
  location=<file:line> | claim=<CLAIM-id|-> | fix=<what changed> |
  owner=<role> | evidence=<pointer|-> | rationale=<why|->
```

Skip lines (a stage with no artifact must say so — silence is not a record;
`artifact=` names the would-be artifact path that is absent; only S0..S3 may
be skipped — S4 and S5 cannot):

```
skip | stage=<S0..S3> | artifact=<file> | rationale=<why no artifact>
```

Reopen lines:

```
reopen | artifact=<file> | round=<N> | trigger=<new-evidence|failed-audit|disputed-finding|s4-exhaustion> |
  return-stage=<S0..S4>
```

`s4-exhaustion` is the trigger for the certify-or-abandon mandated return
after the third S4 round without a BEADS READY verdict.

Kill lines (genuine abandonment — REOPEN is return-to-S1, not abandonment):

```
kill | artifact=<file> | round=<N> | reason=<why>
```

**BEADS READY certificate.** S5 may start only when a `cert` line exists in
`ROUND_LOG.md` carrying `result=BEADS READY`, with all of:

- artifact + pin (the exact files and commit the round reviewed);
- round number;
- signers (parent orchestrator + at least one independent reviewer; the
  plan author and the integrator are not sufficient alone);
- attestations, each checkable from the log (the `polish=yes` disjunct's
  second arm — "the certifying round itself produced no P0/P1 and changed
  only copy/format" — rests additionally on the certifying integrator's diff
  judgment, recorded in the cert line's `note` field):
  - the log parses against the grammar above (schema-valid);
  - zero `OPEN` and zero `DEFERRED` P0/P1 `def` records;
  - no `unk` line with disposition `BLOCKS_PLAN`;
  - the latest `audit` line carries `result=pass` (evidence audit passed;
    cadence: see Evidence audit);
  - every stage S0–S3 has a `stage-artifact` record or a `skip` record in
    the log;
  - bench slot 13's cost/provisioning fields are non-TBD (the spend cap is
    recorded before BEADS READY; the cert line's `note` field records the
    cap or, for the authoring-process certificate where no CI spend exists,
    `slot-13=N/A (authoring process, no CI spend)`);
  - the `polish=yes` field on the cert line, meaning the most recent round
    line carries verdict POLISH, or the certifying round itself produced no
    P0/P1 and changed only copy/format, or the escape-hatch condition-2
    waiver was invoked with the enumerated residual changes and reasons
    recorded in the cert line's `note` field.

**What BEADS READY does NOT authorize.** BEADS READY closes planning. It
does not authorize implementation, fund CI spend, waive any gate, or certify
that a future port will pass — only that this pickup plan is internally
consistent and its evidence checks out.

## What this playbook does not cover

- **No implementation.** Companion files are starting points, not build plans.
  No rewrite guidance for any specific type lives here.
- **No new namespaces.** REQ/GATE/CLAIM/UNK/DEF/bd-* are closed sets; changing
  them needs a constitution amendment, not a companion file.
- **No corpus re-adjudication.** The 44-repo assessments, their verdicts, and
  their NODUS rings are immutable evidence substrate (L1), not pickup inputs.
- **No selection decisions.** NODUS ring forecasts and the 53-edge dependency
  screen are Phase-0 machinery; this playbook starts after a type is chosen.
- **No cross-type synthesis.** Patterns shared across the 21 types may be
  proposed as new GATE-* entries (needs two independent evidence files), but
  the playbook does not itself synthesize a meta-theory of agentic tooling.
- **No live or secret-bearing verification.** The constitution requires
  repo-verifiable, CI-verifiable practices; any gate needing credentials or a
  live browser is the pickup's own CI's problem to define and fund.
- **No publication mechanics.** Releases, briefs, the site, and the versioned
  ZIP are L5; this playbook stops at BEADS READY.

## Glossary (one-line definitions)

Shorthand used in this playbook and the companions; the gate-hierarchy
L0/L1/L2 is a different namespace from the evidence layers L1/L5 below —
never mix them.

- **ATLAS BUILD_READY** — the ATLAS project's build-ready verdict: a
  PASS/FAIL record emitted by the ATLAS build pipeline when a staged tree
  satisfies its build contract (compiles, links, and passes the build's own
  smoke tier). It lives in the ATLAS project's build log, not in this
  pickup's gate registry; it sits alongside L0 as a cited build-discipline
  source (see Gate hierarchy), never as a registry or type-local gate. Gates
  come from G1–G14 + ATLAS BUILD_READY + the shared pickup gates
  (`GATE-001`…`GATE-018`) + type-local gates (`GATE-<SLUG>-<NN>`) defined in
  the companion, never from the vendor technique catalog alone.
- **NODUS** — the ring classification from the 44-repo assessments
  (Monitor / Explore / Pilot); NODUS rings are immutable evidence substrate.
- **L1 (evidence layer)** — the immutable evidence substrate: the 44-repo
  assessments, their verdicts, and their NODUS rings. Not pickup inputs.
- **L5 (publication layer)** — releases, briefs, the site, and the versioned
  ZIP. This playbook stops at BEADS READY; it does not cover L5 mechanics.
- **Phase-0** — the pre-playbook type-selection machinery (NODUS ring
  forecasts, the 53-edge dependency screen). S0 entry requires Phase-0
  selection plus `_evidence/<slug>.md`.
- **53-edge dependency screen** — the Phase-0 dependency-edge screen used
  during type selection; not re-run inside the pickup stages.
- **A-Z Playbook** — the step-methodology in `_s0/ecosystem-digest.md` whose
  step 22 requires every gate to log PASS/FAIL/N-A with evidence; the gate-log
  row format (gate/verdict/evidence/date) is restated in this playbook's S3
  exit criteria.
- **Load-bearing vs advisory** — a load-bearing gate must PASS (or be
  formally waived) before BEADS READY; an advisory gate is evaluated and
  recorded but does not block.
- **A/A runner** — the pickup's declared A/A-runner executable (declared path,
  e.g. a local script); companion shorthand `` `aa <spec>` `` means an
  invocation of the declared runner, never an undeclared binary. The runner
  is named in the pickup's bench section (bench slot 4) before any golden is
  banked.
- **Universal (gate-disposition vocabulary)** — applies to all types by
  constitution (GATE-014 deterministic doubles, GATE-015 tiered CI, GATE-016
  dependency pinning, GATE-018 flake quarantine): load-bearing unless a
  written N-A or waiver applies. All 21 companion gate profiles use this
  disposition; a table that drops a universal gate without a written N-A/waiver
  reason is non-conformant.
- **TARGETED vs OBSERVED** — TARGETED = a provisional gate threshold,
  written before measurement; OBSERVED = a measured number. Never confuse
  them; see tier governance.
