/* M.O.R.C. social layer: reviews with moderation, star ratings, story rail,
   the vertical Feed, the shareable value flex card and the fit check wall.
   Reviews start as "pending" and only appear once approved in admin.html. */
(function () {
  'use strict';
  // a short confirmation card that closes itself after five seconds
  function notice(title, body) {
    let n = document.getElementById('notice');
    if (!n) { document.body.insertAdjacentHTML('beforeend', '<div class="notice" id="notice" role="status" aria-live="polite"></div>'); n = document.getElementById('notice'); }
    const ic = (k) => (window.MORC_ICON ? window.MORC_ICON(k) : '');
    n.innerHTML = `<span class="nt-i">${ic('check')}</span><div><b></b><p></p></div><button class="nt-x" aria-label="Close">${ic('close')}</button><i class="nt-bar"></i>`;
    n.querySelector('b').textContent = title; n.querySelector('p').textContent = body;
    const hide = () => { n.classList.remove('on'); clearTimeout(n._t); };
    n.querySelector('.nt-x').onclick = hide;
    n.classList.remove('on'); void n.offsetWidth; n.classList.add('on');
    clearTimeout(n._t); n._t = setTimeout(hide, 5000);
  }
  const A = () => window.MORC_API;
  const EXT = window.MORC_EXT = window.MORC_EXT || { views: {}, hooks: {} };
  EXT.hooks = EXT.hooks || {};
  const on = (name, fn) => { (EXT.hooks[name] = EXT.hooks[name] || []).push(fn); };

  /* ---------------- reviews data ---------------- */
  const R = {
    all() { return A().store.get('reviews', []); },
    save(list) { A().store.set('reviews', list); },
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

  function stars(r, cls) {
    const w = Math.max(0, Math.min(100, r / 5 * 100));
    return `<span class="stars ${cls || ''}" role="img" aria-label="${r.toFixed(1)} out of 5"><span class="s-bg">★★★★★</span><span class="s-fg" style="width:${w}%">★★★★★</span></span>`;
  }
  EXT.stars = stars;
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
        ${top.map((r) => `<div class="rvc-r"><p>${esc(r.body)}</p><span class="rvc-m"><b>${esc(r.name)}</b>${r.verified ? `<span class="ok">${window.MORC_ICON ? window.MORC_ICON('check') : ''}Verified purchase</span>` : ''}<span>${ago(r.at)}</span></span></div>`).join('')}`
        : `<div class="rvc-h"><span>Fresh off the bench. Wearing this pair?</span><a href="#reviews" data-jump="reviews">Leave the first fit note</a></div>`}</div>`;
    }
    const fitTotal = s.fit.small + s.fit.true + s.fit.large;
    const fitPos = fitTotal ? ((s.fit.large - s.fit.small) / fitTotal) * 50 + 50 : 50;
    box.innerHTML = `<section class="sheet x" id="reviews"><div class="wrap">
      ${head('Fit notes', s.n ? 'What wearers say.' : 'Fresh off the bench.', `<button class="btn ghost" id="wrBtn">Leave a fit note</button>`)}
      <div class="rv-grid">
        <div class="rv-sum">
          ${s.n ? `<div class="rv-avg"><span class="big num">${s.avg.toFixed(1)}</span><div>${stars(s.avg, 'lg')}<span class="mono mute">${s.n} fit note${s.n > 1 ? 's' : ''}</span></div></div>
          <div class="rv-dist">${s.dist.map((c, i) => `<button class="rv-row" data-f="${5 - i}"><span class="mono">${5 - i} ★</span><span class="minibar"><i style="width:${s.n ? c / s.n * 100 : 0}%"></i></span><span class="mono mute num">${c}</span></button>`).join('')}</div>
          <div class="rv-fit"><span class="mono mute">Fit</span><div class="fit-track"><i style="left:${fitPos}%"></i></div><div class="fit-l mono"><span>Runs small</span><span>True to size</span><span>Runs large</span></div></div>`
          : `<p class="mute">This pair has just landed, so its first fit notes are still to come. Wearing it? Tell us how it fits, how it feels after a full day, and add a photo if you like. A real person on our team reads every note before it goes live, good or bad.</p>`}
        </div>
        <div class="rv-list">
          <form class="rv-form" id="rvForm" hidden novalidate></form>
          ${s.n ? `<div class="toolbar" style="margin:0"><div class="filters">${[['all', 'All'], ['5', '5 ★'], ['4', '4 ★'], ['crit', 'Critical'], ['photo', 'With photos']].map(([k, t]) => `<button class="fbtn" data-rf="${k}" aria-pressed="${k === 'all'}">${t}</button>`).join('')}</div>
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
      $('#rvItems').innerHTML = list.map((r) => `<article class="rv-item">
        <div class="rv-h">${stars(r.rating)}<span class="mono mute">${new Date(r.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        ${r.title ? `<h4>${esc(r.title)}</h4>` : ''}<p>${esc(r.body)}</p>
        ${r.photo ? `<img class="rv-photo" src="${esc(r.photo)}" alt="Photo from ${esc(r.name)}">` : ''}
        <div class="rv-meta mono"><span>${esc(r.name)}${r.city ? ', ' + esc(r.city) : ''}</span>${r.verified ? '<span class="volt">Verified buyer</span>' : ''}${r.size ? `<span>EU ${esc(r.size)}</span>` : ''}${r.fit ? `<span>${{ small: 'Runs small', true: 'True to size', large: 'Runs large' }[r.fit]}</span>` : ''}
          <button class="rm" data-help="${r.id}" ${voted.includes(r.id) ? 'disabled' : ''}>Helpful (${r.helpful || 0})</button></div>
        ${r.reply ? `<div class="rv-reply"><span class="mono volt">M.O.R.C. replied</span><p>${esc(r.reply)}</p></div>` : ''}
      </article>`).join('') || (s.n ? '<p class="mute">No fit notes match this filter.</p>' : '');
      $$('[data-help]').forEach((b) => b.addEventListener('click', () => {
        const all = R.all(); const r = all.find((x) => x.id === b.dataset.help); if (!r) return;
        r.helpful = (r.helpful || 0) + 1; R.save(all); store.set('voted', store.get('voted', []).concat(r.id)); paintList();
      }));
    }
    $$('[data-rf], .rv-row').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.rf || b.dataset.f; $$('[data-rf]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.rf === filter)); paintList(); }));
    const so = $('#rvSort'); if (so) so.addEventListener('change', () => { sort = so.value; paintList(); });
    paintList();

    $('#wrBtn').addEventListener('click', () => {
      const f = $('#rvForm');
      if (!f.hidden) { f.hidden = true; return; }
      let rating = 0, photo = '';
      f.hidden = false;
      f.innerHTML = `<div class="f"><label>Your rating</label><div class="star-pick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-st="${n}" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}</div><span class="err"></span></div>
        <div class="f"><label for="rvTitle">Headline</label><input id="rvTitle" maxlength="80" placeholder="Sum it up in a line"></div>
        <div class="f"><label for="rvBody">Your review</label><textarea id="rvBody" maxlength="1200" placeholder="Comfort, stitching, sizing, how the leather breaks in"></textarea><span class="err"></span></div>
        <div class="f-row"><div class="f"><label for="rvName">Name</label><input id="rvName" maxlength="40" autocomplete="given-name"><span class="err"></span></div><div class="f"><label for="rvCity">City</label><input id="rvCity" maxlength="40" autocomplete="address-level2"></div></div>
        <div class="f-row"><div class="f"><label for="rvSize">Size bought</label><select id="rvSize"><option value="">Select</option>${p.sizes.map((x) => `<option>${x}</option>`).join('')}</select></div>
          <div class="f"><label for="rvFit">Fit</label><select id="rvFit"><option value="">Select</option><option value="small">Runs small</option><option value="true">True to size</option><option value="large">Runs large</option></select></div></div>
        <div class="f-row"><div class="f"><label for="rvOrder">Order number (optional)</label><input id="rvOrder" placeholder="MORC-XXXXXXX"></div>
          <div class="f"><label for="rvPhoto">Fit check photo (optional)</label><input id="rvPhoto" type="file" accept="image/*" style="padding-top:13px"></div></div>
        <button class="btn volt" type="submit">Submit for approval</button>
        <p class="form-note">Reviews go live after the M.O.R.C. team reads them. We publish critical reviews too.</p>`;
      $$('[data-st]', f).forEach((b) => b.addEventListener('click', () => { rating = +b.dataset.st; $$('[data-st]', f).forEach((x) => { x.classList.toggle('on', +x.dataset.st <= rating); x.setAttribute('aria-checked', +x.dataset.st === rating); }); }));
      $('#rvPhoto').addEventListener('change', async (e) => { const fl = e.target.files[0]; if (!fl) return; try { photo = await resizeImage(fl, 900); toast('Photo attached'); } catch (er) { toast('That image could not be read'); } });
      f.onsubmit = (e) => {
        e.preventDefault();
        const err = (el, m) => { const w = el.closest('.f'); w.classList.toggle('bad', !!m); $('.err', w).textContent = m || ''; return !m; };
        const ok = [err($('.star-pick', f), rating ? '' : 'Pick a rating.'), err($('#rvBody'), $('#rvBody').value.trim().length < 10 ? 'Write at least a sentence.' : ''), err($('#rvName'), $('#rvName').value.trim() ? '' : 'Add your name.')].every(Boolean);
        if (!ok) return;
        const oid = $('#rvOrder').value.trim().toUpperCase();
        const verified = !!oid && store.get('orders', []).some((o) => o.id === oid && o.items.some((i) => i.pid === p.id));
        const all = R.all();
        all.unshift({ id: 'r' + Date.now().toString(36), pid: p.id, vid: v.id, rating, title: $('#rvTitle').value.trim(), body: $('#rvBody').value.trim(), name: $('#rvName').value.trim(), city: $('#rvCity').value.trim(), size: $('#rvSize').value, fit: $('#rvFit').value, photo, order: oid, verified, status: 'pending', helpful: 0, at: new Date().toISOString() });
        R.save(all);
        f.innerHTML = '<p class="form-note ok">Received. Your review is in the approval queue and goes live once the team has read it.</p>';
        notice('Thank you, your review is in.', 'The team reads every review before it goes live. Yours will appear on this pair once it is approved.');
      };
      f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // value flex share button
    const share = $('#shareB');
    if (share && !$('#flexB')) {
      share.insertAdjacentHTML('afterend', `<button class="act flexact" id="flexB">${window.MORC_ICON ? window.MORC_ICON('bolt') : ''}<span>Share the value flex card</span></button>`);
      $('#flexB').addEventListener('click', () => flexCard(p, v));
    }
  });

  /* ---------------- value flex card ---------------- */
  function flexCard(p, v) {
    const { C, fmt, visual, toast } = A();
    let m = document.getElementById('flexModal');
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="flexModal" role="dialog" aria-label="Value flex card"><div class="panel flex-panel"></div></div>'); m = document.getElementById('flexModal'); m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on'); }); }
    const saved = C.marketRetail - v.price;
    const panel = m.querySelector('.panel');
    panel.innerHTML = `<div class="field-label"><span>Value flex / story size</span><button class="x-btn" data-close>Close</button></div><canvas id="flexCv" width="1080" height="1920" style="width:100%;max-height:62vh;object-fit:contain;background:#080808"></canvas>
      <div class="flex-how" id="flexHow" hidden></div>
      <a class="btn volt block wa-send" id="flexWa" target="_blank" rel="noopener">${window.MORC_ICON ? window.MORC_ICON('whatsapp') : ''}Send on WhatsApp</a>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><a class="btn ghost" id="flexDl" download="morc-value-flex.png">Save image</a><button class="btn ghost" id="flexCap">Copy caption</button></div>
      <p class="form-note">On a phone, Send on WhatsApp attaches the card with the caption and pair details. On a computer, WhatsApp does not let any website attach a picture, so the card is copied for you to paste.</p>`;
    m.classList.add('on');
    const cv = panel.querySelector('#flexCv'), x = cv.getContext('2d');
    const draw = (img) => {
      x.fillStyle = '#080808'; x.fillRect(0, 0, 1080, 1920);
      x.strokeStyle = 'rgba(237,235,228,.07)'; x.lineWidth = 2;
      for (let i = 0; i <= 1080; i += 135) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1920); x.stroke(); }
      for (let i = 0; i <= 1920; i += 135) { x.beginPath(); x.moveTo(0, i); x.lineTo(1080, i); x.stroke(); }
      x.fillStyle = '#EDEBE4'; x.font = '500 30px "JetBrains Mono", monospace'; x.fillText('M.O.R.C. SUPPLY / VALUE FLEX', 80, 140);
      x.fillStyle = '#CCFF00'; x.fillText('+', 1000, 140);
      x.fillStyle = '#EDEBE4'; x.font = '500 150px "Space Grotesk", sans-serif'; x.fillText('I SKIPPED', 74, 420);
      x.fillStyle = '#CCFF00'; x.font = '700 190px "Space Grotesk", sans-serif'; x.fillText(fmt(saved).replace('Rs. ', 'Rs.'), 70, 620);
      x.fillStyle = '#EDEBE4'; x.font = '500 96px "Space Grotesk", sans-serif'; x.fillText('of retail markup.', 74, 760);
      if (img) x.drawImage(img, 40, 830, 1000, 593);
      x.fillStyle = '#8b8a83'; x.font = '400 34px "JetBrains Mono", monospace';
      x.fillText(('M.O.R.C. ' + p.name + ' / ' + v.color).toUpperCase(), 80, 1520);
      x.fillStyle = '#EDEBE4'; x.font = '500 64px "Space Grotesk", sans-serif'; x.fillText(fmt(v.price), 80, 1610);
      x.fillStyle = '#5d5c57'; x.font = '400 50px "Space Grotesk", sans-serif'; x.fillText('Retail ' + fmt(C.marketRetail) + '+', 520, 1610);
      x.strokeStyle = '#5d5c57'; x.lineWidth = 3; x.beginPath(); x.moveTo(520, 1593); x.lineTo(1000, 1593); x.stroke();
      x.fillStyle = '#EDEBE4'; x.font = '400 30px "JetBrains Mono", monospace'; x.fillText('SAME LOCAL CRAFT. ZERO RETAIL MARKUP.', 80, 1790);
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
    const details = [`M.O.R.C. ${p.name} / ${v.color}`, `Price: ${fmt(v.price)}${onSale(v) ? ` (was ${fmt(v.compareAt)})` : ''}`, `Typical retail: ${fmt(C.marketRetail)}+`, `I skipped ${fmt(saved)} of retail markup.`, p.description ? p.description.split('.')[0] + '.' : '', sizes.length ? `Sizes in stock: EU ${sizes.join(', ')}` : (stockOf(v) ? '' : 'Sold out right now'), 'Cash on Delivery across Pakistan.', url].filter(Boolean).join('\n');
    // the card is turned into a file as soon as it is drawn, so a tap can share it straight away
    let file = null, blob = null;
    const pack = () => cv.toBlob((b) => { if (b) { blob = b; file = new File([b], 'morc-value-flex.png', { type: 'image/png' }); } }, 'image/png');
    pack(); img.addEventListener('load', () => setTimeout(pack, 50));
    const wa = panel.querySelector('#flexWa');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(details);
    wa.addEventListener('click', (ev) => {
      // phones: the share sheet sends the image and the caption together, WhatsApp included
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        ev.preventDefault();
        navigator.share({ files: [file], text: details, title: 'M.O.R.C. ' + p.name }).catch((er) => {
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
      const t = details + '\n@morc.supply #MORCsupply #ValueFlex';
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
      { id: 'drop01', label: 'Drop 01', cover: men[0], slides: men.map((p) => ({ p, v: p.variants[0], kicker: 'Drop 01 / ' + p.category, title: p.name, sub: p.variants[0].color + ' / ' + fmt(p.variants[0].price) })) },
      { id: 'flex', label: 'Value flex', text: 'Rs', icon: 'cash', slides: [{ big: fmt(C.marketRetail) + '+', kicker: 'Mainstream retail', title: 'Logo. Hype. Markup.', strike: true }, { big: fmt(men[0].variants[0].price), kicker: 'M.O.R.C. price', title: 'Same benches. Same leather.', volt: true }, { big: fmt(C.marketRetail - men[0].variants[0].price), kicker: 'You keep', title: 'Spend it on the fit.' }] },
      { id: 'unbox', label: 'Unboxing', text: 'Box', icon: 'box', slides: [{ kit: 'box', kicker: 'Unboxing / 01', title: 'Matte black corrugated box.' }, { kit: 'tissue', kicker: 'Unboxing / 02', title: 'Grid tissue. First tear.' }, { kit: 'card', kicker: 'Unboxing / 03', title: 'The manifest card.' }, { kit: 'hw', kicker: 'Unboxing / 04', title: 'Dubrae and the Supply Unit seal.' }] },
      { id: 'qa', label: 'QA table', text: 'QA', icon: 'shield', slides: [['Sourced', 'Workshop rate, paid at the bench.'], ['Vetted', 'Stitch, grain, bond, comfort. Most fail.'], ['Re-laced', 'Matte cotton in. Factory laces out.'], ['Sealed', 'Dubrae, seal, tissue, card, box.'], ['Dispatched', 'Confirmed, then out in 24 hours.']].map(([t, s], i) => ({ kicker: 'QA / step 0' + (i + 1), title: t, sub: s, big: '0' + (i + 1) })) }
    ];
    if (sale.length) sets.splice(1, 0, { id: 'cuts', label: 'Price cuts', cover: sale[0][0], coverV: sale[0][1], slides: sale.map(([p, v]) => ({ p, v, kicker: 'Price cut / ' + pct(v) + '% off', title: p.name, sub: fmt(v.price) + ' / was ' + fmt(v.compareAt) })) });
    sets.push({ id: 'new', label: 'New in', cover: fresh[0], slides: fresh.map((p) => ({ p, v: p.variants[0], kicker: 'New in / ' + p.audience + (p.group ? ' / ' + p.group : ''), title: p.name, sub: fmt(p.variants[0].price) })) });
    return sets;
  }
  const KIT = {
    box: '<div class="box3d"><div class="lid"><b>M.O.R.C.</b></div><div class="side"></div><div class="side2"></div></div>',
    tissue: '<div class="tissue"></div>',
    card: '<div class="mcard"><b>M.O.R.C.</b><p>This pair came from the same benches the big labels use. You paid for leather, labour and a fair margin. Nothing else.</p><i>MANIFEST / DROP 01</i></div>',
    hw: '<div class="hw"><div class="dubrae">M.O.R.C.</div><div class="ziptag"><div class="strap"></div><div class="plate">M.O.R.C.<br>SUPPLY UNIT</div></div></div>'
  };
  on('after', ({ page }) => {
    if (page !== 'home') return;
    const { $, $$, visual, store } = A();
    const slot = $('#ext-stories'); if (!slot) return;
    const sets = storySets();
    const seen = store.get('seen', []);
    slot.innerHTML = `<div class="stories wrap" aria-label="Stories">${sets.map((s, i) => `<button class="story ${seen.includes(s.id) ? 'seen' : ''}" data-set="${i}"><span class="ring-o"><span class="ring-i">${s.cover ? visual(s.cover, s.coverV || s.cover.variants[0]) : (s.icon && window.MORC_ICON ? `<i class="st-ic">${window.MORC_ICON(s.icon)}</i>` : `<b>${s.text}</b>`)}</span></span><span class="mono">${s.label}</span></button>`).join('')}</div>`;
    $$('[data-set]', slot).forEach((b) => b.addEventListener('click', () => openStories(sets, +b.dataset.set)));
    // fit wall
    const wall = $('#ext-fitwall');
    if (wall) {
      const fits = R.approved().filter((r) => r.photo).slice(0, 8);
      wall.innerHTML = `<section class="sheet x"><div class="wrap">${A().head('Fit check wall', fits.length ? 'Worn by the network.' : 'Your fit. Our wall.', `<a class="link" href="${A().link('feed')}">Open the feed</a>`, fits.length ? '' : 'Post a review with a photo of your pair on foot. Approved fit checks are featured here and on our Instagram with credit.')}
        ${fits.length ? `<div class="fitwall">${fits.map((r) => { const p = A().prod(r.pid); return `<a class="fit" href="${A().link('product', r.pid)}"><img src="${esc(r.photo)}" alt="Fit check by ${A().esc(r.name)}" loading="lazy"><span class="fit-o">${stars(r.rating)}<b>${A().esc(r.name)}</b><span class="mono">${p ? A().esc(p.name) : ''}</span></span></a>`; }).join('')}</div>`
        : `<div class="fitwall empty-wall">${['#MORCsupply', '@morc.supply', 'Fit check', 'Tag us'].map((t) => `<div class="fit ph"><span class="mono">${t}</span></div>`).join('')}</div>`}
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
      if (sl.p) art = `<div class="sv-art float">${visual(sl.p, sl.v)}</div>`;
      else if (sl.kit) art = `<div class="sv-art kit-art">${KIT[sl.kit]}</div>`;
      else if (sl.big) art = `<div class="sv-big ${sl.volt ? 'volt' : ''} ${sl.strike ? 'strike' : ''}">${esc(sl.big)}</div>`;
      return `${art}<div class="sv-copy"><span class="mono volt">${esc(sl.kicker || '')}</span><h3>${esc(sl.title || '')}</h3>${sl.sub ? `<p class="mono">${esc(sl.sub)}</p>` : ''}${sl.p ? `<a class="btn volt" href="${link('product', sl.p.id + '~' + sl.v.id)}">Shop this pair <span class="arr">&rarr;</span></a>` : ''}</div>`;
    }
    function paint() {
      const set = sets[si], sl = set.slides[i];
      markSeen();
      el.innerHTML = `<div class="sv-frame"><div class="sv-bars">${set.slides.map((_, k) => `<span><i style="width:${k < i ? 100 : 0}%"></i></span>`).join('')}</div>
        <div class="sv-top"><span class="sv-av">M</span><b>morc.supply</b><span class="mono mute">${esc(set.label)}</span><button class="x-btn" data-x aria-label="Close stories">Close</button></div>
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
    setMeta('The Feed | M.O.R.C. Supply', 'Drops, price cuts and the anti markup manifesto, one swipe at a time.');
    const I = (n, c) => (window.MORC_ICON ? window.MORC_ICON(n, c) : '');
    const reels = [];
    P.forEach((p, k) => {
      const v = p.variants.find(onSale) || p.variants[0];
      reels.push({ p, v });
      if (k === 1) reels.push({ text: ['They buy it for', fmt(p.cost ? p.cost.vendor : 2600), 'and sell it to you for', fmt(C.marketRetail) + '+'] });
      if (k === 4) reels.push({ text: ['No influencer tax.', 'No logo tax.', 'Just the pair.', 'Drop 01 is live.'] });
    });
    document.getElementById('app').innerHTML = `<div class="feed" id="feed">${reels.map((r, i) => r.text
      ? `<section class="reel txt"><div class="reel-in">${r.text.map((t, j) => `<p class="${j % 2 ? 'volt' : ''}" style="animation-delay:${j * .25}s">${esc(t)}</p>`).join('')}<span class="mono mute">Swipe up</span></div></section>`
      : `<section class="reel" data-i="${i}" style="--glow:${esc(r.v.hex || '#333')}"><div class="reel-stage"><div class="layer rn float">${visual(r.p, r.v)}</div><div class="layer scan">${visual(r.p, r.v, { mode: 'blueprint' })}</div></div>
        <div class="reel-cap"><span class="mono"><b>@morc.supply</b> / ${esc(r.p.audience)}${r.p.group ? ' / ' + esc(r.p.group) : ''}</span>
          <h2>${esc(r.p.name)}</h2><p>${esc(r.v.color)}${r.p.description ? '. ' + esc(r.p.description.split('.')[0]) + '.' : ''}</p>
          <span class="mono mute">#MORCsupply #${esc(r.p.category)} #ValueFlex</span>
          <div class="reel-price"><b>${fmt(r.v.price)}</b>${onSale(r.v) ? `<span class="strike mono">${fmt(r.v.compareAt)}</span><span class="chip v">&minus;${pct(r.v)}%</span>` : `<span class="strike mono">${fmt(C.marketRetail)}+ retail</span>`}</div>
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
        if (e.target.closest('a,button')) return;
        const now = Date.now();
        if (now - last < 320) {
          const sr = sec.getBoundingClientRect(); const x = e.clientX - sr.left; const y = e.clientY - sr.top;
          const big = document.createElement('i'); big.className = 'lv-big'; big.innerHTML = I('heartFill'); big.style.left = x + 'px'; big.style.top = y + 'px';
          sec.appendChild(big); setTimeout(() => big.remove(), 900); burst(sec, x, y);
          setLike($('[data-like]', sec), true); last = 0;
        } else last = now;
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
