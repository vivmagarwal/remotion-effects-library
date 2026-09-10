import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Versus Table
 * The comparison slide. Two columns arrive from opposite edges and their rows
 * interleave — left row 1, right row 1, left row 2 — so the eye reads across the
 * comparison rather than down one side and then the other.
 */

type Side = {
  readonly heading: string;
  readonly rows: readonly string[];
  readonly color: string;
  readonly good: boolean;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly paper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  paper: '#f6f5f2',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly kicker?: string;
  readonly title?: string;
  readonly left?: Side;
  readonly right?: Side;
  /** Frames between one row and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
  readonly showVersusBadge?: boolean;
};

export const VersusTable: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  kicker = 'TWO WAYS TO GRADE',
  title = 'Product only vs triangulated',
  left = {
    heading: 'Product only',
    rows: ['Rewards polish', 'Hides the struggle', 'One snapshot', 'Easy to fake'],
    color: '#ff5c39',
    good: false,
  },
  right = {
    heading: 'Triangulated',
    rows: ['Rewards thinking', 'Sees the process', 'Three windows', 'Hard to fake'],
    color: '#4cc9f0',
    good: true,
  },
  stagger = 11,
  startAt = 34,
  backgroundColor = theme.bg,
  paperColor = theme.paper,
  showVersusBadge = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rowCount = Math.max(left.rows.length, right.rows.length);
  const ROW_H = 116;

  const head = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const badge = spring({
    frame: frame - (startAt - 10),
    fps,
    config: {damping: 11, stiffness: 190, mass: 0.6},
  });

  const column = (side: Side, isLeft: boolean) => (
    <div style={{flex: 1, minWidth: 0}}>
      <Interactive.Div
        name={side.heading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: paperColor,
          paddingBottom: 22,
          borderBottom: `3px solid ${side.color}`,
          marginBottom: 26,
          opacity: head,
          translate: `${(head - 1) * (isLeft ? -50 : 50)}px 0px`,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: side.color,
            color: backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {side.good ? '✓' : '✕'}
        </span>
        {side.heading}
      </Interactive.Div>

      <div style={{position: 'relative', height: rowCount * ROW_H}}>
        {side.rows.map((row, i) => {
          // Interleave: left row i and right row i are one beat apart, so the
          // eye reads ACROSS the comparison instead of down one column.
          const order = i * 2 + (isLeft ? 0 : 1);
          const from = startAt + order * stagger;
          const pop = spring({
            frame: frame - from,
            fps,
            config: {damping: 15, stiffness: 165, mass: 0.7},
          });
          const p = Math.min(1, pop);

          return (
            <div
              key={row}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * ROW_H,
                height: ROW_H - 16,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '0 26px',
                borderRadius: 14,
                backgroundColor: `${side.color}14`,
                border: `1px solid ${side.color}33`,
                fontSize: 40,
                fontWeight: 500,
                color: '#eef1f7',
                // Columns arrive from their own edge.
                translate: `${(p - 1) * (isLeft ? -70 : 70)}px 0px`,
                opacity: Math.min(1, pop * 1.8),
              }}
            >
              <span style={{color: side.color, fontSize: 30, fontWeight: 800, flexShrink: 0}}>
                {side.good ? '✓' : '✕'}
              </span>
              <span
                style={{
                  // The losing column's text is struck through as it lands.
                  textDecoration: side.good ? 'none' : 'line-through',
                  textDecorationColor: `${side.color}cc`,
                  textDecorationThickness: 3,
                  opacity: side.good ? 1 : 0.72,
                }}
              >
                {row}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 24%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 68%)',
        justifyContent: 'center',
        padding: '0 120px',
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Kicker"
        style={{
          alignSelf: 'center',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '0.26em',
          marginRight: '-0.26em',
          color: '#8d93a5',
          marginBottom: 16,
          opacity: head,
        }}
      >
        {kicker}
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{
          alignSelf: 'center',
          fontSize: 68,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: paperColor,
          marginBottom: 56,
          opacity: head,
          translate: `0px ${(1 - head) * 20}px`,
        }}
      >
        {title}
      </Interactive.Div>

      <div style={{position: 'relative', display: 'flex', gap: 110, alignItems: 'flex-start'}}>
        {column(left, true)}
        {column(right, false)}

        {showVersusBadge ? (
          <Interactive.Div
            name="VS"
            style={{
              position: 'absolute',
              left: '50%',
              top: 96,
              translate: '-50% 0',
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: paperColor,
              color: backgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
              boxShadow: '0 14px 40px rgba(0,0,0,0.5)',
              zIndex: 5,
              scale: Math.min(1.12, badge),
            }}
          >
            VS
          </Interactive.Div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
