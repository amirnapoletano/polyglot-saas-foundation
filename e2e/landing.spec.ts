import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
	test('renders hero section with CTAs', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByRole('link', { name: /get started|sign up/i })).toBeVisible();
	});

	test('has correct page title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/polyglot/i);
	});

	test('features section is visible', async ({ page }) => {
		await page.goto('/');
		const features = page.locator('text=Authentication');
		await expect(features.first()).toBeVisible();
	});

	test('navigation links work', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /log in|sign in/i }).first().click();
		await expect(page).toHaveURL(/\/login/);
	});
});
