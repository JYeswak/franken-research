# S5 certification report — BEADS READY adjudication (2026-09-23)

*Verifier: S5 certification subagent (fresh context). Scope: the BEADS READY /
exit-conditions / S5 sections of `PROJECT-PICKUP-PLAYBOOK.md` v1.3,
`docs/planning/round3/INTEGRATION3.md`, and the s5 registry files
(`open-p0p1.md`, `blocks-plan-ledger.md`, `diff-class.md`). No corpus file was
edited; the S5 scripts were re-run on a `/tmp` copy of the tree (workspace
untouched). Companion files were read only for the named spot-checks in §3.*

## 1. Mechanical results

### (a) S5 extraction scripts re-run — PASS with scope caveats

Ran `s5_extract.py` → `s5_analyze.py` → `s5_generate.py` on a `/tmp` copy
(identical bytes). Results:

| Check | Result |
|---|---|
| UNK rows with BLOCKS_PLAN disposition, corpus-wide | **0** (`_analysis.json` `blocks_plan: []`; id-index scan of `stated_status`: 0) |
| DEF rows, severity P0/P1, status OPEN/DEFERRED | **0** |
| id-index tallies | **consistent**: 2503 rows (GATE 918, DEF 573, CLAIM 427, UNK 327, REQ 258); 173 unique DEF ids = 92 round-1 (`DEF-[A-F]-N`) + 81 round-2 (`DEF2-[A-F]-N`); ledger sources = 173, matching |

**Scope caveat (finding F6, P2):** the S5 tooling is blind to round 3.
The DEF ID regex (`DEF2?-[A-F]-\d+`) does not match `DEF3-*`; the DEF
ledger is built only from `round1/INTEGRATION.md` and `round2/INTEGRATION2.md`;
`round3/` is not in the extract scope. The "0 open P0/P1" above therefore
covers rounds 1–2 only. Round 3 was verified independently against
`ROUND_LOG.md` (see §1c): 41 DEF3-family def lines (9 P0 / 17 P1 / 15 P2),
**all FIXED**, zero OPEN/DEFERRED P0/P1. The checked-in `open-p0p1.md` and
`diff-class.md` are round-2-era artifacts (173 DEFs; round-2 diff) and do not
cover round 3; `s5_generate.py`'s blocks-plan-ledger template hardcodes the
stale header "25 rows across 14 companions" (it would emit a wrong header if
run in place — the checked-in hand-updated version is the accurate one).

### (b) `grep -ri "exorcist"` — PASS

`PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`, all 21 `pickup-*.md`:
**0 hits**. (Remaining corpus hits are historical DEF-record text in
`docs/planning/round1|2|3/` and the off-limits `_s0/` digest — records of the
finding, not claims.)

### (c) ROUND_LOG.md grammar parse — 279 lines; counts match; 3 schema issues

Independent strict parse against the v1.3 line grammar (one record/line,
` | ` separators, lowercase keys, field vocabularies):

- **279 data lines** (HTML comment header excluded): 15 attest, 15 round,
  1 audit, 3 stage-artifact, 1 skip, 29 unk, 214 def, 1 cert —
  exactly INTEGRATION3.md's claimed census.
- **def census:** 214 lines, no duplicate ids: P0 13 / P1 108 / P2 93;
  statuses FIXED 212, DEFERRED 1 (`DEF-A-8`, P2), WONTFIX 1 (`DEF-F-19`, P2).
  **Zero P0/P1 with OPEN or DEFERRED status.** All 41 DEF3-family lines
  (5 scored P0 + 17 P1 + 15 P2 + 4 INT P0) are FIXED — INTEGRATION3's claim
  verified.
- **unk census:** 29 lines: 22 TARGETED, 7 RESOLVED, **0 BLOCKS_PLAN**.
- Schema deviations found (INTEGRATION3 claimed "0 field errors" — that claim
  covered key sets/vocabularies only, not these):
  - **F2 (P1):** cert line (file line 311) carries `pin=UNCOMMITTED`.
    The playbook: "`pin=UNCOMMITTED` never appears on a `cert` line."
    Direct written-rule violation. (Also `signers=integrator` alone; a
    future READY cert requires parent orchestrator + ≥1 independent reviewer.)
  - **F3 (P1):** audit line carries `seed=unrecorded`; the grammar requires
    `seed=<n>`. Disclosed in INTEGRATION3 as open question #5, but it means
    the log is not schema-valid as written — and the cert attestation
    requires "the log parses against the grammar above (schema-valid)".
  - **F4 (P2/observation):** all 30 attest/round lines write
    `independence=<authored:no,prior-review:no>` with literal angle
    brackets. The grammar's `<...>` is notation (cf. `verdict=<BEADS
    READY|…>`, `seed=<n>`), so the value should read
    `authored:no,prior-review:no`. Uniformly applied and documented in the
    backfill header; needs a grammar amendment or a bracket-strip before any
    cert can honestly assert schema-validity.

### (d) blocks-plan-ledger.md — PASS (self-consistent)

- 0 BLOCKS_PLAN rows; header "0 rows across 21 companions" (corrected from
  the stale "14").
- Disposition log accounts for all 29 re-typed rows (7 RESOLVED / 22 TARGETED),
  matching the 29 `unk` lines in ROUND_LOG.md (22 TARGETED / 7 RESOLVED,
  0 BLOCKS_PLAN).
- Companion grep `Disposition: BLOCKS_PLAN` → 0 across all 21 files
  (canonical rows, inline mentions, duplicates all re-typed).

## 2. Targeted review of the round-3 integration

### (i) Playbook v1.3 sections — executable. No finding.

- **S1 contradiction rule:** numbered executable procedure — (1) quote both
  source sentences; (2) check phase/namespace scoping; (3) where sources are
  silent, the explicit user requirement (INTENT.md) governs; record
  contradiction + resolution in the charter; unresolved P0-level
  contradiction blocks S1 exit. Concrete inputs, decision steps, named
  record location, blocking condition. (Uses bare-imperative "Record";
  the playbook's own RFC-2119 rule reads bare imperatives as
  non-normative — the section is framed as procedure, not MUST-text, so
  this is consistent.)
- **Working root:** concrete — the pickup's own subtree root; every
  relative path resolves beneath it, never under home or a sibling
  checkout; nested-tree case parenthesized. Executable.
- **Lane taxonomy A–F:** remits listed per lane; per-round specialization
  logged via `lanes=` on round lines. Executable.

### (ii) The four integrator-rewritten G6 entries — coherent, no invented mechanisms. No finding.

- `pickup-sandbox-exec.md` G6: canonical G6 as-is (new unsafe sites carry
  `// SAFETY:`; tree-wide inventory accounted) — matches the playbook's
  operational definition verbatim in substance.
- `pickup-web-search-apis.md` G6: labeled G6-analog, advisory, conditional
  on a native extension appearing — per the Rust-centric-gates rule.
- `pickup-observability.md` G6: labeled G6-analog, advisory, "only if
  native collector code appears" — per the rule.
- `pickup-workflow-orchestrators.md` G6: canonical G6 as-is for Rust
  targets; advisory analog (declare ambient-capability reads) for
  Go/TypeScript/Python — per the rule.

Procedural note (already flagged as INTEGRATION3 follow-up #3):
DEF3-INT-1..4 were raised *and* applied by the integrator itself, not by an
independent lane reviewer. Substantively the rewrites pass; the parent's call
whether they stand or get a lane-C re-review.

### (iii) The two integrator-triaged UNKs → TARGETED — genuine triage, not relabeling. No finding (one nit).

- `pickup-browser-use.md` **UNK-BU-1**: promotion predicate is falsifiable —
  "at S3 bench setup, decide rerun-vs-audit by the [cassette-feasibility]
  probe; bank goldens only where the A/A null is exact; LLM-judge legs carry
  the committed nondeterminism floor and record all prompts/responses in
  receipts." Named owner (plan author), named S3 step (bench setup), flagged
  as integrator triage pending parent re-triage. Meets the playbook's
  TARGETED definition (named promotion predicate; never cited as a result).
- `pickup-quantization.md` **UNK-1**: predicate falsifiable — "S2 oracle
  pinning evaluates the three candidate classes (paper tables as oracle,
  AutoGPTQ-era AWQ kernel port, downstream vLLM/TensorRT-LLM AWQ
  implementation); the pinned oracle commit is recorded in PIN_RECORD.md; no
  AWQ golden is banked until the oracle is pinned." Named owner (plan
  author). **Nit:** the note says "S3 step: oracle pinning" but oracle
  pinning is S2 work per the lifecycle — step label slip, substance intact.

### (iv) RESOLVED write-in spot-check — genuine resolution. No finding.

`pickup-voice-agents.md` **UNK-VA-1** asked: decide whether latency truth is
(a) self-measured T1 with A/A goldens or (b) a newly constructed independent
benchmark (vendor marketing numbers inadmissible either way). Resolution
adopts (a) with evidence grounding (pipecat's TTFA/TTFAT/TTFB metric classes
with dedicated unit tests; livekit's `test_e2e_latency_handoff.py`) and the
decision is written into the bench tiers (self-measured T1 latency tier,
A/A-banked goldens). The resolution text directly answers the unknown's
decision question. Dated, round-stamped.

## 3. Adjudication — exit conditions as written

The written exit conditions (playbook, "S4 rounds run to steady state"):

| # | Condition | Verdict | Evidence |
|---|---|---|---|
| 1 | BEADS READY certificate recorded in ROUND_LOG.md | **FAIL** | The sole cert line (file line 311) carries `result=NOT READY` — "a status record, not a certificate" per the v1.3 grammar. No certificate exists. |
| 2 | Last diff POLISH | **FAIL** | The last integration diff (round-3 integration) is SUBSTANTIVE: (a) round 3 itself produced 5 P0 + 17 P1 findings (+4 integrator P0s) — a POLISH round "produced no P0/P1 findings"; the round-3 round lines carry `verdict=OPEN, polish=no`. (b) The integration changed claims (CLAIM-OBS-004 → T0/Medium/CONTESTED narrowed; CLAIM-8/CLAIM-10 → T3/Low/CONTESTED), gates (four G6 rewrites), 29 UNK dispositions (disposition is load-bearing for the BEADS READY gate), and the playbook itself (v1.2→v1.3 constitution amendment). Any one voids POLISH per the written mechanical rule. |
| 3 | Zero OPEN and zero DEFERRED P0/P1 | **PASS** | 214 def lines: 212 FIXED; the 2 non-FIXED are P2 (DEF-A-8 DEFERRED→S5, DEF-F-19 WONTFIX with rationale). Zero P0/P1 OPEN/DEFERRED — verified independently of the round-3-blind S5 scripts. |
| 4 | No UNK-* with disposition BLOCKS_PLAN | **PASS** | 0 corpus-wide; 29 unk lines = 22 TARGETED + 7 RESOLVED; ledger self-consistent (§1d). |

### On the 3-round cap's certify-or-kill rule

"After the third S4 round without a BEADS READY verdict, the integrator must
certify-or-abandon: either record BEADS READY with written reasons, or kill
the pickup (a `kill` line for genuine abandonment, or return to S1 with a
`reopen` line) with written reasons in ROUND_LOG.md."

The cap is a forcing function, **not a waiver** of condition #2. Three rounds
ran; no READY verdict. The conformant options: BEADS READY (conditions 1–2
unmet — cannot be honestly recorded), kill (genuine abandonment —
unwarranted; the work is one POLISH round from done), or **reopen** (the
honest conformant path). The recorded `result=NOT READY` status line is none
of the three — the current log state is non-conformant with the rule as
written. A fourth review round is not permitted by the cap; the rule's escape
hatch is the reopen line.

### On the integrator's stated reason — corrected

The integrator's NOT READY rests on: "S3 was honestly never executed per
type; type-specific S4 rounds still required per the v1.3 S5 limitation."
Against the written text, this reasoning is mis-scoped:

1. **The v1.3 S5 certification-scope section does not demand executed
   pickups before READY.** Its text: "the `open_p0p1` count in the existing
   authoring-process registries measures authoring-process DEFs, not a type's
   own pickup execution; certification of a type requires at least one
   type-specific S4 round with a type-specific DEF namespace —
   authoring-process counts never certify a type." This is a scope guardrail:
   authoring-process review counts cannot certify *a type's executed
   pickup* — each executed pickup will need its own type-specific S4 round.
   It says nothing about the planning system itself.
2. **The artifact under certification is the planning system** (playbook +
   21 companions). Its BEADS READY standard is written: "BEADS READY closes
   planning… only that this pickup plan is internally consistent and its
   evidence checks out" — i.e. the planning system is complete, consistent,
   executable, and ready to drive real pickups, *which is what the beads
   (bd-*) are for*. Demanding executed per-type pickups before cutting the
   beads that would drive those executions is circular; the text does not
   demand it.
3. **The S3 skip is accommodated, not blocking.** The playbook provides
   `skip` lines ("silence is not a record"), and the S4 stage check accepts
   "a `stage-artifact` record or a `skip` record" for S0–S3. The honest S3
   skip (recorded, rationale given) satisfies the written machinery; it is
   not a written blocker of BEADS READY.

So: the integrator's *verdict* (NOT READY) stands, but on the written
grounds — conditions #1 and #2 fail, and the certify-or-kill rule requires a
conformant action — not on the stated "executed pickups required" ground,
which the playbook's own text does not support for this artifact.

## 4. Verdict: NOT READY

**NOT READY** — agreeing with the integrator's bottom line, with corrected
reasoning per §3. No BEADS READY certificate text is provided (there is
nothing honest to certify against the written conditions).

### What would satisfy the unmet conditions

1. **Conform to the certify-or-kill rule.** The parent records a `reopen`
   line (artifact=`PROJECT-PICKUP-PLAYBOOK.md`, round=3,
   trigger=`new-evidence` — the substantive round-3 integration diff,
   return-stage=`S4`); S4 re-runs from there. **Tension to resolve:** the
   reopen procedure says "no stage may be skipped on re-entry," read
   strictly this conflicts with the standing honest S3 skip. Recommend the
   parent resolve it by constitution amendment (explicit approval naming the
   changed section) clarifying that a POLISH re-verification round re-runs
   S4 only, or by re-affirming the S3 skip on re-entry — rather than leaving
   the tension unrecorded.
2. **A genuine POLISH round:** a complete S4 round that produces no P0/P1
   findings and changes only copy/format. (Round 3 cannot serve: it produced
   22 P0/P1 findings and drove a substantive integration.)
3. **Fix the schema-validity blockers** before any cert, since the cert
   attests "the log parses against the grammar above (schema-valid)":
   cert-line pin must be a real sha (never UNCOMMITTED — F2); the audit
   `seed=unrecorded` must satisfy `seed=<n>` (re-run the audit with a
   recorded seed, or amend the grammar — F3); resolve the
   `independence=<…>` bracket notation (F4).
4. **Bring the S5 registry evidence up to round 3** (or record the parent's
   acceptance of INTEGRATION3.md + ROUND_LOG def lines as the round-3
   evidence): extend `open-p0p1.md` and `diff-class.md` past round 2, widen
   the S5 DEF ledger sources and ID regex to DEF3-*, and fix the
   blocks-plan-ledger generator's hardcoded stale header (F6). A future cert
   should be mechanically checkable, not prose-attested.
5. **Then certify:** a `cert` line with `result=BEADS READY`, real pin,
   `signers=<parent-orchestrator>,<independent-reviewer>`, `audit=pass`,
   `polish=yes`, with the written reasons. The parent may also then decide
   INTEGRATION3's follow-ups #1–#3 (re-triage of UNK-BU-1/UNK-1, lane-B
   coverage, DEF3-INT-1..4 standing).

### Findings register (for the parent's action list)

- **F1 (P1):** Exit condition #2 fails — last diff is SUBSTANTIVE, not
  POLISH (§3 table). Requires the reopen + POLISH-round path above.
- **F2 (P1):** Cert line `pin=UNCOMMITTED` violates "never appears on a
  cert line"; signers insufficient for a future READY cert.
- **F3 (P1):** Audit line `seed=unrecorded` violates `seed=<n>`; blocks the
  schema-valid attestation.
- **F4 (P2):** `independence=<authored:no,prior-review:no>` bracket notation
  vs grammar notation — needs amendment or normalization.
- **F5 (P1):** Certify-or-kill non-conformance: `result=NOT READY` status
  line is not one of the rule's three options (BEADS READY / kill /
  reopen). Conformant next step is a reopen line (kill unwarranted).
- **F6 (P2):** S5 registry/tooling stale re: round 3 (open-p0p1.md,
  diff-class.md round-2-era; DEF ledger + ID regex blind to DEF3-*;
  generator hardcodes a stale blocks-plan header).
- **Observation:** DEF3-INT-1..4 (integrator-raised P0s) — substantively
  sound per the G6 spot-check (§2ii); procedural standing is the parent's
  call (INTEGRATION3 follow-up #3).
- **Nit:** quantization UNK-1 triage note labels the step "S3 step: oracle
  pinning" though oracle pinning is S2 work.

*Note on the bead question in the task brief: because the playbook's text
does not require executed per-type pickups before READY, no bead needs to
execute a trial pickup as a precondition. The first trial pickup would be a
`bd-*` work bead cut at S5 after certification (one type's S0–S3 per the
lifecycle), which is downstream of — not prior to — the BEADS READY
verdict.*
