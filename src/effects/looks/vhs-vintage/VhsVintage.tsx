import {AbsoluteFill, Interactive, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {scanlines} from '@remotion/effects/scanlines';
import {chromaticAberration} from '@remotion/effects/chromatic-aberration';
import {noise} from '@remotion/effects/noise';
import {vignette} from '@remotion/effects/vignette';
import {barrelDistortion} from '@remotion/effects/barrel-distortion';
import {loadFont} from '@remotion/google-fonts/VT323';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * VHS / Vintage
 * A stack of five WebGL effects turns clean source into 1987 tape. Order matters:
 * barrel distortion bends the picture like a CRT tube first, then the scanlines
 * and grain are laid over the *already curved* image — do it the other way round
 * and the scanlines bend too, which no real tube does.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly mono: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** Any image or video source. Swap for <Video> from @remotion/media to grade footage. */
  readonly src?: string;
  readonly timecode?: string;
  readonly label?: string;
  /** Scales every effect at once. */
  readonly intensity?: number;
};

export const VhsVintage: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.mono,
  src,
  timecode = 'SP  0:12:47',
  label = '▶ PLAY',
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Tracking wobble: mostly still, with occasional bad frames — the tell of tape.
  const badFrame = random(`bad-${Math.floor(frame / 7)}`) > 0.86;
  const wobble = badFrame ? (random(`wob-${frame}`) - 0.5) * 12 : 0;

  const seconds = Math.floor(frame / fps);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden'}}>
      <Video
        objectFit="cover"
        src={src ?? staticFile('footage/interview-raw.mp4')}
        // A real face is the point. Tape artefacts read as damage only against
        // something the eye already knows the shape of — skin tone, hair edges,
        // a moving mouth. On a flat vector plate the same effects array just
        // looks like a deliberate graphic treatment.
        muted
        loop
        style={{width: '100%', height: '100%', translate: `${wobble}px 0px`}}
        effects={[
          // 1. Bend the picture like a CRT tube.
          barrelDistortion({amount: 0.11 * intensity}),
          // 2. Misregister the colour channels — worse on a bad frame.
          chromaticAberration({amount: (badFrame ? 7 : 2.6) * intensity}),
          // 3. Lay scanlines over the already-curved image.
          scanlines({
            amount: 0.3 * intensity,
            spacing: 4,
            thickness: 1,
            // Scroll them slowly so the picture never sits perfectly still.
            offset: (frame * 0.55) % 4,
          }),
          // 4. Tape grain, reseeded every frame.
          noise({amount: 0.11 * intensity, seed: frame}),
          // 5. Tube falloff at the corners.
          vignette({amount: 0.62 * intensity, radius: 0.72, feather: 0.55}),
        ]}
      />

      {/* Head-switching noise band, drifting up the frame the way a real one does. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 26,
          top: `${(100 - ((frame * 1.6) % 130)) - 8}%`,
          background:
            'linear-gradient(rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 40%, rgba(255,255,255,0.05) 100%)',
          mixBlendMode: 'screen',
          opacity: 0.7,
        }}
      />

      {/* On-screen display, in the tube's own colour. */}
      <Interactive.Div
        name="OSD"
        style={{
          position: 'absolute',
          left: 92,
          top: 74,
          fontFamily,
          fontSize: 76,
          color: '#eef1f7',
          textShadow: '0 0 14px rgba(160,255,200,0.7)',
          letterSpacing: '0.06em',
          opacity: Math.floor(frame / 12) % 4 === 3 ? 0.35 : 1,
        }}
      >
        {label}
      </Interactive.Div>

      <Interactive.Div
        name="Timecode"
        style={{
          position: 'absolute',
          right: 92,
          bottom: 74,
          fontFamily,
          fontSize: 68,
          color: '#eef1f7',
          textShadow: '0 0 14px rgba(160,255,200,0.7)',
          letterSpacing: '0.06em',
        }}
      >
        {timecode.replace(
          /(\d+):(\d+)$/,
          () => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`,
        )}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
