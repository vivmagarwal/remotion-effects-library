import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/BebasNeue';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Parallax Layers
 * A camera move through a layered scene. Depth comes from one rule: a layer's
 * travel is its depth times the camera move. Everything else — blur, scale,
 * haze — follows from the same depth value, so a layer can never look near in
 * one respect and far in another.
 */

type Layer = {
  /** 0 = infinitely far, 1 = at the camera. */
  readonly depth: number;
  readonly color: string;
  /** Silhouette peaks, as [x%, height%] pairs. */
  readonly ridge: readonly (readonly [number, number])[];
};

type Props = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly layers?: readonly Layer[];
  readonly skyTop?: string;
  readonly skyBottom?: string;
  /** How far the camera tracks across, in percent of the frame. */
  readonly cameraTravel?: number;
};

export const ParallaxLayers: React.FC<Props> = ({
  title = 'DEPTH',
  subtitle = 'one rule: travel = depth × camera',
  layers = [
    {depth: 0.12, color: '#4a5a7e', ridge: [[0, 34], [22, 52], [44, 30], [68, 48], [88, 26], [100, 40]]},
    {depth: 0.28, color: '#3a4763', ridge: [[0, 26], [18, 44], [40, 22], [62, 40], [84, 20], [100, 34]]},
    {depth: 0.5, color: '#2a3349', ridge: [[0, 20], [26, 36], [52, 16], [74, 32], [100, 22]]},
    {depth: 0.78, color: '#1a1f2e', ridge: [[0, 14], [30, 28], [58, 10], [82, 24], [100, 16]]},
    {depth: 1, color: '#0d1017', ridge: [[0, 8], [34, 20], [66, 6], [100, 14]]},
  ],
  skyTop = '#12183a',
  skyBottom = '#e0765b',
  cameraTravel = 22,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // A single camera value. Every layer reads from this and nothing else.
  const camera = interpolate(frame, [0, durationInFrames], [0, cameraTravel], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        overflow: 'hidden',
        backgroundImage: `linear-gradient(${skyTop} 0%, #6b3f74 46%, ${skyBottom} 100%)`,
      }}
    >
      {/* Sun, treated as an infinitely distant layer: depth 0, so it never moves. */}
      <div
        style={{
          position: 'absolute',
          left: '58%',
          top: '32%',
          width: 300,
          height: 300,
          marginLeft: -150,
          borderRadius: '50%',
          backgroundImage: 'radial-gradient(circle, #ffe9b0 0%, #ffb26b 58%, #ffb26b00 74%)',
        }}
      />

      {/* Stars, also at depth 0. */}
      {new Array(60).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${random(`sx-${i}`) * 100}%`,
            top: `${random(`sy-${i}`) * 42}%`,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: '#ffffff',
            opacity: 0.2 + random(`so-${i}`) * 0.6,
          }}
        />
      ))}

      {layers.map((layer, i) => {
        // The one rule. Everything below is derived from `depth`.
        const shift = -camera * layer.depth;
        const points = layer.ridge
          .map(([x, h]) => `${x}% ${100 - h}%`)
          .concat(['100% 100%', '0% 100%'])
          .join(', ');

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              // Oversized, so panning never exposes an edge.
              left: '-20%',
              right: '-20%',
              top: 0,
              bottom: 0,
              backgroundColor: layer.color,
              clipPath: `polygon(${points})`,
              translate: `${shift}% 0px`,
              // Near layers sit lower and larger; far layers are hazier.
              scale: 1 + layer.depth * 0.06,
              filter: `blur(${(1 - layer.depth) * 2.6}px)`,
              opacity: 0.55 + layer.depth * 0.45,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily,
          // The title sits just in front of the nearest ridge — enough to separate
          // from it, not so much that it pans out of frame by the end.
          translate: `${-camera * 0.55}% 0px`,
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 300,
            letterSpacing: '0.14em',
            color: '#ffe9d6',
            textShadow: '0 20px 60px rgba(0,0,0,0.5)',
            opacity: interpolate(frame, [8, 34], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Subtitle"
          style={{
            fontSize: 32,
            letterSpacing: '0.36em',
            color: '#ffd9c0',
            marginTop: -14,
            opacity: interpolate(frame, [24, 48], [0, 0.85], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
