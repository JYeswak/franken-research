#!/usr/bin/env node
// site/scripts/brief-strip.mjs: the verdict strip at the top of every brief, rendered from the map's data.
//
//   node site/scripts/brief-strip.mjs            rewrite the brief:style and brief:strip regions of every brief, then --check
//   node site/scripts/brief-strip.mjs --check    exit 1 if a brief lacks a region, a region differs from a fresh render,
//                                                the strip or the brief's own ring widget and TRL gauge disagree with
//                                                data.js, or a "What would change the verdict" list is collapsed
//   --site DIR                                   operate on another copy of site/
//
// Two regions per brief, each everything between <!-- brief:NAME --> and <!-- /brief:NAME -->:
//   style   in <head>, after the brief template's own <style>: the strip's CSS, the page's ring colour, the
//           ring widget's colours, and touch-target sizes. First run: inserted after the first </style>.
//   strip   in the hero, directly under the title: ring, TRL, CI class, license, the brief's own bottom line
//           ("Use it? ... Learn from it? ...", cut from its verdict cards) with a Why link to the section that
//           holds them, and one sentence placing the repo in FrankenSuite. First run: replaces p.hero__dek.
// Sources: ring, TRL, CI class, license class and the repo count from assets/data.js (the map's data); ring
// colours, the CI-green colour and the CI class words from assets/app.src.js (the map's palette), so a colour
// on a brief means what it means on the map. make-og.mjs imports the same palette for the share cards.
// verify-site.sh gate V runs --check. No dependencies beyond node's standard library.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

export const RINGS = ['Invest', 'Pilot', 'Explore', 'Monitor']; // inner to outer, as on the map
const PILL_ORDER = ['Monitor', 'Explore', 'Pilot', 'Invest']; // the order of the brief ring widget's pills
// Plain-words license line per data.js licenseKey (data.js licenseClasses holds the notes these summarise).
export const LICENSE_PLAIN = {
  rider: 'MIT with a clause barring OpenAI and Anthropic; not open source',
  mit: 'Plain MIT; open source',
  none: 'No license file, so all rights reserved',
};
const ANSWER_MAX = 90; // characters; a longer answer is cut to its first clause

class StripError extends Error {}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', middot: '\u00b7', rarr: '\u2192' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e.toLowerCase()] ?? m;
});
const textOf = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// ---------- sources ----------
/** window.FRANKEN_DATA from assets/data.js. */
export function loadData(site) {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(site, 'assets/data.js'), 'utf8'), sandbox);
  const d = sandbox.window.FRANKEN_DATA;
  if (!d || !Array.isArray(d.repos) || !d.repos.length) throw new StripError('assets/data.js: no FRANKEN_DATA.repos');
  return d;
}

/** The map's palette and CI words, read from assets/app.src.js: { ring: {Invest: '#...'}, green, ciWord: {C1: '...'} }. */
export function loadMap(site) {
  const src = readFileSync(join(site, 'assets/app.src.js'), 'utf8');
  const block = (name) => {
    const m = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`).exec(src);
    if (!m) throw new StripError(`assets/app.src.js: const ${name} = {...}; not found (the strip reads the map's ${name} from it)`);
    return m[1];
  };
  const ring = {};
  for (const m of block('RING').matchAll(/(\w+):\s*\{[^}]*?css:\s*'(#[0-9a-fA-F]{6})'/g)) ring[m[1]] = m[2].toLowerCase();
  for (const r of RINGS) if (!ring[r]) throw new StripError(`assets/app.src.js: RING.${r} has no css colour`);
  const g = /css:\s*'(#[0-9a-fA-F]{6})'/.exec(block('GREEN'));
  if (!g) throw new StripError('assets/app.src.js: GREEN has no css colour');
  const ciWord = {};
  for (const m of block('CI_WORD').matchAll(/(C\d):\s*'([^']*)'/g)) ciWord[m[1]] = m[2];
  return { ring, green: g[1].toLowerCase(), ciWord };
}

export const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;

// ---------- facts the brief itself states ----------
/** The two verdict-card answers, each cut to one short clause: { use, learn } as HTML-escaped text. */
export function bottomLine(rel, html) {
  const cards = [...html.matchAll(/<p class="verdict-card__q">([\s\S]*?)<\/p><p class="verdict-card__answer">([\s\S]*?)<\/p>/g)];
  const q = cards.map((m) => textOf(m[1]));
  if (cards.length !== 2 || q[0] !== 'Should you use it?' || q[1] !== 'Should you learn from it?') {
    throw new StripError(`${rel}: want the two verdict cards "Should you use it?" and "Should you learn from it?", found ${JSON.stringify(q)}`);
  }
  const cut = (answerHtml) => {
    let t = textOf(answerHtml.replace(/<a class="src-chip"[^>]*>[\s\S]*?<\/a>/g, ''));
    const s = /^.*?[.!?](?=\s+[A-Z]|$)/.exec(t);
    if (s) t = s[0];
    if (t.length > ANSWER_MAX) {
      const at = [' \u2014 ', ': ', '; '].map((sep) => t.indexOf(sep)).filter((i) => i > 0);
      if (at.length) t = t.slice(0, Math.min(...at)).replace(/[,;:\s]+$/, '') + '.';
    }
    if (!/[.!?]$/.test(t)) t += '.';
    return esc(t).replace(/&quot;/g, '"');
  };
  return { use: cut(cards[0][2]), learn: cut(cards[1][2]) };
}

/** id of the <section> that holds the verdict cards: where "Why" points. */
function verdictSection(rel, html) {
  const i = html.indexOf('class="verdict-cards"');
  if (i < 0) throw new StripError(`${rel}: no .verdict-cards`);
  const secs = [...html.slice(0, i).matchAll(/<section\b[^>]*\bid="([^"]+)"/g)];
  if (!secs.length) throw new StripError(`${rel}: .verdict-cards is not inside a <section id>`);
  return secs[secs.length - 1][1];
}

/** The pin date the brief's hero states ("Assessment pinned September 22, 2026 (the assessed commit)"). */
function pinDate(rel, html) {
  const m = /<div class="hero__meta"><span>Assessment pinned ([A-Z][a-z]+ \d{1,2}, \d{4}) \(the assessed commit\)<\/span>/.exec(html);
  if (!m) throw new StripError(`${rel}: hero__meta does not open with "Assessment pinned <Month D, YYYY> (the assessed commit)"`);
  return m[1];
}

// ---------- renderers ----------
export function renderStrip(repo, rel, html, data, map) {
  const ci = map.ciWord[repo.ciKey];
  if (!ci) throw new StripError(`${rel}: data.js ciKey ${repo.ciKey} has no CI_WORD in app.src.js`);
  const lic = LICENSE_PLAIN[repo.licenseKey];
  if (!lic) throw new StripError(`${rel}: data.js licenseKey ${repo.licenseKey} has no plain-words line`);
  if (!RINGS.includes(repo.nodus)) throw new StripError(`${rel}: data.js ring ${repo.nodus} is not one of ${RINGS.join(', ')}`);
  const ciText = ci.replace(/^CI /, '').replace(/^./, (c) => c.toUpperCase());
  const { use, learn } = bottomLine(rel, html);
  const why = verdictSection(rel, html);
  return `<div class="bstrip" role="group" aria-labelledby="bstrip-h" data-ring="${esc(repo.nodus)}" data-trl="${esc(repo.trl)}">
<p class="bstrip__eyebrow" id="bstrip-h">Our verdict, pinned ${pinDate(rel, html)} (the assessed commit)</p>
<dl class="bstrip__facts">
<div class="bstrip__fact"><dt>Ring</dt><dd><span class="bstrip__ring">${esc(repo.nodus)}</span></dd></div>
<div class="bstrip__fact"><dt>technology readiness level <span class="bstrip__nw">(1&ndash;9)</span></dt><dd class="bstrip__trl">TRL ${esc(repo.trl)}</dd></div>
<div class="bstrip__fact"><dt>CI (continuous integration)</dt><dd${repo.ciKey === 'C1' ? ' class="bstrip__green"' : ''}>${esc(ciText)}</dd></div>
<div class="bstrip__fact"><dt>License</dt><dd>${esc(lic)}</dd></div>
</dl>
<p class="bstrip__line"><span class="bstrip__part"><span class="bstrip__q">Use it?</span> ${use}</span> <span class="bstrip__part"><span class="bstrip__q">Learn from it?</span> ${learn}</span> <a class="bstrip__why" href="#${esc(why)}">Why<span class="bstrip__sr"> this verdict</span><span class="bstrip__arrow" aria-hidden="true">&darr;</span></a></p>
</div>
<p class="bstrip__ctx">FrankenSuite is Jeffrey Emanuel&rsquo;s set of <span data-stat="total">${data.repos.length}</span> repos written mostly by AI coding agents, and this brief grades one of them. See it <a href="../index.html#repo=${encodeURIComponent(repo.name)}">on the map</a> or <a href="../index.html#tableview">in the verdict table</a>.</p>`;
}

export function renderStyle(repo, map) {
  const ring = map.ring[repo.nodus];
  const pills = PILL_ORDER.map((r, i) => `.nodus-pills .nodus-pill:nth-child(${i + 1}) { --pill: ${map.ring[r]}; }`).join('\n');
  return `<style>/* brief-strip.mjs: verdict strip; ring colours are the map's (assets/app.src.js RING) */
:root { --ring: ${ring}; --ring-soft: ${rgba(ring, 0.12)}; }
.hero__cue { position: static; transform: none; margin-top: 2.2rem; }
.bstrip { max-width: 820px; margin: 0 auto 1.1rem; padding: 16px 22px 14px; text-align: left; font-family: var(--sans); background: var(--bg-2); border: 1px solid var(--line); border-top: 3px solid var(--ring); border-radius: 14px; }
.bstrip__eyebrow { margin: 0 0 10px; font-size: 12px; line-height: 1.4; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.bstrip__facts { display: grid; grid-template-columns: auto auto minmax(0, 1fr) minmax(0, 1.3fr); gap: 0 28px; margin: 0; }
.bstrip__fact { min-width: 0; display: grid; grid-row: span 2; grid-template-rows: subgrid; align-content: start; }
.bstrip__fact dt { margin: 0 0 5px; font-size: 11px; line-height: 1.35; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.bstrip__fact dd { margin: 0 0 10px; font-size: 16px; line-height: 1.4; color: var(--ink); overflow-wrap: anywhere; }
.bstrip__nw { white-space: nowrap; }
.bstrip__trl { font-weight: 700; }
.bstrip__green { color: ${map.green}; font-weight: 700; }
.bstrip__ring { display: inline-flex; align-items: center; gap: 8px; padding: 2px 12px 2px 10px; border: 1px solid var(--ring); border-radius: 999px; background: var(--ring-soft); color: var(--ring); font-weight: 700; letter-spacing: 0.04em; }
.bstrip__ring::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--ring); }
.bstrip__line { margin: 4px 0 0; padding-top: 12px; border-top: 1px solid var(--line); font-family: var(--serif); font-size: 19px; line-height: 1.5; color: var(--ink); }
.bstrip__part { display: inline-block; max-width: 100%; margin-right: 0.9em; }
.bstrip__q { margin-right: 0.35em; font-family: var(--sans); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-dim); }
.bstrip__why { font-family: var(--sans); font-size: 14px; font-weight: 600; white-space: nowrap; }
.bstrip__arrow { margin-left: 0.3em; }
.bstrip__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bstrip__ctx { max-width: 640px; margin: 0 auto 2rem; font-size: 17px; line-height: 1.6; font-style: italic; color: var(--ink-dim); }
.verdict-list + .prose { margin-top: 1.6rem; }
@media (max-width: 760px) {
  .hero { padding-top: 6vh; }
  .hero__kicker { margin-bottom: 1.4rem; }
  .hero__title { margin-bottom: 1.5rem; }
  .bstrip { padding: 14px 16px 12px; }
  .bstrip__facts { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 18px; }
  .bstrip__line { font-size: 17px; }
  .bstrip__ctx { font-size: 16px; }
}
/* the ring widget: every pill carries its map colour, the active one is filled with it */
.nodus-pill { display: inline-flex; align-items: center; gap: 8px; }
.nodus-pill::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--pill, var(--muted)); }
${pills}
.nodus-pill--active { background: var(--ring-soft); border-color: var(--ring); color: var(--ring); }
/* touch: in-brief controls get a 44px target */
@media (pointer: coarse) {
  .src-chip { display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; vertical-align: middle; }
  .share__btn, .pager a, .packet-link, .bstrip a { display: inline-flex; align-items: center; min-height: 44px; }
  .rail a { min-height: 44px; }
}
</style>`;
}

// ---------- region editing (same marker grammar as shell.mjs) ----------
const OPEN = (name) => `<!-- brief:${name} -->`;
const CLOSE = (name) => `<!-- /brief:${name} -->`;
const block = (name, content) => `${OPEN(name)}\n${content}\n${CLOSE(name)}`;
const countOf = (html, s) => html.split(s).length - 1;

function regionOf(rel, html, name) {
  const o = countOf(html, OPEN(name));
  const c = countOf(html, CLOSE(name));
  if (o === 0 && c === 0) return null;
  if (o !== 1 || c !== 1) throw new StripError(`${rel}: brief:${name} has ${o} opening and ${c} closing markers (want 1 and 1)`);
  const i = html.indexOf(OPEN(name));
  const j = html.indexOf(CLOSE(name));
  if (j < i) throw new StripError(`${rel}: brief:${name} closes before it opens`);
  return { start: i, end: j + CLOSE(name).length, text: html.slice(i, j + CLOSE(name).length) };
}

function firstPlacement(rel, html, name, text) {
  if (name === 'style') {
    const head = html.indexOf('</head>');
    const i = html.indexOf('</style>');
    if (i < 0 || head < 0 || i > head) throw new StripError(`${rel}: no </style> in <head>; place <!-- brief:style --><!-- /brief:style --> by hand`);
    return html.slice(0, i + 8) + '\n' + text + html.slice(i + 8);
  }
  const m = [...html.matchAll(/<p class="hero__dek">[\s\S]*?<\/p>/g)];
  if (m.length !== 1) throw new StripError(`${rel}: ${m.length} p.hero__dek (want 1); place <!-- brief:strip --><!-- /brief:strip --> under the title by hand`);
  return html.slice(0, m[0].index) + text + html.slice(m[0].index + m[0][0].length);
}

function regionsFor(rel, html, repo, data, map) {
  return { style: renderStyle(repo, map), strip: renderStrip(repo, rel, html, data, map) };
}

/** Returns `html` with both regions rendered fresh. Idempotent. */
export function applyStrip(rel, html, repo, data, map) {
  let out = html;
  for (const [name, content] of Object.entries(regionsFor(rel, html, repo, data, map))) {
    const text = block(name, content);
    const r = regionOf(rel, out, name);
    out = r ? out.slice(0, r.start) + text + out.slice(r.end) : firstPlacement(rel, out, name, text);
  }
  return out;
}

// The brief's own verdict widgets must say what data.js says; the strip must too.
function agreement(rel, html, repo) {
  const errs = [];
  const strip = regionOf(rel, html, 'strip');
  if (strip) {
    const ring = /class="bstrip"[^>]*\bdata-ring="([^"]*)"/.exec(strip.text);
    const trl = /class="bstrip"[^>]*\bdata-trl="([^"]*)"/.exec(strip.text);
    const shown = /<span class="bstrip__ring">([^<]*)<\/span>/.exec(strip.text);
    const shownTrl = /<dd class="bstrip__trl">TRL ([^<]*)<\/dd>/.exec(strip.text);
    if (!ring || ring[1] !== repo.nodus || !shown || shown[1] !== repo.nodus) errs.push(`${rel}: strip ring ${ring ? ring[1] : 'missing'} / shown ${shown ? shown[1] : 'missing'}, data.js says ${repo.nodus}`);
    if (!trl || textOf(trl[1]) !== String(repo.trl) || !shownTrl || textOf(shownTrl[1]) !== String(repo.trl)) errs.push(`${rel}: strip TRL ${trl ? textOf(trl[1]) : 'missing'} / shown ${shownTrl ? textOf(shownTrl[1]) : 'missing'}, data.js says ${repo.trl}`);
  }
  const pills = [...html.matchAll(/<span class="nodus-pill( nodus-pill--active)?"[^>]*>([^<]*)<\/span>/g)];
  const order = pills.map((m) => m[2]);
  if (order.join() !== PILL_ORDER.join()) errs.push(`${rel}: ring widget pills are ${JSON.stringify(order)}, want ${JSON.stringify(PILL_ORDER)} (the pill colours are keyed to that order)`);
  const active = pills.filter((m) => m[1]).map((m) => m[2]);
  if (active.length !== 1 || active[0] !== repo.nodus) errs.push(`${rel}: ring widget marks ${JSON.stringify(active)}, data.js says ${repo.nodus}`);
  const cap = /<p class="gauge__caption"><strong>TRL ([^<]*)<\/strong>/.exec(html);
  const want = String(repo.trl).split(' ')[0];
  if (!cap || textOf(cap[1]) !== want) errs.push(`${rel}: TRL gauge says ${cap ? 'TRL ' + textOf(cap[1]) : 'nothing'}, data.js says TRL ${repo.trl}`);
  // "What would change the verdict": one condition per item, and the closing sentence is not an item
  for (const m of html.matchAll(/<ol class="verdict-list"[^>]*>([\s\S]*?)<\/ol>/g)) {
    const items = [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => textOf(x[1]));
    if (items.length < 2) errs.push(`${rel}: verdict-list has ${items.length} item(s); a comma list of conditions collapsed into one`);
    const until = items.find((x) => /^until then\b/i.test(x));
    if (until) errs.push(`${rel}: verdict-list item "${until.slice(0, 40)}..." is the closing sentence; it belongs in a paragraph after the list`);
  }
  return errs;
}

export function briefFiles(site) {
  const dir = join(site, 'briefs');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((f) => 'briefs/' + f) : [];
}

/** Everything gate V checks. Returns { errs, briefs }. */
export function check(site) {
  const errs = [];
  const data = loadData(site);
  const map = loadMap(site);
  const byName = new Map(data.repos.map((r) => [r.name, r]));
  const files = briefFiles(site);
  for (const rel of files) {
    const name = rel.slice('briefs/'.length, -'.html'.length);
    const repo = byName.get(name);
    if (!repo) { errs.push(`${rel}: no data.js row named ${name}`); continue; }
    const html = readFileSync(join(site, rel), 'utf8');
    try {
      const want = regionsFor(rel, html, repo, data, map);
      for (const [region, content] of Object.entries(want)) {
        const r = regionOf(rel, html, region);
        if (!r) { errs.push(`${rel}: missing the brief:${region} region`); continue; }
        if (r.text !== block(region, content)) errs.push(`${rel}: brief:${region} differs from a fresh render (run: node site/scripts/brief-strip.mjs)`);
      }
      errs.push(...agreement(rel, html, repo));
    } catch (e) {
      if (!(e instanceof StripError)) throw e;
      errs.push(e.message);
    }
  }
  for (const r of data.repos) if (!files.includes(`briefs/${r.name}.html`)) errs.push(`data.js names ${r.name}, which has no brief`);
  return { errs, briefs: files.length };
}

// ---------- command line ----------
function main(argv) {
  const si = argv.indexOf('--site');
  const site = si >= 0 ? resolve(argv[si + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (!existsSync(site) || !statSync(site).isDirectory()) { console.log('STRIP_BAD'); console.log(`  no site directory at ${site}`); return 1; }
  try {
    if (!argv.includes('--check')) {
      const data = loadData(site);
      const map = loadMap(site);
      const byName = new Map(data.repos.map((r) => [r.name, r]));
      const next = briefFiles(site).map((rel) => {
        const repo = byName.get(rel.slice('briefs/'.length, -'.html'.length));
        if (!repo) throw new StripError(`${rel}: no data.js row`);
        const html = readFileSync(join(site, rel), 'utf8');
        return [rel, html, applyStrip(rel, html, repo, data, map)];
      });
      const changed = [];
      for (const [rel, before, after] of next) if (after !== before) { writeFileSync(join(site, rel), after); changed.push(rel); }
      console.log(`strip: ${changed.length} brief(s) rewritten`);
    }
    const { errs, briefs } = check(site);
    if (!briefs) errs.unshift('empty scan set: no briefs found (a gate that checks nothing is not a pass)');
    if (errs.length) {
      console.log('STRIP_BAD');
      errs.slice(0, 20).forEach((e) => console.log('  ' + e));
      if (errs.length > 20) console.log(`  ... and ${errs.length - 20} more`);
      return 1;
    }
    console.log(`STRIP_OK briefs=${briefs} regions=${briefs * 2}`);
    return 0;
  } catch (e) {
    if (!(e instanceof StripError)) throw e;
    console.log('STRIP_BAD'); console.log('  ' + e.message); console.log('  nothing written'); return 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main(process.argv.slice(2)));
