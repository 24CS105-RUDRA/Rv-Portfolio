import gsap from 'gsap';
import { soundCue } from './sound.js';
import { createInklingDust } from './inkling-dust';
import { createBanter } from './inkling-banter';
import { createRampagePlan, chooseRampageTarget, rampageTargetKey } from './inkling-rampage';

const shapes=['blob','drop','square','ghost','puff'];
const surfaces='.intro-title .line-mask, .project-cover, .service h3, .contact-note, #contact-title .line-mask';


export function initInklingPlay(scroll) {
  const events=new AbortController(), {signal}=events;
  const line=createBanter();
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const pet=document.createElement('aside');pet.className='inkling';pet.setAttribute('aria-label','Inkling, roaming companion');
  pet.innerHTML='<button class="inkling-play" aria-label="Poke Inkling" aria-describedby="inkling-instructions"><span class="inkling-body"><span class="inkling-eye left"></span><span class="inkling-eye right"></span><span class="inkling-mouth"></span></span><span class="inkling-shadow"></span></button><span class="inkling-heat" aria-hidden="true"></span>';
  const bubble=document.createElement('div');bubble.className='inkling-bubble';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
  const instructions=document.createElement('span');instructions.id='inkling-instructions';instructions.className='sr-only';
  instructions.textContent='Six pokes trigger a temporary takeover. Escape ends it and restores the page. Everything also restores automatically.';
  const impact=document.createElement('div');impact.className='inkling-impact';impact.setAttribute('aria-hidden','true');
  document.body.append(pet,bubble,instructions,impact);
  const play=pet.querySelector('button'),blob=pet.querySelector('.inkling-body');
  const dust=createInklingDust();
  const position={x:24,y:Math.max(80,innerHeight-150)};
  const damaged=new Map(), animations=new Set();
  let travel, bounce, speechTimer, roamTimer, coolTimer, autoRestore;
  let raging=false,disposed=false,anger=0,token=0,perch=null;
  let nextDodge=0,roams=0,pointerDown=false,originScroll=0,scrollMoved=false;
  let lastFrame=0,previousCount=0,previousFirst=null;
  let previousTargets=new Set();
  const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
  function bounds(x,y){return {x:clamp(x,8,innerWidth-84),y:clamp(y,65,innerHeight-112)};}
  function say(text){clearTimeout(speechTimer);bubble.textContent=text;bubble.classList.add('is-speaking');speechTimer=setTimeout(()=>bubble.classList.remove('is-speaking'),4300);}
  function visible(el) {
    if(!el||!el.isConnected||el.closest('.inkling-destroyed'))return false;
    const r=el.getBoundingClientRect();
    if(r.width<20||r.height<8||r.left< -r.width*.3||r.right>innerWidth+r.width*.3||r.top<95||r.top>innerHeight-100)return false;
    for(let p=el;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p);if(c.visibility==='hidden'||Number(c.opacity)<.3||p.inert)return false;}
    return true;
  }
  function targets(){return [...document.querySelectorAll(surfaces)].filter(visible);}
  function setState(state){pet.dataset.state=state;}
  function stopTravel(){travel?.kill();bounce?.kill();gsap.set(blob,{clearProps:'transform'});perch=null;pet.classList.remove('is-running','is-hiding');}
  function moveTo(x,y,{duration=.95,hideBehind=null,peek=true}={}) {
    stopTravel();const goal=bounds(x,y);
    if(preference.matches){Object.assign(position,goal);return;}
    pet.classList.add('is-running');
    pet.style.setProperty('--run-direction',goal.x<position.x?-1:1);
    travel=gsap.to(position,{...goal,duration,ease:'power2.inOut',onComplete:()=>{
      pet.classList.remove('is-running');perch=hideBehind;
      if(perch){pet.classList.toggle('is-hiding',peek);setState(peek?'hiding':'perched');}else setState('roaming');
    }});
    bounce=gsap.fromTo(blob,{rotation:goal.x<position.x?-12:12},{rotation:0,duration,ease:'power2.out'});
  }
  function scheduleRoam(delay=3500){clearTimeout(roamTimer);if(!disposed)roamTimer=setTimeout(roam,delay);}
  function roam() {
    if(disposed)return;
    if(raging||preference.matches||document.hidden||document.body.classList.contains('modal-open')||pointerDown||play.matches(':focus-visible')){scheduleRoam();return;}
    const candidates=targets(),target=candidates[Math.floor(Math.random()*candidates.length)];
    roams++;blob.dataset.shape=shapes[roams%shapes.length];
    if(target){const r=target.getBoundingClientRect();const hiding=roams%3===0;moveTo(r.left+Math.random()*Math.max(0,r.width-76),r.top-(hiding?58:80),{hideBehind:target,peek:hiding});}
    else moveTo(20+Math.random()*(innerWidth-110),90+Math.random()*(innerHeight-230));
    if(roams%3===0)say(line(roams%2?'roam':'corporate'));
    scheduleRoam(3800+Math.random()*2400);
  }
  function updateHeat(){pet.style.setProperty('--heat',`${anger/6*100}%`);play.setAttribute('aria-label',`Poke Inkling. ${anger} of 6 pokes toward takeover`);}
  // All takeover awaits resolve on cancellation, including hot reload and tab hiding.
  function animate(target,vars) {
    return new Promise(resolve=>{let tween;const done=value=>{animations.delete(tween);resolve(value);};tween=gsap.to(target,{...vars,onComplete:()=>done(true),onInterrupt:()=>done(false)});animations.add(tween);});
  }
  const wait=seconds=>animate({}, {duration:seconds});
  function restore({quiet=false,returnScroll=false}={}) {
    if(!quiet&&raging)soundCue('restore');
    token++;raging=false;clearTimeout(autoRestore);clearTimeout(coolTimer);
    for(const tween of [...animations])tween.kill();animations.clear();stopTravel();dust.clear();
    if(scrollMoved&&scroll.lenis)scroll.lenis.scrollTo(scrollY,{immediate:true,force:true});
    for(const [el,saved] of damaged){el.classList.remove('inkling-vanishing','inkling-destroyed');if(saved.cut)el.style.setProperty('--inkling-cut',saved.cut,saved.priority);else el.style.removeProperty('--inkling-cut');saved.interactive.inert=saved.inert;}
    if(damaged.size)previousTargets=new Set([...damaged.keys()].map(rampageTargetKey));
    damaged.clear();
    if(returnScroll&&scrollMoved){if(scroll.lenis)scroll.lenis.scrollTo(originScroll,{immediate:true,force:true});else window.scrollTo({top:originScroll,behavior:'instant'});}
    scrollMoved=false;anger=0;updateHeat();
    pet.classList.remove('is-furious');document.body.classList.remove('inkling-has-control');
    gsap.set(blob,{clearProps:'transform'});gsap.set(impact,{opacity:0,scale:0});
    setState('roaming');blob.dataset.shape='blob';
    if(!quiet)say(line('restore'));
    scheduleRoam(4500);
  }
  async function jumpOn(element,current) {
    if(token!==current||!visible(element))return;
    const r=element.getBoundingClientRect(),goal=bounds(r.left+r.width*.5-38,r.top-70);
    pet.classList.add('is-running');
    await animate(position,{x:goal.x,y:Math.max(65,Math.min(position.y,goal.y)-120),duration:.48,ease:'power2.out'});
    if(token!==current)return;
    pet.classList.remove('is-running');
    await animate(position,{x:goal.x,y:goal.y+15,duration:.32,ease:'power3.in'});
    if(token!==current)return;
    const interactive=element.closest('.project-cover')||element;
    damaged.set(element,{cut:element.style.getPropertyValue('--inkling-cut'),priority:element.style.getPropertyPriority('--inkling-cut'),interactive,inert:interactive.inert});
    interactive.inert=true;
    soundCue('impact');
    dust.burst(element);
    element.classList.add('inkling-vanishing');
    gsap.set(impact,{x:goal.x+38,y:r.top,scale:0,opacity:.7});
    animate(impact,{scale:3.4,opacity:0,duration:.7,ease:'power2.out'});
    animate(blob,{scaleX:1.5,scaleY:.55,duration:.13,yoyo:true,repeat:1});
    await animate(element,{'--inkling-cut':'100%',duration:1.15,ease:'none'});
    if(token!==current)return;
    element.classList.add('inkling-destroyed');element.classList.remove('inkling-vanishing');
    await wait(.65);
  }
  async function takeover() {
    if(raging)return;
    stopTravel();clearTimeout(roamTimer);clearTimeout(coolTimer);raging=true;const current=++token;
    originScroll=scrollY;scrollMoved=false;setState('takeover');pet.classList.add('is-furious');blob.dataset.shape='puff';
    document.body.classList.add('inkling-has-control');
    soundCue('anger');
    say(line('takeover'));
    if(preference.matches){say(line('warning'));autoRestore=setTimeout(()=>restore(),5000);return;}
    const plan=createRampagePlan(previousCount,previousFirst);
    previousCount=plan.count;previousFirst=plan.route[0].section;
    // Scale the recovery deadline with the randomly selected number of impacts.
    autoRestore=setTimeout(()=>restore(),plan.count*5000+10000);
    try {
      await animate(blob,{scale:1.55,rotation:12,duration:.12,repeat:5,yoyo:true});
      if(token!==current)return;
      const hitKeys=new Set();
      for(const {section,selector} of plan.route) {
        if(damaged.size>=plan.count)break;
        if(token!==current)return;
        scrollMoved=true;scroll.toSection(section);
        await animate(position,{x:innerWidth-95,y:Math.max(80,innerHeight*.35),duration:.8,ease:'power2.inOut'});
        await wait(.8);
        if(token!==current)return;
        const candidates=[...document.querySelectorAll(selector)]
          .filter(el=>visible(el)&&![...damaged.keys()].some(hit=>hit===el||hit.contains(el)||el.contains(hit)))
          .map(element=>({element,key:rampageTargetKey(element)}))
          .filter(candidate=>!hitKeys.has(candidate.key));
        const target=chooseRampageTarget(candidates,previousTargets);
        if(!target)continue;
        say(line('impact'));await jumpOn(target.element,current);
        if(damaged.has(target.element))hitKeys.add(target.key);
      }
      if(token!==current)return;
      setState('victory');say(line('corporate'));
      await animate(blob,{rotation:360,scale:1.2,duration:.7,ease:'back.out(2)'});
      if(token!==current)return;
      clearTimeout(autoRestore);autoRestore=setTimeout(()=>restore(),6000);
    } catch { if(token===current)restore(); }
  }
  play.addEventListener('click',()=>{
    soundCue('pop');
    if(raging){say(line('takeover'));return;}
    stopTravel();clearTimeout(coolTimer);anger=Math.min(6,anger+1);updateHeat();blob.dataset.shape=shapes[anger%shapes.length];
    if(!preference.matches)bounce=gsap.fromTo(blob,{scaleX:1.3,scaleY:.65},{scaleX:1,scaleY:1,duration:.65,ease:'elastic.out(1,.35)'});
    if(anger===6){takeover();return;}
    say(line(anger>=4?'warning':'poke'));pet.classList.toggle('is-furious',anger>=4);setState('provoked');
    nextDodge=performance.now()+1100;scheduleRoam(2000);
    coolTimer=setTimeout(()=>{anger=0;updateHeat();pet.classList.remove('is-furious');},18000);
  },{signal});
  play.addEventListener('pointerenter',e=>{
    if(e.pointerType!=='mouse'||raging||preference.matches||anger>=4||performance.now()<nextDodge||play.matches(':focus-visible'))return;
    nextDodge=performance.now()+3500;moveTo(position.x+(position.x>innerWidth/2?-1:1)*130,position.y-65,{duration:.45});
    soundCue('dodge');
    say(line('dodge'));
  },{signal});
  play.addEventListener('pointerdown',()=>{pointerDown=true;},{signal});
  window.addEventListener('pointerup',()=>{pointerDown=false;},{signal});
  window.addEventListener('pointercancel',()=>{pointerDown=false;},{signal});
  play.addEventListener('focus',()=>{if(play.matches(':focus-visible')&&!raging)stopTravel();},{signal});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(raging||damaged.size)){restore({returnScroll:true});play.focus({preventScroll:true});}},{signal});
  document.addEventListener('click',e=>{if(e.target.closest('a, .dialog-close')&&(raging||damaged.size))restore({quiet:true});},{signal,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){restore({quiet:true});clearTimeout(roamTimer);}else scheduleRoam();},{signal});
  preference.addEventListener('change',()=>{restore({quiet:true});Object.assign(position,bounds(24,innerHeight-155));},{signal});
  window.addEventListener('wheel',()=>{if(raging)restore({quiet:true});},{signal,passive:true,capture:true});
  window.addEventListener('touchstart',e=>{if(raging&&!e.target.closest('.inkling'))restore({quiet:true});},{signal,passive:true});
  window.addEventListener('resize',()=>{if(raging||damaged.size)restore({quiet:true});stopTravel();Object.assign(position,bounds(position.x,position.y));dust.resize();},{signal});
  window.addEventListener('pointermove',e=>{pet.style.setProperty('--eye-x',`${clamp((e.clientX-position.x-38)/100,-3,3)}px`);pet.style.setProperty('--eye-y',`${clamp((e.clientY-position.y-40)/100,-3,3)}px`);},{signal,passive:true});
  function frame(time) {
    if(document.hidden)return;
    if(time-lastFrame>.1) {
      lastFrame=time;
      if(perch&&!raging&&!travel?.isActive()){
        if(visible(perch)){const r=perch.getBoundingClientRect();Object.assign(position,bounds(position.x,r.top-(pet.classList.contains('is-hiding')?58:80)));}
        else {perch=null;pet.classList.remove('is-hiding');scheduleRoam(600);}
      }
      const hero=document.querySelector('#hero-visual');
      const darkOpening=hero&&getComputedStyle(hero).visibility!=='hidden'&&Number(getComputedStyle(hero).opacity)>.5&&hero.getBoundingClientRect().bottom>position.y;
      pet.classList.toggle('on-opening',darkOpening);
      // Keep speech readable on both sides of the screen and below the header.
      bubble.style.left=`${clamp(position.x-65,12,innerWidth-252)}px`;
      bubble.style.top=`${position.y<145?position.y+88:position.y-68}px`;
    }
    pet.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
  }
  gsap.ticker.add(frame);updateHeat();setState('roaming');
  say(line('roam'));scheduleRoam(2200);
  return()=>{disposed=true;restore({quiet:true});events.abort();clearTimeout(roamTimer);clearTimeout(speechTimer);gsap.ticker.remove(frame);dust.destroy();pet.remove();bubble.remove();instructions.remove();impact.remove();};
}
