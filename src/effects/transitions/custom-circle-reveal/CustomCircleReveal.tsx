import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['400', '800'], subsets: ['latin']});

/**
 * Custom Circle Reveal
 *
 * The recipe for writing your own transition instead of picking one off the
 * shelf. A `TransitionPresentation` is just `{component, props}`: the component
 * receives `presentationProgress` and `presentationDirection` and decides how to
 * draw its children — which means any CSS you can animate becomes a transition.
 *
 * Two things in here are the reason hand-written presentations usually look
 * wrong on the first try:
 *
 *  1. **Only one side animates.** The exiting scene is returned untouched and is
 *     simply covered. Animating both double-counts the move and reads as a
 *     stutter in the middle of the cut.
 *  2. **`circle(100%)` does not reach the corners.** A percentage radius
 *     resolves against `sqrt(w² + h²) / sqrt(2)`, not against the diagonal, so
 *     from an off-centre origin 100 % leaves a corner of the old scene showing.
 *     142 % covers the frame from anywhere, a corner origin included.
 */

type CircleRevealProps = {
  /** Origin of the circle, in percent of the frame. */
  readonly originX?: number;
  readonly originY?: number;
  /** Blur on the entering scene, in px, fading out as it arrives. 0 for a hard edge. */
  readonly softness?: number;
};

const CircleRevealPresentation: React.FC<
  TransitionPresentationComponentProps<CircleRevealProps>
> = ({children, presentationProgress, presentationDirection, passedProps}) => {
  const {originX = 50, originY = 50, softness = 0} = passedProps;

  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const r = interpolate(presentationProgress, [0, 1], [0, 142], {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${r}% at ${originX}% ${originY}%)`,
        filter: softness ? `blur(${softness * (1 - presentationProgress)}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** The factory. `props` are handed back to the component as `passedProps`. */
export const circleReveal = (
  props: CircleRevealProps = {},
): TransitionPresentation<CircleRevealProps> => ({
  component: CircleRevealPresentation,
  props,
});

/**
 * One scene in the series. Give it a `src` for footage; leave `src` out and it
 * draws a typographic card on `backgroundColor` instead.
 */
export type Shot = {
  readonly src?: string;
  readonly title?: string;
  readonly body?: string;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** The scenes, in order. Two or more. */
  readonly shots?: readonly Shot[];
  /**
   * Circle origin per gap, as [x%, y%]. Cycles if shorter than the gaps.
   * Moving the origin between cuts is what stops a series of reveals reading as
   * one repeated iris.
   */
  readonly origins?: readonly (readonly [number, number])[];
  readonly softness?: number;
  /** Length of each reveal. 20–30 is the band for a full-frame circle. */
  readonly transitionFrames?: number;
  /** Frames each scene holds. The last one holds this plus one transition. */
  readonly holdFrames?: number;
};

const SHOTS: Shot[] = [
  {
    src: staticFile('footage/broll-earth.mp4'),
    title: 'Write your own',
    body: 'TransitionPresentation<Props>',
  },
  {
    src: staticFile('footage/broll-night.mp4'),
    title: 'Any CSS you can clip',
    body: 'clipPath: circle(r% at x% y%)',
  },
  {
    src: staticFile('footage/broll-eva.mp4'),
    title: 'becomes a transition',
    body: '{component, props}',
  },
];

const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: shot.backgroundColor ?? '#0a0b10',
        color: shot.color ?? '#f6f5f2',
        fontFamily,
        // Lower third rather than dead centre, and that is about the transition
        // rather than about taste: a circle opening from 22%/30% crosses a
        // centred headline while both scenes are on screen, and for a few frames
        // the frame shows half of one title and half of the other as a single
        // garbled line. Put the type below the origin and the circle opens over
        // sky first, so the reveal is legible the whole way through.
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 120px 130px',
        textAlign: 'center',
      }}
    >
      {shot.src ? (
        <AbsoluteFill>
          {/* objectFit is a prop, not a style: <Video> draws to a canvas. */}
          <Video src={shot.src} objectFit="cover" muted loop style={{width: '100%', height: '100%'}} />
          {/* The type has to survive whatever the footage does under it, and a
              flat dim over the whole frame costs the picture more than it needs
              to. A gradient puts the contrast only where the words are. */}
          <AbsoluteFill
            style={{
              backgroundImage:
                'linear-gradient(to top, rgba(6,7,14,0.86) 0%, rgba(6,7,14,0.4) 36%, rgba(6,7,14,0) 64%)',
            }}
          />
        </AbsoluteFill>
      ) : null}

      <Interactive.Div
        name="Title"
        style={{
          position: 'relative',
          fontSize: 132,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.06,
          maxWidth: 1500,
          textShadow: '0 8px 44px rgba(0,0,0,0.62)',
          scale: interpolate(frame, [0, 26], [0.94, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        {shot.title}
      </Interactive.Div>
      <Interactive.Div
        name="Body"
        style={{
          position: 'relative',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 30,
          color: shot.accentColor ?? '#c6ff3d',
          marginTop: 28,
          letterSpacing: '0.02em',
          textShadow: '0 2px 18px rgba(0,0,0,0.8)',
        }}
      >
        {shot.body}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const CustomCircleReveal: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  shots = SHOTS,
  origins = [
    [22, 30],
    [82, 74],
  ],
  softness = 14,
  transitionFrames = 26,
  holdFrames = 60,
}) => (
  <TransitionSeries>
    {shots.map((shot, i) => (
      <React.Fragment key={i}>
        <TransitionSeries.Sequence
          // The last scene carries one extra transition's worth: a
          // TransitionSeries subtracts every transition from the total.
          durationInFrames={i === shots.length - 1 ? holdFrames + transitionFrames : holdFrames}
          name={shot.title ?? `Shot ${i + 1}`}
        >
          <ShotView shot={shot} />
        </TransitionSeries.Sequence>
        {i < shots.length - 1 ? (
          <TransitionSeries.Transition
            presentation={circleReveal({
              originX: origins[i % origins.length][0],
              originY: origins[i % origins.length][1],
              // Softness on the first reveal only: it sells the technique, and
              // repeated it starts to read as a rendering fault.
              softness: i === 0 ? softness : 0,
            })}
            timing={linearTiming({durationInFrames: transitionFrames})}
          />
        ) : null}
      </React.Fragment>
    ))}
  </TransitionSeries>
);
