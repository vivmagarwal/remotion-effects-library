import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {brightness} from '@remotion/effects/brightness';
import {saturation} from '@remotion/effects/saturation';
import {contrast} from '@remotion/effects/contrast';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['600', '800'], subsets: ['latin']});

/**
 * Before / After Wipe
 * A draggable-looking split comparison. Both images are drawn full-frame, one on
 * top of the other, and only the top one is clipped — so the two halves stay in
 * perfect registration no matter where the handle is. Scaling or cropping either
 * side instead is what makes most comparison wipes look subtly wrong.
 */

type Props = {
  readonly src?: string;
  readonly beforeLabel?: string;
  readonly afterLabel?: string;
  readonly accentColor?: string;
  /** Keyframes for the handle, as [frame, percent] pairs. */
  readonly sweep?: readonly (readonly [number, number])[];
};

export const BeforeAfterWipe: React.FC<Props> = ({
  src,
  beforeLabel = 'BEFORE',
  afterLabel = 'AFTER',
  accentColor = '#ffffff',
  sweep = [
    [0, 8],
    [45, 82],
    [80, 30],
    [120, 62],
    [150, 50],
  ],
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const source = src ?? staticFile('footage/broll-earth.mp4');

  const x = interpolate(
    frame,
    sweep.map(([f]) => f),
    sweep.map(([, p]) => p),
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.25, 1),
    },
  );

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden', fontFamily}}>
      {/* AFTER — the graded version, full frame, underneath. */}
      <Video
        src={source}
        muted
        loop
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        effects={[saturation({amount: 1.5}), contrast({amount: 1.18})]}
      />

      {/* BEFORE — also full frame, clipped to the left of the handle.
          Both layers are identical geometry; only the clip moves. */}
      <AbsoluteFill style={{clipPath: `inset(0 ${100 - x}% 0 0)`}}>
        <Video
          src={source}
          muted
          loop
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          effects={[saturation({amount: 0.22}), contrast({amount: 0.82}), brightness({amount: 0.06})]}
        />
      </AbsoluteFill>

      {/* The handle */}
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: 0,
          bottom: 0,
          width: 5,
          marginLeft: -2.5,
          backgroundColor: accentColor,
          boxShadow: '0 0 26px rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: '50%',
          width: 96,
          height: 96,
          marginLeft: -48,
          marginTop: -48,
          borderRadius: '50%',
          backgroundColor: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: '#1d1b17',
          fontSize: 34,
          fontWeight: 800,
          boxShadow: '0 10px 34px rgba(0,0,0,0.45)',
        }}
      >
        ◀ ▶
      </div>

      {/* Labels, each fading out as the handle approaches its side. */}
      <Interactive.Div
        name="Before label"
        style={{
          position: 'absolute',
          left: 64,
          top: 60,
          padding: '14px 26px',
          borderRadius: 10,
          backgroundColor: 'rgba(12,13,18,0.72)',
          color: '#fff',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.2em',
          opacity: interpolate(x, [12, 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {beforeLabel}
      </Interactive.Div>

      <Interactive.Div
        name="After label"
        style={{
          position: 'absolute',
          right: 64,
          top: 60,
          padding: '14px 26px',
          borderRadius: 10,
          backgroundColor: 'rgba(12,13,18,0.72)',
          color: '#fff',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.2em',
          opacity: interpolate(x, [74, 88], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {afterLabel}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
