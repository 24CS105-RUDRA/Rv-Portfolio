import gsap from 'gsap';
import { damp } from './motion.js';

export function initCustomCursor() {
  const preference = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
  const dot = document.querySelector('#cursor-dot');
  const ring = document.querySelector('#cursor-ring');
  const events = new AbortController();
  const signal = events.signal;
  let x = 0, y = 0, rx = 0, ry = 0, visible = false;
  function hide() {
    visible = false;
    dot.style.opacity = ring.style.opacity = '0';
    document.documentElement.classList.remove('custom-cursor');
  }
  function render(_, delta = 16.67) {
    if (!visible) return;
    const dt = Math.min(delta / 1000, 0.05);
    rx = damp(rx, x, 15, dt); ry = damp(ry, y, 15, dt);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
  }
  window.addEventListener('pointermove', event => {
    if (!preference.matches || event.pointerType !== 'mouse' || document.querySelector('dialog[open]')) {hide(); return;}
    x = event.clientX; y = event.clientY;
    if (!visible) {rx = x; ry = y;}
    visible = true;
    document.documentElement.classList.add('custom-cursor');
    dot.style.opacity = ring.style.opacity = '1';
    ring.classList.toggle('is-project', !!event.target.closest('[data-project]'));
  }, {passive: true, signal});
  document.addEventListener('pointerleave', hide, {signal});
  window.addEventListener('blur', hide, {signal});
  preference.addEventListener('change', hide, {signal});
  document.addEventListener('keydown', event => {if (event.key === 'Tab') hide();}, {signal});
  gsap.ticker.add(render);
  return () => {hide(); events.abort(); gsap.ticker.remove(render);};
}
