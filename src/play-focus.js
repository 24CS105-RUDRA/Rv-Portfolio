// Keep the roaming pet out of the way of an editable idea in the playground.
export function initPlayFocus() {
  const events = new AbortController(), {signal} = events;
  let disposed = false, writing = false;
  const update = () => {
    if (disposed) return;
    const field = document.activeElement;
    const next = !!field?.closest('[data-pet-safe]') && field.matches('textarea, input:not([type]), input[type=text], input[type=email], [contenteditable=true]');
    if (next === writing) return;
    writing = next; document.body.classList.toggle('contact-writing', writing);
    window.dispatchEvent(new CustomEvent('portfolio:contact-focus', {detail: {focused: writing}}));
  };
  document.addEventListener('focusin', update, {signal});
  document.addEventListener('focusout', () => queueMicrotask(update), {signal});
  return () => {
    disposed = true; events.abort(); document.body.classList.remove('contact-writing');
    window.dispatchEvent(new CustomEvent('portfolio:contact-focus', {detail: {focused: false}}));
  };
}
