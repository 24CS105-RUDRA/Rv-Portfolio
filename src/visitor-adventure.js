import gsap from 'gsap';
import {projects} from './projects';
import {ideaHref} from './idea-bridge';

export const visitorRoutes = {
  hiring: {
    label: 'I’m hiring', title: 'Meet the builder.', stamp: 'LET’S TALK WORK',
    intro: 'A short route through application logic, developer tools, and a machine that moves.',
    ids: ['school-erp', 'codeoracle', 'light-robot'],
    reasons: ['Roles, records, and integration.', 'Making unfamiliar code understandable.', 'Sensors, calibration, and practical testing.'],
    action: 'Talk about working together',
    brief: 'Hi Rudra, I’d like to talk about a development opportunity. Here is a little about the role and the kind of work: ',
  },
  idea: {
    label: 'I have an idea', title: 'Find a starting point.', stamp: 'GOOD IDEAS WELCOME',
    intro: 'See how operations, AI conversations, and physical interaction become project directions.',
    ids: ['transitops', 'ai-sales', 'prezon'],
    reasons: ['Connecting the moving parts of a workflow.', 'Exploring useful voice and AI automation.', 'Testing an idea in hardware.'],
    action: 'Tell me your idea',
    brief: 'Hi Rudra, I have an idea I’d like to explore. The people it could help and the problem it could solve are: ',
  },
  exploring: {
    label: 'Just exploring', title: 'Follow your curiosity.', stamp: 'DETOURS ENCOURAGED',
    intro: 'Start with a liquid interface, see a computer think, then take a different view of the city.',
    ids: ['portfolio', 'manoviz', 'nagardrishti'],
    reasons: ['Code, typography, and a little controlled chaos.', 'Instruction timing, made tangible with LEDs.', 'A conceptual command console for city traffic.'],
    action: 'Take an idea for a spin',
  },
};

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const choiceIcons = {
  hiring: '<rect x="7" y="12" width="34" height="26" rx="5"/><path d="M17 12V8h14v4M7 23q17 9 34 0M21 25h6v6h-6Z"/>',
  idea: '<path d="M16 32c0-5-7-8-7-17a15 15 0 0 1 30 0c0 9-7 12-7 17ZM17 38h14m-11 6h8M24 7v11m-7-4 7 7 7-7"/>',
  exploring: '<circle cx="24" cy="24" r="18"/><path d="m30 15-3 12-12 6 6-12ZM24 2v5m22 17h-5M24 46v-5M2 24h5"/>',
};

export function initVisitorAdventure({scroll} = {}) {
  const section = document.querySelector('#visitor-route');
  if (!section) return () => {};
  const original = section.innerHTML;
  const events = new AbortController(), {signal} = events;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion, disposed = false, active = 'exploring';
  section.innerHTML = `<div class="visitor-route-heading"><p class="route-eyebrow">A small shortcut through the work</p><h2 id="visitor-route-title">Pick a reason.<br><em>Take a route.</em></h2><p>There’s plenty to explore. Tell me what brought you here and I’ll point you toward three places to begin.</p></div>
    <div class="route-choices" role="group" aria-label="Choose a route through the portfolio" data-pet-safe>${Object.entries(visitorRoutes).map(([id,route]) => `<button type="button" data-visitor-route="${id}" aria-pressed="${id===active}" aria-controls="visitor-ticket"><svg viewBox="0 0 48 48" width="43" height="43" aria-hidden="true">${choiceIcons[id]}</svg><span>${route.label}</span><small>${id==='hiring'?'Skills in practice':id==='idea'?'Possibilities to connect':'The scenic way around'}</small></button>`).join('')}</div>
    <div class="route-ticket" id="visitor-ticket" data-pet-safe><div class="route-ticket-top"><span>Your curiosity ticket</span><span class="route-ticket-date">Open at your own pace</span></div><div class="route-ticket-body"><div class="route-ticket-copy"><h3></h3><p></p></div><svg class="route-ticket-schematic" viewBox="0 0 700 110" aria-hidden="true"><path class="route-ticket-rail" d="M37 65H185q25 0 25-24t25-24h210q25 0 25 24t25 24h168"/><path class="route-ticket-trace" pathLength="1" d="M37 65H185q25 0 25-24t25-24h210q25 0 25 24t25 24h168"/><g class="route-ticket-stops"><circle cx="37" cy="65" r="7"/><circle cx="350" cy="17" r="7"/><circle cx="663" cy="65" r="7"/></g></svg><ol class="route-projects"></ol><div class="route-ticket-bottom"><a class="route-next"></a><span class="route-stamp" aria-hidden="true"></span></div></div></div>
    <p class="route-status sr-only" role="status" aria-live="polite"></p>`;
  const ticket = section.querySelector('.route-ticket');
  const copy = section.querySelector('.route-ticket-copy');
  const list = section.querySelector('.route-projects');
  const next = section.querySelector('.route-next');
  const stamp = section.querySelector('.route-stamp');
  const trace = section.querySelector('.route-ticket-trace');
  const status = section.querySelector('.route-status');
  function settle() {
    motion?.kill(); motion = null;
    gsap.set([copy, ...list.children, stamp], {clearProps:'transform,opacity'});
    gsap.set(trace, {clearProps:'strokeDashoffset'});
  }
  function choose(id, animate = true) {
    const route = visitorRoutes[id];
    if (!route || disposed) return;
    settle(); active = id; section.dataset.route = id;
    section.querySelectorAll('[data-visitor-route]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.visitorRoute===id)));
    copy.querySelector('h3').textContent = route.title;
    copy.querySelector('p').textContent = route.intro;
    list.innerHTML = route.ids.map((projectId,index) => {
      const project = projects[projectId];
      return `<li><a href="#project/${projectId}" data-project="${projectId}" aria-haspopup="dialog"><span class="route-project-stop">${['Begin here','Then try','One more stop'][index]}</span><h4>${escape(project.title)}</h4><p>${escape(route.reasons[index])}</p><span class="route-project-status">${escape(project.category)}</span></a></li>`;
    }).join('');
    next.textContent = route.action;
    next.href = id==='exploring' ? '#idea-mixer' : ideaHref({message:route.brief, topic:'Something strange', source:`Visitor route: ${route.label}`});
    stamp.textContent = route.stamp;
    if (animate) scroll?.refresh?.();
    if (animate) status.textContent = `${route.label}: ${route.ids.map(projectId=>projects[projectId].title).join(', ')}. Pick any stop to open its case study.`;
    if (!animate || reduced.matches || document.hidden) return;
    motion = gsap.timeline({onComplete:settle})
      .fromTo(copy, {opacity:.25,y:12}, {opacity:1,y:0,duration:.4,ease:'power2.out'}, 0)
      .fromTo(trace, {strokeDashoffset:1}, {strokeDashoffset:0,duration:.7,ease:'power2.inOut'}, 0)
      .fromTo(list.children, {opacity:0,y:16}, {opacity:1,y:0,duration:.42,stagger:.065,ease:'power2.out'}, .16)
      .fromTo(stamp, {opacity:0,scale:1.3,rotation:-8}, {opacity:1,scale:1,rotation:0,duration:.24,ease:'back.out(1.7)'}, .47);
  }
  section.querySelectorAll('[data-visitor-route]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.visitorRoute!==active) choose(button.dataset.visitorRoute);
  }, {signal}));
  next.addEventListener('click', event => {
    if (active!=='exploring' || !scroll?.toSection || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); scroll.toSection('idea-mixer', {focus:true,updateHash:true});
  }, {signal});
  document.addEventListener('visibilitychange', () => {if(document.hidden)settle();}, {signal});
  reduced.addEventListener('change', settle, {signal});
  window.addEventListener('portfolio:loop-start', settle, {signal});
  choose(active, false);
  return () => {disposed=true;settle();events.abort();section.innerHTML=original;delete section.dataset.route;};
}
