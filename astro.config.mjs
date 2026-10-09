// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { inlineFigures } from './src/lib/figures.js';

// https://astro.build/config
export default defineConfig({
	// `www` is the canonical host: it's the one Vercel serves with a valid
	// certificate. The bare apex has a stale Namecheap parking A record
	// alongside Vercel's, which blocks cert issuance, so https://apex fails.
	// Canonical tags, the sitemap, and OG URLs all derive from this — they
	// must point at a host that actually resolves.
	site: 'https://www.jarrettheflin.com',
	integrations: [sitemap()],

	// Captioned inline images and clips inside a project write-up. The plugin
	// documents the authoring rules at length; the short version is that an
	// image alone in a paragraph becomes a <figure>, and its alt slot is the
	// caption. Passing it through `satteri()` — Astro's default processor,
	// named explicitly here so it can take options — rather than the
	// deprecated top-level `markdown.rehypePlugins`.
	markdown: {
		processor: satteri({ hastPlugins: [inlineFigures()] }),
	},

	// The section is called Projects, but it shipped at /work/ first. These
	// keep every already-shared link alive; the adapter turns them into real
	// 301s rather than meta-refresh pages.
	redirects: {
		'/work': '/projects',
		'/work/[...slug]': '/projects/[...slug]',
	},

	// `output` stays at its default 'static' — every page prerenders.
	// The adapter exists solely so `src/pages/api/agent.ts` can opt out with
	// `export const prerender = false`. Without it the contact agent would be
	// impossible: hiding an email address requires server-side code.
	adapter: vercel(),
});
