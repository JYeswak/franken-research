# DEF2 — Lane D: companion consistency sweep 3 (round 2, S4)

Scope: `pickup-vector-dbs.md`, `pickup-eval-harnesses.md`, `pickup-observability.md`,
`pickup-guardrails.md`, `pickup-fine-tuning.md`, `pickup-rl-envs.md`, `pickup-voice-agents.md`
— verified against PROJECT-PICKUP-PLAYBOOK.md §Claim/evidence governance,
§Bench spec slot 13, §Gate hierarchy, and shared-gates.md.
Read-only review; no reviewed files were edited.

Severity counts: **P0: 0 · P1: 4 · P2: 14** (total 18).

Clean passes (no finding): (a) gate-ID namespaces hold in all 7 — every reference is
either a shared `GATE-007/009/010/011/012/013` or a properly namespaced type-local
`GATE-VDB-* / GATE-EH-* / GATE-OBS-* / GATE-GR-* / GATE-FT-* / GATE-RL-* / GATE-VA-*`;
no un-namespaced `GATE-1..4`, no `GATE-G*` forms confusable with `G1–G14`, no
type-local ID duplicating a `GATE-001…018` number. (b) No inverted tier language
anywhere; eval-harnesses has one tier scheme; voice has no private 5-tier scheme.
(c) G6/G10/G11 conversions all carry type-specific content or N-A with reason —
none is a bare "advisory" relabel. (d) RL registry-adoption language is correct:
GATE-RL-01..04 explicitly "NOT adopted into the shared gate registry"; no companion-fiat
registry-growth claims. (e) Voice claim table has the canonical columns (no schema
breaks).

---

## P1

DEF2-D-1 [P1] pickup-voice-agents.md:Starter-kit deltas (item 5) — Says "New gates
GATE-VA-1..4 registered in the gate registry", asserting shared-registry adoption by
companion fiat; the playbook allows only type-local gates "defined in the companion"
plus the shared-gates.md amendment procedure. It also contradicts the Gate profile,
where GATE-VA-2 and GATE-VA-3 are RETIRED into shared GATE-013. Fix: reword to
"GATE-VA-1 and GATE-VA-4 defined as type-local gates in this companion's gate profile
(not the shared registry); GATE-VA-2/3 retired into shared GATE-013 — registry
adoption, if ever wanted, requires the shared-gates.md amendment procedure."

DEF2-D-2 [P1] pickup-voice-agents.md:Starter-kit deltas (item 7) — Template path
`.github/workflows/test-live.yml.template` sits outside `templates/voice-agents/`,
violating the playbook's one-root-per-type rule ("Starter-kit template additions nest
under one root per type: `templates/<slug>/…`; companions MUST NOT spread a type's
templates across sibling roots") that round 1 enforced. Fix: repoint to
`templates/voice-agents/ci/test-live.yml.template`.

DEF2-D-3 [P1] pickup-fine-tuning.md:Localbench bench shape — No cost-accounting receipt
lines, though GPU/nightly-GPU spend is plainly material for this type (REQ-CI-COST,
UNK-04 admits the nightly tier's cost profile is "estimated, not measured"; GATE-007
requires GPU/runner hours recorded per run). Fix: add a cost block to the receipt
schema (estimated vs actual GPU hours, lab cost, budget, funding owner,
budget-exceeded disposition) per Bench spec slot 13, wired into `registries/claims.tsv`.

DEF2-D-4 [P1] pickup-rl-envs.md:Localbench bench shape — Same gap: multi-GPU
`e2e-trainer`/`dist-smoke` tiers and the pinned remote-lab variant have no
cost-accounting receipt lines; UNK-4 asks who attests the remote machine but never
who funds it. Fix: same as DEF2-D-3 — cost block in receipts (estimated vs actual
GPU/lab hours, budget, funding owner, budget-exceeded disposition) for the GPU and
remote-lab tiers.

---

## P2

DEF2-D-5 [P2] pickup-eval-harnesses.md:Evidence tiers (T2 bullet) — Invents the hybrid
label "elevated to T0-by-observation for the text's existence", a private tier outside
the canonical T0–T3. Fix: restate as T0 (the README line's existence is directly
observed) for the text and T2 for the substance of the adoption claims, without the
"T0-by-observation" coinage.

DEF2-D-6 [P2] pickup-observability.md:Evidence tiers — The section restates the
Rulebook five-tier vocabulary ([Verified]/[CI-observed]/[Maintainer claim]/[External]/
[Inference]) as the companion's evidence tiers with no mapping to canonical T0–T3 —
the same residual parallel-scheme class round 1 unified in eval-harnesses. Fix: recast
the section on T0–T3 or add an explicit cross-mapping (T0=[Verified], T1=[CI-observed],
T2=[Maintainer claim]/[External], T3=[Inference]).

DEF2-D-7 [P2] pickup-guardrails.md:Evidence tiers — Invents private sub-flavors
("[Code-verified] (attack-detector separation proven by import-graph CI), [Git-observed]
(corpus version pins), [Counted]") and parks the sentence "[CI-observed] attests the
suite runs, not that it is green — T2 at best" inside the T2 bullet, where it does not
belong. Fix: drop the private flavors; move the CI-observed sentence to the T1 bullet.

DEF2-D-8 [P2] pickup-vector-dbs.md:Evidence tiers (T0 bullet) — T0's definition absorbs
canonical T1 content: "vendor CI logs that actually executed (CI-observed attests the
suite *runs*, not that it is green)". Fix: move "vendor CI logs that actually executed"
to the T1 bullet; keep T0 as direct inspection / measurement at a pinned oracle.

DEF2-D-9 [P2] pickup-fine-tuning.md:Evidence tiers (cross-mapping line) — The
cross-mapping restates T0 more loosely ("independently verified assertions") than the
verbatim canonical mapping stated in the claim-registry header above it ("direct
inspection of a fresh clone, API, live page, or a measurement at a pinned oracle with
invocation-time SHA-256 recorded"). Fix: align the cross-mapping to the canonical
wording.

DEF2-D-10 [P2] pickup-voice-agents.md:Starter-kit deltas (item 8) — `docs/evidence/incumbents.md`
template listed as a starter-kit addition but placed outside `templates/voice-agents/`.
Fix: nest as `templates/voice-agents/docs/evidence/incumbents.md`, or label it a
project-tree artifact rather than a starter-kit template.

DEF2-D-11 [P2] pickup-observability.md:Gate profile (count line) — "Count: 4 new gates"
while GATE-OBS-SEMCONV and GATE-OBS-COMPLETE are RETIRED into shared GATE-010; only
GATE-OBS-INGEST and GATE-OBS-PRICE are genuinely new. Fix: "2 new gates + 2 retired
into shared GATE-010 (GATE-OBS-SEMCONV, GATE-OBS-COMPLETE)".

DEF2-D-12 [P2] pickup-vector-dbs.md:Starter-kit deltas — The REQ-CI-COST requirement
names the CI-provisioning/funding fields but the starter-kit deltas section has no
filled slot (runner class/host, provisioning owner, funding owner/account, schedule,
spend cap — TBD acceptable pre-S5). Fix: add a "CI provisioning + cost ownership"
item to the deltas naming each field's owner/value.

DEF2-D-13 [P2] pickup-eval-harnesses.md:Starter-kit deltas — Same: REQ-CI-COST names the
fields; no filled slot in the deltas. Fix: add the CI provisioning + cost ownership
item (runner class/host, provisioning owner, funding owner/account, schedule, spend
cap).

DEF2-D-14 [P2] pickup-observability.md:Starter-kit deltas — Same gap; item 4's "spend
cap" belongs to the daily price-table audit job template, not the bench compute bill,
and names no owner. Fix: add the CI provisioning + cost ownership item naming each
field's owner/value.

DEF2-D-15 [P2] pickup-guardrails.md:Starter-kit deltas — Same: REQ-CI-COST names the
fields; no filled slot in the deltas. Fix: add the CI provisioning + cost ownership
item.

DEF2-D-16 [P2] pickup-fine-tuning.md:Starter-kit deltas — Same gap, despite item 6's CI
matrix template (CPU unit / labeled GPU e2e / nightly cron), which names tiers but no
provisioning/funding owners. Fix: add the CI provisioning + cost ownership item naming
each field's owner/value.

DEF2-D-17 [P2] pickup-rl-envs.md:Starter-kit deltas — Same: the CI workflow-trio
template (`tests.yml` / `slow-tests.yml` / `tests-experimental.yml`) names no
provisioning/funding owners. Fix: add the CI provisioning + cost ownership item.

DEF2-D-18 [P2] pickup-voice-agents.md:Starter-kit deltas — Same: item 7's secrets-gated
workflow template names no compute provisioning/funding owners (UNK-VA-5 covers key
provisioning and spend caps for the `live` tier, not bench compute). Fix: add the CI
provisioning + cost ownership item.

---

## Notes (not findings)

- Bare S2-minted IDs (guardrails `CLAIM-01`, fine-tuning `CLAIM-01`, RL `CLAIM-1`,
  `REQ-01..06`, `UNK-1..5`) are grandfathered by INTENT.md's ID stability rule; not
  flagged. Single-digit suffixes in namespaced gates (`GATE-EH-1..4`, `GATE-VA-1..4`)
  deviate cosmetically from the canonical zero-padded `GATE-<SLUG>-<NN>` shape but
  collide with nothing; left for the integrator's discretion.
- Fine-tuning G6 ("applies to custom kernel extensions (CUDA/Triton kernels)") and
  voice G6 ("load-bearing only if the stack has unsafe/FFI code") are not labeled
  "G6-analog" but both spell out the type-specific content, which is what check (c)
  requires; not flagged.
- Vector-dbs and guardrails list retired local gates as starter-kit template
  material (`templates/gates/GATE-VDB-0{1..4}.md` includes retired GATE-VDB-01; guardrails
  notes the GATE-011 retirement correctly). The vector-dbs retired-gate template is a
  minor redundancy, not a defect against the (a)–(g) checks.
