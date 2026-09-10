import React from 'react';
import {AbsoluteFill, Interactive, Solid, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {TransitionSeries} from '@remotion/transitions';
import {lightLeak} from '@remotion/effects/light-leak';
import {loadFont} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: serif} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500'], subsets: ['latin']});

/**
 * Light Leak Transition
 *
 * A film-style light leak washing over the cut point.
 *
 * The distinction this exists to teach is `<TransitionSeries.Overlay>` versus
 * `<TransitionSeries.Transition>`. A **Transition** plays two scenes at once and
 * SHORTENS the composition by its own length. An **Overlay** renders on top of
 * the cut and leaves the timeline untouched — which is exactly what a leak is:
 * an artefact of the film, not a way of getting from one shot to the next. Reach
 * for a Transition and the cut lands in a different place than you wrote it.
 *
 * The leak itself is the `lightLeak()` effect on a `<Solid>`, driven 0→1 across
 * the overlay's own duration — which is why `<Leak>` reads `durationInFrames`
 * from `useVideoConfig()` rather than taking it as a prop: inside a Sequence
 * that value is the SEQUENCE's length, so the same component works at any
 * overlay length with no arithmetic.
 */

/**
 * One shot. Give it a `src` for footage; leave `src` out and it draws a
 * typographic card on `backgroundColor` instead.
 */
export type Shot = {
  readonly src?: string;
  readonly title?: string;
  readonly caption?: string;
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
  readonly display: string;
  readonly text: string;
  readonly bgDeep: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  display: serif,
  text: sans,
  bgDeep: '#04050a',
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** CSS family for the display face. Defaults to this file's own, or the theme's. */
  readonly displayFamily?: string;
  /** CSS family for the supporting text. Defaults to this file's Inter, or the theme's. */
  readonly textFamily?: string;
  /** The shots, in order. Two or more. */
  readonly shots?: readonly Shot[];
  /**
   * Length of each leak. 24–36 is the band: a leak is a slow bloom, and under
   * ~20 frames it reads as a white flash frame rather than as light.
   */
  readonly leakFrames?: number;
  /** Frames each shot holds. Unlike a Transition, an Overlay does not eat any. */
  readonly holdFrames?: number;
  /**
   * How the leak composites. 'screen' is the film-accurate one — a leak adds
   * light. 'normal' gives you the flat colour card, which is occasionally what a
   * hard flash cut wants.
   */
  readonly blendMode?: React.CSSProperties['mixBlendMode'];
  /** Ceiling on the leak. Below ~0.7 it stops reading as an exposure fault. */
  readonly leakOpacity?: number;
  readonly backgroundColor?: string;
};

const SHOTS: Shot[] = [
  {src: staticFile('footage/broll-sunrise.mp4'), title: 'Golden hour', caption: 'shot one'},
  {src: staticFile('footage/broll-earth.mp4'), title: 'Blue hour', caption: 'shot two'},
  {src: staticFile('footage/broll-night.mp4'), title: 'Night', caption: 'shot three'},
];

const ShotView: React.FC<{shot: Shot; displayFamily: string; textFamily: string}> = ({
  shot,
  displayFamily,
  textFamily,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: shot.backgroundColor ?? '#1d1b17',
        justifyContent: 'center',
        alignItems: 'center',
        color: shot.color ?? '#f6f5f2',
      }}
    >
      {shot.src ? (
        <AbsoluteFill>
          {/* objectFit is a prop, not a style: <Video> draws to a canvas. */}
          <Video src={shot.src} objectFit="cover" muted loop style={{width: '100%', height: '100%'}} />
          <AbsoluteFill style={{backgroundColor: 'rgba(8,7,12,0.42)'}} />
        </AbsoluteFill>
      ) : null}

      <Interactive.Div
        name="Title"
        style={{
          position: 'relative',
          fontFamily: displayFamily,
          fontSize: 148,
          letterSpacing: '-0.02em',
          textShadow: '0 8px 48px rgba(0,0,0,0.6)',
          scale: interpolate(frame, [0, 60], [1.05, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {shot.title}
      </Interactive.Div>
      <Interactive.Div
        name="Caption"
        style={{
          position: 'relative',
          fontFamily: textFamily,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '0.3em',
          marginRight: '-0.3em',
          textTransform: 'uppercase',
          opacity: 0.72,
          marginTop: 18,
          textShadow: '0 2px 18px rgba(0,0,0,0.8)',
        }}
      >
        {shot.caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

/**
 * The leak: a <Solid> with the lightLeak effect driven across 0→1. It reads its
 * own length from useVideoConfig(), which inside the Overlay's Sequence is the
 * OVERLAY's length — so it needs no props and adapts to `leakFrames`.
 *
 * The blend mode is not decoration. `lightLeak()` peaks at progress 0.5 and at
 * that instant the Solid is fully opaque, so composited normally the leak's
 * midpoint is a flat orange card covering the picture for several frames — which
 * reads as a missing shot, not as light. Film leaks ADD light; they never
 * replace the image. `screen` is that, in one property.
 */
const Leak: React.FC<{blendMode: React.CSSProperties['mixBlendMode']; opacity: number}> = ({
  blendMode,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{mixBlendMode: blendMode, opacity}}>
      <Solid
        width={width}
        height={height}
        effects={[
          lightLeak({
            progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }),
        ]}
      />
    </AbsoluteFill>
  );
};

export const LightLeakTransition: React.FC<Props> = ({
  theme = THEME,
  displayFamily = theme.display,
  textFamily = theme.text,
  shots = SHOTS,
  leakFrames = 30,
  holdFrames = 70,
  blendMode = 'screen',
  leakOpacity = 0.92,
  backgroundColor = theme.bgDeep,
}) => (
  <AbsoluteFill style={{backgroundColor}}>
    <TransitionSeries>
      {shots.map((shot, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={holdFrames} name={shot.title ?? `Shot ${i + 1}`}>
            <ShotView shot={shot} displayFamily={displayFamily} textFamily={textFamily} />
          </TransitionSeries.Sequence>
          {/* Straddles the cut and costs the timeline nothing. Every shot keeps
              its full `holdFrames`, which is the whole point of an Overlay. */}
          {i < shots.length - 1 ? (
            <TransitionSeries.Overlay durationInFrames={leakFrames}>
              <Leak blendMode={blendMode} opacity={leakOpacity} />
            </TransitionSeries.Overlay>
          ) : null}
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);
