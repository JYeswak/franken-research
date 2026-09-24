#!/usr/bin/env node
// watch/watch.mjs: daily watch of Dicklesworthstone's public GitHub repositories for Franken Research.
//
// Reads the GitHub API only (GraphQL + REST); never a local mirror. Compares each of the 44 assessed
// repositories with its pin (from packets/*-assessment.md) and with the previous watch/state.json.
// It flags events that could move a master-matrix cell; it never judges them and never edits pins,
// packets, or synthesis. See watch/README.md.
//
//   node watch/watch.mjs                  dry report on stdout, writes nothing
//   node watch/watch.mjs --apply          also write watch/state.json, census/<date>.tsv, changes/<date>.json
//   node watch/watch.mjs --issues         also open or comment on issues for changes new since the last state
//   node watch/watch.mjs --json           machine-readable report
//   node watch/watch.mjs --fail-on-change dry report; exit 1 if anything material is new since the last state
//   node watch/watch.mjs --selftest       offline: recorded fixtures through the same collect/diff/dedupe code
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

const OWNER = 'Dicklesworthstone';
const ISSUE_REPO = 'JYeswak/franken-research';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WATCH_DIR = join(ROOT, 'watch');
const PACKETS_DIR = join(ROOT, 'packets');
const OVERVIEW = join(ROOT, 'synthesis', '00-overview.md');
const EXPECTED_ASSESSED = 44;
// Assessment date of the pinned corpus (README "What we found"; synthesis/00-overview.md master matrix).
const ASSESSMENT_DATE = '2026-09-22';
const ISSUE_CAP = 20;
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

// Change kind -> issue label, and the master-matrix cells it may affect (synthesis/00-overview.md).
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
const CELLS = {
  TRL: 'TRL (technology readiness level)',
  NODUS: 'NODUS ring (Explore, Monitor, Pilot)',
  License: 'License (Rider = MIT plus the OpenAI/Anthropic rider; plain MIT; none = no operative grant)',
  Bus: 'Bus factor',
  CI: 'CI class (C1 public CI green at pin; C2 red at pin; C3 CI exists, no pin verdict; C4 no test CI or deploy-only; C5 CI disabled or deleted; C6 private-only)',
  Rel: 'Release class (R1 no release or tag; R2 release targets an earlier commit, or phantom; R3 release artifact exists)',
  Identity: 'No cell directly: the packet, brief, and site links name the old repository',
  All: 'Every cell: evidence at the pin may no longer be re-derivable',
  Set: 'The assessed set of 44: candidate for a new packet (no existing cell)',
};
const LABELS = {
  watch: ['c5def5', 'Opened by the daily watch (watch/watch.mjs)'],
  release: ['0e8a16', 'Watch: release or tag after the pin'],
  license: ['d93f0b', 'Watch: license SPDX or LICENSE text changed'],
  ci: ['1d76db', 'Watch: .github/workflows file set changed'],
  archived: ['777777', 'Watch: repository archived or unarchived'],
  renamed: ['fbca04', 'Watch: repository renamed'],
  deleted: ['b60205', 'Watch: repository deleted or made private'],
  'pin-rewritten': ['b60205', 'Watch: pinned commit no longer an ancestor of HEAD'],
  'new-repo': ['5319e7', 'Watch: new public repository, assessment candidate'],
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
export function parsePackets(dir) {
  if (!existsSync(dir)) throw usageError(`packets directory not found: ${dir}`);
  const files = readdirSync(dir).filter((f) => f.endsWith('-assessment.md')).sort();
  const out = [];
  const problems = [];
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8');
    const names = new Set();
    for (const line of text.split('\n')) {
      if (!REPO_LINE.test(line)) continue;
      const m = line.match(REPO_NAME);
      if (m) names.add(m[1]);
    }
    const pins = new Set();
    for (const re of PIN_PATTERNS) for (const m of text.matchAll(re)) pins.add(m[1]);
    const expect = f.replace(/-assessment\.md$/, '');
    if (names.size !== 1) problems.push(`${f}: ${names.size} repository names (${[...names].join(', ') || 'none'})`);
    else if (!names.has(expect)) problems.push(`${f}: repository line names ${[...names][0]}, file name says ${expect}`);
    if (pins.size !== 1) problems.push(`${f}: ${pins.size} distinct pins`);
    if (names.size === 1 && pins.size === 1) out.push({ repo: [...names][0], pin: [...pins][0], packet: `packets/${f}` });
  }
  if (problems.length) throw usageError(`packet parse failed:\n  ${problems.join('\n  ')}`);
  if (out.length !== EXPECTED_ASSESSED) throw usageError(`expected ${EXPECTED_ASSESSED} assessed repos, parsed ${out.length}`);
  return out.sort((a, b) => cmp(a.repo, b.repo));
}

function parseMatrix(text) {
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
    nodes { tagName createdAt publishedAt isDraft isPrerelease tagCommit { oid } } }`;
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
    nodes { databaseId name isArchived isFork pushedAt createdAt primaryLanguage { name } } } } }`;

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
      id: n.databaseId, name: n.name, archived: !!n.isArchived, fork: !!n.isFork,
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
    releases[r.tagName] = { target: r.tagCommit?.oid ?? null, published_at: iso(r.publishedAt), created_at: iso(r.createdAt), prerelease: !!r.isPrerelease };
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
  if (a && d && (a.length || d.length)) m.push({ kind: 'workflows', text: `workflows +${a.length} -${d.length} (${r.workflows.length} now)` });
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
export const isCandidate = (d) => !d.fork && (/^franken/i.test(d.name) || d.language === 'Rust');

// Titles and evidence shared by the daily diff and the since-pin backfill, so one event always gets
// one issue title (issues are deduplicated by exact title).
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

// One change per material-since-pin event (--backfill-since-pin): events that predate the first
// state never appear in a daily diff, so this is how they reach the issue queue.
export function sincePinChanges(snap) {
  const day = snap.checked_at.slice(0, 10);
  const out = [];
  for (const r of Object.values(snap.assessed)) {
    const name = r.name ?? r.repo;
    const atPin = `at the pin (${short(r.pin)}, ${r.pin_date ?? 'date unknown'})`;
    for (const ev of materialSincePin(r)) {
      const e = ev.event;
      if (ev.kind === 'deleted') {
        out.push(change(r.repo, 'deleted', 'gone', TITLE.deleted, {
          summary: `${OWNER}/${r.repo} is not readable through the API (deleted, made private, or transferred).`,
          before: `public ${atPin}`, after: 'not found', value: `gone@${day}`,
          evidence: [r.id != null ? apiUrl(`/repositories/${r.id}`) : apiUrl(`/repos/${OWNER}/${r.repo}`), ghUrl(r.repo)],
        }));
      } else if (ev.kind === 'renamed') {
        out.push(change(r.repo, 'renamed', r.name, TITLE.renamed(r.name), {
          summary: `${OWNER}/${r.repo}, the name in the packet, is now ${OWNER}/${r.name} (GitHub id ${r.id}).`,
          before: r.repo, after: r.name, value: `${r.repo}->${r.name}`, evidence: [apiUrl(`/repositories/${r.id}`), ghUrl(r.name)],
        }));
      } else if (ev.kind === 'pin_unreachable') {
        out.push(change(r.repo, 'pin_unreachable', r.pin, TITLE.pinGone(r.pin), {
          summary: `The pinned commit ${r.pin} is not an ancestor of the default branch (compare: ${r.compare_status}). History was rewritten or the branch reset.`,
          before: `the pin ${short(r.pin)}`, after: `${r.compare_status} at HEAD ${short(r.head)}`, value: r.compare_status,
          evidence: EVIDENCE.pinGone(name, r.pin, r.head),
        }));
      } else if (ev.kind === 'archived') {
        out.push(change(r.repo, 'archived', 'archived', 'archived', {
          summary: `${OWNER}/${name} is archived.`, before: `active ${atPin}`, after: 'archived', value: `archived@${day}`,
          evidence: [apiUrl(`/repos/${OWNER}/${name}`), ghUrl(name)],
        }));
      } else if (ev.kind === 'release') {
        out.push(change(r.repo, 'release', e.name, TITLE.release(e.name), {
          summary: `GitHub release ${e.name}${r.releases[e.name]?.prerelease ? ' (prerelease)' : ''} was published after the pin.`,
          before: `no release ${e.name} ${atPin}`, after: `release ${e.name} -> ${short(e.target)}, published ${e.date}`,
          value: e.target ?? 'none', evidence: EVIDENCE.release(name, e.name, e.target),
        }));
      } else if (ev.kind === 'tag') {
        out.push(change(r.repo, 'tag', e.name, TITLE.tag(e.name), {
          summary: `Tag ${e.name} was created after the pin${e.target === r.pin ? ', on the pinned commit itself' : ''}; there is no GitHub release for it.`,
          before: `no tag ${e.name} ${atPin}`, after: `tag ${e.name} -> ${short(e.target)} (${e.date})`,
          value: e.target ?? 'none', evidence: EVIDENCE.tag(name, e.name),
        }));
      } else if (ev.kind === 'license') {
        const files = licenseText(r.license_files);
        out.push(change(r.repo, 'license', digest(licenseKey(r.license_files)), `license text changed since the pin (SPDX now ${r.license_spdx}, ${files})`, {
          summary: `A license file differs from the pin; GitHub now detects ${r.license_spdx}. A rider lives in the text, so read the diff.`,
          before: `${licenseText(r.license_files_at_pin ?? [])} ${atPin}`, after: `${r.license_spdx}; ${files}`,
          value: `${r.license_spdx}|${licenseKey(r.license_files)}`,
          evidence: [...r.license_files.map((f) => ghUrl(name, `/blob/${r.head}/${f.name}`)), ghUrl(name, `/compare/${r.pin}...${r.head}`)],
        }));
      } else if (ev.kind === 'workflows') {
        const a = r.workflows_added_since_pin;
        const d = r.workflows_removed_since_pin;
        out.push(change(r.repo, 'workflows', digest(r.workflows), TITLE.workflows(a.length, d.length, r.workflows.length), {
          summary: workflowSummary(a, d),
          before: `${r.workflows.length - a.length + d.length} files ${atPin}`, after: `${r.workflows.length} files at ${short(r.head)}`,
          value: digest(r.workflows), evidence: EVIDENCE.workflows(name, r.pin, r.head),
        }));
      }
    }
  }
  return out.map((c) => ({ ...c, origin: 'pin' })).sort(byKey);
}

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
      material.push(change(repo, 'workflows', digest(c.workflows), TITLE.workflows(added.length, removed.length, c.workflows.length), {
        summary: workflowSummary(added, removed),
        before: `${p.workflows.length} files at ${short(p.head)}`, after: `${c.workflows.length} files at ${short(c.head)}`,
        value: digest(c.workflows),
        evidence: EVIDENCE.workflows(name, p.head, c.head),
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
      const cand = isCandidate(d);
      (cand ? material : informational).push(change(d.name, 'new_repo', String(d.id), 'new public repo', {
        summary: `New public repository ${OWNER}/${d.name} (${d.language ?? 'no primary language'}${d.fork ? ', fork' : ''}, created ${d.created_at?.slice(0, 10)}). ${cand ? 'Assessment candidate: the name starts with franken or its primary language is Rust.' : 'Informational: not a franken name and not a Rust repository.'}`,
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

function writeOutputs(snap, diff) {
  const day = snap.checked_at.slice(0, 10);
  const files = {
    [join(WATCH_DIR, 'state.json')]: toJson(snap),
    [join(WATCH_DIR, 'census', `${day}.tsv`)]: renderCensus(snap),
  };
  const changesFile = join(WATCH_DIR, 'changes', `${day}.json`);
  const existing = existsSync(changesFile) ? JSON.parse(readFileSync(changesFile, 'utf8')) : null;
  const changes = renderChanges(snap, diff, existing);
  files[changesFile] = toJson(changes);
  for (const f of Object.keys(files)) mkdirSync(dirname(f), { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(`${f}.tmp`, body);
  for (const f of Object.keys(files)) renameSync(`${f}.tmp`, f);
  return { files: Object.keys(files).map((f) => f.slice(ROOT.length + 1)), material: changes.material.length };
}

// ---------------------------------------------------------------- issues
const VALUE_MARK = /<!-- watch-value: (.*?) -->/;
const markValue = (body) => (body ?? '').match(VALUE_MARK)?.[1] ?? null;
// 'create' when no issue has the exact title (open or closed); 'exists' when the issue or one of its
// watch comments already records this value; 'comment' when the value changed ('check-comments' asks
// the caller to load comments first). A closed issue is never reopened.
export function dedupe(issue, ch) {
  if (!issue) return 'create';
  if (markValue(issue.body) === ch.value) return 'exists';
  if (issue.comments == null) return 'check-comments';
  return issue.comments.some((c) => markValue(c.body) === ch.value) ? 'exists' : 'comment';
}

function issueBody(ch, snap, matrix) {
  const row = matrix[ch.repo];
  const repoLink = (p) => `https://github.com/${ISSUE_REPO}/blob/main/${p}`;
  const run = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  const rec = snap.assessed[ch.repo];
  return [
    `**What changed:** ${ch.summary}`,
    '',
    '| | Value |',
    '|---|---|',
    `| Before | ${ch.before} |`,
    `| After | ${ch.after} |`,
    '',
    ch.origin === 'pin'
      ? `Found by the since-pin backfill at ${snap.checked_at}. It compares with the pin, not with the previous check, because this event predates the watch's first state.`
      : `Observed by the daily watch at ${snap.checked_at}; previous check ${snap.previous_checked_at ?? 'none'}.${run ? ` Run: ${run}` : ''}`,
    '',
    '**Evidence (GitHub API and web):**',
    ...ch.evidence.map((u) => `- ${u}`),
    '',
    `**Assessment cells this may affect** (legend: [synthesis/00-overview.md](${repoLink('synthesis/00-overview.md')}); values are the pinned master-matrix cells, not a new judgment):`,
    ...ch.affects.map((cell) => `- ${CELLS[cell]}${row?.[cell] ? `: **${row[cell]}** at the pin` : ''}`),
    rec ? `\nPacket: [${rec.packet}](${repoLink(rec.packet)}), pinned at \`${rec.pin}\`.` : '',
    '',
    '**Analyst checklist** (the watch does not judge; it only reports):',
    '- [ ] Triage: could this move a matrix cell? If not, close with a one-line reason.',
    `- [ ] If yes: write a dated re-check \`updates/${ch.repo}-YYYY-MM-DD.md\` per [updates/METHOD.md](${repoLink('updates/METHOD.md')}), pinned to the new commit.`,
    '- [ ] Have a separate agent session review the re-check before it lands.',
    `- [ ] Harvest any new practice into [stack/rigor-practices.tsv](${repoLink('stack/rigor-practices.tsv')}).`,
    '- [ ] Close with links to the re-check, the review, and any rigor row.',
    '',
    `<!-- watch-key: ${ch.repo}|${ch.kind}|${ch.ident} -->`,
    `<!-- watch-value: ${ch.value} -->`,
  ].join('\n');
}

// Dated re-checks under updates/ that name this release or tag (for example
// updates/franken_code_browser-2026-09-24.md naming v0.1.0). They get one pointer comment on the
// issue; the analyst still triages and closes it.
export function recheckFiles(ch, root = ROOT) {
  if (ch.kind !== 'release' && ch.kind !== 'tag') return [];
  const dir = join(root, 'updates');
  if (!existsSync(dir)) return [];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const file = new RegExp(`^${esc(ch.repo)}-\\d{4}-\\d{2}-\\d{2}\\.md$`);
  const names = new RegExp(`(?<![\\w.-])${esc(ch.ident)}(?![\\w-]|\\.\\d)`);
  return readdirSync(dir).filter((f) => file.test(f)).sort()
    .filter((f) => names.test(readFileSync(join(dir, f), 'utf8'))).map((f) => `updates/${f}`);
}

export async function syncIssues(api, snap, changes, root = ROOT) {
  const result = { created: [], commented: [], exists: [], rechecks: [], rollup: null };
  if (!changes.length) return result;
  const base = `/repos/${ISSUE_REPO}`;
  const have = new Set();
  for (let page = 1; ; page++) {
    const r = await api.rest('GET', `${base}/labels?per_page=100&page=${page}`);
    r.body.forEach((l) => have.add(l.name));
    if (r.body.length < 100) break;
  }
  const needed = new Set(['watch', ...changes.map((c) => c.label)]);
  for (const name of [...needed].sort()) {
    if (!have.has(name)) await api.rest('POST', `${base}/labels`, { name, color: LABELS[name][0], description: LABELS[name][1] });
  }
  const byTitle = new Map();
  for (let page = 1; ; page++) {
    const r = await api.rest('GET', `${base}/issues?state=all&per_page=100&page=${page}&sort=created&direction=asc`);
    for (const i of r.body) if (!i.pull_request && !byTitle.has(i.title)) byTitle.set(i.title, i);
    if (r.body.length < 100) break;
  }
  const matrix = existsSync(OVERVIEW) ? parseMatrix(readFileSync(OVERVIEW, 'utf8')) : {};
  const loadComments = async (n) => (await api.rest('GET', `${base}/issues/${n}/comments?per_page=100`)).body;
  const post = async (n, body) => (await api.rest('POST', `${base}/issues/${n}/comments`, { body })).body;
  const ref = (i) => ({ number: i.number, title: i.title, url: i.html_url });
  const repoLink = (p) => `https://github.com/${ISSUE_REPO}/blob/main/${p}`;
  const commentBody = (ch) => `The watch saw this again with a new value.\n\n| | Value |\n|---|---|\n| Before | ${ch.before} |\n| After | ${ch.after} |\n\nEvidence:\n${ch.evidence.map((u) => `- ${u}`).join('\n')}\n\n<!-- watch-value: ${ch.value} -->`;
  const recheckBody = (ch, files) => `A dated re-check that names ${ch.ident} already exists: ${files.map((p) => `[${p}](${repoLink(p)})`).join(', ')}. Triage against it. The watch does not close issues; the analyst does.\n\n${files.map((p) => `<!-- watch-recheck: ${p} -->`).join('\n')}`;
  const overflow = [];
  let actions = 0;
  for (const ch of changes) {
    let issue = byTitle.get(ch.title) ?? null;
    let comments = null;
    let decision = dedupe(issue, ch);
    if (decision === 'check-comments') {
      comments = await loadComments(issue.number);
      decision = dedupe({ ...issue, comments }, ch);
    }
    if (decision === 'exists') result.exists.push(ref(issue));
    else if (actions >= ISSUE_CAP) { overflow.push(ch); continue; }
    else if (decision === 'create') {
      actions++;
      issue = (await api.rest('POST', `${base}/issues`, { title: ch.title, body: issueBody(ch, snap, matrix), labels: ['watch', ch.label] })).body;
      byTitle.set(ch.title, issue);
      comments = [];
      result.created.push(ref(issue));
    } else {
      actions++;
      comments = [...(comments ?? []), await post(issue.number, commentBody(ch))];
      result.commented.push(ref(issue));
    }
    const files = recheckFiles(ch, root);
    if (files.length) {
      comments ??= await loadComments(issue.number);
      const missing = files.filter((p) => !comments.some((c) => (c.body ?? '').includes(`<!-- watch-recheck: ${p} -->`)));
      if (missing.length) {
        await post(issue.number, recheckBody(ch, missing));
        result.rechecks.push({ ...ref(issue), files: missing });
      }
    }
  }
  if (overflow.length) {
    const day = snap.checked_at.slice(0, 10);
    const roll = { title: `[watch] rollup ${day}`, value: digest(overflow.map((c) => `${c.title}|${c.value}`)) };
    const list = overflow.map((c) => `- ${c.title}: ${c.summary} (${c.evidence[0]})`).join('\n');
    const body = `The watch capped this run at ${ISSUE_CAP} issue actions. ${overflow.length} more material change(s) are listed here instead of opening one issue each; triage them from this list (records for ${day} in watch/changes/ and watch/census/).\n\n${list}\n\n<!-- watch-value: ${roll.value} -->`;
    const issue = byTitle.get(roll.title) ?? null;
    let decision = dedupe(issue, roll);
    if (decision === 'check-comments') decision = dedupe({ ...issue, comments: await loadComments(issue.number) }, roll);
    if (decision === 'create') result.rollup = ref((await api.rest('POST', `${base}/issues`, { title: roll.title, body, labels: ['watch'] })).body);
    else if (decision === 'comment') { await post(issue.number, body); result.rollup = ref(issue); }
    else result.rollup = ref(issue);
  }
  return result;
}

// ---------------------------------------------------------------- report
function buildReport(snap, diff, prev, opts, api, elapsedMs) {
  const recs = Object.values(snap.assessed);
  const found = recs.filter((r) => r.found);
  const perRepo = recs.map((r) => ({ repo: r.repo, events: materialSincePin(r) })).filter((x) => x.events.length);
  const assessedIds = new Set(found.map((r) => r.id));
  const newSincePin = snap.discovery.filter((d) => !assessedIds.has(d.id) && d.created_at >= `${ASSESSMENT_DATE}T00:00:00Z`)
    .map((d) => ({ name: d.name, language: d.language, created_at: d.created_at, candidate: isCandidate(d) }));
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
      moved_since_pin: found.filter((r) => (r.commits_since_pin ?? 0) > 0 || r.head !== r.pin).length,
      commits_since_pin_total: found.reduce((s, r) => s + (r.commits_since_pin ?? 0), 0),
    },
    discovered: {
      public_repos: snap.discovery.length,
      not_assessed: snap.discovery.filter((d) => !assessedIds.has(d.id)).length,
      forks: snap.discovery.filter((d) => d.fork).length,
      archived: snap.discovery.filter((d) => d.archived).length,
      created_since_assessment: newSincePin,
    },
    material_since_pin: { events: perRepo.reduce((s, x) => s + x.events.length, 0), repos: perRepo.length, by_repo: perRepo },
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
  const ns = rep.discovered.created_since_assessment;
  L.push(`public repos created since ${ASSESSMENT_DATE}, not assessed: ${ns.length}`);
  for (const d of ns) L.push(`  ${d.name} (${d.language ?? 'no language'}, created ${d.created_at.slice(0, 10)}): ${d.candidate ? 'assessment candidate' : 'informational'}`);
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
  if (rep.issues) {
    const i = rep.issues;
    const line = (tag, x) => L.push(`  ${tag} #${x.number} ${x.title}`);
    L.push(`issues${rep.backfill ? ' (with since-pin backfill)' : ''}: created ${i.created.length}, commented ${i.commented.length}, already filed ${i.exists.length}, re-check pointers ${i.rechecks.length}${i.rollup ? `, rollup #${i.rollup.number}` : ''}`);
    i.created.forEach((x) => line('created  ', x));
    i.commented.forEach((x) => line('commented', x));
    i.exists.forEach((x) => line('exists   ', x));
    i.rechecks.forEach((x) => L.push(`  re-check #${x.number} -> ${x.files.join(', ')}`));
  }
  console.log(L.join('\n'));
}

// ---------------------------------------------------------------- selftest (offline)
// In-memory stand-in for the GitHub issues and labels endpoints syncIssues calls.
function memoryIssues() {
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
        const i = { number: issues.length + 1, title: payload.title, body: payload.body, labels: payload.labels, state: 'open', html_url: `memory:issues/${issues.length + 1}` };
        issues.push(i);
        comments.set(i.number, []);
        return { status: 201, body: { ...i } };
      }
      const m = p.match(/^\/issues\/(\d+)\/comments$/);
      if (m && method === 'GET') return { status: 200, body: [...comments.get(Number(m[1]))] };
      if (m && method === 'POST') { comments.get(Number(m[1])).push({ body: payload.body }); return { status: 201, body: { body: payload.body } }; }
      throw new Error(`memory issues: unexpected ${method} ${path}`);
    },
  };
  return { api, issues, labels, comments };
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
  test('nothing else is material', () => {
    const titles = d.material.map((c) => c.title).sort();
    expect(titles.length === 6, `material: ${JSON.stringify(titles)}`);
  });
  test('dedupe: an existing title with the same value is exists; a new value is comment; none is create', () => {
    const ch = mat('franken_code_browser', 'release')[0];
    const filed = { title: ch.title, body: issueBody(ch, s2, {}), comments: [] };
    expect(dedupe(filed, ch) === 'exists', `got ${dedupe(filed, ch)}`);
    expect(dedupe({ ...filed, comments: null }, ch) === 'exists', 'body marker ignored');
    const moved = { ...ch, value: 'f'.repeat(40) };
    expect(dedupe({ ...filed, comments: null }, moved) === 'check-comments', 'did not ask for comments');
    expect(dedupe(filed, moved) === 'comment', `got ${dedupe(filed, moved)}`);
    expect(dedupe({ ...filed, comments: [{ body: `<!-- watch-value: ${moved.value} -->` }] }, moved) === 'exists', 'comment marker ignored');
    expect(dedupe(null, ch) === 'create', 'no issue should create');
  });
  test('backfill on day1 files each since-pin event once; a second backfill finds only existing issues', async () => {
    const titles = sincePinChanges(s1).map((c) => c.title);
    const want = ['[watch] franken_code_browser: release v0.1.0', '[watch] frankenlibc: workflows +7 -0 (9 now)'];
    expect(JSON.stringify(titles) === JSON.stringify(want), `titles ${JSON.stringify(titles)}`);
    const daily = mat('franken_code_browser', 'release')[0].title;
    expect(daily === '[watch] franken_code_browser: release v0.1.1', 'daily and backfill title formats differ');
    const store = memoryIssues();
    const first = await syncIssues(store.api, s1, sincePinChanges(s1));
    expect(first.created.length === 2 && first.exists.length === 0 && !first.rollup, `first: ${JSON.stringify(first)}`);
    expect(store.labels.has('watch') && store.labels.has('release') && store.labels.has('ci'), `labels ${[...store.labels]}`);
    const rc = first.rechecks;
    expect(rc.length === 1 && rc[0].title === want[0] && rc[0].files.join() === 'updates/franken_code_browser-2026-09-24.md', `re-check pointers ${JSON.stringify(rc)}`);
    const second = await syncIssues(store.api, s1, sincePinChanges(s1));
    expect(second.exists.length === 2 && second.created.length === 0 && second.commented.length === 0 && second.rechecks.length === 0 && !second.rollup, `second: ${JSON.stringify(second)}`);
    expect(store.issues.length === 2 && store.issues.every((i) => i.state === 'open') && store.comments.get(1).length === 1, 'duplicate issue or comment, or an issue was closed');
  });
  test('outputs are deterministic regardless of API node order', async () => {
    const shuffled = { ...day1, discovery: [...day1.discovery].reverse() };
    const again = await collect(fixtureSource(shuffled), [...day1.assessed].reverse(), null, s1.checked_at);
    expect(toJson(again) === toJson(s1), 'state differs');
    expect(renderCensus(again) === renderCensus(s1), 'census differs');
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
const USAGE = `usage: node watch/watch.mjs [--apply] [--issues [--backfill-since-pin]] [--json] [--fail-on-change] | --selftest
  (no flags)        dry report on stdout; writes nothing
  --apply           write watch/state.json, watch/census/<date>.tsv, watch/changes/<date>.json
  --issues          open or comment on issues in ${ISSUE_REPO} for material changes new since the last state
  --backfill-since-pin  with --issues: also file every material-since-pin event (events older than the
                    first state never reach a daily diff); same titles, dedupe, and 20-per-run cap
  --json            print the report as JSON
  --fail-on-change  dry report; exit 1 if a material change is new since the last state
  --selftest        offline check of the diff and dedupe logic on watch/fixtures/
exit: 0 ok, 1 change (--fail-on-change) or selftest failure, 2 usage/input/token, 3 GitHub API failure`;

function parseArgs(argv) {
  const known = new Set(['--apply', '--issues', '--backfill-since-pin', '--json', '--fail-on-change', '--selftest', '--help', '-h']);
  const flags = argv.filter((a) => a !== '--');
  const bad = flags.filter((a) => !known.has(a));
  if (bad.length) throw usageError(`unknown argument(s): ${bad.join(' ')}\n${USAGE}`);
  const o = {
    apply: flags.includes('--apply'), issues: flags.includes('--issues'), json: flags.includes('--json'),
    backfill: flags.includes('--backfill-since-pin'),
    failOnChange: flags.includes('--fail-on-change'), selftest: flags.includes('--selftest'),
    help: flags.includes('--help') || flags.includes('-h'),
  };
  if (o.selftest && flags.length > 1) throw usageError(`--selftest takes no other flags\n${USAGE}`);
  if (o.failOnChange && (o.apply || o.issues)) throw usageError(`--fail-on-change is for the dry report only\n${USAGE}`);
  if (o.backfill && !o.issues) throw usageError(`--backfill-since-pin requires --issues\n${USAGE}`);
  return o;
}

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log(USAGE); return EXIT.OK; }
  if (opts.selftest) return selftest();
  const t0 = Date.now();
  const assessed = parsePackets(PACKETS_DIR);
  const prev = readState(join(WATCH_DIR, 'state.json'));
  const api = makeApi(resolveToken());
  const snap = await collect(liveSource(api), assessed, prev, iso(new Date().toISOString()));
  const diff = diffSnapshots(prev, snap);
  const rep = buildReport(snap, diff, prev, opts, api, Date.now() - t0);
  if (opts.apply) rep.wrote = writeOutputs(snap, diff);
  if (opts.issues) {
    const seen = new Set();
    const changes = [...diff.material, ...(opts.backfill ? sincePinChanges(snap) : [])]
      .filter((c) => !seen.has(c.title) && seen.add(c.title));
    rep.backfill = opts.backfill;
    rep.issues = await syncIssues(api, snap, changes);
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
