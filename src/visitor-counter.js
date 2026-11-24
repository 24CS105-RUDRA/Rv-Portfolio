import './visitor-counter.css';

const endpoint = '/api/visits';
const sessionKey = 'rudra-guestbook-visit-v1';
const hosts = new Set(['portfolio.rudravaghel.in', 'rv-portfolio-five.vercel.app']);

export function initVisitorCounter() {
  const card = document.querySelector('.visitor-stamp');
  if (!card) return () => {};
  const number = card.querySelector('[data-visitor-number]');
  const note = card.querySelector('[data-visitor-note]');
  const button = card.querySelector('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const request = new AbortController();
  const lines = ['Attendance lag gayi. Ab work bhi dekh lo.', 'You count. Literally.', 'Refresh se fan club nahi badhega.', 'One more human. Zero extra brain cells.', 'VIP entry. Chai apni lana.', 'Inkling approved your presence. Barely.'];
  let line = 0, frame = 0, reaction, disposed = false;
  const reveal = count => {
    const formatted = new Intl.NumberFormat('en-IN').format(count).padStart(4, '0');
    number.setAttribute('aria-label', `${count} recorded visits`);
    if (reduced.matches) { number.textContent = formatted; return; }
    const start = performance.now();
    const tick = now => {
      if (disposed) return;
      const progress = Math.min(1, (now - start) / 850);
      number.textContent = progress === 1 ? formatted : new Intl.NumberFormat('en-IN').format(Math.floor(count * (1 - (1 - progress) ** 3))).padStart(4, '0');
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };
  button.addEventListener('click', () => {
    note.textContent = lines[line++ % lines.length];
    card.classList.remove('is-stamped');
    cancelAnimationFrame(reaction);
    reaction = requestAnimationFrame(() => card.classList.add('is-stamped'));
  }, {signal: events.signal});

  async function load() {
    if (!hosts.has(location.hostname)) {
      number.textContent = 'HELLO'; note.textContent = 'The guestbook counts visits on the live site.'; return;
    }
    try {
      let cached;
      try { cached = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { /* Storage is optional. */ }
      if (Number.isSafeInteger(cached?.count) && cached.count >= 0) { reveal(cached.count); return; }
      const response = await fetch(endpoint, {method: 'POST', signal: request.signal, cache: 'no-store', credentials: 'omit'});
      if (!response.ok) throw new Error('Counter unavailable');
      const data = await response.json();
      const count = data.count;
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid count');
      if (disposed) return;
      try { sessionStorage.setItem(sessionKey, JSON.stringify({count})); } catch { /* Still show the actual shared count. */ }
      reveal(count);
    } catch {
      if (disposed) return;
      number.textContent = '—'; note.textContent = 'The guestbook is taking a chai break. You still count.';
    }
  }
  // One bounded request per session, away from the opening animation. No polling.
  const timer = setTimeout(load, 1600);
  const timeout = setTimeout(() => request.abort(), 10000);
  return () => {
    disposed = true; clearTimeout(timer); clearTimeout(timeout);
    cancelAnimationFrame(frame); cancelAnimationFrame(reaction);
    events.abort(); request.abort();
  };
}
