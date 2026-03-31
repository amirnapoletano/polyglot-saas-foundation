import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
	if (!env.RESEND_API_KEY) return null;
	if (!resendClient) {
		resendClient = new Resend(env.RESEND_API_KEY);
	}
	return resendClient;
}

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	from?: string;
}

/**
 * Send a transactional email via Resend.
 * Silently returns false if RESEND_API_KEY is not configured (dev mode).
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
	const resend = getResend();
	if (!resend) {
		console.log(`[email] RESEND_API_KEY not set — skipping email to ${options.to}: ${options.subject}`);
		return false;
	}

	const from = options.from ?? env.EMAIL_FROM ?? 'Polyglot <noreply@polyglot.dev>';

	try {
		const { error } = await resend.emails.send({
			from,
			to: options.to,
			subject: options.subject,
			html: options.html
		});

		if (error) {
			console.error('[email] Send failed:', error);
			return false;
		}

		return true;
	} catch (err) {
		console.error('[email] Send error:', err);
		return false;
	}
}
