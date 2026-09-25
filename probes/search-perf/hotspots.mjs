// Emit perf.profile.span_summary JSONL for the skill's render_hotspot_table.py.
// Scope: one phone-profile typing pass (1,165 keystrokes) of a candidate, combining
//   - JS stages: CDP Profiler inclusive time (cpu-attribution.json, cpu-browser-phone-<C>-typing.cpuprofile)
//   - renderer main-thread phases: trace events (trace-summary-browser-phone.json)
//   - input queueing: keydown.timeStamp -> handler start (baseline-browser-phone-<C>.json, mean x keystrokes)
// Usage: node hotspots.mjs OUT CAND > profile-<CAND>.jsonl
import fs from 'node:fs';
import path from 'node:path';

const [OUT, CAND] = process.argv.slice(2);
const J = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
const cpuFile = `cpu-browser-phone-${CAND}-typing${CAND === 'B' ? '-worker' : ''}.cpuprofile`;
const cpu = J('cpu-attribution.json').find((x) => x.file === cpuFile);
const trace = J('trace-summary-browser-phone.json').results[CAND];
const base = J(`baseline-browser-phone-${CAND}.json`);
const keys = base.queries;
const out = [];
const emit = (o) => out.push(JSON.stringify({ event: 'perf.profile.span_summary', ...o }));

const JS_STAGES = { selectTopK: 'CPU+alloc', accumulateScores: 'CPU', renderList: 'DOM', '(garbage collector)': 'GC', tokenizeQuery: 'CPU', lookupTerms: 'CPU', materialize: 'CPU', termResults: 'CPU', executeQuery: 'CPU', combineResults: 'CPU', rankMatches: 'CPU', postMessage: 'IPC' };
for (const [name, cat] of Object.entries(JS_STAGES)) {
  const s = cpu && cpu.inclusive_stage_ms[name];
  if (!s) continue;
  emit({ span: `js.${name}`, cumulative_us: Math.round(s.ms * 1000), count: keys, category: cat, evidence: `${cpuFile} via cpu-attribution.json (inclusive, ${(s.share_of_busy * 100).toFixed(1)}% of busy)` });
}
for (const n of ['UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit']) {
  const e = trace && trace.main_thread_events[n];
  if (!e) continue;
  emit({ span: `renderer.${n}`, cumulative_us: Math.round(e.total_ms * 1000), count: e.n, p50_us: Math.round(e.p50 * 1000), p95_us: Math.round(e.p95 * 1000), category: n === 'Commit' ? 'compositor' : 'layout/paint', evidence: `trace-summary-browser-phone.json results.${CAND}.main_thread_events.${n}` });
}
const d = base.metrics.inputDelay;
emit({ span: 'input.queueing (keydown -> handler)', cumulative_us: Math.round(d.mean * keys * 1000), count: keys, p50_us: Math.round(d.p50 * 1000), p95_us: Math.round(d.p95 * 1000), category: 'queue', evidence: `baseline-browser-phone-${CAND}.json metrics.inputDelay (mean x ${keys})` });
if (CAND === 'B') {
  const m = base.metrics.messageOverhead;
  emit({ span: 'worker.message_round_trip_overhead', cumulative_us: Math.round(m.mean * keys * 1000), count: keys, p50_us: Math.round(m.p50 * 1000), p95_us: Math.round(m.p95 * 1000), category: 'IPC', evidence: `baseline-browser-phone-B.json metrics.messageOverhead (mean x ${keys})` });
}
process.stdout.write(out.join('\n') + '\n');
