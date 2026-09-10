import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'handheld-drift', name: 'Handheld Drift', category: 'edit',
  tagline: 'A locked-off shot given a human operator, in four named presets.',
  description:
    'Perlin drift on real footage, with the four details that separate handheld from a wobble. Noise rather than a sine, because a sine is periodic and the eye locks onto the period within two cycles — after which the shot reads as oscillating. Two octaves at 3:1 with the second at 30 %, because one is too smooth to be a person and three is mush. A different seed per axis, because noise2D(seed, t, 0) and noise2D(seed, 0, t) on the same seed are correlated and give diagonal motion. And rotation evaluated at frame − 4, because a real operator’s wrist turns after their arm moves; that one subtraction is what sells it. The overscan is computed from the amplitude rather than guessed, with headroom for the rotation, which throws the corners further than the centre. The debug layer plots both noise curves so the lag is visible instead of asserted, and ships a seasick preset as the counter-example.',
  tags: ['footage', 'handheld', 'camera', 'interview', 'cinematic'],
  concepts: ['two-octave noise', 'lagged rotation', 'overscan', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion', '@remotion/media', '@remotion/noise', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 150, posterFrame: 150,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency', 'educator'],
  variants: [
    {id: 'tripod', name: 'Handheld — Tripod', tagline: 'A locked-off shot that is not quite dead: ±3px.', props: {preset: 'tripod'}},
    {id: 'walking', name: 'Handheld — Walking', tagline: 'Walking handheld at ±26px, with scale breathing.', props: {preset: 'walking'}},
    {id: 'seasick', name: 'Handheld — Seasick', tagline: 'The counter-example: past ±40px it stops being a camera.', props: {preset: 'seasick'}},
  ],
};
