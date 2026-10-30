r"""DAUR Supply: build the pre-launch series (Pre 01 to Pre 08).

Writes into 04 Platforms\<Instagram|Facebook|WhatsApp>\Calendar\<date> Pre NN <title>\
  Post 1080x1350.png, Story 1080x1920.png, Caption.txt, postiz.json
  (WhatsApp gets Status 1080x1920.png and Status.txt).
Visuals use only the DAUR logo files and the DAUR packaging design renders in
05 Packaging. Run from anywhere:  python make_prelaunch.py
"""
import asyncio, html, json, os, tempfile
from datetime import date
from pathlib import Path
from playwright.async_api import async_playwright

SM = Path(__file__).resolve().parents[2]          # ...\Social Media
PLAT = SM / "04 Platforms"
MOCK = SM / "05 Packaging" / "00 Mockups (4K 3840x2160)"
FONTS = SM / "Product Photos" / "_builder" / "fonts"
LOGO = SM / "Logos" / "SVG"
TAGS = "#DAURSupply #NayaDaur #MensShoes #LeatherShoes #Pakistan"
RENDER_NOTE = "Design render. Real photos when the first kits are made."

SERIES = [
 dict(n=1, d="2026-10-31", t="Naya daur", kind="logo", k="DAUR Supply",
      h="Naya daur.", s="Men's leather shoes and sneakers from Pakistani workshops. Coming soon.",
      cap="Naya daur. A new turn.\nDAUR Supply brings men's leather shoes and sneakers straight from Pakistani workshops, without the retail markup in between.\nThe first drop is on its way. Follow so you see it first.\n" + TAGS),
 dict(n=2, d="2026-11-02", t="The name", kind="urdu", k="The name",
      h="Daur.", s="An era. A new turn. A full round.",
      cap="Why DAUR?\nدور means an era, a new turn, a full round. Good shoes have always been made in local workshops; the new turn is buying them without paying for someone else's logo and markup.\nNaya daur.\n" + TAGS),
 dict(n=3, d="2026-11-04", t="The box", kind="photo", img="01 Box hero.png", pos="55% 50%", k="First look",
      h="The box.", s="Heavy matte black, brass mark, nothing loud.",
      cap="First look at the DAUR box.\nHeavy matte black board, the loop D in brass, and every pair packed by hand inside.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=4, d="2026-11-06", t="Branded not labeled", kind="photo", img="06 Brass lace tag on lace.png", pos="50% 55%", k="Branded, not labeled",
      h="The mark lives on the hardware.", s="Brass DAUR lace tag, thick matte black laces.",
      cap="Branded, not labeled.\nNo logo printed on the leather. The DAUR mark sits on a brass lace tag on the bottom row, threaded on thick matte black cotton laces that replace the factory pair.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=5, d="2026-11-08", t="Zero retail markup", kind="photo", img="04 Box open with tissue and card.png", pos="50% 45%", k="The promise",
      h="Same local craft. Zero retail markup.", s="Workshop finished pairs, checked by hand, boxed for you.",
      cap="Same local craft. Zero retail markup.\nMany shoes sold under big names start in the same kind of local workshops. Retail adds its markup on the way to you. We visit the workshops, choose finished pairs, check every pair by hand, then re-lace, tag, seal and box it. You pay for the shoe, not the markup.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=6, d="2026-11-10", t="Supply Unit seal", kind="photo", img="07 Supply Unit seal front and back.png", pos="50% 62%", k="The seal",
      h="Keep the seal on.", s="The DAUR SUPPLY UNIT seal on the top eyelet. It makes a size exchange easy.",
      cap="The DAUR SUPPLY UNIT seal.\nEvery pair leaves with a numbered seal on the top eyelet. Keep it on until you are sure of the size: a size exchange within 5 days of delivery needs the pair unworn, in its box, with the seal attached.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=7, d="2026-11-12", t="The manifest", kind="photo", img="05 Manifest Card front and back.png", pos="50% 50%", k="In every box",
      h="Every box carries a manifest.", s="What we stand for, and your terms, on one card.",
      cap="Every DAUR box carries a Manifest Card.\nOne side says why we exist. The other lists your terms in plain words: 5 day size exchange, 30 days on defects, 48 hours to report a wrong or damaged item. At least 5% of our profit goes to verified cases in need.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=8, d="2026-11-14", t="Drop 01 is close", kind="photo", img="11 Full kit flat lay.png", pos="45% 50%", k="Drop 01",
      h="Drop 01 is close.", s="Follow, or message us on WhatsApp to hear first.",
      cap="Drop 01 is close.\nThe full DAUR kit: box, grid tissue, matte black laces, brass tag, Supply Unit seal and Manifest Card. The first pairs come next.\nWant to hear first? Message us on WhatsApp: 0319 9628735, or follow @daursupply.\n" + RENDER_NOTE + "\n" + TAGS),
]

def furl(p): return Path(p).as_uri()

def page_html(it, w, h):
    e = html.escape
    fonts = "".join(f"@font-face{{font-family:'{f}';src:url('{furl(FONTS/fn)}');font-weight:100 900;font-stretch:62% 125%}}"
                    for f, fn in (("Archivo","Archivo.ttf"),("Inter","Inter.ttf"),("JetBrains Mono","JetBrainsMono.ttf"),("Space Grotesk","SpaceGrotesk.ttf")))
    story = h == 1920
    band = 560 if story else 420
    if it["kind"] == "photo":
        hero = (f"<div class='ph' style=\"background-image:url('{furl(MOCK/it['img'])}');background-position:{it['pos']}\"></div>"
                f"<div class='fade'></div><div class='note'>Design render</div>")
        body_cls = "photo"
    elif it["kind"] == "logo":
        hero = f"<img class='big' src='{furl(LOGO/'DAUR Symbol Brass.svg')}'>"; body_cls = "plain"
    else:
        hero = "<div class='urdu'>دور</div>"; body_cls = "plain"
    head = e(it["h"])
    hs = 96 if story else 82
    if len(it["h"]) > 20: hs = 74 if story else 62
    follow = "<div class='mono f'>Follow @daursupply</div>" if story else ""
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>{fonts}
*{{margin:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;overflow:hidden;position:relative;color:#F5EEE4;font-family:Inter;
 background:radial-gradient(120% 80% at 50% 30%,#3A281C 0%,#2A1C14 45%,#16110D 100%)}}
.ph{{position:absolute;left:0;right:0;top:0;bottom:{band-60}px;background-size:cover}}
.fade{{position:absolute;left:0;right:0;bottom:{band-60}px;height:260px;background:linear-gradient(rgba(22,17,13,0),#16110D)}}
body.photo::after{{content:'';position:absolute;left:0;right:0;bottom:0;height:{band-60}px;background:#16110D;z-index:0}}
.note{{position:absolute;top:{64 if story else 56}px;right:64px;font:500 18px 'JetBrains Mono';letter-spacing:.18em;text-transform:uppercase;
 color:#F5EEE4;background:rgba(22,17,13,.55);padding:8px 12px;border-radius:4px}}
.logo{{position:absolute;top:{64 if story else 56}px;left:64px;width:150px;z-index:2}}
.big{{position:absolute;left:50%;top:{560 if story else 430}px;width:{560 if story else 470}px;transform:translate(-50%,-50%)}}
.urdu{{position:absolute;left:0;right:0;top:{330 if story else 220}px;text-align:center;font:700 {360 if story else 300}px/1 'Segoe UI';color:#C89B5E}}
.band{{position:absolute;left:0;right:0;bottom:0;height:{band}px;padding:0 72px {100 if story else 70}px;display:flex;flex-direction:column;justify-content:flex-end;gap:18px;z-index:1}}
.k{{font:600 22px 'JetBrains Mono';letter-spacing:.22em;text-transform:uppercase;color:#C89B5E}}
.h{{font:900 {hs}px/1.02 'Archivo';font-stretch:125%;text-transform:uppercase}}
.rule{{width:90px;height:3px;background:#B0843F}}
.s{{font:500 30px/1.35 'Inter';color:#E9DED0;max-width:900px}}
.mono{{font:500 21px 'JetBrains Mono';letter-spacing:.16em;text-transform:uppercase;color:#BBA996}}
.f{{color:#C89B5E}}
</style></head><body class='{body_cls}'>
{hero}
<img class='logo' src='{furl(LOGO/'DAUR Lockup Hide.svg')}'>
<div class='band'><div class='k'>{e(it['k'])}</div>{f"<div class='h'>{head}</div>" if head else ''}<div class='rule'></div>
<div class='s'>{e(it['s'])}</div>{'' if it['h'].startswith('Same local craft') else "<div class='mono'>Same local craft. Zero retail markup.</div>"}{follow}</div>
</body></html>"""

def weekday(d): return date.fromisoformat(d).strftime("%A %d %B %Y").replace(" 0", " ")

def write_texts(folder, platform, it, files):
    title = f"PRE {it['n']:02d}  {it['t'].upper()}"
    if platform == "WhatsApp":
        (folder/"Status.txt").write_text(
            f"WHATSAPP STATUS  |  {weekday(it['d'])}  |  {title}\n\nPost \"Status 1080x1920.png\" with this text:\n{it['cap'].splitlines()[0]} Follow @daursupply on Instagram.\n\n"
            "WhatsApp Status cannot be scheduled by any tool from a computer. Post it from the phone,\nWhatsApp Business > Updates > My status. It stays up for 24 hours.\n", encoding="utf-8")
        return
    stories = ("Story 20:45, scheduled in Postiz." if platform == "Instagram"
               else "Facebook Stories are posted by hand from Meta Business Suite.")
    (folder/"Caption.txt").write_text(
        f"{platform.upper()}  |  {weekday(it['d'])}  |  {title}\n\nPRE-LAUNCH SERIES\nPosted before the real pairs are photographed, to build followers. "
        "Visuals are the real DAUR logo and the DAUR packaging design renders; every caption says so.\n\n"
        f"CAPTION (copy and paste)\n{it['cap']}\n\nSCHEDULED IN POSTIZ\nFeed post 20:30 Pakistan time. {stories}\n\n"
        "STORY\nPost \"Story 1080x1920.png\". Add a poll or question sticker, for example \"Sneakers or leather shoes first?\"\n\n"
        "AFTER POSTING\nReply to every comment and DM the same day. Early replies are what turns a new follower into a buyer.\n", encoding="utf-8")
    posts = [dict(kind="post", time=f"{it['d']}T15:30:00.000Z", media=["Post 1080x1350.png"], caption=it["cap"])]
    if platform == "Instagram":
        posts.append(dict(kind="story", time=f"{it['d']}T15:45:00.000Z", media=["Story 1080x1920.png"], caption=""))
    (folder/"postiz.json").write_text(json.dumps(dict(platform=platform.lower(), day=0, pre=it["n"], title=it["t"], date=it["d"],
        needs_check=False, posts=posts), indent=2), encoding="utf-8")

async def main():
    tmp = Path(tempfile.mkdtemp())
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files"])
        for it in SERIES:
            name = f"{it['d']} Pre {it['n']:02d} {it['t']}"
            imgs = {}
            for label, w, h in (("Post 1080x1350.png", 1080, 1350), ("Story 1080x1920.png", 1080, 1920)):
                f = tmp/f"p{it['n']}_{h}.html"; f.write_text(page_html(it, w, h), encoding="utf-8")
                pg = await b.new_page(viewport={"width": w, "height": h})
                await pg.goto(f.as_uri(), wait_until="load"); await pg.wait_for_timeout(500)
                imgs[label] = await pg.screenshot(); await pg.close()
            for platform in ("Instagram", "Facebook", "WhatsApp"):
                folder = PLAT/platform/"Calendar"/name; folder.mkdir(parents=True, exist_ok=True)
                if platform == "WhatsApp":
                    (folder/"Status 1080x1920.png").write_bytes(imgs["Story 1080x1920.png"])
                else:
                    for k, v in imgs.items(): (folder/k).write_bytes(v)
                write_texts(folder, platform, it, imgs)
            print("made", name)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
