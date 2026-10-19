/* M.O.R.C. Supply on Shopify.
   Runs before app.js. Turns the products Shopify prints into the page
   (snippets/morc-data.liquid) into the catalog shape the storefront uses,
   maps every storefront link to a Shopify address, and hands the bag to
   Shopify checkout. Sign ups, restock requests, liked pair follow ups and
   reviews are sent to the store owner through the Shopify contact form. */
(function () {
  'use strict';
  const S = window.MORC_SHOPIFY;
  const C = window.MORC_CONFIG;
  const base = (S.routes.root || '/').replace(/\/$/, '');
  const handleize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tagVal = (tags, key) => { const t = tags.find((x) => x.toLowerCase().indexOf(key + ':') === 0); return t ? t.slice(key.length + 1).trim() : null; };

  // a drawn shoe needs a palette when a colour has no photos yet
  function shade(hex, f) {
    const n = parseInt(String(hex || '#222222').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((x) => Math.max(0, Math.min(255, Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f))));
    return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  const palette = (hex) => ({ upper: hex, panel: shade(hex, -0.25), sole: '#0c0c0c', stitch: shade(hex, 0.45), lace: shade(hex, -0.5) });

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
    const oi = (re) => r.options.findIndex((o) => re.test(o.name));
    const ci = oi(/colou?r/i), si = oi(/size/i);
    const opt = (v, i) => (i < 0 ? '' : v.options[i]);
    const sizeOf = (v) => { const m = String(opt(v, si) || 'One').match(/\d+(\.\d+)?/); return m ? +m[0] : opt(v, si); };
    const colours = ci < 0 ? ['Standard'] : r.options[ci].values;
    const swatch = {};
    tags.forEach((t) => { const m = t.match(/^swatch:(.+)=(#[0-9a-f]{3,8})$/i); if (m) swatch[m[1].trim().toLowerCase()] = m[2]; });
    const cost = (tagVal(tags, 'cost') || '').split('/').map(Number);
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
      return { id: handleize(colour), color: colour, hex, price: first.price / 100, compareAt: first.cap && first.cap > first.price ? first.cap / 100 : null, stock, sid, palette: palette(hex), images: imgs.map((im) => im.src) };
    });
    // photos tied to no colour go to every colour that has none of its own
    const loose = r.images.filter((im) => !claimed.has(im.src)).map((im) => im.src);
    variants.forEach((v) => { if (!v.images.length) v.images = loose.slice(); });
    const body = splitBody(r.body);
    const audience = ['Men', 'Women', 'Kids'].find((a) => tags.some((t) => t.toLowerCase() === a.toLowerCase())) || 'Men';
    return {
      id: r.handle, name: r.title.replace(/^M\.O\.R\.C\.\s*/i, ''), audience, group: tagVal(tags, 'group'), category: r.type || 'Footwear',
      silhouette: tagVal(tags, 'silhouette') || 'runner', tag: tagVal(tags, 'badge') || 'Drop 01', createdAt: r.created, sizes,
      description: body.description, specs: body.specs, cost: cost.length === 3 && cost.every((n) => !isNaN(n)) ? { vendor: cost[0], kit: cost[1], logistics: cost[2] } : null,
      seo: r.seo || null, variants
    };
  }
  window.MORC_PRODUCTS = (S.raw || []).filter((r) => r.variants.length).map(toProduct);

  /* ---------- links ---------- */
  const PAGES = { manifesto: 'manifesto', contract: 'contract', track: 'track', wishlist: 'liked', list: 'alerts', feed: 'feed', policies: 'policies' };
  S.link = function (page, param) {
    const h = param ? '#' + param : '';
    if (page === 'home') return base + '/' + h;
    if (page === 'shop') return base + '/collections/all' + h;
    if (page === 'product') return base + '/products/' + String(param || '').split('~')[0] + h;
    if (page === 'cart') return base + '/cart' + h;
    if (page === 'checkout') return base + '/cart#go-checkout';
    if (page === 'order') return S.routes.account;
    if (PAGES[page]) return base + '/pages/' + PAGES[page] + h;
    return base + '/';
  };

  /* ---------- checkout: the bag goes into the Shopify cart, then to Shopify checkout ---------- */
  async function checkout() {
    const A = window.MORC_API;
    const items = A.cart.map((l) => { const p = A.prod(l.pid); const v = p && A.variant(p, l.vid); return v && v.sid && v.sid[l.size] ? { id: v.sid[l.size], quantity: l.qty } : null; }).filter(Boolean);
    if (!items.length) { location.href = S.link('cart'); return; }
    A.toast('Opening secure checkout');
    try {
      await fetch(base + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
      const r = await fetch(base + '/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); A.toast(e.description || 'A size in your bag just sold out. Please check the bag.'); return; }
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

  /* ---------- sign ups and requests reach the owner by email through the contact form ---------- */
  const LABEL = { alerts: 'Alert list sign up', restock: 'Restock request', leads: 'Liked pairs follow up', reviews: 'New review to check' };
  const sent = {};
  S.forward = function (key, list) {
    if (!LABEL[key] || !Array.isArray(list) || !list.length) return;
    const item = list[list.length - 1];
    const sig = key + JSON.stringify(item);
    if (sent[sig]) return; sent[sig] = 1;
    const lines = Object.keys(item).map((k) => k + ': ' + (typeof item[k] === 'object' ? JSON.stringify(item[k]) : item[k]));
    const f = new URLSearchParams();
    f.append('form_type', 'contact'); f.append('utf8', '✓');
    f.append('contact[email]', item.email || C.supportEmail);
    f.append('contact[name]', item.name || item.wa || 'Website visitor');
    f.append('contact[subject]', LABEL[key]);
    f.append('contact[body]', LABEL[key] + '\n\n' + lines.join('\n') + '\n\nPage: ' + location.href);
    fetch(base + '/contact', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: f.toString() }).catch(() => { /* WhatsApp stays the fallback */ });
  };

  /* ---------- views Shopify handles itself ---------- */
  const EXT = window.MORC_EXT = window.MORC_EXT || { views: {}, hooks: {} };
  EXT.views.page = function () { /* a normal Shopify page: keep the server content */ };
  EXT.views.checkout = function () { checkout(); };
  EXT.views.order = function () { location.replace(S.routes.account); };
  EXT.views.track = function (param) {
    const A = window.MORC_API; const esc = A.esc;
    A.setMeta('Track your order | M.O.R.C. Supply', 'Track a M.O.R.C. Supply Cash on Delivery order.');
    document.getElementById('app').innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Track</span><h1>Where is my pair.</h1><p class="aside">Your order confirmation message has a link to your order page. It shows every update and the courier tracking link once the parcel is dispatched.</p></div></section>
      <div class="wrap" style="padding-block:40px 96px">
        <div class="tcard"><div class="tcour"><div><span class="mono mute">Your orders</span><p>Sign in with the email or phone number you used at checkout to see all your orders, their status and the live courier link.</p></div><a class="btn volt" href="${esc(S.routes.account)}">Open my orders <span class="arr">&rarr;</span></a></div></div>
        <form class="track-one" id="tf" novalidate style="margin-top:28px">
          <div class="f-ic"><input id="tq" placeholder="Order number, for example #1001" autocomplete="off" aria-label="Order number"></div>
          <button class="btn ghost" type="submit">Ask on WhatsApp</button></form>
        <p class="form-note">No account? Type your order number and we will reply on WhatsApp with the status and courier link.</p></div>`;
    const tf = document.getElementById('tf');
    if (param) document.getElementById('tq').value = param;
    tf.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('tq').value.trim();
      window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent('Assalam o Alaikum M.O.R.C. Supply, please share the status of my order ' + q), '_blank', 'noopener');
    });
  };
})();
