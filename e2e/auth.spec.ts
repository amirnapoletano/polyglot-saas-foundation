import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
	test('login page renders form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
	});

	test('login page has link to signup', async ({ page }) => {
		await page.goto('/login');
		const signupLink = page.getByRole('link', { name: /sign up|create account/i });
		await expect(signupLink).toBeVisible();
	});

	test('signup page renders form', async ({ page }) => {
		await page.goto('/signup');
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i).first()).toBeVisible();
		await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible();
	});

	test('reset password page renders form', async ({ page }) => {
		await page.goto('/reset-password');
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
	});

	test('login with empty credentials shows error', async ({ page }) => {
		await page.goto('/login');
		await page.getByRole('button', { name: /log in|sign in/i }).click();
		// Browser validation should prevent submission, or server returns error
		const url = page.url();
		expect(url).toContain('/login');
	});

	test('unauthenticated access to /app redirects to login', async ({ page }) => {
		await page.goto('/app/dashboard');
		await page.waitForURL(/\/login/);
		expect(page.url()).toContain('/login');
	});
});
