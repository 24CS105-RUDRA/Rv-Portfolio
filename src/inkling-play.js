import gsap from 'gsap';
import { soundCue } from './sound.js';
import { createInklingDust } from './inkling-dust';
import { createBanter } from './inkling-banter';
import { createRampagePlan, chooseRampageTarget, rampageTargetKey, isRampageTargetAllowed } from './inkling-rampage';
import { createInklingMischief } from './inkling-mischief';
import { createRageAtmosphere } from './inkling-rage';

const shapes=['blob','drop','square','ghost','puff'];
const surfaces='.intro-title .line-mask, .project-cover, .service h3, .contact-note, #contact-title .line-mask';


export function initInklingPlay(scroll) {
  const events=new AbortController(), {signal}=events;
  const line=createBanter();
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const pet=document.createElement('aside');pet.className='inkling';pet.setAttribute('aria-label','Inkling, roaming companion');
  pet.innerHTML='<button class="inkling-play" aria-label="Poke Inkling" aria-describedby="inkling-instructions"><span class="inkling-body"><span class="inkling-eye left"></span><span class="inkling-eye right"></span><span class="inkling-mouth"></span></span><span class="inkling-shadow"></span></button><span class="inkling-hardhat" aria-hidden="true"></span><span class="inkling-cargo" aria-hidden="true"></span><span class="inkling-heat" aria-hidden="true"></span>';
  const bubble=document.createElement('div');bubble.className='inkling-bubble';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
  const instructions=document.createElement('span');instructions.id='inkling-instructions';instructions.className='sr-only';
  instructions.textContent='Six pokes trigger a temporary takeover. Escape ends it and restores the page. Everything also restores automatically.';
  const impact=document.createElement('div');impact.className='inkling-impact';impact.setAttribute('aria-hidden','true');
  document.body.append(pet,bubble,instructions,impact);
  const play=pet.querySelector('button'),blob=pet.querySelector('.inkling-body');
  const dust=createInklingDust();
  const rageScene=createRageAtmosphere();
  const position={x:24,y:Math.max(80,innerHeight-150)};
  const damaged=new Map(), animations=new Set();
  let travel, bounce, speechTimer, roamTimer, coolTimer, autoRestore;
  let raging=false,disposed=false,anger=0,token=0,perch=null;
  let nextDodge=0,roams=0,pointerDown=false,originScroll=0,scrollMoved=false;
  let lastFrame=0,previousCount=0,previousFirst=null;
  let previousTargets=new Set();
  let engineering=false,engineerTween,writing=false,mischief;
  const engineerQueue=[],cargo=pet.querySelector('.inkling-cargo');
  const partIcons={cpu:'▦',sensor:'◎',logic:'⌘',route:'⌁',wheel:'◉',interface:'▤'};
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
  function impactRect(element){
    if(!isRampageTargetAllowed(element)||element.closest('.inkling-destroyed'))return null;
    const box=element.getBoundingClientRect();
    let left=Math.max(12,box.left),right=Math.min(innerWidth-12,box.right),top=Math.max(92,box.top),bottom=Math.min(innerHeight-75,box.bottom);
    for(let parent=element;parent&&parent!==document.body;parent=parent.parentElement){
      const style=getComputedStyle(parent);
      if(style.visibility==='hidden'||Number(style.opacity)<.2||parent.inert)return null;
      const clip=parent.getBoundingClientRect();
      if(parent!==element&&/hidden|clip|auto|scroll/.test(style.overflowX)){left=Math.max(left,clip.left);right=Math.min(right,clip.right);}
      if(parent!==element&&/hidden|clip|auto|scroll/.test(style.overflowY)){top=Math.max(top,clip.top);bottom=Math.min(bottom,clip.bottom);}
    }
    const width=right-left,height=bottom-top;
    return width>=120&&height>=80&&width*height>=16000?{left,right,top,bottom,width,height}:null;
  }
  function setState(state){pet.dataset.state=state;}
  function stopTravel(){travel?.kill();bounce?.kill();gsap.set(blob,{clearProps:'transform'});perch=null;pet.classList.remove('is-running','is-hiding');}
  function moveTo(x,y,{duration=.95,hideBehind=null,peek=true,entrance=null,steal=false}={}) {
    stopTravel();const goal=bounds(x,y);
    if(preference.matches){Object.assign(position,goal);return;}
    pet.classList.add('is-running');
    pet.style.setProperty('--run-direction',goal.x<position.x?-1:1);
    travel=gsap.to(position,{...goal,duration,ease:'power2.inOut',onComplete:()=>{
      pet.classList.remove('is-running');perch=hideBehind;
      if(perch){pet.classList.toggle('is-hiding',peek);setState(peek?'hiding':'perched');}else setState('roaming');
      if(entrance==='drop')bounce=gsap.fromTo(blob,{y:-100,scaleX:.8,scaleY:1.2},{y:0,scaleX:1,scaleY:1,duration:.8,ease:'bounce.out'});
      if(entrance==='squeeze')bounce=gsap.fromTo(blob,{scaleX:.15,scaleY:1.7},{scaleX:1,scaleY:1,duration:.8,ease:'elastic.out(1,.4)'});
      if(entrance==='emerge')bounce=gsap.fromTo(blob,{y:35,scale:.1,rotation:-90},{y:0,scale:1,rotation:0,duration:.7,ease:'back.out(2)'});
      if(steal){window.dispatchEvent(new CustomEvent('portfolio:pet-steal',{detail:{...position}}));say('Bas ek letter udhaar liya. EMI pe wapas karunga.');}

    }});
    bounce=gsap.fromTo(blob,{rotation:goal.x<position.x?-12:12},{rotation:0,duration,ease:'power2.out'});
  }
  function scheduleRoam(delay=3500){clearTimeout(roamTimer);if(!disposed)roamTimer=setTimeout(roam,delay);}
  function roam() {
    if(disposed)return;
    if(mischief?.active||writing||raging||engineering||preference.matches||document.hidden||document.body.classList.contains('modal-open')||pointerDown||play.matches(':focus-visible')){scheduleRoam();return;}
    if(engineerQueue.length&&installPart())return;
    const candidates=targets(),target=candidates[Math.floor(Math.random()*candidates.length)];
    roams++;blob.dataset.shape=shapes[roams%shapes.length];
    if(target){const r=target.getBoundingClientRect();const hiding=roams%3===0;moveTo(r.left+Math.random()*Math.max(0,r.width-76),r.top-(hiding?58:80),{hideBehind:target,peek:hiding,entrance:roams%4===0?['drop','squeeze','emerge'][Math.floor(Math.random()*3)]:null,steal:!!target.closest('.intro')&&roams%2===0});}
    else moveTo(20+Math.random()*(innerWidth-110),90+Math.random()*(innerHeight-230));
    if(roams%3===0)say(line(roams%2?'roam':'corporate'));
    scheduleRoam(3800+Math.random()*2400);
  }
  function updateCargo(){pet.classList.toggle('has-cargo',engineerQueue.length>0&&!raging);cargo.textContent=partIcons[engineerQueue[0]]||'⚙';}
  function stopEngineer(){engineerTween?.kill();engineering=false;pet.classList.remove('is-engineer','is-proud');gsap.set(cargo,{clearProps:'transform,opacity'});updateCargo();}
  function installPart(force=false){
    const part=engineerQueue[0],socket=document.querySelector(`#machine-drawing [data-machine-part="${part}"]`);
    if(!socket)return false;let r=socket.getBoundingClientRect();
    if(r.top<95||r.bottom>innerHeight-60||r.left<0||r.right>innerWidth){
      if(!force)return false;
      const intake=document.querySelector('#machine-drawing .machine-printer');r=intake.getBoundingClientRect();
      if(r.top<95||r.bottom>innerHeight-60)return false;
    }
    stopTravel();engineering=true;clearTimeout(roamTimer);pet.classList.add('is-engineer');setState('engineering');
    const goal=bounds(r.left+r.width/2-38,r.top-74);
    engineerTween=gsap.timeline({onComplete:()=>{engineering=false;engineerQueue.shift();updateCargo();pet.classList.remove('is-engineer');setState('roaming');scheduleRoam(1800);}})
      .to(position,{...goal,duration:.85,ease:'power2.inOut'})
      .call(()=>say('Engineer aa gaya. Manual kisne padha?'))
      .to(blob,{rotation:-12,scaleX:1.12,scaleY:.9,duration:.2})
      .to(cargo,{y:24,rotation:100,duration:.26,ease:'power2.in'})
      .call(()=>{soundCue('squeak');say('Ulta lag gaya. Yeh feature hai, bug nahi.');})
      .to(blob,{y:8,rotation:15,duration:.16})
      .to(cargo,{y:-4,rotation:0,duration:.3,ease:'back.out(2)'})
      .call(()=>soundCue('clank'))
      .to(cargo,{x:r.width*.12,y:34,scale:.15,opacity:0,duration:.3,ease:'power2.in'})
      .call(()=>{window.dispatchEvent(new CustomEvent('portfolio:machine-install',{detail:{part}}));say('Installed. Credit mera. Warranty tumhari.');})
      .to(blob,{y:-18,rotation:0,scaleX:.9,scaleY:1.1,duration:.22})
      .to(blob,{y:0,scaleX:1,scaleY:1,duration:.5,ease:'elastic.out(1,.45)'})
      .set(cargo,{clearProps:'transform,opacity'});
    return true;
  }
  window.addEventListener('portfolio:project-art',e=>{if(!e.detail.closing){stopEngineer();stopTravel();}},{signal});
  window.addEventListener('portfolio:machine-part',e=>{
    const part=e.detail.part;if(!partIcons[part]||engineerQueue.includes(part))return;
    engineerQueue.push(part);updateCargo();soundCue('pickup');
  },{signal});
  window.addEventListener('portfolio:machine-run',()=>{
    if(mischief?.active||writing||raging||engineering||document.hidden||preference.matches)return;
    const machine=document.querySelector('#machine-drawing');if(!machine)return;
    const r=machine.getBoundingClientRect();
    if(r.bottom<90||r.top>innerHeight)return;
    if(engineerQueue.length&&installPart(true))return;
    stopTravel();engineering=true;clearTimeout(roamTimer);pet.classList.add('is-engineer');setState('engineering');
    engineerTween=gsap.timeline({onComplete:()=>{engineering=false;pet.classList.remove('is-engineer','is-proud');setState('roaming');scheduleRoam(3000);}})
      .to(position,{...bounds(r.right-85,Math.min(r.bottom-80,innerHeight-150)),duration:.65,ease:'power2.out'})
      .call(()=>say('Sab maine banaya. Rudra bas keyboard pakadta hai.'))
      .to(blob,{rotation:-16,scaleY:.8,scaleX:1.2,duration:.2})
      .call(()=>soundCue('clank'))
      .to(blob,{rotation:14,duration:.12,repeat:3,yoyo:true})
      .call(()=>{pet.classList.add('is-proud');soundCue('pickup');})
      .to(blob,{y:-28,rotation:0,scaleX:.85,scaleY:1.15,duration:.3})
      .to(blob,{y:0,scaleX:1,scaleY:1,duration:.65,ease:'elastic.out(1,.35)'});
  },{signal});
  function updateHeat(){pet.style.setProperty('--heat',`${anger/6*100}%`);play.setAttribute('aria-label',`Poke Inkling. ${anger} of 6 pokes toward takeover`);}
  // All takeover awaits resolve on cancellation, including hot reload and tab hiding.
  function animate(target,vars) {
    return new Promise(resolve=>{let tween;const done=value=>{animations.delete(tween);resolve(value);};tween=gsap.to(target,{...vars,onComplete:()=>done(true),onInterrupt:()=>done(false)});animations.add(tween);});
  }
  const wait=seconds=>animate({}, {duration:seconds});
  function restore({quiet=false,returnScroll=false}={}) {
    if(mischief?.active)mischief.stop('reset');
    const announceRestore=!quiet&&raging;
    window.dispatchEvent(new Event('portfolio:pet-reset'));
    stopEngineer();
    token++;raging=false;clearTimeout(autoRestore);clearTimeout(coolTimer);
    for(const tween of [...animations])tween.kill();animations.clear();stopTravel();dust.clear();rageScene.stop();
    if(scrollMoved&&scroll.lenis)scroll.lenis.scrollTo(scrollY,{immediate:true,force:true});
    for(const [el,saved] of damaged){
      el.classList.remove('inkling-vanishing','inkling-destroyed','inkling-block-hit');
      gsap.set(el,{clearProps:'transform,transformOrigin,filter,opacity'});
      for(const [property,{value,priority}] of Object.entries(saved.styles)){if(value)el.style.setProperty(property,value,priority);else el.style.removeProperty(property);}
      saved.interactive.inert=saved.inert;
    }
    if(damaged.size)previousTargets=new Set([...damaged.keys()].map(rampageTargetKey));
    damaged.clear();
    if(returnScroll&&scrollMoved){if(scroll.lenis)scroll.lenis.scrollTo(originScroll,{immediate:true,force:true});else window.scrollTo({top:originScroll,behavior:'instant'});}
    scrollMoved=false;anger=0;updateHeat();
    pet.classList.remove('is-furious');document.body.classList.remove('inkling-has-control');
    gsap.set(blob,{clearProps:'transform'});gsap.set(impact,{opacity:0,scale:0});
    setState('roaming');blob.dataset.shape='blob';updateCargo();
    if(announceRestore)soundCue('restore');
    if(!quiet)say(line('restore'));
    scheduleRoam(4500);
  }
  mischief=createInklingMischief({pet,play,blob,position,moveTo,stopTravel,say,bounds,preference,setState,
    reset:restore,pauseRoam(){clearTimeout(roamTimer);stopEngineer();stopTravel();},resumeRoam(){scheduleRoam(3500);}});
  window.addEventListener('portfolio:mischief-start',e=>{if(!writing&&!document.hidden&&!document.body.classList.contains('modal-open'))mischief.start(e.detail);},{signal});
  window.addEventListener('portfolio:mischief-catch',()=>{if(mischief.active)mischief.catchPet({detail:0});},{signal});
  window.addEventListener('portfolio:mischief-stop',e=>mischief.stop(e.detail?.reason||'user'),{signal});
  async function jumpOn(element,current) {
    if(token!==current)return;
    const r=impactRect(element);if(!r)return;
    const hitY=r.top+r.height*(.32+Math.random()*.3),hitX=r.left+r.width*(.3+Math.random()*.4),goal=bounds(hitX-38,hitY-70);
    pet.classList.add('is-running');
    soundCue('charge');
    await animate(position,{x:goal.x,y:Math.max(65,Math.min(position.y,goal.y)-120),duration:.48,ease:'power2.out'});
    if(token!==current)return;
    pet.classList.remove('is-running');
    await animate(position,{x:goal.x,y:goal.y+15,duration:.32,ease:'power3.in'});
    if(token!==current)return;
    const interactive=element;
    const styles=Object.fromEntries(['--inkling-cut','transform','transform-origin','filter','opacity'].map(property=>[property,{value:element.style.getPropertyValue(property),priority:element.style.getPropertyPriority(property)}]));
    damaged.set(element,{styles,interactive,inert:interactive.inert});
    interactive.inert=true;
    rageScene.impact({x:hitX,y:hitY,strength:Math.min(1.5,.8+r.width*r.height/(innerWidth*innerHeight))});
    dust.burst(element,{delay:.3,x:hitX,y:hitY});
    element.classList.add('inkling-block-hit');
    gsap.set(impact,{x:hitX,y:hitY,scale:0,opacity:.7});
    animate(impact,{scale:6.4,opacity:0,duration:.8,ease:'power2.out'});
    animate(blob,{scaleX:1.5,scaleY:.55,duration:.13,yoyo:true,repeat:1});
    await animate(element,{x:5,y:4,rotation:.6,duration:.075,yoyo:true,repeat:3,ease:'power1.inOut'});
    if(token!==current)return;
    element.classList.add('inkling-vanishing');
    gsap.set(element,{'--inkling-cut':'0%',transformOrigin:'center center'});
    animate(element,{rotation:-1.2,scale:.98,filter:'saturate(.25)',duration:1.1,ease:'power1.in'});
    await animate(element,{'--inkling-cut':'100%',duration:1.15,ease:'none'});
    if(token!==current)return;
    element.classList.add('inkling-destroyed');element.classList.remove('inkling-vanishing');
    await wait(.65);
  }
  async function takeover() {
    if(raging)return;
    window.dispatchEvent(new Event('portfolio:pet-reset'));
    stopEngineer();
    stopTravel();clearTimeout(roamTimer);clearTimeout(coolTimer);raging=true;updateCargo();const current=++token;
    originScroll=scrollY;scrollMoved=false;setState('takeover');pet.classList.add('is-furious');blob.dataset.shape='puff';
    document.body.classList.add('inkling-has-control');
    rageScene.start({reduced:preference.matches||document.body.classList.contains('idea-page')});
    say(line('takeover'));
    if(preference.matches||document.body.classList.contains('idea-page')){say(line('warning'));autoRestore=setTimeout(()=>restore(),5000);return;}
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
          .filter(el=>impactRect(el)&&![...damaged.keys()].some(hit=>hit===el||hit.contains(el)||el.contains(hit)))
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
  play.addEventListener('click',e=>{
    if(mischief.active){mischief.catchPet(e);return;}
    soundCue('pop');
    if(raging){say(line('takeover'));return;}
    stopEngineer();
    stopTravel();clearTimeout(coolTimer);anger=Math.min(6,anger+1);updateHeat();blob.dataset.shape=shapes[anger%shapes.length];
    if(!preference.matches)bounce=gsap.fromTo(blob,{scaleX:1.3,scaleY:.65},{scaleX:1,scaleY:1,duration:.65,ease:'elastic.out(1,.35)'});
    if(anger===6){takeover();return;}
    say(line(anger>=4?'warning':'poke'));pet.classList.toggle('is-furious',anger>=4);setState('provoked');
    nextDodge=performance.now()+1100;scheduleRoam(2000);
    coolTimer=setTimeout(()=>{anger=0;updateHeat();pet.classList.remove('is-furious');},18000);
  },{signal});
  play.addEventListener('pointerenter',e=>{
    if(mischief.active){mischief.dodge(e);return;}
    if(e.pointerType!=='mouse'||raging||engineering||preference.matches||anger>=4||performance.now()<nextDodge||play.matches(':focus-visible'))return;
    nextDodge=performance.now()+3500;moveTo(position.x+(position.x>innerWidth/2?-1:1)*130,position.y-65,{duration:.45});
    soundCue('dodge');
    say(line('dodge'));
  },{signal});
  play.addEventListener('pointerdown',()=>{pointerDown=true;},{signal});
  window.addEventListener('pointerup',()=>{pointerDown=false;},{signal});
  window.addEventListener('pointercancel',()=>{pointerDown=false;},{signal});
  play.addEventListener('focus',()=>{if(play.matches(':focus-visible')&&!raging)stopTravel();},{signal});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(raging||engineering||damaged.size)){restore({returnScroll:true});play.focus({preventScroll:true});}},{signal});
  document.addEventListener('click',e=>{if(e.target.closest('a, .dialog-close')&&(raging||engineering||damaged.size))restore({quiet:true});},{signal,capture:true});
  window.addEventListener('portfolio:loop-start',()=>restore({quiet:true}),{signal});
  window.addEventListener('portfolio:contact-focus',e=>{
    writing=!!e.detail.focused;
    if(writing){restore({quiet:true});clearTimeout(roamTimer);}
    else scheduleRoam(3500);
  },{signal});
  const protectControls=e=>{if(e.target.closest('[data-pet-safe]')&&(raging||engineering))restore({quiet:true});};
  document.addEventListener('pointerdown',protectControls,{signal,capture:true});
  document.addEventListener('focusin',protectControls,{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){restore({quiet:true});clearTimeout(roamTimer);}else scheduleRoam();},{signal});
  preference.addEventListener('change',()=>{restore({quiet:true});Object.assign(position,bounds(24,innerHeight-155));},{signal});
  window.addEventListener('wheel',()=>{if(raging)restore({quiet:true});},{signal,passive:true,capture:true});
  window.addEventListener('touchstart',e=>{if(raging&&!e.target.closest('.inkling'))restore({quiet:true});},{signal,passive:true});
  window.addEventListener('resize',()=>{if(raging||engineering||damaged.size)restore({quiet:true});stopTravel();Object.assign(position,bounds(position.x,position.y));dust.resize();},{signal});
  window.addEventListener('pointermove',e=>{pet.style.setProperty('--eye-x',`${clamp((e.clientX-position.x-38)/100,-3,3)}px`);pet.style.setProperty('--eye-y',`${clamp((e.clientY-position.y-40)/100,-3,3)}px`);},{signal,passive:true});
  function frame(time) {
    if(document.hidden)return;
    if(time-lastFrame>.1) {
      lastFrame=time;
      window.dispatchEvent(new CustomEvent('portfolio:pet-position',{detail:{...position}}));
      if(!mischief.active&&(travel?.isActive()||raging||engineering))window.dispatchEvent(new CustomEvent('portfolio:pet-step',{detail:{...position,angry:raging||anger>=4}}));
      if(!mischief.active&&perch&&!raging&&!travel?.isActive()){
        if(visible(perch)){const r=perch.getBoundingClientRect();Object.assign(position,bounds(position.x,r.top-(pet.classList.contains('is-hiding')?58:80)));}
        else {perch=null;pet.classList.remove('is-hiding');scheduleRoam(600);}
      }
      const hero=document.querySelector('#hero-visual');
      const darkOpening=hero&&getComputedStyle(hero).visibility!=='hidden'&&Number(getComputedStyle(hero).opacity)>.5&&hero.getBoundingClientRect().bottom>position.y;
      pet.classList.toggle('on-opening',darkOpening);
      // Keep speech readable on both sides of the screen and below the header.
      if(mischief.active){
        const width=Math.min(220,Math.max(120,innerWidth-168));
        bubble.style.width=`${width}px`;
        bubble.style.left=`${clamp(position.x<innerWidth/2?position.x+142:position.x-width-12,12,innerWidth-width-12)}px`;
        bubble.style.top=`${clamp(position.y+12,85,innerHeight-190)}px`;
      }else{
        bubble.style.removeProperty('width');
        bubble.style.left=`${clamp(position.x-65,12,innerWidth-252)}px`;
        bubble.style.top=`${position.y<145?position.y+88:position.y-68}px`;
      }
    }
    pet.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
  }
  gsap.ticker.add(frame);updateHeat();setState('roaming');
  say(line('roam'));scheduleRoam(2200);
  return()=>{disposed=true;mischief.destroy();restore({quiet:true});events.abort();clearTimeout(roamTimer);clearTimeout(speechTimer);gsap.ticker.remove(frame);dust.destroy();rageScene.destroy();pet.remove();bubble.remove();instructions.remove();impact.remove();};
}
