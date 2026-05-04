import { test, expect } from '@playwright/test';

test.describe('Onboarding route', () => {
	test('redirects unauthenticated users to /login', async ({ page }) => {
		await page.goto('/onboarding');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('login page is reachable after redirect', async ({ page }) => {
		await page.goto('/onboarding');
		await page.waitForURL(/\/login/);
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
	});

	test('redirect preserves the login page state', async ({ page }) => {
		await page.goto('/onboarding');
		await page.waitForURL(/\/login/);
		// Login form should be functional after redirect
		await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
	});
});
