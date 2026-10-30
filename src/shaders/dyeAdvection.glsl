// Dye advection for sticky, viscous fluid with bounded deformation (packed jar cohesion)
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform sampler2D uLogoTexture;
uniform vec2 uVelocityTexelSize;
uniform float uDt;
uniform float uDissipation;
uniform float uReturn;

void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 disp = uDt * vel * uVelocityTexelSize;

    // Sticky fluid / packed jar physics:
    // Softly saturate displacement so the ink cannot distort too much or fly away.
    // Max stretch is bounded to ~3.8% of screen width (~45px), acting like an elastic leash.
    float len = length(disp);
    float maxStretch = 0.038;
    if (len > 0.00001) {
        float saturatedLen = maxStretch * tanh(len / maxStretch);
        disp = disp * (saturatedLen / len);
    }

    vec2 coord = clamp(vUv - disp, 0.001, 0.999);
    vec4 dye = texture2D(uDye, coord) * uDissipation;
    vec4 targetLogo = texture2D(uLogoTexture, vUv);

    // Uniform cohesive elastic return: pulls the whole fluid body back smoothly without ripping the border
    gl_FragColor = mix(dye, targetLogo, clamp(uReturn, 0.0, 1.0));
}
