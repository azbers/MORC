#!/usr/bin/env node
/* Packages the Shopify theme.
   Usage: node tools/shopify-theme.js
   Copies shopify/theme-src plus the shared storefront assets into
   shopify/theme, then zips it to shopify/daur-supply-theme.zip for
   Online Store > Themes > Add theme > Upload zip file. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'shopify', 'theme-src');
const out = path.join(root, 'shopify', 'theme');
const zip = path.join(root, 'shopify', 'daur-supply-theme.zip');
// the same files the static site runs; data.js and admin.js stay out because Shopify holds the catalog and the admin
const SHARED = ['styles.css', 'app.js', 'shoe.js', 'icons.js', 'kicks.js', 'pile.js', 'polart.js', 'social.js', 'alive.js', 'leather.jpg', 'leather-dark.jpg', 'font-grotesk.woff2', 'font-inter.woff2', 'font-mono.woff2'];

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
// scripts and styles ship minified when esbuild is installed (npm i -g esbuild); without it they ship as written
let esbuild = null;
try { esbuild = require('esbuild'); } catch (e) { console.log('esbuild not found, theme assets are copied unminified'); }
for (const f of SHARED) {
  const from = path.join(root, 'assets', f), to = path.join(out, 'assets', f);
  if (esbuild && /\.(js|css)$/.test(f)) fs.writeFileSync(to, esbuild.transformSync(fs.readFileSync(from, 'utf8'), { loader: f.endsWith('.css') ? 'css' : 'js', minify: true, target: f.endsWith('.css') ? undefined : 'es2020' }).code);
  else fs.copyFileSync(from, to);
}
if (esbuild) for (const f of ['daur-shopify.js', 'daur-theme.css']) { const p = path.join(out, 'assets', f); fs.writeFileSync(p, esbuild.transformSync(fs.readFileSync(p, 'utf8'), { loader: f.endsWith('.css') ? 'css' : 'js', minify: true, target: f.endsWith('.css') ? undefined : 'es2020' }).code); }
// the Shopify only stylesheet is small, so the layout prints it inline (snippets/daur-theme-css.liquid) instead of loading a second file
fs.writeFileSync(path.join(out, 'snippets', 'daur-theme-css.liquid'), fs.readFileSync(path.join(out, 'assets', 'daur-theme.css'), 'utf8').trim().replace(/<\/style/gi, '<\\/style'));
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, 'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'], { cwd: out });
console.log('theme in', path.relative(root, out), 'and', path.relative(root, zip), (fs.statSync(zip).size / 1024).toFixed(0) + ' KB');
