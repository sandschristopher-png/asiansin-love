import { test, expect } from '@playwright/test';

test.describe('asiansin.love Visual & Component Verification', () => {

  test('Pricing Page renders tiers, benefits, and AIL Plus branding', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Confirm core membership elements and pricing options exist
    await expect(page.getByText('Membership', { exact: false })).toBeVisible();
    await expect(page.locator('img[alt*=\"AIL Plus\"], img[src*=\"ail-plus.png\"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /upgrade|subscribe|get started|join/i }).first()).toBeVisible();
  });

  test('Auth Navigation displays all required inputs and CTA', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Confirm credential fields and sign in triggers render
    await expect(page.locator('input[type=\"email\"], input[name=\"email\"]')).toBeVisible();
    await expect(page.locator('input[type=\"password\"], input[name=\"password\"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

});
