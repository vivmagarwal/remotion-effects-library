import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

// palette: brand-mimicry whole-file — Gemini's landing and answer UI; every colour on screen is theirs

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600'], subsets: ['latin']});

/**
 * Hero Handover UI
 * Google's Gemini landing state — sparkle, hero line, pill composer — typing a
 * prompt, sending it, and handing over to a streamed answer. The hero collapsing
 * out as the answer arrives is the whole transition: one progress value drives
 * both, so they can never overlap.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly bg: string;
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  bg: '#0a0b10',
  text: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly prompt?: string;
  readonly answer?: string;
  readonly hero?: string;
  readonly url?: string;
  readonly model?: string;
  readonly charsPerSecond?: number;
  readonly answerCharsPerSecond?: number;
  readonly typeFrom?: number;
  /** Frames between sending and the answer starting. */
  readonly thinkFrames?: number;
  readonly enterFrames?: number;
  readonly exitFrames?: number;
  readonly zoomWhileTyping?: number;
};

const Sparkle: React.FC<{size: number; spin?: number}> = ({size, spin = 0}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{rotate: `${spin}deg`}}>
    <defs>
      {/* Runs top-to-bottom, not corner-to-corner: the star's points are at 12
          and 6 o'clock, so a diagonal gradient puts purple on the top point and
          the blue never shows. */}
      <linearGradient id="gem-spark" x1="0.34" y1="0" x2="0.66" y2="1">
        <stop offset="0%" stopColor="#4285f4" />
        <stop offset="30%" stopColor="#7b6ef0" />
        <stop offset="55%" stopColor="#ea4335" />
        <stop offset="78%" stopColor="#fbbc05" />
        <stop offset="100%" stopColor="#34a853" />
      </linearGradient>
    </defs>
    {/* A four-point star with concave sides — the Gemini mark. */}
    <path
      d="M12 1.6C12 7 17 12 22.4 12 17 12 12 17 12 22.4 12 17 7 12 1.6 12 7 12 12 7 12 1.6Z"
      fill="url(#gem-spark)"
    />
  </svg>
);

export const HeroHandoverUi: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  prompt = 'explain remotion in one sentence',
  answer = 'Remotion lets you write videos as React components — every frame is the same component rendered at a different frame number, then encoded to MP4.',
  hero = 'Meet Gemini, your personal AI assistant',
  url = 'gemini.google.com/app',
  model = '3.5 Flash',
  charsPerSecond = 19,
  answerCharsPerSecond = 44,
  typeFrom = 26,
  thinkFrames = 24,
  enterFrames = 20,
  exitFrames = 26,
  zoomWhileTyping = 1.03,
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

  // One value governs the hero-out / answer-in swap, so they can never overlap.
  const handover = interpolate(frame, [sendAt, sendAt + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const answered = Math.max(0, Math.floor(((frame - answerAt) / fps) * answerCharsPerSecond));

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
    <AbsoluteFill name="Scene" style={{backgroundColor: theme.bg, fontFamily, overflow: 'hidden'}}>
      <Interactive.Div
        name="Window"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          // Gemini's signature wash: white at the top falling to a pale blue floor.
          backgroundImage: 'linear-gradient(#ffffff 0%, #ffffff 34%, #e8f0fe 78%, #cfe0fb 100%)',
          scale: (0.97 + enter * 0.03) * zoom * (1 - exit * 0.04),
          opacity: enter * (1 - exit),
        }}
      >
        {/* URL bar */}
        <div style={{backgroundColor: '#fff', padding: '12px 34px', display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0}}>
          {['M19 12H5M11 6l-6 6 6 6', 'M5 12h14M13 6l6 6-6 6', 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5'].map((d, i) => (
            <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          ))}
          <div
            style={{
              flex: 1,
              marginLeft: 6,
              border: '2px solid #1a73e8',
              borderRadius: 999,
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{fontSize: 16, color: '#5f6368'}}>⚙</span>
            {/* Selected-text highlight, as if the address bar was just focused. */}
            <span style={{fontSize: 19, color: '#202124', backgroundColor: '#accef7', padding: '1px 3px'}}>
              {url}
            </span>
          </div>
        </div>

        {/* App header */}
        <div style={{display: 'flex', alignItems: 'center', padding: '22px 40px', gap: 22, flexShrink: 0}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3c4043" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span style={{fontSize: 25, color: '#1f1f1f'}}>Gemini</span>
          <span style={{fontSize: 25, color: '#9aa0a6'}}>{model}</span>
          <span style={{fontSize: 16, color: '#9aa0a6'}}>⌄</span>
          <span
            style={{
              marginLeft: 'auto',
              backgroundColor: '#d3e3fd',
              color: '#0b57d0',
              fontSize: 19,
              fontWeight: 500,
              padding: '12px 28px',
              borderRadius: 999,
            }}
          >
            Sign in
          </span>
        </div>

        {/* Stage: the hero and the answer trade places on one `handover` value. */}
        <div style={{flex: 1, minHeight: 0, position: 'relative', padding: '0 150px'}}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 1 - handover,
              scale: 1 - handover * 0.06,
              translate: `0px ${-handover * 40}px`,
            }}
          >
            <Sparkle size={86} spin={Math.sin((frame / fps) * 0.55) * 7} />
            <Interactive.Div
              name="Hero"
              style={{fontSize: 56, color: '#1f1f1f', marginTop: 26, letterSpacing: '-0.01em'}}
            >
              {hero}
            </Interactive.Div>
          </AbsoluteFill>

          <AbsoluteFill
            style={{
              justifyContent: 'center',
              padding: '0 20px',
              opacity: handover,
              translate: `0px ${(1 - handover) * 30}px`,
            }}
          >
            <div style={{alignSelf: 'flex-end', backgroundColor: '#e9eef6', color: '#1f1f1f', fontSize: 27, padding: '16px 26px', borderRadius: 26, maxWidth: '70%'}}>
              {prompt}
            </div>
            <div style={{display: 'flex', gap: 20, marginTop: 34, alignItems: 'flex-start'}}>
              <div style={{paddingTop: 4, flexShrink: 0}}>
                <Sparkle size={36} spin={Math.sin((frame / fps) * 0.8) * 9} />
              </div>
              <Interactive.Div
                name="Answer"
                style={{fontSize: 29, lineHeight: 1.55, color: '#1f1f1f'}}
              >
                {answer.slice(0, answered)}
                {frame >= answerAt && answered < answer.length ? (
                  <span style={{display: 'inline-block', width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a73e8', marginLeft: 6}} />
                ) : null}
              </Interactive.Div>
            </div>
          </AbsoluteFill>
        </div>

        {/* Composer */}
        <div style={{padding: '0 150px 22px', flexShrink: 0}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              backgroundColor: '#ffffff',
              borderRadius: 999,
              padding: '22px 32px',
              boxShadow: '0 1px 3px rgba(60,64,67,0.12), 0 10px 30px rgba(60,64,67,0.14)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="1.7" strokeLinecap="round" style={{flexShrink: 0}}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <div style={{flex: 1, fontSize: 28, color: hasDraft && !sent ? '#1f1f1f' : '#5f6368'}}>
              {sent ? 'Ask Gemini' : hasDraft ? draft : 'Ask Gemini'}
              {hasDraft && !sent ? (
                <span style={{display: 'inline-block', width: 2, height: '1.05em', backgroundColor: '#1a73e8', verticalAlign: '-0.18em', marginLeft: 2}} />
              ) : null}
            </div>
            <div style={{scale: press, flexShrink: 0}}>
              {hasDraft && !sent ? (
                <div style={{width: 50, height: 50, borderRadius: 25, backgroundColor: '#0b57d0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2.5" width="6" height="11" rx="3" />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                </svg>
              )}
            </div>
          </div>

          <div style={{textAlign: 'center', fontSize: 17, color: '#5f6368', marginTop: 16}}>
            <span style={{textDecoration: 'underline'}}>Google Terms</span> and the{' '}
            <span style={{textDecoration: 'underline'}}>Google Privacy Policy</span> apply. Gemini is AI
            and can make mistakes.
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
