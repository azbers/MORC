r"""DAUR Supply: "Style Notes" series, the second daily post (13:30 Pakistan time), 2 to 14 November 2026.

Uses the owner's Unsplash model photos in Social Media\Models as they are (Unsplash licence: free commercial
use, no attribution required). Photos are styling guides; captions never call the shoes DAUR products.
Photo 6 is excluded (another brand's logo on the sole); photos 5 and 8 show no shoes.
Writes Instagram and Facebook Calendar folders: Post (1 or more slides), Caption.txt, Keywords.txt (alt text), postiz.json.
Run:  python make_style_notes.py
"""
import asyncio, html, json
from pathlib import Path
from playwright.async_api import async_playwright

SM = Path(__file__).resolve().parents[2]
PLAT, MOD = SM / "04 Platforms", SM / "Models"
FONTS = SM / "Product Photos" / "_builder" / "fonts"
furl = lambda p: Path(p).as_uri()
P = {1: "alireza-pandkhahi-Pf_ItvUfGVY-unsplash.jpg", 2: "alireza-pandkhahi-Z8xUKMB3wz4-unsplash.jpg",
     3: "alireza-pandkhahi-f0rC6RfA488-unsplash.jpg", 4: "alireza-pandkhahi-ysjFGpv5B2o-unsplash.jpg",
     7: "mohamad-khosravi-GjSI8GzF3Gs-unsplash.jpg", 9: "mohamad-khosravi-crTazp-cnq4-unsplash.jpg",
     10: "mohamad-khosravi-nOcyjCnITto-unsplash.jpg", 11: "mohamad-khosravi-sjG8lBBlXv4-unsplash.jpg",
     12: "mohamad-khosravi-zZxQm6td7CY-unsplash.jpg"}
TAGS = "#DAURSupply #MensStyle #MensLeatherShoes #FormalShoes #PakistaniMensFashion"
KW = "men's leather shoes Pakistan, formal shoes for men, how to style leather shoes, shoes with suit, men's style Pakistan, black lace up shoes, brown leather shoes"
FOOT = ("Style Notes from DAUR Supply. Men's leather shoes and sneakers from Pakistani workshops, "
        "Cash on Delivery across Pakistan. Drop 01 soon.")

S = [  # n, date, slides [(photo, bg position)], headline, caption body
 (1, "2026-11-02", [(1, "50% 100%")], "Olive suit. Black lace ups.",
  "Olive suit, black leather lace ups, black roll neck.\n\nBlack shoes keep olive sharp for the evening. Match the belt to the shoes and let the shoes be the darkest thing you wear."),
 (2, "2026-11-03", [(2, "50% 100%")], "Burgundy suit. Black shoes.",
  "Burgundy suit, navy tie, black leather lace ups.\n\nWhen the suit colour is strong, keep the shoes black and plain. A clean polish matters more than any detail."),
 (3, "2026-11-04", [(3, "50% 100%")], "Brown on brown, one shade darker.",
  "Brown three piece, dark brown lace ups.\n\nTone on tone works when the shoes are a shade darker than the suit. It reads calm and finished, never flat."),
 (4, "2026-11-05", [(4, "50% 100%")], "Dark suit. Dark shoes. Nothing loud.",
  "Dark brown suit, dark shirt, dark leather shoes.\n\nIn a quiet outfit the shoes carry the finish. Keep them polished and the whole look sharpens."),
 (5, "2026-11-06", [(7, "50% 100%")], "Olive suit. Brown shoes for the day.",
  "Olive suit with a patterned waistcoat and brown leather lace ups.\n\nBrown softens olive for daytime and weddings. Black would be the evening choice with the same suit."),
 (6, "2026-11-07", [(9, "50% 100%")], "Black tie means black, polished shoes.",
  "Dinner jacket, bow tie, black leather shoes.\n\nFormal evenings leave no room for brown. Black, polished and plain is the rule."),
 (7, "2026-11-08", [(10, "50% 100%")], "All black, black boots.",
  "Black shirt, black trousers, black leather boots.\n\nAll black works when the textures differ. Leather boots add weight at the bottom of the look."),
 (8, "2026-11-09", [(11, "50% 100%")], "Black three piece, black lace ups.",
  "Black three piece, gold patterned tie, black leather lace ups.\n\nWith a statement tie, keep the shoes simple so one thing speaks."),
 (9, "2026-11-10", [(12, "60% 80%")], "Leather sneakers, summer shorts.",
  "Light shirt, white shorts, black leather sneakers.\n\nLeather sneakers dress shorts up more than canvas ones. Keep the socks low and dark or hidden."),
 (10, "2026-11-11", [(1, "50% 100%"), (2, "50% 100%"), (11, "50% 100%")], "Black shoes, three suits.",
  "One pair of black leather lace ups, three suits: olive, burgundy and black.\n\nIf you buy one formal pair first, black goes with the most suits and every evening event."),
 (11, "2026-11-12", [(3, "50% 100%"), (7, "50% 100%")], "Brown shoes, two ways.",
  "Brown leather shoes, two suits: brown tone on tone, and olive for the day.\n\nBrown is the daytime partner to black. It works best with earthy colours."),
 (12, "2026-11-13", [(9, "50% 100%"), (10, "50% 100%"), (12, "60% 80%")], "Formal to off duty.",
  "Black tie, all black with boots, then shorts with leather sneakers.\n\nLeather in every setting is the thread. The shape changes, the material does not."),
 (13, "2026-11-14", [(4, "50% 100%"), (8 if False else 11, "50% 100%")], "Dark suits need dark shoes.",
  "Dark brown and black suits, both with dark leather shoes.\n\nThe darker the suit, the darker the shoe. It is the simplest rule in menswear and it rarely fails."),
]

def slide(photo, pos, head, n, i, total, w, h):
    f = "".join(f"@font-face{{font-family:'{a}';src:url('{furl(FONTS/b)}');font-weight:300 900}}" for a, b in (("Cinzel", "Cinzel.ttf"), ("Cormorant", "Cormorant.ttf")))
    tag = f"STYLE NOTES {n:02d}" + (f"  {i}/{total}" if total > 1 else "")
    show_head = i == 1
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>{f}
*{{margin:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;overflow:hidden;position:relative;background:#16110D url('{furl(MOD/P[photo])}') {pos}/cover no-repeat}}
.g{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,17,13,.82) 0%,rgba(22,17,13,.45) 24%,rgba(22,17,13,0) 42%,rgba(22,17,13,0) 100%)}}
.top{{position:absolute;top:52px;left:64px;font:600 30px Cinzel;letter-spacing:.42em;color:#E9CF92}}
.tag{{position:absolute;top:56px;right:56px;font:600 16px Cinzel;letter-spacing:.3em;color:#F5EEE4}}
.b{{position:absolute;left:68px;right:68px;top:120px}}
.h{{font:500 70px/1.02 Cormorant;color:#F8F1E6;text-shadow:0 2px 16px rgba(0,0,0,.5)}}
.r{{width:70px;height:2px;background:#C9A15A;margin:22px 0 0}}
</style></head><body><div class='g'></div><div class='top'>DAUR</div><div class='tag'>{tag}</div>
{f"<div class='b'><div class='h'>{html.escape(head)}</div><div class='r'></div></div>" if show_head else ""}</body></html>"""

async def main():
    tmp = PLAT / "_tools" / "_tmp_style.html"
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files"])
        for n, d, slides, head, body in S:
            imgs = []
            for i, (ph, pos) in enumerate(slides, 1):
                tmp.write_text(slide(ph, pos, head, n, i, len(slides), 1080, 1350), encoding="utf-8")
                pg = await b.new_page(viewport={"width": 1080, "height": 1350})
                await pg.goto(tmp.as_uri(), wait_until="load"); await pg.wait_for_timeout(900)
                imgs.append(await pg.screenshot()); await pg.close()
            cap = f"{head}\n\n{body}\n\n{FOOT}\n\nSave this for your next wedding or office day.\n\n{TAGS}"
            names = [f"Post {i} of {len(imgs)} 1080x1350.png" if len(imgs) > 1 else "Post 1080x1350.png" for i in range(1, len(imgs) + 1)]
            for platform in ("Instagram", "Facebook"):
                folder = PLAT / platform / "Calendar" / f"{d} Style {n:02d} {head.rstrip('.').replace(',', '')}"
                folder.mkdir(parents=True, exist_ok=True)
                for nm, data in zip(names, imgs): (folder / nm).write_bytes(data)
                (folder / "Caption.txt").write_text(
                    f"{platform.upper()}  |  {d}  |  STYLE NOTES {n:02d}\r\n\r\nCAPTION (copy and paste)\r\n{cap.replace(chr(10), chr(13)+chr(10))}\r\n\r\n"
                    f"ALT TEXT (Instagram: Advanced settings > Write alt text; Postiz cannot set it yet)\r\n{KW}\r\n\r\n"
                    f"PHOTO SOURCE\r\nUnsplash licence (free commercial use, no attribution required): Models\\{', Models\\'.join(P[s[0]] for s in slides)}\r\n"
                    f"Styling guide only; the shoes shown are not DAUR products and the caption does not say they are.\r\n", encoding="utf-8")
                (folder / "Keywords.txt").write_text(KW + "\n", encoding="utf-8")
                j = dict(platform=platform.lower(), series="style", n=n, title=head, date=d, alt_text=KW,
                         posts=[dict(kind="post", time=f"{d}T08:30:00.000Z", media=names, caption=cap)])
                (folder / "postiz.json").write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding="utf-8")
            print("style", n, d, head)
        await b.close()
    tmp.unlink(missing_ok=True)

if __name__ == "__main__":
    asyncio.run(main())
