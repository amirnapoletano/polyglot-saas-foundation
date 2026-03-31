import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey } from './api-keys';

describe('generateApiKey', () => {
	it('returns a key starting with pk_live_', () => {
		const { key } = generateApiKey();
		expect(key).toMatch(/^pk_live_/);
	});

	it('returns a prefix that ends with ...', () => {
		const { prefix } = generateApiKey();
		expect(prefix).toMatch(/\.\.\.$/);
		expect(prefix.length).toBe(15); // 12 chars + "..."
	});

	it('returns a valid SHA-256 hash', () => {
		const { hash } = generateApiKey();
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it('generates unique keys each time', () => {
		const a = generateApiKey();
		const b = generateApiKey();
		expect(a.key).not.toBe(b.key);
		expect(a.hash).not.toBe(b.hash);
	});

	it('hash matches the key', () => {
		const { key, hash } = generateApiKey();
		expect(hashApiKey(key)).toBe(hash);
	});
});

describe('hashApiKey', () => {
	it('produces consistent hashes', () => {
		const key = 'pk_live_test123';
		expect(hashApiKey(key)).toBe(hashApiKey(key));
	});

	it('produces different hashes for different keys', () => {
		expect(hashApiKey('key_a')).not.toBe(hashApiKey('key_b'));
	});

	it('returns a 64-char hex string', () => {
		const hash = hashApiKey('any_key');
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});
});
