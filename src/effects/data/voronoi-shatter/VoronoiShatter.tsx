import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Delaunay} from 'd3-delaunay';
import {polygonCentroid} from 'd3-polygon';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin']});

/**
 * Voronoi Shatter
 * A solid plate fracturing into cells that fly apart, revealing what is behind
 * it. The tessellation is a Voronoi diagram: given a set of seed points, every
 * cell is the region closer to its seed than to any other. It fills the plane
 * exactly with no gaps and no overlaps, which is why it reads as breaking glass
 * rather than a grid of tiles.
 */

type Props = {
  readonly word?: string;
  readonly caption?: string;
  /** Number of shards. */
  readonly count?: number;
  readonly holdFrames?: number;
  readonly shatterFrames?: number;
  /** How far the shards travel, as a multiple of their distance from centre. */
  readonly push?: number;
  readonly plateColorA?: string;
  readonly plateColorB?: string;
  readonly backgroundColor?: string;
  readonly accentColor?: string;
};

/** Straight RGB blend of two #rrggbb strings. Kept in JS rather than using CSS
 *  color-mix(), so the component has no dependency on the renderer's CSS support. */
const mixHex = (a: string, b: string, t: number): string => {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
    .toString(16)
    .padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};

export const VoronoiShatter: React.FC<Props> = ({
  word = 'BREAK',
  caption = 'Delaunay.from(points).voronoi(bounds)',
  count = 150,
  holdFrames = 34,
  shatterFrames = 92,
  push = 1.5,
  plateColorA = '#ff5c39',
  plateColorB = '#7c2bd6',
  backgroundColor = '#07080f',
  accentColor = '#f4f6fb',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const cells = useMemo(() => {
    // Seeded, so the same plate breaks the same way on every render tab.
    const points: [number, number][] = new Array(count).fill(0).map((_, i) => [
      random(`vx-${i}`) * width,
      random(`vy-${i}`) * height,
    ]);

    // Delaunay.from() copies the input. `new Delaunay(flatArray)` ALIASES the
    // array you hand it and writes back into it — a real footgun if you reuse
    // the source data anywhere else.
    const voronoi = Delaunay.from(points).voronoi([0, 0, width, height]);

    return points
      .map((_, i) => {
        const polygon = voronoi.cellPolygon(i) as [number, number][] | null;
        if (!polygon || polygon.length < 3) return null;
        const [cxCell, cyCell] = polygonCentroid(polygon);

        // Direction and distance from the frame centre drive both the stagger
        // and the trajectory, so the plate breaks outward from the middle.
        const dx = cxCell - width / 2;
        const dy = cyCell - height / 2;
        const dist = Math.hypot(dx, dy);
        const maxDist = Math.hypot(width / 2, height / 2);

        return {
          i,
          d: `M${polygon.map((pt) => `${pt[0].toFixed(2)},${pt[1].toFixed(2)}`).join('L')}Z`,
          cx: cxCell,
          cy: cyCell,
          dx,
          dy,
          near: dist / maxDist,
          // A per-shard tumble, seeded so it never changes between frames.
          spin: (random(`vr-${i}`) - 0.5) * 150,
          // Two-axis colour ramp: the intact plate reads as one gradient.
          mix: (cxCell / width) * 0.6 + (cyCell / height) * 0.4,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [count, width, height]);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden', fontFamily}}>
      {/* What the shards are hiding. */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Interactive.Div
          name="Reveal"
          style={{
            fontSize: 260,
            fontWeight: 900,
            letterSpacing: '-0.045em',
            color: accentColor,
            opacity: interpolate(frame, [holdFrames + 12, holdFrames + 52], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {word}
        </Interactive.Div>
      </AbsoluteFill>

      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {cells.map((c) => {
          // Shards near the centre go first; the crack races outward.
          const begin = holdFrames + c.near * 26;
          const p = interpolate(frame, [begin, begin + shatterFrames], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.34, 0, 0.32, 1),
          });

          const tx = c.dx * push * p;
          const ty = c.dy * push * p + p * p * 220; // a little gravity on the way out
          const rot = c.spin * p;

          return (
            <path
              key={c.i}
              d={c.d}
              // rotate(a, cx, cy) turns the shard about its OWN centroid, which
              // is what makes it tumble rather than swing around the frame.
              transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} ${c.cx.toFixed(2)} ${c.cy.toFixed(2)})`}
              fill={mixHex(plateColorA, plateColorB, c.mix)}
              style={{
                opacity: interpolate(p, [0.55, 1], [1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
              stroke="#07080f"
              strokeWidth={1.4}
            />
          );
        })}
      </svg>

      <Interactive.Div
        name="Caption"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 104,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          color: '#aab3c6',
          opacity: interpolate(
            frame,
            [holdFrames + 30, holdFrames + 60],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
          ),
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
