/* DAUR mobile app: voucher cards.
   Every live offer is drawn as a voucher with notched edges, a big amount and a stamped DAUR seal: the welcome credit,
   each credit code, the delivery credit and every price cut. The cards take the place of the slides in the home offers
   carousel, the credits on the Wallet page (/pages/offers) and the wallet sheet. This file loads after daur-m.js and works
   through window.DAUR_MX, like daur-m-pdp.js and daur-m-bag.js, so daur-m.js itself is not changed.
   window.DAUR_VOUCHER.card(data) draws one card on its own: tools/vouchers/export.html uses it to make the social media
   pictures from the very same design. Styles: daur-m-vouchers.css. */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const NF = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
  const DM = 'M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z'; // the D of the logo
  const ARROW = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"/></svg>';
  let uid = 0;
  // a seeded random number: a card keeps the same art every time it is drawn
  const rnd = (seed) => { let x = (Math.abs(seed | 0) * 7919 + 104729) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
  const r1 = (n) => Math.round(n * 10) / 10;
  const star = (x, y, s) => `M${r1(x)},${r1(y - s)}Q${r1(x)},${r1(y)} ${r1(x + s)},${r1(y)}Q${r1(x)},${r1(y)} ${r1(x)},${r1(y + s)}Q${r1(x)},${r1(y)} ${r1(x - s)},${r1(y)}Q${r1(x)},${r1(y)} ${r1(x)},${r1(y - s)}Z`;

  // the stub: a burst of brass rays around the seal, each long ray ending in a spark, with a few four point stars
  function burst(seed) {
    const r = rnd(seed), o = [], n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.16, long = i % 2 === 0, c = Math.cos(a), s = Math.sin(a);
      const a1 = long ? 58 : 64, a2 = a1 + (long ? 24 + r() * 30 : 9 + r() * 12);
      o.push(`<path class="${long ? 'dv-ra' : 'dv-rb'}" d="M${r1(100 + c * a1)},${r1(100 + s * a1)}L${r1(100 + c * a2)},${r1(100 + s * a2)}"/>`);
      if (long) o.push(`<circle class="dv-rd" cx="${r1(100 + c * (a2 + 7))}" cy="${r1(100 + s * (a2 + 7))}" r="${r1(1.7 + r() * 1.5)}"/>`);
    }
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; o.push(`<circle class="dv-rr" cx="${r1(100 + Math.cos(a) * 50)}" cy="${r1(100 + Math.sin(a) * 50)}" r=".9"/>`); }
    [[52, 30], [150, 44], [50, 164], [148, 172]].forEach(([x, y], i) => o.push(`<path class="${i % 2 ? 'dv-sb' : 'dv-sa'}" d="${star(x + (r() - 0.5) * 14, y + (r() - 0.5) * 14, 4.5 + r() * 5.5)}"/>`));
    return `<svg class="dv-burst" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${o.join('')}</svg>`;
  }
  // the seal, stamped like the foil on the box: words around a brass ring, the D in the middle
  function seal(words) {
    const id = 'dvs' + (++uid), one = ('DAUR SUPPLY · ' + (words ? words + ' · ' : '')).toUpperCase();
    // as many rounds of the words as the ring holds; the browser then spaces them evenly all the way round
    const ring = one.repeat(Math.max(1, Math.floor(452 / (one.length * 9.2))));
    return `<svg class="dv-seal" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6DBC1"/><stop offset=".5" stop-color="#B99C74"/><stop offset="1" stop-color="#826844"/></linearGradient><path id="${id}p" d="M100,100m-74,0a74,74 0 1,1 148,0a74,74 0 1,1 -148,0"/></defs>
      <circle cx="100" cy="100" r="98" fill="url(#${id}g)"/><circle class="dv-sl1" cx="100" cy="100" r="92"/><circle class="dv-sin" cx="100" cy="100" r="61"/><circle class="dv-sl2" cx="100" cy="100" r="55"/>
      <text class="dv-stx"><textPath href="#${id}p" xlink:href="#${id}p" textLength="462" lengthAdjust="spacing">${esc(ring)}</textPath></text>
      <svg x="62" y="73" width="76" height="54" viewBox="-8 -8 686 512" fill="url(#${id}g)"><use href="#dl-d"/></svg></svg>`;
  }
  // a few pieces of confetti in the margin on the far edge, clear of the words
  function confetti(seed) {
    const r = rnd(seed + 31), k = ['dv-cs', 'dv-ck', 'dv-cr', 'dv-cd'];
    return [9, 27, 67, 84].map((y, i) => `<i class="dv-cf ${k[(i + seed) % k.length]} dv-c${(i + seed) % 2}" style="top:${r1(y + (r() - 0.5) * 6)}%;right:${r1(1.4 + r() * 2.4)}cqw;--a:${Math.round(r() * 140 - 70)}deg"></i>`).join('');
  }
  /* one voucher. d = { tone: 'red' | 'cream' | 'black', kick, amt, line, code, price: { now, was }, tag, go, ring, seed,
     art (markup for the stub instead of the seal), foot (markup for the bottom row), more (markup under it), cls, cur } */
  function card(d) {
    const cur = esc(String(d.cur || 'Rs.').trim()), seed = d.seed || 1;
    const chip = d.code ? `<span class="dv-code">${esc(d.code)}</span>` : d.price ? `<span class="dv-price"><b>${cur} ${esc(NF(d.price.now))}</b><s>${cur} ${esc(NF(d.price.was))}</s></span>` : '';
    const foot = d.foot != null ? d.foot : chip || d.go ? `${chip}${d.go ? `<span class="dv-go">${d.go === true ? '' : `<span>${esc(d.go)}</span>`}${ARROW}</span>` : ''}` : '';
    return `<div class="dv dvt-${esc(d.tone || 'cream')}${d.cls ? ' ' + esc(d.cls) : ''}">
      <span class="dv-stub">${burst(seed)}${d.art || seal(d.ring)}</span>
      <span class="dv-body">${d.plain ? '' : confetti(seed)}
        <span class="dv-top"><span class="dv-k">${esc(d.kick)}</span>${d.tag ? `<span class="dv-tag">${esc(d.tag)}</span>` : ''}</span>
        <b class="dv-amt"><small>${cur}</small>${esc(NF(d.amt))}</b>
        ${d.line ? `<span class="dv-l">${esc(d.line)}</span>` : ''}
        ${foot ? `<span class="dv-foot">${foot}</span>` : ''}${d.more || ''}
      </span></div>`;
  }
  window.DAUR_VOUCHER = { card, seal, burst, NF };

  const MX = window.DAUR_MX; if (!MX) return;
  const { V, API, C, W, CODE, DEL, P, href, coupons, credits, fmt, ic, $, $$, view, openSheet, REWARDS, PAYFULL } = MX;
  const CUR = String(C.currency || 'Rs.').trim();
  const money = (n) => CUR + '\u00A0' + NF(n); // the amount never breaks away from its currency
  const daysLeft = (e) => { if (!e) return 0; const d = Math.ceil((new Date(e) - new Date()) / 864e5); return d > 0 ? d : 0; };
  const endTag = (e) => { const d = daysLeft(e); if (!d) return ''; if (d === 1) return 'Last day'; if (d <= 7) return d + ' days left'; return 'Ends ' + new Date(e).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  // known codes carry their own name on the card; any new code shows as a credit code
  const NAME = { DOUBLEUP: 'Double up', NAYADAUR: 'Naya daur' };
  const nameOf = (code) => NAME[code] || 'Credit code';
  const saving = (p) => Math.max.apply(null, p.variants.map((v) => API.onSale(v) ? v.compareAt - v.price : 0));
  const short = (n) => String(n || '').replace(/^DAUR\s+/i, '');
  const TONES = ['black', 'cream'];

  /* ---------- the offers carousel on the home page ---------- */
  function slides() {
    const out = [];
    if (W.code && W.on()) out.push({ tone: 'red', kick: 'Welcome credit', amt: W.amt, line: 'Waiting in your wallet', code: W.code, go: true, ring: 'Welcome credit', seed: 3, h: href.offers,
      label: money(W.amt) + ' welcome credit, waiting in your wallet. Yours on your first order. Use it now.' });
    coupons().forEach((c, i) => out.push({ tone: TONES[i % 2], kick: nameOf(c.code), amt: c.amt, line: c.min ? 'On orders of ' + money(c.min) + ' or more' : 'On any order', code: c.code, tag: endTag(c.ends), go: true, ring: 'Credit code', seed: 7 + i * 4, h: href.offers,
      label: money(c.amt) + ' off' + (c.min ? ' orders of ' + money(c.min) + ' or more' : '') + ' with code ' + c.code + '. ' + (endTag(c.ends) ? endTag(c.ends) + '. ' : '') + 'See the offer.' }));
    P().filter((p) => p.variants.some(API.onSale)).sort((x, y) => saving(y) - saving(x)).slice(0, 3).forEach((p, i) => {
      const v = p.variants.find(API.onSale);
      out.push({ tone: 'cream', kick: 'Price cut', amt: v.compareAt - v.price, line: short(p.name), price: { now: v.price, was: v.compareAt }, tag: API.pct(v) + '% off', go: true, seed: 21 + i * 5, h: href.product(p.id), ring: 'Price cut', label: p.name + ', ' + money(v.compareAt - v.price) + ' off. Now ' + money(v.price) + ' instead of ' + money(v.compareAt) + '. Grab it.' });
    });
    REWARDS.slice().reverse().forEach((r, i) => out.push({ tone: i ? 'red' : 'black', kick: 'Bag reward', amt: r.amt, line: 'When your bag reaches ' + money(r.min), go: true, ring: 'Bag reward', seed: 41 + i * 6, h: href.offers,
      label: money(r.amt) + ' off when your bag reaches ' + money(r.min) + '. It comes off by itself at checkout.' }));
    out.push({ tone: 'cream', kick: 'Paid in full', amt: PAYFULL, line: 'When you pay everything at once', go: true, ring: 'Bag reward', seed: 53, h: href.offers,
      label: money(PAYFULL) + ' more off when you pay in full.' });
    return out;
  }
  let timer = 0;
  function carousel() {
    const old = $('.m-promo', view); if (!old) return;
    const sl = slides();
    old.insertAdjacentHTML('afterend', `<section class="dvp" aria-roledescription="carousel" aria-label="Offers"><div class="dvp-track" id="mVouch">${sl.map((x) => `<a class="dvp-s dv-w" href="${x.h}" data-m aria-label="${esc(x.label)}">${card(Object.assign({ cur: CUR }, x))}</a>`).join('')}</div>
      ${sl.length > 1 ? `<div class="dvp-dots" aria-hidden="true">${sl.map((x, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}</section>`);
    old.remove();
    const t = $('#mVouch', view), dots = $$('.dvp-dots i', view), n = t.children.length;
    let i = 0, hold = false, raf = 0, rest = 0;
    const mark = () => { const k = Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); if (k !== i) { i = k; dots.forEach((d, j) => d.classList.toggle('on', j === i)); } };
    t.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
    ['touchstart', 'pointerdown'].forEach((ev) => t.addEventListener(ev, () => { hold = true; clearTimeout(rest); rest = setTimeout(() => { hold = false; }, 6000); }, { passive: true }));
    clearInterval(timer);
    if (MX.reduce || n < 2) return;
    timer = setInterval(() => { if (!t.isConnected) return; if (hold || document.hidden) return; i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); t.scrollTo({ left: ((i + 1) % n) * t.clientWidth, behavior: 'smooth' }); }, 4200);
  }
  const home = V.home;
  if (home) V.home = function () { const r = home.apply(this, arguments); carousel(); return r; };

  /* ---------- the Wallet page: every credit as a voucher ---------- */
  V.offers = function () {
    const sale = P().filter((p) => p.variants.some(API.onSale));
    const t = API.totals(), sub = t.subtotal || 0, has = t.lines.length > 0;
    const cr = credits(sub), now = cr.use ? cr.use.amt : 0;
    const pill = (txt, on) => `<span class="dvw-pill${on ? ' on' : ''}">${on ? ic('check') : ''}${esc(txt)}</span>`;
    const tiers = REWARDS.slice().reverse().map((r, i) => {
      const ok = sub >= r.min, on = ok && now === r.amt, done = Math.min(100, Math.round(sub / r.min * 100));
      const lock = ok ? '' : `<span class="dvw-lock"><span class="dvw-bar" aria-hidden="true"><i style="width:${done}%"></i></span><small>${ic('lock')}${has ? 'Add ' + esc(money(r.min - sub)) + ' more to unlock' : 'Unlocks at ' + esc(money(r.min))}</small></span>`;
      return `<div class="dvw dv-w${ok ? '' : ' dv-lock'}${on ? ' dv-on' : ''}" role="group" aria-label="${esc('Bag reward, ' + money(r.amt) + ' off when your bag reaches ' + money(r.min))}">${card({ cur: CUR, tone: i ? 'red' : 'black', cls: 'dv-row', kick: 'Bag reward', amt: r.amt, line: 'When your bag reaches ' + money(r.min), ring: 'Bag reward', seed: 41 + i * 6,
        foot: `<span class="dv-note">No code needed</span>${pill(on ? 'On this bag' : ok ? 'Unlocked' : 'Automatic', on || ok)}`, more: lock })}</div>`;
    }).join('');
    const full = `<div class="dvw dv-w" role="group" aria-label="${esc(money(PAYFULL) + ' more off when you pay in full')}">${card({ cur: CUR, tone: 'cream', cls: 'dv-row', kick: 'Paid in full', amt: PAYFULL, line: 'Choose to pay everything at once in your bag', ring: 'Bag reward', seed: 53,
      foot: `<span class="dv-note">On top of any bag reward</span>${pill('Your choice', true)}` })}</div>`;
    view.innerHTML = `<div class="m-of dvw-page">
      <div class="m-pad"><section class="r5-bank" aria-label="${esc('DAUR rewards, ' + fmt(now) + ' off this bag')}"><span class="r5-bk-dm" aria-hidden="true">${MX.DMARK}</span>
        <span class="r5-bk-top"><span class="r5-bk-wm dk">${MX.WORDMARK}<small>REWARDS</small></span><span class="r5-bk-chip" aria-hidden="true"><i></i><i></i><i></i></span></span>
        <span class="r5-bk-mid"><small>${has ? 'Off this bag' : 'Up to'}</small><b>${esc(fmt(has ? now : REWARDS[0].amt + PAYFULL))}</b></span>
        <span class="r5-bk-bot"><span><small>Status</small><b>${now ? 'Applied at checkout' : has ? 'Add a pair to unlock' : 'Ready for your bag'}</b></span><span><small>Codes</small><b>None needed</b></span></span></section>
        <p class="r5-bk-note">${ic('lock')}Rewards come off your total by themselves. The biggest one your bag reaches is used.</p></div>
      <div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Bag rewards</h2><span class="m-mute">Automatic</span></div>
      <div class="dvw-list">${tiers}${full}</div>
      ${sale.length ? `<div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Already reduced</h2><a class="m-link" href="${href.shop('Sale')}" data-m>All sale</a></div><div class="m-grid">${sale.map((p) => MX.card(p, false)).join('')}</div>` : ''}
    </div>`;
  };

  /* ---------- the wallet sheet from the top bar ---------- */
  MX.tap('wallet', () => {
    openSheet(`<div class="m-wsheet dvw-sheet"><div class="dv-w">${card({ cur: CUR, tone: 'red', kick: 'Welcome credit', amt: W.amt, line: 'Ready for your first order', code: W.code, ring: 'Welcome credit', seed: 3 })}</div>
      <p>It comes off your total at checkout. One wallet per customer.</p>
      <a class="m-cta" href="${href.shop()}" data-m>Use it now</a></div>`);
  });
})();
