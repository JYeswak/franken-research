// Probe page: ?cand=A|B|C|I0|I1|none. Loads the core shard, answers a first query (search usable),
// then lazily loads the full index (and, for A/B/C, the quotes shard), then accepts typing.
// Every keystroke is timed from keydown.timeStamp to the first task after the next rAF
// (the frame containing the results has been produced) and reported to the harness binding.
import * as A from '../lib/engine-a.mjs';
import * as AO from '../lib/engine-a-opt.mjs';
import * as C from '../lib/engine-c.mjs';
import * as I from '../lib/incumbent.mjs';

const P = new URLSearchParams(location.search);
const cand = P.get('cand') || 'A';
const input = document.getElementById('q');
const list = document.getElementById('results');
const drop = document.getElementById('searchdrop');
const msg = document.getElementById('msg');
const S = (window.__state = { cand, marks: {}, coreReady: false, fullReady: false, quotesReady: false, errors: [] });
// Optimisation ladder for candidate A (lib/engine-a-opt.mjs; hand-off table of probe
// 20260925T005518Z-ebac079). Each rung adds one lever to the rung before it and is timed against
// it in the same invocation; a rejected lever is left out of the later rungs.
//   L1  bounded top-k selection              L2  dense typed-array accumulators
//   L3a results list: persistent row nodes, text updated in place (no HTML parse, no node churn)
//   L3b CSS containment and a fixed row height on the results list (REJECTED on the phone
//       profile, run 20260925T175730Z-4b31427 ladder-phone: p95 8.6 vs 8.0 ms, 3/10 paired runs)
//   L4  JIT warm-up: a few searches right after the full index is hydrated (REJECTED, run
//       20260925T175730Z-4b31427 ladder-phone-L4: p95 8.5 vs 8.0 ms, 5/10 paired runs)
// Kept: AL3 = L1 + L2 + L3a.
const LADDER = { AL1: ['L1'], AL2: ['L1', 'L2'], AL3: ['L1', 'L2', 'L3a'], AL4: ['L1', 'L2', 'L3a', 'L3b'], AL5: ['L1', 'L2', 'L3a', 'L4'] };
const levers = new Set(LADDER[cand] || []);
if (levers.has('L3b')) document.documentElement.classList.add('l3b');
const mark = (k) => { S.marks[k] = performance.now(); };
const report = (o) => { if (window.__probeReport) window.__probeReport(JSON.stringify(o)); };
window.addEventListener('error', (e) => S.errors.push(String(e.message)));
document.addEventListener('DOMContentLoaded', () => mark('dcl'));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderList(rows) {
  list.innerHTML = rows.map((r) => `<li><span class="t">${esc(r.title)}</span> <span class="k">${esc(r.kind)}</span> <span class="b">${esc(r.badge)}</span></li>`).join('');
}
// L3a: the same markup as renderList, built once per row slot and then updated in place: a keystroke
// writes only the text nodes whose value changed and toggles `hidden` on unused slots.
const slots = [];
function slot(i) {
  const li = document.createElement('li');
  const parts = ['t', 'k', 'b'].map((c) => { const s = document.createElement('span'); s.className = c; const t = document.createTextNode(''); s.appendChild(t); return { s, t }; });
  li.append(parts[0].s, ' ', parts[1].s, ' ', parts[2].s);
  list.appendChild(li);
  return (slots[i] = { li, t: parts[0].t, k: parts[1].t, b: parts[2].t });
}
function renderListInPlace(rows) {
  for (let i = 0; i < rows.length; i++) {
    const s = slots[i] || slot(i), r = rows[i];
    const t = String(r.title), k = String(r.kind), b = String(r.badge);
    if (s.t.data !== t) s.t.data = t;
    if (s.k.data !== k) s.k.data = k;
    if (s.b.data !== b) s.b.data = b;
    if (s.li.hidden) s.li.hidden = false;
  }
  for (let i = rows.length; i < slots.length; i++) if (!slots[i].li.hidden) slots[i].li.hidden = true;
}
// I0 renders as the shipped map does (app.src.js:875-894): one button per match, every match.
function renderDrop(rows) {
  drop.innerHTML = '';
  for (const r of rows) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'comb-opt'; b.setAttribute('role', 'option');
    b.innerHTML = '<span class="oname">' + esc(r.title) + '</span><span class="ometa">' + esc(r.badge) + '</span>';
    drop.appendChild(b);
  }
  drop.hidden = !rows.length;
  msg.textContent = rows.length ? rows.length + (rows.length === 1 ? ' match' : ' matches') : '';
}
const render = cand === 'I0' ? renderDrop : levers.has('L3a') ? renderListInPlace : renderList;

const nextPaint = () => new Promise((r) => requestAnimationFrame(() => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(performance.now()); ch.port2.postMessage(0); }));
function afterPaint(o) {
  requestAnimationFrame(() => {
    o.tRaf = performance.now();
    const ch = new MessageChannel();
    ch.port1.onmessage = () => { o.tPaint = performance.now(); report(o); };
    ch.port2.postMessage(0);
  });
}

async function fetchText(url, prefix) {
  mark(prefix + '_fetch_start');
  const r = await fetch(url);
  mark(prefix + '_headers');
  const t = await r.text();
  mark(prefix + '_body');
  S[prefix + '_encoding'] = r.headers.get('x-probe-encoding');
  return t;
}

// ---- engines ----
let idx = null; // main-thread index (A, C, I0, I1)
let searchFn = null;
let worker = null;
const pendingW = new Map();
let wseq = 0;
function workerCall(msgObj) {
  return new Promise((res) => { const seq = ++wseq; pendingW.set(seq, res); worker.postMessage({ ...msgObj, seq }); });
}

const FILES = { A: ['a-core.json', 'a-full.json'], B: ['a-core.json', 'a-full.json'], C: ['c-core.json', 'c-full.json'], I0: ['i0.json', null], I1: ['i1.json', null] };
const HYD = { A: A.hydrate, C: C.hydrate, I0: I.hydrate, I1: I.hydrate };
const SEARCH = { A: (x, q) => A.search(x, q), C: (x, q) => C.search(x, q), I0: (x, q) => I.search(x, q), I1: (x, q) => I.search(x, q, 10) };
for (const c of Object.keys(LADDER)) {
  FILES[c] = FILES.A; HYD[c] = A.hydrate;
  SEARCH[c] = LADDER[c].includes('L2') ? (x, q) => AO.search(x, q) : LADDER[c].includes('L1') ? (x, q) => AO.searchL1(x, q) : SEARCH.A;
}
// L4 warm-up strings: generic, and none of them is a query or a prefix of a query in queries.json.
const WARMUP = ['o', 'in', 'test', 'data s', 'x y', 'graph'];

async function boot() {
  mark('module_start');
  if (cand === 'none') { S.coreReady = S.fullReady = S.quotesReady = true; mark('usable'); return; }
  const [coreFile, fullFile] = FILES[cand];
  if (cand === 'B') {
    mark('core_fetch_start');
    worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const m = e.data; const f = pendingW.get(m.seq); if (f) { pendingW.delete(m.seq); f(m); } };
    const r1 = await workerCall({ op: 'load', file: '/data/' + coreFile });
    Object.assign(S, { core_worker: r1.t });
    mark('core_hydrated');
  } else {
    const text = await fetchText('/data/' + coreFile, 'core');
    idx = HYD[cand](text);
    mark('core_hydrated');
  }
  searchFn = SEARCH[cand];
  // First answer from the core shard: "search usable".
  const first = cand === 'B' ? (await workerCall({ op: 'search', q: 'rust' })).rows : searchFn(idx, 'rust');
  render(first);
  S.marks.usable = await nextPaint();
  S.coreReady = true;
  render([]);
  // Lazy full index: never blocks typing on the core shard.
  window.__setPhase('full');
  if (fullFile) {
    if (cand === 'B') {
      mark('full_fetch_start');
      const r2 = await workerCall({ op: 'load', file: '/data/' + fullFile });
      Object.assign(S, { full_worker: r2.t });
      mark('full_hydrated');
    } else {
      const t = await fetchText('/data/' + fullFile, 'full');
      const hyd = performance.now();
      idx = HYD[cand](t);
      mark('full_hydrated');
      S.full_hydrate_ms = performance.now() - hyd;
    }
  } else mark('full_hydrated');
  if (levers.has('L4')) for (const q of WARMUP) searchFn(idx, q);
  S.fullReady = true;
  // Lazy quotes shard (DEC-009): stored only, never indexed, never in core.
  window.__setPhase('quotes');
  if (cand === 'A' || cand === 'B' || cand === 'C') {
    const qt = await fetchText('/data/quotes.json', 'quotes');
    const t0 = performance.now();
    window.__quotes = JSON.parse(qt);
    S.quotes_parse_ms = performance.now() - t0;
  }
  mark('quotes_ready');
  S.quotesReady = true;
  window.__setPhase('idle');
}

// ---- typing path ----
// t0 handler start, t1 search done (for B: worker reply received), t2 DOM updated,
// t3 style+layout forced (the frame's main-thread layout work is done; only paint recording,
// raster and compositing remain), tRaf/tPaint first task after the next animation frame.
const layoutRoot = cand === 'I0' ? drop : list;
let keyTs = 0;
input.addEventListener('keydown', (e) => { keyTs = e.timeStamp; });
input.addEventListener('input', async () => {
  const tKey = keyTs;
  const t0 = performance.now();
  const q = input.value;
  let rows, workerSearch;
  if (cand === 'B') {
    const r = await workerCall({ op: 'search', q });
    rows = r.rows; workerSearch = r.t;
  } else rows = searchFn(idx, q);
  const t1 = performance.now();
  render(rows);
  const t2 = performance.now();
  void layoutRoot.offsetHeight;
  const t3 = performance.now();
  afterPaint({ q, tKey, t0, t1, t2, t3, workerSearch, n: rows.length });
});
window.__clear = () => { input.value = ''; render([]); };

boot().catch((e) => { S.errors.push(String(e && e.stack || e)); });
