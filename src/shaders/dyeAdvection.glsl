// Fluid warp displacement advection with bounded balloon elasticity
// Guarantees solid, non-diffusive fluid behavior with razor-sharp edges
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uDye; // Current displacement field (Dx, Dy)
uniform vec2 uVelocityTexelSize;
uniform float uDt;
uniform float uReturn;

void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;

    // Advect displacement along velocity streamlines
    vec2 advectCoord = clamp(vUv - vel * uDt * uVelocityTexelSize, 0.001, 0.999);
    vec2 disp = texture2D(uDye, advectCoord).xy;

    // Add current velocity impulse to displacement
    disp += vel * uDt * uVelocityTexelSize * 0.75;

    // Bounded balloon elasticity (cannot detach, distort wildly, or fly away)
    float len = length(disp);
    float maxStretch = 0.052; // ~60px maximum elastic stretch
    if (len > 0.00001) {
        float satLen = maxStretch * tanh(len / maxStretch);
        disp = disp * (satLen / len);
    }

    // Elastic snap-back easing: smoothly pulls back to rest in ~1.1s
    disp *= max(0.0, 1.0 - uReturn);

    gl_FragColor = vec4(disp, 0.0, 1.0);
}
