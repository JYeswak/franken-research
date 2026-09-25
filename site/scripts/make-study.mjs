#!/usr/bin/env node
// make-study.mjs: generate the Independent 100 study pages from their sources.
//
//   node site/scripts/make-study.mjs            write the pages and the sitemap block into site/
//   node site/scripts/make-study.mjs --check    write nothing; exit 1 on any finding (gate N)
//   --root DIR                                  operate on another copy of the repository (DIR/study, DIR/site,
//                                               DIR/.github); used to plant known-bad inputs
//
// Inputs:  study/independent-100/people.jsonl (one record per person), study/independent-100/deep/*.md (one
//          deep dive per file, every file present is rendered), study/independent-100/README.md (the credit,
//          method, rubric, labels, limits and corrections text shown on the index).
// Outputs: site/study/independent-100/index.html, <slug>.html per person, deep/<slug>.html per deep dive,
//          and the block between <!-- study:independent-100 --> and <!-- /study:independent-100 --> in
//          site/sitemap.xml. Output is deterministic (sorted inputs, no timestamps). The shared shell (head
//          links, nav, footer) comes from shell.mjs.
// --check prints one line per finding, prefixed with its check:
//   N1 drift   a page or the sitemap block differs from a fresh render, or a page exists that no source makes
//   N2 count   the page files on disk are not exactly the people, the index and the deep dives
//   N3 schema  people.jsonl or a deep dive's front matter and sections break the schema in the README
//   N4 scan    a study source or page carries a local path, an email address, a phone number, an image, an
//              X API field name, an internal ticket id, or a gendered pronoun on a pseudonymous record
// and ends with STUDY_OK or STUDY_BAD. No dependencies beyond node's standard library.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyShell, urlPath, SITE_ORIGIN, REPO_URL } from './shell.mjs';

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const ri = argv.indexOf('--root');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(ROOT, 'site');
const SRC = 'study/independent-100';           // relative to ROOT
const OUT = 'study/independent-100';           // relative to SITE
const GH = REPO_URL + '/blob/main/';
const EDITION = '2026-09-25';
const CORRECTION_OPTION = 'Independent 100 study';
const CURATOR = {
  name: 'dan', handle: '@irl_danB', x: 'https://x.com/irl_danB',
  list: 'https://independent.prose.md/', post: 'https://x.com/irl_danB/status/2103083310339735588', date: '2026-09-24',
};
const SECTIONS = ['The Canon', 'The Frontier Outside', 'The Sensemakers', 'The Basement Labs', 'The Backrooms', 'The Builders on Main'];
const KEYS = ['rank', 'slug', 'handle', 'name', 'section', 'pseudonymous', 'identity', 'links', 'public_work', 'relevance',
  'in_our_work', 'study_next', 'adoption_notes', 'confidence', 'evidence', 'could_not_verify'];
const LINK_KEYS = ['x', 'github', 'site', 'blog', 'other'];
const WORK_KEYS = ['name', 'url', 'kind', 'what', 'license', 'last_activity', 'stars'];
const NEXT_KEYS = ['what', 'url', 'why', 'effort'];
const REL_KEYS = ['score', 'lenses', 'why'];
const FM_KEYS = ['title', 'covers', 'written', 'summary'];
const EFFORT = { S: 'small', M: 'medium', L: 'large' };
const LABEL = /\[(Verified|Reported|Inference)\b[^\]\n]*\]/;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isHttps = (u) => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);

// ---------- inline markdown subset ----------
const URL_RX = /https?:\/\/[^\s<>"'`\])]*[^\s<>"'`\]).,;:!?]/g;
const shortUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
function inline(text, { labels = true } = {}) {
  const hold = [];
  const put = (html) => '\u0000' + (hold.push(html) - 1) + '\u0000';
  let s = String(text);
  s = s.replace(/`([^`\n]+)`/g, (_, c) => put('<code>' + esc(c) + '</code>'));
  s = s.replace(/\[([^\]\n]+)\]\((https:\/\/[^)\s]+)\)/g, (_, t, u) => put('<a href="' + esc(u) + '">' + inline(t, { labels: false }) + '</a>'));
  if (labels) {
    s = s.replace(new RegExp(LABEL.source, 'g'), (m) => put('<span class="tier">[' + inline(m.slice(1, -1), { labels: false }) + ']</span>'));
  }
  s = s.replace(URL_RX, (u) => put('<a href="' + esc(u) + '">' + esc(shortUrl(u)) + '</a>'));
  // A count over the 44 assessed repositories quoted from a source is a dated quotation, not a live statistic;
  // it carries the STAT annotation gate B exempts (the live counts come from data.js on the other pages).
  s = esc(s).replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>')
    .replace(/\b\d+(?:\s+of\s+|\/)44\b/g, (m) => '<!-- STAT: dated Franken Research count quoted in study source (not in data.js) -->' + m);
  // nested holds (a label holding a link) resolve from the inside out
  for (let i = 0; i < 3 && s.includes('\u0000'); i++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => hold[+n]);
  return s;
}

// ---------- block markdown subset (README sections and deep dives) ----------
function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}
function blocks(md, { idPrefix = '', headingLevel = 2 } = {}) {
  const lines = md.split('\n');
  const out = [];
  const ids = new Set();
  let para = [];
  let list = null; // { tag, items: [{ text, sub: [] }] }
  let quote = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flushQuote = () => { if (quote.length) { out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>'); quote = []; } };
  const flushList = () => {
    if (!list) return;
    out.push('<' + list.tag + '>' + list.items.map((it) => '<li>' + inline(it.text)
      + (it.sub.length ? '<ul>' + it.sub.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>' : '') + '</li>').join('') + '</' + list.tag + '>');
    list = null;
  };
  const flush = () => { flushPara(); flushQuote(); flushList(); };
  const hid = (t) => {
    let id = idPrefix + (slugify(t) || 'section');
    for (let n = 2; ids.has(id); n++) id = idPrefix + slugify(t) + '-' + n;
    ids.add(id); return id;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, '');
    let m;
    if (!line.trim()) { flush(); continue; }
    if ((m = /^(#{2,3})\s+(.*)$/.exec(line))) {
      flush();
      const lvl = headingLevel + m[1].length - 2;
      out.push(`<h${lvl} id="${hid(m[2])}">${inline(m[2], { labels: false })}</h${lvl}>`);
      continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) {
      flush();
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\|/.test(lines[i].trim())) rows.push(cells(lines[i++]));
      i--;
      out.push('<div class="twrap"><table class="md"><thead><tr>' + head.map((h) => '<th scope="col">' + inline(h) + '</th>').join('')
        + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + head.map((h, k) => `<td data-label="${esc(h.replace(/[*`]/g, ''))}">` + inline(r[k] || '') + '</td>').join('') + '</tr>').join('')
        + '</tbody></table></div>');
      continue;
    }
    if ((m = /^>\s?(.*)$/.exec(line))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = /^ {2}[-*]\s+(.*)$/.exec(line)) && list && list.items.length) {
      list.items[list.items.length - 1].sub.push(m[1]); continue;
    }
    if ((m = /^[-*]\s+(.*)$/.exec(line)) || (m = /^\d+\.\s+(.*)$/.exec(line))) {
      flushPara(); flushQuote();
      const tag = /^\d/.test(line) ? 'ol' : 'ul';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push({ text: m[1], sub: [] });
      continue;
    }
    if (list && /^\s+\S/.test(line)) {
      const it = list.items[list.items.length - 1];
      if (it.sub.length) it.sub[it.sub.length - 1] += ' ' + line.trim(); else it.text += ' ' + line.trim();
      continue;
    }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}

// "## Name" sections of a markdown file, in order: [{ name, body }]
function mdSections(md) {
  const out = [];
  let cur = null;
  for (const l of md.split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(l);
    if (h) { cur = { name: h[1], body: [] }; out.push(cur); continue; }
    if (cur) cur.body.push(l);
  }
  return out.map((s) => ({ name: s.name, body: s.body.join('\n').trim() }));
}

// ---------- definitions box (gate C) ----------
const TERMS = [
  ['NODUS', /NODUS/, '<b>NODUS</b> is the four-ring verdict scale (Invest, Pilot, Explore, Monitor) used for the FrankenSuite assessments.'],
  ['TRL', /\bTRL\b/, '<b>TRL</b> is technology readiness level, scored 1 to 9.'],
  ['CI', /\bCI\b/, '<b>CI</b> is continuous integration: automated checks that run on every push.'],
  ['pin', /\bpin\b|\bpinned\b/i, 'To <b>pin</b> is to freeze a dependency, oracle, or assessment at an exact commit or version, so later changes cannot silently alter what was checked.'],
  ['rider', /\brider\b/i, 'The <b>rider</b> is the license clause withholding all rights, including benchmarking and testing, from OpenAI, Anthropic, their affiliates, and anyone acting for them; most FrankenSuite repos carry it.'],
  ['bus factor', /bus factor/i, '<b>Bus factor</b> is how many people would have to leave before a project stalls.'],
];
const visible = (html) => html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const LABELS_LEAD = 'Bracketed tags are evidence labels: <b>[Verified]</b> means we read the page, file or API response ourselves, <b>[Reported]</b> means a source says so and we did not check the underlying thing, and <b>[Inference]</b> is our own reasoning.';
function vocab(html) {
  const txt = visible(html);
  const defs = TERMS.filter(([, rx]) => rx.test(txt)).map(([, , d]) => d);
  return '<div class="vocab">' + LABELS_LEAD + (defs.length ? ' ' + defs.join(' ') : '') + '</div>';
}

// ---------- page frame ----------
const CSS = `/* Franken Research: Independent 100 study pages. Generated by site/scripts/make-study.mjs. No dependencies; works from file://. */
:root{--bg:#0c0c0e;--bg-2:#121215;--bg-3:#17171b;--ink:#ece5d8;--ink-dim:#b7b0a2;--muted:#8d867a;--line:#26262c;
  --accent:#ff7a3d;--gold:#f0a832;--green:#57d98a;--amber:#f5b942;
  --serif:Georgia,"Iowan Old Style","Times New Roman",serif;--sans:system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--serif);font-size:17px;line-height:1.7;-webkit-font-smoothing:antialiased;padding:0 20px 48px}
a{color:var(--accent);overflow-wrap:anywhere}
a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
code{font-family:var(--mono);font-size:.85em;background:var(--bg-3);padding:.1em .35em;border-radius:4px;overflow-wrap:anywhere}
.wrap{max-width:1080px;margin:0 auto;--shell-pad:0px}
header h1{font-size:34px;margin:14px 0 6px;line-height:1.2}
header .sub{color:var(--ink-dim);font-size:17px;max-width:940px;margin:0 0 6px}
header .meta{font-family:var(--sans);font-size:14px;color:var(--ink-dim);margin:10px 0 0;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
header .meta b{color:var(--ink);font-weight:600}
.back{font-family:var(--sans);font-size:13.5px;margin:0 0 4px}
.back a{color:var(--gold);text-decoration:none}
.back a:hover,.back a:focus-visible{text-decoration:underline}
.vocab{background:#1a2030;border:1px solid #33415c;border-radius:8px;padding:10px 14px;font-size:14px;color:#cdd7ea;margin:14px 0;line-height:1.6}
.vocab b{color:var(--ink)}
.credit{border-left:3px solid var(--gold)}
.card{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:16px 0}
.card h2{font-size:21px;margin:0 0 6px;line-height:1.35}
.card h3{font-size:17px;margin:14px 0 4px}
.card p,.card li{font-size:15.5px;line-height:1.65}
.card ul,.card ol{padding-left:22px;margin:8px 0}
.card li{margin:6px 0}
.card blockquote{margin:10px 0;padding:2px 14px;border-left:3px solid var(--line);color:var(--ink-dim)}
.tier{font-family:var(--sans);font-size:12.5px;color:var(--gold)}
.tag{display:inline-block;font-family:var(--sans);font-size:11.5px;font-weight:600;line-height:1.4;padding:0 7px;margin:0 2px;border-radius:4px;border:1px solid var(--line);color:var(--ink-dim);vertical-align:1px}
.lic{border-color:#3a5a44;color:#9fd8b1}
.lic.none{border-color:var(--amber);color:var(--amber)}
.small{font-family:var(--sans);font-size:13px;color:var(--muted)}
.score{font-family:var(--sans);font-weight:700;color:var(--ink)}
.work li{margin:12px 0}
.work .what{margin:2px 0 0}
.judgement{font-family:var(--sans);font-size:13.5px;color:var(--ink-dim);border-top:1px solid var(--line);padding-top:8px;margin-top:10px}
.fix{border-left:3px solid var(--accent)}
.twrap{margin:8px 0}
table{width:100%;border-collapse:collapse;font-size:14.5px;line-height:1.5}
th{font-family:var(--sans);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}
table.people th[scope="rowgroup"]{font-size:13px;letter-spacing:.1em;color:var(--gold);padding-top:22px;border-bottom:1px solid var(--gold)}
table.people td.rank{font-family:var(--mono);color:var(--muted);white-space:nowrap}
table.people td.rel{font-family:var(--sans);font-size:13.5px}
table.people a{color:var(--ink);text-decoration-color:var(--accent)}
table.people caption{text-align:left;caption-side:top;padding:0 0 6px}
.deeps li{margin:10px 0}
footer{max-width:1080px;margin:26px auto 0;color:var(--muted);font-size:13px;font-family:var(--sans)}
footer p{margin:0 0 8px}
@media (max-width:760px){
  table.people thead,table.md thead{position:absolute;left:-9999px}
  table.people,table.people tbody,table.people tr,table.people td,table.people th,
  table.md,table.md tbody,table.md tr,table.md td{display:block;width:auto}
  table.people tr,table.md tr{border-bottom:1px solid var(--line);padding:8px 0}
  table.people td,table.md td{border:0;padding:2px 0}
  table.people td[data-label]::before,table.md td[data-label]::before{content:attr(data-label) ": ";font-family:var(--sans);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
  table.people caption{display:block}
  table.people td.rank,table.people td.nm,table.people td.hd{display:inline;padding:0 6px 0 0}
  table.people td.rank::before,table.people td.nm::before,table.people td.hd::before{content:none}
  table.people td.nm{font-size:17px}
  table.people td.hd{font-family:var(--sans);font-size:13px;color:var(--muted)}
  table.people td.sec{display:none}
  table.people td.rel{margin-top:2px}
}
@media (max-width:560px){body{font-size:16px;padding:0 12px 36px}header h1{font-size:27px}.card{padding:14px 14px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:#f2a93b;color:#06130a;font-weight:700;font-size:13px;padding:9px 16px;border-radius:0 0 10px 0;text-decoration:none}
.skip:focus{left:0}`;

const upOf = (rel) => '../'.repeat(rel.split('/').length - 1);
function page(rel, { title, desc, header, main }) {
  const canonical = SITE_ORIGIN + urlPath(rel);
  const up = upOf(rel);
  const body = header + '\n' + main;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} \u00b7 Franken Research</title>
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${canonical}">
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} \u00b7 Franken Research">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_ORIGIN}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} \u00b7 Franken Research">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_ORIGIN}/og-image.png">
<style>${CSS}</style>
<!-- shell:head -->
<!-- /shell:head -->
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<!-- shell:nav -->
<!-- /shell:nav -->
${header}
${vocab(body)}
<main id="main">
${main}
</main>
<footer>
  <p>Generated from <a href="${GH}${SRC}/README.md">${SRC}/</a> by <a href="${GH}site/scripts/make-study.mjs">site/scripts/make-study.mjs</a>. Gate N fails the build if this page drifts from its sources.</p>
</footer>
</div>
<!-- shell:footer -->
<!-- /shell:footer -->
</body>
</html>
`;
}

const correctionUrl = (rel) => `${REPO_URL}/issues/new?template=correction.yml&repository=${encodeURIComponent(CORRECTION_OPTION)}&page=${encodeURIComponent(SITE_ORIGIN + urlPath(rel))}`;
const creditLine = `The Independent 100 list was curated by ${CURATOR.name} (<a href="${CURATOR.x}">${CURATOR.handle}</a>) and published on ${CURATOR.date} at <a href="${CURATOR.list}">independent.prose.md</a> (<a href="${CURATOR.post}">announcement</a>). The ranks and section names are his, and number 100 is his open wild-card slot. This study is ours and is not endorsed by him or by anyone on the list.`;
const creditCard = `<section class="card credit" aria-labelledby="h-credit">
  <h2 id="h-credit">Credit</h2>
  <p>${creditLine}</p>
</section>`;
const fixCard = (rel, what) => `<section class="card fix" id="correct" aria-labelledby="h-correct">
  <h2 id="h-correct">Request a correction</h2>
  <p>Is something about ${what} wrong or out of date, or would you rather not be covered? <a href="${esc(correctionUrl(rel))}">Open a correction<span class="small"> (a GitHub issue form with this page&rsquo;s address filled in)</span></a>. A request to remove a record is honoured without argument; accepted corrections are recorded in the changelog with the date.</p>
</section>`;

// ---------- sources ----------
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const findings = [];
const find = (id, msg) => findings.push(id + ' ' + msg);

function loadPeople() {
  const rel = SRC + '/people.jsonl';
  if (!fs.existsSync(path.join(ROOT, rel))) { find('N3', rel + ': missing'); return []; }
  const out = [];
  readText(rel).split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try { out.push(JSON.parse(line)); } catch (e) { find('N3', `${rel}:${i + 1}: not JSON (${e.message})`); }
  });
  return out;
}

function checkPeople(people) {
  const at = (p) => `people.jsonl #${p.rank ?? '?'}`;
  const seen = new Set();
  let lastSec = 0;
  if (people.length !== 99) find('N3', `people.jsonl: ${people.length} records (want 99, ranks 1 to 99)`);
  people.forEach((p, i) => {
    if (!same(Object.keys(p), KEYS)) { find('N3', `${at(p)}: keys ${JSON.stringify(Object.keys(p))} (want ${JSON.stringify(KEYS)} in that order)`); return; }
    if (p.rank !== i + 1) find('N3', `${at(p)}: out of order (line ${i + 1})`);
    if (!/^@\w{1,30}$/.test(p.handle)) find('N3', `${at(p)}: handle ${JSON.stringify(p.handle)}`);
    if (p.slug !== slugify(p.handle) || seen.has(p.slug)) find('N3', `${at(p)}: slug ${JSON.stringify(p.slug)} is not the unique slug of the handle`);
    seen.add(p.slug);
    if (typeof p.name !== 'string' || !p.name.trim()) find('N3', `${at(p)}: empty name`);
    const si = SECTIONS.indexOf(p.section);
    if (si < 0) find('N3', `${at(p)}: section ${JSON.stringify(p.section)} is not one of the curator's six`);
    else if (si < lastSec) find('N3', `${at(p)}: section ${p.section} out of the curator's order`);
    else lastSec = si;
    if (typeof p.pseudonymous !== 'boolean') find('N3', `${at(p)}: pseudonymous must be true or false`);
    if (typeof p.identity !== 'string' || !LABEL.test(p.identity)) find('N3', `${at(p)}: identity carries no [Verified], [Reported] or [Inference] label`);
    const L = p.links;
    if (!L || !same(Object.keys(L), LINK_KEYS)) find('N3', `${at(p)}: links keys ${JSON.stringify(L && Object.keys(L))} (want ${JSON.stringify(LINK_KEYS)})`);
    else {
      if (L.x !== 'https://x.com/' + p.handle.slice(1)) find('N3', `${at(p)}: links.x is not the handle's profile`);
      for (const k of ['github', 'site', 'blog']) if (L[k] !== null && !/^https?:\/\/\S+$/.test(L[k])) find('N3', `${at(p)}: links.${k} is not a URL or null`);
      if (!Array.isArray(L.other) || L.other.some((u) => !/^https?:\/\/\S+$/.test(u))) find('N3', `${at(p)}: links.other must be a list of URLs`);
    }
    if (!Array.isArray(p.public_work)) find('N3', `${at(p)}: public_work must be a list`);
    else p.public_work.forEach((w, j) => {
      if (!same(Object.keys(w), WORK_KEYS)) { find('N3', `${at(p)}: public_work[${j}] keys (want ${JSON.stringify(WORK_KEYS)})`); return; }
      if (!isHttps(w.url)) find('N3', `${at(p)}: public_work[${j}] url is not https: ${JSON.stringify(w.url)}`);
      if (!w.name || !w.what || !w.kind) find('N3', `${at(p)}: public_work[${j}] needs name, kind and what`);
      if (w.license !== null && typeof w.license !== 'string') find('N3', `${at(p)}: public_work[${j}] license must be text or null`);
      if (w.last_activity !== null && typeof w.last_activity !== 'string') find('N3', `${at(p)}: public_work[${j}] last_activity must be text or null`);
      if (w.stars !== null && !Number.isInteger(w.stars)) find('N3', `${at(p)}: public_work[${j}] stars must be an integer or null`);
    });
    const R = p.relevance;
    if (!R || !same(Object.keys(R), REL_KEYS)) find('N3', `${at(p)}: relevance keys (want ${JSON.stringify(REL_KEYS)})`);
    else {
      if (!Number.isInteger(R.score) || R.score < 0 || R.score > 5) find('N3', `${at(p)}: relevance.score must be an integer 0 to 5`);
      if (!Array.isArray(R.lenses) || !R.lenses.length || R.lenses.some((x) => typeof x !== 'string')) find('N3', `${at(p)}: relevance.lenses must be a non-empty list`);
      if (typeof R.why !== 'string' || !R.why.trim()) find('N3', `${at(p)}: relevance.why is empty`);
    }
    if (p.in_our_work !== null && (typeof p.in_our_work !== 'string' || !p.in_our_work.trim())) find('N3', `${at(p)}: in_our_work must be text or null`);
    if (!Array.isArray(p.study_next)) find('N3', `${at(p)}: study_next must be a list`);
    else p.study_next.forEach((s, j) => {
      if (!same(Object.keys(s), NEXT_KEYS)) { find('N3', `${at(p)}: study_next[${j}] keys (want ${JSON.stringify(NEXT_KEYS)})`); return; }
      if (!isHttps(s.url)) find('N3', `${at(p)}: study_next[${j}] url is not https`);
      if (!(s.effort in EFFORT)) find('N3', `${at(p)}: study_next[${j}] effort ${JSON.stringify(s.effort)} (want S, M or L)`);
    });
    if (typeof p.adoption_notes !== 'string') find('N3', `${at(p)}: adoption_notes must be text`);
    if (!['High', 'Medium', 'Low'].includes(p.confidence)) find('N3', `${at(p)}: confidence must be High, Medium or Low`);
    if (!Array.isArray(p.evidence) || !p.evidence.length) find('N3', `${at(p)}: evidence must be a non-empty list`);
    else p.evidence.forEach((e, j) => { if (!isHttps(e)) find('N3', `${at(p)}: evidence[${j}] is not an https URL: ${JSON.stringify(e)}`); });
    if (typeof p.could_not_verify !== 'string' || !p.could_not_verify.trim()) find('N3', `${at(p)}: could_not_verify is empty`);
  });
}

function loadDeep(people) {
  const dir = path.join(ROOT, SRC, 'deep');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
  const ranks = new Set(people.map((p) => p.rank));
  return files.map((f) => {
    const rel = `${SRC}/deep/${f}`;
    const slug = f.slice(0, -3);
    const src = readText(rel);
    const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
    const fm = {};
    const order = [];
    if (!m) find('N3', `${rel}: no front matter`);
    else for (const l of m[1].split('\n')) {
      const k = /^([a-z_]+):\s*(.*)$/.exec(l);
      if (k) { fm[k[1]] = k[2].trim(); order.push(k[1]); } else find('N3', `${rel}: front matter line ${JSON.stringify(l)}`);
    }
    if (m && !same(order, FM_KEYS)) find('N3', `${rel}: front matter keys ${JSON.stringify(order)} (want ${JSON.stringify(FM_KEYS)})`);
    if (slug !== slugify(slug)) find('N3', `${rel}: file name must be a lowercase slug`);
    const covers = String(fm.covers || '').split(/\s*,\s*/).filter(Boolean).map(Number);
    if (!covers.length || covers.some((r) => !ranks.has(r))) find('N3', `${rel}: covers ${JSON.stringify(fm.covers)} names no listed rank`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.written || '')) find('N3', `${rel}: written must be a date`);
    if (!fm.title) find('N3', `${rel}: no title`);
    if (!fm.summary || fm.summary.length > 240) find('N3', `${rel}: summary missing or over 240 characters`);
    const body = m ? src.slice(m[0].length) : src;
    if (/^#\s/m.test(body)) find('N3', `${rel}: level-1 heading (the title comes from front matter)`);
    const secs = mdSections(body);
    if (!secs.length || secs[0].name !== 'Sources') find('N3', `${rel}: first section must be "## Sources"`);
    if (!secs.length || secs[secs.length - 1].name !== 'What we could not verify') find('N3', `${rel}: last section must be "## What we could not verify"`);
    if (secs.some((s) => /internal notes/i.test(s.name))) find('N3', `${rel}: has an "Internal notes" section, which a public edition may not carry`);
    if (/<\/?[a-z][^>]*>/i.test(body.replace(/`[^`\n]*`/g, ''))) find('N3', `${rel}: raw HTML outside code spans`);
    if (!LABEL.test(body)) find('N3', `${rel}: no evidence labels`);
    return { slug, rel, fm, covers, body };
  });
}

// ---------- scan (N4) ----------
const SCAN = [
  ['local path', /(?:^|[\s"'(`=:,])(?:~\/|\/Users\/|\/home\/[a-z]|\$HOME\b|C:\\Users\\)|\.local\/state|scratch\/control-plane/],
  ['email address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['phone number', /(?:\+\d{1,3}[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b|\btel:/],
  ['image', /<img\b|<picture\b|!\[[^\]]*\]\(/i],
  ['X API field name', /\b(?:followers_count|following_count|tweet_count|listed_count|like_count|media_count|pinned_tweet_id|public_metrics|verified_type|profile_image_url|twitter_username|x_recent_posts|x_display|x_created|x_id)\b/],
  ['internal ticket id', /\bcp-[a-z0-9]{5}\b/],
];
const GENDERED = /\b(he|him|his|himself|she|her|hers|herself)\b/i;
function scanText(rel, text) {
  const lines = text.split('\n');
  for (const [what, rx] of SCAN) {
    lines.forEach((l, i) => {
      const hit = rx.exec(l);
      if (!hit) return;
      if (what === 'email address' && /^noreply@|@users\.noreply\.github\.com$/i.test(hit[0])) return;
      find('N4', `${rel}:${i + 1}: ${what}: ${JSON.stringify(hit[0].trim().slice(0, 60))}`);
    });
  }
}
function scanPseudonymous(people) {
  for (const p of people) {
    if (p.pseudonymous !== true) continue;
    const walk = (o, where) => {
      if (typeof o === 'string') { const m = GENDERED.exec(o); if (m) find('N4', `people.jsonl #${p.rank} ${where}: gendered pronoun "${m[0]}" on a pseudonymous record`); }
      else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${where}[${i}]`));
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, where ? where + '.' + k : k);
    };
    walk(p, '');
  }
}

// ---------- render ----------
function render(people, deeps, readme) {
  const pages = new Map();
  const bySlug = Object.fromEntries(people.map((p) => [p.slug, p]));
  const byRank = Object.fromEntries(people.map((p) => [p.rank, p]));
  const coveredBy = {};
  for (const d of deeps) for (const r of d.covers) (coveredBy[r] ||= []).push(d);
  const put = (rel, html) => pages.set(rel, applyShell(rel, html, SITE));

  // person pages
  for (const p of people) {
    const rel = `${OUT}/${p.slug}.html`;
    const L = p.links;
    const linkItems = [['X profile', L.x], ['GitHub', L.github], ['Site', L.site], ['Blog', L.blog], ...L.other.map((u) => ['Also', u])]
      .filter(([, u]) => u).map(([k, u]) => `<li>${esc(k)}: <a href="${esc(u)}">${esc(shortUrl(u))}</a></li>`);
    const work = p.public_work.length
      ? '<ul class="work">' + p.public_work.map((w) => {
        const meta = [
          `<span class="tag">${esc(w.kind)}</span>`,
          w.license ? `<span class="tag lic">${inline(w.license)}</span>` : '<span class="tag lic none">no license stated</span>',
          w.last_activity ? `<span class="small">last activity ${inline(w.last_activity)}</span>` : '',
          w.stars !== null ? `<span class="small">${w.last_activity ? '&middot; ' : ''}${w.stars.toLocaleString('en-US')} GitHub stars on 2026-09-24</span>` : '',
        ].filter(Boolean).join(' ');
        return `<li><b><a href="${esc(w.url)}">${esc(w.name)}</a></b> ${meta}<p class="what">${inline(w.what)}</p></li>`;
      }).join('\n') + '</ul>'
      : '<p>No public work is listed for this account.</p>';
    const deepLinks = (coveredBy[p.rank] || []).map((d) => `<li><a href="deep/${d.slug}.html">${esc(d.fm.title)}</a> (written ${esc(d.fm.written)})</li>`);
    const next = p.study_next.length
      ? '<ol>' + p.study_next.map((s) => `<li>${inline(s.what)} (<a href="${esc(s.url)}">${esc(shortUrl(s.url))}</a>). ${inline(s.why)} <span class="small">Effort: ${esc(EFFORT[s.effort])}.</span></li>`).join('\n') + '</ol>'
      : '<p>Nothing is listed.</p>';
    const franken = p.rank === 55 ? `
<section class="card" id="franken-research" aria-labelledby="h-franken-research">
  <h2 id="h-franken-research">Franken Research on Jeffrey&rsquo;s work</h2>
  <p>Franken Research, the project this study belongs to, is an independent, evidence-labelled assessment of Jeffrey&rsquo;s FrankenSuite repositories. Start with <a href="../../index.html">the map of assessed repositories</a>, then <a href="../../method/index.html">the method</a>, <a href="../../techniques/index.html">the techniques</a>, <a href="../../failure-modes/index.html">the failure modes</a>, <a href="../../lessons/index.html">the lessons</a> and <a href="../../starter-kit/index.html">the starter kit</a>. Each repository has its own brief, reachable from the map.</p>
</section>` : '';
    const header = `<header>
  <p class="back"><a href="index.html">&larr; The Independent 100: a study</a></p>
  <h1>${esc(p.name)}</h1>
  <p class="meta"><span>#${p.rank} in <b>${esc(p.section)}</b>, the curator&rsquo;s rank and section</span> <span><a href="${esc(L.x)}">${esc(p.handle)}</a></span> <span>Relevance to our work: <b>${p.relevance.score} of 5</b></span></p>
</header>`;
    const main = `${creditCard}
<section class="card" id="public" aria-labelledby="h-public">
  <h2 id="h-public">What they publicly do</h2>
  <p>${inline(p.identity)}</p>
  ${linkItems.length ? '<ul>' + linkItems.join('\n') + '</ul>' : ''}
</section>
<section class="card" id="work" aria-labelledby="h-work">
  <h2 id="h-work">Public work</h2>
  ${work}
  <p class="small">Licenses are as GitHub or the source reported them on 2026-09-24; check the license file before reusing anything.</p>
</section>
<section class="card" id="relevance" aria-labelledby="h-relevance">
  <h2 id="h-relevance">Relevance to our work</h2>
  <p><span class="score">${p.relevance.score} of 5</span> <span class="small">lenses: ${p.relevance.lenses.map(esc).join(', ')}</span></p>
  <p>${inline(p.relevance.why)}</p>
  ${p.in_our_work ? `<p><b>Where it already touches our work:</b> ${inline(p.in_our_work)}</p>` : ''}
  ${deepLinks.length ? `<p><b>Deep dive:</b></p><ul>${deepLinks.join('\n')}</ul>` : ''}
  <p class="judgement">Scored 0 to 5 against the study&rsquo;s <a href="index.html#rubric">relevance rubric</a>: 5 means public, openly licensed work squarely in our lanes that we could study or adopt now, and 1 means little connection to our work. The score is one reviewer&rsquo;s judgement of how much this public work bears on our own work. It is not a ranking of people and says nothing about the person or the quality of their work.</p>
</section>${franken}
<section class="card" id="next" aria-labelledby="h-next">
  <h2 id="h-next">What we would study next</h2>
  ${next}
  ${p.adoption_notes ? `<p><b>Before reusing anything:</b> ${inline(p.adoption_notes)}</p>` : ''}
</section>
<section class="card" id="sources" aria-labelledby="h-sources">
  <h2 id="h-sources">Sources</h2>
  <ul>${p.evidence.map((u) => `<li><a href="${esc(u)}">${esc(shortUrl(u))}</a></li>`).join('\n')}</ul>
  <p class="small">Overall confidence in this record: ${esc(p.confidence)}. Sources were read on 2026-09-24 and every link was checked on ${EDITION}. The full record is line ${p.rank} of <a href="${GH}${SRC}/people.jsonl">people.jsonl</a>.</p>
</section>
<section class="card" id="limits" aria-labelledby="h-limits">
  <h2 id="h-limits">Limits</h2>
  <p><b>Not verified:</b> ${inline(p.could_not_verify)}</p>
  <p>This record comes from a first-pass survey of public material by an AI agent session on 2026-09-24, edited for publication on ${EDITION}. Nothing was installed or run for it. Roles, stars and licenses change; see the <a href="index.html#limits">study&rsquo;s limits</a>.</p>
</section>
${fixCard(rel, 'this record')}`;
    const desc = `${p.name} (${p.handle}), #${p.rank} in ${p.section} on the Independent 100: public work, relevance to our work and what we would study next.`;
    put(rel, page(rel, { title: `${p.name}: Independent 100 study`, desc, header, main }));
  }

  // deep-dive pages
  for (const d of deeps) {
    const rel = `${OUT}/deep/${d.slug}.html`;
    const who = d.covers.filter((r) => byRank[r]).map((r) => `<a href="../${byRank[r].slug}.html">${esc(byRank[r].name)}</a> (#${r})`);
    const header = `<header>
  <p class="back"><a href="../index.html">&larr; The Independent 100: a study</a></p>
  <h1>${esc(d.fm.title)}</h1>
  <p class="meta"><span>Deep dive, written <b>${esc(d.fm.written)}</b> by an AI agent session; public edition ${EDITION}</span> <span>Covers ${who.join(', ')}</span></p>
</header>`;
    const md = mdSections(d.body).filter((s) => !/internal notes/i.test(s.name)).map((s) => '## ' + s.name + '\n\n' + s.body).join('\n\n');
    const main = `${creditCard}
<section class="card" id="summary" aria-labelledby="h-summary">
  <h2 id="h-summary">Summary</h2>
  <p>${inline(d.fm.summary)}</p>
</section>
<article class="card" aria-label="Deep dive">
${blocks(md, { idPrefix: 's-' })}
</article>
<section class="card" id="how" aria-labelledby="h-how">
  <h2 id="h-how">How to read this</h2>
  <p>A deep dive compares one person&rsquo;s public work with how we work and says what we would adopt. Its proposals are our plans, not recommendations to anyone else, and its judgements of fit are one reviewer&rsquo;s. Source: <a href="${GH}${d.rel}">${esc(d.rel)}</a>.</p>
</section>
${fixCard(rel, 'this deep dive')}`;
    put(rel, page(rel, { title: d.fm.title, desc: d.fm.summary, header, main }));
  }

  // index
  {
    const rel = `${OUT}/index.html`;
    const R = Object.fromEntries(mdSections(readme).map((s) => [s.name, s.body]));
    const need = ['Method', 'Relevance rubric', 'Evidence labels', 'Dates', 'What the public edition leaves out', 'Limits', 'Corrections'];
    for (const n of need) if (!(n in R)) find('N3', `${SRC}/README.md: no "## ${n}" section`);
    const card = (id, title, md) => `<section class="card" id="${id}" aria-labelledby="h-${id}">
  <h2 id="h-${id}">${esc(title)}</h2>
${blocks(md || '', { idPrefix: id + '-', headingLevel: 3 })}
</section>`;
    const groups = SECTIONS.map((sec) => {
      const rows = people.filter((p) => p.section === sec);
      if (!rows.length) return '';
      const id = 'sec-' + slugify(sec);
      return `<tbody aria-labelledby="${id}">
<tr><th scope="rowgroup" colspan="5" id="${id}">${esc(sec)} <span class="small">(ranks ${rows[0].rank} to ${rows[rows.length - 1].rank})</span></th></tr>
${rows.map((p) => `<tr><td class="rank" data-label="Rank">#${p.rank}</td><td class="nm" data-label="Name"><a href="${p.slug}.html">${esc(p.name)}</a></td><td class="hd" data-label="Handle">${esc(p.handle)}</td><td class="sec" data-label="Section">${esc(p.section)}</td><td class="rel" data-label="Relevance to our work"><b>${p.relevance.score}</b> of 5 <span class="small">${p.relevance.lenses.map(esc).join(', ')}</span></td></tr>`).join('\n')}
</tbody>`;
    }).join('\n');
    const deepList = deeps.length
      ? '<ul class="deeps">' + deeps.map((d) => `<li><a href="deep/${d.slug}.html"><b>${esc(d.fm.title)}</b></a> <span class="small">written ${esc(d.fm.written)}; covers ${d.covers.filter((r) => byRank[r]).map((r) => `<a href="${byRank[r].slug}.html">${esc(byRank[r].name)}</a>`).join(', ')}</span><br>${inline(d.fm.summary)}</li>`).join('\n') + '</ul>'
      : '<p>None yet.</p>';
    const counts = [5, 4, 3, 2, 1, 0].map((s) => [s, people.filter((p) => p.relevance.score === s).length]).filter(([, n]) => n);
    const header = `<header>
  <h1>The Independent 100: a study</h1>
  <p class="sub">One page for each of the 99 people on dan&rsquo;s Independent 100 list: what they publicly do, their public work with links and licenses, how much it bears on our own work, and what we would study next. Plus longer deep dives on a few of them.</p>
  <p class="meta"><span>Survey <b>2026-09-24</b></span> <span>Public edition <b>${EDITION}</b></span> <span><b>${people.length}</b> people, <b>${deeps.length}</b> deep dives</span></p>
</header>`;
    const main = `${creditCard}
${card('method', 'Method', R['Method'])}
${card('rubric', 'Relevance rubric', R['Relevance rubric'])}
<section class="card" id="deep-dives" aria-labelledby="h-deep-dives">
  <h2 id="h-deep-dives">Deep dives</h2>
  ${deepList}
</section>
<section class="card" id="people" aria-labelledby="h-people">
  <h2 id="h-people">The 99, in the curator&rsquo;s order</h2>
  <p>Grouped by the curator&rsquo;s sections. The last column is relevance to our work (0 to 5) and its lenses; it is one reviewer&rsquo;s judgement per person, not a ranking of people. Scores: ${counts.map(([s, n]) => `${n} at ${s}`).join(', ')}.</p>
  <table class="people">
  <caption class="small">The Independent 100 as listed by ${CURATOR.name}, with our relevance score</caption>
  <thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Handle</th><th scope="col">Section</th><th scope="col">Relevance to our work</th></tr></thead>
${groups}
  </table>
  <p>Number 100 is the curator&rsquo;s open wild-card slot. Nominations go to <a href="${CURATOR.x}">${CURATOR.handle}</a>, not to us.</p>
</section>
${card('labels', 'Evidence labels', R['Evidence labels'])}
${card('dates', 'Dates', R['Dates'])}
${card('left-out', 'What the public edition leaves out', R['What the public edition leaves out'])}
${card('limits', 'Limits', R['Limits'])}
${card('corrections', 'Corrections', R['Corrections'])}
${fixCard(rel, 'this study')}`;
    put(rel, page(rel, {
      title: 'The Independent 100: a study',
      desc: 'A study of the 99 people on the Independent 100 list curated by dan (@irl_danB): public work, licenses, relevance to our work, and what we would study next.',
      header, main,
    }));
  }
  return pages;
}

// ---------- sitemap block ----------
const SM_OPEN = '<!-- study:independent-100 (generated by site/scripts/make-study.mjs) -->';
const SM_CLOSE = '<!-- /study:independent-100 -->';
function sitemapWith(xml, rels) {
  const urls = [...rels].sort((a, b) => (a === `${OUT}/index.html` ? -1 : b === `${OUT}/index.html` ? 1 : a < b ? -1 : a > b ? 1 : 0))
    .map((r) => `  <url><loc>${SITE_ORIGIN}${urlPath(r)}</loc></url>`);
  const block = `  ${SM_OPEN}\n${urls.join('\n')}\n  ${SM_CLOSE}`;
  const i = xml.indexOf(SM_OPEN); const j = xml.indexOf(SM_CLOSE);
  if (i >= 0 && j > i) {
    const start = xml.lastIndexOf('\n', i) + 1;
    return xml.slice(0, start) + block + xml.slice(j + SM_CLOSE.length);
  }
  const k = xml.lastIndexOf('</urlset>');
  if (k < 0) throw new Error('sitemap.xml: no </urlset>');
  return xml.slice(0, k) + block + '\n' + xml.slice(k);
}

// ---------- main ----------
function onDisk() {
  const base = path.join(SITE, OUT);
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else out.push(path.relative(SITE, p).split(path.sep).join('/'));
    }
  };
  walk(base);
  return out.sort();
}

const people = loadPeople();
checkPeople(people);
const deeps = loadDeep(people);
const readmeRel = `${SRC}/README.md`;
const readme = fs.existsSync(path.join(ROOT, readmeRel)) ? readText(readmeRel) : (find('N3', `${readmeRel}: missing`), '');
const pages = render(people, deeps, readme);
const want = new Set(pages.keys());
const smPath = path.join(SITE, 'sitemap.xml');
const smNow = fs.readFileSync(smPath, 'utf8');
const smWant = sitemapWith(smNow, want);

// the correction option every page prefills must exist on the form
const form = path.join(ROOT, '.github', 'ISSUE_TEMPLATE', 'correction.yml');
if (!fs.existsSync(form) || !new RegExp('^\\s*-\\s+' + CORRECTION_OPTION + '\\s*$', 'm').test(fs.readFileSync(form, 'utf8'))) {
  find('N3', `.github/ISSUE_TEMPLATE/correction.yml: repository dropdown has no "${CORRECTION_OPTION}" option (every study page prefills it)`);
}

// scan the sources and the rendered pages
for (const f of [readmeRel, `${SRC}/people.jsonl`, ...deeps.map((d) => d.rel)]) if (fs.existsSync(path.join(ROOT, f))) scanText(f, readText(f));
for (const [rel, html] of pages) scanText('site/' + rel, html.replace(/<!-- shell:footer -->[\s\S]*?<!-- \/shell:footer -->/, ''));
scanPseudonymous(people);

if (!CHECK) {
  if (findings.some((f) => f.startsWith('N3') || f.startsWith('N4'))) {
    console.log('STUDY_BAD (nothing written)');
    findings.slice(0, 40).forEach((f) => console.log('  ' + f));
    process.exit(1);
  }
  for (const rel of onDisk()) if (!want.has(rel)) fs.rmSync(path.join(SITE, rel));
  for (const [rel, html] of pages) {
    const p = path.join(SITE, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== html) fs.writeFileSync(p, html);
  }
  if (smWant !== smNow) fs.writeFileSync(smPath, smWant);
  console.log(`make-study: ${pages.size} pages (${people.length} people, index, ${deeps.length} deep dives) into site/${OUT}`);
  process.exit(0);
}

// --check: drift and count
const have = onDisk();
for (const [rel, html] of pages) {
  const p = path.join(SITE, rel);
  if (!fs.existsSync(p)) find('N1', `site/${rel}: missing (run: node site/scripts/make-study.mjs)`);
  else if (fs.readFileSync(p, 'utf8') !== html) find('N1', `site/${rel}: differs from a fresh render (run: node site/scripts/make-study.mjs)`);
}
for (const rel of have) if (!want.has(rel)) find('N1', `site/${rel}: no source renders this file`);
if (smWant !== smNow) find('N1', 'site/sitemap.xml: the study block differs from a fresh render');
const htmlOnDisk = have.filter((r) => r.endsWith('.html')).length;
const expect = people.length + 1 + deeps.length;
if (htmlOnDisk !== expect) find('N2', `site/${OUT}: ${htmlOnDisk} pages on disk, want ${expect} (${people.length} people + index + ${deeps.length} deep dives)`);
if (!people.length) find('N2', 'empty scan set: no people records (a gate that checks nothing is not a pass)');
if (findings.length) {
  console.log('STUDY_BAD');
  findings.slice(0, 40).forEach((f) => console.log('  ' + f));
  if (findings.length > 40) console.log(`  ... and ${findings.length - 40} more`);
  process.exit(1);
}
console.log(`STUDY_OK pages=${htmlOnDisk} people=${people.length} deep=${deeps.length} sitemap=${want.size}`);
