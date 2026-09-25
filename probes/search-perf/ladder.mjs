// Optimisation ladder verdicts (app.mjs LADDER): each rung against the rung it extends, from one
// `bench-browser.mjs timing` invocation with the rungs interleaved in a shuffled order per run.
// A lever is kept only if its rung beats the incumbent rung on pooled key2layout p95 AND on the
// per-run p95 in a majority of runs (paired: same run, same host conditions). Rejected rungs are
// reported; the next rung is then compared with the last accepted one.
// Usage: node ladder.mjs OUT PROFILE [RUNG ...]   (default rungs: A AL1 AL2 AL3 AL4 AL5)
import fs from 'node:fs';
import path from 'node:path';
import { summarize } from './lib/stats.mjs';

const [OUT, PROFILE, ...argRungs] = process.argv.slice(2);
const rungs = argRungs.length ? argRungs : ['A', 'AL1', 'AL2', 'AL3', 'AL4', 'AL5'];
const COLS = ['inputDelay', 'search', 'render', 'layout', 'toFrame'];
const load = (c) => { const f = path.join(OUT, `baseline-browser-${PROFILE}-${c}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const row = (b) => {
  const flat = b.raw_ms_by_run.flat();
  const comp = Object.fromEntries(COLS.map((n, i) => [n, summarize(flat.map((r) => r[i])).p95]));
  return { key2layout: b.metrics.key2layout, key2paint_p95: b.metrics.key2paint.p95, components_p95: comp, per_run_p95: b.per_run_p95_key2layout, longtasks_typing: b.longtasks_typing, usable_after_dcl_p95: b.load.usable_after_dcl_ms.p95, full_ready_after_dcl_p95: b.load.full_ready_after_dcl_ms.p95 };
};
const res = { profile: PROFILE, rule: 'keep a lever iff pooled key2layout p95 < incumbent AND per-run p95 lower in a majority of paired runs', rungs: {}, verdicts: [] };
let inc = null;
for (const c of rungs) {
  const b = load(c);
  if (!b) continue;
  const r = (res.rungs[c] = row(b));
  if (!inc) { inc = c; continue; }
  const I = res.rungs[inc];
  const wins = r.per_run_p95.filter((v, i) => v < I.per_run_p95[i]).length;
  const keep = r.key2layout.p95 < I.key2layout.p95 && wins * 2 > r.per_run_p95.length;
  res.verdicts.push({ rung: c, vs: inc, p95: [I.key2layout.p95, r.key2layout.p95], delta_ms: +(r.key2layout.p95 - I.key2layout.p95).toFixed(3), paired_run_wins: `${wins}/${r.per_run_p95.length}`, verdict: keep ? 'KEEP' : 'REJECT' });
  if (keep) inc = c;
}
res.best = inc;
const sentinel = load('I0');
if (sentinel) res.sentinel_I0 = row(sentinel);
process.stdout.write(JSON.stringify(res, null, 1) + '\n');
