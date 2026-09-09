import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'parallax-layers',
  name: 'Parallax Layers',
  category: 'motion',
  tagline: 'A camera tracks across layered ridges that separate by depth.',
  description:
    'Five silhouette ridges cut with clip-path polygons, moving at rates proportional to their depth. There is exactly one camera value in the component and every layer reads from it — travel is depth times camera, and blur, scale and haze are all derived from the same depth number, so a layer can never look near in one respect and far in another. The sun and stars sit at depth 0 and never move; the title sits at depth 0.55 — separated from the nearest ridge, but not so far forward that it pans out of frame.',
  tags: ['motion', 'parallax', 'depth', 'landscape', 'camera', 'layers', 'clip-path', 'scenery'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 210,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 130,
  concepts: ['depth-proportional travel', 'clip-path silhouettes', 'derived atmospherics', 'single camera value'],
};
