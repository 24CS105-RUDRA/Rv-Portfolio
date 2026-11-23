import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initInklingPlay } from './inkling-play';
import { initProjectArtwork } from './project-art';

export function initExpressive(scroll) {
  const media = gsap.matchMedia(), events = new AbortController();
  const signal = events.signal;
  const covers = [...document.querySelectorAll('.project-cover')];
  const destroyArtwork = initProjectArtwork(covers);

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

  const destroyPlay = initInklingPlay(scroll);

  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(letters, {y:i=>80+i*12,x:i=>(i%2?1:-1)*(35+i*8),rotation:i=>(i%2?1:-1)*14,opacity:0},
      {x:0,y:0,rotation:0,opacity:1,duration:1.2,stagger:.1,ease:'power3.out',
       scrollTrigger:{trigger:heading,start:'top 90%',toggleActions:'play none none reverse'}});
    const kinetic = [...document.querySelectorAll('.intro-title, .contact h2, .service h3')];
    let last=scrollY, speed=0, applied;
    const tick=(_,delta)=>{
      if(document.hidden)return;
      const dy=scrollY-last;last=scrollY;
      speed+=(Math.min(1,Math.abs(dy)/Math.max(1,delta)*.22)-speed)*.12;
      const amount=speed<.001?0:speed;
      const key=amount.toFixed(3);if(key===applied)return;applied=key;
      kinetic.forEach(el=>el.style.scale=`${1+amount*.065} ${1-amount*.04}`);

    };
    gsap.ticker.add(tick);
    return ()=>{gsap.ticker.remove(tick);kinetic.forEach(e=>e.style.removeProperty('scale'));};
  });
  return ()=>{destroyPlay();media.revert();destroyArtwork();events.abort();heading.innerHTML=originalHeading;heading.removeAttribute('aria-label');};
}
