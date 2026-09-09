import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {halftone} from '@remotion/effects/halftone';
import {duotone} from '@remotion/effects/duotone';
import {loadFont} from '@remotion/google-fonts/ArchivoBlack';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Halftone Print
 * A newsprint / risograph look: the image is flattened to two inks, then broken
 * into a dot screen. The dot size animates from coarse to fine, so the picture
 * appears to resolve — which is far more interesting than a static screen.
 */

type Props = {
  readonly src?: string;
  readonly headline?: string;
  readonly kicker?: string;
  readonly inkDark?: string;
  readonly inkLight?: string;
  readonly paperColor?: string;
  readonly angle?: number;
};

export const HalftonePrint: React.FC<Props> = ({
  src,
  headline = 'PRINTED',
  kicker = 'halftone + duotone',
  inkDark = '#12123a',
  inkLight = '#ff4d6d',
  paperColor = '#f6f1e4',
  angle = 25,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Coarse to fine: the picture resolves as the screen gets finer.
  const dot = interpolate(frame, [0, 2.6 * fps], [34, 9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: paperColor, overflow: 'hidden'}}>
      {/* Full-frame plate. */}
      <CanvasImage
        src={src ?? staticFile('sample-scene.svg')}
        style={{width: '100%', height: '100%'}}
        effects={[
          // Flatten to two inks first, so the screen only has to break up two tones.
          duotone({darkColor: inkDark, lightColor: inkLight, threshold: 0.34}),
          halftone({
            dotSize: dot,
            dotSpacing: dot,
            rotation: angle,
            shape: 'circle',
            colorMode: 'source',
          }),
        ]}
      />

      {/* Paper texture over the ink. */}
      <AbsoluteFill
        style={{
          mixBlendMode: 'multiply',
          opacity: 0.3,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23p)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      {/* A solid paper band across the bottom third. Set over the ink the headline
          disappears into the screen; on clean paper it reads, and it is how a real
          two-colour poster is laid out. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          backgroundColor: paperColor,
        }}
      />

      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 96px 70px', fontFamily}}>
        <Interactive.Div
          name="Kicker"
          style={{
            fontSize: 30,
            letterSpacing: '0.42em',
            color: inkDark,
            marginBottom: 14,
            opacity: interpolate(frame, [1.4 * fps, 2 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {kicker.toUpperCase()}
        </Interactive.Div>
        <Interactive.Div
          name="Headline"
          style={{
            fontSize: 196,
            lineHeight: 0.9,
            letterSpacing: '-0.035em',
            color: inkDark,
            // Slightly misregistered second ink — the printing-press tell.
            textShadow: `9px 7px 0 ${inkLight}`,
            translate: interpolate(frame, [0.6 * fps, 1.6 * fps], ['0px 60px', '0px 0px'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {headline}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
