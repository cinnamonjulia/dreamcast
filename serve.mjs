// Tiny dev server for local preview — not needed for GitHub Pages.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') path = '/index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error('forbidden');
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': (TYPES[extname(file)] || 'application/octet-stream') + '; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      // frame-ancestors can't be set via <meta> CSP — it must be a real header
      'Content-Security-Policy': "frame-ancestors 'none'",
      'X-Frame-Options': 'DENY',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
  // localhost only — never expose the folder to the LAN
}).listen(8642, '127.0.0.1', () => console.log('Dreamcast on http://localhost:8642'));
