# DAUR Supply: Complete Project Memory

Compiled on 29 October 2026 from every thread of the original Claude project "DAUR Supply", the shared project files, the Shopify store (read live on 29 October 2026) and the GitHub repository azbers/MORC. Load this file into a new Claude project as the starting context. Facts are stated as they stood on that date; anything marked "estimate" or "unverified" was never confirmed.

No passwords, passcodes or secrets are written here. See section 18 for where they are kept.

---

## 1. How to work with the owner (read first)

* **Owner:** Azbers (GitHub login `azbers`). Works a day job where phone use is not allowed, so wants the store to run with minimal manual work.
* **Tone:** formal, professional, honest. No flattery.
* **No dashes** anywhere in replies or written copy (no em dashes, no dash separators in prose).
* **No unverified claims.** Every figure or fact must be real and sourced; if something is unknown or cannot be checked, say so plainly or apologise. Never invent prices, stock, dates, materials or results.
* Answer only what is asked, clearly and briefly. Lead with the answer.
* The owner often pastes Shopify screens or default Liquid code and says "now for X"; the expected output is a complete, ready to paste replacement in DAUR style that keeps every case from Shopify's default.
* The owner wants research based decisions with sources, and expects Claude to act as business partner, creative director, ad manager and marketing lead.

---

## 2. Brand identity

### Name history
1. **M.O.R.C. / M.O.R.C. Supply** (19 to 26 October 2026). Dropped because "MORC" was hard to say aloud.
2. Name research (thread "Brand name research", and inside "Rebrand to DAUR Supply and list products"):
   * Round 1 (21 Oct): DAUR, QADAM, ZORR, NOYZA, RUKKO. TEZZ and DREKO dropped (US Class 25 applications exist). Page: https://claude.ai/artifact/LsT3DQkYrrr8GnpSTygwGE
   * Round 2 and 3 (26 Oct, plain Urdu words, buyer trust view, European benchmark such as VEJA and Grenson): PAKKA, DAUR, NAQSH, KHARA. QADAM dropped (Qadam Peshawari Chappal sells leather footwear). Page: https://claude.ai/artifact/ENbFyZWeBDVzvfBroxgJm7 (file `brand/name-shortlist.html`).
3. **FINAL (26 October 2026): DAUR Supply** (Urdu دور, meaning era, a new turn, a round). Known clash: daur.shop is a Karachi watch retailer; Caro Daur (German influencer) dominates search results for "daur".

### Core lines
* Line: **"Naya daur"**
* Promise / slogan: **"Same local craft. Zero retail markup."**
* Positioning line: **"Branded, not labeled"** (the mark lives on the hardware, not a printed logo). Never say "not branded" or "unbranded".
* Home headline (premium voice theme): "Wear the craft. Own the room."
* Voice: refined, confident, affordable luxury in the manner of Nike, adidas and premium labels. No "cheap", no hedging, no "kicks", no "wholesale" in titles.
* Short description: Men's leather shoes and sneakers from Pakistani workshops at factory price. Cash on Delivery across Pakistan.

### Logo
* Final: the **"loop D"** symbol (a forward leaning D whose bowl wraps without closing; reads as D, a round, and a sneaker side view) plus a custom drawn, heavy, forward leaning **DAUR** wordmark. Use DAUR alone on the logo and the lace tag.
* Uniqueness was checked by eye only against Nike, adidas, Puma, New Balance, Under Armour, ASICS, DC Shoes and Dunlop. Closest is the Dunlop "flying D". **No legal trademark search done** (WIPO and IPO Pakistan were unreachable). Owner should run a WIPO image search and consult a trademark agent before printing boxes.
* Logo page: https://claude.ai/artifact/4eQKmew8EoFoDMXcvACkvs
* Identity page: https://claude.ai/artifact/927c6enDLMu8w3xDLAvF82
* Final logo files: `brand/logo/v2/` (SVG: icon, lockup, lockup cream, stacked, symbol, wordmark). Earlier brass ring drafts in `brand/logo/` are superseded.

### Palette (current, Tannery Light leather theme)
| Token | Hex | Use |
|---|---|---|
| Espresso | #2A1C14 | Primary, text, buttons |
| Hide | #F5EEE4 | Page ground, text on espresso |
| Brass | #B0843F (Shopify secondary) and #C89B5E (light theme accent) | Accents, hardware |
| Obsidian | #16110D | Text on brass |
| Volt (legacy) | #CCFF00 | Only on filled chips, and in the optional dark mode |

The original brief palette (obsidian #080808, off white, volt #CCFF00, crosshair grid) survives only as the optional dark mode and on branch `black-theme-v1`.

### Typography
* Headings: Space Grotesk 500
* Body: Inter 400 and 500
* Labels, prices, small caps: JetBrains Mono 400 to 700
* Email and PDF fallback: Helvetica or Arial

### Shopify Brand settings (values in `brand/shopify-brand/brand-settings.md`)
* Default logo `daur-logo-default.png` (cream version `daur-logo-default-cream.png`), square logo `daur-logo-square.png` 1024 px, cover `daur-cover.png` 1920 x 1080. Already uploaded to Shopify Content > Files.
* Primary #2A1C14 with #F5EEE4; secondary #B0843F with #16110D.

---

## 3. Business model and pricing

* Curated supply house for **men's** leather shoes and sneakers. DAUR does not manufacture. It sources finished pairs from local Pakistani workshops (Lahore, Sialkot, Karachi named on site) at wholesale and sells under DAUR with the experience branded.
* Example economics from the brief: buy about Rs. 2,600, retail about Rs. 4,500, against Rs. 12,000+ typical retail. Fulfilment estimate: one pair delivered costs Rs. 431 to Rs. 542 including refused parcels, leaving about Rs. 1,637 of a Rs. 1,900 margin (estimate, not courier quotes). Ads stop being profitable above roughly Rs. 1,390 per order (estimate).
* **Vendor price is hidden everywhere** on the site (owner decision 27 Oct). Only the "typical retail" comparison (theme setting `market_retail`, Rs. 12,000) is shown.
* **Men only** focus since 22 October 2026 (advice from the owner's brother in law who works in the trade). Women and Kids products exist but are Draft.
* **Charity pledge** (owner, 22 Oct): at least 5% of **profit** (not price) goes to verified and genuine cases; cites Sahih Muslim 2588 ("Charity does not decrease wealth"). Do not add claims such as "every month" or named causes unless the owner provides them.
* Islamic trade note: research on Abdur Rahman ibn Awf (RA) in the Trade and Search Playbook. Flag raised: Tirmidhi 1232 "Do not sell what is not with you" versus ordering from vendors after a customer orders; owner was advised to ask a qualified mufti. The popular "three secrets" saying has no complete chain. Playbook: https://claude.ai/artifact/Gi2RFUnqXx1F1qUWgNj6Mp (file `design/trade-playbook.html`).
* Founding year given to Shopify knowledge base: 2026 (owner asked to confirm).

### Branded experience kit (no logo on the leather)
* Factory laces swapped for thick matte black woven cotton laces.
* Laser engraved DAUR metal lace tag (dubrae) on the bottom row, brass (gunmetal option).
* Matte black rubber zip tie tag "DAUR SUPPLY UNIT" (the Supply Unit seal) on the top eyelet. Size exchange requires the seal attached.
* Heavy matte black corrugated box, black and white geometric grid tissue, soft touch "Manifest Card" with the anti markup philosophy.
* Mockups (still show the old M.O.R.C. name): `design/unboxing-mockups/01-box.png` to `04-parts.png`.

### Quality claims on the site and in the chat agent (owner must make sure these happen in practice)
Workshop visits and bench selection; hand check of stitching, grain, upper flex, sole bond and comfort; sole pull test at toe and heel; rejects go back to the workshop; materials listed per product; re-laced, tagged, sealed and boxed.

---

## 4. Products

All current products are **samples with drawn images and made up stock**, not real pairs. Live status read from Shopify on 29 Oct 2026:

| Product | Handle | Type | Colours | Price (Rs.) | Status |
|---|---|---|---|---|---|
| DAUR Moc-Runner v1 | moc-runner-v1 | Hybrids | Triple Black, Oxblood | from 4,000 | Active |
| DAUR Phantom Trainer | phantom-trainer | Sneakers | Obsidian / Bone | 4,300 (was 4,800) | Active |
| DAUR Grid Court Low | grid-court-low | Sneakers | Bone / Ink, Triple Black | 4,200 | Active |
| DAUR Unit Derby 02 | unit-derby-02 | Leather | Black Full Grain | 4,900 | Active |
| DAUR Concrete Mid | concrete-mid | Sneakers | Ash / Black | from 3,000 | Active |
| DAUR Volt Signal | volt-signal | Sneakers | Black / Volt | 4,700 | Active |
| DAUR Ward Chelsea | ward-chelsea | Leather | Black Waxed, Dark Brown | 4,900 (was 5,400) | Active |
| DAUR Sector Slip | sector-slip | Hybrids | Black Nappa | 3,900 | Active |
| DAUR Halo Court | halo-court-w | Women | Black, Bone | 4,100 | Draft |
| DAUR Unit Mini | unit-mini-bb | Kids | Ink | 2,400 | Draft |
| DAUR Saddle Tassel | saddle-tassel | Loafer | Sand, Black | 3,900 (placeholder) | Draft |

* Sizes EU 40 to 45, options must be named **Color** and **Size** ("EU 42").
* Saddle Tassel is the first real product (from an owner photo of a tassel loafer); price, stock 0, materials are placeholders awaiting the owner's real data. The owner photo was not used (hand, supplier tag and "Y.A Collection" boxes in shot).
* **Open risk:** the 8 sample products are still Active. The launch checklist recommended setting them to Draft until real pairs and photos exist. The store is password protected, so no public customer can order yet.
* Product tag conventions (older themes): Men|Women|Kids, `group:`, `badge:`, `silhouette:`, `swatch:Colour=#hex`, `cost:vendor/kit/logistics`. The current theme ignores `cost:` tags; follow up is to remove them and use Shopify "Cost per item".
* Smart collections: men, women, kids (by tag), sale (price reduced), plus sneakers, leather-shoes, casual (Men tag plus product type).
* Old product copy backup: `backups/shopify-product-copy-2026-10-27.json`. Product drawings: `daur-supply-kit/Daur Supply/05 Product Drawings/`.
* Photo guide (14 photos per colour: 8 turning shots every 45 degrees for the 360 view, plus top, sole, close up, inside, pair, on foot; iPhone 15 Pro Max settings): https://claude.ai/artifact/N9EmRCQJY4jiRYpkHSUPZu (also `ops/photo-guide.html`). Owner sends photos; Claude cuts out, colour matches and builds the 360 view.

---

## 5. Shopify store

* Store: **DAUR Supply**, `ppiveu-zp.myshopify.com`, primary domain **daursupply.com** (bought through Shopify 26 Oct, USD 16 first year). Basic plan, PKR.
* Store email and contact email: contact@daursupply.com. Owner account email that received default order alerts earlier: azharghafoor39@gmail.com.
* **Password protection is ON** (store not public). Google cannot index the store until it is removed in Online Store > Preferences.
* Orders #1002 to #1004 are the owner's own tests.
* Installed apps known: Shopify Messaging, Universal Courier Pakistan (all courier app), Order Printer, Watix.
* Shopify chat agent and knowledge base: persona written (`daur-supply-kit/Shopify chat agent persona.md` and `.txt`); FAQ answers, About facts, brand facts, 7 general facts and 6 quality facts were written in the thread "Rebrand to DAUR Supply and list products" on 28 Oct.

### Themes
The connector cannot write to or publish the live (MAIN) theme. Every update is uploaded as a **new unpublished theme** which the owner previews and publishes.

| Theme | ID | Role on 29 Oct |
|---|---|---|
| DAUR Supply fit notes + one saving rule (review) | 189770203390 | **MAIN (live)** |
| DAUR Supply 5 day exchange (review) | 189771677950 | Unpublished, **awaiting publish** (includes Fit notes work plus 5 day exchange copy) |
| DAUR Supply premium voice + SEO (review) | 189725638910 | Unpublished, superseded |
| daur-supply-theme v2 (loafer + statuses) | 189672587518 | Unpublished, superseded |
| daur-supply-theme | 189670981886 | Unpublished, superseded |

Theme features: Tannery Light leather look (pebble leather texture, saddle leather bands, espresso buttons), dark mode toggle, shoe cursor with footprints, shoes dropping onto the footer wordmark, self writing headline by a shoe pen, 3D tilt hero pair, x-ray lens, branded shoe van on the "Five steps between the workshop and your door" line, leather hide sale tag on a leather strip, Fit notes, track page (one box: order number, phone or email, no sign in), feed page, 360 turntable view, edge hover gallery, mobile bottom sheet filters, "Just landed" automatic statuses (7 days for newly Active products), "Status" blog posts shown 14 days, pinned "Free delivery on 2 pairs" status. Alert list sign ups and WhatsApp number capture were **removed** (27 Oct) because the integration did not work. SEO: keyword titles such as "... for Men, Price in Pakistan | DAUR Supply", style guides and FAQs on collections, JSON-LD in `snippets/daur-ld.liquid`.

Page handles: manifesto, contract, policies, track, liked, alerts, feed (plus Our Story, Our Promise).

### Delivery, payment, taxes
* **Pakistan only**, nationwide. International zone deleted 28 Oct. Local pickup should be switched off (Shopify FAQ showed it on).
* Delivery fee **Rs. 200** per order for one pair; **free on 2 or more pairs** (automatic discount). Pakistan rate name was in Urdu ("معیاری").
* Dispatch **within 24 hours of confirmation**; delivery 2 to 6 working days; Sunday or holiday confirmations dispatch next working day.
* Payment: **Cash on Delivery** only, no COD surcharge. Gateway name "Cash on Delivery (COD)".
* Checkout: contact method "Phone number or email", phone **required** (set by owner).
* **Taxes rule (owner):** charge tax only when a real rate is set; otherwise add nothing. Owner was asked to turn on "Include tax in prices" in Settings > Taxes and duties (Shopify does not let Claude change it). Site terms say prices include any tax.

### Discounts
* **SUPPLYLINE:** Rs. 300 off. **DOUBLEUP:** 10% off orders from Rs. 8,000.
* Automatic free delivery on 2+ pairs (Pakistan).
* **Owner rule (28 Oct): only ONE saving per order**, the biggest for the customer: either free delivery or one coupon. **Gifts are added on top.** Configured so free delivery and codes do not stack. Shopify does not auto add free gift items; Claude will build bag auto add when the first gift offer is created. Owner should test 2 pairs plus SUPPLYLINE.

### Returns and exchanges (owner, 28 Oct)
* **Size exchange window: 5 days** from delivery (was 7). Unworn, original box, seal attached.
* **Defects: 30 days** (stitching opens or sole separates in normal wear): replace or refund.
* Wrong or damaged item: report within **48 hours** with photos (unboxing video recommended).
* **Customer pays return courier.** Site wording: "Send it back to us with the courier of your choice; once it reaches us and passes the check, your new size is dispatched." Never mention free returns.
* **Sale pairs are final for size:** "Sale pairs cannot be exchanged for size. Defects within 30 days are still covered." Defect claims on sale pairs come through WhatsApp.
* Refunds to bank account or mobile wallet when no replacement is available.
* Shopify return rules to set: Duration 5 days, customer provides return shipping, final sale = Sale collection, 0% restocking fee, cancellation allowed until fulfilled.
* Note: the Picked up by customer email and some older texts still mention a 7 day exchange; check and update if those emails are used.

### Policies
Refund, Shipping, Terms of Service and Contact texts are in `daur-supply-kit/Shopify policies to paste.txt` (updated 28 Oct, matching the site Policies page). The owner pastes them in Settings > Policies (Claude cannot write policies). Privacy policy is Shopify's (daursupply.com/policies/privacy-policy).

### Reviews: "Fit notes"
* Metaobject type **Fit note** under Content > Metaobjects: product, stars, name, city, text, photo, status. The site shows only entries with status **Approved**.
* Workflow: a submitted Fit note arrives as an email to contact@daursupply.com; the owner creates or edits the entry and sets it to Approved. Critical notes are published too.
* Empty state says no Fit notes yet in a warm tone (never "no reports").

### Notification emails
* **All Shopify notification emails rebuilt** (28 Oct) in the packing slip style: white page, DAUR logo, large mono labels, espresso and brass bar, colour and size chips, "Pay the rider" box for COD, contact footer. Files in `email-templates/` (`DAUR *.liquid`, preview PNGs, and Shopify default backups). The owner pastes each into Settings > Notifications > [email] > Edit code.
* Covered: order confirmation, order invoice (handles Due on fulfillment), draft order invoice, shipping confirmation, shipping update, out for delivery, delivered, ready for local pickup, picked up by customer, order edited, order cancelled (adds COD wording), order payment receipt, order refund, order link, payment reminder, new gift card and gift card receipt (bank card design), store credit issued, customer account welcome, invite, password reset, payment method add request, email address change confirmation, contact customer, request received, cancellation request declined, return created, return receipt, return request approved, return request declined, POS abandoned checkout, POS email to customer, POS and mobile receipt, POS exchange receipt.
* Gmail and Outlook do not load custom fonts; they fall back to Helvetica or Arial.
* Email branding form values: logo `03 Email Branding/daur-email-logo.png` at about 180 to 200 px; text #2A1C14; background #FFFFFF; button label #F5EEE4; button fill #2A1C14; border #D8C9B4; footer text #F5EEE4, unsubscribe #C89B5E, footer background #2A1C14; footer address Islamabad, Islamabad 46000, Pakistan.

### Packing slip
* Built in Shopify packing slip cannot show prices. The priced slip runs in the **Order Printer** app: `daur-supply-kit/daur-packing-slip.liquid.txt` (also `06 Packing Slips/DAUR packing slip (Order Printer).liquid`). Table layout and inline styles because the Order Printer PDF renderer drops CSS. Footer: WhatsApp 0319 9628735, daursupply.com, @daursupply, fb.com/daursupply, contact@daursupply.com. Order Printer PDF links expire; always print fresh.

---

## 6. Contact details and accounts

| Item | Value |
|---|---|
| Website | https://daursupply.com |
| Public email | contact@daursupply.com (Shopify domain forwarding to the Gmail) |
| Brand Gmail | daursupply@gmail.com (login for Instagram) |
| Phone and WhatsApp | 0319 9628735 (+92 319 9628735), WhatsApp Business app |
| WhatsApp link | https://wa.me/923199628735 (wa.me does not accept the @daursupply username) |
| Instagram | @daursupply |
| Facebook | Page "DAUR Supply", facebook.com/daursupply (fb.com/daursupply) |
| WhatsApp username | @daursupply reserved, not yet usable in links |
| Address shown | Islamabad, Islamabad 46000, Pakistan (no street address) |

Old number +92 305 5125974 is retired (replaced 26 Oct). On the static site the WhatsApp number lived only inside wa.me links, not printed as text; the owner may ask to print it.

Accounts register (no passwords): `social-media/Accounts Register.txt`. TikTok handle not yet confirmed.

---

## 7. Social media kit

* Kit: `social-media/` and zip `social-media.zip`; complete organised kit `daur-supply-kit/Daur Supply/` and `daur-supply-kit/daur-supply-kit.zip` (meant to be extracted to `D:\Sure Secure\Daur Supply` on the owner's Windows laptop; Claude cannot reach the D: drive).
* Contents: Gmail (signature, reply templates, security steps), Instagram (bio, 6 highlight covers: Delivery, COD, Sizes, Fit Notes, Drops, Care; 3 launch posts: "Naya daur", "The honest math", "How to order", captions), Facebook (Page text, Page Details by Section, cover 1640 x 624), WhatsApp (business profile text, greeting and quick replies, Status image, cover 1920 x 1080), Shopify (Preferences text and sharing image 1200 x 628), profile pictures in cream and espresso.
* Leather backgrounds were regenerated at full resolution in espresso on 27 Oct.
* Shopify Preferences: home title "DAUR Supply | Men's Leather Shoes and Sneakers in Pakistan"; meta description "Men's leather shoes and sneakers from Pakistani workshops at factory price. Same local craft. Zero retail markup. Cash on Delivery across Pakistan."
* Facebook: keep the Page created from the owner's real profile (a personal profile with a business name risks restriction).

---

## 8. Couriers and fulfilment

* Flow: order arrives, confirm with the buyer by call or WhatsApp, pack and seal, book in the courier app from the order page (label and tracking generated), rider collects daily or drop at branch, rider delivers and collects cash, courier pays out minus charges. Refused parcels return and both legs are paid.
* Shortlist (https://claude.ai/artifact/UEkTg7HuqhiFyEZixbM7e5): **PostEx** (pays COD upfront, online signup merchant.postex.pk/signup), **Leopards** (wide coverage, free pickup, weekly payout, open at an Express Center with CNIC and a cheque), **Trax** backup (online form, up to three payouts a week). Aggregators mentioned: Flaship, Oshi.
* Couriers do not publish ecommerce COD rates; written quotes are still needed. Ask how a shoe box is billed (volumetric weight may make it about 2 kg).
* Fulfilment playbook: https://claude.ai/artifact/7iz9pXEJkyKp9JSngvX2AR (`ops/fulfilment-playbook.html`).
* **Status:** no courier account opened yet as far as recorded; courier not yet chosen or integrated.

---

## 9. WhatsApp automation

* The checkout WhatsApp tick only records marketing consent; it sends nothing by itself.
* **Chosen tool: Watix** (USD 10 per 30 days, official Meta API, COD confirmation, cart reminders, courier tracking messages, campaigns; **no AI replies**). Runs on Shopify's servers, so the laptop can stay off. Uses the checkout phone number. Meta per message fees are extra (Pakistan from 1 Oct 2026: marketing USD 0.0473, utility USD 0.0150 per message).
* Alternatives studied: Whapi USD 18.99, Kanal USD 149 (AI), Dondy (automation USD 79.99, AI USD 159.99; study https://claude.ai/artifact/QHhArsUG6PT9y6ne56QdCc), Back In Stock WhatsApp Alerts, Notifly. QR code apps (WhatWali, Whatify) rejected for ban risk.
* AI answers: possible route is Watix plus Meta's own WhatsApp Business AI agent (about 4 to 5 US cents per reply); not confirmed for Pakistan or for use alongside Watix on one number.
* **Status (28 Oct):** Watix installed. Meta signup shows 0319 9628735 as "Ineligible / can't be shared with this app" because the number is active in the WhatsApp Business app. Fix: **Coexistence** (needs 7+ days real use, latest app version, not linked to another tool such as Shopify Messaging), then choose "connect your WhatsApp Business app number". Alternatives: a second SIM for Watix, or moving the number fully to Watix (not recommended). Owner to ask Watix whether Coexistence works for Pakistani numbers and whether order confirmation retries every 1 to 2 hours until confirmed.
* Owner wants: automatic order verification with retries, and automatic tracking messages on WhatsApp once a courier is integrated.
* Guides: Hands Free Store Plan / automation and ads https://claude.ai/artifact/DL2QxqZNSfRq2Mk5yv2SHN ; Orders, tracking and WhatsApp notes https://claude.ai/artifact/R2yfFu8daUYVF3eoST8VqA

---

## 10. Marketing, ads and growth

* Angles from the brief: "The Ultimate Value Flex" and "The Deconstructed Drop". Customers treated as insiders of a supply network. No mainstream influencer seeding.
* **Ads order:** Meta first (Facebook and Instagram, Click to WhatsApp plus website purchase ads; chats from these ads free up to 7 days), about **Rs. 45,000 for month one**. **TikTok** in month two (largest ad reach in Pakistan per DataReportal; minimum USD 20 a day per ad group). **Google Search** only after about 30 orders. Google Shopping and Merchant Center free listings do not support Pakistan; Google Business Profile is not for online only stores.
* Claude's role as ad manager: plans campaigns, copy, creatives, audiences, budgets, weekly review. Claude cannot log in to ad accounts; the owner pastes weekly numbers or connects an ads connector (Adspirer was mentioned, price unchecked).
* Local social dashboard: **Postiz** (free, open source, Docker on Windows) for Instagram, Facebook, LinkedIn, TikTok, YouTube; Claude can save drafts, owner schedules. Laptop must be on when posts are due; Instagram images need a free Cloudflare storage link. WhatsApp Status and Channels stay manual.
* Growth systems report: https://claude.ai/artifact/VUzhYvKRLUDexmuo727GAh (`ops/growth-systems-research.html`). Offered next: "Order now, pay on delivery" and "Order on WhatsApp" buttons as a new review theme (not started).
* SEO: no keyword volume tool worked; keyword map built from ranking Pakistani footwear pages ("price in Pakistan", "for men", "buy online"). Hidden text is against Google spam policy; no one can guarantee a #1 ranking. Research report: `research/DAUR voice and SEO research.md`.

---

## 11. Website and code

* Original static site (M.O.R.C. era): `/mnt/project-files/morc-site/`. Edit `assets/*.js` and `styles.css`, run `node tools/build.js`. Preview artifact: https://claude.ai/artifact/7ho1rxgQs79ATyYR1jcFtk . The static admin (admin.html) is browser storage only and is not used on Shopify.
* Shopify theme source: `morc-site/shopify/theme-src`; build with `node tools/shopify-theme.js` (copies shared assets, minifies with esbuild when available, zips `daur-supply-theme.zip`). Setup guide `morc-site/shopify/SHOPIFY-SETUP.md`.
* Repo **azbers/MORC** (public). Branches: `main`, `shopify-theme` (theme folders only), `black-theme-v1` (original black theme, commit 91a2d94), `leather-theme-v2` (leather theme with Men, Women and Kids).

| PR | Title | State on 29 Oct |
|---|---|---|
| #1 | v2 leather theme (Tannery Light), SEO titles and charity pledge | Merged 22 Oct |
| #2 | Men only line, leather hide sale tag and brass accents | Merged 22 Oct |
| #3 | Self writing headline, 3D tilt, 24 hour dispatch, fit notes and a faster theme | Merged 24 Oct |
| #4 | Shoe pen headline, delivery van, policy art, feed and product gallery upgrades | Merged 24 Oct |
| #5 | Checkout pictures for Shopify products | Merged 24 Oct |
| #6 | Rebrand to DAUR Supply with new wordmark and symbol | **Open**, head e9fbed2 (includes later work up to the 5 day exchange) |
| #7 | Mobile speed, premium brand voice and server side SEO | Merged 28 Oct (stacked on #6) |

* Static site cost figures in `assets/data.js` are placeholders only.

---

## 12. Design history and owner decisions (chronological)

* 19 Oct: Site built from the brief (Framer template host was blocked, only its text structure read). Many rounds: shoe cursor with footprints, falling shoe pile onto footer letters (owner's five icons; Flaticon credit only on the manifesto page), liked pairs, flex card, feed, sale rail, hidden scrollbars, policies with animated art, nationwide delivery. Shopify chosen as backend (Vercel Hobby is non commercial only). Store connected after the owner approved access (threads started before approval could not use the connector).
* 21 Oct: Lighter theme requested; **Tannery Light** chosen over Saddle Split. Footer pile: men's sneakers only, one cognac colour.
* 22 Oct: SEO titles, charity pledge, leather v2 merged, men only, leather sale tag, brass replaces lime in light theme.
* 24 Oct: Manifesto kit section removed; info strip removed; dispatch 24 hours; reviews named "Fit notes"; track without sign in; slow shoe pen headline (no underline); delivery van; product checkout images (drawn renders).
* 25 Oct: Packaging mockups; courier and delivery fee plan; Watix found.
* 26 Oct: Name DAUR Supply chosen; domain bought; logo and full rename (PR #6); contact details changed; Brand settings; photo guide; Saddle Tassel draft; statuses; kit zip; email branding.
* 27 Oct: Social kit images regenerated; Shopify Preferences; DAUR packing slip; mobile speed themes; policies page art reduced to the map (van, returns and COD art removed); alert sign ups removed; "Branded, not labeled"; vendor price hidden; premium voice and SEO.
* 28 Oct: Every notification email rebuilt; growth and WhatsApp research; launch checklist (https://claude.ai/artifact/S3XbUeRyVSfsn5cpTKwiZV); International zone removed; one saving rule; Fit note metaobject; 5 day exchange and paid returns; chat agent persona and knowledge base; Watix Coexistence issue.
* Declined or deferred: a 3D character wearing the shoe (needs real 3D models of the actual pairs).

---

## 13. Current status (29 October 2026)

* Store **not public**; password protection on. Real products are **in transit**; the owner will photograph them with the guide and add real details, prices, stock and materials before going public.
* Live theme: "DAUR Supply fit notes + one saving rule (review)". The "5 day exchange (review)" theme is waiting for the owner to publish.
* 8 sample products still Active.
* WhatsApp automation blocked on Coexistence eligibility.
* No courier account integrated.

---

## 14. Open to do list

**Owner actions in Shopify admin**
1. Publish theme "DAUR Supply 5 day exchange (review)" (id 189771677950).
2. Paste Refund, Shipping, Terms and Contact policies from `daur-supply-kit/Shopify policies to paste.txt` into Settings > Policies.
3. Set return rules: 5 days, customer provides return shipping, Sale collection final sale.
4. Turn on "Include tax in prices" in Settings > Taxes and duties; set a real rate only if one applies.
5. Switch off local pickup in Shipping and delivery.
6. Paste each notification email from `email-templates/` and send test emails; paste the DAUR packing slip in Order Printer.
7. Set sample products to Draft, then add real products with photos, prices, stock per size, vendor cost (Cost per item) and materials.
8. Remove password protection only when real products are ready; then set up Google Search Console.
9. Fill Brand social links (Instagram, Facebook, TikTok when claimed).
10. Update WhatsApp Business profile text and the /exchange quick reply to the 5 day rule.

**WhatsApp and couriers**
11. Use the WhatsApp Business number normally for 7+ days, then retry Watix with the Coexistence option; ask Watix about Coexistence in Pakistan and automatic confirmation retries.
12. Open PostEx and Leopards accounts, get written tariff sheets, measure the box; then integrate the courier app and automatic tracking messages.

**Claude follow ups**
13. Process real product photos (cutout, colour match, 360 view) and write product copy once the owner sends details.
14. Build automatic gift add to bag when the first gift offer exists.
15. Remove `cost:` tags from products; hide the old "Alert List" page.
16. Optional: "Order now, pay on delivery" and "Order on WhatsApp" buttons; Watix message templates; first Meta campaign plan.
17. Optional: QTY line on phones for the earlier email templates; refresh unboxing mockups with the DAUR name.
18. Decide whether to merge or close PR #6 in azbers/MORC.

**Owner decisions or checks**
19. Trademark search for the DAUR logo before printing boxes.
20. Ask a mufti about selling before holding stock (Tirmidhi 1232).
21. Confirm 2026 as the founding year.
22. Make sure the quality checks promised on the site really happen for every pair.

---

## 15. Artifact links

| Page | Link |
|---|---|
| Store preview (static site) | https://claude.ai/artifact/7ho1rxgQs79ATyYR1jcFtk |
| DAUR Supply identity | https://claude.ai/artifact/927c6enDLMu8w3xDLAvF82 |
| DAUR Supply logo | https://claude.ai/artifact/4eQKmew8EoFoDMXcvACkvs |
| Brand name shortlist (round 1) | https://claude.ai/artifact/LsT3DQkYrrr8GnpSTygwGE |
| Brand name shortlist (rounds 2 and 3) | https://claude.ai/artifact/ENbFyZWeBDVzvfBroxgJm7 |
| Trade and Search Playbook | https://claude.ai/artifact/Gi2RFUnqXx1F1qUWgNj6Mp |
| Fulfilment playbook | https://claude.ai/artifact/7iz9pXEJkyKp9JSngvX2AR |
| Courier shortlist | https://claude.ai/artifact/UEkTg7HuqhiFyEZixbM7e5 |
| Hands Free Store Plan (automation and ads) | https://claude.ai/artifact/DL2QxqZNSfRq2Mk5yv2SHN |
| Orders, tracking and WhatsApp notes | https://claude.ai/artifact/R2yfFu8daUYVF3eoST8VqA |
| Dondy WhatsApp app study | https://claude.ai/artifact/QHhArsUG6PT9y6ne56QdCc |
| DAUR Photo Guide | https://claude.ai/artifact/N9EmRCQJY4jiRYpkHSUPZu |
| DAUR Growth Systems | https://claude.ai/artifact/VUzhYvKRLUDexmuo727GAh |
| DAUR Supply launch checklist | https://claude.ai/artifact/S3XbUeRyVSfsn5cpTKwiZV |

Artifacts are private to the owner's account; a new project can read them only if the owner shares them or the same account opens them.

---

## 16. File locations (original project shared folder)

| Path | Contents |
|---|---|
| `brand/` | Identity and logo pages, logo PNGs and `logo/v2` SVGs, name shortlist, `shopify-brand/` (brand settings, logos, cover) |
| `daur-supply-kit/Daur Supply/` | Organised kit 01 to 08 (logos, Shopify brand, email branding, guides, product drawings, packing slips, social media, design concepts) |
| `daur-supply-kit/` | Chat agent persona (.md, .txt), policies paste file, DAUR packing slip, kit zip |
| `email-templates/` | All DAUR notification email templates, previews, Shopify default backups |
| `social-media/`, `social-media.zip` | Social setup kit |
| `ops/` | Automation guide, courier shortlist, fulfilment playbook, growth systems research, photo guide |
| `design/` | Leather direction concepts, trade playbook, unboxing mockups |
| `research/DAUR voice and SEO research.md` | Voice and SEO research report |
| `backups/shopify-product-copy-2026-10-27.json` | Product copy before the voice rewrite |
| `morc-site/` | Static site, Shopify theme source, products.csv, setup guide, packing slips |

These files live in the old project. Download anything needed (for example the kit zip) and upload it to the new project.

---

## 17. Technical constraints learned

* The Shopify connector cannot publish themes, edit the live theme, write policies, change checkout, tax, store details or Brand settings; those stay with the owner. It can create products, collections, discounts, pages, metaobjects, files and unpublished themes.
* A thread started before a connector approval cannot pick it up; start a new thread.
* Claude's environment could not open daursupply.com, Meta help pages, WIPO, IPO Pakistan, .pk registries or social handle checks.
* Built in Shopify packing slips have no price fields; use Order Printer.
* Websites cannot attach images to WhatsApp on desktop; share and WhatsApp buttons must be plain links opened on the click itself.

---

## 18. Where secrets are kept (not recorded here)

* **Storefront password:** set by the owner while the store is in development; the owner holds it (it was shared once in the thread "Rebrand to DAUR Supply and list products"). Ask the owner if needed.
* **Static site admin passcode:** in `morc-site/assets/data.js` of the public repo; not used on Shopify. Change it if the static admin is ever used.
* **Account passwords** (Gmail, Instagram, Facebook, Shopify, WhatsApp PIN): with the owner only. `social-media/Accounts Register.txt` lists accounts without passwords.

---

## 19. Updates, 30 October 2026

* **Folder:** all work lives in `D:\Sure Secure\Daur Supply\Social Media` on the owner's PC, and is mirrored to azbers/MORC branch `social-media-folder-2026-10-30` (folder `social-media/`, without `_Archive`, the Postiz server copy and the image cache).
* **New look "Tannery Royal" (owner approved):** keeps the website palette (Espresso #2A1C14, Hide #F5EEE4, Brass #B0843F) with real photographed leather surfaces (CC0, Poly Haven) and a minimal wordmark: DAUR in widely spaced Cinzel capitals with SUPPLY below; Cormorant Garamond for headlines and body; the loop D stays as the monogram. The website still uses the heavy wordmark and Space Grotesk / Inter until a new review theme is made.
* **Packaging kit version 3** (`Social Media\05 Packaging`): plain leather look boxes bought blank and stamped in house (lid wordmark stamp 120 x 44 mm, end size label stamp 80 x 30 mm, optional loop D stamp), plain cream tissue closed with a 50 mm round sticker, A6 Manifest Card front and back, Supply Unit seal front and back, brass lace tag, matte black laces. Dropped to save cost: printed tissue, box seal strip, printed inside lid, printed courier flyer, printed boxes. Version 2 is in `_Archive`. No Pakistani prices for plain boxes or logo stamps were found online; the owner must collect two quotes each.
* **Leopards (owner's branch visit, verbal):** Retail account at any branch (cannot be upgraded to Merchant later); up to Rs. 350 per parcel, about Rs. 500 for Sindh and Balochistan, prepaid; 4% FBR withheld from COD; optional 2% insurance; payout about 10 days; no return charge on Retail; 2 to 3 attempts; no opening before payment; same day dispatch if handed in before 5 pm; no Shopify integration on Retail; volume discount 10% at 10 parcels a day up to 40% at 100. Details in `02 Business and Meta Setup\03 Couriers.txt`.
* **Posting:** owner chose Meta Business Suite's Planner as the safe route. Pre-launch series Pre 01 to Pre 08 (31 Oct to 14 Nov 2026) built from the logo and kit renders, marked "Design render". Product posts wait for real pair photos (`Product Photos` folder, `build_posts.py`). Reposting other people's meme videos was advised against (copyright, reach penalties); legal alternatives given.
* **Beginner guides** for Meta Business Suite, business portfolio, ad accounts and Shopify upkeep, from official Meta and Shopify help pages: `02 Business and Meta Setup\00 Beginner Guides (Meta and Shopify).html`.
* **Postiz:** Docker Desktop was uninstalled and reinstalled per user by the owner. ghcr.io serves this connection at about 0.1 MB/s, so `06 Postiz\fast-image-download.mjs` downloads the image in parallel pieces and loads it into Docker.
* **Existing accounts are reused, never recreated:** Instagram @daursupply, Facebook Page DAUR Supply, WhatsApp Business 0319 9628735, daursupply@gmail.com.
