import { test, expect } from '@playwright/test';

test.describe('Error pages', () => {
	test('nonexistent route shows 404 error page', async ({ page }) => {
		await page.goto('/this-route-does-not-exist');
		// SvelteKit renders the +error.svelte component — check for status code text
		await expect(page.locator('text=404')).toBeVisible();
	});

	test('404 page shows "Page not found" message', async ({ page }) => {
		await page.goto('/nonexistent-page');
		await expect(page.getByText(/page not found/i)).toBeVisible();
	});

	test('404 page has a link back to home', async ({ page }) => {
		await page.goto('/does-not-exist');
		await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
	});

	test('404 page has a link to the dashboard', async ({ page }) => {
		await page.goto('/nothing-here');
		await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
	});

	test('Go Home link on 404 page navigates to landing page', async ({ page }) => {
		await page.goto('/no-such-route');
		await page.getByRole('link', { name: /go home/i }).click();
		await expect(page).toHaveURL('/');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('deeply nested nonexistent route shows 404', async ({ page }) => {
		await page.goto('/app/does/not/exist/at/all');
		// Either redirects to login (unauthenticated) or shows 404 — either is acceptable
		const url = page.url();
		const has404 = await page
			.locator('text=404')
			.isVisible()
			.catch(() => false);
		const redirectedToLogin = url.includes('/login');
		expect(has404 || redirectedToLogin).toBe(true);
	});
});
