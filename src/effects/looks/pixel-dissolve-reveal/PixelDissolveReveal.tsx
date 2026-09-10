import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';
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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly mono: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  mono: fontFamily,
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
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
  theme = THEME,
  fontFamily = theme.mono,
  src,
  title = 'DECODING PLATE 04',
  readout = 'blocks resolving · dissolve filling',
  revealFrames = 90,
  startAt = 14,
  maxBlock = 64,
  gridColumns = 44,
  gridRows = 26,
  accentColor = theme.series[2],
}) => {
  const frame = useCurrentFrame();

  // One progress. Everything below reads from it, in opposite directions.
  const progress = interpolate(frame, [startAt, startAt + revealFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.36, 0, 0.18, 1),
  });

  // Mosaic sharpens: big blocks → 1px. Below 1 the effect is a no-op, so clamp.
  const block = Math.max(1, maxBlock * (1 - progress));
  /**
   * Dissolve fills — and this is the one inversion in the file.
   *
   * `pixelDissolve`'s own `progress` is **how much of the image has dissolved
   * AWAY**, not how much has arrived: at 0 the plate is fully present and at 1
   * the frame is empty. Verified by rendering the same plate at 0, 0.25, 0.5,
   * 0.75 and 1 side by side. So a *reveal* has to count down. Passing this
   * effect's own 0→1 `progress` straight through runs the shot backwards and,
   * because it ends empty, leaves a black poster frame that renders without
   * error — which is exactly the bug this comment exists to stop.
   */
  const dissolve = 1 - progress;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden', fontFamily}}>
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
              color: theme.muted,
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
