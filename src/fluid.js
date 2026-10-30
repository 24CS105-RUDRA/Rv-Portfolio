/**
 * Stable Fluids WebGL Simulation (Dobryakov MIT lineage)
 * Features:
 * - Ping-pong half-float/float FBOs for velocity (~128) and dye (~1024)
 * - Incompressible Navier-Stokes: advection, vorticity confinement, divergence, Jacobi pressure (~20 iters), gradient subtract
 * - Logo target texture rendered white-on-transparent onto offscreen canvas (2048px source)
 * - Settle back easing via dye = mix(dye, logoTexture, uReturn) with delta-time normalization
 * - Scroll ink flood with turbulent outward emission
 * - Dynamic DPR capping & FPS auto-throttling (<45 fps)
 * - Tab visibility & viewport intersection pausing
 */

import baseVert from './shaders/base.glsl?raw';
import clearFrag from './shaders/clear.glsl?raw';
import splatFrag from './shaders/splat.glsl?raw';
import advectionFrag from './shaders/advection.glsl?raw';
import curlFrag from './shaders/curl.glsl?raw';
import vorticityFrag from './shaders/vorticity.glsl?raw';
import divergenceFrag from './shaders/divergence.glsl?raw';
import pressureFrag from './shaders/pressure.glsl?raw';
import gradientSubtractFrag from './shaders/gradientSubtract.glsl?raw';
import dyeAdvectionFrag from './shaders/dyeAdvection.glsl?raw';
import floodFrag from './shaders/flood.glsl?raw';
import displayFrag from './shaders/display.glsl?raw';
import logoUrl from '../logo-2048.png';

export class FluidSimulation {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.isPaused = false;
    this.isVisible = true;
    this.isInViewport = true;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Tuning Knobs: Viscous cohesive fluid with silky-smooth boundary (no bubbles, no murky blending)
    this.config = {
      SIM_RESOLUTION: 128,         // Low-res velocity grid
      DYE_RESOLUTION: isMobile ? 512 : 1024, // High-res dye grid
      PRESSURE_ITERATIONS: isMobile ? 12 : 20, // Jacobi solver iterations
      CURL_STRENGTH: 0.0,          // Laminar flow: eliminates micro-vortices and bubble shedding
      VELOCITY_DISSIPATION: 0.955, // Viscous damping (motion halts smoothly when cursor stops)
      DYE_DISSIPATION: 0.998,      // Dense cohesive dye retention (no smoky fading)
      SPLAT_RADIUS: 0.0035,        // Tight, controlled local push
      SPLAT_FORCE: 2500.0,         // Sticky fluid stirring strength (limited bounded distortion)
      RETURN_SPEED: 0.035,         // Firm snap-back to logo in ~1.1 seconds
      MAX_DPR: isMobile ? 1.5 : 2.0,
      ...options,
    };

    // State
    this.dpr = Math.min(window.devicePixelRatio || 1, this.config.MAX_DPR);
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.floodProgress = 0.0; // 0.0 (logo) to 1.0 (flood)
    this.logoLoaded = false;
    this.logoImage = new Image();

    // Pointer state
    this.pointers = [{
      id: -1,
      x: 0, y: 0,
      dx: 0, dy: 0,
      down: false,
      moved: false,
    }];

    // Offscreen 2048 canvas for logo target texture
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    this.initWebGL();
    this.initPrograms();
    this.initBuffers();
    this.loadLogo();
    this.bindEvents();
  }

  initWebGL() {
    // Attempt WebGL2 first, fallback to WebGL1
    let gl = this.canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    this.isWebGL2 = !!gl;

    if (!gl) {
      gl = this.canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
      }) || this.canvas.getContext('experimental-webgl');
    }

    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    // Extensions for floating/half-floating point textures & FBO attachments
    if (this.isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
    } else {
      this.extHalfFloat = gl.getExtension('OES_texture_half_float');
      gl.getExtension('OES_texture_half_float_linear');
      gl.getExtension('EXT_color_buffer_half_float');
    }

    // Determine renderable texture formats
    this.supportFormat = this.determineSupportedFormat(gl);
  }

  determineSupportedFormat(gl) {
    if (this.isWebGL2) {
      return {
        internalFormat: gl.RGBA16F,
        format: gl.RGBA,
        type: gl.HALF_FLOAT,
      };
    }
    const type = (this.extHalfFloat && this.extHalfFloat.HALF_FLOAT_OES) || gl.UNSIGNED_BYTE;
    return {
      internalFormat: gl.RGBA,
      format: gl.RGBA,
      type: type,
    };
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    let fullSource = source;

    if (this.isWebGL2) {
      if (type === gl.FRAGMENT_SHADER) {
        fullSource = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
#define texture2D texture
#define gl_FragColor fragColor
` + source
    .replace(/precision\s+highp\s+float;/, '')
    .replace(/precision\s+mediump\s+float;/, '')
    .replace(/varying\s+vec2\s+[a-zA-Z0-9_,\s]+;/g, '');
      } else {
        fullSource = `#version 300 es
in vec2 aPosition;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 uTexelSize;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(uTexelSize.x, 0.0);
    vR = vUv + vec2(uTexelSize.x, 0.0);
    vT = vUv + vec2(0.0, uTexelSize.y);
    vB = vUv - vec2(0.0, uTexelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
      }
    }

    gl.shaderSource(shader, fullSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error('Shader compile error:', info);
      throw new Error(info);
    }
    return shader;
  }

  createProgram(vertSource, fragSource) {
    const gl = this.gl;
    const program = gl.createProgram();
    const vert = this.createShader(gl, gl.VERTEX_SHADER, vertSource);
    const frag = this.createShader(gl, gl.FRAGMENT_SHADER, fragSource);

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      console.error('Program link error:', info);
      throw new Error(info);
    }

    // Extract uniforms
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = {
        loc: gl.getUniformLocation(program, info.name),
        type: info.type,
      };
    }

    return { program, uniforms };
  }

  initPrograms() {
    this.programs = {
      clear: this.createProgram(baseVert, clearFrag),
      splat: this.createProgram(baseVert, splatFrag),
      advection: this.createProgram(baseVert, advectionFrag),
      curl: this.createProgram(baseVert, curlFrag),
      vorticity: this.createProgram(baseVert, vorticityFrag),
      divergence: this.createProgram(baseVert, divergenceFrag),
      pressure: this.createProgram(baseVert, pressureFrag),
      gradientSubtract: this.createProgram(baseVert, gradientSubtractFrag),
      dyeAdvection: this.createProgram(baseVert, dyeAdvectionFrag),
      flood: this.createProgram(baseVert, floodFrag),
      display: this.createProgram(baseVert, displayFrag),
    };
  }

  initBuffers() {
    const gl = this.gl;
    // Fullscreen quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);
    this.quadBuffer = quadBuffer;

    this.resizeBuffers();
  }

  createFBO(w, h) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0,
      this.supportFormat.internalFormat,
      w, h, 0,
      this.supportFormat.format,
      this.supportFormat.type,
      null
    );

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      fbo,
      texture,
      width: w,
      height: h,
      texelSizeX: 1.0 / w,
      texelSizeY: 1.0 / h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  createDoubleFBO(w, h) {
    let fbo1 = this.createFBO(w, h);
    let fbo2 = this.createFBO(w, h);
    return {
      width: w,
      height: h,
      texelSizeX: 1.0 / w,
      texelSizeY: 1.0 / h,
      read: fbo1,
      write: fbo2,
      swap() {
        const tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      }
    };
  }

  resizeBuffers() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);

    const aspect = w / h;
    let simW = this.config.SIM_RESOLUTION;
    let simH = Math.round(simW / aspect);
    let dyeW = this.config.DYE_RESOLUTION;
    let dyeH = Math.round(dyeW / aspect);

    this.simWidth = simW;
    this.simHeight = simH;
    this.dyeWidth = dyeW;
    this.dyeHeight = dyeH;

    this.velocity = this.createDoubleFBO(simW, simH);
    this.dye = this.createDoubleFBO(dyeW, dyeH);
    this.divergence = this.createFBO(simW, simH);
    this.curl = this.createFBO(simW, simH);
    this.pressure = this.createDoubleFBO(simW, simH);

    this.updateLogoTexture();
    if (this.logoLoaded) {
      this.drawLogoInitial();
    }
  }

  loadLogo() {
    this.logoImage.crossOrigin = 'anonymous';
    this.logoImage.onload = () => {
      this.logoLoaded = true;
      this.updateLogoTexture();
      this.drawLogoInitial();
    };
    this.logoImage.src = logoUrl;
  }

  updateLogoTexture() {
    if (!this.logoLoaded) return;
    const gl = this.gl;

    const targetW = this.dyeWidth;
    const targetH = this.dyeHeight;
    this.offscreenCanvas.width = targetW;
    this.offscreenCanvas.height = targetH;

    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw logo centered at ~40% of screen width (55% on mobile)
    const logoRatio = (this.logoImage.naturalWidth || 1) / (this.logoImage.naturalHeight || 1);
    const drawWidth = targetW * (targetW < 600 ? 0.55 : 0.40);
    const drawHeight = drawWidth / logoRatio;
    const drawX = (targetW - drawWidth) * 0.5;
    const drawY = (targetH - drawHeight) * 0.5;

    // Draw silhouette directly
    ctx.drawImage(this.logoImage, drawX, drawY, drawWidth, drawHeight);

    // Upload to WebGL logo texture using standard RGBA/UNSIGNED_BYTE
    if (!this.logoTexture) {
      this.logoTexture = gl.createTexture();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.logoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D, 0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.offscreenCanvas
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  drawLogoInitial() {
    if (!this.logoTexture) return;
    // Copy target logo texture into initial dye buffer
    const gl = this.gl;
    this.blit(this.dye.write, this.programs.clear, {
      uTexture: this.bindTexture(this.logoTexture, 0),
      uDecay: 1.0,
    });
    this.dye.swap();
  }

  bindTexture(tex, unit) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  }

  blit(target, programObj, uniforms = {}) {
    const gl = this.gl;
    const { program, uniforms: locs } = programObj;

    gl.useProgram(program);

    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
      if (locs.uTexelSize) {
        gl.uniform2f(locs.uTexelSize.loc, target.texelSizeX, target.texelSizeY);
      }
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if (locs.uTexelSize) {
        gl.uniform2f(locs.uTexelSize.loc, 1.0 / this.canvas.width, 1.0 / this.canvas.height);
      }
    }

    // Pass custom uniforms with strict WebGL type checking
    for (const [key, val] of Object.entries(uniforms)) {
      const u = locs[key];
      if (!u || !u.loc) continue;

      if (u.type === gl.SAMPLER_2D || u.type === gl.INT) {
        gl.uniform1i(u.loc, val);
      } else if (u.type === gl.FLOAT) {
        gl.uniform1f(u.loc, val);
      } else if (u.type === gl.FLOAT_VEC2) {
        gl.uniform2f(u.loc, val[0], val[1]);
      } else if (u.type === gl.FLOAT_VEC3) {
        gl.uniform3f(u.loc, val[0], val[1], val[2]);
      } else if (u.type === gl.FLOAT_VEC4) {
        gl.uniform4f(u.loc, val[0], val[1], val[2], val[3]);
      } else if (typeof val === 'number') {
        gl.uniform1f(u.loc, val);
      }
    }

    // Set position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const aPos = gl.getAttribLocation(program, 'aPosition');
    if (aPos !== -1) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  splat(pointX, pointY, dx, dy) {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    const px = Math.max(0.01, Math.min(0.99, pointX));
    const py = Math.max(0.01, Math.min(0.99, pointY));
    // Add velocity impulse
    this.blit(this.velocity.write, this.programs.splat, {
      uTarget: this.velocity.read.attach(0),
      uAspectRatio: aspect,
      uPoint: [px, py],
      uColor: [dx * this.config.SPLAT_FORCE, dy * this.config.SPLAT_FORCE, 0.0],
      uRadius: this.config.SPLAT_RADIUS,
    });
    this.velocity.swap();
  }

  step(dt) {
    if (!this.logoTexture) return;

    // Apply pointer disturbances with continuous stroke interpolation
    for (const p of this.pointers) {
      if (p.moved) {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const dist = Math.hypot(p.dx, p.dy * aspect);
        const steps = Math.max(1, Math.min(8, Math.ceil(dist / 0.012)));
        const startX = p.x - p.dx;
        const startY = p.y - p.dy;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const ix = startX + p.dx * t;
          const iy = startY + p.dy * t;
          this.splat(ix, iy, p.dx, p.dy);
        }
        p.dx = 0;
        p.dy = 0;
        p.moved = false;
      }
    }

    // Stir gently during flood scroll to produce rich organic folds
    if (this.floodProgress > 0.05 && this.floodProgress < 0.95) {
      const angle = performance.now() * 0.003;
      const swirlRad = 0.15 + this.floodProgress * 0.2;
      const sx = 0.5 + Math.cos(angle) * swirlRad;
      const sy = 0.5 + Math.sin(angle) * swirlRad;
      const fdx = -Math.sin(angle) * 0.002 * (1.0 - this.floodProgress);
      const fdy = Math.cos(angle) * 0.002 * (1.0 - this.floodProgress);
      this.splat(sx, sy, fdx, fdy);
    }

    // 1. Curl
    this.blit(this.curl, this.programs.curl, {
      uVelocity: this.velocity.read.attach(0),
    });

    // 2. Vorticity Confinement
    this.blit(this.velocity.write, this.programs.vorticity, {
      uVelocity: this.velocity.read.attach(0),
      uCurl: this.curl.attach(1),
      uCurlStrength: this.config.CURL_STRENGTH,
      uDt: dt,
    });
    this.velocity.swap();

    // 3. Divergence
    this.blit(this.divergence, this.programs.divergence, {
      uVelocity: this.velocity.read.attach(0),
    });

    // 4. Pressure (Jacobi solver ~20 iterations)
    this.blit(this.pressure.write, this.programs.clear, {
      uTexture: this.pressure.read.attach(0),
      uDecay: 0.0,
    });
    this.pressure.swap();

    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      this.blit(this.pressure.write, this.programs.pressure, {
        uPressure: this.pressure.read.attach(0),
        uDivergence: this.divergence.attach(1),
      });
      this.pressure.swap();
    }

    // 5. Gradient Subtract (make velocity divergence-free)
    this.blit(this.velocity.write, this.programs.gradientSubtract, {
      uPressure: this.pressure.read.attach(0),
      uVelocity: this.velocity.read.attach(1),
    });
    this.velocity.swap();

    // 6. Velocity Advection with damping
    const velDissipation = Math.pow(this.config.VELOCITY_DISSIPATION, dt * 60.0);
    this.blit(this.velocity.write, this.programs.advection, {
      uVelocity: this.velocity.read.attach(0),
      uSource: this.velocity.read.attach(0),
      uDt: dt,
      uDissipation: velDissipation,
    });
    this.velocity.swap();

    // 7. Dye Advection + Logo Return Easing
    // uReturn is scaled by delta time: returns in ~2s when uReturn ~ 0.012
    const returnFactor = this.floodProgress > 0.01
      ? 0.0
      : (1.0 - Math.pow(1.0 - this.config.RETURN_SPEED, dt * 60.0));

    const dyeDissipation = Math.pow(this.config.DYE_DISSIPATION, dt * 60.0);

    this.blit(this.dye.write, this.programs.dyeAdvection, {
      uVelocity: this.velocity.read.attach(0),
      uDye: this.dye.read.attach(1),
      uLogoTexture: this.bindTexture(this.logoTexture, 2),
      uVelocityTexelSize: [this.velocity.read.texelSizeX, this.velocity.read.texelSizeY],
      uDt: dt,
      uDissipation: dyeDissipation,
      uReturn: returnFactor,
    });
    this.dye.swap();

    // 8. Scroll Flood Emission Pass
    if (this.floodProgress > 0.001) {
      this.blit(this.dye.write, this.programs.flood, {
        uDye: this.dye.read.attach(0),
        uLogoTexture: this.bindTexture(this.logoTexture, 1),
        uFlood: this.floodProgress,
        uDt: dt,
        uTime: performance.now() * 0.001,
      });
      this.dye.swap();
    }
  }

  render() {
    // Final display onto screen
    // Paper: #050505 (black background), Ink: #f5f0e6 (rich cream fluid logo)
    this.blit(null, this.programs.display, {
      uDye: this.dye.read.attach(0),
      uPaperColor: [5.0 / 255.0, 5.0 / 255.0, 5.0 / 255.0],
      uInkColor: [245.0 / 255.0, 240.0 / 255.0, 230.0 / 255.0],
    });
  }

  updateFrame() {
    if (this.isPaused || !this.isVisible || !this.isInViewport) {
      return;
    }

    const now = performance.now();
    let dt = (now - this.lastTime) * 0.001;
    this.lastTime = now;
    // Clamp delta time to avoid large jumps
    dt = Math.min(dt, 0.033);

    // Frame rate monitoring & auto DPR reduction (<45 fps)
    if (dt > 0) {
      const currentFps = 1.0 / dt;
      this.fpsHistory.push(currentFps);
      if (this.fpsHistory.length > 60) this.fpsHistory.shift();

      if (this.fpsHistory.length >= 30) {
        const avgFps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
        if (avgFps < 45 && this.dpr > 1.0) {
          this.dpr = 1.0;
          this.resizeBuffers();
          this.fpsHistory = [];
        }
      }
    }

    this.step(dt);
    this.render();

    this.rafId = requestAnimationFrame(() => this.updateFrame());
  }

  start() {
    this.isPaused = false;
    this.lastTime = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.updateFrame());
  }

  pause() {
    this.isPaused = true;
    cancelAnimationFrame(this.rafId);
  }

  setFloodProgress(progress) {
    this.floodProgress = Math.max(0.0, Math.min(1.0, progress));
  }

  bindEvents() {
    const canvas = this.canvas;

    const handlePointerMove = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height;

      const p = this.pointers[0];
      if (!p.initialized) {
        p.x = x;
        p.y = y;
        p.dx = 0;
        p.dy = 0;
        p.initialized = true;
        return;
      }
      p.dx += (x - p.x);
      p.dy += (y - p.y);
      p.x = x;
      p.y = y;
      p.moved = true;
    };

    window.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const p = this.pointers[0];
        p.x = (e.touches[0].clientX - rect.left) / rect.width;
        p.y = 1.0 - (e.touches[0].clientY - rect.top) / rect.height;
        p.dx = 0;
        p.dy = 0;
      }
    }, { passive: true });

    // Window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.dpr = Math.min(window.devicePixelRatio || 1, this.config.MAX_DPR);
        this.resizeBuffers();
      }, 100);
    });

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.start();
      } else {
        this.pause();
      }
    });

    // Pause when hero is out of viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isInViewport = entry.isIntersecting;
        if (this.isInViewport) {
          this.start();
        } else {
          this.pause();
        }
      });
    }, { threshold: 0.05 });

    const hero = document.getElementById('hero-wrapper');
    if (hero) observer.observe(hero);
  }
}
