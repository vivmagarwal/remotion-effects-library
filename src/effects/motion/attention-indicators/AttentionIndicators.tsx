import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Attention Indicators
 * The four devices for pointing at something on screen, borrowed from Manim's
 * indication family: Circumscribe, Indicate, Flash and FocusOn. Each is a
 * standalone technique — the composition just runs them in sequence so you can
 * see what each one actually does.
 */

type Row = {readonly label: string; readonly value: string};

type Props = {
  readonly title?: string;
  readonly rows?: readonly Row[];
  /** Frame the first indication fires. */
  readonly startAt?: number;
  /** Frames between one indication and the next. */
  readonly stagger?: number;
  /** Frames a single indication runs for. */
  readonly runFrames?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

/** Manim's `smooth`: 3t² − 2t³. Zero velocity at both ends, no overshoot. */
const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Manim's `there_and_back`: out to 1 at the midpoint, back to 0. */
const thereAndBack = (t: number) => smooth(1 - Math.abs(2 * Math.min(1, Math.max(0, t)) - 1));

export const AttentionIndicators: React.FC<Props> = ({
  title = 'INDICATION',
  rows = [
    {label: 'Circumscribe', value: 'draws a box around it'},
    {label: 'Indicate', value: 'swells and recolours it'},
    {label: 'Flash', value: 'fires rays out of it'},
    {label: 'FocusOn', value: 'closes the room onto it'},
  ],
  startAt = 24,
  stagger = 58,
  runFrames = 46,
  accentColor = '#ffcf3d',
  backgroundColor = '#0d1117',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const ROW_H = 132;
  const PANEL = {x: 300, y: 300, w: width - 600, h: rows.length * ROW_H + 56};

  /** Local 0→1 progress for indication `i`, or null if it is not running. */
  const runOf = (i: number) => {
    const from = startAt + i * stagger;
    if (frame < from || frame > from + runFrames) return null;
    return (frame - from) / runFrames;
  };

  const rowRect = (i: number) => ({
    x: PANEL.x + 28,
    y: PANEL.y + 28 + i * ROW_H,
    w: PANEL.w - 56,
    h: ROW_H - 16,
  });

  const focusRun = runOf(3);
  const focusRect = rowRect(3);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: 'radial-gradient(ellipse at 50% 36%, #182131 0%, #0b0e14 68%)'}}
      />

      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: 178,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: '0.3em',
          color: '#8b93a7',
        }}
      >
        {title}
      </Interactive.Div>

      {/* The panel */}
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 22,
          backgroundColor: '#161c26',
          border: '1px solid #232c3a',
        }}
      />

      {rows.map((row, i) => {
        const r = rowRect(i);
        const run = runOf(i);

        // ── Indicate: swell and recolour, out and back. ──────────────────
        const indicate = i === 1 && run !== null ? thereAndBack(run) : 0;

        return (
          <Interactive.Div
            key={row.label}
            name={row.label}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 30px',
              fontSize: 42,
              fontWeight: 700,
              color: indicate > 0.02 ? accentColor : '#dfe4ee',
              // Indicate scales about the element's own centre, so it swells in
              // place rather than shifting the row.
              scale: 1 + indicate * 0.13,
            }}
          >
            <span>{row.label}</span>
            <span style={{fontSize: 32, fontWeight: 500, color: '#79839a'}}>{row.value}</span>
          </Interactive.Div>
        );
      })}

      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <defs>
          {/* FocusOn's mask: everything dimmed except a shrinking hole. */}
          <mask id="ai-focus">
            <rect width={width} height={height} fill="#fff" />
            {focusRun !== null ? (
              <ellipse
                cx={focusRect.x + focusRect.w / 2}
                cy={focusRect.y + focusRect.h / 2}
                // The hole closes in, then opens back up.
                rx={interpolate(thereAndBack(focusRun), [0, 1], [width, focusRect.w * 0.62])}
                ry={interpolate(thereAndBack(focusRun), [0, 1], [height, focusRect.h * 0.95])}
                fill="#000"
              />
            ) : null}
          </mask>
        </defs>

        {/* ── Circumscribe: a rect drawn on, one edge at a time. ──────────── */}
        {(() => {
          const run = runOf(0);
          if (run === null) return null;
          const r = rowRect(0);
          const perimeter = (r.w + r.h) * 2;
          // Draw over the first 60%, hold, then fade — Manim's Circumscribe
          // draws the shape on and then removes it.
          const draw = smooth(Math.min(1, run / 0.6));
          return (
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={14}
              fill="none"
              stroke={accentColor}
              strokeWidth={5}
              strokeDasharray={perimeter}
              strokeDashoffset={perimeter * (1 - draw)}
              opacity={interpolate(run, [0, 0.6, 0.85, 1], [1, 1, 1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
            />
          );
        })()}

        {/* ── Flash: rays firing outward from the row's centre. ───────────── */}
        {(() => {
          const run = runOf(2);
          if (run === null) return null;
          const r = rowRect(2);
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          const p = smooth(run);
          const inner = interpolate(p, [0, 1], [40, 150]);
          const outer = interpolate(p, [0, 1], [40, 260]);
          return (
            <g opacity={interpolate(p, [0, 0.25, 1], [0, 1, 0], {extrapolateRight: 'clamp'})}>
              {new Array(14).fill(0).map((_, k) => {
                const a = (k / 14) * Math.PI * 2;
                return (
                  <line
                    key={k}
                    x1={cx + Math.cos(a) * inner}
                    y1={cy + Math.sin(a) * inner * 0.55}
                    x2={cx + Math.cos(a) * outer}
                    y2={cy + Math.sin(a) * outer * 0.55}
                    stroke={accentColor}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          );
        })()}

        {/* FocusOn's dim layer, punched through by the mask above. */}
        {focusRun !== null ? (
          <rect
            width={width}
            height={height}
            fill="#05070c"
            opacity={0.82 * thereAndBack(focusRun)}
            mask="url(#ai-focus)"
          />
        ) : null}
      </svg>

      {/* Caption naming whichever device is currently running. */}
      <Interactive.Div
        name="Caption"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 150,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 30,
          color: accentColor,
        }}
      >
        {rows.map((row, i) => (runOf(i) !== null ? row.label : null)).filter(Boolean)[0] ?? ''}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
