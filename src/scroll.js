/**
 * Scroll experience module:
 * Unified GSAP pinned scrub timeline with Lenis smooth scroll
 * 0% - 20%: Hold on interactive logo
 * 20% - 70%: Set uReturn to 0 and expand ink flood outward until solid black
 * 70% - 100%: 12-column headline reveal (words slide up staggered from masks)
 * Touch targets >= 44px, full accessibility & fallback
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(fluidSim) {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize Lenis smooth scroll
  const lenis = new Lenis({
    lerp: 0.09,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Scroll Top interactive button (touch target >= 44px)
  const btnScrollTop = document.getElementById('btn-scroll-top');
  if (btnScrollTop) {
    btnScrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(0, { duration: 1.4 });
    });
  }

  // Elements
  const heroWrapper = document.getElementById('hero-wrapper');
  const heroPin = document.getElementById('hero-pin');
  const scrollDown = document.getElementById('scroll-down');
  const headlineOverlay = document.getElementById('headline-container');
  const words = document.querySelectorAll('.headline-main .word');
  const metaItems = document.querySelectorAll('.headline-meta .meta-item');
  const fallbackLogo = document.getElementById('fallback-logo');

  if (isReducedMotion || !fluidSim) {
    // Reduced motion / Fallback timeline: simple clean fade
    if (fallbackLogo) fallbackLogo.style.display = 'block';

    const fallbackTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroWrapper,
        start: 'top top',
        end: '+=150%',
        pin: heroPin,
        scrub: true,
      }
    });

    if (scrollDown) {
      fallbackTl.to(scrollDown, { opacity: 0, duration: 0.15 }, 0);
    }
    if (fallbackLogo) {
      fallbackTl.to(fallbackLogo, { opacity: 0, duration: 0.4 }, 0.2);
    }
    fallbackTl.to(heroPin, { backgroundColor: '#050505', duration: 0.4 }, 0.2);
    fallbackTl.to(headlineOverlay, { autoAlpha: 1, duration: 0.2 }, 0.6);
    fallbackTl.to(words, { opacity: 1, y: '0%', stagger: 0.02, duration: 0.3 }, 0.7);
    fallbackTl.to(metaItems, { opacity: 1, y: 0, stagger: 0.02, duration: 0.2 }, 0.75);

    return { lenis };
  }

  // Master scrub timeline pinned for 150vh
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: heroWrapper,
      start: 'top top',
      end: '+=150%',
      pin: heroPin,
      scrub: 0.5,
    }
  });

  // State object to scrub flood smoothly
  const floodState = { progress: 0.0 };

  // 1. Scroll-down indicator fade out (0% to 15%)
  if (scrollDown) {
    masterTl.to(scrollDown, {
      opacity: 0,
      y: 15,
      duration: 0.15,
      ease: 'power1.out',
    }, 0);
  }

  // 2. 20% to 70%: Ink flood spreads from logo outward into solid black ink
  masterTl.to(floodState, {
    progress: 1.0,
    duration: 0.50,
    ease: 'power1.inOut',
    onUpdate: () => {
      fluidSim.setFloodProgress(floodState.progress);
    },
  }, 0.20);

  // 3. 70% to 100%: Screen is solid black ink, headline builds in on 12-column grid
  if (headlineOverlay) {
    masterTl.to(headlineOverlay, {
      autoAlpha: 1,
      duration: 0.08,
    }, 0.68);
  }

  // Words slide up from masks (overflow hidden), staggered
  masterTl.fromTo(words, {
    y: '115%',
    opacity: 0,
  }, {
    y: '0%',
    opacity: 1,
    stagger: 0.025,
    duration: 0.28,
    ease: 'power3.out',
  }, 0.70);

  // Meta sidebar items slide in
  masterTl.fromTo(metaItems, {
    y: 24,
    opacity: 0,
  }, {
    y: 0,
    opacity: 1,
    stagger: 0.04,
    duration: 0.22,
    ease: 'power2.out',
  }, 0.75);

  return { lenis, masterTl };
}
