// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	// `www` is the canonical host: it's the one Vercel serves with a valid
	// certificate. The bare apex has a stale Namecheap parking A record
	// alongside Vercel's, which blocks cert issuance, so https://apex fails.
	// Canonical tags, the sitemap, and OG URLs all derive from this — they
	// must point at a host that actually resolves.
	site: 'https://www.jarrettheflin.com',
	integrations: [sitemap()],

	// `output` stays at its default 'static' — every page prerenders.
	// The adapter exists solely so `src/pages/api/agent.ts` can opt out with
	// `export const prerender = false`. Without it the contact agent would be
	// impossible: hiding an email address requires server-side code.
	adapter: vercel(),
});
