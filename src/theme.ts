/**
 * THE theme.
 *
 * One structure that every effect takes, so a set of videos made with this
 * library looks like it came from one place: grounds, ink, accent, typefaces,
 * corner radius, hand-drawn roughness, safe area.
 *
 * ## How it reaches a component, and why it is a prop
 *
 * Every effect here is ONE self-contained file. Its brief is handed to an agent
 * with an empty directory, so a component may not import a shared tokens
 * module — that is the rule that makes the library copy-pasteable, and it is
 * not negotiable. A React context has the same problem: the provider is an
 * import.
 *
 * So the theme is a **prop with an inline default**:
 *
 * ```tsx
 * type Theme = {bg: string; accent: string; text: string};   // only what this file uses
 * const THEME: Theme = {bg: '#0A0B10', accent: '#FF5C39', text: fontFamily};
 *
 * export const Foo: React.FC<Props> = ({
 *   theme = THEME,
 *   backgroundColor = theme.bg,      // a default parameter may read an earlier one
 *   accentColor = theme.accent,
 * }) => …
 * ```
 *
 * Three properties fall out of that, and all three were required:
 *
 *  - **Standalone.** The file runs with no imports beyond its packages.
 *  - **Consistent.** Pass one object to every composition and they agree.
 *  - **Overridable.** A single prop still wins over the theme, because a
 *    default parameter is only used when the argument is absent.
 *
 * ## Why each file declares its own `Theme` type
 *
 * TypeScript is structural. A file that needs three tokens declares a type with
 * three fields, and the full theme below is still assignable to it. So the
 * shared vocabulary is enforced by NAME, not by a shared import — which is
 * exactly what `check:theme` checks: every token a component declares must be
 * one of these, with this type, and its inline default must be this value.
 *
 * ## Fonts
 *
 * `@remotion/google-fonts` is a static subpath import per family — there is no
 * way to load "whatever family this string names". So a theme carries the CSS
 * family STRING, and whoever builds the theme is responsible for having loaded
 * it. This module loads the families the shipped themes name. A standalone file
 * keeps its own `loadFont` call and puts that family in its inline default; if
 * a theme overrides it, the theme's owner has loaded that one.
 */

import {loadFont as loadArchivo} from '@remotion/google-fonts/Archivo';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrains} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadKalam} from '@remotion/google-fonts/Kalam';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';

const archivo = loadArchivo('normal', {weights: ['400', '700', '800'], subsets: ['latin']}).fontFamily;
const inter = loadInter('normal', {weights: ['400', '500', '700', '800'], subsets: ['latin']}).fontFamily;
const jetbrains = loadJetBrains('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily;
const kalam = loadKalam('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily;
const sora = loadSora('normal', {weights: ['400', '700', '800'], subsets: ['latin']}).fontFamily;
const playfair = loadPlayfair('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily;

/**
 * The full vocabulary. A component declares the subset it uses; this whole
 * object is assignable to any such subset.
 *
 * Deliberately NOT in here: easing curves, spring configs and duration bands.
 * Those are craft, not brand — nobody's guidelines say "our videos use
 * easeOutQuint" — and they live in `src/prompt-kit/house-style.md`, inlined by
 * name at each use so a reviewer can see the intent. Putting them here would
 * double the size of every component's inline default to no one's benefit.
 */
export type Theme = {
  /**
   * Which ground the theme is built for. A component uses it to pick between a
   * scrim and a shadow, or a light and a dark chrome — the two are not
   * interchangeable and neither can be derived from a colour.
   */
  readonly scheme: 'dark' | 'light';

  /* ── grounds ────────────────────────────────────────────────────────── */
  /** The ground almost every effect sits on. */
  readonly bg: string;
  /** Deeper, for space, 3D and particles, where a star needs somewhere dark to be. */
  readonly bgDeep: string;
  /** The light ground, for effects that are designed light rather than inverted. */
  readonly paper: string;
  /** One step off the ground: plates, cards, pills, code blocks. */
  readonly surface: string;

  /* ── ink on a dark ground ───────────────────────────────────────────── */
  /** Display and headline. */
  readonly ink: string;
  /** Body copy, labels, captions. */
  readonly body: string;
  /** Secondary: credits, ticks, footnotes, units. */
  readonly muted: string;

  /* ── ink on paper ───────────────────────────────────────────────────── */
  readonly paperInk: string;
  readonly paperMuted: string;

  /* ── accent ─────────────────────────────────────────────────────────── */
  /** The brand colour. One per effect. */
  readonly accent: string;
  /** Type and marks that sit ON the accent. */
  readonly accentInk: string;
  /** The accent adjusted to hold its contrast on `paper`. */
  readonly accentOnPaper: string;
  /**
   * The accent's semantic partner — before/after, gain/loss, us/them. The house
   * rule is that a second colour is only ever a semantic pair, and never two
   * warms; this is the cool one.
   */
  readonly pair: string;
  /**
   * An ordered categorical palette, for anything that needs N distinct colours:
   * chart series, samplers, legends. Index into it; do not pick from it by eye.
   */
  readonly series: readonly string[];

  /* ── type ───────────────────────────────────────────────────────────── */
  /** CSS family for display type — titles, slams, lock-ups. */
  readonly display: string;
  /** CSS family for body, UI and data. */
  readonly text: string;
  /** CSS family for code and terminals. */
  readonly mono: string;
  /** CSS family for hand-drawn lettering and annotations. */
  readonly hand: string;

  /* ── shape ──────────────────────────────────────────────────────────── */
  /** Base corner radius at 1920×1080. Scale by `height / 1080` elsewhere. */
  readonly radius: number;
  /** Base stroke width at 1920×1080. */
  readonly stroke: number;
  /**
   * 0 is ruler-straight, 1 is sketchy. Drives rough.js through edododraw and
   * `@remotion/rough-notation`. Above ~0.6 two adjacent edges start to read as
   * a mistake rather than as a hand.
   */
  readonly roughness: number;

  /* ── layout ─────────────────────────────────────────────────────────── */
  /** Margin at 1920×1080. */
  readonly safe: number;
};

/**
 * The house theme — the look this library ships, and the value every
 * component's inline default must match.
 */
export const HOUSE: Theme = {
  scheme: 'dark',

  bg: '#0a0b10',
  bgDeep: '#04050a',
  paper: '#f6f5f2',
  surface: '#101218',

  ink: '#ffffff',
  body: '#eef1f7',
  muted: '#8d93a5',

  paperInk: '#1d1b17',
  paperMuted: '#4a4e5a',

  accent: '#ff5c39',
  accentInk: '#04050a',
  accentOnPaper: '#c2410c',
  pair: '#4cc9f0',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],

  display: archivo,
  text: inter,
  mono: jetbrains,
  hand: kalam,

  radius: 18,
  stroke: 3,
  roughness: 0.45,

  safe: 84,
};

/**
 * Alternate themes, shipped so the mechanism is provable rather than asserted.
 * Swap one in and all 181 compositions change together — that is the whole
 * claim, and a claim you cannot demonstrate is a promise.
 */
export const THEMES: Readonly<Record<string, Theme>> = {
  house: HOUSE,

  /**
   * Editorial: paper ground, serif display, ruler-straight.
   *
   * Its paper tokens are its OWN, not the house ones. They used to be inherited
   * from `HOUSE` through the spread, and the consequence was that the one theme
   * built for paper changed nothing at all on a paper-ground effect: the
   * hand-drawn diagram catalogue, the annotation sampler and the product
   * recreations all rendered byte-identical to the house look. A theme that
   * cannot be seen on the ground it is named after is not a theme.
   */
  broadsheet: {
    ...HOUSE,
    scheme: 'light',
    bg: '#faf7f0',
    bgDeep: '#ece7dc',
    surface: '#ffffff',
    paper: '#faf7f0',
    paperInk: '#14120e',
    paperMuted: '#57534e',
    ink: '#14120e',
    body: '#14120e',
    muted: '#57534e',
    accent: '#c2410c',
    accentInk: '#faf7f0',
    accentOnPaper: '#9a3412',
    pair: '#1d4ed8',
    series: ['#c2410c', '#1d4ed8', '#047857', '#a16207', '#7c3aed', '#4a4e5a'],
    display: playfair,
    text: inter,
    radius: 4,
    roughness: 0,
  },

  /** Terminal: near-black, one cold accent, monospace display, hard corners. */
  console: {
    ...HOUSE,
    bg: '#04050a',
    bgDeep: '#000000',
    surface: '#0a0b10',
    accent: '#c6ff3d',
    accentInk: '#04050a',
    accentOnPaper: '#3f6212',
    pair: '#4cc9f0',
    series: ['#c6ff3d', '#4cc9f0', '#ff5c39', '#c77dff', '#ffd166', '#8d93a5'],
    display: jetbrains,
    text: jetbrains,
    radius: 2,
    stroke: 2,
    roughness: 0,
  },

  /** Studio: warm grey, geometric display, softer corners, a light hand. */
  studio: {
    ...HOUSE,
    bg: '#14131a',
    bgDeep: '#0b0a10',
    surface: '#1e1c26',
    accent: '#c77dff',
    accentInk: '#0b0a10',
    accentOnPaper: '#6d28d9',
    pair: '#ffd166',
    series: ['#c77dff', '#ffd166', '#4cc9f0', '#ff5c39', '#c6ff3d', '#8d93a5'],
    display: sora,
    text: sora,
    radius: 28,
    roughness: 0.3,
  },
};

/**
 * The theme as it applies to an effect designed for a particular ground.
 *
 * A light theme cannot sensibly reground an effect whose SUBJECT is light on
 * dark. `galaxy-particles` is 28,000 white points; `infinite-tunnel` is a glow.
 * Put either on paper and you have not restyled it, you have erased it — and no
 * amount of token plumbing fixes white particles on a white ground, because the
 * particles are the content.
 *
 * `meta.ground` already records what each effect was built for, so the policy
 * is: a light theme gives a dark-only effect its accent, typefaces and shape,
 * and leaves the ground and the ink alone.
 *
 * This is a decision for whoever ASSEMBLES a video, not for the component — the
 * theme is data, and which theme suits which shot is editorial. It lives here so
 * the gallery and the Remotion root make the same call.
 */
export const themeFor = (theme: Theme, ground?: string): Theme => {
  if (theme.scheme !== 'light' || ground !== 'dark') return theme;
  return {
    ...theme,
    scheme: 'dark',
    bg: HOUSE.bg,
    bgDeep: HOUSE.bgDeep,
    surface: HOUSE.surface,
    ink: HOUSE.ink,
    body: HOUSE.body,
    muted: HOUSE.muted,
  };
};

export const THEME_NAMES = Object.keys(THEMES) as readonly string[];
