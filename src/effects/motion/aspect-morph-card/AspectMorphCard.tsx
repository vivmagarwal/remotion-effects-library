import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Aspect Morph Card
 * A media card that morphs between a tall portrait frame and a small landscape
 * one, freeing the space for a text beat and then taking it back. The move is an
 * interpolation of the card's *layout rectangle* — not a transform — so the
 * content re-crops around its subject instead of being squashed.
 */

type Rect = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};

/** A moment where the card gives up the frame. */
type Beat = {
  /** Frame the beat starts. */
  readonly at: number;
  /** Frames the card stays shifted. */
  readonly hold: number;
  readonly kicker: string;
  readonly lines: readonly string[];
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly accent: string;
  readonly paper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  accent: '#ff5c39',
  paper: '#f6f5f2',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  readonly title?: string;
  /** The card at rest. */
  readonly rest?: Rect;
  /** The card while a beat is running. */
  readonly shifted?: Rect;
  readonly beats?: readonly Beat[];
  readonly accentColor?: string;
  readonly paperColor?: string;
  /** Frames the morph itself takes, each way. */
  readonly morphFrames?: number;
};

export const AspectMorphCard: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src,
  title = 'ASPECT MORPH',
  rest = {x: 44, y: 300, w: 992, h: 1180},
  shifted = {x: 150, y: 1170, w: 780, h: 500},
  beats = [
    {
      at: 66,
      hold: 78,
      kicker: 'WHAT IT IS',
      lines: ['Interpolate the', 'rectangle —', 'not a transform.'],
    },
    {
      at: 220,
      hold: 84,
      kicker: 'WHY IT WORKS',
      lines: ['objectFit: cover', 're-crops the', 'subject as it goes.'],
    },
  ],
  accentColor = theme.accent,
  paperColor = theme.paper,
  morphFrames = 14,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // One `shift` value, 0 = at rest, 1 = fully moved. Each beat contributes a
  // spring in and a spring out; taking the max lets beats sit next to each other
  // without their springs fighting.
  let shift = 0;
  let active: Beat | null = null;
  for (const b of beats) {
    const out = b.at + b.hold;
    if (frame < b.at - morphFrames) continue;
    const sIn = spring({
      frame: frame - (b.at - morphFrames),
      fps,
      config: {damping: 15, stiffness: 150},
      durationInFrames: morphFrames,
    });
    const sOut =
      frame >= out
        ? spring({
            frame: frame - out,
            fps,
            config: {damping: 15, stiffness: 150},
            durationInFrames: morphFrames,
          })
        : 0;
    const contribution = Math.max(0, sIn - sOut);
    if (contribution > shift) {
      shift = contribution;
      active = b;
    }
  }

  // The move itself: lerp the rect. Everything else follows from this.
  const lerp = (a: number, b: number) => a + (b - a) * shift;
  const card: Rect = {
    x: lerp(rest.x, shifted.x),
    y: lerp(rest.y, shifted.y),
    w: lerp(rest.w, shifted.w),
    h: lerp(rest.h, shifted.h),
  };

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: paperColor, fontFamily, overflow: 'hidden'}}>
      {/* Header stays put; it is the fixed thing the card moves against. */}
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 60,
          top: 108,
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: '0.2em',
          color: '#1d1b17',
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 168,
          height: 5,
          width: 132,
          backgroundColor: accentColor,
        }}
      />

      {/* The text beat lives in the space the card gives up. It fades with the
          same `shift`, so it can never be visible while the card is covering it. */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 330,
          opacity: interpolate(shift, [0.45, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: `0px ${(1 - shift) * 40}px`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: paperColor,
            backgroundColor: accentColor,
            padding: '10px 20px',
            borderRadius: 8,
            marginBottom: 34,
          }}
        >
          {active?.kicker ?? ''}
        </div>
        {(active?.lines ?? []).map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.16,
              letterSpacing: '-0.03em',
              color: '#1d1b17',
              // A small per-line stagger, driven by shift rather than by frame,
              // so the lines re-stagger identically on the way out.
              opacity: interpolate(shift, [0.5 + i * 0.12, 0.8 + i * 0.12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              translate: `0px ${interpolate(shift, [0.5 + i * 0.12, 0.9 + i * 0.12], [26, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}px`,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* THE CARD. Position and size are the animation; nothing here is scaled. */}
      <Interactive.Div
        name="Card"
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          borderRadius: 28,
          overflow: 'hidden',
          border: '4px solid #1d1b17',
          boxShadow: '0 26px 70px rgba(29,27,23,0.28)',
          backgroundColor: '#1d1b17',
        }}
      >
        <CanvasImage
          src={src ?? staticFile('plate-4.svg')}
          style={{
            width: '100%',
            height: '100%',
            // The whole illusion: cover re-crops around the subject as the
            // rectangle changes aspect. `fill` would squash it, `contain` would
            // letterbox it, and either instantly reads as a resize.
            objectFit: 'cover',
            objectPosition: '50% 42%',
          }}
        />

        {/* A chip riding the card, so the card is clearly one object. */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            bottom: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(246,244,239,0.94)',
            borderRadius: 999,
            padding: '9px 18px',
            fontSize: 24,
            fontWeight: 700,
            color: '#1d1b17',
          }}
        >
          <span style={{width: 12, height: 12, borderRadius: 6, backgroundColor: accentColor}} />
          PLATE 04
        </div>
      </Interactive.Div>

      {/* Read-out, so the mechanism is legible while you watch it. */}
      <Interactive.Div
        name="Readout"
        style={{
          position: 'absolute',
          right: 60,
          top: 112,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          color: '#4a4e5a',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        shift {shift.toFixed(2)}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
