import {AbsoluteFill, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import {exposure} from '@remotion/effects/exposure';
import {whiteBalance} from '@remotion/effects/white-balance';
import {levels} from '@remotion/effects/levels';
import {shadowsHighlights} from '@remotion/effects/shadows-highlights';
import {vibrance} from '@remotion/effects/vibrance';
import {saturation} from '@remotion/effects/saturation';
import {tint} from '@remotion/effects/tint';
import {vignette} from '@remotion/effects/vignette';
import {noise} from '@remotion/effects/noise';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Film Grade
 *
 * A grade assembling itself one stage at a time, with the ungraded source beside
 * it, so you can see what each stage actually costs and buys.
 *
 * **The `effects` array is an ordered pipeline, and the order IS the grade.**
 * That is the whole lesson and it is the thing a parameter panel hides. Three
 * consequences, in the order they bite:
 *
 *  1. **Exposure and white balance go first**, before anything reads a pixel
 *     value. Set the black point before the exposure and you have clipped the
 *     toe of a picture that was under by a quarter stop, and no later stage can
 *     get it back — the information is gone, not compressed.
 *  2. **`vibrance` before `saturation`.** Vibrance is a non-linear lift that
 *     protects already-saturated colours, which on a face means it protects
 *     skin. Saturate first and vibrance has nothing left to protect: you get the
 *     orange face that marks an amateur grade.
 *  3. **Vignette and grain are LAST, and grain is last of all.** A vignette is
 *     optical, not colour — put it before white balance and the corners get
 *     tinted along with the picture. Grain sits ON the image; run it before the
 *     contrast stage and the contrast crushes it into blotches.
 *
 * And the detail that separates grain from dirt: **`seed` is `frame`.** A fixed
 * seed gives you one static noise pattern welded to the lens, which the eye
 * reads as a dirty sensor within about half a second. Real grain resamples every
 * frame. This is the only per-frame value in the stack — everything else is a
 * constant, because a grade that animates is a look change, not a grade.
 *
 * Values are deliberately small. A grade you can see happening is a filter; a
 * grade you only notice when you turn it off is a grade.
 */

/** One stage of the stack. `at` is the output frame it switches on. */
type Stage = {
  readonly at: number;
  readonly name: string;
  readonly note: string;
};

type Props = {
  readonly src?: string;
  /** Frames between stages. */
  readonly step?: number;
  /** Show the stack list and the ungraded inset. */
  readonly showStack?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const STAGES: Stage[] = [
  {at: 0, name: 'source', note: 'straight off the card'},
  {at: 26, name: 'exposure', note: '+0.22 stops · before anything reads a pixel'},
  {at: 52, name: 'whiteBalance', note: 'temp −0.14 · tint +0.06'},
  {at: 78, name: 'levels', note: 'black 0.045 · white 0.97 · gamma 0.94'},
  {at: 104, name: 'shadowsHighlights', note: 'lift +0.18 · recover −0.16'},
  {at: 130, name: 'vibrance', note: '+0.28 — BEFORE saturation, so skin survives'},
  {at: 156, name: 'saturation', note: '×0.94 — pull the whole thing back'},
  {at: 182, name: 'tint', note: '#4cc9f0 at 0.08 — the look, and nothing more'},
  {at: 208, name: 'vignette', note: '0.26 · optical, so it comes after the colour'},
  {at: 234, name: 'noise', note: 'grain 0.06, seed = frame — last of all'},
];

export const FilmGrade: React.FC<Props> = ({
  src = staticFile('footage/interview-raw.mp4'),
  step = 26,
  showStack = true,
  accentColor = '#ff5c39',
  backgroundColor = '#04050a',
}) => {
  const frame = useCurrentFrame();

  // `disabled` is a first-class flag on every descriptor, which is what makes
  // building the stack up in order possible without rebuilding the array —
  // the pipeline stays the same length and the same order at every frame.
  const on = (i: number) => frame < STAGES[i]?.at;

  const stack = [
    exposure({stops: 0.22, disabled: on(1)}),
    whiteBalance({temperature: -0.14, tint: 0.06, disabled: on(2)}),
    levels({blackPoint: 0.045, whitePoint: 0.97, gamma: 0.94, disabled: on(3)}),
    shadowsHighlights({shadows: 0.18, highlights: -0.16, disabled: on(4)}),
    vibrance({amount: 0.28, disabled: on(5)}),
    saturation({amount: 0.94, disabled: on(6)}),
    tint({color: '#4cc9f0', amount: 0.08, disabled: on(7)}),
    vignette({amount: 0.26, radius: 0.85, feather: 0.5, disabled: on(8)}),
    // seed = frame. A constant seed is a dirty lens, not grain.
    noise({amount: 0.06, seed: frame, disabled: on(9)}),
  ];

  const activeIndex = STAGES.reduce((best, s, i) => (frame >= s.at ? i : best), 0);
  const justArrived = frame - STAGES[activeIndex].at;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill>
        {/* objectFit is a prop: <Video> decodes into a canvas. */}
        <Video src={src} objectFit="cover" muted effects={stack} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>

      {showStack ? (
        <>
          {/* The list needs contrast over whatever the picture is doing, and a
              full-frame dim would change the grade you came here to judge. */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              // 1100 wide, and the alpha is held high most of the way across:
              // the list box starts 784px in from the right, and at the old
              // 900/44% ramp that landed on about 13% — the parameter lines
              // disappeared wherever they crossed the bright backdrop.
              width: 1100,
              backgroundImage:
                'linear-gradient(to left, rgba(4,5,10,0.95) 0%, rgba(4,5,10,0.9) 50%, rgba(4,5,10,0.55) 78%, rgba(4,5,10,0) 100%)',
            }}
          />

          <Interactive.Div
            name="Stack"
            style={{
              position: 'absolute',
              right: 84,
              top: 96,
              width: 700,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: '#8d93a5',
                marginBottom: 8,
              }}
            >
              effects={'{['}
            </div>
            {STAGES.map((s, i) => {
              const live = frame >= s.at;
              const isActive = i === activeIndex;
              return (
                <div key={s.name} style={{opacity: live ? 1 : 0.3}}>
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: isActive ? accentColor : '#eef1f7',
                      // A 2px nudge on arrival. Enough to catch the eye, small
                      // enough that ten of them do not read as a bouncing list.
                      translate: `${isActive ? interpolate(justArrived, [0, 8], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0}px 0px`,
                    }}
                  >
                    {i === 0 ? s.name : `  ${s.name}(…)`}
                  </div>
                  <div style={{fontSize: 28, fontWeight: 500, color: '#8d93a5', marginTop: 3}}>
                    {s.note}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: '#8d93a5',
                marginTop: 8,
              }}
            >
              {']}'}
            </div>
          </Interactive.Div>

          {/* The ungraded source, kept on screen. A grade judged against memory
              is judged against nothing — after ninety seconds every grade looks
              correct, which is why colourists keep a reference up. */}
          <div
            style={{
              position: 'absolute',
              left: 84,
              bottom: 84,
              width: 480,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{position: 'relative', width: '100%', aspectRatio: '16 / 9'}}>
              <Video
                src={src}
                objectFit="cover"
                muted
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
              />
            </div>
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: 'rgba(4,5,10,0.86)',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: '#8d93a5',
              }}
            >
              UNGRADED
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 84,
              top: 96,
              fontSize: 34,
              fontWeight: 500,
              color: '#eef1f7',
              textShadow: '0 2px 14px rgba(4,5,10,0.95), 0 0 34px rgba(4,5,10,0.8)',
              maxWidth: 780,
            }}
          >
            <span style={{fontWeight: 800, letterSpacing: '0.16em', color: accentColor}}>
              ORDER IS THE GRADE
            </span>
            <br />
            {activeIndex + 1} of {STAGES.length} stages · the array runs top to bottom
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
