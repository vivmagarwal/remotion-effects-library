import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Anton';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: display} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Stat Slam
 * One number arrives hard. The impact is built from three things landing on the
 * same frame: the number stops dead from a big scale, a shockwave ring expands
 * out of it, and the whole frame kicks a few pixels. Any one alone is weak.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly paperMuted: string;
  readonly body: string;
  readonly display: string;
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
  readonly ink: string;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperMuted: '#4a4e5a',
  body: '#eef1f7',
  display: display,
  text: sans,
  accent: '#ff5c39',
  bg: '#0a0b10',
  ink: '#ffffff',
  stroke: 3,
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** CSS family for the display face. Defaults to this file's own, or the theme's. */
  readonly displayFamily?: string;
  /** CSS family for the supporting text. Defaults to this file's Inter, or the theme's. */
  readonly textFamily?: string;
  readonly stat?: string;
  readonly context?: string;
  readonly source?: string;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
  readonly impactFrame?: number;
};

export const StatSlam: React.FC<Props> = ({
  theme = THEME,
  displayFamily = theme.display,
  textFamily = theme.text,
  stat = '73%',
  context = 'of viewers drop off in the first 3 seconds',
  source = 'Source: every analytics dashboard, ever',
  backgroundColor = theme.bg,
  color = theme.ink,
  accentColor = theme.accent,
  impactFrame = 14,
}) => {
  const frame = useCurrentFrame();
  const since = frame - impactFrame;

  // The slam: from far too big down to 1, arriving exactly on impactFrame.
  const slam = interpolate(frame, [0, impactFrame], [7, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.9, 0.1, 1),
    output: 'perceptual-scale',
  });

  // A tiny recoil after landing, so it does not just stop.
  const recoil = interpolate(since, [0, 4, 14], [1, 0.972, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Whole-frame camera kick.
  const kick = interpolate(since, [0, 3, 10], [0, 14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ringScale = interpolate(since, [0, 26], [0.2, 3.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.1, 0.9, 0.2, 1),
    output: 'perceptual-scale',
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        overflow: 'hidden',
        // The kick moves everything, which is why it reads as the camera and not an element.
        translate: `${Math.sin(since * 2.4) * kick}px ${Math.cos(since * 3.1) * kick * 0.6}px`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 46%, ${accentColor}22 0%, transparent 60%)`,
        }}
      />

      {/* Shockwave */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: 620,
            height: 620,
            borderRadius: '50%',
            border: `${(theme.stroke * 4) / 3}px solid ${accentColor}`,
            scale: ringScale,
            opacity: interpolate(since, [0, 26], [0.75, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Interactive.Div
          name="Stat"
          style={{
            fontFamily: displayFamily,
            fontSize: 430,
            lineHeight: 0.86,
            letterSpacing: '-0.03em',
            // A serif theme's default old-style figures otherwise drop the 7 and
            // the 3 straight through the accent rule below.
            fontVariantNumeric: 'lining-nums',
            color,
            scale: slam * recoil,
            opacity: interpolate(frame, [0, 4], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {stat}
        </Interactive.Div>

        {/* Accent rule that snaps open on impact. */}
        <div
          style={{
            height: 7,
            backgroundColor: accentColor,
            marginTop: 22,
            width: interpolate(since, [2, 16], [0, 760], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.14, 0.9, 0.2, 1),
            }),
          }}
        />

        <Interactive.Div
          name="Context"
          style={{
            fontFamily: textFamily,
            fontSize: 52,
            fontWeight: 700,
            color: theme.body,
            marginTop: 30,
            maxWidth: 1250,
            textAlign: 'center',
            // A wider face fills the max-width and leaves one orphan word;
            // balancing evens the two lines instead.
            textWrap: 'balance',
            translate: interpolate(since, [6, 24], ['0px 26px', '0px 0px'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(since, [6, 22], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {context}
        </Interactive.Div>

        <Interactive.Div
          name="Source"
          style={{
            fontFamily: textFamily,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '0.1em',
            color: theme.paperMuted,
            marginTop: 34,
            opacity: interpolate(since, [22, 40], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {source}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
