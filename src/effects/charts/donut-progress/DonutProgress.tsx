import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '600', '800'], subsets: ['latin']});

/**
 * Donut Progress
 * Concentric rings sweeping to their values. Built with SVG stroke-dasharray on
 * circles rather than conic-gradient, because a stroked arc gives you round caps,
 * a proper track underneath, and exact control of where the sweep starts.
 */

type Ring = {readonly label: string; readonly value: number; readonly color: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly body: string;
  readonly ink: string;
  readonly text: string;
  readonly bg: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  body: '#eef1f7',
  ink: '#ffffff',
  text: fontFamily,
  bg: '#0a0b10',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly rings?: readonly Ring[];
  readonly title?: string;
  readonly centerLabel?: string;
  readonly backgroundColor?: string;
  readonly sweepSeconds?: number;
};

export const DonutProgress: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  rings = [
    {label: 'Render', value: 0.92, color: '#4cc9f0'},
    {label: 'Encode', value: 0.74, color: '#c6ff3d'},
    {label: 'Upload', value: 0.48, color: '#ff5c39'},
  ],
  title = 'Pipeline health',
  centerLabel = 'OK',
  backgroundColor = theme.bg,
  sweepSeconds = 1.6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const SIZE = 620;
  const CENTER = SIZE / 2;
  const STROKE = 46;
  const GAP = 18;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 110,
        fontFamily,
      }}
    >
      <div style={{position: 'relative', width: SIZE, height: SIZE}}>
        <svg
          width={SIZE}
          height={SIZE}
          // Rotate the whole chart so 0% starts at 12 o'clock, not 3 o'clock.
          style={{rotate: '-90deg'}}
        >
          {rings.map((ring, i) => {
            const r = CENTER - STROKE / 2 - i * (STROKE + GAP);
            const circumference = 2 * Math.PI * r;
            const p = interpolate(
              frame,
              [i * 6, i * 6 + sweepSeconds * fps],
              [0, ring.value],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            );

            return (
              <g key={ring.label}>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  // One dash as long as the swept arc, one gap for the rest.
                  strokeDasharray={`${circumference * p} ${circumference}`}
                  style={{filter: `drop-shadow(0 0 16px ${ring.color}55)`}}
                />
              </g>
            );
          })}
        </svg>

        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <Interactive.Div
            name="Center"
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: theme.ink,
              letterSpacing: '-0.03em',
              scale: interpolate(frame, [10, 32], [0.7, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: 'perceptual-scale',
              }),
              opacity: interpolate(frame, [10, 26], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {centerLabel}
          </Interactive.Div>
        </AbsoluteFill>
      </div>

      <div>
        <Interactive.Div
          name="Title"
          style={{fontSize: 54, fontWeight: 800, color: theme.ink, marginBottom: 40, letterSpacing: '-0.02em'}}
        >
          {title}
        </Interactive.Div>
        {rings.map((ring, i) => {
          const p = interpolate(
            frame,
            [i * 6, i * 6 + sweepSeconds * fps],
            [0, ring.value],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)},
          );
          return (
            <div
              key={ring.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 26,
                translate: interpolate(frame, [i * 6 + 6, i * 6 + 26], ['-28px 0px', '0px 0px'], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                opacity: interpolate(frame, [i * 6 + 6, i * 6 + 24], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <span style={{width: 22, height: 22, borderRadius: 6, backgroundColor: ring.color}} />
              <span style={{fontSize: 38, fontWeight: 600, color: theme.body, width: 220}}>
                {ring.label}
              </span>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: ring.color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(p * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
