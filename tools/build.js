#!/usr/bin/env node
/* Builds the static pages and the single file preview.
   Usage: node tools/build.js
   Writes: *.html in the site root, sitemap.xml, robots.txt, dist/preview.html */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
// read the store's own data file in a sandbox to get the config
const sandbox = { window: {} };
require('vm').runInNewContext(fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8'), sandbox);
const C = sandbox.window.MORC_CONFIG;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap">';

const THEME_BOOT = '<script>try{if(localStorage.getItem(\'morc.theme\')===\'dark\')document.documentElement.dataset.theme=\'dark\'}catch(e){}</script>';

const PAGES = {
  home: ['index.html', 'Leather Shoes & Sneakers in Pakistan at Factory Price | M.O.R.C. Supply', 'Men\'s, women\'s and kids leather shoes and sneakers from Pakistani workshops at factory price. Cash on Delivery across Pakistan, free delivery on 2 pairs.'],
  shop: ['shop.html', 'Buy Leather Shoes & Sneakers Online in Pakistan | M.O.R.C. Supply', 'Buy leather shoes and sneakers online in Pakistan at factory price. Filter by style, size, colour and price. Cash on Delivery to every city.'],
  product: ['product.html', 'M.O.R.C. Moc-Runner v1 | Men\'s Black Leather Casual Shoes Price in Pakistan', 'Men\'s black leather casual shoes from Pakistani workshops at factory price, with Cash on Delivery in Pakistan.'],
  cart: ['cart.html', 'Your bag | M.O.R.C. Supply', 'Review your M.O.R.C. Supply bag.'],
  checkout: ['checkout.html', 'Checkout | M.O.R.C. Supply', 'Cash on Delivery checkout for M.O.R.C. Supply.'],
  order: ['order.html', 'Order placed | M.O.R.C. Supply', 'Your M.O.R.C. Supply order.'],
  manifesto: ['manifesto.html', 'About M.O.R.C. Supply | Why Branded Shoes Cost More in Pakistan', 'Why branded shoes cost more in Pakistan, and how M.O.R.C. sells the same local leather shoes and sneakers straight from the workshops at factory price.'],
  contract: ['contract.html', 'Delivery, Cash on Delivery & Exchanges in Pakistan | M.O.R.C. Supply', 'Delivery to every city in Pakistan, Cash on Delivery terms, 7 day size exchanges, defect cover and the EU to UK shoe size guide.'],
  track: ['track.html', 'Track your order | M.O.R.C. Supply', 'Track a M.O.R.C. Supply Cash on Delivery order.'],
  wishlist: ['wishlist.html', 'Wishlist | M.O.R.C. Supply', 'Your saved M.O.R.C. Supply pairs.'],
  list: ['list.html', 'Join the alert list | M.O.R.C. Supply', 'Get M.O.R.C. Supply drops, restocks and discounts first on WhatsApp.'],
  feed: ['feed.html', 'The Feed | M.O.R.C. Supply', 'Drops, fit checks and the supply line in motion.'],
  policies: ['policies.html', 'Terms, Privacy and Refund Policy | M.O.R.C. Supply', 'M.O.R.C. Supply terms of service, privacy policy, shipping, Cash on Delivery, returns, exchanges and refunds for orders across Pakistan.'],
  admin: ['admin.html', 'Supply Control | M.O.R.C. Supply', 'Store admin.']
};
const NOINDEX = ['cart', 'checkout', 'order', 'track', 'wishlist', 'admin'];
const SCRIPTS = ['assets/data.js', 'assets/shoe.js', 'assets/app.js'];
const OPTIONAL = ['assets/icons.js', 'assets/kicks.js', 'assets/pile.js', 'assets/polart.js', 'assets/social.js', 'assets/leads.js', 'assets/admin.js', 'assets/alive.js'];

function page(key) {
  const [file, title, desc] = PAGES[key];
  const scripts = SCRIPTS.slice(0, 2).concat(OPTIONAL.filter((f) => fs.existsSync(path.join(root, f))), SCRIPTS[2]);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#F5EEE4">
${THEME_BOOT}
${NOINDEX.includes(key) ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${C.domain}/${file === 'index.html' ? '' : file}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="M.O.R.C. Supply">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${C.domain}/${file === 'index.html' ? '' : file}">
<meta property="og:locale" content="en_PK">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%232A1C14'/%3E%3Ctext x='16' y='22' font-family='Arial' font-weight='700' font-size='16' fill='%23F5EEE4' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E">
${FONTS}
<link rel="stylesheet" href="assets/styles.css">
</head>
<body data-page="${key}">
<main id="app" tabindex="-1"><noscript><p style="padding:40px">M.O.R.C. Supply needs JavaScript for the bag and checkout. Message our WhatsApp order line to order directly.</p></noscript></main>
${scripts.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}

for (const k of Object.keys(PAGES)) fs.writeFileSync(path.join(root, PAGES[k][0]), page(k));

const pub = Object.keys(PAGES).filter((k) => !NOINDEX.includes(k));
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pub.map((k) => `  <url><loc>${C.domain}/${PAGES[k][0] === 'index.html' ? '' : PAGES[k][0]}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nDisallow: /checkout.html\nSitemap: ${C.domain}/sitemap.xml\n`);

// single file preview: everything inlined, hash routing
const inline = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/gi, '<\\/script');
const js = ['assets/data.js', 'assets/shoe.js'].concat(OPTIONAL.filter((f) => fs.existsSync(path.join(root, f))), ['assets/app.js']);
// the stylesheet points at the leather tiles next to it; the one file preview carries them inline
const inlineTiles = (css) => css.replace(/url\("(leather(?:-dark)?\.jpg)"\)/g, (m, f) => `url("data:image/jpeg;base64,${fs.readFileSync(path.join(root, 'assets', f)).toString('base64')}")`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/preview.html'), `<title>M.O.R.C. Supply</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${PAGES.home[2]}">
${FONTS}
${THEME_BOOT}
<style>${inlineTiles(fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8'))}</style>
<main id="app" tabindex="-1"></main>
<script>window.MORC_MODE = 'spa';</script>
${js.map((f) => `<script>${inline(f)}</script>`).join('\n')}
`);
console.log('built', Object.keys(PAGES).length, 'pages + dist/preview.html');
