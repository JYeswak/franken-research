# Hotspot Table — ranked by cumulative

| Rank | Location | Metric | Value | Category | Evidence |
|------|----------|--------|-------|----------|----------|
| 1 | `worker.message_round_trip_overhead` | cumulative | 16.19s | IPC | baseline-browser-phone-B.json metrics.messageOverhead (mean x 1165) |
| 2 | `input.queueing (keydown -> handler)` | cumulative | 10.48s | queue | baseline-browser-phone-B.json metrics.inputDelay (mean x 1165) |
| 3 | `renderer.Commit` | cumulative | 5.91s | compositor | trace-summary-browser-phone.json results.B.main_thread_events.Commit |
| 4 | `renderer.Layout` | cumulative | 2.98s | layout/paint | trace-summary-browser-phone.json results.B.main_thread_events.Layout |
| 5 | `renderer.Paint` | cumulative | 2.98s | layout/paint | trace-summary-browser-phone.json results.B.main_thread_events.Paint |
| 6 | `renderer.PrePaint` | cumulative | 884.2ms | layout/paint | trace-summary-browser-phone.json results.B.main_thread_events.PrePaint |
| 7 | `renderer.Layerize` | cumulative | 757.3ms | layout/paint | trace-summary-browser-phone.json results.B.main_thread_events.Layerize |
| 8 | `renderer.UpdateLayoutTree` | cumulative | 649.0ms | layout/paint | trace-summary-browser-phone.json results.B.main_thread_events.UpdateLayoutTree |
| 9 | `js.selectTopK` | cumulative | 435.5ms | CPU+alloc | cpu-browser-phone-B-typing-worker.cpuprofile via cpu-attribution.json (inclusive, 46.2% of busy) |
| 10 | `js.accumulateScores` | cumulative | 313.1ms | CPU | cpu-browser-phone-B-typing-worker.cpuprofile via cpu-attribution.json (inclusive, 33.3% of busy) |
| 11 | `js.tokenizeQuery` | cumulative | 38.3ms | CPU | cpu-browser-phone-B-typing-worker.cpuprofile via cpu-attribution.json (inclusive, 4.1% of busy) |
| 12 | `js.postMessage` | cumulative | 18.6ms | IPC | cpu-browser-phone-B-typing-worker.cpuprofile via cpu-attribution.json (inclusive, 2.0% of busy) |
