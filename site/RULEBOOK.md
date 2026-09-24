# The Rulebook — FrankenSuite Assessment Protocol

**Version:** 1.1 — 2026-09-23
**Scope:** Governs every assessment packet (one per repository) in the FrankenSuite research program.
**Status:** Living document. Amendments require noting version, date, and reason.

---

## 0. Non-negotiables

1. **Every packet is self-contained.** It must read cold — a second reader (human or AI) with no prior context must be able to evaluate it. No "as discussed earlier," no unresolved references.
2. **Six separations are maintained at all times:**
   - Repository facts vs. README/maintainer claims
   - Demonstrated functionality vs. aspirational target-state designs
   - Maintainer benchmarks vs. independent benchmarks
   - Current evidence vs. forecasts
   - Open-source technical merit vs. company/business viability
   - Facts vs. inferences vs. speculation
3. **Every substantive claim carries an evidence tier and a confidence grade.** A claim without both is a draft note, not a finding.
4. **Staleness is a finding.** When the README contradicts the code, the contradiction is reported with both dates — it is evidence about governance, not a footnote.
5. **The maintainer's honesty is credited but never substitutes for verification.** Candid negative-evidence docs raise credibility; they do not constitute independent validation.

---

## 1. Evidence hierarchy (mandatory tiers)

| Tier | Label | Meaning |
|---|---|---|
| 1 | **[Verified]** | Confirmed by direct inspection of a fresh clone, an API response, or a live page read by the analyst. |
| 2 | **[CI-observed]** | Observed executing on live CI pages. Attests the suite *runs*, not that it is green, unless pass/fail is legible. |
| 3 | **[Maintainer claim]** | Asserted in README/docs by the maintainer; not independently executed or reproduced. |
| 4 | **[External]** | Independent sources: APIs, papers, press, third-party benchmarks. Absence of coverage is reported as a finding with search-recall caveats. |
| 5 | **[Inference]** | The analyst's judgment. Always labeled; never presented as fact. |

**Evidence-tier flavors (sanctioned v1.1).** Corpus practice refines the five tiers with
flavor sub-labels — e.g. `[Code-verified]`, `[Counted]`, `[Git-observed]`, `[Verified absence]`,
`[License-verified]` — each denoting *how* the tier was satisfied. Flavors are permitted
under two constraints: (1) every flavor must map to exactly one of the five tiers, and the
packet's tier legend must state the mapping; (2) `[CI-observed]` is Tier 2, not a flavor of
`[Verified]` — per-packet legends must not demote it. Ad-hoc labels outside the legend are
not permitted in new packets; the 44 v1.0 packets' ~200 observed labels are grandfathered
under this rule provided their legends carry the mapping.

**Confidence grades:** **High** (multiple converging sources or direct inspection), **Medium** (single solid source, plausible), **Low** (thin evidence, extrapolation). Grade the claim, not the analyst's feelings.

---

## 2. Source hierarchy

1. **Primary:** the cloned tree (code, tests, configs), CI run pages, release/tag APIs, package registries, the license text read verbatim.
2. **Secondary:** README, docs/, planning docs, changelogs — treated as maintainer claims until corroborated by primary sources.
3. **Tertiary:** web search, arXiv, competitor docs, press — for context and independent corroboration only.
4. **Independent validation** means: a party other than the maintainer reproduced a benchmark, reviewed the code, deployed it, or published about it. Maintainer-run CI is not independent. A second agent report is a cross-check, not independence.

---

## 3. Pinning and cutoff

- Assess a **shallow clone of HEAD**. Record the full commit hash and commit date in the packet header.
- Record the assessment date. Repos in this ecosystem move at extreme velocity; undated findings rot within weeks.
- Explicitly check README-vs-code drift: crate counts, line counts, feature lists, "zero unsafe" claims. Report drift as a governance signal.

---

## 4. Packet template (12 sections, each mandatory)

### 4.1 Header
Repo name, URL, pinned commit + date, language, license (with rider noted), stars/forks, last push, assessment date, analyst method (what was cloned, read, run, searched — and what was *not* done).

### 4.2 Executive verdict
One paragraph: what it is, in one sentence. TRL. NODUS ring. The single most important strength and the single most important ceiling. No hedging language without a confidence grade attached.

### 4.3 Claim inventory (minimum 10 claims)
A table: **Claim | Status | Evidence**. Status values: *demonstrated*, *partially demonstrated*, *aspirational*, *disproven*, *stale* (code moved past the docs). The single most valuable section — this is where README marketing dies.

### 4.4 Architecture (reconstructed, not summarized)
Rebuilt from the code: crate/module topology, data flow, verified line/test counts, unsafe-code distribution, dependency posture (especially asupersync — verify, never assume). README diagrams are maintainer claims until the code confirms them.

### 4.5 Benchmark and conformance audit
Separate tables for maintainer-produced vs. independent numbers. For each maintainer number: methodology doc existence, controls (A/A nulls, pinning, host confounds), and whether it would survive an independent rerun. State the reproduction cost honestly (checkout size, toolchain, runtime). **Never cite an un-gated number as a result.** If the project's own docs disavow a number, quote the disavowal.

### 4.6 Comparison: who owns the lane
The incumbent, the forks, the adjacent lanes. Why the incumbent wins today, in one paragraph. What lane (if any) is genuinely unoccupied — defended as inference, not asserted.

### 4.7 Technical merit and adversarial review
Minimum three substantive strengths, minimum three substantive weaknesses. Then a steelman of the bear case: the strongest argument that this project does not matter, stated fairly.

### 4.8 License and governance (material, not boilerplate)
Read the license text verbatim. Classify OSI status honestly — the FrankenSuite rider (denying rights to named AI labs, affiliates, and agents, in some wordings including benchmarking and analysis) is **non-OSI** and must be stated as an adoption ceiling with the exact scope quoted. Bus factor, contribution policy, commit velocity vs. review depth.

### 4.9 NODUS factsheet
| Criterion | Scale | Packet must justify the score in one line each |
|---|---|---|
| Technology readiness | TRL 1–9 | |
| Strategic relevance | 1–5 | |
| Impact potential | 1–5 | |
| Implementation feasibility | 1–5 | |
| Time to mainstream | 1–5 | |
| Collaboration potential | 1–5 | |

**Ring assignment rules:** *Invest* requires independent validation plus governance. *Pilot* requires a release artifact plus a bounded, real workload fit. *Explore* is the default for substantive-but-unproven. *Monitor* is for websites, retired artifacts, and plan-stage work. When in doubt, ring down, not up.

**Sanctioned ring modifiers (v1.1):** *-with-a-ceiling* — the ring stands on technical
merit, but the MIT+AI-lab rider caps mainstream adoption regardless; *-with-exemplar* —
the repo is the program's exemplar for a specific methodology export (e.g. evidence
discipline). Modifiers never change the ring's assignment rules.

### 4.10 Wardley placement
Place the *components*, not just the repo: the commodity surface, the custom-built reimplementation, and any genesis-stage novel elements. One line of placement, one line of what would move each component.

### 4.11 Trajectory (12 / 24 / 60 months)
Labeled **[Inference]**. Give the base case, then the bifurcation: what has to happen for the upside, what decay looks like. End with **revisit triggers** — concrete, observable events (first tagged release, cluster landing, second maintainer, independent benchmark) that would change the ring.

### 4.12 Limitations and open questions (mandatory)
List what was not done (compiled? executed? reproduced?). List the open questions that would most change the verdict. A packet without this section is incomplete.

**Template notes (v1.1).** (a) The template is a *content* contract: packets must carry all
12 sections' content in order; heading numbering may follow either the Rulebook 4.x scheme
or the brief-style scheme, but the section titles must be recognizable and any per-packet
tier legend must carry the §1 flavor mapping. (b) A **Hook** section before the template
is optional. (c) Clearly-labeled trailing sections outside the template (e.g. "Cross-cutting
lenses", "Packet changelog") are permitted provided all 12 mandatory sections are present.
(d) Proposed Rulebook amendments raised inside a packet are marked **PROPOSED — not ratified**
until they appear in the §9 log.

### 4.3-status vs fh gate algebra (v1.1 scoping)
Two status vocabularies coexist and must not be mixed. The §4.3 claim statuses
{*demonstrated*, *partially demonstrated*, *aspirational*, *disproven*, *stale*} govern
**per-claim inventory status** in every packet. The fh closed algebra {*PASS, RED, UNRUN,
EMPTY, UNKNOWN, STALE, REFUSED, QUESTION_MISMATCH, INCOMPLETE, REGRESSION, UNMEASURED*}
governs **gate/CI verdicts** only. The word *stale* has different meanings in the two
algebras; packets must not use one algebra's words under the other's rules. The fh algebra
is a proposed design \u2014 no in-tree adoption source exists \u2014 and is not a ratified program
standard. No packet is required to adopt it.

---

## 5. The eight deepening questions (instantiated per packet)

Every packet must answer, explicitly, one paragraph each:

1. **Provenance.** What does the system record about who/what produced each artifact — and what would it take to make that attestation portable?
2. **The embeddable unit.** What is the smallest useful piece adoptable without the whole repo, and what does that adoption cost?
3. **Unexercised option value.** Where does the architecture hold capability it hasn't used (concurrency, WASM targets, evidence machinery), and what unlocks it?
4. **Benchmark honesty.** Which numbers would survive an independent rerun, and which are load-bearing for the thesis?
5. **The governance path.** What is the credible route from one maintainer to an institution — and what breaks first if velocity decays?
6. **The license as strategy.** Who exactly does the rider exclude, and does that exclusion serve or sabotage the stated mission?
7. **Agent-era fit.** Which concrete agent workload would pick this over the incumbent, and what would have to become true first?
8. **The kill test.** What single experiment, event, or competitor move would falsify the core thesis?

---

## 6. Cross-cutting lenses (applied to every packet)

These came out of the Redis deep-dive and are now mandatory everywhere:

- **The decoupling lens.** Which decoupling does this project represent or advance? (Logic from storage, engine from license, memory from the store…)
- **The methodology-export lens.** If the product fails, what survives? The evidence/claim-governance machinery is a candidate export in nearly every FrankenSuite repo — evaluate it as an artifact in its own right.
- **The asupersync question.** Verify the actual dependency relationship (runtime? dev-only? evaluated-and-rejected?). Never inherit the assumption from sibling repos.
- **The rider question.** Quote the exact rider scope. Assess it as strategy: who is excluded, and what does that cost the mission?

---

## 7. Language and labeling rules

- **Facts** are stated plainly with tier + confidence: "16 crates **[Verified, High]**."
- **Inferences** are labeled inline: "The methodology is the more likely survivor **[Inference, Medium]**."
- **Speculation** is confined to the trajectory section and labeled as such.
- No marketing adjectives without evidence. "Blazing fast" appears only inside a quoted maintainer claim, followed by the audit.
- Numbers are never rounded into impressiveness. Report the counted number and the claimed number side by side when they differ.
- Uncertainty is stated, not smoothed. "CI executes; greenness unknown" is a complete sentence.

---

## 8. QA checklist (before a packet ships)

- [ ] Pinned commit hash and date in header
- [ ] Claim inventory has ≥10 entries with status + evidence tier
- [ ] Every substantive claim has a tier and confidence grade
- [ ] README-vs-code drift explicitly checked and reported
- [ ] License text read verbatim; rider scope quoted; OSI status classified
- [ ] Benchmark table separates maintainer vs. independent; reproduction cost stated
- [ ] Competitor section names who owns the lane and why
- [ ] Adversarial review has ≥3 weaknesses + bear-case steelman
- [ ] NODUS scores each justified in one line; ring follows the assignment rules
- [ ] Trajectory is labeled inference with concrete revisit triggers
- [ ] Eight deepening questions answered, one paragraph each
- [ ] Limitations section lists what was not done
- [ ] Packet reads cold: no dangling references, no assumed context

---

## 9. Amendment log

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-09-23 | Wave-1 consistency pass: §4 template corrected to 12 sections; evidence-tier flavors sanctioned with per-packet legend mapping requirement ([CI-observed] stays Tier 2); §4.3 claim statuses scoped against the fh gate algebra (no mixing; fh adoption not required); ring modifiers (-with-a-ceiling, -with-exemplar) sanctioned; Hook optional; labeled trailing sections permitted; in-packet amendment proposals marked PROPOSED until logged here. |
| 1.0 | 2026-09-22 | Initial ratification. Incorporates: NODUS/Wardley framework decision, evidence hierarchy from the FrankenRedis assessment, the eight deepening questions, the agent-era lenses from the Redis deep-dive (decoupling, methodology-export, asupersync verification, rider-as-strategy). |
