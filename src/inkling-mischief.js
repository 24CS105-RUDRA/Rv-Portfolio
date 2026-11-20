import gsap from 'gsap';
import {soundCue} from './sound.js';

const remarks = {
  start: ['Portfolio Rudra ka. Button mera.', 'Button toh gaya. Ab izzat bacha lo.', 'Do not press padha tha? Main bhi nahi maanta.', 'Bas button udhaar liya. EMI pe.'],
  dodge: ['Mouse fast. Main faster. Thoda.', 'Arre, LinkedIn pe connect kar pehle.', 'Resume mein likh dena: almost caught a blob.', 'Yeh catch-up meeting cancel hai.', 'Bhai, cursor hai ya Sunday walk?', 'Main WFH pe hoon. Haath mat lagao.', 'Skill issue? Nahi nahi, network issue.', 'Pakad ke dikha. HR nahi hoon main.'],
  ready: ['Achha baba. Ab bhaagunga nahi.', 'Thak gaya. Gym membership yaad aa gayi.', 'Fine. Ek win tum bhi le lo.', 'Ab seedha click. Negotiation khatam.'],
  caught: ['Pakad liya? Screenshot le. Rare moment hai.', 'Button le lo. Credit mera hi rahega.', 'Okay boss. Portfolio tumhara. Drama mera.', 'Promotion milegi? Chief Tiny Problem.'],
};

/** A short opt-in encounter using the existing pet, never a second game actor. */
export function createInklingMischief(adapter) {
  const {pet, play, blob, position, stopTravel, say, bounds, preference, pauseRoam, resumeRoam, reset, setState} = adapter;
  const events = new AbortController(), {signal} = events;
  const stolen = document.createElement('span');
  stolen.className = 'inkling-stolen'; stolen.textContent = 'DO NOT PRESS';
  stolen.setAttribute('aria-hidden', 'true'); stolen.hidden = true; pet.append(stolen);
  let phase = 'idle', dodges = 0, generation = 0, motion, deadline, disposed = false;
  let readyAt = 0, previousGoal, savedLabel, savedDescription, previousRemark = '', touchOrigin;
  const active = () => phase !== 'idle';
  const emit = (nextPhase, extra = {}) => window.dispatchEvent(new CustomEvent('portfolio:mischief-state', {
    detail: {phase: nextPhase, dodges, x: position.x + 58, y: position.y + 65, ...extra},
  }));
  function remark(kind) {
    const pool = remarks[kind].filter(text => text !== previousRemark);
    previousRemark = pool[Math.floor(Math.random() * pool.length)]; say(previousRemark);
  }
  function chaseArea() {
    const hud = document.querySelector('.mischief-hud');
    const hudBox = hud && !hud.hidden ? hud.getBoundingClientRect() : null;
    const wantedTop = Math.max(innerHeight >= 340 ? 150 : 78, hudBox?.height > 0 ? hudBox.bottom + 18 : 0);
    const ceiling = Math.max(78, innerHeight - 185);
    return {top: Math.min(wantedTop, ceiling), fits: innerWidth >= 220 && innerHeight >= 300 && wantedTop <= ceiling};
  }
  function chaseBounds(x, y) {
    // The child button is enlarged, not its translated parent. Leave room for
    // its 114×117 hit target, the stolen label, header, and sound controls.
    const {top} = chaseArea();
    return {
      x: Math.max(12, Math.min(Math.max(12, innerWidth - 156), x)),
      y: Math.max(top, Math.min(Math.max(top, innerHeight - 235), y)),
    };
  }
  function nextGoal(pointer = position) {
    const left = chaseBounds(18, 150), right = chaseBounds(innerWidth - 160, innerHeight - 240);
    const candidates = [
      {x: left.x, y: left.y}, {x: right.x, y: left.y},
      {x: left.x, y: right.y}, {x: right.x, y: right.y},
    ];
    const score = goal => Math.hypot(goal.x - pointer.x, goal.y - pointer.y)
      + Math.hypot(goal.x - position.x, goal.y - position.y) * .45
      - (previousGoal && goal.x === previousGoal.x && goal.y === previousGoal.y ? 1000 : 0);
    const goal = candidates.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best, candidates[0]);
    previousGoal = goal; return goal;
  }
  function clearMotion() {
    motion?.kill(); motion = null; stopTravel();
    gsap.set(blob, {clearProps: 'transform,opacity'});
  }
  function restoreLabel() {
    if (savedLabel == null) play.removeAttribute('aria-label'); else play.setAttribute('aria-label', savedLabel);
    if (savedDescription == null) play.removeAttribute('aria-describedby'); else play.setAttribute('aria-describedby', savedDescription);
  }
  function release() {
    clearTimeout(deadline); deadline = null; touchOrigin = null; clearMotion();
    pet.classList.remove('is-mischief', 'is-mischief-caught'); stolen.hidden = true;
    restoreLabel(); blob.dataset.shape = 'blob'; Object.assign(position, bounds(position.x, position.y));
    setState('roaming'); if (!disposed) resumeRoam();
  }
  function stop(reason = 'cancelled') {
    if (!active()) return false;
    generation++; phase = 'idle'; release();
    if (!disposed) emit('cancelled', {reason});
    if (reason === 'timeout' && !document.hidden) say('Bas, leg day done. Button le lo.');
    return true;
  }
  function start(detail = {}) {
    if (disposed || active() || document.hidden || document.body.classList.contains('modal-open')) return false;
    // reset() schedules normal roaming, so pause only after the reset finishes.
    reset({quiet: true}); pauseRoam(); stopTravel();
    savedLabel = play.getAttribute('aria-label'); savedDescription = play.getAttribute('aria-describedby');
    phase = 'chase'; dodges = 0; previousGoal = null;
    const current = ++generation;
    pet.classList.add('is-mischief'); pet.classList.remove('is-mischief-caught'); stolen.hidden = false;
    blob.dataset.shape = 'blob'; setState('mischief');
    play.setAttribute('aria-label', 'Catch Inkling and get the button back. Enter or Space catches him immediately.');
    play.removeAttribute('aria-describedby');
    const r = detail.rect;
    if (r && [r.left, r.top, r.width, r.height].every(Number.isFinite)) {
      Object.assign(position, chaseBounds(r.left + r.width / 2 - 52, r.top + r.height / 2 - 65));
    } else Object.assign(position, chaseBounds(position.x, position.y));
    readyAt = performance.now() + 650;
    remark('start'); soundCue('pickup'); emit('chase');
    // The HUD becomes visible synchronously in the state listener. Re-measure
    // before the next paint so the pet never sits beneath its action buttons.
    Object.assign(position, chaseBounds(position.x, position.y));
    if (!chaseArea().fits) { catchPet({detail: 0, instant: true, reason: 'small-viewport'}); return true; }
    deadline = setTimeout(() => {if (generation === current && active()) stop('timeout');}, 20000);
    if (!preference.matches) {
      const goal = nextGoal();
      motion = gsap.timeline()
        .fromTo(blob, {scaleX: .55, scaleY: 1.35, rotation: -14}, {scaleX: 1.15, scaleY: .87, rotation: 9, duration: .19, ease: 'power2.out'}, 0)
        .to(position, {...goal, duration: .58, ease: 'power3.inOut'}, .07)
        .to(blob, {scaleX: 1, scaleY: 1, rotation: 0, duration: .38, ease: 'elastic.out(1,.5)'}, .27);
    }
    if (detail.keyboard) play.focus({preventScroll: true});
    return true;
  }
  function dodge(event = {}) {
    if (phase !== 'chase') return active();
    if (preference.matches || event.pointerType && event.pointerType !== 'mouse' || play.matches(':focus-visible')) return true;
    if (dodges >= 2 || performance.now() < readyAt) return true;
    const pointer = {x: Number.isFinite(event.clientX) ? event.clientX : position.x + 58, y: Number.isFinite(event.clientY) ? event.clientY : position.y + 65};
    dodges++; readyAt = performance.now() + 550;
    clearMotion(); pauseRoam(); blob.dataset.shape = dodges === 1 ? 'drop' : 'puff';
    soundCue('dodge'); remark(dodges === 2 ? 'ready' : 'dodge');
    const goal = nextGoal(pointer);
    motion = gsap.timeline()
      .to(blob, {scaleX: 1.3, scaleY: .7, rotation: goal.x < position.x ? -15 : 15, duration: .12})
      .to(position, {...goal, duration: .45, ease: 'power3.inOut'}, 0)
      .to(blob, {scaleX: 1, scaleY: 1, rotation: 0, duration: .34, ease: 'elastic.out(1,.45)'}, .27);
    if (dodges === 2) play.setAttribute('aria-label', 'Inkling has stopped dodging. Catch him and get the button back.');
    emit('chase'); return true;
  }
  function catchPet(event = {}) {
    if (phase !== 'chase') return active();
    // A focused keyboard or touch target stays a target. Only a fine mouse is
    // teased, for at most two dodges, and a real click always wins the encounter.
    clearTimeout(deadline); deadline = null; clearMotion(); pauseRoam();
    phase = 'caught'; const current = ++generation;
    pet.classList.add('is-mischief-caught'); play.setAttribute('aria-label', 'You caught Inkling. The button is coming back.');
    blob.dataset.shape = 'puff'; remark('caught'); soundCue('pop');
    const won = () => {
      if (disposed || generation !== current || phase !== 'caught') return;
      phase = 'idle'; release(); emit('caught', {reason: event.reason || (event.detail === 0 ? 'keyboard' : 'catch')});
    };
    const burst = () => {
      if (disposed || generation !== current || phase !== 'caught') return;
      window.dispatchEvent(new CustomEvent('portfolio:mischief-burst', {detail: {x: position.x + 58, y: position.y + 65}}));
      soundCue('restore');
    };
    if (preference.matches || event.instant) {burst(); won(); return true;}
    motion = gsap.timeline({onComplete: won})
      .to(blob, {scaleX: 1.65, scaleY: 1.7, rotation: -6, duration: .25, ease: 'back.out(1.5)'})
      .call(burst)
      .to(blob, {scaleX: .65, scaleY: .5, rotation: 12, duration: .12, ease: 'power2.in'})
      .to(blob, {scaleX: 1, scaleY: 1, rotation: 0, duration: .48, ease: 'elastic.out(1,.38)'});
    return true;
  }
  window.addEventListener('keydown', event => {if (event.key === 'Escape') stop('escape');}, {signal});
  window.addEventListener('wheel', () => stop('scroll'), {signal, passive: true, capture: true});
  window.addEventListener('touchstart', event => {
    if (!active()) return;
    touchOrigin = event.touches.length === 1 ? {x: event.touches[0].clientX, y: event.touches[0].clientY} : null;
    if (event.touches.length > 1) stop('scroll');
  }, {signal, passive: true});
  window.addEventListener('touchmove', event => {
    if (!active()) return;
    if (event.touches.length !== 1) {stop('scroll'); return;}
    if (touchOrigin && Math.hypot(event.touches[0].clientX - touchOrigin.x, event.touches[0].clientY - touchOrigin.y) > 16) stop('scroll');
  }, {signal, passive: true});
  const endTouch = () => {touchOrigin = null;};
  window.addEventListener('touchend', endTouch, {signal, passive: true});
  window.addEventListener('touchcancel', endTouch, {signal, passive: true});
  window.addEventListener('resize', () => stop('resize'), {signal});
  document.addEventListener('visibilitychange', () => {if (document.hidden) stop('hidden');}, {signal});
  window.addEventListener('portfolio:project-art', event => {if (!event.detail?.closing) stop('project');}, {signal});
  window.addEventListener('portfolio:loop-start', () => stop('loop'), {signal});
  window.addEventListener('portfolio:contact-focus', event => {if (event.detail?.focused) stop('writing');}, {signal});
  document.addEventListener('click', event => {if (event.target?.closest?.('a')) stop('navigation');}, {signal, capture: true});
  preference.addEventListener('change', () => stop('motion-preference'), {signal});
  return {
    get active() {return active();}, start, catchPet, dodge, stop,
    destroy() {
      if (disposed) return; disposed = true; stop('destroy');
      events.abort(); clearTimeout(deadline); motion?.kill(); stolen.remove();
    },
  };
}
