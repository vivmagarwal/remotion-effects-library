import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'headline-highlight', name: 'Headline Highlight', category: 'type',
  tagline: 'A marker sweeps across the phrases that matter in a news headline.',
  description:
    'Needs no extra package — remotion and a webfont, nothing else — which is the whole reason to reach for this over Hand Annotations, whose six mark types cost you @remotion/rough-notation. A newspaper-style article page (kicker, serif headline, byline, timestamp) where a yellow marker sweeps across the key phrases one after another, as if someone were reading with a highlighter. The stroke is an absolutely positioned block behind each phrase whose width animates from 0% to 112%; putting it behind the text rather than as a background on the text itself keeps the letters crisp black instead of tinting them, which is what makes it read as a real highlighter rather than a selection. Strokes are indexed so they fire in sequence, and 112% is deliberate: a marker that stops exactly on the last glyph reads as a rectangle, and one that overshoots reads as a hand.',
  tags: ['highlight', 'editorial', 'text', 'annotation'],
  concepts: ['staggered entrance', 'paint order', 'multi-keyframe interpolate'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 40,
  ground: 'light', audience: ['youtuber', 'educator', 'agency'],
  credit: {
    label: 'Idea from “News article headline highlight” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
