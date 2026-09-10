import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'vhs-vintage', name: 'VHS / Vintage Tape', category: 'looks',
  tagline: 'Five stacked WebGL effects turn clean source into 1987 videotape.',
  description:
    'Barrel distortion, chromatic aberration, scrolling scanlines, per-frame grain and a vignette, applied as one effects array on a <CanvasImage>. The order is the point: the barrel bends the picture like a CRT tube first, so the scanlines laid on afterwards stay straight — reverse it and the scanlines curve too, which no real tube does. A seeded "bad frame" every so often spikes the aberration and shifts the picture sideways, and a head-switching noise band drifts up the frame. Bad frames are seeded per frame index rather than drawn at random, so the tape misbehaves identically on every render tab — an unseeded wobble makes each parallel-rendered frame disagree with its neighbours and the whole clip boils. Needs the ANGLE renderer.',
  tags: ['retro', 'glitch', 'colour', 'shader', 'footage'],
  concepts: ['effects array ordering', 'animated effect params', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/media', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 70,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
