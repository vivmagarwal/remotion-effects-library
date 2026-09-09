import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

/**
 * Notification Stack
 * iOS-style notifications sliding in and pushing the ones below down. The push is
 * the point: each card's y offset is the sum of the heights of the cards above it,
 * scaled by their own entrance progress — so the stack settles as a system rather
 * than each card animating in isolation.
 */

type Note = {
  readonly app: string;
  readonly icon: string;
  readonly tint: string;
  readonly title: string;
  readonly body: string;
  readonly time: string;
};

type Props = {
  readonly notes?: readonly Note[];
  /** Frames between one notification arriving and the next. */
  readonly stagger?: number;
  readonly backgroundColor?: string;
  readonly transparent?: boolean;
};

const CARD_HEIGHT = 168;
const GAP = 18;

export const NotificationStack: React.FC<Props> = ({
  notes = [
    {app: 'Mail', icon: '✉️', tint: '#2f6bff', title: 'Render finished', body: 'out/video.mp4 — 1080p, 42s', time: 'now'},
    {app: 'Messages', icon: '💬', tint: '#12c48b', title: 'Sam', body: 'wait, you coded the whole video?', time: '1m ago'},
    {app: 'GitHub', icon: '🐙', tint: '#6e40c9', title: 'PR merged', body: 'feat: add transition sampler', time: '3m ago'},
    {app: 'Calendar', icon: '📅', tint: '#ff5c39', title: 'Design review', body: 'in 15 minutes · Studio B', time: '5m ago'},
  ],
  stagger = 14,
  backgroundColor = '#111319',
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrance progress per card, on its own spring.
  const progress = notes.map((_, i) =>
    spring({frame: frame - i * stagger, fps, config: {damping: 15, stiffness: 120, mass: 0.8}}),
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        backgroundImage: transparent
          ? undefined
          : 'radial-gradient(ellipse at 50% 0%, #232838 0%, #111319 62%)',
        alignItems: 'center',
        paddingTop: 130,
        fontFamily,
      }}
    >
      <div style={{position: 'relative', width: 900}}>
        {notes.map((n, i) => {
          const p = progress[i];
          // Everything above me has pushed me down by its height — but only as far
          // as it has actually arrived. That coupling is what makes the stack settle
          // together instead of four independent cards.
          const pushedBy = progress
            .slice(0, i)
            .reduce((sum, above) => sum + Math.min(1, above) * (CARD_HEIGHT + GAP), 0);

          return (
            <Interactive.Div
              key={i}
              name={`Notification ${i + 1}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: CARD_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '0 30px',
                borderRadius: 30,
                backgroundColor: 'rgba(38,41,52,0.92)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
                translate: `0px ${pushedBy - (1 - Math.min(1, p)) * 150}px`,
                scale: 0.9 + Math.min(1, p) * 0.1,
                opacity: Math.min(1, p * 1.6),
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 22,
                  backgroundColor: n.tint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 44,
                  flexShrink: 0,
                }}
              >
                {n.icon}
              </div>

              <div style={{flex: 1, minWidth: 0}}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#9aa0b0',
                    }}
                  >
                    {n.app}
                  </span>
                  <span style={{fontSize: 24, color: '#767c8c'}}>{n.time}</span>
                </div>
                <div style={{fontSize: 34, fontWeight: 700, color: '#f2f3f7'}}>{n.title}</div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 400,
                    color: '#a8adbb',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {n.body}
                </div>
              </div>
            </Interactive.Div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
