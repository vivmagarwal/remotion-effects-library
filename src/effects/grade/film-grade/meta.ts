import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'film-grade', name: 'Film Grade', category: 'grade',
  tagline: 'A nine-stage grade assembling itself, with the source beside it.',
  description:
    'The effects array is an ordered pipeline and the order IS the grade — which is exactly what a parameter panel hides. Three consequences, in the order they bite. Exposure and white balance go first, before anything reads a pixel value: set the black point before the exposure and you have clipped the toe of a picture that was under by a quarter stop, and no later stage gets it back, because the information is gone rather than compressed. vibrance goes before saturation, because vibrance is a non-linear lift that protects already-saturated colours — on a face that means it protects skin — and saturating first leaves it nothing to protect, which is the orange face that marks an amateur grade. Vignette and grain go last, and grain last of all: a vignette is optical rather than colour, so before white balance the corners get tinted with the picture, and grain sits ON the image, so before a contrast stage the contrast crushes it into blotches. The detail that separates grain from dirt is that seed is the frame — a constant seed welds one noise pattern to the lens and the eye reads it as a dirty sensor within half a second. It is the only per-frame value in the stack, because a grade that animates is a look change rather than a grade. Every stage carries a disabled flag rather than being spliced in, so the pipeline is the same length and the same order at every frame, and the ungraded source stays on screen throughout — a grade judged against memory is judged against nothing.',
  tags: ['grade', 'footage', 'colour', 'grain', 'vignette', 'interview', 'explainer'],
  concepts: ['effects array grade', 'effects array ordering', 'seeded per-frame grain'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 300,
  packages: ['remotion', '@remotion/media', '@remotion/effects', '@remotion/google-fonts'],
  // 270 is past the last stage: the full stack is on and the list is fully lit,
  // which is the only frame that shows the whole argument at once.
  difficulty: 'advanced', checkFrame: 140, posterFrame: 270,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
