import { test, expect } from '@playwright/test';

test.describe('asiansin.love Smoke Test Suite', () => {

  test('Landing Page loads with branding and call-to-actions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Asians in Love/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Pricing Page displays tiers, features, and AIL Plus badge', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Membership', { exact: false })).toBeVisible();
    // AIL Plus badge image or heading
    await expect(page.locator('img[alt*="AIL Plus"], img[src*="ail-plus.png"]').first()).toBeVisible();
  });

  test('Login & Signup navigation works correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('button', { name: /create|sign up|join/i })).toBeVisible();
  });

  test('Standards, Terms, and Privacy pages load cleanly', async ({ page }) => {
    for (const path of ['/standards', '/terms', '/privacy']) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

});
