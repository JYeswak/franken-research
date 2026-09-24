# DEF3 — Round 3, Lane A: cold execution of an eval-harness pickup (S0→S5)

*Reviewer: Lane A (cold execution). Date: 2026-09-23. Method: read only
`PROJECT-PICKUP-PLAYBOOK.md`, `pickup-eval-harnesses.md`, `shared-gates.md`,
`_evidence/eval-harnesses.md` (plus `INTENT.md`, which the companion cites as
normative for stable IDs, and the on-disk registries the S5 checks require),
then attempted to execute each playbook stage on paper for the eval-harness
type (`eval-harnesses`, short code `EH`). A "finding" is any point where the
executing agent cannot proceed without guessing, asking, or inventing.
Severity: P0 = stage cannot start or exit; P1 = stage can start but cannot
reach its exit criteria without inventing material; P2 = ambiguity, vocabulary
violation, or latent inconsistency that does not yet block but will.*

*Totals: P0 = 4, P1 = 13, P2 = 9 (26 findings).*

---

## S0 — Intake

I can confirm `_evidence/eval-harnesses.md` exists and cites 8 harness repos +
3 dataset repos, all stated as GitHub-API-verified on 2026-09-23. Everything
else in S0 stalls:

DEF3-A-2 [P0] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — No working root is
defined for any pickup artifact. `docs/truth-pack/`, `docs/planning/GATE_LOG.md`,
`registries/claims.tsv`, `docs/evidence/receipts/`, `docs/CLAIMS.json` are given
as relative paths with no anchor: the pickup tree? a new per-type project repo?
a per-type subdirectory? A cold executor cannot create the first file without
inventing the root. Fix: add one sentence to the playbook's S0 or Truth-pack
spec naming the canonical working root (e.g. "all pickup-local paths resolve
under `pickup/<slug>/` in this tree until S5 cuts beads") and re-anchor every
relative path.

DEF3-A-5 [P1] PROJECT-PICKUP-PLAYBOOK.md:S0 — Intake — The supply-chain intake
check ("rider-bearing dependency = auto-fail") has no detection procedure. The
rider text (MIT + OpenAI/Anthropic rider) appears nowhere in the four files, and
the dependency universe to screen is never enumerated (the type's oracle repos?
their transitive deps? the future project's deps?). I cannot run an auto-fail
check I cannot define. Fix: add an S0 intake procedure naming (a) the rider's
identifying text, (b) exactly which repositories/dependency lists get screened,
(c) the screening method (e.g. license-file grep over pinned oracle repos), and
(d) where the screen result is recorded.

DEF3-A-6 [P1] PROJECT-PICKUP-PLAYBOOK.md:S0 — Intake — The exit artifact "dated
intake note" has no format and no path, and the verdict "INTAKE→CHARTERED" has
no record location or line grammar (ROUND_LOG.md's grammar has no intake-verdict
line type). I cannot produce an exit artifact I cannot name. Fix: specify the
intake note's filename, location, and required fields, and add an
`intake | type=<slug> | verdict=<INTAKE→CHARTERED|FAIL> | ...` line type to the
ROUND_LOG grammar.

DEF3-A-19 [P2] PROJECT-PICKUP-PLAYBOOK.md:S0 — Intake — Evidence bar is "5–10
live-verified repos"; the evidence file's Trend section lists 11 (8 harness +
3 dataset repos). On a literal reading the type overshoots the bar, and there is
no counting rule (do benchmark-dataset repos count as trend repos? do stale
ones — human-eval, BIG-bench — count?). Fix: state the counting rule (e.g.
"5+ live-verified harness repos; dataset repos listed separately") so the check
is mechanical.

DEF3-A-25 [P2] PROJECT-PICKUP-PLAYBOOK.md:S0 — Intake — Entry requires "the type
is selected through Phase-0", but no Phase-0 selection record for any type is
locatable from the four files (Phase-0 is defined only as "pre-playbook
machinery" in the glossary). A cold executor cannot verify entry criteria.
Fix: name where the Phase-0 selection record lives (file + line format) or drop
it as an S0 entry check.

---

## S1 — Charter

DEF3-A-1 [P0] PROJECT-PICKUP-PLAYBOOK.md:S1 — Charter — The "INTENT sketch
(contradiction rule, stable IDs)" cannot be written: the word "contradict"
occurs zero times across all four files, the playbook's S1 section never
mentions an INTENT artifact, and `INTENT.md` (which the companion cites)
defines only the REQ/GATE/CLAIM/UNK ID namespaces — no contradiction rule.
There is no rule to execute because no rule is stated. Fix: either define the
contradiction rule in the playbook's S1 section (what it contradicts, the exact
procedure, its artifact) or remove it from the S1 tasking; do not leave a named
step with no definition.

DEF3-A-26 [P2] PROJECT-PICKUP-PLAYBOOK.md:S1 — Charter vs Namespaces — Stable IDs
are "minted at S2" per the playbook's Namespaces section, so an S1 step tasked
with producing "stable IDs" contradicts the playbook's own stage assignment.
Fix: move stable-ID minting explicitly to the S2 work list (where it already
sits) and scope S1 to charter prose only.

DEF3-A-7 [P1] pickup-eval-harnesses.md:Charter seed — The charter is missing two
of the four playbook-required elements: trust boundaries (zero occurrences) and
release definition ("what artifact, at what pin, counts as a release"; zero
occurrences). Present: mission ("What this project type is") and non-goals
("Out of scope"). As the S1 executor I would have to invent both missing
elements — for an eval harness, the trust boundary (what the harness may
execute: untrusted model code? untrusted benchmark code? in what sandbox?) is
load-bearing, not boilerplate. Fix: add a Trust boundaries subsection (what runs
untrusted code, where the sandbox line sits) and a Release definition subsection
(artifact + pin that counts as a release) to the companion's charter seed.

DEF3-A-18 [P2] pickup-eval-harnesses.md:Requirements — `REQ-CI-COST` violates
the canonical `REQ-<SLUG>-<NN>` shape (it is `REQ-CI-COST`, not `REQ-EH-NN`),
and the playbook gives no grandfathering rule for cross-type requirement IDs.
Fix: either mint it as `REQ-EH-07` with a "universal requirement" note, or add
an explicit carve-out for playbook-level requirement IDs shared across types.

---

## S2 — Oracle pinning + claim registry

DEF3-A-8 [P1] PROJECT-PICKUP-PLAYBOOK.md:Claim/evidence governance — ATLAS R7's
"owning bead" field cannot be filled at S2: beads (`bd-*`) are cut at S5, so at
S2 there are no beads to own a claim. The playbook also gives no vocabularies
for the other R7 fields (allowed `class` values, `validity domain` syntax,
`gate` reference format). Translating the companion's 14 claims into R7 rows is
guesswork on 3 of 8 fields. Fix: define the R7 field vocabularies in the
playbook (or a cited schema file) and resolve the bead paradox — e.g. "owning
bead: TBD until S5" as an explicit allowed value, or defer the field to S5.

DEF3-A-9 [P1] pickup-eval-harnesses.md:Oracle candidates + integrity checks —
`UNK-EH-O1` and `UNK-EH-O2` (lines 95, 99) use a second numbering scheme
(letter-O) alongside the `UNK-EH-01…06` series in the Unknowns section, and
neither O-row carries a disposition — violating "every UNK-* row carries
exactly one" disposition. The S5 blocks-plan ledger sources only the Unknowns
section, so these two UNKs are invisible to the BEADS READY check. Fix: merge
into the canonical `UNK-EH-NN` series (renumber as UNK-EH-07/08 or fold into
existing rows) with explicit dispositions, and add a rule that UNKs may only be
minted in the Unknowns section.

DEF3-A-10 [P1] PROJECT-PICKUP-PLAYBOOK.md:S2 — Oracle pinning + claim registry —
No pin-acquisition procedure exists. The companion names five oracle candidates
(inspect_ai, lm-evaluation-harness, SWE-bench, gorilla/BFCL, terminal-bench
line) with exact file paths but zero commit SHAs; the evidence file gives star
counts and push dates, not pins. `fetch-truth-pack.sh` has no template, and the
MANIFEST blob set is underivable — the claims rest on upstream file paths, not
on blobs in our possession, and nothing says whether S2 clones the oracle repos
or records remote SHAs. The S2 exit (`fetch-truth-pack.sh --verify` passes)
cannot be reached. Fix: add an S2 pinning procedure (who fetches pins, via
what API, SHA recorded where), ship a `fetch-truth-pack.sh` template in the
playbook tree, and define what counts as a MANIFEST blob for path-cited (not
vendored) oracles.

DEF3-A-11 [P1] PROJECT-PICKUP-PLAYBOOK.md:Claim/evidence governance — The
machine-checkable registry (`docs/CLAIMS.json` + ledger schemas +
`scripts/check_claims.py`, "wired to observe on every commit") is referenced
but no schema is given and none of the three artifacts exists in the tree.
`registries/claims.tsv` is likewise cited by the companion's bench section and
absent. I cannot produce a machine-checkable registry without a schema. Fix:
publish the CLAIMS.json schema and a reference `check_claims.py` (or a precise
spec for one) as playbook-normative appendices.

DEF3-A-21 [P2] PROJECT-PICKUP-PLAYBOOK.md:S2 — Oracle pinning + claim registry —
S2 work says "register the first 8–15 CLAIM-* rows (ATLAS R7 fields) with REQ-*
requirements", but no claim↔requirement binding mechanism exists — the eight R7
fields contain no requirement slot, and the companion's claim table has no REQ
column. Fix: specify the binding (e.g. an optional ninth `requirements` field,
or a `requirements:` line in the claim row) or drop "with REQ-* requirements"
from the S2 work list.

---

## S3 — Bench setup + gate wiring

DEF3-A-12 [P1] PROJECT-PICKUP-PLAYBOOK.md:S3 — Bench setup + gate wiring — The
exit criterion "`aa <spec> --write-golden` has produced a reviewed golden" is
unexecutable: the `aa` tool is never defined, sourced, or install-pathed in the
four files (`_s0/localbench-pattern.md` is outside the read set and is not
cited as the tool's home). For the eval-harness type I can write the spec
string (`inspect_ai@<commit>:dummy:mockllm-scripted-v1`) and the tier list, but
I cannot run the banking ceremony. Fix: define `aa` in the playbook (what it
is, where it lives, how a pickup obtains it) or replace the exit criterion with
a tool-agnostic ceremony description.

DEF3-A-13 [P1] PROJECT-PICKUP-PLAYBOOK.md:Bench spec (slot 13) — CI provisioning
+ cost ownership is TBD in the companion ("owner: parent orchestrator assigns at
S3"), but provisioning owner and funding owner/account are not in the playbook's
role list (parent orchestrator names plan author, integrator, evidence auditor,
reviewers — no provisioning roles). As S3 executor I am blocked on an
assignment the staffing mechanism cannot express. Fix: add provisioning owner
and funding owner to the named roles (or to the S3 work list as explicit parent-
orchestrator deliverables with a record format).

DEF3-A-14 [P1] pickup-eval-harnesses.md:Shared-gate declarations — The table
uses "Universal" as the disposition for GATE-014/015/016/018, but the playbook
allows only load-bearing vs advisory ("declares which are load-bearing vs
advisory for its type"). "Universal" is an `applies-to` value from
shared-gates.md, not a disposition — so whether these four gates block BEADS
READY for this type is undeterminable, and the gate log cannot record their
blocking status. Fix: change the disposition column to load-bearing/advisory
(the natural reading: universal gates are load-bearing for every type unless
waived) and reserve "universal" for the `applies-to` field.

DEF3-A-16 [P1] pickup-eval-harnesses.md:Gate profile — The wired-gate set cannot
be determined. "Apply as-is" names G1, G3, G4, G7, G8, G9, G12, G13, G14;
"type-specific parameters" names G2, G5; G10/G11 are N-A-if-non-Rust; G6 gets a
sentence ("agent sandboxes route through the unsafe classification") that is
neither apply-as-is nor N-A. The S3 rule "a gate with no verdict is not wired"
cannot be applied without the definitive set — I cannot write the GATE_LOG.md
rows. Fix: require every companion gate profile to end with an explicit wired-
gate roster (one line per G1–G14: wired | N-A(reason) | waived(record)).

DEF3-A-24 [P2] pickup-eval-harnesses.md:Localbench bench shape — Slot 12's
anti-reward-hacking law is "verbatim in AGENTS.md", but no AGENTS.md exists in
the pickup tree (verified absent at pickup root). The 12 patterns are therefore
unlocatable by a cold executor. Fix: vendor the 12 patterns into the playbook
or the companion (or name the AGENTS.md path explicitly).

DEF3-A-20 [P2] pickup-eval-harnesses.md:Gate profile — G6: "agent sandboxes
(inspect_ai Docker/k8s, terminal-bench containers) route through the unsafe
classification" risks being a redefinition of canonical G6 (which governs new
unsafe code sites), not the "advisory/N-A language or clearly namespaced analog
labeled as an analog" the playbook requires for non-Rust types. Fix: restate as
advisory ("declare sandbox-escape-relevant ambient reads in the same diff") or
as a namespaced `GATE-EH-NN` analog with "G6-analog" in its rationale.

---

## S4 — Fresh-context review rounds

DEF3-A-3 [P0] PROJECT-PICKUP-PLAYBOOK.md:Roles + review process — The "staffing
mechanism" covers roles (parent orchestrator names plan author, integrator,
evidence auditor, reviewers), but lanes are undefined in all normative
material: round 1 used A=completeness/traceability…F=fresh-agent usability,
round 2 reused the letters with different meanings, round 3 uses A=cold
execution…D=tier-migration audit — and these definitions live only in
ROUND_LOG.md prose lines, not in any lane specification. A cold executor handed
"staff the review lanes per the staffing mechanism" cannot staff lanes that
have no definition. Fix: add a lane taxonomy to the playbook (lane letters,
their fixed remits, per-round assignment record format) or downgrade lanes to a
per-round parent-orchestrator directive with a required written definition.

DEF3-A-15 [P1] PROJECT-PICKUP-PLAYBOOK.md:S4 — Fresh-context review rounds —
Reviewers "may inspect only files the companion explicitly cites", but most
cited files do not exist: `docs/truth-pack/*` (PIN_RECORD.md etc.),
`registries/claims.tsv`, `docs/CLAIMS.json`, `docs/planning/GATE_LOG.md`,
`docs/evidence/receipts/`, and AGENTS.md are all absent from the tree. A
reviewer attempting the cited-file inspection finds the majority of citations
unresolvable — which under the evidence-audit rule ("a failed pointer creates a
DEF, demotes dependent claims, reopens the stage") would nuke the companion.
Fix: distinguish forward references (S2/S3 artifacts not yet built) from
evidence pointers in the companion's citation discipline, so S4 reviewers are
not forced to DEF against the plan's own future.

DEF3-A-17 [P1] PROJECT-PICKUP-PLAYBOOK.md:Pickup lifecycle — There is no
procedure for executing S0→S5 against a pre-existing companion. The
eval-harness companion was authored by the playbook-authoring process (S2 of
that process), not by a pickup S0–S3 run — so the S4 skip-check ("every S0–S3
stage has its artifact or a skip record") fails for this type even though the
companion exists. Is the companion itself the S1/S2/S3 artifact? Unspecified.
Fix: add an adoption procedure — e.g. a `stage-artifact` registration mapping
each pre-existing companion section to its S-stage, or a defined re-entry that
treats the companion as the S1 draft.

---

## S5 — Steady state / beads (BEADS READY checks from the registries)

I ran the six certificate attestations against the on-disk registries
(`docs/planning/ROUND_LOG.md`, `docs/planning/s5/` machinery). Result: 1 of 6
passes for this type; the rest break on missing records, not on failing ones.

DEF3-A-4 [P0] PROJECT-PICKUP-PLAYBOOK.md:Review records — Zero lines in
`docs/planning/ROUND_LOG.md` conform to the machine-readable grammar: no
`round=`, `attest`, `cert`, `stage-artifact`, `unk`, `audit`, `def`, `skip`,
`reopen`, or `kill` lines exist (17 lines, all in an older prose format from
the playbook-authoring process). Consequently every grammar-dependent
attestation fails for eval-harnesses: no audit line (evidence audit never
recorded), no stage-artifact lines for S0–S3, no attest lines, no cert line. A
BEADS READY certificate is unobtainable — not denied, but inexpressible. Fix:
migrate ROUND_LOG.md to the grammar (or run a translator over the prose lines)
and require per-type `stage-artifact`/`audit` lines before any cert line is
written.

Per-check detail:

1. *Log parses against grammar* — FAIL (see DEF3-A-4).
2. *Zero OPEN/DEFERRED P0/P1* — `docs/planning/s5/open-p0p1.md` reports zero,
   but see DEF3-A-23.
3. *No BLOCKS_PLAN UNK* — PASS for this type: `blocks-plan-ledger.md` has 25
   rows across 14 companions, none for eval-harnesses (all UNK-EH-01…06 are
   TARGETED); caveat DEF3-A-22.
4. *Latest audit line result=pass* — FAIL: no audit lines exist.
5. *Every S0–S3 stage has stage-artifact or skip* — FAIL: none exist for this
   type (see DEF3-A-17).
6. *polish=yes* — FAIL: no round lines exist; additionally `diff-class.md`
   records the last corpus diff as SUBSTANTIVE, so POLISH could not be claimed
   anyway.

DEF3-A-22 [P2] PROJECT-PICKUP-PLAYBOOK.md:Review records — The undispositioned
UNK-EH-O1/O2 (see DEF3-A-9) are invisible to the blocks-plan ledger, which
sources only the Unknowns section. The "no BLOCKS_PLAN" check passes on an
incomplete UNK set. Fix: the ledger generator must sweep the whole companion
for `UNK-*` tokens, not just the Unknowns section (this also closes the
duplicate-scheme defect class `id-checks.md` already found in five other
companions).

DEF3-A-23 [P2] PROJECT-PICKUP-PLAYBOOK.md:S5 — Steady state — `open_p0p1=0`
measures DEF/DEF2 findings from rounds 1–2 of the companion-*authoring*
process, not S4 findings from any per-type pickup execution. A type that has
never had its own S4 round inherits a clean bill of health from a different
process's reviews. Fix: scope the "zero open P0/P1" check to DEF records raised
against the type's own pickup artifacts (per-type DEF namespace already exists:
`DEF-<slug>-<NNN>`), and require at least one per-type S4 round before the
check can pass.

---

## What actually worked

Not nothing. Executable end-to-end as written: the evidence-auditor pointer
check against the live GitHub API (owner/repo/path resolution is fully
specified); the DEF record format and statuses; the ROUND_LOG line grammar
itself (as a spec — it is precise enough to implement, it is just not used);
the GATE_LOG.md row format; the shared-gate amendment procedure; the tolerance
rule `tol = max(3 × A/A relative spread, floor)`; the truth-pack file layout
and MANIFEST/ACCEPTANCE_SURFACE schemas; the tier mapping table (with its
verbatim-or-cite conformance rule). The failures cluster in four places:
(1) S1's undefined contradiction rule, (2) unanchored working roots and
missing procedures/templates at S0/S2/S3, (3) the lane taxonomy living outside
normative material, and (4) the machine-readable review records existing as a
grammar with no conforming log — which makes BEADS READY inexpressible.
