Build a Remotion composition called **BrowserWindowScroll**: a product landing page scrolling inside
browser chrome, tilted in 3D.

**The look**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` (`#0a0b10`) with
  `radial-gradient(ellipse at 50% 30%, ${accentColor}1c 0%, transparent 62%)`.
- A 1420px-wide window, radius 18, `overflow: hidden`, white, with
  `boxShadow: '0 60px 140px rgba(0,0,0,0.6)'`.
- Chrome bar: `#eceef3` with a `#dcdfe8` bottom border, three 16px traffic lights, and a white pill
  URL field at 24px.
- Viewport 800px tall containing four sections: a hero (84px weight 800 headline, 34px sub, an accent
  CTA button whose 30px bold label is white while white still holds 3:1 on `accentColor` (relative
  luminance ≤ 0.3, as the house `#ff5c39` does) and `theme.accentInk` (`#04050a`) above that — a light
  accent such as console's lime `#c6ff3d` makes white type vanish), a feature-card row on `#f4f5f8`
  (three white cards, radius 18, `1px solid #e3e5ec`, each with a 56px tile in `theme.series[1]`,
  `theme.series[2]` and `accentColor` (`#4cc9f0`, `#c6ff3d`, `#ff5c39`)), a dark stat band (`#12141c`,
  132px accent number), and a monospace command CTA in `theme.series[2]`.
- **Give every section an exact height** — `SECTION_H = pageHeight / sections.length` (600px for a
  2400px page) with its content flex-centred inside. `pageHeight` has to be the page's *real* height,
  because the scroll runs to `pageHeight - VIEW_H`. Lay the sections out with padding and let them size
  themselves and you are guessing at that number; guess high and the page scrolls clean off the end of
  the viewport, leaving a blank window.

**The scroll — no scroll container needed**

```tsx
<div style={{height: VIEW_H, overflow: 'hidden', position: 'relative'}}>
  <div style={{translate: `0px ${-scroll}px`}}>
    {sections}
  </div>
</div>
```

The viewport clips, the page inside translates upward. `scroll` interpolates from 0 to
`pageHeight - VIEW_H` over ~4.2s with `Easing.bezier(0.42, 0, 0.28, 1)` — a gentle start and stop, the
way a trackpad scroll actually decelerates.

**The tilt — put `perspective` on the parent**

```tsx
// parent
<AbsoluteFill style={{perspective: 2600, /* … */}}>
  // child
  <div style={{transform: `rotateX(${(1 - enter) * 16 + 5}deg) rotateY(${(1 - enter) * -10 - 3}deg)`}}>
```

`perspective` on the **parent** establishes the vanishing point for its children. Set on the rotated
element itself it does nothing useful, and `rotateX`/`rotateY` collapse into a flat skew with no depth
at all. This is the single most common mistake with CSS 3D.

Note this is the case the transform shorthands cannot express — an order-sensitive multi-rotation
chain — so a `transform` string is correct here. `scale` and `opacity` still go in as shorthands
alongside it. The window settles from a steeper tilt (16°/-10°) to a resting 5°/-3° as it enters.

**The scrollbar**
Derive it, do not fake it: thumb height is `(VIEW_H / pageHeight) * 100` percent of the track, and its
offset is `(scroll / pageHeight) * (VIEW_H - 16)` px. Because both come from the same `scroll` value,
the thumb can never disagree with the page.

**Requirements**
- One self-contained `.tsx` file exporting `BrowserWindowScroll`.
- Props: `url`, `sections` (array of `{kind, title, body?}` where kind is `'hero' | 'cards' | 'stat' | 'cta'`),
  `accentColor`, `backgroundColor`, `pageHeight`.
- Load Inter via `@remotion/google-fonts/Inter`.
- To show a real site instead, record it with Playwright and drop the clip in with `<Video>` from
  `@remotion/media`, keeping this chrome around it.
