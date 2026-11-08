// Original 72 BPM ambient loop: warm extended chords, soft bass, sparse plucks.
export function createAmbientMusic(context, destination) {
  const bus=context.createGain();bus.gain.value=0;bus.connect(destination);
  const chords=[[50,57,60,64],[53,60,64,69],[48,55,59,64],[43,50,57,60]];
  const melody=[0,2,1,3,2,0,3,1];
  const beatLength=60/72,voices=new Set();
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
    while(nextTime<context.currentTime+.25){
      const chord=chords[Math.floor(beat/8)%chords.length],step=beat%8;
      if(step===0)chord.forEach((midi,index)=>{
        note(midi,nextTime,8,.09,'sine',1.4,-3);
        note(midi,nextTime,8,.045,'sine',1.65,3+index);
      });
      if(step===0||step===4)note(chord[0]-12,nextTime,2.6,.15,'sine',.09);
      if(step%2===1)note(chord[melody[(beat>>1)%melody.length]]+12,nextTime,1.8,.075,'triangle',.025);
      beat=(beat+1)%32;nextTime+=beatLength;
    }
  }
  function start(){
    if(disposed||timer!==null||context.state!=='running')return;
    beat=0;nextTime=context.currentTime+.04;
    bus.gain.cancelScheduledValues(context.currentTime);bus.gain.setValueAtTime(0,context.currentTime);bus.gain.linearRampToValueAtTime(.12,context.currentTime+1.5);
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
