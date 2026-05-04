import { test, expect } from '@playwright/test';

const protectedRoutes = [
	'/app/dashboard',
	'/app/members',
	'/app/activity',
	'/app/settings',
	'/app/settings/mfa',
	'/app/api-keys',
	'/app/files',
	'/app/webhooks',
	'/app/premium',
];

test.describe('App routes — unauthenticated redirect', () => {
	for (const route of protectedRoutes) {
		test(`${route} redirects to /login`, async ({ page }) => {
			await page.goto(route);
			await page.waitForURL(/\/login/);
			expect(page.url()).toContain('/login');
		});
	}
});

test.describe('App routes — login page integrity after redirect', () => {
	test('login form renders after being redirected from /app/dashboard', async ({ page }) => {
		await page.goto('/app/dashboard');
		await page.waitForURL(/\/login/);
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
	});

	test('login page has signup link after redirect', async ({ page }) => {
		await page.goto('/app/members');
		await page.waitForURL(/\/login/);
		await expect(page.getByRole('link', { name: /sign up|create account/i })).toBeVisible();
	});
});
