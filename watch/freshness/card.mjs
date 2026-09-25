// watch/freshness/card.mjs: the live card on every brief (SPEC.md FR-L.3, FR-L.4, FR-L.5).
//
// renderCard(rec, live)            the card's HTML for one repository record of watch/live.json
// applyCard(rel, html, rec, live)  `html` with its <!-- live:card --> region rendered fresh; on a brief that has
//                                  no region yet, the region is placed just before <main id="main-content">
//                                  (after the brief's vocabulary block, which defines CI, pin and rider first)
// checkBriefs(site, live)          every problem gate W3 reports: a brief without a region or a record, a region
//                                  that differs from a fresh render, a record whose brief file is missing
//
// The card holds computed facts only. It shows its state in words, never in colour alone, and it never says
// or implies that a verdict changed: only a dated re-check under updates/ does that (FR-L.4, FR-T.8). It is
// plain server-rendered HTML with inline styles on the brief's own CSS variables, like the since-pin notes,
// so it needs no script and no new stylesheet. Upstream strings (tag names, URLs) are HTML-escaped, and a URL
// becomes a link only when it is an absolute https URL. Writes nothing; site/scripts/make-live.mjs writes.
// Node 22 built-ins only.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const OPEN = '<!-- live:card -->';
export const CLOSE = '<!-- /live:card -->';
export const SCHEMA = 'fr.watch.live/v1';
// FR-L.4: the one sentence a `changed` card uses.
export const CHANGED_TEXT = 'a computed class moved since the pin; the verdict has not been re-checked';
const PROJECT = 'https://github.com/JYeswak/franken-research';
const UPSTREAM = 'https://github.com/Dicklesworthstone';
const ANCHOR = '<main id="main-content">';

export class LiveError extends Error {}

// ---------- escaping and small formatters ----------
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const SAFE_URL = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s"'<>`\\]*)?$/;
/** A link when `url` is an absolute https URL, else the escaped text without a link. */
export const link = (url, text, label) => (SAFE_URL.test(String(url ?? ''))
  ? `<a href="${esc(url)}"${label ? ` aria-label="${esc(label)}"` : ''}>${text}</a>`
  : text);
const REPO_NAME = /^[A-Za-z0-9._-]+$/;
const SHA = /^[0-9a-f]{7,40}$/;
const day = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso ?? '')) ? String(iso).slice(0, 10) : 'unknown');
/** "2026-09-24T06:12:45Z" -> "2026-09-24 06:12 UTC" */
export const utc = (iso) => {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?Z$/.exec(String(iso ?? ''));
  if (!m) throw new LiveError(`checked_at ${JSON.stringify(iso)} is not an ISO UTC time`);
  return `${m[1]} ${m[2]} UTC`;
};
const blob = (path) => `${PROJECT}/blob/main/${path.split('/').map(encodeURIComponent).join('/')}`;
const upstream = (repo, rest) => (REPO_NAME.test(repo) ? `${UPSTREAM}/${repo}${rest}` : null);
/** A short commit id, linked to the upstream commit when both the repo name and the sha are well formed. */
const commit = (repo, sha) => (SHA.test(String(sha ?? ''))
  ? link(upstream(repo, `/commit/${sha}`), `<code>${esc(sha.slice(0, 7))}</code>`)
  : 'unknown');

// ---------- the vocabulary the card speaks ----------
export const DIM_WORD = { ci: 'CI', rel: 'Release', license: 'License', existence: 'Repository' };
const DIMS = ['ci', 'rel', 'license'];
const SOURCE_WORD = {
  class: 'computed class moved',
  'event-fallback': 'event rule; this dimension is not tracked',
  existence: 'repository status',
  revisit: 'a revisit trigger from the packet',
};
// State badge: the word carries the meaning, the colour only repeats it. Colours are the brief's own CSS
// variables; each reads at 5:1 or better on the card's --bg-2 background.
export const STATE = {
  current: { word: 'Current', colour: 'var(--green)' },
  changed: { word: 'Changed', colour: 'var(--amber)' },
  due: { word: 'Due for re-check', colour: 'var(--accent)' },
  unknown: { word: 'Unknown', colour: 'var(--muted)' },
};

/** What follows the badge: what this state means for the verdict. "State: <badge> ..." reads as one sentence. */
export function stateSentence(rec) {
  if (rec.state === 'changed') return `, meaning ${CHANGED_TEXT}.`;
  if (rec.state === 'current') return ', meaning no computed class has moved since the pin.';
  if (rec.state === 'due') return `: ${esc(rec.due?.reason ?? 'no reason recorded')}. The verdict stands until a dated re-check is filed.`;
  if (rec.state === 'unknown') {
    const dims = DIMS.filter((d) => [rec.dims[d].at_pin, rec.dims[d].at_baseline, rec.dims[d].now].includes('unknown')).map((d) => DIM_WORD[d]);
    const what = dims.length ? `the ${dims.join(', ')} class` : 'part of this repository';
    return `, meaning the watch could not read ${what} (${esc(rec.state_reason ?? 'no reason recorded')}). That is not evidence of a change.`;
  }
  throw new LiveError(`${rec.repo}: state ${JSON.stringify(rec.state)} is not current, changed, due or unknown`);
}

// ---------- pieces ----------
const S = {
  card: 'max-width:900px;margin:22px max(16px, calc((100% - 900px) / 2)) 0;padding:14px 16px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg-2);font-family:var(--sans);font-size:15px;line-height:1.6;color:var(--ink)',
  h: 'margin:0 0 6px;font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted)',
  p: 'margin:0 0 10px',
  badge: (c) => `display:inline-block;padding:0 8px;border:1px solid ${c};border-radius:999px;color:${c};font-weight:700`,
  facts: 'display:flex;flex-wrap:wrap;gap:4px 24px;margin:0 0 10px',
  fact: 'min-width:0',
  dt: 'font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)',
  dd: 'margin:0;overflow-wrap:anywhere',
  wrap: 'overflow-x:auto;margin:0 0 10px',
  table: 'width:100%;border-collapse:collapse;font-size:14px',
  th: 'padding:4px 8px 4px 0;border-bottom:1px solid var(--line);text-align:left;font-weight:600;color:var(--ink-dim)',
  td: 'padding:4px 8px 4px 0;border-bottom:1px solid var(--line);vertical-align:top',
  list: 'margin:0 0 10px;padding-left:1.2em',
  note: 'margin:0;font-size:13px;color:var(--ink-dim)',
};

function evidence(urls, what) {
  const list = Array.isArray(urls) ? urls : [];
  if (!list.length) return 'none';
  return list.map((u, i) => link(u, String(i + 1), `${what} evidence ${i + 1}`)).join(' ');
}

function fact(label, value) {
  return `<div style="${S.fact}"><dt style="${S.dt}">${label}</dt><dd style="${S.dd}">${value}</dd></div>`;
}

function verdictDate(rec) {
  const src = rec.baseline?.source;
  if (src === 'packet') return fact('Verdict pinned', `${day(rec.baseline.date)} (${link(blob(rec.packet), 'packet')})`);
  if (typeof src === 'string' && /^updates\/[A-Za-z0-9._-]+\.md$/.test(src)) return fact('Verdict re-checked', `${day(rec.baseline.date)} (${link(blob(src), 'dated re-check')})`);
  throw new LiveError(`${rec.repo}: baseline.source ${JSON.stringify(src)} is neither "packet" nor updates/<file>.md`);
}

function release(rec) {
  const r = rec.latest_release;
  if (!r) return 'none';
  return `${link(r.url, `<code>${esc(r.tag)}</code>`)} on ${day(r.date)}`;
}

function status(ex) {
  if (!ex?.found) return 'not found: deleted or made private';
  const parts = [ex.archived ? 'archived' : 'not archived', ex.pin_reachable ? 'the pin is an ancestor of HEAD' : 'the pin is no longer an ancestor of HEAD'];
  return parts.join('; ');
}

function classCell(value, before) {
  if (value === 'unknown') return 'unknown';
  if (before !== undefined && before !== 'unknown' && before !== value) return `${esc(value)} (moved from ${esc(before)})`;
  return esc(value);
}

// Columns: the verdict's cell in force (`reference`: the master matrix, or the latest dated re-check's cells
// table), the class computed at the packet pin, at the re-check pin when there is one, and now. "Now" is
// compared with the baseline (FR-T.1, FR-T.8), so "moved from" names the baseline class.
function classTable(rec) {
  const rechecked = rec.baseline?.source !== 'packet';
  const rows = DIMS.map((d) => {
    const x = rec.dims?.[d];
    if (!x) throw new LiveError(`${rec.repo}: dims.${d} missing`);
    const name = `${DIM_WORD[d]}${x.tracked ? '' : ' (not tracked*)'}`;
    const cells = [esc(x.reference), classCell(x.at_pin), ...(rechecked ? [classCell(x.at_baseline)] : []), classCell(x.now, x.at_baseline), evidence(x.evidence, DIM_WORD[d])];
    return `<tr><th scope="row" style="${S.td};text-align:left;font-weight:600">${name}</th>${cells.map((c) => `<td style="${S.td}">${c}</td>`).join('')}</tr>`;
  });
  const head = ['Class', 'Verdict', 'At pin', ...(rechecked ? ['At re-check'] : []), 'Now', 'Evidence'].map((h) => `<th scope="col" style="${S.th}">${h}</th>`).join('');
  const caption = rechecked
    ? 'The verdict&rsquo;s cells as re-checked, and the classes the watch computes at the pin, at the re-check and now'
    : 'The verdict&rsquo;s cells, and the classes the watch computes at the pin and now';
  return `<div style="${S.wrap}"><table style="${S.table}"><caption style="${S.dt};text-align:left;padding-bottom:4px">${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

// Vocabulary lookup that never reaches Object.prototype ("constructor" is a legal upstream string).
const word = (map, k) => (Object.hasOwn(map, k) ? map[k] : esc(k));

function crossingItem(c, pending) {
  const dim = word(DIM_WORD, c.dim);
  const move = `${dim}: ${esc(c.from)} &rarr; ${esc(c.to)}, since ${esc(day(c.since))}`;
  const done = c.resolved_by ? `; resolved by ${link(blob(String(c.resolved_by)), 'a dated re-check')}` : '';
  const seen = pending ? '; seen once, it opens only if the next daily check sees it too' : '';
  return `<li>${move} (${word(SOURCE_WORD, c.source)}${done}${seen}). Evidence: ${evidence(c.evidence, dim)}</li>`;
}

function crossings(rec) {
  const items = [...(rec.crossings ?? []).map((c) => crossingItem(c, false)), ...(rec.pending ?? []).map((c) => crossingItem(c, true))];
  if (!items.length) return '';
  return `<p style="${S.dt};margin:0">What the watch flagged</p><ul style="${S.list}">${items.join('')}</ul>`;
}

// ---------- the card ----------
/** Inner HTML of the live:card region for one repository record. Pure: same record and live, same bytes. */
export function renderCard(rec, live) {
  const st = Object.hasOwn(STATE, rec.state) ? STATE[rec.state] : null;
  if (!st) throw new LiveError(`${rec.repo}: state ${JSON.stringify(rec.state)} is not current, changed, due or unknown`);
  const id = `live-card-h`;
  const untracked = DIMS.some((d) => rec.dims?.[d] && !rec.dims[d].tracked);
  const compare = SHA.test(String(rec.pin?.sha)) && SHA.test(String(rec.head?.sha)) ? upstream(rec.repo, `/compare/${rec.pin.sha}...${rec.head.sha}`) : null;
  return [
    `<aside class="live-card" aria-labelledby="${id}" style="${S.card}">`,
    `<h2 id="${id}" style="${S.h}">Live facts since the pin</h2>`,
    `<p style="${S.p}">State: <strong style="${S.badge(st.colour)}">${st.word}</strong>${stateSentence(rec)}</p>`,
    `<dl style="${S.facts}">`,
    verdictDate(rec),
    fact('Pinned commit', `${commit(rec.repo, rec.pin?.sha)} on ${day(rec.pin?.date)}`),
    rec.baseline?.sha && rec.baseline.sha !== rec.pin?.sha ? fact('Re-check pinned commit', commit(rec.repo, rec.baseline.sha)) : '',
    fact('Live, as of', `<time datetime="${esc(live.checked_at)}">${utc(live.checked_at)}</time>`),
    fact('Commits since the pin', link(compare, esc(rec.commits_since_pin ?? 'unknown'))),
    fact('Latest release', release(rec)),
    fact('HEAD', `${commit(rec.repo, rec.head?.sha)} on ${day(rec.head?.date)}`),
    fact('Repository', status(rec.existence)),
    '</dl>',
    classTable(rec),
    crossings(rec),
    untracked ? `<p style="${S.note};margin-bottom:6px">*Not tracked: the class computed at the baseline differs from the verdict's cell (${link(blob('watch/freshness/DISCREPANCIES.md'), 'recorded discrepancy')}), so a move in it is flagged by the watch's event rules instead.</p>` : '',
    `<p style="${S.note}">Computed facts only, from the GitHub API. Only a dated re-check changes a verdict. Data: ${link(blob('watch/live.json'), 'watch/live.json')}; rules: ${link(blob('watch/freshness/SPEC.md'), 'freshness contract')}.</p>`,
    '</aside>',
  ].filter(Boolean).join('\n');
}

// ---------- region editing (the marker grammar of shell.mjs and brief-strip.mjs) ----------
const block = (content) => `${OPEN}\n${content}\n${CLOSE}`;
const countOf = (html, s) => html.split(s).length - 1;

/** The current region, null when absent; throws when the markers are unbalanced, repeated or reversed. */
export function regionOf(rel, html) {
  const o = countOf(html, OPEN);
  const c = countOf(html, CLOSE);
  if (o === 0 && c === 0) return null;
  if (o !== 1 || c !== 1) throw new LiveError(`${rel}: live:card has ${o} opening and ${c} closing markers (want 1 and 1)`);
  const i = html.indexOf(OPEN);
  const j = html.indexOf(CLOSE);
  if (j < i) throw new LiveError(`${rel}: live:card closes before it opens`);
  return { start: i, end: j + CLOSE.length, text: html.slice(i, j + CLOSE.length) };
}

/** Returns `html` with the region rendered fresh. Touches nothing outside the markers; idempotent. */
export function applyCard(rel, html, rec, live) {
  const text = block(renderCard(rec, live));
  const r = regionOf(rel, html);
  if (r) return html.slice(0, r.start) + text + html.slice(r.end);
  if (countOf(html, ANCHOR) !== 1) throw new LiveError(`${rel}: ${countOf(html, ANCHOR)} ${ANCHOR} (want 1); place ${OPEN}${CLOSE} by hand`);
  const i = html.indexOf(ANCHOR);
  return `${html.slice(0, i)}${text}\n\n${html.slice(i)}`;
}

// ---------- the tree ----------
/** watch/live.json parsed, with the fields every card needs checked. */
export function readLive(file) {
  if (!existsSync(file)) throw new LiveError(`${file}: missing (the watch writes it with --apply)`);
  let live;
  try { live = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw new LiveError(`${file}: not JSON (${e.message})`); }
  if (live?.schema !== SCHEMA) throw new LiveError(`${file}: schema ${JSON.stringify(live?.schema)}, want ${SCHEMA}`);
  utc(live.checked_at);
  if (!Array.isArray(live.repos)) throw new LiveError(`${file}: no repos array`);
  return live;
}

export function briefFiles(site) {
  const dir = join(site, 'briefs');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((f) => `briefs/${f}`) : [];
}

/** The live record for a brief, matched on the record's brief path. */
export function recordFor(live, rel) {
  const hits = live.repos.filter((r) => r.brief === `site/${rel}`);
  if (hits.length > 1) throw new LiveError(`${rel}: ${hits.length} live.json records name this brief`);
  return hits[0] ?? null;
}

/** Everything the check mode reports. Returns { errs, briefs }. */
export function checkBriefs(site, live) {
  const errs = [];
  const files = briefFiles(site);
  for (const rel of files) {
    try {
      const rec = recordFor(live, rel);
      if (!rec) { errs.push(`${rel}: no watch/live.json record names this brief`); continue; }
      const html = readFileSync(join(site, rel), 'utf8');
      const r = regionOf(rel, html);
      if (!r) errs.push(`${rel}: missing the live:card region`);
      else if (r.text !== block(renderCard(rec, live))) errs.push(`${rel}: live:card differs from a fresh render of watch/live.json (run: node site/scripts/make-live.mjs)`);
    } catch (e) {
      if (!(e instanceof LiveError)) throw e;
      errs.push(e.message);
    }
  }
  for (const r of live.repos) {
    if (r.brief != null && !files.includes(String(r.brief).replace(/^site\//, ''))) errs.push(`watch/live.json names brief ${r.brief}, which does not exist`);
  }
  if (!files.length) errs.unshift('empty scan set: no briefs found (a check that checks nothing is not a pass)');
  return { errs, briefs: files.length };
}
