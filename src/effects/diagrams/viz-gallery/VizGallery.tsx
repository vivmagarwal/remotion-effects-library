import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  AbsoluteFill,
  Interactive,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  cameraForBBox,
  compileEdd,
  FONT_FAMILY,
  getStylePreset,
  registerStylePreset,
  sceneBBox,
  SvgRenderer,
  whenFontsReady,
} from 'edododraw';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/** edododraw's own hand face. It ships embedded in the package, so there is nothing to load. */
const handFamily = FONT_FAMILY.hand;

/**
 * The SVG host's insets, in frame pixels. Declared once because two things read
 * them: the element's own layout, and the viewport handed to `setViewport()`.
 * If those two ever disagree the camera centres on a box the diagram is not in.
 */
const HOST_TOP = 88;
const HOST_BOTTOM = 96;

/**
 * A stroke's length in the units its dash pattern is laid out in.
 *
 * With `vector-effect: non-scaling-stroke` the browser strokes the path in the
 * SVG viewport's pixels, dash pattern included. `getTotalLength()` answers in
 * the path's own user units, so under a camera that fits the diagram at 2x a
 * dash of that length covers half the path on screen, the gap covers the next
 * half, and the pattern repeats: every circle closes halfway round and every
 * connector breaks into pieces — on the finished frame, not just mid-draw.
 * Scaling by the element's CTM is exactly the transform the non-scaling stroke
 * undoes.
 */
const dashLength = (el: SVGGeometryElement): number => {
  const len = el.getTotalLength ? el.getTotalLength() : 0;
  if (el.getAttribute('vector-effect') !== 'non-scaling-stroke') return len;
  const m = el.getCTM();
  return m ? len * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : len;
};

/** One rendered element: its stroked paths, its share of the sweep, and its authored opacity. */
type Part = {
  readonly g: SVGElement;
  /** `dashed`: the stroke carries its OWN dash pattern (a dotted leader, a dashed orbit). */
  readonly paths: {el: SVGGeometryElement; len: number; dashed: boolean}[];
  /** Fill-only shapes inside it — a box's tint, a solid rough fill — with their authored opacity. */
  readonly fills: {el: SVGElement; opacity: number}[];
  readonly len: number;
  readonly from: number;
  /** Text and nothing else — a label, a detail line, a title. */
  readonly text: boolean;
  readonly opacity: number;
};
/** One data item (or one element that belongs to none), drawn as a single stroke of the hand. */
type Unit = {readonly parts: Part[]; readonly len: number; readonly from: number};

/**
 * Viz Gallery
 *
 * One edododraw visualization template, drawn on stroke by stroke. The same file
 * ships as one variant per usable template in the package's own catalogue, so
 * the whole library of diagram types is browsable without a folder for each.
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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly paperMuted: string;
  readonly paperInk: string;
  readonly text: string;
  /** The diagram's lettering — every label, heading and title it draws. */
  readonly hand: string;
  readonly accentOnPaper: string;
  readonly paper: string;
  /** The categorical palette every template colours its items from, in order. */
  readonly paperSeries: readonly string[];
  /** Corner radius at 1920x1080; the diagram's corners scale with it. */
  readonly radius: number;
  /** Stroke width at 1920x1080; the diagram's lines are drawn at this weight. */
  readonly stroke: number;
  /** 0 (ruler) to 1 (sketchy). The wobble rough.js puts into every stroke. */
  readonly roughness: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperMuted: '#4a4e5a',
  paperInk: '#1d1b17',
  text: fontFamily,
  hand: handFamily,
  accentOnPaper: '#c2410c',
  paper: '#f6f5f2',
  // palette: data — the house paper palette, copied verbatim from `paperSeries` in src/theme.ts.
  // Eight hues that each hold 4.5:1 on PAPER, which the six dark-ground accents do not; the gate's
  // ALLOWED list only knows the dark six.
  paperSeries: ['#2f5eb8', '#b1572a', '#2e7d63', '#7a4fb5', '#8f6822', '#1e7991', '#b0405c', '#5c7a2e'],
  radius: 18,
  stroke: 3,
  roughness: 0.45,
};

/**
 * The diagram's look, as an edododraw style preset built from the theme.
 *
 * A preset is the only thing that reaches EVERY template. The viz generators
 * colour their items from the preset's palette and letter them in its fonts —
 * nothing in the source does that, so no amount of source rewriting can theme
 * them. The theme is folded into a copy of `base` and registered under a name
 * derived from the values, which keeps the compile a pure function of one
 * string: the same theme always yields the same name and the same scene.
 *
 * The split is deliberate. The preset keeps its GRAMMAR — pale fills or solid,
 * an outline in the hue or in the ink, hachure or flat — so `preset` still
 * chooses how a diagram is drawn. The theme chooses what it is drawn IN:
 * palette, ink, typeface, corners and wobble. Corners scale against the house
 * radius, so the house theme reproduces `base` exactly.
 */
const themedPreset = (base: string, t: Theme, roughness: number): string => {
  const src = getStylePreset(base);
  if (!src) return base;
  const look = {
    palette: [...t.paperSeries],
    ink: t.paperInk,
    mutedInk: t.paperMuted,
    edge: t.paperMuted,
    background: t.paper,
    emphasis: t.accentOnPaper,
    fonts: {...src.fonts, body: t.hand, heading: t.hand, title: t.hand},
    cornerRadius:
      src.cornerRadius === null ? null : Math.round(((src.cornerRadius * t.radius) / THEME.radius) * 10) / 10,
    roughness,
  };
  // djb2 over the values: a name the DSL accepts, and a different one per theme.
  let h = 5381;
  for (const ch of JSON.stringify(look)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  const name = `${src.name}-t${h.toString(36)}`;
  if (!getStylePreset(name)) registerStylePreset({...src, ...look, name, aliases: []});
  return name;
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
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
  /**
   * How much the strokes wobble, 0 (ruler) to 1 (sketchy). Defaults to the
   * theme's, and this is the one place that token can land: the wobble is
   * generated inside the diagram engine, not by any CSS this file writes.
   *
   * Applied as a `defaults` block rather than by swapping the preset, because
   * every roughness-0 preset edododraw ships is also monochrome — and these are
   * data visualisations, where the palette is what tells two items apart. A
   * theme should be able to straighten the lines without greying the content.
   */
  readonly roughness?: number;
  /**
   * Screen-space padding left around the fitted diagram, in px — across the
   * frame. Down it is 46% of this: see the fit below.
   */
  readonly padding?: number;
  /**
   * How far the fit may enlarge a diagram. A cap is what keeps type comparable
   * from card to card — see the fit below.
   */
  readonly maxZoom?: number;
  readonly backgroundColor?: string;
  readonly accentColor?: string;
};

/**
 * The default diagram, inlined.
 *
 * It used to read `VIZ_VARIANTS[0].props` from `./variants.generated`, which is
 * a RELATIVE import — and this file's whole contract is that it is one
 * self-contained file that runs in a project that has never heard of this
 * repository. In a fresh Remotion project that import is
 * "Cannot find module './variants.generated'", which is the first thing anyone
 * following the brief would see.
 *
 * The generated list is still the source of truth for the 82 gallery variants;
 * it is just referenced from `meta.ts`, which never leaves this repo, rather
 * than from the component, which does.
 */
const FIRST = {
  vizType: 'clouds',
  vizCategory: 'Brainstorming',
  source: `viz clouds "What We Heard" {
  item "Onboarding is confusing" { icon: warning }
  item "Docs are loved" { icon: heart }
  item "Pricing feels fair" { icon: dollar }
  item "Mobile is missed" { icon: phone }
  item "Support is fast" { icon: rocket }
}`,
};

export const VizGallery: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  vizType = FIRST.vizType,
  vizCategory = FIRST.vizCategory,
  source = FIRST.source,
  drawFrames = 76,
  startAt = 10,
  preset = 'hand-clean',
  roughness = theme.roughness,
  padding = 96,
  maxZoom = 1.8,
  backgroundColor = theme.paper,
  accentColor = theme.accentOnPaper,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  // The preset and the roughness are declared in the SOURCE, so the compiled
  // scene is a pure function of one string — one input, one output, nothing
  // hidden in a renderer option. `defaults` is diagram-wide and every viz
  // template follows it, which is why the roughness can be set once here rather
  // than per node. A source that declares its own `meta` keeps its own style:
  // like any explicit prop, it wins over the theme.
  const style = useMemo(() => themedPreset(preset, theme, roughness), [preset, theme, roughness]);
  const edd = useMemo(() => {
    const head = /\bmeta\s*\{/.test(source) ? '' : `meta { style: ${style} }\n`;
    const rough = `defaults { node { roughness: ${roughness} } edge { roughness: ${roughness} } }\n`;
    return `${head}${rough}${source}`;
  }, [source, style, roughness]);

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
   * Measured once at mount: the diagram as a sequence of UNITS, each a list of
   * PARTS. A part is one rendered element (a node or an edge); a unit is one
   * data item — its box, its connector, its icon and its label together — or a
   * single element that belongs to no item. See the measurement below for why.
   */
  const units = useRef<Unit[]>([]);
  const totalLen = useRef(0);
  const [handle] = useState(() => delayRender('edododraw fonts'));

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Line weight, from the theme. `nonScalingStroke` makes every width a SCREEN
    // width, so what is set here is what a viewer sees whatever the camera does.
    // edododraw draws its main lines at about 2 (hand-clean: 1.8) and `stroke` is
    // the weight the theme wants at 1920x1080, so their ratio is the multiplier.
    // `strokeScale` applies it to every stroked mark — outlines, connectors,
    // arrowheads, ticks, icons — because the templates set their own widths for
    // spines and icons, and thickening only the preset's width would leave the
    // connectors as hairlines beside heavy boxes.
    //
    // The fit is computed BEFORE the renderer exists, because it decides how
    // rough the strokes are drawn. rough.js perturbs geometry in world units and
    // the fitted camera is a `scale(zoom)` like any punch-in: a four-item list
    // fits at ~2.5x, so its jitter lands on screen 2.5x larger than the theme's
    // `roughness` means — a notch where every circle closes, a wobble on every
    // box. `roughnessScale = 1/zoom` puts the jitter back in screen units. It is
    // never raised above 1: a large diagram fitted DOWN is allowed to read calmer,
    // not rougher. The camera is fitted once and never moves, so there is nothing
    // to quantise and nothing ever repaints.
    const viewport = {w: width, h: height - HOST_TOP - HOST_BOTTOM};
    // Pad the two axes differently. A 16:9 frame is far wider than these
    // diagrams are: 80 of the 87 templates fit HEIGHT-first, so equal padding
    // spends the scarce axis on margin and shrinks the type — a square diagram
    // fits this band at 0.99x with 96 all round and at 1.14x with 96 across and
    // 44 down. That is 15% more type on almost every card, for margin that only
    // ever sat between the diagram and the eyebrow.
    //
    // The fit is also CAPPED. Every template lays out in its own units, so a
    // fit that always fills the band makes the same 26-unit title render 21px
    // on a tall four-panel SWOT and 65px on a 594x250 value chain — one type
    // scale per card, across a gallery meant to read as one set. Nothing is
    // allowed past `maxZoom`, so a small diagram keeps its air instead.
    const camera = cameraForBBox(sceneBBox(scene), viewport, {
      padX: padding,
      padY: Math.round(padding * 0.46),
      maxZoom,
    });
    const renderer = new SvgRenderer(host, {
      static: true,
      nonScalingStroke: true,
      strokeScale: (theme.stroke / 2) * (height / 1080),
      roughnessScale: Math.min(1, 1 / camera.zoom),
    });
    renderer.mount();
    renderer.render(scene);

    // Hand the ground back to the composition.
    //
    // `render()` ends with `container.style.backgroundColor = scene.meta.background
    // || scene.theme.background`, so the host adopts the DIAGRAM's paper — #fbfaf7
    // for `hand-clean`. The frame around it is this component's `backgroundColor`,
    // which is #f6f5f2, and the two differ by about 2% luminance: a horizontal seam
    // across the band on all 82 cards, faint enough to read as a rendering artefact
    // rather than a bug. Under a theme it stops being faint, because the frame moves
    // to the theme's `paper` and the band does not move at all.
    host.style.backgroundColor = 'transparent';

    // Fit the diagram to the frame ONCE. Every template lays out at whatever
    // size its content needs, so without this a four-item flowchart sits small
    // in the top-left while a 25-element architecture diagram runs off the edge,
    // and across 82 cards that inconsistency is the first thing you notice.
    //
    // `setViewport` is the load-bearing call and it is not optional. The camera
    // is `translate(vw/2, vh/2) scale(zoom) translate(-cx, -cy)`, and the
    // renderer's own `measure()` reads `clientWidth`/`clientHeight` — which
    // Remotion cannot provide during the layout pass, because it mounts the
    // composition inside a 0x0 off-screen wrapper. A `useLayoutEffect` therefore
    // sees 0x0, the viewport is clamped to 1x1, and the camera degenerates to
    // `translate(0.5 0.5)`.
    //
    // That degenerate camera is why an earlier version of this file "worked":
    // it framed with the SVG's own `viewBox`, measured from `world.getBBox()`.
    // A viewBox lives in the space the world group's transform maps INTO, and
    // getBBox reports the space it maps FROM — the two coincide only while the
    // camera is identity. Server-side stills had a 0x0 host and looked perfect;
    // every browser gave the host a real size, the camera picked up a real
    // translate, and all 82 cards rendered off their own viewBox. The gates
    // never saw it, because renderStill is the one environment where the bug
    // cancels out.
    //
    // The host's size is known here without measuring anything: it is the frame
    // minus the two insets this component itself lays out below — `viewport`,
    // computed above for the fit.
    renderer.setViewport(viewport);
    renderer.applyCamera(camera);

    // One stroke per subpath. rough.js writes every side of a box and every
    // curve of a path as its own `M … C` subpath inside one <path>, and a dash
    // pattern RESTARTS at each subpath — so dashing that element grows all four
    // sides of a box at once, from all four corners, and a curved outline
    // appears as a dozen scattered ticks. Splitting a stroke-only path into one
    // element per subpath draws nothing differently on the finished frame (the
    // subpaths were separate strokes already) and lets the sweep take them in
    // order. Fills are left whole: their subpaths define one region together.
    for (const el of host.querySelectorAll<SVGPathElement>('path')) {
      if ((el.getAttribute('stroke') ?? 'none') === 'none') continue;
      if ((el.getAttribute('fill') ?? 'none') !== 'none') continue;
      const pieces = (el.getAttribute('d') ?? '').split(/(?=[Mm])/).filter((x) => x.trim());
      if (pieces.length < 2 || pieces.some((x) => x.startsWith('m'))) continue;
      for (const d of pieces) {
        const piece = el.cloneNode(false) as SVGPathElement;
        piece.setAttribute('d', d);
        el.before(piece);
      }
      el.remove();
    }

    // What draws when.
    //
    // The unit is the data ITEM, not the element. edododraw renders by z-layer —
    // every shape and connector, then every label, then every icon, then the
    // block title — so a sweep in document order draws the whole skeleton empty
    // and pops every word in at the end, title last: at 60% there is no text on
    // screen at all. Each element carries `data-viz-item` when the template
    // emitted it for an item, so the item's parts are gathered into one unit and
    // its label arrives with its own box, the way a hand would write it.
    //
    // Units go in the order the template EMITTED them — `scene.nodes` is that
    // order, which is reading order for every template (root before branches,
    // spine before bones) — except the title, which frames the diagram and so
    // draws first. An edge draws just before the node it points at, so an arrow
    // reaches out and the box it lands on appears at its tip.
    const index = new Map<string, number>();
    scene.nodes.forEach((n, i) => index.set(`node:${n.id}`, i));
    scene.edges.forEach((e, i) => {
      const to = e.to.node ? index.get(`node:${e.to.node}`) : undefined;
      index.set(`edge:${e.id}`, to === undefined ? scene.nodes.length + i : to - 0.5);
    });
    const byKey = new Map<string, {rank: number; parts: {at: number; g: SVGElement}[]}>();
    for (const g of host.querySelectorAll<SVGElement>('[data-node], [data-edge]')) {
      const id = g.getAttribute('data-node') ?? '';
      const at = id ? index.get(`node:${id}`) : index.get(`edge:${g.getAttribute('data-edge') ?? ''}`);
      const pos = at ?? Number.MAX_SAFE_INTEGER;
      const title = g.getAttribute('data-viz-role') === 'title';
      const key = title ? 'title' : (g.getAttribute('data-viz-item') ?? `own:${id || pos}`);
      const unit = byKey.get(key) ?? {rank: title ? -1 : pos, parts: []};
      unit.rank = title ? -1 : Math.min(unit.rank, pos);
      unit.parts.push({at: pos, g});
      byKey.set(key, unit);
    }

    let acc = 0;
    units.current = [...byKey.values()]
      .sort((a, b) => a.rank - b.rank)
      .map((u) => {
        let within = 0;
        const parts = u.parts
          .sort((a, b) => a.at - b.at)
          .map(({g}): Part => {
            const paths = [
              ...g.querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon, ellipse, rect, circle'),
            ]
              .filter((el) => (el.getAttribute('stroke') ?? 'none') !== 'none')
              .map((el) => ({el, len: dashLength(el), dashed: Boolean(el.getAttribute('stroke-dasharray'))}));
            const fills = [...g.querySelectorAll<SVGElement>('path, polygon, ellipse, rect, circle')].filter(
              (el) => (el.getAttribute('stroke') ?? 'none') === 'none' && (el.getAttribute('fill') ?? 'none') !== 'none',
            );
            const text = paths.length === 0 && fills.length === 0 && g.querySelector('text') !== null;
            // A fill-only shape still needs a share of the sweep, or it pops in
            // whole while everything around it draws. Text-only parts take none:
            // they arrive when their unit is 70% drawn.
            const len = paths.reduce((n, x) => n + x.len, 0) || (text ? 0 : 60);
            // edododraw writes an element's AUTHORED opacity onto its group (a
            // faint wash, a ghosted track). The reveal multiplies it; overwriting
            // it would leave every translucent element opaque on the last frame.
            const authored = (el: SVGElement) => {
              const v = Number.parseFloat(el.style.opacity);
              return Number.isFinite(v) ? v : 1;
            };
            const opacity = authored(g);
            const part = {g, paths, fills: fills.map((el) => ({el, opacity: authored(el)})), len, from: within, text, opacity};
            within += len;
            return part;
          });
        // A unit of text alone (the title, a caption) still takes a slot, about
        // the perimeter of a small box, so it is written rather than stamped.
        const len = within || 120;
        const unit = {parts, len, from: acc};
        acc += len;
        return unit;
      });
    totalLen.current = acc || 1;

    whenFontsReady()
      .then(() => continueRender(handle))
      .catch(cancelRender);

    return () => {
      renderer.destroy();
      units.current = [];
    };
  }, [scene, handle, width, height, padding, maxZoom, theme.stroke]);

  // A sweep across a whole diagram, so the one curve the house vocabulary
  // otherwise rules out: a hand does not start at full speed (not linear), and
  // an ease-out draws most of it in the first third and then crawls. The
  // progress bar reads this same value, so the bar and the drawing agree.
  const drawn = interpolate(frame, [startAt, startAt + drawFrames], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  useLayoutEffect(() => {
    const reached = drawn * totalLen.current;
    for (const unit of units.current) {
      // How far the shared cursor has moved through THIS unit, and as a fraction.
      const into = reached - unit.from;
      const p = Math.min(1, Math.max(0, into / unit.len));
      for (const part of unit.parts) {
        // A part with strokes draws over its own share of the unit: its outline
        // at full strength from the first pixel, its fill fading in between a
        // quarter and three quarters of the way round. Fade the whole group
        // instead and a tinted shape arrives as a pale disc ahead of its line.
        const q = part.len > 0 ? Math.min(1, Math.max(0, (into - part.from) / part.len)) : 0;
        const shown = part.text ? (p >= 0.7 ? 1 : 0) : q > 0 ? 1 : 0;
        part.g.style.opacity = String(shown * part.opacity);
        const tint = part.paths.length > 0 ? Math.min(1, Math.max(0, (q - 0.25) / 0.5)) : q;
        for (const f of part.fills) f.el.style.opacity = String(tint * f.opacity);

        // Labels inside a stroked part wait until its outline is 70% done. A
        // label that arrives with the first pixel of its box reads as a
        // screenshot; one that arrives after everything reads as a typo fix.
        if (!part.text) {
          for (const t of part.g.querySelectorAll<SVGElement>('text')) {
            t.style.opacity = String(q >= 0.7 ? 1 : 0);
          }
        }

        // Dash every stroked path — including the finished ones. Skip those and
        // a frame drawn after a later frame keeps a stale dash, which only shows
        // up in a parallel render.
        let within = into - part.from;
        for (const x of part.paths) {
          if (x.len === 0) continue;
          const r = Math.min(1, Math.max(0, within / x.len));
          within -= x.len;
          // A stroke with its own dash pattern cannot be drawn by a dash — the
          // reveal would replace its dashes with one solid line that snaps back
          // to dotted on the last frame. It fades in over its share instead.
          if (x.dashed) {
            x.el.style.opacity = r >= 1 ? '' : String(r);
            continue;
          }
          // A finished stroke carries no dash at all. Leaving `dasharray = len`
          // on it is only correct while `len` is exact, and the finished frame
          // is the one a poster, a thumbnail and every viewer's last look catch.
          if (r >= 1) {
            x.el.style.strokeDasharray = '';
            x.el.style.strokeDashoffset = '';
            continue;
          }
          x.el.style.strokeDasharray = `${x.len} ${x.len}`;
          x.el.style.strokeDashoffset = `${x.len * (1 - r)}`;
        }
      }
    }
  }, [drawn]);

  const chrome = interpolate(frame, [0, 14], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <div
        ref={hostRef}
        style={{position: 'absolute', left: 0, top: HOST_TOP, right: 0, bottom: HOST_BOTTOM}}
      />

      {problems.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 84,
            right: 84,
            top: 150,
            padding: '28px 32px',
            borderRadius: (14 * theme.radius) / THEME.radius,
            border: `${(2 * theme.stroke) / THEME.stroke}px solid ${accentColor}`,
            // The accent at 6%, so the wash follows whatever the accent is
            // rather than staying the house orange.
            backgroundColor: `${accentColor}0f`,
            color: theme.paperInk,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          <div style={{fontWeight: 700, marginBottom: 10, color: accentColor}}>
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
          color: theme.paperMuted,
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
