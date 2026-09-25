// watch/freshness/dashboard.mjs: the single living dashboard issue (SPEC.md FR-D.1 to FR-D.4, FR-O.4, FR-O.5).
//
// renderDashboard(live, { snapshots })   the issue body, a pure function of watch/live.json and the snapshot
//                                        rows of ops/schedule.tsv (read from the repository when not given)
// syncDashboard(api, live, { bot, dryRun, snapshots })
//                                        keeps exactly one issue titled `[watch] Freshness dashboard`: creates it,
//                                        edits its body only when the rendered body differs, reopens it when it
//                                        was closed; returns { action, number, ignored, duplicates }
//
// Trust follows the issue trust rule of watch/README.md: an issue counts as the dashboard only if the
// token's own identity authored it, it carries the labels `watch` and `dashboard`, and its body has the marker
// line <!-- watch-dashboard: v1 -->. A same-title issue that fails any of these is never edited; its number is
// returned in `ignored`. Upstream text reaches the body only through mdText (watch.mjs), and a URL becomes a
// link only when it is an absolute https URL. Bodies stay within GitHub's 65,536-character limit; a cut body
// ends with a link to watch/live.json. api is watch.mjs makeApi(token); bot is watch.mjs botLogin(api).
// Writes no files. Node 22 built-ins only.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as watch from '../watch.mjs';
import { UNKNOWN_WORDS } from './card.mjs';

const { mdText } = watch;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ISSUE_REPO = 'JYeswak/franken-research';
const PROJECT = `https://github.com/${ISSUE_REPO}`;
const UPSTREAM = 'https://github.com/Dicklesworthstone';
const SITE = 'https://fr.zeststream.ai';
export const TITLE = '[watch] Freshness dashboard';
export const LABELS = ['watch', 'dashboard'];
export const MARKER = '<!-- watch-dashboard: v1 -->';
export const LIMIT = 65536;
export const SNAPSHOT_MAX_DAYS = 30;
const DAY_MS = 86400000;

// ---------- Markdown pieces ----------
const blob = (path) => `${PROJECT}/blob/main/${String(path).split('/').map(encodeURIComponent).join('/')}`;
const SAFE_URL = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s"'<>`\\]*)?$/;
/** [text](url) for an absolute https URL (parentheses percent-encoded so the link cannot close early), else escaped text. */
export const mdLink = (url, text) => (SAFE_URL.test(String(url ?? ''))
  ? `[${text}](${String(url).replace(/\(/g, '%28').replace(/\)/g, '%29')})`
  : mdText(url));
const day = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso ?? '')) ? String(iso).slice(0, 10) : 'unknown');
const utc = (iso) => {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(String(iso ?? ''));
  if (!m) throw new Error(`checked_at ${JSON.stringify(iso)} is not an ISO UTC time`);
  return `${m[1]} ${m[2]} UTC`;
};
const DIM_WORD = { ci: 'CI', rel: 'Release', license: 'License', existence: 'Repository' };
const word = (map, k) => (Object.hasOwn(map, k) ? map[k] : mdText(k));
const repoLink = (repo) => mdLink(`${UPSTREAM}/${encodeURIComponent(repo)}`, mdText(repo));
const evidence = (urls) => ((Array.isArray(urls) && urls.length) ? urls.map((u, i) => mdLink(u, String(i + 1))).join(' ') : 'none');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)];
const section = (title, lines) => ['', `## ${title}`, '', ...lines];
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ---------- sections, in FR-D.3 order ----------
export function openCrossings(live) {
  const out = [];
  for (const r of live.repos) for (const c of r.crossings ?? []) if (!c.resolved_by) out.push({ repo: r, c });
  return out.sort((a, b) => (a.repo.repo < b.repo.repo ? -1 : a.repo.repo > b.repo.repo ? 1 : 0) || (a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : 0));
}

function changedSection(live) {
  const rows = openCrossings(live).map(({ repo: r, c }) => [
    repoLink(r.repo), word(DIM_WORD, c.dim), mdText(c.from), mdText(c.to), mdText(day(c.since)), mdText(c.source),
    evidence(c.evidence), `${mdLink(blob(r.packet), 'packet')}, ${mdLink(blob('updates/METHOD.md'), 'method')}`,
  ]);
  return section('Changed', rows.length
    ? ['Open crossings: a computed class moved since the pin, or the repository itself changed. Each stays open until a dated re-check `updates/<repo>-<date>.md` records the class at its own pin.', '',
      ...table(['Repo', 'Dimension', 'From', 'To', 'Since', 'Source', 'Evidence', 'Re-check'], rows)]
    : ['No open crossings.']);
}

function dueSection(live) {
  const rows = live.repos.filter((r) => r.due?.due).map((r) => [
    repoLink(r.repo), mdText(r.due.reason ?? 'no reason recorded'),
    `${mdText(day(r.baseline?.date))} (${r.baseline?.source === 'packet' ? mdLink(blob(r.packet), 'packet') : mdLink(blob(r.baseline?.source), mdText(r.baseline?.source))})`,
  ]);
  return section('Due for re-check', rows.length ? table(['Repo', 'Reason', 'Baseline'], rows) : ['Nothing is due.']);
}

/** The classifier's reason in plain words when it names a known FR-C.3 rule, followed by the reason as recorded. */
function whyText(why) {
  const rule = /FR-C\.3\/[a-z-]+/.exec(String(why ?? ''))?.[0];
  return rule && Object.hasOwn(UNKNOWN_WORDS, rule) ? `${UNKNOWN_WORDS[rule]} (${mdText(why)})` : mdText(why);
}

function unknownSection(live) {
  const rows = (live.unknowns ?? []).map((u) => [repoLink(u.repo), word(DIM_WORD, u.dim), whyText(u.why)]);
  return section('Unknown', rows.length ? table(['Repo', 'Dimension', 'Why'], rows) : ['The watch read every repository and dimension.']);
}

function candidateSection(live) {
  const rows = (live.candidates ?? []).map((c) => [repoLink(c.repo), mdText(day(c.created_at)), (c.reasons ?? []).map(mdText).join('; ')]);
  return section('New repositories flagged as candidates', rows.length
    ? [`Screening rule: ${mdLink(blob('candidates/README.md'), 'candidates/README.md')}.`, '', ...table(['Repo', 'Created', 'Why flagged'], rows)]
    : ['None.']);
}

function revisitSection(live) {
  const withHuman = live.repos.filter((r) => (r.revisit?.human ?? 0) > 0);
  const n = withHuman.reduce((s, r) => s + r.revisit.human, 0);
  return section('Revisit triggers a machine cannot observe', [
    `${plural(n, 'trigger')} across ${plural(withHuman.length, 'repository', 'repositories')} ${n === 1 ? 'needs' : 'need'} a person to check ${n === 1 ? 'it' : 'them'}. They are listed, never alerted: ${mdLink(blob('watch/freshness/revisit.tsv'), 'watch/freshness/revisit.tsv')}.`,
  ]);
}

function informationalSection(live) {
  const t = live.totals ?? {};
  const pending = live.repos.reduce((s, r) => s + (r.pending ?? []).length, 0);
  const inf = live.informational ?? {};
  return section('Informational', [
    `- Events that moved no computed class: ${Number(inf.events_today ?? 0)} today, ${Number(inf.events_since_pin ?? 0)} since the pins.`,
    `- Crossings seen once, not yet open: ${pending}.`,
    `- Repository states: ${Number(t.current ?? 0)} current, ${Number(t.changed ?? 0)} changed, ${Number(t.due ?? 0)} due, ${Number(t.unknown ?? 0)} unknown.`,
  ]);
}

// ---------- FR-O.5: vendored snapshot ages ----------
/** ops/schedule.tsv snapshot rows: { status: 'ok' | 'missing' | 'no-column', rows: [{ artifact, built }] }. */
export function readSnapshots(file = join(ROOT, 'ops', 'schedule.tsv')) {
  if (!existsSync(file)) return { status: 'missing', rows: [] };
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  const head = (lines[0] ?? '').split('\t');
  const a = head.indexOf('artifact');
  const b = head.indexOf('snapshot_built');
  if (a < 0 || b < 0) return { status: 'no-column', rows: [] };
  const rows = lines.slice(1).map((l) => l.split('\t')).filter((c) => /^\d{4}-\d{2}-\d{2}$/.test((c[b] ?? '').trim()))
    .map((c) => ({ artifact: c[a].trim(), built: c[b].trim() }));
  return { status: 'ok', rows };
}

/** Whole days from a snapshot's build date to the run's checked_at. */
export const snapshotAge = (built, checkedAt) => Math.floor((Date.parse(checkedAt) - Date.parse(`${built}T00:00:00Z`)) / DAY_MS);

function snapshotSection(live, snaps) {
  if (snaps.status === 'missing') return section('Vendored snapshots', ['ops/schedule.tsv is missing, so snapshot ages are unknown.']);
  if (snaps.status === 'no-column') return section('Vendored snapshots', ['ops/schedule.tsv has no `artifact` and `snapshot_built` columns, so snapshot ages are unknown.']);
  if (!snaps.rows.length) return section('Vendored snapshots', ['No vendored snapshots are listed in ops/schedule.tsv.']);
  const rows = snaps.rows.map((s) => {
    const age = snapshotAge(s.built, live.checked_at);
    return [mdText(s.artifact), mdText(s.built), `${age} days`, age > SNAPSHOT_MAX_DAYS ? `due for rebuild (over ${SNAPSHOT_MAX_DAYS} days)` : 'fresh'];
  });
  return section('Vendored snapshots', table(['Snapshot', 'Built', 'Age', 'Status'], rows));
}

// ---------- the body ----------
function preamble(live) {
  const t = live.totals ?? {};
  const split = Number.isInteger(t.pinned) && Number.isInteger(t.cohort) ? ` (${t.pinned} pinned, ${t.cohort} from cohort matrices)` : '';
  return [
    MARKER,
    'The daily watch keeps this one issue current and edits it in place (watch/freshness/SPEC.md FR-D). It lists computed facts only; only a dated re-check under `updates/` changes a verdict.',
    '',
    `Last run: ${utc(live.checked_at)}. Watched: ${Number(t.repos ?? live.repos.length)} repositories${split}. Data: ${mdLink(blob('watch/live.json'), 'watch/live.json')}.`,
  ];
}

const TAIL = `\n\nThe rest did not fit in GitHub's ${LIMIT.toLocaleString('en-US')}-character issue limit. Full data: ${mdLink(blob('watch/live.json'), 'watch/live.json')}`;

/** Cut `body` at a line boundary so that body + TAIL fits in LIMIT; unchanged when it already fits. */
export function fitBody(body, limit = LIMIT) {
  if (body.length <= limit) return body;
  const room = limit - TAIL.length;
  const cut = body.lastIndexOf('\n', room);
  return body.slice(0, cut > 0 ? cut : room) + TAIL;
}

export function renderDashboard(live, { snapshots = readSnapshots() } = {}) {
  const lines = [
    ...preamble(live),
    ...changedSection(live),
    ...dueSection(live),
    ...unknownSection(live),
    ...candidateSection(live),
    ...revisitSection(live),
    ...informationalSection(live),
    ...snapshotSection(live, snapshots),
  ];
  return fitBody(lines.join('\n') + '\n');
}

// ---------- the issue ----------
const labelNames = (i) => (i?.labels ?? []).map((l) => (typeof l === 'string' ? l : l?.name));
const MARKER_LINE = /^<!-- watch-dashboard: v1 -->$/m;
/** The trust rule of FR-D.2: our identity, both labels, the marker line. */
export const trustedDashboard = (issue, bot) => typeof bot === 'string' && bot !== '' && issue?.user?.login === bot
  && LABELS.every((l) => labelNames(issue).includes(l)) && MARKER_LINE.test(issue.body ?? '');

/** What the run must do to the trusted issue (null when there is none) so it carries `body`. */
export function decide(issue, body) {
  if (!issue) return 'created';
  if (issue.state === 'closed') return 'reopened';
  return issue.body === body ? 'unchanged' : 'edited';
}

async function allIssues(api, base) {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await api.rest('GET', `${base}/issues?state=all&per_page=100&page=${page}&sort=created&direction=asc`);
    for (const i of r.body) if (!i.pull_request) all.push(i);
    if (r.body.length < 100) break;
  }
  return all;
}

async function ensureLabels(api, base) {
  const have = new Set();
  for (let page = 1; ; page++) {
    const r = await api.rest('GET', `${base}/labels?per_page=100&page=${page}`);
    r.body.forEach((l) => have.add(l.name));
    if (r.body.length < 100) break;
  }
  for (const name of LABELS) {
    if (have.has(name)) continue;
    const spec = watch.LABELS?.[name];
    if (!spec) throw new Error(`label ${name} is missing in ${ISSUE_REPO} and watch.mjs LABELS has no colour and description for it`);
    await api.rest('POST', `${base}/labels`, { name, color: spec[0], description: spec[1] });
  }
}

export async function syncDashboard(api, live, { bot, dryRun = false, snapshots } = {}) {
  if (typeof bot !== 'string' || !bot) throw new Error('syncDashboard needs the bot login the token acts as');
  const base = `/repos/${ISSUE_REPO}`;
  const body = renderDashboard(live, snapshots ? { snapshots } : undefined);
  const same = (await allIssues(api, base)).filter((i) => i.title === TITLE);
  const trusted = same.filter((i) => trustedDashboard(i, bot)).sort((a, b) => a.number - b.number);
  const ignored = same.filter((i) => !trustedDashboard(i, bot)).map((i) => i.number);
  const duplicates = trusted.slice(1).map((i) => i.number);
  const issue = trusted[0] ?? null;
  const action = decide(issue, body);
  const result = { action, number: issue?.number ?? null, ignored, duplicates };
  if (dryRun || action === 'unchanged') return result;
  if (action === 'created') {
    await ensureLabels(api, base);
    result.number = (await api.rest('POST', `${base}/issues`, { title: TITLE, body, labels: LABELS })).body.number;
  } else {
    await api.rest('PATCH', `${base}/issues/${issue.number}`, action === 'reopened' ? { state: 'open', body } : { body });
  }
  return result;
}
