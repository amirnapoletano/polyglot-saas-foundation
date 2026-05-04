/**
 * Simple in-memory rate limiter.
 * Works out of the box for single-instance deployments and development.
 *
 * For multi-instance production, swap this with @upstash/ratelimit:
 *   import { Ratelimit } from '@upstash/ratelimit';
 *   import { Redis } from '@upstash/redis';
 *   const redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
 *   const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1m') });
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (entry.resetAt <= now) store.delete(key);
		}
	},
	5 * 60 * 1000
);

export interface RateLimitConfig {
	/** Max requests allowed in the window */
	max: number;
	/** Window size in seconds */
	windowSeconds: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfter: number; // seconds until reset (0 if allowed)
}

/**
 * Check and consume a rate limit token.
 * @param key Unique identifier (e.g., IP, user ID, API key ID)
 * @param config Rate limit configuration
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const windowMs = config.windowSeconds * 1000;
	const entry = store.get(key);

	// Window expired or first request — start fresh
	if (!entry || entry.resetAt <= now) {
		const resetAt = now + windowMs;
		store.set(key, { count: 1, resetAt });
		return { allowed: true, remaining: config.max - 1, resetAt, retryAfter: 0 };
	}

	// Within window
	if (entry.count < config.max) {
		entry.count++;
		return {
			allowed: true,
			remaining: config.max - entry.count,
			resetAt: entry.resetAt,
			retryAfter: 0
		};
	}

	// Rate limited
	const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
	return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter };
}

/** Pre-configured limiters for common use cases */
export const limiters = {
	/** Auth endpoints: 10 requests per minute per IP */
	auth: { max: 10, windowSeconds: 60 },
	/** Invite creation: 5 requests per minute per user */
	invite: { max: 5, windowSeconds: 60 },
	/** API key creation: 10 requests per minute per user */
	apiKey: { max: 10, windowSeconds: 60 },
	/** Stripe checkout: 5 requests per minute per IP */
	checkout: { max: 5, windowSeconds: 60 },
	/** Public API: 100 requests per minute per API key */
	api: { max: 100, windowSeconds: 60 }
} as const;

/**
 * Helper to create a 429 response with rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
	return new Response('Too many requests. Please try again later.', {
		status: 429,
		headers: {
			'Retry-After': String(result.retryAfter),
			'X-RateLimit-Limit': '0',
			'X-RateLimit-Remaining': '0',
			'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
		}
	});
}
