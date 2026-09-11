import {AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/DMMono';

const {fontFamily} = loadFont('normal', {weights: ['500'], subsets: ['latin']});

const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/';

/**
 * Split-Flap Board
 * An airport departure board. Each tile flips through the alphabet until it
 * reaches its target letter, then stops. Since the alphabet is ordered, the
 * number of flips a tile needs is just its target's index — so tiles with
 * late letters keep clattering after their neighbours have settled.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly paperMuted: string;
  readonly muted: string;
  readonly body: string;
  readonly mono: string;
  readonly bg: string;
  readonly series: readonly string[];
  readonly radius: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperMuted: '#4a4e5a',
  muted: '#8d93a5',
  body: '#eef1f7',
  mono: fontFamily,
  bg: '#0a0b10',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  radius: 18,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly rows?: readonly {readonly label: string; readonly value: string}[];
  readonly title?: string;
  /** Frames each flip takes. */
  readonly flipFrames?: number;
  /** Frames between one column starting and the next. */
  readonly columnStagger?: number;
  readonly backgroundColor?: string;
  readonly tileColor?: string;
  readonly accentColor?: string;
};

// Everything the tile paints with arrives as a prop. A tile that reached for the
// module-level `loadFont` result, or inlined its own radius and glyph colour,
// would be the one part of the board no theme could touch — and the tiles ARE
// the board.
const Tile: React.FC<{
  char: string;
  delay: number;
  frame: number;
  flipFrames: number;
  tileColor: string;
  accentColor: string;
  color: string;
  radius: number;
  fontFamily: string;
}> = ({char, delay, frame, flipFrames, tileColor, accentColor, color, radius, fontFamily}) => {
  const target = Math.max(0, ALPHABET.indexOf(char.toUpperCase()));
  const elapsed = frame - delay;
  // Flip through the alphabet from index 0 up to the target, then hold.
  const step = elapsed < 0 ? 0 : Math.min(target, Math.floor(elapsed / flipFrames));
  const settled = step >= target;
  const shown = ALPHABET[step] ?? ' ';

  // How far through the current flip we are — used to squash the tile mid-turn.
  const withinFlip = elapsed < 0 ? 0 : (elapsed % flipFrames) / flipFrames;
  const squash = settled ? 1 : 0.55 + 0.45 * Math.abs(Math.cos(withinFlip * Math.PI));

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 88,
        height: 118,
        marginRight: 8,
        borderRadius: radius,
        backgroundColor: tileColor,
        color: settled ? accentColor : color,
        fontSize: 70,
        fontFamily,
        // The hairline across the middle is what makes it read as a flap.
        backgroundImage: 'linear-gradient(transparent calc(50% - 1px), rgba(0,0,0,0.56) 50%, transparent calc(50% + 1px))',
        scale: `1 ${squash}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {shown}
    </span>
  );
};

export const SplitFlapBoard: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.mono,
  rows = [
    {label: '09:15', value: 'REMOTION'},
    {label: '10:40', value: 'RENDERS'},
    {label: '12:05', value: 'ON TIME'},
  ],
  title = 'DEPARTURES',
  flipFrames = 3,
  columnStagger = 4,
  backgroundColor = theme.bg,
  tileColor = 'rgba(255,255,255,0.07)',
  accentColor = theme.series[3],
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 42,
          letterSpacing: '0.5em',
          color: theme.muted,
          marginBottom: 46,
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>

      {rows.map((row, r) => (
        <div key={r} style={{display: 'flex', alignItems: 'center', marginBottom: 22}}>
          <span
            style={{
              fontSize: 62,
              color: theme.muted,
              width: 220,
              letterSpacing: '0.04em',
            }}
          >
            {row.label}
          </span>
          {row.value.split('').map((char, c) => (
            <Tile
              key={c}
              char={char}
              // Rows start together; columns cascade left to right.
              delay={r * 6 + c * columnStagger}
              frame={frame}
              flipFrames={flipFrames}
              tileColor={tileColor}
              accentColor={accentColor}
              color={theme.body}
              // 7 at the house radius of 18.
              radius={theme.radius * (7 / 18)}
              fontFamily={fontFamily}
            />
          ))}
        </div>
      ))}

      <Interactive.Div
        name="Footer"
        style={{
          fontSize: 32,
          letterSpacing: '0.24em',
          color: theme.paperMuted,
          marginTop: 40,
          opacity: interpolate(frame, [3 * fps, 3.6 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        ALL FRAMES ON SCHEDULE
      </Interactive.Div>
    </AbsoluteFill>
  );
};
