# FR evolution implementation packet

Consumer: implementer/reviewer. Defect: prior audit gaps. Gate: tracked acceptance commands. Retire after landing in favor of tests and the decision record.

## 1. PROBLEM
<!-- CHECK: PROBLEM -->
FR users need checks that examine committed evidence, and a usable way to finish deferred reviews.
The audit reproduced missing-registry and ledger-CI gaps.
Success means repaired gates and an exercised, portable review workflow; product superiority stays unmeasured.

## 2. NON-GOALS
<!-- CHECK: NON-GOALS -->
No separate wr application or new runtime.
No paid models, training, automated truth judgment or changes to historical packets.
No invented comparative speedup or owner approval of a product thesis.

## 3. SOTA
<!-- CHECK: SOTA -->
Incumbent is FR pinned commit 112215ddda638d7610097f3f70c8c35a050b40a4.
Audit branch commit 7f36d0d69ef26f91ae701dd480aacddaf441f7ab preserves prior results.
Adopt its shell kit and freshness engine; adapt only reproduced gaps and decision handoffs.

## 4. PACKETS
<!-- CHECK: PACKETS -->
Goal: repair registry, staged proof and ledger gates; target starter-kit scripts.
Oracle: positive, missing, negative, staged and CI fixtures from the audit; acceptance python3 starter-kit/tests/test_gates.py.
Risk: portability and overclaim; fixture manifest includes valid controls and fresh installs.
Also repair readiness wording, retain retired IDs, describe seeds honestly, consolidate dashboard mechanics, and synchronize shipped kit copies; acceptance is the regression suite plus bun run verify.
Goal: decision queue proof with inspectable records, target scripts and docs; acceptance python3 scripts/check-decisions.py docs/evidence/fr-evolution/decisions.json.

## 5. CLAIM-INVENTORY
<!-- CHECK: CLAIM-INVENTORY -->
Only scoped executed results may become validated claims; proposed benefits remain planned.
Claims and proof slots live in docs/evidence/fr-evolution/decisions.json.
No claim that structural checks establish truth, no FR performance comparison claimed.

## 6. EVIDENCE-DESIGN
<!-- CHECK: EVIDENCE-DESIGN -->
Receipts bind tested file hashes, command, exit and versions.
Host and worker are recorded; commit is the source baseline plus changed-file manifest until committed.
Public fixtures are explicitly synthetic; all failures remain recorded.

## 7. HONESTY-MACHINERY
<!-- CHECK: HONESTY-MACHINERY -->
The negative-evidence ledger is docs/evidence/fr-evolution/NEGATIVE_EVIDENCE.md.
Demotion is required when a receipt no longer matches its input hashes.
Retry predicate names the changed input; no resurrection by changing a status alone.

## 8. PROOF-TAXONOMY
<!-- CHECK: PROOF-TAXONOMY -->
Passing command receipts establish only their asserted test scope.
A reviewer checks semantic support separately; source quotation is a non-proof of execution.
No private benchmark, held-out trial, or zero-risk guarantee is inferred from fixtures.

## 9. RELEASE-GATE
<!-- CHECK: RELEASE-GATE -->
No waiver of positive/negative controls, site gate failures or review findings.
PR publication may report an environmental block honestly; do not claim a full pass.
Merge and production deployment remain human decisions.

## 10. EXIT-CRITERIA
<!-- CHECK: EXIT-CRITERIA -->
Entry: user authorized implementation and dogfooding in this conversation.
Exit: tests, receipts, separate review and a submitted PR.
Product trial entry still requires fresh tasks and agreed costs; exit cannot be faked with this development corpus.

## 11. REVIEW
<!-- CHECK: REVIEW -->
Separate session reviews this plan before implementation, then the resulting changes.
Review findings and what changed are retained in docs/evidence/fr-evolution/REVIEW.md.
A cross-check is not independent third-party replication.

## 12. SIGN-OFF
<!-- CHECK: SIGN-OFF -->
Scope authorized by owner request: work through all of this directly and submit a pr when finished; use the system itself to dogfood your efforts.
Recorded 2026-09-28 by Codex; sign-off covers repairs and a bounded workflow prototype, not a new product investment.
