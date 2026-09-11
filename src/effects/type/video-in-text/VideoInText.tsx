import {useId} from 'react';
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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly mono: string;
  readonly display: string;
  readonly bg: string;
  readonly muted: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  display: fontFamily,
  bg: '#0a0b10',
  muted: '#8d93a5',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
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
  theme = THEME,
  fontFamily = theme.display,
  src,
  word = 'INSIDE',
  caption = 'SVG clipPath · not background-clip',
  openAt = 74,
  openFrames = 46,
  openScale = 26,
  backgroundColor = theme.bg,
  captionColor = theme.muted,
  fontSize = 330,
}) => {
  // One SVG id per INSTANCE. A literal id is global to the page: with two copies
  // mounted (a gallery card and its detail player), every url(#…) resolves to
  // whichever copy came first in the DOM, and its clip or mask follows the other
  // copy's frame.
  const svgId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

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

  // The zoom centre can land between two letters — it does for `INSIDE`, in
  // every face — so the letterform alone never quite covers the frame. A circle
  // in the SAME clipPath grows over the back 60% of the open on the same easing;
  // the clip is the union of the two, so the reveal ends full-frame whatever
  // typeface the theme supplies.
  const iris = interpolate(
    frame,
    [openAt + openFrames * 0.4, openAt + openFrames],
    [0, Math.hypot(cx, cy)],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1)},
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        overflow: 'hidden',
        fontFamily,
        // No faux bold. Anton ships a single 400 face, so the 800 below renders
        // it untouched; a theme's display family supplies a real heavy cut.
        fontSynthesis: 'none',
      }}
    >
      {/* The clip path lives in a zero-size svg; it is a definition, not a drawing. */}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <clipPath id={`vit-text-${svgId}`} clipPathUnits="userSpaceOnUse">
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={800} // font-weight-check: ignore — theme display faces; Anton ships 400 only and fontSynthesis 'none' keeps it unsynthesised
              letterSpacing={-6}
              // Scaling the mask about the frame's centre is what turns a
              // text-shaped window into a full-frame reveal.
              transform={`translate(${cx} ${cy}) scale(${maskScale}) translate(${-cx} ${-cy})`}
            >
              {word}
            </text>
            {/* The iris. A clipPath's shapes union, so this only ever adds to
                the window — zero while the type is the whole of the effect. */}
            <circle cx={cx} cy={cy} r={iris} />
          </clipPath>
        </defs>
      </svg>

      {/* The media, clipped to the letterforms. The content itself never moves —
          only the mask grows — so the footage stays framed the whole way. */}
      <AbsoluteFill style={{clipPath: `url(#vit-text-${svgId})`, WebkitClipPath: `url(#vit-text-${svgId})`}}>
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
          fontFamily: theme.mono,
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
