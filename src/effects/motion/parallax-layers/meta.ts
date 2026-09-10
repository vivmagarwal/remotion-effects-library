import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'parallax-layers', name: 'Parallax Layers', category: 'motion',
  tagline: 'A camera tracks across layered ridges that separate by depth.',
  description:
    'Five silhouette ridges cut with clip-path polygons, moving at rates proportional to their depth. There is exactly one camera value in the component and every layer reads from it — travel is depth times camera, and blur, scale and haze are all derived from the same depth number, so a layer can never look near in one respect and far in another. The sun and stars sit at depth 0 and never move; the title sits at depth 0.55 — separated from the nearest ridge, but not so far forward that it pans out of frame. Every ridge is drawn oversized, so however far the camera tracks it never exposes an edge — the cheapest possible fix, and the one most parallax rigs discover only after the first render.',
  tags: ['parallax', 'camera', 'background', 'perspective'],
  concepts: ['depth-derived layout', 'derived atmospherics', 'single driver value'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 210,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 130,
  ground: 'dark', audience: ['youtuber', 'educator'],
};
