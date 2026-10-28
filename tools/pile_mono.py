"""Rebuilds assets/pile.js as one colour men's pairs only (no heels).
Reads the bone versions in assets/pile-src (made by pile.py), recovers the line art
from them and repaints every pair in the same leather colour.
Usage: python3 tools/pile_mono.py [#fill] [#line]"""
import sys, io, json, base64
import numpy as np
from PIL import Image
ROOT = __file__.rsplit('/tools/', 1)[0]
FILL = sys.argv[1] if len(sys.argv) > 1 else '#B97A47'
LINE = sys.argv[2] if len(sys.argv) > 2 else '#2A1C14'
RIM = (245, 238, 228)
SHAPES = ['chunky', 'runner']
rgb = lambda h: np.array([int(h.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)], float)
res = []
for k in SHAPES:
    a = np.array(Image.open(f'{ROOT}/assets/pile-src/{k}-EDEBE4.png').convert('RGBA')).astype(float)
    t = np.clip((a[..., :3].min(axis=2) - 11) / 217, 0, 1)[..., None]  # 0 = ink line, 1 = upper
    out = a.copy()
    out[..., :3] = rgb(FILL) * t + rgb(LINE) * (1 - t)
    rim = a[..., 3] < 250
    out[rim, :3] = RIM
    img = Image.fromarray(out.astype(np.uint8), 'RGBA')
    q = img.quantize(colors=48, method=Image.Quantize.FASTOCTREE); b = io.BytesIO(); q.save(b, 'PNG', optimize=True)
    res.append({'k': k, 'r': round(img.height / img.width, 3), 'src': 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()})
    img.save(f'{ROOT}/assets/pile-src/{k}-mono.png')
open(f'{ROOT}/assets/pile.js', 'w').write(
    '/* DAUR footer pile sprites: the owner\'s men\'s sneaker icons (chunky and runner), repainted\n'
    f'   in one leather colour ({FILL}) by tools/pile_mono.py. r is height / width. */\n'
    'window.DAUR_PILE = ' + json.dumps(res) + ';\n')
print([(r['k'], r['r'], len(r['src']) // 1024) for r in res])
