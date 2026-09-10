import {AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/JetBrainsMono';

// palette: data whole-file — terminal ANSI colours and a syntax theme; a terminal that renders in the house accent is not a terminal

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Typewriter Terminal
 * Text types itself out one character at a time, with a block cursor that blinks
 * on a frame-derived cycle. Both the typing and the blink are pure functions of
 * the frame — no setInterval, so it renders identically every time.
 */

type Line = {readonly text: string; readonly prompt?: string; readonly color?: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly mono: string;
  readonly accent: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: fontFamily,
  accent: '#ff5c39',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly lines?: readonly Line[];
  /** Characters revealed per second. */
  readonly charsPerSecond?: number;
  /** Frames the cursor spends on, then off. */
  readonly blinkFrames?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
};

export const TypewriterTerminal: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.mono,
  lines = [
    {prompt: '$', text: 'npx create-video@latest', color: '#f2f2f4'},
    {text: 'Scaffolding a blank Remotion project…', color: '#6c6c78'},
    {prompt: '$', text: 'npx remotion studio', color: '#f2f2f4'},
    {text: 'Server ready on http://localhost:3000', color: '#3ddc97'},
  ],
  charsPerSecond = 26,
  blinkFrames = 15,
  backgroundColor = '#0b0d12',
  color = '#f2f2f4',
  accentColor = theme.accent,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // How many characters have been typed in total by this frame.
  const typedTotal = Math.floor((frame / fps) * charsPerSecond);

  // Walk the lines, spending characters until they run out.
  let remaining = typedTotal;
  const rendered = lines.map((line) => {
    const take = Math.max(0, Math.min(line.text.length, remaining));
    remaining -= line.text.length + 4; // 4 characters' worth of pause between lines
    return {...line, shown: line.text.slice(0, take), done: take === line.text.length};
  });
  const activeIndex = Math.max(0, rendered.findIndex((l) => !l.done));
  const cursorLine = rendered.some((l) => !l.done) ? activeIndex : rendered.length - 1;

  // Frame-derived blink: on for blinkFrames, off for blinkFrames.
  const cursorOn = Math.floor(frame / blinkFrames) % 2 === 0;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, justifyContent: 'center', padding: 96}}>
      {/* Window chrome */}
      <Interactive.Div
        name="Window"
        style={{
          backgroundColor: '#12141b',
          border: '1px solid #232733',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
          scale: interpolate(frame, [0, 18], [0.94, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 9,
            alignItems: 'center',
            padding: '18px 22px',
            borderBottom: '1px solid #232733',
          }}
        >
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{width: 14, height: 14, borderRadius: 7, backgroundColor: c}} />
          ))}
          <span style={{fontFamily, fontSize: 20, color: '#4d5566', marginLeft: 14}}>zsh</span>
        </div>

        <div style={{padding: '30px 34px 38px', fontFamily, fontSize: 40, lineHeight: 1.65}}>
          {rendered.map((line, i) => (
            <div key={i} style={{color: line.color ?? color, whiteSpace: 'pre'}}>
              {line.prompt ? <span style={{color: accentColor}}>{line.prompt} </span> : null}
              {line.shown}
              {i === cursorLine && cursorOn ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: '0.58em',
                    height: '1.05em',
                    backgroundColor: accentColor,
                    verticalAlign: '-0.16em',
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
