/* Supply Control: the M.O.R.C. admin panel (admin.html).
   In this static build it edits data kept in this browser and exports a new
   data.js. On a live store the same screens sit on a database and a login. */
(function () {
  'use strict';
  const A = () => window.MORC_API;
  const EXT = window.MORC_EXT = window.MORC_EXT || { views: {}, hooks: {} };
  EXT.views = EXT.views || {};
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const STATUSES = ['Placed', 'Confirmed', 'Dispatched', 'Out for delivery', 'Delivered', 'Returned', 'Exchanged', 'Cancelled'];
  const TABS = [['overview', 'Overview'], ['orders', 'Orders'], ['returns', 'Returns'], ['listings', 'Listings'], ['inventory', 'Inventory'], ['discounts', 'Discounts'], ['offers', 'Offers'], ['followups', 'Follow ups'], ['reviews', 'Reviews'], ['audience', 'Alert list'], ['settings', 'Settings'], ['export', 'Publish']];

  EXT.views.admin = function (param) {
    const { C, $, $$, esc, fmt, store, link, setMeta, visual, toast } = A();
    setMeta('Supply Control | M.O.R.C. Supply', 'Store admin.');
    const app = document.getElementById('app');
    let unlocked = false;
    try { unlocked = sessionStorage.getItem('morc.admin') === '1'; } catch (e) { /* blocked */ }
    if (!unlocked) {
      app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Supply Control</span><h1>Staff only.</h1><p class="aside">Enter the admin passcode.</p></div></section>
        <div class="wrap" style="padding-block:40px 96px"><form id="gate" class="track-form" novalidate><div class="f"><label for="pc">Passcode</label><input id="pc" type="password" autocomplete="current-password"><span class="err"></span></div><button class="btn volt">Unlock</button>
        <p class="form-note">Preview lock only. The live store needs a real staff login on the server.</p></form></div>`;
      $('#gate').addEventListener('submit', (e) => {
        e.preventDefault();
        if ($('#pc').value === C.adminPasscode) { try { sessionStorage.setItem('morc.admin', '1'); } catch (er) { /* blocked */ } EXT.views.admin(param); }
        else { $('#pc').closest('.f').classList.add('bad'); $('.err', $('#gate')).textContent = 'Wrong passcode.'; }
      });
      return;
    }

    let cat = clone(store.get('catalog', null) || window.MORC_PRODUCTS);
    const [tab, arg] = (param || 'overview').split('~');
    const saveCat = (msg) => { store.set('catalog', cat); toast(msg || 'Saved. Storefront updated'); };
    const recv = (v) => v.received || v.stock || {};
    const units = (v) => ({ total: sum(recv(v)), left: sum(v.stock) });
    const pUnits = (p) => p.variants.reduce((a, v) => { const u = units(v); return { total: a.total + u.total, left: a.left + u.left }; }, { total: 0, left: 0 });
    const lowVariants = () => cat.flatMap((p) => p.variants.flatMap((v) => p.sizes.filter((s) => (v.stock[s] || 0) <= C.lowStockAt).map((s) => ({ p, v, s, n: v.stock[s] || 0 }))));
    const statusChip = (p) => { const u = pUnits(p); if (p.hidden) return '<span class="chip">Hidden</span>'; if (!u.left) return '<span class="chip" style="color:var(--danger);border-color:var(--danger)">Sold out</span>'; if (p.variants.some((v) => p.sizes.some((s) => (v.stock[s] || 0) > 0 && v.stock[s] <= C.lowStockAt))) return '<span class="chip">Low stock</span>'; return '<span class="chip v">Live</span>'; };

    const shell = (inner) => `<section class="adm-head"><div class="wrap"><div><span class="eyebrow">Supply Control</span><h1>${esc((TABS.find((t) => t[0] === tab) || ['', 'Editor'])[1])}</h1></div>
        <div class="adm-tabs">${TABS.map(([k, t]) => `<a href="${link('admin', k)}" class="fbtn" aria-pressed="${k === tab}">${t}${k === 'reviews' ? ` (${store.get('reviews', []).filter((r) => r.status === 'pending').length})` : ''}</a>`).join('')}<button class="fbtn" id="lock">Lock</button></div></div></section>
      <div class="wrap adm"><p class="adm-note">Preview mode: changes are saved in this browser and shown on the storefront here. To publish for every visitor, use Publish to export data.js, or connect the backend described in README.md.</p>${inner}</div>`;
    const bindShell = () => { $('#lock').addEventListener('click', () => { try { sessionStorage.removeItem('morc.admin'); } catch (e) { /* blocked */ } EXT.views.admin(param); }); };
    const ic = (n) => (window.MORC_ICON ? window.MORC_ICON(n) : '');
    const Cfg = A().C;
    const allOrders = () => store.get('orders', []);
    const findV = (pid, color) => { const p = cat.find((x) => x.id === pid); return p ? [p, p.variants.find((v) => v.color === color) || p.variants[0]] : [null, null]; };
    // put pairs back on the shelf, for a cancelled order or a returned item
    const restock = (items) => { items.forEach((it) => { const [p, v] = findV(it.pid, it.color); if (v) v.stock[it.size] = (v.stock[it.size] || 0) + (+it.qty || 1); void p; }); saveCat('Pairs back in stock'); };
    const costOf = (p) => p.cost ? (+p.cost.vendor || 0) + (+p.cost.kit || 0) + (+p.cost.logistics || 0) : 0;
    const floorOf = (p) => costOf(p) + (+Cfg.followUp.minProfit || 0);
    const round50 = (n) => Math.round(n / 50) * 50;
    const phoneShow = (n) => '+' + String(n).replace(/^(\d{2})(\d{3})(\d{7})$/, '$1 $2 $3');
    const daysAgo = (t) => t ? Math.floor((Date.now() - new Date(t)) / 864e5) : null;
    const prettyAgo = (t) => { const d = daysAgo(t); return d == null ? '' : d < 1 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
    const saveSettings = (patch) => { const st = Object.assign({}, store.get('settings', {}) || {}, patch, { at: new Date().toISOString() }); store.set('settings', st); return st; };
    const getCoupons = () => clone(Cfg.coupons || {});
    const saveCoupons = (c) => { store.set('coupons', c); Cfg.coupons = c; };
    const couponUses = (code) => allOrders().filter((o) => o.coupon === code && o.status !== 'Cancelled').length;
    const purchasedBy = (wa) => allOrders().some((o) => Cfg.normPhone(o.customer.phone) === wa && o.status !== 'Cancelled');

    /* ---- overview ---- */
    if (tab === 'overview') {
      const orders = allOrders();
      const valid = orders.filter((o) => o.status !== 'Cancelled');
      const delivered = orders.filter((o) => o.status === 'Delivered');
      const open = orders.filter((o) => ['Placed', 'Confirmed', 'Dispatched'].includes(o.status));
      const returned = orders.filter((o) => ['Returned', 'Exchanged'].includes(o.status) || (o.returns || []).length);
      const soldUnits = valid.filter((o) => o.status !== 'Returned').reduce((a, o) => a + o.items.reduce((b, it) => b + it.qty, 0), 0);
      const u = cat.reduce((a, p) => { const x = pUnits(p); return { total: a.total + x.total, left: a.left + x.left }; }, { total: 0, left: 0 });
      const stockValue = cat.reduce((a, p) => a + p.variants.reduce((b, v) => b + sum(v.stock) * (+(p.cost && p.cost.vendor) || 0), 0), 0);
      const revs = store.get('reviews', []);
      const leads = store.get('leads', []);
      const due = leads.filter((l) => !purchasedBy(l.wa) && (daysAgo(l.updated || l.at) >= Cfg.followUp.remindAfter) && (!l.history || !l.history.length || daysAgo(l.history[l.history.length - 1].at) >= Cfg.followUp.remindAfter));
      const low = lowVariants();
      const out = low.filter((x) => !x.n);
      const codes = Object.entries(getCoupons()).filter(([, c]) => c.active !== false && !(c.expires && new Date(c.expires + 'T23:59:59') < new Date()));
      const rate = delivered.length + returned.length ? Math.round(returned.length / (delivered.length + returned.length) * 100) : 0;
      const kpi = [
        ['cash', 'Revenue delivered', fmt(delivered.reduce((a, o) => a + o.total, 0)), delivered.length + ' delivered orders'],
        ['clock', 'Cash on delivery pending', fmt(open.reduce((a, o) => a + o.total, 0)), open.length + ' open orders'],
        ['bag', 'Orders', orders.length, 'Average ' + fmt(valid.length ? Math.round(valid.reduce((a, o) => a + o.total, 0) / valid.length) : 0)],
        ['box', 'Pairs sold', soldUnits, (u.total - u.left) + ' left the shelf'],
        ['swap', 'Returns', returned.length, rate + '% return rate'],
        ['tag', 'Stock in hand', u.left + ' / ' + u.total, 'Worth ' + fmt(stockValue) + ' at cost'],
        ['flame', 'Stock alerts', low.length, out.length + ' sizes sold out'],
        ['star', 'Reviews waiting', revs.filter((r) => r.status === 'pending').length, revs.filter((r) => r.status === 'approved').length + ' live'],
        ['heart', 'Liked pair leads', leads.length, due.length + ' due a follow up'],
        ['ticket', 'Active codes', codes.length, Object.keys(getCoupons()).length + ' in total'],
        ['user', 'Alert list', store.get('alerts', []).length, store.get('restock', []).length + ' restock requests'],
        ['eye', 'Live listings', cat.filter((p) => !p.hidden).length + ' / ' + cat.length, cat.filter((p) => p.variants.some((v) => v.compareAt)).length + ' on sale']
      ];
      const todo = [
        [open.filter((o) => o.status === 'Placed').length, 'orders to confirm on WhatsApp', 'orders'],
        [out.length, 'sizes sold out', 'inventory'],
        [low.length - out.length, 'sizes running low', 'inventory'],
        [revs.filter((r) => r.status === 'pending').length, 'reviews waiting for approval', 'reviews'],
        [due.length, 'liked pair leads due a reminder', 'followups'],
        [store.get('restock', []).length, 'restock requests from customers', 'audience'],
        [codes.filter(([, c]) => c.expires && daysAgo(c.expires) >= -3).length, 'codes expiring within 3 days', 'discounts']
      ].filter(([n]) => n > 0);
      const sold = {};
      valid.forEach((o) => o.items.forEach((it) => { const k = it.name + ' / ' + it.color; sold[k] = (sold[k] || 0) + it.qty; }));
      const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 6);
      app.innerHTML = shell(`<div class="kpis kpis-x">${kpi.map(([i, k, v, sub]) => `<div><span class="mono mute">${ic(i)}${k}</span><b class="num">${v}</b><small>${sub}</small></div>`).join('')}</div>
        <div class="adm-two" style="margin-top:34px"><div><h3 class="adm-h">Needs attention</h3>${todo.length ? `<div class="todo">${todo.map(([n, t, k]) => `<a href="${link('admin', k)}"><b class="num">${n}</b><span>${t}</span>${ic('arrow')}</a>`).join('')}</div>` : '<p class="mute">All clear.</p>'}
          <h3 class="adm-h" style="margin-top:30px">Best sellers</h3>${top.length ? `<table class="atable"><tbody>${top.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n} pairs</td></tr>`).join('')}</tbody></table>` : '<p class="mute">No sales yet.</p>'}</div>
        <div><h3 class="adm-h">Stock alerts</h3>${low.length ? `<table class="atable"><thead><tr><th>Pair</th><th>Colour</th><th>EU</th><th>Left</th></tr></thead><tbody>${low.slice(0, 12).map((x) => `<tr><td>${esc(x.p.name)}</td><td>${esc(x.v.color)}</td><td>${x.s}</td><td class="${x.n ? 'volt' : 'bad'}">${x.n || 'Sold out'}</td></tr>`).join('')}</tbody></table>${low.length > 12 ? `<a class="link" href="${link('admin', 'inventory')}">All ${low.length} in Inventory</a>` : ''}` : '<p class="mute">Nothing low.</p>'}
          <h3 class="adm-h" style="margin-top:30px">Latest orders</h3>${orders.length ? `<table class="atable"><tbody>${orders.slice(0, 8).map((o) => `<tr><td class="mono">${esc(o.id)}</td><td>${esc(o.customer.name)}</td><td>${esc(o.address.city)}</td><td class="num">${fmt(o.total)}</td><td>${esc(o.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="mute">No orders yet.</p>'}</div></div>`);
      bindShell(); return;
    }

    /* ---- listings ---- */
    if (tab === 'listings') {
      app.innerHTML = shell(`<div class="toolbar"><input class="finput" id="lq" placeholder="Search listings" style="max-width:320px"><a class="btn volt" href="${link('admin', 'edit~new')}">Add listing</a></div>
        <div style="overflow-x:auto"><table class="atable" id="lt"><thead><tr><th></th><th>Listing</th><th>Line</th><th>Colours</th><th>Price</th><th>Stock left / total</th><th>Status</th><th></th></tr></thead><tbody>
        ${cat.map((p) => { const u = pUnits(p); const pr = p.variants.map((v) => v.price); return `<tr data-row="${esc(p.id)}" data-q="${esc((p.name + ' ' + p.audience + ' ' + p.category).toLowerCase())}">
          <td><span class="athumb">${visual(p, p.variants[0])}</span></td><td><b>${esc(p.name)}</b><br><span class="mono mute">${esc(p.id)}</span></td><td>${esc(p.audience)}${p.group ? ' / ' + esc(p.group) : ''}</td><td>${p.variants.map((v) => `<span class="sw-b" style="--c:${esc(v.hex || '#333')};display:inline-block;vertical-align:middle" title="${esc(v.color)}"></span>`).join(' ')}</td>
          <td class="num">${fmt(Math.min(...pr))}${Math.max(...pr) !== Math.min(...pr) ? ' to ' + fmt(Math.max(...pr)) : ''}${p.variants.some((v) => v.compareAt) ? ' <span class="chip v">Sale</span>' : ''}</td>
          <td><span class="num">${u.left} / ${u.total}</span><div class="minibar" style="margin-top:6px;width:120px"><i class="v" style="width:${u.total ? u.left / u.total * 100 : 0}%"></i></div></td><td>${statusChip(p)}</td>
          <td class="acts"><a class="rm" href="${link('admin', 'edit~' + p.id)}">Edit</a><button class="rm" data-hide="${esc(p.id)}">${p.hidden ? 'Show' : 'Hide'}</button><button class="rm" data-del="${esc(p.id)}">Delete</button><a class="rm" href="${link('product', p.id)}" target="_blank" rel="noopener">View</a></td></tr>`; }).join('')}</tbody></table></div>`);
      bindShell();
      $('#lq').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('#lt [data-row]').forEach((r) => { r.hidden = !r.dataset.q.includes(q); }); });
      $$('[data-hide]').forEach((b) => b.addEventListener('click', () => { const p = cat.find((x) => x.id === b.dataset.hide); p.hidden = !p.hidden; saveCat(p.hidden ? 'Hidden from the storefront' : 'Live on the storefront'); EXT.views.admin('listings'); }));
      $$('[data-del]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.armed) { cat = cat.filter((x) => x.id !== b.dataset.del); saveCat('Listing deleted'); EXT.views.admin('listings'); return; }
        b.dataset.armed = '1'; b.textContent = 'Confirm delete'; b.style.color = 'var(--danger)'; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Delete'; b.style.color = ''; } }, 4000);
      }));
      return;
    }

    /* ---- listing editor ---- */
    if (tab === 'edit') {
      const isNew = arg === 'new';
      const p = isNew ? { id: '', name: '', audience: 'Men', group: null, category: 'Sneakers', silhouette: 'court', tag: 'Drop 01', createdAt: new Date().toISOString().slice(0, 10), sizes: [40, 41, 42, 43, 44, 45], description: '', specs: {}, cost: { vendor: 0, kit: 420, logistics: 330 }, seo: { title: '', description: '' }, variants: [] } : clone(cat.find((x) => x.id === arg) || cat[0]);
      if (!p.variants.length) p.variants.push({ id: 'black', color: 'Black', hex: '#111111', price: 4500, compareAt: null, stock: {}, received: {}, images: [], palette: { upper: '#141414', panel: '#1c1c1c', sole: '#0c0c0c', stitch: '#5a5a55', lace: '#0a0a0a' } });
      const cats = [...new Set(cat.map((x) => x.category))];
      const vHTML = (v, i) => `<div class="vcard" data-vi="${i}"><div class="vcard-h"><b>Colour ${i + 1}</b><button type="button" class="rm" data-vrm="${i}">Remove colour</button></div>
        <div class="f-row"><div class="f"><label>Colour name</label><input data-k="color" value="${esc(v.color)}"></div><div class="f"><label>Swatch</label><input data-k="hex" type="color" value="${esc(v.hex || '#111111')}" style="padding:4px"></div></div>
        <div class="f-row"><div class="f"><label>Price (Rs.)</label><input data-k="price" type="number" min="0" value="${v.price}"></div><div class="f"><label>Before price, for sale (Rs.)</label><input data-k="compareAt" type="number" min="0" value="${v.compareAt || ''}" placeholder="Leave empty if not on sale"></div></div>
        <div class="f"><label>Images, one path or URL per line (first is the main photo)</label><textarea data-k="images" placeholder="products/men/moc-runner-v1/triple-black/01.jpg">${esc((v.images || []).join('\n'))}</textarea></div>
        <div class="f"><label>Stock per size: left now / total received</label><div class="stockgrid">${p.sizes.map((s) => `<div><span class="mono">EU ${s}</span><input data-left="${s}" type="number" min="0" value="${(v.stock || {})[s] || 0}" aria-label="EU ${s} left"><input data-recv="${s}" type="number" min="0" value="${(recv(v))[s] || 0}" aria-label="EU ${s} total"></div>`).join('')}</div></div></div>`;
      app.innerHTML = shell(`<form id="ed" class="ed" novalidate><div class="ed-main">
        <fieldset><legend><span>01</span> Listing</legend>
          <div class="f-row"><div class="f"><label for="e-name">Name</label><input id="e-name" value="${esc(p.name)}" required><span class="err"></span></div><div class="f"><label for="e-id">URL id</label><input id="e-id" value="${esc(p.id)}" placeholder="made from the name"></div></div>
          <div class="f-row"><div class="f"><label for="e-aud">Line</label><select id="e-aud">${C.audiences.map((a) => `<option ${a === p.audience ? 'selected' : ''}>${a}</option>`).join('')}</select></div><div class="f"><label for="e-grp">Sub group (optional)</label><input id="e-grp" value="${esc(p.group || '')}" placeholder="Baby Girl, Baby Boy"></div></div>
          <div class="f-row"><div class="f"><label for="e-cat">Style</label><input id="e-cat" list="cats" value="${esc(p.category)}"><datalist id="cats">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</datalist></div><div class="f"><label for="e-tag">Badge</label><input id="e-tag" value="${esc(p.tag || '')}" placeholder="Drop 01, Limited"></div></div>
          <div class="f-row"><div class="f"><label for="e-sil">Drawing used when there is no photo</label><select id="e-sil">${Object.keys(window.MORC_SHOE.SHAPES).map((s) => `<option ${s === p.silhouette ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="f"><label for="e-sizes">Sizes (EU, comma separated)</label><input id="e-sizes" value="${p.sizes.join(', ')}"></div></div>
          <div class="f"><label for="e-desc">Description</label><textarea id="e-desc">${esc(p.description)}</textarea></div>
          <div class="f"><label for="e-specs">Specifications, one per line as Label: value</label><textarea id="e-specs">${esc(Object.entries(p.specs || {}).map(([k, v]) => k + ': ' + v).join('\n'))}</textarea></div>
          <label class="chk"><input type="checkbox" id="e-hidden" ${p.hidden ? 'checked' : ''}> Hidden from the storefront</label>
        </fieldset>
        <fieldset><legend><span>02</span> Price transparency (per pair)</legend><div class="f-row" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="f"><label for="e-cv">Vendor price</label><input id="e-cv" type="number" value="${p.cost.vendor}"></div><div class="f"><label for="e-ck">Hardware and packaging</label><input id="e-ck" type="number" value="${p.cost.kit}"></div><div class="f"><label for="e-cl">QA, courier, COD</label><input id="e-cl" type="number" value="${p.cost.logistics}"></div></div></fieldset>
        <fieldset><legend><span>03</span> Colours, prices and stock</legend><div id="vlist">${p.variants.map(vHTML).join('')}</div><button type="button" class="btn ghost" id="vadd">Add colour</button></fieldset>
        <fieldset><legend><span>04</span> Search listing</legend><div class="f"><label for="e-st">Page title</label><input id="e-st" value="${esc((p.seo || {}).title || '')}" placeholder="M.O.R.C. Name | Keyword Pakistan"></div><div class="f"><label for="e-sd">Meta description</label><textarea id="e-sd">${esc((p.seo || {}).description || '')}</textarea></div></fieldset>
      </div><aside class="side"><span class="mono mute">${isNew ? 'New listing' : 'Editing'}</span><div class="ed-prev" id="prev">${visual(p, p.variants[0])}</div><button class="btn volt block" type="submit">Save listing</button><a class="btn ghost block" href="${link('admin', 'listings')}">Back to listings</a></aside></form>`);
      bindShell();
      const readVariants = () => $$('.vcard').map((el, i) => {
        const old = p.variants[i] || p.variants[0];
        const g = (k) => $(`[data-k="${k}"]`, el).value;
        const stock = {}, received = {};
        $$('[data-left]', el).forEach((x) => { stock[x.dataset.left] = Math.max(0, +x.value || 0); });
        $$('[data-recv]', el).forEach((x) => { received[x.dataset.recv] = Math.max(+x.value || 0, stock[x.dataset.recv]); });
        const hex = g('hex');
        return Object.assign({}, old, { id: slug(g('color')) || 'v' + i, color: g('color').trim(), hex, price: +g('price') || 0, compareAt: +g('compareAt') > +g('price') ? +g('compareAt') : null, images: g('images').split('\n').map((s) => s.trim()).filter(Boolean), stock, received, palette: old.palette || { upper: hex, panel: hex, sole: '#0c0c0c', stitch: '#5a5a55', lace: '#0a0a0a' } });
      });
      const bindV = () => $$('[data-vrm]').forEach((b) => b.onclick = () => { if ($$('.vcard').length < 2) { toast('A listing needs at least one colour'); return; } p.variants = readVariants(); p.variants.splice(+b.dataset.vrm, 1); $('#vlist').innerHTML = p.variants.map(vHTML).join(''); bindV(); });
      bindV();
      $('#vadd').addEventListener('click', () => { p.variants = readVariants(); p.variants.push({ id: 'new', color: '', hex: '#333333', price: p.variants[0] ? p.variants[0].price : 4500, compareAt: null, stock: {}, received: {}, images: [], palette: null }); $('#vlist').innerHTML = p.variants.map(vHTML).join(''); bindV(); });
      $('#ed').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#e-name').value.trim();
        if (!name) { $('#e-name').closest('.f').classList.add('bad'); $('#e-name').closest('.f').querySelector('.err').textContent = 'Name is required.'; return; }
        const vs = readVariants();
        if (vs.some((v) => !v.color)) { toast('Every colour needs a name'); return; }
        const id = slug($('#e-id').value || name);
        if (cat.some((x) => x.id === id && x.id !== arg)) { toast('Another listing already uses that URL id'); return; }
        const specs = {}; $('#e-specs').value.split('\n').forEach((l) => { const i = l.indexOf(':'); if (i > 0) specs[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
        const out = Object.assign(p, { id, name, audience: $('#e-aud').value, group: $('#e-grp').value.trim() || null, category: $('#e-cat').value.trim() || 'Sneakers', tag: $('#e-tag').value.trim() || 'Drop 01', silhouette: $('#e-sil').value, sizes: $('#e-sizes').value.split(',').map((s) => +s.trim()).filter(Boolean), description: $('#e-desc').value.trim(), specs, hidden: $('#e-hidden').checked, cost: { vendor: +$('#e-cv').value || 0, kit: +$('#e-ck').value || 0, logistics: +$('#e-cl').value || 0 }, seo: { title: $('#e-st').value.trim(), description: $('#e-sd').value.trim() }, variants: vs });
        if (isNew) cat.unshift(out); else cat[cat.findIndex((x) => x.id === arg)] = out;
        saveCat(isNew ? 'Listing added' : 'Listing saved');
        location.href = link('admin', 'listings'); if (A().SPA) EXT.views.admin('listings');
      });
      return;
    }

    /* ---- inventory ---- */
    if (tab === 'inventory') {
      app.innerHTML = shell(`<p class="mute" style="margin-bottom:18px">Left now / total received for every size. Type the new count of pairs in hand, or use Receive to add a fresh delivery from the vendor.</p>
        <div style="overflow-x:auto"><table class="atable inv"><thead><tr><th>Pair / colour</th><th>Sizes: left of total</th><th>Left</th><th>Sold</th><th>Receive</th></tr></thead><tbody>
        ${cat.flatMap((p, pi) => p.variants.map((v, vi) => { const u = units(v); return `<tr><td><b>${esc(p.name)}</b><br><span class="mono mute">${esc(v.color)}</span></td>
          <td><div class="invrow">${p.sizes.map((s) => { const n = v.stock[s] || 0; return `<label class="${n ? n <= C.lowStockAt ? 'lo' : '' : 'out'}"><span class="mono">${s}</span><input type="number" min="0" value="${n}" data-inv="${pi}|${vi}|${s}"><small>/ ${(recv(v))[s] || 0}</small></label>`; }).join('')}</div></td>
          <td class="num">${u.left}</td><td class="num">${u.total - u.left}</td><td><div class="promo" style="width:150px"><input placeholder="EU:qty" data-rcv="${pi}|${vi}" aria-label="Receive stock, for example 42:6"><button data-rcvb="${pi}|${vi}">Add</button></div></td></tr>`; })).join('')}</tbody></table></div>`);
      bindShell();
      $$('[data-inv]').forEach((inp) => inp.addEventListener('change', () => {
        const [pi, vi, s] = inp.dataset.inv.split('|'); const v = cat[pi].variants[vi];
        v.received = v.received || clone(v.stock); v.stock[s] = Math.max(0, +inp.value || 0); if ((v.received[s] || 0) < v.stock[s]) v.received[s] = v.stock[s];
        saveCat('Stock updated'); EXT.views.admin('inventory');
      }));
      $$('[data-rcvb]').forEach((b) => b.addEventListener('click', () => {
        const [pi, vi] = b.dataset.rcvb.split('|'); const v = cat[pi].variants[vi];
        const m = $(`[data-rcv="${pi}|${vi}"]`).value.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
        if (!m) { toast('Use size:quantity, for example 42:6'); return; }
        v.received = v.received || clone(v.stock); v.stock[m[1]] = (v.stock[m[1]] || 0) + +m[2]; v.received[m[1]] = (v.received[m[1]] || 0) + +m[2];
        saveCat(`Received ${m[2]} pairs in EU ${m[1]}`); EXT.views.admin('inventory');
      }));
      return;
    }

    /* ---- orders ---- */
    if (tab === 'orders') {
      const orders = allOrders();
      const filt = arg || 'All';
      const shown = orders.map((o, i) => [o, i]).filter(([o]) => filt === 'All' || o.status === filt);
      app.innerHTML = shell(`<div class="filters" style="margin-bottom:18px">${['All'].concat(STATUSES).map((s) => `<a class="fbtn" href="${link('admin', 'orders~' + s)}" aria-pressed="${s === filt}">${s} (${s === 'All' ? orders.length : orders.filter((o) => o.status === s).length})</a>`).join('')}</div>` + (shown.length ? `<div class="olist">${shown.map(([o, i]) => `<details class="ocard"><summary><span class="mono">${esc(o.id)}</span><span>${esc(o.customer.name)}</span><span>${esc(o.address.city)}</span><span class="num">${fmt(o.total)}</span><span class="chip ${o.status === 'Delivered' ? 'v' : ''}">${esc(o.status)}</span></summary>
          <div class="ocard-b"><div><span class="mono mute">Items</span>${o.items.map((it) => `<p>${it.qty} x ${esc(it.name)}, ${esc(it.color)}, EU ${it.size}, ${fmt(it.price)}</p>`).join('')}<p class="mute">Subtotal ${fmt(o.subtotal)}${o.discount ? `, code ${esc(o.coupon)} minus ${fmt(o.discount)}` : ''}, delivery ${fmt(o.delivery)}</p>${(o.returns || []).map((r) => `<p class="volt">Returned: ${esc(r.item)}, ${esc(r.reason)}, ${esc(r.action)}${r.restock ? ', restocked' : ''}</p>`).join('')}<p class="mute">Placed ${prettyAgo(o.at)}</p></div>
          <div><span class="mono mute">Deliver to</span><p>${esc(o.address.address)}, ${esc(o.address.area)}, ${esc(o.address.city)}${o.address.landmark ? ', near ' + esc(o.address.landmark) : ''}</p>${o.address.note ? `<p class="mute">Note: ${esc(o.address.note)}</p>` : ''}<p class="mono">${esc(o.customer.phone)}${o.customer.email ? ' / ' + esc(o.customer.email) : ''}</p></div>
          <div style="display:grid;gap:8px;align-content:start"><label class="mono mute" for="os${i}">Status</label><select class="select" id="os${i}" data-os="${i}">${STATUSES.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <a class="link" target="_blank" rel="noopener" href="https://wa.me/${esc(Cfg.normPhone(o.customer.phone) || '')}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer.name}, this is M.O.R.C. Supply confirming order ${o.id} for ${fmt(o.total)} Cash on Delivery. Reply YES to confirm.`)}">Confirm on WhatsApp</a>
          <a class="link" href="${link('admin', 'returns~' + o.id)}">Log a return</a></div>
          <form class="courier-f" data-cf="${i}"><span class="mono mute">Courier and live tracking</span>
            <div class="f-row"><div class="f"><label>Courier</label><input list="couriers" name="cn" value="${esc((o.courier || {}).name || '')}" placeholder="TCS, Leopards, PostEx, M&amp;P"></div><div class="f"><label>Tracking number</label><input name="no" value="${esc((o.courier || {}).no || '')}"></div></div>
            <div class="f"><label>Live tracking link from the courier</label><input name="url" type="url" value="${esc((o.courier || {}).url || '')}" placeholder="Paste the courier's tracking page link"></div>
            <div class="f"><label>Latest update for the customer (optional)</label><input name="note" value="${esc((o.courier || {}).note || '')}" placeholder="For example: Reached Lahore hub"></div>
            <div class="acts"><button class="btn volt">Save tracking</button>${(o.courier || {}).url ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(Cfg.normPhone(o.customer.phone) || '')}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer.name}, your M.O.R.C. Supply order ${o.id} is with ${o.courier.name || 'the courier'}${o.courier.no ? ', tracking number ' + o.courier.no : ''}. Track it live here: ${o.courier.url}`)}">Send tracking on WhatsApp</a>` : ''}</div></form></div></details>`).join('')}</div>` : '<p class="mute">No orders here. Orders placed on this device appear in this list.</p>'));
      app.insertAdjacentHTML('beforeend', '<datalist id="couriers">' + ['TCS', 'Leopards Courier', 'M&P', 'PostEx', 'Trax', 'BlueEx', 'Call Courier', 'Rider', 'Pakistan Post'].map((c) => `<option value="${esc(c)}">`).join('') + '</datalist>');
      bindShell();
      $$('[data-cf]').forEach((f) => f.addEventListener('submit', (e) => {
        e.preventDefault();
        const all = allOrders(); const o = all[+f.dataset.cf];
        const url = f.url.value.trim();
        if (url && !/^https?:\/\//i.test(url)) { toast('The tracking link must start with http:// or https://'); return; }
        o.courier = { name: f.cn.value.trim(), no: f.no.value.trim(), url, note: f.note.value.trim(), at: new Date().toISOString() };
        (o.history = o.history || []).push({ status: o.status, note: o.courier.note || 'Tracking details added', at: o.courier.at });
        store.set('orders', all); toast('Tracking saved'); EXT.views.admin('orders~' + filt);
      }));
      $$('[data-os]').forEach((s) => s.addEventListener('change', () => {
        const all = allOrders(); const o = all[+s.dataset.os]; o.status = s.value;
        (o.history = o.history || []).push({ status: s.value, at: new Date().toISOString() });
        // a cancelled order never left, so its pairs go straight back on the shelf
        if (s.value === 'Cancelled' && !o.restocked) { restock(o.items); o.restocked = true; }
        store.set('orders', all); toast('Order marked ' + s.value);
      }));
      return;
    }

    /* ---- returns ---- */
    if (tab === 'returns') {
      const orders = allOrders();
      const rows = orders.flatMap((o) => (o.returns || []).map((r) => ({ o, r })));
      const elig = orders.filter((o) => ['Dispatched', 'Delivered', 'Returned', 'Exchanged'].includes(o.status));
      const pick = elig.find((o) => o.id === arg) || elig[0];
      const reasons = {}; rows.forEach(({ r }) => { reasons[r.reason] = (reasons[r.reason] || 0) + 1; });
      const delivered = orders.filter((o) => ['Delivered', 'Returned', 'Exchanged'].includes(o.status)).length;
      app.innerHTML = shell(`<div class="kpis"><div><span class="mono mute">${ic('swap')}Returns logged</span><b class="num">${rows.length}</b></div><div><span class="mono mute">${ic('box')}Pairs restocked</span><b class="num">${rows.filter(({ r }) => r.restock).reduce((a, { r }) => a + (+r.qty || 1), 0)}</b></div><div><span class="mono mute">${ic('clock')}Return rate</span><b class="num">${delivered ? Math.round(new Set(rows.map(({ o }) => o.id)).size / delivered * 100) : 0}%</b></div><div><span class="mono mute">${ic('tag')}Top reason</span><b>${esc(Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0] || 'None')}</b></div></div>
        <div class="adm-two" style="margin-top:30px"><form id="rtF" class="adm-form" novalidate><h3 class="adm-h">Log a return or exchange</h3>${elig.length ? `
          <div class="f"><label>Order</label><select class="select" id="rtO">${elig.map((o) => `<option value="${esc(o.id)}" ${pick && o.id === pick.id ? 'selected' : ''}>${esc(o.id)} / ${esc(o.customer.name)} / ${esc(o.status)}</option>`).join('')}</select></div>
          <div class="f"><label>Pair</label><select class="select" id="rtI">${pick.items.map((it, k) => `<option value="${k}">${esc(it.name)}, ${esc(it.color)}, EU ${it.size} x ${it.qty}</option>`).join('')}</select></div>
          <div class="f-row"><div class="f"><label>Reason</label><select class="select" id="rtR">${['Wrong size', 'Defect', 'Not as pictured', 'Changed mind', 'Refused at door', 'Other'].map((x) => `<option>${x}</option>`).join('')}</select></div>
          <div class="f"><label>Outcome</label><select class="select" id="rtA">${['Exchange for another size', 'Refund', 'Store credit', 'Repair'].map((x) => `<option>${x}</option>`).join('')}</select></div></div>
          <div class="f"><label>Note</label><input id="rtN" placeholder="Optional"></div>
          <label class="chk"><input type="checkbox" id="rtS" checked> Put the pair back in stock</label>
          <div class="acts"><button class="btn volt">Log return</button></div>` : '<p class="mute">Returns can be logged once an order is dispatched or delivered.</p>'}</form>
        <div><h3 class="adm-h">Return log</h3>${rows.length ? `<table class="atable"><thead><tr><th>Order</th><th>Pair</th><th>Reason</th><th>Outcome</th><th>When</th></tr></thead><tbody>${rows.map(({ o, r }) => `<tr><td class="mono">${esc(o.id)}</td><td>${esc(r.item)}</td><td>${esc(r.reason)}${r.note ? `<br><span class="mute">${esc(r.note)}</span>` : ''}</td><td>${esc(r.action)}${r.restock ? '<br><span class="volt">Restocked</span>' : ''}</td><td>${prettyAgo(r.at)}</td></tr>`).join('')}</tbody></table>` : '<p class="mute">No returns yet.</p>'}</div></div>`);
      bindShell();
      if (!elig.length) return;
      $('#rtO').addEventListener('change', (e) => EXT.views.admin('returns~' + e.target.value));
      $('#rtF').addEventListener('submit', (e) => {
        e.preventDefault();
        const all = allOrders(); const o = all.find((x) => x.id === $('#rtO').value); const it = o.items[+$('#rtI').value];
        const r = { item: `${it.name}, ${it.color}, EU ${it.size}`, pid: it.pid, color: it.color, size: it.size, qty: it.qty, reason: $('#rtR').value, action: $('#rtA').value, note: $('#rtN').value.trim(), restock: $('#rtS').checked, at: new Date().toISOString() };
        (o.returns = o.returns || []).push(r);
        o.status = /Exchange/.test(r.action) ? 'Exchanged' : 'Returned';
        store.set('orders', all);
        if (r.restock) restock([it]); else toast('Return logged');
        EXT.views.admin('returns');
      });
      return;
    }

    /* ---- reviews ---- */
    if (tab === 'reviews') {
      const R = EXT.reviews; const stars = EXT.stars || ((n) => n + '/5');
      let view = arg || 'pending', tone = 'all';
      const paint = () => {
        const all = R.all();
        const counts = { pending: 0, approved: 0, archived: 0 }; all.forEach((r) => counts[r.status]++);
        let list = all.filter((r) => r.status === view);
        if (tone === 'good') list = list.filter((r) => r.rating >= 4); if (tone === 'bad') list = list.filter((r) => r.rating <= 2);
        $('#rvAdm').innerHTML = `<div class="toolbar"><div class="filters">${['pending', 'approved', 'archived'].map((k) => `<button class="fbtn" data-view="${k}" aria-pressed="${k === view}">${k[0].toUpperCase() + k.slice(1)} (${counts[k]})</button>`).join('')}</div>
          <div class="filters">${[['all', 'All ratings'], ['good', 'Good, 4 to 5'], ['bad', 'Bad, 1 to 2']].map(([k, t]) => `<button class="fbtn" data-tone="${k}" aria-pressed="${k === tone}">${t}</button>`).join('')}</div></div>
          ${list.length ? list.map((r) => { const p = A().prod(r.pid) || cat.find((x) => x.id === r.pid); return `<article class="rv-item adm-rv" data-id="${esc(r.id)}"><div class="rv-h">${stars(r.rating)}<span class="mono mute">${esc(p ? p.name : r.pid)} / ${new Date(r.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            ${r.title ? `<h4>${esc(r.title)}</h4>` : ''}<p>${esc(r.body)}</p>${r.photo ? `<img class="rv-photo" src="${esc(r.photo)}" alt="">` : ''}
            <div class="rv-meta mono"><span>${esc(r.name)}${r.city ? ', ' + esc(r.city) : ''}</span>${r.verified ? '<span class="volt">Verified buyer</span>' : '<span>Not verified</span>'}${r.size ? `<span>EU ${esc(r.size)}</span>` : ''}</div>
            <div class="f"><label>Public reply (optional)</label><textarea data-reply>${esc(r.reply || '')}</textarea></div>
            <div class="acts">${r.status !== 'approved' ? '<button class="btn volt" data-act="approved">Approve and publish</button>' : ''}${r.status !== 'archived' ? '<button class="btn ghost" data-act="archived">Archive</button>' : ''}${r.status !== 'pending' ? '<button class="btn ghost" data-act="pending">Back to queue</button>' : ''}<button class="btn ghost" data-act="reply">Save reply</button><button class="rm" data-act="delete">Delete</button></div></article>`; }).join('') : `<p class="mute">Nothing in ${view}.</p>`}`;
        $$('[data-view]').forEach((b) => b.onclick = () => { view = b.dataset.view; paint(); });
        $$('[data-tone]').forEach((b) => b.onclick = () => { tone = b.dataset.tone; paint(); });
        $$('.adm-rv').forEach((el) => $$('[data-act]', el).forEach((b) => b.onclick = () => {
          const all2 = R.all(); const r = all2.find((x) => x.id === el.dataset.id); if (!r) return;
          const act = b.dataset.act;
          if (act === 'delete') { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Confirm delete'; b.style.color = 'var(--danger)'; return; } R.save(all2.filter((x) => x !== r)); toast('Review deleted'); paint(); return; }
          r.reply = $('[data-reply]', el).value.trim();
          if (act !== 'reply') r.status = act;
          R.save(all2); toast(act === 'approved' ? 'Published on the product page' : act === 'archived' ? 'Archived, hidden from the site' : act === 'reply' ? 'Reply saved' : 'Moved to the queue'); paint();
        }));
      };
      app.innerHTML = shell('<div id="rvAdm"></div>'); bindShell(); paint();
      return;
    }

    /* ---- alert list ---- */
    if (tab === 'audience') {
      const subs = store.get('alerts', []), rs = store.get('restock', []);
      const ch = (k) => subs.filter((s) => s.channels && s.channels[k]).length;
      const csv = 'name,whatsapp,email,whatsapp_ok,email_ok,sms_ok,interests,joined\n' + subs.map((s) => [s.name, s.wa, s.email, s.channels.whatsapp, s.channels.email, s.channels.sms, (s.interests || []).join(' '), s.at].map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\n');
      app.innerHTML = shell(`<div class="kpis"><div><span class="mono mute">Subscribers</span><b>${subs.length}</b></div><div><span class="mono mute">WhatsApp opt in</span><b>${ch('whatsapp')}</b></div><div><span class="mono mute">Email opt in</span><b>${ch('email')}</b></div><div><span class="mono mute">SMS opt in</span><b>${ch('sms')}</b></div></div>
        <div class="adm-two"><div><h3 class="adm-h">Alert list</h3>${subs.length ? `<table class="atable"><thead><tr><th>Name</th><th>WhatsApp</th><th>Email</th><th>Channels</th><th>Lines</th></tr></thead><tbody>${subs.map((s) => `<tr><td>${esc(s.name || '')}</td><td class="mono">${esc(s.wa)}</td><td>${esc(s.email || '')}</td><td class="mono">${['whatsapp', 'email', 'sms'].filter((k) => s.channels[k]).join(', ')}</td><td>${esc((s.interests || []).join(', '))}</td></tr>`).join('')}</tbody></table>` : '<p class="mute">No sign ups on this device yet.</p>'}
          <button class="btn ghost" id="csv" style="margin-top:16px">Copy as CSV</button></div>
        <div><h3 class="adm-h">Restock requests</h3>${rs.length ? `<table class="atable"><tbody>${rs.map((r) => { const p = A().prod(r.pid); return `<tr><td>${esc(p ? p.name : r.pid)}</td><td>${esc(r.vid)}</td><td>EU ${r.size}</td><td class="mono">${esc(r.wa)}</td></tr>`; }).join('')}</tbody></table>` : '<p class="mute">None yet.</p>'}
          <div class="note-box" style="margin-top:20px"><b>Sending broadcasts.</b> WhatsApp promotional messages must go through the WhatsApp Business Platform with pre approved templates, via Meta directly or a provider such as Twilio, 360dialog or WATI. Email works through Klaviyo or Mailchimp. Import this CSV into whichever you choose.</div></div></div>`);
      bindShell();
      $('#csv').addEventListener('click', () => { (navigator.clipboard ? navigator.clipboard.writeText(csv) : Promise.reject()).then(() => toast('CSV copied'), () => toast('Copy blocked here; use the Publish tab in a normal browser')); });
      return;
    }

    /* ---- settings: order line and support contact ---- */
    if (tab === 'settings') {
      const C = Cfg;
      const st = store.get('settings', {}) || {};
      const show = phoneShow;
      app.innerHTML = shell(`<div class="adm-two"><form id="setF" class="adm-form" novalidate><h3 class="adm-h">Order line</h3>
          <p class="mute" style="margin-bottom:16px">The WhatsApp number that receives order confirmations and customer chats. It is only used inside WhatsApp links and is never printed on the storefront.</p>
          <div class="f"><label for="sWa">WhatsApp number</label><div class="f-ic">${ic('whatsapp')}<input id="sWa" inputmode="tel" autocomplete="off" value="${esc(show(C.whatsapp))}" placeholder="+92 3XX XXXXXXX"></div><span class="err"></span></div>
          <div class="f"><label for="sEm">Support email</label><div class="f-ic">${ic('mail')}<input id="sEm" type="email" autocomplete="off" value="${esc(C.supportEmail)}"></div><span class="err"></span></div>
          <div class="acts"><button class="btn volt">Save contact</button><button type="button" class="btn ghost" id="sTest">Test the chat link</button>${st.whatsapp ? '<button type="button" class="btn ghost" id="sClr">Use file default</button>' : ''}</div>
          <p class="mute" style="margin-top:10px;font-size:13px">File default: <span class="mono">${esc(show(C.fileWhatsapp || C.whatsapp))}</span>. For every visitor, set <span class="mono">whatsapp</span> in assets/data.js or in the backend once the store has one.</p></form>
        <form id="ruleF" class="adm-form" novalidate><h3 class="adm-h">Store rules</h3>
          <div class="f-row"><div class="f"><label>Low stock alert at</label><input id="sLow" type="number" min="0" value="${C.lowStockAt}"><small class="mute">pairs left in a size</small></div><div class="f"><label>Free delivery from</label><input id="sFree" type="number" min="1" value="${C.freeDeliveryPairs}"><small class="mute">pairs in one order</small></div></div>
          <div class="f-row"><div class="f"><label>Delivery fee, all of Pakistan (Rs.)</label><input id="sFee" type="number" min="0" value="${C.delivery.fee}"></div><div class="f"><label>Delivery time shown to customers</label><input id="sDays" value="${esc(C.delivery.days)}"></div></div>
          <div class="acts"><button class="btn volt">Save rules</button></div></form></div>`);
      bindShell();
      const norm = C.normPhone;
      $('#sTest').addEventListener('click', () => { const n = norm($('#sWa').value); if (!n) { $('#sWa').closest('.f').querySelector('.err').textContent = 'Enter a Pakistani mobile number, for example +92 305 5125974'; return; } window.open('https://wa.me/' + n, '_blank', 'noopener'); });
      if ($('#sClr')) $('#sClr').addEventListener('click', () => { const s2 = Object.assign({}, store.get('settings', {})); delete s2.whatsapp; delete s2.supportEmail; store.set('settings', s2); toast('Back to the file default. Reloading'); setTimeout(() => location.reload(), 600); });
      $('#setF').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target; $$('.err', f).forEach((x) => { x.textContent = ''; });
        const n = norm($('#sWa').value); const em = $('#sEm').value.trim();
        let ok = true;
        if (!n) { $('#sWa').closest('.f').querySelector('.err').textContent = 'Enter a Pakistani mobile number, for example +92 305 5125974'; ok = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $('#sEm').closest('.f').querySelector('.err').textContent = 'Enter a valid email'; ok = false; }
        if (!ok) return;
        saveSettings({ whatsapp: n, supportEmail: em });
        toast('Settings saved. Reloading'); setTimeout(() => location.reload(), 700);
      });
      $('#ruleF').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings({ lowStockAt: Math.max(0, +$('#sLow').value || 0), freeDeliveryPairs: Math.max(1, +$('#sFree').value || 1), deliveryFee: Math.max(0, +$('#sFee').value || 0), deliveryDays: $('#sDays').value.trim() || C.delivery.days });
        toast('Rules saved. Reloading'); setTimeout(() => location.reload(), 700);
      });
      return;
    }

    /* ---- discounts ---- */
    if (tab === 'discounts') {
      const cps = getCoupons();
      const editing = arg && cps[arg] ? arg : '';
      const c = editing ? cps[editing] : { type: 'percent', value: 10, min: 0, label: '', active: true };
      const state = (code, x) => x.active === false ? ['Paused', ''] : x.expires && new Date(x.expires + 'T23:59:59') < new Date() ? ['Expired', 'bad'] : x.limit && couponUses(code) >= x.limit ? ['Used up', 'bad'] : ['Active', 'volt'];
      app.innerHTML = shell(`<div class="adm-two"><div><h3 class="adm-h">Codes</h3>${Object.keys(cps).length ? `<div style="overflow-x:auto"><table class="atable"><thead><tr><th>Code</th><th>Discount</th><th>Rules</th><th>Used</th><th>Status</th><th></th></tr></thead><tbody>${Object.entries(cps).map(([code, x]) => { const [st, cls] = state(code, x); return `<tr><td><b class="mono">${esc(code)}</b><br><span class="mute">${esc(x.label || '')}</span></td><td>${x.type === 'percent' ? x.value + '%' : fmt(x.value)}</td>
            <td class="mute" style="font-size:12.5px">${[x.min ? 'Min ' + fmt(x.min) : '', x.expires ? 'Until ' + esc(x.expires) : '', x.pids && x.pids.length ? x.pids.length + ' pair' + (x.pids.length > 1 ? 's' : '') + ' only' : 'All pairs', x.phone ? 'Only ' + phoneShow(x.phone) : ''].filter(Boolean).join('<br>')}</td>
            <td class="num">${couponUses(code)}${x.limit ? ' / ' + x.limit : ''}</td><td class="${cls}">${st}</td>
            <td class="acts"><a class="rm" href="${link('admin', 'discounts~' + encodeURIComponent(code))}">Edit</a><button class="rm" data-cpt="${esc(code)}">${x.active === false ? 'Resume' : 'Pause'}</button><button class="rm" data-cpd="${esc(code)}">Delete</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="mute">No codes yet.</p>'}</div>
        <form id="cpF" class="adm-form" novalidate><h3 class="adm-h">${editing ? 'Edit ' + esc(editing) : 'New code'}</h3>
          <div class="f-row"><div class="f"><label>Code</label><input id="cpC" value="${esc(editing)}" placeholder="EIDDROP" style="text-transform:uppercase" ${editing ? 'readonly' : ''}><span class="err"></span></div><div class="f"><label>Shown to the customer as</label><input id="cpL" value="${esc(c.label || '')}" placeholder="Eid drop, 10% off"></div></div>
          <div class="f-row"><div class="f"><label>Type</label><select class="select" id="cpT"><option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Percent off</option><option value="flat" ${c.type === 'flat' ? 'selected' : ''}>Rupees off</option></select></div><div class="f"><label>Amount</label><input id="cpV" type="number" min="1" value="${c.value}"><span class="err"></span></div></div>
          <div class="f-row"><div class="f"><label>Minimum subtotal (Rs.)</label><input id="cpM" type="number" min="0" value="${c.min || 0}"></div><div class="f"><label>Uses allowed</label><input id="cpU" type="number" min="0" value="${c.limit || ''}" placeholder="Unlimited"></div></div>
          <div class="f-row"><div class="f"><label>Valid until</label><input id="cpE" type="date" value="${esc(c.expires || '')}"></div><div class="f"><label>Only for this WhatsApp number</label><input id="cpP" inputmode="tel" value="${c.phone ? esc(phoneShow(c.phone)) : ''}" placeholder="Anyone"><span class="err"></span></div></div>
          <div class="f"><label>Only for these pairs (leave empty for all)</label><div class="pickgrid">${cat.map((p) => `<label class="chk"><input type="checkbox" data-cpp="${esc(p.id)}" ${c.pids && c.pids.includes(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div></div>
          <label class="chk"><input type="checkbox" id="cpA" ${c.active === false ? '' : 'checked'}> Active</label>
          <div class="acts"><button class="btn volt">${editing ? 'Save code' : 'Create code'}</button>${editing ? `<a class="btn ghost" href="${link('admin', 'discounts')}">New code</a>` : ''}</div></form></div>`);
      bindShell();
      $$('[data-cpt]').forEach((b) => b.addEventListener('click', () => { const all = getCoupons(); const x = all[b.dataset.cpt]; x.active = x.active === false; saveCoupons(all); EXT.views.admin('discounts'); }));
      $$('[data-cpd]').forEach((b) => b.addEventListener('click', () => { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Confirm'; return; } const all = getCoupons(); delete all[b.dataset.cpd]; saveCoupons(all); toast('Code deleted'); EXT.views.admin('discounts'); }));
      $('#cpF').addEventListener('submit', (e) => {
        e.preventDefault(); const f = e.target; $$('.err', f).forEach((x) => { x.textContent = ''; });
        const code = $('#cpC').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); const val = +$('#cpV').value; const ph = $('#cpP').value.trim();
        let ok = true;
        if (code.length < 3) { $('#cpC').nextElementSibling.textContent = 'At least 3 letters or numbers'; ok = false; }
        if (!val || val < 1 || ($('#cpT').value === 'percent' && val > 90)) { $('#cpV').nextElementSibling.textContent = 'Enter a sensible amount'; ok = false; }
        if (ph && !Cfg.normPhone(ph)) { $('#cpP').nextElementSibling.textContent = 'Enter a Pakistani mobile number'; ok = false; }
        if (!ok) return;
        const all = getCoupons();
        all[code] = Object.assign({}, all[code] || {}, { type: $('#cpT').value, value: val, min: +$('#cpM').value || 0, label: $('#cpL').value.trim() || ($('#cpT').value === 'percent' ? val + '% off' : 'Rs. ' + val + ' off'), limit: +$('#cpU').value || 0, expires: $('#cpE').value || '', phone: ph ? Cfg.normPhone(ph) : '', pids: $$('[data-cpp]:checked').map((x) => x.dataset.cpp), active: $('#cpA').checked });
        saveCoupons(all); toast(code + ' saved'); EXT.views.admin('discounts');
      });
      return;
    }

    /* ---- offers: sales and the announcement bar ---- */
    if (tab === 'offers') {
      const st = store.get('settings', {}) || {};
      const sales = cat.flatMap((p) => p.variants.filter((v) => v.compareAt && v.compareAt > v.price).map((v) => ({ p, v })));
      app.innerHTML = shell(`<div class="adm-two"><form id="ofF" class="adm-form" novalidate><h3 class="adm-h">Run a sale</h3>
          <p class="mute" style="margin-bottom:14px">Marks pairs down by a percentage. The old price shows struck through on the storefront. No pair goes below its cost plus your minimum profit of ${fmt(Cfg.followUp.minProfit)} (set in Follow ups).</p>
          <div class="f-row"><div class="f"><label>Line</label><select class="select" id="ofL"><option>All lines</option>${Cfg.audiences.map((a) => `<option>${a}</option>`).join('')}<option value="pick">Only the pairs ticked below</option></select></div><div class="f"><label>Percent off</label><input id="ofP" type="number" min="1" max="80" value="10"></div></div>
          <div class="f"><label>Pairs</label><div class="pickgrid">${cat.map((p) => `<label class="chk"><input type="checkbox" data-ofp="${esc(p.id)}"> ${esc(p.name)}</label>`).join('')}</div></div>
          <div class="acts"><button class="btn volt">Apply sale</button><button type="button" class="btn ghost" id="ofEnd">End sale on these</button></div></form>
        <div><h3 class="adm-h">Announcement bar</h3><p class="mute" style="margin-bottom:12px">Shown first in the moving bar at the top of every page.</p>
          <div class="promo" style="margin-bottom:30px"><input id="anT" value="${esc(st.announce || '')}" placeholder="Eid drop: 10% off with code EIDDROP" style="text-transform:none;letter-spacing:0;font-family:var(--body)"><button id="anB">Save</button></div>
          <h3 class="adm-h">On sale now</h3>${sales.length ? `<table class="atable"><thead><tr><th>Pair</th><th>Was</th><th>Now</th><th>Off</th><th>Profit per pair</th></tr></thead><tbody>${sales.map(({ p, v }) => `<tr><td>${esc(p.name)}<br><span class="mute">${esc(v.color)}</span></td><td class="num strike">${fmt(v.compareAt)}</td><td class="num">${fmt(v.price)}</td><td class="volt">${Math.round((1 - v.price / v.compareAt) * 100)}%</td><td class="num ${v.price - costOf(p) < Cfg.followUp.minProfit ? 'bad' : ''}">${costOf(p) ? fmt(v.price - costOf(p)) : 'Set cost'}</td></tr>`).join('')}</tbody></table>` : '<p class="mute">Nothing is on sale.</p>'}</div></div>`);
      bindShell();
      const target = () => { const l = $('#ofL').value; const picked = $$('[data-ofp]:checked').map((x) => x.dataset.ofp); return cat.filter((p) => l === 'All lines' ? true : l === 'pick' ? picked.includes(p.id) : p.audience === l); };
      $('#ofF').addEventListener('submit', (e) => {
        e.preventDefault(); const pct = Math.max(1, Math.min(80, +$('#ofP').value || 0)); let n = 0, held = 0;
        target().forEach((p) => p.variants.forEach((v) => {
          const base = v.compareAt && v.compareAt > v.price ? v.compareAt : v.price;
          let price = round50(base * (1 - pct / 100));
          const floor = floorOf(p); if (costOf(p) && price < floor) { price = Math.ceil(floor / 50) * 50; held++; }
          if (price < base) { v.compareAt = base; v.price = price; n++; }
        }));
        saveCat(`${n} colours marked down${held ? `, ${held} held at the profit floor` : ''}`); EXT.views.admin('offers');
      });
      $('#ofEnd').addEventListener('click', () => { let n = 0; target().forEach((p) => p.variants.forEach((v) => { if (v.compareAt && v.compareAt > v.price) { v.price = v.compareAt; v.compareAt = null; n++; } })); saveCat(n + ' colours back to full price'); EXT.views.admin('offers'); });
      $('#anB').addEventListener('click', () => { saveSettings({ announce: $('#anT').value.trim() }); toast('Announcement saved'); });
      return;
    }

    /* ---- follow ups: visitors who liked pairs and left a WhatsApp number ---- */
    if (tab === 'followups') {
      const F = Cfg.followUp;
      const leads = store.get('leads', []);
      const view = arg || 'all';
      const now = (pid) => { const p = cat.find((x) => x.id === pid); return p ? Math.min(...p.variants.map((v) => v.price)) : null; };
      const info = (l) => {
        const pairs = (l.pids || []).map((x) => { const p = cat.find((y) => y.id === x.pid); return p ? { p, was: x.price, now: now(x.pid) } : null; }).filter(Boolean);
        const last = (l.history || [])[(l.history || []).length - 1];
        const bought = purchasedBy(l.wa);
        const dropped = pairs.some((x) => x.was && x.now < x.was);
        const due = !bought && daysAgo(l.updated || l.at) >= F.remindAfter && (!last || daysAgo(last.at) >= F.remindAfter);
        return { pairs, last, bought, dropped, due };
      };
      const rows = leads.map((l) => ({ l, ...info(l) })).filter((x) => view === 'all' || (view === 'due' && x.due) || (view === 'drop' && x.dropped && !x.bought) || (view === 'bought' && x.bought));
      const pairText = (x) => { const v = x.p.variants.find((y) => y.price === x.now) || x.p.variants[0]; const sizes = x.p.sizes.filter((s) => (v.stock || {})[s] > 0); return `• M.O.R.C. ${x.p.name} (${v.color})\n  ${x.was && x.now < x.was ? `Was ${fmt(x.was)}, now ${fmt(x.now)}` : fmt(x.now)} / retail ${fmt(Cfg.marketRetail)}+\n  ${sizes.length ? 'Sizes in stock: EU ' + sizes.join(', ') : 'Sold out, reply to join the restock list'}\n  ${Cfg.domain}/product.html#${x.p.id}~${v.id}`; };
      const msg = (kind, x, code, pct, until) => {
        const list = (kind === 'drop' ? x.pairs.filter((y) => y.was && y.now < y.was) : x.pairs).map(pairText).join('\n\n');
        const open = 'Assalam o Alaikum! This is M.O.R.C. Supply.';
        if (kind === 'drop') return `${open} Good news: a pair you liked just dropped in price.\n\n${list}\n\nCash on Delivery across Pakistan. Reply here and we will reserve your size.`;
        if (kind === 'offer') return `${open} A code just for you on the pairs you liked: ${code} gives ${pct}% off, valid until ${until}, for this WhatsApp number only.\n\n${list}\n\nEnter ${code} at checkout. Cash on Delivery across Pakistan.`;
        return `${open} You liked these pairs on our site and they are still waiting for you:\n\n${list}\n\nCash on Delivery across Pakistan. Reply here with your size and city to order.`;
      };
      app.innerHTML = shell(`<form id="fuF" class="rules"><h3 class="adm-h">Follow up rules</h3>
          <div class="rules-g"><div class="f"><label>Largest discount you allow</label><div class="f-ic">${ic('ticket')}<input id="fuMax" type="number" min="0" max="60" value="${F.maxDiscount}"></div><small class="mute">percent</small></div>
          <div class="f"><label>Minimum profit per pair</label><div class="f-ic">${ic('cash')}<input id="fuMin" type="number" min="0" value="${F.minProfit}"></div><small class="mute">Rs., above vendor, kit and delivery cost</small></div>
          <div class="f"><label>Personal codes last</label><div class="f-ic">${ic('clock')}<input id="fuDays" type="number" min="1" max="60" value="${F.codeDays}"></div><small class="mute">days</small></div>
          <div class="f"><label>Remind after</label><div class="f-ic">${ic('spark')}<input id="fuRem" type="number" min="1" max="60" value="${F.remindAfter}"></div><small class="mute">days without a purchase</small></div></div>
          <label class="chk"><input type="checkbox" id="fuDrop" ${F.priceDrop ? 'checked' : ''}> Flag leads whose liked pairs dropped in price</label>
          <label class="chk"><input type="checkbox" id="fuAsk" ${F.askWhatsapp ? 'checked' : ''}> Ask visitors with liked pairs for their WhatsApp number when they leave</label>
          <div class="acts"><button class="btn volt">Save rules</button></div></form>
        <div class="filters" style="margin:30px 0 16px">${[['all', 'All leads'], ['due', 'Due a reminder'], ['drop', 'Price dropped'], ['bought', 'Purchased']].map(([k, t]) => `<a class="fbtn" href="${link('admin', 'followups~' + k)}" aria-pressed="${k === view}">${t}</a>`).join('')}</div>
        ${rows.length ? `<div class="leads">${rows.map((x) => `<div class="leadc" data-lead="${esc(x.l.id)}">
          <div class="lc-h"><b class="mono">${esc(phoneShow(x.l.wa))}</b><span class="mute">liked ${x.pairs.length} pair${x.pairs.length === 1 ? '' : 's'}, ${prettyAgo(x.l.updated || x.l.at)}</span>${x.bought ? '<span class="chip v">Purchased</span>' : x.due ? '<span class="chip">Due</span>' : ''}${x.dropped && F.priceDrop ? '<span class="chip v">Price dropped</span>' : ''}</div>
          <div class="lc-p">${x.pairs.map((y) => `<span><span class="th">${visual(y.p, y.p.variants[0])}</span><b>${esc(y.p.name)}</b><span class="mute">${y.was && y.now < y.was ? `<s>${fmt(y.was)}</s> ` : ''}${fmt(y.now)}</span></span>`).join('')}</div>
          <div class="lc-a"><button class="btn ghost" data-send="remind">${ic('whatsapp')}Reminder</button>${x.dropped ? `<button class="btn ghost" data-send="drop">${ic('tag')}Price drop</button>` : ''}<span class="lc-off"><input type="number" min="1" max="${F.maxDiscount}" value="${F.maxDiscount}" aria-label="Percent off"><span>%</span><button class="btn volt" data-send="offer">${ic('ticket')}Send a code</button></span></div>
          ${x.last ? `<p class="mute lc-last">Last message: ${esc(x.last.type)}${x.last.code ? ' / ' + esc(x.last.code) : ''}, ${prettyAgo(x.last.at)}</p>` : ''}</div>`).join('')}</div>` : `<p class="mute">${leads.length ? 'Nobody in this list.' : 'No leads yet. When a visitor likes pairs and leaves their WhatsApp number, they appear here.'}</p>`}
        <p class="form-note" style="margin-top:20px">Messages open in WhatsApp with the pair names, prices, sizes in stock and links ready to send. WhatsApp shows each link with the product photo once the store is live with photos. Automatic sending without opening WhatsApp needs the WhatsApp Business Platform, described in README.md.</p>`);
      bindShell();
      $('#fuF').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings({ followUp: { maxDiscount: Math.max(0, Math.min(60, +$('#fuMax').value || 0)), minProfit: Math.max(0, +$('#fuMin').value || 0), codeDays: Math.max(1, +$('#fuDays').value || 7), remindAfter: Math.max(1, +$('#fuRem').value || 2), priceDrop: $('#fuDrop').checked, askWhatsapp: $('#fuAsk').checked } });
        Object.assign(F, (store.get('settings', {}) || {}).followUp); toast('Rules saved'); EXT.views.admin('followups~' + view);
      });
      $$('[data-send]').forEach((b) => b.addEventListener('click', () => {
        const card = b.closest('[data-lead]'); const all = store.get('leads', []); const l = all.find((y) => y.id === card.dataset.lead); const x = info(l);
        let text, code = '', kind = b.dataset.send;
        if (kind === 'offer') {
          let pct = Math.min(F.maxDiscount, Math.max(1, +card.querySelector('.lc-off input').value || 0));
          // never below cost plus the minimum profit on any of the liked pairs
          const cap = Math.min(...x.pairs.map((y) => costOf(y.p) ? Math.floor((1 - floorOf(y.p) / y.now) * 100) : F.maxDiscount));
          if (cap < 1) { toast('These pairs have no room for a discount at your profit floor'); return; }
          if (pct > cap) { pct = cap; toast('Code held at ' + cap + '% to protect your profit floor'); }
          const until = new Date(Date.now() + F.codeDays * 864e5).toISOString().slice(0, 10);
          code = 'MORC' + l.wa.slice(-4) + Math.random().toString(36).slice(2, 5).toUpperCase();
          const cps = getCoupons();
          cps[code] = { type: 'percent', value: pct, min: 0, label: 'Your personal code, ' + pct + '% off', pids: x.pairs.map((y) => y.p.id), phone: l.wa, expires: until, limit: 1, active: true, lead: l.id };
          saveCoupons(cps);
          text = msg('offer', x, code, pct, until);
        } else text = msg(kind, x);
        (l.history = l.history || []).push({ type: { remind: 'Reminder', drop: 'Price drop', offer: 'Personal code' }[kind], code, at: new Date().toISOString() });
        store.set('leads', all);
        window.open('https://wa.me/' + l.wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        setTimeout(() => EXT.views.admin('followups~' + view), 300);
      }));
      return;
    }

    /* ---- publish / export ---- */
    if (tab === 'export') {
      const src = `window.MORC_PRODUCTS = ${JSON.stringify(cat, null, 2)};\n`;
      app.innerHTML = shell(`<div class="adm-two"><div><h3 class="adm-h">Catalog file</h3><p class="mute" style="margin-bottom:12px">Replace the window.MORC_PRODUCTS block at the bottom of assets/data.js with this, then re-upload the site. Every visitor then sees your changes.</p>
        <textarea class="code" id="src" readonly>${esc(src)}</textarea><div class="acts"><button class="btn volt" id="cp">Copy</button><a class="btn ghost" id="dl" download="catalog.js">Download</a></div></div>
        <div><h3 class="adm-h">Reset</h3><p class="mute" style="margin-bottom:12px">Discard the edits saved in this browser and return to the catalog in data.js.</p><button class="btn ghost" id="reset">Reset to file catalog</button></div></div>`);
      bindShell();
      try { $('#dl').href = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); } catch (e) { /* blocked */ }
      $('#cp').addEventListener('click', () => { (navigator.clipboard ? navigator.clipboard.writeText(src) : Promise.reject()).then(() => toast('Copied'), () => { $('#src').select(); toast('Select all and copy'); }); });
      $('#reset').addEventListener('click', (e) => { if (!e.target.dataset.armed) { e.target.dataset.armed = 1; e.target.textContent = 'Confirm reset'; return; } try { localStorage.removeItem('morc.catalog'); } catch (er) { /* blocked */ } toast('Reset. Reloading'); setTimeout(() => location.reload(), 600); });
      return;
    }
    EXT.views.admin('overview');
  };
})();
