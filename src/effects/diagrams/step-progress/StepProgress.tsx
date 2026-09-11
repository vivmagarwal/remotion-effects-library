import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Step Progress
 * A numbered process advancing along a rail. The single detail that makes it
 * read correctly is that the fill and the nodes are driven by ONE continuous
 * position, not by a per-step boolean — so the rail is always partly between
 * two steps and the whole thing moves like a playhead rather than snapping.
 */

type Step = {readonly label: string; readonly detail: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly muted: string;
  readonly text: string;
  readonly display: string;
  readonly bg: string;
  readonly body: string;
  readonly pair: string;
  readonly accentInk: string;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  muted: '#8d93a5',
  text: fontFamily,
  display: fontFamily,
  bg: '#0a0b10',
  body: '#eef1f7',
  pair: '#4cc9f0',
  accentInk: '#04050a',
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the title. Defaults to this file's own face, or the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly steps?: readonly Step[];
  /** Frames spent travelling from one node to the next. */
  readonly travelFrames?: number;
  /** Frames held on each node before moving on. */
  readonly holdFrames?: number;
  readonly startAt?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
};

const DEFAULT_STEPS: Step[] = [
  {label: 'Write', detail: 'One .tsx per composition'},
  {label: 'Preview', detail: 'npx remotion studio'},
  {label: 'Check', detail: 'A still, mid-motion'},
  {label: 'Render', detail: 'npx remotion render'},
];

export const StepProgress: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  title = 'How a Remotion video gets made',
  steps = DEFAULT_STEPS,
  travelFrames = 26,
  holdFrames = 16,
  startAt = 18,
  accentColor = theme.pair,
  backgroundColor = theme.bg,
  textColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const MARGIN = 250;
  const railY = height / 2;
  const railW = width - MARGIN * 2;
  const gap = steps.length > 1 ? railW / (steps.length - 1) : 0;
  const NODE_R = 46;

  // One continuous playhead in "step space": 0 at the first node, steps.length-1
  // at the last. Everything else is derived from it.
  const cycle = travelFrames + holdFrames;
  const elapsed = Math.max(0, frame - startAt);
  const legIndex = Math.min(steps.length - 1, Math.floor(elapsed / cycle));
  const legProgress = interpolate(elapsed - legIndex * cycle, [0, travelFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });
  const playhead = Math.min(steps.length - 1, legIndex + legProgress);

  // The hairline colour for everything not yet reached. A white wash is
  // invisible on paper and a black one on the dark ground, so it comes from the
  // scheme rather than from a colour.
  const hair = theme.scheme === 'light' ? '0,0,0' : '255,255,255';

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        // A 42% black vignette turns paper grey, so a light scheme gets a much
        // lighter one rather than the dark ground's.
        backgroundImage:
          theme.scheme === 'light'
            ? 'radial-gradient(ellipse at 50% 46%, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.05) 70%)'
            : 'radial-gradient(ellipse at 50% 46%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 70%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 138,
          textAlign: 'center',
          fontFamily: displayFamily,
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: textColor,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>

      {/* The unfilled rail. */}
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: railY - 3,
          width: railW,
          height: 6,
          borderRadius: 3,
          backgroundColor: `rgba(${hair},0.08)`,
        }}
      />
      {/* The fill, driven by the same playhead as the nodes. */}
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: railY - 3,
          width: gap * playhead,
          height: 6,
          borderRadius: 3,
          backgroundColor: accentColor,
          boxShadow: `0 0 24px ${accentColor}88`,
        }}
      />

      {steps.map((step, i) => {
        const x = MARGIN + i * gap;

        // How "arrived at" this node is. Crossing it is what lights it up.
        const arrived = interpolate(playhead, [i - 0.5, i], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const isCurrent = Math.round(playhead) === i;

        // A pop the moment the playhead reaches the node.
        const pop = spring({
          frame: frame - (startAt + i * cycle),
          fps,
          config: {damping: 11, stiffness: 210, mass: 0.6},
        });

        return (
          <Interactive.Div key={step.label} name={`Step ${i + 1}`}>
            <div
              style={{
                position: 'absolute',
                left: x - NODE_R,
                top: railY - NODE_R,
                width: NODE_R * 2,
                height: NODE_R * 2,
                borderRadius: '50%',
                backgroundColor: arrived > 0.5 ? accentColor : `rgba(${hair},0.05)`,
                border: `${theme.stroke * (4 / 3)}px solid ${arrived > 0.5 ? accentColor : `rgba(${hair},0.12)`}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 800,
                color: arrived > 0.5 ? theme.accentInk : theme.muted,
                scale: 1 + (isCurrent ? Math.max(0, pop) * 0.12 : 0),
                boxShadow: isCurrent ? `0 0 40px ${accentColor}77` : 'none',
              }}
            >
              {i + 1}
            </div>

            <div
              style={{
                position: 'absolute',
                left: x - 150,
                top: railY + NODE_R + 34,
                width: 300,
                textAlign: 'center',
                opacity: interpolate(arrived, [0.2, 1], [0.32, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                translate: `0px ${(1 - Math.max(0, Math.min(1, pop))) * 12}px`,
              }}
            >
              <div style={{fontSize: 38, fontWeight: 700, color: textColor}}>{step.label}</div>
              <div style={{fontSize: 25, fontWeight: 500, color: theme.muted, marginTop: 8}}>
                {step.detail}
              </div>
            </div>
          </Interactive.Div>
        );
      })}
    </AbsoluteFill>
  );
};
