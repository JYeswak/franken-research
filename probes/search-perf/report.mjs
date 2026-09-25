// Render the REQ-O2 budget verdict table (markdown) from a run directory's baselines.
// Usage: node report.mjs OUT > budgets.md
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const J = (f) => { const p = path.join(OUT, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const sizes = J('sizes.json').sizes;
const KB = (b) => (b / 1024).toFixed(1) + ' KB';
const v = (ok) => (ok ? 'PASS' : '**FAIL**');
const f2 = (x) => (x == null ? 'n/a' : Number(x).toFixed(2));
const SHARDS = { A: ['a-core.json', 'a-full.json'], B: ['a-core.json', 'a-full.json'], C: ['c-core.json', 'c-full.json'], I1: [null, 'i1.json'], I0: ['i0.json', null] };
const BUD = { desktop: { key: 8, usable: 300 }, phone: { key: 16, usable: 1000 } };
const lines = [];
const P = (s = '') => lines.push(s);

P(`# REQ-O2 budget verdicts: ${path.basename(OUT)}`);
P();
P('Primary keystroke metric = `key2paint` (REQ-O2 "keystroke to results painted"; review 7d): `keydown.timeStamp` to the first task after the animation frame that carries the results (headless frame scheduling included; see frame-cadence.json). `key2layout` = to results rendered with style and layout forced; it excludes the frame and is shown as a component view only. Percentiles are nearest-rank over all measured keystrokes of every run (1 warm-up run discarded).');
P();
for (const prof of ['desktop', 'phone']) {
  const b = BUD[prof];
  P(`## ${prof} (keystroke budget p95 <= ${b.key} ms, p99 <= 2x p95; usable <= ${b.usable} ms after DOMContentLoaded; no long task > 50 ms while typing)`);
  P();
  P('| Cand | samples | key2paint p50 / p95 / p99 / p99.9 / max (ms) | p95 budget | p99 <= 2x p95 | key2layout p95 | usable after DCL p95 (ms) | usable budget | long tasks > 50 ms typing (max) | full index ready p95 (ms) | index heap (MB) | envelope (p95 drift) |');
  P('|---|---:|---|---|---|---:|---:|---|---|---:|---:|---|');
  for (const c of ['A', 'B', 'C', 'I1', 'I0']) {
    const r = J(`baseline-browser-${prof}-${c}.json`);
    if (!r) continue;
    const k = r.metrics.key2paint;
    const heap = (r.memory.index_main_heap_bytes + (r.memory.worker_heap_used_bytes_median || 0)) / 1048576;
    const u = r.load.usable_after_dcl_ms.p95;
    P(`| ${c} | ${r.samples} | ${f2(k.p50)} / ${f2(k.p95)} / ${f2(k.p99)} / ${f2(k.p999)} / ${f2(k.max)} | ${v(k.p95 <= b.key)} | ${v(k.p99 <= 2 * k.p95)} (${(k.p99 / k.p95).toFixed(2)}x) | ${f2(r.metrics.key2layout.p95)} | ${f2(u)} | ${v(u <= b.usable)} | ${v(r.longtasks_typing.over_50ms === 0)} ${r.longtasks_typing.over_50ms} (${f2(r.longtasks_typing.max_ms)}) | ${f2(r.load.full_ready_after_dcl_ms.p95)} | ${heap.toFixed(2)}${c === 'B' ? ' (main+worker)' : ''} | ${r.envelope_key2paint.verdict} ${r.envelope_key2paint.max_drift_pct}% |`);
    if (c === 'B' && r.metrics.key2layout_worker_scaled_estimate) {
      const s = r.metrics.key2layout_worker_scaled_estimate;
      const ue = r.load.usable_after_dcl_worker_scaled_estimate_ms;
      P(`| B, worker scaled x4, key2layout [INFERENCE] | ${r.samples} | ${f2(s.p50)} / ${f2(s.p95)} / ${f2(s.p99)} / ${f2(s.p999)} / ${f2(s.max)} | ${v(s.p95 <= b.key)} | ${v(s.p99 <= 2 * s.p95)} (${(s.p99 / s.p95).toFixed(2)}x) | | ${ue ? f2(ue.p95) : ''} | ${ue ? v(ue.p95 <= b.usable) : ''} | | | | CDP cannot throttle workers |`);
    }
  }
  P();
  const cont = J('contention.json');
  if (cont) {
    P(`Steady state (post-hoc, quiet passes only; criterion in contention.json: pass inputDelay p95 <= ${cont.factor}x the lowest pass). Pooled all-run numbers above stay the primary verdict.`);
    P();
    P('| Cand | quiet passes | key2paint p50 / p95 / p99 / max (ms) | p95 budget | p99 <= 2x p95 | work p95 (search+render+layout) | long tasks > 50 ms in quiet passes (max ms) |');
    P('|---|---:|---|---|---|---:|---|');
    for (const c of ['A', 'B', 'C', 'I1', 'I0']) {
      const e = cont.results[prof][c];
      if (!e) continue;
      let lt = 0, ltMax = 0;
      for (const run of e.quiet_runs) {
        const f = J(`runs/browser-${prof}-${c}-r${String(run).padStart(2, '0')}.json`);
        lt += f.longtasks_typing; ltMax = Math.max(ltMax, f.longtask_max_ms);
      }
      const row = (label, k) => P(`| ${label} | ${e.quiet_count}/${e.runs} | ${f2(k.p50)} / ${f2(k.p95)} / ${f2(k.p99)} / ${f2(k.max)} | ${v(k.p95 <= b.key)} | ${v(k.p99 <= 2 * k.p95)} (${(k.p99 / k.p95).toFixed(2)}x) | ${f2(e.work_quiet.p95)} | ${v(lt === 0)} ${lt} (${f2(ltMax)}) |`);
      if (e.key2paint_quiet) row(c, e.key2paint_quiet); // absent in contention.json written before round 2
      if (e.key2layout_quiet_worker_scaled_estimate) row('B, worker scaled x4, key2layout [INFERENCE]', e.key2layout_quiet_worker_scaled_estimate);
    }
    P();
  }
}
P('## Payload (brotli q11; budget core <= 150 KB, full <= 1.5 MB; quotes shard reported separately per DEC-009)');
P();
P('| Cand | core shard | core budget | full index | full budget | quotes shard (lazy, stored only) | full + quotes | full + quotes budget |');
P('|---|---:|---|---:|---|---:|---:|---|');
const q = sizes['quotes.json'].brotli;
for (const c of ['A', 'B', 'C', 'I1', 'I0']) {
  const [core, full] = SHARDS[c];
  const cb = core ? sizes[core].brotli : null, fb = full ? sizes[full].brotli : null;
  const withQ = fb != null && c !== 'I1' ? fb + q : null;
  P(`| ${c} | ${cb == null ? 'none (single shard)' : KB(cb)} | ${cb == null ? 'n/a' : v(cb <= 150 * 1024)} | ${fb == null ? 'none' : KB(fb)} | ${fb == null ? 'n/a' : v(fb <= 1.5 * 1024 * 1024)} | ${withQ == null ? 'not loaded' : KB(q)} | ${withQ == null ? '' : KB(withQ)} | ${withQ == null ? '' : v(withQ <= 1.5 * 1024 * 1024)} |`);
}
P(`| A, quotes indexed (variant) | | | ${KB(sizes['a-full-qidx.json'].brotli)} | ${v(sizes['a-full-qidx.json'].brotli <= 1.5 * 1024 * 1024)} | (quotes still needed for display) | ${KB(sizes['a-full-qidx.json'].brotli + q)} | ${v(sizes['a-full-qidx.json'].brotli + q <= 1.5 * 1024 * 1024)} |`);
P();
P('## Engine-only, Node 22 desktop (ms per query; 1,165 queries x 20 runs, 3 warm-up runs discarded)');
P();
P('| Candidate | p50 | p95 | p99 | p99.9 | max | CV | envelope |');
P('|---|---:|---:|---:|---:|---:|---:|---|');
const nsum = J('bench-node-summary.json');
for (const [name, r] of Object.entries(nsum.results)) P(`| ${name} | ${f2(r.p50)} | ${f2(r.p95)} | ${f2(r.p99)} | ${f2(r.p999)} | ${f2(r.max)} | ${f2(r.cv)} | ${r.envelope.verdict} ${r.envelope.max_drift_pct}% |`);
P();
const hyd = J('hydrate-node.json');
if (hyd) {
  P('## Hydrate + first answer and retained heap, Node 22 (20 runs)');
  P();
  P('| Candidate | hydrate+first p50 (ms) | p95 (ms) | retained heap (MB) |');
  P('|---|---:|---:|---:|');
  for (const [name, r] of Object.entries(hyd)) P(`| ${name} | ${f2(r.hydrate_plus_first_answer_ms.p50)} | ${f2(r.hydrate_plus_first_answer_ms.p95)} | ${(r.retained_heap_bytes / 1048576).toFixed(2)} |`);
  P();
}
process.stdout.write(lines.join('\n') + '\n');
