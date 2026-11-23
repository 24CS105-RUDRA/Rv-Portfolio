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
- `src/scroll.js` and `src/motion.js`: smooth navigation, reversible scene timing, reveals, and the alternating-theme return loop.
- `src/gallery.js`: gallery layout measurement, wraparound, dragging, and keyboard navigation.
- `src/fluid.js` and `src/shaders/`: fluid interaction and rendering. The pre-existing physical-resolution logo sampling is preserved.

When adding a project, update its HTML card and its `src/projects.js` entry together. The gallery calculates its count from the cards.

The main contact section shows public email/telephone links and opens the dedicated `/idea/` page. That page contains the custom idea form, with no Google Forms embed. Public contact details and the FormSubmit AJAX endpoint live in `src/contact-config.js`. FormSubmit delivery requires the recipient's inbox activation; no placeholder recipient is used.

## Project sources

Descriptions were reviewed against these public repositories on November 8, 2026:

- [NagarDrishti](https://github.com/24CS105-RUDRA/nagardrishti): frontend traffic analytics prototype, with simulated telemetry. Its live-demo URL comes from the repository's About panel.
- [AI Sales Intelligence](https://github.com/24CS105-RUDRA/AI-SALSE): lead qualification, campaigns, and configurable voice agents, using mock telephony by default.
- [TransitOps](https://github.com/24CS105-RUDRA/transportit): fleet management and dispatch workflows, with seeded data and simulated GPS.
- [Portfolio](https://github.com/24CS105-RUDRA/Rv-Portfolio): this portfolio’s source and creative-development case study.

The website does not claim these prototypes are deployed client engagements.

## Interaction and accessibility

- Wheel and trackpad input drive the opening through the liquid transition, the introduction, and selected work. At the footer, a short resisted pull (240 accumulated wheel/touch units, capped per event) releases a 1.65-second gathering animation. The single live ink canvas contracts scattered ink into the monogram, then rejoins the actual opening at scroll position zero in the opposite theme. There is no duplicate footer-logo section or eclipse overlay. Touch and keyboard boundary input use the same resistance; a short momentum guard prevents an accidental immediate second transition. Reduced motion retains a regular document layout.
- The gallery wraps in both directions. Drag or swipe sideways, use the previous and next buttons, or press the arrow keys while focused on the gallery.
- Work becomes interactive as its reveal starts. A child's implicit touch-capture handoff does not terminate the gallery drag; only capture loss from the gallery itself ends it. Horizontal/diagonal trackpad gestures are consumed by the gallery before Lenis, while vertical scrolling and pinch zoom remain available. Stable per-project width classes keep all three loop copies the same size, including an odd project count.
- Case studies have shareable `#project/<slug>` addresses. Browser Back, Escape, and the work button return to the portfolio. Modified clicks on the gallery links still open the repository directly.
- Reduced motion displays a static opening and a regular document layout. Gallery navigation becomes immediate.
- Without WebGL, the static mark follows a paper wipe. Without JavaScript, the sections, native horizontal gallery, and repository links remain available.
- Fluid rendering pauses offscreen or when the tab is hidden and skips simulation passes after the mark has settled.

## Verification

Run `npm run build` to produce the static site, then use `npm run preview` to review it in a browser. Check the opening in both scroll directions, the work navigation and gallery at phone and desktop widths, and the project links with reduced motion on and off.

## Inkling: a roaming troublemaker

Inkling lives on the portfolio itself. There is no game panel. `src/inkling-play.js` manages roaming, hiding, shape changes, provocation, and the takeover; `src/inkling-dust.js` renders the disintegration particles.

- He walks across the viewport, perches on visible artwork and headings, peeks from behind their edges, and dodges the pointer. There are no visible name, pause, hide, or restore panels. His angry form is a rounded puff, with no spiked silhouette.
- Six pokes within the cooling period trigger a randomized two-to-four-impact rampage. Consecutive rampages request different impact counts and start in different sections. Targets are complete project cards, the visible gallery, service blocks or the whole service grid, the play poster, workshop portions, or entire large headings. Each plan mixes blocks and larger portions, prefers targets spared in the previous rampage, and excludes overlapping targets and duplicate gallery clones. Public contact details, navigation, and the dedicated form are protected. Its visible backgrounds, borders, artwork and text break into chunks and windblown dust.
- Original DOM nodes retain their layout boxes. A temporary clipping class hides each target; the restore path removes only Inkling’s own classes and properties and restores previous interactivity.
- **Escape** immediately ends the takeover and returns to the starting scroll position. Normal navigation, deliberate scrolling, leaving the tab, resizing, or changing motion preference also cancels the effect. An uninterrupted sequence repairs itself after a six-second victory lap; a count-scaled hard deadline provides a fallback.
- Reduced motion keeps the expressions and teasing without autonomous roaming, automatic scrolling, jumps, or dust. Keyboard focus prevents dodging.
- `src/inkling-banter.js` contains 200 original short Hinglish lines: corporate jokes, social-media humour, censored slang, and movie-style riffs. A shared history uses all 200 lines before repeating, prioritizes the current mood, and excludes the last reply when starting a fresh cycle. Pokes draw from 168 varied lines before falling back to other unseen replies. Local storage preserves the history across reloads and tabs on the same origin; restricted storage falls back to memory.
- Dust uses one canvas, caps particles at 4,000, and runs its drawing loop only while debris exists. No screenshots, remote assets, chat service, microphone, or backend are required.

Verify six-poke activation, varied impact counts and targets, automatic restoration, Escape during a jump, restored project-link interactivity, mobile bounds, and reduced motion after changing this module.

## Sound effects

`src/sound.js` synthesizes original Web Audio cues for navigation, gallery changes, project entry/exit, theme changes, pet pokes/dodges, anger, charging jumps, granular crumbling, dust impacts, and restoration. No audio files or external services are used.

Audio unlocks after a trusted pointer or keyboard interaction. **Sound on/off** is available on the main page and inside case studies; the choice persists in local storage. Muting stops active and scheduled voices immediately. Hidden tabs suspend playback, and the next interaction resumes it. Short envelopes, a low master level, a compressor, per-cue rate limits, and a voice cap keep overlapping effects controlled. Browsers without Web Audio retain the visual experience.

## Background music

`src/music.js` supplies an original ambient soundtrack with four extended chords, soft bass, and sparse synth plucks. Desktop retains 72 BPM and a 0.12 music bus; coarse-pointer devices use 84 BPM, a 0.28 bus, midrange chord voicing, harmonic bass and clearer plucks so phone speakers can reproduce it. The mobile fade-in is 0.55 seconds versus 1.5 on desktop. The existing compressor remains in the signal path and effect volume is unchanged. It loops on the audio clock with a short scheduling horizon and fades in gently. **Music on/off** is independent of sound effects, appears in case studies too, and remembers its setting. Music begins only after a visitor interaction, stops scheduling when muted or hidden, and restarts on the next interaction after returning to the tab. There are no downloaded songs or third-party music assets.

## Additional work, entrance, and sharing

The gallery contains 15 entries: the original four plus 11 project/concept/experience records from the supplied 2024–2026 portfolio document. `src/additional-projects.json` preserves documented status and contribution boundaries. School ERP, ANPR, and CodeOracle have confirmed public repository matches; unmatched entries omit source links. Artwork is original conceptual illustration, not a screenshot of the finished product.

`src/entrance.js` plays a roughly two-second assembled-monogram/liquid entrance once per browser via local storage. Skip or Escape ends it immediately. Reduced-motion visitors and deep links bypass it. Storage restrictions fall back to playing on a fresh visit. Existing scroll animation remains independent of this overlay.

Sharing uses `public/social-preview.png` (1200×630), Open Graph/Twitter metadata, ProfilePage structured data, a canonical URL, a sitemap, robots.txt, and SVG/ICO/PNG/Apple favicon assets. The current canonical host is `https://rv-portfolio-five.vercel.app/`. When a custom domain is selected, update this host in `index.html`, `public/robots.txt`, and `public/sitemap.xml`, then configure the domain in Vercel. Hash-based case studies share the main portfolio’s preview; distinct per-project social cards would require individual page routes.

To regenerate the raster branding assets on macOS with Pillow installed, run `python3 scripts/generate-brand-assets.py`.

## Connected creative motion

`src/creative-motion.js` coordinates the additional motion with the existing scroll, project, and pet controllers:

1. Inkling leaves short-lived footprints; angry movement creates heavier marks.
2. Project transitions shed 18 border fragments that gather at the case-study title.
3. The intro heading’s letters gently follow nearby pointer movement and spring home.
4. The alternating-theme seam uses the live WebGL ink-gathering animation described above; the earlier zooming eclipse was removed.
5. Inkling occasionally borrows a visible intro letter while its neighbours wobble; the letter returns after 3.2 seconds. Escape, theme changes, project navigation, tab hiding, and pet reset also return it. The accessible heading remains intact.
6. The footer stretches slightly against continued scrolling before the ink gathers.
7. Case studies include a technology constellation with keyboard/touch buttons, a role description, and matching feature highlighting. Node drift runs only while the constellation is in view.
8. A capped debris field gathers at the contact words as the existing finale reveals them.
9. Slow pointer movement over the opening creates ripples; fast movement creates a fading liquid wake alongside the existing fluid simulation.
10. Occasional Inkling arrivals drop, squeeze, or emerge from the page’s visible surfaces.

A shared canvas caps these decorative particles at 180 and limits pixel density to 1.5. Its ticker runs only while particles exist and stops in hidden tabs. Reduced motion removes the moving particle effects, theft, magnetic response, ink gathering, elastic stretching, and floating nodes while retaining static technology controls. Cleanup removes generated markup, timers, observers, event handlers, and animation state during development reloads.

The loop gathering state clears on completion, Escape, resize, tab hiding, reduced-motion changes, and development cleanup. WebGL-unavailable browsers use the same live opening container with a fading monogram fallback.

## The Unfinished Machine

The full-width `#workshop` section sits between services and contact. `src/workshop.js` turns explored projects into six kinds of component: register, sensor, logic engine, route switch, wheel, and interface. The collection lives in session storage, is validated against known parts, and does not duplicate components when a project is revisited. The final idea socket always stays empty and links to contact. **See what we made** runs the visitor’s current machine and prints an invitation without requiring a complete collection.

`src/machine-art.js` draws the original SVG machine and exports a self-contained SVG postcard using the actual collected parts. **Keep the postcard** generates the file locally; nothing is uploaded. The root illustration adapts to the site’s theme; exported postcards use fixed cream and ink colours.

Inkling carries souvenirs in a tiny hardhat. At the workshop he fumbles, catches, installs, and celebrates a component. When its socket is offscreen, a visitor-triggered run can use the machine’s intake instead. Repairs stop on Escape, navigation, modal opening, resize, tab hiding, reduced-motion changes, and the ink loop; collected parts remain available. New pickup, clank, squeak, startup, and printer cues use the existing sound toggle, limiter, and voice cap. A running machine’s wheel makes a small escape attempt before returning.

`src/project-notes.js` contains six factual **Under the polish** notebooks. They expose a constraint, the approach, a small process sketch, and the current boundary. They do not invent failed attempts or personal anecdotes absent from the project record.

Motion runs only during a short user-triggered sequence and while the workshop is visible. Reduced motion keeps collection, the static illustration, immediate print output, notes, and postcard export. A cancelled print returns to an idle invitation instead of staying stuck on a loading message.

## Project illustration and motion

All 15 projects have their own original conceptual SVG poster in `src/assets/projects/`. The case study and flying open/close transition use that same static asset. `src/project-art.js` mounts an inline version in each gallery card so CSS can animate the illustration itself. The motion sheets are split into systems, hardware, and experiments; each subject has a distinct sequence rather than a shared orbit overlay. Alternative text describes each scene, and the artwork labels preserve documented prototype/concept statuses.

Live illustrations mount only for visible cards, with a maximum of three across the entire endless gallery. Templates are parsed once per project and cloned with instance-specific SVG IDs. Offscreen, inert, modal, hidden-tab and reduced-motion states remove the inline artwork and retain its static image. During gallery movement, static images render while live artwork pauses; animation resumes once dragging and settling finish. Full-image turbulence/displacement filters, JavaScript depth-tilt handlers, and per-frame image slip were removed. The gallery ticker sleeps while settled and wakes for navigation, dragging and horizontal wheel input. Keyboard navigation, wrapping, and case-study transitions remain available. Kinetic heading writes are deduplicated when their scale stops changing.

## Contact desk

`idea/index.html` is a separate Vite page with its own `src/idea-page.js` entry. `src/contact.js` validates the idea form and posts a name, reply email, topic, and message to the configured HTTPS FormSubmit AJAX endpoint. Set owner-approved public details in `src/contact-config.js`, activate the recipient through FormSubmit's confirmation email, and verify a real submission reaches the inbox. No API secret belongs in this public configuration. The previous automated setup test was rejected with HTTP403, so inbox delivery has not yet been confirmed.

The form only shows its animated paper receipt after an OK response with `success` equal to boolean `true` or string `"true"`. HTTP200 alone and string `"false"` are not success. Failed or timed-out requests preserve the draft; duplicate clicks are blocked; controls lock while a request is in flight; cleanup aborts the request and restores the neutral UI. Name/email validation is native and the idea needs 15 characters after trimming. The local honeypot never produces a receipt. Nothing is written to browser storage.

Contact focus quietly cancels Inkling's takeover and pauses his roaming/engineering until focus leaves the desk. The form is outside all dust targets, the textarea retains native inner scrolling, and reduced motion skips the paper arrival/stamp. Drafts survive theme and loop changes. Contact styling is in `src/contact.css`.

## Inkling steals the button

The main playground is one opt-in encounter, mounted by `src/mischief.js` and styled by `src/mischief.css`. The previous route-ticket, idea-mixer, and server-queue sections were removed. A large “DO NOT PRESS” button starts a short encounter with the existing roaming pet, through `src/inkling-mischief.js`; it does not create a second pet or a game window.

Inkling steals the button label, dodges a mouse at most twice, and then becomes catchable. Touch, keyboard, reduced-motion users, and the visible “Catch Inkling” control can catch him directly. Catching produces a short celebration from the existing capped creative canvas and leaves real work/contact links in the section. Escape, Finish playing, navigation, scrolling, tab hiding, resize, case-study opening, the ink loop, and a 20-second timeout return the page to normal. No scroll lock, external network, score storage, or permanent document damage is involved. Normal roaming, repairs and takeover input are suspended during the encounter; previous machine parts remain collected.

Old route/mixer/lab hashes resolve to `#playground` for previously shared links. The custom form stays on `/idea/`, with public email and phone on both pages. `src/idea-bridge.js` still accepts existing encoded brief links, and the form clears the fragment only after accepted submission. Both HTML entries remain in `vite.config.js`, and the main portfolio keeps its resisted ink loop.

## Large-block angry takeover

`src/inkling-rampage.js` selects complete visual units with stable logical keys. `src/inkling-play.js` computes each candidate’s visible intersection with the viewport and clipping ancestors before choosing a landing point. Large wrappers can be partly offscreen; the impact lands in their visible area. Impact shake, shrinking, desaturation and a clipping wipe leave layout boxes intact. Previous inline transforms, origins, opacity, filters, clip custom properties and interactivity are restored on every exit.

`src/inkling-rage.js` adds a reversible burgundy/ember wash, fractured edges and finite impact rings. Its classes do not change the ink loop’s theme state. Inkling gains a rounded angry silhouette, slanted eyes, brows and a glow. Reduced motion and the dedicated form page keep a mild static expression/tint without destruction or automatic scrolling. Escape, navigation, scrolling, tab hiding and motion changes still cancel the takeover.

The anger event pauses ambient music independently of the effects mute/context state; reset resumes it only when enabled, running and visible. All charge/impact/crumble cues share existing mute, rate limits, compressor and voice cap. Reset stops their tails before the repair jingle begins. There is no continuous rumble loop or strobing flash.

## Name and university search visibility

The homepage now has visible profile text for Rudra Vaghela (also Rudra Raj Vaghela), B.Tech study at CHARUSAT, creative/student development, and openness to freelance projects and work. These facts are reflected in descriptive titles/social metadata and linked WebSite, ProfilePage and Person structured data; the contact page uses ContactPage data. University affiliation describes current study, not an awarded degree. There are no repeated keyword lists or hidden search-only pages.

The preferred host remains `https://rv-portfolio-five.vercel.app/`: the November23,2026 check could not resolve `rudravaghela.in`. Once the custom domain is connected and serving this portfolio over HTTPS, update canonical URLs, structured IDs, social URLs, robots sitemap and sitemap locations together, and configure redirects to the preferred hostname. Do not canonicalise to a domain that is not serving the site.

Owner action: verify the site in Google Search Console, submit `/sitemap.xml`, then inspect and request indexing for the homepage and `/idea/`. Account/domain verification cannot be completed from source code alone. Use the same name and portfolio link on real public profiles such as the linked GitHub account. Search indexing and rankings are controlled by search engines; metadata and query variants do not guarantee a position or inclusion.

Mobile audio resumes on the next trusted interaction from any non-running, non-closed AudioContext state, including interruption by the phone operating system. Music/effect mute preferences and rage ducking remain independent. Playback still requires an initial visitor interaction.
