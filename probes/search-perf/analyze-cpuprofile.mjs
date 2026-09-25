// Attribute a V8 .cpuprofile (node --cpu-prof or CDP Profiler) to named stages.
// Usage: node analyze-cpuprofile.mjs file.cpuprofile [...]  → JSON on stdout
// Self time per function, inclusive time per stage function (a sample counts once per stage
// even under recursion), and the shares of non-idle time.
import fs from 'node:fs';
import path from 'node:path';

const STAGES = [
  // engine A (and B's worker)
  'tokenizeQuery', 'tokenize', 'lookupTerms', 'lowerBound', 'accumulateScores', 'selectTopK', 'popcount', 'materialize', 'hydrate',
  // MiniSearch 7.2.0
  'search', 'executeQuery', 'executeQuerySpec', 'termResults', 'atPrefix', 'combineResults', 'calcBM25Score', 'loadJSON', 'loadJS', 'objectToNumericMap',
  // incumbent
  'rankMatches',
  // page
  'renderList', 'renderDrop', 'afterPaint', 'workerCall', 'fetchText', 'boot',
  // natives / VM
  'sort', 'parse', 'stringify', 'postMessage', '(garbage collector)', '(program)', '(idle)', '(root)',
];

export function analyze(file) {
  const prof = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nodes = new Map(prof.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const dt = prof.timeDeltas;
  const self = new Map(), incl = new Map();
  let total = 0, idle = 0;
  const label = (n) => {
    const cf = n.callFrame;
    const f = cf.functionName || '(anonymous)';
    return cf.url ? `${f} ${path.basename(cf.url.split('?')[0])}:${cf.lineNumber + 1}` : f;
  };
  for (let i = 0; i < prof.samples.length; i++) {
    const us = i + 1 < dt.length ? dt[i + 1] : 0;
    if (us <= 0) continue;
    const leaf = nodes.get(prof.samples[i]);
    total += us;
    if (leaf.callFrame.functionName === '(idle)') { idle += us; continue; }
    const l = label(leaf);
    self.set(l, (self.get(l) || 0) + us);
    const seen = new Set();
    for (let id = leaf.id; id != null; id = parent.get(id)) {
      const fn = nodes.get(id).callFrame.functionName;
      if (STAGES.includes(fn) && !seen.has(fn)) { seen.add(fn); incl.set(fn, (incl.get(fn) || 0) + us); }
    }
  }
  const busy = total - idle;
  const ms = (us) => +(us / 1000).toFixed(2);
  return {
    file: path.basename(file),
    sampled_ms: ms(total), idle_ms: ms(idle), busy_ms: ms(busy),
    inclusive_stage_ms: Object.fromEntries([...incl].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, { ms: ms(v), share_of_busy: +(v / busy).toFixed(4) }])),
    top_self: [...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => ({ fn: k, self_ms: ms(v), share_of_busy: +(v / busy).toFixed(4) })),
  };
}

if (process.argv[1] && process.argv[1].endsWith('analyze-cpuprofile.mjs')) {
  const out = process.argv.slice(2).map(analyze);
  process.stdout.write(JSON.stringify(out, null, 1) + '\n');
}
