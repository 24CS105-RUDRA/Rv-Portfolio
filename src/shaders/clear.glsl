// Clear / decay shader
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uDecay;

void main() {
    gl_FragColor = uDecay * texture2D(uTexture, vUv);
}
