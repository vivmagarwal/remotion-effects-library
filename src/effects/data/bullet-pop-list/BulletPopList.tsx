import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Bullet Pop List
 * The workhorse of explainer video: a titled list whose items fly in one at a
 * time. Items are laid out at fixed slots and only animate *within* them, so the
 * list never reflows as items arrive — which is what stops the whole block
 * creeping up the frame while it fills.
 */

type Item = {readonly text: string; readonly note?: string};

type Props = {
  readonly kicker?: string;
  readonly title?: string;
  readonly items?: readonly Item[];
  /** Frames between one item arriving and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  /** Slide distance for each item, in pixels. */
  readonly travel?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
  /** Marker style for each row. */
  readonly marker?: 'dot' | 'number' | 'arrow';
};

export const BulletPopList: React.FC<Props> = ({
  kicker = 'THE THREE WINDOWS',
  title = 'How to see thinking',
  items = [
    {text: 'Conversations', note: 'what they say while working'},
    {text: 'Observations', note: 'what they do when stuck'},
    {text: 'Products', note: 'what they leave behind'},
    {text: 'Triangulate', note: 'where all three agree'},
  ],
  stagger = 13,
  startAt = 26,
  travel = 64,
  accentColor = '#ff5c39',
  backgroundColor = '#0f1117',
  paperColor = '#f5f3ee',
  marker = 'dot',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const ROW_H = 148;

  const head = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 26% 30%, #1b2130 0%, #0b0d13 66%)',
        justifyContent: 'center',
        padding: '0 150px',
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Kicker"
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '0.22em',
          color: backgroundColor,
          backgroundColor: accentColor,
          padding: '10px 18px',
          borderRadius: 7,
          marginBottom: 26,
          opacity: head,
          translate: `${(head - 1) * 30}px 0px`,
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="Title"
        style={{
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: paperColor,
          marginBottom: 56,
          opacity: head,
          translate: `0px ${(1 - head) * 22}px`,
        }}
      >
        {title}
      </Interactive.Div>

      {/* Fixed-height slots. Items animate inside their own row, never between
          rows, so nothing reflows as the list fills. */}
      <div style={{position: 'relative', height: items.length * ROW_H}}>
        {/* The spine, drawn down as far as the last arrived item. */}
        <div
          style={{
            position: 'absolute',
            left: 27,
            top: 20,
            width: 3,
            borderRadius: 2,
            backgroundColor: `${accentColor}44`,
            height: interpolate(
              frame,
              [startAt, startAt + (items.length - 1) * stagger + 20],
              [0, items.length * ROW_H - 80],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1)},
            ),
          }}
        />

        {items.map((item, i) => {
          const from = startAt + i * stagger;
          const pop = spring({
            frame: frame - from,
            fps,
            config: {damping: 14, stiffness: 170, mass: 0.7},
          });
          const p = Math.min(1, pop);

          return (
            <Interactive.Div
              key={item.text}
              name={item.text}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * ROW_H,
                height: ROW_H,
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                // Slide in from the left and settle. The row's slot never moves.
                translate: `${(p - 1) * travel}px 0px`,
                opacity: Math.min(1, pop * 1.8),
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: marker === 'dot' ? 29 : 14,
                  backgroundColor: accentColor,
                  color: backgroundColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: marker === 'number' ? 30 : 26,
                  fontWeight: 800,
                  flexShrink: 0,
                  // The marker overshoots slightly more than the row, so it
                  // reads as the thing that arrived and pulled the text along.
                  scale: 0.4 + pop * 0.6,
                }}
              >
                {marker === 'number' ? i + 1 : marker === 'arrow' ? '→' : ''}
              </div>

              <div>
                <div style={{fontSize: 54, fontWeight: 700, color: paperColor, letterSpacing: '-0.02em'}}>
                  {item.text}
                </div>
                {item.note ? (
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 500,
                      color: '#8a8f9e',
                      marginTop: 6,
                      // The note trails its own row very slightly.
                      opacity: interpolate(frame, [from + 5, from + 20], [0, 1], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      }),
                    }}
                  >
                    {item.note}
                  </div>
                ) : null}
              </div>
            </Interactive.Div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
