import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'light-leak-transition', name: 'Light Leak Transition', category: 'transitions',
  tagline: 'A film light leak washes over the cut without shortening the timeline.',
  description:
    'Three shots joined by film-style light leaks, built with <TransitionSeries.Overlay> rather than <TransitionSeries.Transition>. That distinction is the whole lesson: a Transition plays two scenes simultaneously and shortens the composition, while an Overlay renders on top of the cut point and leaves the timeline length untouched — which is exactly what a light leak is, an artefact of the film rather than a way of getting from one shot to the next. The leak is the lightLeak() effect applied to a <Solid>, with progress driven 0→1 across the overlay — and the Solid reads durationInFrames from useVideoConfig() rather than taking it as a prop, because inside a Sequence that value is the SEQUENCE\'s length, so the same component adapts to any overlay length with no arithmetic. The shots are yours: pass {src, title, caption} for your own clips, or leave src out of one and it draws a typographic card.',
  tags: ['transition', 'retro', 'colour', 'overlay', 'shader', 'footage'],
  concepts: ['TransitionSeries', 'effects array ordering', 'timeline length semantics'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 210,
  packages: ['remotion', '@remotion/media', '@remotion/transitions', '@remotion/effects', '@remotion/google-fonts'],
  // 134 is the leak entering rather than at its peak: the Earth still reads
  // through the bloom, which is what separates a light leak from an orange card.
  difficulty: 'intermediate', checkFrame: 82, posterFrame: 134,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
