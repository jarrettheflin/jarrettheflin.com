## What this is

Jarrett Heflin's personal site and living portfolio. An Astro site: a homepage
(bio, then a scroll-driven stack of project cards), a flat index at `/work/`,
and a generated page per project at `/work/<slug>`. Deployed to Vercel on push
to `main`.

`/work/` is not just a convenience — it's the keyboard and screen-reader path
to the full list, because a card buried deep in the homepage stack becomes
`visibility: hidden` and can't be reached by tabbing forward. Don't delete it
without replacing that path.

**Almost entirely static.** `output` stays at its default `'static'` and every
page prerenders. There is exactly one on-demand route — `src/pages/api/agent.ts`,
which carries `export const prerender = false` — and the Vercel adapter exists
only to enable it. Keep it that way: a new server route needs a real
justification.

## ⚠️ Contact email must never reach the client

The site has no `mailto:` link and no contact address anywhere in `src/`, by
design. Jarrett's address lives solely in the `CONTACT_EMAIL` environment
variable, read server-side inside `src/pages/api/agent.ts`. Visitors reach him
through the agent widget, which never discloses it.

**Astro frontmatter runs at build time**, so anything a component references is
baked into the shipped HTML and readable by scrapers. Putting the address back
into `src/consts.ts` — or any component — silently defeats the whole design.
It was in `consts.ts` once; git history was rewritten and the GitHub repo
recreated to remove it. Don't reintroduce it.

The regression test is in **Verifying** below. Run it after any change that
touches `consts.ts`, the footer, the hero, or the agent.

## Project conventions

**Adding a project requires no code.** Drop a markdown file in
`src/content/work/` — the grid card and the project page generate themselves.
Schema and field docs: `src/content.config.ts` and
`src/content/work/README.md.txt`.

**All visual decisions live in `src/styles/tokens.css`** as CSS custom
properties — palette, type stacks, type scale, spacing, radii, motion. Components
reference these variables and almost nothing else, so a design change is
contained to that file. Don't hardcode colors or sizes in components.

The homepage values are **measured from a mockup**, not invented:
`02_Projects/Website/04-Content/JarrettHeflin Home mock.png` in Jarrett's vault.
Card width, media inset, text-strip height, the ink colours and the `--t-hero-*`
/ `--t-card-*` sizes all come from sampling it at its 1442px viewport. If you
change them, re-measure rather than eyeball — the scratchpad probes that did the
sampling are reusable, and the rendered page should match the mock within a
pixel or two on every one of those values.

**There is one webfont: Figtree**, self-hosted as a single 20KB variable file at
`public/fonts/figtree-latin-var.woff2`, declared in `global.css` and preloaded in
`Base.astro`. It replaced a pure system stack, so the old "zero network cost"
note no longer holds — but the system stack is still the `font-display: swap`
fallback, so a failed font load degrades to exactly the previous rendering.
`crossorigin` on the preload is required even same-origin; without it the
browser discards the preload and fetches the file twice.

**Video presentation is isolated to `src/components/VideoEmbed.astro`**, which
has two modes. `mode="embed"` (the default) converts a Vimeo/YouTube URL into a
lazy iframe — the `video` frontmatter field, used on project pages.
`mode="cover"` renders a muted, looping, self-hosted `<video>` that fills its
box — the `coverVideo` field, used as card art in the homepage stack, where
eight third-party players would be unshippable. Changing strategy again should
still touch only that file.

**The homepage work stack is scroll-driven CSS with no JavaScript.**
`WorkStack.astro` owns the math and documents it at length; `StackCard.astro`
owns the card and its keyframes. Three things there are load-bearing and easy to
break:

- The track is `(n + 1)` viewports tall — `n` sticky slots plus a trailing
  spacer — so one viewport of scroll equals exactly `100 / (n + 2)` percent of
  timeline progress. **Slot height must equal the viewport height** or every
  range goes out of phase. Drop the spacer and the last card never pins.
- `body` carries `overflow-x: clip`, not `hidden`. `hidden` would make `<body>`
  a scroll container and break both the sticky pinning and the view-timeline.
- The animations are gated on `prefers-reduced-motion: no-preference`
  **positively**, not left to the global kill-switch in `global.css`. That
  switch only governs time-based animations; on a progress-based timeline the
  duration is ignored, so relying on it would leave the effect fully active.
- The hero pins and fades on that same timeline, but it is a *sibling* of the
  stack, so the name doesn't resolve for it on its own. `main { timeline-scope:
  --work-stack }` in `src/pages/index.astro` is what makes it visible, and that
  page also computes the hero's range from `stackStepPercent()` in
  `src/lib/work.ts` — the same helper the cards use, so the two can't drift.
  Delete the `timeline-scope` line and the hero silently stops fading.
- Card height is **derived, not set**: the media is locked to 16:9 at full card
  width, so height is `width * 9/16 + --stack-text-h`. `StackCard.astro` caps
  the width against the height a slot can spare. Every card must come out the
  same height or the peek offsets stop lining up — which is why the text strip
  has a fixed `height` rather than `min-height` on desktop.

**Cover videos are silent and have no controls.** They're exported with the audio
track stripped (`src/content/work/README.md.txt` carries the full spec), so the
card is pure motion and every card stays clickable edge to edge. Sound lives on
the project page's full-length embed, which is a Vimeo/YouTube URL in `video:` —
not a self-hosted file, because a 60-second 1080p cut is 20–30 MB served on every
view.

Two problems this avoids, worth knowing before adding `controls` back:

- A control bar has to clear the card-wide link overlay (`.scard__link::after`)
  or every click lands on the overlay and the controls look dead. That needed a
  `z-index` exception on video cards; it's gone.
- Nothing can re-mute a card once it scrolls out of the stack — audio would keep
  playing from a `visibility: hidden` card, and CSS can't fix it. Silent covers
  make the problem structurally impossible rather than needing a script.

**Site identity and links are in `src/consts.ts`**, not hardcoded in components.
`SITE.url` must stay in sync with `site` in `astro.config.mjs`.

**The site is dark-only**, regardless of the visitor's system setting — Jarrett's
choice. The dark palette is the only one in `tokens.css` (with `color-scheme:
dark` on `:root`); the original light values are kept in a comment there.
There is no theme toggle. `public/favicon.svg` still follows the OS theme, on
purpose: it sits on the browser's tab bar, not the page.

**Client-side JS exists in exactly one place:** the inline script in
`src/components/AgentWidget.astro`, rendered on the homepage only. It is
deliberately vanilla — no React/Vue/Svelte — so one component doesn't put a
framework runtime on every page. Project pages ship zero JS. Don't add a UI
framework for the widget's sake.

That script binds **every** element on the page carrying `[data-agent-open]`,
not just its own orb. That is how the hero's "Get in touch" button opens the chat
without a second script — and it is the reason the mockup's Email link (now "Get in touch") could be
honoured without a `mailto:`. Anything else that should open the agent just
needs the attribute. Focus returns to whichever trigger opened the panel.

**The agent is called Sunny.** The name appears in the panel title, both
`aria-label`s, `GREETING`, and the system prompt in `src/lib/agent-prompt.ts` —
keep them in step, or it will introduce itself as one thing and be labelled
another. Its scope is unchanged: contact routing only, no claims about Jarrett's
background.

**The agent's voice and its tool live in `src/lib/agent-prompt.ts`**, separate
from the request plumbing in the route, so tuning how it talks can't break how
it runs. Its scope is contact routing only: it is explicitly forbidden from
making claims about Jarrett's background, because a wrong claim in front of a
recruiter is a real cost.

## Gotchas

- **Claude model is `claude-haiku-4-5`** (Jarrett's explicit cost choice). This
  tier has constraints the newer models don't, all three of which are easy to
  get wrong:
  - `output_config.effort` **errors** on Haiku 4.5. It isn't ignored.
  - `thinking: {type: 'adaptive'}` is 4.6+. Omit `thinking` entirely.
  - Prompt caching needs a ≥4096-token prefix on this tier. The system prompt
    is far shorter, so `cache_control` would be a silent no-op — don't add it
    and don't expect cache savings.
- **`npm audit` reports 3 high-severity advisories** (`path-to-regexp` ReDoS via
  `@vercel/routing-utils`). `npm audit fix --force` downgrades `@astrojs/vercel`
  to v8, which doesn't support Astro 7 and breaks the build. No clean fix
  exists upstream yet; it's build-time route tooling, not in the request path
  for visitor input. Leave it.
- `z` from `astro:content` is deprecated in Astro 7. Import from `astro/zod`.
- Zod here is v4: use `z.url()`, not the deprecated `z.string().url()`.
- Non-project files in `src/content/work/` must not end in `.md` or the loader
  treats them as entries and fails schema validation.
- `draft: true` hides an entry from `npm run build` but keeps it visible in
  `npm run dev`.

## Verifying

`npx astro check` should report 0 errors, 0 warnings, 0 hints.

**The load-bearing regression test** — the contact address must not be in the
build output. After `npm run build`, all of these must print nothing.

Note the first check reads the address from your local `.env` rather than
hardcoding it. That is deliberate: an earlier version of this file spelled the
address out in the grep pattern, which put it straight back into the repo the
rest of this document tells you to keep it out of. Don't reintroduce a literal.

```sh
set -a; . ./.env; set +a   # loads CONTACT_EMAIL without committing it

# The address itself — checks both the static output and the client bundle.
grep -rilF "$CONTACT_EMAIL" dist/ .vercel/output/static/
# Its local part, in case only the left-hand side got interpolated somewhere.
grep -rilF "${CONTACT_EMAIL%%@*}" dist/ .vercel/output/static/
# Any address at all, obfuscated or not.
grep -ril  "mailto:" dist/ .vercel/output/static/
# Removed at Jarrett's request.
grep -ril  "github.com/jarrettheflin" dist/ .vercel/output/static/
```

`.vercel/output/functions/` is the *server* bundle and is never sent to a
browser — `mailto:` legitimately appears there inside `postal-mime`, a Resend
dependency. Only the client-served paths above matter for this test.

Local agent testing needs a real `.env` (see `.env.example`) and a Resend
sending domain; without them the route returns 503 by design rather than
failing obscurely.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
