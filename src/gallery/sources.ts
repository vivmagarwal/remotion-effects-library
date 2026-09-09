/**
 * Pulls the *actual* file contents of every effect at build time, so the code
 * shown in the gallery can never drift from the code that produced the preview.
 * Vite-only (import.meta.glob) — which is fine, the gallery is the only Vite entry.
 */
import essentials from '../prompt-kit/remotion-essentials.md?raw';
import projectSetup from '../prompt-kit/project-setup.md?raw';
import type {EffectMeta} from '../types';

const componentSources = import.meta.glob('../effects/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const promptSources = import.meta.glob('../effects/**/prompt.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** `file` is the registry's path relative to src/effects. */
export const sourceOf = (file: string): string =>
  componentSources[`../effects/${file}`] ?? '// source not found';

export const briefOf = (file: string): string => {
  const dir = file.split('/').slice(0, -1).join('/');
  return promptSources[`../effects/${dir}/prompt.md`] ?? '';
};

const installLine = (packages: readonly string[]): string => {
  const remotionPkgs = packages.filter((p) => p.startsWith('@remotion/') && p !== 'remotion');
  const otherPkgs = packages.filter((p) => !p.startsWith('@remotion/') && p !== 'remotion');
  const lines: string[] = [];
  if (remotionPkgs.length) lines.push(`npx remotion add ${remotionPkgs.join(' ')}`);
  if (otherPkgs.length) lines.push(`npm i ${otherPkgs.join(' ')}`);
  return lines.length ? lines.join('\n') : '# no extra packages needed';
};

/**
 * The full, self-sufficient prompt: everything an agent with no Remotion skills
 * installed and no memory of this conversation needs to rebuild the effect.
 */
export const composePrompt = (meta: EffectMeta, file: string): string => {
  const brief = briefOf(file).trim();
  return `# ${meta.name} — Remotion

${brief}

---

${projectSetup.trim()}

## Packages this effect needs

\`\`\`bash
${installLine(meta.packages)}
\`\`\`

---

${essentials.trim()}

---

## Definition of done

- The exported component is named as the brief says; the **composition id is \`${meta.id}\`**
  (PascalCase component, kebab-case id). Register it in \`src/Root.tsx\` at
  ${meta.width}×${meta.height}, ${meta.fps}fps, ${meta.durationInFrames} frames. The CLI commands below
  address the composition by its id, so they only work if the id matches exactly.
- \`npx remotion studio --no-open\` starts with no errors and the composition plays.
- \`npx remotion still ${meta.id} --frame=${Math.round(meta.durationInFrames * 0.6)} --scale=0.5 --output=out/check.png\`
  produces the frame described above — open it and check it actually looks right before you report back.
- No CSS \`transition\`/\`animation\`/\`@keyframes\`, no \`setTimeout\`/\`setInterval\`/\`requestAnimationFrame\`
  anywhere in the component. Every moving value traces back to \`useCurrentFrame()\`.
`;
};

export {essentials, projectSetup};
