/* Product purchase blocks (product page and quick view): colour and size from the product's real
   variants, sold out sizes disabled and crossed out, price, stock and payment split swapped from
   server rendered templates, size required before Add to bag. Product page extras: gallery position
   on phones, zoom view, sticky phone purchase bar. */
(() => {
  'use strict';
  const D = window.DAUR || (window.DAUR = {});

  D.initBuy = (box) => {
    if (!box || box.dataset.ready) return;
    const dataEl = box.querySelector('[data-product-json]');
    const form = box.querySelector('[data-product-form]');
    if (!dataEl || !form) return;
    box.dataset.ready = '1';
    const P = JSON.parse(dataEl.textContent);
    const scope = box.closest('[data-product-scope]') || box;
    const idInput = form.querySelector('[data-variant-id]');
    const addBtn = form.querySelector('[data-add]');
    const stock = form.querySelector('[data-stock]');
    const sizeGrid = form.querySelector('[data-size-grid]');
    const sizeErr = form.querySelector('[data-size-error]');
    const isMain = box.dataset.context === 'main';

    const chosen = () => {
      const out = {};
      form.querySelectorAll('input[type="radio"]:checked').forEach((r) => { out[r.name.replace('option', '')] = r.value; });
      return out;
    };
    const match = (sel) => P.variants.find((v) => v.options.every((val, i) => !sel[i + 1] || sel[i + 1] === val));
    const exact = (sel) => P.variants.find((v) => v.options.every((val, i) => sel[i + 1] === val));

    const refreshSizes = (sel) => {
      if (!P.sizePos) return;
      form.querySelectorAll('input[name="option' + P.sizePos + '"]').forEach((r) => {
        const v = exact(Object.assign({}, sel, { [P.sizePos]: r.value }));
        const ok = !!(v && v.available);
        r.disabled = !ok;
        const lab = form.querySelector('label[for="' + r.id + '"] [data-sold-label]');
        if (lab) lab.hidden = ok;
        if (!ok && r.checked) r.checked = false;
      });
    };

    const update = (fromUser) => {
      refreshSizes(chosen());
      const sel = chosen();
      const sizeChosen = !P.sizePos || !!sel[P.sizePos];
      const v = sizeChosen ? exact(sel) : match(sel);
      form.querySelectorAll('[data-option]').forEach((fs) => {
        const c = fs.querySelector('input:checked');
        const label = fs.querySelector('[data-chosen]');
        if (label) label.textContent = c ? (fs.hasAttribute('data-size-option') ? ': ' + c.value : c.value) : '';
      });
      if (!v) {
        addBtn.disabled = true;
        addBtn.textContent = P.t.unavailable;
        stock.textContent = '';
        box.dispatchEvent(new CustomEvent('daur:variant', { bubbles: true, detail: { variant: null, sizeChosen } }));
        return;
      }
      idInput.value = v.id;
      const anyAvailable = P.variants.some((x) => x.available && (!P.colourPos || x.options[P.colourPos - 1] === sel[P.colourPos]));
      addBtn.disabled = !anyAvailable;
      addBtn.textContent = anyAvailable ? P.t.add : P.t.out;
      if (sizeChosen) {
        stock.className = 'stock-line';
        if (!v.available) { stock.classList.add('is-out'); stock.textContent = P.t.out; }
        else if (v.qty !== null && v.qty > 0 && v.qty <= P.lowAt) { stock.classList.add('is-low'); stock.textContent = P.t.low.replace('{{ count }}', v.qty); }
        else stock.textContent = P.t.in;
      } else stock.textContent = '';
      const tpl = box.querySelector('[data-deposit-for="' + v.price + '"]');
      const depWrap = scope.querySelector('[data-deposit-wrap]');
      if (tpl && depWrap) depWrap.innerHTML = tpl.innerHTML;
      const ptpl = box.querySelector('[data-price-for="' + v.price + '-' + (v.compare || 0) + '"]');
      const pw = scope.querySelector('[data-price-wrap]');
      if (ptpl && pw) pw.innerHTML = ptpl.innerHTML;
      if (fromUser && sizeChosen) {
        if (isMain) {
          const url = new URL(location.href);
          url.searchParams.set('variant', v.id);
          history.replaceState(null, '', url.toString());
        }
        if (sizeErr) sizeErr.hidden = true;
        if (sizeGrid) sizeGrid.classList.remove('is-invalid');
      }
      box.dispatchEvent(new CustomEvent('daur:variant', { bubbles: true, detail: { variant: v, sizeChosen, size: sel[P.sizePos] || '' } }));
    };

    form.daurValidate = () => {
      if (P.sizePos && !chosen()[P.sizePos]) {
        if (sizeErr) sizeErr.hidden = false;
        if (sizeGrid) {
          sizeGrid.classList.add('is-invalid');
          sizeGrid.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          const first = sizeGrid.querySelector('input:not(:disabled)');
          if (first) first.focus({ preventScroll: true });
        }
        return false;
      }
      return true;
    };

    form.addEventListener('change', (e) => { if (e.target.matches('input[type="radio"]')) update(true); });

    /* pre-select a size only when the address names a variant (shared link), never by default */
    if (isMain) {
      const vid = new URL(location.href).searchParams.get('variant');
      const v = vid && P.variants.find((x) => String(x.id) === vid);
      if (v) v.options.forEach((val, i) => {
        const r = Array.from(form.querySelectorAll('input[name="option' + (i + 1) + '"]')).find((x) => x.value === val);
        if (r) r.checked = true;
      });
    }
    update(false);
  };

  document.querySelectorAll('[data-product]').forEach(D.initBuy);

  /* ---------- product page only ---------- */
  const page = document.querySelector('.product[data-product-scope]');
  if (!page) return;

  /* gallery position on phones */
  const gal = page.querySelector('[data-gallery]');
  const count = page.querySelector('[data-gallery-count]');
  if (gal && count) {
    const n = gal.children.length;
    gal.addEventListener('scroll', () => {
      const w = gal.children[0].getBoundingClientRect().width + 8;
      count.textContent = Math.min(n, Math.round(gal.scrollLeft / w) + 1) + ' / ' + n;
    }, { passive: true });
  }

  /* zoom: the tapped photo, larger, in a dialog; loaded only when asked for */
  const zoom = document.getElementById('ZoomModal');
  if (gal && zoom) {
    gal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-zoom]');
      if (!b) return;
      const img = b.parentElement.querySelector('img');
      if (!img) return;
      const src = (img.currentSrc || img.src).replace(/([?&])width=\d+/, '$1width=1800');
      const target = zoom.querySelector('[data-zoom-target]');
      target.innerHTML = '';
      const big = new Image();
      big.src = src; big.alt = img.alt || ''; big.decoding = 'async';
      target.appendChild(big);
      D.open && D.open('ZoomModal', b);
    });
  }

  /* sticky purchase bar on phones once the main Add to bag button is out of view */
  const bar = document.querySelector('[data-sticky-buy]');
  const mainBox = page.querySelector('[data-product][data-context="main"]');
  const mainBtn = mainBox && mainBox.querySelector('[data-add]');
  if (bar && mainBtn && 'IntersectionObserver' in window) {
    const mq = matchMedia('(max-width: 989px)');
    let past = false;
    const show = () => {
      const on = past && mq.matches && !document.body.classList.contains('is-locked');
      bar.hidden = !on;
      document.documentElement.classList.toggle('has-sticky-buy', on);
    };
    /* past = the main button has scrolled above the screen; checked on intersection changes and,
       for jumps that skip the button entirely, once per frame while scrolling */
    const check = () => { const was = past; past = mainBtn.getBoundingClientRect().bottom < 0; if (past !== was) show(); };
    new IntersectionObserver(check).observe(mainBtn);
    let tick = false;
    addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; check(); }); }, { passive: true });
    mq.addEventListener('change', show);
    document.addEventListener('daur:open', show);
    document.addEventListener('daur:close', show);
    mainBox.addEventListener('daur:variant', (e) => {
      const d = e.detail;
      const sz = bar.querySelector('[data-sticky-size]');
      if (sz) sz.textContent = d.sizeChosen && d.size ? ' · ' + d.size : '';
      const pr = bar.querySelector('[data-sticky-price]');
      const now = page.querySelector('[data-price-wrap] .price__now');
      if (pr && now) pr.textContent = now.textContent;
      const sb = bar.querySelector('[data-sticky-add]');
      if (sb) { sb.disabled = mainBtn.disabled; sb.textContent = mainBtn.textContent; }
    });
    bar.querySelector('[data-sticky-add]').addEventListener('click', () => {
      const f = mainBox.querySelector('[data-product-form]');
      if (f.daurValidate && !f.daurValidate()) return;
      f.requestSubmit ? f.requestSubmit(mainBtn) : mainBtn.click();
    });
  }
})();
