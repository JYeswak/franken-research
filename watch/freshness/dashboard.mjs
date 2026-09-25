// watch/freshness/dashboard.mjs: the single living dashboard issue (SPEC.md FR-D.1 to FR-D.6, FR-O.4, FR-O.5).
//
//   node watch/freshness/dashboard.mjs --sync watch/live.json            sync the issue from the committed file
//   node watch/freshness/dashboard.mjs --sync watch/live.json --dry-run  print the planned action and the body
//
// The scheduled workflow runs --sync as its last step, after the gate chain and the push (FR-D.5), so the issue
// is rendered only from a committed watch/live.json: a file that is untracked or differs from HEAD is refused, and
// so is a checkout whose HEAD is not the tip of the default branch on GitHub, read from the API at sync time (a
// feature branch, a detached HEAD elsewhere, a main that moved on, or a failed read). A refusal makes no issue
// lookup, in --dry-run too: --dry-run then prints the rendered body with the plan's action as not determined.
// Token: GITHUB_TOKEN, else GH_TOKEN, else `gh auth token` (watch.mjs resolveToken); it is never printed.
// Prints DASHBOARD_OK action=... issue=#N ignored=N closed_duplicates=N, or DASHBOARD_PLAN ... and the body
// with --dry-run, or DASHBOARD_FAIL <reason>. Exit: 0 ok; 1 sync failed or refused by the FR-D.6 bound, and a
// failed sync leaves the pushed files as they are; 2 usage, input, token, an uncommitted live.json, or a checkout
// that is not the default branch's GitHub tip.
//
// renderDashboard(live, { snapshots })   the issue body, a pure function of watch/live.json and the snapshot
//                                        rows of ops/schedule.tsv (read from the repository when not given)
// syncDashboard(api, live, { bot, dryRun, snapshots })
//                                        keeps one canonical issue titled `[watch] Freshness dashboard`: creates it,
//                                        edits its body only when the rendered body differs, reopens it when it
//                                        was closed, and closes newer trusted copies with a comment linking it;
//                                        returns { action, number, ignored, duplicates, closed, body }
//
// Finding the issue is bounded (FR-D.6): issues labelled `dashboard` that the token's identity opened, any state,
// at most 3 pages of 100. A listing that reaches the bound or returns something other than a list throws
// DashboardError before anything is created or edited. Trust follows the issue trust rule of watch/README.md:
// an issue counts as the dashboard only if the token's own identity authored it, it carries the labels `watch`
// and `dashboard`, and its body has the marker line <!-- watch-dashboard: v1 -->. A listed issue that fails
// any of these is never changed; its number is returned in `ignored`. Upstream text reaches the body only
// through mdText (watch.mjs), and a URL becomes a link only through hrefOf (card.mjs). Bodies stay within
// GitHub's 65,536-character limit; a cut body ends at a line boundary with a link to watch/live.json.
// Changes no file. Node 22 built-ins only.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as watch from '../watch.mjs';
import { UNKNOWN_WORDS, hrefOf, readLive } from './card.mjs';

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
/** [text](href) when hrefOf (card.mjs) gives an href (parentheses percent-encoded so the link cannot close early), else escaped URL text. */
export const mdLink = (url, text) => {
  const href = hrefOf(url);
  return href ? `[${text}](${href.replace(/\(/g, '%28').replace(/\)/g, '%29')})` : mdText(url);
};
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
  const pending = live.repos.flatMap((r) => r.pending ?? []);
  const back = pending.filter((p) => p.phase === 'withdrawing').length;
  const inf = live.informational ?? {};
  return section('Informational', [
    `- Events that moved no computed class: ${Number(inf.events_today ?? 0)} today, ${Number(inf.events_since_pin ?? 0)} since the pins.`,
    `- Crossings seen once, not yet open: ${pending.length - back}.`,
    `- Open crossings whose class is back at its baseline, withdrawn if the next daily check agrees: ${back}.`,
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

/** The whole body before the length limit is applied. */
export function dashboardText(live, { snapshots = readSnapshots() } = {}) {
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
  return lines.join('\n') + '\n';
}

export const renderDashboard = (live, opts) => fitBody(dashboardText(live, opts));

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

/** A sync that must not proceed (FR-D.6 bound or incomplete listing): nothing was created or edited. */
export class DashboardError extends Error {}
export const MAX_PAGES = 3;

/**
 * The issues labelled `dashboard` that the token's identity opened, any state, oldest first (FR-D.6). Reads at most
 * MAX_PAGES pages of 100; a full last page, or a page that is not a list, throws DashboardError (fail closed).
 */
export async function listDashboardIssues(api, base, bot) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await api.rest('GET', `${base}/issues?labels=dashboard&creator=${encodeURIComponent(bot)}&state=all&per_page=100&page=${page}&sort=created&direction=asc`);
    if (!Array.isArray(r?.body)) throw new DashboardError(`incomplete issue listing: page ${page} is not a list; nothing created or edited`);
    for (const i of r.body) if (!i.pull_request) all.push(i);
    if (r.body.length < 100) return all;
  }
  throw new DashboardError(`issue listing reached its bound of ${MAX_PAGES} pages of 100 without ending; nothing created or edited`);
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

const issueUrl = (n) => `https://github.com/${ISSUE_REPO}/issues/${n}`;
export const duplicateComment = (canonical) => `This is a duplicate of the canonical freshness dashboard, #${canonical} (${issueUrl(canonical)}), which is the oldest trusted one. The watch closes newer copies and keeps editing #${canonical}.`;

/** Newer trusted dashboards that are still open: each gets a comment linking the canonical issue, then is closed (FR-D.1). */
async function closeDuplicates(api, base, canonical, duplicates) {
  const closed = [];
  for (const d of duplicates) {
    if (d.state === 'closed') continue;
    await api.rest('POST', `${base}/issues/${d.number}/comments`, { body: duplicateComment(canonical) });
    await api.rest('PATCH', `${base}/issues/${d.number}`, { state: 'closed' });
    closed.push(d.number);
  }
  return closed;
}

export async function syncDashboard(api, live, { bot, dryRun = false, snapshots } = {}) {
  if (typeof bot !== 'string' || !bot) throw new Error('syncDashboard needs the bot login the token acts as');
  const base = `/repos/${ISSUE_REPO}`;
  const body = renderDashboard(live, snapshots ? { snapshots } : undefined);
  const same = (await listDashboardIssues(api, base, bot)).filter((i) => i.title === TITLE);
  const trusted = same.filter((i) => trustedDashboard(i, bot)).sort((a, b) => a.number - b.number);
  const ignored = same.filter((i) => !trustedDashboard(i, bot)).map((i) => i.number);
  const issue = trusted[0] ?? null;
  const action = decide(issue, body);
  const result = { action, number: issue?.number ?? null, ignored, duplicates: trusted.slice(1).map((i) => i.number), closed: [], body };
  if (dryRun) return result;
  if (action === 'created') {
    await ensureLabels(api, base);
    result.number = (await api.rest('POST', `${base}/issues`, { title: TITLE, body, labels: LABELS })).body.number;
  } else if (action !== 'unchanged') {
    await api.rest('PATCH', `${base}/issues/${issue.number}`, action === 'reopened' ? { state: 'open', body } : { body });
  }
  if (issue) result.closed = await closeDuplicates(api, base, issue.number, trusted.slice(1));
  return result;
}

// ---------- command line (FR-D.5) ----------
const USAGE = 'usage: node watch/freshness/dashboard.mjs --sync watch/live.json [--dry-run]';
class UsageError extends Error {}

/** Refuses a live.json that is outside the repository, untracked, or different from HEAD. */
export function assertCommitted(file, root = ROOT) {
  const rel = relative(root, file);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new UsageError(`${file} is outside the repository`);
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' }).status;
  if (git('ls-files', '--error-unmatch', '--', rel.split(sep).join('/')) !== 0) throw new UsageError(`${rel} is not committed`);
  if (git('diff', '--quiet', 'HEAD', '--', rel.split(sep).join('/')) !== 0) throw new UsageError(`${rel} differs from HEAD; the dashboard is rendered only from the committed file`);
}

/** The local checkout: the commit HEAD names, and the branch it is on (null when HEAD is detached). */
export function headState(root = ROOT) {
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
  const head = git('rev-parse', '--verify', 'HEAD').stdout?.trim() ?? '';
  if (!/^[0-9a-f]{40}$/.test(head)) throw new UsageError('cannot read HEAD of the checkout');
  const b = git('symbolic-ref', '--quiet', '--short', 'HEAD');
  return { head, branch: b.status === 0 ? b.stdout.trim() : null };
}

/** The checkout is not the canonical default-branch tip, or that tip could not be read: the sync must not run. */
export class NotCanonical extends Error {}

/**
 * FR-D.5: resolves only when the checkout is the tip of the repository's default branch on GitHub, read now:
 * not on another branch, and HEAD equal to the tip (a detached checkout at the tip passes). A failed or malformed
 * API read refuses too (fail closed). Returns { branch, tip }.
 */
export async function assertCanonical(api, { head, branch }) {
  let def;
  let tip;
  try {
    def = (await api.rest('GET', `/repos/${ISSUE_REPO}`))?.body?.default_branch;
    if (typeof def !== 'string' || !def) throw new Error('the repository record has no default_branch');
    tip = (await api.rest('GET', `/repos/${ISSUE_REPO}/commits/${encodeURIComponent(def)}`))?.body?.sha;
    if (!/^[0-9a-f]{40}$/.test(String(tip ?? ''))) throw new Error(`no commit sha for ${def}`);
  } catch (e) {
    throw new NotCanonical(`cannot read the default-branch tip from GitHub (${String(e?.message ?? e).split('\n')[0]}); refusing to sync`);
  }
  const s = (x) => x.slice(0, 7);
  if (branch && branch !== def) throw new NotCanonical(`the checkout is on branch ${branch}, not ${def}; only ${def} at its GitHub tip ${s(tip)} may sync`);
  if (head !== tip) {
    throw new NotCanonical(branch
      ? `HEAD ${s(head)} is not the GitHub tip ${s(tip)} of ${def}: ${def} has moved past it, or it is not pushed; refusing to sync`
      : `HEAD is detached at ${s(head)}, not at the GitHub tip ${s(tip)} of ${def}; refusing to sync`);
  }
  return { branch: def, tip };
}

async function defaultClient() {
  let token;
  try { token = watch.resolveToken(); } catch (e) { throw new UsageError(e.message); }
  const api = watch.makeApi(token);
  return { api, bot: await watch.botLogin(api) };
}

/** What --dry-run prints after a canonical-tip refusal: the body only, since no issue is looked up (FR-D.5). */
function refusedPlan(live, out) {
  out('DASHBOARD_PLAN action=not-determined issue=not-looked-up (refused before any issue lookup)');
  out('');
  out(renderDashboard(live));
}

/**
 * The CLI, with its collaborators injectable for tests: `client()` gives { api, bot }, `committed(file)` throws
 * when the file is not committed, `local()` gives the checkout's { head, branch }, `out(line)` prints. Returns the
 * exit code. A checkout that is not the default branch's GitHub tip is refused with exit 2 and no issue lookup,
 * in --dry-run too; --dry-run then prints the rendered body with the plan's action shown as not determined.
 */
export async function main(argv, { client = defaultClient, committed = assertCommitted, local = headState, out = (l) => console.log(l) } = {}) {
  const k = argv.indexOf('--sync');
  const known = new Set(['--sync', '--dry-run']);
  let input = true; // usage, the committed check, live.json and HEAD come before any API call; they fail with exit 2
  try {
    if (k < 0 || !argv[k + 1] || argv[k + 1].startsWith('--') || argv.some((a, j) => a.startsWith('--') && !known.has(a) && j !== k + 1)) throw new UsageError(USAGE);
    const file = resolve(argv[k + 1]);
    committed(file);
    const live = readLive(file);
    const dryRun = argv.includes('--dry-run');
    const here = local();
    input = false; // from here a failure is a failed sync (exit 1), except a missing token or a refusal (exit 2)
    const { api, bot } = await client();
    try {
      await assertCanonical(api, here);
    } catch (e) {
      if (!(e instanceof NotCanonical)) throw e;
      out(`DASHBOARD_FAIL ${e.message}`);
      if (dryRun) refusedPlan(live, out);
      return 2;
    }
    const r = await syncDashboard(api, live, { bot, dryRun });
    const issue = r.number == null ? 'none' : `#${r.number}`;
    if (dryRun) {
      out(`DASHBOARD_PLAN action=${r.action} issue=${issue} ignored=${r.ignored.length} duplicates_to_close=${r.duplicates.length}`);
      out('');
      out(r.body);
    } else out(`DASHBOARD_OK action=${r.action} issue=${issue} ignored=${r.ignored.length} closed_duplicates=${r.closed.length}`);
    return 0;
  } catch (e) {
    out(`DASHBOARD_FAIL ${String(e?.message ?? e).split('\n')[0]}`);
    return input || e instanceof UsageError || e?.code === 2 ? 2 : 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
