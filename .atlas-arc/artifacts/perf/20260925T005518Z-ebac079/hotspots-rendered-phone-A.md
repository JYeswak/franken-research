# Hotspot Table — ranked by cumulative

| Rank | Location | Metric | Value | Category | Evidence |
|------|----------|--------|-------|----------|----------|
| 1 | `renderer.Commit` | cumulative | 8.59s | compositor | trace-summary-browser-phone.json results.A.main_thread_events.Commit |
| 2 | `input.queueing (keydown -> handler)` | cumulative | 7.64s | queue | baseline-browser-phone-A.json metrics.inputDelay (mean x 1165) |
| 3 | `renderer.Layout` | cumulative | 4.10s | layout/paint | trace-summary-browser-phone.json results.A.main_thread_events.Layout |
| 4 | `renderer.Paint` | cumulative | 3.31s | layout/paint | trace-summary-browser-phone.json results.A.main_thread_events.Paint |
| 5 | `js.selectTopK` | cumulative | 1.76s | CPU+alloc | cpu-browser-phone-A-typing.cpuprofile via cpu-attribution.json (inclusive, 8.1% of busy) |
| 6 | `js.accumulateScores` | cumulative | 982.7ms | CPU | cpu-browser-phone-A-typing.cpuprofile via cpu-attribution.json (inclusive, 4.5% of busy) |
| 7 | `renderer.PrePaint` | cumulative | 965.0ms | layout/paint | trace-summary-browser-phone.json results.A.main_thread_events.PrePaint |
| 8 | `renderer.UpdateLayoutTree` | cumulative | 897.0ms | layout/paint | trace-summary-browser-phone.json results.A.main_thread_events.UpdateLayoutTree |
| 9 | `js.renderList` | cumulative | 643.6ms | DOM | cpu-browser-phone-A-typing.cpuprofile via cpu-attribution.json (inclusive, 3.0% of busy) |
| 10 | `renderer.Layerize` | cumulative | 630.6ms | layout/paint | trace-summary-browser-phone.json results.A.main_thread_events.Layerize |
| 11 | `js.(garbage collector)` | cumulative | 230.6ms | GC | cpu-browser-phone-A-typing.cpuprofile via cpu-attribution.json (inclusive, 1.1% of busy) |
| 12 | `js.postMessage` | cumulative | 110.2ms | IPC | cpu-browser-phone-A-typing.cpuprofile via cpu-attribution.json (inclusive, 0.5% of busy) |
