// Build the realistic ~4k-entry probe corpus from real local sources. Probe-only: output goes to
// $SCRATCH, never into the repo. Deterministic (sorted inputs, no timestamps).
//
// Env: FR (franken-research root), SCRATCH (output dir), CRATES_TSV (eco2-crates.tsv),
//      RIGOR_DB (a COPY of rigor-atlas/data/rigor.sqlite; opened read-only).
// Output: $SCRATCH/corpus.json  [{id, kind, title, summary, tags, repo, verdict?, license_class, shard}]
//         $SCRATCH/quotes.json  {docId: [{path, line, quote}]}  (DEC-009: separate lazy shard)
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const FR = process.env.FR;
const SCRATCH = process.env.SCRATCH;
const CRATES_TSV = process.env.CRATES_TSV;
const RIGOR_DB = process.env.RIGOR_DB;
for (const [k, v] of Object.entries({ FR, SCRATCH, CRATES_TSV, RIGOR_DB })) if (!v) throw new Error('missing env ' + k);

const SUMMARY_CAP = Number(process.env.SUMMARY_CAP || 280);
const read = (p) => fs.readFileSync(path.join(FR, p), 'utf8');

// Markdown/HTML → plain text for summaries (cheap, good enough for a speed probe).
function plain(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function cap(s, n = SUMMARY_CAP) {
  s = plain(s);
  if (s.length <= n) return s;
  const cut = s.lastIndexOf(' ', n);
  return s.slice(0, cut > n * 0.6 ? cut : n) + '…';
}
// Split a markdown file into sections at headings matching `re` (applied per line).
function sections(text, re) {
  const lines = text.split('\n');
  const out = [];
  let cur = null;
  for (const line of lines) {
    const m = re.exec(line);
    if (m) { if (cur) out.push(cur); cur = { m, body: [] }; continue; }
    if (cur && /^#{1,2} /.test(line) && !re.test(line)) { out.push(cur); cur = null; continue; }
    if (cur) cur.body.push(line);
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ m: s.m, body: s.body.join('\n') }));
}

const docs = [];
const quotes = {};
const FR_LICENSE = 'MIT (Franken Research)';
function add(d) {
  docs.push({
    id: d.id, kind: d.kind, title: plain(d.title), summary: cap(d.summary || ''),
    tags: (d.tags || []).filter(Boolean).map(String).join(' '), repo: d.repo || '',
    ...(d.verdict ? { verdict: String(d.verdict) } : {}), license_class: d.license_class || FR_LICENSE, shard: d.shard,
  });
}

// 1. Rigor practices (136)
{
  const rows = read('stack/rigor-practices.tsv').trim().split('\n');
  const head = rows.shift().split('\t');
  const col = (r, n) => r[head.indexOf(n)];
  for (const line of rows) {
    const r = line.split('\t');
    add({ id: 'fr:' + col(r, 'id'), kind: 'practice', title: col(r, 'practice'), summary: col(r, 'what_to_copy'),
      tags: [col(r, 'areas'), col(r, 'checklist')], repo: col(r, 'evidenced_in'), verdict: col(r, 'our_status'), shard: 'core' });
  }
}
// 2. Execution-readiness gates (23)
for (const s of sections(read('synthesis/planning/execution-readiness.md'), /^## Gate (\d+) — (.*)$/)) {
  const prev = /PREVALENCE[^\n]*/.exec(s.body);
  add({ id: 'fr:gate-' + s.m[1], kind: 'readiness-gate', title: `Gate ${s.m[1]}: ${s.m[2]}`, summary: s.body, tags: ['gate', prev ? prev[0] : ''], verdict: prev ? plain(prev[0]).slice(0, 40) : '', shard: 'core' });
}
// 3. Techniques (14)
for (const s of sections(read('synthesis/cross-pollination.md'), /^## (\d+)\. (.*)$/))
  add({ id: 'fr:technique-' + s.m[1], kind: 'technique', title: s.m[2], summary: s.body, tags: ['technique', 'cross-pollination'], shard: 'core' });
// 4. Failure modes (11)
for (const s of sections(read('synthesis/negative-patterns.md'), /^## (P\d+) — (.*)$/)) {
  const tier = /\[([^\]]+)\]/.exec(s.m[2]);
  add({ id: 'fr:fm-' + s.m[1], kind: 'failure-mode', title: s.m[2].replace(/\[[^\]]*\]/, '').trim(), summary: s.body, tags: ['failure mode', s.m[1]], verdict: tier ? tier[1] : '', shard: 'core' });
}
// 5. Lessons (55)
{
  const html = read('site/lessons/index.html');
  const re = /<li><span class="r">(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/span>([\s\S]*?)<\/li>/g;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    const text = plain(m[2]);
    add({ id: 'fr:lesson-' + String(i).padStart(2, '0'), kind: 'lesson', title: text.split(/(?<=[.:;])\s/)[0].slice(0, 120), summary: text, tags: ['lesson', m[1]], repo: m[1], shard: 'core' });
  }
}
// 6. Starter-kit checklist (28)
for (const s of sections(read('starter-kit/CHECKLIST.md'), /^### ([AB]\d+) — (.*)$/))
  add({ id: 'fr:CK-' + s.m[1], kind: 'checklist', title: `${s.m[1]}: ${s.m[2]}`, summary: s.body, tags: ['checklist', 'starter kit', s.m[1]], shard: 'core' });
// 7. Stack verdicts (21) + their "Copy these practices" bullets
for (const f of fs.readdirSync(path.join(FR, 'stack')).filter((f) => f.endsWith('.md')).sort()) {
  const text = read('stack/' + f);
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm || !/^verdict:/m.test(fm[1])) continue;
  const meta = Object.fromEntries(fm[1].split('\n').map((l) => l.split(/:\s*/, 2)));
  const slug = f.replace(/\.md$/, '');
  const body = text.slice(fm[0].length);
  const bottom = /## Bottom line\n([\s\S]*?)\n## /.exec(body);
  add({ id: 'fr:stack-' + slug, kind: 'stack-verdict', title: meta.title, summary: bottom ? bottom[1] : '', tags: [meta.group, slug, 'stack'], verdict: meta.verdict, shard: 'core' });
  const copy = /## Copy these practices\n([\s\S]*?)\n## /.exec(body);
  if (copy) {
    let n = 0;
    for (const b of copy[1].split('\n').filter((l) => /^[-*] /.test(l))) {
      n++;
      const t = plain(b.replace(/^[-*] /, ''));
      add({ id: `fr:stack-${slug}-copy-${n}`, kind: 'stack-practice', title: t.split(/(?<=[.:])\s/)[0].slice(0, 120), summary: t, tags: [meta.title, slug, 'copy'], shard: 'core' });
    }
  }
}
// 8. Vendor-port techniques, apply-this catalog, proposed gates (60)
{
  const text = read('synthesis/vendor-port-learnings.md');
  const re = /^\*\*((?:T-[CBN]|A|G)\d+)\. ([^*]+?)\*\*([\s\S]*?)(?=^\*\*(?:T-[CBN]|A|G)\d+\. |^#{1,3} |$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(text))) add({ id: 'fr:VP-' + m[1], kind: 'port-technique', title: `${m[1]}: ${m[2]}`, summary: m[3], tags: ['vendor port', m[1]], shard: 'core' });
}
// 9. Shared gate specs (18)
for (const s of sections(read('ecosystem/pickup/shared-gates.md'), /^### (GATE-\d+) v[\d.]+ — (.*)$/))
  add({ id: 'fr:' + s.m[1], kind: 'gate-spec', title: `${s.m[1]}: ${s.m[2]}`, summary: s.body, tags: ['gate', 'ecosystem'], shard: 'core' });
// 10. Packets: TL;DR (44, core) and Franken-worthy next steps (deep)
for (const f of fs.readdirSync(path.join(FR, 'packets')).filter((f) => f.endsWith('-assessment.md')).sort()) {
  const text = read('packets/' + f);
  const name = f.replace(/-assessment\.md$/, '');
  const lic = /\*\*License:?\*\*:?\s*([^·\n]+)/.exec(text);
  const tldr = /## TL;DR\n([\s\S]*?)\n## /.exec(text);
  add({ id: 'fr:packet-' + name, kind: 'packet', title: `${name} assessment`, summary: tldr ? tldr[1] : '', tags: ['packet', name], repo: name, license_class: lic ? plain(lic[1]).slice(0, 60) : 'see packet', shard: 'core' });
  const nx = /## Franken-worthy next steps\n([\s\S]*?)(?:\n## |$(?![\s\S]))/.exec(text);
  if (nx) {
    for (const m of nx[1].matchAll(/^(\d+)\. \*\*([^*]+)\*\*([^\n]*)/gm))
      add({ id: `fr:packet-${name}-next-${m[1]}`, kind: 'next-step', title: m[2], summary: m[3], tags: ['next step', name], repo: name, shard: 'deep' });
  }
}
// 11. Crate directory (1,290): published crates are core, the rest deep
{
  const rows = fs.readFileSync(CRATES_TSV, 'utf8').trim().split('\n');
  const head = rows.shift().split('\t');
  const seen = new Set();
  for (const line of rows) {
    const r = Object.fromEntries(line.split('\t').map((v, i) => [head[i], v]));
    let id = `crate:${r.repo}/${r.name}`;
    if (seen.has(id)) id += '~' + r.manifest; // same crate name at two manifests in one repo
    seen.add(id);
    add({ id, kind: 'crate', title: r.name, summary: r.description, tags: [r.keywords.replace(/,/g, ' '), r.repo, r.class], repo: r.repo,
      verdict: r.on_crates_io === 'True' ? 'on crates.io' : r.class, license_class: r.repo_license || r.declared_license || 'unknown', shard: r.on_crates_io === 'True' ? 'core' : 'deep' });
  }
}
// 12. rigor-atlas curated layers (DEC-003); evidence quotes go to the quotes shard only (DEC-009)
{
  const db = new DatabaseSync(RIGOR_DB, { readOnly: true });
  const J = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
  for (const p of db.prepare('SELECT id,title,kinds_json,entities_json,scientists_json,apply,expected_result,epistemic,cluster FROM prescriptions ORDER BY id').all())
    add({ id: 'ra:presc-' + p.id, kind: 'prescription', title: p.title, summary: p.apply, tags: [...J(p.kinds_json), ...J(p.entities_json), ...J(p.scientists_json), p.cluster], verdict: p.epistemic, license_class: 'rigor-atlas (ours)', shard: 'core' });
  for (const k of db.prepare('SELECT kind,definition FROM kinds ORDER BY kind').all())
    add({ id: 'ra:kind-' + k.kind, kind: 'crate-kind', title: k.kind, summary: k.definition, tags: ['kind'], license_class: 'rigor-atlas (ours)', shard: 'core' });
  for (const c of db.prepare('SELECT repo,kind,kind_epistemic,summary,oracle FROM crate_profiles ORDER BY repo').all())
    add({ id: 'ra:profile-' + c.repo, kind: 'repo-profile', title: `${c.repo} (${c.kind})`, summary: c.summary, tags: [c.kind, c.oracle], repo: c.repo, verdict: c.kind_epistemic, license_class: 'rigor-atlas (ours)', shard: 'deep' });
  for (const t of db.prepare('SELECT id,repo,entity,technique,purpose,rigor,epistemic,evidence_json FROM techniques ORDER BY id').all()) {
    const id = 'ra:tech-' + t.id;
    add({ id, kind: 'rigor-technique', title: `${t.entity} in ${t.repo}`, summary: t.technique, tags: [t.entity, t.repo, t.rigor, t.purpose ? cap(t.purpose, 80) : ''], repo: t.repo, verdict: t.epistemic, license_class: 'rigor-atlas (ours)', shard: 'deep' });
    const ev = J(t.evidence_json).map((e) => ({ path: e.path, line: e.line, quote: e.quote })).filter((e) => e.quote);
    if (ev.length) quotes[id] = ev;
  }
  db.close();
}

const ids = new Set();
for (const d of docs) { if (ids.has(d.id)) throw new Error('duplicate id ' + d.id); ids.add(d.id); }
fs.mkdirSync(SCRATCH, { recursive: true });
fs.writeFileSync(path.join(SCRATCH, 'corpus.json'), JSON.stringify(docs));
fs.writeFileSync(path.join(SCRATCH, 'quotes.json'), JSON.stringify(quotes));
const byKind = {};
for (const d of docs) byKind[d.kind + '/' + d.shard] = (byKind[d.kind + '/' + d.shard] || 0) + 1;
const summary = { docs: docs.length, core: docs.filter((d) => d.shard === 'core').length, deep: docs.filter((d) => d.shard === 'deep').length,
  quote_docs: Object.keys(quotes).length, quote_items: Object.values(quotes).reduce((a, q) => a + q.length, 0), summary_cap: SUMMARY_CAP, by_kind: byKind };
fs.writeFileSync(path.join(SCRATCH, 'corpus-summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
