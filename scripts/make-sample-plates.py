#!/usr/bin/env python3
"""Generates public/plate-1..5.svg — five distinct 3:2 scenes for the media effects.

Each carries real fine detail (stars, windows, grain lines, foliage dots) rather
than being a smooth gradient: a blur, a halftone screen or a small thumbnail all
look identical on a smooth gradient, so a placeholder without detail proves
nothing about the effect using it.
"""
import random

W, H = 1500, 1000


def head(gid, stops):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append('<defs><linearGradient id="%s" x1="0" y1="0" x2="0" y2="1">' % gid)
    for off, col in stops:
        s.append(f'<stop offset="{off}" stop-color="{col}"/>')
    s.append('</linearGradient></defs>')
    s.append(f'<rect width="{W}" height="{H}" fill="url(#{gid})"/>')
    return s


def stars(s, n, maxy, rng):
    for _ in range(n):
        x, y = rng.uniform(0, W), rng.uniform(0, maxy)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(0.6, 2.0):.1f}" '
                 f'fill="#fff" opacity="{rng.uniform(0.15, 0.85):.2f}"/>')


def ridges(s, bands, rng):
    for base_y, colour, amp in bands:
        pts = [f'0,{base_y}']
        x = 0
        y = base_y
        while x < W:
            x += rng.uniform(90, 200)
            y = base_y + rng.uniform(-amp, amp)
            pts.append(f'{min(x, W):.0f},{y:.0f}')
        pts += [f'{W},{H}', f'0,{H}']
        s.append(f'<polygon points="{" ".join(pts)}" fill="{colour}"/>')


def plate_sunset(rng):
    s = head('g', [('0%', '#1b2a5e'), ('42%', '#c8517a'), ('72%', '#f2914a'), ('100%', '#ffd28a')])
    stars(s, 90, 380, rng)
    s.append(f'<circle cx="{W/2:.0f}" cy="640" r="260" fill="#fff3c4" opacity="0.28"/>')
    s.append(f'<circle cx="{W/2:.0f}" cy="640" r="118" fill="#fff0b8"/>')
    ridges(s, [(660, '#3a2350', 40), (740, '#241436', 55), (830, '#150c24', 60)], rng)
    return s


def plate_forest(rng):
    s = head('g', [('0%', '#0b2a24'), ('50%', '#154237'), ('100%', '#2c6b4f')])
    for _ in range(500):
        x, y = rng.uniform(0, W), rng.uniform(120, H)
        r = rng.uniform(1.5, 6)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#7fd6a0" '
                 f'opacity="{rng.uniform(0.05, 0.35):.2f}"/>')
    for i in range(26):
        x = rng.uniform(-40, W)
        w = rng.uniform(14, 40)
        s.append(f'<rect x="{x:.0f}" y="{rng.uniform(120, 300):.0f}" width="{w:.0f}" '
                 f'height="{H}" fill="#08201b" opacity="{rng.uniform(0.3, 0.8):.2f}"/>')
    return s


def plate_desert(rng):
    s = head('g', [('0%', '#f6d9a8'), ('46%', '#e8a765'), ('100%', '#a85f3c')])
    s.append(f'<circle cx="1120" cy="300" r="96" fill="#fff4d6" opacity="0.9"/>')
    ridges(s, [(560, '#c4763f', 60), (700, '#9c522f', 70), (840, '#6d3521', 60)], rng)
    for _ in range(320):
        x, y = rng.uniform(0, W), rng.uniform(560, H)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(0.8, 2.6):.1f}" '
                 f'fill="#3d1c10" opacity="{rng.uniform(0.06, 0.3):.2f}"/>')
    return s


def plate_night_city(rng):
    s = head('g', [('0%', '#070c22'), ('56%', '#2a2350'), ('100%', '#6b3f74')])
    stars(s, 150, 420, rng)
    x = -40
    while x < W + 40:
        w = rng.uniform(50, 130)
        h = rng.uniform(180, 460)
        s.append(f'<rect x="{x:.0f}" y="{H - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="#0d0a1c"/>')
        wy = H - h + 16
        while wy < H - 20:
            wx = x + 9
            while wx < x + w - 12:
                if rng.random() > 0.4:
                    s.append(f'<rect x="{wx:.0f}" y="{wy:.0f}" width="9" height="11" '
                             f'fill="#ffcf8a" opacity="{rng.uniform(0.25, 1):.2f}"/>')
                wx += 16
            wy += 20
        x += w + rng.uniform(6, 18)
    return s


def plate_ocean(rng):
    s = head('g', [('0%', '#0a1f3c'), ('44%', '#12507c'), ('100%', '#39a0b8')])
    stars(s, 60, 260, rng)
    for i in range(40):
        y = 520 + i * 12
        wdt = rng.uniform(120, 620)
        x = rng.uniform(0, W - wdt)
        s.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{wdt:.0f}" height="{rng.uniform(2, 5):.0f}" '
                 f'rx="2" fill="#cdf0ff" opacity="{rng.uniform(0.06, 0.3):.2f}"/>')
    s.append(f'<circle cx="330" cy="230" r="80" fill="#eaf6ff" opacity="0.85"/>')
    return s


PLATES = [plate_sunset, plate_forest, plate_desert, plate_night_city, plate_ocean]

for i, fn in enumerate(PLATES, start=1):
    rng = random.Random(100 + i)
    parts = fn(rng)
    parts.append('</svg>')
    open(f'public/plate-{i}.svg', 'w').write('\n'.join(parts))
    print(f'wrote public/plate-{i}.svg')


# ── Foreground cutouts ──────────────────────────────────────────────────────
# A transparent-background silhouette that matches plate-4's skyline, so text
# can be sandwiched between a sky and a foreground. Any real use of the
# text-behind-subject effect needs exactly this: a subject with real alpha.
def subject_skyline(rng):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    # plate_night_city draws its stars BEFORE the skyline, so burn the same
    # number of RNG draws here or the two skylines will not line up.
    stars([], 150, 420, rng)
    x = -40
    while x < W + 40:
        w = rng.uniform(50, 130)
        h = rng.uniform(180, 460)
        s.append(f'<rect x="{x:.0f}" y="{H - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="#0d0a1c"/>')
        wy = H - h + 16
        while wy < H - 20:
            wx = x + 9
            while wx < x + w - 12:
                if rng.random() > 0.4:
                    s.append(f'<rect x="{wx:.0f}" y="{wy:.0f}" width="9" height="11" '
                             f'fill="#ffcf8a" opacity="{rng.uniform(0.25, 1):.2f}"/>')
                wx += 16
            wy += 20
        x += w + rng.uniform(6, 18)
    s.append('</svg>')
    return s


rng = random.Random(104)          # same seed as plate-4, so the skylines match
parts = subject_skyline(rng)
open('public/subject-skyline.svg', 'w').write('\n'.join(parts))
print('wrote public/subject-skyline.svg')
