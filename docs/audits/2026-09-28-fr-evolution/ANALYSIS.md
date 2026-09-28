# FR evolution: from assessment publication to maintained decisions

2026-09-28. Base: `112215ddda638d7610097f3f70c8c35a050b40a4` (public main fetched and checked). Analyst: Codex. This is a research proposal with executed boundary probes, not a ratified method amendment, build authorization, or evidence of product superiority.

## Decision

**Extend FR experimentally; keep a separate wr application deferred.** FR already owns useful method, publishing and freshness infrastructure. The strongest candidate addition is a decision maintenance workflow: find what could change a decision, collect the relevant evidence, preserve its relationship to claims, and help another agent or person complete the next review. A general report generator, Rust discovery engine, or second freshness subsystem would duplicate existing work.

Three distinct investments must not be conflated:

1. **Repair actual enforcement gaps.** Small correctness work; no next-generation claim.
2. **Probe a better research workflow.** Files and existing agents are sufficient initially.
3. **Build software only for measured recurring friction.** No graph database, RL training, executor replacement or new crate is justified by this audit.

## What was traced

The actual path is: pinned repository assessments → evidence-tiered packets → human/agent-reviewed stack verdicts → generated pages and consistency gates → API-derived class changes → triage and dated rechecks. The starter kit is a separate reusable planning/execution package. The stack method explicitly forbids installs/benchmarks for that assessment layer; its limitations cannot be silently converted to failed product capabilities.

`README.md` accurately distinguishes consistency from truth: the gates show that the site reflects the packets, not that the packets are right. `stack/METHOD.md` assigns semantic citation support to review. `starter-kit/CHECKLIST.md` B3 assigns receipt provenance to review, B12 assigns claim coverage to an audit, and A13 assigns semantic plan review. Those controls exist as process, not machine guarantees.

FR therefore already has much of the proposed intellectual framework. The question is whether applying it can be made less expensive and less lossy. Adding another checklist is not enough.

## Executed observations

Run `python3 docs/audits/2026-09-28-fr-evolution/probe.py`. The script creates a temporary synthetic project, checks tested inputs against the base commit, captures commands/exits/output, hashes relevant files, and removes the fixture. `PROBE_RESULTS.json` is the actual result. Synthetic inputs are never admitted as real research receipts. Exit zero means the probe ran; inspect individual results.

| Observation | Evidence | Meaning and limit |
|---|---|---|
| Enforced claim with an absent proof fails | `missing-proof-control`, exit 1 | Positive evidence that the structural check has teeth |
| A negative proof containing the expected word PASS passes | `negative-proof-containing-pass`, exit 0 | Substring match cannot establish an executed success; not a claim that the script promised semantic truth |
| One registered claim permits an additional unregistered claim | `unregistered-readme-claim`, exit 0 | Coverage remains B12 reviewer/audit work |
| Removing the registry passes default checker and installed hook | `absent-registry-default`, `absent-registry-hook`, exit 0; explicit-path control exits 1 | Actual integration gap: CI uses the default invocation; hook conditionally skips an absent registry |
| Negative staged proof can be hidden by positive unstaged proof | staged-negative control exits 1; `staged-negative-worktree-positive` exits 0 | Local hook examines different bytes from the index. Normal clean CI would catch the committed negative proof if the registry remains present |
| Explicitly unsigned synthetic non-plan reports READY | `explicitly-unsigned-non-plan`, exit 0 | Known readiness heuristic boundary, not new proof that semantic review is absent. READY is too easy to misread as authorization |
| Bad retry predicate fails hook but passes both CI shell gates | `bad-ledger-hook`, exit 1; `bad-ledger-ci-*`, exit 0 | CI template says every gate is rerun but has no ledger check. This was a local replay of its commands, not a hosted Actions run |
| 28 seeded beads have zero dependency edges | `bead_seed` | Checklist seed, not an executable phase dependency graph. No claim about an installed br scheduler was tested |
| 233 of 299 revisit rows use human; 22 more name an unobserved detector | revisit counts; `triggers.mjs` `OBSERVED_DETECTORS` | Only 44 rows map to detectors the current watch observes. Not a failure rate: conservative human routing avoids pretending complex conditions are machine-verifiable |

The 22 extra rows use `contributors.second_human`, which is in the vocabulary but deliberately unobserved because the watch does not read commit authors. Existing class alerts and the 90-day due rule still operate; a human row does not mean its repository has no monitoring.

The existing freshness report records all 105 predefined mutants killed but has a narrow empirical base: labelled event precision/recall 2/2 on 12 examples, one replay day, and machine/matrix agreement 36/44 CI, 35/44 releases, 44/44 licenses. These are documented scopes, not estimates of future real-world accuracy. Expected discrepancies include reference interpretation and unavailable history; do not relabel all disagreements as software bugs.

Local site gate output and environment limits are retained in `*gates.*`. The initial shallow clone could not resolve historical commit proofs. Full history was then fetched before repeating the gate chain. The full-history rerun reported 24 gate passes and one failure: headless rendering because Chromium is absent. The earlier K3 missing-commit failures disappeared after full history was fetched; they are not counted as a repository defect. No local render pass is claimed. Bun installation, bundle reproduction, hosted Actions and deployment were not run.

## Source-backed improvement mechanisms

Sources below were read on 2026-09-28. They support mechanisms, not a claim that an FR adaptation inherits published benchmark gains. This is a targeted mechanism review, not an exhaustive frontier survey or a benchmark reproduction.

| Primary research | Mechanism to borrow | FR-specific adaptation | What would disprove its value |
|---|---|---|---|
| [Google AI co-scientist](https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/) (2025) | Generate competing hypotheses and experiments; rank proposals, then seek external validation | Each consequential adopt/wrap/build decision names alternatives and a cheap discriminating observation | More discussion and proposals without faster, better-supported decisions |
| [Google TTD-DR](https://research.google/pubs/deep-researcher-with-test-time-diffusion/) (2025) | Iterative draft refinement guided by retrieval | Maintain a provisional argument, counterevidence and unresolved questions during investigation | Initial drafts anchor the conclusion, or evidence is still lost during revision |
| [Google agent scaling](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) and [CATS](https://research.google/pubs/cost-effective-agent-test-time-scaling-2/) (2026 publication page) | Match sequential/parallel effort to task structure and account for tokens plus tools | Dispatch distinct unresolved questions; stop duplicate searches; reserve coherent sequential work for one investigator | Coordination and review costs exceed any quality/coverage gain |
| [Anthropic automated weak-to-strong researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) (2026) | Diverse directions improve exploration; excessive workflow constraints can hurt; evaluation feedback can be exploited | Separate investigative hypotheses, minimal mandated intermediate forms, protected final evaluation | Homogeneous findings, metric gaming, or gains disappear on untouched tasks |
| [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents/) and [agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents/) | Selective context; groundedness, coverage and calibrated grading | Retrieve only claim-relevant evidence while retaining original bytes/references; grade omissions as well as unsupported claims | Smaller contexts drop qualifications, or model judges reward polished unsupported prose |
| [DeepMind AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) (2025) | Candidate generation constrained by executable evaluation | Optimize bounded procedures such as extraction or duplicate detection only when an external oracle exists | Self-ratings replace external results, or general research is falsely treated as formally verified |
| [Microsoft Agent Lightning](https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/) (2025) | Separate execution traces from the optimization system | Capture useful traces before choosing an optimizer; keep provider/orchestrator replaceable | Instrumentation does not support a decision or improvement; RL is premature without stable rewards and volume |
| [AiiDA provenance/caching](https://aiida.readthedocs.io/projects/aiida-core/en/stable/topics/provenance/caching.html) (established open scientific infrastructure) | Reuse computations by explicit inputs and preserve provenance | Bind source version, extraction configuration and evidence artifacts; distinguish reuse from a new observation | Unrecorded inputs or stale retrieval cause invalid cache reuse |

AiiDA is not a frontier foundation-model lab; it is an important counterweight to novelty bias. Its computation provenance is not semantic truth. No AiiDA or Agent Lightning adoption is recommended without a separate integration and license inspection at a pin.

## The proposed workflow, without a new platform

**Decision question:** What would the owner do differently? Record the incumbent workflow and the cost of a wrong decision. User demand remains unmeasured beyond this owner's stated workflow.

**Competing hypotheses:** For example, H0 current FR is sufficient; H1 evidence handoffs cause recurring rework; H2 investigation quality, rather than handoff, is the bottleneck. Pick observations that distinguish these. Do not require a fixed count of hypotheses where the task does not need them.

**Working argument:** Keep claim IDs, scoped conclusions, supporting and contradicting evidence, and open questions in the existing packet. A tentative draft must remain tentative; a second investigator should be able to challenge its premises.

**Evidence admission:** Treat structural validity and semantic support separately. A candidate minimal record needs source revision/URL, acquisition time, artifact hash, passage locator, collection/extraction method, execution receipt where relevant, claim scope and reuse restrictions. Store these only when a consumer uses them. Models select spans; tools calculate and validate coordinates against captured bytes. A hash establishes identity, not truth, authorization or lawful redistribution.

**Decision linkage:** Record which claims actually affect a recommendation. Merely mentioning a source is not a dependency. When a source version changes, flag its dependent claims as needing review; do not automatically call them false or promote them after a keyword match. Unaffected claims may be reused only within recorded scope.

**Prioritized review:** Extend the existing revisit table/dashboard with the smallest queue needed: decision affected, next evidence to obtain, owner, due/trigger condition, disposition and supporting receipt. Prioritize by decision consequence, uncertainty and review cost; start with ordinal judgments rather than fake probabilities. Keep unresolved human conditions visible instead of turning them into optimistic detectors.

**Transfer:** A fresh agent/operator can identify the current decision, evidence, restrictions, unresolved questions and next experiment without the original chat. Export references instead of restricted bytes. Separate public metadata from private logs. Provider replacement is tested, not inferred from using JSON.

**Learning:** Preserve actual failures as development cases. Test a proposed prompt, extraction or routing change against untouched tasks. Keep evaluator answers and evaluation services outside candidate access. Retain failures and rollback paths. Begin with manual comparisons; no training infrastructure yet.

## Experiments that can authorize an addition

These are proposals, not frozen trials or approved spending. The synthetic probes above are public development data and can never be reused as a protected holdout. Select fresh tasks and owner-approved resource caps before live comparisons.

| Priority | Experiment | Baseline and intervention | Measurements and kill condition |
|---|---|---|---|
| E1 | Complete a deferred review | Current FR versus FR with a decision-linked, prioritized review queue; include both actionable and legitimately unresolved conditions | Review minutes, material omissions, unwarranted conclusions, correctly deferred items; kill if queue maintenance outweighs useful completion |
| E2 | Fresh-operator handoff | Existing packet/files versus the same evidence plus explicit claim/decision links | Time to acceptable continuation, repeated retrieval, lost qualifications, rights mistakes; kill if normal FR files are equally effective |
| E3 | Source-change response | Existing watch + ordinary analyst versus linked evidence/claim impact review | Affected-claim recall, unnecessary rechecks, corrected recommendations, cost; include irrelevant changes and ambiguous contradictions |
| E4 | Experiment selection | Ordinary assessment versus explicit competing hypotheses and next discriminating observation | Acceptable decision quality, coverage and total effort; punish needless experiments and premature conclusions |
| E5 | Research effort allocation | Same-model single investigator versus distinct parallel questions, at equal budgets | Unique valid findings, omissions, latency, tokens/tools, human integration; retain single agent when parallelism loses |

Run E1 and E2 before engineering an evidence graph. A small screening round can use two fresh cases per experiment with repeated runs and a baseline repeat to expose noise; it supports only a narrow follow-up decision. For an investment claim, enlarge the sample based on observed variance, protect a holdout and use a reviewer who did not design the intervention. Assign matched task variants or counterbalance fresh operators before execution so repeat exposure does not masquerade as a workflow gain. Treat same-resource and native-best comparisons separately.

**Proposed worthwhile advantage, subject to owner acceptance before freeze:** halve total operator effort on recurring review/handoff tasks while maintaining required coverage and without additional material false support or rights failures in the trial. This is a target, not an observed number. Include setup, failed runs, review, transfer and maintenance allocation. Small trials cannot prove a zero failure rate. A new capability can justify work without a speed win, but it must be a needed capability the baseline demonstrably lacks.

## Bounded repairs and things to remove

1. Missing registry: hook and CI should pass an explicit registry path and fail if it is missing. Keep any optional no-registry mode explicit and unable to claim enforced coverage. Acceptance: absent-registry probes reject; positive control still passes.
2. Shared ledger validation: extract one pure file validator used by hook (index bytes) and CI (checkout bytes). Acceptance: the same malformed ledger fails both, a valid ledger passes both.
3. Staged proof binding: validate a staged snapshot in the hook or narrow the hook's claim and rely explicitly on CI for committed evidence. Acceptance: staged-negative/worktree-positive is rejected locally under the stronger claim.
4. Readiness wording: report structural completeness; require a separately recorded owner/reviewer disposition for authorization. Do not add more keyword requirements to simulate judgment.
5. Source-truth drift: `docs/PIPELINE.md`, `updates/METHOD.md` and README still describe per-event issues, while the current freshness contract uses one dashboard. Replace duplicate mechanics with a link to the canonical runbook. Recheck generated site copies when changing public text.
6. Tombstones: the claim-checker guidance permits deleting an obsolete row; demotion rule D5 forbids deleting retired IDs. Choose one explicit lifecycle, preferably retained retired IDs, and align both instructions.
7. Seeded beads: describe them as a checklist seed until phase dependencies are encoded using the adopted tracker's actual schema. Do not dispatch all 28 as independent ready work.

Delete or defer: mandatory report bulk that adds no decision evidence; another freshness engine; a universal truth score; source-count confidence; automatic promotion from multiple agent agreement; RL or prompt optimization without a defensible reward; general web mirroring; a graph database before plain files prove inadequate. The existing 12-section repository packet is a corpus contract, not automatically the best form for every small research decision; test a concise decision profile separately rather than breaking historic packets.

`stack/METHOD.md` treats different documents/owners as distinct sources for confidence. Add an explicit origin check before using apparent agreement: mirrors, syndicated text and documents repeating the same underlying experiment are not independent corroboration. This is a methodology amendment proposal, not a changed policy in this branch.

The Rust/agent-built weekly discovery filter is appropriate for the declared corpus. It is not a general state-of-the-art search: it omits older incumbents, non-Rust systems and methods without repositories. Reuse it as one input, and route decision-driven discovery by mechanism across ecosystems.

## Recommendation boundary

FR is currently an evidence-disciplined assessment publication and a reusable planning kit. Turning it into a maintained decision workflow is a plausible extension, not a demonstrated frontier result. The contribution would be measurable continuity, review efficiency and evidence handling across existing agents. A separate wr product becomes justified only if that tested workflow repeatedly needs an operating layer that a smaller FR extension cannot provide economically.

No live paid model run, customer study, cross-OS installation study, protected comparative trial, or independent third-party replication was performed. A separate agent reviewed the synthetic observations; that is a cross-check, not independent replication. No production scripts, historical packets, method rules or published site files are changed by this audit.
