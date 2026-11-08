precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform sampler2D uLogoTexture;
uniform vec2 uVelocityTexelSize;
uniform vec2 uDyeTexelSize;
uniform float uDt;
uniform float uReturn;
uniform float uAspectRatio;

void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 previous = clamp(vUv - velocity * uDt * uVelocityTexelSize, 0.001, 0.999);
    vec2 displacement = texture2D(uDye, previous).xy;
    displacement += velocity * uDt * uVelocityTexelSize * 0.82;

    // Preserve small movements instead of compressing them on every frame.
    // Only extreme strokes reach the elastic safety limit.
    float distance = length(displacement * vec2(uAspectRatio, 1.0));
    if (distance > 0.15) displacement *= 0.15 / distance;
    displacement *= 1.0 - uReturn;
    float pigment = texture2D(uDye, previous).z;
    vec2 px = uDyeTexelSize;
    float neighborhood = .25 * (
        texture2D(uDye, previous + vec2(px.x, 0.)).z +
        texture2D(uDye, previous - vec2(px.x, 0.)).z +
        texture2D(uDye, previous + vec2(0., px.y)).z +
        texture2D(uDye, previous - vec2(0., px.y)).z);
    // Gentle viscosity joins small fragments without blurring the final silhouette.
    pigment = mix(pigment, neighborhood, 1. - exp(-uDt * 9.));
    float original = texture2D(uLogoTexture, vUv).a;
    pigment = mix(pigment, original, uReturn);
    gl_FragColor = vec4(displacement, pigment, 1.0);
}
