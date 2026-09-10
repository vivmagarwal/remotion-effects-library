import {AbsoluteFill, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['700', '900'], subsets: ['latin']});

/**
 * Character Drop (Spring)
 * Letters fall in one at a time on a real spring, so each one overshoots and
 * settles instead of easing politely to a stop. `spring()` returns a value that
 * passes 1 and oscillates back — that overshoot is the whole character of it.
 */

type Props = {
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
  text = 'BOUNCE',
  eyebrow = 'spring({ damping: 11 })',
  stagger = 4,
  damping = 11,
  dropFrom = -420,
  backgroundColor = '#0a0b10',
  color = '#ffffff',
  accentColor = '#ffd166',
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
