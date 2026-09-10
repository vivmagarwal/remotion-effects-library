import {
  AbsoluteFill,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {useMemo} from 'react';
import {Video} from '@remotion/media';
import {createTikTokStyleCaptions, CaptionsInternals} from '@remotion/captions';
import type {Caption} from '@remotion/captions';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '600', '700'], subsets: ['latin']});

/**
 * Pause-Aware Captions
 *
 * Documentary subtitles that break where the speaker breathes, built on
 * `@remotion/captions` rather than on a hand-rolled pager.
 *
 * Four things in this pipeline are silent when you get them wrong, and three of
 * them are unit conversions:
 *
 *  1. **Three clocks.** Deepgram is SECONDS (noisy floats — `0.39999998`).
 *     `@remotion/captions` is MILLISECONDS. Remotion is FRAMES. Convert once, at
 *     the boundary, and stay converted. Never compare a float second with `===`.
 *  2. **`Caption.text` must carry a LEADING SPACE.** `createTikTokStyleCaptions`
 *     starts a new page only when `text.startsWith(' ')`, and it concatenates
 *     tokens with no separator. Feed it bare words and you get one page holding
 *     the whole transcript, run together, with no error and no warning.
 *  3. **`breakOnSilenceAfterMilliseconds` is the pause-aware knob.** Any gap at
 *     least this long forces a new page, so a pause never has a half-full page
 *     hanging over it. 400 ms for short form, 700 for a documentary read. In
 *     this clip the 480 ms gap after "time." breaks the page and the 320 ms one
 *     after "responsibility," does not — which is the whole difference between
 *     captions that punctuate the read and captions that ignore it.
 *  4. **A page's `durationMs` runs to the NEXT page, not to its own last word.**
 *     Take it literally and a page sits on screen through the silence that
 *     caused the break — a caption over dead air, which is the caption
 *     equivalent of dead air. Each page is given its own last token's end plus
 *     `holdFrames` instead.
 *
 * Legibility is structural, not measured: you cannot compute a contrast ratio
 * against a moving background, so the caption rides a blur-behind pill. That is
 * the one option on the list that works over any footage without dimming it,
 * and `backdrop-filter` runs in Remotion's Chromium with no WebGL.
 */

/** One word from an ASR response: text, start and end in SECONDS. */
type Word = {readonly w: string; readonly s: number; readonly e: number};

type Props = {
  readonly src?: string;
  /** Word timings in seconds, in source time. */
  readonly words?: readonly Word[];
  /** Where in the source the window starts, in seconds. */
  readonly windowStart?: number;
  /**
   * Gap that forces a page break, in ms. 400 for short form, 700 for a
   * documentary read. This is the knob that makes captions punctuate a read.
   */
  readonly breakOnSilenceMs?: number;
  /** Target span of a page, in ms. */
  readonly combineWithinMs?: number;
  /** 42 is the subtitle standard. Two lines maximum. */
  readonly maxCharsPerLine?: number;
  /** Frames a page stays up after its last word ends. */
  readonly holdFrames?: number;
  readonly showDebug?: boolean;
  readonly color?: string;
  readonly activeColor?: string;
  readonly backgroundColor?: string;
};

/**
 * `public/transcripts/interview-raw.deepgram.json`, 5.52 s → 17.85 s, verbatim
 * apart from rounding to 2dp. Two real `um`s and two real pauses, left in.
 */
const WORDS: Word[] = [
  {w: 'Well,', s: 5.52, e: 5.92}, {w: 'I', s: 5.92, e: 6.0}, {w: 'I', s: 6.0, e: 6.16},
  {w: 'think', s: 6.16, e: 6.32}, {w: 'I', s: 6.32, e: 6.48}, {w: 'told', s: 6.48, e: 6.72},
  {w: 'someone,', s: 6.72, e: 7.12}, {w: 'um,', s: 7.12, e: 7.36}, {w: 'in', s: 7.36, e: 7.52},
  {w: 'the', s: 7.52, e: 7.6}, {w: 'past,', s: 7.6, e: 7.92}, {w: 'um,', s: 7.92, e: 8.08},
  {w: 'being', s: 8.08, e: 8.32}, {w: 'the', s: 8.32, e: 8.48}, {w: 'first', s: 8.48, e: 8.64},
  {w: 'or', s: 8.64, e: 8.96}, {w: 'anything', s: 8.96, e: 9.28}, {w: 'like', s: 9.28, e: 9.44},
  {w: 'that', s: 9.44, e: 9.68}, {w: 'is', s: 9.68, e: 10.24}, {w: 'a', s: 10.24, e: 10.56},
  {w: 'huge', s: 10.56, e: 11.04}, {w: 'responsibility,', s: 11.04, e: 12.16},
  {w: 'and', s: 12.48, e: 12.64}, {w: "it's", s: 12.64, e: 12.88},
  {w: 'a', s: 12.88, e: 13.04}, {w: 'huge', s: 13.04, e: 13.28},
  {w: 'honor', s: 13.28, e: 13.6}, {w: 'at', s: 13.6, e: 13.84},
  {w: 'the', s: 13.84, e: 14.0}, {w: 'same', s: 14.0, e: 14.24},
  {w: 'time.', s: 14.24, e: 14.56}, {w: 'And', s: 15.04, e: 15.29},
  {w: 'so', s: 15.29, e: 15.45}, {w: 'going', s: 15.45, e: 15.85},
  {w: 'back', s: 15.85, e: 16.01}, {w: 'to', s: 16.01, e: 16.16}, {w: 'the', s: 16.16, e: 16.32},
  {w: 'moon', s: 16.32, e: 16.48}, {w: '2024,', s: 16.48, e: 17.61},
  {w: 'um,', s: 17.61, e: 17.85},
];

export const PauseAwareCaptions: React.FC<Props> = ({
  src = staticFile('footage/interview-raw.mp4'),
  words = WORDS,
  windowStart = 5.32,
  breakOnSilenceMs = 400,
  combineWithinMs = 1600,
  maxCharsPerLine = 42,
  holdFrames = 12,
  showDebug = true,
  color = '#f6f5f2',
  activeColor = '#c6ff3d',
  backgroundColor = '#04050a',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const {pages, brokeOnSilence} = useMemo(() => {
    // Boundary 1: Deepgram seconds → @remotion/captions milliseconds.
    const captions: Caption[] = words.map((w) => ({
      // The leading space is LOAD-BEARING. Without it the pager never starts a
      // second page and the words render with no separator.
      text: ` ${w.w}`,
      startMs: Math.round(w.s * 1000),
      endMs: Math.round(w.e * 1000),
      timestampMs: Math.round(((w.s + w.e) / 2) * 1000),
      confidence: null,
    }));

    const {pages: raw} = createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: combineWithinMs,
      breakOnSilenceAfterMilliseconds: breakOnSilenceMs,
    });

    // Which breaks the silence rule caused, so the effect can show its work
    // rather than assert it.
    const broke = new Set<number>();
    raw.forEach((p, i) => {
      if (i === 0) return;
      const prev = raw[i - 1];
      const prevEnd = prev.tokens.at(-1)?.toMs ?? prev.startMs;
      if (p.startMs - prevEnd >= breakOnSilenceMs) broke.add(i);
    });

    return {pages: raw, brokeOnSilence: broke};
  }, [words, combineWithinMs, breakOnSilenceMs]);

  // Boundary 2: milliseconds → frames. `windowStart` shifts source time onto
  // composition time, once.
  const toFrame = (ms: number) => Math.round((ms / 1000 - windowStart) * fps);

  const spans = pages.map((p, i) => {
    const start = toFrame(p.startMs);
    // NOT p.durationMs: that runs to the NEXT page's start, so a page taken
    // literally sits on screen through the silence that caused the break. A
    // page lives to its own last word plus `holdFrames` — and never past the
    // next page's start, or the hold overlaps its successor and `find()` keeps
    // showing the stale one. That clamp is what leaves a caption-free beat over
    // the 480ms pause after "time.", which is the point of a pause-aware pager.
    const next = pages[i + 1];
    const own = toFrame(p.tokens.at(-1)?.toMs ?? p.startMs) + holdFrames;
    const end = next ? Math.min(own, toFrame(next.startMs)) : own;
    return {page: p, index: i, start, end};
  });

  // Half-open. A closed interval puts two pages on screen for one frame.
  const active = spans.find((p) => frame >= p.start && frame < p.end);

  // Boundary 3: a page wider than 42 characters becomes two lines, broken by the
  // package rather than by a guess at where a word ends.
  const lines = useMemo(() => {
    if (!active) return [];
    const asCaptions: Caption[] = active.page.tokens.map((t) => ({
      text: t.text,
      startMs: t.fromMs,
      endMs: t.toMs,
      timestampMs: Math.round((t.fromMs + t.toMs) / 2),
      confidence: null,
    }));
    const {segments} = CaptionsInternals.ensureMaxCharactersPerLine({
      captions: asCaptions,
      maxCharsPerLine,
    });
    // Two lines maximum: anything more is a paragraph, and a subtitle is not one.
    return segments.slice(0, 2);
  }, [active, maxCharsPerLine]);

  const pageIn = active
    ? interpolate(frame, [active.start, active.start + 5], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const sourceFrame = Math.round(windowStart * fps);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill>
        {/* objectFit is a prop on <Video>, not a style: it draws to a canvas. */}
        <Video
          src={src}
          objectFit="cover"
          muted
          trimBefore={sourceFrame}
          style={{width: '100%', height: '100%'}}
        />
      </AbsoluteFill>

      {active ? (
        <Interactive.Div
          name="Caption"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 130,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: pageIn,
            translate: `0px ${(1 - pageIn) * 10}px`,
          }}
        >
          {lines.map((line, li) => (
            <div
              key={li}
              style={{
                // The blur-behind pill. Structural legibility with no plate and
                // no dimming of the shot: it takes its contrast from whatever is
                // behind it, which is the only thing that holds over footage
                // whose brightness you do not control.
                backgroundColor: 'rgba(8,9,14,0.42)',
                backdropFilter: 'blur(18px) saturate(1.4)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 18,
                padding: '14px 34px',
                maxWidth: 1500,
                fontSize: 54,
                fontWeight: 600,
                lineHeight: 1.24,
                letterSpacing: '-0.01em',
                // Tokens keep their leading space and must be rendered with it.
                whiteSpace: 'pre',
                color,
                textShadow: '0 2px 14px rgba(0,0,0,0.55)',
              }}
            >
              {line.map((c, ci) => {
                const s = toFrame(c.startMs);
                const e = toFrame(c.endMs);
                const spoken = frame >= s;
                return (
                  <span
                    key={ci}
                    style={{
                      color: spoken && frame < e ? activeColor : color,
                      // Not-yet-spoken words stay fully legible: a subtitle is
                      // read ahead of the voice, unlike a karaoke caption.
                      opacity: 1,
                    }}
                  >
                    {c.text}
                  </span>
                );
              })}
            </div>
          ))}
        </Interactive.Div>
      ) : null}

      {showDebug ? (
        <>
          <Interactive.Div
            name="Readout"
            style={{
              position: 'absolute',
              left: 84,
              top: 84,
              padding: '16px 26px',
              borderRadius: 12,
              backgroundColor: 'rgba(10,11,16,0.72)',
              backdropFilter: 'blur(18px) saturate(1.3)',
              border: '1px solid rgba(255,255,255,0.14)',
              maxWidth: 900,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: active && brokeOnSilence.has(active.index) ? activeColor : '#8d93a5',
              }}
            >
              {active
                ? brokeOnSilence.has(active.index)
                  ? 'PAGE BROKEN ON SILENCE'
                  : 'PAGE BROKEN ON LENGTH'
                : 'NO PAGE — THE HOLD HAS CLEARED'}
            </div>
            <div style={{fontSize: 32, fontWeight: 500, color: '#eef1f7', marginTop: 8}}>
              {pages.length} pages · break at {breakOnSilenceMs}ms · {maxCharsPerLine} chars/line
            </div>
            <div style={{fontSize: 32, fontWeight: 500, color: '#8d93a5', marginTop: 8}}>
              createTikTokStyleCaptions + ensureMaxCharactersPerLine
            </div>
          </Interactive.Div>

          {/* Every page as a block on the source clock, so the silences that
              caused the breaks are visible as the holes between them. */}
          <div
            style={{
              position: 'absolute',
              left: 84,
              right: 84,
              bottom: 70,
              height: 26,
              borderRadius: 6,
              // A track, and it is not decoration: without it the non-accent
              // blocks sit at 0.34 x 0.55 alpha directly over daylight footage,
              // which is an effective 19% and reads as nothing. Only the accent
              // pages showed, so the strip looked like one stray bar.
              backgroundColor: 'rgba(4,5,10,0.62)',
              border: '1px solid rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            {pages.map((p, i) => {
              const s = toFrame(p.startMs);
              const e = toFrame(p.tokens.at(-1)?.toMs ?? p.startMs);
              const span = toFrame((words.at(-1)?.e ?? 1) * 1000);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(s / span) * 100}%`,
                    width: `${((e - s) / span) * 100}%`,
                    top: 0,
                    bottom: 0,
                    borderRadius: 4,
                    backgroundColor: brokeOnSilence.has(i) ? activeColor : '#eef1f7',
                    opacity: active?.index === i ? 1 : 0.42,
                  }}
                />
              );
            })}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
