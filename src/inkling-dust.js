import gsap from 'gsap';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_GRAINS = 4000;
const MAX_NODES = 420;
const MAX_GLYPHS = 600;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const visibleColor = color => {
  if (!color || ['transparent', 'none'].includes(color)) return false;
  const slash = color.match(/\/\s*([\d.]+%?)\s*\)$/);
  if (slash) return parseFloat(slash[1]) > 0;
  if (/^rgba\(/i.test(color)) {
    const values = color.slice(color.indexOf('(') + 1, -1).split(',');
    if (values.length === 4) return parseFloat(values[3]) > 0;
  }
  return true;
};
const overlap = (a, b) => {
  const left = Math.max(a.left, b.left), top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right), bottom = Math.min(a.bottom, b.bottom);
  return {left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top)};
};

// These limits apply to the visible portion, not the potentially enormous DOM box.
export function dustSampleBounds(rect, width, height) {
  const area = overlap(rect, {left: 0, top: 0, right: width, bottom: height});
  const scale = Math.min(1, 1200 / Math.max(1, area.width), 800 / Math.max(1, area.height), Math.sqrt(900000 / Math.max(1, area.width * area.height)));
  return {...area, scale};
}

// This is a bounded vector/image/text approximation, not a DOM screenshot.
// The original layout stays in place while its visible colours become debris.
export function createInklingDust() {
  const canvas = document.createElement('canvas');
  canvas.className = 'inkling-dust'; canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const events = new AbortController();
  let grains = [], active = false, disposed = false, dpr = 1;
  function clear() {
    grains = []; gsap.ticker.remove(draw); active = false;
    ctx?.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }
  function resize() {
    clear(); dpr = Math.min(1.5, Math.max(1, devicePixelRatio || 1));
    canvas.width = Math.ceil(innerWidth * dpr); canvas.height = Math.ceil(innerHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function snapshot(element, images = true) {
    const original = element.getBoundingClientRect();
    let area = dustSampleBounds(original, innerWidth, innerHeight);
    // A card can be clipped horizontally by the endless gallery as well as by
    // the viewport. Avoid manufacturing dust in those invisible regions.
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) {
        const box = parent.getBoundingClientRect();
        const clip = {left: /hidden|clip|auto|scroll/.test(style.overflowX) ? box.left : area.left,
          right: /hidden|clip|auto|scroll/.test(style.overflowX) ? box.right : area.right,
          top: /hidden|clip|auto|scroll/.test(style.overflowY) ? box.top : area.top,
          bottom: /hidden|clip|auto|scroll/.test(style.overflowY) ? box.bottom : area.bottom};
        area = {...overlap(area, clip), scale: area.scale};
      }
    }
    const source = document.createElement('canvas');
    source.width = Math.max(1, Math.ceil(area.width * area.scale));
    source.height = Math.max(1, Math.ceil(area.height * area.scale));
    const paint = source.getContext('2d', {willReadFrequently: true});
    const fragments = [];
    if (!paint || !area.width || !area.height) return {source, area, original, fragments};
    const scale = area.scale;
    const baseTransform = () => paint.setTransform(scale, 0, 0, scale, -area.left * scale, -area.top * scale);
    baseTransform();
    let nodes = 0, glyphs = 0;
    function fragment(box, color, alpha) {
      if (fragments.length >= 700 || !visibleColor(color) || alpha < .04) return;
      const clipped = overlap(box, area);
      if (clipped.width > 0 && clipped.height > 0) fragments.push({...clipped, color, alpha});
    }
    function fillBox(box, style, alpha) {
      paint.globalAlpha = alpha;
      if (visibleColor(style.backgroundColor)) {
        paint.fillStyle = style.backgroundColor;
        const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, box.width / 2, box.height / 2);
        paint.beginPath();
        if (radius && paint.roundRect) paint.roundRect(box.left, box.top, box.width, box.height, radius);
        else paint.rect(box.left, box.top, box.width, box.height);
        paint.fill(); fragment(box, style.backgroundColor, alpha);
      }
      for (const [side, x1, y1, x2, y2] of [['Top', box.left, box.top, box.right, box.top], ['Right', box.right, box.top, box.right, box.bottom], ['Bottom', box.left, box.bottom, box.right, box.bottom], ['Left', box.left, box.top, box.left, box.bottom]]) {
        const width = parseFloat(style[`border${side}Width`]) || 0, color = style[`border${side}Color`];
        if (!width || style[`border${side}Style`] === 'none' || !visibleColor(color)) continue;
        paint.strokeStyle = color; paint.lineWidth = width; paint.beginPath(); paint.moveTo(x1, y1); paint.lineTo(x2, y2); paint.stroke();
        fragment({left: Math.min(x1, x2) - width / 2, top: Math.min(y1, y2) - width / 2, right: Math.max(x1, x2) + width / 2, bottom: Math.max(y1, y2) + width / 2}, color, alpha);
      }
    }
    function image(node, box, style, alpha) {
      const content = {left: box.left + (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.paddingLeft) || 0), top: box.top + (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.paddingTop) || 0)};
      content.width = Math.max(0, box.width - content.left + box.left - (parseFloat(style.borderRightWidth) || 0) - (parseFloat(style.paddingRight) || 0));
      content.height = Math.max(0, box.height - content.top + box.top - (parseFloat(style.borderBottomWidth) || 0) - (parseFloat(style.paddingBottom) || 0));
      if (!content.width || !content.height) return;
      const cover = node.closest('.project-cover');
      const fallback = cover ? getComputedStyle(cover).backgroundColor : style.color;
      fragment(box, visibleColor(fallback) ? fallback : '#bca58c', alpha);
      if (!images || !node.complete || !node.naturalWidth || !node.naturalHeight) return;
      const fit = style.objectFit || 'fill';
      const ratio = fit === 'cover' ? Math.max(content.width / node.naturalWidth, content.height / node.naturalHeight)
        : Math.min(content.width / node.naturalWidth, content.height / node.naturalHeight, fit === 'scale-down' ? 1 : Infinity);
      const width = fit === 'fill' ? content.width : fit === 'none' ? node.naturalWidth : node.naturalWidth * ratio;
      const height = fit === 'fill' ? content.height : fit === 'none' ? node.naturalHeight : node.naturalHeight * ratio;
      const positions = (style.objectPosition || '50% 50%').split(/\s+/);
      const offset = (value, room) => value?.endsWith('%') ? room * parseFloat(value) / 100 : parseFloat(value) || 0;
      paint.save(); paint.beginPath(); paint.rect(content.left, content.top, content.width, content.height); paint.clip(); paint.globalAlpha = alpha;
      try {paint.drawImage(node, content.left + offset(positions[0], content.width - width), content.top + offset(positions[1] || positions[0], content.height - height), width, height);} catch {}
      paint.restore();
    }
    function text(node, style, alpha) {
      if (!node.textContent?.trim() || glyphs >= MAX_GLYPHS) return;
      paint.globalAlpha = alpha; paint.fillStyle = style.color; paint.textBaseline = 'bottom';
      paint.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${style.fontSize || '16px'} ${style.fontFamily || 'sans-serif'}`;
      paint.fontStretch = parseFloat(style.fontStretch) < 80 ? 'ultra-condensed' : 'normal';
      const range = document.createRange();
      let offset = 0;
      for (const char of node.textContent) {
        if (glyphs++ >= MAX_GLYPHS) break;
        const start = offset; offset += char.length;
        if (!char.trim()) continue;
        range.setStart(node, start); range.setEnd(node, offset);
        const box = range.getBoundingClientRect();
        if (!box.width || !box.height || !overlap(box, area).width || !overlap(box, area).height) continue;
        paint.fillText(style.textTransform === 'uppercase' ? char.toUpperCase() : char, box.left, box.bottom, box.width);
        fragment(box, style.color, alpha);
      }
    }
    function vector(node, style, alpha) {
      if (node.closest('defs,clipPath,mask,pattern,marker,symbol') || !node.getScreenCTM) return;
      const matrix = node.getScreenCTM(); if (!matrix) return;
      const number = key => parseFloat(node.getAttribute(key)) || 0;
      const inVectorSpace = draw => {
        paint.save();
        try {
          paint.setTransform(scale * matrix.a, scale * matrix.b, scale * matrix.c, scale * matrix.d, (matrix.e - area.left) * scale, (matrix.f - area.top) * scale);
          paint.globalAlpha = alpha; draw();
        } finally {paint.restore();}
      };
      let path;
      try {
        path = new Path2D();
        switch (node.localName) {
          case 'path': path = new Path2D(node.getAttribute('d') || ''); break;
          case 'rect': {
            const x = number('x'), y = number('y'), width = number('width'), height = number('height'), radius = Math.min(number('rx'), width / 2, height / 2);
            if (path.roundRect && radius) path.roundRect(x, y, width, height, radius); else path.rect(x, y, width, height); break;
          }
          case 'circle': path.arc(number('cx'), number('cy'), Math.max(0, number('r')), 0, Math.PI * 2); break;
          case 'ellipse': path.ellipse(number('cx'), number('cy'), Math.max(0, number('rx')), Math.max(0, number('ry')), 0, 0, Math.PI * 2); break;
          case 'line': path.moveTo(number('x1'), number('y1')); path.lineTo(number('x2'), number('y2')); break;
          case 'polyline': case 'polygon': {
            const points = (node.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
            if (points.length < 4) return; path.moveTo(points[0], points[1]);
            for (let i = 2; i + 1 < points.length; i += 2) path.lineTo(points[i], points[i + 1]);
            if (node.localName === 'polygon') path.closePath(); break;
          }
          case 'text': {
            if (glyphs >= MAX_GLYPHS || !node.textContent?.trim()) return;
            const point = node.getStartPositionOfChar?.(0), box = node.getBBox?.();
            if (!point || !box) return;
            inVectorSpace(() => {
              paint.fillStyle = visibleColor(style.fill) ? style.fill : style.color;
              paint.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${style.fontSize || '16px'} ${style.fontFamily || 'sans-serif'}`;
              paint.textBaseline = 'alphabetic'; paint.textAlign = 'left';
              paint.fillText(node.textContent.slice(0, MAX_GLYPHS - glyphs), point.x, point.y, box.width);
            });
            glyphs += node.textContent.length;
            fragment(node.getBoundingClientRect(), style.fill || style.color, alpha); return;
          }
          default: return;
        }
        inVectorSpace(() => {
          if (visibleColor(style.fill)) {paint.fillStyle = style.fill.startsWith('url(') ? style.color : style.fill; paint.fill(path, style.fillRule === 'evenodd' ? 'evenodd' : 'nonzero');}
          if (visibleColor(style.stroke) && parseFloat(style.strokeWidth)) {paint.strokeStyle = style.stroke.startsWith('url(') ? style.color : style.stroke; paint.lineWidth = parseFloat(style.strokeWidth); paint.stroke(path);}
        });
        fragment(node.getBoundingClientRect(), visibleColor(style.fill) ? style.fill : style.stroke, alpha);
      } catch { /* Unsupported SVG geometry still leaves backgrounds and text. */ }
    }
    function visit(node, parentAlpha = 1, depth = 0) {
      if (++nodes > MAX_NODES || depth > 32 || !node.getBoundingClientRect) return;
      const style = getComputedStyle(node), raw = node.getBoundingClientRect();
      const padding = node.namespaceURI === SVG_NS ? Math.max(1, parseFloat(style.strokeWidth) || 0) / 2 : 0;
      const box = {left: raw.left - padding, top: raw.top - padding, right: raw.right + padding, bottom: raw.bottom + padding, width: raw.width + padding * 2, height: raw.height + padding * 2};
      if (style.display === 'none' || style.visibility === 'hidden' || node.hidden || !box.width || !box.height) return;
      const proxy = node.localName === 'img' && node.closest('.project-cover.art-ready') && node.parentElement.querySelector('.project-illustration');
      const alpha = parentAlpha * (proxy ? 1 : Number.isFinite(parseFloat(style.opacity)) ? parseFloat(style.opacity) : 1);
      if (alpha < .04) return;
      // The inline animated cover and the static source depict the same artwork.
      // Drawing the local image proxy avoids serialising/decoding an SVG at impact.
      const proxyImage = node.classList?.contains('project-illustration') ? node.parentElement.querySelector('img') : null;
      if (images && proxyImage?.complete && proxyImage.naturalWidth) return;
      if (!overlap(box, area).width || !overlap(box, area).height) return;
      paint.save();
      if (node.namespaceURI !== SVG_NS) fillBox(box, style, alpha);
      if (node.localName === 'img') image(node, box, style, alpha);
      else {
        if (node.namespaceURI === SVG_NS) vector(node, style, alpha);
        if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) {paint.beginPath(); paint.rect(box.left, box.top, box.width, box.height); paint.clip();}
        if (node.localName !== 'text' || node.namespaceURI !== SVG_NS) for (const child of node.childNodes) {
          if (child.nodeType === 1) visit(child, alpha, depth + 1);
          else if (child.nodeType === 3 && node.namespaceURI !== SVG_NS) text(child, style, alpha);
        }
      }
      paint.restore();
    }
    let outerAlpha = 1;
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const opacity = parseFloat(getComputedStyle(parent).opacity); outerAlpha *= Number.isFinite(opacity) ? opacity : 1;
    }
    visit(element, outerAlpha);
    return {source, area, original, fragments};
  }
  function burst(element, options = {}) {
    if (!ctx || disposed || !element?.isConnected || document.hidden) return {particles: 0};
    let sampled = snapshot(element), pixels;
    if (!sampled.area.width || !sampled.area.height) return {particles: 0};
    try {pixels = sampled.source.getContext('2d').getImageData(0, 0, sampled.source.width, sampled.source.height).data;} catch {
      // A protected image must not prevent every other part of a block from
      // dissolving. Repaint its own backgrounds, vectors and text without images.
      sampled = snapshot(element, false);
      try {pixels = sampled.source.getContext('2d').getImageData(0, 0, sampled.source.width, sampled.source.height).data;} catch {}
    }
    const {source, area, original, fragments} = sampled;
    const step = Math.max(2, Math.ceil(Math.sqrt(source.width * source.height / 2200)));
    const now = performance.now() / 1000, before = grains.length;
    const baseDelay = Number.isFinite(options.delay) ? clamp(options.delay, 0, 2) : 0;
    const origin = {x: Number.isFinite(options.x) ? options.x : area.left + area.width / 2, y: Number.isFinite(options.y) ? options.y : area.top + area.height * .7};
    function grain(x, y, color, opacity = 1) {
      const angle = Math.atan2(y - origin.y, x - origin.x), coarse = Math.random() < .12;
      grains.push({x, y, scroll: scrollY, delay: baseDelay + clamp((x - original.left) / Math.max(1, original.width), 0, 1) * 1.15,
        start: now, life: coarse ? .85 + Math.random() * .65 : 1.3 + Math.random() * .9,
        vx: 65 + Math.random() * 165, vy: -35 - Math.random() * 115,
        kickX: Math.cos(angle) * (12 + Math.random() * 28), kickY: Math.sin(angle) * (12 + Math.random() * 28),
        width: coarse ? clamp(step / area.scale * .85, 5, 18) : 1.3 + Math.random() * clamp(step / area.scale * .28, 2, 5),
        phase: Math.random() * 6.28, angle: Math.random() * 3, spin: (Math.random() - .5) * 3,
        opacity, coarse, color});
    }
    if (pixels) {
      for (let y = 0; y < source.height; y += step) for (let x = 0; x < source.width; x += step) {
        const i = (y * source.width + x) * 4;
        if (pixels[i + 3] < 30) continue;
        grain(area.left + x / area.scale, area.top + y / area.scale, `rgb(${pixels[i]} ${pixels[i + 1]} ${pixels[i + 2]})`, pixels[i + 3] / 255);
      }
    }
    if (grains.length === before) {
      // A final geometric fallback still reflects painted regions only; empty
      // transparent layout boxes never turn into an invented solid rectangle.
      const budget = Math.max(1, Math.floor(1800 / Math.max(1, fragments.length)));
      for (const part of fragments) for (let i = 0; i < budget; i++) grain(part.left + Math.random() * part.width, part.top + Math.random() * part.height, part.color, part.alpha);
    }
    const produced = grains.length - before;
    grains = grains.slice(-MAX_GRAINS);
    if (grains.length && !active) {active = true; gsap.ticker.add(draw);}
    return {particles: produced, rect: area};
  }
  function draw() {
    if (!ctx || document.hidden || disposed) {clear(); return;}
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const now = performance.now() / 1000;
    grains = grains.filter(p => now - p.start - p.delay < p.life);
    for (const p of grains) {
      const age = now - p.start - p.delay; if (age < 0) continue;
      const t = age / p.life, kick = 1 - Math.exp(-age * 9);
      const x = p.x + p.kickX * kick + p.vx * age * age * .5 + Math.sin(age * 6 + p.phase) * age * 12;
      const y = p.y - (scrollY - p.scroll) + p.kickY * kick + p.vy * age + age * age * 12;
      ctx.globalAlpha = Math.min(1, age * 20) * (1 - t) ** 1.3 * p.opacity; ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.angle + p.spin * age);
      const size = p.width * (1 - t * .55);
      ctx.fillRect(-size / 2, -size / 2, size, p.coarse ? size * .65 : size); ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (!grains.length) clear();
  }
  document.addEventListener('visibilitychange', () => {if (document.hidden) clear();}, {signal: events.signal});
  return {burst, resize, clear, destroy() {disposed = true; events.abort(); clear(); canvas.remove();}};
}
