# Round 1, Lane A — Completeness / Traceability findings (DEF-A)

Reviewer: fresh-context S4 reviewer (Lane A). Cold review of the four assigned
companions plus the playbook's "21 covered types" table and `shared-gates.md`.
Sources: `PROJECT-PICKUP-PLAYBOOK.md`, `shared-gates.md`,
`_s0/g1-g14-reference.md` (authoritative G1–G14 definitions), the four
companions, and `_evidence/*.md` (3 claim pointers spot-checked per file —
12/12 resolved to the cited repo/path; see notes).

Checks performed with no findings (explicitly so the integrator does not
re-audit):
- All 10 template sections (Charter seed, Requirements, Oracle candidates +
  integrity checks, Initial claims (CLAIM-*), Gate profile, Evidence tiers,
  Localbench bench shape, Starter-kit deltas, Trend + process citations,
  Unknowns (UNK-*)) are present **and in the same order** in all 4 files.
- Every CLAIM row in all 4 files carries statement + evidence pointer +
  tier + status (mechanical cell-count check on all rows).
- No REQ/GATE/CLAIM/UNK ID is referenced without being defined in its file;
  no skipped sequence numbers within any file (IE: REQ-01..06, CLAIM-01..14,
  UNK-01..06; Q: REQ-1..6, CLAIM-1..12, UNK-1..5; SO: REQ-1..6, CLAIM-1..15,
  UNK-1..5; EMB: REQ-EMB-001..006, CLAIM-EMB-001..013, UNK-EMB-001..006+O1).
- 12/12 spot-checked claim evidence pointers appear verbatim in the matching
  `_evidence/<slug>.md` (IE CLAIM-01/03/10, Q CLAIM-3/4/5, SO CLAIM-2/3/10,
  EMB CLAIM-EMB-001/005/008).
- (f) No UNK-* item in any of the 4 files claims a BLOCKS_PLAN disposition —
  the load-bearing check is vacuous here; none needs adjudication.
- Slugs in the playbook table match `shared-gates.md` "applies to" usage;
  all 21 companion files exist; `_evidence/<slug>.md` files exist for all 4.

## Findings

DEF-A-1 [P0] pickup-embedding-serving.md:Gate profile — Gate profile maps G1–G14 by ID but six of the fourteen descriptions misattribute the authoritative gate definitions in `_s0/g1-g14-reference.md` (the file my task names as the source of truth). Specifically: G2 is described as "same-invocation differential quality-claim validation" while the card's G2 PAIR is "Paired operations must change together per paired-ops.tsv (e.g. lock/unlock)"; G3 is described as claim-row ownership ("every CLAIM-EMB row gets an owning bead") while the card's G3 OWN is "New ownership/allocation sites must be classified in ownership.tsv with non-empty evidence"; G4 is described as "claim artifacts are the receipt JSONs" while the card's G4 CONTRACT is "Contract harness in kit-contracts.yml runs against a .git-less sandbox copy of the staged tree"; G5 is described as host/golden binding while the card's G5 HOST is "Ambient/host reads and new unsafe code must be declared in the same diff (docs/host-boundaries.md + unsafe-boundaries.tsv)"; G8 is described as "bound to the claim registry" while the card's G8 RULEBOOK is "Bulk porting must be declared AND evidenced via kit-rulebook.yml"; G14 is described as tier-mapping for benchmark numbers while the card's G14 REJECT is "Every claimed safety property needs rejection evidence in kit-rejections.tsv"; G11 is claimed "applies as-is" for "registry-as-code file and truth-pack paths" despite the card's note that G11 is Rust-struct-centric and non-Rust types should record an analog rather than force-fit. Root cause: the playbook's own "Gate registry summary" table uses prose definitions (G2 "Paired/differential validation contract", G3 "binds to the R7 owner field", etc.) that contradict the card — the companion followed the constitution, but the card is the lane's authority. Fix: rewrite each gate description to the card's mechanical definition plus a type-applicability note; separately amend the playbook's G1–G14 summary table (constitution amendment) so it matches the card, otherwise every future companion will reproduce this defect.

DEF-A-2 [P1] pickup-inference-engines.md:Oracle candidates + integrity checks / Unknowns — UNK-01, UNK-02, UNK-03, and UNK-04 are each defined twice with divergent wording: once inline in the Oracle section (lines ~95–105) and again in the Unknowns section (lines ~311–321). Two definitions of one ID with different text breaks the closed-namespace traceability contract. Fix: keep the canonical definition in the Unknowns section only; replace the Oracle-section entries with reference-only mentions (e.g. "see UNK-02").

DEF-A-3 [P1] pickup-quantization.md:Oracle candidates + integrity checks / Unknowns — UNK-1 is defined twice: inline in the Oracle section ("**UNK-1** (which AWQ commit, if any, constitutes a trustworthy algorithm oracle — flagged below)") and again in the Unknowns section (line ~303) with fuller text. Same double-definition defect as DEF-A-2. Fix: canonical definition in Unknowns; Oracle-section mention becomes a reference.

DEF-A-4 [P1] pickup-structured-output.md:Oracle candidates + integrity checks / Unknowns — UNK-1 is defined twice: in the Oracle integrity-checks list (line ~95, the differential-fuzzer oracle-design question) and again in the Unknowns section (line ~304). Same defect. Fix: canonical in Unknowns; Oracle section references UNK-1.

DEF-A-5 [P1] pickup-embedding-serving.md:Oracle candidates + integrity checks / Unknowns — UNK-EMB-O1 is defined twice: in the Oracle integrity section and again in the Unknowns section (line ~330, "(Oracle integrity) See §3"). Same defect. Fix: canonical in Unknowns; Oracle section references it.

DEF-A-6 [P1] PROJECT-PICKUP-PLAYBOOK.md:The 21 covered types — the table's "Companion file" column gives wrong filenames for 15 of the 21 types; only 6 are correct (agent-frameworks, eval-harnesses, guardrails, multi-agent-protocols, rag-frameworks, workflow-orchestrators). The 15 wrong entries (table → actual on disk): pickup-llm-inference-engines.md → pickup-inference-engines.md; pickup-quantization-toolkits.md → pickup-quantization.md; pickup-structured-output-decoding.md → pickup-structured-output.md; pickup-embedding-model-serving.md → pickup-embedding-serving.md; pickup-agent-memory-systems.md → pickup-agent-memory.md; pickup-mcp-servers-clients.md → pickup-mcp.md; pickup-workflow-orchestrators.md is correct; pickup-sandboxed-code-execution.md → pickup-sandbox-exec.md; pickup-browser-use-stacks.md → pickup-browser-use.md; pickup-computer-use-agents.md → pickup-computer-use.md; pickup-web-search-api-layers.md → pickup-web-search-apis.md; pickup-agent-observability-tracing.md → pickup-observability.md; pickup-fine-tuning-infra.md → pickup-fine-tuning.md; pickup-rl-envs-rlhf-infra.md → pickup-rl-envs.md; pickup-realtime-voice-agents.md → pickup-voice-agents.md; pickup-vector-databases.md → pickup-vector-dbs.md. All 21 types do have a companion file and the slugs are correct; only the filenames are wrong. Fix: update the table's Companion file column to the actual on-disk filenames (they match the shortened slugs used in _evidence/).

DEF-A-7 [P2] pickup-*.md:Requirements — the Requirements subsection heading is inconsistent across the four files: `### Requirements` (inference-engines, quantization) vs bold inline `**Requirements.**` with no heading at all (structured-output, embedding-serving). A 21-file ecosystem-wide variance (agent-memory, computer-use, fine-tuning, guardrails, observability, rag-frameworks, rl-envs(?) also differ). Fix: adopt one heading level (recommend `### Requirements` under the `## Charter seed` parent or a standalone `##`) and apply across all 21 companions.

DEF-A-8 [P2] pickup-*.md:ID namespaces — ID numbering style varies across files (REQ-01 / REQ-1 / REQ-EMB-001; CLAIM-01 / CLAIM-1 / CLAIM-EMB-001) while the playbook requires the closed sets be "used consistently". No collisions or orphans today, but the variance weakens cross-type machine-checking of claims.tsv registries. Fix: adopt a canonical numbering convention (e.g. `REQ-<short-slug>-NNN`, zero-padded, one sequence per file) and normalize; declare it in the playbook's Namespaces section (constitution amendment).

DEF-A-9 [P2] pickup-inference-engines.md / pickup-quantization.md / pickup-structured-output.md:Gate profile — all three gate profiles are applicability-class maps with no G1–G14 ID-level mapping; each carries an UNK (IE UNK-01, Q UNK-3/UNK-5, SO UNK-2) honestly deferring reconciliation to S5. Honest, but it leaves the playbook-mandated "starter-kit G1–G14 as applicable" slot empty and shifts the reconciliation burden forward. Fix: once DEF-A-1's root-cause amendment lands, require each of the three files to add an ID-level G1–G14 applicability map at the next revision (S5 pre-condition already covers it via their UNKs).
