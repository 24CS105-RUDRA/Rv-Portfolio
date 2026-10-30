// Splat shader: adds impulse to velocity map at cursor spot
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspectRatio;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;

void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspectRatio;
    float d = dot(p, p);
    vec3 splat = exp(-d / max(uRadius, 0.00001)) * uColor;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
}
