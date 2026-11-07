import sys, os
from PIL import Image
from rembg import remove, new_session
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
s = new_session("isnet-general-use")
for f in sorted(os.listdir(src)):
    name = f.rsplit(".",1)[0]
    if name.startswith("hero"): continue
    im = Image.open(os.path.join(src,f)).convert("RGB")
    cut = remove(im, session=s)
    bb = cut.getbbox()
    if bb: cut = cut.crop(bb)
    cut.thumbnail((1000,1000))
    cut.save(os.path.join(out, name + ".png"), optimize=True)
    print("cut", name, cut.size)
