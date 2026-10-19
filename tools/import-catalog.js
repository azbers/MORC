#!/usr/bin/env node
/* Builds the M.O.R.C. catalog from a folder of product photos and text files.

   Usage:
     node tools/import-catalog.js "<path to your products folder>"          (dry run, prints a report)
     node tools/import-catalog.js "<path to your products folder>" --write  (copies photos, updates assets/data.js)

   Folder layout (see tools/sample-catalog for a working example):
     Products/
       Men/                         line: Men, Women or Kids
         Moc-Runner v1/             one folder per product
           product.txt              product details (format below)
           Triple Black/            one folder per colour
             colour.txt             optional: price, before price, stock, swatch
             01.jpg 02.jpg 03.jpg   photos, shown in name order, first is the main one
       Kids/
         Baby Girl/                 optional sub group inside a line
           Mini Court/
             product.txt
             Pink/ ...

   product.txt, one "Key: value" per line, keys are not case sensitive:
     Name: Moc-Runner v1
     Category: Hybrids
     Badge: Drop 01
     Price: 4500
     Before price: 5200             optional, shows the item on sale
     Sizes: 40, 41, 42, 43, 44, 45
     Vendor cost: 2600              for the price transparency bar
     Kit cost: 420
     Logistics cost: 330
     Description: Heavy grain local leather upper ...
     Spec Upper: Full grain cow leather
     Spec Sole: Dual density rubber
     SEO title: M.O.R.C. Moc-Runner v1 | Mens Black Leather Casual Shoes Pakistan
     SEO description: ...
     Stock: 40=3, 41=6, 42=8         used for every colour unless colour.txt sets its own

   colour.txt (all optional):
     Colour: Triple Black            defaults to the folder name
     Hex: #111111                    swatch colour
     Price: 4500
     Before price: 5200
     Stock: 40=3, 41=6, 42=8, 43=5, 44=2, 45=0

   A product folder with photos and no colour folders becomes a single colour,
   named by "Colour:" in product.txt or "Default". */
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const WRITE = args.includes('--write');
if (!src) { console.error('Give the products folder: node tools/import-catalog.js "<folder>" [--write]'); process.exit(1); }
const root = path.resolve(__dirname, '..');
const IMG = /\.(jpe?g|png|webp|avif)$/i;
const AUD = { men: 'Men', male: 'Men', women: 'Women', female: 'Women', kids: 'Kids', kid: 'Kids', children: 'Kids' };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dirs = (d) => fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name).sort();
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const warnings = [];

function readTxt(dir, preferred) {
  const txt = files(dir).filter((f) => /\.txt$/i.test(f));
  const pick = txt.find((f) => preferred.includes(f.toLowerCase())) || txt[0];
  if (!pick) return {};
  const out = { specs: {} };
  let last = null;
  fs.readFileSync(path.join(dir, pick), 'utf8').replace(/^﻿/, '').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z][A-Za-z \-]{0,40}?)\s*[:=]\s*(.*)$/);
    if (m) {
      const k = m[1].trim().toLowerCase();
      if (k.startsWith('spec ')) { out.specs[m[1].trim().slice(5)] = m[2].trim(); last = null; return; }
      out[k] = m[2].trim(); last = k; return;
    }
    if (last && line.trim()) out[last] += ' ' + line.trim(); // wrapped long lines continue the previous value
  });
  return out;
}
const num = (v) => { if (v == null || v === '') return null; const n = +String(v).replace(/[^\d.]/g, ''); return isNaN(n) ? null : n; };
function stock(v, sizes) {
  const o = {};
  sizes.forEach((s) => { o[s] = 0; });
  if (!v) return o;
  String(v).split(/[,;]/).forEach((part) => { const m = part.match(/(\d+)\s*[=:x]\s*(\d+)/); if (m) o[m[1]] = +m[2]; });
  return o;
}
function guessHex(name) {
  const n = name.toLowerCase();
  const map = [['volt', '#ccff00'], ['black', '#111111'], ['white', '#efece4'], ['bone', '#d9d3c5'], ['cream', '#e8e0cc'], ['grey', '#6b6b67'], ['gray', '#6b6b67'], ['ash', '#4a4a47'], ['brown', '#4a3322'], ['tan', '#a8794f'], ['oxblood', '#4a1717'], ['burgundy', '#4a1717'], ['navy', '#1b2333'], ['blue', '#2b4a7a'], ['olive', '#5a5a3a'], ['green', '#2f4a32'], ['red', '#8a1f1f'], ['pink', '#d8a3ad'], ['beige', '#d8c8a8']];
  const hit = map.find(([k]) => n.includes(k));
  return hit ? hit[1] : '#333333';
}
function palette(hex) { return { upper: hex, panel: hex, sole: '#0c0c0c', stitch: '#5a5a55', lace: '#0a0a0a' }; }

const products = [];
const copies = [];
function product(dir, audience, group) {
  const info = readTxt(dir, ['product.txt', 'details.txt', 'info.txt']);
  const name = info.name || path.basename(dir);
  const sizes = (info.sizes || (audience === 'Kids' ? '20,21,22,23,24,25' : audience === 'Women' ? '36,37,38,39,40,41' : '40,41,42,43,44,45')).split(/[,\s]+/).map(Number).filter(Boolean);
  const id = slug((group ? group + ' ' : '') + name);
  const base = ['products', slug(audience), group ? slug(group) : null, slug(name)].filter(Boolean).join('/');
  const colourDirs = dirs(dir).filter((d) => files(path.join(dir, d)).some((f) => IMG.test(f) || /\.txt$/i.test(f)));
  const variants = [];
  const addVariant = (vdir, vinfo, fallbackName) => {
    const color = vinfo.colour || vinfo.color || fallbackName;
    const hex = vinfo.hex || vinfo.swatch || guessHex(color);
    const imgs = files(vdir).filter((f) => IMG.test(f));
    const target = base + '/' + slug(color);
    const images = imgs.map((f, i) => { const out = `${target}/${String(i + 1).padStart(2, '0')}${path.extname(f).toLowerCase()}`; copies.push([path.join(vdir, f), path.join(root, out)]); return out; });
    if (!imgs.length) warnings.push(`${name} / ${color}: no photos, the site will draw it instead`);
    const price = num(vinfo.price) || num(info.price);
    if (!price) warnings.push(`${name} / ${color}: no price`);
    const before = num(vinfo['before price'] || vinfo['compare at'] || vinfo.was) || num(info['before price'] || info['compare at'] || info.was);
    const st = stock(vinfo.stock || info.stock, sizes);
    variants.push({ id: slug(color), color, hex, price: price || 0, compareAt: before && before > price ? before : null, stock: st, received: Object.assign({}, st), palette: palette(hex), images });
  };
  if (colourDirs.length) colourDirs.forEach((c) => addVariant(path.join(dir, c), readTxt(path.join(dir, c), ['colour.txt', 'color.txt']), c));
  else addVariant(dir, { colour: info.colour || info.color || 'Default' }, 'Default');
  const desc = info.description || '';
  if (!desc) warnings.push(`${name}: no description`);
  products.push({
    id, name, audience, group: group || null, category: info.category || info.style || 'Sneakers', silhouette: info.silhouette || 'court', tag: info.badge || info.tag || 'New',
    createdAt: info.date || new Date().toISOString().slice(0, 10), sizes, description: desc, specs: info.specs,
    cost: { vendor: num(info['vendor cost']) || 0, kit: num(info['kit cost']) || 420, logistics: num(info['logistics cost']) || 330 },
    seo: { title: info['seo title'] || `M.O.R.C. ${name} | ${audience}${group ? ' ' + group : ''} ${info.category || 'Shoes'} Pakistan`, description: info['seo description'] || desc.slice(0, 155) },
    variants
  });
}
function walk(dir, audience, group) {
  dirs(dir).forEach((d) => {
    const full = path.join(dir, d);
    const isProduct = files(full).some((f) => /\.txt$/i.test(f)) || files(full).some((f) => IMG.test(f));
    if (isProduct) product(full, audience, group);
    else if (!group) walk(full, audience, d); // a sub group such as Baby Girl
    else warnings.push(`Skipped ${full}: no product.txt or photos`);
  });
}

if (!fs.existsSync(src)) { console.error('Folder not found: ' + src); process.exit(1); }
const ORDER = ['Men', 'Women', 'Kids'];
dirs(src).sort((a, b) => ORDER.indexOf(AUD[a.toLowerCase()]) - ORDER.indexOf(AUD[b.toLowerCase()])).forEach((d) => {
  const aud = AUD[d.toLowerCase()];
  if (!aud) { warnings.push(`Skipped top folder "${d}": use Men, Women or Kids`); return; }
  walk(path.join(src, d), aud, null);
});

console.log(`Found ${products.length} products, ${products.reduce((a, p) => a + p.variants.length, 0)} colours, ${copies.length} photos.`);
products.forEach((p) => console.log(`  ${p.audience}${p.group ? ' / ' + p.group : ''} / ${p.name}: ${p.variants.map((v) => `${v.color} Rs.${v.price}${v.compareAt ? ' (was ' + v.compareAt + ')' : ''}, ${v.images.length} photos`).join('; ')}`));
if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log('  - ' + w)); }

if (!WRITE) { console.log('\nDry run. Add --write to copy the photos and update assets/data.js.'); process.exit(0); }
copies.forEach(([a, b]) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); });
const dataPath = path.join(root, 'assets/data.js');
const data = fs.readFileSync(dataPath, 'utf8');
fs.writeFileSync(dataPath + '.bak', data);
const i = data.indexOf('window.MORC_PRODUCTS =');
if (i < 0) { console.error('Could not find window.MORC_PRODUCTS in assets/data.js'); process.exit(1); }
fs.writeFileSync(dataPath, data.slice(0, i) + 'window.MORC_PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n');
console.log(`\nWrote ${products.length} products to assets/data.js (backup at assets/data.js.bak) and copied ${copies.length} photos into products/.`);
console.log('Run node tools/build.js to refresh the preview file.');
