// Velocity advection shader (Stable Fluids with viscous bounded transport)
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uDissipation;

void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 disp = uDt * vel * uTexelSize;
    float len = length(disp);
    float maxDisp = 0.05;
    if (len > 0.00001) {
        float satLen = maxDisp * tanh(len / maxDisp);
        disp = disp * (satLen / len);
    }
    vec2 coord = clamp(vUv - disp, 0.001, 0.999);
    gl_FragColor = uDissipation * texture2D(uSource, coord);
}
