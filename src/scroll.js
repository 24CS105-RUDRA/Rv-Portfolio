import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scene } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(setFlood, onTheme = () => {}) {
  const state = {lenis: null, timeline: null};
  const events = new AbortController();
  const media = gsap.matchMedia();
  const header = document.querySelector('.top-nav');
  const experience = document.querySelector('#top');
  const stage = document.querySelector('#experience-stage');
  const work = document.querySelector('#work');
  const hero = document.querySelector('#hero-visual');
  const controls = document.querySelector('#top .hero-controls');
  const returnStage = document.querySelector('.return-stage');
  const links = [...header.querySelectorAll('nav a')];
  let active, firstBoundary = true;
  const changeTheme = () => {
    window.dispatchEvent(new Event("portfolio:theme"));
    const dark = document.documentElement.classList.toggle('theme-dark');
    onTheme(dark);
    document.querySelector('meta[name="theme-color"]').content = dark ? '#f6f5f2' : '#050505';
  };
  const setCurrent = id => {
    if (active === id) return;
    active = id;
    for (const link of links) {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const lenis = new Lenis({lerp: 0.09, smoothWheel: true, syncTouch: false, anchors: false});
    state.lenis = lenis;
    const finePointer = matchMedia('(pointer: fine)');
    const wheelEvents = new AbortController();
    let navMask = -1;
    const updateNavMask = () => {
      const fraction = finePointer.matches && lenis.progress > 0.7
        ? Math.max(0, Math.min(1, 1 - returnStage.getBoundingClientRect().top / (innerHeight * 0.8))) : 0;
      if (fraction !== navMask) {
        navMask = fraction;
        header.style.setProperty('--return-mask', (1 - fraction).toFixed(3));
        header.inert = fraction > 0.95;
      }
    };
    lenis.on('scroll', () => {
      ScrollTrigger.update();
      updateNavMask();
    });
    // The footer meets a second copy of the opening. At the seam the wheel
    // crosses to the matching frame, keeping touch and keyboard scrolling native.
    window.addEventListener('wheel', event => {
      if (!finePointer.matches || lenis.isStopped || event.ctrlKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const atEnd = lenis.limit - lenis.actualScroll < 1;
      if (atEnd && event.deltaY > 0) {
        firstBoundary = false;
        changeTheme();
        lenis.scrollTo(0, {immediate: true});
      } else if (lenis.actualScroll < 1 && event.deltaY < 0) {
        if (firstBoundary) {
          firstBoundary = false;
          // The first upward gesture reveals the beige footer immediately.
          lenis.scrollTo(Math.max(0, returnStage.offsetTop - innerHeight), {immediate: true});
        } else {
          changeTheme();
          lenis.scrollTo(lenis.limit, {immediate: true});
        }
      }
    }, {capture: true, passive: true, signal: wheelEvents.signal});
    const tick = time => lenis.raf(time * 1000);
    gsap.ticker.add(tick, false, true);
    if (document.body.classList.contains('modal-open')) lenis.stop();

    const workHead = work.querySelector('.work-heading');
    const workFoot = work.querySelector('.gallery-footer');
    const introLines = '.intro-title .line-mask > span';
    gsap.set(header, {autoAlpha: 0, y: -8});
    gsap.set('.scene-grid', {opacity: 0});
    gsap.set('.intro', {autoAlpha: 0});
    gsap.set(introLines, {yPercent: 112});
    gsap.set(work, {autoAlpha: 0});
    gsap.set('.gallery', {y: 45, clipPath: 'inset(100% 0% 0% 0%)'});
    gsap.set([workHead, workFoot], {opacity: 0, y: 10});
    work.inert = true;

    const liquid = {progress: 0};
    const timeline = gsap.timeline({
      defaults: {ease: 'none'},
      scrollTrigger: {
        trigger: '#top', start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: self => {
          controls.inert = self.progress > 0.095;
          work.inert = self.progress < 0.80;
          if (self.isActive || self.progress === 0) setCurrent(self.progress >= 0.80 ? 'work' : null);
        },
      },
    });
    state.timeline = timeline;
    timeline
      .to(controls, {autoAlpha: 0, duration: 0.07}, 0.025)
      .to(liquid, {
        progress: 1, duration: scene.floodEnd - scene.floodStart, ease: 'sine.inOut',
        onUpdate: () => setFlood(liquid.progress),
      }, scene.floodStart)
      .to('#fallback-logo .hero-mark', {scale: 2.9, duration: 0.32, ease: 'power2.in'}, scene.floodStart)
      .to('.hero-wash', {clipPath: 'circle(84% at 50% 46%)', duration: 0.31, ease: 'sine.inOut'}, 0.08)
      .to(hero, {autoAlpha: 0, duration: 0.085, ease: 'sine.inOut'}, scene.floodEnd - 0.05)
      .to(header, {autoAlpha: 1, y: 0, duration: 0.085, ease: 'power2.out'}, scene.floodEnd - 0.022)
      .to('.scene-grid', {opacity: 1, duration: 0.09}, scene.introIn + 0.027)
      .fromTo('.grid-columns > span', {scaleY: 0}, {scaleY: i => 0.95 - i * 0.049, duration: 0.13, stagger: 0.005, ease: 'power2.out'}, scene.introIn)
      .fromTo('.grid-rule', {scaleX: 0}, {scaleX: 1, duration: 0.13, stagger: 0.014, ease: 'power2.out'}, scene.introIn + 0.03)
      .to('.intro', {autoAlpha: 1, duration: 0.035}, scene.introIn + 0.055)
      .to(introLines, {yPercent: 0, duration: 0.105, stagger: 0.021, ease: 'power3.out'}, scene.introIn + 0.056)
      .to(introLines, {yPercent: -112, duration: 0.094, stagger: 0.017, ease: 'power2.inOut'}, scene.introOut)
      .to('.intro', {autoAlpha: 0, duration: 0.04}, 0.712)
      .to('.grid-columns > span', {scaleY: 1, duration: 0.16, stagger: 0.003, ease: 'sine.inOut'}, 0.63)
      .to('.scene-grid', {opacity: 0.23, duration: 0.14}, scene.workIn)
      .to(work, {autoAlpha: 1, duration: 0.055}, scene.workIn)
      .to('.gallery', {y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.175, ease: 'power3.out'}, scene.workIn)
      .to([workHead, workFoot], {opacity: 1, y: 0, duration: 0.105, stagger: 0.022, ease: 'power2.out'}, scene.workIn + 0.066)
      .to({}, {duration: 0.04}, 0.96);

    for (const element of document.querySelectorAll('.service, .contact')) {
      gsap.from(element.querySelectorAll('.line-mask > span'), {
        yPercent: 110, duration: 0.85, stagger: 0.075, ease: 'power3.out',
        scrollTrigger: {trigger: element, start: 'top 89%', once: true},
      });
    }
    for (const element of document.querySelectorAll('.service p, .service-links, .service > a, .services-note, .contact-note, .contact-address')) {
      gsap.from(element, {opacity: 0, y: 14, duration: 0.65, ease: 'power2.out',
        scrollTrigger: {trigger: element, start: 'top 94%', once: true}});
    }

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      wheelEvents.abort();
      header.inert = false;
      header.style.removeProperty('--return-mask');
      state.lenis = state.timeline = null;
      controls.inert = work.inert = false;
      setFlood(0);
    };
  });

  function scrollToSection(id, {focus = false, updateHash = false, immediate = false} = {}) {
    const target = document.getElementById(id);
    if (!target) return;
    let destination = target;
    if (state.timeline && ['top', 'intro', 'work'].includes(id)) {
      const progress = id === 'intro' ? scene.introAnchor : id === 'work' ? scene.workAnchor : 0;
      const start = experience.getBoundingClientRect().top + window.scrollY;
      destination = start + (experience.offsetHeight - stage.offsetHeight) * progress;
    }
    const finish = () => {
      if (focus) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
      }
      if (updateHash) history.replaceState(null, '', `#${id}`);
    };
    if (state.lenis) {
      state.lenis.scrollTo(destination, {
        immediate, force: immediate, duration: id === 'intro' ? 1.35 : 1.05, onComplete: finish,
        easing: t => t * t * (3 - 2 * t),
      });
    } else {
      target.scrollIntoView({behavior: 'instant'});
      finish();
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const id = link.hash.slice(1);
      if (link.closest('.return-stage') && state.lenis) { firstBoundary = false; changeTheme(); state.lenis.scrollTo(0, {immediate: true}); }
      scrollToSection(id, {focus: event.detail === 0, updateHash: true});
    }, {signal: events.signal});
  });

  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(entry => entry.isIntersecting);
    if (entry && (!state.timeline || !state.timeline.scrollTrigger.isActive)) setCurrent(entry.target.id);
  }, {rootMargin: '-12% 0px -63% 0px'});
  document.querySelectorAll('#work, #services, #contact').forEach(section => observer.observe(section));
  document.fonts.ready.then(() => {
    if (events.signal.aborted) return;
    ScrollTrigger.refresh();
    const id = location.hash.slice(1);
    if (['intro', 'work', 'services', 'contact'].includes(id)) scrollToSection(id, {immediate: true});
  });
  state.toSection = scrollToSection;
  state.refresh = () => ScrollTrigger.refresh();
  state.destroy = () => {events.abort(); media.revert(); observer.disconnect();};
  return state;
}
