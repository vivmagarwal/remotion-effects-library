import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Anton';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Video In Text
 * Footage playing inside letterforms, then the type opening up to swallow the
 * frame. The mask is a real SVG <clipPath> containing <text> — not
 * `background-clip: text`, which can only clip a paint, never a media element.
 * That distinction is why this can hold video and the CSS trick cannot.
 */

type Props = {
  readonly src?: string;
  readonly word?: string;
  readonly caption?: string;
  /** Frame the letterform starts opening up. */
  readonly openAt?: number;
  /** Frames the open takes. */
  readonly openFrames?: number;
  /** How far the mask scales. It must get large enough to clear the frame. */
  readonly openScale?: number;
  readonly backgroundColor?: string;
  readonly captionColor?: string;
  readonly fontSize?: number;
};

export const VideoInText: React.FC<Props> = ({
  src,
  word = 'INSIDE',
  caption = 'SVG clipPath · not background-clip',
  openAt = 74,
  openFrames = 46,
  openScale = 26,
  backgroundColor = '#0a0b10',
  captionColor = '#8d93a5',
  fontSize = 330,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const cx = width / 2;
  const cy = height / 2;

  // A small settle first, then the letterform opens up and swallows the frame.
  const settle = interpolate(frame, [0, 34], [1.16, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const open = interpolate(frame, [openAt, openAt + openFrames], [1, openScale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });

  const maskScale = settle * open;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      {/* The clip path lives in a zero-size svg; it is a definition, not a drawing. */}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <clipPath id="vit-text" clipPathUnits="userSpaceOnUse">
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={400}
              letterSpacing={-6}
              // Scaling the mask about the frame's centre is what turns a
              // text-shaped window into a full-frame reveal.
              transform={`translate(${cx} ${cy}) scale(${maskScale}) translate(${-cx} ${-cy})`}
            >
              {word}
            </text>
          </clipPath>
        </defs>
      </svg>

      {/* The media, clipped to the letterforms. The content itself never moves —
          only the mask grows — so the footage stays framed the whole way. */}
      <AbsoluteFill style={{clipPath: 'url(#vit-text)', WebkitClipPath: 'url(#vit-text)'}}>
        <Video
          objectFit="cover"
          src={src ?? staticFile('footage/broll-earth.mp4')}
          // The clip is 6.0s at 30fps = 180 frames against a 180-frame
          // composition, so it just fits — `loop` is belt and braces in case the
          // source is swapped for a shorter one, since a black frame inside
          // letterforms looks like the mask failed rather than like the clip ended.
          loop
          muted
          style={{
            width: '100%',
            height: '100%',
            // A slow push on the media itself, independent of the mask.
            scale: interpolate(frame, [0, 180], [1.05, 1.16], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              output: 'perceptual-scale',
            }),
          }}
        />
      </AbsoluteFill>

      <Interactive.Div
        name="Caption"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 118,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          letterSpacing: '0.22em',
          marginRight: '-0.22em',
          color: captionColor,
          // Gone by the time the letterform opens, or it ends up sitting on the
          // revealed footage.
          opacity: interpolate(frame, [22, 40, openAt - 6, openAt + 6], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
