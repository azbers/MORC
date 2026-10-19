/* M.O.R.C. shoe icon set: six silhouettes drawn as coloured line icons for the
   cursor, the falling pile, the colour picker and the line cards.
   MORC_KICKS.svg(kind, { upper, sole, accent, line }, extraClass) returns an
   SVG string; toe points right, viewBox 0 0 64 40. */
(function () {
  'use strict';
  const K = {
    runner: (c) => `
      <path d="M5 31c-1.6-5.5-1-11.5 2.4-15.6 2-2.4 4.8-3.4 7.2-2.2 1.9 1 3.3 2.2 5.4 1.4l3.2-4.3c1.4-1.6 3.7-1.4 4.8.5 3.6 5.7 10 9.3 18.6 11.3 7.2 1.6 11.6 3.6 13 7.5L60 31z" fill="${c.upper}"/>
      <path d="M3.5 30.6h56.8c2.4 0 2.6 4.6.3 5.3-7.6 2.4-14.6-1.5-22.6.4-8.2 2-14.6-1.6-22.4.7-6.4 1.9-11.2.3-12.2-2.7-.4-1.3-.3-2.6.1-3.7z" fill="${c.sole}"/>
      <path d="M7.5 33.4c9-2.6 15.4 1.2 24.5-.6 9.4-1.9 16.8.4 26.6-.6" fill="none" stroke="${c.accent}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M15.5 25.5c9-2.6 19.6-2.4 30.5-.8" fill="none" stroke="${c.accent}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M25.6 13.6l3.4-2.2M29.2 16.6l3.6-2M33.4 19l3.4-1.8" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7.8 17.8c1.6-.6 3 .4 2.8 2.6" fill="none" stroke="${c.line}" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M5 31c-1.6-5.5-1-11.5 2.4-15.6 2-2.4 4.8-3.4 7.2-2.2 1.9 1 3.3 2.2 5.4 1.4l3.2-4.3c1.4-1.6 3.7-1.4 4.8.5 3.6 5.7 10 9.3 18.6 11.3 7.2 1.6 11.6 3.6 13 7.5M3.5 30.6h56.8c2.4 0 2.6 4.6.3 5.3-7.6 2.4-14.6-1.5-22.6.4-8.2 2-14.6-1.6-22.4.7-6.4 1.9-11.2.3-12.2-2.7-.4-1.3-.3-2.6.1-3.7z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`,
    high: (c) => `
      <path d="M7 31V11.5C7 7.6 9.4 5 13 5h8.6c2 0 3.4 1.3 3.8 3.3L27 16c6.6 3.6 15.4 5.6 24 7.4 6.4 1.3 9.6 3.7 9.6 7.6z" fill="${c.upper}"/>
      <path d="M43 21.6c6.4 1 13.6 2.4 17 5.8.8.9.8 2.4.6 3.6H44.4c-2.6-2.6-3-6.4-1.4-9.4z" fill="${c.accent}" opacity=".9"/>
      <circle cx="13" cy="18.5" r="3.4" fill="${c.sole}" stroke="${c.line}" stroke-width="1.3"/>
      <path d="M4.5 31h58v4.2c0 1.6-1.1 2.8-2.7 2.8H7.3c-1.6 0-2.8-1.2-2.8-2.8z" fill="${c.sole}"/>
      <path d="M5 34.4h57" stroke="${c.line}" stroke-width="1" stroke-dasharray="1.6 1.8"/>
      <path d="M24.6 10.4l3.6-1.4M25.6 14l3.8-1.4M28.4 17.4l3.6-1.6M32 19.4l3.4-1.8" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7 31V11.5C7 7.6 9.4 5 13 5h8.6c2 0 3.4 1.3 3.8 3.3L27 16c6.6 3.6 15.4 5.6 24 7.4 6.4 1.3 9.6 3.7 9.6 7.6M4.5 31h58v4.2c0 1.6-1.1 2.8-2.7 2.8H7.3c-1.6 0-2.8-1.2-2.8-2.8z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`,
    boot: (c) => `
      <path d="M9 32V6.4C9 4.5 10.3 3 12.2 3h11.6c1.9 0 3.2 1.5 3.2 3.4V18c6.4 3.8 14.6 5.6 22.4 7 6.4 1.2 10 3.4 10.4 7z" fill="${c.upper}"/>
      <path d="M14.6 3.4c2.6 6.6 2.6 13.4.4 20.6h6.4c-.8-7.4.2-14.2 2.6-20.6z" fill="${c.accent}" opacity=".85"/>
      <path d="M9 4.6c-1.8-.2-3 .8-3 2.6v4.4" fill="none" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6.6 32H61v4.6c0 .9-.7 1.4-1.6 1.4H22.6l-.8-2H16v2H8c-.8 0-1.4-.6-1.4-1.4z" fill="${c.sole}"/>
      <path d="M9 32V6.4C9 4.5 10.3 3 12.2 3h11.6c1.9 0 3.2 1.5 3.2 3.4V18c6.4 3.8 14.6 5.6 22.4 7 6.4 1.2 10 3.4 10.4 7M6.6 32H61v4.6c0 .9-.7 1.4-1.6 1.4H22.6l-.8-2H16v2H8c-.8 0-1.4-.6-1.4-1.4z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`,
    loafer: (c) => `
      <path d="M6 32c-.8-5 .2-9.2 3.4-11 4.4-2.4 10.6.2 17-.6 9-1.2 19.4.2 27.4 3.6 4.6 2 7 4.6 6.6 8z" fill="${c.upper}"/>
      <path d="M28.6 20.4c3.4 4.6 11.6 5.8 19.6 3.4" fill="none" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M33 22.6h9.6c.6 0 1 .5.8 1l-.6 1.6" fill="${c.accent}" stroke="${c.line}" stroke-width="1.2"/>
      <path d="M4.6 32h56.6v3c0 .9-.7 1.6-1.6 1.6H17v1.8H6c-.8 0-1.4-.6-1.4-1.4z" fill="${c.sole}"/>
      <path d="M6 32c-.8-5 .2-9.2 3.4-11 4.4-2.4 10.6.2 17-.6 9-1.2 19.4.2 27.4 3.6 4.6 2 7 4.6 6.6 8M4.6 32h56.6v3c0 .9-.7 1.6-1.6 1.6H17v1.8H6c-.8 0-1.4-.6-1.4-1.4z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`,
    slide: (c) => `
      <path d="M14 31c1.6-8.8 7.6-13.6 16-13.6 7.8 0 13.8 3.4 16.6 9 .8 1.6 1 3.2.8 4.6z" fill="${c.upper}"/>
      <path d="M20.6 23.4h20" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M3.6 31.4C20 29.4 44.6 29.2 61.4 31v4.4c-17-1.4-41.4-1.2-57.8.8z" fill="${c.sole}"/>
      <path d="M14 31c1.6-8.8 7.6-13.6 16-13.6 7.8 0 13.8 3.4 16.6 9 .8 1.6 1 3.2.8 4.6M3.6 31.4C20 29.4 44.6 29.2 61.4 31v4.4c-17-1.4-41.4-1.2-57.8.8z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`,
    court: (c) => `
      <path d="M6 31V19.6c0-2.8 2-4.6 4.6-4.6h7.6c2.4 0 4 1 5.6 2.8 7.4 4 17.6 5.4 27 6.8 6.4 1 9.8 3.4 9.8 6.4z" fill="${c.upper}"/>
      <path d="M6 22.6h5.4c1.4 0 2.4 1 2.4 2.4V31H6z" fill="${c.accent}"/>
      <path d="M27 22.4c8 3.2 18 4 27 3.6" fill="none" stroke="${c.line}" stroke-width="1" stroke-dasharray="1.6 1.6"/>
      <path d="M22.8 17.4l3.2-1.8M26.6 19.6l3.2-1.8M30.6 21.2l3-1.8" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M4.4 31h58v4.4c0 1.4-1.1 2.6-2.6 2.6H7c-1.4 0-2.6-1.2-2.6-2.6z" fill="${c.sole}"/>
      <path d="M6 31V19.6c0-2.8 2-4.6 4.6-4.6h7.6c2.4 0 4 1 5.6 2.8 7.4 4 17.6 5.4 27 6.8 6.4 1 9.8 3.4 9.8 6.4M4.4 31h58v4.4c0 1.4-1.1 2.6-2.6 2.6H7c-1.4 0-2.6-1.2-2.6-2.6z" fill="none" stroke="${c.line}" stroke-width="1.7" stroke-linejoin="round"/>`
  };
  const DEF = { upper: '#EDEBE4', sole: '#ffffff', accent: '#CCFF00', line: '#0b0b0b' };
  // pick a silhouette that fits a catalog product
  const kindOf = (p) => {
    const s = (p && (p.silhouette || '') + ' ' + (p.category || '') + ' ' + (p.name || '')).toLowerCase();
    if (/chelsea|boot/.test(s)) return 'boot';
    if (/mid|high/.test(s)) return 'high';
    if (/derby|loafer|moc|slip|leather/.test(s)) return /slip/.test(s) ? 'loafer' : /moc|runner/.test(s) ? 'runner' : 'loafer';
    if (/court/.test(s)) return 'court';
    return 'runner';
  };
  // light enough to need a dark outline, or dark enough to need a light one
  const lum = (hex) => { const h = String(hex || '#777').replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 255000; };
  const colorsFor = (hex, accent) => {
    const dark = lum(hex) < 0.32;
    // dark pairs get a light outline so they read on the black site
    return { upper: hex, sole: dark ? '#2a2927' : '#ffffff', accent: accent || '#CCFF00', line: dark ? '#cfccc3' : '#0b0b0b' };
  };
  window.MORC_KICKS = {
    kinds: Object.keys(K),
    kindOf,
    colorsFor,
    svg(kind, c, cls) { const col = Object.assign({}, DEF, c || {}); return `<svg class="kick${cls ? ' ' + cls : ''}" viewBox="0 0 64 40" aria-hidden="true" focusable="false">${(K[kind] || K.runner)(col)}</svg>`; }
  };
})();
