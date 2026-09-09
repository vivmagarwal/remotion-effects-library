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

/**
 * Packages that ship no types of their own and need an @types companion.
 * `world-atlas` is deliberately absent — it ships JSON, which resolveJsonModule
 * handles without a types package.
 */
const NEEDS_TYPES = new Set(['three', 'topojson-client']);
const needsTypes = (p) => NEEDS_TYPES.has(p) || p.startsWith('d3-');

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


/**
 * Pull the component's props and their real defaults out of the source.
 *
 * Hand-written briefs kept omitting a default here and there — blind agents
 * reported it every single round ("backgroundColor is the one prop with no
 * default"). Generating this table from the destructuring block means it is
 * complete by construction and cannot drift from the code.
 */
const readProps = (dir) => {
  const tsx = readdirSync(dir).find((f) => f.endsWith('.tsx'));
  if (!tsx) return [];
  const src = readFileSync(join(dir, tsx), 'utf8');

  const block = src.match(/export const \w+: React\.FC<Props> = \(\{([\s\S]*?)\n\}\) =>/)?.[1];
  if (!block) return [];

  // Doc comments from the Props type, keyed by prop name.
  const notes = new Map();
  const propsType = src.match(/type Props = \{([\s\S]*?)\n\};/)?.[1] ?? '';
  const noteRe = /\/\*\*([\s\S]*?)\*\/\s*\n\s*readonly (\w+)\??:/g;
  let nm;
  while ((nm = noteRe.exec(propsType)) !== null) {
    notes.set(nm[2], nm[1].replace(/\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim());
  }

  // Split the destructuring on top-level commas only. Defaults contain arrays,
  // objects AND string literals with commas inside them ('Rendering,
  // everywhere'), so the scan has to track quotes as well as brackets.
  const parts = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') {
        cur += block[++i] ?? '';
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      cur += ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);

  return parts
    .map((raw) => raw.split('\n').filter((l) => !l.trim().startsWith('//')).join(' ').trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      if (eq === -1) return {name: entry.trim(), def: '(required)', note: notes.get(entry.trim()) ?? ''};
      const name = entry.slice(0, eq).trim();
      let def = entry.slice(eq + 1).trim().replace(/\n\s*/g, ' ');
      if (def.length > 260) def = def.slice(0, 257) + "…";
      return {name, def, note: notes.get(name) ?? ''};
    })
    .filter((p) => /^\w+$/.test(p.name));
};

const propsTable = (dir) => {
  const props = readProps(dir);
  if (!props.length) return '';
  const rows = props
    .map((p) => `| \`${p.name}\` | \`${p.def.replace(/\|/g, '\\|')}\` | ${p.note.replace(/\|/g, '\\|')} |`)
    .join('\n');
  return `\n## Props and their exact defaults\n\nEvery prop the component takes, with the default it must use.\n\n| prop | default | note |\n|---|---|---|\n${rows}\n`;
};

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

${propsTable(dir)}
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
