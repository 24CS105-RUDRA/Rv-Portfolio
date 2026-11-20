// One illustration per project; the same SVG is the static image and motion source.
const posters = import.meta.glob('./assets/projects/*.svg', {query: '?raw', import: 'default', eager: true});
const ns = 'http://www.w3.org/2000/svg';

function namespaceArtwork(svg, prefix) {
  // The endless gallery contains three copies of each card. SVG paint servers and
  // clip paths need instance-specific IDs, even when they use the same artwork.
  const nodes = [svg, ...svg.querySelectorAll('*')], ids = new Map();
  nodes.forEach(node => {
    if (node.id) { const previous = node.id; ids.set(previous, `${prefix}-${previous}`); node.id = ids.get(previous); }
  });
  nodes.forEach(node => [...node.attributes].forEach(attribute => {
    let value = attribute.value.replace(/url\(#([^)]*)\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
    if (['href', 'xlink:href'].includes(attribute.name) && value.startsWith('#') && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
    if (['aria-labelledby', 'aria-describedby'].includes(attribute.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
    if (value !== attribute.value) node.setAttribute(attribute.name, value);
  }));
}

export function initProjectArtwork(covers) {
  const events = new AbortController(), {signal} = events;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const work = document.querySelector('#work');
  const visible = new Set(), mounted = [];
  let disposed = false;
  function sync() {
    if (disposed) return;
    const paused = reduced.matches || document.hidden || work.inert || document.body.classList.contains('modal-open');
    mounted.forEach(({cover}) => {
      cover.classList.toggle('is-live', visible.has(cover) && !paused);
      cover.classList.toggle('is-art-paused', paused);
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => isIntersecting ? visible.add(target) : visible.delete(target));
    sync();
  }, {threshold: .08});
  covers.forEach((cover, index) => {
    const source = posters[`./assets/projects/${cover.dataset.project}.svg`];
    if (!source) return;
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    if (parsed.documentElement.localName !== 'svg' || parsed.querySelector('parsererror')) return;
    const svg = document.importNode(parsed.documentElement, true);
    namespaceArtwork(svg, `poster-${index}`);
    svg.classList.add('project-illustration');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    const defs = document.createElementNS(ns, 'defs'), filterId = `portal-${index}`;
    defs.innerHTML = `<filter id="${filterId}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="2" seed="${index + 2}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    svg.prepend(defs);
    cover.append(svg);
    const previousBackground = cover.style.getPropertyValue('--cover-bg');
    if (/^#[\da-f]{3,8}$/i.test(svg.dataset.background || '')) cover.style.setProperty('--cover-bg', svg.dataset.background);
    cover.style.setProperty('--portal-filter', `url(#${filterId})`);
    cover.classList.add('art-ready');
    mounted.push({cover, svg, previousBackground}); observer.observe(cover);
  });
  document.addEventListener('visibilitychange', sync, {signal});
  reduced.addEventListener('change', sync, {signal});
  window.addEventListener('portfolio:project-art', sync, {signal});
  // Cards sit in a sticky scene before their reveal. Geometric intersection
  // alone would start them behind the opening, while the gallery is inert.
  let wasInert = work.inert;
  const phase = new MutationObserver(() => {
    if (wasInert !== work.inert) { wasInert = work.inert; sync(); }
  });
  phase.observe(work, {attributes: true, attributeFilter: ['inert']});
  // Dialog's own close listeners remove modal-open before this queued sync.
  document.querySelector('#project-dialog').addEventListener('close', () => queueMicrotask(sync), {signal});
  sync();
  return () => {
    disposed = true;
    events.abort(); observer.disconnect(); phase.disconnect(); visible.clear();
    mounted.forEach(({cover, svg, previousBackground}) => {
      svg.remove(); cover.classList.remove('art-ready', 'is-live', 'is-art-paused');
      cover.style.removeProperty('--portal-filter');
      if (previousBackground) cover.style.setProperty('--cover-bg', previousBackground);
      else cover.style.removeProperty('--cover-bg');
    });
  };
}
