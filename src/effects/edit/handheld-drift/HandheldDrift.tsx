import {AbsoluteFill, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {noise2D} from '@remotion/noise';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Handheld Drift
 *
 * A locked-off shot given a human operator. Four things make it read as a person
 * holding a camera rather than as a wobble, and only the first is obvious:
 *
 *  1. **Noise, not a sine.** A sine wave is periodic and the eye locks onto the
 *     period within about two cycles — after which the shot reads as
 *     oscillating, not as handheld. Perlin noise is aperiodic and band-limited,
 *     which is what a human arm actually is.
 *  2. **Two octaves at 3:1, the second at ~30 % amplitude.** One octave is too
 *     smooth to be a person; three is mush.
 *  3. **Decorrelated axes.** `noise2D(seed, t, 0)` and `noise2D(seed, 0, t)` on
 *     the SAME seed are correlated and produce diagonal motion. Different seeds.
 *  4. **Rotation lags translation by ~4 frames.** A real operator's wrist rotates
 *     after their arm has moved. This is the detail that sells it, and it costs
 *     one subtraction.
 *
 * And the thing everyone forgets: **overscan**. Drifting a full-bleed layer moves
 * the frame edge into view unless the picture is scaled up by more than the
 * amplitude first.
 */

type Preset = {
  readonly name: string;
  /** Peak translation, in px at 1080p. */
  readonly amp: number;
  /** Peak rotation, in degrees. */
  readonly rot: number;
  /** Noise input step per frame — the base octave's frequency. */
  readonly step: number;
  /** Extra scale breathing, as a fraction. 0 for the calmer presets. */
  readonly breathe: number;
  readonly note: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly ink: string;
  readonly muted: string;
  readonly body: string;
  readonly text: string;
  readonly accent: string;
  readonly pair: string;
  readonly bg: string;
  readonly radius: number;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  ink: '#ffffff',
  muted: '#8d93a5',
  body: '#eef1f7',
  text: fontFamily,
  accent: '#ff5c39',
  pair: '#4cc9f0',
  bg: '#0a0b10',
  radius: 18,
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  readonly preset?: 'tripod' | 'shoulder' | 'walking' | 'seasick';
  /** Frames the rotation trails the translation by. 4 is the value that reads right. */
  readonly rotationLag?: number;
  readonly showDebug?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const PRESETS: Record<NonNullable<Props['preset']>, Preset> = {
  tripod: {name: 'TRIPOD WITH LIFE', amp: 3, rot: 0.15, step: 0.012, breathe: 0, note: 'a locked-off shot that is not dead'},
  shoulder: {name: 'SHOULDER DOC', amp: 11, rot: 0.45, step: 0.03, breathe: 0, note: 'the default for an interview'},
  walking: {name: 'WALKING HANDHELD', amp: 26, rot: 1.2, step: 0.055, breathe: 0.009, note: 'add motion blur at this amplitude'},
  seasick: {name: 'SEASICK — DO NOT SHIP', amp: 46, rot: 2.4, step: 0.095, breathe: 0.02, note: 'past 40px and 2° it stops reading as a camera'},
};

export const HandheldDrift: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src,
  preset = 'shoulder',
  rotationLag = 4,
  showDebug = true,
  accentColor = theme.accent,
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  const p = PRESETS[preset];

  // Two octaves, 3:1, the second at 30 %. Every axis gets its own seed.
  const octaves = (seed: string, t: number) =>
    noise2D(seed, t * p.step, 0) + noise2D(`${seed}-hi`, t * p.step * 3, 0) * 0.3;

  const dx = octaves('hh-x', frame) * p.amp;
  const dy = octaves('hh-y', frame) * p.amp;
  // The lag. `frame - rotationLag` is the whole trick.
  const rot = octaves('hh-r', frame - rotationLag) * p.rot;
  const breathe = p.breathe === 0 ? 0 : octaves('hh-s', frame) * p.breathe;

  // Overscan sized from the amplitude, not guessed: the picture has to be big
  // enough that the worst-case drift never exposes an edge. The `1.3` is
  // headroom for the rotation, which moves the corners further than the centre.
  const overscan = 1 + (p.amp * 2 * 1.3) / height + Math.abs(p.breathe);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      <Video
        objectFit="cover"
        src={src ?? staticFile('footage/interview.mp4')}
        muted
        loop
        style={{
          width: '100%',
          height: '100%',
          translate: `${dx}px ${dy}px`,
          rotate: `${rot}deg`,
          scale: overscan + breathe,
        }}
      />

      {showDebug ? (
        <>
          <Interactive.Div
            name="Readout"
            style={{
              position: 'absolute',
              left: 84,
              top: 84,
              padding: '16px 26px',
              borderRadius: (12 * theme.radius) / THEME.radius,
              backgroundColor: 'rgba(10, 11, 16, 0.72)',
              backdropFilter: 'blur(18px) saturate(1.3)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              maxWidth: 720,
            }}
          >
            <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '0.16em', color: accentColor}}>
              {p.name}
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: theme.body, marginTop: 8}}>{p.note}</div>
            <div style={{fontSize: 34, fontWeight: 500, color: theme.muted, marginTop: 8}}>
              ±{p.amp}px · ±{p.rot}° · lag {rotationLag}f · overscan {overscan.toFixed(3)}×
            </div>
          </Interactive.Div>

          {/* A gradient scrim under the curves. Two 2.5px lines over a moving
              face fail the 4.5:1 rule against the WORST pixel they cross, and
              the worst pixel is whatever the footage does next — so the contrast
              has to be brought with them rather than hoped for. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 320,
              backgroundImage:
                'linear-gradient(to top, rgba(10,11,16,0.82) 0%, rgba(10,11,16,0.5) 42%, rgba(10,11,16,0) 100%)',
            }}
          />

          {/* The two curves, so the lag between them is visible rather than asserted. */}
          <div style={{position: 'absolute', left: 84, right: 84, bottom: 84, height: 120}}>
            <svg width="100%" height="120" viewBox="0 0 1000 120" preserveAspectRatio="none">
              {(['hh-x', 'hh-r'] as const).map((seed, i) => (
                <polyline
                  key={seed}
                  fill="none"
                  stroke={i === 0 ? accentColor : theme.pair}
                  strokeWidth={(2.5 * theme.stroke) / THEME.stroke}
                  points={Array.from({length: 120}, (_, k) => {
                    const t = frame - 119 + k - (i === 1 ? rotationLag : 0);
                    return `${(k / 119) * 1000},${60 - octaves(seed, t) * 42}`;
                  }).join(' ')}
                />
              ))}
              <line
                x1="1000"
                y1="0"
                x2="1000"
                y2="120"
                stroke={theme.ink}
                strokeWidth={(2 * theme.stroke) / THEME.stroke}
              />
            </svg>
            <div style={{fontSize: 34, fontWeight: 500, color: theme.muted, marginTop: -4}}>
              <span style={{color: accentColor}}>translate</span> ·{' '}
              <span style={{color: theme.pair}}>rotate, {rotationLag} frames behind</span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              right: 84,
              top: 84,
              fontSize: 34,
              fontWeight: 500,
              color: theme.muted,
              // The top right of this frame is the ISS panels, and they are the
              // brightest thing in the shot. A scrim here would cover the
              // picture, so the contrast travels with the type instead.
              textShadow: '0 2px 14px rgba(10,11,16,0.95), 0 0 34px rgba(10,11,16,0.8)',
              opacity: interpolate(frame, [0, 16], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            two octaves · 3:1 · second at 30%
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
