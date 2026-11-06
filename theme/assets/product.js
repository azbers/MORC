/* Product page: colour and size choice from the product's real variants, sold out sizes
   disabled and crossed out, price, stock and payment split swapped from server rendered
   templates, size required before Add to bag, gallery position on phones. */
(() => {
  'use strict';
  const root = document.querySelector('[data-product]');
  const dataEl = document.querySelector('[data-product-json]');
  if (!root || !dataEl) return;
  const P = JSON.parse(dataEl.textContent);
  const form = root.querySelector('[data-product-form]');
  const idInput = form.querySelector('[data-variant-id]');
  const addBtn = form.querySelector('[data-add]');
  const stock = root.querySelector('[data-stock]');
  const sizeGrid = root.querySelector('[data-size-grid]');
  const sizeErr = root.querySelector('[data-size-error]');
  const depWrap = root.querySelector('[data-deposit-wrap]');
  const exLine = root.querySelector('[data-exchange-line]');

  const chosen = () => {
    const out = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach((r) => { out[r.name.replace('option', '')] = r.value; });
    return out;
  };
  const match = (sel) => P.variants.find((v) => v.options.every((val, i) => !sel[i + 1] || sel[i + 1] === val));
  const exact = (sel) => P.variants.find((v) => v.options.every((val, i) => sel[i + 1] === val));
  const money = (cents) => document.querySelector('[data-deposit-for="' + cents + '"]');

  const refreshSizes = (sel) => {
    if (!P.sizePos) return;
    form.querySelectorAll('input[name="option' + P.sizePos + '"]').forEach((r) => {
      const probe = Object.assign({}, sel, { [P.sizePos]: r.value });
      const v = exact(probe);
      const ok = !!(v && v.available);
      r.disabled = !ok;
      const lab = form.querySelector('label[for="' + r.id + '"] [data-sold-label]');
      if (lab) lab.hidden = ok;
      if (!ok && r.checked) r.checked = false;
    });
  };

  const update = (fromUser) => {
    const sel = chosen();
    refreshSizes(sel);
    const sizeChosen = !P.sizePos || !!chosen()[P.sizePos];
    const v = sizeChosen ? exact(chosen()) : match(chosen());
    root.querySelectorAll('[data-option]').forEach((fs) => {
      const c = fs.querySelector('input:checked');
      const label = fs.querySelector('[data-chosen]');
      if (label) label.textContent = c ? (fs.hasAttribute('data-size-option') ? ': ' + c.value : c.value) : '';
    });
    if (!v) {
      addBtn.disabled = true;
      addBtn.textContent = P.t.unavailable;
      stock.textContent = '';
      return;
    }
    idInput.value = v.id;
    const anyAvailable = P.variants.some((x) => x.available && (!P.colourPos || x.options[P.colourPos - 1] === chosen()[P.colourPos]));
    addBtn.disabled = !anyAvailable;
    addBtn.textContent = anyAvailable ? P.t.add : P.t.out;
    if (sizeChosen) {
      stock.className = 'stock-line';
      if (!v.available) { stock.classList.add('is-out'); stock.textContent = P.t.out; }
      else if (v.qty !== null && v.qty > 0 && v.qty <= P.lowAt) { stock.classList.add('is-low'); stock.textContent = P.t.low.replace('{{ count }}', v.qty); }
      else stock.textContent = P.t.in;
    } else stock.textContent = '';
    const tpl = money(v.price);
    if (tpl && depWrap) depWrap.innerHTML = tpl.innerHTML;
    if (exLine) exLine.textContent = v.compare > v.price ? P.exchangeSaleLine : P.exchangeLine;
    const ptpl = document.querySelector('[data-price-for="' + v.price + '-' + (v.compare || 0) + '"]');
    const pw = root.querySelector('[data-price-wrap]');
    if (ptpl && pw) pw.innerHTML = ptpl.innerHTML;
    if (fromUser && sizeChosen) {
      const url = new URL(location.href);
      url.searchParams.set('variant', v.id);
      history.replaceState(null, '', url.toString());
      if (sizeErr) sizeErr.hidden = true;
      if (sizeGrid) sizeGrid.classList.remove('is-invalid');
    }
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
  const vid = new URL(location.href).searchParams.get('variant');
  if (vid) {
    const v = P.variants.find((x) => String(x.id) === vid);
    if (v) v.options.forEach((val, i) => {
      const r = Array.from(form.querySelectorAll('input[name="option' + (i + 1) + '"]')).find((x) => x.value === val);
      if (r) r.checked = true;
    });
  }
  update(false);

  /* gallery position on phones */
  const gal = root.querySelector('[data-gallery]');
  const count = root.querySelector('[data-gallery-count]');
  if (gal && count) {
    const n = gal.children.length;
    gal.addEventListener('scroll', () => {
      const i = Math.round(gal.scrollLeft / (gal.children[0].getBoundingClientRect().width + 8));
      count.textContent = Math.min(n, i + 1) + ' / ' + n;
    }, { passive: true });
  }
})();
