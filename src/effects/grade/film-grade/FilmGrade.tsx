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

/**
 * One stage of the stack. When it switches on is `index * step`, not a number
 * stored here — the stages were written with their frames hard-coded at
 * multiples of 26 and a `step` prop that changed nothing, which is worse than
 * having no prop at all: the brief documented it and the props table listed it.
 */
type Stage = {
  readonly name: string;
  readonly note: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly mono: string;
  readonly body: string;
  readonly muted: string;
  readonly text: string;
  readonly accent: string;
  readonly bgDeep: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  body: '#eef1f7',
  muted: '#8d93a5',
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
  /** Frames between stages. */
  readonly step?: number;
  /** Show the stack list and the ungraded inset. */
  readonly showStack?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

const STAGES: Stage[] = [
  {name: 'source', note: 'straight off the card'},
  {name: 'exposure', note: '+0.22 stops · before anything reads a pixel'},
  {name: 'whiteBalance', note: 'temp −0.14 · tint +0.06'},
  {name: 'levels', note: 'black 0.045 · white 0.97 · gamma 0.94'},
  {name: 'shadowsHighlights', note: 'lift +0.18 · recover −0.16'},
  {name: 'vibrance', note: '+0.28 — BEFORE saturation, so skin survives'},
  {name: 'saturation', note: '×0.94 — pull the whole thing back'},
  {name: 'tint', note: '#4cc9f0 at 0.08 — the look, and nothing more'},
  {name: 'vignette', note: '0.26 · optical, so it comes after the colour'},
  {name: 'noise', note: 'grain 0.06, seed = frame — last of all'},
];

export const FilmGrade: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src = staticFile('footage/interview-raw.mp4'),
  step = 26,
  showStack = true,
  accentColor = theme.accent,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();

  // `disabled` is a first-class flag on every descriptor, which is what makes
  // building the stack up in order possible without rebuilding the array —
  // the pipeline stays the same length and the same order at every frame.
  const at = (i: number) => i * step;
  const on = (i: number) => frame < at(i);

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

  const activeIndex = STAGES.reduce((best, _s, i) => (frame >= at(i) ? i : best), 0);
  const justArrived = frame - at(activeIndex);

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
                color: theme.muted,
                marginBottom: 8,
              }}
            >
              effects={'{['}
            </div>
            {STAGES.map((s, i) => {
              const live = frame >= at(i);
              const isActive = i === activeIndex;
              return (
                <div key={s.name} style={{opacity: live ? 1 : 0.3}}>
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 700,
                      fontFamily: theme.mono,
                      color: isActive ? accentColor : '#eef1f7',
                      // A 2px nudge on arrival. Enough to catch the eye, small
                      // enough that ten of them do not read as a bouncing list.
                      translate: `${isActive ? interpolate(justArrived, [0, 8], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0}px 0px`,
                    }}
                  >
                    {i === 0 ? s.name : `  ${s.name}(…)`}
                  </div>
                  <div style={{fontSize: 28, fontWeight: 500, color: theme.muted, marginTop: 3}}>
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
                color: theme.muted,
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
                color: theme.muted,
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
              color: theme.body,
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
