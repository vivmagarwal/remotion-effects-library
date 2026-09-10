import type {Concept, Tag} from './tags';

/**
 * The shared contract every effect in this library implements.
 *
 * One folder per effect:
 *   src/effects/<category>/<id>/
 *     ├── <Component>.tsx   the effect itself — a single, copy-pasteable file
 *     ├── meta.ts           this metadata
 *     └── prompt.md         a self-sufficient prompt that regenerates the effect
 */

/**
 * The subject axis, and the only axis the folder tree encodes. Technology is a
 * separate facet the gallery already filters on (`meta.packages`), which is why
 * there is no `webgl` or `svg` category here and why `three-d` means real
 * three.js rather than "looks three-dimensional".
 *
 * The order of this union is the display order in the gallery and the README:
 * it runs from working on real footage, through the layers you put over it, to
 * the things you build from nothing, and ends with documentation.
 *
 * `src/gallery/categories.ts` is the single source for the labels and that
 * order; `scripts/lib/taxonomy.mjs` mirrors it for Node and `check:taxonomy`
 * keeps the three in step.
 */
export type Category =
  /** Real footage: punch-ins, speed ramps, cuts, reframing, PiP, split screen. */
  | 'edit'
  /** Colour & texture: grades, grain, halation, letterbox, keying, region blur. */
  | 'grade'
  /** Captions & subtitles: word-timing captions, caption styles, safe areas. */
  | 'captions'
  /** Sound & music: SFX racks, ducking, beat sync, waveforms, audiograms. */
  | 'sound'
  /** Every reveal-by-geometry and cut treatment. */
  | 'transitions'
  /** Text & type: kinetic typography, display type, type over media. */
  | 'type'
  /** Titles & lower thirds: openers, chapter cards, name plates, end cards. */
  | 'titles'
  /** Diagrams & sketches: draw-on, annotation, flow, process, lists. */
  | 'diagrams'
  /** Data & charts. */
  | 'charts'
  /** UI & product: product mockups, assistant UIs, browser and device frames. */
  | 'ui'
  /** Social & shorts: 9:16 formats, subscribe, chat threads, hype captions. */
  | 'social'
  /** Motion & physics: parallax, particles, orbits, morphs, physics. */
  | 'motion'
  /** Ambient grounds. */
  | 'backgrounds'
  /** Visual FX: halftone, VHS, metaball, dissolve, shaders. */
  | 'looks'
  /** Real three.js only. */
  | 'three-d'
  /** Catalogues and samplers, flagged as documentation rather than as shots. */
  | 'reference';

/**
 * How much you have to understand before the effect will behave.
 *
 * Calibrated against this rubric rather than against how impressive the output
 * looks — the two are close to unrelated, and rating by output is how a
 * fifteen-plate WebGL contact sheet ended up marked `starter` while a single
 * `TransitionPresentation` object was marked `advanced`.
 *
 * - `starter`      One mechanism, and the only thing to get wrong is the timing.
 *                  No package beyond `remotion` and a webfont, and no maths past
 *                  `interpolate`, `spring` and some trigonometry.
 * - `intermediate` Two or three mechanisms that have to agree with each other —
 *                  a schedule derived from content, a layout that must not
 *                  reflow, an SVG filter chain, an effects array whose ORDER is
 *                  load-bearing — or one third-party library used exactly the
 *                  way its docs describe.
 * - `advanced`     A library that has to be driven deterministically or read at
 *                  render time (d3 layouts, three.js, audio data), custom maths
 *                  (projections, curves, shaders, occlusion), or a state machine
 *                  that spans the whole composition. Getting these wrong usually
 *                  renders — it just renders differently on every frame.
 */
export type Difficulty = 'starter' | 'intermediate' | 'advanced';

export type EffectMeta = {
  /** kebab-case, unique across the library. Also the Remotion composition id. */
  readonly id: string;
  /** Human name used everywhere — in the gallery, in conversation, in prompts. */
  readonly name: string;
  readonly category: Category;
  /** One line, 42–79 characters, sentence case, ending in a period. Shown on the card. */
  readonly tagline: string;
  /** A paragraph: what it looks like, and the ONE decision that makes it work. */
  readonly description: string;
  /** Search keywords, 4–7, drawn from `TAGS` in `src/tags.ts`. */
  readonly tags: readonly Tag[];
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly durationInFrames: number;
  /** npm packages the copy-pasted file needs, beyond react. */
  readonly packages: readonly string[];
  readonly difficulty: Difficulty;
  /**
   * Techniques demonstrated, 3–5, drawn from `CONCEPTS` in `src/tags.ts` — used
   * for the "learn by concept" index. A closed list is the point: a concept
   * naming one effect indexes nothing.
   */
  readonly concepts: readonly Concept[];
  /**
   * The single frame that best shows the effect working — used as the gallery
   * poster and as the frame the prompt tells an agent to check. Must be a moment
   * where the effect is mid-flight, not after everything has settled: a frame
   * taken once the animation is over proves nothing, and a static component
   * would pass it.
   */
  readonly checkFrame: number;
  /**
   * The frame the gallery uses as the card's poster. Defaults to `checkFrame`.
   * Set it only where the two genuinely differ: `checkFrame` has to prove the
   * effect is moving, a poster has to look like the finished thing, and for a
   * fast entrance those are different moments.
   */
  readonly posterFrame?: number;
  /** What real assets the effect needs. Lets the gallery filter and the gates reason about black frames. */
  readonly requires?: readonly ('video' | 'audio' | 'image' | 'transcript')[];
  /** How the effect's ground behaves in a light gallery. Default 'dark'. */
  readonly ground?: 'dark' | 'light' | 'both' | 'transparent';
  /** Who this is for — every adopted catalogue is organised by audience, not only technique. */
  readonly audience?: readonly (
    | 'youtuber'
    | 'saas'
    | 'educator'
    | 'data'
    | 'agency'
    | 'developer'
    | 'podcaster'
  )[];
  /** How any third-party library inside is driven. 'pure' | 'seek' | 'step' | 'baked'. Omit if none. */
  readonly driveMode?: 'pure' | 'seek' | 'step' | 'baked';
  /**
   * Named prop sets this same component also ships as.
   *
   * Some things here are a FAMILY, not an effect: fourteen caption styles, a
   * dozen lower thirds, twenty transition presentations, eighty-three diagram
   * templates. Eighty-three folders would be absurd, and one card that hides
   * eighty-two looks is not a demo of them. So a variant becomes its own
   * `<Composition>` (`<id>--<variantId>`) and its own gallery card, grouped
   * under the parent, while the code stays in one file.
   *
   * The base `meta` is variant zero — do not repeat it here. Use this only for
   * prop values: if the component has to BRANCH on which variant it is beyond
   * reading a prop, they are two effects.
   */
  readonly variants?: readonly {
    /** kebab-case, unique within this effect. */
    readonly id: string;
    readonly name: string;
    /** Falls back to the effect's own tagline. */
    readonly tagline?: string;
    readonly props: Readonly<Record<string, unknown>>;
    readonly checkFrame?: number;
    readonly posterFrame?: number;
  }[];
  /** Optional: credit for an idea sourced from the Remotion showcase or elsewhere. */
  readonly credit?: {readonly label: string; readonly url?: string};
};

export type EffectEntry = {
  readonly meta: EffectMeta;
  readonly Component: React.ComponentType;
  /** Path of the component file, relative to src/effects. */
  readonly file: string;
  /**
   * Set on entries expanded from `meta.variants`. The id of the effect they came
   * from, so the gallery can group a family under one heading and the prompt can
   * point at one brief rather than eighty-three.
   */
  readonly parentId?: string;
  /** The variant's prop values, passed as the composition's `defaultProps`. */
  readonly variantProps?: Readonly<Record<string, unknown>>;
};
