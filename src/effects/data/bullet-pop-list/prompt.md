Build a Remotion composition called **BulletPopList** (composition id `bullet-pop-list`): a titled list
whose items fly in one at a time along a drawn spine.

**Fixed slots — this is the one thing that goes wrong**
Lay the rows out as absolutely positioned children at `top: i * ROW_H` inside a container of known
height, and animate each row only **within its own slot**:

```tsx
<div style={{position: 'relative', height: items.length * ROW_H}}>   {/* ROW_H = 148 */}
  {items.map((item, i) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: i * ROW_H, height: ROW_H,
                 translate: `${(p - 1) * travel}px 0px`, opacity: Math.min(1, pop * 1.8)}}>
```

The obvious approach — a flex column that mounts each row as it arrives — makes the block grow as it
fills, so a vertically centred list visibly creeps upward the whole time and every row you have already
placed keeps moving. Reserving the full height up front fixes the layout on frame 0 and lets the items
animate against it.

**The springs**

```tsx
const pop = spring({frame: frame - (startAt + i * stagger), fps,
                    config: {damping: 14, stiffness: 170, mass: 0.7}});
const p = Math.min(1, pop);
```

- Rows slide in from the left with `translate: \`${(p - 1) * travel}px 0px\`` — clamped, because a row
  overshooting horizontally past its slot looks like a glitch.
- The **marker uses the unclamped spring**: `scale: 0.4 + pop * 0.6`. It overshoots slightly more than
  its row does, and that small difference is what makes the marker read as the thing that arrived and
  pulled the text along, rather than the two being one block.
- The note under each item fades on its own short window (`from + 5 → from + 20`), so it trails its row
  instead of arriving with it.

**The spine**
A 3px vertical rule behind the markers at `left: 27`, whose height interpolates from 0 to
`items.length * ROW_H - 80` across the whole stagger. It should only ever be as long as the items that
have landed — a full-length spine drawn up front tells the viewer how many items are coming and kills
the reveal.

**The look**
- 1920×1080, 30fps, 165 frames. Background `#0f1117` with
  `radial-gradient(ellipse at 26% 30%, #1b2130 0%, #0b0d13 66%)`. 150px side padding, vertically centred.
- An accent kicker chip (26px weight 800, `letter-spacing: 0.22em`, dark text on `#ff5c39`, radius 7)
  that slides in from the left, then a title at 92px weight 800 that rises.
- Rows: a 58px marker then the item at 54px weight 700 and a note at 30px in `#8a8f9e`.
- `marker` prop switches between `'dot'` (a circle), `'number'` (radius 14 with the index) and
  `'arrow'` (radius 14 with `→`).

**Requirements**
- One self-contained `.tsx` file exporting `BulletPopList`.
- Props: `kicker`, `title`, `items` (array of `{text, note?}`), `stagger`, `startAt`, `travel`,
  `accentColor`, `backgroundColor`, `paperColor`, `marker`.
- Clamp springs with `Math.min(1, pop)` anywhere you need a 0–1 factor; leave them unclamped where you
  want the overshoot.
- Load Inter via `@remotion/google-fonts/Inter`.
