#!/usr/bin/env node
/**
 * Gate: every file in public/ has a row in public/ASSETS.md.
 *
 * The media kit is NASA public-domain footage plus synthesised audio. A public
 * repo that redistributes media without provenance is a legal problem, not a
 * tidiness one — and the moment a row goes missing nobody can tell which file it
 * was. Orphan rows are reported too: a row for a file that is gone means the
 * manifest is describing something the repo no longer ships.
 */
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {PUBLIC_DIR, walkPublic} from './lib/fs.mjs';
import {gate} from './lib/gate.mjs';

const g = gate('check:assets');
const MANIFEST = join(PUBLIC_DIR, 'ASSETS.md');

if (!existsSync(MANIFEST)) {
  g.fail('public/ASSETS.md', 'missing — every file under public/ needs a provenance row (CONTRACT §4).');
  g.done('');
}

const manifest = readFileSync(MANIFEST, 'utf8');
const files = walkPublic().filter((f) => f !== 'ASSETS.md');

for (const f of files) {
  // A row names the file by its staticFile() path, or at minimum by its basename.
  const base = f.slice(f.lastIndexOf('/') + 1);
  if (manifest.includes(f)) continue;
  if (manifest.includes(base)) {
    g.fail(`public/${f}`, 'ASSETS.md names it only by basename — use the full staticFile() path', `expected a row containing \`${f}\``);
    continue;
  }
  g.fail(`public/${f}`, 'no row in public/ASSETS.md');
}

// Backtick-quoted media paths in the manifest that no longer exist on disk.
// Only paths (a slash) with a media extension count — a bare basename in prose
// and a codec string like `Lavf61.7.100` are not rows.
const MEDIA = /\.(mp4|mov|webm|mp3|wav|m4a|png|jpg|jpeg|svg|webp|json|ttf|woff2?)$/i;
const known = new Set(files);
const orphans = new Set();
for (const m of manifest.matchAll(/`([A-Za-z0-9._\/-]+)`/g)) {
  const p = m[1].replace(/^\/+/, '').replace(/^public\//, '');
  if (!p.includes('/') || !MEDIA.test(p) || known.has(p)) continue;
  orphans.add(p);
}
for (const p of orphans) g.note(`ASSETS.md has a row for \`${p}\`, which is not in public/`);

g.done(`${files.length} files under public/ all have a provenance row.`);
