import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin']});

/**
 * Hype Captions
 * Retention-style captions burned over footage: three-word pages stamped in, one
 * keyword per page blown up and colour-flipped. The keyword is chosen from the
 * script, not guessed at runtime — which is what stops the emphasis landing on
 * "the" and makes the whole device read as edited rather than automatic.
 */

export type Word = {
  readonly text: string;
  readonly start: number;
  readonly end: number;
  /** Marks this word as the page's emphasis. */
  readonly hit?: boolean;
};

type Props = {
  readonly src?: string;
  readonly words?: readonly Word[];
  readonly wordsPerPage?: number;
  readonly hitColor?: string;
  readonly color?: string;
  readonly strokeColor?: string;
  readonly transparent?: boolean;
};

const SCRIPT: Word[] = [
  {text: 'NOBODY', start: 0.0, end: 0.46},
  {text: 'WATCHES', start: 0.46, end: 0.92},
  {text: 'PAST', start: 0.92, end: 1.26, hit: true},
  {text: 'THREE', start: 1.34, end: 1.72},
  {text: 'SECONDS', start: 1.72, end: 2.26, hit: true},
  {text: 'UNLESS', start: 2.26, end: 2.68},
  {text: 'SOMETHING', start: 2.76, end: 3.36},
  {text: 'ACTUALLY', start: 3.36, end: 3.9},
  {text: 'MOVES', start: 3.9, end: 4.4, hit: true},
];

export const HypeCaptions: React.FC<Props> = ({
  src,
  words = SCRIPT,
  wordsPerPage = 3,
  hitColor = '#ffd166',
  color = '#ffffff',
  strokeColor = '#04050a',
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  const activeIndex = words.findIndex((w) => time >= w.start && time < w.end);
  const index =
    activeIndex === -1 ? (time >= (words.at(-1)?.end ?? 0) ? words.length - 1 : 0) : activeIndex;

  const page = Math.floor(index / wordsPerPage);
  const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);
  const pageStart = words[page * wordsPerPage]?.start ?? 0;
  const pageFrame = frame - Math.round(pageStart * fps);

  const stamp = spring({frame: pageFrame, fps, config: {damping: 13, stiffness: 210, mass: 0.55}});

  // A seeded tilt per page, so consecutive pages do not land at the same angle.
  const tilt = (random(`tilt-${page}`) - 0.5) * 5;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : '#04050a',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 420,
        fontFamily,
        overflow: 'hidden',
      }}
    >
      {!transparent ? (
        <AbsoluteFill>
          <CanvasImage
            src={src ?? staticFile('plate-4.svg')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // A slow push, so the plate underneath is never static.
              scale: interpolate(frame, [0, 150], [1.08, 1.2], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                output: 'perceptual-scale',
              }),
            }}
          />
          <AbsoluteFill
            style={{backgroundImage: 'linear-gradient(transparent 40%, rgba(0,0,0,0.55) 100%)'}}
          />
        </AbsoluteFill>
      ) : null}

      <Interactive.Div
        name="Caption page"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 24px',
          maxWidth: 940,
          textAlign: 'center',
          rotate: `${tilt}deg`,
          scale: 0.82 + Math.min(1, stamp) * 0.18,
          opacity: Math.min(1, stamp * 2.4),
        }}
      >
        {pageWords.map((w, i) => {
          const spoken = time >= w.start;
          // The emphasis word is bigger, colour-flipped and pulled off the baseline.
          const pop = w.hit
            ? spring({
                frame: frame - Math.round(w.start * fps),
                fps,
                config: {damping: 11, stiffness: 250, mass: 0.5},
              })
            : 0;

          return (
            <span
              key={i}
              style={{
                fontSize: w.hit ? 132 : 104,
                fontWeight: 900,
                lineHeight: 1.06,
                letterSpacing: '-0.02em',
                color: w.hit ? hitColor : color,
                // A hard stroke, painted behind the glyph, survives any footage.
                WebkitTextStroke: `${w.hit ? 13 : 11}px ${strokeColor}`,
                paintOrder: 'stroke fill',
                textShadow: `0 9px 0 ${strokeColor}`,
                scale: w.hit ? 1 + Math.min(0.14, pop * 0.14) : 1,
                opacity: spoken ? 1 : 0.3,
                display: 'inline-block',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
