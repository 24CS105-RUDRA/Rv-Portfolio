// Original SVG workshop drawing. Known component IDs are the only inputs rendered.
const PARTS = {
  cpu: { label: 'A VISIBLE THOUGHT', name: 'Computer register', color: '#d1dabf' },
  sensor: { label: 'A HUMAN SIGNAL', name: 'Fingerprint sensor', color: '#e8c590' },
  logic: { label: 'A LITTLE LOGIC', name: 'Code engine', color: '#d7c5e5' },
  route: { label: 'WAYS TO CONNECT', name: 'Route switch', color: '#b8d4e1' },
  wheel: { label: 'FORWARD, MOSTLY', name: 'Robot wheel', color: '#d7df9d' },
  interface: { label: 'SOMETHING HUMAN', name: 'Interface', color: '#e7bcae' },
};

const cleanParts = parts => new Set((Array.isArray(parts) ? parts : []).filter(id => Object.hasOwn(PARTS, id)));
const line = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

function moduleBox(id, x, y, width, height, collected, drawing) {
  const part = PARTS[id];
  return `<g class="machine-module machine-module--${id}${collected ? ' is-collected' : ' is-empty'}" data-part="${id}" data-machine-part="${id}" style="color:${collected ? '#171719' : 'var(--ink,#171719)'}" transform="translate(${x} ${y})" aria-label="${part.name}${collected ? ', collected' : ', not yet collected'}">
    <rect class="machine-socket" x="0" y="0" width="${width}" height="${height}" rx="12" fill="${collected ? part.color : 'var(--paper,#f6f5f2)'}" stroke="currentColor" stroke-width="1.5" ${collected ? '' : 'stroke-dasharray="4 6" opacity=".5"'}/>
    ${collected ? drawing : `<g opacity=".3" ${line}><path d="M${width / 2 - 9} ${height / 2}h18m-9-9v18"/><circle cx="${width / 2}" cy="${height / 2}" r="25"/></g>`}
    <text x="${width / 2}" y="${height + 19}" text-anchor="middle" font-size="9" letter-spacing="1.25" fill="var(--ink,#171719)" opacity="${collected ? '.75' : '.4'}">${part.label}</text>
  </g>`;
}

function drawCpu() {
  return `<rect x="35" y="23" width="100" height="70" rx="5" fill="#f6f5f2" stroke="currentColor" stroke-width="1.5"/>
    <g ${line}>${[0, 1, 2, 3, 4].map(i => `<path d="M${45 + i * 20} 16v7m0 70v7"/>`).join('')}${[0, 1, 2].map(i => `<path d="M28 ${37 + i * 20}h7m100 0h7"/>`).join('')}</g>
    <g class="machine-register" fill="currentColor">${[0, 1, 2, 3].map(i => `<rect x="${48 + i * 20}" y="43" width="12" height="25" rx="2" opacity="${i % 2 ? '.2' : '.85'}"/>`).join('')}</g>
    <text x="85" y="84" text-anchor="middle" font-size="8" letter-spacing="2">PC → AC</text>`;
}
function drawSensor() {
  return `<rect x="30" y="16" width="76" height="91" rx="27" fill="#f6f5f2" stroke="currentColor" stroke-width="1.5"/>
    <g class="machine-fingerprint" ${line} stroke-width="1.5">
      <path d="M46 64v-8c0-28 44-28 44 0v19m-37 1V56c0-19 30-19 30 0v29m-23-5V58c0-10 16-10 16 0v30m-8-30v24m-22-9c-1 13 5 23 13 28m18-5 4-5m-13-2c-1 9-4 13-8 17"/>
    </g><circle class="machine-signal" cx="68" cy="120" r="3" fill="currentColor"/>`;
}
function drawLogic() {
  return `<path d="M33 34 15 56l18 22m99-44 18 22-18 22" ${line}/>
    <rect x="49" y="19" width="66" height="79" rx="25" fill="#f6f5f2" stroke="currentColor" stroke-width="1.5"/>
    <g ${line} stroke-width="1.5"><path d="M82 31v55m-8-43c-20-14-26 21-7 22m22-25c19-7 24 15 11 24m-34-7c-20 2-14 27 0 25m26-21c22 4 12 29-3 22"/></g>
    <circle class="machine-signal" cx="82" cy="106" r="3" fill="currentColor"/>`;
}
function drawRoute() {
  return `<g ${line}><path d="M20 76h36c16 0 13-50 30-50h73M20 26h30c16 0 24 50 42 50h67" stroke-width="3"/>
    <path class="machine-route-flow" d="M20 76h36c16 0 13-50 30-50h73" stroke="#f6f5f2" stroke-dasharray="6 22" stroke-width="2"/>
    <path d="m88 25 14-16m-14 16 14 14"/>
    </g><g fill="#f6f5f2" stroke="currentColor" stroke-width="1.5"><circle cx="20" cy="26" r="6"/><circle cx="20" cy="76" r="6"/><circle cx="159" cy="26" r="6"/><circle cx="159" cy="76" r="6"/></g>`;
}
function drawWheel() {
  return `<g class="machine-gear machine-wheel" style="transform-origin:68px 53px">
    <circle cx="68" cy="53" r="43" fill="#f6f5f2" stroke="currentColor" stroke-width="6" stroke-dasharray="5 4"/>
    <circle cx="68" cy="53" r="33" ${line}/>
    <g ${line}>${Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return `<path d="M${(68 + Math.cos(a) * 10).toFixed(1)} ${(53 + Math.sin(a) * 10).toFixed(1)}l${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 22).toFixed(1)}"/>`; }).join('')}</g>
    <circle cx="68" cy="53" r="10" fill="currentColor"/>
    </g><path d="M11 106h114" ${line} opacity=".4"/>`;
}
function drawInterface() {
  return `<rect x="19" y="15" width="132" height="79" rx="6" fill="#f6f5f2" stroke="currentColor" stroke-width="1.5"/>
    <path d="M19 33h132m-66 61v14m-27 0h54" ${line}/>
    <g fill="currentColor"><circle cx="28" cy="24" r="2"/><circle cx="35" cy="24" r="2"/><circle cx="42" cy="24" r="2"/></g>
    <path class="machine-screen-signal" d="M35 65h16l8-13 11 26 12-31 10 18h42" ${line}/>`;
}

/** Render a complete machine drawing with six optional parts and one always-empty idea socket. */
export function renderMachine(parts, { compact = false } = {}) {
  const collected = cleanParts(parts);
  const count = collected.size;
  return `<svg class="machine-art${count ? ' has-parts' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="100%" stroke-width="2" role="img" aria-label="An unfinished machine, assembled from ${count} of six project components. The final socket is open for your idea." style="color:var(--ink,#171719);font-family:ui-monospace,SFMono-Regular,Consolas,monospace">
    <title>The Unfinished Machine</title><desc>Computer registers, a fingerprint sensor, code intelligence, route switches, a robot wheel, and an interface share a handmade chassis. Your idea belongs in the open socket.</desc>
    <g class="machine-chassis" ${line} stroke-width="1.5">
      <path d="M55 82Q44 84 44 98v348q0 19 20 19h657q17 0 17-20V101q0-20-20-20Z" fill="var(--machine-chassis,#f0efe9)"/>
      <path d="M52 89h676M53 456h674" opacity=".18"/>
      ${[[58, 97], [723, 96], [59, 449], [722, 448]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/><path d="m${x - 2} ${y + 2} 4-4"/>`).join('')}
      <path d="M171 83V56h60m-53-6v12m7-12v12m7-12v12M559 82V60q0-12 12-12h37"/><circle class="machine-signal" cx="614" cy="48" r="6" fill="${count ? '#d1dabf' : '#f6f5f2'}"/>
      <path d="M237 196h57m136 0h48M173 263v32h-6v25m195-57v57m199-57v57M256 375h38m136 0h48M649 196h50v179h-50m50-90h66" stroke-width="3" opacity=".35"/>
      <path class="machine-connection machine-route-flow" d="M237 196h57m136 0h48M173 263v32h-6v25m195-57v57m199-57v57M256 375h38m136 0h48M649 196h50v179h-50m50-90h66" stroke-width="2" stroke-dasharray="3 19" opacity="${count ? '.8' : '.12'}"/>
    </g>
    <g font-size="9" letter-spacing="1.4" fill="currentColor">
      <text x="64" y="34">A WORKSHOP FOR CONNECTING IDEAS</text>
      <text class="machine-printer" x="64" y="505" opacity=".55">${count ? `${String(count).padStart(2, '0')} PART${count === 1 ? '' : 'S'} FOUND / INFINITELY MANY POSSIBILITIES` : 'START WITH ONE GOOD QUESTION.'}</text>
    </g>
    ${moduleBox('cpu', 87, 133, 170, 112, collected.has('cpu'), drawCpu())}
    ${moduleBox('sensor', 294, 133, 136, 130, collected.has('sensor'), drawSensor())}
    ${moduleBox('logic', 478, 133, 171, 112, collected.has('logic'), drawLogic())}
    ${moduleBox('route', 87, 320, 180, 107, collected.has('route'), drawRoute())}
    ${moduleBox('wheel', 294, 320, 136, 107, collected.has('wheel'), drawWheel())}
    ${moduleBox('interface', 478, 320, 171, 112, collected.has('interface'), drawInterface())}
    <a class="machine-idea-socket" data-contact-socket="" href="https://rv-portfolio-five.vercel.app/idea/" aria-label="Your idea goes here — contact Rudra" transform="translate(766 213)" style="color:#a54e36">
      <rect x="0" y="0" width="182" height="145" rx="17" fill="var(--paper,#f6f5f2)" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 7"/>
      <circle cx="91" cy="59" r="24" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <path d="M80 59h22M91 48v22" ${line}/>
      <text x="91" y="111" text-anchor="middle" fill="currentColor" font-size="11" letter-spacing="2">YOUR IDEA</text>
      <text x="91" y="169" text-anchor="middle" fill="currentColor" font-size="9" letter-spacing=".7">THIS PART IS YOURS.</text>
    </a>
    ${compact ? '' : `<g ${line} stroke-width="1" opacity=".45"><path d="M805 181q-22-21-35-11m7-3-8 3 4 7"/><path d="M766 393q66 29 125-6"/></g><text x="799" y="158" fill="currentColor" font-family="Georgia,serif" font-style="italic" font-size="17" transform="rotate(5 799 158)">not quite finished…</text><text x="804" y="425" fill="currentColor" font-family="Georgia,serif" font-style="italic" font-size="16" transform="rotate(-4 804 425)">and that’s the point.</text>`}
  </svg>`;
}

/** Save an entirely self-contained SVG postcard, with no remote fonts or assets. */
export function downloadMachinePostcard(parts) {
  const ids = [...cleanParts(parts)];
  const drawing = renderMachine(ids, { compact: true });
  const postcard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" style="--paper:#f6f5f2;--ink:#171719;--machine-chassis:#f0efe9;color:#171719">
    <title>A little curiosity, with Rudra</title><desc>A personal machine assembled from the projects you explored in Rudra Vaghela’s portfolio.</desc>
    <rect width="1200" height="900" fill="#f6f5f2"/>
    <g stroke="#deddd7" stroke-width="1">${[80, 288, 496, 704, 912, 1120].map(x => `<path d="M${x} 0v900"/>`).join('')}</g>
    <text x="72" y="64" fill="#171719" font-family="monospace" font-size="13" letter-spacing="2">RUDRA VAGHELA / A SOUVENIR OF YOUR CURIOSITY</text>
    <text x="68" y="139" fill="#171719" font-family="Georgia,serif" font-size="55">Built from a little curiosity.</text>
    <svg x="50" y="186" width="1100" height="572" viewBox="0 0 1000 520" style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace">${drawing.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>
    <path d="M72 802h1056" fill="none" stroke="#171719" stroke-width="1.5"/>
    <text x="72" y="842" fill="#171719" font-family="Georgia,serif" font-style="italic" font-size="25">with Rudra.</text>
    <text x="1128" y="840" text-anchor="end" fill="#171719" font-family="monospace" font-size="13">rv-portfolio-five.vercel.app</text>
  </svg>`;
  const blob = new Blob([postcard], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'a-little-curiosity-with-rudra.svg';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
