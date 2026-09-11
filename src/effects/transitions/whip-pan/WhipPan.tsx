import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['400', '800'], subsets: ['latin']});

/**
 * Whip Pan
 *
 * A camera whipping between shots: both scenes fly sideways together while a
 * directional blur peaks at the midpoint.
 *
 * Built as a custom `TransitionPresentation`, so it is plain DOM and renders
 * anywhere — half of `@remotion/transitions` draws through `<HtmlInCanvas>` and
 * WebGL2 and gives you a blank frame where that is unavailable.
 *
 * Three things make it read as a camera rather than as one card sliding over
 * another, and the first is the one people miss:
 *
 *  1. **Both scenes move together.** The exiting scene travels out while the
 *     entering scene travels in from exactly one frame-width behind it. Move
 *     only the top layer and you have a slide, not a pan.
 *  2. **The blur is directional.** A real whip smears along the axis of travel
 *     only; blurring both axes reads as a focus pull.
 *  3. **The blur peaks in the middle.** `sin(progress * PI)` is zero at both
 *     ends by construction, so no frame of either shot is ever delivered soft.
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

  const p = interpolate(presentationProgress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });
  const offset =
    presentationDirection === 'exiting' ? p * sign * 100 * overshoot : (p - 1) * sign * 100 * overshoot;

  const amount = Math.sin(presentationProgress * Math.PI) * blur;

  return (
    <AbsoluteFill
      style={{
        translate: vertical ? `0px ${offset}%` : `${offset}% 0px`,
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

/**
 * One shot in the series. Give it a `src` for footage; leave `src` out and it
 * draws a typographic card on `backgroundColor` instead, which is what you want
 * when there is no media to hand.
 */
export type Shot = {
  readonly src?: string;
  readonly kicker?: string;
  readonly line?: string;
  readonly backgroundColor?: string;
  readonly color?: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly bg: string;
  readonly bgDeep: string;
  readonly display: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  bg: '#0a0b10',
  bgDeep: '#04050a',
  display: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** The shots, in order. Two or more. */
  readonly shots?: readonly Shot[];
  /**
   * Direction of each whip, one per gap. Cycles if it is shorter than the gaps.
   * Alternating the axis is what stops three cuts reading as one long move.
   */
  readonly directions?: readonly NonNullable<WhipPanProps['direction']>[];
  /** Peak blur in pixels. Above ~40 the shot is unreadable at the midpoint. */
  readonly blur?: number;
  readonly overshoot?: number;
  /**
   * Length of each whip. 10–14 is the band: below 8 it reads as a hard cut with
   * a glitch on it, above 20 the audience has time to look at the smear.
   */
  readonly transitionFrames?: number;
  /** Frames each shot holds. The last one holds this plus one transition. */
  readonly holdFrames?: number;
  readonly backgroundColor?: string;
  /** Ground for a shot that has no `src`. Defaults to `theme.bg`. */
  readonly cardColor?: string;
};

const SHOTS: Shot[] = [
  {src: staticFile('footage/broll-earth.mp4'), kicker: 'ONE', line: 'Both scenes move'},
  {src: staticFile('footage/broll-night.mp4'), kicker: 'TWO', line: 'together, one frame apart'},
  {src: staticFile('footage/broll-eva.mp4'), kicker: 'THREE', line: 'and the blur peaks in the middle'},
  {src: staticFile('footage/broll-sunrise.mp4'), kicker: 'FOUR', line: 'so it reads as a camera'},
];

const ShotView: React.FC<{shot: Shot;
  fontFamily: string;
  /** Threaded: at module scope a bare `theme` is not in lexical reach. */
  cardColor: string;
}> = ({shot, fontFamily, cardColor}) => {
  const frame = useCurrentFrame();
  const color = shot.color ?? '#f6f5f2';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: shot.backgroundColor ?? cardColor,
        color,
        fontFamily,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 140px 120px',
        textAlign: 'center',
      }}
    >
      {shot.src ? (
        // objectFit is a PROP on @remotion/media's <Video> — it draws to a
        // canvas, so the CSS property in `style` is inert. And the wrapping
        // AbsoluteFill gives `cover` a definite box to crop against, because
        // AbsoluteFill is a column flex container and a bare <Video> inside one
        // lays out at its intrinsic aspect.
        <AbsoluteFill>
          <Video
            src={shot.src}
            objectFit="cover"
            muted
            loop
            style={{width: '100%', height: '100%'}}
          />
          {/* The type has to survive whatever the footage does under it, and the
              footage is moving, so the contrast is brought with the type rather
              than hoped for. */}
          <AbsoluteFill
            style={{
              backgroundImage:
                'linear-gradient(to top, rgba(8,7,12,0.86) 0%, rgba(8,7,12,0.42) 34%, rgba(8,7,12,0) 62%)',
            }}
          />
        </AbsoluteFill>
      ) : null}

      <Interactive.Div
        name="Kicker"
        style={{
          position: 'relative',
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '0.4em',
          marginRight: '-0.4em',
          opacity: 0.62,
          marginBottom: 26,
        }}
      >
        {shot.kicker}
      </Interactive.Div>
      <Interactive.Div
        name="Line"
        style={{
          position: 'relative',
          fontSize: 104,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          textShadow: '0 6px 40px rgba(0,0,0,0.6)',
          // A slow drift under the whip: the shot is never quite still, which is
          // what makes the cut feel like it interrupted something.
          scale: interpolate(frame, [0, 60], [1, 1.05], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {shot.line}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const WhipPan: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  shots = SHOTS,
  directions = ['left', 'up', 'right'],
  blur = 30,
  overshoot = 1,
  transitionFrames = 12,
  holdFrames = 52,
  backgroundColor = theme.bgDeep,
  cardColor = theme.bg,
}) => {
  const timing = linearTiming({durationInFrames: transitionFrames});

  return (
    <AbsoluteFill style={{backgroundColor}}>
      <TransitionSeries>
        {shots.map((shot, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence
              // A TransitionSeries subtracts every transition from the total, so
              // the final shot has to carry one extra transition's worth or the
              // composition ends mid-whip.
              durationInFrames={i === shots.length - 1 ? holdFrames + transitionFrames : holdFrames}
              name={shot.kicker ?? `Shot ${i + 1}`}
            >
              <ShotView shot={shot} fontFamily={fontFamily} cardColor={cardColor} />
            </TransitionSeries.Sequence>
            {i < shots.length - 1 ? (
              <TransitionSeries.Transition
                presentation={whipPan({
                  direction: directions[i % directions.length],
                  blur,
                  overshoot,
                })}
                timing={timing}
              />
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
