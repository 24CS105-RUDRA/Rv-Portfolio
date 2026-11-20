import gsap from 'gsap';
import {soundCue} from './sound';

// A reversible atmosphere around the document. The document itself never moves.
export function createRageAtmosphere() {
  const events = new AbortController(), {signal} = events;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'inkling-rage-atmosphere'; layer.hidden = true;
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `<div class="rage-wash"></div><svg class="rage-fractures" viewBox="0 0 1200 800" preserveAspectRatio="none" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="m0 133 56 32-17 38 84 35-14 32 86 36m-139-141 16-43-31-33m68 181 24-21 45 12M1200 535l-62-28 18-44-84-29 16-49-78-41m128 163-37 38 16 27m-29-187-36 10-31-23M395 0l16 41-28 29 48 57-18 36m-2-122 36 7 19 30M806 800l-12-42 33-35-33-40 14-35m19 75 38-5 22 24"/></g></svg><span class="rage-word">ENOUGH.</span><span class="rage-aside">ab meri baari.</span><i class="rage-impact-wave"></i><i class="rage-impact-core"></i>`;
  document.body.append(layer);
  const wash = layer.querySelector('.rage-wash');
  const fractures = layer.querySelector('.rage-fractures');
  const wave = layer.querySelector('.rage-impact-wave');
  const core = layer.querySelector('.rage-impact-core');
  const tweens = new Set();
  let active = false, disposed = false, reducedMode = false;

  function animate(target, vars) {
    let tween;
    tween = gsap.to(target, {...vars, onComplete: () => tweens.delete(tween), onInterrupt: () => tweens.delete(tween)});
    tweens.add(tween); return tween;
  }
  function clearMotion() {
    for (const tween of [...tweens]) tween.kill();
    tweens.clear();
    gsap.set([layer, wash, fractures, wave, core], {clearProps: 'transform,opacity'});
  }
  function start({reduced = preference.matches} = {}) {
    if (disposed || document.hidden) return false;
    clearMotion(); active = true; reducedMode = !!reduced || preference.matches;
    layer.hidden = false; layer.dataset.reduced = String(reducedMode);
    document.body.classList.add('rage-atmosphere-active');
    soundCue('anger');
    if (reducedMode) return true;
    gsap.set(layer, {opacity: 0});
    animate(layer, {opacity: 1, duration: .58, ease: 'power2.out'});
    gsap.set(fractures, {opacity: 0});
    animate(fractures, {opacity: 1, duration: .85, delay: .12, ease: 'power2.out'});
    return true;
  }
  function impact({x = innerWidth / 2, y = innerHeight / 2, strength = 1} = {}) {
    if (!active || disposed || document.hidden) return false;
    soundCue('impact'); soundCue('crumble');
    if (reducedMode || preference.matches) return true;
    // One wave and one short edge recoil per landing; no strobe or endless shake.
    for (const tween of [...tweens]) if (tween.targets().some(target => [wash, wave, core].includes(target))) tween.kill();
    const hitX = Math.max(0, Math.min(innerWidth, Number.isFinite(x) ? x : innerWidth / 2));
    const hitY = Math.max(64, Math.min(innerHeight, Number.isFinite(y) ? y : innerHeight / 2));
    const weight = Math.max(.65, Math.min(1.6, Number.isFinite(strength) ? strength : 1));
    gsap.set(wave, {x: hitX, y: hitY, scale: .2, opacity: .65});
    gsap.set(core, {x: hitX, y: hitY, scale: .2, opacity: .5});
    animate(wave, {scale: 12 * weight, opacity: 0, duration: .8, ease: 'power2.out'});
    animate(core, {scale: 5 * weight, opacity: 0, duration: .5, ease: 'power2.out'});
    gsap.set(wash, {x: -5 * weight, y: 3 * weight});
    animate(wash, {x: 0, y: 0, duration: .38, ease: 'elastic.out(1,.32)'});
    return true;
  }
  function stop() {
    active = false; clearMotion(); layer.hidden = true;
    document.body.classList.remove('rage-atmosphere-active'); delete layer.dataset.reduced;
  }
  document.addEventListener('visibilitychange', () => {if (document.hidden) stop();}, {signal});
  preference.addEventListener('change', stop, {signal});
  return {
    start, impact, stop,
    destroy() {if (disposed) return; stop(); disposed = true; events.abort(); layer.remove();},
  };
}
