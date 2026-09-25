// Static server for the browser probe. Serves the probe dir at / and $SCRATCH/web/data at /data/.
// JSON shards are sent as their precompressed brotli sibling (Content-Encoding: br) when the
// client advertises br, gzip otherwise; the encoding actually used is echoed in X-Probe-Encoding.
// no-store so every page load pays the real fetch.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' };

export function serve(dataDir, port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = url.pathname.startsWith('/data/') ? path.join(dataDir, url.pathname.slice(6)) : path.join(ROOT, url.pathname === '/' ? 'page/index.html' : url.pathname);
    file = path.normalize(file);
    if (!(file.startsWith(ROOT) || file.startsWith(dataDir)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' };
    const ae = String(req.headers['accept-encoding'] || '');
    if (path.extname(file) === '.json') {
      if (/\bbr\b/.test(ae) && fs.existsSync(file + '.br')) {
        const body = fs.readFileSync(file + '.br');
        res.writeHead(200, { ...headers, 'Content-Encoding': 'br', 'X-Probe-Encoding': 'br', 'Content-Length': body.length });
        res.end(body); return;
      }
      const body = zlib.gzipSync(fs.readFileSync(file), { level: 9 });
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'X-Probe-Encoding': 'gzip', 'Content-Length': body.length });
      res.end(body); return;
    }
    const body = fs.readFileSync(file);
    res.writeHead(200, { ...headers, 'Content-Length': body.length });
    res.end(body);
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r({ server, port: server.address().port })));
}
