# Search optimisation, round 2: 20260925T192212Z-d29eb1c

**Result: REQ-O2 is NOT met on the phone profile. Measured floor: `key2paint` p95 16.6 to 17.0 ms against a 16 ms budget.** This round follows review 7d and makes `key2paint` the primary metric. Keystroke to results *painted* is the REQ-O2 budget.

- The kept engine is AL3, which is A plus L1 bounded top-k, L2 dense accumulators and L3a in-place rows. Round 2 measured it at p95 17.0 ms and p99 58.5 ms, with 2 Long Tasks over 50 ms. All three are FAIL.
- None of the three new frame levers beat AL3 on paired runs, and one more was dropped before timing because it changed what is drawn.
- The p99 rule and the zero-long-task rule also fail for I0, the shipped 44-name search, which does almost no work. The traces put that tail in frame scheduling, with both the renderer main thread and its compositor idle.
- The budget is unchanged.

- Host: a 32-core arm64 desktop; phone results use CDP 4x CPU throttle and Fast 4G. The Node and Chrome builds are in `ladder-phone/bench-browser-phone-summary.json`. The load average was 12 to 16 during the runs.
- Evidence levels:
  - The timings are **measured** in headless Chrome on 2026-09-25. Each candidate in each invocation has 10 runs x 1,165 keystrokes after 1 warm-up run, with the order shuffled per run. Nothing was measured on real devices.
  - The trace attributions in `diag/` are **measured** on single diagnostic passes. Tracing perturbs timing, so no verdict comes from them.
  - Result identity is a **test** with an oracle and planted faults. Anything marked [INFERENCE] was not measured.
- Round 1 (`../20260925T175730Z-4b31427/`) reported `key2layout`, which stops before the frame, and called that a budget pass. Its README now carries the correction.
- Round 1 also had a parity defect: its rungs did not load the quotes shard, while A did. Round 2 loads it for every rung (`page/app.mjs`).

## 1. Phone, one invocation (`ladder-phone/`)
Each new lever is a sibling of AL3 and ran in the same invocation. The rule (`ladder.mjs`, metric `key2paint`) keeps a lever only if the pooled p95 is lower **and** the per-run p95 is lower in a majority of the 10 paired runs.

| Rung | Lever | `key2paint` p50 / p95 / p99 (ms) | vs | Paired runs won | Verdict |
|---|---|---|---|---|---|
| A | incumbent | 11.3 / 23.4 / 43.0 | | | |
| AL3 | L1 + L2 + L3a (kept in round 1) | 7.0 / **17.0** / 58.5 | A | 10/10 | KEEP, -6.4 ms |
| AL7 | + L7 results list on its own compositing layer | 7.4 / 16.6 / 58.8 | AL3 | 4/10 | REJECT |
| AL8 | + L8 one-character result cache, filled in idle time | 7.2 / 16.8 / 72.0 | AL3 | 3/10 | REJECT |
| AL9 | + L9 render inside the animation frame (no separate handler layout) | 7.2 / 16.7 / 57.1 | AL3 | 5/10 | REJECT |
| I0 | control: shipped 44-name search, almost no work | 5.1 / 13.5 / 58.4 | | | |

- L6 was dropped before timing. `contain: layout paint` on the list clipped the "10." list number and moved the list by 5 px. `content-visibility` on rows would clip every number.
- Capping or virtualising rows was not tried. The top 10 is part of the matched output, and all 10 rows fit on the screen.
- Round-1 rungs rescored on `key2paint` (`ladder.mjs` on round-1 data):
  - AL3: 16.4 and 16.6 ms.
  - L3b, containment with fixed rows: 17.3 ms.
  - L4, JIT warm-up: 17.8 ms.
  - Across the three invocations, AL3's `key2paint` p95 is 16.4, 16.6 and 17.0 ms.

Phone components for AL3, p95 in ms: input delay 4.8, search 2.1, render 0.6, layout 3.6, frame 9.8. For I0 the same components are 4.8, 0.1, 0.1, 0.8 and 8.8.

## 2. Where the phone tail comes from (`diag/`, `ladder.json` `key2paint_by_position_after_reset`)
The harness resets the box before each of the 58 typed phrases. The p99 tail sits almost entirely on the **second keystroke after a reset** (pos1). Keystrokes over 50 ms, per 10 runs:

| | pos0, n 580 | pos1, n 570 | pos2 and later, n 10,500 |
|---|---|---|---|
| AL3 p95 / p99 (ms) | 21.1 / 39.6 | 83.5 / 86.7 | **15.3 / 20.6** |
| AL3 over 50 ms | 4 | 132 | 6 |
| I0 p95 / p99 (ms) | 19.4 / 81.8 | 83.0 / 90.0 | 11.5 / 20.7 |
| I0 over 50 ms | 8 | 115 | 24 |

- Traced tail keystrokes (`diag/frames-browser-phone-timelines.json`, one pass per candidate) are mostly pos1: 14 of 17 for AL3 and 18 of 24 for I0.
- In those windows the renderer main thread is idle for a median 64 ms (AL3) or 46 ms (I0). The renderer's compositor thread starts no frame (`ScheduleBeginImplFrameDeadline`) until 35 to 80 ms after the input.
- The display compositor keeps ticking, and GPU compositing is on (ANGLE on Metal).
- [INFERENCE] The frame is held back in Chrome's compositor pipeline after the frame that first shows the list. Page work does not hold it, and the no-work control shows the same stall. The mechanism was not isolated further.

Long tasks over 50 ms while typing, charged to keystroke phases by the timing harness (`longtasks_typing.entries`):
- AL3: 2 in 10 runs. One was in the search phase (63.5 ms, a first keystroke). The other was in layout plus frame.
- A: 4.
- I0: 11. Most were in the frame phase, and they clustered in 2 of the 10 runs.
- Two diagnostic passes each of A, AL3 and I0 (`diag/longtasks-browser-phone.json`) had 0 long tasks.

## 3. REQ-O2 verdicts for AL3 (primary metric `key2paint`)
| Budget | Phone (`ladder-phone/`) | Desktop (`desktop/`) |
|---|---|---|
| p95 <= 16 / 8 ms | **FAIL 17.0** (floor across levers 16.6; I0 13.5) | PASS 5.0 (A 6.9, I0 3.7) |
| p99 <= 2 x p95 | **FAIL 58.5** (I0 58.4 also fails) | **FAIL 21.6** pooled (A 32.1 and I0 11.3 also fail); in 7 quiet passes PASS: p95 3.8, p99 6.6 |
| no long task > 50 ms while typing | **FAIL 2** (I0 11) | **FAIL 4** (A 9, I0 1) |
| usable after DCL p95 <= 1,000 / 300 ms | PASS 420 | PASS 112 |
| core / full shard brotli | unchanged, 102.0 / 444.4 KB | same |

In desktop run 8 the input-delay p95 was 10.4 to 14.7 ms, against about 1 ms in the other runs, and that one run carries the pooled desktop tail (`desktop/contention.json`).

## 4. Golden set: zero changed results
- `golden-diff.json` compares the incumbent `engine-a.mjs` with three variants: A+L1, A+L1+L2, and A+L1+L2+L8 with the one-character cache filled.
  - It compares every top-10 row: id, title, kind, badge, and the score via `Object.is`.
  - The query sets are the 1,165 probe queries, the 88 ebac079 golden queries (`GOLDEN`, sha256 `4c3c6b21...`) and their 4,206 prefixes, on both shards.
  - All 18 checks show 0 changed rows: PASS.
- `golden-diff-plants.txt`: a cache keyed by character only, not by index, changed 123 results and failed the check.
- L7 and L9 do not touch the engine. Their rendered text matched A on 7 queries in headless Chrome (a manual check, not part of the harness).

## Reproduce
```
cd probes/search-perf; export SCRATCH=<scratch>/search-perf
RUNS=10 CANDS=A,AL3,AL7,AL8,AL9,I0 node bench-browser.mjs timing OUT/ladder-phone OUT/queries.json phone
node ladder.mjs OUT/ladder-phone phone AL3 AL7          # key2paint primary; METRIC=key2layout for the old view
CANDS=AL3,I0 node bench-browser.mjs frames OUT/diag OUT/queries.json phone      # trace attribution of the tail
GOLDEN=<(git show ebac079:.atlas-arc/eval/golden.jsonl) node bench-node.mjs golden-diff OUT OUT/queries.json
```

## What this run does not show
- Real phones, or a real vsync. Frames here are unthrottled (`--disable-frame-rate-limit --disable-gpu-vsync`).
- Why Chrome's compositor holds the frame after the list first appears. That was measured, but not traced below the compositor scheduler.
- A lever that closes the last 0.6 to 1.0 ms at p95. The largest remaining engine-side part is layout (p95 3.6 ms, against 0.8 for I0). No visually identical layout lever was found.
- A quiet host. The load average was 12 to 16, and I0's per-run p95 drifted 103% (ESCALATE).
- The site/ integration (S05), CPU profiles of the new rungs, and the full `run.sh` table.
