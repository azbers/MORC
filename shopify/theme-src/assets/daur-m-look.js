/* DAUR phone look: "the seam". Adds the opening stage on home, the sewn scroll line under the top bar, the stitched
   heart on an empty liked list and the rise of cards as you reach them. It only reads what daur-m.js has drawn,
   so the words and prices always come from the app itself. Styles are in daur-m-look.css. */
(function () {
  'use strict';
  var H = document.documentElement;
  if (!H.classList.contains('m-on')) return;
  var app = document.getElementById('mApp'), view = document.getElementById('mView');
  if (!app || !view) return;
  var API = window.DAUR_API || {}, C = API.C || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  H.classList.add('lk-on');

  /* the seam under the top bar */
  var seam = document.createElement('div'); seam.className = 'lk-seam'; seam.setAttribute('aria-hidden', 'true'); app.appendChild(seam);
  var tick = 0;
  function paintSeam() {
    tick = 0;
    var max = document.documentElement.scrollHeight - innerHeight;
    seam.style.setProperty('--lk-p', (max > 40 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0).toFixed(1) + '%');
  }
  addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(paintSeam); }, { passive: true });

  /* the opening stage */
  var turn = 0;
  function hero() {
    var intro = view.querySelector('.r7-intro');
    if (!intro || view.querySelector('.lk-hero')) return;
    var h1 = intro.querySelector('h1'), p = intro.querySelector('p');
    if (!h1) return;
    var cards = [].slice.call(view.querySelectorAll('.m-car .m-card')).slice(0, 4);
    var pairs = cards.map(function (c) {
      var im = c.querySelector('img.c-img'), a = c.querySelector('a.c-link'), n = c.querySelector('.c-n'), pr = c.querySelector('.c-p'), t = c.querySelector('.c-t');
      if (!im || !a || !n || !pr) return '';
      var was = pr.querySelector('s'), now = pr.childNodes[0] ? pr.childNodes[0].textContent.trim() : pr.textContent.trim();
      return '<a class="lk-pair" href="' + esc(a.getAttribute('href')) + '" data-m aria-label="' + esc(n.textContent + ', ' + now) + '">' +
        '<img class="' + (im.classList.contains('blend') ? 'blend' : '') + '" src="' + esc(im.currentSrc || im.src) + '" alt="" decoding="async">' +
        '<i class="lk-thread"></i><span class="lk-tag"><small>' + esc(t ? t.textContent : 'DAUR') + '</small><b>' + esc(n.textContent) + '</b><em>' + esc(now) + (was ? '<s>was Rs. ' + esc(was.textContent) + '</s>' : '') + '</em></span></a>';
    }).filter(Boolean);
    var shop = (view.querySelector('.m-row .m-link[href]') || {}).href || '/collections/all';
    var s = h1.textContent.trim(), cut = s.indexOf('. ');
    var head = cut > 0 ? esc(s.slice(0, cut + 1)) + ' <span>' + esc(s.slice(cut + 2)) + '</span>' : esc(s);
    var el = document.createElement('section');
    el.className = 'lk-hero';
    el.innerHTML = '<div class="lk-hero-in"><span class="lk-eye"><i></i>Own your pace.</span><h1>' + head + '</h1>' +
      (pairs.length ? '<div class="lk-stage"><span class="lk-ring"></span>' + pairs.join('') + (pairs.length > 1 ? '<span class="lk-dots" aria-hidden="true">' + pairs.map(function () { return '<i></i>'; }).join('') + '</span>' : '') + '</div>' : '') +
      (p ? '<p>' + esc(p.textContent.trim()) + '</p>' : '') +
      '<div class="lk-cta"><a class="lk-btn" href="' + esc(shop) + '" data-m>See every pair' + ARROW + '</a><button type="button" class="lk-ghost" data-why>Why Rs. 1,000 first?</button></div>' +
      '<ul class="lk-facts"><li><b>3</b><small>workshop cities we buy from</small></li><li><b>' + esc(C.exchangeDays || 5) + ' days</b><small>to swap your size</small></li><li><b>30 days</b><small>of cover for defects</small></li></ul></div>';
    // one headline on the page: the plain intro keeps its place for readers without this layer
    h1.setAttribute('aria-hidden', 'true');
    const fdr = view.querySelector(':scope > .m-fdr');
    view.insertBefore(el, fdr ? fdr.nextSibling : view.firstChild);
    show(el, 0);
    clearInterval(turn);
    if (pairs.length > 1 && !reduce) turn = setInterval(function () {
      if (!el.isConnected) { clearInterval(turn); return; }
      if (document.hidden || el.getBoundingClientRect().bottom < 0) return;
      show(el, (+el.dataset.i + 1) % pairs.length);
    }, 4200);
  }
  function show(el, i) {
    el.dataset.i = i;
    [].forEach.call(el.querySelectorAll('.lk-pair'), function (x, k) { x.classList.toggle('on', k === i); });
    [].forEach.call(el.querySelectorAll('.lk-dots i'), function (x, k) { x.classList.toggle('on', k === i); });
  }

  /* an empty liked list: the pair sits inside a heart that is still being sewn */
  function liked() {
    var e = view.querySelector('.m-empty'); if (!e || !view.classList.contains('v-liked') || e.querySelector('.lk-heart')) return;
    var im = e.querySelector('img'); if (!im) return;
    var w = document.createElement('span'); w.className = 'lk-heart';
    w.innerHTML = '<svg viewBox="0 0 210 186" aria-hidden="true"><path d="M105 176C58 142 14 108 14 62 14 34 36 14 62 14c18 0 34 9 43 24 9-15 25-24 43-24 26 0 48 20 48 48 0 46-44 80-91 114Z"/></svg>';
    e.insertBefore(w, im); w.appendChild(im);
  }

  /* cards rise into place the first time you reach them */
  var io = ('IntersectionObserver' in window) && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('lk-in'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -6% 0px' }) : null;
  function rise() {
    if (!io) return;
    var n = 0;
    [].forEach.call(view.querySelectorAll('.m-grid .m-tile:not(.lk-r), .m-rows .m-li:not(.lk-r), .r5-duo .r5-card:not(.lk-r)'), function (t) {
      var r = t.getBoundingClientRect();
      // only what is still below the screen waits; anything already in sight is never hidden
      if (r.top < innerHeight) return;
      t.classList.add('lk-r'); t.style.setProperty('--lk-d', (n++ % 2) * 90 + 'ms'); io.observe(t);
    });
  }

  var wait = 0;
  function dress() { wait = 0; try { hero(); liked(); rise(); paintSeam(); } catch (e) { H.classList.remove('lk-on'); } }
  new MutationObserver(function () { if (!wait) wait = requestAnimationFrame(dress); }).observe(view, { childList: true, subtree: true });
  dress();
})();
