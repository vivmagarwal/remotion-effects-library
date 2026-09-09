import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {pixelDissolve} from '@remotion/effects/pixel-dissolve';
import {pixelate} from '@remotion/effects/pixelate';
import {loadFont} from '@remotion/google-fonts/JetBrainsMono';

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Pixel Dissolve Reveal
 * An image materialising out of nothing: a coarse mosaic resolves to full
 * detail while a pixel dissolve fills the frame in. Both are driven by the same
 * progress and moved in opposite directions — the dissolve fills as the mosaic
 * sharpens — so the picture arrives once rather than twice.
 */

type Props = {
  readonly src?: string;
  readonly title?: string;
  readonly readout?: string;
  /** Frames the materialise takes. */
  readonly revealFrames?: number;
  readonly startAt?: number;
  /** Coarsest mosaic block size, in pixels. */
  readonly maxBlock?: number;
  readonly gridColumns?: number;
  readonly gridRows?: number;
  readonly accentColor?: string;
};

export const PixelDissolveReveal: React.FC<Props> = ({
  src,
  title = 'DECODING PLATE 04',
  readout = 'blocks resolving · dissolve filling',
  revealFrames = 90,
  startAt = 14,
  maxBlock = 64,
  gridColumns = 44,
  gridRows = 26,
  accentColor = '#c6ff3d',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // One progress. Everything below reads from it, in opposite directions.
  const progress = interpolate(frame, [startAt, startAt + revealFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.36, 0, 0.18, 1),
  });

  // Mosaic sharpens: big blocks → 1px. Below 1 the effect is a no-op, so clamp.
  const block = Math.max(1, maxBlock * (1 - progress));
  // Dissolve fills. Its own `progress` is how much of the image is present.
  const dissolve = progress;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#07080d', overflow: 'hidden', fontFamily}}>
      <CanvasImage
        src={src ?? staticFile('plate-1.svg')}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        effects={[
          // Order matters: mosaic first, then dissolve the mosaic. Reversed, the
          // dissolve's own hard block edges get re-blocked and it reads as noise.
          pixelate({blockSize: block}),
          pixelDissolve({
            progress: dissolve,
            columns: gridColumns,
            rows: gridRows,
            seed: 7,
            feather: 0.35,
          }),
        ]}
      />

      {/* Scan grid, fading out as the picture resolves. */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${accentColor}22 1px, transparent 1px), linear-gradient(90deg, ${accentColor}22 1px, transparent 1px)`,
          backgroundSize: `${100 / gridColumns}% ${100 / gridRows}%`,
          opacity: 0.5 * (1 - progress),
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill style={{justifyContent: 'space-between', padding: '70px 86px', pointerEvents: 'none'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <Interactive.Div
            name="Title"
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: accentColor,
              textShadow: '0 2px 14px rgba(0,0,0,0.7)',
            }}
          >
            {title}
          </Interactive.Div>
          <Interactive.Div
            name="Percent"
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: accentColor,
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 2px 14px rgba(0,0,0,0.7)',
            }}
          >
            {String(Math.round(progress * 100)).padStart(3, '0')}%
          </Interactive.Div>
        </div>

        <div>
          <Interactive.Div
            name="Readout"
            style={{
              fontSize: 24,
              color: '#c9cedd',
              marginBottom: 16,
              textShadow: '0 2px 14px rgba(0,0,0,0.8)',
            }}
          >
            {readout}
          </Interactive.Div>
          <div style={{height: 4, backgroundColor: '#ffffff22', borderRadius: 2}}>
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                backgroundColor: accentColor,
                width: `${progress * 100}%`,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
