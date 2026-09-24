# DEF3 Lane D — Tier-migration semantic audit (S4 Round 3)

Reviewer: Lane D (fresh context; reviewed files only, no edits).
Canonical mapping (copied verbatim from PROJECT-PICKUP-PLAYBOOK.md §Claim/evidence
governance, "Evidence tiers T0–T3"):

| Pickup tier | Rulebook tier | Meaning |
|---|---|---|
| T0 | [Verified] | Direct inspection of a fresh clone, API, live page, or a measurement taken at a pinned oracle with invocation-time SHA-256 recorded |
| T1 | [CI-observed] | Executed and observed on CI / banked receipt; attests the suite *runs*, not that it is green, and not that numbers are admissible |
| T2 | [Maintainer claim] / [External] | Asserted by repo docs or an independent source, not reproduced by us |
| T3 | [Inference] | Analyst judgment — always labeled as such, never silently upgraded |

Scope: the 8 companions pickup-inference-engines.md, pickup-quantization.md,
pickup-agent-memory.md, pickup-rag-frameworks.md, pickup-vector-dbs.md,
pickup-eval-harnesses.md, pickup-observability.md, pickup-guardrails.md.
Claim tables sampled at 5 rows per file (40 rows), covering every tier each
file actually labels. Evidence packs consulted where a tier looked wrong.

## Findings

DEF3-D-1 [P1] pickup-guardrails.md:Evidence tiers — The section restates T1 as
"Independent replication" (a second harness reproducing FP/FN numbers; cross-judge
agreement "counts as T1") and asserts "a run that only attests execution is T2".
That inverts the playbook: playbook T1 *is* "executed and observed on CI /
banked receipt; attests the suite runs, not that it is green", and independent
third-party replications are playbook T2 [External] (or T0 only if reproduced by
us). The section also narrows T0 to "Measured against pinned truth pack",
contradicting both the playbook and the file's own 12 T0 claim rows, which rest
on direct file inspection (e.g. CLAIM-02's `qa/test_jailbreak_check.py`). Fix:
replace the section's T0/T1/T2 definitions with the playbook mapping verbatim
(the claim-table legend at line 112 already states it); keep corpus-pinning,
judge-calibration, and mock-LLM tiering as type-application guidance under the
canonical definitions, not as redefinitions. Note: rows are currently tiered per
the canonical legend, so the inversion has not infected the claim table yet.

DEF3-D-2 [P1] pickup-quantization.md:Initial claims table, CLAIM-8 — Tiered
T0 / High / ADMISSIBLE, but the evidence pointer is "model-guides §3 (whisper
PERF_LEDGER result-class doctrine) applied to kernel benchmarks": a normative
methodological rule adopted from sibling packets, not direct inspection of a
quantization repo. Same evidence class as the file's own CLAIM-12 (T3, evidence
reads "pattern imported from sibling packets, not yet observed in a quantization
repo"). A rule we adopted is analyst judgment, not a verified empirical claim.
Fix: re-tier CLAIM-8 to T3 (labeled as adopted corpus doctrine) with
confidence Low / CONTESTED, or restate it as a REQ/GATE-profile rule rather
than an empirical claim row.

DEF3-D-3 [P2] pickup-quantization.md:Initial claims table, CLAIM-10 — Tiered
T0 / Medium / CONTESTED; evidence "model-guides §4 [NO ADMISSIBLE RATIO] (tts)
generalized". Same defect class as DEF3-D-2 (imported doctrine presented as
verified evidence); mitigated by the CONTESTED flag. Fix: re-tier to T3
(labeled), keeping CONTESTED; or restate as a requirement.

DEF3-D-4 [P1] pickup-vector-dbs.md:Evidence tiers, T1 bullet — States T1
[CI-observed] includes "third-party harness results: ann-benchmarks /
`ann_benchmarks/algorithms/` participant modules and their receipts; VIBE
results once stable; independent reproductions with pinned oracle + dataset
hashes" and declares T1 "the only tier admissible for 'faster than X' claims".
Per the playbook, third-party harness results are [External] → T2 (independent
reproductions are T2 if by others, T0 if reproduced by us — never T1).
Round-1 DEF-D-3 was FIXED on exactly this point (competitive-claims tier =
T2-with-GATE-VDB-01–04, not T1), but the bullet still states the old position.
Fix: move third-party/independent-reproduction results to T2; restate the
admissibility rule as "T2-with-GATE-009 + GATE-VDB-02..04 (as applicable), not
T1". Rows are unaffected (no "faster than X" rows in the table).

DEF3-D-5 [P2] pickup-vector-dbs.md:Honest caveats — "ann-benchmarks is the
gold standard but sunset". "Gold standard" is residual top-tier language
applied to an [External] harness; the playbook's own non-conformance examples
name this residue class. Fix: replace with neutral phrasing, e.g. "ann-benchmarks'
methodology remains the best-documented to copy; target VIBE for new
submissions".

DEF3-D-6 [P2] pickup-rag-frameworks.md:UNK-3 — "needed to rate the suite above
T2 self-reported". "Self-reported" is not Rulebook vocabulary (playbook:
[Maintainer claim] / [External]); "above T2" ranking language echoes the
retired inverted scheme. Fix: "rate the suite above T2 [Maintainer claim]".

DEF3-D-7 [P2] pickup-observability.md:CLAIM-OBS-004 — T0 / High / ADMISSIBLE
for a verified-absence claim ("only OpenLLMetry ships explicit
semconv-compliance tests") where the evidence pack itself records the search
was file-list-level only ("GitHub code search (unauthenticated) was
unavailable"; caveat disclosed in the row). High/ADMISSIBLE overstates the
absence half's strength. Fix: narrow the statement to "only OpenLLMetry was
found via file-list search" or set status CONTESTED (Medium) for the absence
half, keeping the positive half (OpenLLMetry's test file) at T0 ADMISSIBLE.

DEF3-D-8 [P2] pickup-eval-harnesses.md:Evidence tiers, T1 bullet — "workflow
files (`.github/workflows/build.yml`, `new_tasks.yml`, `docker.yml`) attest
the suite *runs* as designed". Playbook T1 requires executed and observed on CI
/ banked receipt; a workflow file's existence is inspection (supports
"practice configured" claims at T0), not execution evidence. Fix: T1 =
observed CI runs / banked receipts; workflow-file existence supports T0
"practice exists" claims only. No rows affected (all rows are T0/T3 and the T0
rows are file-verified = playbook T0).

## (b) Adjudication of the T1 anomaly

Task background said the S5 index shows T1 with zero rows corpus-wide. Direct
count of claim-def rows in docs/planning/s5/id-index.tsv (284 rows): **T0 258,
T1 2, T2 9, T3 16** — i.e. T1 is near-zero (2 rows), not zero, and both live
outside the 8 companions reviewed here (fine-tuning CLAIM-09, web-search-apis
CLAIM-SEARCH-05). Within the 8 companions, T1 = 0.

Verdict: **the near-zero T1 is structurally plausible, not a systematic
mis-mapping to T0/T2.**

- The pre-migration scheme was "T0 vendor / T1 independent / T2 self-reported /
  T3 aspirational"; round-1 mapped old "T1 independent" (file/API-verified
  evidence) to playbook T0 [Verified], which is semantically correct — those
  rows were never CI-observed evidence. No playbook-T1 evidence class was
  destroyed by the migration.
- Every companion's evidence base is repo-tree inspection: fresh-clone file
  listings, GitHub API reads, workflow listings, README reads, live pages.
  That is T0-class evidence by the canonical definition. None of the 8
  `_evidence/<slug>.md` packs records an executed CI run or a banked receipt,
  and T1 exists *only* for "executed and observed on CI / banked receipt".
  The planning-phase claim registries simply never produced T1-class evidence,
  so T1 ≈ 0 is what the evidence base honestly yields.
- The reverse error exists, weakly, outside scope: the corpus's only 2 T1 rows
  both cite inspection evidence (fine-tuning CLAIM-09: a Makefile listing;
  web-search-apis CLAIM-SEARCH-05: a workflow file listing), i.e. playbook-T0
  evidence labeled T1. That suggests if anything the migration *created* T1s
  from inspection evidence rather than hiding genuine CI-observed evidence at
  T0/T2. Flagged for the lane covering those files; no action inside these 8.
- Standing gray zone (recorded, not a DEF): CI-*behavior* claims ("engines run
  a dedicated perf-regression CI track", "CI is tiered") rest on workflow-file
  *existence* and were uniformly tiered T0. Under the canonical definition
  ("direct inspection of a fresh clone") the T0 label is defensible for
  "practice exists / configured" claims, since the inspected object is the
  config. If any such row's statement asserts runtime behavior beyond
  configuration presence, the row should be narrowed (not re-tiered wholesale).
  Correction rule: T1 is populated only when an evidence pack records an
  actual observed run / banked receipt; absence of T1 rows is itself a valid
  outcome of an inspection-only evidence base, not a defect.

## (c) Residual inverted-language sweep

Greps for vendor-verified / top tier / gold standard / T0-vendor / T1-vendor /
self-reported across the 8 companions, plus full reads of each companion's
Evidence tiers section. Results beyond the DEF entries above:

- Each companion's claim-table legend now states the canonical playbook
  mapping verbatim (inference-engines, quantization, agent-memory, vector-dbs,
  eval-harnesses, observability, guardrails) or cites it (rag-frameworks:
  "Tiers (canonical, per PROJECT-PICKUP-PLAYBOOK.md)").
- inference-engines oracle item 4 ("Treat as T0 for the harness text
  (inspected in-tree), never as ground truth for performance numbers") and
  item 5 ("T2 vendor reference unless reproduced") are careful, non-inverted
  uses: inspected text → T0, vendor-published numbers → T2. No finding.
- Remaining section-level drifts are recorded as DEF3-D-1, D-4, D-8
  (guardrails, vector-dbs, eval-harnesses). No T0-on-maintainer-claims rows
  and no "top tier"/"vendor-verified" language found in claim rows.

## Severity counts

- P0: 0
- P1: 3 (DEF3-D-1, DEF3-D-2, DEF3-D-4)
- P2: 5 (DEF3-D-3, DEF3-D-5, DEF3-D-6, DEF3-D-7, DEF3-D-8)

## Appendix: 40-row sample table

Rows chosen to cover every tier each file labels (no file labels any T1 rows).

| id | file | labeled tier | correct tier | verdict |
|---|---|---|---|---|
| CLAIM-03 | inference-engines | T0 | T0 | ok |
| CLAIM-06 | inference-engines | T0 | T0 | ok |
| CLAIM-11 | inference-engines | T0 | T0 | ok |
| CLAIM-12 | inference-engines | T0 | T0 | ok |
| CLAIM-14 | inference-engines | T2 (WITHDRAWN) | T2 | ok |
| CLAIM-2 | quantization | T0 | T0 | ok |
| CLAIM-4 | quantization | T0 | T0 | ok |
| CLAIM-8 | quantization | T0 | **T3** | mis-tiered (DEF3-D-2) |
| CLAIM-10 | quantization | T0 | **T3** | mis-tiered (DEF3-D-3) |
| CLAIM-12 | quantization | T3 | T3 | ok |
| CLAIM-1 | agent-memory | T0 | T0 | ok |
| CLAIM-1b | agent-memory | T2 | T2 | ok |
| CLAIM-3 | agent-memory | T0 (CONTESTED) | T0 | ok (inference half labeled) |
| CLAIM-11 | agent-memory | T0 | T0 | ok (verified-absence about the pack) |
| CLAIM-14 | agent-memory | T3 | T3 | ok |
| CLAIM-4 | rag-frameworks | T2 (CONTESTED) | T2 | ok |
| CLAIM-6 | rag-frameworks | T0 | T0 | ok |
| CLAIM-8 | rag-frameworks | T0 | T0 | ok |
| CLAIM-11 | rag-frameworks | T0 | T0 | ok |
| CLAIM-13 | rag-frameworks | T3 (WITHDRAWN) | T3 | ok |
| CLAIM-VDB-01 | vector-dbs | T0 | T0 | ok |
| CLAIM-VDB-04 | vector-dbs | T2 (CONTESTED) | T2 | ok |
| CLAIM-VDB-10 | vector-dbs | T0 | T0 | ok |
| CLAIM-VDB-13 | vector-dbs | T0 | T0 | ok |
| CLAIM-VDB-14 | vector-dbs | T0 | T0 | ok |
| CLAIM-EH-05 | eval-harnesses | T0 | T0 | ok |
| CLAIM-EH-07 | eval-harnesses | T0 | T0 | ok |
| CLAIM-EH-12 | eval-harnesses | T0 | T0 | ok |
| CLAIM-EH-13 | eval-harnesses | T3 (CONTESTED) | T3 | ok |
| CLAIM-EH-14 | eval-harnesses | T0 | T0 | ok (verified absence via API) |
| CLAIM-OBS-004 | observability | T0 | T0 | ok w/ caveat (DEF3-D-7: absence half → CONTESTED) |
| CLAIM-OBS-005 | observability | T0 | T0 | ok |
| CLAIM-OBS-009 | observability | T0 | T0 | ok |
| CLAIM-OBS-010 | observability | T0 | T0 | ok |
| CLAIM-OBS-013 | observability | T3 (CONTESTED) | T3 | ok |
| CLAIM-02 | guardrails | T0 | T0 | ok |
| CLAIM-07 | guardrails | T0 | T0 | ok |
| CLAIM-08 | guardrails | T0 | T0 | ok |
| CLAIM-10 | guardrails | T0 | T0 | ok |
| CLAIM-12 | guardrails | T0 (CONTESTED) | T0 | ok ("canonical spec" inference labeled) |

Sample result: 38 ok, 2 mis-tiered (both quantization imported-doctrine rows);
1 caveat on a labeled tier (OBS-004). Reviewed files were not edited.
