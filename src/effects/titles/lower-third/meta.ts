import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'lower-third', name: 'Lower Third', category: 'titles',
  tagline: 'A slanted plate unrolls out of an accent bar, then retracts the same way.',
  description:
    'The broadcast name plate. One open value from 0 to 1 drives every layer — the bar scales up on y, the plate unrolls on x out of the bar, the text slides out from behind it — and the exit simply runs that value back to 0, so the retract is the entrance in reverse rather than a fade. The assembly is skewed as a whole and the type counter-skewed inside it, which keeps the slant on the plate without italicising the words. The bar leads, the plate follows it out, the text follows the plate — one value, three delays — so the retract reverses the order for free instead of needing a second choreography. Set transparent to render it as a WebM or ProRes overlay to key over real footage.',
  tags: ['lower-third', 'broadcast', 'overlay', 'title', 'text'],
  concepts: ['single driver value', 'programmable in/out', 'skew + counter-skew'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 140,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 16, posterFrame: 60,
  ground: 'transparent', audience: ['youtuber', 'podcaster', 'agency'],
};
