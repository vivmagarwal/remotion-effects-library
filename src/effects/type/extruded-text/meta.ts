import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'extruded-text', name: 'Extruded Text', category: 'type',
  tagline: 'Solid 3D type from forty stacked copies of one word.',
  description:
    'Real depth without a 3D library: the word is rendered forty times, each pushed back a few pixels on translateZ inside a preserve-3d parent. Because the copies are actual nodes in the 3D space they rotate correctly with the word — a text-shadow stack is painted flat in screen space and stays flat however you turn it, which is why the shadow trick collapses the moment anything moves. Layers are drawn back to front so the face paints last and stays crisp, and shaded along their length so the extrusion has form. It swings rather than spins: turning far enough to show the side and coming back keeps the face readable for most of the shot, where a full rotation spends half of it presenting the back of the word to the viewer.',
  tags: ['text', 'title', 'css', 'perspective'],
  concepts: ['preserve-3d', 'paint order', 'mirrored reflection'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 210,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 40, posterFrame: 120,
  ground: 'dark', audience: ['agency', 'youtuber'],
};
