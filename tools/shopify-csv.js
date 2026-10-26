/* Writes shopify/products.csv from assets/data.js for Shopify > Products > Import.
   One row per colour and size. Tags carry what Shopify has no field for, and the DAUR theme reads them:
   Men | Women | Kids, group:<sub group>, badge:<Drop 01 | Limited>, silhouette:<x>, swatch:<colour>=<hex>,
   cost:<vendor>/<kit>/<logistics> for the public price breakdown. Run: node tools/shopify-csv.js */
const fs = require('fs');
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'assets', 'data.js'));
const P = window.DAUR_PRODUCTS;

const cols = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Variant SKU', 'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
  'Variant Requires Shipping', 'Image Src', 'Image Position', 'Image Alt Text', 'Variant Image', 'SEO Title', 'SEO Description', 'Cost per item', 'Status'];
const q = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = [];
for (const p of P) {
  const body = `<p>${esc(p.description || '')}</p>` + (p.specs ? '<ul>' + Object.entries(p.specs).map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join('') + '</ul>' : '');
  const tags = [p.audience, p.group && 'group:' + p.group, p.tag && 'badge:' + p.tag, p.silhouette && 'silhouette:' + p.silhouette].concat(p.cost ? [`cost:${p.cost.vendor || 0}/${p.cost.kit || 0}/${p.cost.logistics || 0}`] : []).concat(p.variants.map((v) => `swatch:${v.color}=${v.hex}`)).filter(Boolean).join(', ');
  const cost = p.cost ? (p.cost.vendor || 0) + (p.cost.kit || 0) + (p.cost.logistics || 0) : '';
  const images = p.variants.flatMap((v) => (v.images || []).map((src) => ({ src, v })));
  let first = true, n = 0;
  for (const v of p.variants) {
    for (const s of p.sizes) {
      const r = {
        Handle: p.id, 'Option1 Name': first ? 'Color' : '', 'Option1 Value': v.color, 'Option2 Name': first ? 'Size' : '', 'Option2 Value': 'EU ' + s,
        'Variant SKU': `${p.id}-${v.id}-${s}`, 'Variant Inventory Tracker': 'shopify', 'Variant Inventory Qty': (v.stock || {})[s] || 0, 'Variant Inventory Policy': 'deny',
        'Variant Fulfillment Service': 'manual', 'Variant Price': v.price, 'Variant Compare At Price': v.compareAt || '', 'Variant Requires Shipping': 'TRUE',
        'Variant Image': (v.images || [])[0] || '', 'Cost per item': cost
      };
      if (first) Object.assign(r, { Title: 'DAUR ' + p.name, 'Body (HTML)': body, Vendor: 'DAUR Supply', Type: p.category, Tags: tags, Published: 'TRUE', 'SEO Title': (p.seo || {}).title || '', 'SEO Description': (p.seo || {}).description || '', Status: 'active' });
      if (images[n]) { r['Image Src'] = images[n].src; r['Image Position'] = n + 1; r['Image Alt Text'] = `DAUR ${p.name} ${images[n].v.color}`; n++; }
      rows.push(r); first = false;
    }
  }
  // any photos left over get rows of their own, as Shopify expects
  for (; n < images.length; n++) rows.push({ Handle: p.id, 'Image Src': images[n].src, 'Image Position': n + 1, 'Image Alt Text': `DAUR ${p.name} ${images[n].v.color}` });
}
const out = path.join(__dirname, '..', 'shopify', 'products.csv');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n');
console.log('wrote', rows.length, 'rows for', P.length, 'products to', out);
