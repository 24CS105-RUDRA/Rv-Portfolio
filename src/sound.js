import { createAmbientMusic } from './music.js';

// Original procedural soundtrack and effects; no audio downloads.
export function soundCue(name) {
  window.dispatchEvent(new CustomEvent('portfolio:sound',{detail:name}));
}

export function initSound() {
  const events=new AbortController(),{signal}=events;
  let context,master,noise,music,enabled=true,musicEnabled=true,disposed=false;
  const sources=new Set(),lastPlayed=new Map();
  try{enabled=localStorage.getItem('portfolio-sound')!=='off';musicEnabled=localStorage.getItem('portfolio-music')!=='off';}catch{}
  const buttons=[document.body,document.querySelector('#project-dialog')].filter(Boolean).map(parent=>{
    const button=document.createElement('button');button.className='sound-toggle';button.type='button';
    button.innerHTML='<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="sound-label"></span>';
    parent.append(button);return button;
  });
  const musicButtons=buttons.map(button=>{
    const control=document.createElement('button');control.className='sound-toggle music-toggle';control.type='button';
    control.innerHTML='<span aria-hidden="true">♫</span><span class="sound-label"></span>';
    button.parentElement.append(control);return control;
  });
  function update(){for(const button of buttons){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Mute sound effects':'Enable sound effects');button.querySelector('.sound-label').textContent=enabled?'Sound on':'Sound off';}
    for(const button of musicButtons){button.setAttribute('aria-pressed',String(musicEnabled));button.setAttribute('aria-label',musicEnabled?'Mute background music':'Enable background music');button.querySelector('.sound-label').textContent=musicEnabled?'Music on':'Music off';}
  }
  function stop(){for(const source of sources){try{source.stop();}catch{}source.disconnect();}sources.clear();}
  function unlock() {
    if((!enabled&&!musicEnabled)||disposed||document.hidden)return;
    try {
      if(!context){
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext){enabled=musicEnabled=false;update();[...buttons,...musicButtons].forEach(b=>b.disabled=true);return;}
        context=new AudioContext();master=context.createGain();master.gain.value=.16;
        const limiter=context.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=20;limiter.ratio.value=6;
        master.connect(limiter);limiter.connect(context.destination);
        music=createAmbientMusic(context,limiter);
        noise=context.createBuffer(1,Math.ceil(context.sampleRate*1.6),context.sampleRate);
        const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      }
      if(context.state==='suspended')context.resume().then(()=>{if(musicEnabled&&!disposed&&!document.hidden)music.start();}).catch(()=>{});
      else if(musicEnabled)music.start();
    }catch{enabled=musicEnabled=false;update();}
  }
  function voice(source,filter,when,duration,volume) {
    if(sources.size>=24){const oldest=sources.values().next().value;try{oldest.stop();}catch{}sources.delete(oldest);}
    const gain=context.createGain();
    gain.gain.setValueAtTime(.0001,when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),when+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    if(filter){source.connect(filter);filter.connect(gain);}else source.connect(gain);
    gain.connect(master);sources.add(source);
    source.onended=()=>{sources.delete(source);source.disconnect();filter?.disconnect();gain.disconnect();};
    source.start(when);source.stop(when+duration+.03);
  }
  function tone(frequency,end,duration,volume=.3,type='sine',delay=0) {
    const when=context.currentTime+delay,source=context.createOscillator();source.type=type;
    source.frequency.setValueAtTime(frequency,when);source.frequency.exponentialRampToValueAtTime(end,when+duration);
    voice(source,null,when,duration,volume);
  }
  function air(frequency,end,duration,volume=.25,delay=0) {
    const when=context.currentTime+delay,source=context.createBufferSource(),filter=context.createBiquadFilter();
    source.buffer=noise;filter.type='bandpass';filter.Q.value=.7;
    filter.frequency.setValueAtTime(frequency,when);filter.frequency.exponentialRampToValueAtTime(end,when+duration);
    voice(source,filter,when,duration,volume);
  }
  function play(name) {
    if(!enabled||disposed||document.hidden||context?.state!=='running')return;
    const now=performance.now(),gap=name==='impact'?700:name==='pop'?95:180;
    if(now-(lastPlayed.get(name)??-Infinity)<gap)return;
    lastPlayed.set(name,now);
    switch(name){
      case 'nav':tone(640,420,.07,.12);break;
      case 'gallery':tone(330,510,.09,.15,'triangle');break;
      case 'open':air(300,1800,.65,.22);tone(180,370,.45,.2);break;
      case 'close':air(1500,180,.48,.18);tone(340,130,.3,.17);break;
      case 'pop':tone(380+Math.random()*120,150,.14,.38);break;
      case 'dodge':tone(530,950,.13,.16,'sine');break;
      case 'anger':tone(95,65,.65,.5,'triangle');tone(145,100,.55,.2,'triangle',.12);air(180,750,.6,.12);break;
      case 'impact':tone(120,42,.3,.55);air(2200,240,.95,.4);air(3600,850,.65,.16,.15);break;
      case 'restore':tone(392,392,.27,.2);tone(494,494,.3,.18,'sine',.1);tone(587,587,.4,.16,'sine',.2);break;
      case 'theme':air(220,2200,.8,.2);tone(130,260,.55,.17);break;
    }
  }
  function toggle(){enabled=!enabled;try{localStorage.setItem('portfolio-sound',enabled?'on':'off');}catch{}update();if(enabled){unlock();context?.resume().then(()=>play('restore')).catch(()=>{});}else{stop();if(!musicEnabled)context?.suspend().catch(()=>{});}}
  buttons.forEach(button=>button.addEventListener('click',toggle,{signal}));
  musicButtons.forEach(button=>button.addEventListener('click',()=>{
    musicEnabled=!musicEnabled;
    try{localStorage.setItem('portfolio-music',musicEnabled?'on':'off');}catch{}
    update();
    if(musicEnabled)unlock();
    else{music?.stop();if(!enabled)context?.suspend().catch(()=>{});}
  },{signal}));
  document.addEventListener('pointerdown',e=>{if(e.isTrusted&&!e.target.closest('.sound-toggle'))unlock();},{signal,capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.isTrusted&&!e.repeat&&!e.target.closest('input,textarea,select,[contenteditable="true"]'))unlock();},{signal,capture:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('.top-nav a,.hero-controls a,.site-footer a'))play('nav');
  },{signal});
  window.addEventListener('portfolio:sound',e=>play(e.detail),{signal});
  window.addEventListener('portfolio:theme',()=>play('theme'),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();music?.stop();context?.suspend().catch(()=>{});}},{signal});
  update();
  return()=>{disposed=true;events.abort();stop();music?.destroy();context?.close().catch(()=>{});[...buttons,...musicButtons].forEach(b=>b.remove());};
}
