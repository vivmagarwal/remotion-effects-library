import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

// palette: brand-mimicry whole-file — macOS window chrome and a rendered web page; both belong to someone else

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '700', '800'], subsets: ['latin']});

/**
 * Browser Window Scroll
 * A product page scrolling inside a browser chrome, tilted in 3D. The chrome is
 * the cheapest credibility you can buy in a product video — the same content in a
 * bare rectangle reads as a mockup, and inside a window it reads as a real page.
 */

type Section = {readonly kind: 'hero' | 'cards' | 'stat' | 'cta'; readonly title: string; readonly body?: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly mono: string;
  readonly muted: string;
  readonly text: string;
  readonly accent: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  muted: '#8d93a5',
  text: fontFamily,
  accent: '#ff5c39',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly url?: string;
  readonly sections?: readonly Section[];
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  /** Total page height in px. The scroll travels this minus the viewport. */
  readonly pageHeight?: number;
};

export const BrowserWindowScroll: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  url = 'remotion.dev/effects',
  sections = [
    {kind: 'hero', title: 'Video, written in React', body: 'Compose, preview and render frame by frame.'},
    {kind: 'cards', title: 'Everything is a component'},
    {kind: 'stat', title: '4.0.522', body: 'the version this library targets'},
    {kind: 'cta', title: 'npx create-video@latest'},
  ],
  accentColor = theme.accent,
  backgroundColor = '#0d0f16',
  pageHeight = 2400,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const VIEW_W = 1420;
  const VIEW_H = 800;

  const scroll = interpolate(frame, [24, 24 + 4.2 * fps], [0, pageHeight - VIEW_H], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.42, 0, 0.28, 1),
  });

  const enter = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Every section is exactly SECTION_H tall, so `pageHeight` is an exact number
  // rather than a guess. Guessing it scrolls the page off the end of the viewport.
  const SECTION_H = pageHeight / sections.length;

  const Section: React.FC<{s: Section}> = ({s}) => {
    if (s.kind === 'hero') {
      return (
        <div style={{height: SECTION_H, padding: '0 90px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontSize: 84, fontWeight: 800, color: '#12141c', letterSpacing: '-0.035em', lineHeight: 1.08}}>
            {s.title}
          </div>
          <div style={{fontSize: 34, color: '#5f6577', marginTop: 22}}>{s.body}</div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 40,
              padding: '20px 40px',
              borderRadius: 14,
              backgroundColor: accentColor,
              color: '#fff',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Get started
          </div>
        </div>
      );
    }
    if (s.kind === 'cards') {
      return (
        <div style={{height: SECTION_H, padding: '0 90px', backgroundColor: '#f4f5f8', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontSize: 48, fontWeight: 800, color: '#12141c', marginBottom: 34}}>{s.title}</div>
          <div style={{display: 'flex', gap: 24}}>
            {['Sequence', 'Transition', 'Effect'].map((c, i) => (
              <div
                key={c}
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  padding: 32,
                  border: '1px solid #e3e5ec',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: ['#4cc9f0', '#c6ff3d', accentColor][i],
                    marginBottom: 22,
                  }}
                />
                <div style={{fontSize: 32, fontWeight: 700, color: '#12141c'}}>{c}</div>
                <div style={{fontSize: 24, color: '#6b7183', marginTop: 8, lineHeight: 1.5}}>
                  A primitive you compose with.
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (s.kind === 'stat') {
      return (
        <div style={{height: SECTION_H, padding: '0 90px', backgroundColor: '#12141c', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{fontSize: 132, fontWeight: 800, color: accentColor, letterSpacing: '-0.04em'}}>
            {s.title}
          </div>
          <div style={{fontSize: 30, color: theme.muted, marginTop: 12}}>{s.body}</div>
        </div>
      );
    }
    return (
      <div style={{height: SECTION_H, padding: '0 90px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: theme.mono,
            fontSize: 40,
            padding: '26px 44px',
            borderRadius: 14,
            backgroundColor: '#12141c',
            color: '#c6ff3d',
          }}
        >
          {s.title}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 30%, ${accentColor}1c 0%, transparent 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        // Perspective must live on the PARENT of the tilted element.
        perspective: 2600,
      }}
    >
      <Interactive.Div
        name="Browser"
        style={{
          width: VIEW_W,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 60px 140px rgba(0,0,0,0.6)',
          transform: `rotateX(${(1 - enter) * 16 + 5}deg) rotateY(${(1 - enter) * -10 - 3}deg)`,
          scale: 0.9 + enter * 0.1,
          opacity: enter,
        }}
      >
        {/* Chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            backgroundColor: '#eceef3',
            borderBottom: '1px solid #dcdfe8',
          }}
        >
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{width: 16, height: 16, borderRadius: 8, backgroundColor: c}} />
          ))}
          <div
            style={{
              flex: 1,
              marginLeft: 16,
              backgroundColor: '#fff',
              borderRadius: 10,
              padding: '11px 20px',
              fontSize: 24,
              color: '#5f6577',
              border: '1px solid #dcdfe8',
            }}
          >
            {url}
          </div>
        </div>

        {/* Viewport — overflow:hidden here is what turns a tall page into a scroll. */}
        <div style={{height: VIEW_H, overflow: 'hidden', position: 'relative'}}>
          <div style={{translate: `0px ${-scroll}px`}}>
            {sections.map((s, i) => (
              <Section key={i} s={s} />
            ))}
          </div>

          {/* Scrollbar */}
          <div style={{position: 'absolute', right: 8, top: 8, bottom: 8, width: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.06)'}}>
            <div
              style={{
                width: '100%',
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.22)',
                height: `${(VIEW_H / pageHeight) * 100}%`,
                translate: `0px ${(scroll / pageHeight) * (VIEW_H - 16)}px`,
              }}
            />
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
