import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {EffectDescriptor} from 'remotion';
import {duotone} from '@remotion/effects/duotone';
import {halftone} from '@remotion/effects/halftone';
import {scanlines} from '@remotion/effects/scanlines';
import {thermalVision} from '@remotion/effects/thermal-vision';
import {pixelate} from '@remotion/effects/pixelate';
import {emboss} from '@remotion/effects/emboss';
import {contourLines} from '@remotion/effects/contour-lines';
import {dotGrid} from '@remotion/effects/dot-grid';
import {venetianBlinds} from '@remotion/effects/venetian-blinds';
import {chromaticAberration} from '@remotion/effects/chromatic-aberration';
import {fisheye} from '@remotion/effects/fisheye';
import {mirror} from '@remotion/effects/mirror';
import {speckle} from '@remotion/effects/speckle';
import {vignette} from '@remotion/effects/vignette';
import {invert} from '@remotion/effects/invert';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Effects Catalogue
 * A contact sheet of @remotion/effects — the same plate through fifteen
 * different effects, each labelled with the call that produced it. The package
 * ships 71 of these and almost nothing documents them visually, so this is a
 * reference first and a piece of motion second.
 */

type Tile = {readonly name: string; readonly call: string; readonly effect: EffectDescriptor<unknown>};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly ink: string;
  readonly text: string;
  readonly bg: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  ink: '#ffffff',
  text: fontFamily,
  bg: '#0a0b10',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  readonly title?: string;
  readonly columns?: number;
  /** Frames between one tile arriving and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  /** Frames each tile is spotlit for during the sweep. */
  readonly spotFrames?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

export const EffectsCatalogue: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src,
  title = '@remotion/effects',
  columns = 5,
  stagger = 4,
  startAt = 14,
  spotFrames = 16,
  accentColor = theme.series[2],
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const source = src ?? staticFile('plate-1.svg');

  // Fifteen visually distinct effects. Every one takes a params object — none
  // of them are zero-argument — and the ranges differ per effect, so check each
  // one's own .d.ts rather than assuming a shared convention.
  const tiles: Tile[] = [
    {name: 'duotone', call: "duotone({darkColor, lightColor})", effect: duotone({darkColor: '#04050a', lightColor: '#ff5c39', threshold: 0.4})},
    {name: 'halftone', call: 'halftone({dotSize, rotation})', effect: halftone({dotSize: 11, dotSpacing: 11, rotation: 22, colorMode: 'source'})},
    {name: 'scanlines', call: 'scanlines({amount, spacing})', effect: scanlines({amount: 0.5, spacing: 5, thickness: 2})},
    {name: 'thermalVision', call: 'thermalVision({})', effect: thermalVision({})},
    {name: 'pixelate', call: 'pixelate({blockSize})', effect: pixelate({blockSize: 16})},
    {name: 'emboss', call: 'emboss({})', effect: emboss({})},
    {name: 'contourLines', call: 'contourLines({})', effect: contourLines({})},
    {name: 'dotGrid', call: 'dotGrid({dotSize, gridSize})', effect: dotGrid({dotSize: 9, gridSize: 13})},
    {name: 'venetianBlinds', call: 'venetianBlinds({})', effect: venetianBlinds({})},
    {name: 'chromaticAberration', call: 'chromaticAberration({amount})', effect: chromaticAberration({amount: 14})},
    {name: 'fisheye', call: 'fisheye({})', effect: fisheye({})},
    {name: 'mirror', call: 'mirror({})', effect: mirror({})},
    {name: 'speckle', call: 'speckle({})', effect: speckle({})},
    {name: 'vignette', call: 'vignette({amount, radius})', effect: vignette({amount: 0.85, radius: 0.55})},
    {name: 'invert', call: 'invert({})', effect: invert({})},
  ];

  const rows = Math.ceil(tiles.length / columns);
  const PAD = 64;
  const HEAD = 150;
  const GAP = 16;
  const cellW = (width - PAD * 2 - GAP * (columns - 1)) / columns;
  const cellH = (height - HEAD - PAD - 88 - GAP * (rows - 1)) / rows;

  // A spotlight walks the grid once every tile has landed.
  const sweepStart = startAt + tiles.length * stagger + 26;
  const spotIndex =
    frame < sweepStart ? -1 : Math.floor((frame - sweepStart) / spotFrames) % tiles.length;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: PAD,
          top: 62,
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: theme.ink,
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Count"
        style={{
          position: 'absolute',
          right: PAD,
          top: 70,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          color: accentColor,
          opacity: interpolate(frame, [4, 22], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        15 of 71 shown
      </Interactive.Div>

      {tiles.map((tile, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = PAD + col * (cellW + GAP);
        const y = HEAD + row * (cellH + GAP);

        const p = interpolate(frame, [startAt + i * stagger, startAt + i * stagger + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        if (p <= 0) return null;

        const lit = i === spotIndex;

        return (
          <Interactive.Div
            key={tile.name}
            name={tile.name}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellW,
              height: cellH,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: '#04050a',
              border: `2px solid ${lit ? accentColor : 'rgba(255,255,255,0.12)'}`,
              // The lit tile lifts slightly out of the sheet.
              scale: (0.9 + p * 0.1) * (lit ? 1.05 : 1),
              opacity: p * (spotIndex === -1 || lit ? 1 : 0.55),
              zIndex: lit ? 5 : 1,
              boxShadow: lit ? `0 18px 50px rgba(0,0,0,0.6)` : undefined,
            }}
          >
            {/* One effect per tile, applied to the same source plate. */}
            <CanvasImage
              src={source}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              effects={[tile.effect]}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '26px 12px 9px',
                backgroundImage: 'linear-gradient(transparent, rgba(4,5,9,0.9))',
                fontSize: 20,
                fontWeight: 700,
                color: lit ? accentColor : '#eef1f7',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tile.name}
            </div>
          </Interactive.Div>
        );
      })}

      {/* The lit tile's exact call, spelled out. */}
      <Interactive.Div
        name="Call"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 44,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 28,
          color: accentColor,
          opacity: spotIndex >= 0 ? 1 : 0,
        }}
      >
        {spotIndex >= 0 ? tiles[spotIndex].call : ''}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
