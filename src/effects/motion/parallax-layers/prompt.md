Build a Remotion composition called **ParallaxLayers** (composition id `parallax-layers`): a camera
tracking across a layered landscape whose ridges separate by depth.

**The one rule**
Define a single camera value, and derive **everything** from each layer's `depth` (0 = infinitely far,
1 = at the camera):

```tsx
const camera = interpolate(frame, [0, durationInFrames], [0, cameraTravel], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.bezier(0.4, 0, 0.35, 1),
});

const shift  = -camera * layer.depth;          // travel
scale:   1 + layer.depth * 0.06,               // near things are bigger
filter:  `blur(${(1 - layer.depth) * 2.6}px)`, // far things are hazier
opacity: 0.55 + layer.depth * 0.45,            // far things wash out
```

Driving travel, scale, blur and haze from the same `depth` number is the whole design. Tune them
independently and a layer ends up looking near in one respect and far in another, which reads as a
mistake even when the viewer cannot say why.

**The layers**
- 1920×1080, 30fps, 210 frames. Sky: `linear-gradient(#12183a 0%, #6b3f74 46%, #e0765b 100%)`.
- Five ridges at depths 0.12 / 0.28 / 0.5 / 0.78 / 1, colours `#4a5a7e`, `#3a4763`, `#2a3349`,
  `#1a1f2e`, `#0d1017`. Each is a silhouette cut with a `clip-path: polygon(...)` built from
  `[x%, height%]` peak pairs plus `100% 100%, 0% 100%` to close the shape along the bottom.
- **Make every layer oversized** — `left: -20%; right: -20%`. Panning a layer that exactly fills the
  frame drags its edge into view; the overscan is what makes the move possible at all.
- A sun (300px `radial-gradient(circle, #ffe9b0 0%, #ffb26b 58%, #ffb26b00 74%)`) and 60 seeded stars
  sit at **depth 0** — they never move, which is exactly right for things at infinity.
- A title at 300px in the display face (Bebas Neue by default), coloured `#ffe9d6` — a tint of the sun,
  part of the scene's palette rather than a theme token — with `letter-spacing: 0.14em`, treated as a
  **foreground** element at depth 0.55: enough that it separates from the nearest ridge, not so much
  that it pans out of frame by the last few seconds. Depth is a dial, and a title is the one layer
  whose legibility outranks its realism.
- A subtitle under the title in the text face (`textFamily = theme.text`, Bebas Neue by default):
  `#ffd9c0`, 32px, letter-spacing `0.36em`, fading to 0.85.

**Requirements**
- One self-contained `.tsx` file exporting `ParallaxLayers`.
- Props: `title`, `subtitle`, `layers` (array of `{depth, color, ridge}`), `skyTop`, `skyBottom`,
  `cameraTravel` (percent of the frame, default 22).
- Use `random(seed)` from `remotion` for the stars, not `Math.random()` — otherwise they redistribute
  on every rendered frame and flicker like static.
- Load Bebas Neue via `@remotion/google-fonts/BebasNeue`.
- `translate` needs units on both components: `` `${shift}% 0px` ``.
