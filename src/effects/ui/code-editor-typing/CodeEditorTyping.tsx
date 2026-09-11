import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/JetBrainsMono';

// palette: data whole-file — an editor recreation: the chrome is VS Code's and the token colours are a syntax syntax, which is a colour SYSTEM in its own right

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Code Editor Typing
 * Code types itself into an editor, syntax-highlighted, with line numbers and a
 * caret. The highlighter runs on the *visible slice* every frame, so a half-typed
 * keyword is not coloured until it is actually complete — which is what a real
 * editor does and is the detail that sells it.
 */

type SyntaxTheme = {
  readonly bg: string;
  readonly gutter: string;
  readonly text: string;
  readonly keyword: string;
  readonly string: string;
  readonly comment: string;
  readonly number: string;
  readonly fn: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly mono: string;
  readonly bgDeep: string;
  readonly surface: string;
  readonly radius: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: fontFamily,
  bgDeep: '#04050a',
  surface: '#101218',
  radius: 18,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly code?: string;
  readonly filename?: string;
  readonly charsPerSecond?: number;
  readonly typeFrom?: number;
  readonly enterFrames?: number;
  readonly exitFrames?: number;
  readonly blinkFrames?: number;
  readonly syntax?: SyntaxTheme;
  readonly fontSize?: number;
  readonly backgroundColor?: string;
  readonly radius?: number;
};

const DEFAULT_CODE = `import {useCurrentFrame, interpolate} from 'remotion';

// Every frame is a pure function of its number.
export const FadeIn = () => {
  const frame = useCurrentFrame();

  return (
    <h1 style={{opacity: interpolate(frame, [0, 30], [0, 1])}}>
      Hello, video
    </h1>
  );
};`;

const KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'return', 'type', 'as',
  'default', 'function', 'if', 'else', 'for', 'of', 'in', 'new', 'await', 'async',
  'interface', 'readonly', 'extends', 'null', 'undefined', 'true', 'false',
]);

/** Comments and strings are matched before identifiers, so keywords inside them stay plain. */
const TOKEN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

const highlight = (src: string, t: SyntaxTheme): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of src.matchAll(TOKEN)) {
    const [text, comment, str, num, word] = m;
    if (m.index > last) out.push(src.slice(last, m.index));
    last = m.index + text.length;

    if (comment) out.push(<span key={key++} style={{color: t.comment, fontStyle: 'italic'}}>{text}</span>);
    else if (str) out.push(<span key={key++} style={{color: t.string}}>{text}</span>);
    else if (num) out.push(<span key={key++} style={{color: t.number}}>{text}</span>);
    else if (word && KEYWORDS.has(word)) out.push(<span key={key++} style={{color: t.keyword}}>{word}</span>);
    else if (word && src[last] === '(') out.push(<span key={key++} style={{color: t.fn}}>{word}</span>);
    else out.push(text);
  }
  out.push(src.slice(last));
  return out;
};

export const CodeEditorTyping: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.mono,
  code = DEFAULT_CODE,
  filename = 'FadeIn.tsx',
  charsPerSecond = 34,
  typeFrom = 16,
  enterFrames = 20,
  exitFrames = 24,
  blinkFrames = 15,
  fontSize = 30,
  /** The ground behind the window. The editor's own chrome is `syntax`. */
  backgroundColor = theme.bgDeep,
  /** Window corner radius. The one shape token a recreated UI can honestly take. */
  radius = theme.radius,
  syntax = {
    // The editor plate is the one ground in this recreation the library owns.
    bg: theme.surface,
    gutter: '#3a4055',
    text: '#d6dae6',
    keyword: '#ff7b72',
    string: '#a5d6a3',
    comment: '#6b7285',
    number: '#f2cc7f',
    fn: '#7fb5ff',
  },
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const typed = Math.max(0, Math.floor(((frame - typeFrom) / fps) * charsPerSecond));
  const shown = code.slice(0, Math.min(code.length, typed));
  const done = typed >= code.length;

  // Reserve every line's row from frame 0, so the editor does not grow as it
  // types and the whole block stays optically centred.
  const totalLines = code.split('\n').length;
  const lines = shown.split('\n');
  const caretLine = lines.length - 1;

  const cursorOn = !done || Math.floor(frame / blinkFrames) % 2 === 0;

  const enter = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit =
    exitFrames > 0
      ? interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.5, 0, 0.75, 0),
        })
      : 0;

  const lineHeight = fontSize * 1.6;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 66%)',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Editor"
        style={{
          width: 1440,
          backgroundColor: syntax.bg,
          borderRadius: radius,
          overflow: 'hidden',
          border: '1px solid #232838',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          scale: (0.95 + enter * 0.05) * (1 - exit * 0.05),
          translate: `0px ${(1 - enter) * 24 + exit * 26}px`,
          opacity: enter * (1 - exit),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '18px 22px',
            borderBottom: '1px solid #232838',
          }}
        >
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{width: 13, height: 13, borderRadius: 7, backgroundColor: c}} />
          ))}
          <span style={{fontSize: 20, color: '#7a8299', marginLeft: 16}}>{filename}</span>
        </div>

        <div style={{display: 'flex', padding: '26px 0 30px'}}>
          <div
            style={{
              width: 88,
              flexShrink: 0,
              textAlign: 'right',
              paddingRight: 26,
              fontSize,
              lineHeight: `${lineHeight}px`,
              color: syntax.gutter,
            }}
          >
            {new Array(totalLines).fill(0).map((_, i) => (
              <div key={i} style={{opacity: i < lines.length ? 1 : 0.35}}>
                {i + 1}
              </div>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              fontSize,
              lineHeight: `${lineHeight}px`,
              color: syntax.text,
              whiteSpace: 'pre',
              paddingRight: 30,
              // Reserve the full block height so nothing reflows while typing.
              minHeight: totalLines * lineHeight,
            }}
          >
            {lines.map((line, i) => (
              <div key={i} style={{position: 'relative'}}>
                {/* Highlight the visible slice only: a half-typed keyword is not
                    a keyword yet, and colouring it early is the giveaway. */}
                {highlight(line, syntax)}
                {i === caretLine && cursorOn ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 3,
                      height: '1.05em',
                      backgroundColor: '#7fb5ff',
                      verticalAlign: '-0.18em',
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
