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
 *   ![](/video/clip.mp4)                         → silent looping <video>
 *   ![](https://youtu.be/<id>)                   → lazy 16:9 player, with sound
 *
 *   ![Chamonix | wide](../../assets/work/shot.jpg)
 *                                                → full column width, never
 *                                                  floats; `| wide` is dropped
 *                                                  from the caption
 *
 *   ![Buck Hill](../../assets/work/a.jpg)
 *   ![Mount Hood](../../assets/work/b.jpg)       → side by side, one figure
 *                                                  each, in a .figure-row
 *
 *   ![Buck Hill | wide](../../assets/work/a.jpg)
 *   ![Mount Hood | wide](../../assets/work/b.jpg)
 *                                                → the row spans the column,
 *                                                  never floats, stacks on a
 *                                                  phone; one flag is enough
 *
 * A row is just two or more images on consecutive lines — one paragraph, so
 * no blank line between them. A blank line keeps them stacked. Pair pictures
 * of the same shape: the row's columns are equal width, so a landscape next
 * to a portrait comes out with ragged bottoms.
 *
 * The last of those is the odd one out and the distinction is worth keeping:
 * a self-hosted `.mp4` is *texture* — silent, looping, chromeless, the same
 * treatment as the homepage covers — while a provider URL is something the
 * visitor is being invited to sit and watch, so it keeps its controls and its
 * audio. Use a file for a clip that runs under the prose and a URL for a cut
 * that deserves a play button.
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

import { EMBED_IFRAME_ALLOW, toEmbedUrl } from './video.js';

/** Extensions routed to <video> rather than <img>. Matches the schema's
 *  `coverVideo` pattern — the same two codecs, for the same reason. */
const VIDEO_EXT = /\.(webm|mp4)$/i;

/** `![Caption | wide](…)` — see toFigure. */
const WIDE_FLAG = /\s*\|\s*wide\s*$/i;

function mimeFor(src) {
	return src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
}

/**
 * The images a paragraph holds, or undefined if it holds anything else.
 * Whitespace-only text nodes are ignored: markdown leaves them around an
 * image freely, and between images on consecutive lines, and they say
 * nothing about intent.
 */
function onlyImages(node) {
	const meaningful = (node.children ?? []).filter(
		(child) => !(child.type === 'text' && child.value.trim() === ''),
	);
	const allImages =
		meaningful.length > 0 &&
		meaningful.every((child) => child.type === 'element' && child.tagName === 'img');
	return allImages ? meaningful : undefined;
}

export function inlineFigures() {
	return {
		name: 'inline-figures',
		element: {
			filter: ['p'],
			visit(node, ctx) {
				const imgs = onlyImages(node);
				if (!imgs) return;

				const inRow = imgs.length > 1;
				const figures = imgs.map((img) => toFigure(img, inRow));
				if (figures.some((figure) => !figure)) return;

				/* In a row, `| wide` on any of its images widens the row
				   as a whole; each picture still gets half of it. */
				const wideRow = inRow && imgs.some((img) => WIDE_FLAG.test(img.properties?.alt ?? ''));

				ctx.replaceNode(
					node,
					!inRow
						? figures[0]
						: {
								type: 'element',
								tagName: 'div',
								properties: {
									className: wideRow ? ['figure-row', 'figure-row--wide'] : ['figure-row'],
								},
								children: figures,
							},
				);
			},
		},
	};
}

/** One markdown image → one `<figure>`, or undefined if it has no src.
 *  `inRow`: the flag then belongs to the row (see visit), not the figure. */
function toFigure(img, inRow = false) {
	const props = img.properties ?? {};
	const src = typeof props.src === 'string' ? props.src : '';
	if (!src) return undefined;

	// See the box above: alt slot → caption, title slot → alt text.
	// A trailing `| wide` in the caption slot is a layout flag, not caption
	// text: the figure spans the full prose column and never floats.
	const rawCaption = typeof props.alt === 'string' ? props.alt.trim() : '';
	const wide = !inRow && WIDE_FLAG.test(rawCaption);
	const caption = rawCaption.replace(WIDE_FLAG, '').trim();
	const alt = typeof props.title === 'string' ? props.title : '';

	/* A provider URL, before the file branches: those test the
	   extension, and a watch URL has none to test. Unrecognized
	   hosts fall through to the image branch and are left to the
	   asset pipeline, which fails loudly on a missing file — a
	   better outcome than silently shipping a broken iframe. */
	const embedUrl = /^https?:\/\//i.test(src) ? toEmbedUrl(src) : null;

	const media = embedUrl
		? {
				/* The same lazy 16:9 frame VideoEmbed renders for an
				   entry's `video:` field, and deliberately so — but
				   built by hand here, because a satteri plugin emits
				   HAST and cannot reach for an .astro component.
				   `.figure__video` in global.css carries what the
				   component's scoped `.video` carries.

				   Keep the iframe attributes in step with
				   VideoEmbed.astro; `allow` is shared through
				   EMBED_IFRAME_ALLOW so the longest of them cannot
				   drift on its own. */
				type: 'element',
				tagName: 'div',
				properties: { className: ['figure__video'] },
				children: [
					{
						type: 'element',
						tagName: 'iframe',
						properties: {
							src: embedUrl,
							/* An iframe's accessible name has to come from
							   the markdown, and the caption is the only
							   description an author writes. Falling back to
							   a generic name keeps it from being announced
							   as an unlabelled frame. */
							title: alt || caption || 'Embedded video',
							loading: 'lazy',
							allow: EMBED_IFRAME_ALLOW,
							allowfullscreen: true,
							referrerpolicy: 'strict-origin-when-cross-origin',
						},
						children: [],
					},
				],
			}
		: VIDEO_EXT.test(src)
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
					/* `metadata`, not the covers' `none`: a clip here
					   can float, and text wraps it, so it needs its
					   real shape before it plays. With `none` it sits
					   at the browser's 300×150 default and the copy
					   reflows when it starts. `autoplay` was going to
					   fetch it anyway; this only fetches the header
					   first. */
					preload: 'metadata',
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
					   (32rem ≈ 512px) that is several hundred
					   wasted KB per picture, so the transform is
					   sized here: the image marker forwards every
					   leftover property to `getImage`, and `width`
					   is one it understands. 1024 is 2× the capped
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
					   tokens.css — they describe the same box from
					   two sides. A wide figure fills the column,
					   which tops out near 1024px, so it gets 2× that. */
					width: wide ? 2048 : 1024,
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

	return {
		type: 'element',
		tagName: 'figure',
		properties: { className: wide ? ['figure', 'figure--wide'] : ['figure'] },
		children,
	};
}
