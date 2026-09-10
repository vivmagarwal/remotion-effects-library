import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

// palette: brand-mimicry whole-file — ChatGPT's product UI; every colour on screen is theirs

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

/**
 * ChatGPT Full UI
 * The whole window — browser chrome, rail, thread, composer — running a real
 * conversation loop: type, send, wait, reply, type again. Every turn's timing is
 * derived from its own text length, so editing the script retimes the shot
 * instead of desynchronising it.
 *
 * `composerOnly` drops the chrome, the rail and the thread and keeps just the
 * prompt box, centred on a plain ground: the same typing, the same camera push
 * tied to typing progress, the same send press — the shot you want when the
 * subject is "someone is writing a prompt" rather than "someone is having a
 * conversation".
 */

type Turn = {readonly user: string; readonly assistant: string};

type Props = {
  readonly turns?: readonly Turn[];
  readonly url?: string;
  readonly tabTitle?: string;
  readonly charsPerSecond?: number;
  readonly replyCharsPerSecond?: number;
  /** Frames between hitting send and the reply starting. */
  readonly thinkFrames?: number;
  /** Frames of pause after a reply finishes, before the next message is typed. */
  readonly betweenTurns?: number;
  readonly startAt?: number;
  readonly enterFrames?: number;
  readonly exitFrames?: number;
  readonly zoomWhileTyping?: number;
  /** Drop the window and show only the prompt box, centred on `backgroundColor`. */
  readonly composerOnly?: boolean;
  /** composerOnly: width of the centred prompt box, in px. */
  readonly composerWidth?: number;
  /** composerOnly: the ground behind the box. */
  readonly backgroundColor?: string;
  /** The small print under the composer. */
  readonly caption?: string;
  readonly placeholder?: string;
};

const DEFAULT_TURNS: Turn[] = [
  {
    user: 'can you write a video in react?',
    assistant: 'Yes — that is exactly what Remotion does. You describe each frame as a React component, and it renders them out to an MP4.',
  },
  {
    user: 'so every frame is just... a component?',
    assistant: 'Every frame is the same component, asked what it looks like at a different frame number. No timeline, no keyframes — just a function of time.',
  },
];

/** Builds the whole timeline from the script, so editing the text retimes the shot. */
const buildSchedule = (
  turns: readonly Turn[],
  opts: {startAt: number; fps: number; cps: number; rcps: number; think: number; between: number},
) => {
  const {startAt, fps, cps, rcps, think, between} = opts;
  let cursor = startAt;
  return turns.map((t) => {
    const typeStart = cursor;
    const typeEnd = typeStart + Math.ceil((t.user.length / cps) * fps);
    const sendAt = typeEnd + 12;
    const replyStart = sendAt + think;
    const replyEnd = replyStart + Math.ceil((t.assistant.length / rcps) * fps);
    cursor = replyEnd + between;
    return {typeStart, typeEnd, sendAt, replyStart, replyEnd, turn: t};
  });
};

const RailIcon: React.FC<{d: string}> = ({d}) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5d5d5d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const RAIL_TOP = [
  'M4 5h16v14H4zM10 5v14',                                  // panel toggle
  'M4 20h4l10-10-4-4L4 16zM14 6l4 4',                       // new chat
  'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',        // search
  'M4 6h10v12H4zM17 8h3v10h-3',                             // library
  'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', // sora
  'M5 19l7-14 7 14M8 15h8',                                  // gpts
];

export const ChatgptFullUi: React.FC<Props> = ({
  turns = DEFAULT_TURNS,
  url = 'chatgpt.com/c/6aa03515-9438-83ea-afa2',
  tabTitle = 'ChatGPT: Chat, Work, Create',
  charsPerSecond = 20,
  replyCharsPerSecond = 42,
  thinkFrames = 26,
  betweenTurns = 34,
  startAt = 24,
  enterFrames = 22,
  exitFrames = 26,
  zoomWhileTyping = 1.03,
  composerOnly = false,
  composerWidth = 1300,
  backgroundColor = '#ffffff',
  caption = 'ChatGPT is AI and can make mistakes.',
  placeholder = 'Ask anything',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const schedule = buildSchedule(turns, {
    startAt,
    fps,
    cps: charsPerSecond,
    rcps: replyCharsPerSecond,
    think: thinkFrames,
    between: betweenTurns,
  });

  // Which turn is currently being composed, if any.
  const active = schedule.find((s) => frame >= s.typeStart && frame < s.sendAt);
  // composerOnly has no thread to send into, so the last finished draft stays in
  // the box instead of vanishing at sendAt and leaving an empty shot.
  const held = composerOnly ? schedule.filter((s) => frame >= s.sendAt).pop() : undefined;
  const draft = active
    ? active.turn.user.slice(
        0,
        Math.max(0, Math.floor(((frame - active.typeStart) / fps) * charsPerSecond)),
      )
    : held
      ? held.turn.user
      : '';
  const hasDraft = draft.length > 0;

  const pressing = schedule.find((s) => frame >= s.sendAt && frame < s.sendAt + 12);
  const press = pressing
    ? interpolate(frame - pressing.sendAt, [0, 3, 12], [0.9, 0.9, 1], {
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

  const typingProgress = active
    ? interpolate(frame, [active.typeStart, active.sendAt], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : held
      ? 1
      : 0;
  const zoom = 1 + (zoomWhileTyping - 1) * typingProgress;

  // composerOnly is a close-up on the same box, so every size steps up by a
  // fifth. One factor, applied here — the two modes are the same markup.
  const k = composerOnly ? 1.2 : 1;
  const px = (n: number) => Math.round(n * k);

  // The box itself. Its height is auto and its parent centres it, so it grows in
  // place as the draft wraps to more lines — exactly like the real composer.
  const composerBox = (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e3e3e3',
        borderRadius: px(28),
        padding: composerOnly ? '24px 31px 17px' : '20px 26px 14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 18px 44px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: px(25),
          lineHeight: 1.5,
          color: hasDraft ? '#0d0d0d' : '#9b9b9b',
          minHeight: px(38),
          whiteSpace: 'pre-wrap',
        }}
      >
        {hasDraft ? draft : placeholder}
        {hasDraft ? (
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
      </div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: px(16)}}>
        <RailIcon d="M12 5v14M5 12h14" />
        <div style={{display: 'flex', alignItems: 'center', gap: px(22)}}>
          <RailIcon d="M12 2.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          <div
            style={{
              width: px(50),
              height: px(50),
              borderRadius: px(25),
              // Disabled grey until there is something to send, then black.
              backgroundColor: hasDraft ? '#0d0d0d' : '#d7d7d7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scale: press,
            }}
          >
            <svg width={px(23)} height={px(23)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  if (composerOnly) {
    return (
      <AbsoluteFill
        name="Scene"
        style={{
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily,
          overflow: 'hidden',
        }}
      >
        <Interactive.Div
          name="Composer group"
          style={{
            width: composerWidth,
            display: 'flex',
            flexDirection: 'column',
            // stretch, not center: the box is a block child and has to fill the
            // group's width, or it collapses to the width of the draft.
            alignItems: 'stretch',
            // Entrance, camera push and exit all multiply into the one transform.
            scale: (0.94 + enter * 0.06) * zoom * (1 - exit * 0.06),
            translate: `0px ${(1 - enter) * 26 + exit * 30}px`,
            opacity: enter * (1 - exit),
          }}
        >
          <div style={{fontSize: 21, color: '#8f8f8f', marginBottom: 26, textAlign: 'center'}}>{caption}</div>
          {composerBox}
        </Interactive.Div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#0e1116', fontFamily, overflow: 'hidden'}}>
      <Interactive.Div
        name="Window"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          scale: (0.97 + enter * 0.03) * zoom * (1 - exit * 0.04),
          opacity: enter * (1 - exit),
        }}
      >
        {/* ── browser chrome ────────────────────────────────────────────── */}
        <div style={{backgroundColor: '#dfe6f6', paddingTop: 12, flexShrink: 0}}>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 18px'}}>
            <div style={{display: 'flex', gap: 9, paddingBottom: 12}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <span key={c} style={{width: 14, height: 14, borderRadius: 7, backgroundColor: c}} />
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
                borderRadius: '11px 11px 0 0',
                padding: '11px 18px 12px',
                minWidth: 420,
              }}
            >
              <span style={{width: 20, height: 20, borderRadius: 10, backgroundColor: '#0d0d0d', flexShrink: 0}} />
              <span style={{fontSize: 19, color: '#3c4043', whiteSpace: 'nowrap', overflow: 'hidden'}}>
                {tabTitle}
              </span>
              <span style={{fontSize: 20, color: '#5f6368', marginLeft: 'auto'}}>✕</span>
            </div>
            <span style={{fontSize: 24, color: '#5f6368', paddingBottom: 12}}>+</span>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 18, backgroundColor: '#fff', padding: '11px 22px'}}>
            {['M19 12H5M11 6l-6 6 6 6', 'M5 12h14M13 6l6 6-6 6', 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5'].map((d, i) => (
              <RailIcon key={i} d={d} />
            ))}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#f1f3f4',
                borderRadius: 999,
                padding: '9px 20px',
                marginLeft: 6,
              }}
            >
              <span style={{fontSize: 17, color: '#5f6368'}}>⚙</span>
              <span style={{fontSize: 19, color: '#202124'}}>{url}</span>
            </div>
          </div>
        </div>

        {/* ── app ───────────────────────────────────────────────────────── */}
        <div style={{flex: 1, display: 'flex', minHeight: 0}}>
          <div
            style={{
              width: 88,
              borderRight: '1px solid #ececec',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 22,
              gap: 26,
              flexShrink: 0,
            }}
          >
            {RAIL_TOP.map((d, i) => (
              <RailIcon key={i} d={d} />
            ))}
          </div>

          <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
            <div style={{display: 'flex', alignItems: 'center', padding: '20px 34px 6px', flexShrink: 0}}>
              <span style={{fontSize: 26, fontWeight: 700, color: '#0d0d0d'}}>ChatGPT</span>
              <span style={{fontSize: 17, color: '#8f8f8f', marginLeft: 8}}>⌄</span>
              <div style={{marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center'}}>
                <span style={{backgroundColor: '#0d0d0d', color: '#fff', fontSize: 19, fontWeight: 600, padding: '12px 28px', borderRadius: 999}}>
                  Log in
                </span>
                <span style={{border: '1px solid #d9d9d9', color: '#0d0d0d', fontSize: 19, fontWeight: 600, padding: '11px 26px', borderRadius: 999}}>
                  Sign up for free
                </span>
              </div>
            </div>

            {/* Thread — anchored to the bottom, so it grows upward like a real scroll. */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 26,
                padding: '0 120px 6px',
                overflow: 'hidden',
              }}
            >
              {schedule.map((s, i) => {
                if (frame < s.sendAt) return null;
                const bubbleIn = interpolate(frame, [s.sendAt, s.sendAt + 12], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                });
                const replyChars = Math.max(
                  0,
                  Math.floor(((frame - s.replyStart) / fps) * replyCharsPerSecond),
                );
                const thinking = frame >= s.sendAt && frame < s.replyStart;

                return (
                  <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 22}}>
                    <Interactive.Div
                      name={`User ${i + 1}`}
                      style={{
                        alignSelf: 'flex-end',
                        maxWidth: '72%',
                        backgroundColor: '#ececec',
                        color: '#0d0d0d',
                        fontSize: 27,
                        lineHeight: 1.45,
                        padding: '16px 26px',
                        borderRadius: 26,
                        scale: 0.94 + bubbleIn * 0.06,
                        // Grows out of the composer's corner, not from its own centre.
                        transformOrigin: 'bottom right',
                        translate: `0px ${(1 - bubbleIn) * 30}px`,
                        opacity: bubbleIn,
                      }}
                    >
                      {s.turn.user}
                    </Interactive.Div>

                    {thinking ? (
                      <div
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 9,
                          backgroundColor: '#0d0d0d',
                          // A slow breathing dot: ChatGPT's own "thinking" state.
                          scale: 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((frame / fps) * 5)),
                          opacity: 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((frame / fps) * 5)),
                        }}
                      />
                    ) : frame >= s.replyStart ? (
                      <Interactive.Div
                        name={`Assistant ${i + 1}`}
                        style={{fontSize: 29, lineHeight: 1.55, color: '#0d0d0d', maxWidth: '92%'}}
                      >
                        {s.turn.assistant.slice(0, replyChars)}
                        {replyChars < s.turn.assistant.length ? (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 13,
                              height: 13,
                              borderRadius: 7,
                              backgroundColor: '#0d0d0d',
                              marginLeft: 6,
                              verticalAlign: '0.02em',
                            }}
                          />
                        ) : null}
                      </Interactive.Div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* ── composer ───────────────────────────────────────────────── */}
            <div style={{padding: '0 120px 24px', flexShrink: 0}}>
              <div style={{textAlign: 'center', fontSize: 17, color: '#8f8f8f', marginBottom: 14}}>
                {caption}
              </div>
              {composerBox}
            </div>
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
