import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'light-leak-transition', name: 'Light Leak Transition', category: 'transitions',
  tagline: 'A film light leak washes over the cut without shortening the timeline.',
  description:
    'Three shots joined by film-style light leaks, built with <TransitionSeries.Overlay> rather than <TransitionSeries.Transition>. That distinction is the whole lesson: a Transition plays two scenes simultaneously and shortens the composition, while an Overlay renders on top of the cut point and leaves the timeline length untouched — which is exactly what a light leak is, an artefact of the film rather than a way of getting from one shot to the next. The leak is the lightLeak() effect applied to a <Solid>, with progress driven 0→1 across the overlay.',
  tags: ['transition', 'retro', 'colour', 'overlay', 'shader'],
  concepts: ['TransitionSeries', 'effects array ordering', 'timeline length semantics'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 210,
  packages: ['remotion', '@remotion/transitions', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 82,
  ground: 'dark', audience: ['youtuber', 'agency'],
};
