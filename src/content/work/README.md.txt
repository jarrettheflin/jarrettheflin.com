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
coverVideo: ['/work/spondi.webm', '/work/spondi.mp4']  # optional
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
- **`coverVideo`** — one or two root-relative paths to self-hosted files in
  `public/work/`, best codec first (`.webm` before `.mp4`). This is the
  **silent looping cover** for the card in the homepage stack — a different job
  from `video`, which is the full-length embed on the project page. Astro can't
  optimize video, which is why these live in `public/` rather than
  `src/assets/`. `thumbnail` doubles as the poster frame, so there's no separate
  poster field: a project with a thumbnail and no `coverVideo` ships as a still
  today and gains motion the moment a file lands, with no other edit and no
  layout shift.

  ### Export spec for a cover

  Name the file by slug (`coach-ai.mp4` for `coach-ai.md`) and drop it in
  `public/work/`.

  - **1920×1080, exactly 16:9.** The card frames at 16:9 with
    `object-fit: contain`, so nothing crops — but anything off-ratio gets
    letterboxed against the card background. The card renders about 960 CSS px
    wide, which is 1920 device px on a Retina screen, so 1080p is what keeps it
    sharp. 1280×720 is acceptable if file size fights you.
  - **Any length that suits the shot** — pick the in/out points for the
    moment, not a fixed duration. Nothing in the code assumes a length; the
    loop just restarts. The real limit is the 3 MB budget below, so a longer
    cut needs a lower bitrate. Cut it to loop without an obvious seam.
  - **No audio track** — stripped, not just muted. The card has no controls, so
    audio on it would be unreachable anyway; sound belongs on the full-length
    embed. (The player is also the reason covers stay silent: without controls
    there is nothing to unmute, and nothing keeps playing after a card scrolls
    out of the stack.)
  - **H.264 High profile**, with **faststart** / "optimize for web" ticked so
    playback starts before the file finishes downloading.
  - **Target 3 MB or less.** The first card autoplays on page load, so this is
    real first-paint weight, and several simultaneous video decodes is the
    biggest performance risk in the homepage design. The mitigation is a content
    budget, not code.
  - A `.webm` (VP9) alongside is optional — roughly 30% smaller — but a single
    `.mp4` is universally supported and rarely worth a second export.

  Any NLE can produce this; no command line needed. If you do have `ffmpeg`:

  ```sh
  ffmpeg -i source.mov -ss 00:00:00 -t 8 -an \
    -vf "scale=1920:-2" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p \
    -movflags +faststart public/work/<slug>.mp4
  ```

  (`-an` is what strips the audio.)

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
