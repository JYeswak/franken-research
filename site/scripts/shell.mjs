#!/usr/bin/env node
// site/scripts/shell.mjs: the shared shell (head links, site nav, footer) on every page of site/.
//
//   node site/scripts/shell.mjs                  rewrite the shell regions of every page, then run --check
//   node site/scripts/shell.mjs --check          exit 1 if a page lacks a region, a region differs from a fresh
//                                                render, the page list and sitemap.xml disagree, or a prefilled
//                                                issue link names a field the issue forms do not have
//   --site DIR                                   operate on another copy of site/ (issue forms read from DIR/../.github)
//
// A region is everything between <!-- shell:NAME --> and <!-- /shell:NAME -->. This script owns it and
// rewrites it whole; the rest of each page belongs to the page. Regions per page:
//   head    every page: shell.css and the Atom feed link, placed just before </head>
//   nav     every page except the home page: replaces the page's own site nav on the first run
//           (<nav aria-label="Site">, nav.topnav, nav.sitenav or nav.back)
//   footer  every page except the home page: placed just before </body> on the first run
// The home page is a full-screen map with its own layout; it imports renderDirectory() from here.
// 404.html gets no shell: the host serves it at any depth, so relative links would point at the wrong folder.
// verify-site.sh gate S runs --check. No dependencies beyond node's standard library.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE_ORIGIN = 'https://fr.zeststream.ai';
export const REPO_URL = 'https://github.com/JYeswak/franken-research';

// The canonical page list: one label per page, used by the nav, the footer directory, and the home page.
// `file` is relative to site/; `hash` marks a view of a page rather than a page of its own.
export const PAGES = [
  { key: 'map', label: 'Map', file: 'index.html' },
  { key: 'table', label: 'Verdict table', file: 'index.html', hash: 'tableview' },
  { key: 'method', label: 'Method', file: 'method/index.html' },
  { key: 'techniques', label: 'Techniques', file: 'techniques/index.html' },
  { key: 'failure-modes', label: 'Failure modes', file: 'failure-modes/index.html' },
  { key: 'lessons', label: 'Lessons', file: 'lessons/index.html' },
  { key: 'reproduce', label: 'Reproduce a verdict', file: 'reproduce/index.html' },
  { key: 'starter-kit', label: 'Starter kit', file: 'starter-kit/index.html' },
  { key: 'stack', label: 'Agent stack', file: 'stack/index.html' },
  { key: 'rigor', label: 'Rigor practices', file: 'rigor/index.html' },
  { key: 'beyond', label: 'Beyond FrankenSuite', file: 'beyond/index.html' },
  { key: 'updates', label: 'Updates', file: 'updates/index.html' },
  { key: 'follow', label: 'Follow', file: 'follow/index.html' },
  { key: 'self', label: 'Graded by our own method', file: 'self/index.html' },
];
// The nav's short list, after the brand link. Every other page is one click away in the footer directory.
export const PRIMARY = ['method', 'starter-kit', 'stack', 'updates', 'follow'];
export const BRAND = 'Franken Research';

// Issue forms (.github/ISSUE_TEMPLATE/<form>) and the field ids each prefilled link sets.
const FORMS = { 'correction.yml': ['repository', 'page'], 'idea.yml': ['page'], 'site-bug.yml': ['page'] };

const HOME = 'index.html';
const NO_SHELL = new Set(['404.html']);
const SKIP_DIRS = new Set(['packets', 'synthesis', 'assets', 'scripts', 'og', 'node_modules']);
const byKey = Object.fromEntries(PAGES.map((p) => [p.key, p]));

class ShellError extends Error {}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- page facts ----------
const upOf = (rel) => '../'.repeat(rel.split('/').length - 1);
/** Public path of a page file: index.html -> /, method/index.html -> /method/, briefs/x.html -> /briefs/x */
export function urlPath(rel) {
  if (rel === HOME) return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}
const briefSlug = (rel) => (/^briefs\/([^/]+)\.html$/.exec(rel) || [])[1] || null;
const hrefOf = (p, up) => up + p.file + (p.hash ? '#' + p.hash : '');
// The canonical entry a page is, or failing that the section it sits in (stack/mcp.html is in Agent stack;
// a brief is in the Map). Returns [entry, 'page' | 'true'].
function currentOf(rel) {
  const exact = PAGES.find((p) => p.file === rel && !p.hash);
  if (exact) return [exact, 'page'];
  const parent = PAGES.find((p) => !p.hash && p.file === dirname(rel) + '/index.html');
  return [parent || byKey.map, 'true'];
}
const currentAttr = (rel, p) => {
  const [cur, kind] = currentOf(rel);
  return cur === p ? ` aria-current="${kind}"` : '';
};

function issueUrl(form, fields) {
  const q = Object.entries(fields).map(([k, v]) => k + '=' + encodeURIComponent(v));
  return `${REPO_URL}/issues/new?template=${form}&${q.join('&')}`;
}

// ---------- renderers ----------
/** The page directory as a plain <ul>, links relative to `rel`, the current page marked aria-current. */
export function renderDirectory(rel = HOME, { className = '' } = {}) {
  const up = upOf(rel);
  const items = PAGES.map((p) => `<li><a href="${hrefOf(p, up)}"${currentAttr(rel, p)}>${esc(p.label)}</a></li>`);
  return `<ul${className ? ` class="${esc(className)}"` : ''}>\n${items.join('\n')}\n</ul>`;
}

export function renderHead(rel) {
  return `<link rel="stylesheet" href="${upOf(rel)}assets/shell.css">
<link rel="alternate" type="application/atom+xml" title="${BRAND}" href="${SITE_ORIGIN}/feed.xml">`;
}

export function renderNav(rel) {
  const up = upOf(rel);
  const slug = briefSlug(rel);
  const brand = slug
    ? `<a class="shell-brand" href="${up}index.html#repo=${encodeURIComponent(slug)}"><span aria-hidden="true">&larr;</span>Back to the map</a>`
    : `<a class="shell-brand" href="${up}index.html">${BRAND}</a>`;
  const links = PRIMARY.map((k) => `<li><a href="${hrefOf(byKey[k], up)}"${currentAttr(rel, byKey[k])}>${esc(byKey[k].label)}</a></li>`);
  return `<nav class="shell-nav" aria-label="Site">
${brand}
<ul class="shell-links">
${links.join('\n')}
</ul>
</nav>`;
}

export function renderFooter(rel) {
  const up = upOf(rel);
  const page = SITE_ORIGIN + urlPath(rel);
  const slug = briefSlug(rel);
  const fix = slug ? issueUrl('correction.yml', { repository: slug, page }) : issueUrl('idea.yml', { page });
  const bug = issueUrl('site-bug.yml', { page });
  return `<div class="shell-foot">
<div class="shell-grid">
<nav class="shell-dir" aria-label="All pages">
<p class="shell-h">All pages</p>
${renderDirectory(rel)}
</nav>
<div class="shell-side">
<p class="shell-h">Help fix it</p>
<ul class="shell-acts">
<li><a href="${esc(fix)}">Suggest a fix or an idea</a></li>
<li><a href="${esc(bug)}">Report a site problem</a></li>
</ul>
<p class="shell-note">Each opens a GitHub issue form with this page&rsquo;s address filled in. You need a GitHub account.</p>
<p class="shell-follow">Follow updates: <a href="${up}feed.xml">Atom feed</a> <span aria-hidden="true">&middot;</span> <a href="${up}follow/index.html">${esc(byKey.follow.label)}</a></p>
</div>
</div>
<p class="shell-who">Made by Joshua Nowak (ZestStream) with AI coding agents. Not affiliated with or funded by Jeffrey Emanuel; Joshua uses his public tools and is a paying subscriber to jeffreys-skills.md.</p>
<p class="shell-src"><a href="${REPO_URL}">Source on GitHub</a> <span aria-hidden="true">&middot;</span> <a href="${REPO_URL}/blob/main/LICENSE">MIT licensed</a></p>
</div>`;
}

/** The regions a page carries, in the order they are placed on a first run. */
export function regionsFor(rel) {
  const out = { head: renderHead(rel) };
  if (rel !== HOME) { out.nav = renderNav(rel); out.footer = renderFooter(rel); }
  return out;
}

// ---------- region editing ----------
const OPEN = (name) => `<!-- shell:${name} -->`;
const CLOSE = (name) => `<!-- /shell:${name} -->`;
const block = (name, content) => `${OPEN(name)}\n${content}\n${CLOSE(name)}`;
const countOf = (html, s) => html.split(s).length - 1;

/** The current text of a region, null when absent; throws when the markers are unbalanced or repeated. */
function regionOf(rel, html, name) {
  const o = countOf(html, OPEN(name));
  const c = countOf(html, CLOSE(name));
  if (o === 0 && c === 0) return null;
  if (o !== 1 || c !== 1) throw new ShellError(`${rel}: shell:${name} has ${o} opening and ${c} closing markers (want 1 and 1)`);
  const i = html.indexOf(OPEN(name));
  const j = html.indexOf(CLOSE(name));
  if (j < i) throw new ShellError(`${rel}: shell:${name} closes before it opens`);
  return { start: i, end: j + CLOSE(name).length, text: html.slice(i, j + CLOSE(name).length) };
}

// First run only: where each region goes on a page that has none.
function firstPlacement(rel, html, name, text) {
  if (name === 'head' || name === 'footer') {
    const tag = name === 'head' ? '</head>' : '</body>';
    const n = countOf(html, tag);
    if (n !== 1) throw new ShellError(`${rel}: ${n} ${tag} tags (want 1); place <!-- shell:${name} --><!-- /shell:${name} --> by hand`);
    const i = html.indexOf(tag);
    return html.slice(0, i) + text + '\n' + html.slice(i);
  }
  // nav: the page's own site nav, replaced in place
  for (const m of html.matchAll(/<nav\b([^>]*)>/g)) {
    const attrs = m[1];
    const cls = (/\bclass="([^"]*)"/.exec(attrs) || [])[1] || '';
    const isSite = /\baria-label="Site"/.test(attrs) || cls.split(/\s+/).some((c) => ['topnav', 'sitenav', 'back'].includes(c));
    if (!isSite) continue;
    const end = html.indexOf('</nav>', m.index);
    if (end < 0) break;
    if (html.slice(m.index + m[0].length, end).includes('<nav')) throw new ShellError(`${rel}: nested <nav> inside the site nav`);
    return html.slice(0, m.index) + text + html.slice(end + '</nav>'.length);
  }
  throw new ShellError(`${rel}: no site nav to replace; put <!-- shell:nav --><!-- /shell:nav --> where the nav belongs`);
}

/** Returns `html` with every region of `rel` rendered fresh. Idempotent: applyShell(r, applyShell(r, h)) === applyShell(r, h). */
export function applyShell(rel, html) {
  const want = regionsFor(rel);
  for (const name of ['head', 'nav', 'footer']) {
    if (!(name in want) && regionOf(rel, html, name)) throw new ShellError(`${rel}: has a shell:${name} region this page should not carry`);
  }
  let out = html;
  for (const [name, content] of Object.entries(want)) {
    const text = block(name, content);
    const r = regionOf(rel, out, name);
    out = r ? out.slice(0, r.start) + text + out.slice(r.end) : firstPlacement(rel, out, name, text);
  }
  return out;
}

// ---------- the tree ----------
/** Every page the shell covers, relative to `site` with forward slashes, sorted. */
export function shellPages(site) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      const rel = relative(site, p).split(sep).join('/');
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) || dir !== site) walk(p); continue; }
      if (e.name.endsWith('.html') && !NO_SHELL.has(rel)) out.push(rel);
    }
  };
  walk(site);
  return out.sort();
}

function sitemapPaths(site) {
  const f = join(site, 'sitemap.xml');
  if (!existsSync(f)) throw new ShellError('sitemap.xml: missing');
  const locs = [...readFileSync(f, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const bad = locs.filter((u) => !u.startsWith(SITE_ORIGIN + '/'));
  return { paths: locs.map((u) => u.slice(SITE_ORIGIN.length)), bad };
}

// Field ids of an issue form, and the options of its dropdown with id `dropdown`.
function formFacts(file, dropdown) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const ids = new Set();
  const options = [];
  let inDrop = false; let inOpts = false;
  for (const ln of lines) {
    const id = /^\s*id:\s*(\S+)\s*$/.exec(ln);
    if (/^\s*- type:/.test(ln)) { inDrop = false; inOpts = false; }
    if (id) { ids.add(id[1]); inDrop = id[1] === dropdown; }
    if (inDrop && /^\s*options:\s*$/.test(ln)) { inOpts = true; continue; }
    if (inOpts) {
      const o = /^\s*-\s+(.+?)\s*$/.exec(ln);
      if (o) options.push(o[1].replace(/^["']|["']$/g, ''));
      else if (/^\s*\S+:/.test(ln)) inOpts = false;
    }
  }
  return { ids, options };
}

/** Everything gate S checks. Returns a list of problems; empty means pass. */
export function check(site) {
  const errs = [];
  const pages = shellPages(site);
  let regions = 0;
  for (const rel of pages) {
    const html = readFileSync(join(site, rel), 'utf8');
    try {
      for (const [name, content] of Object.entries(regionsFor(rel))) {
        const r = regionOf(rel, html, name);
        if (!r) { errs.push(`${rel}: missing the shell:${name} region`); continue; }
        regions++;
        if (r.text !== block(name, content)) errs.push(`${rel}: shell:${name} differs from the render (run: bun run build:shell)`);
      }
      if (applyShell(rel, html) !== html && !errs.some((e) => e.startsWith(rel + ':'))) errs.push(`${rel}: not idempotent under a rerun`);
    } catch (e) {
      if (!(e instanceof ShellError)) throw e;
      errs.push(e.message);
    }
  }
  // the canonical list, the page files, and sitemap.xml name the same pages
  const { paths, bad } = sitemapPaths(site);
  for (const u of bad) errs.push(`sitemap.xml: ${u} is not under ${SITE_ORIGIN}/`);
  const inMap = new Set(paths);
  const canon = new Set(PAGES.map((p) => urlPath(p.file)));
  const sections = new Set(paths.filter((u) => u.endsWith('/')));
  for (const u of canon) if (!sections.has(u)) errs.push(`page list names ${u}, which sitemap.xml does not`);
  for (const u of sections) if (!canon.has(u)) errs.push(`sitemap.xml names ${u}, which the page list in shell.mjs does not`);
  for (const p of PAGES) if (!existsSync(join(site, p.file))) errs.push(`page list names ${p.file}, which does not exist`);
  const onDisk = new Set(pages.map(urlPath));
  for (const rel of pages) if (!inMap.has(urlPath(rel))) errs.push(`${rel}: page not in sitemap.xml`);
  for (const u of paths) if (!onDisk.has(u)) errs.push(`sitemap.xml names ${u}, which has no page file`);
  // every prefilled field exists on its form, and every brief is an option of the correction form
  const forms = resolve(site, '..', '.github', 'ISSUE_TEMPLATE');
  for (const [form, fields] of Object.entries(FORMS)) {
    const f = join(forms, form);
    if (!existsSync(f)) { errs.push(`.github/ISSUE_TEMPLATE/${form}: missing (the footer links to it)`); continue; }
    const { ids, options } = formFacts(f, 'repository');
    for (const id of fields) if (!ids.has(id)) errs.push(`${form}: no field id "${id}" (the footer prefills it)`);
    if (form === 'correction.yml') {
      for (const rel of pages) {
        const s = briefSlug(rel);
        if (s && !options.includes(s)) errs.push(`correction.yml: repository has no option "${s}" (briefs/${s}.html prefills it)`);
      }
    }
  }
  return { errs, pages: pages.length, regions };
}

// ---------- command line ----------
function main(argv) {
  const si = argv.indexOf('--site');
  const site = si >= 0 ? resolve(argv[si + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (!existsSync(site) || !statSync(site).isDirectory()) { console.log('SHELL_BAD'); console.log(`  no site directory at ${site}`); return 1; }
  if (!argv.includes('--check')) {
    const changed = [];
    try {
      const next = shellPages(site).map((rel) => {
        const html = readFileSync(join(site, rel), 'utf8');
        return [rel, html, applyShell(rel, html)];
      });
      for (const [rel, before, after] of next) if (after !== before) { writeFileSync(join(site, rel), after); changed.push(rel); }
    } catch (e) {
      if (!(e instanceof ShellError)) throw e;
      console.log('SHELL_BAD'); console.log('  ' + e.message); console.log('  nothing written'); return 1;
    }
    console.log(`shell: ${changed.length} page(s) rewritten${changed.length ? ': ' + changed.join(', ') : ''}`);
  }
  const { errs, pages, regions } = check(site);
  if (!pages) errs.unshift('empty scan set: no pages found (a gate that checks nothing is not a pass)');
  if (errs.length) {
    console.log('SHELL_BAD');
    errs.slice(0, 20).forEach((e) => console.log('  ' + e));
    if (errs.length > 20) console.log(`  ... and ${errs.length - 20} more`);
    return 1;
  }
  console.log(`SHELL_OK pages=${pages} regions=${regions} canonical=${PAGES.length}`);
  return 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main(process.argv.slice(2)));
