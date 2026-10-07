import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import {
	AGENT_MODEL,
	SEND_CONTACT_TOOL,
	SYSTEM_PROMPT,
} from '../../lib/agent-prompt';

/**
 * The one on-demand route on the site. Everything else prerenders.
 *
 * This exists so the contact address never reaches the browser: it lives in
 * CONTACT_EMAIL, is read here at request time, and is used only to address an
 * outbound email. It is never returned to the client and never shown to Claude.
 */
export const prerender = false;

/* ── Limits ───────────────────────────────────────────────────────────────────
   This endpoint is public, unauthenticated, and spends money per request, so
   every bound here is a cost control, not just hygiene. They cap the damage of
   any SINGLE request; they do not stop a sustained flood (see RATE LIMITING). */

const MAX_BODY_BYTES = 4096;
const MAX_HISTORY_MESSAGES = 12;
const MAX_CHARS_PER_MESSAGE = 1500;
const MAX_TOOL_ITERATIONS = 2;
/** Short on purpose — the agent should answer in a sentence or two. */
const MAX_OUTPUT_TOKENS = 1024;

/* ── Env ──────────────────────────────────────────────────────────────────── */

function env(name: string): string | undefined {
	// Vercel's Node runtime populates process.env; import.meta.env covers
	// `astro dev` reading from .env.
	return process.env[name] ?? (import.meta.env as Record<string, string>)[name];
}

/* ── Types ────────────────────────────────────────────────────────────────── */

type Role = 'user' | 'assistant';
interface ClientMessage {
	role: Role;
	content: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json',
			// Nothing here should ever be cached by a CDN or browser.
			'cache-control': 'no-store',
		},
	});
}

/**
 * Strip control characters and clamp length.
 *
 * `strict: true` on the tool guarantees the argument *shape*, never its
 * content — the model can still emit whatever text it was fed. These values end
 * up in an email Jarrett opens, so they get scrubbed first.
 */
function clean(value: unknown, maxLength: number): string {
	if (typeof value !== 'string') return '';
	return value
		// Strip C0/C1 controls and DEL, keeping \t and \n so multi-line
		// messages survive intact.
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
		.trim()
		.slice(0, maxLength);
}

/** Escape for safe interpolation into the HTML email body. */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Server-side email check. Deliberately not a full RFC 5322 implementation —
 * it only needs to reject the obviously bogus so Jarrett's reply-to works.
 */
function isPlausibleEmail(value: string): boolean {
	if (value.length < 6 || value.length > 254) return false;
	if (/\s/.test(value)) return false;
	return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(value);
}

/* ── RATE LIMITING ────────────────────────────────────────────────────────────
   Honest note: this map is PER SERVERLESS INSTANCE. Vercel runs many, and cold
   starts reset it, so this is a speed bump against a naive loop — NOT a real
   rate limit. Durable rate limiting needs shared storage (Upstash Redis is the
   straightforward option) and should be added before this link is shared
   widely. The load-bearing control today is the spend limit set in the
   Anthropic Console, which no bug in this file can bypass. */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
	const now = Date.now();
	const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	hits.set(ip, recent);

	// Keep the map from growing without bound on a long-lived instance.
	if (hits.size > 5000) hits.clear();

	return recent.length > MAX_PER_WINDOW;
}

/* ── Route ────────────────────────────────────────────────────────────────── */

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const anthropicKey = env('ANTHROPIC_API_KEY');
	const resendKey = env('RESEND_API_KEY');
	const contactEmail = env('CONTACT_EMAIL');
	const fromAddress = env('AGENT_FROM_EMAIL') ?? 'agent@jarrettheflin.com';

	if (!anthropicKey || !resendKey || !contactEmail) {
		// Log for the operator; stay vague to the client.
		console.error('agent: missing required environment variables');
		return json({ error: 'The agent is not configured right now.' }, 503);
	}

	if (rateLimited(clientAddress ?? 'unknown')) {
		return json(
			{ error: "You've sent a lot of messages — try again a bit later." },
			429,
		);
	}

	/* Validate the request BEFORE spending anything on a model call. */

	const raw = await request.text();
	if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
		return json({ error: 'That message is too long.' }, 413);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return json({ error: 'Malformed request.' }, 400);
	}

	const incoming = (parsed as { messages?: unknown })?.messages;
	if (!Array.isArray(incoming) || incoming.length === 0) {
		return json({ error: 'Malformed request.' }, 400);
	}
	if (incoming.length > MAX_HISTORY_MESSAGES) {
		return json({ error: 'This conversation is too long to continue.' }, 400);
	}

	const messages: ClientMessage[] = [];
	for (const item of incoming) {
		const role = (item as { role?: unknown })?.role;
		const content = clean(
			(item as { content?: unknown })?.content,
			MAX_CHARS_PER_MESSAGE,
		);
		if ((role !== 'user' && role !== 'assistant') || !content) {
			return json({ error: 'Malformed request.' }, 400);
		}
		messages.push({ role, content });
	}
	if (messages.at(-1)?.role !== 'user') {
		return json({ error: 'Malformed request.' }, 400);
	}

	/* Run the agent. */

	const anthropic = new Anthropic({ apiKey: anthropicKey });
	const convo: Anthropic.MessageParam[] = messages.map((m) => ({
		role: m.role,
		content: m.content,
	}));

	let sent = false;

	try {
		for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
			// Haiku 4.5 parameter notes (model-tier specific — verified):
			//  · `output_config.effort` ERRORS on this tier. Do not add it.
			//  · `thinking: {type:'adaptive'}` is 4.6+. Omitting `thinking`
			//    means no thinking here, which is right for a contact bot.
			//  · Prompt caching needs a ≥4096-token prefix on Haiku 4.5; this
			//    system prompt is far shorter, so `cache_control` would be a
			//    silent no-op. Intentionally absent.
			const response = await anthropic.messages.create({
				model: AGENT_MODEL,
				max_tokens: MAX_OUTPUT_TOKENS,
				system: SYSTEM_PROMPT,
				tools: [SEND_CONTACT_TOOL],
				messages: convo,
			});

			const toolUses = response.content.filter(
				(block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
			);

			const text = response.content
				.filter((block): block is Anthropic.TextBlock => block.type === 'text')
				.map((block) => block.text)
				.join('\n')
				.trim();

			if (toolUses.length === 0) {
				return json({
					reply: text || "Sorry — I didn't catch that. Could you rephrase?",
					sent,
				});
			}

			// One email per request, no matter what the model asks for.
			convo.push({ role: 'assistant', content: response.content });
			const results: Anthropic.ToolResultBlockParam[] = [];

			for (const toolUse of toolUses) {
				if (toolUse.name !== SEND_CONTACT_TOOL.name) {
					results.push({
						type: 'tool_result',
						tool_use_id: toolUse.id,
						content: 'Unknown tool.',
						is_error: true,
					});
					continue;
				}
				if (sent) {
					results.push({
						type: 'tool_result',
						tool_use_id: toolUse.id,
						content:
							"A message was already sent in this conversation. Don't send another.",
						is_error: true,
					});
					continue;
				}

				const input = toolUse.input as Record<string, unknown>;
				const visitorName = clean(input.visitor_name, 120);
				const visitorEmail = clean(input.visitor_email, 254).toLowerCase();
				const visitorMessage = clean(input.message, MAX_CHARS_PER_MESSAGE);

				if (!visitorName || !visitorMessage || !isPlausibleEmail(visitorEmail)) {
					results.push({
						type: 'tool_result',
						tool_use_id: toolUse.id,
						content:
							"That didn't go through — the name, email, or message was missing or the email looked invalid. Ask the visitor to confirm their email address.",
						is_error: true,
					});
					continue;
				}

				try {
					const resend = new Resend(resendKey);
					const { error } = await resend.emails.send({
						from: `Jarrett's site agent <${fromAddress}>`,
						to: [contactEmail],
						replyTo: visitorEmail,
						subject: `Website contact: ${visitorName}`,
						text: [
							`${visitorName} <${visitorEmail}> used the agent on jarrettheflin.com.`,
							'',
							visitorMessage,
							'',
							'— Reply directly to this email to reach them.',
						].join('\n'),
						html: `<p><strong>${escapeHtml(visitorName)}</strong> &lt;${escapeHtml(
							visitorEmail,
						)}&gt; used the agent on jarrettheflin.com.</p><p style="white-space:pre-wrap">${escapeHtml(
							visitorMessage,
						)}</p><p style="color:#666">Reply directly to this email to reach them.</p>`,
					});

					if (error) throw new Error(error.message ?? 'Resend rejected the send');

					sent = true;
					results.push({
						type: 'tool_result',
						tool_use_id: toolUse.id,
						content: 'Sent. Confirm to the visitor in one short sentence.',
					});
				} catch (cause) {
					console.error('agent: email send failed', cause);
					results.push({
						type: 'tool_result',
						tool_use_id: toolUse.id,
						content:
							"The email failed to send. Apologise briefly and suggest they reach Jarrett on LinkedIn instead. Don't retry.",
						is_error: true,
					});
				}
			}

			convo.push({ role: 'user', content: results });
		}

		// Ran out of iterations — report what actually happened rather than
		// implying the message went through.
		return json({
			reply: sent
				? "That's sent — Jarrett will get back to you by email."
				: "Sorry, I got stuck there. Could you try again?",
			sent,
		});
	} catch (cause) {
		console.error('agent: request failed', cause);
		return json(
			{
				error:
					'Something went wrong on my end. Try again, or reach Jarrett on LinkedIn.',
			},
			502,
		);
	}
};

/** Anything other than POST is a mistake; say so cheaply. */
export const ALL: APIRoute = () =>
	json({ error: 'Method not allowed.' }, 405);
