import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '700'], subsets: ['latin']});

/**
 * Device Rise
 * The Apple keynote move: a device rises out of the floor, tilts to face you,
 * and its screen wakes. What makes it feel like an object rather than an image
 * is that the reflection is a real second copy — flipped, faded and blurred —
 * that rises with it.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly ink: string;
  readonly display: string;
  readonly text: string;
  readonly accent: string;
  readonly accentInk: string;
  readonly series: readonly string[];
  readonly bg: string;
  readonly paperInk: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  ink: '#ffffff',
  display: fontFamily,
  text: fontFamily,
  accent: '#ff5c39',
  accentInk: '#04050a',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  bg: '#0a0b10',
  paperInk: '#1d1b17',
};

/** WCAG relative luminance of a #rrggbb colour — the house `isDark` arithmetic. */
const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the headline. Defaults to this file's own loaded face, or the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly headline?: string;
  readonly subhead?: string;
  readonly deviceColor?: string;
  readonly screenColors?: readonly [string, string];
  readonly backgroundColor?: string;
  readonly accentColor?: string;
};

const Screen: React.FC<{colors: readonly [string, string]; wake: number; ink: string}> = ({colors, wake, ink}) => (
  <div
    style={{
      position: 'absolute',
      inset: 12,
      borderRadius: 38,
      overflow: 'hidden',
      backgroundColor: '#04050a',
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})`,
        opacity: wake,
      }}
    />
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        color: ink,
        fontFamily,
        fontSize: 78,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        opacity: wake,
      }}
    >
      ◐
    </AbsoluteFill>
  </div>
);

export const DeviceRise: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  headline = 'Introducing',
  subhead = 'a phone that renders itself',
  deviceColor = theme.paperInk,
  accentColor = theme.accent,
  screenColors = [accentColor, theme.series[4]],
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // White until the screen itself is light — white on lime or amber vanishes.
  const screenInk = Math.max(luminance(screenColors[0]), luminance(screenColors[1])) > 0.5 ? theme.accentInk : '#fff';

  // One rise value drives the device, its reflection and the tilt.
  const rise = interpolate(frame, [6, 6 + 1.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const tilt = interpolate(rise, [0, 1], [26, 4]);
  const wake = interpolate(frame, [1.5 * fps, 2.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const Device: React.FC<{reflection?: boolean}> = ({reflection}) => (
    <div
      style={{
        position: 'relative',
        width: 344,
        height: 706,
        borderRadius: 48,
        backgroundColor: deviceColor,
        boxShadow: reflection ? undefined : '0 60px 120px rgba(0,0,0,0.66)',
        border: '2px solid rgba(255,255,255,0.16)',
      }}
    >
      <Screen colors={screenColors} wake={wake} ink={screenInk} />
    </div>
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 42%, ${accentColor}1f 0%, transparent 58%)`,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        // Perspective belongs on the PARENT of the tilted element.
        perspective: 2200,
      }}
    >
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 62,
          fontFamily: displayFamily,
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          color: theme.ink,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: interpolate(frame, [0, 24], ['0px 26px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {headline}
      </Interactive.Div>

      <div style={{position: 'relative', transformStyle: 'preserve-3d'}}>
        <div
          style={{
            transform: `rotateX(${tilt}deg)`,
            translate: `0px ${(1 - rise) * 620}px`,
            opacity: Math.min(1, rise * 2.2),
          }}
        >
          <Device />
        </div>

        {/* The reflection: a real second copy, flipped and faded. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 26,
            transform: `rotateX(${tilt}deg) scaleY(-1)`,
            translate: `0px ${(1 - rise) * 620}px`,
            opacity: Math.min(0.24, rise * 0.24),
            filter: 'blur(7px)',
            maskImage: 'linear-gradient(rgba(0,0,0,0.85), transparent 62%)',
            WebkitMaskImage: 'linear-gradient(rgba(0,0,0,0.85), transparent 62%)',
            pointerEvents: 'none',
          }}
        >
          <Device reflection />
        </div>
      </div>

      <Interactive.Div
        name="Subhead"
        style={{
          position: 'absolute',
          bottom: 58,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: accentColor,
          opacity: interpolate(frame, [2.2 * fps, 2.9 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subhead}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
