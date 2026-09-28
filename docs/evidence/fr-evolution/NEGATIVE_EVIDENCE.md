# Negative evidence from implementation dogfooding

Consumer: implementer/reviewer. Gate: shared ledger validator. Retire only when replaced by durable regression cases and retained review history.

## 2026-09-28 — REJECT: checkout-index is an exact proof snapshot
- Hypothesis: checkout-index preserves the evidence bytes being committed.
- Observation: separate reviewer configured a smudge filter that changed FAIL to PASS; the installed hook accepted it.
- Verdict: REJECT for the exact-byte guarantee, not a comparative performance result.
- Retry predicate: rerun the smudge regression if raw-index materialization changes.
- Repair: read raw blobs by object identity; permanent regression in starter-kit/tests/test_gates.py.

## 2026-09-28 — REJECT: raw path equality prevents export-rights conflicts
- Hypothesis: comparing path strings detects public/private overlap.
- Observation: private secret and public ./secret referred to the same bytes and bypassed the check.
- Verdict: REJECT; this is a deterministic counterexample, not a noisy A/B measurement.
- Retry predicate: rerun alias and conflicting-rights regressions if path admission changes.
- Repair: require canonical relative paths before admission and reject rights conflicts.

## 2026-09-28 — REJECT: a portable record implies a complete project handoff
- Observation: fresh reviewer could recover decisions and validate identities but could not run all project-relative commands or locate omitted review records.
- Verdict: REJECT; initial transfer was an evidence subset, not the whole project.
- Retry predicate: repeat the cold handoff after transfer instructions or export contents change.
- Repair: ship TRANSFER.md explaining root-relative identities, omitted files, and the distinction between validation and authorization.

## 2026-09-28 — BLOCKED: initial browser installer
- Observation: Playwright archive downloads failed extraction; the alternate npm Chromium package needed extraction without ownership restoration on this host.
- Verdict: tooling setup failure; no renderer-quality conclusion.
- Retry predicate: use the installed Chromium binary for the full unmodified render gate.
- Resolution: Chromium 153.0.8010.0 ran the render gate successfully in the preliminary local verification.
