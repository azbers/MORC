/* DAUR social layer: reviews with moderation, star ratings, story rail,
   the vertical Feed, the shareable value flex card and the fit check wall.
   Reviews start as "pending" and only appear once approved in admin.html. */
(function () {
  'use strict';
  // a short confirmation card that closes itself after five seconds
  function notice(title, body) {
    let n = document.getElementById('notice');
    if (!n) { document.body.insertAdjacentHTML('beforeend', '<div class="notice" id="notice" role="status" aria-live="polite"></div>'); n = document.getElementById('notice'); }
    const ic = (k) => (window.DAUR_ICON ? window.DAUR_ICON(k) : '');
    n.innerHTML = `<span class="nt-i">${ic('check')}</span><div><b></b><p></p></div><button class="nt-x" aria-label="Close">${ic('close')}</button><i class="nt-bar"></i>`;
    n.querySelector('b').textContent = title; n.querySelector('p').textContent = body;
    const hide = () => { n.classList.remove('on'); clearTimeout(n._t); };
    n.querySelector('.nt-x').onclick = hide;
    n.classList.remove('on'); void n.offsetWidth; n.classList.add('on');
    clearTimeout(n._t); n._t = setTimeout(hide, 5000);
  }
  const A = () => window.DAUR_API;
  const EXT = window.DAUR_EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  EXT.hooks = EXT.hooks || {};
  const on = (name, fn) => { (EXT.hooks[name] = EXT.hooks[name] || []).push(fn); };

  /* ---------------- reviews data ---------------- */
  // On Shopify, approved Fit notes come from the store (Content > Metaobjects > Fit note, Status Approved)
  const FIT = { 'Runs small': 'small', 'True to size': 'true', 'Runs large': 'large' };
  const slug = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const SERVER = (window.DAUR_FITNOTES || []).map((n) => ({ id: 'fn-' + n.id, pid: n.pid, vid: n.colour ? slug(n.colour) : '', rating: Math.max(1, Math.min(5, +n.rating || 5)), title: n.title || '', body: n.body || '', name: n.name || '', city: n.city || '', size: n.size || '', fit: FIT[n.fit] || '', photo: n.photo || '', verified: !!n.verified, status: 'approved', helpful: 0, at: n.date || '' }));
  const R = {
    all() { const ids = new Set(SERVER.map((r) => r.id)); return SERVER.concat(A().store.get('reviews', []).filter((r) => !ids.has(r.id))); },
    save(list) { A().store.set('reviews', list.filter((r) => !String(r.id).startsWith('fn-'))); },
    approved(pid) { return R.all().filter((r) => r.status === 'approved' && (!pid || r.pid === pid)); },
    stats(pid) {
      const list = R.approved(pid);
      const n = list.length;
      const avg = n ? list.reduce((a, r) => a + r.rating, 0) / n : 0;
      const dist = [5, 4, 3, 2, 1].map((s) => list.filter((r) => r.rating === s).length);
      const fit = { small: 0, true: 0, large: 0 };
      list.forEach((r) => { if (fit[r.fit] != null) fit[r.fit]++; });
      return { n, avg, dist, fit, list };
    }
  };
  EXT.reviews = R;

  // a drawn heart: rounded lobes and a soft point, filled with the deep red gradient
  const HP = 'M12 20.6c-.3 0-.6-.1-.8-.3C6.9 16.6 3.2 13.4 3.2 9.2 3.2 6.4 5.4 4.2 8 4.2c1.6 0 3 .8 4 2.1 1-1.3 2.4-2.1 4-2.1 2.6 0 4.8 2.2 4.8 5 0 4.2-3.7 7.4-8 11.1-.2.2-.5.3-.8.3z';
  const hsvg = (cls) => `<svg class="hs-i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${HP}"/></svg>`;
  const h5 = (cls) => hsvg(cls).repeat(5);
  function stars(r, cls) {
    const w = Math.max(0, Math.min(100, r / 5 * 100));
    return `<span class="stars hearts ${cls || ''}" role="img" aria-label="${r.toFixed(1)} out of 5"><span class="s-bg">${h5('e')}</span><span class="s-fg" style="width:${w}%">${h5('f')}</span></span>`;
  }
  EXT.stars = stars;

  /* ---------------- hearts: Instagram style ratings, likes and celebrations ----------------
     Hearts are a deep blood red (--daur-heart): ratings, likes and celebrations. */
  const CALM = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HEART = {
    css() {
      if (document.getElementById('daur-hearts-css')) return;
      const st = document.createElement('style'); st.id = 'daur-hearts-css';
      st.textContent = `
:root{--daur-heart:#9B0F1E;--daur-heart-2:#D0283B;--daur-heart-3:#5E0712;--daur-heart-rgb:155,15,30}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--daur-heart:#C81E33;--daur-heart-2:#EE4A5E;--daur-heart-3:#8E0F1F;--daur-heart-rgb:215,38,61}}
:root[data-theme="dark"]{--daur-heart:#C81E33;--daur-heart-2:#EE4A5E;--daur-heart-3:#8E0F1F;--daur-heart-rgb:215,38,61}
.stars.hearts{display:inline-flex;letter-spacing:0;font-size:13px;vertical-align:middle}
.stars.hearts.lg{font-size:19px}
.stars.hearts .s-bg,.stars.hearts .s-fg{display:flex;gap:.18em;white-space:nowrap}
.stars.hearts .s-fg{position:absolute;inset:0 auto 0 0;overflow:hidden}
.hs-i{width:1.05em;height:1.05em;flex:none;display:inline-block;vertical-align:-.15em;overflow:visible}
.hs-i path{fill:url(#daur-heart-g);stroke:none}
.hs-i.e path{fill:none;stroke:var(--line-2);stroke-width:1.5}
.hs-i.f{filter:drop-shadow(0 1px 1px rgba(var(--daur-heart-rgb),.25))}
.hz{width:11px;height:11px;margin-left:2px}
.filters .hz{width:10px;height:10px;vertical-align:-1px}
.rv-dist .minibar i,.rv-fit .fit-track i{background:var(--daur-heart)}
.rv-avg .big{color:var(--daur-heart)}
.star-pick{gap:6px}
.star-pick button{width:38px;height:38px;padding:4px;color:var(--line-2);transition:transform .2s;background:none;border:0;cursor:pointer;position:relative}
.star-pick button .hs-i{width:100%;height:100%}
.star-pick button .hs-i path{fill:none;stroke:var(--line-2);stroke-width:1.4;transition:fill .2s,stroke .2s}
.star-pick button.on .hs-i path{fill:url(#daur-heart-g);stroke:var(--daur-heart)}
.star-pick button.on .hs-i{filter:drop-shadow(0 3px 8px rgba(var(--daur-heart-rgb),.35))}
.star-pick button:hover{transform:scale(1.12)}
.star-pick button.pop,.like.pop .lk-h{animation:hpop .55s cubic-bezier(.2,1.6,.4,1)}
@keyframes hpop{0%{transform:scale(1)}25%{transform:scale(.7)}60%{transform:scale(1.35)}100%{transform:scale(1)}}
.like{display:inline-flex;align-items:center;gap:6px;font:400 11px/1 var(--mono);letter-spacing:.1em;color:var(--dim);background:none;border:1px solid var(--line);border-radius:999px;padding:6px 11px;cursor:pointer;position:relative;transition:border-color .2s,color .2s}
.like .lk-h{display:inline-flex;width:16px;height:16px}
.like .lk-h .hs-i{width:16px;height:16px}
.like .lk-h path{fill:none;stroke:currentColor;stroke-width:1.7}
.like:hover{color:var(--daur-heart);border-color:var(--daur-heart)}
.like.on{color:var(--daur-heart);border-color:rgba(var(--daur-heart-rgb),.5);background:rgba(var(--daur-heart-rgb),.08)}
.like.on .lk-h path{fill:url(#daur-heart-g);stroke:var(--daur-heart)}
.rv-item{position:relative;user-select:none;-webkit-user-select:none}
.rv-item p,.rv-item h4{user-select:text;-webkit-user-select:text}
.hp,.hbig,.hrain{display:block}
.hp .hs-i,.hbig .hs-i,.hrain .hs-i{width:100%;height:100%;display:block}
.hp{position:fixed;left:0;top:0;pointer-events:none;z-index:9999;width:1em;height:1em;font-size:13px;line-height:1;will-change:transform,opacity;animation:hfly .8s ease-out forwards}
@keyframes hfly{0%{opacity:1;transform:translate(var(--x0),var(--y0)) scale(.6)}100%{opacity:0;transform:translate(var(--x1),var(--y1)) scale(1.1) rotate(var(--r))}}
.hbig{position:fixed;left:0;top:0;pointer-events:none;z-index:9999;width:96px;height:96px;filter:drop-shadow(0 8px 22px rgba(var(--daur-heart-rgb),.45));animation:hbig .9s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes hbig{0%{opacity:0;transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.2)}20%{opacity:1;transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1.15)}35%{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.95)}60%{opacity:1;transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) translate(-50%,-90%) scale(1)}}
.hrain{position:fixed;top:-40px;pointer-events:none;z-index:9999;width:1em;height:1em;animation:hrain linear forwards}
@keyframes hrain{to{transform:translate(var(--dx),110vh) rotate(var(--r));opacity:.2}}
@media (prefers-reduced-motion:reduce){.star-pick button.pop,.like.pop .lk-h{animation:none}}
`;
      document.head.appendChild(st);
      // one shared gradient for every heart: a lit top lobe into a deep blood red point
      const add = () => { if (document.getElementById('daur-heart-defs')) return; document.body.insertAdjacentHTML('afterbegin', '<svg id="daur-heart-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="daur-heart-g" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" style="stop-color:var(--daur-heart-2)"/><stop offset=".55" style="stop-color:var(--daur-heart)"/><stop offset="1" style="stop-color:var(--daur-heart-3)"/></linearGradient></defs></svg>'); };
      if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
    },
    // a small burst of hearts from an element
    burst(el, n) {
      if (CALM() || !el) return;
      const b = el.getBoundingClientRect(); const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      for (let i = 0; i < n; i++) {
        const h = document.createElement('i'); h.className = 'hp'; h.innerHTML = hsvg('f');
        const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 34;
        h.style.cssText = `--x0:${cx}px;--y0:${cy}px;--x1:${cx + Math.cos(a) * d}px;--y1:${cy + Math.sin(a) * d - 14}px;--r:${(Math.random() * 60 - 30) | 0}deg;font-size:${9 + Math.random() * 9}px;opacity:${0.6 + Math.random() * 0.4}`;
        document.body.appendChild(h); setTimeout(() => h.remove(), 850);
      }
    },
    // the big heart that pops where a note is double tapped
    big(at) {
      if (CALM()) return;
      const h = document.createElement('i'); h.className = 'hbig'; h.innerHTML = hsvg('f g');
      h.style.cssText = `--x:${at.x}px;--y:${at.y}px`;
      document.body.appendChild(h); setTimeout(() => h.remove(), 950);
      HEART.burst({ getBoundingClientRect: () => ({ left: at.x, top: at.y, width: 0, height: 0 }) }, 12);
    },
    // celebration: a short shower of red hearts when a fit note is sent
    party() {
      if (CALM()) return;
      const w = window.innerWidth;
      for (let i = 0; i < 42; i++) {
        const h = document.createElement('i'); h.className = 'hrain'; h.innerHTML = hsvg('f');
        const dur = 1.6 + Math.random() * 1.4;
        h.style.cssText = `left:${Math.random() * w}px;font-size:${12 + Math.random() * 22}px;--dx:${(Math.random() * 120 - 60) | 0}px;--r:${(Math.random() * 360 - 180) | 0}deg;animation-duration:${dur}s;animation-delay:${Math.random() * 0.5}s;opacity:${0.55 + Math.random() * 0.45};`;
        document.body.appendChild(h); setTimeout(() => h.remove(), (dur + 0.6) * 1000);
      }
    }
  };
  EXT.hearts = HEART;
  if (document.head) HEART.css(); else document.addEventListener('DOMContentLoaded', () => HEART.css());
  EXT.cardExtra = function (p) {
    const s = R.stats(p.id);
    return s.n ? `<div class="card-rate">${stars(s.avg)}<span class="mono">${s.avg.toFixed(1)} (${s.n})</span></div>` : '';
  };

  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = rej; img.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }

  /* ---------------- product page reviews ---------------- */
  on('pdp', ({ p, v }) => {
    const { $, $$, esc, head, toast, store } = A();
    const box = $('#ext-reviews'); if (!box) return;
    let filter = 'all', sort = 'new';
    const s = R.stats(p.id);
    const card = $('#ext-rvcard');
    if (card) {
      const top = s.list.slice().sort((x, y) => (y.helpful || 0) - (x.helpful || 0) || y.rating - x.rating).slice(0, 2);
      const ago = (t) => { const d = Math.max(0, Math.round((Date.now() - new Date(t)) / 864e5)); return d < 1 ? 'Today' : d < 14 ? d + ' day' + (d > 1 ? 's' : '') + ' ago' : d < 60 ? Math.round(d / 7) + ' weeks ago' : Math.round(d / 30) + ' months ago'; };
      card.innerHTML = `<div class="rvcard">${s.n ? `<div class="rvc-h">${stars(s.avg)}<b>${s.avg.toFixed(1)}</b><span>${s.n} fit note${s.n > 1 ? 's' : ''}</span><a href="#reviews" data-jump="reviews">See all</a></div>
        ${top.map((r) => `<div class="rvc-r"><p>${esc(r.body)}</p><span class="rvc-m"><b>${esc(r.name)}</b>${r.verified ? `<span class="ok">${window.DAUR_ICON ? window.DAUR_ICON('check') : ''}Verified purchase</span>` : ''}<span>${ago(r.at)}</span></span></div>`).join('')}`
        : `<div class="rvc-h"><span>Fresh off the bench. Wearing this pair?</span><a href="#reviews" data-jump="reviews">Leave the first fit note</a></div>`}</div>`;
    }
    const fitTotal = s.fit.small + s.fit.true + s.fit.large;
    const fitPos = fitTotal ? ((s.fit.large - s.fit.small) / fitTotal) * 50 + 50 : 50;
    box.innerHTML = `<section class="sheet x" id="reviews"><div class="wrap">
      ${head('Fit notes', s.n ? 'What wearers say.' : 'Fresh off the bench.', `<button class="btn ghost" id="wrBtn">Leave a fit note</button>`)}
      <div class="rv-grid">
        <div class="rv-sum">
          ${s.n ? `<div class="rv-avg"><span class="big num">${s.avg.toFixed(1)}</span><div>${stars(s.avg, 'lg')}<span class="mono mute">${s.n} fit note${s.n > 1 ? 's' : ''}</span></div></div>
          <div class="rv-dist">${s.dist.map((c, i) => `<button class="rv-row" data-f="${5 - i}"><span class="mono">${5 - i} ${hsvg('f hz')}</span><span class="minibar"><i style="width:${s.n ? c / s.n * 100 : 0}%"></i></span><span class="mono mute num">${c}</span></button>`).join('')}</div>
          <div class="rv-fit"><span class="mono mute">Fit</span><div class="fit-track"><i style="left:${fitPos}%"></i></div><div class="fit-l mono"><span>Runs small</span><span>True to size</span><span>Runs large</span></div></div>`
          : `<p class="mute">This pair has just landed, so its first fit notes are still to come. Wearing it? Tell us how it fits, how it feels after a full day, and add a photo if you like. A real person on our team reads every note before it goes live, good or bad.</p>`}
        </div>
        <div class="rv-list">
          <form class="rv-form" id="rvForm" hidden novalidate></form>
          ${s.n ? `<div class="toolbar" style="margin:0"><div class="filters">${[['all', 'All'], ['5', '5 ' + hsvg('f hz')], ['4', '4 ' + hsvg('f hz')], ['crit', 'Critical'], ['photo', 'With photos']].map(([k, t]) => `<button class="fbtn" data-rf="${k}" aria-pressed="${k === 'all'}">${t}</button>`).join('')}</div>
            <select class="select" id="rvSort" aria-label="Sort reviews"><option value="new">Newest</option><option value="high">Highest rated</option><option value="low">Lowest rated</option><option value="help">Most helpful</option></select></div>` : ''}
          <div id="rvItems"></div>
        </div>
      </div></div></section>`;
    function paintList() {
      let list = R.approved(p.id);
      if (filter === 'crit') list = list.filter((r) => r.rating <= 2);
      else if (filter === 'photo') list = list.filter((r) => r.photo);
      else if (filter !== 'all') list = list.filter((r) => r.rating === +filter);
      const S = { new: (a, b) => b.at.localeCompare(a.at), high: (a, b) => b.rating - a.rating, low: (a, b) => a.rating - b.rating, help: (a, b) => (b.helpful || 0) - (a.helpful || 0) };
      list.sort(S[sort]);
      const voted = store.get('voted', []);
      $('#rvItems').innerHTML = list.map((r) => `<article class="rv-item" data-rv="${r.id}">
        <div class="rv-h">${stars(r.rating)}<span class="mono mute">${new Date(r.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        ${r.title ? `<h4>${esc(r.title)}</h4>` : ''}<p>${esc(r.body)}</p>
        ${r.photo ? `<img class="rv-photo" src="${esc(r.photo)}" alt="Photo from ${esc(r.name)}">` : ''}
        <div class="rv-meta mono"><span>${esc(r.name)}${r.city ? ', ' + esc(r.city) : ''}</span>${r.verified ? '<span class="volt">Verified buyer</span>' : ''}${r.size ? `<span>EU ${esc(r.size)}</span>` : ''}${r.fit ? `<span>${{ small: 'Runs small', true: 'True to size', large: 'Runs large' }[r.fit]}</span>` : ''}
          <button class="like${voted.includes(r.id) ? ' on' : ''}" data-help="${r.id}" aria-pressed="${voted.includes(r.id)}" aria-label="Helpful"><span class="lk-h">${hsvg('lk')}</span><span class="num">${r.helpful || 0}</span></button></div>
        ${r.reply ? `<div class="rv-reply"><span class="mono volt">DAUR replied</span><p>${esc(r.reply)}</p></div>` : ''}
      </article>`).join('') || (s.n ? '<p class="mute">No fit notes match this filter.</p>' : '');
      // Instagram style like: tap the heart, or double tap the note itself
      const like = (id, at) => {
        if (store.get('voted', []).includes(id)) { if (at) HEART.big(at); return; }
        const all = R.all(); const r = all.find((x) => x.id === id); if (!r) return;
        r.helpful = (r.helpful || 0) + 1; R.save(all); store.set('voted', store.get('voted', []).concat(r.id));
        const b = $(`[data-help="${CSS.escape(id)}"]`);
        if (b) { b.classList.add('on', 'pop'); b.setAttribute('aria-pressed', 'true'); $('.num', b).textContent = r.helpful; HEART.burst(b, 10); setTimeout(() => b.classList.remove('pop'), 600); }
        if (at) HEART.big(at);
      };
      $$('[data-help]').forEach((b) => b.addEventListener('click', () => like(b.dataset.help)));
      $$('[data-rv]').forEach((el) => {
        let last = 0;
        el.addEventListener('mousedown', (e) => { if (e.detail > 1) e.preventDefault(); }); // a double tap likes, it does not select text
        el.addEventListener('pointerup', (e) => { if (e.target.closest('button,a')) return; const t = Date.now(); if (t - last < 320) { like(el.dataset.rv, { el, x: e.clientX, y: e.clientY }); last = 0; } else last = t; });
      });
    }
    $$('[data-rf], .rv-row').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.rf || b.dataset.f; $$('[data-rf]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.rf === filter)); paintList(); }));
    const so = $('#rvSort'); if (so) so.addEventListener('change', () => { sort = so.value; paintList(); });
    paintList();

    $('#wrBtn').addEventListener('click', () => {
      const f = $('#rvForm');
      if (!f.hidden) { f.hidden = true; return; }
      let rating = 0, photo = '';
      f.hidden = false;
      f.innerHTML = `<div class="f"><label>Your rating</label><div class="star-pick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-st="${n}" role="radio" aria-checked="false" aria-label="${n} heart${n > 1 ? 's' : ''}">${hsvg('pk')}</button>`).join('')}</div><span class="err"></span></div>
        <div class="f"><label for="rvTitle">Headline</label><input id="rvTitle" maxlength="80" placeholder="Sum it up in a line"></div>
        <div class="f"><label for="rvBody">Your review</label><textarea id="rvBody" maxlength="1200" placeholder="Comfort, stitching, sizing, how the leather breaks in"></textarea><span class="err"></span></div>
        <div class="f-row"><div class="f"><label for="rvName">Name</label><input id="rvName" maxlength="40" autocomplete="given-name"><span class="err"></span></div><div class="f"><label for="rvCity">City</label><input id="rvCity" maxlength="40" autocomplete="address-level2"></div></div>
        <div class="f-row"><div class="f"><label for="rvSize">Size bought</label><select id="rvSize"><option value="">Select</option>${p.sizes.map((x) => `<option>${x}</option>`).join('')}</select></div>
          <div class="f"><label for="rvFit">Fit</label><select id="rvFit"><option value="">Select</option><option value="small">Runs small</option><option value="true">True to size</option><option value="large">Runs large</option></select></div></div>
        <div class="f"><label for="rvEmail">Email (optional, never shown)</label><input id="rvEmail" type="email" maxlength="80" autocomplete="email" placeholder="So the team can reply or verify your order"><span class="err"></span></div>
        <div class="f-row"><div class="f"><label for="rvOrder">Order number (optional)</label><input id="rvOrder" placeholder="DAUR-XXXXXXX"></div>
          <div class="f"><label for="rvPhoto">Fit check photo (optional)</label><input id="rvPhoto" type="file" accept="image/*" style="padding-top:13px"></div></div>
        <button class="btn volt" type="submit">Submit for approval</button>
        <p class="form-note">Reviews go live after the DAUR team reads them. We publish critical reviews too.</p>`;
      $$('[data-st]', f).forEach((b) => b.addEventListener('click', () => { rating = +b.dataset.st; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); HEART.burst(b, 4 + rating * 2); $$('[data-st]', f).forEach((x) => { x.classList.toggle('on', +x.dataset.st <= rating); x.setAttribute('aria-checked', +x.dataset.st === rating); }); }));
      $('#rvPhoto').addEventListener('change', async (e) => { const fl = e.target.files[0]; if (!fl) return; try { photo = await resizeImage(fl, 900); toast('Photo attached'); } catch (er) { toast('That image could not be read'); } });
      f.onsubmit = (e) => {
        e.preventDefault();
        const err = (el, m) => { const w = el.closest('.f'); w.classList.toggle('bad', !!m); $('.err', w).textContent = m || ''; return !m; };
        const ok = [err($('.star-pick', f), rating ? '' : 'Tap the hearts to rate.'), err($('#rvBody'), $('#rvBody').value.trim().length < 10 ? 'Write at least a sentence.' : ''), err($('#rvName'), $('#rvName').value.trim() ? '' : 'Add your name.'), err($('#rvEmail'), !$('#rvEmail').value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#rvEmail').value.trim()) ? '' : 'Check the email address.')].every(Boolean);
        if (!ok) return;
        const oid = $('#rvOrder').value.trim().toUpperCase();
        const verified = !!oid && store.get('orders', []).some((o) => o.id === oid && o.items.some((i) => i.pid === p.id));
        const all = R.all();
        all.unshift({ id: 'r' + Date.now().toString(36), pid: p.id, vid: v.id, rating, title: $('#rvTitle').value.trim(), body: $('#rvBody').value.trim(), name: $('#rvName').value.trim(), city: $('#rvCity').value.trim(), size: $('#rvSize').value, fit: $('#rvFit').value, photo, order: oid, email: $('#rvEmail').value.trim(), verified, status: 'pending', helpful: 0, at: new Date().toISOString() });
        R.save(all);
        f.innerHTML = '<p class="form-note ok">Received. Your review is in the approval queue and goes live once the team has read it.</p>';
        HEART.party();
        notice('Thank you, your review is in.', 'The team reads every review before it goes live. Yours will appear on this pair once it is approved.');
      };
      f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // value flex share button
    const share = $('#shareB');
    if (share && !$('#flexB')) {
      share.insertAdjacentHTML('afterend', `<button class="act flexact" id="flexB">${window.DAUR_ICON ? window.DAUR_ICON('bolt') : ''}<span>Share as a picture</span></button>`);
      $('#flexB').addEventListener('click', () => flexCard(p, v));
    }
  });

  /* ---------------- value flex card ---------------- */
  function flexCard(p, v) {
    const { C, fmt, visual, toast } = A();
    let m = document.getElementById('flexModal');
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="flexModal" role="dialog" aria-label="Value flex card"><div class="panel flex-panel"></div></div>'); m = document.getElementById('flexModal'); m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on'); }); }
    // the typical retail comparison is a store setting; when it is off the card only names money really saved (a sale cut)
    const ra = !(C.sell && C.sell.retailAnchor === false);
    const cut = v.compareAt && v.compareAt > v.price ? v.compareAt - v.price : 0;
    const saved = ra ? C.marketRetail - v.price : cut;
    const days = C.sell && C.sell.perWear > 0 ? C.sell.perWear : 0;
    const perWear = days ? 'About ' + fmt(Math.round(v.price / (days * 52))) + ' a wear' : '';
    const panel = m.querySelector('.panel');
    panel.innerHTML = `<div class="field-label"><span>Value flex / story size</span><button class="x-btn" data-close>Close</button></div><canvas id="flexCv" width="1080" height="1920" style="width:100%;max-height:62vh;object-fit:contain;background:#080808"></canvas>
      <div class="flex-how" id="flexHow" hidden></div>
      <a class="btn volt block wa-send" id="flexWa" target="_blank" rel="noopener">${window.DAUR_ICON ? window.DAUR_ICON('whatsapp') : ''}Send on WhatsApp</a>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><a class="btn ghost" id="flexDl" download="daur-value-flex.png">Save image</a><button class="btn ghost" id="flexCap">Copy caption</button></div>
      <p class="form-note">On a phone, Send on WhatsApp attaches the card with the caption and pair details. On a computer, WhatsApp does not let any website attach a picture, so the card is copied for you to paste.</p>`;
    m.classList.add('on');
    const cv = panel.querySelector('#flexCv'), x = cv.getContext('2d');
    const draw = (img) => {
      x.fillStyle = '#080808'; x.fillRect(0, 0, 1080, 1920);
      x.strokeStyle = 'rgba(237,235,228,.07)'; x.lineWidth = 2;
      for (let i = 0; i <= 1080; i += 135) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1920); x.stroke(); }
      for (let i = 0; i <= 1920; i += 135) { x.beginPath(); x.moveTo(0, i); x.lineTo(1080, i); x.stroke(); }
      x.fillStyle = '#EDEBE4'; x.font = '500 30px "JetBrains Mono", monospace'; x.fillText('DAUR SUPPLY / VALUE FLEX', 80, 140);
      x.fillStyle = '#CCFF00'; x.fillText('+', 1000, 140);
      if (saved > 0) {
        x.fillStyle = '#EDEBE4'; x.font = '500 150px "Space Grotesk", sans-serif'; x.fillText('I SAVED', 74, 420);
        x.fillStyle = '#CCFF00'; x.font = '700 190px "Space Grotesk", sans-serif'; x.fillText(fmt(saved).replace('Rs. ', 'Rs.'), 70, 620);
        x.fillStyle = '#EDEBE4'; x.font = '500 96px "Space Grotesk", sans-serif'; x.fillText(ra ? 'on full grain.' : 'on the sale.', 74, 760);
      } else {
        x.fillStyle = '#EDEBE4'; x.font = '500 150px "Space Grotesk", sans-serif'; x.fillText('NAYA DAUR.', 74, 420);
        x.fillStyle = '#CCFF00'; x.font = '700 150px "Space Grotesk", sans-serif'; x.fillText('MY PAIR.', 70, 600);
        x.fillStyle = '#EDEBE4'; x.font = '500 96px "Space Grotesk", sans-serif'; x.fillText('Checked by hand.', 74, 760);
      }
      if (img) x.drawImage(img, 40, 830, 1000, 593);
      x.fillStyle = '#8b8a83'; x.font = '400 34px "JetBrains Mono", monospace';
      x.fillText(('DAUR ' + p.name + ' / ' + v.color).toUpperCase(), 80, 1520);
      x.fillStyle = '#EDEBE4'; x.font = '500 64px "Space Grotesk", sans-serif'; x.fillText(fmt(v.price), 80, 1610);
      const right = ra ? 'Retail ' + fmt(C.marketRetail) + '+' : cut ? 'Was ' + fmt(v.compareAt) : perWear;
      if (right) {
        x.fillStyle = '#5d5c57'; x.font = '400 50px "Space Grotesk", sans-serif'; x.fillText(right, 520, 1610);
        if (ra || cut) { const w = Math.min(480, x.measureText(right).width); x.strokeStyle = '#5d5c57'; x.lineWidth = 3; x.beginPath(); x.moveTo(520, 1593); x.lineTo(520 + w, 1593); x.stroke(); }
      }
      x.fillStyle = '#EDEBE4'; x.font = '400 30px "JetBrains Mono", monospace'; x.fillText('BRANDED, NOT LABELED. CRAFTED IN PAKISTAN.', 80, 1790);
      x.fillStyle = '#CCFF00'; x.fillText(C.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''), 80, 1840);
      try { panel.querySelector('#flexDl').href = cv.toDataURL('image/png'); } catch (e) { /* tainted */ }
    };
    draw(null);
    const svg = visual(p, v).replace('<svg ', '<svg width="1000" height="593" ');
    const img = new Image();
    img.onload = () => draw(img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const { stockOf, onSale } = A();
    const sizes = p.sizes.filter((sz) => (v.stock || {})[sz] > 0);
    const url = A().absLink ? A().absLink('product', p.id + '~' + v.id) : C.domain + '/product.html#' + p.id + '~' + v.id;
    const details = [`DAUR ${p.name} / ${v.color}`, `Price: ${fmt(v.price)}${onSale(v) ? ` (was ${fmt(v.compareAt)})` : ''}`, ra ? `Typical retail: ${fmt(C.marketRetail)}+` : '', ra ? `Saved ${fmt(saved)} against typical retail.` : cut ? `Saved ${fmt(cut)} on the sale.` : perWear ? perWear + ', worn ' + days + ' days a week for a year.' : '', p.description ? p.description.split('.')[0] + '.' : '', sizes.length ? `Sizes in stock: EU ${sizes.join(', ')}` : (stockOf(v) ? '' : 'Sold out right now'), 'Cash on Delivery across Pakistan.', url].filter(Boolean).join('\n');
    // the card is turned into a file as soon as it is drawn, so a tap can share it straight away
    let file = null, blob = null;
    const pack = () => cv.toBlob((b) => { if (b) { blob = b; file = new File([b], 'daur-value-flex.png', { type: 'image/png' }); } }, 'image/png');
    pack(); img.addEventListener('load', () => setTimeout(pack, 50));
    const wa = panel.querySelector('#flexWa');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(details);
    wa.addEventListener('click', (ev) => {
      // phones: the share sheet sends the image and the caption together, WhatsApp included
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        ev.preventDefault();
        navigator.share({ files: [file], text: details, title: 'DAUR ' + p.name }).catch((er) => {
          if (er && er.name === 'AbortError') return;
          window.open(wa.href, '_blank', 'noopener'); guide(false);
        });
        return;
      }
      // computers: the link itself opens WhatsApp with the caption; the card goes to the clipboard for pasting
      let copied = false;
      try {
        if (navigator.clipboard && window.ClipboardItem && blob) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => guide(true), () => guide(false));
        else guide(false);
        copied = true;
      } catch (er) { if (!copied) guide(false); }
    });
    function guide(copied) {
      if (blob && !panel.querySelector('.flex-img')) {
        const im = document.createElement('img'); im.src = URL.createObjectURL(blob); im.alt = 'Value flex card'; im.className = 'flex-img'; cv.replaceWith(im);
      }
      const how = panel.querySelector('#flexHow');
      how.innerHTML = `<b>${copied ? 'The card is copied.' : 'One step first: right click the card above and choose Copy image.'}</b><ol><li>Pick the chat in the WhatsApp tab that just opened.</li><li>Press Ctrl+V (Cmd+V on Mac) in the message box. The card attaches with the caption already typed.</li><li>Press Send.</li></ol>`;
      how.hidden = false; how.scrollIntoView({ block: 'nearest' });
    }
    panel.querySelector('#flexCap').addEventListener('click', () => {
      const t = details + '\n@daursupply #DAURsupply #ValueFlex';
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Caption copied'), () => toast(t));
    });
  }
  EXT.flexCard = flexCard;

  /* ---------------- stories ---------------- */
  function storySets() {
    const { P, C, fmt, onSale, pct } = A();
    const men = P.filter((p) => p.audience === 'Men').slice(0, 4);
    const sale = P.flatMap((p) => p.variants.filter(onSale).map((v) => [p, v]));
    const fresh = P.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    const sets = [
      { id: 'drop01', label: 'The line', cover: men[0], slides: men.map((p) => ({ p, v: p.variants[0], kicker: 'The line / ' + p.category, title: p.name, sub: p.variants[0].color + ' / ' + fmt(p.variants[0].price) })) },
      C.sell && C.sell.retailAnchor === false ? null : { id: 'flex', label: 'Value flex', text: 'Rs', icon: 'cash', slides: [{ big: fmt(C.marketRetail) + '+', kicker: 'Typical retail', title: 'For a comparable pair.', strike: true }, { big: fmt(men[0].variants[0].price), kicker: 'DAUR price', title: 'Full grain. Checked by hand.', volt: true }, { big: fmt(C.marketRetail - men[0].variants[0].price), kicker: 'The difference', title: 'Spend it on the fit.' }] },
      { id: 'unbox', label: 'Unboxing', text: 'Box', icon: 'box', slides: [{ kit: 'box', kicker: 'Unboxing / 01', title: 'Matte black corrugated box.' }, { kit: 'tissue', kicker: 'Unboxing / 02', title: 'Grid tissue. First tear.' }, { kit: 'card', kicker: 'Unboxing / 03', title: 'The manifest card.' }, { kit: 'hw', kicker: 'Unboxing / 04', title: 'Dubrae and the Supply Unit seal.' }] },
      { id: 'qa', label: 'QA table', text: 'QA', icon: 'shield', slides: [['Chosen', 'Picked at the bench, pair by pair.'], ['Checked', 'Stitch, grain, bond, comfort. Most never make it.'], ['Re-laced', 'Matte cotton laces. Engraved dubrae.'], ['Sealed', 'Dubrae, seal, tissue, card, box.'], ['Dispatched', 'Confirmed, then out in 24 hours.']].map(([t, s], i) => ({ kicker: 'QA / step 0' + (i + 1), title: t, sub: s, big: '0' + (i + 1) })) }
    ];
    for (let k = sets.length - 1; k >= 0; k--) if (!sets[k]) sets.splice(k, 1); // a story switched off by a store setting
    if (sale.length) sets.splice(1, 0, { id: 'cuts', label: 'Price cuts', cover: sale[0][0], coverV: sale[0][1], slides: sale.map(([p, v]) => ({ p, v, kicker: 'Price cut / ' + pct(v) + '% off', title: p.name, sub: fmt(v.price) + ' / was ' + fmt(v.compareAt) })) });
    sets.push({ id: 'new', label: 'New in', cover: fresh[0], slides: fresh.map((p) => ({ p, v: p.variants[0], kicker: 'New in / ' + p.audience + (p.group ? ' / ' + p.group : ''), title: p.name, sub: fmt(p.variants[0].price) })) });
    // every product published in the last 7 days gets a status of its own: each colour, with up to 3 photos per colour
    const age = (d) => (Date.now() - new Date(d + 'T00:00:00').getTime()) / 864e5;
    const added = P.filter((p) => p.createdAt && age(p.createdAt) <= 7).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
    const own = added.map((p) => ({ id: 'p-' + p.id + '-' + p.createdAt, label: 'Just landed', cover: p,
      slides: p.variants.flatMap((v) => {
        const base = { p, v, kicker: 'Just landed / ' + v.color, title: p.name, sub: fmt(v.price) + (v.compareAt ? ' / was ' + fmt(v.compareAt) : '') };
        return v.images.length ? v.images.slice(0, 3).map((img) => Object.assign({ img }, base)) : [base];
      }) }));
    // statuses written in Shopify as posts in the "status" blog: shown for 14 days, or until removed when tagged pin
    const posts = (window.DAUR_STATUSES || []).filter((a) => (a.tags || []).some((t) => /^pin$/i.test(t)) || age(a.date) <= 14);
    const linkOf = (a) => { const t = (a.tags || []).find((x) => /^link:/i.test(x)); return t ? t.slice(5).trim() : null; };
    const latest = posts.length ? [{ id: 'st-' + posts.map((a) => a.id).join('-'), label: 'Latest', img: (posts.find((a) => a.image) || {}).image, text: 'New', icon: 'bag',
      slides: posts.map((a) => ({ img: a.image, kicker: 'DAUR Supply / ' + a.date, title: a.title, sub: a.text, href: linkOf(a), big: a.image ? null : 'DAUR' })) }] : [];
    return latest.concat(own, sets);
  }
  const KIT = {
    box: '<div class="box3d"><div class="lid"><b>DAUR</b></div><div class="side"></div><div class="side2"></div></div>',
    tissue: '<div class="tissue"></div>',
    card: '<div class="mcard"><b>DAUR</b><p>This pair came from the same benches the big labels use. You paid for leather, labour and a fair margin. Nothing else.</p><i>MANIFEST / DROP 01</i></div>',
    hw: '<div class="hw"><div class="dubrae">DAUR</div><div class="ziptag"><div class="strap"></div><div class="plate">DAUR<br>SUPPLY UNIT</div></div></div>'
  };
  on('after', ({ page }) => {
    if (page !== 'home') return;
    const { $, $$, visual, store, esc } = A();
    const slot = $('#ext-stories'); if (!slot) return;
    const sets = storySets();
    const seen = store.get('seen', []);
    slot.innerHTML = `<div class="stories wrap" aria-label="Stories">${sets.map((s, i) => `<button class="story ${seen.includes(s.id) ? 'seen' : ''}" data-set="${i}"><span class="ring-o"><span class="ring-i">${s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy">` : s.cover ? visual(s.cover, s.coverV || s.cover.variants[0]) : (s.icon && window.DAUR_ICON ? `<i class="st-ic">${window.DAUR_ICON(s.icon)}</i>` : `<b>${s.text}</b>`)}</span></span><span class="mono">${s.label}</span></button>`).join('')}</div>`;
    $$('[data-set]', slot).forEach((b) => b.addEventListener('click', () => openStories(sets, +b.dataset.set)));
    // fit wall
    const wall = $('#ext-fitwall');
    if (wall) {
      const fits = R.approved().filter((r) => r.photo).slice(0, 8);
      wall.innerHTML = `<section class="sheet x"><div class="wrap">${A().head('Fit check wall', fits.length ? 'Worn by the network.' : 'Your fit. Our wall.', `<a class="link" href="${A().link('feed')}">Open the feed</a>`, fits.length ? '' : 'Post a review with a photo of your pair on foot. Approved fit checks are featured here and on our Instagram with credit.')}
        ${fits.length ? `<div class="fitwall">${fits.map((r) => { const p = A().prod(r.pid); return `<a class="fit" href="${A().link('product', r.pid)}"><img src="${esc(r.photo)}" alt="Fit check by ${A().esc(r.name)}" loading="lazy"><span class="fit-o">${stars(r.rating)}<b>${A().esc(r.name)}</b><span class="mono">${p ? A().esc(p.name) : ''}</span></span></a>`; }).join('')}</div>`
        : `<div class="fitwall empty-wall">${['#DAURsupply', '@daursupply', 'Fit check', 'Tag us'].map((t) => `<div class="fit ph"><span class="mono">${t}</span></div>`).join('')}</div>`}
      </div></section>`;
    }
  });
  function openStories(sets, si) {
    const { visual, link, store, esc } = A();
    let el = document.getElementById('storyView');
    if (!el) { document.body.insertAdjacentHTML('beforeend', '<div class="sv" id="storyView" role="dialog" aria-label="Stories"></div>'); el = document.getElementById('storyView'); }
    let i = 0, timer = null, t0 = 0, elapsed = 0, paused = false;
    const DUR = 5200;
    const markSeen = () => { const s = store.get('seen', []); if (!s.includes(sets[si].id)) { s.push(sets[si].id); store.set('seen', s); } };
    function slideHTML(sl) {
      let art = '';
      if (sl.img) art = `<div class="sv-art photo"><img src="${esc(sl.img)}" alt="${esc(sl.title || '')}"></div>`;
      else if (sl.p) art = `<div class="sv-art float">${visual(sl.p, sl.v)}</div>`;
      else if (sl.kit) art = `<div class="sv-art kit-art">${KIT[sl.kit]}</div>`;
      else if (sl.big) art = `<div class="sv-big ${sl.volt ? 'volt' : ''} ${sl.strike ? 'strike' : ''}">${esc(sl.big)}</div>`;
      return `${art}<div class="sv-copy"><span class="mono volt">${esc(sl.kicker || '')}</span><h3>${esc(sl.title || '')}</h3>${sl.sub ? `<p class="mono">${esc(sl.sub)}</p>` : ''}${sl.p ? `<a class="btn volt" href="${link('product', sl.p.id + '~' + sl.v.id)}">Shop this pair <span class="arr">&rarr;</span></a>` : sl.href ? `<a class="btn volt" href="${esc(sl.href)}">Take a look <span class="arr">&rarr;</span></a>` : ''}</div>`;
    }
    function paint() {
      const set = sets[si], sl = set.slides[i];
      markSeen();
      el.innerHTML = `<div class="sv-frame"><div class="sv-bars">${set.slides.map((_, k) => `<span><i style="width:${k < i ? 100 : 0}%"></i></span>`).join('')}</div>
        <div class="sv-top"><span class="sv-av">D</span><b>daursupply</b><span class="mono mute">${esc(set.label)}</span><button class="x-btn" data-x aria-label="Close stories">Close</button></div>
        <div class="sv-body">${slideHTML(sl)}</div>
        <button class="sv-tap l" data-prev aria-label="Previous"></button><button class="sv-tap r" data-next aria-label="Next"></button></div>`;
      el.querySelector('[data-x]').onclick = close;
      el.onclick = (e) => { if (e.target === el) close(); }; // a tap outside the story closes it
      el.querySelector('[data-prev]').onclick = prev;
      el.querySelector('[data-next]').onclick = next;
      const fr = el.querySelector('.sv-frame');
      fr.onpointerdown = () => { paused = true; elapsed += performance.now() - t0; };
      fr.onpointerup = fr.onpointerleave = () => { if (paused) { paused = false; t0 = performance.now(); } };
      elapsed = 0; t0 = performance.now(); paused = false;
    }
    function tick() {
      if (!el.classList.contains('on')) return;
      const set = sets[si];
      const run = paused ? elapsed : elapsed + performance.now() - t0;
      const bar = el.querySelectorAll('.sv-bars i')[i];
      if (bar) bar.style.width = Math.min(100, run / DUR * 100) + '%';
      if (run >= DUR) next(); else timer = requestAnimationFrame(tick);
      void set;
    }
    function next() { cancelAnimationFrame(timer); if (i < sets[si].slides.length - 1) i++; else if (si < sets.length - 1) { si++; i = 0; } else { close(); return; } paint(); timer = requestAnimationFrame(tick); }
    function prev() { cancelAnimationFrame(timer); if (i > 0) i--; else if (si > 0) { si--; i = sets[si].slides.length - 1; } paint(); timer = requestAnimationFrame(tick); }
    function close() { cancelAnimationFrame(timer); el.classList.remove('on'); document.removeEventListener('keydown', key); $$story().forEach((b) => { if (A().store.get('seen', []).includes(sets[+b.dataset.set].id)) b.classList.add('seen'); }); }
    const $$story = () => [...document.querySelectorAll('[data-set]')];
    function key(e) { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    el.classList.add('on'); paint(); timer = requestAnimationFrame(tick);
  }

  /* ---------------- the feed ---------------- */
  EXT.views.feed = function () {
    const { P, C, $, $$, esc, fmt, visual, link, setMeta, store, onSale, pct, toggleWish, addToCart, toast } = A();
    setMeta('The Feed | DAUR Supply', 'New pairs, price cuts and the story behind DAUR Supply, one swipe at a time.');
    const I = (n, c) => (window.DAUR_ICON ? window.DAUR_ICON(n, c) : '');
    const reels = [];
    P.forEach((p, k) => {
      const v = p.variants.find(onSale) || p.variants[0];
      reels.push({ p, v });
      if (k === 1) reels.push({ text: ['Full grain leather.', 'Checked by hand.', 'Signed DAUR.', 'Paid on delivery.'] });
      if (k === 4) reels.push({ text: ['No loud logo.', 'Just the craft.', 'Branded, not labeled.', 'Naya daur.'] });
    });
    document.getElementById('app').innerHTML = `<h1 class="sr-only">The DAUR Supply feed: new pairs and price cuts</h1><div class="feed" id="feed">${reels.map((r, i) => r.text
      ? `<section class="reel txt"><div class="reel-in">${r.text.map((t, j) => `<p class="${j % 2 ? 'volt' : ''}" style="animation-delay:${j * .25}s">${esc(t)}</p>`).join('')}<span class="mono mute">Swipe up</span></div></section>`
      : `<section class="reel" data-i="${i}" style="--glow:${esc(r.v.hex || '#333')}"><a class="reel-stage${r.v.images && r.v.images.length ? ' photo' : ''}" href="${link('product', r.p.id + '~' + r.v.id)}" aria-label="Open ${esc(r.p.name)} in ${esc(r.v.color)}">${r.v.images && r.v.images.length
        // a photo keeps its own background, so it sits in one calm square frame of fixed size instead of filling the reel
        ? `<div class="layer rn"><span class="reel-photo"><img class="rp-bg" src="${esc(r.v.images[0])}" alt="" aria-hidden="true" loading="lazy" decoding="async">${visual(r.p, r.v)}</span></div>`
        : `<div class="layer rn float">${visual(r.p, r.v)}</div><div class="layer scan">${visual(r.p, r.v, { mode: 'blueprint' })}</div>`}<span class="reel-peek mono">View the pair <span class="arr">&rarr;</span></span></a>
        <div class="reel-cap"><span class="mono"><b>@daursupply</b> / ${esc(r.p.audience)}${r.p.group ? ' / ' + esc(r.p.group) : ''}</span>
          <h2>${esc(r.p.name)}</h2><p>${esc(r.v.color)}${r.p.description ? '. ' + esc(r.p.description.split('.')[0]) + '.' : ''}</p>
          <span class="mono mute">#DAURsupply #${esc(r.p.category)} #ValueFlex</span>
          <div class="reel-price"><b>${fmt(r.v.price)}</b>${onSale(r.v) ? `<span class="strike mono">${fmt(r.v.compareAt)}</span><span class="chip v">&minus;${pct(r.v)}%</span>` : C.sell && C.sell.retailAnchor === false ? (C.sell.perWear > 0 ? `<span class="mono">About ${fmt(Math.round(r.v.price / (C.sell.perWear * 52)))} a wear</span>` : '') : `<span class="strike mono">${fmt(C.marketRetail)}+ retail</span>`}</div>
          <a class="btn volt" href="${link('product', r.p.id + '~' + r.v.id)}">Shop now <span class="arr">&rarr;</span></a></div>
        <div class="reel-act">
          <button class="ra like" data-like="${r.p.id}" aria-pressed="${A().wish.includes(r.p.id)}" aria-label="Like"><span class="ra-i">${I('heart', 'o')}${I('heartFill', 'f')}</span><small>${A().wish.includes(r.p.id) ? 'Liked' : 'Like'}</small></button>
          <button class="ra flex" data-flex="${i}" aria-label="Make a value flex card"><span class="ra-i">${I('bolt')}</span><small>Flex</small></button>
        </div></section>`).join('')}</div>`;
    const burst = (host, x, y) => {
      for (let k = 0; k < 7; k++) {
        const h = document.createElement('i'); h.className = 'lv-float'; h.innerHTML = I('heartFill');
        h.style.left = x + 'px'; h.style.top = y + 'px';
        h.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
        h.style.setProperty('--s', (0.6 + Math.random() * 0.8).toFixed(2));
        h.style.animationDelay = (k * 0.05) + 's';
        host.appendChild(h); setTimeout(() => h.remove(), 1500);
      }
    };
    const setLike = (b, on) => {
      const id = b.dataset.like; const has = A().wish.includes(id);
      if (on === has) return;
      toggleWish(id);
      b.setAttribute('aria-pressed', !has); b.querySelector('small').textContent = has ? 'Like' : 'Liked';
      if (!has) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); const r = b.getBoundingClientRect(); const sec = b.closest('.reel'); const sr = sec.getBoundingClientRect(); burst(sec, r.left - sr.left + r.width / 2, r.top - sr.top + 20); }
    };
    $$('[data-like]').forEach((b) => b.addEventListener('click', () => setLike(b, b.getAttribute('aria-pressed') !== 'true')));
    // double tap a reel to love it, like the apps
    $$('.reel[data-i]').forEach((sec) => {
      let last = 0;
      sec.addEventListener('pointerup', (e) => {
        if (e.target.closest('a:not(.reel-stage),button')) return;
        const now = Date.now();
        if (now - last < 320) {
          const sr = sec.getBoundingClientRect(); const x = e.clientX - sr.left; const y = e.clientY - sr.top;
          const big = document.createElement('i'); big.className = 'lv-big'; big.innerHTML = I('heartFill'); big.style.left = x + 'px'; big.style.top = y + 'px';
          sec.appendChild(big); setTimeout(() => big.remove(), 900); burst(sec, x, y);
          setLike($('[data-like]', sec), true); last = 0;
        } else last = now;
      });
    });
    // one tap on the pair opens its page; a second tap within the double tap window keeps it a like instead
    $$('.reel-stage').forEach((a) => {
      let wait = 0;
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        if (wait) { clearTimeout(wait); wait = 0; return; }
        wait = setTimeout(() => { wait = 0; location.href = a.href; }, 330);
      });
    });
    $$('[data-flex]').forEach((b) => b.addEventListener('click', () => { const r = reels[+b.dataset.flex]; flexCard(r.p, r.v); }));
    void addToCart;
  };

  /* order confirmation: flex card for the first item */
  on('after', ({ page, param }) => {
    if (page !== 'order') return;
    const { store, prod, $ } = A();
    const o = store.get('orders', []).find((x) => x.id === param); if (!o) return;
    const it = o.items[0]; const p = prod(it.pid); if (!p) return;
    const v = p.variants.find((x) => x.color === it.color) || p.variants[0];
    const row = document.querySelector('.confirm .main > div[style*="flex"]');
    if (row) { row.insertAdjacentHTML('beforeend', '<button class="btn ghost" id="oFlex">Share the value flex</button>'); $('#oFlex').addEventListener('click', () => flexCard(p, v)); }
  });
})();
