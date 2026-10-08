import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			// One or two sentences. Shown on the card and used as the page description.
			blurb: z.string(),
			// Optional: some entries (a long-running personal thread, say) don't
			// sit in a single year, and inventing one would be worse than
			// omitting it. The project page hides the Year row when it's absent.
			year: z.number().optional(),
			role: z.string(),
			tags: z.array(z.string()).default([]),
			// Optional so a project can go up before its artwork exists — the card
			// falls back to a typographic tile. Drop an image in src/assets/work/
			// and point at it to upgrade.
			thumbnail: image().optional(),
			// Vimeo or YouTube page/embed URL. Powers the iframe on the project
			// page. Absent for non-video projects.
			video: z.url().optional(),

			// Silently-looping cover for the homepage stack — a different job
			// from `video`, which is the shareable embed on the detail page.
			//
			// Self-hosted, because Astro's asset pipeline cannot optimize video:
			// drop files in `public/work/` and reference them root-relative.
			// Best codec first — these become <source> elements in order, so put
			// .webm ahead of .mp4.
			//
			// `thumbnail` doubles as the poster frame; there is deliberately no
			// separate poster field. A project with a thumbnail and no
			// coverVideo ships as a still today and gains motion the moment a
			// file lands, with no other edit.
			coverVideo: z
				.array(z.string().regex(/^\/[\w\-./]+\.(webm|mp4)$/))
				.nonempty()
				.optional(),
			// External live link (case study, site, press).
			link: z.url().optional(),
			featured: z.boolean().default(false),
			// Lower numbers sort first; entries without it fall to the back by year.
			order: z.number().optional(),
			draft: z.boolean().default(false),
		}),
});

export const collections = { work };
