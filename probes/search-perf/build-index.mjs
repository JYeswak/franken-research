// Build every candidate's serialized index from $SCRATCH/corpus.json into $SCRATCH/web/data/,
// with brotli (q11) and gzip (-9) siblings, and write sizes.json.
//   a-core.json / a-full.json        candidate A (and B) inverted index, JSON
//   a-full-qidx.json                 A with rigor-atlas evidence quotes indexed (DEC-009 "both ways")
//   c-core.json / c-full.json        candidate C: MiniSearch.toJSON()
//   quotes.json                      lazily loaded quotes shard, stored only, never core
//   i0.json / i1.json                incumbent: 44 repo names (data.js) / corpus titles
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { buildA } from './lib/build-a.mjs';
import { build as buildC } from './lib/engine-c.mjs';

const FR = process.env.FR, SCRATCH = process.env.SCRATCH;
if (!FR || !SCRATCH) throw new Error('need FR and SCRATCH');
const OUT = path.join(SCRATCH, 'web', 'data');
fs.mkdirSync(OUT, { recursive: true });

const corpus = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'corpus.json'), 'utf8'));
const quotes = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'quotes.json'), 'utf8'));
const badge = (d) => d.verdict || d.license_class || '';

const sizes = {};
function emit(name, text) {
  const buf = Buffer.from(text);
  const br = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
  const gz = zlib.gzipSync(buf, { level: 9 });
  fs.writeFileSync(path.join(OUT, name), buf);
  fs.writeFileSync(path.join(OUT, name + '.br'), br);
  sizes[name] = { raw: buf.length, gzip: gz.length, brotli: br.length };
}

const core = corpus.filter((d) => d.shard === 'core');
const full = corpus;
const cDocs = (docs) => docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, tags: d.tags, summary: d.summary, badge: badge(d) }));
const quoteText = Object.fromEntries(Object.entries(quotes).map(([id, qs]) => [id, qs.map((q) => q.quote).join(' ')]));

const t0 = Date.now();
emit('a-core.json', JSON.stringify(buildA(core)));
emit('a-full.json', JSON.stringify(buildA(full)));
emit('a-full-qidx.json', JSON.stringify(buildA(full, quoteText)));
emit('c-core.json', JSON.stringify(buildC(cDocs(core))));
emit('c-full.json', JSON.stringify(buildC(cDocs(full))));
emit('quotes.json', JSON.stringify(quotes));
// Incumbent I0: the 44 repo names the shipped map searches (site/assets/data.js).
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(FR, 'site/assets/data.js'), 'utf8'), sandbox);
const repos = sandbox.window.FRANKEN_DATA.repos;
emit('i0.json', JSON.stringify({ names: repos.map((r) => r.name), rows: repos.map((r) => ({ id: 'repo:' + r.name, kind: 'repo', title: r.name, badge: `${r.nodus} · ${r.ciKey}` })) }));
emit('i1.json', JSON.stringify({ names: full.map((d) => d.title), rows: full.map((d) => ({ id: d.id, kind: d.kind, title: d.title, badge: badge(d) })) }));

const a = JSON.parse(fs.readFileSync(path.join(OUT, 'a-full.json'), 'utf8'));
const meta = { build_ms: Date.now() - t0, docs: { core: core.length, full: full.length, i0: repos.length }, a_full_terms: a.terms.length, a_full_postings: a.post.reduce((s, p) => s + p.length / 4, 0) };
fs.writeFileSync(path.join(OUT, 'sizes.json'), JSON.stringify({ meta, sizes }, null, 1));
console.log(JSON.stringify({ meta, sizes }, null, 1));
