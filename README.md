# Rudra Vaghela — Portfolio

A portfolio modeled on the flow of [NEUV](https://neuv.fr/): a liquid monogram on black, a warm paper grid and staggered headline reveal, a looping project gallery, and dark case studies. It uses Rudra’s monogram, project artwork, and writing.

## Run

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Production build and local preview:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host. No backend or environment variables are required. Google Fonts is the only runtime font dependency; local system fonts provide a fallback.

## Edit the content

- `index.html`: opening, navigation, introduction, project cards, services, and contact.
- `src/projects.js`: project descriptions, technology lists, repository URLs, and optional live-demo URLs.
- `src/assets/projects/`: original SVG cover artwork. These are graphic interpretations of the projects, not product screenshots.
- `src/style.css`: palette, typography, grid, spacing, and mobile breakpoints.
- `src/scroll.js` and `src/motion.js`: smooth navigation, reversible scene timing, reveals, and the desktop return loop.
- `src/gallery.js`: gallery layout measurement, wraparound, dragging, and keyboard navigation.
- `src/fluid.js` and `src/shaders/`: fluid interaction and rendering. The pre-existing physical-resolution logo sampling is preserved.

When adding a project, update its HTML card and its `src/projects.js` entry together. The gallery calculates its count from the cards.

Contact links currently point to the verified GitHub profile. Replace them with a preferred `mailto:` address or social URL when one is available.

## Project sources

Descriptions were reviewed against these public repositories on November 8, 2026:

- [NagarDrishti](https://github.com/24CS105-RUDRA/nagardrishti): frontend traffic analytics prototype, with simulated telemetry. Its live-demo URL comes from the repository's About panel.
- [AI Sales Intelligence](https://github.com/24CS105-RUDRA/AI-SALSE): lead qualification, campaigns, and configurable voice agents, using mock telephony by default.
- [TransitOps](https://github.com/24CS105-RUDRA/transportit): fleet management and dispatch workflows, with seeded data and simulated GPS.
- [Portfolio](https://github.com/24CS105-RUDRA/Rv-Portfolio): this portfolio’s source and creative-development case study.

The website does not claim these prototypes are deployed client engagements.

## Interaction and accessibility

- Wheel and trackpad input drive the opening through the liquid transition, the introduction, and selected work. The desktop wheel wraps between the footer and the opening. Touch and keyboard retain normal vertical scrolling.
- The gallery wraps in both directions. Drag or swipe sideways, use the previous and next buttons, or press the arrow keys while focused on the gallery.
- Case studies have shareable `#project/<slug>` addresses. Browser Back, Escape, and the work button return to the portfolio. Modified clicks on the gallery links still open the repository directly.
- Reduced motion displays a static opening and a regular document layout. Gallery navigation becomes immediate.
- Without WebGL, the static mark follows a paper wipe. Without JavaScript, the sections, native horizontal gallery, and repository links remain available.
- Fluid rendering pauses offscreen or when the tab is hidden and skips simulation passes after the mark has settled.

## Verification

Run `npm run build` to produce the static site, then use `npm run preview` to review it in a browser. Check the opening in both scroll directions, the work navigation and gallery at phone and desktop widths, and the project links with reduced motion on and off.

## Inkling: a roaming troublemaker

Inkling lives on the portfolio itself. There is no game panel. `src/inkling-play.js` manages roaming, hiding, shape changes, provocation, and the takeover; `src/inkling-dust.js` renders the disintegration particles.

- He walks across the viewport, perches on visible artwork and headings, peeks from behind their edges, and dodges the pointer. There are no visible name, pause, hide, or restore panels. His angry form is a rounded puff, with no spiked silhouette.
- Six pokes within the cooling period trigger a randomized two-to-five-impact rampage. Consecutive rampages request different impact counts and start in different sections. He shuffles the section order and chooses visible text, captions, descriptions, or artwork, preferring targets spared in the previous rampage. The same element (including gallery clones) cannot be hit twice in one rampage. Its actual glyph/artwork colours break into windblown dust.
- Original DOM nodes retain their layout boxes. A temporary clipping class hides each target; the restore path removes only Inkling’s own classes and properties and restores previous interactivity.
- **Escape** immediately ends the takeover and returns to the starting scroll position. Normal navigation, deliberate scrolling, leaving the tab, resizing, or changing motion preference also cancels the effect. An uninterrupted sequence repairs itself after a six-second victory lap; a count-scaled hard deadline provides a fallback.
- Reduced motion keeps the expressions and teasing without autonomous roaming, automatic scrolling, jumps, or dust. Keyboard focus prevents dodging.
- `src/inkling-banter.js` contains 200 original short Hinglish lines: corporate jokes, social-media humour, censored slang, and movie-style riffs. A shared history uses all 200 lines before repeating, prioritizes the current mood, and excludes the last reply when starting a fresh cycle. Pokes draw from 168 varied lines before falling back to other unseen replies. Local storage preserves the history across reloads and tabs on the same origin; restricted storage falls back to memory.
- Dust uses one canvas, caps particles at 4,000, and runs its drawing loop only while debris exists. No screenshots, remote assets, chat service, microphone, or backend are required.

Verify six-poke activation, varied impact counts and targets, automatic restoration, Escape during a jump, restored project-link interactivity, mobile bounds, and reduced motion after changing this module.

## Sound effects

`src/sound.js` synthesizes original Web Audio cues for navigation, gallery changes, project entry/exit, theme changes, pet pokes/dodges, anger, dust impacts, and restoration. No audio files or external services are used.

Audio unlocks after a trusted pointer or keyboard interaction. **Sound on/off** is available on the main page and inside case studies; the choice persists in local storage. Muting stops active and scheduled voices immediately. Hidden tabs suspend playback, and the next interaction resumes it. Short envelopes, a low master level, a compressor, per-cue rate limits, and a voice cap keep overlapping effects controlled. Browsers without Web Audio retain the visual experience.

## Background music

`src/music.js` supplies an original 72 BPM ambient soundtrack with four extended chords, soft bass, and sparse synth plucks. It loops on the audio clock with a short scheduling horizon and fades in gently. **Music on/off** is independent of sound effects, appears in case studies too, and remembers its setting. Music begins only after a visitor interaction, stops scheduling when muted or hidden, and restarts on the next interaction after returning to the tab. There are no downloaded songs or third-party music assets.
