// make-og.mjs — render the 1200x630 share card for every brief into site/og/<name>.png.
//
//   node site/scripts/make-og.mjs            # all briefs
//   node site/scripts/make-og.mjs frankenfs  # just the named briefs
//
// Verdict ring, TRL, CI state and license class come from site/assets/data.js;
// the display name and subtitle come from the brief's own hero. Rendering uses
// headless Chromium over CDP, the same way Gate I in verify-site.sh does.
// Exits non-zero if a brief or data row is missing or a card exceeds MAX_BYTES.
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(SITE, 'og');
const MAX_BYTES = 120 * 1024;
const W = 1200, H = 630;

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(SITE, 'assets/data.js'), 'utf8'), sandbox);
const DATA = sandbox.window.FRANKEN_DATA;
const LICENSE = Object.fromEntries(DATA.licenseClasses.map((c) => [c.key, c.label]));
const RINGS = ['Invest', 'Pilot', 'Explore', 'Monitor']; // inner to outer

const only = process.argv.slice(2);
const repos = DATA.repos.filter((r) => !only.length || only.includes(r.name));
if (only.length && repos.length !== only.length) {
  console.error('unknown brief name(s): ' + only.filter((n) => !repos.some((r) => r.name === n)).join(', '));
  process.exit(1);
}

function heroOf(name) {
  const t = fs.readFileSync(path.join(SITE, 'briefs', name + '.html'), 'utf8');
  const nm = /<span class="hero__name">([\s\S]*?)<\/span>/.exec(t);
  const sub = /<span class="hero__sub">([\s\S]*?)<\/span>/.exec(t);
  if (!nm || !sub) throw new Error(name + ': hero__name/hero__sub not found');
  return { nameHtml: nm[1], subHtml: sub[1] };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function ringSvg(verdict) {
  const radii = [58, 104, 150, 196]; // Invest .. Monitor
  let s = `<svg width="420" height="420" viewBox="-210 -210 420 420" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const on = RINGS[i] === verdict;
    const r = radii[i];
    s += `<circle r="${r}" fill="${on ? '#3a1c0f' : '#0c0c0e'}" stroke="${on ? '#ff7a3d' : '#34343c'}" stroke-width="${on ? 3 : 1.5}"/>`;
  }
  for (let i = 0; i < RINGS.length; i++) {
    const on = RINGS[i] === verdict;
    const y = i === 0 ? 6 : -(radii[i] + radii[i - 1]) / 2 + 6;
    s += `<text x="0" y="${y}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${on ? 19 : 15}" font-weight="${on ? 700 : 500}" letter-spacing="2" fill="${on ? '#ff7a3d' : '#6f695f'}">${RINGS[i].toUpperCase()}</text>`;
  }
  return s + '</svg>';
}

function cardHtml(r, hero) {
  const trlLong = String(r.trl).length > 8;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0c0c0e; }
  body { color: #ece5d8; font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; -webkit-font-smoothing: antialiased; }
  .bar { position: absolute; left: 0; top: 0; width: ${W}px; height: 8px; background: #ff7a3d; }
  .left { position: absolute; left: 64px; top: 58px; width: 690px; height: 440px; display: flex; flex-direction: column; }
  .kicker { font: 600 17px/1 system-ui, -apple-system, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #ff7a3d; margin-bottom: 26px; }
  .name { font-size: 76px; line-height: 1.0; letter-spacing: -0.02em; overflow-wrap: anywhere; }
  .sub { font-size: 32px; line-height: 1.22; font-style: italic; color: #b7b0a2; margin-top: 18px; }
  .fact .k { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #8d867a; margin-bottom: 5px; }
  .fact .v { font-size: 21px; line-height: 1.25; color: #ece5d8; }
  .fact .v.big { font-size: ${trlLong ? 17 : 30}px; font-weight: 700; color: #ece5d8; }
  .fact.ci { grid-column: 1 / span 2; }
  .fact.ci .v { font-size: 18px; color: #d9d2c4; }
  .facts { position: absolute; left: 64px; bottom: 90px; width: 690px; display: grid; grid-template-columns: ${trlLong ? 240 : 150}px 1fr; gap: 16px 28px; font-family: system-ui, -apple-system, sans-serif; }
  .right { position: absolute; left: 760px; top: 70px; width: 420px; text-align: center; }
  .verdict { font: 600 14px/1 system-ui, -apple-system, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #8d867a; margin-top: 14px; }
  .verdict b { color: #ff7a3d; font-size: 22px; letter-spacing: 0.08em; margin-left: 8px; }
  .foot { position: absolute; left: 64px; right: 64px; bottom: 30px; display: flex; justify-content: space-between; font: 500 17px/1 system-ui, -apple-system, sans-serif; color: #8d867a; letter-spacing: 0.04em; }
  .foot b { color: #ece5d8; font-weight: 600; }
  .rule { position: absolute; left: 64px; right: 64px; bottom: 64px; height: 1px; background: #26262c; }
</style></head><body>
<div class="bar"></div>
<div class="left" id="left">
  <p class="kicker">Franken Research &middot; independent brief</p>
  <h1 class="name" id="name">${hero.nameHtml}</h1>
  <p class="sub" id="sub">${hero.subHtml}</p>
</div>
<div class="facts" id="facts">
  <div class="fact"><p class="k">TRL (1&ndash;9)</p><p class="v big">${esc(r.trl)}</p></div>
  <div class="fact"><p class="k">License</p><p class="v">${esc(LICENSE[r.licenseKey])}</p></div>
  <div class="fact ci"><p class="k">CI at the assessed commit</p><p class="v">${esc(r.ci)}</p></div>
</div>
<div class="right">${ringSvg(r.nodus)}<p class="verdict">Verdict <b>${esc(r.nodus)}</b></p></div>
<div class="rule"></div>
<div class="foot"><span><b>Franken Research</b> &middot; fr.zeststream.ai</span><span>${esc(r.name)}</span></div>
</body></html>`;
}

// Shrink the name, then the subtitle, until the left column clears the facts block.
const FIT = `(() => {
  const left = document.getElementById('left'), facts = document.getElementById('facts');
  const name = document.getElementById('name'), sub = document.getElementById('sub');
  const limit = facts.getBoundingClientRect().top - 24;
  let n = 76, s = 32, guard = 0;
  const over = () => sub.getBoundingClientRect().bottom > limit;
  while (over() && guard++ < 200) {
    if (n > 50) name.style.fontSize = (n -= 2) + 'px';
    else if (s > 22) sub.style.fontSize = (s -= 1) + 'px';
    else break;
  }
  return { fits: !over(), n, s };
})()`;

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
for (const r of repos) {
  let hero;
  try { hero = heroOf(r.name); } catch (e) { problems.push(e.message); continue; }
  if (!LICENSE[r.licenseKey]) { problems.push(r.name + ': unknown licenseKey ' + r.licenseKey); continue; }
  if (!RINGS.includes(r.nodus)) { problems.push(r.name + ': unknown ring ' + r.nodus); continue; }
  await send('Page.setDocumentContent', { frameId: frameTree.frame.id, html: cardHtml(r, hero) });
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  const fit = (await send('Runtime.evaluate', { expression: FIT, returnByValue: true })).result.value;
  if (!fit.fits) problems.push(r.name + ': title block does not fit even at minimum sizes');
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  const buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(OUT, r.name + '.png'), buf);
  if (buf.length > MAX_BYTES) problems.push(`${r.name}: ${buf.length} bytes > ${MAX_BYTES}`);
  console.log(`${r.name}.png  ${(buf.length / 1024).toFixed(1)} KB  name ${fit.n}px sub ${fit.s}px`);
}

ws.close();
await new Promise((r) => { chrome.once('exit', r); chrome.kill(); setTimeout(r, 5000); });
try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
if (problems.length) { console.error('OG_BAD'); problems.forEach((p) => console.error('  ' + p)); process.exit(1); }
console.log(`OG_OK ${repos.length} cards in ${path.relative(process.cwd(), OUT) || OUT}`);
