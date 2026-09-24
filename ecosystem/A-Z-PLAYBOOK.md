# A–Z Playbook — Starting Any FrankenSuite Project

Literal numbered process. Each step: action, entry, exit, source tags. No step is skipped silently; a skipped step records its reason. Tags: `[RB]` Rulebook v1.0 · `[A-Rn]` ATLAS-ARC · `[P-Sn]` PLANNING-ARC · `[T-…]` vendor techniques · `[Gn]` port gates · `[SK]` starter kit · `[DM]` dependency matrix · `[EV]` external-validation stories · `[FH]` franken-harvest · `[CI-Cn]` CI classes · `[NP]`/`[H]` synthesis.

---

## Phase 0 — Selection

**1. Pull the idea catalog.**
Action: read all 67 build ideas; confirm count, note format drift.
Entry: project slot open. Exit: current idea list on disk with date.
Sources: `site-cold-review/02-build-ideas.md`.

**2. Dependency-screen every candidate.**
Action: check each candidate against the 53 dependency-matrix edges; tag `ok` or `risky`; risky edges need a named mitigation or the candidate dies.
Entry: idea list. Exit: per-candidate dependency tag.
Sources: `[DM]`, `[H1]` (rider edges inherit the licensing ceiling).

**3. NODUS ring-forecast screen.**
Action: forecast the ring the project would land in if built today. Kill candidates that can never leave Monitor. Record advancement blockers (license, bus factor, evaluation access).
Entry: dependency tags. Exit: ring forecast + blocker list per surviving candidate.
Sources: `[RB]` ring rules (ring down when uncertain; Invest needs independent validation + governance; Pilot needs release artifact + bounded real workload).

**4. External-signal check.**
Action: tag each candidate with any of the five validation stories it claims kinship with (Copilot runtime, Bun, NVIDIA CUDA Rust, MS Rust Tier-1, AWS SDK). A story is a selection input, never evidence for a local claim.
Entry: ring forecasts. Exit: signal tags; unclaimed kinship stated explicitly.
Sources: `[EV]`, ECOSYSTEM.md rule 6.

**5. Score and kill.**
Action: score = ring forecast × dependency risk × idea coverage × signal strength. Write the kill list with one-line reasons. Select exactly one project.
Entry: tags from steps 2–4. Exit: selected project + written kill list.
Sources: `[RB]`, `[DM]`, `[EV]`; judgment labeled `[Inference]`.

**6. Supply-chain intake gate.**
Action: license screen (rider-bearing dependency = auto-fail), bus-factor check, release-artifact check (artifact must target the assessed commit, not an earlier one).
Entry: selected project. Exit: intake PASS/RED with named blockers.
Sources: `[RB]` license/governance; `[H1]`, `[H5]`; frankenredis next-step 3.

---

## Phase 1 — Intake evidence (read-only)

**7. Local evidence desk.**
Action: run the read-only brief — machine/MLX posture, private-document retrieval with provenance, pinned upstream release/commit evidence. Optional local-model summary; deterministic probes stay authoritative. Zero mutation.
Entry: intake PASS. Exit: brief separating facts / unknowns / warnings / reversible next step.
Sources: local-evidence-desk hard rules; `[P]` KNOW/INFER labeling.

**8. Harvest prior evidence.**
Action: mine movement / capability / doctrine / decision evidence for the problem area. File rows with identity-bound provenance and coverage denominators.
Entry: step 7 brief. Exit: evidence rows, or explicit UNRUN if the source is unavailable.
Sources: `[FH]` CHARTER/LOOP; ECOSYSTEM.md I2.

**9. `fh doctor` must pass before fh rows enter the registry.**
Action: run doctor; while RED (currently: schedule/pin drift), fh output is UNRUN [PROPOSED — design assertion, no in-tree source] — not evidence, not cited. Fix drift or proceed without fh.
Entry: step 8. Exit: doctor verdict recorded; fh rows admitted or quarantined.
Sources: `[FH]` GATES; ECOSYSTEM.md M5.

---

## Phase 2 — Plan (ATLAS A–K × PLANNING S0–S11)

**10. Foundation + intent dump (S0/S1).**
Action: human writes the intent dump verbatim — problem, non-goals, do-not-claim boundaries. No agent paraphrase replaces it.
Entry: intake evidence. Exit: intent file; ATLAS state INTAKE→CHARTERED.
Sources: `[P-S0/S1]`, `[A]` states.

**11. Plan v1 (S2).**
Action: one whole-problem reasoning model writes one comprehensive plan with stable IDs. No section is drafted by a different model in isolation.
Entry: intent file. Exit: plan v1, IDs stable (`[A-R2]`).
Sources: `[P-S2]`, `[A-R2]`.

**12. Fresh review rounds (S4).**
Action: run numbered full-context review rounds (expect 4–5 to steady state; count is diagnostic). Rounds emit `DEF-*` deltas into the registries — never competing plans.
Entry: plan v1. Exit: DEF-* log; deltas applied or formally rejected.
Sources: `[P-S4]`, `[A-R4]`.

**13. Optional competing plans (S3).**
Action: at most one synthesis round; after it, deltas only. Record skip reason if unused.
Entry: plan v1. Exit: synthesis note or skip record.
Sources: `[P-S3]`, `[A-R4]`.

**14. Registries and validators (S7).**
Action: seed `.atlas-arc/` JSONL registries — requirements, decisions, interfaces, invariants, claims, risks, unknowns (typed dispositions, `[A-R3]`), gates, workstreams, beads.
Entry: reviewed plan. Exit: registries seeded and machine-readable.
Sources: `[P-S7]`, `[A-R2/R3]`.

**15. Breadth-before-depth check.**
Action: verify `max(section_maturity) − median(section_maturity) ≤ 1`. Deep sections get pulled back, shallow ones pulled up.
Entry: seeded registries. Exit: R1 check result; remediation deltas if failed.
Sources: `[A-R1]`.

**16. Formalize claims (R7 × Rulebook tiers).**
Action: every claim gets class, domain, oracle, mutant/negative control, artifact, do-not-claim boundary, owner, gate — plus a Rulebook tier (`[Verified]`/`[CI-observed]`/`[Maintainer claim]`/`[External]`/`[Inference]`) and confidence. Unmeetable claims are cut here, not later.
Entry: registries. Exit: claim registry complete; cut list written.
Sources: `[A-R7]`, `[RB]` §1; cross-pollination §1/§11.

**17. Pin the oracles.**
Action: inventory every oracle (reference implementation, E2E suite, differential harness). Oracle changes require two-party waiver afterward. Protect the oracle from the implementing agent.
Entry: claim registry. Exit: oracle inventory with pins; waiver rule recorded.
Sources: `[G1]`, `[T-C7]`, `[T-C8]`.

**18. Bead conversion (S8).**
Action: convert the plan into a self-contained bead graph workers can execute without tracing back to prose. Graph validity = architecture validity.
Entry: certified plan. Exit: bead graph.
Sources: `[P-S8]`, `[A-R9]`.

**19. Bead polish + BUILD_READY (S9).**
Action: 3–9 polish passes per bead by weight; BEAD GATE review; fresh-agent oracle — a fresh agent with no plan context must be able to execute. Certify BUILD_READY: no blockers, every dimension ≥8, average ≥8.5, traceability/graph/fresh-agent executability ≥9.
Entry: bead graph. Exit: BUILD_READY certificate or explicit blockers.
Sources: `[P-S9]`, `[A-R5]`; `[A-R8]` context budgets verified here.

**20. Execution-wave plan from the technique catalog.**
Action: bind applicable vendor techniques to waves — waves (`[T-C4]`), leaves-inward (`[T-C3]`), atomic in-place swaps (`[T-C1]`), shipping pilots (`[T-C2]`), counted temporary interop to zero (`[T-C5]`), mechanical/agent/human review division (`[T-C10]`), trial before scale (`[T-B3]`, `[G8]`), compiler errors as work queue (`[T-B4]`). Techniques are bound, not turned into gates.
Entry: BUILD_READY. Exit: wave plan with technique bindings.
Sources: `[T-C1–5]`, `[T-C10]`, `[T-B3/B4]`, `[G8]`.

---

## Phase 3 — Execute

**21. Starter-kit Phase A (readiness).**
Action: run the 14 planning/readiness items and the readiness checker. No execution before green.
Entry: BUILD_READY. Exit: readiness checker green.
Sources: `[SK]` Phase A.

**22. Port-rigor gates G1–G14 (for ports; N/A recorded otherwise).**
Action: enforce each gate at its stage — G1 oracle, G2 pair, G3 own, G4 contract, G5 host, G6 unsafe, G7 review, G8 rulebook, G9 IOU, G10 miri, G11 layout, G12 audit, G13 nostub, G14 reject. Unsafe work routes through the exorcist's classification; split-context adversarial review is default-refute.
Entry: wave plan. Exit: gate log, every gate PASS/FAIL/N-A with evidence.
Sources: `[G1–G14]`, `[T-B5]` (G7), `[T-C17]`/`[T-N6]` (G6), `[T-N1]`/`[T-N7]` (G14).

**23. Execution honesty (Phase B) + negative ledger from day one.**
Action: run the 14 execution-honesty items; open `NEGATIVE_EVIDENCE.md` on day one — every loss, failed hypothesis, and killed finding gets a verdict and artifact (frankenredis exemplar: 26,485 lines). Structured IOUs only, bounded, zero unresolved at close (`[G9]`).
Entry: execution start. Exit: ledger non-empty; Phase B checks green.
Sources: `[SK]` Phase B; cross-pollination §3; `[G9]`, `[T-B10]`.

**24. ATLAS implementation loop per work unit.**
Action: ORIENT → SELECT → CLAIM → RESERVE → EXECUTE → VERIFY → RECEIPT → REVIEW → CLOSE/REOPEN → HANDOFF. No self-approval (`[A-R6]`); exploration subagents never own mutation (`[T-C12]`); kickoff prompts are concise and ownership-bound (`[T-C13]`).
Entry: gated wave. Exit: receipts per unit.
Sources: `[A]` loop, `[A-R6]`; `[T-C12/C13]`.

**25. Drift checks (mandatory).**
Action: on every rebase and weekly: README-vs-tree, badge-vs-CI, status-vs-pin, count staleness. Rebase conflicts are treated as drift detectors (`[T-C11]`). Findings become defects, not TODO comments.
Entry: ongoing. Exit: drift log; zero unfiled drift at close.
Sources: `[RB]` drift checks; `[NP]` P4 (44/44 drift); `[T-C11]`.

**26. Demotion on failure.**
Action: any failed gate demotes the dependent claims; class-fix followed by instance re-audit (`[G12]`/`[T-B10]`); repeated failures become standing instructions/evals/gates (`[T-C14]`).
Entry: gate failure. Exit: demotion log; claims re-tiered.
Sources: `[G12]`, `[T-C14]`, `[T-B10]`; starter-kit demotion rules.

---

## Phase 4 — Verify

**27. `fh` run_stage gates.**
Action: run the 11 live gates [PROPOSED — design assertion, no in-tree source]; every gate requires healthy control, known-bad, mutation, and falsifier. Record HOW vs WHY grades separately.
Entry: execution complete. Exit: gate map results in fh status algebra [PROPOSED — design assertion, no in-tree source].
Sources: `[FH]` GATES/LOOP; ECOSYSTEM.md I6.

**28. Gauntlet (for ports of mature references).**
Action: 16-phase convergent evaluation — workspace → recon → contract → oracle → golden → perf → conformance → surface → ledger → baseline → iterate → remediate → beads → fresh-eyes → soak → final. Convergence: ≥10 full rounds, ≥2 consecutive clean rounds, every open hypothesis resolved. Three negative ledgers (perf/conformance/surface) with retry-condition predicates per closed entry. Honesty is in the harness: a gate that flips on rerun, host change, fresh `target/`, or quiet default change is a lie — rebuild it.
Entry: run_stage green. Exit: `FINAL_GAUNTLET_REPORT.md` + `PARITY_RUNBOOK.md` + release-certification template.
Sources: running-the-gauntlet; `[T-C18]` regression families; `[T-B9]` (no skipped/deleted tests).

**29. Attempt independent validation.**
Action: seek third-party reproduction of headline claims; document the attempt and its outcome even if refused or blocked (e.g., by the rider). This is the only exit from the evaluation paradox.
Entry: gauntlet report. Exit: validation record — independent, attempted-blocked, or not-attempted with reason.
Sources: `[H3]`; `[RB]` (Invest requires it); `[H1]` (rider as blocker).

**30. Measurement-integrity gate.**
Action: committed statistical baselines, paired/reversed runs, PROOF.md per optimization (SHA-pinned golden transcript, keep/reject score), result-class doctrine for perf verdicts, no extrapolation beyond measured scope.
Entry: any perf claim. Exit: perf verdicts with result classes; sandbox numbers disavowed in writing if not re-baselined.
Sources: cross-pollination §5/§6/§7/§8; frankenredis PROOF.md pattern.

---

## Phase 5 — Ship and post-release

**31. Release at the pin.**
Action: tag + signed artifacts built from the assessed commit — not an earlier commit (the H5 failure pattern). No release, no Pilot claim.
Entry: verification complete. Exit: release targeting the pin.
Sources: `[H5]`; `[RB]` ring rules (Pilot needs a release artifact).

**32. Reality check / bridge (S11).**
Action: post-release measurement against claims; publish the bridge note — what held, what didn't, what was disavowed. Benchmarks measured in a contention sandbox say so in the README, upfront.
Entry: release. Exit: post-release note filed.
Sources: `[P-S11]`; frankenredis disavowal pattern; `[NP]` P4.

**33. Write the assessment packet.**
Action: 12-section Rulebook packet at the new pin: fresh pin + date, claim inventory with tiers, benchmark/conformance audit, bear case, license/governance, NODUS ring, Wardley, trajectory, limitations. Eight deepening questions answered. QA checklist run.
Entry: post-release note. Exit: packet, ring assigned (ring down on doubt).
Sources: `[RB]` full.

**34. Revisit triggers + reversible closure.**
Action: set dated revisit triggers (CI drift, rider change, upstream release, validation outcome). Close reversibly — reopen is a transition, not a failure.
Entry: packet. Exit: closure record with triggers.
Sources: `[A-R10]`; `[RB]` trajectory.

**35. Fold into the program.**
Action: update the master matrix, briefs, and synthesis counts; fold the batch into `franken-assessments-44-vN.zip`, increment the version, mirror the same Drive file, keep only the latest.
Entry: closure record. Exit: vN+1 shipped.
Sources: AGENTS.md ZIP convention; `synthesis/00-overview.md` matrix.

---

## Non-rules

- Skipping a step without a written reason is a defect, not efficiency.
- PROPOSED items (Rulebook Tier 0, `compile-rejected`/`runtime-checked`, `[NV]` upgrades) are not applied until a versioned amendment adopts them.
- External stories select; they never evidence. Citing one for a local claim is laundering.
- Local hooks advise; CI enforces. Nothing counts as gated until CI says so.
- `fh` reads; it never dispatches [PROPOSED — design assertion, no in-tree source]. While doctor is RED, fh is UNRUN.
