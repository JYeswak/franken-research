# Search optimisation run: 20260925T175730Z-4b31427

**Result: engine A with levers L1, L2 and L3a (rung `AL3`) meets the phone keystroke budget. Phone `key2layout` p95 is 8.0 ms against a 16 ms budget, in both invocations that measured it. On the same invocations the incumbent A measured 16.4 ms and 15.8 ms. The desktop budgets still pass: p95 1.8 ms against 8 ms. The results are identical to the incumbent's: 0 changed rows over 1,165 probe queries, the 88 relevance golden-set queries (ebac079) and their 4,206 keystroke prefixes, on both shards, with scores compared bit for bit.**

- Host: a 32-core arm64 desktop; phone results use CDP 4x CPU throttle and Fast 4G. It is the same host, Node and Chrome build as probe `20260925T005518Z-ebac079`, whose code, corpus, index files and query set this run reuses unchanged. See `rebaseline/fingerprint.json`; the load average was 8.4 at the start.
- Base commit 4b31427. The code measured is the commit that adds this directory: `lib/engine-a-opt.mjs`, the ladder rungs in `page/app.mjs`, and `bench-node.mjs golden-diff`. The re-baseline ran from a byte copy of the committed probe at 4b31427, before any change.
- Every browser invocation used the probe harness unchanged (`bench-browser.mjs timing`), 10 measured runs plus 1 warm-up, 1,165 keystrokes per run, with candidate order shuffled per run. I0 ran in each invocation as the contention sentinel.
- Evidence levels. The timings are **measured** on 2026-09-25 in headless Chrome on one workstation, with N = 10 runs x 1,165 keystrokes per candidate per invocation. They are not measured on real devices. Result identity is a **test** with an oracle: it compares against the frozen incumbent engine, and two planted faults were caught. Anything marked [INFERENCE] was not measured.

## 1. Re-baseline of the incumbent on a quieter host (`rebaseline/`)
| | ebac079 (load 37 to 67) | this run (load 8 to 58, sentinel I0 steady) |
|---|---|---|
| A phone `key2layout` p95, pooled | 55.8 ms | **15.2 ms** (10 of 10 passes quiet) |
| A phone p95, quiet passes | 18.0 ms | 15.2 ms |
| A per-run p95 | n/a | 11.8 to 17.1 ms; 3 of 10 runs over 16 |
| I0 phone p95 (floor sentinel) | 5.9 ms quiet | 5.3 ms |

[INFERENCE] Most of the old FAIL came from host load: I0, which does almost no work, was steady at 5.1 to 5.3 ms here. The incumbent sits on the budget line: 15.2, 16.4 and 15.8 ms across the three invocations that ran it. It has no margin.

## 2. Levers, one rung at a time (`ladder-phone/`, `ladder-phone-L4/`)
Each rung adds one lever to the last kept rung. The rungs ran interleaved in the same invocation. The rule (`ladder.mjs`) keeps a lever only if the pooled p95 is lower **and** the per-run p95 is lower in a majority of paired runs.

| Rung | Lever | Phone `key2layout` p95 (p50 / p99) | vs | Paired runs won | Verdict |
|---|---|---|---|---|---|
| A | incumbent | 16.4 (6.9 / 22.6) | | | |
| AL1 | L1 bounded top-10 selection | 12.9 (6.1 / 21.4) | A | 9/10 | KEEP, -3.5 ms |
| AL2 | + L2 dense typed-array accumulators, hoisted idf and length norm | 10.4 (5.2 / 14.1) | AL1 | 9/10 | KEEP, -2.5 ms |
| AL3 | + L3a results list: persistent row nodes, text updated in place | **8.0** (3.6 / 11.2) | AL2 | 9/10 | KEEP, -2.4 ms |
| AL4 | + L3b CSS containment, fixed row height | 8.6 (3.8 / 12.1) | AL3 | 3/10 | REJECT |
| AL5 | + L4 JIT warm-up after the full hydrate | 8.5 (3.5 / 12.9) | AL3 | 5/10 | REJECT (`ladder-phone-L4/`, A 15.8 vs AL3 8.0, 10/10) |

In `ladder-phone/` rung AL5 still carried L3b (L3b + L4, 8.4 ms). Once L3b was rejected, L4 was re-measured alone against AL3 in `ladder-phone-L4/`.

Phone components, p95 in ms (`ladder-phone-L4/ladder.json`):

| | input delay | search | render | layout | to frame |
|---|---|---|---|---|---|
| A | 5.1 | 8.0 | 2.6 | 5.5 | 9.9 |
| AL3 | 4.7 | 2.2 | 0.7 | 3.7 | 9.2 |

Engine only, in Node, A-full per query (`node-engine/`, 20 runs): p95 2.57 to 1.28 (L1) to 0.37 ms (L1+L2), p50 0.133 to 0.048 to 0.013 ms. Envelopes on these sub-millisecond numbers are INVESTIGATE or ESCALATE because the host was shared.

## 3. Budgets for AL3 (REQ-O2)
| Budget | Phone | Desktop (`final-desktop/`) |
|---|---|---|
| key p95 <= 16 / 8 ms | **PASS 8.0** (both invocations) | **PASS 1.8** (A 3.7) |
| p99 <= 2x p95 | PASS 11.2 | PASS 3.0 (A 5.0) |
| usable after DCL <= 1,000 / 300 ms (p95) | PASS 395 to 407 | PASS 85.9 |
| core shard / full index brotli | unchanged: 102.0 KB / 444.4 KB (same index files) | same |
| long tasks > 50 ms while typing (pooled, 10 runs) | 2 to 3 (A 6 to 13); FAIL as a strict zero | PASS 0 |

The metric caveat of ebac079 still applies. The primary metric stops at forced layout, and `key2paint` p95 for AL3 is 16.4 to 16.6 ms on the phone, against 24.1 to 25.3 ms for A.

## 4. Golden set: zero changed results
- `golden-diff.json` (`bench-node.mjs golden-diff`) compares every top-10 row (id, title, kind, badge, and score via `Object.is`) of the incumbent `engine-a.mjs` against A+L1 and A+L1+L2, on `a-core.json` and `a-full.json`.
  - The query sets are the 1,165 probe queries, the 88 queries of the golden set as committed in ebac079, and all 4,206 keystroke prefixes of those 88.
  - The ebac079 file was pinned with `GOLDEN`, sha256 `4c3c6b21...2f0f22`. The working copy of `.atlas-arc/eval/golden.jsonl` had 30 uncommitted new queries from another session by then.
  - Every check is 0 changed, and the verdict is PASS. The sha256 of the top-10 ids for the 88 golden queries is the same for both engines: `6de1ac63...290d9`.
- `golden-diff-c982b09-118.json` runs the same test on the golden set as grown in c982b09, in its privacy-corrected form (fixup 99a412e): 118 queries (G-001..G-088 unchanged, plus G-089..G-118), sha256 `131769ee...94a5b2ea`, and their 6,755 prefixes, on both shards. Result: 0 changed rows, PASS. Measured on 2026-09-25 with the code at 0a50cde. The file holds counts and hashes only, no query text.
- The check fails on planted faults (`golden-diff-plants.txt`): a reversed tie order changed 2,358 query results, and a mathematically equal reassociation of the length norm changed 7,786.
- `verify-golden-opt-vs-ebac079.json` runs the probe's own `verify-golden` against ebac079's golden top 10, with the optimised engine: PASS, 0 top-3 and 0 top-4..10 changes.
- L3a renders the same text as `renderList`. This was checked in headless Chrome on 6 queries, including one with no results. It is not checked in the timing harness.

## Reproduce
```
cd probes/search-perf; export SCRATCH=<scratch>/search-perf     # index data from run.sh (build-index.mjs)
GOLDEN=<(git show ebac079:.atlas-arc/eval/golden.jsonl) node bench-node.mjs golden-diff OUT OUT/queries.json   # exit 1 on any changed row
CANDS=A-full,AL1-full,AL2-full node bench-node.mjs baseline OUT/node-engine OUT/queries.json
RUNS=10 CANDS=A,AL1,AL2,AL3,AL4,AL5,I0 node bench-browser.mjs timing OUT/ladder-phone OUT/queries.json phone
node ladder.mjs OUT/ladder-phone phone; node contention.mjs OUT/ladder-phone
```

## What this run does not show
- Real phones (U10). The phone profile is headless Chrome with a 4x throttle.
- Paint. The frame after layout (p95 9.2 ms) is still the largest component, and no lever here targets it. L3b, the one that could, lost.
- A zero-long-task phone pass. AL3 still has 2 to 3 long tasks over 50 ms per 11,650 keystrokes. They were not attributed; `bench-browser.mjs longtasks` was not run.
- The site/ integration. The levers live in the probe (`lib/engine-a-opt.mjs`, `page/app.mjs` AL3) and have not been ported to S05.
- The full `run.sh` budget table (`report.mjs`), CPU profiles, and traces for the new rungs.
