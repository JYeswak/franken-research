#!/usr/bin/env node
// ops/schedule.mjs: the schedule check (watch/freshness/SPEC.md FR-O.1, FR-O.2), run by gate W3.
//
//   node ops/schedule.mjs            check ops/schedule.tsv against the workflows, the gates and the scripts
//
// ops/schedule.tsv lists every generated artifact the freshness contract adds: artifact, generator
// command, workflow file, cadence, gate, snapshot_built. The check fails when
//   - the file is malformed (header, column count, cadence, gate, date, duplicate artifact);
//   - a row's generator command is not on a non-comment line of its workflow file;
//   - a row's gate has no `echo "== <gate> ` banner in site/scripts/verify-site.sh;
// A `// writes:` header lists committed outputs separated by ", ". Three values are not artifacts:
// `temporary files only`; `goldens (UPDATE_GOLDENS=1)`, which only a person rewrites and no scheduled job
// ever does (SPEC.md FR-O.2); and `fixtures (manual record, see PROVENANCE.md)`, recorded inputs on the same
// footing, allowed only when watch/freshness/fixtures/PROVENANCE.md names the script (SPEC.md FR-H.7).
// Exit 0 with `SCHEDULE_OK`; 1 with `SCHEDULE_BAD` and one indented line per problem.
// Node 22 built-ins only. Writes nothing.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const COLUMNS = ['artifact', 'generator', 'workflow', 'cadence', 'gate', 'snapshot_built'];
export const FIXTURE_RECORD = 'fixtures (manual record, see PROVENANCE.md)';
export const NOT_ARTIFACTS = ['temporary files only', 'goldens (UPDATE_GOLDENS=1)', FIXTURE_RECORD];
const PROVENANCE = 'watch/freshness/fixtures/PROVENANCE.md';
export const CADENCES = ['daily', 'weekly', 'on push'];

// File-writing calls, sync and fs.promises forms. A match anywhere in the source counts, comments included:
// a false alarm costs one header line, a miss lets an unscheduled artifact land.
export const WRITE_API = /\b(writeFileSync|appendFileSync|renameSync|cpSync|copyFileSync|rmSync|unlinkSync|mkdtempSync|createWriteStream|writeFile|appendFile|rename|cp|copyFile|rm|unlink|mkdtemp)\s*\(/;

// Parses schedule.tsv. Returns { rows, problems }; '#' lines and blank lines are skipped.
export function parseSchedule(text) {
  const problems = [];
  const lines = text.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.trim() !== '' && !l.startsWith('#'));
  if (lines.length === 0) return { rows: [], problems: ['ops/schedule.tsv has no header'] };
  const [[hn, header], ...body] = lines;
  if (header !== COLUMNS.join('\t')) problems.push(`line ${hn}: header must be exactly ${COLUMNS.join('<TAB>')}`);
  const rows = [];
  const seen = new Set();
  for (const [n, l] of body) {
    const f = l.split('\t');
    if (f.length !== COLUMNS.length) { problems.push(`line ${n}: ${f.length} columns, expected ${COLUMNS.length}`); continue; }
    const row = Object.fromEntries(COLUMNS.map((c, i) => [c, f[i].trim()]));
    for (const c of COLUMNS) if (!row[c]) problems.push(`line ${n}: empty ${c}`);
    if (row.cadence && !CADENCES.includes(row.cadence)) problems.push(`line ${n}: cadence ${JSON.stringify(row.cadence)} is not one of ${CADENCES.join(', ')}`);
    if (row.snapshot_built && row.snapshot_built !== '-' && !/^\d{4}-\d{2}-\d{2}$/.test(row.snapshot_built)) problems.push(`line ${n}: snapshot_built must be YYYY-MM-DD or -`);
    if (seen.has(row.artifact)) problems.push(`line ${n}: artifact ${row.artifact} is listed twice`);
    seen.add(row.artifact);
    rows.push({ ...row, line: n });
  }
  if (body.length === 0) problems.push('ops/schedule.tsv has no rows');
  return { rows, problems };
}

// The workflow text without YAML comment lines, so a commented-out command does not count as scheduled.
export function activeWorkflowText(text) {
  return text.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
}

// Problems with one row against its workflow and verify-site.sh.
export function checkRow(row, root) {
  const out = [];
  const wf = join(root, row.workflow);
  if (!row.workflow.startsWith('.github/workflows/') || !existsSync(wf)) out.push(`line ${row.line}: workflow ${row.workflow} does not exist`);
  else if (!activeWorkflowText(readFileSync(wf, 'utf8')).includes(row.generator)) out.push(`line ${row.line}: generator \`${row.generator}\` is not run by ${row.workflow}`);
  const verify = join(root, 'site/scripts/verify-site.sh');
  const banner = new RegExp(`^echo "== ${row.gate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`, 'm');
  if (!existsSync(verify) || !banner.test(readFileSync(verify, 'utf8'))) out.push(`line ${row.line}: gate ${row.gate} is not in site/scripts/verify-site.sh`);
  return out;
}

// Every .mjs under watch/freshness/ (recursively) and site/scripts/make-live.mjs, as repository paths.
export function scriptsToScan(root) {
  const out = [];
  const walk = (rel) => {
    for (const name of readdirSync(join(root, rel)).sort()) {
      const p = `${rel}/${name}`;
      if (statSync(join(root, p)).isDirectory()) walk(p);
      else if (name.endsWith('.mjs')) out.push(p);
    }
  };
  if (existsSync(join(root, 'watch/freshness'))) walk('watch/freshness');
  if (existsSync(join(root, 'site/scripts/make-live.mjs'))) out.push('site/scripts/make-live.mjs');
  return out;
}

// The `// writes:` header values of a source text, or null when it has none. Values are separated by
// ", " outside parentheses, so `fixtures (manual record, see PROVENANCE.md)` stays one value.
export function declaredWrites(text) {
  const m = text.match(/^\/\/ writes: (.+)$/m);
  if (!m) return null;
  const out = [];
  let depth = 0, cur = '';
  for (let i = 0; i < m[1].length; i++) {
    const ch = m[1][i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && m[1].startsWith(', ', i)) { out.push(cur); cur = ''; i++; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

// Problems with one script: an undeclared writer, a declared artifact without a row, or a fixture recorder
// that PROVENANCE.md does not name.
export function checkScript(path, text, artifacts, provenance = '') {
  const writes = WRITE_API.test(text);
  const decl = declaredWrites(text);
  if (writes && !decl) return [`${path}: calls a file-writing API but has no \`// writes:\` header`];
  const out = [];
  for (const a of decl ?? []) {
    if (a === FIXTURE_RECORD) {
      const name = path.split('/').pop();
      if (!provenance.includes(name)) out.push(`${path}: records fixtures but ${PROVENANCE} does not name ${name}`);
    } else if (!NOT_ARTIFACTS.includes(a) && !artifacts.has(a)) out.push(`${path}: writes ${a}, which has no row in ops/schedule.tsv`);
  }
  return out;
}

// The whole check. Returns { rows, scripts, writers, problems }.
export function checkSchedule(root = ROOT) {
  const path = join(root, 'ops/schedule.tsv');
  if (!existsSync(path)) return { rows: [], scripts: 0, writers: 0, problems: ['ops/schedule.tsv is missing'] };
  const { rows, problems } = parseSchedule(readFileSync(path, 'utf8'));
  for (const r of rows) problems.push(...checkRow(r, root));
  const artifacts = new Set(rows.map((r) => r.artifact));
  const scripts = scriptsToScan(root);
  const provenance = existsSync(join(root, PROVENANCE)) ? readFileSync(join(root, PROVENANCE), 'utf8') : '';
  let writers = 0;
  for (const s of scripts) {
    const text = readFileSync(join(root, s), 'utf8');
    if (WRITE_API.test(text)) writers++;
    problems.push(...checkScript(s, text, artifacts, provenance));
  }
  return { rows, scripts: scripts.length, writers, problems };
}

function main() {
  const r = checkSchedule();
  if (r.problems.length === 0) {
    console.log(`SCHEDULE_OK rows=${r.rows.length} scripts=${r.scripts} writers=${r.writers}`);
    return 0;
  }
  console.log(`SCHEDULE_BAD rows=${r.rows.length} scripts=${r.scripts} problems=${r.problems.length}`);
  for (const p of r.problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
