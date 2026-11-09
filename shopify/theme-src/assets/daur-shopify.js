/* DAUR Supply on Shopify.
   Runs before app.js. Turns the products Shopify prints into the page
   (snippets/daur-data.liquid) into the catalog shape the storefront uses,
   maps every storefront link to a Shopify address, and hands the bag to
   Shopify checkout. Fit notes are emailed to the store owner through the
   Shopify contact form; the owner approves them in Content > Metaobjects. */
(function () {
  'use strict';
  const S = window.DAUR_SHOPIFY;
  const C = window.DAUR_CONFIG;
  const base = (S.routes.root || '/').replace(/\/$/, '');
  const handleize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tagVal = (tags, key) => { const t = tags.find((x) => x.toLowerCase().indexOf(key + ':') === 0); return t ? t.slice(key.length + 1).trim() : null; };

  // a drawn shoe needs a palette when a colour has no photos yet
  function shade(hex, f) {
    const n = parseInt(String(hex || '#222222').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((x) => Math.max(0, Math.min(255, Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f))));
    return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  // sole:<colour>=<hex> sets the outsole colour (gum, grey, white); the rest follows from the upper colour
  const palette = (hex, sole) => ({ upper: hex, panel: shade(hex, -0.25), apron: shade(hex, -0.12), pipe: shade(hex, 0.7), tassel: shade(hex, -0.18), sole: sole || '#0c0c0c', stitch: shade(hex, 0.45), lace: shade(hex, -0.5) });

  // description paragraphs stay the description; a list of "Label: value" lines becomes the specifications
  function splitBody(html) {
    const d = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html').body.firstChild;
    const specs = {};
    d.querySelectorAll('li').forEach((li) => {
      const t = li.textContent.trim(); const i = t.indexOf(':');
      if (i > 0) specs[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    });
    d.querySelectorAll('ul,ol').forEach((l) => l.remove());
    return { description: d.textContent.replace(/\s+/g, ' ').trim(), specs: Object.keys(specs).length ? specs : null };
  }

  function toProduct(r) {
    const tags = r.tags || [];
    // images whose alt text starts with "Drawing:" exist only so cart and checkout show a picture; the storefront draws those pairs live
    // images whose alt text starts with "Runway:" are cut out photos for the Runway page only (transparent PNG, side profile, toe right)
    const runway = (r.images || []).filter((im) => /^runway:/i.test(im.alt || ''));
    r = Object.assign({}, r, { images: (r.images || []).filter((im) => !/^(drawing|runway):/i.test(im.alt || '')) });
    const oi = (re) => r.options.findIndex((o) => re.test(o.name));
    const ci = oi(/colou?r/i), si = oi(/size/i);
    const opt = (v, i) => (i < 0 ? '' : v.options[i]);
    const sizeOf = (v) => { const m = String(opt(v, si) || 'One').match(/\d+(\.\d+)?/); return m ? +m[0] : opt(v, si); };
    const colours = ci < 0 ? ['Standard'] : r.options[ci].values;
    const swatch = {};
    const soles = {};
    tags.forEach((t) => {
      const m = t.match(/^(swatch|sole):(.+)=(#[0-9a-f]{3,8})$/i);
      if (m) (m[1].toLowerCase() === 'sole' ? soles : swatch)[m[2].trim().toLowerCase()] = m[3];
    });

    const sizes = [];
    r.variants.forEach((v) => { const s = sizeOf(v); if (!sizes.includes(s)) sizes.push(s); });
    const claimed = new Set();
    const variants = colours.map((colour) => {
      const vs = r.variants.filter((v) => ci < 0 || v.options[ci] === colour);
      const ids = vs.map((v) => v.id);
      const imgs = r.images.filter((im) => im.v.some((id) => ids.includes(id)) || (im.alt && im.alt.toLowerCase().includes(colour.toLowerCase())));
      imgs.forEach((im) => claimed.add(im.src));
      const stock = {}, sid = {};
      vs.forEach((v) => {
        const s = sizeOf(v);
        sid[s] = v.id;
        stock[s] = !v.available ? 0 : v.managed && v.policy !== 'continue' ? Math.max(0, v.qty) : 99;
      });
      const first = vs[0] || {};
      const hex = swatch[colour.toLowerCase()] || '#222222';
      const rw = runway.find((im) => im.v.some((id) => ids.includes(id)) || im.alt.toLowerCase().includes(colour.toLowerCase())) || (runway.length === 1 ? runway[0] : null);
      return { id: handleize(colour), color: colour, hex, runway: rw ? rw.src : null, price: first.price / 100, compareAt: first.cap && first.cap > first.price ? first.cap / 100 : null, stock, sid, palette: palette(hex, soles[colour.toLowerCase()]), images: imgs.map((im) => im.src) };
    });
    // photos tied to no colour go to every colour that has none of its own
    const loose = r.images.filter((im) => !claimed.has(im.src)).map((im) => im.src);
    variants.forEach((v) => { if (!v.images.length) v.images = loose.slice(); });
    const body = splitBody(r.body);
    const audience = ['Men', 'Women', 'Kids'].find((a) => tags.some((t) => t.toLowerCase() === a.toLowerCase())) || 'Men';
    // "A pair for someone in need" (tag giving-pair): bought here, handed over by DAUR in the quarterly giving round, size matched
    // to the person who receives it. It never shows in the shop grids (hidden), only on Gifts, and carries one line size 0.
    const giving = tags.some((t) => t.toLowerCase() === 'giving-pair');
    if (giving) { variants.forEach((v) => { const id = Object.values(v.sid)[0], st = Object.values(v.stock)[0] || 0; v.sid = { 0: id }; v.stock = { 0: st }; }); sizes.length = 0; sizes.push(0); }
    return {
      giving, hidden: giving,
      id: r.handle, name: r.title.replace(/^(DAUR|M\.O\.R\.C\.)\s+/i, ''), audience, group: tagVal(tags, 'group'), category: r.type || 'Footwear',
      silhouette: tagVal(tags, 'silhouette') || 'runner', tag: tagVal(tags, 'badge') || 'Drop 01', createdAt: r.created, sizes,
      description: body.description, specs: body.specs, model: (r.models || [])[0] || null,
      seo: r.seo || null, variants
    };
  }
  window.DAUR_PRODUCTS = (S.raw || []).filter((r) => r.variants.length).map(toProduct);

  /* ---------- links ---------- */
  const PAGES = { manifesto: 'manifesto', contract: 'contract', track: 'track', wishlist: 'liked', list: 'alerts', feed: 'feed', policies: 'policies', about: 'about', contact: 'contact', offers: 'offers', runway: 'runway', giving: 'giving', gifts: 'gifts' };
  // a line or style with a collection of its own links to that collection, so each has an address search engines can list
  const COLL = { men: 'men', women: 'women', kids: 'kids', sale: 'sale', sneakers: 'sneakers', leather: 'leather-shoes', hybrids: 'casual' };
  const has = new Set(S.collections || []);
  S.link = function (page, param) {
    const h = param ? '#' + param : '';
    if (page === 'home') return base + '/' + h;
    if (page === 'shop') return COLL[param] && has.has(COLL[param]) ? base + '/collections/' + COLL[param] : base + '/collections/all' + h;
    if (page === 'product') return base + '/products/' + String(param || '').split('~')[0] + h;
    if (page === 'cart') return base + '/cart' + h;
    if (page === 'checkout') return base + '/cart#go-checkout';
    if (page === 'order') return S.routes.account;
    if (PAGES[page]) return base + '/pages/' + PAGES[page] + h;
    return base + '/';
  };

  /* ---------- checkout: the bag goes into the Shopify cart, with its code, then to Shopify checkout ----------
     The code is put on the Shopify cart itself (cart/update.js, discount), so checkout opens with it already
     applied and the buyer never types it twice. The same step checks a code the moment it is entered in the bag. */
  const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
  async function syncCart(code) {
    const A = window.DAUR_API;
    const items = A.cart.map((l) => { const p = A.prod(l.pid); const v = p && A.variant(p, l.vid); if (!(v && v.sid && v.sid[l.size])) return null;
      // a pair added on the phone as a gift or to give keeps that note on its order line
      const properties = l.mode === 'give' ? { 'Order type': 'GIVING: for someone in need, handed over by DAUR', Size: 'Matched by DAUR to the person' } : l.mode === 'gift' ? { 'Order type': 'GIFT: for someone the buyer knows' } : null;
      return properties ? { id: v.sid[l.size], quantity: l.qty, properties } : { id: v.sid[l.size], quantity: l.qty }; }).filter(Boolean);
    if (!items.length) return { empty: true };
    await fetch(base + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
    const r = await fetch(base + '/cart/add.js', { method: 'POST', headers: J, body: JSON.stringify({ items }) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.description || 'A size in your bag just sold out. Please check the bag.' }; }
    // the buyer's vote for this quarter's charity slice goes on the order as "Slice cause"
    const vote = window.DAUR_SLICE_VOTE ? window.DAUR_SLICE_VOTE() : '';
    // a gift goes on the order too: packing, who it is for, the note for the box, and that it is paid in full in advance
    const g = window.DAUR_GIFT ? window.DAUR_GIFT() : null;
    // a giving pair: paid in full, handed over by DAUR in the quarterly giving round, proof sent privately to the buyer
    const giving = A.cart.some((l) => { const p = A.prod(l.pid); return l.mode === 'give' || (p && p.giving); });
    const gift = { 'Giving pair': giving ? 'Yes, paid in full in advance. Size matched by DAUR. Private proof after handover' : '', 'Gift': g ? 'Yes, paid in full in advance' : '', 'Gift packing': g && g.pack ? 'Requested' : '', 'Gift for': g ? String(g.to || '').slice(0, 40) : '', 'Gift note': g ? String(g.note || '').slice(0, 240) : '' };
    // how the order is paid, on the same rule as the phone bag
    const pl = window.DAUR_PLAN ? window.DAUR_PLAN() : null;
    const pay = pl ? { 'Payment plan': pl.text, 'Pay now': pl.now, 'Pay at door': pl.door } : {};
    const u = await fetch(base + '/cart/update.js', { method: 'POST', headers: J, body: JSON.stringify({ attributes: Object.assign({ 'Slice cause': vote }, gift, pay), discount: code || '' }) });
    return u.ok ? u.json() : {};
  }
  // checks a code against the real Shopify cart: is it known, does it apply to these pairs, and what it saves
  S.checkCode = async function (code) {
    try {
      const cart = await syncCart(code);
      if (cart.empty) return { pending: true };
      if (cart.error) return { error: cart.error };
      const dc = (cart.discount_codes || []).find((d) => String(d.code).toUpperCase() === String(code).toUpperCase());
      return { found: !!dc, applicable: !!(dc && dc.applicable), saving: Math.round((+cart.total_discount || 0) / 100) };
    } catch (e) { return { pending: true }; }
  };
  async function checkout() {
    const A = window.DAUR_API;
    if (!A.cart.length) { location.href = S.link('cart'); return; }
    A.toast(A.coupon ? 'Opening secure checkout with ' + A.coupon : 'Opening secure checkout');
    try {
      const cart = await syncCart(A.coupon);
      if (cart.empty) { location.href = S.link('cart'); return; }
      if (cart.error) { A.toast(cart.error); return; }
      // the code is already on the cart; the discount link is a second guarantee for older checkouts
      const code = A.coupon;
      location.href = code ? base + '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(base + '/checkout') : base + '/checkout';
    } catch (e) { A.toast('Checkout could not open. Please try again.'); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href$="#go-checkout"]');
    if (a) { e.preventDefault(); checkout(); }
  }, true);
  window.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#go-checkout') { history.replaceState(null, '', location.pathname); checkout(); }
  });

  /* ---------- fit notes reach the owner by email through the Shopify contact form ----------
     A storefront cannot write metaobjects, so each fit note is emailed to the store contact
     address, laid out field by field like Content > Metaobjects > Fit note. The quiet
     background send is checked: when Shopify answers with its spam check (hCaptcha) or any
     error, the same note is sent again as a normal form post so the customer can pass the
     check and land back on the pair. Before this check, challenged sends were lost silently. */
  const LABEL = { reviews: 'New fit note to approve' };
  const sent = {};
  function fitNoteFields(key, item) {
    const A = window.DAUR_API;
    const FIT = { small: 'Runs small', true: 'True to size', large: 'Runs large' };
    const pr = A.prod(item.pid); const vr = pr && A.variant(pr, item.vid);
    const lines = key === 'reviews' ? [
      'Status: Pending (change to Approved to show it on the site)',
      'Product: ' + (pr ? pr.name : item.pid), 'Product link: ' + location.origin + location.pathname,
      'Colour: ' + (vr ? vr.color : item.vid || ''), 'Stars: ' + item.rating,
      'Customer name: ' + (item.name || ''), 'City: ' + (item.city || ''), 'Headline: ' + (item.title || ''), 'Review text: ' + (item.body || ''),
      'Size worn (EU): ' + (item.size || ''), 'Fit: ' + (FIT[item.fit] || ''), 'Order number given: ' + (item.order || 'none'),
      'Customer email: ' + (item.email || 'not given'),
      'Photo: ' + (item.photo ? 'chosen on the site but not sent by email; ask the customer to send it on WhatsApp' : 'none'), 'Date: ' + String(item.at || '').slice(0, 10)
    ] : Object.keys(item).map((k) => k + ': ' + (typeof item[k] === 'object' ? JSON.stringify(item[k]) : item[k]));
    const subject = LABEL[key] + (pr ? ': ' + pr.name : '');
    return [
      ['form_type', 'contact'], ['utf8', '\u2713'],
      ['contact[email]', item.email || C.supportEmail],
      ['contact[name]', item.name || item.wa || 'Website visitor'],
      ['contact[subject]', subject],
      ['contact[body]', subject + '\n\n' + lines.join('\n')]
    ];
  }
  // the fallback: a real form post, so Shopify can show its spam check and then return to the pair
  function postForm(fields) {
    const back = location.pathname + '?fitnote=sent#reviews';
    const form = document.createElement('form');
    form.method = 'post'; form.action = base + '/contact'; form.style.display = 'none';
    fields.concat([['return_to', back]]).forEach(([k, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i); });
    document.body.appendChild(form); form.submit();
  }
  S.forward = function (key, list) {
    if (!LABEL[key] || !Array.isArray(list) || !list.length) return;
    // a new fit note is added to the front of the list
    // each note is sent once, even when the list is saved again later (Helpful votes save it too)
    let done = []; try { done = JSON.parse(localStorage.getItem('daur.fnsent') || '[]'); } catch (e) { /* storage blocked */ }
    const item = list.filter((r) => r.status === 'pending' && r.id && done.indexOf(r.id) === -1).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
    if (!item || sent[item.id]) return; sent[item.id] = 1;
    try { localStorage.setItem('daur.fnsent', JSON.stringify(done.concat(item.id).slice(-50))); } catch (e) { /* storage blocked */ }
    const fields = fitNoteFields(key, item);
    const body = new URLSearchParams(); fields.forEach(([k, v]) => body.append(k, v));
    fetch(base + '/contact', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' }, body: body.toString(), credentials: 'same-origin' })
      .then((r) => {
        const u = r.url || '';
        // Shopify sends a successful contact post on to a page marked contact_posted=true
        if (r.ok && u.indexOf('contact_posted=true') > -1 && u.indexOf('challenge') === -1) return;
        postForm(fields);
      })
      .catch(() => postForm(fields));
  };
  // back from the spam check: confirm the note arrived
  if (/[?&]fitnote=sent/.test(location.search) && /[?&]contact_posted=true/.test(location.search)) {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
      const A = window.DAUR_API; if (A && A.toast) A.toast('Thank you. Your fit note reached the DAUR team and goes live once approved.');
    }, 400));
  }

  /* ---------- views Shopify handles itself ---------- */
  const EXT = window.DAUR_EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  EXT.views.page = function () { /* a normal Shopify page: keep the server content */ };
  EXT.views.checkout = function () { checkout(); };
  EXT.views.order = function () { location.replace(S.routes.account); };
  EXT.views.track = function (param) {
    const A = window.DAUR_API; const esc = A.esc;
    A.setMeta('Track your order | DAUR Supply', 'Track your DAUR Supply order by order number, phone number or courier tracking number.');
    // Shopify shows an order only to the person who placed it: the order page (one time code by email, no password)
    // carries the live status, the order details and the courier tracking number once the pair is dispatched
    const steps = [['bag', 'Placed', 'Your order reaches us and your bag shows the Care deposit.'], ['check', 'Confirmed', 'We confirm it with you by call or WhatsApp.'], ['box', 'Dispatched', 'Usually within 24 hours, with your courier tracking number on WhatsApp.'], ['truck', 'Out for delivery', "Follow the parcel on the courier's tracking page."], ['home', 'Delivered', 'Pay the remaining balance to the rider, and enjoy your pair.']];
    document.getElementById('app').innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Track</span><h1>Your order, at every step.</h1><p class="aside">Check your order status, its details and the courier tracking number in whichever way suits you.</p></div></section>
      <div class="wrap trk" style="padding-block:36px 96px">
        <ol class="trk-steps" aria-label="What your order page shows">${steps.map(([i, t, d], k) => `<li><span class="trk-n mono">0${k + 1}</span><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
        <div class="trk-g">
          <div class="tcard trk-c trk-main"><span class="mono mute">1 / Your order page</span><h2>See your order status</h2>
            <p>Sign in with the email you ordered with. We send a one time code, no password. You see every order with its status, the items, the total and the courier tracking number once the pair is dispatched.</p>
            <a class="btn volt" href="${esc(S.routes.account)}">Open my orders <span class="arr">&rarr;</span></a>
            <p class="form-note">The order confirmation email also carries a direct link to your order page.</p></div>
          <form class="tcard trk-c" id="lcs" novalidate><span class="mono mute">2 / The courier</span><h2>Track with Leopards</h2>
            <p>Have the tracking number from your dispatch message? Type it here. We copy it and open the Leopards tracking page, where you paste it.</p>
            <div class="f-ic"><input id="lcsN" inputmode="text" placeholder="Tracking number, for example LE7..." autocomplete="off" aria-label="Leopards tracking number"></div>
            <button class="btn ghost" type="submit">Open Leopards tracking <span class="arr">&rarr;</span></button></form>
          <form class="tcard trk-c" id="tf" novalidate><span class="mono mute">3 / Our team</span><h2>Ask us on WhatsApp</h2>
            <p>Ordered with a phone number, or no email to hand? Send your order number or phone number and a member of our team will reply with the status.</p>
            <div class="f-ic"><input id="tq" placeholder="#1001 or 03XX XXXXXXX" autocomplete="off" aria-label="Order number, phone number or email"></div>
            <button class="btn ghost" type="submit">Ask on WhatsApp <span class="arr">&rarr;</span></button></form>
        </div></div>`;
    const lcs = document.getElementById('lcs');
    lcs.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = document.getElementById('lcsN').value.trim();
      const go = () => window.open('https://leopardscourier.com/leopards-tracking', '_blank', 'noopener');
      if (!n) { go(); return; }
      const done = () => { A.toast('Tracking number copied. Paste it on the Leopards page.'); go(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(n).then(done, go); else go();
    });
    const tf = document.getElementById('tf'), tq = document.getElementById('tq');
    if (param) tq.value = param;
    tf.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = tq.value.trim();
      if (!q) { tq.focus(); A.toast('Type your order number, phone or email'); return; }
      const kind = /@/.test(q) ? 'email' : C.normPhone(q) ? 'phone number' : 'order number';
      window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent('Assalam o Alaikum DAUR Supply, please share the status of my order. My ' + kind + ': ' + q), '_blank', 'noopener');
    });
  };
})();
