// Mirrors the built client (client/dist) to the repo-root dist folder so the
// static output is found whether Vercel's Root Directory is the repo root or
// the client folder. Both locations are gitignored.
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'dist');
const dest = path.resolve(__dirname, '..', '..', 'dist');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('[copy-dist] client/dist/index.html not found; skipping mirror.');
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('[copy-dist] mirrored client/dist -> dist');
