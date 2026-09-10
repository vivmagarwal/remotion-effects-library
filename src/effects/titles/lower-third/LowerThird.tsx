import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '600', '800'], subsets: ['latin']});

/**
 * Lower Third
 * The broadcast name plate. A slanted accent bar flies in, the plate unrolls out
 * of it, name and title slide out from behind, it holds, then everything retracts
 * back the way it came. Reversing the entrance rather than fading out is what
 * makes it feel like one mechanism instead of two animations.
 */

type Props = {
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
  readonly transparent?: boolean;
};

export const LowerThird: React.FC<Props> = ({
  name = 'Ada Lovelace',
  title = 'Principal Engineer · Analytical Systems',
  kicker = 'LIVE',
  accentColor = '#ff5c39',
  plateColor = '#0a0b10',
  textColor = '#ffffff',
  holdFrames = 80,
  enterFrames = 26,
  x = 140,
  y = 190,
  skew = -12,
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const exitStart = durationInFrames - enterFrames;

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
        backgroundColor: transparent ? 'transparent' : '#04050a',
        backgroundImage: transparent
          ? undefined
          : 'radial-gradient(ellipse at 30% 80%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)',
        fontFamily,
      }}
    >
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
                    color: '#0a0b10',
                    backgroundColor: accentColor,
                    padding: '5px 12px',
                    borderRadius: 5,
                  }}
                >
                  {kicker}
                </span>
              ) : null}
              <span style={{fontSize: 52, fontWeight: 800, color: textColor, letterSpacing: '-0.02em'}}>
                {name}
              </span>
            </div>
            <div style={{fontSize: 26, fontWeight: 500, color: '#8d93a5', letterSpacing: '0.01em'}}>
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
          height: 3,
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
