import {AbsoluteFill, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

const GLYPHS = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Text Scramble
 * Each character resolves out of a churn of random glyphs, left to right.
 * The randomness comes from `random(seed)` — Remotion's deterministic PRNG — so
 * every render produces exactly the same churn. `Math.random()` here would make
 * each frame of the render disagree with the last, and the text would boil.
 */

type Props = {
  readonly text?: string;
  readonly subtitle?: string;
  /** Frames each character spends scrambling before it locks. */
  readonly scrambleFrames?: number;
  /** Frames between one character locking and the next starting. */
  readonly stagger?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
};

export const TextScramble: React.FC<Props> = ({
  text = 'DECRYPTING',
  subtitle = 'deterministic randomness, frame by frame',
  scrambleFrames = 18,
  stagger = 3,
  backgroundColor = '#04050a',
  color = '#eef1f7',
  accentColor = '#c6ff3d',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chars = text.split('').map((char, i) => {
    const start = i * stagger;
    // Spaces never churn — a space cycling through glyphs reads as a stray letter.
    if (char === ' ') return {char: '\u00a0', scrambling: false};
    const settled = frame >= start + scrambleFrames;
    if (settled) return {char, scrambling: false};
    if (frame < start) return {char: '\u00a0', scrambling: false};
    // A new glyph every 2 frames, seeded on both the slot and the tick so it is
    // stable for a given frame but different across frames.
    const tick = Math.floor((frame - start) / 2);
    const pick = Math.floor(random(`scramble-${i}-${tick}`) * GLYPHS.length);
    return {char: GLYPHS[pick], scrambling: true};
  });

  const lockedAt = (text.length - 1) * stagger + scrambleFrames;

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 150,
          fontWeight: 700,
          letterSpacing: '0.02em',
          display: 'flex',
          whiteSpace: 'pre',
        }}
      >
        {chars.map((c, i) => (
          <span
            key={i}
            style={{
              color: c.scrambling ? accentColor : color,
              opacity: c.scrambling ? 0.72 : 1,
              // A fixed-width slot per character so glyph swaps do not reflow the line.
              // 0.92em fits Space Grotesk 700's widest caps (M, W ≈ 0.9em); size it
              // to the typeface, or wide glyphs overflow and collide with neighbours.
              width: '0.92em',
              textAlign: 'center',
            }}
          >
            {c.char}
          </span>
        ))}
      </Interactive.Div>

      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: '0.16em',
          marginRight: '-0.16em',
          textTransform: 'uppercase',
          color: accentColor,
          marginTop: 34,
          opacity: interpolate(frame, [lockedAt, lockedAt + 0.6 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subtitle}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
