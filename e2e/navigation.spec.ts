import { test, expect } from '@playwright/test';

test.describe('Landing page — navigation bar', () => {
	test('nav Log in link goes to /login', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /log in/i }).first().click();
		await expect(page).toHaveURL(/\/login/);
	});

	test('nav Get Started link goes to /signup', async ({ page }) => {
		await page.goto('/');
		// The nav "Get Started" button (not the hero CTA)
		await page
			.locator('nav')
			.getByRole('link', { name: /get started/i })
			.click();
		await expect(page).toHaveURL(/\/signup/);
	});
});

test.describe('Landing page — hero section CTAs', () => {
	test('hero Start Building CTA goes to /signup', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /start building/i }).click();
		await expect(page).toHaveURL(/\/signup/);
	});

	test('hero See What\'s Included CTA links to #features anchor', async ({ page }) => {
		await page.goto('/');
		const featuresLink = page.getByRole('link', { name: /see what.s included/i });
		await expect(featuresLink).toBeVisible();
		// Verify it targets the features section on the same page
		const href = await featuresLink.getAttribute('href');
		expect(href).toBe('#features');
	});
});

test.describe('Landing page — footer links', () => {
	test('footer Terms link goes to /terms', async ({ page }) => {
		await page.goto('/');
		await page.locator('footer').getByRole('link', { name: /terms/i }).click();
		await expect(page).toHaveURL(/\/terms/);
		await expect(page.locator('h1')).toContainText(/terms/i);
	});

	test('footer Privacy link goes to /privacy', async ({ page }) => {
		await page.goto('/');
		await page.locator('footer').getByRole('link', { name: /privacy/i }).click();
		await expect(page).toHaveURL(/\/privacy/);
		await expect(page.locator('h1')).toContainText(/privacy/i);
	});
});

test.describe('Landing page — bottom CTA section', () => {
	test('"Get Started Free" CTA goes to /signup', async ({ page }) => {
		await page.goto('/');
		// Scroll to bottom CTA section and click
		await page.getByRole('link', { name: /get started free/i }).click();
		await expect(page).toHaveURL(/\/signup/);
	});
});

test.describe('Landing page — features section', () => {
	test('features section is present and contains expected items', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#features')).toBeVisible();
		await expect(page.locator('text=Authentication').first()).toBeVisible();
		await expect(page.locator('text=Stripe Billing').first()).toBeVisible();
		await expect(page.locator('text=Multi-Org').first()).toBeVisible();
	});

	test('tech stack bar lists key technologies', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('text=SvelteKit 2').first()).toBeVisible();
		await expect(page.locator('text=Supabase').first()).toBeVisible();
		await expect(page.locator('text=Stripe').first()).toBeVisible();
	});
});
