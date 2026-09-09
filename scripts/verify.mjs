#!/usr/bin/env node
/**
 * Quality gate: bundles once, then renders one still per composition.
 * Any effect that throws is a broken effect — the library must not ship it.
 *
 *   node scripts/verify.mjs            # every effect
 *   node scripts/verify.mjs text/      # ids/categories containing "text/"
 */
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import {mkdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const OUT = 'out/verify';
const filter = process.argv[2] ?? '';

if (!existsSync(OUT)) mkdirSync(OUT, {recursive: true});

console.log('Bundling…');
const serveUrl = await bundle({
  entryPoint: join(process.cwd(), 'src/index.ts'),
  onProgress: () => undefined,
});

// checkFrame lives in each meta.ts; read it straight out of the source.
const checkFrames = new Map();
{
  const effectsDir = join(process.cwd(), 'src', 'effects');
  const {readdirSync, readFileSync, statSync} = await import('node:fs');
  const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());
  for (const cat of dirs(effectsDir)) {
    for (const id of dirs(join(effectsDir, cat))) {
      const raw = readFileSync(join(effectsDir, cat, id, 'meta.ts'), 'utf8');
      const f = raw.match(/checkFrame:\s*(\d+)/)?.[1];
      if (f) checkFrames.set(id, Number(f));
    }
  }
}

const comps = (await getCompositions(serveUrl)).filter((c) => c.id.includes(filter));
console.log(`Rendering ${comps.length} stills…\n`);

const failures = [];
for (const comp of comps) {
  // Render the frame the effect's own meta nominates as its most representative.
  const frame = checkFrames.get(comp.id) ?? Math.round(comp.durationInFrames * 0.62);
  try {
    await renderStill({
      composition: comp,
      serveUrl,
      output: join(OUT, `${comp.id}.png`),
      frame,
      scale: 0.35,
      chromiumOptions: {gl: 'angle'},
      overwrite: true,
    });
    process.stdout.write(`  ok    ${comp.id}\n`);
  } catch (err) {
    failures.push({id: comp.id, message: String(err).split('\n')[0]});
    process.stdout.write(`  FAIL  ${comp.id}\n`);
  }
}

console.log(`\n${comps.length - failures.length}/${comps.length} rendered.`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ${f.id}\n    ${f.message}`);
  process.exit(1);
}
