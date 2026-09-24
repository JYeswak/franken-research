# Model-Project Start Patterns (S0 Reader Extraction)

Reusable patterns for starting a model-based project, extracted from four FrankenSuite packets.
Sources: `franken_ocr-assessment.md` (**ocr**), `franken_whisper-assessment.md` (**whisper**),
`franken_tts-assessment.md` (**tts**), `franken_nlp-assessment.md` (**nlp**). Line citations refer to the
assessment packets. Patterns only — no verdicts.

## 1. Truth packs (pinned oracle + weights + fixtures, committed in-tree)

The common pattern: a `docs/truth-pack/` directory holding pinned upstream source commits, weight
revisions, fixture hashes, and a fetch/verify script — so "parity against what" is reproducible.

- **tts** — fullest instantiation. `docs/truth-pack/` ships `PIN_RECORD.md` (two upstream pins + paper,
  dated 2026-08-06, with the honest note the GitHub code pin is ~7 weeks newer than the weights pin),
  `MANIFEST.sha256`, `ACCEPTANCE_SURFACE.json` (break-even thresholds), `NONDETERMINISM_FLOOR.md`,
  tensor inventories, and `fetch-truth-pack.sh --verify`: "a portable oracle-capture apparatus, not just
  fixtures" [tts:127]. Oracle pins: HF weights `5d83992` (2026-01-29), upstream source `022e286`
  (2026-03-17) [tts:60]; rerun path = pinned oracle + truth-pack capture flow [tts:123].
- **ocr** — Phase −1 truth pack pinning "the exact model source commit and fixture hashes" [ocr:9]:
  pinned model commit `3a7f4dbb`, per-source SHA256s, pinned oracle stack
  (`torch==2.10.0`, `transformers==4.57.1`) [ocr:159]; every ledger row resolves against it [ocr:225].
- **whisper** — model packages admitted only after **compiled SHA-256 trust roots** pass; `fw doctor`
  keeps `operationally_verified: false` until a real transcription succeeds — "the project won't certify
  a pipeline that has never heard a sound" [whisper:28]. Replay envelopes bind execution: fields
  `input_content_hash` (SHA-256 of normalized WAV), `output_payload_hash`, `backend_identity`,
  `backend_version`, `pcm_sha256` [whisper:61]. Note the asymmetry: envelopes are integrity records, not
  origin records — "a hostile operator could substitute audio and produce a valid-looking envelope for a
  different recording" [whisper:222].
- **nlp** — Phase −1 truth pack is still future (design stage): `SUITE.lock` (format 2) already binds
  foundation revs as "plan-audited vs selected revs with reason strings" [nlp:88]; tensor census replayed
  byte-identically against the live pinned HF revision `f56ec5a9…` — `config.json` + index SHA-256s match
  hardcoded pins, `--check` PASS, missing=0/mismatched=0/extra=0 [nlp:82]. Weights fetched: only the
  16.5 KB safetensors index + 1 KB config, not the weights [nlp:5].

**Portable artifacts:** stamped origin headers — `focr convert` writes the source safetensors SHA256
into the `.focrq` header (`source_sha256`) and `focr pull` verifies every part hash against a
committed, schema-v2 manifest embedded in the binary [ocr:225]; the same write-time origin binding
exists for `.fnlpq` (staged immutable quant recipes, content-addressed, "authority freeze and invariant
contract") [nlp:113]. Open gap (not yet achieved): tamper-evidence end to end — header record should be
hash-chained (source SHA256 + exact recipe + converter version) and verified offline by `doctor`
[ocr:225].

## 2. Oracle-integrity verification (verify before use)

- **Record blob SHA-256 at invocation.** whisper's CAMPAIGN WIN requires "the incumbent binary's SHA-256
  recorded" for each arm of a same-invocation duel [whisper:114]; both ELFs' SHA-256 identities are part
  of the template [whisper:34]. Failure mode fired in public: the 2026-08-11 Metal entry became
  NO ADMISSIBLE PERFORMANCE VERDICT because "benchmark executable's SHA-256 was not recorded…
  measurements remain diagnostic only" [whisper:127].
- **Hash-pin provenance at conversion, verify at pull.** ocr: `focr pull` verifies every part hash against
  the committed manifest [ocr:225]; tts: `ftts pull` serves a pre-quantized artifact (~2.0 GB) that is
  SHA-256-verified and resumable [tts:86]; whisper: installer admits model packages only after
  compiled trust roots pass [whisper:158]. Supply-chain honesty: whisper notes the *installer itself*
  arrives via `curl -fsSL … | bash` with no pinning — "the most-verified artifact in the chain is
  bootstrapped by the least-verified step" [whisper:168].
- **Freeze the oracle environment, including what it can't do.** tts truth-pack resolution OQ-15 freezes
  the local CPU oracle env (`torch==2.7.1`, `librosa==0.11.0`, …) [tts:131]; ocr pins the rerun stack
  (`torch==2.10.0`, `transformers==4.57.1`, CUDA for the bf16 reference) with "pinned-thread hardware"
  [ocr:132]. nlp pins the comparison baseline to a real verifiable commit: the upstream llama.cpp PR
  #25994 merge commit `b77d646…`, so "the 'tested official llama.cpp revision' … is a real, verifiable
  commit, not a placeholder" [nlp:57].

## 3. Result-class doctrine (whisper's PERF_LEDGER — quoted rule)

From `docs/PERF_LEDGER.md`, effective 2026-07-27 [whisper:114]:

> A franken-before/franken-after comparison is **Result class: SELF-SPEEDUP / MAINTENANCE** and
> "may justify landing code, but it does not count as a campaign win"; **INCUMBENT-WIN / CAMPAIGN WIN**
> requires the actual legacy incumbent running side-by-side in the same invocation, with the
> incumbent binary's SHA-256 recorded, same-invocation dual A/A controls, and a 2x-null-margin
> statistical gate. … Only CAMPAIGN WIN rows may support public competitive claims.

Supporting machinery, same ledger: dual A/A nulls must land in **[0.98, 1.02]** [whisper:114] (the
2026-08-23 campaign recorded nulls of 0.963 / 0.936 and therefore "banks NO cross-arm comparison"
[whisper:127]); competitive host provenance requires full CPU/governor/affinity/quiescence records,
with uniform `performance` governor for any absolute claim [whisper:114]; quality gating is mandatory
(the 2.99× row carries WER 0.025090, 7/279 edits, against `wer_max=0.100000`) [whisper:125].

Companion constraints from the family: tts perf ledger has a **CV≤5% admission gate** — its own headline
1.4–1.6× real-time number is excluded as uncertified ("no certified RTF row exists yet") [tts:112]; nlp
forbids "matched quantization" — its `int8-all` may be compared only against llama.cpp's approximate
peer Q8_0 class, a rule that makes the meet/beat gates "harder to pass, not easier" [nlp:145].

## 4. Refusal-to-claim patterns

- **[NO ADMISSIBLE RATIO] (tts).** Qwen's paper claims 97 ms first-packet latency; PERF-007 records it as
  [NO ADMISSIBLE RATIO] "because the paper measured on 'our internal vLLM engine' with no hardware
  named" [tts:131]. Its truth-pack goes further: "official CPU is not an admissible G2 performance
  incumbent and no CPU/GPU ratio may be reported" [tts:131].
- **Non-verdicts published, not buried (whisper).** Failed A/A-null campaign is published as
  "no admissible verdict" [whisper:9]; the Metal entry: NO ADMISSIBLE PERFORMANCE VERDICT
  [whisper:127]. "The reward-hacking doctrine is not decorative — it fires in public" [whisper:127].
- **Retracted entries kept in-tree (tts).** NE-006 is a retracted entry: "This entry was wrong, and the
  way it was wrong is the useful part" (a 622 MB cold embedding hid behind a one-axis census) — kept
  with the lesson rather than deleted [tts:130]. "The ledger retracts its own errors publicly" [tts:130].
- **Kills published with resurrection predicates.** FrankenMTP killed twice in-tree: NE-002 sampled
  drafter ~0.01 acceptance/depth ("strictly worse" than sequential, REVERT), NE-003 greedy drafter
  p_token = 0.0000 across 480 proposals (REVERT) [tts:60]; the ledger names the exact resurrection
  condition: "a drafter with measured mean per-depth acceptance above ~0.6" [tts:36]. NE-005 records
  the int4 route's two failed speed gates (0.04×, then 0.52× vs shipping int8) as an OPEN OBLIGATION with
  a pre-committed re-test predicate [tts:130].
- **Skip honesty (no-green-without-weights).** ocr's L0–L5 ladder has a skip-honest no-weights mode
  [ocr:9]; tts's skip-honesty doctrine is `summarize_receipts.py`, **XFAIL≠SKIP**, and a `require_model!`
  harness in `ftts-conformance`, verified in-tree [tts:128]. ocr's release finalizer "exits 1 until fresh
  CI artifacts and three trusted signers finalize it" — it refuses to claim the strict three-party
  OpenPGP certificate the process cannot produce [ocr:9].
- **Aspirational-aspirational labeling.** nlp's README carries zero measured numbers by written policy:
  "Every number below is a provisional gate, TARGETED rather than OBSERVED: no FrankenNLP performance
  number exists yet, because no kernel exists yet" [nlp:39]; the nine PG-0–PG-8 gates are all TARGETED
  [nlp:141].

## 5. Claim registry / evidence tiers / negative-evidence ledgers

- **Evidence tiers (program-wide vocabulary).** Packets use **[Verified]** (flavors: [Counted], [Git-observed],
  [Code-verified]; [CI-observed] is Tier 2 — attests the suite *runs*, not that it is green), **[Maintainer
  claim]**, **[External]**, **[Inference]** [ocr:3; whisper:3; tts:3; nlp:6].
- **Machine-checkable claim registry (nlp — the portable piece).** Inline evidence-state vocabulary
  `[OBSERVED@pin]`, `[REPORTED]`, `[EVIDENCED]`, `[PARTIAL]`, `[TARGETED]`, `[HYPOTHESIS]` [nlp:13];
  `fnlp-claim` annotations + `docs/CLAIMS.json` (6 claims, all `targeted`, zero evidence digests) + ledger
  schemas (`perf-ledger/v1`, `negative-evidence/v1`, `discrepancies/v1`) + `scripts/check_claims.py`
  [nlp:43]. The linter runs and *fails on the project's own tree* (`src/cli.rs:26`, unannotated wording)
  with exit 0 — "it observes, it does not gate" [nlp:177]. Portable four-file adoption: copy
  `docs/CLAIMS_ANNOTATIONS.md` + `docs/CLAIMS.json` + three ledger schemas + `check_claims.py` [nlp:259].
- **Negative-evidence ledgers.** whisper: 26,846 lines [whisper:9]; ocr: NEGATIVE_EVIDENCE.md (1,343 lines)
  alongside DISCREPANCIES.md (591) [ocr:130]; tts: NE entries with
  evidence IDs and do-not-retry predicates [tts:165]; nlp: NEGATIVE_EVIDENCE seeded with one
  pre-registered reserved entry, `NE-AVX2-RAW-VPMADDUBSW-001`, a "rejected by construction" entry —
  "not a recorded loss" [nlp:93]. tts tier-ceiling corrections: the 4–8× WASM-SIMD estimate rejected —
  "do not budget more than ~2×" [tts:130].
- **Discrepancy entries carry actionables.** tts DISC-001…006 each carry claim/evidence IDs, measured
  impacts, kill switches, and review dates; DISC-001 re-reviewed 2026-08-24 with next review 2026-09-30
  [tts:60].

## 6. Nondeterminism floors, break-even thresholds, listening-eval-shaped gaps

- **Nondeterminism floor is a committed file.** tts truth pack ships `NONDETERMINISM_FLOOR.md` [tts:127].
- **Pre-computed break-even thresholds before the experiment.** tts `ACCEPTANCE_SURFACE.json` carries the
  FrankenMTP thresholds: p\*≈94–95% per-depth and alpha_full\*≈40–46% [tts:206]; `FTTS_SPEC_PROBE`
  shadow-drafter instrumentation exists to measure against them [tts:36].
- **Numerics profiles as anti-lie construction (nlp).** The pinned HF implementation is "a bf16 program
  with explicit cast points" (RMSNorm reduces in f32, attention softmax in f32, RoPE tables in f32,
  logits exported f32) [nlp:113]. Four profiles: `hf-bf16-eager` (owns "matches HF" claims),
  `diagnostic-f32` (token flips vs bf16 are *named fixtures, not build failures*), `strict-quantized-vN`
  ("preregistered logit/argmax/token/task budgets — never inherited exactness"), `fast-vN`
  (opt-in approximations with measured quality bounds) [nlp:113]. Design forbids "the single most common
  ML-benchmark lie (comparing numbers across different numerical programs) by construction" [nlp:113].
- **Listening-eval-shaped gaps.** tts DISC-003: the default int8 route's sampled outputs are "different
  valid renditions"; "Contract-B listening with a real voice is OPEN" [tts:34] — including a measured
  side effect: one enrolled voice shifted whole-utterance RMS 0.019→0.221 and centroid 860→236 Hz
  ("audible LF drone risk") [tts:34]. Registered closure protocol proposed: fixed versioned
  utterance/voice matrix, blind A/B vs the f32 reference, pre-committed pass criteria, results published
  win-or-lose in the ledger [tts:34]. No other packet has a listening-shaped hole this well
  instrumented [tts:34]. Related: whisper's reference-fixture conformance claims WER 0.0000 on tiny.en
  — explicitly a *separate* claim from the campaign rows' WER figures [whisper:76]; tts's canonical gate
  (`FTTS_CANONICAL_NORM=1`) makes browser PCM match the CLI sample-for-sample (96,000/96,000, max 0 LSB)
  [tts:132].

## 7. Distilled start kit (synthesis)

Start a model project with: (1) a `docs/truth-pack/` holding upstream commit pin, weight HF revision,
`MANIFEST.sha256`, a nondeterminism floor, an acceptance surface with break-even thresholds, and a
fetch/verify script [tts:127]; (2) SHA-256 identity recording for every binary that participates in a
measurement, at invocation time — no un-recorded executable is admissible [whisper:114,127]; (3) a
result-class doctrine distinguishing SELF-SPEEDUP (internal only) from CAMPAIGN WIN (incumbent
in-the-room, A/A nulls in [0.98,1.02], quality gate), effective from day one [whisper:114]; (4) an
admission gate on the perf ledger (e.g. CV≤5%) that is allowed to reject the project's own headline
number [tts:112]; (5) a machine-checkable claim registry — evidence-state vocabulary + ledger schemas +
linter, ideally wired to block [nlp:43,45]; (6) a negative-evidence ledger where kills carry
resurrection predicates and retractions stay in-tree [tts:130,36]; (7) skip-honesty mechanics (XFAIL≠SKIP,
model-gated suites report skips honestly, no green without weights) [tts:128; ocr:9]; (8) a finalizer that
refuses to certify what the process cannot produce [ocr:9]; (9) write-time origin binding (source SHA256
stamped into the artifact header) moving toward hash-chained, recipe-bound provenance [ocr:225].
