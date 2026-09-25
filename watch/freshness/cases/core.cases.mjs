// watch/freshness/cases/core.cases.mjs: conformance cases for the classifier (FR-C), the triggers
// (FR-T), live.json (FR-L.1, FR-L.2), the crossing ledger (FR-G.3), cohorts (FR-O.3), the retired
// per-event issues (FR-D.4) and the measurements FR-H.1, FR-H.4, FR-H.5 and FR-H.7.
//
// Synthetic facts pin down each rule and each precedence; the recorded reference fixture
// (fixtures/core/, see PROVENANCE.md) drives the differential fidelity against the master matrix
// and the labelled events. A fidelity mismatch is an XFAIL only when DISCREPANCIES.md lists this
// case id under a DISC entry's "Cases affected"; a DISC entry that names a case which now agrees
// with the matrix fails (the runner rejects a pass that still claims an XFAIL).
// writes: temporary files only
//
// Node 22 built-ins only.

import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { classify, classifyCi, classifyRel, classifyLicense, workflowKind, summarizeWorkflow, summarizeLicense, settledCommit, ciCommit, DIMS } from '../classify.mjs';
import { parseYaml } from '../yaml.mjs';
import { loadReference, loadReplay, summariesFromTexts, factsFor, REFERENCE } from '../facts.mjs';
import {
  matrixClasses, parseRecheck, latestRechecks, parsePrivateCi, evaluateRepo, compareDim, debounce, resolutions,
  appendLedger, assertLedgerPrefix, parseLedger, openFromLedger, ledgerLine, LEDGER_KEYS, repoState, existenceCrossings, withdrawals, currentValue, eventFallback,
} from '../triggers.mjs';
import { computeFreshness, renderLiveJson, canonLive, safeName, MAX_BYTES, SCHEMA } from '../live.mjs';
import { parseTsv, renderTsv, revisitRows, TSV_HEAD, DETECTORS, UNREVIEWED } from '../revisit.mjs';
import { parseMatrix, parseCohorts, materialSincePin, diffSnapshots } from '../../watch.mjs';

// ---------------------------------------------------------------- shared inputs (loaded once)
const once = (fn) => { let v; let done = false; return (...a) => { if (!done) { v = fn(...a); done = true; } return v; }; };
const read = (root, p) => readFileSync(join(root, p), 'utf8');
const ref = once(() => { const f = loadReference(); return { ...f, summaries: summariesFromTexts(f.records, f.texts) }; });
const matrix = once((root) => parseMatrix(read(root, 'synthesis/00-overview.md')));
const matrixLine = once((root) => { const lines = read(root, 'synthesis/00-overview.md').split('\n'); return (repo) => lines.findIndex((l) => l.startsWith(`| ${repo} |`)) + 1; });
const privateCi = once((root) => parsePrivateCi(read(root, 'watch/freshness/private-ci.tsv')));
const rechecks = once((root) => latestRechecks(readdirSync(join(root, 'updates')).filter((f) => /-\d{4}-\d{2}-\d{2}\.md$/.test(f)).map((file) => ({ file, text: read(root, `updates/${file}`) }))));
const revisit = once((root) => parseTsv(read(root, 'watch/freshness/revisit.tsv')));
// DISCREPANCIES.md: case id -> DISC id, from each entry's "Cases affected" line.
const discFor = once((root) => {
  const map = new Map();
  for (const block of read(root, 'watch/freshness/DISCREPANCIES.md').split(/^(?=## DISC-\d{3}\b)/m).filter((b) => b.startsWith('## DISC-'))) {
    const id = block.match(/^## (DISC-\d{3})/)[1];
    const cases = block.match(/^- \*\*Cases affected:\*\* (.*)$/m)?.[1] ?? '';
    for (const c of cases.match(/CORE-[\w.-]+/g) ?? []) map.set(c, id);
  }
  return map;
});
const watchedFromRef = (root) => Object.keys(ref().records).sort().map((repo) => ({ repo, packet: `packets/${repo}-assessment.md`, set: 'pinned', matrixRow: matrix(root)[repo], verdictDate: '2026-09-22' }));
const liveFromRef = once((root) => computeFreshness({
  records: ref().records, summaries: ref().summaries, watched: watchedFromRef(root), rechecks: rechecks(root), privateCi: privateCi(root),
  revisitRows: revisit(root), checkedAt: ref().recorded_at, informational: { events_today: 0, events_since_pin: 0 },
}));

// ---------------------------------------------------------------- synthetic facts
const SHA_PIN = 'a'.repeat(40);
const SHA_NOW = 'b'.repeat(40);
const wf = (path, over = {}) => ({ path: `.github/workflows/${path}`, blob: path, summary: { ok: true, kind: 'test', push: { branches: ['main'] }, pull_request: null, events: ['push'], self_hosted: false, ...over } });
const run = (path, conclusion, over = {}) => ({ path: `.github/workflows/${path}`, name: path, event: 'push', status: 'completed', conclusion, ...over });
const runs = (...list) => ({ total: list.length, complete: true, list });
const pt = (over = {}) => ({ sha: SHA_PIN, date: '2026-09-20T00:00:00Z', workflows: [], licenses: [], runs: runs(), lockfile: null, ...over });
// `ci` (optional): the FR-C.3 CI point for `now`; null means no commit on the push-runs page settled.
const mk = ({ pin = {}, now = {}, ci, ...top } = {}) => ({
  repo: 'x', checked_at: '2026-09-25T12:00:00Z', default_branch: 'main', private_ci: null, releases: [], tags: [], workflow_states: null,
  points: { pin: pt(pin), now: pt({ sha: SHA_NOW, date: '2026-09-24T00:00:00Z', ...now }), baseline: pt(pin), ...(ci === undefined ? {} : { ci: ci && pt(ci) }) }, ...top,
});
const pageRun = (sha, path, conclusion, status = 'completed') => ({ sha, path: `.github/workflows/${path}`, name: path, event: 'push', status, conclusion });
const PRIVATE = { source: 'packets/x-assessment.md:1', tier: '[Code-verified, High]', quote: 'q', source_url: 'https://github.com/JYeswak/franken-research/blob/main/packets/x-assessment.md#L1' };
const expectClass = (got, value, rule) => (got.value === value && (!rule || got.rule === rule) ? true : { pass: false, detail: `got ${got.value} (${got.rule}), want ${value}${rule ? ` (${rule})` : ''}` });
const all = (...rs) => { for (const r of rs) if (r !== true) return r; return true; };
const cls = (value, rule) => ({ value, rule, tier: '[External, High]', evidence: [] });

// ---------------------------------------------------------------- FR-C.1
const C1 = [
  { id: 'CORE-C1-pure', clauses: ['FR-C.1'], level: 'MUST', title: 'classify reads no clock and no network, and returns the same classes twice', run(ctx) {
    const f = mk({ pin: { workflows: [wf('ci.yml')], runs: runs(run('ci.yml', 'success')) } });
    const saved = { fetch: globalThis.fetch, now: Date.now };
    globalThis.fetch = () => { throw new Error('network call'); };
    Date.now = () => { throw new Error('clock read'); };
    try {
      const a = classify(f, 'pin');
      const b = classify(structuredClone(f), 'pin');
      const shape = DIMS.every((d) => ['value', 'rule', 'tier', 'evidence'].every((k) => k in a[d]) && /^FR-C\.[2-5]\//.test(a[d].rule));
      return JSON.stringify(a) === JSON.stringify(b) && shape && a.ci.value === 'C1' ? true : { pass: false, detail: JSON.stringify(a) };
    } finally { globalThis.fetch = saved.fetch; Date.now = saved.now; }
  } },
];

// ---------------------------------------------------------------- FR-C.2: each rule, and each precedence
const C2 = [
  { id: 'CORE-C2-C6-private', clauses: ['FR-C.2'], level: 'MUST', title: 'private_ci from a packet line gives C6, citing the line', run(ctx) {
    const got = classifyCi(mk({ private_ci: PRIVATE }), 'pin');
    return all(expectClass(got, 'C6', 'FR-C.2/C6-private'), got.evidence[0] === PRIVATE.source_url ? true : { pass: false, detail: `evidence ${got.evidence}` });
  } },
  { id: 'CORE-C2-C6-self-hosted', clauses: ['FR-C.2'], level: 'MUST', title: 'self-hosted test workflows whose runs are queued or cancelled give C6', run(ctx) {
    const f = mk({ pin: { workflows: [wf('q.yml', { self_hosted: true })], runs: runs(run('q.yml', null, { status: 'queued' }), run('q.yml', 'cancelled')) } });
    return expectClass(classifyCi(f, 'pin'), 'C6', 'FR-C.2/C6-self-hosted');
  } },
  { id: 'CORE-C2-C6-needs-all-hidden', clauses: ['FR-C.2'], level: 'MUST', title: 'a completed hosted run on the commit keeps it out of C6', run(ctx) {
    const f = mk({ pin: { workflows: [wf('q.yml', { self_hosted: true }), wf('lint.yml', { kind: 'other' })], runs: runs(run('q.yml', 'cancelled'), run('lint.yml', 'success')) } });
    return classifyCi(f, 'pin').value !== 'C6' ? true : { pass: false, detail: 'C6 despite a hosted completed run' };
  } },
  { id: 'CORE-C2-C5-no-push-trigger', clauses: ['FR-C.2'], level: 'MUST', title: 'workflow files that never start on push or pull_request to the default branch give C5', run(ctx) {
    const f = mk({ pin: { workflows: [wf('ci.yml', { push: null, events: ['workflow_dispatch'] }), wf('other.yml', { push: { branches: ['feature/x'] } })] } });
    return expectClass(classifyCi(f, 'pin'), 'C5', 'FR-C.2/C5-no-push-trigger');
  } },
  { id: 'CORE-C2-C5-disabled', clauses: ['FR-C.2'], level: 'MUST', title: 'every test workflow disabled before the point gives C5, even when a deploy workflow still runs on push', run(ctx) {
    const f = mk({ pin: { workflows: [wf('ci.yml'), wf('pages.yml', { kind: 'deploy' })] }, workflow_states: { '.github/workflows/ci.yml': { state: 'disabled_manually', since: '2026-09-01T00:00:00Z' }, '.github/workflows/pages.yml': { state: 'active', since: '2026-08-01T00:00:00Z' } } });
    return expectClass(classifyCi(f, 'pin'), 'C5', 'FR-C.2/C5-disabled');
  } },
  { id: 'CORE-C2-C5-state-after-point', clauses: ['FR-C.2'], level: 'MUST', title: 'a workflow disabled after the point counts as not known to be disabled at the point', run(ctx) {
    const states = { '.github/workflows/ci.yml': { state: 'disabled_manually', since: '2026-09-23T00:00:00Z' } };
    const f = mk({ pin: { workflows: [wf('ci.yml')] }, workflow_states: states });
    return all(expectClass(classifyCi(f, 'pin'), 'C3'), expectClass(classifyCi(f, 'now'), 'C5'));
  } },
  { id: 'CORE-C2-C5-deleted', clauses: ['FR-C.2'], level: 'MUST', title: 'workflow files the pin had, all gone at now, give C5 at now', run(ctx) {
    const f = mk({ pin: { workflows: [wf('ci.yml')], runs: runs(run('ci.yml', 'success')) }, now: { workflows: [] } });
    return all(expectClass(classifyCi(f, 'pin'), 'C1'), expectClass(classifyCi(f, 'now'), 'C5', 'FR-C.2/C5-deleted'));
  } },
  { id: 'CORE-C2-C4-none', clauses: ['FR-C.2'], level: 'MUST', title: 'no workflow file gives C4', run: () => expectClass(classifyCi(mk(), 'pin'), 'C4', 'FR-C.2/C4') },
  { id: 'CORE-C2-C4-deploy-only', clauses: ['FR-C.2'], level: 'MUST', title: 'a push-triggered deploy workflow and no test workflow give C4, not C5, whatever the runs say', run(ctx) {
    const f = mk({ pin: { workflows: [wf('pages.yml', { kind: 'deploy' }), wf('release.yml', { kind: 'other' })], runs: runs(run('pages.yml', 'failure')) } });
    return expectClass(classifyCi(f, 'pin'), 'C4', 'FR-C.2/C4');
  } },
  { id: 'CORE-C2-C2', clauses: ['FR-C.2'], level: 'MUST', title: 'one failed push-triggered test run gives C2', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml'), wf('b.yml')], runs: runs(run('a.yml', 'success'), run('b.yml', 'failure')) } });
    return expectClass(classifyCi(f, 'pin'), 'C2', 'FR-C.2/C2');
  } },
  { id: 'CORE-C2-C2-timed-out-and-startup', clauses: ['FR-C.2'], level: 'MUST', title: 'timed_out and startup_failure are red too', run(ctx) {
    const one = (c) => classifyCi(mk({ pin: { workflows: [wf('a.yml')], runs: runs(run('a.yml', c)) } }), 'pin');
    return all(expectClass(one('timed_out'), 'C2'), expectClass(one('startup_failure'), 'C2'));
  } },
  { id: 'CORE-C2-C1', clauses: ['FR-C.2'], level: 'MUST', title: 'push and pull_request test runs all green give C1', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml')], runs: runs(run('a.yml', 'success'), run('a.yml', 'success', { event: 'pull_request' })) } });
    return expectClass(classifyCi(f, 'pin'), 'C1', 'FR-C.2/C1');
  } },
  { id: 'CORE-C2-C1-ignores-other-events', clauses: ['FR-C.2'], level: 'MUST', title: 'scheduled or dispatched test runs and non-test runs give no verdict', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml'), wf('pages.yml', { kind: 'deploy' })], runs: runs(run('a.yml', 'failure', { event: 'schedule' }), run('pages.yml', 'failure')) } });
    return expectClass(classifyCi(f, 'pin'), 'C3', 'FR-C.2/C3');
  } },
  { id: 'CORE-C2-C1-no-verdict-runs', clauses: ['FR-C.2'], level: 'MUST', title: 'cancelled, skipped and neutral runs give no verdict: success beside them is C1, alone they leave C3', run(ctx) {
    const with_ = (...list) => classifyCi(mk({ pin: { workflows: [wf('a.yml'), wf('b.yml')], runs: runs(...list) } }), 'pin');
    return all(
      expectClass(with_(run('a.yml', 'success'), run('b.yml', 'cancelled'), run('b.yml', 'skipped')), 'C1', 'FR-C.2/C1'),
      expectClass(with_(run('a.yml', 'cancelled'), run('b.yml', 'neutral')), 'C3', 'FR-C.2/C3'),
    );
  } },
  { id: 'CORE-C2-unparsed-file-run', clauses: ['FR-C.2'], level: 'MUST', title: 'a zero-job run GitHub names after an unparseable file is not a test verdict', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml'), { path: '.github/workflows/bad.yml', blob: 'bad', summary: { ok: false, error: 'x' } }], runs: runs({ path: '.github/workflows/bad.yml', name: '.github/workflows/bad.yml', event: 'push', status: 'completed', conclusion: 'failure' }, { path: '.github/workflows/a.yml', name: '.github/workflows/a.yml', event: 'push', status: 'completed', conclusion: 'failure' }) } });
    return expectClass(classifyCi(f, 'pin'), 'C3', 'FR-C.2/C3');
  } },
  { id: 'CORE-C2-C3', clauses: ['FR-C.2'], level: 'MUST', title: 'push-triggered tests with no completed run on the commit give C3', run: () => expectClass(classifyCi(mk({ pin: { workflows: [wf('a.yml')] } }), 'pin'), 'C3', 'FR-C.2/C3') },
  // Precedence where two rules hold at once: the first in the FR-C.2 order wins.
  { id: 'CORE-C2-order-C6-over-C5', clauses: ['FR-C.2'], level: 'MUST', title: 'C6 wins over C5 when both hold', run(ctx) {
    const f = mk({ private_ci: PRIVATE, pin: { workflows: [wf('a.yml', { push: null, events: ['workflow_dispatch'] })] } });
    return expectClass(classifyCi(f, 'pin'), 'C6');
  } },
  { id: 'CORE-C2-order-C5-over-C4', clauses: ['FR-C.2'], level: 'MUST', title: 'C5 wins over C4 when both hold (the pin\'s workflow files are all gone at now)', run(ctx) {
    const f = mk({ pin: { workflows: [wf('pages.yml', { kind: 'deploy' })] }, now: { workflows: [] } });
    return expectClass(classifyCi(f, 'now'), 'C5', 'FR-C.2/C5-deleted');
  } },
  { id: 'CORE-C2-order-C4-before-runs', clauses: ['FR-C.2'], level: 'MUST', title: 'C4 is decided from the files, before any run is read (runs missing still gives C4)', run(ctx) {
    return expectClass(classifyCi(mk({ pin: { workflows: [wf('pages.yml', { kind: 'deploy' })], runs: null } }), 'pin'), 'C4');
  } },
  { id: 'CORE-C2-order-C6-over-C4', clauses: ['FR-C.2'], level: 'MUST', title: 'C6 wins over C4 (private CI and no workflow file)', run: () => expectClass(classifyCi(mk({ private_ci: PRIVATE }), 'pin'), 'C6') },
  { id: 'CORE-C2-C5-tests-not-triggered', clauses: ['FR-C.2'], level: 'MUST', title: 'schedule-only test workflows beside a push-triggered deploy workflow give C5 (the deploy workflow does not count)', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml', { push: null, events: ['schedule'] }), wf('pages.yml', { kind: 'deploy' })] } });
    return expectClass(classifyCi(f, 'pin'), 'C5', 'FR-C.2/C5-no-push-trigger');
  } },
  { id: 'CORE-C2-frankengit-pyyaml-oracle', clauses: ['FR-C.2', 'FR-C.7'], level: 'MUST', title: 'frankengit at its pin: the parser agrees with the re-check\'s PyYAML count (9 unparseable, 6 push to main, 63 push to other branches)', run(ctx) {
    const r = ref().records.frankengit.points.pin;
    const s = r.workflows.map((w) => ref().summaries[w.blob]);
    const bad = s.filter((x) => !x.ok).length;
    const toMain = s.filter((x) => x.ok && x.push && (x.push.branches ?? []).includes('main')).length;
    const other = s.filter((x) => x.ok && x.push && !(x.push.branches ?? []).includes('main')).length;
    const cls0 = classifyCi(factsFor(ref().records.frankengit, ref().summaries, { checkedAt: ref().recorded_at }), 'pin');
    const ok = r.workflows.length === 78 && bad === 9 && toMain === 6 && other === 63 && cls0.value === 'C3';
    return ok ? true : { pass: false, detail: `files ${r.workflows.length}, unparseable ${bad}, push to main ${toMain}, push elsewhere ${other}, class ${cls0.value} (updates/frankengit-2026-09-24.md:76-83)` };
  } },
];

// ---------------------------------------------------------------- FR-C.3
const C3 = [
  { id: 'CORE-C3-in-progress', clauses: ['FR-C.3'], level: 'MUST', title: 'a test run still in progress gives unknown, never C3 or C1', run(ctx) {
    const f = mk({ pin: { workflows: [wf('a.yml')], runs: runs(run('a.yml', null, { status: 'in_progress' }), run('a.yml', 'success')) } });
    return expectClass(classifyCi(f, 'pin'), 'unknown', 'FR-C.3/in-progress');
  } },
  { id: 'CORE-C3-api-gap', clauses: ['FR-C.3'], level: 'MUST', title: 'runs the API did not return in full give unknown, never C3', run(ctx) {
    const gap = mk({ pin: { workflows: [wf('a.yml')], runs: { total: 101, complete: false, list: [] } } });
    const none = mk({ pin: { workflows: [wf('a.yml')], runs: null } });
    return all(expectClass(classifyCi(gap, 'pin'), 'unknown', 'FR-C.3/api-gap'), expectClass(classifyCi(none, 'pin'), 'unknown', 'FR-C.3/api-gap'));
  } },
  { id: 'CORE-C3-busy-head-settled-parent', clauses: ['FR-C.3'], level: 'MUST', title: 'a busy HEAD and a settled parent: CI now is read at the parent, and now_commit names it', run(ctx) {
    const HEAD = 'd'.repeat(40);
    const PARENT = 'e'.repeat(40);
    const page = { total: 3, complete: true, list: [
      pageRun(HEAD, 'a.yml', null, 'in_progress'),
      pageRun(PARENT, 'a.yml', 'success'),
      pageRun(PARENT, 'lint.yml', 'failure', 'completed'),
    ] };
    const sel = settledCommit(page, (p) => p === '.github/workflows/a.yml');
    const f = mk({ now: { sha: HEAD, workflows: [wf('a.yml')] }, ci: sel && { sha: sel.sha, date: '2026-09-25T09:00:00Z', workflows: [wf('a.yml')], licenses: [], runs: runs(...sel.runs), lockfile: null } });
    const got = classifyCi(f, 'now');
    return all(sel?.sha === PARENT ? true : { pass: false, detail: `selected ${sel?.sha}` }, expectClass(got, 'C1', 'FR-C.2/C1'), ciCommit(f, 'now', got) === PARENT ? true : { pass: false, detail: 'now_commit is not the parent' });
  } },
  { id: 'CORE-C3-head-settled-wins', clauses: ['FR-C.3'], level: 'MUST', title: 'HEAD is the CI point when its test runs have settled, even if a non-test run on it is still going', run(ctx) {
    const HEAD = 'd'.repeat(40);
    const page = { total: 3, complete: true, list: [pageRun(HEAD, 'pages.yml', null, 'in_progress'), pageRun(HEAD, 'a.yml', 'failure'), pageRun('e'.repeat(40), 'a.yml', 'success')] };
    const sel = settledCommit(page, (p) => p === '.github/workflows/a.yml');
    return sel?.sha === HEAD ? true : { pass: false, detail: `selected ${sel?.sha}` };
  } },
  { id: 'CORE-C3-docs-only-head-skipped', clauses: ['FR-C.3'], level: 'MUST', title: 'a docs-only HEAD with no push-triggered test run (only a finished Pages run) is skipped: the parent, whose test runs have finished, is the CI point', run(ctx) {
    const HEAD = 'd'.repeat(40);
    const PARENT = 'e'.repeat(40);
    const isTest = (p) => p === '.github/workflows/a.yml';
    const page = { total: 3, complete: true, list: [pageRun(HEAD, 'pages.yml', 'success'), pageRun(PARENT, 'a.yml', 'failure'), pageRun(PARENT, 'pages.yml', 'success')] };
    const bare = { total: 1, complete: true, list: [pageRun(HEAD, 'pages.yml', 'success')] };
    const sel = settledCommit(page, isTest);
    return sel?.sha === PARENT && settledCommit(bare, isTest) === null ? true : { pass: false, detail: `selected ${sel?.sha?.slice(0, 1)}, alone ${settledCommit(bare, isTest)?.sha?.slice(0, 1)}` };
  } },
  { id: 'CORE-C3-no-settled-commit', clauses: ['FR-C.3'], level: 'MUST', title: 'no settled commit on the page gives unknown (never C3), with no now_commit; the files still decide C4', run(ctx) {
    const busy = { total: 2, complete: true, list: [pageRun('d'.repeat(40), 'a.yml', null, 'queued'), pageRun('e'.repeat(40), 'a.yml', null, 'in_progress')] };
    const isTest = (p) => p === '.github/workflows/a.yml';
    const tests = mk({ now: { workflows: [wf('a.yml')] }, ci: null });
    const deploy = mk({ now: { workflows: [wf('pages.yml', { kind: 'deploy' })] }, ci: null });
    const got = classifyCi(tests, 'now');
    return all(
      settledCommit(busy, isTest) === null && settledCommit({ total: 0, complete: true, list: [] }, isTest) === null ? true : { pass: false, detail: 'a commit was selected' },
      expectClass(got, 'unknown', 'FR-C.3/no-settled-commit'), ciCommit(tests, 'now', got) === null ? true : { pass: false, detail: 'now_commit set for an unknown class' },
      expectClass(classifyCi(deploy, 'now'), 'C4'), ciCommit(deploy, 'now', classifyCi(deploy, 'now')) === SHA_NOW ? true : { pass: false, detail: 'file-decided class does not name HEAD' },
    );
  } },
  { id: 'CORE-C3-cut-page-oldest', clauses: ['FR-C.3'], level: 'MUST', title: 'on a page that does not hold every run, the oldest listed commit cannot be the CI point', run(ctx) {
    const list = [pageRun('d'.repeat(40), 'a.yml', null, 'in_progress'), pageRun('e'.repeat(40), 'a.yml', 'success')];
    const isTest = (p) => p === '.github/workflows/a.yml';
    const cut = settledCommit({ total: 250, complete: false, list }, isTest);
    const whole = settledCommit({ total: 2, complete: true, list }, isTest);
    return cut === null && whole?.sha === 'e'.repeat(40) ? true : { pass: false, detail: `cut ${cut?.sha}, whole ${whole?.sha}` };
  } },
  { id: 'CORE-C3-ci-point-before-baseline', clauses: ['FR-C.3'], level: 'MUST', title: 'a settled commit dated before the baseline commit is not used: CI now is unknown, with no now_commit', run(ctx) {
    const old = { sha: 'e'.repeat(40), date: '2026-09-10T00:00:00Z', workflows: [wf('a.yml')], runs: runs(run('a.yml', 'failure')) };
    const f = mk({ now: { workflows: [wf('a.yml')] }, ci: old });
    const fresh = mk({ now: { workflows: [wf('a.yml')] }, ci: { ...old, date: '2026-09-21T00:00:00Z' } });
    const got = classifyCi(f, 'now');
    return all(expectClass(got, 'unknown', 'FR-C.3/no-settled-commit'), ciCommit(f, 'now', got) === null ? true : { pass: false, detail: 'now_commit set' }, expectClass(classifyCi(fresh, 'now'), 'C2'));
  } },
  { id: 'CORE-C3-files-read-at-head', clauses: ['FR-C.3', 'FR-C.2'], level: 'MUST', title: 'the file rules read HEAD\'s files even when the CI point is another commit (dispatch-only at HEAD is C5 at HEAD)', run(ctx) {
    const ci = { sha: 'e'.repeat(40), date: '2026-09-23T00:00:00Z', workflows: [wf('a.yml')], runs: runs(run('a.yml', 'success')) };
    const f = mk({ now: { workflows: [wf('a.yml', { push: null, events: ['workflow_dispatch'] })] }, ci });
    const got = classifyCi(f, 'now');
    return all(expectClass(got, 'C5', 'FR-C.2/C5-no-push-trigger'), ciCommit(f, 'now', got) === SHA_NOW ? true : { pass: false, detail: `now_commit ${ciCommit(f, 'now', got)}` });
  } },
  { id: 'CORE-C3-frankengit-now-C5', clauses: ['FR-C.3', 'FR-C.2'], level: 'MUST', title: 'frankengit on the reference fixture reads C5 now from HEAD\'s dispatch-only files, not C3 from a settled commit that predates the workflow removal', run(ctx) {
    const r = ref().records.frankengit;
    const f = factsFor(r, ref().summaries, { checkedAt: ref().recorded_at, pointMap: { pin: 'pin', now: 'now', baseline: 'recheck', ci: 'ci' } });
    const got = classifyCi(f, 'now');
    const ci = r.points.ci;
    return all(expectClass(got, 'C5'), ciCommit(f, 'now', got) === r.head ? true : { pass: false, detail: `now_commit ${ciCommit(f, 'now', got)}` },
      ci && ci.sha !== r.head && ci.date < r.points.recheck.date ? true : { pass: false, detail: `the fixture no longer holds a stale CI point for frankengit (ci ${ci?.sha?.slice(0, 7)} ${ci?.date})` });
  } },
];

// ---------------------------------------------------------------- FR-C.4
const rel = (tag, target, assets, over = {}) => ({ tag, target, date: '2026-09-30T00:00:00Z', draft: false, prerelease: false, assets, ...over });
const tag = (name, target, date) => ({ name, target, date });
const C4 = [
  { id: 'CORE-C4-R1', clauses: ['FR-C.4'], level: 'MUST', title: 'no release or tag on or before the point gives R1', run: () => expectClass(classifyRel(mk(), 'pin'), 'R1', 'FR-C.4/R1') },
  { id: 'CORE-C4-R2', clauses: ['FR-C.4'], level: 'MUST', title: 'a release on an earlier commit with no uploaded asset gives R2', run(ctx) {
    const f = mk({ releases: [rel('v1', 'c'.repeat(40), 0)], tags: [tag('v1', 'c'.repeat(40), '2026-09-01T00:00:00Z')] });
    return expectClass(classifyRel(f, 'pin'), 'R2', 'FR-C.4/R2');
  } },
  { id: 'CORE-C4-R2-bare-tag', clauses: ['FR-C.4'], level: 'MUST', title: 'a bare tag on an earlier commit gives R2', run: () => expectClass(classifyRel(mk({ tags: [tag('v0', 'c'.repeat(40), '2026-09-01T00:00:00Z')] }), 'pin'), 'R2') },
  { id: 'CORE-C4-R3-asset', clauses: ['FR-C.4'], level: 'MUST', title: 'any considered release with an uploaded asset gives R3', run(ctx) {
    const f = mk({ releases: [rel('v1', 'c'.repeat(40), 3)], tags: [tag('v1', 'c'.repeat(40), '2026-09-01T00:00:00Z')] });
    return expectClass(classifyRel(f, 'pin'), 'R3', 'FR-C.4/R3-asset');
  } },
  { id: 'CORE-C4-R3-targets-point', clauses: ['FR-C.4'], level: 'MUST', title: 'a release that targets the point\'s commit gives R3 without assets', run(ctx) {
    const f = mk({ releases: [rel('v1', SHA_PIN, 0)], tags: [tag('v1', SHA_PIN, '2026-09-20T00:00:00Z')] });
    return expectClass(classifyRel(f, 'pin'), 'R3', 'FR-C.4/R3-targets-point');
  } },
  { id: 'CORE-C4-future-ignored', clauses: ['FR-C.4'], level: 'MUST', title: 'releases and tags dated after the point do not count', run(ctx) {
    const f = mk({ releases: [rel('v2', SHA_NOW, 5)], tags: [tag('v2', SHA_NOW, '2026-09-24T00:00:00Z'), tag('v3', SHA_NOW, '2026-09-24T00:00:00Z')] });
    return all(expectClass(classifyRel(f, 'pin'), 'R1'), expectClass(classifyRel(f, 'now'), 'R3'));
  } },
  { id: 'CORE-C4-draft-ignored', clauses: ['FR-C.4'], level: 'MUST', title: 'a draft release does not count, even with assets on the point\'s commit', run(ctx) {
    return expectClass(classifyRel(mk({ releases: [rel('v1', SHA_PIN, 2, { draft: true })], tags: [tag('v1', 'c'.repeat(40), '2026-09-01T00:00:00Z')] }), 'pin'), 'R2');
  } },
  { id: 'CORE-C4-assets-unknown', clauses: ['FR-C.4'], level: 'MUST', title: 'an asset count the API did not return gives unknown', run(ctx) {
    return expectClass(classifyRel(mk({ releases: [rel('v1', 'c'.repeat(40), null)], tags: [tag('v1', 'c'.repeat(40), '2026-09-01T00:00:00Z')] }), 'pin'), 'unknown');
  } },
  { id: 'CORE-C4-tag-date-not-publish-date', clauses: ['FR-C.4'], level: 'MUST', title: 'a release counts by its tag\'s date (published minutes after its commit still counts there); a release whose tag is not listed does not count', run(ctx) {
    const f = mk({ releases: [rel('v1', SHA_PIN, 2, { date: '2026-09-20T00:03:00Z' }), rel('ghost', 'c'.repeat(40), 4)], tags: [tag('v1', SHA_PIN, '2026-09-20T00:00:00Z')] });
    const g = mk({ releases: [rel('ghost', 'c'.repeat(40), 4)] });
    return all(expectClass(classifyRel(f, 'pin'), 'R3', 'FR-C.4/R3-targets-point'), expectClass(classifyRel(g, 'pin'), 'R1'));
  } },
];

// ---------------------------------------------------------------- FR-C.5
const lic = (name, text) => ({ name, blob: name, summary: text == null ? null : summarizeLicense(text) });
const MIT_TEXT = 'MIT License\n\nCopyright (c) 2026\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software';
const RIDER_TEXT = 'MIT License (with OpenAI/Anthropic Rider)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\n\nADDITIONAL RIDER / RESTRICTION (OpenAI / Anthropic):\n"Restricted Parties" means OpenAI, L.L.C.; Anthropic, PBC';
const C5 = [
  { id: 'CORE-C5-classes', clauses: ['FR-C.5'], level: 'MUST', title: 'Rider, plain MIT, none, and other:<first line> from the license files', run(ctx) {
    const at = (licenses) => classifyLicense(mk({ pin: { licenses } }), 'pin');
    return all(
      expectClass(at([lic('LICENSE', RIDER_TEXT)]), 'Rider'),
      expectClass(at([lic('LICENSE', MIT_TEXT)]), 'plain MIT'),
      expectClass(at([]), 'none', 'FR-C.5/none'),
      expectClass(at([lic('LICENSE-APACHE', 'Apache License\nVersion 2.0')]), 'other:Apache License'),
      expectClass(at([lic('LICENSE', MIT_TEXT), lic('LICENSE-RIDER', RIDER_TEXT)]), 'Rider'),
      expectClass(at([lic('LICENSE', null)]), 'unknown'),
    );
  } },
  { id: 'CORE-C5-reference-texts', clauses: ['FR-C.5'], level: 'MUST', title: 'every recorded license text with the OpenAI/Anthropic rider reads Rider; the one plain MIT repository reads plain MIT', run(ctx) {
    const f = ref();
    const pins = Object.values(f.records).map((r) => ({ repo: r.repo, c: classifyLicense(factsFor(r, f.summaries, { checkedAt: f.recorded_at }), 'pin').value }));
    const counts = pins.reduce((m, x) => ({ ...m, [x.c]: (m[x.c] ?? 0) + 1 }), {});
    return counts.Rider === 38 && counts['plain MIT'] === 1 && counts.none === 5 ? true : { pass: false, detail: JSON.stringify(counts) };
  } },
];

// ---------------------------------------------------------------- FR-C.6
const TIERS = new Set(['[External, High]', '[Code-verified, High]', '[Maintainer claim, Medium]', '[Verified, High]']);
const C6 = [
  { id: 'CORE-C6-evidence-and-tier', clauses: ['FR-C.6'], level: 'MUST', title: 'every known class on the reference fixture carries https evidence and a RULEBOOK §1 tier', run(ctx) {
    const f = ref();
    const bad = [];
    for (const r of Object.values(f.records)) for (const point of ['pin', 'now']) {
      const c = classify(factsFor(r, f.summaries, { checkedAt: f.recorded_at, privateCi: privateCi(ctx.root)?.[r.repo] ?? null }), point);
      for (const d of DIMS) if (c[d].value !== 'unknown' && (!TIERS.has(c[d].tier) || !c[d].evidence.length || !c[d].evidence.every((u) => /^https:\/\//.test(u)))) bad.push(`${r.repo}/${point}/${d}`);
    }
    return bad.length ? { pass: false, detail: bad.slice(0, 10).join(', ') } : true;
  } },
];

// ---------------------------------------------------------------- FR-C.7
const kindOf = (yaml) => workflowKind(parseYaml(yaml));
const C7 = [
  { id: 'CORE-C7-kind-from-steps', clauses: ['FR-C.7'], level: 'SHOULD', title: 'test/deploy/other comes from steps and uses, not from the file name', run(ctx) {
    const cases = [
      ['name: deploy\non: push\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: cargo test --workspace\n', 'test'],
      ['name: ci\non: push\njobs:\n  d:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/upload-pages-artifact@v3\n      - uses: actions/deploy-pages@v4\n', 'deploy'],
      ['on: push\njobs:\n  r:\n    runs-on: ubuntu-latest\n    steps:\n      - run: cargo build --release\n      - uses: softprops/action-gh-release@v2\n', 'other'],
      ['on: push\njobs:\n  b:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n  d:\n    environment: github-pages\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n', 'test'],
      ['on: push\njobs:\n  v:\n    runs-on: ubuntu-latest\n    steps:\n      - run: ./scripts/verify.sh docs\n', 'test'],
      ['on: push\njobs:\n  c:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions-rs/cargo@v1\n        with:\n          command: clippy\n', 'test'],
      ['on: push\njobs:\n  s:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo testing is fun\n', 'other'],
    ];
    const bad = cases.map(([y, want], i) => [i, kindOf(y), want]).filter(([, got, want]) => got !== want);
    return bad.length ? { pass: false, detail: bad.map(([i, got, want]) => `#${i}: ${got} want ${want}`).join('; ') } : true;
  } },
  { id: 'CORE-C7-triggers', clauses: ['FR-C.7'], level: 'SHOULD', title: 'on: forms (string, list, map, branch filters, tags-only push, negated globs) read correctly', run(ctx) {
    const s = (on) => summarizeWorkflow(`on: ${on}\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: cargo test\n`);
    const { triggersDefault } = { triggersDefault: (x) => classifyCi(mk({ pin: { workflows: [{ path: '.github/workflows/a.yml', blob: 'a', summary: x }] } }), 'pin').value === 'C3' };
    const want = [['push', true], ['[pull_request, workflow_dispatch]', true], ['workflow_dispatch', false], ['{push: {tags: [v*]}}', false], ['{push: {branches: [\'**\', \'!main\']}}', false], ['{push: {branches-ignore: [main]}}', false], ['{pull_request: {branches: [ma*]}}', true], ['{schedule: [{cron: "0 0 * * *"}]}', false]];
    const bad = want.filter(([on, t]) => triggersDefault(s(on)) !== t);
    return bad.length ? { pass: false, detail: bad.map(([on]) => on).join('; ') } : true;
  } },
  { id: 'CORE-C7-yaml-rejects', clauses: ['FR-C.7'], level: 'SHOULD', title: 'the YAML reader rejects what GitHub rejects: a key line without a colon, a second document, a tab indent', run(ctx) {
    const rejects = ['on: push\njobs\n', 'on: push\n---\njobs: {}\n', 'on: push\njobs:\n\tt: 1\n'];
    const accepted = rejects.filter((y) => { try { parseYaml(y); return true; } catch { return false; } });
    return accepted.length ? { pass: false, detail: `accepted ${JSON.stringify(accepted)}` } : true;
  } },
];

// ---------------------------------------------------------------- FR-H.1: differential fidelity, one case per repository x dimension
function fidelityCases() {
  const out = [];
  for (const dim of DIMS) {
    out.push({ id: `CORE-H1-${dim}-summary`, clauses: ['FR-H.1'], level: 'MUST', title: `fidelity for ${dim}: matched/44, every mismatch has a DISC entry naming its case`, run(ctx) {
      const f = ref();
      const m = matrix(ctx.root);
      const discs = discFor(ctx.root);
      let matched = 0;
      const orphan = [];
      for (const r of Object.values(f.records)) {
        const got = classify(factsFor(r, f.summaries, { checkedAt: f.recorded_at, privateCi: privateCi(ctx.root)[r.repo] ?? null }), 'pin')[dim].value;
        if (got === matrixClasses(m[r.repo])[dim]) matched++;
        else if (!discs.has(`CORE-H1-${dim}-${r.repo}`)) orphan.push(r.repo);
      }
      const n = Object.keys(f.records).length;
      return { pass: n === 44 && orphan.length === 0, detail: `${matched}/${n}${orphan.length ? `; mismatches without a DISC: ${orphan.join(', ')}` : ''}`, metrics: { [`fidelity.${dim}`]: `${matched}/${n}` } };
    } });
  }
  for (const dim of DIMS) for (const repo of Object.keys(ref().records).sort()) {
    const id = `CORE-H1-${dim}-${repo}`;
    out.push({ id, clauses: ['FR-H.1'], level: 'MUST', title: `${repo} ${dim} at the pin matches the master matrix`, run(ctx) {
      const r = ref().records[repo];
      const got = classify(factsFor(r, ref().summaries, { checkedAt: ref().recorded_at, privateCi: privateCi(ctx.root)[repo] ?? null }), 'pin')[dim];
      const want = matrixClasses(matrix(ctx.root)[repo])[dim];
      const detail = `machine ${got.value} (${got.rule}); matrix ${want} (synthesis/00-overview.md:${matrixLine(ctx.root)(repo)})`;
      return { pass: got.value === want, detail, xfail: discFor(ctx.root).get(id) };
    } });
  }
  return out;
}

// ---------------------------------------------------------------- FR-T
const dimsOf = (reference, base, now) => Object.fromEntries(DIMS.map((d) => [d, { reference: reference[d], pin: base[d], base: base[d], now: now[d], cmp: compareDim(reference[d], base[d], now[d]) }]));
const REC = (over = {}) => ({ repo: 'x', name: 'x', found: true, archived: false, pin: SHA_PIN, head: SHA_NOW, pin_reachable: true, compare_status: 'ahead', ...over });
const evalWith = (classes, reference, over = {}) => evaluateRepo({ record: REC(over.record), facts: over.facts ?? mk(), reference, classify: (f, p) => classes[p] ?? classes.pin, revisitRows: over.revisitRows ?? [], prevExistence: over.prevExistence ?? null });
const C_ALL = (ci, rel, license = 'Rider') => ({ ci: cls(ci, 'FR-C.2/x'), rel: cls(rel, 'FR-C.4/x'), license: cls(license, 'FR-C.5/x') });
const REF = { ci: 'C3', rel: 'R1', license: 'Rider' };
const ids = (xs) => xs.map((c) => c.id).sort().join(',');
const T = [
  { id: 'CORE-T1-class-crossing', clauses: ['FR-T.1'], level: 'MUST', title: 'a tracked dimension whose class moved raises one class crossing', run(ctx) {
    const e = evalWith({ pin: C_ALL('C3', 'R1'), baseline: C_ALL('C3', 'R1'), now: C_ALL('C5', 'R1') }, REF);
    return ids(e.candidates) === 'x:ci:C3>C5' && e.candidates[0].source === 'class' ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T2-untracked-no-class-crossing', clauses: ['FR-T.2'], level: 'MUST', title: 'a dimension whose pin class differs from the matrix raises no class crossing', run(ctx) {
    const e = evalWith({ pin: C_ALL('C2', 'R1'), baseline: C_ALL('C2', 'R1'), now: C_ALL('C1', 'R1') }, REF);
    return !e.dims.ci.cmp.tracked && e.candidates.length === 0 ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T2-event-fallback', clauses: ['FR-T.2'], level: 'MUST', title: 'an untracked dimension whose class changed raises its watch/README.md events, labelled event-fallback', run(ctx) {
    const facts = mk({ releases: [rel('v9', SHA_NOW, 1, { date: '2026-09-23T00:00:00Z' })], tags: [tag('v9', SHA_NOW, '2026-09-23T00:00:00Z'), tag('t1', SHA_NOW, '2026-09-23T00:00:00Z')], pin: { workflows: [wf('a.yml'), wf('b.yml')] }, now: { workflows: [wf('a.yml'), wf('c.yml')] } });
    const e = evalWith({ pin: C_ALL('C2', 'R2'), baseline: C_ALL('C2', 'R2'), now: C_ALL('C1', 'R3') }, REF, { facts });
    const got = e.candidates.map((c) => `${c.dim}:${c.source}:${c.from}>${c.to}:${c.id.split(':').slice(2).join(':')}`).sort().join(',');
    const want = `ci:event-fallback:C2>C1:event:${e.candidates.find((c) => c.dim === 'ci')?.id.split(':').at(-1)},rel:event-fallback:R2>R3:event:release:v9,rel:event-fallback:R2>R3:event:tag:t1`;
    return got === want ? true : { pass: false, detail: got };
  } },
  { id: 'CORE-T2-fallback-needs-class-change', clauses: ['FR-T.2', 'FR-T.4'], level: 'MUST', title: 'a new release on an untracked dimension already at R3 (sample:rel:event:release:v2, R3 to R3) raises no crossing, nor does it when the class now is unknown; the same event with the class moving from R2 does', run(ctx) {
    const facts = mk({ repo: 'sample', releases: [rel('v2', SHA_NOW, 3, { date: '2026-09-23T00:00:00Z' })], tags: [tag('v2', SHA_NOW, '2026-09-23T00:00:00Z')] });
    const run = (base, now = 'R3') => evaluateRepo({ record: REC({ repo: 'sample', name: 'sample' }), facts, reference: REF, classify: (f, p) => C_ALL('C3', p === 'now' ? now : base), revisitRows: [], prevExistence: null });
    const same = run('R3');
    const unknown = run('R2', 'unknown');
    const moved = run('R2');
    const direct = eventFallback('sample', 'rel', facts, same.dims);
    const ok = !same.dims.rel.cmp.tracked && same.candidates.length === 0 && direct.length === 0 && unknown.candidates.length === 0 && ids(moved.candidates) === 'sample:rel:event:release:v2';
    return ok ? true : { pass: false, detail: `R3>R3: ${ids(same.candidates) || '-'} (direct ${ids(direct) || '-'}); R2>unknown: ${ids(unknown.candidates) || '-'}; R2>R3: ${ids(moved.candidates) || '-'}` };
  } },
  { id: 'CORE-T2-fallback-additions-quiet', clauses: ['FR-T.2', 'FR-T.4'], level: 'MUST', title: 'under event-fallback, workflow files added to a set that had files raise nothing, even when the class moved', run(ctx) {
    const facts = mk({ pin: { workflows: [wf('a.yml')] }, now: { workflows: [wf('a.yml'), wf('b.yml')] } });
    const e = evalWith({ pin: C_ALL('C2', 'R1'), baseline: C_ALL('C2', 'R1'), now: C_ALL('C1', 'R1') }, REF, { facts });
    return e.candidates.length === 0 ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T3-existence', clauses: ['FR-T.3'], level: 'MUST', title: 'deleted, archived, unarchived and pin-rewritten raise existence crossings', run(ctx) {
    const got = [
      ids(existenceCrossings(REC({ found: false }), null)),
      ids(existenceCrossings(REC({ archived: true }), null)),
      ids(existenceCrossings(REC({ archived: false }), { archived: true })),
      ids(existenceCrossings(REC({ pin_reachable: false, compare_status: 'diverged' }), null)),
      ids(existenceCrossings(REC(), { archived: false })),
    ].join('|');
    return got === 'x:existence:deleted|x:existence:archived|x:existence:unarchived|x:existence:pin-rewritten|' ? true : { pass: false, detail: got };
  } },
  { id: 'CORE-T3-existence-opens-now', clauses: ['FR-T.3', 'FR-T.6'], level: 'MUST', title: 'an existence crossing opens on its first observation', run(ctx) {
    const c = existenceCrossings(REC({ archived: true }), null);
    const { opened, pending } = debounce(c, new Map(), new Map(), null, '2026-09-25');
    return opened.length === 1 && pending.length === 0 ? true : { pass: false, detail: JSON.stringify({ opened, pending }) };
  } },
  { id: 'CORE-T4-tag-on-R3-no-crossing', clauses: ['FR-T.4'], level: 'MUST', title: 'a new tag on a repository already at R3 raises nothing', run(ctx) {
    const e = evalWith({ pin: C_ALL('C3', 'R3'), baseline: C_ALL('C3', 'R3'), now: C_ALL('C3', 'R3') }, { ...REF, rel: 'R3' }, { facts: mk({ tags: [tag('v2', SHA_NOW, '2026-09-23T00:00:00Z')] }) });
    return e.candidates.length === 0 ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T4-workflow-added-same-class', clauses: ['FR-T.4'], level: 'MUST', title: 'a workflow added without changing C raises nothing', run(ctx) {
    const facts = mk({ pin: { workflows: [wf('a.yml')] }, now: { workflows: [wf('a.yml'), wf('b.yml')] } });
    const e = evalWith({ pin: C_ALL('C3', 'R1'), baseline: C_ALL('C3', 'R1'), now: C_ALL('C3', 'R1') }, REF, { facts });
    return e.candidates.length === 0 ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T5-unknown-no-crossing', clauses: ['FR-T.5'], level: 'MUST', title: 'unknown on either side is no crossing, and the state reads unknown', run(ctx) {
    const a = evalWith({ pin: C_ALL('C3', 'R1'), baseline: C_ALL('C3', 'R1'), now: C_ALL('unknown', 'R1') }, REF);
    const b = evalWith({ pin: C_ALL('unknown', 'R1'), baseline: C_ALL('unknown', 'R1'), now: C_ALL('C5', 'R1') }, REF);
    const st = repoState({ open: [], dims: a.dims, baselineDate: '2026-09-22', checkedAt: '2026-09-25T00:00:00Z' });
    return a.candidates.length === 0 && b.candidates.length === 0 && st.state === 'unknown' ? true : { pass: false, detail: `${ids(a.candidates)} | ${ids(b.candidates)} | ${st.state}` };
  } },
  { id: 'CORE-T6-debounce', clauses: ['FR-T.6'], level: 'SHOULD', title: 'a class crossing is pending on its first day, stays pending on a same-day rerun, opens the next day', run(ctx) {
    const c = [{ id: 'x:ci:C3>C5', repo: 'x', dim: 'ci', from: 'C3', to: 'C5', source: 'class', evidence: [] }];
    const d1 = debounce(c, new Map(), new Map(), null, '2026-09-25');
    const seen = new Map(d1.pending.map((p) => [p.id, p]));
    const rerun = debounce(c, new Map(), seen, '2026-09-25', '2026-09-25');
    const d2 = debounce(c, new Map(), seen, '2026-09-25', '2026-09-26');
    const ok = d1.opened.length === 0 && d1.pending.length === 1 && rerun.opened.length === 0 && d2.opened.length === 1 && d2.opened[0].since === '2026-09-25';
    return ok ? true : { pass: false, detail: JSON.stringify({ d1, rerun, d2 }) };
  } },
  { id: 'CORE-T6-flap-drops', clauses: ['FR-T.6'], level: 'SHOULD', title: 'a crossing seen once that does not hold the next day never opens', run(ctx) {
    const seen = new Map([['x:ci:C3>C5', { id: 'x:ci:C3>C5', since: '2026-09-25' }]]);
    const d2 = debounce([], new Map(), seen, '2026-09-25', '2026-09-26');
    return d2.opened.length === 0 && d2.pending.length === 0 ? true : { pass: false, detail: JSON.stringify(d2) };
  } },
  { id: 'CORE-T7-revisit-table', clauses: ['FR-T.7'], level: 'SHOULD', title: 'revisit.tsv is the generator\'s output for every packet (44), detectors from the closed vocabulary, reviewed_by filled', run(ctx) {
    const committed = parseTsv(read(ctx.root, 'watch/freshness/revisit.tsv'));
    const fresh = revisitRows(ctx.root);
    const strip = (rows) => rows.map((r) => TSV_HEAD.filter((k) => k !== 'reviewed_by').map((k) => r[k]).join('\t')).join('\n');
    const repos = new Set(committed.map((r) => r.repo));
    const ok = strip(committed) === strip(fresh) && repos.size === 44 && committed.every((r) => DETECTORS.includes(r.detector) && r.reviewed_by);
    return { pass: ok, detail: `${committed.length} triggers in ${repos.size} packets; ${committed.filter((r) => r.detector !== 'human').length} mapped to a machine detector; ${committed.filter((r) => r.reviewed_by === UNREVIEWED).length} not yet independently reviewed${strip(committed) === strip(fresh) ? '' : '; committed table differs from the generator'}` };
  } },
  { id: 'CORE-T7-revisit-fires', clauses: ['FR-T.7'], level: 'SHOULD', title: 'a machine revisit trigger raises a revisit crossing; a human one is never alerted', run(ctx) {
    const rows = [{ repo: 'x', n: 1, detector: 'dependency.edge', params: 'crates=asupersync', packet: 'packets/x-assessment.md#L1' }, { repo: 'x', n: 2, detector: 'human', params: '', packet: 'packets/x-assessment.md#L1' }];
    const facts = mk({ now: { lockfile: { blob: 'l', summary: { packages: ['asupersync', 'serde'] } } } });
    const e = evalWith({ pin: C_ALL('C3', 'R1'), baseline: C_ALL('C3', 'R1'), now: C_ALL('C3', 'R1') }, REF, { facts, revisitRows: rows });
    return ids(e.candidates) === 'x:revisit:1' && e.candidates[0].source === 'revisit' && e.revisit.fired.join() === 'dependency.edge' ? true : { pass: false, detail: ids(e.candidates) };
  } },
  { id: 'CORE-T8-recheck-parse', clauses: ['FR-T.8'], level: 'MUST', title: 'both dated re-checks parse to their re-check pin and cells-table classes', run(ctx) {
    const r = rechecks(ctx.root);
    const got = `${r.frankengit?.sha.slice(0, 7)} ${JSON.stringify(r.frankengit?.classes)} | ${r.franken_code_browser?.sha.slice(0, 7)} ${JSON.stringify(r.franken_code_browser?.classes)}`;
    return got === 'dfa5bb8 {"license":"Rider","ci":"C5","rel":"R1"} | c7c5310 {"license":"Rider","ci":"C4","rel":"R3"}' ? true : { pass: false, detail: got };
  } },
  { id: 'CORE-T8-baseline-shift', clauses: ['FR-T.8'], level: 'MUST', title: 'after a re-check, its pin and classes are the baseline: frankengit (C3 at the packet pin, C5 at the re-check) raises no crossing now', run(ctx) {
    const row = liveFromRef(ctx.root).live.repos.find((r) => r.repo === 'frankengit');
    const ok = row.baseline.sha.startsWith('dfa5bb8') && row.dims.ci.reference === 'C5' && row.dims.ci.at_baseline === 'C5' && row.dims.ci.at_pin === 'C3' && row.dims.ci.tracked && row.crossings.length === 0 && row.pending.length === 0;
    return ok ? true : { pass: false, detail: JSON.stringify({ baseline: row.baseline, ci: row.dims.ci, crossings: row.crossings, pending: row.pending }) };
  } },
  { id: 'CORE-T8-resolve', clauses: ['FR-T.8'], level: 'MUST', title: 'only a re-check dated on or after the opening resolves a crossing', run(ctx) {
    const open = new Map([['y:ci:C3>C5', { id: 'y:ci:C3>C5', repo: 'y', date: '2026-09-25' }]]);
    const before = resolutions(open, { y: { date: '2026-09-24', source: 'updates/y-2026-09-24.md' } });
    const after = resolutions(open, { y: { date: '2026-09-26', source: 'updates/y-2026-09-26.md' } });
    return before.length === 0 && after.length === 1 && after[0].resolved_by === 'updates/y-2026-09-26.md' && after[0].event === 'resolved' ? true : { pass: false, detail: JSON.stringify({ before, after }) };
  } },
  { id: 'CORE-T9-due', clauses: ['FR-T.9'], level: 'SHOULD', title: 'due at 90 days since the baseline or with an open crossing; not at 89 days', run(ctx) {
    const dims = dimsOf(REF, C_ALL('C3', 'R1'), C_ALL('C3', 'R1'));
    const at = (checkedAt, open = []) => repoState({ open, dims, baselineDate: '2026-09-22', checkedAt });
    const d89 = at('2026-12-20T12:00:00Z');
    const d90 = at('2026-12-21T00:00:00Z');
    const crossed = at('2026-09-25T00:00:00Z', [{ id: 'x:ci:C3>C5' }]);
    return d89.state === 'current' && !d89.due.due && d90.state === 'due' && d90.due.reason === '90 days since baseline' && crossed.state === 'changed' && crossed.due.reason === 'open crossing' ? true : { pass: false, detail: JSON.stringify({ d89, d90, crossed }) };
  } },
];

// ---------------------------------------------------------------- FR-T.10: withdrawal
// Runs over the reference fixture with one repository's computed class now, for one dimension, set
// per run. `runs` lists [class, UTC time] pairs; a bare class is a daily run at 11:23 on successive
// days from 2026-10-01. `patch` edits that repository's record before the first run.
const JAX = 'frankenjax';
const JAX_ID = 'frankenjax:ci:C4>C1';
function overrideDays(root, repo, dim, runs, patch = (r) => r) {
  const f = ref();
  const records = { ...f.records, [repo]: patch(structuredClone(f.records[repo])) };
  const base = { records, summaries: f.summaries, watched: watchedFromRef(root), rechecks: rechecks(root), privateCi: privateCi(root), revisitRows: revisit(root), informational: { events_today: 0, events_since_pin: 0 } };
  const rule = { ci: 'FR-C.2', rel: 'FR-C.4', license: 'FR-C.5' }[dim];
  const out = [];
  let prevLive = null;
  let ledgerText = '';
  runs.forEach((spec, i) => {
    const [value, at] = Array.isArray(spec) ? spec : [spec, `2026-10-${String(1 + i).padStart(2, '0')}T11:23:00Z`];
    const override = (facts, point) => {
      const c = classify(facts, point);
      return point === 'now' && facts.repo === repo ? { ...c, [dim]: { value, rule: `${rule}/${value}`, tier: '[External, High]', evidence: [`https://github.com/Dicklesworthstone/${repo}`] } } : c;
    };
    const r = computeFreshness({ ...base, classify: override, checkedAt: at, prevLive, ledgerText });
    prevLive = JSON.parse(renderLiveJson(r.live));
    ledgerText = r.ledgerText;
    const row = prevLive.repos.find((x) => x.repo === repo);
    out.push({ day: at.slice(0, 10), row, ledger: parseLedger(ledgerText).filter((e) => e.repo === repo), events: r.events.filter((e) => e.repo === repo) });
  });
  return out;
}
const jaxDays = (root, runs) => overrideDays(root, JAX, 'ci', runs);
const jaxState = (d) => `${d.day}: open ${d.row.crossings.map((c) => `${c.id}@${c.since}`).join(',') || '-'}; pending ${d.row.pending.map((c) => `${c.id}/${c.phase}@${c.since}`).join(',') || '-'}; ledger ${d.ledger.map((e) => `${e.date} ${e.event}`).join(', ') || '-'}`;
const T10 = [
  { id: 'CORE-T10-withdrawn-after-hold', clauses: ['FR-T.10', 'FR-G.3'], level: 'MUST', title: 'a class back at its baseline on two daily observations is withdrawn: a withdrawn ledger line with resolved_by null, and the crossing leaves the open list', run(ctx) {
    const d = jaxDays(ctx.root, ['C1', 'C1', 'C4', 'C4']);
    const ok = d[1].row.crossings.some((c) => c.id === JAX_ID)
      && d[2].row.crossings.some((c) => c.id === JAX_ID) && d[2].row.pending.some((c) => c.id === JAX_ID && c.phase === 'withdrawing' && c.since === d[2].day)
      && d[3].row.crossings.length === 0 && d[3].row.pending.length === 0
      && d[3].events.length === 1 && d[3].events[0].event === 'withdrawn'
      && JSON.stringify(d[3].ledger.map((e) => [e.date, e.event, e.id, e.resolved_by])) === JSON.stringify([[d[1].day, 'opened', JAX_ID, null], [d[3].day, 'withdrawn', JAX_ID, null]]);
    return ok ? true : { pass: false, detail: d.map(jaxState).join(' | ') };
  } },
  { id: 'CORE-T10-one-observation-stays-open', clauses: ['FR-T.10'], level: 'MUST', title: 'a class back for one observation only (then moved again, or a second run the same day) leaves the crossing open', run(ctx) {
    const moved = jaxDays(ctx.root, ['C1', 'C1', 'C4', 'C1']);
    const sameDay = jaxDays(ctx.root, [['C1', '2026-10-01T11:23:00Z'], ['C1', '2026-10-02T11:23:00Z'], ['C4', '2026-10-03T11:23:00Z'], ['C4', '2026-10-03T18:00:00Z']]);
    const stillOpen = (d) => d.row.crossings.some((c) => c.id === JAX_ID) && !d.ledger.some((e) => e.event === 'withdrawn');
    const ok = stillOpen(moved[3]) && !moved[3].row.pending.some((c) => c.phase === 'withdrawing')
      && stillOpen(sameDay[3]) && sameDay[3].row.pending.some((c) => c.id === JAX_ID && c.phase === 'withdrawing' && c.since === '2026-10-03');
    return ok ? true : { pass: false, detail: `moved again: ${moved.map(jaxState).join(' | ')}; same day: ${sameDay.map(jaxState).join(' | ')}` };
  } },
  { id: 'CORE-T10-moves-again-new-crossing', clauses: ['FR-T.10', 'FR-G.3'], level: 'MUST', title: 'a withdrawn crossing that moves again opens as a new crossing with a new since', run(ctx) {
    const d = jaxDays(ctx.root, ['C1', 'C1', 'C4', 'C4', 'C1', 'C1']);
    const again = d[5].row.crossings.find((c) => c.id === JAX_ID);
    const kinds = d[5].ledger.map((e) => `${e.date} ${e.event}`);
    const ok = again && again.since === d[5].day && again.since !== d[1].day && d[4].row.pending.some((c) => c.id === JAX_ID && c.phase === 'opening' && c.since === d[4].day)
      && JSON.stringify(kinds) === JSON.stringify([`${d[1].day} opened`, `${d[3].day} withdrawn`, `${d[5].day} opened`]);
    return ok ? true : { pass: false, detail: d.map(jaxState).join(' | ') };
  } },
  { id: 'CORE-T10-existence-never-withdrawn', clauses: ['FR-T.10', 'FR-T.3'], level: 'MUST', title: 'only class crossings are withdrawn: existence, event-fallback and revisit crossings whose value is back at from stay open over two observations, while a class crossing in the same position is withdrawn', run(ctx) {
    const arch = existenceCrossings(REC({ archived: true }), null)[0];
    const others = [arch, { id: 'x:rel:event:release:v2', repo: 'x', dim: 'rel', from: 'R2', to: 'R3', source: 'event-fallback' }, { id: 'x:revisit:release.first', repo: 'x', dim: 'rel', from: 'R1', to: 'R2', source: 'revisit' }];
    const cls = { id: 'x:ci:C3>C5', repo: 'x', dim: 'ci', from: 'C3', to: 'C5', source: 'class' };
    const back = (x) => x.from;
    const twoDays = (c) => {
      const open = new Map([[c.id, { ...c, date: '2026-10-01' }]]);
      const d1 = withdrawals(open, back, new Map(), '2026-10-01', '2026-10-02');
      const d2 = withdrawals(open, back, new Map([[c.id, { ...c, phase: 'withdrawing', since: '2026-10-02' }]]), '2026-10-02', '2026-10-03');
      return `${d1.returning.length}/${d1.withdrawn.length}+${d2.returning.length}/${d2.withdrawn.length}`;
    };
    const got = others.map((c) => `${c.source}:${twoDays(c)}`);
    const ok = got.every((g) => g.endsWith(':0/0+0/0')) && twoDays(cls) === '1/0+0/1' && currentValue(arch, null) === null;
    return ok ? true : { pass: false, detail: `${got.join(', ')}; class ${twoDays(cls)}` };
  } },
  { id: 'CORE-T10-event-fallback-stays-open', clauses: ['FR-T.10', 'FR-T.2'], level: 'MUST', title: 'an event-fallback crossing (franken_numpy rel, untracked, a release after the baseline) whose class returns to its baseline value stays open under its first since: no withdrawing, no withdrawn line, no reopening', run(ctx) {
    const addRelease = (r) => ({ ...r, releases: [...r.releases, { tag: 'v0.4.0', target: r.head, date: '2026-09-30T00:00:00Z', draft: false, prerelease: false, assets: 2 }], tags: [...r.tags, { name: 'v0.4.0', target: r.head, date: '2026-09-30T00:00:00Z' }] });
    const d = overrideDays(ctx.root, 'franken_numpy', 'rel', ['R3', 'R3', 'R2', 'R2', 'R2', 'R2'], addRelease);
    const ID = 'franken_numpy:rel:event:release:v0.4.0';
    const state = (x) => `${x.day}: open ${x.row.crossings.map((c) => `${c.id}@${c.since}`).join(',') || '-'}; pending ${x.row.pending.map((c) => `${c.id}/${c.phase}@${c.since}`).join(',') || '-'}; ledger ${x.ledger.map((e) => `${e.date} ${e.event}`).join(', ') || '-'}`;
    const opened = d[1].row.crossings.find((c) => c.id === ID);
    const ok = d[0].row.pending.some((c) => c.id === ID && c.phase === 'opening') && opened?.source === 'event-fallback' && opened.from === 'R2' && opened.to === 'R3'
      && d.slice(2).every((x) => x.row.crossings.length === 1 && x.row.crossings[0].id === ID && x.row.crossings[0].since === d[1].day && x.row.pending.length === 0)
      && JSON.stringify(d[5].ledger.map((e) => `${e.date} ${e.event} ${e.id}`)) === JSON.stringify([`${d[1].day} opened ${ID}`]);
    return ok ? true : { pass: false, detail: d.map(state).join(' | ') };
  } },
  { id: 'CORE-G3-withdrawn-line', clauses: ['FR-G.3', 'FR-T.10'], level: 'MUST', title: 'a withdrawn ledger line has resolved_by null; a withdrawn line naming a re-check, a resolved line without one, and a withdrawal of a crossing that is not open are rejected', run(ctx) {
    const opened = ledgerLine(EV('x:ci:C3>C5'));
    const good = opened + ledgerLine(EV('x:ci:C3>C5', 'withdrawn', { date: '2026-09-27' }));
    const bad = [
      opened + ledgerLine(EV('x:ci:C3>C5', 'withdrawn', { resolved_by: 'updates/x-2026-09-27.md' })),
      opened + ledgerLine(EV('x:ci:C3>C5', 'resolved')),
      ledgerLine(EV('y:ci:C3>C5', 'withdrawn')),
    ];
    const accepted = bad.filter((t) => { try { openFromLedger(parseLedger(t)); return true; } catch { return false; } });
    const entries = parseLedger(good);
    return entries[1].resolved_by === null && openFromLedger(entries).size === 0 && accepted.length === 0 ? true : { pass: false, detail: `accepted ${accepted.length} bad ledgers` };
  } },
];

// ---------------------------------------------------------------- FR-H.4: labelled events
// Each event is judged by the trigger rules against the packet pin and the master matrix, as the
// watch would have judged it before any re-check existed.
function labelledOutcome(root, repo, pointKey, dim, point = null) {
  const f = ref();
  const record = f.records[repo];
  const src = point ? { ...record, points: { ...record.points, event: { sha: point.sha, date: point.date, workflows: [], licenses: [], runs: null } } } : record;
  const facts = factsFor(src, f.summaries, { checkedAt: f.recorded_at, privateCi: privateCi(root)[repo] ?? null, pointMap: { pin: 'pin', baseline: 'pin', now: point ? 'event' : pointKey } });
  const e = evaluateRepo({ record, facts, reference: matrixClasses(matrix(root)[repo]), classify, prevExistence: null });
  return e.candidates.some((c) => c.dim === dim);
}
function labelledEvents(root) {
  const f = ref();
  const tagPoint = (repo, name) => { const t = f.records[repo].tags.find((x) => x.name === name); return t ? { sha: t.target, date: t.date, name } : null; };
  // The clause names v0.15.8 to v0.15.12; upstream has no v0.15.10 tag (the watch filed #8 to #11
  // for v0.15.8, v0.15.9, v0.15.11 and v0.15.12), so four frankenterm tags are labelled.
  const termTags = ['v0.15.8', 'v0.15.9', 'v0.15.10', 'v0.15.11', 'v0.15.12'].map((n) => tagPoint('frankenterm', n)).filter(Boolean);
  return [
    { name: 'frankengit CI C3>C5 at dfa5bb8', want: true, got: labelledOutcome(root, 'frankengit', 'recheck', 'ci') },
    { name: 'franken_code_browser release R1>R3 at c7c5310', want: true, got: labelledOutcome(root, 'franken_code_browser', 'recheck', 'rel') },
    ...termTags.map((p) => ({ name: `frankenterm tag ${p.name}`, want: false, got: labelledOutcome(root, 'frankenterm', null, 'rel', p) })),
    ...['frankensearch-quill-v0.3.2'].map((n) => tagPoint('frankensearch', n)).filter(Boolean).map((p) => ({ name: `frankensearch tag ${p.name}`, want: false, got: labelledOutcome(root, 'frankensearch', null, 'rel', p) })),
    ...[['franken_lean', 'issue2', 2], ['franken_manim', 'issue3', 3], ['frankenfs', 'issue4', 4], ['frankenlibc', 'issue6', 6], ['frankensim', 'issue7', 7]]
      .map(([repo, key, n]) => ({ name: `#${n} ${repo} workflow additions`, want: false, got: labelledOutcome(root, repo, key, 'ci') })),
  ];
}
const H4 = [
  { id: 'CORE-H4-labelled', clauses: ['FR-H.4'], level: 'MUST', title: 'labelled events: the two re-check events raise a crossing; the tags and the workflow additions do not', run(ctx) {
    const ev = labelledEvents(ctx.root);
    const tp = ev.filter((e) => e.want && e.got).length;
    const fp = ev.filter((e) => !e.want && e.got).length;
    const fn = ev.filter((e) => e.want && !e.got).length;
    const wrong = ev.filter((e) => e.want !== e.got).map((e) => `${e.name}: ${e.got ? 'raised' : 'silent'}`);
    const precision = tp + fp ? `${tp}/${tp + fp}` : 'n/a';
    const recall = tp + fn ? `${tp}/${tp + fn}` : 'n/a';
    return { pass: wrong.length === 0 && ev.length === 12, detail: `n ${ev.length} (2 positive, ${ev.length - 2} negative: 4 frankenterm tags, 1 frankensearch tag, 5 workflow additions); precision ${precision}; recall ${recall}${wrong.length ? `; wrong: ${wrong.join('; ')}` : ''}`, metrics: { 'labelled.precision': precision, 'labelled.recall': recall, 'labelled.n': ev.length } };
  } },
];

// ---------------------------------------------------------------- FR-H.5: replay noise
const H5 = [
  { id: 'CORE-H5-replay', clauses: ['FR-H.5'], level: 'SHOULD', title: 'recorded daily states: flags per day under the old event rule and under FR-T', run(ctx) {
    const rp = loadReplay();
    const states = rp.states.map((s) => s.state);
    const days = [...new Set(states.map((s) => s.checked_at.slice(0, 10)))];
    // Old rule, as the first run applied it: every material-since-pin event on the day's first state
    // (the since-pin backfill), then the material events of each later state against the previous one.
    const oldByDay = new Map(days.map((d) => [d, 0]));
    oldByDay.set(days[0], oldByDay.get(days[0]) + Object.values(states[0].assessed).reduce((n, r) => n + materialSincePin(r).length, 0));
    for (let i = 1; i < states.length; i++) oldByDay.set(states[i].checked_at.slice(0, 10), oldByDay.get(states[i].checked_at.slice(0, 10)) + diffSnapshots(states[i - 1], states[i]).material.length);
    // FR-T on the same repositories: the replayed states lack runs and workflow texts, so the new
    // rule is measured on the reference fixture (recorded the next day): crossings raised before
    // debounce, an upper bound on what would open.
    const live = liveFromRef(ctx.root).live;
    const raised = live.repos.reduce((n, r) => n + r.crossings.length + r.pending.length, 0);
    const oldPerDay = [...oldByDay.values()].reduce((a, b) => a + b, 0) / days.length;
    return {
      pass: days.length >= 1 && states.length >= 2,
      detail: `${states.length} committed states over ${days.length} UTC day(s) (${days.join(', ')}); the current event rule flags ${[...oldByDay.entries()].map(([d, n]) => `${d}: ${n}`).join(', ')} (the watch's first rule opened issues #1 to #12 that day, before workflow additions became informational); FR-T raised ${raised} on the ${ref().recorded_at.slice(0, 10)} facts (${live.repos.flatMap((r) => [...r.crossings, ...r.pending].map((c) => c.id)).join(', ') || 'none'}), none opened on a first observation`,
      metrics: { 'replay.days': days.length, 'replay.flags_old_per_day': oldPerDay, 'replay.flags_new_per_day': raised },
    };
  } },
];

// ---------------------------------------------------------------- FR-L.1, FR-L.2
const L = [
  { id: 'CORE-L1-golden', clauses: ['FR-L.1'], level: 'MUST', title: 'live.json from the reference fixture with an injected checked_at equals its golden', run(ctx) {
    return ctx.golden('core/live.json', renderLiveJson(liveFromRef(ctx.root).live));
  } },
  { id: 'CORE-L1-deterministic', clauses: ['FR-L.1'], level: 'MUST', title: 'same facts and checked_at give byte-identical live.json, whatever the input order', run(ctx) {
    const a = renderLiveJson(liveFromRef(ctx.root).live);
    const f = ref();
    const shuffled = Object.fromEntries(Object.entries(f.records).reverse());
    const b = renderLiveJson(computeFreshness({ records: shuffled, summaries: f.summaries, watched: watchedFromRef(ctx.root).reverse(), rechecks: rechecks(ctx.root), privateCi: privateCi(ctx.root), revisitRows: [...revisit(ctx.root)].reverse(), checkedAt: f.recorded_at, informational: { events_today: 0, events_since_pin: 0 } }).live);
    return a === b ? true : { pass: false, detail: 'live.json depends on input order' };
  } },
  { id: 'CORE-L1-shape', clauses: ['FR-L.1'], level: 'MUST', title: 'live.json holds, per repository, pin, baseline, head, commits, latest release, per-dimension classes, existence, crossings, revisit counts, state, and totals', run(ctx) {
    const live = JSON.parse(renderLiveJson(liveFromRef(ctx.root).live));
    const r = live.repos[0];
    const need = ['repo', 'packet', 'brief', 'set', 'baseline', 'pin', 'head', 'commits_since_pin', 'latest_release', 'existence', 'dims', 'crossings', 'pending', 'revisit', 'state', 'state_reason', 'due'];
    const dimKeys = ['matrix', 'reference', 'at_pin', 'at_baseline', 'now', 'tracked', 'rule_at_pin', 'rule_now', 'evidence'];
    const ciKeys = ['matrix', 'reference', 'at_pin', 'at_baseline', 'now', 'now_commit', 'tracked', 'rule_at_pin', 'rule_now', 'evidence'];
    const nowCommits = live.repos.every((x) => (x.dims.ci.now === 'unknown') === (x.dims.ci.now_commit === null) && (x.dims.ci.now_commit === null || /^[0-9a-f]{40}$/.test(x.dims.ci.now_commit)));
    const ok = live.schema === SCHEMA && JSON.stringify(Object.keys(r)) === JSON.stringify(need) && nowCommits && DIMS.every((d) => JSON.stringify(Object.keys(r.dims[d])) === JSON.stringify(d === 'ci' ? ciKeys : dimKeys))
      && live.totals.repos === 44 && live.totals.current + live.totals.changed + live.totals.due + live.totals.unknown === 44
      && live.repos.every((x) => ['current', 'changed', 'due', 'unknown'].includes(x.state));
    return ok ? true : { pass: false, detail: JSON.stringify({ keys: Object.keys(r), totals: live.totals }) };
  } },
  { id: 'CORE-L1-committed', clauses: ['FR-L.1', 'FR-L.2'], level: 'MUST', title: 'the committed watch/live.json is in canonical form (re-rendering it gives the same bytes), under 96 KB, schema fr.watch.live/v1', run(ctx) {
    const p = join(ctx.root, 'watch', 'live.json');
    if (!existsSync(p)) return { pass: false, detail: 'watch/live.json is not committed' };
    const text = readFileSync(p, 'utf8');
    const live = JSON.parse(text);
    const ok = live.schema === SCHEMA && renderLiveJson(live) === text && Buffer.byteLength(text) < MAX_BYTES;
    return { pass: ok, detail: `${Buffer.byteLength(text)} bytes, checked_at ${live.checked_at}, ${live.repos.length} repos${renderLiveJson(live) === text ? '' : '; not in canonical form'}` };
  } },
  { id: 'CORE-L2-size-and-text', clauses: ['FR-L.2'], level: 'MUST', title: 'live.json stays under 96 KB and carries no upstream text beyond escaped tag and file names', run(ctx) {
    const text = renderLiveJson(liveFromRef(ctx.root).live);
    const bytes = Buffer.byteLength(text);
    const strings = [];
    const walk = (v) => { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(JSON.parse(text));
    const risky = strings.filter((s) => /[<`|*[\]\\\r\n]/.test(s)); // `>` appears in our own crossing ids (C3>C5)
    return { pass: bytes < MAX_BYTES && risky.length === 0, detail: `${bytes} bytes (limit ${MAX_BYTES}); ${Math.floor((MAX_BYTES - bytes) / (bytes / 44))} more repositories fit at this average; ${strings.length} strings, ${risky.length} with markup${risky.length ? `: ${risky.slice(0, 3).join(' | ')}` : ''}` };
  } },
  { id: 'CORE-L2-escapes-names', clauses: ['FR-L.2'], level: 'MUST', title: 'a tag name with markup is percent-encoded in live.json', run(ctx) {
    const f = ref();
    const record = structuredClone(f.records.frankensqlite);
    const evil = 'v1<script>|`@here`';
    record.releases = [...record.releases, { tag: evil, target: record.head, date: '2026-12-01T00:00:00Z', draft: false, prerelease: false, assets: 1 }];
    record.tags = [...record.tags, { name: evil, target: record.head, date: '2026-12-01T00:00:00Z' }];
    const out = computeFreshness({ records: { ...f.records, frankensqlite: record }, summaries: f.summaries, watched: watchedFromRef(ctx.root), rechecks: rechecks(ctx.root), privateCi: privateCi(ctx.root), revisitRows: revisit(ctx.root), checkedAt: f.recorded_at, informational: { events_today: 0, events_since_pin: 0 } });
    const text = renderLiveJson(out.live);
    const row = out.live.repos.find((r) => r.repo === 'frankensqlite');
    return !text.includes('<script>') && !text.includes('`@here') && row.latest_release.tag === safeName(evil) ? true : { pass: false, detail: row.latest_release.tag };
  } },
  { id: 'CORE-L1-canon-order', clauses: ['FR-L.1'], level: 'MUST', title: 'key order is fixed: an object with shuffled keys renders to the same bytes', run(ctx) {
    const live = liveFromRef(ctx.root).live;
    const shuffle = (v) => (Array.isArray(v) ? v.map(shuffle) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, shuffle(x)])) : v);
    return renderLiveJson(shuffle(live)) === renderLiveJson(live) && JSON.stringify(canonLive(live)) === JSON.stringify(canonLive(shuffle(live))) ? true : { pass: false, detail: 'rendering depends on key order' };
  } },
];

// ---------------------------------------------------------------- FR-G.3
const EV = (id, event = 'opened', over = {}) => ({ date: '2026-09-25', event, id, repo: id.split(':')[0], dim: id.split(':')[1], from: 'C3', to: 'C5', source: 'class', evidence: ['https://example.invalid/e'], resolved_by: null, ...over });
const G = [
  { id: 'CORE-G3-append', clauses: ['FR-G.3'], level: 'MUST', title: 'appending keeps the previous ledger byte for byte, one line per event, keys in fixed order', run(ctx) {
    const a = appendLedger('', [EV('x:ci:C3>C5')]);
    const b = appendLedger(a, [EV('x:ci:C3>C5', 'resolved', { resolved_by: 'updates/x-2026-09-26.md' })]);
    const keys = JSON.stringify(Object.keys(JSON.parse(b.split('\n')[1])));
    return b.startsWith(a) && b.split('\n').length === 3 && keys === JSON.stringify(LEDGER_KEYS) ? true : { pass: false, detail: b };
  } },
  { id: 'CORE-G3-prefix-violation', clauses: ['FR-G.3'], level: 'MUST', title: 'a new ledger that rewrites an old line fails', run(ctx) {
    const a = ledgerLine(EV('x:ci:C3>C5'));
    const rewritten = ledgerLine(EV('x:ci:C3>C4')) + ledgerLine(EV('y:ci:C3>C5'));
    try { assertLedgerPrefix(a, rewritten); return { pass: false, detail: 'rewrite accepted' }; } catch { return true; }
  } },
  { id: 'CORE-G3-malformed', clauses: ['FR-G.3'], level: 'MUST', title: 'a ledger with shuffled keys, a missing newline, or a resolution of a crossing that is not open is rejected', run(ctx) {
    const shuffled = JSON.stringify(Object.fromEntries(Object.entries(EV('x:ci:C3>C5')).reverse())) + '\n';
    const bad = [shuffled, ledgerLine(EV('x:ci:C3>C5')).trim(), ledgerLine(EV('z:ci:C3>C5', 'resolved'))];
    const accepted = bad.filter((t) => { try { openFromLedger(parseLedger(t)); return true; } catch { return false; } });
    return accepted.length ? { pass: false, detail: `accepted ${accepted.length}` } : true;
  } },
  { id: 'CORE-G3-run-opens-and-resolves', clauses: ['FR-G.3', 'FR-T.6', 'FR-T.8'], level: 'MUST', title: 'two runs on consecutive days open a class crossing in the ledger; a later re-check resolves it', run(ctx) {
    const f = ref();
    const base = { records: f.records, summaries: f.summaries, watched: watchedFromRef(ctx.root), rechecks: rechecks(ctx.root), privateCi: privateCi(ctx.root), revisitRows: revisit(ctx.root), informational: { events_today: 0, events_since_pin: 0 } };
    const day1 = computeFreshness({ ...base, checkedAt: '2026-09-25T11:23:00Z' });
    const day2 = computeFreshness({ ...base, checkedAt: '2026-09-26T11:23:00Z', prevLive: JSON.parse(renderLiveJson(day1.live)), ledgerText: day1.ledgerText });
    const opened = parseLedger(day2.ledgerText).filter((e) => e.event === 'opened');
    const repo = opened[0]?.repo;
    const day3 = computeFreshness({ ...base, checkedAt: '2026-09-27T11:23:00Z', prevLive: JSON.parse(renderLiveJson(day2.live)), ledgerText: day2.ledgerText, rechecks: { ...base.rechecks, [repo]: { repo, date: '2026-09-27', sha: f.records[repo]?.head, source: `updates/${repo}-2026-09-27.md`, classes: { ci: 'C1', rel: 'R3', license: 'Rider' } } } });
    const resolved = parseLedger(day3.ledgerText).filter((e) => e.event === 'resolved');
    const ok = day1.ledgerText === '' && opened.length > 0 && day2.ledgerText.startsWith(day1.ledgerText) && day3.ledgerText.startsWith(day2.ledgerText) && resolved.some((e) => e.repo === repo && e.resolved_by === `updates/${repo}-2026-09-27.md`);
    return { pass: ok, detail: `day 1 opened ${parseLedger(day1.ledgerText).length}; day 2 opened ${opened.map((e) => e.id).join(', ')}; day 3 resolved ${resolved.map((e) => e.id).join(', ')}` };
  } },
  { id: 'CORE-G3-committed', clauses: ['FR-G.3'], level: 'MUST', title: 'the committed watch/crossings.jsonl parses: fixed key order, opened or resolved, every resolution of an open crossing', run(ctx) {
    const p = join(ctx.root, 'watch', 'crossings.jsonl');
    if (!existsSync(p)) return { pass: false, detail: 'watch/crossings.jsonl is not committed' };
    const entries = parseLedger(readFileSync(p, 'utf8'));
    return { pass: true, detail: `${entries.length} events; ${openFromLedger(entries).size} open` };
  } },
];

// ---------------------------------------------------------------- FR-C.2 private-ci source, FR-O.3, FR-D.4, FR-H.7
const MISC = [
  { id: 'CORE-C2-private-ci-sources', clauses: ['FR-C.2'], level: 'MUST', title: 'every private-ci.tsv row quotes the packet line it cites', run(ctx) {
    const rows = privateCi(ctx.root);
    const bad = Object.entries(rows).filter(([, r]) => { const [path, line] = r.source.split(':'); return !read(ctx.root, path).split('\n')[Number(line) - 1]?.replace(/\*\*/g, '').includes(r.quote); }).map(([repo]) => repo);
    return bad.length ? { pass: false, detail: `quote not on the cited line: ${bad.join(', ')}` } : { pass: true, detail: Object.keys(rows).join(', ') };
  } },
  { id: 'CORE-O3-cohorts', clauses: ['FR-O.3'], level: 'MUST', title: 'a cohort matrix extends the watched set; totals report pinned and cohort counts; no cohort matrix reports 0', run(ctx) {
    const dir = mkdtempSync(join(tmpdir(), 'fr-cohort-'));
    try {
      const c = join(dir, '2026-09');
      mkdirSync(c);
      writeFileSync(join(c, 'matrix.md'), '# Cohort 2026-09, read 2026-09-30\n\n| Project | TRL | NODUS | License | Bus | No-contrib | CI | Rel | 3rd-party validation | Analyst behavioral repro |\n|---|---|---|---|---|---|---|---|---|---|\n| cohortrepo | 3 | Explore | Rider | 1 | no | C4 | R1 | none | no |\n');
      writeFileSync(join(c, 'cohortrepo-assessment.md'), `**Repository:** \`Dicklesworthstone/cohortrepo\`\n**Pinned commit:** \`${'c'.repeat(40)}\`\n`);
      const cohort = parseCohorts(dir);
      const f = ref();
      const records = { ...f.records, cohortrepo: { ...structuredClone(f.records.frankenjax), repo: 'cohortrepo', name: 'cohortrepo' } };
      const watched = [...watchedFromRef(ctx.root), ...cohort];
      const live = computeFreshness({ records, summaries: f.summaries, watched, privateCi: privateCi(ctx.root), checkedAt: f.recorded_at, informational: { events_today: 0, events_since_pin: 0 } }).live;
      const none = computeFreshness({ records: f.records, summaries: f.summaries, watched: watchedFromRef(ctx.root), checkedAt: f.recorded_at, informational: {} }).live;
      const row = live.repos.find((r) => r.repo === 'cohortrepo');
      const ok = cohort.length === 1 && cohort[0].pin === 'c'.repeat(40) && live.totals.pinned === 44 && live.totals.cohort === 1 && live.totals.repos === 45 && row.set === 'cohort:2026-09' && row.baseline.date === '2026-09-30' && row.dims.ci.reference === 'C4' && none.totals.cohort === 0 && parseCohorts(join(dir, 'absent')).length === 0;
      return ok ? true : { pass: false, detail: JSON.stringify({ cohort, totals: live.totals, row: row && { set: row.set, baseline: row.baseline }, none: none.totals }) };
    } finally { rmSync(dir, { recursive: true, force: true }); }
  } },
  { id: 'CORE-D4-issues-retired', clauses: ['FR-D.4', 'FR-D.5'], level: 'MUST', title: 'the watch opens no issues itself: --issues and --backfill-since-pin (retired) and --dashboard (moved) are refused (exit 2) before any API call, naming the separate dashboard sync command', run(ctx) {
    const SYNC = 'node watch/freshness/dashboard.mjs --sync watch/live.json';
    const want = { '--issues': `retired; the run keeps one dashboard issue instead, synced by ${SYNC}`, '--backfill-since-pin': `retired; the run keeps one dashboard issue instead, synced by ${SYNC}`, '--dashboard': `moved; after the gate chain and push, run ${SYNC}` };
    const exits = Object.keys(want).map((flag) => [flag, spawnSync(process.execPath, [join(ctx.root, 'watch', 'watch.mjs'), '--apply', flag], { encoding: 'utf8', env: { ...process.env, GITHUB_TOKEN: 'not-a-token' } })]);
    const ok = exits.every(([flag, x]) => x.status === 2 && x.stderr.startsWith(`watch: ${flag}: ${want[flag]}`));
    return ok ? true : { pass: false, detail: exits.map(([flag, x]) => `${flag}: exit ${x.status}, ${x.stderr.split('\n')[0]}`).join('; ') };
  } },
  { id: 'CORE-H7-provenance', clauses: ['FR-H.7'], level: 'MUST', title: 'PROVENANCE.md records the recorder command, UTC time, endpoints and git ref of each core fixture', run(ctx) {
    const text = read(ctx.root, 'watch/freshness/fixtures/PROVENANCE.md');
    const f = ref();
    const rp = loadReplay();
    const need = ['node watch/freshness/facts.mjs --record', 'node watch/freshness/facts.mjs --record-replay', f.recorded_at, f.git_ref, rp.recorded_at, rp.git_ref, 'actions/runs?head_sha=', 'actions/workflows', 'graphql', 'git show'];
    const missing = need.filter((s) => !text.includes(s));
    return missing.length ? { pass: false, detail: `missing: ${missing.join(', ')}` } : true;
  } },
];

export default [...C1, ...C2, ...C3, ...C4, ...C5, ...C6, ...C7, ...fidelityCases(), ...T, ...T10, ...H4, ...H5, ...L, ...G, ...MISC];
