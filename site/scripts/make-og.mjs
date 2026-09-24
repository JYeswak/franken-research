// make-og.mjs — render the 1200x630 share cards.
//
//   node site/scripts/make-og.mjs                       every brief card, then the three page cards
//   node site/scripts/make-og.mjs frankenfs home self   just the named cards
//
// Brief cards go to site/og/<name>.png. Page cards: home -> site/og-image.png, starter-kit ->
// site/og/starter-kit.png, self -> site/og/self.png.
// Ring, TRL, CI state, license class, ring counts and the CI-green count come from site/assets/data.js;
// ring colours and the CI-green colour are the map's (site/assets/app.src.js, read by brief-strip.mjs),
// so a colour means the same ring on the map, on a brief and on its card. A brief card's name, subtitle
// and bottom line ("Use it? ... Learn from it? ...") come from the brief itself, the same text as its
// verdict strip. The starter-kit card lists checklist items read from site/starter-kit/CHECKLIST.md; the
// self card reads this project's own row values from site/self/index.html. Rendering uses headless
// Chromium over CDP, the same way Gate I in verify-site.sh does.
// Exits non-zero if a brief, data row or page fact is missing, a title block does not fit, or a card
// exceeds MAX_BYTES.
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadData, loadMap, bottomLine, rgba, RINGS } from './brief-strip.mjs';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(SITE, 'og');
const MAX_BYTES = 120 * 1024;
const W = 1200, H = 630;

const DATA = loadData(SITE);
const MAP = loadMap(SITE);
const LICENSE = Object.fromEntries(DATA.licenseClasses.map((c) => [c.key, c.label]));
const PAGE_CARDS = { home: path.join(SITE, 'og-image.png'), 'starter-kit': path.join(OUT, 'starter-kit.png'), self: path.join(OUT, 'self.png') };

const only = process.argv.slice(2);
const repos = DATA.repos.filter((r) => !only.length || only.includes(r.name));
const pages = Object.keys(PAGE_CARDS).filter((k) => !only.length || only.includes(k));
const unknown = only.filter((n) => !repos.some((r) => r.name === n) && !pages.includes(n));
if (unknown.length) { console.error('unknown card name(s): ' + unknown.join(', ')); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textOf = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&rsquo;/g, '\u2019').replace(/&ndash;/g, '\u2013').replace(/\s+/g, ' ').trim();

function heroOf(name) {
  const t = fs.readFileSync(path.join(SITE, 'briefs', name + '.html'), 'utf8');
  const nm = /<span class="hero__name">([\s\S]*?)<\/span>/.exec(t);
  const sub = /<span class="hero__sub">([\s\S]*?)<\/span>/.exec(t);
  if (!nm || !sub) throw new Error(name + ': hero__name/hero__sub not found');
  return { nameHtml: nm[1], subHtml: sub[1], line: bottomLine('briefs/' + name + '.html', t) };
}

const SANS = 'system-ui, -apple-system, sans-serif';
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const BASE_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0c0c0e; }
  body { color: #ece5d8; font-family: ${SERIF}; -webkit-font-smoothing: antialiased; }
  .bar { position: absolute; left: 0; top: 0; width: ${W}px; height: 8px; }
  .kicker { font: 600 17px/1 ${SANS}; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 26px; }
  .foot { position: absolute; left: 64px; right: 64px; bottom: 30px; display: flex; justify-content: space-between; font: 500 17px/1 ${SANS}; color: #8d867a; letter-spacing: 0.04em; }
  .foot b { color: #ece5d8; font-weight: 600; }
  .rule { position: absolute; left: 64px; right: 64px; bottom: 64px; height: 1px; background: #26262c; }`;
const FOOT = (right) => `<div class="rule"></div><div class="foot"><span><b>Franken Research</b> &middot; fr.zeststream.ai</span><span>${right}</span></div>`;

// The ring target: the four rings drawn inner (Invest) to outer (Monitor), `verdict` filled in its map colour.
function ringSvg(verdict) {
  const radii = [58, 104, 150, 196]; // Invest .. Monitor
  let s = `<svg width="420" height="420" viewBox="-210 -210 420 420" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const on = RINGS[i] === verdict, c = MAP.ring[RINGS[i]];
    s += `<circle r="${radii[i]}" fill="${on ? rgba(c, 0.16) : '#0c0c0e'}" stroke="${on ? c : '#34343c'}" stroke-width="${on ? 3 : 1.5}"/>`;
  }
  for (let i = 0; i < RINGS.length; i++) {
    const on = RINGS[i] === verdict;
    const y = i === 0 ? 6 : -(radii[i] + radii[i - 1]) / 2 + 6;
    s += `<text x="0" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="${on ? 19 : 15}" font-weight="${on ? 700 : 500}" letter-spacing="2" fill="${on ? MAP.ring[RINGS[i]] : '#6f695f'}">${RINGS[i].toUpperCase()}</text>`;
  }
  return s + '</svg>';
}

function briefCard(r, hero) {
  const c = MAP.ring[r.nodus];
  const trlLong = String(r.trl).length > 8;
  const lineLong = textOf(hero.line.use + hero.line.learn).length > 100;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .bar { background: ${c}; }
  .left { position: absolute; left: 64px; top: 58px; width: 690px; height: 440px; display: flex; flex-direction: column; }
  .kicker { color: ${c}; }
  .name { font-size: 76px; line-height: 1.0; letter-spacing: -0.02em; overflow-wrap: anywhere; }
  .sub { font-size: 32px; line-height: 1.22; font-style: italic; color: #b7b0a2; margin-top: 18px; }
  .facts { position: absolute; left: 64px; bottom: 90px; width: 690px; display: grid; grid-template-columns: ${trlLong ? 240 : 150}px 1fr; gap: 14px 28px; font-family: ${SANS}; }
  .fact .k { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #8d867a; margin-bottom: 5px; }
  .fact .v { font-size: 20px; line-height: 1.25; color: #ece5d8; }
  .fact .v.big { font-size: ${trlLong ? 17 : 30}px; font-weight: 700; }
  .fact.wide { grid-column: 1 / span 2; }
  .fact.ci .v { font-size: 18px; color: #d9d2c4; }
  .fact.ci .v.green { color: ${MAP.green}; font-weight: 700; }
  .line { font-family: ${SERIF}; font-size: ${lineLong ? 19 : 22}px; line-height: 1.3; color: #ece5d8; padding-bottom: 14px; border-bottom: 1px solid #26262c; }
  .line .q { font: 600 13px/1 ${SANS}; letter-spacing: 0.14em; text-transform: uppercase; color: #8d867a; margin-right: 8px; }
  .line .p { display: inline-block; max-width: 100%; margin-right: 18px; }
  .right { position: absolute; left: 760px; top: 70px; width: 420px; text-align: center; }
  .verdict { font: 600 14px/1 ${SANS}; letter-spacing: 0.18em; text-transform: uppercase; color: #8d867a; margin-top: 14px; }
  .verdict b { color: ${c}; font-size: 22px; letter-spacing: 0.08em; margin-left: 8px; }
</style></head><body>
<div class="bar"></div>
<div class="left" id="left">
  <p class="kicker">Franken Research &middot; independent brief</p>
  <h1 class="name" id="name">${hero.nameHtml}</h1>
  <p class="sub" id="sub">${hero.subHtml}</p>
</div>
<div class="facts" id="facts">
  <div class="fact wide"><p class="line"><span class="p"><span class="q">Use it?</span>${hero.line.use}</span> <span class="p"><span class="q">Learn from it?</span>${hero.line.learn}</span></p></div>
  <div class="fact"><p class="k">TRL (1&ndash;9)</p><p class="v big">${esc(r.trl)}</p></div>
  <div class="fact"><p class="k">License</p><p class="v">${esc(LICENSE[r.licenseKey])}</p></div>
  <div class="fact wide ci"><p class="k">CI at the assessed commit</p><p class="v${r.ciKey === 'C1' ? ' green' : ''}">${esc(r.ci)}</p></div>
</div>
<div class="right">${ringSvg(r.nodus)}<p class="verdict">Verdict <b>${esc(r.nodus)}</b></p></div>
${FOOT(esc(r.name))}
</body></html>`;
}

// Shrink the name, then the subtitle, until the left column clears the facts block.
const FIT = `(() => {
  const facts = document.getElementById('facts');
  const name = document.getElementById('name'), sub = document.getElementById('sub');
  const limit = facts.getBoundingClientRect().top - 22;
  let n = parseFloat(getComputedStyle(name).fontSize), s = parseFloat(getComputedStyle(sub).fontSize), guard = 0;
  const minN = n * 0.62, minS = Math.max(20, s * 0.66);
  const over = () => sub.getBoundingClientRect().bottom > limit;
  while (over() && guard++ < 200) {
    if (n > minN) name.style.fontSize = (n -= 2) + 'px';
    else if (s > minS) sub.style.fontSize = (s -= 1) + 'px';
    else break;
  }
  return { fits: !over(), n, s };
})()`;

// ---------- page cards ----------
const counts = () => {
  const rings = Object.fromEntries(RINGS.map((k) => [k, 0]));
  let green = 0;
  for (const r of DATA.repos) { rings[r.nodus]++; if (r.ciKey === 'C1') green++; }
  return { rings, green, total: DATA.repos.length };
};

// The map from above at a tilt: one ellipse per ring (radii in the map's proportions), one dot per repo,
// CI-green repos in the map's green.
function orbitSvg() {
  const R = { Invest: 4.5, Pilot: 8, Explore: 17, Monitor: 27 }; // app.src.js RING radii
  const k = 236 / R.Monitor, tilt = 0.42;
  let s = `<svg width="540" height="300" viewBox="-270 -150 540 300" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
  for (const ring of [...RINGS].reverse()) {
    const rx = R[ring] * k;
    s += `<ellipse rx="${rx}" ry="${rx * tilt}" fill="none" stroke="${MAP.ring[ring]}" stroke-opacity="0.35" stroke-width="1.5"${ring === 'Invest' ? ' stroke-dasharray="4 5"' : ''}/>`;
  }
  const dots = [];
  RINGS.forEach((ring, ri) => {
    const members = DATA.repos.filter((r) => r.nodus === ring).sort((a, b) => a.name.localeCompare(b.name));
    members.forEach((r, i) => {
      const a = (i / members.length) * Math.PI * 2 + ri * 0.7;
      const rx = R[ring] * k;
      dots.push({ x: Math.cos(a) * rx, y: Math.sin(a) * rx * tilt, r, ring });
    });
  });
  dots.sort((p, q) => p.y - q.y); // back to front
  for (const d of dots) {
    const size = 5 + (d.r.trlHigh || 5) * 0.55;
    const green = d.r.ciKey === 'C1';
    if (green) s += `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${size + 6}" fill="${MAP.green}" opacity="0.55" filter="url(#g)"/>`;
    s += `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${size.toFixed(1)}" fill="${green ? MAP.green : MAP.ring[d.ring]}"/>`;
  }
  return s + '</svg>';
}

function legend(rings) {
  return RINGS.map((k) => `<span class="lg"><i style="background:${MAP.ring[k]}"></i>${k} <b>${rings[k]}</b></span>`).join('');
}

function homeCard() {
  const { rings, green, total } = counts();
  const lede = /^[^.]*\./.exec(DATA.framing);
  if (!lede) throw new Error('data.js framing has no first sentence');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .bar { background: linear-gradient(90deg, ${MAP.ring.Pilot}, ${MAP.ring.Explore} 45%, ${MAP.ring.Monitor}); }
  .left { position: absolute; left: 64px; top: 58px; width: 600px; }
  .kicker { color: #b7b0a2; }
  h1 { font-size: 78px; line-height: 1.02; letter-spacing: -0.02em; font-weight: 700; }
  h1 .n { color: ${MAP.green}; }
  .sub { font-size: 27px; line-height: 1.3; font-style: italic; color: #b7b0a2; margin-top: 22px; }
  .legend { position: absolute; left: 64px; bottom: 96px; display: flex; gap: 26px; font: 500 20px/1 ${SANS}; color: #d9d2c4; }
  .lg { display: inline-flex; align-items: center; gap: 9px; }
  .lg i { width: 13px; height: 13px; border-radius: 50%; display: inline-block; }
  .lg b { color: #ece5d8; font-weight: 700; }
  .orbit { position: absolute; left: 650px; top: 150px; }
  .gl { position: absolute; left: 700px; top: 470px; font: 500 17px/1.3 ${SANS}; color: #8d867a; letter-spacing: 0.02em; }
  .gl i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: ${MAP.green}; box-shadow: 0 0 10px ${MAP.green}; margin-right: 8px; }
</style></head><body>
<div class="bar"></div>
<div class="left">
  <p class="kicker">Franken Research &middot; independent assessment</p>
  <h1><span class="n">${green} of ${total}</span> pass CI at the pin.</h1>
  <p class="sub">${esc(lede[0])} We froze each one at a single commit (the pin) and graded every claim.</p>
</div>
<div class="orbit">${orbitSvg()}</div>
<p class="gl"><i></i>CI green at the pin &middot; each dot is one repo, placed in its verdict ring</p>
<div class="legend">${legend(rings)}</div>
${FOOT('the map, the briefs, the method')}
</body></html>`;
}

function checklistItems(ids) {
  const src = fs.readFileSync(path.join(SITE, 'starter-kit/CHECKLIST.md'), 'utf8');
  return ids.map((id) => {
    const m = new RegExp(`^### ${id} \\u2014 (.+)$`, 'm').exec(src);
    if (!m) throw new Error(`starter-kit/CHECKLIST.md: no "### ${id} — ..." heading`);
    return { id, title: m[1].replace(/\s*\[[A-Z]+\]\s*$/, '') };
  });
}

function starterCard() {
  const items = checklistItems(['A1', 'A2', 'B5', 'B7']);
  const c = MAP.ring.Explore;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .bar { background: ${c}; }
  .left { position: absolute; left: 64px; top: 58px; width: 520px; }
  .kicker { color: ${c}; }
  h1 { font-size: 62px; line-height: 1.04; letter-spacing: -0.02em; font-weight: 700; }
  .sub { font-size: 23px; line-height: 1.34; font-style: italic; color: #b7b0a2; margin-top: 22px; }
  .card { position: absolute; left: 630px; top: 64px; width: 506px; background: #121215; border: 1px solid #26262c; border-radius: 16px; padding: 24px 26px; font-family: ${SANS}; }
  .card .h { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #8d867a; margin-bottom: 14px; }
  .it { display: flex; gap: 14px; align-items: baseline; padding: 11px 0; border-top: 1px solid #1f1f25; font-size: 19px; line-height: 1.3; color: #ece5d8; }
  .it:first-of-type { border-top: 0; }
  .it b { flex: none; width: 34px; font: 700 14px/1 ui-monospace, Menlo, monospace; color: ${c}; }
  .more { margin-top: 12px; font-size: 16px; color: #8d867a; }
</style></head><body>
<div class="bar"></div>
<div class="left">
  <p class="kicker">Franken Research &middot; starter kit</p>
  <h1>Check your own repo with the same method.</h1>
  <p class="sub">The claim-governance kit distilled from grading ${DATA.repos.length} FrankenSuite repos: a two-phase checklist, machine checkers and a pre-commit honesty gate, in plain Markdown and POSIX shell.</p>
</div>
<div class="card"><p class="h">From the checklist</p>${items.map((x) => `<p class="it"><b>${x.id}</b><span>${esc(x.title)}</span></p>`).join('')}<p class="more">&hellip; and the rest, with the scripts that check them.</p></div>
${FOOT('/starter-kit/')}
</body></html>`;
}

// This project's own values from the self page's table (column, suite result, Franken Research).
function selfFacts() {
  const t = fs.readFileSync(path.join(SITE, 'self/index.html'), 'utf8');
  const rows = {};
  for (const tr of t.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => textOf(m[1]));
    if (cells.length === 3) rows[cells[0]] = cells[2];
  }
  const first = (k) => {
    if (!rows[k]) throw new Error(`self/index.html: no "${k}" row in the column table`);
    return rows[k].split(/\.\s/)[0].replace(/\.$/, '');
  };
  const ring = first('NODUS ring');
  if (!RINGS.includes(ring)) throw new Error(`self/index.html: NODUS ring cell starts "${ring}", not a ring`);
  const trl = /^\d+/.exec(first('TRL'));
  if (!trl) throw new Error('self/index.html: TRL cell does not start with a number');
  return { ring, trl: trl[0], license: first('License'), bus: first('Bus factor'), validation: first('Independent validation') };
}

function selfCard() {
  const f = selfFacts();
  const c = MAP.ring[f.ring];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .bar { background: ${c}; }
  .left { position: absolute; left: 64px; top: 58px; width: 660px; }
  .kicker { color: ${c}; }
  h1 { font-size: 76px; line-height: 1.02; letter-spacing: -0.02em; font-weight: 700; }
  .sub { font-size: 26px; line-height: 1.32; font-style: italic; color: #b7b0a2; margin-top: 20px; }
  .facts { position: absolute; left: 64px; bottom: 96px; width: 660px; display: grid; grid-template-columns: repeat(4, auto); gap: 6px 34px; justify-content: start; font-family: ${SANS}; }
  .k { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #8d867a; }
  .v { font-size: 24px; font-weight: 700; color: #ece5d8; }
  .right { position: absolute; left: 760px; top: 70px; width: 420px; text-align: center; }
  .verdict { font: 600 14px/1 ${SANS}; letter-spacing: 0.18em; text-transform: uppercase; color: #8d867a; margin-top: 14px; }
  .verdict b { color: ${c}; font-size: 22px; letter-spacing: 0.08em; margin-left: 8px; }
</style></head><body>
<div class="bar"></div>
<div class="left">
  <p class="kicker">Franken Research &middot; self-assessment</p>
  <h1>Graded by our own method.</h1>
  <p class="sub">The columns we used on ${DATA.repos.length} FrankenSuite repos, applied to this project, including where it falls short.</p>
</div>
<div class="facts">
  <p class="k">TRL</p><p class="k">License</p><p class="k">Bus factor</p><p class="k">Independent check</p>
  <p class="v">${esc(f.trl)}</p><p class="v">${esc(f.license)}</p><p class="v">${esc(f.bus)}</p><p class="v">${esc(f.validation)}</p>
</div>
<div class="right">${ringSvg(f.ring)}<p class="verdict">Our ring <b>${esc(f.ring)}</b></p></div>
${FOOT('/self/')}
</body></html>`;
}

const PAGE_HTML = { home: homeCard, 'starter-kit': starterCard, self: selfCard };

// ---------- render ----------
const CHROME = process.env.CHROME_PATH || [
  '/opt/meta-chromium/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('no Chromium found; set CHROME_PATH'); process.exit(1); }

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'og-prof-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--hide-scrollbars', '--remote-debugging-port=0',
  `--user-data-dir=${prof}`, '--no-first-run', '--disable-extensions', 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
const port = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no devtools port')), 15000);
  chrome.stderr.on('data', (d) => {
    const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(d.toString());
    if (m) { clearTimeout(t); resolve(m[1]); }
  });
  chrome.on('exit', () => { clearTimeout(t); reject(new Error('chrome exited')); });
});
const tab = JSON.parse(execSync(`curl -s http://127.0.0.1:${port}/json/list`).toString()).find((t) => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res, rej) => {
  const my = ++id;
  pending.set(my, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
  ws.send(JSON.stringify({ id: my, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const { frameTree } = await send('Page.getFrameTree');
fs.mkdirSync(OUT, { recursive: true });

const problems = [];
async function shoot(html, file, fit) {
  await send('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  const f = fit ? (await send('Runtime.evaluate', { expression: FIT, returnByValue: true })).result.value : null;
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  const buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(file, buf);
  const rel = path.relative(SITE, file);
  if (buf.length > MAX_BYTES) problems.push(`${rel}: ${buf.length} bytes > ${MAX_BYTES}`);
  console.log(`${rel}  ${(buf.length / 1024).toFixed(1)} KB${f ? `  name ${f.n}px sub ${f.s}px` : ''}`);
  return f;
}

for (const r of repos) {
  let hero;
  try { hero = heroOf(r.name); } catch (e) { problems.push(e.message); continue; }
  if (!LICENSE[r.licenseKey]) { problems.push(r.name + ': unknown licenseKey ' + r.licenseKey); continue; }
  if (!RINGS.includes(r.nodus)) { problems.push(r.name + ': unknown ring ' + r.nodus); continue; }
  const fit = await shoot(briefCard(r, hero), path.join(OUT, r.name + '.png'), true);
  if (!fit.fits) problems.push(r.name + ': title block does not fit even at minimum sizes');
}
for (const k of pages) {
  let html;
  try { html = PAGE_HTML[k](); } catch (e) { problems.push(e.message); continue; }
  await shoot(html, PAGE_CARDS[k], false);
}

ws.close();
await new Promise((r) => { chrome.once('exit', r); chrome.kill(); setTimeout(r, 5000); });
try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
if (problems.length) { console.error('OG_BAD'); problems.forEach((p) => console.error('  ' + p)); process.exit(1); }
console.log(`OG_OK ${repos.length} brief cards, ${pages.length} page cards`);
