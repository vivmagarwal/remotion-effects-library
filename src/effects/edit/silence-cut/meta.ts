import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'silence-cut', name: 'Silence Cut', category: 'edit',
  tagline: 'Dead air removed from a talking head, computed from word timings.',
  description:
    'A cut list derived from a real Deepgram nova-3 response rather than from an audio threshold, then played as a <Series> of trimmed <Video> ranges. Working from the transcript is what makes it reliable: an amplitude gate cannot tell a breath from a room and it cuts on a cough, whereas the gaps BETWEEN words are unambiguous and come free with any word-level ASR. Three thresholds decide everything — a 350ms gate, because below about 300ms you start removing the beats between clauses and the speaker turns into a machine gun; a 200ms margin either side, because a word start is where the vowel got loud enough to detect and cutting exactly there clips the consonant attack; and a 250ms minimum segment, below which a kept run is just a click. The padded runs are then merged, or two adjacent removals become a stutter of micro-cuts. The strip shows the SOURCE timeline with the playhead jumping at each cut, so the two clocks read as two different things.',
  tags: ['footage', 'silence', 'cut-list', 'transcript', 'interview', 'editorial'],
  concepts: ['keep-list from word timings', 'gap classification', 'trimBefore cut list', 'Series'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 298,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 200, posterFrame: 200,
  requires: ['video', 'transcript'], ground: 'dark', audience: ['youtuber', 'educator', 'podcaster'],
};
