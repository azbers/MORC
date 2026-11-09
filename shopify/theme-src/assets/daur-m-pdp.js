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
  const SIZES = [[39, 5, 6, 24.1, 24.7], [40, 6, 7, 24.8, 25.4], [41, 7, 8, 25.5, 26.0], [42, 8, 9, 26.1, 26.7], [43, 9, 10, 26.8, 27.4], [44, 10, 11, 27.5, 28.0], [45, 11, 12, 28.1, 28.7], [46, 12, 13, 28.8, 29.4]];
  const rowOf = (eu) => SIZES.find((r) => r[0] === +eu);
  const euFor = (cm) => { const r = SIZES.find((x) => cm >= x[3] - 0.001 && cm <= x[4] + 0.001); return r ? r[0] : cm < SIZES[0][3] ? SIZES[0][0] : SIZES[SIZES.length - 1][0]; };

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
    return `<div class="px-rail l" role="radiogroup" aria-label="Size, EU"><span class="px-lab">Size <small>EU</small></span>
      ${p.sizes.map((z) => { const q = qty(v, z), on = String(s.size) === String(z); return `<button class="px-sz" type="button" role="radio" data-pxsize="${esc(z)}" aria-checked="${on}"${q > 0 ? '' : ' disabled'} aria-label="EU ${esc(z)}${q > 0 ? '' : ', sold out'}">${esc(z)}</button>`; }).join('')}
      <button class="px-sgb" type="button" data-pxsg aria-haspopup="dialog">Size guide</button></div>`;
  }
  function swatches(p, v) {
    const same = p.variants.every((x) => (x.hex || '').toLowerCase() === (p.variants[0].hex || '').toLowerCase());
    return `<div class="px-rail r" role="radiogroup" aria-label="Colour"><span class="px-lab">Colour</span>
      ${p.variants.map((x) => { const y = pic(p, x); return `<button class="px-sw${same ? ' im' : ''}" type="button" role="radio" data-pxcol="${esc(x.id)}" aria-checked="${x.id === v.id}" aria-label="${esc(x.color)}" style="--sw:${esc(x.hex || '#222')}">${same ? `<img src="${esc(y.src)}" alt="" loading="lazy">` : '<i></i>'}</button>`; }).join('')}</div>`;
  }
  function priceBox(v) {
    const save = isSale(v) ? v.compareAt - v.price : 0;
    return `<div class="px-price"><b>${esc(fmt(v.price))}</b>${save ? `<span class="pp-was"><s>${esc(fmt(v.compareAt))}</s><em>You keep ${esc(fmt(save))}</em></span>` : `<span class="pp-del">${ic('truck')}${esc(days())}</span>`}</div>`;
  }
  function stage(p, v) {
    const { hero, photos } = slides(p, v), n = photos.length + 1, i = Math.min(st().pxi || 0, n - 1);
    const bb = hero.cut ? bbOf(hero.src) : '';
    const heroImg = `<img class="px-pair${hero.cut ? '' : ' blend'}" src="${esc(hero.src)}"${bb ? ` data-bb="${bb}"` : ''} alt="${esc(p.name + ', ' + v.color)}" fetchpriority="high" decoding="async">`;
    return `<div class="px-track" id="pxTrack" role="region" aria-roledescription="carousel" aria-label="${esc(p.name)} photos" tabindex="0">
        <figure class="px-slide px-hero" aria-label="1 of ${n}"><span class="px-word" aria-hidden="true">${WORDMARK}</span><span class="px-pb${hero.cut ? '' : ' ph'}"><span class="px-floor" aria-hidden="true"></span><span class="px-fl">${heroImg}</span></span></figure>
        ${photos.map((s, k) => `<figure class="px-slide ph" aria-label="${k + 2} of ${n}"><img src="${esc(sized(s, 900))}"${srcset(s)} alt="${esc(p.name + ', ' + v.color + ', photo ' + (k + 2))}" loading="${k === 0 ? 'eager' : 'lazy'}" decoding="async"></figure>`).join('')}
      </div>
      <div class="px-ui">${rail(p, v)}${p.variants.length > 1 ? swatches(p, v) : ''}${priceBox(v)}</div>
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
    [days(), 'to your door'],
    isSale(v) ? ['Sale price', 'so the size is final'] : [EX + ' days', 'to swap the size'],
    [fmt(MX.DEL), 'delivery credit']
  ].map(([b, s]) => `<span><b>${esc(b)}</b><small>${esc(s)}</small></span>`).join('');

  /* ---------- who the pair is for: three real photographs, one colour each ---------- */
  const FOR = [
    ['me', 'For me', 'Your size, your door', 'm-hero.webp'],
    ['gift', 'A gift', 'For someone you love', 'm-g-hands.webp'],
    ['give', 'Philanthropy', 'For someone in need', 'm-g-boy-smile.webp']
  ];
  function forCards() {
    const m = st().mode || 'me';
    return `<div class="px-fcards" role="radiogroup" aria-label="Who is this pair for">${FOR.map(([k, b, s, ph]) => `<button type="button" class="px-fc k-${k}" role="radio" data-pxfor="${k}" aria-checked="${m === k}"><img src="${esc(asset(ph))}" alt="" loading="lazy" decoding="async"><span class="fc-t"><b>${b}</b><small>${s}</small></span><i class="fc-ok">${ic('check')}</i></button>`).join('')}</div>`;
  }
  function forPanel(p, v) {
    const m = st().mode || 'me';
    if (m === 'gift') return `<div class="px-fp k-gift"><div class="fp-note" aria-hidden="true"><span class="fn-d">${DMARK}</span><i>Eid Mubarak, Abbu.</i><i class="fn-from">From Ali</i></div>
      <div class="fp-t"><b>He opens the box. Your words are the first thing he reads.</b><ul><li>${ic('gift')}Gift packed, with your handwritten note inside</li><li>${ic('truck')}Sent to his door, nothing for him to pay</li><li>${ic('help')}Not sure of his size? It is printed on the tongue of a pair he wears now</li></ul></div></div>`;
    if (m === 'give') return `<div class="px-fp k-give"><img class="fp-ph" src="${esc(asset('m-g-boys-corn.webp'))}" alt="Two boys sitting in a field" loading="lazy">
      <div class="fp-t"><b>One pair, one person, handed over in person.</b><p>We match the size to the person who receives it and add ${esc(fmt(DAUR_ADD))} of our own to every pair you sponsor. A private photo of the moment reaches you within 7 days of the handover.</p><a class="fp-a" href="${href.giving}" data-m>How philanthropy works ${ic('arrow')}</a></div></div>`;
    return `<div class="px-fp k-me"><ul>
      <li>${ic('box')}<span><b>Dispatched within 24 hours</b> of your order being confirmed on WhatsApp</span></li>
      <li>${ic('truck')}<span><b>At your door in ${esc(days())}</b>, in any city in Pakistan</span></li>
      <li>${isSale(v) ? `${ic('tag')}<span><b>Sale price, so the size is final.</b> Measure first with the size guide, or ask us on WhatsApp</span>` : `${ic('swap')}<span><b>Size swap within ${EX} days</b> if the fit is not right</span>`}</li></ul></div>`;
  }

  /* ---------- fit notes: a person telling you how the pair fits, rated in hearts ---------- */
  function story(n) {
    const r = Math.max(1, Math.min(5, Math.round(+n.rating || 5)));
    const meta = [n.city, n.size ? 'Bought EU ' + n.size : '', n.fit || ''].filter(Boolean).join(' · ');
    return `<article class="px-story"><header><span class="st-av" aria-hidden="true">${esc(initials(n.name))}</span>
        <span class="st-who"><b>${esc(n.name || 'DAUR buyer')}</b><small>${esc(meta)}</small></span>${hearts(r, 'sm')}</header>
      ${n.title || n.body ? `<div class="st-say">${n.title ? `<h3>${esc(n.title)}</h3>` : ''}${n.body ? `<p>${esc(n.body)}</p>` : ''}</div>` : ''}
      ${n.photo ? `<img class="st-ph" src="${esc(n.photo)}" alt="Photo from ${esc(n.name || 'a buyer')}" loading="lazy">` : ''}
      <footer>${n.verified ? `<span class="st-v">${ic('seal')}Verified buyer</span>` : ''}${n.date ? `<time datetime="${esc(n.date)}">${esc(when(n.date))}</time>` : ''}</footer></article>`;
  }
  function notesSec(p) {
    const list = notesFor(p.id).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (+b.rating || 0) - (+a.rating || 0));
    const s = stats(list), all = !!st().pxAll, shown = all ? list : list.slice(0, 3);
    const ask = waLink('Assalam o Alaikum DAUR, I bought the ' + p.name + '. Here is my fit note: ');
    if (!s.n) return `<section class="px-sec px-notes" id="pxNotes"><h2 class="px-h">Fit notes</h2>
      <div class="px-empty">${hearts(0, 'lg')}<b>This pair has just landed.</b><p>Its first fit notes are on the way. A real person on our team reads every note before it goes live, good or bad.</p><a class="px-wa" href="${ask}" target="_blank" rel="noopener">${ic('wa')}Wearing it? Send us your fit note</a></div></section>`;
    const fitN = s.fit.small + s.fit.true + s.fit.large;
    const top = fitN ? [['true', 'true to size'], ['small', 'it runs small'], ['large', 'it runs large']].sort((a, b) => s.fit[b[0]] - s.fit[a[0]])[0] : null;
    const pos = fitN ? 50 + ((s.fit.large - s.fit.small) / fitN) * 42 : 50;
    return `<section class="px-sec px-notes" id="pxNotes"><div class="px-nh"><h2 class="px-h">Fit notes</h2><span class="px-mute">How it fits, in their own words</span></div>
      <div class="px-sum"><div class="sm-l"><b class="sm-avg">${s.avg.toFixed(1)}</b>${hearts(s.avg, 'md')}<small>from ${s.n} fit ${s.n === 1 ? 'note' : 'notes'}</small></div>
        <div class="sm-r">${s.dist.map((c, k) => `<span class="sm-b"><i>${5 - k}</i>${H1}<span class="sm-bar"><span style="width:${s.n ? (c / s.n) * 100 : 0}%"></span></span><em>${c}</em></span>`).join('')}</div></div>
      ${fitN ? `<div class="px-fit"><div class="fm-l"><b>Fit</b><span>${s.fit[top[0]]} of ${fitN} say ${top[1]}</span></div><div class="fm-m" aria-hidden="true"><span class="fm-k" style="left:${pos}%"></span></div><div class="fm-s" aria-hidden="true"><span>Runs small</span><span>True to size</span><span>Runs large</span></div></div>` : ''}
      <div class="px-stories">${shown.map(story).join('')}</div>
      ${list.length > 3 ? `<button class="px-all" type="button" data-pxall aria-expanded="${all}">${all ? 'Show fewer' : 'Read all ' + list.length + ' fit notes'}${ic('chev')}</button>` : ''}
      <a class="px-wa" href="${ask}" target="_blank" rel="noopener">${ic('wa')}Wearing this pair? Send us your fit note</a></section>`;
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
    const s = st(), m = s.mode || 'me', z = s.size, q = z ? qty(v, z) : 0, done = !!phase;
    let t, sub, icon;
    if (phase === 'pack') { t = m === 'give' ? 'Packing your gift' : 'Packing your pair'; sub = m === 'give' ? 'For someone in need' : 'EU ' + z + (m === 'gift' ? ' · as a gift' : ' · ' + fmt(v.price)); icon = m === 'give' ? 'hand' : m === 'gift' ? 'gift' : 'bag'; }
    else if (done) { t = m === 'give' ? 'Thank you' : 'In your bag'; sub = m === 'give' ? 'Your pair is on its way to someone' : 'Tap the bag to check out'; icon = 'check'; }
    else if (m === 'give') { t = 'Sponsor this pair'; sub = fmt(v.price) + ' · we match the size'; icon = 'hand'; }
    else if (!z) { t = m === 'gift' ? 'Choose his size' : 'Choose your size'; sub = fmt(v.price) + (m === 'gift' ? ' · as a gift' : ''); icon = m === 'gift' ? 'gift' : 'bag'; }
    else { t = m === 'gift' ? 'Add as a gift' : 'Add to bag'; sub = 'EU ' + z + ' · ' + fmt(v.price); icon = m === 'gift' ? 'gift' : 'bag'; }
    const ready = m === 'give' || !!z;
    b.innerHTML = `${!done && z && m !== 'give' && q > 0 && q <= LOW ? `<p class="px-low"><i></i>Only ${q} left in EU ${esc(z)}</p>` : ''}
      <button class="px-cta k-${m}${ready ? ' ready' : ''}${done ? ' done' : ''}${phase === 'pack' ? ' pack' : ''}" type="button" data-pxbuy><span class="ct-t"><b>${esc(t)}</b><small>${esc(sub)}</small></span><span class="ct-i">${ic(icon)}</span></button>`;
  }

  /* ---------- the page ---------- */
  V.product = function () {
    const p = prod(); if (!p) return V.shop();
    const s = st();
    if (!s.pv || s.pid !== p.id) { s.pid = p.id; s.pv = firstV(p).id; s.size = null; s.mode = 'me'; s.pxi = 0; s.pxAll = false; s.pxMore = false; }
    const v = varOf(p);
    view.innerHTML = `<div class="px" id="px">
      <section class="px-stage${(s.pxi || 0) > 0 ? ' on-ph' : ''}" id="pxStage">${stage(p, v)}</section>
      ${head(p, v)}
      <section class="px-sec px-for"><div class="px-nh"><h2 class="px-h">Who is this pair for?</h2></div>${forCards()}<div id="pxFor">${forPanel(p, v)}</div></section>
      ${notesSec(p)}
      ${about(p)}
      ${morePairs(p)}
    </div>`;
    bar(p, v);
    bindStage(true);
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
    const rows = SIZES.filter((r) => p.sizes.map(Number).includes(r[0]));
    if (!rows.length) return;
    const lo = rows[0][3], hi = rows[rows.length - 1][4];
    const start = rowOf(s.size || (p.sizes.map(Number).includes(42) ? 42 : rows[Math.floor(rows.length / 2)][0])) || rows[0];
    const cm0 = Math.round(((start[3] + start[4]) / 2) * 10) / 10;
    openSheet(`<div class="px-sgs"><h3 class="sh-h">Size guide</h3><button class="px-sgx" type="button" data-pxsgx aria-label="Close the size guide">${ic('x')}</button><p class="px-mute sg-p">Men's sizes. Find your EU size by the length of your foot.</p>
      <div class="sg-fit"><div class="sg-top"><label for="pxCm">Your foot length</label><output id="pxCmOut" for="pxCm">${cm0.toFixed(1)} cm</output></div>
        <input type="range" id="pxCm" min="${lo}" max="${hi}" step="0.1" value="${cm0}" aria-label="Your foot length in centimetres">
        <div class="sg-res"><span class="sg-k">Your size</span><b id="pxCmEu"></b><small id="pxCmUk"></small></div>
        <button class="px-pick" type="button" data-pxpick=""></button></div>
      <table class="sg-t"><thead><tr><th>EU</th><th>UK</th><th>US</th><th>Foot (cm)</th></tr></thead><tbody>${rows.map(([eu, uk, us, a, b]) => `<tr data-eu="${eu}"${qty(v, eu) > 0 ? '' : ' class="sold"'}><td><b>${eu}</b></td><td>${uk}</td><td>${us}</td><td>${a.toFixed(1)} to ${b.toFixed(1)}</td></tr>`).join('')}</tbody></table>
      <h4 class="sh-k">How to measure</h4>
      <ol class="sg-steps"><li>Place a sheet of paper on a flat floor and stand on it with your heel against a wall.</li><li>Mark the tip of your longest toe.</li><li>Measure from the heel to the mark in centimetres.</li><li>Choose the closest length in the chart. Between sizes, the larger one is usually more comfortable.</li></ol>
      <p class="sg-note">${ic(isSale(v) ? 'tag' : 'swap')}<span>${isSale(v) ? 'This pair is at a sale price, so its size is final. Measure first, or ask us before you order.' : 'Full price pairs can be swapped for size within ' + EX + ' days of delivery.'}</span></p>
      <a class="px-wa" href="${waLink('Assalam o Alaikum DAUR, which size of ' + p.name + ' should I take? My foot is ')}" target="_blank" rel="noopener">${ic('wa')}Not sure? Ask us on WhatsApp</a></div>`);
    const r = $('#pxCm'), out = $('#pxCmOut'), eu = $('#pxCmEu'), uk = $('#pxCmUk'), pick = $('[data-pxpick]');
    const upd = () => {
      const cm = +r.value, e = euFor(cm), row = rowOf(e), q = qty(v, e), pct = ((cm - lo) / Math.max(0.1, hi - lo)) * 100;
      r.style.setProperty('--pc', pct + '%');
      out.textContent = cm.toFixed(1) + ' cm'; eu.textContent = 'EU ' + e; uk.textContent = row ? 'UK ' + row[1] + ' · US ' + row[2] : '';
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
        <radialGradient id="pxbxSh"><stop offset="0" stop-color="#1C130E" stop-opacity=".34"/><stop offset="1" stop-color="#1C130E" stop-opacity="0"/></radialGradient>
        <linearGradient id="pxbxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4EBDC"/><stop offset="1" stop-color="#CDBA9B"/></linearGradient>
        <linearGradient id="pxbxTs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#ECE3D4"/></linearGradient></defs>
      <ellipse cx="${f(Wf / 2)}" cy="${f(Hb + 2)}" rx="${f(Wf * 0.6)}" ry="12" fill="url(#pxbxSh)"/>
      <polygon points="${pts([TL, FL, BL, KL])}" fill="#DACBB0"/><polygon points="${pts([TR, FR, BR, KR])}" fill="#DACBB0"/>
      <polygon points="${pts([TL, TR, KR, KL])}" fill="url(#pxbxIn)"/>
      <path d="${tissue}" fill="url(#pxbxTs)"/>
      <polyline points="${pts([FL, TL, TR, FR])}" fill="none" stroke="#5E4433" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
    const front = `<svg class="bx-front" ${vb}><defs>
        <linearGradient id="pxbxFr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4D3626"/><stop offset=".45" stop-color="#36261B"/><stop offset="1" stop-color="#271A12"/></linearGradient>
        <linearGradient id="pxbxEd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".1" stop-color="#000" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <polygon points="${pts([FL, FR, BR, BL])}" fill="url(#pxbxFr)"/><polygon points="${pts([FL, FR, BR, BL])}" fill="url(#pxbxEd)"/>
      <line x1="${f(FL[0])}" y1="${f(FL[1])}" x2="${f(FR[0])}" y2="${f(FR[1])}" stroke="#71523B" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="${f(s1[0])}" y1="${f(s1[1])}" x2="${f(s2[0])}" y2="${f(s2[1])}" stroke="#C9952F" stroke-opacity=".75" stroke-width=".9"/></svg>`;
    const lidW = Wl * 1.02, lidH = Hl * 1.012, rw = Wf * 0.1, bowY = pt(0, Hl * 0.5, 0)[1];
    return `${back}
      <span class="bx-lid" style="left:${f((Wf - lidW) / 2)}px;width:${f(lidW)}px;height:${f(lidH)}px">
        <span class="lid-out"><span class="lid-frame"></span><span class="lid-wm">${WORDMARK}<small>SUPPLY</small></span><i class="lid-rb v"></i><i class="lid-rb h"></i><i class="lid-glint"></i></span>
        <span class="lid-in"><span class="lid-dm">${DMARK}</span></span>
        <span class="lid-lip" style="height:${f(Lh)}px"><i class="lid-rb v"></i></span></span>
      <svg class="bx-flap" ${vb}><path d="${flap}" fill="url(#pxbxTs)"/><path d="${crease}" fill="none" stroke="#8C6E50" stroke-opacity=".22" stroke-width="1"/></svg>
      ${front}
      <span class="bx-rib" style="left:${f(Wf / 2 - rw / 2)}px;width:${f(rw)}px;top:${f(lipY - 1)}px;height:${f(Hb - lipY + 1)}px"></span>
      <span class="bx-bow" style="left:${f(Wf / 2)}px;top:${f(bowY)}px"><i></i><i></i><b></b></span>
      <span class="bx-seal" style="left:${f(Wf / 2)}px;top:${f((lipY + Hb) / 2)}px">${ic('hand')}</span>`;
  }
  function boxIt(mode, from) {
    return new Promise((done) => {
      if (reduce || !Element.prototype.animate) { done(false); return; }
      const g = geo(), { Wf, Wl, Hb, Pp, TH } = g, lidT = (a) => `perspective(${Pp}px) rotateX(${a}deg)`;
      const box = document.createElement('div'); box.className = 'px-box k-' + mode; box.setAttribute('aria-hidden', 'true');
      Object.assign(box.style, { width: Wf + 'px', height: Hb + 'px', marginLeft: -Wf / 2 + 'px' });
      box.innerHTML = boxHtml(g); app.appendChild(box);
      const lid = box.querySelector('.bx-lid');
      lid.style.transform = lidT(172);
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
      box.animate([{ transform: 'translateY(130%) scale(.9)', opacity: 0 }, { transform: 'translateY(-5%) scale(1.02)', opacity: 1, offset: 0.72 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
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
        return new Promise((ok) => setTimeout(ok, 110)).then(() => lid.animate([{ transform: lidT(172) }, { transform: lidT(90) }], { duration: 230, easing: 'cubic-bezier(.45,0,.75,.6)', fill: 'forwards' }).finished);
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
        if (bag) bag.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 440, easing: 'ease-out' });
        done(true);
      }).catch(() => { box.remove(); done(false); });
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
    if (!add(p.id, v.id, s.size, m)) return;
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
  MX.tap('pxbuy', (t) => { buy(t); });
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
  MX.tap('pxall', () => {
    const s = st(); s.pxAll = !s.pxAll; const el = $('#pxNotes', view); if (!el) return;
    const y = window.scrollY; el.outerHTML = notesSec(prod());
    if (!s.pxAll) { const n = $('#pxNotes', view); if (n) n.scrollIntoView({ block: 'start' }); } else window.scrollTo(0, y);
  });
  MX.tap('pxmore', () => { const s = st(); s.pxMore = !s.pxMore; const el = $('.px-about', view); if (el) el.outerHTML = about(prod()); });
})();
