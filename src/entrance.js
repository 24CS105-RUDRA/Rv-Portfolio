import gsap from 'gsap';
import logo from '../logo.svg';

export function initEntrance(scroll) {
  const key='portfolio-entrance-seen-v1';
  try { if(localStorage.getItem(key)==='true')return ()=>{}; }catch{}
  // Shared case-study/section links open directly at the requested content.
  if(location.hash && location.hash!=='#top')return ()=>{};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){try{localStorage.setItem(key,'true');}catch{}return ()=>{};}
  const overlay=document.createElement('div');overlay.className='cinematic-entrance';
  overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Opening Rudra Vaghela’s portfolio');
  overlay.innerHTML=`<svg class="entrance-filter" aria-hidden="true"><defs><filter id="entrance-liquid"><feTurbulence type="fractalNoise" baseFrequency=".018 .025" numOctaves="2" seed="8"/><feDisplacementMap in="SourceGraphic" scale="0"/></filter></defs></svg><div class="entrance-mark" aria-hidden="true">${Array.from({length:5},(_,i)=>`<img src="${logo}" alt="" style="clip-path:inset(${i*20}% 0 ${80-i*20}% 0)"/>`).join('')}</div><span class="entrance-label">Rudra Vaghela / Creative developer</span><button class="entrance-skip">Skip intro</button>`;
  document.body.append(overlay);
  const main=document.querySelector('main'),wasInert=main.inert;main.inert=true;
  scroll.lenis?.stop();let timeline,deadline,done=false;
  function finish(){
    if(done)return;done=true;window.removeEventListener('keydown',escape);timeline?.kill();clearTimeout(deadline);main.inert=wasInert;
    if(!document.body.classList.contains('modal-open'))scroll.lenis?.start();
    const focused=overlay.contains(document.activeElement);overlay.remove();
    if(focused){const target=document.querySelector('.hero-down');target?.focus({preventScroll:true});}
    try{localStorage.setItem(key,'true');}catch{}
  }
  overlay.querySelector('button').addEventListener('click',finish);
  const escape=e=>{if(e.key==='Escape')finish();};window.addEventListener('keydown',escape);
  timeline=gsap.timeline({onComplete:finish})
    .fromTo(overlay.querySelectorAll('.entrance-mark img'),{x:i=>(i%2?1:-1)*(80+i*18),y:i=>(i-2)*18,opacity:0},{x:0,y:0,opacity:1,duration:.65,stagger:.07,ease:'power3.out'})
    .to(overlay.querySelector('feDisplacementMap'),{attr:{scale:24},duration:.28,ease:'sine.inOut'})
    .to(overlay.querySelector('feDisplacementMap'),{attr:{scale:0},duration:.32,ease:'power2.out'})
    .to(overlay,{opacity:0,duration:.4},'-=.04');
  deadline=setTimeout(finish,2400);
  return()=>{finish();window.removeEventListener('keydown',escape);};
}
