"""DAUR Supply: turn real product photos into branded posts, Stories and ads.

Reads ../products.csv (one row per photo) and writes, for each row:
  Feed post 1080x1350, Story 1080x1920, Ad feed 1080x1350 and Ad story 1080x1920
into ../_Ready posts/<product> <colour>/.
The photo is never altered except for cropping to fit; prices come only from
the CSV. Rows with an empty price get no price on the image.

Run:  python build_posts.py           (from this _builder folder)
Needs: Python with the playwright package and Google Chrome (both on this PC).
"""
import asyncio, csv, html, os, sys, base64, re
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "_Ready posts"
FONTS = HERE / "fonts"

def data_uri(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()

def font_css():
    faces = []
    for fam, file in (("Archivo", "Archivo.ttf"), ("Inter", "Inter.ttf"),
                      ("JetBrains Mono", "JetBrainsMono.ttf"), ("Space Grotesk", "SpaceGrotesk.ttf")):
        faces.append(f"@font-face{{font-family:'{fam}';src:url('{data_uri(FONTS / file, 'font/ttf')}');font-weight:100 900;font-stretch:62% 125%}}")
    return "".join(faces)

def money(v):
    v = re.sub(r"[^0-9]", "", v or "")
    return f"Rs. {int(v):,}" if v else ""

def page(photo_uri, row, w, h, ad):
    e = html.escape
    price = money(row.get("price_rs"))
    sizes = e(row.get("sizes") or "")
    line = e(row.get("line") or "Same local craft. Zero retail markup.")
    band = 330 if h == 1350 else 520
    cta = ("<div class='cta'>Order on WhatsApp &nbsp;·&nbsp; Cash on Delivery</div>" if ad else
           "<div class='mono'>Cash on Delivery across Pakistan</div>")
    return f"""<html><head><style>{font_css()}
*{{margin:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;background:#16110D;color:#F5EEE4;font-family:Inter;overflow:hidden;position:relative}}
.ph{{position:absolute;inset:0 0 {band - 40}px 0;background:url('{photo_uri}') center/cover no-repeat}}
.fade{{position:absolute;left:0;right:0;bottom:{band - 40}px;height:220px;background:linear-gradient(rgba(22,17,13,0),#16110D)}}
.band{{position:absolute;left:0;right:0;bottom:0;height:{band}px;padding:0 72px 64px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px}}
.k{{font:600 22px 'JetBrains Mono';letter-spacing:.22em;text-transform:uppercase;color:#C89B5E}}
.n{{font:900 {64 if h == 1350 else 76}px/1.02 'Archivo';font-stretch:125%;text-transform:uppercase}}
.row{{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}}
.p{{font:700 54px 'Space Grotesk';color:#F5EEE4}}
.mono{{font:500 22px 'JetBrains Mono';letter-spacing:.14em;text-transform:uppercase;color:#BBA996}}
.cta{{align-self:flex-start;background:#B0843F;color:#16110D;font:700 26px 'Space Grotesk';padding:16px 26px;border-radius:6px}}
.logo{{position:absolute;top:56px;left:64px;width:150px}}
.rule{{width:90px;height:3px;background:#B0843F}}
</style></head><body>
<div class='ph'></div><div class='fade'></div>
<img class='logo' src='{data_uri(HERE / "lockup-hide.svg", "image/svg+xml")}'>
<div class='band'>
 <div class='k'>{e(row.get('colour') or '')}{' &nbsp;·&nbsp; ' + sizes if sizes else ''}</div>
 <div class='n'>{e(row['product'])}</div>
 <div class='rule'></div>
 <div class='row'><div class='mono'>{line}</div>{f"<div class='p'>{price}</div>" if price else ''}</div>
 {cta}
</div></body></html>"""

async def main():
    csv_path = ROOT / "products.csv"
    rows = [r for r in csv.DictReader(open(csv_path, encoding="utf-8-sig")) if (r.get("photo") or "").strip()]
    if not rows:
        print("products.csv has no rows yet. Add one row per photo, then run again.")
        return
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        for r in rows:
            src = ROOT / r["photo"].strip()
            if not src.exists():
                print("MISSING photo:", src); continue
            mime = "image/png" if src.suffix.lower() == ".png" else "image/jpeg"
            uri = data_uri(src, mime)
            name = re.sub(r'[\\/:*?"<>|]', "", f"{r['product']} {r.get('colour','')}".strip())
            d = OUT / name; d.mkdir(parents=True, exist_ok=True)
            for label, w, h, ad in (("Feed post 1080x1350", 1080, 1350, False), ("Story 1080x1920", 1080, 1920, False),
                                    ("Ad feed 1080x1350", 1080, 1350, True), ("Ad story 1080x1920", 1080, 1920, True)):
                pg = await b.new_page(viewport={"width": w, "height": h})
                await pg.set_content(page(uri, r, w, h, ad), wait_until="load")
                await pg.wait_for_timeout(300)
                await pg.screenshot(path=str(d / f"{src.stem} {label}.png"))
                await pg.close()
            print("made", d.name, "from", src.name)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
