import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Mask Reveal Kit
 * Six reveals, all from one mechanism: a CSS `mask-image` gradient whose stops
 * are a function of progress. Where the gradient is opaque the layer shows;
 * where it is transparent the layer is cut away. Change the gradient, change the
 * reveal — no extra elements, and it works over any content.
 */

export type MaskPattern =
  | 'wipe'
  | 'softWipe'
  | 'diagonalStripes'
  | 'iris'
  | 'barnDoor'
  | 'stairStep';

/**
 * The whole kit. `p` is 0 (hidden) → 1 (fully revealed).
 * Each returns a value for BOTH `maskImage` and `WebkitMaskImage`.
 */
export const maskFor = (pattern: MaskPattern, p: number): string => {
  const pct = p * 100;
  switch (pattern) {
    // A hard edge travelling across. `calc` keeps the two stops locked together.
    case 'wipe':
      return `linear-gradient(90deg, black ${pct}%, transparent ${pct}%)`;

    // The same edge, feathered — 12% of softness reads as a light wipe.
    case 'softWipe':
      return `linear-gradient(90deg, black ${pct - 12}%, transparent ${pct + 4}%)`;

    // Bands that WIDEN rather than travel: the picture fills in between the
    // stripes instead of sliding under them.
    case 'diagonalStripes':
      return `repeating-linear-gradient(48deg, black 0 ${p * 86}px, transparent ${p * 86}px 86px)`;

    // A circle opening from the centre. 72% is the reference length for a
    // radial mask, so it must exceed 100% to reach the corners.
    case 'iris':
      return `radial-gradient(circle at 50% 50%, black ${p * 78}%, transparent ${p * 78 + 6}%)`;

    // Two edges opening outward from the middle.
    case 'barnDoor':
      return `linear-gradient(90deg, transparent ${50 - pct / 2}%, black ${50 - pct / 2}%, black ${50 + pct / 2}%, transparent ${50 + pct / 2}%)`;

    // Horizontal bands, each offset a little further than the last, so the
    // reveal walks down the frame as well as across it.
    case 'stairStep': {
      const bands = 9;
      const stops: string[] = [];
      for (let i = 0; i < bands; i++) {
        const lag = i / bands;
        const local = Math.min(1, Math.max(0, (p - lag * 0.5) / 0.5));
        const from = (i / bands) * 100;
        const to = ((i + 1) / bands) * 100;
        stops.push(
          `linear-gradient(90deg, black ${local * 100}%, transparent ${local * 100}%) 0 ${from}% / 100% ${to - from}% no-repeat`,
        );
      }
      return stops.join(', ');
    }
  }
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly mono: string;
  readonly display: string;
  readonly ink: string;
  readonly text: string;
  readonly bg: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  display: fontFamily,
  ink: '#ffffff',
  text: fontFamily,
  bg: '#0a0b10',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the pattern name. Defaults to this file's own loaded face, or the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  readonly patterns?: readonly MaskPattern[];
  /** Frames each reveal takes. */
  readonly revealFrames?: number;
  /** Frames a completed reveal is held. */
  readonly holdFrames?: number;
  readonly startAt?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

export const MaskRevealKit: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  src,
  patterns = ['wipe', 'softWipe', 'diagonalStripes', 'iris', 'barnDoor', 'stairStep'],
  revealFrames = 30,
  holdFrames = 22,
  startAt = 16,
  accentColor = theme.series[2],
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();

  const cycle = revealFrames + holdFrames;
  const elapsed = Math.max(0, frame - startAt);
  const index = Math.floor(elapsed / cycle) % patterns.length;
  const pattern = patterns[index];

  const p = interpolate(elapsed % cycle, [0, revealFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const mask = maskFor(pattern, p);
  const isMultiLayer = pattern === 'stairStep';

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      {/* The under-layer: what shows through where the mask cuts away. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(48deg, rgba(255,255,255,0.05) 0 12px, transparent 12px 24px)',
        }}
      />

      {/* The masked layer. Both the standard and -webkit- properties are needed;
          Chrome still wants the prefixed form. */}
      <AbsoluteFill
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          // A multi-layer mask needs its per-layer size/position honoured.
          ...(isMultiLayer
            ? {maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat'}
            : {maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}),
        }}
      >
        <CanvasImage
          src={src ?? staticFile('plate-1.svg')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* HUD */}
      <AbsoluteFill style={{justifyContent: 'space-between', padding: '70px 84px', pointerEvents: 'none'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <Interactive.Div
            name="Title"
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '0.26em',
              marginRight: '-0.26em',
              color: accentColor,
              textShadow: '0 2px 16px rgba(0,0,0,0.85)',
            }}
          >
            MASK REVEALS
          </Interactive.Div>
          <Interactive.Div
            name="Index"
            style={{
              fontFamily: theme.mono,
              fontSize: 30,
              color: accentColor,
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 2px 16px rgba(0,0,0,0.85)',
            }}
          >
            {String(index + 1).padStart(2, '0')} / {String(patterns.length).padStart(2, '0')}
          </Interactive.Div>
        </div>

        <div>
          <Interactive.Div
            name="Pattern"
            style={{
              fontFamily: displayFamily,
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: theme.ink,
              textShadow: '0 6px 34px rgba(0,0,0,0.9)',
            }}
          >
            {pattern}
          </Interactive.Div>
          <div style={{height: 5, backgroundColor: '#ffffff26', borderRadius: 3, marginTop: 22}}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                backgroundColor: accentColor,
                width: `${p * 100}%`,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
