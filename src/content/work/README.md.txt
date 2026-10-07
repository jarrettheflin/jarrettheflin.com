# Adding a project

Drop a new `.md` file in this folder. The filename becomes the URL:
`spondi-brand-film.md` → `jarrettheflin.com/work/spondi-brand-film/`

Nothing else to edit — the card and the project page generate themselves.

## Frontmatter

```markdown
---
title: Spondi brand film
blurb: One or two sentences. Shows on the card and as the social preview text.
year: 2026
role: Director, Editor
tags: [Video, Brand]
thumbnail: ../../assets/work/spondi-brand-film.jpg  # optional
video: https://vimeo.com/123456789                 # optional
link: https://example.com                          # optional
featured: false
order: 1          # optional; lower sorts first
draft: false      # true = visible in dev, hidden from the real build
---

The write-up goes here, in markdown. Headings, bold, lists, and links all work.
```

### Required
`title`, `blurb`, `year`, `role`

### Optional
- **`thumbnail`** — a path relative to this file, pointing into
  `src/assets/work/`. Astro optimizes and resizes it automatically, so commit
  the full-size export rather than a hand-resized copy. **Leave it out** and the
  card renders a typographic placeholder tile, so a project can go up before its
  stills are cut.
- **`video`** — a Vimeo or YouTube URL in any common form (watch link, share
  link, `youtu.be`, or an unlisted Vimeo link with its hash). It gets converted
  to an embed automatically.
- **`link`** — an external link shown at the bottom of the project page.
- **`tags`** — free-form. Reused values will drive filtering if that gets added.
- **`order`** — manual grid position. Entries without it sort by year, newest
  first, behind any that have it.
- **`draft`** — `true` keeps it visible in `npm run dev` but out of production.

## Sort order

`featured` first, then `order` ascending, then `year` descending.

## Note

This file is named `README.md.txt` on purpose. A plain `.md` here would be
picked up as a project and fail schema validation.
