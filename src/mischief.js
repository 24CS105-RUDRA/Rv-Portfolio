import gsap from 'gsap';

// One invitation, then the existing roaming pet becomes the whole-page toy.
export function initMischief({scroll} = {}) {
  const section = document.querySelector('#playground');
  if (!section) return () => {};
  const original = section.innerHTML;
  const events = new AbortController(), {signal} = events;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 'idle', keyboard = false, disposed = false, motion;
  section.innerHTML = `
    <div class="mischief-topline"><span>A brief lapse in professionalism</span><span>Inkling was left unsupervised.</span></div>
    <div class="mischief-poster">
      <div class="mischief-copy"><h2 id="playground-title" tabindex="-1"><span class="mischief-title-outline">SERIOUSLY.</span><span class="mischief-title-solid">DON’T.</span></h2><p class="mischief-one-liner">He has been waiting for this.</p></div>
      <div class="mischief-pedestal" data-pet-safe>
        <span class="mischief-button-note">ab mat bolna.</span>
        <div class="mischief-button-space"><button type="button" class="mischief-launch" aria-label="Do not press. Start a short playful chase with Inkling."><span>DO<br>NOT<br>PRESS.</span><svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M20 6v17m0 7v3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></button><span class="mischief-stolen-mark" aria-hidden="true">he took it.</span><div class="mischief-reward" hidden aria-hidden="true"><svg viewBox="0 0 140 140"><path d="M70 9 82 19 98 15 104 30 121 36 117 53 130 65 119 79 123 96 106 103 100 120 83 116 70 130 57 118 40 122 34 105 16 99 21 81 9 69 20 55 16 38 33 32 39 15 57 20Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m45 68 18 20 34-40" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Worth it.</span></div></div>
      </div>
    </div>
    <div class="mischief-bottom"><p class="mischief-status" role="status" aria-live="polite">Go on. Be that person.</p><div class="mischief-result-actions" hidden data-pet-safe><a href="#work" class="mischief-see-work">See what I build</a><a href="/idea/">Have a better idea?</a><button type="button" class="mischief-again">Again. Obviously.</button></div><span class="mischief-side-note">No useful button was harmed.</span></div>`;

  const launcher = section.querySelector('.mischief-launch');
  const title = section.querySelector('#playground-title');
  const outline = section.querySelector('.mischief-title-outline');
  const solid = section.querySelector('.mischief-title-solid');
  const oneLiner = section.querySelector('.mischief-one-liner');
  const status = section.querySelector('.mischief-status');
  const reward = section.querySelector('.mischief-reward');
  const actions = section.querySelector('.mischief-result-actions');
  const hud = document.createElement('aside');
  hud.className = 'mischief-hud'; hud.hidden = true; hud.setAttribute('aria-label', 'Inkling is playing');
  hud.innerHTML = '<div class="mischief-hud-copy"><p>Catch the little thief.</p><span>He can only dodge twice. You’ve got this.</span></div><div class="mischief-hud-actions" data-pet-safe><button type="button" data-mischief-catch>Catch Inkling</button><button type="button" data-mischief-stop>Finish playing <span aria-hidden="true">×</span></button></div>';
  document.body.append(hud);

  function settle() {motion?.kill(); motion = null; gsap.set([title, reward], {clearProps: 'transform,opacity'});}
  function present(next) {
    phase = next; section.dataset.mischief = next;
    launcher.classList.toggle('is-stolen', next === 'chase');
    launcher.disabled = next === 'chase';
    launcher.hidden = next === 'caught'; reward.hidden = next !== 'caught'; actions.hidden = next !== 'caught';
    hud.hidden = next !== 'chase'; document.body.classList.toggle('mischief-active', next === 'chase');
    if (next === 'idle') {
      outline.textContent = 'SERIOUSLY.'; solid.textContent = 'DON’T.';
      oneLiner.textContent = 'He has been waiting for this.'; status.textContent = 'Go on. Be that person.';
    } else if (next === 'chase') {
      outline.textContent = 'TOO LATE.'; solid.textContent = 'IT’S HIS.';
      oneLiner.textContent = 'Aaaand there goes the button.'; status.textContent = 'Catch Inkling anywhere on the screen—or use “Catch Inkling”.';
    } else {
      outline.textContent = 'FINE.'; solid.textContent = 'YOU WIN.';
      oneLiner.textContent = 'You caught a tiny problem. I solve bigger ones.';
      status.textContent = 'Proud of you. Slightly worried about your impulse control.';
    }
  }
  function launch(event) {
    if (phase === 'chase' || disposed) return;
    settle(); keyboard = event.detail === 0;
    // A replay measures the same physical button after restoring its layout.
    if (phase === 'caught') present('idle');
    const {left, top, width, height} = launcher.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('portfolio:mischief-start', {detail: {rect: {left, top, width, height}, keyboard}}));
  }
  launcher.addEventListener('click', launch, {signal});
  section.querySelector('.mischief-again').addEventListener('click', launch, {signal});
  hud.querySelector('[data-mischief-catch]').addEventListener('click', () => window.dispatchEvent(new CustomEvent('portfolio:mischief-catch', {detail: {accessible: true}})), {signal});
  hud.querySelector('[data-mischief-stop]').addEventListener('click', () => window.dispatchEvent(new CustomEvent('portfolio:mischief-stop', {detail: {reason: 'user'}})), {signal});
  section.querySelector('.mischief-see-work').addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !scroll?.toSection) return;
    event.preventDefault(); scroll.toSection('work', {focus: true, updateHash: true});
  }, {signal});
  window.addEventListener('portfolio:mischief-state', event => {
    if (disposed) return;
    const {phase: next, dodges = 0, reason} = event.detail || {};
    if (!['chase', 'caught', 'cancelled'].includes(next)) return;
    const focusResult = keyboard || hud.contains(document.activeElement);
    settle();
    if (next === 'cancelled') {
      present('idle');
      if (reason === 'user' || reason === 'escape') launcher.focus({preventScroll: true});
      return;
    }
    present(next);
    if (next === 'chase') {
      hud.querySelector('.mischief-hud-copy > span').textContent = dodges >= 2 ? 'Okay, he’s staying put. Catch him.' : dodges === 1 ? 'One dodge left. He’s running out of excuses.' : 'He can only dodge twice. You’ve got this.';
      return;
    }
    if (focusResult) title.focus({preventScroll: true});
    if (!reduced.matches && !document.hidden) motion = gsap.timeline({onComplete: settle})
      .fromTo(title, {y: 16, rotation: -1.5, opacity: .35}, {y: 0, rotation: 0, opacity: 1, duration: .55, ease: 'back.out(1.4)'})
      .fromTo(reward, {scale: 1.45, rotation: -14, opacity: 0}, {scale: 1, rotation: 0, opacity: 1, duration: .45, ease: 'back.out(1.8)'}, .12);
  }, {signal});
  reduced.addEventListener('change', settle, {signal});
  document.addEventListener('visibilitychange', () => {if (document.hidden) settle();}, {signal});
  present('idle');
  return () => {
    disposed = true; events.abort(); settle();
    if (phase === 'chase') window.dispatchEvent(new CustomEvent('portfolio:mischief-stop', {detail: {reason: 'dispose'}}));
    document.body.classList.remove('mischief-active'); hud.remove(); delete section.dataset.mischief; section.innerHTML = original;
  };
}
