import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Cinematic Tech Intro
 * Light streaks race in from both sides, collide at the centre, and the wordmark
 * is left behind in the flash. Letter-spacing opening out as the title settles is
 * the detail that makes it feel expensive rather than merely animated.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bgDeep: string;
  readonly pair: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bgDeep: '#04050a',
  pair: '#4cc9f0',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

export const CinematicTechIntro: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'REMOTION',
  subtitle = 'video, written in React',
  accentColor = theme.pair,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();

  const impact = 1.1 * fps; // the frame the streaks meet

  // Streaks: each starts off-screen, races to centre, then overshoots away.
  const streaks = new Array(14).fill(0).map((_, i) => {
    const fromLeft = i % 2 === 0;
    const y = 8 + random(`streak-y-${i}`) * 84;
    const thickness = 1 + random(`streak-t-${i}`) * 3.2;
    const delay = random(`streak-d-${i}`) * 10;
    const speed = 0.6 + random(`streak-s-${i}`) * 0.6;
    const p = interpolate(frame, [delay, delay + impact * speed], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    return {fromLeft, y, thickness, p, len: 18 + random(`streak-l-${i}`) * 30};
  });

  // The flash at impact: bright for two frames, gone in six.
  const flash = interpolate(frame, [impact - 2, impact, impact + 6], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      {/* Vignette floor */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, ${accentColor}22 0%, transparent 62%)`,
        }}
      />

      {streaks.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${s.y}%`,
            height: s.thickness,
            width: `${s.len}%`,
            borderRadius: s.thickness,
            background: s.fromLeft
              ? `linear-gradient(90deg, transparent, ${accentColor})`
              : `linear-gradient(270deg, transparent, ${accentColor})`,
            // Travel from off-screen to just past centre, then keep going.
            left: s.fromLeft ? `${-s.len + s.p * (52 + s.len)}%` : undefined,
            right: s.fromLeft ? undefined : `${-s.len + s.p * (52 + s.len)}%`,
            opacity: interpolate(frame, [impact - 6, impact + 10], [0.9, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily}}>
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 168,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1,
            // Tracking opens out as it settles — the "expensive" detail.
            letterSpacing: interpolate(frame, [impact, impact + 2 * fps], ['0.02em', '0.22em'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            textShadow: `0 0 60px ${accentColor}66`,
            opacity: interpolate(frame, [impact - 3, impact + 4], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            scale: interpolate(frame, [impact, impact + 1.6 * fps], [1.06, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: 'perceptual-scale',
            }),
          }}
        >
          {title}
        </Interactive.Div>

        {/* Hairline that opens outward from the centre under the title. */}
        <div
          style={{
            height: 1,
            marginTop: 30,
            backgroundColor: accentColor,
            width: interpolate(frame, [impact + 6, impact + 1.4 * fps], [0, 620], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: 0.7,
          }}
        />

        <Interactive.Div
          name="Subtitle"
          style={{
            fontSize: 34,
            fontWeight: 300,
            letterSpacing: '0.34em',
            marginRight: '-0.34em',
            textTransform: 'uppercase',
            color: '#8d93a5',
            marginTop: 28,
            opacity: interpolate(frame, [impact + 12, impact + 1.2 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>

      {/* The impact flash, over everything. */}
      <AbsoluteFill style={{backgroundColor: '#ffffff', opacity: flash, pointerEvents: 'none'}} />

      {/* Letterbox bars — cheap, and instantly reads as "cinematic". */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            [i === 0 ? 'top' : 'bottom']: 0,
            height: interpolate(frame, [0, 0.8 * fps], [0, height * 0.075], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            backgroundColor: '#04050a',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
