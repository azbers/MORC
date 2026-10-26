/* Draws one 1200 x 1200 picture per colour for Shopify cart and checkout,
   from the same renderer the storefront uses (assets/shoe.js).
   Upload each file to its product with alt text "Drawing: DAUR <name> in <colour>"
   and attach it to that colour's variants; the storefront ignores "Drawing:" images.
   Usage: node tools/product-art.js [product-id ...]   (needs Playwright) */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const out = path.join(root, 'shopify/product-art');
global.window = {};
require(path.join(root, 'assets/data.js'));
const only = process.argv.slice(2);
const products = window.DAUR_PRODUCTS.filter((p) => !only.length || only.includes(p.id));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.setContent(`<body style="margin:0"><div id="s" style="width:1200px;height:1200px;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,#F3F0EA 0%,#E6E1D6 55%,#DCD6C9 100%)"><div id="a" style="width:1040px;transform:translateY(40px)"></div></div></body>`);
  await page.addScriptTag({ path: path.join(root, 'assets/shoe.js') });
  fs.mkdirSync(out, { recursive: true });
  for (const p of products) {
    for (const v of p.variants) {
      await page.evaluate(([p, v]) => { document.getElementById('a').innerHTML = window.DAUR_SHOE.render({ name: p.name, colorway: v.color, silhouette: p.silhouette, palette: v.palette }); }, [p, v]);
      const file = path.join(out, `${p.id}--${v.id}.png`);
      await (await page.$('#s')).screenshot({ path: file });
      console.log(path.relative(root, file));
    }
  }
  await browser.close();
})();
