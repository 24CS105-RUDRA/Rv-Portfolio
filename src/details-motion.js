import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initDetailsMotion() {
  const media = gsap.matchMedia();
  const titles = [...document.querySelectorAll('.project-caption h3')];
  titles.forEach(title => {
    const text = title.textContent;
    const mask = document.createElement('span');
    mask.className = 'project-title-mask';
    const label = document.createElement('span');
    label.className = 'project-title-label';
    label.textContent = text;
    const copy = document.createElement('span');
    copy.className = 'project-title-copy';
    copy.textContent = text;
    copy.setAttribute('aria-hidden', 'true');
    mask.append(label, copy);
    title.replaceChildren(mask);
  });
  const grids = [...document.querySelectorAll('.services, .contact')].map(section => {
    const grid = document.createElement('div');
    grid.className = 'section-drawing';
    grid.setAttribute('aria-hidden', 'true');
    grid.innerHTML = '<i></i><i></i><i></i><i></i>';
    section.prepend(grid);
    return grid;
  });
  media.add('(prefers-reduced-motion: no-preference)', () => {
    for (const grid of grids) {
      gsap.fromTo(grid.children, {scaleX: 0}, {
        scaleX: 1, duration: 1.25, stagger: .12, ease: 'power3.inOut',
        scrollTrigger: {trigger: grid.parentElement, start: 'top 85%', toggleActions: 'play none none reverse'},
      });
    }
  });
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const events = new AbortController();
    const targets = [...document.querySelectorAll('.top-nav nav a, .nav-brand')];
    const reset = el => gsap.to(el, {x: 0, y: 0, duration: .55, ease: 'elastic.out(1, .55)', overwrite: true});
    for (const el of targets) {
      let bounds;
      el.addEventListener('pointerenter', () => { bounds = el.getBoundingClientRect(); }, {signal: events.signal});
      el.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || !bounds) return;
        gsap.to(el, {
          x: gsap.utils.clamp(-7, 7, (event.clientX - bounds.left - bounds.width / 2) * .18),
          y: gsap.utils.clamp(-5, 5, (event.clientY - bounds.top - bounds.height / 2) * .18),
          duration: .3, ease: 'power3.out', overwrite: true,
        });
      }, {signal: events.signal});
      el.addEventListener('pointerleave', () => reset(el), {signal: events.signal});
      el.addEventListener('blur', () => reset(el), {signal: events.signal});
      el.addEventListener('click', () => reset(el), {signal: events.signal});
    }
    return () => {events.abort(); targets.forEach(el => {gsap.killTweensOf(el); gsap.set(el, {clearProps: 'transform'});});};
  });
  ScrollTrigger.refresh();
  return () => {
    media.revert();
    grids.forEach(grid => grid.remove());
    titles.forEach(title => title.textContent = title.querySelector('.project-title-label').textContent);
  };
}
