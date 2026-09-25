# Scaling law: 20260925T005518Z-ebac079

Source: `scaling-node.json`, produced by `bench-node.mjs scale`. Engine-only, Node 22.23.3, Apple M3 Ultra, measured 2026-09-24/25. Each point is 5 runs x 1,165 queries after 2 warm-up passes, in ms per query.

## Corpus-size axis
Below 1x the corpus is every k-th document. Above 1x it is replicated with suffixed ids. Replication grows postings and candidates per query, but the vocabulary stays the same.

| Engine | Factor | Docs | p50 | p95 | p99 | max | p95 vs 1x |
|---|---:|---:|---:|---:|---:|---:|---:|
| A | 0.25x | 964 | 0.030 | 0.541 | 0.706 | 2.88 | 0.21x |
| A | 0.5x | 1,928 | 0.060 | 1.100 | 1.438 | 5.56 | 0.42x |
| A | 1x | 3,855 | 0.134 | 2.638 | 8.106 | 40.5 | 1x |
| A | 2x | 7,710 | 0.302 | 6.625 | 15.85 | 79.2 | 2.51x |
| A | 4x | 15,420 | 0.638 | 13.89 | 25.26 | 98.6 | 5.27x |
| C | 0.25x | 964 | 0.127 | 4.638 | 10.64 | 115.4 | 0.23x |
| C | 0.5x | 1,928 | 0.277 | 10.42 | 27.45 | 128.1 | 0.51x |
| C | 1x | 3,855 | 0.560 | 20.43 | 36.64 | 139.9 | 1x |
| C | 2x | 7,710 | 1.405 | 48.92 | 89.67 | 397.4 | 2.39x |
| C | 4x | 15,420 | 3.476 | 112.1 | 218.0 | 932.1 | 5.49x |

**Verdict:** roughly linear up to 1x, then superlinear: 2.4x to 2.5x at double size and 5.3x to 5.5x at four times. This matches sorting every candidate (n log n) plus a growing heap for GC. It points at partial top-k selection before any v2 corpus growth.

Caveats:
- The 1x point here (A p95 2.64 ms) sits 10% above the 20-run baseline (2.39 ms, `bench-node-summary.json`). Its p99 of 8.1 ms against 3.09 ms reflects GC pressure from building ten indexes in one process.
- Read the shape from this table, and the absolute numbers from `baseline-node-*.json`.

## Query-length axis (from the 20-run baseline raw samples)
| Engine | Bucket | n | p50 | p95 | p99 |
|---|---|---:|---:|---:|---:|
| A-full | 1 char | 780 | 1.856 | 3.118 | 3.895 |
| A-full | 2 chars | 780 | 0.388 | 1.525 | 2.091 |
| A-full | 3 chars | 780 | 0.076 | 0.853 | 2.259 |
| A-full | 4-6 chars | 2,340 | 0.049 | 1.750 | 2.934 |
| A-full | 7-12 chars | 4,600 | 0.099 | 2.338 | 3.093 |
| A-full | 13+ chars | 9,820 | 0.165 | 2.348 | 3.025 |
| A-full | typo variants | 4,200 | 0.081 | 2.190 | 2.984 |
| C-full | 1 char | 780 | 10.92 | 28.04 | 39.56 |
| C-full | 13+ chars | 9,820 | 0.719 | 16.50 | 28.74 |
| I1-full | 1 char | 780 | 0.671 | 1.011 | 1.784 |
| I1-full | 13+ chars | 9,820 | 0.146 | 0.247 | 0.324 |

**Verdict:** the tail does not come only from 1-char prefixes. From 4 characters on, p95 climbs back to about 2.3 ms because phrases contain common words ("with", "for", "of", "a") and each new word's prefix is expanded. The costly quantity is candidates per query (H4), not keystroke count. The C rows for the middle buckets, and the other I1 buckets, are in `scaling-node.json`.
