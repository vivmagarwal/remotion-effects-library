import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
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

type Props = {
  readonly title?: string;
  readonly series?: readonly Series[];
  readonly ticks?: readonly string[];
  /** Frames spent on each step of the series. */
  readonly framesPerStep?: number;
  readonly backgroundColor?: string;
};

export const BarChartRace: React.FC<Props> = ({
  title = 'Monthly active projects',
  series = [
    {label: 'Remotion', color: '#4cc9f0', values: [12, 26, 44, 68, 96, 128]},
    {label: 'After Effects', color: '#c77dff', values: [58, 62, 70, 76, 82, 88]},
    {label: 'Blender', color: '#ffd166', values: [30, 41, 55, 61, 70, 79]},
    {label: 'Figma', color: '#c6ff3d', values: [44, 48, 52, 57, 60, 64]},
    {label: 'Canva', color: '#c2410c', values: [22, 30, 33, 38, 44, 47]},
  ],
  ticks = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  framesPerStep = 34,
  backgroundColor = '#0a0b10',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

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
        style={{fontSize: 52, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em'}}
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
                  color: '#8d93a5',
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
                    borderRadius: 10,
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
                      color: '#0a0b10',
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
            backgroundColor: '#4cc9f0',
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
