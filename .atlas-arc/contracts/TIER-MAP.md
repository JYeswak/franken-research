# TIER-MAP: rigor-atlas and franken-harvest labels onto the Rulebook's tiers (UNK-007 proposal)

Status: PROPOSED by ContractArchitect, 2026-09-24. UNK-007 is BLOCKS_BUILD for the rigor-atlas and fh ingest beads; its resolution requires an independent reviewer to sign this mapping (unknowns.jsonl row UNK-007). Until signed, no `ra:` or `fh:` entry may ship.

## 1. The target vocabulary (RULEBOOK.md §1)

- Five tiers, RULEBOOK.md:27-33: 1 `[Verified]` (direct inspection of a fresh clone, an API response or a live page by the analyst), 2 `[CI-observed]`, 3 `[Maintainer claim]` (asserted in README/docs, not independently executed), 4 `[External]`, 5 `[Inference]` (the analyst's judgment).
- Flavors, RULEBOOK.md:35-42: a flavor such as `[Code-verified]` is allowed only if it maps to exactly one tier and the legend states the mapping. This document is that legend for search results.
- Confidence, RULEBOOK.md:44: High (multiple converging sources or direct inspection), Medium (single solid source), Low (thin evidence).
- Claim statuses, RULEBOOK.md:74: demonstrated, partially demonstrated, aspirational, disproven, stale.
- Independence, RULEBOOK.md:53: "A second agent report is a cross-check, not independence."
- Every claim needs a tier and a grade, RULEBOOK.md:19.

## 2. Principles

1. **Never upgrade.** When a source label could map to two tiers, take the weaker one (the generic rule "demotions are always allowed").
2. **Tier follows the evidence the row cites, not the label alone.** A KNOW row that cites only a README is the maintainer's claim about the code, whatever the label says.
3. **No rigor-atlas or fh claim is graded High.** Both were produced by agents (rigor-atlas: `agent-A01..A16` and `agent-B01..B07`; intake-IntakeRigor2 §3) and Franken Research has not re-graded them. That is one source, a cross-check at best (RULEBOOK.md:53), so Medium is the ceiling.
4. **Anything unmapped fails the build.** An unknown label, an empty label, or a mixed free-text label never falls through to a default tier; rules below name the handling for each case that exists today.
5. Every mapped entry records `evidence.mapped_from = {system, label, rule}` so a reviewer can audit the conversion row by row.

## 3. rigor-atlas (`ra:`)

Counts: `python3 ~/.local/state/zeststream/scratch/control-plane/franken-lead/atlas/contracts-work/tier_map_counts.py` on the DB copy (sha256 `881cce40…`), forks excluded, 2026-09-24. "Docs-only" means every evidence path matches `(\.md|\.txt|\.rst|\.html)$|^docs?/|README` (case-insensitive).

| Rule | rigor-atlas label and condition | Tier and label | Flavor | Confidence | Rows | Real example (rigor.sqlite) |
|---|---|---|---|---|---|---|
| TM-RA-1 | technique `KNOW`, at least one evidence path outside docs | 1 `[Verified]` | `[Code-verified]` | Medium | 1,412 | `techniques.id=936` frankensqlite / mvcc: "Snapshot visibility as a single unsigned comparison…", evidence `crates/fsqlite-mvcc/src/invariants.rs:217-218` at `29e2f9f`; the lines match the mirror at that commit |
| TM-RA-2 | technique `KNOW`, docs-only evidence | 3 `[Maintainer claim]` | none | Medium | 34 | `techniques.id=3` acip / prompt-injection-defense, evidence `ACIP_v_1.3_Full_Text.md` only |
| TM-RA-3 | technique `INFER` (any evidence) | 5 `[Inference]` | none | Low | 19 | `techniques.id=89` atp / scientific-method-brenner ("A negative-evidence ledger…"), evidence `README.md` |
| TM-RA-4 | technique `GUESS`, docs-only evidence | 3 `[Maintainer claim]` | none | Low | 11 | `techniques.id=85` atp / raptorq-fountain, text begins "DOCUMENTED ONLY here", evidence `README.md`, `AGENTS.md` |
| TM-RA-5 | technique `GUESS`, code evidence | 5 `[Inference]` | none | Low | 3 | `techniques.id=434` franken_lean / compiler-ir-ssa ("Declared only: `EGraphConfig`…"), evidence `crates/fln-anvil/src/lib.rs` |
| TM-RA-6 | prescription, any label | 5 `[Inference]` for the advice; each exemplar path is shown as a copy target, not as evidence for the advice | none | Medium if `KNOW`, Low if `INFER` | 139 KNOW, 1 INFER | `byte-equality-probe-fail-closed` (KNOW); `shared-rigor-kernel-consumed-not-reimplemented` (INFER) |
| TM-RA-7 | repo profile | 5 `[Inference]` (the kind and invariant are a classification) | none | Medium when `kind_epistemic` and `invariant_epistemic` are both `KNOW`, else Low; a mixed free-text label is Low | 120 Medium, 15 Low, 2 mixed-label Low | `aadc` (KNOW/KNOW, Medium); `Dicklesworthstone` (kind KNOW, invariant GUESS with empty text, Low); `acip` (invariant label "KNOW for the installer … INFER for the spec", Low) |
| TM-RA-8 | kind (`ra:kind`) | `scheme: ungraded` (a taxonomy we authored; no claim about code) | — | — | 41 | `ad-kernel` |
| TM-RA-9 | ledger hypothesis status (not in v1; `hypotheses` is excluded) | claim status: CONFIRMED → demonstrated, REFUTED → disproven, DEMOTED → partially demonstrated | — | — | 0 in v1 | the ledger's 1,084 resolved hypotheses (intake-IntakeRigor2 §5) |

Totals check: 1,412 + 34 + 19 + 11 + 3 = 1,479 techniques; 120 + 15 + 2 = 137 profiles. No `BLIND` label and no unlabelled technique exists in these tables today; if one appears, the ingest bead fails the build (principle 4).

## 4. franken-harvest (`fh:`)

The catalogs carry no epistemic label. What they carry is a citation (`repository`, `revision`, `path`, line range, verbatim quote), and fh's own verifier classifies a citation with four states (`franken-harvest/src/verify.rs:48-53` at `77d515b`: `CURRENT`, `PINNED_UNVERIFIED`, `STALE`, `CANNOT_DETERMINE`) plus a `line_relocated` flag (`verify.rs:102`). fh states the limit of that check itself: "citation agreement does not prove row prose, interpretation, completeness, or causal conclusion" (`src/cli.rs:2488` at `77d515b`; line 2381 in the dirty working tree). The snapshot check in IF-SOURCES.md §4.2 step 4 reproduces the same states against GitHub at each row's revision.

| Rule | fh state | Entry handling | Tier and label | Confidence |
|---|---|---|---|---|
| TM-FH-1 | `CURRENT` (quote present in the cited lines at the revision) | exemplar kept as a copy target | 1 `[Verified]`, flavor `[Code-verified]`, for "this code is at this line"; the row's rule text ("this is an example of layer L4") is fh's judgment and the `basis` says so | Medium |
| TM-FH-2 | `CURRENT` with `line_relocated` | exemplar kept, cited at the relocated line | as TM-FH-1 | Medium |
| TM-FH-3 | `PINNED_UNVERIFIED` (a pinned citation with no quote to check) | exemplar kept only as a link | 5 `[Inference]` | Low |
| TM-FH-4 | `STALE` | exemplar dropped; an entry left with no exemplar is not indexed; if a stale row is ever displayed its claim status is *stale* (RULEBOOK.md:74) | — | — |
| TM-FH-5 | `CANNOT_DETERMINE` | dropped (fail closed) | — | — |
| TM-FH-6 | local-provenance or sibling-provenance (private ZestStream evidence), and oracles `Z1`–`Z4`, `D14` | never indexed (DEC-003) | — | — |
| TM-FH-7 | runbook step (no quote; cites a layer exemplar path) | indexed as our procedure | `scheme: ungraded`, basis names the layer exemplar | — |
| TM-FH-8 | a ledger row marked RETRACTED or CORRECTED (9 rows; the ledger is not a v1 source) | never indexed | — | — |

Measured today against the local mirror (not yet GitHub): all 52 public catalog rows with quotes are `CURRENT` at their revisions (rigor-stack 22, techniques 14, oracles D1–D13 13, capabilities 3), so v1 would carry 52 exemplars under TM-FH-1 and 26 runbook steps under TM-FH-7. Command: `python3 ~/.local/state/zeststream/scratch/control-plane/franken-lead/atlas/contracts-work/fh_quote_check.py`. Real examples: `rigor-stack.tsv` L1 row, frankengraphdb@`a3c2bec` `registries/constitution.toml:25`; `techniques.tsv` T1 row, frankensearch@`2ab8713` `crates/frankensearch-index/src/simd.rs:181`; `oracles.tsv` D1, asupersync@`c83dff8` `tests/conformance/h2_must_reject_vectors.rs:3`. The intake flags two rigor-stack rows whose exemplar does not fit its layer (rows 19 and 20, both L4; intake-IntakeFH2 §3). They are `CURRENT` as citations; TM-FH-1 keeps them, and the independent reviewer should decide whether to drop them as mis-assigned.

## 5. Where the mapping is lossy

1. **Whose inspection.** Tier 1 means the analyst inspected a fresh clone (RULEBOOK.md:29). A rigor-atlas KNOW is one atlas agent's reading, and Franken Research has not repeated it; TM-RA-1 keeps Tier 1 because the reading was of code at a pinned commit, but the confidence cap (Medium) is the only place the difference shows.
2. **Not fresh.** The atlas pins are from 2026-09-02 and 111 of 138 repos have moved since (intake-IntakeRigor2 §8); fh pins are older. The tier describes the pinned commit, not today. Cards must show the pin date (UNK-009).
3. **Docs as the product.** TM-RA-2 grades a docs-only KNOW as a maintainer claim. For a repository whose document is the artifact (acip ships a prompt specification), the atlas agent's reading was direct inspection of the product, and the mapping under-grades it.
4. **Path heuristic.** Docs-only versus code is a filename regex. A `.md` file that is the formal specification, or a code file that is only a stub, lands on the wrong side. The error runs toward under-grading KNOW rows and over-grading GUESS rows (TM-RA-5 still lands on Tier 5).
5. **Profiles lose KNOW.** A profile's invariant marked KNOW becomes Tier 5 under TM-RA-7, because the profile table has no line-level evidence for it.
6. **Advice versus exemplars.** A prescription's KNOW describes its exemplars; the advice itself is a synthesis and is Tier 5 whatever the label.
7. **One grade per entry.** RULEBOOK.md:44 grades each claim. An entry shows one grade for its headline claim; the grades of individual exemplars live on the copy targets.
8. **fh citation versus claim.** TM-FH-1 grades the citation, which fh itself says proves nothing about interpretation (cli.rs:2488). A reader seeing `[Verified]` on a rigor-layer card could read it as "this practice is verified"; the `basis` sentence must say "the code is at this line; that it shows this layer is fh's judgment".
9. **Line relocation** is folded into `CURRENT` (TM-FH-2). The original pinned line is lost from the card.

## 6. What this document did not do

It did not re-grade any atlas or fh judgment, did not run the GitHub version of the fh check (only the local mirror, N = 1 run, 2026-09-24), did not check every KNOW row's quotes (the intake's re-run found 81.8% still within two lines at HEAD; intake-IntakeRigor2 §5), and has not been reviewed. UNK-007 stays BLOCKS_BUILD until an independent reviewer signs it.
