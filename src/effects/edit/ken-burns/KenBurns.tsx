import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, Series, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: serif} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500'], subsets: ['latin']});

/**
 * Ken Burns
 * The documentary standard: a still photograph given life by a slow push and
 * drift. Two rules keep it from looking cheap — never start at scale 1 (you have
 * no room to pull back), and never move and zoom on the same axis at the same
 * speed, or the motion cancels out and reads as a wobble.
 */

type Shot = {
  readonly src?: string;
  readonly caption: string;
  readonly credit?: string;
  /** Start and end scale. Keep both above 1. */
  readonly from: number;
  readonly to: number;
  /** Pan destination in percent, relative to centre. */
  readonly panX?: number;
  readonly panY?: number;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly muted: string;
  readonly ink: string;
  readonly display: string;
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  ink: '#ffffff',
  display: serif,
  text: sans,
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** CSS family for the caption. Defaults to this file's serif, or the theme's display face. */
  readonly captionFamily?: string;
  /** CSS family for the credit line. Defaults to this file's sans, or the theme's text face. */
  readonly creditFamily?: string;
  readonly shots?: readonly Shot[];
  readonly shotFrames?: number;
};

const Frame: React.FC<{
  shot: Shot;
  frames: number;
  captionFamily: string;
  creditFamily: string;
  ink: string;
  muted: string;
}> = ({shot, frames, captionFamily, creditFamily, ink, muted}) => {
  const frame = useCurrentFrame();

  const p = interpolate(frame, [0, frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear, // a constant drift; easing here reads as a camera stumble
  });

  const fade = interpolate(frame, [0, 12, frames - 12, frames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#04050a', overflow: 'hidden', opacity: fade}}>
      <CanvasImage
        src={shot.src ?? staticFile('sample-scene.svg')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Both ends above 1, so there is always overscan to pan into.
          scale: shot.from + (shot.to - shot.from) * p,
          translate: `${(shot.panX ?? 0) * p}% ${(shot.panY ?? 0) * p}%`,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(transparent 44%, rgba(6,6,10,0.55) 72%, rgba(6,6,10,0.92) 100%)',
        }}
      />

      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 110px 96px'}}>
        <Interactive.Div
          name="Caption"
          style={{
            fontFamily: captionFamily,
            fontSize: 78,
            color: ink,
            lineHeight: 1.15,
            maxWidth: 1300,
            translate: interpolate(frame, [6, 34], ['0px 26px', '0px 0px'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(frame, [6, 28], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {shot.caption}
        </Interactive.Div>
        {shot.credit ? (
          <Interactive.Div
            name="Credit"
            style={{
              fontFamily: creditFamily,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: muted,
              marginTop: 20,
              opacity: interpolate(frame, [16, 38], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {shot.credit}
          </Interactive.Div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const KenBurns: React.FC<Props> = ({
  theme = THEME,
  captionFamily = theme.display,
  creditFamily = theme.text,
  shots = [
    {caption: 'The sun sets on the render farm.', credit: 'Plate 1', from: 1.06, to: 1.3, panX: -4, panY: 3},
    {caption: 'Ninety minutes later, it rises again.', credit: 'Plate 2', from: 1.34, to: 1.08, panX: 5, panY: -2},
  ],
  shotFrames = 90,
}) => (
  <Series>
    {shots.map((shot, i) => (
      <Series.Sequence key={i} durationInFrames={shotFrames} premountFor={30}>
        <Frame
          shot={shot}
          frames={shotFrames}
          captionFamily={captionFamily}
          creditFamily={creditFamily}
          ink={theme.ink}
          muted={theme.muted}
        />
      </Series.Sequence>
    ))}
  </Series>
);
