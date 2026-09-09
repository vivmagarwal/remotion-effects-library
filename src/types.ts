/**
 * The shared contract every effect in this library implements.
 *
 * One folder per effect:
 *   src/effects/<category>/<id>/
 *     ├── <Component>.tsx   the effect itself — a single, copy-pasteable file
 *     ├── meta.ts           this metadata
 *     └── prompt.md         a self-sufficient prompt that regenerates the effect
 */
export type Category =
  | 'text'
  | 'openers'
  | 'transitions'
  | 'effects'
  | 'data'
  | 'motion'
  | 'backgrounds'
  | 'ui'
  | 'media'
  | 'captions'
  | 'three-d'
  | 'audio';

export type Difficulty = 'starter' | 'intermediate' | 'advanced';

export type EffectMeta = {
  /** kebab-case, unique across the library. Also the Remotion composition id. */
  readonly id: string;
  /** Human name used everywhere — in the gallery, in conversation, in prompts. */
  readonly name: string;
  readonly category: Category;
  /** One line. Shown on the card. */
  readonly tagline: string;
  /** A paragraph: what it looks like and how it is built. */
  readonly description: string;
  /** Free-text search keywords. */
  readonly tags: readonly string[];
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly durationInFrames: number;
  /** npm packages the copy-pasted file needs, beyond react. */
  readonly packages: readonly string[];
  readonly difficulty: Difficulty;
  /** Techniques demonstrated — used for the "learn by concept" index. */
  readonly concepts: readonly string[];
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
  /** Optional: credit for an idea sourced from the Remotion showcase or elsewhere. */
  readonly credit?: {readonly label: string; readonly url?: string};
};

export type EffectEntry = {
  readonly meta: EffectMeta;
  readonly Component: React.ComponentType;
  /** Path of the component file, relative to src/effects. */
  readonly file: string;
};
