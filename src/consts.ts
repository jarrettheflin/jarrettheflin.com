/**
 * Single source of truth for site-wide identity and links.
 * Edit here rather than in components.
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

export const CONTACT = {
	email: 'contact@jarrettheflin.com',
} as const;

/** Rendered in the hero and footer. Add or remove freely. */
export const LINKS = [
	{ label: 'Email', href: `mailto:${CONTACT.email}` },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/jheflin' },
	{ label: 'GitHub', href: 'https://github.com/jarrettheflin' },
] as const;
