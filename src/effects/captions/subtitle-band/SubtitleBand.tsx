import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Subtitle Band
 * Broadcast-style subtitles in a lower band, where the spoken word is filled in
 * progressively rather than switched. The fill is a second copy of the same line
 * clipped to a moving width — so the wipe follows the real glyph shapes and lands
 * exactly on word boundaries.
 */

export type Word = {readonly text: string; readonly start: number; readonly end: number};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly ink: string;
  readonly muted: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  ink: '#ffffff',
  muted: '#8d93a5',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly lines?: readonly (readonly Word[])[];
  /**
   * Footage under the band. A subtitle judged on black is judged against
   * nothing — the band's own opacity is the only thing standing between the
   * words and whatever the shot does, and on black that decision is free. Set
   * to null (or `transparent`) for an alpha overlay render.
   */
  readonly src?: string | null;
  readonly baseColor?: string;
  readonly fillColor?: string;
  readonly bandColor?: string;
  readonly backgroundColor?: string;
  readonly transparent?: boolean;
};

const LINES: Word[][] = [
  [
    {text: 'Remotion', start: 0.2, end: 0.9},
    {text: 'renders', start: 0.9, end: 1.45},
    {text: 'React', start: 1.45, end: 1.95},
    {text: 'to', start: 1.95, end: 2.1},
    {text: 'video', start: 2.1, end: 2.7},
  ],
  [
    {text: 'one', start: 3.0, end: 3.3},
    {text: 'deterministic', start: 3.3, end: 4.25},
    {text: 'frame', start: 4.25, end: 4.75},
    {text: 'at', start: 4.75, end: 4.9},
    {text: 'a', start: 4.9, end: 5.0},
    {text: 'time', start: 5.0, end: 5.6},
  ],
];

export const SubtitleBand: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  lines = LINES,
  src = staticFile('footage/broll-eva.mp4'),
  baseColor = theme.muted,
  fillColor = theme.ink,
  bandColor = 'rgba(10,12,18,0.86)',
  backgroundColor = theme.bg,
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  // Which line is current: the last one that has started. Written as a reduce
  // rather than findLastIndex(), which needs lib: ES2023 in tsconfig.
  const lineIndex = lines.reduce(
    (best, l, i) => (time >= (l[0]?.start ?? 0) ? i : best),
    0,
  );
  const line = lines[lineIndex];
  const lineStart = line[0].start;
  const lineEnd = line[line.length - 1].end;

  // Progress through the line, 0–1, snapped to word boundaries so the wipe
  // pauses on each word instead of sliding at a constant rate.
  const spokenCount = line.filter((w) => time >= w.end).length;
  const active = line.find((w) => time >= w.start && time < w.end);
  const withinActive = active
    ? (time - active.start) / Math.max(0.001, active.end - active.start)
    : 0;
  const wordsDone = spokenCount + (active ? withinActive : 0);
  const progress = Math.min(1, wordsDone / line.length);

  const text = line.map((w) => w.text).join(' ');

  const enter = interpolate(time, [lineStart - 0.25, lineStart + 0.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 110,
        fontFamily,
        overflow: 'hidden',
      }}
    >
      {src && !transparent ? (
        <AbsoluteFill>
          {/* objectFit is a prop on <Video>, not a style: it draws to a canvas. */}
          <Video src={src} objectFit="cover" muted loop style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      ) : null}
      <Interactive.Div
        name="Caption band"
        style={{
          position: 'relative',
          backgroundColor: bandColor,
          borderRadius: 18,
          padding: '28px 52px',
          borderLeft: '7px solid #4cc9f0',
          translate: `0px ${(1 - enter) * 26}px`,
          opacity: enter,
        }}
      >
        {/* Base layer: the whole line, dim. */}
        <div
          style={{
            fontSize: 62,
            fontWeight: 700,
            color: baseColor,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </div>

        {/* Fill layer: the identical line, bright, clipped to `progress`.
            Same element, same metrics — so the wipe follows the real glyphs. */}
        <div
          style={{
            position: 'absolute',
            left: 52,
            top: 28,
            fontSize: 62,
            fontWeight: 700,
            color: fillColor,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            width: `${progress * 100}%`,
          }}
        >
          {text}
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
