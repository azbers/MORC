/* DAUR product renderer.
   Draws each pair as a side profile SVG so the catalog works before
   photography exists. Swap for real photos by setting product.images. */
(function () {
  let uid = 0;

  const SHAPES = {
    court:   { heel: 128, dipX: 176, dipY: 140, tx: 226, ty: 104, ex: 330, ey: 150, toe: 182, sole: 26, laced: true },
    runner:  { heel: 116, dipX: 170, dipY: 136, tx: 222, ty: 96,  ex: 336, ey: 150, toe: 184, sole: 34, laced: true, runner: true },
    moc:     { heel: 126, dipX: 178, dipY: 142, tx: 228, ty: 108, ex: 318, ey: 150, toe: 174, sole: 24, laced: true, moc: true },
    derby:   { heel: 138, dipX: 182, dipY: 150, tx: 232, ty: 122, ex: 320, ey: 160, toe: 190, sole: 14, laced: true, derby: true },
    mid:     { heel: 84,  dipX: 168, dipY: 96,  tx: 214, ty: 74,  ex: 334, ey: 148, toe: 182, sole: 28, laced: true },
    chelsea: { heel: 70,  dipX: 200, dipY: 80,  tx: 290, ty: 82,  ex: 330, ey: 120, toe: 186, sole: 22, laced: false, chelsea: true },
    slip:    { heel: 140, dipX: 190, dipY: 154, tx: 270, ty: 150, ex: 330, ey: 160, toe: 188, sole: 22, laced: false, slip: true }
  };

  const ST = 226; // top of sole line

  function upperPath(s) {
    const h = s.heel;
    if (!s.laced) {
      return `M84 ${ST} L80 ${h + 22} C80 ${h + 2} 92 ${h - 4} 112 ${h - 3} C150 ${h} ${s.dipX - 30} ${s.dipY} ${s.dipX} ${s.dipY} ` +
        `C${s.dipX + 40} ${s.dipY} ${s.tx - 20} ${s.ty} ${s.tx} ${s.ty + 2} C${s.ex - 20} ${s.ty + 6} ${s.ex} ${s.ey - 10} ${s.ex + 10} ${s.ey} ` +
        `C${s.ex + 70} ${s.ey + 16} 500 ${s.toe - 6} 534 ${s.toe + 8} C556 ${s.toe + 18} 564 ${ST - 8} 558 ${ST} Z`;
    }
    return `M84 ${ST} L80 ${h + 22} C80 ${h + 2} 92 ${h - 4} 112 ${h - 3} C142 ${h} ${s.dipX - 22} ${s.dipY} ${s.dipX} ${s.dipY} ` +
      `C${s.dipX + 18} ${s.dipY} ${s.tx - 14} ${s.ty + 16} ${s.tx} ${s.ty} C${s.tx + 8} ${s.ty - 6} ${s.tx + 22} ${s.ty - 4} ${s.tx + 28} ${s.ty + 6} ` +
      `L${s.ex} ${s.ey} C${s.ex + 60} ${s.ey + 12} 500 ${s.toe - 8} 535 ${s.toe + 6} C556 ${s.toe + 14} 564 ${ST - 8} 558 ${ST} Z`;
  }

  function solePath(s) {
    const b = ST + s.sole;
    if (s.derby) {
      return `M74 ${ST} L560 ${ST} C568 ${ST} 568 ${b} 556 ${b} L170 ${b} L170 ${b + 12} L86 ${b + 12} C78 ${b + 12} 74 ${b + 6} 74 ${b} Z`;
    }
    if (s.runner) {
      return `M70 ${ST - 4} L560 ${ST} C570 ${ST + 2} 570 ${b - 10} 552 ${b - 6} C520 ${b - 2} 470 ${b} 420 ${b} L120 ${b + 4} C86 ${b + 4} 64 ${b - 6} 64 ${b - 18} C64 ${ST + 6} 66 ${ST - 4} 70 ${ST - 4} Z`;
    }
    return `M72 ${ST} L560 ${ST} C570 ${ST} 570 ${b - 4} 558 ${b} L90 ${b} C76 ${b} 70 ${b - 6} 70 ${b - 12} L70 ${ST + 2} C70 ${ST} 71 ${ST} 72 ${ST} Z`;
  }

  function eyelets(s, n) {
    const pts = [];
    const x0 = s.tx + 20, y0 = s.ty + 12, x1 = s.ex - 8, y1 = s.ey + 3;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 6]);
    }
    return pts;
  }

  function render(p, opts) {
    opts = opts || {};
    const mode = opts.mode || 'render';
    const s = SHAPES[p.silhouette] || SHAPES.court;
    const c = p.palette;
    const id = 'mx' + (++uid);
    const vb = opts.viewBox || '62 30 476 282';
    const bp = mode === 'blueprint';
    const ink = 'var(--bone, #EDEBE4)';
    const strokeMain = bp ? ink : 'rgba(255,255,255,.10)';
    const fill = (col) => bp ? 'none' : col;
    const sw = bp ? 1.1 : 1;
    const b = ST + s.sole;
    let out = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name} ${p.colorway}, side profile${bp ? ' blueprint' : ''}" class="shoe shoe-${mode}">`;

    out += `<defs>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${bp ? 0 : .16}"/><stop offset=".45" stop-color="#fff" stop-opacity="${bp ? 0 : .03}"/><stop offset="1" stop-color="#000" stop-opacity="${bp ? 0 : .35}"/></linearGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f0"/><stop offset=".5" stop-color="#8d8d88"/><stop offset="1" stop-color="#d9d9d3"/></linearGradient>
      <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs><g transform="translate(30 0) scale(.84 1)">`;

    if (!bp) out += `<ellipse cx="318" cy="${b + 14}" rx="270" ry="14" fill="url(#${id}g)"/>`;
    if (bp) {
      // dimension lines
      out += `<g stroke="${ink}" stroke-width=".6" opacity=".45" fill="none">
        <path d="M70 ${b + 26} L560 ${b + 26} M70 ${b + 20} L70 ${b + 32} M560 ${b + 20} L560 ${b + 32}"/>
        <path d="M590 ${ST} L590 ${b} M584 ${ST} L596 ${ST} M584 ${b} L596 ${b}"/></g>
        <text x="315" y="${b + 40}" fill="${ink}" opacity=".55" font-family="var(--mono, monospace)" font-size="9" text-anchor="middle" letter-spacing="1.5">L 290 MM / EU 42</text>`;
    }

    // sole
    out += `<path d="${solePath(s)}" fill="${fill(c.sole)}" stroke="${strokeMain}" stroke-width="${sw}"/>`;
    if (s.runner) out += `<path d="M76 ${ST + 14} C160 ${ST + 6} 240 ${ST + 22} 330 ${ST + 12} C400 ${ST + 4} 480 ${ST + 18} 560 ${ST + 12}" fill="none" stroke="${bp ? ink : 'rgba(0,0,0,.35)'}" stroke-width="${sw}"/>`;
    else if (!s.derby) out += `<path d="M74 ${ST + s.sole * 0.55} L562 ${ST + s.sole * 0.55}" stroke="${bp ? ink : 'rgba(0,0,0,.4)'}" stroke-width=".8" opacity="${bp ? .5 : 1}"/>`;
    // sole stitch
    out += `<path d="M84 ${ST + 5} L552 ${ST + 5}" stroke="${bp ? ink : c.stitch}" stroke-width=".9" stroke-dasharray="3 3" opacity="${bp ? .6 : .8}"/>`;

    // upper
    const up = upperPath(s);
    out += `<path d="${up}" fill="${fill(c.upper)}" stroke="${strokeMain}" stroke-width="${sw}"/>`;
    if (!bp) out += `<path d="${up}" fill="url(#${id}l)"/>`;

    // heel counter
    out += `<path d="M82 ${ST} L80 ${s.heel + 36} C96 ${s.heel + 30} 128 ${s.heel + 40} 150 ${ST - 40} C160 ${ST - 20} 170 ${ST - 6} 178 ${ST} Z" fill="${fill(c.panel)}" stroke="${bp ? ink : 'rgba(255,255,255,.07)'}" stroke-width="${sw}"/>`;
    out += `<path d="M90 ${s.heel + 40} C110 ${s.heel + 36} 134 ${s.heel + 46} 146 ${ST - 40}" fill="none" stroke="${bp ? ink : c.stitch}" stroke-width=".8" stroke-dasharray="3 3" opacity=".8"/>`;

    // toe / mudguard
    out += `<path d="M400 ${ST} C430 ${ST - 26} 480 ${s.toe + 6} 532 ${s.toe + 10} C552 ${s.toe + 18} 562 ${ST - 10} 558 ${ST} Z" fill="${fill(c.panel)}" stroke="${bp ? ink : 'rgba(255,255,255,.07)'}" stroke-width="${sw}"/>`;
    out += `<path d="M410 ${ST - 6} C440 ${ST - 28} 486 ${s.toe + 12} 534 ${s.toe + 18}" fill="none" stroke="${bp ? ink : c.stitch}" stroke-width=".8" stroke-dasharray="3 3" opacity=".8"/>`;

    // side panel stitch line
    out += `<path d="M150 ${ST - 40} C220 ${ST - 60} 300 ${s.ey + 10} ${s.ex + 6} ${s.ey + 4}" fill="none" stroke="${bp ? ink : c.stitch}" stroke-width=".8" stroke-dasharray="3 3" opacity=".7"/>`;

    if (s.moc) {
      out += `<path d="M${s.ex - 6} ${s.ey + 2} C${s.ex + 40} ${s.ey + 40} 470 ${s.toe + 30} 540 ${s.toe + 26}" fill="none" stroke="${bp ? ink : c.stitch}" stroke-width="1.4" stroke-dasharray="2 2.5"/>`;
      out += `<path d="M${s.ex - 2} ${s.ey - 4} C${s.ex + 50} ${s.ey + 28} 474 ${s.toe + 20} 540 ${s.toe + 18}" fill="none" stroke="${bp ? ink : 'rgba(255,255,255,.12)'}" stroke-width="1"/>`;
    }
    if (s.chelsea) {
      out += `<path d="M232 ${s.dipY + 2} L250 ${ST - 52} L292 ${ST - 52} L300 ${s.ty + 4} Z" fill="${fill('#0b0b0b')}" stroke="${bp ? ink : 'rgba(255,255,255,.08)'}" stroke-width="${sw}"/>`;
      for (let i = 0; i < 9; i++) out += `<path d="M${240 + i * 6} ${s.dipY + 8} L${252 + i * 5} ${ST - 56}" stroke="${bp ? ink : 'rgba(255,255,255,.06)'}" stroke-width=".7"/>`;
      out += `<path d="M84 ${s.heel + 2} L84 ${s.heel - 26} L104 ${s.heel - 26} L106 ${s.heel - 2}" fill="${fill(c.panel)}" stroke="${bp ? ink : 'rgba(255,255,255,.12)'}" stroke-width="${sw}"/>`;
      // seal on pull tab
      out += `<rect class="hw-tag" x="94" y="${s.heel - 22}" width="5" height="44" rx="2" fill="${bp ? 'none' : '#050505'}" stroke="${bp ? 'var(--volt,#CCFF00)' : 'rgba(255,255,255,.18)'}" stroke-width=".8"/>`;
    }
    if (s.slip) {
      out += `<path d="M${s.tx - 30} ${s.ty + 2} L${s.tx - 14} ${s.ty + 34} L${s.tx + 2} ${s.ty + 3}" fill="${fill('#0b0b0b')}" stroke="${bp ? ink : 'rgba(255,255,255,.12)'}" stroke-width="${sw}"/>`;
      out += `<path d="M${s.tx + 14} ${s.ty + 4} C${s.ex + 60} ${s.ey + 18} 470 ${s.toe + 22} 540 ${s.toe + 22}" fill="none" stroke="${bp ? ink : c.stitch}" stroke-width="1.1" stroke-dasharray="2 2.5"/>`;
    }

    if (s.laced) {
      // tongue
      out += `<path d="M${s.tx - 2} ${s.ty + 2} C${s.tx + 4} ${s.ty - 18} ${s.tx + 26} ${s.ty - 22} ${s.tx + 34} ${s.ty - 6} L${s.tx + 30} ${s.ty + 8}" fill="${fill(c.panel)}" stroke="${bp ? ink : 'rgba(255,255,255,.1)'}" stroke-width="${sw}"/>`;
      // eyestay
      out += `<path d="M${s.tx + 10} ${s.ty + 22} L${s.ex - 2} ${s.ey + 14}" stroke="${bp ? ink : c.stitch}" stroke-width=".8" stroke-dasharray="3 3" opacity=".8"/>`;
      const pts = eyelets(s, s.derby ? 4 : 5);
      // laces
      pts.forEach(([x, y], i) => {
        out += `<path d="M${x - 9} ${y - 7} L${x + 9} ${y - 1} M${x - 9} ${y - 1} L${x + 9} ${y - 7}" stroke="${bp ? ink : c.lace}" stroke-width="${bp ? 1 : 4.2}" stroke-linecap="round"/>`;
        if (!bp) out += `<path d="M${x - 9} ${y - 7} L${x + 9} ${y - 1}" stroke="rgba(255,255,255,.08)" stroke-width="1.2" stroke-linecap="round"/>`;
        out += `<circle cx="${x}" cy="${y + 4}" r="2.6" fill="${bp ? 'none' : '#2b2b2b'}" stroke="${bp ? ink : 'rgba(255,255,255,.25)'}" stroke-width=".8"/>`;
      });
      // bow
      const [bx, by] = pts[0];
      out += `<path d="M${bx - 4} ${by - 6} C${bx - 30} ${by - 30} ${bx - 52} ${by - 6} ${bx - 26} ${by + 2} M${bx - 2} ${by - 4} C${bx - 14} ${by + 26} ${bx - 34} ${by + 42} ${bx - 46} ${by + 58}" fill="none" stroke="${bp ? ink : c.lace}" stroke-width="${bp ? 1 : 3.6}" stroke-linecap="round"/>`;
      // zip tie seal on top eyelet
      out += `<g class="hw-tag"><path d="M${bx + 2} ${by + 4} C${bx + 6} ${by + 20} ${bx + 2} ${by + 34} ${bx - 4} ${by + 44}" fill="none" stroke="${bp ? 'var(--volt,#CCFF00)' : '#050505'}" stroke-width="${bp ? 1.2 : 3}" stroke-linecap="round"/>
        <rect x="${bx - 14}" y="${by + 42}" width="22" height="34" rx="3" transform="rotate(8 ${bx - 3} ${by + 59})" fill="${bp ? 'none' : '#070707'}" stroke="${bp ? 'var(--volt,#CCFF00)' : 'rgba(255,255,255,.22)'}" stroke-width="1"/>
        ${bp ? '' : `<text x="${bx - 3}" y="${by + 62}" transform="rotate(98 ${bx - 3} ${by + 60})" fill="#d9d9d3" font-family="monospace" font-size="4.2" text-anchor="middle" letter-spacing=".6">SUPPLY UNIT</text>`}</g>`;
      // dubrae on bottom row
      const [dx, dy] = pts[pts.length - 1];
      out += `<g class="hw-dubrae"><rect x="${dx - 11}" y="${dy - 10}" width="22" height="9" rx="1.5" transform="rotate(16 ${dx} ${dy - 5})" fill="${bp ? 'none' : `url(#${id}m)`}" stroke="${bp ? 'var(--volt,#CCFF00)' : 'rgba(0,0,0,.6)'}" stroke-width=".8"/>
        ${bp ? '' : `<text x="${dx}" y="${dy - 3.4}" transform="rotate(16 ${dx} ${dy - 5})" fill="#1a1a1a" font-family="monospace" font-size="4.4" font-weight="700" text-anchor="middle">DAUR</text>`}</g>`;
    }

    // collar padding line
    out += `<path d="M96 ${s.heel + 6} C130 ${s.heel + 6} ${s.dipX - 24} ${s.dipY + 8} ${s.dipX} ${s.dipY + 8}" fill="none" stroke="${bp ? ink : 'rgba(255,255,255,.08)'}" stroke-width="${bp ? .7 : 2}" opacity="${bp ? .6 : 1}"/>`;
    out += '</g></svg>';
    return out;
  }

  window.DAUR_SHOE = { render, SHAPES };
})();
