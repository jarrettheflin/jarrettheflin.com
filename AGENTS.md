## What this is

Jarrett Heflin's personal site and living portfolio. A static Astro site: one
scrolling homepage (bio + work grid) plus a generated page per project at
`/work/<slug>`. Deployed to Vercel on push to `main`.

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
theme toggle and no client-side JS on the site at all — keep it that way unless
there's a real reason.

## Gotchas

- `z` from `astro:content` is deprecated in Astro 7. Import from `astro/zod`.
- Zod here is v4: use `z.url()`, not the deprecated `z.string().url()`.
- Non-project files in `src/content/work/` must not end in `.md` or the loader
  treats them as entries and fails schema validation.
- `draft: true` hides an entry from `npm run build` but keeps it visible in
  `npm run dev`.

## Verifying

`npx astro check` should report 0 errors, 0 warnings, 0 hints.

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
