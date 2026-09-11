import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/PlayfairDisplay';

// palette: brand-mimicry whole-file — Claude's product UI; every colour on screen is theirs

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600'], subsets: ['latin']});
const {fontFamily: serif} = loadSerif('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Claude Full UI
 * Claude's warm-paper interface: sunburst mark, serif greeting, and a composer
 * that types a prompt, sends it, and streams a reply. The palette is the point —
 * a cream ground and a single clay accent, where every other assistant UI is
 * white-and-blue.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly bg: string;
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  bg: '#0a0b10',
  text: fontFamily,
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** CSS family for the UI chrome. Defaults to this file's sans, or the theme's text face. */
  readonly uiFamily?: string;
  /** CSS family for the greeting. Defaults to this file's Playfair — the greeting face is part of the recreation, so no theme reaches it. */
  readonly greetingFamily?: string;
  readonly greeting?: string;
  readonly prompt?: string;
  readonly answer?: string;
  readonly model?: string;
  readonly charsPerSecond?: number;
  readonly answerCharsPerSecond?: number;
  readonly typeFrom?: number;
  readonly thinkFrames?: number;
  readonly enterFrames?: number;
  readonly exitFrames?: number;
  readonly zoomWhileTyping?: number;
  readonly accentColor?: string;
  readonly paperColor?: string;
};

/** Claude's twelve-ray sunburst, built by rotating one tapered ray. */
const Sunburst: React.FC<{size: number; color: string; spin?: number}> = ({size, color, spin = 0}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{rotate: `${spin}deg`}}>
    {new Array(12).fill(0).map((_, i) => (
      <rect
        key={i}
        x={22.6}
        y={3.5}
        width={2.8}
        height={17}
        rx={1.4}
        fill={color}
        // Rotating one ray twelve times around the centre keeps every arm
        // identical — laying them out by hand never quite does.
        transform={`rotate(${i * 30} 24 24)`}
      />
    ))}
  </svg>
);

export const ClaudeFullUi: React.FC<Props> = ({
  theme = THEME,
  uiFamily = theme.text,
  greetingFamily = serif,
  greeting = 'How can I help you today?',
  prompt = 'can you render this as a video?',
  answer = 'Yes. Describe the frame as a React component, register it as a composition, and Remotion will render every frame and encode them into an MP4 for you.',
  model = 'Claude Opus 4.5',
  charsPerSecond = 18,
  answerCharsPerSecond = 40,
  typeFrom = 26,
  thinkFrames = 22,
  enterFrames = 20,
  exitFrames = 26,
  zoomWhileTyping = 1.03,
  accentColor = '#d97757',
  paperColor = '#faf9f5',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const typed = Math.max(0, Math.floor(((frame - typeFrom) / fps) * charsPerSecond));
  const draft = prompt.slice(0, Math.min(prompt.length, typed));
  const hasDraft = draft.length > 0;

  const sendAt = typeFrom + Math.ceil((prompt.length / charsPerSecond) * fps) + 12;
  const answerAt = sendAt + thinkFrames;
  const sent = frame >= sendAt;

  const press = sent
    ? interpolate(frame - sendAt, [0, 3, 12], [0.88, 0.88, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

  const handover = interpolate(frame, [sendAt, sendAt + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const answered = Math.max(0, Math.floor(((frame - answerAt) / fps) * answerCharsPerSecond));
  const streaming = frame >= answerAt && answered < answer.length;

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

  const typingProgress = prompt.length ? Math.min(1, typed / prompt.length) : 0;
  const zoom = 1 + (zoomWhileTyping - 1) * typingProgress * (1 - handover);

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        // The authored warm near-black is Claude's own dark; a light theme stands
        // the window on its own ground rather than fading it up from black.
        backgroundColor: theme.scheme === 'light' ? theme.bg : '#141310',
        fontFamily: uiFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Window"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: paperColor,
          display: 'flex',
          scale: (0.97 + enter * 0.03) * zoom * (1 - exit * 0.04),
          opacity: enter * (1 - exit),
        }}
      >
        {/* Sidebar — a shade deeper than the page, not a different colour. */}
        <div
          style={{
            width: 268,
            backgroundColor: '#f2efe6',
            borderRight: '1px solid #e8e3d6',
            // 34px clears the ~29px each side that a 1.03 push crops off the frame.
            padding: '26px 34px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            flexShrink: 0,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <Sunburst size={28} color={accentColor} />
            <span style={{fontSize: 24, fontWeight: 500, color: '#1f1e1c'}}>Claude</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#e9e4d6',
              borderRadius: 12,
              padding: '13px 16px',
              fontSize: 19,
              color: '#3d3a34',
            }}
          >
            <span style={{color: accentColor, fontSize: 22}}>+</span> New chat
          </div>
          <div style={{fontSize: 15, color: '#8c877c', letterSpacing: '0.06em', marginTop: 8}}>RECENTS</div>
          {['Remotion effects library', 'Kinetic type experiments', 'Render pipeline notes'].map((t) => (
            <div key={t} style={{fontSize: 18, color: '#6c675e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {t}
            </div>
          ))}
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
          <div style={{display: 'flex', alignItems: 'center', padding: '24px 40px', flexShrink: 0}}>
            <span style={{fontSize: 19, color: '#6c675e'}}>{model}</span>
            <span style={{fontSize: 15, color: '#a09a8d', marginLeft: 8}}>⌄</span>
            <span
              style={{
                marginLeft: 'auto',
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: accentColor,
                color: '#fff',
                fontSize: 19,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              V
            </span>
          </div>

          {/* Greeting and conversation trade places on one handover value. */}
          <div style={{flex: 1, minHeight: 0, position: 'relative', padding: '0 130px'}}>
            <AbsoluteFill
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 1 - handover,
                scale: 1 - handover * 0.05,
                translate: `0px ${-handover * 36}px`,
              }}
            >
              <Sunburst size={62} color={accentColor} spin={Math.sin((frame / fps) * 0.5) * 6} />
              <Interactive.Div
                name="Greeting"
                style={{fontFamily: greetingFamily, fontSize: 62, color: '#2b2924', marginTop: 24}}
              >
                {greeting}
              </Interactive.Div>
            </AbsoluteFill>

            <AbsoluteFill
              style={{
                justifyContent: 'center',
                opacity: handover,
                translate: `0px ${(1 - handover) * 28}px`,
              }}
            >
              <div
                style={{
                  alignSelf: 'flex-end',
                  backgroundColor: '#f0ece0',
                  border: '1px solid #e4dfd0',
                  color: '#2b2924',
                  fontSize: 27,
                  padding: '16px 26px',
                  borderRadius: 20,
                  maxWidth: '72%',
                }}
              >
                {prompt}
              </div>
              <div style={{display: 'flex', gap: 20, marginTop: 34, alignItems: 'flex-start'}}>
                <div style={{paddingTop: 5, flexShrink: 0}}>
                  {/* The mark spins only while the answer is still streaming. */}
                  <Sunburst size={30} color={accentColor} spin={streaming ? frame * 2.4 : 0} />
                </div>
                <Interactive.Div
                  name="Answer"
                  style={{fontSize: 29, lineHeight: 1.6, color: '#2b2924'}}
                >
                  {answer.slice(0, answered)}
                </Interactive.Div>
              </div>
            </AbsoluteFill>
          </div>

          {/* Composer */}
          <div style={{padding: '0 130px 26px', flexShrink: 0}}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4dfd0',
                borderRadius: 22,
                padding: '22px 26px 16px',
                boxShadow: '0 1px 2px rgba(60,50,30,0.05), 0 14px 34px rgba(60,50,30,0.08)',
              }}
            >
              <div style={{fontSize: 26, lineHeight: 1.5, color: hasDraft && !sent ? '#2b2924' : '#9c968a', minHeight: 40}}>
                {sent ? 'Reply to Claude…' : hasDraft ? draft : 'How can I help you today?'}
                {hasDraft && !sent ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1.05em',
                      backgroundColor: accentColor,
                      verticalAlign: '-0.18em',
                      marginLeft: 2,
                    }}
                  />
                ) : null}
              </div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 20, color: '#9c968a', fontSize: 24}}>
                  <span>+</span>
                  <span style={{fontSize: 19}}>{model} ⌄</span>
                </div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: hasDraft && !sent ? accentColor : '#e6e1d4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    scale: press,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={hasDraft && !sent ? '#fff' : '#b3ada0'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
