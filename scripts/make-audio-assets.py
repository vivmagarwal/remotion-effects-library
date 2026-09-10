#!/usr/bin/env python3
"""
Generates every audio asset in public/audio/ from scratch: one music bed and the
SFX rack. Nothing here is sampled from anywhere — it is all synthesised, so the
whole pack is CC0 by construction and reproducible with one command.

    python3 scripts/make-audio-assets.py

Why synthesise rather than ship stock:

- Licence. A committed .mp3 from a stock site needs a per-file provenance trail
  and some of those licences forbid redistributing the raw file inside a
  template. Generated audio has no such question.
- The music bed exists to make a *spectrum analyser* look right. The old
  placeholder was a single decaying tone, so `visualizeAudio` returned a smooth
  ramp that fell away to the right and the bars read as broken. Real bars need
  energy in separate bands that moves independently: a kick under 120 Hz, a bass
  around 60-160, chords in the mids, hats above 6 kHz. That is designed here on
  purpose, band by band.
- The SFX rack needs frame-accurate transients. A synthesised whoosh has its
  peak exactly where the script puts it, which is what the timing tables in the
  editing prompts promise.

Requires numpy + scipy and ffmpeg on PATH.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import signal

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
SFX = OUT / "sfx"

rng = np.random.default_rng(20260910)  # fixed: the pack must be byte-reproducible


# ── helpers ──────────────────────────────────────────────────────────────────

def t(n: int) -> np.ndarray:
    return np.arange(n) / SR


def env_ad(n: int, attack: float, decay: float, curve: float = 2.5) -> np.ndarray:
    """Attack/decay envelope in seconds. `curve` shapes the decay: >1 = snappier."""
    a = max(1, int(attack * SR))
    d = max(1, n - a)
    return np.concatenate([
        np.linspace(0.0, 1.0, a) ** 0.6,
        (np.linspace(1.0, 0.0, d) ** curve),
    ])[:n]


def sine(freq: np.ndarray | float, n: int, phase: float = 0.0) -> np.ndarray:
    """Phase-accurate even when `freq` is an array (a glide)."""
    f = np.full(n, freq, dtype=float) if np.isscalar(freq) else np.asarray(freq, dtype=float)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def saw(freq: float, n: int) -> np.ndarray:
    return signal.sawtooth(2 * np.pi * freq * t(n))


def noise(n: int) -> np.ndarray:
    return rng.uniform(-1.0, 1.0, n)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 4) -> np.ndarray:
    ny = SR / 2
    sos = signal.butter(order, [max(20.0, lo) / ny, min(hi, ny - 100) / ny], btype="band", output="sos")
    return signal.sosfilt(sos, x)


def lowpass(x: np.ndarray, hi: float, order: int = 4) -> np.ndarray:
    sos = signal.butter(order, min(hi, SR / 2 - 100) / (SR / 2), btype="low", output="sos")
    return signal.sosfilt(sos, x)


def highpass(x: np.ndarray, lo: float, order: int = 4) -> np.ndarray:
    sos = signal.butter(order, max(20.0, lo) / (SR / 2), btype="high", output="sos")
    return signal.sosfilt(sos, x)


def place(buf: np.ndarray, x: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if i >= len(buf):
        return
    buf[i:j] += x[: j - i] * gain


def normalise(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = float(np.max(np.abs(x)))
    return x if m == 0 else x * (peak / m)


def write(path: Path, x: np.ndarray, bitrate: str = "160k") -> None:
    """PCM through ffmpeg — writing mp3 directly avoids a wav lying around."""
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(x, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
         "-c:a", "libmp3lame", "-b:a", bitrate, str(path)],
        input=pcm, check=True,
    )
    print(f"  {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB  {len(x) / SR:.2f}s")


# ── instruments ──────────────────────────────────────────────────────────────

def kick(dur: float = 0.42) -> np.ndarray:
    n = int(dur * SR)
    # 150 Hz → 44 Hz pitch drop over 55 ms is what reads as "kick" rather than "beep".
    f = 44 + 106 * np.exp(-t(n) / 0.055)
    body = sine(f, n) * env_ad(n, 0.001, dur, 3.4)
    click = highpass(noise(n), 1800) * env_ad(n, 0.0005, 0.012, 6.0) * 0.30
    return body * 0.95 + click


def snare(dur: float = 0.30) -> np.ndarray:
    n = int(dur * SR)
    tone = (sine(186, n) + sine(331, n) * 0.7) * env_ad(n, 0.001, 0.09, 3.0) * 0.35
    body = bandpass(noise(n), 900, 7200) * env_ad(n, 0.001, dur, 2.6)
    return tone + body * 0.8


def hat(dur: float = 0.075, open_: bool = False) -> np.ndarray:
    n = int((0.30 if open_ else dur) * SR)
    return highpass(noise(n), 7200) * env_ad(n, 0.0004, 0.30 if open_ else dur, 2.0 if open_ else 5.5)


def bass(freq: float, dur: float) -> np.ndarray:
    n = int(dur * SR)
    x = saw(freq, n) * 0.55 + sine(freq, n) * 0.75 + sine(freq / 2, n) * 0.25
    # A moving filter is what stops a sustained bass note from reading as a drone.
    cut = 190 + 520 * np.exp(-t(n) / 0.30)
    out = np.zeros(n)
    step = 512
    for i in range(0, n, step):
        out[i:i + step] = lowpass(x[i:i + step], float(cut[min(i, n - 1)]))
    return out * env_ad(n, 0.006, dur, 1.25)


def pad(freqs: list[float], dur: float) -> np.ndarray:
    n = int(dur * SR)
    x = np.zeros(n)
    for k, f in enumerate(freqs):
        # Two slightly detuned saws per voice — the beating is what makes it a pad.
        x += saw(f, n) * 0.5 + saw(f * 1.0038, n) * 0.5
        x += sine(f * 2, n) * 0.18
        x *= 1.0
    x = lowpass(x, 2600) / max(1, len(freqs))
    swell = np.minimum(1.0, t(n) / 0.6) * (1.0 - 0.25 * np.linspace(0, 1, n))
    return x * swell


def pluck(freq: float, dur: float = 0.34) -> np.ndarray:
    """Karplus-Strong: a real string, and it puts genuine energy in the 1-5 kHz bands."""
    n = int(dur * SR)
    ln = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, ln)
    out = np.empty(n)
    for i in range(n):
        v = 0.5 * (buf[i % ln] + buf[(i + 1) % ln]) * 0.9965
        out[i] = buf[i % ln]
        buf[i % ln] = v
    return out * env_ad(n, 0.002, dur, 1.5)


# ── the music bed ────────────────────────────────────────────────────────────

def music_bed() -> np.ndarray:
    """
    16 bars of Am9 → Fmaj7 → Cmaj7 → G6 at 92 BPM, 41.7 s — long enough to sit
    under any effect in the library and to loop cleanly.

    The arrangement is deliberately banded so a spectrum analyser has something
    to draw in every column: kick and bass below 200 Hz, pad and pluck through
    the mids, hats above 7 kHz, and a build that adds parts every four bars so
    the bars visibly change shape rather than sitting still.
    """
    bpm = 92.0
    beat = 60.0 / bpm
    bar = beat * 4
    bars = 16
    n = int(bar * bars * SR) + SR // 2
    mix = np.zeros(n)

    # A minor pentatonic-ish set; every chord shares notes so nothing clashes.
    chords = [
        ([220.00, 261.63, 329.63, 493.88], 110.00),   # Am9
        ([174.61, 261.63, 349.23, 440.00], 87.31),    # Fmaj7
        ([261.63, 329.63, 392.00, 493.88], 130.81),   # Cmaj7
        ([196.00, 246.94, 293.66, 392.00], 98.00),    # G6
    ]
    arp = [880.00, 659.26, 587.33, 493.88, 659.26, 523.25, 440.00, 587.33]

    for b in range(bars):
        b0 = b * bar
        root_notes, root = chords[b % 4]

        # A long linear build is wrong for a demo bed. Almost every effect in the
        # library samples the FIRST few seconds, so an arrangement that only
        # fills out at bar 8 renders a half-empty analyser on every poster frame.
        # Full band from bar 0; the interest comes from a BREAKDOWN (bars 6-7)
        # and a re-entry, so any window has something happening in it.
        breakdown = b in (6, 7)

        # Pad — the harmonic floor, present throughout, louder when it carries alone.
        place(mix, pad(root_notes, bar * 1.02), b0, 0.30 if breakdown else 0.24)

        if not breakdown:
            for k in (0, 2):
                place(mix, kick(), b0 + k * beat, 0.85)
            if b >= 4:
                place(mix, kick(), b0 + 2.5 * beat, 0.55)
            for k in (1, 3):
                place(mix, snare(), b0 + k * beat, 0.30 if b < 4 else 0.34)

        # Hats from the first bar — they are the only thing above 7 kHz, and
        # without them the top third of a spectrum analyser is dead.
        for e in range(8):
            opn = e == 7 and b % 2 == 1
            g = (0.15 if e % 2 else 0.24) * (0.35 if breakdown else 1.0)
            place(mix, hat(open_=opn), b0 + e * beat / 2, g)

        # Bass follows the chord root, with a syncopated push into beat 4.
        place(mix, bass(root, beat * 1.5), b0, 0.55)
        place(mix, bass(root, beat * 0.9), b0 + 2 * beat, 0.45)
        if not breakdown:
            place(mix, bass(root * 1.5, beat * 0.5), b0 + 3.5 * beat, 0.32)

        # Plucked arp — this is what fills the 1-5 kHz columns.
        for e in range(8):
            if e in (2, 6) and b % 2 == 0:
                continue
            place(mix, pluck(arp[(e + b) % 8]), b0 + e * beat / 2, 0.12 if breakdown else 0.20)

        # A soft cymbal-ish swell into every fourth bar.
        if b % 4 == 3:
            place(mix, hat(open_=True), b0 + 3.5 * beat, 0.30)

    # Gentle bus compression so the kick does not dominate the analyser.
    env = np.abs(signal.hilbert(lowpass(mix, 8000)))
    # The smoother can ring slightly negative; a floor keeps the power finite.
    env = np.maximum(lowpass(env, 12), 1e-4)
    gain = np.minimum(1.0, (0.30 / env) ** 0.35)
    mix = mix * gain

    mix = highpass(mix, 32)
    fade = int(0.9 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix[:int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    return normalise(mix, 0.86)


# ── the SFX rack ─────────────────────────────────────────────────────────────

def sfx_whoosh() -> np.ndarray:
    """Peak at 55 % — the editing prompts tell you to land that on the cut."""
    dur, n = 0.60, int(0.60 * SR)
    x = noise(n)
    lo = 220 + 2600 * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.4
    out = np.zeros(n)
    step = 256
    for i in range(0, n, step):
        c = float(lo[min(i, n - 1)])
        out[i:i + step] = bandpass(x[max(0, i - step):i + step], c * 0.55, c * 2.4)[-len(out[i:i + step]):]
    shape = np.sin(np.pi * np.linspace(0, 1, n) ** 0.85) ** 1.6
    doppler = sine(np.linspace(420, 180, n), n) * 0.10 * shape
    return normalise(out * shape + doppler, 0.82)


def sfx_riser() -> np.ndarray:
    """2 s, ends exactly on the last sample so `from = cut - 60` lands the peak on the cut."""
    dur, n = 2.0, int(2.0 * SR)
    p = np.linspace(0, 1, n)
    tone = sine(160 * (2 ** (2.8 * p ** 1.7)), n) * 0.45
    tone += sine(240 * (2 ** (2.8 * p ** 1.7)), n) * 0.22
    air = np.zeros(n)
    step = 512
    for i in range(0, n, step):
        c = 400 + 7000 * float(p[min(i, n - 1)]) ** 1.5
        air[i:i + step] = bandpass(noise(len(air[i:i + step]) + step), c, min(c * 2.2, 18000))[:len(air[i:i + step])]
    swell = p ** 2.1
    trem = 1.0 + 0.18 * np.sin(2 * np.pi * (5 + 22 * p) * t(n))
    return normalise((tone + air * 0.55) * swell * trem, 0.8)


def sfx_impact() -> np.ndarray:
    """A slam is mostly weight. The transient only has to *start* it — a crack
    loud enough to dominate the spectral centroid reads as a snare, not a hit."""
    dur, n = 1.5, int(1.5 * SR)
    sub = sine(np.concatenate([np.linspace(120, 34, int(0.11 * SR)), np.full(n - int(0.11 * SR), 34.0)]), n)
    sub *= env_ad(n, 0.001, dur, 1.7)
    thud = sine(np.concatenate([np.linspace(190, 62, int(0.07 * SR)), np.full(n - int(0.07 * SR), 62.0)]), n)
    thud *= env_ad(n, 0.001, 0.55, 2.6) * 0.5
    crack = highpass(noise(n), 1400) * env_ad(n, 0.0004, 0.09, 7.0) * 0.16
    body = bandpass(noise(n), 70, 420) * env_ad(n, 0.002, 0.7, 2.4) * 0.42
    tail = lowpass(noise(n), 260) * env_ad(n, 0.03, dur, 1.2) * 0.16
    return normalise(sub * 1.25 + thud + crack + body + tail, 0.94)


def sfx_sub_drop() -> np.ndarray:
    n = int(1.6 * SR)
    p = np.linspace(0, 1, n)
    f = 130 * (2 ** (-3.2 * p ** 0.7))
    return normalise(sine(f, n) * env_ad(n, 0.004, 1.6, 1.5), 0.9)


def sfx_pop() -> np.ndarray:
    n = int(0.20 * SR)
    p = np.linspace(0, 1, n)
    body = sine(np.concatenate([np.linspace(300, 1250, int(0.03 * SR)),
                                np.linspace(1250, 700, n - int(0.03 * SR))]), n)
    body *= env_ad(n, 0.0015, 0.10, 4.0)
    tick = highpass(noise(n), 3000) * env_ad(n, 0.0003, 0.010, 7.0) * 0.35
    return normalise(body + tick, 0.78)


def sfx_click() -> np.ndarray:
    n = int(0.08 * SR)
    x = bandpass(noise(n), 1600, 8000) * env_ad(n, 0.0002, 0.020, 8.0)
    x += sine(2100, n) * env_ad(n, 0.0002, 0.006, 9.0) * 0.25
    return normalise(x, 0.66)


def sfx_key() -> np.ndarray:
    """A keyboard keystroke: down-click, tiny gap, up-click."""
    n = int(0.13 * SR)
    x = np.zeros(n)
    place(x, bandpass(noise(int(0.03 * SR)), 900, 6500) * env_ad(int(0.03 * SR), 0.0002, 0.016, 7.0), 0.0, 1.0)
    place(x, bandpass(noise(int(0.02 * SR)), 1400, 9000) * env_ad(int(0.02 * SR), 0.0002, 0.010, 8.0), 0.055, 0.45)
    x += sine(140, n) * env_ad(n, 0.001, 0.02, 6.0) * 0.18
    return normalise(x, 0.6)


def sfx_swish() -> np.ndarray:
    """Short UI transition swish — a whoosh with a third of the length."""
    n = int(0.22 * SR)
    p = np.linspace(0, 1, n)
    out = np.zeros(n)
    step = 256
    for i in range(0, n, step):
        c = 900 + 5200 * float(p[min(i, n - 1)])
        seg = bandpass(noise(len(out[i:i + step]) + step), c * 0.6, min(c * 2.0, 18000))
        out[i:i + step] = seg[:len(out[i:i + step])]
    return normalise(out * np.sin(np.pi * p) ** 1.3, 0.62)


def sfx_shutter() -> np.ndarray:
    n = int(0.28 * SR)
    x = np.zeros(n)
    for at, g, lo, hi in ((0.0, 1.0, 1200, 9000), (0.035, 0.6, 700, 5000), (0.10, 0.45, 1000, 7000)):
        m = int(0.03 * SR)
        x[int(at * SR):int(at * SR) + m] += bandpass(noise(m), lo, hi) * env_ad(m, 0.0002, 0.014, 7.0) * g
    return normalise(x, 0.7)


def sfx_chime() -> np.ndarray:
    """Notification: a major third, struck. Bright enough to cut through a mix."""
    n = int(1.1 * SR)
    x = np.zeros(n)
    for f, g, d in ((1318.51, 1.0, 0.9), (1661.22, 0.55, 0.8), (2637.02, 0.28, 0.55), (3322.44, 0.14, 0.4)):
        x += sine(f, n) * env_ad(n, 0.002, d, 2.2) * g
    place(x, sine(1975.53, int(0.7 * SR)) * env_ad(int(0.7 * SR), 0.002, 0.7, 2.4) * 0.4, 0.12)
    return normalise(x, 0.7)


SFX_RACK = {
    "whoosh": sfx_whoosh,
    "riser": sfx_riser,
    "impact": sfx_impact,
    "sub-drop": sfx_sub_drop,
    "pop": sfx_pop,
    "click": sfx_click,
    "key": sfx_key,
    "swish": sfx_swish,
    "shutter": sfx_shutter,
    "chime": sfx_chime,
}


def main() -> int:
    print("music bed")
    write(OUT / "music-bed.mp3", music_bed(), "192k")
    print("sfx")
    for name, fn in SFX_RACK.items():
        write(SFX / f"{name}.mp3", fn(), "160k")
    return 0


if __name__ == "__main__":
    sys.exit(main())
