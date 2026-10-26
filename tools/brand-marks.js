// DAUR Supply marks. Symbol: the loop D. Wordmark: drawn DAUR letters, 12 degree forward lean.
const SYM = '<g transform="skewX(-14)"><path d="M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z"/></g>';
const WM = '<g transform="skewX(-12)" fill-rule="evenodd"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z M27,25 H50 A25,25 0 0 1 50,75 H27 Z"/><path transform="translate(110 0)" d="M0,100 L36,0 H72 L108,100 H79 L54,28 L29,100 Z"/><path transform="translate(226 0)" d="M0,0 H27 V52 A23,23 0 0 0 73,52 V0 H100 V52 A50,48 0 0 1 0,52 Z"/><path transform="translate(340 0)" d="M0,0 H62 A31,31 0 0 1 80,56 L102,100 H71 L51,62 H27 V100 H0 Z M27,20 H61 A11,11 0 0 1 61,42 H27 Z"/></g>';
const svg = (vb, body, fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="${fill}">${body}</svg>`;
const sym = (fill) => svg('-55 20 234 160', SYM, fill);
const wm = (fill) => svg('-22 0 462 100', WM, fill);
// lockup: symbol 100 high, wordmark 100 high, SUPPLY under the wordmark
const lock = (fill, accent) => svg('-22 0 464 140', `${WM}<g fill="${accent}"><rect x="-12" y="124" width="262" height="3"/><text x="266" y="133" font-family="JetBrains Mono, monospace" font-weight="700" font-size="22" letter-spacing="15.5">SUPPLY</text></g>`, fill);
// stacked: symbol over wordmark
const stack = (fill, accent) => svg('-30 0 500 330', `<g transform="translate(225 85) scale(.95) translate(-62 -100)">${SYM}</g><g transform="translate(0 190)">${WM}</g><g fill="${accent}"><text x="220" y="326" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="22" letter-spacing="15.5">SUPPLY</text></g>`, fill);
const icon = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="0" fill="${bg}"/><g transform="translate(256 256) scale(1.55) translate(-56 -100)" fill="${fg}">${SYM}</g></svg>`;
module.exports = { SYM, WM, sym, wm, lock, stack, icon };
if (require.main === module) {
  const fs = require('fs'), o = process.argv[2] || require('path').join(__dirname, '../brand');
  fs.writeFileSync(o + '/daur-symbol.svg', sym('#2A1C14'));
  fs.writeFileSync(o + '/daur-wordmark.svg', wm('#2A1C14'));
  fs.writeFileSync(o + '/daur-lockup.svg', lock('#2A1C14', '#B0843F'));
  fs.writeFileSync(o + '/daur-lockup-cream.svg', lock('#F5EEE4', '#C89B5E'));
  fs.writeFileSync(o + '/daur-stacked.svg', stack('#2A1C14', '#B0843F'));
  fs.writeFileSync(o + '/daur-icon.svg', icon('#2A1C14', '#F5EEE4'));
}
