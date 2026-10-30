// Curl (2D vorticity) calculation
precision highp float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float B = texture2D(uVelocity, vB).x;
    float T = texture2D(uVelocity, vT).x;
    float curl = 0.5 * ((R - L) - (T - B));
    gl_FragColor = vec4(curl, 0.0, 0.0, 1.0);
}
