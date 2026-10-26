/* DAUR liked pair follow ups. When a visitor has liked pairs, has not
   ordered on this device and is about to leave, a small sheet asks for a
   WhatsApp number so the team can message them about those pairs only:
   a reminder, a price drop, or a personal code made in Admin > Follow ups.
   Leads are kept in this browser until a backend stores them centrally. */
(function () {
  'use strict';
  const A = () => window.DAUR_API;
  const EXT = window.DAUR_EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  EXT.hooks = EXT.hooks || {};
  const on = (name, fn) => { (EXT.hooks[name] = EXT.hooks[name] || []).push(fn); };
  const ic = (n) => (window.DAUR_ICON ? window.DAUR_ICON(n) : '');
  const QUIET = ['checkout', 'order', 'admin'];
  let page = '', armed = false, shown = false, timer = 0;

  const L = {
    all() { return A().store.get('leads', []); },
    mine() { return A().store.get('myLead', ''); },
    liked() {
      const { store } = A(); const meta = store.get('wishMeta', {});
      return A().wish.map((pid) => ({ pid, price: meta[pid] ? meta[pid].price : null, at: meta[pid] ? meta[pid].at : null }));
    },
    save(wa, extra) {
      const { store } = A(); const list = L.all(); const now = new Date().toISOString();
      let lead = list.find((x) => x.wa === wa);
      if (!lead) { lead = { id: 'L' + Date.now().toString(36), wa, at: now, consent: true, history: [], source: extra && extra.source || 'liked' }; list.unshift(lead); }
      lead.pids = L.liked(); lead.updated = now; if (extra && extra.name) lead.name = extra.name;
      store.set('leads', list); store.set('myLead', wa);
      return lead;
    },
    sync() { const wa = L.mine(); if (wa) L.save(wa); } // more likes later stay attached to the same number
  };
  EXT.leads = L;

  const wanted = () => {
    const { store, C, wish } = A();
    if (!wish.length || L.mine() || QUIET.includes(page)) return false;
    if (C.followUp && C.followUp.askWhatsapp === false) return false;
    if (store.get('orders', []).length) return false;
    const last = store.get('leadAsk', 0); return Date.now() - last > 3 * 864e5;
  };

  function sheet(reason) {
    if (shown || !wanted()) return;
    shown = true;
    const { store, esc, fmt, prod, visual, wish, C, toast } = A();
    store.set('leadAsk', Date.now());
    const ps = wish.map(prod).filter(Boolean);
    let el = document.getElementById('leadSheet');
    if (!el) { document.body.insertAdjacentHTML('beforeend', '<div class="lead-wrap" id="leadSheet" role="dialog" aria-modal="true" aria-label="Get updates on your liked pairs"></div>'); el = document.getElementById('leadSheet'); }
    el.innerHTML = `<form class="lead" novalidate>
      <button type="button" class="lead-x" data-close aria-label="Close">${ic('close')}</button>
      <div class="lead-pairs">${ps.slice(0, 3).map((p) => `<span class="lp">${visual(p, p.variants[0])}</span>`).join('')}</div>
      <span class="eyebrow">${reason === 'exit' ? 'Before you go' : 'You have taste'}</span>
      <h3>Keep an eye on the ${ps.length === 1 ? 'pair' : ps.length + ' pairs'} you liked.</h3>
      <p>Leave your WhatsApp number and we will message you only about ${ps.length === 1 ? esc(ps[0].name) : 'these pairs'}: if the price drops, if your size runs low, or if we can offer you a code. From ${fmt(Math.min(...ps.map((p) => Math.min(...p.variants.map((v) => v.price)))))}.</p>
      <div class="f"><div class="f-ic">${ic('whatsapp')}<input name="wa" inputmode="tel" autocomplete="tel" placeholder="03XX XXXXXXX" aria-label="WhatsApp number"></div><span class="err"></span></div>
      <label class="chk"><input type="checkbox" name="ok" checked> Message me on WhatsApp about these pairs. Reply STOP any time.</label>
      <div class="lead-acts"><button class="btn volt pill-add">${ic('bolt')}<span>Keep me posted</span></button><button type="button" class="btn ghost" data-close>Not now</button></div>
    </form>`;
    requestAnimationFrame(() => el.classList.add('on'));
    const close = () => { el.classList.remove('on'); };
    el.onclick = (e) => { if (e.target === el || e.target.closest('[data-close]')) close(); };
    const f = el.querySelector('form');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const wa = C.normPhone(f.wa.value);
      if (!wa) { f.querySelector('.err').textContent = 'Enter a Pakistani mobile number, for example 0300 1234567.'; return; }
      if (!f.ok.checked) { f.querySelector('.err').textContent = 'Tick the box so we are allowed to message you.'; return; }
      L.save(wa, { source: reason });
      f.innerHTML = `<div class="lead-done">${ic('check')}<h3>Done. We are watching them for you.</h3><p>You will hear from DAUR Supply on WhatsApp about your liked pairs only.</p><button type="button" class="btn ghost" data-close>Keep browsing</button></div>`;
      toast('WhatsApp updates on for your liked pairs');
    });
    setTimeout(() => { const i = f.querySelector('input[name="wa"]'); if (i && matchMedia('(pointer: fine)').matches) i.focus(); }, 300);
  }

  function arm() {
    if (armed) return; armed = true;
    // computers: the pointer heading for the tab bar or the close button
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget && e.clientY <= 4) sheet('exit'); });
    // phones: coming back to the tab after leaving it
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 4000) sheet('exit'); });
  }

  on('liked', ({ count }) => {
    L.sync(); arm();
    // on touch screens, a gentle ask a little after the second like
    clearTimeout(timer);
    if (count >= 2 && !matchMedia('(pointer: fine)').matches) timer = setTimeout(() => sheet('liked'), 2500);
  });
  on('after', ({ page: pg }) => {
    page = pg; if (A().wish.length) arm();
    if (pg !== 'wishlist') return;
    const { $, wish, C, toast } = A();
    const host = document.querySelector('#app > div.wrap'); // the list itself, not the page title block if (!host || !wish.length) return;
    const mine = L.mine();
    host.insertAdjacentHTML('afterbegin', `<form class="lead-inline" novalidate>${ic('whatsapp')}<div><b>${mine ? 'WhatsApp updates are on for these pairs.' : 'Get a WhatsApp message if these drop in price.'}</b><span>${mine ? 'Linked to +' + mine.replace(/^(\d{2})(\d{3})/, '$1 $2 ') + '. New likes are added automatically.' : 'Only about the pairs you liked. Reply STOP any time.'}</span></div>${mine ? '' : '<input name="wa" inputmode="tel" placeholder="03XX XXXXXXX" aria-label="WhatsApp number"><button class="btn volt">Notify me</button>'}</form>`);
    const f = $('.lead-inline');
    if (!mine) f.addEventListener('submit', (e) => { e.preventDefault(); const wa = C.normPhone(f.wa.value); if (!wa) { toast('Enter a Pakistani mobile number'); return; } L.save(wa, { source: 'liked page' }); A().route ? A().route() : location.reload(); toast('WhatsApp updates on for your liked pairs'); });
    void wish;
  });
})();
