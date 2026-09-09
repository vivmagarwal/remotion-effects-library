import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'vhs-vintage',
  name: 'VHS / Vintage Tape',
  category: 'effects',
  tagline: 'Five stacked WebGL effects turn clean source into 1987 videotape.',
  description:
    'Barrel distortion, chromatic aberration, scrolling scanlines, per-frame grain and a vignette, applied as one effects array on a <CanvasImage>. The order is the point: the barrel bends the picture like a CRT tube first, so the scanlines laid on afterwards stay straight — reverse it and the scanlines curve too, which no real tube does. A seeded "bad frame" every so often spikes the aberration and shifts the picture sideways, and a head-switching noise band drifts up the frame. Swap the source for a <Video> to grade real footage.',
  tags: ['effects', 'vhs', 'retro', 'vintage', 'crt', 'scanlines', 'grain', 'analog', 'webgl'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 70,
  concepts: ['effects array ordering', 'WebGL effects', 'seeded glitch frames', 'animated effect params'],
};
