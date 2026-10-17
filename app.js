/* ==========================================================
   LOLITA — interacciones
   Escaparate de noche: una máscara oscura con un círculo de luz
   que sigue al cursor (o al dedo); al iluminar una pieza durante
   un instante, se descubre su nombre. Percha con perchas que se
   balancean al arrastrar y vídeo dentro de un aro de luz.
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const STATIC = /[?&]static\b/.test(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGSAP && !reduced;
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const play = (v) => { if (!v) return; if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); };

/* ----------------------------------------------------------
   DATOS
   ---------------------------------------------------------- */
// puntos sobre cada foto, en coordenadas de la imagen (0–1)
const SPOTS = [
  { cell: 'a', u: .15, v: .35, t: 'Bota alta' },
  { cell: 'a', u: .55, v: .62, t: 'Bolso acolchado con cadena' },
  { cell: 'a', u: .76, v: .68, t: 'Sandalia de tacón ancho' },
  { cell: 'b', u: .32, v: .72, t: 'Sandalia metalizada · Menbur' },
  { cell: 'b', u: .58, v: .42, t: 'Bolso metalizado a juego' },
  { cell: 'c', u: .17, v: .33, t: 'Moda de temporada' },
  { cell: 'd', u: .65, v: .22, t: 'Cadena dorada · 52158' },
  { cell: 'e', u: .75, v: .55, t: 'Cristales · W66' }
];
const HANG = [
  ['tacones-color.jpg', 'Metalizadas', 'sandalia y bolso a juego · Menbur', 'NEW'],
  ['p-52158.jpg', 'Cadena dorada', 'sandalia de tacón', '52158'],
  ['p-w66.jpg', 'Cristales', 'chancla de cuña', 'W66'],
  ['p-52152.jpg', 'Flor', 'sandalia atada al tobillo', '52152'],
  ['p-w95.jpg', 'Flores', 'destalonado de tacón bajo', 'W95'],
  ['p-sneaker-blanca.jpg', 'Chunky', 'deportiva de suela gruesa', 'NEW'],
  ['p-8822.jpg', 'Plataforma', 'sandalia de tiras', '88-22'],
  ['p-2077.jpg', 'Zueco', 'de ante, siete colores', '2077']
];

/* ----------------------------------------------------------
   SCROLL · NAV · MENÚ
   ---------------------------------------------------------- */
let lenis = null;
if (motion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 30);
  nav.classList.toggle('is-hidden', y > 600 && y > lastY && !drawer.classList.contains('is-open'));
  lastY = y;
}, { passive: true });
const setDrawer = (open) => { burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open); document.body.style.overflow = open ? 'hidden' : ''; if (lenis) open ? lenis.stop() : lenis.start(); };
burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return;
  e.preventDefault(); setDrawer(false);
  if (lenis) lenis.scrollTo(t, { offset: -60 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));
if (motion) {
  gsap.from('.hero__title', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'power4.out' });
  gsap.from('.hero__k, .hero__rule, .hero__brands, .hero__down', { y: 24, opacity: 0, duration: 1, stagger: .1, delay: .3, ease: 'power3.out' });
  gsap.from('.hero__shop', { clipPath: 'inset(100% 0 0 0 round 200px 200px 16px 16px)', duration: 1.5, ease: 'power4.inOut', delay: .1 });
}

/* ----------------------------------------------------------
   ESCAPARATE DE NOCHE
   ---------------------------------------------------------- */
(() => {
  const vit = $('#vitrina'), grid = $('.vitrina__grid', vit), spotsBox = $('#spots');
  grid.classList.add('has-e');
  const cells = { a: $('.cell--a', vit), b: $('.cell--b', vit), c: $('.cell--c', vit), d: $('.cell--d', vit), e: $('.cell--e', vit) };
  spotsBox.innerHTML = SPOTS.map((s, i) => `<span class="spot" data-i="${i}"><i class="spot__dot"></i><span class="spot__label">${s.t}</span></span>`).join('');
  const els = $$('.spot', spotsBox);
  $('#foundT').textContent = SPOTS.length;
  const pos = [];
  // imagen con object-fit: cover → coordenadas dentro del recuadro
  const layout = () => {
    const vr = vit.getBoundingClientRect();
    SPOTS.forEach((s, i) => {
      const cell = cells[s.cell], img = $('img', cell), r = cell.getBoundingClientRect();
      const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1;
      const k = Math.max(r.width / iw, r.height / ih), dw = iw * k, dh = ih * k;
      const x = r.left - vr.left + (r.width - dw) / 2 + s.u * dw, y = r.top - vr.top + (r.height - dh) / 2 + s.v * dh;
      pos[i] = { x: clamp(x, r.left - vr.left + 10, r.right - vr.left - 10), y: clamp(y, r.top - vr.top + 10, r.bottom - vr.top - 10) };
      els[i].style.setProperty('--sx', pos[i].x + 'px'); els[i].style.setProperty('--sy', pos[i].y + 'px');
    });
  };
  const found = new Set(), dwell = new Map();
  const list = $('#foundList');
  const discover = (i) => {
    if (found.has(i)) return;
    found.add(i); els[i].classList.add('is-found');
    $('#foundN').textContent = found.size;
    list.insertAdjacentHTML('beforeend', `<li>${SPOTS[i].t}</li>`);
    if (motion) gsap.from(list.lastElementChild, { scale: .5, opacity: 0, duration: .5, ease: 'back.out(2)' });
    if (found.size === SPOTS.length) lightsOn();
  };
  // linterna
  let x = 0, y = 0, tx = 0, ty = 0, user = false, vis = false, raf = 0, lit = false, t0 = performance.now(), last = performance.now();
  const R = () => parseFloat(getComputedStyle(vit).getPropertyValue('--r')) || 170;
  const tick = (now) => {
    raf = 0;
    const dt = now - last; last = now;
    if (!user) { const t = (now - t0) / 1000, w = vit.clientWidth, h = vit.clientHeight; tx = w * (.5 + .38 * Math.sin(t * .55)); ty = h * (.5 + .32 * Math.sin(t * .9 + 1)); }
    x = lerp(x, tx, .16); y = lerp(y, ty, .16);
    vit.style.setProperty('--x', x + 'px'); vit.style.setProperty('--y', y + 'px');
    if (user && !lit) {
      const r = R() * .45;
      pos.forEach((p, i) => {
        if (found.has(i)) return;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < r) { const v = (dwell.get(i) || 0) + dt; dwell.set(i, v); if (v > 380) discover(i); } else dwell.set(i, 0);
      });
    }
    if (vis && !lit) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf && !lit) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const move = (e) => { const r = vit.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!user) { user = true; x = tx; y = ty; } go(); };
  vit.addEventListener('pointermove', move);
  vit.addEventListener('pointerdown', (e) => { move(e); vit.setPointerCapture(e.pointerId); });
  const lightsOn = () => {
    if (lit) return;
    lit = true; vit.classList.add('is-lit');
    els.forEach((el) => el.classList.add('is-found'));
    $('#lights span').textContent = 'Luces encendidas';
  };
  $('#lights').addEventListener('click', lightsOn);
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis) go(); }, { threshold: .15 }).observe(vit);
  const ready = () => { layout(); x = tx = vit.clientWidth / 2; y = ty = vit.clientHeight / 2; vit.style.setProperty('--x', x + 'px'); vit.style.setProperty('--y', y + 'px'); };
  $$('img', vit).forEach((im) => { if (!im.complete) im.addEventListener('load', layout, { once: true }); });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  ready();
  if (STATIC) { [0, 3, 6].forEach(discover); }
})();

/* ----------------------------------------------------------
   LA PERCHA · arrastre con balanceo
   ---------------------------------------------------------- */
(() => {
  const rail = $('#rail'), track = $('#railTrack');
  const hook = '<svg class="hang__hook" viewBox="0 0 90 80" aria-hidden="true"><path d="M45 26c0-8 9-8 9-16s-6-12-12-12-11 5-11 10" fill="none" stroke="#cfc8dc" stroke-width="4" stroke-linecap="round" transform="translate(0 10)"/><path d="M6 74L45 38l39 36" fill="none" stroke="#cfc8dc" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 74h78" stroke="#cfc8dc" stroke-width="5" stroke-linecap="round"/></svg>';
  track.innerHTML = HANG.map(([img, t, s, ref], i) => `
    <figure class="hang" data-i="${i}">${hook}
      <span class="hang__tag">${ref === 'NEW' ? 'NEW' : 'REF.<br>' + ref}</span>
      <div class="hang__card"><img src="assets/img/${img}" alt="${t}, ${s}" loading="lazy" draggable="false"></div>
      <figcaption class="hang__cap">${t}<small>${s}</small></figcaption>
    </figure>`).join('');
  const hangs = $$('.hang', track);
  const ang = hangs.map(() => ({ a: 0, v: 0 }));
  let x = 0, tx = 0, prev = 0, drag = false, sx = 0, sxx = 0, moved = 0, raf = 0, vis = false;
  const maxX = () => Math.min(0, -(track.scrollWidth - rail.clientWidth));
  const tick = () => {
    raf = 0;
    if (!drag) tx = clamp(tx, maxX(), 0);
    x = reduced ? tx : lerp(x, tx, .12);
    const vel = x - prev; prev = x;
    track.style.transform = `translate3d(${x}px,0,0)`;
    let active = Math.abs(x - tx) > .3 || drag;
    hangs.forEach((h, i) => {
      const s = ang[i];
      s.v += (-vel * .9 - s.a * .06) * (reduced ? 0 : 1); s.v *= .9; s.a += s.v;
      s.a = clamp(s.a, -24, 24);
      h.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
      if (Math.abs(s.a) > .05 || Math.abs(s.v) > .05) active = true;
    });
    if (active && vis) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
  rail.addEventListener('pointerdown', (e) => { drag = true; moved = 0; sx = e.clientX; sxx = tx; rail.classList.add('is-drag'); go(); });
  window.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); tx = clamp(sxx + dx, maxX() - 80, 80); go(); });
  window.addEventListener('pointerup', () => { if (!drag) return; drag = false; rail.classList.remove('is-drag'); go(); });
  rail.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); tx -= e.deltaX; go(); } }, { passive: false });
  // empujón al pasar el ratón
  hangs.forEach((h, i) => h.addEventListener('pointerenter', (e) => { if (!drag && !reduced) { ang[i].v += (e.movementX || 2) * .4; go(); } }));
  // visor
  const lb = $('#lb');
  track.addEventListener('click', (e) => {
    const h = e.target.closest('.hang'); if (!h || moved > 6) return;
    const [img, t, s] = HANG[+h.dataset.i];
    $('#lbImg').src = 'assets/img/' + img; $('#lbImg').alt = t; $('#lbCap').textContent = `${t} · ${s}`;
    lb.hidden = false; if (lenis) lenis.stop(); $('.lb__close', lb).focus();
  });
  const close = () => { lb.hidden = true; if (lenis) lenis.start(); };
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb__close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis) { // al entrar, un pequeño vaivén
    if (!reduced) ang.forEach((s, i) => { s.v = (i % 2 ? 1 : -1) * 2.2; }); go(); } }, { threshold: .2 }).observe(rail);
})();

/* ----------------------------------------------------------
   VÍDEO
   ---------------------------------------------------------- */
(() => {
  const v = $('.ring__phone video');
  new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!reduced) play(v); } else v.pause(); }, { threshold: .3 }).observe(v);
})();

/* ----------------------------------------------------------
   APARICIONES
   ---------------------------------------------------------- */
if (motion) {
  $$('.sec-head, .vitrina__ui, .ringlight__copy, .visita__copy').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  gsap.from('.vitrina', { scale: .94, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.vitrina', start: 'top 85%' } });
  gsap.from('.hang__card, .hang__tag, .hang__cap', { y: -60, opacity: 0, duration: 1, stagger: .03, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '#rail', start: 'top 85%' } });
  gsap.from('.ring__phone', { y: 80, rotation: -8, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.ringlight', start: 'top 75%' } });
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
})();
