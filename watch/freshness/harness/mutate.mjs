#!/usr/bin/env node
// watch/freshness/harness/mutate.mjs: mutation runner for SPEC.md FR-H.6 (gate W3).
//
//   node watch/freshness/harness/mutate.mjs            run every mutant in harness/mutants.json
//   node watch/freshness/harness/mutate.mjs --json     the same, one JSON object on stdout
//
// A mutant is `{ id, file, find, replace, clauses, must_fail }`. The runner copies the parts of the
// repository the cases read (COPY) into a temporary directory, then:
//   1. baseline: runs every must_fail case on the unmutated copy; each must PASS, or no mutant can be judged;
//   2. makes one more copy per worker (WORKERS: the machine's parallelism, at most 8), and on each copy in
//      turn replaces `find` (which must occur exactly once in `file`) with `replace`, runs
//      `run.mjs --ids <must_fail>` there, and restores the file byte for byte, so no two mutants share a copy;
//   3. a mutant is KILLED when every must_fail case reports FAIL. A harness error (exit 2, for example an
//      import that no longer loads) is ERROR, not a kill: it shows the mutant, not the cases.
// Exit 0 only when there is at least one mutant, every mutant is killed, the baseline passes, and the
// mutant set covers the clauses FR-H.6 names (coverageGaps). Exit 1 otherwise; 2 on a usage error.
// The copies live under os.tmpdir() and are removed before the command returns.
// Node 22 built-ins only.
// writes: temporary files only

import { readFileSync, writeFileSync, existsSync, mkdtempSync, cpSync, rmSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { tmpdir, availableParallelism } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..', '..');
export const MUTANTS = join(HERE, 'mutants.json');

// What the cases read, per the owners of the case files (FreshCore, FreshOutputs, FreshHarness).
export const COPY = [
  'watch', 'site/scripts', 'site/briefs', 'site/feed.xml', 'synthesis/00-overview.md',
  'packets', 'updates', 'ops', 'cohorts', '.github/workflows', 'package.json', 'CHANGELOG.md',
];

// FR-H.6 names these clauses. FR-C.2 has six rules in a fixed order (C6, C5, C4, C2, C1, C3); swapping each
// adjacent pair is one mutant, so "each FR-C.2 rule order" needs at least five.
export const REQUIRED = { 'FR-C.2': 5, 'FR-C.3': 1, 'FR-C.4': 1, 'FR-T.2': 1, 'FR-T.4': 1, 'FR-T.5': 1 };

// Checks the shape of mutants.json and returns the entries; throws on the first malformed one.
export function validateMutants(list) {
  if (!Array.isArray(list)) throw new Error('mutants.json must be a JSON array');
  const seen = new Set();
  for (const m of list) {
    const where = `mutant ${JSON.stringify(m?.id)}`;
    for (const k of ['id', 'file', 'find']) if (typeof m?.[k] !== 'string' || m[k] === '') throw new Error(`${where}: ${k} must be a non-empty string`);
    if (typeof m.replace !== 'string') throw new Error(`${where}: replace must be a string`);
    if (m.find === m.replace) throw new Error(`${where}: replace equals find, so nothing is mutated`);
    if (seen.has(m.id)) throw new Error(`${where}: duplicate id`);
    seen.add(m.id);
    for (const k of ['clauses', 'must_fail']) {
      if (!Array.isArray(m[k]) || m[k].length === 0 || m[k].some((x) => typeof x !== 'string' || !x)) throw new Error(`${where}: ${k} must be a non-empty array of strings`);
    }
    if (m.file.startsWith('/') || m.file.split('/').includes('..')) throw new Error(`${where}: file must be a relative path inside the repository`);
  }
  return list;
}

export function loadMutants(path = MUTANTS) {
  if (!existsSync(path)) return [];
  return validateMutants(JSON.parse(readFileSync(path, 'utf8')));
}

// The clauses FR-H.6 requires that the set does not cover yet, as "FR-C.2 needs 5, has 3".
export function coverageGaps(mutants, required = REQUIRED) {
  const gaps = [];
  for (const [k, n] of Object.entries(required)) {
    const have = mutants.filter((m) => m.clauses.includes(k)).length;
    if (have < n) gaps.push(`${k} needs ${n}, has ${have}`);
  }
  return gaps;
}

// The mutated text. `find` must occur exactly once, so the mutation is exactly the one the entry names.
export function applyMutant(text, m) {
  const first = text.indexOf(m.find);
  if (first < 0) throw new Error(`mutant ${m.id}: find text not found in ${m.file}`);
  if (text.indexOf(m.find, first + 1) >= 0) throw new Error(`mutant ${m.id}: find text occurs more than once in ${m.file}`);
  return text.slice(0, first) + m.replace + text.slice(first + m.find.length);
}

// Copies the listed paths (those that exist) from root into a fresh temporary directory.
export function copyTree(root, paths) {
  const dir = mkdtempSync(join(tmpdir(), 'fr-mutate-'));
  for (const p of paths) {
    const from = join(root, p);
    if (!existsSync(from)) continue;
    cpSync(from, join(dir, p), { recursive: true, filter: (src) => !src.endsWith('.actual') && !src.split(sep).includes('node_modules') });
  }
  return dir;
}

// Runs `run.mjs --ids` inside dir and returns { code, verdicts: Map(id -> verdict), tail }.
export function runIds(dir, ids) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [join(dir, 'watch/freshness/harness/run.mjs'), '--ids', ids.join(',')], {
      cwd: dir, env: { ...process.env, UPDATE_GOLDENS: '', FRESH_MUTATION_CHILD: '1' },
    });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', (s) => { stdout += s; });
    child.stderr.setEncoding('utf8').on('data', (s) => { stderr += s; });
    const timer = setTimeout(() => { stderr += ' timed out after 120 s'; child.kill('SIGKILL'); }, 120_000);
    child.on('error', (e) => { stderr += ` ${e.message}`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      const verdicts = new Map();
      for (const line of stdout.split('\n')) {
        if (!line.startsWith('{')) continue;
        try { const o = JSON.parse(line); if (o.id) verdicts.set(o.id, o.verdict); } catch { /* not a result line */ }
      }
      resolveRun({ code: code ?? 2, verdicts, tail: stderr.trim().split('\n').slice(-2).join(' | ') });
    });
  });
}

// One mutant against a copy no other mutant is using: KILLED, SURVIVED (names the cases still passing) or ERROR.
export async function judgeMutant(dir, m) {
  const t0 = process.hrtime.bigint();
  const path = join(dir, m.file);
  if (!existsSync(path)) return { id: m.id, status: 'ERROR', detail: `${m.file} is not in the copy`, seconds: 0 };
  const original = readFileSync(path, 'utf8');
  let mutated;
  try { mutated = applyMutant(original, m); } catch (e) { return { id: m.id, status: 'ERROR', detail: e.message, seconds: 0 }; }
  writeFileSync(path, mutated);
  let run;
  try { run = await runIds(dir, m.must_fail); } finally { writeFileSync(path, original); }
  const seconds = Number(process.hrtime.bigint() - t0) / 1e9;
  if (run.code === 2) return { id: m.id, status: 'ERROR', detail: `harness error under the mutant: ${run.tail}`, seconds };
  const alive = m.must_fail.filter((id) => run.verdicts.get(id) !== 'FAIL');
  if (alive.length === 0) return { id: m.id, status: 'KILLED', detail: `failed: ${m.must_fail.join(', ')}`, seconds };
  return { id: m.id, status: 'SURVIVED', detail: `not failing: ${alive.map((id) => `${id}=${run.verdicts.get(id) ?? 'missing'}`).join(', ')}`, seconds };
}

// Parallel copies: one per worker, at most 8, so two mutants never share a file.
export const WORKERS = Math.max(1, Math.min(availableParallelism(), 8));

// The whole run. Returns { baseline: [problems], results (in mutants.json order), killed, total, gaps, seconds, workers, ok }.
export async function runMutants({ root = ROOT, mutants, copy = COPY, required = REQUIRED, workers = WORKERS }) {
  const t0 = process.hrtime.bigint();
  const gaps = coverageGaps(mutants, required);
  const out = { baseline: [], results: [], killed: 0, total: mutants.length, gaps, seconds: 0, workers: 0, ok: false };
  if (mutants.length === 0) {
    out.baseline.push('no mutants: an empty mutant set is a failure');
    return out;
  }
  const dirs = [copyTree(root, copy)];
  try {
    const ids = [...new Set(mutants.flatMap((m) => m.must_fail))].sort();
    const base = await runIds(dirs[0], ids);
    if (base.code === 2) out.baseline.push(`harness error on the unmutated copy: ${base.tail}`);
    for (const id of ids) if (base.verdicts.get(id) !== 'PASS') out.baseline.push(`${id} is ${base.verdicts.get(id) ?? 'missing'} before any mutation`);
    if (out.baseline.length === 0) {
      while (dirs.length < Math.min(workers, mutants.length)) dirs.push(copyTree(dirs[0], copy));
      out.workers = dirs.length;
      const results = new Array(mutants.length);
      let next = 0;
      await Promise.all(dirs.map(async (dir) => {
        while (next < mutants.length) {
          const i = next++;
          results[i] = await judgeMutant(dir, mutants[i]);
        }
      }));
      out.results = results;
    }
  } finally {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
  }
  out.killed = out.results.filter((r) => r.status === 'KILLED').length;
  out.seconds = Number(process.hrtime.bigint() - t0) / 1e9;
  out.ok = out.baseline.length === 0 && gaps.length === 0 && out.killed === out.total;
  return out;
}

function print(res) {
  for (const p of res.baseline) console.log(`BASELINE ${p}`);
  for (const r of res.results) console.log(`${r.status} ${r.id} (${r.seconds.toFixed(2)} s): ${r.detail}`);
  for (const g of res.gaps) console.log(`GAP ${g}`);
  console.log(`MUTANTS ${res.total}`);
  console.log(`KILLED ${res.killed}`);
  console.log(`SURVIVED ${res.results.filter((r) => r.status === 'SURVIVED').length}`);
  console.log(`ERRORS ${res.results.filter((r) => r.status === 'ERROR').length}`);
  console.log(`WORKERS ${res.workers}`);
  console.log(`SECONDS ${res.seconds.toFixed(2)}`);
  console.log(res.ok ? `MUTATION_OK ${res.killed}/${res.total}` : `MUTATION_BAD ${res.killed}/${res.total}`);
}

async function main(argv) {
  if (argv.some((a) => a !== '--json')) { console.error(`usage: mutate.mjs [--json]`); return 2; }
  const res = await runMutants({ mutants: loadMutants() });
  if (argv.includes('--json')) console.log(JSON.stringify(res));
  else print(res);
  return res.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`MUTATE ERROR: ${e?.message ?? e}`); process.exit(2); });
}
