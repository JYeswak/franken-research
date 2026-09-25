// End-to-end browser harness over raw CDP (headless Chrome). One lever per mode:
//   node bench-browser.mjs timing  OUT QUERIES PROFILE   keystroke timing + load path + heap, 1 warm-up + RUNS runs
//   node bench-browser.mjs cpuprof OUT QUERIES PROFILE   Profiler domain: load phase and one typing pass per candidate
//   node bench-browser.mjs trace   OUT QUERIES PROFILE   devtools.timeline trace of one typing pass: paint/commit cost
//   node bench-browser.mjs longtasks OUT QUERIES PROFILE  diagnostic: charge each typing long task to a keystroke phase
// PROFILE: desktop (no throttle) | phone (4x CPU throttle, DevTools "Fast 4G", 390x844@3x, mobile).
// Env: SCRATCH (data), RUNS (default 20), CANDS (default A,B,C,I1,I0).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launch } from './lib/cdp.mjs';
import { serve } from './server.mjs';
import { summarize, envelope, mulberry32, shuffle } from './lib/stats.mjs';
import { artifactJSON } from './lib/artifact-json.mjs';

const [mode, OUT, QUERIES, PROFILE] = process.argv.slice(2);
const DATA = path.join(process.env.SCRATCH, 'web', 'data');
const RUNS = Number(process.env.RUNS || 20);
const CANDS = (process.env.CANDS || 'A,B,C,I1,I0').split(',');
const qset = JSON.parse(fs.readFileSync(QUERIES, 'utf8'));
// Chrome DevTools "Fast 4G" preset (front_end/core/sdk/NetworkManager.ts): 9 Mbps down, 1.5 Mbps up, x0.9; 60 ms x 2.75 RTT.
const FAST_4G = { offline: false, latency: 60 * 2.75, downloadThroughput: (9e6 / 8) * 0.9, uploadThroughput: (1.5e6 / 8) * 0.9, connectionType: 'cellular4g' };
const PROFILES = {
  desktop: { viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false }, cpu: 1, net: null },
  phone: { viewport: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, cpu: 4, net: FAST_4G },
};
const prof = PROFILES[PROFILE];
if (!prof) throw new Error('profile must be desktop|phone');
// Unthrottled frame production: headless frame cadence on this host is erratic (see fingerprint notes),
// so the primary metric stops at forced layout and the rAF metric is secondary.
const CHROME_FLAGS = ['--disable-frame-rate-limit', '--disable-gpu-vsync'];

const write = (name, obj) => { fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true }); fs.writeFileSync(path.join(OUT, name), artifactJSON(obj)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openPage(browser, cand, { profiler = false } = {}) {
  const p = await browser.newPage();
  const workers = [];
  // Workers are paused on attach so network emulation and (where supported) CPU throttling apply
  // before their first fetch; each step's outcome is recorded.
  const workerSetup = [];
  p.on('Target.attachedToTarget', async (ev) => {
    const sid = ev.sessionId;
    if (ev.targetInfo.type === 'worker') {
      workers.push(sid);
      const rec = { network: null, cpu: null };
      try {
        await p.send('Network.enable', {}, sid);
        await p.send('Network.setCacheDisabled', { cacheDisabled: true }, sid);
        if (prof.net) await p.send('Network.emulateNetworkConditions', prof.net, sid);
        rec.network = 'applied';
      } catch (e) { rec.network = 'unsupported: ' + e.message; }
      try { await p.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu }, sid); rec.cpu = 'applied'; } catch (e) { rec.cpu = 'unsupported: ' + e.message; }
      workerSetup.push(rec);
    }
    try { await p.send('Runtime.runIfWaitingForDebugger', {}, sid); } catch {}
  });
  await p.send('Page.enable');
  await p.send('Runtime.enable');
  await p.send('Network.enable');
  await p.send('Network.setCacheDisabled', { cacheDisabled: true });
  await p.send('Emulation.setDeviceMetricsOverride', prof.viewport);
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await p.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
  if (prof.net) await p.send('Network.emulateNetworkConditions', prof.net);
  await p.send('Runtime.addBinding', { name: '__probeReport' });
  await p.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  const reports = [];
  let waiter = null;
  p.on('Runtime.bindingCalled', (ev) => { if (ev.name === '__probeReport') { reports.push(JSON.parse(ev.payload)); if (waiter) { const w = waiter; waiter = null; w(); } } });
  const nextReport = () => new Promise((r) => { if (reports.length) r(); else waiter = r; });
  const ev = async (expression) => {
    const r = await p.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result.value;
  };
  if (profiler) { await p.send('Profiler.enable'); await p.send('Profiler.setSamplingInterval', { interval: 100 }); await p.send('Profiler.start'); }
  const loaded = p.once('Page.loadEventFired', () => true, 120000);
  await p.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?cand=${cand}` });
  await loaded;
  const st = await ev(`new Promise((r) => { const t0 = performance.now(); const f = () => (window.__state.quotesReady || window.__state.errors.length || performance.now() - t0 > 60000) ? r(window.__state) : setTimeout(f, 10); f(); })`);
  if (st.errors.length) throw new Error(cand + ' page errors: ' + st.errors.join('; '));
  if (!st.quotesReady) throw new Error(cand + ' did not finish loading');
  return { p, ev, reports, nextReport, workers, workerThrottle: workerSetup };
}

async function loadMetrics(page) {
  return page.ev(`(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource').filter((e) => e.name.includes('/data/')).map((e) => ({ name: e.name.split('/data/')[1], initiator: e.initiatorType, start: e.startTime, duration: e.duration, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize }));
    const S = window.__state;
    return { dcl: nav.domContentLoadedEventStart, load: nav.loadEventStart, marks: S.marks, core_worker: S.core_worker || null, full_worker: S.full_worker || null, full_hydrate_ms: S.full_hydrate_ms ?? null, quotes_parse_ms: S.quotes_parse_ms ?? null, encodings: { core: S.core_encoding || (S.core_worker && S.core_worker.encoding), full: S.full_encoding || (S.full_worker && S.full_worker.encoding), quotes: S.quotes_encoding }, resources: res, longtasks: window.__longtasks.map((e) => ({ ...e, phase: ['load', 'full', 'quotes', 'idle'].find((n) => window.__longtasksIn(n).includes(e)) || 'later' })) };
  })()`);
}

async function heap(page) {
  await page.p.send('HeapProfiler.collectGarbage');
  const main = await page.p.send('Runtime.getHeapUsage');
  const out = { main_used: main.usedSize, main_total: main.totalSize, worker_used: null };
  for (const sid of page.workers) {
    try { await page.p.send('HeapProfiler.collectGarbage', {}, sid); const w = await page.p.send('Runtime.getHeapUsage', {}, sid); out.worker_used = (out.worker_used || 0) + w.usedSize; } catch (e) { out.worker_error = e.message; }
  }
  return out;
}

const KEYCODE = (ch) => (ch === ' ' ? 32 : ch === '-' ? 189 : ch.toUpperCase().charCodeAt(0));
async function typeAll(page) {
  await page.ev(`(() => { window.__setPhase('typing'); document.getElementById('q').focus(); return true; })()`);
  page.reports.length = 0;
  const samples = [];
  for (const s of qset.typed) {
    await page.ev(`(() => { window.__clear(); document.getElementById('q').value = ${JSON.stringify(s.text.slice(0, s.from - 1))}; return true; })()`);
    for (let i = s.from - 1; i < s.text.length; i++) {
      const ch = s.text[i];
      const got = page.nextReport();
      await page.p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch, windowsVirtualKeyCode: KEYCODE(ch) });
      await page.p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, windowsVirtualKeyCode: KEYCODE(ch) });
      await got;
      const r = page.reports.shift();
      samples.push(r);
    }
  }
  const longtasks = await page.ev(`window.__longtasksIn('typing')`);
  const expect = qset.queries.map((x) => x.q);
  const mismatch = samples.findIndex((r, i) => r.q !== expect[i]);
  if (samples.length !== expect.length || mismatch >= 0) throw new Error(`typed ${samples.length} vs ${expect.length} queries; first mismatch at ${mismatch}: ${JSON.stringify(samples[mismatch]?.q)} vs ${JSON.stringify(expect[mismatch])}`);
  return { samples, longtasks };
}

const METRICS = {
  key2layout: (r) => r.t3 - r.tKey, // primary: keystroke -> results rendered and laid out
  key2paint: (r) => r.tPaint - r.tKey, // secondary: -> first task after the next animation frame
  inputDelay: (r) => r.t0 - r.tKey,
  search: (r) => r.t1 - r.t0, // B: postMessage round trip incl. worker search
  render: (r) => r.t2 - r.t1,
  layout: (r) => r.t3 - r.t2,
  toFrame: (r) => r.tPaint - r.t3,
};

let PORT;
async function timing() {
  const { server, port } = await serve(DATA); PORT = port;
  const browser = await launch(CHROME_FLAGS);
  const rnd = mulberry32(11);
  const acc = Object.fromEntries(CANDS.map((c) => [c, { samples: [], perRunP95: [], perRunKey2PaintP95: [], loads: [], heaps: [], longtasks: [], workerThrottle: null }]));
  const order = [];
  const baselineHeap = [];
  const t0 = Date.now();
  for (let run = 0; run <= RUNS; run++) { // run 0 = warm-up, discarded
    const cands = shuffle(CANDS, rnd);
    if (run > 0) order.push(cands);
    // control page (no index) for the heap baseline
    { const pg = await openPage(browser, 'none'); if (run > 0) baselineHeap.push((await heap(pg)).main_used); pg.p.close(); await browser.closeTarget(pg.p.targetId); }
    for (const cand of cands) {
      const pg = await openPage(browser, cand);
      await sleep(150); // let buffered long-task entries from the load phase arrive
      const lm = await loadMetrics(pg);
      const hp = await heap(pg);
      const { samples, longtasks } = await typeAll(pg);
      pg.p.close(); await browser.closeTarget(pg.p.targetId);
      if (run === 0) continue;
      const a = acc[cand];
      a.workerThrottle = pg.workerThrottle;
      const k2l = samples.map(METRICS.key2layout);
      const sK = summarize(k2l), sP = summarize(samples.map(METRICS.key2paint));
      a.perRunP95.push(sK.p95); a.perRunKey2PaintP95.push(sP.p95);
      a.samples.push(samples); a.loads.push(lm); a.heaps.push(hp); a.longtasks.push(longtasks);
      write(`runs/browser-${PROFILE}-${cand}-r${String(run).padStart(2, '0')}.json`, { candidate: cand, profile: PROFILE, run, metric: 'key2layout', ...sK, p95_ms: sK.p95, key2paint: sP, longtasks_typing: longtasks.length, longtask_max_ms: Math.max(0, ...longtasks.map((l) => l.dur)) });
    }
    console.error(`[${PROFILE}] run ${run}/${RUNS} done at ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close(); server.close();
  const results = {};
  const med = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
  for (const cand of CANDS) {
    const a = acc[cand];
    const flat = a.samples.flat();
    const metrics = Object.fromEntries(Object.entries(METRICS).map(([k, f]) => [k, summarize(flat.map(f))]));
    if (cand === 'B') {
      metrics.workerSearch = summarize(flat.map((r) => r.workerSearch));
      metrics.messageOverhead = summarize(flat.map((r) => r.t1 - r.t0 - r.workerSearch));
      // CDP cannot throttle dedicated workers ("only supported for pages"), so on the phone profile the
      // worker's search runs at 1x. [INFERENCE] estimate: add (rate-1) x the measured worker search time.
      if (prof.cpu > 1) metrics.key2layout_worker_scaled_estimate = summarize(flat.map((r) => r.t3 - r.tKey + (prof.cpu - 1) * r.workerSearch));
    }
    const load = {
      usable_after_dcl_ms: summarize(a.loads.map((l) => l.marks.usable - l.dcl)),
      core_hydrated_after_dcl_ms: summarize(a.loads.map((l) => l.marks.core_hydrated - l.dcl)),
      full_ready_after_dcl_ms: summarize(a.loads.map((l) => l.marks.full_hydrated - l.dcl)),
      quotes_ready_after_dcl_ms: summarize(a.loads.map((l) => l.marks.quotes_ready - l.dcl)),
      core_fetch_to_body_ms: a.loads[0].marks.core_body != null ? summarize(a.loads.map((l) => l.marks.core_body - l.marks.core_fetch_start)) : null,
      core_hydrate_ms: a.loads[0].marks.core_body != null ? summarize(a.loads.map((l) => l.marks.core_hydrated - l.marks.core_body)) : summarize(a.loads.map((l) => l.core_worker.hydrated - l.core_worker.body)),
      full_hydrate_ms: a.loads[0].full_hydrate_ms != null ? summarize(a.loads.map((l) => l.full_hydrate_ms)) : (a.loads[0].full_worker ? summarize(a.loads.map((l) => l.full_worker.hydrated - l.full_worker.body)) : null),
      quotes_parse_ms: a.loads[0].quotes_parse_ms != null ? summarize(a.loads.map((l) => l.quotes_parse_ms)) : null,
      encodings: a.loads[0].encodings,
      resources_run1: a.loads[0].resources,
      longtasks_during_load: { runs_with_any: a.loads.filter((l) => l.longtasks.length).length, max_ms: Math.max(0, ...a.loads.flatMap((l) => l.longtasks.map((t) => t.dur))), by_phase_run1: a.loads[0].longtasks },
    };
    if (cand === 'B' && prof.cpu > 1) load.usable_after_dcl_worker_scaled_estimate_ms = summarize(a.loads.map((l) => l.marks.usable - l.dcl + (prof.cpu - 1) * (l.core_worker.hydrated - l.core_worker.body)));
    const memory = { main_heap_used_bytes_median: med(a.heaps.map((h) => h.main_used)), control_page_heap_bytes_median: med(baselineHeap), index_main_heap_bytes: med(a.heaps.map((h) => h.main_used)) - med(baselineHeap), worker_heap_used_bytes_median: med(a.heaps.map((h) => h.worker_used)) };
    const lt = a.longtasks.flat();
    results[cand] = { candidate: cand, profile: PROFILE, queries: qset.queries.length, runs: RUNS, warmup_runs: 1, samples: flat.length, primary_metric: 'key2layout', metrics, envelope_key2layout: envelope(a.perRunP95), envelope_key2paint: envelope(a.perRunKey2PaintP95), load, memory, longtasks_typing: { count: lt.length, over_50ms: lt.filter((t) => t.dur > 50).length, max_ms: Math.max(0, ...lt.map((t) => t.dur)) }, worker_cpu_throttle: a.workerThrottle };
    const raw = a.samples.map((run) => run.map((r) => [+(r.t0 - r.tKey).toFixed(3), +(r.t1 - r.t0).toFixed(3), +(r.t2 - r.t1).toFixed(3), +(r.t3 - r.t2).toFixed(3), +(r.tPaint - r.t3).toFixed(3), r.workerSearch == null ? null : +r.workerSearch.toFixed(3)]));
    write(`baseline-browser-${PROFILE}-${cand}.json`, { ...results[cand], per_run_p95_key2layout: a.perRunP95, per_run_p95_key2paint: a.perRunKey2PaintP95, raw_columns: ['inputDelay', 'search', 'render', 'layout', 'toFrame', 'workerSearch'], raw_ms_by_run: raw });
  }
  write(`bench-browser-${PROFILE}-summary.json`, { chrome_flags: CHROME_FLAGS, profile: prof, run_order: order, wall_s: (Date.now() - t0) / 1000, results });
  for (const [c, r] of Object.entries(results)) console.log(PROFILE, c, JSON.stringify({ k2l: [r.metrics.key2layout.p50, r.metrics.key2layout.p95, r.metrics.key2layout.p99], k2p95: r.metrics.key2paint.p95, env: r.envelope_key2layout.verdict + ' ' + r.envelope_key2layout.max_drift_pct, usable_p95: r.load.usable_after_dcl_ms.p95, full_p95: r.load.full_ready_after_dcl_ms.p95, heapMB: +(r.memory.index_main_heap_bytes / 1048576).toFixed(2), lt: r.longtasks_typing, wt: r.worker_cpu_throttle }));
}

async function cpuprof() {
  const { server, port } = await serve(DATA); PORT = port;
  const browser = await launch(CHROME_FLAGS);
  for (const cand of CANDS) {
    // load phase: profiler started before navigation
    const pg = await openPage(browser, cand, { profiler: true });
    const loadProf = await pg.p.send('Profiler.stop');
    fs.writeFileSync(path.join(OUT, `cpu-browser-${PROFILE}-${cand}-load.cpuprofile`), JSON.stringify(loadProf.profile));
    // typing phase: one pass, main thread (and the worker for B)
    await pg.p.send('Profiler.start');
    for (const sid of pg.workers) { await pg.p.send('Profiler.enable', {}, sid); await pg.p.send('Profiler.setSamplingInterval', { interval: 100 }, sid); await pg.p.send('Profiler.start', {}, sid); }
    await typeAll(pg);
    const typing = await pg.p.send('Profiler.stop');
    fs.writeFileSync(path.join(OUT, `cpu-browser-${PROFILE}-${cand}-typing.cpuprofile`), JSON.stringify(typing.profile));
    for (const sid of pg.workers) {
      const w = await pg.p.send('Profiler.stop', {}, sid);
      fs.writeFileSync(path.join(OUT, `cpu-browser-${PROFILE}-${cand}-typing-worker.cpuprofile`), JSON.stringify(w.profile));
    }
    pg.p.close(); await browser.closeTarget(pg.p.targetId);
    console.error(`[cpuprof ${PROFILE}] ${cand} done`);
  }
  await browser.close(); server.close();
}

async function trace() {
  const { server, port } = await serve(DATA); PORT = port;
  const browser = await launch(CHROME_FLAGS);
  const out = {};
  for (const cand of CANDS) {
    const pg = await openPage(browser, cand);
    const events = [];
    const onData = (p) => { for (const e of p.value) events.push(e); };
    pg.p.on('Tracing.dataCollected', onData);
    await pg.p.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc'] }, transferMode: 'ReportEvents' });
    await typeAll(pg);
    const done = pg.p.once('Tracing.tracingComplete', () => true, 120000);
    await pg.p.send('Tracing.end');
    await done;
    pg.p.close(); await browser.closeTarget(pg.p.targetId);
    // renderer main thread = the thread carrying EventDispatch events
    const main = events.find((e) => e.name === 'EventDispatch');
    const mt = events.filter((e) => main && e.pid === main.pid && e.tid === main.tid && e.ph === 'X');
    const names = ['EventDispatch', 'FunctionCall', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'HitTest', 'GCEvent', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR'];
    const byName = {};
    for (const n of names) {
      const d = mt.filter((e) => e.name === n).map((e) => e.dur / 1000);
      if (d.length) byName[n] = { ...summarize(d), total_ms: +d.reduce((s, v) => s + v, 0).toFixed(2) };
    }
    const allMt = {};
    for (const e of mt) allMt[e.name] = (allMt[e.name] || 0) + e.dur / 1000;
    const top = Object.entries(allMt).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, v]) => ({ name: n, total_ms: +v.toFixed(2) }));
    out[cand] = { keystrokes: qset.queries.length, main_thread_events: byName, top_main_thread_event_totals: top };
    console.error(`[trace ${PROFILE}] ${cand}: Paint p95 ${byName.Paint?.p95} ms, Commit p95 ${byName.Commit?.p95}, PrePaint p95 ${byName.PrePaint?.p95}`);
  }
  write(`trace-summary-browser-${PROFILE}.json`, { note: 'one typing pass per candidate; durations of renderer main-thread trace events (ms). Inclusive events nest (EventDispatch contains FunctionCall).', chrome_flags: CHROME_FLAGS, results: out });
  await browser.close(); server.close();
}
// Long-task attribution: for each long task while typing, the keystroke whose [keydown, next frame]
// window overlaps it and that keystroke's phase breakdown, so a long task can be charged to search,
// render, layout, or the frame (paint/commit/compositor), and host load recorded alongside.
async function longtasks() {
  const { server, port } = await serve(DATA); PORT = port;
  const browser = await launch(CHROME_FLAGS);
  const passes = Number(process.env.LT_PASSES || 3);
  const out = {};
  for (const cand of CANDS) {
    out[cand] = [];
    for (let i = 0; i < passes; i++) {
      const la0 = os.loadavg()[0];
      const pg = await openPage(browser, cand);
      const { samples, longtasks: lts } = await typeAll(pg);
      pg.p.close(); await browser.closeTarget(pg.p.targetId);
      const r2 = (v) => +v.toFixed(2);
      const hits = lts.map((lt) => {
        const s = samples.find((x) => x.tKey - 1 <= lt.start + lt.dur && x.tPaint + 1 >= lt.start);
        return { start: r2(lt.start), dur: r2(lt.dur), q: s ? s.q : null, phase_ms: s ? { inputDelay: r2(s.t0 - s.tKey), search: r2(s.t1 - s.t0), render: r2(s.t2 - s.t1), layout: r2(s.t3 - s.t2), toFrame: r2(s.tPaint - s.t3) } : null };
      });
      out[cand].push({ pass: i + 1, loadavg_1m_start: +la0.toFixed(1), loadavg_1m_end: +os.loadavg()[0].toFixed(1), longtasks: hits });
      console.error(`[longtasks ${PROFILE}] ${cand} pass ${i + 1}: ${hits.length} long tasks, load ${la0.toFixed(1)}`);
    }
  }
  write(`longtasks-browser-${PROFILE}.json`, { note: 'diagnostic passes, separate from the timing runs', chrome_flags: CHROME_FLAGS, results: out });
  await browser.close(); server.close();
}

if (mode === 'timing') await timing();
else if (mode === 'cpuprof') await cpuprof();
else if (mode === 'trace') await trace();
else if (mode === 'longtasks') await longtasks();
else throw new Error('unknown mode ' + mode);
