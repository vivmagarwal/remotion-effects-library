Build a Remotion composition called **VersusTable** (composition id `versus-table`): a two-column
comparison whose rows arrive from opposite edges, interleaved.

**Interleave the stagger — this is the whole idea**

```tsx
const order = i * 2 + (isLeft ? 0 : 1);
const from = startAt + order * stagger;      // stagger ≈ 11
```

Left row 1, right row 1, left row 2, right row 2 — the eye is pulled *across* each pair as it lands.
The obvious alternative, staggering each column independently, means the viewer reads all the way down
one side before the other column exists, which is precisely the opposite of what a comparison slide is
for. Same rows, same timing budget, completely different read.

**Everything else follows from the sides**
- Each column enters from its own edge: `translate: \`${(p - 1) * (isLeft ? -70 : 70)}px 0px\``.
- Rows sit at **fixed absolute slots** (`top: i * ROW_H`, `ROW_H = 116`) inside a container of known
  height, and animate only within them — otherwise the block grows as it fills and the whole table
  creeps up the frame.
- The **losing column's rows land already struck through** — `textDecoration: 'line-through'` with
  `textDecorationColor` and `textDecorationThickness: theme.stroke`, at `opacity: 0.72`. Striking them
  *after* they arrive costs a beat and makes the slide feel like it is correcting itself; striking them
  on arrival delivers the verdict with the row.
- Each column carries its own colour (`theme.accent` losing, `theme.pair` winning — the theme's
  semantic pair) used on its heading rule,
  its row tint (`${color}14`), its row border (`${color}33`) and its ✓/✕ marks. One colour per side,
  applied everywhere, is what makes the two halves legible at a glance.

**The VS badge**
A 92px circle in `paperColor` with `VS` in `backgroundColor`, centred between the columns on
`spring({damping: 11, stiffness: 190, mass: 0.6})`,
clamped to `Math.min(1.12, badge)` — enough overshoot to feel like an impact, not so much that it
wobbles. Give it `zIndex: 5`; it sits over both columns.

**The look**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` under a scrim picked by `theme.scheme`: dark
  `rgba(255,255,255,0.055) -> rgba(0,0,0,0.42) at 68%`, light
  `rgba(255,255,255,0.5) -> rgba(0,0,0,0.06) at 68%`. 120px side padding, vertically centred.
- A centred tracked kicker at 26px weight 800 (with a matching negative right margin), then a title at
  68px weight 800 in `displayFamily` (default `theme.display`).
- Column headings at 46px weight 800 with a 44px ✓/✕ chip and a `${theme.stroke}px solid` bottom rule
  in the column's colour. Headings slide in from their own side.
- Rows at 40px weight 500 in `theme.body`, radius `theme.radius * 14 / 18` (14 at the house radius),
  110px gap between columns.

**Requirements**
- One self-contained `.tsx` file exporting `VersusTable`.
- Props: `kicker`, `title`, `left` and `right` (each `{heading, rows, color, good}`), `stagger`,
  `startAt`, `backgroundColor`, `paperColor` — the ink for the title, headings and badge:
  `theme.paper` on a dark scheme, `theme.body` on a light one — and `showVersusBadge`.
- Size the row container off `Math.max(left.rows.length, right.rows.length)` so uneven columns still
  line up.
- Clamp springs with `Math.min(1, pop)` for the slide-in; a row overshooting past its slot horizontally
  reads as a glitch.
- Load Inter via `@remotion/google-fonts/Inter`.
