// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	site: 'https://jarrettheflin.com',
	integrations: [sitemap()],

	// `output` stays at its default 'static' — every page prerenders.
	// The adapter exists solely so `src/pages/api/agent.ts` can opt out with
	// `export const prerender = false`. Without it the contact agent would be
	// impossible: hiding an email address requires server-side code.
	adapter: vercel(),
});
