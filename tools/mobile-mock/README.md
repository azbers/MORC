# Mobile app mock (phone layer test harness)

Builds Shopify shaped copies of every page from the packaged theme, so the mobile app layer (assets/daur-m*.js) can be tested in Chromium without the live store.

1. Build the theme: `NODE_PATH=<dir with esbuild> node tools/shopify-theme.js`, then `git checkout shopify/theme/assets/daur-theme.css shopify/theme/snippets/daur-theme-css.liquid`.
2. `bash tools/mobile-mock/mk.sh` writes the pages to `_mock/` (git ignored through .git/info/exclude).
3. `python3 tools/mobile-mock/serve.py &` serves the repo on http://127.0.0.1:8765 (pages at /, /collections/all/, /products/ward-chelsea/, /cart/, /pages/<handle>/).
4. Checks (run from tools/mobile-mock, Playwright is preinstalled): `node all.js <outdir>` (screens, overflow, JS errors), `node widths2.js` (17 pages x 7 widths), `node flow3.js` (gift, give, bag, checkout payload; needs an `r4/` folder).

Test data (offers, wallet code, products) lives in gen.py.
