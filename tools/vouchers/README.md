# Voucher pictures for social media

The voucher cards of the mobile app (`shopify/theme-src/assets/daur-m-vouchers.js` and `.css`) drawn as PNG pictures, so posts and the app look the same.

1. Check the offers in `export.html` (`CARDS`) against the live Shopify discounts and compare at prices. They were checked on 9 November 2026.
2. From the repo root: `python3 -m http.server 8767 --bind 127.0.0.1 &`
3. `node tools/vouchers/export.js <output folder>` (Playwright is preinstalled in the cloud container).

Each offer gives three pictures: `<offer>-post-1080x1350.png` (Instagram and Facebook feed), `<offer>-story-1080x1920.png` (stories and WhatsApp status, key content kept clear of the top and bottom 250 px) and `<offer>-card.png` (the voucher alone on a clear background, 1600 px wide).
