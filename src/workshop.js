import gsap from 'gsap';
import { renderMachine, downloadMachinePostcard } from './machine-art';
import { projectNotes } from './project-notes';
import { soundCue } from './sound';

export const projectParts={
  manoviz:'cpu',prezon:'sensor',codeoracle:'logic',interviewspar:'logic','ai-sales':'logic',
  transitops:'route',nagardrishti:'route',anpr:'route','light-robot':'wheel',
  'school-erp':'interface',portfolio:'interface','qr-attendance':'sensor',
  silentguardian:'interface','smoker-prediction':'logic','brainy-beam':'logic',
};
export const partNames={cpu:'a glowing register',sensor:'a sensor',logic:'a thinking engine',route:'a route switch',wheel:'a wandering wheel',interface:'an interface'};
const storageKey='rudra-curiosity-machine-v1';

export function initWorkshop(scroll) {
  const events=new AbortController(),{signal}=events;
  const section=document.querySelector('#workshop'),drawing=section.querySelector('#machine-drawing');
  const status=section.querySelector('#machine-status'),output=section.querySelector('#machine-output');
  const run=section.querySelector('#machine-run'),download=section.querySelector('#machine-download');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),parts=new Set();
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))saved.filter(id=>typeof id==='string'&&Object.hasOwn(partNames,id)).forEach(id=>parts.add(id));}catch{}
  let running=false,printTimer,finishTimer,toastTimer,installTween;
  const dialog=document.querySelector('#project-dialog');
  const receipt=document.createElement('p');receipt.className='workshop-receipt';receipt.setAttribute('role','status');dialog.append(receipt);
  const notebook=document.createElement('details');notebook.className='project-notebook';
  notebook.innerHTML='<summary>Under the polish <span>Engineering notes</span></summary><div class="notebook-pages"><div class="notebook-sketch" aria-label="Approach sketch"></div><div class="notebook-notes"></div></div>';
  dialog.querySelector('#next-project').before(notebook);
  function update(){
    installTween?.kill();drawing.innerHTML=renderMachine([...parts]);
    status.textContent=parts.size?`${parts.size} ${parts.size===1?'part':'parts'} found in your curiosity. There’s still room for your idea.`:'An empty workbench. Explore any project to leave a little curiosity here.';
    section.dataset.parts=String(parts.size);
    const trail=document.querySelector('#machine-trail');if(trail)trail.textContent=`Your machine · ${parts.size} / 6 parts`;
  }
  function stop(){clearTimeout(printTimer);clearTimeout(finishTimer);if(running&&output.dataset.ready==='false'){output.textContent='The workbench is ready when you are. Give it another spin.';output.dataset.ready='idle';}running=false;section.classList.remove('is-running');run.disabled=false;run.textContent='See what we made';}
  function print(){
    section.classList.add('has-output');
    output.textContent=parts.size>=2?'We’ve connected a few ideas. What’s yours?':parts.size===1?'One curious idea is a good beginning. What comes next?':'Every machine starts with a little curiosity. Explore a project, then come back.';
    output.dataset.ready='true';soundCue('print');
  }
  run.addEventListener('click',()=>{
    if(running)return;running=true;run.disabled=true;run.textContent='Inkling is on it…';section.classList.remove('has-output');output.textContent='Connecting a few ideas…';output.dataset.ready='false';
    soundCue('machine');window.dispatchEvent(new CustomEvent('portfolio:machine-run',{detail:{parts:[...parts]}}));
    if(reduced.matches){print();stop();return;}
    section.classList.add('is-running');printTimer=setTimeout(print,1500);finishTimer=setTimeout(stop,3100);
  },{signal});
  download.addEventListener('click',()=>{try{downloadMachinePostcard([...parts]);soundCue('print');status.textContent='Your curiosity postcard is ready. Keep a little piece of the workshop.';}catch{status.textContent='Your browser could not save the postcard. You can still explore the machine here.';}},{signal});
  section.querySelector('.machine-contact').addEventListener('click',e=>{e.preventDefault();scroll.toSection('contact',{focus:true,updateHash:true});},{signal});
  drawing.addEventListener('click',e=>{if(e.target.closest('[data-contact-socket]')){e.preventDefault();scroll.toSection('contact',{focus:true,updateHash:true});}},{signal});
  window.addEventListener('portfolio:project-art',e=>{
    if(e.detail.closing)return;
    stop();
    const {id,project}=e.detail,part=projectParts[id],note=projectNotes[id];
    notebook.hidden=!note;notebook.open=false;
    const sketches=notebook.querySelector('.notebook-sketch'),notes=notebook.querySelector('.notebook-notes');sketches.replaceChildren();notes.replaceChildren();
    if(note){
      note.sketch.forEach((label,index)=>{const item=document.createElement('span');item.className='sketch-step';item.textContent=label;if(index===0)item.dataset.start='';sketches.append(item);});
      for(const [key,label] of [['constraint','The constraint'],['decision','The approach'],['boundary','What to keep in mind']]){const article=document.createElement('div'),title=document.createElement('h4'),p=document.createElement('p');title.textContent=label;p.textContent=note[key];article.append(title,p);notes.append(article);}
    }
    clearTimeout(toastTimer);
    if(part&&!parts.has(part)){
      parts.add(part);try{sessionStorage.setItem(storageKey,JSON.stringify([...parts]));}catch{}
      update();receipt.textContent=`A little souvenir from ${project.title}: ${partNames[part]}. Inkling saved it for your machine.`;receipt.classList.add('is-visible');
      window.dispatchEvent(new CustomEvent('portfolio:machine-part',{detail:{part,label:partNames[part]}}));
    }else{receipt.textContent=part?`This project shares ${partNames[part]} with your machine.`:'';receipt.classList.toggle('is-visible',!!part);}
    toastTimer=setTimeout(()=>receipt.classList.remove('is-visible'),4500);
  },{signal});
  window.addEventListener('portfolio:machine-install',e=>{
    const socket=drawing.querySelector(`[data-machine-part="${e.detail.part}"]`);if(!socket||reduced.matches)return;
    installTween?.kill();installTween=gsap.fromTo(socket,{scale:.75,opacity:.3,rotation:-5,transformOrigin:'center center'},{scale:1,opacity:1,rotation:0,duration:.8,ease:'elastic.out(1,.4)'});
  },{signal});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>section.classList.toggle('workshop-in-view',entry.isIntersecting)),{threshold:.12});observer.observe(section);
  reduced.addEventListener('change',()=>{stop();installTween?.kill();update();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal});
  window.addEventListener('portfolio:loop-start',stop,{signal});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')stop();},{signal});
  update();
  return()=>{stop();events.abort();clearTimeout(toastTimer);observer.disconnect();installTween?.kill();receipt.remove();notebook.remove();drawing.replaceChildren();section.classList.remove('workshop-in-view','is-running','has-output');};
}
