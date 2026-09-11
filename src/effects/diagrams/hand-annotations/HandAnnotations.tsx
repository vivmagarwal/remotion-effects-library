import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame} from 'remotion';
import {Box, Circle, CrossedOff, Highlight, StrikeThrough, Underline} from '@remotion/rough-notation';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Hand Annotations
 * Rough, hand-drawn marks landing on a paragraph one after another — highlight,
 * circle, underline, strike-through, crossed-off, box. Every mark is driven by a
 * `progress` from `interpolate()`, which is what makes it deterministic; the
 * library's own auto-play would render differently every time.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly paperMuted: string;
  readonly text: string;
  readonly paper: string;
  readonly paperInk: string;
  readonly stroke: number;
  readonly roughness: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperMuted: '#4a4e5a',
  text: fontFamily,
  paper: '#f6f5f2',
  paperInk: '#1d1b17',
  stroke: 3,
  roughness: 0.45,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly kicker?: string;
  /** Frames between one annotation starting and the next. */
  readonly stagger?: number;
  /** Frames a single mark takes to draw. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  readonly paperColor?: string;
  readonly inkColor?: string;
};

export const HandAnnotations: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  kicker = 'MARKING UP THE BRIEF',
  stagger = 22,
  drawFrames = 26,
  startAt = 18,
  paperColor = theme.paper,
  inkColor = theme.paperInk,
}) => {
  const frame = useCurrentFrame();

  /** Mark `n` draws over its own window — inline, so Studio can retime it. */
  const at = (n: number) =>
    interpolate(frame, [startAt + n * stagger, startAt + n * stagger + drawFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.32, 0.72, 0.3, 1),
    });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: paperColor,
        justifyContent: 'center',
        padding: '0 150px',
        fontFamily,
        color: inkColor,
      }}
    >
      <Interactive.Div
        name="Kicker"
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: theme.paperMuted,
          marginBottom: 34,
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="Paragraph"
        style={{
          fontSize: 78,
          fontWeight: 400,
          lineHeight: 1.55,
          maxWidth: 1560,
          opacity: interpolate(frame, [4, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {/* Each mark and the punctuation after it share a `nowrap` span. The
            mark's wrapper is inline-block, which IS a wrap opportunity, so a
            wider face strands the full stop on a line of its own. The
            inter-word {' '} stays outside, so spacing is unchanged. */}
        Every mark here is{' '}
        <span style={{whiteSpace: 'nowrap'}}>
          <Highlight color="rgba(255, 214, 64, 0.55)" progress={at(0)} roughness={theme.roughness / 0.15}>
            hand drawn
          </Highlight>
          ,
        </span>{' '}
        and every one is{' '}
        <span style={{whiteSpace: 'nowrap'}}>
          <Circle
            color="#4cc9f0"
            progress={at(1)}
            roughness={theme.roughness / 0.3}
            strokeWidth={theme.stroke * (20 / 3)}
          >
            deterministic
          </Circle>
          .
        </span>{' '}
        Not{' '}
        <StrikeThrough
          color="#ff5c39"
          progress={at(2)}
          roughness={theme.roughness / 0.3}
          strokeWidth={theme.stroke * (20 / 3)}
        >
          approximately
        </StrikeThrough>{' '}
        the same each render —{' '}
        <Underline
          color="#c6ff3d"
          progress={at(3)}
          roughness={theme.roughness / 0.3}
          strokeWidth={theme.stroke * (20 / 3)}
        >
          exactly
        </Underline>{' '}
        the same, because the roughness is seeded and the{' '}
        <Box color="#c77dff" progress={at(4)} roughness={theme.roughness / 0.3} strokeWidth={theme.stroke * (7 / 3)}>
          progress
        </Box>{' '}
        comes from the frame, not from a{' '}
        <span style={{whiteSpace: 'nowrap'}}>
          <CrossedOff
            color="#ff5c39"
            progress={at(5)}
            roughness={theme.roughness / 0.3}
            strokeWidth={theme.stroke * (20 / 3)}
          >
            timer
          </CrossedOff>
          .
        </span>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
