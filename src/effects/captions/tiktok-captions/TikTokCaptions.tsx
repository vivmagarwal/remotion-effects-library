import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin']});

/**
 * TikTok Captions
 * Word-level karaoke captions: a short page of words is on screen, and the word
 * currently being spoken pops and turns accent-coloured. Paging by word count
 * rather than by time is what keeps lines short enough to read at a glance.
 */

export type Word = {readonly text: string; readonly start: number; readonly end: number};

type Props = {
  /** Word timings in seconds. This is exactly the shape @remotion/captions produces. */
  readonly words?: readonly Word[];
  /** Words visible at once. 3–4 is the readable maximum for vertical video. */
  readonly wordsPerPage?: number;
  readonly color?: string;
  readonly activeColor?: string;
  readonly backgroundColor?: string;
  readonly transparent?: boolean;
};

const SCRIPT: Word[] = [
  {text: 'Every', start: 0.0, end: 0.32},
  {text: 'frame', start: 0.32, end: 0.68},
  {text: 'of', start: 0.68, end: 0.82},
  {text: 'this', start: 0.82, end: 1.12},
  {text: 'video', start: 1.12, end: 1.62},
  {text: 'is', start: 1.62, end: 1.78},
  {text: 'just', start: 1.78, end: 2.12},
  {text: 'React', start: 2.12, end: 2.68},
  {text: 'rendered', start: 2.68, end: 3.24},
  {text: 'to', start: 3.24, end: 3.4},
  {text: 'a', start: 3.4, end: 3.5},
  {text: 'PNG', start: 3.5, end: 4.05},
];

export const TikTokCaptions: React.FC<Props> = ({
  words = SCRIPT,
  wordsPerPage = 3,
  color = '#ffffff',
  activeColor = '#c6ff3d',
  backgroundColor = '#111318',
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  const activeIndex = words.findIndex((w) => time >= w.start && time < w.end);
  const index = activeIndex === -1 ? (time >= (words.at(-1)?.end ?? 0) ? words.length - 1 : 0) : activeIndex;

  // Page by word count, not by time — that is what guarantees a readable line length.
  const page = Math.floor(index / wordsPerPage);
  const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);
  const pageStart = words[page * wordsPerPage]?.start ?? 0;

  // The page itself pops in when it changes.
  const pageIn = spring({
    frame: frame - Math.round(pageStart * fps),
    fps,
    config: {damping: 16, stiffness: 160, mass: 0.6},
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 200,
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Caption page"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 26px',
          maxWidth: 1400,
          scale: 0.88 + Math.min(1, pageIn) * 0.12,
          opacity: Math.min(1, pageIn * 2),
        }}
      >
        {pageWords.map((w, i) => {
          const globalIndex = page * wordsPerPage + i;
          const isActive = globalIndex === index;
          const spoken = time >= w.start;

          // The active word gets its own spring, keyed to when it starts.
          const pop = spring({
            frame: frame - Math.round(w.start * fps),
            fps,
            config: {damping: 12, stiffness: 220, mass: 0.5},
          });

          return (
            <span
              key={globalIndex}
              style={{
                fontSize: 130,
                fontWeight: 900,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: isActive ? activeColor : color,
                // A hard stroke, not a soft shadow — captions have to survive any footage.
                WebkitTextStroke: '10px #0b0d12',
                paintOrder: 'stroke fill',
                textShadow: '0 8px 0 rgba(11,13,18,0.55)',
                scale: isActive ? 1 + Math.min(0.16, pop * 0.16) : 1,
                opacity: spoken ? 1 : 0.42,
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
