#!/usr/bin/env node
// watch/freshness/facts.mjs: the facts the freshness classifier reads (SPEC.md FR-C.1), from the
// GitHub API, and the recorder for the reference fixture (FR-H.1, FR-H.7).
// writes: fixtures (manual record, see PROVENANCE.md)
//
// For every watched repository and every point (the packet pin, HEAD, a re-check pin, or an extra
// commit) it reads: the commit and its date, the root tree (license files) and the
// `.github/workflows` tree with blob ids (GraphQL, batched); the text of every blob not already
// summarized (GraphQL `object(oid:)`, batched; summaries are cached by blob id, so a file is parsed
// once for its lifetime); the Actions runs for the commit (REST `actions/runs?head_sha=`); and, once
// per repository, the registered workflows and their states (REST `actions/workflows`). Releases,
// tags, HEAD, archived and pin reachability come from watch/watch.mjs's snapshot.
//
//   node watch/freshness/facts.mjs --record     re-record fixtures/core/reference.json (all 44 at
//                                               pin and HEAD, plus the labelled points), with the
//                                               blob texts; see fixtures/PROVENANCE.md
//
// Node 22 built-ins only.

import { writeFileSync, mkdirSync, renameSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { summarizeWorkflow, summarizeLicense } from './classify.mjs';

const OWNER = 'Dicklesworthstone';
const FRESH = dirname(fileURLToPath(import.meta.url));
const ROOT = join(FRESH, '..', '..');
export const REFERENCE = join(FRESH, 'fixtures', 'core', 'reference.json');
// Bump when summarizeWorkflow or summarizeLicense changes, so cached summaries are recomputed.
export const SUMMARY_VERSION = 1;
const POINT_BATCH = 4;
const BLOB_BATCH = 25;
const REST_CONCURRENCY = 6;
const RUN_PAGES = 10;
const LICENSE_FILE = /^(licen[cs]e|copying|unlicense)([._-][A-Za-z0-9._-]*)?$/i;

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const k = next++; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
const iso = (s) => (s ? new Date(s).toISOString().replace(/\.\d{3}Z$/, 'Z') : null);

// ---------------------------------------------------------------- GraphQL: trees at points
const pointFields = (alias, sha) => {
  const s = JSON.stringify;
  return `${alias}: object(expression: ${s(sha)}) { ... on Commit { oid committedDate } }
    ${alias}_root: object(expression: ${s(sha + ':')}) { ... on Tree { entries { name oid type } } }
    ${alias}_wf: object(expression: ${s(sha + ':.github/workflows')}) { ... on Tree { entries { name oid type } } }`;
};

// jobs: [{ repo, name, points: [{ key, sha }] }] -> Map repo -> { key: rawTree | null }
export async function fetchTrees(api, jobs) {
  const batches = [];
  for (let i = 0; i < jobs.length; i += POINT_BATCH) batches.push(jobs.slice(i, i + POINT_BATCH));
  const out = new Map();
  await mapLimit(batches, 3, async (batch) => {
    const q = `query { rateLimit { cost remaining }\n${batch.map((j, r) => `r${r}: repository(owner: ${JSON.stringify(OWNER)}, name: ${JSON.stringify(j.name)}) {\n${j.points.map((p, k) => pointFields(`p${k}`, p.sha)).join('\n')} }`).join('\n')} }`;
    const data = await api.graphql(q);
    batch.forEach((j, r) => {
      const node = data[`r${r}`];
      const trees = {};
      j.points.forEach((p, k) => {
        const c = node?.[`p${k}`];
        trees[p.key] = c?.oid ? {
          sha: c.oid, date: iso(c.committedDate),
          root: (node[`p${k}_root`]?.entries ?? []).map((e) => ({ name: e.name, oid: e.oid, type: e.type })),
          wf: node[`p${k}_wf`] ? node[`p${k}_wf`].entries.map((e) => ({ name: e.name, oid: e.oid, type: e.type })) : [],
        } : null;
      });
      out.set(j.repo, trees);
    });
  });
  return out;
}

// wanted: [{ name, oid }] -> Map oid -> text (null for a binary or unreadable blob)
export async function fetchBlobs(api, wanted) {
  const byName = new Map();
  for (const w of wanted) { if (!byName.has(w.name)) byName.set(w.name, new Set()); byName.get(w.name).add(w.oid); }
  const batches = [];
  for (const [name, set] of byName) { const oids = [...set]; for (let i = 0; i < oids.length; i += BLOB_BATCH) batches.push({ name, oids: oids.slice(i, i + BLOB_BATCH) }); }
  const out = new Map();
  await mapLimit(batches, 3, async (b) => {
    const q = `query { rateLimit { cost remaining } repository(owner: ${JSON.stringify(OWNER)}, name: ${JSON.stringify(b.name)}) {\n${b.oids.map((o, i) => `b${i}: object(oid: ${JSON.stringify(o)}) { ... on Blob { text isBinary } }`).join('\n')} } }`;
    const data = await api.graphql(q);
    b.oids.forEach((o, i) => { const blob = data.repository?.[`b${i}`]; out.set(o, blob && !blob.isBinary ? blob.text ?? null : null); });
  });
  return out;
}

// ---------------------------------------------------------------- REST: runs and workflow states
// Runs for one commit, trimmed to what FR-C.2 reads. `complete` is false when the API did not return
// every run it counted (a gap FR-C.3 reports as unknown).
export async function fetchRuns(api, name, sha) {
  const list = [];
  let total = null;
  for (let page = 1; page <= RUN_PAGES; page++) {
    const r = await api.rest('GET', `/repos/${OWNER}/${name}/actions/runs?head_sha=${sha}&per_page=100&page=${page}`, null, [404]);
    if (r.status !== 200) return null;
    total = r.body.total_count;
    for (const w of r.body.workflow_runs ?? []) list.push({ path: w.path ?? null, name: w.name ?? null, event: w.event, status: w.status, conclusion: w.conclusion ?? null });
    if ((r.body.workflow_runs ?? []).length < 100) break;
  }
  list.sort((a, b) => cmpRun(a, b));
  return { total, complete: total === list.length, list };
}
const cmpRun = (a, b) => [a.path, a.event, a.status, a.conclusion, a.name].join('|').localeCompare([b.path, b.event, b.status, b.conclusion, b.name].join('|'));

// Registered workflows: path -> { state, since }. `since` is the workflow's `updated_at`, the last
// time GitHub changed its record (a state change among them), which dates a state to a point.
export async function fetchWorkflowStates(api, name) {
  const states = {};
  for (let page = 1; page <= 10; page++) {
    const r = await api.rest('GET', `/repos/${OWNER}/${name}/actions/workflows?per_page=100&page=${page}`, null, [404]);
    if (r.status !== 200) return null;
    for (const w of r.body.workflows ?? []) if (w.path) states[w.path] = { state: w.state, since: iso(w.updated_at) };
    if ((r.body.workflows ?? []).length < 100) break;
  }
  return Object.fromEntries(Object.entries(states).sort(([a], [b]) => a.localeCompare(b)));
}

// ---------------------------------------------------------------- raw records
const workflowEntries = (tree) => (tree?.wf ?? []).filter((e) => e.type === 'blob' && /\.ya?ml$/i.test(e.name))
  .map((e) => ({ path: `.github/workflows/${e.name}`, blob: e.oid })).sort((a, b) => a.path.localeCompare(b.path));
const licenseEntries = (tree) => (tree?.root ?? []).filter((e) => e.type === 'blob' && LICENSE_FILE.test(e.name))
  .map((e) => ({ name: e.name, blob: e.oid })).sort((a, b) => a.name.localeCompare(b.name));

// The per-repository record: the snapshot fields FR-C and FR-T read, plus one entry per point.
export function snapFields(rec) {
  return {
    repo: rec.repo, name: rec.name ?? rec.repo, found: !!rec.found, archived: !!rec.archived,
    default_branch: rec.default_branch ?? null, pin: rec.pin, pin_date: rec.pin_date ?? null,
    head: rec.head ?? null, head_date: rec.head_date ?? null, pin_reachable: rec.pin_reachable ?? null,
    compare_status: rec.compare_status ?? null, commits_since_pin: rec.commits_since_pin ?? null,
    releases: Object.entries(rec.releases ?? {}).map(([tag, r]) => ({ tag, target: r.target, date: r.published_at ?? r.created_at, draft: false, prerelease: !!r.prerelease, assets: r.assets ?? null }))
      .sort((a, b) => a.tag.localeCompare(b.tag)),
    tags: Object.entries(rec.tags ?? {}).map(([name, t]) => ({ name, target: t.target, date: t.date })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// A point as recorded: files by blob id and the runs on the commit. Texts live elsewhere (by blob id).
// `lockfile` (the root Cargo.lock) is recorded only where a dependency.edge revisit trigger reads it.
const lockEntry = (tree) => (tree?.root ?? []).find((e) => e.type === 'blob' && e.name === 'Cargo.lock') ?? null;
function rawPoint(tree, runs, withLock) {
  if (!tree) return null;
  const p = { sha: tree.sha, date: tree.date, workflows: workflowEntries(tree), licenses: licenseEntries(tree), runs };
  if (withLock) { const l = lockEntry(tree); p.lockfile = l ? { blob: l.oid } : null; }
  return p;
}
const textEntries = (tree, withLock) => [...workflowEntries(tree), ...licenseEntries(tree), ...(withLock && lockEntry(tree) ? [{ blob: lockEntry(tree).oid }] : [])];

// ---------------------------------------------------------------- summaries (cached by blob id)
// A Cargo.lock reduced to its package names.
export function summarizeLockfile(text) {
  return { packages: [...new Set([...String(text).matchAll(/^name = "([^"]+)"$/gm)].map((m) => m[1]))].sort() };
}
const SUMMARIZERS = { workflow: summarizeWorkflow, license: summarizeLicense, lockfile: summarizeLockfile };
export function summarize(kind, text) {
  return text == null ? null : SUMMARIZERS[kind](text);
}
export function summariesFromTexts(records, texts) {
  const out = {};
  const add = (kind, blob) => { if (!(blob in out)) out[blob] = summarize(kind, texts[blob] ?? null); };
  for (const r of Object.values(records)) for (const p of Object.values(r.points ?? {})) {
    if (!p) continue;
    for (const w of p.workflows) add('workflow', w.blob);
    for (const l of p.licenses) add('license', l.blob);
    if (p.lockfile) add('lockfile', p.lockfile.blob);
  }
  return out;
}

// ---------------------------------------------------------------- facts (FR-C.1 input)
// record: a raw record above; summaries: blob id -> summary; privateCi: row from private-ci.tsv.
export function factsFor(record, summaries, { checkedAt, privateCi = null, pointMap = { pin: 'pin', now: 'now' } } = {}) {
  const point = (raw) => (raw ? {
    sha: raw.sha, date: raw.date,
    workflows: raw.workflows.map((w) => ({ path: w.path, blob: w.blob, summary: summaries[w.blob] ?? null })),
    licenses: raw.licenses.map((l) => ({ name: l.name, blob: l.blob, summary: summaries[l.blob] ?? null })),
    runs: raw.runs, lockfile: raw.lockfile ? { blob: raw.lockfile.blob, summary: summaries[raw.lockfile.blob] ?? null } : null,
  } : null);
  const points = {};
  for (const [key, src] of Object.entries(pointMap)) points[key] = point(record.points?.[src] ?? null);
  return {
    repo: record.name ?? record.repo, checked_at: checkedAt ?? null, default_branch: record.default_branch,
    private_ci: privateCi, releases: record.found ? record.releases : null, tags: record.found ? record.tags : null,
    workflow_states: record.workflow_states ?? null, points,
  };
}

// ---------------------------------------------------------------- live gathering with a cache
// snap: watch/watch.mjs collect() output; cache: the previous state's `freshness` (or null);
// extra: repo -> [{ key, sha }] points beyond pin and HEAD (re-check pins, labelled commits);
// lockfiles: repositories whose HEAD Cargo.lock is read (dependency.edge revisit triggers).
// Returns { records, texts, cache }: cache is what the next state stores (blob summaries, and the
// runs of commits other than HEAD once every run on them has completed).
export async function gatherFreshness(api, snap, { cache = null, extra = {}, lockfiles = new Set() } = {}) {
  const old = cache?.version === SUMMARY_VERSION ? cache : { version: SUMMARY_VERSION, summaries: {}, runs: {} };
  const found = Object.values(snap.assessed).filter((r) => r.found && r.head);
  const jobs = found.map((r) => ({
    repo: r.repo, name: r.name,
    points: dedupePoints([{ key: 'pin', sha: r.pin }, { key: 'now', sha: r.head }, ...(extra[r.repo] ?? [])]),
  }));
  const trees = await fetchTrees(api, jobs);
  const need = [];
  for (const j of jobs) for (const [key, t] of Object.entries(trees.get(j.repo) ?? {})) {
    if (t) for (const e of textEntries(t, key === 'now' && lockfiles.has(j.repo))) if (!(e.blob in old.summaries)) need.push({ name: j.name, oid: e.blob });
  }
  const texts = need.length ? Object.fromEntries(await fetchBlobs(api, need)) : {};
  const states = new Map(await mapLimit(found, REST_CONCURRENCY, async (r) => [r.repo, await fetchWorkflowStates(api, r.name)]));
  const runCache = {};
  const runJobs = jobs.flatMap((j) => j.points.map((p) => ({ j, p, key: `${j.repo}@${p.sha}`, head: snap.assessed[j.repo].head })));
  const runs = await mapLimit(runJobs, REST_CONCURRENCY, async ({ j, p, key, head }) => {
    const settled = p.sha !== head;
    const got = settled && old.runs[key] ? old.runs[key] : await fetchRuns(api, j.name, p.sha);
    if (settled && got?.complete && got.list.every((x) => x.status === 'completed')) runCache[key] = got;
    return got;
  });
  const records = {};
  let k = 0;
  for (const j of jobs) {
    const t = trees.get(j.repo) ?? {};
    const points = {};
    for (const p of j.points) points[p.key] = rawPoint(t[p.key], runs[k++], p.key === 'now' && lockfiles.has(j.repo));
    records[j.repo] = { ...snapFields(snap.assessed[j.repo]), workflow_states: states.get(j.repo), points };
  }
  for (const r of Object.values(snap.assessed)) records[r.repo] ??= { ...snapFields(r), workflow_states: null, points: {} };
  const fresh = summariesFromTexts(records, texts);
  const summaries = Object.fromEntries(Object.entries(fresh).map(([oid, s]) => [oid, oid in old.summaries ? old.summaries[oid] : s]));
  return { records, texts, cache: { version: SUMMARY_VERSION, summaries, runs: runCache }, fetched: { blobs: need.length } };
}
function dedupePoints(points) {
  const seen = new Map();
  for (const p of points) if (!seen.has(p.key)) seen.set(p.key, p);
  return [...seen.values()];
}

// ---------------------------------------------------------------- the recorder
// Points recorded beyond pin and HEAD: the two labelled re-check pins (FR-H.4) and the commits the
// daily watch's first issues named for workflow additions (#2, #3, #4, #6, #7; evidence URL in each).
export const LABELLED_POINTS = {
  frankengit: [{ key: 'recheck', sha: 'dfa5bb861e1f08802c72d33e96796a1aad9d5d06' }],
  franken_code_browser: [{ key: 'recheck', sha: 'c7c531061e250d81afc58da7cb35ec0b4e7129cb' }],
  franken_lean: [{ key: 'issue2', sha: '9d6d77bccb3219391c060f39566b45284d39a400' }],
  franken_manim: [{ key: 'issue3', sha: 'b2322be459387395a172e16a2bbc2cf6c14e38fa' }],
  frankenfs: [{ key: 'issue4', sha: 'c8de05f97967a04dc50c40673213c7be9292da86' }],
  frankenlibc: [{ key: 'issue6', sha: '0d662e3ba886bc1199717a797879cc287eebadd9' }],
  frankensim: [{ key: 'issue7', sha: '950ef5ce350b93dde85b9460e0ac1c9e0fd87ce8' }],
};

// The reference fixture: fixtures/core/reference.json holds the trimmed records (readable, one file)
// and fixtures/core/blobs.json.gz the text of every blob they name (workflow files, license files,
// the Cargo.lock files dependency.edge reads), keyed by blob id, gzipped because it is 4 MB of YAML.
export const BLOBS = join(FRESH, 'fixtures', 'core', 'blobs.json.gz');

async function record() {
  const t0 = Date.now();
  const w = await import(pathToFileURL(join(ROOT, 'watch', 'watch.mjs')).href);
  const { parseTsv } = await import('./revisit.mjs');
  const lockfiles = new Set(parseTsv(readFileSync(join(FRESH, 'revisit.tsv'), 'utf8')).filter((r) => r.detector === 'dependency.edge').map((r) => r.repo));
  const api = w.makeApi(w.resolveToken());
  const assessed = w.parsePackets(join(ROOT, 'packets'));
  const recordedAt = iso(new Date().toISOString());
  const snap = await w.collect(w.liveSource(api), assessed, null, recordedAt);
  const got = await gatherFreshness(api, snap, { extra: LABELLED_POINTS, lockfiles });
  const texts = {};
  // A Cargo.lock is kept only as its `name = "..."` lines, the part summarizeLockfile reads.
  const lockLines = (t) => (t == null ? null : t.split('\n').filter((l) => /^name = "[^"]+"$/.test(l)).join('\n') + '\n');
  for (const r of Object.values(got.records)) for (const p of Object.values(r.points)) {
    if (!p) continue;
    for (const e of [...p.workflows, ...p.licenses]) texts[e.blob] = got.texts[e.blob] ?? null;
    if (p.lockfile) texts[p.lockfile.blob] = lockLines(got.texts[p.lockfile.blob] ?? null);
  }
  const gitRef = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const fixture = {
    schema: 'fr.watch.facts-fixture/v1',
    recorded_at: recordedAt,
    git_ref: gitRef,
    command: 'node watch/freshness/facts.mjs --record',
    api: { ...api.stats, elapsed_s: Math.round((Date.now() - t0) / 100) / 10 },
    records: Object.fromEntries(Object.entries(got.records).sort(([a], [b]) => a.localeCompare(b))),
  };
  const blobs = Object.fromEntries(Object.entries(texts).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(REFERENCE), { recursive: true });
  writeFileSync(`${REFERENCE}.tmp`, JSON.stringify(fixture, null, 1) + '\n');
  writeFileSync(`${BLOBS}.tmp`, gzipSync(JSON.stringify(blobs) + '\n', { level: 9 }));
  renameSync(`${REFERENCE}.tmp`, REFERENCE);
  renameSync(`${BLOBS}.tmp`, BLOBS);
  console.log(JSON.stringify({ wrote: [REFERENCE, BLOBS].map((f) => f.slice(ROOT.length + 1)), recorded_at: recordedAt, git_ref: gitRef, repos: Object.keys(fixture.records).length, blobs: Object.keys(blobs).length, api: fixture.api }));
}

// { ...reference.json, texts: blob id -> text }
export function loadReference(path = REFERENCE, blobs = BLOBS) {
  if (!existsSync(path) || !existsSync(blobs)) throw new Error(`reference fixture missing: ${path} or ${blobs}`);
  return { ...JSON.parse(readFileSync(path, 'utf8')), texts: JSON.parse(gunzipSync(readFileSync(blobs)).toString('utf8')) };
}

// The replay fixture (FR-H.5): every committed version of watch/state.json, oldest first, from
// `git log -- watch/state.json`, gzipped. The cases read it, so the replay needs no .git directory.
export const REPLAY = join(FRESH, 'fixtures', 'core', 'replay-states.json.gz');
function recordReplay() {
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const commits = git('log', '--reverse', '--format=%H %cI', '--', 'watch/state.json').trim().split('\n').filter(Boolean).map((l) => l.split(' '));
  const states = commits.map(([commit, committed]) => ({ commit, committed_at: iso(committed), state: JSON.parse(git('show', `${commit}:watch/state.json`)) }));
  const fixture = { schema: 'fr.watch.replay-fixture/v1', command: 'node watch/freshness/facts.mjs --record-replay', recorded_at: iso(new Date().toISOString()), git_ref: git('rev-parse', 'HEAD').trim(), source: 'git log --reverse -- watch/state.json; git show <commit>:watch/state.json', states };
  writeFileSync(`${REPLAY}.tmp`, gzipSync(JSON.stringify(fixture) + '\n', { level: 9 }));
  renameSync(`${REPLAY}.tmp`, REPLAY);
  console.log(JSON.stringify({ wrote: REPLAY.slice(ROOT.length + 1), states: states.map((s) => [s.commit.slice(0, 7), s.state.checked_at]) }));
}
export function loadReplay(path = REPLAY) {
  return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  if (mode === '--record') record().catch((e) => { console.error(`facts: ${e.message}`); process.exit(e.code ?? 3); });
  else if (mode === '--record-replay') recordReplay();
  else { console.error('usage: node watch/freshness/facts.mjs --record | --record-replay'); process.exit(2); }
}
