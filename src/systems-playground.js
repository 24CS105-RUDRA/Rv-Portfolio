import gsap from 'gsap';

const REQUEST_KEYS = ['work', 'about', 'projects', 'contact', 'notes', 'hello'];

// A deliberately small, deterministic queue model. No network calls or real
// performance measurements are involved; every original request ends exactly once.
export function createRequestLab(capacity = 12) {
  const limit = Math.max(1, Math.min(24, Math.floor(capacity) || 12));
  let queue, cache, options, counts, sequence;
  function reset() {
    queue = []; cache = new Set(); sequence = 0;
    options = {cache: false, retry: false};
    counts = {generated: 0, completed: 0, cached: 0, failed: 0, rejected: 0, retried: 0};
  }
  reset();
  const snapshot = () => ({...counts, capacity: limit, queue: queue.map(item => ({...item})), cacheSize: cache.size, options: {...options}});
  function enqueue(amount) {
    const events = [];
    for (let i = 0, length = Math.max(0, Math.min(100, Math.floor(amount) || 0)); i < length; i++) {
      const request = {id: ++sequence, key: REQUEST_KEYS[(sequence - 1) % REQUEST_KEYS.length], attempt: 0};
      counts.generated++;
      if (options.cache && cache.has(request.key)) { counts.completed++; counts.cached++; events.push({type: 'cached', request}); }
      else if (queue.length < limit) { queue.push(request); events.push({type: 'queued', request}); }
      else { counts.rejected++; events.push({type: 'rejected', request}); }
    }
    return events;
  }
  function step() {
    const request = queue.shift();
    if (!request) return null;
    if (options.cache && cache.has(request.key)) { counts.completed++; counts.cached++; return {type: 'cached', request}; }
    // Every fifth original request fails on its first worker attempt. Retrying
    // once succeeds, allowing visitors to see the tradeoff without randomness.
    if (request.id % 5 === 0 && request.attempt === 0) {
      if (options.retry && queue.length < limit) {
        queue.push({...request, attempt: 1}); counts.retried++;
        return {type: 'retry', request};
      }
      counts.failed++; return {type: 'failed', request};
    }
    counts.completed++;
    if (options.cache) cache.add(request.key);
    return {type: 'completed', request};
  }
  function setOption(name, value) {
    if (!Object.hasOwn(options, name)) return;
    options[name] = !!value;
    if (name === 'cache' && !value) cache.clear();
  }
  return {enqueue, step, snapshot, setOption, reset};
}

export function initSystemsPlayground() {
  const section = document.querySelector('#systems-lab');
  if (!section) return () => {};
  const original = section.innerHTML;
  section.innerHTML = `
    <div class="lab-heading"><p class="lab-eyebrow">A small experiment in keeping things moving</p><h2 id="systems-title">A little traffic.<br><em>A little trouble.</em></h2><p>Send requests down the line. Fill the queue. Then give the system a hand with a cache or one careful retry. Inkling has opinions.</p></div>
    <div class="lab-workbench" data-pet-safe>
      <div class="lab-controls"><div class="lab-launch"><button type="button" data-lab-burst>Send 6 requests</button><button type="button" data-lab-flood>Make it busy · 20</button></div><div class="lab-switches"><button type="button" role="switch" aria-checked="false" data-lab-cache><span aria-hidden="true"></span>Response cache</button><button type="button" role="switch" aria-checked="false" data-lab-retry><span aria-hidden="true"></span>Retry once</button><button type="button" class="lab-reset" data-lab-reset>Start fresh</button></div></div>
      <div class="lab-legend" aria-hidden="true"><span>The waiting room</span><span>One patient worker</span><span>Back to you</span></div>
      <div class="lab-stage" aria-hidden="true"><svg viewBox="0 0 1000 330" width="1000" height="330" focusable="false">
        <g class="lab-pipes" fill="none" stroke="currentColor" stroke-width="2"><path d="M284 198H423m154 0H832"/><path d="M283 136V64h453v72" stroke-dasharray="5 8"/><path d="M500 259v40H143v-37" stroke-dasharray="5 8"/></g>
        <rect class="lab-queue-frame" x="25" y="113" width="260" height="155" rx="14"/>
        <g data-lab-queue></g>
        <g class="lab-cache-drawing"><rect x="397" y="36" width="206" height="56" rx="10"/><path d="M416 55h26m-26 13h26m20-13h26m-26 13h26m20-13h26m-26 13h26m20-13h26m-26 13h26" fill="none" stroke="currentColor" stroke-width="3"/></g>
        <g class="lab-worker"><rect x="424" y="133" width="152" height="126" rx="16"/><rect x="450" y="154" width="100" height="66" rx="7"/><path class="lab-worker-signal" d="m465 189 14-13m-14 13 14 13m56-13-14-13m14 13-14 13m-22 9 12-40" fill="none" stroke="currentColor" stroke-width="3"/><path d="M450 237h61" stroke="currentColor" stroke-width="4"/><circle cx="539" cy="237" r="5"/></g>
        <g class="lab-response"><path d="M800 144h131v100l-12-6-12 6-12-6-12 6-12-6-12 6-12-6-12 6-12-6-12 6-11-6V144Z"/><path d="m829 174 11 11 25-25m-36 46h71m-71 16h53" fill="none" stroke="currentColor" stroke-width="3"/></g>
        <circle class="lab-flight" r="10" cx="0" cy="0" opacity="0"/>
        <g class="lab-bolt" fill="none" stroke="currentColor" stroke-width="2"><path d="m613 189 12-9-2 13 13 1-13 7 3 10-13-4m-231-11-12-9 2 13-13 1 13 7-3 10 13-4"/></g>
      </svg></div>
      <div class="lab-reading"><p data-lab-current>Empty queue. A surprisingly peaceful server.</p><p data-lab-option-note>Requests #5, #10… fail on their first worker attempt. No retries yet.</p></div>
      <dl class="lab-counters"><div><dt>Waiting</dt><dd data-lab-waiting>0 / 12</dd></div><div><dt>Completed</dt><dd data-lab-completed>0</dd></div><div><dt>From cache</dt><dd data-lab-cached>0</dd></div><div><dt>Couldn’t finish</dt><dd data-lab-failed>0</dd></div><div><dt>Queue full</dt><dd data-lab-rejected>0</dd></div></dl>
      <p class="lab-announcement sr-only" data-lab-announcement role="status" aria-live="polite"></p>
      <div class="lab-footnote"><p>A toy model, not a benchmark. Six repeating request keys, twelve queue spaces, one worker. Requests #5, #10… fail on their first worker attempt. Cache results are reused only for the same key; retries happen at most once.</p><span>Press buttons. Ask better questions.</span></div>
    </div>`;
  const events = new AbortController(), {signal} = events;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const model = createRequestLab(), svgNS = 'http://www.w3.org/2000/svg';
  const find = name => section.querySelector(`[data-lab-${name}]`);
  const queue = find('queue'), flight = section.querySelector('.lab-flight');
  let timer, tween, inView = false, disposed = false, wasBusy = false, lastMood = '', lastReaction = -Infinity;
  const playable = () => !disposed && inView && !document.hidden && !document.body.classList.contains('modal-open');
  function react(mood) {
    const time = performance.now();
    if (mood === lastMood || time - lastReaction < 800) return;
    lastMood = mood; lastReaction = time;
    window.dispatchEvent(new CustomEvent('portfolio:lab-reaction', {detail: {mood, queued: model.snapshot().queue.length}}));
  }
  function announce() {
    const state = model.snapshot();
    find('announcement').textContent = `${state.completed} completed, including ${state.cached} from cache; ${state.failed} failed; ${state.rejected} rejected because the queue was full. ${state.queue.length} waiting.`;
  }
  function render(result) {
    const state = model.snapshot();
    find('waiting').textContent = `${state.queue.length} / ${state.capacity}`;
    ['completed', 'cached', 'failed', 'rejected'].forEach(key => {find(key).textContent = state[key];});
    find('cache').setAttribute('aria-checked', String(state.options.cache));
    find('retry').setAttribute('aria-checked', String(state.options.retry));
    section.classList.toggle('lab-cache-on', state.options.cache);
    section.classList.toggle('lab-retry-on', state.options.retry);
    section.classList.toggle('lab-is-busy', state.queue.length > 0);
    queue.replaceChildren();
    state.queue.forEach((request, index) => {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', String(41 + index % 4 * 59)); rect.setAttribute('y', String(130 + Math.floor(index / 4) * 43));
      rect.setAttribute('width', '47'); rect.setAttribute('height', '30'); rect.setAttribute('rx', '5');
      rect.setAttribute('class', request.attempt ? 'lab-request lab-request-retry' : 'lab-request');
      queue.append(rect);
    });
    if (result) {
      const words = {cached: `/${result.request.key} came from cache. Same question, saved answer.`, retry: `/${result.request.key} failed once. Back in line for one retry.`, failed: `/${result.request.key} failed. A retry could help the next batch.`, completed: `/${result.request.key} completed. One less thing waiting.`};
      find('current').textContent = words[result.type];
    }
    find('option-note').textContent = `${state.options.cache ? `${state.cacheSize} of 6 keys cached.` : 'Cache off: every request uses the worker.'} ${state.options.retry ? 'One retry is allowed after failure.' : 'Requests #5, #10… fail once at the worker. No retries yet.'}`;
  }
  function animate(result) {
    tween?.kill(); gsap.set(flight, {opacity: 0});
    if (reduced.matches || !playable()) return;
    const cached = result.type === 'cached', bad = result.type === 'failed' || result.type === 'retry';
    flight.classList.toggle('lab-flight-bad', bad);
    tween = gsap.timeline()
      .set(flight, {x: cached ? 285 : 275, y: cached ? 64 : 198, opacity: 1, scale: .8})
      .to(flight, {x: cached ? 735 : 500, duration: .17, ease: 'power1.inOut'})
      .to(flight, {x: bad ? 500 : 820, y: bad ? 295 : 198, duration: .19, ease: 'power1.inOut'})
      .to(flight, {opacity: 0, scale: .3, duration: .06});
  }
  function pause() { clearTimeout(timer); timer = null; tween?.kill(); gsap.set(flight, {opacity: 0}); }
  function schedule() {
    if (timer || !playable() || !model.snapshot().queue.length) return;
    timer = setTimeout(tick, reduced.matches ? 80 : 480);
  }
  function tick() {
    timer = null;
    if (!playable()) return;
    const result = model.step();
    if (!result) return;
    render(result); animate(result);
    if (model.snapshot().queue.length) schedule();
    else {
      announce();
      if (wasBusy) react(lastMood === 'overload' ? 'recovery' : 'success');
      wasBusy = false;
    }
  }
  function add(amount) {
    const results = model.enqueue(amount), rejected = results.filter(item => item.type === 'rejected').length;
    render();
    find('current').textContent = rejected ? `${rejected} requests couldn’t enter. Twelve spaces means twelve spaces.` : `${amount} requests sent. Let’s see what gets through.`;
    const cached = results.find(item => item.type === 'cached');
    if (cached) animate(cached);
    if (rejected) { react('overload'); announce(); }
    if (model.snapshot().queue.length) { wasBusy = true; schedule(); }
    else { announce(); react('success'); }
  }
  find('burst').addEventListener('click', () => add(6), {signal});
  find('flood').addEventListener('click', () => add(20), {signal});
  ['cache', 'retry'].forEach(option => find(option).addEventListener('click', () => {
    const enabled = !model.snapshot().options[option]; model.setOption(option, enabled); render();
    find('current').textContent = option === 'cache' ? enabled ? 'Cache on. The first answer teaches it; repeated keys can skip the worker.' : 'Cache off. Stored answers cleared.' : enabled ? 'Retry on. A failed request gets one more turn, never an endless loop.' : 'Retry off. Failed requests stop after their first attempt.';
    if (enabled && lastMood === 'overload') react('recovery');
    announce(); schedule();
  }, {signal}));
  find('reset').addEventListener('click', () => {
    pause(); model.reset(); wasBusy = false; render();
    find('current').textContent = 'Fresh queue. Clean slate. Inkling denies everything.';
    react('recovery'); announce();
  }, {signal});
  const observer = new IntersectionObserver(entries => {
    inView = entries[0]?.isIntersecting || false;
    if (playable()) schedule(); else pause();
  }, {threshold: .1}); observer.observe(section);
  document.addEventListener('visibilitychange', () => playable() ? schedule() : pause(), {signal});
  window.addEventListener('portfolio:project-art', () => playable() ? schedule() : pause(), {signal});
  document.querySelector('#project-dialog')?.addEventListener('close', () => queueMicrotask(() => {if (!disposed) schedule();}), {signal});
  reduced.addEventListener('change', () => {pause(); schedule();}, {signal});
  render();
  return () => { disposed = true; events.abort(); observer.disconnect(); pause(); section.classList.remove('lab-cache-on', 'lab-retry-on', 'lab-is-busy'); section.innerHTML = original; };
}
