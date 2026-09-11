Build a Remotion composition called **LightLeakTransition**: three shots joined by film-style light
leaks washing over the cut points.

**Setup**

```bash
npx remotion add @remotion/transitions @remotion/effects
```

`@remotion/effects` needs WebGL2 — `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`,
or `--gl=angle`, or the leak renders black.

**Overlay, not Transition — this is the point**
`<TransitionSeries>` offers two ways to treat a cut:

- `<TransitionSeries.Transition>` plays both scenes **simultaneously**, so it **shortens** the
  composition by its own duration.
- `<TransitionSeries.Overlay>` renders something **on top of** the cut point and **does not change**
  the timeline length at all.

A light leak is an artefact of the film, not a way of getting from shot A to shot B — the cut still
happens underneath it. So it is an Overlay. Three 70-frame shots with two 30-frame overlays is
**210 frames**, not 150.

```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={70} name="Shot A"><Card … /></TransitionSeries.Sequence>
  <TransitionSeries.Overlay durationInFrames={30}><Leak /></TransitionSeries.Overlay>
  <TransitionSeries.Sequence durationInFrames={70} name="Shot B"><Card … /></TransitionSeries.Sequence>
  <TransitionSeries.Overlay durationInFrames={30}><Leak /></TransitionSeries.Overlay>
  <TransitionSeries.Sequence durationInFrames={70} name="Shot C"><Card … /></TransitionSeries.Sequence>
</TransitionSeries>
```

An overlay may not be adjacent to a transition or to another overlay. `offset` shifts it relative to
the cut centre (positive = later).

**The leak**

```tsx
const Leak: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  return (
    <Solid
      width={width}
      height={height}
      effects={[lightLeak({
        progress: interpolate(frame, [0, durationInFrames - 1], [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      })]}
    />
  );
};
```

`<Solid>` from `remotion` is a canvas-backed colour rectangle — effects can be applied to it, which a
plain `<div>` cannot do. Inside the overlay, `useVideoConfig().durationInFrames` reports the
**overlay's** length, so this drives the leak across exactly its own span with no hard-coded numbers.

**The shots**
- 1920×1080, 30fps. Three footage shots (`broll-sunrise`, `broll-earth`, `broll-night`) under a flat
  `rgba(8,7,12,0.42)` dim; a shot without `src` sits on the ground, `theme.bgDeep` (`#04050a`). Each
  carries a DM Serif Display title at 148px slowly scaling 1.05→1 across its own shot, and an
  uppercase Inter caption at 28px, `letter-spacing: 0.3em`, `opacity: 0.6`.

**Requirements**
- One self-contained `.tsx` file exporting `LightLeakTransition`.
- Register at 210 frames.
- Load DM Serif Display and Inter via `@remotion/google-fonts`.
- Give each `<TransitionSeries.Sequence>` a `name` so the Studio timeline reads clearly.
