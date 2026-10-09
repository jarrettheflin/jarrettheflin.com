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
		})
			/**
			 * A cover with no poster is a black rectangle wherever the browser
			 * declines to autoplay — which mobile Chrome routinely does, under
			 * Data Saver, Battery Saver, or just its own heuristics. Desktop
			 * autoplays instantly and hides the fault completely, so this is
			 * exactly the kind of thing that ships unnoticed. Two entries did.
			 *
			 * Failing the build is the proportionate response: the fix is to
			 * pull a frame out of the mp4 and point `thumbnail` at it, which
			 * takes a minute, and the alternative is a dead card on the
			 * homepage that nobody on a laptop will ever see.
			 */
			.refine((data) => !data.coverVideo || data.thumbnail, {
				message:
					'An entry with `coverVideo` must also set `thumbnail` — it is the ' +
					'poster frame, and without it the card renders black until autoplay ' +
					'starts. Extract a still from the mp4 into src/assets/work/.',
				path: ['thumbnail'],
			}),
});

export const collections = { work };
