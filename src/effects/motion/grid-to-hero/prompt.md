Build a Remotion composition called **GridToHero** (composition id `grid-to-hero`): a tile
lifts out of a grid, grows into a full-bleed hero, and drops back into exactly the slot it left.

**One function owns the geometry**
This is what makes the return land perfectly instead of approximately:

```tsx
const cellW = (width - padding * 2 - gap * (columns - 1)) / columns;
const cellH = (height - headerH - padding - gap * (rows - 1)) / rows;

const slotOf = (i: number) => ({
  x: padding + (i % columns) * (cellW + gap),
  y: headerH + Math.floor(i / columns) * (cellH + gap),
  w: cellW,
  h: cellH,
});

const hero = {x: padding, y: headerH, w: width - padding * 2, h: height - headerH - padding};
```

Both the tile's resting rectangle **and** the hero animation's start rectangle come from `slotOf(i)`.
The usual failure is laying the grid out with CSS grid or flexbox and then hard-coding a start rect for
the animation: the two drift apart at any other viewport or gap, and the tile visibly snaps a few pixels
on the way home. Compute the slots yourself, position everything absolutely, and there is only one
number to be right.

**The move**

```tsx
const t = isOpen ? open : 0;
const rect = {
  x: slot.x + (hero.x - slot.x) * t,
  y: slot.y + (hero.y - slot.y) * t,
  w: slot.w + (hero.w - slot.w) * t,
  h: slot.h + (hero.h - slot.h) * t,
};
```

Animate `left / top / width / height` — not a transform. The tile's aspect ratio genuinely changes and
`objectFit: 'cover'` re-crops the image as it does, which is what reads as *this object becoming that
one*. A `scale()` would stretch the image, the border and the radius together, and read as a zoom.

**The cycle**

```tsx
const cycle = morphFrames * 2 + holdFrames;               // 18 + 62 + 18
const elapsed = frame - startAt;
const openIndex = Math.floor(elapsed / cycle) % items.length;
const open = interpolate(elapsed % cycle, [0, morphFrames, morphFrames + holdFrames, cycle],
  [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                 easing: Easing.bezier(0.5, 0, 0.2, 1)});
```

A four-point interpolate gives open → hold → close in one expression, and the modulo walks the items
forever with no state.

**Three details that carry it**
- **Promote the open tile with `zIndex: 10`.** It is growing over its neighbours; in DOM order alone it
  would be painted under the tiles that come after it.
- **The other tiles recede rather than vanish**: `scale: 1 - open * 0.04`, `opacity: 1 - open * 0.55`.
  Fading them out completely loses the sense that the hero came from somewhere.
- **Gate the caption on `open`, not on the frame**:
  `opacity: interpolate(open, [0.55, 1], [0, 1], …)`. Tied to the frame, the caption appears while the
  tile is still thumbnail-sized and the text overflows its own box.

**The look**
- 1920×1080, 30fps, 620 frames. Background `#111219`, accent `#ff5c39`. Six items, 3 columns, 26px gap,
  70px padding, 168px header.
- Tiles: radius 18, `overflow: hidden`, `2px solid #262833` — and the accent colour when open.
- Heading top-left at 44px weight 800 `letter-spacing: 0.24em`; a monospace `01 / 06` counter top-right.
- The open tile's caption sits on a `linear-gradient(transparent, rgba(6,6,10,0.86))` scrim: a meta line
  at 24px in the accent, then the title at 76px weight 800.
- Stagger the initial grid build with `interpolate(frame, [i * 4, i * 4 + 22], [0, 1], …)`.

**Requirements**
- One self-contained `.tsx` file exporting `GridToHero`.
- Props: `items` (array of `{src, title, meta}`), `heading`, `columns`, `gap`, `padding`,
  `holdFrames`, `morphFrames`, `startAt`, `accentColor`, `backgroundColor`.
- Use `<CanvasImage>` with `staticFile()`. Take `width`/`height` from `useVideoConfig()` so the slot
  maths adapts to the composition.
- Load Inter via `@remotion/google-fonts/Inter`.
