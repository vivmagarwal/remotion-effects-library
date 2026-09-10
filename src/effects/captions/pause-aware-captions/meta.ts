import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'pause-aware-captions', name: 'Pause-Aware Captions', category: 'captions',
  tagline: 'Documentary subtitles that break where the speaker breathes.',
  description:
    'Two-line subtitles built on @remotion/captions rather than on a hand-rolled pager, over the clip the transcript came from. Four things here are silent when you get them wrong. Three clocks live in the pipeline — Deepgram is seconds (noisy floats), @remotion/captions is milliseconds, Remotion is frames — so the conversion happens once, at each boundary. Caption.text must carry a LEADING SPACE, because createTikTokStyleCaptions starts a new page only when text.startsWith(" ") and concatenates tokens with no separator: feed it bare words and you get one page holding the whole transcript, run together, with no error. breakOnSilenceAfterMilliseconds is the pause-aware knob — any gap at least that long forces a page break, so in this clip the 480ms gap after "time." breaks the page and the 320ms one after "responsibility," does not. And a page\'s durationMs runs to the NEXT page, not to its own last word, so taken literally a page sits on screen through the silence that caused the break; each page gets its own last token\'s end plus holdFrames, clamped to never overlap its successor, which is what leaves a caption-free beat over the pause. Lines are broken by ensureMaxCharactersPerLine at 42 characters, two lines maximum. Legibility is structural rather than measured — you cannot compute a contrast ratio against a moving background, so the caption rides a blur-behind pill, the one option that holds over any footage without dimming the shot.',
  tags: ['captions', 'broadcast', 'overlay', 'footage', 'transcript', 'interview'],
  concepts: ['word-level timing', 'gap classification', 'half-open interval', 'safe area'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 400,
  packages: ['remotion', '@remotion/media', '@remotion/captions', '@remotion/google-fonts'],
  // 96 sits inside the two-line page — the one that proves the 42-character
  // break is doing something rather than being asserted in a comment.
  difficulty: 'advanced', checkFrame: 96, posterFrame: 96,
  requires: ['video', 'transcript'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
