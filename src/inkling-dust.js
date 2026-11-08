import gsap from 'gsap';

// Sample the actual local artwork / glyphs, then release their colours as dust.
// Originals keep their layout boxes, so the page never collapses under the actor.
export function createInklingDust() {
  const canvas=document.createElement('canvas');
  canvas.className='inkling-dust'; canvas.setAttribute('aria-hidden','true');
  document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  let grains=[], active=false;
  function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
  resize();
  function snapshot(element) {
    const rect=element.getBoundingClientRect(), source=document.createElement('canvas');
    source.width=Math.max(1,Math.ceil(rect.width));source.height=Math.max(1,Math.ceil(rect.height));
    const paint=source.getContext('2d',{willReadFrequently:true});
    if(!paint)return {source,rect};
    if(element instanceof HTMLImageElement && element.complete && element.naturalWidth) {
      const scale=Math.max(rect.width/element.naturalWidth,rect.height/element.naturalHeight);
      const w=element.naturalWidth*scale,h=element.naturalHeight*scale;
      paint.drawImage(element,(rect.width-w)/2,(rect.height-h)/2,w,h);
    } else {
      const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      let node, count=0;
      while((node=walker.nextNode()) && count<220) {
        const parent=node.parentElement, style=getComputedStyle(parent);
        if(style.visibility==='hidden')continue;
        paint.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        paint.fontStretch=parseFloat(style.fontStretch)<80?'ultra-condensed':'normal';
        paint.fillStyle=style.color;paint.textBaseline='bottom';
        const range=document.createRange();
        for(let i=0;i<node.textContent.length&&count<220;i++,count++) {
          const char=node.textContent[i];if(!char.trim())continue;
          range.setStart(node,i);range.setEnd(node,i+1);
          const box=range.getBoundingClientRect();
          if(box.width&&box.height)paint.fillText(style.textTransform==='uppercase'?char.toUpperCase():char,box.left-rect.left,box.bottom-rect.top,box.width);
        }
      }
    }
    return {source,rect};
  }
  function burst(element) {
    if(!ctx)return;
    const {source,rect}=snapshot(element);
    let pixels;
    try { pixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data; } catch { return; }
    const step=Math.max(3,Math.ceil(Math.sqrt(source.width*source.height/1900)));
    const now=performance.now()/1000;
    for(let y=0;y<source.height;y+=step)for(let x=0;x<source.width;x+=step) {
      const i=(y*source.width+x)*4;if(pixels[i+3]<35)continue;
      grains.push({x:rect.left+x,y:rect.top+y,scroll:scrollY,delay:x/source.width*1.15,
        start:now,life:1.3+Math.random()*.9,vx:70+Math.random()*180,vy:-40-Math.random()*100,
        size:1+Math.random()*Math.min(4,step),phase:Math.random()*6.28,
        color:`rgb(${pixels[i]} ${pixels[i+1]} ${pixels[i+2]})`});
    }
    grains=grains.slice(-4000);
    if(!active){active=true;gsap.ticker.add(draw);}
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const now=performance.now()/1000;
    grains=grains.filter(p=>now-p.start-p.delay<p.life);
    for(const p of grains) {
      const age=now-p.start-p.delay;if(age<0)continue;
      const t=age/p.life, drift=age*age;
      ctx.globalAlpha=Math.min(1,age*18)*(1-t)**1.3;
      ctx.fillStyle=p.color;
      const x=p.x+p.vx*drift*.65+Math.sin(age*6+p.phase)*age*14;
      const y=p.y-(scrollY-p.scroll)+p.vy*age+Math.sin(age*4+p.phase)*age*22;
      ctx.fillRect(x,y,p.size*(1-t*.6),p.size*(1-t*.6));
    }
    ctx.globalAlpha=1;
    if(!grains.length){gsap.ticker.remove(draw);active=false;}
  }
  function clear(){grains=[];gsap.ticker.remove(draw);active=false;ctx?.clearRect(0,0,canvas.width,canvas.height);}
  return {burst,resize,clear,destroy(){clear();canvas.remove();}};
}
