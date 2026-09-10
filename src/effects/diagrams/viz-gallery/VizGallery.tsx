import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  AbsoluteFill,
  Interactive,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {compileEdd, SvgRenderer, whenFontsReady} from 'edododraw';
import {loadFont} from '@remotion/google-fonts/Inter';
import {VIZ_VARIANTS} from './variants.generated';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Viz Gallery
 *
 * One edododraw visualization template, drawn on stroke by stroke. The same file
 * ships as 83 variants — one per template in the package's own catalogue — so
 * the whole library of diagram types is browsable without 83 folders.
 *
 * The frame-driven contract, which is the only interesting part:
 *
 *  - `compileEdd` is pure, synchronous and DOM-free (8-18ms for a dozen nodes),
 *    so it happens ONCE in a `useMemo`.
 *  - `renderer.render(scene)` is 8-30ms and touches the DOM, so it also happens
 *    once, in a `useLayoutEffect` keyed on the scene. Never per frame.
 *  - Per frame we only set `stroke-dasharray`/`stroke-dashoffset` on paths we
 *    measured at mount. That is a total function of the frame — which matters,
 *    because Remotion renders frames out of order and in parallel, so anything
 *    that accumulates gives a different answer depending on which frame a worker
 *    happened to draw first.
 *  - `SvgRenderer` runs with `static: true`, which strips every CSS transition
 *    and the animated-arrow keyframe overlay. Without it a captured frame can
 *    land mid-CSS-transition and two renders of the same frame disagree.
 *
 * The `hand-clean` preset and `nonScalingStroke` are not decoration: rough.js
 * perturbs geometry in world units, so a camera push multiplies the jitter AND
 * the stroke width. Left alone, a diagram that looks fine at 1x looks scratchy
 * the moment anything zooms into it.
 */

type Props = {
  /** Which template this variant is. Informational — `source` is what renders. */
  readonly vizType?: string;
  /** The catalogue group it belongs to, shown as the eyebrow. */
  readonly vizCategory?: string;
  /** edododraw source. Defaults to the first template in the generated catalogue. */
  readonly source?: string;
  /** Frames the whole diagram takes to draw on. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  /** `hand-clean` is the built-for-video preset: pinned corners, one pass. */
  readonly preset?: string;
  /** Screen-space padding left around the fitted diagram, in px. */
  readonly padding?: number;
  readonly backgroundColor?: string;
  readonly accentColor?: string;
};

const FIRST = VIZ_VARIANTS[0].props as {
  vizType: string;
  vizCategory: string;
  source: string;
};

export const VizGallery: React.FC<Props> = ({
  vizType = FIRST.vizType,
  vizCategory = FIRST.vizCategory,
  source = FIRST.source,
  drawFrames = 76,
  startAt = 10,
  preset = 'hand-clean',
  padding = 96,
  backgroundColor = '#f6f5f2',
  accentColor = '#c2410c',
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  // The preset is declared in the source, so prepend it rather than mutating a
  // renderer option — one input, one output, nothing hidden.
  const edd = useMemo(
    () => (/\bmeta\s*\{/.test(source) ? source : `meta { style: ${preset} }\n${source}`),
    [source, preset],
  );

  /**
   * Compile once, and keep the diagnostics rather than throwing them away.
   *
   * A `viz` whose generator is not registered does not error — it warns and
   * yields an empty scene. That renders a perfectly clean blank frame, which is
   * the single worst failure mode there is: nothing to see, nothing in the
   * console, and every gate green. So the failure is drawn on screen instead.
   */
  const {scene, problems} = useMemo(() => {
    const {scene: s, diagnostics} = compileEdd(edd);
    const items = (diagnostics?.items ?? []) as {severity?: string; code?: string; message?: string}[];
    const msgs = items
      .filter((d) => d.severity === 'error' || d.severity === 'warning')
      .map((d) => `${d.severity}${d.code ? ` ${d.code}` : ''}: ${d.message ?? ''}`);
    const empty = (s?.nodes?.length ?? 0) === 0;
    if (empty) {
      msgs.unshift(
        `compiled to 0 nodes — is the "${vizType}" viz generator registered? ` +
          'A bundler that drops side-effect-only modules will strip the registrations.',
      );
    }
    return {scene: s, problems: msgs};
  }, [edd, vizType]);

  const hostRef = useRef<HTMLDivElement>(null);
  /**
   * Measured once at mount, per DRAWABLE GROUP rather than per path.
   *
   * A group is one node, edge or viz item. Driving the dash per path but the
   * opacity per group is what makes the whole element appear to be drawn: a
   * filled shape's fill polygon carries no stroke, so a dash on the outline
   * alone leaves every box visible from frame 0 and only the labels reveal —
   * which reads as text typing in, not as a diagram being drawn.
   */
  const groups = useRef<
    {g: SVGElement; paths: {el: SVGGeometryElement; len: number}[]; len: number; from: number}[]
  >([]);
  const totalLen = useRef(0);
  const [handle] = useState(() => delayRender('edododraw fonts'));

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new SvgRenderer(host, {static: true, nonScalingStroke: true});
    renderer.mount();
    renderer.render(scene);
    renderer.measure?.();

    // Fit the diagram to the frame ONCE. Every template lays out at whatever
    // size its content needs, so without this a four-item flowchart sits small
    // in the top-left while a 25-element architecture diagram runs off the edge,
    // and across 83 cards that inconsistency is the first thing you notice.
    //
    // Done with the SVG's own `viewBox` rather than with edododraw's camera. The
    // camera works in world coordinates and has to be told the viewport; a
    // viewBox is measured in the SVG's own user space by `getBBox()`, so it
    // cannot be in the wrong coordinate system, and `preserveAspectRatio` does
    // the centring. This is the one-shot version of the same maths the recipe
    // uses for an animated camera.
    const svg = host.querySelector('svg');
    const world = host.querySelector<SVGGElement>('.edd-world') ?? svg?.querySelector('g');
    if (svg && world) {
      const b = world.getBBox();
      if (b.width > 0 && b.height > 0) {
        svg.setAttribute(
          'viewBox',
          `${b.x - padding} ${b.y - padding} ${b.width + padding * 2} ${b.height + padding * 2}`,
        );
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
    }

    // Document order, which the dagre layout already puts in reading order.
    const els = [
      ...host.querySelectorAll<SVGElement>('[data-node], [data-edge], [data-viz-item]'),
    ];

    let acc = 0;
    groups.current = els.map((g) => {
      const paths = [
        ...g.querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon, ellipse, rect, circle'),
      ]
        .filter((el) => (el.getAttribute('stroke') ?? 'none') !== 'none')
        .map((el) => ({el, len: el.getTotalLength ? el.getTotalLength() : 0}));
      // A group with no stroked path still needs a slot, or it pops in at once.
      const len = paths.reduce((n, x) => n + x.len, 0) || 120;
      const from = acc;
      acc += len;
      return {g, paths, len, from};
    });
    totalLen.current = acc || 1;

    whenFontsReady()
      .then(() => continueRender(handle))
      .catch(cancelRender);

    return () => {
      renderer.destroy();
      groups.current = [];
    };
  }, [scene, handle, width, height, padding]);

  const drawn = interpolate(frame, [startAt, startAt + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  useLayoutEffect(() => {
    const reached = drawn * totalLen.current;
    for (const grp of groups.current) {
      // How far the shared cursor has moved through THIS group.
      const p = Math.min(1, Math.max(0, (reached - grp.from) / grp.len));

      // The group fades over the first 35% of its own share, so a filled shape
      // arrives with its outline instead of being there before it.
      grp.g.style.opacity = String(Math.min(1, p / 0.35));

      // Labels wait until the outline is 70% done. A label that arrives with the
      // first pixel of its box reads as a screenshot.
      for (const t of grp.g.querySelectorAll<SVGElement>('text')) {
        t.style.opacity = String(p >= 0.7 ? 1 : 0);
      }

      // Dash every stroked path — including the finished ones. Skip those and a
      // frame drawn after a later frame keeps a stale dash, which only shows up
      // in a parallel render.
      let within = reached - grp.from;
      for (const x of grp.paths) {
        if (x.len === 0) continue;
        const q = Math.min(1, Math.max(0, within / x.len));
        x.el.style.strokeDasharray = `${x.len}`;
        x.el.style.strokeDashoffset = `${x.len * (1 - q)}`;
        within -= x.len;
      }
    }
  }, [drawn]);

  const chrome = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <div
        ref={hostRef}
        style={{position: 'absolute', left: 0, top: 88, right: 0, bottom: 96}}
      />

      {problems.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 84,
            right: 84,
            top: 150,
            padding: '28px 32px',
            borderRadius: 14,
            border: `2px solid ${accentColor}`,
            backgroundColor: 'rgba(194, 65, 12, 0.06)',
            color: '#1d1b17',
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          <div style={{fontWeight: 800, marginBottom: 10, color: accentColor}}>
            This diagram did not compile
          </div>
          {problems.slice(0, 4).map((m) => (
            <div key={m} style={{marginTop: 6}}>
              {m}
            </div>
          ))}
        </div>
      ) : null}

      <Interactive.Div
        name="Eyebrow"
        style={{
          position: 'absolute',
          left: 84,
          top: 60,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: accentColor,
          opacity: chrome,
        }}
      >
        {vizCategory}
      </Interactive.Div>

      <Interactive.Div
        name="Type"
        style={{
          position: 'absolute',
          right: 84,
          top: 54,
          fontSize: 34,
          fontWeight: 500,
          color: '#4a4e5a',
          opacity: chrome,
        }}
      >
        viz {vizType}
      </Interactive.Div>

      {/* Draw-on progress, so the check frame is unambiguous about being mid-flight. */}
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 56,
          height: 5,
          borderRadius: 3,
          backgroundColor: 'rgba(29, 27, 23, 0.12)',
          opacity: chrome,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${drawn * 100}%`,
            borderRadius: 3,
            backgroundColor: accentColor,
          }}
        />
      </div>

      {/* A tail hold, so the finished diagram is what a poster catches. */}
      <div style={{display: 'none'}}>{durationInFrames}</div>
    </AbsoluteFill>
  );
};
