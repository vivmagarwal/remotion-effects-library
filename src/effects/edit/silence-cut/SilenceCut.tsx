import {AbsoluteFill, Interactive, Series, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Silence Cut
 *
 * The edit nobody wants to do by hand: dead air removed from a talking head,
 * computed from word timings rather than from an audio threshold.
 *
 * Working from a transcript instead of from RMS is what makes this reliable. An
 * amplitude gate cannot tell a breath from a room, and it cuts on a cough. The
 * gaps BETWEEN words are unambiguous, and they come free with any word-level
 * ASR — the `words` array below is a real Deepgram `nova-3` response for the
 * shipped clip, times in seconds.
 *
 * Three thresholds decide everything, and the margin is the one people forget:
 * without it every kept run starts mid-consonant, because a word's `start` is
 * where the vowel is loud enough to detect, not where the mouth began moving.
 */

/** One word from an ASR response: text, start and end in SECONDS. */
type Word = {readonly w: string; readonly s: number; readonly e: number};

type Props = {
  readonly src?: string;
  /** Word timings. Defaults to a real Deepgram nova-3 response for the shipped clip. */
  readonly words?: readonly Word[];
  /**
   * Gaps shorter than this are grammar, not dead air. 350ms is the working
   * default: below about 300ms you start cutting the beats between clauses and
   * the speaker turns into a machine gun.
   */
  readonly minSilence?: number;
  /**
   * Kept either side of every run, in seconds. A word's `start` is where it
   * became loud enough to detect, so cutting exactly there clips the attack of
   * the consonant. 180-220ms is the band; `auto-editor`'s default is 200ms.
   */
  readonly margin?: number;
  /** Anything shorter than this after margins is a click, not a segment. */
  readonly minSegment?: number;
  /** Also drop these words outright. Set to [] to cut silence only. */
  readonly fillers?: readonly string[];
  /** The source window to show, in seconds. The default contains the one long pause. */
  readonly window?: readonly [number, number];
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const DEEPGRAM_WORDS: Word[] = [
  {w: 'So', s: 0.00, e: 0.48}, {w: 'what', s: 0.48, e: 0.64}, {w: 'does', s: 0.64, e: 0.88},
  {w: 'the', s: 0.88, e: 1.04}, {w: 'possibility', s: 1.04, e: 2.00}, {w: 'of', s: 2.00, e: 2.24},
  {w: 'being', s: 2.24, e: 2.48}, {w: 'the', s: 2.48, e: 2.64}, {w: 'first', s: 2.64, e: 2.88},
  {w: 'woman', s: 2.88, e: 3.28}, {w: 'on', s: 3.28, e: 3.60}, {w: 'the', s: 3.60, e: 3.68},
  {w: 'moon', s: 3.68, e: 3.92}, {w: 'mean', s: 3.92, e: 4.24}, {w: 'to', s: 4.24, e: 4.40},
  {w: 'you?', s: 4.40, e: 4.88}, {w: 'Well,', s: 5.52, e: 5.92}, {w: 'I', s: 5.92, e: 6.00},
  {w: 'I', s: 6.00, e: 6.16}, {w: 'think', s: 6.16, e: 6.32}, {w: 'I', s: 6.32, e: 6.48},
  {w: 'told', s: 6.48, e: 6.72}, {w: 'someone,', s: 6.72, e: 7.12}, {w: 'um,', s: 7.12, e: 7.36},
  {w: 'in', s: 7.36, e: 7.52}, {w: 'the', s: 7.52, e: 7.60}, {w: 'past,', s: 7.60, e: 7.92},
  {w: 'um,', s: 7.92, e: 8.08}, {w: 'being', s: 8.08, e: 8.32}, {w: 'the', s: 8.32, e: 8.48},
  {w: 'first', s: 8.48, e: 8.64}, {w: 'or', s: 8.64, e: 8.96}, {w: 'anything', s: 8.96, e: 9.28},
  {w: 'like', s: 9.28, e: 9.44}, {w: 'that', s: 9.44, e: 9.68}, {w: 'is', s: 9.68, e: 10.24},
  {w: 'a', s: 10.24, e: 10.56}, {w: 'huge', s: 10.56, e: 11.04},
  {w: 'responsibility,', s: 11.04, e: 12.16}, {w: 'and', s: 12.48, e: 12.64},
  {w: 'it\'s', s: 12.64, e: 12.88}, {w: 'a', s: 12.88, e: 13.04}, {w: 'huge', s: 13.04, e: 13.28},
  {w: 'honor', s: 13.28, e: 13.60}, {w: 'at', s: 13.60, e: 13.84}, {w: 'the', s: 13.84, e: 14.00},
  {w: 'same', s: 14.00, e: 14.24}, {w: 'time.', s: 14.24, e: 14.56}, {w: 'And', s: 15.04, e: 15.29},
  {w: 'so', s: 15.29, e: 15.45}, {w: 'going', s: 15.45, e: 15.85}, {w: 'back', s: 15.85, e: 16.01},
  {w: 'to', s: 16.01, e: 16.16}, {w: 'the', s: 16.16, e: 16.32}, {w: 'moon', s: 16.32, e: 16.48},
  {w: '2024,', s: 16.48, e: 17.61}, {w: 'um,', s: 17.61, e: 17.85}, {w: 'it\'s', s: 17.85, e: 18.09},
  {w: 'very', s: 18.09, e: 18.41}, {w: 'soon,', s: 18.41, e: 18.80}, {w: 'very', s: 18.80, e: 19.05},
  {w: 'quick,', s: 19.05, e: 19.61}, {w: 'and', s: 19.77, e: 19.93}, {w: 'I', s: 19.93, e: 20.09},
  {w: 'think', s: 20.09, e: 20.32}, {w: 'everyone', s: 20.32, e: 20.64}, {w: 'in', s: 20.64, e: 20.89},
  {w: 'the', s: 20.89, e: 20.96}, {w: 'astronaut', s: 20.96, e: 21.45}, {w: 'corps', s: 21.45, e: 21.77},
  {w: 'is', s: 21.77, e: 22.01}, {w: 'prepared', s: 22.01, e: 22.48}, {w: 'for', s: 22.48, e: 22.64},
  {w: 'that.', s: 22.64, e: 23.12}, {w: 'And', s: 23.29, e: 23.53}, {w: 'CAVES', s: 23.53, e: 24.09},
  {w: 'is', s: 24.09, e: 24.32}, {w: 'one', s: 24.32, e: 24.57}, {w: 'of', s: 24.57, e: 24.64},
  {w: 'those', s: 24.64, e: 24.89}, {w: 'tools', s: 24.89, e: 25.20}, {w: 'that', s: 25.20, e: 25.45},
  {w: 'will', s: 25.45, e: 25.69}, {w: 'help', s: 25.69, e: 25.93}, {w: 'you,', s: 25.93, e: 26.40},
  {w: 'um,', s: 26.64, e: 26.96}, {w: 'prepare', s: 26.96, e: 27.29}, {w: 'to', s: 27.29, e: 27.61},
  {w: 'go', s: 27.61, e: 27.69}, {w: 'to', s: 27.69, e: 27.85}, {w: 'the', s: 27.85, e: 27.93},
  {w: 'moon,', s: 27.93, e: 28.24}, {w: 'do', s: 28.24, e: 28.40}, {w: 'research', s: 28.40, e: 28.89},
  {w: 'exploration,', s: 28.89, e: 29.52}, {w: 'stay', s: 29.79, e: 30.27}, {w: 'on', s: 30.27, e: 30.59},
  {w: 'the', s: 30.59, e: 30.75}, {w: 'moon,', s: 30.75, e: 31.31}, {w: 'and', s: 31.55, e: 31.63},
  {w: 'have', s: 31.63, e: 31.87}, {w: 'a', s: 31.87, e: 32.03}, {w: 'permanent', s: 32.03, e: 32.43},
  {w: 'presence', s: 32.43, e: 32.75}, {w: 'there.', s: 32.75, e: 33.31}, {w: 'So', s: 33.87, e: 34.27},
  {w: 'being', s: 34.27, e: 34.67}, {w: 'the', s: 34.67, e: 34.91}, {w: 'first', s: 34.91, e: 35.15},
  {w: 'anything,', s: 35.15, e: 36.03}, {w: 'to', s: 36.11, e: 36.35}, {w: 'me,', s: 36.35, e: 36.67},
  {w: 'it', s: 36.67, e: 36.83}, {w: 'bears', s: 36.83, e: 37.23}, {w: 'a', s: 37.23, e: 37.47},
  {w: 'lot', s: 37.47, e: 37.63}, {w: 'of', s: 37.63, e: 37.79},
  {w: 'responsibility.', s: 37.79, e: 38.75}, {w: 'And', s: 38.75, e: 38.91}, {w: 'I', s: 38.91, e: 39.23},
  {w: 'I\'m', s: 39.31, e: 39.47}, {w: 'up', s: 39.47, e: 39.71}, {w: 'for', s: 39.71, e: 39.87},
  {w: 'that', s: 39.87, e: 40.03}, {w: 'challenge,', s: 40.03, e: 40.51}, {w: 'but', s: 40.51, e: 40.59},
  {w: 'at', s: 40.59, e: 40.83}, {w: 'the', s: 40.83, e: 40.91}, {w: 'same', s: 40.91, e: 41.15},
  {w: 'time,', s: 41.15, e: 41.71}, {w: 'um,', s: 42.03, e: 42.35}, {w: 'I\'m', s: 42.35, e: 42.83},
  {w: 'just', s: 42.83, e: 43.15}, {w: 'I\'m', s: 43.39, e: 43.55}, {w: 'hopeful.', s: 43.55, e: 43.95},
  {w: 'How', s: 44.14, e: 45.42}, {w: 'long', s: 48.78, e: 49.02}, {w: 'before', s: 49.02, e: 49.34},
  {w: 'you', s: 49.34, e: 49.50}, {w: 'find', s: 49.50, e: 49.82}, {w: 'out', s: 49.82, e: 49.98},
  {w: 'if', s: 49.98, e: 50.22}, {w: 'you', s: 50.22, e: 50.38}, {w: 'are', s: 50.38, e: 50.62},
  {w: 'on', s: 50.62, e: 50.78}, {w: 'the', s: 50.78, e: 50.94}, {w: 'mission', s: 50.94, e: 51.18},
  {w: 'for', s: 51.18, e: 51.42}, {w: 'sure?', s: 51.42, e: 51.98}, {w: 'Well,', s: 52.22, e: 52.54},
  {w: 'I', s: 52.54, e: 52.62}, {w: 'think', s: 52.62, e: 52.78}, {w: 'it\'ll', s: 52.78, e: 53.02},
  {w: 'be', s: 53.02, e: 53.18},
];

/**
 * Word timings -> a keep-list of source ranges, in seconds.
 *
 * Pure, and deliberately so: the cut list is a function of the transcript, which
 * means it is inspectable, diffable, and identical on every render tab.
 */
const buildKeepList = (
  words: readonly Word[],
  {minSilence, margin, minSegment, fillers}:
    {minSilence: number; margin: number; minSegment: number; fillers: readonly string[]},
): {readonly s: number; readonly e: number}[] => {
  const drop = new Set(fillers.map((f) => f.toLowerCase()));
  const kept = words.filter((w) => !drop.has(w.w.toLowerCase().replace(/[^a-z']/g, '')));
  if (kept.length === 0) return [];

  // 1. Group into runs, breaking wherever the gap is real dead air.
  const runs: {s: number; e: number}[] = [{s: kept[0].s, e: kept[0].e}];
  for (let i = 1; i < kept.length; i++) {
    if (kept[i].s - kept[i - 1].e >= minSilence) runs.push({s: kept[i].s, e: kept[i].e});
    else runs[runs.length - 1].e = kept[i].e;
  }

  // 2. Pad each run, drop the clicks, and merge anything the padding overlapped —
  //    skip the merge and two adjacent removals become a stutter of micro-cuts.
  const out: {s: number; e: number}[] = [];
  for (const r of runs) {
    const s = Math.max(0, r.s - margin);
    const e = r.e + margin;
    if (e - s < minSegment) continue;
    const last = out[out.length - 1];
    if (last && s <= last.e) last.e = Math.max(last.e, e);
    else out.push({s, e});
  }
  return out;
};

export const SilenceCut: React.FC<Props> = ({
  src,
  words = DEEPGRAM_WORDS,
  minSilence = 0.35,
  margin = 0.2,
  minSegment = 0.25,
  fillers = ['um', 'uh'],
  window: sourceWindow = [40, 53.4],
  accentColor = '#ff5c39',
  backgroundColor = '#0a0b10',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const source = src ?? staticFile('footage/interview-raw.mp4');

  const full = buildKeepList(words, {minSilence, margin, minSegment, fillers});
  const [from, to] = sourceWindow;

  // Clip the keep-list to the window we are showing, so the composition length
  // and the strip below describe the same thing.
  const shown = full
    .map((k) => ({s: Math.max(k.s, from), e: Math.min(k.e, to)}))
    .filter((k) => k.e - k.s > 0.05);

  const removed = to - from - shown.reduce((n, k) => n + (k.e - k.s), 0);

  // Output frame -> source seconds, for the playhead on the strip.
  let acc = 0;
  let playhead = from;
  for (const k of shown) {
    const len = (k.e - k.s) * fps;
    if (frame < acc + len) {
      playhead = k.s + (frame - acc) / fps;
      break;
    }
    acc += len;
    playhead = k.e;
  }

  const pct = (t: number) => ((t - from) / (to - from)) * 100;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      {/* The cut. One <Video> per kept range, played back to back — a cut list
          IS a <Series>, and trimBefore/trimAfter are FRAME counts, not seconds. */}
      <Series>
        {shown.map((k) => (
          <Series.Sequence
            key={k.s}
            durationInFrames={Math.max(1, Math.round((k.e - k.s) * fps))}
            premountFor={fps}
          >
            <Video
              objectFit="cover"
              src={source}
              trimBefore={Math.round(k.s * fps)}
              trimAfter={Math.round(k.e * fps)}
              muted
              style={{width: '100%', height: '100%',}}
            />
          </Series.Sequence>
        ))}
      </Series>

      <Interactive.Div
        name="Readout"
        style={{
          position: 'absolute',
          left: 84,
          top: 84,
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          padding: '14px 26px',
          borderRadius: 12,
          backgroundColor: 'rgba(10, 11, 16, 0.72)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
        }}
      >
        <span style={{fontSize: 54, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em'}}>
          −{removed.toFixed(1)}s
        </span>
        <span style={{fontSize: 28, fontWeight: 700, letterSpacing: '0.16em', color: accentColor}}>
          {shown.length} SEGMENTS
        </span>
        <span style={{fontSize: 28, fontWeight: 500, color: '#8d93a5'}}>
          {minSilence * 1000}ms gate · {margin * 1000}ms margin
        </span>
      </Interactive.Div>

      {/* The strip is the source timeline, not the output: kept ranges in accent,
          everything between them removed. The playhead jumps at each cut, which
          is the clearest possible picture of what the edit did. */}
      <div style={{position: 'absolute', left: 84, right: 84, bottom: 110}}>
        <div
          style={{
            position: 'relative',
            height: 26,
            borderRadius: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            overflow: 'hidden',
          }}
        >
          {shown.map((k) => (
            <div
              key={k.s}
              style={{
                position: 'absolute',
                left: `${pct(k.s)}%`,
                width: `${pct(k.e) - pct(k.s)}%`,
                top: 0,
                bottom: 0,
                backgroundColor: accentColor,
                opacity: 0.85,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: `${pct(playhead)}%`,
              top: -7,
              bottom: -7,
              width: 3,
              backgroundColor: '#ffffff',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            fontSize: 34,
            fontWeight: 500,
            color: '#8d93a5',
          }}
        >
          <span>{from.toFixed(1)}s</span>
          <span style={{color: '#eef1f7'}}>
            source {playhead.toFixed(2)}s · out {(frame / fps).toFixed(2)}s
          </span>
          <span>{to.toFixed(1)}s</span>
        </div>
      </div>

      {/* A hairline that fills as the OUTPUT plays, so the two clocks are visible
          as two different things. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 5,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${interpolate(frame, [0, durationInFrames], [0, 100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
