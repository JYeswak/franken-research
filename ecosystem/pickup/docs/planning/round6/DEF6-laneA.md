# DEF6-LaneA — Round 6 residual-fix verification (Lane A)

Zero findings — all four round-6 residual fixes verified.

## Fix 1 — polish third disjunct vs. waivability (lines 615-625 vs. 783-792)
Verified consistent. The waiver authorizes waiving condition 2 (last diff
POLISH) **only**, and only with written reasons that enumerate the residual
non-polish changes and show none touches a claim, gate, threshold,
requirement, or acceptance criterion; conditions 3 and 4 are never waivable.
The third disjunct accepts exactly that: the escape-hatch condition-2 waiver
invoked, with the enumerated residual changes and reasons recorded in the
cert line's `note` field. The disjunct touches only the `polish=yes`
attestation — it cannot waive conditions 3/4, and it requires both the
enumeration and the reasons, mirroring the waiver's two requirements. Written
reasons land in the cert `note` field, which the grammar (line 725-727)
defines as `note=<text|->` — the same field the certify-or-abandon paragraph
uses for its mandated written reasons.

## Fix 2 — reopen enumeration vs. reopen grammar (line 641 prose vs. 752-758)
Verified matching. Prose enumerates four triggers: new evidence, failed audit,
disputed finding, s4-exhaustion. Grammar: `trigger=<new-evidence|
failed-audit|disputed-finding|s4-exhaustion>` — identical four, in the same
order. The grammar's s4-exhaustion gloss ("the certify-or-abandon mandated
return after the third S4 round without a BEADS READY verdict") aligns with
the certify-or-abandon rule at 615-625 (return to S1 with a `reopen` line).

## Fix 3 — slot-13 attestation vs. cert record (lines 783-792 vs. 725-727)
Verified coherent. The slot-13 attestation names a real field: the cert line
grammar defines `note=<text|->`. The disjunctive record (cap, or
`slot-13=N/A (authoring process, no CI spend)` for the authoring-process
certificate) is free-text compatible with the field. No conflict with the
polish disjuncts' use of the same note field: the second arm (diff judgment)
and third arm (waiver enumeration + reasons) apply to mutually exclusive
cert scenarios (only copy/format changed vs. residual non-polish changes
under waiver).

## Fix 4 — scope reconciliation (line 16 vs. line 3 header)
Verified, no contradiction. Line 16 now reads: "This file is normative for
all S0+ pickup artifacts." The header (lines 2-3) reads: "Normative for all
S0+ pickup artifacts." Identical scope statements.

## Window scan (±10 lines around each fix)
No new internal contradiction introduced. The reopen prose (line 641 window)
and grammar (752-758), the certify-or-abandon rule (615-625), and the cert
attestation block (773-792) are mutually consistent on: waiver scope
(condition 2 only), trigger names, and the `note` field as the written-reasons
record.

**Conclusion: zero findings — residual fixes verified.**
