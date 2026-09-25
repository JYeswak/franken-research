#!/usr/bin/env node
// Validates .atlas-arc/eval/golden.jsonl: shape, unique qids, id grammar (contracts/IF-ID.md),
// that every expected and must_not id resolves to a real source item, that each `where` file:line
// exists, and the coverage counts the golden set promises. Node standard library only.
//
// Usage: node .atlas-arc/eval/validate.mjs [--golden F] [--crates F] [--fh-ids F] [--ra-ids F]
//                                           [--contract F] [--json]
// Exit: 0 = valid and every id resolved; 1 = shape, grammar or coverage error; 2 = only unresolved ids.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : dflt;
};
const GOLDEN = opt('golden', join(HERE, 'golden.jsonl'));
const CRATES = opt('crates', join(HERE, 'ref', 'crates.tsv'));
const FH_IDS = opt('fh-ids', join(HERE, 'ref', 'fh-ids.tsv'));
const RA_IDS = opt('ra-ids', join(HERE, 'ref', 'ra-ids.tsv'));
const CONTRACT = opt('contract', join(REPO, '.atlas-arc', 'contracts', 'IF-ID.md'));
const AS_JSON = args.includes('--json');

const errors = [];
const warnings = [];
const read = (p) => readFileSync(p, 'utf8');
const lines = (p) => read(p).split('\n');

// ---- id grammar: the regex block in IF-ID.md section 5 is the only source; no copy is kept here.
const grammarSource = CONTRACT;
const block = existsSync(CONTRACT) ? read(CONTRACT).match(/## 5\. Validator regexes[\s\S]*?```text\n([\s\S]*?)```/) : null;
if (!block) {
  console.error(`cannot read the id grammar: ${CONTRACT} is missing or has no "## 5. Validator regexes" text block`);
  process.exit(1);
}
const regexText = block[1].trim();
const FAMILIES = regexText.split('\n').filter(Boolean).map((l) => {
  const [family, rx] = l.split('\t');
  return { family, rx: new RegExp(rx) };
});
const familyOf = (id) => {
  const hits = FAMILIES.filter((f) => f.rx.test(id)).map((f) => f.family);
  return hits.length === 1 ? hits[0] : null;
};

// ---- resolvers: id -> title, built from the real sources.
const titles = new Map(); // id -> title (for the synonym check)
const add = (id, title) => { if (!titles.has(id)) titles.set(id, title); };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

for (const l of lines(join(REPO, 'stack/rigor-practices.tsv'))) {
  const m = l.match(/^(RP-\d{3})\t([^\t]*)/);
  if (m) add(`fr:${m[1]}`, m[2]);
}
for (const l of lines(join(REPO, 'synthesis/planning/execution-readiness.md'))) {
  const m = l.match(/^## Gate (\d+) — (.*)/);
  if (m) add(`fr:gate-${m[1]}`, m[2]);
}
for (const l of lines(join(REPO, 'starter-kit/CHECKLIST.md'))) {
  const m = l.match(/^### ([AB]\d+) — (.*)/);
  if (m) add(`fr:kit-${m[1]}`, m[2]);
}
for (const l of lines(join(REPO, 'synthesis/cross-pollination.md'))) {
  const m = l.match(/^## \d+\. (.*)/);
  if (m) add(`fr:tech-${slug(m[1])}`, m[1]);
}
for (const l of lines(join(REPO, 'synthesis/negative-patterns.md'))) {
  const m = l.match(/^## P(\d+) — (.*)/);
  if (m) add(`fr:fm-p${m[1]}`, m[2]);
}
{
  let topic = null;
  for (const l of lines(join(REPO, 'site/lessons/index.html'))) {
    const t = l.match(/class="topic" id="([^"]+)"/);
    if (t) topic = t[1];
    const e = l.match(/<span class="r"><a [^>]*>([^<]+)<\/a><\/span>(.*)<\/li>/);
    if (e && topic) add(`fr:lesson-${topic}-${e[1]}`, e[2].replace(/<[^>]+>/g, ''));
  }
}
for (const f of readdirSync(join(REPO, 'packets'))) {
  const m = f.match(/^(.*)-assessment\.md$/);
  if (m) add(`fr:verdict-${m[1]}`, m[1]);
}
for (const f of readdirSync(join(REPO, 'stack'))) {
  if (!f.endsWith('.md') || f === 'METHOD.md') continue;
  const t = read(join(REPO, 'stack', f)).match(/^title: (.*)$/m);
  add(`fr:stack-${f.slice(0, -3)}`, t ? t[1] : f.slice(0, -3));
}
if (existsSync(join(REPO, 'cohorts'))) {
  for (const d of readdirSync(join(REPO, 'cohorts'))) {
    const dir = join(REPO, 'cohorts', d);
    if (!existsSync(dir) || !d.match(/^\d{4}-\d{2}$/)) continue;
    for (const f of readdirSync(dir)) {
      const m = f.match(/^(.*)-(assessment|screening)\.md$/);
      if (m) add(`fr:cohort-${m[1]}`, m[1]);
    }
  }
}
const refLists = {};
const loadRef = (label, path, titleCol) => {
  if (!existsSync(path)) {
    warnings.push(`${label} id list ${path} not found; its ids will be reported unresolved`);
    refLists[label] = { path, n: 0 };
    return;
  }
  let n = 0;
  let header = null;
  for (const l of lines(path)) {
    if (!l || l.startsWith('#')) continue;
    const cols = l.split('\t');
    if (!header) { header = cols; continue; }
    const id = cols[0];
    const title = titleCol != null ? cols[titleCol] : id.split(/[:/]/).slice(-1)[0];
    add(id, title);
    n++;
  }
  refLists[label] = { path, n };
};
loadRef('crate', CRATES, 2);
loadRef('fh', FH_IDS, null);
loadRef('ra', RA_IDS, null);

// ---- golden set
const ALLOWED = new Set(['qid', 'query', 'user', 'origin', 'origin_note', 'expected', 'must_not', 'difficulty', 'honest_answer']);
const DIFFS = ['exact', 'synonym', 'intent', 'typo', 'negation'];
const USERS = ['U1', 'U2', 'U3'];
const rows = [];
lines(GOLDEN).forEach((l, i) => {
  if (!l.trim()) return;
  try { rows.push({ line: i + 1, r: JSON.parse(l) }); } catch (e) { errors.push(`line ${i + 1}: not JSON (${e.message})`); }
});

const qids = new Map();
const queries = new Map();
const unresolved = new Map(); // id -> [qid]
const byFamily = {};
const familyQueries = {};
const byDiff = Object.fromEntries(DIFFS.map((d) => [d, 0]));
const byUser = Object.fromEntries(USERS.map((u) => [u, 0]));
const byOrigin = { charter: 0, site: 0, session: 0 };
let honest = 0;
let mustNot = 0;
const synonymClean = [];
const synonymLeaky = [];
const STOP = new Set('a an the to of for in on and or but is it i my me we our us that this with as by be can how what do does should could would not no don t s from at into their its your you are was which when why who whom any all only than then so if there here about like one two own just more most'.split(' '));
const words = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)));

const checkWhere = (qid, id, where) => {
  if (typeof where !== 'string' || !where) return errors.push(`${qid} ${id}: missing "where"`);
  if (/^https:\/\/github\.com\/Dicklesworthstone\/[^/]+\/blob\/[0-9a-f]{40}\//.test(where)) return;
  if (/^(franken-harvest@[0-9a-f]{8}:|rigor-atlas data\/rigor\.sqlite@)/.test(where)) return;
  const m = where.match(/^([A-Za-z0-9._\/-]+):(\d+)/);
  if (!m) return errors.push(`${qid} ${id}: "where" is neither repo file:line, a pinned GitHub URL, nor a snapshot pointer: ${where}`);
  const p = join(REPO, m[1]);
  if (!existsSync(p)) return errors.push(`${qid} ${id}: "where" file does not exist: ${m[1]}`);
  if (lines(p).length < Number(m[2])) errors.push(`${qid} ${id}: "where" line ${m[2]} is past the end of ${m[1]}`);
};

const checkIds = (qid, list, label, required) => {
  if (!Array.isArray(list)) return errors.push(`${qid}: ${label} must be an array`);
  if (required && (list.length < 1 || list.length > 5)) errors.push(`${qid}: ${label} must hold 1-5 ids, has ${list.length}`);
  const seen = new Set();
  for (const e of list) {
    if (!e || typeof e !== 'object') { errors.push(`${qid}: ${label} entry is not an object`); continue; }
    for (const k of Object.keys(e)) if (!['id', 'why', 'where'].includes(k)) errors.push(`${qid}: ${label} entry has unknown field "${k}"`);
    if (typeof e.id !== 'string') { errors.push(`${qid}: ${label} entry has no id`); continue; }
    if (seen.has(e.id)) errors.push(`${qid}: ${label} repeats ${e.id}`);
    seen.add(e.id);
    if (typeof e.why !== 'string' || e.why.trim().length < 5) errors.push(`${qid} ${e.id}: "why" is missing or too short`);
    checkWhere(qid, e.id, e.where);
    const fam = familyOf(e.id);
    if (!fam) { errors.push(`${qid}: ${e.id} matches no id family (or more than one) in ${grammarSource}`); continue; }
    if (!titles.has(e.id)) unresolved.set(e.id, [...(unresolved.get(e.id) || []), qid]);
    if (label === 'expected') {
      byFamily[fam] = (byFamily[fam] || 0) + 1;
      (familyQueries[fam] ||= new Set()).add(qid);
    }
  }
  return seen;
};

for (const { line, r } of rows) {
  const qid = r.qid;
  if (typeof qid !== 'string' || !/^G-\d{3}$/.test(qid)) { errors.push(`line ${line}: bad qid ${JSON.stringify(qid)}`); continue; }
  if (qids.has(qid)) errors.push(`${qid}: duplicate qid (lines ${qids.get(qid)} and ${line})`);
  qids.set(qid, line);
  for (const k of Object.keys(r)) if (!ALLOWED.has(k)) errors.push(`${qid}: unknown field "${k}"`);
  if (typeof r.query !== 'string' || !r.query.trim()) errors.push(`${qid}: empty query`);
  else {
    const norm = r.query.toLowerCase().replace(/\s+/g, ' ').trim();
    if (queries.has(norm)) errors.push(`${qid}: same query as ${queries.get(norm)}`);
    queries.set(norm, qid);
  }
  if (!USERS.includes(r.user)) errors.push(`${qid}: user must be one of ${USERS.join('/')}`); else byUser[r.user]++;
  if (typeof r.origin !== 'string' || !r.origin) errors.push(`${qid}: missing origin`);
  else if (r.origin === 'charter' || r.origin === 'site') byOrigin[r.origin]++;
  else if (/^[A-Za-z0-9._:-]{8,}$/.test(r.origin)) byOrigin.session++;
  else errors.push(`${qid}: origin must be "charter", "site" or a session id, got ${r.origin}`);
  if (!DIFFS.includes(r.difficulty)) errors.push(`${qid}: difficulty must be one of ${DIFFS.join('/')}`); else byDiff[r.difficulty]++;
  if (r.honest_answer != null) { if (typeof r.honest_answer !== 'string' || !r.honest_answer) errors.push(`${qid}: honest_answer must be a non-empty string`); else honest++; }
  const exp = checkIds(qid, r.expected, 'expected', true);
  if (r.must_not != null) {
    const mn = checkIds(qid, r.must_not, 'must_not', false);
    mustNot += Array.isArray(r.must_not) ? r.must_not.length : 0;
    if (exp && mn) for (const id of mn) if (exp.has(id)) errors.push(`${qid}: ${id} is both expected and must_not`);
  }
  if (r.difficulty === 'synonym' && Array.isArray(r.expected)) {
    const q = words(r.query);
    const leaks = [];
    for (const e of r.expected) {
      const t = titles.get(e.id) ?? e.id;
      for (const w of words(t)) if (q.has(w)) leaks.push(`${e.id}:"${w}"`);
    }
    (leaks.length ? synonymLeaky : synonymClean).push(leaks.length ? `${qid} (${leaks.join(', ')})` : qid);
  }
}
const sortedQids = [...qids.keys()].sort();
const gap = sortedQids.findIndex((q, i) => q !== `G-${String(i + 1).padStart(3, '0')}`);
if (gap >= 0) warnings.push(`qids are not contiguous from ${sortedQids[gap]} (expected G-${String(gap + 1).padStart(3, '0')})`);

// ---- coverage promised by the golden set (charter REQ-O1 needs 40 surviving review; we ship 60+)
const REQUIRED_FAMILIES = ['fr-practice', 'fr-gate', 'fr-kit', 'fr-tech', 'fr-fm', 'fr-lesson', 'fr-verdict', 'fr-stack', 'fr-cohort',
  'crate', 'ra-prescription', 'ra-kind', 'ra-profile', 'ra-technique',
  'fh-rigor', 'fh-techniques', 'fh-oracles', 'fh-runbooks', 'fh-capabilities'];
const coverage = [
  ['queries >= 60', rows.length, rows.length >= 60],
  ['synonym queries sharing no word with any expected title >= 8', synonymClean.length, synonymClean.length >= 8],
  ['typo queries >= 5', byDiff.typo, byDiff.typo >= 5],
  ['queries whose honest answer is do-not-use >= 4', honest, honest >= 4],
  ...REQUIRED_FAMILIES.map((f) => [`family ${f} expected in >= 1 query`, familyQueries[f]?.size ?? 0, (familyQueries[f]?.size ?? 0) >= 1]),
];
for (const [name, n, ok] of coverage) if (!ok) errors.push(`coverage: ${name} (have ${n})`);
for (const s of synonymLeaky) warnings.push(`synonym query shares a word with an expected title: ${s}`);

const report = {
  golden: GOLDEN, grammar: grammarSource, ref_lists: refLists,
  queries: rows.length, users: byUser, origins: byOrigin, difficulty: byDiff,
  honest_do_not_use: honest, must_not_ids: mustNot,
  synonym_no_shared_word: synonymClean.length,
  expected_ids_by_family: Object.fromEntries(Object.entries(byFamily).sort()),
  queries_by_family: Object.fromEntries(Object.entries(familyQueries).map(([k, v]) => [k, v.size]).sort()),
  unresolved: Object.fromEntries(unresolved),
  errors, warnings,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const out = [];
  out.push(`golden set: ${GOLDEN}`);
  out.push(`id grammar: ${grammarSource}`);
  for (const [k, v] of Object.entries(refLists)) out.push(`ref ${k}: ${v.n} ids from ${v.path}`);
  out.push(`queries: ${rows.length}  users: ${USERS.map((u) => `${u}=${byUser[u]}`).join(' ')}  origins: ${Object.entries(byOrigin).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  out.push(`difficulty: ${DIFFS.map((d) => `${d}=${byDiff[d]}`).join(' ')}  (synonym with no shared word: ${synonymClean.length})`);
  out.push(`honest answer is do-not-use: ${honest}  must_not ids: ${mustNot}`);
  out.push('expected ids by family (ids / queries):');
  for (const f of REQUIRED_FAMILIES.concat(Object.keys(byFamily).filter((f) => !REQUIRED_FAMILIES.includes(f)))) {
    out.push(`  ${f.padEnd(16)} ${String(byFamily[f] ?? 0).padStart(3)} / ${String(familyQueries[f]?.size ?? 0).padStart(3)}`);
  }
  out.push(`unresolved ids: ${unresolved.size}`);
  for (const [id, qs] of unresolved) out.push(`  ${id}  (${qs.join(', ')})`);
  out.push(`warnings: ${warnings.length}`);
  for (const w of warnings) out.push(`  ${w}`);
  out.push(`errors: ${errors.length}`);
  for (const e of errors) out.push(`  ${e}`);
  console.log(out.join('\n'));
}
process.exit(errors.length ? 1 : unresolved.size ? 2 : 0);
