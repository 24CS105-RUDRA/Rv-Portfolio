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

## Inkling’s Mischief Club

`src/inkling-play.js` owns the optional companion arcade. Open **Dare you ↗** beside Inkling.

- **Catch me:** five catches, a maximum of two mouse dodges per target, and crowned real blobs among decoys. Keyboard focus prevents dodges; touch catches directly.
- **Don’t press:** a six-second self-control challenge with deliberately misleading in-game prompts. Clicking loses; waiting wins.
- **Inkling says:** five instruction puzzles. Only follow commands prefixed with “Inkling says”.
- Shape-shift through six silhouettes, hold/release the pet to squish it, feed stars, or trigger a spinning tantrum. Poking changes the banter; every fourth poke triggers a meltdown.
- Human-versus-Inkling scores persist for the browser session. Closing or hiding the club cancels the round without awarding points. Leaving the tab also cancels timers.
- Reduced motion preserves the games and shape changes while disabling dodges, jumps, spins, and particles. Escape closes the club; hide/show stays available outside the moving targets.

The companion has no chat service, microphone, analytics, or backend. Teasing text is authored locally.
