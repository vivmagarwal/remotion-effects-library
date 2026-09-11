# Media assets guide

`public/` — what ships, where it came from, and how to regenerate it.

The library ships real footage, real audio and a real machine transcript because the editing effects
cannot demonstrate themselves without them: you cannot show a silence cut on clean footage, because
there is nothing to cut.

---

## 1. What ships

| Path | Size | What |
|---|---|---|
| `public/footage/` | 9.6 MB | Six NASA clips, H.264, `+faststart` |
| `public/audio/` | 1.2 MB | `music-bed.mp3`, a ten-piece SFX rack in `audio/sfx/`, and `voice-interview.mp3` (the 41.0–53.0 s voice window of `interview-raw.mp4`, for ducking demos) |
| `public/transcripts/` | 44 KB | Two real Deepgram `nova-3` responses, committed verbatim |
| `public/plate-1…5.svg`, `subject-skyline.svg`, `sample-city.svg`, `sample-scene.svg` | small | Generated (or, for `sample-scene.svg`, hand-authored) SVG plates |
| `public/ASSETS.md` | — | The provenance manifest — one row per file |

### The footage

| Clip | Format | Why it is here |
|---|---|---|
| `interview-raw.mp4` | 1280×720, 53.0 s, audio | A raw locked-off interview with **real filler words and real pauses**. The one that matters |
| `interview.mp4` | 1920×1080, 6.1 s, audio | A clean produced talking head — the "after" to the raw clip's "before" |
| `broll-earth.mp4` | 1920×1080, 6.0 s, silent | Earth from orbit |
| `broll-eva.mp4` | 1920×1080, 4.4 s, silent | A spacewalk |
| `broll-sunrise.mp4` | 1920×1080, 4.0 s, silent | An orbital sunrise — nearly black except the limb, the honest torture case for any luminance gate |
| `broll-night.mp4` | 1920×1080, 3.8 s, silent | City lights at night |

**These are demo assets.** Both interview clips show an identifiable NASA astronaut wearing the NASA
insignia — fine for building and testing an effect, not fine for an advertisement. Every footage effect
takes its source path as a prop; swap in your own before shipping anything commercial.

### The SVG plates

Deliberately full of fine detail, because that is the only way a blur or a halftone screen is visible at
all — a smooth gradient looks identical either way.

---

## 2. Referencing assets

```tsx
staticFile('footage/interview.mp4')    // note the subdirectory
staticFile('audio/sfx/whoosh.mp3')
```

`staticFile()` returns a **root-absolute** path with no way to prefix a base, so the gallery remaps it
for GitHub Pages subpaths — see [GALLERY_GUIDE.md §6](GALLERY_GUIDE.md#6-base-path). The list it remaps
(`publicAssets`) comes from `build-registry.mjs`, which walks `public/` recursively.

`check:standalone` fails a brief or component that references a `staticFile()` path which does not
exist.

---

## 3. The manifest contract

Every file under `public/` needs a row in `public/ASSETS.md`, and `check:assets` fails the build
otherwise. The format is fixed because a gate parses it:

- A row is a Markdown table row whose first cell is the path in backticks.
- Column order: **path · what it is · source · licence · attribution required? · how it was derived**.
- The `source` cell is either a source key (`S1`–`S3`, resolved in `ASSETS.md` §1) or the name of the
  generator script.

The gate itself is looser than the convention: `check-assets.mjs` only checks that each file's full
`public/…` path appears somewhere in `ASSETS.md`. Keep to the table format anyway — it is what makes the
manifest readable, and nothing else enforces it.

---

## 4. Regenerating

None of these are wired into npm scripts — run them directly, and only when you mean to.

### Footage — `scripts/fetch-footage.sh`

Re-derives all six clips from their NASA source URLs with ffmpeg and verifies each against a recorded
SHA-256. With no arguments it only **verifies** what is committed; nothing is overwritten without
`--force`.

| Flag | Effect |
|---|---|
| `--force` | Re-encode and overwrite |
| `--cache` | Download each source once and cut from disk (`FOOTAGE_CACHE`, default `out/footage-src`) |
| `--only NAME` | A single clip |
| `--out DIR` | Encode elsewhere; implies `--force` and never touches `public/` |
| `--list` | Print the manifest and exit |
| `--transcribe` | Run the Deepgram step instead of the encode |

Needs **ffmpeg 7.x on `PATH`** (not `npx remotion ffmpeg` — documented in the script as broken for this
use), plus `curl` and `shasum`/`sha256sum`. All six clips reproduce byte for byte with ffmpeg 7.1.1.

`interview-raw.mp4`'s manifest row recorded a 39.0 s cut until 2026-09-12, while the committed clip —
and the transcript and `voice-interview.mp3` made from it — has always been the 53.0 s cut. Re-deriving
from the source confirmed the 53 s cut is the committed file, byte for byte, so the row (in this script
and in `public/ASSETS.md`) now records `-t 53.0` and that file's hash.

### Transcripts — `scripts/fetch-footage.sh --transcribe`

Posts the audio to
`api.deepgram.com/v1/listen?model=nova-3&…&utterances=true&paragraphs=true&filler_words=true`.

- `filler_words=true` is load-bearing: without it Deepgram drops "um"/"uh" and there is nothing to cut.
- For more than one speaker add `diarize_model=latest`. `diarize=true` is deprecated and routes to the
  v1 diarizer, which merges voices; sending both is an HTTP 400.
- Needs `DEEPGRAM_API_KEY` in a gitignored `.env`. **You never need this to use the repository** — the
  responses are committed, so every caption, cut-list and pause effect renders offline with no API key
  and no network. No gate calls an API.

### Audio — `scripts/make-audio-assets.py`

Python 3 with `numpy`, `scipy` and ffmpeg on `PATH`. Synthesises everything from oscillators and
filtered noise — nothing is sampled or recorded — so there is no licence question and the transients
land exactly where the script puts them. Fixed RNG seed `20260910`. Produces a 16-bar, 92 BPM bed
(Am9 → Fmaj7 → Cmaj7 → G6, ~41.7 s, deliberately banded across the spectrum so a spectrum analyser has
something to show) at 192 kbps and ten SFX at 160 kbps.

### Plates — `scripts/make-sample-plates.py`, `scripts/make-city-asset.py`

Python 3, stdlib only. `make-sample-plates.py` writes `plate-1…5.svg` (1500×1000) plus a
transparent-background `subject-skyline.svg` that matches plate-4's skyline (same seed 104, so the
silhouettes line up). `make-city-asset.py` writes `sample-city.svg` (seed 7). `sample-scene.svg` is
hand-authored and has no generator.

---

## 5. Adding an asset

1. Put the file under `public/<subdir>/`.
2. Add a row to `public/ASSETS.md` in the exact column order, naming the source and licence, and either
   the generator script or the command that derived it.
3. `npm run registry` (so `publicAssets` picks it up for the Pages remap).
4. `npm run check:assets`.

Prefer generating over sourcing. Everything in `public/` that is not NASA footage is synthesised
precisely so there is no third party to attribute and no licence to track.

---

## 6. Licensing summary

- **Footage** — NASA, US-government material generally not subject to copyright. NASA asks to be
  acknowledged and is: per-clip `nasa_id`s, source URLs and NASA's full media-usage position are in
  `public/ASSETS.md`. NASA does not endorse this library.
- **Synthesised audio** — original generated work with no third party (`ASSETS.md` records the licence
  per file). `voice-interview.mp3` is NASA material, cut from `interview-raw.mp4`.
- **SVG plates** — original work in this repository, MIT per `ASSETS.md`.
- **Everything else in the repo** — MIT. Remotion itself is licensed separately and is **not** MIT; see
  [remotion.dev/license](https://www.remotion.dev/license).
