import {AbsoluteFill, Easing, Freeze, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin']});

/**
 * Freeze Trail
 * Motion blur made from time rather than from a blur filter: the same subject is
 * drawn N times, each `<Freeze>`-d a frame or two in the past, at decaying
 * opacity. The trail is therefore a real record of where the thing was, so it
 * bends through curves and bunches when the subject slows — which a directional
 * blur cannot do.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly display: string;
  readonly accent: string;
  readonly bg: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  display: fontFamily,
  accent: '#ff5c39',
  bg: '#0a0b10',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly word?: string;
  readonly caption?: string;
  /** How many past copies to draw. */
  readonly samples?: number;
  /** Frames between one echo and the next. */
  readonly spacing?: number;
  /** Opacity of the oldest echo. */
  readonly tailOpacity?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly loopFrames?: number;
};

/**
 * The subject. It reads `useCurrentFrame()` itself, which is what lets `<Freeze>`
 * rewind it — a subject positioned by a prop from the parent would ignore the
 * freeze entirely and every echo would land in the same place.
 */
const Subject: React.FC<{
  word: string;
  accentColor: string;
  loopFrames: number;
}> = ({word, accentColor, loopFrames}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();

  // A hard swing across and back — fast in the middle, still at both ends, so
  // the trail is dense where it matters and gone where it does not.
  const t = (frame % loopFrames) / loopFrames;
  const swing = Math.sin(t * Math.PI * 2);
  const x = swing * (width * 0.3);
  const tilt = -swing * 9;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          fontFamily,
          fontSize: 210,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: accentColor,
          whiteSpace: 'nowrap',
          translate: `${x}px 0px`,
          rotate: `${tilt}deg`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};

export const FreezeTrail: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  word = 'VELOCITY',
  caption = '12 × <Freeze frame={frame − i × 2}>',
  samples = 12,
  spacing = 2,
  tailOpacity = 0.06,
  accentColor = theme.accent,
  backgroundColor = theme.bg,
  loopFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 50%, ${accentColor}1a 0%, transparent 62%)`}}
      />

      {/* Oldest echo first, so the live subject paints last and stays crisp. */}
      {new Array(samples).fill(0).map((_, i) => {
        const age = samples - 1 - i; // samples-1 … 0
        const past = frame - age * spacing;
        if (past < 0) return null;

        const opacity =
          age === 0
            ? 1
            : interpolate(age, [1, samples - 1], [tailOpacity * 4, tailOpacity], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

        return (
          <AbsoluteFill key={age} style={{opacity}}>
            {/* Freeze rewinds the subtree's clock to a past frame. */}
            <Freeze frame={past}>
              <Subject word={word} accentColor={accentColor} loopFrames={loopFrames} />
            </Freeze>
          </AbsoluteFill>
        );
      })}

      <Interactive.Div
        name="Caption"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 120,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 28,
          color: '#8d93a5',
          opacity: interpolate(frame, [10, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
