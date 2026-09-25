# Hotspot Table — ranked by cumulative

| Rank | Location | Metric | Value | Category | Evidence |
|------|----------|--------|-------|----------|----------|
| 1 | `input.queueing (keydown -> handler)` | cumulative | 7.52s | queue | baseline-browser-phone-C.json metrics.inputDelay (mean x 1165) |
| 2 | `js.executeQuery` | cumulative | 7.48s | CPU | cpu-browser-phone-C-typing.cpuprofile via cpu-attribution.json (inclusive, 30.1% of busy) |
| 3 | `js.termResults` | cumulative | 4.70s | CPU | cpu-browser-phone-C-typing.cpuprofile via cpu-attribution.json (inclusive, 18.9% of busy) |
| 4 | `renderer.Commit` | cumulative | 3.60s | compositor | trace-summary-browser-phone.json results.C.main_thread_events.Commit |
| 5 | `renderer.Layout` | cumulative | 2.83s | layout/paint | trace-summary-browser-phone.json results.C.main_thread_events.Layout |
| 6 | `renderer.Paint` | cumulative | 2.21s | layout/paint | trace-summary-browser-phone.json results.C.main_thread_events.Paint |
| 7 | `renderer.UpdateLayoutTree` | cumulative | 833.2ms | layout/paint | trace-summary-browser-phone.json results.C.main_thread_events.UpdateLayoutTree |
| 8 | `renderer.PrePaint` | cumulative | 783.1ms | layout/paint | trace-summary-browser-phone.json results.C.main_thread_events.PrePaint |
| 9 | `js.combineResults` | cumulative | 679.0ms | CPU | cpu-browser-phone-C-typing.cpuprofile via cpu-attribution.json (inclusive, 2.7% of busy) |
| 10 | `js.renderList` | cumulative | 631.6ms | DOM | cpu-browser-phone-C-typing.cpuprofile via cpu-attribution.json (inclusive, 2.5% of busy) |
| 11 | `renderer.Layerize` | cumulative | 457.7ms | layout/paint | trace-summary-browser-phone.json results.C.main_thread_events.Layerize |
| 12 | `js.(garbage collector)` | cumulative | 406.6ms | GC | cpu-browser-phone-C-typing.cpuprofile via cpu-attribution.json (inclusive, 1.6% of busy) |
