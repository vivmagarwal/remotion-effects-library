import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Photo Stack Shuffle
 * A deck of prints on a table. The top card flicks away and the stack settles
 * forward. Positions are computed from each card's *distance below the top*, so
 * one expression lays out the whole deck at any moment and the shuffle is just
 * that distance decreasing.
 */

type Card = {readonly src: string; readonly caption: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly cards?: readonly Card[];
  /** Frames each card stays on top. */
  readonly holdFrames?: number;
  /** Frames the flick away takes. */
  readonly flickFrames?: number;
  readonly backgroundColor?: string;
  readonly cardWidth?: number;
  readonly showCaptions?: boolean;
};

const DEFAULT_CARDS: Card[] = [
  {src: 'plate-1.svg', caption: 'Golden hour'},
  {src: 'plate-4.svg', caption: 'After dark'},
  {src: 'plate-5.svg', caption: 'Low tide'},
  {src: 'plate-2.svg', caption: 'Understory'},
  {src: 'plate-3.svg', caption: 'Long dunes'},
];

export const PhotoStackShuffle: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  cards = DEFAULT_CARDS,
  holdFrames = 46,
  flickFrames = 20,
  backgroundColor = theme.bg,
  cardWidth = 900,
  showCaptions = true,
}) => {
  const frame = useCurrentFrame();

  const cycle = holdFrames + flickFrames;
  const topIndex = Math.floor(frame / cycle);
  const within = frame % cycle;

  // 0 while the top card is held, 0→1 as it flicks away.
  const flick = interpolate(within, [holdFrames, cycle], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const cardHeight = cardWidth * (1000 / 1500);

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 44%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 66%)',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      {cards.map((card, i) => {
        // How far below the current top this card sits, allowing for the wrap.
        const raw = (i - topIndex) % cards.length;
        const depth = (raw + cards.length) % cards.length;
        // As the top flicks away, everything behind it advances by one place.
        const eased = depth - flick;
        if (eased > cards.length - 1.5) return null;

        // Every card's resting look is a function of that one number.
        const settle = Math.max(0, eased);
        const seed = i;
        const tilt = (random(`tilt-${seed}`) - 0.5) * 9;

        const isLeaving = depth === 0;
        // The leaving card keeps its own path instead of following the stack.
        const leaveX = isLeaving ? flick * 1500 : 0;
        const leaveRot = isLeaving ? flick * 26 : 0;
        const leaveOpacity = isLeaving ? 1 - Math.max(0, (flick - 0.55) / 0.45) : 1;

        return (
          <Interactive.Div
            key={i}
            name={`Card ${i + 1}`}
            style={{
              position: 'absolute',
              width: cardWidth,
              backgroundColor: '#f6f5f2',
              borderRadius: 10,
              padding: 20,
              paddingBottom: showCaptions ? 74 : 20,
              boxShadow: `0 ${24 + settle * 6}px ${60 + settle * 16}px rgba(0,0,0,${0.5 - settle * 0.06})`,
              // Deeper cards sit lower, smaller, dimmer — all from `settle`.
              translate: `${leaveX + settle * 16}px ${settle * 26}px`,
              rotate: `${tilt * (1 - Math.min(1, settle * 0.4)) + leaveRot}deg`,
              scale: 1 - settle * 0.045,
              opacity: leaveOpacity * (1 - Math.max(0, (settle - 2.4) / 1.2)),
              zIndex: cards.length - Math.round(depth),
            }}
          >
            <div style={{width: '100%', height: cardHeight, borderRadius: 4, overflow: 'hidden', backgroundColor: '#04050a'}}>
              <CanvasImage
                src={staticFile(card.src)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </div>
            {showCaptions ? (
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 500,
                  color: '#4a4e5a',
                  marginTop: 20,
                  textAlign: 'center',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {card.caption}
              </div>
            ) : null}
          </Interactive.Div>
        );
      })}
    </AbsoluteFill>
  );
};
