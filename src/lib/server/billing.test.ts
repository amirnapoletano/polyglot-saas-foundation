import { describe, it, expect, vi } from 'vitest';
import { getPlanFromPriceId, isSubscriptionActive } from './billing';

// Mock the env import
vi.mock('$env/dynamic/private', () => ({
	env: {
		STRIPE_PRICE_ID: 'price_pro_monthly'
	}
}));

describe('getPlanFromPriceId', () => {
	it('returns free for null price', () => {
		expect(getPlanFromPriceId(null)).toBe('free');
	});

	it('returns pro when price matches STRIPE_PRICE_ID', () => {
		expect(getPlanFromPriceId('price_pro_monthly')).toBe('pro');
	});

	it('returns free for unknown price ids', () => {
		expect(getPlanFromPriceId('price_unknown_xyz')).toBe('free');
	});

	it('returns free for empty string', () => {
		expect(getPlanFromPriceId('')).toBe('free');
	});
});

describe('isSubscriptionActive', () => {
	it('returns true for active status', () => {
		expect(isSubscriptionActive('active')).toBe(true);
	});

	it('returns true for trialing status', () => {
		expect(isSubscriptionActive('trialing')).toBe(true);
	});

	it('returns false for canceled status', () => {
		expect(isSubscriptionActive('canceled')).toBe(false);
	});

	it('returns false for past_due status', () => {
		expect(isSubscriptionActive('past_due')).toBe(false);
	});

	it('returns false for null', () => {
		expect(isSubscriptionActive(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isSubscriptionActive(undefined)).toBe(false);
	});
});
