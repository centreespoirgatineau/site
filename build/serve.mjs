// A tiny local server for public/, behaving like the nginx configuration:
// clean URLs (/dons → dons.html), a real 404 page, no caching of HTML.
//
//   node build/serve.mjs [port]      → http://localhost:8090
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.argv[2] || 8090);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/index';
  const candidates = [clean, clean + '.html', clean + '/index.html'];
  for (const c of candidates) {
    const p = path.join(ROOT, c);
    if (!p.startsWith(ROOT)) continue;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { p, status: 200 };
  }
  return { p: path.join(ROOT, '404.html'), status: 404 };
}

http.createServer((req, res) => {
  const { p, status } = resolve(req.url);
  const ext = path.extname(p);
  res.writeHead(status, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
  });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
