/**
 * Custom Cursor Module:
 * Small central dot enclosed by an outer circle circumference
 * Smooth trailing lerp physics and interactive hover states
 */

export function initCustomCursor() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let isHovered = false;
  let isClicked = false;
  let isVisible = false;

  const LERP_FACTOR = 0.18;

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible) {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      ringX = mouseX;
      ringY = mouseY;
    }
  }

  function onMouseDown() {
    isClicked = true;
  }

  function onMouseUp() {
    isClicked = false;
  }

  function onMouseLeave() {
    isVisible = false;
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  }

  function onMouseEnter() {
    isVisible = true;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);

  // Hover target scale detection
  const interactiveSelector = 'button, a, .btn-scroll-top, [role="button"]';
  document.querySelectorAll(interactiveSelector).forEach((el) => {
    el.addEventListener('mouseenter', () => { isHovered = true; });
    el.addEventListener('mouseleave', () => { isHovered = false; });
  });

  function render() {
    // Dot moves immediately to mouse
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

    // Outer circle ring follows with fluid damping
    ringX += (mouseX - ringX) * LERP_FACTOR;
    ringY += (mouseY - ringY) * LERP_FACTOR;

    const scale = isClicked ? 0.8 : (isHovered ? 1.35 : 1.0);
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
