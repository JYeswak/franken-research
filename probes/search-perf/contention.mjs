// Post-hoc contention sentinel for the browser runs (the host is shared with other agent sessions).
// Input queueing (keydown.timeStamp -> input handler start) measures how available the renderer main
// thread was at the moment of the keystroke; the harness waits for the previous keystroke's frame, so
// on an idle host it is small and stable. A pass is "quiet" when its inputDelay p95 is within 2x of the
// lowest per-pass inputDelay p95 seen for that candidate and profile. The skill's rule applies:
// quarantine, don't delete. Pooled (all-runs) numbers stay the primary verdict; quiet-run numbers are
// the steady-state estimate. Usage: node contention.mjs OUT > contention.json
import fs from 'node:fs';
import path from 'node:path';
import { summarize, pct } from './lib/stats.mjs';

const OUT = process.argv[2];
const FACTOR = 2;
const res = {};
for (const prof of ['desktop', 'phone']) {
  res[prof] = {};
  for (const c of ['A', 'B', 'C', 'I1', 'I0']) {
    const f = path.join(OUT, `baseline-browser-${prof}-${c}.json`);
    if (!fs.existsSync(f)) continue;
    const b = JSON.parse(fs.readFileSync(f, 'utf8'));
    // raw columns: inputDelay, search, render, layout, toFrame, workerSearch
    const runs = b.raw_ms_by_run.map((run, i) => {
      const id = Float64Array.from(run, (r) => r[0]).sort();
      return { run: i + 1, inputDelay_p95: pct(id, 0.95), rows: run };
    });
    const floor = Math.min(...runs.map((r) => r.inputDelay_p95));
    const quiet = runs.filter((r) => r.inputDelay_p95 <= FACTOR * floor);
    const k2l = (rows) => rows.map((r) => r[0] + r[1] + r[2] + r[3]);
    const work = (rows) => rows.map((r) => r[1] + r[2] + r[3]);
    const quietRows = quiet.flatMap((r) => r.rows);
    const entry = {
      criterion: `pass inputDelay p95 <= ${FACTOR} x min per-pass inputDelay p95 (${floor.toFixed(2)} ms)`,
      quiet_runs: quiet.map((r) => r.run), quiet_count: quiet.length, runs: runs.length,
      per_run_inputDelay_p95: runs.map((r) => +r.inputDelay_p95.toFixed(2)),
      key2layout_quiet: summarize(k2l(quietRows)),
      work_quiet: summarize(work(quietRows)), // search + render + layout, no queueing
      inputDelay_quiet: summarize(quietRows.map((r) => r[0])),
      key2layout_all: b.metrics.key2layout,
      // per-keystroke components in quiet passes (ms): where a keystroke's time goes once host noise is excluded
      components_quiet: Object.fromEntries(['inputDelay', 'search', 'render', 'layout', 'toFrame', 'workerSearch'].map((n, i) => {
        const vals = quietRows.map((r) => r[i]).filter((x) => x != null);
        if (!vals.length) return [n, null];
        const s = summarize(vals);
        return [n, { mean: s.mean, p50: s.p50, p95: s.p95, p99: s.p99, sum_ms: +vals.reduce((a, x) => a + x, 0).toFixed(1) }];
      })),
    };
    if (c === 'B' && prof === 'phone') entry.key2layout_quiet_worker_scaled_estimate = summarize(quietRows.map((r) => r[0] + r[1] + r[2] + r[3] + 3 * r[5])); // phone = 4x CPU; workers run unthrottled
    res[prof][c] = entry;
  }
}
process.stdout.write(JSON.stringify({ note: 'post-hoc; see header of probes/search-perf/contention.mjs', factor: FACTOR, results: res }, null, 1) + '\n');
