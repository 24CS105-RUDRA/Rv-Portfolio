// Final display pass: renders pristine, razor-sharp cream logo with fluid warp deformation
// Zero blur, zero fog/smoke, solid non-blending boundaries like a fluid balloon
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;         // Fluid warp displacement field (Dx, Dy)
uniform sampler2D uLogoTexture; // Pristine 2048x2048 high-res monogram target
uniform float uFlood;          // Scroll flood progress
uniform vec3 uPaperColor;      // Deep black: #050505
uniform vec3 uInkColor;        // Dense cream: #F5F0E6

void main() {
    vec2 disp = texture2D(uDye, vUv).xy;
    vec2 coord = clamp(vUv - disp, 0.001, 0.999);

    // Sample the pristine high-resolution logo geometry
    float density = texture2D(uLogoTexture, coord).r;

    // Crisp, clean subpixel antialiasing at the boundary (exactly 1.5 screen pixels)
    // No wide grey wash, no murky blending, no bubbles, no blur
    float fw = max(fwidth(density), 0.002);
    float ink = smoothstep(0.5 - fw * 0.75, 0.5 + fw * 0.75, density);

    // Scroll flood: fade cream logo into solid deep black background
    if (uFlood > 0.001) {
        float fade = 1.0 - smoothstep(0.15, 0.85, uFlood);
        ink *= fade;
    }

    vec3 color = mix(uPaperColor, uInkColor, ink);
    gl_FragColor = vec4(color, 1.0);
}
