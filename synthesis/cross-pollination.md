# Cross-Pollination: Transferable Concepts

Every entry: concept → origin → candidate adopters → expected payoff → concrete falsification experiment. Concepts are consolidated across the 44 briefs rather than copied from them. Tiers: [Verified], [CI-observed], [Maintainer claim], [External], [Inference] + High/Medium/Low.

## 1. Claim-to-proof registry with machine gates

- **Concept.** Every public claim bound to a machine-checkable key and a proof script; the registry refuses wording above its evidence grade, auto-demotes on digest mismatch, or fails CI on drift [Inference, High].
- **Origin.** franken_engine (matrix refuses wording whose `actual_wording_state` exceeds `allowed_state`, emits exact downgrade text [Verified, High]); frankengit (SHA-256-bound claims; "any mismatch is an automatic demotion, not a reviewer-overridable status transition" [Verified, High]); franken_markdown (`claims.tsv` + `check-claim-discipline.sh` [Verified, High]); franken_node (Ed25519-signed honesty manifest [Verified, High]).
- **Candidate adopters.** Every project with a README that currently outruns its CI: franken_manim, franken_ocr, frankenpandas, frankenscipy, franken_whisper, all four website repos [Inference, High].
- **Expected payoff.** Marketing drift becomes a CI failure instead of a review-cycle argument; claim downgrade is automatic and timestamped [Inference, High].
- **Falsification experiment.** Point franken_engine's matrix (or a minimal reimplementation) at one sibling repo for 60 days: it either blocks a real claim promotion (demonstrated value) or proves too coupled to generalize (falsified portability) [Inference, High].

## 2. Freshness decay on evidence

- **Concept.** Every claim carries `max_observed_freshness_days`; the gate auto-downgrades rows whose re-verification lags [Inference, High].
- **Origin.** franken_engine (per-claim freshness fields + `repro.lock` [Verified, High]).
- **Candidate adopters.** franken_networkx (green 13 days pre-pin at last check), franken_nlp (stale DSR evidence), frankenredis (fmt-gate failure vs green prose), any "last verified" statement in the corpus [Inference, High].
- **Expected payoff.** "Verified" claims cannot silently age into stale ones; staleness is typed and visible [Inference, High].
- **Falsification experiment.** Add a freshness column to one sibling's claims registry with a 30-day ceiling: if it surfaces ≥1 claim the project believed was current but wasn't, the gate has teeth; if zero surface and a blind audit confirms the flagged claims were already fresh, the ceiling adds bookkeeping without catching drift — falsified as overhead [Inference, High].

## 3. Negative-evidence ledger with required entry classes

- **Concept.** A ledger where rejections, retractions, and failed optimizations are first-class rows with mandatory classes — including retry conditions, so rejection is a paused hypothesis, not a dead one [Inference, High].
- **Origin.** frankengit (34-row registry, 13 required entry classes: overclaim_correction, non_reproducible_result [Verified, High]); franken_numpy (67,641-line ledger, largest counted [Verified, High]); frankensqlite (perf-negative-results.md with retry conditions [Verified, High]); franken_tts (NE-002/NE-003 killing the flagship optimizer twice [Verified, High]).
- **Candidate adopters.** franken_whisper, franken_overlap, frankenterm, frankensympy — all do negative evidence informally [Inference, High].
- **Expected payoff.** Failed optimizations stop being re-run by future agents; reviewers can see what was tried and killed [Inference, High].
- **Falsification experiment.** Require one sibling project to log its next 10 rejected experiments with retry conditions: either a future session avoids re-running ≥1 of them (value), or the ledger is never consulted (falsified as ritual) [Inference, High].

## 4. Anti-extrapolation rule

- **Concept.** A baseline that exceeds the compute budget is recorded as `incomplete`, never extrapolated into a comparison [Inference, High].
- **Origin.** franken_overlap [Verified, High].
- **Candidate adopters.** franken_ocr, franken_tts, franken_whisper — anywhere an official incumbent cannot be run [Inference, High].
- **Expected payoff.** "N/A" rows stay honest; benchmark tables carry no ratio computed against a non-run baseline [Inference, High].
- **Falsification experiment.** Require one sibling to adopt the rule for 90 days: if the rule blocks ≥1 extrapolated ratio, it caught a live hole; if zero blocks occur and an independent audit finds ≥1 extrapolated ratio the rule missed, the rule is decorative — falsified [Inference, High].

## 5. Committed statistical baseline gate

- **Concept.** Benchmark regression as a signed, waiver-free gate: per-row environment tagging, layout-hyperparameter capture, and drift detection that demonstrably fires [Inference, High].
- **Origin.** asupersync (`methodology_baselines` signoff + 105-row `artifacts/baseline.json`; gate demonstrably fired 2026-09-07 on drifted artifacts [CI-observed, High]).
- **Candidate adopters.** frankenredis, frankenpandas, frankenscipy [Inference, High].
- **Expected payoff.** Environment drift (new runner, new toolchain) cannot silently rebase "improvements"; the drift gate fires first [Inference, High].
- **Falsification experiment.** Replay one sibling's last benchmark comparison with environment tagging added: if any historical "win" reclassifies as environment drift, the gate caught a live confound; if zero historical wins reclassify, run a control: inject a known environment drift (runner swap, toolchain bump); if the gate does not fire on the injected drift, the drift detection is decorative — falsified as a control [Inference, High].

## 6. Per-optimization PROOF.md bundles

- **Concept.** Every accepted optimization ships a bundle: SHA-pinned golden transcript + paired/reversed runs + keep/reject score gate [Inference, High].
- **Origin.** frankenredis (the program's optimization-evidence template [Verified, High]).
- **Candidate adopters.** frankenjax — whose per-optimization entries with agent attribution, same-worker/same-binary criterion rows with CIs, and explicit rejections already exist (catalog §29 [Verified, High]); the transfer is the bundle *format* — a SHA-pinned golden transcript as a replayable artifact, the paired/reversed run design, and the keep/reject score gate packaged as one reviewable unit — plus frankenredis's own future work, frankentorch, frankensqlite [Inference, High].
- **Expected payoff.** Optimizations become reviewable artifacts with kill criteria, not commit messages [Inference, High].
- **Falsification experiment.** Require one sibling's next 5 accepted optimizations to ship bundles: either ≥1 optimization is rejected at the bundle stage (gate value), or all pass — and a blind re-review agrees (no gate value — falsified as a control) [Inference, High].

## 7. Measurement-integrity four-rule gate

- **Concept.** Name the worker, name the harness, quote both estimators, replicate before quoting. Partial overlap: frankenpandas already enforces the cross-worker rule ("A/B comparisons across different workers are invalid") via its quantified build-variance rule (catalog §32 [Verified, High]); the transfer adds the remaining three rules — name the harness, quote both estimators, replicate before quoting [Inference, High].
- **Origin.** frankentorch (the brief's verdict: "genuinely lacking everywhere else" — its most exportable measurement-culture mechanism [Inference, High]).
- **Candidate adopters.** Every benchmarking project in the corpus (frankenredis, frankenpandas, franken_whisper, franken_ocr, franken_tts, frankenscipy) [Inference, High].
- **Expected payoff.** Numbers arrive with their full provenance or don't arrive at all; cross-worker comparisons die on sight [Inference, High].
- **Falsification experiment.** Apply the four rules retroactively to one sibling's published ratios: if ≥1 ratio loses a rule's provenance and re-grades to [NO ADMISSIBLE RATIO], the gate has teeth; if zero lose provenance and a spot re-measurement under the rules confirms the ratios, the project was already compliant — the gate adds nothing there, falsified [Inference, High].

## 8. Result-class doctrine for performance verdicts

- **Concept.** Typed verdicts: SELF-SPEEDUP is maintenance, never a campaign win; a CAMPAIGN WIN requires the actual incumbent binary side-by-side in the same invocation with A/A nulls in [0.98, 1.02] [Inference, High].
- **Origin.** franken_whisper (PERF_LEDGER [Verified, High]); franken_networkx (INCUMBENT-vs-SELF-SPEEDUP contract [Verified, High]).
- **Candidate adopters.** franken_ocr, franken_tts, franken_nlp, frankenredis [Inference, High].
- **Expected payoff.** "Faster" claims carry their class; self-speedups can't be promoted into campaign wins [Inference, High].
- **Falsification experiment.** Reclassify one sibling's headline ratios under the doctrine: if ≥1 claimed win demotes to SELF-SPEEDUP, the doctrine caught promotion drift; if zero demote, the doctrine is a re-labeling exercise for that project — falsified as a new control [Inference, High].

## 9. Structured skip honesty

- **Concept.** Runs that cannot execute honestly emit a typed skip event instead of silently passing; the absence of the oracle is itself a gate failure [Inference, High].
- **Origin.** franken_snowflake (credential-less runs emit `franken_snowflake.live_gate.v1` skip events [Verified, High]); frankenscipy (CI control job fails if the live SciPy oracle is absent [Verified, High]); franken_tts (XFAIL≠SKIP, GREEN WITH SKIPS [Verified, High]).
- **Candidate adopters.** Every project with optional live dependencies: franken_nlp (HF access), franken_ocr (model weights), frankensim's DSR lanes [Inference, High].
- **Expected payoff.** "Green with skips" is a distinguishable state from "green"; skip events are distinguishable from passes in CI output and release notes [Inference, High].
- **Falsification experiment.** Convert one sibling's silent skips to typed skip events for one release cycle: if any event reveals a lane that never ran in production, the honesty was load-bearing; if all lanes ran and the project's docs already distinguished skips from passes, the conversion adds ceremony without information — falsified [Inference, High].

## 10. Maturity vocabulary + dated maturity registry

- **Concept.** A five-label vocabulary (source-present → reference-implemented → publicly-invokable → locally-qualified → production-admitted) with "no lower label implies a higher one," plus a dated capability registry (L1–L5) [Inference, High].
- **Origin.** franken_drone_geometry_reconstruction (vocabulary [Verified, High]); frankensim (15-entry L1–L5 registry: L1=3, L2=11, L3=1, L4=0, L5=0 [Maintainer claim, High]).
- **Candidate adopters.** franken_remote, franken_surveillance_system, franken_native_capsule — capability-rich, validation-poor projects [Inference, High].
- **Expected payoff.** "It exists" stops meaning "it works"; the maturity distribution itself is publishable [Inference, Medium].
- **Falsification experiment.** Label one sibling's capabilities under the vocabulary: if any capability the README treats as mature lands below "publicly-invokable," the vocabulary caught drift; if none do, the vocabulary is a re-labeling of an already-calibrated README — falsified as a new control [Inference, High].

## 11. Evidence-color / no-laundering composition algebra

- **Concept.** Measurement evidence carries typed colors; composition rules prevent weak evidence from being laundered into strong claims [Inference, High].
- **Origin.** frankensim (`fs-evidence`: "evidence color"/"no-launder" in no other packet [Maintainer claim, High]).
- **Candidate adopters.** frankenpandas (359-lane aggregation), franken_networkx (multi-ledger verdicts), frankenterm (attestation bundles) [Inference, High].
- **Expected payoff.** Aggregated verdicts can't inherit the strongest color of their components; the weakest link is visible [Inference, Medium].
- **Falsification experiment.** Re-color ≥3 of one sibling's aggregate verdicts under the algebra: if any aggregate's color weakens, the algebra caught laundering; if all stay unchanged, the algebra restates existing practice — falsified as a new control [Inference, High].

## 12. Receipt-bound remote execution

- **Concept.** Per-batch receipts binding source hashes, job id, and raw logs; failed attempts retained; code landing after the last executed gate opens a self-disqualification ledger [Inference, High].
- **Origin.** franken_alignment (dispatch + receipts + self-disqualification rule [Verified, High]).
- **Candidate adopters.** frankenjax — the genuine RCH-dependent case (zero GHA workflows; all green claims execute on the maintainer's RCH fleet, attested only by checked-in artifact JSON [Verified, High]); franken_node — with the distinction that node already has a hash-chained decision-receipt lineage (catalog §16 [Verified, High]), so the transfer is the self-disqualification rule for post-gate code and retention of failed attempts, not receipts per se [Inference, High].
- **Expected payoff.** "It ran on the private runner" becomes a checkable receipt instead of a prose claim; post-gate code is explicitly disqualified, not silently trusted [Inference, High].
- **Falsification experiment.** Require frankenjax to retain and publish its next 10 batch receipts with source-hash binding: if any receipt contradicts the prose claim it supports, the binding caught drift; if all agree, trust is receipted but untested — and if a receipt can be regenerated post-hoc with altered hashes without detection, the binding is decorative: falsified [Inference, High].

## 13. Full-funnel verdict aggregation with selection pressure stated

- **Concept.** Aggregate every measured lane into typed verdicts (FASTER / SLOWER / NULL_UNDECIDABLE / DROPPED_HIGH_CV / PARITY) with the decidable-subset statistic and its selection pressure stated in the ledger itself [Inference, High].
- **Origin.** frankenpandas (359 lanes → 201/20/74/62/2 [Verified, High]); row 112 retracting its own 1.20x win as build variance in the same row [Verified, High].
- **Candidate adopters.** frankenredis, frankenscipy, franken_whisper [Inference, High].
- **Expected payoff.** "201 faster" can't be quoted without "62 dropped for high CV"; the funnel is the number [Inference, High].
- **Falsification experiment.** Re-aggregate one sibling's benchmark history as a full funnel: if the decidable-subset statistic changes the headline, the funnel was load-bearing; if the headline is unchanged and the project already disclosed its dropped lanes, the funnel restates existing disclosure — falsified as a new control [Inference, High].

## 14. Adversarial self-audit of the evidence machinery

- **Concept.** The evidence gate itself gets audited adversarially — planted defects, fails-open harness hunts, the six named failure modes of honesty culture [Inference, High].
- **Origin.** franken_alignment (planted-mutation testing: deliberately introduced defects must fail after controls pass [Verified, High]); frankensympy (caught and remediated its own fails-open harness [Verified, High]); franken_code_browser (six named defects: demo hardcoding, proof laundering, refusal farming, commit pumping, gate self-weakening, follow-up laundering [Verified, High]).
- **Candidate adopters.** Every project with a claims gate: franken_engine, frankengit, franken_networkx, frankensim [Inference, High].
- **Expected payoff.** Gates get tested against adversaries, not just against the happy path; a gate that can't catch a planted defect is known to be decorative [Inference, High].
- **Falsification experiment.** Plant 3 defects in one sibling's gate (a laundered claim, a weakened gate, a pumped commit) and see if the gate catches them: caught ≥2 means the gate is adversarially sound; caught 1 means partial soundness — inconclusive, re-run with a fresh defect set before judging; caught 0 means the gate is theater — falsified [Inference, High].

---

*Scope note.* Several strong mechanisms were **declined** as cross-pollination entries because they are product-specific, not transferable: franken_threed's 256-topology Wasm oracle gate (tied to marching cubes), franken_native_capsule's `/proc/self/maps` checks (tied to a 39-byte machine-code worker), frankenmermaid's canary state machine (tied to a rollout), frankenlibc's LD_PRELOAD ABI work, frankengraphdb's fgdb-sim fault injection. They are catalogued in `uniqueness-catalog.md` but do not generalize. [Inference, High]
