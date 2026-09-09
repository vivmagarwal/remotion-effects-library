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

type Props = {
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

const Tile: React.FC<{
  char: string;
  delay: number;
  frame: number;
  flipFrames: number;
  tileColor: string;
  accentColor: string;
}> = ({char, delay, frame, flipFrames, tileColor, accentColor}) => {
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
        borderRadius: 7,
        backgroundColor: tileColor,
        color: settled ? accentColor : '#cfd3dc',
        fontSize: 70,
        fontFamily,
        // The hairline across the middle is what makes it read as a flap.
        backgroundImage: 'linear-gradient(#0000 calc(50% - 1px), #00000090 50%, #0000 calc(50% + 1px))',
        scale: `1 ${squash}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {shown}
    </span>
  );
};

export const SplitFlapBoard: React.FC<Props> = ({
  rows = [
    {label: '09:15', value: 'REMOTION'},
    {label: '10:40', value: 'RENDERS'},
    {label: '12:05', value: 'ON TIME'},
  ],
  title = 'DEPARTURES',
  flipFrames = 3,
  columnStagger = 4,
  backgroundColor = '#0a0c10',
  tileColor = '#181c25',
  accentColor = '#ffd166',
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
          color: '#5a6172',
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
              color: '#5a6172',
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
            />
          ))}
        </div>
      ))}

      <Interactive.Div
        name="Footer"
        style={{
          fontSize: 32,
          letterSpacing: '0.24em',
          color: '#39404f',
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
