// Each target is a complete visual unit, never individual letters or labels.
export const rampageScenes = [
  {section: 'intro', selector: '.intro-title', portionSelector: '.intro-title'},
  {section: 'work', selector: '.project', portionSelector: '#project-gallery'},
  {section: 'services', selector: '.service', portionSelector: '.services-grid'},
  {section: 'playground', selector: '.mischief-copy', portionSelector: '.mischief-poster'},
  {section: 'workshop', selector: '.workshop-heading, .workshop-bottom', portionSelector: '#machine-drawing'},
  {section: 'contact', selector: '#contact-title, .contact-invitation'},
];

const largeUnits = '.intro-title, .project, #project-gallery, .service, .services-grid, .mischief-copy, .mischief-poster, #machine-drawing, .workshop-heading, .workshop-bottom, #contact-title, .contact-invitation';
const protectedAreas = '.idea-page, form, .idea-desk, .idea-receipt, .contact-details, [data-contact-email], [data-contact-phone], header, nav, footer, dialog, .inkling, .inkling-bubble, .mischief-hud, .sound-toggle, [data-pet-protect]';
const editableFields = 'form, input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const randomIndex = (length, random) => {
  const value = Number(random());
  return Math.min(length - 1, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * length)));
};
const hasPortion = scene => !!scene.portionSelector;
const hasBlock = scene => scene.selector !== scene.portionSelector;
const targetFor = (scene, scope) => ({section: scene.section, selector: scope === 'portion' ? scene.portionSelector : scene.selector, scope});

/** Mix complete blocks with larger portions and change the first stop/count. */
export function createRampagePlan(previousCount, previousFirst, random = Math.random) {
  const counts = [2, 3, 4].filter(count => count !== previousCount);
  const count = counts[randomIndex(counts.length, random)];
  const scenes = [...rampageScenes];
  for (let i = scenes.length - 1; i > 0; i--) {
    const other = randomIndex(i + 1, random);
    [scenes[i], scenes[other]] = [scenes[other], scenes[i]];
  }
  if (scenes[0].section === previousFirst) [scenes[0], scenes[1]] = [scenes[1], scenes[0]];
  const route = scenes.map(scene => targetFor(scene, !hasBlock(scene) || hasPortion(scene) && random() < .5 ? 'portion' : 'block'));
  // Guarantee both scales among the intended first round. Runtime fallback
  // stops still cover sections whose content is unavailable or offscreen.
  if (!route.slice(0, count).some(stop => stop.scope === 'portion')) {
    const choices = scenes.slice(0, count).map((scene, index) => ({scene, index})).filter(({scene}) => hasPortion(scene));
    const {scene, index} = choices[randomIndex(choices.length, random)];
    route[index] = targetFor(scene, 'portion');
  }
  if (!route.slice(0, count).some(stop => stop.scope === 'block')) {
    const choices = scenes.slice(0, count).map((scene, index) => ({scene, index})).filter(({scene}) => hasBlock(scene));
    const {scene, index} = choices[randomIndex(choices.length, random)];
    route[index] = targetFor(scene, 'block');
  }
  // Try the other scale on a second pass. The caller excludes overlaps and
  // logical-key repeats, including the three copies of each gallery card.
  const fallback = scenes.map((scene, index) => targetFor(scene, route[index].scope === 'block' && hasPortion(scene) || !hasBlock(scene) ? 'portion' : 'block'));
  return {count, route: [...route, ...fallback]};
}

/** Forms, public contact details and navigation stay usable during a rampage. */
export function isRampageTargetAllowed(element) {
  if (!element?.matches || element.isConnected === false || !element.matches(largeUnits)) return false;
  if (element.closest(protectedAreas) || element.closest('.inkling-destroyed, .inkling-vanishing, [inert]')) return false;
  if (element.querySelector(protectedAreas) || element.querySelector(editableFields)) return false;
  if (element.matches(editableFields)) return false;
  return true;
}

export function chooseRampageTarget(candidates, previousTargets = new Set(), random = Math.random) {
  const fresh = candidates.filter(candidate => !previousTargets.has(candidate.key));
  const pool = fresh.length ? fresh : candidates;
  return pool.length ? pool[randomIndex(pool.length, random)] : null;
}

/** Gallery clones share a project key; other blocks use stable structural keys. */
export function rampageTargetKey(element) {
  const section = element.closest('section')?.id || 'page';
  const article = element.matches('.project') ? element : element.closest('.project');
  const project = article?.querySelector('[data-project]')?.dataset.project;
  if (project) return `work:project:${project}`;
  if (element.id) return `${section}:#${element.id}`;
  if (element.matches('.service')) {
    const siblings = [...(element.parentElement?.children || [])].filter(child => child.matches('.service'));
    return `${section}:service:${siblings.indexOf(element)}`;
  }
  const unit = ['intro-title', 'services-grid', 'mischief-copy', 'mischief-poster', 'workshop-heading', 'workshop-bottom', 'contact-invitation'].find(name => element.classList.contains(name));
  return `${section}:${unit || element.tagName.toLowerCase()}`;
}
