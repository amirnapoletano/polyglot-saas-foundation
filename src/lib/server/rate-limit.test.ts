import { describe, it, expect } from 'vitest';
import { rateLimit, limiters } from './rate-limit';

describe('rateLimit', () => {
	it('allows requests within the limit', () => {
		const config = { max: 3, windowSeconds: 60 };
		const key = `test-allow-${Date.now()}`;

		const r1 = rateLimit(key, config);
		expect(r1.allowed).toBe(true);
		expect(r1.remaining).toBe(2);

		const r2 = rateLimit(key, config);
		expect(r2.allowed).toBe(true);
		expect(r2.remaining).toBe(1);

		const r3 = rateLimit(key, config);
		expect(r3.allowed).toBe(true);
		expect(r3.remaining).toBe(0);
	});

	it('blocks requests over the limit', () => {
		const config = { max: 2, windowSeconds: 60 };
		const key = `test-block-${Date.now()}`;

		rateLimit(key, config);
		rateLimit(key, config);

		const r3 = rateLimit(key, config);
		expect(r3.allowed).toBe(false);
		expect(r3.remaining).toBe(0);
		expect(r3.retryAfter).toBeGreaterThan(0);
	});

	it('uses separate windows per key', () => {
		const config = { max: 1, windowSeconds: 60 };
		const keyA = `test-separate-a-${Date.now()}`;
		const keyB = `test-separate-b-${Date.now()}`;

		const a = rateLimit(keyA, config);
		const b = rateLimit(keyB, config);

		expect(a.allowed).toBe(true);
		expect(b.allowed).toBe(true);
	});

	it('provides sensible retryAfter when blocked', () => {
		const config = { max: 1, windowSeconds: 30 };
		const key = `test-retry-${Date.now()}`;

		rateLimit(key, config);
		const blocked = rateLimit(key, config);

		expect(blocked.retryAfter).toBeGreaterThan(0);
		expect(blocked.retryAfter).toBeLessThanOrEqual(30);
	});
});

describe('limiters', () => {
	it('has all expected presets', () => {
		expect(limiters.auth).toEqual({ max: 10, windowSeconds: 60 });
		expect(limiters.invite).toEqual({ max: 5, windowSeconds: 60 });
		expect(limiters.apiKey).toEqual({ max: 10, windowSeconds: 60 });
		expect(limiters.api).toEqual({ max: 100, windowSeconds: 60 });
	});
});
