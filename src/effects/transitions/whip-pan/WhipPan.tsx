import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['400', '800'], subsets: ['latin']});

/**
 * Whip Pan
 * A camera whipping between shots: both scenes fly sideways together while a
 * directional blur peaks at the midpoint. Built as a custom presentation, so it
 * is plain DOM and renders anywhere — unlike the shader presentations in
 * @remotion/transitions, which need WebGL2 through <HtmlInCanvas>.
 */

type WhipPanProps = {
  readonly direction?: 'left' | 'right' | 'up' | 'down';
  /** Peak blur in pixels at the midpoint of the whip. */
  readonly blur?: number;
  /** How far past the frame each scene travels, as a multiple of the frame. */
  readonly overshoot?: number;
};

const WhipPanPresentation: React.FC<TransitionPresentationComponentProps<WhipPanProps>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {direction = 'left', blur = 26, overshoot = 1} = passedProps;

  const vertical = direction === 'up' || direction === 'down';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  // Both scenes move together, one frame apart — that shared motion is what
  // reads as a camera, rather than as one card sliding over another.
  const p = interpolate(presentationProgress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });
  const offset =
    presentationDirection === 'exiting' ? p * sign * 100 * overshoot : (p - 1) * sign * 100 * overshoot;

  // Blur peaks in the middle of the whip and is gone at both ends.
  const amount = Math.sin(presentationProgress * Math.PI) * blur;

  return (
    <AbsoluteFill
      style={{
        translate: vertical ? `0px ${offset}%` : `${offset}% 0px`,
        // Directional: a real whip smears along the axis of travel only.
        filter: `blur(${vertical ? 0 : amount}px) blur(${vertical ? amount : 0}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** The factory. `props` come back to the component as `passedProps`. */
export const whipPan = (props: WhipPanProps = {}): TransitionPresentation<WhipPanProps> => ({
  component: WhipPanPresentation,
  props,
});

const SHOTS = [
  {bg: '#0f1020', fg: '#f0f2ff', kicker: 'ONE', line: 'Both scenes move'},
  {bg: '#ff5c39', fg: '#1a0703', kicker: 'TWO', line: 'together, one frame apart'},
  {bg: '#0aa06e', fg: '#02180f', kicker: 'THREE', line: 'and the blur peaks in the middle'},
  {bg: '#f4d35e', fg: '#211a03', kicker: 'FOUR', line: 'so it reads as a camera'},
] as const;

const Shot: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const s = SHOTS[index];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        fontFamily,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 140px',
        textAlign: 'center',
      }}
    >
      <Interactive.Div
        name="Kicker"
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '0.4em',
          marginRight: '-0.4em',
          opacity: 0.55,
          marginBottom: 26,
        }}
      >
        {s.kicker}
      </Interactive.Div>
      <Interactive.Div
        name="Line"
        style={{
          fontSize: 104,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          // A slow drift under the whip: the shot is never quite still, which is
          // what makes the cut feel like it interrupted something.
          scale: interpolate(frame, [0, 60], [1, 1.05], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {s.line}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const WhipPan: React.FC = () => {
  const timing = linearTiming({durationInFrames: 12});
  const dirs = ['left', 'up', 'right'] as const;

  return (
    <AbsoluteFill style={{backgroundColor: '#08070c'}}>
      <TransitionSeries>
        {SHOTS.map((s, i) => (
          <React.Fragment key={s.kicker}>
            <TransitionSeries.Sequence durationInFrames={i === SHOTS.length - 1 ? 60 : 52} name={s.kicker}>
              <Shot index={i} />
            </TransitionSeries.Sequence>
            {i < dirs.length ? (
              <TransitionSeries.Transition
                presentation={whipPan({direction: dirs[i], blur: 30})}
                timing={timing}
              />
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
