// Final display pass: renders thick cream ink floating on black liquid
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec3 uPaperColor; // Background: #050505
uniform vec3 uInkColor;   // Logo ink: #f5f0e6

void main() {
    float density = clamp(texture2D(uDye, vUv).r, 0.0, 1.0);

    // Thick drop of cream ink floating on water:
    // Solid & dense in the core (density > 0.65), while streaks and swirls
    // feather naturally without ever clipping or abruptly disappearing
    float ink = smoothstep(0.005, 0.70, density);

    vec3 color = mix(uPaperColor, uInkColor, ink);
    gl_FragColor = vec4(color, 1.0);
}
