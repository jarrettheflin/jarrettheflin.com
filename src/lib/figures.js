/**
 * Inline figures in project write-ups.
 *
 * Turns a markdown image standing alone in its own paragraph into a
 * `<figure>`, optionally captioned, so a write-up can intermix copy and
 * media without the markdown growing any component syntax. Adding a picture
 * to a project stays a one-line edit to its `.md` file — the same promise
 * `src/content/work/README.md.txt` makes about adding a project at all.
 *
 *   ![](../../assets/work/shot.jpg)              → figure, no caption
 *   ![On set in Simi Valley](../../assets/work/shot.jpg)
 *                                                → figure + <figcaption>
 *   ![](/work/clip.mp4)                          → silent looping <video>
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ The alt slot is the CAPTION, not the alt text.                        │
 * │                                                                       │
 * │ That inverts the markdown norm on purpose: the rule is "no caption    │
 * │ unless one is written", and the alt slot is the only one an author    │
 * │ reaches for without thinking. The title slot carries alt text when a  │
 * │ description distinct from the caption is wanted:                      │
 * │                                                                       │
 * │   ![](shot.jpg "Twelve crew members on a sound stage")                │
 * │                                                                       │
 * │ When a caption is present and no title is given, the img ships with   │
 * │ `alt=""` and the figcaption supplies the accessible description —     │
 * │ the W3C-recommended pattern, and it stops a screen reader announcing  │
 * │ the same sentence twice.                                              │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ## Why a paragraph visitor, and why it runs where it does
 *
 * An image alone on a line parses to `<p><img></p>`. The transform replaces
 * that whole paragraph rather than wrapping the `<img>`, because a `<figure>`
 * nested inside a `<p>` is invalid and browsers close the paragraph early,
 * splitting the element in two.
 *
 * It is a satteri HAST plugin, and the ordering is load-bearing. Astro's own
 * image marker (`createImageMarkerPlugin` in @astrojs/markdown-satteri) runs
 * *after* every user HAST plugin, so the fresh `<img>` emitted here is still
 * picked up and routed through the asset pipeline — optimized, resized, and
 * served with a srcset, exactly as an un-wrapped markdown image would be.
 * Emit anything other than a real `img` element (a raw HTML node, say) and
 * that optimization is silently lost.
 *
 * Paths are resolved by that same pipeline, so the rules are the ordinary
 * Astro ones: a path relative to the markdown file reaches `src/assets/` and
 * gets optimized; a root-relative path reaches `public/` untouched. Video has
 * to be the latter — Astro's asset pipeline cannot optimize video.
 */

/** Extensions routed to <video> rather than <img>. Matches the schema's
 *  `coverVideo` pattern — the same two codecs, for the same reason. */
const VIDEO_EXT = /\.(webm|mp4)$/i;

function mimeFor(src) {
	return src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
}

/**
 * The one element child of a paragraph, or undefined if it holds anything
 * else. Whitespace-only text nodes are ignored: markdown leaves them around
 * an image freely and they say nothing about intent.
 */
function soleElementChild(node) {
	const meaningful = (node.children ?? []).filter(
		(child) => !(child.type === 'text' && child.value.trim() === ''),
	);
	return meaningful.length === 1 && meaningful[0].type === 'element'
		? meaningful[0]
		: undefined;
}

export function inlineFigures() {
	return {
		name: 'inline-figures',
		element: {
			filter: ['p'],
			visit(node, ctx) {
				const img = soleElementChild(node);
				if (!img || img.tagName !== 'img') return;

				const props = img.properties ?? {};
				const src = typeof props.src === 'string' ? props.src : '';
				if (!src) return;

				// See the box above: alt slot → caption, title slot → alt text.
				const caption = typeof props.alt === 'string' ? props.alt.trim() : '';
				const alt = typeof props.title === 'string' ? props.title : '';

				const media = VIDEO_EXT.test(src)
					? {
							type: 'element',
							tagName: 'video',
							/* Silent, chromeless and looping — the convention set by
							   the homepage covers, and for the same reasons
							   (AGENTS.md): no control bar to fight the layout, and
							   nothing that can keep playing once it scrolls away.
							   `muted` + `playsinline` are both required or iOS
							   refuses to autoplay. */
							properties: {
								autoplay: true,
								muted: true,
								loop: true,
								playsinline: true,
								/* As on the homepage covers: `none` keeps a clip
								   partway down a write-up from fetching on load.
								   `autoplay` still wins once the browser decides
								   the element is worth playing. */
								preload: 'none',
								disablepictureinpicture: true,
								tabindex: '-1',
								'aria-label': alt || caption || undefined,
								'aria-hidden': alt || caption ? undefined : 'true',
							},
							children: [
								{
									type: 'element',
									tagName: 'source',
									properties: { src, type: mimeFor(src) },
									children: [],
								},
							],
						}
					: {
							type: 'element',
							tagName: 'img',
							/* Deliberately no class here, and the video above
							   carries none either — CSS reaches both through
							   `.figure > :is(img, video)`. A class on an image
							   survives the asset pipeline twice: Astro's image
							   marker preserves `className` on the node *and*
							   forwards it to `getImage`, which spreads it back
							   as a literal `className=""` attribute beside the
							   real `class`. */
							properties: {
								...props,
								alt,
								/* The title slot was read as alt text above, so
								   drop it rather than let it through as a hover
								   tooltip repeating what alt already says. */
								title: undefined,
								/* Astro renders a plain markdown image at the
								   source's full resolution, because markdown has
								   nowhere to put a size. For a 2400px master in
								   a box that is never wider than --figure-w
								   (42rem ≈ 672px) that is several hundred
								   wasted KB per picture, so the transform is
								   sized here: the image marker forwards every
								   leftover property to `getImage`, and `width`
								   is one it understands. 1344 is 2× the capped
								   box — enough for a Retina screen, and nothing
								   beyond what any display can use.

								   Not a srcset. `widths` would be the better
								   tool, but satteri encodes an array property by
								   dropping its non-string members and
								   space-joining the rest (the hast convention
								   for `className`), so a numeric array arrives
								   as an empty string. One right-sized file is
								   the honest version of what can cross.

								   Keep this in step with --figure-w in
								   global.css — they describe the same box from
								   two sides. */
								width: 1344,
								loading: 'lazy',
								decoding: 'async',
							},
							children: [],
						};

				const children = [media];
				if (caption) {
					children.push({
						type: 'element',
						tagName: 'figcaption',
						properties: { className: ['figure__caption', 'meta'] },
						children: [{ type: 'text', value: caption }],
					});
				}

				ctx.replaceNode(node, {
					type: 'element',
					tagName: 'figure',
					properties: { className: ['figure'] },
					children,
				});
			},
		},
	};
}
