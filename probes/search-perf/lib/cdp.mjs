// Minimal Chrome DevTools Protocol client over Node 22's global WebSocket, the same raw-CDP
// pattern as site/scripts/make-og.mjs (the repo has no puppeteer dependency; none is added).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch(extraArgs = []) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-prof-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${prof}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    ...extraArgs, 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const port = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('no devtools port')), 20000);
    proc.stderr.on('data', (d) => {
      const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(d.toString());
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
    proc.on('exit', () => { clearTimeout(t); reject(new Error('chrome exited')); });
  });
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  async function newPage() {
    const tgt = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    return connect(tgt.webSocketDebuggerUrl, tgt.id);
  }
  async function close() {
    await new Promise((r) => { proc.once('exit', r); proc.kill(); setTimeout(r, 5000); });
    try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
  }
  async function closeTarget(id) { await fetch(`http://127.0.0.1:${port}/json/close/${id}`); }
  return { port, version, newPage, close, closeTarget };
}

export async function connect(url, targetId) {
  const ws = new WebSocket(url);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method) for (const fn of listeners.get(m.method) || []) fn(m.params, m.sessionId);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const my = ++id;
    pending.set(my, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
    ws.send(JSON.stringify(sessionId ? { id: my, method, params, sessionId } : { id: my, method, params }));
  });
  const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); };
  const off = (method, fn) => { const l = listeners.get(method) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); };
  const once = (method, pred = () => true, timeoutMs = 60000) => new Promise((res, rej) => {
    const t = setTimeout(() => { off(method, fn); rej(new Error('timeout waiting for ' + method)); }, timeoutMs);
    const fn = (p, s) => { if (pred(p, s)) { clearTimeout(t); off(method, fn); res(p); } };
    on(method, fn);
  });
  return { send, on, off, once, targetId, close: () => ws.close() };
}
