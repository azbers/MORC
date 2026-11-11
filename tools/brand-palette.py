#!/usr/bin/env python3
"""Moves every colour in the storefront onto the DAUR brand card palette (2026-11-11).

Forest #172C27, Bone #F1EBDD, Carbon #252625, Brass #A58A64, Olive #6B7550.
Each colour keeps its lightness (so contrast between text and surface stays as it was)
and takes the hue and saturation of the palette colour its family maps to:
  warm darks (old espresso, browns under 30% lightness), dark greens  -> Forest
  creams and warm lights (over 80% lightness)                           -> Bone
  golds, tans, mid browns, oranges, pinks                               -> Brass
  reds (old "Supply" red, hearts, sale), volt, mid greens               -> Olive
Neutral greys, whites and blacks stay as they are. Social network colours stay as they are.
Run: python3 tools/brand-palette.py <files...>   (rewrites the files in place)
"""
import colorsys, re, sys

PAL = {'forest': (0x17, 0x2C, 0x27), 'bone': (0xF1, 0xEB, 0xDD), 'carbon': (0x25, 0x26, 0x25),
       'brass': (0xA5, 0x8A, 0x64), 'olive': (0x6B, 0x75, 0x50)}
EXACT = {  # the old brand anchors go straight to their new counterparts
    '2A1C14': 'forest', 'B0843F': 'brass', 'C8102E': 'olive', '9B0F1E': 'olive', 'F5EEE4': 'bone', '242321': 'carbon'}
FROZEN = {s.upper() for s in '25D366 128C7E 075E54 1877F2 E1306C F58529 DD2A7B 8134AF 515BD4 FEDA75 FA7E1E D62976 962FBF 4F5BD5 FE2C55 25F4EE FF0000 000000 FFFFFF'.split()}


def hls(rgb):
    return colorsys.rgb_to_hls(*[c / 255 for c in rgb])


def fam(rgb):
    h, l, s = hls(rgb)
    hd = h * 360
    if s < 0.10 or l < 0.03 or l > 0.985:
        return None                      # neutral: keep
    if 190 <= hd < 330:
        return None                      # blues and purples: keep (rare, functional)
    if hd >= 330 or hd < 14:             # reds and pinks
        if l > 0.80:
            return 'bone'
        return 'olive' if s > 0.35 else 'brass'
    if hd < 66:                          # oranges, golds, browns, creams
        if l < 0.30:
            return 'forest'
        if l > 0.80:
            return 'bone'
        return 'brass'
    if hd < 190:                         # volt, greens, teals
        if l < 0.27:
            return 'forest'
        if l > 0.85:
            return 'bone'
        return 'olive'
    return None


def remap(rgb):
    hexs = '%02X%02X%02X' % rgb
    if hexs in FROZEN:
        return rgb
    if hexs in EXACT:
        return PAL[EXACT[hexs]]
    f = fam(rgb)
    if not f:
        return rgb
    th, tl, ts = hls(PAL[f])
    h, l, s = hls(rgb)
    s2 = min(ts * 1.25, max(ts * 0.6, s * 0.6)) if f in ('forest', 'brass', 'olive') else min(ts, s)
    r, g, b = colorsys.hls_to_rgb(th, l, s2)
    return tuple(max(0, min(255, round(c * 255))) for c in (r, g, b))


def hx(rgb, n, case_up):
    s = '%02X%02X%02X' % rgb
    if n == 3 and all(s[i] == s[i + 1] for i in (0, 2, 4)):
        s = s[0] + s[2] + s[4]
    return s if case_up else s.lower()


HEX = re.compile(r'(#|%23)([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])')
RGBA = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')
TRIP = re.compile(r'(-rgb\s*:\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')


WORDS = {'add', 'bad', 'bed', 'fed', 'fab', 'cab', 'dab', 'dad', 'ace', 'bee', 'cafe', 'face', 'deed', 'feed'}


def sub_hex(m):
    v = m.group(2)
    if v in WORDS:
        return m.group(0)
    full = ''.join(c * 2 for c in v) if len(v) == 3 else v
    rgb = tuple(int(full[i:i + 2], 16) for i in (0, 2, 4))
    new = remap(rgb)
    if new == rgb:
        return m.group(0)
    return m.group(1) + hx(new, len(v), v.upper() == v)


def sub_trip(m):
    rgb = (int(m.group(2)), int(m.group(4)), int(m.group(6)))
    new = remap(rgb)
    if new == rgb:
        return m.group(0)
    return f'{m.group(1)}{new[0]}{m.group(3)}{new[1]}{m.group(5)}{new[2]}'


def run(path):
    s = open(path, encoding='utf-8').read()
    o = HEX.sub(sub_hex, s)
    o = RGBA.sub(sub_trip, o)
    o = TRIP.sub(sub_trip, o)
    if o != s:
        open(path, 'w', encoding='utf-8').write(o)
    return sum(1 for a, b in zip(s.split('\n'), o.split('\n')) if a != b)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(run(p), 'lines changed', p)
