#!/usr/bin/env node
/**
 * Writes every effect's fully-composed, self-sufficient prompt to out/prompts/<id>.md.
 * Same composition the gallery's "Copy prompt" button produces — this is the file
 * a blind agent is handed during validation.
 */
import {readFileSync, writeFileSync, mkdirSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = join(root, 'src');
const OUT = join(root, 'out', 'prompts');
mkdirSync(OUT, {recursive: true});

const essentials = readFileSync(join(src, 'prompt-kit/remotion-essentials.md'), 'utf8').trim();
const projectSetup = readFileSync(join(src, 'prompt-kit/project-setup.md'), 'utf8').trim();

const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());

const readMeta = (file) => {
  // meta.ts is a plain object literal; pull the fields we need without a TS loader.
  const raw = readFileSync(file, 'utf8');
  const pick = (k) => raw.match(new RegExp(`\\b${k}:\\s*'([^']*)'`))?.[1];
  const pickNum = (k) => Number(raw.match(new RegExp(`\\b${k}:\\s*(\\d+)`))?.[1]);
  const pkgs = raw.match(/packages:\s*\[([^\]]*)\]/s)?.[1] ?? '';
  return {
    id: pick('id'),
    name: pick('name'),
    width: pickNum('width'),
    height: pickNum('height'),
    fps: pickNum('fps'),
    durationInFrames: pickNum('durationInFrames'),
    checkFrame: pickNum('checkFrame'),
    packages: [...pkgs.matchAll(/'([^']+)'/g)].map((m) => m[1]),
  };
};

/** Packages that ship no types of their own and need an @types companion. */
const needsTypes = (p) => p === 'three' || p.startsWith('d3-');

const installLine = (packages) => {
  const rp = packages.filter((p) => p.startsWith('@remotion/'));
  const op = packages.filter((p) => !p.startsWith('@remotion/') && p !== 'remotion');
  const dev = op.filter(needsTypes).map((p) => `@types/${p}`);
  const lines = [];
  if (rp.length) lines.push(`npx remotion add ${rp.join(' ')}`);
  if (op.length) lines.push(`npm i ${op.join(' ')}`);
  if (dev.length) lines.push(`npm i -D ${dev.join(' ')}`);
  return lines.length ? lines.join('\n') : '# no extra packages needed';
};

/**
 * The brief carries its own hand-written **Setup** block, and meta.packages is
 * the machine-checked list. Two lists that can disagree is a bug we shipped
 * once already, so rewrite the brief's block from the metadata at compose time.
 */
const syncSetupBlock = (brief, packages) =>
  brief.replace(
    /(\*\*Setup\*\*\s*\n+```bash\n)[\s\S]*?(\n```)/,
    (_m, open, close) => `${open}${installLine(packages)}${close}`,
  );

let n = 0;
for (const category of dirs(join(src, 'effects')).sort()) {
  for (const id of dirs(join(src, 'effects', category)).sort()) {
    const dir = join(src, 'effects', category, id);
    const meta = readMeta(join(dir, 'meta.ts'));
    const brief = syncSetupBlock(readFileSync(join(dir, 'prompt.md'), 'utf8').trim(), meta.packages);

    const composed = `# ${meta.name} — Remotion

${brief}

---

${projectSetup}

## Packages this effect needs (the complete list)

\`\`\`bash
${installLine(meta.packages)}
\`\`\`

---

${essentials}

---

## Definition of done

- The exported component is named as the brief says; the **composition id is \`${meta.id}\`**
  (PascalCase component, kebab-case id). Register it in \`src/Root.tsx\` at
  ${meta.width}×${meta.height}, ${meta.fps}fps, ${meta.durationInFrames} frames. The CLI commands below
  address the composition by its id, so they only work if the id matches exactly.
- \`npx remotion studio --no-open\` starts with no errors and the composition plays.
- \`npx remotion still ${meta.id} --frame=${meta.checkFrame} --scale=0.5 --output=out/check.png\`
  produces a frame with the effect **mid-flight** — open it and look at it before you report back.
  Frame ${meta.checkFrame} is chosen deliberately: a frame taken after everything has settled proves
  nothing, because a component with no animation at all would pass it.
- No CSS \`transition\`/\`animation\`/\`@keyframes\`, no \`setTimeout\`/\`setInterval\`/\`requestAnimationFrame\`
  anywhere in the component. Every moving value traces back to \`useCurrentFrame()\`.
`;
    writeFileSync(join(OUT, `${meta.id}.md`), composed);
    n++;
  }
}
console.log(`wrote ${n} composed prompts to out/prompts/`);
