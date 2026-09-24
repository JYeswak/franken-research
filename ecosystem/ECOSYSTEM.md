# FrankenSuite Ecosystem — Unified Layered Architecture

Phase 2 design doc. Covers: 44 assessment packets, Rulebook v1.0, six synthesis docs, starter kit + G1–G14, vendor-port learnings + 35 techniques, external-validation stories, ATLAS-ARC, PLANNING-ARC, franken-harvest (`fh`), four smaller Mac skills. Status legend used throughout:

- **EXISTS** — real, inspected, in-repo.
- **PARTIAL** — exists but incomplete or unexecuted at its pin.
- **SPEC** — specified, not shipped.
- **PROPOSED** — proposed in a doc, adopted nowhere.
- **MISSING** — named gap, no artifact.

## 1. Layer map

Five layers, one governance spine. Information flows down as requirements and up as evidence; nothing skips a layer.

```
L1  EVIDENCE SUBSTRATE     44 packets · source pins · Rulebook tiers · fh evidence rows · external-signal ledger
 |  I1 claim tuples (claim, tier, confidence, source)
 v
L2  METHOD KERNEL          stable IDs · claim registry (ATLAS R7 schema) · evidence classes · typed unknowns
 |  I2 registries + unknowns feed planning              defects · receipts · demotion/reopen rules · G1–G14 contracts
 v
L3  PLANNING CONSTITUTION  ATLAS state machine (normative) · PLANNING default route (historical)
 |  I3 BUILD_READY certification → executable work
 v
L4  EXECUTABLE MACHINERY   starter-kit scripts · validators · bead compiler/audits · CI gates · fh · swarm interfaces
 |  I4 receipts · CI verdicts · negative ledgers
 v
L5  DECISION + PUBLICATION NODUS/Wardley selection · dependency matrix · idea catalog · packets · briefs · site · releases

GOVERNANCE SPINE (all layers): provenance/identity · freshness/staleness · fh status algebra [PROPOSED — design assertion, no in-tree source] ·
  no self-approval · context budgets · do-not-claim boundaries · reversible closure
```

Layer interfaces:

- **I1 (L1→L2):** packets export claim tuples `(claim text, Rulebook tier, confidence, source ref)`. Nothing enters L2 without a tier tag.
- **I2 (L2→L3):** claim registry, unknown/disposition registry, defect ledger feed the ATLAS state machine; review emits `DEF-*` deltas back into the registries.
- **I3 (L3→L4):** `BUILD_READY` is the only legal handoff — no blockers, every dimension ≥8, average ≥8.5, traceability/graph/fresh-agent executability ≥9 (ATLAS).
- **I4 (L4→L5):** receipts, CI verdicts, negative ledgers land in packets/briefs/site; release attestation cites receipts, not prose.
- **I5 (L5→L1):** published packets become new substrate; pin + date re-verified on re-entry.
- **I6 status vocabulary:** fh's closed algebra is the cross-layer status set — `PASS, RED, UNRUN, EMPTY, UNKNOWN, STALE, REFUSED, QUESTION_MISMATCH, INCOMPLETE, REGRESSION` (+ careful `UNMEASURED`). No layer invents new verdict words.
- **I7 selection input:** NODUS rings + dependency-matrix edges + 67 ideas + external-signal ledger → intake decision. Signals select; they never evidence local claims.

## 2. Canonical registries (the method kernel's data contract)

One schema per registry, owned by L2. ATLAS defines the normative fields; existing artifacts map onto them:

| Registry | Normative source | Existing implementations that map to it |
|---|---|---|
| claims | ATLAS R7 (class, domain, oracle, mutant/negative control, artifact, do-not-claim boundary, owner, gate) | starter-kit claim registry; packet claim inventories (Rulebook tiers `[Verified]/[CI-observed]/[Maintainer claim]/[External]/[Inference]` + High/Med/Low) |
| unknowns | ATLAS R3 typed dispositions | packet Limitations; PLANNING `INFER` labels |
| decisions / ADRs | PLANNING truth hierarchy | packet §4.x verdict records; fh decision-evidence rows |
| interfaces / invariants | ATLAS | starter-kit `LIFETIMES.tsv` (T-B2); G11 layout assertions |
| risks | ATLAS | packet bear case; dependency-matrix `risky` edges |
| gates | ATLAS | G1–G14; starter-kit readiness/check scripts; fh `run_stage` gates |
| workstreams / beads | ATLAS beads registry | `.beads/issues.jsonl` in repos; PLANNING bead graph |
| receipts | ATLAS loop `RECEIPT` | fh evidence rows; CI run records; PROOF.md bundles |
| defects | ATLAS `DEF-*` | PLANNING review-round findings; packet drift hits |
| negative evidence | cross-pollination §3 | frankenredis 26,485-line ledger (exemplar); gauntlet's three ledgers |

Mapping rule: Rulebook tiers tag *where a claim came from*; ATLAS R7 fields state *what the claim must carry to be closable*. Both ride on the same claim row.

## 3. Artifact placement

| Artifact | Layer | Core absorbs | Stays standalone | Interface |
|---|---|---|---|---|
| 44 assessment packets | L1 (substrate) | claim tuples, drift instances, CI verdicts, NODUS rings → registries | packets themselves: immutable research evidence, read-only | I1, I5 |
| Rulebook v1.0 (2026-09-22) | L2 (kernel) | tiers, six separations, 11-section structure, ring rules, drift/QA checklists | the document: versioned constitution, never silently edited | tiers → claim rows; ring rules → I7 |
| Six synthesis docs | L1/L5 | negative patterns (P1–P14), CI classes (C1–C6), hurdles (H1–H6), 14 cross-pollination concepts, per-project uniqueness | docs as research artifacts | concepts → kernel candidates, each tagged adopted/proposed |
| Starter kit (Phase A/B/C) | L4 | all: readiness checker, claim-discipline checker, canary, CI backstop, cold tests | scripts as the reference implementation | gates → ATLAS gate registry; receipts → I4 |
| G1–G14 | L2/L4 | all 14 as port-rigor contracts (ORACLE, PAIR, OWN, CONTRACT, HOST, UNSAFE, REVIEW, RULEBOOK, IOU, MIRI, LAYOUT, AUDIT, NOSTUB, REJECT) | — | gate registry; G14 ↔ Rulebook-tier mapping |
| Vendor learnings + 35 techniques | L2/L4 | all 35 (T-C1–18, T-B1–10, T-N1–7) as a **technique catalog**, not gates | doc as provenance | bound per-wave in execution plans |
| external-validation-2026-09 | L1/L5 | five stories as a **signal ledger** for selection | — | I7 only; never I1 (not local evidence) |
| ATLAS-ARC v1.0.0 | L3 | control semantics whole: states, R1–R10, roles, registries, loop, BUILD_READY, closure | — | normative; every layer conforms |
| PLANNING-ARC | L3 | review-round grammar, KNOW/INFER labeling, bead conversion/polish cadence, truth hierarchy, "no process porn" | doc as historical provenance (must stay evidence-labeled) | default route; feeds DEF-* into ATLAS |
| `fh` (franken-harvest) | L4 | evidence classes (movement/capability/doctrine/decision) → claim/source/receipt registries; status algebra → I6 | the CLI: product-specific mirror, install, retrieval, failure contracts; `BUILT ≠ WIRED`; never dispatches (omp-orchestrator owns dispatch) | I2 (evidence rows in), gate linkage (decision rows) |
| rust-unsafe-code-exorcist | L4 | classification operators → G6/UNSAFE gate procedure | the skill: standalone instrument | artifacts filed to gate registry |
| running-the-gauntlet | L4 | 16-phase loop, three pillars, convergence rule (≥10 rounds, ≥2 clean), negative-ledger mandate → verification doctrine | the skill: standalone instrument | FINAL_GAUNTLET_REPORT → I4 |
| local-evidence-desk | L4 | read-only intake brief pattern; hard rules (no mutation, no upgrading DEGRADED/UNRUN) | the skill: standalone instrument | pre-action evidence for L3 intake |
| porting-to-rust | L4 | wave/migration operators → execution plans | the skill: standalone instrument | bound per project |
| Dependency matrix (53 edges) | L5 | ok/risky edge tags → selection screen | doc as decision input, refreshed per project | I7 |
| 67 build ideas | L5 | idea format → selection backlog | catalog as decision input | I7 |
| Briefs + site (v10) | L5 | packet-quoting + mechanism-mapping gates (hardened after Opus DO NOT SHIP) | publication surface | I4 in; site gaps → M2/M3 |

## 4. ATLAS-ARC vs PLANNING-ARC — resolved

**ATLAS-ARC is the normative constitution.** It owns: state machine and transitions, roles and separation (R6 no self-approval), stable IDs (R2), typed unknowns (R3), review semantics (R4: rounds emit `DEF-*` deltas, never competing plans), fresh-agent build-readiness oracle (R5), claim requirements (R7), context budgets (R8), graph validity = architecture validity (R9), reversible closure (R10), breadth-before-depth (R1), and the implementation loop (ORIENT→…→HANDOFF). Machine truth lives in `.atlas-arc/` JSONL registries.

**PLANNING-ARC is the historical reconstruction.** It owns provenance of Jeffrey Emanuel's observed workflow across the assessed repo set: whole-problem single-model plan authoring, human intent dump, fresh full-context review rounds (4–5 to steady state), bead conversion, 3–9 polish passes by weight, swarm after BEAD GATE, 80%+ effort before code, truth hierarchy (registries/schemas > plan/ADRs > tests/proof > implementation > docs), KNOW (evidence-quoted) vs INFER (never upgraded by repetition), and the "NO PROCESS PORN" anti-pattern.

**Precedence rule:** where both speak, ATLAS states what is *required*; PLANNING supplies the *default historically-evidenced procedure* for satisfying it. PLANNING's INFER-labeled content never overrides an ATLAS rule. Concrete resolutions:

- Review: PLANNING S4 rounds execute; their output conforms to ATLAS R4 (DEF-* deltas into registries). PLANNING S3's one optional competing-plan synthesis is permitted once; after that, deltas only.
- Breadth: PLANNING already cites ATLAS R1 as a *bounded rescue* when a plan cannot fit one context — confirming ATLAS is the generalized layer and PLANNING the historical instance.
- Beads: PLANNING S8/S9 conversion+polish produce the bead graph; ATLAS R9 + R5 certify it (valid graph, fresh-agent executable).
- Ceremony: PLANNING's "no process porn" and ATLAS R8 context budgets jointly forbid theater; starter-kit's honesty checks (local hook advisory, CI enforcing) are the mechanism.
- Closure: PLANNING S11 reality check/bridge feeds ATLAS R10 reversible closure; reopen is a first-class transition, not failure.

## 5. Missing ecosystem capabilities

- **M1 — Cross-suite claim registry.** Per-project registries exist (starter kit). No unified registry across the 44; packet claims are not machine-queryable.
- **M2 — Site knowledge surfaces.** No transferable-techniques page, no common-failure-modes page, no lesson index, no "reproduce a verdict" procedure (cold-review gap report, 2026-09-23).
- **M3 — Runnable kit + matrix surface.** Starter kit not exposed alongside the site; no sortable matrix/export/compare surface.
- **M4 — Independent-validation pipeline.** H3 evaluation paradox stands: 0/44 third-party validation; the rider (H1) bars the best-equipped validators. No carve-out, no counsel opinion.
- **M5 — `fh` as evidence substrate.** `fh wwjd` SPEC [PROPOSED — design assertion, no in-tree source]; doctor RED (schedule/pin drift) [PROPOSED — design assertion, no in-tree source]; harvest coverage 115 requirements / 0 covered. fh is UNRUN as substrate until doctor goes green.
- **M6 — Proposed Rulebook upgrades adopted nowhere.** Tier 0 `[Unrepresentable]`, claim statuses `compile-rejected` / `runtime-checked`, honesty-apparatus upgrades `[NV]` are PROPOSED. Applying them silently to v1.0 packets is forbidden; adopt by versioned amendment only.
- **M7 — Demand signals.** Cold-test battery exists; real demand evidence for new builds is absent.
- **M8 — Succession.** Bus factor 1 in 44/44; no second committer, no succession mechanism anywhere.

## 6. Anti-duplication rules

1. One claim schema (ATLAS R7 + Rulebook tiers). Packet tiers and their sanctioned Rulebook flavors map onto it; no unsanctioned forked taxonomies.
2. One status algebra is proposed (fh's, I6) [PROPOSED \u2014 design assertion, no in-tree adoption source]. New verdict words are rejected; the fh algebra itself is not yet ratified.
3. One review grammar: DEF-* deltas. PLANNING rounds feed it; competing plans are not a standing mechanism.
4. The 35 vendor techniques are a catalog, not gates. Gates come only from G1–G14 + ATLAS BUILD_READY.
5. `fh` reads and retrieves; it never dispatches [PROPOSED — design assertion, no in-tree source]. No second dispatcher gets built.
6. External stories are selection signals (I7), never local evidence (I1). Citing a story to support a local claim is laundering.
7. PROPOSED ≠ adopted. Every proposed upgrade carries its tag until a versioned amendment lands.
8. Starter-kit local hooks are advisory; CI is enforcing. Nothing that only ran locally counts as gated.
9. Release artifacts must target the assessed commit. Earlier-commit releases (H5 pattern) do not satisfy any gate.

## 7. What not to claim (fabrication guard)

- Do not depict machinery that does not exist (cold-review P0 class). Every dramatization maps to a real mechanism.
- Do not cite unavailable artifacts. fh rows while doctor is RED are UNRUN, not evidence.
- Do not present SPEC items (`fh wwjd`, M1–M8) as shipped.
- Do not upgrade PLANNING INFERs to facts by repetition.
- Hard completion markers only: gates don't ride a version until the marker is written.
