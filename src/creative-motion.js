import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// One bounded canvas for cursor wake, footprints, and the contact debris field.
export function initCreativeMotion() {
  const events=new AbortController(),{signal}=events,media=gsap.matchMedia();
  const canvas=document.createElement('canvas');canvas.className='creative-canvas';canvas.setAttribute('aria-hidden','true');
  document.body.append(canvas);const ctx=canvas.getContext('2d');
  const particles=[];let drawing=false,now=0,ink='#050505',lastTrail=0,lastFoot={x:0,y:0,time:0};
  function resize(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);}
  resize();
  function clear(){particles.length=0;gsap.ticker.remove(draw);drawing=false;ctx?.clearRect(0,0,innerWidth,innerHeight);}
  function add(p){if(!ctx||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;particles.push({...p,born:performance.now()/1000,scroll:scrollY});if(particles.length>180)particles.shift();if(!drawing){drawing=true;gsap.ticker.add(draw);}}
  function draw(){
    if(document.hidden){clear();return;}
    now=performance.now()/1000;ctx.clearRect(0,0,innerWidth,innerHeight);
    for(let i=particles.length-1;i>=0;i--){const p=particles[i],age=now-p.born,t=age/p.life;if(t>=1){particles.splice(i,1);continue;}
      const x=p.toX===undefined?p.x+(p.vx||0)*age:p.x+(p.toX-p.x)*(1-(1-t)**3);
      const y=(p.toY===undefined?p.y+(p.vy||0)*age:p.y+(p.toY-p.y)*(1-(1-t)**3))-(p.fixed?0:scrollY-p.scroll);
      ctx.globalAlpha=(p.alpha||.4)*(1-t);ctx.fillStyle=p.color||ink;ctx.strokeStyle=p.color||ink;
      ctx.beginPath();ctx.ellipse(x,y,p.r*(p.ripple?1+t*5:1),p.r*(p.flat?.45:1)*(p.ripple?1+t*5:1),p.angle||0,0,Math.PI*2);
      if(p.ripple){ctx.lineWidth=1;ctx.stroke();}else ctx.fill();
    }
    ctx.globalAlpha=1;if(!particles.length){clear();}
  }
  window.addEventListener('resize',resize,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();returnLetter();}},{signal});
  const introHeading=document.querySelector('.intro-title'),introLabel=introHeading.getAttribute('aria-label');
  introHeading.setAttribute('aria-label',introHeading.textContent.trim().replace(/\s+/g,' '));
  const words=[...document.querySelectorAll('.intro-title .line-mask > span')];
  const originals=words.map(el=>({el,html:el.innerHTML,label:el.getAttribute('aria-label')}));
  words.forEach(el=>{el.setAttribute('aria-label',el.textContent);el.innerHTML=[...el.textContent].map(char=>`<span class="magnetic-letter" aria-hidden="true">${char===' '?'&nbsp;':char}</span>`).join('');});
  let stolen=null,stolenCopy=null,stolenLine=null,stealTimer,stealTween;
  function returnLetter(){clearTimeout(stealTimer);stealTween?.kill();if(stolen)stolen.classList.remove('letter-stolen');stolen=null;stolenLine?.classList.remove('is-missing-letter');stolenLine=null;stolenCopy?.remove();stolenCopy=null;}
  window.addEventListener('portfolio:pet-steal',e=>{
    if(stolen||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const candidates=[...document.querySelectorAll('.magnetic-letter')].filter(el=>{const r=el.getBoundingClientRect();return r.top>80&&r.bottom<innerHeight&&r.width>8&&getComputedStyle(el.closest('.intro')).visibility!=='hidden';});
    if(!candidates.length)return;
    stolen=candidates[Math.floor(Math.random()*candidates.length)];const r=stolen.getBoundingClientRect(),style=getComputedStyle(stolen);
    stolenCopy=document.createElement('span');stolenCopy.className='stolen-letter';stolenCopy.textContent=stolen.textContent;stolenCopy.setAttribute('aria-hidden','true');
    Object.assign(stolenCopy.style,{left:`${r.left}px`,top:`${r.top}px`,font:style.font,color:style.color,lineHeight:style.lineHeight,width:`${r.width}px`});document.body.append(stolenCopy);stolen.classList.add('letter-stolen');stolenLine=stolen.parentElement;stolenLine.classList.add('is-missing-letter');
    stealTween=gsap.to(stolenCopy,{x:e.detail.x-r.left+45,y:e.detail.y-r.top-5,scale:.25,rotation:18,duration:.6,ease:'power3.inOut'});
    stealTimer=setTimeout(returnLetter,3200);
  },{signal});
  window.addEventListener('portfolio:pet-position',e=>{if(stolenCopy&&!stealTween?.isActive()){gsap.set(stolenCopy,{left:e.detail.x+45,top:e.detail.y-5,x:0,y:0});}},{signal});
  for(const name of ['portfolio:pet-reset','portfolio:theme','portfolio:project-art','portfolio:loop-start'])window.addEventListener(name,returnLetter,{signal});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')returnLetter();},{signal});

  const dialog=document.querySelector('#project-dialog');
  const constellation=document.createElement('section');constellation.className='project-constellation';constellation.setAttribute('aria-label','Explore the project technologies');
  dialog.querySelector('.project-description').after(constellation);
  let shards=[],shardTween,graphEvents=new AbortController();
  const roles=[[/react|next|tailwind|shadcn|ui|web|leaflet|recharts/i,'Interfaces and interaction'],[/mongo|sql|prisma|pandas|numpy|data/i,'Data and application state'],[/esp|arduino|sensor|led|motor|finger/i,'Hardware and control'],[/python|llm|groq|ai|scikit|logistic/i,'Analysis and intelligence'],[/webgl|glsl|gsap|lenis|vite|javascript/i,'Rendering and creative code']];
  function projectArt(e){
    const {project,rect,closing}=e.detail;
    if(!closing){
      graphEvents.abort();graphEvents=new AbortController();
      constellation.replaceChildren();const title=document.createElement('h3');title.textContent='Inside the build';constellation.append(title);
      const graph=document.createElement('div');graph.className='constellation-graph';
      graph.innerHTML='<svg viewBox="0 0 600 160" aria-hidden="true"><path d="M50 80 Q150 0 250 80 T450 80 T580 80"/><circle cx="300" cy="80" r="55"/></svg>';
      const description=document.createElement('p');description.className='constellation-description';description.setAttribute('role','status');description.textContent='Select a technology to explore its role.';
      const techs=project.stack.split(' · ').slice(0,8);
      techs.forEach((tech,index)=>{const button=document.createElement('button');button.textContent=tech;button.style.setProperty('--node-index',index);button.setAttribute('aria-pressed','false');
        const activate=()=>{graph.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const role=roles.find(([pattern])=>pattern.test(tech))?.[1]||'Part of the project’s technical approach';description.textContent=`${tech} — ${role.toLowerCase()}.`;const featureTerms=/leaflet|map/i.test(tech)?/map|gps|trajectory/i:/chart|pandas|numpy|scikit|logistic/i.test(tech)?/chart|analytic|data|model|train/i:/esp|arduino|led|sensor|motor/i.test(tech)?/register|fetch|sensor|instruction|motor|hardware/i:/react|next|tailwind|shadcn/i.test(tech)?/interface|dashboard|control|workflow|role/i:/mongo|sql|prisma|zustand/i.test(tech)?/record|data|state|access|workflow/i:null;
          dialog.querySelectorAll('#dialog-features li').forEach(li=>li.classList.toggle('tech-feature-active',featureTerms?featureTerms.test(li.textContent):tech.toLowerCase().split(/\W/).some(word=>word.length>3&&li.textContent.toLowerCase().includes(word))));};
        button.addEventListener('pointerenter',activate,{signal:graphEvents.signal});button.addEventListener('focus',activate,{signal:graphEvents.signal});button.addEventListener('click',activate,{signal:graphEvents.signal});graph.append(button);});
      constellation.append(graph,description);
    }
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||!rect)return;
    shardTween?.kill();shards.forEach(s=>s.remove());shards=[];
    const titleRect=dialog.querySelector('#dialog-title').getBoundingClientRect();
    for(let i=0;i<18;i++){const bit=document.createElement('i');bit.className='project-shard';bit.setAttribute('aria-hidden','true');dialog.append(bit);shards.push(bit);
      const edge=i/18;const x=rect.left+rect.width*(edge<.5?edge*2:1-(edge-.5)*2),y=edge<.5?rect.top:rect.bottom;
      gsap.set(bit,{x,y,opacity:0,rotation:i*23});}
    shardTween=gsap.timeline({onComplete:()=>{shards.forEach(s=>s.remove());shards=[];}})
      .to(shards,{opacity:.8,duration:.1})
      .to(shards,{x:i=>closing?rect.left+rect.width*i/18:titleRect.left+(i/18)*Math.min(titleRect.width,400),y:i=>closing?rect.top+rect.height/2:titleRect.top+(i%2?-12:titleRect.height+12),rotation:0,duration:.75,stagger:.008,ease:'power3.inOut'},0)
      .to(shards,{opacity:0,scale:.2,duration:.3},.8);
  }
  window.addEventListener('portfolio:project-art',projectArt,{signal});
  dialog.addEventListener('close',()=>{shardTween?.kill();shards.forEach(s=>s.remove());shards=[];},{signal});

  media.add('(prefers-reduced-motion: no-preference)',()=>{
    const local=new AbortController(),s=local.signal;let lastX=null,lastY=null,lastTime=0;
    ink=getComputedStyle(document.documentElement).getPropertyValue('--ink');
    window.addEventListener('portfolio:mischief-burst',e=>{
      const {x,y}=e.detail,colors=[getComputedStyle(document.documentElement).getPropertyValue('--ink'),'#e6573d','#e8c978','#b9d5ca'];
      for(let i=0;i<90;i++){
        const angle=i/90*Math.PI*2,distance=75+Math.random()*230;
        add({x,y,vx:Math.cos(angle)*distance,vy:Math.sin(angle)*distance+65,r:2+Math.random()*5,flat:i%3===0,angle,life:.75+Math.random()*.7,alpha:.8,color:colors[i%colors.length],fixed:true});
      }
    },{signal:s});
    window.addEventListener('portfolio:mischief-state',e=>{if(e.detail?.phase==='cancelled')clear();},{signal:s});
    window.addEventListener('portfolio:pet-step',e=>{
      const p=e.detail,t=performance.now();if(t-lastFoot.time<140||Math.hypot(p.x-lastFoot.x,p.y-lastFoot.y)<15)return;
      lastFoot={...p,time:t};add({x:p.x+28+(Math.round(t/140)%2)*15,y:p.y+78,r:p.angry?6:3.5,flat:true,life:p.angry?3:1.8,alpha:.2,color:getComputedStyle(document.querySelector('.inkling')).getPropertyValue('--ink')});
    },{signal:s});
    window.addEventListener('pointermove',e=>{
      const hero=document.querySelector('#hero-visual'),t=performance.now();
      if(e.pointerType!=='mouse'||t-lastTrail<35||getComputedStyle(hero).visibility==='hidden'||hero.getBoundingClientRect().bottom<0){lastX=null;return;}
      const velocity=lastX===null?0:Math.hypot(e.clientX-lastX,e.clientY-lastY)/Math.max(1,t-lastTime);
      lastTrail=t;lastX=e.clientX;lastY=e.clientY;lastTime=t;
      const color=getComputedStyle(document.documentElement).getPropertyValue('--paper');
      add({x:e.clientX,y:e.clientY,r:velocity>.6?Math.min(8,velocity*2):3,ripple:velocity<=.6,vx:velocity>.6?10:0,vy:-7,life:velocity>.6?.55:1.1,alpha:.16,color,fixed:true});
    },{signal:s,passive:true});
    // Magnetic letters use one nearest neighbourhood, without relayout.
    const magnetic=[...document.querySelectorAll('.magnetic-letter')];let pointerFrame=0;
    const resetLetters=()=>gsap.to(magnetic,{x:0,y:0,rotation:0,duration:.65,ease:'elastic.out(1,.5)',overwrite:true});
    const heading=document.querySelector('.intro-title');
    heading.addEventListener('pointermove',e=>{if(performance.now()-pointerFrame<45)return;pointerFrame=performance.now();magnetic.forEach(letter=>{if(letter===stolen)return;const r=letter.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy),f=Math.max(0,1-d/170);gsap.to(letter,{x:dx*f*.1,y:dy*f*.12,rotation:dx*f*.025,duration:.35,overwrite:true});});},{signal:s});
    heading.addEventListener('pointerleave',resetLetters,{signal:s});
    const grid=document.querySelector('.scene-grid'),edgeNodes=[grid,document.querySelector('.site-footer')];let edgeTween,lastEdge=0;
    window.addEventListener('portfolio:edge-stretch',e=>{if(performance.now()-lastEdge<180)return;lastEdge=performance.now();edgeTween?.kill();edgeTween=gsap.timeline().to(edgeNodes,{scaleY:1.025,skewX:e.detail.direction*1.2,duration:.13}).to(edgeNodes,{scaleY:1,skewX:0,duration:.7,ease:'elastic.out(1,.45)'});},{signal:s});
    const constellationObserver=new IntersectionObserver(entries=>entries.forEach(entry=>constellation.classList.toggle('is-constellation-live',entry.isIntersecting)),{threshold:.15});
    constellationObserver.observe(constellation);
    const contact=document.querySelector('#contact-title');
    const contactTrigger=ScrollTrigger.create({trigger:contact,start:'top 94%',onEnter:()=>{
      const r=contact.getBoundingClientRect(),wordRects=[...contact.querySelectorAll('.finale-word')].filter(w=>w.textContent.trim()).map(w=>w.getBoundingClientRect());ink=getComputedStyle(contact).color;
      for(let i=0;i<42;i++)add({x:Math.random()*innerWidth,y:innerHeight+Math.random()*80,toX:(wordRects[i%wordRects.length]||r).left+Math.random()*(wordRects[i%wordRects.length]||r).width,toY:(wordRects[i%wordRects.length]||r).top+Math.random()*(wordRects[i%wordRects.length]||r).height,r:2+Math.random()*4,life:1.4+Math.random()*.5,alpha:.5,color:ink});
    }});
    return()=>{local.abort();contactTrigger.kill();constellationObserver.disconnect();constellation.classList.remove('is-constellation-live');clear();returnLetter();edgeTween?.kill();gsap.set(edgeNodes,{clearProps:'transform'});gsap.killTweensOf(magnetic);gsap.set(magnetic,{clearProps:'transform'});shardTween?.kill();shards.forEach(s=>s.remove());};
  });
  return()=>{media.revert();events.abort();graphEvents.abort();if(introLabel===null)introHeading.removeAttribute('aria-label');else introHeading.setAttribute('aria-label',introLabel);returnLetter();clear();shardTween?.kill();shards.forEach(s=>s.remove());canvas.remove();constellation.remove();originals.forEach(({el,html,label})=>{el.innerHTML=html;if(label===null)el.removeAttribute('aria-label');else el.setAttribute('aria-label',label);});};
}
