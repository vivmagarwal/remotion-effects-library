import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Bar Chart Race
 * Bars grow, overtake one another and re-sort as the series advances. The part
 * that makes it read as a race rather than a slideshow: rows animate to their
 * new *rank position* rather than being reordered in the DOM, so a bar visibly
 * slides past its rival instead of teleporting.
 */

type Series = {readonly label: string; readonly color: string; readonly values: readonly number[]};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly ink: string;
  readonly text: string;
  readonly display: string;
  readonly bg: string;
  readonly series: readonly string[];
  readonly accentInk: string;
  readonly accentOnPaper: string;
  readonly pair: string;
  readonly radius: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  ink: '#ffffff',
  text: fontFamily,
  display: fontFamily,
  bg: '#0a0b10',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  accentInk: '#04050a',
  accentOnPaper: '#c2410c',
  pair: '#4cc9f0',
  radius: 18,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the title. Defaults to the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly series?: readonly Series[];
  readonly ticks?: readonly string[];
  /** Frames spent on each step of the series. */
  readonly framesPerStep?: number;
  readonly backgroundColor?: string;
};

export const BarChartRace: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  title = 'Monthly active projects',
  series = [
    {label: 'Remotion', color: theme.series[1], values: [12, 26, 44, 68, 96, 128]},
    {label: 'After Effects', color: theme.series[4], values: [58, 62, 70, 76, 82, 88]},
    {label: 'Blender', color: theme.series[3], values: [30, 41, 55, 61, 70, 79]},
    {label: 'Figma', color: theme.series[2], values: [44, 48, 52, 57, 60, 64]},
    {label: 'Canva', color: theme.accentOnPaper, values: [22, 30, 33, 38, 44, 47]},
  ],
  ticks = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  framesPerStep = 34,
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();

  const steps = series[0].values.length;
  // Continuous position in the series, so values glide between steps.
  const cursor = Math.min(steps - 1, frame / framesPerStep);
  const stepIndex = Math.floor(cursor);
  const within = cursor - stepIndex;

  const valueAt = (s: Series) => {
    const a = s.values[stepIndex];
    const b = s.values[Math.min(steps - 1, stepIndex + 1)];
    return a + (b - a) * Easing.bezier(0.4, 0, 0.25, 1)(within);
  };

  const current = series.map((s) => ({...s, value: valueAt(s)}));
  const max = Math.max(...current.map((s) => s.value)) * 1.06;

  // Rank by current value; each row is positioned by its rank, not its array index.
  const ranked = [...current].sort((a, b) => b.value - a.value);
  const rankOf = (label: string) => ranked.findIndex((s) => s.label === label);

  const rowHeight = 118;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, padding: '80px 96px', fontFamily}}>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: theme.ink,
          letterSpacing: '-0.02em',
          fontFamily: displayFamily,
        }}
      >
        {title}
      </Interactive.Div>

      <div style={{position: 'relative', flex: 1, marginTop: 46}}>
        {current.map((s) => {
          const rank = rankOf(s.label);
          return (
            <div
              key={s.label}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: rowHeight - 20,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                // Position by rank. Because this is a smooth style change on a stable
                // DOM node, an overtake is a visible slide rather than a jump.
                translate: `0px ${rank * rowHeight}px`,
              }}
            >
              <span
                style={{
                  width: 320,
                  textAlign: 'right',
                  fontSize: 36,
                  fontWeight: 700,
                  color: theme.muted,
                }}
              >
                {s.label}
              </span>
              {/* The track is flex:1, so the bar's percentage is measured against the
                  space actually left over after the label gutter — not the whole row. */}
              <div style={{flex: 1, height: '100%'}}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: (theme.radius * 10) / 18,
                    backgroundColor: s.color,
                    width: `${(s.value / max) * 100}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 20,
                    boxShadow: `0 8px 30px ${s.color}33`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: theme.accentInk,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.round(s.value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Interactive.Div
        name="Tick"
        style={{
          position: 'absolute',
          right: 96,
          bottom: 64,
          fontSize: 150,
          fontWeight: 800,
          color: '#ffffff0f',
          letterSpacing: '-0.04em',
        }}
      >
        {ticks[Math.round(cursor)] ?? ''}
      </Interactive.Div>

      {/* Progress rail along the bottom. */}
      <div style={{height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 26}}>
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: theme.pair,
            width: `${interpolate(frame, [0, (steps - 1) * framesPerStep], [0, 100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
