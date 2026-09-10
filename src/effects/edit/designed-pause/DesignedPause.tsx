import {
  AbsoluteFill,
  Interactive,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Designed Pause
 *
 * The other half of silence removal, and the half nobody builds. Cutting dead
 * air is easy and mechanical. Deciding where a piece should BREATHE — and then
 * putting something there — is the edit.
 *
 * The rule this encodes: **a pause is placed by classification, sized by a
 * budget, and filled by design.**
 *
 *  1. **Placed by classification.** Inter-word gaps are aligned to language, not
 *     to amplitude — a breath under room tone is invisible to an RMS threshold
 *     and obvious as a 240 ms hole in a transcript. Anything over `sceneGapMs`
 *     is a topic change, and that is the only place a designed pause belongs.
 *     There is exactly one in this clip, and the classifier finds it rather than
 *     being told: 3.36 s between "hopeful" and "long before you find out".
 *  2. **Sized by a budget, not by a slider.** The hold is the gap's own length,
 *     scaled by `holdRatio` and clamped into `[minHoldMs, maxHoldMs]`. Keeping
 *     the whole gap is not design, it is inaction — half of it lands the topic
 *     change without the audience wondering whether the video froze. Under 1 s
 *     it reads as a glitch; over 5 s you have made a different scene.
 *  3. **Filled by design.** Past about 45 frames an empty hold is dead air with
 *     better branding. Something has to be there: a chapter card, a still, a
 *     breath of b-roll. That threshold is why `minHoldMs` defaults to 1000 —
 *     below it, cut instead.
 *
 * And the rule that makes any of it survive contact with real footage: **the cut
 * lands inside the gap, never on a word.** `marginMs` keeps a fifth of a second
 * of the natural silence on each side, because a word's `start` is where the
 * vowel got loud enough to detect, not where the mouth began moving — cut
 * exactly on it and you clip the consonant onset.
 *
 * The video is muted, in line with every other effect here. The pause is made
 * visible on the timeline instead of audible, which is also the more useful way
 * to read it while you are still deciding.
 */

/** One word from an ASR response: text, start and end in SECONDS. */
type Word = {readonly w: string; readonly s: number; readonly e: number};

type GapKind = 'micro' | 'breath' | 'beat' | 'sentence' | 'scene';

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly accent: string;
  readonly bgDeep: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  accent: '#ff5c39',
  bgDeep: '#04050a',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  /** What plays during the designed hold. A still or a chapter card works too. */
  readonly beatSrc?: string;
  /** Word timings in seconds, in source time. */
  readonly words?: readonly Word[];
  /** A gap at least this long is a topic change. 1500 ms is the boundary. */
  readonly sceneGapMs?: number;
  /** Fraction of the found gap to keep. 1 is inaction; 0.5 lands the change. */
  readonly holdRatio?: number;
  /** Floor on the hold. Below this, cut the gap out instead of designing it. */
  readonly minHoldMs?: number;
  /** Ceiling on the hold. Past this you have made a different scene. */
  readonly maxHoldMs?: number;
  /** Natural silence kept each side of the cut so no consonant onset is clipped. */
  readonly marginMs?: number;
  /**
   * Length of the source file, in frames. A keep-list built from a transcript
   * can and does run past the end of the media: ASR reports a last word at
   * 53.18 s for a file that is 1590 frames — 53.00 s — long, and the tail of
   * that section renders as a held final frame with no error. Clamp against it.
   */
  readonly sourceDurationInFrames?: number;
  /** What goes in the hold. */
  readonly chapterKicker?: string;
  readonly chapterTitle?: string;
  readonly showTimeline?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

/**
 * `public/transcripts/interview-raw.deepgram.json`, 38.75 s → 53.18 s, verbatim
 * apart from rounding to 2dp. Note "How" at 44.14 → 45.42: a 1.28 s word is
 * Deepgram mis-attributing the tail of the answer, and it is left in because
 * real ASR output does this and a classifier has to survive it.
 */
const WORDS: Word[] = [
  {w: 'And', s: 38.75, e: 38.91}, {w: 'I', s: 38.91, e: 39.23}, {w: "I'm", s: 39.31, e: 39.47},
  {w: 'up', s: 39.47, e: 39.71}, {w: 'for', s: 39.71, e: 39.87}, {w: 'that', s: 39.87, e: 40.03},
  {w: 'challenge,', s: 40.03, e: 40.51}, {w: 'but', s: 40.51, e: 40.59},
  {w: 'at', s: 40.59, e: 40.83}, {w: 'the', s: 40.83, e: 40.91}, {w: 'same', s: 40.91, e: 41.15},
  {w: 'time,', s: 41.15, e: 41.71}, {w: 'um,', s: 42.03, e: 42.35},
  {w: "I'm", s: 42.35, e: 42.83}, {w: 'just', s: 42.83, e: 43.15},
  {w: "I'm", s: 43.39, e: 43.55}, {w: 'hopeful.', s: 43.55, e: 43.95},
  {w: 'How', s: 44.14, e: 45.42}, {w: 'long', s: 48.78, e: 49.02},
  {w: 'before', s: 49.02, e: 49.34}, {w: 'you', s: 49.34, e: 49.50},
  {w: 'find', s: 49.50, e: 49.82}, {w: 'out', s: 49.82, e: 49.98}, {w: 'if', s: 49.98, e: 50.22},
  {w: 'you', s: 50.22, e: 50.38}, {w: 'are', s: 50.38, e: 50.62}, {w: 'on', s: 50.62, e: 50.78},
  {w: 'the', s: 50.78, e: 50.94}, {w: 'mission', s: 50.94, e: 51.18},
  {w: 'for', s: 51.18, e: 51.42}, {w: 'sure?', s: 51.42, e: 51.98},
  {w: 'Well,', s: 52.22, e: 52.54}, {w: 'I', s: 52.54, e: 52.62},
  {w: 'think', s: 52.62, e: 52.78}, {w: "it'll", s: 52.78, e: 53.02},
  {w: 'be', s: 53.02, e: 53.18},
];

/** The table, verbatim. These boundaries are in milliseconds. */
const classify = (ms: number): GapKind =>
  ms < 120 ? 'micro' : ms < 300 ? 'breath' : ms < 700 ? 'beat' : ms < 1500 ? 'sentence' : 'scene';

const GAP_COLOR: Record<GapKind, string> = {
  micro: '#4a4e5a',
  breath: '#4cc9f0',
  beat: '#c6ff3d',
  sentence: '#ffd166',
  scene: '#ff5c39',
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const DesignedPause: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src = staticFile('footage/interview-raw.mp4'),
  beatSrc = staticFile('footage/broll-earth.mp4'),
  words = WORDS,
  sceneGapMs = 1500,
  holdRatio = 0.5,
  minHoldMs = 1000,
  maxHoldMs = 5000,
  marginMs = 200,
  sourceDurationInFrames = 1590,
  chapterKicker = 'THE PAUSE IS DESIGNED',
  chapterTitle = 'On the mission',
  showTimeline = true,
  accentColor = theme.accent,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const f = (seconds: number) => Math.round(seconds * fps);

  // ── 1. classify every gap ────────────────────────────────────────────────
  const gaps = words.slice(0, -1).flatMap((a, i) => {
    const ms = Math.round((words[i + 1].s - a.e) * 1000);
    // Deepgram emits touching words; a zero-length gap is not a gap.
    return ms <= 0 ? [] : [{index: i, startS: a.e, endS: words[i + 1].s, ms, kind: classify(ms)}];
  });

  // ── 2. the one place a designed pause belongs ────────────────────────────
  const scene = gaps.reduce<(typeof gaps)[number] | null>(
    (best, g) => (g.ms >= sceneGapMs && (best === null || g.ms > best.ms) ? g : best),
    null,
  );
  // With no topic change there is nothing to design, so play the window straight.
  const cutOutS = scene ? scene.startS + marginMs / 1000 : words.at(-1)!.e;
  const cutInS = scene ? scene.endS - marginMs / 1000 : words.at(-1)!.e;

  // ── 3. the budget ────────────────────────────────────────────────────────
  const holdMs = scene ? clamp(scene.ms * holdRatio, minHoldMs, maxHoldMs) : 0;
  const holdFrames = Math.round((holdMs / 1000) * fps);

  // The window either side. Sections start on a word, minus the same margin.
  const beforeStartS = words[Math.max(0, words.findIndex((w) => w.s > cutOutS - 4)) - 1]?.s ?? words[0].s;
  const inS = Math.max(words[0].s, beforeStartS) - marginMs / 1000;
  const outS = Math.min(words.at(-1)!.e + marginMs / 1000, (sourceDurationInFrames - 1) / fps);

  const beforeFrames = f(cutOutS) - f(inS);
  const afterFrames = f(outS) - f(cutInS);

  const sections = [
    {name: 'A', frames: beforeFrames, trimBefore: f(inS)},
    {name: 'BEAT', frames: holdFrames, trimBefore: -1},
    {name: 'B', frames: afterFrames, trimBefore: f(cutInS)},
  ].filter((s) => s.frames > 0);

  const totalFrames = sections.reduce((n, s) => n + s.frames, 0);

  // Where the playhead is, on the OUTPUT timeline.
  const outputProgress = clamp(frame / Math.max(1, totalFrames - 1), 0, 1);

  // The source strip maps [inS, outS] across the full width.
  const sourceX = (s: number) => ((s - inS) / (outS - inS)) * 100;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <Series>
        {sections.map((sec) => (
          <Series.Sequence key={sec.name} durationInFrames={sec.frames} name={sec.name}>
            {sec.trimBefore >= 0 ? (
              <AbsoluteFill>
                {/* trimBefore is a FRAME COUNT into the source, not seconds. */}
                <Video
                  src={src}
                  objectFit="cover"
                  muted
                  trimBefore={sec.trimBefore}
                  style={{width: '100%', height: '100%'}}
                />
              </AbsoluteFill>
            ) : (
              <BeatCard
                src={beatSrc}
                kicker={chapterKicker}
                title={chapterTitle}
                accentColor={accentColor}
              />
            )}
          </Series.Sequence>
        ))}
      </Series>

      {showTimeline ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 460,
              backgroundImage:
                'linear-gradient(to top, rgba(4,5,10,0.94) 0%, rgba(4,5,10,0.7) 46%, rgba(4,5,10,0) 100%)',
            }}
          />

          <Interactive.Div
            name="Verdict"
            style={{
              position: 'absolute',
              left: 84,
              top: 84,
              padding: '18px 28px',
              borderRadius: 12,
              backgroundColor: 'rgba(10, 11, 16, 0.72)',
              backdropFilter: 'blur(18px) saturate(1.3)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              maxWidth: 900,
            }}
          >
            <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '0.16em', color: accentColor}}>
              {scene ? `SCENE GAP · ${(scene.ms / 1000).toFixed(2)}s` : 'NO SCENE GAP'}
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: '#eef1f7', marginTop: 8}}>
              {scene
                ? `held for ${(holdMs / 1000).toFixed(2)}s — ${Math.round(holdRatio * 100)}% of it, clamped to ${minHoldMs / 1000}–${maxHoldMs / 1000}s`
                : 'nothing to design; the window plays straight'}
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: '#8d93a5', marginTop: 8}}>
              {gaps.length} gaps classified · cut inside the gap, {marginMs}ms clear of every word
            </div>
          </Interactive.Div>

          {/* ── the source, as the classifier sees it ── */}
          <div style={{position: 'absolute', left: 84, right: 84, bottom: 210}}>
            <Label>SOURCE · every gap classified</Label>
            <div
              style={{
                position: 'relative',
                height: 46,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.07)',
                overflow: 'hidden',
              }}
            >
              {words.map((w) => (
                <div
                  key={`${w.s}-${w.w}`}
                  style={{
                    position: 'absolute',
                    left: `${sourceX(w.s)}%`,
                    width: `${Math.max(0.25, sourceX(w.e) - sourceX(w.s))}%`,
                    top: 12,
                    height: 22,
                    backgroundColor: 'rgba(238,241,247,0.5)',
                    borderRadius: 3,
                  }}
                />
              ))}
              {gaps.map((g) => (
                <div
                  key={g.index}
                  style={{
                    position: 'absolute',
                    left: `${sourceX(g.startS)}%`,
                    width: `${sourceX(g.endS) - sourceX(g.startS)}%`,
                    top: 0,
                    bottom: 0,
                    // The scene gap is the only one that gets solid ink; the rest
                    // are shown so you can see it is the outlier, not the pick.
                    backgroundColor: GAP_COLOR[g.kind],
                    opacity: g.kind === 'scene' ? 0.92 : 0.34,
                  }}
                />
              ))}
              {scene ? (
                <>
                  <Marker x={sourceX(cutOutS)} color="#f6f5f2" />
                  <Marker x={sourceX(cutInS)} color="#f6f5f2" />
                </>
              ) : null}
            </div>
          </div>

          {/* ── the output, with the designed hold in it ── */}
          <div style={{position: 'absolute', left: 84, right: 84, bottom: 92}}>
            <Label>OUTPUT · A · designed hold · B</Label>
            <div style={{display: 'flex', gap: 4, height: 46, borderRadius: 6, overflow: 'hidden'}}>
              {sections.map((sec) => (
                <div
                  key={sec.name}
                  style={{
                    flexGrow: sec.frames,
                    flexBasis: 0,
                    backgroundColor: sec.name === 'BEAT' ? accentColor : 'rgba(238,241,247,0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    color: sec.name === 'BEAT' ? '#04050a' : '#eef1f7',
                  }}
                >
                  {sec.name === 'BEAT' ? `${(holdMs / 1000).toFixed(2)}s` : sec.name}
                </div>
              ))}
            </div>
            {/* The playhead. It is on the OUTPUT strip, not the source one: after
                the cut the two clocks are different, and drawing one playhead on
                both is the thing that makes people mis-time a caption. */}
            <div
              style={{
                position: 'absolute',
                left: `${outputProgress * 100}%`,
                top: 44,
                width: 3,
                height: 46,
                backgroundColor: '#f6f5f2',
                boxShadow: '0 0 18px rgba(246,245,242,0.7)',
              }}
            />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Label: React.FC<{children: string}> = ({children}) => (
  <div
    style={{
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: '0.18em',
      color: '#8d93a5',
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const Marker: React.FC<{x: number; color: string}> = ({x, color}) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: -6,
      bottom: -6,
      width: 3,
      backgroundColor: color,
    }}
  />
);

/**
 * What sits in the hold. Past ~45 frames an empty hold is dead air with better
 * branding, so the beat carries a chapter card over a slow push — the push is
 * what tells the audience the video has not frozen.
 */
const BeatCard: React.FC<{src: string; kicker: string; title: string; accentColor: string}> = ({
  src,
  kicker,
  title,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const inSpring = spring({frame, fps, config: {damping: 18, stiffness: 140, mass: 0.7}});

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Video src={src} objectFit="cover" muted loop style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'rgba(4,5,10,0.62)'}} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 200px 180px',
          // A slow push across the whole hold. Without it a 50-frame card reads
          // as a freeze, which is the exact impression a designed pause exists
          // to avoid.
          scale: interpolate(frame, [0, durationInFrames], [1, 1.04], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '0.28em',
            marginRight: '-0.28em',
            color: accentColor,
            opacity: Math.min(1, inSpring * 1.4),
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontSize: 116,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f6f5f2',
            marginTop: 20,
            textShadow: '0 10px 50px rgba(0,0,0,0.6)',
            translate: `0px ${(1 - inSpring) * 26}px`,
            opacity: Math.min(1, inSpring * 1.6),
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
