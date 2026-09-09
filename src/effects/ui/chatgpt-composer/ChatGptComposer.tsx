import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '500'], subsets: ['latin']});

/**
 * ChatGPT Composer
 * The prompt box on its own: text types itself in, the box grows upward as lines
 * wrap, the camera pushes in while typing, and the send button lights up and gets
 * pressed. Entrance and exit are both driven by explicit frame counts so the shot
 * can be dropped into a longer edit.
 */

type Props = {
  /** The message being typed. Words wrapped in *asterisks* get a spell-check squiggle. */
  readonly text?: string;
  readonly placeholder?: string;
  /** Characters typed per second. Real typing is 6–10; 22 reads as "fast and confident". */
  readonly charsPerSecond?: number;
  /** Frame typing starts. */
  readonly typeFrom?: number;
  /** Frames the entrance takes. */
  readonly enterFrames?: number;
  /** Frames the exit takes. 0 disables the exit entirely. */
  readonly exitFrames?: number;
  /** How much the camera pushes in over the course of the typing. 1 = no push. */
  readonly zoomWhileTyping?: number;
  /** Frames the cursor spends on, then off. */
  readonly blinkFrames?: number;
  readonly caption?: string;
  readonly width?: number;
  readonly backgroundColor?: string;
  readonly transparent?: boolean;
};

const PlusIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="1.7" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

const SendIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const ChatGptComposer: React.FC<Props> = ({
  text = 'as asfas *asfadsf* asfa *asf* asfa *sdf* *adsf* e asfa sf af *adf* *adsf* *adsf* *adf* asdf *adsf* *adsf* *adsf* *adsf* asdf asdf ads fads asd *fasdf* asdf asdf asd fas *fasdf* asd *fasd* *fasd* asd g',
  placeholder = 'Ask anything',
  charsPerSecond = 22,
  typeFrom = 18,
  enterFrames = 20,
  exitFrames = 24,
  zoomWhileTyping = 1.07,
  blinkFrames = 15,
  caption = 'ChatGPT is AI and can make mistakes.',
  width = 1300,
  backgroundColor = '#ffffff',
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Tokens carry their own spell-check flag, so the squiggle survives typing.
  const tokens = text.split(' ').map((raw) => ({
    word: raw.replace(/\*/g, ''),
    misspelled: raw.startsWith('*') && raw.endsWith('*'),
  }));
  const plain = tokens.map((t) => t.word).join(' ');

  const typed = Math.max(0, Math.floor(((frame - typeFrom) / fps) * charsPerSecond));
  const shown = Math.min(plain.length, typed);
  const typingDone = shown >= plain.length;
  const doneAt = typeFrom + Math.ceil((plain.length / charsPerSecond) * fps);

  // Send press: a beat after the last character lands.
  const pressAt = doneAt + 10;
  const pressed = frame >= pressAt;
  const press = pressed
    ? interpolate(frame - pressAt, [0, 3, 12], [0.9, 0.9, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

  // Entrance and exit, both explicit so the shot drops into a longer edit.
  const enter = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exitStart = durationInFrames - exitFrames;
  const exit =
    exitFrames > 0
      ? interpolate(frame, [exitStart, durationInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.5, 0, 0.75, 0),
        })
      : 0;

  // The camera push: tied to typing progress, not to the frame, so it tracks the
  // text however the typing speed is retimed.
  const progress = plain.length ? shown / plain.length : 0;
  const zoom = interpolate(progress, [0, 1], [1, zoomWhileTyping, ], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
    output: 'perceptual-scale',
  });

  const cursorOn = !typingDone || Math.floor(frame / blinkFrames) % 2 === 0;
  const hasText = shown > 0;

  // Rebuild the visible tokens from the character budget, keeping their flags.
  let consumed = 0;
  const visible: {word: string; misspelled: boolean; partial: boolean}[] = [];
  for (const t of tokens) {
    if (consumed >= shown) break;
    const room = shown - consumed;
    const take = Math.min(t.word.length, room);
    visible.push({word: t.word.slice(0, take), misspelled: t.misspelled, partial: take < t.word.length});
    consumed += t.word.length + 1; // +1 for the space
  }

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Composer group"
        style={{
          width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Entrance, camera push and exit all multiply into the one transform.
          scale: (0.94 + enter * 0.06) * zoom * (1 - exit * 0.06),
          translate: `0px ${(1 - enter) * 26 + exit * 30}px`,
          opacity: enter * (1 - exit),
        }}
      >
        <div style={{fontSize: 21, color: '#8f8f8f', marginBottom: 26}}>{caption}</div>

        {/* The box. Height is auto, and the group is centred, so it grows in place
            as the text wraps to more lines — exactly like the real composer. */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e3e3e3',
            borderRadius: 30,
            padding: '30px 32px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.09)',
          }}
        >
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.55,
              color: hasText ? '#0d0d0d' : '#9b9b9b',
              minHeight: 46,
              whiteSpace: 'pre-wrap',
            }}
          >
            {hasText ? (
              <>
                {visible.map((t, i) => (
                  <span
                    key={i}
                    style={
                      // Only squiggle a word once it is fully typed — a half-typed
                      // word has not been checked yet.
                      t.misspelled && !t.partial
                        ? {
                            textDecoration: 'underline',
                            textDecorationStyle: 'wavy',
                            textDecorationColor: '#e5484d',
                            textDecorationThickness: 1.5,
                            textUnderlineOffset: 4,
                          }
                        : undefined
                    }
                  >
                    {t.word}
                    {i < visible.length - 1 ? ' ' : ''}
                  </span>
                ))}
                {cursorOn ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1.05em',
                      backgroundColor: '#0d0d0d',
                      verticalAlign: '-0.18em',
                      marginLeft: 1,
                    }}
                  />
                ) : null}
              </>
            ) : (
              placeholder
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 26,
            }}
          >
            <PlusIcon />
            <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <MicIcon />
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  // Disabled grey until there is something to send, then black.
                  backgroundColor: hasText ? '#0d0d0d' : '#d7d7d7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scale: press,
                }}
              >
                <SendIcon />
              </div>
            </div>
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
