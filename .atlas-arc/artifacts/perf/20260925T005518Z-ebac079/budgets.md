# REQ-O2 budget verdicts: .

Primary keystroke metric = `key2layout`: `keydown.timeStamp` to results rendered with style and layout forced (paint recording, raster and compositing excluded; see trace-summary-browser-*.json for their cost). `key2paint` = to the first task after the next animation frame (headless frame scheduling included; see frame-cadence.json). Percentiles are nearest-rank over all measured keystrokes of 20 runs (1 warm-up run discarded).

## desktop (keystroke budget p95 <= 8 ms, p99 <= 2x p95; usable <= 300 ms after DOMContentLoaded; no long task > 50 ms while typing)

| Cand | samples | key2layout p50 / p95 / p99 / p99.9 / max (ms) | p95 budget | p99 <= 2x p95 | key2paint p95 | usable after DCL p95 (ms) | usable budget | long tasks > 50 ms typing (max) | full index ready p95 (ms) | index heap (MB) | envelope (p95 drift) |
|---|---:|---|---|---|---:|---:|---|---|---:|---:|---|
| A | 23300 | 1.60 / 5.00 / 16.30 / 56.10 / 168.50 | PASS | **FAIL** (3.26x) | 10.20 | 88.30 | PASS | **FAIL** 26 (185.00) | 145.60 | 4.96 | ESCALATE 518.6% |
| B | 23300 | 2.30 / 9.50 / 44.80 / 84.20 / 191.20 | **FAIL** | **FAIL** (4.72x) | 15.60 | 179.30 | PASS | **FAIL** 11 (158.00) | 203.30 | 5.24 (main+worker) | ESCALATE 188.8% |
| C | 23300 | 2.30 / 16.10 / 35.40 / 91.80 / 180.80 | **FAIL** | **FAIL** (2.20x) | 22.10 | 99.60 | PASS | **FAIL** 111 (174.00) | 326.40 | 9.96 | ESCALATE 218.6% |
| I1 | 23300 | 0.80 / 3.00 / 9.70 / 41.90 / 133.30 | PASS | **FAIL** (3.23x) | 7.00 | 86.00 | PASS | **FAIL** 7 (143.00) | 86.20 | 0.83 | ESCALATE 218.5% |
| I0 | 23300 | 0.50 / 1.90 / 5.50 / 24.10 / 213.60 | PASS | **FAIL** (2.89x) | 5.10 | 83.00 | PASS | **FAIL** 1 (71.00) | 83.10 | 0.03 | ESCALATE 164.7% |

Steady state (post-hoc, quiet passes only; criterion in contention.json: pass inputDelay p95 <= 2x the lowest pass). Pooled all-run numbers above stay the primary verdict.

| Cand | quiet passes | key2layout p50 / p95 / p99 / max (ms) | p95 budget | p99 <= 2x p95 | work p95 (search+render+layout) | long tasks > 50 ms in quiet passes (max ms) |
|---|---:|---|---|---|---:|---|
| A | 13/20 | 1.50 / 4.10 / 7.50 / 168.50 | PASS | PASS (1.83x) | 2.90 | **FAIL** 6 (185.00) |
| B | 10/20 | 2.10 / 6.20 / 40.30 / 191.20 | PASS | **FAIL** (6.50x) | 4.50 | PASS 0 (0.00) |
| C | 10/20 | 2.10 / 13.10 / 22.00 / 93.80 | **FAIL** | PASS (1.68x) | 11.90 | **FAIL** 14 (99.00) |
| I1 | 10/20 | 0.80 / 2.30 / 3.70 / 27.00 | PASS | PASS (1.61x) | 1.20 | PASS 0 (0.00) |
| I0 | 12/20 | 0.40 / 1.40 / 3.30 / 54.30 | PASS | **FAIL** (2.36x) | 0.20 | PASS 0 (0.00) |

## phone (keystroke budget p95 <= 16 ms, p99 <= 2x p95; usable <= 1000 ms after DOMContentLoaded; no long task > 50 ms while typing)

| Cand | samples | key2layout p50 / p95 / p99 / p99.9 / max (ms) | p95 budget | p99 <= 2x p95 | key2paint p95 | usable after DCL p95 (ms) | usable budget | long tasks > 50 ms typing (max) | full index ready p95 (ms) | index heap (MB) | envelope (p95 drift) |
|---|---:|---|---|---|---:|---:|---|---|---:|---:|---|
| A | 23300 | 8.50 / 55.80 / 118.50 / 204.10 / 334.20 | **FAIL** | **FAIL** (2.12x) | 101.80 | 521.10 | PASS | **FAIL** 1664 (378.00) | 1383.80 | 4.96 | ESCALATE 361.2% |
| B | 23300 | 13.50 / 110.80 / 208.00 / 370.70 / 689.30 | **FAIL** | PASS (1.88x) | 156.40 | 1559.60 | **FAIL** | **FAIL** 2091 (455.00) | 2494.50 | 5.24 (main+worker) | ESCALATE 397.8% |
| B, worker scaled x4 [INFERENCE] | 23300 | 15.50 / 113.50 / 209.40 / 371.00 / 690.80 | **FAIL** | PASS (1.84x) | | 1585.10 | **FAIL** | | | | CDP cannot throttle workers |
| C | 23300 | 11.10 / 91.50 / 171.90 / 362.40 / 928.60 | **FAIL** | PASS (1.88x) | 121.00 | 853.40 | PASS | **FAIL** 3206 (909.00) | 2512.60 | 9.97 | ESCALATE 135% |
| I1 | 23300 | 4.70 / 33.00 / 96.20 / 216.80 / 367.30 | **FAIL** | **FAIL** (2.92x) | 78.20 | 626.50 | PASS | **FAIL** 1008 (338.00) | 626.60 | 0.83 | ESCALATE 558% |
| I0 | 23300 | 3.10 / 21.10 / 62.60 / 129.10 / 279.50 | **FAIL** | **FAIL** (2.97x) | 63.00 | 326.70 | PASS | **FAIL** 597 (265.00) | 330.00 | 0.03 | ESCALATE 463% |

Steady state (post-hoc, quiet passes only; criterion in contention.json: pass inputDelay p95 <= 2x the lowest pass). Pooled all-run numbers above stay the primary verdict.

| Cand | quiet passes | key2layout p50 / p95 / p99 / max (ms) | p95 budget | p99 <= 2x p95 | work p95 (search+render+layout) | long tasks > 50 ms in quiet passes (max ms) |
|---|---:|---|---|---|---:|---|
| A | 8/20 | 7.70 / 18.00 / 28.20 / 134.60 | **FAIL** | PASS (1.57x) | 13.50 | **FAIL** 31 (98.00) |
| B | 5/20 | 10.30 / 19.90 / 50.30 / 136.50 | **FAIL** | **FAIL** (2.53x) | 15.10 | **FAIL** 5 (90.00) |
| B, worker scaled x4 [INFERENCE] | 5/20 | 11.80 / 22.90 / 51.40 / 138.60 | **FAIL** | **FAIL** (2.24x) | 15.10 | **FAIL** 5 (90.00) |
| C | 6/20 | 9.40 / 59.10 / 93.70 / 251.50 | **FAIL** | PASS (1.59x) | 55.00 | **FAIL** 461 (231.00) |
| I1 | 8/20 | 4.20 / 11.10 / 22.30 / 137.00 | PASS | **FAIL** (2.01x) | 6.20 | **FAIL** 31 (171.00) |
| I0 | 7/20 | 2.60 / 5.90 / 10.10 / 71.30 | PASS | PASS (1.71x) | 1.90 | **FAIL** 1 (64.00) |

## Payload (brotli q11; budget core <= 150 KB, full <= 1.5 MB; quotes shard reported separately per DEC-009)

| Cand | core shard | core budget | full index | full budget | quotes shard (lazy, stored only) | full + quotes | full + quotes budget |
|---|---:|---|---:|---|---:|---:|---|
| A | 102.0 KB | PASS | 444.4 KB | PASS | 124.6 KB | 569.0 KB | PASS |
| B | 102.0 KB | PASS | 444.4 KB | PASS | 124.6 KB | 569.0 KB | PASS |
| C | 104.9 KB | PASS | 441.9 KB | PASS | 124.6 KB | 566.5 KB | PASS |
| I1 | none (single shard) | n/a | 61.8 KB | PASS | not loaded |  |  |
| I0 | 0.7 KB | PASS | none | n/a | not loaded |  |  |
| A, quotes indexed (variant) | | | 484.4 KB | PASS | (quotes still needed for display) | 609.0 KB | PASS |

## Engine-only, Node 22 desktop (ms per query; 1,165 queries x 20 runs, 3 warm-up runs discarded)

| Candidate | p50 | p95 | p99 | p99.9 | max | CV | envelope |
|---|---:|---:|---:|---:|---:|---:|---|
| A-full | 0.12 | 2.39 | 3.09 | 4.46 | 13.79 | 1.53 | NOISE 8.5% |
| A-core | 0.02 | 0.46 | 0.65 | 2.20 | 5.52 | 1.92 | ESCALATE 28.4% |
| A-full-qidx | 0.13 | 2.50 | 3.46 | 12.62 | 44.62 | 2.03 | ESCALATE 113.3% |
| C-full | 0.51 | 16.03 | 27.75 | 41.73 | 125.36 | 1.97 | ESCALATE 22.8% |
| C-core | 0.11 | 2.94 | 5.32 | 13.22 | 85.56 | 2.37 | ESCALATE 47.7% |
| C-full-fuzzy | 1.34 | 17.40 | 29.17 | 52.61 | 105.36 | 1.67 | INVESTIGATE 19.8% |
| I1-full | 0.17 | 0.38 | 0.83 | 1.86 | 5.64 | 0.83 | INVESTIGATE 11.4% |
| I0-44 | 0.00 | 0.00 | 0.01 | 0.03 | 2.02 | 10.66 | ESCALATE 28% |
| B-full-worker | 0.26 | 2.78 | 4.85 | 15.84 | 35.63 | 1.73 | ESCALATE 163.2% |

## Hydrate + first answer and retained heap, Node 22 (20 runs)

| Candidate | hydrate+first p50 (ms) | p95 (ms) | retained heap (MB) |
|---|---:|---:|---:|
| A-full | 15.77 | 17.77 | 12.81 |
| A-core | 3.76 | 4.28 | 2.96 |
| A-full-qidx | 16.63 | 17.74 | 13.70 |
| C-full | 121.71 | 355.86 | 23.20 |
| C-core | 22.63 | 37.02 | 6.40 |
| C-full-fuzzy | 102.96 | 293.10 | 23.20 |
| I1-full | 2.67 | 3.02 | 2.22 |
| I0-44 | 0.08 | 0.10 | 0.01 |

