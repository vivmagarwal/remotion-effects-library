Build a Remotion composition called **DeviceRise** (composition id `device-rise`): a phone rising out
of the floor, tilting to face the camera, its screen waking as it arrives.

**The look**
- 1920×1080, 30fps, 120 frames. Background `#0a0b10` with
  `radial-gradient(ellipse at 50% 42%, #ff5c391f 0%, transparent 58%)`.
- The device: 344×706, radius 48, fill `deviceColor` (`theme.paperInk`, `#1d1b17`),
  `2px solid rgba(255,255,255,0.16)`, `boxShadow: '0 60px 120px rgba(0,0,0,0.66)'`. Its screen is an
  inset-12 child at radius 38 with `overflow: hidden`, filled with
  `linear-gradient(150deg, accentColor, theme.series[4])` (`#ff5c39` → `#c77dff`), with the 78px ◐
  glyph white until the brighter screen stop passes luminance 0.5, then `theme.accentInk` (`#04050a`).
- A headline at the top in `displayFamily` (`theme.display`, Inter inline) at 76px weight 700,
  letter-spacing `-0.035em`, and an accent subhead at the bottom (36px weight 600).

**One driver value**

```tsx
const rise = interpolate(frame, [6, 6 + 1.6 * fps], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});

const tilt = interpolate(rise, [0, 1], [26, 4]);       // derived from rise, not from frame
translate: `0px ${(1 - rise) * 620}px`,
opacity: Math.min(1, rise * 2.2),
```

Deriving the tilt from `rise` rather than from `frame` is what makes the device appear to *turn toward
you as it arrives* — one gesture, not two animations that happen to overlap. It also means retiming the
rise retimes the tilt for free.

**`perspective` goes on the parent**
Set `perspective: 2200` on the container `<AbsoluteFill>`, and `transform: rotateX(...)` on the device.
Set on the rotated element itself, `perspective` does nothing and `rotateX` flattens into a vertical
squash with no depth at all. This is the most common CSS-3D mistake.

**The reflection — use a real second copy**

```tsx
<div style={{
  position: 'absolute', left: 0, top: '100%', marginTop: 26,
  transform: `rotateX(${tilt}deg) scaleY(-1)`,
  translate: `0px ${(1 - rise) * 620}px`,
  opacity: Math.min(0.24, rise * 0.24),
  filter: 'blur(7px)',
  maskImage: 'linear-gradient(rgba(0,0,0,0.85), transparent 62%)',
  WebkitMaskImage: 'linear-gradient(rgba(0,0,0,0.85), transparent 62%)',
}}>
  <Device />
</div>
```

Render the **same device component again**, mirrored with `scaleY(-1)`, blurred, faded, and faded out
downward with a `mask-image` gradient — and give it the identical `translate`, so it rises in lockstep.
The usual shortcut is a soft gradient rectangle under the device; it is quicker and it is exactly what
stops the thing reading as an object standing on a surface. A real reflection shows the actual screen
content and moves correctly, so the eye accepts the floor.

Include both `maskImage` and `WebkitMaskImage` — Chrome still wants the prefixed form.

**The screen wake**
Fade the screen's gradient and its content in over `[1.5 * fps, 2.3 * fps]`, *after* the rise has begun.
A device that arrives already lit looks like a picture of a phone; one that wakes on arrival looks like
a device.

**Requirements**
- One self-contained `.tsx` file exporting `DeviceRise`.
- Props: `headline`, `subhead`, `deviceColor`, `screenColors` (a two-colour tuple), `backgroundColor`,
  `accentColor`.
- Load Inter via `@remotion/google-fonts/Inter`.
- Put `transformStyle: 'preserve-3d'` on the wrapper holding the device and its reflection.
- Drop a `<Video>` from `@remotion/media` inside the screen element to show real footage on the device.
