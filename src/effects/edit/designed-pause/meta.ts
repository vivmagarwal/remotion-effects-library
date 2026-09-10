import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'designed-pause', name: 'Designed Pause', category: 'edit',
  tagline: 'A topic change gets a chosen hold instead of dead air.',
  description:
    'The other half of silence removal, and the half nobody builds: cutting dead air is mechanical, deciding where a piece should breathe is the edit. A pause here is placed by classification, sized by a budget and filled by design. Placed, because inter-word gaps are aligned to language rather than to amplitude — a breath under room tone is invisible to an RMS threshold and obvious as a 240ms hole in a transcript — so anything over sceneGapMs is a topic change and that is the only place a designed pause belongs; the classifier finds the one 3.36s gap in this clip rather than being told where it is. Sized, because the hold is the gap\'s own length scaled by holdRatio and clamped into [minHoldMs, maxHoldMs]: keeping the whole gap is not design, it is inaction, and half of it lands the topic change without the audience wondering whether the video froze. Filled, because past about 45 frames an empty hold is dead air with better branding — something has to be there, and the slow push on the beat card is what says the video has not frozen. The cut lands inside the gap and never on a word: marginMs keeps a fifth of a second of natural silence each side, since a word\'s start is where the vowel got loud enough to detect and not where the mouth began moving. And the keep-list is clamped against the source length, because ASR reports a last word at 53.18s for a file that is 53.00s long and the overrun renders as a held final frame with no error.',
  tags: ['editorial', 'footage', 'transcript', 'cut-list', 'explainer'],
  concepts: ['gap classification', 'pause budget', 'keep-list from word timings', 'trimBefore cut list'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 323,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 60, posterFrame: 160,
  requires: ['video', 'transcript'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
