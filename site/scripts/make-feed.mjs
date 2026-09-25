#!/usr/bin/env node
// site/scripts/make-feed.mjs: builds the Atom feed and the follow-the-suite OPML from files in this repo.
//
//   node site/scripts/make-feed.mjs                 write site/feed.xml and site/follow/franken-suite.opml
//   node site/scripts/make-feed.mjs --out DIR       write DIR/feed.xml and DIR/follow/franken-suite.opml
//   --crossings FILE                                read the crossing ledger from FILE instead of watch/crossings.jsonl
//                                                   (the freshness harness builds a feed from a fixture ledger)
//   node site/scripts/make-feed.mjs --check FEED [OPML]
//                                                   strict well-formedness parse plus Atom/OPML structure;
//                                                   prints FEED_OK / OPML_OK or *_BAD lines, exits 1 on any problem
//
// Sources, all local (no network):
//   CHANGELOG.md          one entry per "## vX.Y.Z (YYYY-MM-DD)" section: its date and first paragraph
//   updates/*-DATE.md     one entry per dated re-check: title from its H1, date from the file name
//   watch/census/DATE.tsv and updates/movement-DATE.tsv
//                         one entry per day ("Daily census: N of 44 moved since the pin"), counted from
//                         the file; when both exist for a day the watch census (the later reading) wins
//   packets/*-assessment.md
//                         the assessed repositories, parsed by the daily watch's own parser
//   watch/crossings.jsonl
//                         one watch digest entry per ISO week that opened or resolved a crossing, dated the
//                         last day of that week with an event (watch/freshness/digest.mjs, SPEC.md FR-G.1)
// Output is deterministic: the feed's <updated> is the newest entry's date, never the build time, so a
// rerun on unchanged sources is byte-identical (verify-site.sh gate M compares against a fresh run).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePackets } from '../../watch/watch.mjs';
import { readDigestEntries, LEDGER } from '../../watch/freshness/digest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_URL = 'https://fr.zeststream.ai';
const FEED_URL = `${SITE_URL}/feed.xml`;
const FEED_ID = 'tag:fr.zeststream.ai,2026:feed';
const ENTRY_ID = 'tag:fr.zeststream.ai,2026:';
const REPO_URL = 'https://github.com/JYeswak/franken-research';
const OWNER = 'Dicklesworthstone';
const MAX_ENTRIES = 50;
const ATOM_NS = 'http://www.w3.org/2005/Atom';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const HTTPS = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s"<>]*)?$/;

class FeedError extends Error {}
const die = (msg) => { throw new FeedError(msg); };

// ---------- XML writing ----------
// XML 1.0 forbids these control characters outright; escaping cannot represent them.
const BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/;
function esc(s) {
  s = String(s);
  if (BAD_CHARS.test(s)) die(`character not allowed in XML: ${JSON.stringify(s.slice(0, 60))}`);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
const attrs = (o) => Object.entries(o).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');

// Markdown inline -> plain text: links keep their label, emphasis and code markers go.
const plain = (md) => md
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/(^|[\s(])[*_]([^*_\s][^*_]*)[*_](?=[\s).,;:]|$)/g, '$1$2')
  .replace(/\s+/g, ' ')
  .trim();

// ---------- sources ----------
function changelogEntries() {
  const lines = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## (v(\d+)\.(\d+)\.(\d+)) \((\d{4}-\d{2}-\d{2})\)\s*$/);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    const para = [];
    while (j < lines.length && lines[j].trim() && !lines[j].startsWith('#')) para.push(lines[j++]);
    const [, tag, maj, min, pat, date] = m;
    out.push({
      kind: 'release', date, sortKey: [maj, min, pat].map((n) => n.padStart(6, '0')).join('.'),
      id: `${ENTRY_ID}release/${tag}`,
      title: `Franken Research ${tag} released`,
      summary: para.length ? plain(para.join(' ')) : `Release ${tag}; see the changelog.`,
      links: [
        { rel: 'alternate', type: 'text/html', href: `${REPO_URL}/releases/tag/${tag}` },
        { rel: 'related', type: 'text/html', href: `${REPO_URL}/blob/main/CHANGELOG.md` },
      ],
    });
  }
  if (!out.length) die('CHANGELOG.md: no "## vX.Y.Z (YYYY-MM-DD)" release sections found');
  return out;
}

function recheckEntries() {
  const dir = join(ROOT, 'updates');
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    const m = f.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
    if (!m) continue;
    const h1 = readFileSync(join(dir, f), 'utf8').split('\n').find((l) => /^# \S/.test(l));
    if (!h1) die(`updates/${f}: no H1 title`);
    out.push({
      kind: 'recheck', date: m[2], sortKey: m[1],
      id: `${ENTRY_ID}recheck/${f.slice(0, -3)}`,
      title: plain(h1.slice(2)),
      summary: `A dated re-check of ${m[1]} filed beside its pinned packet, which is not edited. Every command and its output are in updates/${f}.`,
      links: [
        { rel: 'alternate', type: 'text/html', href: `${SITE_URL}/updates/` },
        { rel: 'related', type: 'text/markdown', href: `${REPO_URL}/blob/main/updates/${f}` },
      ],
    });
  }
  return out;
}

function readTsv(rel) {
  const rows = readFileSync(join(ROOT, rel), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  if (rows.length < 2) die(`${rel}: no data rows`);
  const head = rows[0].split('\t');
  return rows.slice(1).map((l) => {
    const c = l.split('\t');
    return Object.fromEntries(head.map((h, i) => [h, (c[i] ?? '').trim()]));
  });
}

// Column names differ between the one-off census and the daily watch. "Moved" is the watch report's
// definition (watch/watch.mjs, moved_since_pin): commits after the pin, or a HEAD that is not the pin.
const movedSincePin = (found) => found.filter((r) => (r.commits_since_pin ?? 0) > 0 || r.head !== r.pin).length;
const commitsSincePin = (found) => found.reduce((s, r) => s + (r.commits_since_pin ?? 0), 0);
const CENSUS_SOURCES = [
  { dir: 'watch/census', re: /^(\d{4}-\d{2}-\d{2})\.tsv$/, commits: 'commits_since_pin', material: 'material_since_pin' },
  { dir: 'updates', re: /^movement-(\d{4}-\d{2}-\d{2})\.tsv$/, commits: 'commits_ahead', material: 'material_change' },
];
function censusEntries() {
  const byDay = new Map();
  for (const src of CENSUS_SOURCES) {
    const dir = join(ROOT, src.dir);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      const m = f.match(src.re);
      if (m && !byDay.has(m[1])) byDay.set(m[1], { rel: `${src.dir}/${f}`, src });
    }
  }
  const out = [];
  for (const [date, { rel, src }] of byDay) {
    const rows = readTsv(rel);
    for (const k of ['repo', 'pin', 'head', src.commits, src.material]) {
      if (!(k in rows[0])) die(`${rel}: missing column ${k}`);
    }
    const found = rows.filter((r) => r.head && r.head !== '-').map((r) => ({
      pin: r.pin, head: r.head,
      commits_since_pin: /^\d+$/.test(r[src.commits]) ? Number(r[src.commits]) : null,
    }));
    const moved = movedSincePin(found);
    const commits = commitsSincePin(found);
    const material = rows.filter((r) => r[src.material].startsWith('yes')).length;
    const missing = rows.length - found.length;
    out.push({
      kind: 'census', date, sortKey: '',
      id: `${ENTRY_ID}census/${date}`,
      title: `Daily census: ${moved} of ${rows.length} moved since the pin`,
      summary: `${moved} of the ${rows.length} assessed repositories have commits after their pinned commit (${commits} commits in all)`
        + (missing ? `; ${missing} could not be read` : '')
        + `. ${material} flagged a change that could move a verdict cell (a release, tag, license, or workflow-set change), which is what triggers a re-check. Commits alone never change a verdict. Source: ${rel}.`,
      links: [
        { rel: 'alternate', type: 'text/html', href: `${SITE_URL}/updates/` },
        { rel: 'related', type: 'text/tab-separated-values', href: `${REPO_URL}/blob/main/${rel}` },
      ],
    });
  }
  return out;
}

// ---------- rendering ----------
// Same-day order: re-checks, then the week's watch digest, then the census, then releases.
const RANK = { recheck: 0, digest: 1, census: 2, release: 3 };
function buildFeed(ledger) {
  const all = [...changelogEntries(), ...recheckEntries(), ...readDigestEntries(ROOT, ledger), ...censusEntries()];
  for (const e of all) if (!DAY.test(e.date)) die(`${e.id}: bad date ${e.date}`);
  all.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1)
    : RANK[a.kind] - RANK[b.kind] || (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0)));
  const entries = all.slice(0, MAX_ENTRIES);
  const ids = new Set();
  for (const e of entries) { if (ids.has(e.id)) die(`duplicate entry id ${e.id}`); ids.add(e.id); }
  const stamp = (d) => `${d}T00:00:00Z`;
  const L = [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<feed xmlns="${ATOM_NS}" xml:lang="en">`,
    '  <title>Franken Research</title>',
    '  <subtitle>Releases of this assessment, dated re-checks, and the daily census of the 44 FrankenSuite repositories since their pinned commits.</subtitle>',
    `  <id>${esc(FEED_ID)}</id>`,
    `  <link${attrs({ rel: 'self', type: 'application/atom+xml', href: FEED_URL })}/>`,
    `  <link${attrs({ rel: 'alternate', type: 'text/html', href: `${SITE_URL}/` })}/>`,
    `  <updated>${stamp(entries[0].date)}</updated>`,
    `  <author><name>Franken Research</name><uri>${esc(`${SITE_URL}/`)}</uri></author>`,
    `  <icon>${esc(`${SITE_URL}/favicon.svg`)}</icon>`,
  ];
  for (const e of entries) {
    L.push('  <entry>', `    <id>${esc(e.id)}</id>`, `    <title>${esc(e.title)}</title>`, `    <updated>${stamp(e.date)}</updated>`);
    for (const l of e.links) L.push(`    <link${attrs(l)}/>`);
    L.push(`    <summary type="text">${esc(e.summary)}</summary>`, '  </entry>');
  }
  L.push('</feed>', '');
  return { xml: L.join('\n'), count: entries.length };
}

function buildOpml() {
  const repos = parsePackets(join(ROOT, 'packets')).map((p) => p.repo);
  const n = repos.length;
  const group = (label, suffix, what) => [
    `    <outline${attrs({ text: `${label} (${n} repos)`, title: `${label} (${n} repos)` })}>`,
    ...repos.map((r) => `      <outline${attrs({
      type: 'rss', text: `${r} ${what}`, title: `${r} ${what}`,
      xmlUrl: `https://github.com/${OWNER}/${r}/${suffix}`, htmlUrl: `https://github.com/${OWNER}/${r}`,
    })}/>`),
    '    </outline>',
  ];
  const L = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${esc(`FrankenSuite: follow all ${n} repos`)}</title>`,
    '    <ownerName>Franken Research</ownerName>',
    `    <ownerId>${esc(`${SITE_URL}/follow/`)}</ownerId>`,
    '  </head>',
    '  <body>',
    `    <outline${attrs({ type: 'rss', text: 'Franken Research', title: 'Franken Research', xmlUrl: FEED_URL, htmlUrl: `${SITE_URL}/` })}/>`,
    ...group('Releases', 'releases.atom', 'releases'),
    ...group('Tags', 'tags.atom', 'tags'),
    '  </body>',
    '</opml>',
    '',
  ];
  return { xml: L.join('\n'), repos: n };
}

// ---------- strict well-formedness parse (XML 1.0, no DTDs) ----------
// Builds a small element tree; throws with a line number on the first violation.
function parseXml(src) {
  let i = 0;
  const stack = [];
  let root = null;
  let done = false;
  const fail = (msg) => { throw new FeedError(`line ${src.slice(0, i).split('\n').length}: ${msg}`); };
  const NAME = /[A-Za-z_][-A-Za-z0-9._:]*/y;
  const name = () => { NAME.lastIndex = i; const m = NAME.exec(src); if (!m) fail('expected a name'); i += m[0].length; return m[0]; };
  const ws = () => { const s = i; while (/[ \t\r\n]/.test(src[i] ?? '')) i++; return i > s; };
  const REF = /&(?:(amp|lt|gt|quot|apos)|#([0-9]+)|#x([0-9A-Fa-f]+));/y;
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const legal = (c) => c === 0x9 || c === 0xA || c === 0xD || (c >= 0x20 && c <= 0xD7FF) || (c >= 0xE000 && c <= 0xFFFD) || (c >= 0x10000 && c <= 0x10FFFF);
  const decode = (s, at) => {
    let out = '';
    for (let k = 0; k < s.length; k++) {
      const c = s.codePointAt(k);
      if (c > 0xFFFF) k++;
      if (!legal(c)) { i = at + k; fail(`illegal character U+${c.toString(16).toUpperCase()}`); }
      if (s[k] !== '&') { out += String.fromCodePoint(c); continue; }
      REF.lastIndex = k;
      const m = REF.exec(s);
      if (!m) { i = at + k; fail('bare "&" or unknown entity (only the five predefined entities and character references are allowed)'); }
      if (m[1]) out += ENT[m[1]];
      else {
        const cp = parseInt(m[2] ?? m[3], m[2] ? 10 : 16);
        if (!legal(cp)) { i = at + k; fail(`character reference to illegal character ${m[0]}`); }
        out += String.fromCodePoint(cp);
      }
      k += m[0].length - 1;
    }
    return out;
  };
  if (src.charCodeAt(0) === 0xFEFF) i = 1;
  if (src.startsWith('<?xml', i) && /[ \t\r\n?]/.test(src[i + 5])) {
    const e = src.indexOf('?>', i);
    if (e < 0) fail('unterminated XML declaration');
    if (!/^<\?xml[ \t\r\n]+version=(["'])1\.\d+\1([ \t\r\n]+encoding=(["'])[A-Za-z][A-Za-z0-9._-]*\3)?([ \t\r\n]+standalone=(["'])(yes|no)\5)?[ \t\r\n]*\?>$/.test(src.slice(i, e + 2))) fail('malformed XML declaration');
    i = e + 2;
  }
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    const end = lt < 0 ? src.length : lt;
    if (end > i) {
      const text = src.slice(i, end);
      if (!stack.length) { if (/[^ \t\r\n]/.test(text)) fail('text outside the root element'); }
      else {
        if (text.includes(']]>')) fail('"]]>" in character data');
        stack.at(-1).text += decode(text, i);
      }
    }
    if (lt < 0) break;
    i = lt;
    if (src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i + 4);
      if (e < 0) fail('unterminated comment');
      if (src.slice(i + 4, e).includes('--') || src[e - 1] === '-') fail('"--" inside a comment');
      i = e + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      if (!stack.length) fail('CDATA section outside the root element');
      const e = src.indexOf(']]>', i + 9);
      if (e < 0) fail('unterminated CDATA section');
      stack.at(-1).text += src.slice(i + 9, e);
      i = e + 3;
    } else if (src.startsWith('<!', i)) {
      fail('DOCTYPE or other markup declaration (not allowed here)');
    } else if (src.startsWith('<?', i)) {
      i += 2;
      if (name().toLowerCase() === 'xml') fail('XML declaration not at the start of the document');
      const e = src.indexOf('?>', i);
      if (e < 0) fail('unterminated processing instruction');
      i = e + 2;
    } else if (src.startsWith('</', i)) {
      i += 2;
      const n = name();
      ws();
      if (src[i] !== '>') fail(`malformed end tag </${n}`);
      i++;
      if (!stack.length) fail(`end tag </${n}> with no open element`);
      if (stack.at(-1).name !== n) fail(`end tag </${n}> does not match <${stack.at(-1).name}>`);
      stack.pop();
      if (!stack.length) done = true;
    } else {
      i++;
      const el = { name: name(), attrs: {}, children: [], text: '' };
      if (done || (!stack.length && root)) fail(`second root element <${el.name}>`);
      let self = false;
      for (;;) {
        const spaced = ws();
        if (src.startsWith('/>', i)) { i += 2; self = true; break; }
        if (src[i] === '>') { i++; break; }
        if (i >= src.length) fail(`unterminated start tag <${el.name}`);
        if (!spaced) fail(`missing whitespace before an attribute in <${el.name}>`);
        const a = name();
        ws();
        if (src[i] !== '=') fail(`attribute ${a} has no value`);
        i++;
        ws();
        const q = src[i];
        if (q !== '"' && q !== "'") fail(`attribute ${a} value is not quoted`);
        const e = src.indexOf(q, i + 1);
        if (e < 0) fail(`unterminated value for attribute ${a}`);
        const raw = src.slice(i + 1, e);
        if (raw.includes('<')) fail(`"<" inside the value of attribute ${a}`);
        if (Object.hasOwn(el.attrs, a)) fail(`duplicate attribute ${a} on <${el.name}>`);
        el.attrs[a] = decode(raw, i + 1);
        i = e + 1;
      }
      if (stack.length) stack.at(-1).children.push(el);
      else root = el;
      if (!self) stack.push(el);
      else if (!stack.length) done = true;
    }
  }
  if (stack.length) fail(`unclosed element <${stack.at(-1).name}>`);
  if (!root) fail('no root element');
  return root;
}

const kids = (el, n) => el.children.filter((c) => c.name === n);

function checkFeed(xml) {
  const errs = [];
  let root;
  try { root = parseXml(xml); } catch (e) { return { errs: [`not well-formed: ${e.message}`], entries: 0, links: 0 }; }
  if (root.name !== 'feed' || root.attrs.xmlns !== ATOM_NS) errs.push(`root is <${root.name}> in ${root.attrs.xmlns ?? 'no namespace'}, want <feed> in ${ATOM_NS}`);
  const one = (el, n, where) => {
    const k = kids(el, n);
    if (k.length !== 1) { errs.push(`${where}: ${k.length} <${n}> elements, want exactly 1`); return null; }
    return k[0];
  };
  let links = 0;
  const https = (v, where) => { links++; if (!HTTPS.test(v ?? '')) errs.push(`${where}: not an absolute https URL: ${JSON.stringify(v)}`); };
  const walk = (el, path) => {
    for (const a of ['href', 'src']) if (a in el.attrs) https(el.attrs[a], `${path} @${a}`);
    if (['uri', 'icon', 'logo'].includes(el.name)) https(el.text.trim(), path);
    el.children.forEach((c) => walk(c, `${path}/${c.name}`));
  };
  walk(root, root.name);
  const fid = one(root, 'id', 'feed');
  if (fid && fid.text !== FEED_ID) errs.push(`feed id is ${JSON.stringify(fid.text)}, want ${FEED_ID}`);
  const ft = one(root, 'title', 'feed');
  if (ft && !ft.text.trim()) errs.push('feed title is empty');
  const fu = one(root, 'updated', 'feed');
  if (fu && !RFC3339.test(fu.text)) errs.push(`feed updated ${JSON.stringify(fu.text)} is not RFC 3339`);
  if (!kids(root, 'link').some((l) => l.attrs.rel === 'self' && l.attrs.href === FEED_URL)) errs.push(`no <link rel="self" href="${FEED_URL}">`);
  if (!kids(root, 'author').length) errs.push('no feed-level <author>');
  const entries = kids(root, 'entry');
  if (!entries.length) errs.push('empty scan set: the feed has no entries');
  if (entries.length > MAX_ENTRIES) errs.push(`${entries.length} entries, cap is ${MAX_ENTRIES}`);
  const ids = new Set();
  let prev = null;
  entries.forEach((e, n) => {
    const where = `entry ${n + 1}`;
    const id = one(e, 'id', where);
    if (id) {
      if (!id.text.startsWith(ENTRY_ID)) errs.push(`${where}: id ${JSON.stringify(id.text)} does not start with ${ENTRY_ID}`);
      if (ids.has(id.text)) errs.push(`${where}: duplicate id ${id.text}`);
      ids.add(id.text);
    }
    const t = one(e, 'title', where);
    if (t && !t.text.trim()) errs.push(`${where}: empty title`);
    const u = one(e, 'updated', where);
    if (u) {
      if (!RFC3339.test(u.text)) errs.push(`${where}: updated ${JSON.stringify(u.text)} is not RFC 3339`);
      else if (prev !== null && Date.parse(u.text) > prev) errs.push(`${where}: newer than the entry above it (entries must be newest first)`);
      else prev = Date.parse(u.text);
    }
    if (!kids(e, 'link').some((l) => (l.attrs.rel ?? 'alternate') === 'alternate')) errs.push(`${where}: no alternate link`);
  });
  const newest = entries.map((e) => kids(e, 'updated')[0]?.text).filter((s) => RFC3339.test(s ?? '')).sort().at(-1);
  if (fu && newest && fu.text !== newest) errs.push(`feed updated ${fu.text} is not the newest entry date ${newest}`);
  return { errs, entries: entries.length, links };
}

function checkOpml(xml) {
  const errs = [];
  let root;
  try { root = parseXml(xml); } catch (e) { return { errs: [`not well-formed: ${e.message}`], feeds: 0 }; }
  if (root.name !== 'opml' || root.attrs.version !== '2.0') errs.push(`root is <${root.name} version=${root.attrs.version}>, want <opml version="2.0">`);
  const head = kids(root, 'head')[0];
  if (!head || !kids(head, 'title')[0]?.text.trim()) errs.push('no <head><title>');
  const body = kids(root, 'body')[0];
  if (!body) errs.push('no <body>');
  let feeds = 0;
  const walk = (el) => {
    for (const c of kids(el, 'outline')) {
      if (!c.attrs.text) errs.push('outline without text');
      if ('xmlUrl' in c.attrs) {
        feeds++;
        for (const a of ['xmlUrl', 'htmlUrl']) if (!HTTPS.test(c.attrs[a] ?? '')) errs.push(`outline ${c.attrs.text}: ${a} not an absolute https URL: ${JSON.stringify(c.attrs[a])}`);
      }
      walk(c);
    }
  };
  if (body) walk(body);
  if (!feeds) errs.push('empty scan set: no outline has an xmlUrl');
  if (!body?.children.some((c) => c.attrs.xmlUrl === FEED_URL)) errs.push(`our own feed ${FEED_URL} is not listed`);
  return { errs, feeds };
}

// ---------- CLI ----------
function main(argv) {
  if (argv[0] === '--check') {
    const [feedPath, opmlPath] = argv.slice(1);
    if (!feedPath) die('usage: make-feed.mjs --check FEED [OPML]');
    let bad = 0;
    const f = checkFeed(readFileSync(feedPath, 'utf8'));
    if (f.errs.length) { bad++; console.log('FEED_BAD'); f.errs.slice(0, 20).forEach((e) => console.log(`  ${e}`)); }
    else console.log(`FEED_OK entries=${f.entries} links=${f.links}`);
    if (opmlPath) {
      const o = checkOpml(readFileSync(opmlPath, 'utf8'));
      if (o.errs.length) { bad++; console.log('OPML_BAD'); o.errs.slice(0, 20).forEach((e) => console.log(`  ${e}`)); }
      else console.log(`OPML_OK feeds=${o.feeds}`);
    }
    return bad ? 1 : 0;
  }
  let out = join(ROOT, 'site');
  let ledger = join(ROOT, LEDGER);
  for (let k = 0; k < argv.length; k++) {
    if (argv[k] === '--out' && argv[k + 1]) out = resolve(argv[++k]);
    else if (argv[k] === '--crossings' && argv[k + 1]) ledger = resolve(argv[++k]);
    else die(`unknown argument ${argv[k]}`);
  }
  const feed = buildFeed(ledger);
  const opml = buildOpml();
  // Never write a file the checker would reject.
  const fe = checkFeed(feed.xml).errs;
  const oe = checkOpml(opml.xml).errs;
  if (fe.length || oe.length) die(`generated output fails its own check:\n  ${[...fe, ...oe].join('\n  ')}`);
  mkdirSync(join(out, 'follow'), { recursive: true });
  writeFileSync(join(out, 'feed.xml'), feed.xml);
  writeFileSync(join(out, 'follow', 'franken-suite.opml'), opml.xml);
  console.log(`feed.xml: ${feed.count} entries; follow/franken-suite.opml: ${opml.repos} repos x 2 feeds + ours`);
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  console.error(`make-feed: ${e.message}`);
  process.exitCode = 2;
}
