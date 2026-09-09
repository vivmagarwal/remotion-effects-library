#!/usr/bin/env python3
"""Generates public/sample-city.svg — a dense night-city plate.

Deliberately full of fine, high-contrast detail (lit windows, stars, lamp posts),
because that is what makes a blur or a halftone screen legible. A smooth gradient
looks identical blurred and unblurred.
"""
import random

random.seed(7)
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">']
parts.append('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stop-color="#0b1030"/><stop offset="46%" stop-color="#3b2a6b"/>
 <stop offset="74%" stop-color="#b8546a"/><stop offset="100%" stop-color="#f0a05a"/>
</linearGradient>
<linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stop-color="#241c33"/><stop offset="100%" stop-color="#100b1a"/>
</linearGradient>
</defs>''')
parts.append('<rect width="1920" height="1080" fill="url(#sky)"/>')

for _ in range(220):
    x, y = random.uniform(0, 1920), random.uniform(0, 430)
    parts.append(
        f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(0.6, 1.9):.1f}" '
        f'fill="#fff" opacity="{random.uniform(0.15, 0.8):.2f}"/>'
    )


def skyline(base_y, colour, w_min, w_max, h_min, h_max, win_colour, win_opacity, step):
    x = -40
    while x < 1960:
        w, h = random.uniform(w_min, w_max), random.uniform(h_min, h_max)
        parts.append(
            f'<rect x="{x:.0f}" y="{base_y - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{colour}"/>'
        )
        wy = base_y - h + 14
        while wy < base_y - 16:
            wx = x + 8
            while wx < x + w - 12:
                if random.random() > 0.34:
                    parts.append(
                        f'<rect x="{wx:.0f}" y="{wy:.0f}" width="{step - 4}" height="{step - 6}" '
                        f'fill="{win_colour}" opacity="{random.uniform(0.25, win_opacity):.2f}"/>'
                    )
                wx += step
            wy += step + 3
        x += w + random.uniform(6, 22)


skyline(770, '#2b2246', 46, 96, 130, 320, '#ffd9a0', 0.55, 13)
skyline(830, '#1d1733', 56, 118, 180, 400, '#ffcf8a', 0.80, 15)
skyline(900, '#120e20', 70, 150, 230, 470, '#ffc46e', 1.00, 18)

parts.append('<rect x="0" y="900" width="1920" height="180" fill="url(#road)"/>')
for i in range(11):
    parts.append(f'<rect x="{40 + i * 180}" y="980" width="108" height="9" rx="4" fill="#ffe9b8" opacity="0.6"/>')
for i in range(9):
    x = 90 + i * 220
    parts.append(f'<rect x="{x}" y="806" width="6" height="100" fill="#0c0916"/>')
    parts.append(f'<circle cx="{x + 3}" cy="800" r="13" fill="#ffe1a0" opacity="0.9"/>')
    parts.append(f'<circle cx="{x + 3}" cy="800" r="34" fill="#ffe1a0" opacity="0.16"/>')

parts.append('</svg>')
open('public/sample-city.svg', 'w').write('\n'.join(parts))
print('wrote public/sample-city.svg')
