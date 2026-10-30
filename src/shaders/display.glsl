// Final display pass: renders razor-sharp, dense cream logo over deep black background
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec3 uPaperColor; // Background: #050505
uniform vec3 uInkColor;   // Logo ink: #f5f0e6

void main() {
    float density = clamp(texture2D(uDye, vUv).r, 0.0, 1.0);

    // Sharp, pristine antialiased boundary:
    // Core is 100% dense solid cream, straight edges and corners are razor sharp
    float ink = smoothstep(0.42, 0.58, density);

    vec3 color = mix(uPaperColor, uInkColor, ink);
    gl_FragColor = vec4(color, 1.0);
}
