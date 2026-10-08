import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

/**
 * The single source of truth for *which* projects exist and *in what order*.
 *
 * The draft filter and the sort used to be duplicated in the homepage grid and
 * in the project route, which meant a change to either could silently put the
 * two out of step — the card order on the homepage disagreeing with the pages
 * that actually got built. One function, both callers.
 */

export type WorkEntry = CollectionEntry<'work'>;

/**
 * Depth at which a card in the homepage stack is fully gone — three cards
 * covering it. Changing this means changing the keyframe stops in
 * StackCard.astro too.
 */
export const STACK_DEPTH_GONE = 3;

/**
 * One viewport of scroll, as a percentage of the work stack's view-timeline.
 *
 * The track is `n + 1` viewports tall (n sticky slots plus a trailing spacer),
 * and a `cover` range spans the subject plus one more viewport — so the whole
 * timeline is `n + 2` viewports of scroll. WorkStack.astro carries the full
 * derivation.
 *
 * Lives here rather than in WorkStack because the hero reads the same timeline
 * to time its own fade, and the two must not drift apart.
 */
export function stackStepPercent(n: number): number {
	return 100 / (n + 2);
}

/**
 * `draft: true` keeps an entry visible in `npm run dev` and out of the real
 * build, so a half-written project can live in the repo without going live.
 */
export async function getWorkEntries(): Promise<WorkEntry[]> {
	const isProduction = import.meta.env.PROD;

	const entries = await getCollection(
		'work',
		({ data }: CollectionEntry<'work'>) => !isProduction || !data.draft,
	);

	// Featured first, then explicit `order`, then newest. Entries without
	// `order` sort behind those that have one rather than colliding at zero.
	return entries.sort((a, b) => {
		if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;

		const ao = a.data.order ?? Number.POSITIVE_INFINITY;
		const bo = b.data.order ?? Number.POSITIVE_INFINITY;
		if (ao !== bo) return ao - bo;

		// `year` is optional; an entry without one sorts oldest rather than NaN.
		return (b.data.year ?? 0) - (a.data.year ?? 0);
	});
}
