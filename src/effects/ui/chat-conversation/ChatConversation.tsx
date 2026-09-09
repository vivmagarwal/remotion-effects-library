import {AbsoluteFill, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600'], subsets: ['latin']});

/**
 * Chat Conversation
 * An iMessage-style thread that types itself out. The typing indicator is what
 * makes it feel real: every incoming message is preceded by three bouncing dots
 * for a beat, so the reply appears to be composed rather than pasted.
 */

type Message = {
  readonly from: 'them' | 'me';
  readonly text: string;
  /** Frame this message lands. The typing indicator runs before it. */
  readonly at: number;
  /** Frames the typing indicator shows first. 0 to skip. */
  readonly typing?: number;
};

type Props = {
  readonly title?: string;
  readonly messages?: readonly Message[];
  readonly themColor?: string;
  readonly meColor?: string;
  readonly backgroundColor?: string;
};

const Dots: React.FC<{frame: number; color: string}> = ({frame, color}) => (
  <div style={{display: 'flex', gap: 10, padding: '26px 30px'}}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          // Each dot on the same sine, phase-shifted — the classic three-dot bounce.
          translate: `0px ${Math.sin(frame / 3.2 - i * 0.9) * 7}px`,
          opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.2 - i * 0.9)),
        }}
      />
    ))}
  </div>
);

export const ChatConversation: React.FC<Props> = ({
  title = 'Sam',
  messages = [
    {from: 'them', text: 'is the render done?', at: 14, typing: 18},
    {from: 'me', text: 'yeah, 42 seconds', at: 46},
    {from: 'them', text: 'wait you did the whole thing in React??', at: 78, typing: 26},
    {from: 'me', text: 'every frame is a component 🙂', at: 116},
    {from: 'them', text: 'ok that is unreasonably cool', at: 152, typing: 22},
  ],
  themColor = '#2a2d38',
  meColor = '#2f6bff',
  backgroundColor = '#101218',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      name="Scene"
      // Centred rather than top-aligned: the thread re-centres as it grows, which
      // keeps the frame balanced instead of leaving the bottom half empty.
      style={{backgroundColor, alignItems: 'center', justifyContent: 'center', fontFamily}}
    >
      <div style={{width: 980}}>
        <Interactive.Div
          name="Header"
          style={{
            textAlign: 'center',
            fontSize: 34,
            fontWeight: 600,
            color: '#8d93a5',
            paddingBottom: 26,
            borderBottom: '1px solid #23262f',
            marginBottom: 34,
          }}
        >
          {title}
        </Interactive.Div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          {messages.map((m, i) => {
            const typingFor = m.typing ?? 0;
            const typingStart = m.at - typingFor;
            const showingDots = typingFor > 0 && frame >= typingStart && frame < m.at;
            const landed = frame >= m.at;
            if (!showingDots && !landed) return null;

            const pop = spring({
              frame: frame - (showingDots ? typingStart : m.at),
              fps,
              config: {damping: 14, stiffness: 180, mass: 0.6},
            });
            const mine = m.from === 'me';

            return (
              <Interactive.Div
                key={i}
                name={`Message ${i + 1}`}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '76%',
                  backgroundColor: mine ? meColor : themColor,
                  color: mine ? '#ffffff' : '#e7e9ef',
                  fontSize: 38,
                  fontWeight: 400,
                  lineHeight: 1.35,
                  padding: showingDots ? 0 : '24px 32px',
                  // Asymmetric radius: the corner nearest the sender stays tight.
                  borderRadius: mine ? '26px 26px 8px 26px' : '26px 26px 26px 8px',
                  scale: 0.7 + Math.min(1, pop) * 0.3,
                  // Grow out of the corner the bubble belongs to.
                  transformOrigin: mine ? 'bottom right' : 'bottom left',
                  opacity: Math.min(1, pop * 2),
                }}
              >
                {showingDots ? (
                  <Dots frame={frame - typingStart} color={mine ? '#ffffff' : '#8d93a5'} />
                ) : (
                  m.text
                )}
              </Interactive.Div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
