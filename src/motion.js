// All scene positions are fractions of the same scroll track.
export const scene = Object.freeze({
  floodStart: 0.035,
  floodEnd: 0.39,
  introIn: 0.28,
  introAnchor: 0.48,
  introOut: 0.61,
  workIn: 0.69,
  workAnchor: 0.90,
});

export const wrap = (value, period) => period > 0 ? ((value % period) + period) % period : 0;
export const damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));

export function closestStop(value, stops, period) {
  if (!stops.length || period <= 0) return 0;
  const cycle = Math.floor(value / period);
  let closest = stops[0] + cycle * period;
  for (let turn = cycle - 1; turn <= cycle + 1; turn++) {
    for (const stop of stops) {
      const candidate = stop + turn * period;
      if (Math.abs(candidate - value) < Math.abs(closest - value)) closest = candidate;
    }
  }
  return closest;
}

export function nextStop(value, direction, stops, period) {
  if (!stops.length || period <= 0) return 0;
  const nearest = closestStop(value, stops, period);
  const cycle = Math.floor(nearest / period);
  const local = wrap(nearest, period);
  const index = stops.reduce((best, stop, i) => Math.abs(stop - local) < Math.abs(stops[best] - local) ? i : best, 0);
  const next = index + direction;
  if (next < 0) return stops.at(-1) + (cycle - 1) * period;
  if (next >= stops.length) return (cycle + 1) * period;
  return stops[next] + cycle * period;
}

// Subdividing a fast stroke must not multiply its total momentum.
export function pointerImpulse(dx, dy, steps, maximum = 0.09) {
  const length = Math.hypot(dx, dy);
  const scale = Math.min(1, maximum / Math.max(length, 0.00001)) / Math.max(1, steps);
  return [dx * scale, dy * scale];
}
