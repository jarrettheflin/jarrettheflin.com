## What this is

Jarrett Heflin's personal site and living portfolio. An Astro site: one
scrolling homepage (bio + work grid) plus a generated page per project at
`/work/<slug>`. Deployed to Vercel on push to `main`.

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

**Video presentation is isolated to `src/components/VideoEmbed.astro`.** It
converts Vimeo/YouTube URLs into embeds. Changing strategy (self-hosted files,
looping previews) should touch only that file.

**Site identity and links are in `src/consts.ts`**, not hardcoded in components.
`SITE.url` must stay in sync with `site` in `astro.config.mjs`.

**Dark mode** is `prefers-color-scheme` only, overriding tokens. There is no
theme toggle.

**Client-side JS exists in exactly one place:** the inline script in
`src/components/AgentWidget.astro`, rendered on the homepage only. It is
deliberately vanilla — no React/Vue/Svelte — so one component doesn't put a
framework runtime on every page. Project pages ship zero JS. Don't add a UI
framework for the widget's sake.

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
