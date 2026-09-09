#!/usr/bin/env node
/**
 * Flags effects whose checkFrame renders identically to a frame 6 later — which
 * means the nominated "mid-flight" frame is actually a static hold, and the
 * gallery poster (and the prompt's verification step) prove nothing.
 */
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import {readdirSync, readFileSync, statSync, mkdirSync, readFileSync as rf} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const TMP = 'out/deadcheck';
mkdirSync(TMP, {recursive: true});

const effectsDir = join(process.cwd(), 'src', 'effects');
const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());
const checkFrames = new Map();
for (const cat of dirs(effectsDir)) {
  for (const id of dirs(join(effectsDir, cat))) {
    const raw = readFileSync(join(effectsDir, cat, id, 'meta.ts'), 'utf8');
    const f = raw.match(/checkFrame:\s*(\d+)/)?.[1];
    if (f) checkFrames.set(id, Number(f));
  }
}

const serveUrl = await bundle({entryPoint: join(process.cwd(), 'src/index.ts'), onProgress: () => undefined});
const comps = await getCompositions(serveUrl);
const md5 = (p) => createHash('md5').update(rf(p)).digest('hex');

const dead = [];
for (const c of comps) {
  const f = checkFrames.get(c.id);
  if (f === undefined) continue;
  const other = Math.min(c.durationInFrames - 1, f + 6);
  if (other === f) continue;
  const a = join(TMP, `${c.id}-a.png`);
  const b = join(TMP, `${c.id}-b.png`);
  await renderStill({composition: c, serveUrl, output: a, frame: f, scale: 0.3, chromiumOptions: {gl: 'angle'}, overwrite: true});
  await renderStill({composition: c, serveUrl, output: b, frame: other, scale: 0.3, chromiumOptions: {gl: 'angle'}, overwrite: true});
  if (md5(a) === md5(b)) {
    dead.push(`${c.id} (checkFrame ${f} is identical to ${other} — nothing is moving)`);
    console.log(`  DEAD  ${c.id} @ ${f}`);
  } else {
    console.log(`  live  ${c.id} @ ${f}`);
  }
}
console.log(dead.length ? `\n${dead.length} effect(s) with a dead check frame:\n  ${dead.join('\n  ')}` : '\nAll check frames show motion.');
