/**
 * Provider URL → privacy-friendly embed URL.
 *
 * Lives here rather than inside VideoEmbed.astro because two callers need the
 * same answer and they must not drift: the component renders the full-length
 * cut from an entry's `video:` field, and the `inline-figures` plugin in
 * figures.js renders a clip dropped mid-write-up. A second copy of this
 * mapping is how one of them quietly keeps embedding youtube.com while the
 * other has moved to youtube-nocookie.com.
 *
 * Returns null for anything unrecognized so each caller can degrade — to a
 * plain link, or to leaving the markdown alone — rather than render a broken
 * iframe.
 *
 * @param {string} raw
 * @returns {string | null}
 */
export function toEmbedUrl(raw) {
	let parsed;
	try {
		parsed = new URL(raw);
	} catch {
		return null;
	}

	const host = parsed.hostname.replace(/^www\./, '');

	// youtu.be/<id>
	if (host === 'youtu.be') {
		const id = parsed.pathname.slice(1);
		return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
	}

	// youtube.com/watch?v=<id> | /embed/<id> | /shorts/<id>
	if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		const id =
			parsed.searchParams.get('v') ??
			parsed.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1];
		return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
	}

	// vimeo.com/<id> | vimeo.com/<id>/<hash> for unlisted videos
	if (host === 'vimeo.com') {
		const [id, hash] = parsed.pathname.split('/').filter(Boolean);
		if (!/^\d+$/.test(id ?? '')) return null;
		return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`;
	}

	// player.vimeo.com/video/<id> — already an embed URL.
	if (host === 'player.vimeo.com') return parsed.toString();

	return null;
}

/** Everything an embed iframe needs beyond its src, shared by both callers. */
export const EMBED_IFRAME_ALLOW =
	'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
