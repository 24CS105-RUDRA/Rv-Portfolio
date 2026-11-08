// Distance to the silhouette in viewport-height units. Two chamfer sweeps
// keep generation bounded while the GPU interpolates the resulting field.
export function createDistanceTexture(gl, image, width, height) {
  const h = 384, w = Math.max(64, Math.round(h * width / height));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h).data;
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < inside.length; i++) inside[i] = pixels[i * 4 + 3] > 127;
  function distances(target) {
    const d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i++) d[i] = inside[i] === target ? 0 : w + h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y) {
        d[i] = Math.min(d[i], d[i - w] + 1);
        if (x) d[i] = Math.min(d[i], d[i - w - 1] + Math.SQRT2);
        if (x + 1 < w) d[i] = Math.min(d[i], d[i - w + 1] + Math.SQRT2);
      }
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x + 1 < w) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y + 1 < h) {
        d[i] = Math.min(d[i], d[i + w] + 1);
        if (x) d[i] = Math.min(d[i], d[i + w - 1] + Math.SQRT2);
        if (x + 1 < w) d[i] = Math.min(d[i], d[i + w + 1] + Math.SQRT2);
      }
    }
    return d;
  }
  const outer = distances(1), inner = distances(0);
  const data = new Uint8Array(w * h * 4);
  // Pack into two channels rather than quantizing a long distance into 8 bits.
  for (let i = 0; i < inside.length; i++) {
    const signed = (inside[i] ? -inner[i] : outer[i]) / h;
    const value = Math.round(Math.max(0, Math.min(1, signed / 4 + .5)) * 65535);
    data[i * 4] = value >> 8; data[i * 4 + 1] = value & 255; data[i * 4 + 3] = 255;
  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Typed-array upload needs an explicit row reversal.
  const flipped = new Uint8Array(data.length);
  for (let y = 0; y < h; y++) flipped.set(data.subarray(y*w*4,(y+1)*w*4),(h-1-y)*w*4);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,flipped);
  return texture;
}
