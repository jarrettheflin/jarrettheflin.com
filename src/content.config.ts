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
			year: z.number(),
			role: z.string(),
			tags: z.array(z.string()).default([]),
			// Optional so a project can go up before its artwork exists — the card
			// falls back to a typographic tile. Drop an image in src/assets/work/
			// and point at it to upgrade.
			thumbnail: image().optional(),
			// Vimeo or YouTube page/embed URL. Absent for non-video projects.
			video: z.url().optional(),
			// External live link (case study, site, press).
			link: z.url().optional(),
			featured: z.boolean().default(false),
			// Lower numbers sort first; entries without it fall to the back by year.
			order: z.number().optional(),
			draft: z.boolean().default(false),
		}),
});

export const collections = { work };
