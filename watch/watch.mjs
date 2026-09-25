#!/usr/bin/env node
// watch/watch.mjs: daily watch of Dicklesworthstone's public GitHub repositories for Franken Research.
//
// Reads the GitHub API only (GraphQL + REST); never a local mirror. Compares each of the 44 assessed
// repositories, and every repository in a cohort matrix (cohorts/*/matrix.md), with its pin and with
// the previous watch/state.json. It never judges an event and never edits pins, packets, or
// synthesis. See watch/README.md; the freshness contract (class triggers, live.json, the crossing
// ledger, the dashboard) is watch/freshness/SPEC.md.
// writes: watch/state.json, watch/census/<date>.tsv, watch/changes/<date>.json, watch/latest.json, watch/live.json, watch/crossings.jsonl
//
//   node watch/watch.mjs                  dry report on stdout, writes nothing
//   node watch/watch.mjs --apply          also write watch/state.json, census/<date>.tsv, changes/<date>.json, latest.json,
//                                         live.json, and append the day's crossing events to crossings.jsonl
//   node watch/watch.mjs --dashboard      also create or edit the one freshness dashboard issue
//   node watch/watch.mjs --json           machine-readable report
//   node watch/watch.mjs --fail-on-change dry report; exit 1 if anything material is new since the last state
//   node watch/watch.mjs --selftest       offline: recorded fixtures through the same collect/diff code
//
// Exit: 0 ok; 1 material change with --fail-on-change (or a failed selftest); 2 usage, input, or token
// error; 3 GitHub API failure (nothing is written from partial data).
// Token: GITHUB_TOKEN or GH_TOKEN, else `gh auth token`. The token is never printed.
// Node 22 built-ins only.

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gatherFreshness } from './freshness/facts.mjs';
import { computeFreshness, renderLiveJson, MAX_BYTES } from './freshness/live.mjs';
import { latestRechecks, parsePrivateCi, assertLedgerPrefix } from './freshness/triggers.mjs';
import { parseTsv as parseRevisit } from './freshness/revisit.mjs';

const OWNER = 'Dicklesworthstone';
const ISSUE_REPO = 'JYeswak/franken-research';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WATCH_DIR = join(ROOT, 'watch');
const PACKETS_DIR = join(ROOT, 'packets');
const OVERVIEW = join(ROOT, 'synthesis', '00-overview.md');
const EXPECTED_ASSESSED = 44;
// Assessment date of the pinned corpus (README "What we found"; synthesis/00-overview.md master matrix).
const ASSESSMENT_DATE = '2026-09-22';
const GQL_CONCURRENCY = 3;
const GQL_BATCH = 8;
const REST_CONCURRENCY = 6;
const UA = 'franken-research-watch';

const EXIT = { OK: 0, CHANGE: 1, USAGE: 2, API: 3 };
class WatchError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const usageError = (m) => new WatchError(EXIT.USAGE, m);
const apiError = (m) => new WatchError(EXIT.API, m);

// Change kind -> label and the master-matrix cells it may affect (synthesis/00-overview.md), as
// recorded in each entry of watch/changes/<date>.json.
const KINDS = {
  release: { label: 'release', affects: ['Rel', 'TRL', 'NODUS'] },
  tag: { label: 'release', affects: ['Rel', 'TRL', 'NODUS'] },
  license: { label: 'license', affects: ['License'] },
  workflows: { label: 'ci', affects: ['CI'] },
  archived: { label: 'archived', affects: ['NODUS', 'TRL', 'Bus'] },
  unarchived: { label: 'archived', affects: ['NODUS', 'TRL', 'Bus'] },
  renamed: { label: 'renamed', affects: ['Identity'] },
  deleted: { label: 'deleted', affects: ['All'] },
  pin_unreachable: { label: 'pin-rewritten', affects: ['All'] },
  new_repo: { label: 'new-repo', affects: ['Set'] },
};
// The labels the dashboard issue carries (watch/freshness/dashboard.mjs creates them if missing).
export const LABELS = {
  watch: ['c5def5', 'Opened by the daily watch (watch/watch.mjs)'],
  dashboard: ['5319e7', 'Watch: the single living freshness dashboard issue (watch/freshness/dashboard.mjs)'],
};

// ---------------------------------------------------------------- small helpers
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const iso = (s) => (s ? new Date(s).toISOString().replace(/\.\d{3}Z$/, 'Z') : null);
const short = (sha) => (sha ? sha.slice(0, 7) : '-');
const digest = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 12);
const ghUrl = (repo, rest = '') => `https://github.com/${OWNER}/${repo}${rest}`;
const apiUrl = (path) => `https://api.github.com${path}`;
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sortKeys(v[k]);
    return o;
  }
  return v;
}
const toJson = (v) => JSON.stringify(sortKeys(v), null, 2) + '\n';
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const k = next++;
      out[k] = await fn(items[k], k);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ---------------------------------------------------------------- inputs: packets, matrix, state
// Header forms in use: "**Repository:** `O/R`", "**Repository:** [O/R](...)", "**Repo:** [`O/R`](...)",
// "| Repository | https://github.com/O/R |"; pins: "**Pinned commit:** `<sha>`", "**Pin:** `<sha>`",
// "| Pinned revision | `<sha>` ...".
const REPO_LINE = /^(?:\*\*Repo(?:sitory)?:\*\*|\| Repository \|)/;
const REPO_NAME = new RegExp(`${OWNER}/([A-Za-z0-9._-]+?)(?:\\.git)?(?=[\`\\])|\\s]|$)`, 'i');
const PIN_PATTERNS = [
  /\*\*Pinned commit:\*\*\s*`([0-9a-f]{40})`/g,
  /\*\*Pin:\*\*\s*`([0-9a-f]{40})`/g,
  /^\| Pinned revision \|\s*`([0-9a-f]{40})`/gm,
];
// One packet's repository name and pin; `problem` says why it cannot be used.
export function parsePacketText(text, file) {
  const names = new Set();
  for (const line of text.split('\n')) {
    if (!REPO_LINE.test(line)) continue;
    const m = line.match(REPO_NAME);
    if (m) names.add(m[1]);
  }
  const pins = new Set();
  for (const re of PIN_PATTERNS) for (const m of text.matchAll(re)) pins.add(m[1]);
  const expect = file.replace(/-assessment\.md$/, '');
  const problems = [];
  if (names.size !== 1) problems.push(`${file}: ${names.size} repository names (${[...names].join(', ') || 'none'})`);
  else if (!names.has(expect)) problems.push(`${file}: repository line names ${[...names][0]}, file name says ${expect}`);
  if (pins.size !== 1) problems.push(`${file}: ${pins.size} distinct pins`);
  return { repo: [...names][0] ?? null, pin: [...pins][0] ?? null, problem: problems.join('; ') || null, ok: names.size === 1 && pins.size === 1 };
}
export function parsePackets(dir) {
  if (!existsSync(dir)) throw usageError(`packets directory not found: ${dir}`);
  const files = readdirSync(dir).filter((f) => f.endsWith('-assessment.md')).sort();
  const out = [];
  const problems = [];
  for (const f of files) {
    const p = parsePacketText(readFileSync(join(dir, f), 'utf8'), f);
    if (p.problem) problems.push(p.problem);
    if (p.ok) out.push({ repo: p.repo, pin: p.pin, packet: `packets/${f}` });
  }
  if (problems.length) throw usageError(`packet parse failed:\n  ${problems.join('\n  ')}`);
  if (out.length !== EXPECTED_ASSESSED) throw usageError(`expected ${EXPECTED_ASSESSED} assessed repos, parsed ${out.length}`);
  return out.sort((a, b) => cmp(a.repo, b.repo));
}

export function parseMatrix(text) {
  const lines = text.split('\n');
  const head = lines.findIndex((l) => /^\| Project \| TRL \| NODUS \|/.test(l));
  if (head < 0) return {};
  const cols = lines[head].split('|').slice(1, -1).map((s) => s.trim());
  const out = {};
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const cells = lines[i].split('|').slice(1, -1).map((s) => s.trim());
    const row = {};
    cols.forEach((c, j) => { row[c] = cells[j]; });
    out[cells[0]] = row;
  }
  return out;
}

function readState(file) {
  if (!existsSync(file)) return null;
  let s;
  try { s = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw usageError(`${file} is not valid JSON: ${e.message}`); }
  if (s.schema !== 1 || !s.assessed || !Array.isArray(s.discovery)) throw usageError(`${file} has an unknown shape`);
  return s;
}

// ---------------------------------------------------------------- GitHub transport (live)
export function resolveToken() {
  const env = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  if (env) return env;
  try {
    const t = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
    if (t) return t;
  } catch { /* fall through to the typed error */ }
  throw usageError('no GitHub token: set GITHUB_TOKEN or GH_TOKEN, or log in with `gh auth login`');
}

export function makeApi(token) {
  const stats = { graphql_calls: 0, graphql_cost: 0, graphql_remaining: null, rest_calls: 0, rest_remaining: null };
  const headers = { Authorization: `Bearer ${token}`, 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28' };
  async function request(url, init, attempt = 0) {
    let res;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
    } catch (e) {
      if (attempt < 2) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); return request(url, init, attempt + 1); }
      throw apiError(`network error on ${url.replace(/\?.*/, '')}: ${e.message}`);
    }
    const throttled = res.status === 429 || (res.status === 403 && res.headers.get('retry-after'));
    if ((res.status >= 500 || throttled) && attempt < 2) {
      const wait = Math.min(Number(res.headers.get('retry-after')) || 2 * (attempt + 1), 20);
      await new Promise((r) => setTimeout(r, wait * 1000));
      return request(url, init, attempt + 1);
    }
    return res;
  }
  async function readJson(res, what) {
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { throw apiError(`${what}: HTTP ${res.status}, response is not JSON`); }
  }
  async function graphql(query, variables = {}) {
    stats.graphql_calls++;
    const res = await request('https://api.github.com/graphql', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }),
    });
    const body = await readJson(res, 'GraphQL');
    if (res.status === 401) throw usageError('GitHub token rejected (HTTP 401)');
    if (res.status !== 200) throw apiError(`GraphQL HTTP ${res.status}: ${body?.message ?? ''}`);
    const rl = body?.data?.rateLimit;
    if (rl) { stats.graphql_cost += rl.cost; stats.graphql_remaining = rl.remaining; }
    // NOT_FOUND for an aliased repository is data (deleted, private, or renamed), not a failure.
    const fatal = (body?.errors ?? []).filter((e) => e.type !== 'NOT_FOUND');
    if (fatal.length) throw apiError(`GraphQL: ${fatal.map((e) => e.message).join('; ').slice(0, 400)}`);
    if (!body?.data) throw apiError('GraphQL: no data');
    return body.data;
  }
  async function rest(method, path, payload, allow = []) {
    stats.rest_calls++;
    const res = await request(`https://api.github.com${path}`, {
      method,
      headers: { ...headers, Accept: 'application/vnd.github+json', ...(payload ? { 'Content-Type': 'application/json' } : {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const rem = res.headers.get('x-ratelimit-remaining');
    if (rem !== null) stats.rest_remaining = Number(rem);
    const body = await readJson(res, `${method} ${path}`);
    if (res.status === 401) throw usageError('GitHub token rejected (HTTP 401)');
    if (res.ok || allow.includes(res.status)) return { status: res.status, body };
    throw apiError(`${method} ${path.replace(/\?.*/, '')}: HTTP ${res.status} ${body?.message ?? ''}`.trim());
  }
  return { graphql, rest, stats };
}

const RELEASES = (after) => `releases(first: 100${after ? `, after: ${after}` : ''}, orderBy: {field: CREATED_AT, direction: DESC}) {
    totalCount pageInfo { hasNextPage endCursor }
    nodes { tagName createdAt publishedAt isDraft isPrerelease tagCommit { oid } releaseAssets { totalCount } } }`;
const TAGS = (after) => `refs(refPrefix: "refs/tags/", first: 100${after ? `, after: ${after}` : ''}, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
    totalCount pageInfo { hasNextPage endCursor }
    nodes { name target { __typename oid ... on Commit { committedDate }
      ... on Tag { tagger { date } target { __typename oid ... on Commit { committedDate } } } } } }`;
const REPO_FIELDS = `fragment RepoFields on Repository {
  databaseId name isArchived
  defaultBranchRef { name target { ... on Commit { oid committedDate } } }
  licenseInfo { spdxId }
  root: object(expression: "HEAD:") { ... on Tree { entries { name oid type } } }
  wf: object(expression: "HEAD:.github/workflows") { ... on Tree { entries { name type } } }
  ${RELEASES(null)}
  ${TAGS(null)}
}`;
const DISCOVERY_Q = `query($login: String!, $after: String) {
  rateLimit { cost remaining }
  user(login: $login) { repositories(first: 100, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: {field: NAME, direction: ASC}) {
    totalCount pageInfo { hasNextPage endCursor }
    nodes { databaseId name description isArchived isFork pushedAt createdAt primaryLanguage { name } } } } }`;

function repoAlias(alias, name, pin) {
  const s = JSON.stringify;
  return `${alias}: repository(owner: ${s(OWNER)}, name: ${s(name)}) { ...RepoFields
    pin: object(expression: ${s(pin)}) { ... on Commit { oid committedDate } }
    pinRoot: object(expression: ${s(pin + ':')}) { ... on Tree { entries { name oid type } } }
    pinWf: object(expression: ${s(pin + ':.github/workflows')}) { ... on Tree { entries { name type } } } }`;
}

export function liveSource(api) {
  async function completeConnection(node, key, build) {
    let conn = node[key];
    while (conn.pageInfo.hasNextPage) {
      const q = `query($owner: String!, $name: String!, $after: String!) { rateLimit { cost remaining }
        repository(owner: $owner, name: $name) { ${build('$after')} } }`;
      const data = await api.graphql(q, { owner: OWNER, name: node.name, after: conn.pageInfo.endCursor });
      const more = data.repository?.[key];
      if (!more) throw apiError(`pagination of ${key} for ${node.name} failed`);
      conn = { ...more, nodes: [...conn.nodes, ...more.nodes] };
    }
    node[key] = conn;
  }
  return {
    async discovery() {
      for (let attempt = 0; attempt < 2; attempt++) {
        const nodes = [];
        let after = null;
        let total = null;
        for (let page = 0; page < 100; page++) {
          const data = await api.graphql(DISCOVERY_Q, { login: OWNER, after });
          const conn = data.user?.repositories;
          if (!conn) throw apiError(`GitHub user ${OWNER} not found`);
          total = conn.totalCount;
          nodes.push(...conn.nodes);
          if (!conn.pageInfo.hasNextPage) break;
          after = conn.pageInfo.endCursor;
        }
        if (new Set(nodes.map((n) => n.databaseId)).size === total) return nodes;
      }
      throw apiError('repository listing changed during pagination twice; not writing a partial census');
    },
    async repoNodes(list) {
      const batches = [];
      for (let i = 0; i < list.length; i += GQL_BATCH) batches.push(list.slice(i, i + GQL_BATCH));
      const results = await mapLimit(batches, GQL_CONCURRENCY, async (batch) => {
        const q = `query { rateLimit { cost remaining }\n${batch.map((x, j) => repoAlias(`r${j}`, x.name, x.pin)).join('\n')} }\n${REPO_FIELDS}`;
        const data = await api.graphql(q);
        const nodes = [];
        for (let j = 0; j < batch.length; j++) {
          const node = data[`r${j}`] ?? null;
          if (node) {
            await completeConnection(node, 'releases', RELEASES);
            await completeConnection(node, 'refs', TAGS);
          }
          nodes.push([batch[j].name, node]);
        }
        return nodes;
      });
      return new Map(results.flat());
    },
    async lookupName(name) {
      const r = await api.rest('GET', `/repos/${OWNER}/${name}`, null, [404]);
      return r.status === 200 ? { id: r.body.id, name: r.body.name, owner: r.body.owner?.login ?? null } : null;
    },
    async lookupId(id) {
      const r = await api.rest('GET', `/repositories/${id}`, null, [404]);
      return r.status === 200 ? { id: r.body.id, name: r.body.name, owner: r.body.owner?.login ?? null } : null;
    },
    // page=2 of a one-commit page returns the comparison summary without the file list (about 10 KB
    // instead of up to 1 MB). Only status, ahead_by and behind_by are kept; commit authors never are.
    async compare(name, pin, head) {
      const r = await api.rest('GET', `/repos/${OWNER}/${name}/compare/${pin}...${head}?per_page=1&page=2`, null, [404, 422]);
      if (r.status !== 200) return { http_status: r.status, body: null };
      return { http_status: 200, body: { status: r.body.status, ahead_by: r.body.ahead_by, behind_by: r.body.behind_by } };
    },
  };
}

// Offline transport over recorded responses (watch/fixtures/*.json); same interface as liveSource.
export function fixtureSource(fx) {
  return {
    discovery: async () => fx.discovery,
    repoNodes: async (list) => new Map(list.map(({ name }) => [name, structuredClone(fx.repos[name]?.graphql ?? null)])),
    lookupName: async (name) => fx.redirects?.[name] ?? null,
    lookupId: async (id) => fx.ids?.[String(id)] ?? null,
    compare: async (name) => fx.repos[name]?.compare ?? { http_status: 404, body: null },
  };
}

// ---------------------------------------------------------------- normalize
const LICENSE_FILE = /^(licen[cs]e|copying|unlicense)([._-][A-Za-z0-9._-]*)?$/i;
function licenseFiles(tree) {
  if (!tree?.entries) return [];
  return tree.entries.filter((e) => e.type === 'blob' && LICENSE_FILE.test(e.name))
    .map((e) => ({ name: e.name, blob: e.oid })).sort((a, b) => cmp(a.name, b.name));
}
function workflowFiles(tree) {
  if (!tree?.entries) return [];
  return tree.entries.filter((e) => e.type === 'blob').map((e) => e.name).sort();
}
const licenseKey = (files) => files.map((f) => `${f.name}:${f.blob}`).join(',');
const licenseText = (files) => (files.length ? files.map((f) => `${f.name}@${short(f.blob)}`).join(', ') : 'no license file');

export function normalizeDiscovery(nodes) {
  const byId = new Map();
  for (const n of nodes) {
    byId.set(n.databaseId, {
      id: n.databaseId, name: n.name, description: n.description ?? null, archived: !!n.isArchived, fork: !!n.isFork,
      language: n.primaryLanguage?.name ?? null, created_at: iso(n.createdAt), pushed_at: iso(n.pushedAt),
    });
  }
  return [...byId.values()].sort((a, b) => cmp(a.name, b.name));
}

function compareResult(raw) {
  if (!raw) return { reachable: false, status: 'no_head', ahead: null, behind: null };
  if (raw.http_status === 404) return { reachable: false, status: 'not_found', ahead: null, behind: null };
  if (raw.http_status !== 200) return { reachable: false, status: `http_${raw.http_status}`, ahead: null, behind: null };
  const s = raw.body.status;
  return { reachable: s === 'ahead' || s === 'identical', status: s, ahead: raw.body.ahead_by, behind: raw.body.behind_by };
}

function sincePin(releases, tags, pinDate) {
  const out = new Map();
  if (!pinDate) return [];
  for (const [name, r] of Object.entries(releases)) {
    const d = r.published_at || r.created_at;
    if (d && d > pinDate) out.set(name, { name, kind: 'release', date: d, target: r.target });
  }
  for (const [name, t] of Object.entries(tags)) {
    if (!out.has(name) && t.date && t.date > pinDate) out.set(name, { name, kind: 'tag', date: t.date, target: t.target });
  }
  return [...out.values()].sort((a, b) => cmp(a.date, b.date) || cmp(a.name, b.name));
}

export function normalizeAssessed(entry, node, rawCompare, prevRec) {
  const base = { repo: entry.repo, packet: entry.packet, pin: entry.pin };
  if (!node) return { ...base, found: false, id: entry.id ?? prevRec?.id ?? null, name: null, pin_date: prevRec?.pin_date ?? null };
  const releases = {};
  for (const r of node.releases?.nodes ?? []) {
    if (r.isDraft) continue;
    releases[r.tagName] = { target: r.tagCommit?.oid ?? null, published_at: iso(r.publishedAt), created_at: iso(r.createdAt), prerelease: !!r.isPrerelease, assets: r.releaseAssets?.totalCount ?? null };
  }
  const tags = {};
  for (const t of node.refs?.nodes ?? []) {
    const tg = t.target;
    const commit = tg?.__typename === 'Tag' ? tg.target : tg;
    tags[t.name] = { target: commit?.oid ?? null, date: iso(tg?.__typename === 'Tag' ? (tg.tagger?.date ?? commit?.committedDate) : commit?.committedDate) };
  }
  const pinKnown = !!node.pin;
  const pinDate = iso(node.pin?.committedDate) ?? prevRec?.pin_date ?? null;
  const lic = licenseFiles(node.root);
  const licPin = pinKnown ? licenseFiles(node.pinRoot) : null;
  const wf = workflowFiles(node.wf);
  const wfPin = pinKnown ? workflowFiles(node.pinWf) : null;
  const c = compareResult(rawCompare);
  return {
    ...base,
    found: true,
    id: node.databaseId,
    name: node.name,
    archived: !!node.isArchived,
    default_branch: node.defaultBranchRef?.name ?? null,
    head: node.defaultBranchRef?.target?.oid ?? null,
    head_date: iso(node.defaultBranchRef?.target?.committedDate),
    pin_date: pinDate,
    pin_reachable: c.reachable,
    compare_status: c.status,
    commits_since_pin: c.ahead,
    commits_behind_pin: c.behind,
    license_spdx: node.licenseInfo?.spdxId ?? 'none',
    license_files: lic,
    license_files_at_pin: licPin,
    license_changed_since_pin: licPin ? licenseKey(lic) !== licenseKey(licPin) : null,
    workflows: wf,
    workflows_added_since_pin: wfPin ? wf.filter((x) => !wfPin.includes(x)) : null,
    workflows_removed_since_pin: wfPin ? wfPin.filter((x) => !wf.includes(x)) : null,
    releases,
    tags,
    since_pin: sincePin(releases, tags, pinDate),
  };
}

// ---------------------------------------------------------------- collect
export async function collect(source, assessed, prev, checkedAt) {
  const discovery = normalizeDiscovery(await source.discovery());
  const byId = new Map(discovery.map((d) => [d.id, d]));
  // Resolve each assessed repo's current name: by GitHub id once a state has recorded it (so a rename
  // is followed, not reported as deleted), else by the packet name.
  const plan = [];
  for (const a of assessed) {
    const p = prev?.assessed?.[a.repo];
    const x = { ...a, id: p?.id ?? null, query: a.repo };
    if (x.id != null) {
      const d = byId.get(x.id);
      if (d) x.query = d.name;
      else {
        const hit = await source.lookupId(x.id);
        x.query = hit && hit.owner === OWNER ? hit.name : null;
      }
    }
    plan.push(x);
  }
  const nodes = await source.repoNodes(plan.filter((x) => x.query).map((x) => ({ name: x.query, pin: x.pin })));
  // A name GraphQL cannot resolve may be a rename: REST follows GitHub's redirect.
  const retry = [];
  for (const x of plan) {
    if (!x.query || nodes.get(x.query)) continue;
    const hit = await source.lookupName(x.query);
    if (hit && hit.owner === OWNER && hit.name !== x.query) {
      x.query = hit.name;
      retry.push({ name: hit.name, pin: x.pin });
    } else x.query = null;
  }
  if (retry.length) for (const [k, v] of await source.repoNodes(retry)) nodes.set(k, v);
  const compares = await mapLimit(plan, REST_CONCURRENCY, async (x) => {
    const node = x.query ? nodes.get(x.query) : null;
    const head = node?.defaultBranchRef?.target?.oid;
    if (!node || !head) return null;
    if (head === x.pin) return { http_status: 200, body: { status: 'identical', ahead_by: 0, behind_by: 0 } };
    return source.compare(x.query, x.pin, head);
  });
  const out = {};
  plan.forEach((x, i) => {
    out[x.repo] = normalizeAssessed(x, x.query ? nodes.get(x.query) ?? null : null, compares[i], prev?.assessed?.[x.repo]);
  });
  return { schema: 1, owner: OWNER, checked_at: checkedAt, previous_checked_at: prev?.checked_at ?? null, assessed: out, discovery };
}

// ---------------------------------------------------------------- material since the pin
// A workflow-file set change can move the CI cell only when a file goes away (any removal, down to
// none) or CI appears where there was none. Additions to a set that already had files arrive almost
// daily and cannot move a cell on their own: informational (census column, report), never an issue.
export const workflowsMaterial = (before, added, removed) => removed.length > 0 || (before === 0 && added.length > 0);
export function materialSincePin(r) {
  if (!r.found) return [{ kind: 'deleted', text: 'deleted or private' }];
  const m = [];
  if (r.name !== r.repo) m.push({ kind: 'renamed', text: `renamed to ${r.name}` });
  if (!r.pin_reachable) m.push({ kind: 'pin_unreachable', text: `pin not an ancestor of HEAD (${r.compare_status})` });
  if (r.archived) m.push({ kind: 'archived', text: 'archived' });
  for (const e of r.since_pin) {
    const where = e.target === r.pin ? 'the pin itself' : short(e.target);
    m.push({ kind: e.kind, text: `${e.kind} ${e.name} (${e.date.slice(0, 10)}, ${where})`, event: e });
  }
  if (r.license_changed_since_pin) m.push({ kind: 'license', text: `LICENSE text changed (SPDX now ${r.license_spdx})` });
  const a = r.workflows_added_since_pin;
  const d = r.workflows_removed_since_pin;
  if (a && d && workflowsMaterial(r.workflows.length - a.length + d.length, a, d)) m.push({ kind: 'workflows', text: `workflows +${a.length} -${d.length} (${r.workflows.length} now)` });
  return m;
}

// ---------------------------------------------------------------- diff against the previous state
function change(repo, kind, ident, title, f) {
  return {
    repo, kind, label: KINDS[kind].label, ident, title: `[watch] ${repo}: ${title}`,
    summary: f.summary, before: f.before, after: f.after, value: f.value,
    evidence: f.evidence, affects: KINDS[kind].affects, material: f.material ?? true, origin: 'previous',
  };
}
const byKey = (a, b) => cmp(a.repo, b.repo) || cmp(a.kind, b.kind) || cmp(a.ident, b.ident);
// Which new public repositories of the owner get flagged as assessment candidates (material, one
// issue each). Forks and archived repositories never do. Otherwise any one clause is enough, and each
// match is returned as a reason so the issue says why. This decides only what is flagged; screening
// is candidates/README.md. `port of` and `in rust` need word boundaries ("support of", "trust").
const PORT_WORDS = /\b(port of|rewrite of|law-proved|byte-for-byte|clean-room|in rust)\b/i;
export function candidateReasons(d) {
  if (d.fork || d.archived) return [];
  const why = [];
  if (/^franken/i.test(d.name)) why.push('the name starts with franken');
  if (/_bend$/i.test(d.name)) why.push('the name ends with _bend');
  if (d.language === 'Rust') why.push('its primary language is Rust');
  const port = PORT_WORDS.exec(d.description ?? '');
  if (port) why.push(`its description says "${port[1]}"`);
  return why;
}
export const isCandidate = (d) => candidateReasons(d).length > 0;

// Titles and evidence for the daily changes file (watch/changes/<date>.json).
const TITLE = {
  release: (tag) => `release ${tag}`,
  tag: (tag) => `tag ${tag}`,
  workflows: (added, removed, now) => `workflows +${added} -${removed} (${now} now)`,
  renamed: (name) => `renamed to ${name}`,
  deleted: 'deleted or made private',
  pinGone: (pin) => `pin ${short(pin)} no longer an ancestor of HEAD`,
};
const EVIDENCE = {
  release: (name, tag, target) => [ghUrl(name, `/releases/tag/${encodeURIComponent(tag)}`), apiUrl(`/repos/${OWNER}/${name}/releases/tags/${encodeURIComponent(tag)}`), ghUrl(name, `/commit/${target}`)],
  tag: (name, tag) => [ghUrl(name, `/tree/${encodeURIComponent(tag)}`), apiUrl(`/repos/${OWNER}/${name}/git/ref/tags/${encodeURIComponent(tag)}`)],
  workflows: (name, base, head) => [ghUrl(name, `/tree/${head}/.github/workflows`), ghUrl(name, `/compare/${base}...${head}`), ghUrl(name, '/actions')],
  pinGone: (name, pin, head) => [apiUrl(`/repos/${OWNER}/${name}/compare/${pin}...${head}`), ghUrl(name, `/commit/${pin}`)],
};
const workflowSummary = (added, removed) => `The .github/workflows file set changed: ${[...added.map((w) => `+${w}`), ...removed.map((w) => `-${w}`)].join(', ')}.`;

export function diffSnapshots(prev, cur) {
  if (!prev) return { baseline: true, material: [], informational: [], commits: { repos: 0, total: 0 } };
  const day = cur.checked_at.slice(0, 10);
  const material = [];
  const informational = [];
  const commits = { repos: 0, total: 0 };
  for (const [repo, c] of Object.entries(cur.assessed)) {
    const p = prev.assessed[repo];
    if (!p) continue; // a packet added since the previous state: its baseline is this run
    const name = c.name ?? p.name ?? repo;
    const home = ghUrl(name);
    if (p.found && !c.found) {
      material.push(change(repo, 'deleted', 'gone', TITLE.deleted, {
        summary: `${OWNER}/${p.name} is no longer readable through the API (deleted, made private, or transferred).`,
        before: `public, id ${p.id}, HEAD ${short(p.head)}`, after: 'not found', value: `gone@${day}`,
        evidence: [apiUrl(`/repositories/${p.id}`), ghUrl(p.name)],
      }));
      continue;
    }
    if (!c.found || !p.found) continue;
    if (c.name !== p.name) {
      material.push(change(repo, 'renamed', c.name, TITLE.renamed(c.name), {
        summary: `${OWNER}/${p.name} is now ${OWNER}/${c.name} (same GitHub id ${c.id}).`,
        before: p.name, after: c.name, value: `${p.name}->${c.name}`,
        evidence: [apiUrl(`/repositories/${c.id}`), home],
      }));
    }
    if (p.pin_reachable && !c.pin_reachable) {
      material.push(change(repo, 'pin_unreachable', c.pin, TITLE.pinGone(c.pin), {
        summary: `The pinned commit ${c.pin} is no longer an ancestor of the default branch (compare: ${c.compare_status}). History was rewritten or the branch reset.`,
        before: `${p.compare_status}, ${p.commits_since_pin} commits since the pin`, after: `${c.compare_status} at HEAD ${short(c.head)}`,
        value: c.compare_status,
        evidence: EVIDENCE.pinGone(name, c.pin, c.head),
      }));
    }
    if (p.archived !== c.archived) {
      const kind = c.archived ? 'archived' : 'unarchived';
      material.push(change(repo, kind, kind, kind, {
        summary: `${OWNER}/${name} was ${kind}.`, before: p.archived ? 'archived' : 'active', after: c.archived ? 'archived' : 'active',
        value: `${kind}@${day}`, evidence: [apiUrl(`/repos/${OWNER}/${name}`), home],
      }));
    }
    for (const [tag, r] of Object.entries(c.releases)) {
      const old = p.releases[tag];
      if (old && old.target === r.target) continue;
      material.push(change(repo, 'release', tag, TITLE.release(tag), {
        summary: old ? `Release ${tag} now targets a different commit.` : `New GitHub release ${tag}${r.prerelease ? ' (prerelease)' : ''}.`,
        before: old ? `release ${tag} -> ${short(old.target)}` : 'no such release',
        after: `release ${tag} -> ${short(r.target)}, published ${r.published_at ?? 'unknown'}`,
        value: r.target ?? 'none',
        evidence: EVIDENCE.release(name, tag, r.target),
      }));
    }
    for (const [tag, old] of Object.entries(p.releases)) {
      if (c.releases[tag]) continue;
      material.push(change(repo, 'release', `${tag}-removed`, `release ${tag} removed`, {
        summary: `GitHub release ${tag} is no longer listed.`, before: `release ${tag} -> ${short(old.target)}`, after: 'not listed',
        value: 'removed', evidence: [apiUrl(`/repos/${OWNER}/${name}/releases`), ghUrl(name, '/releases')],
      }));
    }
    for (const [tag, t] of Object.entries(c.tags)) {
      const old = p.tags[tag];
      if (c.releases[tag] && !p.releases[tag]) continue; // reported as the release
      if (old && old.target === t.target) continue;
      material.push(change(repo, 'tag', tag, TITLE.tag(tag), {
        summary: old ? `Tag ${tag} was moved to another commit.` : `New tag ${tag} (no GitHub release for it at this check).`,
        before: old ? `tag ${tag} -> ${short(old.target)}` : 'no such tag', after: `tag ${tag} -> ${short(t.target)} (${t.date ?? 'undated'})`,
        value: t.target ?? 'none',
        evidence: EVIDENCE.tag(name, tag),
      }));
    }
    if (c.license_spdx !== p.license_spdx || licenseKey(c.license_files) !== licenseKey(p.license_files)) {
      const spdxMoved = c.license_spdx !== p.license_spdx;
      const files = licenseText(c.license_files);
      material.push(change(repo, 'license', digest(licenseKey(c.license_files)), spdxMoved ? `license ${p.license_spdx} -> ${c.license_spdx} (${files})` : `LICENSE text changed, SPDX still ${c.license_spdx} (${files})`, {
        summary: spdxMoved ? `GitHub's detected license moved from ${p.license_spdx} to ${c.license_spdx}.` : `The license file changed while the detected SPDX id stayed ${c.license_spdx}. A rider lives in the text, so read the diff.`,
        before: `${p.license_spdx}; ${licenseText(p.license_files)}`, after: `${c.license_spdx}; ${files}`,
        value: `${c.license_spdx}|${licenseKey(c.license_files)}`,
        evidence: [
          ...c.license_files.map((f) => ghUrl(name, `/blob/${c.head}/${f.name}`)),
          ghUrl(name, `/compare/${p.head}...${c.head}`), apiUrl(`/repos/${OWNER}/${name}/license`),
        ],
      }));
    }
    const added = c.workflows.filter((w) => !p.workflows.includes(w));
    const removed = p.workflows.filter((w) => !c.workflows.includes(w));
    if (added.length || removed.length) {
      const mat = workflowsMaterial(p.workflows.length, added, removed);
      (mat ? material : informational).push(change(repo, 'workflows', digest(c.workflows), TITLE.workflows(added.length, removed.length, c.workflows.length), {
        summary: workflowSummary(added, removed),
        before: `${p.workflows.length} files at ${short(p.head)}`, after: `${c.workflows.length} files at ${short(c.head)}`,
        value: digest(c.workflows),
        evidence: EVIDENCE.workflows(name, p.head, c.head), material: mat,
      }));
    }
    if (c.commits_since_pin != null && p.commits_since_pin != null && c.commits_since_pin > p.commits_since_pin) {
      commits.repos++;
      commits.total += c.commits_since_pin - p.commits_since_pin;
    }
  }
  // Public repositories outside the assessed set.
  const assessedIds = new Set([...Object.values(cur.assessed), ...Object.values(prev.assessed)].map((r) => r.id).filter((x) => x != null));
  const prevById = new Map(prev.discovery.map((d) => [d.id, d]));
  const curById = new Map(cur.discovery.map((d) => [d.id, d]));
  for (const d of cur.discovery) {
    if (assessedIds.has(d.id)) continue;
    const o = prevById.get(d.id);
    const evidence = [apiUrl(`/repositories/${d.id}`), ghUrl(d.name)];
    if (!o) {
      const why = candidateReasons(d);
      const cand = why.length > 0;
      (cand ? material : informational).push(change(d.name, 'new_repo', String(d.id), 'new public repo', {
        summary: `New public repository ${OWNER}/${d.name} (${d.language ?? 'no primary language'}${d.fork ? ', fork' : ''}${d.archived ? ', archived' : ''}, created ${d.created_at?.slice(0, 10)}${d.description ? `; description: "${d.description}"` : ''}). ${cand ? `Assessment candidate: ${why.join('; ')}.` : `Informational: ${d.fork ? 'a fork' : d.archived ? 'archived' : 'no candidate clause matched (franken name, _bend name, Rust, or port-like description)'}.`}`,
        before: 'not listed', after: `public, id ${d.id}`, value: String(d.id), evidence, material: cand,
      }));
      continue;
    }
    if (o.name !== d.name) {
      informational.push(change(d.name, 'renamed', d.name, `renamed from ${o.name}`, {
        summary: `${OWNER}/${o.name} is now ${OWNER}/${d.name} (same id).`, before: o.name, after: d.name, value: `${o.name}->${d.name}`, evidence, material: false,
      }));
    }
    if (o.archived !== d.archived) {
      const kind = d.archived ? 'archived' : 'unarchived';
      informational.push(change(d.name, kind, kind, kind, {
        summary: `${OWNER}/${d.name} was ${kind}.`, before: o.archived ? 'archived' : 'active', after: d.archived ? 'archived' : 'active', value: `${kind}@${day}`, evidence, material: false,
      }));
    }
  }
  for (const o of prev.discovery) {
    if (assessedIds.has(o.id) || curById.has(o.id)) continue;
    informational.push(change(o.name, 'deleted', 'gone', 'deleted or made private', {
      summary: `${OWNER}/${o.name} is no longer in the public listing.`, before: `public, id ${o.id}`, after: 'not listed', value: `gone@${day}`,
      evidence: [apiUrl(`/repositories/${o.id}`)], material: false,
    }));
  }
  return { baseline: false, material: material.sort(byKey), informational: informational.sort(byKey), commits };
}

// ---------------------------------------------------------------- outputs
const CENSUS_COLUMNS = ['repo', 'pin', 'head', 'head_date', 'commits_since_pin', 'releases_since_pin', 'license_spdx',
  'license_changed_since_pin', 'workflows_count', 'workflows_changed_since_pin', 'archived', 'material_since_pin'];
const yn = (v) => (v == null ? 'unknown' : v ? 'yes' : 'no');
export function renderCensus(snap) {
  const day = snap.checked_at.slice(0, 10);
  const rows = Object.values(snap.assessed).sort((a, b) => cmp(a.repo, b.repo)).map((r) => {
    const m = materialSincePin(r);
    const mat = m.length ? `yes: ${m.map((x) => x.text).join('; ')}` : 'no';
    if (!r.found) return [r.repo, r.pin, '-', '-', '-', '-', '-', 'unknown', '-', 'unknown', '-', mat];
    const a = r.workflows_added_since_pin;
    const d = r.workflows_removed_since_pin;
    return [
      r.repo, r.pin, r.head ?? '-', r.head_date ?? '-', r.commits_since_pin ?? '-',
      r.since_pin.length ? r.since_pin.map((e) => (e.kind === 'tag' ? `tag:${e.name}` : e.name)).join(',') : 'none',
      r.license_spdx, yn(r.license_changed_since_pin), r.workflows.length,
      a && d ? (a.length || d.length ? `+${a.length} -${d.length}` : 'no') : 'unknown',
      r.archived ? 'yes' : 'no', mat,
    ];
  });
  return [
    `# Franken Research daily watch census, ${day} (UTC). GitHub API only; written by watch/watch.mjs --apply. Do not edit by hand.`,
    '# Pins come from packets/*-assessment.md and are never edited. material_since_pin flags events that could move a master-matrix cell (release or tag dated after the pin, LICENSE text or SPDX, workflow file set, archived, renamed, deleted, pin no longer an ancestor of HEAD). Commits alone never do. Triage follows updates/METHOD.md.',
    CENSUS_COLUMNS.join('\t'),
    ...rows.map((r) => r.map((v) => String(v).replace(/[\t\n]/g, ' ')).join('\t')),
  ].join('\n') + '\n';
}

function renderChanges(snap, diff, existing) {
  const strip = (c) => ({ repo: c.repo, kind: c.kind, label: c.label, ident: c.ident, title: c.title, summary: c.summary, before: c.before, after: c.after, value: c.value, affects: c.affects, evidence: c.evidence });
  const merge = (old, add) => {
    const m = new Map((old ?? []).map((c) => [`${c.repo}|${c.kind}|${c.ident}`, c]));
    for (const c of add) m.set(`${c.repo}|${c.kind}|${c.ident}`, strip(c));
    return [...m.values()].sort(byKey);
  };
  // A second run on the same UTC day diffs against the first; merge so the day keeps every change.
  return {
    date: snap.checked_at.slice(0, 10),
    since: existing ? existing.since : snap.previous_checked_at,
    baseline: existing ? existing.baseline && diff.baseline : diff.baseline,
    material: merge(existing?.material, diff.material),
    informational: merge(existing?.informational, diff.informational),
  };
}

// watch/latest.json: the small summary the site reads at view time (site/assets/live-watch.js).
// Every count comes from the same snapshot as the census; key order is fixed here, not sorted.
export const movedSincePin = (found) => found.filter((r) => (r.commits_since_pin ?? 0) > 0 || r.head !== r.pin).length;
export const commitsSincePin = (found) => found.reduce((s, r) => s + (r.commits_since_pin ?? 0), 0);
export function renderLatest(snap, changes) {
  const day = snap.checked_at.slice(0, 10);
  const recs = Object.values(snap.assessed);
  const found = recs.filter((r) => r.found);
  const newRepos = [...changes.material, ...changes.informational].filter((c) => c.kind === 'new_repo').map((c) => c.repo);
  return JSON.stringify({
    schema: 1,
    checked_at: snap.checked_at,
    previous_checked_at: snap.previous_checked_at,
    assessed: recs.length,
    found: found.length,
    moved_since_pin: movedSincePin(found),
    commits_since_pin_total: commitsSincePin(found),
    material_since_pin_count: recs.reduce((s, r) => s + materialSincePin(r).length, 0),
    material_new_today_count: changes.material.length,
    public_repos: snap.discovery.length,
    new_public_repos_today: [...new Set(newRepos)].sort(cmp),
    census_path: `watch/census/${day}.tsv`,
    changes_path: `watch/changes/${day}.json`,
  }, null, 2) + '\n';
}

// fresh: { liveText, ledgerText, prevLedger } from freshnessStep. The ledger is written only when it
// starts with the previous one byte for byte (FR-G.3); live.json only under its size budget (FR-L.2).
function writeOutputs(snap, diff, fresh) {
  const day = snap.checked_at.slice(0, 10);
  assertLedgerPrefix(fresh.prevLedger, fresh.ledgerText);
  if (Buffer.byteLength(fresh.liveText) >= MAX_BYTES) throw usageError(`watch/live.json would be ${Buffer.byteLength(fresh.liveText)} bytes; FR-L.2 allows under ${MAX_BYTES}`);
  const files = {
    [join(WATCH_DIR, 'state.json')]: toJson(snap),
    [join(WATCH_DIR, 'census', `${day}.tsv`)]: renderCensus(snap),
    [join(WATCH_DIR, 'live.json')]: fresh.liveText,
    [join(WATCH_DIR, 'crossings.jsonl')]: fresh.ledgerText,
  };
  const changesFile = join(WATCH_DIR, 'changes', `${day}.json`);
  const existing = existsSync(changesFile) ? JSON.parse(readFileSync(changesFile, 'utf8')) : null;
  const changes = renderChanges(snap, diff, existing);
  files[changesFile] = toJson(changes);
  files[join(WATCH_DIR, 'latest.json')] = renderLatest(snap, changes);
  for (const f of Object.keys(files)) mkdirSync(dirname(f), { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(`${f}.tmp`, body);
  for (const f of Object.keys(files)) renameSync(`${f}.tmp`, f);
  return { files: Object.keys(files).map((f) => f.slice(ROOT.length + 1)), material: changes.material.length };
}

// ---------------------------------------------------------------- issue text helpers
// Per-event issues for assessed repositories are retired (watch/freshness/SPEC.md FR-D.4): the run
// keeps one dashboard issue (watch/freshness/dashboard.mjs), which uses these.
// GitHub issue text is Markdown: escape table pipes, emphasis, links, HTML, mentions, references,
// and math in anything that came from an upstream repository (tag, release, file names).
export const mdText = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').replace(/[\\`*_{}[\]<>()#+!|~&@$]/g, '\\$&');
// The login the token acts as: the Actions token cannot read GET /user, and posts as github-actions[bot].
export async function botLogin(api, env = process.env) {
  if (env.GITHUB_ACTIONS === 'true') return 'github-actions[bot]';
  const login = (await api.rest('GET', '/user')).body?.login;
  if (typeof login !== 'string' || !login) throw apiError('GET /user returned no login; cannot tell our issues from anyone else\'s');
  return login;
}

// ---------------------------------------------------------------- freshness (watch/freshness/SPEC.md)
// Cohort matrices (FR-O.3): cohorts/<name>/matrix.md, in the master matrix's columns, lists the
// cohort's repositories; each one's pin comes from cohorts/<name>/<repo>-assessment.md, parsed like
// the 44 packets. The verdict date is the first YYYY-MM-DD in the matrix file.
export function parseCohorts(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name, 'matrix.md');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const rows = parseMatrix(text);
    const verdictDate = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? null;
    for (const repo of Object.keys(rows).sort()) {
      const packet = join(dir, name, `${repo}-assessment.md`);
      if (!existsSync(packet)) throw usageError(`cohort ${name}: matrix lists ${repo} but ${packet.slice(dir.length + 1)} does not exist`);
      const parsed = parsePacketText(readFileSync(packet, 'utf8'), `${repo}-assessment.md`);
      if (parsed.problem) throw usageError(`cohort ${name}: ${parsed.problem}`);
      out.push({ repo, pin: parsed.pin, packet: `cohorts/${name}/${repo}-assessment.md`, set: `cohort:${name}`, matrixRow: rows[repo], verdictDate });
    }
  }
  return out;
}

function readFreshInputs(root) {
  const fresh = join(root, 'watch', 'freshness');
  const updates = join(root, 'updates');
  const recheckFiles = existsSync(updates) ? readdirSync(updates).filter((f) => /-\d{4}-\d{2}-\d{2}\.md$/.test(f)).map((file) => ({ file, text: readFileSync(join(updates, file), 'utf8') })) : [];
  const live = join(root, 'watch', 'live.json');
  const ledger = join(root, 'watch', 'crossings.jsonl');
  return {
    rechecks: latestRechecks(recheckFiles),
    privateCi: parsePrivateCi(readFileSync(join(fresh, 'private-ci.tsv'), 'utf8')),
    revisitRows: parseRevisit(readFileSync(join(fresh, 'revisit.tsv'), 'utf8')),
    prevLive: existsSync(live) ? JSON.parse(readFileSync(live, 'utf8')) : null,
    prevLedger: existsSync(ledger) ? readFileSync(ledger, 'utf8') : '',
  };
}

// Gather the freshness facts (re-check pins and dependency.edge lockfiles included), compute
// live.json and the next ledger, and keep the blob-summary and runs cache in the state.
async function freshnessStep(api, snap, diff, watched, prev, root = ROOT) {
  const inputs = readFreshInputs(root);
  const extra = Object.fromEntries(Object.values(inputs.rechecks).map((r) => [r.repo, [{ key: 'recheck', sha: r.sha }]]));
  const lockfiles = new Set(inputs.revisitRows.filter((r) => r.detector === 'dependency.edge').map((r) => r.repo));
  const got = await gatherFreshness(api, snap, { cache: prev?.freshness ?? null, extra, lockfiles });
  snap.freshness = got.cache;
  const assessedIds = new Set(Object.values(snap.assessed).map((r) => r.id).filter((x) => x != null));
  const candidates = snap.discovery.filter((d) => !assessedIds.has(d.id) && d.created_at >= `${ASSESSMENT_DATE}T00:00:00Z` && isCandidate(d))
    .map((d) => ({ repo: d.name, created_at: d.created_at, reasons: candidateReasons(d) }));
  const recs = Object.values(snap.assessed);
  const out = computeFreshness({
    records: got.records, summaries: got.cache.summaries, watched, ...inputs, candidates, checkedAt: snap.checked_at,
    informational: { events_today: diff.material.length + diff.informational.length, events_since_pin: recs.reduce((s, r) => s + materialSincePin(r).length, 0) },
  });
  return { live: out.live, liveText: renderLiveJson(out.live), ledgerText: out.ledgerText, prevLedger: inputs.prevLedger, events: out.events, blobsFetched: got.fetched.blobs };
}

// ---------------------------------------------------------------- report
function buildReport(snap, diff, prev, opts, api, elapsedMs) {
  const recs = Object.values(snap.assessed);
  const found = recs.filter((r) => r.found);
  const perRepo = recs.map((r) => ({ repo: r.repo, events: materialSincePin(r) })).filter((x) => x.events.length);
  // Workflow files added since the pin to a set that already had some: informational, still reported.
  const wfAdded = found.filter((r) => r.workflows_added_since_pin?.length && !materialSincePin(r).some((e) => e.kind === 'workflows'))
    .map((r) => ({ repo: r.repo, added: r.workflows_added_since_pin.length, now: r.workflows.length }));
  const assessedIds = new Set(found.map((r) => r.id));
  const newSincePin = snap.discovery.filter((d) => !assessedIds.has(d.id) && d.created_at >= `${ASSESSMENT_DATE}T00:00:00Z`)
    .map((d) => ({ name: d.name, language: d.language, created_at: d.created_at, candidate: isCandidate(d), reasons: candidateReasons(d) }));
  return {
    owner: OWNER,
    checked_at: snap.checked_at,
    previous_checked_at: prev?.checked_at ?? null,
    mode: opts.apply ? 'apply' : 'dry',
    assessed: {
      checked: recs.length,
      found: found.length,
      renamed: found.filter((r) => r.name !== r.repo).length,
      deleted_or_private: recs.length - found.length,
      pin_unreachable: found.filter((r) => !r.pin_reachable).length,
      archived: found.filter((r) => r.archived).length,
      moved_since_pin: movedSincePin(found),
      commits_since_pin_total: commitsSincePin(found),
    },
    discovered: {
      public_repos: snap.discovery.length,
      not_assessed: snap.discovery.filter((d) => !assessedIds.has(d.id)).length,
      forks: snap.discovery.filter((d) => d.fork).length,
      archived: snap.discovery.filter((d) => d.archived).length,
      created_since_assessment: newSincePin,
    },
    material_since_pin: { events: perRepo.reduce((s, x) => s + x.events.length, 0), repos: perRepo.length, by_repo: perRepo },
    workflow_additions_since_pin: wfAdded,
    since_previous: {
      baseline: diff.baseline,
      material: diff.material.map((c) => ({ title: c.title, kind: c.kind, evidence: c.evidence[0] })),
      informational: diff.informational.map((c) => ({ title: c.title, kind: c.kind })),
      commits: diff.commits,
    },
    api: { ...api.stats, elapsed_s: Math.round(elapsedMs / 100) / 10 },
  };
}

function printReport(rep) {
  const L = [];
  const a = rep.assessed;
  L.push(`watch: ${rep.owner}, checked ${rep.checked_at} (${rep.mode === 'apply' ? 'apply' : 'no files written'})`);
  L.push(`previous state: ${rep.previous_checked_at ?? 'none (first run: this run is the baseline)'}`);
  L.push(`assessed repos checked: ${a.checked} (found ${a.found}, renamed ${a.renamed}, deleted or private ${a.deleted_or_private}, pin unreachable ${a.pin_unreachable}, archived ${a.archived})`);
  L.push(`public repos discovered: ${rep.discovered.public_repos} (not assessed ${rep.discovered.not_assessed}, forks ${rep.discovered.forks}, archived ${rep.discovered.archived})`);
  L.push(`moved since pin: ${a.moved_since_pin} of ${a.found} (${a.commits_since_pin_total} commits; commits alone are informational)`);
  L.push(`material since pin: ${rep.material_since_pin.events} event(s) in ${rep.material_since_pin.repos} repo(s)`);
  for (const x of rep.material_since_pin.by_repo) for (const e of x.events) L.push(`  ${x.repo}: ${e.text}`);
  const wa = rep.workflow_additions_since_pin;
  L.push(`workflow files added since pin (informational: additions to an existing set): ${wa.length} repo(s)${wa.length ? `: ${wa.map((x) => `${x.repo} +${x.added} (${x.now} now)`).join(', ')}` : ''}`);
  const ns = rep.discovered.created_since_assessment;
  L.push(`public repos created since ${ASSESSMENT_DATE}, not assessed: ${ns.length}`);
  for (const d of ns) L.push(`  ${d.name} (${d.language ?? 'no language'}, created ${d.created_at.slice(0, 10)}): ${d.candidate ? `assessment candidate (${d.reasons.join('; ')})` : 'informational'}`);
  const sp = rep.since_previous;
  if (sp.baseline) L.push('material since previous state: baseline (first run; nothing to compare)');
  else {
    L.push(`material since previous state: ${sp.material.length}`);
    for (const c of sp.material) L.push(`  ${c.title}  ${c.evidence}`);
    L.push(`informational since previous state: ${sp.informational.length}; ${sp.commits.total} new commits in ${sp.commits.repos} assessed repo(s)`);
    for (const c of sp.informational) L.push(`  ${c.title}`);
  }
  const s = rep.api;
  L.push(`api: ${s.graphql_calls} GraphQL calls (cost ${s.graphql_cost}, ${s.graphql_remaining ?? '?'} left), ${s.rest_calls} REST calls (${s.rest_remaining ?? '?'} left); ${s.elapsed_s} s`);
  if (rep.wrote) L.push(`wrote: ${rep.wrote.files.join(', ')} (${rep.wrote.material} material today)`);
  if (rep.freshness) {
    const f = rep.freshness;
    const t = f.totals;
    L.push(`freshness: ${t.repos} repos (${t.pinned} pinned, ${t.cohort} cohort): ${t.current} current, ${t.changed} changed, ${t.due} due, ${t.unknown} unknown; live.json ${f.bytes} bytes; ${f.blobs_fetched} blob(s) parsed`);
    L.push(`crossings open: ${f.open.length}${f.open.length ? `: ${f.open.join(', ')}` : ''}; pending (seen once): ${f.pending.length}${f.pending.length ? `: ${f.pending.join(', ')}` : ''}`);
    L.push(`ledger events this run: ${f.events.length}${f.events.length ? `: ${f.events.map((e) => `${e.event} ${e.id}`).join(', ')}` : ''}`);
  }
  if (rep.dashboard) L.push(`dashboard: ${rep.dashboard.action} #${rep.dashboard.number}${rep.dashboard.ignored.length ? `; ignored same-title issues ${rep.dashboard.ignored.map((n) => `#${n}`).join(', ')}` : ''}`);
  console.log(L.join('\n'));
}

// ---------------------------------------------------------------- selftest (offline)
// In-memory stand-in for the GitHub issues and labels endpoints the dashboard calls. Everything the
// token posts is authored by `login`; tests add other authors' issues and comments directly.
export function memoryIssues(login = 'github-actions[bot]') {
  const issues = [];
  const labels = new Set();
  const comments = new Map();
  const api = {
    stats: {},
    async rest(method, path, payload) {
      const p = path.replace(`/repos/${ISSUE_REPO}`, '').replace(/\?.*$/, '');
      const page = Number(path.match(/[?&]page=(\d+)/)?.[1] ?? 1);
      if (method === 'GET' && p === '/labels') return { status: 200, body: page === 1 ? [...labels].map((name) => ({ name })) : [] };
      if (method === 'POST' && p === '/labels') { labels.add(payload.name); return { status: 201, body: payload }; }
      if (method === 'GET' && p === '/issues') return { status: 200, body: page === 1 ? issues.map((i) => ({ ...i })) : [] };
      if (method === 'POST' && p === '/issues') {
        const i = { number: issues.length + 1, title: payload.title, body: payload.body, labels: payload.labels.map((name) => ({ name })), user: { login }, state: 'open', html_url: `memory:issues/${issues.length + 1}` };
        issues.push(i);
        comments.set(i.number, []);
        return { status: 201, body: { ...i } };
      }
      const m = p.match(/^\/issues\/(\d+)\/comments$/);
      if (m && method === 'GET') return { status: 200, body: [...comments.get(Number(m[1]))] };
      if (m && method === 'POST') { const c = { body: payload.body, user: { login } }; comments.get(Number(m[1])).push(c); return { status: 201, body: { ...c } }; }
      const one = p.match(/^\/issues\/(\d+)$/);
      if (one && method === 'PATCH') {
        const i = issues.find((x) => x.number === Number(one[1]));
        if (!i) throw new Error(`memory issues: no issue ${one[1]}`);
        for (const k of ['title', 'body', 'state']) if (payload[k] !== undefined) i[k] = payload[k];
        return { status: 200, body: { ...i } };
      }
      throw new Error(`memory issues: unexpected ${method} ${path}`);
    },
  };
  const add = (issue, cs = []) => { const i = { number: issues.length + 1, state: 'open', html_url: `memory:issues/${issues.length + 1}`, ...issue }; issues.push(i); comments.set(i.number, cs); return i; };
  return { api, issues, labels, comments, add, login };
}

async function selftest() {
  const fxDir = join(WATCH_DIR, 'fixtures');
  const load = (f) => JSON.parse(readFileSync(join(fxDir, f), 'utf8'));
  const day1 = load('day1.json');
  const day2 = load('day2.json');
  const s1 = await collect(fixtureSource(day1), day1.assessed, null, '2026-09-24T12:00:00Z');
  // Without redirects, so the rename can only be followed through the GitHub id recorded on day 1.
  const s2 = await collect(fixtureSource({ ...day2, redirects: {} }), day2.assessed, s1, '2026-09-25T12:00:00Z');
  const d = diffSnapshots(s1, s2);
  const mat = (repo, kind) => d.material.filter((c) => c.repo === repo && c.kind === kind);
  const any = (repo) => [...d.material, ...d.informational].filter((c) => c.repo === repo);
  const cases = [];
  const test = (name, fn) => cases.push({ name, fn });
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

  test('packets: exactly 44 assessed repos, each with one 40-hex pin', () => {
    const p = parsePackets(PACKETS_DIR);
    expect(p.length === 44, `parsed ${p.length}`);
    expect(p.every((x) => /^[0-9a-f]{40}$/.test(x.pin)), 'a pin is not 40 hex');
  });
  test('first run is a baseline with nothing material since the previous state', () => {
    const b = diffSnapshots(null, s1);
    expect(b.baseline === true && b.material.length === 0, `baseline=${b.baseline} material=${b.material.length}`);
  });
  test('new release is material', () => {
    const m = mat('franken_code_browser', 'release');
    expect(m.length === 1 && m[0].ident === 'v0.1.1', `got ${JSON.stringify(m.map((c) => c.title))}`);
    expect(m[0].title === '[watch] franken_code_browser: release v0.1.1', `title ${m[0].title}`);
    expect(mat('franken_code_browser', 'tag').length === 0, 'the release tag was reported twice');
  });
  test('LICENSE blob change with the same SPDX is material', () => {
    const m = mat('franken_markdown', 'license');
    expect(m.length === 1, `got ${m.length}`);
    expect(s1.assessed.franken_markdown.license_spdx === s2.assessed.franken_markdown.license_spdx, 'fixture SPDX differs');
    expect(/SPDX still/.test(m[0].title), `title ${m[0].title}`);
  });
  test('workflow removal is material', () => {
    const m = mat('franken_agent_detection', 'workflows');
    expect(m.length === 1 && / -1 /.test(m[0].title), `got ${JSON.stringify(m.map((c) => c.title))}`);
  });
  // Variants of the day-1 snapshot with one repository's workflow set replaced (now, and at the pin).
  const wfSnap = (now, atPin) => {
    const s = JSON.parse(JSON.stringify(s1));
    const r = s.assessed.frankenlibc;
    r.workflows = [...now].sort(cmp);
    r.workflows_added_since_pin = r.workflows.filter((w) => !atPin.includes(w));
    r.workflows_removed_since_pin = atPin.filter((w) => !r.workflows.includes(w));
    return s;
  };
  const wfBase = s1.assessed.frankenlibc.workflows;
  const wfDaily = (prev, cur) => {
    const x = diffSnapshots(prev, cur);
    return { m: x.material.filter((c) => c.kind === 'workflows').map((c) => c.title), i: x.informational.filter((c) => c.kind === 'workflows').map((c) => c.title) };
  };
  const wfPin = (snap) => ({
    material: materialSincePin(snap.assessed.frankenlibc).filter((e) => e.kind === 'workflows').map((e) => e.text),
  });
  test('workflow additions to a set that already had files are informational, daily and since the pin', () => {
    expect(wfBase.length > 0, 'fixture frankenlibc has no workflows');
    const cur = wfSnap([...wfBase, 'zz-added.yml'], wfBase);
    const d1 = wfDaily(s1, cur);
    expect(d1.m.length === 0 && d1.i.length === 1 && d1.i[0] === `[watch] frankenlibc: workflows +1 -0 (${wfBase.length + 1} now)`, `daily ${JSON.stringify(d1)}`);
    const p = wfPin(cur);
    expect(p.material.length === 0, `since pin ${JSON.stringify(p)}`);
    // The recorded fixture itself: frankenlibc added 7 files to the 2 it had at the pin.
    expect(JSON.stringify(wfPin(s1)) === '{"material":[]}', `recorded frankenlibc ${JSON.stringify(wfPin(s1))}`);
    const row = renderCensus(s1).split('\n').find((ln) => ln.startsWith('frankenlibc\t')).split('\t');
    expect(row[CENSUS_COLUMNS.indexOf('workflows_changed_since_pin')] === '+7 -0', `census still lists the additions: ${row}`);
  });
  test('one workflow removal is material, daily and since the pin, even with additions', () => {
    const now = [...wfBase.slice(1), 'zz-added.yml'];
    const cur = wfSnap(now, wfBase);
    const title = `[watch] frankenlibc: workflows +1 -1 (${wfBase.length} now)`;
    const d1 = wfDaily(s1, cur);
    expect(d1.m.length === 1 && d1.m[0] === title && d1.i.length === 0, `daily ${JSON.stringify(d1)}`);
    const p = wfPin(cur);
    expect(p.material.length === 1 && p.material[0] === `workflows +1 -1 (${wfBase.length} now)`, `since pin ${JSON.stringify(p)}`);
    const gone = wfDaily(s1, wfSnap([], wfBase));
    expect(gone.m.length === 1 && gone.m[0] === `[watch] frankenlibc: workflows +0 -${wfBase.length} (0 now)`, `non-empty to empty ${JSON.stringify(gone)}`);
  });
  test('workflows appearing where there were none is material, daily and since the pin', () => {
    const cur = wfSnap(['ci.yml'], []);
    const title = '[watch] frankenlibc: workflows +1 -0 (1 now)';
    const d1 = wfDaily(wfSnap([], []), cur);
    expect(d1.m.length === 1 && d1.m[0] === title && d1.i.length === 0, `daily ${JSON.stringify(d1)}`);
    const p = wfPin(cur);
    expect(p.material.length === 1 && p.material[0] === 'workflows +1 -0 (1 now)', `since pin ${JSON.stringify(p)}`);
  });
  test('commits-only change is not material', () => {
    const before = s1.assessed.franken_alignment;
    const after = s2.assessed.franken_alignment;
    expect(after.commits_since_pin > before.commits_since_pin && after.head !== before.head, 'fixture has no new commits');
    expect(any('franken_alignment').length === 0, `got ${JSON.stringify(any('franken_alignment').map((c) => c.title))}`);
    expect(d.commits.repos >= 1, 'commit volume not counted as informational');
  });
  test('rename (same id, new name) is a rename, not delete plus new', () => {
    const m = mat('frankenlibc', 'renamed');
    expect(m.length === 1 && m[0].ident === 'frankenlibc_ng', `got ${JSON.stringify(m.map((c) => c.title))}`);
    expect(mat('frankenlibc', 'deleted').length === 0 && any('frankenlibc_ng').length === 0, 'rename also reported as delete or new');
    expect(s2.assessed.frankenlibc.found && s2.assessed.frankenlibc.name === 'frankenlibc_ng', 'renamed repo not followed');
    const r = d.informational.filter((c) => c.kind === 'renamed');
    expect(r.length === 1 && r[0].repo === 'acip_tools', `unassessed rename: ${JSON.stringify(r.map((c) => c.title))}`);
    const acip = [...d.material, ...d.informational].filter((c) => c.repo === 'acip' || c.repo === 'acip_tools');
    expect(acip.length === 1, `unassessed rename also reported as: ${JSON.stringify(acip.map((c) => c.title))}`);
  });
  test('rename is followed by REST redirect when no id is recorded yet', async () => {
    const fresh = await collect(fixtureSource(day2), day2.assessed, null, '2026-09-25T12:00:00Z');
    expect(fresh.assessed.frankenlibc.found && fresh.assessed.frankenlibc.name === 'frankenlibc_ng', 'redirect not followed');
  });
  test('pin 404 is pin_unreachable', () => {
    const m = mat('franken_node', 'pin_unreachable');
    expect(m.length === 1, `got ${m.length}`);
    expect(s2.assessed.franken_node.pin_reachable === false && s2.assessed.franken_node.compare_status === 'not_found', 'status not recorded');
    expect(materialSincePin(s2.assessed.franken_node).some((e) => e.kind === 'pin_unreachable'), 'not material since the pin');
  });
  test('new franken or Rust repo is a candidate; anything else is informational', () => {
    expect(mat('franken_newthing', 'new_repo').length === 1, 'franken repo not material');
    const inf = d.informational.filter((c) => c.kind === 'new_repo').map((c) => c.repo);
    expect(inf.length === 1 && inf[0] === 'dotfiles_extra', `informational new repos: ${inf}`);
  });
  test('new-repo candidates: _bend ports and port-like descriptions are flagged with the clause named; forks, archived, and plain repos are not', () => {
    const repo = (id, name, language, description, extra = {}) => ({ id, name, description, archived: false, fork: false, language,
      created_at: '2026-09-25T00:00:00Z', pushed_at: '2026-09-25T00:00:00Z', ...extra });
    const added = [
      repo(990001, 'beads_bend', 'Shell', 'A law-proved port of br'),
      repo(990002, 'toon_bend', 'Python', 'Byte-for-byte port of the toon CLI'),
      repo(990003, 'notes', 'Python', 'my notes'),
      repo(990004, 'franken_x', 'Rust', 'A clean-room rewrite of x', { fork: true }),
      repo(990005, 'franken_y', 'Rust', null, { archived: true }),
      repo(990006, 'helpers', 'Go', 'Some support of transport of data'),
      repo(990007, 'mytool', 'Go', 'A clean-room rewrite of grep'),
      repo(990008, 'lonely_bend', 'Shell', null),
    ];
    const cur = { ...JSON.parse(JSON.stringify(s1)), checked_at: '2026-09-25T12:00:00Z', previous_checked_at: s1.checked_at };
    cur.discovery = [...cur.discovery, ...added].sort((a, b) => cmp(a.name, b.name));
    const x = diffSnapshots(s1, cur);
    const flagged = x.material.filter((c) => c.kind === 'new_repo').map((c) => c.repo).sort();
    expect(flagged.join() === 'beads_bend,lonely_bend,mytool,toon_bend', `flagged ${flagged}`);
    const quiet = x.informational.filter((c) => c.kind === 'new_repo').map((c) => c.repo).sort();
    expect(quiet.join() === 'franken_x,franken_y,helpers,notes', `informational ${quiet}`);
    const why = (name) => candidateReasons(added.find((d) => d.name === name)).join('; ');
    expect(why('beads_bend') === 'the name ends with _bend; its description says "law-proved"', `beads_bend: ${why('beads_bend')}`);
    expect(why('toon_bend') === 'the name ends with _bend; its description says "Byte-for-byte"', `toon_bend: ${why('toon_bend')}`);
    expect(why('lonely_bend') === 'the name ends with _bend' && why('mytool') === 'its description says "clean-room"', `single clauses: ${why('lonely_bend')} | ${why('mytool')}`);
    const ch = x.material.find((c) => c.repo === 'beads_bend');
    expect(ch.summary.includes('Assessment candidate: the name ends with _bend; its description says "law-proved".'), `summary ${ch.summary}`);
    expect(x.informational.find((c) => c.repo === 'franken_x').summary.includes('Informational: a fork.'), 'fork reason missing');
  });
  test('nothing else is material', () => {
    const titles = d.material.map((c) => c.title).sort();
    expect(titles.length === 6, `material: ${JSON.stringify(titles)}`);
  });
  test('upstream tag names with table and comment syntax reach the changes file intact', () => {
    const cur = JSON.parse(JSON.stringify(s2));
    const sha = 'a'.repeat(40);
    for (const t of ['v1|cell', 'v2-->x']) cur.assessed.franken_alignment.tags[t] = { target: sha, date: '2026-09-25T00:00:00Z' };
    const tags = diffSnapshots(s1, cur).material.filter((c) => c.repo === 'franken_alignment' && c.kind === 'tag');
    const pipe = tags.find((c) => c.ident === 'v1|cell');
    const arrow = tags.find((c) => c.ident === 'v2-->x');
    expect(pipe && arrow && /v1\|cell/.test(pipe.after) && /v2-->x/.test(arrow.after), `tag changes ${JSON.stringify(tags.map((c) => c.title))}`);
  });
  test('outputs are deterministic regardless of API node order', async () => {
    const shuffled = { ...day1, discovery: [...day1.discovery].reverse() };
    const again = await collect(fixtureSource(shuffled), [...day1.assessed].reverse(), null, s1.checked_at);
    expect(toJson(again) === toJson(s1), 'state differs');
    expect(renderCensus(again) === renderCensus(s1), 'census differs');
  });

  test('latest.json counts match the census rendered from the same state', () => {
    const latestOf = (snap, diff) => renderLatest(snap, renderChanges(snap, diff, null));
    const text = latestOf(s2, d);
    const l = JSON.parse(text);
    const keys = ['schema', 'checked_at', 'previous_checked_at', 'assessed', 'found', 'moved_since_pin', 'commits_since_pin_total',
      'material_since_pin_count', 'material_new_today_count', 'public_repos', 'new_public_repos_today', 'census_path', 'changes_path'];
    expect(JSON.stringify(Object.keys(l)) === JSON.stringify(keys), `keys ${Object.keys(l)}`);
    expect(Buffer.byteLength(text) < 2048, `${Buffer.byteLength(text)} bytes`);
    const col = Object.fromEntries(CENSUS_COLUMNS.map((c, i) => [c, i]));
    const rows = renderCensus(s2).split('\n').filter((ln) => ln && !ln.startsWith('#')).slice(1).map((ln) => ln.split('\t'));
    const found = rows.filter((r) => r[col.head] !== '-');
    const want = {
      schema: 1, checked_at: s2.checked_at, previous_checked_at: s1.checked_at,
      assessed: rows.length, found: found.length,
      moved_since_pin: found.filter((r) => (Number(r[col.commits_since_pin]) || 0) > 0 || r[col.head] !== r[col.pin]).length,
      commits_since_pin_total: found.reduce((s, r) => s + (Number(r[col.commits_since_pin]) || 0), 0),
      material_since_pin_count: rows.reduce((s, r) => s + (r[col.material_since_pin] === 'no' ? 0 : r[col.material_since_pin].slice(5).split('; ').length), 0),
      material_new_today_count: d.material.length, public_repos: day2.discovery.length,
      new_public_repos_today: ['dotfiles_extra', 'franken_newthing'],
      census_path: 'watch/census/2026-09-25.tsv', changes_path: 'watch/changes/2026-09-25.json',
    };
    for (const [k, v] of Object.entries(want)) expect(JSON.stringify(l[k]) === JSON.stringify(v), `${k}: latest ${JSON.stringify(l[k])}, census ${JSON.stringify(v)}`);
    expect(l.moved_since_pin > 0 && l.material_since_pin_count > 0 && l.material_new_today_count === 6, 'fixture exercises nothing');
    const base = JSON.parse(latestOf(s1, diffSnapshots(null, s1)));
    expect(base.previous_checked_at === null && base.material_new_today_count === 0 && base.new_public_repos_today.length === 0, `baseline ${JSON.stringify(base)}`);
  });

  let failed = 0;
  for (const c of cases) {
    try {
      await c.fn();
      console.log(`PASS  ${c.name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL  ${c.name}: ${e.message}`);
    }
  }
  console.log(`CASES ${cases.length}`);
  console.log(`FAILED ${failed}`);
  return failed === 0 && cases.length > 0 ? EXIT.OK : EXIT.CHANGE;
}

// ---------------------------------------------------------------- main
const USAGE = `usage: node watch/watch.mjs [--apply [--dashboard]] [--json] [--fail-on-change] | --selftest
  (no flags)        dry report on stdout; writes nothing
  --apply           write watch/state.json, watch/census/<date>.tsv, watch/changes/<date>.json, watch/latest.json,
                    watch/live.json, and append this run's crossing events to watch/crossings.jsonl
  --dashboard       with --apply: create or edit the one freshness dashboard issue in ${ISSUE_REPO}
  --json            print the report as JSON
  --fail-on-change  dry report; exit 1 if a material change is new since the last state
  --selftest        offline check of the collect and diff logic on watch/fixtures/
Per-event issues (--issues, --backfill-since-pin) are retired: watch/freshness/SPEC.md FR-D.4.
exit: 0 ok, 1 change (--fail-on-change) or selftest failure, 2 usage/input/token, 3 GitHub API failure`;

function parseArgs(argv) {
  const known = new Set(['--apply', '--dashboard', '--json', '--fail-on-change', '--selftest', '--help', '-h']);
  const retired = new Set(['--issues', '--backfill-since-pin']);
  const flags = argv.filter((a) => a !== '--');
  const gone = flags.filter((a) => retired.has(a));
  if (gone.length) throw usageError(`${gone.join(' ')}: retired; the run keeps one dashboard issue instead (--apply --dashboard; watch/freshness/SPEC.md FR-D.4)\n${USAGE}`);
  const bad = flags.filter((a) => !known.has(a));
  if (bad.length) throw usageError(`unknown argument(s): ${bad.join(' ')}\n${USAGE}`);
  const o = {
    apply: flags.includes('--apply'), dashboard: flags.includes('--dashboard'), json: flags.includes('--json'),
    failOnChange: flags.includes('--fail-on-change'), selftest: flags.includes('--selftest'),
    help: flags.includes('--help') || flags.includes('-h'),
  };
  if (o.selftest && flags.length > 1) throw usageError(`--selftest takes no other flags\n${USAGE}`);
  if (o.failOnChange && (o.apply || o.dashboard)) throw usageError(`--fail-on-change is for the dry report only\n${USAGE}`);
  if (o.dashboard && !o.apply) throw usageError(`--dashboard requires --apply: the dashboard describes the live.json this run writes\n${USAGE}`);
  return o;
}

// The 44 assessed repositories (master matrix rows) and every cohort matrix row (FR-O.3).
function watchedSet(root = ROOT) {
  const matrix = parseMatrix(readFileSync(OVERVIEW, 'utf8'));
  const pinned = parsePackets(PACKETS_DIR).map((a) => ({ ...a, set: 'pinned', matrixRow: matrix[a.repo] ?? null, verdictDate: ASSESSMENT_DATE }));
  const missing = pinned.filter((a) => !a.matrixRow).map((a) => a.repo);
  if (missing.length) throw usageError(`synthesis/00-overview.md has no master-matrix row for ${missing.join(', ')}`);
  const cohort = parseCohorts(join(root, 'cohorts'));
  const clash = cohort.filter((c) => pinned.some((p) => p.repo === c.repo)).map((c) => c.repo);
  if (clash.length) throw usageError(`cohort matrices list assessed repositories: ${clash.join(', ')}`);
  return [...pinned, ...cohort];
}

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log(USAGE); return EXIT.OK; }
  if (opts.selftest) return selftest();
  const t0 = Date.now();
  const watched = watchedSet();
  const prev = readState(join(WATCH_DIR, 'state.json'));
  const api = makeApi(resolveToken());
  const snap = await collect(liveSource(api), watched, prev, iso(new Date().toISOString()));
  const diff = diffSnapshots(prev, snap);
  const fresh = await freshnessStep(api, snap, diff, watched, prev);
  const rep = buildReport(snap, diff, prev, opts, api, Date.now() - t0);
  rep.freshness = {
    totals: fresh.live.totals, bytes: Buffer.byteLength(fresh.liveText), blobs_fetched: fresh.blobsFetched,
    open: fresh.live.repos.flatMap((r) => r.crossings.map((c) => c.id)), pending: fresh.live.repos.flatMap((r) => r.pending.map((c) => c.id)),
    events: fresh.events.map((e) => ({ event: e.event, id: e.id })),
  };
  if (opts.apply) rep.wrote = writeOutputs(snap, diff, fresh);
  if (opts.dashboard) {
    const { syncDashboard } = await import('./freshness/dashboard.mjs');
    rep.dashboard = await syncDashboard(api, fresh.live, { bot: await botLogin(api), dryRun: false });
  }
  rep.api = { ...api.stats, elapsed_s: Math.round((Date.now() - t0) / 100) / 10 };
  if (opts.json) console.log(JSON.stringify(rep, null, 2));
  else printReport(rep);
  return opts.failOnChange && diff.material.length ? EXIT.CHANGE : EXIT.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => {
      console.error(`watch: ${e.message}`);
      process.exitCode = e instanceof WatchError ? e.code : EXIT.API;
    },
  );
}
