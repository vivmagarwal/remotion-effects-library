# Asset provenance

Every file in `public/` has a row below: what it is, where it came from, what licence it carries,
whether attribution is required, and the exact command that derived it. Nothing ships here without a
row, and `npm run check:assets` fails the build if a file appears in `public/` that this file does not
list.

Two families, two stories:

- **Footage** is NASA — US-government material that is generally not subject to copyright. It was cut
  from three published NASA source videos with ffmpeg. `scripts/fetch-footage.sh` re-derives all six
  clips byte-for-byte; the SHA-256 of every clip is recorded there and checked on every run.
- **Audio and images** are synthesised. Nothing is sampled, recorded or traced from anywhere.
  `scripts/make-audio-assets.py` generates the whole audio pack from oscillators and filtered noise;
  `scripts/make-sample-plates.py` and `scripts/make-city-asset.py` generate the SVG plates. That makes
  them CC0 by construction — there is no third party to attribute because there is no third party.

**Format contract (for `scripts/check-assets.mjs`).** Every asset row is a Markdown table row whose
first cell is a path in backticks, matching `^\| \`public/[^`]+\` \|`. There are several tables; the
gate should scan the whole file, collect every such path, and compare that set against a recursive walk
of `public/`. Column order is fixed: **path · what it is · source · licence · attribution required? ·
how it was derived**. The `source` cell is either a source key (`S1`–`S3`, resolved in §1) or the name
of a generator script.

---

## 1. Sources

Every URL below was checked with `curl -sIL` from this machine on **2026-09-10**. The status column is
the HTTP status actually returned, not an assumption.

| key | NASA `nasa_id` | file URL | HTTP | content-type | content-length | probed |
|---|---|---|---|---|---|---|
| S1 | `iss061m2627771232_Live_Interviews_Jeanette_Epps_191004` | `https://images-assets.nasa.gov/video/iss061m2627771232_Live_Interviews_Jeanette_Epps_191004/iss061m2627771232_Live_Interviews_Jeanette_Epps_191004~large.mp4` | **200** | `video/mp4` | 753,195,333 | h264 1280×720, 59.94 fps, 1165.568 s |
| S2 | `jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL` | `https://images-assets.nasa.gov/video/jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL/jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL~large.mp4` | **200** | `video/mp4` | 230,933,656 | h264 1920×1080, 30 fps, 360.333 s |
| S3 | `jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080` | `https://images-assets.nasa.gov/video/jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080/jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080~large.mp4` | **200** | `video/mp4` | 114,573,127 | h264 1920×1080, 30 fps, 187.100 s |

All three also serve `accept-ranges: bytes`, which is why `scripts/fetch-footage.sh` can seek into a
753 MB source over HTTP and pull only the seconds it needs instead of downloading 1.1 GB.

Human-readable catalogue pages, also checked (`curl -sIL`, 2026-09-10):

| URL | HTTP | content-type |
|---|---|---|
| `https://images.nasa.gov/details/iss061m2627771232_Live_Interviews_Jeanette_Epps_191004` | **200** | `text/html` |
| `https://images.nasa.gov/details/jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL` | **200** | `text/html` |
| `https://images.nasa.gov/details/jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080` | **200** | `text/html` |
| `https://images-assets.nasa.gov/video/iss061m2627771232_Live_Interviews_Jeanette_Epps_191004/collection.json` | **200** | `application/json` |
| `https://images-assets.nasa.gov/video/jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL/collection.json` | **200** | `application/json` |
| `https://images-assets.nasa.gov/video/jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080/collection.json` | **200** | `application/json` |

---

## 2. NASA's position, quoted

Source: **NASA Images and Media Usage Guidelines**,
`https://www.nasa.gov/nasa-brand-center/images-and-media/` (`curl -sIL` → **HTTP 200**,
`text/html; charset=UTF-8`, fetched 2026-09-10). These are NASA's words, not a summary of them:

> NASA content – images, audio, video, and media files used in the rendition of 3-dimensional models,
> such as texture maps and polygon data in any format – generally are not subject to copyright in the
> United States. You may use this material for educational or informational purposes, including photo
> collections, textbooks, public exhibits, computer graphical simulations and Internet Web pages. This
> general permission extends to personal Web pages.

> News outlets, schools, and text-book authors may use NASA content without needing explicit
> permission, subject to compliance with these guidelines. NASA content used in a factual manner that
> does not imply endorsement may be used without needing explicit permission. **NASA should be
> acknowledged as the source of the material.**

> The NASA Insignia, Logotype, identifiers, and imagery are not in the public domain. The use of the
> Insignia, Logotype and NASA identifiers is protected by law, and imagery is made available for use
> consistent with Media Usage Guidelines.

> If the NASA material is to be used for commercial purposes, including advertisements, it must not
> explicitly or implicitly convey NASA's endorsement of commercial goods or services.

> **Media including Identifiable Persons** — If a NASA image, audio, video or media includes an
> identifiable person, using the media for commercial purposes may infringe that person's right of
> privacy or publicity, and permission should be obtained from the person.

> Astronauts or employees who are currently employed by NASA cannot have their names, likenesses or
> other personality traits displayed or position title used on any commercial products, advertisements,
> promotional material or commercial product packaging.

> There are many images (moving and still) which have been made publicly available by NASA featuring
> astronauts in space suits where the astronauts face may be shielded or not easily recognizable, but
> where some other aspect of the photo may indicate the astronaut's identity – like a name tag or
> simply the historical context of the photo. In such a case, the restrictions set forth above may
> still be applicable, so permission may still be necessary.

> NASA will not promote or endorse or appear to promote or endorse a commercial product, service or
> activity.

### How this repository complies

1. **NASA is acknowledged as the source**, here and in the README, with the `nasa_id` and the exact
   file URL for every clip.
2. **The use is factual and non-promotional.** The clips exist to demonstrate video-editing effects in
   an open-source library. No effect, prompt, gallery card or README line states or implies that NASA
   endorses this library, Remotion, or anything else.
3. **Both interview clips show an identifiable person, and both show the NASA insignia.** These are not
   edge cases — I looked at the frames. `interview-raw.mp4` is NASA astronaut **Jeanette Epps** in a
   blue NASA flight suit; her name tag reads `JEANETTE EPPS` and the NASA "meatball" insignia is on her
   shoulder. `interview.mp4` is NASA astronaut **Suni Williams**; her name tag reads `SUNI WILLIAMS`
   and the insignia is again visible. `broll-eva.mp4` shows a suited astronaut whose face is behind a
   gold visor, which NASA's own guidance says may still be identifiable from context.
4. **Therefore: these clips are demo assets, not production assets.** Use them to build and test an
   effect. Replace them with your own footage before you ship anything commercial, promotional, or
   advertising-adjacent. Every effect that consumes footage takes the source path as a prop for exactly
   this reason.
5. **The insignia is not in the public domain.** It appears incidentally in frames of NASA video, which
   is what NASA publishes. This repository does not extract it, re-draw it, or use it as a mark.
6. **No NFT or cryptocurrency use.** NASA asks that its material not be used for those; it is not.

None of this is legal advice. It is a record of what was checked, quoted from the source, so that
anyone downstream can re-check it.

---

## 3. Footage — `public/footage/`

All six clips are cuts of NASA video, re-encoded with ffmpeg 7.1.1 (`Lavc61.19.101 libx264` /
`Lavf61.7.100`, the encoder tags embedded in the files). Every clip is 30 fps, H.264 High, `yuv420p`,
`+faststart`. Re-derive them all with `bash scripts/fetch-footage.sh`; the script verifies each output
against the SHA-256 recorded there. Verified 2026-09-10: **all six reproduce byte-identically**, both
from a local copy of the source and by HTTP-range-seeking the remote URL.

| path | what it is | source | licence | attribution required? | how it was derived |
|---|---|---|---|---|---|
| `public/footage/interview-raw.mp4` | Raw locked-off interview, 1280×720, 39.000 s, AAC 96 kbps stereo 48 kHz, 2,728,886 B. Jeanette Epps answering a question about being the first woman on the Moon — real filler words ("um", "I I") and real pauses, which is what makes silence-cutting and filler-cutting demonstrable. | S1 | US Government work, generally not subject to copyright (see §2) | Not legally required; **NASA asks to be acknowledged as the source, and this repo does** | `ffmpeg -ss 157.5 -t 39.0 -i <S1> -vf "scale=1280:720:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a aac -b:a 96k -ac 2 -ar 48000 -movflags +faststart` |
| `public/footage/interview.mp4` | Clean produced talking head, 1920×1080, 6.133 s, AAC 96 kbps stereo 48 kHz, 1,266,053 B. Suni Williams, one sentence, no fillers — the "after the edit" counterpart to `interview-raw.mp4`. | S2 | US Government work, generally not subject to copyright (see §2) | Not legally required; NASA acknowledged as source | `ffmpeg -ss 88.97 -t 6.1 -i <S2> -vf "fps=30" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 96k -ac 2 -ar 48000 -movflags +faststart` |
| `public/footage/broll-earth.mp4` | Earth from orbit with a solar array in frame, 1920×1080, 6.000 s, silent, 3,083,202 B. | S3 | US Government work, generally not subject to copyright (see §2) | Not legally required; NASA acknowledged as source | `ffmpeg -ss 139.9 -t 6.0 -i <S3> -an -vf "fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart` |
| `public/footage/broll-eva.mp4` | Spacewalk — suited astronaut on the truss against Earth, 1920×1080, 4.400 s, silent, 574,896 B. Face behind a gold visor; see §2.3. | S3 | US Government work, generally not subject to copyright (see §2) | Not legally required; NASA acknowledged as source | `ffmpeg -ss 156.9 -t 4.4 -i <S3> -an -vf "fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart` |
| `public/footage/broll-sunrise.mp4` | Orbital sunrise over the limb, 1920×1080, 4.000 s, silent, 239,863 B. Nearly black except the limb — the deliberate torture case for any luminance-based gate. | S3 | US Government work, generally not subject to copyright (see §2) | Not legally required; NASA acknowledged as source | `ffmpeg -ss 100.5 -t 4.0 -i <S3> -an -vf "fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart` |
| `public/footage/broll-night.mp4` | City lights at night from orbit, 1920×1080, 3.800 s, silent, 1,224,689 B. | S3 | US Government work, generally not subject to copyright (see §2) | Not legally required; NASA acknowledged as source | `ffmpeg -ss 118.5 -t 3.8 -i <S3> -an -vf "fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart` |

Two encoding notes that matter if you re-derive by hand:

- `-ss` and `-t` both go **before** `-i`. With `-t` after `-i` the interview clip comes out one video
  frame short (182 instead of 183) and the file no longer matches its recorded hash.
- Use ffmpeg on `PATH`, not `npx remotion ffmpeg` — the latter mangles `-vf "fps=30"` into
  `No option name near '30'`.

---

## 4. Transcripts — `public/transcripts/`

Real Deepgram responses, committed verbatim so every caption, cut-list and pause effect renders offline
with **no API key**. Model: `general-nova-3`, version `2025-07-31.0`, arch `nova-3`. Times are
**seconds** (floats) relative to the clip; `@remotion/captions` wants **milliseconds**, so convert once
at the boundary. The exact request is documented in `scripts/fetch-footage.sh`.

| path | what it is | source | licence | attribution required? | how it was derived |
|---|---|---|---|---|---|
| `public/transcripts/interview-raw.deepgram.json` | Deepgram `nova-3` response for `footage/interview-raw.mp4`: 119 words, 11 utterances, paragraphs, per-word `start`/`end`/`confidence`/`punctuated_word`. `metadata.duration` 39.096 s, `request_id` `01a08a25-e8e6-7b30-860c-34cf25f79d6f`, 26,122 B. Fillers preserved (`filler_words=true`). | Deepgram API run against `footage/interview-raw.mp4` | Derived from a NASA public-domain clip; the JSON itself is a machine transcription with no separate copyright claimed by this repo — treated as MIT with the rest of the repo | No | `curl` to `https://api.deepgram.com/v1/listen?model=nova-3&…` — full command in `scripts/fetch-footage.sh` |
| `public/transcripts/interview.deepgram.json` | Deepgram `nova-3` response for `footage/interview.mp4`: 17 words, 2 utterances. `metadata.duration` 6.192 s, `request_id` `01a08a25-f4df-7a02-b64c-40a996465252`, 4,253 B. | Deepgram API run against `footage/interview.mp4` | As above | No | As above |

---

## 5. Audio — `public/audio/`

**Everything here is synthesised from scratch by `scripts/make-audio-assets.py` — sine, saw and
filtered-noise oscillators, deterministic under a fixed RNG seed (`20260910`). Nothing is sampled,
recorded, downloaded or bought. There is no third-party licence to honour and no attribution to give:
the pack is CC0 by construction and re-derivable with one command.**

```bash
python3 scripts/make-audio-assets.py     # requires numpy, scipy, ffmpeg
```

That is a deliberate choice over stock audio: a committed `.mp3` from a stock site needs a per-file
provenance trail, and several of the big free libraries (Pixabay, Coverr, Mixkit, ZapSplat) explicitly
forbid redistributing the raw file on a standalone basis — which is exactly what a file sitting in
`public/` of a public repository is. Synthesis removes the question entirely.

All files are mono, 44.1 kHz MP3.

| path | what it is | source | licence | attribution required? | how it was derived |
|---|---|---|---|---|---|
| `public/audio/music-bed.mp3` | Music bed, 42.266 s, 192 kbps, 1,015,056 B. 16 bars of Am9 → Fmaj7 → Cmaj7 → G6 at 92 BPM. Deliberately banded so a spectrum analyser has something to draw in every column — kick and bass under 200 Hz, pad and pluck in the mids, hats above 7 kHz — with parts added every four bars so the bars visibly change shape instead of sitting still. | `scripts/make-audio-assets.py` (`music_bed()`) | CC0 1.0 — synthesised, no third-party material | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/whoosh.mp3` | Whoosh, 0.627 s, 13,105 B. Starts 10 frames before a cut. | `scripts/make-audio-assets.py` (`sfx_whoosh()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/riser.mp3` | Riser, 2.038 s, 41,317 B. Ends **on** the cut. | `scripts/make-audio-assets.py` (`sfx_riser()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/impact.mp3` | Impact, 1.541 s, 31,391 B. Transient lands 1 frame before the visual event. | `scripts/make-audio-assets.py` (`sfx_impact()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/sub-drop.mp3` | Sub drop, 1.646 s, 33,480 B. | `scripts/make-audio-assets.py` (`sfx_sub_drop()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/pop.mp3` | Pop, 0.235 s, 5,268 B. Lands 1 frame before a scale-up starts. | `scripts/make-audio-assets.py` (`sfx_pop()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/click.mp3` | UI click, 0.131 s, 3,178 B. | `scripts/make-audio-assets.py` (`sfx_click()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/key.mp3` | Single keystroke, 0.157 s, 3,701 B. | `scripts/make-audio-assets.py` (`sfx_key()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/swish.mp3` | Short swish, 0.261 s, 5,791 B. | `scripts/make-audio-assets.py` (`sfx_swish()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/shutter.mp3` | Camera shutter, 0.313 s, 6,835 B. | `scripts/make-audio-assets.py` (`sfx_shutter()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |
| `public/audio/sfx/chime.mp3` | Notification chime, 1.149 s, 23,554 B. | `scripts/make-audio-assets.py` (`sfx_chime()`) | CC0 1.0 — synthesised | No | `python3 scripts/make-audio-assets.py` |

---

## 6. Images — `public/*.svg`

Original generated SVG. Deterministic (fixed RNG seeds), diff-able, and small. Each plate carries real
fine detail — stars, lit windows, foliage dots, grain lines — because a blur, a halftone screen or a
0.17× thumbnail all look identical over a smooth gradient, so a placeholder without detail proves
nothing about the effect using it.

| path | what it is | source | licence | attribution required? | how it was derived |
|---|---|---|---|---|---|
| `public/plate-1.svg` | Sunset plate, 1500×1000, 6,631 B. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/plate-2.svg` | Forest plate, 1500×1000, 35,566 B. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/plate-3.svg` | Desert plate, 1500×1000, 22,090 B. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/plate-4.svg` | Night-city plate, 1500×1000, 61,384 B. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/plate-5.svg` | Ocean plate, 1500×1000, 7,549 B. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/subject-skyline.svg` | Transparent-background alpha cutout registered to `plate-4.svg`, 51,680 B — the stand-in matte for text-behind-subject. Generated from the same RNG seed (104) as plate 4 so the skylines line up exactly. | `scripts/make-sample-plates.py` | MIT (original work in this repo) | No | `python3 scripts/make-sample-plates.py` |
| `public/sample-city.svg` | Dense night-city plate, 1920×1080, 249,333 B. Deliberately full of fine high-contrast detail (lit windows, stars, lamp posts) so blur and halftone effects are legible. | `scripts/make-city-asset.py` | MIT (original work in this repo) | No | `python3 scripts/make-city-asset.py` |
| `public/sample-scene.svg` | Hand-authored sunset-over-sea scene, 1920×1080, 1,799 B. No generator — the file is the source. | hand-authored in this repo | MIT (original work in this repo) | No | Edited by hand; it is small enough to read as source |

---

## 7. This file

| path | what it is | source | licence | attribution required? | how it was derived |
|---|---|---|---|---|---|
| `public/ASSETS.md` | This manifest. Also the input to the `check:assets` gate. | this repo | MIT | No | Written by hand; every URL re-checked with `curl -sIL` and every clip re-derived and hashed before publishing a row |

---

## 8. Budget

| group | files | bytes |
|---|---:|---:|
| footage | 6 | 9,117,589 |
| audio | 11 | 1,182,676 |
| transcripts | 2 | 30,375 |
| images (SVG) | 8 | 436,032 |
| **total (excluding this file)** | **27** | **10,766,672 (10.3 MB)** |

The Pages workflow copies `public/` straight into the published site, so every committed byte is also
downloaded by gallery visitors. 10.3 MB is ~1 % of the 1 GB GitHub Pages site limit and well under the
50 MB per-file warning, so plain git is right here and **Git LFS is deliberately not used**: GitHub
Pages does not resolve LFS pointers, so a checkout without `lfs: true` would publish 130-byte pointer
files as if they were video, and anyone who `degit`s the repo would get pointers instead of media.

If you add footage, keep to the same shape — 1080p ceiling, ≤ 8 s, CRF 25–26, `-an` unless the effect
needs the audio, `+faststart` — and add the row here in the same breath.
