import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'headline-highlight',
  name: 'Headline Highlight',
  category: 'text',
  tagline: 'A marker sweeps across the phrases that matter in a news headline.',
  description:
    'A newspaper-style article page — kicker, serif headline, byline, timestamp — where a yellow marker sweeps across the key phrases one after another, as if someone were reading with a highlighter. The stroke is an absolutely positioned block behind each phrase whose width animates from 0% to 112%; putting it behind the text (rather than using a background on the text itself) keeps the letters crisp black instead of tinting them, which is what makes it read as a real highlighter.',
  tags: ['text', 'highlight', 'marker', 'news', 'article', 'editorial', 'annotation'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 40,
  concepts: ['layered z-index', 'sequential strokes', 'percentage width interpolation', 'editorial layout'],
  credit: {
    label: 'Idea from “News article headline highlight” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
