// The phone mix moves energy into audible mids rather than boosting sub-bass.
export function createAmbientMusic(context, destination, {mobile = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false} = {}) {
  const bus=context.createGain();bus.gain.value=0;bus.connect(destination);
  const chords=[[50,57,60,64],[53,60,64,69],[48,55,59,64],[43,50,57,60]];
  const melody=[0,2,1,3,2,0,3,1];
  const beatLength=60/(mobile?84:72),voices=new Set();
  let timer=null,beat=0,nextTime=0,disposed=false;
  const hz=midi=>440*2**((midi-69)/12);
  function note(midi,time,duration,level,type='sine',attack=.04,detune=0) {
    const osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
    osc.type=type;osc.frequency.value=hz(midi);osc.detune.value=detune;
    filter.type='lowpass';filter.frequency.value=type==='triangle'?1100:2400;
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(level,time+attack);
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(bus);voices.add(osc);
    osc.onended=()=>{voices.delete(osc);osc.disconnect();filter.disconnect();gain.disconnect();};
    osc.start(time);osc.stop(time+duration+.03);
  }
  function schedule() {
    if(disposed||context.state!=='running')return;
    // Do not catch up a backlog after a stalled frame or sleeping device.
    if(nextTime<context.currentTime-.2)nextTime=context.currentTime+.05;
    // Extra phone look-ahead keeps the beat scheduled during short UI stalls.
    while(nextTime<context.currentTime+(mobile?.45:.25)){
      const chord=chords[Math.floor(beat/8)%chords.length],step=beat%8;
      if(step===0)chord.forEach((midi,index)=>{
        const pitch=midi+(mobile?12:0);
        note(pitch,nextTime,mobile?6:8,mobile ? .075 : .09,'sine',mobile ? .4 : 1.4,-3);
        note(pitch,nextTime,mobile?6:8,mobile ? .035 : .045,'sine',mobile ? .5 : 1.65,3+index);
      });
      if(step===0||step===4)note(chord[0]-(mobile?0:12),nextTime,mobile?1.6:2.6,mobile ? .12 : .15,mobile?'triangle':'sine',.09);
      if(step%2===1)note(chord[melody[(beat>>1)%melody.length]]+12,nextTime,mobile?1.4:1.8,mobile ? .105 : .075,'triangle',.025);
      beat=(beat+1)%32;nextTime+=beatLength;
    }
  }
  function start(){
    if(disposed||timer!==null||context.state!=='running')return;
    beat=0;nextTime=context.currentTime+.04;
    bus.gain.cancelScheduledValues(context.currentTime);bus.gain.setValueAtTime(0,context.currentTime);bus.gain.linearRampToValueAtTime(mobile ? .28 : .12,context.currentTime+(mobile ? .55 : 1.5));
    schedule();timer=setInterval(schedule,100);
  }
  function stop(){
    clearInterval(timer);timer=null;
    bus.gain.cancelScheduledValues(context.currentTime);bus.gain.setTargetAtTime(0,context.currentTime,.025);
    for(const osc of voices){try{osc.stop(context.currentTime+.1);}catch{}}
    voices.clear();
  }
  return {start,stop,destroy(){disposed=true;stop();bus.disconnect();}};
}
