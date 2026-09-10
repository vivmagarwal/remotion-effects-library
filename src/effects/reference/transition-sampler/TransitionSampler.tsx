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
 * Six presentations from @remotion/transitions, back to back, each labelled with
 * the exact call that produced it. A reference card as much as an effect —
 * change one `presentation={…}` line to audition a different cut.
 */

const PALETTE = [
  {bg: '#ff5c39', fg: '#160603'},
  {bg: '#2f6bff', fg: '#f2f6ff'},
  {bg: '#ffd166', fg: '#1a1405'},
  {bg: '#12c48b', fg: '#04150e'},
  {bg: '#a78bfa', fg: '#15092b'},
  {bg: '#f43f5e', fg: '#1c0409'},
  {bg: '#0ea5e9', fg: '#03151f'},
];

const Card: React.FC<{index: number; label: string; code: string}> = ({index, label, code}) => {
  const frame = useCurrentFrame();
  const {bg, fg} = PALETTE[index % PALETTE.length];

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
    </AbsoluteFill>
  );
};

export const TransitionSampler: React.FC = () => {
  const {width, height} = useVideoConfig();
  // Each card must outlive the transitions on BOTH sides of it, or two cuts
  // overlap and three cards are on screen at once with two labels superimposed.
  // Hold 56 against a worst case of 20 + 18, leaving every card ≥18 solo frames.
  const hold = 56;

  return (
    // flip() rotates both planes in 3D and exposes the root at its midpoint —
    // without this backdrop that reads as a white flash where a cut should be.
    <AbsoluteFill style={{backgroundColor: '#08070c'}}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={hold} name="Intro">
        <Card index={0} label="Transitions" code="@remotion/transitions" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: 14})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Fade">
        <Card index={1} label="Fade" code="fade()" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={springTiming({config: {damping: 200}, durationInFrames: 16})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Slide">
        <Card index={2} label="Slide" code="slide({direction: 'from-right'})" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({direction: 'from-bottom-left'})}
        timing={linearTiming({durationInFrames: 14})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Wipe">
        <Card index={3} label="Wipe" code="wipe({direction: 'from-bottom-left'})" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={clockWipe({width, height})}
        timing={linearTiming({durationInFrames: 20})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="ClockWipe">
        <Card index={4} label="Clock wipe" code="clockWipe({width, height})" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={iris({width, height})}
        timing={linearTiming({durationInFrames: 18})}
      />
      <TransitionSeries.Sequence durationInFrames={hold} name="Iris">
        <Card index={5} label="Iris" code="iris({width, height})" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={flip({direction: 'from-left'})}
        timing={springTiming({config: {damping: 200}, durationInFrames: 18})}
      />
      <TransitionSeries.Sequence durationInFrames={hold + 8} name="Flip">
        <Card index={6} label="Flip" code="flip({direction: 'from-left'})" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </AbsoluteFill>
  );
};
