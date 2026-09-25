// watch/freshness/digest.mjs: the weekly watch digest entries of site/feed.xml (SPEC.md FR-G.1, FR-G.2).
//
// readLedger(file)              the crossing ledger watch/crossings.jsonl, one validated event per line
//                               (FR-G.3 key set; event is `opened` or `resolved`); a missing file is an empty ledger
// isoWeek(day)                  '2026-09-24' -> { label: '2026-W39', ... } (ISO 8601 weeks, Monday first)
// digestEntries(events, root)   one Atom entry per ISO week that opened or resolved a crossing, dated the last
//                               day of that week that had an event; quiet weeks get none
// readDigestEntries(root)       digestEntries over the committed ledger: what site/scripts/make-feed.mjs adds
//
// Built only from committed files: the ledger and updates/ (a `resolved` event must name a dated re-check that
// exists there). Informational events never reach the ledger, so they never make an entry. The output is a
// pure function of those files, so the feed stays byte-identical on reruns (gate M). Entry objects use
// make-feed.mjs's shape: { kind, date, sortKey, id, title, summary, links }. Writes no files.
// Node 22 built-ins only.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = 'https://fr.zeststream.ai';
const PROJECT = 'https://github.com/JYeswak/franken-research';
const ENTRY_ID = 'tag:fr.zeststream.ai,2026:';
export const LEDGER = 'watch/crossings.jsonl';
const KEYS = ['date', 'event', 'id', 'repo', 'dim', 'from', 'to', 'source', 'evidence', 'resolved_by'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const RECHECK = /^updates\/[A-Za-z0-9._-]+-\d{4}-\d{2}-\d{2}\.md$/;
const DIM_WORD = { ci: 'CI', rel: 'Release', license: 'License', existence: 'Repository' };
const word = (k) => (Object.hasOwn(DIM_WORD, k) ? DIM_WORD[k] : String(k));
const blob = (path) => `${PROJECT}/blob/main/${path.split('/').map(encodeURIComponent).join('/')}`;

/** One ledger line checked against FR-G.3; throws naming the line. */
export function parseEvent(line, n, root) {
  let e;
  try { e = JSON.parse(line); } catch (err) { throw new Error(`${LEDGER}:${n}: not JSON (${err.message})`); }
  const keys = Object.keys(e ?? {});
  if (keys.join() !== KEYS.join()) throw new Error(`${LEDGER}:${n}: keys ${keys.join(',')}, want ${KEYS.join(',')} in that order`);
  if (!DAY.test(e.date) || Number.isNaN(Date.parse(`${e.date}T00:00:00Z`))) throw new Error(`${LEDGER}:${n}: date ${JSON.stringify(e.date)} is not YYYY-MM-DD`);
  if (e.event !== 'opened' && e.event !== 'resolved') throw new Error(`${LEDGER}:${n}: event ${JSON.stringify(e.event)} is neither opened nor resolved`);
  for (const k of ['id', 'repo', 'dim', 'from', 'to', 'source']) if (typeof e[k] !== 'string' || !e[k]) throw new Error(`${LEDGER}:${n}: ${k} must be a non-empty string`);
  if (e.event === 'resolved') {
    if (!RECHECK.test(String(e.resolved_by))) throw new Error(`${LEDGER}:${n}: a resolved event needs resolved_by updates/<repo>-<date>.md, got ${JSON.stringify(e.resolved_by)}`);
    if (!existsSync(join(root, e.resolved_by))) throw new Error(`${LEDGER}:${n}: resolved_by ${e.resolved_by} is not a committed file`);
  } else if (e.resolved_by !== null) throw new Error(`${LEDGER}:${n}: an opened event has resolved_by null`);
  return e;
}

export function readLedger(file, root) {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  if (text && !text.endsWith('\n')) throw new Error(`${LEDGER}: the last line has no newline (an interrupted append?)`);
  return text.split('\n').slice(0, -1).map((l, i) => parseEvent(l, i + 1, root));
}

/** ISO 8601 week of a YYYY-MM-DD day (UTC): the week belongs to the year of its Thursday. */
export function isoWeek(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday 0 ... Sunday 6
  const thursday = new Date(d.getTime() + (3 - dow) * 86400000);
  const year = thursday.getUTCFullYear();
  const week = 1 + Math.floor((thursday - Date.UTC(year, 0, 1)) / (7 * 86400000));
  return { year, week, label: `${year}-W${String(week).padStart(2, '0')}` };
}

const byDateThenId = (a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const move = (e) => `${e.repo} ${word(e.dim)} ${e.from} \u2192 ${e.to}`;
const openedText = (e) => `${move(e)} (${e.date}, ${e.source})`;
const resolvedText = (e) => `${move(e)} by ${e.resolved_by} (${e.date})`;

/** One entry for one ISO week's events. */
function weekEntry(label, events) {
  const opened = events.filter((e) => e.event === 'opened').sort(byDateThenId);
  const resolved = events.filter((e) => e.event === 'resolved').sort(byDateThenId);
  const date = events.map((e) => e.date).sort().at(-1);
  const parts = [];
  if (opened.length) parts.push(`Opened: ${opened.map(openedText).join('; ')}.`);
  if (resolved.length) parts.push(`Resolved: ${resolved.map(resolvedText).join('; ')}.`);
  parts.push('A crossing is a computed class, or the repository itself, moving since the pin. It is a flag, not a verdict: only a dated re-check changes a verdict. Source: watch/crossings.jsonl.');
  const rechecks = [...new Set(resolved.map((e) => e.resolved_by))].sort();
  return {
    kind: 'digest', date, sortKey: label,
    id: `${ENTRY_ID}digest/${label}`,
    title: `Watch digest ${label}: ${opened.length} crossing${opened.length === 1 ? '' : 's'} opened, ${resolved.length} resolved`,
    summary: parts.join(' '),
    links: [
      { rel: 'alternate', type: 'text/html', href: `${SITE_URL}/updates/` },
      { rel: 'related', type: 'text/plain', href: blob(LEDGER) },
      ...rechecks.map((p) => ({ rel: 'related', type: 'text/markdown', href: blob(p) })),
    ],
  };
}

/** Entries for every ISO week with at least one opened or resolved crossing, newest week first. */
export function digestEntries(events) {
  const weeks = new Map();
  for (const e of events) {
    const { label } = isoWeek(e.date);
    if (!weeks.has(label)) weeks.set(label, []);
    weeks.get(label).push(e);
  }
  return [...weeks.keys()].sort().reverse().map((label) => weekEntry(label, weeks.get(label)));
}

export function readDigestEntries(root, file = join(root, LEDGER)) {
  return digestEntries(readLedger(file, root));
}
