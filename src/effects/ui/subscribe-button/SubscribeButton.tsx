import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '600', '700'], subsets: ['latin']});

/**
 * Subscribe Button
 * A channel card where a cursor flies in, presses the button, and it flips to
 * "Subscribed" with a ripple and a burst. The press is sold by three things
 * happening on the same frame: the button scales down, the ripple starts, and
 * the label swaps. Miss the simultaneity and it reads as two separate events.
 */

type Props = {
  readonly channel?: string;
  readonly subscribers?: string;
  readonly label?: string;
  readonly subscribedLabel?: string;
  readonly accentColor?: string;
  /** Frame the cursor lands on the button. */
  readonly clickAt?: number;
  readonly transparent?: boolean;
};

export const SubscribeButton: React.FC<Props> = ({
  channel = 'Remotion',
  subscribers = '2.2K subscribers',
  label = 'Subscribe',
  subscribedLabel = 'Subscribed',
  accentColor = '#2f6bff',
  clickAt = 40,
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const clicked = frame >= clickAt;
  const sinceClick = frame - clickAt;

  // The cursor arcs in and lands exactly on `clickAt`.
  const approach = interpolate(frame, [6, clickAt], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.15, 1),
  });

  // Press: a quick squash that recovers on a spring.
  const press = clicked
    ? interpolate(sinceClick, [0, 3, 12], [0.93, 0.93, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

  const cardIn = spring({frame, fps, config: {damping: 14, stiffness: 110}});

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        // Leave the background clear when rendering a transparent overlay (WebM/ProRes).
        backgroundColor: transparent ? 'transparent' : '#f3f4f7',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Card"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          backgroundColor: '#ffffff',
          borderRadius: 22,
          padding: '26px 30px',
          boxShadow: '0 24px 70px rgba(15,20,40,0.18)',
          scale: 0.86 + cardIn * 0.14,
          opacity: Math.min(1, cardIn * 2),
        }}
      >
        {/* Channel avatar */}
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            background: `linear-gradient(140deg, ${accentColor}, #7c3aed)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          {channel.slice(0, 1)}
        </div>

        <div style={{marginRight: 18}}>
          <div style={{fontSize: 38, fontWeight: 700, color: '#10131c'}}>{channel}</div>
          <div style={{fontSize: 26, fontWeight: 500, color: '#767c8c', marginTop: 4}}>
            {subscribers}
          </div>
        </div>

        {/* The button */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 99,
            padding: '20px 40px',
            backgroundColor: clicked ? '#e8eaef' : accentColor,
            color: clicked ? '#5c6373' : '#ffffff',
            fontSize: 32,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            scale: press,
          }}
        >
          {/* Ripple from the click point, clipped by the button's overflow. */}
          {clicked ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 420,
                height: 420,
                marginLeft: -210,
                marginTop: -210,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.55)',
                scale: interpolate(sinceClick, [0, 14], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.2, 0.8, 0.3, 1),
                  output: 'perceptual-scale',
                }),
                opacity: interpolate(sinceClick, [0, 14], [0.8, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            />
          ) : null}
          <span style={{position: 'relative'}}>{clicked ? subscribedLabel : label}</span>
          {clicked ? (
            <span
              style={{
                position: 'relative',
                fontSize: 28,
                scale: interpolate(sinceClick, [2, 12], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  output: 'perceptual-scale',
                }),
              }}
            >
              ✓
            </span>
          ) : null}
        </div>

        {/* Confetti burst, radiating from the button. */}
        {clicked
          ? new Array(12).fill(0).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const dist = interpolate(sinceClick, [0, 22], [0, 190], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.1, 0.9, 0.2, 1),
              });
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    right: 92,
                    top: '50%',
                    width: 11,
                    height: 11,
                    borderRadius: 3,
                    backgroundColor: ['#ff5c39', '#ffd166', accentColor, '#12c48b'][i % 4],
                    translate: `${Math.cos(angle) * dist}px ${Math.sin(angle) * dist}px`,
                    rotate: `${dist * 2}deg`,
                    opacity: interpolate(sinceClick, [6, 24], [1, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }}
                />
              );
            })
          : null}

        {/* The cursor, arcing in to land on the button. */}
        <div
          style={{
            position: 'absolute',
            right: interpolate(approach, [0, 1], [-180, 128]),
            top: interpolate(approach, [0, 1], [230, 74]),
            fontSize: 62,
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.28))',
            scale: clicked ? press : 1,
            opacity: interpolate(frame, [clickAt + 18, clickAt + 30], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          👆
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
