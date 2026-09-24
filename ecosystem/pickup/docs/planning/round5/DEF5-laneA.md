# DEF-5 Lane A — Round 5 Amendment Verification

Target: `~/workspace/franken-research/ecosystem/pickup/PROJECT-PICKUP-PLAYBOOK.md` (amended regions only).
Verdict: **3 residual P2s, 1 residual P1 — amendments do not fully close the set.**

## Per-fix verification

1. **Reopen trigger gains s4-exhaustion** — applied in grammar (`reopen | ... |
   trigger=<new-evidence|failed-audit|disputed-finding|s4-exhaustion>`) plus
   explanatory sentence. *Residual P2:* the reopen-procedure prose in the
   exit-conditions section still enumerates only three triggers — "(new
   evidence, failed audit, disputed finding)" — omitting s4-exhaustion, and
   says "the artifact returns to the stage named in the trigger" while the
   grammar records return-stage as a separate field. Fix: change the prose
   enumeration to the four triggers and reference the `return-stage` field.
2. **Escape-hatch waivability** — cleanly applied: written reasons may waive
   condition 2 (last diff POLISH) only, with the enumeration requirement;
   conditions 3 (zero OPEN/DEFERRED P0/P1) and 4 (no BLOCKS_PLAN) never
   waivable. *Residual P1 (interaction):* the BEADS READY attestations demand
   `polish=yes` on the cert line with only two disjuncts (latest round verdict
   POLISH, or certifying round changed only copy/format). A certificate issued
   under a valid condition-2 waiver — a path the escape hatch explicitly
   authorizes — cannot carry polish=yes, so the checklist as written blocks the
   very path the waiver authorizes. Fix: add a third disjunct — "or condition 2
   was waived under certify-or-abandon with written reasons recorded in the
   cert line's `note` field".
3. **Grammar prose: bare lead-tag convention** — clean. Prose names all nine
   bare lead tags; each has a grammar block (attest ~L681, unk ~L688, audit
   ~L691, stage-artifact ~L707, intake ~L713, cert ~L718, skip ~L737, reopen
   ~L743, kill ~L753); the round/def keyed-field exception is stated. No
   contradiction.
4. **Cert attestations: bench-slot-13 non-TBD check** — added ("bench slot 13's
   cost/provisioning fields are non-TBD"); term defined (REQ-CI-COST, bench
   slot 13). *Residual P2:* the certificate preface asserts "attestations,
   each checkable from the log", but no log line grammar defines any field or
   record carrying the spend cap / non-TBD cost-provisioning value. Fix: name
   the record (e.g. carry it in the cert line's `note` field, or define a
   spend-cap record format).
5. **Skip range capped S0..S3** — clean. "only S0..S3 may be skipped — S4 and
   S5 cannot", grammar `stage=<S0..S3>`; consistent with the cert attestation
   "every stage S0–S3 has a stage-artifact record or a skip record".
6. **Header scope S2+→S0+** — applied at L3 ("Normative for all S0+ pickup
   artifacts"). *Residual P2:* L16 Constitution paragraph still reads "This
   file is normative for all S2+ pickup artifacts", understating the amended
   scope and inviting S0/S1-exclusion readings. Fix: reconcile L16 to S0+.
   (L195's "across all S2+ artifacts" is factually consistent — stable IDs are
   minted in S2 — so only L16 needs the change.)
7. **UNK ledger scan ownership** — clean. Owned by the S5 certification step
   (certifying integrator runs it; the `no BLOCKS_PLAN` attestation covers it);
   in S4 rounds the lane-A reviewer performs it under the completeness remit,
   matching Lane A's defined remit.
8. **Live-pointer checks to evidence auditor** — clean. Reviewer remit: "Live-
   pointer resolvability ... is the evidence auditor's remit, not the lane
   reviewers'"; consistent with the evidence-auditor role (checks pointers
   against the live GitHub API).
9. **Polish-checkability caveat** — clean. "attestations, each checkable from
   the log" with the explicit caveat that the polish=yes second arm "rests
   additionally on the certifying integrator's diff judgment, recorded in the
   cert line's `note` field". (Interacts with the P1 in fix 2.)
10. **Intake fragment completed** — clean. Intake grammar block is complete:
    `intake | type=<slug> | date=<YYYY-MM-DD> | evidence=<pointer> |
    verdict=<INTAKE→CHARTERED|FAIL> | rider=<none|present: <dependency>>`,
    matching the S0 note format.
11. **"counted separately"→"not counted toward the 5"** — clean. Evidence bar:
    "dataset, reference, or adjacent repos do not satisfy the bar and are not
    counted toward the 5".
12. **"authoring-process registries"→"S5 registries (docs/planning/s5/)"** —
    applied and self-contained (the `open_p0p1` registry is named inline);
    no contradiction with surrounding text. Observation only: the path is
    defined nowhere else in the playbook, but the amendment anchors its own
    term.

## Findings summary

- **P1:** condition-2 waiver path vs. `polish=yes` cert attestation — waived
  certificates cannot satisfy the checklist (fix 2 interaction).
- **P2:** reopen-procedure prose trigger enumeration omits s4-exhaustion
  (fix 1).
- **P2:** bench-slot-13 attestation names no log record carrying the spend cap
  (fix 4).
- **P2:** L16 Constitution paragraph still scopes to "S2+ pickup artifacts"
  vs. amended L3 "S0+" (fix 6).

No other residual defects in the amended regions. No corpus files edited.
