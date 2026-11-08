import gsap from 'gsap';

const faces = ['blob', 'star', 'ghost', 'square', 'pancake', 'drop'];
const quips = [
  'You clicked a blob. Productive day?', 'That was my face. I was using it.',
  'Your cursor has commitment issues.', 'I have zero bones and more confidence than you.',
  'You keep clicking. I keep being iconic.', 'This is my portfolio now. Rudra just pays rent.',
  'Okay, we’re rivals. Put it on LinkedIn.', 'That click had absolutely no aura.'
];
const faceHTML = '<span class="inkling-body"><span class="inkling-eye left"></span><span class="inkling-eye right"></span><span class="inkling-mouth"></span></span>';

export function initInklingPlay(pet, { wake, preference, signal, cancel }) {
  const play = pet.querySelector('.inkling-play'), blob = pet.querySelector('.inkling-body');
  blob.insertAdjacentHTML('beforeend', '<span class="inkling-mouth"></span>');
  const ui = document.createElement('div');
  ui.className = 'inkling-toys';
  ui.innerHTML = `<div class="inkling-bubble" role="status" aria-live="polite"></div>
    <button class="inkling-toggle" aria-expanded="false" aria-controls="inkling-games">Dare you ↗</button>
    <section id="inkling-games" class="inkling-games" aria-label="Inkling’s mischief club" hidden>
      <header class="mischief-head"><span class="inkling-caption">INKLING’S MISCHIEF CLUB</span><button class="mischief-close" aria-label="Close mischief club">×</button></header>
      <div class="mischief-title">Tiny blob.<br><em>Massive attitude.</em></div>
      <div class="rivalry"><span>YOU <b data-human>00</b></span><span class="rivalry-vs">VS</span><span>INKLING <b data-pet>00</b></span></div>
      <div class="mischief-modes" aria-label="Challenges"><button data-mode="catch">01 / Catch me</button><button data-mode="patience">02 / Don’t press</button><button data-mode="says">03 / Inkling says</button></div>
      <div class="mischief-stage" data-state="idle"><div class="mischief-idle"><span class="mischief-orbit">✦</span><strong>ENTER AT YOUR OWN EGO.</strong><span>Pick a challenge. I’ll pick a fight.</span></div></div>
      <div class="inkling-score" role="status" aria-live="polite">No stakes. Just your dignity.</div>
      <div class="mischief-meter" aria-hidden="true"><span></span></div>
      <div class="inkling-caption toy-caption">OR SIMPLY ANNOY ME</div>
      <div class="mischief-tools"><button data-toy="morph">✧ Shape-shift</button><button data-toy="squish">↕ Squish</button><button data-toy="feed">✦ Feed</button><button data-toy="dance">↯ Tantrum</button></div>
      <button class="mischief-stop" hidden>End challenge</button>
      <div class="mischief-footer">ESC TO LEAVE · HOLD THE LITTLE BLOB TO SQUISH</div>
    </section><span class="inkling-treat" aria-hidden="true">✦</span><span class="inkling-burst" aria-hidden="true"></span>`;
  pet.append(ui);
  const q = s => ui.querySelector(s), toggle = q('.inkling-toggle'), panel = q('.inkling-games');
  const bubble = q('.inkling-bubble'), stage = q('.mischief-stage'), status = q('.inkling-score');
  const meter = q('.mischief-meter span'), stopButton = q('.mischief-stop');
  let mode = '', round = 0, human = 0, rival = 0, pokes = 0, shape = 0, snacks = 0;
  let speechTimer, holdTimer, holdStart = 0, held = false, suppressClick = false;
  let movement, animation, particles, treatTween, timers = new Set(), disposed = false;
  const later = (fn, delay) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, delay); timers.add(id); return id; };
  try { const saved = JSON.parse(sessionStorage.getItem('inkling-rivalry') || '{}'); human = Math.max(0,Number(saved.human)||0); rival = Math.max(0,Number(saved.rival)||0); } catch {}
  const updateScore = () => {
    q('[data-human]').textContent = String(human).padStart(2,'0'); q('[data-pet]').textContent = String(rival).padStart(2,'0');
    try { sessionStorage.setItem('inkling-rivalry',JSON.stringify({human,rival})); } catch {}
  };
  updateScore();
  function say(text) {
    clearTimeout(speechTimer); bubble.textContent = text; bubble.classList.add('is-speaking');
    speechTimer = setTimeout(() => bubble.classList.remove('is-speaking'), 5500);
  }
  function clearAnimation() {
    cancel(); animation?.kill(); treatTween?.kill();
    gsap.set(blob,{clearProps:'transform'}); gsap.set(q('.inkling-treat'),{opacity:0});
    pet.classList.remove('is-furious');
  }
  function morph(name = faces[(++shape)%faces.length]) {
    blob.dataset.shape = name;
    if (preference.matches) return;
    animation?.kill();
    animation = gsap.fromTo(blob,{scaleX:1.3,scaleY:.65,rotation:-12}, {scaleX:1,scaleY:1,rotation:0,duration:.7,ease:'elastic.out(1,.35)'});
  }
  function burst() {
    particles?.kill(); const box=q('.inkling-burst'); box.replaceChildren();
    if (preference.matches) return;
    for(let i=0;i<10;i++) { const s=document.createElement('i'); s.textContent=i%2?'✦':'·'; box.append(s); }
    particles=gsap.fromTo(box.children,{x:0,y:0,scale:.1,opacity:1}, {x:i=>Math.cos(i*Math.PI/5)*65,y:i=>Math.sin(i*Math.PI/5)*65-25,scale:1,rotation:180,opacity:0,duration:.8,stagger:.015,ease:'power2.out'});
  }
  function tantrum() {
    clearAnimation(); pet.classList.add('is-furious'); blob.dataset.shape='star';
    if (preference.matches) return;
    animation=gsap.timeline({onComplete:()=>pet.classList.remove('is-furious')})
      .to(blob,{scaleX:1.35,scaleY:.6,duration:.16})
      .to(blob,{y:-45,rotation:180,scaleX:.9,scaleY:1.1,duration:.3,ease:'power2.out'})
      .to(blob,{y:0,rotation:360,scaleX:1.3,scaleY:.75,duration:.25,ease:'power2.in'})
      .to(blob,{x:6,rotation:350,duration:.07,repeat:7,yoyo:true})
      .to(blob,{x:0,rotation:360,scaleX:1,scaleY:1,duration:.45,ease:'elastic.out(1,.4)'});
  }
  function stop() {
    timers.forEach(clearTimeout); timers.clear(); movement?.kill();
    mode=''; pet.classList.remove('is-playing'); stopButton.hidden=true;
    ui.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }
  function idle() {
    stop(); stage.dataset.state='idle'; stage.innerHTML='<div class="mischief-idle"><span class="mischief-orbit">✦</span><strong>TRUCE? BORING.</strong><span>Pick another challenge.</span></div>';
    status.textContent='Your portfolio break has a portfolio break.'; meter.style.width='0%';
  }
  function open(value) {
    panel.hidden=!value; toggle.setAttribute('aria-expanded',String(value)); pet.classList.toggle('club-open',value);
    if (!value) { idle(); clearAnimation(); clearTimeout(holdTimer); held=false; }
    else wake();
  }
  function finish(won, message) {
    const focusInside=stage.contains(document.activeElement);
    const previous=mode; stop(); if(won) human++; else rival++; updateScore();
    stage.dataset.state=won?'won':'lost';
    stage.innerHTML=`<div class="mischief-result"><span>${won?'✦':'↯'}</span><strong>${won?'YOU WIN. ALLEGEDLY.':'THE BLOB WINS.'}</strong><p></p><button data-rematch>Run it back ↗</button></div>`;
    stage.querySelector('p').textContent=message;
    if(focusInside)stage.querySelector('[data-rematch]').focus({preventScroll:true});
    stage.querySelector('[data-rematch]').addEventListener('click',()=>start(previous),{signal});
    status.textContent=won?'+1 YOU · Inkling is filing an appeal.':'+1 INKLING · Rematch button is right there.';
    meter.style.width=won?'100%':'0%'; say(message);
    if(won){tantrum();burst();}else{morph('square');}
  }
  function catchRound() {
    if(mode!=='catch')return;
    const focusInside=stage.contains(document.activeElement);
    stage.replaceChildren(); let dodges=0;
    const count=round<2?1:3;
    for(let i=0;i<count;i++) {
      const target=document.createElement('button'); target.className='mischief-target';
      const real=i===0; target.setAttribute('aria-label',real?'Catch crowned Inkling':'Decoy blob');
      target.innerHTML=(real?'<span class="blob-crown" aria-hidden="true">♛</span>':'')+faceHTML;
      target.querySelector('.inkling-body').dataset.shape=faces[(round+i)%faces.length];
      // Shuffle slots so the crown isn't always in the same place.
      const slot=(i+round)%count;
      target.style.left=count===1?'38%':`${5+slot*31}%`; target.style.top=`${24+((round+i)%2)*46}px`;
      stage.append(target);
      if(real&&focusInside)target.focus({preventScroll:true});
      target.addEventListener('pointerenter',e=>{
        if(!real||e.pointerType!=='mouse'||preference.matches||target.matches(':focus-visible')||dodges>=2)return;
        dodges++; movement?.kill();
        const maxX=stage.clientWidth-target.offsetWidth-10;
        movement=gsap.to(target,{left:Math.random()*maxX,top:15+Math.random()*65,duration:.24,ease:'power2.out'});
        status.textContent=['Missed me. Try aiming with your eyes.','Fine. Two dodges. Now earn it.'][dodges-1];
      },{signal});
      target.addEventListener('click',()=>{
        if(mode!=='catch')return;
        if(!real){finish(false,'That was my unpaid intern. The crown was a clue.');return;}
        movement?.kill(); round++;meter.style.width=`${round*20}%`;
        if(round===5){finish(true,'Five catches? Suspicious. I demand a recount.');return;}
        status.textContent=`${round}/5 · ${round>=2?'Find the crown. The others are decoys.':'Okay. That was the tutorial.'}`;
        catchRound();
      },{signal});
    }
  }
  function patience() {
    stage.innerHTML='<div class="patience-game"><span class="patience-clock">6</span><button class="forbidden-button">DO NOT PRESS</button><span class="patience-taunt">Wait six seconds. That’s literally it.</span></div>';
    stage.querySelector('button').addEventListener('click',()=>{if(mode==='patience')finish(false,'It said DO NOT PRESS. We both saw it.');},{signal});
    const taunts=['Seriously. Don’t.','Your finger looks bored.','FREE WIN. PRESS NOW.','That was a lie. Still don’t press.','One click. What could go wrong?'];
    for(let i=1;i<=6;i++)later(()=>{
      if(mode!=='patience')return;
      if(i===6){finish(true,'Self-control? On the internet? Disgusting. Well played.');return;}
      stage.querySelector('.patience-clock').textContent=6-i;
      stage.querySelector('.patience-taunt').textContent=taunts[i-1];
      stage.querySelector('button').textContent=i===3?'CLAIM YOUR WIN':'DO NOT PRESS';
      meter.style.width=`${i/6*100}%`;
    },i*1000);
  }
  let commands=[];
  function saysRound() {
    const focusInside=stage.contains(document.activeElement);
    const command=commands[round];
    stage.innerHTML=`<div class="says-game"><span class="says-round">ORDER ${round+1} / 5</span><strong>${command.says?'Inkling says:':'Quick!'} ${command.action} me.</strong><div><button data-answer="boop">Boop</button><button data-answer="spin">Spin</button><button data-answer="squish">Squish</button><button data-answer="wait">Nice try. Nope.</button></div></div>`;
    if(focusInside)stage.querySelector('[data-answer]').focus({preventScroll:true});
    stage.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
      if(mode!=='says')return;
      const correct=command.says?button.dataset.answer===command.action:button.dataset.answer==='wait';
      if(!correct){finish(false,command.says?'One tiny instruction. One spectacular detour.':'I never said “Inkling says”. You work for me now.');return;}
      round++; meter.style.width=`${round*20}%`; morph();
      if(round===5)finish(true,'You read the instructions. My only weakness.');
      else {status.textContent=`${round}/5 · ${round%2?'Read carefully. I’m very untrustworthy.':'Okay, detective. Next one.'}`;saysRound();}
    },{signal}));
  }
  function start(next) {
    stop(); clearAnimation(); wake(); mode=next; round=0; stage.dataset.state=next;
    stopButton.hidden=false; pet.classList.add('is-playing'); meter.style.width='0%';
    q(`[data-mode="${next}"]`).setAttribute('aria-pressed','true');
    if(next==='catch'){status.textContent='Catch the crowned blob five times. Decoys lose the round.';say('You versus 58 pixels of pure disrespect.');catchRound();}
    if(next==='patience'){status.textContent='Don’t press the button, even when I tell you to.';say('Six seconds without clicking. Surely you can manage.');patience();}
    if(next==='says'){
      const actions=['boop','spin','squish'];
      commands=[true,false,true,false,true].map(says=>({says,action:actions[Math.floor(Math.random()*actions.length)]}));
      for(let i=commands.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[commands[i],commands[j]]=[commands[j],commands[i]];}
      status.textContent='Only obey “Inkling says”. Otherwise choose “Nice try”.';say('Let’s test that impressive attention span.');saysRound();}
  }
  toggle.addEventListener('click',()=>open(panel.hidden),{signal});
  q('.mischief-close').addEventListener('click',()=>{open(false);toggle.focus();},{signal});
  stopButton.addEventListener('click',()=>{idle();say('Retreat is a strategy. A very specific one.');},{signal});
  ui.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.mode),{signal}));
  play.addEventListener('click',()=>{
    if(suppressClick){suppressClick=false;return;}
    clearAnimation();wake();pokes++;morph();say(quips[(pokes-1)%quips.length]);
    if(pokes%4===0){tantrum();say('FOUR POKES? I’m contacting blob resources.');burst();}
    if(pokes===1)open(true);
  },{signal});
  function squish() {
    clearAnimation();wake();blob.dataset.shape='pancake';say('I’m a developer, not a stress ball.');
    if(preference.matches)return;
    animation=gsap.timeline().to(blob,{scaleX:1.65,scaleY:.35,duration:.25})
      .to(blob,{y:-55,scaleX:.7,scaleY:1.4,rotation:-25,duration:.3})
      .to(blob,{y:0,scaleX:1,scaleY:1,rotation:0,duration:.8,ease:'elastic.out(1,.35)'});
  }
  play.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    suppressClick=false; holdStart=performance.now();
    holdTimer=setTimeout(()=>{held=true;clearAnimation();blob.dataset.shape='pancake';say('LET. GO. OF. THE. MERCHANDISE.');if(!preference.matches)animation=gsap.to(blob,{scaleX:1.7,scaleY:.3,duration:.7});},300);
    play.setPointerCapture(e.pointerId);
  },{signal});
  const release = () => {clearTimeout(holdTimer);if(held){held=false;suppressClick=true;squish();if(performance.now()-holdStart>1500)say('You held me hostage. I’m billing you hourly.');}};
  play.addEventListener('pointerup',release,{signal});
  play.addEventListener('pointercancel',release,{signal});
  ui.querySelectorAll('[data-toy]').forEach(button=>button.addEventListener('click',()=>{
    clearAnimation();wake();const toy=button.dataset.toy;
    if(toy==='morph'){morph();say(['New shape. Same terrible attitude.','Graphic design is my prison.','I contain multitudes. Mostly corners.'][shape%3]);}
    if(toy==='squish')squish();
    if(toy==='dance'){tantrum();say('This is not a tantrum. It’s expressive typography.');burst();}
    if(toy==='feed'){
      snacks++;morph(snacks%3===0?'square':'blob');say(snacks%3===0?'I ate three stars and became a square. Science.':'Bribery accepted. Respect still pending.');
      if(!preference.matches)treatTween=gsap.fromTo(q('.inkling-treat'),{x:35,y:-65,scale:1.3,opacity:1},{x:0,y:0,scale:0,opacity:0,rotation:220,duration:.7,onComplete:burst});
    }
  },{signal}));
  const reset=()=>{open(false);particles?.kill();clearTimeout(speechTimer);bubble.classList.remove('is-speaking');};
  pet.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();reset();toggle.focus();}},{signal});
  pet.querySelector('.inkling-hide').addEventListener('click',reset,{signal});
  document.addEventListener('click',e=>{if(e.target.closest('.project-cover'))reset();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();},{signal});
  preference.addEventListener('change',reset,{signal});
  return()=>{disposed=true;reset();ui.remove();};
}
