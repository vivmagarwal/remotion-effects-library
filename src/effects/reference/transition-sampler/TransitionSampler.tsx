import {AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {iris} from '@remotion/transitions/iris';
import {flip} from '@remotion/transitions/flip';
import {loadFont} from '@remotion/google-fonts/Sora';

// palette: data whole-file — eight card faces that must contrast with EACH OTHER for a transition to be visible at all; agreeing with the house would make the sampler show nothing

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Transition Sampler
 *
 * Six presentations from `@remotion/transitions`, back to back, each labelled
 * with the exact call that produced it. A reference card as much as an effect —
 * change one `presentation={…}` line to audition a different cut.
 *
 * The cards are flat numbered colours ON PURPOSE, which is why this one does not
 * take footage the way the other transition effects do. To judge a wipe you have
 * to be able to tell instantly which half of the frame is the old scene and
 * which is the new one, and two pieces of real footage make that harder, not
 * easier. The colours are the instrument; the transition is the subject.
 *
 * The hold is the number that breaks this if you change it carelessly, so it is
 * clamped rather than trusted — see `hold` below.
 */

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
  /**
   * Frames each card is on screen. Clamped up to the minimum that keeps every
   * card visible on its own — see the note where it is used.
   */
  readonly holdFrames?: number;
  /** Show the `presentation={…}` call under each label. */
  readonly showCode?: boolean;
  /**
   * Behind everything. flip() rotates both planes in 3D and exposes the root at
   * its midpoint, so this colour IS a frame of the render, not a fallback.
   */
  readonly backdropColor?: string;
  /** One {bg, fg} per card, cycled. Adjacent entries must contrast with each other. */
  readonly palette?: readonly {readonly bg: string; readonly fg: string}[];
};

const PALETTE = [
  {bg: '#ff5c39', fg: '#160603'},
  {bg: '#2f6bff', fg: '#f2f6ff'},
  {bg: '#ffd166', fg: '#1a1405'},
  {bg: '#12c48b', fg: '#04150e'},
  {bg: '#a78bfa', fg: '#15092b'},
  {bg: '#f43f5e', fg: '#1c0409'},
  {bg: '#0ea5e9', fg: '#03151f'},
];

const Card: React.FC<{
  index: number;
  label: string;
  code: string;
  showCode: boolean;
  palette: Props['palette'];
}> = ({index, label, code, showCode, palette = PALETTE}) => {
  const frame = useCurrentFrame();
  const {bg, fg} = palette[index % palette.length];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        color: fg,
        fontFamily,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Interactive.Div
        name="Index"
        style={{
          fontSize: 300,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.05em',
          // A small settle on every card entry so the cards themselves feel alive.
          scale: interpolate(frame, [0, 16], [0.92, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </Interactive.Div>
      <Interactive.Div name="Label" style={{fontSize: 78, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 18}}>
        {label}
      </Interactive.Div>
      {showCode ? (
        <Interactive.Div
          name="Code"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 26,
            opacity: 0.62,
            marginTop: 22,
          }}
        >
          {code}
        </Interactive.Div>
      ) : null}
    </AbsoluteFill>
  );
};

export const TransitionSampler: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  holdFrames = 56,
  showCode = true,
  backdropColor = '#08070c',
  palette = PALETTE,
}) => {
  const {width, height} = useVideoConfig();
  // Each card must outlive the transitions on BOTH sides of it, or two cuts
  // overlap and three cards are on screen at once with two labels superimposed.
  // The longest neighbouring pair here is the 20-frame clockWipe next to the
  // 18-frame iris, and a card needs solo frames on top of that to be read at
  // all — 18 is about a hold at 30fps. So the floor is 20 + 18 + 18 = 56, and
  // holdFrames is clamped up to it rather than trusted: a caller who passes 30
  // gets a working sampler, not three superimposed labels.
  const hold = Math.max(56, Math.round(holdFrames));

  return (
    // flip() rotates both planes in 3D and exposes the root at its midpoint —
    // without this backdrop that reads as a white flash where a cut should be.
    <AbsoluteFill style={{backgroundColor: backdropColor}}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={hold} name="Intro">
        <Card index={0} label="Transitions" code="@remotion/transitions"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: 14})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Fade">
        <Card index={1} label="Fade" code="fade()"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={springTiming({config: {damping: 200}, durationInFrames: 16})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Slide">
        <Card index={2} label="Slide" code="slide({direction: 'from-right'})"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({direction: 'from-bottom-left'})}
        timing={linearTiming({durationInFrames: 14})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Wipe">
        <Card index={3} label="Wipe" code="wipe({direction: 'from-bottom-left'})"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={clockWipe({width, height})}
        timing={linearTiming({durationInFrames: 20})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="ClockWipe">
        <Card index={4} label="Clock wipe" code="clockWipe({width, height})"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={iris({width, height})}
        timing={linearTiming({durationInFrames: 18})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Iris">
        <Card index={5} label="Iris" code="iris({width, height})"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={flip({direction: 'from-left'})}
        timing={springTiming({config: {damping: 200}, durationInFrames: 18})}
      />
      <TransitionSeries.Sequence durationInFrames={hold + 8} name="Flip">
        <Card index={6} label="Flip" code="flip({direction: 'from-left'})"  showCode={showCode} palette={palette} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </AbsoluteFill>
  );
};
