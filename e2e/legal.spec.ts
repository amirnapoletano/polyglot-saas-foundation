import { test, expect } from '@playwright/test';

test.describe('Legal pages', () => {
	test('terms page loads', async ({ page }) => {
		await page.goto('/terms');
		await expect(page.locator('h1')).toContainText(/terms/i);
	});

	test('privacy page loads', async ({ page }) => {
		await page.goto('/privacy');
		await expect(page.locator('h1')).toContainText(/privacy/i);
	});
});
