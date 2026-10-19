#!/usr/bin/env node
/* Packages the Shopify theme.
   Usage: node tools/shopify-theme.js
   Copies shopify/theme-src plus the shared storefront assets into
   shopify/theme, then zips it to shopify/morc-supply-theme.zip for
   Online Store > Themes > Add theme > Upload zip file. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'shopify', 'theme-src');
const out = path.join(root, 'shopify', 'theme');
const zip = path.join(root, 'shopify', 'morc-supply-theme.zip');
// the same files the static site runs; data.js and admin.js stay out because Shopify holds the catalog and the admin
const SHARED = ['styles.css', 'app.js', 'shoe.js', 'icons.js', 'kicks.js', 'pile.js', 'polart.js', 'social.js', 'leads.js', 'alive.js'];

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
for (const f of SHARED) fs.copyFileSync(path.join(root, 'assets', f), path.join(out, 'assets', f));
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, 'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'], { cwd: out });
console.log('theme in', path.relative(root, out), 'and', path.relative(root, zip), (fs.statSync(zip).size / 1024).toFixed(0) + ' KB');
