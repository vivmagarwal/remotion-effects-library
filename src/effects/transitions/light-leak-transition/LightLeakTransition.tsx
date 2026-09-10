import {AbsoluteFill, Interactive, Solid, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries} from '@remotion/transitions';
import {lightLeak} from '@remotion/effects/light-leak';
import {loadFont} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

// palette: data whole-file — the hues of a film light leak, plus two card faces either side of it

const {fontFamily: serif} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500'], subsets: ['latin']});

/**
 * Light Leak Transition
 * A film-style light leak washing over the cut point. This uses
 * <TransitionSeries.Overlay> rather than .Transition — an overlay sits ON TOP of
 * the cut without shortening the timeline, which is exactly what a leak is: an
 * artefact of the film, not a way of getting from one shot to the next.
 */

const Card: React.FC<{title: string; caption: string; bg: string; fg: string}> = ({
  title,
  caption,
  bg,
  fg,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        justifyContent: 'center',
        alignItems: 'center',
        color: fg,
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontFamily: serif,
          fontSize: 148,
          letterSpacing: '-0.02em',
          scale: interpolate(frame, [0, 60], [1.05, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Caption"
        style={{
          fontFamily: sans,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '0.3em',
          marginRight: '-0.3em',
          textTransform: 'uppercase',
          opacity: 0.6,
          marginTop: 18,
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

/** The leak itself: a <Solid> with the lightLeak effect, driven across 0→1. */
const Leak: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();

  return (
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
  );
};

export const LightLeakTransition: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70} name="Shot A">
      <Card title="Golden hour" caption="shot one" bg="#1d1410" fg="#f5e9d8" />
    </TransitionSeries.Sequence>

    {/* An Overlay sits on top of the cut. It does NOT shorten the timeline. */}
    <TransitionSeries.Overlay durationInFrames={30}>
      <Leak />
    </TransitionSeries.Overlay>

    <TransitionSeries.Sequence durationInFrames={70} name="Shot B">
      <Card title="Blue hour" caption="shot two" bg="#0e1420" fg="#dbe6f5" />
    </TransitionSeries.Sequence>

    <TransitionSeries.Overlay durationInFrames={30} offset={0}>
      <Leak />
    </TransitionSeries.Overlay>

    <TransitionSeries.Sequence durationInFrames={70} name="Shot C">
      <Card title="Night" caption="shot three" bg="#08080e" fg="#c9cede" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
