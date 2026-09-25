#!/usr/bin/env node
// site/scripts/make-llms.mjs: builds site/llms.txt (the llms.txt convention: an H1, a blockquote summary,
// then sections of markdown links with one-line descriptions) from the site's own files.
//
//   node site/scripts/make-llms.mjs              write site/llms.txt, then run --check
//   node site/scripts/make-llms.mjs --check      write nothing; exit 1 on T1 drift (the committed file differs from
//                                                a fresh render, or the render fails), T2 links (a link that is
//                                                not an absolute https URL on this site or its source repository,
//                                                that has no file under site/, or that names an HTML page missing
//                                                from sitemap.xml) or T3 shape (no H1, no blockquote, no section,
//                                                a list line that is not "- [text](url): description")
//   --site DIR                                   operate on another copy of site/
//
// Every sentence comes from a file the site already ships; this script only arranges them:
//   blockquote            FRANKEN_DATA.framing in assets/data.js
//   credit line           the shell footer's "Made by" paragraph (shell.mjs renderFooter)
//   license lines         the License row and the rider definition on self/index.html
//   page lists            shell.mjs PAGES, the repos in assets/data.js, stack/*.html, study deep dives;
//                         link text is the page's <title> (or its PAGES label), the description its
//                         <meta name="description">
//   feeds and evidence    feed.xml <subtitle>, the OPML <title>, RULEBOOK.md's H1 and Scope line,
//                         synthesis/00-overview.md's H1, each packet's H1
// Output is deterministic (fixed or sorted order, no dates, no build time): a rerun on unchanged files is
// byte-identical. verify-site.sh gate T runs --check. No dependencies beyond node's standard library.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { PAGES, BRAND, SITE_ORIGIN, REPO_URL, urlPath, renderFooter } from './shell.mjs';

const DEFAULT_SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'llms.txt';

class LlmsError extends Error {}
const die = (msg) => { throw new LlmsError(msg); };

// ---------- text helpers ----------
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', times: '×', rarr: '→', larr: '←' };
function decode(s, where) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    if (!(e in NAMED)) die(`${where}: unknown entity ${all}`);
    return NAMED[e];
  });
}
const oneLine = (s) => s.replace(/\s+/g, ' ').trim();
/** Visible text of an HTML fragment: tags dropped, entities decoded, whitespace collapsed. */
const textOf = (html, where) => oneLine(decode(html.replace(/<[^>]*>/g, ''), where));
const linkText = (s) => s.replace(/([\\[\]])/g, '\\$1');
const item = (text, url, desc) => `- [${linkText(text)}](${url}): ${desc}`;

function read(site, rel) {
  const f = join(site, rel);
  if (!existsSync(f)) die(`${rel}: missing (llms.txt lists it)`);
  return readFileSync(f, 'utf8');
}
function one(re, src, where, what) {
  const m = re.exec(src);
  if (!m) die(`${where}: no ${what}`);
  return m;
}

/** <title> without the " · Franken Research" suffix, and <meta name="description">, as plain text. */
function pageFacts(site, rel) {
  const html = read(site, rel);
  const title = textOf(one(/<title>([^<]*)<\/title>/, html, rel, '<title>')[1], rel).replace(/\s+·\s+Franken Research$/, '');
  const desc = textOf(one(/<meta name="description" content="([^"]*)"/, html, rel, '<meta name="description">')[1], rel);
  if (!title || !desc) die(`${rel}: empty <title> or description`);
  return { title, desc };
}
const pageUrl = (rel) => SITE_ORIGIN + urlPath(rel);
const fileUrl = (rel) => `${SITE_ORIGIN}/${rel}`;
const h1Of = (site, rel) => oneLine(one(/^# (.+)$/m, read(site, rel), rel, 'H1')[1]);

function loadData(site) {
  const sandbox = { window: {} };
  vm.runInNewContext(read(site, 'assets/data.js'), sandbox);
  const d = sandbox.window.FRANKEN_DATA;
  if (!d || !Array.isArray(d.repos) || !d.repos.length || typeof d.framing !== 'string') die('assets/data.js: no FRANKEN_DATA.framing or repos');
  return d;
}
const htmlIn = (site, dir) => existsSync(join(site, dir))
  ? readdirSync(join(site, dir)).filter((n) => n.endsWith('.html') && n !== 'index.html').sort().map((n) => `${dir}/${n}`)
  : [];

// ---------- render ----------
export function render(site = DEFAULT_SITE) {
  const data = loadData(site);
  const who = textOf(one(/<p class="shell-who">([\s\S]*?)<\/p>/, renderFooter('method/index.html'), 'shell.mjs renderFooter', 'shell-who paragraph')[1], 'shell footer');

  // License framing, verbatim from the self-assessment page.
  const self = read(site, 'self/index.html');
  const row = one(/<td class="dim">License<\/td>\s*<td class="suite"[^>]*>([\s\S]*?)<\/td>\s*<td class="ours"[^>]*>([\s\S]*?)<\/td>/, self, 'self/index.html', 'License row');
  const suite = textOf(row[1], 'self/index.html');
  const ours = textOf(row[2].replace(/<span class="tag">[\s\S]*?<\/span>/g, ''), 'self/index.html');
  const rider = 'The rider is ' + textOf(one(/The <b>rider<\/b> is ([^.;<]+)[.;]/, self, 'self/index.html', 'rider definition')[1], 'self/index.html') + '.';

  const out = [`# ${BRAND}`, '', `> ${oneLine(data.framing)}`, '', who, '',
    `License of the assessed repositories: ${suite} ${rider}`, '',
    `License of this site: ${ours}`, '',
    `Source: ${REPO_URL}`, ''];
  const section = (name, lines) => { if (!lines.length) die(`section "${name}" is empty`); out.push(`## ${name}`, '', ...lines, ''); };

  section('Pages', PAGES.filter((p) => !p.hash).map((p) => item(p.label, pageUrl(p.file), pageFacts(site, p.file).desc)));
  section('Briefs', data.repos.map((r) => {
    const rel = `briefs/${r.name}.html`;
    const f = pageFacts(site, rel);
    return item(f.title, pageUrl(rel), f.desc);
  }));
  const titled = (rel) => { const f = pageFacts(site, rel); return item(f.title, pageUrl(rel), f.desc); };
  section('Agent stack verdicts', htmlIn(site, 'stack').map(titled));
  section('Independent 100 study deep dives', htmlIn(site, 'study/independent-100/deep').map(titled));

  const feed = read(site, 'feed.xml');
  const opml = read(site, 'follow/franken-suite.opml');
  section('Feeds', [
    item('Atom feed', fileUrl('feed.xml'), textOf(one(/<subtitle>([^<]*)<\/subtitle>/, feed, 'feed.xml', '<subtitle>')[1], 'feed.xml')),
    item('OPML', fileUrl('follow/franken-suite.opml'), textOf(one(/<title>([^<]*)<\/title>/, opml, 'follow/franken-suite.opml', '<title>')[1], 'follow/franken-suite.opml')),
  ]);
  const scope = oneLine(one(/^\*\*Scope:\*\*\s*(.+)$/m, read(site, 'RULEBOOK.md'), 'RULEBOOK.md', 'Scope line')[1]);
  section('Evidence', [
    item('RULEBOOK.md', fileUrl('RULEBOOK.md'), `${h1Of(site, 'RULEBOOK.md')}. ${scope}`),
    item('synthesis/00-overview.md', fileUrl('synthesis/00-overview.md'), h1Of(site, 'synthesis/00-overview.md')),
  ]);
  section('Optional', data.repos.map((r) => {
    const rel = `packets/${r.name}-assessment.md`;
    return item(rel, fileUrl(rel), h1Of(site, rel));
  }));
  return out.join('\n');
}

// ---------- check ----------
const LIST_LINE = /^- \[((?:\\.|[^\]\\])+)\]\((https:\/\/[^\s)]+)\): \S.*$/;

/** Public path -> file under site/: / and dir/ serve index.html, an extensionless path serves path.html. */
function fileFor(path) {
  if (path.endsWith('/')) return path.slice(1) + 'index.html';
  const rel = path.slice(1);
  return /\.[A-Za-z0-9]+$/.test(rel) ? rel : rel + '.html';
}

/** T2 and T3 over a llms.txt text. Returns { errs, links, sections }. */
export function checkText(site, text) {
  const errs = [];
  const lines = text.split('\n');
  if (!/^# \S/.test(lines[0] || '')) errs.push('T3 shape: line 1 is not an H1');
  if (!lines.some((l) => l.startsWith('> '))) errs.push('T3 shape: no blockquote summary');
  if (!text.endsWith('\n') || text.endsWith('\n\n')) errs.push('T3 shape: the file must end with exactly one newline');
  const sitemap = existsSync(join(site, 'sitemap.xml'))
    ? new Set([...readFileSync(join(site, 'sitemap.xml'), 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]))
    : null;
  if (!sitemap) errs.push('T2 links: sitemap.xml missing');
  let links = 0; let sections = 0; let inSection = false;
  lines.forEach((l, i) => {
    const at = `line ${i + 1}`;
    if (l.startsWith('## ')) { sections++; inSection = true; return; }
    if (!inSection || l === '') return;
    const m = LIST_LINE.exec(l);
    if (!m) { errs.push(`T3 shape: ${at} is not "- [text](url): description": ${l.slice(0, 80)}`); return; }
    links++;
    const url = m[2];
    if (url === REPO_URL || url.startsWith(REPO_URL + '/')) return;
    if (!url.startsWith(SITE_ORIGIN + '/')) { errs.push(`T2 links: ${at} links ${url}, which is not on ${SITE_ORIGIN} or ${REPO_URL}`); return; }
    const path = url.slice(SITE_ORIGIN.length);
    if (/[?#]/.test(path)) { errs.push(`T2 links: ${at} links ${url} with a query or fragment`); return; }
    const rel = fileFor(path);
    const f = join(site, rel);
    if (!existsSync(f) || !statSync(f).isFile()) { errs.push(`T2 links: ${at} links ${url}, which has no file site/${rel}`); return; }
    if (rel.endsWith('.html') && sitemap && !sitemap.has(url)) errs.push(`T2 links: ${at} links ${url}, a page sitemap.xml does not list`);
  });
  if (!sections) errs.push('T3 shape: no ## section');
  if (!links) errs.push('empty scan set: no links (a gate that checks nothing is not a pass)');
  return { errs, links, sections };
}

export function check(site) {
  const errs = [];
  let fresh = null;
  try { fresh = render(site); } catch (e) { if (!(e instanceof LlmsError)) throw e; errs.push(`T1 drift: the render fails: ${e.message}`); }
  const f = join(site, OUT);
  if (!existsSync(f)) return { errs: [...errs, `T1 drift: site/${OUT} missing (run: bun run build:llms)`], links: 0, sections: 0 };
  const have = readFileSync(f, 'utf8');
  if (fresh !== null && have !== fresh) {
    const a = have.split('\n'); const b = fresh.split('\n');
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    errs.push(`T1 drift: site/${OUT} differs from a fresh render at line ${i + 1} (run: bun run build:llms)`);
  }
  const t = checkText(site, have);
  return { errs: [...errs, ...t.errs], links: t.links, sections: t.sections };
}

// ---------- command line ----------
function main(argv) {
  const si = argv.indexOf('--site');
  const site = si >= 0 ? resolve(argv[si + 1]) : DEFAULT_SITE;
  for (let k = 0; k < argv.length; k++) {
    if (argv[k] === '--site') k++;
    else if (argv[k] !== '--check') die(`unknown argument ${argv[k]}`);
  }
  if (!argv.includes('--check')) {
    const text = render(site);
    const e = checkText(site, text).errs;
    if (e.length) die(`the render fails its own check, nothing written:\n  ${e.join('\n  ')}`);
    const f = join(site, OUT);
    const same = existsSync(f) && readFileSync(f, 'utf8') === text;
    if (!same) writeFileSync(f, text);
    console.log(`${OUT}: ${same ? 'unchanged' : 'written'}`);
  }
  const { errs, links, sections } = check(site);
  if (errs.length) {
    console.log('LLMS_BAD');
    errs.slice(0, 20).forEach((e) => console.log('  ' + e));
    if (errs.length > 20) console.log(`  ... and ${errs.length - 20} more`);
    return 1;
  }
  console.log(`LLMS_OK links=${links} sections=${sections}`);
  return 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) {
    if (!(e instanceof LlmsError)) throw e;
    console.log('LLMS_BAD'); console.log('  ' + e.message); process.exitCode = 1;
  }
}
