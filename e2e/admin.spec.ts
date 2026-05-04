import { test, expect } from '@playwright/test';

test.describe('Admin routes — unauthenticated access', () => {
	test('/admin redirects to /login', async ({ page }) => {
		await page.goto('/admin');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('/admin/users redirects to /login', async ({ page }) => {
		await page.goto('/admin/users');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('/admin/organizations redirects to /login', async ({ page }) => {
		await page.goto('/admin/organizations');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});

	test('/admin/feature-flags redirects to /login', async ({ page }) => {
		await page.goto('/admin/feature-flags');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});
});

test.describe('Admin routes — login page after redirect', () => {
	test('login form is shown after admin redirect', async ({ page }) => {
		await page.goto('/admin');
		await page.waitForURL(/\/login/);
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
	});
});
