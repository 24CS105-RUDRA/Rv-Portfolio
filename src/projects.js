import gsap from 'gsap';

// Project descriptions are based on the public repository READMEs, reviewed 2026-11-08.
const artwork = (name) => new URL(`./assets/projects/${name}.svg`, import.meta.url).href;

export const projects = {
  nagardrishti: {
    number: '01', title: 'NagarDrishti', tagline: 'A clearer picture of city traffic.', category: 'Traffic analytics / Frontend prototype',
    image: artwork('nagardrishti'),
    description: 'A smart-city traffic analytics prototype that turns a complex camera network into an approachable command console. Built around the Ahmedabad, Gandhinagar, and Anand region.',
    features: ['Interactive maps, vehicle trajectory playback, and traffic charts.', 'Simulated camera detections and alerts across 50 junction nodes.', 'Accessible controls, report views, and an operator review workflow.'],
    stack: 'React · TypeScript · Leaflet · Recharts · Zustand',
    source: 'https://github.com/24CS105-RUDRA/nagardrishti',
    live: 'https://nagardrishti-one.vercel.app/',
  },
  'ai-sales': {
    number: '02', title: 'AI Sales Intelligence', tagline: 'From lead to conversation.', category: 'Voice agents / Full-stack application',
    image: artwork('ai-sales'),
    description: 'An AI-assisted sales platform that brings lead discovery, qualification, campaigns, and voice-agent workflows into one workspace. A hackathon exploration of practical AI automation.',
    features: ['Lead management, AI scoring, campaign dashboards, and call summaries.', 'Organization-scoped access with role-based permissions.', 'Mock telephony by default, with configurable AI and voice providers.'],
    stack: 'Next.js · NestJS · TypeScript · MongoDB · Groq',
    source: 'https://github.com/24CS105-RUDRA/AI-SALSE',
  },
  transitops: {
    number: '03', title: 'TransitOps', tagline: 'A single view of a fleet in motion.', category: 'Fleet operations / Full-stack application',
    image: artwork('transitops'),
    description: 'A transport operations platform built during a hackathon. It connects vehicle and driver management, trip dispatch, maintenance, and expenses in a single workflow.',
    features: ['Dispatch rules prevent double-booking and overloading.', 'Role-based dashboards, expense tracking, and fleet analytics.', 'Simulated GPS positions and seeded Indian transport data for demos.'],
    stack: 'Next.js · React · Prisma · SQLite · Leaflet',
    source: 'https://github.com/24CS105-RUDRA/transportit',
  },
  portfolio: {
    number: '04', title: 'Controlled chaos', tagline: 'An interface with a pulse.', category: 'This portfolio / Creative development',
    image: artwork('portfolio'),
    description: 'An exploration of the space between order and play. A custom fluid monogram opens into an editorial portfolio, bringing code, typography, and motion together.',
    features: ['Interactive WebGL fluid simulation with an elastic return to the monogram.', 'A scroll-driven transition and a keyboard-accessible project gallery.', 'Responsive layouts with static fallbacks and reduced-motion support.'],
    stack: 'JavaScript · WebGL · GLSL · GSAP · Lenis · Vite',
    source: 'https://github.com/24CS105-RUDRA/Rv-Portfolio',
  },
};

export function initProjects(scroll, gallery) {
  const dialog = document.querySelector('#project-dialog');
  const events = new AbortController();
  const signal = events.signal;
  if (typeof dialog.showModal !== 'function') return () => events.abort();

  const ids = Object.keys(projects);
  const close = dialog.querySelector('.dialog-close');
  const curtain = dialog.querySelector('.project-curtain');
  const next = dialog.querySelector('#next-project');
  const content = dialog.querySelector('#case-content');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  let active, opener, transition, flyingArtwork;
  const resetArtwork = () => {
    flyingArtwork?.remove();
    flyingArtwork = null;
    dialog.classList.remove('art-entering', 'art-leaving');
    gsap.set(dialog, {clearProps: 'backgroundColor'});
    gsap.set(dialog.querySelectorAll('.case-study, .project-page-nav'), {clearProps: 'opacity,transform'});
    gsap.set(dialog.querySelector('#dialog-image'), {clearProps: 'visibility'});
    gsap.set(dialog.querySelector('.project-opening-copy'), {clearProps: 'opacity,transform'});
  };
  let exiting = false, exitToWork = false, closingMotion = false;

  const currentRoute = () => {
    const id = location.hash.match(/^#project\/([a-z-]+)$/)?.[1];
    return ids.includes(id) ? id : null;
  };
  const nextId = () => ids[(ids.indexOf(active) + 1) % ids.length];

  function render(id) {
    const project = projects[id];
    active = id;
    for (const key of ['number', 'title', 'category', 'tagline', 'description', 'stack']) {
      dialog.querySelector(`#dialog-${key}`).textContent = project[key];
    }
    dialog.querySelector('#dialog-nav-title').textContent = project.title;
    dialog.querySelector('#dialog-editorial-title').textContent = project.title;
    const image = dialog.querySelector('#dialog-image');
    image.width = ['ai-sales', 'portfolio'].includes(id) ? 1000 : 800;
    image.height = ['ai-sales', 'portfolio'].includes(id) ? 800 : 1000;
    image.src = project.image;
    image.alt = `${project.title} project artwork`;
    dialog.querySelector('#dialog-features').replaceChildren(...project.features.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    dialog.querySelector('#dialog-source').href = project.source;
    const live = dialog.querySelector('#dialog-live');
    live.hidden = !project.live;
    if (project.live) live.href = project.live;
    else live.removeAttribute('href');
    dialog.querySelector('#next-project-title').textContent = projects[nextId()].title;
    dialog.scrollTop = 0;
  }

  function reveal(id) {
    if (dialog.open && active === id && !closingMotion) return;
    closingMotion = exiting = false;
    transition?.kill();
    resetArtwork();
    const source = opener?.matches(".project-cover") ? opener.querySelector("img") : null;
    const sourceRect = source?.getBoundingClientRect();
    gsap.set(curtain, {clearProps: 'transform'});
    const opening = !dialog.open;
    const show = () => {
      render(id);
      if (opening) {
        document.documentElement.classList.remove('custom-cursor');
        document.body.classList.add('modal-open');
        scroll.lenis?.stop();
        dialog.showModal();
        dialog.scrollTop = 0;
      }
      close.focus({preventScroll: true});
    };
    if (!motion.matches) {show(); return;}
    // Reset the pixel offset GSAP reads from the curtain's CSS transform.
    gsap.set(curtain, {y: 0, yPercent: 101});
    if (opening && sourceRect && sourceRect.width > 0 && sourceRect.right > 0 && sourceRect.left < innerWidth) {
      show();
      const destination = dialog.querySelector('#dialog-image');
      const target = destination.getBoundingClientRect();
      flyingArtwork = source.cloneNode();
      flyingArtwork.className = 'flying-artwork';
      flyingArtwork.alt = '';
      flyingArtwork.setAttribute('aria-hidden', 'true');
      dialog.append(flyingArtwork);
      dialog.classList.add('art-entering');
      gsap.set(destination, {visibility: 'hidden'});
      gsap.set(flyingArtwork, {
        left: sourceRect.left, top: sourceRect.top, width: sourceRect.width, height: sourceRect.height,
        backgroundColor: getComputedStyle(opener).backgroundColor,
      });
      transition = gsap.timeline({onComplete: resetArtwork})
        .to(flyingArtwork, {
          left: 0, top: 0, width: innerWidth, height: innerHeight,
          duration: .52, ease: 'power3.inOut',
        }, 0)
        .to(flyingArtwork, {
          left: target.left, top: target.top, width: target.width, height: target.height,
          backgroundColor: 'transparent', duration: .65, ease: 'power3.inOut',
        }, .52)
        .fromTo('.project-opening-copy', {opacity: 0, y: 28}, {opacity: 1, y: 0, duration: .55, ease: 'power3.out'}, .72);
    } else if (opening) {
      gsap.set(curtain, {yPercent: 0});
      show();
      transition = gsap.to(curtain, {yPercent: -101, duration: 0.56, ease: 'power3.inOut'});
    } else {
      transition = gsap.timeline()
        .fromTo(curtain, {yPercent: 101}, {yPercent: 0, duration: 0.27, ease: 'power2.in'})
        .call(show)
        .to(curtain, {yPercent: -101, duration: 0.47, ease: 'power3.out'});
    }
  }

  function animateExit() {
    if (!dialog.open || closingMotion) return;
    closingMotion = true;
    transition?.kill();
    resetArtwork();
    if (!motion.matches) { dialog.close(); return; }

    const image = dialog.querySelector('#dialog-image');
    const source = image.getBoundingClientRect();
    // The destination must be the currently displayed project, even after Next.
    opener = gallery.reveal(active);
    scroll.toSection('work', {immediate: true});
    const destination = opener?.querySelector('img');
    if (!destination) {dialog.close(); return;}
    const target = destination.getBoundingClientRect();
    const onScreen = source.bottom > 0 && source.top < innerHeight;
    flyingArtwork = image.cloneNode();
    flyingArtwork.removeAttribute('id');
    flyingArtwork.className = 'flying-artwork';
    flyingArtwork.alt = '';
    flyingArtwork.setAttribute('aria-hidden', 'true');
    dialog.append(flyingArtwork);
    dialog.classList.add('art-leaving');
    gsap.set(curtain, {y: 0, yPercent: -101});
    gsap.set(image, {visibility: 'hidden'});
    const width = onScreen ? source.width : Math.min(innerWidth * .46, 420);
    const height = onScreen ? source.height : Math.min(innerHeight * .6, width * image.height / image.width);
    gsap.set(flyingArtwork, {
      left: onScreen ? source.left : (innerWidth - width) / 2,
      top: onScreen ? source.top : (innerHeight - height) / 2,
      width, height, opacity: onScreen ? 1 : 0,
    });
    transition = gsap.timeline({onComplete: () => dialog.close()})
      .to(dialog.querySelectorAll('.case-study, .project-page-nav'),
        {opacity: 0, y: -18, duration: .25, ease: 'power2.in'}, 0)
      .to(flyingArtwork, {opacity: 1, duration: .2}, 0)
      .fromTo(dialog, {backgroundColor: '#050505'}, {backgroundColor: 'rgba(5,5,5,0)', duration: .58, ease: 'power2.inOut'}, .12)
      .to(flyingArtwork, {
        left: target.left, top: target.top, width: target.width, height: target.height,
        backgroundColor: getComputedStyle(opener).backgroundColor,
        duration: .78, ease: 'power3.inOut',
      }, .08);
  }

  function closeProject() {
    if (exiting) return;
    exiting = true;
    if (history.state?.portfolioProject) history.back();
    else {
      history.replaceState(null, '', '#work');
      exitToWork = true;
      animateExit();
    }
  }

  function syncRoute() {
    const id = currentRoute();
    if (id) reveal(id);
    else if (dialog.open) animateExit();
  }

  document.querySelectorAll('[data-project]:not([aria-hidden])').forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-project]');
    if (!link || !ids.includes(link.dataset.project)) return;
    event.preventDefault();
    opener = link;
    history.pushState({portfolioProject: true}, '', `#project/${link.dataset.project}`);
    reveal(link.dataset.project);
  }, {signal});

  next.addEventListener('click', () => {
    if (exiting || closingMotion) return;
    const id = nextId();
    history.replaceState(history.state, '', `#project/${id}`);
    reveal(id);
  }, {signal});
  dialog.querySelector('#case-down').addEventListener('click', event => {
    dialog.scrollTo({top: content.offsetTop - 64, behavior: motion.matches ? 'smooth' : 'instant'});
    if (event.detail === 0) content.focus({preventScroll: true});
  }, {signal});
  close.addEventListener('click', closeProject, {signal});
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeProject();
  }, {signal});
  dialog.addEventListener('close', () => {
    transition?.kill();
    resetArtwork();
    exiting = closingMotion = false;
    document.body.classList.remove('modal-open');
    scroll.lenis?.start();
    scroll.toSection('work', {immediate: true});
    const original = opener && !opener.closest('[data-loop-copy]') ? opener : gallery.reveal(opener?.dataset.project ?? active);
    requestAnimationFrame(() => {
      if (!dialog.open) { scroll.toSection('work', {immediate: true}); original?.focus({preventScroll: true}); }
    });
    opener = active = null;
    exitToWork = false;
  }, {signal});
  const finishArtwork = () => {
    if (!flyingArtwork) return;
    transition?.progress(1);
    resetArtwork();
  };
  window.addEventListener('resize', finishArtwork, {signal});
  motion.addEventListener('change', finishArtwork, {signal});
  window.addEventListener('popstate', syncRoute, {signal});
  window.addEventListener('hashchange', syncRoute, {signal});
  if (currentRoute()) {
    scroll.toSection('work', {immediate: true});
    syncRoute();
  }
  return () => {
    transition?.kill();
    resetArtwork();
    events.abort();
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
  };
}
