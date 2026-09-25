#!/usr/bin/env node
// watch/freshness/harness/run.mjs: conformance harness for watch/freshness/SPEC.md (gate W3).
//
//   node watch/freshness/harness/run.mjs              run every case, print JSON lines and the coverage table
//   node watch/freshness/harness/run.mjs --only ID    run the cases whose id starts with ID (coverage not enforced)
//   node watch/freshness/harness/run.mjs --ids A,B    run exactly the named cases (coverage not enforced; used by mutate.mjs)
//   node watch/freshness/harness/run.mjs --clauses    print the clause list parsed from SPEC.md and exit
//   node watch/freshness/harness/run.mjs --report     full run, then write watch/freshness/REPORT.md (FR-H.8)
//   node watch/freshness/harness/run.mjs --check-report   full run; exit 1 if REPORT.md differs from a fresh render
//   UPDATE_GOLDENS=1 node watch/freshness/harness/run.mjs   rewrite goldens, then review `git diff watch/freshness/goldens/`
//
// The clause list is parsed from SPEC.md itself, so coverage always matches the spec text. An XFAIL must
// name a DISC-NNN entry in watch/freshness/DISCREPANCIES.md that has a Resolution and a Review date.
// A case result may carry `metrics: {name: value}`; the runner collects them into REPORT.md, and a known
// metric no case reported is rendered as `not measured`, never as zero. REPORT.md holds no wall-clock time
// and no case detail text (details carry machine paths), so a clean clone renders the same bytes.
// Exit: 0 every case PASS or XFAIL and every MUST clause covered; 1 otherwise (and on a stale REPORT.md
// with --check-report); 2 harness error or bad usage.
// Node 22 built-ins only.

// writes: watch/freshness/REPORT.md, goldens (UPDATE_GOLDENS=1)

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FRESH = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = join(FRESH, '..', '..');
const SPEC = join(FRESH, 'SPEC.md');
const DISC = join(FRESH, 'DISCREPANCIES.md');
const CASES = join(FRESH, 'cases');
const GOLDENS = join(FRESH, 'goldens');
const FIXTURES = join(FRESH, 'fixtures');
const REPORT = join(FRESH, 'REPORT.md');

const CLAUSE = /^\*\*(FR-[A-Z]\.\d+)\*\* \((MUST|SHOULD|MAY)\)/gm;
export function parseClauses(text) {
  const out = new Map();
  for (const m of text.matchAll(CLAUSE)) {
    if (out.has(m[1])) throw new Error(`SPEC.md defines ${m[1]} twice`);
    out.set(m[1], m[2]);
  }
  return out;
}

// Lines that open with a bold clause id but do not match the clause grammar, such as `**FR-C.9** (must)`.
// The runner refuses such a spec: a clause the parser skipped would need no case and pass coverage silently.
// A retired clause (`**FR-C.3** (RETIRED …)`, SPEC.md status line) is deliberately not a clause.
export function unparsedClauseLines(text) {
  return text.split('\n')
    .filter((l) => /^\*\*FR-/.test(l) && !/^\*\*(FR-[A-Z]\.\d+)\*\* \((MUST|SHOULD|MAY)\)/.test(l) && !/^\*\*FR-[A-Z]\.\d+\*\* \([^)]*RETIRED/.test(l))
    .map((l) => l.slice(0, 60));
}

// DISC-NNN entries: a "## DISC-NNN: title" heading followed by "- **Resolution:** ACCEPTED|INVESTIGATING|WILL-FIX"
// and "- **Review date:** YYYY-MM-DD" before the next heading.
export function parseDiscrepancies(text) {
  const out = new Map();
  const blocks = text.split(/^(?=## DISC-\d{3}\b)/m).filter((b) => b.startsWith('## DISC-'));
  for (const b of blocks) {
    const head = b.match(/^## (DISC-\d{3})(?::\s*(.*))?/);
    const id = head[1];
    const res = b.match(/^- \*\*Resolution:\*\* (ACCEPTED|INVESTIGATING|WILL-FIX)\b/m)?.[1] ?? null;
    const review = b.match(/^- \*\*Review date:\*\* (\d{4}-\d{2}-\d{2})\b/m)?.[1] ?? null;
    const clause = b.match(/^- \*\*Clause:\*\* (.+)$/m)?.[1].trim() ?? null;
    if (out.has(id)) throw new Error(`DISCREPANCIES.md defines ${id} twice`);
    out.set(id, { resolution: res, review, title: (head[2] ?? '').trim(), clause });
  }
  return out;
}

// The first line where two texts differ, naming each side (a golden and its actual by default).
const firstDiff = (a, b, left = 'golden', right = 'actual') => {
  const x = a.split('\n'), y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return `line ${i + 1}: ${left} ${JSON.stringify(x[i] ?? '<eof>').slice(0, 160)} vs ${right} ${JSON.stringify(y[i] ?? '<eof>').slice(0, 160)}`;
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

// A case's metrics must be a plain object of dotted lower-case names to finite numbers or non-empty strings.
// Returns a reason string when they are malformed, else null. A malformed metric fails its case.
export function badMetrics(m) {
  if (m === undefined) return null;
  if (!m || typeof m !== 'object' || Array.isArray(m)) return `metrics must be an object, got ${JSON.stringify(m)?.slice(0, 60)}`;
  for (const [k, v] of Object.entries(m)) {
    if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(k)) return `metric name ${JSON.stringify(k)} is not dotted lower case`;
    const ok = (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.trim() !== '');
    if (!ok) return `metric ${k} has value ${JSON.stringify(v)}; use a finite number or a non-empty string`;
  }
  return null;
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
    const bad = badMetrics(r.metrics);
    if (bad) { verdict = 'FAIL'; detail = `${bad}; ${detail}`; }
    const out = { id: c.id, clauses: c.clauses, level: c.level, verdict, detail, title: c.title ?? '' };
    if (r.metrics && !bad) out.metrics = r.metrics;
    results.push(out);
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

// The metrics SPEC.md FR-H asks the report for, in report order. A name here that no case reports renders
// as `not measured`. Names a case reports beyond this list are shown too, under "Other metrics".
export const METRICS = [
  ['fidelity.ci', 'FR-H.1', 'CI class at the pin, machine vs matrix (matched/44)'],
  ['fidelity.rel', 'FR-H.1', 'Release class at the pin, machine vs matrix (matched/44)'],
  ['fidelity.license', 'FR-H.1', 'License class at the pin, machine vs matrix (matched/44)'],
  ['labelled.precision', 'FR-H.4', 'Labelled events: precision'],
  ['labelled.recall', 'FR-H.4', 'Labelled events: recall'],
  ['labelled.n', 'FR-H.4', 'Labelled events: set size'],
  ['replay.days', 'FR-H.5', 'Replay: recorded days'],
  ['replay.flags_old_per_day', 'FR-H.5', 'Replay: flags per day under the old event rule'],
  ['replay.flags_new_per_day', 'FR-H.5', 'Replay: flags per day under FR-T'],
  ['mutation.killed', 'FR-H.6', 'Mutants killed'],
  ['mutation.total', 'FR-H.6', 'Mutants in mutants.json'],
];

// Every reported metric with the case that reported it. Two cases may report the same name only with the
// same value; a conflict is a harness error, because the report could not say which one is true.
export function collectMetrics(results) {
  const out = new Map();
  for (const r of [...results].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    for (const [k, v] of Object.entries(r.metrics ?? {})) {
      const prev = out.get(k);
      if (prev && prev.value !== v) throw new Error(`metric ${k} reported as ${JSON.stringify(prev.value)} by ${prev.by[0]} and ${JSON.stringify(v)} by ${r.id}`);
      if (prev) prev.by.push(`${r.id} (${r.verdict})`);
      else out.set(k, { value: v, by: [`${r.id} (${r.verdict})`] });
    }
  }
  return out;
}

// One clause's standing: PASS (some case passes, none fails), XFAIL only, FAIL (a tagged case fails), uncovered.
export function clauseStatus(k, results) {
  const hits = results.filter((r) => r.clauses.includes(k));
  if (hits.length === 0) return 'uncovered';
  if (hits.some((r) => r.verdict === 'FAIL')) return 'FAIL';
  return hits.some((r) => r.verdict === 'PASS') ? 'PASS' : 'XFAIL only';
}

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const cell = (s) => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

// REPORT.md as a pure function of the spec text, the results, the DISC entries and the case-file count.
// Results are sorted here, so the order cases ran in cannot change a byte. No clock, no detail text.
export function renderReport({ specText, results, discs, caseFiles }) {
  const clauses = parseClauses(specText);
  const sorted = [...results].sort(byId);
  const metrics = collectMetrics(sorted);
  const rows = coverage(clauses, sorted);
  const count = (v) => sorted.filter((r) => r.verdict === v).length;
  const levels = (lvl) => [...clauses].filter(([, l]) => l === lvl).map(([k]) => k);
  const coveredOf = (ks) => ks.filter((k) => ['PASS', 'XFAIL only'].includes(clauseStatus(k, sorted))).length;
  const must = levels('MUST'), should = levels('SHOULD');
  const sha = createHash('sha256').update(specText).digest('hex').slice(0, 12);
  const metricValue = (name) => (metrics.has(name) ? cell(metrics.get(name).value) : 'not measured');
  const L = [];
  L.push('# Freshness harness report', '');
  L.push(`Generated by \`node watch/freshness/harness/run.mjs --report\` from \`watch/freshness/SPEC.md\` (sha256 ${sha}…) and ${caseFiles} case files. Do not edit this file by hand: gate W3 runs \`--check-report\` and fails when it differs from a fresh render. It records no clock time; the commit that carries it dates it. Case details, which name machine paths, are printed by the runner and left out here.`, '');
  L.push('## Summary', '');
  L.push('| Cases | PASS | XFAIL | FAIL | MUST clauses covered | SHOULD clauses covered |', '|---:|---:|---:|---:|---:|---:|');
  L.push(`| ${sorted.length} | ${count('PASS')} | ${count('XFAIL')} | ${count('FAIL')} | ${coveredOf(must)}/${must.length} | ${coveredOf(should)}/${should.length} |`, '');
  L.push('## Spec coverage by section (FR-H.2)', '');
  L.push('A clause is covered when at least one case tagged with it passes or XFAILs and none fails.', '');
  L.push(renderCoverage(rows), '');
  L.push('## Spec coverage by clause', '');
  L.push('| Clause | Level | Status | Cases |', '|---|---|---|---|');
  for (const [k, lvl] of clauses) {
    const ids = sorted.filter((r) => r.clauses.includes(k)).map((r) => `${cell(r.id)} (${r.verdict})`);
    L.push(`| ${k} | ${lvl} | ${clauseStatus(k, sorted)} | ${ids.join(', ') || '-'} |`);
  }
  L.push('');
  const section = (title, names) => {
    L.push(`## ${title}`, '', '| Measure | Value |', '|---|---|');
    for (const n of names) L.push(`| ${METRICS.find((m) => m[0] === n)[2]} | ${metricValue(n)} |`);
    L.push('');
  };
  section('Fidelity against the master matrix (FR-H.1)', ['fidelity.ci', 'fidelity.rel', 'fidelity.license']);
  section('Labelled events (FR-H.4)', ['labelled.precision', 'labelled.recall', 'labelled.n']);
  section('Replay noise (FR-H.5)', ['replay.days', 'replay.flags_old_per_day', 'replay.flags_new_per_day']);
  section('Mutation score (FR-H.6)', ['mutation.killed', 'mutation.total']);
  L.push('## Every metric and its source', '', '| Metric | Clause | Value | Reported by |', '|---|---|---|---|');
  for (const [n, k] of METRICS) L.push(`| ${n} | ${k} | ${metricValue(n)} | ${metrics.get(n)?.by.join(', ') ?? '-'} |`);
  const known = new Set(METRICS.map((m) => m[0]));
  const other = [...metrics.keys()].filter((n) => !known.has(n)).sort();
  L.push('');
  if (other.length) {
    L.push('### Other metrics', '', '| Metric | Value | Reported by |', '|---|---|---|');
    for (const n of other) L.push(`| ${cell(n)} | ${metricValue(n)} | ${metrics.get(n).by.join(', ')} |`);
    L.push('');
  }
  L.push('## Discrepancies (DISCREPANCIES.md)', '');
  if (discs.size === 0) L.push('No entries.');
  else {
    L.push('| Entry | Title | Clause | Resolution | Review date | Cases that XFAIL on it |', '|---|---|---|---|---|---|');
    for (const [id, d] of [...discs].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const xf = sorted.filter((r) => r.verdict === 'XFAIL' && r.detail.startsWith(`${id} (`)).map((r) => cell(r.id));
      L.push(`| ${id} | ${cell(d.title || '-')} | ${cell(d.clause ?? '-')} | ${d.resolution ?? 'missing'} | ${d.review ?? 'missing'} | ${xf.join(', ') || '-'} |`);
    }
  }
  return L.join('\n') + '\n';
}

// The exit code the fixed interface promises: 1 on an empty case set, any FAIL, or (full runs only) an
// uncovered MUST clause; 0 otherwise. Harness errors never reach here; main's caller maps them to 2.
export function decideExit({ results, uncovered, partial }) {
  if (results.length === 0) return 1;
  if (results.some((r) => r.verdict === 'FAIL')) return 1;
  if (!partial && uncovered.length) return 1;
  return 0;
}

// First differing line of two texts, for a stale REPORT.md message.
export { firstDiff };

function parseArgs(argv) {
  const known = new Set(['--only', '--ids', '--clauses', '--report', '--check-report']);
  const a = { only: null, ids: null, clauses: false, report: false, checkReport: false };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    if (!known.has(f)) throw new Error(`unknown argument ${f}`);
    if (f === '--only' || f === '--ids') {
      const v = argv[++i];
      if (!v || v.startsWith('--')) throw new Error(`${f} needs a value`);
      if (f === '--only') a.only = v; else a.ids = v.split(',').filter(Boolean);
    } else a[{ '--clauses': 'clauses', '--report': 'report', '--check-report': 'checkReport' }[f]] = true;
  }
  if ((a.report || a.checkReport) && (a.only || a.ids)) throw new Error('--report and --check-report always run every case; drop --only/--ids');
  if (a.only && a.ids) throw new Error('use --only or --ids, not both');
  if ((a.report || a.checkReport) && process.env.UPDATE_GOLDENS === '1') throw new Error('refusing to render REPORT.md while UPDATE_GOLDENS=1 rewrites goldens');
  return a;
}

async function main(argv) {
  const args = parseArgs(argv);
  const specText = readFileSync(SPEC, 'utf8');
  const clauses = parseClauses(specText);
  const malformed = unparsedClauseLines(specText);
  if (malformed.length) throw new Error(`SPEC.md has clause lines the parser cannot read: ${malformed.join(' | ')}`);
  if (args.clauses) {
    for (const [k, l] of clauses) console.log(`${k}\t${l}`);
    return 0;
  }
  const discs = existsSync(DISC) ? parseDiscrepancies(readFileSync(DISC, 'utf8')) : new Map();
  const updating = process.env.UPDATE_GOLDENS === '1';
  const all = await loadCases();
  let cases = all;
  if (args.only) cases = all.filter((c) => c.id.startsWith(args.only));
  if (args.ids) {
    const missing = args.ids.filter((id) => !all.some((c) => c.id === id));
    if (missing.length) throw new Error(`--ids names cases that do not exist: ${missing.join(', ')}`);
    cases = all.filter((c) => args.ids.includes(c.id));
  }
  const partial = Boolean(args.only || args.ids);
  const t0 = process.hrtime.bigint();
  const ctx = { root: ROOT, fixtures: FIXTURES, golden: makeGolden(updating), updating };
  const results = await runCases(cases, clauses, discs, ctx);
  const seconds = Number(process.hrtime.bigint() - t0) / 1e9;
  for (const r of results) console.log(JSON.stringify(r));
  const rows = coverage(clauses, results);
  const uncovered = rows.flatMap((r) => r.missing);
  console.log('');
  console.log(renderCoverage(rows));
  console.log('');
  console.log(`CASES ${results.length}`);
  console.log(`PASS ${results.filter((r) => r.verdict === 'PASS').length}`);
  console.log(`XFAIL ${results.filter((r) => r.verdict === 'XFAIL').length}`);
  console.log(`FAILED ${results.filter((r) => r.verdict === 'FAIL').length}`);
  console.log(`UNCOVERED_MUST ${partial ? 'not-enforced' : uncovered.length}`);
  console.log(`SECONDS ${seconds.toFixed(2)}`);
  if (results.length === 0) console.log('NO CASES: an empty scan set is a failure');
  let code = decideExit({ results, uncovered, partial });
  if (args.report || args.checkReport) {
    const caseFiles = new Set(all.map((c) => c.file)).size;
    const fresh = renderReport({ specText, results, discs, caseFiles });
    if (args.report) {
      writeFileSync(REPORT, fresh);
      console.log(`REPORT_WRITTEN ${REPORT.slice(ROOT.length + 1)} bytes=${Buffer.byteLength(fresh)}`);
    } else if (!existsSync(REPORT)) {
      console.log('REPORT_STALE watch/freshness/REPORT.md is missing; run with --report');
      code = 1;
    } else {
      const committed = readFileSync(REPORT, 'utf8');
      if (committed === fresh) console.log(`REPORT_OK bytes=${Buffer.byteLength(fresh)}`);
      else {
        console.log(`REPORT_STALE watch/freshness/REPORT.md differs from a fresh render at ${firstDiff(committed, fresh, 'committed', 'fresh')}; run with --report and commit it`);
        code = 1;
      }
    }
  }
  return code;
}

// realpath: mutate.mjs and the harness cases run this file from a copy under os.tmpdir(), which on macOS
// is a symlink (/var -> /private/var); import.meta.url is the resolved path, argv[1] is not.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`HARNESS ERROR: ${e?.message ?? e}`); process.exit(2); });
}
