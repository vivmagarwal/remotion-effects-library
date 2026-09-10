Build a Remotion composition called **SilenceCut** (composition id `silence-cut`): dead air removed
from a talking head, with the cut list computed from word timings rather than from an audio threshold.

**Setup**

```bash
npx remotion add @remotion/media @remotion/google-fonts
```

**Why the transcript and not the audio**

An amplitude gate cannot tell a breath from a room, and it cuts on a cough. The gaps *between words*
are unambiguous, and they come free with any word-level ASR. So the input is an array of
`{w, s, e}` — text, start and end in **seconds** — and the cut list is a pure function of it. That
makes the edit inspectable, diffable, and identical on every render tab.

**The algorithm — three thresholds, and the margin is the one people forget**

```tsx
const buildKeepList = (words, {minSilence, margin, minSegment, fillers}) => {
  const drop = new Set(fillers.map((f) => f.toLowerCase()));
  const kept = words.filter((w) => !drop.has(w.w.toLowerCase().replace(/[^a-z']/g, '')));

  // 1. Group into runs, breaking wherever the gap is real dead air.
  const runs = [{s: kept[0].s, e: kept[0].e}];
  for (let i = 1; i < kept.length; i++) {
    if (kept[i].s - kept[i - 1].e >= minSilence) runs.push({s: kept[i].s, e: kept[i].e});
    else runs[runs.length - 1].e = kept[i].e;
  }

  // 2. Pad, drop the clicks, merge what the padding overlapped.
  const out = [];
  for (const r of runs) {
    const s = Math.max(0, r.s - margin);
    const e = r.e + margin;
    if (e - s < minSegment) continue;
    const last = out[out.length - 1];
    if (last && s <= last.e) last.e = Math.max(last.e, e);
    else out.push({s, e});
  }
  return out;
};
```

- **`minSilence` 0.35s.** Below about 0.30s you start cutting the beats between clauses and the
  speaker turns into a machine gun. Real speech gaps are 0.15–0.5s; only above the gate is it dead air.
- **`margin` 0.2s.** A word's `s` is where the vowel became loud enough to detect, not where the mouth
  began moving. Cut exactly on it and every kept run starts mid-consonant. 180–220ms is the band —
  `auto-editor`'s default is 200ms.
- **`minSegment` 0.25s.** Anything shorter after padding is a click, not a segment.
- **The merge in step 2 is not optional.** Two adjacent removals whose margins overlap become a
  stutter of micro-cuts without it.

**Playing the result** — a cut list *is* a `<Series>`:

```tsx
<Series>
  {shown.map((k) => (
    <Series.Sequence key={k.s} durationInFrames={Math.max(1, Math.round((k.e - k.s) * fps))} premountFor={fps}>
      <Video src={source} trimBefore={Math.round(k.s * fps)} trimAfter={Math.round(k.e * fps)} muted
             style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </Series.Sequence>
  ))}
</Series>
```

**`trimBefore` and `trimAfter` are FRAME counts, not seconds.** Multiply by `fps` exactly once, at the
boundary, and round — a float frame index silently resamples.

**The look**
- 1920×1080, 30fps, 312 frames. Ground `#0a0b10`.
- Readout pill top-left at `84, 84`: `−3.0s` at 54px/800 white, `2 SEGMENTS` at 28px/700
  `letter-spacing: 0.16em` in `#ff5c39`, then `350ms gate · 200ms margin` at 28px/500 in `#8d93a5`.
  Pill: `padding: 14px 26px`, radius 12, `rgba(10,11,16,0.72)`,
  `backdropFilter: 'blur(18px) saturate(1.3)'`, `1px solid rgba(255,255,255,0.14)`.
- A strip at `left/right: 84, bottom: 110`, 26px tall, radius 6, track `rgba(255,255,255,0.1)` with a
  `rgba(255,255,255,0.16)` border. **The strip is the SOURCE timeline, not the output**: kept ranges
  filled with the accent at 0.85 opacity, everything between them removed, and a 3px white playhead.
- Below it, three labels at 34px/500 `#8d93a5`: the window start, `source 44.20s · out 4.20s` in
  `#eef1f7`, and the window end. **The playhead jumps at each cut** — that jump, and the two clocks
  disagreeing, is the clearest possible picture of what the edit did.
- A 5px hairline along the very bottom filling with the OUTPUT clock.

**Requirements**
- One self-contained `.tsx` file exporting `SilenceCut`.
- Props with these exact defaults: `src` (defaults to `staticFile('footage/interview-raw.mp4')`),
  `words` (a real Deepgram response inlined as `DEEPGRAM_WORDS` — 154 words, times in seconds),
  `minSilence` `0.35`, `margin` `0.2`, `minSegment` `0.25`, `fillers` `['um', 'uh']`,
  `window` `[40, 53.4]`, `accentColor` `'#ff5c39'`, `backgroundColor` `'#0a0b10'`.
- `window` picks the source range to show. The default contains the clip's one long pause — a 3.36s
  satellite-delay gap after the interviewer starts a question — so a cut is actually visible. Without
  a window you would be watching 50 seconds to see three cuts.
- `<Video>` comes from `@remotion/media`. `premountFor={fps}` on each segment, or the first frame of
  each cut can render blank while the decoder seeks.
- Load Inter at weights 500, 700, 800 — exactly the three used.

**Be honest about the yield.** On this clip the full transcript gives 7 segments and removes 3.6s of
53.1s — about 7%. A well-spoken subject in a produced interview does not have much dead air, and an
effect that claimed 40% here would be lying about its thresholds. The place this earns its keep is raw
footage: a first take, a Zoom recording, a satellite media tour with delay on the line.
