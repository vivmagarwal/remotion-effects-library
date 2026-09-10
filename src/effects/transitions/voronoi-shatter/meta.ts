import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'voronoi-shatter', name: 'Voronoi Shatter', category: 'transitions',
  tagline: 'A solid plate fracturing into cells that tumble away.',
  description:
    'A Voronoi diagram assigns every point in the plane to its nearest seed, which fills the frame exactly with no gaps and no overlaps — that exactness is why it reads as breaking glass rather than a grid of tiles. d3-delaunay computes it, and there is a real footgun to know: new Delaunay(flatArray) ALIASES the array you hand it and writes back into it, so always use Delaunay.from(), which copies. Each shard is rotated with SVG rotate(angle, cx, cy) about its own polygon centroid, so it tumbles in place instead of swinging around the frame; distance from the centre drives both the stagger and the trajectory, so the crack races outward. Seeded with random(seed), so the same plate breaks the same way on every render tab.',
  tags: ['transition', 'd3', 'svg', 'impact'],
  concepts: ['d3-delaunay', 'deterministic layout', 'transformOrigin', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', 'd3-delaunay', 'd3-polygon', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 78, posterFrame: 62,
  ground: 'dark', audience: ['youtuber', 'agency'], driveMode: 'pure',
};
