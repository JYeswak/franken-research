// Candidate B: engine A inside a module Web Worker. The worker fetches and hydrates its own
// shards; the main thread only posts queries and renders the returned rows.
import { hydrate, search } from '../lib/engine-a.mjs';

let idx = null;
self.onmessage = async (e) => {
  const m = e.data;
  if (m.op === 'load') {
    const t = { start: performance.now() };
    const r = await fetch(m.file);
    t.headers = performance.now();
    const text = await r.text();
    t.body = performance.now();
    idx = hydrate(text);
    t.hydrated = performance.now();
    t.encoding = r.headers.get('x-probe-encoding');
    self.postMessage({ seq: m.seq, t });
  } else if (m.op === 'search') {
    const t0 = performance.now();
    const rows = search(idx, m.q);
    self.postMessage({ seq: m.seq, rows, t: performance.now() - t0 });
  }
};
