# Ecosystem Digest — structural reference for plan authors (S0)

Sources: `ecosystem/ECOSYSTEM.md`, `ecosystem/A-Z-PLAYBOOK.md`,
`RULEBOOK.md` (v1.1, 2026-09-23), `synthesis/00-overview.md`,
`synthesis/ci-requirements.md`. Line citations refer to those files.

**Three bounding facts.** (1) ECOSYSTEM.md defines **five** layers, not
six: "Five layers, one governance spine. Information flows down as
requirements and up as evidence; nothing skips a layer."
(`ecosystem/ECOSYSTEM.md:13`). (2) The `REQ-*`/`GATE-*`/`CLAIM-*`/`UNK-*`
ID conventions do **not** appear in any of the five sources — IDs that
do: ATLAS R2 stable IDs, `DEF-*` review deltas, bead IDs (`bd-*`),
project-scoped claim IDs (`FE-CLAIM-010`, `CLAIM-RAW-001…`). (3)
ATLAS-ARC is "the normative constitution," PLANNING-ARC "the historical
reconstruction" (`ecosystem/ECOSYSTEM.md:87-89`) — neither was among
the five sources; read them for normative fields.

Status legend across the docs (`ecosystem/ECOSYSTEM.md:3` header):
**EXISTS** = real, inspected, in-repo · **PARTIAL** = exists but
incomplete/unexecuted at pin · **SPEC** = specified, not shipped ·
**PROPOSED** = proposed in a doc, adopted nowhere · **MISSING** = named
gap, no artifact.

---

## 1. The five layers and what lives in each

- **L1 — Evidence substrate.** The 44 assessment packets (immutable
  once published; re-entry re-verifies pin + date), source pins,
  Rulebook tiers, fh evidence rows, external-signal ledger
  (`ecosystem/ECOSYSTEM.md:35-47`, I1/I5).
- **L2 — Method kernel.** The data contract: stable IDs (ATLAS R2),
  claim registry (ATLAS R7 schema), evidence classes, typed unknowns
  (ATLAS R3). Rulebook v1.1 lives here as "versioned constitution, never
  silently edited"; its tiers tag claim rows, its ring rules feed
  selection (`ecosystem/ECOSYSTEM.md:50-61,67`).
- **L3 — Planning constitution.** ATLAS-ARC owns states, transitions,
  roles, R1–R10, registries, the implementation loop, BUILD_READY,
  reversible closure; PLANNING-ARC owns the historically-observed
  default route (fresh review rounds, bead conversion/polish, truth
  hierarchy, KNOW/INFER). Precedence: ATLAS states what is *required*;
  PLANNING supplies the *default procedure*; INFERs never override ATLAS
  rules (`ecosystem/ECOSYSTEM.md:87-101`).
- **L4 — Executable machinery.** Starter-kit scripts/validators, bead
  compiler/audits, CI gates, `fh`, swarm interfaces, four Mac skills
  (unsafe-exorcist → G6, gauntlet, local-evidence-desk, porting-to-rust).
  Local hooks are advisory; CI is enforcing
  (`ecosystem/ECOSYSTEM.md:55-79`; rule 8 at `:118`).
- **L5 — Decision + publication.** NODUS/Wardley selection, dependency
  matrix (53 edges), 67-idea catalog, packets, briefs, site, releases.
  Release attestation cites receipts, not prose (`ecosystem/ECOSYSTEM.md:41`, I4).

**Interfaces** (`ecosystem/ECOSYSTEM.md:35-47`): **I1** L1→L2 — claim
tuples `(claim text, tier, confidence, source ref)`; nothing enters L2
untiered. **I2** L2→L3 — claim registry, unknown/disposition registry,
defect ledger feed ATLAS; review emits `DEF-*` deltas back. **I3** L3→L4
— `BUILD_READY` is the only legal handoff: no blockers, every dimension
≥8, average ≥8.5, traceability/graph/fresh-agent executability ≥9. **I4**
L4→L5 — receipts, CI verdicts, negative ledgers land in
packets/briefs/site. **I6** — fh's closed status algebra is the
cross-layer verdict vocabulary (see §6); no layer invents new verdict
words. **I7** — NODUS rings + dependency edges + 67 ideas +
external-signal ledger → intake decision; "Signals select; they never
evidence local claims."

---

## 2. Claim registry, evidence tiers, IDs, unknowns

**Claim-row shape.** One schema: ATLAS R7 + Rulebook tiers. R7 fields: `class, domain, oracle, mutant/negative control, artifact, do-not-claim boundary, owner, gate` (`ecosystem/ECOSYSTEM.md:50`). Mapping rule: "Rulebook tiers tag *where a claim came from*; ATLAS R7 fields state *what the claim must carry to be closable*. Both ride on the same claim row." (`ecosystem/ECOSYSTEM.md:61`). One schema only — no unsanctioned forked taxonomies (`ecosystem/ECOSYSTEM.md:112`, rule 1).

**Evidence tiers** (`RULEBOOK.md:48-58`, §1): **[Verified]** (direct inspection of fresh clone / API / live page) · **[CI-observed]** (observed executing on live CI; attests the suite *runs*, not that it's green) · **[Maintainer claim]** (README/docs, unreproduced) · **[External]** (independent sources; absence of coverage is a finding) · **[Inference]** (analyst judgment, always labeled). v1.1 flavor sub-labels (`[Code-verified]`, `[Counted]`, `[Git-observed]`, `[Verified absence]`, `[License-verified]`…) — each maps to exactly one tier, stated in the packet legend; `[CI-observed]` is Tier 2, never a flavor of `[Verified]`. Confidence: **High** (multiple converging sources or direct inspection) · **Medium** (single solid source, plausible) · **Low** (thin evidence, extrapolation) — "Grade the claim, not the analyst's feelings." Every substantive claim carries tier + confidence; without both it's "a draft note, not a finding" (`RULEBOOK.md:31`, §0).

**Stable IDs.** ATLAS R2 owns them (`ecosystem/ECOSYSTEM.md:87`). Conventions: review rounds emit **`DEF-*`** deltas into registries — never competing plans (R4); plan v1 carries stable plan IDs (`A-Z-PLAYBOOK.md:60-64`, step 11); work units use bead IDs (`bd-*`); projects use claim namespaces (`FE-CLAIM-010`, `CLAIM-RAW-001`). Machine truth lives in `.atlas-arc/` JSONL registries. No `REQ-*`/`GATE-*`/`UNK-*` convention exists in the five sources.

**Typed unknowns.** ATLAS R3 defines typed dispositions; the unknowns registry is seeded in `.atlas-arc/` JSONL alongside requirements, decisions, interfaces, invariants, claims, risks, gates, workstreams, beads (`A-Z-PLAYBOOK.md:83-85`, step 14). Disposition values live in ATLAS-ARC (not in the five sources). Disposition-like statuses observed in the corpus: claim `target` vs `observed`, bead `deferred` vs `closed`, and "reopen is a first-class transition, not failure" (`A-Z-PLAYBOOK.md:193-194`, step 34).

---

## 3. Starter-kit gates G1–G14 (one line each)

All 14 are "port-rigor contracts (ORACLE, PAIR, OWN, CONTRACT, HOST, UNSAFE, REVIEW, RULEBOOK, IOU, MIRI, LAYOUT, AUDIT, NOSTUB, REJECT)" with a gate registry and "G14 ↔ Rulebook-tier mapping" (`ecosystem/ECOSYSTEM.md:71`). Playbook step 22 enforces each at its stage; every gate logs PASS/FAIL/N-A with evidence (`A-Z-PLAYBOOK.md:126-131`).

- **G1 ORACLE** — pin the oracle inventory (reference implementation, E2E suite, differential harness); post-pin changes need a two-party waiver; oracle shielded from the implementing agent (`A-Z-PLAYBOOK.md:97-100`, step 17).
- **G2 PAIR** — paired/differential validation contract; name only in the five sources — mechanism in the starter kit / ATLAS gate registry.
- **G3 OWN** — ownership contract; name only in the five sources, but binds to the ATLAS R7 `owner` field on every claim row (`ecosystem/ECOSYSTEM.md:50`).
- **G4 CONTRACT** — contract conformance of claim artifacts; name only in the five sources — mechanism in the starter kit / ATLAS.
- **G5 HOST** — host-parity contract; name only in the five sources ("host confounds" is a named audit control at `RULEBOOK.md:70`, §4.5).
- **G6 UNSAFE** — unsafe work routes through the exorcist's classification operators; bound to `[T-C17]`/`[T-N6]` (`A-Z-PLAYBOOK.md:126-131`).
- **G7 REVIEW** — split-context adversarial review, default-refute; bound to `[T-B5]` (`A-Z-PLAYBOOK.md:126-131`).
- **G8 RULEBOOK** — Rulebook claim-discipline as a gate; bound to trial-before-scale `[T-B3]` (`A-Z-PLAYBOOK.md:113-118`, step 20).
- **G9 IOU** — structured IOUs only, bounded, **zero unresolved at close** (`A-Z-PLAYBOOK.md:132-137`, step 23).
- **G10 MIRI** — Miri (Rust UB detector) contract for unsafe code; name only in the five sources — mechanism in the starter kit / ATLAS.
- **G11 LAYOUT** — layout assertions (starter-kit `LIFETIMES.tsv`, T-B2) (`ecosystem/ECOSYSTEM.md:55-71` mapping).
- **G12 AUDIT** — audit loop: class-fix followed by instance re-audit; bound to `[T-B10]` (`A-Z-PLAYBOOK.md:150-154`, step 26).
- **G13 NOSTUB** — no stubs/placeholders left in the tree; name only in the five sources — mechanism in the starter kit / ATLAS.
- **G14 REJECT** — tier-mapping gate: claims violating their Rulebook-tier evidential burden are rejected; bound to `[T-N1]`/`[T-N7]` (`ecosystem/ECOSYSTEM.md:71`).

Binding rules: the 35 vendor techniques are "a catalog, not gates. Gates come only from G1–G14 + ATLAS BUILD_READY." (`ecosystem/ECOSYSTEM.md:115`, rule 4). "Starter-kit local hooks are advisory; CI is enforcing. Nothing that only ran locally counts as gated." (`ecosystem/ECOSYSTEM.md:118`, rule 8). Any failed gate demotes the dependent claims; repeated failures become standing instructions/evals/gates (`A-Z-PLAYBOOK.md:150-154`).

---

## 4. NODUS ring selection logic

`RULEBOOK.md:101-105` (§4.9). Score six criteria (Technology readiness
on TRL 1–9; Strategic relevance, Impact potential, Implementation
feasibility, Time to mainstream, Collaboration potential on 1–5), each
justified in one line, then assign the ring: **Invest** requires
independent validation plus governance; **Pilot** requires a release
artifact plus a bounded, real workload fit; **Explore** is the default
for substantive-but-unproven work; **Monitor** is for websites, retired
artifacts, and plan-stage work. When in doubt, ring **down**, not up.
v1.1 sanctioned two modifiers that never change assignment:
*-with-a-ceiling* (ring stands on merit, but the MIT+AI-lab rider caps
mainstream adoption) and *-with-exemplar* (repo exemplifies a
methodology export). Corpus sanity: 34/44 Explore, 7 Monitor, 3 Pilot,
0 Invest — no project met Invest because 0/44 have independent
third-party validation (`synthesis/00-overview.md:31-33`).

---

## 5. A–Z playbook stage structure (entry/exit criteria named, not explained)

Header rule: "Literal numbered process. Each step: action, entry, exit,
source tags. No step is skipped silently; a skipped step records its
reason." (`A-Z-PLAYBOOK.md:3`). Tags: `[RB]` Rulebook · `[A-Rn]`
ATLAS-ARC · `[P-Sn]` PLANNING-ARC · `[T-…]` vendor techniques · `[Gn]`
port gates · `[SK]` starter kit · `[DM]` dependency matrix · `[EV]`
external-validation stories · `[FH]` fh · `[CI-Cn]` CI classes ·
`[NP]`/`[H]` synthesis (`A-Z-PLAYBOOK.md:3`).

**Phase 0 — Selection.** 1. Pull the idea catalog (→ idea list on disk, dated).
2. Dependency-screen vs 53 matrix edges (→ per-candidate `ok`/`risky`;
risky needs a named mitigation or dies). 3. NODUS ring-forecast (→
forecast + blocker list; kill candidates that can never leave Monitor).
4. External-signal check (→ signal tags or explicit unclaimed kinship).
5. Score and kill (→ exactly one project + written kill list).
6. Supply-chain intake gate (→ intake PASS/RED with named blockers;
rider-bearing dependency = auto-fail).

**Phase 1 — Intake evidence (read-only).** 7. Local evidence desk
(→ brief: facts / unknowns / warnings / reversible next step; zero
mutation). 8. Harvest prior evidence (→ filed rows or explicit UNRUN).
9. `fh doctor` gate (→ doctor verdict recorded; fh rows admitted or
quarantined — while RED, fh output is UNRUN).

**Phase 2 — Plan (ATLAS A–K × PLANNING S0–S11).** 10. Intent dump S0/S1
(→ verbatim human intent file; INTAKE→CHARTERED). 11. Plan v1 S2 (→ one
whole-problem plan, stable IDs). 12. Fresh review rounds S4 (→ `DEF-*`
log; deltas applied or formally rejected). 13. Optional competing plans
S3 (→ one synthesis note or skip record). 14. Registries S7 (→
`.atlas-arc/` JSONL seeded, machine-readable). 15. Breadth-before-depth
R1 (→ `max(maturity) − median(maturity) ≤ 1` + remediation deltas).
16. Formalize claims R7 × tiers (→ complete claim registry + cut list;
unmeetable claims cut here). 17. Pin the oracles (→ pinned inventory;
waiver rule recorded). 18. Bead conversion S8 (→ bead graph).
19. Bead polish + BUILD_READY S9 (→ BUILD_READY certificate or explicit
blockers). 20. Wave plan from the technique catalog (→ wave plan with
technique bindings — bound, not gates).

**Phase 3 — Execute.** 21. Starter-kit Phase A readiness (→ readiness
checker green; no execution before green). 22. G1–G14 (→ gate log, every
gate PASS/FAIL/N-A with evidence). 23. Phase B execution honesty +
negative ledger from day one (→ ledger non-empty; zero unresolved IOUs
at close). 24. ATLAS loop per work unit
(ORIENT→SELECT→CLAIM→RESERVE→EXECUTE→VERIFY→RECEIPT→REVIEW→CLOSE/REOPEN→HANDOFF;
→ receipts per unit). 25. Drift checks (→ drift log; zero unfiled drift
at close). 26. Demotion on failure (→ demotion log; claims re-tiered).

**Phase 4 — Verify.** 27. `fh` run_stage gates [PROPOSED] (→ gate map in
fh status algebra). 28. Gauntlet, ports of mature references (→
`FINAL_GAUNTLET_REPORT.md` + `PARITY_RUNBOOK.md` + release-certification
template; convergence ≥10 rounds, ≥2 consecutive clean). 29. Attempt
independent validation (→ record: independent / attempted-blocked /
not-attempted with reason — the only exit from the evaluation paradox).
30. Measurement-integrity gate (→ perf verdicts with result classes;
sandbox numbers disavowed in writing).

**Phase 5 — Ship and post-release.** 31. Release at the pin (→ tag +
signed artifacts from the assessed commit, not earlier; no release, no
Pilot claim). 32. Reality check / bridge S11 (→ post-release note: what
held, didn't, was disavowed). 33. Assessment packet (→ 12-section
Rulebook packet at new pin, ring assigned, QA checklist run). 34. Revisit
triggers + reversible closure (→ closure record with dated triggers).
35. Fold into the program (→ vN+1 shipped: matrix, briefs, synthesis
counts; batch folded into `franken-assessments-44-vN.zip`, same Drive
file mirrored, only the latest kept).

Non-rules: skip-without-reason = defect; PROPOSED items await a versioned
amendment; external stories select but never evidence; local hooks
advise, CI enforces; `fh` reads, never dispatches
(`A-Z-PLAYBOOK.md:209-216`).

---

## 6. `fh` status algebra and verdict vocabulary

Proposed closed cross-layer verdict set (I6): **`PASS, RED, UNRUN, EMPTY,
UNKNOWN, STALE, REFUSED, QUESTION_MISMATCH, INCOMPLETE, REGRESSION`**
(+ careful `UNMEASURED`) (`ecosystem/ECOSYSTEM.md:41`). It is "a proposed
design — no in-tree adoption source exists — and is not a ratified
program standard. No packet is required to adopt it."
(`RULEBOOK.md:127-133`). Two vocabularies coexist and **must not be
mixed**: §4.3 claim statuses {*demonstrated*, *partially demonstrated*,
*aspirational*, *disproven*, *stale*} govern per-claim inventory status;
the fh algebra governs gate/CI verdicts only — and *stale* means
different things in the two (`RULEBOOK.md:127-133`). `fh` reads and
retrieves, never dispatches [PROPOSED]; `fh wwjd` is SPEC; doctor is RED
on schedule/pin drift, so "fh is UNRUN as substrate until doctor goes
green" and harvest coverage stands at 115 requirements / 0 covered
(`ecosystem/ECOSYSTEM.md:103-107`, M5).

---

## 7. Existing pickup / bootstrap procedures

**The A–Z Playbook is the bootstrap procedure.** Quoted verbatim:
"Literal numbered process. Each step: action, entry, exit, source tags.
No step is skipped silently; a skipped step records its reason."
(`A-Z-PLAYBOOK.md:3`); title "A–Z Playbook — Starting Any FrankenSuite
Project" (`A-Z-PLAYBOOK.md:1`). Pickup flow for a new project is Phases
0–1 (steps 1–9): pull the 67-idea catalog → dependency-screen vs the
53-edge matrix → forecast the NODUS ring (kill anything that can never
leave Monitor) → check external signals → score-and-kill to exactly one
project → pass the supply-chain intake gate → read-only intake evidence
(local evidence desk → harvest prior evidence → `fh doctor` gate) before
any planning (`A-Z-PLAYBOOK.md:9-52`). The starter kit's own bootstrap:
Phase A readiness (14 items + readiness checker green before any
execution), Phase B execution honesty (14 items), cold tests, canary, CI
backstop (`A-Z-PLAYBOOK.md:122-137`; `ecosystem/ECOSYSTEM.md:67`).
Pickup closure: dated revisit triggers (CI drift, rider change, upstream
release, validation outcome), reversible closure ("reopen is a transition,
not a failure"), fold into the versioned ZIP keeping only the latest
(`A-Z-PLAYBOOK.md:193-207`).

---

## 8. Hard rules for plan authors (fabrication guard)

- Every dramatization maps to a real mechanism; no invented machinery;
  no unavailable artifacts cited; fh rows while doctor is RED are UNRUN;
  no SPEC items presented as shipped; no INFERs upgraded by repetition.
  Hard completion markers only: "gates don't ride a version until the
  marker is written." (`ecosystem/ECOSYSTEM.md:121-127`, §7)
- Six separations hold always: repo facts vs maintainer claims ·
  demonstrated vs aspirational · maintainer vs independent benchmarks ·
  current evidence vs forecasts · technical merit vs business viability ·
  facts vs inferences vs speculation (`RULEBOOK.md:27-31`, §0).
- Staleness is a finding with both dates; maintainer honesty raises
  credibility but never substitutes for verification (`RULEBOOK.md:32-34`).
- Never cite an un-gated number as a result; quote any disavowal from
  the project's own docs; state reproduction cost honestly
  (`RULEBOOK.md:69-71`, §4.5).
- Release artifacts must target the assessed commit — earlier-commit
  releases satisfy no gate (`ecosystem/ECOSYSTEM.md:120`, rule 9).
- External stories are selection signals (I7), never local evidence
  (I1); citing one for a local claim is laundering
  (`ecosystem/ECOSYSTEM.md:116`, rule 6).
- PROPOSED upgrades (Tier 0 `[Unrepresentable]`, `compile-rejected` /
  `runtime-checked`, `[NV]`) need a versioned amendment — silent
  application to v1.0 packets is forbidden
  (`ecosystem/ECOSYSTEM.md:105-107`, M6; `RULEBOOK.md:134-143`, §9).
- Do not assume away the missing capabilities: M1 no cross-suite claim
  registry; M4 zero independent-validation pipeline (rider blocks the
  best validators); M8 bus factor 1 in 44/44, no succession
  (`ecosystem/ECOSYSTEM.md:103-110`).
- Packet contract: 12 mandatory sections in order (§4.1–4.12); claim
  inventory ≥10 claims, all tiered with confidence; ≥3 strengths + ≥3
  weaknesses + bear-case steelman; license read verbatim, rider scope
  quoted, OSI status classified; eight deepening questions, one
  paragraph each; limitations naming what was not done; 13-item QA
  checklist before shipping (`RULEBOOK.md:76-125`).
