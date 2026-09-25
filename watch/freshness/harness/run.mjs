#!/usr/bin/env node
// watch/freshness/harness/run.mjs: conformance harness for watch/freshness/SPEC.md (gate W3).
//
//   node watch/freshness/harness/run.mjs              run every case, print JSON lines and the coverage table
//   node watch/freshness/harness/run.mjs --only ID    run the cases whose id starts with ID (coverage not enforced)
//   node watch/freshness/harness/run.mjs --clauses    print the clause list parsed from SPEC.md and exit
//   UPDATE_GOLDENS=1 node watch/freshness/harness/run.mjs   rewrite goldens, then review `git diff watch/freshness/goldens/`
//
// The clause list is parsed from SPEC.md itself, so coverage always matches the spec text. An XFAIL must
// name a DISC-NNN entry in watch/freshness/DISCREPANCIES.md that has a Resolution and a Review date.
// Exit: 0 every case PASS or XFAIL and every MUST clause covered; 1 otherwise; 2 harness error.
// Node 22 built-ins only.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FRESH = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = join(FRESH, '..', '..');
const SPEC = join(FRESH, 'SPEC.md');
const DISC = join(FRESH, 'DISCREPANCIES.md');
const CASES = join(FRESH, 'cases');
const GOLDENS = join(FRESH, 'goldens');
const FIXTURES = join(FRESH, 'fixtures');

const CLAUSE = /^\*\*(FR-[A-Z]\.\d+)\*\* \((MUST|SHOULD|MAY)\)/gm;
export function parseClauses(text) {
  const out = new Map();
  for (const m of text.matchAll(CLAUSE)) {
    if (out.has(m[1])) throw new Error(`SPEC.md defines ${m[1]} twice`);
    out.set(m[1], m[2]);
  }
  return out;
}

// DISC-NNN entries: a "## DISC-NNN: title" heading followed by "- **Resolution:** ACCEPTED|INVESTIGATING|WILL-FIX"
// and "- **Review date:** YYYY-MM-DD" before the next heading.
export function parseDiscrepancies(text) {
  const out = new Map();
  const blocks = text.split(/^(?=## DISC-\d{3}\b)/m).filter((b) => b.startsWith('## DISC-'));
  for (const b of blocks) {
    const id = b.match(/^## (DISC-\d{3})/)[1];
    const res = b.match(/^- \*\*Resolution:\*\* (ACCEPTED|INVESTIGATING|WILL-FIX)\b/m)?.[1] ?? null;
    const review = b.match(/^- \*\*Review date:\*\* (\d{4}-\d{2}-\d{2})\b/m)?.[1] ?? null;
    if (out.has(id)) throw new Error(`DISCREPANCIES.md defines ${id} twice`);
    out.set(id, { resolution: res, review });
  }
  return out;
}

const firstDiff = (a, b) => {
  const x = a.split('\n'), y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return `line ${i + 1}: golden ${JSON.stringify(x[i] ?? '<eof>').slice(0, 160)} vs actual ${JSON.stringify(y[i] ?? '<eof>').slice(0, 160)}`;
  }
  return 'identical';
};

// golden(name, text): compare text with goldens/<name>. UPDATE_GOLDENS=1 writes it and passes.
// A mismatch writes goldens/<name>.actual (gitignored) and fails naming the first differing line.
export function makeGolden(updating, dir = GOLDENS) {
  return (name, text) => {
    if (!/^[a-z0-9][a-z0-9._/-]*$/.test(name) || name.includes('..')) throw new Error(`bad golden name ${name}`);
    const path = join(dir, name);
    const actual = String(text);
    if (updating) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, actual);
      return { pass: true, detail: `UPDATED golden ${name}` };
    }
    if (!existsSync(path)) return { pass: false, detail: `golden missing: ${name} (run with UPDATE_GOLDENS=1, then review the diff)` };
    const expected = readFileSync(path, 'utf8');
    if (expected === actual) {
      if (existsSync(path + '.actual')) rmSync(path + '.actual');
      return { pass: true };
    }
    writeFileSync(path + '.actual', actual);
    return { pass: false, detail: `golden mismatch ${name}: ${firstDiff(expected, actual)}; diff ${path} ${path}.actual` };
  };
}

function normalize(r) {
  if (r === true) return { pass: true };
  if (r && typeof r === 'object' && typeof r.pass === 'boolean') return r;
  return { pass: false, detail: `case returned ${JSON.stringify(r)?.slice(0, 80)}, expected true or {pass}` };
}

export async function loadCases(dir = CASES) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.cases.mjs')).sort();
  const all = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    if (!Array.isArray(mod.default)) throw new Error(`${f}: default export is not an array`);
    for (const c of mod.default) all.push({ ...c, file: f });
  }
  return all;
}

export async function runCases(cases, clauses, discs, ctx) {
  const ids = new Set();
  const results = [];
  for (const c of cases) {
    const where = `${c.file}:${c.id}`;
    if (!c.id || typeof c.run !== 'function') throw new Error(`${where}: case needs id and run`);
    if (ids.has(c.id)) throw new Error(`${where}: duplicate case id`);
    ids.add(c.id);
    if (!Array.isArray(c.clauses) || c.clauses.length === 0) throw new Error(`${where}: case names no clause`);
    for (const k of c.clauses) if (!clauses.has(k)) throw new Error(`${where}: clause ${k} is not in SPEC.md`);
    if (!['MUST', 'SHOULD', 'MAY'].includes(c.level)) throw new Error(`${where}: level must be MUST, SHOULD or MAY`);
    let r;
    try { r = normalize(await c.run(ctx)); } catch (e) { r = { pass: false, detail: `threw: ${e?.stack?.split('\n').slice(0, 3).join(' | ') ?? e}` }; }
    let verdict = r.pass ? 'PASS' : 'FAIL';
    let detail = r.detail ?? '';
    if (!r.pass && r.xfail) {
      const d = discs.get(r.xfail);
      if (!d) detail = `XFAIL names ${r.xfail}, which DISCREPANCIES.md does not define; ${detail}`;
      else if (!d.resolution || !d.review) detail = `XFAIL ${r.xfail} lacks a Resolution or Review date; ${detail}`;
      else { verdict = 'XFAIL'; detail = `${r.xfail} (${d.resolution}): ${detail}`; }
    }
    if (r.pass && r.xfail) { verdict = 'FAIL'; detail = `case passed but still claims ${r.xfail}; drop the XFAIL or fix the case`; }
    results.push({ id: c.id, clauses: c.clauses, level: c.level, verdict, detail, title: c.title ?? '' });
  }
  return results;
}

export function coverage(clauses, results) {
  const rows = new Map();
  for (const [k, level] of clauses) {
    const section = k.split('.')[0];
    if (!rows.has(section)) rows.set(section, { section, must: 0, should: 0, may: 0, covered: 0, pass: 0, xfail: 0, missing: [] });
    const row = rows.get(section);
    row[level.toLowerCase()]++;
    const hits = results.filter((r) => r.clauses.includes(k));
    const ok = hits.filter((r) => r.verdict === 'PASS' || r.verdict === 'XFAIL');
    if (ok.length && hits.every((r) => r.verdict !== 'FAIL')) {
      row.covered++;
      if (ok.some((r) => r.verdict === 'PASS')) row.pass++; else row.xfail++;
    } else if (level === 'MUST') row.missing.push(k);
  }
  return [...rows.values()];
}

export function renderCoverage(rows) {
  const lines = ['| Section | MUST | SHOULD | MAY | Covered | Pass | XFAIL only | Uncovered MUST |', '|---|---:|---:|---:|---:|---:|---:|---|'];
  for (const r of rows) lines.push(`| ${r.section} | ${r.must} | ${r.should} | ${r.may} | ${r.covered} | ${r.pass} | ${r.xfail} | ${r.missing.join(', ') || '-'} |`);
  return lines.join('\n');
}

async function main(argv) {
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
  const clauses = parseClauses(readFileSync(SPEC, 'utf8'));
  if (argv.includes('--clauses')) {
    for (const [k, l] of clauses) console.log(`${k}\t${l}`);
    return 0;
  }
  const discs = existsSync(DISC) ? parseDiscrepancies(readFileSync(DISC, 'utf8')) : new Map();
  const updating = process.env.UPDATE_GOLDENS === '1';
  let cases = await loadCases();
  if (only) cases = cases.filter((c) => c.id.startsWith(only));
  const ctx = { root: ROOT, fixtures: FIXTURES, golden: makeGolden(updating), updating };
  const results = await runCases(cases, clauses, discs, ctx);
  for (const r of results) console.log(JSON.stringify(r));
  const rows = coverage(clauses, results);
  const fails = results.filter((r) => r.verdict === 'FAIL');
  const uncovered = rows.flatMap((r) => r.missing);
  console.log('');
  console.log(renderCoverage(rows));
  console.log('');
  console.log(`CASES ${results.length}`);
  console.log(`PASS ${results.filter((r) => r.verdict === 'PASS').length}`);
  console.log(`XFAIL ${results.filter((r) => r.verdict === 'XFAIL').length}`);
  console.log(`FAILED ${fails.length}`);
  console.log(`UNCOVERED_MUST ${only ? 'not-enforced' : uncovered.length}`);
  if (results.length === 0) { console.log('NO CASES: an empty scan set is a failure'); return 1; }
  if (fails.length) return 1;
  if (!only && uncovered.length) return 1;
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`HARNESS ERROR: ${e?.message ?? e}`); process.exit(2); });
}
