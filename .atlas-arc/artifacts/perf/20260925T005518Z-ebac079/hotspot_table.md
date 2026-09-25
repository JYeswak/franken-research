# Hotspot table: 20260925T005518Z-ebac079

Scope: candidate A, the recommended engine, on the phone profile, which is the binding one. The desktop engine-only numbers come from Node 22 on the same host.

Units:
- Phone rows are per keystroke. They cover the 8 quiet passes (9,320 keystrokes). A pass is quiet when its input-delay p95 is at most 2x the lowest pass; see `contention.json`.
- "Cumulative" is the sum over those 9,320 keystrokes.
- All rows cite an artifact in this directory. The skill's renderer produced the uncurated versions (`hotspots-rendered-phone-{A,B,C}.md`) from `profile-phone-*.jsonl`. They rank by single-pass trace totals, which host contention inflates (see H12 in hypothesis.md). This table ranks by the quiet-pass component sums instead.

| Rank | Location | Metric | Value | Category | Evidence |
|---:|---|---|---|---|---|
| 1 | frame after layout: pre-paint, paint, layerize, commit (excluded from `key2layout`, included in `key2paint`) | cumulative / mean / p95 / p99 | 67.7 s / 7.27 ms / 13.1 ms / 28.9 ms | render pipeline | `contention.json` phone.A.components_quiet.toFrame; `trace-summary-browser-phone.json` A: Paint p95 4.34 ms, PrePaint p95 3.27 ms, Commit p95 24.6 ms (single contended pass) |
| 2 | input queueing, keydown to handler start | cumulative / mean / p95 | 31.5 s / 3.38 ms / 6.8 ms | queue (throttled input dispatch) | `contention.json` phone.A.components_quiet.inputDelay. Floor: I0, which does almost no work, has p95 5.1 ms (phone.I0) |
| 3 | forced style and layout of the results list (`app.mjs` input handler `offsetHeight`) | cumulative / mean / p95 / p99 | 26.3 s / 2.83 ms / 6.1 ms / 8.9 ms | layout | `contention.json` phone.A.components_quiet.layout. `cpu-browser-phone-A-typing.cpuprofile`: `(anonymous) app.mjs:133` self 3,959 ms/pass (18.2% of busy). `trace-summary-browser-phone.json` A.Layout: n 2,409, p95 5.95 ms |
| 4 | engine search on the main thread (`engine-a.mjs search`) | cumulative / mean / p50 / p95 / p99 | 19.5 s / 2.09 ms / 0.3 ms / 8.9 ms / 13.7 ms | CPU | `contention.json` phone.A.components_quiet.search |
| 4a | `selectTopK`: Array.from over every candidate, one object each, then a full `sort` | share of search time | 59.8% phone (1,758 of 2,939 ms/pass); 58.2% node sampler (2,891 of 4,968 ms); 59.6% node stage timer; 53.5% in B's worker (435 of 815 ms) | CPU+alloc | `cpu-attribution.json` (cpu-browser-phone-A-typing, cpu-node-A-full, cpu-browser-phone-B-typing-worker); `span_summary-node-A-full.json` engineA.sort. The comparator (`engine-a.mjs:90`) alone is 19.5% of busy time (self) in cpu-node-A-full |
| 4b | `accumulateScores`: posting walk with a `Map<doc,{score,mask}>`, and `Math.log` idf recomputed per posting per field | share of search time | 33.4% phone (983 ms/pass); 39.0% node sampler (1,937 ms); 38.8% node stage timer | CPU | same artifacts; `engine-a.mjs:61` self 1,937 ms in cpu-node-A-full |
| 4c | driver of 4a and 4b: candidate-set size | mean candidates / expanded terms per query | 926.9 / 134.3; worst queries 1,330 to 3,747 candidates | CPU | `span_summary-node-A-full.json` mean_candidates_per_query, worst_queries_first_pass; `scaling-node.json` query_length_axis (1-char prefixes p95 3.12 ms, 3-char 0.85 ms, 13+ chars 2.35 ms) |
| 5 | `renderList` innerHTML of 10 rows | cumulative / mean / p95 | 5.3 s / 0.57 ms / 2.9 ms | DOM | `contention.json` phone.A.components_quiet.render; renderList self 607 ms/pass in cpu-browser-phone-A-typing |
| 6 | GC while typing | per pass / max pause | 231 ms/pass (1.1% of busy); MajorGC max 51.0 ms, MinorGC max 50.1 ms | GC | `cpu-attribution.json` phone A typing; `trace-summary-browser-phone.json` A.MajorGC, A.MinorGC |
| 7 | cold JIT on the first keystrokes of a page | search time of the first queries | "r" 18.2 ms, "rust" 32.4 ms, "rust cli with sqlite s" 42.2 ms, inside long tasks of 84 to 93 ms | CPU (JIT) | `longtasks-browser-phone.json` A pass 1 |
| 8 | lazy full-index hydrate on the main thread (JSON.parse of 2.59 MB) | p50 / p95 | 49.7 ms / 78.2 ms (a long task in 13 of 20 runs; max 198 ms) | CPU (load) | `baseline-browser-phone-A.json` load.full_hydrate_ms, load.longtasks_during_load |
| 9 | core-shard fetch (102 KB brotli over Fast 4G) | fetch to body p50 | 368.5 ms (usable p50 411 ms, p95 521 ms, budget 1,000) | network | `baseline-browser-phone-A.json` load.core_fetch_to_body_ms, usable_after_dcl_ms |

## Notes
- Rows 4a and 4b account for 93% (phone CDP sampler), 97% (Node sampler) and 98% (stage timers) of engine time: three independent methods agree. Tokenize (0.4%), term lookup (1.0%) and materialize (0.2%) are negligible (`span_summary-node-A-full.json`).
- Rows 1 to 3 are renderer and throttling costs that no engine change removes. The phone `key2layout` p95 of 18.0 ms breaks down into input delay (p95 6.8 ms), search (p95 8.9 ms), and render plus layout (p95 2.9 plus 6.1 ms). Components do not add at p95.
- Desktop, quiet passes: search p95 2.2 ms, layout p95 0.9 ms, input delay p95 1.9 ms, `key2layout` p95 4.1 ms (`contention.json` desktop.A).
