import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {loadFont} from '@remotion/google-fonts/Sora';

// palette: data whole-file — three cards revealed through each other; each needs its own ground and matching ink, or the reveal has nothing to reveal

const {fontFamily} = loadFont('normal', {weights: ['400', '800'], subsets: ['latin']});

/**
 * Custom Circle Reveal
 * A hand-written TransitionPresentation. A presentation is just a component that
 * receives `presentationProgress` and `presentationDirection` and decides how to
 * draw its children — which means any CSS you can animate becomes a transition.
 */

type CircleRevealProps = {
  /** Origin of the circle, in percent of the frame. */
  readonly originX?: number;
  readonly originY?: number;
  readonly softness?: number;
};

const CircleRevealPresentation: React.FC<
  TransitionPresentationComponentProps<CircleRevealProps>
> = ({children, presentationProgress, presentationDirection, passedProps}) => {
  const {originX = 50, originY = 50, softness = 0} = passedProps;

  // The exiting scene stays put and is simply covered; only the entering scene
  // is clipped. Animating both is the usual mistake — it double-counts the move.
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  // A percentage radius in `circle()` resolves against sqrt(w² + h²) / sqrt(2),
  // NOT the diagonal — so 100% does not reach the corners from an off-centre
  // origin. 142% covers the frame from anywhere, including a corner origin.
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

const Card: React.FC<{title: string; body: string; bg: string; fg: string; accent: string}> = ({
  title,
  body,
  bg,
  fg,
  accent,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        color: fg,
        fontFamily,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 120,
        textAlign: 'center',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 132,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.06,
          maxWidth: 1500,
          scale: interpolate(frame, [0, 26], [0.94, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Body"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 30,
          color: accent,
          marginTop: 28,
          letterSpacing: '0.02em',
        }}
      >
        {body}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const CustomCircleReveal: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60} name="A">
      <Card title="Write your own" body="TransitionPresentation<Props>" bg="#0f1020" fg="#f0f2ff" accent="#8b93ff" />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={circleReveal({originX: 22, originY: 30, softness: 14})}
      timing={linearTiming({durationInFrames: 26})}
    />
    <TransitionSeries.Sequence durationInFrames={60} name="B">
      <Card title="Any CSS you can clip" body="clipPath: circle(r% at x% y%)" bg="#ff5c39" fg="#1a0703" accent="#5c1a09" />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={circleReveal({originX: 82, originY: 74})}
      timing={linearTiming({durationInFrames: 26})}
    />
    <TransitionSeries.Sequence durationInFrames={70} name="C">
      <Card title="becomes a transition" body="{component, props}" bg="#0aa06e" fg="#02180f" accent="#02341f" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
