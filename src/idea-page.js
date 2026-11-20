import {initSound} from './sound';
import {initContact} from './contact';
import {initInklingPlay} from './inkling-play';
import {readIdeaBrief} from './idea-bridge';
import gsap from 'gsap';

document.documentElement.classList.replace('no-js', 'js');
try { document.documentElement.classList.toggle('theme-dark', sessionStorage.getItem('rudra-paper-theme') === 'dark'); } catch {}
const brief = readIdeaBrief(location.hash);
const form = document.querySelector('#idea-form');
form.querySelector('.idea-prefill-note')?.remove();
if (brief) {
  form.elements.namedItem('message').value = brief.message;
  form.elements.namedItem('interest').value = brief.topic;
  const note = document.createElement('p');
  note.className = 'idea-prefill-note'; note.textContent = 'Your starting idea is here. Make it yours before sending.';
  form.querySelector('.idea-form-heading').append(note);
}
const disposeSound = initSound();
const disposePet = initInklingPlay({lenis: null, toSection(id) {document.getElementById(id)?.scrollIntoView({behavior: 'instant'});}});
const disposeContact = initContact();
const events = new AbortController();
window.addEventListener('portfolio:idea-sent', () => {
  if (readIdeaBrief(location.hash)) history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  form.querySelector('.idea-prefill-note')?.remove();
}, {signal: events.signal});
const media = gsap.matchMedia();
media.add('(prefers-reduced-motion: no-preference)', () => {
  gsap.from('.idea-page-nav, .idea-page #contact-title, .idea-page .contact-connect', {y: 18, opacity: 0, duration: .65, stagger: .1, ease: 'power2.out', clearProps: 'transform,opacity'});
});
if (import.meta.hot) import.meta.hot.dispose(() => {events.abort(); media.revert(); disposeContact(); disposePet(); disposeSound(); form.querySelector('.idea-prefill-note')?.remove();});
