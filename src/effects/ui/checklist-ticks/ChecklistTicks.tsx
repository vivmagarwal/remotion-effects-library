import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']});

/**
 * Checklist Ticks
 * Rows that get ticked off one at a time. The check is a real SVG path drawn on
 * with stroke-dashoffset rather than a static ✓ that fades in — you see the
 * pen stroke, which is what makes it feel like a decision rather than a
 * reveal. The box fills, the label lifts, and a rule strikes through behind it.
 */

type Props = {
  readonly title?: string;
  readonly items?: readonly string[];
  /** Frames between one row being ticked and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  /** Frames the check takes to draw. */
  readonly drawFrames?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
};

/** The tick path, in a 24×24 box. Length is ~21.6 units — round up for the dash. */
const CHECK_PATH = 'M5 12.5 L10 17.5 L19 7';
const CHECK_LEN = 24;

export const ChecklistTicks: React.FC<Props> = ({
  title = 'Before you hit render',
  items = [
    'Every animation reads useCurrentFrame()',
    'Fonts loaded, not just named',
    'No Math.random() anywhere',
    'Assets in public/, via staticFile()',
    'Checked a frame mid-motion, not the last one',
  ],
  stagger = 22,
  startAt = 20,
  drawFrames = 13,
  accentColor = '#20e3b2',
  backgroundColor = '#0d0f14',
  textColor = '#eef1f7',
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const ROW_H = 108;
  const BOX = 62;
  const LEFT = 168;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 30% 22%, #191d27 0%, #0a0c11 68%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: LEFT,
          top: 150,
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: textColor,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: `0px ${interpolate(frame, [0, 24], [16, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}px`,
        }}
      >
        {title}
      </Interactive.Div>

      {items.map((item, i) => {
        const begin = startAt + i * stagger;

        // The row arrives first…
        const enter = spring({
          frame: frame - begin,
          fps,
          config: {damping: 16, stiffness: 170, mass: 0.7},
        });
        if (enter <= 0.001) return null;

        // …and only once it has settled does the check start drawing.
        const draw = interpolate(frame, [begin + 8, begin + 8 + drawFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.5, 0, 0.2, 1),
        });
        // The box fills as the stroke completes, so colour and motion resolve together.
        const fill = interpolate(draw, [0.15, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const strike = interpolate(frame, [begin + 8 + drawFrames, begin + 26 + drawFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.22, 1, 0.32, 1),
        });

        const y = 292 + i * ROW_H;

        return (
          <Interactive.Div
            key={item}
            name={`Item ${i + 1}`}
            style={{
              position: 'absolute',
              left: LEFT,
              top: y,
              right: 168,
              height: BOX,
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              opacity: Math.min(1, enter * 1.5),
              translate: `${(1 - enter) * -34}px 0px`,
            }}
          >
            <svg width={BOX} height={BOX} viewBox="0 0 24 24" style={{flexShrink: 0}}>
              <rect
                x={1.4}
                y={1.4}
                width={21.2}
                height={21.2}
                rx={6}
                fill={accentColor}
                fillOpacity={fill * 0.16}
                stroke={fill > 0.5 ? accentColor : '#39404f'}
                strokeWidth={1.8}
              />
              {/* strokeDasharray + a dashoffset that runs to 0 IS the draw-on.
                  The dash must be at least the path length or the tail never lands. */}
              <path
                d={CHECK_PATH}
                fill="none"
                stroke={accentColor}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LEN}
                strokeDashoffset={CHECK_LEN * (1 - draw)}
              />
            </svg>

            <div style={{flex: 1, minWidth: 0}}>
              {/* inline-block, so the box is exactly as wide as the text. A
                  block-level wrapper here stretches to the row and the rule
                  strikes through the empty space after the label too. */}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontSize: 38,
                  fontWeight: 600,
                  color: strike > 0.5 ? '#79808f' : textColor,
                  lineHeight: 1.3,
                }}
              >
                {item}
                {/* A separate element rather than text-decoration, which cannot
                    be animated. */}
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '52%',
                    height: 2.5,
                    width: `${strike * 100}%`,
                    backgroundColor: accentColor,
                    opacity: 0.75,
                  }}
                />
              </span>
            </div>
          </Interactive.Div>
        );
      })}
    </AbsoluteFill>
  );
};
