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
    let last=scrollY, speed=0;
    const tick=(_,delta)=>{
      if(document.hidden)return;
      const dy=scrollY-last;last=scrollY;
      speed+=(Math.min(1,Math.abs(dy)/Math.max(1,delta)*.22)-speed)*.12;
      const amount=speed<.001?0:speed;
      kinetic.forEach(el=>el.style.scale=`${1+amount*.065} ${1-amount*.04}`);

    };
    gsap.ticker.add(tick);
    return ()=>{gsap.ticker.remove(tick);kinetic.forEach(e=>e.style.removeProperty('scale'));};
  });
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
    const controller=new AbortController();
    covers.forEach(cover=>{
      let rect;
      const image=cover.querySelector('img'), illustration=cover.querySelector('.project-illustration'), caption=cover.parentElement.querySelector('.project-caption'), displacement=cover.querySelector('feDisplacementMap');
      if (!displacement) return;
      cover.addEventListener('pointerenter',()=>{rect=cover.getBoundingClientRect();gsap.to(displacement,{attr:{scale:18},duration:.6});},{signal:controller.signal});
      cover.addEventListener('pointermove',e=>{
        if(!rect||e.pointerType!=='mouse')return;
        const x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;
        gsap.to(cover,{rotationY:x*12,rotationX:-y*10,borderRadius:`${4+y*3}% ${5-x*3}% ${4-y*3}% ${5+x*3}%`,duration:.45,overwrite:true});
        gsap.to([image,illustration],{x:x*12,y:y*12,duration:.5,overwrite:true});
        gsap.to(caption,{x:x*7,y:y*4,duration:.45,overwrite:true});
      },{signal:controller.signal});
      const reset=()=>{gsap.to(cover,{rotationX:0,rotationY:0,borderRadius:'0%',duration:.65});gsap.to([image,illustration,caption],{x:0,y:0,duration:.65});gsap.to(displacement,{attr:{scale:0},duration:.5});};
      cover.addEventListener('pointerleave',reset,{signal:controller.signal});
      cover.addEventListener('click',reset,{signal:controller.signal});
    });
    return ()=>{controller.abort();covers.forEach(c=>{const nodes=[c,c.querySelector('img'),c.querySelector('.project-illustration'),c.parentElement.querySelector('.project-caption'),c.querySelector('feDisplacementMap')].filter(Boolean);gsap.killTweensOf(nodes);gsap.set(nodes.filter(n=>n.localName!=='feDisplacementMap'),{clearProps:'transform,borderRadius'});c.querySelector('feDisplacementMap')?.setAttribute('scale','0');});};
  });
  return ()=>{destroyPlay();media.revert();destroyArtwork();events.abort();heading.innerHTML=originalHeading;heading.removeAttribute('aria-label');};
}
