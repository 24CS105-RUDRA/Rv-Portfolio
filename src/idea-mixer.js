import gsap from 'gsap';
import {ideaHref} from './idea-bridge.js';

export const mixerBanks = [
  {
    key: 'problem', label: 'A little problem', lead: 'Help…',
    choices: [
      'campus newcomers find their way',
      'a small shop keep track of orders',
      'commuters understand their daily journey',
      'students make learning less overwhelming',
      'neighbours share useful resources',
      'people make an everyday task more accessible',
      'a community spot waste before it happens',
      'organisers make events easier to join',
    ],
  },
  {
    key: 'technology', label: 'A way to build it', lead: 'Using…',
    choices: [
      'a small web app',
      'sensors and a simple display',
      'a helpful AI assistant',
      'a clear data visualisation',
      'a QR check-in',
      'a voice-guided interface',
    ],
  },
  {
    key: 'constraint', label: 'A useful twist', lead: 'But…',
    choices: [
      'it still works without internet',
      'the budget is tiny',
      'personal data stays to a minimum',
      'it can be used with one hand',
      'it uses very little power',
      'a first-time visitor understands it',
      'the first prototype fits into a weekend',
    ],
  },
];

export function shuffleMixer(selection, locked, random = Math.random) {
  let changed = false;
  const next = selection.map((previous, index) => {
    if (locked[index]) return previous;
    const count = mixerBanks[index].choices.length;
    // Pick uniformly from every choice except the one already showing.
    const roll = Math.min(count - 2, Math.max(0, Math.floor(random() * (count - 1))));
    changed = true;
    return roll >= previous ? roll + 1 : roll;
  });
  return {selection: next, changed};
}

export function mixerBrief(selection) {
  return `What if we could help ${mixerBanks[0].choices[selection[0]]}, using ${mixerBanks[1].choices[selection[1]]}—but ${mixerBanks[2].choices[selection[2]]}?`;
}

const sketches = [
  '<path d="M14 49V21l18-9 18 9v28M14 27h36M26 49V36h12v13M23 21h1m16 0h1M8 49h48"/><path d="m44 8 4-5m7 13 6-1M6 14l5 2"/>',
  '<rect x="16" y="16" width="32" height="32" rx="6"/><path d="M25 5v11m14-11v11M25 48v11m14-11v11M5 25h11M5 39h11m32-14h11m-11 14h11M25 27l-5 5 5 5m14-10 5 5-5 5m-8 3 3-16"/>',
  '<path d="M19 20c0-15 26-15 26 0 0 10-10 10-10 20h-7M28 48h7m-7 8h7M5 29h7m40 0h7M10 9l5 5M50 9l-5 5"/><path d="m44 45 6 5 10-13"/>',
];
const lockIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg>';

export function initIdeaMixer() {
  const section = document.querySelector('#idea-mixer');
  if (!section) return () => {};
  const original = section.innerHTML;
  section.innerHTML = `
    <div class="mixer-heading"><p class="mixer-kicker">A small exercise in possibility</p><h2 id="mixer-title">What if<span>…</span></h2><p>Good ideas sometimes start with an odd combination. Pick a problem, a way to build it, and a twist. See what turns up.</p></div>
    <div class="mixer-workbench" data-pet-safe>
      <div class="mixer-reels">${mixerBanks.map((bank, index) => `
        <article class="mixer-card mixer-card--${bank.key}">
          <div class="mixer-card-top"><h3>${bank.label}</h3><button type="button" class="mixer-lock" data-mixer-lock="${index}" aria-pressed="false" aria-label="Keep ${bank.label.toLowerCase()} when shuffling">${lockIcon}<span>Keep</span></button></div>
          <svg class="mixer-sketch" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">${sketches[index]}</svg>
          <p class="mixer-lead">${bank.lead}</p><div class="mixer-window"><p class="mixer-choice" data-mixer-choice="${index}"></p></div>
          <button type="button" class="mixer-swap" data-mixer-swap="${index}">Try another ${index === 0 ? 'problem' : index === 1 ? 'approach' : 'twist'} <span aria-hidden="true">⚄</span></button>
        </article>`).join('')}</div>
      <div class="mixer-controls"><button type="button" class="mixer-shuffle">Shuffle the possibilities <span aria-hidden="true">✳</span></button><p class="mixer-status" role="status" aria-live="polite">Keep anything you like. Shuffle the rest.</p></div>
      <div class="mixer-brief" data-pet-safe><div class="mixer-brief-label"><label for="mixer-message">Your almost-idea</label><span class="mixer-pencil" aria-hidden="true">edit freely</span></div><textarea id="mixer-message" rows="3" maxlength="1500" data-lenis-prevent></textarea><div class="mixer-brief-bottom"><p>A starting point for a conversation. Edit it until it feels like yours.</p><a class="mixer-develop" href="/idea/">Develop this idea</a></div></div>
      <span class="mixer-stamp" aria-hidden="true">CURIOUS ENOUGH<br>TO TRY</span>
    </div>`;
  const events = new AbortController(), {signal} = events;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const locks = [...section.querySelectorAll('[data-mixer-lock]')];
  const cards = [...section.querySelectorAll('.mixer-card')];
  const choices = [...section.querySelectorAll('[data-mixer-choice]')];
  const brief = section.querySelector('#mixer-message');
  const develop = section.querySelector('.mixer-develop');
  const status = section.querySelector('.mixer-status');
  const stamp = section.querySelector('.mixer-stamp');
  let selection = [0, 1, 0], locked = [false, false, false], animation, disposed = false, pendingAnnouncement = '';

  function updateLink() {
    const message = brief.value.trim();
    develop.href = ideaHref({message, topic: 'Something strange', source: 'What if mixer'});
  }
  function stopMotion(announce = true) {
    animation?.kill();
    gsap.set([...choices, stamp], {clearProps: 'transform,opacity'});
    if (announce && pendingAnnouncement && !disposed) status.textContent = pendingAnnouncement;
    pendingAnnouncement = '';
  }
  function render(animate = [], announce = false) {
    stopMotion(false);
    selection.forEach((choice, index) => { choices[index].textContent = mixerBanks[index].choices[choice]; });
    brief.value = mixerBrief(selection); updateLink();
    pendingAnnouncement = announce ? `A new possibility: ${brief.value} You can edit the idea below.` : '';
    if (preference.matches || document.hidden || !animate.length) { stopMotion(); return; }
    animation = gsap.timeline({onComplete: () => { if (pendingAnnouncement && !disposed) status.textContent = pendingAnnouncement; pendingAnnouncement = ''; }})
      .fromTo(animate.map(index => choices[index]), {y: -34, opacity: .15, rotation: -2}, {y: 0, opacity: 1, rotation: 0, duration: .62, stagger: .08, ease: 'back.out(1.5)'})
      .fromTo(stamp, {scale: 1.2, rotation: -5, opacity: .15}, {scale: 1, rotation: 0, opacity: 1, duration: .25, ease: 'power2.out'}, '-=.12');
  }
  function shuffle(indices) {
    const mask = locked.map((keep, index) => keep || !indices.includes(index));
    const result = shuffleMixer(selection, mask);
    if (!result.changed) {
      status.textContent = 'These cards are being kept. Release a Keep button to try another possibility.';
      return;
    }
    selection = result.selection;
    render(indices.filter(index => !mask[index]), true);
  }
  locks.forEach((button, index) => button.addEventListener('click', () => {
    stopMotion(false);
    locked[index] = !locked[index];
    button.setAttribute('aria-pressed', String(locked[index]));
    button.querySelector('span').textContent = locked[index] ? 'Kept' : 'Keep';
    cards[index].classList.toggle('is-kept', locked[index]);
    status.textContent = `${mixerBanks[index].label} ${locked[index] ? 'kept. It will stay while you shuffle.' : 'released. You can shuffle it again.'}`;
  }, {signal}));
  section.querySelectorAll('[data-mixer-swap]').forEach(button => button.addEventListener('click', () => shuffle([Number(button.dataset.mixerSwap)]), {signal}));
  section.querySelector('.mixer-shuffle').addEventListener('click', () => shuffle([0, 1, 2]), {signal});
  brief.addEventListener('input', () => {stopMotion(false); updateLink();}, {signal});
  preference.addEventListener('change', () => stopMotion(), {signal});
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); }, {signal});
  window.addEventListener('portfolio:loop-start', () => stopMotion(), {signal});
  render();
  return () => {
    if (disposed) return; disposed = true;
    events.abort(); stopMotion(); section.innerHTML = original;
  };
}
