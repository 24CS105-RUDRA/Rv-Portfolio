// One illustration per project; the same SVG is the static image and motion source.
const posters = import.meta.glob('./assets/projects/*.svg', {query: '?raw', import: 'default', eager: true});

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
  const visible = new Set(), mounted = new Map(), templates = new Map();
  let disposed = false, moving = false;
  function unmount(cover) {
    mounted.get(cover)?.remove(); mounted.delete(cover);
    cover.classList.remove('art-ready', 'is-live', 'is-art-paused');
  }
  function mount(cover) {
    const id = cover.dataset.project;
    if (!templates.has(id)) {
      const source = posters[`./assets/projects/${id}.svg`];
      if (!source) return;
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (parsed.documentElement.localName !== 'svg' || parsed.querySelector('parsererror')) return;
      templates.set(id, parsed.documentElement);
    }
    const svg = document.importNode(templates.get(id), true);
    namespaceArtwork(svg, `poster-${covers.indexOf(cover)}`);
    svg.classList.add('project-illustration');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    cover.append(svg); mounted.set(cover, svg); cover.classList.add('art-ready');
  }
  function sync() {
    if (disposed) return;
    const paused = reduced.matches || document.hidden || work.inert || document.body.classList.contains('modal-open');
    for (const cover of mounted.keys()) if (!visible.has(cover) || paused) unmount(cover);
    if (!paused && !moving) {
      for (const cover of visible) {
        if (mounted.size >= 3 && !mounted.has(cover)) continue;
        if (!mounted.has(cover)) mount(cover);
      }
    }
    for (const cover of mounted.keys()) {
      cover.classList.toggle('is-live', !moving && !paused);
      cover.classList.toggle('is-art-paused', moving || paused);
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => isIntersecting ? visible.add(target) : visible.delete(target)); sync();
  }, {threshold: .08});
  covers.forEach(cover => observer.observe(cover));
  window.addEventListener('portfolio:gallery-motion', e => {moving = e.detail.moving; sync();}, {signal});
  document.addEventListener('visibilitychange', sync, {signal});
  reduced.addEventListener('change', sync, {signal});
  window.addEventListener('portfolio:project-art', sync, {signal});
  let wasInert = work.inert;
  const phase = new MutationObserver(() => {if (wasInert !== work.inert) {wasInert = work.inert; sync();}});
  phase.observe(work, {attributes: true, attributeFilter: ['inert']});
  document.querySelector('#project-dialog').addEventListener('close', () => queueMicrotask(sync), {signal});
  sync();
  return () => {
    disposed = true; events.abort(); observer.disconnect(); phase.disconnect(); visible.clear();
    for (const cover of mounted.keys()) unmount(cover);
    templates.clear();
  };
}
