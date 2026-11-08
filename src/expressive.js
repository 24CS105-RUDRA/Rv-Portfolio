import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initInklingPlay } from './inkling-play';

export function initExpressive(scroll) {
  const media = gsap.matchMedia(), events = new AbortController();
  const signal = events.signal;
  const covers = [...document.querySelectorAll('.project-cover')];
  const extras = [];
  covers.forEach((cover, index) => {
    const type = cover.dataset.project;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('project-live', type);
    const art = type === 'nagardrishti'
      ? [ [80,120],[210,80],[300,200],[130,300] ].map(([x,y],i)=>`<circle class="live-node" cx="${x}" cy="${y}" r="12" style="--i:${i}"/>`).join('')
      : type === 'ai-sales'
      ? Array.from({length:23},(_,i)=>`<rect class="live-bar" x="${35+i*15}" y="${200-(25+Math.sin(i*1.7)**2*65)}" width="4" height="${50+Math.sin(i*1.7)**2*130}" style="--i:${i}"/>`).join('')
      : type === 'transitops'
      ? '<path class="live-route" d="M40 300 Q120 300 120 220 T210 140 T360 80"/><path class="live-route" d="M40 350 Q210 350 210 240 T360 180"/>'
      : '<circle class="live-orbit" cx="200" cy="200" r="125"/>';
    svg.innerHTML = `<defs><filter id="portal-${index}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="2" seed="${index+2}"/><feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></defs>${art}`;
    cover.append(svg); extras.push(svg);
    cover.style.setProperty('--portal-filter', `url(#portal-${index})`);
  });

  // Decorative letter fragments preserve one clean accessible heading.
  const heading = document.querySelector('#contact-title');
  const originalHeading = heading.innerHTML;
  heading.setAttribute('aria-label', heading.textContent.trim());
  const letters = [];
  heading.querySelectorAll('.line-mask > span').forEach(line => {
    const text = line.textContent;
    line.setAttribute('aria-hidden', 'true');
    line.replaceChildren(...text.split(/(\s+)/).map(word => {
      const span = document.createElement('span');
      span.className = 'finale-word'; span.textContent = word;
      if (word.trim()) letters.push(span);
      return span;
    }));
  });

  const wave = document.createElement('div');
  wave.className = 'theme-wave'; wave.setAttribute('aria-hidden', 'true');
  document.body.append(wave);
  let waveTween;
  window.addEventListener('portfolio:theme', () => {
    if (!matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    waveTween?.kill();
    wave.style.background = getComputedStyle(document.documentElement).getPropertyValue('--black');
    waveTween = gsap.fromTo(wave, {clipPath:'ellipse(150% 150% at 45% 0%)'},
      {clipPath:'ellipse(80% 0% at 60% 0%)',duration:1.05,ease:'power3.inOut'});
  }, {signal});

  const destroyPlay = initInklingPlay(scroll);

  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(letters, {y:i=>80+i*12,x:i=>(i%2?1:-1)*(35+i*8),rotation:i=>(i%2?1:-1)*14,opacity:0},
      {x:0,y:0,rotation:0,opacity:1,duration:1.2,stagger:.1,ease:'power3.out',
       scrollTrigger:{trigger:heading,start:'top 90%',toggleActions:'play none none reverse'}});
    const kinetic = [...document.querySelectorAll('.intro-title, .contact h2, .service h3')];
    let last=scrollY, speed=0;
    const tick=(_,delta)=>{
      if(document.hidden)return;
      const dy=scrollY-last;last=scrollY;
      speed+=(Math.min(1,Math.abs(dy)/Math.max(1,delta)*.22)-speed)*.12;
      const amount=speed<.001?0:speed;
      kinetic.forEach(el=>el.style.scale=`${1+amount*.065} ${1-amount*.04}`);

    };
    gsap.ticker.add(tick);
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-live',e.isIntersecting)),{threshold:.1});
    covers.forEach(c=>observer.observe(c));
    return ()=>{gsap.ticker.remove(tick);observer.disconnect();kinetic.forEach(e=>e.style.removeProperty('scale'));covers.forEach(c=>c.classList.remove('is-live'));};
  });
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
    const controller=new AbortController();
    covers.forEach(cover=>{
      let rect;
      const image=cover.querySelector('img'), caption=cover.parentElement.querySelector('.project-caption'), displacement=cover.querySelector('feDisplacementMap');
      cover.addEventListener('pointerenter',()=>{rect=cover.getBoundingClientRect();gsap.to(displacement,{attr:{scale:18},duration:.6});},{signal:controller.signal});
      cover.addEventListener('pointermove',e=>{
        if(!rect||e.pointerType!=='mouse')return;
        const x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;
        gsap.to(cover,{rotationY:x*12,rotationX:-y*10,borderRadius:`${4+y*3}% ${5-x*3}% ${4-y*3}% ${5+x*3}%`,duration:.45,overwrite:true});
        gsap.to(image,{x:x*12,y:y*12,duration:.5,overwrite:true});
        gsap.to(caption,{x:x*7,y:y*4,duration:.45,overwrite:true});
      },{signal:controller.signal});
      const reset=()=>{gsap.to(cover,{rotationX:0,rotationY:0,borderRadius:'0%',duration:.65});gsap.to([image,caption],{x:0,y:0,duration:.65});gsap.to(displacement,{attr:{scale:0},duration:.5});};
      cover.addEventListener('pointerleave',reset,{signal:controller.signal});
      cover.addEventListener('click',reset,{signal:controller.signal});
    });
    return ()=>{controller.abort();covers.forEach(c=>{const nodes=[c,c.querySelector('img'),c.parentElement.querySelector('.project-caption'),c.querySelector('feDisplacementMap')];gsap.killTweensOf(nodes);gsap.set(nodes.slice(0,3),{clearProps:'transform,borderRadius'});c.querySelector('feDisplacementMap').setAttribute('scale','0');});};
  });
  return ()=>{destroyPlay();media.revert();events.abort();waveTween?.kill();extras.forEach(e=>e.remove());covers.forEach(c=>c.style.removeProperty('--portal-filter'));wave.remove();heading.innerHTML=originalHeading;heading.removeAttribute('aria-label');};
}
