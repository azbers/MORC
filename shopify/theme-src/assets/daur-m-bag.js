/* DAUR mobile app: bag, gift details and payment. Replaces V.bag through window.DAUR_MX (see daur-m.js) and takes over the
   checkout button, so nothing in the core file changes.
   - Gift details are never required. Every gift pair has its own form folded under it; whatever is left empty is asked on
     WhatsApp after the order, and the order line says so for the team.
   - One clear total, then how to pay (Rs 1,000 to reserve own pairs, gifts and giving covered today), then the
     bank account itself with copy buttons and a WhatsApp receipt, so the buyer never leaves the bag to look for them.
   - Taps change the bag in place: no reload, no spinner, the scroll position and open forms stay where they were. */
(function () {
  'use strict';
  const MX = window.DAUR_MX; if (!MX) return;
  const { V, API, C, M, ic, esc, fmt, store, pic, href, view, $, toast, openSheet, closeSheet, buyBar, card, P, W, credits, payPlan,
    giftUnits, GD, gdOf, lineProps, orderType, DEL, DAUR_ADD, days, GIVE, WA, DMARK, reduce, paintTab, paintTop, asset, root } = MX;

  /* ---------- the account buyers pay into ----------
     DUMMY DETAILS FOR TESTING (owner, 9 Nov 2026: "add dummy details and I will update later"). Replace them before the store
     sells, either here or by printing window.DAUR_M.bank = { bank, title, number, iban, wallets: [{ name, number, title }] }
     from Theme settings. The IBAN below fails the bank check on purpose, so no transfer can reach a real account. */
  let mb = M.bank; if (typeof mb === 'string') { try { mb = JSON.parse(mb); } catch (e) { mb = null; } }
  const BANK = Object.assign({ bank: 'Bank name', title: 'DAUR Supply', number: '0000 0000 0000 0000', iban: 'PK00 BANK 0000 0000 0000 0000', wallets: [{ name: 'EasyPaisa', number: '0300 0000000', title: 'DAUR Supply' }, { name: 'JazzCash', number: '0300 0000000', title: 'DAUR Supply' }] }, mb || {});
  window.DAUR_PAYCARDS = () => payCards();
  const MAIL = String(C.supportEmail || 'contact@daursupply.com');

  /* ---------- icons the core set does not carry (Phosphor, MIT licence, same two tone style) ---------- */
  const XI = {
    bank: '<path d="M232,96H24L128,32Z" class="d"/><path d="M24,104H48v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16H208V104h24a8,8,0,0,0,4.19-14.81l-104-64a8,8,0,0,0-8.38,0l-104,64A8,8,0,0,0,24,104Zm40,0H96v64H64Zm80,0v64H112V104Zm48,64H160V104h32ZM128,41.39,203.74,88H52.26ZM248,208a8,8,0,0,1-8,8H16a8,8,0,0,1,0-16H240A8,8,0,0,1,248,208Z"/>',
    trash: '<path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56Z" class="d"/><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>',
    pen: '<path d="M221.66,90.34,192,120,136,64l29.66-29.66a8,8,0,0,1,11.31,0L221.66,79A8,8,0,0,1,221.66,90.34Z" class="d"/><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>',
    ok: '<path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" class="d"/><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>',
    minus: '<path d="M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128Z"/>',
    plus: '<path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>'
  };
  const xi = (n) => (XI[n] ? `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${XI[n]}</svg>` : ic(n));

  /* ---------- small helpers ---------- */
  const OPEN = new Set(); // gift lines whose details are unfolded
  let SIG = '', nagged = false, undo = null, ut = 0;
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const trim = (s) => String(s || '').trim();
  const isDone = (d) => !!(trim(d.to) && digits(d.phone).length >= 10 && trim(d.addr));
  const hasAny = (d) => !!(trim(d.to) || digits(d.phone) || trim(d.addr));
  const lineKey = (l) => [l.pid, l.vid, l.size, l.mode || 'me'].join('|');
  const unitsOf = (l) => giftUnits().filter((u) => u.l === l);
  const pl = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const sel = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&'));
  const lineEl = (k) => view.querySelector(`.xb-it[data-xline="${sel(k)}"]`);
  // gift details, one set per gift pair; a set saved for every gift at once (the earlier "same person" switch) is copied onto each pair once
  function gift() {
    const g = GD.get();
    if (g.same) { giftUnits().forEach((u) => { if (!hasAny(g.each[u.key] || {})) g.each[u.key] = Object.assign({}, g.all); }); g.same = false; GD.set(g); }
    return g;
  }
  const packOf = (g, key) => { const d = g.each[key] || {}; return d.pack == null ? g.pack !== false : !!d.pack; };

  /* ---------- the numbers, worked out once per drawing ---------- */
  function model() {
    const t = API.totals(), cart = API.cart;
    const L = t.lines.map((d) => ({ d, l: d.l, i: cart.indexOf(d.l), mode: d.l.mode || 'me', total: d.total, qty: d.l.qty }));
    const ships = L.some((x) => x.mode !== 'give');
    const cr = credits(t.subtotal), off = cr.use ? cr.use.amt : 0;
    const total = Math.max(0, t.subtotal - off);
    const plan = payPlan(L, total);
    const delCredit = ships ? DEL : 0;
    const n = (k) => L.filter((x) => x.mode === k).reduce((a, x) => a + x.qty, 0);
    return { t, L, ships, cr, off, total, plan, delCredit, kept: t.sale + off + delCredit, pairs: L.reduce((a, x) => a + x.qty, 0),
      own: L.filter((x) => x.mode === 'me'), gifts: L.filter((x) => x.mode === 'gift'), gives: L.filter((x) => x.mode === 'give'),
      nOwn: n('me'), nGift: n('gift'), nGive: n('give') };
  }

  /* ---------- one pair in the bag ---------- */
  function item(x, g) {
    const { d, l, i, mode } = x, p = d.p, v = d.v, im = pic(p, v), sale = API.onSale(v);
    const tag = mode === 'gift' ? `<span class="xb-tag gift">${ic('gift')}Gift</span>` : mode === 'give' ? `<span class="xb-tag give">${ic('hand')}Philanthropy</span>` : '';
    const meta = esc(v.color) + ' · ' + (mode === 'give' ? 'Size matched by DAUR' : 'EU ' + esc(l.size));
    const step = `<div class="xb-step" role="group" aria-label="How many ${esc(p.name)}">
        <button type="button" data-qty="${i}" data-d="-1" aria-label="${l.qty > 1 ? 'One less' : 'Remove ' + esc(p.name)}">${xi(l.qty > 1 ? 'minus' : 'trash')}</button>
        <span>${l.qty}</span><button type="button" data-qty="${i}" data-d="1" aria-label="One more">${xi('plus')}</button></div>`;
    return `<article class="xb-it k-${mode}" data-xline="${esc(lineKey(l))}">
      <div class="xb-row"><a class="xb-img" href="${href.product(p.id)}" data-m aria-label="${esc(p.name)}"><img class="${im.cut ? '' : 'blend'}" src="${esc(im.src)}" alt="" decoding="async"></a>
        <div class="xb-t">${tag}<b class="xb-n">${esc(p.name)}</b><small>${meta}</small>
          <div class="xb-b">${step}<span class="xb-p">${sale ? `<s>${esc(fmt(v.compareAt * l.qty))}</s>` : ''}<b>${esc(fmt(d.total))}</b></span></div></div></div>
      ${mode === 'gift' ? drawer(x, g) : mode === 'give' ? giveNote(l.qty) : ''}
    </article>`;
  }

  /* ---------- gift details: folded under each gift pair, a reminder until they are filled, never a lock ---------- */
  function drawer(x, g) {
    const k = lineKey(x.l), us = unitsOf(x.l), open = OPEN.has(k), id = 'xd-' + k.replace(/[^\w]/g, '_');
    const done = us.every((u) => isDone(gdOf(g, u.key)));
    return `<div class="xb-dr${open ? ' open' : ''}${done ? ' done' : ''}">
      <button class="xb-dr-h" type="button" data-xopen="${esc(k)}" aria-expanded="${open}" aria-controls="${id}">${status(us, g)}</button>
      <div class="xb-dr-b" id="${id}"${open ? '' : ' inert'}><div class="xb-dr-in"><div class="xb-dr-pad">
        ${us.map((u, n) => unitForm(u, n, us.length, g)).join('')}
        <div class="xb-dr-f"><small>Optional. Anything you leave empty, we ask you on WhatsApp.</small><button type="button" class="xb-save" data-xdone="${esc(k)}">Save</button></div>
      </div></div></div></div>`;
  }
  function status(us, g) {
    const ds = us.map((u) => gdOf(g, u.key)), done = ds.filter(isDone).length;
    if (done === us.length) {
      // the same person twice reads as one name
      const names = [], seen = new Set();
      ds.forEach((d) => { const nm = trim(d.to); if (!seen.has(nm.toLowerCase())) { seen.add(nm.toLowerCase()); names.push(nm); } });
      const who = names.length === 1 ? names[0] : names.length === 2 ? names[0] + ' and ' + names[1] : names.length + ' people';
      const sub = names.length === 1 ? (ds.length > 1 ? ds.length + ' pairs, ' : '') + trim(ds[0].addr) : 'Every gift has its details';
      return `<span class="xb-dr-i ok">${xi('ok')}</span><span class="xb-dr-t"><b>For ${esc(who)}</b><small>${esc(sub)}</small></span><span class="xb-dr-a"><em>Edit</em>${ic('chev')}</span>`;
    }
    const named = us.length === 1 && trim(ds[0].to);
    const q = named ? 'For ' + trim(ds[0].to) : us.length > 1 ? 'Who receives these ' + us.length + ' gifts?' : 'Who receives this gift?';
    const sub = named ? 'Add the phone and address, or send them on WhatsApp.' : done ? done + ' of ' + us.length + ' added. The rest can come on WhatsApp.' : 'Optional. You can also send it on WhatsApp.';
    return `<span class="xb-dr-i">${xi('pen')}</span><span class="xb-dr-t"><b>${esc(q)}</b><small>${sub}</small></span><span class="xb-dr-a">${ic('chev')}</span>`;
  }
  // the top of one gift's form: "Pair 1 of 2", and "Same as Ali" for details already given to another gift, one tap away
  function gfHead(u, n, of, g) {
    const seen = new Set(), key = esc(u.key);
    const same = giftUnits().filter((o) => { const nm = trim(gdOf(g, o.key).to).toLowerCase(); if (o.key === u.key || !nm || seen.has(nm) || nm === trim(gdOf(g, u.key).to).toLowerCase()) return false; seen.add(nm); return true; }).slice(0, 2);
    return (of > 1 ? `<b>Pair ${n + 1} of ${of}</b>` : '') + same.map((o) => `<button type="button" class="xb-same" data-xsame="${key}" data-xfrom="${esc(o.key)}">Same as ${esc(trim(gdOf(g, o.key).to))}</button>`).join('');
  }
  function unitForm(u, n, of, g) {
    const d = gdOf(g, u.key), key = esc(u.key);
    const f = (name, label, ph, type, max, extra) => `<label class="xb-in"><span>${label}</span><input data-xu="${key}" data-xf="${name}" type="${type}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(d[name] || '')}"${extra}></label>`;
    const head = gfHead(u, n, of, g);
    return `<div class="xb-gf" role="group" aria-label="${of > 1 ? 'Gift ' + (n + 1) + ' of ' + of : 'Gift details'}"><div class="xb-gf-h" data-xhead="${key}"${head ? '' : ' hidden'}>${head}</div>
      <div class="xb-f2">${f('to', 'Name', 'Who receives it', 'text', 40, ' autocomplete="off" autocapitalize="words"')}${f('phone', 'Phone', '03xx xxxxxxx', 'tel', 15, ' inputmode="tel" autocomplete="off"')}</div>
      ${f('addr', 'Address and city', 'House, street, area, city', 'text', 160, ' autocomplete="off"')}
      <label class="xb-in"><span>Your note in the box</span><textarea data-xu="${key}" data-xf="note" maxlength="240" rows="2" placeholder="Eid Mubarak. Wear them well.">${esc(d.note || '')}</textarea></label>
      <button type="button" class="xb-pack" data-xpack="${key}" aria-pressed="${packOf(g, u.key)}"><b>Gift packing</b><i class="xb-sw" aria-hidden="true"></i></button>
    </div>`;
  }
  // repaint one gift line's reminder row after its details change, without drawing the bag again
  function paintStatus(k) {
    const art = lineEl(k), l = API.cart.find((x) => lineKey(x) === k); if (!art || !l) return;
    const g = gift(), us = unitsOf(l), h = art.querySelector('.xb-dr-h'), dr = art.querySelector('.xb-dr');
    if (h) h.innerHTML = status(us, g);
    if (dr) dr.classList.toggle('done', us.every((u) => isDone(gdOf(g, u.key))));
  }
  function heads(k) {
    const art = lineEl(k), l = API.cart.find((x) => lineKey(x) === k); if (!art || !l) return;
    const g = gift(), us = unitsOf(l);
    us.forEach((u, n) => { const hd = art.querySelector(`[data-xhead="${sel(u.key)}"]`); if (hd) { const html = gfHead(u, n, us.length, g); hd.innerHTML = html; hd.hidden = !html; } });
  }
  function fold(k, open) {
    const art = lineEl(k), dr = art && art.querySelector('.xb-dr'); if (!dr) return;
    if (open == null) open = !dr.classList.contains('open');
    if (open) OPEN.add(k); else OPEN.delete(k);
    dr.classList.toggle('open', open);
    const b = dr.querySelector('.xb-dr-b'), h = dr.querySelector('.xb-dr-h');
    if (h) h.setAttribute('aria-expanded', String(open));
    if (open) {
      b.removeAttribute('inert');
      heads(k); // names typed for other gifts since the bag was drawn show up as "Same as" here
      // a gift with nothing written yet opens on its first field, so the keyboard is already there
      const empty = [...b.querySelectorAll('input')].every((x) => !x.value.trim());
      const first = b.querySelector('input');
      if (empty && first) first.focus();
      else setTimeout(() => dr.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }), 80);
    } else {
      if (dr.contains(document.activeElement)) document.activeElement.blur();
      b.setAttribute('inert', '');
      paintStatus(k);
    }
  }

  /* ---------- giving: what DAUR adds, and that the buyer hears when it is handed over ---------- */
  const giveNote = (q) => `<div class="xb-gv"><span class="xb-gv-i">${ic('hand')}</span><span class="xb-gv-t"><b>DAUR adds ${esc(fmt(DAUR_ADD * q))} ${q > 1 ? 'to your ' + q + ' pairs' : 'to this pair'}.</b><small>We message you as soon as it has been handed over.</small></span></div>`;

  /* ---------- a credit that is close: shown in red, as money about to be left behind ---------- */
  function nudge(m) {
    const now = m.cr.use ? m.cr.use.amt : 0;
    const nx = m.cr.list.filter((c) => !c.ok && c.amt > now).sort((a, b) => a.need - b.need)[0];
    if (!nx || nx.need > 6000) return '';
    const pc = Math.max(6, Math.min(100, Math.round(m.t.subtotal / nx.min * 100)));
    return `<a class="xb-nx" href="${href.shop()}" data-m><span class="xb-nx-t"><b>${esc(fmt(nx.need))} away from ${esc(fmt(nx.amt))} off</b><small>${esc(nx.code)} comes off by itself once your bag reaches ${esc(fmt(nx.min))}.</small></span>${ic('arrow')}<span class="xb-nx-bar" aria-hidden="true"><i style="width:${pc}%"></i></span></a>`;
  }

  /* ---------- the total: every line adds up, nothing to work out ---------- */
  function summary(m) {
    const credit = m.off + m.delCredit;
    const which = [m.off ? (m.cr.use.code === W.code ? 'Welcome credit' : m.cr.use.code) : '', m.delCredit ? (m.off ? 'delivery credit' : 'Delivery credit') : ''].filter(Boolean).join(' and ');
    return `<section class="xb-sum" aria-label="Your total">
      <div class="xb-r"><span>${pl(m.pairs, 'pair', 'pairs')}</span><span>${m.t.sale ? `<s>${esc(fmt(m.t.before))}</s>` : ''}${esc(fmt(m.t.subtotal))}</span></div>
      ${m.ships ? `<div class="xb-r"><span>Delivery</span><span>${esc(fmt(DEL))}</span></div>` : ''}
      ${credit ? `<a class="xb-r xb-cr" href="${href.offers}" data-m><span><em>Your credits</em><small>${esc(which)}</small></span><span class="g">&#8722; ${esc(fmt(credit))}</span></a>` : ''}
      <div class="xb-r xb-tot"><span>Total</span><span>${esc(fmt(m.total))}</span></div>
    </section>`;
  }

  /* ---------- how to pay: two plain choices, the amount for today on each ---------- */
  function payment(m) {
    const p = m.plan, door = Math.max(0, m.total - p.adv);
    if (p.onlyFull) {
      const many = m.nGift + m.nGive > 1;
      const [t, s] = m.nGift && m.nGive ? ['Everything arrives fully covered', 'No one pays at the door.']
        : m.nGift ? [many ? 'Your gifts arrive fully covered' : 'Your gift arrives fully covered', many ? 'No bill reaches them. Only the pairs and your notes.' : 'No bill reaches him. Only the pair and your note.']
          : [many ? m.nGive + ' pairs for people in need, fully covered' : 'A pair for someone in need, fully covered', 'They receive it with nothing to pay.'];
      return `<section class="xb-pay"><h2 class="xb-h">How you pay</h2><div class="xb-po solo"><span class="xb-po-t"><b>${t}</b><small>${s}</small></span><span class="xb-po-a"><b>${esc(fmt(p.now))}</b><small>today</small></span></div></section>`;
    }
    const what = m.nGift && m.nGive ? 'gifts and philanthropy' : m.nGift ? (m.nGift > 1 ? 'gifts' : 'gift') : 'philanthropy';
    const one = p.ownPairs === 1;
    const advT = p.full ? 'Cover the ' + what + ' today' : (one ? 'Reserve it with ' : 'Reserve them with ') + fmt(p.adv);
    const advS = p.full ? 'Your own ' + (one ? 'pair' : 'pairs') + ': ' + fmt(door) + ' at your door' : fmt(door) + (one ? ' when it reaches your door' : ' when they reach your door');
    const opt = (k, t, s, amt) => `<button type="button" class="xb-po" role="radio" data-pay="${k}" aria-checked="${p.choice === k}"><i class="xb-rd" aria-hidden="true"></i><span class="xb-po-t"><b>${esc(t)}</b><small>${esc(s)}</small></span><span class="xb-po-a"><b>${esc(fmt(amt))}</b><small>today</small></span></button>`;
    return `<section class="xb-pay"><h2 class="xb-h">How you pay</h2><div class="xb-pos" role="radiogroup" aria-label="How you pay">
      ${opt('adv', advT, advS, p.adv)}${opt('full', 'Done in one go', 'Nothing to pay at the door', m.total)}</div>${p.full ? '' : `<p class="xb-whyp">You send ${esc(fmt(p.adv))} and we send the whole pair. <button type="button" class="r9-whyl" data-why>Why ${esc(fmt(p.adv))} first?</button></p>`}</section>`;
  }

  /* ---------- where to send it: the account, copy buttons, and the receipt on WhatsApp ---------- */
  function receiptText(m, amt) {
    const items = m.L.map((x) => x.d.p.name + ' (' + x.d.v.color + (x.mode === 'give' ? ')' : ') EU ' + x.l.size) + (x.qty > 1 ? ' x' + x.qty : '') + (x.mode === 'gift' ? ', gift' : x.mode === 'give' ? ', giving' : '')).join('; ');
    return 'Assalam o Alaikum DAUR, I have sent ' + fmt(amt) + ' for my order: ' + items + '. My receipt is attached.';
  }
  // every way to pay is its own card: the bank account first, then each mobile wallet (swipe sideways)
  const CHIP = '<svg class="xb-chip" viewBox="0 0 44 32" aria-hidden="true"><rect x=".75" y=".75" width="42.5" height="30.5" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1 11h13M1 21h13M30 11h13M30 21h13M14 1v30M30 1v30" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  function payCards() {
    const out = [];
    if (BANK.number || BANK.iban) out.push({ k: 'bank', kind: 'Bank transfer', name: BANK.bank, title: BANK.title, main: ['Account number', BANK.number], extra: BANK.iban ? ['IBAN', BANK.iban] : null });
    (BANK.wallets || []).filter((w) => w && w.number).forEach((w) => out.push({ k: String(w.name || 'wallet').toLowerCase().replace(/[^a-z]/g, ''), kind: 'Mobile wallet', name: w.name || 'Mobile wallet', title: w.title || BANK.title, main: ['Mobile account', w.number], extra: null }));
    return out;
  }
  function bank(m) {
    const amt = m.plan.now, msg = receiptText(m, amt), cards = payCards();
    const cp = (label, val) => `<button type="button" class="xb-cp" data-xcopy="${esc(String(val).replace(/\s+/g, ''))}" aria-label="Copy ${esc(label)}">${ic('copy')}<span>Copy</span></button>`;
    const one = (c, i) => `<article class="xb-pc k-${esc(c.k)}" role="listitem" aria-label="${esc(c.name)}"><span class="xb-card-dm" aria-hidden="true">${DMARK}</span>
        <header><span class="xb-pc-n"><small>${esc(c.kind)}</small><b>${esc(c.name)}</b></span>${CHIP}</header>
        <div class="xb-pc-m"><span><small>${esc(c.main[0])}</small><b class="mono">${esc(c.main[1])}</b></span>${cp(c.main[0], c.main[1])}</div>
        ${c.extra ? `<div class="xb-pc-m sm"><span><small>${esc(c.extra[0])}</small><b class="mono">${esc(c.extra[1])}</b></span>${cp(c.extra[0], c.extra[1])}</div>` : ''}
        <footer><span><small>Account title</small><b>${esc(c.title || '')}</b></span><span class="xb-pc-i">${i + 1} / ${cards.length}</span></footer></article>`;
    const names = cards.slice(1).map((c) => c.name);
    return `<section class="xb-bank" aria-label="Where to send your payment">
      <div class="xb-bk-h"><h2 class="xb-h">Send ${esc(fmt(amt))}</h2><button type="button" class="xb-cp lt" data-xcopy="${Math.round(amt)}" aria-label="Copy the amount">${ic('copy')}<span>Copy amount</span></button></div>
      <p class="xb-bk-s">Pay the way you already do, now or right after you place your order.${names.length ? ' Swipe for ' + esc(names.join(' and ')) + '.' : ''}</p>
      <div class="xb-pcs" role="list">${cards.map(one).join('')}</div>
      <a class="xb-wa" href="https://wa.me/${esc(WA)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ic('wa')}<span>Send the receipt on WhatsApp</span></a>
      <a class="xb-mail" href="mailto:${esc(MAIL)}?subject=${encodeURIComponent('Payment receipt')}&amp;body=${encodeURIComponent(msg)}">Or email it to ${esc(MAIL)}</a>
    </section>`;
  }

  /* ---------- the slice vote and the three promises, kept short ---------- */
  const vote = () => (GIVE.on && GIVE.causes.length > 1 ? `<section class="xb-vote"><h2 class="xb-h sm">Where should this quarter's slice go?</h2><p>At least ${esc(String(GIVE.pct))}% of our profit, given every quarter. Your vote goes with your order.</p>
    <div class="xb-chips">${GIVE.causes.map((c) => `<button type="button" data-vote="${esc(c)}" aria-pressed="${store.get('sliceVote', '') === c}">${esc(c)}</button>`).join('')}</div></section>` : '');
  const trust = () => `<ul class="xb-trust"><li>${ic('truck')}<b>${esc(days())}</b><small>Delivery</small></li><li>${ic('swap')}<b>${C.exchangeDays || 5} days</b><small>Size swap</small></li><li>${ic('chat')}<b>WhatsApp</b><small>Every order confirmed</small></li></ul>`;

  /* ---------- the bar at the bottom: what they keep, and one button ---------- */
  function bar(m) {
    const b = buyBar(); b.classList.add('on-bag', 'xb-buy');
    b.innerHTML = `${m.kept > 0 ? `<p class="xb-bar-k">${ic('seal')}<span>You keep <b>${esc(fmt(m.kept))}</b> on this order</span></p>` : ''}
      <button class="xb-go" type="button" data-checkout><span class="xb-go-l">Checkout</span><span class="xb-go-a">${m.plan.door > 0 ? `${esc(fmt(m.plan.now))} <small>today</small>` : esc(fmt(m.total))}</span></button>`;
  }

  function empty() {
    document.documentElement.classList.remove('xb-typing');
    const pick = P().slice(0, 4);
    view.innerHTML = `<div class="xb xb-empty"><section class="r9-empty"><span class="r9-wm dk" aria-hidden="true">${MX.WORDMARK}</span><span class="r9-glow" aria-hidden="true"></span>${MX.BOXART(true)}<i class="r9-d d1"></i><i class="r9-d d2"></i><i class="r9-d d3"></i><i class="r9-d d4"></i>
      <span class="r9-k">${ic('spark')}Your DAUR box</span><h2>Your box is open.</h2>
      <p>${W.code ? 'It is waiting for its first pair, and ' + esc(fmt(W.amt + DEL)) + ' of credit is already inside. The credit only counts once a pair joins it.' : 'It is waiting for its first pair. Choose one and we will hold it here for you.'}</p>
      <a class="r9-go" href="${href.shop()}" data-m>Find my pair${ic('arrow')}</a>
      <ol class="r9-how"><li><b>1</b><span>Choose a pair and your size.</span></li><li><b>2</b><span>Reserve it with ${esc(fmt(1000))}, which comes off the price.</span></li><li><b>3</b><span>Pay the rest only when it is at your door.</span></li></ol></section>
      ${pick.length ? `<div class="m-row m-pad xb-em-h"><h2 class="m-h2">Start with these</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div><div class="m-grid">${pick.map((p) => card(p, false)).join('')}</div>` : ''}
      ${API.wish.length ? `<a class="gv-out" href="${href.liked}" data-m style="margin-top:22px"><span class="f-i">${ic('heart')}</span><span><b>${pl(API.wish.length, 'liked pair', 'liked pairs')}</b><small>Pick up where you left off</small></span>${ic('arrow')}</a>` : ''}</div>`;
    const b = $('#mBuy'); if (b) b.remove();
  }

  function draw(m) {
    document.documentElement.classList.remove('xb-typing');
    const g = gift(), mixed = m.gifts.length || m.gives.length;
    const grp = (list, title, n) => (list.length ? `${mixed ? `<div class="xb-lbl"><span>${title}</span><small>${pl(n, 'pair', 'pairs')}</small></div>` : ''}<div class="xb-its">${list.map((x) => item(x, g)).join('')}</div>` : '');
    view.innerHTML = `<div class="xb xb-bag m-pad">${grp(m.own, 'For you', m.nOwn)}${grp(m.gifts, 'Gifts', m.nGift)}${grp(m.gives, 'Philanthropy', m.nGive)}
      ${nudge(m)}${summary(m)}${payment(m)}${bank(m)}${trust()}</div>`;
    bar(m);
  }

  V.bag = function () {
    if (!API.cart.length || !API.totals().lines.length) { SIG = ''; empty(); return; }
    const sig = JSON.stringify([API.cart, store.get('mPay', ''), store.get('mCode', ''), store.get('mWallet', ''), store.get('sliceVote', '')]);
    const again = !!view.querySelector('.xb-bag') && !!$('#mBuy');
    // coming back from the bank app or WhatsApp with nothing changed: keep the screen exactly as it was
    if (again && sig === SIG) return;
    SIG = sig;
    const y = window.scrollY;
    draw(model());
    // the page has smooth scrolling switched on; putting it back must not glide
    if (again) { try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } }
  };

  /* ---------- typing: saved as it is typed, the reminder row follows along ---------- */
  view.addEventListener('input', (e) => {
    const el = e.target; if (!el || !el.dataset || !el.dataset.xf || !el.closest('.xb')) return;
    const g = gift(), k = el.dataset.xu, box = (g.each[k] = g.each[k] || {});
    box[el.dataset.xf] = el.value; GD.set(g);
    const art = el.closest('.xb-it'); if (art) paintStatus(art.dataset.xline);
  });

  const typing = (on) => { document.documentElement.classList.toggle('xb-typing', on); };
  view.addEventListener('focusin', (e) => { if (e.target && e.target.dataset && e.target.dataset.xf) typing(true); });
  view.addEventListener('focusout', (e) => { if (e.target && e.target.dataset && e.target.dataset.xf) setTimeout(() => { const a = document.activeElement; typing(!!(a && a.dataset && a.dataset.xf)); }, 60); });

  /* ---------- taps ---------- */
  MX.tap('xopen', (t, e, d) => { fold(d.xopen); });
  MX.tap('xdone', (t, e, d) => {
    fold(d.xdone, false);
    const l = API.cart.find((x) => lineKey(x) === d.xdone), g = gift();
    const all = l && unitsOf(l).every((u) => isDone(gdOf(g, u.key)));
    toast(all ? 'Gift details saved' : 'Saved. We will ask you the rest on WhatsApp');
    const art = lineEl(d.xdone); if (art) art.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
  MX.tap('xpack', (t, e, d) => { const g = gift(), k = d.xpack, box = (g.each[k] = g.each[k] || {}); box.pack = !packOf(g, k); GD.set(g); t.setAttribute('aria-pressed', String(box.pack)); });
  MX.tap('xsame', (t, e, d) => {
    const g = gift(), src = gdOf(g, d.xfrom), k = d.xsame, box = (g.each[k] = g.each[k] || {});
    ['to', 'phone', 'addr'].forEach((f) => { box[f] = src[f] || ''; const el = view.querySelector(`[data-xu="${sel(k)}"][data-xf="${f}"]`); if (el) el.value = box[f]; });
    GD.set(g);
    const art = t.closest('.xb-it'); if (art) { paintStatus(art.dataset.xline); heads(art.dataset.xline); }
    toast('Same details as ' + (trim(src.to) || 'the other gift'));
  });
  // copy a number: the button itself says Copied, so the eye never leaves the account
  function legacyCopy(s) { try { const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-200px;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; } }
  MX.tap('xcopy', (t, e, d) => {
    const s = d.xcopy, done = (ok) => {
      const lb = t.querySelector('span'); if (!t.dataset.was && lb) t.dataset.was = lb.textContent;
      t.classList.toggle('ok', ok); if (lb) lb.textContent = ok ? 'Copied' : 'Press and hold to copy';
      clearTimeout(+t.dataset.tm || 0); t.dataset.tm = String(setTimeout(() => { t.classList.remove('ok'); if (lb) lb.textContent = t.dataset.was || 'Copy'; }, 1800));
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(() => done(true), () => done(legacyCopy(s))); else done(legacyCopy(s));
  });
  // plus and minus; the last pair out leaves with an undo
  function undoToast(msg) {
    const el = document.getElementById('mToast'); if (!el) return;
    el.innerHTML = `<span>${esc(msg)}</span><button type="button" data-xundo>Undo</button>`;
    el.classList.add('on'); clearTimeout(ut); ut = setTimeout(() => { el.classList.remove('on'); undo = null; }, 4500);
  }
  MX.tap('qty', (t, e, d) => {
    const l = API.cart[+d.qty]; if (!l) return;
    const p = API.prod(l.pid), v = API.variant(p, l.vid), max = (v.stock || {})[l.size] || 0, step = +d.d;
    const others = API.cart.filter((x) => x !== l && x.pid === l.pid && x.vid === l.vid && x.size == l.size).reduce((a, x) => a + x.qty, 0);
    if (step > 0 && l.qty + others + 1 > max) { toast('No more stock in this size'); return; }
    const after = () => { V.bag(); paintTab(); paintTop(); };
    if (step < 0 && l.qty <= 1) {
      const go = () => { const at = API.cart.indexOf(l); if (at < 0) return; API.cart.splice(at, 1); store.set('cart', API.cart); undo = { l, at }; OPEN.delete(lineKey(l)); after(); undoToast(p.name + ' removed'); };
      const art = t.closest('.xb-it');
      if (art && !reduce) { art.classList.add('xb-out'); setTimeout(go, 200); } else go();
      return;
    }
    l.qty += step; store.set('cart', API.cart); after();
  });
  MX.tap('xundo', () => {
    const el = document.getElementById('mToast'); if (el) el.classList.remove('on');
    if (!undo) return;
    API.cart.splice(Math.min(undo.at, API.cart.length), 0, undo.l); store.set('cart', API.cart); undo = null;
    V.bag(); paintTab(); paintTop();
  });
  MX.tap('checkout', (t) => { checkout(t, false); });
  MX.tap('xnaggo', () => { closeSheet(); checkout($('#mBuy [data-checkout]'), true); });
  MX.tap('xnagadd', () => {
    closeSheet();
    const g = gift(), u = giftUnits().find((x) => !isDone(gdOf(g, x.key))); if (!u) return;
    const k = lineKey(u.l), art = lineEl(k); if (!art) return;
    art.scrollIntoView({ behavior: 'auto', block: 'start' });
    fold(k, true);
  });

  /* ---------- checkout: the bag goes to Shopify with every label the team reads ----------
     Line properties: Order type (GIFT, GIVING, OWN), and on every gift line Gift for, Gift phone, Gift address, Gift note,
     Gift packing, plus Gift details when something is missing. Attributes: Order type, Payment plan, Pay now, Pay at door,
     Credits used, Slice cause, Giving pair, Gift, Gift details, Gift packing, Opened in. */
  function nag(miss, total) {
    const what = miss === total ? (total > 1 ? 'your ' + total + ' gifts' : 'your gift') : miss + ' of your ' + total + ' gifts';
    openSheet(`<div class="xb xb-nag"><span class="xb-nag-i">${ic('gift')}</span><h3 class="xb-h">Who receives ${total > 1 ? 'your gifts' : 'your gift'}?</h3>
      <p>The details for ${what} are not complete yet. Add them now, or we will ask you on WhatsApp after your order.</p>
      <button type="button" class="m-cta wide" data-xnaggo><span>Continue to checkout</span></button>
      <button type="button" class="xb-nag-b" data-xnagadd>Add details now</button></div>`);
  }
  async function checkout(btn, skip) {
    const cart = API.cart; if (!cart.length) return;
    const g = gift(), units = giftUnits(), miss = units.filter((u) => !isDone(gdOf(g, u.key)));
    // a reminder once, never a lock: the details can come on WhatsApp
    if (miss.length && !skip && !nagged) { nagged = true; nag(miss.length, units.length); return; }
    const mixed = cart.some((l) => l.mode === 'gift' || l.mode === 'give');
    const items = [];
    cart.forEach((l) => {
      const p = API.prod(l.pid), v = p && API.variant(p, l.vid), id = v && v.sid && v.sid[l.size]; if (!id) return;
      if (l.mode === 'gift') {
        // one order line per gift pair, each with its own person, so nothing is mixed up when it is packed
        units.filter((u) => u.l === l).forEach((u) => {
          const d = gdOf(g, u.key), pr = Object.assign({}, lineProps('gift', mixed));
          const put = (k, val, n) => { const s = trim(val).slice(0, n); if (s) pr[k] = s; };
          put('Gift for', d.to, 40); put('Gift phone', d.phone, 15); put('Gift address', d.addr, 160); put('Gift note', d.note, 240);
          pr['Gift packing'] = packOf(g, u.key) ? 'Yes' : 'No';
          if (!isDone(d)) pr['Gift details'] = 'Not complete: ask the buyer on WhatsApp';
          items.push({ id, quantity: 1, properties: pr });
        });
        return;
      }
      const properties = lineProps(l.mode, mixed);
      items.push(properties ? { id, quantity: l.qty, properties } : { id, quantity: l.qty });
    });
    const m = model(), plan = m.plan, code = m.cr.use ? m.cr.use.code : '';
    const lbl = btn && btn.querySelector('.xb-go-l');
    if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.classList.add('busy'); if (lbl) lbl.textContent = 'Opening checkout'; }
    const reset = () => { if (btn) { btn.removeAttribute('aria-disabled'); btn.classList.remove('busy'); if (lbl) lbl.textContent = 'Checkout'; } };
    const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
    try {
      await fetch(root + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
      const r = await fetch(root + '/cart/add.js', { method: 'POST', headers: J, body: JSON.stringify({ items }) });
      if (!r.ok) { const er = await r.json().catch(() => ({})); toast(er.description || 'A size in your bag just sold out.'); reset(); return; }
      const nPack = units.filter((u) => packOf(g, u.key)).length;
      const attributes = {
        'Order type': orderType(cart),
        'Payment plan': plan.choice === 'full' ? 'Full payment now: ' + fmt(m.total) : (plan.full ? 'Gifts and giving paid now: ' : 'Advance now: ') + fmt(plan.now) + '. At the door: ' + fmt(plan.door),
        'Pay now': fmt(plan.now), 'Pay at door': plan.door ? fmt(plan.door) : '',
        'Credits used': [m.cr.use ? m.cr.use.label + ' ' + fmt(m.cr.use.amt) : '', m.ships ? 'Delivery credit ' + fmt(DEL) : ''].filter(Boolean).join(', '),
        'Slice cause': window.DAUR_SLICE_VOTE ? window.DAUR_SLICE_VOTE() : '',
        'Giving pair': m.nGive ? 'Yes, ' + m.nGive + ' paid in full in advance. Size matched by DAUR. DAUR adds ' + fmt(DAUR_ADD * m.nGive) + '. Message the buyer after the handover' : '',
        Gift: units.length ? 'Yes, ' + units.length + ' paid in full in advance. Details on each line' : '',
        'Gift details': units.length ? (miss.length ? miss.length + ' of ' + units.length + (units.length > 1 ? ' gifts' : ' gift') + (miss.length > 1 ? ' need' : ' needs') + ' details: ask the buyer on WhatsApp' : 'Complete on every gift line') : '',
        'Gift packing': nPack ? 'Requested on ' + nPack + ' of ' + units.length : '',
        'Opened in': 'Mobile app'
      };
      const upd = { attributes, discount: code };
      const note = orderNote(g, units, m.nGive); if (note) upd.note = note;
      await fetch(root + '/cart/update.js', { method: 'POST', headers: J, body: JSON.stringify(upd) });
      location.href = code ? root + '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(root + '/checkout') : root + '/checkout';
    } catch (er) { toast(navigator.onLine === false ? 'You are offline. Your bag is saved, so try again when you are back online.' : 'Checkout could not open. Please try again.'); reset(); }
  }
  // the order note lists every gift and giving pair in plain words, with what is still missing
  function orderNote(g, units, nGive) {
    const out = [];
    units.forEach((u, k) => {
      const d = gdOf(g, u.key), p = API.prod(u.l.pid);
      out.push('GIFT ' + (k + 1) + ': ' + (p ? p.name : '') + ' EU ' + u.l.size + (isDone(d) ? ' for ' + trim(d.to) + ', ' + trim(d.phone) + ', ' + trim(d.addr) : ' (details to be confirmed on WhatsApp' + (hasAny(d) ? ': ' + [trim(d.to), trim(d.phone), trim(d.addr)].filter(Boolean).join(', ') : '') + ')') + '. Packing: ' + (packOf(g, u.key) ? 'yes' : 'no') + '.' + (trim(d.note) ? ' Note: ' + trim(d.note) : ''));
    });
    if (nGive) out.push('GIVING: ' + pl(nGive, 'pair', 'pairs') + ' for someone in need. DAUR matches the size, hands it over and adds ' + fmt(DAUR_ADD * nGive) + '. Message the buyer once it is handed over.');
    return out.join('\n');
  }
})();
