import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '600', '800'], subsets: ['latin']});

/**
 * Lower Third
 * The broadcast name plate. A slanted accent bar flies in, the plate unrolls out
 * of it, name and title slide out from behind, it holds, then everything retracts
 * back the way it came. Reversing the entrance rather than fading out is what
 * makes it feel like one mechanism instead of two animations.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly text: string;
  readonly accent: string;
  readonly accentInk: string;
  readonly bg: string;
  readonly bgDeep: string;
  readonly ink: string;
  readonly radius: number;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  text: fontFamily,
  accent: '#ff5c39',
  accentInk: '#04050a',
  bg: '#0a0b10',
  bgDeep: '#04050a',
  ink: '#ffffff',
  radius: 18,
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly name?: string;
  readonly title?: string;
  readonly kicker?: string;
  readonly accentColor?: string;
  readonly plateColor?: string;
  readonly textColor?: string;
  /** Frames the plate stays fully open. */
  readonly holdFrames?: number;
  readonly enterFrames?: number;
  /** Bottom-left corner offset. */
  readonly x?: number;
  readonly y?: number;
  readonly skew?: number;
  /**
   * Footage under the plate. A lower third is never seen on black in the wild,
   * and judging one on black is how you ship a plate that has too little
   * contrast against the shot it will actually sit on. Set to null for a
   * transparent overlay render.
   */
  readonly src?: string | null;
  readonly transparent?: boolean;
};

export const LowerThird: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  name = 'Ada Lovelace',
  title = 'Principal Engineer · Analytical Systems',
  kicker = 'LIVE',
  accentColor = theme.accent,
  plateColor = theme.bg,
  textColor = theme.ink,
  holdFrames = 80,
  enterFrames = 26,
  x = 140,
  y = 190,
  skew = -12,
  src = staticFile('footage/interview-raw.mp4'),
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // The plate opens, holds for `holdFrames`, then retracts — clamped so a long
  // hold cannot push the retraction past the end of the composition, which is
  // what it silently did before: the exit was `durationInFrames - enterFrames`
  // and `holdFrames` was accepted and ignored.
  const exitStart = Math.min(enterFrames + holdFrames, durationInFrames - enterFrames);

  // One 0→1 "open" value, run forwards on the way in and backwards on the way
  // out. Every layer below reads from it, so the retract is the entrance in
  // reverse rather than a separate fade — which is what makes it read as one
  // physical mechanism.
  const open = Math.min(
    interpolate(frame, [0, enterFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    interpolate(frame, [exitStart, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.7, 0, 0.84, 0),
    }),
  );

  // The bar leads; the plate follows it out; the text follows the plate.
  const stage = (delay: number) =>
    Math.max(0, Math.min(1, (open - delay) / (1 - delay)));

  const bar = stage(0);
  const plate = stage(0.3);
  const text = stage(0.55);

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : theme.bgDeep,
        backgroundImage:
          transparent || src
            ? undefined
            : 'radial-gradient(ellipse at 30% 80%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      {src && !transparent ? (
        <AbsoluteFill>
          {/* objectFit is a prop on <Video>, not a style: it draws to a canvas. */}
          <Video src={src} objectFit="cover" muted loop style={{width: '100%', height: '100%'}} />
          {/* A scrim only under the plate. A lower third must not dim the shot —
              that is the one thing a broadcast operator will not forgive. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 520,
              backgroundImage:
                'linear-gradient(to top, rgba(4,5,10,0.7) 0%, rgba(4,5,10,0.3) 46%, rgba(4,5,10,0) 100%)',
            }}
          />
        </AbsoluteFill>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x,
          bottom: y,
          display: 'flex',
          alignItems: 'stretch',
          height: 148,
          // The whole assembly is skewed, so the bar and plate share one edge.
          transform: `skewX(${skew}deg)`,
        }}
      >
        {/* Accent bar — arrives first, stays the anchor. */}
        <div
          style={{
            width: 22,
            backgroundColor: accentColor,
            transformOrigin: 'bottom left',
            scale: `1 ${bar}`,
          }}
        />

        {/* Plate — unrolls horizontally out of the bar. */}
        <div
          style={{
            backgroundColor: plateColor,
            overflow: 'hidden',
            transformOrigin: 'left center',
            scale: `${plate} 1`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Counter-skew, so the type stands upright inside a slanted plate. */}
          <div
            style={{
              transform: `skewX(${-skew}deg)`,
              padding: '0 54px 0 42px',
              // Text slides out from behind the bar as the plate opens.
              translate: `${(text - 1) * 90}px 0px`,
              opacity: text,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8}}>
              {kicker ? (
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    color: theme.accentInk,
                    backgroundColor: accentColor,
                    padding: '5px 12px',
                    borderRadius: (theme.radius * 5) / 18,
                  }}
                >
                  {kicker}
                </span>
              ) : null}
              <span style={{fontSize: 52, fontWeight: 800, color: textColor, letterSpacing: '-0.02em'}}>
                {name}
              </span>
            </div>
            <div style={{fontSize: 26, fontWeight: 500, color: theme.muted, letterSpacing: '0.01em'}}>
              {title}
            </div>
          </div>
        </div>
      </div>

      {/* A thin rule that draws under the plate once it is fully open. */}
      <div
        style={{
          position: 'absolute',
          left: x,
          bottom: y - 14,
          height: theme.stroke,
          backgroundColor: accentColor,
          width: interpolate(text, [0, 1], [0, 620], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};
