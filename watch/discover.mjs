#!/usr/bin/env node
// watch/discover.mjs: weekly Rust discovery sweep for Franken Research.
//
// Finds recently active public Rust repositories that show signs of being built by AI coding agents
// and lists them as candidates for an assessment. It lists; it never assesses. The screening rule and
// what happens to a candidate are in candidates/README.md; this script is described in
// watch/discovery/README.md.
//
//   node watch/discover.mjs              dry report on stdout, writes nothing
//   node watch/discover.mjs --apply      also write watch/discovery/<ISO-week>.json
//   node watch/discover.mjs --issues     also create or update ONE rollup issue for the week
//   node watch/discover.mjs --selftest   offline: recorded fixtures through the same transport and code
//
// Exit: 0 ok; 1 failed selftest; 2 usage or token error; 3 GitHub API failure, including any 403 or
// 429 (rate limit): nothing is written from partial data.
// Token: GITHUB_TOKEN or GH_TOKEN, else `gh auth token`. The token is never printed.
// Node 22 built-ins only.

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ISSUE_REPO = 'JYeswak/franken-research';
// The daily watch (watch/watch.mjs) already covers every public repository this user owns.
const EXCLUDED_OWNER = 'dicklesworthstone';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'watch', 'discovery');
const FIXTURES = join(ROOT, 'watch', 'fixtures');
const COHORTS = join(ROOT, 'cohorts');
const UA = 'franken-research-discover';

const LIMITS = {
  pushedDays: 30, // pushed within the last 30 days (candidates/README.md, predicate 3)
  createdDays: 180, // a young repository, so the sweep surfaces new work rather than old stars
  minStars: 25,
  perPage: 100,
  pages: 3, // the search API returns at most 1000 results; 300 is plenty for the top 40
  check: 40, // repositories whose signals are fetched (3 REST calls each)
  listed: 15, // rows in the weekly rollup issue
  commits: 30, // recent commits read for Co-Authored-By trailers
  searchGapMs: 2500, // the search API allows 30 requests a minute; one every 2.5 s stays under it
  concurrency: 4,
};

const EXIT = { OK: 0, FAIL: 1, USAGE: 2, API: 3 };
class DiscoverError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const usageError = (m) => new DiscoverError(EXIT.USAGE, m);
const apiError = (m) => new DiscoverError(EXIT.API, m);

// ---------------------------------------------------------------- small helpers
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const day = (d) => d.toISOString().slice(0, 10);
const daysBefore = (now, n) => day(new Date(now.getTime() - n * 86400000));
const digest = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 12);
const repoLink = (p) => `https://github.com/${ISSUE_REPO}/blob/main/${p}`;
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ISO 8601 week of a UTC date, e.g. 2026-09-24 -> 2026-W39. The week belongs to the year of its Thursday.
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

export function searchQuery(now) {
  return `language:Rust pushed:>=${daysBefore(now, LIMITS.pushedDays)} created:>=${daysBefore(now, LIMITS.createdDays)} stars:>=${LIMITS.minStars} fork:false`;
}
const searchPath = (q, page) => `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${LIMITS.perPage}&page=${page}`;

// ---------------------------------------------------------------- GitHub transport
export function resolveToken() {
  const env = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  if (env) return env;
  try {
    const t = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
    if (t) return t;
  } catch { /* fall through to the typed error */ }
  throw usageError('no GitHub token: set GITHUB_TOKEN or GH_TOKEN, or log in with `gh auth login`');
}

// One transport for live and recorded runs: `fetchImpl` is global fetch, or fixtureFetch() in the
// selftest, so status handling (403 stops the run, 5xx retries, 404 allowed where asked) is the same.
export function makeApi({ token, fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const stats = { search_calls: 0, rest_calls: 0, search_remaining: null, rest_remaining: null };
  const headers = { 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28', Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let lastSearch = 0;
  async function call(method, path, { payload, allow = [] } = {}) {
    const search = path.startsWith('/search/');
    if (search) {
      const wait = lastSearch + LIMITS.searchGapMs - Date.now();
      if (lastSearch && wait > 0) await sleep(wait);
      lastSearch = Date.now();
      stats.search_calls++;
    } else stats.rest_calls++;
    const where = `${method} ${path.replace(/\?.*/, '')}`;
    let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fetchImpl(`https://api.github.com${path}`, {
          method,
          headers: { ...headers, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
          body: payload ? JSON.stringify(payload) : undefined,
          signal: AbortSignal.timeout(60000),
        });
      } catch (e) {
        if (attempt < 2) { await sleep(2000 * (attempt + 1)); continue; }
        throw apiError(`network error on ${where}: ${e.message}`);
      }
      if (res.status >= 500 && attempt < 2) { await sleep(2000 * (attempt + 1)); continue; }
      break;
    }
    const rem = res.headers.get('x-ratelimit-remaining');
    if (rem !== null) stats[search ? 'search_remaining' : 'rest_remaining'] = Number(rem);
    if (res.status === 401) throw usageError('GitHub token rejected (HTTP 401)');
    // A rate limit (primary or secondary) or a forbidden resource: stop the whole run. No retry, no
    // partial output; the next scheduled run starts clean.
    if (res.status === 403 || res.status === 429) throw apiError(`${where}: HTTP ${res.status} (rate limit or forbidden); stopping, nothing written`);
    const text = await res.text();
    let body = null;
    if (text) {
      try { body = JSON.parse(text); } catch { throw apiError(`${where}: HTTP ${res.status}, response is not JSON`); }
    }
    if (res.ok || allow.includes(res.status)) return { status: res.status, body };
    throw apiError(`${where}: HTTP ${res.status} ${body?.message ?? ''}`.trim());
  }
  return { get: (path, allow) => call('GET', path, { allow }), send: (method, path, payload) => call(method, path, { payload }), stats };
}

// Recorded responses keyed by request path (watch/fixtures/discover-*.json). An unrecorded path is a
// selftest bug, never a silent empty answer.
export function fixtureFetch(responses) {
  return async (url) => {
    const path = url.replace('https://api.github.com', '');
    const rec = responses[path];
    if (!rec) throw new Error(`fixture: no recorded response for ${path}`);
    return new Response(rec.body == null ? '' : JSON.stringify(rec.body), { status: rec.status ?? 200, headers: rec.headers ?? {} });
  };
}

// ---------------------------------------------------------------- signals
// A Co-Authored-By trailer whose value names a coding agent or its vendor. The trailer text is
// matched and counted; it is never stored, so no name or email leaves this function.
const AGENT = String.raw`claude|codex|gemini|copilot|cursor|devin|jules|aider|openhands|amp|anthropic|openai|(?:ai|coding|llm)[ -]?agents?|agent`;
const TRAILER = new RegExp(String.raw`^[ \t]*co-authored-by:[^\n]*\b(?:${AGENT})\b`, 'im');
// An explicit statement in the README that agents built it ("built with Claude Code", "written by
// AI agents", "vibe-coded"). Not "generated via": READMEs use it for what the tool calls at run time
// ("summaries are generated via `claude --print`"), which says nothing about who wrote the code.
const README_STATEMENT = new RegExp(
  String.raw`\b(?:built|written|developed|made|created|coded|authored|implemented|ported)\b[^.\n]{0,40}?\b(?:with|by|using)\b[^.\n]{0,30}?\b(?:claude(?: code)?|codex|gemini(?: cli)?|cursor|copilot|devin|aider|(?:ai|llm|coding) (?:coding )?agents?)\b|\bvibe[- ]coded\b`,
  'i',
);

export const hasAgentTrailer = (message) => TRAILER.test(message ?? '');
export const readmeStatement = (text) => README_STATEMENT.test(text ?? '');

export function scoreOf(signals, stars) {
  const count = (signals.agents_md ? 1 : 0) + (signals.claude_md ? 1 : 0) + (signals.agent_trailers > 0 ? 1 : 0) + (signals.readme_statement ? 1 : 0);
  // Stars break ties within a signal count and never outweigh a signal: log10(stars)/10 is below 1
  // for any repository under ten billion stars.
  return { signal_count: count, score: round(count + Math.log10(Math.max(stars, 1)) / 10) };
}

async function signalsOf(api, full) {
  const enc = full.split('/').map(encodeURIComponent).join('/');
  const root = await api.get(`/repos/${enc}/contents/`, [404]);
  const names = new Set(Array.isArray(root.body) ? root.body.filter((e) => e.type === 'file').map((e) => e.name.toLowerCase()) : []);
  const commits = await api.get(`/repos/${enc}/commits?per_page=${LIMITS.commits}`, [404, 409]);
  const messages = Array.isArray(commits.body) ? commits.body.map((c) => c?.commit?.message ?? '') : [];
  const readme = await api.get(`/repos/${enc}/readme`, [404]);
  const text = readme.status === 200 && readme.body?.content ? Buffer.from(readme.body.content, readme.body.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8') : '';
  return {
    agents_md: names.has('agents.md'),
    claude_md: names.has('claude.md'),
    agent_trailers: messages.filter(hasAgentTrailer).length,
    readme_statement: readmeStatement(text),
  };
}

// ---------------------------------------------------------------- known repositories
const GH_REPO = /github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?=[/\s)\]>#?`'"|,]|$)/g;
const reposIn = (text) => [...(text ?? '').matchAll(GH_REPO)].map((m) => `${m[1]}/${m[2]}`.toLowerCase());
export const rollupTitle = (week) => `[discovery] Rust candidates, week ${week}`;

// Already a candidate: named by any `candidate` issue other than this week's rollup (a suggest-a-project
// issue, or an earlier week's rollup), or listed in an earlier week's watch/discovery/<week>.json.
export function knownCandidates(issues, priorFiles, week) {
  const known = new Set();
  const title = rollupTitle(week);
  for (const i of issues) {
    if (i.title === title || !(i.labels ?? []).some((l) => (l.name ?? l) === 'candidate')) continue;
    const named = i.title.match(/^\[candidate\]\s*([A-Za-z0-9-]+\/[A-Za-z0-9._-]+)/);
    if (named) known.add(named[1].toLowerCase());
    for (const r of reposIn(`${i.title}\n${i.body ?? ''}`)) known.add(r);
  }
  for (const f of priorFiles) if (f.week !== week) for (const r of f.listed ?? []) known.add(r.toLowerCase());
  return known;
}

// Already assessed outside the pinned 44: any repository named on a packet's repository line under
// cohorts/<YYYY-MM>/. (The 44 are all Dicklesworthstone's and are excluded by owner.)
export function assessedRepos(dir = COHORTS) {
  const out = new Set();
  if (!existsSync(dir)) return out;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        for (const line of readFileSync(p, 'utf8').split('\n')) {
          if (/^(?:\*\*Repo(?:sitory)?:\*\*|\| Repository \|)/.test(line)) reposIn(line).forEach((r) => out.add(r));
        }
      }
    }
  };
  walk(dir);
  return out;
}

export function priorDiscovery(dir = OUT_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /^\d{4}-W\d{2}\.json$/.test(f)).sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

export async function listIssues(api) {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await api.get(`/repos/${ISSUE_REPO}/issues?state=all&per_page=100&page=${page}&sort=created&direction=asc`);
    all.push(...r.body.filter((i) => !i.pull_request));
    if (r.body.length < 100) break;
  }
  return all;
}

// ---------------------------------------------------------------- discover
export async function discover(api, { now, known = new Set(), assessed = new Set(), check = LIMITS.check }) {
  const week = isoWeek(now);
  const query = searchQuery(now);
  const seen = new Map();
  let total = null;
  let incomplete = false;
  for (let page = 1; page <= LIMITS.pages; page++) {
    const r = await api.get(searchPath(query, page));
    total ??= r.body.total_count;
    incomplete ||= Boolean(r.body.incomplete_results);
    for (const it of r.body.items ?? []) if (!seen.has(it.full_name)) seen.set(it.full_name, it);
    if ((r.body.items ?? []).length < LIMITS.perPage) break;
  }
  const excluded = { owner: 0, fork: 0, archived: 0, assessed: 0, already_candidate: 0 };
  const pool = [];
  for (const it of seen.values()) {
    const key = it.full_name.toLowerCase();
    if ((it.owner?.login ?? key.split('/')[0]).toLowerCase() === EXCLUDED_OWNER) excluded.owner++;
    else if (it.fork) excluded.fork++;
    else if (it.archived) excluded.archived++;
    else if (assessed.has(key)) excluded.assessed++;
    else if (known.has(key)) excluded.already_candidate++;
    else pool.push(it);
  }
  // Stars, then name: the API's order within equal stars is not stable, this is.
  pool.sort((a, b) => b.stargazers_count - a.stargazers_count || cmp(a.full_name.toLowerCase(), b.full_name.toLowerCase()));
  const checked = pool.slice(0, check);
  const rows = await mapLimit(checked, LIMITS.concurrency, async (it) => {
    const signals = await signalsOf(api, it.full_name);
    return {
      repo: it.full_name,
      url: it.html_url,
      stars: it.stargazers_count,
      pushed_at: it.pushed_at,
      created_at: it.created_at,
      signals,
      ...scoreOf(signals, it.stargazers_count),
    };
  });
  const candidates = rows.filter((r) => r.signal_count > 0)
    .sort((a, b) => b.score - a.score || b.stars - a.stars || cmp(a.repo.toLowerCase(), b.repo.toLowerCase()));
  return {
    week,
    checked_on: day(now),
    query,
    rule: 'candidates/README.md',
    search: { total_count: total, fetched: seen.size, incomplete_results: incomplete },
    excluded,
    checked: checked.length,
    no_signal: rows.length - candidates.length,
    candidates,
    listed: candidates.slice(0, LIMITS.listed).map((c) => c.repo),
  };
}

export const renderResult = (res) => JSON.stringify(res, null, 2) + '\n';

function writeResult(res, dir = OUT_DIR) {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${res.week}.json`);
  writeFileSync(`${file}.tmp`, renderResult(res));
  renameSync(`${file}.tmp`, file);
  return file;
}

// ---------------------------------------------------------------- rollup issue
const LABELS = {
  candidate: ['0e8a16', 'A project suggested or found for a possible assessment (candidates/README.md)'],
  discovery: ['5319e7', 'Weekly Rust discovery sweep (watch/discover.mjs)'],
};
const VALUE_MARK = /<!-- discovery-value: ([0-9a-f]{12}) -->/;
const WEEK_MARK = /<!-- discovery-week: (\d{4}-W\d{2}) -->/;
const REQUIRED_LABELS = Object.keys(LABELS);
// The value is the listing itself (repositories and their signals), not star counts, so a rerun in the
// same week with the same list is 'exists' even when stars moved.
export const rollupValue = (res) => digest(res.candidates.slice(0, LIMITS.listed).map((c) => [c.repo, c.signals]));

// The login the token acts as. A workflow's GITHUB_TOKEN acts as github-actions[bot] and cannot read
// GET /user (403), so under Actions the login is fixed; anywhere else it is whoever the token belongs to.
// Never a hardcoded human login.
export async function botIdentity(api, env = process.env) {
  if (env.GITHUB_ACTIONS === 'true') return 'github-actions[bot]';
  const login = (await api.get('/user')).body?.login;
  if (!login) throw apiError('GET /user returned no login; cannot tell which issues this token wrote');
  return login;
}

// Issue titles are public and predictable: anyone can open '[discovery] Rust candidates, week <W>'
// first. An issue is this sweep's rollup only when this token's identity opened it, it carries both
// labels, and its body has this week's machine markers. Anything else with the title is ignored and
// never edited.
export function trustedRollup(issue, week, bot) {
  const labels = new Set((issue.labels ?? []).map((l) => l.name ?? l));
  const body = issue.body ?? '';
  return issue.user?.login === bot && REQUIRED_LABELS.every((l) => labels.has(l))
    && body.match(WEEK_MARK)?.[1] === week && VALUE_MARK.test(body);
}

// 'create' when no trusted rollup exists for the week (open or closed); 'exists' when its body already
// records this listing; 'update' (edit that one bot issue's body) when the listing changed; 'closed'
// when triage already closed it: a closed rollup is never reopened or edited.
export function dedupeRollup(issue, value) {
  if (!issue) return 'create';
  if ((issue.body ?? '').match(VALUE_MARK)?.[1] === value) return 'exists';
  return issue.state === 'closed' ? 'closed' : 'update';
}

// One Markdown table cell from text the API supplied: no line breaks, and every character that could
// end the cell, start formatting, or open a link, tag, or entity (| \ ` * _ ~ [ ] < > &) backslash-escaped.
export const mdCell = (v) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[\\`*_~[\]<>|&]/g, '\\$&');
// encodeURIComponent leaves ( ) ! * ' ~ alone; ( and ) would end the Markdown link early.
const urlPart = (s) => encodeURIComponent(s).replace(/[()!*'~]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
const ghRepoUrl = (full) => `https://github.com/${full.split('/').map(urlPart).join('/')}`;

const yes = (b) => (b ? 'yes' : '-');
export function rollupBody(res) {
  const top = res.candidates.slice(0, LIMITS.listed);
  const run = process.env.GITHUB_RUN_ID ? ` Run: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
  const ex = res.excluded;
  return [
    `Weekly Rust discovery sweep, ISO week ${res.week} (checked ${res.checked_on}).${run}`,
    '',
    `Search: \`${res.query}\`, sorted by stars. ${res.search.total_count} matched, ${res.search.fetched} fetched. Excluded before checking: ${ex.owner} owned by Dicklesworthstone (the daily watch covers those), ${ex.fork} forks, ${ex.archived} archived, ${ex.assessed} already assessed, ${ex.already_candidate} already candidates. The ${res.checked} most-starred of the rest were checked for agent-built signals; ${res.candidates.length} have at least one, ${res.no_signal} have none and are left out.`,
    '',
    `Nothing here has been assessed. This is a list to triage against the screening rule in [candidates/README.md](${repoLink('candidates/README.md')}). Full list: [watch/discovery/${res.week}.json](${repoLink(`watch/discovery/${res.week}.json`)}).`,
    '',
    '| # | Repository | Stars | Pushed | AGENTS.md | CLAUDE.md | Agent trailers (last 30 commits) | README says agent-built | Score |',
    '|---|---|---|---|---|---|---|---|---|',
    ...top.map((c, i) => `| ${i + 1} | [${mdCell(c.repo)}](${ghRepoUrl(c.repo)}) | ${Number(c.stars)} | ${mdCell(String(c.pushed_at).slice(0, 10))} | ${yes(c.signals.agents_md)} | ${yes(c.signals.claude_md)} | ${Number(c.signals.agent_trailers) || '-'} | ${yes(c.signals.readme_statement)} | ${Number(c.score)} |`),
    ...(top.length ? [] : ['| - | no repository passed this week | | | | | | | |']),
    '',
    '**Triage checklist**',
    `- [ ] Check each row by hand against every predicate in [candidates/README.md](${repoLink('candidates/README.md')}); the signals above are cheap heuristics, not proof.`,
    '- [ ] Rejected rows: one line each in a comment, with the predicate that failed.',
    '- [ ] Accepted rows: open a `[candidate] owner/repo` issue for each (the suggest-a-project form) and link it here.',
    '- [ ] Accepted candidates get a packet written with the Rulebook and the starter kit in one agent session and reviewed in another; results land as a dated cohort, never in the pinned 44.',
    '- [ ] Close this issue when every row is accepted or rejected.',
    '',
    `<!-- discovery-week: ${res.week} -->`,
    `<!-- discovery-value: ${rollupValue(res)} -->`,
  ].join('\n');
}

export async function syncRollup(api, res, issues, bot) {
  if (!bot) throw usageError('syncRollup needs the bot identity');
  const title = rollupTitle(res.week);
  const value = rollupValue(res);
  const issue = issues.find((i) => i.title === title && trustedRollup(i, res.week, bot)) ?? null;
  const decision = dedupeRollup(issue, value);
  const ref = (i) => ({ number: i.number, title: i.title, url: i.html_url });
  const ignored = issues.filter((i) => i.title === title && i !== issue).map((i) => i.number);
  if (decision === 'exists' || decision === 'closed') return { decision, issue: ref(issue), ignored };
  const base = `/repos/${ISSUE_REPO}`;
  const have = new Set();
  for (let page = 1; ; page++) {
    const r = await api.get(`${base}/labels?per_page=100&page=${page}`);
    r.body.forEach((l) => have.add(l.name));
    if (r.body.length < 100) break;
  }
  for (const name of Object.keys(LABELS)) {
    if (!have.has(name)) await api.send('POST', `${base}/labels`, { name, color: LABELS[name][0], description: LABELS[name][1] });
  }
  if (decision === 'create') {
    const made = (await api.send('POST', `${base}/issues`, { title, body: rollupBody(res), labels: ['candidate', 'discovery'] })).body;
    return { decision, issue: ref(made), ignored };
  }
  const edited = (await api.send('PATCH', `${base}/issues/${issue.number}`, { body: rollupBody(res) })).body;
  return { decision, issue: ref(edited), ignored };
}

// ---------------------------------------------------------------- one run
// Everything is fetched and computed before anything is written, so an API failure (exit 3) leaves the
// tree as it was.
export async function runOnce(api, { now, apply = false, issues: fileIssues = false, outDir = OUT_DIR, priorFiles, cohortsDir = COHORTS, check }) {
  const week = isoWeek(now);
  // The identity is resolved before anything is written, like every other API read.
  const bot = fileIssues ? await botIdentity(api) : null;
  const issueList = await listIssues(api);
  const known = knownCandidates(issueList, priorFiles ?? priorDiscovery(outDir), week);
  const res = await discover(api, { now, known, assessed: assessedRepos(cohortsDir), check });
  const out = { result: res, wrote: null, issue: null };
  if (apply) out.wrote = writeResult(res, outDir);
  if (fileIssues) out.issue = await syncRollup(api, res, issueList, bot);
  return out;
}

function printReport(out, api, elapsedMs) {
  const res = out.result;
  const ex = res.excluded;
  console.log(`discover: week ${res.week}, checked ${res.checked_on}`);
  console.log(`query: ${res.query}`);
  console.log(`search: ${res.search.total_count} matched, ${res.search.fetched} fetched${res.search.incomplete_results ? ' (GitHub marked the results incomplete)' : ''}`);
  console.log(`excluded: owner ${ex.owner}, fork ${ex.fork}, archived ${ex.archived}, assessed ${ex.assessed}, already candidate ${ex.already_candidate}`);
  console.log(`checked ${res.checked}; with a signal ${res.candidates.length}; no signal ${res.no_signal}`);
  console.log('');
  console.log('  #  score  stars  agents claude trailers readme  repository');
  res.candidates.slice(0, LIMITS.listed).forEach((c, i) => {
    const s = c.signals;
    console.log(`${String(i + 1).padStart(3)}  ${c.score.toFixed(3)} ${String(c.stars).padStart(6)}  ${yes(s.agents_md).padEnd(6)} ${yes(s.claude_md).padEnd(6)} ${String(s.agent_trailers || '-').padStart(8)} ${yes(s.readme_statement).padEnd(6)}  ${c.url}`);
  });
  console.log('');
  console.log(out.wrote ? `wrote ${out.wrote.replace(`${ROOT}/`, '')}` : 'dry run: nothing written (use --apply)');
  if (out.issue) console.log(`rollup issue: ${out.issue.decision} #${out.issue.issue.number} ${out.issue.issue.url}${out.issue.ignored.length ? `; ignored untrusted same-title issue(s) #${out.issue.ignored.join(', #')}` : ''}`);
  const st = api.stats;
  console.log(`api: ${st.search_calls} search + ${st.rest_calls} REST calls; remaining search ${st.search_remaining ?? '?'}, core ${st.rest_remaining ?? '?'}; ${(elapsedMs / 1000).toFixed(1)} s`);
}

// ---------------------------------------------------------------- selftest (offline)
// In-memory stand-in for the issue, label, and /user endpoints, served through the real transport.
// Issues it creates are authored by `author`, as GitHub records the token's identity.
const SELFTEST_BOT = 'github-actions[bot]';
function memoryGitHub(recorded, author = SELFTEST_BOT) {
  const issues = [];
  const labels = new Set();
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status });
  const recordedFetch = fixtureFetch(recorded);
  const fetchImpl = async (url, init = {}) => {
    const path = url.replace('https://api.github.com', '');
    const method = init.method ?? 'GET';
    const p = path.replace(`/repos/${ISSUE_REPO}`, '').replace(/\?.*$/, '');
    const page = Number(path.match(/[?&]page=(\d+)/)?.[1] ?? 1);
    const payload = init.body ? JSON.parse(init.body) : null;
    if (path.startsWith(`/repos/${ISSUE_REPO}/`)) calls.push(`${method} ${p}`);
    if (method === 'GET' && p === '/user') return json(200, { login: 'selftest-token-owner' });
    if (method === 'GET' && p === '/labels') return json(200, page === 1 ? [...labels].map((name) => ({ name })) : []);
    if (method === 'POST' && p === '/labels') { labels.add(payload.name); return json(201, payload); }
    if (method === 'GET' && p === '/issues') return json(200, page === 1 ? issues.map((i) => ({ ...i })) : []);
    if (method === 'POST' && p === '/issues') {
      const i = { number: issues.length + 1, title: payload.title, body: payload.body, user: { login: author }, labels: payload.labels.map((name) => ({ name })), state: 'open', html_url: `memory:issues/${issues.length + 1}` };
      issues.push(i);
      return json(201, { ...i });
    }
    const m = p.match(/^\/issues\/(\d+)$/);
    if (m && method === 'PATCH') { const i = issues[Number(m[1]) - 1]; Object.assign(i, payload); return json(200, { ...i }); }
    return recordedFetch(url, init);
  };
  return { fetchImpl, issues, labels, calls };
}

async function selftest() {
  const fx = JSON.parse(readFileSync(join(FIXTURES, 'discover-2026-W39.json'), 'utf8'));
  const prior = JSON.parse(readFileSync(join(FIXTURES, 'discover-prior-2026-W38.json'), 'utf8'));
  const now = new Date(fx.recorded_at);
  const quiet = { sleep: async () => {} };
  const noCohorts = join(FIXTURES, 'no-such-cohorts-dir');
  const run = async (responses, opts = {}) => {
    const gh = memoryGitHub(responses);
    for (const i of fx.issues) gh.issues.push({ ...i });
    const api = makeApi({ token: null, fetchImpl: gh.fetchImpl, ...quiet });
    const out = await runOnce(api, { now, priorFiles: [prior], cohortsDir: noCohorts, outDir: join(FIXTURES, 'unused'), ...opts });
    return { out, gh, api };
  };
  const base = await run(fx.responses);
  const res = base.out.result;
  const names = res.candidates.map((c) => c.repo);
  const cases = [];
  const test = (name, fn) => cases.push({ name, fn });
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

  test('ISO week and search window come from the run date', () => {
    const w = [['2026-09-24', '2026-W39'], ['2027-01-01', '2026-W53'], ['2024-12-30', '2025-W01'], ['2026-09-21', '2026-W39'], ['2026-09-20', '2026-W38']];
    for (const [d, want] of w) expect(isoWeek(new Date(`${d}T12:00:00Z`)) === want, `${d}: ${isoWeek(new Date(`${d}T12:00:00Z`))}, want ${want}`);
    expect(res.week === '2026-W39' && res.query === 'language:Rust pushed:>=2026-08-25 created:>=2026-03-28 stars:>=25 fork:false', `week ${res.week}, query ${res.query}`);
  });
  test('scoring and ordering: signal count first, stars break ties', () => {
    expect(JSON.stringify(names) === JSON.stringify(fx.expect.order), `order ${JSON.stringify(names)}`);
    for (const [repo, want] of Object.entries(fx.expect.scores)) {
      const c = res.candidates.find((x) => x.repo === repo);
      expect(c && c.score === want.score && c.signal_count === want.signal_count && JSON.stringify(c.signals) === JSON.stringify(want.signals), `${repo}: ${JSON.stringify(c)}`);
    }
  });
  test('Dicklesworthstone repositories and forks are excluded before checking', () => {
    expect(res.excluded.owner === 1 && res.excluded.fork === 1, `excluded ${JSON.stringify(res.excluded)}`);
    // The fixture records signal responses for these two as well, so a broken exclusion lists them
    // (and this case names it) instead of crashing on an unrecorded path.
    for (const r of fx.expect.excluded_owner_fork) expect(!names.includes(r), `${r} listed`);
  });
  test('a repository with zero signals is left out', () => {
    expect(res.no_signal === 1 && !names.includes(fx.expect.zero_signal), `no_signal ${res.no_signal}, names ${names}`);
  });
  test('already-candidate repositories (a [candidate] issue, an earlier week) are excluded', () => {
    expect(res.excluded.already_candidate === 2, `already_candidate ${res.excluded.already_candidate}`);
    for (const r of fx.expect.already_candidate) expect(!names.includes(r), `${r} listed`);
  });
  test('rollup: one issue per week; rerun finds it (exists); a changed listing edits it; closed is left alone', async () => {
    const gh = memoryGitHub(fx.responses);
    const api = makeApi({ token: null, fetchImpl: gh.fetchImpl, ...quiet });
    const first = await syncRollup(api, res, await listIssues(api), SELFTEST_BOT);
    expect(first.decision === 'create' && gh.issues.length === 1, `first ${first.decision}, ${gh.issues.length} issues`);
    const made = gh.issues[0];
    expect(made.title === '[discovery] Rust candidates, week 2026-W39', `title ${made.title}`);
    expect(JSON.stringify(made.labels.map((l) => l.name)) === '["candidate","discovery"]' && gh.labels.has('candidate') && gh.labels.has('discovery'), 'labels');
    const again = await syncRollup(api, res, await listIssues(api), SELFTEST_BOT);
    expect(again.decision === 'exists' && gh.issues.length === 1, `second ${again.decision}, ${gh.issues.length} issues`);
    const starsMoved = { ...res, candidates: res.candidates.map((c) => ({ ...c, stars: c.stars + 7 })) };
    expect((await syncRollup(api, starsMoved, await listIssues(api), SELFTEST_BOT)).decision === 'exists', 'star counts alone changed the value');
    const changed = { ...res, candidates: res.candidates.slice(1) };
    const upd = await syncRollup(api, changed, await listIssues(api), SELFTEST_BOT);
    expect(upd.decision === 'update' && gh.issues.length === 1 && gh.issues[0].body === rollupBody(changed), `update ${upd.decision}, ${gh.issues.length} issues`);
    gh.issues[0].state = 'closed';
    const before = gh.calls.length;
    const closed = await syncRollup(api, res, await listIssues(api), SELFTEST_BOT);
    expect(closed.decision === 'closed' && gh.issues.length === 1 && gh.calls.slice(before).every((c) => c.startsWith('GET')), `closed ${closed.decision}`);
  });
  // Seeds the store with issues that already carry this week's title, then syncs as the bot.
  const seeded = async (seed) => {
    const gh = memoryGitHub(fx.responses);
    for (const s of seed) gh.issues.push({ number: gh.issues.length + 1, state: 'open', html_url: `memory:issues/${gh.issues.length + 1}`, title: rollupTitle(res.week), ...s });
    const api = makeApi({ token: null, fetchImpl: gh.fetchImpl, ...quiet });
    const snapshot = JSON.stringify(gh.issues);
    return { gh, api, snapshot };
  };
  const both = [{ name: 'candidate' }, { name: 'discovery' }];
  const touched = (gh, n) => gh.calls.some((c) => c === `PATCH /issues/${n}` || c.startsWith(`POST /issues/${n}/`));
  test('a same-title issue opened by anyone but the bot is ignored and left untouched, even with our labels and markers', async () => {
    expect(await botIdentity(null, { GITHUB_ACTIONS: 'true' }) === 'github-actions[bot]', 'Actions identity');
    const who = await seeded([]);
    expect(await botIdentity(who.api, {}) === 'selftest-token-owner', 'local identity is not read from GET /user');
    const { gh, api, snapshot } = await seeded([{ user: { login: 'stranger' }, labels: both, body: rollupBody(res) }]);
    const first = await syncRollup(api, res, await listIssues(api), SELFTEST_BOT);
    expect(first.decision === 'create' && first.issue.number === 2 && JSON.stringify(first.ignored) === '[1]', `first ${JSON.stringify(first)}`);
    const changed = { ...res, candidates: res.candidates.slice(1) };
    const upd = await syncRollup(api, changed, await listIssues(api), SELFTEST_BOT);
    expect(upd.decision === 'update' && upd.issue.number === 2 && gh.issues.length === 2, `then ${JSON.stringify(upd)}`);
    expect(!touched(gh, 1) && JSON.stringify(gh.issues[0]) === JSON.stringify(JSON.parse(snapshot)[0]), 'the stranger issue was edited');
  });
  test('a bot issue without both labels or without the week markers is not trusted', async () => {
    const { gh, api, snapshot } = await seeded([
      { user: { login: SELFTEST_BOT }, labels: [{ name: 'candidate' }], body: rollupBody(res) },
      { user: { login: SELFTEST_BOT }, labels: both, body: 'A hand-written note with the same title.' },
      { user: { login: SELFTEST_BOT }, labels: both, body: rollupBody({ ...res, week: '2026-W38' }) },
    ]);
    const r = await syncRollup(api, res, await listIssues(api), SELFTEST_BOT);
    expect(r.decision === 'create' && r.issue.number === 4 && JSON.stringify(r.ignored) === '[1,2,3]', `got ${JSON.stringify(r)}`);
    expect([1, 2, 3].every((n) => !touched(gh, n)) && JSON.stringify(gh.issues.slice(0, 3)) === JSON.stringify(JSON.parse(snapshot)), 'an untrusted issue was edited');
  });
  test('a repository name with | and formatting characters renders as one table cell', () => {
    const cells = (line) => {
      const out = [''];
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '\\') { out[out.length - 1] += line[i] + (line[i + 1] ?? ''); i++; } else if (line[i] === '|') out.push(''); else out[out.length - 1] += line[i];
      }
      return out;
    };
    const header = rollupBody(res).split('\n').find((l) => l.startsWith('| # |'));
    const nasty = ['ev|il/re*po_`x`', 'a\\|b/c', 'x/<b>[y](z)\n| 9 |', 'o/~~s~~ & &amp;'];
    const body = rollupBody({ ...res, candidates: nasty.map((repo, i) => ({ ...res.candidates[i], repo, pushed_at: `2026-09-2${i}|x` })) });
    const rows = body.split('\n').filter((l) => /^\| \d+ \|/.test(l));
    expect(rows.length === nasty.length, `${rows.length} rows for ${nasty.length} repositories`);
    for (const row of rows) expect(cells(row).length === cells(header).length, `${cells(row).length - 2} cells, want ${cells(header).length - 2}: ${row}`);
    for (const row of rows) expect(!/(?<!\\)[*_`<>~&[\]]/.test(cells(row)[2].replace(/^\s*\[(.*)\]\([^)]*\)\s*$/, '$1')), `unescaped formatting in ${row}`);
    expect(rows.every((r) => /\(https:\/\/github\.com\/[^\s()|<>]+\)/.test(r)), 'a link URL carries a raw special character');
  });
  test('output and rollup carry no email address and no author, committer, name, or login field', () => {
    const text = renderResult(res) + rollupBody(res);
    expect(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), 'an email address is in the output');
    const keys = new Set();
    const walk = (v) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { keys.add(k); walk(x); } };
    walk(res);
    const bad = [...keys].filter((k) => /author|committer|email|name|login|message/i.test(k));
    expect(bad.length === 0, `forbidden keys ${bad}`);
    const recordedTrailers = Object.values(fx.responses).flatMap((r) => (Array.isArray(r.body) ? r.body : [])).filter((c) => hasAgentTrailer(c?.commit?.message)).length;
    expect(recordedTrailers > 0, 'fixture has no agent trailer to leak');
  });
  test('output is byte-identical when the API returns results in another order, with and without the check cap', async () => {
    const shuffled = structuredClone(fx.responses);
    for (const [p, r] of Object.entries(shuffled)) if (p.startsWith('/search/')) r.body.items.reverse();
    const other = await run(shuffled);
    expect(renderResult(other.out.result) === renderResult(res), 'output differs with reversed search order');
    // A cap below the pool size: the capped set must be the most-starred, whatever order the API used.
    const capA = (await run(fx.responses, { check: 4 })).out.result;
    const capB = (await run(shuffled, { check: 4 })).out.result;
    expect(renderResult(capA) === renderResult(capB), 'capped output depends on the API order');
    expect(capA.checked === 4 && JSON.stringify(capA.listed) === JSON.stringify(fx.expect.capped_4), `capped listed ${JSON.stringify(capA.listed)}`);
  });
  test('a 403 stops the run with exit 3 and writes nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'discover-selftest-'));
    try {
      const limited = structuredClone(fx.responses);
      const victim = Object.keys(limited).find((p) => p.endsWith('/readme') && limited[p].status !== 404);
      limited[victim] = { status: 403, body: { message: 'API rate limit exceeded' } };
      let code = null;
      try { await run(limited, { apply: true, issues: true, outDir: dir }); } catch (e) { code = e.code; }
      expect(code === EXIT.API, `exit ${code}`);
      expect(readdirSync(dir).length === 0, `wrote ${readdirSync(dir)}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
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
  return failed === 0 && cases.length > 0 ? EXIT.OK : EXIT.FAIL;
}

// ---------------------------------------------------------------- main
const USAGE = `usage: node watch/discover.mjs [--apply] [--issues] | --selftest
  (no flags)  dry report on stdout; writes nothing (the issue list is read to skip known candidates)
  --apply     write watch/discovery/<ISO-week>.json
  --issues    create or update the week's one rollup issue in ${ISSUE_REPO} (labels candidate, discovery)
  --selftest  offline check on watch/fixtures/discover-*.json
exit: 0 ok, 1 selftest failure, 2 usage/token, 3 GitHub API failure or rate limit (nothing written)`;

function parseArgs(argv) {
  const known = new Set(['--apply', '--issues', '--selftest', '--help', '-h']);
  const flags = argv.filter((a) => a !== '--');
  const bad = flags.filter((a) => !known.has(a));
  if (bad.length) throw usageError(`unknown argument(s): ${bad.join(' ')}\n${USAGE}`);
  const o = { apply: flags.includes('--apply'), issues: flags.includes('--issues'), selftest: flags.includes('--selftest'), help: flags.includes('--help') || flags.includes('-h') };
  if (o.selftest && flags.length > 1) throw usageError(`--selftest takes no other flags\n${USAGE}`);
  return o;
}

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log(USAGE); return EXIT.OK; }
  if (opts.selftest) return selftest();
  const t0 = Date.now();
  const api = makeApi({ token: resolveToken() });
  const out = await runOnce(api, { now: new Date(), apply: opts.apply, issues: opts.issues });
  printReport(out, api, Date.now() - t0);
  return EXIT.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => {
      console.error(`discover: ${e.message}`);
      process.exitCode = e instanceof DiscoverError ? e.code : EXIT.API;
    },
  );
}
