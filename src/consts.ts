/**
 * Single source of truth for site-wide identity and links.
 * Edit here rather than in components.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SECURITY: never put a contact email (or any secret) in this file.       │
 * │                                                                        │
 * │ Astro frontmatter runs at BUILD time, so anything referenced here gets  │
 * │ baked into the shipped HTML and is readable by any scraper. The contact │
 * │ address lives only in the CONTACT_EMAIL environment variable, read      │
 * │ server-side inside src/pages/api/agent.ts. Visitors reach Jarrett       │
 * │ through the agent widget, which never discloses the address.            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

export const SITE = {
	name: 'Jarrett Heflin',
	/** Appended to page titles. */
	titleSuffix: 'Jarrett Heflin',
	/** Default meta description + OG description. */
	description:
		'Growth marketing and operations. Selected video work and projects.',
	/** Must match `site` in astro.config.mjs. */
	url: 'https://jarrettheflin.com',
	/** Lives in /public. Replace with a real 1200×630 image before launch. */
	ogImage: '/og.png',
} as const;

/**
 * Rendered in the hero and footer.
 *
 * No `mailto:` entry by design — see the security note above. Contact runs
 * through the agent widget instead.
 */
export const LINKS = [
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/jheflin' },
] as const;
