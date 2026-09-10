import {AbsoluteFill, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['700', '900'], subsets: ['latin']});

/**
 * Character Drop (Spring)
 * Letters fall in one at a time on a real spring, so each one overshoots and
 * settles instead of easing politely to a stop. `spring()` returns a value that
 * passes 1 and oscillates back — that overshoot is the whole character of it.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly display: string;
  readonly bg: string;
  readonly ink: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  display: fontFamily,
  bg: '#0a0b10',
  ink: '#ffffff',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly text?: string;
  readonly eyebrow?: string;
  /** Frames between one character starting and the next. */
  readonly stagger?: number;
  /** Lower damping = more bounce. 200 is effectively no bounce. */
  readonly damping?: number;
  readonly dropFrom?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
};

export const CharDropSpring: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  text = 'BOUNCE',
  eyebrow = 'spring({ damping: 11 })',
  stagger = 4,
  damping = 11,
  dropFrom = -420,
  backgroundColor = theme.bg,
  color = theme.ink,
  accentColor = theme.series[3],
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = text.split('');

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Eyebrow"
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '0.22em',
          marginRight: '-0.22em',
          textTransform: 'uppercase',
          color: '#8d93a5',
          marginBottom: 36,
          opacity: interpolate(frame, [chars.length * stagger + 10, chars.length * stagger + 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {eyebrow}
      </Interactive.Div>

      <div style={{display: 'flex', gap: 6}}>
        {chars.map((char, i) => {
          // A separate spring per character, each delayed by `stagger` frames.
          const progress = spring({
            frame: frame - i * stagger,
            fps,
            config: {damping, stiffness: 130, mass: 0.9},
          });

          return (
            <Interactive.Div
              key={i}
              name={`Char ${char}`}
              style={{
                fontSize: 210,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: i % 2 === 1 ? accentColor : color,
                // Multiply the spring by the distance instead of interpolating it,
                // so the overshoot past 1 survives.
                translate: `0px ${dropFrom * (1 - progress)}px`,
                rotate: `${-14 * (1 - progress)}deg`,
                opacity: Math.min(1, progress * 3),
              }}
            >
              {char}
            </Interactive.Div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
