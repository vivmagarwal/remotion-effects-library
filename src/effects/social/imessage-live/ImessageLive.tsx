import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

// palette: brand-mimicry whole-file — iMessage's thread UI; the blue, the grey and the chrome are Apple's

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600'], subsets: ['latin']});

/**
 * iMessage Live
 * The whole exchange, not just the result: you watch each outgoing message get
 * typed into the composer, sent, land in the thread, and be replied to. Timing is
 * derived from the script, so editing a line retimes everything downstream.
 */

type Turn = {
  /** What you type and send. */
  readonly send: string;
  /** Their reply. Omit for a message that goes unanswered. */
  readonly reply?: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly surface: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  surface: '#101218',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly contact?: string;
  readonly turns?: readonly Turn[];
  readonly charsPerSecond?: number;
  /** Frames of typing indicator before their reply lands. */
  readonly theirTypingFrames?: number;
  /** Frames of pause after a reply, before you start typing again. */
  readonly betweenTurns?: number;
  readonly startAt?: number;
  readonly enterFrames?: number;
  readonly exitFrames?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly transparent?: boolean;
};

const DEFAULT_TURNS: Turn[] = [
  {send: 'is the render done?', reply: 'yeah — 42 seconds'},
  {send: 'wait you did the whole thing in React??', reply: 'every frame is a component 🙂'},
  {send: 'ok that is unreasonably cool'},
];

/** One pass over the script produces every frame number the component needs. */
const buildSchedule = (
  turns: readonly Turn[],
  o: {startAt: number; fps: number; cps: number; theirTyping: number; between: number},
) => {
  let cursor = o.startAt;
  return turns.map((t) => {
    const typeStart = cursor;
    const sendAt = typeStart + Math.ceil((t.send.length / o.cps) * o.fps) + 10;
    const theirTypingAt = t.reply ? sendAt + 14 : null;
    const replyAt = t.reply ? sendAt + 14 + o.theirTyping : null;
    cursor = (replyAt ?? sendAt) + o.between;
    return {typeStart, sendAt, theirTypingAt, replyAt, turn: t};
  });
};

const Dots: React.FC<{frame: number}> = ({frame}) => (
  <div style={{display: 'flex', gap: 11, padding: '30px 34px'}}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 17,
          height: 17,
          borderRadius: 9,
          backgroundColor: '#8d93a5',
          // One sine, phase-shifted per dot — the classic travelling bounce.
          translate: `0px ${Math.sin(frame / 3.2 - i * 0.9) * 7}px`,
          opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.2 - i * 0.9)),
        }}
      />
    ))}
  </div>
);

export const ImessageLive: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  contact = 'Sam',
  turns = DEFAULT_TURNS,
  charsPerSecond = 15,
  theirTypingFrames = 30,
  betweenTurns = 26,
  startAt = 16,
  enterFrames = 18,
  exitFrames = 24,
  accentColor = '#2f6bff',
  backgroundColor = theme.surface,
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const schedule = buildSchedule(turns, {
    startAt,
    fps,
    cps: charsPerSecond,
    theirTyping: theirTypingFrames,
    between: betweenTurns,
  });

  const active = schedule.find((s) => frame >= s.typeStart && frame < s.sendAt);
  const draft = active
    ? active.turn.send.slice(
        0,
        Math.max(0, Math.floor(((frame - active.typeStart) / fps) * charsPerSecond)),
      )
    : '';
  const hasDraft = draft.length > 0;

  const pressing = schedule.find((s) => frame >= s.sendAt && frame < s.sendAt + 12);
  const press = pressing
    ? interpolate(frame - pressing.sendAt, [0, 3, 12], [0.86, 0.86, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

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

  const bubble = (
    key: string,
    text: string,
    mine: boolean,
    at: number,
  ): React.ReactNode => {
    const pop = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
    return (
      <Interactive.Div
        key={key}
        name={key}
        style={{
          alignSelf: mine ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          backgroundColor: mine ? accentColor : '#2a2d38',
          color: mine ? '#ffffff' : '#e7e9ef',
          fontSize: 38,
          lineHeight: 1.35,
          padding: '24px 32px',
          borderRadius: mine ? '26px 26px 8px 26px' : '26px 26px 26px 8px',
          scale: 0.7 + Math.min(1, pop) * 0.3,
          transformOrigin: mine ? 'bottom right' : 'bottom left',
          opacity: Math.min(1, pop * 2),
        }}
      >
        {text}
      </Interactive.Div>
    );
  };

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        alignItems: 'center',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Phone"
        style={{
          width: 980,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 70,
          paddingBottom: 60,
          scale: 0.96 + enter * 0.04 - exit * 0.04,
          opacity: enter * (1 - exit),
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 34,
            fontWeight: 600,
            color: '#8d93a5',
            paddingBottom: 26,
            borderBottom: '1px solid #23262f',
            flexShrink: 0,
          }}
        >
          {contact}
        </div>

        {/* Bottom-anchored: new messages push older ones up, like a real scroll.
            `minHeight: 0` is required or this flex child refuses to shrink and
            shoves the composer off the bottom. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 20,
            paddingTop: 30,
            paddingBottom: 30,
            overflow: 'hidden',
          }}
        >
          {schedule.flatMap((s, i) => {
            const out: React.ReactNode[] = [];
            if (frame >= s.sendAt) out.push(bubble(`me-${i}`, s.turn.send, true, s.sendAt));
            if (s.theirTypingAt !== null && s.replyAt !== null && s.turn.reply) {
              if (frame >= s.theirTypingAt && frame < s.replyAt) {
                out.push(
                  <div
                    key={`dots-${i}`}
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: '#2a2d38',
                      borderRadius: '26px 26px 26px 8px',
                    }}
                  >
                    <Dots frame={frame - s.theirTypingAt} />
                  </div>,
                );
              } else if (frame >= s.replyAt) {
                out.push(bubble(`them-${i}`, s.turn.reply, false, s.replyAt));
              }
            }
            return out;
          })}
        </div>

        {/* Composer */}
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 18, flexShrink: 0}}>
          <div
            style={{
              flex: 1,
              minHeight: 84,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1b1e28',
              border: '1px solid #2b2f3b',
              borderRadius: 42,
              padding: '18px 30px',
              fontSize: 34,
              lineHeight: 1.35,
              color: hasDraft ? '#e7e9ef' : '#5d6373',
            }}
          >
            <span>
              {hasDraft ? draft : 'Message'}
              {hasDraft ? (
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
            </span>
          </div>

          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              flexShrink: 0,
              // Dead grey until there is something to send.
              backgroundColor: hasDraft ? accentColor : '#242833',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scale: press,
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={hasDraft ? '#fff' : '#4b5162'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
