r"""DAUR Supply: pre-launch series, version 2 (carousels with life).

Each post becomes a 2 slide carousel: slide 1 is a full bleed photograph (licensed mood
photography of leather craft, or the DAUR kit render) with the headline on the image; slide 2 is
the existing designed card from make_prelaunch.py. Stories use slide 1 in 9:16.
Mood photos come only from "Product Photos\_mood (Pexels licence)" (no faces, no brands).
Old files are kept in "_old 2026-10-30" inside each folder. Pre 01 is skipped (already published).
Run:  python make_prelaunch_v2.py
"""
import asyncio, html, json, shutil
from pathlib import Path
from playwright.async_api import async_playwright
import make_prelaunch as v1

SM, PLAT, MOCK = v1.SM, v1.PLAT, v1.MOCK
MOOD = SM / "Product Photos" / "_mood (Pexels licence)"
furl = v1.furl

# slide 1 photo per post: (file, folder, background-position, overlay headline, credit tag)
HERO = {
 2: (MOOD / "pexels-3801349.jpg", "50% 45%", "A new turn for an old craft.", "Mood photo"),
 3: (MOCK / "Box 00 Hero three quarter.png", "50% 38%", "The box.", "Design render"),
 4: (MOOD / "pexels-4173291.jpg", "50% 50%", "Leather, cut by hand.", "Mood photo"),
 5: (MOOD / "pexels-6653226.jpg", "60% 50%", "You pay for the leather. Not the logo.", "Mood photo"),
 6: (MOOD / "pexels-30989203.jpg", "50% 50%", "Every pair leaves sealed.", "Mood photo"),
 7: (MOOD / "pexels-34850982.jpg", "50% 50%", "Read the card. Keep the terms.", "Mood photo"),
 8: (MOCK / "Box 07 Open, tissue closed with the round sticker.png", "50% 45%", "Drop 01 is close.", "Design render"),
}

def photo_slide(img, pos, head, tag, w, h):
    fonts = "".join(f"@font-face{{font-family:'{f}';src:url('{furl(v1.FONTS/fn)}');font-weight:300 900}}"
                    for f, fn in (("Cinzel", "Cinzel.ttf"), ("Cormorant", "Cormorant.ttf")))
    story = h == 1920
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>{fonts}
*{{margin:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;overflow:hidden;position:relative;background:#16110D url('{furl(img)}') {pos}/cover no-repeat}}
.g{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,17,13,.45) 0%,rgba(22,17,13,0) 22%,rgba(22,17,13,0) 50%,rgba(22,17,13,.88) 100%)}}
.top{{position:absolute;top:{64 if story else 56}px;left:70px;font:600 32px Cinzel;letter-spacing:.42em;color:#E9CF92}}
.tag{{position:absolute;top:{64 if story else 56}px;right:60px;font:600 16px Cinzel;letter-spacing:.3em;color:#F5EEE4;border:1px solid rgba(245,238,228,.55);padding:8px 12px}}
.b{{position:absolute;left:76px;right:76px;bottom:{170 if story else 90}px}}
.h{{font:500 {98 if story else 84}px/1.0 Cormorant;color:#F8F1E6;text-shadow:0 2px 18px rgba(0,0,0,.45)}}
.r{{width:80px;height:2px;background:#C9A15A;margin:26px 0 18px}}
.l{{font:500 19px Cinzel;letter-spacing:.32em;color:#E6D9C7}}
.sw{{font:500 19px Cinzel;letter-spacing:.32em;color:#E9CF92;margin-top:14px}}
</style></head><body><div class='g'></div><div class='top'>DAUR</div><div class='tag'>{html.escape(tag.upper())}</div>
<div class='b'><div class='h'>{html.escape(head)}</div><div class='r'></div><div class='l'>SAME LOCAL CRAFT. ZERO RETAIL MARKUP.</div>
{"<div class='sw'>SWIPE &#8250;</div>" if not story else "<div class='sw'>FOLLOW @DAURSUPPLY</div>"}</div></body></html>"""

async def render(b, html_text, w, h, tmp):
    tmp.write_text(html_text, encoding="utf-8")
    pg = await b.new_page(viewport={"width": w, "height": h})
    await pg.goto(tmp.as_uri(), wait_until="load"); await pg.wait_for_timeout(700)
    data = await pg.screenshot(); await pg.close(); return data

async def main():
    tmp = PLAT / "_tools" / "_tmp_slide.html"
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files"])
        for it in v1.SERIES:
            if it["n"] not in HERO: continue
            img, pos, head, tag = HERO[it["n"]]
            s1 = await render(b, photo_slide(img, pos, head, tag, 1080, 1350), 1080, 1350, tmp)
            st = await render(b, photo_slide(img, pos, head, tag, 1080, 1920), 1080, 1920, tmp)
            s2 = await render(b, v1.page_html(it, 1080, 1350), 1080, 1350, tmp)
            name = f"{it['d']} Pre {it['n']:02d} {it['t']}"
            for platform in ("Instagram", "Facebook", "WhatsApp"):
                folder = PLAT / platform / "Calendar" / name
                old = folder / "_old 2026-10-30"; old.mkdir(parents=True, exist_ok=True)
                for f in list(folder.glob("*.png")):
                    if (old / f.name).exists(): f.unlink()   # keep the first archived original
                    else: shutil.move(str(f), str(old / f.name))
                if platform == "WhatsApp":
                    (folder / "Status 1080x1920.png").write_bytes(st); continue
                (folder / "Post 1 of 2 1080x1350.png").write_bytes(s1)
                (folder / "Post 2 of 2 1080x1350.png").write_bytes(s2)
                (folder / "Story 1080x1920.png").write_bytes(st)
                pj = folder / "postiz.json"; j = json.loads(pj.read_text(encoding="utf-8"))
                for post in j["posts"]:
                    if post["kind"] == "post": post["media"] = ["Post 1 of 2 1080x1350.png", "Post 2 of 2 1080x1350.png"]
                j["version"] = 2; j["visual_sources"] = f"{img.name} ({tag}); see Product Photos\\_mood (Pexels licence)\\Sources.txt"
                pj.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding="utf-8")
                cap = folder / "Caption.txt"
                if cap.exists():
                    t = cap.read_text(encoding="utf-8").replace('Post "Story 1080x1920.png"', 'Carousel: "Post 1 of 2" then "Post 2 of 2". Story: "Story 1080x1920.png"')
                    cap.write_text(t, encoding="utf-8")
            print("v2", name)
        await b.close()
    tmp.unlink(missing_ok=True)

if __name__ == "__main__":
    asyncio.run(main())
