/**
 * Main application entrypoint
 * Rudra Vaghela — Portfolio Hero
 */

import './style.css';
import { FluidSimulation } from './fluid.js';
import { initScroll } from './scroll.js';
import { initCustomCursor } from './cursor.js';

// Mark JavaScript enabled
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

function bootstrap() {
  const canvas = document.getElementById('fluid-canvas');
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let fluidSim = null;

  if (!isReducedMotion && canvas) {
    try {
      fluidSim = new FluidSimulation(canvas);
      fluidSim.start();
    } catch (err) {
      console.warn('WebGL Fluid simulation unavailable, initializing fallback:', err);
      const fallbackLogo = document.getElementById('fallback-logo');
      if (fallbackLogo) fallbackLogo.style.display = 'block';
    }
  } else {
    const fallbackLogo = document.getElementById('fallback-logo');
    if (fallbackLogo) fallbackLogo.style.display = 'block';
  }

  // Initialize smooth scroll & pinned scrub timeline
  initScroll(fluidSim);

  // Initialize custom interactive cursor (dot enclosed by circle ring)
  initCustomCursor();
}

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
