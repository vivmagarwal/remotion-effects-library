import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {radialProgressiveBlur} from '@remotion/effects/radial-progressive-blur';
import {linearProgressiveBlur} from '@remotion/effects/linear-progressive-blur';
import {vignette} from '@remotion/effects/vignette';
import {loadFont} from '@remotion/google-fonts/DMSans';

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Progressive Blur Focus
 * A rack focus: the blur is *progressive*, sharp at a point and softening
 * outward, rather than a uniform blur ramped up and down. That is what a lens
 * actually does, and it is why this reads as a camera pulling focus rather than
 * as a filter being faded in.
 */

type Props = {
  readonly src?: string;
  readonly title?: string;
  readonly caption?: string;
  /** [frame, radius] pairs — the focus pull. */
  readonly rack?: readonly (readonly [number, number])[];
  readonly focusX?: number;
  readonly focusY?: number;
};

export const ProgressiveBlurFocus: React.FC<Props> = ({
  src,
  title = 'Rack focus',
  caption = 'radialProgressiveBlur — sharp at a point, soft outward',
  rack = [
    [0, 0.06],
    [45, 0.72],
    [95, 0.1],
    [140, 0.55],
  ],
  focusX = 0.5,
  focusY = 0.72,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const focus = interpolate(
    frame,
    rack.map(([f]) => f),
    rack.map(([, r]) => r),
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      // A lens pull accelerates and settles; linear reads as mechanical.
      easing: Easing.bezier(0.42, 0, 0.28, 1),
    },
  );

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden', fontFamily}}>
      <CanvasImage
        src={src ?? staticFile('sample-city.svg')}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        effects={[
          // Sharp inside the ellipse's `start` band around (focusX, focusY),
          // ramping to `endBlur` at the ellipse line. Coordinates are UV (0–1).
          radialProgressiveBlur({
            center: [focusX, focusY],
            width: 1.1,
            height: 0.95,
            start: 0.18,
            startBlur: 0,
            endBlur: 42 * focus,
          }),
          // A second, top-down falloff — the way a shallow plane of focus behaves.
          linearProgressiveBlur({
            start: [0.5, 0.42],
            end: [0.5, 0],
            startBlur: 0,
            endBlur: 22 * focus,
          }),
          vignette({amount: 0.45, radius: 0.78, feather: 0.6}),
        ]}
      />

      {/* Focus reticle, so the pull is legible as a deliberate camera move. */}
      <div
        style={{
          position: 'absolute',
          left: `${focusX * 100}%`,
          top: `${focusY * 100}%`,
          width: 128,
          height: 128,
          marginLeft: -64,
          marginTop: -64,
          border: '3px solid rgba(255,255,255,0.85)',
          borderRadius: 6,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.35), 0 6px 20px rgba(0,0,0,0.4)',
          // Tightens as the shot comes into focus.
          scale: 0.72 + focus * 0.5,
          opacity: 0.45 + (1 - focus) * 0.45,
        }}
      />

      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 96px 86px'}}>
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            textShadow: '0 10px 40px rgba(0,0,0,0.6)',
            // The type stays sharp — it lives above the lens, not in front of it.
            opacity: interpolate(frame, [10, 34], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Caption"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 26,
            color: 'rgba(255,255,255,0.72)',
            marginTop: 12,
            opacity: interpolate(frame, [22, 46], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {caption}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
