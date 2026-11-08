import gsap from 'gsap';
import { initExpressive } from './expressive.js';
import { initDetailsMotion } from './details-motion.js';
import { FluidSimulation } from './fluid.js';
import { initScroll } from './scroll.js';
import { initCustomCursor } from './cursor.js';
import { initProjects } from './projects.js';
import { initGallery } from './gallery.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const events = new AbortController();
let fluid;
let triedWebGL = false;

function syncFluid() {
  root.classList.toggle('reduced-motion', reduced.matches);
  if (reduced.matches) {
    fluid?.pause();
    root.classList.remove('fluid-ready');
    return;
  }
  if (!triedWebGL) {
    triedWebGL = true;
    try {
      fluid = new FluidSimulation(document.querySelector('#fluid-canvas'), {
        onReady: () => { if (!reduced.matches) root.classList.add('fluid-ready'); },
        onError: () => root.classList.remove('fluid-ready'),
      });
    } catch {
      // The static mark and paper wipe are visible if WebGL cannot run.
    }
  }
  fluid?.start();
  if (fluid?.available) root.classList.add('fluid-ready');
}

root.classList.replace('no-js', 'js');
syncFluid();
let flood = 0;
const scroll = initScroll(progress => { flood = progress; }, dark => fluid?.setTheme(dark));
const gallery = initGallery();
const disposeProjects = initProjects(scroll, gallery);
const disposeCursor = initCustomCursor();
const disposeDetails = initDetailsMotion();
const disposeExpressive = initExpressive();
const renderFluid = (time, delta) => {
  fluid?.setFloodProgress(flood);
  fluid?.updateFrame(time, delta);
};
gsap.ticker.add(renderFluid);

document.querySelector('#copyright-year').textContent = new Date().getFullYear();
reduced.addEventListener('change', () => {
  syncFluid();
  requestAnimationFrame(scroll.refresh);
}, {signal: events.signal});

if (import.meta.hot) import.meta.hot.dispose(() => {
  events.abort();
  gsap.ticker.remove(renderFluid);
  disposeExpressive();
  disposeDetails();
  disposeProjects();
  disposeCursor();
  gallery.destroy();
  scroll.destroy();
  fluid?.destroy();
});
