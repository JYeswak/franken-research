# Search performance probe: 20260925T005518Z-ebac079

**Recommendation: build candidate A**, the hand-written inverted index, and run it on the main thread. It is the only BM25 candidate that meets the desktop keystroke budget. It is also closest to the phone budget: 18.0 ms quiet-pass p95 against a budget of 16 ms. Two levers that the profiles rank at the top of engine time should close that gap; that is an [INFERENCE], not a measurement.
- Drop B (A in a worker). The message round trip made typing slower, and loading the worker failed the phone budget.
- Drop C (MiniSearch). It is 6.7x slower than A per query (Node p95), 7.7x (p50) to 20x (p95) slower to hydrate, and uses twice the heap.

- Run on 2026-09-24/25, on an Apple M3 Ultra with macOS 26.5, Node 22.23.3 and Chrome 154, at git `ebac079` (`fingerprint.json`).
- The corpus has 3,855 entries built from real sources, and the query set has 1,165 keystroke queries. Candidates, metrics and the apples-to-apples matrix are in `DEFINE.md`.
- Reproduce with `probes/search-perf/run.sh [RUN_ID]`. This run took 7,758 s end to end: the desktop E2E phase 1,020 s and the phone E2E phase 5,362 s.

## Verdicts per budget (REQ-O2)
**Pooled** means all 20 runs, 23,300 keystrokes, and is the primary verdict. **Quiet** means only the passes whose input-delay p95 was at most 2x the lowest pass. It is post-hoc (`contention.json`), because other agent sessions shared the host. The full tables, including p99.9, max and key2paint, are in `budgets.md`.

| Budget | A | B | C | I1 (naive scan) | I0 (shipped, 44 names) |
|---|---|---|---|---|---|
| desktop key p95 <= 8 ms, pooled / quiet | PASS 5.0 / PASS 4.1 | FAIL 9.5 / PASS 6.2 | FAIL 16.1 / FAIL 13.1 | PASS 3.0 / PASS 2.3 | PASS 1.9 / PASS 1.4 |
| desktop p99 <= 2x p95, pooled / quiet | FAIL 16.3 / PASS 7.5 | FAIL / FAIL 40.3 | FAIL / PASS | FAIL / PASS | FAIL / FAIL |
| phone key p95 <= 16 ms, pooled / quiet | FAIL 55.8 / FAIL 18.0 | FAIL 110.8 / FAIL 19.9 (22.9 worker-scaled [INFERENCE]) | FAIL 91.5 / FAIL 59.1 | FAIL 33.0 / PASS 11.1 | FAIL 21.1 / PASS 5.9 |
| phone p99 <= 2x p95, pooled / quiet | FAIL / PASS 28.2 | PASS / FAIL | PASS / PASS | FAIL / FAIL | FAIL / PASS |
| usable after DCL, desktop <= 300 / phone <= 1,000 ms (p95) | PASS 88 / PASS 521 | PASS 179 / **FAIL 1,560** | PASS 100 / PASS 853 | PASS 86 / PASS 627 | PASS 83 / PASS 327 |
| core shard <= 150 KB brotli | PASS 102.0 KB | PASS 102.0 KB | PASS 104.9 KB | n/a, single 61.8 KB shard | PASS 0.7 KB |
| full index <= 1.5 MB brotli | PASS 444.4 KB (569.0 KB with the quotes shard, 124.6 KB) | same as A | PASS 441.9 KB | PASS | n/a |
| no long task > 50 ms while typing, desktop / phone (pooled count) | FAIL 26 / FAIL 1,664 | FAIL 11 / FAIL 2,091 | FAIL 111 / FAIL 3,206 | FAIL 7 / FAIL 1,008 | FAIL 1 / FAIL 597 |

How to read the long-task row:
- I0 does almost no work, and it fails too, so most pooled long tasks come from the host (H12).
- In clean diagnostic passes A had 0 long tasks on desktop but 10 on the phone, against 0 for B and 0 for I0 (`longtasks-browser-*.json`). A's phone long tasks are real: a cold JIT on the first keystrokes, GC pauses up to 51 ms, and frame work (H7, H13, H16).

Heap after hydrate (MiB, against a control page with no index): A 4.96, B 0.70 on the main thread plus 4.54 in the worker, C 9.96.

Engine-only in Node (desktop), A-full per query: p50 0.12, p95 2.39, p99 3.09, p99.9 4.46, max 13.8 ms. Its variance envelope is NOISE at 9.0% (`variance-envelope.txt`, the skill's script).

Metric caveat: headless Chrome frame scheduling on this host is erratic (`frame-cadence.json`). The primary metric therefore stops at forced layout. Painting adds a further p95 of 13.1 ms on the phone (`contention.json` toFrame).

## Hotspots and hypotheses
See `hotspot_table.md` (ranked, every row cited), `hypothesis.md` (16 entries) and `scaling_law.md`.
- Ranking every candidate with a full sort, plus one object per candidate, is 53 to 60% of A's engine time across three methods.
- Scoring, with a `Map` and idf recomputed per posting, is 33 to 39%.
- Cost follows candidates per query, a mean of 927, and grows superlinearly with corpus size.

## Hand-off to extreme-software-optimization (Impact x Confidence / Effort, 1 to 5 scales; threshold 2.0)
| Lever | Target | I | C | E | Score | Evidence | Golden risk |
|---|---|---:|---:|---:|---:|---|---|
| L1 | Bounded top-10 selection instead of Array.from plus a full sort. Keep (score desc, doc asc) as the tie order. | 5 | 5 | 2 | 12.5 | H1, hotspot 4a | low; `bench-node.mjs verify-golden` |
| L2 | Dense typed-array score and mask accumulators indexed by doc; idf hoisted per term and field. | 4 | 4 | 2 | 8.0 | H2, hotspot 4b | low if the order of additions is kept |
| L3 | Cheaper layout of the results list: CSS containment, fixed row height, reused nodes. | 3 | 2 | 1 | 6.0 | hotspot 3 (phone layout p95 6.1 ms) | none |
| L4 | Warm the JIT with a few queries after the core hydrate. | 2 | 3 | 1 | 6.0 | H7, hotspot 7 | none |
| L5 | Control candidate explosion: minimum prefix length before expansion, and handling of common words. | 4 | 3 | 2 | 6.0 | H4, `scaling_law.md` | **high**: changes results; needs a REQ-O1 golden-set decision first |
| L6 | Get the full-index hydrate off the main-thread critical path: a binary format, or a chunked or idle-time hydrate. | 3 | 4 | 3 | 4.0 | H16, hotspot 8 | none |
| L7 | If a worker is ever used: bundle its module graph. | 2 | 2 | 2 | 2.0 | H8 | none |

Apply one lever per run. Check each with `node probes/search-perf/bench-node.mjs verify-golden <run-dir> <run-dir>/queries.json`. That check exits 1 on any top-3 change; it was verified against two planted breaks and passed again after restore (`golden-check-plants.txt`). Golden sha256 is in `golden_checksums.txt`.

## Deviations from the brief
- **No puppeteer.** puppeteer-core is not installed in `franken-research/node_modules`. The harness uses raw CDP over Node 22's WebSocket, as `site/scripts/make-og.mjs` does. No dependency was added.
- **Worker throttling.** CDP refuses CPU throttling (`Operation is only supported for pages, not workers`) and network emulation (`Not supported`) on dedicated workers (`worker_cpu_throttle` in `baseline-browser-phone-B.json`). B's phone typing is therefore reported both as measured and with the worker's search time scaled by 4 [INFERENCE]. The phone load times for B (usable p50 1,303 ms) are consistent with throttled worker fetches, but that was not checked per request (H8).
- **Corpus size.** The corpus has 3,855 entries, not about 4,000; the source counts are in `corpus-summary.json`. The rigor-atlas evidence quotes, 3,700 items, sit in a separate lazily loaded shard (DEC-009). That shard is never in the core and never indexed, except in the measured `a-full-qidx` variant.
- **Post-run steps.** After the timing runs these were added and run: the long-task diagnostic, `contention.json`, the hotspot JSONL, `verify-golden`, and the path scrub. `run.sh` now runs them in order. Separately, the `baseline-*.json` raw arrays were rewritten on one line (`lib/artifact-json.mjs`). A deep-equality check against the original parse passed (19 files, 17.0 MB to 7.3 MB), and `contention.json` and `budgets.md` regenerate byte-identical.

## Residuals: what this run does not show
- Phone verdicts from an idle host. The pooled phone numbers are contention-bound (H12). Rerun `run.sh` when the load average is low; `contention.json` is the sentinel.
- Real phones (U10). Only headless Chrome with a 4x throttle was measured.
- Per-request timing of B's worker module waterfall (H8). The cause is an inference.
- Relevance: agreement is A vs C only. Identical top-3 order on 76.2% of queries, top-3 overlap 95.6% (`golden-agreement-A-vs-C.json`). REQ-O1 was not evaluated. 17 typo queries return nothing in A, which has no fuzzy matching.
- The effect of any optimization lever. None was applied.
- Not run at all: site/ integration, gates, a binary index format, cold OS cache, and CPU pinning (macOS has none; no OS tuning was applied or needed).
