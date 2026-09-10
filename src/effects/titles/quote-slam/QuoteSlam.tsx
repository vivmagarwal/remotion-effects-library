import {AbsoluteFill, Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: serif} = loadSerif('normal', {weights: ['500', '700'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Quote Slam
 * A pull quote that lands rather than fades. Three things sell the impact and
 * they all have to happen on the same frame: the line snaps in on an
 * overshooting spring, the whole frame kicks a couple of pixels in the opposite
 * direction, and a flash blooms behind it. Remove any one and it reads as a
 * regular fade-in.
 */

type Props = {
  readonly quote?: string;
  readonly author?: string;
  readonly role?: string;
  /** Frames between one line landing and the next. */
  readonly lineStagger?: number;
  readonly startAt?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly fontSize?: number;
};

export const QuoteSlam: React.FC<Props> = ({
  quote = 'We stopped\nrendering videos\nand started\nprogramming them.',
  author = 'Jonny Burger',
  role = 'Creator of Remotion',
  lineStagger = 7,
  startAt = 12,
  accentColor = '#ff5c39',
  backgroundColor = '#0a0b10',
  textColor = '#ffffff',
  fontSize = 104,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  // Splitting on \n keeps the line breaks a typographic decision rather than
  // something that shifts with the viewport.
  const lines = quote.split('\n');

  /** Landing progress of a single line, 0 → 1 with overshoot. */
  const landing = (i: number) =>
    spring({
      frame: frame - (startAt + i * lineStagger),
      fps,
      config: {damping: 12, stiffness: 200, mass: 0.8},
    });

  // The camera kicks on every landing, hardest on the last line. Summing the
  // impulses means overlapping landings compound instead of cancelling.
  const kick = lines.reduce((acc, _, i) => {
    const hit = frame - (startAt + i * lineStagger);
    if (hit < 0) return acc;
    // A short decaying impulse: sharp at the moment of contact, gone in ~10 frames.
    const impulse = Math.exp(-hit / 3.5) * Math.sin(hit * 0.9) * (6 + i * 2.5);
    return acc + impulse;
  }, 0);

  const lastLanding = startAt + (lines.length - 1) * lineStagger;

  // The flash is the third element. It peaks exactly as the final line lands.
  // Peaks at +7, where the spring's own overshoot peaks (pi / omega_d works out
  // to ~6.8 frames after landing for this spring config). Peaking at contact
  // instead puts the flash before the thing it is meant to punctuate.
  const flash = interpolate(frame, [lastLanding + 1, lastLanding + 7, lastLanding + 24], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ruleWidth = interpolate(frame, [lastLanding + 10, lastLanding + 30], [0, 148], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      {/* The kick moves the whole frame, so the quote and its background stay
          locked together — moving only the text reads as a wobble, not a hit. */}
      <AbsoluteFill style={{translate: `0px ${-kick * 1.15}px`}}>
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 46%, ${accentColor}1c 0%, transparent 64%)`,
          }}
        />

        <AbsoluteFill
          style={{
            justifyContent: 'center',
            padding: '0 132px',
            fontFamily: serif,
          }}
        >
          {/* An oversized quote mark, set flush against the first line. */}
          <Interactive.Div
            name="QuoteMark"
            style={{
              position: 'absolute',
              left: 74,
              top: 118,
              fontSize: 300,
              lineHeight: 1,
              fontWeight: 700,
              color: accentColor,
              opacity: interpolate(frame, [0, 18], [0.08, 0.22], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            &ldquo;
          </Interactive.Div>

          {lines.map((line, i) => {
            const p = landing(i);
            const waiting = p <= 0.001;
            return (
              <Interactive.Div
                key={i}
                name={`Line ${i + 1}`}
                style={{
                  fontSize,
                  // 1.12 rather than 1: a serif at this size has descenders that
                  // a line-height of 1 clips against the next line.
                  lineHeight: 1.12,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: textColor,
                  // The spring peaks at p ~= 1.18, so this tops out around 1.026
                  // — a 2.6% overshoot. Small on purpose: at this size anything
                  // larger reads as a bounce rather than an impact.
                  scale: 0.86 + p * 0.14,
                  translate: `${(1 - p) * -26}px 0px`,
                  opacity: Math.min(1, p * 2.2),
                  transformOrigin: 'left center',
                  // hidden, NOT unmounted. Removing the element frees its box,
                  // the centred column re-centres, and every line that has
                  // already landed jumps upward — a reflow far bigger than the
                  // kick this effect exists to show.
                  visibility: waiting ? 'hidden' : 'visible',
                }}
              >
                {line}
              </Interactive.Div>
            );
          })}

          {/* The whole row fades as one — rule included. Fading only the text
              leaves an orange dash sitting beside a ghost. */}
          <Interactive.Div
            name="Attribution"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              marginTop: 46,
              fontFamily: sans,
              opacity: interpolate(frame, [lastLanding + 10, lastLanding + 30], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* flexShrink: 0 — an animated width in a flex row is compressible,
                and a longer author name would squeeze it. */}
            <div style={{width: ruleWidth, height: 3, flexShrink: 0, backgroundColor: accentColor}} />
            <div>
              <div style={{fontSize: 34, fontWeight: 700, color: textColor}}>{author}</div>
              <div style={{fontSize: 26, fontWeight: 500, color: '#8d93a5', marginTop: 4}}>{role}</div>
            </div>
          </Interactive.Div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Flash sits above everything, including the kick, so it does not move. */}
      <AbsoluteFill
        style={{backgroundColor: '#ffffff', opacity: flash, mixBlendMode: 'overlay', pointerEvents: 'none'}}
      />
    </AbsoluteFill>
  );
};
