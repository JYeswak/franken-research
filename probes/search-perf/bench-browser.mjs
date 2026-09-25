// End-to-end browser harness over raw CDP (headless Chrome). One lever per mode:
//   node bench-browser.mjs timing  OUT QUERIES PROFILE   keystroke timing + load path + heap, 1 warm-up + RUNS runs
//   node bench-browser.mjs cpuprof OUT QUERIES PROFILE   Profiler domain: load phase and one typing pass per candidate
//   node bench-browser.mjs trace   OUT QUERIES PROFILE   devtools.timeline trace of one typing pass: paint/commit cost
//   node bench-browser.mjs longtasks OUT QUERIES PROFILE  diagnostic: charge each typing long task to a keystroke phase
//   node bench-browser.mjs frames  OUT QUERIES PROFILE   diagnostic: trace one typing pass; per keystroke, where the
//                                                         time from keydown to the paint proxy goes (main-thread work vs wait)
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
// Unthrottled frame production (no vsync wait). The primary metric is key2paint, keystroke to the first
// task after the frame that carries the results, because REQ-O2's budget is "keystroke to results
// painted" (review 7d). key2layout (to forced style and layout) is kept as a component view; it excludes
// the frame and cannot carry a REQ-O2 verdict.
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
  key2layout: (r) => r.t3 - r.tKey, // component view: keystroke -> results rendered and laid out
  key2paint: (r) => r.tPaint - r.tKey, // primary (REQ-O2): -> first task after the frame carrying the results
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
      // Each long task is charged to the keystroke whose [keydown, paint proxy] window overlaps it.
      const posOf = [];
      for (const s of qset.typed) for (let i = s.from - 1, k = 0; i < s.text.length; i++, k++) posOf.push(k);
      const r2 = (v) => +v.toFixed(2);
      const lts = longtasks.map((lt) => {
        const i = samples.findIndex((x) => x.tKey - 1 <= lt.start + lt.dur && x.tPaint + 1 >= lt.start);
        const s = samples[i];
        return { run, start: r2(lt.start), dur: r2(lt.dur), q_index: i, pos_after_reset: i >= 0 ? posOf[i] : null, phase_ms: s ? { inputDelay: r2(s.t0 - s.tKey), search: r2(s.t1 - s.t0), render: r2(s.t2 - s.t1), layout: r2(s.t3 - s.t2), toFrame: r2(s.tPaint - s.t3) } : null };
      });
      a.samples.push(samples); a.loads.push(lm); a.heaps.push(hp); a.longtasks.push(lts);
      write(`runs/browser-${PROFILE}-${cand}-r${String(run).padStart(2, '0')}.json`, { candidate: cand, profile: PROFILE, run, metric: 'key2paint', ...sP, p95_ms: sP.p95, key2layout: sK, longtasks_typing: longtasks.length, longtask_max_ms: Math.max(0, ...longtasks.map((l) => l.dur)) });
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
    results[cand] = { candidate: cand, profile: PROFILE, queries: qset.queries.length, runs: RUNS, warmup_runs: 1, samples: flat.length, primary_metric: 'key2paint', metrics, envelope_key2layout: envelope(a.perRunP95), envelope_key2paint: envelope(a.perRunKey2PaintP95), load, memory, longtasks_typing: { count: lt.length, over_50ms: lt.filter((t) => t.dur > 50).length, max_ms: Math.max(0, ...lt.map((t) => t.dur)), entries: lt }, worker_cpu_throttle: a.workerThrottle };
    const raw = a.samples.map((run) => run.map((r) => [+(r.t0 - r.tKey).toFixed(3), +(r.t1 - r.t0).toFixed(3), +(r.t2 - r.t1).toFixed(3), +(r.t3 - r.t2).toFixed(3), +(r.tPaint - r.t3).toFixed(3), r.workerSearch == null ? null : +r.workerSearch.toFixed(3)]));
    write(`baseline-browser-${PROFILE}-${cand}.json`, { ...results[cand], per_run_p95_key2layout: a.perRunP95, per_run_p95_key2paint: a.perRunKey2PaintP95, raw_columns: ['inputDelay', 'search', 'render', 'layout', 'toFrame', 'workerSearch'], raw_ms_by_run: raw });
  }
  write(`bench-browser-${PROFILE}-summary.json`, { chrome_flags: CHROME_FLAGS, profile: prof, run_order: order, wall_s: (Date.now() - t0) / 1000, results });
  for (const [c, r] of Object.entries(results)) console.log(PROFILE, c, JSON.stringify({ k2p: [r.metrics.key2paint.p50, r.metrics.key2paint.p95, r.metrics.key2paint.p99], k2l95: r.metrics.key2layout.p95, env: r.envelope_key2paint.verdict + ' ' + r.envelope_key2paint.max_drift_pct, usable_p95: r.load.usable_after_dcl_ms.p95, full_p95: r.load.full_ready_after_dcl_ms.p95, heapMB: +(r.memory.index_main_heap_bytes / 1048576).toFixed(2), lt: { count: r.longtasks_typing.count, over_50ms: r.longtasks_typing.over_50ms, max_ms: r.longtasks_typing.max_ms }, wt: r.worker_cpu_throttle }));
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

// Frame attribution (diagnostic; tracing perturbs timing, so no budget verdict comes from it). One typing
// pass per candidate under a trace. Each keystroke is aligned by its own `input` EventDispatch (= t0, the
// handler start), so no global clock offset is assumed. For the window [keydown, paint proxy] the renderer
// main thread is split into busy (union of its trace events) and idle, and busy time is charged to named
// events. Keystrokes whose key2paint exceeds TAIL_MS (default 32 = 2 x the phone budget) are listed.
async function frames() {
  const { server, port } = await serve(DATA); PORT = port;
  const browser = await launch(CHROME_FLAGS);
  const TAIL = Number(process.env.TAIL_MS || 32);
  const NAMES = ['EventDispatch', 'FunctionCall', 'FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'HitTest', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR', 'V8.GCIncrementalMarking', 'TimerFire', 'ParseHTML', 'ScheduleStyleRecalculation'];
  const out = {};
  for (const cand of CANDS) {
    const pg = await openPage(browser, cand);
    const events = [];
    pg.p.on('Tracing.dataCollected', (p) => { for (const e of p.value) events.push(e); });
    await pg.p.send('Tracing.start', { traceConfig: { includedCategories: ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'v8', 'disabled-by-default-v8.gc', 'gpu', 'viz'] }, transferMode: 'ReportEvents' });
    const { samples } = await typeAll(pg);
    const done = pg.p.once('Tracing.tracingComplete', () => true, 300000);
    await pg.p.send('Tracing.end');
    await done;
    pg.p.close(); await browser.closeTarget(pg.p.targetId);
    const inputs = events.filter((e) => e.name === 'EventDispatch' && e.ph === 'X' && e.args?.data?.type === 'input').sort((a, b) => a.ts - b.ts);
    if (inputs.length !== samples.length) throw new Error(`${cand}: ${inputs.length} input dispatches vs ${samples.length} samples`);
    const { pid, tid } = inputs[0];
    const mt = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X' && e.dur > 0).sort((a, b) => a.ts - b.ts);
    // keystroke position after each script reset of the box (0 = first typed key)
    const posOf = [];
    for (const s of qset.typed) for (let i = s.from - 1, k = 0; i < s.text.length; i++, k++) posOf.push(k);
    const rows = samples.map((s, i) => {
      const at = (t) => inputs[i].ts + (t - s.t0) * 1000; // performance.now() ms -> trace us, anchored at this keystroke's t0
      const w0 = at(s.tKey), w1 = at(s.tPaint);
      let busy = 0, cur0 = -1, cur1 = -1;
      const byName = {};
      for (const e of mt) {
        if (e.ts > w1) break;
        const a = Math.max(e.ts, w0), b = Math.min(e.ts + e.dur, w1);
        if (b <= a) continue;
        if (NAMES.includes(e.name)) byName[e.name] = (byName[e.name] || 0) + (b - a) / 1000;
        if (a > cur1) { if (cur1 > cur0) busy += cur1 - cur0; cur0 = a; cur1 = b; } else if (b > cur1) cur1 = b;
      }
      if (cur1 > cur0) busy += cur1 - cur0;
      const k2p = s.tPaint - s.tKey;
      return { q: s.q, pos: posOf[i], k2p, w0, w1, busy: busy / 1000, idle: k2p - busy / 1000, phases: { inputDelay: s.t0 - s.tKey, search: s.t1 - s.t0, render: s.t2 - s.t1, layout: s.t3 - s.t2, toFrame: s.tPaint - s.t3 }, byName };
    });
    const r2 = (v) => +v.toFixed(2);
    const agg = (rs) => {
      const names = {};
      for (const r of rs) for (const [n, v] of Object.entries(r.byName)) names[n] = (names[n] || 0) + v;
      return { n: rs.length, k2p: summarize(rs.map((r) => r.k2p)), busy: summarize(rs.map((r) => r.busy)), idle: summarize(rs.map((r) => r.idle)), mean_ms_by_event: Object.fromEntries(Object.entries(names).sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, r2(v / rs.length)])) };
    };
    const tail = rows.filter((r) => r.k2p > TAIL);
    // Off-main-thread work during tail windows: every thread's trace events, charged as thread:event.
    const tname = {};
    for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') tname[e.pid + ':' + e.tid] = e.args.name;
    const other = events.filter((e) => e.ph === 'X' && e.dur > 0 && !(e.pid === pid && e.tid === tid));
    const offMain = {};
    for (const r of tail) for (const e of other) {
      const a = Math.max(e.ts, r.w0), b = Math.min(e.ts + e.dur, r.w1);
      if (b > a) { const k = (tname[e.pid + ':' + e.tid] || 'tid' + e.tid) + ':' + e.name; offMain[k] = (offMain[k] || 0) + (b - a) / 1000; }
    }
    const posHist = {};
    for (const r of tail) posHist[r.pos] = (posHist[r.pos] || 0) + 1;
    // Timeline of the first three tail windows: every top-level task on any thread of the page's renderer
    // and the GPU process, with its posting location, so the task that ends an idle gap is named.
    const tl = tail.slice(0, 3).map((r) => ({ q: r.q, pos: r.pos, k2p: r2(r.k2p), events: events
      .filter((e) => e.ph === 'X' && e.ts < r.w1 && e.ts + (e.dur || 0) > r.w0 && (e.name.includes('RunTask') || ['EventDispatch', 'FireAnimationFrame', 'BeginFrame', 'BeginMainThreadFrame', 'Commit', 'Paint', 'TimerFire', 'Graphics.Pipeline'].includes(e.name)))
      .sort((a, b) => a.ts - b.ts)
      .map((e) => ({ t: r2((e.ts - r.w0) / 1000), dur: r2((e.dur || 0) / 1000), thread: tname[e.pid + ':' + e.tid] || 'tid' + e.tid, name: e.name, from: e.args?.src_func || e.args?.src_file ? `${e.args.src_file || ''}:${e.args.src_func || ''}` : undefined }))
      .filter((e) => e.dur >= 0.05) }));
    out[cand] = {
      all: agg(rows), tail: agg(tail), tail_threshold_ms: TAIL,
      tail_by_position_after_reset: posHist,
      tail_off_main_thread_mean_ms: Object.fromEntries(Object.entries(offMain).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, v]) => [n, r2(v / Math.max(1, tail.length))])),
      tail_keystrokes: tail.map((r) => ({ q: r.q, pos: r.pos, k2p: r2(r.k2p), busy: r2(r.busy), idle: r2(r.idle), phases: Object.fromEntries(Object.entries(r.phases).map(([k, v]) => [k, r2(v)])), byName: Object.fromEntries(Object.entries(r.byName).filter(([, v]) => v >= 0.5).map(([k, v]) => [k, r2(v)])) })),
      tail_timelines: tl,
    };
    console.error(`[frames ${PROFILE}] ${cand}: k2p p95 ${out[cand].all.k2p.p95}, tail ${tail.length} (> ${TAIL} ms), tail idle p50 ${out[cand].tail.idle.p50} ms, busy p50 ${out[cand].tail.busy.p50} ms`);
  }
  write(`frames-browser-${PROFILE}.json`, { note: 'diagnostic trace pass (tracing perturbs timing); busy = union of renderer main-thread trace events inside [keydown, paint proxy], idle = the rest', chrome_flags: CHROME_FLAGS, results: out });
  await browser.close(); server.close();
}

if (mode === 'timing') await timing();
else if (mode === 'cpuprof') await cpuprof();
else if (mode === 'trace') await trace();
else if (mode === 'longtasks') await longtasks();
else if (mode === 'frames') await frames();
else throw new Error('unknown mode ' + mode);
