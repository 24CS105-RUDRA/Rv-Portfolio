// Final display pass: silky-smooth boundary between dense cream logo and deep black background
// Uses 9-tap surface-tension filtering and screen-space derivative antialiasing (no murky blending, no bubbles)
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec2 uTexelSize;
uniform vec3 uPaperColor; // Background: #050505
uniform vec3 uInkColor;   // Logo ink: #f5f0e6

void main() {
    // 9-tap isotropic surface tension sampling: guarantees smooth, organic fluid contour
    float c = texture2D(uDye, vUv).r;
    vec2 dx = vec2(uTexelSize.x * 1.5, 0.0);
    vec2 dy = vec2(0.0, uTexelSize.y * 1.5);

    float ortho = texture2D(uDye, vUv - dx).r +
                  texture2D(uDye, vUv + dx).r +
                  texture2D(uDye, vUv - dy).r +
                  texture2D(uDye, vUv + dy).r;

    float diag = texture2D(uDye, vUv - dx - dy).r +
                 texture2D(uDye, vUv + dx - dy).r +
                 texture2D(uDye, vUv - dx + dy).r +
                 texture2D(uDye, vUv + dx + dy).r;

    float density = clamp((c * 4.0 + ortho * 2.0 + diag) / 16.0, 0.0, 1.0);

    // Screen-space antialiased step:
    // Exactly 1 to 1.5 screen pixels of pristine subpixel antialiasing.
    // Eliminates grey murky wash and prevents bubble fringes.
    float fw = max(fwidth(density), 0.003);
    float ink = smoothstep(0.5 - fw * 0.75, 0.5 + fw * 0.75, density);

    vec3 color = mix(uPaperColor, uInkColor, ink);
    gl_FragColor = vec4(color, 1.0);
}
