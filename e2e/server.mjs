// Minimal static file server for the E2E fixture pages. Playwright's webServer
// boots this so the content script can be injected into a real http:// tab
// (the extension can't scan file:// pages — see getUnscannableReason).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pages');
const PORT = Number(process.env.E2E_PORT) || 5599;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  // Containment check: never serve outside the fixtures dir.
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`e2e fixtures on http://localhost:${PORT}`);
});
