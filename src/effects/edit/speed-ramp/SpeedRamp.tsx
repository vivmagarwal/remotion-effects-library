import {
  AbsoluteFill,
  Interactive,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {useMemo} from 'react';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Speed Ramp
 *
 * Normal → slow → over-cranked, on one clip, with the picture continuous
 * through both ramps.
 *
 * **`playbackRate` alone does not do this.** It is read once when the clip
 * mounts; animating it changes nothing on screen. A ramp is a remap: at every
 * output frame you compute how far into the SOURCE you have travelled by
 * summing the speed so far, and you seek there.
 *
 * ```
 * source position(f) = Σ speed(i) for i in [0, f]
 * ```
 *
 * Two things everyone gets wrong the first time:
 *
 *  1. **`<Sequence from={frame}>` is not a typo.** It resets the child's
 *     internal clock to 0 on every frame, so `trimBefore` is the sole source of
 *     truth for the playhead. Leave it out and the child's own clock advances
 *     *as well as* `trimBefore` — the clip accelerates away and the ramp looks
 *     like a bug in the encode.
 *  2. **The cumulative sum is computed once, not per frame.** Written inline it
 *     is O(frame) per frame, which is O(n²) over a render — survivable to about
 *     900 frames and embarrassing after that. It is also a pure function of the
 *     ramp, so a `useMemo` is not an optimisation, it is where it belongs.
 *
 * Three numbers that make a ramp read as a directing choice rather than as an
 * accident, and none of them are guesses:
 *
 *  - **The ramp out is longer than the ramp in.** 8 frames down, 14 back up.
 *    Symmetric reads mechanical, because nothing in the physical world
 *    accelerates and decelerates at the same rate.
 *  - **The slow section starts BEFORE the moment,** not on it. By the time the
 *    audience registers the speed change the moment has already begun; start it
 *    4–6 frames early and it lands.
 *  - **0.4× is the floor for 30 fps source.** Below it each source frame is held
 *    for three or more output frames and the shot stutters. Remotion has no
 *    optical flow and no frame blending — there is no software fix, only a
 *    higher-frame-rate source. Slowing 30 fps to 0.2× honestly requires 150 fps
 *    in the camera.
 *
 * The clip is muted. `playbackRate` pitches audio with the picture, and at 0.4×
 * `toneFrequency` would need ~2.5 to compensate, which is outside its verified
 * 0.01–2 range. The honest answer is a muted picture plus a separate un-ramped
 * `<Audio>`.
 */

/** One leg of the ramp. `from`/`to` are multiples of real time. */
type Leg = {readonly frames: number; readonly from: number; readonly to: number; readonly label: string};

type Props = {
  readonly src?: string;
  /**
   * The ramp, as data. Written this way so it can be read, diffed and reasoned
   * about — a ramp expressed as nested interpolate() calls cannot be.
   */
  readonly ramp?: readonly Leg[];
  /**
   * Length of the source, in frames. A ramp is a BUDGET on the source: the sum
   * of the speeds is how much of the file you spend, and overspending renders
   * as a held final frame with no error.
   */
  readonly sourceDurationInFrames?: number;
  readonly showDebug?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const RAMP: Leg[] = [
  {frames: 40, from: 1.0, to: 1.0, label: 'REAL TIME'},
  // Short in, long out. Nothing accelerates and decelerates at the same rate.
  {frames: 8, from: 1.0, to: 0.4, label: 'RAMP DOWN'},
  {frames: 72, from: 0.4, to: 0.4, label: 'HOLD · 0.4×'},
  {frames: 14, from: 0.4, to: 1.5, label: 'RAMP UP'},
  {frames: 55, from: 1.5, to: 1.5, label: 'OVER-CRANK · 1.5×'},
];

export const SpeedRamp: React.FC<Props> = ({
  src = staticFile('footage/broll-earth.mp4'),
  ramp = RAMP,
  sourceDurationInFrames = 180,
  showDebug = true,
  accentColor = '#ff5c39',
  backgroundColor = '#04050a',
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const total = ramp.reduce((n, l) => n + l.frames, 0);

  /** Speed at an output frame, linear inside each leg. */
  const speedAt = useMemo(() => {
    return (f: number) => {
      let offset = 0;
      for (const leg of ramp) {
        if (f < offset + leg.frames) {
          const t = leg.frames <= 1 ? 1 : (f - offset) / (leg.frames - 1);
          return leg.from + (leg.to - leg.from) * t;
        }
        offset += leg.frames;
      }
      return ramp[ramp.length - 1]?.to ?? 1;
    };
  }, [ramp]);

  /**
   * The cumulative source position, precomputed. This is the whole effect: one
   * array, indexed by output frame, holding where in the source to seek.
   */
  const cumulative = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (let i = 0; i < Math.max(total, durationInFrames); i++) {
      out.push(acc);
      acc += speedAt(i);
    }
    return out;
  }, [speedAt, total, durationInFrames]);

  const speed = speedAt(frame);
  // Clamped, because the ramp's budget can exceed the file and the overrun
  // renders as a held final frame with no error — which looks like a choice.
  const sourceFrame = Math.min(
    sourceDurationInFrames - 1,
    Math.round(cumulative[frame] ?? 0),
  );

  const spent = sourceFrame / sourceDurationInFrames;
  const legLabel =
    ramp[
      ramp.reduce<{i: number; o: number}>(
        (a, leg, i) => (frame >= a.o ? {i, o: a.o + leg.frames} : a),
        {i: 0, o: 0},
      ).i
    ]?.label ?? '';

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      {/* from={frame} resets the child's clock every frame, so trimBefore is the
          only thing moving the playhead. Without it the clip runs away. */}
      <Sequence from={frame} name="Ramped">
        <AbsoluteFill>
          <Video
            src={src}
            objectFit="cover"
            muted
            trimBefore={sourceFrame}
            // Set as well as the seek: it keeps the decoder's own interpolation
            // consistent with where the remap is asking it to be.
            playbackRate={speed}
            style={{width: '100%', height: '100%'}}
          />
        </AbsoluteFill>
      </Sequence>

      {showDebug ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              // 460, and the stops are weighted low: the curve's top edge sits
              // 300px up, and at the old 380/44% ramp that landed on about 14%
              // alpha — grey type on a sunlit cloud field.
              height: 460,
              backgroundImage:
                'linear-gradient(to top, rgba(4,5,10,0.94) 0%, rgba(4,5,10,0.78) 40%, rgba(4,5,10,0.34) 74%, rgba(4,5,10,0) 100%)',
            }}
          />

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
              minWidth: 560,
            }}
          >
            <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '0.16em', color: accentColor}}>
              {legLabel}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 500,
                color: '#eef1f7',
                marginTop: 8,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {speed.toFixed(2)}× · source frame {sourceFrame} of {sourceDurationInFrames}
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: '#8d93a5', marginTop: 8}}>
              {Math.round(spent * 100)}% of the clip spent at output frame {frame}
            </div>
          </Interactive.Div>

          {/* The ramp itself, drawn. A speed ramp argued in prose is a claim; the
              curve with a playhead on it is the thing. */}
          <div style={{position: 'absolute', left: 84, right: 84, bottom: 110, height: 190}}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: '#8d93a5',
                marginBottom: 12,
                textShadow: '0 2px 12px rgba(4,5,10,0.9)',
              }}
            >
              SPEED · 0 → 2×
            </div>
            <svg width="100%" height="130" viewBox={`0 0 ${total} 130`} preserveAspectRatio="none">
              {/* 1× — the line the curve is measured against. */}
              <line
                x1={0}
                y1={130 - (1 / 2) * 130}
                x2={total}
                y2={130 - (1 / 2) * 130}
                stroke="rgba(238,241,247,0.34)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke={accentColor}
                strokeWidth={5}
                vectorEffect="non-scaling-stroke"
                points={Array.from({length: total}, (_, i) => `${i},${130 - (speedAt(i) / 2) * 130}`).join(' ')}
              />
              <line
                x1={frame}
                y1={0}
                x2={frame}
                y2={130}
                stroke="#f6f5f2"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* Source spend, as a bar. The ramp is a budget and this is the meter. */}
            <div
              style={{
                marginTop: 14,
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, spent * 100)}%`,
                  height: '100%',
                  backgroundColor: spent > 0.98 ? '#ffd166' : '#c6ff3d',
                }}
              />
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              right: 84,
              top: 84,
              fontSize: 34,
              fontWeight: 500,
              color: '#eef1f7',
              // Grey type over a bright limb is invisible, and the brightness of
              // that limb is the footage's business rather than this label's, so
              // it carries its own contrast.
              textShadow: '0 2px 14px rgba(4,5,10,0.95), 0 0 34px rgba(4,5,10,0.8)',
              opacity: interpolate(frame, [0, 16], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            8f down · 14f up · 0.4× floor
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
