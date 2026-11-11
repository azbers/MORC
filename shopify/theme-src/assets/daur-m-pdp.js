/* DAUR mobile app: product page.
   Replaces V.product through window.DAUR_MX (see daur-m.js). The first screen holds everything a buyer needs to
   decide: the pair centred over a large DAUR wordmark on the same white to grey surface as the listings, its photos
   in the same frame (swipe), sizes down the left, colours down the right, the price, and one black button. Adding
   puts the pair into a DAUR box that closes and drops into the bag. Below the frame: who the pair is for (with real
   photos), fit notes told as stories and rated in hearts, the details, and more pairs. Sizes, colours, modes and the
   button repaint in place, so nothing reloads while the buyer decides. */
(function () {
  'use strict';
  const MX = window.DAUR_MX; if (!MX) return;
  const { V, API, C, ic, esc, fmt, asset, sized, pic, firstV, notesFor, days, DAUR_ADD, WA, href, view, app, $, $$, toast, openSheet, closeSheet, buyBar, add, card, P, reduce, WORDMARK, DMARK } = MX;
  const st = () => MX.state;
  const prod = () => API.prod(MX.cur.a);
  const varOf = (p) => API.variant(p, st().pv);
  const LOW = +C.lowStockAt || 2;
  const EX = +C.exchangeDays || 5;
  const qty = (v, s) => +((v.stock || {})[s] || 0);
  const isSale = (v) => !!API.onSale(v);
  const waLink = (t) => 'https://wa.me/' + esc(WA) + '?text=' + encodeURIComponent(t);

  /* ---------- hearts: the rating mark of DAUR, never stars ---------- */
  const HP = 'M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z';
  const H1 = `<svg viewBox="20 44 216 184" aria-hidden="true"><path d="${HP}"/></svg>`;
  const hearts = (val, cls) => {
    const v = Math.max(0, Math.min(5, +val || 0));
    return `<span class="px-hs ${cls || ''}" role="img" aria-label="${v.toFixed(1)} out of 5 hearts"><span class="hs-off">${H1.repeat(5)}</span><span class="hs-on" style="width:${(v / 5) * 100}%">${H1.repeat(5)}</span></span>`;
  };
  function stats(list) {
    const n = list.length, avg = n ? list.reduce((a, x) => a + Math.max(1, Math.min(5, +x.rating || 5)), 0) / n : 0;
    const dist = [5, 4, 3, 2, 1].map((s) => list.filter((x) => Math.round(+x.rating || 5) === s).length);
    const fit = { small: 0, true: 0, large: 0 };
    list.forEach((x) => { const f = String(x.fit || '').toLowerCase(); if (/small/.test(f)) fit.small++; else if (/large|big/.test(f)) fit.large++; else if (/true/.test(f)) fit.true++; });
    return { n, avg, dist, fit };
  }
  const when = (d) => { if (!d) return ''; const t = new Date(d + 'T12:00:00'); return isNaN(t) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(t); };
  const initials = (n) => String(n || 'DAUR buyer').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  /* ---------- the size chart of the store (the same numbers as the desktop size guide) ---------- */
  // men's chart from the owner (2026-11-11): US, EU, UK, foot length in inches and in cm. All lengths are approximate.
  const CHART = [[6, 38, 5.5, 9.25, 23.5], [6.5, 38.5, 6, 9.5, 24.1], [7, 39, 6.5, 9.625, 24.4], [7.5, 40, 7, 9.75, 24.8], [8, 41, 7.5, 9.9375, 25.4], [8.5, 42, 8, 10.125, 25.7],
    [9, 43, 8.5, 10.25, 26], [9.5, 43.5, 9, 10.4375, 26.7], [10, 44, 9.5, 10.5625, 27], [10.5, 44.5, 10, 10.75, 27.3], [11, 45, 10.5, 10.9375, 27.9], [12, 46, 11.5, 11.25, 28.6], [13, 47, 12.5, 11.5625, 29.4], [14, 48.5, 13.5, 11.875, 30.2]];
  const rowOf = (eu) => CHART.find((r) => r[1] === +eu);
  const ukOf = (eu) => { const r = rowOf(eu); return r ? r[2] : ''; };
  // the stocked size that fits a foot: the first size whose length is at least the foot's
  const euFor = (cm, list) => { const rows = CHART.filter((r) => list.includes(r[1])); const r = rows.find((x) => x[4] >= cm - 0.05); return (r || rows[rows.length - 1])[1]; };

  /* ---------- the frame: photos of the pair, the wordmark behind it, sizes and colours beside it ---------- */
  // where each cut out pair actually sits inside its picture (natural width, height, then the visible box as fractions),
  // so every pair is drawn the same size and dead centre however much empty space its file carries
  const BB = { concrete: [640, 358, 0.003, 0.003, 0.847, 0.779], derby: [640, 298, 0.138, 0, 0.814, 0.946], grid: [640, 512, 0.002, 0.002, 0.594, 0.859], hero: [452, 640, 0.007, 0, 0.982, 0.997],
    'moc-oxblood': [640, 580, 0, 0.019, 0.889, 0.986], 'moc-runner': [640, 425, 0.036, 0.007, 0.997, 0.993], phantom: [640, 402, 0.28, 0.007, 0.997, 0.993], 'saddle-black': [640, 426, 0.094, 0.108, 0.88, 0.873],
    saddle: [640, 399, 0.003, 0.003, 0.833, 0.857], sector: [640, 358, 0.223, 0.003, 0.748, 0.816], volt: [640, 492, 0.002, 0.006, 0.739, 0.988], 'ward-black': [640, 427, 0.003, 0.002, 0.605, 0.593], 'ward-brown': [506, 640, 0.016, 0.005, 0.864, 0.891] };
  const bbOf = (src) => { const m = String(src || '').match(/\/m-([a-z-]+)\.webp/); return m && BB[m[1]] ? m[1] : ''; };
  function fitPair(im) {
    const bb = BB[im.dataset.bb], box = im.parentElement; if (!bb || !box) return;
    const W = box.clientWidth, Hh = box.clientHeight; if (!W || !Hh) return;
    const [iw, ih, x0, y0, x1, y1] = bb, vw = (x1 - x0) * iw, vh = (y1 - y0) * ih, s = Math.min(W / vw, Hh / vh);
    Object.assign(im.style, { position: 'absolute', maxWidth: 'none', width: iw * s + 'px', height: ih * s + 'px', left: (W - vw * s) / 2 - x0 * iw * s + 'px', top: (Hh - vh * s) / 2 - y0 * ih * s + 'px' });
    im.dataset.s = s; im.classList.add('px-bbf');
  }
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (MX.cur.v === 'product') $$('.px-pair[data-bb]', view).forEach(fitPair); }, 120); }, { passive: true });
  function slides(p, v) {
    const x = pic(p, v), im = (v.images || []).filter(Boolean);
    const hero = x.cut ? { src: x.src, cut: true } : { src: sized(im[0] || x.src, 1000), cut: false };
    const photos = (x.cut ? im : im.slice(1)).slice(0, 7);
    return { hero, photos };
  }
  const srcset = (s) => /cdn\.shopify|\/cdn\/shop\//.test(s) ? ` srcset="${esc(sized(s, 600))} 600w, ${esc(sized(s, 900))} 900w, ${esc(sized(s, 1200))} 1200w" sizes="(max-width: 600px) 100vw, 600px"` : '';
  function rail(p, v) {
    const s = st();
    if (s.mode === 'give') return `<div class="px-rail l give"><span class="px-lab">Size</span><span class="px-vt">${ic('hand')}<b>Matched by DAUR</b></span></div>`;
    return `<div class="px-rail l" role="radiogroup" aria-label="Size, EU and UK"><span class="px-lab">Size <small>EU · UK</small></span>
      ${p.sizes.map((z) => { const q = qty(v, z), on = String(s.size) === String(z), uk = ukOf(z); return `<button class="px-sz" type="button" role="radio" data-pxsize="${esc(z)}" aria-checked="${on}"${q > 0 ? '' : ' disabled'} aria-label="EU ${esc(z)}${uk ? ', UK ' + uk : ''}${q > 0 ? '' : ', sold out'}"><b>${esc(z)}</b>${uk ? `<small>UK ${uk}</small>` : ''}</button>`; }).join('')}
      <button class="px-sgb" type="button" data-pxsg aria-haspopup="dialog">Size guide</button></div>`;
  }
  function swatches(p, v) {
    // every colour is a small photo of the pair in that colour with a dot of the colour on it; one colour is still shown, so every page looks the same
    return `<div class="px-cstrip" role="radiogroup" aria-label="Colour"><span class="px-lab">Colour<b class="px-cn">${esc(v.color)}</b>${p.variants.length > 1 ? `<small>${p.variants.length} colours</small>` : ''}</span><span class="px-cs">
      ${p.variants.map((x) => { const y = pic(p, x); return `<button class="px-sw im" type="button" role="radio" data-pxcol="${esc(x.id)}" aria-checked="${x.id === v.id}" aria-label="${esc(x.color)}" style="--sw:${esc(x.hex || '#222')}"><img src="${esc(y.src)}" alt="" loading="lazy"><i class="sw-dot"></i></button>`; }).join('')}</span></div>`;
  }
  function priceBox(v) {
    const save = isSale(v) ? v.compareAt - v.price : 0;
    const pct = save ? Math.round((save / v.compareAt) * 100) : 0;
    return `<div class="px-price">${save ? `<span class="pp-off">${pct}% off</span>` : ''}<b>${esc(fmt(v.price))}</b>${save ? `<span class="pp-was"><s>${esc(fmt(v.compareAt))}</s><em>You save ${esc(fmt(save))}</em></span>` : `<span class="pp-del">${ic('truck')}At your door in ${esc(days())}</span>`}</div>`;
  }
  function stage(p, v) {
    const { hero, photos } = slides(p, v), n = photos.length + 1, i = Math.min(st().pxi || 0, n - 1);
    const bb = hero.cut ? bbOf(hero.src) : '';
    const heroImg = `<img class="px-pair${hero.cut ? '' : ' blend'}" src="${esc(hero.src)}"${bb ? ` data-bb="${bb}"` : ''} alt="${esc(p.name + ', ' + v.color)}" fetchpriority="high" decoding="async">`;
    return `<div class="px-track" id="pxTrack" role="region" aria-roledescription="carousel" aria-label="${esc(p.name)} photos" tabindex="0">
        <figure class="px-slide px-hero" aria-label="1 of ${n}"><span class="px-word" aria-hidden="true">${WORDMARK}</span><span class="px-pb${hero.cut ? '' : ' ph'}"><span class="px-floor" aria-hidden="true"></span><span class="px-fl">${heroImg}</span></span></figure>
        ${photos.map((s, k) => `<figure class="px-slide ph" aria-label="${k + 2} of ${n}"><img src="${esc(sized(s, 900))}"${srcset(s)} alt="${esc(p.name + ', ' + v.color + ', photo ' + (k + 2))}" loading="${k === 0 ? 'eager' : 'lazy'}" decoding="async"></figure>`).join('')}
      </div>
      <div class="px-ui">${rail(p, v)}${priceBox(v)}</div>
      <button class="px-save" type="button" data-wish="${esc(p.id)}" aria-pressed="${MX.wished(p.id)}" aria-label="Save ${esc(p.name)} to Liked">${H1}</button>
      ${n > 1 ? `<div class="px-pager" aria-hidden="true"><span class="pg-n"><b>${i + 1}</b>/${n}</span><span class="pg-dots">${Array.from({ length: n }, (_, k) => `<button type="button" tabindex="-1" data-pxdot="${k}" class="${k === i ? 'on' : ''}"></button>`).join('')}</span></div>` : ''}`;
  }

  /* ---------- under the frame: name, hearts, three facts ---------- */
  function head(p, v) {
    const s = stats(notesFor(p.id));
    const rate = s.n ? `<button class="px-rate" type="button" data-pxnotes aria-label="${s.avg.toFixed(1)} out of 5 hearts from ${s.n} fit ${s.n === 1 ? 'note' : 'notes'}">${hearts(s.avg)}<b>${s.avg.toFixed(1)}</b><small>${s.n} fit ${s.n === 1 ? 'note' : 'notes'}</small></button>`
      : `<button class="px-rate new" type="button" data-pxnotes><small>New pair</small><b>No fit notes yet</b></button>`;
    return `<div class="px-head"><div class="px-hl"><h1 class="px-name">${esc(p.name)}</h1><p class="px-sub">${esc(p.category)} · <span id="pxColName">${esc(v.color)}</span></p></div>${rate}</div>
      <div class="px-facts" id="pxFacts">${facts(v)}</div>`;
  }
  // three numbers a buyer can hold us to, instead of adjectives
  const facts = (v) => [
    [days(), 'and it is on your feet'],
    isSale(v) ? ['Final size', 'at this sale price'] : [EX + ' days', 'to swap the size, no stress'],
    ['30 days', 'we stand behind every stitch']
  ].map(([b, s]) => `<span><b>${esc(b)}</b><small>${esc(s)}</small></span>`).join('');

  /* ---------- who the pair is for: three real photographs, one colour each ---------- */
  const FOR = [
    ['me', 'For me', 'Because you deserve it', 'm-hero.webp'],
    ['gift', 'A gift', 'For someone you love', 'm-g-hands.webp'],
    ['give', 'Donate a pair', 'For someone in need', 'm-g-boy-smile.webp']
  ];
  function forCards() {
    const m = st().mode || 'me';
    return `<div class="px-fcards" role="radiogroup" aria-label="Who is this pair for">${FOR.map(([k, b, s, ph]) => `<button type="button" class="px-fc k-${k}" role="radio" data-pxfor="${k}" aria-checked="${m === k}"><img src="${esc(asset(ph))}" alt="" loading="lazy" decoding="async"><span class="fc-t"><b>${b}</b><small>${s}</small></span><i class="fc-ok">${ic('check')}</i></button>`).join('')}</div>`;
  }
  function forPanel(p, v) {
    const m = st().mode || 'me';
    if (m === 'gift') return `<div class="px-fp k-gift"><div class="fp-note" aria-hidden="true"><span class="fn-d">${DMARK}</span><i>Eid Mubarak, Abbu.</i><i class="fn-from">From Ali</i></div>
      <div class="fp-t"><b>He lifts the lid, and your words are the first thing he sees.</b><ul><li>${ic('gift')}We pack it as a gift and place your note inside.</li><li>${ic('truck')}It goes to his door, and there is nothing for him to pay.</li><li>${ic('help')}Not sure of his size? It is printed on the tongue of a pair he wears now.</li></ul></div></div>`;
    if (m === 'give') return `<div class="px-fp k-give"><img class="fp-ph" src="${esc(asset('m-g-boys-corn.webp'))}" alt="Two boys sitting in a field" loading="lazy">
      <div class="fp-t"><b>Your pair, on the feet of someone who could not buy it.</b><p>We match the size to the person who receives it and add ${esc(fmt(DAUR_ADD))} of our own to every pair you sponsor. A private photo of the moment reaches you within 7 days of the handover.</p><a class="fp-a" href="${href.giving}" data-m>How philanthropy works ${ic('arrow')}</a></div></div>`;
    return `<div class="px-fp k-me"><ul>
      <li>${ic('box')}<span><b>Out of Islamabad within 24 hours</b> of a quick confirmation on WhatsApp.</span></li>
      <li>${ic('truck')}<span><b>On your feet in ${esc(days())}</b>, in any city in Pakistan.</span></li>
      <li>${ic('wallet')}<span><b>Rs. 1,000 holds this pair in your name.</b> The rest you pay when the box is in your hands. <button type="button" class="r9-whyl" data-why>How it works</button></span></li>
      <li>${isSale(v) ? `${ic('tag')}<span><b>This is a sale price, so the size is final.</b> Measure your foot with the size guide first, or ask us on WhatsApp and we will help you choose.</span>` : `${ic('swap')}<span><b>You can swap the size within ${EX} days</b> if the fit is not right, so a wrong guess is never a lost pair.</span>`}</li></ul></div>`;
  }

  /* ---------- fit notes: social style cards that swipe sideways, each with a drawn character avatar ----------
     The avatar is a drawing chosen from the name, never a photo of a real person. */
  function hashN(t) { let h = 7; String(t || '').split('').forEach((c) => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h; }
  /* ---------- eight drawn characters for fit notes: each note gets a different one, never a photo of a real person ---------- */
  const AVS = (() => {
    const S = ['#F3CFA9', '#E2B48A', '#C98F64', '#A86E48', '#7E4E33'];
    const eyes = (y, g) => `<ellipse cx="50" cy="${y}" rx="3.1" ry="3.6" fill="#1F1A17"/><ellipse cx="70" cy="${y}" rx="3.1" ry="3.6" fill="#1F1A17"/><circle cx="51.1" cy="${y - 1.3}" r="1" fill="#fff"/><circle cx="71.1" cy="${y - 1.3}" r="1" fill="#fff"/>${g ? `<g fill="none" stroke="${g}" stroke-width="2.2"><circle cx="50" cy="${y}" r="8"/><circle cx="70" cy="${y}" r="8"/><path d="M58 ${y}h4"/></g>` : ''}`;
    const brows = (y, c, t) => `<path d="M43 ${y}q7 ${t || -3} 14 0M63 ${y}q7 ${t || -3} 14 0" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const face = (sk, extra) => `<path d="M30 60c0-19 13-31 30-31s30 12 30 31c0 20-13 36-30 36S30 80 30 60z" fill="${sk}"/><ellipse cx="30.5" cy="62" rx="4.5" ry="7" fill="${sk}"/><ellipse cx="89.5" cy="62" rx="4.5" ry="7" fill="${sk}"/>${extra || ''}<path d="M58 66q2 4 4 0" stroke="rgba(0,0,0,.25)" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="71" rx="4.5" ry="2.6" fill="#E88F7A" opacity=".28"/><ellipse cx="76" cy="71" rx="4.5" ry="2.6" fill="#E88F7A" opacity=".28"/>`;
    const smile = (c) => `<path d="M52 77q8 6 16 0" stroke="${c || '#5A2E22'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const body = (shirt, sk, kind) => `<path d="M53 88h14v12H53z" fill="${sk}"/><path d="M14 120c2-17 18-26 46-26s44 9 46 26z" fill="${shirt}"/>${kind === 'collar' ? '<path d="M48 95l12 10 12-10" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5" stroke-linejoin="round"/>' : kind === 'hood' ? '<path d="M36 100c6 8 14 11 24 11s18-3 24-11" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/><path d="M54 108v10M66 108v10" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-linecap="round"/>' : kind === 'tee' ? '<path d="M50 96q10 7 20 0" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="3"/>' : ''}`;
    const wrap = (bg1, bg2, inner) => `<svg class="st-avi" viewBox="12 16 96 96" aria-hidden="true"><defs><linearGradient id="AVG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="120" height="120" fill="${bg1}"/><circle cx="96" cy="22" r="30" fill="${bg2}" opacity=".55"/>${inner}</svg>`;
    return [
      // 1 short fade and a trimmed beard
      () => wrap('#172C27', '#2E4A42', body('#F1EBDD', S[2], 'collar') + face(S[2], '<path d="M33 66c2 18 13 29 27 29s25-11 27-29c-3 9-12 13-27 13s-24-4-27-13z" fill="#2A1E17"/>') + '<path d="M30 52c0-16 12-26 30-26s30 10 30 26c-4-8-12-12-30-12s-26 4-30 12z" fill="#1E1611"/>' + brows(51, '#1E1611') + eyes(58) + smile('#F1EBDD')),
      // 2 curly top, round glasses
      () => wrap('#A58A64', '#C7AE86', body('#172C27', S[0], 'tee') + face(S[0]) + '<g fill="#3A2618"><circle cx="40" cy="38" r="9"/><circle cx="52" cy="31" r="10"/><circle cx="66" cy="30" r="10"/><circle cx="79" cy="36" r="9"/><circle cx="86" cy="46" r="7"/><circle cx="34" cy="47" r="7"/></g>' + brows(50, '#3A2618') + eyes(58, '#172C27') + smile()),
      // 3 backward cap and stubble
      () => wrap('#6B7550', '#8C9670', body('#252625', S[3], 'hood') + face(S[3], '<path d="M36 72c3 13 12 21 24 21s21-8 24-21c-5 6-13 9-24 9s-19-3-24-9z" fill="rgba(30,22,17,.35)"/>') + '<path d="M29 50c1-16 14-25 31-25s30 9 31 25z" fill="#F1EBDD"/><path d="M29 50h62" stroke="#A58A64" stroke-width="3"/><path d="M22 52c4-3 8-3 10-2" stroke="#F1EBDD" stroke-width="6" stroke-linecap="round"/>' + brows(53, '#1E1611') + eyes(60) + smile()),
      // 4 side part and a moustache
      () => wrap('#E9DFCB', '#D6C7A6', body('#6B7550', S[1], 'collar') + face(S[1], '<path d="M49 73c4-3 8-3 11 0 3-3 7-3 11 0-2 4-6 5-11 3-5 2-9 1-11-3z" fill="#2B1C14"/>') + '<path d="M30 54c-2-17 11-28 30-28 18 0 31 9 30 26-6-9-17-13-28-12l-6-6c-4 7-14 12-26 20z" fill="#2B1C14"/>' + brows(51, '#2B1C14') + eyes(58) + '<path d="M54 80q6 3 12 0" stroke="#5A2E22" stroke-width="2.2" fill="none" stroke-linecap="round"/>'),
      // 5 wavy hair and a full beard
      () => wrap('#252625', '#3C3D3B', body('#A58A64', S[2], 'tee') + face(S[2], '<path d="M31 62c0 22 13 36 29 36s29-14 29-36c-3 10-10 14-15 14-4-3-9-4-14-4s-10 1-14 4c-5 0-12-4-15-14z" fill="#3B2A1F"/>') + '<path d="M27 64c-4-24 10-40 33-40s37 16 33 40c-2-9-6-15-10-18-7 4-15 5-23 5s-16-1-23-5c-4 3-8 9-10 18z" fill="#3B2A1F"/>' + brows(52, '#3B2A1F') + eyes(59) + smile('#F1EBDD')),
      // 6 beanie, clean shaven
      () => wrap('#C7AE86', '#E3D2B0', body('#F1EBDD', S[4], 'hood') + face(S[4]) + '<path d="M28 54c0-19 14-30 32-30s32 11 32 30z" fill="#172C27"/><rect x="26" y="48" width="68" height="10" rx="5" fill="#2E4A42"/><circle cx="60" cy="22" r="6" fill="#A58A64"/>' + brows(62, '#1E1611', -2) + eyes(68) + '<path d="M52 82q8 5 16 0" stroke="#3A1F15" stroke-width="2.4" fill="none" stroke-linecap="round"/>'),
      // 7 shaved head, full beard, glasses
      () => wrap('#2E4A42', '#4E6A60', body('#252625', S[1], 'collar') + face(S[1], '<path d="M31 62c0 22 13 34 29 34s29-12 29-34c-2 8-6 13-11 14-5-3-11-4-18-4s-13 1-18 4c-5-1-9-6-11-14z" fill="#4A3426"/>') + '<path d="M31 50c3-14 14-22 29-22s26 8 29 22c-7-6-17-9-29-9s-22 3-29 9z" fill="rgba(40,28,20,.25)"/>' + brows(52, '#4A3426') + eyes(59, '#A58A64') + smile('#F1EBDD')),
      // 8 tall quiff and light stubble
      () => wrap('#D9C7A3', '#BFA77D', body('#2E4A42', S[0], 'hood') + face(S[0], '<path d="M37 74c3 12 11 19 23 19s20-7 23-19c-5 5-13 8-23 8s-18-3-23-8z" fill="rgba(60,40,28,.22)"/>') + '<path d="M30 54c-3-14 4-24 14-28 8-10 26-12 36-4 9 5 12 14 10 30-4-8-11-12-20-13-8 0-14-3-17-8-5 6-13 11-23 23z" fill="#5A3A24"/>' + brows(51, '#5A3A24') + eyes(58) + smile())
    ];
  })();
  let avN = 0;
  const avatar = (name, k) => { const i = (k != null ? k : hashN(name)) % AVS.length; return AVS[i]().replace(/AVG/g, 'avg' + (++avN)); };
  const ago = (d) => {
    if (!d) return ''; const t = new Date(d + 'T12:00:00'); if (isNaN(t)) return '';
    const days = Math.max(0, Math.round((Date.now() - t) / 864e5));
    return days < 1 ? 'today' : days < 7 ? days + 'd' : days < 35 ? Math.round(days / 7) + 'w' : when(d);
  };
  const FITW = (f) => { f = String(f || '').toLowerCase(); return /small/.test(f) ? 'Runs small' : /large|big/.test(f) ? 'Runs large' : /true/.test(f) ? 'True to size' : ''; };
  function story(n, k) {
    const r = Math.max(1, Math.min(5, Math.round(+n.rating || 5)));
    const chips = [n.title, FITW(n.fit), n.size ? 'EU ' + n.size : ''].filter(Boolean);
    return `<article class="px-story"><header><span class="st-av">${avatar(n.name || n.id, k)}</span>
        <span class="st-who"><b>${esc(n.name || 'DAUR buyer')}${n.verified ? `<i class="st-tick" title="Bought from DAUR">${ic('check')}</i>` : ''}</b><small>${esc([n.city, ago(n.date)].filter(Boolean).join(' · '))}</small></span></header>
      <div class="st-rate">${hearts(r, 'sm')}<em>${r}.0</em></div>
      ${n.body ? `<p class="st-body">${esc(n.body)}</p>` : ''}
      ${n.photo ? `<img class="st-ph" src="${esc(n.photo)}" alt="Photo from ${esc(n.name || 'a buyer')}" loading="lazy">` : ''}
      ${chips.length ? `<div class="st-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</article>`;
  }
  function notesSec(p) {
    const list = notesFor(p.id).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (+b.rating || 0) - (+a.rating || 0));
    const s = stats(list);
    const write = `<button class="px-write" type="button" data-pxwrite>${ic('chat')}<span><b>Wearing this pair?</b><small>Tell the next buyer how it feels. It takes a minute.</small></span>${ic('arrow')}</button>`;
    if (!s.n) return `<section class="px-sec px-notes" id="pxNotes"><div class="px-nh"><h2 class="px-h">Fit notes</h2></div>
      <div class="px-empty">${hearts(0, 'lg')}<b>Be the first voice on this pair.</b><p>Every note here comes from a real buyer, and a person on our team reads each one before it goes live.</p></div>${write}</section>`;
    const fitN = s.fit.small + s.fit.true + s.fit.large;
    const top = fitN ? [['true', 'true to size'], ['small', 'it runs small'], ['large', 'it runs large']].sort((a, b) => s.fit[b[0]] - s.fit[a[0]])[0] : null;
    const base = hashN(p.id), faces = list.slice(0, 4).map((n, k) => `<span class="nf-f">${avatar(n.name || n.id, base + k)}</span>`).join('');
    return `<section class="px-sec px-notes" id="pxNotes"><div class="px-nh"><h2 class="px-h">Fit notes</h2><span class="px-mute">${s.n} ${s.n === 1 ? 'buyer' : 'buyers'} talking</span></div>
      <div class="px-nsum"><span class="nf">${faces}</span><span class="ns-t"><b>${s.avg.toFixed(1)}</b>${hearts(s.avg, 'sm')}<small>${top ? s.fit[top[0]] + ' of ' + fitN + ' say ' + top[1] : 'from ' + s.n + ' fit notes'}</small></span></div>
      <div class="px-stories" id="pxStories" tabindex="0" aria-label="Fit notes, swipe sideways">${list.map((n, k) => story(n, base + k)).join('')}</div>
      ${list.length > 1 ? `<div class="px-sdots" aria-hidden="true">${list.slice(0, 12).map((x, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
      ${write}</section>`;
  }
  function bindStories() {
    const r = $('#pxStories', view), d = $$('.px-sdots i', view); if (!r || !d.length) return;
    r.addEventListener('scroll', () => { const w = (r.firstElementChild || {}).offsetWidth || 1; const i = Math.min(d.length - 1, Math.round(r.scrollLeft / (w + 12))); d.forEach((x, k) => x.classList.toggle('on', k === i)); }, { passive: true });
  }

  /* ---------- write a fit note: name, phone, hearts, comfort, a few words. Nothing else. ---------- */
  const COMFORT = ['Comfortable from day one', 'Soft after a few days', 'Snug, in a good way', 'Firm and supportive', 'Light on the feet'];
  function noteForm(p) {
    const f = st().fn || (st().fn = { r: 0, c: '' });
    openSheet(`<form class="px-nform" id="pxNform" novalidate><h3 class="sh-h">Your fit note</h3><button class="px-sgx" type="button" data-pxsgx aria-label="Close">${ic('x')}</button>
      <p class="px-mute nf-p">On the ${esc(p.name)}. A person on our team reads it before it goes live.</p>
      <div class="nf-l">How do you rate it?</div>
      <div class="nf-hearts" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((k) => `<button type="button" role="radio" aria-checked="${f.r === k}" aria-label="${k} of 5" data-pxrate="${k}" class="${k <= f.r ? 'on' : ''}">${H1}</button>`).join('')}</div>
      <div class="nf-l">How does it feel?</div>
      <div class="nf-chips" role="radiogroup" aria-label="Comfort">${COMFORT.map((c) => `<button type="button" role="radio" aria-checked="${f.c === c}" data-pxcomf="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <label class="nf-l" for="nfBody">In your words</label><textarea id="nfBody" maxlength="400" rows="3" placeholder="The first week, the fit, what people said"></textarea>
      <div class="nf-two"><span><label class="nf-l" for="nfName">Your name</label><input id="nfName" autocomplete="name" maxlength="40" enterkeyhint="next"></span>
      <span><label class="nf-l" for="nfPhone">Phone</label><input id="nfPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="03XX XXXXXXX"></span></div>
      <small class="nf-priv">Your phone stays with us. Only your first name shows on the note.</small>
      <p class="nf-err" role="alert"></p>
      <button class="px-pick" type="submit">Share my fit note</button></form>`);
  }
  function sendNote() {
    const p = prod(), f = st().fn || {}, fm = $('#pxNform'); if (!fm) return;
    const name = $('#nfName', fm).value.trim(), phone = $('#nfPhone', fm).value.replace(/[^\d+]/g, ''), body = $('#nfBody', fm).value.trim(), err = $('.nf-err', fm);
    const miss = !f.r ? 'Choose a rating from one to five hearts.' : !f.c ? 'Choose how it feels.' : body.length < 8 ? 'Write a few words about the pair.' : !name ? 'Add your name.' : phone.replace(/\D/g, '').length < 10 ? 'Add a phone number so we can confirm the note is yours.' : '';
    if (miss) { err.textContent = miss; return; }
    const v = varOf(p);
    const item = { id: 'fn' + Date.now().toString(36), status: 'pending', at: new Date().toISOString(), pid: p.id, vid: v.id, pname: p.name, rating: f.r, name: name.split(/\s+/)[0], fullName: name, phone, title: f.c, body, size: st().size || '' };
    const viaWa = () => { const t = 'Assalam o Alaikum DAUR, my fit note for the ' + p.name + ' (' + v.color + '): ' + f.r + ' of 5 hearts. ' + f.c + '. ' + body + ' From ' + name + ', ' + phone; try { window.open(waLink(t), '_blank', 'noopener'); } catch (e) { location.href = waLink(t); } };
    const btn = $('[type=submit]', fm); if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
    const done = () => { st().fn = null; closeSheet(); toast('Thank you, ' + item.name + '. Your fit note is with our team and goes live once read.'); };
    try {
      if (window.DAUR_SHOPIFY && window.DAUR_SHOPIFY.forward) window.DAUR_SHOPIFY.forward('reviews', [item], { onOk: done, onFail: () => { done(); viaWa(); } });
      else { done(); viaWa(); }
    } catch (e) { done(); viaWa(); }
  }

  /* ---------- the details and more pairs ---------- */
  function about(p) {
    const d = String(p.description || '').trim(), first = d.split(/(?<=\.)\s/)[0] || d, more = !!st().pxMore, long = d.length > first.length;
    const specs = p.specs ? Object.keys(p.specs).map((k) => `<div><dt>${esc(k)}</dt><dd>${esc(p.specs[k])}</dd></div>`).join('') : '';
    return `<section class="px-sec px-about"><h2 class="px-h">About this pair</h2><p>${esc(more || !long ? d : first)}${long ? ` <button class="px-more" type="button" data-pxmore>${more ? 'Less' : 'Read more'}</button>` : ''}</p>
      ${specs ? `<dl class="px-spec">${specs}</dl>` : ''}</section>`;
  }
  function morePairs(p) {
    const rest = P().filter((x) => x.id !== p.id), same = rest.filter((x) => x.category === p.category), list = same.concat(rest.filter((x) => x.category !== p.category)).slice(0, 4);
    if (!list.length) return '';
    return `<section class="px-sec px-rel"><div class="m-row"><h2 class="px-h">More from the drop</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div></section><div class="m-grid">${list.map((x) => card(x, false)).join('')}</div>`;
  }

  /* ---------- the button: the app's black primary, with the price on it, and it tells the buyer the next step ---------- */
  // phase: nothing (choose or add), 'pack' (the box is being packed) or 'done' (the box is in the bag)
  function bar(p, v, phase) {
    const b = buyBar(); b.classList.add('px-buy');
    const dt = $('#pxDockT', view); if (dt) { dt.textContent = phase === 'pack' ? 'Packing your pair' : dockText(); const dd = $('#pxDock', view); if (dd) dd.classList.toggle('ready', (st().mode || 'me') === 'give' || !!st().size); }
    const s = st(), m = s.mode || 'me', z = s.size, q = z ? qty(v, z) : 0, done = !!phase;
    let t, sub, icon;
    if (phase === 'pack') { t = m === 'give' ? 'Packing your gift' : 'Packing your pair'; sub = m === 'give' ? 'For someone in need' : 'EU ' + z + (m === 'gift' ? ' · as a gift' : ' · ' + fmt(v.price)); icon = m === 'give' ? 'hand' : m === 'gift' ? 'gift' : 'bag'; }
    else if (done) { t = m === 'give' ? 'Thank you' : 'In your bag'; sub = m === 'give' ? 'Your pair is on its way to someone' : m === 'gift' ? 'Open your bag to write the note' : 'Rs. 1,000 holds it in your name'; icon = 'check'; }
    else if (m === 'give') { t = 'Donate this pair'; sub = fmt(v.price) + ' · we match the size'; icon = 'hand'; }
    else if (!z) { t = m === 'gift' ? 'Choose his size' : 'Choose your size'; sub = fmt(v.price) + (m === 'gift' ? ' · as a gift' : ''); icon = m === 'gift' ? 'gift' : 'bag'; }
    else { t = m === 'gift' ? 'Add as a gift' : 'Add to bag'; sub = 'EU ' + z + ' · ' + fmt(v.price); icon = m === 'gift' ? 'gift' : 'bag'; }
    const ready = m === 'give' || !!z;
    b.innerHTML = `${!done && z && m !== 'give' && q > 0 && q <= LOW ? `<p class="px-low"><i></i>Only ${q} left in EU ${esc(z)}</p>` : ''}
      <button class="px-cta px-swp k-${m}${ready ? ' ready' : ''}${done ? ' done' : ''}${phase === 'pack' ? ' pack' : ''}" type="button" data-pxbuy aria-label="${esc(t + ', ' + sub)}${ready && !done ? '. Swipe right or tap' : ''}"><span class="sw-k" aria-hidden="true">${done ? ic('check') : MX.DMARK}</span><span class="sw-ch" aria-hidden="true"><i></i><i></i><i></i></span><span class="ct-t"><b>${esc(t)}</b><small>${esc(sub)}</small></span></button>`;
    bindSwipe($('.px-swp', b));
  }

  /* ---------- swipe right to add: the D key slides along the bar; past two thirds of the way it adds the pair.
     A tap on the bar does the same, so nobody has to swipe. ---------- */
  let swiped = false;
  function bindSwipe(btn) {
    if (!btn || !btn.classList.contains('ready') || btn.classList.contains('done') || btn.classList.contains('pack')) return;
    const k = $('.sw-k', btn); let x0 = null, dx = 0, max = 0;
    const end = () => {
      if (x0 === null) return; const ok = dx > max * 0.66; x0 = null;
      btn.classList.remove('drag'); k.style.transform = ''; btn.style.setProperty('--sw-p', 0);
      if (ok) { swiped = true; setTimeout(() => { swiped = false; }, 400); buy(btn); }
    };
    k.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; max = btn.clientWidth - k.offsetWidth - 12; btn.classList.add('drag'); try { k.setPointerCapture(e.pointerId); } catch (er) {} });
    k.addEventListener('pointermove', (e) => { if (x0 === null) return; dx = Math.max(0, Math.min(max, e.clientX - x0)); k.style.transform = `translateX(${dx}px)`; btn.style.setProperty('--sw-p', (dx / Math.max(1, max)).toFixed(3)); if (dx > 4) e.preventDefault(); });
    k.addEventListener('pointerup', end); k.addEventListener('pointercancel', end);
    k.addEventListener('click', (e) => { if (swiped) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  /* ---------- the page ---------- */
  V.product = function () {
    const p = prod(); if (!p) return V.shop();
    const s = st();
    if (!s.pv || s.pid !== p.id) { s.pid = p.id; s.pv = firstV(p).id; s.size = null; s.mode = 'me'; s.pxi = 0; s.pxAll = false; s.pxMore = false; }
    const v = varOf(p);
    view.innerHTML = `<div class="px" id="px">
      <section class="px-stage${(s.pxi || 0) > 0 ? ' on-ph' : ''}" id="pxStage">${stage(p, v)}</section>
      ${dock()}
      <div class="px-colors" id="pxColors">${swatches(p, v)}</div>
      ${head(p, v)}
      <section class="px-sec px-for"><div class="px-nh"><h2 class="px-h">Who will wear it?</h2></div>${forCards()}<div id="pxFor">${forPanel(p, v)}</div></section>
      ${notesSec(p)}
      ${about(p)}
      ${morePairs(p)}
    </div>`;
    bar(p, v);
    bindStage(true); bindStories();
  };

  function paintStage(anim) {
    const p = prod(), v = varOf(p), el = $('#pxStage', view); if (!el) return;
    el.innerHTML = stage(p, v);
    el.classList.toggle('on-ph', (st().pxi || 0) > 0);
    bindStage(false);
    if (anim && !reduce) { const im = $('.px-pair', el); if (im) im.animate([{ opacity: 0, transform: 'translateX(36px) rotate(-6deg)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
  }
  function paintRail() { const p = prod(), v = varOf(p), r = $('.px-rail.l', view); if (r) r.outerHTML = rail(p, v); }
  function bindStage(first) {
    bindDock();
    const t = $('#pxTrack', view), el = $('#pxStage', view); if (!t || !el) return;
    const n = t.children.length, s = st();
    // a heavy photo on a slow line: the frame shimmers until the pair is there, never a spinner
    $$('.px-pair[data-bb]', t).forEach(fitPair);
    $$('img', t).forEach((im) => { const ok = () => im.closest('.px-slide').classList.add('ld'); if (im.complete && im.naturalWidth) ok(); else { im.addEventListener('load', ok, { once: true }); im.addEventListener('error', ok, { once: true }); } });
    if (s.pxi) t.scrollLeft = s.pxi * t.clientWidth;
    let raf = 0;
    const mark = () => { const i = Math.max(0, Math.min(n - 1, Math.round(t.scrollLeft / Math.max(1, t.clientWidth)))); if (i === s.pxi) return; s.pxi = i; el.classList.toggle('on-ph', i > 0); $$('[data-pxdot]', el).forEach((d, k) => d.classList.toggle('on', k === i)); const c = $('.pg-n b', el); if (c) c.textContent = i + 1; };
    t.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
    // the first pair a visitor opens shows, once, that the frame holds more photos
    if (first && n > 1 && !reduce && !s.pxi) {
      let seen = false; try { seen = sessionStorage.getItem('daur.pxPeek') === '1'; sessionStorage.setItem('daur.pxPeek', '1'); } catch (e) { seen = true; }
      if (!seen) setTimeout(() => { if (!t.isConnected || s.pxi) return; t.scrollTo({ left: 64, behavior: 'smooth' }); setTimeout(() => { if (t.isConnected && t.scrollLeft < t.clientWidth / 2) t.scrollTo({ left: 0, behavior: 'smooth' }); }, 520); }, 1100);
    }
  }
  function goSlide(i) { const t = $('#pxTrack', view); if (t) t.scrollTo({ left: i * t.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---------- the size guide: a card over the page, with a foot length finder ---------- */
  function sizeSheet() {
    const p = prod(), v = varOf(p), s = st();
    const have = p.sizes.map(Number), rows = CHART.filter((r) => have.includes(r[1]));
    if (!rows.length) return;
    const lo = Math.round((rows[0][4] - 0.6) * 10) / 10, hi = rows[rows.length - 1][4];
    const start = rowOf(s.size || (have.includes(42) ? 42 : rows[Math.floor(rows.length / 2)][1])) || rows[0];
    const cm0 = start[4];
    openSheet(`<div class="px-sgs"><h3 class="sh-h">Size guide</h3><button class="px-sgx" type="button" data-pxsgx aria-label="Close the size guide">${ic('x')}</button><p class="px-mute sg-p">Men's sizes. Slide to the length of your foot and we show the size that fits.</p>
      <div class="sg-fit"><div class="sg-top"><label for="pxCm">Your foot length</label><output id="pxCmOut" for="pxCm">${cm0.toFixed(1)} cm</output></div>
        <input type="range" id="pxCm" min="${lo}" max="${hi}" step="0.1" value="${cm0}" aria-label="Your foot length in centimetres">
        <div class="sg-res"><span class="sg-k">Your size</span><b id="pxCmEu"></b><small id="pxCmUk"></small></div>
        <button class="px-pick" type="button" data-pxpick=""></button></div>
      <h4 class="sh-k">Men's size conversion chart</h4>
      <div class="sg-tw"><table class="sg-t sg-full"><thead><tr><th>US</th><th>EU</th><th>UK</th><th>Inches</th><th>cm</th></tr></thead><tbody>${CHART.map(([us, eu, uk, inch, cm]) => { const st2 = have.includes(eu); return `<tr data-eu="${eu}" class="${st2 ? 'stk' : 'nst'}${st2 && !(qty(v, eu) > 0) ? ' sold' : ''}"><td>${us}</td><td><b>${eu}</b></td><td>${uk}</td><td>${inch}</td><td>${cm}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="sg-fine">Highlighted rows are the sizes this pair comes in. All measurements are approximate and are a guide to your size.</p>
      <h4 class="sh-k">How to measure</h4>
      <ol class="sg-steps"><li>Place a sheet of paper on a flat floor and stand on it with your heel against a wall.</li><li>Mark the tip of your longest toe.</li><li>Measure from the heel to the mark in centimetres.</li><li>Choose the closest length in the chart. Between sizes, the larger one is usually more comfortable.</li></ol>
      <p class="sg-note">${ic(isSale(v) ? 'tag' : 'swap')}<span>${isSale(v) ? 'This pair is at a sale price, so its size is final. Measure first, or ask us before you order.' : 'Full price pairs can be swapped for size within ' + EX + ' days of delivery.'}</span></p>
      <a class="px-wa" href="${waLink('Assalam o Alaikum DAUR, which size of ' + p.name + ' should I take? My foot is ')}" target="_blank" rel="noopener">${ic('wa')}Not sure? Ask us on WhatsApp</a></div>`);
    const r = $('#pxCm'), out = $('#pxCmOut'), eu = $('#pxCmEu'), uk = $('#pxCmUk'), pick = $('[data-pxpick]');
    const upd = () => {
      const cm = +r.value, e = euFor(cm, have), row = rowOf(e), q = qty(v, e), pct = ((cm - lo) / Math.max(0.1, hi - lo)) * 100;
      r.style.setProperty('--pc', pct + '%');
      out.textContent = cm.toFixed(1) + ' cm'; eu.textContent = 'EU ' + e; uk.textContent = row ? 'UK ' + row[2] + ' · US ' + row[0] : '';
      pick.dataset.pxpick = q > 0 ? String(e) : ''; pick.disabled = !(q > 0) || st().mode === 'give';
      pick.textContent = st().mode === 'give' ? 'We match the size for you' : q > 0 ? 'Choose EU ' + e : 'EU ' + e + ' is sold out in ' + v.color;
      $$('.sg-t tr[data-eu]').forEach((tr) => tr.classList.toggle('on', +tr.dataset.eu === e));
    };
    r.addEventListener('input', upd); upd();
  }

  /* ---------- the box: a DAUR box opens, the pair goes in on its tissue, the lid swings shut on its hinge and the box
     lands in the bag. Every corner of the box is placed with the same perspective the browser gives the lid, so the
     lid meets the box exactly at every width. ---------- */
  let boxing = false;
  const RAD = Math.PI / 180;
  function geo() {
    // a shoe box of 33 by 20 by 12 cm, seen from the front and a little above
    const Wf = Math.round(Math.min(236, innerWidth * 0.6)), Pp = 900, TH = 62, sn = Math.sin(TH * RAD), cs = Math.cos(TH * RAD);
    const Wl = (Wf * Pp) / (Pp + 0.6 * Wf * sn), Hl = Wl * 0.6, Hw = Wl * 0.36, Lh = Hw * 0.3;
    // X across from the middle, D from the back edge towards the viewer, H down from the rim
    const pt = (X, D, H) => { const y = D * cs + H * sn, z = D * sn - H * cs, k = Pp / (Pp - z); return [Wf / 2 + X * k, y * k]; };
    return { Wf, Pp, TH, Wl, Hl, Hw, Lh, pt, Hb: pt(0, Hl, Hw)[1] };
  }
  const pts = (a) => a.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  function boxHtml(g) {
    const { Wf, Wl, Hl, Hw, Lh, pt, Hb } = g, h = Wl / 2, f = (n) => n.toFixed(1);
    const TL = pt(-h, 0, 0), TR = pt(h, 0, 0), FL = pt(-h, Hl, 0), FR = pt(h, Hl, 0), BL = pt(-h, Hl, Hw), BR = pt(h, Hl, Hw), KL = pt(-h, 0, Hw), KR = pt(h, 0, Hw);
    const vb = `viewBox="0 0 ${Wf} ${f(Hb)}" overflow="visible"`;
    const across = (y) => { const t = (y - TL[1]) / (FL[1] - TL[1]); return [TL[0] + (FL[0] - TL[0]) * t, TR[0] + (FR[0] - TR[0]) * t]; };
    // tissue lying in the box, and the sheet that folds up over the pair before the lid comes down
    const ty = TL[1] + (FL[1] - TL[1]) * 0.36, [a1, b1] = across(ty), w1 = b1 - a1;
    const tissue = `M${f(FL[0] + 2)},${f(FL[1])} L${f(a1 + 2)},${f(ty + 6)} C${f(a1 + w1 * 0.18)},${f(ty - 4)} ${f(a1 + w1 * 0.36)},${f(ty + 7)} ${f(Wf / 2)},${f(ty + 1)} S${f(a1 + w1 * 0.84)},${f(ty - 5)} ${f(b1 - 2)},${f(ty + 5)} L${f(FR[0] - 2)},${f(FR[1])} Z`;
    const fy = TL[1] + (FL[1] - TL[1]) * 0.56, [a2, b2] = across(fy), w2 = b2 - a2;
    const flap = `M${f(FL[0] + 1)},${f(FL[1] + 2)} L${f(a2 + 1)},${f(fy + 4)} Q${f(a2 + w2 * 0.26)},${f(fy - 7)} ${f(Wf / 2)},${f(fy - 1)} T${f(b2 - 1)},${f(fy + 4)} L${f(FR[0] - 1)},${f(FR[1] + 2)} Z`;
    const crease = `M${f(a2 + w2 * 0.3)},${f(fy + 3)} L${f(a2 + w2 * 0.24)},${f(FL[1])} M${f(a2 + w2 * 0.66)},${f(fy + 1)} L${f(a2 + w2 * 0.74)},${f(FL[1])}`;
    const lineAt = (H) => [pt(-h * 0.93, Hl, H), pt(h * 0.93, Hl, H)];
    const [s1, s2] = lineAt(Hw * 0.84), lipY = pt(0, Hl, Lh)[1];
    const back = `<svg class="bx-back" ${vb}><defs>
        <radialGradient id="pxbxSh"><stop offset="0" stop-color="#111917" stop-opacity=".34"/><stop offset="1" stop-color="#111917" stop-opacity="0"/></radialGradient>
        <linearGradient id="pxbxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2ECDE"/><stop offset="1" stop-color="#C3B7A5"/></linearGradient>
        <linearGradient id="pxbxTs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#ECE5D4"/></linearGradient></defs>
      <ellipse cx="${f(Wf / 2)}" cy="${f(Hb + 2)}" rx="${f(Wf * 0.6)}" ry="12" fill="url(#pxbxSh)"/>
      <polygon points="${pts([TL, FL, BL, KL])}" fill="#D2C7B8"/><polygon points="${pts([TR, FR, BR, KR])}" fill="#D2C7B8"/>
      <polygon points="${pts([TL, TR, KR, KL])}" fill="url(#pxbxIn)"/>
      <path d="${tissue}" fill="url(#pxbxTs)"/>
      <polyline points="${pts([FL, TL, TR, FR])}" fill="none" stroke="#3B5650" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
    const front = `<svg class="bx-front" ${vb}><defs>
        <linearGradient id="pxbxFr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E4540"/><stop offset=".45" stop-color="#20312D"/><stop offset="1" stop-color="#162320"/></linearGradient>
        <linearGradient id="pxbxEd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".1" stop-color="#000" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <polygon points="${pts([FL, FR, BR, BL])}" fill="url(#pxbxFr)"/><polygon points="${pts([FL, FR, BR, BL])}" fill="url(#pxbxEd)"/>
      <line x1="${f(FL[0])}" y1="${f(FL[1])}" x2="${f(FR[0])}" y2="${f(FR[1])}" stroke="#665946" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="${f(s1[0])}" y1="${f(s1[1])}" x2="${f(s2[0])}" y2="${f(s2[1])}" stroke="#A58353" stroke-opacity=".75" stroke-width=".9"/></svg>`;
    const lidW = Wl * 1.02, lidH = Hl * 1.012, rw = Wf * 0.1, bowY = pt(0, Hl * 0.5, 0)[1];
    return `${back}
      <span class="bx-lid" style="left:${f((Wf - lidW) / 2)}px;width:${f(lidW)}px;height:${f(lidH)}px">
        <span class="lid-out"><span class="lid-frame"></span><span class="lid-wm">${WORDMARK}<small>SUPPLY</small></span><i class="lid-rb v"></i><i class="lid-rb h"></i><i class="lid-glint"></i></span>
        <span class="lid-in"><span class="lid-iwm">${WORDMARK}<small>SUPPLY</small><em>OWN YOUR PACE.</em></span></span>
        <span class="lid-lip" style="height:${f(Lh)}px"><i class="lid-rb v"></i></span></span>
      <svg class="bx-flap" ${vb}><path d="${flap}" fill="url(#pxbxTs)"/><path d="${crease}" fill="none" stroke="#80715C" stroke-opacity=".22" stroke-width="1"/></svg>
      ${front}
      <span class="bx-rib" style="left:${f(Wf / 2 - rw / 2)}px;width:${f(rw)}px;top:${f(lipY - 1)}px;height:${f(Hb - lipY + 1)}px"></span>
      <span class="bx-bow" style="left:${f(Wf / 2)}px;top:${f(bowY)}px"><i></i><i></i><b></b></span>
      <span class="bx-seal" style="left:${f(Wf / 2)}px;top:${f((lipY + Hb) / 2)}px">${ic('hand')}</span>`;
  }
  // the open box under the pair: the same DAUR box the pair is packed in, waiting with its lid up
  function dock() {
    if (reduce) return '';
    const g = geo();
    return `<div class="px-dock" id="pxDock"><span class="dk-t" id="pxDockT" aria-live="polite">${esc(dockText())}</span>
      <div class="dk-box px-box k-me" aria-hidden="true" style="width:${g.Wf}px;height:${g.Hb.toFixed(1)}px;margin-left:${-g.Wf / 2}px">${boxHtml(g)}</div>
      <button type="button" class="dk-pill" data-pxbuy aria-label="Put the pair in your DAUR box"><span class="dk-i">${ic('bag')}</span><span class="dk-ch" aria-hidden="true"><i></i><i></i></span></button></div>`;
  }
  function dockText() {
    const s = st(), m = s.mode || 'me';
    if (m === 'give') return 'Swipe the pair down to sponsor it';
    if (!s.size) return m === 'gift' ? 'Choose his size, then swipe the pair down' : 'Choose your size, then swipe the pair down';
    return 'Swipe the pair down into your box';
  }
  function bindDock() {
    const pb = $('.px-slide.px-hero', view); if (!pb || pb._dk) return; pb._dk = 1;
    let y0 = null, x0 = 0;
    pb.addEventListener('touchstart', (e) => { const t = e.touches[0]; y0 = window.scrollY < 30 ? t.clientY : null; x0 = t.clientX; }, { passive: true });
    pb.addEventListener('touchend', (e) => {
      if (y0 == null) return; const t = e.changedTouches[0], dy = t.clientY - y0, dx = Math.abs(t.clientX - x0); y0 = null;
      if (dy > 64 && dx < 44) { const c = $('#pxDock .dk-pill', view); buy(c); }
    }, { passive: true });
  }
  function boxIt(mode, from) {
    return new Promise((done) => {
      if (reduce || !Element.prototype.animate) { done(false); return; }
      const g = geo(), { Wf, Wl, Hb, Pp, TH } = g, lidT = (a) => `perspective(${Pp}px) rotateX(${a}deg)`;
      const box = document.createElement('div'); box.className = 'px-box k-' + mode; box.setAttribute('aria-hidden', 'true');
      Object.assign(box.style, { width: Wf + 'px', height: Hb + 'px', marginLeft: -Wf / 2 + 'px' });
      box.innerHTML = boxHtml(g); app.appendChild(box);
      const lid = box.querySelector('.bx-lid');
      lid.style.transform = lidT(128);
      const br = box.getBoundingClientRect();
      // the pair leaves the frame from where it stands, or rises from the middle of the screen when the frame is out of sight
      const seen = !!from.box && from.box.cy > 70 && from.box.cy < innerHeight - 140 && from.box.w > 20;
      const fb = seen ? from.box : (() => { const w = Math.min(230, innerWidth * 0.56), hh = w * 0.62; return { cx: innerWidth / 2, cy: innerHeight * 0.38, w, h: hh, rot: 0 }; })();
      const im = document.createElement('img'); im.className = 'bx-pair'; im.alt = ''; im.src = from.src; if (!from.cut) im.classList.add('ph');
      const iw = fb.iw || fb.w, ih = fb.ih || fb.h, ox = fb.ox || 0, oy = fb.oy || 0;
      const x0 = fb.cx - br.left, y0 = fb.cy - br.top;
      Object.assign(im.style, { width: iw + 'px', height: ih + 'px', left: x0 - ox - fb.w / 2 + 'px', top: y0 - oy - fb.h / 2 + 'px', transformOrigin: `${ox + fb.w / 2}px ${oy + fb.h / 2}px` });
      box.insertBefore(im, box.querySelector('.bx-flap'));
      const sc = Math.min((Wl * 0.84) / fb.w, (Hb * 0.98) / fb.h), ph = fb.h * sc;
      const hx = Wf / 2 - x0, hy = -12 - ph / 2 - y0, dy = Hb - 7 - ph / 2 - y0, r0 = fb.rot || 0;
      const T = (x, y, r, s) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r}deg) scale(${s.toFixed(3)})`;
      const dk = $('#pxDock .dk-box', view), dr = dk && dk.getBoundingClientRect();
      if (dr && dr.top < innerHeight - 40 && dr.bottom > 60) {
        const dx = dr.left + dr.width / 2 - (br.left + br.width / 2), dy0 = dr.top + dr.height / 2 - (br.top + br.height / 2), k = dr.width / br.width;
        dk.style.visibility = 'hidden';
        box.animate([{ transform: `translate(${dx.toFixed(1)}px,${dy0.toFixed(1)}px) scale(${k.toFixed(3)})` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,.7,.2,1)' });
      } else box.animate([{ transform: 'translateY(130%) scale(.9)', opacity: 0 }, { transform: 'translateY(-5%) scale(1.02)', opacity: 1, offset: 0.72 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
      const fly = im.animate([
        { transform: T(0, 0, r0, seen ? 1 : 0.7), opacity: seen ? 1 : 0, easing: 'cubic-bezier(.25,.7,.35,1)' },
        { transform: T(hx * 0.42, hy * 0.42 - 52, r0 * 0.4 - 7, (1 + sc * 1.06) / 2), opacity: 1, offset: 0.38, easing: 'ease-in-out' },
        { transform: T(hx, hy, -2, sc * 1.06), opacity: 1, offset: 0.66, easing: 'linear' },
        { transform: T(hx, hy - 3, -1, sc * 1.06), opacity: 1, offset: 0.71, easing: 'cubic-bezier(.55,0,.9,.55)' },
        { transform: T(hx, dy, 0, sc), opacity: 1, offset: 0.9, easing: 'ease-out' },
        { transform: T(hx, dy - 4, 0, sc), opacity: 1, offset: 0.95, easing: 'ease-in' },
        { transform: T(hx, dy, 0, sc), opacity: 1 }
      ], { duration: 980, delay: 140, fill: 'both' });
      const flap = box.querySelector('.bx-flap'), lift = Hb * 0.36;
      flap.style.transform = `translateY(${lift}px)`;
      fly.finished.then(() => {
        flap.animate([{ transform: `translateY(${lift}px)` }, { transform: 'none' }], { duration: 230, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
        // the lid swings from behind the box to straight up at the viewer, then falls onto the box
        return new Promise((ok) => setTimeout(ok, 110)).then(() => lid.animate([{ transform: lidT(128) }, { transform: lidT(90) }], { duration: 230, easing: 'cubic-bezier(.45,0,.75,.6)', fill: 'forwards' }).finished);
      }).then(() => {
        lid.style.zIndex = 6;
        return lid.animate([{ transform: lidT(90) }, { transform: lidT(TH) }], { duration: 120, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished;
      }).then(() => {
        try { navigator.vibrate && navigator.vibrate(14); } catch (e) { /* no vibration */ }
        box.animate([{ transform: 'none' }, { transform: 'scale(1.02,.965)' }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
        const bounce = lid.animate([{ transform: lidT(TH) }, { transform: lidT(TH + 4) }, { transform: lidT(TH) }], { duration: 190, easing: 'ease-out', fill: 'forwards' });
        im.style.visibility = 'hidden';
        return bounce.finished;
      }).then(() => {
        box.classList.add('shut');
        return new Promise((ok) => setTimeout(ok, mode === 'me' ? 420 : 640));
      }).then(() => {
        const bag = $('.m-bagbtn') || $('.t-bag'), tr = bag && bag.getBoundingClientRect(), b2 = box.getBoundingClientRect();
        const tx = tr ? tr.left + tr.width / 2 - (b2.left + b2.width / 2) : 0, ty = tr ? tr.top + tr.height / 2 - (b2.top + b2.height / 2) : -innerHeight / 2;
        return box.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx * 0.32}px,${ty * 0.42 - 34}px) scale(.64) rotate(5deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${tx}px,${ty}px) scale(.12) rotate(12deg)`, opacity: 0.6 }], { duration: 500, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' }).finished.then(() => bag);
      }).then((bag) => {
        box.remove();
        const d2 = $('#pxDock .dk-box', view);
        if (d2) { d2.style.visibility = ''; d2.animate([{ transform: 'translateY(40px) scale(.62)', opacity: 0 }, { transform: 'scale(.62)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
        if (bag) bag.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 440, easing: 'ease-out' });
        done(true);
      }).catch(() => { box.remove(); const d3 = $('#pxDock .dk-box', view); if (d3) d3.style.visibility = ''; done(false); });
    });
  }
  function buy(btn) {
    if (boxing) return;
    const p = prod(), v = varOf(p), s = st(), m = s.mode || 'me';
    if (m !== 'give' && !s.size) { askSize(); return; }
    const pb = $('.px-slide.px-hero .px-pb', view), fl = pb && $('.px-fl', pb), hero = fl && $('.px-pair', fl);
    let fb = null;
    if (hero && (s.pxi || 0) === 0) {
      const bb = BB[hero.dataset.bb], k = +hero.dataset.s || 0;
      if (bb && k) {
        // the visible pair inside its picture: centred in its float box by fitPair
        const r = fl.getBoundingClientRect(), [iw, ih, a, b, c, d] = bb;
        fb = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: (c - a) * iw * k, h: (d - b) * ih * k, iw: iw * k, ih: ih * k, ox: a * iw * k, oy: b * ih * k, rot: -11 };
      } else { const r = hero.getBoundingClientRect(); fb = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: hero.offsetWidth, h: hero.offsetHeight, rot: hero.classList.contains('blend') ? 0 : -11 }; }
    }
    const from = { src: hero ? hero.currentSrc || hero.src : pic(p, v).src, cut: hero ? !hero.classList.contains('blend') : !!pic(p, v).cut, box: fb };
    if (!add(p.id, v.id, s.size, m, true)) return;
    const again = () => { if (MX.cur.v === 'product' && prod() === p) bar(p, varOf(p)); };
    if (reduce || !Element.prototype.animate) { bar(p, v, 'done'); setTimeout(again, 1600); return; }
    boxing = true; document.documentElement.classList.add('px-boxing');
    bar(p, v, 'pack');
    // the pair leaves the frame for the box, and comes back once the box is in the bag
    const hide = !!fb && pb; if (hide) pb.style.visibility = 'hidden';
    boxIt(m, from).then(() => {
      boxing = false; document.documentElement.classList.remove('px-boxing');
      if (hide && pb.isConnected) { pb.style.visibility = ''; pb.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      if (MX.cur.v === 'product' && prod() === p) bar(p, varOf(p), 'done');
      const msg = m === 'give' ? p.name + ' will reach someone in need. Thank you.' : m === 'gift' ? p.name + ', EU ' + s.size + ', packed as a gift' : p.name + ', EU ' + s.size + ' is in your bag';
      toast(msg, 'View bag', href.bag);
      if (m === 'give') { const c = $('.px-cta'); if (c) MX.burst(c); }
      setTimeout(again, 1500);
    });
  }
  // no size yet: bring the sizes into view, back to the pair, and show where to tap
  function askSize() {
    const el = $('#pxStage', view); if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 90) window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 72), behavior: reduce ? 'auto' : 'smooth' });
    if ((st().pxi || 0) > 0) goSlide(0);
    const rl = $('.px-rail.l', el); if (!rl || reduce) return;
    rl.classList.remove('ask'); void rl.offsetWidth; rl.classList.add('ask');
    $$('.px-sz:not(:disabled)', rl).forEach((b, k) => b.animate([{ transform: 'none' }, { transform: 'translateX(7px)' }, { transform: 'none' }], { duration: 260, delay: 120 + k * 45, easing: 'ease-out' }));
    clearTimeout(askT); askT = setTimeout(() => rl.classList.remove('ask'), 2200);
  }
  let askT = 0;
  const unask = () => { clearTimeout(askT); const rl = $('.px-rail.l.ask', view); if (rl) rl.classList.remove('ask'); };

  /* ---------- taps ---------- */
  MX.tap('pxsize', (t, e, d) => {
    if (t.disabled) return;
    const s = st(); s.size = d.pxsize; unask();
    $$('.px-sz', view).forEach((b) => b.setAttribute('aria-checked', b.dataset.pxsize === d.pxsize));
    try { navigator.vibrate && navigator.vibrate(6); } catch (x) { /* no vibration */ }
    if (boxing) return;
    const p = prod(); bar(p, varOf(p));
    const c = $('.px-cta'); if (c && !reduce) c.animate([{ transform: 'scale(.97)' }, { transform: 'scale(1.03)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
  });
  MX.tap('pxcol', (t, e, d) => {
    const s = st(); if (s.pv === d.pxcol) return;
    const p = prod(); s.pv = d.pxcol; const v = varOf(p);
    if (s.size && !(qty(v, s.size) > 0)) s.size = null;
    s.pxi = 0; paintStage(true);
    const pc = $('#pxColors', view); if (pc) pc.innerHTML = swatches(p, v);
    const n = $('#pxColName', view); if (n) n.textContent = v.color;
    const f = $('#pxFacts', view); if (f) f.innerHTML = facts(v);
    const fp = $('#pxFor', view); if (fp) fp.innerHTML = forPanel(p, v);
    bar(p, v);
  });
  MX.tap('pxfor', (t, e, d) => {
    const s = st(); if (s.mode === d.pxfor) return;
    s.mode = d.pxfor;
    $$('.px-fc', view).forEach((b) => b.setAttribute('aria-checked', b.dataset.pxfor === d.pxfor));
    const p = prod(), v = varOf(p), fp = $('#pxFor', view);
    if (fp) { fp.innerHTML = forPanel(p, v); if (!reduce) fp.firstElementChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' }); }
    paintRail(); bar(p, v);
  });
  MX.tap('pxbuy', (t) => { if (swiped) return; buy(t); });
  MX.tap('pxsg', () => { sizeSheet(); const x = $('.px-sgx'); if (x) x.focus({ preventScroll: true }); });
  MX.tap('pxsgx', () => { closeSheet(); const b = $('.px-sgb', view); if (b) b.focus({ preventScroll: true }); });
  // the size guide card also closes with the Escape key on a keyboard
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#mSheet.on .px-sgs')) { closeSheet(); const b = $('.px-sgb', view); if (b) b.focus({ preventScroll: true }); } });
  MX.tap('pxpick', (t, e, d) => {
    if (!d.pxpick) return;
    const s = st(); s.size = d.pxpick; closeSheet(); unask();
    $$('.px-sz', view).forEach((b) => b.setAttribute('aria-checked', b.dataset.pxsize === d.pxpick));
    const p = prod(); bar(p, varOf(p)); toast('EU ' + d.pxpick + ' chosen');
  });
  MX.tap('pxdot', (t, e, d) => { goSlide(+d.pxdot); });
  MX.tap('pxnotes', () => { const el = $('#pxNotes', view); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
  MX.tap('pxwrite', () => { noteForm(prod()); });
  MX.tap('pxrate', (t, e, d) => { const f = st().fn || (st().fn = { r: 0, c: '' }); f.r = +d.pxrate; $$('[data-pxrate]').forEach((b) => { const k = +b.dataset.pxrate; b.classList.toggle('on', k <= f.r); b.setAttribute('aria-checked', k === f.r); }); });
  MX.tap('pxcomf', (t, e, d) => { const f = st().fn || (st().fn = { r: 0, c: '' }); f.c = d.pxcomf; $$('[data-pxcomf]').forEach((b) => b.setAttribute('aria-checked', b.dataset.pxcomf === f.c)); });
  document.addEventListener('submit', (e) => { if (e.target && e.target.id === 'pxNform') { e.preventDefault(); sendNote(); } });
  document.addEventListener('focusin', (e) => { const t = e.target; if (t && t.closest && t.closest('#pxNform') && /INPUT|TEXTAREA/.test(t.tagName)) setTimeout(() => { try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (er) { /* older phones */ } }, 300); });
  MX.tap('pxall', () => {
    const s = st(); s.pxAll = !s.pxAll; const el = $('#pxNotes', view); if (!el) return;
    const y = window.scrollY; el.outerHTML = notesSec(prod());
    if (!s.pxAll) { const n = $('#pxNotes', view); if (n) n.scrollIntoView({ block: 'start' }); } else window.scrollTo(0, y);
  });
  MX.tap('pxmore', () => { const s = st(); s.pxMore = !s.pxMore; const el = $('.px-about', view); if (el) el.outerHTML = about(prod()); });
})();
