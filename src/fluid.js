/**
 * Stable Fluids WebGL Simulation (Dobryakov MIT lineage)
 * Features:
 * - Ping-pong half-float/float FBOs for velocity (~128) and dye (~1024)
 * - Incompressible Navier-Stokes: advection, vorticity confinement, divergence, Jacobi pressure (~20 iters), gradient subtract
 * - Logo sampled at physical canvas resolution from the existing 2048px source
 * - Advected displacement with a bounded, delta-time-normalized elastic return
 * - Display-only expansion into paper while scrolling
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
import displayFrag from './shaders/display.glsl?raw';
import logoUrl from '../logo-2048.png';
import { createDistanceTexture } from './distance.js';
import { pointerImpulse } from './motion.js';

export class FluidSimulation {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.isPaused = false;
    this.isVisible = true;
    this.isInViewport = true;
    this.events = new AbortController();
    this.destroyed = false;
    this.available = false;
    this.idleTime = Infinity;
    this.needsRender = true;
    this.time = 0;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Tuning Knobs: Viscous cohesive fluid with silky-smooth boundary (no bubbles, no murky blending)
    this.config = {
      SIM_RESOLUTION: isMobile ? 96 : 128,
      DYE_RESOLUTION: isMobile ? 512 : 768, // Displacement only; logo stays at physical resolution.
      PRESSURE_ITERATIONS: isMobile ? 8 : 12,
      CURL_STRENGTH: 5.0,
      VELOCITY_DISSIPATION: 0.95,
      SPLAT_RADIUS: 0.006,
      SPLAT_FORCE: 2100.0,
      RETURN_SPEED: 0.025,
      MAX_DPR: isMobile ? 1.5 : 2.0,
      ...options,
    };

    // State
    this.dpr = Math.min(window.devicePixelRatio || 1, this.config.MAX_DPR);
    this.frameTime = 1 / 60;
    this.slowFrames = 0;
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
      if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('Float render targets unavailable');
      gl.getExtension('OES_texture_float_linear');
    } else {
      this.extHalfFloat = gl.getExtension('OES_texture_half_float');
      const linear = gl.getExtension('OES_texture_half_float_linear');
      const renderable = gl.getExtension('EXT_color_buffer_half_float');
      const derivatives = gl.getExtension('OES_standard_derivatives');
      if (!this.extHalfFloat || !linear || !renderable || !derivatives) throw new Error('Required WebGL extensions unavailable');
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
    } else if (type === gl.FRAGMENT_SHADER) {
      // GLSL ES 1.00 has neither built-in tanh nor core derivatives.
      fullSource = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;\nfloat tanh(float x) { float e = exp(-2.0 * clamp(x, -10.0, 10.0)); return (1.0 - e) / (1.0 + e); }\n' + source;
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
    gl.deleteShader(vert);
    gl.deleteShader(frag);

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
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      throw new Error('Incomplete fluid render target');
    }
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
    this.disposeBuffers();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);

    const aspect = this.aspect = w / h;
    const dimensions = resolution => [
      Math.max(1, Math.round(resolution * Math.min(1, aspect))),
      Math.max(1, Math.round(resolution / Math.max(1, aspect))),
    ];
    const [simW, simH] = dimensions(this.config.SIM_RESOLUTION);
    const [dyeW, dyeH] = dimensions(this.config.DYE_RESOLUTION);

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
    this.needsRender = true;
    if (this.logoLoaded) {
      this.drawLogoInitial();
    }
  }

  loadLogo() {
    this.logoImage.crossOrigin = 'anonymous';
    this.logoImage.onload = () => {
      if (this.destroyed) return;
      this.logoLoaded = true;
      this.available = true;
      this.updateLogoTexture();
      this.drawLogoInitial();
      this.render();
      this.config.onReady?.();
    };
    this.logoImage.onerror = () => { this.available = false; this.pause(); this.config.onError?.(); };
    this.logoImage.src = logoUrl;
  }

  updateLogoTexture() {
    if (!this.logoLoaded) return;
    const gl = this.gl;

    // Use full physical canvas resolution (e.g. 2880x1800 on Retina) so edges are 100% vector sharp
    const targetW = this.canvas.width;
    const targetH = this.canvas.height;
    this.offscreenCanvas.width = targetW;
    this.offscreenCanvas.height = targetH;

    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Use CSS width for the breakpoint and cap size on short viewports.
    const logoRatio = (this.logoImage.naturalWidth || 1) / (this.logoImage.naturalHeight || 1);
    const drawWidth = Math.min(targetW * (this.canvas.clientWidth <= 600 ? 0.79 : 0.46), targetH * 0.66);
    const drawHeight = drawWidth / logoRatio;
    const drawX = (targetW - drawWidth) * 0.5;
    const drawY = (targetH - drawHeight) * 0.5 - targetH * 0.04;

    // Draw silhouette directly
    ctx.drawImage(this.logoImage, drawX, drawY, drawWidth, drawHeight);

    if (this.distanceTexture) gl.deleteTexture(this.distanceTexture);
    this.distanceTexture = createDistanceTexture(gl, this.offscreenCanvas, targetW, targetH);

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
    this.blit(this.dye.write, this.programs.clear, {
      uTexture: this.dye.read.attach(0), uDecay: 0,
    });
    this.dye.swap();
    this.blit(this.dye.write, this.programs.dyeAdvection, {
      uVelocity: this.velocity.read.attach(0),
      uDye: this.dye.read.attach(1),
      uLogoTexture: this.bindTexture(this.logoTexture, 2),
      uVelocityTexelSize: [this.velocity.read.texelSizeX, this.velocity.read.texelSizeY],
      uDyeTexelSize: [this.dye.read.texelSizeX, this.dye.read.texelSizeY],
      uDt: 0, uReturn: 1, uAspectRatio: this.aspect,
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
    const aspect = this.aspect;
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
        const aspect = this.aspect;
        const dist = Math.hypot(p.dx, p.dy * aspect);
        const steps = Math.max(1, Math.min(8, Math.ceil(dist / 0.012)));
        const startX = p.x - p.dx;
        const startY = p.y - p.dy;
        const [impulseX, impulseY] = pointerImpulse(p.dx, p.dy, steps);
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const ix = startX + p.dx * t;
          const iy = startY + p.dy * t;
          this.splat(ix, iy, impulseX, impulseY);
        }
        p.dx = 0;
        p.dy = 0;
        p.moved = false;
      }
    }

    // Stir gently during flood scroll to produce rich organic folds
    if (this.floodProgress > 0.05 && this.floodProgress < 0.95) {
      const angle = this.time * 1.4;
      const swirlRad = 0.15 + this.floodProgress * 0.2;
      const sx = 0.5 + Math.cos(angle) * swirlRad;
      const sy = 0.5 + Math.sin(angle) * swirlRad;
      const fdx = -Math.sin(angle) * 0.0012 * (1.0 - this.floodProgress) * dt * 60;
      const fdy = Math.cos(angle) * 0.0012 * (1.0 - this.floodProgress) * dt * 60;
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

    // 4. Pressure projection (8 mobile / 12 desktop iterations).
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

    // 7. Fluid Warp Displacement Advection + Return Easing
    const returnSpeed = this.config.RETURN_SPEED * (1.0 - this.floodProgress * 0.65);
    const returnFactor = 1.0 - Math.pow(1.0 - returnSpeed, dt * 60.0);

    this.blit(this.dye.write, this.programs.dyeAdvection, {
      uVelocity: this.velocity.read.attach(0),
      uDye: this.dye.read.attach(1),
      uLogoTexture: this.bindTexture(this.logoTexture, 2),
      uVelocityTexelSize: [this.velocity.read.texelSizeX, this.velocity.read.texelSizeY],
      uDyeTexelSize: [this.dye.read.texelSizeX, this.dye.read.texelSizeY],
      uDt: dt,
      uReturn: returnFactor,
      uAspectRatio: this.aspect,
    });
    this.dye.swap();

    // Flood is a display-only transition. Keep the displacement field intact
    // so scrolling back restores the same elastic monogram.
  }

  setTheme(dark) {
    this.darkTheme = dark;
    this.floodProgress = 0;
    this.idleTime = Infinity;
    this.needsRender = true;
    if (this.available) {
      this.drawLogoInitial();
      for (const field of [this.velocity, this.pressure]) {
        this.blit(field.write, this.programs.clear, {uTexture: field.read.attach(0), uDecay: 0});
        field.swap();
      }
      this.render();
    }
  }

  render() {
    if (!this.logoTexture) return;
    // Final display onto screen:
    // Samples pristine 2048px high-res monogram through the fluid warp field
    // Guarantees razor-sharp edges, solid non-blending colors, and zero smoke/fog
    this.blit(null, this.programs.display, {
      uDye: this.dye.read.attach(0),
      uLogoTexture: this.bindTexture(this.logoTexture, 1),
      uDistance: this.bindTexture(this.distanceTexture, 2),
      uRest: Math.min(1, Math.max(0, (this.idleTime - 1.5) / 2)),
      uFlood: this.floodProgress,
      uTime: this.time,
      uAspectRatio: this.aspect,
      uBackground: this.darkTheme ? [246/255,245/255,242/255] : [5/255,5/255,5/255],
      uPaper: this.darkTheme ? [5/255,5/255,5/255] : [246/255,245/255,242/255],
    });
  }

  updateFrame(_, frameMs = 1000 / 60) {
    if (this.isPaused || !this.isVisible || !this.isInViewport || !this.available || document.body.classList.contains('modal-open')) {
      return;
    }

    const elapsed = frameMs / 1000;
    const dt = Math.max(0.001, Math.min(elapsed, 1 / 30));
    const stirring = this.pointers.some(pointer => pointer.moved);
    const flooding = this.floodProgress > 0 && this.floodProgress < 1;
    this.idleTime = stirring || flooding ? 0 : this.idleTime + dt;
    // Freeze settled or fully covered artwork, without running any GPU passes.
    if (this.floodProgress >= 0.999 || this.idleTime > 4) {
      if (this.needsRender) this.render();
      this.needsRender = false;
      return;
    }
    // Adapt only after sustained frame pressure, between gestures.
    this.frameTime += (elapsed - this.frameTime) * 0.06;
    this.slowFrames = this.frameTime > 1 / 44 ? this.slowFrames + 1 : 0;
    if (this.slowFrames > 60 && !stirring && !flooding && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr * 0.75);
      this.resizeBuffers();
      this.slowFrames = 0;
    }
    this.time += dt;
    this.step(dt);
    this.render();
    this.needsRender = false;
  }

  start() {
    if (this.destroyed || document.hidden || !this.isInViewport || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.isPaused = false;
    this.needsRender = true;
  }

  pause() {
    this.isPaused = true;
    const p = this.pointers[0];
    p.initialized = p.moved = false;
    p.dx = p.dy = 0;
  }

  setFloodProgress(progress) {
    if (progress !== this.floodProgress) this.needsRender = true;
    this.floodProgress = Math.max(0.0, Math.min(1.0, progress));
  }

  bindEvents() {
    const canvas = this.canvas;
    const signal = this.events.signal;

    const handlePointerMove = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1 || this.isPaused) {
        this.pointers[0].initialized = false;
        this.pointers[0].dx = this.pointers[0].dy = 0;
        this.pointers[0].moved = false;
        return;
      }

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

    canvas.addEventListener('pointermove', e => handlePointerMove(e.clientX, e.clientY), { passive: true, signal });
    for (const type of ['pointerleave', 'pointercancel', 'pointerdown']) {
      canvas.addEventListener(type, () => { this.pointers[0].initialized = false; }, { passive: true, signal });
    }

    // Window resize
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.available && canvas.clientWidth && canvas.clientHeight) this.resizeBuffers();
      }, 100);
    }, { signal });

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.start();
      } else {
        this.pause();
      }
    }, { signal });

    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.available = false;
      this.pause();
      this.config.onError?.();
    }, { signal });

    // Pause when hero is out of viewport
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isInViewport = entry.isIntersecting;
        if (this.isInViewport) {
          this.start();
        } else {
          this.pause();
        }
      });
    }, { threshold: 0.05 });

    this.observer.observe(canvas);
  }

  disposeBuffers() {
    const gl = this.gl;
    for (const target of [this.velocity, this.dye, this.divergence, this.curl, this.pressure]) {
      if (!target) continue;
      for (const buffer of target.read ? [target.read, target.write] : [target]) {
        gl.deleteTexture(buffer.texture);
        gl.deleteFramebuffer(buffer.fbo);
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.pause();
    this.events.abort();
    clearTimeout(this.resizeTimer);
    this.observer?.disconnect();
    this.disposeBuffers();
    this.gl.deleteTexture(this.logoTexture);
    gl.deleteTexture(this.distanceTexture);
    this.gl.deleteBuffer(this.quadBuffer);
    Object.values(this.programs).forEach(({program}) => this.gl.deleteProgram(program));
  }
}
