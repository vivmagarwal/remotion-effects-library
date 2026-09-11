# Effect authoring guide

The contract every one of the 96 effects implements, and how to add the 97th.

---

## 1. The folder

```
src/effects/<category>/<id>/
├── <Component>.tsx     PascalCase of the id. Exports a named React.FC.
├── meta.ts             export const meta: EffectMeta
└── prompt.md           the brief (see §4)
```

Those three files, plus — only for `viz-gallery` — a generated `variants.generated.ts`.
`npm run registry` fails on a folder without exactly one `.tsx` or missing `meta.ts`/`prompt.md`; `check:meta` fails if the id is not the
kebab-case form of the component name.

`<category>` is one of the 16 in the `Category` union (`src/types.ts`). The folder tree encodes the
**subject** axis only. Technology is a separate facet the gallery filters on through `meta.packages` —
which is why there is no `webgl` or `svg` category, and why `three-d` means real three.js.

---

## 2. The component

Non-negotiables (all of them gated or carried in every prompt):

- **One file.** No imports from other effects, no shared helpers, no tokens module.
- **Frame-driven.** Every moving value derives from `useCurrentFrame()`. No CSS
  `transition`/`animation`/`@keyframes`, no `setTimeout`/`setInterval`/`requestAnimationFrame`, no
  `Date.now()`/`performance.now()`, no `Math.random()` (use `random(seed)` from `remotion`).
- **Every prop optional with a default**, unless genuinely required. The defaults are the contract:
  `check:prompts` fails if a default is missing from the composed prompt.
- **Theme-shaped props.** Declare a local `type Theme = {...}` with only the tokens the file uses and a
  `const THEME: Theme = {...}` holding the house values, then `theme = THEME` as the **first**
  destructured parameter so later defaults can read it:

```tsx
export const Foo: React.FC<Props> = ({
  theme = THEME,
  backgroundColor = theme.bg,      // a default parameter may read an earlier one
  accentColor = theme.accent,
}) => …
```

  `check:theme` fails on a token name that is not in `src/theme.ts`, a token typed differently, or an
  inline default that is not the house value. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- **Fonts** are loaded in-file via `@remotion/google-fonts/<Family>`; `check:fonts` fails on a weight
  used but never loaded.
- **Colours** come from the house palette, are derived from a prop, or carry a
  `// palette: brand-mimicry <name>` marker (`check:palette`).
- **SVG ids must be per-instance** (`useId()`), or two players on one page share clips and masks.
- **`<Video>`/`<Audio>` from `@remotion/media`**, and `objectFit` is a **prop, never a style**
  (`check:media-props`).

---

## 3. `meta.ts`

Typed as `EffectMeta` (`src/types.ts` — read it; every field is documented there). The fields that
carry real consequences:

| Field | Rule | Consequence if wrong |
|---|---|---|
| `id` | kebab-case, unique, = kebab of the component name | It is also the Remotion composition id the prompt tells an agent to render |
| `tagline` | 42–79 chars, sentence case, ends in `.` | `check:meta` fails on length and the full stop (case is convention) |
| `description` | A paragraph: what it looks like and the ONE decision that makes it work | It is the gallery's search corpus and the About tab |
| `tags` | 4–7, from `TAGS` in `src/tags.ts` | `check:vocab` fails on a term outside the list (the count is convention) |
| `concepts` | 3–5, from `CONCEPTS` | `check:vocab` fails on a term outside the list; drives the learn-by-concept index |
| `packages` | Everything the copied file imports, beyond react | Generates the install line in the prompt; `check:imports` fails on a mismatch either way |
| `checkFrame` | A frame where the effect is **mid-flight** | It is what the prompt tells an agent to render and look at; `check:frames` rejects a frame with no motion |
| `posterFrame` | Optional. The gallery card's frame | A proof frame and a poster are different jobs; omit when they coincide |
| `requires` | `'video' \| 'audio' \| 'image' \| 'transcript'` | Selects prompt modules and drives the gallery's *Needs* filter |
| `ground` | `'dark' \| 'light' \| 'both' \| 'transparent'` — **required** | `themeFor()` uses it to decide whether a light theme may touch the ground. It is required because the two readings of an absent value disagreed: `themeFor()` regrounded, the gallery's filter assumed dark |
| `difficulty` | Rubric in `src/types.ts` — rate the mechanism, not how impressive it looks | Gallery sort and filter |
| `audience`, `driveMode`, `credit` | Optional facets | Gallery filters / About tab |
| `variants` | See §5 | Each becomes its own composition and gallery card |

---

## 4. `prompt.md` — the brief

The brief is the human half of the prompt; the kit supplies the rest ([PROMPT_KIT_GUIDE.md](PROMPT_KIT_GUIDE.md)).

Write it so an agent **with an empty directory and no memory of this repo** can rebuild the effect:

- Exact numbers: dimensions, fps, duration, sizes, colours (with the house hex), frame timings.
- The one or two things that will otherwise ruin it, with the reason.
- A `**Setup**` block with a fenced `bash` install — it is **rewritten from `meta.packages`** at
  compose time, so it cannot drift.
- Props and their defaults in prose; the machine-generated table is appended automatically.
- **No references to this repository.** `check:standalone` fails on "this repo", "the library",
  "as elsewhere", "see also", and on a `staticFile()` path that is not in `public/`.

`src/effects/type/text-scramble/prompt.md` is a good short model; `src/effects/edit/silence-cut/prompt.md`
is a good model for a data-driven one.

---

## 5. Variants

A variant is the same component with a different prop set. Use it for a family; use a new folder when
the component would have to **branch on which variant it is** beyond reading a prop.

```ts
variants: [
  {id: 'tripod', name: 'Handheld — Tripod', tagline: 'A locked-off shot that is not quite dead: ±3px.', props: {preset: 'tripod'}},
]
```

- Composition id becomes `<parent-id>--<variant-id>`; the gallery groups them under the parent.
- Only `name`, `tagline`, `checkFrame`, `posterFrame` may be overridden — everything else is inherited.
- The base meta **is** variant zero. Do not repeat it in the list.
- In Studio, prop edits on a variant are scratch edits: Studio writes prop changes back into the
  literal in `Root.tsx`, and a variant's props arrive through a variable. Edit `meta.ts` instead.

`viz-gallery`'s 86 variants are generated from edododraw's own demo catalogue by
`npm run viz:variants` — see [DIAGRAMS_VIZ_GUIDE.md](DIAGRAMS_VIZ_GUIDE.md).

---

## 6. Vocabularies

`src/tags.ts` holds two closed lists:

- `TAGS` — what an effect **is** and is **for** (subject, medium, look, format). 4–7 per effect.
- `CONCEPTS` — the technique it **teaches**, named the way someone would search for it
  (`stroke-dashoffset draw`, `d3-force`). 3–5 per effect.

Adding a term is expected — but add it because **two or more** effects need it. A term used once is a
description, and descriptions belong in `meta.description`, which the gallery already indexes.

---

## 7. Adding an effect — the loop

```bash
mkdir -p src/effects/<category>/<id>                 # copy the closest existing effect
# write Component.tsx, meta.ts, prompt.md
npm run gate:fast                                    # registry, tsc, and every non-rendering gate
npm run still <id> -- --frame=<checkFrame> --scale=0.5 --output=out/check.png
open out/check.png                                   # look at it — this is the point
npm run verify                                       # renders a still for every effect
```

Then, ideally: hand `out/prompts/<id>.md` to an agent with no context and see whether it can rebuild
the effect. Every recurring prompt defect this project has fixed was found that way, not by reading.

The registry, Studio, the gallery grid and the prompt file all follow automatically — there is no
manual registration step.

---

## 8. Removing or renaming an effect

1. Delete the folder (or rename the folder **and** the `id` in `meta.ts` together).
2. `npm run registry` — the generated registry is committed, so it must be regenerated.
3. `npm run prompts` — `emit-prompts.mjs` deletes prompts for effects that no longer exist.
4. `npm run gate:fast`.
5. Grep `README.md` and `docs/` for the old id; `npm run docs` regenerates the README catalogue table.
