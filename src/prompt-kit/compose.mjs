/**
 * THE prompt composer. One implementation, two callers:
 *
 *   - `scripts/emit-prompts.mjs`  (Node)  writes out/prompts/<id>.md
 *   - `src/gallery/sources.ts`    (Vite)  backs the "Copy prompt" button
 *
 * Those two used to be separate implementations and the gallery's — the one
 * real users actually copy — was strictly the worse of the two: no generated
 * props table, no `npm i -D @types/…` line, no `syncSetupBlock`, and a check
 * frame of `round(durationInFrames * 0.6)` (the settled end state) instead of
 * the deliberately mid-flight `meta.checkFrame`. `npm run check:prompts` only
 * ever saw the emitter's output, so the artefact people received had never been
 * through a gate. `npm run check:compose` now proves the two are byte-identical.
 *
 * Plain ESM on purpose: no TypeScript, no `node:fs`, no `import.meta.glob`. The
 * caller supplies every string, so the same module runs under Node and under
 * Vite. Everything here is pure.
 */

/* ------------------------------------------------------------------ *
 * Packages and install lines
 * ------------------------------------------------------------------ */

/**
 * Packages that ship no types of their own and need an @types companion.
 * `world-atlas` is deliberately absent — it ships JSON, which resolveJsonModule
 * handles without a types package.
 */
const NEEDS_TYPES = new Set(['three', 'topojson-client']);
const needsTypes = (p) => NEEDS_TYPES.has(p) || p.startsWith('d3-');

/** The exact shell block that installs everything `meta.packages` names. */
export const installLine = (packages) => {
  const list = packages ?? [];
  const rp = list.filter((p) => p.startsWith('@remotion/'));
  const op = list.filter((p) => !p.startsWith('@remotion/') && p !== 'remotion');
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
export const syncSetupBlock = (brief, packages) =>
  brief.replace(
    /(\*\*Setup\*\*\s*\n+```bash\n)[\s\S]*?(\n```)/,
    (_m, open, close) => `${open}${installLine(packages)}${close}`,
  );

/* ------------------------------------------------------------------ *
 * Source scanning
 * ------------------------------------------------------------------ */

/**
 * Split a `{…}` body on TOP-LEVEL commas only.
 *
 * Defaults contain arrays, objects AND string literals with commas inside them
 * ('Rendering, everywhere'), so the scan has to track quotes as well as
 * brackets. Also used by scripts/lib/meta.mjs to walk a meta.ts object literal,
 * which is why it lives here and is exported.
 */
export const splitTopLevel = (block) => {
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
    // Comments are skipped, not copied. Outside a string, `//` in these blocks
    // is always a comment — and a comment containing a comma used to split the
    // entry it belonged to, which is how a `posterFrame` with a "why" note above
    // it disappeared from the registry entirely.
    if (ch === '/' && block[i + 1] === '/') {
      const nl = block.indexOf('\n', i);
      i = nl === -1 ? block.length : nl - 1;
      continue;
    }
    if (ch === '/' && block[i + 1] === '*') {
      const end = block.indexOf('*/', i + 2);
      i = end === -1 ? block.length : end + 1;
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
  return parts;
};

/** The destructuring block regex. Exported so gates can report what it misses. */
export const PROPS_BLOCK_RE = /export const \w+: React\.FC<Props> = \(\{([\s\S]*?)\n\}\) =>/;

/** True when the file declares a `type Props` — i.e. it is SUPPOSED to have a table. */
export const declaresProps = (tsxSource) => /\btype Props\s*=/.test(tsxSource ?? '');

/**
 * Pull the component's props and their real defaults out of the source.
 *
 * Takes the source as a STRING, never a path: the gallery already has every
 * component eagerly via `import.meta.glob` and cannot read the filesystem.
 *
 * Hand-written briefs kept omitting a default here and there — blind agents
 * reported it every single round ("backgroundColor is the one prop with no
 * default"). Generating this table from the destructuring block means it is
 * complete by construction and cannot drift from the code.
 */
export const readPropsFromSource = (tsxSource) => {
  const src = tsxSource ?? '';
  const block = src.match(PROPS_BLOCK_RE)?.[1];
  if (!block) return [];

  // Doc comments from the Props type, keyed by prop name.
  const notes = new Map();
  const propsType = src.match(/type Props = \{([\s\S]*?)\n\};/)?.[1] ?? '';
  const noteRe = /\/\*\*([\s\S]*?)\*\/\s*\n\s*readonly (\w+)\??:/g;
  let nm;
  while ((nm = noteRe.exec(propsType)) !== null) {
    notes.set(nm[2], nm[1].replace(/\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim());
  }

  return splitTopLevel(block)
    .map((raw) => raw.split('\n').filter((l) => !l.trim().startsWith('//')).join(' ').trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      if (eq === -1) return {name: entry.trim(), def: '(required)', note: notes.get(entry.trim()) ?? ''};
      const name = entry.slice(0, eq).trim();
      let def = entry.slice(eq + 1).trim().replace(/\n\s*/g, ' ');
      if (def.length > 260) def = def.slice(0, 257) + '…';
      return {name, def, note: notes.get(name) ?? ''};
    })
    .filter((p) => /^\w+$/.test(p.name));
};

/** The markdown table. Takes the props array, not a path. */
export const propsTable = (props) => {
  if (!props || !props.length) return '';
  const rows = props
    .map((p) => `| \`${p.name}\` | \`${p.def.replace(/\|/g, '\\|')}\` | ${p.note.replace(/\|/g, '\\|')} |`)
    .join('\n');
  return `\n## Props and their exact defaults\n\nEvery prop the component takes, with the default it must use.\n\n| prop | default | note |\n|---|---|---|\n${rows}\n`;
};

/* ------------------------------------------------------------------ *
 * The prompt kit
 * ------------------------------------------------------------------ */

/**
 * The kit's files, by key. Both callers build their kit from THIS list so a new
 * .md file drops in on both sides at once. `core.md` falls back to the old
 * monolith while `src/prompt-kit/` is being split, so the composer keeps
 * working mid-migration instead of silently shipping a prompt with no core.
 */
export const KIT_FILES = Object.freeze({
  core: ['core.md'],
  houseStyle: ['house-style.md'],
  theme: ['theme.md'],
  projectSetup: ['project-setup.md'],
  video: ['video.md'],
  captions: ['captions.md'],
  audio: ['audio.md'],
  three: ['three.md'],
  d3: ['d3.md'],
  diagrams: ['diagrams.md'],
  shaders: ['shaders.md'],
});

/** Keys that are opt-in modules rather than always-on sections. */
export const MODULE_KEYS = Object.freeze(['video', 'captions', 'audio', 'three', 'd3', 'diagrams', 'shaders']);

/**
 * Which opt-in modules an effect gets. Data-driven and ordered: this array IS
 * the section order of the modules in the composed prompt (CONTRACT §7).
 */
export const MODULE_RULES = Object.freeze([
  {key: 'video', why: "meta.requires includes 'video'", when: (m) => (m.requires ?? []).includes('video')},
  {key: 'captions', why: "meta.requires includes 'transcript'", when: (m) => (m.requires ?? []).includes('transcript')},
  {key: 'audio', why: "meta.requires includes 'audio'", when: (m) => (m.requires ?? []).includes('audio')},
  {key: 'three', why: "meta.packages includes '@remotion/three'", when: (m) => (m.packages ?? []).includes('@remotion/three')},
  {key: 'd3', why: 'a package starts with d3-', when: (m) => (m.packages ?? []).some((p) => p.startsWith('d3-'))},
  {key: 'diagrams', why: "meta.packages includes 'edododraw'", when: (m) => (m.packages ?? []).includes('edododraw')},
  {
    key: 'shaders',
    // @remotion/transitions belongs here too: half its presentations are
    // shader-based and render a blank frame without --gl=angle, and shaders.md
    // §4 is the only place that warning now lives.
    why: 'the effect uses createEffect, @remotion/effects or @remotion/transitions',
    when: (m, src) =>
      (m.packages ?? []).some((p) => p === '@remotion/effects' || p.startsWith('@remotion/effects/')) ||
      (m.packages ?? []).includes('@remotion/transitions') ||
      /\bcreateEffect\b/.test(src ?? ''),
  },
]);

/**
 * Turn a `{filename: contents}` record into the kit object `composePrompt`
 * wants. Node builds the record with readFileSync, the gallery with
 * `import.meta.glob('../prompt-kit/*.md', {query: '?raw', eager: true})` — same
 * function, same fallbacks, so the two sides cannot drift.
 */
export const buildKit = (files) => {
  const pick = (key) => {
    for (const name of KIT_FILES[key]) {
      const v = files[name];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return undefined;
  };
  const modules = {};
  for (const key of MODULE_KEYS) modules[key] = pick(key);
  return {
    coreMd: pick('core'),
    houseStyleMd: pick('houseStyle'),
    themeMd: pick('theme'),
    projectSetupMd: pick('projectSetup'),
    modules,
  };
};

/**
 * Look a module up by key.
 *
 * Accepts both keyings on purpose — `{video: '…'}` (what `buildKit` produces)
 * and `{'video.md': '…'}` (what a Vite `import.meta.glob` of the folder produces
 * naturally). If the two callers keyed their kit differently the gallery would
 * silently drop every module while the emitter kept them, which is precisely the
 * class of divergence this module exists to end.
 */
export const moduleText = (modules, key) => {
  const hit = modules?.[key] ?? modules?.[`${key}.md`];
  return typeof hit === 'string' && hit.trim() ? hit : undefined;
};

/**
 * What this effect should get, and what the kit is missing.
 * `missing` is the "note it" half: a module that is selected but whose .md does
 * not exist yet is omitted from the prompt and reported to the caller.
 */
export const selectModules = ({meta, componentSource = '', kit = {}}) => {
  const mods = kit.modules ?? {};
  const wanted = MODULE_RULES.filter((r) => r.when(meta, componentSource));
  return {
    included: wanted.filter((r) => moduleText(mods, r.key)).map((r) => r.key),
    missing: wanted.filter((r) => !moduleText(mods, r.key)).map((r) => r.key),
  };
};

/* ------------------------------------------------------------------ *
 * The prompt
 * ------------------------------------------------------------------ */

const section = (s) => (s && s.trim() ? `${s.trim()}\n\n---\n\n` : '');

/**
 * The whole prompt: everything an agent with no Remotion knowledge, no memory
 * of this conversation and an empty directory needs to rebuild the effect.
 *
 * Order is CONTRACT §7:
 *   title → brief → project setup → package install → props table →
 *   house style → core → selected modules → definition of done.
 *
 * @param {object}   a
 * @param {object}   a.meta             the EffectMeta record
 * @param {string}   a.brief            the raw prompt.md
 * @param {string}   a.componentSource  the raw <Component>.tsx
 * @param {object}   a.kit              from buildKit()
 */
export const composePrompt = ({meta, brief, componentSource = '', kit = {}}) => {
  const body = syncSetupBlock((brief ?? '').trim(), meta.packages);
  const props = readPropsFromSource(componentSource);
  const {included} = selectModules({meta, componentSource, kit});
  const mods = kit.modules ?? {};

  return `# ${meta.name} — Remotion

${body}

---

${section(kit.projectSetupMd)}## Packages this effect needs (the complete list)

\`\`\`bash
${installLine(meta.packages)}
\`\`\`

${propsTable(props)}---

${section(kit.houseStyleMd)}${section(kit.themeMd)}${section(kit.coreMd)}${included.map((k) => section(moduleText(mods, k))).join('')}## Definition of done

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
};
