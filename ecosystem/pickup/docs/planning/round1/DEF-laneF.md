# S4 Round 1 — Lane F: fresh-agent usability (DEF log)

Reviewer: fresh-context agent, no prior exposure to these files.
Files reviewed (5):
- `PROJECT-PICKUP-PLAYBOOK.md` (constitution)
- `shared-gates.md` (GATE-001…GATE-018)
- `_s0/g1-g14-reference.md` (authoritative G1–G14)
- `pickup-rl-envs.md` (companion)
- `pickup-voice-agents.md` (companion)

Method: cold read of each file, simulating an agent dropped into the repo and
asked to bootstrap one of the two project types. Checked: (a) entry point +
ordered steps within ~5 minutes of reading; (b) MUST/SHOULD vs prose
separation; (c) undefined terms / namespaces / forward references; (d)
truth-pack spec actionability; (e) starter-kit deltas concreteness;
(f) assumed knowledge from S0 sources (localbench, ATLAS-ARC, the 44 packets).

Summary verdict: the playbook gives a findable entry point (the companion
file) and ordered steps (S0–S5), but the playbook's own companion-filename
table does not match the files on disk (P0). Gate IDs and evidence tiers
drift between the constitution, the authoritative reference, and the two
companions (P1s). Normative language is mostly distinguishable but uses three
different registers across files (P2).

## Findings

DEF-F-1 [P0] PROJECT-PICKUP-PLAYBOOK.md:"The 21 covered types" — The table's
slug→filename mapping does not match the files on disk for 19 of 21 types.
The table says `rl-envs-rlhf-infra` → `pickup-rl-envs-rlhf-infra.md` and
`realtime-voice-agents` → `pickup-realtime-voice-agents.md`; the actual files
are `pickup-rl-envs.md` and `pickup-voice-agents.md` (same pattern for
`pickup-inference-engines.md`, `pickup-structured-output.md`,
`pickup-embedding-serving.md`, `pickup-mcp.md`, `pickup-browser-use.md`,
`pickup-computer-use.md`, `pickup-observability.md`, `pickup-fine-tuning.md`,
`pickup-rl-envs.md`, etc. — only `pickup-agent-frameworks.md` and
`pickup-multi-agent-protocols.md` match). A fresh agent following the
constitution's own table looks for a file that does not exist and cannot
start. Fix: make the table authoritative and rename the files to match
(or vice versa), then re-verify all 21 rows against `ls`.

DEF-F-2 [P1] pickup-voice-agents.md:Gate profile — The companion sources its
gate names from `_s0/ecosystem-digest.md` ("gate names G1–G14 from
`_s0/ecosystem-digest.md` (starter-kit A-Z playbook)"), but the playbook's
Gate registry summary points to the authoritative `_s0/g1-g14-reference.md`,
which explicitly instructs "cite these IDs exactly; do not re-derive them
from CHECKLIST.md prose, which uses different numbering in places." The
voice companion's paraphrases already diverge: its GATE-G7 ("split-context
adversarial review on pipeline-semantics claims") does not match the
reference G7 ("Sensitive changes … need a diff-only review artifact"). A
fresh agent wiring gates from this companion wires the wrong contract.
Fix: rewrite the voice gate profile against `_s0/g1-g14-reference.md`
verbatim, using bare G1…G14 IDs.

DEF-F-3 [P1] pickup-voice-agents.md:Gate profile; pickup-rl-envs.md:Gate profile
— Both companions invent gate-ID schemes that collide with the closed
namespaces. Voice uses `GATE-G1`…`GATE-G14` (the `GATE-*` namespace is defined
by the playbook as shared gates `GATE-001`… plus type-local gates; the
`shared-gates.md` amendment rule requires two independent evidence files for
a new gate). RL uses `GATE-1`…`GATE-4` for type-specific gates and says
"adopt GATE-1..GATE-4 into the gate registry" — a registry write with no
evidence files, bypassing the amendment rule, and `GATE-1` is visually
confusable with `GATE-001`. A fresh agent cannot tell which `GATE-*` IDs are
real. Fix: reserve `GATE-NNN` strictly for the shared registry; require
type-local gates to use the `GATE-<slug>-NN` form (voice's `GATE-VA-*` is the
right pattern — apply it in RL too) and route registry adoption through the
amendment rule.

DEF-F-4 [P1] pickup-voice-agents.md:Evidence tiers — The section defines its
own five-tier scheme (Tier 1 — Verified … Tier 5 — Aspirational/TARGETED)
while the playbook mandates T0–T3 and states "the mapping below is stated in
every companion file." Worse, the file contradicts itself: the claim table
above uses T0/T1/T2/T3 (e.g. CLAIM-VA-3 at T0, CLAIM-VA-14 at T1) while the
Evidence tiers section below renumbers the same concepts as Tier 1–5 (Tier 4
— Self-reported ≈ playbook T3 [Inference]). A fresh agent cannot tell
whether "Tier 2" means playbook T2 or the section's Tier 2. Fix: delete the
1–5 scheme and restate the playbook's T0–T3 table verbatim, with the Rulebook
tier names in the left column.

DEF-F-5 [P1] pickup-rl-envs.md:Evidence tiers — Restates the tiers as "T0
vendor / T1 independent / T2 self-reported / T3 aspirational," dropping the
Rulebook tier names the playbook requires to be stated ("T0 | [Verified] …").
"Self-reported" and "aspirational" are not Rulebook vocabulary, and "T1
independent" is narrower than the playbook's T1 [CI-observed] (which
explicitly attests the suite *runs*, not that it is green). A fresh agent
comparing companion to constitution sees two different taxonomies. Fix: use
the playbook's table verbatim, adding the RL-specific admissible-examples as
a second column rather than renaming the tiers.

DEF-F-6 [P1] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary — The summary's
one-line paraphrases of G1–G14 diverge from the authoritative
`_s0/g1-g14-reference.md` definitions the constitution itself blesses. Sharpest
case: the summary's G5 ("Host-parity contract (host confounds are a named
audit control)") vs the reference G5 ("Ambient/host reads and new unsafe code
must be declared in the same diff"). G2 ("Paired/differential validation
contract" vs "Paired operations must change together per `paired-ops.tsv`")
and G9 ("Structured IOUs only, bounded" vs "positive round bound in
`kit-loops.yml`") also drift. The RL companion already picked up the wrong
reading of G5. Fix: replace the summary table's "Contract" column with the
reference's one-line definitions verbatim, and mark the table as
non-normative ("for orientation only; the reference governs").

DEF-F-7 [P1] pickup-rl-envs.md:Gate profile — "G11 layout (tests mirror source
layout)" misapplies the gate: the authoritative reference defines G11 as
layout assertions for layout-sensitive Rust structs (`size_of`/`align_of`
asserts), not test-directory mirroring. The per-algorithm test layout is a
sensible type norm but it is not G11. Fix: move test-layout mirroring into a
type-local gate or a REQ, and scope G11 per the reference (with the
Rust-centricity caveat the reference already provides).

DEF-F-8 [P1] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary — "gates come
only from G1–G14 + ATLAS BUILD_READY + the shared pickup gates." ATLAS
BUILD_READY is never defined anywhere in the reviewed set (ATLAS appears only
as "ATLAS R7 fields" and "ATLAS-ARC equivalent," also undefined). A normative
gate-source a fresh agent cannot resolve is a hole in the closed-gate rule.
Fix: define ATLAS BUILD_READY (what it is, where it lives, its PASS/FAIL
form) or remove it from the closed set.

DEF-F-9 [P1] PROJECT-PICKUP-PLAYBOOK.md:"What this playbook does not cover" —
Unexplained program jargon a fresh agent cannot resolve from the reviewed
files: "NODUS ring forecasts," "the 53-edge dependency screen," "Phase-0
machinery," and "L1" ("immutable evidence substrate (L1)" — L5 is glossed
elsewhere in the file, L1 is not). These appear in normative-adjacent
scoping statements. Fix: add one-line glosses in place (or a "program
vocabulary" appendix) for NODUS, L1/L5, Phase-0, and the 53-edge screen.

DEF-F-10 [P1] PROJECT-PICKUP-PLAYBOOK.md:Gate registry summary — "every gate
logs PASS/FAIL/N-A with evidence (A-Z Playbook step 22)." The A-Z Playbook is
never defined or located in the reviewed set (it lives in
`_s0/ecosystem-digest.md`, outside the review set, and is not cited with a
path here). A fresh agent cannot find the logging contract. Fix: cite the
file and section explicitly (`_s0/ecosystem-digest.md`, step 22) or restate
the logging format (path, fields) in the playbook.

DEF-F-11 [P1] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — "Fresh-context
reviewers (≥2) … work from the companion file alone" contradicts the
companions' actual dependency surface: both cite `_evidence/*.md` packs,
`_s0/model-guides.md` sections, and packet shorthand (tts/nlp/whisper/ocr
patterns) that are not restated in the companion. A reviewer truly working
"from the companion file alone" cannot verify the claims the companion asks
them to review. Fix: scope the sentence — e.g. "work from the companion file
as the primary artifact, consulting only files it cites by path, with no
access to the plan author" — and require companions to cite every external
dependency by explicit relative path.

DEF-F-12 [P2] All files — Three different normative registers: the playbook
uses MUST|SHOULD only inside the golden schema and otherwise relies on
imperatives ("Never an unverified oracle," "goldens are written ONLY by");
the RL companion uses bare imperatives in REQ-*; the voice companion uses
RFC-style SHALL six times in REQ-VA-*. "SHOULD on CPU-only hosts" (RL bench
shape) vs "SHALL" (voice) leave a fresh agent unsure which verbs carry
normative weight. Fix: adopt one keyword register (e.g. RFC 2119
MUST/SHOULD/MAY) in the playbook constitution and require companions to use
it.

DEF-F-13 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle (S3) — Exit criterion
"gate log open with no FAILs" references a "gate log" that is never defined:
no path, no format, no schema. Fix: specify the gate log location and row
format (e.g. `docs/evidence/gate-log.tsv` with gate/verdict/evidence/date
columns), or point at the A-Z Playbook step once DEF-F-10 is fixed.

DEF-F-14 [P2] PROJECT-PICKUP-PLAYBOOK.md:Claim/evidence governance — "ATLAS R7
fields" introduces eight fields (class, validity domain, oracle, negative
control/mutant, evidence artifact, do-not-claim boundary, owning bead, gate)
under a name containing "R7." A fresh agent will wonder whether one field is
missing or "R7" means something else (revision 7? rule 7?). Fix: gloss the
name once ("R7 = ATLAS revision 7 of the claim schema; it carries eight
fields") or rename to match the count.

DEF-F-15 [P2] PROJECT-PICKUP-PLAYBOOK.md:Truth-pack spec — The five-file layout
is file-for-file actionable, but two files lack schemas: ACCEPTANCE_SURFACE.json
has only examples ("break-even thresholds / quality budgets") with no field
names, and MANIFEST.sha256's line format (bare hash vs `hash  filename`) is
unspecified — which matters because `fetch-truth-pack.sh --verify`
re-hashes "against MANIFEST." Fix: add a minimal JSON schema (field names,
units) for ACCEPTANCE_SURFACE.json and state the MANIFEST line format.

DEF-F-16 [P2] pickup-rl-envs.md:Starter-kit deltas; pickup-voice-agents.md:Starter-kit
deltas — Both are admirably file-for-file (every item names a path), but they
use incompatible template roots: RL nests everything under
`templates/rl-env/`; voice spreads across `templates/truth-pack-voice/`,
`templates/harness/`, `templates/metrics/`, `templates/evals/`,
`templates/tests/`. A fresh agent bootstrapping two types builds two
different trees. Fix: the playbook should prescribe one template-root
convention (e.g. `templates/<slug>/…` for all types).

DEF-F-17 [P2] shared-gates.md; pickup-rl-envs.md — Packet shorthand is used
without restatement in several load-bearing spots: "whisper PERF_LEDGER
doctrine" (never defined — what is a PERF_LEDGER?), "the 2026-08-11 Metal
entry" (the consequence is explained, the referent is not resolvable without
the whisper packet), "tts pattern" / "nlp pattern" (used as authority for the
truth-pack shape and TARGETED-vs-OBSERVED labeling; the patterns are
partially re-explained but the packet is the real source). Per the lane-(f)
rule, a fresh agent has no packet access. Fix: replace each with a one-line
in-place definition and treat the packet as a citation, not the definition.

DEF-F-18 [P2] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle (S0) — "Pull the
type's evidence file" gives no path pattern; the path convention
(`_evidence/*.md`) appears only incidentally in `shared-gates.md` ("the
`_evidence/*.md` packs") and in companion citations. A fresh agent's first
step requires an inference. Fix: state the path pattern in S0 ("`_evidence/
<pickup-<slug-minus-pickup->.md`" or whatever the real mapping is).

DEF-F-19 [P2] pickup-voice-agents.md:Initial claims — The gate profile makes
G3 load-bearing ("every CLAIM-VA-* row carries an owning bead; unowned claims
fail"), but the claim table has no owner/owning-bead column; ownership is
deferred to S3 as "provisional [INFERENCE]." Deferral is arguably legitimate
at S2 draft status, but the table should then carry an explicit empty
`owner` column marked TBD rather than omitting the G3-required field
entirely. Fix: add the column with `TBD (S3)` values.

DEF-F-20 [P2] pickup-voice-agents.md:Oracle candidates; Localbench bench shape —
Normative content is delegated to `_s0/model-guides.md` by section number
("model-guides §1–2", "§3", "§4") without restatement. The file exists in-repo
so this is navigable, but on the 5-minute path it is a second-file lookup for
load-bearing rules (truth-pack shape, CAMPAIGN WIN doctrine, TARGETED
labeling). Fix: inline the 2–3 sentences that carry normative weight and keep
the section pointer as a citation.
