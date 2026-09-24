#!/usr/bin/env node
// make-stack.mjs: generate the agent-stack pages from their sources.
//
//   node site/scripts/make-stack.mjs            writes into site/
//   node site/scripts/make-stack.mjs --out DIR  writes the same tree into DIR
//
// Inputs:  stack/<slug>.md (every file except METHOD.md), stack/rigor-practices.tsv,
//          stack/METHOD.md (verdict legend), ecosystem/pickup/pickup-*.md (the 21 areas).
// Outputs: stack/index.html, stack/<slug>.html, rigor/index.html (relative to the
//          output dir). Output is deterministic: sorted inputs, no timestamps, so two
//          runs are byte-identical and Gate K4 can compare a fresh run to the shipped
//          pages. A verdict file that does not exist is not rendered: no placeholders.
//          The site nav, footer and head links are the shared shell from shell.mjs,
//          filled into each page's shell regions before it is written.
// No dependencies beyond node's standard library.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyShell } from './shell.mjs';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const oi = process.argv.indexOf('--out');
const OUT = oi > 0 ? path.resolve(process.argv[oi + 1]) : SITE;

const BASE = 'https://fr.zeststream.ai';
// Every GitHub link points at the release tag (v<package.json version>), never at a moving branch,
// so a citation keeps landing on the line it quotes after later pushes.
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(PKG.version || '')) throw new Error('package.json needs a semver "version" for the pinned GitHub ref');
const REF = 'v' + PKG.version;
const GH = 'https://github.com/JYeswak/franken-research/blob/' + REF + '/';
const GH_TREE = 'https://github.com/JYeswak/franken-research/tree/' + REF + '/';
const GROUPS = ['Model serving', 'Orchestration', 'Tools and environment',
  'Memory and retrieval', 'Eval and safety', 'Training and voice'];
const VERDICTS = [
  { name: 'Adopt', cls: 'v-adopt' },
  { name: 'Adopt and wrap', cls: 'v-wrap' },
  { name: 'Build clean-room', cls: 'v-build' },
  { name: 'Watch', cls: 'v-watch' },
];
const SECTIONS = ['Bottom line', 'Adopt, do not rebuild', 'Copy these practices',
  'Build only if', 'Where FrankenSuite touches this', 'What we cannot say', 'Revisit when'];
// Same citation shape Gate K2 checks: <path with extension>:<line>[-<line>] "<verbatim quote>".
const CITE = /(?<![\w/.:#-])((?:[\w.-]+\/)*[\w-][\w.-]*\.[A-Za-z][A-Za-z0-9]*):(\d+)(?:[-\u2013](\d+))?(?!\w)(?:\s+"([^"\n]*)")?/g;
const TIER = /\[(Verified|CI-observed|Maintainer claim|External|Inference)((?:[,;][^\]\n]*)?)\]/g;
const KIT_IDS = /Starter kit:\s*((?:[A-D]\d+|none)(?:\s*[;,|/]\s*(?:[A-D]\d+|none))*)/g;

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Starter-kit items: readers see the CHECKLIST.md title, linked to its GitHub heading anchor.
const KIT = {};
for (const m of read('starter-kit/CHECKLIST.md').matchAll(/^### ([A-Z]\d+) \u2014 (.*)$/gm)) {
  const heading = m[0].slice(4);
  // GitHub heading anchors: lowercase, drop punctuation other than "-" and "_", spaces become "-".
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-');
  const provisional = /\s*\[PROVISIONAL\]\s*$/.test(m[2]);
  KIT[m[1]] = { title: m[2].replace(/\s*\[PROVISIONAL\]\s*$/, '') + (provisional ? ' (provisional)' : ''), anchor };
}
const kitLink = (id) => KIT[id]
  ? `<a class="kit" href="${GH}starter-kit/CHECKLIST.md#${KIT[id].anchor}">${esc(KIT[id].title)}</a>`
  : esc(id);

// ---------- links ----------
// A repo file that ships byte-identical under site/ is linked relatively (works from
// the offline zip); anything else links to GitHub. Markdown needs ?plain=1 for #L anchors.
function shipsUnderSite(p) {
  if (p.startsWith('site/')) return exists(p) ? p.slice(5) : null;
  const s = path.join(SITE, p);
  if (!fs.existsSync(s) || !exists(p) || !fs.statSync(s).isFile()) return null;
  return fs.readFileSync(s).equals(fs.readFileSync(path.join(ROOT, p))) ? p : null;
}
function fileHref(p, line, end) {
  const shipped = shipsUnderSite(p);
  if (shipped) return '../' + shipped;
  const anchor = line ? '#L' + line + (end ? '-L' + end : '') : '';
  return GH + p + (line && p.endsWith('.md') ? '?plain=1' : '') + anchor;
}

// ---------- inline markdown subset ----------
function inline(text, ctx) {
  // Quoted citations and starter-kit id lists are lifted out before code spans are split,
  // because a verbatim quote may itself contain backticks.
  const outer = [];
  const hold1 = (html) => '\u0001' + (outer.push(html) - 1) + '\u0001';
  text = text.replace(CITE, (m, p, line, end, quote) => {
    const ref = p + ':' + line + (end ? '-' + end : '');
    const q = quote === undefined ? '' : quote.replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
    return hold1('<a class="cite" href="' + esc(fileHref(p, line, end)) + '">' + esc(ref) + '</a>'
      + (q ? ' <q class="cq">' + esc(q) + '</q>' : ''));
  });
  text = text.replace(KIT_IDS, (m, ids) => {
    const list = ids.split(/\s*[;,|/]\s*/).filter((x) => x && x !== 'none');
    return hold1('Starter kit: ' + (list.length ? list.map(kitLink).join('; ') : 'none'));
  });
  const parts = text.split(/(`[^`\n]+`)/);
  return parts.map((seg) => {
    if (seg.length > 1 && seg.startsWith('`') && seg.endsWith('`')) return '<code>' + esc(seg.slice(1, -1)) + '</code>';
    const hold = [];
    const put = (html) => '\u0000' + (hold.push(html) - 1) + '\u0000';
    let s = seg.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      let href = url;
      if (!/^(https?:|mailto:|#)/.test(url)) {
        const rp = path.relative(ROOT, path.resolve(path.join(ROOT, ctx.dir), url.split('#')[0]));
        href = fileHref(rp.split(path.sep).join('/'));
      }
      return put('<a href="' + esc(href) + '">' + esc(label).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</a>');
    });
    s = s.replace(TIER, (m) => put('<span class="tier">' + esc(m) + '</span>'));
    s = s.replace(/https?:\/\/[^\s)<>\]]+[^\s)<>\].,;:]/g, (u) => put('<a href="' + esc(u) + '">' + esc(u) + '</a>'));
    s = esc(s).replace(/\*\*(.+?)\*\*/g, (_, b) => '<b>' + b + '</b>' + (ctx.lic ? ctx.lic(b) : ''));
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => hold[+i]);
  }).join('').replace(/\u0001(\d+)\u0001/g, (_, i) => outer[+i]);
}

// Block subset: paragraphs, "- " / "* " lists (indented continuation lines), "1. " lists, ### headings.
function blocks(md, ctx) {
  const out = [];
  let list = null; let para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' '), ctx) + '</p>'); para = []; } };
  const flushList = () => {
    if (list) { out.push('<' + list.tag + '>' + list.items.map((i) => '<li>' + inline(i, ctx) + '</li>').join('') + '</' + list.tag + '>'); list = null; }
  };
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = /^###\s+(.*)$/.exec(line))) { flushPara(); flushList(); out.push('<h3>' + inline(m[1], ctx) + '</h3>'); continue; }
    if ((m = /^\s{0,1}[-*]\s+(.*)$/.exec(line)) || (m = /^\s{0,1}\d+\.\s+(.*)$/.exec(line))) {
      flushPara();
      const tag = /^\s{0,1}\d+\./.test(line) ? 'ol' : 'ul';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push(m[1]);
      continue;
    }
    if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}

function parseVerdict(slug) {
  const src = read('stack/' + slug + '.md');
  const fm = {};
  let body = src;
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (m) {
    for (const l of m[1].split('\n')) {
      const k = /^([A-Za-z_]+):\s*(.*)$/.exec(l);
      if (k) fm[k[1]] = k[2].trim();
    }
    body = src.slice(m[0].length);
  }
  const sections = {};
  const order = [];
  let cur = null;
  for (const l of body.split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(l);
    if (h && !l.startsWith('###')) { cur = h[1]; order.push(cur); sections[cur] = []; continue; }
    if (cur) sections[cur].push(l);
  }
  for (const k of order) sections[k] = sections[k].join('\n').trim();
  return { slug, fm, sections, order };
}

// ---------- shared page frame ----------
const TERMS = [
  ['NODUS', /NODUS/, '<b>NODUS</b> is the four-ring verdict scale (Invest, Pilot, Explore, Monitor) used for the FrankenSuite assessments; the agent-stack verdicts use their own scale (Adopt, Adopt and wrap, Build clean-room, Watch).'],
  ['TRL', /\bTRL\b/, '<b>TRL</b> is technology readiness level, scored 1 to 9.'],
  ['CI', /\bCI\b/, '<b>CI</b> is continuous integration: automated checks that run on every push.'],
  ['pin', /\bpin\b|\bpinned\b/i, 'To <b>pin</b> is to freeze a dependency, oracle, or assessment at an exact commit or version, so later changes cannot silently alter what was checked.'],
  ['rider', /\brider\b/i, 'The <b>rider</b> is the license clause withholding all rights, including benchmarking and testing, from OpenAI, Anthropic, their affiliates, and anyone acting for them; most FrankenSuite repos carry it.'],
  ['bus factor', /bus factor/i, '<b>Bus factor</b> is how many people would have to leave before a project stalls.'],
];
const visible = (html) => html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

// Definitions box: only the terms the page actually uses, placed before their first use.
function vocab(html, lead) {
  const txt = visible(html);
  const defs = TERMS.filter(([, rx]) => rx.test(txt)).map(([, , d]) => d);
  if (!defs.length && !lead) return '';
  return '<div class="vocab">' + (lead ? lead + ' ' : '') + defs.join(' ') + '</div>';
}

const CSS = `/* Franken Research agent-stack pages. Generated by site/scripts/make-stack.mjs. Zero dependencies; works from file://. */
:root{
  --bg:#0c0c0e; --bg-2:#121215; --bg-3:#17171b;
  --ink:#ece5d8; --ink-dim:#b7b0a2; --muted:#8d867a; --line:#26262c;
  --accent:#ff7a3d; --gold:#f0a832; --green:#57d98a; --blue:#6aa8ff; --amber:#f5b942; --red:#ff5a5a;
  --serif:Georgia,"Iowan Old Style","Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--serif);font-size:17px;line-height:1.7;
  -webkit-font-smoothing:antialiased;padding:0 20px 48px}
a,q,.small{overflow-wrap:break-word}
code,a.cite{overflow-wrap:anywhere}
a{color:var(--accent)}
code{font-family:var(--mono);font-size:.85em;background:var(--bg-3);padding:.1em .35em;border-radius:4px}
.wrap{max-width:1080px;margin:0 auto;--shell-pad:0px}
header h1{font-size:34px;margin:14px 0 6px;letter-spacing:.01em;line-height:1.2}
header .sub{color:var(--ink-dim);font-size:17px;max-width:940px;margin:0 0 6px}
header .meta{font-family:var(--sans);font-size:14px;color:var(--ink-dim);margin:10px 0 0;
  display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
header .meta b{color:var(--ink);font-weight:600}
.back{font-family:var(--sans);font-size:13.5px;margin:0 0 4px}
.back a{color:var(--gold);text-decoration:none}
.vocab{background:#1a2030;border:1px solid #33415c;border-radius:8px;padding:10px 14px;
  font-size:14px;color:#cdd7ea;margin:14px 0;line-height:1.6}
.vocab b{color:var(--ink)}
.vocab a{color:var(--gold)}
.chip{display:inline-block;font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:3px 9px;border-radius:999px;border:1px solid currentColor;white-space:nowrap}
.v-adopt{color:var(--green)} .v-wrap{color:var(--blue)} .v-build{color:var(--accent)} .v-watch{color:var(--amber)}
.legend{list-style:none;margin:10px 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.legend li{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14.5px;line-height:1.55}
.legend li .chip{margin-bottom:6px}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:18px 0 6px;font-family:var(--sans);font-size:13px}
.filters[hidden]{display:none}
.filters button{font:inherit;font-weight:600;color:var(--ink-dim);background:var(--bg-2);border:1px solid var(--line);
  border-radius:999px;padding:6px 12px;cursor:pointer;min-height:36px}
.filters button[aria-pressed="true"]{color:var(--bg);background:var(--ink);border-color:var(--ink)}
.filters button:focus-visible,.filters select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.filters label{color:var(--muted);display:flex;gap:6px;align-items:center;max-width:100%;min-width:0;white-space:nowrap}
.filters select{font:inherit;color:var(--ink);background:var(--bg-2);border:1px solid var(--line);border-radius:6px;padding:5px 8px;min-height:36px;max-width:22em;min-width:0;flex:1 1 auto}
.filters .count{color:var(--muted);margin-left:auto}
.tally{font-family:var(--sans);font-size:14px;color:var(--ink-dim);margin:6px 0 4px}
.tally b{font-size:16px}
.tally span{white-space:nowrap}
.headline{font-size:17px;line-height:1.6;color:var(--ink);max-width:940px;margin:6px 0 10px}
p#vempty{font-family:var(--sans);font-style:normal;font-size:15px;color:var(--ink);background:var(--bg-2);
  border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:14px 0}
p#vempty[hidden]{display:none}
button.linkish{font:inherit;color:var(--accent);background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
button.linkish:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
h2.group{font-family:var(--sans);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
  margin:28px 0 8px;font-weight:700}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.vcard{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.vcard h3{font-size:19px;margin:0;line-height:1.3}
.vcard h3 a{color:var(--ink);text-decoration:none}
.vcard h3 a:hover,.vcard h3 a:focus-visible{color:var(--accent);text-decoration:underline}
.vcard p{font-size:15px;line-height:1.6;margin:0;color:#d8d2c2}
.vcard .foot{font-family:var(--sans);font-size:12.5px;color:var(--muted);margin-top:auto}
.vcard[hidden],.groupwrap[hidden],tr[hidden]{display:none}
.card{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:16px 0}
.card h2{font-size:21px;margin:0 0 6px;color:var(--ink);line-height:1.35}
.card p,.card li{font-size:15.5px;line-height:1.65}
.card ul,.card ol{padding-left:22px;margin:8px 0}
.card li{margin:8px 0}
.card h3{font-size:17px;margin:14px 0 4px}
.card.bottom{border-left:3px solid var(--accent)}
.card.bottom p{font-size:17px}
a.cite{font-family:var(--mono);font-size:.78em;color:var(--gold);text-decoration:none;border-bottom:1px dotted var(--gold)}
q.cq{font-size:.86em;color:var(--ink-dim);font-style:italic}
q.cq::before{content:"\\201C"}
q.cq::after{content:"\\201D"}
a.kit{color:var(--ink);text-decoration-color:var(--gold)}
a.cite:hover,a.cite:focus-visible{border-bottom-style:solid}
.tier{font-family:var(--sans);font-size:12px;color:var(--gold);white-space:nowrap}
.lic{display:inline-block;font-family:var(--sans);font-size:11.5px;font-weight:600;line-height:1.4;padding:0 7px;margin:0 2px;
  border-radius:4px;border:1px solid #3a5a44;color:#9fd8b1;overflow-wrap:anywhere;vertical-align:1px}
.lic.np{border-color:var(--amber);background:rgba(245,185,66,.14);color:var(--amber)}
.licnote{font-family:var(--sans);font-size:13px;color:var(--muted);margin:0 0 6px}
.sources ul{padding-left:22px}
.start{border-left:3px solid var(--green)}
table.rp{width:100%;border-collapse:collapse;font-size:14.5px;line-height:1.55;margin:8px 0;table-layout:fixed}
table.rp th:nth-child(1){width:15%} table.rp th:nth-child(2){width:26%} table.rp th:nth-child(3){width:23%}
table.rp th:nth-child(4){width:12%} table.rp th:nth-child(5){width:12%} table.rp th:nth-child(6){width:12%}
table.rp th{font-family:var(--sans);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
  text-align:left;font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line)}
table.rp td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}
table.rp td.prac b{color:var(--ink)}
table.rp .rid{display:block;font-family:var(--mono);font-size:11.5px;color:var(--muted)}
table.rp .small{display:block;font-size:13px;color:var(--ink-dim);margin-top:4px}
.st{font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.st-adopted{color:var(--green)} .st-partial{color:var(--blue)} .st-candidate{color:var(--amber)} .st-not-applicable{color:var(--muted)}
.empty{color:var(--muted);font-style:italic}
footer{max-width:1080px;margin:26px auto 0;color:var(--muted);font-size:13px;font-family:var(--sans)}
footer p{margin:0 0 8px;max-width:1000px}
footer a{color:var(--accent)}
@media (max-width:760px){
  table.rp thead{display:none}
  table.rp,table.rp tbody,table.rp tr,table.rp td{display:block;width:auto}
  table.rp tr{border-bottom:1px solid var(--line);padding:10px 0}
  table.rp tr[hidden]{display:none}
  table.rp td{border:0;padding:3px 0}
  table.rp td[data-label]::before{content:attr(data-label);display:block;font-family:var(--sans);
    font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .filters .count{margin-left:0;width:100%}
  .filters label{width:100%}
  .filters select{max-width:none;width:100%}
}
@media (max-width:560px){body{font-size:16px;padding:0 12px 36px}header h1{font-size:27px}.cards{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:#f2a93b;color:#06130a;font-weight:700;font-size:13px;
  padding:9px 16px;border-radius:0 0 10px 0;text-decoration:none}
.skip:focus{left:0}`;

function page({ title, desc, canonical, current, header, main, script }) {
  const body = header + '\n' + main;
  const lead = current === 'verdict'
    ? 'Bracketed tags are evidence tiers from <a href="../RULEBOOK.md">RULEBOOK.md</a> \u00a71: [Verified] means checked directly, [CI-observed] read from a project\u2019s CI pages, [Maintainer claim] asserted by the project, [External] a dated third-party source, [Inference] our judgment. A gold <code>path:line</code> link opens the cited line.'
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} \u00b7 Franken Research</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${canonical}">
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} \u00b7 Franken Research">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${BASE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} \u00b7 Franken Research">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${BASE}/og-image.png">
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
${vocab(body, lead)}
<main id="main">
${main}
</main>
<footer>
  <p>Generated from <a href="${GH}stack/METHOD.md">stack/</a> by <a href="${GH}site/scripts/make-stack.mjs">site/scripts/make-stack.mjs</a>; the build gates check every citation and fail if this page drifts from its sources.</p>
</footer>
</div>
<!-- shell:footer -->
<!-- /shell:footer -->
${script ? '<script>\n' + script + '\n</script>\n' : ''}</body>
</html>
`;
}

// ---------- inputs ----------
const areas = fs.readdirSync(path.join(ROOT, 'ecosystem/pickup'))
  .filter((f) => /^pickup-.+\.md$/.test(f)).map((f) => f.slice(7, -3)).sort();
const verdictFiles = fs.readdirSync(path.join(ROOT, 'stack'))
  .filter((f) => f.endsWith('.md') && f !== 'METHOD.md').map((f) => f.slice(0, -3)).sort();
const verdicts = verdictFiles.map(parseVerdict);
const bySlug = Object.fromEntries(verdicts.map((v) => [v.slug, v]));
const method = read('stack/METHOD.md');
const legend = {};
for (const m of method.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \|$/gm)) legend[m[1]] = m[2];
const asOf = verdicts.map((v) => v.fm.evidence_date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort().pop()
  || (/evidence_date:\s*(\d{4}-\d{2}-\d{2})/.exec(method) || [])[1];
const vinfo = (name) => VERDICTS.find((v) => v.name === name) || { name: name || 'Unknown', cls: '' };
const chip = (name) => '<span class="chip ' + vinfo(name).cls + '">' + esc(name || 'No verdict') + '</span>';
// Authors and reviewers are AI agent session ids; a tmux-pane id reads "control-plane pane 2".
const who = (id) => String(id || '').replace(/^(.*?)-pane-(\d+)$/, '$1 pane $2');
// Each verdict group was reviewed as one batch; the batch's record lives in stack/reviews/.
const REVIEW_FILE = {
  'Orchestration': 'orchestration-eval-safety.md', 'Eval and safety': 'orchestration-eval-safety.md',
  'Tools and environment': 'tools-training-voice.md', 'Training and voice': 'tools-training-voice.md',
  'Model serving': 'serving-memory-retrieval.md', 'Memory and retrieval': 'serving-memory-retrieval.md',
};
const reviewRecord = (fm) => {
  const f = 'stack/reviews/' + (REVIEW_FILE[fm.group] || '');
  return REVIEW_FILE[fm.group] && exists(f) ? f : null;
};
const reviewText = (fm) => fm.reviewed_by
  ? 'Reviewed by ' + esc(who(fm.reviewed_by)) + (fm.review_date ? ' on ' + esc(fm.review_date) : '')
  : 'Awaiting independent review';
const areaTitle = (slug) => (bySlug[slug] && bySlug[slug].fm.title) || slug;
const firstSentences = (md) => md.split('\n').filter((l) => l.trim()).join(' ');

// Licenses of adopted incumbents (METHOD rule 9): stack/licenses.tsv, keyed by lowercase owner/repo.
const LIC = {};
if (exists('stack/licenses.tsv')) {
  const [head, ...rows] = read('stack/licenses.tsv').split('\n').filter((l) => l.trim());
  const cols = head.split('\t');
  for (const l of rows) {
    const r = Object.fromEntries(cols.map((k, i) => [k, (l.split('\t')[i] || '').trim()]));
    if (r.repo) LIC[r.repo.toLowerCase()] = r;
  }
}
// Same owner/repo token shape Gate K5 checks inside **bold** in "Adopt, do not rebuild".
const REPO = /(?<![\w.\/-])([A-Za-z0-9][\w.-]*\/[A-Za-z0-9](?:[\w.-]*[A-Za-z0-9_])?)/g;
const NO_SPDX = new Set(['', '-', 'NOASSERTION', 'NONE', 'OTHER', 'UNKNOWN']);
const CLASS_LABEL = { none: 'no license', unknown: 'license unknown', 'source-available': 'source-available',
  'permissive-with-conditions': 'conditions apply' };
function licChips(bold, dates) {
  const out = [];
  for (const m of bold.matchAll(REPO)) {
    const r = LIC[m[1].toLowerCase()];
    if (!r) continue;
    if (r.checked) dates.add(r.checked);
    const np = r.license_class !== 'permissive';
    const label = NO_SPDX.has((r.spdx || '').toUpperCase()) ? (CLASS_LABEL[r.license_class] || r.license_class) : r.spdx;
    out.push(`<span class="lic${np ? ' np' : ''}" title="${esc(m[1] + ': ' + r.license_class + ' license, checked ' + r.checked)}">${esc(label)}</span>`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

// ---------- /stack/<slug> ----------
const written = [];
function write(rel, html) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, applyShell(rel, html));
  written.push(rel);
}

for (const v of verdicts) {
  const { fm, slug } = v;
  const ctx = { dir: 'stack' };
  const title = fm.title || slug;
  const header = `<header>
  <p class="back"><a href="index.html">&larr; All agent-stack verdicts</a></p>
  <h1>${esc(title)}</h1>
  <p class="meta">${chip(fm.verdict)} <span>Confidence <b>${esc(fm.confidence || 'not stated')}</b></span> <span>Group <b>${esc(fm.group || 'not stated')}</b></span> <span>Evidence as of <b>${esc(fm.evidence_date || 'not stated')}</b></span></p>
  <p class="meta"><span>Written by <b>${esc(who(fm.author) || 'not stated')}</b> \u00b7 ${fm.reviewed_by ? 'Reviewed by <b>' + esc(who(fm.reviewed_by)) + '</b>' + (fm.review_date ? ' on ' + esc(fm.review_date) : '') + ' (separate AI agent sessions' + (reviewRecord(fm) ? '; <a href="' + esc(GH + reviewRecord(fm)) + '">review record</a>' : '') + ')' : 'Awaiting independent review'}</span></p>
</header>`;
  const secs = [];
  for (const name of SECTIONS) {
    if (!(name in v.sections)) continue;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const adopt = name === 'Adopt, do not rebuild';
    const dates = new Set();
    const sctx = adopt ? { ...ctx, lic: (b) => licChips(b, dates) } : ctx;
    const html = blocks(v.sections[name], sctx);
    const d = [...dates].sort();
    const note = adopt && d.length
      ? `<p class="licnote">License checked on ${esc(d.length === 1 ? d[0] : d[0] + ' to ' + d[d.length - 1])}; non-permissive licenses are named in the text.</p>\n`
      : '';
    secs.push(`<section class="card${name === 'Bottom line' ? ' bottom' : ''}" id="${id}" aria-labelledby="h-${id}">
  <h2 id="h-${id}">${esc(name)}</h2>
${note}${html || '<p class="empty">Nothing recorded.</p>'}
</section>`);
  }
  if (fm.rejected_alternative) {
    secs.splice(1, 0, `<section class="card" id="rejected-alternative" aria-labelledby="h-rejected-alternative">
  <h2 id="h-rejected-alternative">Less-building alternative we rejected</h2>
<p>${inline(fm.rejected_alternative, ctx)}</p>
</section>`);
  }
  for (const name of v.order) {
    if (SECTIONS.includes(name)) continue;
    const id = 'extra-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    secs.push(`<section class="card" id="${id}" aria-labelledby="h-${id}">
  <h2 id="h-${id}">${esc(name)}</h2>
${blocks(v.sections[name], ctx)}
</section>`);
  }
  const companion = 'ecosystem/pickup/pickup-' + slug + '.md';
  const pack = 'ecosystem/pickup/_evidence/' + slug + '.md';
  const src = [
    exists(companion) ? `<li>Pickup companion: <a href="${esc(fileHref(companion))}">${companion}</a>, the charter seed, oracle candidates, and first claim registry for this area.</li>` : '',
    exists(pack) ? `<li>Evidence pack: <a href="${esc(fileHref(pack))}">${pack}</a>, the repositories checked against the GitHub API, with dates.</li>` : '',
    `<li>Verdict source: <a href="${esc(fileHref('stack/' + slug + '.md'))}">stack/${slug}.md</a>, written under <a href="${esc(fileHref('stack/METHOD.md'))}">stack/METHOD.md</a>.</li>`,
  ].filter(Boolean).join('\n    ');
  const main = secs.join('\n') + `
<section class="card sources" id="sources" aria-labelledby="h-sources">
  <h2 id="h-sources">Sources</h2>
  <ul>
    ${src}
  </ul>
</section>
${exists(companion) ? `<section class="card start" id="start" aria-labelledby="h-start">
  <h2 id="h-start">Starting a build here?</h2>
  <p>Begin from the <a href="${esc(fileHref(companion))}">pickup companion for ${esc(title)}</a>: it carries the charter seed, the oracle candidates and how to verify them, and the first claims to register, so a new project starts from evidence instead of from scratch.</p>
</section>` : ''}
<p class="back"><a href="index.html">&larr; Back to all agent-stack verdicts</a></p>`;
  const bottom = firstSentences(v.sections['Bottom line'] || '').replace(CITE, '').replace(TIER, '')
    .replace(/\(\s*[;,\s]*\)/g, '').replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
  const desc = bottom || ((fm.verdict ? fm.verdict + ': ' : '') + title);
  write('stack/' + slug + '.html', page({
    title: title + ': ' + (fm.verdict || 'verdict'),
    desc: desc.length > 300 ? desc.slice(0, 297).replace(/\s+\S*$/, '') + '\u2026' : desc,
    canonical: BASE + '/stack/' + slug, current: 'verdict', header, main,
  }));
}

// ---------- /stack/ ----------
{
  const n = verdicts.length;
  // The split and the headline are computed from the verdict files, never typed.
  const tallyOf = Object.fromEntries(VERDICTS.map((v) => [v.name, verdicts.filter((x) => x.fm.verdict === v.name).length]));
  const ranked = VERDICTS.slice().sort((a, b) => tallyOf[b.name] - tallyOf[a.name] || VERDICTS.indexOf(a) - VERDICTS.indexOf(b));
  const top = ranked[0];
  const nAdopt = tallyOf['Adopt'], nWrap = tallyOf['Adopt and wrap'], nBuild = tallyOf['Build clean-room'];
  const watched = verdicts.filter((x) => x.fm.verdict === 'Watch').map((x) => x.fm.title || x.slug).sort();
  const headline = n ? [
    (nAdopt + nWrap ? 'In every area with an established project, adopt it; ' : '')
      + (nBuild ? `in ${nBuild} of the ${n} the evidence justified building from scratch` : `in none of the ${n} did the evidence justify building from scratch`)
      + (nWrap ? `, and in ${nWrap} the evidence shows a verification gap you must close yourself.` : '.'),
    watched.length === 1 ? `One area, ${watched[0]}, is on Watch: the evidence is too thin to commit to a project yet.`
      : watched.length ? `${watched.length} areas are on Watch: the evidence is too thin to commit to a project yet.` : '',
  ].filter(Boolean).join(' ') : '';
  const tally = ranked.map((v) => `<span class="${v.cls}"><b>${tallyOf[v.name]}</b> ${esc(v.name)}</span>`).join(' \u00b7 ');
  const header = `<header>
  <h1>The agent stack: adopt, copy, or build</h1>
  <p class="sub">The FrankenSuite assessment covered one developer\u2019s repositories. This layer looks outward, at ${areas.length} parts of the stack an agent product is assembled from, from inference engines to voice agents. For each area it answers one question: adopt an existing project, copy its practices, or build your own. Every verdict is a judgment backed by cited evidence, checked by someone other than its author, and reflects the evidence as of ${esc(asOf)}. Verdicts were written and reviewed by separate AI agent sessions; a human maintainer coordinated the work and ruled on disputes. No human outside the project has reviewed them yet.${n === areas.length ? '' : ' ' + n + ' of the ' + areas.length + ' areas have a published verdict so far.'}</p>
</header>`;
  const legendHtml = VERDICTS.map((v) => `<li>${chip(v.name)}<br>${inline(legend[v.name] || '', { dir: 'stack' })}</li>`).join('\n  ');
  const groups = [];
  const grouped = new Map(GROUPS.map((g) => [g, []]));
  for (const v of verdicts) {
    if (!grouped.has(v.fm.group)) grouped.set(v.fm.group, []);
    grouped.get(v.fm.group).push(v);
  }
  for (const [g, list] of grouped) {
    if (!list.length) continue;
    list.sort((a, b) => (a.fm.title || a.slug).localeCompare(b.fm.title || b.slug));
    const gid = 'g-' + String(g || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cards = list.map((v) => {
      const bl = v.sections['Bottom line'] || '';
      return `<article class="vcard" data-verdict="${esc(vinfo(v.fm.verdict).cls)}">
      <h3><a href="${v.slug}.html">${esc(v.fm.title || v.slug)}</a></h3>
      <div>${chip(v.fm.verdict)}</div>
      <p>${inline(firstSentences(bl), { dir: 'stack' })}</p>
      <div class="foot">Confidence ${esc(v.fm.confidence || 'not stated')} \u00b7 ${reviewText(v.fm)}</div>
    </article>`;
    }).join('\n    ');
    groups.push(`<section class="groupwrap" aria-labelledby="${gid}">
  <h2 class="group" id="${gid}">${esc(g || 'Other')}</h2>
  <div class="cards">
    ${cards}
  </div>
</section>`);
  }
  const filterBtns = ['<button type="button" data-f="all" aria-pressed="true">All</button>']
    .concat(VERDICTS.map((v) => `<button type="button" data-f="${v.cls}" data-name="${esc(v.name)}" aria-pressed="false">${esc(v.name)}</button>`)).join('\n  ');
  const main = `<section aria-labelledby="h-legend">
<h2 class="group" id="h-legend">The four verdicts</h2>
<ul class="legend">
  ${legendHtml}
</ul>
<p class="back">The full rules, including the evidence bar for each verdict, are in <a href="${esc(fileHref('stack/METHOD.md'))}">stack/METHOD.md</a>. Verdicts are decided in a fixed order: Watch first, then Adopt and wrap, then Adopt, and Build clean-room only when a cited line shows that no incumbent meets a hard constraint. Practices worth copying across all areas are collected in <a href="../rigor/index.html">Rigor practices</a>.</p>
</section>
<div class="filters" id="vfilter" role="group" aria-label="Filter by verdict" hidden>
  ${filterBtns}
  <span class="count" id="vcount" aria-live="polite"></span>
</div>
<!-- STAT: the split and the headline are computed by site/scripts/make-stack.mjs from the verdict: field of stack/*.md -->
<p class="tally" id="vtally">${tally}</p>
${headline ? `<p class="headline">${esc(headline)}</p>` : ''}
<p class="empty" id="vempty" data-total="${n}" data-top-f="${top ? top.cls : ''}" data-top-name="${top ? esc(top.name) : ''}" aria-live="polite" hidden></p>
${groups.join('\n') || '<p class="empty">No verdicts have been published yet.</p>'}`;
  const script = `(function () {
  var bar = document.getElementById('vfilter');
  if (!bar) return;
  bar.hidden = false;
  var btns = bar.querySelectorAll('button');
  var cards = document.querySelectorAll('.vcard');
  var count = document.getElementById('vcount');
  function apply(f) {
    var shown = 0;
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-f') === f));
    for (var j = 0; j < cards.length; j++) {
      var on = f === 'all' || cards[j].getAttribute('data-verdict') === f;
      cards[j].hidden = !on; if (on) shown++;
    }
    var groups = document.querySelectorAll('.groupwrap');
    for (var k = 0; k < groups.length; k++) groups[k].hidden = !groups[k].querySelector('.vcard:not([hidden])');
    count.textContent = shown + ' of ' + cards.length + ' verdicts shown';
    var empty = document.getElementById('vempty');
    empty.textContent = '';
    empty.hidden = shown > 0;
    if (!shown) {
      var cur = bar.querySelector('button[data-f="' + f + '"]');
      empty.appendChild(document.createTextNode('None of the ' + empty.getAttribute('data-total') + ' verdicts is ' +
        (cur ? cur.getAttribute('data-name') : f) + '. See '));
      var see = document.createElement('button');
      see.type = 'button';
      see.className = 'linkish';
      see.textContent = empty.getAttribute('data-top-name');
      see.addEventListener('click', function () { apply(empty.getAttribute('data-top-f')); });
      empty.appendChild(see);
      empty.appendChild(document.createTextNode('.'));
    }
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) apply(b.getAttribute('data-f'));
  });
  apply('all');
})();`;
  write('stack/index.html', page({
    title: 'The agent stack: adopt, copy, or build',
    desc: 'Adopt, adopt and wrap, build clean-room, or watch: evidence-cited verdicts for ' + areas.length + ' parts of the agent stack, each reviewed by someone other than its author.',
    canonical: BASE + '/stack/', current: 'stack', header, main, script,
  }));
}

// ---------- /rigor/ ----------
const TSV = 'stack/rigor-practices.tsv';
if (exists(TSV)) {
  const lines = read(TSV).split('\n').filter((l) => l.trim());
  const cols = lines[0].split('\t');
  const rows = lines.slice(1).map((l) => {
    const c = l.split('\t');
    return Object.fromEntries(cols.map((k, i) => [k, (c[i] || '').trim()]));
  });
  const list = (s) => (s || '').split(';').map((x) => x.trim()).filter(Boolean);
  // Same reference shapes Gate K3 resolves: "commit <sha>" (or a token that is only a sha) and repo
  // paths (a "/" or a known extension, optional :line). "done:" / "missing:" labels are kept as text.
  const PROOF_REF = /(commit\s+)?\b([0-9a-f]{7,40})\b|(?<![\w/:.-])((?:\.?[\w-][\w.-]*\/)+[\w.-]*[\w-]|[\w-][\w.-]*\.(?:md|sh|yml|yaml|tsv|json|mjs|js|py|html|toml|txt))(?::(\d+))?/g;
  const proofHtml = (s) => list(s).map((tok) => {
    let label = '';
    const lm = /^([A-Za-z][A-Za-z ]*):\s+([\s\S]*)$/.exec(tok);
    if (lm) { label = lm[1]; tok = lm[2]; }
    let out = ''; let last = 0;
    for (const m of tok.matchAll(PROOF_REF)) {
      let html = null;
      if (m[2]) {
        if (m[1] || tok.trim() === m[2]) html = `<a href="https://github.com/JYeswak/franken-research/commit/${m[2]}">${esc(m[0])}</a>`;
      } else if (exists(m[3])) {
        const dir = fs.statSync(path.join(ROOT, m[3])).isDirectory();
        html = `<a href="${esc(dir ? GH_TREE + m[3] : fileHref(m[3], m[4]))}">${esc(m[0])}</a>`;
      }
      if (html) { out += esc(tok.slice(last, m.index)) + html; last = m.index + m[0].length; }
    }
    return (label ? '<i>' + esc(label) + ':</i> ' : '') + out + esc(tok.slice(last));
  }).join('; ');
  const areaSet = new Set(); const checkSet = new Set();
  const trs = rows.map((r) => {
    const as = list(r.areas); const ck = list(r.checklist).filter((x) => x !== 'none');
    as.forEach((a) => areaSet.add(a)); ck.forEach((c) => checkSet.add(c));
    const src = /^(.+):(\d+)$/.exec(r.source || '');
    const areaHtml = as.map((a) => bySlug[a] ? `<a href="../stack/${a}.html">${esc(areaTitle(a))}</a>`
      : a === 'frankensuite' ? '<a href="../index.html">FrankenSuite</a>' : esc(a)).join(', ');
    const st = r.our_status || '';
    return `<tr id="${esc(r.id.toLowerCase())}" data-areas=" ${esc(as.join(' '))} " data-check=" ${esc(ck.join(' '))} " data-status="${esc(st)}">
      <td class="prac" data-label="Practice"><span class="rid">${esc(r.id)}</span><b>${inline(r.practice, { dir: 'stack' })}</b></td>
      <td data-label="What to copy">${inline(r.what_to_copy, { dir: 'stack' })}</td>
      <td data-label="Evidenced in">${list(r.evidenced_in).map((x) => esc(x)).join(', ')}${src ? `<span class="small">Source: <a class="cite" href="${esc(fileHref(src[1], src[2]))}">${esc(r.source)}</a>${r.source_quote ? ' <q class="cq">' + esc(r.source_quote.replace(/[*`]/g, '')) + '</q>' : ''}</span>` : ''}</td>
      <td data-label="Areas">${areaHtml}</td>
      <td data-label="Starter kit">${ck.length ? ck.map(kitLink).join('; ') : 'none'}</td>
      <td data-label="Our status"><span class="st st-${esc(st)}">${esc(st.replace('-', ' '))}</span><span class="small">${st === 'adopted' || st === 'partial' ? proofHtml(r.our_proof) : inline(r.our_proof || '', { dir: 'stack' })}</span></td>
    </tr>`;
  }).join('\n    ');
  const byAreaOrder = [...areaSet].sort((a, b) => areaTitle(a).localeCompare(areaTitle(b)));
  const ckOrder = [...checkSet].sort((a, b) => a[0].localeCompare(b[0]) || (+a.slice(1)) - (+b.slice(1)));
  const counts = { adopted: 0, partial: 0, candidate: 0, 'not-applicable': 0 };
  rows.forEach((r) => { if (r.our_status in counts) counts[r.our_status]++; });
  const header = `<header>
  <h1>Rigor practices worth copying</h1>
  <p class="sub">Engineering practices that make claims checkable, gathered from the ${areas.length} agent-stack evidence packs and the FrankenSuite corpus. Every practice is evidenced in a named project with a quoted source line, mapped to the items of the <a href="../starter-kit/index.html">starter kit</a> it strengthens, and marked with whether this repository adopts it. Of ${rows.length} practices, this repository has adopted ${counts.adopted}, partly adopted ${counts.partial}, lists ${counts.candidate} as candidates, and marks ${counts['not-applicable']} as not applicable; adopted and partial rows link their proof, and partial rows say what is done and what is missing. Adopted and partial claims about this repository were audited by a reviewer who did not write them; the audit record is in <a href="${GH_TREE}stack/reviews">stack/reviews/</a>.</p>
</header>`;
  const opt = (v, label) => `<option value="${esc(v)}">${esc(label)}</option>`;
  const main = `<div class="filters" id="rfilter" hidden>
  <label>Area <select id="f-area"><option value="">All areas</option>${byAreaOrder.map((a) => opt(a, a === 'frankensuite' ? 'FrankenSuite' : areaTitle(a))).join('')}</select></label>
  <label>Starter kit <select id="f-check"><option value="">All items</option>${ckOrder.map((c) => opt(c, KIT[c] ? KIT[c].title : c)).join('')}</select></label>
  <label>Our status <select id="f-status"><option value="">Any status</option>${opt('adopted', 'Adopted')}${opt('partial', 'Partial')}${opt('candidate', 'Candidate')}${opt('not-applicable', 'Not applicable')}</select></label>
  <span class="count" id="rcount" aria-live="polite"></span>
</div>
<p class="back">Source file: <a href="${esc(fileHref(TSV))}">${TSV}</a>. Starter-kit items link to their entries in <a href="${GH}starter-kit/CHECKLIST.md">starter-kit/CHECKLIST.md</a>.</p>
<table class="rp">
  <thead><tr><th scope="col">Practice</th><th scope="col">What to copy</th><th scope="col">Evidenced in</th><th scope="col">Areas</th><th scope="col">Starter kit</th><th scope="col">Our status</th></tr></thead>
  <tbody>
    ${trs}
  </tbody>
</table>`;
  const script = `(function () {
  var bar = document.getElementById('rfilter');
  if (!bar) return;
  bar.hidden = false;
  var a = document.getElementById('f-area'), c = document.getElementById('f-check'), s = document.getElementById('f-status');
  var rows = document.querySelectorAll('table.rp tbody tr');
  var count = document.getElementById('rcount');
  function apply() {
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var on = (!a.value || r.getAttribute('data-areas').indexOf(' ' + a.value + ' ') >= 0) &&
        (!c.value || r.getAttribute('data-check').indexOf(' ' + c.value + ' ') >= 0) &&
        (!s.value || r.getAttribute('data-status') === s.value);
      r.hidden = !on; if (on) shown++;
    }
    count.textContent = shown + ' of ' + rows.length + ' practices shown';
  }
  [a, c, s].forEach(function (el) { el.addEventListener('change', apply); });
  apply();
})();`;
  write('rigor/index.html', page({
    title: 'Rigor practices worth copying',
    desc: rows.length + ' engineering practices from the agent ecosystem and the FrankenSuite, each with a quoted source line, mapped to the starter kit, and marked with whether Franken Research adopts it.',
    canonical: BASE + '/rigor/', current: 'rigor', header, main, script,
  }));
}

// Remove generated pages whose source is gone, so the output tree mirrors the inputs.
for (const [dir, keep] of [['stack', (f) => f.endsWith('.html')], ['rigor', (f) => f === 'index.html']]) {
  const d = path.join(OUT, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (keep(f) && !written.includes(dir + '/' + f)) fs.rmSync(path.join(d, f));
  }
}
console.log('make-stack: wrote ' + written.length + ' pages (' + verdicts.length + ' verdicts' + (exists(TSV) ? ', rigor index' : ', no rigor TSV yet') + ') into ' + path.relative(ROOT, OUT || '.') );
