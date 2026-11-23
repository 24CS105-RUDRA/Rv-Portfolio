import { soundCue } from './sound.js';
import gsap from 'gsap';
import { closestStop, nextStop, wrap, damp } from './motion.js';

export function initGallery() {
  const gallery = document.querySelector('#project-gallery');
  const track = gallery.querySelector('.gallery-track');
  const cards = [...track.children];
  const count = document.querySelector('#gallery-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const signal = events.signal;
  const copies = [];
  // Keep the same dimensions in all three loop copies, even with 15 cards.
  const wideStates = cards.map(card => card.classList.contains('project-wide'));
  cards.forEach((card,index) => card.classList.toggle('project-wide',index%2===1));
  const copyCard = card => {
    const copy = card.cloneNode(true);
    copy.dataset.loopCopy = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('a').forEach(link => link.tabIndex = -1);
    copies.push(copy);
    return copy;
  };
  track.prepend(...cards.map(copyCard));
  track.append(...cards.map(copyCard));
  gallery.classList.add('is-enhanced');

  let stops = [], period = 0, position = 0, target = 0;
  let pointer = null, suppressClick = false, wheelTimer;
  let previousX = null, active = -1;
  let ticking = false, moving = false;
  function setMoving(value) {
    if (moving === value) return;
    moving = value; gallery.classList.toggle('is-moving', value);
    window.dispatchEvent(new CustomEvent('portfolio:gallery-motion', {detail: {moving: value}}));
  }
  function sleep() {gsap.ticker.remove(render); ticking = false;}
  function wake() {
    if (document.hidden) return;
    if (!reduced.matches && Math.abs(position-target)>.05) setMoving(true);
    if (!ticking) {ticking = true; gsap.ticker.add(render);}
  }
  function render(_, delta = 16.67) {
    if (!period || document.hidden) {sleep(); return;}
    const before = position;
    const dt = Math.min(delta / 1000, 0.05);
    position = reduced.matches ? target : damp(position, target, pointer ? 24 : 12, dt);
    if (Math.abs(position - target) < 0.05) position = target;
    const x = -period - wrap(position, period);
    if (x !== previousX) {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      previousX = x;
    }
    const local = wrap(closestStop(position, stops, period), period);
    const index = stops.reduce((best, stop, i) => Math.abs(stop - local) < Math.abs(stops[best] - local) ? i : best, 0);
    if (index !== active) {
      if(active>=0&&Math.abs(position-before)>.1&&!document.body.classList.contains('modal-open'))soundCue('gallery');
      active = index;
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
    if (position === target) {if(!pointer?.dragging)setMoving(false); sleep();}
  }
  function measure() {
    const index = Math.max(active, 0);
    const left = card => card.getBoundingClientRect().left;
    const first = left(cards[0]);
    stops = cards.map(card => left(card) - first);
    period = left(copies[cards.length]) - first;
    position = target = stops[index];
    previousX = null;
    gallery.scrollLeft = 0;
    render(0, 0);
  }
  const resize = new ResizeObserver(measure);
  resize.observe(gallery);
  measure();

  const move = direction => { target = nextStop(target, direction, stops, period); wake(); };
  document.querySelector('#gallery-prev').addEventListener('click', () => move(-1), {signal});
  document.querySelector('#gallery-next').addEventListener('click', () => move(1), {signal});
  gallery.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = stops.at(-1);
    else move(event.key === 'ArrowRight' ? 1 : -1);
    wake();
  }, {signal});
  gallery.addEventListener('focusin', event => {
    if (!event.target.matches(':focus-visible')) return;
    const card = event.target.closest('.project');
    const index = cards.indexOf(card);
    if (index < 0) return;
    position = target = stops[index];
    gallery.scrollLeft = 0;
    render(0, 0);
  }, {signal});
  gallery.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    target = position;
    suppressClick = false;
    pointer = {id: event.pointerId, x: event.clientX, y: event.clientY, start: position, lastX: event.clientX, time: event.timeStamp, velocity: 0, dragging: false};
  }, {signal});
  gallery.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      pointer.dragging = true;
      gallery.setPointerCapture(pointer.id);
      gallery.classList.add('is-dragging');
    }
    if (!pointer.dragging) return;
    const dt = Math.max(8, event.timeStamp - pointer.time);
    pointer.velocity = Math.max(-2.5, Math.min(2.5, -(event.clientX - pointer.lastX) / dt));
    pointer.lastX = event.clientX;
    pointer.time = event.timeStamp;
    target = pointer.start - dx;
    wake();
  }, {signal});
  function release(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const released = pointer;
    pointer = null;
    if (released.dragging) {
      const velocity = event.timeStamp - released.time < 100 && event.type !== 'pointercancel' ? released.velocity : 0;
      target = closestStop(target + velocity * 150, stops, period);
      suppressClick = true;
      wake();
    }
    gallery.classList.remove('is-dragging');
    if (gallery.hasPointerCapture(released.id)) gallery.releasePointerCapture(released.id);
  }
  window.addEventListener('pointerup', release, {signal});
  gallery.addEventListener('pointercancel', release, {signal});
  // Touch starts with implicit capture on the image/link. Its capture-loss
  // bubbles when we take capture for dragging; that is not the end of a swipe.
  gallery.addEventListener('lostpointercapture', event => {if(event.target===gallery)release(event);}, {signal});
  gallery.addEventListener('dragstart', event => event.preventDefault(), {signal});
  gallery.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
  }, {capture: true, signal});
  gallery.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
    if (!delta || (!event.shiftKey && (Math.abs(delta)<2 || Math.abs(delta)<Math.abs(event.deltaY)*.5))) return;
    event.preventDefault();
    event.lenisStopPropagation = true;
    event.stopPropagation();
    target += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1);
    wake();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { target = closestStop(target, stops, period); wake(); }, 120);
  }, {passive: false, signal});
  document.addEventListener('visibilitychange', () => {if(document.hidden){if(pointer)release({pointerId:pointer.id,type:'pointercancel',timeStamp:0});sleep();setMoving(false);}else wake();}, {signal});
  reduced.addEventListener('change', wake, {signal});

  return {
    reveal(id) {
      const index = cards.findIndex(card => card.querySelector('[data-project]').dataset.project === id);
      if (index >= 0) { position = target = stops[index]; render(0, 0); }
      return cards[index]?.querySelector('[data-project]');
    },
    destroy() {
      events.abort(); resize.disconnect(); sleep(); clearTimeout(wheelTimer); setMoving(false);
      copies.forEach(copy => copy.remove());
      cards.forEach((card,index)=>card.classList.toggle('project-wide',wideStates[index]));
      gallery.classList.remove('is-enhanced', 'is-dragging');
      track.style.removeProperty('transform');
      track.style.removeProperty('--slide-slip');
    },
  };
}
