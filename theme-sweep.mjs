import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {THEMES} from './src/theme.ts';
import {decodePng, luminanceStats} from './scripts/lib/png.mjs';

const OUT = '/tmp/theme-sweep';
mkdirSync(OUT, {recursive: true});
const meta = JSON.parse(readFileSync('out/meta.json', 'utf8'));
const serveUrl = await bundle({entryPoint: './src/index.ts', onProgress: () => {}});

const rows = [];
const names = ['authored', ...Object.keys(THEMES)];
for (const name of names) {
  const inputProps = name === 'authored' ? {} : {theme: THEMES[name]};
  let n = 0;
  for (const m of meta) {
    const frame = Math.min(m.posterFrame ?? m.checkFrame, m.durationInFrames - 1);
    const out = join(OUT, `${m.id}__${name}.png`);
    try {
      const composition = await selectComposition({serveUrl, id: m.id, inputProps});
      await renderStill({composition, serveUrl, output: out, frame, scale: 0.25,
        chromiumOptions: {gl: 'angle'}, logLevel: 'error', inputProps});
      const s = luminanceStats(decodePng(out));
      rows.push({id: m.id, theme: name, mean: s.mean, std: s.std, ink: s.ink, edge: s.edge, ground: m.ground});
    } catch (err) {
      rows.push({id: m.id, theme: name, error: String(err.message ?? err).split('\n')[0].slice(0, 120)});
    }
    n++;
  }
  console.log(`  ${name}: ${n} rendered`);
}
writeFileSync('/tmp/theme-sweep.json', JSON.stringify(rows, null, 1));
console.log('done', rows.length, 'renders');
