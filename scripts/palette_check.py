#!/usr/bin/env python3
"""
Measures how distinguishable the skill colors in app/src/theme.ts are, for
normal vision and for protanopia / deuteranopia / tritanopia simulations
(Machado et al. 2009, full severity), on both themes.

Distance is Euclidean in OKLab x 100. Shapes also encode each category, so
the bar is "distinguishable at a glance", not "identical to normal vision":
fails if any pair is closer than MIN_PAIR, or any non-white color is closer
than MIN_BG to its theme's background.
"""

import itertools
import math
import re
import sys
from pathlib import Path

THEME = Path(__file__).resolve().parent.parent / "app" / "src" / "theme.ts"
BACKGROUNDS = {"dark": "#0B0B0F", "light": "#F7F7FB"}
MIN_PAIR = 7.0
MIN_BG = 15.0

MATS = {
    "normal": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    "protan": [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    "deutan": [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    "tritan": [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
}


def parse_palette():
    text = THEME.read_text()
    palette = {}
    for theme in ("dark", "light"):
        block = re.search(rf"{theme}: \{{(.*?)\}}", text, re.S).group(1)
        palette[theme] = dict(re.findall(r'(\w+): "(#[0-9A-Fa-f]{6})"', block))
    return palette


def linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def oklab(rgb):
    r, g, b = rgb
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def simulate(hex_color, mode):
    rgb = [linear(int(hex_color[i : i + 2], 16) / 255) for i in (1, 3, 5)]
    m = MATS[mode]
    return oklab([max(0, min(1, sum(m[i][j] * rgb[j] for j in range(3)))) for i in range(3)])


def distance(a, b):
    return 100 * math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def main():
    failures = []
    for theme, colors in parse_palette().items():
        bg = BACKGROUNDS[theme]
        print(f"{theme} (background {bg})")
        for mode in MATS:
            labs = {n: simulate(c, mode) for n, c in colors.items()}
            pairs = sorted((distance(labs[a], labs[b]), a, b) for a, b in itertools.combinations(labs, 2))
            bg_lab = simulate(bg, mode)
            vs_bg = sorted((distance(labs[n], bg_lab), n) for n in labs if n != "white")
            print(f"  {mode:7s} closest pair {pairs[0][0]:5.1f} ({pairs[0][1]}/{pairs[0][2]}), closest to background {vs_bg[0][0]:5.1f} ({vs_bg[0][1]})")
            if pairs[0][0] < MIN_PAIR:
                failures.append(f"{theme}/{mode}: {pairs[0][1]} and {pairs[0][2]} are only {pairs[0][0]:.1f} apart")
            if vs_bg[0][0] < MIN_BG:
                failures.append(f"{theme}/{mode}: {vs_bg[0][1]} is only {vs_bg[0][0]:.1f} from the background")
    if failures:
        print("\n".join(["", *failures]))
        sys.exit(1)
    print(f"ok: every pair is at least {MIN_PAIR} apart")


if __name__ == "__main__":
    main()
