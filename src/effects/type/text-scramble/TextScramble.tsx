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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bgDeep: string;
  readonly body: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bgDeep: '#04050a',
  body: '#eef1f7',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
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
  theme = THEME,
  fontFamily = theme.text,
  text = 'DECRYPTING',
  subtitle = 'deterministic randomness, frame by frame',
  scrambleFrames = 18,
  stagger = 3,
  backgroundColor = theme.bgDeep,
  color = theme.body,
  accentColor = theme.series[2],
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
          // A fixed-width slot per character so glyph swaps do not reflow the
          // line — but sized to the ACTIVE FACE rather than to a number, because
          // a theme can swap the typeface underneath this.
          //
          // The hidden `W` is what sets the width: it measures the widest capital
          // of whatever family is in force, so a wider face widens every slot
          // equally instead of spilling into its neighbour. `0.92em` is only the
          // floor — what Space Grotesk 700 already measures, so the untouched
          // look is unchanged.
          //
          // The churning glyph is absolutely positioned over that measure, out of
          // flow, so a wide pick such as the em dash can never resize its own slot
          // and reflow the line.
          <span
            key={i}
            style={{
              position: 'relative',
              minWidth: '0.92em',
              textAlign: 'center',
              color: c.scrambling ? accentColor : color,
              opacity: c.scrambling ? 0.72 : 1,
            }}
          >
            <span style={{visibility: 'hidden'}}>W</span>
            <span style={{position: 'absolute', left: 0, right: 0, top: 0}}>{c.char}</span>
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
