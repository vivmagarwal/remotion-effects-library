# Design system

Two layers, kept apart on purpose:

- **The theme** (`src/theme.ts`) — *brand*: grounds, ink, accents, typefaces, radius, stroke,
  roughness, safe area. Data, passed as a prop, swappable per video.
- **The house style** (`src/prompt-kit/house-style.md`) — *craft*: easing curves, spring configs,
  duration bands, stagger tiers, the type scale, the ship checklist. Inlined by name in each effect so
  a reviewer can see the intent.

Nobody's brand guidelines ever said "our videos use easeOutQuint", which is why the second layer is not
in the theme.

---

## 1. The theme contract

A component may not import a tokens module and may not read a React context — both are imports, and
every effect has to run in a project that has never heard of this repository. So the theme is a **prop
with an inline default**:

```tsx
/** Only the tokens THIS file uses. TypeScript is structural, so a full Theme is assignable to it. */
type Theme = {readonly bg: string; readonly accent: string; readonly text: string};
const THEME: Theme = {bg: '#0a0b10', accent: '#ff5c39', text: fontFamily};

export const Foo: React.FC<Props> = ({
  theme = THEME,                 // must be the FIRST destructured parameter
  backgroundColor = theme.bg,    // later defaults may read earlier ones
  accentColor = theme.accent,
}) => …
```

Three properties fall out, and all three were required: the file is **standalone**, a set of
compositions given the same object is **consistent**, and an explicit prop still **overrides** the
theme (a default parameter only applies when the argument is absent).

The shared vocabulary is enforced **by name**, not by a shared import — that is what `check:theme`
does: every declared token must exist in `src/theme.ts` with the same type, and every inline default
must be the house value. Font tokens (`display`, `text`, `mono`, `hand`) are the exception: they
default to the family the file itself loaded.

---

## 2. Tokens

Full definitions and per-token commentary: `src/theme.ts`. House values in brackets.

| Group | Token | Meaning |
|---|---|---|
| scheme | `scheme` | `'dark' \| 'light'` — pick between a scrim and a shadow, not derivable from a colour |
| grounds | `bg` `#0a0b10` | The ground almost every effect sits on |
| | `bgDeep` `#04050a` | Space, 3D, particles — where a star needs somewhere dark to be |
| | `paper` `#f6f5f2` | The light ground for effects designed light rather than inverted |
| | `surface` `#101218` | One step off the ground: plates, cards, pills, code blocks |
| ink on dark | `ink` `#ffffff` · `body` `#eef1f7` · `muted` `#8d93a5` | Display · body · secondary |
| ink on paper | `paperInk` `#1d1b17` · `paperMuted` `#4a4e5a` | Display · secondary |
| accent | `accent` `#ff5c39` | The brand colour. One per effect |
| | `accentInk` `#04050a` | Type and marks that sit **on** the accent |
| | `accentOnPaper` `#c2410c` | The accent adjusted to hold contrast on `paper` |
| | `pair` `#4cc9f0` | The accent's semantic partner — before/after, gain/loss. Never two warms |
| | `series` (6) | Ordered categorical palette for charts and legends. Index into it; never pick by eye |
| | `paperSeries` (8) | The same job for marks on `paper`; every entry holds **4.5:1** on that theme's paper, so it can letter a label, not just outline a box |
| type | `display` · `text` · `mono` · `hand` | CSS family strings (Archivo · Inter · JetBrains Mono · Kalam in the house theme) |
| shape | `radius` `18` · `stroke` `3` | Base corner radius and stroke width at 1920×1080 — scale by `height / 1080` |
| | `roughness` `0.45` | 0 ruler-straight, 1 sketchy. Drives rough.js through edododraw and `@remotion/rough-notation`. Past ~0.6 two adjacent edges read as a mistake |
| layout | `safe` `84` | Margin at 1920×1080 |

**Fonts are family strings, not loaders.** `@remotion/google-fonts` is a static subpath import per
family, so a theme carries the CSS family and whoever builds the theme is responsible for having
loaded it. `src/theme.ts` loads the families the shipped themes name; a standalone file keeps its own
`loadFont()` call and puts that family in its inline default.

---

## 3. The five shipped themes

| Name | Scheme | Character |
|---|---|---|
| `house` | dark | The look this library ships. Every inline default equals these values. |
| `broadsheet` | light | Editorial: paper ground, Playfair Display over Inter, `radius: 4`, ruler-straight (`roughness: 0`). Its paper tokens are its **own** — inheriting them from `HOUSE` once meant the one paper theme changed nothing on paper-ground effects. |
| `console` | dark | Terminal: near-black ground, lime accent, JetBrains Mono for display and text, `radius: 2`, `roughness: 0`. |
| `studio` | dark | Warm grey ground, violet accent, Sora, `radius: 28`, a lighter hand (`roughness: 0.3`). |
| `edodo` | light | The EDodo brand: white canvas, `#111827` ink, teal `#0d9488` as the one accent (text-bearing twin `#0f766e`, because the fill teal holds only 3.7:1 on white), violet `#8b5cf6` as a sparse partner, Inter only. |

### `themeFor(theme, ground)`

A light theme cannot sensibly reground an effect whose *subject* is light on dark — 28,000 white
particles on white paper is not a restyle, it is an erasure. So when a **light** theme meets an effect
whose ground is `'dark'`, `themeFor()` hands over the accent, typefaces and shape and leaves `bg`,
`bgDeep`, `surface`, `ink`, `body` and `muted` at the house values. `meta.ground` is required, and an
absent value is read as `'dark'` here — the same reading the gallery's filter gives it. Both `src/Root.tsx` and the gallery
call it, so they make the same decision.

### Applying a theme

```bash
REMOTION_THEME=console npx remotion studio    # or remotion render — an unknown name throws at startup
```

```tsx
// inputProps must go to BOTH calls: Remotion resolves props when it selects the composition
const composition = await selectComposition({serveUrl, id, inputProps: {theme: THEMES.console}});
await renderStill({composition, serveUrl, output, frame, inputProps: {theme: THEMES.console}});
```

In the gallery, the **Video theme** picker does the same thing live. Its default is *As authored* —
which is **not** the house theme: it means no theme object is passed at all, so each effect uses the
typeface and accent it was written with. That is what you get from pasting a single file, so it is what
the catalogue shows.

**What a theme reaches:** prop defaults and typefaces — the configurable surface. Colour literals
inside a component body stay, because most are not tokens (a scrim's alpha, a gradient stop, a
recreated product's palette). `meta.ground` records which grounds an effect was designed for, and
`check:themes` proves a theme moves the picture rather than only the props.

---

## 4. House style — the craft layer

Full text: `src/prompt-kit/house-style.md` (it is inlined into every composed prompt).

### Type scale at 1920×1080 — scale by `height / 1080`

| Tier | px | Weight | Tracking | Use |
|---|---|---|---|---|
| `HERO` | 220 | 800 | −0.045em | One-word slam, stat slam |
| `DISPLAY` | 140 | 800 | −0.035em | Title lock-up |
| `HEADLINE` | 92 | 800 | −0.03em | Headline, kinetic words |
| `SUBHEAD` | 62 | 700 | −0.02em | Secondary line, chart title |
| `BODY` | 44 | 500 | −0.01em | Captions, labels, lower-third name |
| `SMALL` | 34 | 500 | 0 | Credits, footnotes — **absolute floor** |
| `EYEBROW` | 28 | 700 | +0.24em, upper | Kicker, chapter number, badge |

Dense informational layers are exempt from the floor: chart ticks, code and terminal output, recreated
product UI, HUD readouts, table cells, legends. A 19 px axis label is correct.

### Motion vocabulary

| Easing | Curve | Use |
|---|---|---|
| `SETTLE` | `Easing.bezier(0.16, 1, 0.3, 1)` | easeOutExpo — **default entrance** |
| `GLIDE` | `Easing.bezier(0.22, 1, 0.36, 1)` | easeOutQuint — softer, long travel |
| `SWEEP` | `Easing.bezier(0.65, 0, 0.35, 1)` | easeInOutCubic — on-screen A→B moves only |
| `LEAVE` | `Easing.bezier(0.5, 0, 0.75, 0)` | easeInQuad — exits only |
| `SNATCH` | `Easing.bezier(0.7, 0, 0.84, 0)` | easeInQuart — whip-outs, hard cuts |
| `DRIFT` | `Easing.linear` | Constant motion only: camera drift, marquee, ticker |

| Spring | Config | Overshoot / settle |
|---|---|---|
| `SNAP` | `{damping: 24, stiffness: 155, mass: 1}` | 0 %, 10 f |
| `MICRO` | `{damping: 22, stiffness: 220, mass: 0.7}` | 0.2 %, 8 f — ticks, chips |
| `SETTLE_S` | `{damping: 20, stiffness: 165, mass: 1}` | 2 %, 12 f — **default** |
| `POP` | `{damping: 18, stiffness: 190, mass: 1}` | 6.7 %, 13 f — badges |
| `BOUNCE` | `{damping: 15, stiffness: 200, mass: 1}` | 14 %, 16 f — once per effect |
| `FLOAT` | `{damping: 22, stiffness: 120, mass: 1.4}` | 0.6 %, 15 f — heavy objects |

Never ship bare `spring({frame, fps})`: its 16 % overshoot over 24 frames is the most common tell of an
unstyled Remotion video.

**Duration bands:** micro 6–10 f · standard 15–20 f · hero 30–45 f · ambient ≥90 f looping. Pick one
and stay in it; a 23-frame entrance reads as neither.

**Stagger tiers:** glyphs and particles 2–3 f (span ≤ 12 f) · siblings read one by one 4–8 f
(`min(5, 18 / n)`) · two *ideas* in one shot ≥ 24 f apart, a payoff line ~36 f alone.

### Safe areas

`SAFE = 84` at 1920×1080. Vertical 1080×1920: `SAFE_X 84`, `SAFE_TOP 240`, `SAFE_BOTTOM 380`. A caption
or CTA that must also clear TikTok's caption stack sits at **≥ 484**; anything that must survive the
4:5 feed crop stays inside **y 300–1440**; on 16:9, burned captions sit **≥ 108 px** up, above
YouTube's control bar. Only full-bleed grounds, wipes and letterbox bars cross the safe area.

### The 12-point ship checklist

An effect ships only if all twelve pass — named easing on every entrance, exits ~20 % shorter than
entrances, nothing scales from 0, overshoot ≤ 7 % on at most one element, stagger by tier, one property
carrying the motion per 10-frame window, motion blur past 25 % of frame width in under 8 frames, a
named duration band, type on the scale, one accent (or a `// palette: brand-mimicry` marker), readable
content inside `SAFE`, and it reads at both 0.17× card scale and 100 %. The full list, with the
reasoning, is at the end of `src/prompt-kit/house-style.md`.

---

## 5. Adding or changing a theme

1. Add the entry to `THEMES` in `src/theme.ts` (spread `HOUSE`, override deliberately — including the
   paper tokens if the theme is light).
2. If it introduces a typeface, `loadFont()` it at the top of that file.
3. `npm run check:theme` (static vocabulary) and `npm run check:themes -- --only <name>` (renders it
   against every effect).
4. The gallery picker and `REMOTION_THEME` pick it up with no further wiring.

Adding a **token** is heavier: add it to the `Theme` type and to every theme in `THEMES`, add it to the
probe list in `scripts/check-themes.mjs`, document it in `src/prompt-kit/theme.md` (which ships inside
every prompt), and only then use it in a component — `check:theme` fails on a token a component
declares that `src/theme.ts` does not have.
