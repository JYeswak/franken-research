// Why the primary E2E metric stops at forced layout: measure headless Chrome's frame cadence on this
// host. Prints JSON: rAF interval distribution and DOM-change -> next-frame latency, per flag set.
import { launch } from './lib/cdp.mjs';

const VARIANTS = { headless_default: [], headless_unlocked: ['--disable-frame-rate-limit', '--disable-gpu-vsync'] };
const out = {};
for (const [name, flags] of Object.entries(VARIANTS)) {
  const b = await launch(flags);
  const p = await b.newPage();
  await p.send('Page.enable'); await p.send('Runtime.enable');
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const nav = p.once('Page.loadEventFired');
  await p.send('Page.navigate', { url: 'data:text/html,<p>x</p>' });
  await nav;
  const ev = async (e) => (await p.send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.value;
  const q = (arr) => { arr.sort((a, b) => a - b); const at = (p) => +arr[Math.min(arr.length - 1, Math.ceil(p * arr.length) - 1)].toFixed(2); return { n: arr.length, p50: at(0.5), p95: at(0.95), max: at(1) }; };
  const raf = await ev(`new Promise(r=>{const t=[];const f=()=>{t.push(performance.now());if(t.length<121)requestAnimationFrame(f);else r(t.slice(1).map((v,i)=>v-t[i]))};requestAnimationFrame(f)})`);
  const lat = await ev(`(async()=>{const o=[];for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,7));const t0=performance.now();document.querySelector('p').textContent=i;await new Promise(r=>requestAnimationFrame(()=>{const c=new MessageChannel();c.port1.onmessage=r;c.port2.postMessage(0)}));o.push(performance.now()-t0)}return o})()`);
  out[name] = { flags, raf_interval_ms: q(raf), dom_change_to_next_frame_ms: q(lat) };
  p.close(); await b.close();
}
process.stdout.write(JSON.stringify({ note: 'A trivial DOM change needs a median ~1 frame; tails here are headless frame scheduling on a loaded host, not page work.', results: out }, null, 1) + '\n');
