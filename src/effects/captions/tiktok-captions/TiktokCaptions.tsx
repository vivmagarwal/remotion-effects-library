import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Montserrat';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin']});

/**
 * TikTok Captions
 *
 * Word-level karaoke captions driven by a real ASR response, over the clip the
 * response was actually transcribed from — so the sync you see is sync, not a
 * hand-tuned guess.
 *
 * Four decisions do the work, and only the first is the obvious one:
 *
 *  1. **Page by word count, not by a time window.** A fixed window gives you one
 *     word during a pause and nine during a fast run. Three words is the
 *     readable maximum on a 9:16 frame.
 *  2. **The active-word test is half-open** — `frame >= start && frame < end`. A
 *     closed interval makes two words active on the shared boundary frame and
 *     the caption flickers for exactly one frame, which reads as a glitch.
 *  3. **Hard stroke at 15 % of the font size, not a shadow.** You cannot compute
 *     a contrast ratio against moving footage, so it has to be guaranteed
 *     structurally. A blurred shadow fails precisely when the shot gets busy;
 *     `paintOrder: 'stroke fill'` keeps the stroke outside the glyph so the
 *     letterform stays its full weight.
 *  4. **The page clears 12 frames after the last word ends.** A caption sitting
 *     through a silence is the caption equivalent of dead air.
 *
 * And the thing that separates a premium caption from a cliché one: the
 * emphasised words are **authored as data** (`hits`), not derived from word
 * length or position. Derived emphasis lands on "the".
 */

/**
 * One word from an ASR response. This is Deepgram's `words[]` entry verbatim —
 * paste yours straight in. Times are SECONDS and are noisy floats
 * (`0.39999998`), so they are only ever compared after `Math.round(t * fps)`.
 */
export type DeepgramWord = {
  readonly word: string;
  readonly start: number;
  readonly end: number;
  readonly confidence?: number;
  /** Present only when the request used `smart_format` or `punctuate`. */
  readonly punctuated_word?: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly ink: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  ink: '#ffffff',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** Word timings in seconds. Defaults to the real nova-3 response for the shipped clip. */
  readonly words?: readonly DeepgramWord[];
  /** Footage to caption. Set to null to render as a transparent overlay. */
  readonly src?: string | null;
  /** Words visible at once. 3 is the readable maximum for vertical video. */
  readonly wordsPerPage?: number;
  /**
   * Words to emphasise, lower-cased and matched against `word`. Author these;
   * do not derive them.
   */
  readonly hits?: readonly string[];
  readonly color?: string;
  readonly activeColor?: string;
  readonly hitColor?: string;
  readonly backgroundColor?: string;
  /**
   * Distance from the bottom of a 1080x1920 frame. 560 clears TikTok's caption
   * stack (484) and the Reels action rail at once.
   */
  readonly bottomInset?: number;
};

/**
 * `public/transcripts/interview.deepgram.json`, unmodified apart from rounding
 * the times to 2dp so they fit on a line. 17 words, 6.192 s. Inlined rather
 * than fetched so this file runs with no assets at all.
 */
const WORDS: DeepgramWord[] = [
  {word: 'you', start: 0, end: 0.16, confidence: 0.995, punctuated_word: 'You'},
  {word: 'can', start: 0.16, end: 0.4, confidence: 0.959, punctuated_word: 'can'},
  {word: 'really', start: 0.4, end: 0.72, confidence: 1, punctuated_word: 'really'},
  {word: 'see', start: 0.72, end: 1.12, confidence: 1, punctuated_word: 'see'},
  {word: 'how', start: 1.12, end: 1.44, confidence: 1, punctuated_word: 'how'},
  {word: 'people', start: 1.44, end: 1.92, confidence: 1, punctuated_word: 'people'},
  {word: 'become', start: 1.92, end: 2.48, confidence: 0.999, punctuated_word: 'become'},
  {word: 'so', start: 2.48, end: 2.88, confidence: 1, punctuated_word: 'so'},
  {word: 'natural', start: 2.88, end: 3.76, confidence: 1, punctuated_word: 'natural'},
  {word: 'up', start: 3.76, end: 4.08, confidence: 0.996, punctuated_word: 'up'},
  {word: 'in', start: 4.08, end: 4.24, confidence: 1, punctuated_word: 'in'},
  {word: 'space', start: 4.24, end: 4.88, confidence: 1, punctuated_word: 'space'},
  {word: 'after', start: 4.88, end: 5.28, confidence: 0.999, punctuated_word: 'after'},
  {word: 'about', start: 5.28, end: 5.6, confidence: 0.999, punctuated_word: 'about'},
  {word: 'a', start: 5.6, end: 5.84, confidence: 1, punctuated_word: 'a'},
  {word: 'month', start: 5.84, end: 6, confidence: 1, punctuated_word: 'month'},
  {word: 'and', start: 6, end: 6.16, confidence: 0.945, punctuated_word: 'and'},
];

const FONT_SIZE = 118;
/** 14-16% of the font size is the band where a stroke reads as an outline rather than a blob. */
const STROKE = Math.round(FONT_SIZE * 0.15);

export const TiktokCaptions: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  words = WORDS,
  src = staticFile('footage/interview.mp4'),
  wordsPerPage = 3,
  hits = ['natural', 'space'],
  color = theme.ink,
  activeColor = theme.series[2],
  hitColor = theme.series[3],
  backgroundColor = theme.bg,
  bottomInset = 560,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const hitSet = new Set(hits.map((h) => h.toLowerCase()));
  const f = (t: number) => Math.round(t * fps);

  // Half-open, and in frames — never in the noisy source seconds.
  const activeIndex = words.findIndex((w) => frame >= f(w.start) && frame < f(w.end));
  const lastEnd = f(words.at(-1)?.end ?? 0);

  // Between two words the previous page must stay put, so fall back to the last
  // word that has already started rather than to 0.
  let lastStarted = 0;
  for (let i = 0; i < words.length; i++) if (frame >= f(words[i].start)) lastStarted = i;
  const index = activeIndex !== -1 ? activeIndex : lastStarted;

  // 12 frames of hold after the last word, then the captions clear. Anything
  // longer and the caption is sitting over silence.
  const cleared = frame >= lastEnd + 12;

  const page = Math.floor(index / wordsPerPage);
  const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);
  // The page appears exactly on the frame its first word starts — never earlier.
  // A caption that precedes its audio reads as a spoiler.
  const pageStartFrame = f(words[page * wordsPerPage]?.start ?? 0);

  const pageIn = spring({
    frame: frame - pageStartFrame,
    fps,
    config: {damping: 16, stiffness: 160, mass: 0.6},
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      {src ? (
        // Two things here, and both are silent when you get them wrong.
        //
        // `objectFit` is a PROP on @remotion/media's <Video>, not a style. The
        // component draws into a canvas, so CSS object-fit has nothing to act
        // on; putting it in `style` is ignored (the package logs a warning at
        // verbose level and otherwise says nothing), and a 16:9 source sits
        // letterboxed in the middle of a 9:16 frame. There is no objectPosition
        // equivalent — `cover` centres, and to bias the crop you use the
        // cropLeft/cropRight/cropTop/cropBottom props, which take fractions.
        //
        // The wrapping AbsoluteFill is the second half. AbsoluteFill is a COLUMN
        // FLEX container, so a bare <Video> inside it is a flex item and takes
        // its intrinsic aspect; `cover` needs a definite 100%x100% box to crop
        // against.
        <AbsoluteFill>
          <Video
            objectFit="cover"
            src={src}
            muted
            style={{width: '100%', height: '100%'}}
          />
        </AbsoluteFill>
      ) : null}

      {/* Structural legibility, part one: a scrim under the caption band. The
          stroke alone would hold, but the scrim also separates the type from a
          face without dimming the whole shot. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: bottomInset + 420,
          backgroundImage:
            'linear-gradient(to top, rgba(6,7,11,0.78) 0%, rgba(6,7,11,0.44) 34%, rgba(6,7,11,0) 100%)',
          opacity: cleared ? 0 : 1,
        }}
      />

      <Interactive.Div
        name="Caption page"
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          bottom: bottomInset,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          // Column gap has to clear TWO strokes, not one: each word's outline
          // extends STROKE outward, so a 26px gap between 18px strokes leaves
          // the words touching. This is the bug that makes "IN SPACE" read as
          // "INSPACE" and it only shows up on short words.
          gap: `12px ${STROKE * 2 + 26}px`,
          scale: 0.88 + Math.min(1, pageIn) * 0.12,
          opacity: cleared ? 0 : Math.min(1, pageIn * 2),
        }}
      >
        {pageWords.map((w, i) => {
          const globalIndex = page * wordsPerPage + i;
          const isActive = globalIndex === activeIndex;
          const isHit = hitSet.has(w.word.toLowerCase());
          const started = frame >= f(w.start);

          const pop = spring({
            frame: frame - f(w.start),
            fps,
            config: {damping: 12, stiffness: 220, mass: 0.5},
          });

          return (
            <span
              key={globalIndex}
              style={{
                fontSize: FONT_SIZE,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: isHit ? hitColor : isActive ? activeColor : color,
                WebkitTextStroke: `${STROKE}px #04050a`,
                paintOrder: 'stroke fill',
                textShadow: '0 8px 0 rgba(11,13,18,0.55)',
                scale: isActive ? 1 + Math.min(0.16, pop * 0.16) : 1,
                // Not-yet-spoken words stay legible rather than ghosting out:
                // 0.55 is the floor at which the stroke still reads over footage.
                opacity: started ? 1 : 0.55,
              }}
            >
              {w.punctuated_word ?? w.word}
            </span>
          );
        })}
      </Interactive.Div>

      {/* The transcript source, stated. Fades out so it never fights the read. */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 260,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.62)',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
          opacity: interpolate(frame, [0, 12, 48, 62], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        DEEPGRAM NOVA-3 · WORD-LEVEL
      </div>
    </AbsoluteFill>
  );
};
