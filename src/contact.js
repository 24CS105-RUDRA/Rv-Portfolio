import {contactConfig} from './contact-config';
import {soundCue} from './sound';

export function initContact(config = contactConfig) {
  const events = new AbortController(), {signal} = events;
  const section = document.querySelector('#contact');
  const form = section.querySelector('#idea-form'), desk = section.querySelector('.idea-desk');
  const submit = form.querySelector('#idea-submit'), label = submit.querySelector('span');
  const status = form.querySelector('#idea-form-status'), receipt = desk.querySelector('.idea-receipt');
  const name = form.elements.namedItem('name'), email = form.elements.namedItem('email');
  const message = form.elements.namedItem('message'), interest = form.elements.namedItem('interest');
  const fields = [...form.querySelectorAll('input,textarea')];
  const publicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) ? config.email : '';
  const phone = /^\+[1-9]\d{6,14}$/.test(config.phone.replace(/[\s()-]/g, '')) ? config.phone.replace(/[\s()-]/g, '') : '';
  let endpoint;
  try { const url = new URL(config.endpoint); if (url.protocol === 'https:' && url.hostname === 'formsubmit.co' && /^\/ajax\/[^/]+$/.test(url.pathname) && !url.search && !url.hash) endpoint = url.href; } catch {}
  let sending = false, disposed = false, request, timeout;
  const configureLink = (selector, value, href) => {
    const link = section.querySelector(selector); link.hidden = !value;
    if (value) { link.textContent = value; link.href = href; } else link.removeAttribute('href');
  };
  configureLink('[data-contact-email]', publicEmail, `mailto:${publicEmail}`);
  configureLink('[data-contact-phone]', phone ? config.phoneDisplay || config.phone : '', `tel:${phone}`);
  const setup = section.querySelector('.idea-form-setup');
  setup.hidden = !!endpoint;
  const deliveryNote = form.querySelector('.idea-form-note');
  deliveryNote.hidden = !endpoint;
  deliveryNote.textContent = 'Your name, email and idea are sent through FormSubmit so Rudra can reply. No mailing list.';
  submit.disabled = !endpoint;
  function writing(focused) {
    if (disposed) return;
    document.body.classList.toggle('contact-writing', focused);
    window.dispatchEvent(new CustomEvent('portfolio:contact-focus', {detail: {focused}}));
  }
  desk.addEventListener('focusin', () => writing(true), {signal});
  desk.addEventListener('focusout', () => queueMicrotask(() => writing(desk.contains(document.activeElement))), {signal});
  form.addEventListener('input', e => {
    if (e.target.matches('input,textarea')) e.target.removeAttribute('aria-invalid');
    if (!sending) { status.textContent = ''; delete status.dataset.state; }
  }, {signal});
  form.addEventListener('invalid', e => e.target.setAttribute('aria-invalid', 'true'), {signal, capture: true});
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!endpoint || sending || disposed) return;
    // A filled honeypot never triggers a delivery animation or a false receipt.
    if (form.elements.namedItem('_honey').value) return;
    name.value = name.value.trim(); email.value = email.value.trim(); message.value = message.value.trim();
    if (!form.reportValidity()) return;
    if (message.value.length < 15) {
      message.setAttribute('aria-invalid', 'true');
      status.textContent = 'Give me a little more to work with—at least 15 characters.';
      status.dataset.state = 'error';
      message.focus(); return;
    }
    const payload = {name: name.value, email: email.value, message: message.value, interest: interest.value,
      _subject: `A portfolio idea · ${interest.value}`, _template: 'table', _honey: '',
      _url: 'https://rv-portfolio-five.vercel.app/#contact'};
    sending = true; submit.disabled = true; label.textContent = 'Sending your idea…';
    fields.forEach(field => {field.disabled = true;});
    form.setAttribute('aria-busy', 'true'); status.textContent = 'Sending. Keep this page open for a moment.';
    status.dataset.state = 'sending';
    request = new AbortController(); timeout = setTimeout(() => request.abort(), 20000);
    try {
      const response = await fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(payload), signal: request.signal});
      const data = await response.json();
      if (!response.ok || !(data.success === true || data.success === 'true')) throw new Error('Submission was not accepted.');
      if (disposed) return;
      form.reset(); form.hidden = true; receipt.hidden = false; desk.classList.add('is-delivered');
      receipt.querySelector('h4').focus({preventScroll: true}); soundCue('print');
    } catch {
      if (!disposed) {
        status.textContent = 'Your idea couldn’t be sent. Your note is still here—please try again, or use the email link.';
        status.dataset.state = 'error';
      }
    } finally {
      clearTimeout(timeout); sending = false;
      if (!disposed) { fields.forEach(field => {field.disabled = false;}); submit.disabled = !endpoint; label.textContent = 'Send my idea'; form.removeAttribute('aria-busy'); }
    }
  }, {signal});
  receipt.querySelector('[data-idea-reset]').addEventListener('click', () => {
    receipt.hidden = true; form.hidden = false; desk.classList.remove('is-delivered'); status.textContent = ''; name.focus();
  }, {signal});
  return () => {
    disposed = true; events.abort(); clearTimeout(timeout); request?.abort();
    fields.forEach(field => {field.disabled = false;}); form.removeAttribute('aria-busy');
    submit.disabled = !endpoint; label.textContent = 'Send my idea';
    form.hidden = false; receipt.hidden = true; desk.classList.remove('is-delivered');
    status.textContent = ''; delete status.dataset.state;
    document.body.classList.remove('contact-writing');
    window.dispatchEvent(new CustomEvent('portfolio:contact-focus', {detail: {focused: false}}));
  };
}
