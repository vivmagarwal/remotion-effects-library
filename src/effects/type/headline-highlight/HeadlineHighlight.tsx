import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: serif} = loadFont('normal', {weights: ['700'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['400', '600'], subsets: ['latin']});

/**
 * Headline Highlight
 * A news article sits on the page and a marker sweeps across the phrases that
 * matter, as if someone were reading with a highlighter. Each highlight is a
 * pseudo-background whose width animates from 0 — drawn *behind* the text via
 * a negative z-index layer, so the letters stay crisp instead of being tinted.
 */

type Span = {readonly text: string; readonly highlight?: boolean};

type Props = {
  readonly kicker?: string;
  readonly headline?: readonly Span[];
  readonly byline?: string;
  readonly meta?: string;
  readonly highlightColor?: string;
  /** Frames before the first marker stroke starts. */
  readonly startAt?: number;
  /** Frames one stroke takes to sweep across. */
  readonly strokeFrames?: number;
};

export const HeadlineHighlight: React.FC<Props> = ({
  kicker = 'Technology',
  headline = [
    {text: 'Remotion turns '},
    {text: 'React components', highlight: true},
    {text: ' into rendered '},
    {text: 'video frames', highlight: true},
    {text: ', one at a time'},
  ],
  byline = 'By Ada Lovelace, Grace Hopper',
  meta = 'Updated on: January 31, 2026 / 9:59 AM EST / Frame News',
  highlightColor = '#ffd166',
  startAt = 24,
  strokeFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Index each highlighted span so strokes happen one after another.
  let strokeIndex = -1;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#f6f5f2', padding: '0 150px', justifyContent: 'center'}}>
      <Interactive.Div
        name="Kicker"
        style={{
          fontFamily: sans,
          fontSize: 30,
          color: '#4a4e5a',
          textDecoration: 'underline',
          textUnderlineOffset: 6,
          opacity: interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="Headline"
        style={{
          fontFamily: serif,
          fontSize: 92,
          fontWeight: 700,
          lineHeight: 1.24,
          color: '#1d1b17',
          marginTop: 26,
          maxWidth: 1450,
          opacity: interpolate(frame, [4, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      >
        {headline.map((span, i) => {
          if (!span.highlight) return <span key={i}>{span.text}</span>;
          strokeIndex += 1;
          const from = startAt + strokeIndex * (strokeFrames + 6);
          return (
            // The marker: an inline-block wrapper with the stroke painted behind the text.
            <span key={i} style={{position: 'relative', display: 'inline-block'}}>
              <span
                style={{
                  position: 'absolute',
                  left: '-0.03em',
                  top: '0.12em',
                  bottom: '0.08em',
                  backgroundColor: highlightColor,
                  zIndex: 0,
                  width: interpolate(frame, [from, from + strokeFrames], ['0%', '106%'], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.32, 0.72, 0.3, 1),
                  }),
                }}
              />
              <span style={{position: 'relative', zIndex: 1}}>{span.text}</span>
            </span>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="Byline"
        style={{
          fontFamily: sans,
          fontSize: 28,
          color: '#c2410c',
          marginTop: 44,
          textDecoration: 'underline',
          textUnderlineOffset: 5,
          opacity: interpolate(frame, [14, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      >
        {byline}
      </Interactive.Div>

      <Interactive.Div
        name="Meta"
        style={{
          fontFamily: sans,
          fontSize: 25,
          color: '#4a4e5a',
          marginTop: 14,
          opacity: interpolate(frame, [18, 32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      >
        {meta}
      </Interactive.Div>

      <Interactive.Div
        name="Source chip"
        style={{
          fontFamily: sans,
          fontSize: 24,
          fontWeight: 600,
          color: '#4a4e5a',
          border: '1px solid rgba(29,27,23,0.16)',
          borderRadius: 8,
          padding: '10px 18px',
          marginTop: 34,
          alignSelf: 'flex-start',
          opacity: interpolate(frame, [3 * fps, 3 * fps + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Add Frame News on Google
      </Interactive.Div>
    </AbsoluteFill>
  );
};
