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

type Props = {
  readonly rings?: readonly Ring[];
  readonly title?: string;
  readonly centerLabel?: string;
  readonly backgroundColor?: string;
  readonly sweepSeconds?: number;
};

export const DonutProgress: React.FC<Props> = ({
  rings = [
    {label: 'Render', value: 0.92, color: '#4cc9f0'},
    {label: 'Encode', value: 0.74, color: '#c6ff3d'},
    {label: 'Upload', value: 0.48, color: '#ff5c39'},
  ],
  title = 'Pipeline health',
  centerLabel = 'OK',
  backgroundColor = '#0a0c12',
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
                  stroke="#1a1e2a"
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
              color: '#f2f4f8',
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
          style={{fontSize: 54, fontWeight: 800, color: '#f2f4f8', marginBottom: 40, letterSpacing: '-0.02em'}}
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
              <span style={{fontSize: 38, fontWeight: 600, color: '#c3c9d6', width: 220}}>
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
