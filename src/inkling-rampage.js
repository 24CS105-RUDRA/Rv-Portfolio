export const rampageScenes = [
  {section:'intro',selector:'.intro-title .line-mask'},
  {section:'work',selector:'.project-cover img, .project-title-label, .project-type'},
  {section:'services',selector:'.service h3, .service p, .services-note'},
  {section:'contact',selector:'#contact-title .line-mask, .contact-note, .contact-address'},
];

export function createRampagePlan(previousCount, previousFirst, random=Math.random) {
  const counts=[2,3,4,5].filter(count=>count!==previousCount);
  const count=counts[Math.floor(random()*counts.length)];
  const scenes=[...rampageScenes];
  for(let i=scenes.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[scenes[i],scenes[j]]=[scenes[j],scenes[i]];}
  if(scenes[0].section===previousFirst)[scenes[0],scenes[1]]=[scenes[1],scenes[0]];
  // A second pass covers five-impact runs or sections with no eligible targets.
  return {count,route:[...scenes,...scenes]};
}

export function chooseRampageTarget(candidates, previousTargets, random=Math.random) {
  const fresh=candidates.filter(candidate=>!previousTargets.has(candidate.key));
  const pool=fresh.length?fresh:candidates;
  return pool.length?pool[Math.floor(random()*pool.length)]:null;
}

// Gallery clones share the same identity, so a clone isn't counted as a new target.
export function rampageTargetKey(element) {
  const section=element.closest('section')?.id||'page';
  return `${section}:${element.tagName}:${(element.getAttribute('alt')||element.textContent).trim().replace(/\s+/g,' ')}`;
}
