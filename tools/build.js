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
const C = sandbox.window.DAUR_CONFIG;

const FONTS = '<link rel="preload" as="font" type="font/woff2" href="assets/font-cond-700.woff2" crossorigin>\n<link rel="preload" as="font" type="font/woff2" href="assets/font-sans-400.woff2" crossorigin>';

const THEME_BOOT = '<script>try{var d=document.documentElement,n=navigator;if(localStorage.getItem(\'daur.theme\')===\'dark\')d.dataset.theme=\'dark\';if(localStorage.getItem(\'daur.grid\')===\'1\')d.classList.add(\'grid-1\')}catch(e){}try{if(/Android/i.test(n.userAgent)&&((n.deviceMemory||8)<=4||(n.hardwareConcurrency||8)<=4)||(n.connection&&n.connection.saveData))d.classList.add(\'lite\')}catch(e){}</script>';

const PAGES = {
  home: ['index.html', 'Men\'s Leather Shoes & Sneakers in Pakistan at Factory Price | DAUR Supply', 'Men\'s leather shoes, sneakers and chelsea boots from Pakistani workshops at factory price. Cash on Delivery across Pakistan, free delivery on 2 pairs.'],
  shop: ['shop.html', 'Buy Leather Shoes & Sneakers Online in Pakistan | DAUR Supply', 'Buy leather shoes and sneakers online in Pakistan at factory price. Filter by style, size, colour and price. Cash on Delivery to every city.'],
  product: ['product.html', 'DAUR Moc-Runner v1 | Men\'s Black Leather Casual Shoes Price in Pakistan', 'Men\'s black leather casual shoes from Pakistani workshops at factory price, with Cash on Delivery in Pakistan.'],
  cart: ['cart.html', 'Your bag | DAUR Supply', 'Review your DAUR Supply bag.'],
  checkout: ['checkout.html', 'Checkout | DAUR Supply', 'Cash on Delivery checkout for DAUR Supply.'],
  order: ['order.html', 'Order placed | DAUR Supply', 'Your DAUR Supply order.'],
  manifesto: ['manifesto.html', 'About DAUR Supply | Why Branded Shoes Cost More in Pakistan', 'Why branded shoes cost more in Pakistan, and how DAUR sells the same local leather shoes and sneakers straight from the workshops at factory price.'],
  contract: ['contract.html', 'Delivery, Cash on Delivery & Exchanges in Pakistan | DAUR Supply', 'Delivery to every city in Pakistan, Cash on Delivery terms, 5 day size exchanges, defect cover and the EU to UK shoe size guide.'],
  track: ['track.html', 'Track your order | DAUR Supply', 'Track a DAUR Supply Cash on Delivery order.'],
  wishlist: ['wishlist.html', 'Wishlist | DAUR Supply', 'Your saved DAUR Supply pairs.'],
  list: ['list.html', 'Join the alert list | DAUR Supply', 'Get DAUR Supply drops, restocks and discounts first on WhatsApp.'],
  feed: ['feed.html', 'The Feed | DAUR Supply', 'Drops, fit checks and the supply line in motion.'],
  policies: ['policies.html', 'Terms, Privacy and Refund Policy | DAUR Supply', 'DAUR Supply terms of service, privacy policy, shipping, Cash on Delivery, returns, exchanges and refunds for orders across Pakistan.'],
  about: ['about.html', 'About DAUR Supply | Pakistani Men\'s Shoe Brand, Dispatched from Islamabad', 'DAUR Supply is a Pakistani footwear brand for men: leather sneakers, formal shoes and chelsea boots from workshops in Lahore, Sialkot and Kasur, dispatched from Islamabad with Cash on Delivery.'],
  contact: ['contact.html', 'Contact DAUR Supply | WhatsApp, Phone and Email', 'Contact DAUR Supply on WhatsApp, phone or email. Orders dispatched from Islamabad with Cash on Delivery across Pakistan.'],
  runway: ['runway.html', 'DAUR Supply', 'The Runway now lives on the DAUR Supply home page.'],
  giving: ['giving.html', 'Our Giving: At Least 5% of Profit to People in Need | DAUR Supply', 'On every DAUR Supply pair we set aside at least 5% of our profit, never added to your price, and given every quarter to verified cases of need in Pakistan.'],
  offers: ['offers.html', 'Offers and Discount Codes | DAUR Supply', 'Live DAUR Supply discount codes, free delivery on two pairs and men\'s shoes on sale in Pakistan, with Cash on Delivery.'],
  gifts: ['gifts.html', 'Gifts for Men: Leather Shoes and Sneakers | DAUR Supply', 'Gift guide for the men in your life: leather shoes, sneakers and casual pairs, with help choosing his size and Cash on Delivery across Pakistan.'],
  notfound: ['404.html', 'Page not found | DAUR Supply', 'This address does not lead to a page on DAUR Supply. Search the collection or go to the shop.'],
  admin: ['admin.html', 'Supply Control | DAUR Supply', 'Store admin.']
};
const NOINDEX = ['cart', 'checkout', 'order', 'track', 'wishlist', 'admin', 'notfound', 'runway'];
const SCRIPTS = ['assets/data.js', 'assets/shoe.js', 'assets/app.js'];
const OPTIONAL = ['assets/icons.js', 'assets/kicks.js', 'assets/pile.js', 'assets/polart.js', 'assets/social.js', 'assets/admin.js', 'assets/alive.js'];

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
<meta property="og:site_name" content="DAUR Supply">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${C.domain}/${file === 'index.html' ? '' : file}">
<meta property="og:locale" content="en_PK">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%232A1C14'/%3E%3Cg transform='translate(16.6 16) scale(.1) translate(-62 -100) skewX(-14)' fill='%23F5EEE4'%3E%3Cpath d='M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z'/%3E%3C/g%3E%3C/svg%3E">
${FONTS}
<link rel="stylesheet" href="assets/styles.css">
</head>
<body data-page="${key}">
<div class="hdr-ph" aria-hidden="true"></div>
<main id="app" tabindex="-1"><noscript><p style="padding:40px">DAUR Supply needs JavaScript for the bag and checkout. Message our WhatsApp order line to order directly.</p></noscript></main>
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
const inlineTiles = (css) => css.replace(/url\("(font-[a-z]+\.woff2)"\)/g, (m, f) => `url("data:font/woff2;base64,${fs.readFileSync(path.join(root, 'assets', f)).toString('base64')}")`).replace(/url\("(leather(?:-dark)?\.jpg)"\)/g, (m, f) => `url("data:image/jpeg;base64,${fs.readFileSync(path.join(root, 'assets', f)).toString('base64')}")`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/preview.html'), `<title>DAUR Supply</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${PAGES.home[2]}">
${THEME_BOOT}
<style>${inlineTiles(fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8'))}</style>
<main id="app" tabindex="-1"></main>
<script>window.DAUR_MODE = 'spa';</script>
${js.map((f) => `<script>${inline(f)}</script>`).join('\n')}
`);
console.log('built', Object.keys(PAGES).length, 'pages + dist/preview.html');
