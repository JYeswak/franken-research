// watch/freshness/cases/harness.cases.mjs: cases for the harness itself and the schedule (FreshHarness).
//
// Covers FR-H.2 (coverage accounting and the runner's fixed interface), FR-H.6 (the mutation runner and
// the real mutant set), FR-H.8 (REPORT.md), FR-O.1, FR-O.2, FR-O.4, the commit guard for FR-L.5, and the
// workflow half of FR-D.4. Each planted fault is built from synthetic inputs, most in a throwaway tree
// under os.tmpdir() that the case removes before it returns. Real repository files are read through
// ctx.root, so a mutation copy tests itself.
// writes: temporary files only

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  parseClauses, unparsedClauseLines, runCases, coverage, decideExit, collectMetrics, renderReport, badMetrics,
} from '../harness/run.mjs';
import { validateMutants, applyMutant, coverageGaps, runMutants, loadMutants, REQUIRED } from '../harness/mutate.mjs';
import { parseSchedule, checkSchedule, activeWorkflowText } from '../../../ops/schedule.mjs';
import { writeJobProblems, orderProblems, SYNC } from '../../../ops/write-job.mjs';
import { parseYaml } from '../yaml.mjs';
import { staleness, staleLine } from '../../../ops/stale-run.mjs';
import { outsideRegionChange } from '../../../ops/briefs-guard.mjs';

// ---------- small helpers ----------

// Runs fn(dir) with a fresh temporary directory and always removes it.
function withTmp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fr-har-'));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// The same for an async fn: the directory is removed after the promise settles.
async function withTmpAsync(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fr-har-'));
  try { return await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function put(dir, rel, text) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
}

// Collects failed checks as strings; a case passes when the list is empty.
function checks() {
  const bad = [];
  const expect = (ok, what) => { if (!ok) bad.push(what); };
  const result = (extra = {}) => ({ pass: bad.length === 0, detail: bad.join('; '), ...extra });
  return { expect, result };
}

const SYN_CLAUSES = new Map([['FR-X.1', 'MUST'], ['FR-X.2', 'SHOULD']]);
const SYN_DISCS = new Map([
  ['DISC-001', { resolution: 'ACCEPTED', review: '2026-12-01', title: 'synthetic', clause: 'FR-X.1' }],
  ['DISC-002', { resolution: null, review: null, title: 'incomplete', clause: 'FR-X.1' }],
]);
const SYN_CTX = { root: '/nonexistent', fixtures: '/nonexistent', golden: () => ({ pass: true }), updating: false };
const syn = (c) => ({ file: 'synthetic.cases.mjs', clauses: ['FR-X.1'], level: 'MUST', title: c.id, ...c });
const runSyn = (cases, discs = SYN_DISCS) => runCases(cases.map(syn), SYN_CLAUSES, discs, SYN_CTX);

async function throwsWith(fn, re) {
  try { await fn(); return false; } catch (e) { return re.test(String(e?.message ?? e)); }
}

// A minimal repository around a copy of the real runner: one clause, one module, one case.
const LIB = 'export function max(a, b) {\n  return a > b ? a : b;\n}\n';
const CASE_FILE = "import { max } from '../lib.mjs';\nexport default [{ id: 'S-max', clauses: ['FR-X.1'], level: 'MUST', title: 'max', run: () => max(2, 1) === 2 && max(1, 2) === 2 }];\n";
function makeTree(dir, root, { spec = '**FR-X.1** (MUST) max returns the larger argument.\n', lib = LIB, cases = CASE_FILE } = {}) {
  put(dir, 'watch/freshness/harness/run.mjs', readFileSync(join(root, 'watch/freshness/harness/run.mjs'), 'utf8'));
  put(dir, 'watch/freshness/SPEC.md', spec);
  put(dir, 'watch/freshness/lib.mjs', lib);
  if (cases !== null) put(dir, 'watch/freshness/cases/s.cases.mjs', cases);
}
function runner(dir, args, env = {}) {
  const r = spawnSync(process.execPath, [join(dir, 'watch/freshness/harness/run.mjs'), ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, UPDATE_GOLDENS: '', ...env } });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

// ---------- FR-H.2: coverage accounting and planted runner faults ----------

const h2 = [
  {
    id: 'HAR-H2-spec-parse', clauses: ['FR-H.2'], level: 'MUST',
    title: 'the clause list comes from SPEC.md, and a malformed clause line is refused, not skipped',
    run(ctx) {
      const c = checks();
      const text = readFileSync(join(ctx.root, 'watch/freshness/SPEC.md'), 'utf8');
      const clauses = parseClauses(text);
      const boldLines = text.split('\n').filter((l) => /^\*\*FR-[A-Z]\.\d+\*\*/.test(l) && !/RETIRED/.test(l)).length;
      c.expect(clauses.size === boldLines, `parsed ${clauses.size} clauses but SPEC.md has ${boldLines} clause lines`);
      c.expect(unparsedClauseLines(text).length === 0, `unparsed clause lines: ${unparsedClauseLines(text).join(' | ')}`);
      const planted = '**FR-Z.1** (MUST) fine.\n**FR-Z.2** (must) lower case level.\n**FR-Z.3** (RETIRED 2026-10-01) replaced by FR-Z.4.\n';
      c.expect(parseClauses(planted).size === 1, 'planted spec: expected 1 parsed clause');
      c.expect(unparsedClauseLines(planted).length === 1 && unparsedClauseLines(planted)[0].startsWith('**FR-Z.2**'), 'planted lower-case level not reported as unparsed');
      c.expect(throwsWithSync(() => parseClauses('**FR-Z.1** (MUST) a\n**FR-Z.1** (SHOULD) b\n'), /twice/), 'a clause defined twice is not refused');
      return c.result();
    },
  },
  {
    id: 'HAR-H2-coverage-rules', clauses: ['FR-H.2'], level: 'MUST',
    title: 'a MUST clause counts as covered only with a PASS or XFAIL case and no FAIL case',
    run() {
      const c = checks();
      const res = (id, clauses, verdict) => ({ id, clauses, level: 'MUST', verdict, detail: '' });
      const clauses = new Map([['FR-X.1', 'MUST'], ['FR-X.2', 'MUST'], ['FR-X.3', 'MUST'], ['FR-X.4', 'SHOULD']]);
      const results = [res('a', ['FR-X.1'], 'PASS'), res('b', ['FR-X.2'], 'PASS'), res('c', ['FR-X.2'], 'FAIL'), res('d', ['FR-X.4'], 'XFAIL')];
      const [row] = coverage(clauses, results);
      c.expect(JSON.stringify(row.missing) === JSON.stringify(['FR-X.2', 'FR-X.3']), `missing ${JSON.stringify(row.missing)}, expected FR-X.2 (a failing case) and FR-X.3 (no case)`);
      c.expect(row.covered === 2 && row.pass === 1 && row.xfail === 1, `covered/pass/xfail ${row.covered}/${row.pass}/${row.xfail}, expected 2/1/1`);
      c.expect(decideExit({ results: [res('a', ['FR-X.1'], 'PASS')], uncovered: ['FR-X.3'], partial: false }) === 1, 'full run with an uncovered MUST does not exit 1');
      c.expect(decideExit({ results: [res('a', ['FR-X.1'], 'PASS')], uncovered: ['FR-X.3'], partial: true }) === 0, 'a --only run enforces coverage');
      c.expect(decideExit({ results: [], uncovered: [], partial: true }) === 1, 'an empty case set does not exit 1');
      c.expect(decideExit({ results: [res('a', ['FR-X.1'], 'XFAIL')], uncovered: [], partial: false }) === 0, 'an XFAIL-only run does not exit 0');
      c.expect(decideExit({ results: [res('a', ['FR-X.1'], 'FAIL')], uncovered: [], partial: false }) === 1, 'a FAIL does not exit 1');
      return c.result();
    },
  },
  {
    id: 'HAR-H2-planted-faults', clauses: ['FR-H.2'], level: 'MUST',
    title: 'unknown clause, duplicate id, bad level, XFAIL to a missing or incomplete DISC, pass-while-XFAIL, throw, bad metrics',
    async run() {
      const c = checks();
      c.expect(await throwsWith(() => runSyn([{ id: 'u', clauses: ['FR-X.9'], run: () => true }]), /not in SPEC\.md/), 'an unknown clause is not refused');
      c.expect(await throwsWith(() => runSyn([{ id: 'd', run: () => true }, { id: 'd', run: () => true }]), /duplicate case id/), 'a duplicate id is not refused');
      c.expect(await throwsWith(() => runSyn([{ id: 'l', level: 'must', run: () => true }]), /level must be/), 'a bad level is not refused');
      c.expect(await throwsWith(() => runSyn([{ id: 'n', clauses: [], run: () => true }]), /names no clause/), 'a case with no clause is not refused');
      const r = await runSyn([
        { id: 'x-missing', run: () => ({ pass: false, xfail: 'DISC-404' }) },
        { id: 'x-incomplete', run: () => ({ pass: false, xfail: 'DISC-002' }) },
        { id: 'x-ok', run: () => ({ pass: false, xfail: 'DISC-001' }) },
        { id: 'x-passing', run: () => ({ pass: true, xfail: 'DISC-001' }) },
        { id: 'throws', run: () => { throw new Error('boom'); } },
        { id: 'returns-junk', run: () => 'yes' },
        { id: 'metric-name', run: () => ({ pass: true, metrics: { 'Bad Name': 1 } }) },
        { id: 'metric-nan', run: () => ({ pass: true, metrics: { 'fidelity.ci': NaN } }) },
        { id: 'metric-ok', run: () => ({ pass: true, metrics: { 'fidelity.ci': '40/44' } }) },
      ]);
      const v = Object.fromEntries(r.map((x) => [x.id, x]));
      c.expect(v['x-missing'].verdict === 'FAIL', 'XFAIL to a DISC that does not exist is not FAIL');
      c.expect(v['x-incomplete'].verdict === 'FAIL', 'XFAIL to a DISC without Resolution and Review date is not FAIL');
      c.expect(v['x-ok'].verdict === 'XFAIL', 'XFAIL to a complete DISC is not XFAIL');
      c.expect(v['x-passing'].verdict === 'FAIL', 'a passing case that still claims XFAIL is not FAIL');
      c.expect(v.throws.verdict === 'FAIL' && /threw: .*boom/.test(v.throws.detail), 'a throwing case is not FAIL with its message');
      c.expect(v['returns-junk'].verdict === 'FAIL', 'a case returning a string is not FAIL');
      c.expect(v['metric-name'].verdict === 'FAIL' && v['metric-nan'].verdict === 'FAIL', 'malformed metrics do not fail their case');
      c.expect(v['metric-ok'].verdict === 'PASS' && v['metric-ok'].metrics?.['fidelity.ci'] === '40/44', 'a valid metric is not carried on the result');
      c.expect(badMetrics([1]) !== null && badMetrics(undefined) === null, 'badMetrics accepts an array or refuses undefined');
      return c.result();
    },
  },
  {
    id: 'HAR-H2-exit-codes', clauses: ['FR-H.2'], level: 'MUST',
    title: 'the runner as a process: 0 green, 1 on an empty case set or a failure, 2 on a harness error',
    run(ctx) {
      const c = checks();
      withTmp((dir) => {
        makeTree(dir, ctx.root);
        let r = runner(dir, []);
        c.expect(r.code === 0 && /^CASES 1$/m.test(r.out) && /^UNCOVERED_MUST 0$/m.test(r.out), `green tree exited ${r.code}`);
        put(dir, 'watch/freshness/lib.mjs', LIB.replace('a > b', 'a < b'));
        r = runner(dir, []);
        c.expect(r.code === 1 && /^FAILED 1$/m.test(r.out), `a failing case exited ${r.code}`);
        put(dir, 'watch/freshness/lib.mjs', LIB);
        put(dir, 'watch/freshness/SPEC.md', '**FR-X.1** (MUST) max.\n**FR-X.2** (MUST) never tested.\n');
        r = runner(dir, []);
        c.expect(r.code === 1 && /^UNCOVERED_MUST 1$/m.test(r.out), `an uncovered MUST exited ${r.code}`);
        r = runner(dir, ['--only', 'S-']);
        c.expect(r.code === 0 && /^UNCOVERED_MUST not-enforced$/m.test(r.out), `--only with an uncovered MUST exited ${r.code}`);
        r = runner(dir, ['--only', 'NOPE']);
        c.expect(r.code === 1 && /NO CASES/.test(r.out), `--only matching nothing exited ${r.code}`);
        put(dir, 'watch/freshness/SPEC.md', '**FR-X.1** (MUST) max.\n**FR-X.2** (Must) malformed.\n');
        r = runner(dir, []);
        c.expect(r.code === 2 && /cannot read/.test(r.out), `a malformed clause line exited ${r.code}`);
        put(dir, 'watch/freshness/SPEC.md', '**FR-X.1** (MUST) max.\n');
        r = runner(dir, ['--ids', 'S-nope']);
        c.expect(r.code === 2, `--ids naming a missing case exited ${r.code}`);
        r = runner(dir, ['--frobnicate']);
        c.expect(r.code === 2, `an unknown flag exited ${r.code}`);
        rmSync(join(dir, 'watch/freshness/cases'), { recursive: true });
        r = runner(dir, []);
        c.expect(r.code === 1 && /NO CASES/.test(r.out), `no case files exited ${r.code}`);
      });
      return c.result();
    },
  },
];

function throwsWithSync(fn, re) {
  try { fn(); return false; } catch (e) { return re.test(String(e?.message ?? e)); }
}

// ---------- FR-H.8: REPORT.md ----------

const SYN_SPEC = '**FR-X.1** (MUST) one.\n**FR-X.2** (SHOULD) two.\n';
const synResult = (id, verdict, extra = {}) => ({ id, clauses: ['FR-X.1'], level: 'MUST', verdict, detail: verdict === 'XFAIL' ? 'DISC-001 (ACCEPTED): /Users/someone/path' : '/Users/someone/path', title: id, ...extra });

const h8 = [
  {
    id: 'HAR-H8-render', clauses: ['FR-H.8'], level: 'MUST',
    title: 'REPORT.md is order-independent, clock-free, path-free, and says "not measured" instead of zero',
    run() {
      const c = checks();
      const results = [
        synResult('b', 'PASS', { metrics: { 'labelled.n': 0, 'fidelity.ci': '41/44' } }),
        synResult('a', 'XFAIL', { metrics: { 'custom.thing': 3 } }),
        synResult('c', 'PASS', { metrics: { 'labelled.n': 0 } }),
      ];
      const args = { specText: SYN_SPEC, discs: SYN_DISCS, caseFiles: 2 };
      const one = renderReport({ ...args, results });
      const two = renderReport({ ...args, results: [...results].reverse() });
      c.expect(one === two, 'the report depends on the order cases ran in');
      c.expect(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(one), 'the report carries a clock time');
      c.expect(!one.includes('/Users/'), 'the report carries case detail text (machine paths)');
      c.expect(/\| Labelled events: set size \| 0 \|/.test(one), 'a metric reported as 0 is not shown as 0');
      c.expect(/\| Labelled events: precision \| not measured \|/.test(one), 'an unreported metric is not shown as "not measured"');
      c.expect(/\| CI class at the pin[^|]*\| 41\/44 \|/.test(one), 'fidelity.ci is not shown');
      c.expect(/\| labelled\.n \| FR-H\.4 \| 0 \| b \(PASS\), c \(PASS\) \|/.test(one), 'a metric does not name every case that reported it');
      c.expect(/\| custom\.thing \| 3 \| a \(XFAIL\) \|/.test(one), 'an extra metric is not listed under Other metrics');
      for (const h of ['## Summary', '## Spec coverage by section (FR-H.2)', '## Spec coverage by clause', '## Fidelity against the master matrix (FR-H.1)', '## Labelled events (FR-H.4)', '## Replay noise (FR-H.5)', '## Mutation score (FR-H.6)', '## Discrepancies (DISCREPANCIES.md)']) {
        c.expect(one.includes(`\n${h}\n`), `section missing: ${h}`);
      }
      c.expect(/\| FR-X\.1 \| MUST \| PASS \| a \(XFAIL\), b \(PASS\), c \(PASS\) \|/.test(one), 'the per-clause row is wrong');
      c.expect(/\| FR-X\.2 \| SHOULD \| uncovered \| - \|/.test(one), 'an uncovered SHOULD is not shown as uncovered');
      c.expect(/\| DISC-001 \| synthetic \| FR-X\.1 \| ACCEPTED \| 2026-12-01 \| a \|/.test(one), 'a DISC does not list the case that XFAILs on it');
      c.expect(/\| DISC-002 \| incomplete \| FR-X\.1 \| missing \| missing \| - \|/.test(one), 'an incomplete DISC is not shown as missing its fields');
      c.expect(one.endsWith('\n') && !one.endsWith('\n\n'), 'the report does not end with exactly one newline');
      return c.result();
    },
  },
  {
    id: 'HAR-H8-metric-conflict', clauses: ['FR-H.8'], level: 'MUST',
    title: 'two cases reporting one metric with different values is a harness error, not a silent pick',
    run() {
      const c = checks();
      c.expect(throwsWithSync(() => collectMetrics([synResult('a', 'PASS', { metrics: { 'mutation.total': 5 } }), synResult('b', 'PASS', { metrics: { 'mutation.total': 6 } })]), /reported as 5 by a .* and 6 by b/), 'conflicting values are not refused');
      c.expect(collectMetrics([synResult('a', 'PASS', { metrics: { 'mutation.total': 5 } }), synResult('b', 'PASS', { metrics: { 'mutation.total': 5 } })]).get('mutation.total').by.length === 2, 'equal values from two cases are not both credited');
      return c.result();
    },
  },
  {
    id: 'HAR-H8-check-report', clauses: ['FR-H.8'], level: 'MUST',
    title: '--report then --check-report round-trips; a one-byte edit is REPORT_STALE with exit 1; misuse exits 2',
    run(ctx) {
      const c = checks();
      withTmp((dir) => {
        makeTree(dir, ctx.root);
        let r = runner(dir, ['--check-report']);
        c.expect(r.code === 1 && /REPORT_STALE .*missing/.test(r.out), `a missing REPORT.md exited ${r.code}`);
        r = runner(dir, ['--report']);
        c.expect(r.code === 0 && existsSync(join(dir, 'watch/freshness/REPORT.md')), `--report exited ${r.code}`);
        r = runner(dir, ['--check-report']);
        c.expect(r.code === 0 && /^REPORT_OK /m.test(r.out), `--check-report after --report exited ${r.code}`);
        const path = join(dir, 'watch/freshness/REPORT.md');
        writeFileSync(path, readFileSync(path, 'utf8').replace('| 1 | 1 | 0 | 0 |', '| 1 | 1 | 0 | 1 |'));
        r = runner(dir, ['--check-report']);
        c.expect(r.code === 1 && /REPORT_STALE .*line \d+/.test(r.out), `a hand-edited REPORT.md exited ${r.code}`);
        put(dir, 'watch/freshness/SPEC.md', '**FR-X.1** (MUST) max, reworded.\n');
        runner(dir, ['--report']);
        put(dir, 'watch/freshness/SPEC.md', '**FR-X.1** (MUST) max.\n');
        r = runner(dir, ['--check-report']);
        c.expect(r.code === 1 && /REPORT_STALE/.test(r.out), `a report from another spec text exited ${r.code}`);
        c.expect(runner(dir, ['--report', '--only', 'S']).code === 2, '--report with --only is not refused');
        c.expect(runner(dir, ['--report'], { UPDATE_GOLDENS: '1' }).code === 2, '--report while updating goldens is not refused');
      });
      return c.result();
    },
  },
];

// ---------- FR-H.6: mutation runner and the real mutant set ----------

const SYN_MUTANTS = [
  { id: 'M-kill', file: 'watch/freshness/lib.mjs', find: 'a > b ? a : b', replace: 'a < b ? a : b', clauses: ['FR-X.1'], must_fail: ['S-max'] },
  { id: 'M-equivalent', file: 'watch/freshness/lib.mjs', find: 'a > b', replace: 'a >= b', clauses: ['FR-X.1'], must_fail: ['S-max'] },
  { id: 'M-absent', file: 'watch/freshness/lib.mjs', find: 'a * b', replace: 'a / b', clauses: ['FR-X.1'], must_fail: ['S-max'] },
  { id: 'M-twice', file: 'watch/freshness/lib.mjs', find: ' b', replace: ' c', clauses: ['FR-X.1'], must_fail: ['S-max'] },
  { id: 'M-crash', file: 'watch/freshness/lib.mjs', find: 'export function max', replace: 'export function mux', clauses: ['FR-X.1'], must_fail: ['S-max'] },
];

const h6 = [
  {
    id: 'HAR-H6-runner', clauses: ['FR-H.6'], level: 'MUST',
    title: 'the mutation runner kills a real mutant, reports a survivor, and refuses absent, ambiguous and crashing mutants',
    async run(ctx) {
      const c = checks();
      await withTmpAsync(async (dir) => {
        makeTree(dir, ctx.root);
        const all = await runMutants({ root: dir, mutants: SYN_MUTANTS, copy: ['watch'], required: {}, workers: 2 });
        const s = Object.fromEntries(all.results.map((r) => [r.id, r.status]));
        c.expect(all.baseline.length === 0, `baseline: ${all.baseline.join('; ')}`);
        c.expect(s['M-kill'] === 'KILLED', `M-kill is ${s['M-kill']}`);
        c.expect(s['M-equivalent'] === 'SURVIVED', `the equivalent mutant is ${s['M-equivalent']}`);
        c.expect(s['M-absent'] === 'ERROR' && s['M-twice'] === 'ERROR', `absent/ambiguous find: ${s['M-absent']}/${s['M-twice']}`);
        c.expect(s['M-crash'] === 'ERROR', `a mutant that breaks the import is ${s['M-crash']}, not ERROR`);
        c.expect(!all.ok && all.killed === 1 && all.total === 5 && all.workers === 2, `ok ${all.ok}, killed ${all.killed}/${all.total}, workers ${all.workers}`);
        c.expect(all.results.map((r) => r.id).join() === SYN_MUTANTS.map((m) => m.id).join(), 'results are not in mutants.json order');
        c.expect(readFileSync(join(dir, 'watch/freshness/lib.mjs'), 'utf8') === LIB, 'the source tree was modified');
        const one = await runMutants({ root: dir, mutants: [SYN_MUTANTS[0]], copy: ['watch'], required: {} });
        c.expect(one.ok && one.killed === 1, `a set of one killed mutant is not ok (${one.killed}/${one.total})`);
        const gap = await runMutants({ root: dir, mutants: [SYN_MUTANTS[0]], copy: ['watch'], required: { 'FR-X.1': 2 } });
        c.expect(!gap.ok && gap.gaps[0] === 'FR-X.1 needs 2, has 1', `a clause gap is not reported: ${gap.gaps.join('; ')}`);
        c.expect(!(await runMutants({ root: dir, mutants: [], copy: ['watch'], required: {} })).ok, 'an empty mutant set is ok');
        put(dir, 'watch/freshness/lib.mjs', LIB.replace('a > b', 'a < b'));
        const base = await runMutants({ root: dir, mutants: [SYN_MUTANTS[0]], copy: ['watch'], required: {} });
        c.expect(!base.ok && base.results.length === 0 && /S-max is FAIL before any mutation/.test(base.baseline.join()), 'a failing baseline still judged mutants');
      });
      return c.result();
    },
  },
  {
    id: 'HAR-H6-validate', clauses: ['FR-H.6'], level: 'MUST',
    title: 'malformed mutant entries are refused before anything runs',
    run() {
      const c = checks();
      const ok = SYN_MUTANTS[0];
      const bad = [
        [[ok, ok], /duplicate id/], [[{ ...ok, must_fail: [] }], /must_fail/], [[{ ...ok, clauses: [] }], /clauses/],
        [[{ ...ok, replace: ok.find }], /nothing is mutated/], [[{ ...ok, file: '/etc/passwd' }], /relative path/],
        [[{ ...ok, file: '../x.mjs' }], /relative path/], [[{ ...ok, find: '' }], /find/], [{}, /array/],
      ];
      for (const [list, re] of bad) c.expect(throwsWithSync(() => validateMutants(list), re), `not refused: ${JSON.stringify(list).slice(0, 60)}`);
      c.expect(applyMutant('x a y', { id: 't', file: 'f', find: 'a', replace: 'b' }) === 'x b y', 'applyMutant does not replace exactly once');
      c.expect(coverageGaps([]).length === Object.keys(REQUIRED).length, 'an empty set does not miss every required clause');
      return c.result();
    },
  },
  {
    id: 'HAR-H6-mutants', clauses: ['FR-H.6'], level: 'MUST',
    title: 'every mutant in harness/mutants.json is killed by its named cases, and the set covers the clauses FR-H.6 names',
    async run(ctx) {
      if (process.env.FRESH_MUTATION_CHILD) return { pass: false, detail: 'refused: this case runs the mutation runner and cannot run inside a mutant copy' };
      const mutants = loadMutants(join(ctx.root, 'watch/freshness/harness/mutants.json'));
      const res = await runMutants({ root: ctx.root, mutants });
      const bad = [...res.baseline, ...res.gaps, ...res.results.filter((r) => r.status !== 'KILLED').map((r) => `${r.status} ${r.id}: ${r.detail}`)];
      return {
        pass: res.ok,
        detail: `${res.killed}/${res.total} killed in ${res.seconds.toFixed(1)} s${bad.length ? `; ${bad.join('; ')}` : ''}`,
        metrics: { 'mutation.killed': res.killed, 'mutation.total': res.total },
      };
    },
  },
];

// ---------- FR-O.1, FR-O.2: the schedule ----------

const SCHED_HEAD = 'artifact\tgenerator\tworkflow\tcadence\tgate\tsnapshot_built\n';
function schedBase(dir) {
  put(dir, 'ops/schedule.tsv', `# comment\n${SCHED_HEAD}out/a.json\tnode gen.mjs --x\t.github/workflows/w.yml\tdaily\tZ9\t-\n`);
  put(dir, '.github/workflows/w.yml', 'jobs:\n  a:\n    steps:\n      - run: |\n          node gen.mjs --x\n');
  put(dir, 'site/scripts/verify-site.sh', 'echo "== Z9 thing =="\n');
  put(dir, 'watch/freshness/gen.mjs', "// writes: out/a.json\nimport { writeFileSync } from 'node:fs';\nwriteFileSync('out/a.json', '{}');\n");
  put(dir, 'watch/freshness/fixtures/PROVENANCE.md', '# Provenance\n');
}

const o = [
  {
    id: 'HAR-O1-rows', clauses: ['FR-O.1'], level: 'MUST',
    title: 'ops/schedule.tsv is well formed and has a row for each artifact FR-O.1 names today',
    run(ctx) {
      const c = checks();
      const { rows, problems } = parseSchedule(readFileSync(join(ctx.root, 'ops/schedule.tsv'), 'utf8'));
      c.expect(problems.length === 0, problems.join('; '));
      const has = (re) => rows.some((r) => re.test(r.artifact));
      c.expect(has(/^watch\/live\.json$/), 'no row for watch/live.json');
      c.expect(has(/^watch\/crossings\.jsonl$/), 'no row for watch/crossings.jsonl');
      c.expect(has(/^site\/briefs\/\*\.html \(live:card regions\)$/), 'no row for the live:card regions');
      c.expect(has(/^site\/feed\.xml \(weekly digest entries\)$/), 'no row for the weekly digest entries');
      const plants = [
        ['artifact\tgenerator\n', /header must be/], [`${SCHED_HEAD}a\tb\tc\tdaily\tW3\n`, /5 columns/],
        [`${SCHED_HEAD}a\tb\tc\thourly\tW3\t-\n`, /cadence/], [`${SCHED_HEAD}a\tb\tc\tdaily\tW3\t2026-9-1\n`, /snapshot_built/],
        [`${SCHED_HEAD}a\tb\tc\tdaily\tW3\t-\na\tb\tc\tdaily\tW3\t-\n`, /listed twice/], [SCHED_HEAD, /no rows/],
        [`${SCHED_HEAD}a\t\tc\tdaily\tW3\t-\n`, /empty generator/],
      ];
      for (const [text, re] of plants) c.expect(parseSchedule(text).problems.some((p) => re.test(p)), `planted ${re} not reported`);
      c.expect(parseSchedule(`${SCHED_HEAD}a\tb\tc\tweekly\tW3\t2026-09-01\n`).problems.length === 0, 'a snapshot row with a date is refused');
      return c.result();
    },
  },
  {
    id: 'HAR-O2-planted', clauses: ['FR-O.2'], level: 'MUST',
    title: 'the schedule check fails on an unscheduled generator, a missing gate, an undeclared writer, an unlisted artifact and an unnamed fixture recorder',
    run() {
      const c = checks();
      const plants = [
        ['clean tree', () => {}, null],
        ['generator only in a YAML comment', (d) => put(d, '.github/workflows/w.yml', 'jobs:\n  a:\n    steps:\n      # - run: node gen.mjs --x\n      - run: echo hi\n'), /is not run by/],
        ['generator missing', (d) => put(d, '.github/workflows/w.yml', 'jobs: {}\n'), /is not run by/],
        ['workflow missing', (d) => rmSync(join(d, '.github/workflows/w.yml')), /does not exist/],
        ['gate missing', (d) => put(d, 'site/scripts/verify-site.sh', 'echo "== Z10 other =="\n'), /gate Z9 is not in/],
        ['writer without a header (fs.promises)', (d) => put(d, 'watch/freshness/sneaky.mjs', "import fs from 'node:fs';\nawait fs.promises.writeFile('watch/x.json', '1');\n"), /sneaky\.mjs: calls a file-writing API but has no/],
        ['writer without a header (rmSync, nested dir)', (d) => put(d, 'watch/freshness/harness/tidy.mjs', "import { rmSync } from 'node:fs';\nrmSync('x');\n"), /tidy\.mjs: calls a file-writing API/],
        ['make-live without a header', (d) => put(d, 'site/scripts/make-live.mjs', "import { writeFileSync } from 'node:fs';\nwriteFileSync('site/briefs/a.html', '');\n"), /make-live\.mjs: calls a file-writing API/],
        ['declared artifact without a row', (d) => put(d, 'watch/freshness/more.mjs', "// writes: out/b.json\nimport { writeFileSync } from 'node:fs';\n"), /writes out\/b\.json, which has no row/],
        ['fixture recorder missing from PROVENANCE.md', (d) => put(d, 'watch/freshness/rec.mjs', "// writes: fixtures (manual record, see PROVENANCE.md)\nimport { writeFileSync } from 'node:fs';\n"), /rec\.mjs: records fixtures but .* does not name rec\.mjs/],
        ['fixture recorder named in PROVENANCE.md', (d) => { put(d, 'watch/freshness/rec.mjs', "// writes: fixtures (manual record, see PROVENANCE.md)\nimport { writeFileSync } from 'node:fs';\n"); put(d, 'watch/freshness/fixtures/PROVENANCE.md', '# Provenance\nRecorded by `node watch/freshness/rec.mjs --record`.\n'); }, null],
        ['golden writer', (d) => put(d, 'watch/freshness/g.mjs', "// writes: goldens (UPDATE_GOLDENS=1)\nimport { writeFileSync } from 'node:fs';\n"), null],
        ['schedule missing', (d) => rmSync(join(d, 'ops/schedule.tsv')), /schedule\.tsv is missing/],
      ];
      for (const [name, plant, want] of plants) {
        withTmp((dir) => {
          schedBase(dir);
          plant(dir);
          const p = checkSchedule(dir).problems;
          if (want === null) c.expect(p.length === 0, `${name}: unexpected ${p.join(' | ')}`);
          else c.expect(p.some((x) => want.test(x)), `${name}: not reported (got ${p.join(' | ') || 'nothing'})`);
        });
      }
      c.expect(activeWorkflowText('a\n  # b\nc') === 'a\nc', 'comment lines are not dropped');
      return c.result();
    },
  },
  {
    id: 'HAR-O2-repository', clauses: ['FR-O.2', 'FR-O.1'], level: 'MUST',
    title: 'this repository passes the schedule check: each generator runs in its workflow, each gate exists, each writer is declared',
    run(ctx) {
      const r = checkSchedule(ctx.root);
      return { pass: r.problems.length === 0 && r.rows.length > 0, detail: r.problems.length ? r.problems.join('; ') : `${r.rows.length} rows, ${r.scripts} scripts scanned, ${r.writers} writers` };
    },
  },
  {
    id: 'HAR-O4-stale-run', clauses: ['FR-O.4'], level: 'SHOULD',
    title: 'the deploy smoke step warns when watch/live.json is more than 36 hours old',
    run(ctx) {
      const c = checks();
      const at = '2026-09-24T11:23:00Z';
      c.expect(!staleness(at, '2026-09-25T23:23:00Z').stale, 'exactly 36 h is stale');
      c.expect(staleness(at, '2026-09-25T23:23:01Z').stale, '36 h and one second is not stale');
      c.expect(!staleness(at, '2026-09-24T11:23:00Z').stale, 'zero age is stale');
      c.expect(staleness(at, '2026-09-24T11:22:59Z').stale, 'a checked_at in the future is not stale');
      c.expect(staleness('2026-09-24', '2026-09-24T12:00:00Z').stale && staleness(undefined, '2026-09-24T12:00:00Z').stale, 'a malformed checked_at is not stale');
      withTmp((dir) => {
        c.expect(/^::warning title=Missed daily watch::.*missing/.test(staleLine(join(dir, 'live.json'), '2026-09-25T00:00:00Z')), 'a missing live.json does not warn');
        writeFileSync(join(dir, 'live.json'), '{"checked_at":"2026-09-24T11:23:00Z"}\n');
        c.expect(/^::warning title=Missed daily watch::.*37\.0 h old/.test(staleLine(join(dir, 'live.json'), '2026-09-26T00:23:00Z')), 'a 37 h old run does not warn with its age');
        c.expect(/^LIVE_FRESH /.test(staleLine(join(dir, 'live.json'), '2026-09-24T12:23:00Z')), 'a 1 h old run warns');
        writeFileSync(join(dir, 'live.json'), '{');
        c.expect(/^::warning .*not JSON/.test(staleLine(join(dir, 'live.json'), '2026-09-24T12:23:00Z')), 'broken JSON does not warn');
      });
      const deploy = readFileSync(join(ctx.root, '.github/workflows/deploy.yml'), 'utf8');
      const step = deploy.slice(deploy.indexOf('- name: Smoke test'));
      const body = step.slice(0, step.indexOf('\n      - name:', 1) > 0 ? step.indexOf('\n      - name:', 1) : undefined);
      c.expect(deploy.includes('- name: Smoke test') && activeWorkflowText(body).includes('node ops/stale-run.mjs watch/live.json'), 'deploy.yml smoke step does not run ops/stale-run.mjs on watch/live.json');
      return c.result();
    },
  },
];

// ---------- FR-D.4 (workflow half) and FR-L.5 (commit guard) ----------

// The problems with a watch workflow text: it must run the watch with --apply and never the retired
// --issues path, and it must guard the brief commit.
export function watchWorkflowProblems(text) {
  const active = activeWorkflowText(text);
  const out = [];
  if (!active.includes('node watch/watch.mjs --apply')) out.push('does not run `node watch/watch.mjs --apply`');
  if (/watch\.mjs[^\n]*--issues/.test(active)) out.push('still runs watch.mjs with --issues');
  if (!/node ops\/briefs-guard\.mjs/.test(active)) out.push('commits briefs without ops/briefs-guard.mjs');
  return out;
}

// The real watch.yml with one exact edit; throws when `find` is not there once, so a plant that no longer
// applies fails its case instead of passing silently.
function plantWorkflow(text, find, replace) {
  const i = text.indexOf(find);
  if (i < 0 || text.indexOf(find, i + 1) >= 0) throw new Error(`plant text ${JSON.stringify(find.slice(0, 50))} is not in watch.yml exactly once`);
  return text.slice(0, i) + replace + text.slice(i + find.length);
}

// The goldens listed in the confidence matrix of watch/freshness/README.md, and the golden files on disk.
export function goldenMatrixDrift(readme, files) {
  const listed = new Set([...readme.matchAll(/^\| `goldens\/([^`]+)` \|/gm)].map((m) => m[1]));
  const onDisk = new Set(files);
  return [
    ...[...onDisk].filter((f) => !listed.has(f)).map((f) => `goldens/${f} is not in the README golden confidence matrix`),
    ...[...listed].filter((f) => !onDisk.has(f)).map((f) => `the README matrix lists goldens/${f}, which does not exist`),
  ].sort();
}

function goldenFiles(dir, rel = '') {
  if (!existsSync(join(dir, rel))) return [];
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return goldenFiles(dir, p);
    return e.name.endsWith('.actual') || e.name === '.gitignore' ? [] : [p];
  });
}

const rest = [
  {
    id: 'HAR-D4-workflow', clauses: ['FR-D.4'], level: 'MUST',
    title: 'the scheduled watch runs --apply, never --issues, and guards the brief commit',
    run(ctx) {
      const c = checks();
      const real = watchWorkflowProblems(readFileSync(join(ctx.root, '.github/workflows/watch.yml'), 'utf8'));
      c.expect(real.length === 0, `watch.yml: ${real.join('; ')}`);
      const good = '        run: |\n          node watch/watch.mjs --apply\n          node ops/briefs-guard.mjs\n';
      c.expect(watchWorkflowProblems(good).length === 0, 'a good workflow is refused');
      c.expect(watchWorkflowProblems(good.replace('--apply', '--apply --issues')).some((p) => /--issues/.test(p)), 'a workflow still passing --issues is accepted');
      c.expect(watchWorkflowProblems(good.replace('          node watch', '          # node watch')).some((p) => /does not run/.test(p)), 'a commented-out watch run is accepted');
      c.expect(watchWorkflowProblems(good.replace('node ops/briefs-guard.mjs', 'true')).some((p) => /briefs-guard/.test(p)), 'an unguarded brief commit is accepted');
      return c.result();
    },
  },
  {
    id: 'HAR-O6-write-job', clauses: ['FR-O.6'], level: 'MUST',
    title: 'the watch job runs only on main, its checkout persists no credentials, and only the watch, push and sync steps receive the token, in any notation',
    run(ctx) {
      const c = checks();
      const text = readFileSync(join(ctx.root, '.github/workflows/watch.yml'), 'utf8');
      const probs = (t) => writeJobProblems(parseYaml(t), 'watch.yml');
      const real = probs(text);
      c.expect(real.length === 0, `watch.yml: ${real.join('; ')}`);
      const tokenLine = '          GITHUB_TOKEN: ${{ github.token }}\n';
      const plants = [
        ['no main-only guard', "    if: github.ref == 'refs/heads/main'\n", '', /lacks `if: github\.ref == 'refs\/heads\/main'`/],
        ['guard names another branch', "if: github.ref == 'refs/heads/main'", "if: github.ref == 'refs/heads/dev'", /lacks `if:/],
        ['checkout persists credentials (default)', '          persist-credentials: false\n', '', /persist-credentials: false/],
        ['checkout persists credentials (explicit)', 'persist-credentials: false', 'persist-credentials: true', /persist-credentials: false/],
        ['token on install', '        run: bun install --frozen-lockfile\n', `        env:\n${tokenLine}        run: bun install --frozen-lockfile\n`, /Install.*installs, builds or runs gates with the token in reach \(env\)/],
        ['token on build', '      - name: Build (cards, feed, report)\n', `      - name: Build (cards, feed, report)\n        env:\n${tokenLine}`, /Build.*installs, builds or runs gates with the token in reach \(env\)/],
        ['token on the gate chain', '          CHROME_PATH: /usr/bin/google-chrome\n', `          CHROME_PATH: /usr/bin/google-chrome\n${tokenLine}`, /Gate chain.*installs, builds or runs gates with the token in reach \(env\)/],
        ['token in the job env', '    timeout-minutes: 5\n', `    timeout-minutes: 5\n    env:\n      GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}\n`, /token is in the job env/],
        ['token in the workflow env', 'concurrency:\n', `env:\n  GITHUB_TOKEN: \${{ github.token }}\nconcurrency:\n`, /token is in the workflow env/],
        ['push writes the token into .git/config', '          auth="$(', '          git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic x"\n          auth="$(', /writes a credential into the Git config/],
        // Review 3b (GPT-6-Luna): three plants the check missed before this case covered them.
        ['review 3b: bracket notation on the build step', '      - name: Build (cards, feed, report)\n', "      - name: Build (cards, feed, report)\n        env:\n          GH_TOKEN: ${{ secrets['GITHUB_TOKEN'] }}\n", /Build.*receives the token \(env\) but is not the watch, push or sync step/],
        ['review 3b: token on a uses step (setup-node)', '          node-version: 22\n', `          node-version: 22\n        env:\n${tokenLine}`, /actions\/setup-node.*receives the token \(env\) but is not the watch, push or sync step/],
        ['review 3b: a second push after the sync', '        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', `        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n\n      - name: Push again\n        env:\n${tokenLine}        run: git push origin HEAD:main\n`, /a git push \(step \d+\) follows the dashboard sync/],
        // Further notations and channels.
        ['token as a checkout input (double-quoted brackets)', '          persist-credentials: false\n', '          persist-credentials: false\n          token: ${{ secrets["GITHUB_TOKEN"] }}\n', /actions\/checkout.*receives the token \(with:\) but is not the watch, push or sync step/],
        ['token expanded into a comment line of the build run text', '          node site/scripts/make-live.mjs\n', '          # debug ${{ github.token }}\n          node site/scripts/make-live.mjs\n', /Build.*receives the token \(run text\)/],
        ['lower-case secrets.github_token on the gate chain', '          CHROME_PATH: /usr/bin/google-chrome\n', '          CHROME_PATH: /usr/bin/google-chrome\n          GH_TOKEN: ${{ secrets.github_token }}\n', /Gate chain.*receives the token \(env\)/],
      ];
      for (const [name, find, replace, want] of plants) {
        let p;
        try { p = probs(plantWorkflow(text, find, replace)); } catch (e) { c.expect(false, `${name}: ${e.message}`); continue; }
        c.expect(p.some((x) => want.test(x)), `${name}: not reported (got ${p.join(' | ') || 'nothing'})`);
      }
      const direct = (run) => ({ permissions: { contents: 'write' }, jobs: { w: { if: "github.ref == 'refs/heads/main'", steps: [{ run, env: { GITHUB_TOKEN: '${{ github.token }}' } }] } } });
      c.expect(writeJobProblems(direct('bash site/scripts/verify-site.sh')).some((x) => /installs, builds or runs gates/.test(x)), 'a direct verify-site.sh run with a token is accepted');
      c.expect(writeJobProblems(direct('node watch/watch.mjs --apply && bun install')).some((x) => /installs, builds or runs gates/.test(x)), 'an allowed step that also installs is accepted');
      const other = { permissions: { contents: 'write' }, jobs: { w: { if: "github.ref == 'refs/heads/main'", steps: [{ run: 'echo ${{ secrets.GITHUB_TOKEN_EXTRA }}' }] } } };
      c.expect(writeJobProblems(other).every((x) => !/receives the token/.test(x)), 'a different secret whose name starts with GITHUB_TOKEN counts as the token');
      return c.result();
    },
  },
  {
    id: 'HAR-D5-order', clauses: ['FR-D.5'], level: 'MUST',
    title: 'the dashboard sync is the watch job\'s own step, after the gate chain and the push, with the token',
    run(ctx) {
      const c = checks();
      const text = readFileSync(join(ctx.root, '.github/workflows/watch.yml'), 'utf8');
      const steps = parseYaml(text).jobs.watch.steps;
      const real = orderProblems(steps, 'watch');
      c.expect(real.length === 0, `watch.yml: ${real.join('; ')}`);
      const tok = { GITHUB_TOKEN: '${{ github.token }}' };
      const watch = { run: 'node watch/watch.mjs --apply', env: tok };
      const gates = { run: 'bun run verify' };
      const push = { run: 'git -c x=y \\\n  push origin HEAD:main', env: tok };
      const sync = { run: SYNC, env: tok };
      c.expect(orderProblems([watch, gates, push, sync], 'w').length === 0, 'a good order is refused');
      const has = (steps2, re) => orderProblems(steps2, 'w').some((p) => re.test(p));
      c.expect(has([watch, sync, gates, push], /after the gate chain/), 'a sync before the gates is accepted');
      c.expect(has([watch, gates, sync, push], /after the push/), 'a sync before the push is accepted');
      c.expect(has([watch, gates, push], /no step runs/), 'a missing sync is accepted');
      c.expect(has([{ ...watch, run: 'node watch/watch.mjs --apply --dashboard' }, gates, push, sync], /still syncs the dashboard/), 'a watch step that syncs itself is accepted');
      c.expect(has([watch, gates, push, { run: SYNC }], /no token/), 'a sync step without a token is accepted');
      c.expect(has([watch, gates, { run: '# git push origin HEAD:main', env: tok }, sync], /after the push/), 'a commented-out push counts as a push');
      return c.result();
    },
  },
  {
    id: 'HAR-L5-commit-guard', clauses: ['FR-L.5'], level: 'MUST',
    title: 'the scheduled commit may change a brief only inside its live:card region',
    run() {
      const c = checks();
      const before = '<h1>x</h1>\n<!-- live:card --><p>old</p><!-- /live:card -->\n<p>body</p>\n';
      c.expect(outsideRegionChange(before, before.replace('old', 'new')) === null, 'a region-only change is refused');
      c.expect(/outside the live:card region at line 3/.test(outsideRegionChange(before, before.replace('body', 'edited')) ?? ''), 'a change outside the region is accepted or misplaced');
      c.expect(/staged file has 0/.test(outsideRegionChange(before, '<h1>x</h1>\n<p>body</p>\n') ?? ''), 'a removed region is accepted');
      c.expect(/staged file has 2/.test(outsideRegionChange(before, `${before}<!-- live:card --><!-- /live:card -->\n`) ?? ''), 'a second region is accepted');
      c.expect(/HEAD has 0/.test(outsideRegionChange('<p>no card</p>\n', before) ?? ''), 'a first insertion by the bot is accepted');
      return c.result();
    },
  },
  {
    id: 'HAR-H3-golden-matrix', clauses: ['FR-H.3'], level: 'MUST',
    title: 'every golden file is in the README confidence matrix, and every matrix row names a golden that exists',
    run(ctx) {
      const c = checks();
      const readme = readFileSync(join(ctx.root, 'watch/freshness/README.md'), 'utf8');
      const real = goldenMatrixDrift(readme, goldenFiles(join(ctx.root, 'watch/freshness/goldens')));
      c.expect(real.length === 0, real.join('; '));
      const row = '| `goldens/a/x.md` | fixture | Y | N | 2 | exact |\n';
      c.expect(goldenMatrixDrift(row, ['a/x.md']).length === 0, 'a matching matrix is refused');
      c.expect(/goldens\/a\/y\.md is not in/.test(goldenMatrixDrift(row, ['a/x.md', 'a/y.md']).join()), 'an unlisted golden is accepted');
      c.expect(/lists goldens\/a\/x\.md, which does not exist/.test(goldenMatrixDrift(row, []).join()), 'a listed golden that is gone is accepted');
      return c.result();
    },
  },
];

export default [...h2, ...h8, ...h6, ...o, ...rest];
