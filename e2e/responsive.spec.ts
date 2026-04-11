import { test, expect } from '@playwright/test';

test.describe('Responsive design', () => {
	test('landing page works on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('login page works on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/login');
		await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
	});

	test('landing page works on tablet viewport', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
	});
});
