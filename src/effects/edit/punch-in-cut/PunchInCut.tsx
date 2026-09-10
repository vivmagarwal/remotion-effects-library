import {AbsoluteFill, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Punch-In Cut
 *
 * The edit that makes forty jump cuts invisible. On a cut, the framing changes
 * by a hard step — no tween — and the brain reads the change as a SECOND CAMERA
 * rather than as a splice. That is the whole mechanism, and it is why the move
 * must not be animated: an eased zoom on a cut announces the cut, which is the
 * opposite of the job.
 *
 * Two numbers carry it. The step lives in the 2-5 % band, because below 2 % the
 * eye reads it as an encode wobble and above ~8 % it reads as a zoom and draws
 * attention to itself. And no two consecutive cuts use the same level, so the
 * shot never ratchets one way and never appears to repeat.
 */

type PunchLevel = {
  /** Frame the cut lands on. The level holds until the next entry. */
  readonly at: number;
  /** Absolute scale. Keep every value inside 1.00-1.09 and never repeat two in a row. */
  readonly scale: number;
};

type Props = {
  readonly src?: string;
  /**
   * The cut list. Each entry is a hard change of framing at `at`, held until the
   * next one — an editor's decision list, not a keyframe track.
   */
  readonly cuts?: readonly PunchLevel[];
  /**
   * Where the subject's eyes are, as fractions of the frame. The punch pushes
   * TOWARD this point, which is almost never the centre. Getting this wrong is
   * the difference between a punch-in and a crop.
   */
  readonly subject?: readonly [number, number];
  /** Draw the scale readout and the cut ticks. Turn off to use it for real. */
  readonly showDebug?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const DEFAULT_CUTS: PunchLevel[] = [
  {at: 0, scale: 1.0},
  {at: 42, scale: 1.05},
  {at: 84, scale: 1.0},
  {at: 126, scale: 1.08},
  {at: 168, scale: 1.03},
  {at: 210, scale: 1.0},
];

export const PunchInCut: React.FC<Props> = ({
  src,
  cuts = DEFAULT_CUTS,
  subject = [0.46, 0.38],
  showDebug = true,
  accentColor = '#ff5c39',
  backgroundColor = '#0a0b10',
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // The level in force right now. `.filter().at(-1)` rather than an interpolate,
  // because a hard step is the effect — there is nothing between two levels.
  const current = cuts.filter((c) => c.at <= frame).at(-1) ?? cuts[0];
  const index = cuts.indexOf(current);

  // Frames since this cut landed, for the readout only. Nothing visual eases.
  const sinceCut = frame - current.at;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      <Video
        src={src ?? staticFile('footage/interview-raw.mp4')}
        muted
        loop
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: current.scale,
          // transformOrigin, not a translate: scaling about the subject keeps the
          // subject still and moves the frame edges, which is what a longer lens
          // does. Scaling about the centre and then nudging back is two moves
          // fighting each other and it shows on the edges.
          transformOrigin: `${subject[0] * 100}% ${subject[1] * 100}%`,
        }}
      />

      {showDebug ? (
        <>
          {/* Scale readout. Steps, never counts — it is showing you a decision. */}
          <Interactive.Div
            name="Readout"
            style={{
              position: 'absolute',
              left: 84,
              top: 84,
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              padding: '14px 26px',
              borderRadius: 12,
              backgroundColor: 'rgba(10, 11, 16, 0.72)',
              // backdrop-filter is real in Remotion's Chromium and needs no WebGL.
              backdropFilter: 'blur(18px) saturate(1.3)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <span style={{fontSize: 54, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em'}}>
              {current.scale.toFixed(2)}×
            </span>
            <span style={{fontSize: 28, fontWeight: 700, letterSpacing: '0.16em', color: accentColor}}>
              CUT {index + 1}
            </span>
            <span style={{fontSize: 28, fontWeight: 500, color: '#8d93a5'}}>+{sinceCut}f</span>
          </Interactive.Div>

          {/* The cut list as a strip, so you can see the alternation. */}
          <div
            style={{
              position: 'absolute',
              left: 84,
              right: 84,
              bottom: 84,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
            }}
          >
            {cuts.map((c) => (
              <div
                key={c.at}
                style={{
                  position: 'absolute',
                  left: `${(c.at / durationInFrames) * 100}%`,
                  top: -13,
                  width: 3,
                  height: 32,
                  borderRadius: 2,
                  backgroundColor: c === current ? accentColor : 'rgba(255, 255, 255, 0.5)',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${interpolate(frame, [0, durationInFrames], [0, 100], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })}%`,
                borderRadius: 3,
                backgroundColor: accentColor,
              }}
            />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
