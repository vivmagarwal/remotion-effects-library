import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
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

type Props = {
  readonly kicker?: string;
  readonly headline?: string;
  /** Frames between one annotation starting and the next. */
  readonly stagger?: number;
  /** Frames a single mark takes to draw. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  readonly paperColor?: string;
  readonly inkColor?: string;
};

export const HandAnnotations: React.FC<Props> = ({
  kicker = 'MARKING UP THE BRIEF',
  headline = 'annotations',
  stagger = 22,
  drawFrames = 26,
  startAt = 18,
  paperColor = '#f6f5f2',
  inkColor = '#1d1b17',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

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
          color: '#4a4e5a',
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
        Every mark here is{' '}
        <Highlight color="rgba(255, 214, 64, 0.55)" progress={at(0)}>
          hand drawn
        </Highlight>
        , and every one is{' '}
        <Circle color="#4cc9f0" progress={at(1)}>
          deterministic
        </Circle>
        . Not{' '}
        <StrikeThrough color="#ff5c39" progress={at(2)}>
          approximately
        </StrikeThrough>{' '}
        the same each render —{' '}
        <Underline color="#c6ff3d" progress={at(3)}>
          exactly
        </Underline>{' '}
        the same, because the roughness is seeded and the{' '}
        <Box color="#c77dff" progress={at(4)}>
          progress
        </Box>{' '}
        comes from the frame, not from a{' '}
        <CrossedOff color="#ff5c39" progress={at(5)}>
          timer
        </CrossedOff>
        .
      </Interactive.Div>
    </AbsoluteFill>
  );
};
