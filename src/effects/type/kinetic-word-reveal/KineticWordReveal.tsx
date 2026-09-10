import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['800'], subsets: ['latin']});

/**
 * Kinetic Word Reveal
 * Words rise out of a clipping mask one after another, each on its own spring.
 * The mask is what sells it: overflow:hidden on a wrapper per word, so the word
 * appears to be pushed up from behind a solid edge instead of just fading in.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly accent: string;
  readonly bgDeep: string;
  readonly ink: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  accent: '#ff5c39',
  bgDeep: '#04050a',
  ink: '#ffffff',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly words?: readonly string[];
  readonly accentIndex?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
  /** Frames between the start of one word and the next. */
  readonly stagger?: number;
};

export const KineticWordReveal: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  words = ['Design', 'in', 'motion.'],
  accentIndex = 2,
  backgroundColor = theme.bgDeep,
  color = theme.ink,
  accentColor = theme.accent,
  stagger = 6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <div style={{display: 'flex', gap: 28, alignItems: 'baseline'}}>
        {words.map((word, i) => (
          // The mask: overflow hidden, with room for descenders. `lineHeight: 1`
          // makes the line box shorter than the font's ascent + descent, so g/j/p/y
          // hang below it and get sheared flat by the mask no matter how much
          // padding you add. 1.3 gives the box room; the padding then clears the rest.
          <div key={word + i} style={{overflow: 'hidden', paddingBottom: '0.12em'}}>
            <Interactive.Div
              name={`Word ${i + 1}`}
              style={{
                fontSize: 160,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.3,
                color: i === accentIndex ? accentColor : color,
                translate: interpolate(
                  frame,
                  [i * stagger, i * stagger + 0.9 * fps],
                  ['0px 110%', '0px 0%'],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  },
                ),
              }}
            >
              {word}
            </Interactive.Div>
          </div>
        ))}
      </div>

      {/* A hairline that draws itself under the phrase once the words have landed. */}
      <Interactive.Div
        name="Underline"
        style={{
          height: 4,
          marginTop: 44,
          borderRadius: 2,
          backgroundColor: accentColor,
          // Starts the moment the LAST word starts moving, so the rule grows
          // alongside the final arrival rather than waiting for silence.
          width: interpolate(
            frame,
            [(words.length - 1) * stagger, (words.length - 1) * stagger + 1.1 * fps],
            [0, 520],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      />
    </AbsoluteFill>
  );
};
