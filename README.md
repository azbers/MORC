# M.O.R.C. Supply storefront

Static, dependency free storefront for M.O.R.C. Supply. Black ground, bone type, volt accents, crosshair grid, Space Grotesk, Inter and JetBrains Mono.

## Shopify

The store can run on Shopify, which then holds the products, stock, orders, admin and Cash on Delivery checkout. Read `shopify/SHOPIFY-SETUP.md`. The theme source is in `shopify/theme-src`. Build it with `node tools/shopify-theme.js`, and build the product import file with `node tools/shopify-csv.js`.

## Run it

```
cd morc-site
node tools/build.js          # regenerates the pages and dist/preview.html
python3 -m http.server 8765  # then open http://localhost:8765
```

Any static host works (Netlify, Vercel, Cloudflare Pages, cPanel). Upload the whole folder.

## Pages

| Page | File | What it does |
|---|---|---|
| Home | index.html | Hero with x-ray lens, story rail, value flex bars, lines, Drop 01 grid, anatomy hotspots, packaging suite, price cuts, curation steps, contract, fit check wall, WhatsApp sign up |
| Shop | shop.html (`#men`, `#women`, `#kids`, `#sale`, `#new`) | Filters: line, sub group, style, colour, size, price band, on sale, in stock. Sort: featured, newest, price both ways, biggest saving. Search. Active filter chips |
| Product | product.html#`id`~`colour` | Colour variants, size stock with low stock and sold out states, restock alert by WhatsApp, quantity, add to bag, buy now, wishlist, copy link, value flex share card, delivery estimate by city, price breakdown, specs, in the box, size guide, reviews, related, recently viewed, sticky buy bar, JSON-LD |
| Bag | cart.html and the slide out drawer | Quantity plus and minus capped by stock, remove, move to wishlist, coupons, free delivery meter, sale savings, markup skipped |
| Checkout | checkout.html | Cash on Delivery, Pakistani mobile validation, city based delivery fee, address with area and landmark, WhatsApp updates and alert list opt in, saved draft |
| Order | order.html#`id` | Confirmation timeline, Confirm on WhatsApp button with the order prefilled, value flex card |
| Track | track.html | Order number plus phone lookup |
| Feed | feed.html | Vertical swipe reels with like, save, share and flex |
| Alert list | list.html | WhatsApp first opt in, optional email and SMS, interests |
| Manifesto | manifesto.html | The finalized About text |
| Contract | contract.html | Dispatch, delivery, COD, exchanges, defects, size guide, FAQ |
| Wishlist | wishlist.html | Saved pairs |
| Admin | admin.html | Supply Control (passcode in assets/data.js, `adminPasscode`) |

## Admin (Supply Control)

Overview KPIs, listings (add, edit, hide, delete), inventory (left now and total received per size, receive stock), orders with status and a WhatsApp confirm link, review moderation (pending, approved, archived, good and bad filters, public reply), alert list with CSV copy, and Publish (export the catalog as data.js).

**Important.** This build has no server. The bag, orders, reviews, sign ups and admin edits are stored in the browser that made them. A customer's review only reaches the admin queue on a real store with a database. The passcode is a preview lock, not security.

## Adding your products from folders

```
node tools/import-catalog.js "/path/to/Products"          # dry run report
node tools/import-catalog.js "/path/to/Products" --write  # copies photos to products/ and rewrites the catalog in assets/data.js
node tools/build.js
```

Layout: `Products/Men|Women|Kids/[Sub group]/Product name/Colour name/photos + colour.txt`, with `product.txt` in each product folder. The full format is documented at the top of tools/import-catalog.js and a working example is in tools/sample-catalog. Resize photos to about 1600 px wide JPG or WebP before importing.

## Before launch

1. Replace every cost figure in assets/data.js with real vendor invoices. The site publishes them.
2. Set `whatsapp`, `supportEmail`, `domain`, delivery fees, coupons and `adminPasscode` in assets/data.js.
3. Confirm the 12,000 retail comparison is defensible for each product.
4. Review the contract and FAQ terms (exchanges, refunds, COD refusals) with whoever runs operations.

## Going live for real: what needs a backend

| Need | Why | Options |
|---|---|---|
| Orders reach you | Orders are saved in the buyer's browser only | Shopify (headless or a theme built from this design), or Next.js with Supabase or Firebase |
| Shared stock | Stock must drop for everyone when someone buys | Same as above |
| Reviews and approval | Reviews must be stored centrally | Shopify apps (Judge.me) or your own table |
| Staff login | Real access control | Platform login |
| WhatsApp broadcasts | Promotional messages must use the WhatsApp Business Platform with approved templates and opt in | Meta Cloud API directly, or Twilio, 360dialog, WATI |
| Email and SMS | | Klaviyo or Mailchimp; a local SMS gateway |
| Couriers | Booking and tracking | TCS, Leopards, PostEx, Trax APIs |

## SEO notes

Titles and descriptions follow the brief. Pages have canonical URLs, Open Graph tags, sitemap.xml, robots.txt and JSON-LD (ShoeStore on home, ProductGroup with offers on products). Products render with JavaScript, which Google indexes, but a server rendered build would be stronger. Google ignores the meta keywords tag, so keywords live in titles, descriptions, headings and copy instead.

## Files

```
assets/data.js     settings + catalog (edit or regenerate with the importer)
assets/shoe.js     drawn product renders used until photos exist
assets/app.js      storefront, bag, checkout, routing
assets/social.js   reviews, stars, stories, feed, value flex card, fit wall
assets/admin.js    Supply Control
assets/styles.css  design system
tools/build.js     builds pages, sitemap, robots, dist/preview.html
tools/import-catalog.js   folder importer
```
