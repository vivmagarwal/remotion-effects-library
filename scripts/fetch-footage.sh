#!/usr/bin/env bash
#
# fetch-footage.sh — re-derive every clip in public/footage/ from its NASA source.
#
# The repository commits the derived asset AND the command that derived it. This is that
# command. Running it with no arguments verifies what is already committed; nothing is
# overwritten unless you pass --force.
#
# Every output is byte-reproducible. The SHA-256 of each clip is recorded in the MANIFEST
# below and checked after every encode, so a drift in ffmpeg, in the source file, or in the
# arguments here is a loud failure rather than a silent one.
#
#   Verified 2026-09-10 on macOS 23.4.0 with ffmpeg 7.1.1 (Lavc61.19.101 / Lavf61.7.100 —
#   the encoder tags embedded in the committed files). All six clips reproduced byte for
#   byte, both from local copies of the sources and by HTTP-range-seeking the remote URLs.
#
# USAGE
#   bash scripts/fetch-footage.sh                # verify committed clips against the manifest
#   bash scripts/fetch-footage.sh --force        # re-encode and overwrite public/footage/
#   bash scripts/fetch-footage.sh --out DIR      # encode into DIR instead (never touches public/)
#   bash scripts/fetch-footage.sh --cache        # download each source once, then cut from disk
#   bash scripts/fetch-footage.sh --only NAME    # just one clip, e.g. --only broll-earth
#   bash scripts/fetch-footage.sh --list         # print the manifest and exit
#
# REQUIREMENTS
#   ffmpeg on PATH (7.x). Do NOT substitute `npx remotion ffmpeg`: it mangles the filter
#   argument and dies with `No option name near '30'` on -vf "fps=30".
#   curl, and one of shasum / sha256sum.
#
# PROVENANCE AND LICENSING
#   All three sources are NASA video, published at images-assets.nasa.gov. NASA's Media Usage
#   Guidelines are quoted in full — including the identifiable-persons and non-endorsement
#   caveats — in public/ASSETS.md, which also records how this repository complies. Read that
#   file before reusing these clips anywhere commercial.
#
# TRANSCRIPTS
#   public/transcripts/*.deepgram.json were produced with Deepgram nova-3. The exact request
#   is at the bottom of this file, under `transcribe`. It needs DEEPGRAM_API_KEY, read from
#   .env, which is gitignored. You do not need it to use this repository: the responses are
#   committed verbatim so every caption and pause effect renders offline with no API key.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/public/footage"
CACHE_DIR="${FOOTAGE_CACHE:-$ROOT/out/footage-src}"   # out/ is gitignored
FORCE=0
USE_CACHE=0
ONLY=""

# ── sources ──────────────────────────────────────────────────────────────────────────────
# key | nasa_id. The file URL is <BASE>/<id>/<id>~large.mp4 — the ~large rendition, not ~orig,
# because ~orig is far larger for no gain here: S1's ~orig is 2,400,447,551 B against ~large's
# 753,195,333 B, and ~large is already the full 1280x720 master.
# All three answered `curl -sIL` with HTTP 200 and `accept-ranges: bytes` on 2026-09-10.
NASA_BASE="https://images-assets.nasa.gov/video"

S1_ID="iss061m2627771232_Live_Interviews_Jeanette_Epps_191004"          # 753,195,333 B  1280x720  59.94fps  1165.568s
S2_ID="jsc2022m000117_Down_to_Earth_S2_E1_Changing_Your_Perspective-SOCIAL"  # 230,933,656 B  1920x1080 30fps  360.333s
S3_ID="jsc2020m000068-Down_to_Earth-Black_Velvet_of_Space_1920x1080"    # 114,573,127 B  1920x1080 30fps  187.100s

source_url() {
  case "$1" in
    S1) printf '%s/%s/%s~large.mp4' "$NASA_BASE" "$S1_ID" "$S1_ID" ;;
    S2) printf '%s/%s/%s~large.mp4' "$NASA_BASE" "$S2_ID" "$S2_ID" ;;
    S3) printf '%s/%s/%s~large.mp4' "$NASA_BASE" "$S3_ID" "$S3_ID" ;;
    *)  printf 'unknown source key: %s\n' "$1" >&2; return 1 ;;
  esac
}

# ── manifest ─────────────────────────────────────────────────────────────────────────────
# name | source | -ss | -t | -vf | crf | audio(y/n) | sha256 of the committed file
#
# -ss and -t both go BEFORE -i. That is not cosmetic: with -t after -i, interview.mp4 comes
# out 182 video frames instead of 183 and no longer matches its hash.
#
# Common to every encode: libx264, preset slow, -pix_fmt yuv420p, -movflags +faststart.
# Where audio is kept: AAC 96 kbps, 2 channels, 48 kHz. Where it is not: -an.
read -r -d '' MANIFEST <<'EOF' || true
interview-raw|S1|157.5|39.0|scale=1280:720:flags=lanczos,fps=30|26|y|3545532183869572de7e4434e518de45c12e774ec175651260e14999434209ae
interview|S2|88.97|6.1|fps=30|25|y|5c6560764aca29abb5bcd1bf611a95e1b150dbde5784066f0ed39818c4d30df2
broll-earth|S3|139.9|6.0|fps=30|26|n|42bbf47cd178df647ae73d16d440cf1ecd186996cde84d93cee155361711b66e
broll-eva|S3|156.9|4.4|fps=30|26|n|33906a8988224d0d1866f71663a9e079e04c163246163effcd0eb37308b3183a
broll-sunrise|S3|100.5|4.0|fps=30|26|n|5aed0375f2d753194ddfe36d82170e831777f0e96d971d60d948b0a2401cc5c6
broll-night|S3|118.5|3.8|fps=30|26|n|c64e1071be407aa7349ba67d9bc84630439daf3eb309b4c711e27c2b0aea6be9
EOF

# ── helpers ──────────────────────────────────────────────────────────────────────────────

die() { printf 'fetch-footage: %s\n' "$*" >&2; exit 1; }
say() { printf '%s\n' "$*"; }

sha256_of() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    die "need shasum or sha256sum"
  fi
}

require_tools() {
  command -v ffmpeg >/dev/null 2>&1 || die "ffmpeg not found on PATH (need 7.x; npx remotion ffmpeg will not work here)"
  command -v curl   >/dev/null 2>&1 || die "curl not found on PATH"
}

# Download a source into the cache, resuming a partial download rather than restarting it.
cache_source() {
  local key="$1" url dest
  url="$(source_url "$key")"
  dest="$CACHE_DIR/$key.mp4"
  if [ -s "$dest" ]; then
    say "  cache hit  $dest"
  else
    mkdir -p "$CACHE_DIR"
    say "  downloading $key -> $dest"
    curl -fL --retry 3 --retry-delay 2 -C - -o "$dest" "$url"
  fi
  printf '%s' "$dest"
}

# ── one clip ─────────────────────────────────────────────────────────────────────────────

encode_one() {
  local name="$1" key="$2" ss="$3" dur="$4" vf="$5" crf="$6" aud="$7" want="$8"
  local target="$OUT_DIR/$name.mp4"
  local input tmp got

  if [ -e "$target" ] && [ "$FORCE" -eq 0 ]; then
    got="$(sha256_of "$target")"
    if [ "$got" = "$want" ]; then
      say "ok       $name  (already present, sha256 matches)"
      return 0
    fi
    say "MISMATCH $name  expected $want"
    say "                got      $got"
    say "         refusing to overwrite; re-run with --force to re-derive"
    return 1
  fi

  if [ "$USE_CACHE" -eq 1 ]; then
    input="$(cache_source "$key")"
  else
    input="$(source_url "$key")"
  fi

  mkdir -p "$OUT_DIR"
  tmp="$(mktemp "${TMPDIR:-/tmp}/fetch-footage.XXXXXX")"
  # mktemp gives an extensionless file; ffmpeg picks the muxer from the extension.
  mv "$tmp" "$tmp.mp4"
  tmp="$tmp.mp4"

  say "encoding $name  (-ss $ss -t $dur, crf $crf, audio=$aud)"
  if [ "$aud" = "y" ]; then
    ffmpeg -y -hide_banner -loglevel error \
      -ss "$ss" -t "$dur" -i "$input" \
      -vf "$vf" \
      -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p \
      -c:a aac -b:a 96k -ac 2 -ar 48000 \
      -movflags +faststart "$tmp"
  else
    ffmpeg -y -hide_banner -loglevel error \
      -ss "$ss" -t "$dur" -i "$input" -an \
      -vf "$vf" \
      -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p \
      -movflags +faststart "$tmp"
  fi

  got="$(sha256_of "$tmp")"
  if [ "$got" != "$want" ]; then
    say "MISMATCH $name  expected $want"
    say "                got      $got"
    say "         left the new file at $tmp — public/footage/ was not touched."
    say "         Most likely cause: a different ffmpeg/libx264 build. Committed files were"
    say "         made with ffmpeg 7.1.1 (Lavc61.19.101 libx264 / Lavf61.7.100)."
    return 1
  fi

  mv "$tmp" "$target"
  chmod 644 "$target"   # mktemp makes 0600; committed assets are 0644
  say "ok       $name  ($(sha256_of "$target"))"
}

# ── the Deepgram step, documented ────────────────────────────────────────────────────────
#
# Not run by default: the responses are already committed, and re-running costs money and
# produces a different request_id. Run it only if you replace the footage.
#
#   bash scripts/fetch-footage.sh --transcribe
#
transcribe() {
  local env_file="$ROOT/.env"
  [ -f "$env_file" ] || die ".env not found (it is gitignored; create it with DEEPGRAM_API_KEY=...)"

  # Read only the one key, and do not echo it.
  local key
  key="$(grep -E '^DEEPGRAM_API_KEY=' "$env_file" | head -n1 | cut -d= -f2- | tr -d '"'"'"' \r')"
  [ -n "$key" ] || die "DEEPGRAM_API_KEY not set in .env"

  local params="model=nova-3&language=en&smart_format=true&punctuate=true&utterances=true&paragraphs=true&filler_words=true"
  # filler_words=true is what makes filler-cutting possible at all — without it Deepgram
  # drops "um"/"uh" from the transcript and there is nothing to cut on.
  # Add diarize_model=latest if the clip has more than one speaker. diarize=true is
  # deprecated and routes to the v1 diarizer, which merges voices; never send both (HTTP 400).

  mkdir -p "$ROOT/public/transcripts"
  local name
  for name in interview-raw interview; do
    say "transcribing $name"
    # Send the audio track only; Deepgram does not need the video and it is 10x the bytes.
    ffmpeg -y -hide_banner -loglevel error -i "$OUT_DIR/$name.mp4" \
      -vn -ac 1 -ar 16000 -c:a pcm_s16le "${TMPDIR:-/tmp}/$name.wav"

    curl -sS -X POST \
      -H "Authorization: Token $key" \
      -H "Content-Type: audio/wav" \
      --data-binary "@${TMPDIR:-/tmp}/$name.wav" \
      "https://api.deepgram.com/v1/listen?$params" \
      -o "$ROOT/public/transcripts/$name.deepgram.json"

    rm -f "${TMPDIR:-/tmp}/$name.wav"
    say "  wrote public/transcripts/$name.deepgram.json"
  done

  say ""
  say "The committed responses came back from model general-nova-3, version 2025-07-31.0."
  say "Word times are SECONDS (floats). @remotion/captions' Caption type is MILLISECONDS."
  say "Convert once, at the boundary:"
  say '  {text: w.punctuated_word ?? w.word, startMs: Math.round(w.start * 1000),'
  say '   endMs: Math.round(w.end * 1000),'
  say '   timestampMs: Math.round(((w.start + w.end) / 2) * 1000), confidence: w.confidence}'
}

# ── argument parsing ─────────────────────────────────────────────────────────────────────

DO_TRANSCRIBE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --force)      FORCE=1 ;;
    --cache)      USE_CACHE=1 ;;
    --transcribe) DO_TRANSCRIBE=1 ;;
    --only)       shift; ONLY="${1:-}"; [ -n "$ONLY" ] || die "--only needs a clip name" ;;
    --out)        shift; OUT_DIR="${1:-}"; [ -n "$OUT_DIR" ] || die "--out needs a directory"; FORCE=1 ;;
    --list)       printf '%s\n' "$MANIFEST"; exit 0 ;;
    -h|--help)    sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            die "unknown argument: $1 (try --help)" ;;
  esac
  shift
done

require_tools

if [ "$DO_TRANSCRIBE" -eq 1 ]; then
  transcribe
  exit 0
fi

say "output dir: $OUT_DIR"
[ "$USE_CACHE" -eq 1 ] && say "source cache: $CACHE_DIR"
say ""

failed=0
while IFS='|' read -r name key ss dur vf crf aud want; do
  [ -n "${name:-}" ] || continue
  case "$name" in \#*) continue ;; esac
  if [ -n "$ONLY" ] && [ "$ONLY" != "$name" ]; then continue; fi
  if ! encode_one "$name" "$key" "$ss" "$dur" "$vf" "$crf" "$aud" "$want"; then
    failed=$((failed + 1))
  fi
done <<< "$MANIFEST"

say ""
if [ "$failed" -ne 0 ]; then
  say "$failed clip(s) failed."
  exit 1
fi
say "All clips present and matching public/ASSETS.md."
