// Engine-only benchmark in Node 22 (desktop reference). One lever per mode:
//   node bench-node.mjs baseline   OUT QUERIES   3 warm-up + 20 measured runs, candidates interleaved
//   node bench-node.mjs instrument OUT QUERIES   A with per-stage timers (profiling-only hook)
//   node --cpu-prof ... bench-node.mjs cpuprof OUT QUERIES CAND   sampler run, 5 passes, no timers
//   node --expose-gc bench-node.mjs hydrate OUT QUERIES CAND      child: hydrate cost + retained heap
// Data: $SCRATCH/web/data (built by build-index.mjs).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as A from './lib/engine-a.mjs';
import * as AO from './lib/engine-a-opt.mjs';
import * as C from './lib/engine-c.mjs';
import * as I from './lib/incumbent.mjs';
import { summarize, envelope, mulberry32, shuffle } from './lib/stats.mjs';
import { artifactJSON } from './lib/artifact-json.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [mode, OUT, QUERIES, CAND] = process.argv.slice(2);
const DATA = path.join(process.env.SCRATCH, 'web', 'data');
const readData = (f) => fs.readFileSync(path.join(DATA, f), 'utf8');
const queries = JSON.parse(fs.readFileSync(QUERIES, 'utf8')).queries.map((x) => x.q);
const WARMUP = 3, RUNS = Number(process.env.RUNS || 20);

// Candidate table: hydrate from the serialized index text, then a sync or async search fn.
const CANDS = {
  'A-full': { file: 'a-full.json', hydrate: A.hydrate, search: (x, q) => A.search(x, q) },
  'AL1-full': { file: 'a-full.json', hydrate: A.hydrate, search: (x, q) => AO.searchL1(x, q) }, // A + L1
  'AL2-full': { file: 'a-full.json', hydrate: A.hydrate, search: (x, q) => AO.search(x, q) }, // A + L1 + L2
  'A-core': { file: 'a-core.json', hydrate: A.hydrate, search: (x, q) => A.search(x, q) },
  'A-full-qidx': { file: 'a-full-qidx.json', hydrate: A.hydrate, search: (x, q) => A.search(x, q) },
  'C-full': { file: 'c-full.json', hydrate: C.hydrate, search: (x, q) => C.search(x, q) },
  'C-core': { file: 'c-core.json', hydrate: C.hydrate, search: (x, q) => C.search(x, q) },
  'C-full-fuzzy': { file: 'c-full.json', hydrate: C.hydrate, search: (x, q) => C.search(x, q, 10, true) },
  'I1-full': { file: 'i1.json', hydrate: I.hydrate, search: (x, q) => I.search(x, q, 10) },
  'I0-44': { file: 'i0.json', hydrate: I.hydrate, search: (x, q) => I.search(x, q) },
  'B-full-worker': { file: 'a-full.json', async: true },
};

function write(name, obj) {
  fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true });
  fs.writeFileSync(path.join(OUT, name), artifactJSON(obj));
}

async function makeWorker(text) {
  const w = new Worker(new URL('./lib/node-worker.mjs', import.meta.url), { workerData: { text } });
  await new Promise((r) => w.once('message', r)); // ready
  let resolve;
  w.on('message', (m) => resolve(m));
  const search = (q) => new Promise((r) => { resolve = r; w.postMessage(q); });
  return { w, search };
}

async function baseline() {
  // CANDS (optional, comma list) narrows the candidate table; golden output needs A-full and C-full.
  const only = process.env.CANDS ? process.env.CANDS.split(',') : null;
  if (only) for (const k of Object.keys(CANDS)) if (!only.includes(k)) delete CANDS[k];
  const loaded = {};
  for (const [name, c] of Object.entries(CANDS)) {
    const text = readData(c.file);
    loaded[name] = c.async ? await makeWorker(text) : c.hydrate(text);
  }
  const samples = Object.fromEntries(Object.keys(CANDS).map((k) => [k, []]));
  const perRunP95 = Object.fromEntries(Object.keys(CANDS).map((k) => [k, []]));
  const rnd = mulberry32(7);
  const order = [];
  for (let run = -WARMUP; run < RUNS; run++) {
    const cands = shuffle(Object.keys(CANDS), rnd); // RANDOMIZE measurement order per run
    if (run >= 0) order.push(cands);
    for (const name of cands) {
      const c = CANDS[name], x = loaded[name];
      const t = new Float64Array(queries.length);
      if (c.async) {
        for (let i = 0; i < queries.length; i++) { const t0 = performance.now(); await x.search(queries[i]); t[i] = performance.now() - t0; }
      } else {
        for (let i = 0; i < queries.length; i++) { const t0 = performance.now(); c.search(x, queries[i]); t[i] = performance.now() - t0; }
      }
      if (run < 0) continue;
      const s = summarize(t);
      perRunP95[name].push(s.p95);
      samples[name].push(Array.from(t, (v) => Math.round(v * 1e4) / 1e4));
      write(`runs/node-${name}-r${String(run + 1).padStart(2, '0')}.json`, { candidate: name, run: run + 1, ...s, p95_ms: s.p95 });
    }
  }
  const results = {};
  for (const name of Object.keys(CANDS)) {
    const flat = samples[name].flat();
    results[name] = { candidate: name, index_file: CANDS[name].file, unit: 'ms', queries: queries.length, runs: RUNS, warmup_runs: WARMUP, ...summarize(flat), envelope: envelope(perRunP95[name]) };
    write(`baseline-node-${name}.json`, { ...results[name], per_run_p95: perRunP95[name], raw_ms_by_run: samples[name] });
  }
  for (const x of Object.values(loaded)) if (x && x.w) await x.w.terminate();
  write('bench-node-summary.json', { run_order: order, results });
  if (only) { console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { p50: v.p50, p95: v.p95, p99: v.p99, p999: v.p999, max: v.max, env: v.envelope.verdict + ' ' + v.envelope.max_drift_pct + '%' }])), null, 1)); return; }
  // Golden output: top-10 ids per query for A-full and C-full, and their agreement.
  const golden = {};
  for (const name of ['A-full', 'C-full']) golden[name] = queries.map((q) => CANDS[name].search(loaded[name], q).map((r) => r.id));
  let top3same = 0, top3overlap = 0, top10overlap = 0, nonempty = 0;
  for (let i = 0; i < queries.length; i++) {
    const a = golden['A-full'][i], c = golden['C-full'][i];
    if (!a.length && !c.length) continue;
    nonempty++;
    if (a.slice(0, 3).join() === c.slice(0, 3).join()) top3same++;
    top3overlap += a.slice(0, 3).filter((id) => c.slice(0, 3).includes(id)).length / Math.max(1, Math.min(3, a.length));
    top10overlap += a.filter((id) => c.includes(id)).length / Math.max(1, a.length);
  }
  const gtext = JSON.stringify({ queries, top10: golden['A-full'] });
  write('golden-A-full-top10.json', { note: 'candidate A top-10 ids per query; optimisation must keep top-3 identical (REQ-O2)', queries, top10: golden['A-full'] });
  const agreement = { nonempty_queries: nonempty, identical_top3_order: top3same, identical_top3_rate: +(top3same / nonempty).toFixed(4), mean_top3_overlap: +(top3overlap / nonempty).toFixed(4), mean_top10_overlap: +(top10overlap / nonempty).toFixed(4) };
  write('golden-agreement-A-vs-C.json', agreement);
  fs.writeFileSync(path.join(OUT, 'golden_checksums.txt'), `${crypto.createHash('sha256').update(gtext).digest('hex')}  golden-A-full-top10 (sha256 of JSON {queries, top10})\n`);
  console.log(JSON.stringify({ results: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { p50: v.p50, p95: v.p95, p99: v.p99, p999: v.p999, max: v.max, env: v.envelope.verdict + ' ' + v.envelope.max_drift_pct + '%' }])), agreement }, null, 1));
}

function instrument() {
  const idx = A.hydrate(readData('a-full.json'));
  for (let w = 0; w < WARMUP; w++) for (const q of queries) A.search(idx, q);
  const per = [];
  const tot = { tokenize: 0, lookup: 0, score: 0, sort: 0, materialize: 0, expandedTerms: 0, candidates: 0 };
  for (let run = 0; run < RUNS; run++) {
    queries.forEach((q, i) => {
      const p = { tokenize: 0, lookup: 0, score: 0, sort: 0, materialize: 0, expandedTerms: 0, candidates: 0 };
      A.search(idx, q, 10, p);
      for (const k in tot) tot[k] += p[k];
      if (run === 0) per.push({ q, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.round(v * 1e4) / 1e4])) });
    });
  }
  const stage = ['tokenize', 'lookup', 'score', 'sort', 'materialize'];
  const total = stage.reduce((s, k) => s + tot[k], 0);
  const spans = stage.map((k) => ({ span: 'engineA.' + k, cumulative_ms: +tot[k].toFixed(3), share: +(tot[k] / total).toFixed(4) }));
  const worst = [...per].sort((a, b) => (b.score + b.sort + b.lookup) - (a.score + a.sort + a.lookup)).slice(0, 15);
  write('span_summary-node-A-full.json', { note: 'profiling-only per-stage timers (engine-a search(prof)); 20 passes over the query set', passes: RUNS, queries: queries.length, spans, mean_expanded_terms_per_query: +(tot.expandedTerms / (RUNS * queries.length)).toFixed(1), mean_candidates_per_query: +(tot.candidates / (RUNS * queries.length)).toFixed(1), worst_queries_first_pass: worst, per_query_first_pass: per });
  console.log(JSON.stringify({ spans, mean_candidates: tot.candidates / (RUNS * queries.length), mean_expanded: tot.expandedTerms / (RUNS * queries.length), worst: worst.slice(0, 5) }, null, 1));
}

function cpuprof() {
  const c = CANDS[CAND];
  const x = c.hydrate(readData(c.file));
  for (let pass = 0; pass < 8; pass++) for (const q of queries) c.search(x, q);
}

function hydrateChild() {
  const c = CANDS[CAND];
  const times = [];
  const text = readData(c.file);
  let keep = null;
  for (let i = 0; i < WARMUP + RUNS; i++) {
    keep = null; global.gc();
    const t0 = performance.now();
    keep = c.hydrate(text);
    c.search(keep, 'rust'); // first answer
    const dt = performance.now() - t0;
    if (i >= WARMUP) times.push(dt);
  }
  keep = null; global.gc(); global.gc();
  const before = process.memoryUsage().heapUsed;
  keep = c.hydrate(readData(c.file));
  global.gc(); global.gc();
  const after = process.memoryUsage().heapUsed;
  process.stdout.write(JSON.stringify({ candidate: CAND, file: c.file, hydrate_plus_first_answer_ms: summarize(times), retained_heap_bytes: after - before, keep: !!keep }));
}

function hydrateAll() {
  const out = {};
  for (const name of Object.keys(CANDS).filter((n) => !CANDS[n].async)) {
    const r = execFileSync(process.execPath, ['--expose-gc', path.join(HERE, 'bench-node.mjs'), 'hydrate-child', OUT, QUERIES, name], { env: process.env });
    out[name] = JSON.parse(r.toString());
  }
  write('hydrate-node.json', out);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { p50: v.hydrate_plus_first_answer_ms.p50, p95: v.hydrate_plus_first_answer_ms.p95, heapMB: +(v.retained_heap_bytes / 1048576).toFixed(2) }])), null, 1));
}

// Scaling law: corpus size axis (subset / replicated corpus; replication multiplies postings and
// candidates per query but not vocabulary) and query-length axis from the baseline raw samples.
async function scale() {
  const { buildA } = await import('./lib/build-a.mjs');
  const corpus = JSON.parse(fs.readFileSync(path.join(process.env.SCRATCH, 'corpus.json'), 'utf8'));
  const badge = (d) => d.verdict || d.license_class || '';
  const rows = [];
  for (const factor of [0.25, 0.5, 1, 2, 4]) {
    let docs;
    if (factor < 1) docs = corpus.filter((_, i) => i % Math.round(1 / factor) === 0);
    else docs = Array.from({ length: factor }, (_, k) => corpus.map((d) => ({ ...d, id: k ? `${d.id}#${k}` : d.id }))).flat();
    const a = A.hydrate(JSON.stringify(buildA(docs)));
    const c = C.build(docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, tags: d.tags, summary: d.summary, badge: badge(d) })));
    for (const [name, x, fn] of [['A', a, A.search], ['C', c, C.search]]) {
      for (let w = 0; w < 2; w++) for (const q of queries) fn(x, q);
      const t = [];
      for (let r = 0; r < 5; r++) for (const q of queries) { const t0 = performance.now(); fn(x, q); t.push(performance.now() - t0); }
      const s = summarize(t);
      rows.push({ engine: name, factor, docs: docs.length, p50: s.p50, p95: s.p95, p99: s.p99, max: s.max });
      console.error(name, factor, docs.length, s.p95);
    }
  }
  const base = Object.fromEntries(rows.filter((r) => r.factor === 1).map((r) => [r.engine, r.p95]));
  for (const r of rows) r.p95_multiple_vs_1x = +(r.p95 / base[r.engine]).toFixed(2);
  // query-length axis from baseline raw samples (engine-only, desktop)
  const byLen = {};
  const qs = JSON.parse(fs.readFileSync(QUERIES, 'utf8')).queries;
  for (const name of ['A-full', 'C-full', 'I1-full']) {
    const b = JSON.parse(fs.readFileSync(path.join(OUT, `baseline-node-${name}.json`), 'utf8'));
    const buckets = { '1 char': [], '2 chars': [], '3 chars': [], '4-6 chars': [], '7-12 chars': [], '13+ chars': [], 'typo variants': [] };
    b.raw_ms_by_run.forEach((run) => run.forEach((ms, i) => {
      const L = qs[i].q.length;
      const k = qs[i].variant === 'typo' ? 'typo variants' : L === 1 ? '1 char' : L === 2 ? '2 chars' : L === 3 ? '3 chars' : L <= 6 ? '4-6 chars' : L <= 12 ? '7-12 chars' : '13+ chars';
      buckets[k].push(ms);
    }));
    byLen[name] = Object.fromEntries(Object.entries(buckets).map(([k, v]) => { const s = summarize(v); return [k, { n: s.n, p50: s.p50, p95: s.p95, p99: s.p99 }]; }));
  }
  write('scaling-node.json', { note: 'corpus-size axis: factor<1 = every k-th doc; factor>1 = corpus replicated (ids suffixed), vocabulary unchanged. 5 runs x 1,165 queries per point, 2 warm-up passes.', corpus_axis: rows, query_length_axis: byLen });
}

// Golden check for the optimisation skill: recompute A's top 10 for every query and compare with
// golden-A-full-top10.json. Exit 1 if any query's top 3 differs (REQ-O2 golden-set identity);
// top 4-10 drift is reported, not failed. LIB (optional) points at an alternative lib/ directory.
async function verifyGolden() {
  const lib = process.env.LIB ? path.resolve(process.env.LIB) : path.join(HERE, 'lib');
  const E = await import(path.join(lib, 'engine-a.mjs'));
  const g = JSON.parse(fs.readFileSync(path.join(OUT, 'golden-A-full-top10.json'), 'utf8'));
  const idx = E.hydrate(readData('a-full.json'));
  let top3 = 0, tail = 0;
  const examples = [];
  g.queries.forEach((q, i) => {
    const got = E.search(idx, q).map((r) => r.id);
    const want = g.top10[i];
    if (got.slice(0, 3).join() !== want.slice(0, 3).join()) { top3++; if (examples.length < 5) examples.push({ q, want: want.slice(0, 3), got: got.slice(0, 3) }); }
    else if (got.join() !== want.join()) tail++;
  });
  const verdict = top3 === 0 ? 'PASS' : 'FAIL';
  console.log(JSON.stringify({ verdict, queries: g.queries.length, top3_changed: top3, top4_10_changed: tail, examples }));
  process.exitCode = top3 === 0 ? 0 : 1;
}

// Isomorphism check for engine-a-opt.mjs against the incumbent engine-a.mjs: every row (id and
// score, compared bit for bit) of the top 10, for (1) every probe query and (2) every query of the
// relevance golden set and every keystroke prefix of it, on the core and the full index. Exit 1 on
// any difference. Output: golden-diff.json in OUT. GOLDEN (optional) points at a golden.jsonl other
// than the working copy, e.g. `git show ebac079:.atlas-arc/eval/golden.jsonl` (the 88-query set).
function goldenDiff() {
  const goldenFile = process.env.GOLDEN ? path.resolve(process.env.GOLDEN) : path.join(HERE, '../../.atlas-arc/eval/golden.jsonl');
  const goldenText = fs.readFileSync(goldenFile, 'utf8');
  const golden = goldenText.trim().split('\n').map((l) => JSON.parse(l));
  const prefixes = [];
  for (const g of golden) for (let i = 1; i <= g.query.length; i++) prefixes.push(g.query.slice(0, i));
  const sets = { probe_queries: queries, relevance_golden_queries: golden.map((g) => g.query), relevance_golden_prefixes: prefixes };
  const variants = { 'A+L1': AO.searchL1, 'A+L1+L2': AO.search, 'A+L1+L2+L8': (idx, q) => { for (const ch of AO.ONE_CHAR) AO.fillOneChar(idx, ch); return AO.searchCached(idx, q); } };
  const same = (a, b) => a.length === b.length && a.every((r, i) => r.id === b[i].id && Object.is(r.score, b[i].score) && r.title === b[i].title && r.kind === b[i].kind && r.badge === b[i].badge);
  const out = { note: 'engine-a-opt.mjs vs engine-a.mjs, top-10 rows (id, score bit-identical, title, kind, badge)', golden_file_sha256: crypto.createHash('sha256').update(goldenText).digest('hex'), golden_queries: golden.length, results: [] };
  let bad = 0;
  for (const file of ['a-core.json', 'a-full.json']) {
    const idx = A.hydrate(readData(file));
    for (const [setName, qs] of Object.entries(sets)) {
      const want = qs.map((q) => A.search(idx, q));
      for (const [vName, fn] of Object.entries(variants)) {
        let changed = 0, rows = 0;
        const examples = [];
        qs.forEach((q, i) => { const got = fn(idx, q); rows += want[i].length; if (!same(got, want[i])) { changed++; if (examples.length < 3) examples.push({ q, want: want[i].slice(0, 3).map((r) => r.id), got: got.slice(0, 3).map((r) => r.id) }); } });
        bad += changed;
        out.results.push({ index: file, set: setName, variant: vName, queries: qs.length, rows_compared: rows, queries_changed: changed, examples });
      }
    }
  }
  out.verdict = bad === 0 ? 'PASS' : 'FAIL';
  const sha = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
  const idxFull = A.hydrate(readData('a-full.json'));
  out.sha256_top10_ids_relevance_golden_full = { incumbent: sha(sets.relevance_golden_queries.map((q) => A.search(idxFull, q).map((r) => r.id))), 'A+L1+L2': sha(sets.relevance_golden_queries.map((q) => AO.search(idxFull, q).map((r) => r.id))) };
  write('golden-diff.json', out);
  console.log(JSON.stringify({ verdict: out.verdict, changed: bad, checks: out.results.map((r) => `${r.index} ${r.set} ${r.variant}: ${r.queries_changed}/${r.queries}`) }, null, 1));
  process.exitCode = bad === 0 ? 0 : 1;
}

if (mode === 'baseline') await baseline();
else if (mode === 'instrument') instrument();
else if (mode === 'cpuprof') cpuprof();
else if (mode === 'hydrate-child') hydrateChild();
else if (mode === 'hydrate') hydrateAll();
else if (mode === 'scale') await scale();
else if (mode === 'verify-golden') await verifyGolden();
else if (mode === 'golden-diff') goldenDiff();
else throw new Error('unknown mode ' + mode);
