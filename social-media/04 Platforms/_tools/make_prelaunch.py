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
MOCK = SM / "05 Packaging" / "00 Mockups"
TEXS = SM / "Logos" / "Leather textures (CC0, Poly Haven)"
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
 dict(n=3, d="2026-11-04", t="The box", kind="photo", img="Box 00 Hero three quarter.png", pos="50% 38%", k="First look",
      h="The box.", s="Espresso leather finish, one brass mark, nothing loud.",
      cap="First look at the DAUR box.\nAn espresso leather finish, DAUR in brass on the lid, and every pair packed by hand inside, in cream tissue with the Manifest Card on top.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=4, d="2026-11-06", t="Branded not labeled", kind="photo", img="Flat lay brass lace tag and round sticker.jpg", pos="40% 40%", k="Branded, not labeled",
      h="The mark lives on the hardware.", s="Brass DAUR lace tag, thick matte black laces.",
      cap="Branded, not labeled.\nNo logo printed on the leather. The DAUR mark sits on a brass lace tag on the bottom row, threaded on thick matte black cotton laces that replace the factory pair.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=5, d="2026-11-08", t="Zero retail markup", kind="photo", img="Box 07 Open, tissue closed with the round sticker.png", pos="50% 42%", k="The promise",
      h="Same local craft. Zero retail markup.", s="Workshop finished pairs, checked by hand, boxed for you.",
      cap="Same local craft. Zero retail markup.\nMany shoes sold under big names start in the same kind of local workshops. Retail adds its markup on the way to you. We visit the workshops, choose finished pairs, check every pair by hand, then re-lace, tag, seal and box it. You pay for the shoe, not the markup.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=6, d="2026-11-10", t="Supply Unit seal", kind="photo", img="Flat lay Supply Unit seal front and back.jpg", pos="50% 50%", k="The seal",
      h="Keep the seal on.", s="The DAUR SUPPLY UNIT seal on the top eyelet. It makes a size exchange easy.",
      cap="The DAUR SUPPLY UNIT seal.\nEvery pair leaves with a numbered seal on the top eyelet. Keep it on until you are sure of the size: a size exchange within 5 days of delivery needs the pair unworn, in its box, with the seal attached.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=7, d="2026-11-12", t="The manifest", kind="photo", img="Flat lay Manifest Card front and back.jpg", pos="50% 35%", k="In every box",
      h="Every box carries a manifest.", s="What we stand for, and your terms, on one card.",
      cap="Every DAUR box carries a Manifest Card.\nOne side says why we exist. The other lists your terms in plain words: 5 day size exchange, 30 days on defects, 48 hours to report a wrong or damaged item. At least 5% of our profit goes to verified cases in need.\n" + RENDER_NOTE + "\n" + TAGS),
 dict(n=8, d="2026-11-14", t="Drop 01 is close", kind="photo", img="Box 01 Top (lid).png", pos="50% 40%", k="Drop 01",
      h="Drop 01 is close.", s="Follow, or message us on WhatsApp to hear first.",
      cap="Drop 01 is close.\nThe DAUR kit is set: the espresso box, brass lace tag, matte black laces, Supply Unit seal and Manifest Card. The first pairs come next.\nWant to hear first? Message us on WhatsApp: 0319 9628735, or follow @daursupply.\n" + RENDER_NOTE + "\n" + TAGS),
]

def furl(p): return Path(p).as_uri()

def page_html(it, w, h):
    e = html.escape
    fonts = "".join(f"@font-face{{font-family:'{f}';src:url('{furl(FONTS/fn)}');font-weight:300 900}}"
                    for f, fn in (("Cinzel","Cinzel.ttf"),("Cormorant","Cormorant.ttf"),("CormorantI","CormorantItalic.ttf")))
    story = h == 1920
    band = 640 if story else 470
    esp, hide = furl(TEXS/"tex_espresso.jpg"), furl(TEXS/"tex_hide.jpg")
    sym = ("<svg viewBox='-20 0 220 200' class='sym'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#7A5A2A'/>"
           "<stop offset='.45' stop-color='#C9A15A'/><stop offset='.55' stop-color='#EBD49A'/><stop offset='1' stop-color='#7A5A2A'/></linearGradient></defs>"
           "<g fill='url(#g)'><g transform='skewX(-14)'><path d='M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z'/></g></g></svg>")
    if it["kind"] == "photo":
        hero = (f"<div class='ph' style=\"background-image:url('{furl(MOCK/it['img'])}');background-position:{it['pos']}\"></div>"
                f"<div class='note'>Design render</div>")
    elif it["kind"] == "logo":
        hero = f"<div class='mark'>{sym}<div class='wm'>DAUR</div><div class='sp'>SUPPLY</div></div>"
    else:
        hero = "<div class='urdu'>دور</div>"
    follow = "<div class='k f'>Follow @daursupply</div>" if story else ""
    hs = 92 if story else 78
    if len(it["h"]) > 22: hs = 70 if story else 60
    plain = it["kind"] != "photo"
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>{fonts}
*{{margin:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;overflow:hidden;position:relative;color:#F5EEE4;background:url({esp}) 0 0/900px}}
body::before{{content:'';position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 35%,rgba(255,220,180,.08),rgba(0,0,0,.45))}}
.ph{{position:absolute;left:0;right:0;top:0;bottom:{band}px;background-size:cover;background-color:#E7DFD3;border-bottom:3px solid #B0843F}}
.note{{position:absolute;top:{60 if story else 52}px;right:60px;font:600 17px Cinzel;letter-spacing:.3em;color:#2A1C14;background:rgba(245,238,228,.82);padding:9px 14px;border-radius:3px}}
.mark{{position:absolute;left:0;right:0;top:{250 if story else 150}px;display:flex;flex-direction:column;align-items:center;gap:26px}}
.sym{{width:{300 if story else 250}px}}
.wm{{font:600 {120 if story else 100}px Cinzel;letter-spacing:.42em;padding-left:.42em;color:#D7B26A}}
.sp{{font:500 26px Cinzel;letter-spacing:.8em;padding-left:.8em;color:#CDBFAE}}
.urdu{{position:absolute;left:0;right:0;top:{360 if story else 230}px;text-align:center;font:700 {340 if story else 290}px/1 'Segoe UI';color:#D7B26A}}
.band{{position:absolute;left:0;right:0;bottom:0;height:{band}px;padding:0 76px {110 if story else 72}px;display:flex;flex-direction:column;justify-content:flex-end;gap:20px}}
.k{{font:600 21px Cinzel;letter-spacing:.34em;color:#D7B26A}}
.h{{font:500 {hs}px/1.02 Cormorant;color:#F5EEE4}}
.rule{{width:80px;height:2px;background:#B0843F}}
.s{{font:400 34px/1.3 CormorantI;color:#E6D9C7;max-width:900px}}
.line{{font:500 18px Cinzel;letter-spacing:.3em;color:#BBA996}}
.top{{position:absolute;top:{60 if story else 52}px;left:70px;font:600 30px Cinzel;letter-spacing:.42em;color:{'#D7B26A' if plain else '#2A1C14'}}}
.f{{color:#D7B26A}}
</style></head><body>
{hero}
<div class='top'>DAUR</div>
<div class='band'><div class='k'>{e(it['k'].upper())}</div><div class='h'>{e(it['h'])}</div><div class='rule'></div>
<div class='s'>{e(it['s'])}</div>{'' if it['h'].startswith('Same local craft') else "<div class='line'>SAME LOCAL CRAFT. ZERO RETAIL MARKUP.</div>"}{follow}</div>
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
