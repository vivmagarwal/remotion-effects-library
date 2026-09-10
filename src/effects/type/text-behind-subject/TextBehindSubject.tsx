import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['700', '900'], subsets: ['latin']});

/**
 * Text Behind Subject
 * Type sandwiched between a scene and its foreground, so the subject occludes
 * the words. It needs exactly three layers in exactly this order — background,
 * text, subject-with-alpha — and the whole effect lives or dies on the
 * foreground actually having transparency.
 */

type Props = {
  /** The full scene, painted underneath everything. */
  readonly backgroundSrc?: string;
  /** The SAME scene's foreground, with a transparent background. */
  readonly subjectSrc?: string;
  readonly text?: string;
  readonly kicker?: string;
  /** Frames the type takes to rise into place. */
  readonly riseFrames?: number;
  readonly startAt?: number;
  /** Slow push applied to every layer, so the parallax stays coherent. */
  readonly pushTo?: number;
  readonly textColor?: string;
  readonly accentColor?: string;
  readonly fontSize?: number;
};

export const TextBehindSubject: React.FC<Props> = ({
  backgroundSrc,
  subjectSrc,
  text = 'AFTER DARK',
  kicker = 'CHAPTER 02',
  riseFrames = 34,
  startAt = 12,
  pushTo = 1.08,
  textColor = '#ffffff',
  accentColor = '#ffd166',
  fontSize = 300,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const rise = interpolate(frame, [startAt, startAt + riseFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // One push, shared by all three layers. Scaling only the subject would break
  // the alignment that makes the occlusion believable.
  const push = interpolate(frame, [0, durationInFrames], [1, pushTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The type drifts slightly faster than the plates — just enough parallax to
  // separate it from both, without breaking the sandwich.
  const textPush = 1 + (push - 1) * 1.35;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden', fontFamily}}>
      {/* 1 — background: the whole scene. */}
      <CanvasImage
        src={backgroundSrc ?? staticFile('plate-4.svg')}
        style={{width: '100%', height: '100%', objectFit: 'cover', scale: push}}
      />

      {/* 2 — the type, between the two plates. */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Interactive.Div
          name="Kicker"
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '0.5em',
            marginRight: '-0.5em',
            color: accentColor,
            marginBottom: 22,
            opacity: interpolate(frame, [startAt + 8, startAt + 30], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {kicker}
        </Interactive.Div>
        <Interactive.Div
          name="Headline"
          style={{
            fontSize,
            fontWeight: 900,
            lineHeight: 0.94,
            letterSpacing: '-0.04em',
            color: textColor,
            whiteSpace: 'nowrap',
            textShadow: '0 24px 70px rgba(0,0,0,0.55)',
            scale: textPush,
            translate: `0px ${(1 - rise) * 90}px`,
            opacity: rise,
          }}
        >
          {text}
        </Interactive.Div>
      </AbsoluteFill>

      {/* 3 — the subject: the SAME scene's foreground, with real alpha. This
             layer is what cuts the type off, so it must be transparent
             everywhere the background shows through. */}
      <CanvasImage
        src={subjectSrc ?? staticFile('subject-skyline.svg')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: push,
        }}
      />

      {/* A graded wash over everything, to bed the type into the scene. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(8,6,20,0.34) 0%, transparent 34%, transparent 62%, rgba(8,6,20,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
