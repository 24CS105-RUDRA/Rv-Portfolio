// Scroll flood: churns the immiscible cream fluid into the black fluid
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uLogoTexture;
uniform float uFlood;       // 0.0 to 1.0 scrub progress
uniform float uDt;
uniform float uTime;
uniform vec2 uTexelSize;

// Fast pseudo-noise for organic fluid wash edges
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec4 currentDye = texture2D(uDye, vUv);
    if (uFlood <= 0.0001) {
        gl_FragColor = currentDye;
        return;
    }

    // Dissolve cream fluid into deep black background during 20-70% scroll
    float fadeOut = 1.0 - smoothstep(0.15, 0.90, uFlood);
    float targetDye = currentDye.r * fadeOut;

    if (uFlood >= 0.95) {
        targetDye = 0.0;
    }

    float newDye = mix(currentDye.r, targetDye, clamp(uDt * (4.0 + uFlood * 8.0), 0.0, 1.0));
    gl_FragColor = vec4(vec3(newDye), 1.0);
}
