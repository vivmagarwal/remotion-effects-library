import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'extruded-text',
  name: 'Extruded Text',
  category: 'three-d',
  tagline: 'Solid 3D type from forty stacked copies of one word.',
  description:
    'Real depth without a 3D library: the word is rendered forty times, each pushed back a few pixels on translateZ inside a preserve-3d parent. Because the copies are actual nodes in the 3D space they rotate correctly with the word — a text-shadow stack is painted flat in screen space and stays flat however you turn it, which is why the shadow trick collapses the moment anything moves. Layers are drawn back to front so the face paints last and stays crisp, and shaded along their length so the extrusion has form.',
  tags: ['3d', 'text', 'extrude', 'type', 'depth', 'css', 'title', 'preserve-3d'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 210,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 40,
  posterFrame: 120,
  concepts: ['translateZ stacking', 'preserve-3d', 'paint order', 'mirrored reflection'],
};
