import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Anton';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: display} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Stat Slam
 * One number arrives hard. The impact is built from three things landing on the
 * same frame: the number stops dead from a big scale, a shockwave ring expands
 * out of it, and the whole frame kicks a few pixels. Any one alone is weak.
 */

type Props = {
  readonly stat?: string;
  readonly context?: string;
  readonly source?: string;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
  readonly impactFrame?: number;
};

export const StatSlam: React.FC<Props> = ({
  stat = '73%',
  context = 'of viewers drop off in the first 3 seconds',
  source = 'Source: every analytics dashboard, ever',
  backgroundColor = '#0a0a0f',
  color = '#ffffff',
  accentColor = '#ff2d55',
  impactFrame = 14,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const since = frame - impactFrame;

  // The slam: from far too big down to 1, arriving exactly on impactFrame.
  const slam = interpolate(frame, [0, impactFrame], [7, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.9, 0.1, 1),
    output: 'perceptual-scale',
  });

  // A tiny recoil after landing, so it does not just stop.
  const recoil = interpolate(since, [0, 4, 14], [1, 0.972, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Whole-frame camera kick.
  const kick = interpolate(since, [0, 3, 10], [0, 14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ringScale = interpolate(since, [0, 26], [0.2, 3.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.1, 0.9, 0.2, 1),
    output: 'perceptual-scale',
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        overflow: 'hidden',
        // The kick moves everything, which is why it reads as the camera and not an element.
        translate: `${Math.sin(since * 2.4) * kick}px ${Math.cos(since * 3.1) * kick * 0.6}px`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 46%, ${accentColor}22 0%, transparent 60%)`,
        }}
      />

      {/* Shockwave */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: 620,
            height: 620,
            borderRadius: '50%',
            border: `4px solid ${accentColor}`,
            scale: ringScale,
            opacity: interpolate(since, [0, 26], [0.75, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Interactive.Div
          name="Stat"
          style={{
            fontFamily: display,
            fontSize: 430,
            lineHeight: 0.86,
            letterSpacing: '-0.03em',
            color,
            scale: slam * recoil,
            opacity: interpolate(frame, [0, 4], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {stat}
        </Interactive.Div>

        {/* Accent rule that snaps open on impact. */}
        <div
          style={{
            height: 7,
            backgroundColor: accentColor,
            marginTop: 22,
            width: interpolate(since, [2, 16], [0, 760], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.14, 0.9, 0.2, 1),
            }),
          }}
        />

        <Interactive.Div
          name="Context"
          style={{
            fontFamily: sans,
            fontSize: 52,
            fontWeight: 700,
            color: '#c9ccd6',
            marginTop: 30,
            maxWidth: 1250,
            textAlign: 'center',
            translate: interpolate(since, [6, 24], ['0px 26px', '0px 0px'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(since, [6, 22], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {context}
        </Interactive.Div>

        <Interactive.Div
          name="Source"
          style={{
            fontFamily: sans,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '0.1em',
            color: '#5d6172',
            marginTop: 34,
            opacity: interpolate(since, [22, 40], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {source}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
