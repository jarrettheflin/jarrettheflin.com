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
	/**
	 * Default meta description + OG description. Shows in search results and
	 * link previews, so it carries Jarrett's own hero line rather than a
	 * paraphrase. Keep under ~155 characters or Google truncates it.
	 */
	description:
		'Growth, brand, and product marketing, camera in hand. I write the stories and systems that get products to the right people.',
	/** Must match `site` in astro.config.mjs. */
	url: 'https://www.jarrettheflin.com',
	/**
	 * Social preview image, 1200×630, served from /public.
	 *
	 * `null` until a real one exists — and that matters: pointing at a missing
	 * file is worse than omitting the tag, because several platforms render a
	 * broken or blank card instead of falling back to title + description.
	 * Base.astro only emits the image meta tags when this is set.
	 *
	 * To add one: drop `og.png` in /public and set this to '/og.png'.
	 */
	ogImage: null as string | null,
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
