## The theme — one structure every effect takes

Every effect in this catalogue accepts a `theme` prop. Pass one object to a set
of compositions and they agree on ground, ink, accent, typeface, corner radius
and hand-drawn roughness; pass nothing and the file uses the values inlined in
it. That is what makes a set of videos look like one brand instead of ninety-six
demos.

### It is a PROP with an inline default — never an import

A component here is one self-contained file. It may not import a tokens module,
and it may not read a React context, because both are imports and this file has
to run in a project that has never heard of where it came from. So:

```tsx
/** Only the tokens THIS file uses. TypeScript is structural, so a full theme
 *  object is still assignable to it — the vocabulary is shared by NAME. */
type Theme = {
  readonly bg: string;
  readonly accent: string;
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  bg: '#0a0b10',
  accent: '#ff5c39',
  text: fontFamily,        // this file's own loaded family
};

export const Foo: React.FC<Props> = ({
  theme = THEME,                     // FIRST — see below
  backgroundColor = theme.bg,
  accentColor = theme.accent,
  fontFamily = theme.text,
}) => …
```

Three rules, and each of them is load-bearing:

1. **`theme = THEME` must be the first destructured parameter.** A default
   parameter may only read parameters declared *before* it. Put it second and
   `backgroundColor = theme.bg` is a use-before-declaration error.
2. **Individual props still win.** They are defaults, so an explicit
   `accentColor` overrides the theme, and the theme overrides the file. Three
   levels, in the order a caller expects.
3. **The inline default is the house value**, so passing no theme means the
   house look rather than an accident.

### The typeface trick

Declare the prop as **`fontFamily`**. Every component already writes
`style={{fontFamily}}` — the ES shorthand for `fontFamily: fontFamily` — reading
a module-scope const from its own `loadFont`. A prop of the same name shadows
that const inside the component, so every existing style picks up the theme with
no other edit, and the default (`theme.text`, whose inline value is that same
const) keeps a pasted file rendering in the face it was written for.

`@remotion/google-fonts` is one static subpath import per family, so a theme
carries the **CSS family string** and whoever built the theme is responsible for
having loaded it. There is no way to load "whatever family this string names".

### The vocabulary

| token | type | what it is |
|---|---|---|
| `scheme` | `'dark' \| 'light'` | which ground this theme is built for — pick a scrim or a shadow from it |
| `bg` · `bgDeep` · `paper` · `surface` | `string` | the ground; deeper for space and 3D; the light ground; one step off it for plates |
| `ink` · `body` · `muted` | `string` | display, body and secondary type **on a dark ground** |
| `paperInk` · `paperMuted` | `string` | the same two **on `paper`** |
| `accent` · `accentInk` · `accentOnPaper` | `string` | the brand colour, type that sits on it, and the version that holds contrast on paper |
| `pair` | `string` | the accent's semantic partner — before/after, gain/loss. Never a second warm |
| `series` | `readonly string[]` | an ordered categorical palette. Index into it; never pick by eye |
| `display` · `text` · `mono` · `hand` | `string` | CSS families for titles, body, code, hand-lettering |
| `radius` · `stroke` · `roughness` | `number` | corner radius and stroke at 1920×1080; roughness 0 (ruler) to 1 (sketchy) |
| `safe` | `number` | margin at 1920×1080 |

Use a token that is not on this list and no theme can set it. If an effect needs
a third distinct colour, that is `series[2]`, not a new token.

### The house values

A brief that says a prop defaults to `theme.series[2]` is useless without the
array, so here it is in full — this is what `theme` is when nobody passes one:

```ts
const HOUSE = {
  scheme: 'dark',
  bg: '#0a0b10', bgDeep: '#04050a', paper: '#f6f5f2', surface: '#101218',
  ink: '#ffffff', body: '#eef1f7', muted: '#8d93a5',
  paperInk: '#1d1b17', paperMuted: '#4a4e5a',
  accent: '#ff5c39', accentInk: '#04050a', accentOnPaper: '#c2410c',
  pair: '#4cc9f0',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  //         orange     cyan       lime       amber      violet     grey
  display: 'Archivo', text: 'Inter', mono: 'JetBrains Mono', hand: 'Kalam',
  radius: 18, stroke: 3, roughness: 0.45, safe: 84,
};
```

The four typeface tokens name families, not the CSS strings
`@remotion/google-fonts` returns — load each with its own `loadFont` and pass
what that gives you.

**Not in the theme, deliberately:** easing curves, spring configs and duration
bands. Those are craft, not brand — no set of guidelines says "our videos use
easeOutQuint" — and they are inlined by name at each use so a reviewer can see
the intent.

### What the theme does not reach

It themes the component's **configurable surface**: prop defaults and the
typeface. Colour literals inside the body — a scrim's alpha, a gradient stop, a
recreated product's own palette — stay where they are, because most of them are
not tokens at all.

The practical consequence: an effect authored on a dark ground can have white
hard-coded in its body, and a **light** theme will not reach it. `meta.ground`
records which grounds an effect was designed for; trust it before pointing a
light theme at a dark-only effect.
