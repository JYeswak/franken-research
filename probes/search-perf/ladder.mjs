// Optimisation ladder verdicts (app.mjs LADDER): each rung against the rung it extends, from one
// `bench-browser.mjs timing` invocation with the rungs interleaved in a shuffled order per run.
// Primary metric: key2paint (REQ-O2 "keystroke to results painted"; review 7d). METRIC=key2layout
// reproduces the earlier component-view ladder. A lever is kept only if its rung beats the incumbent
// rung on pooled p95 AND on the per-run p95 in a majority of paired runs (same run, same host
// conditions). Rejected rungs are reported; the next rung is compared with the last accepted one.
// Every rung also gets its REQ-O2 verdicts on the primary metric: p95 <= budget, p99 <= 2 x p95, and
// zero Long Tasks over 50 ms while typing.
// Usage: node ladder.mjs OUT PROFILE [RUNG ...]   (default rungs: A AL1 AL2 AL3 AL4 AL5)
import fs from 'node:fs';
import path from 'node:path';
import { summarize } from './lib/stats.mjs';

const [OUT, PROFILE, ...argRungs] = process.argv.slice(2);
const METRIC = process.env.METRIC || 'key2paint';
const BUDGET = { desktop: 8, phone: 16 }[PROFILE];
const rungs = argRungs.length ? argRungs : ['A', 'AL1', 'AL2', 'AL3', 'AL4', 'AL5'];
const COLS = ['inputDelay', 'search', 'render', 'layout', 'toFrame'];
// Keystroke position after each scripted reset of the box (0 = first typed key). Diagnostic only: it
// shows where the key2paint tail sits; no verdict uses it.
const QF = process.env.QUERIES || path.join(OUT, '..', 'queries.json');
const posOf = [];
if (fs.existsSync(QF)) for (const s of JSON.parse(fs.readFileSync(QF, 'utf8')).typed) for (let i = s.from - 1, k = 0; i < s.text.length; i++, k++) posOf.push(k);
const byPos = (b) => {
  if (!posOf.length) return null;
  const g = { pos0: [], pos1: [], 'pos2+': [] };
  for (const run of b.raw_ms_by_run) run.forEach((r, i) => g[posOf[i] === 0 ? 'pos0' : posOf[i] === 1 ? 'pos1' : 'pos2+'].push(r[0] + r[1] + r[2] + r[3] + r[4]));
  return Object.fromEntries(Object.entries(g).map(([k, v]) => { const s = summarize(v); return [k, { n: s.n, p50: s.p50, p95: s.p95, p99: s.p99, over_50ms: v.filter((x) => x > 50).length }]; }));
};
const load = (c) => { const f = path.join(OUT, `baseline-browser-${PROFILE}-${c}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const row = (b) => {
  const flat = b.raw_ms_by_run.flat();
  const comp = Object.fromEntries(COLS.map((n, i) => [n, summarize(flat.map((r) => r[i])).p95]));
  const m = b.metrics[METRIC];
  const lt = b.longtasks_typing;
  return {
    [METRIC]: m, key2layout_p95: b.metrics.key2layout.p95, key2paint_p95: b.metrics.key2paint.p95, components_p95: comp,
    per_run_p95: b[`per_run_p95_${METRIC}`], longtasks_typing: lt,
    req_o2: { p95_within_budget: m.p95 <= BUDGET, p99_within_2x_p95: m.p99 <= 2 * m.p95, no_long_task_over_50ms: lt.over_50ms === 0 },
    key2paint_by_position_after_reset: byPos(b),
    usable_after_dcl_p95: b.load.usable_after_dcl_ms.p95, full_ready_after_dcl_p95: b.load.full_ready_after_dcl_ms.p95,
  };
};
const res = { profile: PROFILE, metric: METRIC, budget_p95_ms: BUDGET, rule: `keep a lever iff pooled ${METRIC} p95 < incumbent AND per-run p95 lower in a majority of paired runs`, rungs: {}, verdicts: [] };
let inc = null;
for (const c of rungs) {
  const b = load(c);
  if (!b) continue;
  const r = (res.rungs[c] = row(b));
  if (!inc) { inc = c; continue; }
  const I = res.rungs[inc];
  const wins = r.per_run_p95.filter((v, i) => v < I.per_run_p95[i]).length;
  const keep = r[METRIC].p95 < I[METRIC].p95 && wins * 2 > r.per_run_p95.length;
  res.verdicts.push({ rung: c, vs: inc, p95: [I[METRIC].p95, r[METRIC].p95], delta_ms: +(r[METRIC].p95 - I[METRIC].p95).toFixed(3), paired_run_wins: `${wins}/${r.per_run_p95.length}`, verdict: keep ? 'KEEP' : 'REJECT' });
  if (keep) inc = c;
}
res.best = inc;
const sentinel = load('I0');
if (sentinel) res.sentinel_I0 = row(sentinel);
process.stdout.write(JSON.stringify(res, null, 1) + '\n');
