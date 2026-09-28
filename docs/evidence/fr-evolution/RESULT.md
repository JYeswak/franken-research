# Implementation disposition

The bounded repairs are implemented and proposed for merge. A separate wr product
remains deferred; no new evidence of comparative research advantage was produced.

Executed:
- 18 installed-kit regression tests passed, including reviewer-supplied smudge,
  symlink and staged-proof counterexamples.
- 13 decision-record tests passed, including failed execution receipts, canonical
  paths, conflicting export rights and private-byte omission.
- Actual record exported and validated; a deliberate source mutation flagged only
  the affected supported claim. See dogfood.json and its reproducible dogfood.py.
- A fresh reviewer recovered the decisions and next actions from the initial
  exported bundle and ran its checker. Missing handoff context led to TRANSFER.md.
- Separate code review found three blockers, which were repaired and retested.
- bun run verify: 26 passed, zero failed, including browser rendering, freshness
  mutations and the new kit/decision gate. See verify.json and verify.stdout.txt.
- Map bundle rebuilt without a bundle diff. Generated shell/llms and shipped kit
  copies were synchronized. No historical assessment or Rulebook was changed.

Environment: Bun 1.4.2 and Chromium 153.0.8010.0. This is local verification, not a
hosted CI/deployment result. Browser setup failures and the preliminary validation
failure are retained. The latter found generated-output drift before final sync.

Dogfood scope relative to the research proposal:
- E1 review completion: used the queue on this implementation; no baseline timing.
- E2 handoff: exercised on one host with a fresh agent; no human/cross-OS trial.
- E3 change response: exercised on an isolated copy with a labeled synthetic edit.
- E4 experiment selection: reviewer counterexamples directed repairs; no controlled
  comparison of planning methods.
- E5 allocation: code and handoff review were distinct tasks; no agent-scaling
  performance claim.

Thus this supports the small implementation and its documented boundaries only.
Operator-time savings, real research-quality gains, and customer value still need
fresh paired tasks, independent judgment and agreed resource caps. They are not
closed by a green validator. All new records are inspectable Git files; no model,
service, graph database, or training dependency is added to the workflow.
